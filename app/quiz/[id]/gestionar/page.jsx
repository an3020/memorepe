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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteQuiz, setShowDeleteQuiz] = useState(false)
  const [deleteQuestionId, setDeleteQuestionId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

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
        .from('questions')
        .select('*, options(*)')
        .eq('quiz_id', id)
        .order('order')

      setQuestions(questionsData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveInfo() {
    setSaving(true)
    const { error } = await supabase
      .from('quizzes')
      .update(editForm)
      .eq('id', quizId)

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

  async function deleteQuiz() {
    await supabase.from('quizzes').delete().eq('id', quizId)
    router.push('/dashboard')
  }

  const input = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    color: '#111',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
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
              <button onClick={deleteQuiz} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Si, eliminar el quiz
              </button>
              <button onClick={() => setShowDeleteQuiz(false)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteQuestionId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Eliminar pregunta</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Se eliminara esta pregunta y todo el progreso asociado a ella.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => deleteQuestion(deleteQuestionId)} style={{ padding: '10px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Si, eliminar
              </button>
              <button onClick={() => setDeleteQuestionId(null)} style={{ padding: '10px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
            Volver al dashboard
          </a>
          <a href={'/estudiar/' + quizId} style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', textDecoration: 'none' }}>
            Estudiar
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{quiz.title}</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>{questions.length} preguntas · creado el {new Date(quiz.created_at).toLocaleDateString('es-AR')}</p>
          </div>
          <button
            onClick={() => setShowDeleteQuiz(true)}
            style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Eliminar quiz
          </button>
        </div>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '20px' }}>
            {msg}
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
              <button
                key={v.value}
                onClick={() => changeVisibility(v.value)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  fontSize: '12px',
                  border: '1px solid',
                  borderColor: quiz.visibility === v.value ? '#059669' : '#e5e7eb',
                  borderRadius: '8px',
                  background: quiz.visibility === v.value ? '#d1fae5' : 'white',
                  color: quiz.visibility === v.value ? '#065f46' : '#6b7280',
                  fontWeight: quiz.visibility === v.value ? '500' : '400',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
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

          <button
            onClick={saveInfo}
            disabled={saving}
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: saving ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Preguntas ({questions.length})</div>
            <a
              href={'/quiz/' + quizId + '/editar'}
              style={{ fontSize: '12px', fontWeight: '500', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}
            >
              + Agregar preguntas
            </a>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                    {idx + 1} · {q.type === 'single' ? 'Una correcta' : 'Multiple correcta'}
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
                <button
                  onClick={() => setDeleteQuestionId(q.id)}
                  style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
