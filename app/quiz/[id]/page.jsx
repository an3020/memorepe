import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function generateMetadata({ params }) {
  const { id } = await params
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

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('title, description, notes, subject, faculty, users(username)')
    .eq('id', id)
    .single()

  if (!quiz) return { title: 'Quiz no encontrado' }

  const desc = quiz.description || quiz.notes || 
    `Quiz de ${quiz.subject || 'estudio'} con ${quiz.faculty ? quiz.faculty + '. ' : ''}Estudiá con repeticion espaciada en Memorepe.`

  return {
    title: quiz.title,
    description: desc,
    openGraph: {
      title: quiz.title + ' · Memorepe',
      description: desc,
      type: 'website',
    },
  }
}

export default async function QuizPublico({ params }) {
  const { id } = await params
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

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, users(username)')
    .eq('id', id)
    .single()

  if (!quiz || quiz.visibility === 'private') {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Quiz no disponible</p>
          <a href="/explorar" style={{ fontSize: '13px', color: '#059669', textDecoration: 'none' }}>Explorar quizzes publicos</a>
        </div>
      </div>
    )
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('id, body, type')
    .eq('quiz_id', id)
    .order('order')
    .limit(5)

  const catColors = {
    derecho: { bg: '#e0f2fe', color: '#0369a1' },
    medicina: { bg: '#d1fae5', color: '#065f46' },
    economia: { bg: '#fef3c7', color: '#92400e' },
    historia: { bg: '#fce7f3', color: '#9d174d' },
    idiomas: { bg: '#ede9fe', color: '#5b21b6' },
    exactas: { bg: '#e0e7ff', color: '#3730a3' },
    otro: { bg: '#f3f4f6', color: '#374151' },
  }

  const catStyle = catColors[quiz.category] || catColors.otro
  const username = quiz.users?.username
  const nombreAutor = username

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none' }}>
            Entrar
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', background: catStyle.bg, color: catStyle.color }}>
            {quiz.category || 'Otro'}
          </span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', lineHeight: '1.2', marginBottom: '12px', letterSpacing: '-0.5px' }}>
          {quiz.title}
        </h1>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          {username && (
            <a href={'/usuario/' + username} style={{ fontSize: '13px', color: '#059669', textDecoration: 'none', fontWeight: '500' }}>
              @{username}
            </a>
          )}
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.question_count} preguntas</span>
          {quiz.subject && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.subject}</span>}
          {quiz.faculty && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.faculty}</span>}
        </div>

        {quiz.description && (
          <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', marginBottom: '16px' }}>
            {quiz.description}
          </p>
        )}

        {quiz.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', fontSize: '14px', color: '#78350f', lineHeight: '1.5' }}>
            {quiz.notes}
          </div>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: '#065f46', marginBottom: '16px', fontWeight: '500' }}>
            Estudia este quiz gratis con repeticion espaciada
          </p>
          <a
            href={'/estudiar/' + id + '/inicio'}
            style={{ display: 'inline-block', padding: '12px 28px', fontSize: '15px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none' }}
          >
            Empezar a estudiar
          </a>
          <p style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '10px' }}>
            Requiere cuenta gratuita en Memorepe
          </p>
        </div>

        {questions && questions.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '14px' }}>
              Muestra de preguntas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                    Pregunta {idx + 1} · {q.type === 'single' ? 'Una correcta' : 'Multiple correcta'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#111', lineHeight: '1.4' }}>{q.body}</div>
                </div>
              ))}
              {quiz.question_count > 5 && (
                <div style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '10px' }}>
                  + {quiz.question_count - 5} preguntas mas. Registrate para ver todas.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>
            Que es Memorepe?
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
            Memorepe es una plataforma de aprendizaje que usa repeticion espaciada para ayudarte a estudiar mas eficientemente. El algoritmo SM-2 decide que preguntas repasar cada dia segun tu historial personal.
          </p>
          <a href="/" style={{ fontSize: '13px', color: '#059669', textDecoration: 'none', fontWeight: '500' }}>
            Conocer mas sobre Memorepe →
          </a>
        </div>

      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '48px' }}>
        <a href="/" style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af', textDecoration: 'none' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/explorar" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Explorar</a>
          <a href="/" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Inicio</a>
        </div>
      </footer>
    </div>
  )
}
