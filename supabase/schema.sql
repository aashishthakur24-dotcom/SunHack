begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvas_nodes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  type text not null check (type in ('rect', 'ellipse', 'diamond', 'triangle', 'text', 'sticky')),
  node_type text not null check (node_type in ('safe', 'risk', 'conflict', 'info', 'decision')),
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  color text,
  font_size double precision,
  bold boolean,
  italic boolean,
  locked boolean,
  visible boolean,
  rotation double precision,
  timestamp text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvas_connections (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_node_id text not null,
  to_node_id text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insights (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('confidence', 'source', 'conflict')),
  title text not null,
  body text not null,
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  source_ids text[] not null default '{}'::text[],
  resolved boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decisions_user_id_idx on public.decisions(user_id, created_at desc);
create index if not exists canvas_nodes_user_id_idx on public.canvas_nodes(user_id, created_at desc);
create index if not exists canvas_connections_user_id_idx on public.canvas_connections(user_id, created_at desc);
create index if not exists insights_user_id_idx on public.insights(user_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger decisions_set_updated_at
before update on public.decisions
for each row execute function public.set_updated_at();

create trigger canvas_nodes_set_updated_at
before update on public.canvas_nodes
for each row execute function public.set_updated_at();

create trigger canvas_connections_set_updated_at
before update on public.canvas_connections
for each row execute function public.set_updated_at();

create trigger insights_set_updated_at
before update on public.insights
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.decisions enable row level security;
alter table public.canvas_nodes enable row level security;
alter table public.canvas_connections enable row level security;
alter table public.insights enable row level security;

create policy "Profiles are visible to the owner"
  on public.profiles
  for select
  using (auth.uid() = uid);

create policy "Profiles can be inserted by the owner"
  on public.profiles
  for insert
  with check (auth.uid() = uid);

create policy "Profiles can be updated by the owner"
  on public.profiles
  for update
  using (auth.uid() = uid)
  with check (auth.uid() = uid);

create policy "Decisions are visible to the owner"
  on public.decisions
  for select
  using (auth.uid() = user_id);

create policy "Decisions can be inserted by the owner"
  on public.decisions
  for insert
  with check (auth.uid() = user_id);

create policy "Decisions can be updated by the owner"
  on public.decisions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Decisions can be deleted by the owner"
  on public.decisions
  for delete
  using (auth.uid() = user_id);

create policy "Canvas nodes are visible to the owner"
  on public.canvas_nodes
  for select
  using (auth.uid() = user_id);

create policy "Canvas nodes can be inserted by the owner"
  on public.canvas_nodes
  for insert
  with check (auth.uid() = user_id);

create policy "Canvas nodes can be updated by the owner"
  on public.canvas_nodes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Canvas nodes can be deleted by the owner"
  on public.canvas_nodes
  for delete
  using (auth.uid() = user_id);

create policy "Canvas connections are visible to the owner"
  on public.canvas_connections
  for select
  using (auth.uid() = user_id);

create policy "Canvas connections can be inserted by the owner"
  on public.canvas_connections
  for insert
  with check (auth.uid() = user_id);

create policy "Canvas connections can be updated by the owner"
  on public.canvas_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Canvas connections can be deleted by the owner"
  on public.canvas_connections
  for delete
  using (auth.uid() = user_id);

create policy "Insights are visible to the owner"
  on public.insights
  for select
  using (auth.uid() = user_id);

create policy "Insights can be inserted by the owner"
  on public.insights
  for insert
  with check (auth.uid() = user_id);

create policy "Insights can be updated by the owner"
  on public.insights
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Insights can be deleted by the owner"
  on public.insights
  for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
begin
  insert into public.profiles (uid, name, email, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Anonymous'),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    now_ts,
    now_ts
  )
  on conflict (uid)
  do update set
    name = excluded.name,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    updated_at = now_ts;

  insert into public.decisions (id, user_id, title, description, confidence, status, created_at, updated_at)
  values
    ('decision_seed_1', new.id, 'APAC Market Entry Q4', 'Launch decision pending legal review.', 87, 'active', now_ts, now_ts),
    ('decision_seed_2', new.id, 'Vendor Contract Renewal', 'Procurement and legal sign-off completed.', 94, 'resolved', now_ts, now_ts)
  on conflict (id) do nothing;

  insert into public.canvas_nodes (id, user_id, label, type, node_type, x, y, w, h, timestamp, created_at, updated_at)
  values
    ('n1', new.id, 'Gmail: Risk Flag', 'rect', 'risk', 80, 150, 160, 60, 'seed', now_ts, now_ts),
    ('n2', new.id, 'Revenue Report', 'rect', 'info', 80, 280, 160, 60, 'seed', now_ts, now_ts),
    ('n3', new.id, 'Board Approval', 'ellipse', 'safe', 320, 120, 160, 60, 'seed', now_ts, now_ts),
    ('n4', new.id, 'Compliance', 'diamond', 'conflict', 300, 260, 180, 80, 'seed', now_ts, now_ts),
    ('n5', new.id, 'APAC Decision', 'rect', 'decision', 580, 200, 180, 70, 'seed', now_ts, now_ts)
  on conflict (id) do nothing;

  insert into public.canvas_connections (id, user_id, from_node_id, to_node_id, created_at, updated_at)
  values
    ('c1', new.id, 'n1', 'n3', now_ts, now_ts),
    ('c2', new.id, 'n1', 'n4', now_ts, now_ts),
    ('c3', new.id, 'n2', 'n3', now_ts, now_ts),
    ('c4', new.id, 'n2', 'n5', now_ts, now_ts),
    ('c5', new.id, 'n3', 'n5', now_ts, now_ts),
    ('c6', new.id, 'n4', 'n5', now_ts, now_ts)
  on conflict (id) do nothing;

  insert into public.insights (id, user_id, type, title, body, confidence, source_ids, resolved, data, created_at, updated_at)
  values
    ('i1', new.id, 'conflict', 'Timeline Contradiction Detected', 'Board memo approves Q4 launch while risk assessment mandates a 6-month compliance review.', 94, array['board-memo', 'risk-assessment']::text[], false, '{"score":94}'::jsonb, now_ts, now_ts),
    ('i2', new.id, 'source', 'Revenue Projection Alignment', 'Multiple sources agree on the $2.4M revenue target for the current decision tree.', 91, array['q3-report', 'cfo-email', 'analyst-brief']::text[], false, '{"score":91}'::jsonb, now_ts, now_ts),
    ('i3', new.id, 'confidence', 'Stakeholder Update Needed', 'Legal review is still incomplete and is blocking the final approval step.', 78, array['legal-email', 'compliance-doc']::text[], false, '{"score":78}'::jsonb, now_ts, now_ts)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
