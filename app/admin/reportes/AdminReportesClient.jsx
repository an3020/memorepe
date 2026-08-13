'use client'

import { useState } from 'react'

export default function AdminReportesClient({ pendientes, resueltos }) {
  const [listaPendientes, setListaPendientes] = useState(pendientes)
  const [listaResueltos, setListaResueltos] = useState(resueltos)
  const [loading, setLoading] = useState(null)
  const [msg, setMsg] = useState('')
  const [mostrarResueltos, setMostrarResueltos] = useState(false)

  async function resolver(reporteId) {
    setLoading(reporteId)
    const res = await fetch('/api/admin/reportes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolver', reporteId })
    })
    if (res.ok) {
      const reporte = listaPendientes.find(r => r.id === reporteId)
      setListaPendientes(listaPendientes.filter(r => r.id !== reporteId))
      setListaResueltos([{ ...reporte, status: 'resolved' }, ...listaResueltos])
      setMsg('Reporte marcado como resuelto.')
      setTimeout(() => setMsg(''), 3000)
    }
    setLoading(null)
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
    if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + ' días'
    return date.toLocaleDateString('es-AR')
  }

  function ReporteCard({ r, acciones }) {
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid', borderColor: acciones ? '#ef4444' : '#222', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: acciones ? '#ef4444' : '#6b7280', marginBottom: '4px' }}>{r.reason}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Quiz: <a href={'/admin/quizzes/' + r.quiz_id} target="_blank" style={{ color: '#059669', textDecoration: 'none' }}>{r.quizzes?.title}</a>
              {' · '}@{r.quizzes?.users?.username}
              {' · '}{timeAgo(r.created_at)}
            </div>
          </div>
          {acciones && (
            <button
              onClick={() => resolver(r.id)}
              disabled={loading === r.id}
              style={{ fontSize: '11px', color: '#059669', background: '#052e16', border: '1px solid #059669', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}
            >
              {loading === r.id ? '...' : 'Resolver'}
            </button>
          )}
        </div>
        <div style={{ background: '#111', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#9ca3af', marginBottom: r.comment ? '8px' : '0' }}>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>Pregunta: </span>
          {r.questions?.body?.slice(0, 120)}{r.questions?.body?.length > 120 ? '...' : ''}
        </div>
        {r.comment && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>
            "{r.comment}"
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {msg && (
        <div style={{ background: '#052e16', border: '1px solid #059669', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#059669', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {/* Pendientes */}
      {listaPendientes.length === 0 ? (
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #222', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: '#059669' }}>✓ Sin reportes pendientes</p>
        </div>
      ) : (
        listaPendientes.map(r => <ReporteCard key={r.id} r={r} acciones={true} />)
      )}

      {/* Resueltos */}
      <button
        onClick={() => setMostrarResueltos(!mostrarResueltos)}
        style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #222', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', marginTop: '8px' }}
      >
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
          Reportado por: <span style={{ color: '#059669' }}>@{r.users?.username || r.users?.email || 'usuario desconocido'}</span>
        </div>
        {mostrarResueltos ? 'Ocultar' : 'Ver'} resueltos ({listaResueltos.length})
      </button>

      {mostrarResueltos && (
        <div style={{ marginTop: '16px', opacity: 0.6 }}>
          {listaResueltos.map(r => <ReporteCard key={r.id} r={r} acciones={false} />)}
        </div>
      )}
    </div>
  )
}
