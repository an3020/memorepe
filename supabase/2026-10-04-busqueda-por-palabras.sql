-- =====================================================================
-- Memorepe — Búsqueda por palabras en Explorar
-- "siglo 21 contrato de empresa" encuentra "Contratos de Empresa" (Siglo 21):
-- separa en palabras, ignora acentos/mayúsculas y palabras vacías, busca en
-- título, materia, institución, profesor y descripción, y cuenta coincidencias.
-- Correr COMPLETO una vez en el SQL Editor de Supabase.
-- =====================================================================

-- Normaliza texto: minúsculas y sin acentos
create or replace function public.mr_norm(t text)
returns text
language sql immutable
as $function$
  select translate(lower(coalesce(t, '')),
                   'áéíóúüñàèìòùâêîôûäëïöç',
                   'aeiouunaeiouaeiouaeioc');
$function$;

-- Palabras significativas de una búsqueda
create or replace function public.mr_terminos(p_q text)
returns text[]
language sql immutable
as $function$
  select coalesce(array_agg(distinct w), '{}')
  from regexp_split_to_table(public.mr_norm(p_q), '[^a-z0-9]+') as w
  where w <> ''
    and (length(w) >= 2 or w ~ '^[0-9]+$')
    and w not in ('de','del','la','las','el','los','y','e','o','u','en','para','por',
                  'con','sin','un','una','unos','unas','al','lo','que','su','sus','a');
$function$;

-- Busca bancos públicos y devuelve cuántas palabras coinciden
create or replace function public.search_quizzes(p_q text, p_categoria text default null, p_limit int default 60)
returns table(id uuid, coincidencias int, total int, en_titulo int)
language sql stable
set search_path to 'public'
as $function$
  with t as (select public.mr_terminos(p_q) as terms),
  q as (
    select z.id, z.student_count,
           public.mr_norm(z.title) as titulo,
           public.mr_norm(concat_ws(' ', z.title, z.subject, z.faculty, z.teacher, z.year_course, z.description)) as todo
    from quizzes z
    where z.visibility = 'public'
      and (p_categoria is null or p_categoria = '' or z.category = p_categoria)
  ),
  s as (
    select q.id, q.student_count, cardinality(t.terms) as total,
           (select count(*) from unnest(t.terms) w where q.todo   like '%' || w || '%')::int as coincidencias,
           (select count(*) from unnest(t.terms) w where q.titulo like '%' || w || '%')::int as en_titulo
    from q, t
    where cardinality(t.terms) > 0
  )
  select s.id, s.coincidencias, s.total, s.en_titulo
  from s
  where s.coincidencias > 0
  order by s.coincidencias desc, s.en_titulo desc, s.student_count desc nulls last
  limit p_limit;
$function$;

grant execute on function public.search_quizzes(text, text, int) to anon, authenticated;

-- Registro de búsquedas: guardar también cuántos resultados parciales hubo
alter table public.search_logs add column if not exists parciales int not null default 0;

drop function if exists public.log_search(text, int, text);
create or replace function public.log_search(p_q text, p_resultados int, p_categoria text default null, p_parciales int default 0)
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
  if auth.uid() is not null and exists (
    select 1 from search_logs
    where user_id = auth.uid() and q = v_q
      and created_at > now() - interval '10 minutes'
  ) then
    return;
  end if;
  insert into search_logs (q, resultados, categoria, user_id, parciales)
  values (v_q, greatest(0, coalesce(p_resultados, 0)), nullif(p_categoria, ''), auth.uid(), greatest(0, coalesce(p_parciales, 0)));
end;
$function$;
grant execute on function public.log_search(text, int, text, int) to anon, authenticated;

-- Admin: búsquedas, distinguiendo "nada" de "solo coincidencias parciales"
drop function if exists public.admin_busquedas(int);
create or replace function public.admin_busquedas(p_dias int default 30)
returns table(q text, veces bigint, personas bigint, sin_resultado bool, solo_parcial bool, ultima timestamptz)
language sql stable security definer set search_path to 'public'
as $function$
  select
    q,
    count(*),
    count(distinct coalesce(user_id::text, id::text)),
    bool_and(resultados = 0),
    bool_and(resultados = 0) and bool_or(parciales > 0),
    max(created_at)
  from search_logs
  where created_at > now() - make_interval(days => p_dias)
    and q not like '@%'
  group by q
  order by count(*) desc, max(created_at) desc
  limit 100;
$function$;
revoke execute on function public.admin_busquedas(int) from public, anon, authenticated;
grant  execute on function public.admin_busquedas(int) to service_role;
