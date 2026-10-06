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

| Tipo                    | Efecto en stock | Cuando se anota                                 |
| ----------------------- | --------------- | ----------------------------------------------- |
| `compra`                | **Suma**        | Llega mercaderia del proveedor                  |
| `produccion`            | **Resta**       | Se prepara una receta (consume insumos)         |
| `devolucion_produccion` | **Suma**        | Se devuelve mercaderia elaborated al stock      |
| `merma`                 | **Resta**       | Se roto, se vencio, se regalo                   |
| `ajuste_conteo`         | Corrige         | Conteo fisico: se ajusta a lo que realmente hay |
| `descarte`              | **Resta**       | Se descarta producto elaboration vencido        |

Con esto se responde siempre la pregunta clave: **de donde salio este kilo de harina?**

### 1.1bis La regla mal entendida: "nunca a mano" no significa "el humano no puede"

Este punto se documento aparte porque es facil de malinterpretar y ya genero una discusion.

> **El stock no se edita a mano. El humano si puede provocar cambios en el stock.**

La distincion es entre **sobreescribir** y **anotar un movimiento**:

| Forma                | Que hace                                                          | Rastro                 | Veredicto                        |
| -------------------- | ----------------------------------------------------------------- | ---------------------- | -------------------------------- |
| Editar               | Escribe 25 en el campo y el sistema olvida que habia 20           | No queda nada          | **Prohibido**: el sistema miente |
| Anotar un movimiento | Anota "compre 5", el sistema guarda la fila y calcula 20 + 5 = 25 | Quien, cuando, por que | **Es la forma correcta**         |

Un dueño de un local va a cambiar el stock todas las semanas, apurado, con el teléfono en una mano. La
app no puede convertir eso en una lista de recordatorios de "debería registrarlo"; lo tiene que
permitir en dos toques.

**El caso concreto: la compra de urgencia.** Un restaurante se queda sin algo a las 21:00 y va a la
farmacia a comprarlo. No hay proveedor, no hay factura, no hay compra registrada. Es el caso mas
frecuente de todos y el que con mas razon se descarta si no esta resuelto.

La respuesta es que **ya esta resuelto por el esquema, sin excepciones nuevas**: es una `compra` con
`proveedor_id = null`. La columna `compras.proveedor_id` es nullable (`on delete set null`), o sea que el
modelo ya admite compras sin proveedor. No hace falta un tipo de movimiento "compra suelta" ni una
bandilla de excepcion.

Todos los casos "manuales" que van a aparecer en la operacion real mapean a movimientos que ya existen:

| Situacion real                                 | Movimiento           | Como se anota                                     |
| ---------------------------------------------- | -------------------- | ------------------------------------------------- |
| Compra de urgencia en el local, sin factura    | `compra`             | `proveedor_id = null`, una sola linea, nota libre |
| Llega mercaderia del proveedor                 | `compra`             | Con proveedor y varias lineas                     |
| Conté 24,8 kg y el sistema dice 25             | `ajuste_conteo`      | Cantidad negativa, queda quien conto y cuando     |
| Devolvieron mercaderia que el sistema no tiene | `ajuste_conteo`      | Cantidad positiva                                 |
| Se cayo un frasco, hay mercaderia vencida      | `merma` o `descarte` | Cantidad negativa                                 |
| Se elaboro una tanda                           | `produccion`         | automatico, lo calcula el motor de recetas        |

**Ninguno de estos necesita tocar `articulos.stock`.** La interfaz cambia, no el modelo: el campo de
stock deja de ser editable y pasa a ser un boton "Ajustar stock" que abre una de estas opciones.

### 1.1ter El riesgo real de la compra de urgencia: el precio, no la cantidad

Ajustar el stock a mano es un inconvenience. **Ajustar el costo promedio en silencio es un
perjuicio economico**, y es el problema que hay que resolver de verdad.

Si el local compra azucar de urgencia a $120 el kg y el `costo_promedio` estaba en $90, cambia en cascada
el costo de todos los productos que usan azucar. El precio de venta no se mueve, el margen se achica
solo, y el dueño no se entera hasta que ya vendio a perdida.

Por eso:

