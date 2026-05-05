'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function PerfilForm({ userId, initialData }) {
  const [bio, setBio] = useState(initialData?.bio || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [career, setCareer] = useState(initialData?.career || '')
  const [website, setWebsite] = useState(initialData?.website || '')
  const [showEmail, setShowEmail] = useState(initialData?.show_email || false)
  const [showEmailWarning, setShowEmailWarning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function save() {
    setSaving(true)
    await supabase.from('users').update({
      bio,
      location,
      career,
      website,
      show_email: showEmail,
    }).eq('id', userId)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleShowEmailToggle() {
    if (!showEmail) {
      setShowEmailWarning(true)
    } else {
      setShowEmail(false)
    }
  }

  const input = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    color: '#111',
    background: 'white',
    boxSizing: 'border-box',
  }

  if (!editing) {
    return (
      <div>
        {/* Bio */}
        <p style={{ fontSize: '13px', color: bio ? '#374151' : '#9ca3af', margin: '0 0 10px', lineHeight: '1.5' }}>
          {bio || 'Contá algo sobre ti'}
        </p>

        {/* Info pública */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {location && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>📍 {location}</span>
          )}
          {career && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>🎓 {career}</span>
          )}
          {website && (
            <a href={website.startsWith('http') ? website : 'https://' + website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}>
              🌐 {website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        <button
          onClick={() => setEditing(true)}
          style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
        >
          {saved ? '✓ Guardado' : 'Editar perfil'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Bio */}
      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Descripción breve (opcional)</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={160}
          placeholder="Contá algo sobre ti..."
          style={{ ...input, minHeight: '64px', resize: 'none' }}
        />
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{bio.length}/160</span>
      </div>

      {/* Ubicación */}
      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>País o ciudad (opcional)</label>
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Ej: Buenos Aires, Argentina"
          style={input}
        />
      </div>

      {/* Carrera */}
      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Carrera o facultad (opcional)</label>
        <input
          value={career}
          onChange={e => setCareer(e.target.value)}
          placeholder="Ej: Derecho, UBA"
          style={input}
        />
      </div>

      {/* Sitio web */}
      <div>
        <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Sitio web (opcional)</label>
        <input
          value={website}
          onChange={e => setWebsite(e.target.value)}
          placeholder="tudominio.com"
          style={input}
        />
      </div>

      {/* Mostrar email */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#111', fontWeight: '500' }}>Mostrar email públicamente</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Tu email aparecerá en tu perfil público</div>
        </div>
        <button
          onClick={handleShowEmailToggle}
          style={{
            width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
            background: showEmail ? '#059669' : '#e5e7eb', position: 'relative', flexShrink: 0,
          }}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%', background: 'white',
            position: 'absolute', top: '2px', transition: 'left 0.2s',
            left: showEmail ? '20px' : '2px',
          }} />
        </button>
      </div>

      {/* Advertencia email */}
      {showEmailWarning && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 10px' }}>
            ⚠️ Tu email será visible para cualquier persona que visite tu perfil. ¿Estás seguro?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowEmail(true); setShowEmailWarning(false) }}
              style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: '#d97706', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}
            >
              Sí, mostrar mi email
            </button>
            <button
              onClick={() => setShowEmailWarning(false)}
              style={{ fontSize: '12px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ fontSize: '13px', fontWeight: '500', color: 'white', background: saving ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer' }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{ fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
