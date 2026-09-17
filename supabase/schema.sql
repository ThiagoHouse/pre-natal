-- Cole este arquivo no SQL Editor do Supabase (Dashboard > SQL > New query).
-- Ele cria as tabelas do pre-natal, com RLS para cada usuaria ver so os proprios dados.

create type public.document_kind as enum (
  'exame',
  'ultrassom',
  'atestado',
  'consulta',
  'receita',
  'vacina',
  'outro'
);

create type public.checklist_status as enum (
  'pendente',
  'concluido',
  'cancelado'
);

create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  patient_name text,
  due_date date not null,
  last_menstrual_period date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  kind public.document_kind not null default 'exame',
  title text not null,
  occurred_on date not null,
  notes text,
  file_path text,
  file_name text,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  title text not null,
  requested_on date,
  due_on date,
  completed_on date,
  status public.checklist_status not null default 'pendente',
  notes text,
  created_at timestamptz not null default now()
);

create index documents_pregnancy_occurred_idx
  on public.documents (pregnancy_id, occurred_on desc);

create index checklist_items_pregnancy_due_idx
  on public.checklist_items (pregnancy_id, due_on);

alter table public.pregnancies enable row level security;
alter table public.documents enable row level security;
alter table public.checklist_items enable row level security;

create policy "Usuaria gerencia a propria gestacao"
  on public.pregnancies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuaria gerencia os proprios documentos"
  on public.documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuaria gerencia o proprio checklist"
  on public.checklist_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  10485760,
  array['application/pdf', 'application/octet-stream']
)
on conflict (id) do nothing;

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
