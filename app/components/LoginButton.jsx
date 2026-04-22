'use client'

import { createClient } from '@/lib/supabase'

export default function LoginButton({ label = 'Iniciar sesión', primary = false }) {
  const supabase = createClient()

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <button
      onClick={loginWithGoogle}
      className={
        primary
          ? 'px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700'
          : 'px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50'
      }
    >
      {label}
    </button>
  )
}