import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AdminDashboard() {
  const cookieStore = await cookies()

  // Cliente normal para verificar sesión
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
  if (!user) redirect('/')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') redirect('/dashboard')

  // Cliente con service role para datos completos
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const today = new Date().toISOString().split('T')[0]
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const hace7diasStr = hace7dias.toISOString()

  // Stats globales
  const { count: totalUsuarios } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalQuizzes } = await admin
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public')

  const { count: totalSesiones } = await admin
    .from('study_sessions')
    .select('*', { count: 'exact', head: true })
    .not('finished_at', 'is', null)

  const { count: sesionesHoy } = await admin
    .from('study_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('finished_at', today + 'T00:00:00')
    .not('finished_at', 'is', null)

  const { count: usuariosNuevosHoy } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today + 'T00:00:00')

  // Usuarios activos hoy
  const { data: activosHoyRaw } = await admin
    .from('study_sessions')
    .select('user_id, finished_at, users(username, email)')
    .gte('finished_at', today + 'T00:00:00')
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(30)

  const activosHoyUnicos = []
  const activosIds = new Set()
  for (const s of activosHoyRaw || []) {
    if (!activosIds.has(s.user_id) && activosHoyUnicos.length < 10) {
      activosIds.add(s.user_id)
      activosHoyUnicos.push(s)
    }
  }

  // Usuarios más nuevos
  const { data: usuariosNuevos } = await admin
    .from('users')
    .select('id, username, email, created_at, plan')
    .order('created_at', { ascending: false })
    .limit(10)

  // Usuarios más activos última semana
  const { data: sesionesUltimaSemana } = await admin
    .from('study_sessions')
    .select('user_id, total_questions, users(username, email)')
    .gte('finished_at', hace7diasStr)
    .not('finished_at', 'is', null)

  const actividadMap = {}
  for (const s of sesionesUltimaSemana || []) {
    if (!actividadMap[s.user_id]) {
      actividadMap[s.user_id] = {
        username: s.users?.username,
        email: s.users?.email,
        sesiones: 0,
        preguntas: 0,
      }
    }
    actividadMap[s.user_id].sesiones += 1
    actividadMap[s.user_id].preguntas += s.total_questions || 0
  }

  const masActivos = Object.values(actividadMap)
    .sort((a, b) => b.preguntas - a.preguntas)
    .slice(0, 10)

  function timeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'hace un momento'
    if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
    if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
    return date.toLocaleDateString('es-AR')
  }

  const colStyle = {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    flex: 1,
    border: '1px solid #222',
  }

  const colTitulo = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#059669',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #222',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ background: '#111', borderBottom: '1px solid #222', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'white' }}>
            memo<span style={{ color: '#059669' }}>repe</span>
            <span style={{ fontSize: '11px', color: '#059669', marginLeft: '8px', background: '#052e16', padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>
          </div>
          <a href="/admin" style={{ fontSize: '13px', fontWeight: '500', color: 'white', textDecoration: 'none' }}>Dashboard</a>
          <a href="/admin/usuarios" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Usuarios</a>
          <a href="/admin/quizzes" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Quizzes</a>
          <a href="/admin/reportes" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Reportes</a>
          <a href="/admin/feedback" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Feedback</a>
          <a href="/admin/announcements" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>Anuncios</a>
        </div>
        <a href="/dashboard" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>← Volver a Memorepe</a>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Usuarios totales', value: totalUsuarios || 0, color: 'white' },
            { label: 'Quizzes públicos', value: totalQuizzes || 0, color: 'white' },
            { label: 'Sesiones totales', value: totalSesiones || 0, color: 'white' },
            { label: 'Sesiones hoy', value: sesionesHoy || 0, color: '#059669' },
            { label: 'Nuevos hoy', value: usuariosNuevosHoy || 0, color: '#059669' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1a1a1a', borderRadius: '10px', padding: '16px', border: '1px solid #222' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '500', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* 3 columnas */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

          {/* Col 1: Activos hoy */}
          <div style={colStyle}>
            <div style={colTitulo}>⚡ Activos hoy</div>
            {activosHoyUnicos.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Sin actividad todavía hoy.</p>
            ) : (
              activosHoyUnicos.map((s, i) => (
                <div key={i} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>@{s.users?.username || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.users?.email}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(s.finished_at)}</div>
                </div>
              ))
            )}
          </div>

          {/* Col 2: Usuarios nuevos */}
          <div style={colStyle}>
            <div style={colTitulo}>🆕 Usuarios nuevos</div>
            {(usuariosNuevos || []).map((u, i) => (
              <div key={i} style={rowStyle}>
                <div>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>@{u.username || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{u.email}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(u.created_at)}</div>
              </div>
            ))}
          </div>

          {/* Col 3: Más activos semana */}
          <div style={colStyle}>
            <div style={colTitulo}>🏆 Más activos (7 días)</div>
            {masActivos.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Sin datos.</p>
            ) : (
              masActivos.map((u, i) => (
                <div key={i} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>@{u.username || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{u.sesiones} sesiones · {u.preguntas} preguntas</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>{u.preguntas}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
