'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function Estudiar({ params }) {
  const router = useRouter()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState([])
  const [confirmed, setConfirmed] = useState(false)
  const [session, setSession] = useState({ correct: 0, wrong: 0, partial: 0 })
  const [sessionId, setSessionId] = useState(null)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [startTime] = useState(new Date())

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)

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

      const shuffled = questionsData?.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      })).sort(() => Math.random() - 0.5)

      setQuestions(shuffled || [])

      const { data: sess } = await supabase
        .from('study_sessions')
        .insert({ user_id: user.id, quiz_id: id, total_questions: shuffled?.length || 0 })
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
      .update({
        finished_at: new Date().toISOString(),
        correct,
        wrong,
        partial,
        xp_earned: xp
      })
      .eq('id', sessionId)
    await supabase
      .from('users')
      .update({ last_study_date: new Date().toISOString().split('T')[0] })
      .eq('id', userId)
  }

  async function next() {
    if (current + 1 >= questions.length) {
      await finishSession(session.correct, session.wrong, session.partial)
      setFinished(true)
    } else {
      setCurrent(prev => prev + 1)
      setSelected([])
      setConfirmed(false)
    }
  }

  async function handleExit() {
    await finishSession(session.correct, session.wrong, session.partial)
    router.push('/dashboard')
  }

  const s = {
    page: { minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 },
    logo: { fontSize: '16px', fontWeight: '500' },
    logoSpan: { color: '#059669' },
    navRight: { display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' },
    correct: { color: '#059669', fontWeight: '500' },
    wrong: { color: '#ef4444', fontWeight: '500' },
    partial: { color: '#d97706', fontWeight: '500' },
    progressWrap: { height: '3px', background: '#f0f0f0' },
    progressFill: { height: '100%', background: '#059669', transition: 'width 0.3s' },
    wrap: { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' },
    meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    counter: { fontSize: '12px', color: '#9ca3af' },
    typeBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1', fontWeight: '500' },
    typeBadgeMultiple: { fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', fontWeight: '500' },
    question: { fontSize: '17px', fontWeight: '500', color: '#111', lineHeight: '1.5', marginBottom: '8px' },
    hint: { fontSize: '12px', color: '#9ca3af', marginBottom: '24px' },
    options: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
    btnConfirm: { width: '100%', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px' },
    btnConfirmDisabled: { width: '100%', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#9ca3af', border: 'none', borderRadius: '10px', cursor: 'not-allowed', marginBottom: '12px' },
    btnNext: { width: '100%', padding: '12px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer' },
    feedbackCorrect: { background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px', marginBottom: '12px' },
    feedbackWrong: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '12px' },
    feedbackPartial: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '12px' },
    feedbackTitle: { fontSize: '14px', fontWeight: '500', marginBottom: '4px' },
    feedbackExplain: { fontSize: '13px', lineHeight: '1.6' },
    finishedWrap: { maxWidth: '480px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' },
    finishedEmoji: { fontSize: '48px', marginBottom: '16px' },
    finishedTitle: { fontSize: '22px', fontWeight: '500', color: '#111', marginBottom: '8px' },
    finishedSub: { fontSize: '14px', color: '#6b7280', marginBottom: '32px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' },
    statBox: { background: '#f9fafb', borderRadius: '10px', padding: '14px' },
    statVal: { fontSize: '24px', fontWeight: '500', color: '#111' },
    statLbl: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
    finishedActions: { display: 'flex', flexDirection: 'column', gap: '8px' },
    btnPrimary: { display: 'block', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none', border: 'none', cursor: 'pointer', width: '100%' },
    btnSecondary: { display: 'block', padding: '12px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', textDecoration: 'none', cursor: 'pointer', width: '100%' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' },
  }

  function getOptionStyle(opt) {
    const base = { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', border: '1px solid', borderRadius: '10px', cursor: confirmed ? 'default' : 'pointer', background: 'white', width: '100%', textAlign: 'left' }
    if (!confirmed) {
      return { ...base, borderColor: selected.includes(opt.id) ? '#059669' : '#e5e7eb', background: selected.includes(opt.id) ? '#f0fdf4' : 'white' }
    }
    if (opt.is_correct && selected.includes(opt.id)) return { ...base, borderColor: '#059669', background: '#f0fdf4' }
    if (opt.is_correct && !selected.includes(opt.id)) return { ...base, borderColor: '#d97706', background: '#fffbeb' }
    if (!opt.is_correct && selected.includes(opt.id)) return { ...base, borderColor: '#ef4444', background: '#fef2f2' }
    return { ...base, borderColor: '#e5e7eb' }
  }

  function getIndicatorStyle(opt) {
    const base = { width: '18px', height: '18px', border: '2px solid', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }
    const shape = q.type === 'single' ? { borderRadius: '50%' } : { borderRadius: '4px' }
    if (!confirmed) {
      return { ...base, ...shape, borderColor: selected.includes(opt.id) ? '#059669' : '#d1d5db', background: selected.includes(opt.id) ? '#059669' : 'white' }
    }
    if (opt.is_correct && selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#059669', background: '#059669' }
    if (opt.is_correct && !selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#d97706', background: '#fef3c7' }
    if (!opt.is_correct && selected.includes(opt.id)) return { ...base, ...shape, borderColor: '#ef4444', background: '#ef4444' }
    return { ...base, ...shape, borderColor: '#d1d5db', background: 'white' }
  }

  if (loading || questions.length === 0) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>

  if (finished) {
    const total = questions.length
    const pct = Math.round((session.correct / total) * 100)
    const xp = session.correct * 10 + session.partial * 4
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.logo}>memo<span style={s.logoSpan}>repe</span></div>
        </nav>
        <div style={s.finishedWrap}>
          <div style={s.finishedEmoji}>{pct >= 80 ? '🎯' : pct >= 50 ? '📈' : '💪'}</div>
          <h1 style={s.finishedTitle}>Sesión completada</h1>
          <p style={s.finishedSub}>{quiz?.title} · {total} preguntas</p>
          <div style={s.statsGrid}>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: '#059669' }}>{session.correct}</div>
              <div style={s.statLbl}>Correctas</div>
            </div>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: '#ef4444' }}>{session.wrong}</div>
              <div style={s.statLbl}>Incorrectas</div>
            </div>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: '#d97706' }}>{session.partial}</div>
              <div style={s.statLbl}>Parciales</div>
            </div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '8px', fontSize: '14px', color: '#111', fontWeight: '500' }}>
            Precisión: {pct}%
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px', marginBottom: '24px', fontSize: '14px', color: '#065f46', fontWeight: '500' }}>
            +{xp} XP ganados
          </div>
          <div style={s.finishedActions}>
            <button style={s.btnPrimary} onClick={() => { setCurrent(0); setSelected([]); setConfirmed(false); setSession({ correct: 0, wrong: 0, partial: 0 }); setFinished(false) }}>
              Repetir sesión
            </button>
            <button style={s.btnSecondary} onClick={() => router.push('/dashboard')}>
              Ir al dashboard
            </button>
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
    <div style={s.page}>

      {showExitConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>¿Salir de la sesión?</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Tu progreso hasta acá se va a guardar.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleExit}
                style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Sí, guardar y salir
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}
              >
                Seguir estudiando
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={s.nav}>
        <div style={s.logo}>memo<span style={s.logoSpan}>repe</span></div>
        <div style={s.navRight}>
          <span style={s.correct}>✓ {session.correct}</span>
          <span style={s.wrong}>✗ {session.wrong}</span>
          <span style={s.partial}>~ {session.partial}</span>
          <button
            onClick={() => setShowExitConfirm(true)}
            style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Terminar
          </button>
        </div>
      </nav>

      <div style={s.progressWrap}>
        <div style={{ ...s.progressFill, width: progress + '%' }} />
      </div>

      <div style={s.wrap}>
        <div style={s.meta}>
          <span style={s.counter}>Pregunta {current + 1} de {questions.length}</span>
          <span style={q.type === 'single' ? s.typeBadge : s.typeBadgeMultiple}>
            {q.type === 'single' ? 'Una correcta' : 'Múltiple correcta'}
          </span>
        </div>

        <div style={s.question}>{q.body}</div>
        <div style={s.hint}>
          {q.type === 'single' ? 'Seleccioná una opción y confirmá.' : 'Seleccioná todas las correctas y confirmá.'}
        </div>

        <div style={s.options}>
          {q.options.map(opt => (
            <button key={opt.id} style={getOptionStyle(opt)} onClick={() => toggleOption(opt.id)}>
              <div style={getIndicatorStyle(opt)} />
              <span style={{ fontSize: '14px', color: '#111', lineHeight: '1.4' }}>{opt.body}</span>
            </button>
          ))}
        </div>

        {confirmed && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6b7280', marginBottom: '12px', flexWrap: 'wrap' }}>
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
            style={selected.length === 0 ? s.btnConfirmDisabled : s.btnConfirm}
            onClick={confirm}
            disabled={selected.length === 0}
          >
            Confirmar respuesta
          </button>
        )}

        {confirmed && (
          <>
            <div style={allCorrect ? s.feedbackCorrect : someCorrect ? s.feedbackPartial : s.feedbackWrong}>
              <div style={{ ...s.feedbackTitle, color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c' }}>
                {allCorrect ? '¡Correcto!' : someCorrect ? 'Casi. Te faltó alguna.' : 'Incorrecto.'}
              </div>
              {q.explanation && (
                <>
                  <div style={{ height: '1px', background: allCorrect ? '#6ee7b7' : someCorrect ? '#fde68a' : '#fecaca', margin: '8px 0' }} />
                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explicación</div>
                  <div style={{ ...s.feedbackExplain, color: allCorrect ? '#065f46' : someCorrect ? '#92400e' : '#b91c1c' }}>
                    {q.explanation}
                  </div>
                </>
              )}
            </div>
            <button style={s.btnNext} onClick={next}>
              {current + 1 >= questions.length ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}