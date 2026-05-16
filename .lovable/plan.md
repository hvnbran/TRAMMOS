## Por qué aparece "No estás vinculado como conductor"

Anderson (cédula 1001808785) **sí está vinculado** en la base de datos: su fila en `conductores` tiene `auth_user_id` asignado al usuario auth que entró por la app.

El problema está en las políticas RLS de la tabla `conductores`. Las políticas actuales para SELECT son:

- `admin_view_all_conductores` → solo admins
- `view_conductores` → `can_access_clientes(clientes)` → requiere rol `corona`, `sodimac` o `admin`

El conductor logueado **solo tiene el rol `conductor`**, así que cuando la server function `upsertUbicacion` hace:

```ts
supabase.from("conductores").select("id").eq("auth_user_id", userId)
```

RLS bloquea la lectura → devuelve 0 filas → el código lanza "No estás vinculado como conductor", aunque en realidad sí lo está.

## Solución

Agregar una política SELECT que permita al conductor leer **su propia fila** usando `auth_user_id = auth.uid()`. Lo mismo en UPDATE por si en el futuro el conductor edita su perfil.

### Migración (1 sola)

```sql
-- Conductor puede leer su propia fila
CREATE POLICY "conductor_select_own_row"
  ON public.conductores
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Conductor puede actualizar campos básicos de su fila (foto, teléfono, etc.)
CREATE POLICY "conductor_update_own_row"
  ON public.conductores
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
```

No expone datos sensibles a otros usuarios: cada conductor solo ve la fila cuyo `auth_user_id` coincide con su sesión.

## Resultado

- Conductor toca "Estoy en línea" → `getConductorId` encuentra la fila → upsert en `conductor_ubicaciones` funciona (esa tabla ya tiene RLS correcta basada en `auth_user_id`).
- Admin y monitoreo siguen viendo todos los conductores como antes (políticas existentes intactas).
- Pasajero sigue viendo la ubicación vía la función `get_ubicacion_conductor_para_pasajero` (SECURITY DEFINER, no depende de RLS de `conductores`).

## Archivos a modificar

Solo una migración SQL. No hay cambios de código frontend ni server functions.

¿Apruebas para aplicar la migración?