-- Endurecimiento de RLS (auditoría de seguridad).
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 0002_subscriptions.sql.
-- Cierra dos vías de abuso reales: como todo el acceso a datos se hace desde el
-- navegador con la anon key, RLS es la ÚNICA frontera de seguridad.

-- ---------- 1) profiles: el cliente NO puede editar su perfil ----------
-- La política anterior ("own profile update") permitía a cualquier usuario cambiar
-- su propio profiles.gym_id o role vía la API pública. Cambiar gym_id lo movía a OTRO
-- gimnasio y le daba acceso total a los datos de ese gimnasio (fuga entre inquilinos);
-- cambiar role a 'owner' era una escalada de privilegios.
-- El alta/edición de perfiles ya se hace SOLO desde Server Actions con la service role
-- (que salta RLS), así que el cliente no necesita UPDATE. Sin política de UPDATE, RLS
-- deniega por defecto cualquier update de perfil desde la anon key.
drop policy if exists "own profile update" on public.profiles;

-- ---------- 2) gyms: el dueño edita su gimnasio, NO su suscripción ----------
-- La política "own gym update" no restringía columnas, así que un dueño podía marcar
-- su propio gimnasio como 'active' o estirar paid_until y saltarse el bloqueo por
-- trial/pago vencido (bypass del cobro del SaaS). RLS no puede comparar contra los
-- valores viejos de la fila, así que restringimos por privilegios de columna: la
-- política de fila sigue vigente (solo su propio gym) y ahora authenticated solo puede
-- escribir columnas de configuración. La suscripción (subscription_status, paid_until,
-- saas_notes) queda reservada a la service role, que se usa desde el panel /admin.
revoke update on public.gyms from authenticated;
grant  update (name, currency, locale, block_expired) on public.gyms to authenticated;
