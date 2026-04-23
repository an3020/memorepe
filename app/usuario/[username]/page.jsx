import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function UsuarioPage({ params, searchParams }) {
  const { username } = await params
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

  const { data: autor } = await supabase
    .from('users')
    .select('id, username, full_name, created_at')
    .eq('username', username)
    .single()

  if (!autor) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Usuario no encontrado</p>
          <a href="/explorar" style={{ fontSize: '13px', color: '#059669', textDecoration: 'none' }}>Volver al explorador</a>
        </div>
      </div>
    )
  }

  const sp = await searchParams
  const categoria = sp?.categoria || ''
  const busqueda = sp?.q || ''

  let query = supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', autor.id)
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })

  if (categoria) query = query.eq('category', categoria)
  if (busqueda) query = query.or('title.ilike.%' + busqueda + '%,subject.ilike.%' + busqueda + '%')

  const { data: quizzes } = await query

  const { data: totalQuizzes } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact' })
    .eq('user_id', autor.id)
    .eq('visibility', 'public')

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
    return '/usuario/' + username + (parts.length ? '?' + parts.join('&') : '')
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

  const avatarLetras = (autor.full_name || autor.username).slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Inicio</a>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/crear-quiz" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Crear quiz</a>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '28px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '500', color: '#065f46', flexShrink: 0 }}>
            {avatarLetras}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '2px' }}>
              {autor.full_name || autor.username}
            </div>
            <div style={{ fontSize: '13px', color: '#059669', marginBottom: '6px' }}>@{autor.username}</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{totalQuizzes?.length || 0} quizzes publicos</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Miembro desde {new Date(autor.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          </div>
        </div>

        <form method="GET" action={'/usuario/' + username} style={{ marginBottom: '16px' }}>
          <input type="hidden" name="categoria" value={categoria} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar en los quizzes de este autor..."
              style={{ flex: 1, padding: '9px 14px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#111', fontFamily: 'Arial, sans-serif' }}
            />
            <button
              type="submit"
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Buscar
            </button>
            {busqueda && (
              <a
                href={buildUrl(categoria, '')}
                style={{ padding: '9px 14px', fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}
              >
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
              return (
                <div key={quiz.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
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
                  {quiz.notes && (
                    <div style={{ fontSize: '12px', color: '#6b7280', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px', lineHeight: '1.4' }}>
                      {quiz.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{timeAgo(quiz.updated_at || quiz.created_at)}</span>
                    <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
                      Estudiar
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>
              {busqueda ? 'No encontramos resultados' : 'Este usuario no tiene quizzes publicos todavia'}
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {busqueda ? 'Proba con otro termino.' : ''}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
