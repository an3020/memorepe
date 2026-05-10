import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import FavoriteButton from './FavoriteButton'
import ShareButton from './ShareButton'
import ResetProgressButton from '@/app/components/ResetProgressButton'

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

  // Calcular preguntas no vistas
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', id)

  const questionIds = questions?.map(q => q.id) || []

  const { data: progressData } = await supabase
    .from('user_question_progress')
    .select('question_id')
    .eq('user_id', user.id)
    .in('question_id', questionIds)

  const seenIds = new Set(progressData?.map(p => p.question_id) || [])
  const unseenCount = questionIds.filter(qid => !seenIds.has(qid)).length

  // Stats del usuario en este banco
  const { data: quizProgress } = await supabase
    .rpc('get_user_quizzes_progress', { p_user_id: user.id, p_quiz_ids: [id] })

  const p = quizProgress?.[0] || null
  const tieneProgreso = p && p.seen > 0

  // Sesiones en este banco
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('correct, total_questions, finished_at')
    .eq('user_id', user.id)
    .eq('quiz_id', id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  const totalSesiones = sessions?.length || 0
  const totalCorrectas = sessions?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0
  const totalPreguntas = sessions?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0
  const precision = totalPreguntas > 0 ? Math.round((totalCorrectas / totalPreguntas) * 100) : null
  const ultimaSesion = sessions?.[0]?.finished_at
  const diasDesdeUltima = ultimaSesion
    ? Math.floor((new Date() - new Date(ultimaSesion)) / (1000 * 60 * 60 * 24))
    : null

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

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Info del quiz */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', flex: 1, marginRight: '12px' }}>{quiz.title}</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ShareButton quizId={id} quizSlug={quiz.slug} />
              <FavoriteButton quizId={id} userId={user.id} initialFavorite={isFavorite} />
            </div>
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
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#78350f', marginTop: '10px', lineHeight: '1.5' }}>
              {quiz.notes}
            </div>
          )}
        </div>

        {/* Stats del usuario en este banco */}
        {tieneProgreso && (
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '10px' }}>Tu progreso en este banco</div>

            {/* Barra de progreso */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>{p.seen_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Vistas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#d97706' }}>{p.in_progress_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>En progreso</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#059669' }}>{p.dominated_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Dominadas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#0369a1' }}>{p.expert_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Experto</div>
              </div>
            </div>

            {/* Barra tricolor */}
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', display: 'flex' }}>
                <div style={{ width: p.expert_pct + '%', background: '#0369a1' }} />
                <div style={{ width: Math.max(0, p.dominated_pct - p.expert_pct) + '%', background: '#059669' }} />
                <div style={{ width: Math.max(0, p.in_progress_pct - p.dominated_pct) + '%', background: '#fcd34d' }} />
              </div>
            </div>

            {/* 3 tarjetitas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div style={{ background: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#111' }}>{totalSesiones}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Sesiones</div>
              </div>
              <div style={{ background: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#059669' }}>{precision !== null ? precision + '%' : '-'}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Precisión</div>
              </div>
              <div style={{ background: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#111' }}>
                  {diasDesdeUltima === null ? '-' : diasDesdeUltima === 0 ? 'Hoy' : diasDesdeUltima === 1 ? 'Ayer' : diasDesdeUltima + 'd'}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Última sesión</div>
              </div>
            </div>
          </div>
        )}

        {/* Modos de estudio */}
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>
          Elige como quieres estudiar hoy
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {unseenCount > 0 && (
            <a
              href={'/estudiar/' + id + '?n=new'}
              style={{ textDecoration: 'none', display: 'block', border: '2px solid #059669', borderRadius: '12px', padding: '14px 18px', background: '#f0fdf4', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>Solo preguntas nuevas</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#065f46' }}>{unseenCount} sin ver</span>
              </div>
              <p style={{ fontSize: '12px', color: '#065f46', opacity: 0.8, lineHeight: '1.5', margin: 0 }}>
                Aprende primero lo que nunca viste, sin mezclar con el repaso.
              </p>
            </a>
          )}

          {modos.map(modo => (
            <a
              key={modo.key}
              href={'/estudiar/' + id + '?n=' + modo.key}
              style={{ textDecoration: 'none', display: 'block', border: '1px solid', borderColor: modo.colorBorder, borderRadius: '12px', padding: '14px 18px', background: modo.color, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: modo.colorText }}>{modo.nombre}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: modo.colorText }}>{modo.preguntas} preguntas</span>
              </div>
              <p style={{ fontSize: '12px', color: modo.colorText, opacity: 0.8, lineHeight: '1.5', margin: 0 }}>{modo.desc}</p>
            </a>
          ))}
        </div>

        <ResetProgressButton quizId={id} userId={user.id} />

      </div>
    </div>
  )
}
