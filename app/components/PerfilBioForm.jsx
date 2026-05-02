'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function PerfilBioForm({ userId, initialBio }) {
  const [bio, setBio] = useState(initialBio || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function save() {
    setSaving(true)
    await supabase.from('users').update({ bio }).eq('id', userId)
    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (editing) {
    return (
      <div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={160}
          placeholder="Contá algo sobre vos..."
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'Arial, sans-serif', minHeight: '64px', resize: 'none', boxSizing: 'border-box', color: '#111' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{bio.length}/160</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setEditing(false)} style={{ fontSize: '12px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving} style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: saving ? '#9ca3af' : '#059669', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <p style={{ fontSize: '13px', color: bio ? '#374151' : '#9ca3af', margin: 0, flex: 1, lineHeight: '1.5' }}>
        {bio || 'Sin bio todavía.'}
      </p>
      <button onClick={() => setEditing(true)} style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>
        {saved ? '✓' : 'Editar'}
      </button>
    </div>
  )
}
