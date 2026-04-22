

## Plan: Dos presentaciones PPTX ejecutivas — TRAMMOS Accesible para Corona y Sodimac

Generaré **dos archivos PPTX separados**, uno por cliente, con cifras adaptadas a su tamaño y contexto. Ambas usarán la identidad visual TRAMMOS (cyan #00B8DE, lime #C5E86C, gris oscuro K:70) y se entregarán en `/mnt/documents/`.

### Estructura común (10 slides cada una)

1. **Portada** — Logo TRAMMOS + "Caso de Negocio: Accesibilidad como ROI" + nombre del cliente
2. **El problema** — Costo de NO ser accesible (multas Ley 1618, exclusión de licitaciones, pérdida ESG)
3. **Marco regulatorio** — Tabla Ley 1618, Resolución 1519, Decreto 1421, NTC 5854 con sanciones cuantificadas
4. **Beneficio tributario directo** — Deducción 200% Ley 361 con cálculo específico para el cliente
5. **Mercado desbloqueado** — Estadísticas DANE (3.1M discapacidad, 6.8M adultos mayores) aplicadas al cliente
6. **Reducción de costos operativos** — Tabla comparativa SIN vs CON TRAMMOS Accesible
7. **Impacto ESG y costo de capital** — Cifras de rating MSCI aplicadas al tamaño del cliente
8. **Resumen ROI** — Slide de impacto con número grande: "Por cada $1 invertido, recupera $X"
9. **Cómo lo entregamos** — Las funciones reales ya implementadas en TRAMMOS (panel de accesibilidad, lectura por voz, alto contraste, modo simple, daltonismo, navegación por teclado)
10. **Cierre** — Llamado a la acción + datos de contacto

### Diferencias por cliente

**Corona** (manufactura, ~14.000 empleados, ingresos ~$3 billones COP):
- Cifras grandes en costo de capital (~$24-36 mil millones/año por mejora ESG)
- Foco en transporte de personal a plantas (Madrid, Sopó, Girardota)
- Beneficio tributario sobre 50-100 empleados con discapacidad potenciales
- Paleta: cyan dominante (corporativo, manufactura)

**Sodimac** (retail, ~8.000 empleados, alta rotación):
- Foco en transporte a 40+ tiendas en Colombia
- Costo de rotación reducido como argumento principal
- Inclusión de cuidadores y adultos mayores como segmento de clientes finales
- Cifras de licitaciones con grandes superficies y contratos públicos
- Paleta: lime más presente (retail, energía, dinamismo)

### Diseño visual

- Tema "Charcoal Minimal" + acentos cyan/lime TRAMMOS
- Tipografía: Calibri títulos bold + Calibri Light cuerpo
- Cada slide con elemento visual: tablas de ROI, callouts con cifras grandes (60-72pt), iconos en círculos cyan
- Layouts variados: dos columnas, grid 2x2, stat callouts grandes, comparativos antes/después
- Imágenes embebidas como base64 (logo TRAMMOS desde `src/assets/logo-trammos.jpeg`)

### Proceso técnico

1. Leer logo TRAMMOS y paleta de colores oficial desde `mem://design/brand-colors`
2. Generar `trammos_accesible_corona.pptx` y `trammos_accesible_sodimac.pptx` con `pptxgenjs`
3. **QA obligatorio**: convertir cada PPTX a PDF con LibreOffice → imágenes con `pdftoppm` → inspeccionar TODAS las slides (overflow, contraste, alineación, ortografía de cifras)
4. Iterar hasta que ambas presentaciones estén impecables
5. Entregar con tags `<lov-artifact>`

### Entregables finales

- `/mnt/documents/trammos_accesible_corona.pptx`
- `/mnt/documents/trammos_accesible_sodimac.pptx`

### Lo que NO hace este plan

- No modifica código de la aplicación TRAMMOS (las funciones de accesibilidad ya están implementadas en Fases 1, 2 y 3 anteriores)
- No requiere base de datos ni edge functions
- Es un entregable comercial puro para tu equipo de ventas

