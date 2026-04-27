
# Portal de Pasajeros TRAMMOS — "Pide tu carro"

Separamos completamente dos experiencias:
- **Operación** (lo que ya existe): admins, Corona, Sodimac → siguen con Sidebar, dashboard, gestión de servicios, etc.
- **Pasajero** (nuevo): solo pasajeros autorizados → entran con su correo + código OTP, ven una sola pantalla mobile-first para pedir y rastrear su servicio.

---

## 1. Modelo de pasajero autorizado

Reutilizamos y extendemos `pasajeros_pcd` (ya existe con nombre, cédula, teléfono, email, perfil de accesibilidad) en lugar de duplicar tablas. Le agregamos lo necesario para que pueda iniciar sesión:

- `auth_user_id uuid` → vínculo con `auth.users` cuando active su cuenta.
- `autorizado boolean default true` → el admin puede revocar acceso sin borrar el perfil.
- `direccion_habitual text`, `centros_costo_permitidos text[]` → para autocompletar pedidos.

Nueva tabla `solicitudes_pasajero` (los pedidos que crea el pasajero desde su app):
- `id`, `pasajero_pcd_id`, `cliente`, `origen`, `destino`, `hora_recogida`, `notas`
- `estado` (`solicitada` | `aceptada` | `en_camino` | `a_bordo` | `finalizada` | `cancelada`)
- `servicio_id` (FK al `servicios` cuando un admin la convierte en servicio formal)
- timestamps + `created_by_pasajero auth_user_id`

RLS:
- Pasajero ve/edita **solo sus propias** solicitudes (`auth.uid() = created_by_pasajero`).
- Admin/Corona/Sodimac ven todas las de su cliente (vía `can_access_cliente`).

Nuevo rol en el enum `app_role`: `'pasajero'`. Función `has_role(uid, 'pasajero')` para gating.

---

## 2. Login con código de verificación (OTP por email)

Aprovechamos el OTP nativo de Supabase Auth (mismo flujo que un magic link, pero con código de 6 dígitos):

