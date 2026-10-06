# Deuda técnica conocida

Lista de problemas **reales y verificados** que hay en el código ahora mismo, con lo que se sabe de
cada uno y qué falta para cerrarlo.

No es una lista de deseos: son cosas que se detectaron leyendo el código o probándolas. Cada
entrada dice cómo se comprobó, para que cualquiera pueda repetir la comprobación.

El que más importa de la lista es el **N1**: sin persistencia, todo el trabajo hecho se pierde al
recargar la página.

---

## N1 · No hay persistencia: todo vive en memoria

**Estado:** abierto. Es lo más grave de la lista.

`src/lib/estado.svelte.ts:8` arranca siempre con el repositorio en memoria:

```ts
export const repositorio: RepositorioArticulos = crearRepositorioMemoria();
```

`crearRepositorioMemoria` guarda en una variable del módulo (`src/lib/datos/articulos.ts:173`). Eso
significa que **todo lo que se carga, se calcula o se guarda se pierde al recargar la página**.

En `T08` se documentó que existía `inventarioSupabase.ts`, un adaptador real contra la base. Ese
archivo **se borró** cuando se unificó el modelo de artículos y **nunca se reescribió**: hoy no
existe ningún adaptador para la tabla `articulos`.

**Cómo se comprueba:** recargar la página. Los artículos vuelven a los cinco de ejemplo.

**Qué falta:** escribir `crearRepositorioSupabase`, que cumpla la misma interfaz de cinco métodos
(`listar`, `crear`, `actualizar`, `eliminar`, más el modo). Los datos ya están mapeados: la tabla
`articulos` de la migración `0002` tiene las columnas necesarias, y `es_vendible`, `es_elaborado`,
`rendimiento_cantidad`, `rendimiento_unidad`, `merma_pct` y `stock_minimo` ya están ahí.

**Por qué no se hizo antes:** sin cuentas de usuario (Fase 2) la RLS no deja escribir nada, así que el
adaptador serviría de prueba pero no de producción. Es una decisión de orden, no un olvido.

---

## N2 · Recargar con `forzar` duplica todos los artículos

**Estado:** abierto.

`cargarArticulos(forzar = true)` empuja sobre el array sin vaciarlo primero
(`src/lib/estado.svelte.ts:19`):

```ts
for (const a of await repositorio.listar()) {
  articulos.push(a);   // sin articulos.length = 0 antes
}
```

**Cómo se comprueba:** llamar `cargarArticulos(true)` dos veces. Los artículos aparecen duplicados.

**Por qué no saltó el typecheck:** `noUnusedLocals` está activo pero no vigila este caso, y el error no
es de tipos sino de lógica.

**Qué falta:** limpiar el array al principio de la función, o usar `forzar` solo para reintentar
cuando la carga falló.

---

## N3 · `costearArticulo` pierde los errores del detalle

**Estado:** abierto.

`costearArticulo` crea **dos** contextos distintos (`src/lib/costoRecetas.ts:208`):

```ts
const ctx = nuevoEstado(catalogo);
const costoUnitario = costoUnitarioArticulo(articulo, catalogo, ctx);

// ...despues, para armar el detalle:
const ctxNuevo = nuevoEstado(catalogo);      // <-- contexto nuevo y separado
const costeo = costearRecetaConEstado(articulo.receta, ctxNuevo);
detalles.push(...costeo.detalles);
```

El `ctxNuevo` acumula errores que **nunca se leen**: el `errores` que se devuelve sale del primer
contexto. Consecuencia: si un ingrediente de la receta no existe o está inactivo, la fila lo muestra
con su error, pero ese error **no aparece en `errores` y no vuelve `costoValido` en `false`**.

**Cómo se comprueba:** una receta con un ingrediente de id inexistente devuelve
`costoValido: true` y una fila con `error: "articulo-inexistente"`.

**Qué falta:** leer los errores del segundo contexto y sumarlos al resultado.

---

## N4 · Cuatro motivos de error que nunca se generan

**Estado:** abierto. Cuatro valores del tipo `MotivoError` (`src/lib/tipos.ts:65`) que ningún código
produce:

| Motivo | Por qué quedó |
|---|---|
| `paquete-requiere-contenido` | Lo reemplaza la validación del formulario, no el motor |
| `paquete-sobre-articulo-simple` | Heredado de la v1, que sí tenía ese caso |
| `receta-vacia` | La validación la hace `validarArticulo`, no el motor |
| `profundidad-excedida` | El límite de profundidad nunca se implementó (ver N5) |

**Qué falta:** borrarlos, o implementarlos. Bajar los que quedaron de la v1 es lo más simple.

---

## N5 · El límite de profundidad de recetas nunca se implementó

**Estado:** abierto.

`PROFUNDIDAD_MAXIMA = 10` está declarado en `src/lib/costoRecetas.ts:13` y **no se usa en ningún
lado**. El motor detecta ciclos, así que no hay riesgo de loop infinito, pero no hay tope de
profundidad.

**Cómo se comprueba:** ESLint lo reporta como símbolo exportado sin uso. Está registrado en el
`IA_GUIDE.md` entrada `T11`.

**Qué falta:** o se usa la constante, o se borra. Una receta con 40 niveles anidados hoy se resuelve
sin problema.

---

## N6 · Una segunda detección de ciclos, escrita y desconectada

**Estado:** abierto.

`detectaCiclo` (`src/lib/datos/articulos.ts:82`) recorre el árbol buscando recetas circulares, pero
**nadie la llama**. Mientras tanto, `costoUnitarioArticulo` tiene su propia detección con el conjunto
`enCurso` (`src/lib/costoRecetas.ts:76`), que es la que se usa.

**Qué falta:** borrar la del repositorio y dejar la del motor, o viceversa. Dos detecciones para lo
mismo siempre diverge en algún caso.

---

## N7 · La merma se eliminó de las recetas

**Estado:** **resuelto** en T12. Se deja la entrada para que quede el razonamiento.

Existió para dejar asentada una contradicción: la merma se llamaba *"costo extra del proceso"* pero
multiplicaba cantidades, que es otra cosa. La solución no fue aclararlo, fue quitarla.

- El sobrecosto real (aceite, luz, gas) va a la tabla `gastos`.
- La pérdida de masa ya la cubre el rendimiento.
- El movimiento de stock tipo `merma` sigue existiendo: es mercadería que se pudrió, no un
  porcentaje.

---
## N8 · El stock todavía se edita a mano

**Estado:** abierto. Documentado en `IA_GUIDE.md` entrada `T09b`.

`Inventario.svelte` sigue con un campo que escribe directo a `Articulo.stock`, cuando la regla del
proyecto y el comentario del propio tipo (`tipos.ts`) dicen que el stock nunca se edita a mano porque
es la suma de los movimientos.

La tabla `movimientos` existe en la base con sus siete tipos de movimiento, y la compra de urgencia ya
tiene su camino resuelto sin tocar el esquema, pero **la aplicación no la usa todavía**.

**Qué falta:** es la Fase 3, la primera parte de la orden acordada en `T07`.

---

## Cómo se mantiene esta lista

Cuando se cierre un punto, se borra de acá y se registra el cierre en la entrada correspondiente del
`IA_GUIDE.md`. Cuando aparezca uno nuevo, se agrega acá y se menciona en la entrada de la tarea en la
que apareció.

Si algo está anotado con `.` en [Usuario-revisiones.txt](Usuario-revisiones.txt), seprioriza sobre
esta lista: el usuario ya lo probó y le molesta.