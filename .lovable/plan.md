## Objetivo
Que al hacer clic en "Editar" (lápiz) de un vehículo, el formulario se abra como una ventana modal sobrepuesta (igual que "Ver documentos y conductores"), en lugar de expandirse arriba del listado.

## Cambios (solo `src/routes/vehiculos.tsx`)

1. Envolver el bloque `showForm && (<form>…</form>)` (líneas ~294-367) dentro de un `<Dialog>` de shadcn, reutilizando el mismo patrón que ya usa el modal de detalles del vehículo (líneas 496-533):
   - `<Dialog open={showForm} onOpenChange={(o) => !o && cancelForm()}>`
   - `<DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">`
   - `<DialogHeader><DialogTitle>{editingId ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle></DialogHeader>`
   - Mover el `<form>` (grid de campos + botones Cancelar/Guardar) dentro del `DialogContent`.
   - Quitar el `<p>` de título duplicado dentro del form (ahora lo pone el `DialogTitle`).

2. Asegurar que `startEdit(v)` siga haciendo `setShowForm(true)` + `setEditingId(v.id)` — con el Dialog el foco irá automáticamente al modal (sin necesidad de hacer scroll), resolviendo el problema de "se despliega muy arriba".

3. No tocar el botón "Nuevo vehículo": abrirá el mismo Dialog en modo creación.

4. No cambiar lógica de guardado, validación, fotos ni asignación de conductores.

## Verificación
- Clic en lápiz de una tarjeta → aparece modal centrado con los datos del vehículo cargados.
- Clic en "Nuevo vehículo" → aparece el mismo modal vacío.
- Cerrar con la X, Escape o clic fuera llama a `cancelForm()` (limpia `editingId` y `showForm`).
- Guardar/Actualizar cierra el modal y refresca la lista como hoy.