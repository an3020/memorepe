// El contador "estudiando" se muestra recién desde este mínimo, para no
// exhibir números chicos en bancos nuevos (siempre es el número real).
export const MIN_ESTUDIANDO = 10
export const mostrarEstudiando = n => (n || 0) >= MIN_ESTUDIANDO
