-- Rode no SQL Editor se o projeto já foi criado com schema.sql.
-- Libera PDFs na linha do tempo e o tipo vacina.

alter type public.document_kind add value if not exists 'vacina';

alter table public.documents
  add column if not exists file_path text,
  add column if not exists file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  10485760,
  array['application/pdf', 'application/octet-stream']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuaria le os proprios pdfs" on storage.objects;
drop policy if exists "Usuaria envia os proprios pdfs" on storage.objects;
drop policy if exists "Usuaria remove os proprios pdfs" on storage.objects;

create policy "Usuaria le os proprios pdfs"
  on storage.objects
  for select
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Usuaria envia os proprios pdfs"
  on storage.objects
  for insert
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Usuaria remove os proprios pdfs"
  on storage.objects
  for delete
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
