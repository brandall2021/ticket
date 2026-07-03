# Sistema de Tickets — Helpdesk

Sistema de gestión de tickets para soporte técnico interno, desarrollado con **Next.js 16**, **PostgreSQL**, **Prisma ORM** y **NextAuth v5**.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 16.2.9 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Base de datos** | PostgreSQL v16 |
| **ORM** | Prisma 6.19.3 |
| **Autenticación** | NextAuth v5 (Credentials + Google OAuth) |
| **UI** | Tailwind CSS 4 + shadcn/ui |
| **Editor de texto** | Tiptap 3.27 (rich text) |
| **Emails** | Nodemailer |
| **Validación** | Zod 4 |
| **Hash de contraseñas** | bcryptjs |

---

## Modelo de Datos

### Roles de Usuario

| Rol | Permisos |
|---|---|
| **ADMIN** | Acceso completo: CRUD usuarios, categorías, stock; eliminar tickets; panel de administración |
| **AGENT** | Gestión de tickets (asignar, cambiar estado, comentar); panel de administración limitado |
| **CLIENT** | Crear tickets propios, ver y comentar sus tickets, editar perfil |

### Estados de Ticket

Los tickets siguen un flujo de 4 estados con transiciones definidas:

```
NUEVO ──────────→ EN_CURSO ──────→ CERRADO
   │                  │
   └──→ EN_ESPERA ←──┘
                │
                └──→ CERRADO

CERRADO ──→ EN_CURSO (reabrir)
```

Cada cambio de estado envía una notificación por email al cliente. Al cerrar un ticket, se solicita una **solución** en un textarea obligatorio que se incluye en el email de cierre.

### Esquema de Base de Datos

**User** — Usuarios del sistema
- `id`, `name`, `apellido`, `interno`, `cargo`, `email` (único), `password` (hash), `role` (ADMIN/AGENT/CLIENT), `activo`, `lastLogin`, `createdAt`, `updatedAt`

**Ticket** — Tickets de soporte
- `id`, `titulo`, `descripcion` (rich text), `status` (NUEVO/EN_CURSO/EN_ESPERA/CERRADO), `prioridad` (BAJA/MEDIA/ALTA/CRITICA), `ubicacion`, `ipPc`, `solucion`, `clienteId`, `agenteId`, `categoriaId`, `createdAt`, `updatedAt`

**Categoria** — Categorías de tickets
- `id`, `nombre` (único), `color`, `activo`, `createdAt`

**Comment** — Comentarios en tickets (rich text)
- `id`, `contenido`, `ticketId`, `autorId`, `createdAt`

**Attachment** — Archivos adjuntos
- `id`, `nombre`, `url`, `ticketId`, `subidoPorId`, `createdAt`

**AuditLog** — Auditoría de acciones
- `id`, `accion`, `detalle`, `ip`, `fecha`, `usuarioId`

**StockCategoria / StockItem** — Módulo de inventario
- Categorías de stock con items y cantidades

---

## Rutas de la Aplicación

### Frontend

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/register` | Registro de nuevo cliente | Público |
| `/recuperar` | Recuperación de contraseña | Público |
| `/restablecer/[token]` | Restablecer contraseña | Público |
| `/` | Panel de control / dashboard | Autenticado |
| `/perfil` | Editar perfil propio | Autenticado |
| `/tickets` | Listado de tickets (con filtros) | Autenticado |
| `/tickets/nuevo` | Crear ticket | Autenticado |
| `/tickets/[id]` | Detalle de ticket + comentarios | Autenticado |
| `/admin` | Dashboard administrativo | ADMIN/AGENT |
| `/admin/usuarios` | Gestión de usuarios | ADMIN/AGENT |
| `/admin/categorias` | Gestión de categorías | ADMIN/AGENT |
| `/admin/stock` | Gestión de inventario | ADMIN/AGENT |

### API

| Ruta | Métodos | Descripción |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/recuperar` | POST | Solicitar recuperación de contraseña |
| `/api/auth/restablecer` | POST | Restablecer contraseña con token |
| `/api/register` | POST | Registro de usuario (solo dominio @recuperocrediticio.com.ar) |
| `/api/perfil` | GET, PATCH | Obtener/actualizar perfil propio |
| `/api/estadisticas` | GET | Estadísticas del dashboard |
| `/api/upload` | POST | Subir archivo |
| `/api/categorias` | GET, POST | Categorías (públicas y admin) |
| `/api/tickets` | GET, POST | Listar/crear tickets |
| `/api/tickets/[id]` | GET, PATCH, DELETE | Detalle, actualizar, eliminar ticket (DELETE solo ADMIN) |
| `/api/tickets/[id]/comentarios` | POST | Agregar comentario |
| `/api/admin/usuarios` | GET, POST | CRUD usuarios |
| `/api/admin/usuarios/[id]` | PATCH, DELETE | Actualizar/eliminar usuario |
| `/api/admin/usuarios/[id]/reenviar` | POST | Regenerar contraseña y reenviar credenciales |
| `/api/admin/categorias` | GET, POST | CRUD categorías |
| `/api/admin/categorias/[id]` | PATCH, DELETE | Actualizar/eliminar categoría |
| `/api/admin/stock` | GET, POST | CRUD items de stock |
| `/api/admin/stock/[id]` | PATCH, DELETE | Actualizar/eliminar item |
| `/api/admin/stock-categorias` | GET, POST | CRUD categorías de stock |
| `/api/admin/stock-categorias/[id]` | PATCH, DELETE | Actualizar/eliminar categoría de stock |

