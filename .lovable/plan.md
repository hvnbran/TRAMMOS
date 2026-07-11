## Integración completa: HOSPITAL DEL SUR ITAGÜÍ

Replicar el modelo que ya tenemos para Corona y Sodimac (rol dedicado, filtro por `cliente`, branding en el sidebar, RLS por cliente) pero con permisos ajustados a lo que pediste: el hospital ve **vehículos, conductores, pasajeros, servicios, monitoreo, cumplimiento ANS**, y en **creación de cuentas** solo puede crear **pasajeros**.

---

### 1. Base de datos (migración)

- Añadir `'hospital_sur'` a los enums `public.cliente_tipo` y `public.app_role`.
- Actualizar la función `link_pasajero_to_auth` / trigger de vinculación si asume solo corona/sodimac (verificar; añadir hospital_sur al filtro).
- Ninguna RLS nueva: `can_access_cliente('hospital_sur')` y `can_access_clientes([...])` ya funcionarán automáticamente porque comparten el mismo nombre entre `cliente_tipo` y `app_role`.
- Crear la fila en `empresas` con `nombre = 'Hospital del Sur Itagüí'`, `slug = 'hospital-sur-itagui'`, `cliente_legacy = 'hospital_sur'`.

### 2. Tipos y auth-context

- `src/lib/auth-context.tsx`: extender `AppRole` y `ClienteTipo` con `'hospital_sur'`, añadirlo al array `priority` y al mapeo `role → cliente`.

### 3. Sidebar y branding

- Subir el logo del hospital como `src/assets/logo-hospital-sur.png` (usar la imagen que enviaste).
- `src/components/layout/Sidebar.tsx`:
  - Nuevo objeto de branding cuando `role === 'hospital_sur'` (nombre "HOSPITAL DEL SUR", subtítulo "ESE Itagüí", logo del hospital).
  - Nuevo `HOSPITAL_NAV` con: Dashboard, Servicios, Conductores, Vehículos, Pasajeros PCD, Monitoreo, Cumplimiento ANS, Creación de cuentas, Feedback.
  - Elegir el nav según `role`.

### 4. Permisos de páginas admin-only

`AdminOnly` sigue existiendo, pero los cuatro módulos que el hospital necesita cambian a una versión con allowlist:

- Crear helper `RoleAllowed({ roles, children })` (o extender `AdminOnly` con `extraRoles`).
- Aplicarlo en:
  - `src/routes/monitoreo.tsx` → `['admin','hospital_sur']`
  - `src/routes/cumplimiento.tsx` → `['admin','hospital_sur']`
  - `src/routes/cuentas.tsx` → `['admin','hospital_sur']` (la UI oculta la creación de "empresa/admin" cuando es hospital_sur; solo deja "pasajero").
  - `operacion.tsx` sigue admin-only (no lo pediste para el hospital).

### 5. Creación de cuentas restringida a pasajero

- `src/routes/cuentas.tsx`: si `role === 'hospital_sur'`, forzar el modo "crear pasajero" y ocultar las demás pestañas/CTAs. Auto-preseleccionar la empresa Hospital del Sur.
- `src/lib/cuentas/cuentas.functions.ts`: en la función de crear pasajero, aceptar admins **o** un rol de cliente que coincida con `empresa.cliente_legacy` (es decir, un usuario `hospital_sur` solo puede crear pasajeros de la empresa Hospital del Sur). Las funciones de crear empresa/admin siguen siendo solo admin.

### 6. Registro de vehículos/conductores/pasajeros/servicios para el hospital

Ya funciona automáticamente porque las páginas usan `useAuth().cliente` para preseleccionar el cliente en formularios y filtrar listados vía RLS. Solo hay que asegurar que los selectores de "cliente" muestren la opción `hospital_sur` cuando el usuario es admin:

- `src/routes/conductores.tsx`, `src/routes/vehiculos.tsx`, `src/routes/servicios.tsx`, `src/routes/pasajeros-pcd.tsx`, `src/routes/operacion.tsx`: donde existan literales `['corona','sodimac']` en checkboxes/selects, añadir `'hospital_sur'` con label "Hospital del Sur".
- Badges de cliente (`servicios.tsx`, `pasajeros-pcd.tsx`) incluyen la etiqueta "Hospital del Sur" cuando aplique.

### 7. Monitoreo filtrado por cliente

`MonitoreoMap` y `VehiculosLiveList` se apoyan en RLS de `conductor_ubicaciones` que ya filtra por vehículos accesibles. Cuando el usuario es `hospital_sur`, RLS de `vehiculos` limita los datos, así que solo verá los vehículos asignados a Hospital del Sur (o compartidos que incluyan al hospital).

### 8. Verificación

- Migración → aplicar → regenerar tipos.
- Crear vía script el usuario admin del hospital (correo + contraseña de prueba) y devolvértelos.
- Login como ese usuario y confirmar: sidebar con logo + branding, solo las 8 opciones, filtros por cliente en cada módulo, creación de cuentas solo pasajero, monitoreo con vehículos del hospital, cumplimiento ANS filtrado.

---

### Detalles técnicos

- Enum alter: `ALTER TYPE public.cliente_tipo ADD VALUE IF NOT EXISTS 'hospital_sur'; ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hospital_sur';` (en migración separada porque `ALTER TYPE ... ADD VALUE` no puede usarse en la misma transacción que su uso).
- Segunda migración/inserción para la fila `empresas` con `cliente_legacy = 'hospital_sur'`.
- El nuevo helper `RoleAllowed` vive en `src/components/layout/RoleAllowed.tsx` para no romper el actual `AdminOnly` (que sigue existiendo para módulos verdaderamente admin).
- `cuentas.functions.ts`: nueva helper `assertAdminOrClienteEmpresa(userId, empresaId)` que reutiliza `has_role` para permitir a un rol cliente crear pasajeros solo dentro de "su" empresa.

¿Procedo con esta implementación?