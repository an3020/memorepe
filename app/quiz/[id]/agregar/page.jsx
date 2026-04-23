'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AgregarPreguntas({ params }) {
  const router = useRouter()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)

  const [manualForm, setManualForm] = useState({
    body: '',
    type: 'single',
    explanation: '',
    options: [
      { id: 1, body: '', is_correct: true },
      { id: 2, body: '', is_correct: false },
      { id: 3, body: '', is_correct: false },
      { id: 4, body: '', is_correct: false },
    ]
  })
  const [savingManual, setSavingManual] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const [csvFile, setCsvFile] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)
  const [csvStatus, setCsvStatus] = useState('')
  const [savingCsv, setSavingCsv] = useState(false)

  const [sheetsUrl, setSheetsUrl] = useState('')
  const [sheetsStatus, setSheetsStatus] = useState('')
  const [sheetsPreview, setSheetsPreview] = useState(null)
  const [loadingSheets, setLoadingSheets] = useState(false)
  const [savingSheets, setSavingSheets] = useState(false)

  const [msg, setMsg] = useState('')

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
      setQuestionCount(quizData.question_count || 0)
      setLoading(false)
    }
    load()
  }, [])

  function updateManualOption(idx, field, value) {
    const updated = { ...manualForm }
    if (field === 'is_correct' && manualForm.type === 'single') {
      updated.options = updated.options.map((o, i) => ({ ...o, is_correct: i === idx }))
    } else {
      updated.options[idx] = { ...updated.options[idx], [field]: value }
    }
    setManualForm(updated)
  }

  async function saveManual(andAnother) {
    if (!manualForm.body.trim()) return
    setSavingManual(true)
    const { data: savedQ } = await supabase
      .from('questions')
      .insert({ quiz_id: quizId, body: manualForm.body, type: manualForm.type, explanation: manualForm.explanation, order: questionCount })
      .select().single()
    if (savedQ) {
      const opts = manualForm.options.filter(o => o.body.trim())
      for (const opt of opts) {
        await supabase.from('options').insert({ question_id: savedQ.id, body: opt.body, is_correct: opt.is_correct, order: opts.indexOf(opt) })
      }
      const newCount = questionCount + 1
      setQuestionCount(newCount)
      await supabase.from('quizzes').update({ question_count: newCount }).eq('id', quizId)
      setSavedCount(prev => prev + 1)
      setMsg('Pregunta guardada.')
      setTimeout(() => setMsg(''), 2000)
      if (andAnother) {
        setManualForm({ body: '', type: 'single', explanation: '', options: [{ id: 1, body: '', is_correct: true }, { id: 2, body: '', is_correct: false }, { id: 3, body: '', is_correct: false }, { id: 4, body: '', is_correct: false }] })
      }
    }
    setSavingManual(false)
  }

  function parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { result.push(current); current = '' }
      else { current += char }
    }
    result.push(current)
    return result.map(s => s.trim().replace(/^"|"$/g, ''))
  }

  function parseCSVText(text) {
    const lines = text.split('\n').filter(l => l.trim())
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      if (!cols[0]) continue
      const allOpts = [cols[1], cols[2], cols[3], cols[4]].filter(Boolean)
      const correctasRaw = cols[5]?.trim()
      let correctIndexes = [0]
      if (correctasRaw) correctIndexes = correctasRaw.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n))
      const options = allOpts.map((body, idx) => ({ body, is_correct: correctIndexes.includes(idx) }))
      parsed.push({ body: cols[0], type: correctIndexes.length > 1 ? 'multiple' : 'single', explanation: cols[6] || '', options })
    }
    return parsed
  }

  async function handleCSVFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvFile(file)
    setCsvStatus('Procesando...')
    const text = await file.text()
    const parsed = parseCSVText(text)
    setCsvPreview(parsed)
    setCsvStatus(parsed.length + ' preguntas detectadas')
  }

  async function handleSheetsUrl() {
    if (!sheetsUrl.trim()) return
    setLoadingSheets(true)
    setSheetsStatus('Cargando...')
    try {
      let csvUrl = sheetsUrl
      if (sheetsUrl.includes('/edit') || sheetsUrl.includes('/view')) {
        csvUrl = sheetsUrl.replace(/\/edit.*$/, '/export?format=csv').replace(/\/view.*$/, '/export?format=csv')
      } else if (sheetsUrl.includes('spreadsheets/d/')) {
        const match = sheetsUrl.match(/spreadsheets\/d\/([^/]+)/)
        if (match) csvUrl = 'https://docs.google.com/spreadsheets/d/' + match[1] + '/export?format=csv'
      }
      const res = await fetch(csvUrl)
      if (!res.ok) throw new Error('No se pudo acceder al Sheet. Verificá que sea publico.')
      const text = await res.text()
      const parsed = parseCSVText(text)
      setSheetsPreview(parsed)
      setSheetsStatus(parsed.length + ' preguntas detectadas')
    } catch (e) {
      setSheetsStatus('Error: ' + e.message)
    }
    setLoadingSheets(false)
  }

  async function saveQuestions(questions) {
    const questionsToInsert = questions.map((q, idx) => ({
      quiz_id: quizId, body: q.body, type: q.type, explanation: q.explanation || null, order: questionCount + idx
    }))
    const { data: savedQuestions } = await supabase.from('questions').insert(questionsToInsert).select()
    if (savedQuestions) {
      const optionsToInsert = []
      savedQuestions.forEach((savedQ, qIdx) => {
        questions[qIdx].options.forEach((opt, oIdx) => {
          optionsToInsert.push({ question_id: savedQ.id, body: opt.body, is_correct: opt.is_correct, order: oIdx })
        })
      })
      await supabase.from('options').insert(optionsToInsert)
      const newCount = questionCount + questions.length
      setQuestionCount(newCount)
      await supabase.from('quizzes').update({ question_count: newCount }).eq('id', quizId)
    }
  }

  async function saveCsv() {
    if (!csvPreview || csvPreview.length === 0) return
    setSavingCsv(true)
    await saveQuestions(csvPreview)
    setSavingCsv(false)
    setCsvPreview(null)
    setCsvFile(null)
    setCsvStatus('')
    setMsg(csvPreview.length + ' preguntas importadas correctamente.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveSheets() {
    if (!sheetsPreview || sheetsPreview.length === 0) return
    setSavingSheets(true)
    await saveQuestions(sheetsPreview)
    setSavingSheets(false)
    setSheetsPreview(null)
    setSheetsUrl('')
    setSheetsStatus('')
    setMsg(sheetsPreview.length + ' preguntas importadas correctamente.')
    setTimeout(() => setMsg(''), 3000)
  }

  const input = { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '10px', fontWeight: '400' }}>{quiz?.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{questionCount} preguntas en total</span>
          <a href={'/quiz/' + quizId + '/gestionar'} style={{ padding: '7px 14px', fontSize: '13px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
            Volver a gestionar
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Agregar preguntas</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Elegí cómo querés cargar tus preguntas.</p>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        {savedCount > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '20px' }}>
            {savedCount} pregunta{savedCount > 1 ? 's' : ''} agregada{savedCount > 1 ? 's' : ''} en esta sesión.
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[
            { key: 'manual', label: '✏️ Escribir' },
            { key: 'csv', label: '📄 CSV' },
            { key: 'sheets', label: '🟢 Google Sheets' },
          ].map(m => (
            <button key={m.key} onClick={() => setModo(m.key)} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: modo === m.key ? '500' : '400', border: '1px solid', borderColor: modo === m.key ? '#059669' : '#e5e7eb', borderRadius: '10px', background: modo === m.key ? '#f0fdf4' : 'white', color: modo === m.key ? '#065f46' : '#6b7280', cursor: 'pointer' }}>
              {m.label}
            </button>
          ))}
        </div>

        {modo === 'manual' && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>Nueva pregunta</div>

            <div style={{ marginBottom: '12px' }}>
              <textarea style={{ ...input, minHeight: '70px', resize: 'vertical' }} placeholder="Escribí la pregunta acá..." value={manualForm.body} onChange={e => setManualForm({ ...manualForm, body: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {['single', 'multiple'].map(t => (
                <button key={t} onClick={() => setManualForm({ ...manualForm, type: t })} style={{ padding: '4px 12px', fontSize: '11px', border: '1px solid', borderColor: manualForm.type === t ? '#059669' : '#e5e7eb', borderRadius: '20px', background: manualForm.type === t ? '#d1fae5' : 'white', color: manualForm.type === t ? '#065f46' : '#9ca3af', cursor: 'pointer' }}>
                  {t === 'single' ? 'Una correcta' : 'Multiple correcta'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {manualForm.options.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div onClick={() => updateManualOption(idx, 'is_correct', !opt.is_correct)} style={{ width: '18px', height: '18px', borderRadius: manualForm.type === 'single' ? '50%' : '4px', border: '2px solid', borderColor: opt.is_correct ? '#059669' : '#d1d5db', background: opt.is_correct ? '#059669' : 'white', cursor: 'pointer', flexShrink: 0 }} />
                  <input style={input} placeholder={'Opción ' + (idx + 1)} value={opt.body} onChange={e => updateManualOption(idx, 'body', e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Explicación didáctica <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>Opcional</span></label>
              <textarea style={{ ...input, minHeight: '48px', resize: 'vertical', background: '#f9fafb' }} placeholder="Explicá por qué es correcta..." value={manualForm.explanation} onChange={e => setManualForm({ ...manualForm, explanation: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => saveManual(true)} disabled={savingManual || !manualForm.body.trim()} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingManual || !manualForm.body.trim() ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                {savingManual ? 'Guardando...' : 'Guardar y agregar otra'}
              </button>
              <button onClick={() => saveManual(false)} disabled={savingManual || !manualForm.body.trim()} style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                Guardar y terminar
              </button>
            </div>
          </div>
        )}

        {modo === 'csv' && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Importar desde CSV</div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
              El archivo debe tener estas columnas: <strong style={{ color: '#374151' }}>pregunta, opcion1, opcion2, opcion3, opcion4, correctas, explicacion</strong><br />
              En "correctas" ponés los números de las opciones correctas. Ej: <strong style={{ color: '#374151' }}>1</strong> o <strong style={{ color: '#374151' }}>1,3</strong>
            </p>

            <div style={{ border: '1px dashed #e5e7eb', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
              <input type="file" accept=".csv" id="csv-input" style={{ display: 'none' }} onChange={handleCSVFile} />
              <label htmlFor="csv-input" style={{ fontSize: '13px', fontWeight: '500', color: '#059669', cursor: 'pointer' }}>
                Seleccionar archivo CSV
              </label>
              {csvFile && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{csvFile.name}</p>}
            </div>

            {csvStatus && <p style={{ fontSize: '12px', color: csvStatus.includes('Error') ? '#ef4444' : '#059669', marginBottom: '12px' }}>{csvStatus}</p>}

            {csvPreview && csvPreview.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Vista previa — primeras 3 preguntas:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {csvPreview.slice(0, 3).map((q, idx) => (
                    <div key={idx} style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
                      <div style={{ color: '#111', marginBottom: '4px' }}>{q.body}</div>
                      <div style={{ color: '#9ca3af' }}>{q.options.filter(o => o.is_correct).map(o => '✓ ' + o.body).join(' · ')}</div>
                    </div>
                  ))}
                  {csvPreview.length > 3 && <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>+ {csvPreview.length - 3} preguntas más</div>}
                </div>
                <button onClick={saveCsv} disabled={savingCsv} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingCsv ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {savingCsv ? 'Importando...' : 'Importar ' + csvPreview.length + ' preguntas'}
                </button>
              </div>
            )}
          </div>
        )}

        {modo === 'sheets' && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Importar desde Google Sheets</div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
              El Sheet tiene que ser público o compartido con link. Las columnas deben ser las mismas que el CSV: <strong style={{ color: '#374151' }}>pregunta, opcion1, opcion2, opcion3, opcion4, correctas, explicacion</strong>
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                style={{ ...input, flex: 1 }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={e => setSheetsUrl(e.target.value)}
              />
              <button onClick={handleSheetsUrl} disabled={loadingSheets || !sheetsUrl.trim()} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '500', color: 'white', background: loadingSheets || !sheetsUrl.trim() ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {loadingSheets ? 'Cargando...' : 'Cargar'}
              </button>
            </div>

            {sheetsStatus && <p style={{ fontSize: '12px', color: sheetsStatus.includes('Error') ? '#ef4444' : '#059669', marginBottom: '12px' }}>{sheetsStatus}</p>}

            {sheetsPreview && sheetsPreview.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Vista previa — primeras 3 preguntas:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {sheetsPreview.slice(0, 3).map((q, idx) => (
                    <div key={idx} style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
                      <div style={{ color: '#111', marginBottom: '4px' }}>{q.body}</div>
                      <div style={{ color: '#9ca3af' }}>{q.options.filter(o => o.is_correct).map(o => '✓ ' + o.body).join(' · ')}</div>
                    </div>
                  ))}
                  {sheetsPreview.length > 3 && <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>+ {sheetsPreview.length - 3} preguntas más</div>}
                </div>
                <button onClick={saveSheets} disabled={savingSheets} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingSheets ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {savingSheets ? 'Importando...' : 'Importar ' + sheetsPreview.length + ' preguntas'}
                </button>
              </div>
            )}
          </div>
        )}

        {!modo && (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #e5e7eb', borderRadius: '12px', color: '#9ca3af', fontSize: '13px' }}>
            Elegí una opción arriba para empezar a agregar preguntas.
          </div>
        )}

      </div>
    </div>
  )
}
