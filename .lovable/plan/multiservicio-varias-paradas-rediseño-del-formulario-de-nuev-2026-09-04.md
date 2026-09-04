# Multiservicio (varias paradas) + rediseño del formulario de nuevo servicio

## Qué va a cambiar

### 1. Multidestino / Multiservicio
- Nueva casilla "Multidestino (varias paradas)" en el formulario.
- Al activarla aparece una lista ordenada de paradas: se puede agregar, quitar y reordenar cada parada (dirección con buscador, hora estimada opcional y nota corta).
- El origen sigue siendo único; el "destino" del servicio se guarda como la última parada, así los listados, monitoreo y reportes actuales siguen funcionando igual.
- En la tarjeta del servicio se ve "Multiservicio · N paradas" con la ruta completa.
- La app del conductor muestra las paradas en orden dentro del detalle del servicio.

### 2. Orden de servicio automática
- El campo N° de orden se llena solo con el formato `OS-000123` (consecutivo, sin repetir).
- Se muestra en gris como campo bloqueado por defecto, con un enlace pequeño "editar" para casos excepcionales.

### 3. Formulario más organizado (desplegable, mismo estilo)
Se reorganiza en bloques con títulos, centrado y más aire:
1. **Datos de la orden** — orden (automática), fecha, hora, cliente (solo admin).
2. **Ruta** — origen y destino centrados en dos columnas anchas; casilla de multidestino justo debajo con las paradas.
3. **Pasajero** — primero "Pasajero registrado" (perfil, con su brief); debajo un bloque separado titulado **PASAJERO NO REGISTRADO** para el nombre libre.
4. **Asignación** — conductor y vehículo.
5. **Estado** — con los mismos colores que ya usan las tarjetas.

### 4. Conductor y vehículo con fotos
- El selector de conductor pasa a ser un desplegable con foto de perfil, nombre y placa asignada.
- El de vehículo también: foto del vehículo (o icono), placa, marca y línea.
- Se conservan las reglas actuales: solo conductores/vehículos del cliente, activos y con documentos vigentes; al elegir conductor se autocompleta su placa.

### 5. Hospital del Sur
- El campo "Centro de costo" queda oculto para Hospital del Sur (se mantiene para Corona y Sodimac).
- Multiservicio disponible para Hospital del Sur (y también para admin).
- El estado se muestra con etiqueta de color.

## Detalles técnicos
- Migración: tabla `servicio_paradas` (servicio_id, orden, direccion, hora_estimada, nota) con GRANTs y RLS por cliente/rol, igual que `servicios`; columna `es_multidestino boolean default false` en `servicios`.
- Consecutivo de orden: secuencia en base de datos + función `siguiente_orden_servicio()` que devuelve `OS-000123`; el formulario la consulta al abrirse.
- El formulario de `src/routes/servicios.tsx` se divide en secciones y se extraen dos componentes reutilizables: `ConductorPicker` y `VehiculoPicker` (con `PersonaAvatar` para las fotos).
- Detalle del servicio en la app del conductor lee `servicio_paradas` por `servicio_id`.
