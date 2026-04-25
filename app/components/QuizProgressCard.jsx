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

export default function QuizProgressCard({ quiz, p }) {
  const tieneProgreso = p && p.seen > 0
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: tieneProgreso ? '12px' : '0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111', marginBottom: '3px' }}>{quiz.title}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {quiz.question_count} preguntas{quiz.subject ? ' · ' + quiz.subject : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <a href={'/quiz/' + quiz.id + '/gestionar'} style={{ fontSize: '11px', color: '#6b7280', textDecoration: 'none', border: '1px solid #e5e7eb', padding: '5px 10px', borderRadius: '6px' }}>
            Gestionar
          </a>
          <a href={'/estudiar/' + quiz.id + '/inicio'} style={{ fontSize: '12px', fontWeight: '500', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '5px 12px', borderRadius: '6px', textDecoration: 'none' }}>
            {tieneProgreso ? 'Continuar' : 'Estudiar'}
          </a>
        </div>
      </div>
      {tieneProgreso && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <Tooltip text="Preguntas que respondiste al menos una vez. Es tu punto de partida — cada sesion suma.">
              <div style={{ textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{p.seen_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.seen}/{p.total}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Vistas</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste al menos una vez. El algoritmo las va a mostrar pronto para confirmar que las recordas.">
              <div style={{ textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#d97706' }}>{p.in_progress_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.in_progress}/{p.total}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>En progreso</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste en al menos 2 sesiones distintas. Si no las repasas en el intervalo recomendado, pueden volver a 'en progreso'.">
              <div style={{ textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>{p.dominated_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.dominated}/{p.total}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Dominadas</div>
              </div>
            </Tooltip>
            <Tooltip text="Las acertaste 4 o mas veces en los ultimos 30 dias. Tu memoria las tiene bien consolidadas. El algoritmo las va a mostrar cada vez menos seguido.">
              <div style={{ textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1' }}>{p.expert_pct}%</div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.expert}/{p.total}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>Experto</div>
              </div>
            </Tooltip>
          </div>
          <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: p.expert_pct + '%', background: '#0369a1' }} />
              <div style={{ width: Math.max(0, p.dominated_pct - p.expert_pct) + '%', background: '#059669' }} />
              <div style={{ width: Math.max(0, p.in_progress_pct - p.dominated_pct) + '%', background: '#fcd34d' }} />
            </div>
          </div>
          {p.due_today > 0 && (
            <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '500', marginTop: '6px' }}>
              ⚡ {p.due_today} para repasar hoy
            </div>
          )}
        </div>
      )}
    </div>
  )
}
