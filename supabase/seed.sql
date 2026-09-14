-- GymControl — datos de demostración.
-- Ejecutar DESPUÉS de 0001_init.sql, en el SQL Editor de Supabase.
-- Crea un gimnasio demo con planes, 10 socios, pagos y asistencias (Septiembre 2026).
-- Idempotente: se puede re-ejecutar sin duplicar (usa IDs fijos + ON CONFLICT).

-- Gimnasio demo
insert into public.gyms (id, name, currency, locale, block_expired) values
  ('11111111-1111-1111-1111-111111111111', 'Gimnasio Demo', 'MXN', 'es-MX', true)
on conflict (id) do nothing;

-- Planes
insert into public.plans (id, gym_id, type, name, duration_months, pass_count, validity_days, price) values
  ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','tiempo','Mensual',1,null,null,600),
  ('b0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','tiempo','Trimestral',3,null,null,1600),
  ('b0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','tiempo','Anual',12,null,null,5500),
  ('b0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','pases','Pack 8 clases',null,8,30,700),
  ('b0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','pases','Pack 10 clases',null,10,30,850),
  ('b0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','pases','Pack 20 clases',null,20,60,1500)
on conflict (id) do nothing;

-- Socios
insert into public.members (id, gym_id, name, email, phone, pin, plan_type, plan_name, due_date, passes_total, passes_left) values
  ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Lucía Fernández','lucia.fernandez@mail.com','+52 55 2233 4455','4821','tiempo','Mensual','2026-09-25',null,null),
  ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Martín Gómez','martin.gomez@mail.com','+52 55 3344 5566','3092','tiempo','Mensual','2026-09-15',null,null),
  ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Sofía Ramírez','sofia.ramirez@mail.com','+52 55 4455 6677','7714','tiempo','Mensual','2026-09-05',null,null),
  ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Nicolás Torres','nicolas.torres@mail.com','+52 55 5566 7788','5533','pases','Pack 10 clases',null,10,6),
  ('a0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Valentina Ríos','valentina.rios@mail.com','+52 55 6677 8899','9021','pases','Pack 8 clases',null,8,1),
  ('a0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Emiliano Castro','emiliano.castro@mail.com','+52 55 7788 9900','1187','pases','Pack 10 clases',null,10,0),
  ('a0000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Camila Ortiz','camila.ortiz@mail.com','+52 55 8899 0011','6640','tiempo','Trimestral','2026-11-01',null,null),
  ('a0000000-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','Bruno Acosta','bruno.acosta@mail.com','+52 55 9900 1122','2456','tiempo','Mensual','2026-09-14',null,null),
  ('a0000000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','Julieta Medina','julieta.medina@mail.com','+52 55 0011 2233','8809','pases','Pack 10 clases',null,10,10),
  ('a0000000-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','Federico Suárez','federico.suarez@mail.com','+52 55 1122 3344','4470','tiempo','Mensual','2026-08-30',null,null)
on conflict (id) do nothing;

-- Pagos
insert into public.payments (id, gym_id, member_id, amount, method, plan_name, paid_at) values
  ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001',600,'Transferencia','Mensual','2026-08-25'),
  ('c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002',600,'Efectivo','Mensual','2026-08-15'),
  ('c0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003',600,'Tarjeta','Mensual','2026-08-05'),
  ('c0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000004',850,'Efectivo','Pack 10 clases','2026-09-01'),
  ('c0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000005',700,'Transferencia','Pack 8 clases','2026-08-28'),
  ('c0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000006',850,'Tarjeta','Pack 10 clases','2026-08-01'),
  ('c0000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000007',1600,'Transferencia','Trimestral','2026-08-01'),
  ('c0000000-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000008',600,'Efectivo','Mensual','2026-08-14'),
  ('c0000000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000009',850,'Tarjeta','Pack 10 clases','2026-09-10'),
  ('c0000000-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000010',600,'Efectivo','Mensual','2026-07-30')
on conflict (id) do nothing;

-- Asistencias (check-ins) de Septiembre 2026. pass_consumed = true en planes por pases.
do $$
declare
  g uuid := '11111111-1111-1111-1111-111111111111';
begin
  if not exists (select 1 from public.checkins where gym_id = g) then
    insert into public.checkins (gym_id, member_id, checked_at, result, pass_consumed)
    select g, m.mid, (date '2026-09-01' + (d - 1))::timestamptz, 'permitido', m.consume
    from (values
      ('a0000000-0000-0000-0000-000000000001'::uuid, array[1,2,4,5,8,9,11,12], false),
      ('a0000000-0000-0000-0000-000000000002'::uuid, array[1,3,6,7,10],        false),
      ('a0000000-0000-0000-0000-000000000003'::uuid, array[1,2,3],             false),
      ('a0000000-0000-0000-0000-000000000004'::uuid, array[1,3,4,8,9,10,13],   true),
      ('a0000000-0000-0000-0000-000000000005'::uuid, array[2,4,5,7,9,10,11],   true),
      ('a0000000-0000-0000-0000-000000000006'::uuid, array[1,2,3,4,5,6,7,8,9,10], true),
      ('a0000000-0000-0000-0000-000000000007'::uuid, array[1,2,5,8,9],         false),
      ('a0000000-0000-0000-0000-000000000008'::uuid, array[1,3,5,7,9,11,13],   false),
      ('a0000000-0000-0000-0000-000000000010'::uuid, array[1,2,3,4],           false)
    ) as m(mid, days, consume),
    lateral unnest(m.days) as d;
  end if;
end $$;
