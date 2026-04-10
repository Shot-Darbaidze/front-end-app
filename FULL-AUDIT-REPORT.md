# Full SEO Audit Report -- instruktori.ge

**Date:** 2026-04-10
**Business Type:** Local Service Marketplace -- Driving Instructor Discovery (Georgia)
**Technology Stack:** Next.js (App Router), Vercel, Clerk Auth, Turbopack
**Audit Scope:** https://instruktori.ge (ka + en locales)
**Pages Crawled:** 26 sitemap URLs + dynamic profile pages

---

## Executive Summary

### Overall SEO Health Score: 48 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 61/100 | 13.4 |
| Content Quality | 23% | 42/100 | 9.7 |
| On-Page SEO | 20% | 30/100 | 6.0 |
| Schema / Structured Data | 10% | 45/100 | 4.5 |
| Performance (CWV) | 10% | 45/100 | 4.5 |
| AI Search Readiness | 10% | 62/100 | 6.2 |
| Images | 5% | 35/100 | 1.8 |
| **Total** | **100%** | | **46.1** |

### Top 5 Critical Issues

1. **No canonical tags or hreflang tags** -- Bilingual site with zero language targeting signals. Google cannot associate /ka/ and /en/ as equivalents; both compete for the same queries.
2. **8+ pages share identical title and meta description** -- for-instructors, for-autoschools, all city-exam sub-pages, and all profile pages inherit the generic layout title. Google sees massive duplicate signals.
3. **Instructor/autoschool profile pages missing from sitemap** -- The site's highest-value indexable content (individual profiles with ratings, pricing, schema) is invisible to crawlers via sitemap discovery.
4. **7 content-bearing pages are pure client components** -- city-exam/monitor (34 words SSR), tips, routes, checklist, simulations, progress, and for-autoschools render entirely client-side. Google's initial crawl sees minimal content.
5. **No `lang` attribute on `<html>` element** -- Accessibility violation and missing i18n signal for a bilingual site.

### Top 5 Quick Wins

