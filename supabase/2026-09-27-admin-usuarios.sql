-- =====================================================================
-- Memorepe — Admin: rankings de usuarios y ficha de usuario
-- Correr COMPLETO una vez en el SQL Editor de Supabase.
-- Solo el panel admin (service role) puede ejecutar estas funciones.
-- =====================================================================

-- Ranking de usuarios en un período (p_dias null = desde siempre)
create or replace function public.admin_ranking(p_dias int default 30)
returns table(
  user_id uuid, username text, email text, created_at timestamptz,
  bancos bigint, sesiones bigint, preguntas bigint, minutos bigint,
  reportes bigint, reportes_resueltos bigint, bancos_creados bigint,
  ultima timestamptz
)
language sql stable security definer set search_path to 'public'
as $function$
  with desde as (
    select case when p_dias is null then '-infinity'::timestamptz
                else now() - make_interval(days => p_dias) end as t
  ),
  s as (
    select x.user_id,
           count(distinct x.quiz_id) as bancos,
           count(*) as sesiones,
           sum(coalesce(x.correct,0)+coalesce(x.wrong,0)+coalesce(x."partial",0)) as preguntas,
           round(sum(coalesce(x.duration_seconds,0))/60.0)::bigint as minutos,
           max(x.finished_at) as ultima
    from study_sessions x, desde
    where x.finished_at is not null and x.finished_at >= desde.t
    group by x.user_id
  ),
  r as (
    select x.user_id, count(*) as reportes,
           count(*) filter (where x.status = 'resolved') as resueltos
    from question_reports x, desde
    where x.created_at >= desde.t
    group by x.user_id
  ),
  c as (
    select x.user_id, count(*) as creados
    from quizzes x, desde
    where x.created_at >= desde.t
    group by x.user_id
  )
  select u.id, u.username, u.email, u.created_at,
         coalesce(s.bancos,0), coalesce(s.sesiones,0), coalesce(s.preguntas,0), coalesce(s.minutos,0),
         coalesce(r.reportes,0), coalesce(r.resueltos,0), coalesce(c.creados,0),
         s.ultima
  from users u
  left join s on s.user_id = u.id
  left join r on r.user_id = u.id
  left join c on c.user_id = u.id
  where coalesce(s.sesiones,0) + coalesce(r.reportes,0) + coalesce(c.creados,0) > 0;
$function$;

-- Ficha: qué bancos estudió un usuario
create or replace function public.admin_user_bancos(p_user uuid)
returns table(quiz_id uuid, title text, slug text, sesiones bigint, preguntas bigint,
              correctas bigint, minutos bigint, primera timestamptz, ultima timestamptz)
language sql stable security definer set search_path to 'public'
as $function$
  select q.id, q.title, q.slug,
         count(*),
         sum(coalesce(x.correct,0)+coalesce(x.wrong,0)+coalesce(x."partial",0)),
         sum(coalesce(x.correct,0)),
         round(sum(coalesce(x.duration_seconds,0))/60.0)::bigint,
         min(x.finished_at), max(x.finished_at)
  from study_sessions x
  join quizzes q on q.id = x.quiz_id
  where x.user_id = p_user and x.finished_at is not null
  group by q.id, q.title, q.slug
  order by max(x.finished_at) desc;
$function$;

-- Ficha: reportes que hizo un usuario
create or replace function public.admin_user_reportes(p_user uuid)
returns table(id text, created_at timestamptz, reason text, comment text, status text,
              pregunta text, quiz_id uuid, quiz_title text)
language sql stable security definer set search_path to 'public'
as $function$
  select r.id::text, r.created_at, r.reason::text, r.comment::text, r.status::text,
         qu.body, r.quiz_id, qz.title
  from question_reports r
  left join questions qu on qu.id = r.question_id
  left join quizzes qz on qz.id = r.quiz_id
  where r.user_id = p_user
  order by r.created_at desc
  limit 200;
$function$;

-- Ficha: actividad por semana (últimas 12, hora Argentina)
create or replace function public.admin_user_semanas(p_user uuid)
returns table(semana date, sesiones bigint, preguntas bigint, minutos bigint)
language sql stable security definer set search_path to 'public'
as $function$
  with sem as (
    select (date_trunc('week', now() at time zone 'America/Argentina/Buenos_Aires')::date - 7*g) as semana
    from generate_series(0, 11) g
  )
  select sem.semana,
         count(x.id),
         coalesce(sum(coalesce(x.correct,0)+coalesce(x.wrong,0)+coalesce(x."partial",0)),0),
         round(coalesce(sum(coalesce(x.duration_seconds,0)),0)/60.0)::bigint
  from sem
  left join study_sessions x
    on x.user_id = p_user and x.finished_at is not null
   and date_trunc('week', x.finished_at at time zone 'America/Argentina/Buenos_Aires')::date = sem.semana
  group by sem.semana
  order by sem.semana;
$function$;

revoke execute on function public.admin_ranking(int)          from public, anon, authenticated;
revoke execute on function public.admin_user_bancos(uuid)     from public, anon, authenticated;
revoke execute on function public.admin_user_reportes(uuid)   from public, anon, authenticated;
revoke execute on function public.admin_user_semanas(uuid)    from public, anon, authenticated;
grant  execute on function public.admin_ranking(int)          to service_role;
grant  execute on function public.admin_user_bancos(uuid)     to service_role;
grant  execute on function public.admin_user_reportes(uuid)   to service_role;
grant  execute on function public.admin_user_semanas(uuid)    to service_role;
