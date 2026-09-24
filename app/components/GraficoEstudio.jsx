'use client'

import { useState, useRef, useEffect } from 'react'

// dias: [{ fecha: 'YYYY-MM-DD', preguntas: number, minutos: number | null }]
// Ordenados del más viejo al más nuevo; el último es hoy.
// minutos = null cuando ese día no hay registro de duración.

const VERDE = '#059669'
const NARANJA = '#d97706'
const TINTA = '#111'
const TINTA_2 = '#6b7280'
const TINTA_3 = '#9ca3af'
const GRILLA = '#eef0f2'
const VACIO = '#d1d5db'

const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function diaSemana(ymd) {
  return DIAS_SEMANA[new Date(ymd + 'T12:00:00Z').getUTCDay()]
}
function fechaCorta(ymd) {
  const [, m, d] = ymd.split('-')
  return parseInt(d) + ' ' + MESES[parseInt(m) - 1]
}
function formatoMinutos(min) {
  if (min < 60) return min + ' min'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h + ' h' + (m ? ' ' + m + ' min' : '')
}

// Máximo "redondo" para la escala
function maxRedondo(v) {
  if (v <= 0) return 10
  const pot = Math.pow(10, Math.floor(Math.log10(v)))
  for (const f of [1, 2, 2.5, 5, 10]) {
    if (f * pot >= v) return f * pot
  }
  return 10 * pot
}

// Curva suave que no se pasa de los datos (monótona, Fritsch–Carlson)
function curvaSuave(pts) {
  if (pts.length === 0) return ''
  if (pts.length === 1) return 'M' + pts[0][0] + ',' + pts[0][1]
  const n = pts.length
  const dx = [], dy = [], m = [], t = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0]
    dy[i] = pts[i + 1][1] - pts[i][1]
    m[i] = dy[i] / dx[i]
  }
  t[0] = m[0]
  t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  }
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i] / m[i], b = t[i + 1] / m[i]
    const h = a * a + b * b
    if (h > 9) {
      const k = 3 / Math.sqrt(h)
      t[i] = k * a * m[i]
      t[i + 1] = k * b * m[i]
    }
  }
  let d = 'M' + pts[0][0] + ',' + pts[0][1]
  for (let i = 0; i < n - 1; i++) {
    const c1x = pts[i][0] + dx[i] / 3, c1y = pts[i][1] + (t[i] * dx[i]) / 3
    const c2x = pts[i + 1][0] - dx[i] / 3, c2y = pts[i + 1][1] - (t[i + 1] * dx[i]) / 3
    d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + pts[i + 1][0] + ',' + pts[i + 1][1]
  }
  return d
}

