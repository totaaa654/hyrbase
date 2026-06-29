-- ============================================================
-- HyrBase: Job Applications schema
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- Job applications table
create table if not exists public.job_applications (
  id                 uuid        default gen_random_uuid() primary key,
  user_id            uuid        references auth.users(id) on delete cascade not null,
  company_name       text        not null,
  company_logo_url   text,
  position           text        not null,
  job_description    text,
  employment_type    text        not null default 'Full-time',
  work_setup         text        not null default 'On-site',
  location           text,
  salary             text,
  application_source text,
  recruiter_name     text,
  recruiter_email    text,
  date_applied       date        not null default current_date,
  resume_used        text,
  cover_letter       text,
  notes              text,
  status             text        not null default 'Wishlist',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Status change history table
create table if not exists public.application_status_history (
  id               uuid        default gen_random_uuid() primary key,
  application_id   uuid        references public.job_applications(id) on delete cascade not null,
  status           text        not null,
  notes            text,
  changed_at       timestamptz not null default now()
);

-- Indexes
create index if not exists idx_job_applications_user_id
  on public.job_applications(user_id);

create index if not exists idx_job_applications_status
  on public.job_applications(status);

create index if not exists idx_status_history_application_id
  on public.application_status_history(application_id);

-- Enable Row Level Security
alter table public.job_applications          enable row level security;
alter table public.application_status_history enable row level security;

-- RLS: users can only access their own applications
create policy "Users manage their own applications"
  on public.job_applications for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: users can only access history for their own applications
create policy "Users manage history of their applications"
  on public.application_status_history for all
  using (
    application_id in (
      select id from public.job_applications where user_id = auth.uid()
    )
  )
  with check (
    application_id in (
      select id from public.job_applications where user_id = auth.uid()
    )
  );

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_job_applications_updated_at on public.job_applications;
create trigger trg_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();
