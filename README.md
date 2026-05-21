# Ideas, LLC — Web (Next.js + Prisma + i18n)

Recreación de [printingideaspr.com](https://printingideaspr.com) con backend, panel de administración y diseño moderno.

## Stack

- **Next.js 15** (App Router, React 19) + **TypeScript**
- **TailwindCSS v4** + animaciones con **Framer Motion**
- **Prisma + SQLite** (cambia a Postgres/MySQL editando `prisma/schema.prisma`)
- **NextAuth (Auth.js v5)** con credenciales + bcrypt
- **next-intl** para multi-idioma (Español / English)
- **Nodemailer** para notificación de cotizaciones por email
- **Zod** para validación de inputs
- Subida de imágenes a `/public/uploads`

## Funcionalidades

### Sitio público
- Home con hero animado, contadores, grid de servicios y showcase de proyectos
- Páginas: `/servicios`, `/proyectos`, `/nosotros`, `/cotizacion`
- Selector de idioma ES / EN (rutas `/es/...` y `/en/...`)
- Formulario de cotización que guarda en BD y envía email

### Panel admin (`/es/admin`)
- Dashboard con KPIs y últimas cotizaciones
- CRUD de **Servicios** (slug, títulos ES/EN, descripciones, ícono, orden, estado)
- CRUD de **Proyectos** (slug, categoría, portada, destacado)
- Gestión de **Cotizaciones** (cambiar estado, eliminar, ver detalle)
- Subida de imágenes con validación de tipo y tamaño
- Autenticación protegida (server-side)

## Setup local

```bash
npm install
cp .env.example .env   # ya hay un .env por defecto para desarrollo
npm run db:push
npm run db:seed        # crea admin + servicios y proyectos demo
npm run dev
```

Visita http://localhost:3000

**Credenciales por defecto** (cámbialas en producción):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@printingideaspr.com` | `admin123` |
| Empleado | `empleado@printingideaspr.com` | `empleado123` |
| Cliente | `cliente@printingideaspr.com` | `cliente123` |

## Email (cotizaciones)

Configura SMTP en `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=app-password
SMTP_FROM="Ideas PR <noreply@printingideaspr.com>"
SMTP_TO=ventas@printingideaspr.com
```

Si no se configura, las cotizaciones se guardan en BD igualmente (se ven en `/admin/cotizaciones`).

## Despliegue

### Recomendado: Vercel (gratis, 1 click)
1. Sube el repo a GitHub
2. Conecta a Vercel
3. Cambia `DATABASE_URL` a Postgres (Vercel Postgres / Neon / Supabase) y en `schema.prisma` pon `provider = "postgresql"`
4. Define todas las variables de `.env.example`

### VPS / Docker
```bash
npm run build
node .next/standalone/server.js
```

### Hosting compartido
Hosting compartido típico (cPanel, sin Node.js) **no soporta Next.js**. Necesitas como mínimo un plan con Node.js o un VPS pequeño ($5/mes en Hetzner/DigitalOcean). Si tu hosting tiene Node.js, sube `.next/standalone/`, `.next/static/` y `public/`, y arranca `node server.js`.

## Estructura

```
src/
  app/
    [locale]/                # rutas públicas i18n
      page.tsx               # home
      servicios/
      proyectos/
      nosotros/
      cotizacion/
      login/
      admin/
        page.tsx             # dashboard
        cotizaciones/
        servicios/
        proyectos/
    api/
      auth/[...nextauth]/    # NextAuth
      cotizaciones/          # POST público + GET/PATCH/DELETE admin
      servicios/             # GET público + CRUD admin
      proyectos/             # GET público + CRUD admin
      upload/                # POST imágenes (admin)
  components/                # Hero, Stats, ServicesGrid, etc.
  lib/                       # prisma, mailer
  i18n/                      # config next-intl
  auth.ts                    # NextAuth config
  middleware.ts              # i18n routing
prisma/
  schema.prisma
  seed.ts
messages/
  es.json
  en.json
```

## Seguridad

- Passwords con bcrypt
- Validación zod en todas las entradas
- Subida de imágenes con whitelist MIME y límite 8MB
- Rutas admin protegidas server-side (`auth()` en layout y APIs)
- Cambia `AUTH_SECRET` en producción: `openssl rand -base64 32`
