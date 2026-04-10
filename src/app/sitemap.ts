import { MetadataRoute } from 'next'

const BASE_URL = 'https://instruktori.ge'
const locales = ['ka', 'en']

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/find-instructors', priority: 0.9, changeFrequency: 'hourly' as const },
    { path: '/for-instructors', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/for-autoschools', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/city-exam', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/city-exam/monitor', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/city-exam/tips', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/city-exam/routes', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/city-exam/checklist', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/city-exam/simulations', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/city-exam/progress', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    }
  }

  return entries
}
