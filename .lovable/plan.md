

The user wants drivers and vehicles with expired documents (license, SOAT, RTM) to be automatically filtered out from selection when programming new services in `/servicios`.

Currently in `src/routes/servicios.tsx`, the conductor and vehicle fields are plain text inputs — the user types names freely. To filter expired records, we need to convert these into dropdown selectors that pull from `conductores` and `vehiculos` tables, then exclude any expired ones.

## Plan

### 1. Load active drivers and vehicles in Servicios

In `src/routes/servicios.tsx`, add two new state arrays (`conductoresDisponibles`, `vehiculosDisponibles`) and fetch them alongside services on load, filtered by:
- `cliente` (matches the form's selected client)
- Documents not expired (license for drivers; SOAT and RTM for vehicles)
- Status not "Inactivo"

Reuse the same `isVencido(date)` helper logic already implemented in `conductores.tsx` and `vehiculos.tsx` (compare against today's date).

### 2. Convert text inputs to dropdowns

Replace the free-text `<input>` fields for **Conductor** and **Vehículo (placa)** in the new-service form with `<select>` dropdowns showing only available (non-expired, active) options.

- Conductor dropdown: shows `nombre` (stores name as the value, matching current schema since `servicios.conductor` is text).
- Vehículo dropdown: shows `placa` — `marca línea` (stores `placa`).
- If admin changes the `cliente` field, the dropdowns refresh to show only that client's resources.
- Empty state: if no available resources, show "No hay conductores/vehículos disponibles" with a hint to update expired documents.

### 3. Reactive filtering by selected client

When the admin switches the cliente in the form, re-filter the dropdowns. Use a `useMemo` on the loaded lists keyed by `form.cliente`.

### 4. Edge cases

- Editing existing services: not currently supported in servicios.tsx, so no concern.
- If an existing service has a now-expired conductor/vehicle, it still displays in the list (we're only filtering the *creation* form).

### Files to modify

- `src/routes/servicios.tsx` — add fetch for conductores/vehiculos, add `isVencido` helper, replace 2 inputs with selects, add filtering logic.

### Files NOT touched

- Database schema (no changes needed)
- conductores.tsx / vehiculos.tsx (already handle expiration display)

