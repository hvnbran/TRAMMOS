
El usuario quiere que la transición del login al dashboard no sea un corte abrupto, sino una animación de ~2 segundos. Necesito diseñar una experiencia de transición fluida.

## Análisis actual

En `src/routes/login.tsx`, tras un `signIn` exitoso se hace `navigate({ to: "/" })` inmediatamente → corte seco.

## Propuesta: Splash de transición animado (~2s)

Una pantalla de bienvenida con el banner TRAMMOS que aparece tras login exitoso, antes de navegar al dashboard.

### Secuencia (≈2 segundos total)

```text
0.0s  Login submit → loader en botón
0.3s  signIn() OK → fade-out del formulario (300ms)
0.6s  Splash overlay aparece con fondo blanco
0.6s  Banner TRAMMOS hace scale-in + fade-in (500ms)
1.1s  Tagline "Bienvenido, [Usuario]" fade-in (300ms)
1.4s  Barra de progreso anima de 0% a 100% (500ms)
1.9s  Fade-out del splash (200ms)
2.1s  navigate({ to: "/" }) → dashboard
```

### Implementación

**Archivo a editar**: `src/routes/login.tsx`

1. Nuevo estado `showSplash: boolean` además de `submitting`.
2. Tras `signIn` exitoso: en vez de navegar de inmediato, `setShowSplash(true)` y un `setTimeout(() => navigate({ to: "/" }), 2000)`.
3. Renderizar condicionalmente un overlay full-screen cuando `showSplash` sea true:
   - Fondo blanco con `animate-fade-in`
   - Banner centrado con `animate-scale-in`
   - Texto "Bienvenido a TRAMMOS" con delay
   - Barra de progreso animada con `transition-all duration-[1500ms]`

4. Usar utilidades ya existentes en el proyecto (`animate-fade-in`, `animate-scale-in` están en el knowledge de animaciones, y Tailwind las soporta vía `tailwindcss-animate`).

### Bonus opcional (incluido)

- Micro-animación al **entrar al login**: el formulario hace fade-in suave al cargar la página (mejora la primera impresión sin costo).
- El botón "Iniciar sesión" cambia el texto de "Iniciar sesión" → "Verificando..." → "¡Bienvenido!" según el estado.

### Detalles técnicos

- No requiere nuevas dependencias.
- No toca el AuthContext ni la lógica de Supabase — solo retrasa la navegación visual.
- Si hay error de credenciales, NO se muestra splash (solo en éxito).
- El splash usa `position: fixed inset-0 z-50` para cubrir todo.
- Los timers se limpian en cleanup por si el componente se desmonta.

### Archivos afectados

- `src/routes/login.tsx` — único archivo modificado.

No se necesitan cambios en estilos globales: las animaciones `fade-in`, `scale-in` y `animate-pulse` ya están disponibles vía Tailwind.
