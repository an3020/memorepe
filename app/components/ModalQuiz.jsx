'use client'
import { useState, useEffect } from 'react'

export default function ModalQuiz({ quiz, progressMap = {} }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const catColors = {
    derecho:  { bg: '#e0f2fe', color: '#0369a1' },
    medicina: { bg: '#d1fae5', color: '#065f46' },
    economia: { bg: '#fef3c7', color: '#92400e' },
    historia: { bg: '#fce7f3', color: '#9d174d' },
    idiomas:  { bg: '#ede9fe', color: '#5b21b6' },
    exactas:  { bg: '#e0e7ff', color: '#3730a3' },
    otro:     { bg: '#f3f4f6', color: '#374151' },
  }

  const catStyle = catColors[quiz.category] || catColors.otro
  const username = quiz.users?.username
  const quizUrl = quiz.slug ? '/q/' + quiz.slug : '/quiz/' + quiz.id
  const p = progressMap[quiz.id]
  const tieneProgreso = p && p.seen > 0

  const rows = [
    quiz.subject   && { label: 'Materia',    value: quiz.subject },
    quiz.faculty   && { label: 'Facultad',   value: quiz.faculty },
    quiz.teacher   && { label: 'Profesor',   value: quiz.teacher },
    quiz.year_course && { label: 'Año / Curso', value: quiz.year_course },
    username       && { label: 'Autor',      value: '@' + username, href: '/usuario/' + username },
    { label: 'Preguntas',  value: quiz.question_count },
    { label: 'Estudiando', value: quiz.student_count || 0 },
  ].filter(Boolean)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#6b7280',
          background: 'white',
          border: '1px solid #e5e7eb',
          padding: '5px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Ver detalles
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            {/* Cerrar */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', color: '#9ca3af', lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Categoría */}
            <span style={{
              fontSize: '11px', fontWeight: '500',
              padding: '3px 10px', borderRadius: '6px',
              background: catStyle.bg, color: catStyle.color,
              display: 'inline-block', marginBottom: '12px',
            }}>
              {quiz.category || 'Otro'}
            </span>

            {/* Título */}
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111', margin: '0 0 16px' }}>
              {quiz.title}
            </h2>

            {/* Descripción */}
            {quiz.description && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Descripción
                </p>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                  {quiz.description}
                </p>
              </div>
            )}

            {/* Notas */}
            {quiz.notes && (
              <div style={{
                marginBottom: '16px',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '8px', padding: '12px 14px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notas del autor
                </p>
                <p style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>
                  {quiz.notes}
                </p>
              </div>
            )}

            {/* Tabla de datos */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
              {rows.map(({ label, value, href }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0', borderBottom: '1px solid #f9fafb',
                }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>{label}</span>
                  {href
                    ? <a href={href} style={{ fontSize: '13px', fontWeight: '500', color: '#059669', textDecoration: 'none' }}>{value}</a>
                    : <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>{value}</span>
                  }
                </div>
              ))}
            </div>

            {/* Progreso si tiene */}
            {tieneProgreso && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tu progreso
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Round {p.round}</span>
                  <span style={{ color: '#059669', fontWeight: '500' }}>{p.dominated_pct}% dominadas</span>
                  {p.due_today > 0 && <span style={{ color: '#d97706', fontWeight: '500' }}>{p.due_today} para repasar hoy</span>}
                  {p.unseen > 0 && <span style={{ color: '#9ca3af' }}>{p.unseen} sin ver</span>}
                </div>
                <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: p.dominated_pct + '%', background: '#059669', borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {/* CTA */}
            <a
              href={'/estudiar/' + quiz.id + '/inicio'}
              style={{
                display: 'block', textAlign: 'center',
                background: '#059669', color: 'white',
                padding: '13px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600',
                textDecoration: 'none', marginBottom: '10px',
              }}
            >
              {tieneProgreso ? '▶ Continuar estudiando' : '▶ Empezar a estudiar'}
            </a>
            <a
              href={quizUrl}
              style={{
                display: 'block', textAlign: 'center',
                color: '#6b7280', fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Ver página completa →
            </a>
          </div>
        </div>
      )}
    </>
  )
}
