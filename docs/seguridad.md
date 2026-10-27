# Seguridad — Helpdesk

Este documento resume el estado de seguridad de la aplicación: qué se revisó, qué
se corrigió y qué riesgos quedan asumidos de forma consciente.

> Documento de estado, no un manual de ataque: no incluye pasos de reproducción
> ni cargas útiles.

---

## 1. Alcance y método

- Revisión estática del código del repositorio (rutas de API, capa de autenticación,
  subida y descarga de archivos, generación de correos, capa de datos y despliegue).
- Revisión de la superficie de autorización de todas las rutas de API.
- Análisis de dependencias con `npm audit`.
- Verificación de la lógica crítica con pruebas automatizadas (`tests/`).

No incluye pruebas de penetración sobre un despliegue en vivo, análisis de la base
de datos en ejecución ni revisión de dependencias de terceros más allá de sus avisos
publicados.

---

## 2. Medidas implementadas

### Autenticación y sesión

- Contraseñas con bcrypt (12 rondas) y mínimo de 10 caracteres (72 bytes).
- Sesiones JWT de 7 días que se **revocan al cambiar la contraseña** o al desactivar
  la cuenta: el token guarda la versión de credencial y se contrasta en cada petición.
- Recuperación de contraseña con token firmado, audiencia propia, expiración de 1 hora,
  un solo uso y ligado al hash de la contraseña vigente.
- Respuesta uniforme en la recuperación: no se revela si un email existe.
- Vinculación automática de cuentas de Google deshabilitada por defecto
  (`AUTH_ALLOW_EMAIL_LINKING`).

### Autorización

- Todas las rutas administrativas exigen rol; las rutas de contenido público lo son
  de forma explícita.
- Los clientes sólo acceden a sus propios tickets y comentarios.
- Los endpoints de cron requieren `CRON_SECRET`.

### Validación de entrada

- Esquemas Zod en las rutas de escritura, sin asignación masiva del cuerpo crudo.
- Enlaces administrables (Links, Instructivos) restringidos a `http`/`https`.
- Direcciones IP validadas como literales antes de cualquier operación de red.

### Ejecución de comandos

- Las operaciones de red (ping) usan `execFile` sin intérprete de shell y validan la
  dirección antes de invocarlas.
- El escaneo de red valida el rango con una lista blanca de caracteres.

### XSS y contenido

- No se renderiza HTML crudo: el texto enriquecido se convierte a texto plano y React
  escapa la salida.
- Las URLs guardadas se validan al escribir y se re-validan al renderizar.

### Correo

- Todo valor interpolado en las plantillas se escapa antes de entrar al HTML.
- Los asuntos se sanean para evitar inyección de cabeceras.
- El cambio de contraseña iniciado por el propio usuario ya no envía la contraseña
  por correo.
- El backup por correo tiene destinatario configurable (`BACKUP_EMAIL`) y queda auditado.

### Archivos

- Subidas con lista blanca de tipos, límite de tamaño y de cantidad por solicitud.
- Los adjuntos se guardan fuera de `/public` y se sirven por `/api/uploads/[name]`
  con sesión iniciada, validación del nombre y `X-Content-Type-Options: nosniff`.

### Credenciales y cifrado

- Credenciales de infraestructura (MikroTik, servidores y bóveda de contraseñas)
  cifradas con AES-256-GCM; nunca se devuelven al cliente salvo en el endpoint de
  revelado, que queda auditado.
- Huella de host SSH verificada por confianza en el primer uso (TOFU).

### Límites de uso

- Rate limiting por IP en inicio de sesión, registro, recuperación y reseteo.
- Tope de sesiones SSH simultáneas (global y por usuario).
- Cierre automático de sesiones SSH inactivas.

### Dependencias y despliegue

- `next` actualizado a 16.4.x; sin vulnerabilidades críticas conocidas en producción
  (`npm audit --omit=dev`).
- Optimización de imágenes de Next desactivada y cabecera de versión suprimida.
- `.dockerignore` evita incluir `.env`, `.git` y artefactos en la imagen.
- Contenedor sin privilegios; base de datos y `guacd` no publicados.
- nginx con cabeceras de seguridad, HSTS y un bloque TLS listo para producción.
- Sólo se publica el túnel de Guacamole; su interfaz de administración no es accesible.

---

## 3. Riesgos residuales aceptados

| Riesgo | Motivo |
|---|---|
| Pivote hacia la red interna desde "probar servidor" | Es la función del módulo (validar conectividad y credenciales). Mitigado con rol ADMIN y auditoría de cada intento. |
| TOFU sin verificación fuera de banda | La primera conexión SSH confía en la huella que recibe. Verificar la huella por un canal alternativo en entornos sensibles. |
| Credenciales iniciales por correo | El alta de cuentas envía una contraseña temporal; se recomienda cambiarla en el primer ingreso. |
| Avisos de severidad alta en dependencias no críticas | Algunos requieren salto de versión mayor (nodemailer, CLI de Prisma, línea beta de Auth.js); el uso actual no expone los vectores publicados. |
| `nmap` presente en la imagen | Lo utiliza el escaneo de red del módulo de monitorización. |

---

## 4. Requisitos operativos

1. **TLS obligatorio en producción.** Publicar la app por HTTPS y definir
   `NEXTAUTH_URL` con `https://` para que la cookie de sesión salga con `Secure`.
2. **Secretos fuera del repositorio.** `AUTH_SECRET`, `SERVER_ENCRYPTION_KEY`
   (o `MIKROTIK_ENCRYPTION_KEY`), `CRON_SECRET`, `POSTGRES_PASSWORD` y
   `GUACAMOLE_*` se definen sólo en el entorno.
   Cambiar la clave de cifrado deja ilegibles las credenciales ya guardadas.
3. **Migraciones al día** (`prisma migrate deploy`) antes de arrancar la versión nueva.
4. **Backups** con acceso restringido: contienen hashes de contraseñas.
5. **Rotación** de la contraseña de administración de Guacamole si se expuso la
   interfaz del gateway.

---

## 5. Verificación

- Compilación de tipos (`tsc --noEmit`) y análisis estático (ESLint) sin errores nuevos.
- `npm audit --omit=dev` sin vulnerabilidades críticas.
- Pruebas automatizadas sobre la lógica sensible: validación de IPs, validación de
  URLs, escapado de correos, política de contraseñas, limitador de peticiones y
  esquemas de entrada.

---

## 6. Reporte de vulnerabilidades

Si encontrás un problema de seguridad, no abras un issue público con detalles:
contactá al equipo de sistemas por un canal privado con la descripción, el impacto
y, si es posible, una forma de reproducirlo.
