# Documentación técnica — Proyecto Fer

Análisis en profundidad de la aplicación: qué hace, cómo está construida, cómo fluyen los datos,
qué fórmulas aplica y qué problemas tiene.

> Documento de referencia interna. Para una guía rápida de uso, ver [README.md](README.md).

---

## Índice

1. [Visión general](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Persistencia](#4-persistencia)
5. [Sistema de unidades](#5-sistema-de-unidades)
6. [Motor de cálculo de costos](#6-motor-de-cálculo-de-costos)
7. [Ciclo de vida de la interfaz](#7-ciclo-de-vida-de-la-interfaz)
8. [Catálogo de funciones](#8-catálogo-de-funciones)
9. [Análisis de problemas detectados](#9-análisis-de-problemas-detectados)
10. [Deuda técnica](#10-deuda-técnica)
11. [Propuestas de mejora](#11-propuestas-de-mejora)
12. [Cómo hacer crecer el proyecto](#12-cómo-hacer-crecer-el-proyecto)

---

## 1. Visión general

**Propósito:** calcular el costo real de productos a partir de un inventario de insumos con
unidades heterogéneas (peso, volumen, unidades y paquetes), y derivar de ese costo el precio de
venta en pesos uruguayos.

**Contexto de uso:** pequeños entrepreneurship (pastelería, artesanía, foods) que necesitan saber
cuánto les cuesta realmente producir algo, en lugar de estimarlo "a ojo". El diferencial clave de la
app frente a una calculadora común es el **cálculo de costo por receta**: no se carga un costo
arbitrario, se selecciona el insumo del inventario y la app descuenta el costo real consumido.

**Naturaleza técnica:** aplicación *client-side* de una sola página. No hay backend, ni API, ni
base de datos, ni proceso de build. Todo el estado vive en `localStorage` del navegador.

### Características

| Funcionalidad | Estado |
|---|---|
| Alta, edición y borrado de ingredientes | Sí |
| Alta, edición y borrado de productos | Sí |
| Imagen adjunta (producto e ingrediente) | Sí, embebida en Base64 |
| Costeo de receta multi-insumo | Sí |
| Conversión automática de unidades | Sí (peso / volumen / unidad) |
| Insumos comprados en paquetes | Sí, con contenido del paquete |
| Precio por margen porcentual | Sí |
| Ganancia total acumulada | Sí |
| Persistencia automática | Sí (localStorage) |
| Exportar / importar / imprimir | No |
| Multiusuario o nube | No |
| Historial de cambios / auditoría | No |
| Control de stock y fechas de compra | No |
| Tests automatizados | No |

---

## 2. Arquitectura

### 2.1 Estilo arquitectónico

Arquitectura de **una sola vista con render imperativo del DOM**. No hay framework, no hay
componentización, no hay ciclo de vida reactivo. El flujo es:

```
   Evento del usuario (submit / change / input / click)
        │
        ▼
   Listener registrado en script.js
        │
        ├─► lee valores del DOM
        ├─► calcula (funciones de conversión y costo)
        ├─► muta el array en memoria (productos / ingredientes)
        ├─► persiste con localStorage.setItem(...)
        └─► re-renderiza la(s) tabla(s).innerHTML
```

### 2.2 Las tres capas

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Estructura | `index.html` (139 líneas) | Solo markup: 2 formularios, 2 tablas, contador de total. Ninguna lógica. |
| Presentación | `css/style.css` (183 líneas) | Estética pastel rosa, tablas con scroll horizontal, responsive básico a 600px. |
| Comportamiento | `js/script.js` (649 líneas) | **Toda** la lógica: estado, cálculos, eventos, render, persistencia. |

La consecuencia de esta separación es que `script.js` concentra ~100% de la complejidad: es a la vez
el modelo de datos, la vista y el controlador.

### 2.3 Referencias al DOM

Al inicio del script se cachean los nodos más usados (evita `getElementById` repetido en los
listeners):

```js
const form            = document.getElementById("form-prod");       // formulario de producto
const tabla           = document.getElementById("tabla-prod");      // tabla de productos
const total           = document.getElementById("ganancia-total");  // span del total
const formIng         = document.getElementById("form-ing");        // formulario de insumo
const tablaIng        = document.getElementById("tabla-ing").querySelector("tbody");
const ingImagenInput  = document.getElementById("ing-imagen");
const tablaProdBody   = tabla.querySelector("tbody");
const unidadSelect    = document.getElementById("ing-unidad");      // selector de unidad de insumo
const contenidoInput  = document.getElementById("ing-contenido");    // contenido del paquete
const grupoPaquete    = document.getElementById("grupo-paquete");   // bloque oculto
const costoInput      = document.getElementById("costo");
const precioInput     = document.getElementById("precio");
const imagenInput     = document.getElementById("imagen");
const gananciaInput   = document.getElementById("ganancia-deseada");
```

> Nota: hay **dos** variables distintas llamadas `unidadSelect` en el archivo. La global (línea 11)
> controla el selector del formulario de insumos; la otra es una local, creada por cada fila de
> ingredientes dentro del producto. No colisionan por alcance, pero es una trampa para quien lea.

### 2.4 Orden de ejecución del script

El archivo es lineal y su carga determina el arranque:

1. Declaración de referencias al DOM (líneas 1–27).
2. Carga del estado desde `localStorage` (líneas 29–30).
3. Definiciones de funciones (sealed por *hoisting*).
4. Registro de listeners de eventos.
5. Llamada final de arranque (líneas 648–649):
   ```js
   cargarIngredientes();
   cargarProductos();
   ```
   Ambas vacían su `<tbody>` y re-construyen las filas desde el estado persistido.

---

## 3. Modelo de datos

### 3.1 Ingrediente (insumo del inventario)

```jsonc
{
  "nombre": "Harina",           // string — se usa como IDENTIFICADOR único
  "cantidad": 25,               // number — cuánto se compró (en `unidad`)
  "unidad": "kg",               // "g" | "kg" | "ml" | "cl" | "l" | "unidad" | "paquete"
  "precio": 1200,              // number — costo total del lote en UYU
  "contenido": 1,              // number — contenido de cada paquete (1 si no es paquete)
  "contenidoUnidad": "g",      // string — unidad del contenido del paquete
  "imagen": "data:image/png;base64,..."  // string Base64 o ""
}
```

Derivado en tiempo de render (no se guarda):
- Precio unitario: `precio / cantidad`.
- Si es `paquete`: `precio / (cantidad × contenido)`, expresado en `contenidoUnidad`.

### 3.2 Producto

```jsonc
{
  "id": 1730000000000,          // number — timestamp (Date.now()) usado como clave
  "nombre": "Torta de chocolate",
  "costo": 350.75,              // number — costo total en UYU
  "precio": 700.00,             // number — precio de venta en UYU
  "ganancia": 349.25,           // number — precio − costo (valor congelado)
  "porcentaje": 99.5,           // number — % de ganancia sobre el costo (valor congelado)
  "ingredientes": [             // array — copia de la receta en el momento del guardado
    { "nombre": "Harina", "cantidad": 500, "unidad": "g", "costo": 24.00 }
  ],
  "imagen": "data:image/jpeg;base64,..."  // string Base64 o ""
}
```

**Punto crítico del modelo:** `ganancia` y `porcentaje` son **valores derivados pero persistidos**.
Lo mismo con `ingredientes[].costo`. Son instantáneas del momento en que se guardó el producto, no
referencias al inventario. Si cambia el precio de un insumo, el producto guardado **no se actualiza**
por sí solo.

### 3.3 Estado transitorio (no persistido)

| Variable | Contenido | Ciclo de vida |
|---|---|---|
| `ingredientesUsados` | Filas de receta actualmente en el formulario de producto | Se reconstruye en cada `actualizarCostoIngredientes()`; se vacía al guardar |
| `form.dataset.editId` | `id` del producto en edición | Se borra tras guardar (`delete form.dataset.editId`) |
| `formIng.dataset.editIndex` | Índice en el array `ingredientes` del insumo en edición | Se borra tras guardar |
| `gananciaTotal` | Variable global de ganancia acumulada | **Huérfana**: se escribe en línea 441 pero nunca se lee |
| `form.dataset.editId` vs `editIndex` |(producto usa `id`, insumo usa índice de array) | Asimetría: frágil ante reordenamientos |

---

## 4. Persistencia

Dos claves en `localStorage`:

```js
let ingredientes = JSON.parse(localStorage.getItem("ingredientes")) || [];
const productos   = JSON.parse(localStorage.getItem("productos"))   || [];
```

- Se escribe en 3 lugares: alta/edición de insumo, alta/edición de producto, borrado de producto.
- Se lee una única vez, al cargar la página.
- **No hay migración de esquema**: si mañana se agrega un campo, los datos viejos lo traerán
  `undefined` y `JSON.parse` de un valor corrupto lanza `SyntaxError` que detiene todo el script
  (la app queda en blanco).

### 4.1 Imágenes en Base64

`leerImagen()` usa `FileReader.readAsDataURL()`, por lo que la imagen completa (su data URL, ~33%
más grande que el binario) vive en el string JSON del `localStorage`. Consecuencias:

- Cuota típica del navegador: **~5 MB**. Con 3–4 fotos de 1 MB la cuota se agota.
- `setItem` lanza `QuotaExceededError`, que **no está capturado**: el guardado falla en silencio
  respecto al usuario (solo hay un `alert` de éxito que miente).
- No hay compresión ni redimensionado previo al guardado.

---

## 5. Sistema de unidades

Tabla de conversión (`script.js:50-57`):

```js
const conversion = {
  g:      { tipo: "peso",    factor: 1 },
  kg:     { tipo: "peso",    factor: 1000 },
  ml:     { tipo: "volumen", factor: 1 },
  cl:     { tipo: "volumen", factor: 10 },
  l:      { tipo: "volumen", factor: 1000 },
  unidad: { tipo: "unidad",  factor: 1 },
  // "paquete" NO está: no es una unidad convertible, es un contenedor
};
```

| Función | Comportamiento |
|---|---|
| `obtenerTipoUnidad(u)` | Devuelve `peso`, `volumen` o `unidad`; si la unidad no está en la tabla devuelve `unidad` por defecto. |
| `convertirCantidad(cant, origen, destino)` | Si son iguales, devuelve tal cual. Si alguna no existe en la tabla, devuelve sin convertir. Si los **tipos difieren**, hace `console.warn` y devuelve sin convertir. Si coinciden: `cant × (factorOrigen / factorDestino)`. |

Decisiones de diseño correctas que conviene preservar:

- **No se intenta convertir entre tipos**: 1 g de harina no es 1 ml. La app avisa y preserva el
  número en vez de inventar una equivalencia.
- La conversión es **simétrica y sin estado**: misma entrada, mismo resultado.
- `paquete` intencionalmente no es convertible: es un contenedor, y su contenido se resuelve aparte.

---

## 6. Motor de cálculo de costos

La función central es `actualizarCostoIngredientes()` (`script.js:281-363`). Recorre todas las filas
`.ingrediente-uso` del formulario de producto y clasifica cada combinación insumo/uso en uno de
**tres casos**.

### 6.0 Insumo guardado como `paquete`

Cuando `unidad === "paquete"`, el formulario muestra un bloque extra (`#grupo-paquete`) con:

- **Cantidad total**: cuántos paquetes se compraron.
- **Contenido del paquete**: cuántas unidades/gramos/litros trae **cada** paquete.
- **Unidad del contenido**: en qué se mide ese contenido.

Precio unitario real: `precio / (cantidad × contenido)`, en `contenidoUnidad`.

Ejemplo: `4 paquetes × 500 g de harina = 2 kg`, costo total `$900` → `$4.500` **por kg**.

### 6.1 Caso 1 — insumo en paquete, usado en otra unidad

El insumo está comprado en paquetes pero la receta lo pide en gramos/unidades.

```js
contenidoEnBase = convertirCantidad(ing.contenido, ing.contenidoUnidad, unidadUsada);
costoFraccion   = ing.precio × (cantidadUsada / (ing.cantidad × contenidoEnBase));
```

Se calcula la **fracción del stock total** consumida y se aplica proporcionalmente al precio pagado.
Ejemplo: compraste 4 paquetes de 500 g por $900 (2 kg), la receta usa 250 g
→ fracción `250 / (4 × 500) = 0.125` → costo `$112.50`.

### 6.2 Caso 2 — insumo en unidad/peso, usado en paquete

El caso inverso: el insumo está cargado por kilo pero la receta pide "paquetes".

```js
contenidoEnBase   = convertirCantidad(ing.contenido, ing.contenidoUnidad, ing.unidad);
cantidadConvertida = cantidadUsada × contenidoEnBase;
costoTotal         = (ing.precio / ing.cantidad) × cantidadConvertida;
```

### 6.3 Caso 3 — conversión normal

```js
cantidadConvertida = convertirCantidad(cantidadUsada, unidadUsada, ing.unidad);
costoTotal         = (ing.precio / ing.cantidad) × cantidadConvertida;
```

Este es el camino habitual: `precioDelLote / cantidadDelLote` da el precio por unidad del insumo, y
se multiplica por la cantidad consumida ya convertida a la unidad del insumo.

### 6.4 Salidas de la función

```js
costoIngredientesSpan.textContent = total.toFixed(2);  // "Costo total de ingredientes" visible
costoInput.value            = total.toFixed(2);        // escribe en el campo Costo del producto
ingredientesUsados = [{ nombre, cantidad, unidad, costo }, ...]  // se guarda con el producto
```

Cada fila muestra además su costo parcial en un `<span>`, recalculado en vivo mientras se escribe.

### 6.5 Precio de venta

En el `submit` del formulario de producto:

```js
if (precioInput.value !== "")        precioFinal = parseFloat(precioInput.value);
else if (gananciaInput.value !== "") precioFinal = costo + (costo * porcentaje / 100);
else                                 alert("Debes ingresar precio o porcentaje de ganancia");
```

Y luego:

```js
ganancia   = precioFinal - costo;
porcentaje = ((precioFinal - costo) / costo) × 100;
```

> La ganancia porcentual es **markup sobre el costo**, no margen sobre el precio. Con costo 100 y
> precio 150: ganancia 50, porcentaje 50% (no 33%). Es una decisión de negocio consciente, pero
> conviene documentarla porque suele generar confusión.

### 6.6 Ganancia total

```js
function actualizarGananciaTotal() {
  tabla.querySelectorAll("tr").forEach(fila => {
    const costo  = parseFloat(fila.children[1].textContent.replace(/[^\d.-]/g, "")) || 0;
    const precio = parseFloat(fila.children[2].textContent.replace(/[^\d.-]/g, "")) || 0;
    totalGanancia += precio - costo;
  });
  document.getElementById("ganancia-total").textContent = totalGanancia.toFixed(2);
}
```

Calcula el total **leyendo el texto de las celdas ya renderizadas**, no desde `productos`. Es una
función frágil: depende de que las columnas 1 y 2 sigan siendo costo y precio, y de que el regex
limpie bien el prefijo `$UYU`. Además convive con un segundo cálculo equivalente
(`productos.reduce((acc, p) => acc + p.ganancia, 0)`, línea 441) que sí usa el modelo. Dos fuentes
de verdad para el mismo número.

---

## 7. Ciclo de vida de la interfaz

### 7.1 Arranque

```js
cargarIngredientes();  // tbody.innerHTML = "" → ingredientes.forEach(agregarIngredienteATabla)
cargarProductos();     // tbody.innerHTML = "" → productos.forEach(agregarProductoATabla)
                       //           → actualizarGananciaTotal()
```

### 7.2 Formulario de ingrediente

| Evento | Efecto |
|---|---|
| `change` en `#ing-unidad` | Si es `paquete`, muestra `#grupo-paquete` (`display:flex`) y limpia el contenido; si no, lo oculta y vacía el campo. |
| `submit` | Valida nombre, cantidad > 0 y precio > 0. Si `dataset.editIndex` existe, reemplaza en el índice; si no, hace `push`. Persiste, **re-renderiza toda la tabla** y resetea el formulario. |
| Click ✏️ | Carga los datos del insumo en el formulario, muestra `#grupo-paquete` si corresponde, calcula `editIndex` por **nombre**, hace scroll suave y enfoca el nombre. |
| Click 🗑️ | Filtra el array por nombre, persiste y quita **solo esa fila** del DOM (sin re-render completo). |

### 7.3 Formulario de producto

| Evento | Efecto |
|---|---|
| `input` en `#precio` | Si tiene valor: deshabilita y vacía `#ganancia-deseada`. Si se vacía: la re-habilita. |
| `input` en `#ganancia-deseada` | Espejo del anterior. De aquí sale la **exclusión mutua** entre los dos campos. |
| Click "+ Agregar del inventario" | Si el inventario está vacío, avisa y aborta. Crea una fila con: selector de insumo, input de cantidad, selector de unidad (dinámico según el tipo del insumo), costo parcial y botón ❌. Inserta con `prepend` (la fila nueva aparece arriba). |
| `change` del selector de insumo | Reconstruye el selector de unidad según el tipo del insumo elegido y recalcula totales. |
| `input`/`change` de la fila | Recalcula el costo total de la receta en vivo. |
| `submit` | Valida nombre y costo > 0; calcula precio; crea o actualiza el producto; persiste; **resetea ambos formularios** y limpia las filas de receta. |
| Click ✏️ | Rellena el formulario con el producto, reconstruye todas sus filas de ingredientes con sus valores, fija `dataset.editId`, scroll y foco. |
| Click 🗑️ | `confirm()` nativo, borra por `id`, persiste, quita la fila, recalcula el total. |

### 7.4 Manejo de imágenes

```js
function leerImagen(file) {           // Promise<FileReader>
  reader.readAsDataURL(file);         // → "data:image/png;base64,..."
}
```

En edición se preserva la imagen previa **solo si no se elige un archivo nuevo**. Al hacer
`form.reset()` el input de archivo se vacía, así que en el siguiente alta la imagen es `""`.

---

## 8. Catálogo de funciones

| Función | Ubicación | Descripción |
|---|---|---|
| `actualizarGananciaTotal()` | `script.js:34` | Suma precio − costo leyendo el DOM; escribe en `#ganancia-total`. |
| `obtenerTipoUnidad(unidad)` | `script.js:59` | `peso` \| `volumen` \| `unidad` a partir de la tabla `conversion`. |
| `convertirCantidad(cant, orig, dest)` | `script.js:64` | Convierte dentro del mismo tipo de unidad. |
| `leerImagen(file)` | `script.js:87` | Devuelve Promise con la imagen como Data URL. |
| `agregarIngredienteATabla(ing)` | `script.js:96` | Renderiza una fila del inventario y registra sus listeners. |
| `actualizarOpcionesUnidad(unidadBase)` | `script.js:213` y `:568` | Rellena el selector de unidad según el tipo del insumo. **Duplicada** en dos lugares. |
| `actualizarCostoIngredientes()` | `script.js:281` | Recorre las filas de receta, aplica los 3 casos, escribe el total. |
| `agregarProductoATabla(prod)` | `script.js:507` | Renderiza una fila de producto y registra edición/borrado. |
| `cargarProductos()` | `script.js:636` | Re-renderiza la tabla de productos desde el array. |
| `cargarIngredientes()` | `script.js:642` | Re-renderiza la tabla de ingredientes desde el array. |
| `form` listener `submit` | `script.js:365` | Alta/edición de producto. |
| `formIng` listener `submit` | `script.js:453` | Alta/edición de ingrediente. |

---

## 9. Análisis de problemas detectados

Ordenados por impacto sobre la corrección de los números.

### 🔴 Alto — afectan el resultado económico

**9.1 Un producto sin ingredientes nunca se puede guardar.**
`actualizarCostoIngredientes()` escribe el total en `costoInput.value`. El `submit` valida
`costo > 0`. Por lo tanto, un producto cuyo costo no proviene de una receta (por ejemplo, un
producto revendido, un servicio, un producto con costo fijo manual) es **imposible de cargar**:
el campo se sobrescribe con `0.00` y el `alert` de validación salta siempre.

**9.2 Editar o borrar un ingrediente deja los productos desactualizados.**
Los productos guardan `costo`, `ganancia`, `porcentaje` y `ingredientes[].costo` **congelados**. Si
subís el precio de la harina de $1.200 a $1.500, la tabla de productos sigue mostrando los
valores viejos sin ningún aviso. Para un herramienta de control de costos esto es peligroso: el
usuario ve una ganancia que ya no es real.

**9.3 El nombre del ingrediente es su identidad.**
Todo alta, búsqueda, edición y borrado se resuelve por `nombre`:
```js
ingredientes = ingredientes.filter((i) => i.nombre !== ing.nombre);
```
Dos insumos con el mismo nombre ("Azúcar") colisionan: se borran o editan juntos. Además,
`formIng.dataset.editIndex` se recalcula por nombre, así que si hay duplicados el índice puede
apuntar al equivocado.

**9.4 Caso 2 (usar un insumo no-paquete como paquete) produce números sin sentido.**
Para insumos normales se guarda `contenido: 1` (línea 471: `contenidoFinal = unidad === "paquete" ? contenido : 1`),
pero `contenidoUnidad` **sí** se guarda (por defecto `"g"` del `<select>`). Si el insumo está
cargado en `kg` y en la receta se selecciona unidad `paquete`:
```js
contenidoEnBase = convertirCantidad(1, "g", "kg") = 0.001
cantidadConvertida = 3 paquetes × 0.001 = 0.003 kg   // 3 paquetes ≈ 3 gramos
```
El costo resultante es ~3000 veces menor que el real, y **no hay ningún aviso**. La UI además
ofrece la opción `paquete` en este caso porque `obtenerTipoUnidad("kg")` devuelve `"peso"`, pero
el `select` de la fila se puebla con opciones de *peso*… en realidad aquí el problema es que
`paquete` es alcanzable sólo por el camino de `unidad`; el caso 2 existe pero opera sobre datos que
el modelo no representa. Recomiendo **eliminar el caso 2** y forbidding `paquete` como unidad de uso
cuando el insumo no es un paquete.

### 🟠 Medio — errores visibles / robustez

**9.5 `QuotaExceededError` no se maneja.** Con varias imágenes, `localStorage.setItem` lanza y la
app muestra "Producto agregado" aunque **no se haya guardado nada**. Pérdida silenciosa de datos.

**9.6 `JSON.parse` sin `try/catch`.** Un `localStorage` corrupto (o escrito por una versión futura
del esquema) lanza `SyntaxError` en la línea 29 y **todo el script se detiene**: pantalla en blanco,
sin mensajes.

**9.7 El total se calcula dos veces, por dos caminos distintos.**
`actualizarGananciaTotal()` (DOM, regex) vs `productos.reduce(...)` (modelo). La función del DOM
solo se invoca en carga, alta y borrado; en la **edición** el total se fija con el `reduce`. Si el
render y el modelo divergen, el número mostrado depende de qué operación se hizo último.

**9.8 La fila del inventario tiene una celda de más.** En `agregarIngredienteATabla()` los botones
se escriben dentro de la misma etiqueta que la celda de la imagen:
```html
<td>...</td>
<td>...</td>   <!-- imagen -->
<button>✏️</button>
<button>🗑️</button>
</td>
```
Es decir, `<button>` como hijo directo de `<tr>`. El navegador lo reubica y la tabla queda con
8 columnas sobre un `<thead>` de 7. El botón de 🗑️ además queda desalineado respecto al resto de
productos.

**9.9 Editar un producto con precio *y* porcentaje cargados.** El handler de ✏️ escribe ambos
campos a la vez (`precioInput.value = prod.precio; gananciaInput.value = prod.porcentaje;`).
Como la exclusión mutua solo dispara con el evento `input` (y asignar `.value` por código **no**
dispara eventos), ambos campos quedan habilitados y con valor. Al guardar siempre gana el precio,
pero el porcentaje queda visible y engañoso. Debería deshabilitarse uno explícitamente en la carga.

**9.10 Sin sanitización de entrada.** Nombres de producto e ingrediente se inyectan en
`innerHTML`:
```js
fila.innerHTML = `<td>${ing.nombre}</td>`;
```
Un nombre como `<img src=x onerror=alert(1)>` se ejecuta. Como es una app local el riesgo es
menor, pero se vuelve real si algún día se carga un backup o datos de otra persona.

**9.11 Identidad de producto por timestamp.** `id: Date.now()`. Dos altas en el mismo milisegundo
(cola rápida o script) colisionan; y comparar `p.id == editId` con `==` en lugar de `===` sugiere
que en algún momento el id fue string.

### 🟡 Bajo — mantenibilidad y detalle

**9.12 `actualizarOpcionesUnidad` está duplicada** (`script.js:213` y `script.js:568`), con
diferencias sutiles: la versión del handler de edición **fuerza** `unidadSelect.value = ing.unidad`,
la otra no. Cualquier cambio en las unidades hay que aplicarlo dos veces.

**9.13 `gananciaTotal` es una variable muerta.** Se declara en la línea 32, se asigna en la 441 y
nunca se lee: el valor visible se escribe en el DOM directamente.

**9.14 Sombreado de la variable `total`.** `const total` (línea 3) es el `<span>` del total; dentro
de `actualizarCostoIngredientes()` hay un `let total = 0` local y un `const costoTotal` dentro del
`forEach`. Funciona, pero obliga a leer con cuidado para saber a qué `total` se refiere cada línea.

**9.15 Sin estado "editando".** No hay indicador visual de que se está editando, ni botón de
cancelar. Editar un producto y hacer clic en otro producto pierde los cambios en curso. La única
pista es el scroll al formulario.

**9.16 `form.reset()` no reinicia `#grupo-paquete`.** Se oculta manualmente tras guardar
ingrediente (línea 504), pero el estado interno de `unidadSelect` queda en el valor anterior del DOM.

**9.17 CSS duplicado y reglas muertas.** `table`, `th, td`, `tr:nth-child(even)`, `.tabla-scroll`,
`.editar-ing/.borrar-ing/...` están **definidos dos veces** en `style.css` (líneas 47–76 y 88–143);
la segunda definición gana por cascada. La clase `.resumen` (líneas 59–63) **no se usa en el HTML**.
Los `input[type=file]` y `select` no tienen estilo propio, así que se ven nativos y rompen la
estética.

**9.18 `<title>Document</title>`.** Debió ser "Presupuestos" o "Proyecto Fer".

**9.19 `index.zip` versionado.** Es una copia del sitio publicado (HTML/CSS/JS idénticos a los de
la raíz). Duplica el código fuente, infla el repo y puede desincronizarse en silencio.

**9.20 `.container` de 600px vs. tablas de `min-width: 700px`.** Las tablas siempre desbordan el
contenedor; el `.tabla-scroll` lo absorbe, pero el ancho máximo del sitio es constante y en
monitores anchos queda mucho espacio muerto.

---

## 10. Deuda técnica

| Área | Estado |
|---|---|
| **Tests** | Ninguno. Cero cobertura, ni siquiera de las fórmulas de conversión, que son lo más crítico. |
| **Linter / formateador** | Ninguno. Estilo inconsistente: comillas dobles, `==` y `===` mezclados, indentación de 2 espacios en JS pero 4 en CSS. |
| **Gestión de dependencias** | No aplica: cero dependencias. |
| **Git** | 2 commits, mensajes genéricos (`comit`), sin `.gitignore`, en `master`. |
| **CI/CD** | Ninguno. |
| **Accesibilidad** | Sin `<label for>` correctamente asociados en varios casos, botones con emoji sin `aria-label`, sin navegación por teclado en las tablas, sin roles ARIA. |
| **Internacionalización** | Textos en español con `$UYU` fijo. No hay abstracción de moneda. |
| **Seguridad** | Solo el `innerHTML` sin sanitizar (9.10). Sin superficie de red. |

---

## 11. Propuestas de mejora

Ordenadas por relación esfuerzo/beneficio.

### Prioridad 1 — corrección (horas)

1. **Recalcular productos al cambiar el inventario.** Recorrer `productos`, re-evaluar sus
   `ingredientes` contra el `ingredientes` actual y actualizar `costo`, `ganancia`, `porcentaje`.
   Marcar visualmente los productos con costo desactualizado.
2. **Identidad por `id`, no por nombre.** Agregar `id` a ingredientes (igual que a productos) y
   reemplazar todos los `find`/`filter` por nombre.
3. **Permitir costo manual o vacío.** `costoInput` no debería sobreescribirse; distinguir entre
   "costo calculado" y "costo manual" evita el bug 9.1.
4. **Eliminar el caso 2** de `actualizarCostoIngredientes()` o estructurarlo correctamente (ver 9.4).
5. **`try/catch` en el parseo de `localStorage`** y captura de `QuotaExceededError` con mensaje
   claro ("quedó sin espacio para la imagen, probá con una más chica").

### Prioridad 2 — robustez (un día)

6. **Centralizar el total**: eliminar `actualizarGananciaTotal()` y calcular siempre desde `productos`.
7. **`textContent` en vez de `innerHTML`** para los datos de usuario (plantillas literales con
   interpolación controlada, o un `escapeHtml()`).
8. **Arreglar la fila de ingredientes**: mover los botones a su propio `<td>`.
9. **Indicador de modo edición** + botón "Cancelar" en ambos formularios; limpiar `dataset` al
   resetear.
10. **Manejo de imágenes**: redimensionar a ~400px y comprimir a JPEG/WebP antes de guardar. Resuelve
    de raíz la cuota de `localStorage`.
11. **Unificar `actualizarOpcionesUnidad`** en una función única reutilizada por ambos flujos.

### Prioridad 3 — calidad y producto

12. **Tests unitarios** de `convertirCantidad`, `obtenerTipoUnidad` y las 3 ramas de
    `actualizarCostoIngredientes`. Es la parte con más riesgo y menos protección.
13. **Extraer a módulos ES** (`unidades.js`, `calculos.js`, `almacen.js`, `ui.js`) aunque no haya
    framework. Sigue siendo JS nativo, pero testeable y legible.
14. **Exportar / importar JSON** (copia de seguridad) e **imprimir / PDF** del presupuesto. Es el
    siguiente salto de valor para el usuario final.
15. **Limpieza de CSS**: eliminar definiciones duplicadas y `.resumen`; dar estilo a `select` e
    `input[type=file]`.
16. **Quitar `index.zip` del repo** y añadir `.gitignore`.
17. **Fixes menores**: `<title>` correcto, `===` en lugar de `==`, eliminar `gananciaTotal`, renombrar
    variables para evitar el sombreado de `total`.
18. **Accesibilidad**: `aria-label` en los botones de icono, `scope="col"` en los `<th>`, foco
    visible.

### Prioridad 4 — evolución (sprint)

19. **Desacoplar la persistencia**: hoy `localStorage` está hardcodeado en los handlers. Una capa
    `almacen()` con la misma interfaz permitiría migrar a IndexedDB (para imágenes) o a un backend
    sin tocar la UI.
20. **Historial de compras**: guardar fecha y proveedor de cada compra de insumo, y valorizar el
    inventario a fecha, en lugar de un único precio por insumo.
21. **Múltiples negocios / multiusuario** si el uso crece.
22. **Tests end-to-end** con Playwright para los flujos de alta, edición y borrado.

---

## 12. Cómo hacer crecer el proyecto

### Mapa de dependencias conceptual

```
                        localStorage
                            ▲
                            │  (escritura directa desde los handlers)
                            │
   ┌──────────────┬─────────┴──────────┬─────────────────┐
   │              │                    │                 │
 index.html   script.js            style.css        index.zip
 (markup)     (TODO)               (estilos)        (copia, obsoleta)
                  │
   ┌──────────────┼──────────────────┬────────────────────┐
   │              │                  │                    │
 conv. de      motor de costo    render de tablas     imágenes
 unidades     (3 casos)         (innerHTML)          (FileReader)
```

### Orden de lectura recomendado para entender el código

1. `index.html` completo (5 min) — ver los `id`, que son el contrato con el JS.
2. `script.js:1-90` — referencias al DOM y tabla de conversión.
3. `script.js:281-363` — `actualizarCostoIngredientes()`, el corazón del cálculo.
4. `script.js:365-451` — submit de producto (precio, ganancia, persistencia).
5. `script.js:453-505` — submit de ingrediente.
6. `script.js:507-649` — render, edición, borrado y arranque.

### Mapa de `id`s clave (contrato HTML ↔ JS)

| `id` | Elemento | Usado en |
|---|---|---|
| `form-prod` | Formulario de producto | `form` |
| `nombre`, `costo`, `precio`, `ganancia-deseada` | Campos del producto | submit + handlers |
| `imagen` | Input file del producto | submit |
| `lista-ingredientes-uso`, `costo-ingredientes`, `agregar-ingrediente-uso` | Receta | `actualizarCostoIngredientes` |
| `form-ing` | Formulario de ingrediente | `formIng` |
| `ing-nombre`, `ing-cantidad`, `ing-unidad`, `ing-precio`, `ing-imagen` | Campos de insumo | submit + edición |
| `grupo-paquete`, `ing-contenido`, `ing-contenido-unidad` | Bloque de paquete | change de unidad |
| `tabla-prod`, `tabla-ing` | Tablas | render + `actualizarGananciaTotal` |
| `ganancia-total` | Span del total | `total` |

### Atajos de mantenimiento

```bash
# Buscar todos los accesos a localStorage
grep -n "localStorage" js/script.js

# Buscar todas las conversiones
grep -n "convertirCantidad\|obtenerTipoUnidad" js/script.js

# Buscar comparaciones flojas
grep -n " == " js/script.js

# Ver el tamaño real de lo guardado
# en la consola del navegador:
copy(JSON.stringify(localStorage).length)   # caracteres
```

---

## Anexo — Glosario

| Término | Significado en este proyecto |
|---|---|
| **Ingrediente / insumo** | Materia prima del inventario (harina, azúcar, chocolate). |
| **Producto** | Lo que se vende, compuesto por ingredientes. |
| **Costo** | Cuánto le cuesta producir **una unidad** del producto. |
| **Precio** | A cuánto se vende **una unidad**. |
| **Ganancia** | `precio − costo`, en pesos. |
| **Porcentaje de ganancia** | `(precio − costo) / costo × 100`. Margen sobre el **costo**. |
| **Lote** | La cantidad comprada de una sola vez (25 kg, 4 paquetes). |
| **Contenido** | Cuánto trae **cada** paquete (500 g por paquete). |
| **Precio unitario** | `precio del lote / unidades del lote`. |
| **$UYU** | Peso uruguayo, la única moneda soportada (string fijo en el código). |
