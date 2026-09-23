-- =====================================================================
-- Memorepe — fix decay de XP, racha en hora Argentina y stats sin tope
-- Correr completo en el SQL Editor de Supabase (una sola vez).
-- =====================================================================

-- 1) apply_xp_decay
--    Antes: medía el tiempo desde el último decay (last_xp_decay_date),
--    así que le quitaba 1% cada 14 días incluso a usuarios activos.
--    Ahora: mide la ausencia desde last_study_date (hora Argentina).
--    xp_decay_pending acumula lo perdido durante la ausencia actual, y
--    la escala progresiva se aplica sobre el XP que tenía al irse.
create or replace function public.apply_xp_decay(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_today      date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_xp         int;
  v_last_study date;
  v_pending    int;
  v_weeks      int;
  v_pct        numeric;
  v_base       int;
  v_target     int;
begin
  select coalesce(xp_total, 0), last_study_date, coalesce(xp_decay_pending, 0)
  into v_xp, v_last_study, v_pending
  from users where id = p_user_id;

  if v_last_study is null then
    return;
  end if;

  v_weeks := (v_today - v_last_study) / 7;

  -- Primera semana de ausencia es de gracia
  if v_weeks < 2 then
    return;
  end if;

  v_pct := case
    when v_weeks = 2 then 0.01
    when v_weeks = 3 then 0.02
    when v_weeks = 4 then 0.03
    else least(0.03 + 0.05 * (v_weeks - 4), 0.25)
  end;

  -- XP que tenía antes de empezar a perder en esta ausencia
  v_base   := v_xp + v_pending;
  v_target := floor(v_base * v_pct);

  -- Ya se aplicó lo que corresponde a esta semana de ausencia
  if v_target <= v_pending then
    return;
  end if;

  update users
  set xp_total           = greatest(0, v_base - v_target),
      xp_decay_pending   = v_target,
      last_xp_decay_date = v_today
  where id = p_user_id;
end;
$function$;


-- 2) update_streak
--    Ahora usa la fecha de Argentina (antes UTC: después de las 21 hs
--    contaba como el día siguiente y podía cortar la racha) y limpia
--    xp_decay_pending al estudiar, así el aviso de XP perdido desaparece.
create or replace function public.update_streak(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_last_date date;
  v_streak    int;
  v_best      int;
  v_today     date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  select last_study_date, streak_current, streak_best
  into v_last_date, v_streak, v_best
  from users where id = p_user_id;

  if v_last_date is null then
    v_streak := 1;
  elsif v_last_date >= v_today then
    v_streak := coalesce(v_streak, 1);
  elsif v_last_date = v_today - 1 then
    v_streak := coalesce(v_streak, 0) + 1;
  else
    v_streak := 1;
  end if;

  if v_streak > coalesce(v_best, 0) then
    v_best := v_streak;
  end if;

  update users
  set streak_current   = v_streak,
      streak_best      = v_best,
      last_study_date  = greatest(v_today, coalesce(v_last_date, v_today)),
      xp_decay_pending = 0
  where id = p_user_id;
end;
$function$;


-- 3) get_user_stats
--    Cuenta sesiones y suma respuestas en la base, sin el tope de 1000
--    filas. Precisión = correctas / respondidas (no / tamaño del lote).
create or replace function public.get_user_stats(p_user_id uuid)
returns table(sesiones bigint, correctas bigint, respondidas bigint)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  select
    count(*),
    coalesce(sum(coalesce(correct, 0)), 0),
    coalesce(sum(coalesce(correct, 0) + coalesce(wrong, 0) + coalesce("partial", 0)), 0)
  from study_sessions
  where user_id = p_user_id
    and finished_at is not null;
$function$;

grant execute on function public.get_user_stats(uuid) to authenticated;


-- 4) Limpieza única: apagar el aviso viejo a quienes estudiaron en las
--    últimas 2 semanas (el XP perdido no se devuelve).
update users
set xp_decay_pending = 0
where xp_decay_pending > 0
  and last_study_date >= (now() at time zone 'America/Argentina/Buenos_Aires')::date - 14;
