# Intro en video vertical: "Aprendiendo con TRAMMOS"

Un video MP4 de 5 segundos, formato celular (vertical), sin sonido, con la misma
estética de la animación de entrada del CRM: fondo oscuro con partículas y
hexágonos, el isotipo apareciendo con giro y rebote, el texto TRAMMOS en degradado
lima→cian y la frase "Aprendiendo con TRAMMOS".

## Qué se verá

```text
0.0s  fondo oscuro, partículas lima/cian flotando
0.3s  isotipo (4 círculos + diamante) entra girando y creciendo
1.0s  "TRAMMOS" entra desde la derecha, degradado lima → cian
1.6s  "Aprendiendo con" se revela arriba del logo
2.2s  línea de acento cian se abre bajo el logo
3.5s  respiración lenta del conjunto (nada estático)
4.7s  cierre suave a negro
```

## Guion visual

- Lienzo 1080x1920, 30 fps, 150 fotogramas.
- Fondo `#06090f` con degradado radial suave lima/cian, partículas y hexágonos
  animados por fotograma (nada de CSS animado).
- Isotipo redibujado en SVG con el mismo degradado `#b2e800 → #5bd4a0 → #00b4d8`.
- Tipografía Montserrat (pesos 700/900) vía Google Fonts de Remotion.
- Sin música ni voz; render en silencio.

## Detalles técnicos

- Nueva composición `intro-aprendiendo` en `remotion/src/Root.tsx`
  (1080x1920, 30 fps, 150 frames).
- Nuevo archivo `remotion/src/videos/IntroAprendiendo.tsx` con la escena, más
  `remotion/src/components/IntroLogoMark.tsx` para el isotipo SVG animado.
- Toda la animación con `useCurrentFrame()` + `interpolate()`/`spring()`.
- Render con el script existente `remotion/scripts/render-remotion.mjs`
  (`muted: true`, concurrency 1) a
  `/mnt/documents/videos-trammos/intro-aprendiendo-trammos.mp4`.
- Verificación: un fotograma fijo de control (≈frame 60) antes del render final y
  comprobación del tamaño/duración del MP4 con ffprobe.

## Entrega

El MP4 vertical queda listo para descargar y se te comparte en el chat.
