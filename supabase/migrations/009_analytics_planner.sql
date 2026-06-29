-- Calendar events
create table public.calendar_events (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  application_id  uuid references public.job_applications(id) on delete set null,
  title           text not null,
  description     text,
  event_type      text not null default 'note' check (
    event_type in ('application','interview','assessment','hr_call','follow_up','offer','deadline','note')
  ),
  start_time      timestamptz not null,
  end_time        timestamptz,
  all_day         boolean not null default false,
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  completed       boolean not null default false,
  color           text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

create index calendar_events_user_start_idx on public.calendar_events(user_id, start_time);
create index calendar_events_application_idx on public.calendar_events(application_id)
  where application_id is not null;

alter table public.calendar_events enable row level security;

create policy "owner_select_events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "owner_insert_events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "owner_update_events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "owner_delete_events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- Weekly application goal (one row per user)
create table public.user_goals (
  user_id                  uuid references auth.users(id) on delete cascade primary key,
  weekly_applications_goal integer not null default 5,
  updated_at               timestamptz default now() not null
);

alter table public.user_goals enable row level security;

create policy "owner_all_goals"
  on public.user_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
