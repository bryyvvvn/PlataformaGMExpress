# Plataforma GM Express

Sistema de gestión de pedidos de colaciones para **GM Express** y sus empresas clientes. Los trabajadores eligen su almuerzo o cena desde una app móvil, los representantes de cada empresa consolidan la planilla de su equipo y el equipo de GM Express planifica menús, controla la producción y factura desde un panel web.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)

---

## Contenido

- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Tareas programadas](#tareas-programadas)
- [Despliegue](#despliegue)
- [Documentación técnica](#documentación-técnica)
- [Estado del proyecto](#estado-del-proyecto)

---

## Funcionalidades

### Panel administrativo (web, rol `ADMIN`)

| Módulo | Qué permite |
| --- | --- |
| **Dashboard** | KPIs del día y la semana, carga por zona de cocina (fría, caliente, empaque), tendencia de pedidos y descarga de PDFs de cocina, packing y cenas |
| **Planificador** | Carga de la minuta semanal en Excel y definición del *Menú del Día* por fecha |
| **Gestión de Pedidos** | Consolidado semanal por empresa, hora límite global, pedidos manuales y exportación de la planilla de producción (Excel) |
| **Facturación** | Resumen de pedidos por empresa y rango de fechas |
| **Empresas Clientes** | Alta y edición de empresas, sucursales, contactos y convenios |
| **Usuarios de App** | Alta de trabajadores y representantes (cuenta Clerk incluida) y edición de rol y empresa |

### App móvil (Android)

| Rol | Qué permite |
| --- | --- |
| **Trabajador** | Elegir su colación por día antes de la hora límite (Menú del Día o armado personalizado, combos, colación premium, fin de semana y cena según convenio), modificarla y revisar su historial. Recibe recordatorios push |
| **Representante** | Ver la planilla semanal de su empresa, vincular trabajadores por RUT, bloquear días, asignar menús manualmente y enviar la planilla a GM Express |

### Automatizaciones

- Recordatorio push a quien no ha pedido.
- Confirmación automática de pedidos pendientes minutos antes del cierre de cada empresa.
- Asignación automática del Menú del Día a quien no pidió.
- Aviso por correo a GM Express cuando un representante envía su planilla.

---

## Arquitectura

```
 Panel web (ADMIN)      App móvil Android        Programador de tareas
         │               (Capacitor + React)       (GET /api/cron/*)
         │                       │                         │
         └───────────────────────┼─────────────────────────┘
                                 ▼
              ┌──────────────────────────────────────┐
              │  web/  ·  Next.js 16 (App Router)    │
              │  proxy.ts → sesión Clerk y CORS      │
              │  app/(admin)  → panel administrativo │
              │  app/api      → API REST (41 rutas)  │
              │  lib/         → reglas de negocio    │
              └──────────────────────────────────────┘
                │            │            │           │
                ▼            ▼            ▼           ▼
           PostgreSQL      Clerk     Firebase FCM   Gmail SMTP
           (Prisma)     (identidad)    (push)       (avisos)
```

- **Una sola aplicación Next.js** sirve el panel y la API que consume la app móvil.
- **Clerk** gestiona identidad y sesiones; la tabla `Usuario` replica cada cuenta y define rol y empresa.
- **Todas las reglas de horario** se calculan en zona horaria `America/Santiago`.

| Capa | Tecnología |
| --- | --- |
| Web y API | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Datos | PostgreSQL + Prisma 5 |
| Autenticación | Clerk |
| Móvil | React 19 + Vite 8 + Capacitor 8 (Android) |
| Notificaciones | Firebase Cloud Messaging (`firebase-admin`) |
| Reportes | ExcelJS / SheetJS (Excel), jsPDF (PDF) |
| Validación y pruebas | Zod, Vitest |

---

## Estructura del repositorio

```
PlataformaGMExpress/
├── web/                     Panel administrativo + API (Next.js)
│   ├── app/(admin)/         Páginas del panel
│   ├── app/api/             Endpoints: admin, trabajador, representante, usuarios, cron, webhooks
│   ├── components/          Componentes del panel y primitivas UI
│   ├── hooks/               Hooks cliente del panel
│   ├── lib/                 Lógica de dominio (horario, minuta, pedidos, consolidados, Excel)
│   ├── prisma/              Esquema, migraciones y seeds
│   ├── scripts/             Utilidades de mantenimiento
│   ├── __tests__/           Pruebas unitarias (Vitest)
│   └── proxy.ts             Middleware de autenticación (Clerk) y CORS
└── appmovil/                App móvil (React + Vite + Capacitor)
    ├── src/pages/           Pantallas por rol
    ├── src/hooks/           Un hook por endpoint de la API
    ├── src/constants/       URL de la API, tema y configuración de Clerk
    └── android/             Proyecto Android nativo
```

---

## Requisitos

- **Node.js 20.9+** y npm 10+
- **PostgreSQL** (local, Docker o servicio administrado)
- Una aplicación en **Clerk**
- Opcional: proyecto **Firebase** (push), cuenta **Gmail** con contraseña de aplicación (correos)
- Para compilar Android: **Android Studio**, **JDK 21** y **Android SDK 36**

---

## Inicio rápido

### 1. Backend y panel (`web/`)

```bash
cd web
npm ci                  # instala las dependencias exactas del lockfile
cp .env.example .env    # o crea .env con las variables de la sección siguiente
npx prisma generate     # genera el cliente de Prisma
npx prisma db push      # crea las tablas en una base vacía (ver nota)
npm run dev             # http://localhost:3000
```

> **Nota sobre migraciones:** el historial de `prisma/migrations` no incluye una migración inicial, por lo que `prisma migrate deploy` falla sobre una base vacía. Usa `prisma db push` para una base nueva. El manual técnico explica cómo crear una migración base.

### 2. Datos mínimos

Antes de usar el sistema, crea en la base:

1. Cuatro platos con categoría `FONDO` y nombres exactos: `Menú del Día`, `Hipocalórico`, `Vegetariano` y `Colación` (se usan en pedidos de fin de semana, cena y asignaciones manuales).
2. Un usuario administrador: registra la cuenta en Clerk y cambia su `rol` a `ADMIN` en la tabla `Usuario` (por ejemplo con `npx prisma studio`).

### 3. App móvil (`appmovil/`)

```bash
cd appmovil
npm ci
echo 'VITE_CLERK_PUBLISHABLE_KEY="pk_test_xxx"' > .env.local
npm run dev             # http://localhost:5173
```

La URL del backend está definida en `appmovil/src/constants/api.ts` (`API_BASE_URL`). Para desarrollo local, apúntala a la IP de tu máquina (por ejemplo `http://192.168.1.25:3000`) y agrega esa IP a `allowedDevOrigins` en `web/next.config.ts`.

### 4. Compilar Android

```bash
cd appmovil
npm run build           # genera dist/
npx cap sync android    # copia dist/ y sincroniza plugins nativos
npx cap open android    # abre Android Studio para compilar o firmar
```

Para notificaciones push, coloca el `google-services.json` del proyecto Firebase en `appmovil/android/app/`.

---

## Variables de entorno

### `web/.env`

| Variable | Requerida | Descripción |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | Conexión PostgreSQL usada por la aplicación |
| `DIRECT_URL` | ✅ | Conexión directa (sin pooler) para Prisma; en local puede ser igual a `DATABASE_URL` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clave pública de Clerk |
| `CLERK_SECRET_KEY` | ✅ | Clave secreta de Clerk |
| `CLERK_WEBHOOK_SECRET` | ⚠️ | Secreto del webhook `/api/webhooks/clerk` |
| `CRON_SECRET` | ⚠️ | Secreto que deben enviar las tareas programadas |
| `NEXT_PUBLIC_APP_URL` | ⚠️ | URL pública de la app (precarga de caché del menú) |
| `FIREBASE_PROJECT_ID` | Push | ID del proyecto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Push | Correo de la cuenta de servicio |
| `FIREBASE_PRIVATE_KEY` | Push | Clave privada de la cuenta de servicio (`\n` escapados) |
| `EMAIL_USER` | Correo | Cuenta Gmail remitente |
| `EMAIL_PASS` | Correo | Contraseña de aplicación de Gmail |
| `ADMIN_EMAIL` | Correo | Destinatario de los avisos de planilla |

✅ obligatoria · ⚠️ obligatoria en producción

### `appmovil/.env.local`

| Variable | Descripción |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk (la misma del backend) |

---

## Scripts disponibles

### `web/`

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Webpack) |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (requiere `npx prisma generate` previo) |
| `npm run test:coverage` | Pruebas con cobertura |
| `npx prisma studio` | Editor visual de la base de datos |

### `appmovil/`

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo expuesto en la red local |
| `npm run build` | Compilación web para Capacitor |
| `npm run lint` | ESLint |

---

## Tareas programadas

Endpoints `GET` que un programador externo debe invocar con `?secret=<CRON_SECRET>`:

| Endpoint | Función | Frecuencia sugerida |
| --- | --- | --- |
| `/api/cron/recordatorio` | Push a quienes aún no piden | Diaria, en la mañana |
| `/api/cron/auto-confirmar` | Confirma pendientes 5–10 min antes del cierre de cada empresa | Cada 5 min en horario hábil |
| `/api/cron/auto-asignar` | Asigna el Menú del Día a quien no pidió, al cierre | Cada 15 min (:00, :15, :30, :45) |
| `/api/cron/primera-carga-menu` | Precalienta la caché del menú semanal | Lunes temprano y tras cada despliegue |

---

## Despliegue

Producción corre en **Railway** con el dominio `admin.gmexpress.cl`. Configuración recomendada del servicio:

| Parámetro | Valor |
| --- | --- |
| Directorio raíz | `web` |
| Build | `npm ci && npx prisma generate && npm run build` |
| Start | `npm run start` |
| Instancias | 1 (la caché del menú vive en memoria) |

Además: webhook de Clerk apuntando a `/api/webhooks/clerk` (eventos `user.*`), las cuatro tareas programadas activas y el dominio autorizado en la instancia de Clerk de producción.

---

## Documentación técnica

El **Manual Técnico de la Plataforma GM Express** detalla el modelo de datos, la autenticación por rol, las reglas de negocio (hora límite, convenios, estados del pedido, carga de minutas), la referencia completa de la API, la operación en producción y las limitaciones conocidas con sus recomendaciones.

---

## Estado del proyecto

Versión funcional en producción (`main`, julio 2026). Antes de una nueva etapa de desarrollo se recomienda abordar los puntos de prioridad alta del manual técnico (sección 16): control de acceso en dos endpoints públicos y en la acción de facturación, y la creación de una migración base de la base de datos.

### Equipo de desarrollo

- Bryan Carvajal Castillo
- Javier Pizarro Fleming
- Matías Gutiérrez Paz

---

© 2026 Plataforma GM Express. Código propietario; todos los derechos reservados.
