import { redirect } from 'next/navigation'
import { requireAdmin, AdminNav, C, num, timeAgo, estilos as E } from '@/lib/admin'

export const revalidate = 0

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function semanaCorta(ymd) {
  const [, m, d] = String(ymd).slice(0, 10).split('-')
  return parseInt(d) + ' ' + MESES[parseInt(m) - 1]
}
function pct(a, b) {
  return Number(b) > 0 ? Math.round((Number(a) / Number(b)) * 100) : null
}

export default async function AdminUsuarioFicha({ params }) {
  const { user_id } = await params
  const admin = await requireAdmin()

  const { data: perfil } = await admin
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single()

  if (!perfil) redirect('/admin/stats')

  const [bancosRes, reportesRes, semanasRes, feedbackRes, creadosRes, statsRes] = await Promise.all([
    admin.rpc('admin_user_bancos', { p_user: user_id }),
    admin.rpc('admin_user_reportes', { p_user: user_id }),
    admin.rpc('admin_user_semanas', { p_user: user_id }),
    admin.from('feedback').select('id, message, url, created_at').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50),
    admin.from('quizzes').select('id, title, slug, visibility, question_count, student_count, created_at').eq('user_id', user_id).order('created_at', { ascending: false }),
    admin.rpc('get_user_stats', { p_user_id: user_id }),
  ])

  const bancos = bancosRes.data || []
  const reportes = reportesRes.data || []
  const semanas = semanasRes.data || []
  const feedbacks = feedbackRes.data || []
  const creados = creadosRes.data || []
  const stats = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data
  const faltaSQL = [bancosRes, reportesRes, semanasRes].some(r => r.error)

  const precision = pct(stats?.correctas, stats?.respondidas)
  const minutos = bancos.reduce((s, b) => s + Number(b.minutos || 0), 0)
  const maxSem = Math.max(1, ...semanas.map(s => Number(s.preguntas)))
  const resueltos = reportes.filter(r => r.status === 'resolved').length

  const dato = (label, valor, color) => (
    <div style={{ background: '#111', border: '1px solid ' + C.borde, borderRadius: '10px', padding: '12px' }}>
      <div style={{ fontSize: '11px', color: C.texto3, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '500', color: color || C.texto }}>{valor}</div>
    </div>
  )

  return (
    <div style={E.pagina}>
      <AdminNav activo="/admin/stats" />
      <div style={{ ...E.cont, maxWidth: '1000px' }}>
        <a href="/admin/stats" style={{ fontSize: '12px', color: C.texto3, textDecoration: 'none' }}>← Rankings</a>

        {faltaSQL && (
          <div style={{ background: '#2d1f05', border: '1px solid #854d0e', color: C.ambar, borderRadius: '10px', padding: '12px 16px', fontSize: '13px', margin: '12px 0' }}>
            Falta correr <b>supabase/2026-09-27-admin-usuarios.sql</b> en Supabase.
          </div>
        )}

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: C.verdeOsc, color: C.verde, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', flexShrink: 0 }}>
            {(perfil.username || '?').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={E.h1}>
              @{perfil.username || '—'}
              {perfil.blocked && <span style={{ fontSize: '11px', color: C.rojo, marginLeft: '8px' }}>BLOQUEADO</span>}
              {perfil.role === 'admin' && <span style={{ fontSize: '11px', color: C.verde, marginLeft: '8px' }}>ADMIN</span>}
            </h1>
            <div style={{ fontSize: '12px', color: C.texto3 }}>
              {perfil.email} · se registró {new Date(perfil.created_at).toLocaleDateString('es-AR')} · plan {perfil.plan || 'free'}
            </div>
            <div style={{ fontSize: '12px', color: C.texto3, marginTop: '2px' }}>
              Llegó por: <span style={{ color: C.texto2 }}>{perfil.origen_path || 'sin dato'}</span>
              {(perfil.origen_utm || perfil.origen_referrer) && <> · desde <span style={{ color: C.texto2 }}>{perfil.origen_utm || perfil.origen_referrer}</span></>}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {dato('Sesiones', num(stats?.sesiones))}
          {dato('Preguntas', num(stats?.respondidas))}
          {dato('Precisión', precision !== null ? precision + '%' : '—')}
          {dato('Minutos registrados', num(minutos))}
          {dato('Bancos usados', num(bancos.length))}
          {dato('Racha', (perfil.streak_current || 0) + 'd', C.ambar)}
          {dato('XP', num(perfil.xp_total))}
          {dato('Reportes', num(reportes.length) + (reportes.length ? ' (' + resueltos + ' válidos)' : ''))}
        </div>

        {/* Actividad por semana */}
        <div style={E.seccion}>
          <h2 style={E.h2}>Actividad por semana</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '90px' }}>
            {semanas.map(s => (
              <div key={s.semana} title={semanaCorta(s.semana) + ': ' + num(s.preguntas) + ' preguntas · ' + num(s.sesiones) + ' sesiones · ' + num(s.minutos) + ' min'}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: Math.max(2, (Number(s.preguntas) / maxSem) * 70) + 'px', background: Number(s.preguntas) ? C.verde : '#2a2a2a', borderRadius: '3px 3px 0 0' }} />
                <div style={{ fontSize: '9px', color: C.texto3, whiteSpace: 'nowrap' }}>{semanaCorta(s.semana)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bancos que estudió */}
        <div style={E.seccion}>
          <h2 style={E.h2}>Qué estudió ({bancos.length} bancos)</h2>
          {bancos.length === 0 ? <div style={E.vacio}>Todavía no terminó ninguna sesión.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ ...E.th, textAlign: 'left' }}>Banco</th>
                  <th style={E.th}>Sesiones</th><th style={E.th}>Preguntas</th><th style={E.th}>Precisión</th>
                  <th style={E.th}>Minutos</th><th style={E.th}>Primera vez</th><th style={E.th}>Última vez</th>
                </tr></thead>
                <tbody>
                  {bancos.map(b => (
                    <tr key={b.quiz_id}>
                      <td style={{ ...E.td, textAlign: 'left', whiteSpace: 'normal' }}>
                        <a href={'/admin/quizzes/' + b.quiz_id} style={{ color: C.texto, textDecoration: 'none' }}>{b.title}</a>
                      </td>
                      <td style={E.td}>{num(b.sesiones)}</td>
                      <td style={E.td}>{num(b.preguntas)}</td>
                      <td style={{ ...E.td, color: C.texto2 }}>{pct(b.correctas, b.preguntas) ?? '—'}{pct(b.correctas, b.preguntas) !== null ? '%' : ''}</td>
                      <td style={{ ...E.td, color: C.texto2 }}>{num(b.minutos)}</td>
                      <td style={{ ...E.td, color: C.texto3 }}>{new Date(b.primera).toLocaleDateString('es-AR')}</td>
                      <td style={{ ...E.td, color: C.texto3 }}>{timeAgo(b.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
          {/* Reportes */}
          <div style={E.seccion}>
            <h2 style={E.h2}>Reportes que hizo ({reportes.length})</h2>
            {reportes.length === 0 ? <div style={E.vacio}>No hizo reportes.</div> : reportes.map(r => (
              <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid ' + C.borde }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: C.texto2 }}>{r.reason}</span>
                  <span style={{ fontSize: '11px', color: r.status === 'resolved' ? C.verde : C.ambar, whiteSpace: 'nowrap' }}>
                    {r.status === 'resolved' ? 'Resuelto' : 'Pendiente'} · {timeAgo(r.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: C.texto, marginTop: '2px', lineHeight: '1.4' }}>{r.pregunta || '(pregunta borrada)'}</div>
                {r.comment && <div style={{ fontSize: '11px', color: C.texto3, marginTop: '2px', fontStyle: 'italic' }}>“{r.comment}”</div>}
                {r.quiz_id && <a href={'/admin/quizzes/' + r.quiz_id} style={{ fontSize: '11px', color: C.texto3 }}>{r.quiz_title}</a>}
              </div>
            ))}
          </div>

          <div>
            {/* Bancos creados */}
            <div style={E.seccion}>
              <h2 style={E.h2}>Bancos que creó ({creados.length})</h2>
              {creados.length === 0 ? <div style={E.vacio}>No creó bancos.</div> : creados.map(q => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid ' + C.borde }}>
                  <a href={'/admin/quizzes/' + q.id} style={{ fontSize: '12px', color: C.texto, textDecoration: 'none' }}>{q.title}</a>
                  <span style={{ fontSize: '11px', color: C.texto3, whiteSpace: 'nowrap' }}>
                    {num(q.question_count)} preg. · {q.visibility === 'public' ? 'público' : q.visibility === 'link' ? 'con link' : 'privado'}
                  </span>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div style={E.seccion}>
              <h2 style={E.h2}>Feedback que envió ({feedbacks.length})</h2>
              {feedbacks.length === 0 ? <div style={E.vacio}>No envió feedback.</div> : feedbacks.map(f => (
                <div key={f.id} style={{ padding: '6px 0', borderBottom: '1px solid ' + C.borde }}>
                  <div style={{ fontSize: '12px', color: C.texto, lineHeight: '1.4' }}>{f.message}</div>
                  <div style={{ fontSize: '11px', color: C.texto3 }}>{timeAgo(f.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
