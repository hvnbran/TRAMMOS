## Footer corporativo TRAMMOS

Reemplazar el footer minimalista actual (una sola línea con © + links legales) por un footer corporativo más rico, inspirado en el de trammos.co (la imagen que enviaste), pero adaptado al estilo de la app y manteniendo nuestros tokens de diseño.

### Estructura visual del nuevo footer

```text
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo TRAMMOS]        EMPRESA           LEGAL              CONTACTO │
│  Transportes           · Inicio          · Términos         📧 correo│
│  Especiales            · Servicios       · Privacidad       📞 tel   │
│  ¡Contigo en cada      · Solicitar       · Cookies          📍 ciudad│
│   tramo!                  transporte                                 │
│                                                                       │
│  [Vigilado              [Mintransporte]  [Supertransporte]            │
│   SuperTransporte]                                                    │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────── │
│  © 2026 Trammos Transportes Especiales S.A.S. · NIT 901784897-1      │
│                                       Hecho con cuidado en Colombia 🇨🇴│
└──────────────────────────────────────────────────────────────────────┘
```

Tres variantes del mismo componente:
- **`full`**: 4 columnas + sellos de vigilancia + barra inferior. Se usa en el dashboard interno (AppLayout) y en páginas legales.
- **`compact`**: logo TRAMMOS + sellos pequeños + © + links legales en una franja angosta. Para `/login`, `/conductor/login`, `/conductor`, `/pasajero` (donde el espacio es ajustado y ya hay branding fuerte arriba).
- Auto-responsive: en móvil colapsa a una sola columna apilada.

### Sellos institucionales (lado oficialidad)

La página oficial muestra el sello "Vigilado SuperTransporte". Replicarlo como SVG inline (escudo + texto), más un badge "Ministerio de Transporte – República de Colombia" también en SVG inline. Razón: evitar dependencias de imágenes externas o subir binarios sin permiso de uso. Los SVG se construyen como blocks tipográficos sobrios en blanco/gris con la franja tricolor (amarillo/azul/rojo) abajo, fieles al estilo gubernamental colombiano sin reproducir el escudo nacional literal (que es marca registrada del Estado).

Los sellos se renderizan a un tamaño moderado (h ≈ 48px), monocromáticos, alineados en una fila con separación generosa.

### Estilo

- Fondo: `bg-card` con borde superior `border-border` (modo claro). En el dashboard se ve como una banda sutil al final del scroll.
- Tipografía: `text-xs` para listas, `text-[11px]` uppercase tracking-wide para títulos de columna, en `text-muted-foreground`. Títulos en `text-foreground font-semibold`.
- Logo TRAMMOS: usar `src/assets/logo-trammos.png` (ya existe) a la izquierda, `h-12 w-auto`.
- Acentos: una línea horizontal con gradiente sutil de los colores de marca (cyan → lime) sobre el borde superior, como guiño.
- Hover de los links: subrayado + cambio a `text-primary`.

### Datos a mostrar

Tomados de `src/lib/legal/empresa.ts` (que ya tiene razón social, NIT y correo correctos):
- Razón social, NIT
- Correo soporte/privacidad: `Trammostransportesespeciales@gmail.com`
- Sitio: `trammos.online`
- País: Colombia
- Tagline: "¡Contigo en cada tramo!"

Las columnas "Empresa" enlazan a rutas que ya existen (Inicio, Solicitar transporte, Servicios). Si una ruta interna no aplica al rol (p. ej. en `/pasajero`), se filtran los enlaces para no llevar al usuario a páginas que requieren otra sesión.

### Detalles técnicos

**Archivos a crear:**
- `src/components/layout/SiteFooter.tsx` — componente con prop `variant: "full" | "compact"`. Lee `EMPRESA` de `@/lib/legal/empresa`. Reutiliza `<LegalLinks />`.
- `src/components/layout/seals/VigiladoSuperTransporte.tsx` — SVG inline del sello.
- `src/components/layout/seals/MintransporteSeal.tsx` — SVG inline del sello/badge.

**Archivos a editar:**
- `src/components/layout/AppLayout.tsx` — reemplazar el `<footer>` actual por `<SiteFooter variant="full" />`.
- `src/routes/login.tsx` — reemplazar el bloque `<LegalLinks />` final por `<SiteFooter variant="compact" />`.
- `src/routes/conductor.login.tsx` — añadir `<SiteFooter variant="compact" />` al final del contenedor.
- `src/routes/conductor.index.tsx` — añadir `<SiteFooter variant="compact" />` al final del scroll del dashboard del conductor.
- `src/routes/pasajero.tsx` — añadir `<SiteFooter variant="compact" />` al final del scroll del panel pasajero.
- `src/components/legal/LegalPageLayout.tsx` — reemplazar el footer simple por `<SiteFooter variant="full" />` para que las páginas legales también ganen presencia institucional.

**Sin cambios** en rutas que no tienen footer propio (consumen `AppLayout` y heredan automáticamente).

### Por qué este enfoque

- Un solo componente reusable evita divergencia visual entre las 3 apps (admin, conductor, pasajero).
- Los SVG inline para los sellos eliminan riesgos de derechos de imagen sobre logos oficiales y se ven crujientes en cualquier resolución.
- La variante `compact` evita que las pantallas de login (que ya son densas y centradas) se sientan cargadas.
