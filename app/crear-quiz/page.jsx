'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CrearQuiz() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    notes: '',
    category: '',
    language: 'es',
    visibility: 'public',
    faculty: '',
    subject: '',
    teacher: '',
    year_course: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60)
      + '-' + Math.random().toString(36).substring(2, 10)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const slug = generateSlug(form.title)
    console.log('slug generado:', slug)

    const { data, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        notes: form.notes,
        category: form.category,
        language: form.language,
        visibility: form.visibility,
        faculty: form.faculty,
        subject: form.subject,
        teacher: form.teacher,
        year_course: form.year_course,
        slug: slug,
      })
      .select()
      .single()

    if (insertError) {
      console.log('ERROR SUPABASE:', insertError)
      setError('Error: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push(`/quiz/${data.id}/agregar`)
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

  const label = {
    fontSize: '12px',
    color: '#6b7280',
    display: 'block',
    marginBottom: '5px',
  }

  const field = { marginBottom: '16px' }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ ...input, width: 'auto', color: '#6b7280', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title}
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: loading || !form.title ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: loading || !form.title ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Guardando...' : 'Crear y agregar preguntas'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Nuevo quiz</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Completá la información básica. Las preguntas las agregás en el siguiente paso.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div style={field}>
            <label style={label}>Nombre del quiz *</label>
            <input style={input} name="title" value={form.title} onChange={handleChange} placeholder="Ej: Derecho Penal Económico — Segundo Parcial" required />
          </div>

          <div style={field}>
            <label style={label}>Descripción (opcional)</label>
            <textarea style={{ ...input, minHeight: '70px', resize: 'vertical' }} name="description" value={form.description} onChange={handleChange} placeholder="¿De qué trata este quiz?" />
          </div>

          <div style={field}>
            <label style={label}>Nota para los estudiantes (opcional)</label>
            <textarea style={{ ...input, minHeight: '70px', resize: 'vertical' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Ej: Este preguntero cubre el segundo parcial de la cátedra García, UBA Derecho 2025." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={label}>Categoría</label>
              <select style={input} name="category" value={form.category} onChange={handleChange}>
                <option value="">Seleccioná una categoría</option>
                <option value="derecho">Derecho</option>
                <option value="medicina">Medicina</option>
                <option value="economia">Economía</option>
                <option value="historia">Historia</option>
                <option value="idiomas">Idiomas</option>
                <option value="exactas">Exactas</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={label}>Idioma</label>
              <select style={input} name="language" value={form.language} onChange={handleChange}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div style={field}>
            <label style={label}>Visibilidad</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'public', label: 'Público' },
                { value: 'link', label: 'Solo con link' },
                { value: 'private', label: 'Privado' },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setForm({ ...form, visibility: v.value })}
                  style={{
                    flex: 1, padding: '8px', fontSize: '12px', border: '1px solid',
                    borderColor: form.visibility === v.value ? '#059669' : '#e5e7eb',
                    borderRadius: '8px',
                    background: form.visibility === v.value ? '#d1fae5' : 'white',
                    color: form.visibility === v.value ? '#065f46' : '#6b7280',
                    fontWeight: form.visibility === v.value ? '500' : '400',
                    cursor: 'pointer',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: '#f0f0f0', margin: '20px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={label}>Facultad / Departamento</label>
              <input style={input} name="faculty" value={form.faculty} onChange={handleChange} placeholder="Ej: Facultad de Derecho" />
            </div>
            <div>
              <label style={label}>Materia</label>
              <input style={input} name="subject" value={form.subject} onChange={handleChange} placeholder="Ej: Derecho Penal Económico" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={label}>Docente (opcional)</label>
              <input style={input} name="teacher" value={form.teacher} onChange={handleChange} placeholder="Ej: Dr. García" />
            </div>
            <div>
              <label style={label}>Año / Curso</label>
              <input style={input} name="year_course" value={form.year_course} onChange={handleChange} placeholder="Ej: 4to año, 2025" />
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}