1. Pasajero entra a `/login` y elige tab **"Soy pasajero"**.
2. Escribe su correo. El sistema valida que exista un `pasajeros_pcd` con ese email y `autorizado = true`.
3. Llamamos `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: { display_name } } })` → llega un código de 6 dígitos al correo.
4. Pasajero pega el código → `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
5. Trigger en backend (server function): al primer login del pasajero le asigna el rol `'pasajero'` y enlaza `pasajeros_pcd.auth_user_id`.

**Sobre la "contraseña automática Brandonmunetontrammos":** se la generamos y guardamos como respaldo, pero el flujo principal es OTP (más seguro y más amigable: no tiene que recordarla). Se la mostramos al admin en el panel "Pasajeros PCD" como contraseña de emergencia que puede dictarle.

**Pasajero seed para pruebas:** Brandon Muñeton — `Brandonmunetonavendano@gmail.com` — password backup `Brandonmunetontrammos` — cliente Corona.

Auth emails: como ya existe Lovable Cloud, el OTP se envía con la plantilla de Supabase por defecto. Si quieres branding TRAMMOS en el email, lo dejamos para una segunda iteración (requiere configurar dominio de envío).

---

## 3. Nueva interfaz "Mi viaje" (`/pasajero`)

Ruta protegida por nuevo guard que exige rol `pasajero`. Si un admin entra ahí lo redirigimos a `/`, y si un pasajero intenta entrar a `/servicios` lo mandamos a `/pasajero`.

Layout **completamente distinto** al Sidebar de operación: una sola pantalla full-height, mobile-first, sin barra lateral.

### Pantalla principal (estado: sin viaje activo)

```text
┌──────────────────────────────┐
│ ☰   Hola, Brandon       👤  │
├──────────────────────────────┤
│  📍 ¿A dónde vas hoy?        │
│  ┌────────────────────────┐  │
│  │ Origen: Mi casa     ▼ │  │  ← autocompleta con dirección habitual
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Destino                │  │
│  └────────────────────────┘  │
│  🕐 Hora:  [Ahora] [Programar]│
│  ✏️ Notas para el conductor  │
│                              │
│  [  PEDIR MI CARRO  🚗  ]    │  ← botón grande, alto contraste
└──────────────────────────────┘
```

- Botón "Pedir mi carro" grande (≥56px), con `SpeakButton` para que lea las instrucciones.
- Atajos rápidos: "Ir al trabajo", "Ir a casa", "Repetir último viaje".
- Brief PCD del propio pasajero visible en la parte inferior ("Tu perfil dice: silla de ruedas plegable, prefiere comunicación con pictogramas") con botón "Editar mi perfil".

### Pantalla "Viaje en curso" (estilo Uber simple)

Cuando hay solicitud activa, la pantalla cambia a:

```text
┌──────────────────────────────┐
│   Estado: EN CAMINO          │
│   ┌───────────────────────┐  │
│   │     [AccessibleMap]   │  │  ← reutilizamos el componente
│   │   Vehículo a 4 min    │  │
│   └───────────────────────┘  │
│   👤 Conductor: Juan Pérez   │
│   🚗 Toyota Hilux · KTX-512  │
│   📞 [Llamar]  💬 [Chat]      │
│                              │
│   [ 🆘 BOTÓN DE PÁNICO ]     │
│   [   Cancelar viaje    ]    │
└──────────────────────────────┘
```

- Reutiliza `AccessibleMap` (vibración + narración por voz cuando llega).
- Estado del viaje en pictograma + texto grande + voz automática en cada cambio.
- El pasajero NO ve precios, números de orden internos, ni datos administrativos.

### Header del pasajero

Mini-header con: nombre, botón accesibilidad (mismo `AccessibilityPanel` ya existente, con todas las opciones: contraste, lectura fácil, pictogramas, voz), botón TRAMI (asistente de voz reutilizado), cerrar sesión.

---

## 4. Responsive: web + celular

- Layout mobile-first (max-width 480px centrado en desktop con marco "tipo app", o full-width si prefieres).
- Touch targets ≥44px, tipografía base 18px, tap states grandes.
- Mismo código corre en navegador móvil y desktop — usamos `useMobile` solo para ajustar márgenes.
- PWA-ready (añadimos `manifest.json` mínimo + meta tags para que se pueda "instalar" en el home del celular). Solo metadata, no service worker offline en esta iteración.

---

## 5. Integración con la operación

- Cuando el pasajero crea una solicitud → aparece automáticamente en `/operacion` con badge "📥 Solicitud nueva de pasajero".
- El admin puede aceptarla con un click → se crea el `servicios` correspondiente, se asigna conductor/vehículo, y el `solicitudes_pasajero.estado` cambia a `aceptada`.
- Realtime (Supabase Realtime sobre `solicitudes_pasajero` y `servicios`) para que el pasajero vea el cambio de estado en tiempo real sin recargar.
- Notificación push-like en `NotificationsBell` del admin cuando entra una solicitud nueva.

---

## 6. Panel admin "Pasajeros autorizados"

Ampliamos `/pasajeros-pcd` con:
- Switch "Autorizado para pedir servicios".
- Botón "Reenviar código de acceso" (dispara OTP nuevo).
- Indicador "Cuenta activa desde DD/MM/YYYY" o "Aún no ha iniciado sesión".
- Mostrar contraseña de respaldo generada (solo a admin).

---

## Detalles técnicos

**Migración SQL:**
- `ALTER TYPE app_role ADD VALUE 'pasajero';`
- `ALTER TABLE pasajeros_pcd ADD COLUMN auth_user_id uuid, autorizado boolean DEFAULT true, direccion_habitual text, centros_costo_permitidos text[], password_backup text;`
- `CREATE TABLE solicitudes_pasajero (...)` con RLS que permite al pasajero CRUD de las suyas y a admins/cliente las suyas.
- Función `link_pasajero_to_auth(_email)` (security definer) para vincular `auth_user_id` y asignar rol al primer login.
- Trigger en `auth.users` insert que detecta si el email coincide con un `pasajeros_pcd.email` autorizado y dispara el link automático.
- `ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes_pasajero;`

**Auth context:**
- Extender `AppRole` con `'pasajero'`.
- Nuevo `useIsPasajero()` helper.

**Rutas:**
- `src/routes/login.tsx` → tabs "Operador / Pasajero" + flujo OTP.
- `src/routes/pasajero.tsx` → layout sin Sidebar, contiene las dos pantallas (formulario / viaje activo).
- `src/routes/pasajero.perfil.tsx` → edición rápida del perfil PCD por el propio pasajero.
- Guard en `__root.tsx`: si rol = `pasajero` y ruta ≠ `/pasajero*` → redirect a `/pasajero`. Si rol ≠ `pasajero` y ruta empieza con `/pasajero` → redirect a `/`.

**Componentes nuevos:**
- `src/components/pasajero/PedirServicioForm.tsx`
- `src/components/pasajero/ViajeEnCurso.tsx`
- `src/components/pasajero/PasajeroHeader.tsx`
- `src/components/pasajero/AtajosFrecuentes.tsx`

**Reutilizamos sin tocar:** `AccessibleMap`, `SpeakButton`, `SimplifyText`, `Pictograma`, `TramiAssistant`, `AccessibilityPanel`, `a11y-context`.

**PWA mínima:** `public/manifest.json` + meta tags en `__root.tsx` (theme-color, apple-touch-icon).

**Seed inicial:** insertamos a Brandon Muñeton en `pasajeros_pcd` con cliente Corona, autorizado, password backup `Brandonmunetontrammos`. En el primer OTP se le crea el usuario en `auth.users` y se enlaza automáticamente.

---

## Lo que NO incluye esta fase (queda para después)

- Cálculo de tarifa/precio al pasajero (no aplica al modelo actual de TRAMMOS).
- Chat en vivo conductor↔pasajero (por ahora botón "Llamar" usa `tel:`).
- Tracking GPS real del vehículo (seguimos con la simulación de `AccessibleMap`).
- Branding del email OTP (queda con plantilla por defecto de Supabase).
- Service Worker offline.

¿Procedo con esta implementación completa?
