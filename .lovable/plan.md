## Objetivo

Cumplir con la **Ley 1581 de 2012 (Habeas Data Colombia)** y el **Decreto 1377 de 2013** registrando de forma auditable la autorización de tratamiento de datos personales de pasajeros, operadores y conductores. La política se redacta de forma genérica mencionando *"clientes empresariales"* (sin nombrar Corona ni Sodimac). Razón social, NIT y correo de contacto se dejan como **placeholders editables** (`{{RAZON_SOCIAL}}`, `{{NIT}}`, `{{CORREO_PRIVACIDAD}}`) que se reemplazan luego con un solo cambio.

---

## 1. Páginas legales públicas

Dos rutas accesibles **sin login** (excluidas del `AuthGate` en `__root.tsx`):

- `src/routes/legal.terminos.tsx` → Términos y Condiciones de uso de TRAMMOS.
- `src/routes/legal.privacidad.tsx` → Política de Tratamiento de Datos Personales.

Contenido de la **Política de Privacidad** (estructura mínima exigida por la SIC):

1. Identificación del Responsable: `{{RAZON_SOCIAL}}`, NIT `{{NIT}}`, correo `{{CORREO_PRIVACIDAD}}`, dirección y ciudad.
2. Finalidades del tratamiento: prestación del servicio de transporte especial, asignación de conductores y vehículos, monitoreo, reportes a **clientes empresariales** que contratan el servicio, facturación, contacto en emergencias, cumplimiento legal.
3. Datos recolectados: identificación, contacto, ubicación, condición de discapacidad y salud (PCD), documentos de vehículos y conductores.
4. **Datos sensibles** (salud, discapacidad): tratamiento separado con consentimiento expreso y derecho a no responder.
5. Derechos del titular (art. 8 Ley 1581): conocer, actualizar, rectificar, suprimir, revocar autorización, presentar quejas ante la SIC.
6. Canal y procedimiento para ejercer derechos: correo `{{CORREO_PRIVACIDAD}}`, plazo de respuesta 15 días hábiles.
7. Transferencia/transmisión: los datos pueden compartirse con los **clientes empresariales** que contratan el servicio, en su rol de encargados/destinatarios, bajo acuerdo de confidencialidad.
8. Tiempo de conservación y medidas de seguridad.
9. Vigencia y fecha de última actualización (`2026-05-04`).

Términos y Condiciones: aceptación del servicio, cuenta y credenciales, conducta esperada, limitación de responsabilidad, propiedad intelectual de TRAMMOS, ley aplicable (Colombia), modificaciones.

Diseño: layout claro, marca TRAMMOS, sin sidebar, botón "Volver al inicio". Texto versionado en `src/content/legal/*.md` para conservar prueba histórica.

---

## 2. Base de datos: tabla `policy_acceptances`

Migración nueva:

```text
policy_acceptances
  id              uuid PK
  user_id         uuid (auth.uid, nullable)
  pasajero_id     uuid (FK lógico a pasajeros_pcd, nullable)
  email           text (snapshot)
  policy_type     text  -- 'terminos' | 'privacidad' | 'datos_sensibles_pcd'
  policy_version  text  -- '2026-05-04'
  accepted_at     timestamptz default now()
  ip              text
  user_agent      text
  metadata        jsonb -- { contexto: 'login_operador' | 'login_pasajero' | 'registro_pcd' | 'reaceptacion' }
```

Índices: `(user_id, policy_type)`, `(pasajero_id)`, `(email)`.

RLS:
- INSERT: autenticado puede insertar fila propia (`auth.uid() = user_id`) o el server function (service role) puede insertar para terceros con `pasajero_id`.
- SELECT: el propio usuario, admin (`has_role admin`), y staff con `can_access_cliente` cuando hay `pasajero_id` del cliente correspondiente.
- UPDATE/DELETE: solo admin (auditoría inmutable en la práctica).

Constante en `src/lib/legal/version.ts`:
```ts
export const CURRENT_POLICY_VERSION = "2026-05-04";
```

---

## 3. Captura del consentimiento

### 3.1 Login del operador (`src/routes/login.tsx`, pestaña Operador)
- Checkbox obligatorio bajo el formulario:
  *"He leído y acepto los [Términos] y la [Política de Privacidad]."*
- Botón "Iniciar sesión" deshabilitado hasta marcar.
- Tras `signIn` exitoso → llamar server function `recordPolicyAcceptance` con `types=['terminos','privacidad']`, `contexto='login_operador'`. Si el usuario ya tiene aceptación con `policy_version` actual, se omite el insert.

### 3.2 Login del pasajero (paso `email`, antes de pedir OTP)
- Mismo checkbox, mismos enlaces.
- Tras OTP verificado y `link_pasajero_to_auth` exitoso → registrar aceptación con `contexto='login_pasajero'` y `pasajero_id` del registro vinculado.

### 3.3 Registro de pasajero PCD (`src/routes/pasajeros-pcd.tsx`)
- El campo existente `consentimiento_datos` se reescribe:
  *"Como tutor/representante legal o titular, autorizo expresamente el tratamiento de **datos sensibles de salud y discapacidad** del pasajero conforme a la [Política de Privacidad]."*
