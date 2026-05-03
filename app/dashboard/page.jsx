import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import QuizProgressCard from '@/app/components/QuizProgressCard'
import FeedbackButton from '@/app/components/FeedbackButton'
import AnnouncementBanner from '@/app/components/AnnouncementBanner'
import DashboardBuscador from '@/app/components/DashboardBuscador'

export const revalidate = 0

const NIVELES = [
  { nombre: 'Curioso',    xp: 500 },
  { nombre: 'Estudiante', xp: 2000 },
  { nombre: 'Aplicado',   xp: 5000 },
  { nombre: 'Dedicado',   xp: 12000 },
  { nombre: 'Constante',  xp: 25000 },
  { nombre: 'Avanzado',   xp: 50000 },
  { nombre: 'Experto',    xp: 90000 },
  { nombre: 'Erudito',    xp: 150000 },
  { nombre: 'Académico',  xp: 230000 },
  { nombre: 'Sabio',      xp: 350000 },
  { nombre: 'Maestro',    xp: 500000 },
  { nombre: 'Leyenda',    xp: 750000 },
]

function getNivel(xp) {
  let nivel = 0
  for (let i = 0; i < NIVELES.length; i++) {
    if (xp >= NIVELES[i].xp) nivel = i + 1
    else break
  }
  const nivelActual = NIVELES[nivel] || NIVELES[NIVELES.length - 1]
  const nivelAnterior = nivel > 0 ? NIVELES[nivel - 1] : { xp: 0 }
  const xpInicio = nivelAnterior.xp
  const xpFin = nivelActual.xp
  const xpEnNivel = xp - xpInicio
  const xpTotal = xpFin - xpInicio
  const pct = Math.min(100, Math.round((xpEnNivel / xpTotal) * 100))
  const nombre = nivel > 0 ? NIVELES[nivel - 1].nombre : 'Curioso'
  return { nivel: Math.max(1, nivel), nombre, pct, xpFin, xpEnNivel: Math.max(0, xpEnNivel) }
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default async function Dashboard({ searchParams }) {
  const cookieStore = await cookies()
  const sp = await searchParams
  const busqueda = sp?.q || ''

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

  await supabase.rpc('apply_xp_decay', { p_user_id: user.id })

  const { data: userProfile } = await supabase
    .from('users')
    .select('username, streak_current, streak_best, last_study_date, xp_total, xp_decay_pending')
    .eq('id', user.id)
    .single()

  const nombre = capitalize(userProfile?.username || user.user_metadata?.full_name?.split(' ')[0] || 'estudiante')
  const avatar = nombre.slice(0, 2).toUpperCase()
  const xpTotal = userProfile?.xp_total || 0
  const decayPending = userProfile?.xp_decay_pending || 0
  const nivelInfo = getNivel(xpTotal)

  let quizzesQuery = supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (busqueda) {
    quizzesQuery = quizzesQuery.or('title.ilike.%' + busqueda + '%,subject.ilike.%' + busqueda + '%')
  }

  const { data: quizzes } = await quizzesQuery

  const { data: favorites } = await supabase
    .from('favorites')
    .select('*, quizzes(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const favoritosFiltrados = busqueda
    ? (favorites || []).filter(f =>
        f.quizzes?.title?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.quizzes?.subject?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : favorites || []

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  const { data: exams } = await supabase
    .from('exams')
    .select('*, exam_quizzes(quiz_id)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('exam_date', new Date().toISOString().split('T')[0])
    .order('exam_date', { ascending: true })

  const totalCorrect = sessions?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0
  const totalQuestions = sessions?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0
  const precision = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null

  const today = new Date().toISOString().split('T')[0]
  const hace15dias = new Date()
  hace15dias.setDate(hace15dias.getDate() - 15)
  const hace15diasStr = hace15dias.toISOString().split('T')[0]

  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const diasConActividad = new Set(
    sessions?.map(s => s.finished_at?.split('T')[0]).filter(Boolean)
  )

  // Quizzes estudiados en los últimos 15 días
  const recentSessionQuizIds = [...new Set(
    (sessions || [])
      .filter(s => s.finished_at && s.finished_at.split('T')[0] >= hace15diasStr)
      .map(s => s.quiz_id)
  )]

  const recentQuizIds = []
  const seenIds = new Set()
  for (const s of sessions || []) {
    if (!seenIds.has(s.quiz_id) && recentQuizIds.length < 5) {
      seenIds.add(s.quiz_id)
      recentQuizIds.push(s.quiz_id)
    }
  }

  let recentQuizzes = []
  if (recentQuizIds.length > 0) {
    const { data: recentData } = await supabase
      .from('quizzes')
      .select('*')
      .in('id', recentQuizIds)
    recentQuizzes = recentQuizIds.map(id => recentData?.find(q => q.id === id)).filter(Boolean)
  }

  const allQuizIds = [...new Set([...recentQuizIds, ...(quizzes || []).map(q => q.id)])]
  let progressMap = {}
  if (allQuizIds.length > 0) {
    const { data: progressData } = await supabase
      .rpc('get_user_quizzes_progress', { p_user_id: user.id, p_quiz_ids: allQuizIds })
    if (progressData) progressData.forEach(p => { progressMap[p.quiz_id] = p })
  }

  // Preguntas vencidas hoy — solo de quizzes estudiados en últimos 15 días
  const totalDueToday = recentSessionQuizIds.reduce((sum, qid) => sum + (progressMap[qid]?.due_today || 0), 0)
  const bancosDueToday = recentSessionQuizIds.filter(qid => (progressMap[qid]?.due_today || 0) > 0).length

  // Recomendados
  const categoriasUsuario = [...new Set((quizzes || []).map(q => q.category).filter(Boolean))]
  let recomendados = []
  if (categoriasUsuario.length > 0) {
    const idsExcluir = allQuizIds.length > 0 ? allQuizIds : ['00000000-0000-0000-0000-000000000000']
    const { data: recomData } = await supabase
      .from('quizzes')
      .select('*, users(username)')
      .eq('visibility', 'public')
      .in('category', categoriasUsuario)
      .not('user_id', 'eq', user.id)
      .not('id', 'in', `(${idsExcluir.join(',')})`)
      .order('student_count', { ascending: false })
      .limit(4)
    recomendados = recomData || []
  }

  const quizzesConProgreso = (quizzes || []).map(quiz => ({ ...quiz, progreso: progressMap[quiz.id] }))

  const seccion = {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  }

  const seccionTitulo = {
    fontSize: '17px',
    fontWeight: '600',
    color: '#111',
    marginBottom: '12px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <AnnouncementBanner />
        <a href="/dashboard" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Inicio</span>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/planificador" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Planificador</a>
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear banco</a>
          <a href="/perfil" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Perfil</a>
          <a href="/ayuda" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Ayuda</a>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#065f46' }}>
            {avatar}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Saludo */}
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>
          Buen día, {nombre}.
        </h1>

        {/* Stats 2x2 + Buscador */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Racha actual</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#d97706' }}>{userProfile?.streak_current || 0}d</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>XP total</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{xpTotal.toLocaleString('es-AR')}</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Sesiones</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#059669' }}>{sessions?.length || 0}</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Precisión</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: '#111' }}>{precision !== null ? precision + '%' : '-'}</div>
            </div>
          </div>
          <DashboardBuscador defaultValue={busqueda} />
        </div>

        {/* Nivel XP */}
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel actual: {nivelInfo.nombre}</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              {nivelInfo.xpEnNivel.toLocaleString('es-AR')} / {nivelInfo.xpFin.toLocaleString('es-AR')} XP
            </span>
          </div>
          <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: nivelInfo.pct + '%', background: '#059669', borderRadius: '3px' }} />
          </div>
        </div>

        {/* Tooltip pérdida XP */}
        {decayPending > 0 && (
          <div style={{ fontSize: '12px', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
            ¡Bienvenido de vuelta! Tu racha descansó un poco — perdiste {decayPending.toLocaleString('es-AR')} XP. Hoy es un buen día para recuperarlos.
          </div>
        )}

        {/* Racha semanal + preguntas pendientes agrupadas */}
        <div style={{ ...seccion }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '10px' }}>Racha semanal</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: totalDueToday > 0 ? '12px' : '0' }}>
            {ultimos7.map((dia) => {
              const d = new Date(dia + 'T12:00:00')
              const activo = diasConActividad.has(dia)
              const esHoy = dia === today
              return (
                <div key={dia} style={{ flex: 1, height: '36px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: esHoy ? '#059669' : activo ? '#d1fae5' : 'white', color: esHoy ? 'white' : activo ? '#065f46' : '#d1d5db' }}>
                  <span style={{ fontSize: '9px' }}>{diasSemana[d.getDay()]}</span>
                  <span style={{ fontSize: '11px' }}>{activo || esHoy ? '✓' : '·'}</span>
                </div>
              )
            })}
          </div>
          {totalDueToday > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                ⚡ Tienes <strong>{totalDueToday}</strong> preguntas para repasar hoy en <strong>{bancosDueToday}</strong> {bancosDueToday === 1 ? 'banco' : 'bancos'} de los últimos 15 días.
              </p>
            </div>
          )}
        </div>

        {/* Mis exámenes */}
        {exams && exams.length > 0 && (
          <div style={seccion}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={seccionTitulo}>Mis exámenes</span>
              <a href="/planificador" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>Ver planificador</a>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {exams.map(exam => {
                const examDate = new Date(exam.exam_date + 'T12:00:00')
                const daysLeft = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24))
                const urgent = daysLeft <= 7
                const soon = daysLeft <= 14
                return (
                  <a key={exam.id} href="/planificador" style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', borderRadius: '10px', border: '1px solid', borderColor: urgent ? '#fecaca' : soon ? '#fde68a' : '#e5e7eb', background: urgent ? '#fef2f2' : soon ? '#fffbeb' : 'white', textDecoration: 'none', minWidth: '140px', flex: '1' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam.title}</div>
                    <div style={{ fontSize: '11px', color: urgent ? '#ef4444' : soon ? '#d97706' : '#9ca3af', fontWeight: '500' }}>
                      {daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : daysLeft + ' días'}
                    </div>
                  </a>
                )
              })}
              <a href="/planificador" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: '10px', border: '1px dashed #e5e7eb', textDecoration: 'none', minWidth: '60px', color: '#9ca3af', fontSize: '18px', background: 'white' }}>+</a>
            </div>
          </div>
        )}

        {/* Estudiados recientemente */}
        {recentQuizzes.length > 0 && (
          <div style={seccion}>
            <div style={seccionTitulo}>Estudiados recientemente</div>
            {recentQuizzes.map(quiz => (
              <QuizProgressCard key={quiz.id} quiz={quiz} p={progressMap[quiz.id]} />
            ))}
          </div>
        )}

        {/* Mis bancos de preguntas */}
        <div style={seccion}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={seccionTitulo}>Mis bancos de preguntas</span>
            <a href="/crear-quiz" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>+ Crear nuevo</a>
          </div>
          {quizzesConProgreso && quizzesConProgreso.length > 0 ? (
            quizzesConProgreso.map(quiz => (
              <QuizProgressCard key={quiz.id} quiz={quiz} p={quiz.progreso} />
            ))
          ) : (
            <div style={{ border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '32px', textAlign: 'center', background: 'white' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>No tienes bancos de preguntas todavía</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Crea tu propio banco o estudia uno público para empezar.</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <a href="/crear-quiz" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '8px', textDecoration: 'none' }}>Crear banco</a>
                <a href="/explorar" style={{ padding: '8px 18px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>Explorar</a>
              </div>
            </div>
          )}
        </div>

        {/* Mis favoritos */}
        {favoritosFiltrados.length > 0 && (
          <div style={seccion}>
            <div style={seccionTitulo}>Mis favoritos</div>
            {favoritosFiltrados.map(fav => (
              <div key={fav.id} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '16px' }}>★</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{fav.quizzes?.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {fav.quizzes?.question_count} preguntas{fav.quizzes?.subject ? ' · ' + fav.quizzes.subject : ''}
                  </div>
                </div>
                <a href={'/estudiar/' + fav.quiz_id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                  Estudiar
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Recomendados */}
        {recomendados.length > 0 && (
          <div style={seccion}>
            <div style={seccionTitulo}>Recomendados para ti</div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '-8px', marginBottom: '12px' }}>Basado en lo que ya estudias</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {recomendados.map(quiz => (
                <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{quiz.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px' }}>
                    {quiz.question_count} preguntas{quiz.subject ? ' · ' + quiz.subject : ''}
                    {quiz.users?.username && <span> · <span style={{ color: '#059669' }}>@{quiz.users.username}</span></span>}
                  </div>
                  <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                    Estudiar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <FeedbackButton />
    </div>
  )
}
