'use client'

import { useState } from 'react'

export default function ResetProgressButton({ quizId }) {
  const [step, setStep] = useState('idle')

  async function handleReset() {
    setStep('loading')

    const res = await fetch('/api/reset-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId })
    })

    if (!res.ok) {
      setStep('error')
      return
    }

    setStep('done')
    setTimeout(() => window.location.reload(), 1800)
  }

  if (step === 'idle') {
    return (
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />
        <button onClick={() => setStep('confirm')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', padding: '4px 8px' }}>
          Reiniciar mi progreso en este quiz
        </button>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />
        <div style={{ border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px', background: '#fff5f5' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#991b1b', margin: '0 0 6px 0' }}>¿Reiniciar todo el progreso?</p>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 20px 0', lineHeight: '1.5', opacity: 0.8 }}>Tus respuestas anteriores, intervalos y rachas en este quiz se borrarán. Las preguntas volverán a aparecer como nuevas. Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleReset} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Sí, empezar desde cero
            </button>
            <button onClick={() => setStep('idle')} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />
        <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>Reiniciando progreso...</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />
        <p style={{ fontSize: '13px', color: '#059669', textAlign: 'center' }}>✓ Progreso reiniciado. Recargando...</p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div style={{ marginTop: '32px' }}>
        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />
        <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>Ocurrió un error. Intentá de nuevo.</p>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button onClick={() => setStep('idle')} style={{ fontSize: '13px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
        </div>
      </div>
    )
  }
}