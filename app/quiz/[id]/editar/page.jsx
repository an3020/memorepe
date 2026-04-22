'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EditarQuiz({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [csvStatus, setCsvStatus] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      setQuizId(id)

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

      setQuestions(questionsData || [])
      setLoading(false)
    }
    load()
  }, [])

  function addQuestion() {
    setQuestions([...questions, {
      id: 'new_' + Date.now(),
      body: '',
      type: 'single',
      explanation: '',
      options: [
        { id: 'opt_' + Date.now() + '_1', body: '', is_correct: true },
        { id: 'opt_' + Date.now() + '_2', body: '', is_correct: false },
        { id: 'opt_' + Date.now() + '_3', body: '', is_correct: false },
        { id: 'opt_' + Date.now() + '_4', body: '', is_correct: false },
      ],
      isNew: true
    }])
  }

  function updateQuestion(qIndex, field, value) {
    const updated = [...questions]
    updated[qIndex] = { ...updated[qIndex], [field]: value }
    setQuestions(updated)
  }

  function updateOption(qIndex, oIndex, field, value) {
    const updated = [...questions]
    if (field === 'is_correct' && updated[qIndex].type === 'single') {
      updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
        ...o, is_correct: i === oIndex
      }))
    } else {
      updated[qIndex].options[oIndex] = { ...updated[qIndex].options[oIndex], [field]: value }
    }
    setQuestions(updated)
  }

  function addOption(qIndex) {
    const updated = [...questions]
    if (updated[qIndex].options.length >= 4) return
    updated[qIndex].options.push({ id: 'opt_' + Date.now(), body: '', is_correct: false })
    setQuestions(updated)
  }

  function removeQuestion(qIndex) {
    setQuestions(questions.filter((_, i) => i !== qIndex))
  }

  function parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  async function handleCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvStatus('Procesando...')

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const newQuestions = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      if (!cols[0]) continue

      const questionBody = cols[0]?.trim().replace(/^"|"$/g, '')
      const opt1 = cols[1]?.trim().replace(/^"|"$/g, '')
      const opt2 = cols[2]?.trim().replace(/^"|"$/g, '')
      const opt3 = cols[3]?.trim().replace(/^"|"$/g, '')
      const opt4 = cols[4]?.trim().replace(/^"|"$/g, '')
      const correctasRaw = cols[5]?.trim().replace(/^"|"$/g, '')
      const explanation = cols[6]?.trim().replace(/^"|"$/g, '') || ''

      if (!questionBody || !opt1) continue

      const allOpts = [opt1, opt2, opt3, opt4].filter(Boolean)

      let correctIndexes = [0]
      if (correctasRaw) {
        correctIndexes = correctasRaw.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n))
      }

      const options = allOpts.map((body, idx) => ({
        id: 'opt_' + Date.now() + '_' + i + '_' + idx,
        body,
        is_correct: correctIndexes.includes(idx)
      }))

      newQuestions.push({
        id: 'new_' + Date.now() + '_' + i,
        body: questionBody,
        type: correctIndexes.length > 1 ? 'multiple' : 'single',
        explanation,
        options,
        isNew: true
      })
    }

    setQuestions(prev => [...prev, ...newQuestions])
    setCsvStatus(newQuestions.length + ' preguntas importadas')
  }

  async function saveAll() {
    setSaving(true)
    for (const q of questions) {
      if (q.isNew) {
        const { data: savedQ } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizId,
            body: q.body,
            type: q.type,
            explanation: q.explanation,
            order: questions.indexOf(q)
          })
          .select()
          .single()

        if (savedQ) {
          for (const opt of q.options) {
            await supabase.from('options').insert({
              question_id: savedQ.id,
              body: opt.body,
              is_correct: opt.is_correct,
              order: q.options.indexOf(opt)
            })
          }
        }
      }
    }

    await supabase
      .from('quizzes')
      .update({ question_count: questions.length })
      .eq('id', quizId)

    setSaving(false)
    router.push('/quiz/' + quizId + '/publicado')
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

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '12px' }}>{quiz?.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{questions.length} preguntas</span>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '7px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={saveAll}
            disabled={saving || questions.length === 0}
            style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '500', color: 'white', background: saving || questions.length === 0 ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {saving ? 'Guardando...' : 'Guardar y publicar'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Importar desde CSV</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            El CSV debe tener estas columnas: <strong>question, option1, option2, option3, option4, correctas, explicacion</strong><br />
            En "correctas" ponés los números de las opciones correctas separados por coma. Ej: <strong>1</strong> o <strong>1,3,4</strong>. Si lo dejás vacío, la opción 1 es la correcta.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="file"
              accept=".csv"
              id="csv-input"
              style={{ display: 'none' }}
              onChange={handleCSV}
            />
            <label
              htmlFor="csv-input"
              style={{ padding: '7px 16px', fontSize: '12px', color: '#059669', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', cursor: 'pointer', display: 'inline-block' }}
            >
              Subir CSV
            </label>
            {csvStatus && (
              <span style={{ fontSize: '12px', color: csvStatus.includes('Error') ? '#ef4444' : '#059669' }}>
                {csvStatus}
              </span>
            )}
          </div>
        </div>

        {questions.map((q, qIndex) => (
          <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Pregunta {qIndex + 1}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['single', 'multiple'].map((t) => (
                    <button
                      key={t}
                      onClick={() => updateQuestion(qIndex, 'type', t)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        border: '1px solid',
                        borderColor: q.type === t ? '#059669' : '#e5e7eb',
                        borderRadius: '20px',
                        background: q.type === t ? '#d1fae5' : 'white',
                        color: q.type === t ? '#065f46' : '#9ca3af',
                        cursor: 'pointer',
                      }}
                    >
                      {t === 'single' ? 'Una correcta' : 'Múltiple'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </div>
            </div>

            <textarea
              style={{ ...input, minHeight: '60px', resize: 'vertical', marginBottom: '10px' }}
              placeholder="Escribí la pregunta acá..."
              value={q.body}
              onChange={(e) => updateQuestion(qIndex, 'body', e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {q.options.map((opt, oIndex) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    onClick={() => updateOption(qIndex, oIndex, 'is_correct', !opt.is_correct)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: q.type === 'single' ? '50%' : '4px',
                      border: '2px solid',
                      borderColor: opt.is_correct ? '#059669' : '#d1d5db',
                      background: opt.is_correct ? '#059669' : 'white',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <input
                    style={{ ...input }}
                    placeholder={'Opción ' + (oIndex + 1)}
                    value={opt.body}
                    onChange={(e) => updateOption(qIndex, oIndex, 'body', e.target.value)}
                  />
                </div>
              ))}
            </div>

            {q.options.length < 4 && (
              <button
                onClick={() => addOption(qIndex)}
                style={{ fontSize: '12px', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}
              >
                + Agregar opción
              </button>
            )}

            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Explicación didáctica{' '}
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>Opcional</span>
              </div>
              <textarea
                style={{ ...input, minHeight: '48px', resize: 'vertical', background: '#f9fafb' }}
                placeholder="Explicá por qué es correcta esta respuesta..."
                value={q.explanation}
                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
              />
            </div>

          </div>
        ))}

        <button
          onClick={addQuestion}
          style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: '500', color: '#059669', background: '#f0fdf4', border: '1px dashed #6ee7b7', borderRadius: '12px', cursor: 'pointer' }}
        >
          + Agregar pregunta
        </button>

      </div>
    </div>
  )
}