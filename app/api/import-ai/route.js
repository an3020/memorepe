import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const FREE_LIMIT = 3

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (e) {}
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'import_text')
    .gte('created_at', startOfMonth.toISOString())

  if (count >= FREE_LIMIT) {
    return NextResponse.json({
      error: 'limite_alcanzado',
      message: 'Alcanzaste el límite de 3 importaciones con IA por mes en el plan gratuito.'
    }, { status: 403 })
  }

  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Texto vacío' }, { status: 400 })

  const prompt = `Eres un asistente que extrae preguntas de opción múltiple de textos educativos.

Dado el siguiente texto, extrae todas las preguntas con sus opciones de respuesta. Si no hay opciones claras, créalas basándote en el contexto.

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional ni backticks:
{
  "questions": [
    {
      "body": "texto de la pregunta",
      "type": "single",
      "explanation": "explicación breve de por qué es correcta (opcional)",
      "options": [
        { "body": "opción 1", "is_correct": true },
        { "body": "opción 2", "is_correct": false },
        { "body": "opción 3", "is_correct": false },
        { "body": "opción 4", "is_correct": false }
      ]
    }
  ]
}

Reglas:
- type puede ser "single" (una correcta) o "multiple" (varias correctas)
- Cada pregunta debe tener entre 2 y 5 opciones
- Al menos una opción debe ser correcta
- Si el texto tiene respuestas marcadas, úsalas. Si no, infiere la correcta del contexto
- Máximo 50 preguntas por request

Texto a procesar:
${text.slice(0, 8000)}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Error al llamar a la IA' }, { status: 500 })
  }

  const data = await response.json()
  const tokensIn = data.usage?.input_tokens || 0
  const tokensOut = data.usage?.output_tokens || 0
  const costUsd = (tokensIn * 0.00000025) + (tokensOut * 0.00000125)

  await supabase.from('ai_usage').insert({
    user_id: user.id,
    type: 'import_text',
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd
  })

  let questions = []
  try {
    const raw = data.content[0].text.trim()
    const parsed = JSON.parse(raw)
    questions = parsed.questions || []
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo parsear la respuesta de la IA' }, { status: 500 })
  }

  return NextResponse.json({ questions, usos_restantes: FREE_LIMIT - count - 1 })
}