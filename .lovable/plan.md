## Objetivo

1. **Splash de bienvenida del pasajero**: cuando un pasajero inicia sesión correctamente, mostrar una pantalla animada con la imagen del afiche TRAMMOS ("Todo Colombia es territorio TRAMMOS" + carro) durante ~1.8s y luego redirigir automáticamente a `/pasajero` (pantalla de pedir carro).
2. **Hero existente**: conservar el `PasajeroHero` actual pero **quitar el botón "Pedir mi carro"** (ya no será necesario porque el flujo entra directo al formulario; el hero queda como banner decorativo).
3. **Optimizaciones de rendimiento** para aligerar el bundle y la primera carga.

---

## 1. Splash de bienvenida del pasajero

### Asset
- Copiar `user-uploads://image-2.png` a `src/assets/welcome-trammos.png` para usarlo como imagen del splash.

### Componente nuevo: `src/components/pasajero/PasajeroWelcomeSplash.tsx`
- Pantalla full-screen, fondo lima `#C6FF00`.
- Imagen del afiche centrada con animación de entrada:
  - `scale(0.92) → 1` + `opacity 0 → 1` en 600 ms (`ease-out`).
  - Carro con un sutil "float" continuo (ya soportado en `styles.css`).
- Texto inferior "Bienvenido, {nombre}" con `hero-text-rise`.
- Barra de progreso fina cyan que se llena en 1.6 s.
- Fade-out global a los 1.8 s y luego desmonta.
- Acepta `onDone` callback.
- Respeta `prefers-reduced-motion` (sin animaciones, redirección a 800 ms).

### Integración: `src/routes/login.tsx`
- En el flujo del **pasajero** (después de validar OTP correctamente), en vez de navegar inmediatamente a `/pasajero`:
  - Setear `setSplashClient("pasajero")` y `setShowSplash(true)` (ya existe la infraestructura `showSplash` en `LoginPage`).
  - Renderizar `<PasajeroWelcomeSplash nombre={...} onDone={() => navigate({ to: "/pasajero" })} />` cuando `showSplash && splashClient === "pasajero"`.
- El splash de operadores (corona/sodimac/admin) actual no se toca.

---

## 2. Ajuste al `PasajeroHero`

Archivo: `src/components/pasajero/PasajeroHero.tsx`
- Eliminar el botón "Pedir mi carro" y el icono `ArrowRight` (import).
- Eliminar la prop `onPedir` de `PasajeroHeroProps` (queda solo `nombre`).
- Mantener: fondo lima, mapa SVG animado, carro animado, textos, línea decorativa inferior. El hero queda como banner.

Archivo: `src/routes/pasajero.tsx`
- Quitar el `onPedir` y el `id="pedir-form"` ya no es necesario (pero no estorba — lo dejamos por compatibilidad de scroll).
- `<PasajeroHero nombre={...} />` sin callback.
- El formulario `PedirServicioForm` queda inmediatamente debajo del hero, así que el usuario lo ve enseguida tras el splash.

---

## 3. Optimizaciones de rendimiento

### 3.1 Lazy-load de componentes pesados en `/pasajero`
Convertir a `React.lazy` + `Suspense` con fallback ligero:
- `TramiAssistant` (chatbot, no crítico para LCP).
- `ReportarIncidenteModal` (solo se monta al abrir).
- `AccessibilityPanel` (panel desplegable).
- `InstallAppBanner`, `PushNotificationsToggle` (debajo del fold).

Esto reduce el JS inicial de la ruta `/pasajero` significativamente (chatbot y modales suelen ser los más pesados).

### 3.2 Lazy-load del splash en login
- `PasajeroWelcomeSplash` con `React.lazy` para que no infle el bundle de `/login`.

### 3.3 Optimización de imágenes
- Para `welcome-trammos.png`: importar con `?w=720&format=webp` (ya soportado por Vite si está disponible) o, alternativamente, agregar `loading="eager"` + `decoding="async"` y `fetchPriority="high"` solo en el splash. En el resto de imágenes (`banner-trammos`, `banner-corona`, `banner-sodimac`) marcar `loading="lazy"` y `decoding="async"`.

### 3.4 Realtime subscription cleanup
- Verificar (en `pasajero.tsx`) que el canal `solicitudes-pasajero-self` se suscribe solo cuando hay `user`. Ya está, pero añadir guard para evitar re-suscripciones innecesarias.

### 3.5 Memoización menor
- Envolver `PasajeroHero` en `React.memo` (props estables = solo `nombre`).
- `useMemo` para `primerNombre` dentro del Hero (evita split en cada render).

### 3.6 Reducir trabajo en el efecto del fetch de info del vehículo
- Saltar el RPC `get_vehiculo_publico_por_placa` si la `placa` no cambió (ya lo hace por dependencia, pero añadir early-return si `vehiculoInfo?.foto_url` ya corresponde a la misma placa cacheada en un `useRef`).

### 3.7 Service worker / PWA
- Confirmar que `public/sw.js` cachea las rutas estáticas básicas (no se modifica si ya lo hace; solo verificación, no cambio invasivo).

---

## Archivos a crear / modificar

**Crear**
- `src/assets/welcome-trammos.png` (copia de la imagen subida)
- `src/components/pasajero/PasajeroWelcomeSplash.tsx`

**Modificar**
- `src/routes/login.tsx` — disparar splash en flujo pasajero
- `src/components/pasajero/PasajeroHero.tsx` — quitar CTA, memo
- `src/routes/pasajero.tsx` — `lazy()` de componentes pesados, hero sin callback

---

## Resultado esperado

- Pasajero hace login → ve un splash branded ~1.8s con la imagen TRAMMOS → aterriza directamente en la pantalla de pedir carro.
- El hero decorativo sigue ahí pero sin botón redundante.
- La página `/pasajero` carga más rápido al diferir chat, modales y paneles auxiliares.

¿Apruebas?
