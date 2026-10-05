# Plan funcional — como debe funcionar el sistema

Especificacion de las pantallas y del modelo mental del producto, escrita antes de implementarlas
para no construir a ciegas. Cada seccion responde una pregunta concreta del uso real de un comercio.

- Vision y arquitectura: [ROADMAP.md](ROADMAP.md)
- Bitacora de decisiones: [IA_GUIDE.md](IA_GUIDE.md)

---

## 1. La pregunta central que define todo

Un local de produccion artesanal necesita responder, **en este orden**, lo siguiente:

1. **Que tengo guardado hoy?** (stock)
2. **Que puedo vender sin comprar nada?** (stock menos lo ya comprometido)
3. **Cuanto me cuesta producirlo?** (receta x insumos a su costo actual)
4. **Cuanto gano si lo vendo?** (precio menos costo)
5. **Que tengo para entregar tal dia?** (agenda)
6. **Cuanto entre en total y cuanto gaste?** (resultado del mes)

Si el sistema no responde las seis en ese orden, es un cuaderno digital, no una herramienta.

---

## 2. Las pantallas y para que existe cada una

| Pantalla | Pregunta que responde | Tiene que poder mostrar |
|---|---|---|
| **Inicio** | Que hago hoy? | Pedidos del dia, entregas, a cuanto se cobra hoy, alertas de stock bajo |
| **Recetario** | Que me cuesta esto y a cuanto lo vendo? | Lista de productos con foto, costo, precio, margen y estado del stock |
| **Inventario** | Que compro y a cuanto? | Insumos, proveedor, stock teorico, costo por unidad, historial de compras |
| **Agenda** | Que tengo que producir y entregar? | Calendario con pedidos por fecha, carga por dia, vista "para hoy" |
| **Pedidos** | Quien me compro que? | Pedidos con cliente, estado, pago, detalle |
| **Mas** | Como configuro el negocio? | Negocio, equipo, proveedores, gastos, exportar datos |

### Cambio de navegacion propuesto

Hoy la barra inferior tiene Inicio, Pedidos, Agenda, Inventario y Mas. **Mas** no es operacion
diaria: ocupa un lugar en la barra que el dueño no usa todos los dias. Se propone:

```
Antes:  Inicio · Pedidos · Agenda · Inventario · Mas
Ahora:  Inicio · Recetario · Pedidos · Agenda · Inventario
```

Y **Mas** pasa a un boton de la cabecera, junto al nombre del negocio. Se libera un lugar para el
recetario, que es la pantalla mas usada del sistema.

---

## 3. El recetario (la funcion principal que hay que recuperar)

Es el corazon del producto y lo que la v1 tenia. Cada producto es una **receta**: una lista de
insumos con su cantidad, y el costo se calcula solo.

### 3.1 Como se crea un producto

```
Nombre          Torta de chocolate
Precio de venta  $1.200        (o margen 60% y se calcula solo)
Foto            (opcional)
Receta:
  Harina      400 g     ->  $19,20
  Azucar      150 g     ->  $13,50
  Huevos         6 und   ->  $60,00
  Leche       200 ml    ->  $16,00
  Chocolate   100 g     ->  $45,00
                     Costo total: $153,70
                     Margen: 87%
                     Ganancia por unidad: $1.046,30
```

El costo se ve **mientras se carga la receta**, linea por linea, y el total se actualiza en vivo. Es
la diferencia entre una app que se usa y una que se abandona.

### 3.2 Lo que hay que mostrar en la lista de productos

| Dato | Por que importa |
|---|---|
| Foto | Reconocer el producto de un vistazo, sin leer |
| Nombre | Identificacion |
| Costo | Lo que sale producirlo |
| Precio | Lo que se cobra |
| Margen % | Lo que queda |
| Insumos en faltante | Si la receta no se puede Armar hoy |

### 3.3 Reglas

- El costo **nunca** se escribe a mano si hay receta: se calcula. Se puede sobrescribir solo de forma
  explicita (por ejemplo, un producto cuyo costo viene de una compra externa).
