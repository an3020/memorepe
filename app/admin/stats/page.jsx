import { requireAdmin, AdminNav, C, num, timeAgo, estilos as E } from '@/lib/admin'

export const revalidate = 0

const PERIODOS = [
  ['7', '7 días'],
  ['30', '30 días'],
  ['90', '90 días'],
  ['todo', 'Todo'],
]

const COLUMNAS = [
  ['bancos', 'Bancos usados'],
  ['preguntas', 'Preguntas'],
  ['sesiones', 'Sesiones'],
  ['minutos', 'Minutos'],
  ['reportes', 'Reportes'],
  ['reportes_resueltos', 'Reportes válidos'],
  ['bancos_creados', 'Bancos creados'],
]

export default async function AdminStats({ searchParams }) {
  const admin = await requireAdmin()
  const sp = await searchParams
  const periodo = PERIODOS.some(p => p[0] === sp?.periodo) ? sp.periodo : '30'
  const orden = COLUMNAS.some(c => c[0] === sp?.orden) ? sp.orden : 'preguntas'
  const q = (sp?.q || '').trim().toLowerCase()

  const { data, error } = await admin.rpc('admin_ranking', { p_dias: periodo === 'todo' ? null : parseInt(periodo) })

  let filas = (data || []).map(r => ({ ...r }))
  if (q) filas = filas.filter(r => (r.username || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q))
  filas.sort((a, b) => Number(b[orden]) - Number(a[orden]) || new Date(b.ultima || 0) - new Date(a.ultima || 0))

  const url = (cambios) => {
    const p = new URLSearchParams({ periodo, orden, ...(q ? { q } : {}), ...cambios })
    return '/admin/stats?' + p.toString()
  }

  const totales = COLUMNAS.reduce((acc, [k]) => ({ ...acc, [k]: filas.reduce((s, r) => s + Number(r[k] || 0), 0) }), {})

  const chip = (activo) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none',
    border: '1px solid ' + (activo ? C.verde : C.borde), color: activo ? C.verde : C.texto2,
    background: activo ? C.verdeOsc : 'transparent',
  })

  return (
    <div style={E.pagina}>
      <AdminNav activo="/admin/stats" />
      <div style={E.cont}>
        <h1 style={E.h1}>Rankings de usuarios</h1>
        <p style={E.sub}>Hacé clic en el título de una columna para ordenar. Clic en un usuario para ver su ficha completa.</p>

        {error && (
          <div style={{ background: '#2d1f05', border: '1px solid #854d0e', color: C.ambar, borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>
            Falta correr <b>supabase/2026-09-27-admin-usuarios.sql</b> en Supabase.
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PERIODOS.map(([v, l]) => <a key={v} href={url({ periodo: v })} style={chip(periodo === v)}>{l}</a>)}
          <form action="/admin/stats" style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <input type="hidden" name="periodo" value={periodo} />
            <input type="hidden" name="orden" value={orden} />
            <input name="q" defaultValue={q} placeholder="Buscar usuario o email…"
              style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid ' + C.borde, background: '#111', color: C.texto, width: '200px' }} />
          </form>
        </div>

        <div style={E.seccion}>
          <div style={{ fontSize: '12px', color: C.texto3, marginBottom: '10px' }}>
            {num(filas.length)} usuarios con actividad · {num(totales.preguntas)} preguntas · {num(totales.reportes)} reportes
          </div>
          {filas.length === 0 ? (
            <div style={E.vacio}>Sin actividad en este período.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...E.th, textAlign: 'left' }}>#</th>
                    <th style={{ ...E.th, textAlign: 'left' }}>Usuario</th>
                    {COLUMNAS.map(([k, l]) => (
                      <th key={k} style={E.th}>
                        <a href={url({ orden: k })} style={{ color: orden === k ? C.verde : C.texto3, textDecoration: 'none' }}>
                          {l}{orden === k ? ' ▼' : ''}
                        </a>
                      </th>
                    ))}
                    <th style={E.th}>Última sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r, i) => (
                    <tr key={r.user_id}>
                      <td style={{ ...E.td, textAlign: 'left', color: C.texto3 }}>{i + 1}</td>
                      <td style={{ ...E.td, textAlign: 'left' }}>
                        <a href={'/admin/stats/' + r.user_id} style={{ color: C.texto, textDecoration: 'none' }}>
                          @{r.username || '—'}
                        </a>
                        <div style={{ fontSize: '11px', color: C.texto3 }}>{r.email}</div>
                      </td>
                      {COLUMNAS.map(([k]) => (
                        <td key={k} style={{ ...E.td, color: orden === k ? C.texto : C.texto2, fontWeight: orden === k ? '600' : '400' }}>
                          {Number(r[k]) ? num(r[k]) : <span style={{ color: '#333' }}>0</span>}
                        </td>
                      ))}
                      <td style={{ ...E.td, color: C.texto3 }}>{timeAgo(r.ultima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
