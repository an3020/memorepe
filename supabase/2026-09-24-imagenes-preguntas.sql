-- Memorepe — imágenes en preguntas
-- Guarda la ruta de la imagen (p. ej. /img/preguntas/pba/0001.webp). Opcional.
alter table public.questions add column if not exists image_url text;
