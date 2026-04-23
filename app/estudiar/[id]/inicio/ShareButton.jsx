'use client'

import { useState } from 'react'

export default function ShareButton({ quizId }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.origin + '/quiz/' + quizId
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      style={{
        background: 'none',
        border: '1px solid',
        borderColor: copied ? '#059669' : '#e5e7eb',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '13px',
        color: copied ? '#059669' : '#9ca3af',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Link copiado' : '🔗 Compartir'}
    </button>
  )
}
