# App de conductor para Android (APK)

La app instalable es un contenedor que abre `https://trammos.online/conductor`.
Todo lo que mejoremos en la web llega solo, sin reinstalar nada. Lo que agrega
la app instalada es:

- Ubicación en tiempo real **aunque la pantalla esté apagada** (aviso permanente
  “TRAMMOS Conductor en servicio”).
- Notificación en el celular cuando se le asigna un servicio.

## 1. Firebase (gratis) — ya está creado

El proyecto de Firebase `trammos-203cd` ya existe. Si necesitas volver a generar
los archivos:

1. Entrar a https://console.firebase.google.com → proyecto **TRAMMOS**.
2. En Configuración → Cuentas de servicio → **Generar nueva clave privada**:
   se descarga un archivo `.json`.
3. En Configuración → General → Tu apps → Android (`online.trammos.conductor`)
   → descargar `google-services.json`.

## 2. Guardar las credenciales

Hay dos archivos y cada uno va en un lugar diferente:

| Archivo | Qué es | Dónde se guarda |
|---|---|---|
| Clave privada de cuenta de servicio (`.json` largo con `private_key`) | Permite que el servidor envíe las notificaciones | Secreto del proyecto: `FIREBASE_SERVICE_ACCOUNT` |
| `google-services.json` | Identifica la app Android ante Firebase | Secreto de GitHub: `GOOGLE_SERVICES_JSON` |

### 2.1. `FIREBASE_SERVICE_ACCOUNT` (ya guardado)

Este secreto ya se guardó en el proyecto. El servidor lo usa automáticamente.

### 2.2. `GOOGLE_SERVICES_JSON` (tú lo pegas en GitHub)

1. Abre el archivo `google-services.json` que descargaste en un editor de texto
   (Bloc de notas, VS Code, etc.) y **copia TODO el contenido**.
2. Ve a GitHub → repositorio → **Settings → Secrets and variables → Actions**.
3. Presiona **New repository secret**.
4. Nombre: `GOOGLE_SERVICES_JSON`.
5. Value: pega todo el contenido del archivo.
6. Guarda con **Add secret**.

> Sin este paso el APK se compila, pero las notificaciones push no funcionarán
> en el celular.

## 3. Compilar el APK

Una vez guardado el secreto de GitHub:

1. Ve a GitHub → **Actions → "APK TRAMMOS Conductor"**.
2. Presiona **Run workflow**.
3. Espera unos minutos.
4. Al terminar, descarga el artefacto `trammos-conductor-apk` (dentro está
   `app-debug.apk`). Ese archivo se puede enviar por WhatsApp a los conductores.

En un computador con Android Studio también sirve:

```
bun run apk:build
```

## 4. Instalación en el celular del conductor

1. Abrir el archivo recibido por WhatsApp y aceptar “Instalar de todos modos”
   (Android pide permitir instalar desde esa app).
2. Al abrir, aceptar **Notificaciones**.
3. En “Estoy en línea”, aceptar la ubicación y elegir **Permitir todo el tiempo**
   (sin esa opción el rastreo se detiene al bloquear el teléfono).

## 5. Notas

- Si Firebase todavía no está configurado, la app funciona igual: la ubicación
  en segundo plano sirve y los avisos quedan registrados como “no configurado”.
- La versión web sigue disponible para quien prefiera no instalar nada.
