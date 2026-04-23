'use client'

import { useState, useEffect } from 'react'

const frases = [
  'Preparando tus preguntas...',
  'Activando el modo estudio...',
  'Cargando tu progreso...',
  'El conocimiento está por llegar...',
  'Ordenando las preguntas más importantes...',
  'Consultando el algoritmo SM-2...',
]

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [fraseIdx, setFraseIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return prev
        return prev + Math.random() * 12
      })
    }, 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFraseIdx(prev => (prev + 1) % frases.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>

        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px', marginBottom: '32px', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>

        <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ height: '100%', width: Math.min(progress, 90) + '%', background: '#059669', borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>

        <p style={{ fontSize: '13px', color: '#9ca3af', transition: 'opacity 0.3s' }}>
          {frases[fraseIdx]}
        </p>

      </div>
    </div>
  )
}
