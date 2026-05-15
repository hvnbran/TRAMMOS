
# Monitoreo en vivo estilo GPSWOX

## 1. Limpieza en /vehiculos
- Quitar el bloque `GpsManager` de `src/routes/vehiculos.tsx` (sin borrar el componente todavía, lo movemos a Monitoreo como panel lateral colapsable solo-admin para vincular GPS↔placa cuando haga falta).

## 2. ¿Importar a nuestro mapa o embeber el de ellos?

**Recomendación: seguir con nuestro mapa propio (lo que ya tienes).** Razones:

- Ya tenemos los datos en `vehiculos_gps` actualizándose cada 30 s vía cron + realtime de Supabase. La data es nuestra, no dependemos de que la sesión de GPSWOX esté abierta.
- Podemos cruzar GPS con `vehiculos`, `servicios`, `solicitudes_pasajero` (mostrar conductor, pasajero asignado, estado del viaje sobre el marcador). Eso un iframe de GPSWOX no lo puede hacer.
- Branding TRAMMOS, accesibilidad (PCD), idioma y UX consistentes con el resto.
- GPSWOX no ofrece embed oficial confiable: meterlo por iframe rompe por cookies de terceros, login, y expone credenciales.

Embebería el mapa de GPSWOX **solo** como "vista avanzada" opcional (botón "Abrir consola GPSWOX" que abre `serverusa.digital` en pestaña nueva) para diagnóstico técnico. No como vista principal.

## 3. Rediseño de /monitoreo (parecido a GPSWOX)

Layout nuevo a 2 columnas (desktop) / tabs (móvil):

```text
┌─────────────────────────┬──────────────────────────────┐
│  Lista de vehículos     │                              │
│  ────────────────────   │                              │
│  🟢 ESR719  ABC123      │       MAPA GRANDE            │
│     45 km/h · hace 12s  │       (toda la altura)       │
│  🟢 GPS-002 XYZ789      │                              │
│     detenido · 2 min    │                              │
│  ⚫ GPS-003 (offline)    │                              │
│     hace 3 h            │                              │
│                         │                              │
│  [🔍 buscar placa]      │                              │
│  [▢ solo en línea]      │                              │
│  [▢ con servicio activo]│                              │
└─────────────────────────┴──────────────────────────────┘
```

Cambios concretos:

1. **Mostrar TODOS los GPS activos**, no solo los que tienen servicio. La fuente es `vehiculos_gps` (no `servicios` como hoy en el panel lateral).
2. **Lista lateral viva** ordenada por: en línea primero, luego por última actualización. Cada item:
   - Punto de color (verde online, ámbar idle/sin movimiento, gris offline).
   - Placa + nombre dispositivo.
   - Velocidad o "detenido".
   - "hace X seg/min" desde `last_fix_at`.
   - Si tiene servicio en curso (cruce con `servicios.estado='En curso'`), badge "En servicio" + nombre conductor/pasajero.
3. **Click en item → centrar mapa + abrir popup** (sincronizar lista ↔ mapa).
4. **Mapa**:
   - Mantener Leaflet + tiles CARTO.
   - Marcadores con **flecha rotada según `last_course`** (como GPSWOX) en lugar de círculo plano.
   - Color por estado (online cian / idle ámbar / offline gris).
   - Auto-fit inicial; después no auto-mover (respetar zoom del usuario).
   - Botón "Centrar en todos" y "Centrar en mi ubicación".
   - Opcional fácil: tooltip permanente con la placa al hacer hover.
5. **Filtros arriba de la lista**: buscar por placa/dispositivo, toggle "solo en línea", toggle "con servicio activo".
6. **Indicador global**: "X en línea · Y offline · última sync hace Zs" (usando max de `last_synced_at`).
7. **Realtime ya está** en `MonitoreoMap`; lo extendemos también a la lista con el mismo canal.
8. **Panel admin colapsable** (reemplaza al de /vehiculos): vincular GPS sin placa a un vehículo + botón "Forzar sincronización". Solo visible para `admin`.

## 4. Cómo hacemos que sean "los carros activos reales"

- Los carros aparecen automáticamente en el mapa **en cuanto el GPS reporta** (el cron upsert ya los crea en `vehiculos_gps`).
- "Activo" = `online ∈ ('online','ack','engine')` **o** `last_fix_at < 5 min`. Si está más viejo, lo marcamos offline pero seguimos mostrándolo (atenuado) — igual que hace GPSWOX.
- Para que la placa salga (no solo "ESR719"), hay que **vincular dispositivo↔vehículo** una vez. Se hace desde el panel admin del propio Monitoreo. Después queda permanente.

## 5. Archivos a tocar

- `src/routes/vehiculos.tsx` — quitar import y render de `GpsManager`.
- `src/routes/monitoreo.tsx` — rehacer layout (lista + mapa + filtros + admin panel).
- `src/components/MonitoreoMap.tsx` — marcadores tipo flecha rotada, exponer "centrar en id" vía prop/ref, no auto-fit en updates posteriores.
- `src/components/monitoreo/VehiculosLiveList.tsx` (nuevo) — lista lateral con realtime y filtros.
- `src/components/vehiculos/GpsManager.tsx` — moverlo/encogerlo a panel admin dentro de Monitoreo (mismo componente, solo cambia dónde se renderiza).

Sin cambios de DB ni de cron — la data ya está lista.

---

**¿Te late así? ¿O prefieres que el panel admin de vinculación se quede en /vehiculos en vez de moverlo a /monitoreo?**
