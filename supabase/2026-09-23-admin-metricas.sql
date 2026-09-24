-- =====================================================================
-- Memorepe — Admin: crecimiento, qué busca la gente, pendientes
-- Correr completo en el SQL Editor de Supabase (una sola vez).
-- Todas las funciones admin_* solo las puede ejecutar el service role
-- (el panel admin); ningún usuario común puede llamarlas.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) ¿ESTÁ CRECIENDO?
--    Por semana (lunes a domingo, hora Argentina):
--    activos     = usuarios con al menos una sesión terminada
--    nuevos      = usuarios registrados
--    activados   = de los nuevos, cuántos terminaron una sesión en sus
--                  primeros 7 días
--    base_ret    = activos de la semana anterior
--    retenidos   = de esos, cuántos volvieron esta semana
-- ---------------------------------------------------------------------
create or replace function public.admin_growth(p_weeks int default 12)
returns table(
  semana date, activos bigint, nuevos bigint, activados bigint,
  base_ret bigint, retenidos bigint, sesiones bigint, preguntas bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with lim as (
    select date_trunc('week', now() at time zone 'America/Argentina/Buenos_Aires')::date as actual
  ),
  semanas as (
    select (lim.actual - (7 * g))::date as semana
    from lim, generate_series(0, p_weeks - 1) g
  ),
  ses as (
    select user_id,
           date_trunc('week', finished_at at time zone 'America/Argentina/Buenos_Aires')::date as semana,
           coalesce(correct, 0) + coalesce(wrong, 0) + coalesce("partial", 0) as resp
    from study_sessions, lim
    where finished_at is not null
      and finished_at >= (lim.actual - 7 * (p_weeks + 1))::timestamp at time zone 'America/Argentina/Buenos_Aires'
  ),
  act as (select distinct user_id, semana from ses),
  nue as (
    select id, created_at,
           date_trunc('week', created_at at time zone 'America/Argentina/Buenos_Aires')::date as semana
    from users, lim
    where created_at >= (lim.actual - 7 * p_weeks)::timestamp at time zone 'America/Argentina/Buenos_Aires'
  )
  select
    s.semana,
    (select count(*) from act a where a.semana = s.semana),
    (select count(*) from nue n where n.semana = s.semana),
    (select count(*) from nue n where n.semana = s.semana and exists (
       select 1 from study_sessions x
       where x.user_id = n.id and x.finished_at is not null
         and x.finished_at < n.created_at + interval '7 days')),
    (select count(*) from act a where a.semana = s.semana - 7),
    (select count(*) from act a where a.semana = s.semana - 7 and exists (
       select 1 from act b where b.user_id = a.user_id and b.semana = s.semana)),
    (select count(*) from ses x where x.semana = s.semana),
    (select coalesce(sum(resp), 0) from ses x where x.semana = s.semana)
  from semanas s
  order by s.semana;
$function$;


-- ---------------------------------------------------------------------
-- 2) ¿QUÉ BUSCA LA GENTE?
-- ---------------------------------------------------------------------

