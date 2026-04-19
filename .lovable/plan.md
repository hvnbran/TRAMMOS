

## Recomendación: TRAMMOS Accesible — Valor agregado para inclusión

Esta es una **recomendación estratégica + plan técnico**. La accesibilidad no es solo ética: es un **diferenciador comercial** frente a Corona, Sodimac y futuros clientes corporativos que tienen políticas de inclusión (ESG, sostenibilidad social).

### Marco legal y argumento comercial

- **Ley 1618 de 2013** (Colombia): obliga a garantizar el ejercicio efectivo de los derechos de personas con discapacidad, incluyendo acceso a TIC.
- **NTC 5854** (norma técnica colombiana): basada en WCAG 2.1, exige nivel AA para aplicaciones digitales.
- **WCAG 2.1 AA** (estándar internacional): requerido por empresas con políticas ESG.
- **Argumento de venta**: "TRAMMOS es la única plataforma de transporte especial en Colombia certificada accesible WCAG 2.1 AA, lo que les permite cumplir con políticas de inclusión y reportar en sus indicadores ESG."

### Quién se beneficia y cómo

| Usuario | Necesidad | Solución TRAMMOS |
|---|---|---|
| Adultos mayores | Vista cansada, manos temblorosas | Modo "Texto grande" + botones de mínimo 44px |
| Personas ciegas | Lectores de pantalla (NVDA, JAWS, VoiceOver) | Etiquetas ARIA, navegación por teclado, alt text |
| Baja visión | Bajo contraste | Modo "Alto contraste" + zoom hasta 200% |
| Personas sordas | Notificaciones auditivas | Alertas visuales (banners + parpadeo) en lugar de solo sonido |
| Daltonismo | Confusión rojo/verde | Iconos + texto en estados (no solo color) |
| Discapacidad motriz | Solo teclado | Focus visible + atajos Alt+1, Alt+2... |
| Tercera edad | Confusión con interfaces complejas | Modo "Simple" con menús más grandes y menos opciones |

### Plan técnico (3 fases)

**Fase 1 — Fundamentos accesibles (base WCAG AA)**
1. Agregar `lang="es"` (ya está) y atributos ARIA en sidebar, header, formularios y tablas (`role="navigation"`, `aria-label`, `aria-current`, `aria-live` para notificaciones).
2. Asegurar **focus visible** en todos los elementos interactivos (anillo cyan claro, mínimo 2px).
3. Agregar **skip link** "Saltar al contenido principal" (visible al tabular).
4. Verificar contraste de los colores actuales (cyan #00B8DE sobre blanco puede no pasar AA en texto pequeño) y ajustar variantes en `styles.css` solo donde falle.
5. Reemplazar todos los iconos-botón sin texto con `aria-label`.
6. Agregar `alt` descriptivo a logos e imágenes.

**Fase 2 — Panel de Accesibilidad (botón flotante visible siempre)**

Crear un **botón flotante en la esquina inferior derecha** (icono de persona con brazos abiertos, universalmente reconocido) que abra un panel con:

- **Tamaño de texto**: Normal / Grande / Muy grande (multiplica `font-size` raíz).
- **Alto contraste**: alterna a tema blanco/negro puro con bordes gruesos.
- **Modo daltonismo**: filtros CSS (protanopia, deuteranopia, tritanopia).
- **Reducir movimiento**: respeta `prefers-reduced-motion` y desactiva animaciones (incluyendo el splash de login y el stagger del dashboard).
- **Subrayar enlaces**: añade `text-decoration` a todos los `<Link>`.
- **Espaciado amplio**: aumenta padding y line-height.
- **Modo simple**: oculta columnas no esenciales en tablas y agranda botones (útil para tercera edad).
- **Cursor grande**: aumenta el tamaño del cursor con CSS.

Las preferencias se guardan en `localStorage` y se aplican como clase en `<html>` (`a11y-large-text`, `a11y-high-contrast`, etc.) con reglas en `styles.css`.

**Fase 3 — Inclusión específica del dominio**
- **Notificaciones multicanal**: cada alerta del `NotificationsBell` muestra banner visual + (opcional) vibración en móvil + notificación push del navegador, no solo sonido.
- **Lectura por voz** (Web Speech API, gratis): botón "Escuchar" en cada tarjeta KPI del dashboard y en detalles de servicio, útil para personas ciegas o con baja alfabetización digital.
- **Modo conductor sénior**: vista simplificada para que conductores mayores reciban su asignación del día con tipografía grande y un solo botón "Iniciar ruta".
- **Documentación accesible**: los PDFs generados en `lib/reportes/pdf.ts` deben incluir metadatos (title, author, lang) y estructura tagged-PDF para lectores de pantalla.

### Archivos a tocar (cuando apruebes)

- `src/styles.css` — añadir clases `.a11y-*`, mejorar focus rings, ajustes de contraste.
- `src/components/layout/AccessibilityPanel.tsx` (nuevo) — panel flotante con todos los controles.
- `src/lib/a11y-context.tsx` (nuevo) — contexto que persiste preferencias en localStorage.
- `src/routes/__root.tsx` — montar `A11yProvider` y aplicar clases al `<html>`.
- `src/components/layout/AppLayout.tsx` — agregar skip link y botón flotante.
- `src/components/layout/Sidebar.tsx` — atributos ARIA + `aria-current`.
- `src/components/NotificationsBell.tsx` — `aria-live="polite"` y banners visuales.
- `src/lib/reportes/pdf.ts` — metadatos accesibles en PDFs.

### Mi recomendación

**Empieza por Fase 1 + Fase 2** (1–2 días de trabajo). Esto te da:
- Cumplimiento legal con Ley 1618 / NTC 5854.
- Un panel de accesibilidad **visible**, que es lo que clientes corporativos quieren ver en una demo.
- Argumento sólido para licitaciones: "Cumplimos WCAG 2.1 AA y Ley 1618".

La Fase 3 (lectura por voz, modo conductor sénior) la puedes vender como **módulo Premium** o incluirla según el cliente.

¿Quieres que arranque con **Fase 1 + Fase 2** ahora?

