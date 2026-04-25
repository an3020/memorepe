'use client'

import { createClient } from '@/lib/supabase'

export default function LoginButton({ label = 'Iniciar sesión', primary = false }) {
  const supabase = createClient()

  async function loginWithGoogle() {
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
      ? process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback'
      : window.location.origin + '/auth/callback'
      
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    })
  }

  return (
    <button
      onClick={loginWithGoogle}
      style={primary ? {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        color: 'white',
        background: '#059669',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
      } : {
        padding: '10px 20px',
        fontSize: '14px',
        color: '#6b7280',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}