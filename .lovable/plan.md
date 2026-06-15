## Nueva animación de entrada al CRM

Sí, se puede implementar. Voy a portar el HTML/JS que enviaste a un componente React que reemplace el `CrmIntro` actual (el velo simple con logo).

### Qué cambia

**Archivo:** `src/components/crm/CrmIntro.tsx` (reescrito)

- Fullscreen overlay (`fixed inset-0 z-[100]`) sobre fondo `#06090f`, encima del CRM mientras corre.
- Canvas con las 120 partículas + 8 hexágonos animados (mismo loop `requestAnimationFrame`).
- Fase 1 — Logo: isotipo SVG (4 círculos con gradiente lima→cian + rombo central) + wordmark "TRAMMOS / CRM" + tagline "PLATAFORMA INTELIGENTE DE GESTIÓN", con la secuencia escalonada (scale+rotate del iso, slide del wordmark, clip-path reveal del "CRM", fade del tagline).
- Fase 2 — Grid de módulos: los 11 módulos reales del CRM con sus iconos, marcando ✓ uno a uno con barra de progreso inferior ("INICIANDO" → nombre del módulo → "SISTEMA LISTO ✓").
- Al terminar (≈6s) hace fade-out y desmonta, dejando ver el CRM. Sin botón replay ni click-to-replay (es intro, no demo).
- Respeta `prefers-reduced-motion`: salta directo al estado final y cierra en ~600ms.
- El canvas se redimensiona al viewport (no fijo 680×500) y se centran las dos fases con flex.
- Cleanup de `cancelAnimationFrame` y timeouts al desmontar para no fugar memoria al navegar.

### Detalles técnicos

- Fuente Montserrat: la cargo con `@remotion/google-fonts`? No — es app web, uso `<link>` a Google Fonts inyectado una vez desde el componente (o lo dejo como fallback a la fuente del sistema si prefieres no añadir red). **Pregunta abajo.**
- Los módulos del grid se toman de una constante local con los items reales del CRM (Dashboard, Pipeline, Ventas, Catálogo, Créditos, Capacidades, Clientes, Cumpleaños, Asesores, Concesionarios, Equipo).
- `CrmLayout` ya monta `<CrmIntro />` una sola vez al entrar — no se toca esa integración.
- Duración total ~5.5–6s. Si te resulta largo, lo bajo recortando el delay entre módulos.

### Lo que NO cambio

- `CrmLayout`, rutas del CRM, lógica de auth, ni el splash de login (que es otro componente).

### Pregunta

1. ¿Quieres que cargue la fuente **Montserrat** desde Google Fonts (añade 1 request) o uso la tipografía del sistema ya configurada en el proyecto?
2. ¿La animación debe correr **solo la primera vez por sesión** (no molesta al navegar entre pestañas del CRM) o **cada vez que entras a `/crm`**? Hoy corre cada montaje del layout.
