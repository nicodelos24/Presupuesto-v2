# Visión y hoja de ruta — Presupuesto v2

Documento de producto y arquitectura. Define **qué queremos construir**, **con qué decisiones
técnicas** y **en qué orden**, para que la v2 deje de ser un prototipo personal y pase a ser un
producto vendible a varios locales comerciales.

- Documento complementario: [IA_GUIDE.md](IA_GUIDE.md) (bitácora de pedidos y cambios).
- Documento técnico de la base heredada: [DOCUMENTACION.md](DOCUMENTACION.md).

---

## Índice

1. [Contexto: dónde estamos](#1-contexto-dónde-estamos)
2. [Visión del producto](#2-visión-del-producto)
3. [Principios de diseño](#3-principios-de-diseño)
4. [Decisiones de arquitectura](#4-decisiones-de-arquitectura)
5. [Modelo de datos propuesto](#5-modelo-de-datos-propuesto)
6. [Hoja de ruta por fases](#6-hoja-de-ruta-por-fases)
7. [Arreglos heredados de la v1](#7-arreglos-heredados-de-la-v1)
8. [Riesgos y mitigaciones](#8-riesgos-y-mitigaciones)
9. [Decisiones pendientes](#9-decisiones-pendientes)
10. [Cómo trabajaremos](#10-cómo-trabajaremos)

---

## 1. Contexto: dónde estamos

La v1 (`Proyecto-Fer`) es una app web estática de una sola página: HTML, CSS y JavaScript vanilla, sin
dependencias, sin backend y sin base de datos. Todo vive en el `localStorage` del navegador.

**Lo que hace bien:**

- El motor de conversión de unidades (peso, volumen, unidades, paquetes) está bien pensado:
  convierte solo dentro del mismo tipo de unidad y no inventa equivalencias entre gramos y
  mililitros.
- El concepto de receta multi-insumo con costo parcial por línea es el corazón real del producto.
- La interfaz es usable y la lógica de negocio se entiende completa en 649 líneas.

**Lo que impide venderla:**

| Limitación                                           | Impacto comercial                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Los datos son del navegador, no de una cuenta        | No se puede compartir entre empleados, no se puede respaldar, no se puede recuperar si se borra el navegador. |
| Una sola "empresa" implícita                         | No hay separación entre locales: dos negocios distintos no pueden coexistir.                                  |
| No hay pedidos, clientes, entregas ni proveedores    | Es un cosificador, no un sistema de gestión. Falta la mitad del flujo real de un local.                       |
| No hay control de compras ni actualización de costos | El costo de un producto queda congelado y el margen se vuelve falso.                                          |
| Sin diseño de producto, sin responsive real          | Se ve como un ejercicio, no como algo que un comercio pueda poner en el mostrador.                            |

**Conclusión:** la v1 no se va a "arreglar" hasta que sea un producto. Se conserva su lógica de
cálculo (que es buena y testeable) y se reconstruye la arquitectura alrededor.

---

## 2. Visión del producto

**Una herramienta de gestión para pequeños comercios de alimentos y artesanía**, usada desde el
celular, que resuelva el circuito completo:

```
   Proveedor ──► Compra ──► Inventario ──► Receta ──► Producto
                                                    │
   Cliente ──► Pedido ──► Producción ──► Entrega ──► Cobro
                          (calendario)     (estado)
```

### Los 4 módulos que el local necesita

1. **Costos e inventario (heredado de la v1, corregido).**
   Materias primas con unidades reales, historial de compras con proveedor y precio, recetas que se
   costean solas y productos con precio de venta y margen real.

2. **Pedidos y clientes.**
   Cartera de clientes con datos de contacto y dirección. Pedidos con líneas de producto, estado
   (pendiente, en producción, listo, entregado, cancelado), forma de pago y saldo pendiente.

3. **Agenda y entregas.**
   Vista de calendario (día / semana / mes) donde cada pedido ocupa un día de producción y/o de
   entrega. Detección visual de exceso de carga por día. Este es el módulo que más valor aporta y
   el primero que un cliente pagaría.

4. **Compras a proveedores.**
   Carga de una compra con varias líneas, actualizando automáticamente el costo de los insumos y, por
   lo tanto, el costo y el margen de todos los productos que los usan.

### Qué es el diferencial frente a la competencia

Las herramientas de gestión para comercios (Tienda Nube, Manage, etc.) son caras, con
funcionalidades pensadas para retail y no para producción artesanal. Acá la propuesta es:

- **Simple y en el celular**, pensada para el dueño que atiende y cocina, no para un
  administrador de sistemas que abre el sistema una vez por semana.
- **Específica de producción**: recetas, insumos por peso, márgenes, fechas de entrega.
- **Precio accesible** para un local chico.
- **En español y en pesos uruguayos**, con las unidades que realmente usa un comercio local.

---

## 3. Principios de diseño

Estos principios mandan sobre cualquier decisión puntual. Cuando una funcionalidad nueva entre en
conflicto con uno de ellos, gana el principio.

1. **Móvil primero.** La app se usa de pie, con una mano, a veces con las manos ocupadas. Diseño
   para pantallas de 360 a 430 px de ancho. El escritorio es la adaptación, no el diseño base.
2. **Un objetivo por pantalla.** Cada pantalla responde una pregunta. Nada de formularios largos
   con veinte campos.
3. **Intuitivo por defecto.** Si algo requiere instrucciones, está mal diseñado. Navegación
   inferior tipo app en móvil (Inicio, Pedidos, Agenda, Inventario, Más).
4. **Comodidad tactile.** Targets de toque de al menos 44x44 px, separaciones amplias, sin acciones
   destructivas a un toque de distancia.
5. **Rápido para crear, lento para borrar.** Guardar un pedido tiene que ser de 3 toques.
   Borrar siempre con confirmación clara.
6. **Los datos son del cliente, no nuestros.** Nada de "datos de demostración atados a la cuenta".
   Exportación permanente, sin condiciones.
7. **Sin sorpresas de dinero.** Los valores se ven siempre con su unidad y su moneda. Si un cálculo
   fue estimado, se dice.
8. **Funciona sin internet** para las operaciones de lectura (cache local), y recovery claro cuando
   se pierde la conexión.

---

## 4. Decisiones de arquitectura

Esta es la sección más importante del documento: **casi todas las decisiones caras se toman acá**.
Cambiar la capa de datos más adelante es un proyecto entero.

### 4.1 Recomendación general

| Capa               | Elección                                                                     | Motivo                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Datos + Auth**   | **Supabase** (Postgres + Auth + Storage)                                     | Resuelve multi-cuenta, aislamiento por negocio, imágenes y backups sin mantener servidores. El plan gratuito alcanza para empezar a vender.        |
| **Frontend**       | **Vite + TypeScript + Svelte 5**                                             | Componentes reales, tipado para los cálculos, build optimizado, y un solo concepto mental en vez de la mezcla de vanilla + jQuery mental de la v1. |
| **Estilos**        | **Tailwind CSS** + tokens propios de diseño                                  | Consistencia visual rápida y un sistema de diseño documentado y extensible.                                                                        |
| **Iconos**         | **Lucide**                                                                   | Un set coherente, nada de emojis como botones (la v1 usa ✏️ 🗑️ ❌).                                                                                |
| **Calendario**     | **FullCalendar** o calendario propio                                         | Ver 4.3.                                                                                                                                           |
| **Despliegue**     | **Cloudflare Pages** (frontend, gratis, repo privado) + **Supabase** (datos) | Despliegue automático desde un repositorio **privado**, sin servidores propios ni límite de ancho de banda. Ver 4.6.                               |
| **Pagos (futuro)** | Stripe / Mercado Pago                                                        | Fase posterior a la validación con clientes reales.                                                                                                |

### 4.2 Por qué Supabase y no otras opciones

| Opción                     | Ventajas                                                                                                                | Problemas                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase** (recomendado) | Auth lista, Postgres real, **Row Level Security** para aislar locales, Storage para imágenes, dashboard, plan gratuito. | Base de datos relacional: hay que aprender SQL y las reglas de RLS son sutiles.                                                   |
| **Firebase**               | Muy simple de empezar, sync en tiempo real.                                                                             | Modelo de documentos: consultas relacionales (pedidos con cliente + líneas) son frágiles y caras. Cambiar después es muy costoso. |
| **Node + Postgres propio** | Control total.                                                                                                          | Hay que mantener servidores, backups, TLS, monitoreo. Un desarrollador solo no debería.                                           |
| **Solo localStorage** (v1) | Cero costo, cero mantenimiento.                                                                                         | No hay cuentas, no hay datos compartidos, no hay venta posible. Descartado.                                                       |

> **El punto no negociable: Row Level Security.** Si dos locales comparten base, cada consulta debe
> filtrar por `store_id`. Si se olvida en una sola tabla, un local ve los datos de otro. Es el riesgo
> de seguridad número uno de este proyecto y se resuelve solo con RLS bien configurada y probada.

### 4.3 El calendario

Opciones evaluadas:

- **FullCalendar**: librería madura, vistas día/semana/mes, eventos, arrastre. weigh ~150 KB.
  Se integra rápido y resuelve el 90% del caso.
- **Calendario propio**: control total del estilo y menos peso, pero semanas de trabajo
  (arrastre, rangos, zona horaria, recurrencia) que no aportan valor al producto.

**Recomendación:** empezar con FullCalendar y evaluar reemplazarlo por uno propio más adelante, cuando
sepamos qué interacción necesita realmente el usuario. Es una decisión reversible.

> Advertencia importante: `date-fns`/`Day.js` y el calendario tienen que usar **fechas locales**, no
> UTC. Un pedido para el viernes a las 18:00 en Montevideo no debe desplazarse de día al convertir.

### 4.4 Imágenes

La v1 guarda imágenes en Base64 dentro de `localStorage` (bug documentado: agota la cuota y falla
en silencio). En v2 van a **Supabase Storage**, con:

- Redimensionado y compresión en el cliente antes de subir (máximo ~1200 px, WebP).
- Carpeta por negocio: `stores/{store_id}/products/...`.
- La app guarda solo la URL en la base.

### 4.5 Lo que se conserva de la v1

- **El motor de conversión y costeo**, reescrito en TypeScript como funciones puras
  (`convertirCantidad`, `costearReceta`) con **tests unitarios**. Es el activo más valioso del
  proyecto y no depende del framework.
- **Las unidades soportadas** (g, kg, ml, cl, l, unidad, paquete).

Lo que **no** se conserva: el almacenamiento en `localStorage`, el `innerHTML` con datos de usuario,
el modelo de datos basado en arrays y los `alert()` como única validación.

### 4.6 Hosting con repositorio privado

GitHub Pages exige que el repositorio sea **público**, y eso no sirve: el código de un producto que se
vende es la parte que menos se quiere exponer.

| Opción                             | Repo privado en plan gratuito | Notas                                                                                                         |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages** (recomendada) | Sí                            | Sin límite de ancho de banda, se conecta al repo por GitHub, certificado automático, despliegue en cada push. |
| Netlify                            | Sí                            | Límite de 100 GB/mes de ancho de banda.                                                                       |
| Vercel                             | Sí                            | Suficiente, pero con límites más estrictos en el plan gratuito.                                               |

Se adopta **Cloudflare Pages**. Con esto el repositorio puede ser privado desde el primer día.

> Importante: con el código privado hay que corregir la URL del sitio y usar el dominio propio. El
> dominio comprado (unos 10 USD al año) se conecta al proyecto de Cloudflare cuando exista.

### 4.7 Un proyecto de Supabase por cliente

Es la decisión que hace posible cobrar una cuota mensual. Se creó la aplicación para vender el
**mantimiento**, no el código.

| Modelo                                    | Cómo funciona                                                              | Ventaja                                                                                                                | Problema                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Un proyecto por cliente** (recomendado) | Cada negocio que paga tiene su propio proyecto de Supabase y su propia URL | Aislamiento total, se le puede entregar o revender, se puede suspender o borrar sin tocar los demás, migrar es trivial | Hay que actualizar el proyecto cuando sale una versión nueva                              |
| **Un proyecto compartido** con `store_id` | Todos los clientes en una sola base                                        | Más simple de actualizar                                                                                               | Una RLS mal escrita filtra datos entre clientes; no se puede dar de baja a uno sin riesgo |

**Modelo comercial resultante:**

1. El desarrollo ocurre en un proyecto de **desarrollo**, en plan gratuito.
2. Cuando un cliente contrata, se crea un **proyecto de Supabase nuevo** para su negocio, en plan
   Pro (25 USD/mes), y se le entrega el acceso.
3. La cuota que se le cobra al cliente **cubre ese plan** más el mantenimiento y las mejoras.
4. El cliente es dueño de sus datos: puede exportar todo en CSV o JSON cuando quiera.

Un solo proyecto Pro alcanza para dar de alta varios negocios: Supabase no cobra por usuario de la
base, sino por proyecto. Con 3 o 4 clientes el costo real del servicio es de unos 25 a 100 USD por
mes, y el resto es tu trabajo.

### 4.8 Costos reales de operación

Con los precios públicos de Supabase (verificado en su página de precios):

| Concepto                  | Plan gratuito       | Plan Pro                    |
| ------------------------- | ------------------- | --------------------------- |
| Precio                    | **0 USD**           | **25 USD/mes por proyecto** |
| Tamaño de base            | 500 MB              | 8 GB (luego 0,125 USD/GB)   |
| Archivos                  | 1 GB                | 100 GB                      |
| Usuarios activos          | 50.000              | 100.000                     |
| Salida de datos           | 5 GB/mes            | 250 GB/mes                  |
| Backups                   | No                  | Diarios, 7 días             |
| **Pausa por inactividad** | **Sí, a la semana** | No                          |

**Advertencia operativa:** los proyectos gratuitos **se pausan a la semana de inactividad**. Mientras
se desarrolla no molesta (se activa con un clic). Pero en cuanto un cliente real use el servicio, su
proyecto tiene que estar en plan Pro, porque si se pausa un negocio pierde el acceso a sus datos.

**Presupuesto del proyecto:**

| Fase                     | Costo                                                      |
| ------------------------ | ---------------------------------------------------------- |
| Desarrollo (Fases 0 a 5) | **0 USD**                                                  |
| Primer cliente           | 25 USD/mes (el plan Pro de su proyecto)                    |
| Hosting del frontend     | **0 USD** (Cloudflare Pages)                               |
| Dominio propio           | ~10 USD/año (opcional, se puede usar el subdominio gratis) |

Es decir: **se puede construir y operar el primer cliente sin gastar un peso**, y recién cuando
aparezcan ingresos se paga la infraestructura del cliente, no la del desarrollo.

### 4.9 Restricción del equipo de desarrollo

La máquina de desarrollo tiene un **Intel Atom N450 (2010)**, sin instrucciones modernas de CPU. Hay
consecuencias concretas y ya verificadas:

| Herramienta                     | Estado                                 | Acción                                                                                                                                            |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase CLI**                | No arranca (`Illegal instruction`)     | **No se usa.** Las migraciones se aplican desde el editor SQL del panel web. Los archivos `.sql` se versionan en el repo para tener el historial. |
| **Node 20, npm, esbuild, Vite** | Funcionan (esbuild 0.28.2, Vite 6.4.3) | Verificado con un build de producción real.                                                                                                       |
| **Tailwind 3.4**                | Funciona                               | Se eligió la versión 3 porque la 4 depende de un binario nativo (lightningcss) que puede no arrancar en esta CPU.                                 |
| **Tests (Vitest)**              | Funcionan                              | 48 tests en unos 90 segundos.                                                                                                                     |

Tiempos reales de esta máquina, medidos en la Fase 0: `npm install` unos 5 minutos, la suite de
tests unos 90 segundos, `svelte-check` unos 2 minutos y el build de producción 1 minuto 41 segundos.
Es lento pero perfectamente utilizable. Si se vuelve un cuello de botella, la alternativa es ejecutar
el build en la nube y usar esta máquina solo para editar.

Regla derivada: **preferir herramientas que corran en Node puro** (Vitest, Playwright) y evitar
binarios nativos modernos. El build de producción ocurre igual en la nube (Cloudflare), así que el
equipo local solo necesita para desarrollo y tests.

---

## 5. Modelo de datos propuesto

Borrador inicial. Los nombres en `snake_case` para Postgres.

### Identidad y cuentas

| Tabla           | Campos                                                           | Notas                                                           |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `stores`        | `id`, `name`, `slug`, `currency` (UYU), `plan`, `created_at`     | El negocio cliente. Unidad de aislamiento.                      |
| `users`         | `id` (de Supabase Auth), `email`, `full_name`, `created_at`      | La persona.                                                     |
| `store_members` | `store_id`, `user_id`, `role` (`owner` \| `staff`), `created_at` | Une persona y negocio. Un dueño puede estar en varios negocios. |

> Roles: el dueño ve facturación y configuración; el empleado ve y opera pero no borra ni gestiona
> usuarios. Es la primera línea de permisos.

### Catálogo

| Tabla          | Campos                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `categories`   | `id`, `store_id`, `name`, `kind` (`product` \| `ingredient`)                                                      |
| `units`        | `code`, `name`, `kind` (`weight` \| `volume` \| `count`), `factor`                                                | Catálogo global de unidades, no por negocio. |
| `ingredients`  | `id`, `store_id`, `name`, `unit_id`, `purchase_unit`, `purchase_size`, `current_cost`, `supplier_id`, `is_active` |
| `recipes`      | `id`, `store_id`, `product_id`                                                                                    |                                              |
| `recipe_items` | `id`, `recipe_id`, `ingredient_id`, `quantity`, `unit_id`                                                         |
| `products`     | `id`, `store_id`, `name`, `description`, `category_id`, `price`, `cost`, `margin_pct`, `is_active`                |
| `suppliers`    | `id`, `store_id`, `name`, `contact`, `notes`                                                                      |

### Comercial

| Tabla         | Campos                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `customers`   | `id`, `store_id`, `name`, `phone`, `email`, `address`, `notes`                                                                |
| `orders`      | `id`, `store_id`, `customer_id`, `status`, `order_date`, `delivery_date`, `delivery_time`, `payment_status`, `total`, `notes` |
| `order_items` | `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `cost_snapshot`, `subtotal`                                         |
| `deliveries`  | `id`, `store_id`, `order_id`, `address`, `scheduled_at`, `status`, `delivered_at`                                             |

### Compras

| Tabla            | Campos                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| `purchases`      | `id`, `store_id`, `supplier_id`, `purchased_at`, `total`, `notes`                 |
| `purchase_items` | `id`, `purchase_id`, `ingredient_id`, `quantity`, `unit_id`, `unit_cost`, `total` |

### Decisiones de modelado importantes

1. **`cost` y `cost_snapshot` conviven a propósito.** El costo actual del producto se recalcula
   desde el inventario; el costo que se cobró en una orden histórica queda congelado en
   `order_items.cost_snapshot`. Un pedido de hace 6 meses debe seguir cuadrando.
2. **Las compras actualizan `ingredients.current_cost`.** Al cargar una compra, los ingredientes
   afectados cambian de costo y, en cascada, cambian el costo de los productos que los usan. Eso
   resuelve de raíz el bug 9.2 de la v1 (costos congelados sin aviso).
3. **Nada de claves por nombre.** Todo es `id`. Resuelve el bug 9.3.
4. **Borrado lógico** (`is_active`, `deleted_at`) en lugar de borrado físico, para no romper el
   historial de pedidos y compras.
5. **`store_id` en todas las tablas**, para que la RLS sea una regla única y simple.

---

## 6. Hoja de ruta por fases

Cada fase termina con algo **usable de punta a punta**, nunca con infraestructura a medias.

### Fase 0 · Cimientos y decisiones

- Arranque del proyecto con Vite, TypeScript, Tailwind, ESLint y Prettier.
- Migración del motor de conversión de la v1 a TypeScript, con **tests unitarios** de
  `convertirCantidad`, `obtenerTipoUnidad` y las ramas de costeo.
- Sistema de diseño: tokens de color, tipografía, espaciado, componentes base (botón, input,
  select, modal, toast, tabla, tarjeta).

**Listo cuando:** `npm test` pasa y hay 3 pantallas navegando con la paleta nueva.

### Fase 1 · Diseño y navegación (mobile first)

- Layout responsive real: navegación inferior en móvil, sidebar en escritorio.
- Sistema de componentes completo: tablas con scroll y filtros, formularios con validación
  inline, estados vacíos, loaders, toasts.
- Tema claro/oscuro.
- Accesibilidad: navegación por teclado, foco visible, contraste AA, `aria-label` en botones de
  icono.

**Listo cuando:** la app se recorre entera desde el celular sin scroll horizontal ni elementos
rotos.

### Fase 2 · Cuentas y negocios (el bloque que habilita la venta)

- Supabase Auth: registro con email y contraseña, recuperación de contraseña, verificación de
  email.
- Onboarding: crear el negocio, elegir nombre, unidad monetaria y país.
- Invitar empleados con rol, quitar acceso.
- RLS activa y probada: cada `store_id` isolated. **Test explícito de aislamiento** en CI.
- Migración de datos: si alguien usó la v1, importar su `localStorage` (exportar JSON desde la v1).

**Listo cuando:** dos negocios en la misma base no pueden ver nada del otro, verificado con test.

### Fase 3 · Inventario y costos reales (el núcleo, ya corregido)

- CRUD de ingredientes con unidades, compras y proveedores.
- CRUD de productos con recetas, costeo automático y precio por margen o precio fijo.
- Al cargar una compra, recálculo en cascada de los costos afectados, con aviso de qué productos
  cambiaron y cuánto.
- Historial de costos por ingrediente.

**Listo cuando:** se puede llevar la operación real de un local durante una semana.

### Fase 4 · Clientes y pedidos

- CRUD de clientes con búsqueda y duplicados detectados.
- Pedidos con líneas, estados, forma de pago, saldo y notas.
- Cambio de estado con validación de la transición (no todo orden de estados es válido).
- Resumen del día: cuánto facturar, cuántos pedidos, qué falta entregar.

**Listo cuando:** un pedido completo se crea, se cobra y se entrega en menos de un minuto.

### Fase 5 · Agenda y entregas

- Calendario con vistas día / semana / mes, navegable con el dedo.
- Cada pedido aparece en su fecha de producción y de entrega.
- Vista de carga por día para detectar saturación.
- Vista de "para hoy": qué hay que producir y qué hay que entregar.
- Reparto: asignación de pedido a repartidor y seguimiento de ruta (fase 5.1).

**Listo cuando:** el dueño puede abrir la app por la mañana y saber exactamente qué hacer.

### Fase 6 · Salir a vender

- Landing page y registro público (self service).
- Plan gratuito limitado (1 negocio, X productos) y plan pago.
- Facturación y cobros (Mercado Pago, el más usado en Uruguay).
- Exportación de datos (CSV/JSON) siempre disponible.
- Onboarding guiado y documentación de usuario.
- Cumplimiento de la **Ley 18.331** de protección de datos personales (Uruguay): aviso de
  privacidad, consentimiento para datos de clientes finales de los locales.

### Fuera de alcance por ahora (para evitar scope creep)

- Facturación electrónica con la DGI.
- Punto de venta (POS) y lector de códigos.
- Impresión de etiquetas y comanda de cocina.
- Nóminas de payroll.
- Contabilidad completa.
- Aplicación nativa (iOS/Android) y modo offline complejo.

---

## 7. Arreglos heredados de la v1

Mapeo entre los problemas documentados en `DOCUMENTACION.md` y dónde se resuelven.

| #         | Problema                                         | Se resuelve en                              |
| --------- | ------------------------------------------------ | ------------------------------------------- |
| 9.1       | Producto con costo manual imposible de guardar   | Fase 0 (modelo de datos nuevo)              |
| 9.2       | Editar un ingrediente no recalcula los productos | **Fase 3** (compras + recálculo en cascada) |
| 9.3       | Nombre del ingrediente como identidad            | Fase 0 (`id` en todo)                       |
| 9.4       | Caso 2 del cálculo da números absurdos           | Fase 0 (motor reescrito + tests)            |
| 9.5       | `QuotaExceededError` sin manejar                 | Fase 2 (Supabase Storage)                   |
| 9.6       | `JSON.parse` sin `try/catch`                     | Fase 0 (nunca más localStorage)             |
| 9.7       | Total calculado por dos caminos                  | Fase 0 (funciones puras)                    |
| 9.8       | Fila del inventario con celda de más             | Fase 1 (componente de tabla)                |
| 9.9       | Edición con precio y porcentaje a la vez         | Fase 1 (componente de formulario)           |
| 9.10      | `innerHTML` sin sanitizar                        | Fase 0 (Svelte escapa por defecto)          |
| 9.11      | `id` por timestamp                               | Fase 0 (UUID)                               |
| 9.12      | `actualizarOpcionesUnidad` duplicada             | Fase 0 (una función)                        |
| 9.13      | Variable `gananciaTotal` muerta                  | Fase 0                                      |
| 9.14      | Sombreado de `total`                             | Fase 0 (TypeScript lo marca)                |
| 9.15      | Sin modo edición visible ni cancelar             | Fase 1                                      |
| 9.16-9.19 | CSS duplicado, título, `index.zip`               | Fase 0 y 1                                  |
| 9.20      | Anchos que no coinciden                          | Fase 1 (sistema de diseño)                  |

---

## 8. Riesgos y mitigaciones

| Riesgo                                                  | Probabilidad | Impacto      | Mitigación                                                                                          |
| ------------------------------------------------------- | ------------ | ------------ | --------------------------------------------------------------------------------------------------- |
| **Fuga de datos entre negocios** (RLS mal aplicada)     | Media        | Catastrófico | RLS como regla única por `store_id`, tests de aislamiento en CI, revisar cada tabla nueva.          |
| Cuota / costo de Supabase con muchos clientes           | Media        | Medio        | Empezar con planes con límites claros, medir antes de crecer, exportable siempre.                   |
| Imágenes sin optimizar                                  | Alta         | Medio        | Compresión en cliente antes de subir.                                                               |
| Scope creep (todo a la vez)                             | Alta         | Alto         | Una fase a la vez, cada una usable de punta a punta.                                                |
| Que nadie pague                                         | Media        | Alto         | Validar con 2 o 3 locales piloto antes de la Fase 6. Un piloto real vale más que cualquier feature. |
| Datos del cliente atados a nuestra plataforma           | Media        | Alto         | Exportación en un clic, sin condiciones, en formato abierto.                                        |
| Rewrites excesivos                                      | Media        | Medio        | Un solo rewrite grande (Fase 0), después solo incremental.                                          |
| Ley 18.331 (datos personales de los clientes del local) | Media        | Medio        | Aviso de privacidad, consentimiento, derecho de supresión.                                          |
| Dependencia de un solo proveedor                        | Baja         | Alto         | Postgres estándar, exportación a CSV/JSON: se puede ir a otro proveedor.                            |

---

## 9. Decisiones pendientes

Temas a cerrar antes de arrancar la Fase 0.

1. ~~**¿Supabase o Firebase?**~~ **Resuelto: Supabase**, confirmado por el usuario (ver 4.2 y
   registro de decisiones D01). Proyecto creado en la Fase 0.
2. **¿Nombre comercial y dominio?** Importa desde ya, porque define las URLs, el correo de
   recuperación de contraseña y el texto legal.
3. **¿Precio de la cuota mensual?** Define los límites del plan gratuito. Ya está definido el modelo
   (4.7): un proyecto Pro por cliente. Falta el monto.
4. **¿Pilotos?** ¿Hay 2 o 3 locales conocidos que puedan probar la Fase 3? Si sí, se testean antes
   de seguir construyendo.
5. **¿Moneda y país configurables o fijos en UYU?** Hoy está fijo. Recomiendo moneda configurable
   desde la configuración del negocio, con UYU por defecto.
6. **¿Nombre del producto en el código?** El paquete, el repositorio y las variables de entorno
   deberían llevar un nombre estable, distinto del nombre del negocio.
7. **¿Cloudflare Pages?** Resuelto por rendimiento de opción (4.6). Pendiente solo crear la cuenta
   al momento del despliegue.

---

## 10. Cómo trabajaremos

- **Un fase a la vez.** No se mezclan fases en un mismo commit.
- **Commits chicos y explicables**, con mensajes que expliquen el porqué, no el qué.
- **IA_GUIDE.md es la bitácora**: cada tarea que se pide queda registrada con el prompt textual
  original, las decisiones tomadas y la lista de altas, bajas y cambios.
- **Tests desde la Fase 0** para todo lo que calcule dinero. Sin excepciones.
- **Nada se mergea roto:** cada commit deja la app en un estado usable.
