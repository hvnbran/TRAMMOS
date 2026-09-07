# Trammos

📘 DOCUMENTACIÓN FUNCIONAL

Sistema de Monitoreo – Empresa TRAMOS (Transporte Especial)

1. 🎯 OBJETIVO DEL SISTEMA

Desarrollar una aplicación (web + móvil) que permita:

 Gestionar conductores y su documentación legal

 Administrar vehículos de servicio público

 Controlar operaciones (centros de costos y trayectos)

 Validar cumplimiento de acuerdos operativos (ANS) como los de la imagen

 Tener trazabilidad, control y monitoreo en tiempo real

2. 🧱 ARQUITECTURA GENERAL

Módulos principales:

 Conductores

 Vehículos

 Operación / Centro de costos

 Servicios (trayectos)

 Cumplimiento ANS (Acuerdos)

 Facturación

 Monitoreo en tiempo real

 Reportes y alertas

3. 👨‍✈️ MÓDULO: CONDUCTORES

Información básica:

 Nombre completo

 Cédula

 Teléfono

 Dirección

 Foto

Documentación obligatoria (Colombia):

 Licencia de conducción (categoría C1/C2)

 RUNT

 Certificado médico vigente

 Antecedentes (policía, tránsito)

 Curso de conducción defensiva

 Contrato laboral o afiliación

Funcionalidades:

 Subir documentos (PDF/imagen)

 Control de vencimientos (alertas automáticas)

 Estado del conductor:

 Activo

 Suspendido

 Vencido

4. 🚗 MÓDULO: VEHÍCULOS (DUSTER SERVICIO PÚBLICO)

Información básica:

 Placa

 Marca: Renault

 Modelo

 Línea: Duster

 Color

 Número interno

Documentación obligatoria:

 Tarjeta de operación

 SOAT

 Revisión técnico-mecánica

 Seguro contractual y extracontractual

 Licencia de tránsito

Funcionalidades:

 Control de vencimientos

 Historial de mantenimiento

 Estado del vehículo:

 Disponible

 En servicio

 En mantenimiento

5. 🗺️ MÓDULO: OPERACIÓN / CENTRO DE COSTOS

Esto representa cómo trabaja tu empresa con Corona.

Estructura:

 Cliente: Corona

 Ciudad origen

 Ciudad destino

 Departamento

 Centro de costo

 Tipo de servicio:

 Empresarial

 VIP

 Especial

Funcionalidades:

 Crear rutas frecuentes

 Asociar tarifas

 Asignar vehículos y conductores

6. 🚕 MÓDULO: SERVICIOS (TRAYECTOS)

Información del servicio:

 Fecha y hora

 Origen

 Destino

 Usuario (pasajero)

 Centro de costo

 Conductor asignado

 Vehículo asignado

Estados:

 Programado

 En curso

 Finalizado

 Cancelado

Reglas clave (según tu imagen):

 Solicitud con mínimo 2 horas de anticipación

 Espera máxima: 20 minutos

 Cumplimiento de horarios

7. 📋 MÓDULO: CUMPLIMIENTO ANS (ACUERDOS)

Este es el corazón del control.

Basado en tu documento:

Reglas a validar automáticamente:

🚨 Operativas:

 Desviación máxima de 15 minutos

 Cumplimiento de horarios

 Tiempo de espera (20 min)

 Solicitud anticipada

🚗 Vehículo:

 Documentación vigente

 Uso de vehículos autorizados

👨‍✈️ Conductor:

 Licencia válida

 Documentos completos

💰 Facturación:

 Entrega en primeros 5 días

 Reporte de inconsistencias

📞 Atención:

 Solicitudes por correo (horario laboral)

 Call center (horario no laboral)

Funcionalidades:

 Checklist automático por servicio

 Alertas de incumplimiento

 Historial de cumplimiento por conductor/vehículo

8. 📡 MÓDULO: MONITOREO EN TIEMPO REAL

Funcionalidades:

 GPS en vivo

 Seguimiento del vehículo

 Estado del servicio

 Alertas:

 Exceso de velocidad ⚠️

 Desvío de ruta ⚠️

Integración:

 API de mapas (Google Maps o similar)

9. 🧾 MÓDULO: FACTURACIÓN

Funcionalidades:

 Generar facturas por servicios

 Asociar a centros de costo

 Exportar reportes (Excel/PDF)

Reglas:

 Facturación mensual

 Soportes obligatorios

 Control de inconsistencias

10. 📊 MÓDULO: REPORTES

Tipos:

 Servicios realizados

 Cumplimiento ANS

 Uso de vehículos

 Rendimiento de conductores

11. 🔔 SISTEMA DE ALERTAS

 Documentos por vencer

 Incumplimientos

 Retrasos

 Exceso de velocidad

 Falta de información

12. 👥 ROLES DE USUARIO

 Administrador

 Operador

 Conductor (app móvil)

 Cliente (Corona)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trammos.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bdf59e75-ba41-4181-9cd2-66cdff5e0a6a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
