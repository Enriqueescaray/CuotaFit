-- Estado de suscripción por gimnasio, para el panel de administración del dueño de Cuotafit.
-- Ejecutar en el SQL Editor de Supabase (después de 0001_init.sql).

alter table public.gyms
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'suspended')),
  add column if not exists paid_until date,
  add column if not exists saas_notes text;

-- Los gimnasios existentes quedan como 'trial' (no bloqueados). El panel de admin
-- los pasa a 'active' cuando pagan, o 'suspended' cuando dejan de pagar.
