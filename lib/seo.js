// Reglas de indexación para Google.
// Un banco con muy pocas preguntas no aporta valor en el buscador: se puede
// estudiar igual, pero no se indexa ni va al sitemap.
export const MIN_PREGUNTAS_INDEX = 10

export function bancoIndexable(quiz) {
  return !!quiz && quiz.visibility === 'public' && Number(quiz.question_count || 0) >= MIN_PREGUNTAS_INDEX
}
