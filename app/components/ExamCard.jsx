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

export default function ExamCard({ exam, onEdit, onDelete }) {
  const p = exam.plan
  const mc = p ? modeColor(p.recommended_mode) : { bg: '#f3f4f6', color: '#374151' }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#111', marginBottom: '4px' }}>{exam.title}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {new Date(exam.exam_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {p && ' · '}
            {p && <span style={{ color: p.days_left <= 7 ? '#ef4444' : p.days_left <= 14 ? '#d97706' : '#059669', fontWeight: '500' }}>{daysLeftText(p.days_left)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onEdit} style={{ fontSize: '11px', color: '#059669', background: '#f0fdf4', border: '1px solid #6ee7b7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
          <button onClick={onDelete} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
        </div>
      </div>

      {p && p.total_questions > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <Tooltip text="Preguntas que respondiste al menos una vez. Es tu punto de partida — cada sesion suma.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{p.seen_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.seen}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Vistas</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste al menos una vez. El algoritmo las va a mostrar pronto para confirmar que las recordas.">
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
            <Tooltip text="Las acertaste 4 o mas veces en los ultimos 30 dias. Tu memoria las tiene bien consolidadas. El algoritmo las va a mostrar cada vez menos seguido.">
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#0369a1' }}>{p.expert_pct || 0}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.expert || 0}/{p.total_questions}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Experto</div>
              </div>
            </Tooltip>
          </div>

          <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ height: '100%', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: (p.expert_pct || 0) + '%', background: '#0369a1' }} />
              <div style={{ width: Math.max(0, p.dominated_pct - (p.expert_pct || 0)) + '%', background: '#059669' }} />
              <div style={{ width: Math.max(0, p.in_progress_pct - p.dominated_pct) + '%', background: '#fcd34d' }} />
            </div>
          </div>

          {p.due_today > 0 && !p.goal_met && (
            <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '500', marginBottom: '10px' }}>
              ⚡ {p.due_today} preguntas vencidas — el algoritmo las prioriza hoy
            </div>
          )}

          {p.days_left > 0 && (
            p.goal_met ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#065f46', marginBottom: '4px' }}>
                  ✅ Objetivo de hoy cumplido · {p.studied_today} preguntas completadas
                </div>
                <div style={{ fontSize: '11px', color: '#059669', marginBottom: '10px' }}>
                  ¿Querés adelantar? Podés hacer otras {p.questions_per_day} preguntas ahora.
                </div>
                {exam.exam_quizzes?.length > 0 && (
                  <a href={'/estudiar/' + exam.exam_quizzes[0].quiz_id + '?n=' + p.questions_per_day} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none' }}>
                    Adelantar sesión
                  </a>
                )}
              </div>
            ) : (
              <div style={{ background: mc.bg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: mc.color, marginBottom: '2px', fontWeight: '500' }}>Recomendación para hoy</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: mc.color }}>{p.recommended_mode} · {p.questions_per_day} preguntas</div>
                  <div style={{ fontSize: '11px', color: mc.color, opacity: 0.8, marginTop: '2px' }}>
                    {p.unseen} preguntas sin ver · {p.days_left} días disponibles
                  </div>
                </div>
                {exam.exam_quizzes?.length > 0 && (
                  <a href={'/estudiar/' + exam.exam_quizzes[0].quiz_id + '?n=' + p.questions_per_day} style={{ fontSize: '12px', fontWeight: '500', color: 'white', background: '#059669', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', flexShrink: 0 }}>
                    Estudiar ahora
                  </a>
                )}
              </div>
            )
          )}
        </>
      )}

      {p && p.total_questions === 0 && (
        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          No hay sets de preguntas asociados. Hacé clic en Editar para agregar.
        </div>
      )}
    </div>
  )
}