-- AI Conversations
create table public.ai_conversations (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null default 'New Conversation',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index ai_conversations_user_id_updated_idx
  on public.ai_conversations(user_id, updated_at desc);

-- AI Messages
create table public.ai_messages (
  id              uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz default now() not null
);

create index ai_messages_conversation_id_idx
  on public.ai_messages(conversation_id, created_at asc);

-- RLS: ai_conversations
alter table public.ai_conversations enable row level security;

create policy "owner_select_conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "owner_insert_conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "owner_update_conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id);

create policy "owner_delete_conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- RLS: ai_messages (access through conversation ownership)
alter table public.ai_messages enable row level security;

create policy "owner_select_messages"
  on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_conversations
      where id = ai_messages.conversation_id
        and user_id = auth.uid()
    )
  );

create policy "owner_insert_messages"
  on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_conversations
      where id = ai_messages.conversation_id
        and user_id = auth.uid()
    )
  );

create policy "owner_delete_messages"
  on public.ai_messages for delete
  using (
    exists (
      select 1 from public.ai_conversations
      where id = ai_messages.conversation_id
        and user_id = auth.uid()
    )
  );
