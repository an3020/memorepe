// Supabase manda los filtros .in() dentro de la URL: con cientos de IDs la
// URL se vuelve demasiado larga y la consulta falla. Esto la parte en tandas.
export async function inChunks(ids, fn, size = 150) {
  const out = []
  for (let i = 0; i < ids.length; i += size) {
    const { data, error } = await fn(ids.slice(i, i + size))
    if (error) return { data: out, error }
    if (data) out.push(...data)
  }
  return { data: out, error: null }
}
