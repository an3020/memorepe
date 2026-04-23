import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import FavoriteButton from './FavoriteButton'

export default async function EstudiarInicio({ params }) {
  const { id } = await params
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

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, users(username)')
    .eq('id', id)
    .single()

  if (!quiz) redirect('/explorar')

  const { data: favorite } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('quiz_id', id)
    .single()

  const isFavorite = !!favorite

  const total = quiz.question_count || 0

  const modos = [
    {
      key: '10',
      nombre: 'Calentamiento',
      preguntas: 10,
      desc: 'Ideal para repasar rapido antes de un examen o mantener la racha diaria.',
      color: '#e0f2fe',
      colorBorder: '#7dd3fc',
      colorText: '#0369a1',
    },
    {
      key: '30',
      nombre: 'Sesion express',
      preguntas: 30,
      desc: 'El punto ideal entre esfuerzo y retencion. Recomendado para el estudio regular.',
      color: '#d1fae5',
      colorBorder: '#6ee7b7',
      colorText: '#065f46',
    },
    {
      key: '50',
      nombre: 'Sesion completa',
      preguntas: 50,
      desc: 'Para profundizar en un tema. El cerebro consolida mejor con sesiones mas largas.',
      color: '#ede9fe',
      colorBorder: '#c4b5fd',
      colorText: '#5b21b6',
    },
    {
      key: '100',
      nombre: 'Maraton',
      preguntas: 100,
      desc: 'Para dominar el material antes de un examen importante. Alta demanda cognitiva.',
      color: '#fef3c7',
      colorBorder: '#fcd34d',
      colorText: '#92400e',
    },
    {
      key: 'all',
      nombre: 'Modo repaso total',
      preguntas: total,
      desc: 'Repasas todo el quiz de una vez. Util para identificar tus puntos debiles.',
      color: '#f3f4f6',
      colorBorder: '#d1d5db',
      colorText: '#374151',
    },
  ].filter(m => m.key === 'all' || m.preguntas < total)

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Volver al dashboard</a>
      </nav>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', flex: 1, marginRight: '12px' }}>{quiz.title}</h1>
            <FavoriteButton quizId={id} userId={user.id} initialFavorite={isFavorite} />
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
            {total} preguntas en total
            {quiz.subject ? ' · ' + quiz.subject : ''}
            {quiz.faculty ? ' · ' + quiz.faculty : ''}
          </p>
          {quiz.users?.username && (
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              por <span style={{ color: '#059669' }}>@{quiz.users.username}</span>
              {' · '}
              {new Date(quiz.updated_at || quiz.created_at).toLocaleDateString('es-AR')}
            </p>
          )}
          {quiz.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#78350f', marginTop: '12px', lineHeight: '1.5' }}>
              {quiz.notes}
            </div>
          )}
        </div>

        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '16px' }}>
          Elegi como queres estudiar hoy
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {modos.map(modo => (
            <a
              key={modo.key}
              href={'/estudiar/' + id + '?n=' + modo.key}
              style={{ textDecoration: 'none', display: 'block', border: '1px solid', borderColor: modo.colorBorder, borderRadius: '12px', padding: '16px 20px', background: modo.color, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: modo.colorText }}>{modo.nombre}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: modo.colorText }}>{modo.preguntas} preguntas</span>
              </div>
              <p style={{ fontSize: '12px', color: modo.colorText, opacity: 0.8, lineHeight: '1.5', margin: 0 }}>{modo.desc}</p>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
