
# Plan CRM Comercial TRAMMOS — Estado actual y roadmap

## 1) Qué ya tenemos hoy en el módulo CRM

Tablas y rutas existentes:
- `crm_clientes` (nombre, contacto, fecha nacimiento, temperatura frío/tibio/caliente, asesor, concesionario, origen, notas, última interacción) → `/crm/clientes`
- `crm_asesores` (datos, cargo, concesionario, activo) → `/crm/asesores`
- `crm_concesionarios` (empresa, NIT, ciudad, contacto, lat/lng) → `/crm/concesionarios`
- `/crm/equipo` para otorgar acceso CRM con contraseña
- Dashboard `/crm` con: total clientes, asesores, concesionarios, próximos cumpleaños (7 días) y conteo por temperatura

Lo que **ya está cubierto** del listado pedido:
- Prospecto base (cliente + origen + temperatura + asesor + concesionario)
- Cumpleaños próximos
- Productividad muy básica (clientes por asesor)

Todo lo demás (oportunidades, ventas de vehículos, créditos, SOAT, GPS, gas, accesorios, emblemas, uniformes, comisiones, metas, cartera, rentabilidad) **no existe** y hay que construirlo.

## 2) Estrategia

El alcance es enorme, así que lo divido en **6 fases entregables**, cada una se aprueba e implementa por separado. Después de esta aprobación general, al inicio de cada fase confirmo modelo de datos y pantallas concretas antes de codificar.

Modelo de datos común a todas las fases:
- Tabla `crm_oportunidades` como núcleo: una oportunidad por intento de venta (cliente + asesor + concesionario + vehículo deseado + estado + fechas). De ella cuelgan venta, crédito, pólizas, accesorios, GPS, gas, emblemas, uniformes.
- Cada ítem vendido (vehículo, SOAT, accesorio, GPS, gas, emblemas, uniforme) guarda: `precio_cliente`, `costo_proveedor`, `comision_asesor`, `comision_trammos` → con esto se calculan automáticamente rentabilidad, comisiones y reportes gerenciales.
- Tabla `crm_metas` (asesor/global, periodo diario/semanal/mensual/anual, valor meta, tipo: ventas/ingresos/conversión).
- Tabla `crm_interacciones` para registrar seguimiento comercial (llamadas, visitas, cotizaciones, WhatsApp).

---

## Fase 1 — Pipeline comercial (prospectos → oportunidades → cierre)

Nuevas tablas: `crm_oportunidades`, `crm_interacciones`, `crm_cotizaciones`.

Funciones:
- Pipeline visual tipo kanban por estado: Prospecto → Contactado → Cotizado → Negociación → Ganado / Perdido.
- Registro de interacciones (tipo, fecha, nota, próximo seguimiento + recordatorio).
- Cotizaciones (monto, vehículo, vigencia, estado).
- Métricas: nº prospectos, tasa de conversión, tiempo promedio de cierre, motivos de pérdida, fuente del prospecto.
- En la ficha del cliente: timeline de interacciones y oportunidades.

Pantallas nuevas: `/crm/pipeline`, `/crm/oportunidades/$id`, sección "Seguimiento" dentro de cada cliente.

## Fase 2 — Ventas de vehículos + comisiones

Nuevas tablas: `crm_vehiculos_catalogo` (marca/línea/tipo), `crm_ventas` (oportunidad, vehículo, fecha, precio_cliente, costo, margen, comisión asesor, comisión Trammos, estado entrega, fecha entrega).

Funciones:
- Registrar venta cerrada y entrega.
- Ticket promedio, margen de utilidad, vehículo más vendido, ranking de asesores, tiempo de entrega.
- Cada venta dispara la creación de los servicios derivados (SOAT, GPS, gas, accesorios, emblemas, uniforme) en estado "Pendiente".

## Fase 3 — Financiación, créditos y capacidades

Nuevas tablas: `crm_creditos` (entidad, valor financiado, cuota inicial, estado aprob./rech., fecha solicitud, fecha aprobación, mora), `crm_capacidades` (cupo, asignada/disponible, rentabilidad, documentación pendiente, fecha activación).

Funciones:
- Indicadores: tasa de aprobación, tiempo promedio de aprobación, mora, entidad más usada, cupos disponibles vs asignados, rentabilidad por capacidad.
- Checklist de documentación pendiente por habilitación con alertas.

## Fase 4 — Pólizas, GPS, gas, accesorios, emblemas, uniformes

Modelo unificado: tabla `crm_servicios_adicionales` con columna `tipo` (`soat`, `poliza_contrac`, `poliza_extra`, `gps`, `gas`, `accesorio`, `emblema`, `uniforme`) + campos comunes (proveedor, fecha emisión, fecha vencimiento, precio_cliente, costo_proveedor, comision_asesor, comision_trammos, estado instalación, observaciones, archivo adjunto).

Funciones:
- Vista por vehículo y por cliente con todos sus servicios y vencimientos.
- Alertas automáticas de SOAT/pólizas/plataforma GPS próximas a vencer (30/15/7 días) integradas con la campana de notificaciones existente.
- Reportes: valor cobrado vs costo vs margen por tipo de servicio, instalaciones pendientes, renovaciones realizadas, taller aliado más usado.

## Fase 5 — Metas, cartera y tablero gerencial

Nuevas tablas: `crm_metas`, `crm_facturas_crm` (o reutilizar `facturas` con vínculo a venta) para cartera.

Tablero `/crm` ampliado con:
- Metas diaria/semanal/mensual/anual por asesor y global, con barra de avance en número y porcentaje y semáforo.
- Ventas del mes, conversión comercial, tiempo promedio de cierre.
- Cartera vencida, rentabilidad por capacidad/vehículo, costos operativos.
- Cumplimiento documental (% de vehículos con docs al día).
- Productividad por asesor (oportunidades creadas, ganadas, ingresos, comisión generada).
- Análisis automático: "vamos X% por encima/debajo de la meta", tendencia vs mes anterior.

## Fase 6 — Reportes, exportes y permisos finos

- Exportar a Excel/PDF cada vista clave (igual que ya hace `/reportes`).
- Vista "Mi panel" para asesores: solo sus oportunidades, sus comisiones, sus metas.
- Refinar RLS para que cada asesor vea solo lo suyo y admin/CRM vean todo.
- Recordatorios automáticos (cumpleaños, vencimientos, seguimientos pendientes) por correo y push.

---

## Detalles técnicos (referencia)

- Base de datos: migraciones Supabase, RLS con `has_crm_access(auth.uid())`; para asesores se añadirá `crm_asesores.auth_user_id` y políticas `asesor_owns_row`.
- Frontend: TanStack Router + Supabase client + Recharts (ya en uso) para dashboards.
- Notificaciones de vencimientos: reutilizar `push_notifications_queue` y cron existente.
- Cada fase incluye: migración SQL, server functions cuando aplique, rutas nuevas, vinculación al menú del `CrmLayout`.

## Cómo procedemos

Confirmás esta hoja de ruta y arrancamos por **Fase 1 (Pipeline comercial)**. Antes de codificar la Fase 1 te muestro el esquema exacto de campos del kanban + interacciones para validación. Si querés reordenar o juntar fases (por ejemplo arrancar por Ventas + Comisiones), avisame y reorganizo.
