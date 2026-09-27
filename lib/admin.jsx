// Piezas compartidas del panel admin (tema oscuro)
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const C = {
  fondo: '#0d0d0d',
  panel: '#1a1a1a',
  borde: '#222',
  texto: '#f3f4f6',
  texto2: '#9ca3af',
  texto3: '#6b7280',
  verde: '#10b981',
  verdeOsc: '#052e16',
  rojo: '#f87171',
  ambar: '#fbbf24',
}

// Verifica que quien entra sea admin y devuelve un cliente con service role
export async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch (e) {}
        }
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: perfil } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'admin') redirect('/dashboard')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function num(v) {
  return Number(v || 0).toLocaleString('es-AR')
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
  if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
  if (diff < 604800) { const d = Math.floor(diff / 86400); return 'hace ' + d + (d === 1 ? ' día' : ' días') }
  return new Date(dateStr).toLocaleDateString('es-AR')
}

const navLink = { fontSize: '13px', color: C.texto3, textDecoration: 'none' }

export function AdminNav({ activo }) {
  const links = [
    ['/admin', 'Dashboard'],
    ['/admin/usuarios', 'Usuarios'],
    ['/admin/quizzes', 'Quizzes'],
    ['/admin/stats', 'Stats'],
    ['/admin/reportes', 'Reportes'],
    ['/admin/feedback', 'Feedback'],
    ['/admin/announcements', 'Anuncios'],
  ]
  return (
    <nav style={{ background: '#111', borderBottom: '1px solid ' + C.borde, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'white' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '11px', color: '#059669', marginLeft: '8px', background: C.verdeOsc, padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>
        </div>
        {links.map(([href, label]) => (
          <a key={href} href={href} style={activo === href ? { ...navLink, fontWeight: '500', color: 'white' } : navLink}>{label}</a>
        ))}
      </div>
      <a href="/dashboard" style={{ fontSize: '12px', color: C.texto3, textDecoration: 'none' }}>← Volver a Memorepe</a>
    </nav>
  )
}

export const estilos = {
  pagina: { minHeight: '100vh', background: C.fondo, fontFamily: 'Arial, sans-serif' },
  cont: { maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' },
  seccion: { background: C.panel, border: '1px solid ' + C.borde, borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  h1: { fontSize: '20px', fontWeight: '600', color: C.texto, margin: '0 0 4px 0' },
  h2: { fontSize: '15px', fontWeight: '600', color: C.texto, margin: '0 0 12px 0' },
  sub: { fontSize: '12px', color: C.texto3, margin: '0 0 16px 0' },
  th: { fontSize: '11px', fontWeight: '500', color: C.texto3, textAlign: 'right', padding: '8px', borderBottom: '1px solid ' + C.borde, whiteSpace: 'nowrap' },
  td: { fontSize: '13px', color: C.texto, textAlign: 'right', padding: '8px', borderBottom: '1px solid ' + C.borde, whiteSpace: 'nowrap' },
  vacio: { fontSize: '12px', color: C.texto3, padding: '8px 0' },
}
