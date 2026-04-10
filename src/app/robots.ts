import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
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
      ],
    },
    sitemap: 'https://instruktori.ge/sitemap.xml',
  }
}
