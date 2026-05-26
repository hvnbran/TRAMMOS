## Portal CRM independiente

El CRM deja de vivir dentro del panel de administración. Pasa a ser un **portal aparte** (como `/conductor` y `/pasajero`), con su propio login, su propio layout, su propio dashboard. El botón "CRM" del header de admin lleva ahí. Solo lo ven los admins.

### Cómo se ve el flujo

```
Panel admin (/) ──[botón CRM en header, solo admins]──▶ /crm/login
                                                            │
                                                            ▼
                                                  Portal CRM aislado
                                                  ┌────────────────────────┐
                                                  │ Sidebar CRM propia     │
                                                  │ • Dashboard            │
                                                  │ • Clientes (leads)     │
                                                  │ • Asesores             │
                                                  │ • Concesionarios       │
                                                  │ • Equipo CRM (usuarios)│
                                                  └────────────────────────┘
```

- El portal CRM **no muestra** la sidebar de TRAMMOS (servicios, vehículos, etc.).
- El panel admin **no muestra** secciones CRM en su sidebar (ya está limpio).
- Corona, Sodimac, pasajeros y conductores nunca ven el botón ni pueden entrar a `/crm/*`.

### Acceso (admins + usuarios CRM dedicados)

- **Admins de TRAMMOS**: entran al CRM automáticamente con su misma cuenta.
- **Usuarios CRM dedicados**: rol nuevo `crm` (ej. gerente comercial). Pueden entrar al CRM pero NO al panel admin. Los crea un admin desde `/crm/equipo`.
- Login en `/crm/login` con email + contraseña. Si el usuario no tiene rol `admin` ni `crm`, se le rechaza con mensaje claro.

### Identidad visual

Mismo lenguaje TRAMMOS (cyan / lime / gris, mismo logo, misma tipografía). Lo que cambia es el **chrome**: sidebar propia con secciones del CRM y un header sencillo con el usuario y "Salir del CRM" (que regresa al panel admin si era admin, o a login si era usuario CRM).

### Pantallas del portal CRM

1. **`/crm/login`** — pantalla pública, formulario email + password. Si ya estás logueado y tienes acceso, redirige a `/crm`.
2. **`/crm`** — Dashboard: totales por temperatura (fríos/tibios/calientes), próximos cumpleaños (7 días), conteos por concesionario, últimas interacciones.
3. **`/crm/clientes`** — Tabla de leads con filtros (temperatura, asesor, concesionario), buscador, formulario alta/edición, cambio rápido de temperatura.
4. **`/crm/asesores`** — Tabla de asesores con su concesionario, # clientes asignados, cumpleaños.
5. **`/crm/concesionarios`** — Tabla/cards de concesionarios con # asesores y # clientes.
6. **`/crm/equipo`** — (solo admin) Gestión de usuarios con rol `crm`: invitar, listar, revocar.

Las pantallas 2-5 ya existen como contenido; se mueven al nuevo layout y se sigue usando la misma data (`crm_clientes`, `crm_asesores`, `crm_concesionarios`). No se pierde nada.

---

### Detalles técnicos

**1. Rol nuevo y permisos**
- Migration: añadir valor `'crm'` al enum `app_role`.
- Actualizar las políticas RLS de `crm_clientes`, `crm_asesores`, `crm_concesionarios` para permitir acceso a `admin` **o** `crm`:
  ```sql
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'crm'))
  ```
- Helper `has_crm_access(uid)` (security definer) para reutilizar en server functions.

**2. Estructura de rutas (TanStack)**
- `src/routes/crm.login.tsx` — pública, formulario login. Si ya hay sesión válida con acceso, redirige a `/crm`.
- `src/routes/crm.tsx` — layout del portal: renderiza `<CrmLayout>` (sidebar CRM + header CRM + `<Outlet/>`). Hace `beforeLoad` que valida sesión + rol `admin|crm`; si no, `redirect({ to: '/crm/login' })`.
- `src/routes/crm.index.tsx` — dashboard (ya existe, se reusa).
- `src/routes/crm.clientes.tsx`, `crm.asesores.tsx`, `crm.concesionarios.tsx` — ya existen, se reusan (solo cambia el layout padre).
- `src/routes/crm.equipo.tsx` — nuevo, solo admin (validado en `beforeLoad`).
- `src/components/crm/CrmLayout.tsx` — nuevo, sidebar propia + header propio + botón "Salir del CRM".
- `src/components/crm/CrmSidebar.tsx` — nuevo, navegación interna del CRM.

**3. Header del panel admin**
- En `AppLayout.tsx` el botón "CRM" ya existe y solo se muestra a admins. Cambia su `to` para que apunte a `/crm` (ya lo hace) y se asegura `preload="intent"`. No requiere más cambios aquí.
- `AdminOnly` sigue protegiendo el panel admin como hasta ahora.

**4. Login del CRM**
- Formulario reutiliza shadcn `Input`/`Button`. Llama a `supabase.auth.signInWithPassword`.
- Tras login, server function `verify_crm_access` (con `requireSupabaseAuth`) confirma que el usuario tiene rol `admin` o `crm`. Si no, `signOut()` y mensaje "No tienes acceso al CRM".
- Login mediante Google también disponible vía broker Lovable (consistente con el resto del proyecto) — solo se acepta si el correo ya tiene rol `admin` o `crm`.

**5. Gestión de equipo CRM (`/crm/equipo`, solo admin)**
- Listado de usuarios con rol `crm` (join `user_roles` + `profiles`).
- "Invitar usuario CRM": server function admin que envía invitación por email (reutilizando el patrón ya existente del proyecto si lo hay, o creando uno con `supabaseAdmin.auth.admin.inviteUserByEmail`) y al aceptar le asigna rol `crm` automáticamente.
- "Revocar acceso": elimina la fila `user_roles` con rol `crm` para ese user.

**6. Cosas que NO cambian**
- `AppLayout`, `Sidebar` del panel principal: igual (ya están limpios).
- Datos existentes en `crm_*`: intactos.
- Roles `corona`, `sodimac`, `pasajero`, `conductor`: intactos, sin acceso al CRM.

### Lo que NO incluye esta v1
- Pipeline / historial de interacciones (tabla `crm_interacciones` futura).
- Importar leads desde Excel/CSV.
- Notificaciones automáticas de cumpleaños.
- Métricas avanzadas en el dashboard (conversión, embudo). Se puede añadir después.

¿Procedo así?