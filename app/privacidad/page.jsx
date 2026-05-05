export default function Privacidad() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <a href="/ayuda" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Ayuda</a>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Política de Privacidad</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '40px' }}>Última actualización: abril de 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>1. Quiénes somos</h2>
            <p>Memorepe es una plataforma de aprendizaje por repetición espaciada disponible en memorepe.com. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>2. Información que recopilamos</h2>
            <p style={{ marginBottom: '12px' }}>Cuando usas Memorepe recopilamos:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Información de cuenta:</strong> nombre, dirección de correo electrónico y foto de perfil proporcionados por Google al iniciar sesión.</li>
              <li><strong>Contenido que creas:</strong> sets de preguntas, respuestas y notas que agregas a la plataforma.</li>
              <li><strong>Datos de uso:</strong> historial de sesiones de estudio, respuestas a preguntas, progreso de aprendizaje y estadísticas de rendimiento.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y dispositivo, para garantizar el funcionamiento correcto del servicio.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>3. Cómo usamos tu información</h2>
            <p style={{ marginBottom: '12px' }}>Usamos tu información exclusivamente para:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Proporcionar y mejorar el servicio de aprendizaje personalizado.</li>
              <li>Calcular tu progreso y recomendaciones de estudio mediante el algoritmo de repetición espaciada.</li>
              <li>Enviarte recordatorios de estudio si optaste por recibirlos.</li>
              <li>Detectar y prevenir usos fraudulentos o abusivos de la plataforma.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>No vendemos ni compartimos tu información personal con terceros con fines comerciales.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>4. Almacenamiento de datos</h2>
            <p>Tus datos se almacenan de forma segura mediante Supabase, un servicio de base de datos en la nube con cifrado en tránsito y en reposo. Los servidores se encuentran en la región de Estados Unidos.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>5. Autenticación con Google</h2>
            <p>Memorepe utiliza Google OAuth para el inicio de sesión. Al autenticarte con Google, aceptás también las políticas de privacidad de Google. Solo accedemos a tu nombre, correo electrónico y foto de perfil. No accedemos a tus correos, contactos ni ningún otro dato de tu cuenta de Google.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>6. Contenido público</h2>
            <p>Los sets de preguntas que marques como "públicos" serán visibles para otros usuarios de la plataforma. Tu nombre de usuario aparecerá asociado a ese contenido. Podés cambiar la visibilidad de tus sets en cualquier momento desde la configuración del quiz.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>7. Tus derechos</h2>
            <p style={{ marginBottom: '12px' }}>Tienes derecho a:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Acceder a los datos que tenemos sobre ti.</li>
              <li>Solicitar la corrección de datos incorrectos.</li>
              <li>Solicitar la eliminación de tu cuenta y todos tus datos.</li>
              <li>Exportar tu contenido.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Para ejercer cualquiera de estos derechos, contáctanos en <strong>memorepe@gmail.com</strong>.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>8. Cookies</h2>
            <p>Memorepe utiliza cookies técnicas necesarias para el funcionamiento del servicio, como mantener tu sesión iniciada. No utilizamos cookies de seguimiento publicitario ni compartimos datos con redes publicitarias.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>9. Menores de edad</h2>
            <p>Memorepe no está dirigido a menores de 13 años. Si eres padre o tutor y crees que tu hijo ha proporcionado información personal, contáctanos para eliminarla.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>10. Cambios en esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos cualquier cambio significativo por correo electrónico o mediante un aviso en la plataforma. El uso continuado del servicio después de los cambios implica la aceptación de la nueva política.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>11. Contacto</h2>
            <p>Para cualquier consulta relacionada con esta política de privacidad, escríbenos a <strong>memorepe@gmail.com</strong>.</p>
          </div>

        </div>
      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px', textAlign: 'center', marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
          <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Inicio</a>
          <a href="/terminos" style={{ color: '#9ca3af', textDecoration: 'none' }}>Términos de servicio</a>
          <a href="/ayuda" style={{ color: '#9ca3af', textDecoration: 'none' }}>Ayuda</a>
        </div>
      </footer>
    </div>
  )
}