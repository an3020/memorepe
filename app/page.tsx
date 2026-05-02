import LoginButton from './components/LoginButton'
import FeedbackButton from '@/app/components/FeedbackButton'
import HeroRotativo from '@/app/components/HeroRotativo'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Explorar</a>
          <LoginButton />
        </div>
      </nav>

      {/* Hero con rotación en cliente */}
      <HeroRotativo />

      {/* 3 cajas */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            {
              icon: '🧠',
              titulo: 'El algoritmo trabaja por ti',
              desc: 'Cada vez que estudias, el sistema aprende cómo aprendes y ajusta qué repasar al día siguiente.',
            },
            {
              icon: '📅',
              titulo: 'Planifica tu examen',
              desc: 'Carga tu fecha de examen y Memorepe te dice cuánto estudiar cada día para llegar preparado.',
            },
            {
              icon: '📚',
              titulo: 'Bancos de preguntas universitarios',
              desc: 'Miles de preguntas de opción múltiple creadas por estudiantes de medicina, derecho, economía y más.',
            },
          ].map(f => (
            <div key={f.titulo} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>{f.titulo}</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Por qué Memorepe */}
      <section style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ fontSize: '11px', fontWeight: '500', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Por qué Memorepe</p>
        <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>No es un testeador. Es un sistema de aprendizaje.</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>La diferencia está en qué pasa después de que respondes.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            {
              titulo: 'Un algoritmo moderno y eficiente',
              desc: 'No es azar ni orden fijo. El sistema decide qué estudiar hoy basándose en tu historial personal de respuestas.',
            },
            {
              titulo: 'Conoce tu progreso real',
              desc: 'Cada pregunta tiene un estado: vista, en progreso, dominada o experta. Siempre sabes dónde estás parado.',
            },
            {
              titulo: 'Planifica tu examen',
              desc: 'Ingresa la fecha de tu parcial y el sistema calcula cuánto estudiar por día para llegar sin sorpresas.',
            },
            {
              titulo: 'Banco de preguntas de la comunidad',
              desc: 'Accede a preguntas de opción múltiple creadas por estudiantes universitarios de toda la región.',
            },
          ].map(f => (
            <div key={f.titulo} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{f.titulo}</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Términos</a>
          <a href="/privacidad" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Privacidad</a>
          <a href="mailto:hola@memorepe.com" style={{ fontSize: '12px', color: '#d1d5db', textDecoration: 'none' }}>Contacto</a>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  )
}
