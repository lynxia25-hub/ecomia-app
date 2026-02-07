-- Schema for guided store creation: research sessions, candidates, sources, suppliers, assets.
-- Run in Supabase SQL editor.

-- Core sessions
create table if not exists research_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal text not null,
  status text not null default 'draft',
  notes text,
  selected_candidate_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references research_sessions(id) on delete cascade,
  name text not null,
  summary text,
  pros text,
  cons text,
  price_range text,
  demand_level text,
  competition_level text,
  score numeric,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research_sources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references research_sessions(id) on delete cascade,
  title text,
  url text,
  summary text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists product_suppliers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references research_sessions(id) on delete cascade,
  candidate_id uuid references product_candidates(id) on delete set null,
  name text not null,
  website text,
  contact text,
  price_range text,
  notes text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references research_sessions(id) on delete cascade,
  candidate_id uuid references product_candidates(id) on delete set null,
  asset_type text not null,
  url text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add FK to selected candidate (idempotent)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'research_sessions_selected_candidate_fk') then
    alter table research_sessions
      add constraint research_sessions_selected_candidate_fk
      foreign key (selected_candidate_id)
      references product_candidates(id)
      on delete set null;
  end if;
end $$;

-- Status constraint (idempotent)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'research_sessions_status_check') then
    alter table research_sessions
      add constraint research_sessions_status_check
      check (status in ('draft', 'researching', 'proposed', 'selected', 'completed'));
  end if;
end $$;

-- RLS
alter table research_sessions enable row level security;
alter table product_candidates enable row level security;
alter table research_sources enable row level security;
alter table product_suppliers enable row level security;
alter table product_assets enable row level security;

-- Policies: sessions

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'research_sessions_select_own') then
    create policy research_sessions_select_own on research_sessions
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'research_sessions_insert_own') then
    create policy research_sessions_insert_own on research_sessions
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'research_sessions_update_own') then
    create policy research_sessions_update_own on research_sessions
      for update using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'research_sessions_delete_own') then
    create policy research_sessions_delete_own on research_sessions
      for delete using (user_id = auth.uid());
  end if;
end $$;

-- Policies: candidates

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'product_candidates_select_own') then
    create policy product_candidates_select_own on product_candidates
      for select using (
        exists (
          select 1 from research_sessions s
          where s.id = product_candidates.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_candidates_insert_own') then
    create policy product_candidates_insert_own on product_candidates
      for insert with check (
        exists (
          select 1 from research_sessions s
          where s.id = product_candidates.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_candidates_update_own') then
    create policy product_candidates_update_own on product_candidates
      for update using (
        exists (
          select 1 from research_sessions s
          where s.id = product_candidates.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_candidates_delete_own') then
    create policy product_candidates_delete_own on product_candidates
      for delete using (
        exists (
          select 1 from research_sessions s
          where s.id = product_candidates.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Policies: sources

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'research_sources_select_own') then
    create policy research_sources_select_own on research_sources
      for select using (
        exists (
          select 1 from research_sessions s
          where s.id = research_sources.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'research_sources_insert_own') then
    create policy research_sources_insert_own on research_sources
      for insert with check (
        exists (
          select 1 from research_sessions s
          where s.id = research_sources.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'research_sources_delete_own') then
    create policy research_sources_delete_own on research_sources
      for delete using (
        exists (
          select 1 from research_sessions s
          where s.id = research_sources.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Policies: suppliers

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'product_suppliers_select_own') then
    create policy product_suppliers_select_own on product_suppliers
      for select using (
        exists (
          select 1 from research_sessions s
          where s.id = product_suppliers.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_suppliers_insert_own') then
    create policy product_suppliers_insert_own on product_suppliers
      for insert with check (
        exists (
          select 1 from research_sessions s
          where s.id = product_suppliers.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_suppliers_update_own') then
    create policy product_suppliers_update_own on product_suppliers
      for update using (
        exists (
          select 1 from research_sessions s
          where s.id = product_suppliers.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_suppliers_delete_own') then
    create policy product_suppliers_delete_own on product_suppliers
      for delete using (
        exists (
          select 1 from research_sessions s
          where s.id = product_suppliers.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Policies: assets

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'product_assets_select_own') then
    create policy product_assets_select_own on product_assets
      for select using (
        exists (
          select 1 from research_sessions s
          where s.id = product_assets.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_assets_insert_own') then
    create policy product_assets_insert_own on product_assets
      for insert with check (
        exists (
          select 1 from research_sessions s
          where s.id = product_assets.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'product_assets_delete_own') then
    create policy product_assets_delete_own on product_assets
      for delete using (
        exists (
          select 1 from research_sessions s
          where s.id = product_assets.session_id
            and s.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Triggers for updated_at

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'research_sessions_updated_at') then
    create trigger research_sessions_updated_at
    before update on research_sessions
    for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'product_candidates_updated_at') then
    create trigger product_candidates_updated_at
    before update on product_candidates
    for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'product_suppliers_updated_at') then
    create trigger product_suppliers_updated_at
    before update on product_suppliers
    for each row execute function set_updated_at();
  end if;
end $$;
