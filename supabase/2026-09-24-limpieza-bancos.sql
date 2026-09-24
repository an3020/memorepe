-- =====================================================================
-- Memorepe — Limpieza de títulos, categorías y universidades de bancos
-- NO cambia preguntas, progreso ni URLs (/q/... queda igual).
--
-- PASO 1 (opcional, solo lectura): verificar si los "duplicados" lo son.
--   Correr solo este bloque y mirar el resultado.
-- PASO 2: correr el bloque BEGIN ... COMMIT completo.
-- =====================================================================

-- ---------- PASO 1: verificación de duplicados (no modifica nada) ----------
with pares(a, b, nombre) as (values
  ('a6da58ef-ea80-4de4-9a60-eee8994fefbb'::uuid, '7872f53e-e913-4493-a750-6cc111cc0852'::uuid, 'Medicina Tema B vs su copia'),
  ('692cf53e-b134-410b-bacc-ad63bd5d18cc'::uuid, '07ad5fcf-3d80-4638-b9a1-1d679ccb393b'::uuid, 'Contratos 1er Parcial (187) vs (180)')
)
select
  p.nombre,
  (select count(*) from questions where quiz_id = p.a) as preguntas_a,
  (select count(*) from questions where quiz_id = p.b) as preguntas_b,
  (select count(*) from questions qa
     where qa.quiz_id = p.a
       and exists (select 1 from questions qb
                   where qb.quiz_id = p.b
                     and lower(trim(qb.body)) = lower(trim(qa.body)))) as preguntas_en_comun,
  (select count(distinct user_id) from study_sessions where quiz_id = p.b) as personas_que_estudiaron_la_copia
from pares p;


-- ---------- PASO 2: aplicar cambios ----------
begin;

-- Títulos, categorías y universidad
update quizzes set title = 'Examen Único de Medicina 2025 – Tema A' where id = '6b3c5efb-513e-4207-ac44-bbaefaf683fb';
update quizzes set title = 'Examen Único de Medicina 2025 – Tema B' where id = 'a6da58ef-ea80-4de4-9a60-eee8994fefbb';
update quizzes set title = 'Examen Único de Medicina 2025 – Tema C' where id = '4d0d19b9-e2a8-463e-ae79-3a9043ff5bdb';
update quizzes set title = 'Derecho Penal Económico – Preguntas por módulo (IA)', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'f14405d1-a02c-46cb-ab9d-503deea2e190';
update quizzes set title = 'Derecho Penal Económico – 2do Parcial (IA)', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '16a2fcf9-fabe-4213-8219-53ac9fb1fdaa';
update quizzes set title = 'Derecho Penal Económico – 2do Parcial – Abril 2026', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '006f898d-ee4e-4c61-a6a7-c093119a9118';
update quizzes set title = 'Derecho Penal Económico – Módulo 4', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '1194d686-f840-4796-bff9-3b4692c99c07';
update quizzes set title = 'Introducción a la Filosofía – Módulos 1 y 2', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '1592b633-1259-4fa2-9e18-c7c18921b911';
update quizzes set title = 'Introducción a la Filosofía – Módulo 2', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'ab1d60a2-31ed-4025-897e-d43225ec47fb';
update quizzes set title = 'Introducción a la Filosofía – Módulo 1 (Lecturas 1 a 4)', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'f237677d-8551-4f4b-aec7-519f3a8506b0';
update quizzes set title = 'Introducción a la Filosofía – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'c57ad3e8-6a48-431f-a411-8c967e600886';
update quizzes set title = 'Introducción a la Filosofía – 2do Parcial', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'ac638471-7fd7-4285-914b-22a9181003fa';
update quizzes set title = 'Oratoria – 2do Parcial (IA)', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '46229635-7cd8-4c56-95c9-bb064f717e5a';
update quizzes set title = 'Derecho Penal Parte Especial – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '14904399-e25c-4558-9ae9-f8befb092f79';
update quizzes set title = 'Derecho Penal Parte Especial – 2do Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '1bb50ad4-78b4-4545-bd89-bb662e6189f0';
update quizzes set title = 'Persona Jurídica – Módulos 1 y 2', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '0626d4db-5668-4b8e-85a8-0c38a4c00111';
update quizzes set title = 'Persona Jurídica – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '8a136957-4603-40b2-8030-2500eee6322c';
update quizzes set title = 'Persona Jurídica – 2do Parcial', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'de1269b6-58ea-4a37-91af-0469aaba5818';
update quizzes set title = 'Principios de Economía – 1er Parcial', category = 'economia', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '3a07e8cc-184d-43f6-80d6-28b02fb8e6db';
update quizzes set title = 'Derecho Administrativo – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '793cf496-0274-434d-a269-294de631d57f';
update quizzes set title = 'Contratos de Empresa – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '692cf53e-b134-410b-bacc-ad63bd5d18cc';
update quizzes set title = 'Contratos de Empresa – 2do Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'ab08d99b-84bb-408f-aee2-4b636531101f';
update quizzes set title = 'Derecho de Integración Regional – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '708bc370-7994-4853-91f5-d15900c3a44b';
update quizzes set title = 'Derecho de Integración Regional – 2do Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '267c8aff-2aad-40b6-b829-354535ce41b8';
update quizzes set title = 'Teoría de la Argumentación Jurídica – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'f0a57971-c4da-41cf-97f7-824a4e9f65da';
update quizzes set title = 'Derecho de Familia – Completo (para el final)', category = 'derecho', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'bcd66757-3a68-458c-8a24-e13d1bbf87f8';
update quizzes set title = 'Historia del Derecho – Módulos 1 y 2', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '1aecba6b-b03c-454d-b94f-fdd0038064be';
update quizzes set title = 'Historia del Derecho – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'cda1cfb3-fea5-4839-a0ef-4819ee08c95e';
update quizzes set title = 'Historia del Derecho – 2do Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = 'c234fed9-f1b7-42bb-81c9-0d9e54ce90fd';
update quizzes set title = 'Derecho Público Provincial y Municipal – 1er Parcial', faculty = coalesce(nullif(trim(faculty), ''), 'Siglo 21') where id = '51cd97fb-6a5c-4086-b3a7-0edb93817c65';

-- EXANI-II sin universidad cargada
update quizzes set faculty = 'CENEVAL' where id = '0dd6870d-f8a4-4f27-a2ba-df80663d9546' and coalesce(trim(faculty), '') = '';

-- Ocultar (no borrar): pasan a 'Solo con link'. Quien tenga el link sigue
-- entrando y conserva su progreso; salen de Explorar, del sitemap y de Google.
update quizzes set visibility = 'link' where id = '7872f53e-e913-4493-a750-6cc111cc0852';  -- Examen Único MEDICINA TEMA: B 2025 (2ª copia)
update quizzes set visibility = 'link' where id = '07ad5fcf-3d80-4638-b9a1-1d679ccb393b';  -- Contratos de Empresa PRIMER PARCIAL US21
update quizzes set visibility = 'link' where id = 'd6a403e7-0730-4c23-99eb-d7e188dc8a92';  -- Historia del Derecho COMPLETO (0 preguntas)

commit;

-- Para deshacer un ocultamiento:
-- update quizzes set visibility = 'public' where id = '<id>';
