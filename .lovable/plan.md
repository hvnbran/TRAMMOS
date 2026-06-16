## Qué quieres lograr

En la página **Conductores** queremos que cada conductor se vea como una mini ficha con su **foto de perfil**, y al hacer click en la foto (o en un botón "Ver perfil") se abra una ventana grande con sus datos, vehículos asignados y todos sus documentos — igual que ya funciona en **Vehículos**.

## Buena noticia

Casi todo ya existe en el proyecto:

- `ConductorProfileModal.tsx` ya muestra foto + datos + vehículos asignados + `DocumentManager` con `TIPOS_CONDUCTOR`, y permite **subir/cambiar la foto** desde ahí.
- El bucket `vehiculos-fotos` ya guarda fotos de conductor (`conductores/...`).
- La columna `conductores.foto_url` ya existe.

Lo único que falta es **enchufarlo en la página `/conductores`** (hoy solo despliega los documentos en un acordeón, sin foto ni modal).

## Cambios

### 1. `src/routes/conductores.tsx` — rediseñar la tarjeta
- Añadir `foto_url` al `select` y al tipo `ConductorRow`.
- Cambiar el layout de cada tarjeta para que se parezca al de vehículos:
  - **Avatar circular grande** a la izquierda (foto del conductor o iniciales como fallback usando `PersonaAvatar`).
  - Click sobre el avatar → abre el modal.
  - Nombre, cédula, estado, badges de cliente al lado derecho.
  - Datos rápidos abajo (teléfono, licencia, vencimiento).
- Reemplazar el botón actual "Documentos" (acordeón con `DocumentManager`) por **"Ver perfil y documentos"** que abre `ConductorProfileModal`.
- Quitar el `expanded` / inline `DocumentManager` (ya vive dentro del modal, evita duplicar).
- Mantener los botones existentes: Editar, Eliminar, Generar acceso.

### 2. Estado nuevo
- `const [modalConductorId, setModalConductorId] = useState<string | null>(null)`.
- Renderizar `<ConductorProfileModal conductorId={modalConductorId} onClose={() => { setModalConductorId(null); load(); }} />` al final (el `load()` en `onClose` refresca la foto si la cambiaron).

### 3. Avatar component
- Reutilizar `PersonaAvatar` (ya existe). Tamaño grande (`h-16 w-16` o similar) con borde sutil y cursor `pointer`.

## Lo que NO cambia
- `ConductorProfileModal.tsx` ya funciona — no se toca.
- `DocumentManager` ya soporta `kind="conductor"` — no se toca.
- Subida de foto, RLS del bucket, tipos de documento: todo ya está.
- Tabla `conductores`: no se necesita migración.

## Detalles técnicos
- Archivos modificados: solo `src/routes/conductores.tsx`.
- Sin cambios de base de datos, sin nuevas dependencias.
- El modal ya gestiona Escape para cerrar, scroll interno, y upload con validación 5 MB / image/*.

¿Lo aplico así?