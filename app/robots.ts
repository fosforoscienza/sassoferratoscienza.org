import type { MetadataRoute } from 'next'

const SITE = 'https://sassoferratoscienza.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/login', '/conferma/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
