# Descarga del instalable (APK) junto al acceso del conductor

Objetivo: que cuando el administrador genere el acceso de un conductor, el mensaje de WhatsApp incluya también el enlace para instalar la app, y que exista una página sencilla donde el conductor descarga el archivo e ve sus pasos de instalación.

## Cómo funcionará

1. **El archivo se guarda en TRAMMOS.** Se crea un espacio de almacenamiento público llamado `app-conductor`. Ahí queda el instalable con un nombre fijo (`trammos-conductor.apk`), así el enlace nunca cambia aunque subas versiones nuevas.

2. **Página para subir el instalable (solo administradores).** En la ventana de "Acceso app" del conductor aparece una sección "Instalable Android" con:
   - Un botón para subir el archivo `.apk` (reemplaza el anterior).
   - La fecha de la última versión subida y su tamaño.
   - Un botón para descargar el archivo actual y comprobarlo.
   Si aún no se ha subido nada, se muestra el aviso "Todavía no has subido el instalable".

3. **Página pública de descarga: `trammos.online/app`.** Muestra el logo, un botón grande "Descargar la app", y los pasos de instalación en lenguaje sencillo (permitir instalación, aceptar notificaciones, permitir ubicación "todo el tiempo"). Si no hay archivo subido, indica que la versión web sigue disponible en `trammos.online/conductor`.

4. **Mensaje de WhatsApp mejorado.** El botón "Copiar mensaje para WhatsApp" pasa a incluir el acceso y la instalación en un solo texto:

```text
Hola Milton, este es tu acceso a TRAMMOS Conductor:

Cédula: 1017xxxxxx
Contraseña: A7KD2M9P

1) Instala la app: https://trammos.online/app
2) Ábrela y entra con tu cédula y contraseña.

Si prefieres no instalar nada, entra desde el navegador:
https://trammos.online/conductor/login
```

Se mantiene el botón para copiar solo la contraseña.

## Detalles técnicos

- Migración: bucket `app-conductor` público, con políticas de lectura para todos y de escritura/actualización/borrado solo para el rol `admin` (usando `has_role`).
- `src/components/conductor/GenerarAccesoConductor.tsx`: nueva sección de subida (input `file` con `accept=".apk"`), `supabase.storage.from("app-conductor").upload(..., { upsert: true })`, lectura de metadatos con `list()`, y nuevo texto del mensaje de WhatsApp. La subida solo se renderiza si el usuario tiene rol `admin`.
- Nueva ruta `src/routes/app.tsx` (pública, `noindex`) con `head()` propio: título, descripción, og:title, og:description, og:type y twitter:card. Resuelve la URL pública del archivo y verifica su existencia antes de mostrar el botón.
- Sin cambios en la lógica de contraseñas ni en el flujo de login.

## Nota

El archivo `.apk` lo generas en GitHub (Actions → "APK TRAMMOS Conductor") y luego lo subes desde esta nueva sección; yo no puedo compilarlo aquí.
