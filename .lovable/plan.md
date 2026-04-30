## Objetivo

Adoptar la identidad visual oficial de TRAMMOS (manual de marca) como guía maestra de diseño en toda la aplicación —tanto admin como pasajeros— y crear una pantalla de inicio del pasajero con la estética del afiche "Todo Colombia es territorio TRAMMOS" más una animación elegante.

## 1. Sistema de color global (src/styles.css)

Reescribir las variables CSS para reflejar la **paleta oficial del manual**:

- **Verde lima Pantone 389C** `#C6FF00` → color de **acento principal** y fondos hero (es el color insignia del afiche).
- **Cyan Pantone 306C** `#00CAFF` → color **primario** (botones, links, estados activos, gradientes).
- **Gradiente verde→azul lineal 0°** (del manual) → para hero, headers destacados, CTAs primarios.
- **Gris K70** `#666666` y **gris K50** `#929496` → neutros de texto y bordes.
- Blanco y negro puros para contraste (positivo/negativo del manual).

Mapeo de tokens:
- `--primary` = Cyan 306C
- `--accent` = Lima 389C
- `--secondary` = lima muy clara (10% opacidad sobre blanco)
- Sidebar: mantener oscuro (gris K70 profundo) con detalles cyan/lima
- Charts: 1=cyan, 2=lima, 3=verde-azul medio, 4=gris, 5=cyan oscuro
- Nuevo token utilitario `--gradient-brand: linear-gradient(0deg, #00CAFF 0%, #C6FF00 100%)`

## 2. Tipografía

El manual exige **BW Seido Round** (Light/Bold/Black). Como esa fuente es comercial y no está en Google Fonts, usaremos **Quicksand** como sustituto fiel (sans-serif redondeada, mismo carácter geométrico-amigable). Se carga vía Google Fonts en `__root.tsx` y se aplica como `--font-display` y `--font-body`. Headings en `Quicksand 700/900`, body en `400/500`.

## 3. Componentes globales afectados

Auditar y ajustar para que respeten los nuevos tokens (sin tocar lógica):
- `src/components/layout/Sidebar.tsx` — usar acento lima en item activo + indicador cyan.
- `src/components/ui/button.tsx` (variantes) — variante `default` cyan, nueva variante `brand` con gradiente verde→azul.
- Headers de admin (`PasajeroHeader`, dashboards) — degradado de marca sutil.
- Email templates (`src/lib/email-templates/_brand.ts`) — actualizar hex a oficiales `#00CAFF` / `#C6FF00`.

## 4. Nueva pantalla de inicio del pasajero

Rediseñar el bloque superior de `src/routes/pasajero.tsx` (cuando no hay viaje activo) con un **Hero a pantalla completa** inspirado en el afiche subido:

```
+--------------------------------------------------+
|  [fondo lima #C6FF00 con líneas-mapa decorativas]|
|                                                  |
|   Hola, {nombre}                                 |
|   Todo Colombia                                  |
|   es territorio                                  |
|   TRAMMOS                            (cyan bold) |
|                                                  |
|         🚗 ← carro animado deslizándose         |
|                                                  |
|   [ Pedir mi carro ]   ← botón cyan grande      |
+--------------------------------------------------+
```

### Mejoras sobre el boceto original
1. **Mapa SVG animado** en el fondo (líneas curvas estilo trayecto del afiche) que se "dibujan" con `stroke-dashoffset` al cargar — refuerza el concepto "tramo entre A y B" del manual.
2. **Carro SVG** que entra desde la izquierda (`translateX` + bounce suave) y queda flotando con un `float` sutil de 3px.
3. **Texto en stagger**: "Hola" → "Todo Colombia" → "es territorio" → "TRAMMOS" aparecen en cascada (50ms de retardo cada uno) usando la utilidad `.stagger-item` ya existente.
4. **Marcadores pulsantes** (puntos cyan) sobre el mapa en posiciones aleatorias — sugieren ubicaciones activas.
5. **CTA "Pedir mi carro"** con gradiente cyan→lima invertido y `soft-glow` ya definido en styles.

### Nuevo componente
- `src/components/pasajero/PasajeroHero.tsx` — encapsula el hero animado, recibe `nombre` y `onPedirCarro`.
- `src/assets/hero-mapa.svg` — líneas decorativas del mapa (creadas a mano, ~6 curvas Bézier).
- `src/assets/hero-carro.svg` — silueta del carro estilizada en blanco con detalle cyan/lima como en el afiche.

El formulario `PedirServicioForm` se muestra al pulsar el CTA (modal/sheet) o debajo del hero al hacer scroll, manteniendo toda la lógica actual intacta.

## 5. Memoria de marca

Actualizar `mem://design/brand-colors` con los hex oficiales del manual (`#C6FF00`, `#00CAFF`, `#666666`) y registrar la regla "lima como acento protagonista en superficies hero del pasajero".

## 6. Archivos a crear/modificar

**Crear:**
- `src/components/pasajero/PasajeroHero.tsx`
- `src/assets/hero-mapa.svg`
- `src/assets/hero-carro.svg`

**Modificar:**
- `src/styles.css` (paleta + gradiente + tipografía)
- `src/routes/__root.tsx` (cargar Quicksand desde Google Fonts)
- `src/routes/pasajero.tsx` (montar `PasajeroHero` antes del formulario)
- `src/lib/email-templates/_brand.ts` (hex oficiales)
- `src/components/ui/button.tsx` (variante `brand` con gradiente)
- `mem://design/brand-colors` (refresh)

## 7. Verificación

Tras los cambios revisaré con el navegador:
1. `/pasajero` — el hero debe verse limpio con animaciones suaves.
2. `/` (admin) — sidebar y dashboards deben mostrar la nueva paleta sin romper layouts.
3. Modo oscuro / accesibilidad — confirmar contraste WCAG AA (lima sobre blanco no se usa para texto pequeño; siempre como fondo o icono grande).

¿Apruebas el plan para que lo implemente?
