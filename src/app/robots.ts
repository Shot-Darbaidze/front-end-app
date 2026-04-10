import { MetadataRoute } from 'next'

const privatePages = [
  '/dashboard',
  '/sign-in',
  '/sign-up',
  '/api/',
  '/ka/for-instructors/signup',
  '/ka/for-instructors/invite-signup',
  '/en/for-instructors/signup',
  '/en/for-instructors/invite-signup',
  '/ka/autoschools/apply',
  '/en/autoschools/apply',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePages,
      },
      {
        // Allow AI search crawlers to index public content
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot'],
        allow: '/',
        disallow: privatePages,
      },
    ],
    sitemap: 'https://instruktori.ge/sitemap.xml',
  }
}
