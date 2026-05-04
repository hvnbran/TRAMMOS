
# TRAMI 2.0 — De asistente a ayudante con cara propia

Hoy TRAMI es un botón con un ícono genérico de "✨ Sparkles". Tienes una mascota hermosa (la jirafa azul con morral y mapa) que no se está usando. La idea es **darle cuerpo, contexto y proactividad** para que deje de sentirse como un chatbot y se sienta como un compañero de viaje.

## 1. Dónde poner la mascota (presencia visual)

| Ubicación | Qué hace la mascota | Por qué allí |
|---|---|---|
| **Botón flotante** (ya existe, en todas las apps) | Reemplazar el ícono Sparkles por la jirafa recortada en círculo, con micro-animación de "saludo" cada cierto tiempo | Es la cara permanente del producto |
| **Cabecera del modal de TRAMI** | Avatar grande de la jirafa + globo de diálogo con su saludo | Humaniza la conversación |
| **Pantalla de login del pasajero** | Jirafa al lado del título "Bienvenido a TRAMMOS", diciendo "¡Hola! Soy TRAMI, te acompaño" | Primera impresión cálida |
| **Welcome splash del pasajero** | Jirafa animada saludando + bocadillo con tutorial de 3 pasos | Onboarding sin texto pesado |
| **Estados vacíos** (sin viajes, sin notificaciones) | Jirafa con cara curiosa: "Aún no tienes viajes. ¿Te ayudo a pedir uno?" | Convierte un "no hay nada" en una acción |
| **Pantalla de "viaje en curso"** | Jirafa pequeña en esquina con bocadillo dinámico: "Tu carro llega en 5 min" | Ayudante real, no asistente |
| **Errores y 404** | Jirafa triste con mapa al revés: "Me perdí. ¿Volvemos al inicio?" | Convierte fricción en simpatía |
| **Conductor — pantalla principal** | Jirafa con casco de seguridad en miniatura, recordando checklist | Personaliza también el lado operativo |

**Nombre y personalidad**: TRAMI sigue siendo el nombre. Tono: cercano, breve, paisa-neutro (Medellín), siempre tutea, nunca jerga técnica, usa máximo 2 oraciones por respuesta.

## 2. Las 10 mejoras que la vuelven 200x más útil

### A. Mascota viva (no un PNG estático)
1. **3 estados de avatar**: `idle` (saludando), `pensando` (mirando el mapa), `hablando` (boca abierta). Implementados con 3 versiones del PNG + CSS transitions, sin librería de animación.
2. **Burbuja proactiva**: cada vez que cambia el contexto importante (llega el conductor, viaje cancelado, nuevo servicio asignado), la jirafa "se asoma" desde el botón flotante con un bocadillo de 3 segundos. No interrumpe, no requiere clic.

### B. Memoria y contexto real (lo que más le falta hoy)
3. **Conversación persistente por usuario**: tabla `trami_conversations` + `trami_messages` con RLS. TRAMI recuerda lo que hablaron ayer ("La última vez me dijiste que ibas a Envigado, ¿hoy también?").
4. **Contexto automático de la página**: el frontend envía al edge function el "estado actual" (rol del usuario, ruta, viaje activo, último servicio). TRAMI deja de responder en abstracto y empieza a responder con datos reales: *"Tu viaje #4521 sale en 12 minutos desde la Sede Norte."*
5. **Tool calling de verdad**: ampliar el edge function `trami-router` con herramientas que TRAMI puede ejecutar:
   - `consultar_mi_viaje_activo()` → lee de Supabase
   - `cancelar_viaje(id)` → con confirmación
   - `pedir_viaje(origen, destino, hora)` → pre-rellena el formulario
   - `reportar_incidente(tipo, descripcion)` → abre el modal con datos
   - `llamar_conductor()` → activa `tel:` link
   - `boton_panico()` → flujo seguro con confirmación doble
   
   Esto la convierte en **ayudante** (hace cosas) no asistente (solo responde).

### C. Multimodal y accesibilidad real
6. **Voz por defecto en pasajero**: ya hay Web Speech API; agregar **modo manos libres** (botón grande "Habla con TRAMI") que escucha-responde-escucha en bucle hasta que el usuario diga "gracias" o cierre. Crítico para PCD motriz/visual.
7. **Lectura de pantalla bajo demanda**: botón "TRAMI, léeme esta página" que pasa el contenido visible a `simplify` y luego a `speak()`. Reutiliza infraestructura existente.
8. **Pictogramas en respuestas**: cuando TRAMI menciona conceptos del mapa de pictogramas (`carro`, `casa`, `reloj`), renderizar el `<Pictograma>` inline junto al texto. Refuerza comprensión para PCD cognitiva.

