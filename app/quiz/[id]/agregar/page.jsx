'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MODO_INFO = {
  manual: {
    label: '✏️ Escribir',
    desc: 'Una por una',
    tooltip: 'Ideal para pocas preguntas o cuando querés controlar cada detalle. Escribís la pregunta, las opciones y marcás la correcta.'
  },
  csv: {
    label: '📄 CSV',
    desc: 'Subir archivo',
    tooltip: 'Ideal si ya tenés las preguntas en Excel o Google Sheets. Exportás como CSV y lo subís acá. Descargá el archivo modelo para ver el formato exacto.'
  },
  sheets: {
    label: '🟢 Google Sheets',
    desc: 'Pegar URL',
    tooltip: 'Igual que CSV pero sin descargar nada. Compartís tu Sheet con acceso público y pegás el link. El formato de columnas es el mismo que el CSV.'
  },
  ai: {
    label: '✨ IA',
    desc: 'Word, PDF o texto',
    tooltip: 'La opción más flexible. Subí un archivo Word o PDF, o pegá cualquier texto con preguntas. La IA extrae y estructura todo automáticamente. 3 usos gratuitos por mes.'
  }
}

export default function AgregarPreguntas({ params }) {
  const router = useRouter()
  const supabase = createClient()

  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)

  const [manualForm, setManualForm] = useState({
    body: '', type: 'single', explanation: '',
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

  const [aiText, setAiText] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [aiPreview, setAiPreview] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [savingAi, setSavingAi] = useState(false)

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
      const allOpts = [cols[1], cols[2], cols[3], cols[4], cols[5]].filter(Boolean)
      const correctasRaw = cols[6]?.trim()
      const explanation = cols[7] || ''
      let correctIndexes = [0]
      if (correctasRaw) correctIndexes = correctasRaw.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n))
      const options = allOpts.map((body, idx) => ({ body, is_correct: correctIndexes.includes(idx) }))
      parsed.push({ body: cols[0], type: correctIndexes.length > 1 ? 'multiple' : 'single', explanation, options })
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
      if (!res.ok) throw new Error('No se pudo acceder al Sheet. Verificá que sea público.')
      const text = await res.text()
      const parsed = parseCSVText(text)
      setSheetsPreview(parsed)
      setSheetsStatus(parsed.length + ' preguntas detectadas')
    } catch (e) {
      setSheetsStatus('Error: ' + e.message)
    }
    setLoadingSheets(false)
  }

  async function handleAiFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setAiStatus('❌ El archivo no puede superar los 10MB.')
      return
    }

    setAiStatus('Extrayendo texto del archivo...')

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
        GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        const pdf = await getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map(item => item.str).join(' ') + '\n'
        }
        setAiText(text.trim())
        setAiStatus('Texto extraído del PDF. Revisalo y hacé clic en "Extraer preguntas con IA".')
      } else if (file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setAiText(result.value.trim())
        setAiStatus('Texto extraído del Word. Revisalo y hacé clic en "Extraer preguntas con IA".')
      } else {
        setAiStatus('❌ Solo se admiten archivos Word (.docx) y PDF.')
      }
    } catch (err) {
      setAiStatus('❌ No se pudo leer el archivo. Intenta pegando el texto manualmente.')
    }
  }

  async function handleAiImport() {
    if (!aiText.trim()) return
    setLoadingAi(true)
    setAiStatus('La IA está procesando tu texto...')
    setAiPreview(null)

    try {
      const res = await fetch('/api/import-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'limite_alcanzado') {
          setAiStatus('❌ ' + data.message)
        } else {
          setAiStatus('❌ Error: ' + (data.error || 'Intenta de nuevo'))
        }
        setLoadingAi(false)
        return
      }

      setAiPreview(data.questions)
      setAiStatus(data.questions.length + ' preguntas detectadas · ' + data.usos_restantes + ' importaciones restantes este mes')
    } catch (e) {
      setAiStatus('❌ Error de conexión. Intenta de nuevo.')
    }

    setLoadingAi(false)
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
    if (!csvPreview?.length) return
    setSavingCsv(true)
    await saveQuestions(csvPreview)
    setSavingCsv(false)
    setCsvPreview(null); setCsvFile(null); setCsvStatus('')
    setMsg(csvPreview.length + ' preguntas importadas correctamente.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveSheets() {
    if (!sheetsPreview?.length) return
    setSavingSheets(true)
    await saveQuestions(sheetsPreview)
    setSavingSheets(false)
    setSheetsPreview(null); setSheetsUrl(''); setSheetsStatus('')
    setMsg(sheetsPreview.length + ' preguntas importadas correctamente.')
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveAi() {
    if (!aiPreview?.length) return
    setSavingAi(true)
    await saveQuestions(aiPreview)
    setSavingAi(false)
    setAiPreview(null); setAiText(''); setAiStatus('')
    setMsg(aiPreview.length + ' preguntas importadas correctamente.')
    setTimeout(() => setMsg(''), 3000)
  }

  const input = { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }

  function PreviewList({ items }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        {items.slice(0, 3).map((q, idx) => (
          <div key={idx} style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
            <div style={{ color: '#111', marginBottom: '4px' }}>{q.body}</div>
            <div style={{ color: '#059669' }}>{q.options.filter(o => o.is_correct).map(o => '✓ ' + o.body).join(' · ')}</div>
            <div style={{ color: '#9ca3af' }}>{q.options.filter(o => !o.is_correct).map(o => '· ' + o.body).join(' ')}</div>
          </div>
        ))}
        {items.length > 3 && <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>+ {items.length - 3} preguntas más</div>}
      </div>
    )
  }

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
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Elige cómo quieres cargar tus preguntas.</p>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: tooltip ? '8px' : '28px' }}>
          {Object.entries(MODO_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => { setModo(key); setTooltip(null) }}
              onMouseEnter={() => setTooltip(info.tooltip)}
              onMouseLeave={() => setTooltip(null)}
              style={{ padding: '12px', fontSize: '13px', fontWeight: modo === key ? '500' : '400', border: '1px solid', borderColor: modo === key ? '#059669' : key === 'ai' ? '#e0f2fe' : '#e5e7eb', borderRadius: '10px', background: modo === key ? '#f0fdf4' : key === 'ai' ? '#f0f9ff' : 'white', color: modo === key ? '#065f46' : key === 'ai' ? '#0369a1' : '#6b7280', cursor: 'pointer', textAlign: 'left' }}
            >
              <div>{info.label}</div>
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>{info.desc}</div>
            </button>
          ))}
        </div>

        {tooltip && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#374151', lineHeight: '1.5', marginBottom: '20px' }}>
            {tooltip}
          </div>
        )}

        {modo === 'manual' && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>Nueva pregunta</div>
            <div style={{ marginBottom: '12px' }}>
              <textarea style={{ ...input, minHeight: '70px', resize: 'vertical' }} placeholder="Escribe la pregunta aquí..." value={manualForm.body} onChange={e => setManualForm({ ...manualForm, body: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {['single', 'multiple'].map(t => (
                <button key={t} onClick={() => setManualForm({ ...manualForm, type: t })} style={{ padding: '4px 12px', fontSize: '11px', border: '1px solid', borderColor: manualForm.type === t ? '#059669' : '#e5e7eb', borderRadius: '20px', background: manualForm.type === t ? '#d1fae5' : 'white', color: manualForm.type === t ? '#065f46' : '#9ca3af', cursor: 'pointer' }}>
                  {t === 'single' ? 'Una correcta' : 'Múltiple correcta'}
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
              <textarea style={{ ...input, minHeight: '48px', resize: 'vertical', background: '#f9fafb' }} placeholder="Explica por qué es correcta..." value={manualForm.explanation} onChange={e => setManualForm({ ...manualForm, explanation: e.target.value })} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Importar desde CSV</div>
              <a href="/modelo_preguntas.csv" download style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '3px 10px', borderRadius: '6px' }}>
                ↓ Descargar modelo
              </a>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
              Columnas: <strong style={{ color: '#374151' }}>pregunta, opcion1, opcion2, opcion3, opcion4, opcion5, correctas, explicacion</strong><br />
              En "correctas" pon el número de la opción correcta. Ej: <strong style={{ color: '#374151' }}>1</strong> o <strong style={{ color: '#374151' }}>1,3</strong> para múltiples.
            </p>
            <div style={{ border: '1px dashed #e5e7eb', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
              <input type="file" accept=".csv" id="csv-input" style={{ display: 'none' }} onChange={handleCSVFile} />
              <label htmlFor="csv-input" style={{ fontSize: '13px', fontWeight: '500', color: '#059669', cursor: 'pointer' }}>
                Seleccionar archivo CSV
              </label>
              {csvFile && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{csvFile.name}</p>}
            </div>
            {csvStatus && <p style={{ fontSize: '12px', color: csvStatus.includes('Error') ? '#ef4444' : '#059669', marginBottom: '12px' }}>{csvStatus}</p>}
            {csvPreview?.length > 0 && (
              <>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Vista previa — primeras 3 preguntas:</div>
                <PreviewList items={csvPreview} />
                <button onClick={saveCsv} disabled={savingCsv} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingCsv ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {savingCsv ? 'Importando...' : 'Importar ' + csvPreview.length + ' preguntas'}
                </button>
              </>
            )}
          </div>
        )}

        {modo === 'sheets' && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Importar desde Google Sheets</div>
              <a href="/modelo_preguntas.csv" download style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '3px 10px', borderRadius: '6px' }}>
                ↓ Ver formato modelo
              </a>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', lineHeight: '1.5' }}>
              El Sheet debe ser público. Mismas columnas que el CSV: <strong style={{ color: '#374151' }}>pregunta, opcion1, opcion2, opcion3, opcion4, opcion5, correctas, explicacion</strong>
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input style={{ ...input, flex: 1 }} placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} />
              <button onClick={handleSheetsUrl} disabled={loadingSheets || !sheetsUrl.trim()} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '500', color: 'white', background: loadingSheets || !sheetsUrl.trim() ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {loadingSheets ? 'Cargando...' : 'Cargar'}
              </button>
            </div>
            {sheetsStatus && <p style={{ fontSize: '12px', color: sheetsStatus.includes('Error') ? '#ef4444' : '#059669', marginBottom: '12px' }}>{sheetsStatus}</p>}
            {sheetsPreview?.length > 0 && (
              <>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Vista previa — primeras 3 preguntas:</div>
                <PreviewList items={sheetsPreview} />
                <button onClick={saveSheets} disabled={savingSheets} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingSheets ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {savingSheets ? 'Importando...' : 'Importar ' + sheetsPreview.length + ' preguntas'}
                </button>
              </>
            )}
          </div>
        )}

        {modo === 'ai' && (
          <div style={{ border: '1px solid #e0f2fe', borderRadius: '12px', padding: '20px', background: '#f0f9ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#0369a1' }}>✨ Importar con IA</div>
              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px' }}>3 usos gratuitos / mes</span>
            </div>
            <p style={{ fontSize: '12px', color: '#0369a1', marginBottom: '16px', lineHeight: '1.5', opacity: 0.8 }}>
              Sube un archivo <strong>Word (.docx)</strong> o <strong>PDF</strong>, o pega el texto directamente. La IA extrae y estructura las preguntas automáticamente.
            </p>

            <div style={{ border: '1px dashed #7dd3fc', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '12px', background: 'white' }}>
              <input type="file" accept=".pdf,.docx" id="ai-file-input" style={{ display: 'none' }} onChange={handleAiFile} />
              <label htmlFor="ai-file-input" style={{ fontSize: '13px', fontWeight: '500', color: '#0369a1', cursor: 'pointer' }}>
                Subir archivo Word o PDF
              </label>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Máximo 10MB · Solo .docx y .pdf</p>
            </div>

            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginBottom: '10px' }}>— o pegá el texto directamente —</div>

            <textarea
              style={{ ...input, minHeight: '120px', resize: 'vertical', marginBottom: '12px', background: 'white' }}
              placeholder="Pega aquí el texto con preguntas..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
            />

            <button
              onClick={handleAiImport}
              disabled={loadingAi || !aiText.trim()}
              style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: loadingAi || !aiText.trim() ? '#9ca3af' : '#0369a1', border: 'none', borderRadius: '8px', cursor: loadingAi || !aiText.trim() ? 'not-allowed' : 'pointer', marginBottom: '12px' }}
            >
              {loadingAi ? '⏳ Procesando...' : '✨ Extraer preguntas con IA'}
            </button>

            {aiStatus && (
              <p style={{ fontSize: '12px', color: aiStatus.includes('❌') ? '#ef4444' : '#0369a1', marginBottom: '12px' }}>{aiStatus}</p>
            )}

            {aiPreview?.length > 0 && (
              <>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Vista previa — primeras 3 preguntas:</div>
                <PreviewList items={aiPreview} />
                <button onClick={saveAi} disabled={savingAi} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: savingAi ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  {savingAi ? 'Importando...' : 'Importar ' + aiPreview.length + ' preguntas'}
                </button>
              </>
            )}
          </div>
        )}

        {!modo && (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #e5e7eb', borderRadius: '12px', color: '#9ca3af', fontSize: '13px' }}>
            Elige una opción arriba para empezar a agregar preguntas.
          </div>
        )}

      </div>
    </div>
  )
}