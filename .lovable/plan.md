# Auto-registro de empresas con link genérico

## Concepto

El admin **solo genera un link** (uno o varios, reutilizables o de un solo uso). Lo envía a la empresa. La empresa abre el link y **ella misma** llena:
- Nombre de la empresa
- Email + contraseña del admin de esa empresa

Al enviar el formulario se crea automáticamente:
- La empresa en la tabla `empresas`
- El usuario auth
- La membresía en `user_empresas` con rol `admin_empresa`

Luego aparece en el listado de empresas del admin sin más pasos.

## Cambios

### 1. `src/routes/cuentas.tsx` — pestaña "Empresa"

Quitar todo el formulario actual. Dejar solo:

- Botón grande **"Generar link de registro de empresa"**
- Al hacer clic → llama `crearInvitacionRegistro({ tipo: "empresa" })` (sin empresaId, sin email, sin nombre)
- Muestra el link generado + botón copiar
- Debajo: lista de links activos (token corto, fecha creación, estado, link)

### 2. `src/lib/cuentas/invitaciones.functions.ts`

**`crearInvitacionRegistro`:**
- Quitar `empresaId` requerido. Para `tipo: "empresa"` el campo es opcional/null.
- Token corto: 12 caracteres base62 (en vez de 64 hex).
- Quitar `email_sugerido` y `display_name_sugerido` del flujo (siguen siendo opcionales en DB por compatibilidad).

**`consumirInvitacionRegistro`** (caso `tipo: "empresa"`):
- Aceptar nuevo input: `empresa_nombre` (requerido cuando invitación es de tipo empresa y no tiene `empresa_id`).
- Crear `empresas` (nombre + slug auto-generado desde nombre).
- Crear usuario auth.
- Insertar en `user_empresas` con `rol_empresa: 'admin_empresa'`.
- Insertar en `profiles`.
- No asignar rol legacy (corona/sodimac) — eso solo se mantiene si la invitación viene con empresa pre-asignada (compatibilidad).

### 3. `src/routes/registro.$token.tsx` → renombrar a `src/routes/r.$token.tsx`

Path corto `/r/:token`. En el form de registro empresa, agregar campo **"Nombre de la empresa"** que se envía a `consumirInvitacionRegistro`.

### 4. Migración mínima

`registro_invitaciones.empresa_id` ya es nullable, no requiere cambio de schema. Confirmado en el schema actual.

## Resultado

- Link tipo: `https://trammos.online/r/Ab3xK9pQ2mNv` (~40 chars)
- Admin: 1 clic → copia → envía
- Empresa: abre link → escribe su nombre + email + clave → listo
- Aparece en `/empresas` del admin automáticamente

## Archivos

- editar `src/routes/cuentas.tsx`
- editar `src/lib/cuentas/invitaciones.functions.ts`
- renombrar `src/routes/registro.$token.tsx` → `src/routes/r.$token.tsx` y ajustar UI
- buscar referencias a `/registro/` y actualizar a `/r/`

## Fuera de alcance

- Pestaña "Pasajero" sigue con su flujo actual (sí necesita empresa + datos del pasajero).
- No se borran tokens viejos largos; los nuevos serán cortos.

**¿Aprobamos?**
