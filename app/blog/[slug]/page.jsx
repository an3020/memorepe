export const dynamic = 'force-dynamic'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { notFound } from 'next/navigation'

async function getArticulo(slug) {
  const postsDir = path.join(process.cwd(), 'app/blog/posts')
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const file = files.find(f => {
    const content = fs.readFileSync(path.join(postsDir, f), 'utf8')
    const { data } = matter(content)
    return (data.slug || f.replace('.md', '')) === slug
  })
  if (!file) return null
  const content = fs.readFileSync(path.join(postsDir, file), 'utf8')
  const { data, content: body } = matter(content)
  const processed = await remark().use(html).process(body)
  return { ...data, content: processed.toString() }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const art = await getArticulo(slug)
  if (!art) return { title: 'Artículo no encontrado — Memorepe' }
  return {
    title: art.title + ' — Memorepe',
    description: art.excerpt || '',
    openGraph: {
      title: art.title + ' — Memorepe',
      description: art.excerpt || '',
      type: 'article',
      url: 'https://memorepe.com/blog/' + slug,
    },
  }
}

export default async function BlogArticulo({ params }) {
  const { slug } = await params
  const art = await getArticulo(slug)
  if (!art) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/blog" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Blog</a>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none' }}>Entrar</a>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>

        <a href="/blog" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          ← Volver al blog
        </a>

        {art.image && (
          <img src={art.image} alt={art.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px', marginBottom: '32px' }} />
        )}

        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
          {new Date(art.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', lineHeight: '1.3', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          {art.title}
        </h1>

        {art.excerpt && (
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.7', marginBottom: '32px', borderLeft: '3px solid #6ee7b7', paddingLeft: '16px' }}>
            {art.excerpt}
          </p>
        )}

        <div
        className="blog-content"
        style={{ fontSize: '15px', color: '#374151', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: art.content }}
        />

        {/* CTA al final */}
        <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '16px', padding: '28px', marginTop: '48px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#065f46', marginBottom: '8px' }}>
            Ponlo en práctica con Memorepe
          </h2>
          <p style={{ fontSize: '14px', color: '#059669', lineHeight: '1.6', marginBottom: '20px' }}>
            Estudia con repetición espaciada, planifica tus exámenes y accede a miles de bancos de preguntas universitarios. Gratis.
          </p>
          <a href="/dashboard" style={{ display: 'inline-block', padding: '12px 28px', fontSize: '14px', fontWeight: '500', color: 'white', background: '#059669', borderRadius: '10px', textDecoration: 'none' }}>
            Empezar gratis →
          </a>
        </div>

      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <a href="/" style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af', textDecoration: 'none' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/blog" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Blog</a>
          <a href="/terminos" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Términos</a>
          <a href="/privacidad" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Privacidad</a>
        </div>
      </footer>
    </div>
  )
}
