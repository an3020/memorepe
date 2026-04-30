import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (e) {}
        }
      }
    }
  )

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('title, description, notes, subject, faculty, question_count, users(username)')
    .eq('slug', slug)
    .single()

  if (!quiz) return { title: 'Quiz no encontrado — Memorepe' }

  const desc = quiz.description ||
    `${quiz.question_count} preguntas de ${quiz.subject || 'estudio'}${quiz.faculty ? ' · ' + quiz.faculty : ''}. Estudiá gratis con repetición espaciada en Memorepe.`

  return {
    title: quiz.title + ' — Memorepe',
    description: desc,
    openGraph: {
      title: quiz.title + ' — Memorepe',
      description: desc,
      type: 'website',
      url: 'https://memorepe.com/quiz/' + slug,
    },
  }
}

export default async function QuizSlug({ params }) {
  const { slug } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (e) {}
        }
      }
    }
  )

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, users(username, full_name)')
    .eq('slug', slug)
    .single()

  if (!quiz || quiz.visibility === 'private') {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Quiz no disponible</p>
          <a href="/explorar" style={{ fontSize: '13px', color: '#059669', textDecoration: 'none' }}>Explorar quizzes públicos</a>
        </div>
      </div>
    )
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('id, body, type')
    .eq('quiz_id', quiz.id)
    .order('order')
    .limit(15)

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

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', background: catStyle.bg, color: catStyle.color }}>
            {quiz.category || 'Otro'}
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '500', color: '#111', lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          {quiz.title}
        </h1>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          {username && (
            <a href={'/usuario/' + username} style={{ fontSize: '13px', color: '#059669', textDecoration: 'none', fontWeight: '500' }}>
              @{username}
            </a>
          )}
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.question_count} preguntas</span>
          {quiz.subject && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.subject}</span>}
          {quiz.faculty && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.faculty}</span>}
          {quiz.student_count > 0 && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{quiz.student_count} estudiantes</span>}
        </div>

        {quiz.description && (
          <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', marginBottom: '16px' }}>
            {quiz.description}
          </p>
        )}

        {quiz.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', fontSize: '14px', color: '#78350f', lineHeight: '1.5' }}>
            {quiz.notes}
          </div>
        )}

        <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '16px', padding: '28px', marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#065f46', marginBottom: '8px' }}>
            Estudiá este quiz gratis con repetición espaciada
          </h2>
          <p style={{ fontSize: '14px', color: '#059669', lineHeight: '1.6', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
            Memorepe usa un algoritmo científico que te muestra cada pregunta en el momento exacto antes de que la olvides. Estudias menos tiempo y retienes más.
          </p>
          <a
            href={'/estudiar/' + quiz.id + '/inicio'}
            style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none' }}
          >
            Empezar a estudiar gratis →
          </a>
          <p style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '12px' }}>
            Solo necesitás una cuenta de Google. Es gratis.
          </p>
        </div>

        {questions && questions.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>
              Preguntas de este quiz
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
              Mostramos {questions.length} de {quiz.question_count} preguntas. Registrate para estudiarlas todas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                    <span>{idx + 1}</span>
                    <span>·</span>
                    <span>{q.type === 'single' ? 'Una correcta' : 'Múltiple correcta'}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#111', lineHeight: '1.5' }}>{q.body}</div>
                </div>
              ))}
            </div>

            {quiz.question_count > 15 && (
              <div style={{ marginTop: '16px', border: '1px dashed #e5e7eb', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  + {quiz.question_count - 15} preguntas más disponibles
                </p>
                <a
                  href={'/estudiar/' + quiz.id + '/inicio'}
                  style={{ fontSize: '13px', fontWeight: '500', color: '#059669', textDecoration: 'none' }}
                >
                  Estudiar todas las preguntas gratis →
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>
            ¿Qué es Memorepe?
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.7', marginBottom: '16px' }}>
            Memorepe es una plataforma de estudio gratuita basada en repetición espaciada — el método científicamente probado para aprender más en menos tiempo. El algoritmo SM-2 calcula cuándo necesitás repasar cada pregunta para no olvidarla, y el planificador de exámenes te dice exactamente cuánto estudiar cada día para llegar preparado.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="/explorar" style={{ fontSize: '13px', color: '#059669', textDecoration: 'none', fontWeight: '500' }}>
              Explorar más quizzes →
            </a>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              Conocer Memorepe →
            </a>
          </div>
        </div>

      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af', textDecoration: 'none' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/explorar" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Explorar</a>
          <a href="/privacidad" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Privacidad</a>
          <a href="/terminos" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Términos</a>
        </div>
      </footer>
    </div>
  )
}