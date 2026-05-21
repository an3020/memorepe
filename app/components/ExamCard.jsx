'use client'

import { useState } from 'react'

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#111', color: 'white', fontSize: '11px', padding: '8px 12px', borderRadius: '8px', width: '200px', lineHeight: '1.5', zIndex: 10, textAlign: 'left', pointerEvents: 'none' }}>
          {text}
        </div>
      )}
    </div>
  )
}

function modeColor(mode) {
  if (mode === 'Calentamiento') return { bg: '#e0f2fe', color: '#0369a1' }
  if (mode === 'Sesion express') return { bg: '#d1fae5', color: '#065f46' }
  if (mode === 'Sesion completa') return { bg: '#ede9fe', color: '#5b21b6' }
  if (mode === 'Maraton') return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#f3f4f6', color: '#374151' }
}

function daysLeftText(days) {
  if (days === 0) return 'Hoy es el examen'
  if (days === 1) return 'Mañana es el examen'
  if (days < 0) return 'Examen pasado'
  return days + ' días para el examen'
}

function EmotionalBanner({ state, phase, studiedToday, questionsPerDay, daysLeft }) {
  if (phase === 'exam_day') return (
    <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>🎯</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>Hoy es tu examen</div>
      <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Ya estás preparado. Confía en lo que estudiaste.</div>
    </div>
  )

  if (phase === 'review') return (
    <div style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#5b21b6', marginBottom: '4px' }}>
        🔁 Fase de repaso final · {daysLeft} {daysLeft === 1 ? 'día' : 'días'} antes del examen
      </div>
      <div style={{ fontSize: '12px', color: '#6d28d9' }}>
        No es momento de aprender cosas nuevas. Repasa lo que ya conoces para consolidarlo.
      </div>
    </div>
  )

  if (state === 'goal_met') return (
    <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', marginBottom: '2px' }}>
        ✅ Objetivo de hoy cumplido · {studiedToday} preguntas completadas
      </div>
      <div style={{ fontSize: '12px', color: '#059669' }}>
        ¿Quieres adelantar? Puedes hacer una sesión extra ahora.
      </div>
    </div>
  )

  if (state === 'ahead') return (
    <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', marginBottom: '2px' }}>
        🚀 Vas adelantado
      </div>
      <div style={{ fontSize: '12px', color: '#059669' }}>
        Tu ritmo de estudio es excelente. Puedes tomarte un descanso hoy si lo necesitas.
      </div>
    </div>
  )

  if (state === 'behind') return (
    <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#92400e', marginBottom: '2px' }}>
        ⚠️ Estás un poco atrasado
      </div>
      <div style={{ fontSize: '12px', color: '#78350f' }}>
        Te recomendamos una sesión extra hoy para retomar el ritmo y llegar preparado.
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', marginBottom: '2px' }}>
        ✓ Vas por buen camino
      </div>
      <div style={{ fontSize: '12px', color: '#059669' }}>
        Mantén el ritmo y llegarás preparado al examen.
      </div>
    </div>
  )
}

