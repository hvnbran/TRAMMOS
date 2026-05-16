
## Objetivo

Reemplazar el modelo fijo `corona/sodimac` por una **tabla `empresas` dinámica**, para que cualquier empresa nueva pueda darse de alta y sus usuarios (admins de empresa, pasajeros, conductores) solo vean datos de su propia empresa. En esta iteración el alcance se limita a **creación de cuentas e invitaciones** (los filtros del resto del sistema vienen en una segunda fase).

## Alcance de esta iteración

✅ Incluye:
- Nueva tabla `empresas` + migración de Corona y Sodimac.
- Pantalla `/cuentas`: rol estático "Empresa" + selector dinámico de empresa + botón "Crear empresa nueva".
- Invitaciones (empresa, pasajero) atadas a `empresa_id`.
- Registro por invitación de pasajeros: la empresa queda fijada por el link (el pasajero no la elige).
- Pertenencia usuario→empresa vía nueva tabla `user_empresas`.

❌ Fuera de alcance (próxima iteración, se avisará):
- Migrar el filtrado por empresa en Vehículos, Conductores, Pasajeros PcD, Servicios, Solicitudes, Calificaciones, Incidentes, Facturas, Centros de Costo y Monitoreo GPS. Estos seguirán funcionando con el enum `cliente_tipo` actual hasta la fase 2; los nuevos registros creados desde /cuentas se etiquetarán también con el enum legacy para no romper las pantallas existentes.

## Modelo de datos

Nueva tabla:

```text
empresas
  id            uuid PK
  nombre        text  (único, ej. "Corona", "Sodimac", "Nueva Empresa SAS")
  slug          text  (único, derivado del nombre)
  cliente_legacy cliente_tipo  (nullable; solo para Corona/Sodimac durante la migración)
  activo        boolean
  created_at / updated_at
```

Tabla puente para saber a qué empresa pertenece cada admin de empresa:

```text
user_empresas
  user_id   uuid  (auth.users)
  empresa_id uuid (empresas)
  rol_empresa text  ('admin_empresa' por defecto)
  PK (user_id, empresa_id)
```

Cambios a tablas existentes (solo agregar columna, sin romper nada):
- `registro_invitaciones.empresa_id` (uuid, nullable)
- `pasajeros_pcd.empresa_id` (uuid, nullable)
- `conductores.empresa_id` (uuid, nullable)

> No se toca el enum `cliente_tipo` ni `app_role` en esta fase. Las RLS actuales siguen vigentes. Los nuevos registros se crean con **ambos**: `empresa_id` (nuevo) y `cliente` (legacy, derivado de `empresas.cliente_legacy` o de un mapeo por defecto).

## Helpers de seguridad (security definer)

- `public.user_empresa_ids(_user uuid)` → uuid[]: empresas a las que pertenece el usuario.
- `public.can_access_empresa(_empresa_id uuid)` → boolean: admin global o miembro de la empresa.

Se dejan instalados pero **aún no se usan en RLS** (eso es fase 2). Sirven para que las nuevas vistas de cuentas/invitaciones puedan filtrar correctamente desde el frontend y desde server functions.

## Migración de Corona y Sodimac

1. Insertar dos filas en `empresas`: `Corona` (cliente_legacy='corona') y `Sodimac` (cliente_legacy='sodimac').
2. Rellenar `empresa_id` en `pasajeros_pcd`, `conductores` y `registro_invitaciones` mapeando por `cliente`.
3. Backfill de `user_empresas`: cada usuario con rol `corona` se asocia a la empresa Corona; cada usuario con rol `sodimac`, a Sodimac.

## UI: `/cuentas`

Tab **Empresa**:
- Selector de rol → **fijo en "Empresa"** (ya no Corona/Sodimac/Admin).
- Selector de empresa (lista de `empresas` activas) + botón "➕ Crear empresa nueva" (abre modal con nombre).
- Al crear cuenta: se crea el usuario en Auth, se inserta en `user_empresas (user_id, empresa_id)`, y por compatibilidad también se le asigna el rol legacy (`corona`/`sodimac` si la empresa tiene `cliente_legacy`; si es empresa nueva, se omite el rol legacy y queda solo por `user_empresas`).
- Generador de invitaciones: igual pero pidiendo empresa en vez de cliente.

Tab **Pasajero**:
- Selector de empresa obligatorio.
- Generador de invitación: la empresa queda guardada en `registro_invitaciones.empresa_id` y `datos_sugeridos`. El formulario de `/registro/$token` ya no muestra selector de cliente para el pasajero (solo lo informa visualmente).

Tab **Conductor**:
- Se añade selector de empresa al crear conductor (se guarda en `conductores.empresa_id`, y en `clientes[]` legacy si la empresa tiene `cliente_legacy`).

## Server functions a tocar

- `src/lib/cuentas/cuentas.functions.ts`: aceptar `empresa_id` en vez de (o además de) `cliente`, escribir `user_empresas`, mapear a legacy cuando aplique.
- `src/lib/cuentas/invitaciones.functions.ts`: aceptar `empresa_id`, guardarlo, y al consumir el token sembrar `empresa_id` + `user_empresas` + rol legacy compatible.
- Nuevo `src/lib/empresas/empresas.functions.ts`: `listEmpresas`, `createEmpresa` (admin-only).

## Frontend nuevo/editado

- `src/routes/cuentas.tsx`: rediseño de los 3 tabs con selector de empresa + modal "Crear empresa".
- `src/routes/registro.$token.tsx`: muestra la empresa asignada (read-only), elimina pregunta de cliente para pasajeros.
- Componente `EmpresaSelector` reutilizable.

## Detalles técnicos

- RLS de `empresas`: lectura para `authenticated`, escritura solo admin.
- RLS de `user_empresas`: cada usuario ve sus propias filas; admin gestiona todas.
- La migración se ejecuta en una sola transacción con `INSERT … ON CONFLICT DO NOTHING` para que sea idempotente.
- No se eliminan políticas ni funciones existentes — el sistema sigue corriendo en paralelo con el enum hasta la fase 2.

## Resultado esperado

- Un admin puede crear "Empresa X" desde /cuentas, generarle un link de invitación y, cuando esa empresa registre pasajeros, esos pasajeros quedan ligados solo a "Empresa X" en la nueva tabla `user_empresas` + `pasajeros_pcd.empresa_id`.
- Corona y Sodimac siguen funcionando exactamente igual que hoy en el resto de la app.
- Queda preparada la base (`empresa_id` + helpers + `user_empresas`) para que la fase 2 reemplace `can_access_cliente` por `can_access_empresa` en todas las tablas.
