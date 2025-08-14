-- Create training plan tables
-- ensure pgcrypto extension
create extension if not exists pgcrypto;

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Table training_plans
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  title text,
  total_estimated_minutes integer not null default 0 check (total_estimated_minutes >= 0),
  status text not null default 'active' check (status in ('draft','active','completed','aborted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index if not exists idx_training_plans_user_date on public.training_plans (user_id, plan_date);

create trigger trg_training_plans_set_updated_at
before update on public.training_plans
for each row execute function public.set_updated_at();

-- Table training_plan_items
create table if not exists public.training_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete restrict,
  order_index integer not null default 0,
  category_slug text,
  sets_total integer not null default 1 check (sets_total >= 1),
  sets_completed integer not null default 0 check (sets_completed >= 0),
  rest_seconds integer not null default 30 check (rest_seconds >= 0),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_sets_completed_lte_total check (sets_completed <= sets_total)
);

create index if not exists idx_training_plan_items_plan on public.training_plan_items (plan_id);
create index if not exists idx_training_plan_items_plan_order on public.training_plan_items (plan_id, order_index);
create index if not exists idx_training_plan_items_video on public.training_plan_items (video_id);

create trigger trg_training_plan_items_set_updated_at
before update on public.training_plan_items
for each row execute function public.set_updated_at();

-- RLS
alter table public.training_plans enable row level security;
alter table public.training_plan_items enable row level security;

-- Policies for training_plans
drop policy if exists "tp_select_own" on public.training_plans;
create policy "tp_select_own"
on public.training_plans
for select
using (user_id = auth.uid());

drop policy if exists "tp_insert_own" on public.training_plans;
create policy "tp_insert_own"
on public.training_plans
for insert
with check (user_id = auth.uid());

drop policy if exists "tp_update_own" on public.training_plans;
create policy "tp_update_own"
on public.training_plans
for update
using (user_id = auth.uid());

drop policy if exists "tp_delete_own" on public.training_plans;
create policy "tp_delete_own"
on public.training_plans
for delete
using (user_id = auth.uid());

-- Policies for training_plan_items based on parent ownership
drop policy if exists "tpi_select_by_owner" on public.training_plan_items;
create policy "tpi_select_by_owner"
on public.training_plan_items
for select
using (
  exists (
    select 1 from public.training_plans p
    where p.id = training_plan_items.plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "tpi_insert_by_owner" on public.training_plan_items;
create policy "tpi_insert_by_owner"
on public.training_plan_items
for insert
with check (
  exists (
    select 1 from public.training_plans p
    where p.id = training_plan_items.plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "tpi_update_by_owner" on public.training_plan_items;
create policy "tpi_update_by_owner"
on public.training_plan_items
for update
using (
  exists (
    select 1 from public.training_plans p
    where p.id = training_plan_items.plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "tpi_delete_by_owner" on public.training_plan_items;
create policy "tpi_delete_by_owner"
on public.training_plan_items
for delete
using (
  exists (
    select 1 from public.training_plans p
    where p.id = training_plan_items.plan_id
      and p.user_id = auth.uid()
  )
);

-- Optional: further constraints or RPCs can be added later.