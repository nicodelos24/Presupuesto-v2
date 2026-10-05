# Modelo de datos: stock, costos y recetas

Este documento corrige y completa el plan funcional. Sale de las ideas de agendar la llegada de
proveedores, descontar ingredientes al producir y tener productos preparados como recetas de otras
recetas. Las tres son buenas ideas, pero juntas esconden cinco problemas que hay que resolver **antes**
de construir, porque despues hay que cambiar la base de datos y es caro.

- Especificacion de pantallas: [PLAN_FUNCIONAL.md](PLAN_FUNCIONAL.md)
- Migraciones: [supabase/migrations](supabase/migrations)

---

## 1. El problema de fondo: el stock no se puede guardar, se calcula

En la v1 el insumo guardaba "cantidad comprada" y "precio del lote". Con lo que estas proponiendo eso
ya no alcanza, porque ahora el stock **cambia todos los dias**: las compras suman, la produccion resta, la produccion resta,
las mermas restan.

La regla de oro:

> **El stock nunca se edita a mano. Es el resultado de una suma de movimientos.**

Si se puede escribir el stock a mano, el sistema miente. Por eso hace falta un **libro de
movimientos** (ledger): cada vez que pasa algo se anota, y el stock es la suma.

### 1.1 Tipos de movimiento

| Tipo | Efecto en stock | Cuando se anota |
|---|---|---|
| `compra` | **Suma** | Llega mercaderia del proveedor |
| `produccion` | **Resta** | Se prepara una receta (consume insumos) |
| `devolucion_produccion` | **Suma** | Se devuelve mercaderia elaborated al stock |
| `merma` | **Resta** | Se roto, se vencio, se regalo |
| `ajuste_conteo` | Corrige | Conteo fisico: se ajusta a lo que realmente hay |
| `descarte` | **Resta** | Se descarta producto elaboration vencido |

Con esto se responde siempre la pregunta clave: **de donde salio este kilo de harina?**

### 1.2 El costo promedio, no el FIFO

Cuando un insumo se compra a distintos precios hace falta saber a cuanto se costea. Para un negocio
chico lo correcto es **costo promedio ponderado**:

```
costo_promedio_nuevo = (stock_anterior x costo_anterior + cantidad_comprada x costo_compra)
                       / (stock_anterior + cantidad_comprada)
```

Ejemplo: tenes 2 kg a $48/kg y compras 1 kg a $60/kg → nuevo costo promedio $52/kg.

**Por que no FIFO:** el FIFO (el primero que entro es el primero que sale) es mas exacto, pero obliga
a llevar el detalle de cada lote y a consumir en orden. Para un local de pasteleria es complejidad sin
beneficio. Si alguna vez hace falta, se migra despues sin cambiar el resto.

> El costo promedio se recalcula **solo en las compras**. Una merma o un consumo no cambian el costo
> unitario, solo bajan la cantidad.

---

## 2. Los productos preparados: recetas de recetas

Tu ejemplo es perfecto: un restaurante tiene tortillas, spaghetti congelados y salsas ya hechos, y
despues los usa para armar platos. Eso se llama **receta de recetas** o lista de
materiales (Bill of Materials).

### 2.1 El problema que trae: el rendimiento

Una tortilla no se mide en "1 unidad". Se hace una tanda y **rinde** cierta cantidad. Y ademas
**se pierde** material al cocinar: se evapora agua, se derrama, se pega.

Si no se tiene en cuenta esto, todos los costos salen mal y en un sentido peligroso: **el costo sale
mas bajo que la realidad** y el dueño vende creyendo que gana cuando no gana.

```
Arroz:   500 g   ->  rinde 400 g cocidos   (merma 20%)
Salsa:   1 kg    ->  rinde 800 ml          (merma 20%)
Tortilla: 250 g de masa -> rinde 6 unidades
```

Por eso cada receta necesita **tres campos que no estan en tu plan**:

| Campo | Para que | Ejemplo |
|---|---|---|
| `rendimiento_cantidad` | Cuanto rinde una tanda | 400 |
| `rendimiento_unidad` | En que se mide ese rendimiento | g |
| `merma_pct` | Cuanto se pierde al elaborar (opcional, se deduce) | 20 |

Con eso, el costo por unidad de la tortilla se calcula sobre lo que **realmente** sale.

### 2.2 El segundo problema: los ciclos

Las recetas se pueden referenciar entre si. Si alguien hace que "Salsa de tomate" contenga "Tortilla" y
la "Tortilla" contenga "Salsa de tomate", el cálculo no termina nunca.

Se resuelve con dos controles:
1. Al guardar, se verifica que un artículo no se contenga a sí mismo, ni directa ni indirectamente.
2. Al calcular, hay un limite de profundidad (por ejemplo, 10 niveles). Si se supera, se corta y se
   avisa.

