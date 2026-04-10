import { MetadataRoute } from 'next'

const BASE_URL = 'https://instruktori.ge'
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const locales = ['ka', 'en']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { path: '', lastModified: '2026-04-10' },
    { path: '/find-instructors', lastModified: '2026-04-10' },
    { path: '/for-instructors', lastModified: '2026-03-15' },
    { path: '/for-autoschools', lastModified: '2026-03-15' },
    { path: '/city-exam/monitor', lastModified: '2026-04-10' },
    { path: '/city-exam/tips', lastModified: '2026-03-01' },
    { path: '/city-exam/routes', lastModified: '2026-03-01' },
    { path: '/city-exam/checklist', lastModified: '2026-03-01' },
    { path: '/city-exam/progress', lastModified: '2026-03-01' },
    { path: '/privacy-policy', lastModified: '2025-12-01' },
    { path: '/terms-of-service', lastModified: '2025-12-01' },
  ]

  const entries: MetadataRoute.Sitemap = []

  // Static pages
  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: route.lastModified,
        alternates: {
          languages: {
            ka: `${BASE_URL}/ka${route.path}`,
            en: `${BASE_URL}/en${route.path}`,
          },
        },
      })
    }
  }

  // Dynamic instructor profile pages
  try {
    const res = await fetch(`${API_BASE}/api/posts`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const instructors = await res.json()
      const list = Array.isArray(instructors) ? instructors : (instructors.data ?? [])
      for (const inst of list) {
        if (!inst.id) continue
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/instructors/${inst.id}`,
            lastModified: inst.updated_at ?? inst.created_at ?? '2026-04-10',
            alternates: {
              languages: {
                ka: `${BASE_URL}/ka/instructors/${inst.id}`,
                en: `${BASE_URL}/en/instructors/${inst.id}`,
              },
            },
          })
        }
      }
    }
  } catch {
    // Non-critical: sitemap still works with static routes
  }

  // Dynamic autoschool profile pages
  try {
    const res = await fetch(`${API_BASE}/api/autoschools`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const schools = await res.json()
      const list = Array.isArray(schools) ? schools : (schools.data ?? [])
      for (const school of list) {
        if (!school.id) continue
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/autoschools/${school.id}`,
            lastModified: school.updated_at ?? school.created_at ?? '2026-04-10',
            alternates: {
              languages: {
                ka: `${BASE_URL}/ka/autoschools/${school.id}`,
                en: `${BASE_URL}/en/autoschools/${school.id}`,
              },
            },
          })
        }
      }
    }
  } catch {
    // Non-critical: sitemap still works with static routes
  }

  return entries
}
