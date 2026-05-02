'use client'

import { useState, useEffect } from 'react'

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('privacy-accepted')
    if (!accepted) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('privacy-accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 1000,
      flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, flex: 1 }}>
        Usamos cookies para mejorar tu experiencia.{' '}
        <a href="/privacidad" style={{ color: '#059669', textDecoration: 'underline' }}>
          Política de privacidad
        </a>
      </p>
      <button
        onClick={accept}
        style={{
          padding: '7px 18px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'white',
          background: '#059669',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Entendido
      </button>
    </div>
  )
}
