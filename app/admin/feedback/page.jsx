import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_ID = '0bccda9a-a636-45b9-aea9-8580ecffb3b9'

export default async function AdminFeedback({ searchParams }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) redirect('/dashboard')

  const sp = await searchParams
  const page = parseInt(sp?.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const { data: feedbacks, count } = await supabase
    .from('feedback')
    .select('*, users(email, username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = Math.ceil((count || 0) / limit)

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'hace un momento'
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
    if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + ' dias'
    return date.toLocaleDateString('es-AR')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '10px' }}>Admin</span>
        </div>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Volver al dashboard</a>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>Feedback de usuarios</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            {count || 0} mensajes en total · Página {page} de {totalPages || 1}
          </p>
        </div>

        {feedbacks && feedbacks.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {feedbacks.map(fb => (
                <div key={fb.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#059669' }}>
                        {fb.users?.username ? '@' + fb.users.username : fb.users?.email || 'Usuario anónimo'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '10px' }}>
                        {timeAgo(fb.created_at)}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#111', lineHeight: '1.6', marginBottom: '10px' }}>
                    {fb.message}
                  </p>
                  {fb.url && (
                    <div style={{ fontSize: '11px', color: '#9ca3af', background: '#f9fafb', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {fb.url}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {page > 1 && (
                <a href={'?page=' + (page - 1)} style={{ padding: '8px 16px', fontSize: '13px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
                  ← Anterior
                </a>
              )}
              {page < totalPages && (
                <a href={'?page=' + (page + 1)} style={{ padding: '8px 16px', fontSize: '13px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
                  Siguiente →
                </a>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
            <p style={{ fontSize: '16px', color: '#9ca3af' }}>Todavía no hay feedback.</p>
          </div>
        )}

      </div>
    </div>
  )
}