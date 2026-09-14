# Cuotafit

**SaaS de administración de gimnasios** para dueños de gimnasios pequeños y medianos de LATAM. Cuotafit resuelve los tres dolores centrales de un gimnasio: **socios y membresías**, **cobros y morosidad**, y **control de acceso** — con un panel simple, en español y multi‑gimnasio.

> Estado: **MVP funcional** con backend real (Supabase). Auth, datos, control de acceso por PIN y registro self‑serve andando end‑to‑end.

---

## Qué hace

| Módulo | Detalle |
|---|---|
| **Socios y membresías** | Alta/edición de socios, **PIN único** por socio, historial. Dos tipos de plan: **por tiempo** (mensual/trimestral, vence por fecha) y **por pases** (paquete de N entradas que se descuentan). |
| **Cobros y morosidad** | Registro de pagos (efectivo/transferencia/tarjeta), dashboard de socios por vencer / vencidos / con pocos pases, reporte de ingresos. |
| **Control de acceso por PIN** | Pantalla de **check‑in** tipo kiosco: el socio ingresa su PIN → verde "Acceso permitido" (con pases restantes o fecha de vencimiento), amarillo (por vencer / pocos pases) o rojo (vencido / sin pases). Cada check‑in **descuenta un pase** (si aplica) y **registra la asistencia del día**. |
| **Asistencias** | Calendario mensual por socio y del gimnasio, derivado de los check‑ins. |
| **Planes** | Crear, editar y eliminar planes (por tiempo o por pases). |
| **Reportes** | Ingresos por mes y pagos recientes. |
| **Configuración** | Nombre del gimnasio, moneda, bloqueo de acceso a vencidos, modo claro/oscuro. |
| **Cuentas** | Login real y **registro self‑serve** (crea gimnasio + owner + planes por defecto). Multi‑tenant con aislamiento por RLS. |

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
  login/  registro/       # auth
  checkin/                # kiosco de check‑in (pantalla completa)
  actions/auth.ts         # Server Action: registro self‑serve (service role)
  icon.svg                # favicon (isotipo Cuotafit)
  layout.tsx  globals.css  page.tsx
components/
  AppShell.tsx            # sidebar + guardia de sesión + modales
  Modals.tsx              # agregar socio / registrar pago / crear‑editar plan
  Logo.tsx                # LogoMark, LogoGlyph, Wordmark
lib/
  data.ts                 # tipos y helpers de negocio (estados, vencimientos, calendario)
  store.tsx               # store global: carga y muta datos vía Supabase
  theme.tsx               # modo claro/oscuro
  supabase/{client,server,admin}.ts
proxy.ts                  # refresco de sesión (ex‑middleware)
supabase/
  migrations/0001_init.sql # esquema multi‑tenant + RLS + auth_gym_id()
  seed.sql                 # gimnasio demo (10 socios, planes, pagos, check‑ins)
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

> `.env.local` está en `.gitignore`. La `SUPABASE_SECRET_KEY` da acceso total (salta RLS) y solo se usa del lado servidor (registro self‑serve). No la expongas.

### 3. Base de datos
En el **SQL Editor** de Supabase, ejecutar en orden:
1. `supabase/migrations/0001_init.sql` (esquema + RLS)
2. `supabase/seed.sql` (datos demo — opcional)

Para vincular un login a un gimnasio: crear el usuario en **Authentication → Users** y luego insertar su fila en `profiles` (`id`, `gym_id`, `role='owner'`). El **registro self‑serve** (`/registro`) hace todo esto automáticamente.

### 4. Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
```
Rutas: `/registro` (crear cuenta), `/login`, y el panel en `/dashboard`.

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
- El registro self‑serve corre en un **Server Action** (la clave secreta nunca llega al navegador).

---

## Roadmap

- [ ] Recordatorios automáticos de vencimiento (email / WhatsApp)
- [ ] Roles: invitar recepcionistas (staff) al gimnasio
- [ ] Débito automático recurrente (pasarela de pago)
- [ ] App para socios / reserva de clases
- [ ] Vectorizar el wordmark del logo para producción
