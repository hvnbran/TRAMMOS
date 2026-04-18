
El usuario subió un banner horizontal "TRAMMOS - TRANSPORTES ESPECIALES" (logo tipográfico con degradado cyan→lime en las letras MM) y pregunta dónde lo usaría. No es una orden de implementación todavía, es una consulta de criterio. Recomendaré los lugares con mejor sentido visual y de marca.

## Análisis del banner

- **Formato**: horizontal/apaisado (~3:1), texto sobre fondo claro.
- **Contenido**: nombre de marca + tagline ("Transportes Especiales").
- **Diferencia con el logo actual** (`logo-trammos.png`): ese es un ícono cuadrado para usar en espacios reducidos (sidebar colapsado, favicon). Este banner es para espacios anchos donde se busca presencia de marca + tagline.

Por la forma horizontal y la presencia del tagline, no debe reemplazar al ícono cuadrado del sidebar ni al avatar de login — funcionaría mal recortado.

## Lugares recomendados (por prioridad)

1. **Página de Login** — reemplazar el ícono + título "TRAMMOS / Sistema de Transporte Especial" por el banner. Es el primer punto de contacto, hay espacio horizontal de sobra y el tagline ya viene incluido en la imagen → más limpio que el bloque actual.

2. **Encabezado de documentos PDF / reportes exportables** — cuando se generen reportes de cumplimiento ANS, facturación o servicios, este banner es ideal como cabecera corporativa (formato apaisado pensado para hojas A4/carta).

3. **Email templates / notificaciones** — si más adelante se envían correos (alertas de vencimiento, confirmaciones), el banner funciona perfecto como header del email.

4. **Open Graph / preview al compartir el link** (`og:image`) — cuando alguien comparta `trammos.lovable.app` en WhatsApp/Slack/LinkedIn, este banner se ve mucho mejor que el ícono cuadrado.

5. **Pantalla de carga / splash inicial** (opcional) — un loader breve mientras se inicializa la sesión.

## Lugares donde NO conviene usarlo

- Sidebar (colapsado o expandido) → demasiado ancho, el ícono cuadrado actual es correcto.
- Favicon / pestaña del navegador → ilegible a 32px.
- Avatares o badges pequeños.

## Propuesta de implementación (si aprueba)

Sugiero empezar por los dos de mayor impacto visible:

**A. Login** — guardar el banner como `src/assets/banner-trammos.png` y reemplazar en `src/routes/login.tsx`:
```text
[ícono 64x64]              →    [BANNER TRAMMOS]
TRAMMOS                          (tagline ya incluido)
Sistema de Transporte Especial
```

**B. og:image** — agregar el banner como meta tag en `src/routes/__root.tsx` para que aparezca al compartir el sitio.

Los demás usos (PDFs, emails, splash) los dejaría para cuando existan esas funcionalidades.

## Pregunta para el usuario
