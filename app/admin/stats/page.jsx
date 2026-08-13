import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_ID = '0bccda9a-a636-45b9-aea9-8580ecffb3b9'

export default async function AdminStatsUser({ params }) {
  const { user_id } = await params
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

  const { data: perfil } = await supabase
    .from('users')
    .select('username, email, full_name, streak_current, streak_best, last_study_date, created_at')
    .eq('id', user_id)
    .single()

  if (!perfil) redirect('/admin/stats')

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*, quizzes(title)')
    .eq('user_id', user_id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(50)

  const totalSessions = sessions?.length || 0
  const totalCorrect = sessions?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0
  const totalQuestions = sessions?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0
  const totalXP = sessions?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0
  const precision = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null

  const { data: progress } = await supabase
    .from('user_question_progress')
    .select('question_id, repetitions, last_quality, next_review_date')
    .eq('user_id', user_id)

  const dominated = progress?.filter(p => p.repetitions >= 2 && p.last_quality >= 3).length || 0
  const expert = progress?.filter(p => p.repetitions >= 4 && p.last_quality >= 3).length || 0

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
    return 'hace ' + Math.floor(diff / 86400) + ' días'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/dashboard" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '10px' }}>Admin</span>
        </a>
        <a href="/admin/stats" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>← Volver a stats</a>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '500', color: '#065f46', flexShrink: 0 }}>
            {perfil.username?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>@{perfil.username}</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              Miembro desde {perfil.created_at?.slice(0, 10)}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{totalSessions}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Sesiones</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{precision !== null ? precision + '%' : '-'}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Precisión</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#d97706' }}>{perfil.streak_current || 0}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Racha actual</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#0369a1' }}>{totalXP}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>XP total</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '28px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{dominated}</div>
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Preguntas dominadas</div>
          </div>
          <div style={{ background: '#e0f2fe', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#0369a1' }}>{expert}</div>
            <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>Preguntas experto</div>
          </div>
        </div>

        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>
          Últimas 50 sesiones
        </div>

        {sessions?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #e5e7eb', borderRadius: '10px', color: '#9ca3af', fontSize: '13px' }}>
            Sin sesiones registradas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions?.map(s => {
              const pct = s.total_questions > 0 ? Math.round((s.correct / s.total_questions) * 100) : 0
              return (
                <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>
                      {s.quizzes?.title || 'Quiz eliminado'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {s.total_questions} preguntas · {timeAgo(s.finished_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#059669' }}>✓ {s.correct}</span>
                    <span style={{ color: '#ef4444' }}>✗ {s.wrong}</span>
                    <span style={{ color: '#d97706' }}>~ {s.partial}</span>
                    <span style={{ fontWeight: '500', color: pct >= 70 ? '#059669' : pct >= 50 ? '#d97706' : '#ef4444', background: '#f9fafb', padding: '2px 8px', borderRadius: '6px' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}