-- 2a) Registro de búsquedas en Explorar
create table if not exists public.search_logs (
  id          bigint generated always as identity primary key,
  q           text not null,
  resultados  int not null default 0,
  categoria   text,
  user_id     uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists search_logs_created_at_idx on public.search_logs (created_at desc);
alter table public.search_logs enable row level security;
-- Sin políticas: nadie lee ni escribe directo; solo por las funciones.

create or replace function public.log_search(p_q text, p_resultados int, p_categoria text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_q text := lower(trim(regexp_replace(coalesce(p_q, ''), '\s+', ' ', 'g')));
begin
  if length(v_q) < 2 or length(v_q) > 100 then
    return;
  end if;
  -- Evitar duplicados: misma búsqueda del mismo usuario en los últimos 10 min
  if auth.uid() is not null and exists (
    select 1 from search_logs
    where user_id = auth.uid() and q = v_q
      and created_at > now() - interval '10 minutes'
  ) then
    return;
  end if;
  insert into search_logs (q, resultados, categoria, user_id)
  values (v_q, greatest(0, coalesce(p_resultados, 0)), nullif(p_categoria, ''), auth.uid());
end;
$function$;

grant execute on function public.log_search(text, int, text) to anon, authenticated;

create or replace function public.admin_busquedas(p_dias int default 30)
returns table(q text, veces bigint, personas bigint, sin_resultado bool, ultima timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    q,
    count(*),
    count(distinct coalesce(user_id::text, id::text)),
    bool_and(resultados = 0),
    max(created_at)
  from search_logs
  where created_at > now() - make_interval(days => p_dias)
    and q not like '@%'
  group by q
  order by count(*) desc, max(created_at) desc
  limit 100;
$function$;


-- 2b) Origen de cada usuario (primera página que visitó antes de registrarse)
alter table public.users add column if not exists origen_path     text;
alter table public.users add column if not exists origen_referrer text;
alter table public.users add column if not exists origen_utm      text;

create or replace function public.admin_origenes(p_dias int default 30)
returns table(tipo text, detalle text, usuarios bigint, activados bigint)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with u as (
    select
      id, created_at,
      case
        when origen_path is null                 then 'Sin dato'
        when origen_path like '/q/%'
          or origen_path like '/quiz/%'          then 'Banco público'
        when origen_path like '/blog%'           then 'Blog'
        when origen_path like '/estudiar/%'      then 'Modo invitado'
        when origen_path like '/explorar%'       then 'Explorar'
        when origen_path like '/usuario/%'       then 'Perfil público'
        when origen_path = '/'                   then 'Portada'
        else 'Otra página'
      end as tipo,
      coalesce(nullif(origen_utm, ''), nullif(origen_referrer, ''), 'directo') as detalle
    from users
    where created_at > now() - make_interval(days => p_dias)
  )
  select
    tipo, detalle, count(*),
    count(*) filter (where exists (
      select 1 from study_sessions x
      where x.user_id = u.id and x.finished_at is not null
        and x.finished_at < u.created_at + interval '7 days'))
  from u
  group by tipo, detalle
  order by count(*) desc;
$function$;


-- ---------------------------------------------------------------------
-- 3) PENDIENTES
-- ---------------------------------------------------------------------

-- 3a) Usuarios que se registraron y nunca terminaron una sesión
create or replace function public.admin_sin_estudiar(p_dias int default 30)
returns table(id uuid, username text, email text, created_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select u.id, u.username, u.email, u.created_at
  from users u
  where u.created_at > now() - make_interval(days => p_dias)
    and not exists (
      select 1 from study_sessions x
      where x.user_id = u.id and x.finished_at is not null)
  order by u.created_at desc
  limit 50;
$function$;

-- 3b) Preguntas sospechosas: mucha gente la falla, o la reportaron varias veces
create or replace function public.admin_preguntas_sospechosas(p_min_respuestas int default 8)
returns table(
  question_id uuid, quiz_id uuid, pregunta text, quiz text,
  respuestas bigint, pct_error int, reportes_pendientes bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with stats as (
    select question_id,
           count(*) as n,
           count(*) filter (where result = 'wrong') as mal
    from session_answers
    group by question_id
    having count(*) >= p_min_respuestas
  ),
  rep as (
    select question_id, count(*) as n
    from question_reports
    where status = 'pending'
    group by question_id
  ),
  cand as (
    select coalesce(s.question_id, r.question_id) as question_id,
           coalesce(s.n, 0) as n,
           case when s.n > 0 then round(100.0 * s.mal / s.n)::int else null end as pct,
           coalesce(r.n, 0) as rep
    from stats s
    full join rep r on r.question_id = s.question_id
  )
  select c.question_id, q.quiz_id, q.body, z.title, c.n, c.pct, c.rep
  from cand c
  join questions q on q.id = c.question_id
  left join quizzes z on z.id = q.quiz_id
  where c.rep >= 2 or c.pct >= 75
  order by c.rep desc, c.pct desc nulls last, c.n desc
  limit 30;
$function$;


-- ---------------------------------------------------------------------
-- Permisos: las funciones admin_* solo para el service role
-- ---------------------------------------------------------------------
revoke execute on function public.admin_growth(int)                from public, anon, authenticated;
revoke execute on function public.admin_busquedas(int)             from public, anon, authenticated;
revoke execute on function public.admin_origenes(int)              from public, anon, authenticated;
revoke execute on function public.admin_sin_estudiar(int)          from public, anon, authenticated;
revoke execute on function public.admin_preguntas_sospechosas(int) from public, anon, authenticated;
grant  execute on function public.admin_growth(int)                to service_role;
grant  execute on function public.admin_busquedas(int)             to service_role;
grant  execute on function public.admin_origenes(int)              to service_role;
grant  execute on function public.admin_sin_estudiar(int)          to service_role;
grant  execute on function public.admin_preguntas_sospechosas(int) to service_role;
