export default function Ayuda() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '500', textDecoration: 'none', color: '#111' }}>
          memo<span style={{ color: '#059669' }}>repe</span>
        </a>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Volver al dashboard</a>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '500', color: '#111', marginBottom: '10px' }}>Centro de ayuda</h1>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
            Todo lo que necesitas saber para sacarle el máximo provecho a Memorepe.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

          {/* BLOQUE 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🧠</div>
              <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>Cómo funciona Memorepe</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '3px solid #d1fae5', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Qué es la repetición espaciada?</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                  La repetición espaciada es un método de estudio basado en investigaciones científicas sobre cómo funciona la memoria. La idea central es simple: es más eficiente repasar algo justo antes de olvidarlo que repasarlo muchas veces seguidas.
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7', marginTop: '8px' }}>
                  Memorepe usa el algoritmo SM-2, desarrollado por el investigador Piotr Woźniak, para calcular exactamente cuándo necesitás volver a ver cada pregunta. Cuanto mejor la respondes, más tiempo pasa antes de que te la volvamos a mostrar.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #d1fae5', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Por qué las preguntas no son aleatorias?</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                  Cada vez que estudias, el algoritmo analiza tu historial y decide qué preguntas necesitás ver hoy. Prioriza las que están a punto de "vencerse" — es decir, las que si no repasás hoy, empezarías a olvidar. Esto hace que cada sesión sea exactamente lo que tu memoria necesita en ese momento.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #d1fae5', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '10px' }}>¿Qué significa cada nivel de progreso?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { color: '#6b7280', label: 'Vistas', desc: 'Respondiste la pregunta al menos una vez. Es tu punto de partida.' },
                    { color: '#d97706', label: 'En progreso', desc: 'La acertaste al menos una vez. El algoritmo va a volvértela a mostrar pronto para confirmar que la recuerdas.' },
                    { color: '#059669', label: 'Dominadas', desc: 'La acertaste correctamente en al menos 2 sesiones distintas. Si no la repasás en el intervalo recomendado, puede volver a "en progreso".' },
                    { color: '#0369a1', label: 'Experto', desc: 'La acertaste 4 o más veces en los últimos 30 días. Tu memoria la tiene bien consolidada. El algoritmo la va a mostrar cada vez menos seguido.' },
                  ].map(nivel => (
                    <div key={nivel.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: nivel.color, marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: nivel.color }}>{nivel.label}</span>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}> — {nivel.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #d1fae5', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Puedo perder lo que dominé?</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                  Sí, y eso es intencional. "Dominar" una pregunta no es permanente — depende del tiempo. Si no la repasás en el intervalo que recomienda el algoritmo, tu porcentaje de dominadas puede bajar. Esto refleja cómo funciona realmente la memoria. Por eso la racha diaria importa: mantener el ritmo evita que pierdas lo que ya aprendiste.
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📅</div>
              <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>El planificador de exámenes</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '3px solid #e0f2fe', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Qué hace el planificador?</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                  El planificador toma la fecha de tu examen, los sets de preguntas que querés estudiar y los días que tienes disponibles, y calcula exactamente cuántas preguntas necesitás estudiar cada día para llegar preparado. No es un número arbitrario — incluye un margen de seguridad del 30% para los días que no puedas estudiar.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #e0f2fe', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Qué son las fases del plan?</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  {[
                    { label: 'Fase de aprendizaje', desc: 'Los días normales de estudio. El algoritmo mezcla preguntas nuevas con las que necesitás repasar.' },
                    { label: 'Fase de repaso (últimos 3 días)', desc: 'No es momento de aprender cosas nuevas. Solo repasás lo que ya viste para consolidarlo antes del examen.' },
                    { label: 'Día del examen', desc: 'Ya hiciste todo lo que podías. Confiá en lo que estudiaste.' },
                  ].map(fase => (
                    <div key={fase.label} style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#0369a1', marginBottom: '3px' }}>{fase.label}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{fase.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #e0f2fe', paddingLeft: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '6px' }}>¿Qué significa el estado emocional del plan?</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
                  El planificador no solo te dice cuánto estudiar — también evalúa si vas bien encaminado, adelantado o atrasado respecto al plan. Si estás atrasado, te recomendamos una sesión extra. Si vas adelantado, puedes tomarte un descanso sin preocuparte.
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 3 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>❓</div>
              <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#111' }}>Preguntas frecuentes</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  q: '¿Cómo cargo mis preguntas?',
                  a: 'Tienes cuatro opciones: escribirlas una por una, subir un archivo CSV, importar desde Google Sheets, o pegar cualquier texto y dejar que la IA las extraiga automáticamente. La opción con IA es la más flexible — acepta apuntes, PDFs copiados, cualquier formato.'
                },
                {
                  q: '¿Qué diferencia hay con otras plataformas?',
                  a: 'Otras plataformas son una herramienta de diagnóstico: te muestran preguntas y te dicen si sabes o no. Memorepe es un sistema de aprendizaje: calcula cuándo necesitás repasar cada pregunta para que no la olvides, y te dice exactamente cuánto estudiar cada día para llegar preparado a tu examen.'
                },
                {
                  q: '¿Puedo usar sets de preguntas de otros usuarios?',
                  a: 'Sí. En la sección Explorar encontrarás sets públicos de otros usuarios. Puedes guardarlos como favoritos y agregarlos a tu plan de examen directamente.'
                },
                {
                  q: '¿Qué pasa con mis datos si dejo de usar Memorepe?',
                  a: 'Tu progreso, tus sets de preguntas y tu historial de estudio están guardados en tu cuenta. Si vuelves después de un tiempo, todo sigue ahí — aunque el algoritmo puede marcar algunas preguntas como "vencidas" porque pasó tiempo sin repasar.'
                },
                {
                  q: '¿Cuántos sets de preguntas puedo agregar a un examen?',
                  a: 'En el plan gratuito, hasta 3 sets por examen y hasta 2 exámenes activos simultáneos. Esto cubre la mayoría de los casos — en Argentina, por ejemplo, la mayoría de los exámenes tienen 2 parciales.'
                },
                {
                  q: '¿La importación con IA es gratuita?',
                  a: 'Tienes 3 importaciones gratuitas por mes. Cada importación puede procesar hasta 50 preguntas. Si necesitas más, puedes contactarnos.'
                },
              ].map((item, idx) => (
                <div key={idx} style={{ border: '1px solid #f0f0f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111', marginBottom: '8px' }}>{item.q}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#065f46', marginBottom: '6px' }}>¿Tienes alguna pregunta que no está acá?</p>
            <p style={{ fontSize: '13px', color: '#059669', marginBottom: '16px' }}>Usa el botón de feedback en el dashboard y te respondemos.</p>
            <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '500', color: 'white', background: '#059669', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none' }}>
              Ir al dashboard
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}