### 2.3 El tercer problema: el doble descuento

Si un preparado descuenta sus insumos al elaborarse, y despues el plato descuenta el preparado al
venderse, hay que tener cuidado de **no descontar dos veces** los mismos insumos.

La regla:
- Al **elaborar** un preparado (tortillas, salsa) → se descuentan sus insumos del stock y se suma stock
  de preparado.
- Al **vender** un plato → se descuenta el stock del plato. **No** se vuelven a descontar los insumos,
  porque ya se descontaron al elaborar.

Es decir: se descuenta en cada paso de la cadena, una sola vez.

---

## 3. Las llegadas de proveedores NO son stock

Proponer que el calendario muestre "el proveedor llega el jueves con 5 kg de harina" es excelente idea,
pero hay que separar dos cosas que se ven iguales y no lo son:

| | Que es | Cuenta como stock |
|---|---|---|
| **Compra realizada** | Ya esta paga y va en camino | **No**, hasta que llega |
| **Llegada prevista** | Alguien dijo "el jueves" | **No**, es una expectativa |
| **Mercaderia recibida** | Esta en el deposito | **Si**, y ahi si se anota el movimiento de compra |

Si se contara la llegada prevista como stock, el sistema mostraria inventario que el local no tiene y
se comprometio a vender que no puede hacer. **Ese es el error mas caro posible en este sistema.**

### 3.1 Como queda la proyeccion

Para saber si un pedido del viernes se puede cumplir, el sistema calcula:

```
disponible(fecha) = stock real
                  + compras previstas que llegan antes de esa fecha
                  - consumo ya comprometido (pedidos y agendados anteriores)
                  - consumo del pedido que estamos evaluando
```

Si `disponible` es negativo, hay **faltante**, y el sistema dice exactamente cuanto falta y de quien
comprarlo.

Si una compra prevista llega **despues** de la fecha en que se necesita, el faltante es real aunque el
proveedor "venga luego". Eso se avisa de forma explicita.

### 3.2 La reserva: comprometido frente a consumido

Un tercer matiz, importante en la practica:

- **Comprometido**: lo que ya se comprometio a entregar (un pedido confirmado o una produccion agendada). Se
  reserva para que dos pedidos no usen el mismo kilo.
- **Consumido**: lo que se elaboro de verdad.

Se muestran por separado porque el dueño necesita ver las dos cosas: cuanto tiene, cuanto ya comprometido y
cuanto realmente se uso.

---

## 4. El hueco mas importante: el conteo fisico

Nada de lo anterior funciona en el mundo real sin esto.

Si el stock se calcula solo con movimientos, tarde o temprano va a dejar de coincidir con la realidad:
se cae un frasco, se mide mal, hay mercaderia vencida, alguien se lleva algo.

Hace falta una pantalla de **conteo**:

```
Conteo de inventario - 15 de marzo
  Harina     sistema: 2,400 kg   conté: 2,350 kg   diferencia: -50 g
  Huevos     sistema: 22 und     conté: 22 und     diferencia: 0
```

Y que esa diferencia se registre como ajuste, **quedando registrado quién lo hizo y cuándo**. Es la
única forma de que el sistema sea confiable, y además el dueño lo necesita para cerrar el mes.

Sin conteos, en tres meses los números dejan de cuadrar y el local abandona la app.

---

## 5. Correccion a la navegacion: un solo tipo de articulo

Para que las recetas de recetas funcionen, **no puede haber dos tablas separadas** (`insumos` y
`productos`) con lógica duplicada. Hay que tener **un solo tipo de articulo**:

| Que es | Se vende | Se usa en recetas | Se almacena |
|---|---|---|---|
| Harina | No | Si | Si |
| Torta de chocolate | Si | No | No (se produce al vender) |
| Tortilla cocida | **Si** | **Si** | **Si** |
| Salsa de tomate | **Si** | **Si** | **Si** |

La tortilla cocida se vende sola **y** es parte de un plato. Ese caso es precisamente el que rompe el
modelo de dos tablas. Se resuelve con un unico tabla de **articulos** con banderas:

```
articulos
  id, negocio_id, nombre, tipo (materia_prima | preparado | producto)
  es_vendible      -- se puede vender
  unidad_base, stock, costo_promedio
  rendimiento_cantidad, rendimiento_unidad, merma_pct
  proveedor_id, foto, activo
```

Y las recetas y los movimientos apuntan a `articulos`. Es un cambio importante y por eso conviene
hacerlo **ahora**, cuando la base esta vacia: migrar despues significa rehacer el motor de costeo, que
ya esta escrito y testeado.

---