- Editar el precio de un insumo **recalcula** todos los productos que lo usan, y se avisa cuáles
  cambiaron y cuánto.
- Un producto con costo 0 no se puede guardar (error de la v1 resuelto).
- Se puede ver el costo de la receta completa y el costo por unidad.

---

## 4. El calendario: la idea central que planteaste

Esta es la parte mas valiosa y la que mejor justifica el sistema. La idea: **marcar en una fecha
cuantos productos se van a vender, y ver al instante el costo, la ganancia y el inventario que queda.**

### 4.1 Como funciona

1. En la **agenda** se toca un dia y se agregan productos con la cantidad a producir.
2. El sistema calcula al instante:
   - **Costo de produccion** de ese dia (suma de las recetas de todo lo agendado).
   - **Ingresos esperados** (suma de los precios).
   - **Ganancia esperada**.
3. Se cruza con el inventario:
   - **Stock disponible** de cada insumo.
   - **Stock comprometido**: lo que ya usan los pedidos de dias anteriores.
   - **Stock que queda** despues de producir ese dia.
   - **Faltantes**: que insumo hay que comprar si o si, y a cuanto proveedor.
4. Cada bloque del dia se puede convertir en **pedido** (con cliente) o quedar como produccion interna.

### 4.2 Ejemplo de una semana

```
Lunes    2 tortas + 5 medialunas
         Costo $  780,00   Ingresos $ 3.100,00   Ganancia $ 2.320,00
         Harina: 1,2 kg de 3 kg disponibles -> OK

Martes   1 torta + 12 medialunas
         Costo $  940,00   Ingresos $ 4.200,00   Ganancia $ 3.260,00
         Harina: FALTAN 400 g  ->  hay que comprar
         Chocolate: FALTAN 200 g ->  hay que comprar
```

Ese aviso de **faltante** es oro: dice al dueño, un jueves, que el viernes no va a poder producir
todo lo agendado. Eso es lo que un cuaderno no hace y lo que justifica pagar una cuota.

### 4.3 Vistas

| Vista | Para que |
|---|---|
| **Dia** | Operacion diaria, que hago hoy |
| **Semana** | Ver carga y detectar dias saturados |
| **Mes** | Planificacion y comparacion de meses |

Ademas, una **vista de lista** con "para hoy" y "para manana", que es lo mas consultado.

---

## 5. Pedidos, clientes y entregas

### 5.1 Pedido

- Cliente (puede ser nuevo, se crea en dos toques).
- Lineas de producto con cantidad; **el costo de cada linea se congela al confirmar** (para que un
  pedido viejo siga cuadrando aunque cambien los precios).
- Estado: `borrador -> confirmado -> en produccion -> listo -> entregado`, mas `cancelado`.
- Pago: `pendiente -> parcial -> pagado`, con importe recibido.
- Fechas: **fecha del pedido** y **fecha de entrega**. Las dos aparecen en la agenda.

### 5.2 Transiciones validas

No todos los estados se pueden dar en cualquier orden. Por ejemplo, no se puede marcar como
`entregado` un pedido `cancelado`. Se define una tabla de transiciones permitidas y la interfaz
solo ofrece las validas.

### 5.3 Entregas

- Direccion, horario programado, repartidor asignado, estado.
- Vista de ruta del dia.

---

## 6. Gastos y resultado del negocio

Hoy se calcula la ganancia por venta, pero un local tambien gasta en cosas que no son insumos:
luz, gas, packaging, servicios,Impuestos.

**Propuesta:** una seccion de **gastos** con monto, categoria, fecha y proveedor, que se cargan por
mes. Con eso:

```
Resultado de octubre
  Ventas        $ 480.000
  Costo insumos $ 190.000
  Otros gastos  $  62.000
  Ganancia neta $ 228.000
```

Esta pantalla es la que responde si el negocio es viable. Sin ella, el sistema solo sirve para
cotizar.

---

## 7. Fotos: cuanto espacio ocupan y como resolverlo

### El problema

