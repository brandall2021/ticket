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
| **Acceso remoto** | SSH (ssh2 + xterm.js) · RDP (Apache Guacamole) |

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

**Server** — Servidores accesibles por SSH/RDP
- `id`, `nombre`, `host`, `protocolo` (SSH/RDP), `puerto`, `usuario`, `password` / `privateKey` / `passphrase` (cifradas AES-256-GCM), `dominio`, `resolucion`, `seguridad`, `descripcion`, `grupo`, `color`, `activo`, `fingerprint` (huella TOFU), `ultimoEstado`, `ultimoError`, `ultimaConexion`

**ServerSession** — Historial de accesos remotos
- `id`, `serverId`, `usuarioId`, `protocolo`, `estado` (ACTIVA/CERRADA/ERROR), `detalle`, `ip`, `inicio`, `fin`, `duracion`

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
| `/admin/servidores` | Listado de servidores SSH/RDP | ADMIN |
| `/admin/servidores/[id]` | Terminal SSH o escritorio RDP + historial | ADMIN |

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
| `/api/admin/mikrotik` | GET, POST | CRUD routers MikroTik |
| `/api/admin/mikrotik/check` | POST | Probar conexión a un router |
| `/api/admin/mikrotik/[id]` | GET, POST | Detalle y test de un router |
| `/api/admin/mikrotik/[id]/live` | GET | Datos en vivo del router (secciones) |
| `/api/admin/mikrotik/[id]/history` | GET | Snapshots y tráfico histórico |
| `/api/admin/mikrotik/[id]/alerts` | GET, PATCH | Alertas del router |
| `/api/admin/mikrotik/[id]/tools` | POST | Ping / traceroute desde el router |
| `/api/admin/mikrotik/[id]/report` | GET | Exportar CSV (snapshots, tráfico, secciones) |
| `/api/admin/mikrotik/cron` | GET | Snapshots + alertas automáticas |
| `/api/admin/servers` | GET, POST | Listar/crear servidores |
| `/api/admin/servers/[id]` | GET, PATCH, DELETE | Detalle, editar, eliminar servidor |
| `/api/admin/servers/check` | POST | Probar TCP + autenticación (SSH) |
| `/api/admin/servers/[id]/connect` | POST, DELETE | Abrir/cerrar sesión SSH o RDP |
| `/api/admin/servers/[id]/rdp` | GET | Descargar archivo `.rdp` (sin Guacamole) |
| `/api/admin/servers/[id]/sesiones` | GET | Historial de accesos del servidor |
| `/api/admin/ssh/[sessionId]` | GET (SSE), POST, DELETE | Flujo del terminal SSH (salida/entrada/resize) |
| `/api/admin/contrasenas/[id]/revelar` | POST | Revela una credencial (auditado) |
| `/api/uploads/[name]` | GET | Descarga autenticada de adjuntos |

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

# Cron (requerido para snapshots y alertas automáticas)
CRON_SECRET=clave-aleatoria-para-llamadas-programadas

# Acceso a servidores (SSH/RDP) — mínimo 32 caracteres
SERVER_ENCRYPTION_KEY=...
# Gateway Guacamole para RDP en el navegador (opcional; sin esto se descarga .rdp)
GUACAMOLE_URL=http://guacamole:8080/guacamole
GUACAMOLE_PUBLIC_URL=/guacamole
GUACAMOLE_USER=guacadmin
GUACAMOLE_PASSWORD=...
GUACAMOLE_DATA_SOURCE=default
# Contraseña de la base de Guacamole (obligatoria para docker compose)
GUACAMOLE_DB_PASSWORD=...

# Puesta en marcha con docker compose
POSTGRES_PASSWORD=...
# Destinatario del backup por correo (vacío = sólo descarga)
BACKUP_EMAIL=
# Vincular cuentas de Google por email (riesgoso; default false)
AUTH_ALLOW_EMAIL_LINKING=false
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
- Contraseñas hasheadas con bcrypt (12 rounds), mínimo 10 caracteres (72 bytes)
- Autenticación con NextAuth + JWT (7 días), revocada al cambiar la contraseña o desactivar el usuario
- Protección de rutas por rol
- Validación con Zod en todas las APIs
- Rate limiting en login, registro, recuperación y reseteo de contraseña
- Cifrado AES-256-GCM de credenciales de infraestructura (MikroTik, servidores y bóveda de contraseñas)
- Adjuntos servidos por `/api/uploads/[name]` con sesión, fuera de `/public`
- Escapado de HTML en los correos y validación `http(s)` en enlaces administrables
- Cabeceras de seguridad en nginx (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS)
- Auditoría de acciones (logAudit), incluido el revelado de credenciales y los backups
- Confirmación en acciones destructivas (eliminar usuario, ticket, reenviar credenciales)
- Solo ADMIN puede eliminar tickets

> El detalle completo de la auditoría y su estado está en `analisis-seguridad-helpdesk.md`.

### Monitoreo MikroTik (solo ADMIN)
- Registro de routers con credenciales API RouterOS (puerto 8728, TLS 8729 con `useTls`)
- Dashboard con CPU, memoria, uptime, interfaces y tráfico en tiempo real (polling 5s)
- Tablas en vivo: interfaces, IPs, DHCP leases, clientes (ARP), firewall filter, NAT, WireGuard (interfaces + peers), rutas y logs
- Herramientas: ping y traceroute ejecutados **desde el router**
- Histórico de snapshots (CPU/memoria/uptime) y tráfico por interfaz por hora
- Alertas automáticas: router offline, CPU alta (>90%), memoria baja (<15%), interfaz caída y recuperación — con notificaciones y email
- Exportación de reportes CSV (históricos y secciones en vivo)
- Requiere `CRON_SECRET` y programación de `/api/admin/mikrotik/cron` para snapshots y alertas automáticas

