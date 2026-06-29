-- ============================================================
-- HyrBase migration 002: Resumes + Application schema updates
-- ============================================================

-- ── Storage bucket ────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Storage RLS: each user can only touch their own folder (user_id/)
create policy "Users upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read their own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete their own resumes"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Resumes metadata table ────────────────────────────────────
create table if not exists public.resumes (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  file_name     text        not null,
  display_name  text        not null,
  file_url      text        not null,
  parsed_text   text,
  is_default    boolean     not null default false,
  file_size     bigint,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Only one default resume per user
create unique index if not exists idx_resumes_one_default_per_user
  on public.resumes(user_id) where is_default = true;

create index if not exists idx_resumes_user_id
  on public.resumes(user_id);

-- RLS
alter table public.resumes enable row level security;

create policy "Users manage their own resumes"
  on public.resumes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create trigger trg_resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- ── job_applications: add resume FK + structured salary ───────
alter table public.job_applications
  add column if not exists resume_id       uuid references public.resumes(id) on delete set null,
  add column if not exists salary_amount   text,
  add column if not exists salary_currency text,
  add column if not exists salary_rate     text;

-- ── OPTIONAL: drop old columns after verifying data migration ─
-- alter table public.job_applications drop column if exists resume_used;
-- alter table public.job_applications drop column if exists salary;
