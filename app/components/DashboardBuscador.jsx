'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardBuscador({ defaultValue }) {
  const [valor, setValor] = useState(defaultValue || '')
  const router = useRouter()

  function buscar() {
    if (valor.trim()) {
      router.push('/explorar?q=' + encodeURIComponent(valor.trim()))
    }
  }

  function limpiar() {
    setValor('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={valor}
            onChange={e => setValor(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') buscar() }}
            placeholder="¿Qué quieres estudiar hoy?"
            style={{ width: '100%', padding: '10px 30px 10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}
          />
          {valor && (
            <button
              type="button"
              onClick={limpiar}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={buscar}
          style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#0369a1', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
        >
          Buscar
        </button>
      </div>
      {!valor && (
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0 2px' }}>
          Puedes buscar por tema, materia, universidad o @usuario
        </p>
      )}
    </div>
  )
}
