-- =====================================================================
-- Memorepe — Unir los 2 bancos de manejo de Provincia en uno solo
-- Mueve las 186 preguntas con imagen de "Señales y situaciones..." al banco
-- "Examen teórico de manejo – Provincia de Buenos Aires (Clase B)".
-- Las preguntas se MUEVEN (no se recrean): el progreso de cada usuario se conserva.
-- Correr COMPLETO una vez en el SQL Editor de Supabase.
-- =====================================================================
do $$
declare
  v_main uuid;
  v_sen  uuid;
  v_max  int;
begin
  select id into v_main from quizzes where title = 'Examen teórico de manejo – Provincia de Buenos Aires (Clase B)';
  select id into v_sen  from quizzes where title = 'Señales y situaciones de tránsito – Provincia de Buenos Aires';
  if v_main is null then raise exception 'No encuentro el banco principal'; end if;
  if v_sen  is null then raise notice 'El banco de señales ya no existe (¿ya se unió?)'; return; end if;

  select coalesce(max("order"), -1) into v_max from questions where quiz_id = v_main;

  -- 1) Mover preguntas (quedan después de las de texto; el algoritmo las mezcla al estudiar)
  update questions set quiz_id = v_main, "order" = "order" + v_max + 1 where quiz_id = v_sen;

  -- 2) Pasar al banco principal lo que apuntaba al de señales
  update study_sessions   set quiz_id = v_main where quiz_id = v_sen;
  update question_reports set quiz_id = v_main where quiz_id = v_sen;
  delete from favorites    where quiz_id = v_sen and user_id in (select user_id from favorites where quiz_id = v_main);
  update favorites        set quiz_id = v_main where quiz_id = v_sen;
  delete from exam_quizzes where quiz_id = v_sen;

  -- 3) Borrar el banco de señales (ya vacío)
  delete from quizzes where id = v_sen;

  -- 4) Actualizar el banco principal
  update quizzes set
    question_count = (select count(*) from questions where quiz_id = v_main),
    description = 'Cuestionario oficial completo del examen teórico de la licencia de conducir de la Provincia de Buenos Aires: normas, señales y situaciones reales con imágenes, y las respuestas correctas.'
  where id = v_main;

  raise notice 'Listo: el banco principal ahora tiene % preguntas', (select count(*) from questions where quiz_id = v_main);
end $$;
