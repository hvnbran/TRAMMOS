# Arreglar animación de intro del CRM

## Problema
La intro del CRM se monta pero salta directamente al estado final (efecto "cut") en lugar de reproducir la secuencia logo → grid → progress que armamos. Causas en `src/components/crm/CrmIntro.tsx`:

1. **Transiciones que no disparan**: el código asigna `style.transition` y `style.opacity = "1"` (u otra propiedad) en el mismo tick de JS. Sin un `requestAnimationFrame` entre "estado inicial" y "estado final", muchos navegadores aplican el cambio sin animar, lo que se ve exactamente como un corte.
2. **Doble montaje en dev (StrictMode / HMR)**: el efecto corre, hace cleanup (`aliveRef = false`, limpia timeouts), y vuelve a correr. La IIFE asíncrona del primer ciclo sigue viva pero opera sobre nodos DOM ya desmontados, y la del segundo ciclo compite con ella. Resultado: nodos visibles se quedan en su estado inicial o final sin pasar por la secuencia.
3. **Refs capturados al inicio de la IIFE**: si la primera corrida es cancelada a mitad, los nodos viejos quedan con `opacity:0` un instante y luego se reemplazan por los nuevos, produciendo el flash.
4. **Cleanup del listener `resize`**: hoy se guarda en `(canvas as any).__cleanupResize`, pero el canvas se vuelve a crear en el segundo montaje y el listener viejo nunca se quita.

## Cambios (solo `src/components/crm/CrmIntro.tsx`)

1. **Disparo correcto de transiciones**: para cada paso (logo, wordmark, CRM, tag, fade del logo, fade-in del grid, cards), aplicar primero el `transition` y luego, dentro de `requestAnimationFrame(() => requestAnimationFrame(...))`, cambiar la propiedad final. Esto garantiza que el browser registre el estado inicial antes del final.
2. **Protección contra doble montaje**:
   - Usar un módulo-level `let introPlayed = false` para que la intro se ejecute una sola vez por sesión de página (la segunda invocación —StrictMode o re-mount del layout al navegar entre rutas del CRM— se salta y no renderiza nada).
   - Esto también responde al punto que dejamos pendiente: la intro corre solo al entrar al CRM, no en cada cambio de pestaña.
3. **Refactor del bucle de canvas y cleanup**:
   - Mover la función `setSize` a una variable del scope del efecto y removerla explícitamente en `cleanup`.
   - En `cleanup`: cancelar `rafRef`, limpiar todos los `timeoutsRef`, quitar el listener `resize`, y marcar `aliveRef = false`. Quitar el hack `(canvas as any).__cleanupResize`.
4. **Sustituir el patrón `await wait + mutar style` por un mini-helper**:

```text
animateStep(el, {transition, props}) →
  el.style.transition = transition;
  rAF(rAF(() => Object.assign(el.style, props)));
  await wait(durationOfThatStep);
```

   Cada paso queda atómico y legible, y la pausa entre pasos se vuelve solo el tiempo de la propia transición.
5. **Mantener todo lo demás igual**: misma duración total (~5.5s), misma paleta lima/cian, mismo fade-out, mismo respeto a `prefers-reduced-motion`, misma grilla de 11 módulos con check ✓ y progress bar.

## Verificación
- Abrir `/crm` en el preview tras login, confirmar visualmente: logo aparece con scale+rotate, wordmark TRAMMOS entra desde la derecha, "CRM" se "abre" con clip-path, tagline cambia de color, fade al grid, los 11 módulos se marcan uno por uno, "SISTEMA LISTO ✓" y fade-out.
- Navegar entre `/crm/clientes` → `/crm/pipeline` y verificar que la intro **no vuelve a salir** (flag de sesión).
- Recargar la pestaña → la intro vuelve a reproducirse desde cero.
- Activar `prefers-reduced-motion` en DevTools → debe cerrar en ~400ms sin animación.

## Fuera de alcance
No se tocan `CrmLayout`, rutas, ni autenticación. Solo se reescribe la secuencia y el cleanup dentro de `CrmIntro.tsx`.
