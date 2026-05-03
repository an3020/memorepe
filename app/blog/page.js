import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

function getArticulos() {
  const postsDir = path.join(process.cwd(), 'app/blog/posts')
  if (!fs.existsSync(postsDir)) return []
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  return files
    .map(file => {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8')
      const { data } = matter(content)
      return {
        slug: data.slug || file.replace('.md', ''),
        title: data.title || '',
        excerpt: data.excerpt || '',
        date: data.date || '',
        image: data.image || null,
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export default function BlogIndex() {
  const articulos = getArticulos()

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Entrar</a>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: '500', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Blog</p>
        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Aprende a estudiar mejor</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '40px' }}>Técnicas, métodos y consejos para sacarle el máximo a tu tiempo de estudio.</p>

        {articulos.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Próximamente...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {articulos.map(art => (
              <a key={art.slug} href={'/blog/' + art.slug} style={{ textDecoration: 'none', display: 'block', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                {art.image ? (
                  <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '180px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '40px' }}>📚</span>
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                    {new Date(art.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#111', marginBottom: '8px', lineHeight: '1.4' }}>{art.title}</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>{art.excerpt}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <a href="/" style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af', textDecoration: 'none' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Términos</a>
          <a href="/privacidad" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Privacidad</a>
        </div>
      </footer>
    </div>
  )
}