### D. Proactividad inteligente (lo que la hace memorable)
9. **Sugerencias contextuales sin abrir el chat**: "toast" pequeño con la cara de la jirafa cuando detecta:
   - Pasajero en `/pasajero` sin viaje activo a las 7am de un día laboral → "¿Pides tu viaje a la oficina?"
   - Conductor lleva 2h sin marcar fin de jornada → "¿Cerramos el turno?"
   - Admin con servicios sin asignar > 30 min → "Tienes 3 servicios esperando conductor."
10. **Resumen de día / atajos rápidos**: dentro del modal, sobre el input, 4 chips dinámicos según rol y hora ("¿Dónde está mi carro?", "Pedir viaje", "Reportar problema", "Llamar conductor"). Aprenden de los chips más usados por usuario.

## 3. Responsividad

- **Móvil (<640px)**: modal full-screen, avatar de jirafa 56px en header, bocadillo proactivo aparece arriba del FAB sin tapar contenido.
- **Tablet/Desktop**: modal lateral derecho 420px (como hoy), avatar 80px, bocadillo proactivo flota a la izquierda del FAB.
- **Botón flotante**: 56px en móvil, 64px en desktop. Se mueve a `bottom-20` cuando hay barra de navegación inferior (conductor/pasajero) para no taparla.
- **Reduced motion**: respeta `prefers-reduced-motion` — sin animaciones de saludo ni rebote del bocadillo.

## 4. Cambios técnicos concretos

**Activos nuevos** (`src/assets/trami/`):
- `trami-idle.png`, `trami-thinking.png`, `trami-talking.png`, `trami-sad.png`, `trami-wave.png` — generados a partir de la jirafa que subiste, con la herramienta de generación de imágenes (Nano Banana edit) para mantener consistencia visual.

**Componentes nuevos**:
- `src/components/trami/TramiAvatar.tsx` — avatar con estados, tamaños sm/md/lg/xl.
- `src/components/trami/TramiBubble.tsx` — bocadillo proactivo flotante con auto-dismiss.
- `src/components/trami/TramiEmptyState.tsx` — estado vacío reutilizable con jirafa + CTA.
- `src/components/trami/useTramiContext.tsx` — hook que recolecta estado de la app (ruta, rol, viaje activo) para enviar al edge function.
- `src/components/trami/useTramiProactive.tsx` — hook que dispara bocadillos según reglas contextuales.

**Componentes modificados**:
- `src/components/TramiAssistant.tsx` — usar `<TramiAvatar>`, agregar chips dinámicos, modo manos libres, render de pictogramas inline, persistencia de mensajes.
- `src/components/pasajero/PasajeroWelcomeSplash.tsx`, `PasajeroHero.tsx`, `ViajeEnCurso.tsx` — agregar avatar de TRAMI.
- `src/routes/login.tsx`, `src/routes/conductor.login.tsx` — jirafa en bienvenida.
- `src/routes/__root.tsx` — `notFoundComponent` con jirafa triste.

**Backend**:
- Migración: tablas `trami_conversations` (id, user_id, started_at) y `trami_messages` (id, conversation_id, role, content, tool_calls, created_at) con RLS por `user_id`.
- `supabase/functions/trami-router/index.ts` — nuevo modo `chat` que:
  - Recibe `context` enriquecido (rol, ruta, viaje_id, ultimo_servicio).
  - Carga últimos 20 mensajes del usuario.
  - Habilita tool-calling con las 6 herramientas listadas en B.5.
  - Devuelve texto + acciones a ejecutar en el cliente.

**Modelo**: `google/gemini-3-flash-preview` (rápido, barato, buen tool calling). Fallback a `google/gemini-2.5-flash` si el preview falla.

## 5. Orden de implementación (3 fases)

1. **Fase 1 — Cara y presencia** (quick win visible): generar los 5 PNG de la mascota, crear `TramiAvatar`, reemplazar ícono del FAB, agregar jirafa en login/welcome/empty states, mascota triste en 404.
2. **Fase 2 — Cerebro contextual**: tablas de conversación + memoria, contexto automático de página, modo `chat` con tool calling y 6 herramientas, render de respuestas con markdown + pictogramas.
3. **Fase 3 — Proactividad**: bocadillos contextuales, modo manos libres, "léeme esta página", chips dinámicos por rol.

Cada fase deja la app funcionando y aporta valor por sí sola; puedes parar después de la 1 si quieres validar primero la recepción visual.
