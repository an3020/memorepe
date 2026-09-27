-- =====================================================================
-- Memorepe — Contador "estudiando" real + etiqueta "Respuestas oficiales"
-- Correr COMPLETO una vez en el SQL Editor de Supabase.
-- =====================================================================

-- 1) Contador "estudiando" = personas distintas que terminaron al menos
--    una sesión del banco. Se recalcula solo cada vez que alguien termina.
create or replace function public.refresh_student_count()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update quizzes
  set student_count = (
    select count(distinct user_id) from study_sessions
    where quiz_id = new.quiz_id and finished_at is not null
  )
  where id = new.quiz_id;
  return new;
end;
$function$;

drop trigger if exists trg_refresh_student_count on public.study_sessions;
create trigger trg_refresh_student_count
after insert or update of finished_at on public.study_sessions
for each row
when (new.finished_at is not null)
execute function public.refresh_student_count();

-- Recalcular una vez todos los bancos existentes
update quizzes q
set student_count = (
  select count(distinct s.user_id) from study_sessions s
  where s.quiz_id = q.id and s.finished_at is not null
);

-- 2) Fuente oficial de las respuestas (se muestra "✓ Respuestas oficiales")
alter table public.quizzes add column if not exists official_source text;

update quizzes set official_source = 'Provincia de Buenos Aires'
where title = 'Examen teórico de manejo – Provincia de Buenos Aires (Clase B)';

update quizzes set official_source = 'MTC Perú'
where title like 'Balotario MTC %';
