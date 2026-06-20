-- ============================================================
-- A10TC Platform — Supabase Database Schema
-- ይህንን SQL በ Supabase Dashboard → SQL Editor ውስጥ ገልብጠው Run ያድርጉ
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. MAIN TABLE: registrations
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  email text not null unique,
  telegram_username text not null,
  academic_level text not null,
  batch_selection text not null
    check (batch_selection in ('Batch 1', 'Batch 2', 'Batch 3')),
  payment_reference text not null,
  receipt_url text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

-- 3. INDEXES (ለፍጥነት)
create index if not exists idx_registrations_status
  on public.registrations (status);

create index if not exists idx_registrations_batch
  on public.registrations (batch_selection);

create index if not exists idx_registrations_email
  on public.registrations (email);

-- 4. GLOBAL CAP TRIGGER (150 max students)
create or replace function public.enforce_global_cap()
returns trigger
language plpgsql
as $$
declare
  total_count integer;
begin
  select count(*) into total_count from public.registrations;

  if total_count >= 150 then
    raise exception 'Registration closed: global cap of 150 reached.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_global_cap on public.registrations;
create trigger trg_enforce_global_cap
before insert on public.registrations
for each row execute function public.enforce_global_cap();

-- 5. BATCH CAP TRIGGER (50 per batch)
create or replace function public.enforce_batch_cap()
returns trigger
language plpgsql
as $$
declare
  batch_count integer;
begin
  select count(*) into batch_count
  from public.registrations
  where batch_selection = new.batch_selection;

  if batch_count >= 50 then
    raise exception 'Batch full: % already has 50 students.', new.batch_selection;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_batch_cap on public.registrations;
create trigger trg_enforce_batch_cap
before insert on public.registrations
for each row execute function public.enforce_batch_cap();

-- 6. PUBLIC COUNT FUNCTION (Live Seat Count — without exposing personal data)
create or replace function public.get_registration_counts()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from public.registrations),
    'batch_1', (select count(*) from public.registrations where batch_selection = 'Batch 1'),
    'batch_2', (select count(*) from public.registrations where batch_selection = 'Batch 2'),
    'batch_3', (select count(*) from public.registrations where batch_selection = 'Batch 3')
  );
$$;

grant execute on function public.get_registration_counts() to anon, authenticated;

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.registrations enable row level security;

-- Public users can ONLY insert (register)
drop policy if exists "public_can_register" on public.registrations;
create policy "public_can_register"
on public.registrations
for insert
to anon, authenticated
with check (true);

-- Nobody reads raw rows from the client (admin uses service role via API)
drop policy if exists "no_public_select" on public.registrations;
create policy "no_public_select"
on public.registrations
for select
to anon, authenticated
using (false);

drop policy if exists "no_public_update" on public.registrations;
create policy "no_public_update"
on public.registrations
for update
to anon, authenticated
using (false);

drop policy if exists "no_public_delete" on public.registrations;
create policy "no_public_delete"
on public.registrations
for delete
to anon, authenticated
using (false);

-- ============================================================
-- 8. STORAGE BUCKET (Receipts)
-- Supabase Dashboard → Storage → New Bucket:
--   Name: receipts
--   Public: OFF (private)
-- Then run the policies below.
-- ============================================================

-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
-- on conflict (id) do nothing;

-- Allow anonymous upload to receipts bucket
-- drop policy if exists "anon_upload_receipts" on storage.objects;
-- create policy "anon_upload_receipts"
-- on storage.objects for insert to anon
-- with check (bucket_id = 'receipts');

-- Only service role / admin can read receipts
-- drop policy if exists "service_read_receipts" on storage.objects;
-- create policy "service_read_receipts"
-- on storage.objects for select to service_role
-- using (bucket_id = 'receipts');
