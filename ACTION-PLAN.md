# SEO Action Plan -- instruktori.ge

**Date:** 2026-04-10
**Current Score:** 48/100
**Target Score:** 75/100 (after Critical + High fixes)

---

## Critical Priority (Fix Immediately -- Blocks Indexing)

### 1. Add canonical tags and hreflang to all pages
**Impact:** Indexability +25 points | **Effort:** Medium
**Files:** `src/app/[locale]/layout.tsx`, individual page files

The locale layout's `generateMetadata` must include:
```ts
alternates: {
  canonical: `https://instruktori.ge/${locale}${path}`,
  languages: {
    ka: `https://instruktori.ge/ka${path}`,
    en: `https://instruktori.ge/en${path}`,
    'x-default': `https://instruktori.ge/ka${path}`,
  },
}
```

**Challenge:** The layout's `generateMetadata` doesn't have access to the full path. Options:
- (a) Implement at individual page level (more work but precise)
- (b) Use Next.js middleware to inject headers
- (c) Use `headers()` or `usePathname()` pattern at layout level

### 2. Add generateMetadata to instructor profile pages
**Impact:** On-Page SEO +15 points | **Effort:** Low
**File:** `src/app/[locale]/instructors/[id]/page.tsx`

The page already fetches instructor data server-side. Add:
```ts
export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const post = await fetch(`${baseUrl}/api/posts/${id}`).then(r => r.json());
  const name = buildInstructorName(post);
  const city = extractCityName(post);
  return {
    title: locale === 'ka'
      ? `${name} - marthvis instruqtori ${city}`
      : `${name} - Driving Instructor in ${city}`,
    description: /* dynamic based on price, transmission, rating */,
    alternates: { canonical: `/${locale}/instructors/${id}` },
  };
}
```

### 3. Add generateMetadata to autoschool profile pages
**Impact:** On-Page SEO +10 points | **Effort:** Low
**File:** `src/app/[locale]/autoschools/[id]/page.tsx`

Same pattern as above. The school data is already fetched.

### 4. Convert city-exam pages to server-first architecture
**Impact:** JS Rendering +30 points, Content +15 points | **Effort:** High
**Files:** All `src/app/[locale]/city-exam/*.tsx` pages

**Pattern:** Split each page into:
- Server component wrapper (renders H1, description, static content, metadata, schema)
- Client component child (handles interactive state only)

**Priority order:**
1. `city-exam/monitor/page.tsx` -- highest impact (34 words SSR currently)
2. `city-exam/tips/page.tsx` -- rich content trapped in client
3. `city-exam/routes/page.tsx` -- has video content for schema
4. `city-exam/checklist/page.tsx`
5. `for-autoschools/page.tsx` -- only needs FAQ to be client

### 5. Add instructor and autoschool profiles to sitemap
**Impact:** Crawlability +20 points | **Effort:** Medium
**File:** `src/app/sitemap.ts`

Convert `sitemap()` to async, fetch approved profile IDs from the API:
```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes (existing)...

  // Dynamic instructor profiles
  const instructorsRes = await fetch(`${API_URL}/api/posts?limit=1000`);
  const instructors = await instructorsRes.json();
  for (const locale of locales) {
    for (const inst of instructors) {
      entries.push({
        url: `${BASE_URL}/${locale}/instructors/${inst.id}`,
        lastModified: inst.updated_at || new Date(),
        priority: 0.8,
      });
    }
  }

  // Dynamic autoschool profiles (same pattern)...
}
```

### 6. Add `lang` attribute to `<html>` element
**Impact:** Accessibility + Indexability | **Effort:** Low
**File:** `src/app/layout.tsx` or `src/app/[locale]/layout.tsx`

Move `<html>` rendering from root layout to locale layout so `lang={locale}` can be set dynamically:
```tsx
// src/app/[locale]/layout.tsx
<html lang={locale} suppressHydrationWarning>
```

---

## High Priority (Fix Within 1-2 Weeks)

### 7. Add unique titles and descriptions to remaining pages
**Impact:** On-Page SEO +10 points | **Effort:** Medium
**Files:** `for-instructors/page.tsx`, `for-autoschools/page.tsx`, all city-exam pages

For pages currently marked `"use client"`, add a `layout.tsx` in the same directory that exports metadata:
```ts
// src/app/[locale]/city-exam/tips/layout.tsx
export const metadata: Metadata = {
  title: 'Tips for Passing the City Driving Exam',
  description: 'Expert tips and strategies...',
};
```

### 8. Fix redirect status codes (307 -> 301)
**Impact:** URL Structure | **Effort:** Low
**Files:**
- `middleware.ts` -- change `NextResponse.redirect(url)` to `NextResponse.redirect(url, { status: 301 })`
- `src/app/[locale]/city-exam/page.tsx` -- change `redirect()` to `permanentRedirect()`

### 9. Fix sitemap issues
**Impact:** Crawlability | **Effort:** Low
**File:** `src/app/sitemap.ts`

- Remove `/city-exam` entry (it redirects to /city-exam/monitor)
- Replace `new Date()` with actual lastmod dates for static pages
- Remove `changeFrequency` and `priority` (ignored by Google)

### 10. Add OG images
**Impact:** Images + Social sharing | **Effort:** Medium
**Options:**
- Create a default OG image at `public/og-default.png` (1200x630)
- Add to layout metadata: `openGraph: { images: ['/og-default.png'] }`
- For profile pages, generate dynamic OG images using Next.js `opengraph-image.tsx`

### 11. Fix instructor schema type
**Impact:** Schema +15 points, enables rich results | **Effort:** Medium
**File:** `src/app/[locale]/instructors/[id]/page.tsx`

Replace `@type: 'Person'` with Service + LocalBusiness structure:
```json
{
  "@type": "Service",
  "serviceType": "Driving Instruction",
  "provider": {
    "@type": "LocalBusiness",
    "name": "[Instructor Name]",
    "aggregateRating": { ... }
  }
}
```

### 12. Fix DrivingSchool schema
**Impact:** Schema quality | **Effort:** Medium
**File:** `src/app/[locale]/autoschools/[id]/page.tsx`

- Add `telephone` property (required for LocalBusiness rich results)
- Add `openingHoursSpecification` from existing working_hours data
- Fix misleading aggregateRating (should be school-specific reviews, not instructor averages)
- Add `priceRange` from package pricing

---

## Medium Priority (Fix Within 1 Month)

### 13. Add BreadcrumbList schema
**Files:** Instructor profiles, autoschool profiles, city-exam pages
**Pattern:** `Home > Find Instructors > [Name]`

### 14. Fix Organization schema
**File:** `src/app/[locale]/page.tsx`
- Remove empty `sameAs: []` or populate with social URLs
- Upgrade `logo` to ImageObject format
- Add `@id` for linked data

### 15. Fix WebSite SearchAction
**File:** `src/app/[locale]/page.tsx`
- Remove EntryPoint wrapper from target
- Make locale-aware or use root URL

### 16. Set appropriate cache headers for marketing pages
**File:** `middleware.ts` or `next.config.js`
- Static pages (homepage, for-instructors, for-autoschools) should have `s-maxage` for CDN caching

### 17. Add noindex to placeholder pages
**File:** `src/app/[locale]/city-exam/simulations/page.tsx`
- Add `<meta name="robots" content="noindex">` until content is ready

### 18. Add VideoObject schema to routes page
**File:** `src/app/[locale]/city-exam/routes/page.tsx`
- YouTube embeds should have corresponding VideoObject JSON-LD

---

## Low Priority (Backlog)

### 19. Implement IndexNow protocol
Submit new/updated profile URLs to Bing/Yandex in real-time.

### 20. Add AI crawler User-Agent blocks to robots.txt
Explicit policy for GPTBot, Claude-Web, PerplexityBot, Google-Extended.

### 21. Create llms-full.txt
Extended version with more content details for AI crawlers.

### 22. Remove legacy/fake headers
- Remove `X-XSS-Protection` (no-op in modern browsers)
- Remove or implement real rate limiting (currently hardcoded)

### 23. Add ItemList schema to find-instructors
Enable carousel rich results for instructor/school listings.

### 24. Optimize font loading
Consider reducing from 4 preloaded font weights to 2 (Regular + Bold).

### 25. Create blog/educational content
Publish content from the unused `/_blog` route to build E-E-A-T signals.

---

## Implementation Roadmap

### Week 1 (Critical)
- [ ] Items 1-3: Canonical, hreflang, profile metadata
- [ ] Item 6: `lang` attribute
- [ ] Item 8: Fix redirect status codes
- [ ] Item 9: Fix sitemap issues

### Week 2 (High)
- [ ] Item 4: Convert city-exam pages to server-first (start with monitor)
- [ ] Item 5: Add dynamic profiles to sitemap
- [ ] Item 7: Unique titles for remaining pages
- [ ] Item 10: Add OG images

### Week 3-4 (High continued)
- [ ] Items 11-12: Fix schema types
- [ ] Item 4 continued: Remaining page conversions

### Month 2 (Medium)
- [ ] Items 13-18: Schema improvements, caching, placeholders

### Ongoing (Low)
- [ ] Items 19-25: IndexNow, AI optimization, content strategy

---

## Expected Score After Full Implementation

| Category | Current | After Critical+High | After All |
|----------|---------|---------------------|-----------|
| Technical SEO | 61 | 80 | 88 |
| Content Quality | 42 | 60 | 72 |
| On-Page SEO | 30 | 70 | 82 |
| Schema | 45 | 70 | 82 |
| Performance | 45 | 55 | 65 |
| AI Search | 62 | 72 | 80 |
| Images | 35 | 55 | 65 |
| **Overall** | **48** | **68** | **78** |
