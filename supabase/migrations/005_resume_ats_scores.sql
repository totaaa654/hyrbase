-- ============================================================
-- HyrBase migration 005: resume_ats_scores table
--
-- Stores a per-resume ATS score that is independent of any job
-- application. One row per resume (UNIQUE on resume_id) so that
-- re-analyzing simply overwrites the previous result via upsert.
-- ============================================================

-- Reuse the set_updated_at() trigger function created in migration 001.
-- If running in isolation, create it here.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists resume_ats_scores (
  id          uuid primary key default gen_random_uuid(),
  resume_id   uuid not null unique references resumes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  ats_score   integer not null check (ats_score between 0 and 100),
  status      text not null check (status in ('Excellent', 'Good', 'Fair', 'Poor')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_resume_ats_scores_updated_at
  before update on resume_ats_scores
  for each row execute function set_updated_at();

alter table resume_ats_scores enable row level security;

create policy "Users access own resume ATS scores"
  on resume_ats_scores
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists resume_ats_scores_resume_id_idx
  on resume_ats_scores (resume_id);
