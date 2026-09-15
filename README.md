# Cuotafit

**SaaS de administración de gimnasios** para dueños de gimnasios pequeños y medianos de LATAM. Cuotafit resuelve los tres dolores centrales de un gimnasio: **socios y membresías**, **cobros y morosidad**, y **control de acceso** — con un panel simple, en español y multi‑gimnasio.

> Estado: **MVP funcional** en producción (Supabase). Auth, datos, control de acceso por PIN y panel de super‑admin andando end‑to‑end.

---

## Qué hace

| Módulo | Detalle |
|---|---|
| **Socios y membresías** | Alta/edición de socios, **PIN único** por socio, historial. Dos tipos de plan: **por tiempo** (mensual/trimestral, vence por fecha) y **por pases** (paquete de N entradas que se descuentan). |
| **Cobros y morosidad** | Registro de pagos (efectivo/transferencia/tarjeta), dashboard de socios por vencer / vencidos / con pocos pases, reporte de ingresos. |
| **Control de acceso por PIN** | Pantalla de **check‑in** tipo kiosco: el socio ingresa su PIN → verde "Acceso permitido" (con pases restantes o fecha de vencimiento), amarillo (por vencer / pocos pases) o rojo (vencido / sin pases). Cada check‑in **descuenta un pase** (si aplica) y **registra la asistencia del día**. |
| **Check‑in offline (PWA)** | La app es instalable y el kiosco funciona **sin internet**: valida contra un snapshot local, encola los check‑ins y los sincroniza al volver la conexión (`lib/offline.ts`, `public/sw.js`). |
| **Importación por CSV** | Alta masiva de socios desde `/socios` (columnas nombre/email/teléfono/plan; PIN único autogenerado). |
| **Asistencias** | Calendario mensual por socio y del gimnasio, derivado de los check‑ins. |
| **Planes** | Crear, editar y eliminar planes (por tiempo o por pases). |
| **Reportes** | Ingresos por mes y pagos recientes. |
| **Configuración** | Nombre del gimnasio, moneda, bloqueo de acceso a vencidos, modo claro/oscuro. |
| **Cuentas y suscripción** | Login real. Alta de gimnasios **solo desde el panel de super‑admin** (`/admin`): el dueño de la plataforma crea el gimnasio + su usuario + planes y controla sus credenciales. Cada gimnasio arranca con **7 días de prueba** y se **bloquea automáticamente** cuando vence la prueba o el período pago, hasta registrar el cobro. Multi‑tenant con aislamiento por RLS. |

---

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (con tokens de tema en `app/globals.css`)
- **Supabase**: Postgres + Auth + **Row Level Security** (`@supabase/ssr`, `@supabase/supabase-js`)
- Estado de UI en **React Context** (`lib/store.tsx`)

> ⚠️ **Nota de Next 16:** el antiguo `middleware.ts` ahora se llama **`proxy.ts`** (mismo propósito: refresca la sesión de Supabase en cada request). `cookies()` es asíncrono.

---

## Estructura

```
app/
  (app)/                  # rutas con sesión (layout = AppShell)
    dashboard/  socios/  socios/[id]/  asistencias/  planes/  reportes/  configuracion/
  login/                  # login (admins → /admin, gimnasios → /dashboard)
  admin/                  # panel de super‑admin (dueño de la plataforma)
  checkin/                # kiosco de check‑in (pantalla completa)
  actions/admin.ts        # Server Actions del panel (crear gimnasio, suscripción, credenciales)
  icon.svg                # favicon (isotipo Cuotafit)
  layout.tsx  globals.css  page.tsx
components/
  AppShell.tsx            # sidebar + guardia de sesión + modales
  Modals.tsx              # agregar socio / registrar pago / crear‑editar plan
  Logo.tsx                # LogoMark, LogoGlyph, Wordmark
lib/
  data.ts                 # tipos y helpers de negocio (estados, vencimientos, suscripción, calendario)
  store.tsx               # store global: carga y muta datos vía Supabase (+ cola offline)
  offline.ts              # snapshot local + cola de check‑ins para modo sin conexión
  theme.tsx               # modo claro/oscuro
  supabase/{client,server,admin}.ts
proxy.ts                  # refresco de sesión (ex‑middleware)
public/sw.js              # service worker (PWA / offline)
app/manifest.ts           # manifest de la PWA
supabase/
  migrations/0001_init.sql          # esquema multi‑tenant + RLS + auth_gym_id()
  migrations/0002_subscriptions.sql # estado de suscripción + paid_until por gimnasio
  seed.sql                          # gimnasio demo (10 socios, planes, pagos, check‑ins)
brand/                     # identidad de marca (tableros .dc.html de Claude Design)
```

