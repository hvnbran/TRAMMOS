## Plan: Sedes del Hospital del Sur Itagüí en la app de pasajeros

### Datos base (las 3 sedes)

| Sede | Dirección |
|------|-----------|
| San Pío | Calle 33 Nº 50a-25, Itagüí |
| Santamaría | Carrera 52 Nº 78-158, Itagüí |
| Calatrava | Calle 63 Nº 58FF-11, Itagüí |

### 1. Base de datos (migración)

Crear tabla `public.empresa_sedes` para almacenar las sedes de cada empresa cliente (extensible a futuro, no solo hospital):

- Campos: `empresa_id` (FK a `empresas`), `nombre`, `direccion`, `lat`, `lng`, `orden`, `activo`.
- GRANTs: `SELECT` a `authenticated` y `anon` (son direcciones públicas), `ALL` a `service_role`.
- RLS: lectura abierta a autenticados; escritura solo admin (`has_role`).
- Seed: insertar las 3 sedes vinculadas a la empresa "Hospital del Sur Itagüí" (buscándola por `slug = 'hospital-sur-itagui'`). Coordenadas iniciales `NULL` — el geocoder de Google Places las resuelve al momento del pedido.

### 2. Backend (server function)

Crear `src/lib/empresas/sedes.functions.ts`:

- `listarSedesDeMiEmpresa()` con `requireSupabaseAuth`: identifica el pasajero por `auth_user_id` en `pasajeros_pcd`, lee su `empresa_id`/`cliente` y devuelve las sedes activas ordenadas. Si el pasajero no pertenece al Hospital del Sur, devuelve `{ sedes: [] }`.

### 3. UI del pasajero (`PedirServicioForm.tsx`)

Solo cuando el pasajero pertenece al Hospital del Sur Itagüí:

- Al abrir los campos "Origen" y "Destino" mostrar un bloque superior "Sedes del Hospital" con 3 chips (San Pío / Santamaría / Calatrava).
- Al tocar un chip: llena el input con `"<Nombre sede> — <dirección>"` y marca la sede seleccionada.
- Debajo del bloque de sedes se conserva el autocompletado de Google Places actual para direcciones libres (por si el viaje no es a/desde una sede).
- Visualmente: los chips llevan el ícono de cruz médica y el color verde del hospital para diferenciarlos.

Para pasajeros de otros clientes (Corona/Sodimac/generales) el bloque no aparece — el formulario queda exactamente como está hoy.

### 4. Panel admin (opcional, fuera de este cambio)

No se agrega UI de administración de sedes en este turno. Si más adelante quieren editar direcciones sin migración, se agrega un CRUD en `/cuentas` o en un nuevo módulo. Por ahora las sedes viven en la migración inicial.

### Detalles técnicos

- La detección "pertenece al Hospital del Sur" se hace comparando `pasajero.cliente === 'hospital_sur'` (ya existe en `pasajeros_pcd`), consultado una vez al montar el formulario y cacheado en el componente.
- El texto insertado en el input mantiene el formato que ya consume el backend de solicitudes (dirección plana en string), así que no hay cambios en `solicitudes_pasajero` ni en el flujo de asignación.
- Se conservan las verificaciones de Google Places existentes; las sedes son solo un atajo de UI.
