-- =====================================================================
-- Memorepe — Banco de Panamá (Sertracen / ATTT): descripción y guía propia
-- Cambia la descripción (la que muestra Google), las notas (guía del examen)
-- y corrige País = 'Panamá' con tipo 'conducir'. No toca preguntas ni progreso.
-- Al correrlo muestra la descripción y notas ANTERIORES, por si querés recuperarlas.
-- =====================================================================
with anterior as (
  select description, notes, faculty, subject, content_type
  from quizzes where id = '5d647add-fa57-4a9e-808c-73fc1ca02781'
), cambio as (
  update quizzes set
    content_type = 'conducir',
    faculty = 'Panamá',
    subject = 'Licencia de conducir',
    description = 'Practica gratis las 133 preguntas del examen teórico de manejo de Sertracen (ATTT Panamá) 2026, con la respuesta correcta según el Reglamento de Tránsito (Decreto Ejecutivo 640).',
    notes = 'Cómo es el examen teórico en Panamá
El examen teórico lo toma Sertracen, la empresa que administra las licencias para la ATTT (Autoridad del Tránsito y Transporte Terrestre). Sertracen publica la lista oficial de 133 preguntas, pero solo los enunciados, sin opciones ni respuestas. En este banco cada pregunta tiene opciones y la respuesta correcta según el Reglamento de Tránsito (Decreto Ejecutivo 640).

Para sacar la licencia por primera vez necesitas tu cédula (o el carné de residente permanente si eres extranjero), el certificado de una escuela de manejo autorizada por la ATTT, un certificado médico de menos de 6 meses y aprobar el examen de la vista en Sertracen. Después del teórico viene el examen práctico.

Qué repasar: niveles de alcohol permitidos, prioridad de paso, uso del hombro de la vía, límites de velocidad y las definiciones técnicas (vía pública, carretera, autopista), que suelen confundir.

Los requisitos y costos pueden cambiar: confírmalos en sertracen.com.pa antes de ir.'
  where id = '5d647add-fa57-4a9e-808c-73fc1ca02781'
  returning 1
)
select (select count(*) from cambio) as actualizados, anterior.* from anterior;
