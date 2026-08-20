import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RevisionPage({ params }) {
  const { id: quizId, session_id } = await params
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('study_sessions')
    .select('*, quizzes(title)')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/dashboard')

  const { data: answers } = await supabase
    .from('session_answers')
    .select('*, questions(body, type, explanation, options(*))')
    .eq('session_id', session_id)
    .in('result', ['wrong', 'partial'])
    .order('created_at')

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/dashboard" style={{ fontSize: '16px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <a href={'/estudiar/' + quizId + '/inicio'} style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>
          Volver a estudiar
        </a>
      </nav>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>
            Revisión de fallos
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            {session.quizzes?.title} · {answers?.length || 0} pregunta{answers?.length !== 1 ? 's' : ''} para revisar
          </p>
        </div>

        {answers?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Sin fallos en esta sesión</p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Todo correcto.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {answers?.map((a, idx) => {
              const q = a.questions
              if (!q) return null
              const correctOptions = q.options?.filter(o => o.is_correct) || []
              const selectedOptions = q.options?.filter(o => a.selected_option_ids?.includes(o.id)) || []
              const wrongSelected = selectedOptions.filter(o => !o.is_correct)
              const missedCorrect = correctOptions.filter(o => !a.selected_option_ids?.includes(o.id))

              return (
                <div key={a.id} style={{ border: '1px solid', borderColor: a.result === 'wrong' ? '#fecaca' : '#fde68a', borderRadius: '12px', padding: '16px', background: a.result === 'wrong' ? '#fef2f2' : '#fffbeb' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '4px', background: a.result === 'wrong' ? '#fee2e2' : '#fef3c7', color: a.result === 'wrong' ? '#b91c1c' : '#92400e' }}>
                      {a.result === 'wrong' ? 'Incorrecto' : 'Parcial'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Pregunta {idx + 1}</span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', lineHeight: '1.5', marginBottom: '14px' }}>
                    {q.body}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: q.explanation ? '12px' : '0' }}>
                    {wrongSelected.length > 0 && wrongSelected.map(opt => (
                      <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: '500', flexShrink: 0 }}>✗</span>
                        <span style={{ fontSize: '13px', color: '#b91c1c' }}>{opt.body}</span>
                      </div>
                    ))}
                    {missedCorrect.length > 0 && missedCorrect.map(opt => (
                      <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px' }}>
                        <span style={{ color: '#059669', fontWeight: '500', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '13px', color: '#065f46' }}>{opt.body} <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>(no la seleccionaste)</span></span>
                      </div>
                    ))}
                    {correctOptions.filter(o => a.selected_option_ids?.includes(o.id)).map(opt => (
                      <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px' }}>
                        <span style={{ color: '#059669', fontWeight: '500', flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '13px', color: '#065f46' }}>{opt.body}</span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '10px', fontWeight: '500', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explicación</div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{q.explanation}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
          <a href={'/estudiar/' + quizId + '/inicio'} style={{ display: 'block', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none', textAlign: 'center' }}>
            Seguir estudiando
          </a>
          <a href="/dashboard" style={{ display: 'block', padding: '12px', fontSize: '14px', color: '#9ca3af', textDecoration: 'none', textAlign: 'center' }}>
            Ir al dashboard
          </a>
        </div>

      </div>
    </div>
  )
}