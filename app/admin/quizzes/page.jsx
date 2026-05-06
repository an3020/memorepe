import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminQuizzesClient from './AdminQuizzesClient'

export const revalidate = 0

export default async function AdminQuizzes({ searchParams }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') redirect('/dashboard')

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Traer todos los quizzes con usuario
  const { data: quizzes } = await admin
    .from('quizzes')
    .select('*, users(username, email)')
    .order('created_at', { ascending: false })

  // Reportes pendientes por quiz
  const { data: reportes } = await admin
    .from('question_reports')
    .select('quiz_id')
    .eq('status', 'pending')

  const reportesMap = {}
  for (const r of reportes || []) {
    reportesMap[r.quiz_id] = (reportesMap[r.quiz_id] || 0) + 1
  }

  const quizzesConStats = (quizzes || []).map(q => ({
    ...q,
    reportes_pendientes: reportesMap[q.id] || 0,
    username: q.users?.username,
    email: q.users?.email,
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ background: '#111', borderBottom: '1px solid #222', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'white' }}>
            memo<span style={{ color: '#059669' }}>repe</span>
            <span style={{ fontSize: '11px', color: '#059669', marginLeft: '8px', background: '#052e16', padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>
          </div>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Dashboard</a>
          <a href="/admin/usuarios" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Usuarios</a>
          <a href="/admin/quizzes" style={{ fontSize: '13px', fontWeight: '500', color: 'white', textDecoration: 'none' }}>Quizzes</a>
          <a href="/admin/reportes" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Reportes</a>
          <a href="/admin/feedback" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Feedback</a>
          <a href="/admin/announcements" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Anuncios</a>
        </div>
        <a href="/dashboard" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>← Volver a Memorepe</a>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: 'white', marginBottom: '4px' }}>Quizzes</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{quizzesConStats.length} quizzes en total</p>
        </div>
        <AdminQuizzesClient quizzes={quizzesConStats} />
      </div>
    </div>
  )
}
