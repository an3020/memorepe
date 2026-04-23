'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function FavoriteButton({ quizId, userId, initialFavorite }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
      setIsFavorite(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, quiz_id: quizId })
      setIsFavorite(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: 'none',
        border: '1px solid',
        borderColor: isFavorite ? '#f59e0b' : '#e5e7eb',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '13px',
        color: isFavorite ? '#f59e0b' : '#9ca3af',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {isFavorite ? '★ Guardado' : '☆ Guardar'}
    </button>
  )
}
