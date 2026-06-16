## Objetivo
Permitir que tanto conductores como pasajeros tengan foto de perfil, y mostrarlas mutuamente cuando hay un servicio activo (el pasajero ve la foto del conductor asignado, y el conductor ve la foto del pasajero al recibir/realizar el servicio).

## Estado actual
- `conductores.foto_url` ya existe en la base de datos y se sube al bucket `vehiculos-fotos`.
- `pasajeros_pcd` NO tiene columna de foto.
- En la app del pasajero, cuando se asigna conductor, hoy solo se muestra el nombre y la placa (sin foto).
- En la app del conductor (vista de servicio), se muestran datos del pasajero pero sin foto.

## Cambios

### 1. Base de datos
- Agregar columna `foto_url text` a `pasajeros_pcd`.
- Crear bucket público nuevo `perfiles` (o reutilizar `vehiculos-fotos`) para fotos de pasajero. Propongo **reutilizar `vehiculos-fotos`** con prefijo `pasajeros/` y `conductores/` para no multiplicar buckets, ya que es público.
- Actualizar la función `get_pasajero_brief_for_conductor` para incluir `foto_url` (ya devuelve todo el row, así que con agregar la columna queda incluida automáticamente).
- Crear una función `get_conductor_publico_por_nombre` extendida o ajustar la existente para devolver también `foto_url` del conductor (hoy solo devuelve `nombre, telefono`).

### 2. Subida de foto
- **Pasajero**: en su perfil / pantalla de cuenta, botón "Cambiar foto" → sube a `vehiculos-fotos/pasajeros/{pasajero_id}.jpg` → guarda URL en `pasajeros_pcd.foto_url`.
- **Conductor**: ya tiene foto desde el panel admin. Agregar también opción de que el propio conductor pueda cambiarla desde su app (sube a `vehiculos-fotos/conductores/{conductor_id}.jpg`).
- **Admin CRM**: en `pasajeros-pcd.tsx`, agregar campo de foto al formulario (igual al que ya existe en conductores).

### 3. Mostrar fotos durante el servicio
- **App pasajero** (`ViajeEnCurso.tsx` / tarjeta de conductor asignado): mostrar avatar circular del conductor junto a su nombre/placa.
- **App conductor** (`conductor.servicio.$id.tsx`): mostrar avatar circular del pasajero junto a su nombre y datos.
- Fallback: iniciales sobre fondo de marca cuando no haya `foto_url`.

## Detalles técnicos
- Componente reutilizable `<AvatarPersona nombre fotoUrl size />` con fallback de iniciales (usa shadcn `Avatar`).
- Subida con `supabase.storage.from('vehiculos-fotos').upload(..., { upsert: true })` + `getPublicUrl`.
- Validación cliente: máx 5MB, tipos jpg/png/webp, recorte cuadrado simple (sin editor, solo `object-cover`).
- RLS storage: el bucket ya es público para lectura; para escritura agregar policy que permita al usuario subir a `pasajeros/{su_pasajero_id}.*` y a conductores subir a `conductores/{su_conductor_id}.*`, además de admin a todo.

## Migración necesaria
1. `ALTER TABLE pasajeros_pcd ADD COLUMN foto_url text;`
2. Actualizar `get_conductor_publico_por_nombre` para retornar también `foto_url`.
3. Policies en `storage.objects` para `vehiculos-fotos` que permitan a cada quien subir su propia foto.

¿Confirmas que reutilicemos el bucket `vehiculos-fotos` (público) y que el pasajero pueda cambiar su propia foto desde la app?