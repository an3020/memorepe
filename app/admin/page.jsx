import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fechaAR } from '@/lib/fechas'

export const revalidate = 0

// Paleta del admin (fondo oscuro)
const C = {
  fondo: '#0d0d0d',
  panel: '#1a1a1a',
  borde: '#222',
  texto: '#f3f4f6',
  texto2: '#9ca3af',
  texto3: '#6b7280',
  verde: '#10b981',
  verdeOsc: '#052e16',
  rojo: '#f87171',
  ambar: '#fbbf24',
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function semanaCorta(ymd) {
  const [, m, d] = ymd.split('-')
  return parseInt(d) + ' ' + MESES[parseInt(m) - 1]
}
function pct(a, b) {
  return b > 0 ? Math.round((a / b) * 100) : null
}
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min'
  if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h'
  if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + ' días'
  return new Date(dateStr).toLocaleDateString('es-AR')
}
function num(v) {
  return Number(v || 0).toLocaleString('es-AR')
}

const seccion = { background: C.panel, border: '1px solid ' + C.borde, borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const h2 = { fontSize: '16px', fontWeight: '600', color: C.texto, margin: '0 0 4px 0' }
const sub = { fontSize: '12px', color: C.texto3, margin: '0 0 16px 0' }
const subtitulo = { fontSize: '11px', fontWeight: '600', color: C.verde, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }
const fila = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid ' + C.borde }
const vacio = { fontSize: '12px', color: C.texto3, padding: '8px 0', lineHeight: '1.5' }
const th = { fontSize: '11px', fontWeight: '500', color: C.texto3, textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid ' + C.borde, whiteSpace: 'nowrap' }
const td = { fontSize: '13px', color: C.texto, textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid ' + C.borde, whiteSpace: 'nowrap' }
const unaLinea = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const dosLineas = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
const navLink = { fontSize: '13px', color: C.texto3, textDecoration: 'none' }

function Kpi({ label, valor, detalle, color }) {
  return (
    <div style={{ background: C.panel, border: '1px solid ' + C.borde, borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: C.texto3, marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: '500', color: color || C.texto }}>{valor}</div>
      {detalle && <div style={{ fontSize: '11px', color: C.texto2, marginTop: '4px', lineHeight: '1.4' }}>{detalle}</div>}
    </div>
  )
}

function Variacion({ ahora, antes }) {
  if (antes === undefined || antes === null) return null
  const d = Number(ahora) - Number(antes)
  if (d === 0) return <span style={{ color: C.texto3 }}>igual que la semana anterior</span>
  return (
    <span style={{ color: d > 0 ? C.verde : C.rojo }}>
      {d > 0 ? '▲ ' : '▼ '}{Math.abs(d)} vs semana anterior
    </span>
  )
}

function Contador({ n, color }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', background: n > 0 ? color + '22' : '#222', color: n > 0 ? color : C.texto3 }}>
      {n}
    </span>
  )
}

export default async function AdminDashboard() {
  const cookieStore = await cookies()

  // Cliente normal para verificar sesión
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
  if (!user) redirect('/')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') redirect('/dashboard')

  // Cliente con service role para datos completos
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Inicio de hoy en Argentina, como timestamp
  const hoyAR = fechaAR(new Date())
  const inicioHoy = new Date(hoyAR + 'T00:00:00-03:00').toISOString()
  const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    growthRes, busquedasRes, origenesRes, sinEstudiarRes, sospechosasRes,
    totalUsuariosRes, totalQuizzesRes, sesionesHoyRes, nuevosHoyRes, activosHoyRes,
    reportesRes, feedbackRes,
  ] = await Promise.all([
    admin.rpc('admin_growth', { p_weeks: 12 }),
    admin.rpc('admin_busquedas', { p_dias: 30 }),
    admin.rpc('admin_origenes', { p_dias: 30 }),
    admin.rpc('admin_sin_estudiar', { p_dias: 30 }),
    admin.rpc('admin_preguntas_sospechosas', { p_min_respuestas: 8 }),
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('quizzes').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
    admin.from('study_sessions').select('*', { count: 'exact', head: true }).gte('finished_at', inicioHoy),
    admin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', inicioHoy),
    admin.from('study_sessions').select('user_id').gte('finished_at', inicioHoy).limit(1000),
    admin.from('question_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('feedback').select('id, message, created_at, users(username)', { count: 'exact' })
      .gte('created_at', hace7dias).order('created_at', { ascending: false }).limit(5),
  ])

  const faltaSQL = [growthRes, busquedasRes, origenesRes, sinEstudiarRes, sospechosasRes].some(r => r.error)

  // ---------- 1. Crecimiento ----------
  const semanas = growthRes.data || []
  // Las tarjetas comparan semanas completas: la semana en curso está a medias
  const actual = semanas[semanas.length - 2]
  const anterior = semanas[semanas.length - 3]
  const maxActivos = Math.max(1, ...semanas.map(s => Number(s.activos)))

  // Activación: últimas 4 semanas completas (sin la actual)
  const completas = semanas.slice(-5, -1)
  const nuevos4 = completas.reduce((s, x) => s + Number(x.nuevos), 0)
  const activados4 = completas.reduce((s, x) => s + Number(x.activados), 0)
  const activacion = pct(activados4, nuevos4)
  // Retención: de los activos de la penúltima semana, cuántos volvieron en la última completa
  const ultimaCompleta = semanas[semanas.length - 2]
  const retencion = ultimaCompleta ? pct(Number(ultimaCompleta.retenidos), Number(ultimaCompleta.base_ret)) : null

  const activosHoy = new Set((activosHoyRes.data || []).map(s => s.user_id)).size

  // ---------- 2. Qué busca la gente ----------
  const busquedas = busquedasRes.data || []
  const sinResultado = busquedas.filter(b => b.sin_resultado).slice(0, 12)
  const masBuscadas = busquedas.slice(0, 12)
  const origenesPorTipo = {}
  for (const o of origenesRes.data || []) {
    if (!origenesPorTipo[o.tipo]) origenesPorTipo[o.tipo] = { tipo: o.tipo, usuarios: 0, activados: 0, detalles: [] }
    origenesPorTipo[o.tipo].usuarios += Number(o.usuarios)
    origenesPorTipo[o.tipo].activados += Number(o.activados)
    origenesPorTipo[o.tipo].detalles.push(o.detalle + ' (' + o.usuarios + ')')
  }
  const origenesLista = Object.values(origenesPorTipo).sort((a, b) => b.usuarios - a.usuarios)

  // ---------- 3. Pendientes ----------
  const sinEstudiar = sinEstudiarRes.data || []
  const sospechosas = sospechosasRes.data || []
  const reportesPendientes = reportesRes.count || 0
  const feedbacks = feedbackRes.data || []
  const feedbackCount = feedbackRes.count || 0

  return (
    <div style={{ minHeight: '100vh', background: C.fondo, fontFamily: 'Arial, sans-serif' }}>

      <nav style={{ background: '#111', borderBottom: '1px solid ' + C.borde, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'white' }}>
            memo<span style={{ color: '#059669' }}>repe</span>
            <span style={{ fontSize: '11px', color: '#059669', marginLeft: '8px', background: C.verdeOsc, padding: '2px 8px', borderRadius: '4px' }}>ADMIN</span>
          </div>
          <a href="/admin" style={{ ...navLink, fontWeight: '500', color: 'white' }}>Dashboard</a>
          <a href="/admin/usuarios" style={navLink}>Usuarios</a>
          <a href="/admin/quizzes" style={navLink}>Quizzes</a>
          <a href="/admin/stats" style={navLink}>Stats</a>
          <a href="/admin/reportes" style={navLink}>Reportes</a>
          <a href="/admin/feedback" style={navLink}>Feedback</a>
          <a href="/admin/announcements" style={navLink}>Anuncios</a>
        </div>
        <a href="/dashboard" style={{ fontSize: '12px', color: C.texto3, textDecoration: 'none' }}>← Volver a Memorepe</a>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

        {faltaSQL && (
          <div style={{ background: '#2d1f05', border: '1px solid #854d0e', color: C.ambar, borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>
            Falta correr <b>supabase/2026-09-23-admin-metricas.sql</b> en Supabase. Hasta entonces algunas secciones aparecen vacías.
          </div>
        )}

        {/* ============ RESUMEN ============ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '8px' }}>
          <Kpi
            label="Activos la semana pasada"
            valor={num(actual?.activos)}
            detalle={<Variacion ahora={actual?.activos} antes={anterior?.activos} />}
            color={C.verde}
          />
          <Kpi
            label="Nuevos la semana pasada"
            valor={num(actual?.nuevos)}
            detalle={<Variacion ahora={actual?.nuevos} antes={anterior?.nuevos} />}
          />
          <Kpi
            label="Activación (últimas 4 semanas)"
            valor={activacion !== null ? activacion + '%' : '—'}
            detalle={nuevos4 > 0 ? activados4 + ' de ' + nuevos4 + ' nuevos estudiaron en su 1ª semana' : 'Sin registros nuevos'}
          />
          <Kpi
            label="Retención semanal"
            valor={retencion !== null ? retencion + '%' : '—'}
            detalle={ultimaCompleta ? num(ultimaCompleta.retenidos) + ' de ' + num(ultimaCompleta.base_ret) + ' activos volvieron la semana siguiente' : ''}
          />
        </div>
        <div style={{ fontSize: '12px', color: C.texto3, marginBottom: '24px' }}>
          Hoy: <span style={{ color: C.texto2 }}>{num(activosHoy)} activos · {num(sesionesHoyRes.count)} sesiones · {num(nuevosHoyRes.count)} nuevos</span>
          {'  ·  '}Total: <span style={{ color: C.texto2 }}>{num(totalUsuariosRes.count)} usuarios · {num(totalQuizzesRes.count)} bancos públicos</span>
        </div>

        {/* ============ 1. ¿ESTÁ CRECIENDO? ============ */}
        <div style={seccion}>
          <h2 style={h2}>¿Está creciendo?</h2>
          <p style={sub}>Por semana, de lunes a domingo (hora Argentina). La última fila es la semana en curso, todavía incompleta.</p>
          {semanas.length === 0 ? (
            <div style={vacio}>Sin datos.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: 'left' }}>Semana</th>
                    <th style={{ ...th, textAlign: 'left', width: '36%' }}>Activos</th>
                    <th style={th}>Nuevos</th>
                    <th style={th}>Activados</th>
                    <th style={th}>Retención</th>
                    <th style={th}>Sesiones</th>
                    <th style={th}>Preguntas</th>
                  </tr>
                </thead>
                <tbody>
                  {semanas.map((s, i) => {
                    const enCurso = i === semanas.length - 1
                    const ret = pct(Number(s.retenidos), Number(s.base_ret))
                    const act = pct(Number(s.activados), Number(s.nuevos))
                    return (
                      <tr key={s.semana} style={{ opacity: enCurso ? 0.6 : 1 }}>
                        <td style={{ ...td, textAlign: 'left', color: enCurso ? C.texto : C.texto2 }}>
                          {semanaCorta(String(s.semana).slice(0, 10))}{enCurso && <span style={{ color: C.texto3 }}> (en curso)</span>}
                        </td>
                        <td style={{ ...td, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, minWidth: '60px' }}>
                              <div style={{ height: '10px', width: Math.max(2, (Number(s.activos) / maxActivos) * 100) + '%', background: enCurso ? '#065f46' : C.verde, borderRadius: '0 4px 4px 0' }} />
                            </div>
                            <span style={{ minWidth: '32px', textAlign: 'right' }}>{num(s.activos)}</span>
                          </div>
                        </td>
                        <td style={td}>{num(s.nuevos)}</td>
                        <td style={{ ...td, color: C.texto2 }}>{Number(s.nuevos) > 0 ? num(s.activados) + ' (' + act + '%)' : '—'}</td>
                        <td style={{ ...td, color: C.texto2 }}>{ret !== null ? ret + '%' : '—'}</td>
                        <td style={{ ...td, color: C.texto2 }}>{num(s.sesiones)}</td>
                        <td style={{ ...td, color: C.texto2 }}>{num(s.preguntas)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============ 2. ¿QUÉ BUSCA LA GENTE? ============ */}
        <div style={seccion}>
          <h2 style={h2}>¿Qué busca la gente?</h2>
          <p style={sub}>Últimos 30 días. Las búsquedas y el origen se registran desde el 23/09/2026.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

            <div>
              <div style={subtitulo}><span>Buscaron y no encontraron</span><Contador n={sinResultado.length} color={C.ambar} /></div>
              {sinResultado.length === 0 ? (
                <div style={vacio}>Nada todavía. Cuando alguien busque algo sin resultados, aparece acá: es un banco para crear.</div>
              ) : sinResultado.map(b => (
                <div key={b.q} style={fila}>
                  <div style={{ fontSize: '13px', color: C.texto, ...unaLinea }}>{b.q}</div>
                  <div style={{ fontSize: '11px', color: C.texto3, whiteSpace: 'nowrap' }}>
                    {b.veces}× · {b.personas} {Number(b.personas) === 1 ? 'persona' : 'personas'}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={subtitulo}><span>Lo más buscado</span></div>
              {masBuscadas.length === 0 ? (
                <div style={vacio}>Sin búsquedas todavía.</div>
              ) : masBuscadas.map(b => (
                <div key={b.q} style={fila}>
                  <a href={'/explorar?q=' + encodeURIComponent(b.q)} style={{ fontSize: '13px', color: C.texto, textDecoration: 'none', ...unaLinea }}>{b.q}</a>
                  <div style={{ fontSize: '11px', color: b.sin_resultado ? C.ambar : C.texto3, whiteSpace: 'nowrap' }}>
                    {b.veces}×{b.sin_resultado ? ' · sin resultado' : ''}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={subtitulo}><span>De dónde vienen los nuevos</span></div>
              {origenesLista.length === 0 ? (
                <div style={vacio}>Sin registros nuevos en 30 días.</div>
              ) : origenesLista.map(o => (
                <div key={o.tipo} style={{ ...fila, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: o.tipo === 'Sin dato' ? C.texto3 : C.texto }}>{o.tipo}</div>
                    <div style={{ fontSize: '11px', color: C.texto3, ...unaLinea }}>{o.detalles.slice(0, 3).join(' · ')}</div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '13px', color: C.texto }}>{o.usuarios}</div>
                    <div style={{ fontSize: '11px', color: C.texto3 }}>{o.activados} estudiaron</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ============ 3. PENDIENTES ============ */}
        <div style={seccion}>
          <h2 style={h2}>¿Qué tengo que hacer hoy?</h2>
          <p style={sub}>Lo que necesita tu atención.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

            <div>
              <div style={subtitulo}><span>Reportes sin resolver</span><Contador n={reportesPendientes} color={C.rojo} /></div>
              <div style={vacio}>
                {reportesPendientes > 0
                  ? <a href="/admin/reportes" style={{ color: C.texto2 }}>Ver {reportesPendientes} {reportesPendientes === 1 ? 'reporte' : 'reportes'} →</a>
                  : 'Todo resuelto.'}
              </div>

              <div style={{ ...subtitulo, marginTop: '20px' }}><span>Feedback (7 días)</span><Contador n={feedbackCount} color={C.ambar} /></div>
              {feedbacks.length === 0 ? (
                <div style={vacio}>Sin mensajes nuevos.</div>
              ) : (
                <>
                  {feedbacks.map(f => (
                    <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid ' + C.borde }}>
                      <div style={{ fontSize: '12px', color: C.texto, lineHeight: '1.5', ...dosLineas }}>{f.message}</div>
                      <div style={{ fontSize: '11px', color: C.texto3, marginTop: '2px' }}>@{f.users?.username || 'anónimo'} · {timeAgo(f.created_at)}</div>
                    </div>
                  ))}
                  <a href="/admin/feedback" style={{ display: 'inline-block', fontSize: '12px', color: C.texto2, marginTop: '8px' }}>Ver todo →</a>
                </>
              )}
            </div>

            <div>
              <div style={subtitulo}><span>Se registraron y nunca estudiaron</span><Contador n={sinEstudiar.length} color={C.ambar} /></div>
              {sinEstudiar.length === 0 ? (
                <div style={vacio}>Todos los registrados de los últimos 30 días ya estudiaron.</div>
              ) : sinEstudiar.slice(0, 10).map(u => (
                <div key={u.id} style={fila}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: C.texto }}>{u.username ? '@' + u.username : 'Sin terminar el registro'}</div>
                    <div style={{ fontSize: '11px', color: C.texto3, ...unaLinea }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '11px', color: C.texto3 }}>{timeAgo(u.created_at)}</div>
                    {u.email && (
                      <a href={'mailto:' + u.email + '?subject=' + encodeURIComponent('¿Te ayudo a arrancar con Memorepe?')} style={{ fontSize: '11px', color: C.verde }}>Escribirle</a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={subtitulo}><span>Preguntas sospechosas</span><Contador n={sospechosas.length} color={C.rojo} /></div>
              <div style={{ fontSize: '11px', color: C.texto3, marginBottom: '6px', lineHeight: '1.5' }}>
                Las falla el 75% o más, o tienen 2+ reportes pendientes. Puede que la respuesta esté mal cargada.
              </div>
              {sospechosas.length === 0 ? (
                <div style={vacio}>Ninguna por ahora.</div>
              ) : sospechosas.slice(0, 10).map(p => (
                <a key={p.question_id} href={'/admin/quizzes/' + p.quiz_id} style={{ ...fila, textDecoration: 'none', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: C.texto, lineHeight: '1.4', ...dosLineas }}>{p.pregunta}</div>
                    <div style={{ fontSize: '11px', color: C.texto3, marginTop: '2px' }}>{p.quiz}</div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {p.pct_error !== null && <div style={{ fontSize: '12px', color: C.rojo }}>{p.pct_error}% error</div>}
                    <div style={{ fontSize: '11px', color: C.texto3 }}>
                      {Number(p.respuestas) > 0 ? p.respuestas + ' resp.' : ''}
                      {Number(p.reportes_pendientes) > 0 ? ' · ' + p.reportes_pendientes + ' rep.' : ''}
                    </div>
                  </div>
                </a>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
