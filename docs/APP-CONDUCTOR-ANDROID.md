# App de conductor para Android (APK)

La app instalable es un contenedor que abre `https://trammos.online/conductor`.
Todo lo que mejoremos en la web llega solo, sin reinstalar nada. Lo que agrega
la app instalada es:

- Ubicación en tiempo real **aunque la pantalla esté apagada** (aviso permanente
  “TRAMMOS Conductor en servicio”).
- Notificación en el celular cuando se le asigna un servicio.

## 1. Firebase (gratis) — solo una vez

1. Entrar a https://console.firebase.google.com y crear un proyecto (por ejemplo
   “TRAMMOS”).
2. Agregar una aplicación **Android** con el identificador exacto:
   `online.trammos.conductor`.
3. Descargar el archivo `google-services.json`.
4. En Configuración del proyecto → Cuentas de servicio → **Generar nueva clave
   privada**: se descarga un archivo `.json`.
5. Guardar el contenido completo de ese `.json` en el proyecto como secreto
   `FIREBASE_SERVICE_ACCOUNT` (así el servidor puede enviar los avisos).
6. Guardar el contenido de `google-services.json` como secreto de GitHub
   `GOOGLE_SERVICES_JSON` (para compilar el APK).

## 2. Compilar el APK

En GitHub → Actions → “APK TRAMMOS Conductor” → **Run workflow**. Al terminar se
descarga el archivo `trammos-conductor-apk` (dentro está `app-debug.apk`), y ese
archivo se puede enviar por WhatsApp a los conductores.

En un computador con Android Studio también sirve:

```
bun run apk:build
```

## 3. Instalación en el celular del conductor

1. Abrir el archivo recibido por WhatsApp y aceptar “Instalar de todos modos”
   (Android pide permitir instalar desde esa app).
2. Al abrir, aceptar **Notificaciones**.
3. En “Estoy en línea”, aceptar la ubicación y elegir **Permitir todo el tiempo**
   (sin esa opción el rastreo se detiene al bloquear el teléfono).

## 4. Notas

- Si Firebase todavía no está configurado, la app funciona igual: la ubicación
  en segundo plano sirve y los avisos quedan registrados como “no configurado”.
- La versión web sigue disponible para quien prefiera no instalar nada.
