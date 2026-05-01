import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminAnnouncementsClient from './AdminAnnouncementsClient'

const ADMIN_ID = '0bccda9a-a636-45b9-aea9-8580ecffb3b9'

export default async function AdminAnnouncements() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (e) {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) redirect('/dashboard')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminAnnouncementsClient announcements={announcements || []} />
}
