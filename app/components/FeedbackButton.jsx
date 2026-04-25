'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('feedback').insert({
      user_id: user?.id,
      message: message.trim(),
      url: window.location.href,
    })
    setSending(false)
    setSent(true)
    setMessage('')
    setTimeout(() => { setSent(false); setOpen(false) }, 2500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        💬 Feedback
      </button>

      {open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '24px', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>¿Qué encontraste?</p>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Tu feedback nos ayuda a mejorar.</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>×</button>
            </div>

            {sent ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#065f46' }}>
                ¡Gracias! Lo leemos con atención.
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Contanos qué encontraste raro, qué mejorarías o qué te gustó..."
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'Arial, sans-serif', minHeight: '90px', resize: 'none', boxSizing: 'border-box', marginBottom: '10px', color: '#111' }}
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', color: 'white', background: sending || !message.trim() ? '#9ca3af' : '#059669', border: 'none', borderRadius: '8px', cursor: sending || !message.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {sending ? 'Enviando...' : 'Enviar feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}