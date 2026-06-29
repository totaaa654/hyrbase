-- ============================================================
-- HyrBase migration 004: resume_analysis table
--
-- Stores AI-generated resume analysis results per application.
-- Each row is one analysis run; re-analyzing creates a new row.
-- Only the most recent row is shown in the UI.
-- ============================================================

create table if not exists resume_analysis (
  id                     uuid primary key default gen_random_uuid(),
  application_id         uuid not null references job_applications(id) on delete cascade,
  resume_id              uuid references resumes(id) on delete set null,
  resume_match           integer not null check (resume_match between 0 and 100),
  ats_score              integer not null check (ats_score between 0 and 100),
  strengths              jsonb not null default '[]',
  weaknesses             jsonb not null default '[]',
  matching_skills        jsonb not null default '[]',
  missing_skills         jsonb not null default '[]',
  summary                text,
  suggestions            jsonb not null default '[]',
  generated_cover_letter text,
  ai_provider            text not null default 'gemini',
  created_at             timestamptz not null default now()
);

alter table resume_analysis enable row level security;

-- Users may only access analyses for their own applications
create policy "Users access own analyses"
  on resume_analysis
  for all
  using (
    application_id in (
      select id from job_applications where user_id = auth.uid()
    )
  );

create index if not exists resume_analysis_application_id_idx
  on resume_analysis (application_id, created_at desc);
