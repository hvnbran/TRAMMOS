## Tanda 1 — Chrome del panel admin responsive

Hacer que `Sidebar` + `AppLayout` funcionen bien en celular (vertical y horizontal) sin perder funcionalidad. El portal CRM ya quedó responsive en la tanda anterior.

## Cambios

### 1. `Sidebar.tsx` — dos modos según viewport

- **`≥ md` (desktop/tablet horizontal):** comportamiento actual. Sidebar fija a la izquierda, expandible/colapsable entre 240px y 68px. Sin cambios funcionales.
- **`< md` (móvil):** se convierte en **drawer overlay**.
  - Oculta de la fila normal (`hidden md:flex`).
  - Se renderiza como `<aside fixed inset-y-0 left-0 z-50 w-[260px]>` que entra desde la izquierda con `translate-x` animado.
  - Backdrop oscuro semitransparente (`bg-black/50`) que cierra al hacer clic.
  - Cierre automático al cambiar de ruta (`useEffect` sobre `location.pathname`).
  - Cierre al presionar `Escape`.
  - Bloquea el scroll del `body` mientras está abierto.
- Estado `mobileOpen` se eleva: la sidebar recibe `mobileOpen` y `onClose` por props desde `AppLayout` (necesario para que el botón hamburguesa del header lo controle).

### 2. `AppLayout.tsx` — header compacto + hamburguesa

- Estado local `mobileNavOpen` que controla el drawer.
- **Hamburguesa** (icono `Menu` de lucide) visible solo en `< md`, a la izquierda del header. Pulsa → `setMobileNavOpen(true)`.
- Header: padding pasa de `px-6` a `px-3 md:px-6`. Altura se mantiene.
- `GlobalSearch`: en `< md` se colapsa a un **botón-icono lupa** que abre la búsqueda en overlay (si el componente ya soporta apertura programática, lo controlamos por estado; si no, lo envolvemos en un `Sheet`-like simple).
- Botón "CRM" (admin): ya tiene `hidden sm:inline-flex`, lo dejamos así. **Además** lo añadimos como ítem dentro del drawer móvil para que admins lo encuentren ahí (sólo si `role === 'admin'`).
- Avatar: en `< md` mostramos solo iniciales (ya está así).
- `<main>`: padding pasa de `p-6` a `p-3 sm:p-4 md:p-6`.

### 3. `SiteFooter` — compacto en móvil

- Revisar variantes existentes; si el `full` queda muy alto en móvil, reducir a columnas únicas + tipografías más pequeñas. (Cambios mínimos, solo clases responsivas.)

## Archivos

**Editar:**
- `src/components/layout/Sidebar.tsx` — agregar modo drawer móvil, props `mobileOpen` + `onClose`.
- `src/components/layout/AppLayout.tsx` — agregar hamburguesa, gestionar estado, colapsar GlobalSearch.
- `src/components/layout/SiteFooter.tsx` — pequeños ajustes responsivos si es necesario.

**Sin tocar:**
- Lógica de navegación, ítems del menú, auth, roles.
- Componente CRM (ya hecho).
- Páginas internas (vienen en tanda 2).

## Detalles técnicos

- Breakpoint: `md` (768px). En tablet horizontal (≥768px) ya hay espacio para sidebar fija.
- Animación: `transition-transform duration-300 ease-out`.
- Accesibilidad: el drawer usa `role="dialog"`, `aria-modal="true"`, `aria-label="Navegación principal"`. Hamburguesa con `aria-expanded` y `aria-controls`.
- Sin dependencias nuevas; usar `useState` + `useEffect` + Tailwind. No requiere `Sheet` de shadcn (más simple así).

## Validación

- En 360–414px: la sidebar aparece como drawer al pulsar hamburguesa, se cierra al elegir un ítem o tocar el backdrop.
- En ≥768px: sidebar visible siempre, hamburguesa oculta, comportamiento idéntico al actual.
- Header no se desborda en ninguna anchura.
- El contenido no queda tapado por la sidebar fija en móvil.
- Atajo `Escape` cierra el drawer.
