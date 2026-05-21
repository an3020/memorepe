'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingScreen from '@/app/components/LoadingScreen'

const MENSAJES_MOTIVADORES = [
  "El conocimiento que repetís hoy es el que no olvidás mañana.",
  "Cada sesión es un ladrillo. Seguís construyendo.",
  "La memoria no es talento, es entrenamiento.",
  "Un día más, un poco más sólido.",
  "Lo que practicás en calma lo recordás bajo presión.",
  "No se trata de cuánto estudiás, sino de cuán seguido volvés.",
  "El cerebro aprende mejor en pequeñas dosis. Vas por buen camino.",
  "Hoy fue un buen día para tu memoria.",
  "Constancia > intensidad. Lo estás haciendo bien.",
  "Cada pregunta que respondiste hoy refuerza una conexión nueva.",
  "El repaso espaciado es la herramienta más poderosa que existe. Y la estás usando.",
  "No importa cómo salió, importa que volviste.",
  "La curva del olvido trabaja en tu contra. Vos trabajás en tu favor.",
  "Estudiar así es difícil. Por eso funciona.",
  "Tu yo del día del examen te lo va a agradecer.",
]

const NIVELES = [
  { nivel: 1, nombre: 'Curioso', xp: 500 },
  { nivel: 2, nombre: 'Estudiante', xp: 2000 },
  { nivel: 3, nombre: 'Aplicado', xp: 5000 },
  { nivel: 4, nombre: 'Dedicado', xp: 12000 },
  { nivel: 5, nombre: 'Constante', xp: 25000 },
  { nivel: 6, nombre: 'Avanzado', xp: 50000 },
  { nivel: 7, nombre: 'Experto', xp: 90000 },
  { nivel: 8, nombre: 'Erudito', xp: 150000 },
  { nivel: 9, nombre: 'Académico', xp: 230000 },
  { nivel: 10, nombre: 'Sabio', xp: 350000 },
  { nivel: 11, nombre: 'Maestro', xp: 500000 },
  { nivel: 12, nombre: 'Leyenda', xp: 750000 },
]

function getNivel(xpTotal) {
  let nivelActual = NIVELES[0]
  let nivelSiguiente = NIVELES[1]
  for (let i = 0; i < NIVELES.length; i++) {
    if (xpTotal >= NIVELES[i].xp) {
      nivelActual = NIVELES[i]
      nivelSiguiente = NIVELES[i + 1] || null
    }
  }
  const xpInicio = nivelActual.xp
  const xpFin = nivelSiguiente?.xp || nivelActual.xp
  const pct = nivelSiguiente ? Math.round(((xpTotal - xpInicio) / (xpFin - xpInicio)) * 100) : 100
  return { nivelActual, nivelSiguiente, pct, xpFalta: nivelSiguiente ? nivelSiguiente.xp - xpTotal : 0 }
}

function getMensaje(sessionId) {
  if (!sessionId) return MENSAJES_MOTIVADORES[0]
  const idx = sessionId.charCodeAt(0) % MENSAJES_MOTIVADORES.length
  return MENSAJES_MOTIVADORES[idx]
}

function formatFechaVuelta(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  if (dateStr === todayStr) return 'hoy mismo'
  if (dateStr === tomorrowStr) return 'mañana'
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function sm2(quality, repetitions, easiness, interval) {
  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easiness)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }
  easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)
  return { repetitions, easiness, interval, nextDate: nextDate.toISOString().split('T')[0] }
}

function buildQueue(questionsData, progressData, limite) {
  const progressMap = {}
  progressData?.forEach(p => { progressMap[p.question_id] = p })
  const today = new Date().toISOString().split('T')[0]
  const scored = questionsData.map(q => {
    const p = progressMap[q.id]
    const isDue = !p || p.next_review_date <= today
    const updatedToday = p?.updated_at?.substring(0, 10) === today
    const acertadaHoy = updatedToday && p?.last_quality >= 3
    const priority = !p ? 0 : acertadaHoy ? 3 : isDue ? 1 : 2
    return { ...q, options: [...q.options].sort(() => Math.random() - 0.5), _priority: priority, _interval: p?.interval_days || 0 }
  }).sort((a, b) => {
    if (a._priority !== b._priority) return a._priority - b._priority
    if (a._interval !== b._interval) return a._interval - b._interval
    return Math.random() - 0.5
  })
  return limite ? scored.slice(0, limite) : scored
}

