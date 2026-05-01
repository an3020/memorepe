'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AdminAnnouncementsClient({ announcements: initial }) {
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState(initial)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const tipos = [
    { value: 'info', label: 'Info', color: '#0369a1', bg: '#e0f2fe' },
    { value: 'warning', label: 'Aviso', color: '#92400e', bg: '#fef3c7' },
    { value: 'promo', label: 'Promo', color: '#065f46', bg: '#f0fdf4' },
    { value: 'success', label: 'Novedad', color: '#065f46', bg: '#f0fdf4' },
  ]

  async function create() {
    if (!message.trim()) return
    setSaving(true)

    await supabase.from('announcements').update({ active: false }).eq('active', true)

    const { data } = await supabase
      .from('announcements')
      .insert({
        message: message.trim(),
        type,
        active: true,
        cta_text: ctaText.trim() || null,
        cta_url: ctaUrl.trim() || null,
      })
      .select().single()

    setAnnouncements(prev => [data, ...prev.map(a => ({ ...a, active: false }))])
    setMessage('')
    setCtaText('')
    setCtaUrl('')
    setMsg('Banner activado.')
    setTimeout(() => setMsg(''), 3000)
    setSaving(false)
  }

  async function toggleActive(id, currentActive) {
    if (!currentActive) {
      await supabase.from('announcements').update({ active: false }).eq('active', true)
    }
    await supabase.from('announcements').update({ active: !currentActive }).eq('id', id)
    setAnnouncements(prev => prev.map(a => ({
      ...a,
      active: a.id === id ? !currentActive : currentActive ? false : a.active
    })))
  }

  async function deleteAnnouncement(id) {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const input = { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '10px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/admin/feedback" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Feedback</a>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Dashboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Banners de comunicación</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>Solo puede haber un banner activo a la vez.</p>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>Nuevo banner</div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mensaje *</label>
            <textarea
              style={{ ...input, minHeight: '80px', resize: 'vertical' }}
              placeholder="Ej: Esta semana lanzamos el Plan Pro. Conocé los beneficios."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Tipo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {tipos.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid', borderColor: type === t.value ? t.color : '#e5e7eb', borderRadius: '8px', background: type === t.value ? t.bg : 'white', color: type === t.value ? t.color : '#9ca3af', cursor: 'pointer', fontWeight: type === t.value ? '500' : '400' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Texto del botón <span style={{ color: '#9ca3af' }}>(opcional)</span></label>
              <input style={input} placeholder="Ej: Ver más" value={ctaText} onChange={e => setCtaText(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>URL del botón <span style={{ color: '#9ca3af' }}>(opcional)</span></label>
              <input style={input} placeholder="Ej: /ayuda o https://..." value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
            </div>
          </div>

          <button
            onClick={create}
            disabled={saving || !message.trim()}
            style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: saving || !message.trim() ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {saving ? 'Activando...' : 'Activar banner'}
          </button>
        </div>

        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>
          Historial ({announcements.length})
        </div>

        {announcements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #e5e7eb', borderRadius: '12px', color: '#9ca3af', fontSize: '13px' }}>
            No hay banners todavía.
          </div>
        )}

        {announcements.map(a => {
          const t = tipos.find(t => t.value === a.type) || tipos[0]
          return (
            <div key={a.id} style={{ border: '1px solid', borderColor: a.active ? t.color : '#e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '10px', background: a.active ? t.bg : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 6px', borderRadius: '4px', background: t.bg, color: t.color, border: '1px solid ' + t.color }}>{t.label}</span>
                    {a.active && <span style={{ fontSize: '10px', fontWeight: '500', color: '#059669' }}>● ACTIVO</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#111', lineHeight: '1.5', marginBottom: '4px' }}>{a.message}</div>
                  {a.cta_text && <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>CTA: {a.cta_text} → {a.cta_url}</div>}
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{a.created_at?.slice(0, 10)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => toggleActive(a.id, a.active)}
                    style={{ fontSize: '11px', color: a.active ? '#92400e' : '#059669', background: a.active ? '#fef3c7' : '#f0fdf4', border: '1px solid', borderColor: a.active ? '#fcd34d' : '#6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    {a.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