1. Add `generateMetadata` to instructor and autoschool profile pages (data already fetched server-side)
2. Remove empty `sameAs: []` from Organization schema
3. Change root redirect from 307 to 301 (one-line fix in middleware)
4. Change `/city-exam` redirect from `redirect()` to `permanentRedirect()`
5. Remove `/city-exam` from sitemap (it's a redirect)

---

## 1. Technical SEO -- 61/100

### 1.1 Crawlability (80/100)

**Passing:**
- robots.txt returns 200, correctly blocks /dashboard, /sign-in, /sign-up, /api/, signup flows
- Sitemap at /sitemap.xml returns 200 with 26 URLs
- Middleware correctly excludes /robots.txt and /sitemap.xml from locale redirect
- llms.txt present and well-structured

**Issues:**

| Severity | Issue | Detail |
|----------|-------|--------|
| HIGH | Sitemap lists redirecting URLs | /ka/city-exam and /en/city-exam return 307, should be removed |
| HIGH | No dynamic profile pages in sitemap | Zero /ka/instructors/[id] or /ka/autoschools/[id] URLs. These are the site's primary indexable content |
| MEDIUM | No AI crawler User-Agent blocks | No GPTBot, Claude-Web, PerplexityBot declarations in robots.txt |
| LOW | changefreq: hourly on /find-instructors | Contradicts no-cache headers |

### 1.2 Indexability (38/100) -- CRITICAL

| Severity | Issue | Files Affected |
|----------|-------|---------------|
| CRITICAL | No canonical tags | All pages except /find-instructors |
| CRITICAL | No hreflang tags | All pages -- /ka/ and /en/ versions unlinked |
| CRITICAL | Duplicate titles on 8+ pages | for-instructors, for-autoschools, city-exam/*, instructor profiles, autoschool profiles |
| CRITICAL | Duplicate meta descriptions on 8+ pages | Same pages as above |
| CRITICAL | No generateMetadata on profile pages | src/app/[locale]/instructors/[id]/page.tsx, autoschools/[id]/page.tsx |
| HIGH | No `lang` attribute on `<html>` | src/app/layout.tsx renders `<html>` without lang |
| HIGH | Cache-control: private, no-cache on all pages | Prevents efficient recrawling |

**Root cause:** The locale layout at `src/app/[locale]/layout.tsx` defines a default title/description, but most page files either:
- Have no `generateMetadata` export (instructor/autoschool profiles)
- Are marked `"use client"` which prevents metadata export (for-autoschools, all city-exam sub-pages)

### 1.3 Security Headers (90/100)

**All correctly implemented:**
- HSTS with includeSubDomains and preload
- Comprehensive CSP
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, mic, geo, payment)

**Minor issues:**
- CSP includes `unsafe-eval` and `unsafe-inline` (required by Next.js/Clerk)
- Rate limit headers are hardcoded/fake (x-ratelimit-remaining always 99)

### 1.4 URL Structure & Redirects (60/100)

| Severity | Issue |
|----------|-------|
| HIGH | Root / to /ka redirect uses 307 (temporary) instead of 301 (permanent) |
| HIGH | /city-exam to /city-exam/monitor uses 307 instead of 301 |
| MEDIUM | No www to non-www redirect confirmed |

### 1.5 JavaScript Rendering (40/100) -- CRITICAL

**7 pages are pure `"use client"` components with no SSR content:**

| Page | SSR Word Count | Why Client-Only |
|------|---------------|-----------------|
| city-exam/monitor | 34 | useAuth, useUser, useExamMonitor hooks |
| city-exam/tips | ~239 | useState for category filter |
| city-exam/routes | Low | useState for video state |
| city-exam/checklist | Low | useState for checkbox state |
| city-exam/simulations | Minimal | Placeholder page |
| city-exam/progress | Minimal | Dashboard component |
| for-autoschools | ~279 | useState for FAQ accordion only |

**Impact:** Google's mobile-first indexer will see minimal content on initial crawl. The city-exam/monitor page (the site's most unique feature) renders a loading spinner in SSR.

### 1.6 Core Web Vitals -- Lab Assessment (45/100)

| Metric | Risk | Primary Concern |
|--------|------|-----------------|
| LCP | HIGH | Hero images without priority prop; monitor page renders spinner as initial content |
| INP | MEDIUM | Full-page client components re-render entire tree on state changes |
| CLS | MEDIUM | Navbar mounted state guard; Clerk auth state swap; missing width/height on images |

---

## 2. Content Quality -- 42/100

### 2.1 E-E-A-T Assessment (50/100)

**Experience:** Moderate -- instructor profiles with real ratings and reviews show genuine user engagement
**Expertise:** Low -- no content establishing platform expertise in driving education
**Authoritativeness:** Low -- no social profiles (sameAs empty), no press mentions, no industry affiliations
**Trustworthiness:** Moderate -- HTTPS, privacy policy, terms of service present

### 2.2 Thin Content Detection

| Page | Word Count (SSR) | Verdict |
|------|-----------------|---------|
| city-exam/monitor | 34 | CRITICAL thin |
| find-instructors | 53 | Thin (listing page, acceptable if JS renders results) |
| city-exam/tips | 239 | Borderline (content exists in client JS) |
| for-autoschools | 279 | Borderline |
| Homepage | 260 | Acceptable for marketplace |
| for-instructors | 500 | Acceptable |

### 2.3 Duplicate Content Issues

**Identical title used on 9+ pages:** "Instruktori.ge - marthvis instruqtorebi saqartveloshi"
- for-instructors
- for-autoschools
- city-exam/monitor
- city-exam/tips
- city-exam/routes
- city-exam/checklist
- city-exam/simulations
- city-exam/progress
- All instructor profile pages
- All autoschool profile pages

**Identical meta description** on the same set of pages.

### 2.4 Content Architecture Issues

- H1 tags appear to have concatenation issues (missing spaces between Georgian words)
- No blog or educational content section (/_blog exists but is unpublished)
- City exam content is rich but trapped in client-side rendering
- No FAQ schema on pages that have FAQ sections

---

## 3. On-Page SEO -- 30/100

### 3.1 Title Tags

| Page | Title Status | Issue |
|------|-------------|-------|
| Homepage /ka | Unique | OK |
| Homepage /en | Unique | OK |
| /find-instructors | Unique + dynamic | Good -- varies by instructor_type and max_price |
| /for-instructors | GENERIC | Missing generateMetadata |
| /for-autoschools | GENERIC | "use client" prevents metadata export |
| /city-exam/monitor | GENERIC | "use client" prevents metadata export |
| /city-exam/tips | GENERIC | "use client" prevents metadata export |
| /city-exam/routes | GENERIC | "use client" prevents metadata export |
| /city-exam/checklist | GENERIC | "use client" prevents metadata export |
| /instructors/[id] | GENERIC | Missing generateMetadata despite having all data |
| /autoschools/[id] | GENERIC | Missing generateMetadata despite having all data |

### 3.2 Meta Descriptions

Same pattern as titles -- only homepage and find-instructors have unique descriptions.

### 3.3 Missing On-Page Elements

- No OG images on any page (og:image meta tag absent everywhere)
- No Twitter card images
- No canonical tags (except find-instructors)
- No hreflang tags
- No breadcrumb navigation markup

### 3.4 Internal Linking

- 22 internal links from homepage
- Good navigation structure with city-exam hub sub-navigation
- Missing: cross-links from city-exam content to instructor profiles
- Missing: breadcrumb navigation on profile pages

---

## 4. Schema / Structured Data -- 45/100

### 4.1 Current Implementation

| Page | Schema Type | Status |
|------|------------|--------|
| Homepage | WebSite + Organization | Present, minor issues |
| Instructor profiles | Person | Present but ineffective for rich results |
| Autoschool profiles | DrivingSchool | Present, best-structured but has errors |
| All other pages | None | Missing |

### 4.2 Schema Issues

| Severity | Issue |
|----------|-------|
| HIGH | AggregateRating on Person type does NOT trigger Google rich results -- needs LocalBusiness/Service wrapper |
| HIGH | DrivingSchool aggregateRating is derived from instructor ratings, not actual school reviews (misleading) |
| HIGH | DrivingSchool missing `telephone` (required for LocalBusiness rich results) |
| MEDIUM | Organization logo is bare URL string, should be ImageObject |
| MEDIUM | sameAs is empty array (provides zero value, should be removed or populated) |
| MEDIUM | SearchAction uses legacy EntryPoint wrapper instead of plain URL template |
| MEDIUM | SearchAction is hardcoded to /ka/ locale |
| LOW | No BreadcrumbList on any page |
| LOW | No FAQPage schema (note: Google restricted FAQ rich results to gov/health since Aug 2023) |
| LOW | No VideoObject on city-exam/routes (has YouTube video embeds) |

### 4.3 Missing Schema Opportunities

1. Service + LocalBusiness wrapping for instructor profiles (enables rating rich results)
2. BreadcrumbList on profile and content pages
3. VideoObject on routes page
4. ItemList on find-instructors listing
5. Add telephone, openingHoursSpecification, priceRange to DrivingSchool schema

---

## 5. Performance (CWV) -- 45/100

**Lab-only assessment (no CrUX/PageSpeed API configured)**

| Risk Area | Score | Detail |
|-----------|-------|--------|
| LCP | 35/100 | Hero images lack priority prop; monitor page shows spinner as LCP; no explicit image dimensions |
| INP | 55/100 | Full-page client components with many useState hooks; filter interactions on find-instructors re-render entire list |
| CLS | 50/100 | Navbar mounted state guard; Clerk auth state swap causes layout shift; image dimensions not specified |

**Key performance concerns:**
- 4 font files preloaded on every page (Google Sans Bold, Medium, Regular, SemiBold)
- Clerk JS bundle loaded on every page (~40KB+)
- city-exam/monitor has ~15+ useState variables in single component
- No `next/image` priority prop on above-the-fold images

---

## 6. AI Search Readiness -- 62/100

### 6.1 What's Working

- llms.txt present with clear structure, accurate page list, and bilingual note
- robots.txt allows all crawlers (including AI bots)
- Organization schema provides entity definition
- SearchAction enables discovery of search functionality

### 6.2 Issues

| Severity | Issue |
|----------|-------|
| HIGH | 7 content pages are client-rendered -- AI crawlers may not execute JS |
| HIGH | No passage-level citability markers (no id attributes on sections, no structured data on individual content sections) |
| MEDIUM | llms.txt links only to /ka/ locale, missing /en/ equivalents |
| MEDIUM | No llms-full.txt for detailed content |
| LOW | No structured FAQ content accessible to AI crawlers (client-rendered) |

### 6.3 Platform-Specific Assessment

| Platform | Readiness | Notes |
|----------|-----------|-------|
| Google AI Overviews | LOW | Thin SSR content; no featured snippet optimization |
| ChatGPT Web Search | MEDIUM | llms.txt helps; Organization schema provides entity info |
| Perplexity | MEDIUM | Can parse llms.txt; client-rendered content is a risk |
| Bing Copilot | LOW | No IndexNow integration; 307 redirects confuse Bing |

---

## 7. Images -- 35/100

### 7.1 Issues

| Severity | Issue |
|----------|-------|
| CRITICAL | No OG/social preview images on any page |
| CRITICAL | No Twitter card images |
| HIGH | Homepage uses Unsplash stock photo (not original content) |
| MEDIUM | Only 3 images on homepage (2 logos, 1 stock) -- low visual content |
| MEDIUM | Instructor card images lack explicit width/height in SSR |
| LOW | Logo is SVG (icon.svg) -- fine for favicon but Google prefers raster for Organization schema logo |

---

## Appendix: Site Architecture

### Sitemap URLs (26 total)

```
/ka (homepage) - priority 1.0
/ka/find-instructors - priority 0.9
/ka/for-instructors - priority 0.8
/ka/for-autoschools - priority 0.7
/ka/city-exam - priority 0.9 [REDIRECTS to /monitor]
/ka/city-exam/monitor - priority 0.9
/ka/city-exam/tips - priority 0.6
/ka/city-exam/routes - priority 0.6
/ka/city-exam/checklist - priority 0.6
/ka/city-exam/simulations - priority 0.6
/ka/city-exam/progress - priority 0.5
/ka/privacy-policy - priority 0.3
/ka/terms-of-service - priority 0.3
+ /en/ equivalents of all above
```

### Pages NOT in sitemap (should be)
- /ka/instructors/[id] -- dynamic instructor profiles
- /ka/autoschools/[id] -- dynamic autoschool profiles
- /en/ equivalents of above

### Key Files for Remediation

| File | Issues |
|------|--------|
| src/app/layout.tsx | Missing lang attribute on `<html>` |
| src/app/[locale]/layout.tsx | No canonical, no hreflang, default title cascade |
| src/app/[locale]/instructors/[id]/page.tsx | No generateMetadata, Person schema wrong type |
| src/app/[locale]/autoschools/[id]/page.tsx | No generateMetadata, misleading rating source |
| src/app/[locale]/for-autoschools/page.tsx | "use client" blocks metadata; entire page client-rendered |
| src/app/[locale]/city-exam/monitor/page.tsx | "use client" blocks metadata; 34 words SSR |
| src/app/[locale]/city-exam/tips/page.tsx | "use client" blocks metadata |
| src/app/[locale]/city-exam/routes/page.tsx | "use client" blocks metadata |
| src/app/[locale]/city-exam/checklist/page.tsx | "use client" blocks metadata |
| src/app/sitemap.ts | No dynamic pages, redirecting URL included, identical lastmod |
| src/app/[locale]/page.tsx | Schema issues (SearchAction, Organization) |
| middleware.ts | 307 redirect instead of 301 |
| src/app/[locale]/city-exam/page.tsx | redirect() instead of permanentRedirect() |
