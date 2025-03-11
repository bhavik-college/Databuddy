import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.databuddy.cc'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/wp-admin/',
        '/private/',
        '/*.json$',
        '/*.php$',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
} 