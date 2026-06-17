# Helpdesk — Sistema de Tickets de Soporte

Sistema completo de tickets de soporte técnico con autenticación, roles (CLIENT/AGENT/ADMIN), máquina de estados para tickets, SLA tracking, y notificaciones por email.

## Funcionalidades

- **Autenticación**: Login con credenciales o Google OAuth, registro de usuarios, recuperación de contraseña por email
- **Roles**: CLIENT (crea y sigue sus tickets), AGENT (gestiona tickets asignados), ADMIN (administra usuarios y categorías)
- **Tickets**: Creación, filtros por estado/categoría/búsqueda, ciclo de vida completo (NUEVO → ASIGNADO → EN_PROGRESO → RESUELTO → CERRADO → REABIERTO)
- **Comentarios**: Historial de comunicación en cada ticket
- **Auditoría**: Log de todas las acciones importantes
- **Notificaciones**: Emails automáticos al cambiar estado del ticket
- **Dashboard**: Estadísticas para agentes y clientes
- **Administración**: CRUD de usuarios y categorías

## Stack

- **Framework**: Next.js 16.2.9 (App Router, Turbopack)
- **Base de datos**: PostgreSQL + Prisma 6
- **Autenticación**: next-auth v5 beta (Credentials + Google)
- **UI**: Tailwind CSS v4, componentes propios (shadcn-style)
- **Email**: Nodemailer con templates HTML
- **Contenedor**: Docker (multi-stage, standalone output)

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Docker (opcional, para despliegue)

## Instalación

```bash
git clone https://github.com/brandall2021/ticket.git
cd ticket
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm run prisma generate
npm run prisma db push
npm run seed
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `AUTH_SECRET` | Secreto para JWT (generar con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base de la app |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth (opcional) |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google OAuth (opcional) |
| `SMTP_HOST` | Servidor SMTP (opcional) |
| `SMTP_PORT` | Puerto SMTP |
| `SMTP_SECURE` | Usar TLS |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `SMTP_FROM` | Dirección remitente |

## Usuarios por Defecto (seed)

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Admin | admin@helpdesk.com | admin123 | ADMIN |
| Agente | agente@helpdesk.com | admin123 | AGENT |
| Cliente | cliente@helpdesk.com | admin123 | CLIENT |

## Máquina de Estados (Tickets)

```
NUEVO → ASIGNADO → EN_PROGRESO → RESUELTO → CERRADO
                                            ↓
                                       REABIERTO → ASIGNADO
```

## Despliegue con Docker

```bash
docker build -t helpdesk .
docker run -p 3000:3000 --env-file .env helpdesk
```

## Licencia

MIT
