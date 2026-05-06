'use client'

import { useState } from 'react'

export default function AdminQuizzesClient({ quizzes }) {
  const [lista, setLista] = useState(quizzes)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroVisibilidad, setFiltroVisibilidad] = useState('')
  const [minPreguntas, setMinPreguntas] = useState('')
  const [maxPreguntas, setMaxPreguntas] = useState('')
  const [loading, setLoading] = useState(null)
  const [msg, setMsg] = useState('')

  const categorias = ['derecho', 'medicina', 'economia', 'historia', 'idiomas', 'exactas', 'otro']

  const filtrados = lista.filter(q => {
    if (busqueda && !q.title?.toLowerCase().includes(busqueda.toLowerCase()) && !q.username?.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroCategoria && q.category !== filtroCategoria) return false
    if (filtroVisibilidad && q.visibility !== filtroVisibilidad) return false
    if (minPreguntas && (q.question_count || 0) < parseInt(minPreguntas)) return false
    if (maxPreguntas && (q.question_count || 0) > parseInt(maxPreguntas)) return false
    return true
  }).sort((a, b) => b.reportes_pendientes - a.reportes_pendientes)

  async function accion(quizId, action, extra = {}) {
    setLoading(quizId + action)
    const res = await fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, quizId, ...extra })
    })
    if (res.ok) {
      if (action === 'eliminar') {
        setLista(lista.filter(q => q.id !== quizId))
        setMsg('Quiz eliminado.')
      } else if (action === 'bajarPrivado') {
        setLista(lista.map(q => q.id === quizId ? { ...q, visibility: 'private', admin_locked: true } : q))
        setMsg('Quiz bajado a privado y bloqueado.')
      } else if (action === 'desbloquear') {
        setLista(lista.map(q => q.id === quizId ? { ...q, admin_locked: false } : q))
        setMsg('Quiz desbloqueado.')
      } else if (action === 'destacar') {
        setLista(lista.map(q => q.id === quizId ? { ...q, featured: !q.featured } : q))
        setMsg('Estado destacado actualizado.')
      }
      setTimeout(() => setMsg(''), 3000)
    }
    setLoading(null)
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 86400) return 'hoy'
    if (diff < 604800) return Math.floor(diff / 86400) + 'd'
    if (diff < 2592000) return Math.floor(diff / 604800) + 'sem'
    return date.toLocaleDateString('es-AR')
  }

  const inputStyle = {
    fontSize: '12px',
    border: '1px solid #222',
    borderRadius: '6px',
    background: '#1a1a1a',
    color: 'white',
    padding: '7px 10px',
    fontFamily: 'Arial, sans-serif',
  }

  return (
    <div>
      {msg && (
        <div style={{ background: '#052e16', border: '1px solid #059669', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#059669', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por título o @usuario..."
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={inputStyle}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtroVisibilidad} onChange={e => setFiltroVisibilidad(e.target.value)} style={inputStyle}>
          <option value="">Todas las visibilidades</option>
          <option value="public">Público</option>
          <option value="private">Privado</option>
          <option value="link">Solo link</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Preguntas:</span>
          <input value={minPreguntas} onChange={e => setMinPreguntas(e.target.value)} placeholder="mín" style={{ ...inputStyle, width: '50px', textAlign: 'center' }} />
          <span style={{ fontSize: '11px', color: '#6b7280' }}>a</span>
          <input value={maxPreguntas} onChange={e => setMaxPreguntas(e.target.value)} placeholder="máx" style={{ ...inputStyle, width: '50px', textAlign: 'center' }} />
        </div>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>{filtrados.length} resultados</span>
      </div>

      {/* Tabla */}
      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 200px', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #222', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Quiz</span>
          <span>Autor</span>
          <span>Categoría</span>
          <span>Preguntas</span>
          <span>Estudiantes</span>
          <span>Reportes</span>
          <span>Actualizado</span>
          <span>Acciones</span>
        </div>

        {filtrados.map(q => (
          <div key={q.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1fr 1fr 200px', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #111', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'white', fontWeight: '500', marginBottom: '2px' }}>
                {q.title}
                {q.admin_locked && <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '6px', background: '#2d0a0a', padding: '1px 6px', borderRadius: '4px' }}>bloqueado</span>}
                {q.featured && <span style={{ fontSize: '10px', color: '#d97706', marginLeft: '6px', background: '#2d1a00', padding: '1px 6px', borderRadius: '4px' }}>destacado</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {q.visibility === 'public' ? '🌐 público' : q.visibility === 'private' ? '🔒 privado' : '🔗 link'}
                {q.question_count === 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>⚠ sin preguntas</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>@{q.username || '—'}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{q.email}</div>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{q.category || '—'}</span>
            <span style={{ fontSize: '13px', color: q.question_count === 0 ? '#ef4444' : 'white' }}>{q.question_count || 0}</span>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{q.student_count || 0}</span>
            <span style={{ fontSize: '13px', color: q.reportes_pendientes > 0 ? '#ef4444' : '#6b7280', fontWeight: q.reportes_pendientes > 0 ? '500' : '400' }}>
              {q.reportes_pendientes > 0 ? `⚠ ${q.reportes_pendientes}` : '—'}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{timeAgo(q.updated_at || q.created_at)}</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <a href={'/admin/quizzes/' + q.id} target="_blank" style={{ fontSize: '11px', color: '#6b7280', background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '4px 8px', textDecoration: 'none' }}>
                Ver
              </a>
              {!q.admin_locked ? (
                <button
                  onClick={() => accion(q.id, 'bajarPrivado')}
                  disabled={loading === q.id + 'bajarPrivado'}
                  style={{ fontSize: '11px', color: '#d97706', background: '#2d1a00', border: '1px solid #d97706', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  {loading === q.id + 'bajarPrivado' ? '...' : 'Bajar'}
                </button>
              ) : (
                <button
                  onClick={() => accion(q.id, 'desbloquear')}
                  disabled={loading === q.id + 'desbloquear'}
                  style={{ fontSize: '11px', color: '#059669', background: '#052e16', border: '1px solid #059669', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  {loading === q.id + 'desbloquear' ? '...' : 'Desbloquear'}
                </button>
              )}
              <button
                onClick={() => { if (confirm('¿Eliminar este quiz? Esta acción es irreversible.')) accion(q.id, 'eliminar') }}
                disabled={loading === q.id + 'eliminar'}
                style={{ fontSize: '11px', color: '#ef4444', background: '#2d0a0a', border: '1px solid #ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
              >
                {loading === q.id + 'eliminar' ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
            No hay quizzes con estos filtros.
          </div>
        )}
      </div>
    </div>
  )
}
