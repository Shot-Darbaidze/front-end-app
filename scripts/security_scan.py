#!/usr/bin/env python3
"""
Frontend Security Scanner
Scans Next.js/React source files for common frontend vulnerabilities.
"""

import os
import re
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

# ── Config ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
MIDDLEWARE = ROOT / "middleware.ts"

EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

# ── Data ─────────────────────────────────────────────────────────────────────

@dataclass
class Finding:
    severity: str
    file: str
    line: int
    rule: str
    detail: str
    snippet: str = ""

findings: list[Finding] = []

# ── Helpers ───────────────────────────────────────────────────────────────────

def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))

def scan_files():
    for path in SRC.rglob("*"):
        if path.suffix in EXTENSIONS and "node_modules" not in path.parts:
            yield path
    if MIDDLEWARE.exists():
        yield MIDDLEWARE

def read_lines(path: Path) -> list[str]:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except Exception:
        return []

def add(severity, path, lineno, rule, detail, snippet=""):
    findings.append(Finding(severity, rel(path), lineno, rule, detail, snippet.strip()))

# ── Rules ─────────────────────────────────────────────────────────────────────

HARDCODED_SECRET_PATTERNS = [
    (r'(secret|password|passwd|token|api_?key|private_?key)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded secret value"),
    (r'sk-[a-zA-Z0-9]{20,}', "Possible API secret key (sk- prefix)"),
    (r'Bearer\s+[a-zA-Z0-9\-_\.]{20,}(?![{$])', "Hardcoded Bearer token"),
]

DANGEROUS_PATTERNS = [
    (r'dangerouslySetInnerHTML\s*=\s*\{', "CRITICAL", "XSS", "dangerouslySetInnerHTML used — verify input is sanitized"),
    (r'\beval\s*\(', "CRITICAL", "CODE_INJECTION", "eval() can execute arbitrary code"),
    (r'innerHTML\s*=', "HIGH", "XSS", "Direct innerHTML assignment — use React rendering instead"),
    (r'document\.write\s*\(', "HIGH", "XSS", "document.write() is XSS-prone"),
    (r'\.html\s*\(', "MEDIUM", "XSS", "jQuery .html() with dynamic content can cause XSS"),
]

SENSITIVE_STORAGE = [
    (r'localStorage\.setItem\s*\([^)]*(?:token|secret|password|auth|key)', "HIGH", "INSECURE_STORAGE", "Sensitive data written to localStorage (persists after browser close)"),
    (r'sessionStorage\.setItem\s*\([^)]*(?:token|secret|password)', "MEDIUM", "INSECURE_STORAGE", "Sensitive data written to sessionStorage"),
]

OPEN_REDIRECT = [
    (r'router\.(push|replace)\s*\(\s*(?:req\.|request\.|params\.|query\.|searchParams\.)[^)]+\)', "HIGH", "OPEN_REDIRECT", "Router redirect uses unvalidated external input"),
    (r'window\.location\s*=\s*(?!["\'`/])', "HIGH", "OPEN_REDIRECT", "window.location set from dynamic value — may allow open redirect"),
]

CONSOLE_LEAKS = [
    (r'console\.log\s*\([^)]*(?:token|password|secret|auth|key|user)', "MEDIUM", "INFO_LEAK", "console.log may expose sensitive data in production"),
]

PUBLIC_ENV_IN_LOGIC = [
    (r'process\.env\.NEXT_PUBLIC_[A-Z_]*(?:SECRET|KEY|TOKEN|PASSWORD)', "HIGH", "ENV_EXPOSURE", "NEXT_PUBLIC_ secret exposed to client bundle"),
]

CORS_CREDENTIALS = [
    (r'credentials\s*:\s*["\']include["\']', "MEDIUM", "CORS", "credentials:include sends cookies cross-origin — ensure CORS origin is locked down"),
]

def check_hardcoded_secrets(path, lines):
    if ".env" in path.name or "test" in path.name.lower() or "spec" in path.name.lower():
        return
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        for pattern, label in HARDCODED_SECRET_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                add("CRITICAL", path, i, "HARDCODED_SECRET", label, line)

def check_dangerous_patterns(path, lines):
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        for pattern, severity, rule, detail in DANGEROUS_PATTERNS:
            if re.search(pattern, line):
                add(severity, path, i, rule, detail, line)

def check_sensitive_storage(path, lines):
    for i, line in enumerate(lines, 1):
        for pattern, severity, rule, detail in SENSITIVE_STORAGE:
            if re.search(pattern, line, re.IGNORECASE):
                add(severity, path, i, rule, detail, line)

def check_open_redirect(path, lines):
    for i, line in enumerate(lines, 1):
        for pattern, severity, rule, detail in OPEN_REDIRECT:
            if re.search(pattern, line):
                add(severity, path, i, rule, detail, line)

def check_console_leaks(path, lines):
    for i, line in enumerate(lines, 1):
        for pattern, severity, rule, detail in CONSOLE_LEAKS:
            if re.search(pattern, line, re.IGNORECASE):
                add(severity, path, i, rule, detail, line)

def check_public_env(path, lines):
    for i, line in enumerate(lines, 1):
        for pattern, severity, rule, detail in PUBLIC_ENV_IN_LOGIC:
            if re.search(pattern, line, re.IGNORECASE):
                add(severity, path, i, rule, detail, line)

def check_cors_credentials(path, lines):
    for i, line in enumerate(lines, 1):
        for pattern, severity, rule, detail in CORS_CREDENTIALS:
            if re.search(pattern, line, re.IGNORECASE):
                add(severity, path, i, rule, detail, line)

def check_unprotected_fetch(path, lines):
    """Flag fetch() calls inside dashboard/book pages that don't pass Authorization header."""
    if "dashboard" not in str(path) and "book" not in str(path):
        return
    full = "\n".join(lines)
    # Find fetch blocks without Authorization
    fetch_calls = list(re.finditer(r'\bfetch\s*\(', full))
    for m in fetch_calls:
        # Grab next 8 lines after fetch(
        start_line = full[:m.start()].count("\n") + 1
        block = full[m.start():m.start() + 400]
        if "Authorization" not in block and "getToken" not in block:
            # Only flag if it looks like it's hitting the internal API
            if re.search(r'API_CONFIG|localhost|\.onrender\.com|/api/', block):
                add("HIGH", path, start_line, "UNAUTH_FETCH",
                    "fetch() to internal API without Authorization header", lines[start_line - 1])

def check_prototype_pollution(path, lines):
    for i, line in enumerate(lines, 1):
        # Object spread from user input without validation
        if re.search(r'\.\.\.\s*(?:req|request|query|params|body|data)\b', line):
            add("LOW", path, i, "PROTOTYPE_POLLUTION",
                "Spreading user-controlled object — ensure no __proto__ or constructor keys", line)

def check_insecure_random(path, lines):
    for i, line in enumerate(lines, 1):
        if re.search(r'Math\.random\s*\(\s*\)', line):
            if re.search(r'(?i)(token|id|secret|key|nonce|csrf)', line):
                add("HIGH", path, i, "WEAK_RANDOM",
                    "Math.random() used for security-sensitive value — use crypto.randomUUID() instead", line)

def check_next_config():
    """Check next.config.ts for security misconfigurations."""
    config = ROOT / "next.config.ts"
    if not config.exists():
        config = ROOT / "next.config.js"
    if not config.exists():
        return
    lines = read_lines(config)
    full = "\n".join(lines)

    if "dangerouslyAllowSVG" in full and "true" in full:
        add("HIGH", config, 0, "NEXT_CONFIG", "dangerouslyAllowSVG:true allows SVG XSS attacks", "")
    if re.search(r'headers\s*\(\s*\)', full) is None:
        # No custom headers function — security headers may be missing
        pass  # covered by middleware already in this project

def check_middleware_coverage():
    """Verify middleware protects expected routes."""
    if not MIDDLEWARE.exists():
        add("CRITICAL", MIDDLEWARE, 0, "NO_MIDDLEWARE", "No middleware.ts found — routes may be unprotected", "")
        return
    lines = read_lines(MIDDLEWARE)
    full = "\n".join(lines)

    if "clerkMiddleware" not in full and "authMiddleware" not in full:
        add("CRITICAL", MIDDLEWARE, 0, "NO_AUTH_MIDDLEWARE", "Middleware exists but no auth middleware found", "")

    if "dashboard" not in full:
        add("HIGH", MIDDLEWARE, 0, "UNPROTECTED_DASHBOARD", "Dashboard route not in middleware protected routes", "")

    if "/book" not in full:
        add("HIGH", MIDDLEWARE, 0, "UNPROTECTED_BOOK", "Booking route not protected by middleware", "")

# ── Run all checks ─────────────────────────────────────────────────────────────

def run():
    print(f"\n🔍 Scanning {SRC} ...\n")
    file_count = 0

    for path in scan_files():
        file_count += 1
        lines = read_lines(path)
        check_hardcoded_secrets(path, lines)
        check_dangerous_patterns(path, lines)
        check_sensitive_storage(path, lines)
        check_open_redirect(path, lines)
        check_console_leaks(path, lines)
        check_public_env(path, lines)
        check_cors_credentials(path, lines)
        check_unprotected_fetch(path, lines)
        check_prototype_pollution(path, lines)
        check_insecure_random(path, lines)

    check_next_config()
    check_middleware_coverage()

    # ── Report ──────────────────────────────────────────────────────────────

    sorted_findings = sorted(findings, key=lambda f: (SEVERITY_ORDER.get(f.severity, 9), f.file, f.line))

    SEV_COLOR = {
        "CRITICAL": "\033[91m",  # red
        "HIGH":     "\033[93m",  # yellow
        "MEDIUM":   "\033[94m",  # blue
        "LOW":      "\033[90m",  # gray
    }
    RESET = "\033[0m"
    BOLD  = "\033[1m"

    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for f in sorted_findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1
        color = SEV_COLOR.get(f.severity, "")
        print(f"{color}{BOLD}[{f.severity}]{RESET} {BOLD}{f.rule}{RESET}")
        print(f"  File : {f.file}:{f.line}")
        print(f"  Info : {f.detail}")
        if f.snippet:
            snippet = f.snippet[:120].replace("\n", " ")
            print(f"  Code : {snippet}")
        print()

    print("─" * 60)
    print(f"Scanned {file_count} files  |  Found {len(sorted_findings)} issues")
    print(
        f"  CRITICAL: {counts['CRITICAL']}  "
        f"HIGH: {counts['HIGH']}  "
        f"MEDIUM: {counts['MEDIUM']}  "
        f"LOW: {counts['LOW']}"
    )

    if counts["CRITICAL"] > 0 or counts["HIGH"] > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    run()