- Link visible a `/legal/privacidad`.
- Al guardar el pasajero (insert o update con consentimiento que pasa de false→true), insertar fila en `policy_acceptances` con `policy_type='datos_sensibles_pcd'`, `pasajero_id`, `email` del pasajero, `metadata.contexto='registro_pcd'`.

### 3.4 Re-aceptación al subir versión
- Hook `useEnforcePolicyAcceptance()` montado en `__root.tsx` dentro del `AuthGate`. Al hidratar sesión, consulta la última aceptación del usuario para `policy_type='privacidad'`.
- Si `policy_version < CURRENT_POLICY_VERSION` → renderiza `PolicyReacceptModal` bloqueante que resume cambios y exige nueva aceptación. Sin aceptar no se puede usar la app.

---

## 4. Componentes y helpers nuevos

- `src/components/legal/LegalLinks.tsx` — par de `<Link>` reutilizables a `/legal/terminos` y `/legal/privacidad`.
- `src/components/legal/PolicyAcceptanceCheckbox.tsx` — checkbox controlado con estilo TRAMMOS, usado en ambos flujos de login.
- `src/components/legal/PolicyReacceptModal.tsx` — modal bloqueante de re-aceptación.
- `src/components/legal/LegalPageLayout.tsx` — layout simple para las páginas legales (header con logo, contenido en `prose`, footer con fecha de versión).
- `src/lib/legal/version.ts` — constante `CURRENT_POLICY_VERSION`.
- `src/lib/legal/record-acceptance.ts` — wrapper cliente que llama al server function.
- `src/server/legal.functions.ts` — `recordPolicyAcceptance` (createServerFn con `requireSupabaseAuth`, lee IP del header `x-forwarded-for`, valida con zod, hace insert).
- `src/content/legal/privacidad-2026-05-04.md` y `terminos-2026-05-04.md` — texto versionado.

---

## 5. Footer global con accesos legales

Para garantizar que los enlaces a las políticas siempre estén visibles (requisito de la Ley 1581):

- `src/components/layout/AppLayout.tsx` → footer minimal: *"© TRAMMOS · [Términos] · [Privacidad] · {{CORREO_PRIVACIDAD}}"*.
- `src/routes/pasajero.tsx` → mismo footer al final del scroll.
- `src/routes/login.tsx` → enlaces visibles bajo el card de login.

---

## 6. Panel admin: historial de consentimientos

En `src/routes/pasajeros-pcd.tsx`, dentro de la ficha del pasajero (junto al `AccesoPasajeroPanel`), agregar un bloque colapsable **"Historial de consentimientos"** que liste las filas de `policy_acceptances` para ese `pasajero_id`: fecha, tipo, versión, IP, user-agent. Sirve como prueba ante una visita de la SIC.

---

## 7. Detalles técnicos

- **IP confiable**: el server function `recordPolicyAcceptance` lee `request.headers.get("x-forwarded-for")` (primer IP) o `cf-connecting-ip`. El cliente nunca envía la IP.
- **Validación**: `zod` para `policy_type`, `policy_version`, `contexto`, `pasajero_id` (uuid opcional).
- **Trigger en `pasajeros_pcd`**: rechazar INSERT si `consentimiento_datos = false` (evita registros sin autorización). En UPDATE permitir cualquier valor para soportar revocación.
- **Sin tocar esquemas reservados** (`auth`, `storage`, `realtime`).
- **Re-uso del esquema existente**: no se modifica `pasajeros_pcd.consentimiento_datos` (booleano sigue), solo se complementa con la fila auditable.
- **Placeholders**: `{{RAZON_SOCIAL}}`, `{{NIT}}`, `{{CORREO_PRIVACIDAD}}` viven en `src/lib/legal/empresa.ts` como constantes; cuando me pases los datos reales, se cambia un solo archivo.

---

## Archivos a crear

- `supabase/migrations/<timestamp>_policy_acceptances.sql`
- `src/routes/legal.terminos.tsx`
- `src/routes/legal.privacidad.tsx`
- `src/lib/legal/version.ts`
- `src/lib/legal/empresa.ts`
- `src/lib/legal/record-acceptance.ts`
- `src/server/legal.functions.ts`
- `src/components/legal/LegalLinks.tsx`
- `src/components/legal/LegalPageLayout.tsx`
- `src/components/legal/PolicyAcceptanceCheckbox.tsx`
- `src/components/legal/PolicyReacceptModal.tsx`
- `src/content/legal/privacidad-2026-05-04.md`
- `src/content/legal/terminos-2026-05-04.md`

## Archivos a modificar

- `src/routes/__root.tsx` — excluir `/legal/*` del `AuthGate`, montar `PolicyReacceptModal`.
- `src/routes/login.tsx` — checkbox en operador y pasajero, registrar aceptación tras éxito.
- `src/routes/pasajeros-pcd.tsx` — texto mejorado del consentimiento, link a política, registrar aceptación al guardar, bloque de historial.
- `src/components/layout/AppLayout.tsx` — footer con links legales.
- `src/routes/pasajero.tsx` — footer con links legales.

---

## Pendiente del usuario (no bloquea implementación)

Cuando los tengas a mano me pasas y los reemplazo en `src/lib/legal/empresa.ts`:
1. Razón social exacta de TRAMMOS.
2. NIT.
3. Correo oficial para ejercer derechos del titular (sugerido `privacidad@trammos.app`).
4. Dirección y ciudad.