La v1 guardaba las fotos como Base64 dentro del `localStorage`: un aumento de 33% sobre el archivo
original y un limite de unos 5 MB. Con cuatro fotos de 1 MB, la app dejaba de guardar y **decía
que habia guardado**.

### La solucion en la v2

Las fotos van a **Supabase Storage**, no a la base de datos. En la base solo se guarda la URL.

| Aspecto | Decision |
|---|---|
| Donde se guardan | Supabase Storage, en una carpeta por negocio |
| Tamano maximo | Se redimensiona la imagen en el celular antes de subir: lado mayor 1200 px |
| Formato | WebP (o JPEG si no se soporta) |
| Peso esperado | 80 a 250 KB por foto |
| Cuantas entran en el plan gratuito | 1 GB de Storage = **unas 4.000 a 10.000 fotos** |

**Conclusion: no es un problema de espacio.** 1 GB alcanza para el caso de veinte mil insumos y productos
con foto.

### Reglas de experiencia

- La foto es **opcional** siempre: el sistema tiene que ser usable sin ella.
- Se muestra una miniatura de 60 px en listas y una grande al abrir.
- En el celular, elegir una foto debe usar la camara directamente.
- Si la foto no entra (cuota), se avisa y el producto se guarda igual sin foto, en vez de perder todo.

---

## 8. Que se construye primero y por que

| Orden | Que | Razon |
|---|---|---|
| 1 | **Recetario** con costeo en vivo | Es la funcion principal. Sin esto el sistema no sirve. |
| 2 | **Agenda** con produccion planificada | Es lo que da valor real y lo que justifica la cuota. |
| 3 | **Inventario** conectado al recetario | Ya esta la pantalla; falta conectarla. |
| 4 | **Cuentas de usuario** y persistencia | Sin esto nada se guarda entre dispositivos. |
| 5 | Pedidos, clientes, entregas | Vienen sobre las anteriores. |
| 6 | Gastos y resultado mensual | Cierra el circulo financiero. |

### Sobre la pregunta de construir antes o despues del servidor

**Es buena idea, con una condicion.** Se puede construir (y conviene) toda la logica antes de las
cuentas, porque:

- El motor de calculo ya esta escrito y testeado, y no depende de nada.
- La interfaz ya trabaja contra una interfaz de repositorio, no contra Supabase.

**La condicion es esta:** el paso 4 (cuentas) no se puede dejar para el final sin mas. Si se hace
todo el producto en memoria y recien al final se conecta la base, el momento de la verdad (autenticar,
crear el negocio, aplicar permisos, guardar de verdad) llega tarde, y es la parte con mas riesgos
tecnicos. Por eso el orden propuesto mete las cuentas antes de pedidos y entregas, no al final.

---

## 9. Decisiones que hay que tomar

| Decision | Propuesta | Por que |
|---|---|---|
| Fecha de la agenda | Fecha de **entrega** por defecto, con fecha de produccion opcional | Es lo que el cliente pide: "para el viernes" |
| Donde se calcula el costo de un pedido | Al confirmar, y se congela | Un pedido viejo debe seguir cuadrando |
| Margen sobre costo o sobre precio | Sobre el **costo** (como en la v1) | Es como piensa el dueño: "quiero ganar el 60%" |
| Moneda | UYU, configurable por negocio | Hoy es fijo |
| Cantidades fraccionadas | Permitidas (media torta, 250 g) | Los locales de reposteria venden por peso |
| Stock | Se calcula por **produccion comprometida**, no por ventas | El dueño produce antes de vender |

---

## 10. Resumen del flujo completo

```
   Proveedor ──► Compra ──► Insumo (stock, costo, foto)
                                 │
                                 ▼
                            Receta / Producto  ──►  Costo, precio, margen
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
        Agenda (plan)      Pedido (real)      Gastos (mes)
             │                   │                   │
             └────────────► Resultado ◄─────────────┘
```

La foto va en Insumo y en Producto. El calendario es el punto donde el negocio se planifica; los
pedidos son donde se reality; los gastos son donde se cierra la cuenta.
