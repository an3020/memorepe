import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Explorar({ searchParams }) {
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

  const params = await searchParams
  const categoria = params?.categoria || ''
  const busqueda = params?.q || ''

  let query = supabase
    .from('quizzes')
    .select('*, users(username)')
    .eq('visibility', 'public')
    .order('student_count', { ascending: false })

  if (categoria) query = query.eq('category', categoria)
  if (busqueda) query = query.or('title.ilike.%' + busqueda + '%,subject.ilike.%' + busqueda + '%')

  const { data: quizzes } = await query

  let progressMap = {}
  if (user && quizzes && quizzes.length > 0) {
    const quizIds = quizzes.map(q => q.id)
    const { data: progressData } = await supabase
      .rpc('get_user_quizzes_progress', { p_user_id: user.id, p_quiz_ids: quizIds })
    if (progressData) {
      progressData.forEach(p => { progressMap[p.quiz_id] = p })
    }
  }

  const categorias = [
    { value: '', label: 'Todo' },
    { value: 'derecho', label: 'Derecho' },
    { value: 'medicina', label: 'Medicina' },
    { value: 'economia', label: 'Economia' },
    { value: 'historia', label: 'Historia' },
    { value: 'idiomas', label: 'Idiomas' },
    { value: 'exactas', label: 'Exactas' },
    { value: 'otro', label: 'Otro' },
  ]

  const catColors = {
    derecho: { bg: '#e0f2fe', color: '#0369a1' },
    medicina: { bg: '#d1fae5', color: '#065f46' },
    economia: { bg: '#fef3c7', color: '#92400e' },
    historia: { bg: '#fce7f3', color: '#9d174d' },
    idiomas: { bg: '#ede9fe', color: '#5b21b6' },
    exactas: { bg: '#e0e7ff', color: '#3730a3' },
    otro: { bg: '#f3f4f6', color: '#374151' },
  }

  const pillBase = { fontSize: '12px', padding: '5px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', color: '#6b7280', textDecoration: 'none', display: 'inline-block' }
  const pillActive = { ...pillBase, border: '1px solid #6ee7b7', background: '#d1fae5', color: '#065f46', fontWeight: '500' }

  function buildUrl(cat, q) {
    const parts = []
    if (cat) parts.push('categoria=' + cat)
    if (q) parts.push('q=' + encodeURIComponent(q))
    return '/explorar' + (parts.length ? '?' + parts.join('&') : '')
  }

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
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Inicio</a>
          <a href="/explorar" style={{ fontSize: '13px', fontWeight: '500', color: '#111', textDecoration: 'none' }}>Explorar</a>
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear quiz</a>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>Explorar quizzes</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>{quizzes?.length || 0} quizzes publicos disponibles</p>

        <form method="GET" action="/explorar" style={{ marginBottom: '16px' }}>
          <input type="hidden" name="categoria" value={categoria} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar por titulo, materia, facultad..."
              style={{ flex: 1, padding: '9px 14px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif' }}
            />
            <button type="submit" style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Buscar
            </button>
            {busqueda && (
              <a href={buildUrl(categoria, '')} style={{ padding: '9px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
                Limpiar
              </a>
            )}
          </div>
        </form>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {categorias.map(cat => {
            const isActive = categoria === cat.value || (!categoria && cat.value === '')
            return (
              <a key={cat.value} href={buildUrl(cat.value, busqueda)} style={isActive ? pillActive : pillBase}>
                {cat.label}
              </a>
            )
          })}
        </div>

        {busqueda && (
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            Resultados para <strong>{busqueda}</strong>
          </p>
        )}

        {quizzes && quizzes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {quizzes.map(quiz => {
              const catStyle = catColors[quiz.category] || catColors.otro
              const username = quiz.users?.username
              const fechaActualizacion = timeAgo(quiz.updated_at || quiz.created_at)
              const p = progressMap[quiz.id]
              const tieneProgreso = p && p.seen > 0

              return (
                <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px', background: catStyle.bg, color: catStyle.color }}>
                      {quiz.category || 'Otro'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '4px', lineHeight: '1.3' }}>
                    {quiz.title}
                  </div>
                  {quiz.subject && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                      {quiz.subject}{quiz.faculty ? ' · ' + quiz.faculty : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{quiz.question_count} preguntas</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{quiz.student_count || 0} estudiantes</span>
                  </div>

                  {tieneProgreso && (
                    <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Round {p.round}</span>
                        <span style={{ color: '#059669', fontWeight: '500' }}>{p.dominated_pct}% dominadas</span>
                        {p.due_today > 0 && <span style={{ color: '#d97706', fontWeight: '500' }}>{p.due_today} para repasar hoy</span>}
                        {p.unseen > 0 && <span style={{ color: '#9ca3af' }}>{p.unseen} sin ver</span>}
                      </div>
                      <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: p.dominated_pct + '%', background: '#059669', borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}

                  {quiz.notes && (
                    <div style={{ fontSize: '12px', color: '#6b7280', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px', lineHeight: '1.4' }}>
                      {quiz.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {username && (
                        <a href={'/usuario/' + username} style={{ fontSize: '11px', color: '#059669', fontWeight: '500', textDecoration: 'none' }}>@{username}</a>
                      )}
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fechaActualizacion}</span>
                    </div>
                    <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                      {tieneProgreso ? 'Continuar' : 'Estudiar'}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>
              {busqueda ? 'No encontramos resultados' : 'No hay quizzes en esta categoria'}
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {busqueda ? 'Proba con otro termino.' : 'Se el primero en crear uno.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
