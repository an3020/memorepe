import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PerfilForm from '@/app/components/PerfilForm'

export default async function Perfil() {
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
    .select('username, bio, location, career, website, show_email, plan, streak_current, streak_best, last_study_date')
    .eq('id', user.id)
    .single()

  const username = userProfile?.username || ''
  const avatar = username.slice(0, 2).toUpperCase()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  const totalCorrect = sessions?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0
  const totalQuestions = sessions?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0
  const precision = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null
  const xpTotal = sessions?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0
  const nivel = Math.floor(xpTotal / 200) + 1
  const xpEnNivel = xpTotal % 200
  const xpPct = (xpEnNivel / 200) * 100

  const ultimas12semanas = Array.from({ length: 84 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (83 - i))
    return d.toISOString().split('T')[0]
  })

  const activityLevels = ultimas12semanas.map(dia => {
    const sesionesDelDia = sessions?.filter(s => s.finished_at?.split('T')[0] === dia) || []
    const total = sesionesDelDia.reduce((sum, s) => sum + (s.total_questions || 0), 0)
    if (total === 0) return 0
    if (total < 10) return 1
    if (total < 30) return 2
    if (total < 60) return 3
    return 4
  })

  const activityColors = ['#f9fafb', '#d1fae5', '#6ee7b7', '#34d399', '#059669']

  const logros = [
    { key: 'primera_sesion', icon: '⚡', nombre: 'Primera sesión', desc: 'Completaste tu primera sesión de estudio', desbloqueado: sessions && sessions.length > 0 },
    { key: 'quiz_creado', icon: '📚', nombre: 'Creador', desc: 'Publicaste tu primer banco de preguntas', desbloqueado: quizzes && quizzes.length > 0 },
    { key: '100_preguntas', icon: '🎯', nombre: '100 preguntas', desc: 'Respondiste 100 preguntas', desbloqueado: totalQuestions >= 100 },
    { key: 'precision_80', icon: '🏆', nombre: 'Precisión 80%', desc: 'Alcanzaste 80% de precisión', desbloqueado: precision !== null && precision >= 80 },
    { key: '500_preguntas', icon: '🔥', nombre: '500 preguntas', desc: 'Respondiste 500 preguntas', desbloqueado: totalQuestions >= 500 },
    { key: 'nivel_5', icon: '👑', nombre: 'Nivel 5', desc: 'Alcanzaste el nivel 5', desbloqueado: nivel >= 5 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Inicio</a>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear banco</a>
          <a href="/perfil" style={{ fontSize: '13px', fontWeight: '500', color: '#111', textDecoration: 'none' }}>Perfil</a>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        {/* BLOQUE 1 — Identidad */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '24px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '500', color: '#065f46', flexShrink: 0 }}>
              {avatar}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>@{username}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', background: '#d1fae5', color: '#065f46' }}>
                  Nivel {nivel}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e5e7eb', color: '#374151' }}>
                  {userProfile?.plan || 'Free'}
                </span>
              </div>
            </div>
          </div>
          <PerfilForm userId={user.id} initialData={userProfile} />
        </div>

        {/* BLOQUE 2 — Plan */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>Plan actual: Free</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Bancos ilimitados · Algoritmo SM-2 · Planificador de exámenes</div>
            </div>
            <button
              disabled
              style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 14px', cursor: 'not-allowed', opacity: 0.6 }}
            >
              Upgrade a Pro
            </button>
          </div>
          {/* Reservado para mensajería interna */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#d1d5db', textAlign: 'center' }}>
              Más funciones próximamente
            </div>
          </div>
        </div>

        {/* BLOQUE 3 — Stats */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Estadísticas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{sessions?.length || 0}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Sesiones</div>
            </div>
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{xpTotal}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>XP total</div>
            </div>
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{precision !== null ? precision + '%' : '-'}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Precisión</div>
            </div>
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{quizzes?.length || 0}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Bancos</div>
            </div>
          </div>

          {/* Barra de nivel */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel {nivel}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{200 - xpEnNivel} XP para Nivel {nivel + 1}</span>
            </div>
            <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: xpPct + '%', background: '#059669', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* BLOQUE 4 — Actividad */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Actividad — últimas 12 semanas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3px' }}>
            {Array.from({ length: 12 }, (_, semana) => (
              <div key={semana} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }, (_, dia) => {
                  const idx = semana * 7 + dia
                  const level = activityLevels[idx] || 0
                  return (
                    <div key={dia} style={{ width: '100%', aspectRatio: '1', borderRadius: '2px', background: activityColors[level] }} />
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '8px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Menos</span>
            {activityColors.map((c, i) => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, border: '1px solid #e5e7eb' }} />
            ))}
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Más</span>
          </div>
        </div>

        {/* BLOQUE 5 — Logros */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Logros</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {logros.map(logro => (
              <div key={logro.key} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center', opacity: logro.desbloqueado ? 1 : 0.35 }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{logro.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{logro.nombre}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>{logro.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOQUE 6 — Mis bancos */}
        <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>Mis bancos de preguntas</span>
            <a href="/crear-quiz" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>+ Crear nuevo</a>
          </div>
          {quizzes && quizzes.length > 0 ? (
            quizzes.map(quiz => (
              <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>{quiz.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{quiz.question_count} preguntas · {quiz.visibility === 'public' ? 'Público' : 'Privado'}</div>
                </div>
                <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                  Estudiar
                </a>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #e5e7eb', borderRadius: '10px', background: 'white' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No creaste ningún banco todavía.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
