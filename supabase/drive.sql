-- Rode no SQL Editor para guardar o link público dos PDFs do Google Drive.

alter table public.pregnancies
  add column if not exists drive_folder_id text,
  add column if not exists drive_folder_name text;

alter table public.documents
  add column if not exists drive_file_id text,
  add column if not exists file_url text;
