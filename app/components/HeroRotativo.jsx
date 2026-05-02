'use client'

import { useState, useEffect } from 'react'
import LoginButton from '@/app/components/LoginButton'

const HEROES = [
  {
    titulo: <>Estudia menos.<br /><span style={{ color: '#059669' }}>Aprende más.</span></>,
    subtitulo: 'El algoritmo sabe qué repasar. Solo tienes que aparecer.',
  },
  {
    titulo: <>Tu próximo examen<br /><span style={{ color: '#059669' }}>ya tiene fecha.</span></>,
    subtitulo: 'Memorepe analiza tu rendimiento y decide exactamente qué estudiar cada día.',
  },
  {
    titulo: <>Estudia con<br /><span style={{ color: '#059669' }}>inteligencia.</span></>,
    subtitulo: 'Un algoritmo que aprende cómo aprendes tú y optimiza cada sesión de estudio.',
  },
]

export default function HeroRotativo() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(Math.floor(Math.random() * HEROES.length))
  }, [])

  const hero = HEROES[idx]

  return (
    <>
      {/* Textos ocultos para SEO — Google los indexa aunque no sean visibles */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {HEROES.map((h, i) => (
          <div key={i}>
            <span>{h.subtitulo}</span>
          </div>
        ))}
      </div>

      <section style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '500', letterSpacing: '-1px', color: '#111', lineHeight: '1.15', marginBottom: '16px' }}>
          {hero.titulo}
        </h1>
        <p style={{ fontSize: '17px', color: '#6b7280', marginBottom: '40px', lineHeight: '1.6' }}>
          {hero.subtitulo}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <LoginButton label="Empezar gratis con Google" primary />
          <a href="/explorar" style={{ padding: '10px 20px', fontSize: '14px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
            Explorar bancos de preguntas
          </a>
        </div>
      </section>
    </>
  )
}
