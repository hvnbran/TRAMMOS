# App de conductor como APK para Android

Convertimos la app de conductor en una aplicación instalable de Android (archivo APK que se envía por WhatsApp), con ubicación en tiempo real incluso con el celular bloqueado y avisos que suenan cuando se asigna un servicio.

## Qué va a cambiar para el conductor

1. Instala el archivo APK una sola vez y le queda el ícono de TRAMMOS en su celular.
2. Al abrir, la app le pide dos permisos: ubicación "siempre" y notificaciones.
3. Mientras esté en jornada, la app envía su ubicación en segundo plano (app minimizada o pantalla apagada), con un aviso permanente en la barra del celular que dice que TRAMMOS está compartiendo ubicación (Android lo exige).
4. Cuando le asignan un servicio, le llega una notificación con sonido, aunque tenga la app cerrada. Al tocarla, entra directo al detalle del servicio.
5. La versión web sigue funcionando igual para quien no quiera instalar nada.

## Trabajo a realizar

**1. Empaquetado Android**
- Agregar Capacitor con la plataforma Android, apuntando la app a la web ya publicada (trammos.online), así los cambios que hagamos siguen llegando sin reinstalar el APK.
- Ícono, nombre "TRAMMOS Conductor", pantalla de inicio y permisos declarados.

**2. Ubicación en segundo plano**
- Reemplazar el rastreo actual del navegador por rastreo nativo cuando la app corre dentro del APK (con respaldo al método web si es navegador).
- Envío cada pocos segundos o por distancia recorrida, con cola local para no perder puntos si se cae la señal.
- Encendido/apagado ligado al botón de jornada que ya existe.

**3. Notificaciones de asignación**
- Crear el proyecto gratuito de Google (Firebase) para notificaciones; te guío paso a paso y luego guardamos las credenciales de forma segura.
- Guardar el "token" del celular de cada conductor en la base.
- Enviar la notificación automáticamente cuando un servicio queda asignado a ese conductor (y también en servicios fijos del día).
- Registrar en el panel si la notificación se entregó, para saber si el conductor está localizable.

**4. Generación del archivo APK**
- Configurar un proceso automático y gratuito que compile el APK y lo deje disponible para descargar cada vez que hagamos cambios de la app nativa.
- Te entrego el archivo y un texto corto de instrucciones para los conductores (Android pide confirmar "instalar de origen desconocido").

## Detalles técnicos

- Capacitor 7 en modo `server.url` hacia el dominio publicado; el APK es un contenedor, no una copia estática del sitio.
- Plugins: `@capacitor/geolocation` + `@capacitor-community/background-geolocation` (o `capacitor-background-geolocation`), `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/device`.
- Nueva tabla `conductor_push_tokens` (user_id, token, plataforma, updated_at) con RLS: el conductor escribe solo su fila; admin lee. GRANTs incluidos en la migración.
- Envío FCM HTTP v1 desde un server function con la credencial guardada como secreto; disparo al asignar conductor en `servicios` (y al crear ejecución de servicio fijo).
- Capa `src/lib/gps/native-tracker.ts` que detecta `Capacitor.isNativePlatform()` y decide nativo vs. `watchPosition`; `ShareLocationToggle` la consume sin cambiar la UI.
- Compilación del APK con GitHub Actions (`gradlew assembleRelease` + firma con keystore guardado en secretos) publicando el APK como artefacto.

## Fuera de alcance por ahora

- Publicación en Google Play (queda posible más adelante con el mismo proyecto).
- Versión para iPhone.
