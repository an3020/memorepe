export default function Bloqueado() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>
          Cuenta suspendida
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '24px' }}>
          Tu cuenta fue suspendida por incumplimiento de los términos de uso. Si creés que es un error, contactanos a{' '}
          <a href="mailto:memorepe@gmail.com" style={{ color: '#059669', textDecoration: 'none' }}>
            memorepe@gmail.com
          </a>
          .
        </p>
        <a
          href="/auth/logout"
          style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
        >
          Cerrar sesión
        </a>
      </div>
    </div>
  )
}
