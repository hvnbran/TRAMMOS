## Ajustes al formulario "Nuevo servicio fijo"

Tres mejoras en `src/routes/servicios-fijos.tsx` (y una consulta extra a BD) para que crear un fijo sea más rápido y flexible.

### 1. Auto-traer placa del conductor
- Al cargar, además de la lista de conductores, consultar `vehiculo_conductores` para saber qué placa tiene asignada cada conductor (activa).
- Al seleccionar un conductor en el `<select>`, si tiene vehículo asignado, autocompletar `form.vehiculo` con esa placa (el usuario aún puede cambiarla manualmente).

### 2. Horario a decisión del conductor
- Añadir un checkbox: **"El conductor define hora de inicio y fin"**.
- Cuando esté marcado: ocultar los inputs de `hora_inicio_prog` / `hora_fin_prog` y guardar ambos como `null`.
- En la tabla de listado, mostrar "Libre" en la columna Horario cuando ambos sean `null`.
- El flujo del conductor ya soporta iniciar/finalizar libremente desde `ServiciosFijosHoy.tsx` (usa `conductor_iniciar_fijo` / `conductor_finalizar_fijo`), así que no hay cambios de backend.

### 3. Checkbox "Hospital del Sur Itagüí" para origen/destino
- Añadir checkbox: **"Servicio para Hospital del Sur Itagüí"** encima de Origen.
- Cuando esté marcado:
  - Ocultar los campos Origen y Destino.
  - Al guardar, poner `origen = "Hospital del Sur Itagüí"`, `destino = "Hospital del Sur Itagüí"` y `cliente = "hospital-sur"` para que quede filtrable/identificable.
- Cuando NO esté marcado: comportamiento actual (campos libres, no requeridos por el schema).

### Notas técnicas
- Solo se toca el archivo `src/routes/servicios-fijos.tsx` (UI + carga inicial + payload).
- Sin migraciones: los campos ya son nullable en `servicios_fijos`.
- Sin cambios en la app del conductor: ya maneja fijos sin horario programado.