1. **El precio de la compra de urgencia no puede ser opcional.** Si el usuario lo deja vacio, la app
   asume el costo actual y deja la compra marcada como supuesto en la nota, para que se vea despues.
2. **Al cambiar un costo, la app avisa que productos cambiaron y cuanto.** Esto es la parte que hoy no
   existe y es la que convierte un ajuste de stock en una decision informada en vez de una sorpresa.
   Ya estaba prevista como parte de la Fase 3 en `ROADMAP.md` ("recálculo en cascada de los costos
   afectados, con aviso de qué productos cambiaron y cuanto").
3. **Inventario muestra la ultima variacion del costo** de cada articulo ("$90 → $120, hace 2 dias").
   Es la senal de alerta mas barata y mas util que puede dar la pantalla.

Este es el mismo problema que el bug 9.2 de la v1 (costos congelados sin aviso), pero al reves: la v1
congelaba el costo viejo; el riesgo aca es que el costo nuevo se aplique sin que nadie mire.

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

### 1.2bis Corregido: valorar y consumir son dos cosas distintas

La razon de arriba descarta el FIFO **entero**, y eso es un error cuando hay producción que se
guarda. Un restaurante que hace salsa que dura 4 dias necesita consumir lo mas viejo primero, o
tira comida.

La correccion es que son dos problemas separados:

|                                          | Para que                              | Como se resuelve                      |
| ---------------------------------------- | ------------------------------------- | ------------------------------------- |
| **Valorar** (cuanto cuesta lo que tengo) | Costear recetas, productos y margenes | Costo promedio ponderado, simple      |
| **Consumir** (que se usa primero)        | No terminar tirando comida            | Lo mas viejo primero, con vencimiento |

Se puede usar costo promedio para valorar y al mismo tiempo consumir lo mas viejo. Lo que se
descarta es la **valoracion por lotes**, que es la parte cara; la regla de consumir por antiguedad no
cuesta casi nada una vez que se tiene la fecha de vencimiento.

### 1.3 Vencimientos: dos columnas y ningun ajuste

Un local de pasteleria no necesita fechas de vencimiento. Un restaurante que produce por lotes si, y
una carniceria todavia mas. Por eso el vencimiento es **opcional siempre**.

**En el articulo** (migracion `0004`):

```sql
duracion_dias integer null   -- null = no vence (harina, pasta)
```

Es una duracion, no una fecha, porque es lo que el dueño sabe: _"la salsa dura 4 dias"_. Pedirle una
fecha lo obliga a hacer cuentas que no le sirven de nada.

**En el movimiento**, para lo que se compra con fecha impresa:

```sql
vence_el date null   -- si queda null, se deduce de duracion_dias
```

Aqui hay que ser consciente de una cosa: **el vencimiento es del lote, no del articulo**. Si tenes
tres entregas de yogur con tres fechas distintas, `articulos.duracion_dias` no alcanza y hace falta
la fecha por entrada. Por eso viven en dos lugares distintos.

**Lo que todavia no esta hecho:** la pantalla que dice _"lo mas viejo de la salsa vence el jueves"_.
Requiere los movimientos, que todavia se editan a mano (ver seccion 1.1bis). La version barata, que
no necesita un identificador por lote, es mostrar la fecha de vencimiento mas antigua que hay en
stock.

---

## 2. Los productos preparados: recetas de recetas

Tu ejemplo es perfecto: un restaurante tiene tortillas, spaghetti congelados y salsas ya hechos, y
despues los usa para armar platos. Eso se llama **receta de recetas** o lista de
materiales (Bill of Materials).

### 2.0 El rendimiento va en la unidad que se vende

Esta es la regla que hay que tener clara antes de cargar ninguna receta, porque es la que más
confusión genera.

> **El rendimiento se cuenta en porciones vendibles, no en la unidad intermedia.**

Se verificó con el caso de la torta. La receta es de **una torta entera**:

```
Harina    250 g
Azúcar    200 g
Huevos      3 unidades
─────────────────────
Torta      1  ──se corta en──▶  8 porciones  ← esto es lo que se vende
```

Si el rendimiento fuera `1 torta`, el sistema creería que cada porción sale de una torta entera y
pediría 8 tortas para vender 8 porciones. **El número que hay que poner es 8.**

| Negocio | Receta de | Rendimiento que se pone |
|---|---|---|
| Tortillería | Media masa, rinde 6 tortillas | **6** tortillas |
| Pastelería | Una torta, cortada en 8 | **8** porciones |
| Restaurante | Un kilo de salsa, rinden 4 litros | **4** litros de salsa |

El motor ya lo calcula bien en los dos casos:

```
costo por porción  = costo total de la receta / rendimiento × merma
tandas para N      = N / rendimiento
```

La segunda línea es la que más importa: pedir 16 porciones de torta pide **2 tortas**, no 16. Y es
exactamente lo que hace `needingInsumos`.

**Que el rendimiento se exprese en porciones vendibles es lo que hace que no haga falta una entidad
aparte para "la porción".** El artículo es la torta, el rendimiento dice cuántas porciones salen, y
el stock se cuenta en porciones.

### 2.0bis El caso que sí necesita un segundo artículo

Si un mismo negocio vende **la torta entera y también porciones**, hace falta un segundo artículo:

| Artículo | Tipo | Rendimiento | Costo |
|---|---|---|---|
| Torta entera | Con receta | 1 | Costo de la receta |
| Porción de torta | Sin receta, sale de cortar | — | Torta / 8 |

Este caso **queda fuera del modelo actual**: una porción no tiene receta propia y su costo sale de
dividir el de la torta, algo que el motor todavía no resuelve. Se anota como pendiente, no como
resuelto. Si aparece en el negocio de un cliente, se implementa.

---

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

| Campo                  | Para que                                           | Ejemplo |
| ---------------------- | -------------------------------------------------- | ------- |
| `rendimiento_cantidad` | Cuanto rinde una tanda                             | 400     |
| `rendimiento_unidad`   | En que se mide ese rendimiento                     | g       |
| `merma_pct`            | Cuanto se pierde al elaborar (opcional, se deduce) | 20      |

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

|                         | Que es                      | Cuenta como stock                                 |
| ----------------------- | --------------------------- | ------------------------------------------------- |
| **Compra realizada**    | Ya esta paga y va en camino | **No**, hasta que llega                           |
| **Llegada prevista**    | Alguien dijo "el jueves"    | **No**, es una expectativa                        |
| **Mercaderia recibida** | Esta en el deposito         | **Si**, y ahi si se anota el movimiento de compra |

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

### 3.3 Cuándo se descuenta: al producir, nunca al vender

Esta es la regla que hay que fijar **antes** de implementar, porque si no, el stock se descuenta dos
veces y se hunde solo.

Un restaurante produce salsa, con esa salsa hace tortillas, y las tortillas se venden:

| Paso                      | Que se descuenta      | Por que                             |
| ------------------------- | --------------------- | ----------------------------------- |
| 1. Produce 4 L de salsa   | Tomate y cebolla      | La harina se convirtió en salsa     |
| 2. Hace 20 tortillas      | La mezcla de tortilla | La mezcla se convirtió en tortillas |
| 3. Vende las 20 tortillas | **Nada**              | Ya se descontó en el paso 2         |

**Regla: se descuenta cuando la mercadería cambia de estado, no cuando se vende.** El paso 3 no toca
stock. Si tambien descontara, el paso 2 seria un error y la tortilla se descontaria dos veces.

La consecuencia práctica: un articulo elaborado **solo entra al stock cuando se produce**, y su stock
se consume cuando se usa o cuando se vende, segun corresponda. El paso 3 no vuelve a tocar los
insumos.

> El HTML tiene que producir las dos cosas en una sola transaccion: descuenta los insumos y suma lo
> producido. Si se hiciera por partes y fallara la segunda, el stock quedaria mal sin avisar.

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

| Que es             | Se vende | Se usa en recetas | Se almacena               |
| ------------------ | -------- | ----------------- | ------------------------- |
| Harina             | No       | Si                | Si                        |
| Torta de chocolate | Si       | No                | No (se produce al vender) |
| Tortilla cocida    | **Si**   | **Si**            | **Si**                    |
| Salsa de tomate    | **Si**   | **Si**            | **Si**                    |

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

| Canal                                 | ¿Funciona con la app cerrada? | Costo                                              | Veredicto                                                                                 |
| ------------------------------------- | ----------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Avisos dentro de la app**           | No (hay que abrirla)          | 0                                                  | **Empezar por acá**                                                                       |
| **Correo**                            | Si                            | 0 (con un servicio de envio y un plan, o marginal) | **Muy recomendado**: resumen diario a las 7 de la mañana                                  |
| **Notificaciones push del navegador** | Si                            | 0                                                  | Bueno, pero en iPhone **solo funciona si la app esta instalada en la pantalla de inicio** |
| SMS                                   | Si                            | Costo por mensaje                                  | Caro y exagerado para esto                                                                |

### Lo que tiene que avisar el sistema

| Aviso                       | Cuando                                                    |
| --------------------------- | --------------------------------------------------------- |
| Pedido proximo              | El dia anterior y el mismo dia                            |
| Entrega hoy                 | La manana del dia                                         |
| Llega proveedor             | El dia anterior a la llegada prevista                     |
| **Stock bajo**              | Cuando un articulo baja del minimo que definio el negocio |
| **Faltante para un pedido** | Cuando agendar un pedido que no se puede cumplir          |
| Conteo mensual              | Recordatorio en el dia que el negocio configuro           |

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

| Grafica                                                   | Pregunta que responde                         |
| --------------------------------------------------------- | --------------------------------------------- |
| **Resultado por mes** (ventas, insumos, gastos, ganancia) | ¿El negocio es viable?                        |
| **Ganancia por dia**                                      | ¿Que dias valen la pena?                      |
| **Productos mas vendidos y mas rentables**                | ¿Que dejo de hacer?                           |
| **Clientes que mas gastan**                               | ¿A quien hay que cuidar?                      |
| **Insumos que mas se consumen**                           | ¿Que hay que comprar antes?                   |
| **Perdidas y mermas**                                     | ¿Se me escapa mercaderia?                     |
| **Precios de insumos en el tiempo**                       | ¿Subieron mucho y no actualice los productos? |

Ultima es importante y casi nadie la tiene: **si subio el precio de un insumo y los productos mantienen
el precio viejo, el margen se esta comiendo solo**. El sistema tiene que avisarlo.

---

## 8. Lo que faltaba y conviene agregar

| Agregar                             | Por que                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lista para comprar al proveedor** | Se genera sola con los faltantes: que comprar, cuanto y a quien. Se imprime o se manda por WhatsApp. **Es la funcionalidad que mas va a usar el dueño.**                     |
| **Comanda de produccion**           | Por pedido, que hay que preparar y en que orden. Se imprime y va a la cocina.                                                                                                |
| **Historial de precio de insumos**  | Para saber si el margen sigue siendo el mismo.                                                                                                                               |
| **Minimo de stock por articulo**    | Es lo que dispara el aviso de stock bajo.                                                                                                                                    |
| **Corte del dia configurable**      | Una panaderia produce de noche: el "dia" operativo arranca a las 4 de la mañana, no a medianoche. Si no se configura, los pedidos de la madrugada quedan en el dia anterior. |

---

## 9. Orden de construccion revisado

Con todo esto incorporado, el orden queda:

| #   | Modulo                                                               | Razon                                                      |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Articulos unificados** y libro de movimientos                      | Es la base de todo lo demas. Ahora, mientras no hay datos. |
| 2   | **Recetario** con costo en vivo y rendimiento                        | Funcion principal del negocio                              |
| 3   | **Cuentas de usuario** y persistencia real                           | Sin esto no hay nada guardado                              |
| 4   | **Agenda**: produccion agendada + llegadas previstas + **faltantes** | El modulo que justifica la cuota                           |
| 5   | **Inventario**: conteos, ajustes, minimos                            | Da confiabilidad a los numeros                             |
| 6   | **Pedidos y clientes** con costo congelado                           | Viene sobre lo anterior                                    |
| 7   | **Listas para imprimir**: compras y comanda                          | Lo que mas se usa a diario                                 |
| 8   | **Gastos y resultado mensual**                                       | Cierra el circulo financiero                               |
| 9   | **Avisos**: dentro de la app + correo diario                         | Con lo anterior ya hay que avisar                          |
| 10  | **Graficas** y **push**                                              | Ultimo: es visibilidad, no operacion                       |

La foto queda como parte del articulo: se sube al crear, opcional, comprimida.
