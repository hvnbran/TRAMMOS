
## Módulo CRM (nueva sección)

Se crea como **módulo aparte** accesible desde el sidebar (`/crm`), no dentro del panel actual de operación. Solo visible para admin.

### Estructura de navegación

```
Sidebar
└── CRM (nuevo grupo)
    ├── Clientes        /crm/clientes
    ├── Asesores        /crm/asesores
    └── Concesionarios  /crm/concesionarios
```

Cada pantalla: listado con buscador + filtros + botón "Nuevo" que abre un modal con formulario.

### Entidades (base de datos)

**`crm_concesionarios`**
- nombre, ciudad, dirección, telefono, email
- ubicación (lat/lng opcional)
- activo

**`crm_asesores`**
- nombre, cédula, teléfono, email, fecha_nacimiento
- concesionario_id (FK)
- cargo (ej: "Asesor comercial", "Jefe de ventas")
- activo, foto_url

**`crm_clientes`** (leads)
- nombre, cédula, teléfono, email, fecha_nacimiento
- direccion, ciudad
- **temperatura**: `frio` | `tibio` | `caliente`
- asesor_id (FK, opcional) — quién lo atiende
- concesionario_id (FK, opcional) — dónde se atendió
- origen (cómo llegó: referido, web, visita, etc.)
- notas (texto libre)
- ultima_interaccion (fecha)

Las 3 tablas con RLS: solo `admin` puede ver/editar (`has_role(auth.uid(), 'admin')`).

### Pantallas

1. **`/crm`** (índice) — Dashboard rápido: total clientes por temperatura, próximos cumpleaños (7 días), conteos por concesionario.
2. **`/crm/clientes`** — Tabla con: nombre, temperatura (badge color), asesor, concesionario, teléfono, cumpleaños. Filtros: temperatura, concesionario, asesor. Buscador por nombre/cédula/teléfono. Click → modal de detalle/edición.
3. **`/crm/asesores`** — Tabla con: nombre, cargo, concesionario, teléfono, cumpleaños, # clientes asignados.
4. **`/crm/concesionarios`** — Tarjetas o tabla con: nombre, ciudad, dirección, # asesores, # clientes.

### Detalles UI

- **Temperatura**: badge con color — frío (azul), tibio (ámbar), caliente (rojo/lime). Editable inline desde la fila.
- **Cumpleaños**: indicador visual si el cumple cae en los próximos 7 días.
- **Formularios**: validación con `zod` (igual que el resto del proyecto).
- Reutiliza componentes existentes: `Card`, `Table`, `Dialog`, `Badge`, `Input`, `Select`.

### Archivos a crear

- `supabase/migrations/<timestamp>_crm.sql` — 3 tablas + GRANTs + RLS admin-only + índices.
- `src/routes/crm.tsx` — layout con `<Outlet />` + tabs/sub-nav del módulo.
- `src/routes/crm.index.tsx` — dashboard.
- `src/routes/crm.clientes.tsx`, `src/routes/crm.asesores.tsx`, `src/routes/crm.concesionarios.tsx`.
- `src/components/crm/ClienteForm.tsx`, `AsesorForm.tsx`, `ConcesionarioForm.tsx` — modales de alta/edición.
- `src/components/crm/TemperaturaBadge.tsx`.
- `src/lib/crm/crm.functions.ts` — server functions con `requireSupabaseAuth` para CRUD (admin-only validado en server).
- Editar `src/components/layout/Sidebar.tsx` — añadir grupo "CRM" visible solo para admin.

### Lo que NO se incluye en esta primera versión

- Importar Excel/CSV (puede añadirse luego con el mismo patrón que `ImportarExcelModal`).
- Historial de interacciones / pipeline (se puede añadir como tabla `crm_interacciones` después).
- Notificaciones automáticas de cumpleaños (se reaprovecharía `push_notifications_queue` cuando se quiera).
- Rol "asesor" con login propio.

¿Lo construyo así?
