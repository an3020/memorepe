'use client'

import { useState } from 'react'

export default function BuscadorExplorar({ defaultValue, categoria }) {
  const [valor, setValor] = useState(defaultValue || '')
  const esAutor = valor.startsWith('@')

  function buildUrl(cat, q) {
    const parts = []
    if (cat) parts.push('categoria=' + cat)
    if (q) parts.push('q=' + encodeURIComponent(q))
    return '/explorar' + (parts.length ? '?' + parts.join('&') : '')
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <form method="GET" action="/explorar">
        <input type="hidden" name="categoria" value={categoria} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            name="q"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="Buscar quizzes o @usuario"
            style={{ flex: 1, padding: '9px 14px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif' }}
          />
          <button type="submit" style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Buscar
          </button>
          {valor && (
            <a href={buildUrl(categoria, '')} style={{ padding: '9px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
              Limpiar
            </a>
          )}
        </div>
      </form>

      {!valor && (
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', marginBottom: '0' }}>
          Tip: escribí <strong style={{ color: '#059669' }}>@usuario</strong> para buscar todos los quizzes de un autor.
        </p>
      )}

      {esAutor && valor.length > 1 && (
        <p style={{ fontSize: '12px', color: '#059669', marginTop: '6px', marginBottom: '0' }}>
          Buscando quizzes de <strong>{valor}</strong>
        </p>
      )}
    </div>
  )
}
