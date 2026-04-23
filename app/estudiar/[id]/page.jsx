'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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

function EstudiarInner({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [allQuestions, setAllQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const [session, setSession] = useState({ correct: 0, wrong: 0, partial: 0 })
  const [sessionId, setSessionId] = useState(null)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [modoN, setModoN] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportComment, setReportComment] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportSending, setReportSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)

      const nParam = searchParams.get('n')
      const limite = nParam && nParam !== 'all' ? parseInt(nParam) : null
      setModoN(nParam)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single()
      setQuiz(quizData)

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*, options(*)')
        .eq('quiz_id', id)
        .order('order')

      const { data: progressData } = await supabase
        .from('user_question_progress')
        .select('*')
        .eq('user_id', user.id)

      const progressMap = {}
      progressData?.forEach(p => { progressMap[p.question_id] = p })

      const today = new Date().toISOString().split('T')[0]

      const shuffled = questionsData?.map(q => {
        const p = progressMap[q.id]
        const isDue = !p || p.next_review_date <= today
        const priority = !p ? 0 : isDue ? 1 : 2
        return {
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5),
          _priority: priority,
          _interval: p?.interval_days || 0,
        }
      }).sort((a, b) => a._priority - b._priority || a._interval - b._interval)

      setAllQuestions(shuffled || [])
      const limited = limite ? shuffled?.slice(0, limite) : shuffled
      setQuestions(limited || [])

      const { data: sess } = await supabase
        .from('study_sessions')
        .insert({ user_id: user.id, quiz_id: id, total_questions: limited?.length || 0 })
        .select()
        .single()
      if (sess) setSessionId(sess.id)

      setLoading(false)
    }
    load()
  }, [])

  function toggleOption(optId) {
    if (confirmed) return
    const q = questions[current]
    if (q.type === 'single') {
      setSelected([optId])
    } else {
      setSelected(prev =>
        prev.includes(optId)
          ? prev.filter(id => id !== optId)
          : [...prev, optId]
      )
    }
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

    if (allCorrectSelected && noWrongSelected) {
      quality = 5
      resultType = 'correct'
      setSession(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else if (selected.some(id => correctIds.includes(id))) {
      quality = 2
      resultType = 'partial'
      setSession(prev => ({ ...prev, partial: prev.partial + 1 }))
    } else {
      quality = 0
      resultType = 'wrong'
      setSession(prev => ({ ...prev, wrong: prev.wrong + 1 }))
    }

    const { data: existing } = await supabase
      .from('user_question_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', q.id)
      .single()

    const rep = existing?.repetitions || 0
    const ease = existing?.easiness_factor || 2.5
    const intv = existing?.interval_days || 1
    const { repetitions, easiness, interval, nextDate } = sm2(quality, rep, ease, intv)

    await supabase
      .from('user_question_progress')
      .upsert({
        user_id: userId,
        question_id: q.id,
        easiness_factor: easiness,
        interval_days: interval,
        repetitions,
        next_review_date: nextDate,
        last_quality: quality,
        times_correct: (existing?.times_correct || 0) + (resultType === 'correct' ? 1 : 0),
        times_wrong: (existing?.times_wrong || 0) + (resultType === 'wrong' ? 1 : 0),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,question_id' })
  }

  async function finishSession(correct, wrong, partial) {
    if (!sessionId) return
    const xp = correct * 10 + partial * 4
    await supabase
      .from('study_sessions')
      .update({ finished_at: new Date().toISOString(), correct, wrong, partial, xp_earned: xp })
      .eq('id', sessionId)
    const { error } = await supabase.rpc('update_streak', { p_user_id: userId })
    console.log('update_streak resultado:', error)
  }

  async function next() {
    if (current + 1 >= questions.length) {
      await finishSession(session.correct, session.wrong, session.partial)
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
    router.push('/dashboard')
  }

  async function continuar() {
    const limite = modoN && modoN !== 'all' ? parseInt(modoN) : null
    const doneIds = new Set(questions.map(q => q.id))
    const remaining = allQuestions.filter(q => !doneIds.has(q.id))
    if (remaining.length === 0) { router.push('/dashboard'); return }
    const nextBatch = limite ? remaining.slice(0, limite) : remaining
    const { data: sess } = await supabase
      .from('study_sessions')
      .insert({ user_id: userId, quiz_id: quizId, total_questions: nextBatch.length })
      .select()
      .single()
    if (sess) setSessionId(sess.id)
    setQuestions(nextBatch)
    setCurrent(0)
    setSelected([])
    setConfirmed(false)
    setSession({ correct: 0, wrong: 0, partial: 0 })
    setFinished(false)
    setReportSent(false)
  }

  async function sendReport() {
    if (!reportReason) return
    setReportSending(true)
    const q = questions[current]
    await supabase.from('question_reports').insert({
      question_id: q.id,
      quiz_id: quizId,
      user_id: userId,
      reason: reportReason,
      comment: reportComment || null,
    })
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

  if (loading || questions.length === 0) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>

  const modoNombres = { '10': 'Calentamiento', '30': 'Sesion express', '50': 'Sesion completa', '100': 'Maraton', 'all': 'Repaso total' }
  const modoNombre = modoNombres[modoN] || 'Sesion'
  const limite = modoN && modoN !== 'all' ? parseInt(modoN) : null
  const doneIds = finished ? new Set(questions.map(q => q.id)) : new Set()
  const remaining = allQuestions.filter(q => !doneIds.has(q.id))
  const hasMas = remaining.length > 0

  if (finished) {
    const total = questions.length
    const pct = Math.round((session.correct / total) * 100)
    const xp = session.correct * 10 + session.partial * 4
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>memo<span style={{ color: '#059669' }}>repe</span></div>
        </nav>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{pct >= 80 ? '🎯' : pct >= 50 ? '📈' : '💪'}</div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{modoNombre} completado</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>{quiz?.title} · {total} preguntas</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '24px', fontWeight: '500', color: '#059669' }}>{session.correct}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Correctas</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '24px', fontWeight: '500', color: '#ef4444' }}>{session.wrong}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Incorrectas</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '24px', fontWeight: '500', color: '#d97706' }}>{session.partial}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Parciales</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '28px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>{pct}%</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Precision</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: '500', color: '#059669' }}>+{xp} XP</div>
              <div style={{ fontSize: '11px', color: '#059669' }}>Ganados</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hasMas && limite && (
              <button onClick={continuar} style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                Continuar con otras {Math.min(limite, remaining.length)} preguntas
              </button>
            )}
            <a href={'/estudiar/' + quizId + '/inicio'} style={{ display: 'block', padding: '12px', fontSize: '14px', color: '#374151', background: '#f3f4f6', borderRadius: '10px', textDecoration: 'none' }}>
              Cambiar modo de estudio
            </a>
            <a href="/dashboard" style={{ display: 'block', padding: '12px', fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>
              Ir al dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

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
              {[
                'La respuesta correcta esta mal',
                'Falta una opcion correcta',
                'La pregunta esta mal redactada',
                'La explicacion es incorrecta',
                'Otro',
              ].map(r => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  style={{ padding: '10px 14px', fontSize: '13px', border: '1px solid', borderColor: reportReason === r ? '#059669' : '#e5e7eb', borderRadius: '8px', background: reportReason === r ? '#f0fdf4' : 'white', color: reportReason === r ? '#065f46' : '#374151', textAlign: 'left', cursor: 'pointer', fontWeight: reportReason === r ? '500' : '400' }}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Comentario adicional (opcional)"
              value={reportComment}
              onChange={e => setReportComment(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'Arial, sans-serif', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={sendReport}
                disabled={!reportReason || reportSending}
                style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: !reportReason || reportSending ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: !reportReason || reportSending ? 'not-allowed' : 'pointer' }}
              >
                {reportSending ? 'Enviando...' : 'Enviar reporte'}
              </button>
              <button
                onClick={() => { setShowReport(false); setReportReason(''); setReportComment('') }}
                style={{ flex: 1, padding: '10px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Salir de la sesion?</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Tu progreso hasta aca se va a guardar.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleExit} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Si, guardar y salir
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669', display: 'inline-block' }}></span>
              Correcta seleccionada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#fef3c7', border: '1px solid #d97706', display: 'inline-block' }}></span>
              Correcta no seleccionada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444', display: 'inline-block' }}></span>
              Incorrecta seleccionada
            </span>
          </div>
        )}

        {!confirmed && (
          <button
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: selected.length === 0 ? '#9ca3af' : '#059669', border: 'none', borderRadius: '10px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer', marginBottom: '12px' }}
            onClick={confirm}
            disabled={selected.length === 0}
          >
            Confirmar respuesta
          </button>
        )}

        {confirmed && (
          <>
            <div style={{ background: allCorrect ? '#f0fdf4' : someCorrect ? '#fffbeb' : '#fef2f2', border: '1px solid', borderColor: allCorrect ? '#6ee7b7' : someCorrect ? '#fde68a' : '#fecaca', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c', marginBottom: q.explanation ? '8px' : '0' }}>
                {allCorrect ? 'Correcto!' : someCorrect ? 'Casi. Te falto alguna.' : 'Incorrecto.'}
              </div>
              {q.explanation && (
                <>
                  <div style={{ height: '1px', background: allCorrect ? '#6ee7b7' : someCorrect ? '#fde68a' : '#fecaca', margin: '8px 0' }} />
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explicacion</div>
                  <div style={{ fontSize: '13px', color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c', lineHeight: '1.6' }}>{q.explanation}</div>
                </>
              )}
            </div>
            <button
              style={{ width: '100%', padding: '12px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px' }}
              onClick={next}
            >
              {current + 1 >= questions.length ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          {reportSent ? (
            <span style={{ fontSize: '12px', color: '#059669' }}>Reporte enviado. Gracias.</span>
          ) : (
            <button
              onClick={() => setShowReport(true)}
              style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
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
