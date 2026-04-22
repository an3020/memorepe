import type { FC } from 'react'
import LoginButton from './components/LoginButton'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.5px' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/explorar" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', cursor: 'pointer' }}>Explorar</a>
          <LoginButton />
        </div>
      </nav>

      <section style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '500', letterSpacing: '-1px', color: '#111', lineHeight: '1.15', marginBottom: '16px' }}>
          Estudia menos.<br />
          <span style={{ color: '#059669' }}>Aprende mas.</span>
        </h1>
        <p style={{ fontSize: '17px', color: '#6b7280', marginBottom: '40px', lineHeight: '1.6' }}>
          Memorepe usa repeticion espaciada para mostrarte exactamente lo que necesitas repasar, justo cuando lo necesitas.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <LoginButton label="Empezar gratis con Google" primary />
          <a href="/explorar" style={{ padding: '10px 20px', fontSize: '14px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none' }}>
            Explorar quizzes
          </a>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', margin: '0 24px 64px', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '500', color: '#111' }}>1.247</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Quizzes publicos</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '24px', fontWeight: '500', color: '#111' }}>3.891</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Estudiantes</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '500', color: '#111' }}>84.329</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Preguntas respondidas</div>
        </div>
      </section>

      <section style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ fontSize: '11px', fontWeight: '500', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Por que Memorepe</p>
        <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>No es un testeador. Es un sistema de aprendizaje.</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>La diferencia esta en que pasa despues de que respondes.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { titulo: 'Repeticion espaciada', desc: 'El algoritmo decide que repasar hoy segun tu historial personal.' },
            { titulo: 'Tu progreso real', desc: 'Sabes exactamente que dominas y que necesitas reforzar.' },
            { titulo: 'Comunidad', desc: 'Miles de quizzes creados por estudiantes como vos.' },
            { titulo: 'Logros y rachas', desc: 'XP, niveles y logros que reflejan tu aprendizaje real.' },
          ].map(f => (
            <div key={f.titulo} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{f.titulo}</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#d1d5db', cursor: 'pointer' }}>Terminos</span>
          <span style={{ fontSize: '12px', color: '#d1d5db', cursor: 'pointer' }}>Privacidad</span>
          <span style={{ fontSize: '12px', color: '#d1d5db', cursor: 'pointer' }}>Contacto</span>
        </div>
      </footer>

    </div>
  )
}
