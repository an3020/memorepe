export const NIVELES = [
  { nombre: 'Curioso',    xp: 500 },
  { nombre: 'Estudiante', xp: 2000 },
  { nombre: 'Aplicado',   xp: 5000 },
  { nombre: 'Dedicado',   xp: 12000 },
  { nombre: 'Constante',  xp: 25000 },
  { nombre: 'Avanzado',   xp: 50000 },
  { nombre: 'Experto',    xp: 90000 },
  { nombre: 'Erudito',    xp: 150000 },
  { nombre: 'Académico',  xp: 230000 },
  { nombre: 'Sabio',      xp: 350000 },
  { nombre: 'Maestro',    xp: 500000 },
  { nombre: 'Leyenda',    xp: 750000 },
]

export function getNivel(xp) {
  let nivel = 0
  for (let i = 0; i < NIVELES.length; i++) {
    if (xp >= NIVELES[i].xp) nivel = i + 1
    else break
  }
  const nivelActual = NIVELES[nivel] || NIVELES[NIVELES.length - 1]
  const nivelAnterior = nivel > 0 ? NIVELES[nivel - 1] : { xp: 0 }
  const xpInicio = nivelAnterior.xp
  const xpFin = nivelActual.xp
  const xpEnNivel = xp - xpInicio
  const xpTotal = xpFin - xpInicio
  const pct = Math.min(100, Math.round((xpEnNivel / xpTotal) * 100))
  const nombre = nivel > 0 ? NIVELES[nivel - 1].nombre : 'Curioso'
  return { nivel: Math.max(1, nivel), nombre, pct, xpFin, xpEnNivel: Math.max(0, xpEnNivel) }
}