## 6. Notificaciones: que se puede y que no

Las ideas son buenas. El detalle técnico importa para no prometer lo que no se puede:

| Canal | ¿Funciona con la app cerrada? | Costo | Veredicto |
|---|---|---|---|
| **Avisos dentro de la app** | No (hay que abrirla) | 0 | **Empezar por acá** |
| **Correo** | Si | 0 (con un servicio de envio y un plan, o marginal) | **Muy recomendado**: resumen diario a las 7 de la mañana |
| **Notificaciones push del navegador** | Si | 0 | Bueno, pero en iPhone **solo funciona si la app esta instalada en la pantalla de inicio** |
| SMS | Si | Costo por mensaje | Caro y exagerado para esto |

### Lo que tiene que avisar el sistema

| Aviso | Cuando |
|---|---|
| Pedido proximo | El dia anterior y el mismo dia |
| Entrega hoy | La manana del dia |
| Llega proveedor | El dia anterior a la llegada prevista |
| **Stock bajo** | Cuando un articulo baja del minimo que definio el negocio |
| **Faltante para un pedido** | Cuando agendar un pedido que no se puede cumplir |
| Conteo mensual | Recordatorio en el dia que el negocio configuro |

La recomendacion tecnica: empezar con avisos dentro de la app mas un **correo diario** con el resumen
(lo que hay que producir, lo que hay que entregar, los faltantes). El push del navegador se agrega
despues, y hay que avisarle al cliente final que en iPhone tiene que agregar la app a la pantalla de
inicio.

### El recordatorio de inventario

Se puede y es facil: se guarda en el negocio un dia del mes y una hora, y el sistema lo manda con el
correo. No hace falta tecnologia especial.

---

## 7. Graficas: que mirar de verdad

Las graficas se eligen mal cuando sobran**: si no responden una pregunta, sobran. Estas son las que un local
necesita de verdad:

| Grafica | Pregunta que responde |
|---|---|
| **Resultado por mes** (ventas, insumos, gastos, ganancia) | ¿El negocio es viable? |
| **Ganancia por dia** | ¿Que dias valen la pena? |
| **Productos mas vendidos y mas rentables** | ¿Que dejo de hacer? |
| **Clientes que mas gastan** | ¿A quien hay que cuidar? |
| **Insumos que mas se consumen** | ¿Que hay que comprar antes? |
| **Perdidas y mermas** | ¿Se me escapa mercaderia? |
| **Precios de insumos en el tiempo** | ¿Subieron mucho y no actualice los productos? |

Ultima es importante y casi nadie la tiene: **si subio el precio de un insumo y los productos mantienen
el precio viejo, el margen se esta comiendo solo**. El sistema tiene que avisarlo.

---

## 8. Lo que faltaba y conviene agregar

| Agregar | Por que |
|---|---|
| **Lista para comprar al proveedor** | Se genera sola con los faltantes: que comprar, cuanto y a quien. Se imprime o se manda por WhatsApp. **Es la funcionalidad que mas va a usar el dueño.** |
| **Comanda de produccion** | Por pedido, que hay que preparar y en que orden. Se imprime y va a la cocina. |
| **Historial de precio de insumos** | Para saber si el margen sigue siendo el mismo. |
| **Minimo de stock por articulo** | Es lo que dispara el aviso de stock bajo. |
| **Corte del dia configurable** | Una panaderia produce de noche: el "dia" operativo arranca a las 4 de la mañana, no a medianoche. Si no se configura, los pedidos de la madrugada quedan en el dia anterior. |

---

## 9. Orden de construccion revisado

Con todo esto incorporado, el orden queda:

| # | Modulo | Razon |
|---|---|---|
| 1 | **Articulos unificados** y libro de movimientos | Es la base de todo lo demas. Ahora, mientras no hay datos. |
| 2 | **Recetario** con costo en vivo y rendimiento | Funcion principal del negocio |
| 3 | **Cuentas de usuario** y persistencia real | Sin esto no hay nada guardado |
| 4 | **Agenda**: produccion agendada + llegadas previstas + **faltantes** | El modulo que justifica la cuota |
| 5 | **Inventario**: conteos, ajustes, minimos | Da confiabilidad a los numeros |
| 6 | **Pedidos y clientes** con costo congelado | Viene sobre lo anterior |
| 7 | **Listas para imprimir**: compras y comanda | Lo que mas se usa a diario |
| 8 | **Gastos y resultado mensual** | Cierra el circulo financiero |
| 9 | **Avisos**: dentro de la app + correo diario | Con lo anterior ya hay que avisar |
| 10 | **Graficas** y **push** | Ultimo: es visibilidad, no operacion |

La foto queda como parte del articulo: se sube al crear, opcional, comprimida.
