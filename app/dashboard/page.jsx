import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const nombre = user.user_metadata?.full_name?.split(' ')[0] || 'estudiante'
  const avatar = nombre.slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Inicio</span>
          <span style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>Explorar</span>
          <span style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>Mis quizzes</span>
          <span style={{ fontSize: '12px', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}>ES / EN</span>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#065f46' }}>
            {avatar}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Saludo */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Buen día, {nombre}.</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            Todavía no tenés quizzes activos.{' '}
            <span style={{ color: '#059669', cursor: 'pointer' }}>Creá el primero</span>
            {' '}o{' '}
            <span style={{ color: '#059669', cursor: 'pointer' }}>explorá los públicos</span>.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: 'Racha actual', value: '0 días', color: '#d97706' },
            { label: 'XP total', value: '0', color: '#111' },
            { label: 'Preguntas hoy', value: '0', color: '#059669' },
            { label: 'Precisión', value: '—', color: '#111' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '500', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div style={{ border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '48px', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>No tenés quizzes activos</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>Creá tu propio quiz o encontrá uno público para empezar a estudiar.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Crear quiz
            </button>
            <button style={{ padding: '8px 18px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
              Explorar quizzes
            </button>
          </div>
        </div>

        {/* Racha semanal */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>Racha semanal</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['L','M','X','J','V','S','D'].map((dia) => (
              <div key={dia} style={{ flex: 1, height: '36px', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#d1d5db' }}>
                {dia}
              </div>
            ))}
          </div>
        </div>

        {/* XP bar */}
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#111' }}>Nivel 1 — Principiante</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Completá tu primera sesión</span>
          </div>
          <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '0%', background: '#059669', borderRadius: '3px' }}></div>
          </div>
        </div>

      </div>
    </div>
  )
}