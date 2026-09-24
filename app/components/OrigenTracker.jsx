'use client'

import { useEffect } from 'react'

// Guarda en una cookie la primera página que visitó alguien y de dónde vino
// (buscador, red social, utm). Al registrarse, el onboarding la copia al
// perfil para que el admin sepa qué contenido trae usuarios.
export default function OrigenTracker() {
  useEffect(() => {
    try {
      if (document.cookie.split('; ').some(c => c.startsWith('mr_origen='))) return
      const url = new URL(window.location.href)
      let ref = ''
      try {
        if (document.referrer) {
          const r = new URL(document.referrer)
          if (r.host !== window.location.host) ref = r.host.replace(/^www\./, '')
        }
      } catch (e) {}
      const utm = url.searchParams.get('utm_source') || ''
      const valor = encodeURIComponent(JSON.stringify({
        p: url.pathname.slice(0, 200),
        r: ref.slice(0, 100),
        u: utm.slice(0, 100),
      }))
      document.cookie = 'mr_origen=' + valor + '; path=/; max-age=' + (60 * 60 * 24 * 60) + '; SameSite=Lax'
    } catch (e) {}
  }, [])
  return null
}
