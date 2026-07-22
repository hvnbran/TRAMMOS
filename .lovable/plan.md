
# Rediseño cinematográfico — TRAMMOS Reels

**Objetivo:** Convertir los 3 videos (pasajero, conductor, hospital) en piezas que se sientan como una campaña de una marca premium (piensa Apple keynote × Rimowa × Uber Elevate). Sin voz. Solo música suave + tipografía cinética + micromovimientos hipnóticos.

Se descartan `admin` (por ahora) y toda locución.

---

## Dirección de arte

- **Paleta:** negro absoluto `#050507` con vidrio esmerilado, cyan Pantone 306C como acento único, blancos rotos. Nada de gradientes coloridos.
- **Tipografía:** display en `Fraunces` (serif editorial con óptico ancho), UI/labels en `Geist` o `Inter Tight` — jerarquía extrema (títulos 140–220px, subtítulos 22–28px, chips 14px con letter-spacing).
- **Ritmo:** 30fps, escenas de 90–140 frames, cortes secos con blur transitions muy cortas (5–8f). Nada de slide.
- **Grano + viñeta:** overlay sutil de grano animado (opacity 4–6%) y viñeta radial. Da textura de cine.
- **Reflejos + luz volumétrica:** haz de luz que barre lento cada escena.

## Sistema de movimiento (aplicado a todo)

- **Ken-Burns extremo pero lento:** scale 1.00 → 1.14 con easing suave sobre 100+ frames. La imagen respira.
- **Reveal de tipografía por líneas** con máscara (clip-path inset), no por caracteres. Delay stagger de 4–6f entre líneas.
- **Chip de kicker** que crece con línea de 1px cyan que se traza (strokeDashoffset simulado).
- **Marco de dispositivo estilizado** — phone/desktop con bezel más fino, sombra difusa muy amplia (0 40px 120px rgba(0, 180, 216, 0.15)), reflejo especular arriba.
- **Cursor y taps** solo cuando aporta — máximo uno por escena, con onda concéntrica al hacer clic.
- **Transiciones entre escenas:** cross-blur (filter blur 0→20→0) de 8f o wipe con máscara diagonal desde una esquina. Nunca slide horizontal completo.
- **Cortinilla de marca** entre bloques: fondo negro, palabra "TRAMMOS" apareciendo por letra con kerning que se cierra, dura 45f.

## Estructura de cada video

Cada uno mantiene 5–7 escenas ya capturadas, más:

1. **Cold open (60f)** — fondo negro, línea cyan que cruza la pantalla, aparece el chip del rol (ej. "APP PASAJERO / Medellín") en el centro.
2. **Manifesto card (90f)** — frase corta en Fraunces 180px, tres líneas máx. Ej. pasajero: *"Un toque. Un carro. Tu ciudad."*
3. **Escenas reales** (90–110f cada una) — screenshot en device frame con Ken-Burns, caption cambia de posición (alterna izq/der/centro para no aburrir).
4. **Beat de números** (opcional, 70f) — dato KPI grande ("< 3 min tiempo respuesta") con contador animado.
5. **Cierre** (100f) — logo TRAMMOS aparece por trazo, tagline debajo, línea cyan cierra.

## Música

- Reutilizar el track ya descargado (`music.mp3` de Incompetech, CC-BY). 
- **Sin voz.** Duckea al inicio (fade in 2s desde -8dB) y al final (fade out 3s). Volumen general -14dB (más bajo que antes porque no hay narración compitiendo).
- Un "swell" sutil de sub-bajo (filtro low-shelf +3dB) en el frame donde aparece el logo final — opcional si `ffmpeg` filtro es rápido; si no, se omite.

## Duraciones objetivo

- Pasajero: ~28s
- Conductor: ~28s  
- Hospital: ~32s

## Archivos que cambian

- `remotion/src/theme.ts` — nueva paleta y tipografía.
- `remotion/src/components/RealScene.tsx` — refactor completo: nuevo layout de caption alternante, grano, viñeta, luz volumétrica, device frame más elegante.
- `remotion/src/components/IntroCard.tsx` — reemplazar por `ManifestoCard` con máscara por líneas.
- `remotion/src/components/OutroCard.tsx` — logo por trazo + tagline.
- `remotion/src/components/BrandInterstitial.tsx` (nuevo) — cortinilla entre bloques.
- `remotion/src/components/KpiBeat.tsx` (nuevo) — beat de número grande.
- `remotion/src/components/FilmGrain.tsx` + `LightSweep.tsx` (nuevos) — overlays globales.
- `remotion/src/videos/PasajeroVideo.tsx`, `ConductorVideo.tsx`, `HospitalVideo.tsx` — recomposición con nueva estructura, nuevas transiciones (cross-blur), timings más lentos.
- `remotion/src/Root.tsx` — actualizar durations, se elimina `AdminVideo` del render final (queda el archivo por si vuelve).
- Script de mux `/tmp/vo/mux.sh` → nuevo `/tmp/mux_music_only.sh` que solo agrega música con fades, sin locución.
- Fuentes: `@remotion/google-fonts/Fraunces` y `Geist` (o `InterTight`) cargadas al montar cada composición.

## Salida final

- `/mnt/documents/videos-trammos/01-pasajero.mp4`
- `/mnt/documents/videos-trammos/02-conductor.mp4`
- `/mnt/documents/videos-trammos/03-hospital.mp4`

Se reemplazan los actuales. Los `admin` y `*-final.mp4` se borran para dejar la carpeta limpia.

## Detalles técnicos

- Render con el mismo `scripts/render-remotion.mjs` (concurrency 1, chrome-for-testing, muted).
- Fuentes con `loadFont` a nivel de módulo — ya soportado por el proyecto.
- Grano: SVG `<feTurbulence>` no rinde bien en headless; usar canvas ruido pre-generado como PNG loopeado o `radial-gradient` estático + noise data URI muy ligero.
- Blur transitions: crear un `<Transition presentation>` custom que interpole `filter: blur()` en enter/exit (Remotion soporta custom presentations vía `TransitionPresentation`).
- Muxing: `ffmpeg -i in.mp4 -i music.mp3 -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st={end-3}:d=3,volume=0.2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest out.mp4`

## Fuera de alcance

- No se toca el video de admin (queda en Remotion pero no se re-renderiza).
- No se implementa sonido/SFX puntual (solo música + fades).
- No se hacen versiones verticales (9:16); todo sigue en 1920×1080.
