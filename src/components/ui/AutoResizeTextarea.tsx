"use client";

import { ClipboardEvent, FormEvent, TextareaHTMLAttributes, useEffect, useRef } from "react";
import { Bold, Italic, Strikethrough, CornerDownLeft } from "lucide-react";

interface AutoResizeTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  value: string;
  minRows?: number;
  wrapperClassName?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(text: string): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function stripMarkdownMarkers(text: string): string {
  return text
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/\*([^*]+?)\*/g, "$1")
    .replace(/_([^_]+?)_/g, "$1")
    .replace(/~([^~]+?)~/g, "$1");
}

function markdownToInlineHtml(text: string): string {
  const escaped = escapeHtml(normalizeText(text));
  return escaped
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+?)_/g, "<em>$1</em>")
    .replace(/~([^~]+?)~/g, "<s>$1</s>")
    .replace(/\n/g, "<br>");
}

function plainTextToHtml(text: string): string {
  return escapeHtml(normalizeText(text)).replace(/\n/g, "<br>");
}

function isProbablyHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function htmlToInlineRichHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(normalizeText(node.textContent ?? ""));
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const content = Array.from(el.childNodes).map(walk).join("");

    if (tag === "br") return "<br>";
    if (tag === "strong" || tag === "b") return `<strong>${content}</strong>`;
    if (tag === "em" || tag === "i") return `<em>${content}</em>`;
    if (tag === "s" || tag === "strike" || tag === "del") return `<s>${content}</s>`;
    if (tag === "li") return `• ${content}<br>`;
    if (tag === "ul" || tag === "ol") return content;
    if (
      tag === "p" ||
      tag === "div" ||
      tag === "section" ||
      tag === "article" ||
      tag === "blockquote" ||
      tag === "header" ||
      tag === "footer" ||
      tag === "h1" ||
      tag === "h2" ||
      tag === "h3" ||
      tag === "h4" ||
      tag === "h5" ||
      tag === "h6"
    ) {
      return `${content}<br>`;
    }

    return content;
  };

  return Array.from(doc.body.childNodes)
    .map(walk)
    .join("")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/(<br>\s*)+$/g, "");
}

function toEditorHtml(value: string): string {
  if (!value) return "";
  if (isProbablyHtml(value)) return htmlToInlineRichHtml(value);
  return markdownToInlineHtml(value);
}

const TOOLBAR = [
  { command: "bold", Icon: Bold, title: "Bold" },
  { command: "italic", Icon: Italic, title: "Italic" },
  { command: "strikeThrough", Icon: Strikethrough, title: "Strikethrough" },
] as const;

/**
 * WYSIWYG text editor with lightweight formatting toolbar.
 * Produces sanitized HTML (<strong>, <em>, <s>, <br>) as value.
 */
export default function AutoResizeTextarea({
  value,
  onChange,
  minRows = 3,
  disabled,
  className,
  wrapperClassName,
  onPaste,
  placeholder,
  name,
  id,
}: AutoResizeTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedValue = useRef<string>("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const nextHtml = toEditorHtml(value);
    if (nextHtml === lastSyncedValue.current) return;

    const isFocused = document.activeElement === el;
    if (!isFocused) {
      el.innerHTML = nextHtml;
      lastSyncedValue.current = nextHtml;
    }
  }, [value]);

  const emitEditorValue = () => {
    const el = editorRef.current;
    if (!el || !onChange) return;
    const cleanedHtml = htmlToInlineRichHtml(el.innerHTML);
    lastSyncedValue.current = cleanedHtml;
    onChange({ target: { value: cleanedHtml } } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const runCommand = (command: "bold" | "italic" | "strikeThrough" | "insertLineBreak") => {
    if (disabled) return;
    editorRef.current?.focus();
    if (command === "insertLineBreak") {
      document.execCommand("insertHTML", false, "<br>");
    } else {
      document.execCommand(command, false);
    }
    emitEditorValue();
  };

  const handleEditorInput = (_e: FormEvent<HTMLDivElement>) => {
    emitEditorValue();
  };

  const handleEditorPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    onPaste?.(e as unknown as ClipboardEvent<HTMLTextAreaElement>);
    if (e.defaultPrevented || disabled) return;

    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    const pasteHtml = html
      ? htmlToInlineRichHtml(html)
      : plainTextToHtml(stripMarkdownMarkers(plain));

    e.preventDefault();
    document.execCommand("insertHTML", false, pasteHtml);
    emitEditorValue();
  };

  const editorMinHeightPx = Math.max(72, minRows * 24);

  return (
    <div
      className={`w-full rounded-xl border border-gray-200 bg-gray-50 transition-all overflow-hidden
        focus-within:bg-white focus-within:border-[#F03D3D] focus-within:ring-2 focus-within:ring-[#F03D3D]/20
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        ${wrapperClassName ?? ""}`}
    >
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-gray-100">
        {TOOLBAR.map(({ command, Icon, title }) => (
          <button
            key={command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              runCommand(command);
            }}
            disabled={disabled}
            title={title}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900 disabled:pointer-events-none"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            runCommand("insertLineBreak");
          }}
          disabled={disabled}
          title="Insert new line"
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900 disabled:pointer-events-none"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onPaste={handleEditorPaste}
        data-placeholder={placeholder ?? ""}
        className={`w-full px-4 py-2.5 bg-transparent outline-none text-sm leading-6 disabled:cursor-not-allowed
          empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none
          ${className ?? ""}`}
        style={{ minHeight: `${editorMinHeightPx}px`, whiteSpace: "pre-wrap" }}
      />

      <textarea
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={value}
        className="hidden"
      />
    </div>
  );
}