### Modelo de datos (Supabase)

- `gyms` — el tenant (nombre, moneda, locale, bloquear vencidos).
- `profiles` — liga cada `auth.users` a un `gym_id` con rol `owner` | `staff`.
- `plans` — `type` `tiempo` | `pases` (+ duración o pases/vigencia), precio.
- `members` — socio + `pin` (único por gimnasio) + plan actual + vencimiento/pases.
- `payments` — pagos por socio.
- `checkins` — asistencias (base del calendario y de las métricas).

**Aislamiento multi‑tenant:** RLS restringe cada fila a `gym_id = auth_gym_id()`, donde `auth_gym_id()` resuelve el gimnasio del usuario autenticado desde `profiles`.

### Suscripción y bloqueo automático

Cada gimnasio tiene en `gyms` un `subscription_status` (`trial` | `active` | `suspended`) y un `paid_until` (fecha):

- Al crearlo desde el panel arranca en **`trial` con `paid_until` = hoy + 7 días**.
- La app calcula el bloqueo sola (`subscriptionGate` en `lib/data.ts`): se corta el acceso — tanto el panel del gimnasio como el kiosco de check‑in — si el admin lo **suspendió** manualmente, **o** si `paid_until` ya pasó (prueba o período pago vencido). `paid_until` es inclusivo: el día del vencimiento todavía tiene acceso.
- No hace falta ningún cron: el bloqueo se evalúa al cargar la app. Desde `/admin`, **"Marcar pagado +30d"** pone `active` y corre `paid_until` 30 días; **"Suspender"** corta al instante.

---

## Puesta en marcha

### 1. Requisitos
- Node.js 20+ y npm
- Un proyecto de [Supabase](https://supabase.com)

### 2. Variables de entorno
Crear `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SECRET_KEY=<secret key>   # solo servidor; nunca se commitea
```

> `.env.local` está en `.gitignore`. La `SUPABASE_SECRET_KEY` da acceso total (salta RLS) y solo se usa del lado servidor (panel de super‑admin). No la expongas. `PLATFORM_ADMIN_EMAILS` define qué emails acceden a `/admin`.

### 3. Base de datos
En el **SQL Editor** de Supabase, ejecutar en orden:
1. `supabase/migrations/0001_init.sql` (esquema + RLS)
2. `supabase/migrations/0002_subscriptions.sql` (suscripción + `paid_until`)
3. `supabase/seed.sql` (datos demo — opcional)

Los gimnasios se crean **desde el panel de super‑admin** (`/admin` → "Crear gimnasio"): eso arma el usuario dueño, el gimnasio y sus planes, y devuelve las credenciales. (También se puede hacer a mano en Supabase creando el usuario en **Authentication → Users** e insertando su fila en `profiles`.)

### 4. Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
```
Rutas: `/login`, el panel del gimnasio en `/dashboard`, y el panel de super‑admin en `/admin`.

### 5. Producción
```bash
npm run build
npm run start
```

---

## Deploy (Vercel)

1. Importar el repo en [vercel.com/new](https://vercel.com/new) (Vercel detecta Next.js).
2. Cargar las 3 variables de entorno de arriba en **Settings → Environment Variables**.
3. Deploy. Cada push a `main` redeploya.

---

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | ESLint |

---

## Marca

Nombre e identidad: **Cuotafit** (cuota + fit). Isotipo "C · Ciclo" (la C es un anillo — el ciclo de la cuota — con la F adentro), azul `#2563EB`, tipografía Plus Jakarta Sans. Los tableros de identidad están en `brand/` (Claude Design).

---

## Seguridad

- Datos aislados por **RLS** por gimnasio; una consulta sin sesión devuelve 0 filas.
- La clave secreta de Supabase vive solo en `.env.local` / variables de Vercel, nunca en el repo.
- La creación de gimnasios y el manejo de credenciales corren en **Server Actions** gateados por `PLATFORM_ADMIN_EMAILS` (la clave secreta nunca llega al navegador).

---

## Roadmap

- [x] Check‑in offline (PWA) e importación de socios por CSV
- [x] Prueba de 7 días + bloqueo automático de la cuenta por falta de pago
- [x] Wordmark del logo vectorizado a curvas (`brand/`)
- [ ] Recordatorios automáticos de vencimiento (email / WhatsApp)
- [ ] Roles: invitar recepcionistas (staff) al gimnasio
- [ ] Débito automático recurrente (pasarela de pago)
- [ ] App para socios / reserva de clases