export default function GraficoEstudio({ dias }) {
  const [rango, setRango] = useState(7)
  const [hover, setHover] = useState(null)
  const [ancho, setAncho] = useState(560)
  const contRef = useRef(null)

  useEffect(() => {
    if (!contRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width)
      if (w > 0) setAncho(w)
    })
    ro.observe(contRef.current)
    return () => ro.disconnect()
  }, [])

  const datos = dias.slice(-rango)
  const n = datos.length

  const totalPreguntas = datos.reduce((s, d) => s + d.preguntas, 0)
  const conMinutos = datos.filter(d => d.minutos !== null)
  const totalMinutos = conMinutos.reduce((s, d) => s + d.minutos, 0)
  const preguntasConMinutos = conMinutos.reduce((s, d) => s + d.preguntas, 0)
  const segPorPregunta = preguntasConMinutos > 0 && totalMinutos > 0
    ? Math.round((totalMinutos * 60) / preguntasConMinutos)
    : null
  const diasActivos = datos.filter(d => d.preguntas > 0).length

  // Geometría
  const padIzq = 36, padDer = 8
  const plotW = Math.max(100, ancho - padIzq - padDer)
  const paso = plotW / n
  const anchoBarra = Math.max(3, Math.min(28, paso - 2))
  const cx = i => padIzq + paso * i + paso / 2

  const altoBarras = 140, altoLinea = 90, sep = 40, altoEjeX = 22
  const yBarras0 = 24
  const yLinea0 = yBarras0 + altoBarras + sep
  const altoTotal = yLinea0 + altoLinea + altoEjeX

  const maxP = maxRedondo(Math.max(...datos.map(d => d.preguntas), 0))
  const maxM = maxRedondo(Math.max(...datos.map(d => d.minutos || 0), 0))
  const yP = v => yBarras0 + altoBarras - (v / maxP) * altoBarras
  const yM = v => yLinea0 + altoLinea - (Math.max(0, v) / maxM) * altoLinea

  // Tramos de la curva (se corta donde no hay registro de minutos)
  const tramos = []
  let actual = []
  datos.forEach((d, i) => {
    if (d.minutos === null) {
      if (actual.length) tramos.push(actual)
      actual = []
    } else {
      actual.push([cx(i), yM(d.minutos)])
    }
  })
  if (actual.length) tramos.push(actual)

  // Qué etiquetas del eje X mostrar
  const cadaCuanto = rango === 7 ? 1 : ancho < 480 ? 7 : 3
  const mostrarEtiqueta = i => rango === 7 || (n - 1 - i) % cadaCuanto === 0

  const d = hover !== null ? datos[hover] : null
  const tooltipIzq = hover !== null ? Math.min(Math.max(cx(hover) - 70, 0), ancho - 140) : 0

  const botonRango = activo => ({
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid ' + (activo ? VERDE : '#e5e7eb'),
    background: activo ? '#d1fae5' : 'white',
    color: activo ? '#065f46' : TINTA_2,
    cursor: 'pointer',
  })

  return (
    <div>
      {/* Encabezado + selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: TINTA, marginBottom: '4px' }}>Tu estudio</div>
          <div style={{ fontSize: '12px', color: TINTA_2, lineHeight: '1.6' }}>
            <b style={{ color: TINTA, fontWeight: '500' }}>{totalPreguntas.toLocaleString('es-AR')}</b> preguntas
            {totalMinutos > 0 && <> · <b style={{ color: TINTA, fontWeight: '500' }}>{formatoMinutos(totalMinutos)}</b></>}
            {' · '}{diasActivos} de {rango} días activos
            {segPorPregunta !== null && <> · {segPorPregunta} seg por pregunta</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => { setRango(7); setHover(null) }} style={botonRango(rango === 7)}>7 días</button>
          <button onClick={() => { setRango(30); setHover(null) }} style={botonRango(rango === 30)}>30 días</button>
        </div>
      </div>

      <div ref={contRef} style={{ position: 'relative', width: '100%' }} onMouseLeave={() => setHover(null)}>
        <svg width={ancho} height={altoTotal} style={{ display: 'block', overflow: 'visible' }} role="img"
          aria-label={'Preguntas y minutos por día, últimos ' + rango + ' días'}>

          {/* Panel preguntas: grilla */}
          {[0, 0.5, 1].map(f => (
            <g key={'gp' + f}>
              <line x1={padIzq} x2={padIzq + plotW} y1={yP(maxP * f)} y2={yP(maxP * f)} stroke={f === 0 ? '#d1d5db' : GRILLA} strokeWidth="1" />
              <text x={padIzq - 6} y={yP(maxP * f)} dy="0.32em" textAnchor="end" fontSize="10" fill={TINTA_3}>
                {Math.round(maxP * f).toLocaleString('es-AR')}
              </text>
            </g>
          ))}

          {/* Barras */}
          {datos.map((dia, i) => {
            const alto = dia.preguntas > 0 ? Math.max(3, altoBarras - (yP(dia.preguntas) - yBarras0)) : 3
            const x = cx(i) - anchoBarra / 2
            const y = yBarras0 + altoBarras - alto
            const r = Math.min(4, anchoBarra / 2, alto)
            const color = dia.preguntas > 0 ? VERDE : VACIO
            const opac = hover === null || hover === i ? 1 : 0.45
            // Rectángulo con esquinas redondeadas solo arriba
            const path = 'M' + x + ',' + (y + alto) +
              ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
              ' H' + (x + anchoBarra - r) + ' Q' + (x + anchoBarra) + ',' + y + ' ' + (x + anchoBarra) + ',' + (y + r) +
              ' V' + (y + alto) + ' Z'
            return <path key={'b' + dia.fecha} d={path} fill={color} opacity={opac} />
          })}

          {/* Panel minutos: grilla */}
          {[0, 0.5, 1].map(f => (
            <g key={'gm' + f}>
              <line x1={padIzq} x2={padIzq + plotW} y1={yM(maxM * f)} y2={yM(maxM * f)} stroke={f === 0 ? '#d1d5db' : GRILLA} strokeWidth="1" />
              <text x={padIzq - 6} y={yM(maxM * f)} dy="0.32em" textAnchor="end" fontSize="10" fill={TINTA_3}>
                {Math.round(maxM * f)}
              </text>
            </g>
          ))}

          {/* Curva de minutos */}
          {tramos.map((t, k) => (
            <path key={'t' + k} d={curvaSuave(t)} fill="none" stroke={NARANJA} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* Un día aislado con minutos: se marca con un punto */}
          {tramos.filter(t => t.length === 1).map((t, k) => (
            <circle key={'p' + k} cx={t[0][0]} cy={t[0][1]} r="4" fill={NARANJA} />
          ))}

          {/* Etiquetas de panel */}
          <text x={0} y={yBarras0 - 12} fontSize="11" fill={TINTA_2}>Preguntas por día</text>
          <text x={0} y={yLinea0 - 12} fontSize="11" fill={TINTA_2}>Minutos por día</text>

          {/* Eje X */}
          {datos.map((dia, i) => mostrarEtiqueta(i) && (
            <text key={'x' + dia.fecha} x={cx(i)} y={yLinea0 + altoLinea + 15} textAnchor="middle" fontSize="10"
              fill={i === n - 1 ? TINTA : TINTA_3} fontWeight={i === n - 1 ? '600' : '400'}>
              {i === n - 1 ? 'Hoy' : rango === 7 ? diaSemana(dia.fecha) : fechaCorta(dia.fecha)}
            </text>
          ))}

          {/* Línea guía del hover */}
          {hover !== null && (
            <line x1={cx(hover)} x2={cx(hover)} y1={yBarras0} y2={yLinea0 + altoLinea} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" />
          )}
          {hover !== null && d.minutos !== null && (
            <circle cx={cx(hover)} cy={yM(d.minutos)} r="4" fill={NARANJA} stroke="white" strokeWidth="2" />
          )}

          {/* Zonas de hover (más anchas que la barra) */}
          {datos.map((dia, i) => (
            <rect key={'h' + dia.fecha} x={padIzq + paso * i} y={0} width={paso} height={yLinea0 + altoLinea}
              fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          ))}
        </svg>

        {/* Tooltip */}
        {d && (
          <div style={{ position: 'absolute', top: '0px', left: tooltipIzq + 'px', width: '140px', pointerEvents: 'none', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}>
            <div style={{ color: TINTA_2, marginBottom: '4px' }}>
              {hover === n - 1 ? 'Hoy' : diaSemana(d.fecha) + ' ' + fechaCorta(d.fecha)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: TINTA }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: VERDE, display: 'inline-block' }} />
              {d.preguntas.toLocaleString('es-AR')} preguntas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: TINTA, marginTop: '2px' }}>
              <span style={{ width: '8px', height: '2px', background: NARANJA, display: 'inline-block' }} />
              {d.minutos === null ? <span style={{ color: TINTA_3 }}>sin registro</span> : formatoMinutos(d.minutos)}
            </div>
          </div>
        )}
      </div>

      {dias.some(x => x.minutos === null && x.preguntas > 0) && (
        <div style={{ fontSize: '11px', color: TINTA_3, marginTop: '8px' }}>
          El tiempo de estudio se registra desde el 23 de septiembre de 2026.
        </div>
      )}
    </div>
  )
}
