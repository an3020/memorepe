import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, updated_at')
    .eq('visibility', 'public')

  const { data: users } = await supabase
    .from('users')
    .select('username, created_at')

  const quizUrls = quizzes?.map(quiz => ({
    url: `https://memorepe.vercel.app/quiz/${quiz.id}`,
    lastModified: new Date(quiz.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []

  const userUrls = users?.map(user => ({
    url: `https://memorepe.vercel.app/usuario/${user.username}`,
    lastModified: new Date(user.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })) || []

  return [
    {
      url: 'https://memorepe.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://memorepe.vercel.app/explorar',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...quizUrls,
    ...userUrls,
  ]
}