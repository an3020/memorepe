'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null)
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) return

      const dismissed = localStorage.getItem('announcement_dismissed_' + data.id)
      if (!dismissed) {
        setAnnouncement(data)
        setVisible(true)
      }
    }
    load()
  }, [])

  function dismiss() {
    localStorage.setItem('announcement_dismissed_' + announcement.id, '1')
    setVisible(false)
  }

  if (!visible || !announcement) return null

  const colors = {
    info: { bg: '#e0f2fe', border: '#7dd3fc', color: '#0369a1' },
    warning: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
    promo: { bg: '#f0fdf4', border: '#6ee7b7', color: '#065f46' },
    success: { bg: '#f0fdf4', border: '#6ee7b7', color: '#065f46' },
  }

  const c = colors[announcement.type] || colors.info

  return (
    <div style={{ background: c.bg, borderBottom: '1px solid ' + c.border, padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
      <p style={{ fontSize: '13px', color: c.color, margin: 0, flex: 1 }}>
        {announcement.message}
      </p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        {announcement.cta_text && announcement.cta_url && (
          <a
            href={announcement.cta_url}
            style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: c.color, padding: '5px 12px', borderRadius: '6px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {announcement.cta_text}
          </a>
        )}
        <button
          onClick={dismiss}
          style={{ fontSize: '11px', color: c.color, background: 'none', border: '1px solid ' + c.border, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          No mostrar de nuevo
        </button>
      </div>
    </div>
  )
}
