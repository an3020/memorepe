// Fechas en hora de Argentina (el servidor de Vercel corre en UTC)
export const TZ = 'America/Argentina/Buenos_Aires'

// 'YYYY-MM-DD' del día en Argentina para un timestamp
export function fechaAR(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: TZ })
}

// Suma n días a una fecha 'YYYY-MM-DD'
export function sumarDias(ymd, n) {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}
