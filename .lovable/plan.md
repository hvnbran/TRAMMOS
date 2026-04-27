## TRAMMOS Accesible+ — Valor diferencial para personas con discapacidad

Hoy ya tienes lo "obligatorio" (panel de accesibilidad, lectura por voz, daltonismo, etc.). Esto **te equipara** a la competencia. Para **diferenciarte** y volverlo una experiencia única, propongo construir 6 módulos que ningún competidor de transporte empresarial en Colombia ofrece junto:

---

### 1. Perfil de Accesibilidad del Pasajero (PCD Profile)

Cada pasajero (ej. empleado de Corona o Sodimac) tiene un perfil con sus necesidades, y la app **se adapta automáticamente** a él en cada servicio.

Datos del perfil (opcional, voluntario):
- Tipo de discapacidad: visual, auditiva, motriz, cognitiva, múltiple, ninguna
- Ayudas técnicas: silla de ruedas (medidas), bastón, perro guía, audífono, intérprete LSC
- Comunicación preferida: voz, texto grande, pictogramas, Lengua de Señas Colombiana
- Asistencia requerida: nivel 0–3 (autónomo → requiere acompañante)
- Contacto de emergencia + condiciones médicas relevantes (opcional, cifrado)

Beneficio diferencial: el conductor recibe automáticamente un **brief del pasajero** antes de cada servicio (sin tener que preguntar nada incómodo). Corona/Sodimac demuestran ajustes razonables documentados (Ley 1618).

---

### 2. Asistente de Voz Conversacional (TRAMI)

Más allá del botón "leer texto", un asistente de voz por IA (Lovable AI · Gemini) que permite:
- "¿A qué hora llega mi carro?" → consulta el servicio activo
- "Llama a mi conductor" → marca al teléfono
- "Necesito ayuda" → activa protocolo de emergencia (módulo 5)
- "Cancela mi servicio" → con confirmación por voz

Implementación: Web Speech API para entrada/salida + edge function que enruta intención. Funciona manos libres y es navegable solo con voz (ideal para visión cero o motricidad reducida).

---

### 3. Modo Lectura Fácil + Pictogramas (ARASAAC)

Un toggle nuevo en el panel de accesibilidad: "Modo Lectura Fácil".
Cuando se activa:
- Reescribe textos largos en frases cortas (sujeto + verbo + complemento) usando IA
- Acompaña cada acción con un **pictograma estandarizado ARASAAC** (Carro, Reloj, Casa, Documento, etc.)
- Confirmaciones con tres pasos visuales: "1. Pediste un carro 🚗 → 2. Llegará a las 3pm ⏰ → 3. Te llevará a Corona 🏢"

Beneficio: cubre discapacidad cognitiva (Síndrome de Down, autismo, daño cerebral), analfabetismo funcional y adultos mayores. Casi nadie en transporte hace esto.

---

### 4. Mapa Accesible y Tiempo Real Multimodal

Mejora del módulo de monitoreo para el pasajero PCD:
- ETA narrado por voz cada cierto tiempo configurable (cada 2 min)
- Vibración del teléfono cuando el carro está a 200 m (Vibration API)
- Notificación con Lengua de Señas Colombiana: video corto del conductor saludando en LSC (pre-grabado por conductor o avatar IA)
- Botón gigante "¿Dónde estoy?" que dice en voz alta la dirección actual del pasajero (Geolocation reversa)

---

### 5. Botón Pánico + Protocolo de Asistencia

Un botón flotante rojo siempre accesible. Al pulsarlo (o decir "TRAMI ayuda"):
- Llama simultáneamente a: contacto de emergencia + supervisor TRAMMOS + conductor asignado
- Comparte ubicación en vivo durante 30 min
- Activa grabación de audio ambiente local (descargable luego como evidencia)
- Genera incidente automáticamente en `incidentes` con plan de mejoramiento sugerido por IA

---

### 6. Panel de Cumplimiento de Inclusión (para Corona y Sodimac)

Un dashboard ejecutivo que tu cliente NUNCA ha visto en sus operadores actuales:
- # servicios PCD / mes, por tipo de discapacidad
- Tiempo promedio de espera PCD vs general (debe ser igual o menor)
- Incidentes de inclusión (Si/no se brindó asistencia)
- Conductores certificados en atención PCD (cruce con curso teórico-práctico)
- **Reporte PDF descargable**: "Cumplimiento Ley 1618 — Periodo X" listo para auditoría / reporte ESG / Pacto Global

Esto convierte la accesibilidad en **métrica vendible y auditable** — el verdadero diferenciador.

---

### Cómo se construye (técnico)

- Migración: tabla `pasajeros_pcd` (id, cliente, nombre/cedula, perfil_a11y JSONB, contacto_emergencia, condiciones), nueva FK opcional en `servicios.pasajero_pcd_id`. Tabla `incidentes_pcd` heredando de `incidentes`.
- Componente `PerfilPCDForm.tsx` + ruta `/pasajeros-pcd` con CRUD y vista resumida.
- `TramiAssistant.tsx`: botón flotante (junto al de accesibilidad), Web Speech Recognition + edge function `trami-router` que usa `google/gemini-2.5-flash` para clasificar intención y devolver acción.
- Pictogramas: importar set ARASAAC libre (CC-BY-NC-SA) en `public/pictogramas/`. Componente `<Pictograma name="carro" />` con fallback a Lucide.
- Modo Lectura Fácil: util `simplificarTexto()` con IA (cache local por hash) + clase CSS `a11y-easy-read` que aumenta interlineado, oculta detalle decorativo, ancla pictograma a párrafos clave.
- Botón pánico: componente `PanicoButton.tsx` con Web Vibration, Geolocation watchPosition, MediaRecorder (audio).
- Dashboard inclusión: nueva ruta `/cumplimiento/inclusion` que reusa estilos de `cumplimiento.tsx` con queries específicas y export PDF (`src/lib/reportes/pdf.ts`).

Cumplimiento normativo cubierto: Ley 1618/2013 (artículo 14 — accesibilidad), NTC 5854, NTC 6047 (espacios), WCAG 2.1 AA, Decreto 1660/2003 (transporte PCD).

---

### Plan de entrega por fases

Fase A (este turno): Perfil PCD + brief automático al conductor + pictogramas básicos en accesos críticos.
Fase B: Asistente TRAMI + modo lectura fácil con IA.
Fase C: Mapa accesible (vibración + ETA hablado) + botón pánico.
Fase D: Dashboard de cumplimiento + PDF auditable.

Empiezo por la Fase A para que veas el cambio rápido y confirmes el rumbo. ¿Procedo así, o prefieres que construya las 4 fases en este turno?

---

### Lo que NO hace el plan

- No reemplaza el panel de accesibilidad actual; lo extiende.
- No requiere apps nativas — todo es web responsive (PWA opcional luego).
- No fuerza al pasajero a registrar perfil; es 100% opcional.
