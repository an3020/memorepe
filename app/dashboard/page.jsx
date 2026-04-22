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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
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

  const today = new Date().toISOString().split('T')[0]
  const { data: userProfile } = await supabase
    .from('users')
    .select('streak_current, streak_best, last_study_date')
    .eq('id', user.id)
    .single()

  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const diasConActividad = new Set(
    sessions?.map(s => s.finished_at?.split('T')[0]).filter(Boolean)
  )

  const s = {
    page: { minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' },
    logo: { fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' },
    logoSpan: { color: '#059669' },
    navLinks: { display: 'flex', gap: '24px', alignItems: 'center' },
    navLinkActive: { fontSize: '13px', fontWeight: '500', color: '#111' },
    navLink: { fontSize: '13px', color: '#9ca3af', cursor: 'pointer', textDecoration: 'none' },
    langToggle: { fontSize: '12px', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' },
    avatarSmall: { width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#065f46' },
    main: { maxWidth: '720px', margin: '0 auto', padding: '32px 24px' },
    greeting: { marginBottom: '24px' },
    greetingH1: { fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '6px' },
    greetingP: { fontSize: '13px', color: '#9ca3af' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' },
    statCard: { background: '#f9fafb', borderRadius: '10px', padding: '12px' },
    statLabel: { fontSize: '11px', color: '#9ca3af', marginBottom: '4px' },
    statValue: { fontSize: '20px', fontWeight: '500', color: '#111' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    sectionTitle: { fontSize: '14px', fontWeight: '500', color: '#111' },
    sectionLink: { fontSize: '12px', color: '#059669', textDecoration: 'none', cursor: 'pointer' },
    emptyState: { border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '24px' },
    emptyTitle: { fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' },
    emptyDesc: { fontSize: '12px', color: '#9ca3af', marginBottom: '20px' },
    btnRow: { display: 'flex', gap: '8px', justifyContent: 'center' },
    btnPrimary: { padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none' },
    btnSecondary: { padding: '8px 18px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none' },
    quizCard: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' },
    quizInfo: { flex: 1 },
    quizTitle: { fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '3px' },
    quizMeta: { fontSize: '11px', color: '#9ca3af' },
    quizStats: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' },
    streakRow: { display: 'flex', gap: '6px', marginBottom: '24px' },
    streakDay: { flex: 1, height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' },
    xpWrap: { background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '24px' },
    xpTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    xpLabel: { fontSize: '13px', fontWeight: '500', color: '#111' },
    xpSub: { fontSize: '11px', color: '#9ca3af' },
    xpBarWrap: { height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
    xpBarFill: { height: '100%', background: '#059669', borderRadius: '3px' },
  }

  const nivel = Math.floor(xpTotal / 200) + 1
  const xpEnNivel = xpTotal % 200
  const xpPct = (xpEnNivel / 200) * 100

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>memo<span style={s.logoSpan}>repe</span></div>
        <div style={s.navLinks}>
          <span style={s.navLinkActive}>Inicio</span>
          <a href="/explorar" style={s.navLink}>Explorar</a>
          <a href="/crear-quiz" style={s.navLink}>Crear quiz</a>
          <span style={s.langToggle}>ES / EN</span>
          <div style={s.avatarSmall}>{avatar}</div>
        </div>
      </nav>

      <div style={s.main}>

        <div style={s.greeting}>
          <h1 style={s.greetingH1}>Buen día, {nombre}.</h1>
          {quizzes && quizzes.length > 0
            ? <p style={s.greetingP}>Tenés <strong style={{ color: '#111' }}>{quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''}</strong> activos.</p>
            : <p style={s.greetingP}>Todavía no tenés quizzes. <a href="/crear-quiz" style={{ color: '#059669' }}>Creá el primero</a> o <a href="/explorar" style={{ color: '#059669' }}>explorá los públicos</a>.</p>
          }
        </div>

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statLabel}>Racha actual</div>
            <div style={{ ...s.statValue, color: '#d97706' }}>{userProfile?.streak_current || 0} días</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>XP total</div>
            <div style={s.statValue}>{xpTotal}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Sesiones</div>
            <div style={{ ...s.statValue, color: '#059669' }}>{sessions?.length || 0}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Precisión</div>
            <div style={s.statValue}>{precision !== null ? precision + '%' : '—'}</div>
          </div>
        </div>

        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Racha semanal</span>
        </div>
        <div style={s.streakRow}>
          {ultimos7.map((dia, i) => {
            const d = new Date(dia + 'T12:00:00')
            const activo = diasConActividad.has(dia)
            const esHoy = dia === today
            return (
              <div key={dia} style={{
                ...s.streakDay,
                background: esHoy ? '#059669' : activo ? '#d1fae5' : '#f9fafb',
                color: esHoy ? 'white' : activo ? '#065f46' : '#d1d5db',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px' }}>{diasSemana[d.getDay()]}</span>
                <span>{activo || esHoy ? '✓' : '·'}</span>
              </div>
            )
          })}
        </div>

        <div style={s.xpWrap}>
          <div style={s.xpTop}>
            <span style={s.xpLabel}>Nivel {nivel}</span>
            <span style={s.xpSub}>{200 - xpEnNivel} XP para Nivel {nivel + 1}</span>
          </div>
          <div style={s.xpBarWrap}>
            <div style={{ ...s.xpBarFill, width: xpPct + '%' }} />
          </div>
        </div>

        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Mis quizzes</span>
          <a href="/crear-quiz" style={s.sectionLink}>+ Crear nuevo</a>
        </div>

        {quizzes && quizzes.length > 0 ? (
          quizzes.map(quiz => (
            <a key={quiz.id} href={'/estudiar/' + quiz.id} style={s.quizCard}>
              <div style={s.quizInfo}>
                <div style={s.quizTitle}>{quiz.title}</div>
                <div style={s.quizMeta}>
                  {quiz.question_count} preguntas
                  {quiz.subject ? ' · ' + quiz.subject : ''}
                  {quiz.institution_id ? ' · ' + quiz.faculty : ''}
                </div>
              </div>
              <div style={s.quizStats}>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>Estudiar</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{quiz.visibility === 'public' ? 'Público' : quiz.visibility === 'link' ? 'Con link' : 'Privado'}</span>
              </div>
            </a>
          ))
        ) : (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>No tenés quizzes activos</p>
            <p style={s.emptyDesc}>Creá tu propio quiz o encontrá uno público para empezar a estudiar.</p>
            <div style={s.btnRow}>
              <a href="/crear-quiz" style={s.btnPrimary}>Crear quiz</a>
              <a href="/explorar" style={s.btnSecondary}>Explorar quizzes</a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}