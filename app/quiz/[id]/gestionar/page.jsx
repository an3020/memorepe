'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GestionarQuiz({ params }) {
  const router = useRouter()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteQuiz, setShowDeleteQuiz] = useState(false)
  const [deleteQuestionId, setDeleteQuestionId] = useState(null)
  const [showDeleteSelected, setShowDeleteSelected] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [msg, setMsg] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingFromReportId, setEditingFromReportId] = useState(null)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deletingSelected, setDeletingSelected] = useState(false)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: quizData } = await supabase
        .from('quizzes').select('*').eq('id', id).eq('user_id', user.id).single()

      if (!quizData) { router.push('/dashboard'); return }

      setQuiz(quizData)
      setEditForm({
        title: quizData.title,
        description: quizData.description || '',
        notes: quizData.notes || '',
        category: quizData.category || '',
        visibility: quizData.visibility || 'public',
        subject: quizData.subject || '',
        faculty: quizData.faculty || '',
        teacher: quizData.teacher || '',
        year_course: quizData.year_course || '',
      })

      const { data: questionsData } = await supabase
        .from('questions').select('*, options(*)').eq('quiz_id', id).order('order')
      setQuestions(questionsData || [])

      const { data: reportsData } = await supabase
        .from('question_reports').select('*, questions(body)').eq('quiz_id', id).order('created_at', { ascending: false })
      setReports(reportsData || [])
      setLoading(false)
    }
    load()
  }, [])

  function toggleSelect(qId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(qId) ? next.delete(qId) : next.add(qId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)))
    }
  }

  function startEditQuestion(q, fromReportId = null) {
    setEditingQuestion({
      id: q.id,
      body: q.body,
      type: q.type,
      explanation: q.explanation || '',
      options: q.options.map(o => ({ ...o }))
    })
    setEditingFromReportId(fromReportId)
  }

  function updateEditOption(oIndex, field, value) {
    const updated = { ...editingQuestion }
    if (field === 'is_correct' && updated.type === 'single') {
      updated.options = updated.options.map((o, i) => ({ ...o, is_correct: i === oIndex }))
    } else {
      updated.options[oIndex] = { ...updated.options[oIndex], [field]: value }
    }
    setEditingQuestion(updated)
  }

  async function saveQuestion() {
    setSavingQuestion(true)
    const q = editingQuestion

    await supabase.from('questions')
      .update({ body: q.body, type: q.type, explanation: q.explanation })
      .eq('id', q.id)

    for (const opt of q.options) {
      await supabase.from('options')
        .update({ body: opt.body, is_correct: opt.is_correct })
        .eq('id', opt.id)
    }

    setQuestions(questions.map(question =>
      question.id === q.id
        ? { ...question, body: q.body, type: q.type, explanation: q.explanation, options: q.options }
        : question
    ))

    if (editingFromReportId) {
      await supabase.from('question_reports')
        .update({ status: 'resolved' })
        .eq('id', editingFromReportId)
      setReports(reports.map(r => r.id === editingFromReportId ? { ...r, status: 'resolved' } : r))
    }

    setEditingQuestion(null)
    setEditingFromReportId(null)
    setSavingQuestion(false)
    setMsg('Pregunta actualizada' + (editingFromReportId ? ' y reporte marcado como resuelto.' : '.'))
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveInfo() {
    setSaving(true)
    const { error } = await supabase.from('quizzes').update(editForm).eq('id', quizId)
    if (!error) {
      setQuiz({ ...quiz, ...editForm })
      setMsg('Guardado correctamente.')
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  async function changeVisibility(v) {
    await supabase.from('quizzes').update({ visibility: v }).eq('id', quizId)
    setQuiz({ ...quiz, visibility: v })
    setEditForm({ ...editForm, visibility: v })
    setMsg('Visibilidad actualizada.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteQuestion(qId) {
    await supabase.from('questions').delete().eq('id', qId)
    const updated = questions.filter(q => q.id !== qId)
    setQuestions(updated)
    await supabase.from('quizzes').update({ question_count: updated.length }).eq('id', quizId)
    setDeleteQuestionId(null)
    setMsg('Pregunta eliminada.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteSelected() {
    setDeletingSelected(true)
    const ids = [...selectedIds]
    for (const id of ids) {
      await supabase.from('questions').delete().eq('id', id)
    }
    const updated = questions.filter(q => !selectedIds.has(q.id))
    setQuestions(updated)
    await supabase.from('quizzes').update({ question_count: updated.length }).eq('id', quizId)
    setSelectedIds(new Set())
    setShowDeleteSelected(false)
    setDeletingSelected(false)
    setMsg(ids.length + ' preguntas eliminadas.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteAll() {
    setDeletingSelected(true)
    await supabase.from('questions').delete().eq('quiz_id', quizId)
    setQuestions([])
    await supabase.from('quizzes').update({ question_count: 0 }).eq('id', quizId)
    setSelectedIds(new Set())
    setShowDeleteAll(false)
    setDeletingSelected(false)
    setMsg('Todas las preguntas eliminadas.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteQuiz() {
    await supabase.from('quizzes').delete().eq('id', quizId)
    router.push('/dashboard')
  }

  async function resolveReport(reportId) {
    await supabase.from('question_reports').update({ status: 'resolved' }).eq('id', reportId)
    setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
  }

  const pendingReports = reports.filter(r => r.status === 'pending')
  const resolvedReports = reports.filter(r => r.status === 'resolved')

  const input = {
    width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb',
    borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      {showDeleteQuiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Eliminar quiz</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Esta accion es irreversible. Se eliminaran todas las preguntas y el progreso de los estudiantes.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={deleteQuiz} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Si, eliminar el quiz</button>
              <button onClick={() => setShowDeleteQuiz(false)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {deleteQuestionId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Eliminar pregunta</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Se eliminara esta pregunta y todo el progreso asociado.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => deleteQuestion(deleteQuestionId)} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Si, eliminar</button>
              <button onClick={() => setDeleteQuestionId(null)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSelected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Eliminar {selectedIds.size} preguntas</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Esta accion es irreversible.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={deleteSelected} disabled={deletingSelected} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {deletingSelected ? 'Eliminando...' : 'Si, eliminar'}
              </button>
              <button onClick={() => setShowDeleteSelected(false)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAll && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Eliminar todas las preguntas</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Se eliminaran las {questions.length} preguntas y todo el progreso asociado. El quiz quedara vacio.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={deleteAll} disabled={deletingSelected} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {deletingSelected ? 'Eliminando...' : 'Si, eliminar todas'}
              </button>
              <button onClick={() => setShowDeleteAll(false)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/dashboard" style={{ fontSize: '16px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
            Volver al dashboard
          </a>
          <a href={'/estudiar/' + quizId + '/inicio'} style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', textDecoration: 'none' }}>
            Estudiar
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{quiz.title}</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {questions.length} preguntas · creado el {quiz.created_at?.slice(0, 10)}
            </p>
          </div>
          <button onClick={() => setShowDeleteQuiz(true)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
            Eliminar quiz
          </button>
        </div>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        {pendingReports.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#b91c1c', marginBottom: '12px' }}>
              {pendingReports.length} reporte{pendingReports.length > 1 ? 's' : ''} pendiente{pendingReports.length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingReports.map(r => (
                <div key={r.id} style={{ background: 'white', borderRadius: '8px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#b91c1c', marginBottom: '4px' }}>{r.reason}</div>
                  {r.comment && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{r.comment}</div>}
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                    Pregunta: {r.questions?.body?.slice(0, 80)}{r.questions?.body?.length > 80 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.created_at?.slice(0, 10)}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const pregunta = questions.find(q => q.id === r.question_id)
                          if (pregunta) {
                            startEditQuestion(pregunta, r.id)
                            setTimeout(() => {
                              document.getElementById('question-' + pregunta.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }, 100)
                          }
                        }}
                        style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Editar pregunta
                      </button>
                      <button onClick={() => resolveReport(r.id)} style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        Marcar como resuelto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Visibilidad</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'public', label: 'Publico', desc: 'Cualquiera puede encontrarlo' },
              { value: 'link', label: 'Solo con link', desc: 'Solo quien tenga el link' },
              { value: 'private', label: 'Privado', desc: 'Solo vos' },
            ].map(v => (
              <button key={v.value} onClick={() => changeVisibility(v.value)} style={{ flex: 1, padding: '10px 8px', fontSize: '12px', border: '1px solid', borderColor: quiz.visibility === v.value ? '#059669' : '#e5e7eb', borderRadius: '8px', background: quiz.visibility === v.value ? '#d1fae5' : 'white', color: quiz.visibility === v.value ? '#065f46' : '#6b7280', fontWeight: quiz.visibility === v.value ? '500' : '400', cursor: 'pointer', textAlign: 'center' }}>
                <div>{v.label}</div>
                <div style={{ fontSize: '10px', marginTop: '2px', color: quiz.visibility === v.value ? '#059669' : '#9ca3af' }}>{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>Informacion del quiz</div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre *</label>
            <input style={input} value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Descripcion</label>
            <textarea style={{ ...input, minHeight: '60px', resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nota para los estudiantes</label>
            <textarea style={{ ...input, minHeight: '60px', resize: 'vertical' }} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categoria</label>
              <select style={input} value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="">Sin categoria</option>
                <option value="derecho">Derecho</option>
                <option value="medicina">Medicina</option>
                <option value="economia">Economia</option>
                <option value="historia">Historia</option>
                <option value="idiomas">Idiomas</option>
                <option value="exactas">Exactas</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Materia</label>
              <input style={input} value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Facultad</label>
              <input style={input} value={editForm.faculty} onChange={e => setEditForm({ ...editForm, faculty: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Docente</label>
              <input style={input} value={editForm.teacher} onChange={e => setEditForm({ ...editForm, teacher: e.target.value })} />
            </div>
          </div>
          <button onClick={saveInfo} disabled={saving} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: saving ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Preguntas ({questions.length})</div>
              {questions.length > 0 && (
                <button onClick={toggleSelectAll} style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}>
                  {selectedIds.size === questions.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {selectedIds.size > 0 && (
                <button onClick={() => setShowDeleteSelected(true)} style={{ fontSize: '11px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                  Eliminar seleccionadas ({selectedIds.size})
                </button>
              )}
              {questions.length > 0 && (
                <button onClick={() => setShowDeleteAll(true)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                  Eliminar todas
                </button>
              )}
              <a href={'/quiz/' + quizId + '/agregar'} style={{ fontSize: '12px', fontWeight: '500', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                + Agregar preguntas
              </a>
            </div>
          </div>

          {questions.map((q, idx) => {
            const qReports = reports.filter(r => r.question_id === q.id && r.status === 'pending')
            const isEditing = editingQuestion?.id === q.id
            const isSelected = selectedIds.has(q.id)

            return (
              <div key={q.id} id={'question-' + q.id} style={{ border: '1px solid', borderColor: isEditing ? '#059669' : isSelected ? '#0369a1' : qReports.length > 0 ? '#fecaca' : '#e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px', background: isSelected ? '#f0f9ff' : 'white' }}>
                {isEditing ? (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#059669', marginBottom: '10px' }}>
                      Editando pregunta {idx + 1}
                      {editingFromReportId && <span style={{ color: '#0369a1', marginLeft: '8px' }}>· Al guardar se marcará el reporte como resuelto</span>}
                    </div>
                    <textarea style={{ ...input, minHeight: '60px', resize: 'vertical', marginBottom: '10px' }} value={editingQuestion.body} onChange={e => setEditingQuestion({ ...editingQuestion, body: e.target.value })} />
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {['single', 'multiple'].map(t => (
                        <button key={t} onClick={() => setEditingQuestion({ ...editingQuestion, type: t })} style={{ padding: '4px 12px', fontSize: '11px', border: '1px solid', borderColor: editingQuestion.type === t ? '#059669' : '#e5e7eb', borderRadius: '20px', background: editingQuestion.type === t ? '#d1fae5' : 'white', color: editingQuestion.type === t ? '#065f46' : '#9ca3af', cursor: 'pointer' }}>
                          {t === 'single' ? 'Una correcta' : 'Multiple correcta'}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      {editingQuestion.options.map((opt, oIndex) => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div onClick={() => updateEditOption(oIndex, 'is_correct', !opt.is_correct)} style={{ width: '18px', height: '18px', borderRadius: editingQuestion.type === 'single' ? '50%' : '4px', border: '2px solid', borderColor: opt.is_correct ? '#059669' : '#d1d5db', background: opt.is_correct ? '#059669' : 'white', cursor: 'pointer', flexShrink: 0 }} />
                          <input style={{ ...input }} value={opt.body} onChange={e => updateEditOption(oIndex, 'body', e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Explicacion didactica (opcional)</label>
                      <textarea style={{ ...input, minHeight: '48px', resize: 'vertical', background: '#f9fafb' }} value={editingQuestion.explanation} onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })} placeholder="Explica por que es correcta esta respuesta..." />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveQuestion} disabled={savingQuestion} style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '500', color: 'white', background: savingQuestion ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        {savingQuestion ? 'Guardando...' : 'Guardar pregunta'}
                      </button>
                      <button onClick={() => { setEditingQuestion(null); setEditingFromReportId(null) }} style={{ padding: '7px 16px', fontSize: '12px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                      <div onClick={() => toggleSelect(q.id)} style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: isSelected ? '#0369a1' : '#d1d5db', background: isSelected ? '#0369a1' : 'white', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>{idx + 1} · {q.type === 'single' ? 'Una correcta' : 'Multiple correcta'}</span>
                          {qReports.length > 0 && (
                            <span style={{ fontSize: '10px', background: '#fef2f2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: '500' }}>
                              {qReports.length} reporte{qReports.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#111', lineHeight: '1.4', marginBottom: '6px' }}>{q.body}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {q.options?.map(opt => (
                            <div key={opt.id} style={{ fontSize: '12px', color: opt.is_correct ? '#059669' : '#9ca3af', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span>{opt.is_correct ? '✓' : '·'}</span>
                              <span>{opt.body}</span>
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div style={{ fontSize: '11px', color: '#6b7280', background: '#fffbeb', borderRadius: '6px', padding: '6px 8px', marginTop: '8px' }}>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => startEditQuestion(q)} style={{ fontSize: '11px', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => setDeleteQuestionId(q.id)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {resolvedReports.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af', marginBottom: '10px' }}>
              Reportes resueltos ({resolvedReports.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resolvedReports.map(r => (
                <div key={r.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e5e7eb', opacity: 0.6 }}>
                  <div style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>{r.reason}</div>
                  {r.comment && <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.comment}</div>}
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    {r.created_at?.slice(0, 10)} · Resuelto
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
