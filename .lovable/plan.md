

## Objetivo

Convertir la sección **Reportes Disponibles** en un módulo funcional que descargue archivos reales con los datos en vivo de la base (servicios, vehículos, conductores, calificaciones, incidentes, facturación), y conectar también las gráficas superiores a datos reales en lugar de los valores hardcodeados.

## Qué descargará cada reporte

Cada botón generará un archivo descargable directamente en el navegador. Formatos propuestos:

| Reporte | Formato | Contenido (datos reales) |
|---|---|---|
| Servicios realizados por período | **Excel (.xlsx)** | Tabla de `servicios` filtrada por rango de fechas: N° orden, fecha, hora, origen, destino, pasajero, conductor, vehículo, centro de costo, estado |
| Cumplimiento ANS detallado | **PDF** | Resumen por categoría (Operativas, Vehículo, Conductor, Facturación, Atención) con % de cumplimiento, total/cumplidos, calculado desde `servicios`, `vehiculos`, `conductores` |
| Uso de vehículos por mes | **Excel (.xlsx)** | Por cada vehículo: placa, marca, línea, # servicios del mes, estado, vencimiento SOAT/RTM |
| Rendimiento de conductores | **Excel (.xlsx)** | Por cada conductor: nombre, cédula, # servicios, % cumplimiento, estado licencia |
| Facturación por centro de costo | **Excel (.xlsx)** | Agrupado por `centro_costo`: cantidad de servicios, conductores únicos, vehículos únicos, total estimado |
| Documentos por vencer | **Excel (.xlsx)** | SOAT, RTM (vehículos) y licencias (conductores) que vencen en los próximos 60 días, ordenados por fecha de vencimiento |

Además, el botón **"Exportar"** del header descargará un Excel con **todas** las hojas anteriores en un solo archivo.

## Cómo conectaremos los datos

1. **Hook `useReportesData`** que carga en paralelo: `servicios`, `vehiculos`, `conductores`, `calificaciones`, `incidentes` aplicando el filtro por `cliente` (admin ve todo, corona/sodimac solo lo suyo).
2. **Gráficas superiores dinámicas**:
   - "Servicios por Mes" → agrupar `servicios` por mes (últimos 6 meses), contar total y `estado='Finalizado'`.
   - "Cumplimiento ANS (%)" → calcular % de finalizados vs total por mes.
3. **Selector de rango de fechas** arriba (defecto: últimos 30 días) que aplica a los reportes que dependen de período.
4. **Modal de filtros opcional por reporte** (período, cliente si es admin) antes de descargar.

## Generación de archivos en el cliente

- **Excel**: usaremos la librería `xlsx` (SheetJS) — pura JS, funciona en navegador, permite múltiples hojas, formato y autoancho de columnas.
- **PDF**: usaremos `jspdf` + `jspdf-autotable` para tablas formateadas con el branding TRAMMOS (cyan/lime).
- Los archivos se generan en memoria y se disparan con `Blob` + descarga automática — no requiere backend ni guardar nada.
- Cada archivo incluirá: logo/encabezado TRAMMOS, cliente (Corona/Sodimac/Todos), rango de fechas, fecha de generación.

## UX al hacer clic

1. Clic en el botón del reporte → spinner pequeño en el ícono.
2. Se cargan los datos relevantes desde Supabase (si no están ya en caché).
3. Se genera el archivo y se dispara la descarga.
4. Toast de confirmación: "Reporte descargado".
5. Si no hay datos: toast "No hay datos para el período seleccionado".

## Detalles técnicos

- **Dependencias nuevas**: `xlsx`, `jspdf`, `jspdf-autotable`.
- **Archivos a modificar**:
  - `src/routes/reportes.tsx` — convertir gráficas a datos reales, conectar botones, agregar selector de fecha.
- **Archivos nuevos**:
  - `src/lib/reportes/data.ts` — fetchers desde Supabase con filtro por cliente.
  - `src/lib/reportes/excel.ts` — generadores de cada Excel (uno por reporte + uno consolidado).
  - `src/lib/reportes/pdf.ts` — generador del PDF de Cumplimiento ANS.
  - `src/lib/reportes/utils.ts` — helpers de formato (fechas, agrupado por mes, nombre de archivo).
- **Permisos**: la página ya está protegida por `<AdminOnly>`. Las RLS existentes ya filtran por `cliente`, así que el admin ve todo y los clientes solo lo suyo automáticamente.
- **Sin cambios en base de datos**: todo se calcula desde las tablas existentes.

