-- Conversations and Messages for long-term chat history
-- Requires: pgcrypto or gen_random_uuid() (on Supabase it's available)

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  archived boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists conversations_owner_created_idx on conversations(owner, created_at desc);

-- Main chat messages table used by backend
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  owner uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system','user','assistant','tool','agent')),
  content text not null,
  agent_id uuid null,
  tool_used text null,
  created_at timestamp with time zone not null default now()
);

create index if not exists chat_messages_conv_created_idx on chat_messages(conversation_id, created_at asc);
create index if not exists chat_messages_owner_idx on chat_messages(owner);

-- RLS
alter table conversations enable row level security;
alter table chat_messages enable row level security;

-- Policies: owner can do everything on own rows (idempotent: drop then create)
drop policy if exists conversations_select on conversations;
create policy conversations_select on conversations
  for select using (auth.uid() = owner);

drop policy if exists conversations_insert on conversations;
create policy conversations_insert on conversations
  for insert with check (auth.uid() = owner);

drop policy if exists conversations_update on conversations;
create policy conversations_update on conversations
  for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists conversations_delete on conversations;
create policy conversations_delete on conversations
  for delete using (auth.uid() = owner);

drop policy if exists messages_select on chat_messages;
create policy messages_select on chat_messages
  for select using (auth.uid() = owner);

drop policy if exists messages_insert on chat_messages;
create policy messages_insert on chat_messages
  for insert with check (auth.uid() = owner);

drop policy if exists messages_update on chat_messages;
create policy messages_update on chat_messages
  for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists messages_delete on chat_messages;
create policy messages_delete on chat_messages
  for delete using (auth.uid() = owner);

-- Trigger to update conversations.updated_at on new message
create or replace function touch_conversation_updated_at()
returns trigger as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_touch_conversation on chat_messages;
create trigger messages_touch_conversation
  after insert on chat_messages
  for each row execute function touch_conversation_updated_at();
