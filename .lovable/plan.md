## Objetivo

Hacer que cuando un admin genere una contraseña para un conductor, esta quede guardada y visible para él. Cada vez que abra el botón "Acceso app", verá la contraseña actual asignada al conductor (para reenviarla si el conductor la olvidó), con la opción de regenerarla si lo desea.

## Cambios

### 1. Base de datos (migración)

- Agregar columna `password_plain TEXT` a `public.conductores` (la contraseña actual visible para admins; el hash bcrypt sigue usándose para verificar el login).
- Actualizar la función `set_conductor_password(_conductor_id, _password)` para que también guarde `password_plain = _password` además del hash bcrypt.
- Crear función `get_conductor_password(_conductor_id uuid) RETURNS TABLE(password text, acceso_habilitado boolean, primer_login_at timestamptz)` con `SECURITY DEFINER` que SOLO devuelva la contraseña si `auth.uid()` es admin (`has_role(auth.uid(), 'admin')`). Si no es admin, retorna vacío. Esto evita exponer la columna a roles no-admin vía RLS normal.

Nota de seguridad: guardar contraseñas en texto plano es un riesgo conocido. Lo hacemos porque el flujo lo pide explícitamente y porque son credenciales operativas de baja sensibilidad (acceso a la app del conductor, no a banca). El acceso queda restringido a admins por la función `SECURITY DEFINER`.

### 2. Componente `src/components/conductor/GenerarAccesoConductor.tsx`

Reescribir el flujo del modal:

- Al abrir el modal, llamar `supabase.rpc("get_conductor_password", { _conductor_id })`.
- Si retorna una contraseña existente → mostrar pantalla "Contraseña actual" con:
  - La contraseña visible en grande (toggle mostrar/ocultar con ícono de ojo).
  - Botón "Copiar".
  - Botón "Copiar enlace + credenciales" (texto listo para WhatsApp: `tramos.online/conductor/login · Cédula: {cedula} · Contraseña: {pwd}`).
  - Botón secundario "Regenerar contraseña" → vuelve a la vista de creación.
- Si no hay contraseña → mostrar la vista actual de creación (input + aleatoria + guardar).
- Después de guardar una contraseña nueva, mostrar la misma pantalla "Contraseña actual" (no la pantalla de "se mostrará una sola vez").
- Quitar el texto "no se mostrará otra vez" porque ahora siempre estará disponible.

### 3. Pasar `cedula` al componente

`src/routes/conductores.tsx` ya tiene `c.cedula`; pasarla como prop a `<GenerarAccesoConductor>` para construir el mensaje de WhatsApp con cédula + contraseña.

## Resultado para el usuario

- Admin hace clic en "Acceso app" de un conductor → ve la contraseña asignada actual (oculta por defecto, con botón mostrar).
- Puede copiarla o copiar el mensaje completo para WhatsApp.
- Si el conductor pide cambio, hay un botón "Regenerar" para crear otra.
- Funciona para conductores que ya tienen contraseña creada antes de este cambio: la próxima vez que el admin se la regenere, quedará guardada y visible desde entonces.
