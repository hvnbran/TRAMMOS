# Acceso CRM con contraseña + revisión del botón en la cabecera

## Contexto

- En **CrmLayout.tsx** ya existe la lógica correcta: si el rol es `admin` aparece el botón "Panel admin" (volver al panel principal), y si el rol es `crm` aparece el botón "Salir" (cerrar sesión). **No requiere cambios.**
- Lo que falta es la creación de la cuenta CRM **con contraseña directa** desde el formulario de admin. Hoy `grantCrmAccess` solo manda invitación por email (passwordless), así que el usuario no puede entrar al instante.

## Cambio 1 — `src/lib/crm/crm-access.functions.ts`

Modificar `grantCrmAccess` para aceptar contraseña opcional:

- Ampliar `inviteSchema`:
  - `email` (igual)
  - `displayName` (opcional, igual)
  - `password` (opcional, `z.string().min(8).max(72)`)
- Lógica nueva en el handler:
  1. Si el email **ya existe** en `profiles` → solo asignar rol `crm` (igual que ahora). Si además se envió `password`, actualizar la contraseña con `supabaseAdmin.auth.admin.updateUserById(userId, { password })`.
  2. Si **no existe** y se envió `password` → crear cuenta con `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name } })`. El usuario puede entrar al CRM al instante con email + contraseña.
  3. Si **no existe** y **no** se envió contraseña → mantener el flujo actual: `inviteUserByEmail` (invitación por correo).
- Asignar el rol `crm` en `user_roles` en los tres casos (igual que hoy, vía `upsert` con `onConflict`).
- Devolver `{ ok, invited, created, userId }` para que la UI muestre el toast correcto.

## Cambio 2 — `src/routes/crm.equipo.tsx`

Agregar el campo contraseña al formulario "Otorgar acceso CRM":

- Nuevo estado `password` (string).
- Input `type="password"` con `minLength={8}`, placeholder "Contraseña (mínimo 8 caracteres)", **opcional**.
- Texto de ayuda actualizado:
  - "Si **defines una contraseña**, el usuario podrá entrar al CRM al instante con su correo y esa contraseña."
  - "Si **dejas la contraseña en blanco** y el correo no existe, se enviará una invitación por email."
- Mensajes toast:
  - `created` → "Cuenta CRM creada. El usuario ya puede iniciar sesión."
  - `invited` → "Invitación enviada por correo y acceso CRM otorgado."
  - resto → "Acceso CRM otorgado."
- Limpiar `password` después de enviar.
- Grilla del formulario: pasar de `md:grid-cols-3` a `md:grid-cols-4` para acomodar el nuevo campo.

## Fuera de alcance (intencionalmente)

- **CrmLayout.tsx**: ya implementa correctamente el botón "Salir" para usuarios con rol `crm` puro y oculta "Panel admin". No se toca.
- **Cambio de contraseña por el propio usuario CRM**: no se incluye ahora; se puede agregar después si lo necesitas.
- **Validación de fuerza de contraseña adicional** (HIBP): no se activa en este paso.

## Validación

- Admin crea cuenta CRM nueva con contraseña → puede iniciar sesión en `/crm/login` inmediatamente y ve el CRM con botón "Salir" (no "Panel admin").
- Admin otorga acceso a un email existente con contraseña → se actualiza la contraseña y se le añade el rol.
- Admin otorga acceso sin contraseña a un email nuevo → llega correo de invitación (flujo actual).
