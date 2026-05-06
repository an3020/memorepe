'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminUsuariosClient({ usuarios }) {
  const [lista, setLista] = useState(usuarios)
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(null)
  const [msg, setMsg] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const filtrados = lista.filter(u =>
    !busqueda ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function toggleBloqueo(usuario) {
    setLoading(usuario.id)
    const nuevoEstado = !usuario.blocked
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggleBloqueo', userId: usuario.id, blocked: nuevoEstado })
    })
    if (res.ok) {
      setLista(lista.map(u => u.id === usuario.id ? { ...u, blocked: nuevoEstado } : u))
      setMsg(`@${usuario.username} ${nuevoEstado ? 'bloqueado' : 'desbloqueado'}.`)
      setTimeout(() => setMsg(''), 3000)
    }
    setLoading(null)
  }

  async function cambiarPlan(usuario, plan) {
    setLoading(usuario.id)
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cambiarPlan', userId: usuario.id, plan })
    })
    if (res.ok) {
      setLista(lista.map(u => u.id === usuario.id ? { ...u, plan } : u))
      setMsg(`Plan de @${usuario.username} cambiado a ${plan}.`)
      setTimeout(() => setMsg(''), 3000)
    }
    setLoading(null)
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 86400) return 'hoy'
    if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + 'd'
    return date.toLocaleDateString('es-AR')
  }

  return (
    <div>
      {msg && (
        <div style={{ background: '#052e16', border: '1px solid #059669', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#059669', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por username o email..."
        style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid #222', borderRadius: '8px', background: '#1a1a1a', color: 'white', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', marginBottom: '16px' }}
      />

      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 160px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #222', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Usuario</span>
          <span>Email</span>
          <span>Plan</span>
          <span>Sesiones</span>
          <span>Quizzes</span>
          <span>Registro</span>
          <span>Acciones</span>
        </div>

        {filtrados.map(u => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 160px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #111', alignItems: 'center', opacity: u.blocked ? 0.5 : 1 }}>
            <div>
              <span style={{ fontSize: '13px', color: u.blocked ? '#ef4444' : 'white', fontWeight: '500' }}>
                @{u.username || '—'}
              </span>
              {u.role === 'admin' && (
                <span style={{ fontSize: '10px', color: '#059669', marginLeft: '6px', background: '#052e16', padding: '1px 6px', borderRadius: '4px' }}>admin</span>
              )}
              {u.blocked && (
                <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '6px', background: '#2d0a0a', padding: '1px 6px', borderRadius: '4px' }}>bloqueado</span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{u.email}</span>
            <div>
              <select
                value={u.plan || 'free'}
                onChange={e => cambiarPlan(u, e.target.value)}
                disabled={loading === u.id || u.role === 'admin'}
                style={{ fontSize: '11px', color: u.plan === 'pro' ? '#059669' : '#6b7280', background: '#111', border: '1px solid #222', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{u.sesiones}</span>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{u.quizzes}</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{timeAgo(u.created_at)}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <a
                href={'/usuario/' + u.username}
                target="_blank"
                style={{ fontSize: '11px', color: '#6b7280', background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '4px 8px', textDecoration: 'none' }}
              >
                Ver
              </a>
              {u.role !== 'admin' && (
                <button
                  onClick={() => toggleBloqueo(u)}
                  disabled={loading === u.id}
                  style={{ fontSize: '11px', color: u.blocked ? '#059669' : '#ef4444', background: u.blocked ? '#052e16' : '#2d0a0a', border: '1px solid', borderColor: u.blocked ? '#059669' : '#ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                >
                  {loading === u.id ? '...' : u.blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
