-- GymControl — esquema inicial multi-tenant con RLS.
-- Ejecutar en Supabase (SQL Editor) una sola vez.
-- Modelo: cada usuario (auth.users) pertenece a UN gimnasio vía profiles.gym_id.
-- El aislamiento entre gimnasios lo garantiza RLS: cada fila solo es visible/
-- editable por usuarios cuyo gym_id coincide con el de la fila.

-- ---------- Tablas ----------

create table if not exists public.gyms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  currency      text not null default 'MXN',
  locale        text not null default 'es-MX',
  block_expired boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Perfil de cada usuario: lo liga a su gimnasio y define su rol.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  gym_id     uuid references public.gyms(id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner','staff')),
  name       text,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  type          text not null check (type in ('tiempo','pases')),
  name          text not null,
  duration_months int,        -- para planes por tiempo
  pass_count    int,          -- para planes por pases
  validity_days int,          -- para planes por pases
  price         numeric not null default 0,
  archived      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  pin          text not null,
  plan_type    text check (plan_type in ('tiempo','pases')),
  plan_name    text,
  due_date     date,          -- para planes por tiempo
  passes_total int,           -- para planes por pases
  passes_left  int,           -- para planes por pases
  created_at   timestamptz not null default now(),
  unique (gym_id, pin)        -- PIN único dentro de cada gimnasio
);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references public.gyms(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  amount     numeric not null,
  method     text not null check (method in ('Efectivo','Transferencia','Tarjeta')),
  plan_name  text,
  paid_at    date not null default current_date,
  created_at timestamptz not null default now()
);

-- Cada asistencia (check-in) queda registrada aquí; el calendario se deriva de esta tabla.
create table if not exists public.checkins (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  member_id     uuid not null references public.members(id) on delete cascade,
  checked_at    timestamptz not null default now(),
  result        text not null default 'permitido' check (result in ('permitido','denegado')),
  pass_consumed boolean not null default false
);

create index if not exists idx_members_gym    on public.members(gym_id);
create index if not exists idx_plans_gym      on public.plans(gym_id);
create index if not exists idx_payments_gym   on public.payments(gym_id, paid_at desc);
create index if not exists idx_checkins_gym   on public.checkins(gym_id, checked_at);
create index if not exists idx_checkins_member on public.checkins(member_id);

-- ---------- Helper: gym_id del usuario actual ----------
-- SECURITY DEFINER para poder leer profiles sin recursión de RLS.
create or replace function public.auth_gym_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gym_id from public.profiles where id = auth.uid()
$$;

-- ---------- RLS ----------
alter table public.gyms     enable row level security;
alter table public.profiles enable row level security;
alter table public.plans    enable row level security;
alter table public.members  enable row level security;
alter table public.payments enable row level security;
alter table public.checkins enable row level security;

-- Perfil propio (lectura/actualización).
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Gimnasio propio.
drop policy if exists "own gym read"   on public.gyms;
drop policy if exists "own gym update" on public.gyms;
create policy "own gym read"   on public.gyms for select using (id = public.auth_gym_id());
create policy "own gym update" on public.gyms for update using (id = public.auth_gym_id()) with check (id = public.auth_gym_id());

-- Datos del gimnasio: acceso completo solo dentro del gym del usuario.
drop policy if exists "plans in gym"    on public.plans;
drop policy if exists "members in gym"  on public.members;
drop policy if exists "payments in gym" on public.payments;
drop policy if exists "checkins in gym" on public.checkins;
create policy "plans in gym"    on public.plans    for all using (gym_id = public.auth_gym_id()) with check (gym_id = public.auth_gym_id());
create policy "members in gym"  on public.members  for all using (gym_id = public.auth_gym_id()) with check (gym_id = public.auth_gym_id());
create policy "payments in gym" on public.payments for all using (gym_id = public.auth_gym_id()) with check (gym_id = public.auth_gym_id());
create policy "checkins in gym" on public.checkins for all using (gym_id = public.auth_gym_id()) with check (gym_id = public.auth_gym_id());