// ── Pantalla de resumen (fin normal o salida anticipada) ──────────────────
function ResumenSesion({
  session, questions, quiz, quizId, sessionId, modoNombre,
  nextReviewDate, hasMas, limite, remaining, continuar,
  esAnticipado, quizProgress, userStats,
}) {
  const total = questions.length
  const respondidas = session.correct + session.wrong + session.partial
  const xpGanados = session.correct * 10 + session.partial * 4
  const precision = respondidas > 0 ? Math.round((session.correct / respondidas) * 100) : 0
  const mensaje = getMensaje(sessionId)
  const fechaVuelta = formatFechaVuelta(nextReviewDate)

  // Nivel
  const xpTotal = (userStats?.xp_total || 0) + xpGanados
  const { nivelActual, nivelSiguiente, pct, xpFalta } = getNivel(xpTotal)
  const streak = userStats?.streak_current || 0

  // Badges desbloqueados esta sesión (lógica básica)
  const badges = []
  if (session.correct + session.wrong + session.partial > 0 && !userStats?.had_first_session) {
    badges.push({ icon: '⚡', nombre: 'Primera sesión', desc: 'Completaste tu primera sesión de estudio' })
  }
  if (streak >= 7) badges.push({ icon: '🔥', nombre: 'Racha de 7 días', desc: `Llevas ${streak} días seguidos estudiando` })
  if (precision >= 80 && respondidas >= 10) badges.push({ icon: '🎯', nombre: 'Precisión 80%', desc: 'Alcanzaste 80% de precisión en esta sesión' })

  // ¿Cumplió objetivo del planificador?
  const objetivoCumplido = quizProgress?.due_today > 0 && respondidas >= quizProgress.due_today

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/dashboard" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
      </nav>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '36px 24px' }}>

        {/* Título según tipo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {esAnticipado ? (
            <>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💾</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Sesión guardada</div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Completaste {respondidas} de {total} preguntas
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>¡Sesión completada!</div>
            </>
          )}
        </div>

        {/* Mensaje motivador */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
            "{mensaje}"
          </p>
        </div>

        {/* Publicidad */}
        <div style={{ width: '100%', height: '90px', background: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: '#d1d5db', letterSpacing: '0.5px' }}>PUBLICIDAD</span>
        </div>

        {/* Modo y quiz */}
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 14px 0' }}>
          {modoNombre} · {quiz?.title}
        </p>

        {/* Stats principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: '#059669' }}>{session.correct}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Correctas</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: '#ef4444' }}>{session.wrong}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Incorrectas</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: '#d97706' }}>{session.partial}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Parciales</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>{precision}%</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>precisión</div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '500', color: '#059669' }}>+{xpGanados} XP</div>
            <div style={{ fontSize: '11px', color: '#059669' }}>ganados esta sesión</div>
          </div>
        </div>

        {/* Progreso global del quiz */}
        {quizProgress && quizProgress.total > 0 && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '10px' }}>
              Progreso en {quiz?.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{quizProgress.seen}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>de {quizProgress.total} vistas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#059669' }}>{quizProgress.dominated}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>dominadas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#9ca3af' }}>{quizProgress.unseen}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>sin ver</div>
              </div>
            </div>
            {/* Barra de dominadas */}
            <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: quizProgress.dominated_pct + '%', background: '#059669', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', textAlign: 'right' }}>
              {quizProgress.dominated_pct}% dominado
            </div>
          </div>
        )}

        {/* Objetivo del día */}
        {objetivoCumplido && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46' }}>Objetivo del día cumplido</div>
              <div style={{ fontSize: '11px', color: '#059669' }}>Cubriste todas las preguntas pendientes de repaso.</div>
            </div>
          </div>
        )}

        {/* Racha */}
        {streak > 0 && (
          <div style={{ background: streak >= 7 ? '#fff7ed' : '#f9fafb', border: '1px solid', borderColor: streak >= 7 ? '#fed7aa' : '#e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🔥</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: streak >= 7 ? '#c2410c' : '#374151' }}>
                  {streak} {streak === 1 ? 'día' : 'días'} de racha
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {streak >= 30 ? '¡Racha increíble!' : streak >= 7 ? '¡Racha excelente!' : 'Seguí así para mantenerla'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nivel y XP */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel {nivelActual.nivel} · {nivelActual.nombre}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{xpTotal.toLocaleString('es-AR')} XP</span>
          </div>
          <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ height: '100%', width: pct + '%', background: '#059669', borderRadius: '4px', transition: 'width 0.5s' }} />
          </div>
          {nivelSiguiente ? (
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Faltan <strong>{xpFalta.toLocaleString('es-AR')} XP</strong> para {nivelSiguiente.nombre}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#059669' }}>¡Nivel máximo alcanzado!</div>
          )}
        </div>

        {/* Badges desbloqueados */}
        {badges.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#92400e', marginBottom: '10px' }}>🏆 Logros desbloqueados</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {badges.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>{b.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cuándo volver */}
        {fechaVuelta && (
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
            <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
              Volvé <strong>{fechaVuelta}</strong> para consolidar lo aprendido.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!esAnticipado && hasMas && limite && (
            <button onClick={continuar} style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
              Continuar con otras {Math.min(limite, remaining.length)} preguntas
            </button>
          )}
          {esAnticipado && quizProgress?.unseen > 0 && (
            <a href={'/estudiar/' + quizId} style={{ display: 'block', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '10px', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
              Retomar sesión
            </a>
          )}
          <a href={'/estudiar/' + quizId + '/inicio'} style={{ display: 'block', padding: '12px', fontSize: '14px', color: '#374151', background: '#f3f4f6', borderRadius: '10px', textDecoration: 'none', textAlign: 'center' }}>
            Cambiar modo de estudio
          </a>
          <a href="/dashboard" style={{ display: 'block', padding: '12px', fontSize: '14px', color: '#9ca3af', textDecoration: 'none', textAlign: 'center' }}>
            Ir al dashboard
          </a>
        </div>

      </div>
    </div>
  )
}

function EstudiarInner({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [questionsData, setQuestionsData] = useState([])
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const [session, setSession] = useState({ correct: 0, wrong: 0, partial: 0 })
  const [sessionId, setSessionId] = useState(null)
  const [finished, setFinished] = useState(false)
  const [exitFinished, setExitFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [modoN, setModoN] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportComment, setReportComment] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportSending, setReportSending] = useState(false)
  const [sessionDoneIds, setSessionDoneIds] = useState(new Set())
  const [nextReviewDate, setNextReviewDate] = useState(null)
  const [quizProgress, setQuizProgress] = useState(null)
  const [userStats, setUserStats] = useState(null)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)
      const nParam = searchParams.get('n')
      const limite = nParam && nParam !== 'all' && nParam !== 'new' ? parseInt(nParam) : null
      setModoN(nParam)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', id).single()
      setQuiz(quizData)
      const { data: qData } = await supabase.from('questions').select('*, options(*)').eq('quiz_id', id).order('order')
      const questionIds = qData?.map(q => q.id) || []
      const { data: progressData } = await supabase.from('user_question_progress').select('*').eq('user_id', user.id).in('question_id', questionIds)
      setQuestionsData(qData || [])
      let queue
      if (nParam === 'new') {
        const seenIds = new Set(progressData?.map(p => p.question_id) || [])
        const unseenQuestions = (qData || []).filter(q => !seenIds.has(q.id))
        queue = buildQueue(unseenQuestions, [], null)
      } else {
        queue = buildQueue(qData || [], progressData || [], limite)
      }
      setQuestions(queue)
      const { data: sess } = await supabase.from('study_sessions').insert({ user_id: user.id, quiz_id: id, total_questions: queue.length }).select().single()
      if (sess) setSessionId(sess.id)
      setLoading(false)
    }
    load()
  }, [])

  function toggleOption(optId) {
    if (confirmed) return
    const q = questions[current]
    if (q.type === 'single') setSelected([optId])
    else setSelected(prev => prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId])
  }

  async function confirm() {
    if (selected.length === 0) return
    setConfirmed(true)
    const q = questions[current]
    const correctIds = q.options.filter(o => o.is_correct).map(o => o.id)
    const allCorrectSelected = correctIds.every(id => selected.includes(id))
    const noWrongSelected = selected.every(id => correctIds.includes(id))
    let quality = 0
    let resultType = 'wrong'
    if (allCorrectSelected && noWrongSelected) { quality = 5; resultType = 'correct'; setSession(prev => ({ ...prev, correct: prev.correct + 1 })) }
    else if (selected.some(id => correctIds.includes(id))) { quality = 2; resultType = 'partial'; setSession(prev => ({ ...prev, partial: prev.partial + 1 })) }
    else { quality = 0; resultType = 'wrong'; setSession(prev => ({ ...prev, wrong: prev.wrong + 1 })) }
    const { data: existing } = await supabase.from('user_question_progress').select('*').eq('user_id', userId).eq('question_id', q.id).single()
    const rep = existing?.repetitions || 0
    const ease = existing?.easiness_factor || 2.5
    const intv = existing?.interval_days || 1
    const { repetitions, easiness, interval, nextDate } = sm2(quality, rep, ease, intv)
    await supabase.from('user_question_progress').upsert({
      user_id: userId, question_id: q.id, easiness_factor: easiness, interval_days: interval,
      repetitions, next_review_date: nextDate, last_quality: quality,
      times_correct: (existing?.times_correct || 0) + (resultType === 'correct' ? 1 : 0),
      times_wrong: (existing?.times_wrong || 0) + (resultType === 'wrong' ? 1 : 0),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,question_id' })
  }

  async function finishSession(correct, wrong, partial) {
    if (!sessionId) return
    const xp = correct * 10 + partial * 4
    await supabase.from('study_sessions').update({ finished_at: new Date().toISOString(), correct, wrong, partial, xp_earned: xp }).eq('id', sessionId)
    await supabase.rpc('update_xp_and_streak', { p_user_id: userId, p_xp_earned: xp })
  }

  async function fetchResumenData(questionIds, currentQuizId) {
    // Progreso global del quiz
    const { data: progress } = await supabase.rpc('get_quiz_progress', { p_user_id: userId, p_quiz_id: currentQuizId })
    setQuizProgress(progress)
    // Stats del usuario (XP, racha)
    const { data: userData } = await supabase.from('users').select('xp_total, streak_current').eq('id', userId).single()
    setUserStats(userData)
    // Próxima fecha de repaso
    if (questionIds?.length > 0) {
      const { data } = await supabase.from('user_question_progress').select('next_review_date').eq('user_id', userId).in('question_id', questionIds).order('next_review_date', { ascending: true }).limit(1)
      if (data && data.length > 0) setNextReviewDate(data[0].next_review_date)
    }
  }

  async function next() {
    if (current + 1 >= questions.length) {
      const newDoneIds = new Set([...sessionDoneIds, ...questions.map(q => q.id)])
      setSessionDoneIds(newDoneIds)
      await finishSession(session.correct, session.wrong, session.partial)
      await fetchResumenData(questions.map(q => q.id), quizId)
      setFinished(true)
    } else {
      setCurrent(prev => prev + 1)
      setSelected([])
      setConfirmed(false)
      setReportSent(false)
    }
  }

  async function handleExit() {
    await finishSession(session.correct, session.wrong, session.partial)
    await fetchResumenData(questions.map(q => q.id), quizId)
    setShowExitConfirm(false)
    setExitFinished(true)
  }

  async function continuar() {
    const limite = modoN && modoN !== 'all' && modoN !== 'new' ? parseInt(modoN) : null
    const questionIds = questionsData.map(q => q.id)
    const { data: progressData } = await supabase.from('user_question_progress').select('*').eq('user_id', userId).in('question_id', questionIds)
    const allDoneIds = new Set([...sessionDoneIds, ...questions.map(q => q.id)])
    const remainingData = questionsData.filter(q => !allDoneIds.has(q.id))
    if (remainingData.length === 0) { router.push('/dashboard'); return }
    const nextBatch = buildQueue(remainingData, progressData || [], limite)
    const { data: sess } = await supabase.from('study_sessions').insert({ user_id: userId, quiz_id: quizId, total_questions: nextBatch.length }).select().single()
    if (sess) setSessionId(sess.id)
    setQuestions(nextBatch)
    setCurrent(0)
    setSelected([])
    setConfirmed(false)
    setSession({ correct: 0, wrong: 0, partial: 0 })
    setFinished(false)
    setReportSent(false)
    setNextReviewDate(null)
  }

  async function sendReport() {
    if (!reportReason) return
    setReportSending(true)
    const q = questions[current]
    await supabase.from('question_reports').insert({ question_id: q.id, quiz_id: quizId, user_id: userId, reason: reportReason, comment: reportComment || null })
    setReportSending(false)
    setShowReport(false)
    setReportReason('')
    setReportComment('')
    setReportSent(true)
  }

  function getOptionStyle(opt) {
    const base = { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', border: '1px solid', borderRadius: '10px', cursor: confirmed ? 'default' : 'pointer', background: 'white', width: '100%', textAlign: 'left' }
    if (!confirmed) return { ...base, borderColor: selected.includes(opt.id) ? '#059669' : '#e5e7eb', background: selected.includes(opt.id) ? '#f0fdf4' : 'white' }
    if (opt.is_correct && selected.includes(opt.id)) return { ...base, borderColor: '#059669', background: '#f0fdf4' }
    if (opt.is_correct && !selected.includes(opt.id)) return { ...base, borderColor: '#d97706', background: '#fffbeb' }
    if (!opt.is_correct && selected.includes(opt.id)) return { ...base, borderColor: '#ef4444', background: '#fef2f2' }
    return { ...base, borderColor: '#e5e7eb' }
  }

  function getIndicatorStyle(opt) {
    const base = { width: '18px', height: '18px', border: '2px solid', flexShrink: 0, marginTop: '1px' }
    const shape = q?.type === 'single' ? { borderRadius: '50%' } : { borderRadius: '4px' }
    if (!confirmed) return { ...base, ...shape, borderColor: selected.includes(opt.id) ? '#059669' : '#d1d5db', background: selected.includes(opt.id) ? '#059669' : 'white' }
    if (opt.is_correct && selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#059669', background: '#059669' }
    if (opt.is_correct && !selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#d97706', background: '#fef3c7' }
    if (!opt.is_correct && selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#ef4444', background: '#ef4444' }
    return { ...base, ...shape, borderColor: '#d1d5db', background: 'white' }
  }

  if (loading) return <LoadingScreen />
  if (questions.length === 0) return <div style={{ padding: '40px', fontFamily: 'Arial', textAlign: 'center', color: '#9ca3af' }}>Este quiz no tiene preguntas todavía.</div>

  const modoNombres = { 'new': 'Solo nuevas', '10': 'Calentamiento', '30': 'Sesion express', '50': 'Sesion completa', '100': 'Maraton', 'all': 'Repaso total' }
  const modoNombre = modoNombres[modoN] || 'Sesion'
  const limite = modoN && modoN !== 'all' && modoN !== 'new' ? parseInt(modoN) : null
  const allDoneIds = finished ? new Set([...sessionDoneIds, ...questions.map(q => q.id)]) : new Set()
  const remaining = questionsData.filter(q => !allDoneIds.has(q.id))
  const hasMas = remaining.length > 0 && modoN !== 'new'

  const resumenProps = {
    session, questions, quiz, quizId, sessionId, modoNombre,
    nextReviewDate, hasMas, limite, remaining, continuar,
    quizProgress, userStats,
  }

  if (finished) return <ResumenSesion {...resumenProps} esAnticipado={false} />
  if (exitFinished) return <ResumenSesion {...resumenProps} esAnticipado={true} />

  const q = questions[current]
  const correctIds = q?.options?.filter(o => o.is_correct).map(o => o.id) || []
  const progress = (current / questions.length) * 100
  const allCorrect = confirmed && correctIds.every(id => selected.includes(id)) && selected.every(id => correctIds.includes(id))
  const someCorrect = confirmed && selected.some(id => correctIds.includes(id)) && !allCorrect

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      {showReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '90%' }}>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Reportar error en esta pregunta</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Tu reporte le llega al autor del quiz.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {['La respuesta correcta esta mal', 'Falta una opcion correcta', 'La pregunta esta mal redactada', 'La explicacion es incorrecta', 'Otro'].map(r => (
                <button key={r} onClick={() => setReportReason(r)} style={{ padding: '10px 14px', fontSize: '13px', border: '1px solid', borderColor: reportReason === r ? '#059669' : '#e5e7eb', borderRadius: '8px', background: reportReason === r ? '#f0fdf4' : 'white', color: reportReason === r ? '#065f46' : '#374151', textAlign: 'left', cursor: 'pointer', fontWeight: reportReason === r ? '500' : '400' }}>
                  {r}
                </button>
              ))}
            </div>
            <textarea placeholder="Comentario adicional (opcional)" value={reportComment} onChange={e => setReportComment(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'Arial, sans-serif', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={sendReport} disabled={!reportReason || reportSending} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: !reportReason || reportSending ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: !reportReason || reportSending ? 'not-allowed' : 'pointer' }}>
                {reportSending ? 'Enviando...' : 'Enviar reporte'}
              </button>
              <button onClick={() => { setShowReport(false); setReportReason(''); setReportComment('') }} style={{ flex: 1, padding: '10px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>¿Terminar la sesión?</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              Completaste {session.correct + session.wrong + session.partial} de {questions.length} preguntas. Tu progreso se va a guardar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleExit} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Sí, guardar y terminar
              </button>
              <button onClick={() => setShowExitConfirm(false)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Seguir estudiando
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '10px', fontWeight: '400' }}>{modoNombre}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: '#059669', fontWeight: '500' }}>✓ {session.correct}</span>
          <span style={{ color: '#ef4444', fontWeight: '500' }}>✗ {session.wrong}</span>
          <span style={{ color: '#d97706', fontWeight: '500' }}>~ {session.partial}</span>
          <button onClick={() => setShowExitConfirm(true)} style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}>
            Terminar
          </button>
        </div>
      </nav>

      <div style={{ height: '3px', background: '#f0f0f0' }}>
        <div style={{ height: '100%', width: progress + '%', background: '#059669', transition: 'width 0.3s' }} />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Pregunta {current + 1} de {questions.length}</span>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: q.type === 'single' ? '#e0f2fe' : '#fef3c7', color: q.type === 'single' ? '#0369a1' : '#92400e', fontWeight: '500' }}>
            {q.type === 'single' ? 'Una correcta' : 'Multiple correcta'}
          </span>
        </div>

        <div style={{ fontSize: '17px', fontWeight: '500', color: '#111', lineHeight: '1.5', marginBottom: '8px' }}>{q.body}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px' }}>
          {q.type === 'single' ? 'Selecciona una opcion y confirma.' : 'Selecciona todas las correctas y confirma.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {q.options.map(opt => (
            <button key={opt.id} style={getOptionStyle(opt)} onClick={() => toggleOption(opt.id)}>
              <div style={getIndicatorStyle(opt)} />
              <span style={{ fontSize: '14px', color: '#111', lineHeight: '1.4' }}>{opt.body}</span>
            </button>
          ))}
        </div>

        {confirmed && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b7280', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669', display: 'inline-block' }}></span>Correcta seleccionada</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fef3c7', border: '1px solid #d97706', display: 'inline-block' }}></span>Correcta no seleccionada</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444', display: 'inline-block' }}></span>Incorrecta seleccionada</span>
          </div>
        )}

        {!confirmed && (
          <button style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: selected.length === 0 ? '#9ca3af' : '#059669', border: 'none', borderRadius: '10px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer', marginBottom: '12px' }} onClick={confirm} disabled={selected.length === 0}>
            Confirmar respuesta
          </button>
        )}

        {confirmed && (
          <>
            <div style={{ background: allCorrect ? '#f0fdf4' : someCorrect ? '#fffbeb' : '#fef2f2', border: '1px solid', borderColor: allCorrect ? '#6ee7b7' : someCorrect ? '#fde68a' : '#fecaca', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c', marginBottom: q.explanation ? '8px' : '0' }}>
                {allCorrect ? '¡Correcto!' : someCorrect ? 'Casi. Te faltó alguna.' : 'Incorrecto.'}
              </div>
              {q.explanation && (
                <>
                  <div style={{ height: '1px', background: allCorrect ? '#6ee7b7' : someCorrect ? '#fde68a' : '#fecaca', margin: '8px 0' }} />
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explicación</div>
                  <div style={{ fontSize: '13px', color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c', lineHeight: '1.6' }}>{q.explanation}</div>
                </>
              )}
            </div>
            <button style={{ width: '100%', padding: '12px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px' }} onClick={next}>
              {current + 1 >= questions.length ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          {reportSent ? (
            <span style={{ fontSize: '12px', color: '#059669' }}>Reporte enviado. Gracias.</span>
          ) : (
            <button onClick={() => setShowReport(true)} style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Reportar error en esta pregunta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Estudiar({ params }) {
  return (
    <Suspense fallback={<div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>}>
      <EstudiarInner params={params} />
    </Suspense>
  )
}
