import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function QuizPublicado({ params }) {
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
    .select('*')
    .eq('id', id)
    .single()

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', id)

  const withExplanation = questions?.filter(q => q.explanation)?.length || 0
  const multiple = questions?.filter(q => q.type === 'multiple')?.length || 0
  const single = questions?.filter(q => q.type === 'single')?.length || 0

  const s = {
    page: { minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' },
    logo: { fontSize: '18px', fontWeight: '500' },
    logoSpan: { color: '#059669' },
    wrap: { maxWidth: '560px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' },
    emoji: { fontSize: '48px', marginBottom: '16px' },
    h1: { fontSize: '22px', fontWeight: '500', color: '#111', marginBottom: '8px' },
    sub: { fontSize: '14px', color: '#6b7280', marginBottom: '32px' },
    box: { background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'left' },
    boxTitle: { fontSize: '15px', fontWeight: '500', color: '#111', marginBottom: '16px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
    statBox: { background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb' },
    statLabel: { fontSize: '11px', color: '#9ca3af', marginBottom: '2px' },
    statValue: { fontSize: '20px', fontWeight: '500', color: '#111' },
    statValueGreen: { fontSize: '20px', fontWeight: '500', color: '#059669' },
    notesBox: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' },
    notesLabel: { fontSize: '11px', color: '#92400e', fontWeight: '500', marginBottom: '4px' },
    notesText: { fontSize: '13px', color: '#78350f' },
    visBox: { background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: '#065f46' },
    actions: { display: 'flex', flexDirection: 'column', gap: '8px' },
    btnPrimary: { display: 'block', padding: '12px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none' },
    btnSecondary: { display: 'block', padding: '12px', fontSize: '14px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', textDecoration: 'none' },
    btnGhost: { display: 'block', padding: '12px', fontSize: '14px', color: '#9ca3af', textDecoration: 'none' },
  }

  const visibilityText = {
    public: '🌍 Este quiz es público. Cualquier estudiante puede encontrarlo y estudiarlo.',
    link: '🔗 Este quiz es accesible solo con el link directo.',
    private: '🔒 Este quiz es privado. Solo vos podés verlo.',
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          memo<span style={s.logoSpan}>repe</span>
        </div>
      </nav>
      <div style={s.wrap}>
        <div style={s.emoji}>🎉</div>
        <h1 style={s.h1}>Quiz publicado</h1>
        <p style={s.sub}>Tu quiz ya está disponible para que otros estudiantes lo usen.</p>
        <div style={s.box}>
          <div style={s.boxTitle}>{quiz?.title}</div>
          <div style={s.grid}>
            <div style={s.statBox}>
              <div style={s.statLabel}>Total preguntas</div>
              <div style={s.statValue}>{questions?.length || 0}</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>Con explicación</div>
              <div style={s.statValueGreen}>{withExplanation}</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>Una correcta</div>
              <div style={s.statValue}>{single}</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statLabel}>Múltiple correcta</div>
              <div style={s.statValue}>{multiple}</div>
            </div>
          </div>
          {quiz?.notes && (
            <div style={s.notesBox}>
              <div style={s.notesLabel}>Tu nota para los estudiantes</div>
              <div style={s.notesText}>{quiz.notes}</div>
            </div>
          )}
        </div>
        <div style={s.visBox}>
          {visibilityText[quiz?.visibility] || visibilityText.public}
        </div>
        <div style={s.actions}>
          <a href={'/estudiar/' + id} style={s.btnPrimary}>Empezar a estudiar ahora</a>
          <a href="/crear-quiz" style={s.btnSecondary}>Crear otro quiz</a>
          <a href="/dashboard" style={s.btnGhost}>Ir al dashboard</a>
        </div>
      </div>
    </div>
  )
}