---

## Variables de Entorno

```
DATABASE_URL=postgresql://usuario:password@host:5432/ticket
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
TZ=America/Argentina/Buenos_Aires

# SMTP (opcional — sin esto no se envían emails)
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@recuperocrediticio.com.ar
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## Funcionalidades

### Tickets
- Creación con título, descripción rich text, prioridad, categoría, ubicación, IP
- Editor Tiptap con negrita, cursiva, listas, headings e imágenes
- Adjuntar archivos (múltiples)
- Filtros: por estado, prioridad, búsqueda por título, rango de fechas
- Paginación (20 tickets por página)
- Transiciones de estado con validación
- Asignación a agente
- Solución obligatoria al cerrar ticket (enviada por email)
- Historial de comentarios en rich text

### Usuarios
- 3 roles: ADMIN, AGENT, CLIENT
- Registro público con validación de dominio @recuperocrediticio.com.ar
- Edición de perfil (nombre, apellido, interno)
- Cambio de contraseña desde perfil (con verificación de contraseña actual)
- Admin puede crear, editar rol, activar/desactivar, cambiar contraseña, eliminar usuarios
- Generación de contraseña aleatoria (sin símbolos)
- Reenvío de credenciales por email
- Notificación por email al crear usuario
- Registro de último login

### Notificaciones por Email
- Confirmación de registro
- Credenciales de nueva cuenta
- Cambio de contraseña (admin y propio)
- Cambio de estado de ticket
- Cierre de ticket con solución
- Recuperación de contraseña

### Seguridad
- Contraseñas hasheadas con bcrypt (12 rounds)
- Autenticación con NextAuth + JWT
- Protección de rutas por rol
- Validación con Zod en todas las APIs
- Auditoría de acciones (logAudit)
- Confirmación en acciones destructivas (eliminar usuario, ticket, reenviar credenciales)
- Solo ADMIN puede eliminar tickets

---

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Sincronizar schema con BD (pu sh, no migraciones)
npx prisma db push

# Poblar datos de prueba
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

### Seed

El seed crea:
- 1 ADMIN (`admin@helpdesk.com`)
- 1 AGENT (`agente@helpdesk.com`)
- 1 CLIENT (`cliente@helpdesk.com`)
- 5 categorías de tickets
- 7 categorías de stock

Todas las contraseñas del seed son `admin123`.

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build de producción |
| `npm run lint` | ESLint |
| `npm run seed` | Poblar base de datos |
| `npx prisma db push` | Sincronizar schema con BD |
| `npx prisma studio` | UI de administración de BD |
| `npx prisma generate` | Regenerar Prisma Client |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/           # Panel de administración
│   │   ├── usuarios/    # CRUD usuarios
│   │   ├── categorias/  # CRUD categorías de tickets
│   │   └── stock/       # Módulo de inventario
│   ├── api/             # API routes (REST)
│   ├── login/           # Página de inicio de sesión
│   ├── register/        # Registro de usuario
│   ├── recuperar/       # Recuperación de contraseña
│   ├── restablecer/     # Restablecer contraseña
│   ├── perfil/          # Perfil de usuario
│   └── tickets/         # Gestión de tickets
├── components/
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── layout/          # Header, layout
│   └── theme/           # Toggle dark/light
├── lib/
│   ├── auth.ts          # Configuración NextAuth
│   ├── prisma.ts        # Cliente Prisma singleton
│   ├── email.ts         # Templates de email
│   ├── constants.ts     # Constantes y configuraciones
│   ├── schemas.ts       # Validación Zod
│   ├── api-auth.ts      # Helpers de autenticación
│   ├── audit.ts         # Auditoría
│   └── utils.ts         # Utilidades
prisma/
├── schema.prisma        # Schema de base de datos
└── seed.ts              # Datos de prueba
```

---

## Licencia

Uso interno — Recupero Crediticio
