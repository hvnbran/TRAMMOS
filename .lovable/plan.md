# Video-guías TRAMMOS (4 clips motion-graphics)

Un video corto por app, hilados por un caso real coherente entre los cuatro.

## Caso narrativo real (hilo conductor)

- **Pasajera:** María Restrepo, enfermera del Hospital del Sur (sede San Pío).
- **Conductor:** Milton, vehículo blanco placa **QWN462**.
- **Admin:** operador de TRAMMOS en Medellín.
- **Empresa:** Hospital del Sur Itagüí (panel corporativo).
- **Servicio:** traslado San Pío → Calatrava, martes 8:20 a.m., más servicio fijo L-V de Milton.

Cada video muestra el mismo viaje desde el ángulo del rol que le toca.

## Entregables

Cuatro MP4 en `/mnt/documents/`, 1080p 30fps, ~75–90s cada uno:

1. `trammos-pasajero.mp4` — App Pasajero
2. `trammos-conductor.mp4` — App Conductor
3. `trammos-admin.mp4` — Panel Admin general
4. `trammos-hospital.mp4` — Panel Hospital del Sur

## Estilo

- Motion graphics con Remotion + Tailwind, no screen-recording.
- Mockups de pantallas fieles a la app (colores de marca: Cyan 306C, Lime 389C, gris K:70; modo claro con sidebar oscuro).
- Capturas reales del logo (`src/assets/logo-trammos.jpeg`) y del carro Duster para acentos.
- Tipografía: Space Grotesk (títulos) + Inter (UI/cuerpo) vía `@remotion/google-fonts`.
- Transiciones: `TransitionSeries` con wipe/slide consistente entre escenas.
- Música de fondo generada con ElevenLabs Music (~90s por pista, mood distinto por app: cálido para Pasajero, enérgico para Conductor, corporativo para Admin, institucional-sereno para Hospital). Volumen bajo, ducking manual bajo los títulos.
- Sin voz en off — todo se cuenta con texto kinético en español y callouts sobre los mockups (test de "mute": se entiende sin audio).

## Estructura por video (~80s = 2400 frames a 30fps)

Cada uno sigue el mismo esqueleto de 5 escenas:

1. **Hook / título** (4s) — logo TRAMMOS + nombre del módulo + una frase del caso real.
2. **Login / acceso** (10s) — mockup de la pantalla real, tecleo animado del correo del rol.
3. **Flujo principal 1** (20s) — la acción central del rol (ver abajo por app).
4. **Flujo principal 2** (25s) — segunda acción clave con datos del caso.
5. **Cierre + tip** (15s) — resumen visual, un tip útil, logo final.

### Contenido específico

**Pasajero (`trammos-pasajero.mp4`)**
- Login como `brantest2@trammos.test`.
- Autocompletado Google Places: escribe "San Pío" → sugerencia real "Calle 33 Nº 50a-25".
- Selección de destino desde chip favorito "Calatrava".
- Solicita servicio → llega Milton con foto, placa QWN462, mini-mapa en vivo.
- Al terminar: calificación 5★ y comentario. Tip: activar notificaciones push.

**Conductor (`trammos-conductor.mp4`)**
- Login como Milton (link `trammos.online/conductor.login`).
- Home con "Servicios fijos de hoy": Hospital del Sur L-V.
- Botón **Iniciar** turno → estado en curso → **Finalizar** con notas.
- Servicios puntuales del día, toggle de ubicación y notificaciones.
- Tip: instalar la PWA en el celular.

**Admin (`trammos-admin.mp4`)**
- Login admin, dashboard, sidebar completa.
- Búsqueda global: teclea "QWN462" → abre modal del vehículo con documentos horizontales; luego "Milton" → perfil con foto y documentos (marca SIMIT como "actualizar bajo pedido").
- Operación: crea servicio tipo "Salud", tarifa, asigna Milton + QWN462.
- Servicios fijos: crea el fijo L-V del Hospital del Sur (checkbox "Hospital Sur", horario libre a decisión del conductor).
- Cuentas: crea acceso conductor con contraseña sincronizada, copia link WhatsApp (usa `trammos.online`).
- Tip: alertas de vencimiento + cumpleaños.

**Hospital del Sur (`trammos-hospital.mp4`)**
- Login `hospitalsur@trammos.test`.
- Panel corporativo filtrado: sólo vehículos y conductores asignados al hospital.
- Registra pasajera "María Restrepo" desde Cuentas (solo tipo Pasajero).
- Monitoreo en vivo del traslado San Pío → Calatrava.
- Cumplimiento ANS + historial de servicios del hospital.
- Tip: sedes preconfiguradas (San Pío / Santamaría / Calatrava) para pedir sin escribir dirección.

## Ejecución técnica

- Proyecto Remotion nuevo en `remotion/` (siguiendo el skill video-creator: bun init, deps, fix compositor musl→gnu, symlink ffmpeg).
- Una composición por video (`pasajero`, `conductor`, `admin`, `hospital`) en `src/Root.tsx`.
- Componentes reutilizables en `remotion/src/components/`: `PhoneFrame`, `DesktopFrame`, `SidebarMock`, `MapMock`, `Cursor`, `TypewriterInput`, `Callout`, `LogoTrammos`.
- Escenas por video en `remotion/src/scenes/{app}/SceneX.tsx`.
- Assets: se copia `src/assets/logo-trammos.jpeg` y el Duster a `remotion/public/`.
- Música: 4 pistas MP3 vía ElevenLabs Music (conector ElevenLabs; si no está enlazado, se solicita conectar antes de renderizar). Se guardan en `remotion/public/audio/`.
- Render con `scripts/render-remotion.mjs` (chromium NixOS, `muted: false` porque hay audio propio de la pista; `concurrency: 1`).
- QA obligatorio: `bunx remotion still` en frames clave de cada video + `ffprobe` para validar duración/audio antes de entregar.

## Fuera de alcance

- No voz en off / TTS (solo música + texto).
- No modificaciones a la app real ni a la base de datos.
- No se sube a YouTube; se entrega el MP4.

## Confirmaciones antes de arrancar

- ¿OK el caso real propuesto (María + Milton + Hospital del Sur, QWN462) o prefieres otros nombres/placa?
- ¿OK que use el conector ElevenLabs para generar la música? Si no está conectado se pedirá enlazar; alternativa: usar 4 pistas royalty-free ya existentes que subas tú.
- El render de 4 videos toma varios turnos de `code--exec` (cada MP4 ~5–8 min). ¿Los entrego uno por uno o los cuatro seguidos sin pausas de revisión intermedia?
