import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, slug, updated_at')
    .eq('visibility', 'public')

  const { data: users } = await supabase
    .from('users')
    .select('username, created_at')

  const quizUrls = quizzes?.map(quiz => ({
    url: `https://memorepe.com/quiz/${quiz.id}`,
    lastModified: new Date(quiz.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })) || []

  const quizSlugUrls = quizzes?.filter(q => q.slug).map(quiz => ({
    url: `https://memorepe.com/q/${quiz.slug}`,
    lastModified: new Date(quiz.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  })) || []

  const userUrls = users?.map(user => ({
    url: `https://memorepe.com/usuario/${user.username}`,
    lastModified: new Date(user.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })) || []

  return [
    {
      url: 'https://memorepe.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://memorepe.com/explorar',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://memorepe.com/ayuda',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    ...quizSlugUrls,
    ...quizUrls,
    ...userUrls,
  ]
}