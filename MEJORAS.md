# Correcciones de seguridad

Esta entrega corrige permisos de tickets y exposicion de credenciales en las respuestas de MikroTik.

- Solo ADMIN y AGENT pueden modificar tickets y asignarlos a personal activo de soporte.
- CLIENT y EDITOR solo pueden leer sus propios tickets y comentarios publicos.
- Las notas internas no generan notificaciones al cliente.
- Un cliente no puede crear tickets a nombre de terceros mediante x-cliente-id.
- El rol y el estado activo se consultan al renovar/leer la sesion JWT; Google tambien rechaza cuentas desactivadas.
- Las respuestas de listado, creacion, edicion y prueba de conexion de routers omiten password.
- Cambiar la contrasena invalida el enlace de recuperacion; la actualizacion condicional impide reutilizacion concurrente.
- Las subidas admiten como maximo 5 archivos, 5 MB por archivo y 15 MB en total; se restringen los tipos admitidos.
- La actualizacion de tickets guarda ipPc.
- El contenido enriquecido no confiable se convierte a texto seguro antes de renderizarse y el resaltado de notas usa nodos React en lugar de inyectar HTML.

## Verificacion

Ejecutar `npm ci`, `npx prisma generate`, `npm test` y `npx tsc --noEmit`.
Las pruebas cubren permisos, filtrado de notas internas, respuestas sin secretos y rechazo de suplantacion en las rutas reales.

Resultado en esta entrega: 10 pruebas aprobadas; cliente Prisma generado; TypeScript sin errores; ESLint sin errores en los archivos de API, autenticacion y pruebas modificados. No se ejecuto el build de produccion ni una prueba con PostgreSQL o un router real.

Verificacion adicional de la sanitizacion: 14 pruebas aprobadas y los 6 archivos modificados se transpilan correctamente. La comprobacion completa de TypeScript y ESLint requiere reinstalar las dependencias y regenerar el cliente Prisma; la instalacion local usada para esta revision quedo incompleta.

## Antes de desplegar

- Los enlaces de recuperacion emitidos antes de esta actualizacion dejan de ser validos. Solicitar uno nuevo.
- Las credenciales de equipos y routers siguen almacenadas sin cifrado a nivel de aplicacion. Implementar cifrado con una clave externa y migrar los registros existentes antes de tratar el modulo como una boveda de secretos.
- Los documentos existentes y nuevos siguen en public/uploads. Migrarlos a almacenamiento privado con descargas autorizadas por ticket y configurar un volumen persistente.
- Configurar un limite del cuerpo de la solicitud en el proxy (por ejemplo 16 MB). La comprobacion de tamano de los archivos ocurre despues de interpretar el formulario y no sustituye ese limite.
- La validacion de tipos de archivos usa los metadatos del formulario: falta validar el contenido real y analizar archivos maliciosos.
- El generador de backup existente usa nombres de columnas que no coinciden con el esquema actual y no cubre todos los modelos. No se modifico en esta entrega; verificar restauraciones antes de confiar en esos backups.

Esta entrega no modifica una base de datos, no envia correos y no publica cambios en GitHub.
