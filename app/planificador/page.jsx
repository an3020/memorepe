'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MINUTOS_POR_PREGUNTA = 1.5
const FACTOR_SEGURIDAD = 1.3
const DIAS_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const TIEMPOS = [15, 30, 45, 60, 90]

export default function Planificador() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [archivedExams, setArchivedExams] = useState([])
  const [myQuizzes, setMyQuizzes] = useState([])
  const [favoriteQuizzes, setFavoriteQuizzes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)
  const [msg, setMsg] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [warning, setWarning] = useState(null)

  const emptyForm = { title: '', exam_date: '', weekly_reminder: false, selectedQuizzes: [], dias: [0, 1, 2, 3, 4], minutos: 30 }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)

      const { data: examsData } = await supabase
        .from('exams')
        .select('*, exam_quizzes(quiz_id)')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: true })

      const active = []
      const archived = []
      const today = new Date().toISOString().split('T')[0]

      for (const exam of examsData || []) {
        const { data: plan } = await supabase
          .rpc('get_exam_plan', { p_exam_id: exam.id, p_user_id: user.id })
        if (exam.exam_date < today) {
          archived.push({ ...exam, plan })
        } else {
          active.push({ ...exam, plan })
        }
      }

      setExams(active)
      setArchivedExams(archived)

      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, title, question_count, subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setMyQuizzes(quizzesData || [])

      const { data: favsData } = await supabase
        .from('favorites')
        .select('quiz_id, quizzes(id, title, question_count, subject)')
        .eq('user_id', user.id)
      setFavoriteQuizzes(favsData?.map(f => f.quizzes).filter(Boolean) || [])

      setLoading(false)
    }
    load()
  }, [])

  async function searchQuizzes(q) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('quizzes')
      .select('id, title, question_count, subject')
      .eq('visibility', 'public')
      .or('title.ilike.%' + q + '%,subject.ilike.%' + q + '%')
      .limit(5)
    setSearchResults(data || [])
    setSearching(false)
  }

  function toggleDia(idx) {
    setForm(prev => {
      const dias = prev.dias.includes(idx)
        ? prev.dias.filter(d => d !== idx)
        : [...prev.dias, idx]
      return { ...prev, dias }
    })
  }

  function toggleQuiz(quiz) {
    setForm(prev => {
      const already = prev.selectedQuizzes.find(q => q.id === quiz.id)
      if (already) return { ...prev, selectedQuizzes: prev.selectedQuizzes.filter(q => q.id !== quiz.id) }
      if (prev.selectedQuizzes.length >= 3) {
        setMsg('En el plan gratuito podés agregar hasta 3 sets de preguntas.')
        setTimeout(() => setMsg(''), 3000)
        return prev
      }
      return { ...prev, selectedQuizzes: [...prev.selectedQuizzes, quiz] }
    })
  }

  function calcularPlan(totalPreguntas, diasSeleccionados, minutosDisponibles, fechaExamen) {
    const hoy = new Date()
    const examen = new Date(fechaExamen + 'T12:00:00')
    const diasTotales = Math.ceil((examen - hoy) / (1000 * 60 * 60 * 24))
    const semanas = Math.ceil(diasTotales / 7)
    const diasEstudio = semanas * diasSeleccionados.length
    const preguntasPorDia = Math.ceil((totalPreguntas * FACTOR_SEGURIDAD) / Math.max(diasEstudio, 1))
    const minutosNecesarios = preguntasPorDia * MINUTOS_POR_PREGUNTA
    const alcanza = minutosNecesarios <= minutosDisponibles
    if (!alcanza) {
      const minutosNecesariosConDias = Math.ceil((totalPreguntas * FACTOR_SEGURIDAD * MINUTOS_POR_PREGUNTA) / (diasSeleccionados.length * semanas))
      const tiempoSugerido = TIEMPOS.find(t => t >= minutosNecesariosConDias) || 90
      const diasNecesarios = Math.ceil((totalPreguntas * FACTOR_SEGURIDAD * MINUTOS_POR_PREGUNTA) / minutosDisponibles / semanas)
      return { alcanza: false, preguntasPorDia, diasSugeridos: Math.min(diasNecesarios, 7), tiempoSugerido }
    }
    return { alcanza: true, preguntasPorDia }
  }

  function validarYMostrarWarning() {
    if (!form.exam_date || form.selectedQuizzes.length === 0 || form.dias.length === 0) return true
    const total = form.selectedQuizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)
    const resultado = calcularPlan(total, form.dias, form.minutos, form.exam_date)
    if (!resultado.alcanza) { setWarning(resultado); return false }
    setWarning(null)
    return true
  }

  async function saveExam(force = false) {
    if (!form.title.trim() || !form.exam_date || form.dias.length === 0) return
    if (!force && !validarYMostrarWarning()) return
    setSaving(true)
    setWarning(null)

    const { data: exam } = await supabase
      .from('exams')
      .insert({ user_id: userId, title: form.title, exam_date: form.exam_date, weekly_email: form.weekly_reminder, status: 'active' })
      .select().single()

    if (exam && form.selectedQuizzes.length > 0) {
      await supabase.from('exam_quizzes').insert(form.selectedQuizzes.map(q => ({ exam_id: exam.id, quiz_id: q.id })))
    }

    const { data: plan } = await supabase.rpc('get_exam_plan', { p_exam_id: exam.id, p_user_id: userId })
    setExams(prev => [...prev, { ...exam, exam_quizzes: form.selectedQuizzes.map(q => ({ quiz_id: q.id })), plan }]
      .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)))

    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
  }

  async function updateExam(examId, force = false) {
    if (!form.title.trim() || !form.exam_date || form.dias.length === 0) return
    if (!force && !validarYMostrarWarning()) return
    setSaving(true)
    setWarning(null)

    await supabase.from('exams').update({ title: form.title, exam_date: form.exam_date, weekly_email: form.weekly_reminder }).eq('id', examId)
    await supabase.from('exam_quizzes').delete().eq('exam_id', examId)

    if (form.selectedQuizzes.length > 0) {
      await supabase.from('exam_quizzes').insert(form.selectedQuizzes.map(q => ({ exam_id: examId, quiz_id: q.id })))
    }

    const { data: plan } = await supabase.rpc('get_exam_plan', { p_exam_id: examId, p_user_id: userId })
    setExams(prev => prev.map(e => e.id === examId
      ? { ...e, title: form.title, exam_date: form.exam_date, weekly_email: form.weekly_reminder, exam_quizzes: form.selectedQuizzes.map(q => ({ quiz_id: q.id })), plan }
      : e
    ).sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)))

    setEditingExamId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  function startEdit(exam) {
    const quizIds = exam.exam_quizzes?.map(eq => eq.quiz_id) || []
    const allQuizzes = [...myQuizzes, ...favoriteQuizzes]
    const selected = quizIds.map(id => allQuizzes.find(q => q.id === id)).filter(Boolean)
    setForm({
      title: exam.title,
      exam_date: exam.exam_date,
      weekly_reminder: exam.weekly_email || false,
      selectedQuizzes: selected,
      dias: [0, 1, 2, 3, 4],
      minutos: 30,
    })
    setEditingExamId(exam.id)
    setWarning(null)
  }

  function cancelEdit() {
    setEditingExamId(null)
    setForm(emptyForm)
    setWarning(null)
  }

  async function deleteExam(examId) {
    await supabase.from('exams').delete().eq('id', examId)
    setExams(prev => prev.filter(e => e.id !== examId))
  }

  function modeColor(mode) {
    if (mode === 'Calentamiento') return { bg: '#e0f2fe', color: '#0369a1' }
    if (mode === 'Sesion express') return { bg: '#d1fae5', color: '#065f46' }
    if (mode === 'Sesion completa') return { bg: '#ede9fe', color: '#5b21b6' }
    if (mode === 'Maraton') return { bg: '#fef3c7', color: '#92400e' }
    return { bg: '#f3f4f6', color: '#374151' }
  }

  function daysLeftText(days) {
    if (days === 0) return 'Hoy es el examen'
    if (days === 1) return 'Mañana es el examen'
    if (days < 0) return 'Examen pasado'
    return days + ' días para el examen'
  }

  const input = { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }

  const allAvailableQuizzes = [
    ...myQuizzes.map(q => ({ ...q, tag: 'Mio' })),
    ...favoriteQuizzes.filter(f => !myQuizzes.find(m => m.id === f.id)).map(q => ({ ...q, tag: 'Favorito' })),
  ]

  function ExamForm({ onSave, onCancel, isEdit }) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>{isEdit ? 'Editar examen' : 'Nuevo examen'}</div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre del examen *</label>
          <input style={input} placeholder="Ej: Penal Económico — Junio 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha del examen *</label>
          <input style={input} type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>¿Qué días vas a estudiar?</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DIAS_LABELS.map((dia, idx) => (
              <button key={idx} onClick={() => toggleDia(idx)} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: '500', border: '1px solid', borderColor: form.dias.includes(idx) ? '#059669' : '#e5e7eb', borderRadius: '8px', background: form.dias.includes(idx) ? '#d1fae5' : 'white', color: form.dias.includes(idx) ? '#065f46' : '#9ca3af', cursor: 'pointer' }}>
                {dia}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{form.dias.length} día{form.dias.length !== 1 ? 's' : ''} por semana</p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>¿Cuánto tiempo por sesión?</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {TIEMPOS.map(t => (
              <button key={t} onClick={() => setForm({ ...form, minutos: t })} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: '500', border: '1px solid', borderColor: form.minutos === t ? '#059669' : '#e5e7eb', borderRadius: '8px', background: form.minutos === t ? '#d1fae5' : 'white', color: form.minutos === t ? '#065f46' : '#9ca3af', cursor: 'pointer' }}>
                {t}min
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
            Sets de preguntas <span style={{ color: '#9ca3af' }}>(hasta 3 en plan gratuito)</span>
          </label>
          {allAvailableQuizzes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {allAvailableQuizzes.map(quiz => {
                const selected = form.selectedQuizzes.find(q => q.id === quiz.id)
                return (
                  <div key={quiz.id} onClick={() => toggleQuiz(quiz)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid', borderColor: selected ? '#059669' : '#e5e7eb', borderRadius: '8px', background: selected ? '#f0fdf4' : 'white', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: selected ? '#059669' : '#d1d5db', background: selected ? '#059669' : 'white', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#111', fontWeight: selected ? '500' : '400' }}>{quiz.title}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{quiz.question_count} preguntas{quiz.subject ? ' · ' + quiz.subject : ''}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: quiz.tag === 'Mio' ? '#e0f2fe' : '#fef3c7', color: quiz.tag === 'Mio' ? '#0369a1' : '#92400e' }}>{quiz.tag}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <input style={input} placeholder="Buscar sets públicos..." value={searchQ} onChange={e => { setSearchQ(e.target.value); searchQuizzes(e.target.value) }} />
          </div>
          {searching && <p style={{ fontSize: '12px', color: '#9ca3af' }}>Buscando...</p>}
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {searchResults.filter(r => !allAvailableQuizzes.find(a => a.id === r.id)).map(quiz => {
                const selected = form.selectedQuizzes.find(q => q.id === quiz.id)
                return (
                  <div key={quiz.id} onClick={() => toggleQuiz(quiz)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid', borderColor: selected ? '#059669' : '#e5e7eb', borderRadius: '8px', background: selected ? '#f0fdf4' : 'white', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: selected ? '#059669' : '#d1d5db', background: selected ? '#059669' : 'white', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#111' }}>{quiz.title}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{quiz.question_count} preguntas{quiz.subject ? ' · ' + quiz.subject : ''}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#374151' }}>Público</span>
                  </div>
                )
              })}
            </div>
          )}
          {allAvailableQuizzes.length === 0 && searchResults.length === 0 && !searching && (
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>No tenés sets propios ni favoritos. <a href="/explorar" style={{ color: '#059669' }}>Explorá quizzes públicos</a> y guardalos como favoritos.</p>
          )}
        </div>

        {warning && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#b91c1c', marginBottom: '6px' }}>⚠️ Con tu configuración actual no vas a llegar a cubrir todo el material.</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
              Te sugerimos estudiar al menos <strong>{warning.diasSugeridos} días por semana</strong> con sesiones de <strong>{warning.tiempoSugerido} minutos</strong>. Esto incluye un margen para los días que no puedas estudiar.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setForm(prev => ({ ...prev, dias: Array.from({ length: warning.diasSugeridos }, (_, i) => i), minutos: warning.tiempoSugerido })); setWarning(null) }} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Usar configuración sugerida
              </button>
              <button onClick={() => onSave(true)} style={{ flex: 1, padding: '8px', fontSize: '12px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Continuar igual
              </button>
            </div>
          </div>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📧</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', marginBottom: '2px' }}>Recordatorio semanal</div>
            <div style={{ fontSize: '11px', color: '#059669' }}>Cada lunes te mandamos qué estudiar esa semana para llegar al examen.</div>
          </div>
          <input type="checkbox" checked={form.weekly_reminder} onChange={e => setForm({ ...form, weekly_reminder: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
        </div>

        {!warning && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onSave(false)} disabled={saving || !form.title.trim() || !form.exam_date || form.dias.length === 0} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: saving || !form.title.trim() || !form.exam_date || form.dias.length === 0 ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plan de estudio'}
            </button>
            <button onClick={onCancel} style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>memo<span style={{ color: '#059669' }}>repe</span></div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Dashboard</a>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/planificador" style={{ fontSize: '13px', fontWeight: '500', color: '#111', textDecoration: 'none' }}>Planificador</a>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Planificador de exámenes</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Organizá tu estudio y llegá preparado al examen.</p>
          </div>
          {!showForm && !editingExamId && (
            <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              + Nuevo examen
            </button>
          )}
        </div>

        {msg && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e', marginBottom: '16px' }}>
            {msg}
          </div>
        )}

        {showForm && (
          <ExamForm
            onSave={(force) => saveExam(force)}
            onCancel={() => { setShowForm(false); setForm(emptyForm); setWarning(null) }}
            isEdit={false}
          />
        )}

        {exams.length === 0 && !showForm && (
          <div style={{ border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>No tenés exámenes planificados</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>Creá tu primer plan y Memorepe te dice cuánto estudiar cada día para llegar preparado.</p>
            <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Crear mi primer plan
            </button>
          </div>
        )}

        {exams.map(exam => {
          const p = exam.plan
          const mc = p ? modeColor(p.recommended_mode) : { bg: '#f3f4f6', color: '#374151' }
          const isEditing = editingExamId === exam.id

          if (isEditing) {
            return (
              <ExamForm
                key={exam.id}
                onSave={(force) => updateExam(exam.id, force)}
                onCancel={cancelEdit}
                isEdit={true}
              />
            )
          }

          return (
            <div key={exam.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{exam.title}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(exam.exam_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    <span style={{ color: p?.days_left <= 7 ? '#ef4444' : p?.days_left <= 14 ? '#d97706' : '#059669', fontWeight: '500' }}>
                      {p ? daysLeftText(p.days_left) : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(exam)} style={{ fontSize: '11px', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => deleteExam(exam.id)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                </div>
              </div>

              {p && p.total_questions > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>{p.total_questions}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Preguntas totales</div>
                    </div>
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '500', color: '#059669' }}>{p.dominated_pct}%</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Dominadas</div>
                    </div>
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: '500', color: p.due_today > 0 ? '#d97706' : '#111' }}>{p.due_today}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Para repasar hoy</div>
                    </div>
                  </div>

                  <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ height: '100%', width: p.dominated_pct + '%', background: '#059669', borderRadius: '4px' }} />
                  </div>

                  {p.days_left > 0 && (
                    <div style={{ background: mc.bg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: mc.color, marginBottom: '2px', fontWeight: '500' }}>Recomendación para hoy</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: mc.color }}>{p.recommended_mode} · {p.questions_per_day} preguntas</div>
                        <div style={{ fontSize: '11px', color: mc.color, opacity: 0.8, marginTop: '2px' }}>
                          {p.unseen} preguntas sin dominar · {p.days_left} días disponibles
                        </div>
                      </div>
                      {exam.exam_quizzes?.length > 0 && (
                        <a href={'/estudiar/' + exam.exam_quizzes[0].quiz_id + '?n=' + p.questions_per_day} style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: '#059669', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', flexShrink: 0 }}>
                          Estudiar ahora
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {p && p.total_questions === 0 && (
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                  No hay sets de preguntas asociados. Hacé clic en Editar para agregar.
                </div>
              )}
            </div>
          )
        })}

        {archivedExams.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af', marginBottom: '12px' }}>Exámenes pasados ({archivedExams.length})</div>
            {archivedExams.map(exam => (
              <div key={exam.id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '16px', marginBottom: '10px', opacity: 0.6 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>{exam.title}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(exam.exam_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {exam.plan && ' · ' + exam.plan.dominated_pct + '% dominadas al finalizar'}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
