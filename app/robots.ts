import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/perfil', '/crear-quiz', '/onboarding'],
    },
    sitemap: 'https://memorepe.vercel.app/sitemap.xml',
  }
}