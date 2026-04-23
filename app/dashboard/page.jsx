import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
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

  const nombre = user.user_metadata?.full_name?.split(' ')[0] || 'estudiante'
  const avatar = nombre.slice(0, 2).toUpperCase()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: favorites } = await supabase
    .from('favorites')
    .select('*, quizzes(*)')
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

  const { data: userProfile } = await supabase
    .from('users')
    .select('streak_current, streak_best, last_study_date')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const diasConActividad = new Set(
    sessions?.map(s => s.finished_at?.split('T')[0]).filter(Boolean)
  )

  const nivel = Math.floor(xpTotal / 200) + 1
  const xpEnNivel = xpTotal % 200
  const xpPct = (xpEnNivel / 200) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Inicio</span>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear quiz</a>
          <a href="/perfil" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Perfil</a>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#065f46' }}>
            {avatar}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Buen dia, {nombre}.</h1>
          {quizzes && quizzes.length > 0
            ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>Tenes <strong style={{ color: '#111' }}>{quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''}</strong> activos.</p>
            : <p style={{ fontSize: '13px', color: '#9ca3af' }}>Todavia no tenes quizzes. <a href="/crear-quiz" style={{ color: '#059669' }}>Crea el primero</a> o <a href="/explorar" style={{ color: '#059669' }}>explora los publicos</a>.</p>
          }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Racha actual</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#d97706' }}>{userProfile?.streak_current || 0} dias</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>XP total</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{xpTotal}</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Sesiones</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{sessions?.length || 0}</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Precision</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{precision !== null ? precision + '%' : '-'}</div>
          </div>
        </div>

        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Racha semanal</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {ultimos7.map((dia) => {
            const d = new Date(dia + 'T12:00:00')
            const activo = diasConActividad.has(dia)
            const esHoy = dia === today
            return (
              <div key={dia} style={{
                flex: 1, height: '36px', borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                background: esHoy ? '#059669' : activo ? '#d1fae5' : '#f9fafb',
                color: esHoy ? 'white' : activo ? '#065f46' : '#d1d5db',
              }}>
                <span style={{ fontSize: '9px' }}>{diasSemana[d.getDay()]}</span>
                <span style={{ fontSize: '11px' }}>{activo || esHoy ? '✓' : '·'}</span>
              </div>
            )
          })}
        </div>

        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel {nivel}</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{200 - xpEnNivel} XP para Nivel {nivel + 1}</span>
          </div>
          <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: xpPct + '%', background: '#059669', borderRadius: '3px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>Mis quizzes</span>
          <a href="/crear-quiz" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>+ Crear nuevo</a>
        </div>

        {quizzes && quizzes.length > 0 ? (
          quizzes.map(quiz => (
            <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{quiz.title}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {quiz.question_count} preguntas
                  {quiz.subject ? ' · ' + quiz.subject : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <a href={'/quiz/' + quiz.id + '/gestionar'} style={{ fontSize: '11px', color: '#6b7280', textDecoration: 'none', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: '6px' }}>
                  Gestionar
                </a>
                <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                  Estudiar
                </a>
              </div>
            </div>
          ))
        ) : (
          <div style={{ border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>No tenes quizzes activos</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>Crea tu propio quiz o encontra uno publico para empezar a estudiar.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <a href="/crear-quiz" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '8px', textDecoration: 'none' }}>Crear quiz</a>
              <a href="/explorar" style={{ padding: '8px 18px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>Explorar quizzes</a>
            </div>
          </div>
        )}

        {favorites && favorites.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '28px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>Mis favoritos</span>
            </div>
            {favorites.map(fav => (
              <div key={fav.id} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '16px' }}>★</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{fav.quizzes?.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {fav.quizzes?.question_count} preguntas
                    {fav.quizzes?.subject ? ' · ' + fav.quizzes.subject : ''}
                  </div>
                </div>
                <a href={'/estudiar/' + fav.quiz_id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                  Estudiar
                </a>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  )
}
