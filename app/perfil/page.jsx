import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

  const nombre = user.user_metadata?.full_name || 'Usuario'
  const avatar = nombre.slice(0, 2).toUpperCase()

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

  const diasConActividad = new Set(
    sessions?.map(s => s.finished_at?.split('T')[0]).filter(Boolean)
  )

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
    { key: 'primera_sesion', icon: '⚡', nombre: 'Primera sesion', desc: 'Completaste tu primera sesion de estudio', desbloqueado: sessions && sessions.length > 0 },
    { key: 'quiz_creado', icon: '📚', nombre: 'Creador', desc: 'Publicaste tu primer quiz', desbloqueado: quizzes && quizzes.length > 0 },
    { key: '100_preguntas', icon: '🎯', nombre: '100 preguntas', desc: 'Respondiste 100 preguntas', desbloqueado: totalQuestions >= 100 },
    { key: 'precision_80', icon: '🏆', nombre: 'Precision 80%', desc: 'Semana con 80% de aciertos', desbloqueado: precision !== null && precision >= 80 },
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
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear quiz</a>
          <a href="/perfil" style={{ fontSize: '13px', fontWeight: '500', color: '#111', textDecoration: 'none' }}>Perfil</a>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '500', color: '#065f46', flexShrink: 0 }}>
            {avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>{nombre}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', background: '#d1fae5', color: '#065f46' }}>
                Nivel {nivel}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#f3f4f6', color: '#374151' }}>
                Free
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{sessions?.length || 0}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Sesiones</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{xpTotal}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>XP total</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{precision !== null ? precision + '%' : '-'}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Precision</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{quizzes?.length || 0}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Quizzes</div>
          </div>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel {nivel}</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{200 - xpEnNivel} XP para Nivel {nivel + 1}</span>
          </div>
          <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: xpPct + '%', background: '#059669', borderRadius: '3px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Actividad — ultimas 12 semanas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3px' }}>
            {Array.from({ length: 12 }, (_, semana) => (
              <div key={semana} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }, (_, dia) => {
                  const idx = semana * 7 + dia
                  const level = activityLevels[idx] || 0
                  return (
                    <div
                      key={dia}
                      style={{ width: '100%', aspectRatio: '1', borderRadius: '2px', background: activityColors[level] }}
                    />
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
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Mas</span>
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Logros</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {logros.map(logro => (
              <div
                key={logro.key}
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', textAlign: 'center', opacity: logro.desbloqueado ? 1 : 0.35 }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{logro.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{logro.nombre}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>{logro.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>Mis quizzes</span>
            <a href="/crear-quiz" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>+ Crear nuevo</a>
          </div>
          {quizzes && quizzes.length > 0 ? (
            quizzes.map(quiz => (
              <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>{quiz.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{quiz.question_count} preguntas · {quiz.visibility === 'public' ? 'Publico' : 'Privado'}</div>
                </div>
                <a href={'/estudiar/' + quiz.id} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                  Estudiar
                </a>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed #e5e7eb', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No creaste ningun quiz todavia.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
