'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.')
      setLoading(false)
      return
    }

    if (!/^[a-z0-9._]+$/.test(username)) {
      setError('Solo letras minúsculas, números, puntos y guiones bajos.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        username: username,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Ese nombre de usuario ya está tomado. Elegí otro.')
      } else {
        setError('Ocurrió un error. Intentá de nuevo.')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Elegí tu nombre de usuario</h1>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Así te van a ver los demás en Memorepe. No se puede cambiar después fácilmente, elegí bien.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="ej: juan.garcia"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          />
          <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
            Solo letras minúsculas, números, puntos y guiones bajos.
          </p>
        </div>

        {error && (
          <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Guardando...' : 'Continuar'}
        </button>
      </form>
    </main>
  )
}