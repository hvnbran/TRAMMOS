## Objetivo

Eliminar `CrmSidebar` y rediseñar el chrome del portal CRM con un **header de dos filas + pills de navegación** (Opción C), manteniendo paleta TRAMMOS (cyan/lime/gris).

## Estructura visual

```text
┌────────────────────────────────────────────────────────────────────┐
│  [logo]  TRAMMOS CRM Comercial                  [AG]  [Salir CRM] │
│          Gestión de clientes y asesores                            │
│                                                                     │
│   ▰ Dashboard   ◌ Clientes   ◌ Asesores   ◌ Concesionarios   ◌ Eq.│
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                       <Outlet /> (ancho completo)                  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

- **Fila 1 (branding):** fondo blanco, borde inferior fino. Logo + "TRAMMOS CRM Comercial" como título grande + subtítulo gris pequeño. A la derecha: avatar con iniciales + botón "Salir del CRM".
- **Fila 2 (navegación):** pills horizontales. Activa rellena con `bg-primary` (cyan) + texto blanco + acento lime sutil (borde inferior o punto). Inactivas: outline gris, hover suave.
- **Borde divisor inferior** con gradiente cyan→lime (igual al que ya usa el `SiteFooter`) como firma visual del CRM.
- En móvil (`< md`): las pills se vuelven scroll horizontal con scrollbar oculto.

## Archivos

**Editar:**
- `src/components/crm/CrmLayout.tsx` — reescribir para usar el nuevo header de dos filas en lugar de incrustar `<CrmSidebar />`. Estructura: `<div className="min-h-screen flex flex-col">` con `<header>` + `<main className="flex-1">{children}</main>` + `<SiteFooter variant="compact" />`.

**Eliminar:**
- `src/components/crm/CrmSidebar.tsx` — ya no se usa.

**Sin tocar:**
- `src/routes/crm.tsx` y rutas hijas — siguen funcionando con el mismo `<Outlet />`.
- `AppLayout` del panel admin — no cambia (mantiene su sidebar oscuro).
- Lógica de auth (`verifyCrmAccess`, `beforeLoad`) — intacta.

## Detalles técnicos

- Pills: componente local `<NavPill to label icon active />` que usa `<Link>` de TanStack Router + `useRouterState` para detectar activa.
- Items: `Dashboard (/crm)`, `Clientes (/crm/clientes)`, `Asesores (/crm/asesores)`, `Concesionarios (/crm/concesionarios)`, `Equipo (/crm/equipo)` — el de Equipo sólo se muestra si `role === 'admin'`.
- "Salir del CRM" hace `navigate({ to: '/' })` (vuelve al panel admin) si el usuario tiene rol admin; si es CRM-only, hace `signOut()`.
- Contenedor interno: `max-w-7xl mx-auto px-4 md:px-8 py-6` para que el contenido respire pero use ancho completo cuando hace falta.

## Validación

- Tabs cambian de ruta sin recargar (TanStack `<Link>`).
- La pill activa se actualiza al navegar.
- Botón hamburguesa NO se necesita: las pills caben en scroll horizontal incluso en 360px.
- Build pasa sin warnings (eliminar import de `CrmSidebar`).
