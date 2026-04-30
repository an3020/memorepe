export default function Terminos() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <a href="/ayuda" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Ayuda</a>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>Términos de Servicio</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '40px' }}>Última actualización: abril de 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>1. Aceptación de los términos</h2>
            <p>Al acceder y usar Memorepe (memorepe.com) aceptás estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, por favor no uses el servicio.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>2. Descripción del servicio</h2>
            <p>Memorepe es una plataforma de aprendizaje por repetición espaciada que permite a los usuarios crear, compartir y estudiar sets de preguntas de opción múltiple. El servicio incluye un algoritmo de programación de repasos, un planificador de exámenes y herramientas de seguimiento del progreso.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>3. Registro y cuenta</h2>
            <p>Para usar Memorepe necesitás crear una cuenta mediante Google OAuth. Sos responsable de mantener la seguridad de tu cuenta y de todas las actividades que ocurran en ella. Debés notificarnos inmediatamente si detectás un uso no autorizado.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>4. Contenido del usuario</h2>
            <p style={{ marginBottom: '12px' }}>Al crear contenido en Memorepe (preguntas, respuestas, explicaciones):</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Mantenés la propiedad de tu contenido.</li>
              <li>Nos otorgás una licencia para almacenarlo, mostrarlo y distribuirlo dentro de la plataforma.</li>
              <li>Garantizás que tenés los derechos para publicar ese contenido.</li>
              <li>Aceptás no publicar contenido ilegal, ofensivo, engañoso o que infrinja derechos de terceros.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>5. Uso aceptable</h2>
            <p style={{ marginBottom: '12px' }}>Te comprometés a no usar Memorepe para:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Publicar contenido que viole derechos de autor u otros derechos de propiedad intelectual.</li>
              <li>Distribuir malware, spam o contenido malicioso.</li>
              <li>Intentar acceder de forma no autorizada a los sistemas de la plataforma.</li>
              <li>Usar el servicio de forma que pueda dañar, sobrecargar o perjudicar la plataforma.</li>
              <li>Publicar contenido que promueva el odio, la discriminación o la violencia.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>6. Plan gratuito y limitaciones</h2>
            <p>El plan gratuito incluye acceso a las funciones principales con las siguientes limitaciones: hasta 2 exámenes activos simultáneos, hasta 3 sets de preguntas por examen, y hasta 3 importaciones con inteligencia artificial por mes. Nos reservamos el derecho de modificar estas limitaciones con previo aviso.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>7. Disponibilidad del servicio</h2>
            <p>Nos esforzamos por mantener Memorepe disponible de forma continua, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados o no programados. No somos responsables por pérdidas derivadas de interrupciones del servicio.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>8. Propiedad intelectual</h2>
            <p>El nombre Memorepe, su logotipo, diseño y código son propiedad de sus creadores. No podés copiar, modificar ni distribuir ningún elemento de la plataforma sin autorización expresa.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>9. Cancelación de cuenta</h2>
            <p>Podés eliminar tu cuenta en cualquier momento. Al hacerlo, se eliminarán tus datos personales y tu contenido privado. El contenido que hayas publicado de forma pública puede permanecer en la plataforma de forma anonimizada. Nos reservamos el derecho de suspender cuentas que violen estos términos.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>10. Limitación de responsabilidad</h2>
            <p>Memorepe se proporciona "tal cual", sin garantías de ningún tipo. No somos responsables por daños directos, indirectos o consecuentes derivados del uso o la imposibilidad de uso del servicio. El uso de Memorepe es bajo tu propia responsabilidad.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>11. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos los cambios significativos por correo electrónico o mediante un aviso en la plataforma. El uso continuado del servicio implica la aceptación de los nuevos términos.</p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '12px' }}>12. Contacto</h2>
            <p>Para consultas relacionadas con estos términos, contáctanos en <strong>memorepe@gmail.com</strong>.</p>
          </div>

        </div>
      </div>

      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px', textAlign: 'center', marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
          <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Inicio</a>
          <a href="/privacidad" style={{ color: '#9ca3af', textDecoration: 'none' }}>Política de privacidad</a>
          <a href="/ayuda" style={{ color: '#9ca3af', textDecoration: 'none' }}>Ayuda</a>
        </div>
      </footer>
    </div>
  )
}