-- Consumo de pase atómico para el check-in.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 0003_security_hardening.sql.
-- Antes el cliente leía passes_left y escribía passes_left-1 (read-modify-write): dos
-- kioscos podían leer el mismo valor y descontar un solo pase dos veces. Esta función
-- descuenta en un único UPDATE atómico y nunca baja de 0.
-- SECURITY INVOKER (por defecto): corre con los permisos del usuario, así que RLS sigue
-- limitando el UPDATE a socios del propio gimnasio; el filtro por auth_gym_id() es
-- defensa extra.
create or replace function public.consume_pass(p_member_id uuid)
returns integer
language sql
volatile
as $$
  update public.members
     set passes_left = greatest(0, coalesce(passes_left, 0) - 1)
   where id = p_member_id
     and gym_id = public.auth_gym_id()
  returning passes_left;
$$;

grant execute on function public.consume_pass(uuid) to authenticated;
