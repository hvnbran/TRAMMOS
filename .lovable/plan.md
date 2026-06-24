# Cambios en Operación

## 1. Tipos de servicio
En `src/components/operacion/TipoEditable.tsx` ampliar la lista a:
**Empresarial, Turismo, Salud, Escolar, Otro** (con colores de badge para cada uno).

## 2. Arreglar "Importar Excel"

Tu archivo tiene esta estructura:

| Código | CLIENTE | ORIGEN | DESTINO | DEPARTAMENTO | TIPO EMPRESA | valor |

El importador actual falla por dos razones:

- **Filtro "Solo amarillas" activado por defecto:** tu archivo no tiene celdas resaltadas en amarillo, así que descarta las 1.406 filas y queda en "Importar 0 rutas".
- **Ignora las columnas CLIENTE y TIPO EMPRESA:** asigna todo como Corona/Empresarial aunque el archivo diga otra cosa.

### Ajustes en `src/components/operacion/ImportarExcelModal.tsx`

- Reconocer también las columnas **CLIENTE**, **DEPARTAMENTO** y **TIPO EMPRESA** (además de las existentes).
- En modo "Auto", leer la columna **CLIENTE** fila por fila (`Corona` → corona, `Sodimac` → sodimac). Si no existe, mantener fallback a la columna SODIMAC URBANA actual.
- Leer la columna **TIPO EMPRESA** y guardarla como `tipo` del centro de costo, normalizada a uno de los 5 tipos válidos (Empresarial / Turismo / Salud / Escolar / Otro). Si está vacía o no coincide, usar "Empresarial".
- Cambiar el default de **"Solo amarillas" a desactivado** (sigue disponible como opción para quien lo necesite).
- Actualizar el texto de ayuda para listar las columnas reconocidas: ORIGEN, DESTINO, VALOR, CLIENTE, DEPARTAMENTO, TIPO EMPRESA.

No se tocan migraciones ni otras pantallas — `centros_costo.tipo` ya es texto libre.