// Selector de banco cuando hay más de uno
function QuizSelector({ quizzes, questionsPerDay, phase }) {
  const [open, setOpen] = useState(false)
  const label = phase === 'review' ? 'Repasar ahora' : 'Estudiar ahora'

  if (quizzes.length === 0) return null

  if (quizzes.length === 1) {
    return (
      <a
        href={'/estudiar/' + quizzes[0].quiz_id + '?n=' + questionsPerDay}
        style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: '#059669', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', flexShrink: 0 }}
      >
        {label}
      </a>
    )
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: '#059669', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
      >
        {label} ▾
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 20, minWidth: '220px', padding: '6px' }}>
          {quizzes.map(q => (
            <a
              key={q.quiz_id}
              href={'/estudiar/' + q.quiz_id + '?n=' + Math.ceil(questionsPerDay / quizzes.length)}
              style={{ display: 'block', padding: '9px 12px', fontSize: '12px', color: '#111', textDecoration: 'none', borderRadius: '7px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: '500' }}>{q.title}</span>
              {q.question_count && (
                <span style={{ color: '#9ca3af', marginLeft: '6px' }}>{q.question_count} pregs</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExamCard({ exam, onEdit, onDelete }) {
  const p = exam.plan
  const mc = p ? modeColor(p.recommended_mode) : { bg: '#f3f4f6', color: '#374151' }

  // exam_quizzes ahora trae { quiz_id, title, question_count }
  const quizzes = exam.exam_quizzes || []
  const totalPreguntas = quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{exam.title}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {new Date(exam.exam_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {p && ' · '}
            {p && (
              <span style={{ color: p.days_left <= 7 ? '#ef4444' : p.days_left <= 14 ? '#d97706' : '#059669', fontWeight: '500' }}>
                {daysLeftText(p.days_left)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onEdit} style={{ fontSize: '11px', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
          <button onClick={onDelete} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
        </div>
      </div>

      {/* Bancos incluidos */}
      {quizzes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {quizzes.map(q => (
            <div
              key={q.quiz_id}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 10px' }}
            >
              <span style={{ fontSize: '11px' }}>📚</span>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{q.title}</span>
              {q.question_count > 0 && (
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>· {q.question_count} pregs</span>
              )}
            </div>
          ))}
          {totalPreguntas > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>{totalPreguntas} preguntas en total</span>
            </div>
          )}
        </div>
      )}

      {p && p.total_questions > 0 && (
        <>
          {/* Stats 4 columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <Tooltip text="Preguntas que respondiste al menos una vez. Es tu punto de partida — cada sesión suma.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{p.seen_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.seen}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Vistas</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste al menos una vez. El algoritmo las va a mostrar pronto para confirmar que las recuerdas.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#d97706' }}>{p.in_progress_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.in_progress}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>En progreso</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste en al menos 2 sesiones distintas. Si no las repasas en el intervalo recomendado, pueden volver a 'en progreso'.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#059669' }}>{p.dominated_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.dominated}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Dominadas</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste 4 o más veces en los últimos 30 días. Tu memoria las tiene bien consolidadas.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#0369a1' }}>{p.expert_pct || 0}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.expert || 0}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Experto</div>
              </div>
            </Tooltip>
          </div>

          {/* Barra de progreso */}
          <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ height: '100%', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: (p.expert_pct || 0) + '%', background: '#0369a1' }} />
              <div style={{ width: Math.max(0, p.dominated_pct - (p.expert_pct || 0)) + '%', background: '#059669' }} />
              <div style={{ width: Math.max(0, p.in_progress_pct - p.dominated_pct) + '%', background: '#fcd34d' }} />
            </div>
          </div>

          {p.days_left >= 0 && (
            <EmotionalBanner
              state={p.emotional_state}
              phase={p.phase}
              studiedToday={p.studied_today}
              questionsPerDay={p.questions_per_day}
              daysLeft={p.days_left}
            />
          )}

          {p.phase !== 'exam_day' && !p.goal_met && p.days_left > 0 && (
            <div style={{ background: mc.bg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: mc.color, marginBottom: '2px', fontWeight: '500' }}>
                  {p.phase === 'review' ? 'Repaso recomendado para hoy' : 'Recomendación para hoy'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: mc.color }}>
                  {p.recommended_mode} · {p.questions_per_day} preguntas
                </div>
                <div style={{ fontSize: '11px', color: mc.color, opacity: 0.8, marginTop: '2px' }}>
                  {p.phase === 'review'
                    ? 'Solo preguntas que ya conoces · ' + p.due_today + ' pendientes de repaso'
                    : p.unseen + ' preguntas sin ver · ' + p.days_left + ' días disponibles'
                  }
                </div>
              </div>
              <QuizSelector
                quizzes={quizzes}
                questionsPerDay={p.questions_per_day}
                phase={p.phase}
              />
            </div>
          )}

          {p.goal_met && p.phase !== 'exam_day' && p.days_left > 0 && quizzes.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <a
                href={'/estudiar/' + quizzes[0].quiz_id + '?n=' + p.questions_per_day}
                style={{ fontSize: '12px', color: '#059669', textDecoration: 'none' }}
              >
                Adelantar sesión →
              </a>
            </div>
          )}
        </>
      )}

      {p && p.total_questions === 0 && (
        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          No hay bancos de preguntas asociados.{' '}
          <button onClick={onEdit} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
            Hacer clic en Editar para agregar.
          </button>
        </div>
      )}
    </div>
  )
}
