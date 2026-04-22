'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()
      if (profile?.username) {
        router.push('/dashboard')
      }
    }
    check()
  }, [])

  async function checkAvailability(value) {
    if (value.length < 3) { setAvailable(null); return }
    setChecking(true)
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('username', value)
      .single()
    setAvailable(!data)
    setChecking(false)
  }

  function handleChange(e) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')
    setUsername(value)
    setAvailable(null)
    setError('')
    if (value.length >= 3) {
      clearTimeout(window._usernameTimer)
      window._usernameTimer = setTimeout(() => checkAvailability(value), 600)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.')
      return
    }

    if (!/^[a-z0-9._]+$/.test(username)) {
      setError('Solo letras minusculas, numeros, puntos y guiones bajos.')
      return
    }

    if (available === false) {
      setError('Ese nombre de usuario ya esta tomado.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        username: username,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      })

    if (upsertError) {
      if (upsertError.code === '23505') {
        setError('Ese nombre de usuario ya esta tomado. Elegi otro.')
      } else {
        setError('Ocurrio un error. Intenta de nuevo.')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '1px solid',
    borderColor: available === true ? '#059669' : available === false ? '#ef4444' : '#e5e7eb',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    color: '#111',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: '500', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>
          Elegí tu nombre de usuario
        </h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px', lineHeight: '1.5' }}>
          Así te van a ver los demás en Memorepe. No se puede cambiar fácilmente después, así que elegí bien.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            <input
              type="text"
              placeholder="ej: juan.garcia"
              value={username}
              onChange={handleChange}
              style={inputStyle}
              maxLength={30}
            />
            {checking && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#9ca3af' }}>
                Verificando...
              </span>
            )}
            {!checking && available === true && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                Disponible
              </span>
            )}
            {!checking && available === false && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                No disponible
              </span>
            )}
          </div>

          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '20px' }}>
            Solo letras minusculas, numeros, puntos y guiones bajos. Minimo 3 caracteres.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || username.length < 3 || available === false}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              background: loading || !username || username.length < 3 || available === false ? '#9ca3af' : '#059669',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !username || username.length < 3 || available === false ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