### Acceso a servidores (SSH / RDP) — solo ADMIN
- Inventario de servidores con protocolo, puerto, usuario, grupo y descripción
- Credenciales cifradas en base de datos con AES-256-GCM (`SERVER_ENCRYPTION_KEY`); nunca se devuelven al cliente
- **SSH**: terminal completo en el navegador (xterm.js) sobre `ssh2`; salida por Server-Sent Events y entrada por POST, sin WebSocket
- Verificación de huella del host (TOFU): se guarda en la primera conexión y se exige en las siguientes
- **RDP**: escritorio remoto embebido vía Apache Guacamole (contenedores `guacd` + `guacamole`)
- Sin Guacamole configurado, el acceso RDP descarga un archivo `.rdp` para abrir con el cliente de Windows
- Botones Ctrl+Alt+Del, Tecla Windows y pantalla completa en la sesión RDP
- Prueba de conexión desde el formulario (TCP + autenticación SSH real)
- Historial de accesos: usuario, IP, inicio, duración, estado y detalle
- Cierre automático de sesiones SSH inactivas (30 minutos)

---

## Acceso remoto a servidores (SSH / RDP)

Módulo para conectarse a los servidores desde el propio helpdesk, sin depender de herramientas locales del agente.

### SSH (embebido, sin infraestructura extra)

- El backend abre la conexión con `ssh2` y solicita una shell con PTY.
- La salida viaja al navegador por **Server-Sent Events** (`GET /api/admin/ssh/[sessionId]`) y la entrada vuelve por `POST` (agrupada cada 12 ms). No hace falta WebSocket ni un servidor Node a medida: funciona con `output: "standalone"`.
- xterm.js se importa dinámicamente en el cliente y el tamaño de la terminal se sincroniza con el servidor.
- Huella del host (TOFU): se calcula en la primera conexión (`SHA256:…`) y se guarda en `Server.fingerprint`. Si cambia, la conexión se rechaza.
- Las sesiones inactivas se cierran solas a los 30 minutos; el proceso admite hasta 30 sesiones simultáneas.

### RDP (Apache Guacamole)

El navegador no puede hablar RDP nativamente, así que se usa un gateway:

```
navegador ──wss──▶ guacamole (Tomcat) ──▶ guacd ──▶ servidor Windows (3389)
     ▲                     ▲
     └── token ────────────┘  el backend crea la conexión por REST
```

1. El backend se autentica contra la API de Guacamole (`GUACAMOLE_USER` / `GUACAMOLE_PASSWORD`).
2. Crea una conexión RDP efímera con las credenciales descifradas del servidor.
3. Devuelve al navegador la URL del túnel WebSocket, que consume `guacamole-common-js`.
4. Al desconectar se elimina la conexión efímera.

`docker-compose.yml` levanta el stack completo (app, PostgreSQL, `guacd`, `guacamole`, su base y nginx):

```bash
cp .env.example .env      # completar AUTH_SECRET, SERVER_ENCRYPTION_KEY y GUACAMOLE_*
docker compose up -d --build
```

nginx sólo publica `= /guacamole/websocket-tunnel`; la interfaz de administración de Guacamole queda inaccesible (ver `deploy/nginx.conf`).

**Sin Guacamole** (por ejemplo en desarrollo local) el acceso RDP sigue disponible en modo degradado: `GET /api/admin/servers/[id]/rdp` genera un archivo `.rdp` que abre `mstsc` en la máquina del agente.

> La primera puesta en marcha de Guacamole crea el usuario `guacadmin` con su contraseña por defecto: cambiala desde la propia instalación y poné el mismo valor en `GUACAMOLE_PASSWORD`, porque el backend la usa para la API REST. `GUACAMOLE_DB_PASSWORD` es obligatoria para el compose y sólo aplica a la base de datos de Guacamole.

### Cifrado de credenciales

- Contraseña, clave privada y passphrase se cifran con AES-256-GCM con prefijo `enc:v1:` (mismo criterio que MikroTik).
- `SERVER_ENCRYPTION_KEY` (mínimo 32 caracteres) o, si no está definida, `MIKROTIK_ENCRYPTION_KEY`.
- Las credenciales nunca salen por la API: se reemplazan por `tienePassword` / `tieneClavePrivada`.
- Cambiar la clave deja ilegibles las credenciales guardadas: hay que volver a cargarlas.

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
│   │   ├── stock/       # Módulo de inventario
│   │   └── servidores/  # Servidores SSH/RDP (listado + sesión)
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
│   ├── servers/         # Formulario, terminal SSH y visor RDP
│   └── theme/           # Toggle dark/light
├── lib/
│   ├── auth.ts          # Configuración NextAuth
│   ├── servers.ts       # Cifrado, validaciones y parámetros RDP/Guacamole
│   ├── ssh-sessions.ts  # Sesiones SSH en memoria (ssh2)
│   ├── guacamole.ts     # Cliente REST de Guacamole (túneles RDP efímeros)
│   ├── server-schemas.ts # Validación Zod de servidores
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
