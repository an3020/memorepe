import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AdminVerQuiz({ params }) {
  const { id } = await params
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

  const { data: quiz } = await admin
    .from('quizzes')
    .select('*, users(username, email)')
    .eq('id', id)
    .single()

  if (!quiz) redirect('/admin/quizzes')

  const { data: questions } = await admin
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', id)
    .order('order')

  const { data: reportes } = await admin
    .from('question_reports')
    .select('*, questions(body)')
    .eq('quiz_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Info del quiz */}
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '500', color: 'white', marginBottom: '6px' }}>{quiz.title}</h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>@{quiz.users?.username}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{quiz.users?.email}</span>
                <span style={{ fontSize: '12px', color: quiz.visibility === 'public' ? '#059669' : '#ef4444' }}>
                  {quiz.visibility === 'public' ? '🌐 público' : quiz.visibility === 'private' ? '🔒 privado' : '🔗 link'}
                </span>
                {quiz.admin_locked && <span style={{ fontSize: '12px', color: '#ef4444' }}>🔒 bloqueado por admin</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={'/admin/quizzes'} style={{ fontSize: '12px', color: '#6b7280', background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '6px 12px', textDecoration: 'none' }}>
                ← Volver
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Preguntas', value: quiz.question_count || 0 },
              { label: 'Estudiantes', value: quiz.student_count || 0 },
              { label: 'Categoría', value: quiz.category || '—' },
              { label: 'Materia', value: quiz.subject || '—' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111', borderRadius: '8px', padding: '10px', border: '1px solid #222' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {quiz.description && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>{quiz.description}</div>
          )}
          {quiz.notes && (
            <div style={{ marginTop: '8px', background: '#2d1a00', border: '1px solid #d97706', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#d97706' }}>{quiz.notes}</div>
          )}
        </div>

        {/* Reportes pendientes */}
        {reportes && reportes.length > 0 && (
          <div style={{ background: '#2d0a0a', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#ef4444', marginBottom: '10px' }}>
              ⚠ {reportes.length} reporte{reportes.length > 1 ? 's' : ''} pendiente{reportes.length > 1 ? 's' : ''}
            </div>
            {reportes.map(r => (
              <div key={r.id} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '10px', marginBottom: '8px', border: '1px solid #222' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#ef4444', marginBottom: '4px' }}>{r.reason}</div>
                {r.comment && <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{r.comment}</div>}
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Pregunta: {r.questions?.body?.slice(0, 100)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Preguntas */}
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #222' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'white', marginBottom: '16px' }}>
            Preguntas ({questions?.length || 0})
          </div>
          {questions?.length === 0 && (
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Este quiz no tiene preguntas.</p>
          )}
          {questions?.map((q, idx) => (
            <div key={q.id} style={{ border: '1px solid #222', borderRadius: '8px', padding: '14px', marginBottom: '10px', background: '#111' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                {idx + 1} · {q.type === 'single' ? 'Una correcta' : 'Múltiple correcta'}
              </div>
              <div style={{ fontSize: '14px', color: 'white', marginBottom: '10px', lineHeight: '1.4' }}>{q.body}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {q.options?.map(opt => (
                  <div key={opt.id} style={{ fontSize: '12px', color: opt.is_correct ? '#059669' : '#6b7280', display: 'flex', gap: '8px' }}>
                    <span>{opt.is_correct ? '✓' : '·'}</span>
                    <span>{opt.body}</span>
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', background: '#1a1a1a', borderRadius: '6px', padding: '8px', border: '1px solid #222' }}>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
