# IA GUIDE

Bitácora del proyecto. Registra **qué se pidió, con qué palabras textuales**, **cómo se resolvió** y
**qué se agregó, quitó o cambió** en cada tarea.

Este archivo es el historical de decisiones. Cuando en el futuro alguien (o una IA) retome el
proyecto, este documento responde: qué pidió el usuario, con qué criterio se implementó y qué se
descartó y por qué.

- Visión y arquitectura: [ROADMAP.md](ROADMAP.md)
- Análisis técnico de la base heredada: [DOCUMENTACION.md](DOCUMENTACION.md)

**Cómo se usa:** cada tarea nueva se agrega al final con su prompt textual original entre comillas,
sin reescribir ni corregir. Después de completar la tarea se completan las secciones de estado,
decisiones y cambios.

---

## Índice de tareas

| # | Tarea | Estado |
|---|---|---|
| [T00](#t00-documentacion-de-la-v1) | Documentación de la v1 | Completada |
| [T01](#t01-commit-y-push-de-la-documentación) | Commit y push de la documentación | Completada |
| [T02](#t02-migración-a-presupuesto-v2) | Migración del repo a Presupuesto-v2 | Completada |
| [T03](#t03-plan-de-producto-v2) | Plan de producto v2 (visión, roadmap, este registro) | Completada |
| [T03c](#t03c--confirmación-del-stack-y-modelo-de-cobro) | Confirmación de stack, costos reales y modelo de cobro | Completada |
| [T04](#t04-fase-0--cimientos) | Fase 0: cimientos del proyecto | Completada |
| [T04b](#t04b--base-de-datos-en-supabase-y-fase-1-inicio) | Base de datos aplicada y verificada, inicio de Fase 1 | Completada |
| [T05](#t05-fase-1--diseño-y-navegación) | Fase 1: diseño y navegación | En curso |
| [T06](#t06-fase-2--cuentas-y-negocios) | Fase 2: cuentas y negocios | Pendiente |
| [T07](#t07-fase-3--inventario-y-costos) | Fase 3: inventario y costos reales | Pendiente |
| [T08](#t08-fase-4--clientes-y-pedidos) | Fase 4: clientes y pedidos | Pendiente |
| [T09](#t09-fase-5--agenda-y-entregas) | Fase 5: agenda y entregas | Pendiente |

---

## T00 · Documentación de la v1

### Prompt textual

> "Hola buen dia! Podrías entrar a mi repo Proyecto-fer en documentos, analizar el proyecto en
> profundidad para entenderlo a la perfección y documentarlo bien? Tanto su funcionamiento como todo
> lo que se pueda en sí"

### Estado

Completada.

### Qué se hizo

Lectura completa de `index.html`, `css/style.css` y `js/script.js` (971 líneas en total) y redacción
de dos documentos:

- `README.md`: qué hace la app, flujo de uso, cómo ejecutarla, estructura, unidades soportadas,
  fórmulas de negocio y limitaciones.
- `DOCUMENTACION.md`: arquitectura, modelo de datos, persistencia, motor de conversión de unidades,
  motor de costeo con sus 3 casos, ciclo de vida de la interfaz, catálogo de funciones con líneas,
  20 problemas detectados priorizados, deuda técnica y propuestas de mejora.

### Hallazgos que condicionaron el proyecto v2

| # | Hallazgo | Consecuencia para la v2 |
|---|---|---|
| 1 | El costo del producto se sobreescribe con el total de ingredientes, y la validación exige `costo > 0`: **un producto con costo manual es imposible de guardar**. | Requiere distinguir costo calculado de costo manual. |
| 2 | Editar o borrar un ingrediente **no recalcula** los productos ya guardados: costo, ganancia y margen quedan congelados con valores falsos. | Es el bug más peligroso: muestra una ganancia que ya no existe. |
| 3 | El **nombre** del ingrediente es su identidad: dos insumos con el mismo nombre colisionan al editar o borrar. | Todo debe identificarse por `id`. |
| 4 | El "caso 2" del cálculo (usar un insumo no-paquete como paquete) produce resultados ~3000 veces equivocados sin avisar. | El motor de costeo se reescribe y se testea. |
| 5 | Las imágenes en Base64 dentro de `localStorage` agotan la cuota (~5 MB) y el error se maneja en silencio: **la app dice "guardado" sin haber guardado**. | Las imágenes van a un storage externo. |
| 6 | El total se calcula por dos caminos distintos (leyendo el DOM vs. el modelo de datos). | Una sola fuente de verdad. |
| 7 | `innerHTML` con datos de usuario: nombres maliciosos se ejecutan. | Un framework que escape por defecto. |

---

## T01 · Commit y push de la documentación

### Prompt textual

> "Podrías commitear y pushear estos cambios?"

### Estado

Completada.

### Cambios en el repositorio

- Commit `80d9080` en `Proyecto-Fer` (`master`): agrega `README.md` y `DOCUMENTACION.md`.
- Remote cambiado de HTTPS a SSH (`git@github.com:nicodelos24/Proyecto-Fer.git`) porque el remoto
  HTTPS no tenía credenciales configuradas.

### Notas

- Se usó la URL SSH en el push sin modificar la configuración del remoto primero, y recién después
  se normalizó el remoto a SSH. Queda como convención del proyecto para evitar volver a preguntar
  credenciales.

---

## T02 · Migración a Presupuesto-v2

### Prompt textual

> "Perfecto, ahora todo este repo lo copié a Presupuesto-v2, podemos pasarnos a este repo y me haces
> los commit push? Así ya te planteo la consigna"

### Estado

Completada.

### Cambios en el repositorio

- Nuevo repo `Presupuesto-v2`, rama `main` (la v1 usaba `master`).
- Commit `7658971`: `index.html`, `css/style.css`, `js/script.js`, `README.md`, `DOCUMENTACION.md`.
- Remote configurado por SSH desde el inicio.
- **No se migró `index.zip`**: es una copia empaquetada del sitio publicado y solo genera riesgo de
  desincronización.

### Diferencias con la v1

| Aspecto | v1 | v2 |
|---|---|---|
| Rama | `master` | `main` |
| Artefacto `index.zip` | Sí | **No** (eliminado a propósito) |
| `.gitattributes` | No | Sí, ya venia del repo nuevo |
| Base | Código original | Copia exacta, lista para reconstruir |

---

## T03 · Plan de producto v2

### Prompt textual

> "Bueno, ahora me gustaría poder hacer de este proyecto algo profesional, me gustaría primero que
> nada darle un estilo moderno y sofisticado, priorizando el diseño para móvil y la comodidad, que se
> pueda usar de forma intuitiva, quisiera que el proyecto se pueda hacer de forma modular para poder
> expandirlo e ir implementando cosas tanto visuales como de funcionalidades, mi primer
> implementación que quisiera hacer (además de reparar esos errores que mencionas) Sería la de
> agregar primero que nada un usuario para que cada cuenta tenga sus datos, así poder vender este
> proyecto a varios locales comerciales, quisiera poder tener cosas como un calendario donde agendar
> pedidos y envios, con entradas de mercadería por ejemplo de proveedores, algo así pero necesito
> que me assesores, primero que nada antes de comenzar quisiera que documentes esto que quiero hacer,
> y generes un documento llamado IA_GUIDE donde pegues mis prompts textuales divididos por tareas así
> podemos tener un registro de lo que he querido implementar y cómo lo vamos haciendo, junto a las
> cosas que quitamos agregamos o cambiamos, cuando termines esta documentación inicial comenzamos,
> muchísimas gracias de antemano"

### Estado

Completada.

### Lo que se deduce del pedido

El pedido tiene **cinco** pedidos distintos en uno:

1. Rediseño visual moderno y sofisticado.
2. Mobile first y («comodidad»).
3. Arquitectura modular y expandible.
4. Cuentas de usuario con datos separados por negocio, para vender a varios locales.
5. Calendario de pedidos y envíos, e ingresos de mercadería desde proveedores.

El punto 4 es el que habilita los demás comercialmente, pero también es el más caro de revertir.
Por eso se decidió documentar antes de escribir código.

### Decisiones tomadas en esta etapa

| Decisión | Alternativas descartadas | Motivo |
|---|---|---|
| **Base de datos y autenticación: Supabase** | Firebase, backend propio, seguir con `localStorage` | Es la única opción que da cuentas, aislamiento por negocio, imágenes y backups sin mantener servidores. El costo de cambiar después es altísimo. |
| **Aislamiento por negocio con Row Level Security**, no solo filtrando en el código | Filtrar por `store_id` en cada consulta | Un filtro olvidado en una consulta expone datos de otro cliente. La RLS es la garantía real. |
| **Reescritura de la capa visual y de datos, conservando el motor de costeo** | Arreglar la v1 línea por línea | La v1 no tiene cuentas, ni pedidos, ni compras. Es una reescritura igual; la diferencia es qué código se tira y qué se conserva. |
| **El motor de conversión de unidades se conserva** | Rehacer los cálculos | Es la parte mejor pensada de la v1. Se porta a TypeScript con tests. |
| **Las imágenes pasan a Supabase Storage** | Seguir con Base64 en el navegador | La cuota de `localStorage` rompe la app y falla en silencio. |
| **Modelo de datos relacional con entidades de compras, clientes, pedidos y entregas** | Seguir con arrays de objetos | Sin historial de compras no hay costo real; sin clientes y pedidos no hay calendario. |

### Agregado

- `ROADMAP.md`: visión de producto, principios de diseño, decisiones de arquitectura con
  alternativas descartadas, modelo de datos propuesto, 7 fases con criterio de "listo cuando",
  mapeo de los 20 bugs de la v1 a la fase que los resuelve, riesgos y decisiones pendientes.
- Este archivo, `IA_GUIDE.md`, como bitácora permanente.
- Sección "Cómo trabajaremos": una fase a la vez, commits chicos y explicables, tests obligatorios
  para todo lo que calcula dinero.

### Quitado

- Nada se quitó del código en esta tarea: fue solo documentación. `ROADMAP.md` deja asentado qué
  partes de la v1 no se Migran (`localStorage`, `innerHTML` sin sanitizar, modelo de arrays).

### Cambiado

- El alcance del proyecto pasó de "una calculadora de costos" a "un sistema de gestión para
  comercios de producción artesanal con cuentas, inventario, compras, pedidos y agenda".
- La secuencia de trabajo pasó de "arreglar la v1" a "reescribir la base conservando el motor de
  cálculo".

### Advertencia registrada

**El orden importa.** El bug más grave de la v1 (costos congelados cuando cambia un insumo) se
resuelve naturalmente cuando existe el concepto de **compra a proveedor**. Por eso la Fase 3
(compra) es parte del núcleo y no una función opcional.

### Decisiones que requieren confirmación del usuario

Quedan abiertas en `ROADMAP.md` sección 9:

1. Proveedor de datos: se recomienda Supabase. **Confirmar antes de escribir código.**
2. Nombre comercial y dominio (define URLs, correos y textos legales).
3. Precio del plan pago y límites del plan gratuito.
4. Si hay locales piloto disponibles para probar antes de seguir construyendo.
5. Moneda fija en UYU o configurable por negocio (hoy está fijo).
6. Nombre estable para el paquete del proyecto, distinto del nombre del negocio.

---

## T03c · Confirmación del stack y modelo de cobro

### Prompts textuales

> "Me podrías explicar que es supabase? Es gratis para implementarlo? Ya que mi problema actual es
> que no tengo dinero para hostear la página, por ahora la hice en github pages"

> "Perfecto, esta idea me encanta porque puedo crear la aplicación y si algún dia algún cliente
> quiere comprar mi servicio puedo activar el plan pro cobrandole alguna cuota mensual para el
> mantenimiento de su página no? Me encantó esa idea, me ayudas con supabase entonces? Me gustaría
> buscar también una opción distinta a github pages ya que el problema es que debo dejar el código
> publico, pero por ahora centrémonos en lo que falta para comenzar, decime qué hago con lo de
> supabase asi continuamos, si precise instalar algo hazlo"

### Estado

Completada.

### Respuesta a la duda de fondo

Sí: **se cobra una cuota mensual por mantenimiento**, y el modelo queda así:

1. El desarrollo se hace en un proyecto de Supabase **gratuito**, sin costo.
2. Cuando un cliente contrata, se crea **un proyecto de Supabase nuevo para su negocio**, en plan Pro
   (25 USD/mes), y se le entrega el acceso.
3. La cuota del cliente **cubre ese plan** más el mantenimiento y las mejoras.
4. El cliente es dueño de sus datos y puede exportarlos cuando quiera.

Supabase no cobra por usuario de la base sino por proyecto, así que un solo plan Pro alcanza para
varios negocios. Con 4 o 5 clientes el costo de infraestructura del servicio es de unos 25 a 125 USD
al mes, y el resto es trabajo del desarrollador.

### Alternativa a GitHub Pages

GitHub Pages obliga a que el repositorio sea público. Se eligió **Cloudflare Pages**, que acepta
repositorios privados en plan gratuito y no pone límite de ancho de banda. Así el código del
producto que se vende puede quedar privado desde el primer día.

### Verificación del entorno de desarrollo

Se comprobó la máquina de desarrollo antes de comprometer la stack:

| Herramienta | Resultado |
|---|---|
| Node 20.19.2, npm 9.2.0 | Funcionan |
| esbuild 0.28.2 (motor de Vite) | **Funciona** en esta CPU |
| Supabase CLI | **No arranca**: `Illegal instruction` |
| Docker | No instalado |

El equipo tiene un Intel Atom N450 de 2010, sin instrucciones modernas de CPU. El Supabase CLI está
compilado con instrucciones que ese procesador no soporta, así que **queda descartado** y las
migraciones se aplicarán desde el editor SQL del panel web de Supabase, versionando los archivos
`.sql` en el repositorio. El resto del toolchain (Vite, Svelte, Tailwind, Vitest) funciona con
normalidad, y el build de producción ocurre igual en la nube.

### Agregado

- `ROADMAP.md` 4.6: hosting con repositorio privado.
- `ROADMAP.md` 4.7: modelo de un proyecto de Supabase por cliente y modelo comercial.
- `ROADMAP.md` 4.8: costos reales de operación, con los precios públicos verificados.
- `ROADMAP.md` 4.9: restricciones del equipo de desarrollo y qué herramientas evitar.
- Tabla de decisiones D08 a D12.

### Cambiado

- La decisión de datos dejó de ser recomendación y pasó a estar **confirmada**.
- El despliegue dejó de ser GitHub Pages y pasó a Cloudflare Pages.
- La lista de decisiones pendientes se redujo: las de proveedor de datos y de hosting quedan
  resueltas.

### Advertencia registrada

Los proyectos gratuitos de Supabase **se pausan a la semana de inactividad**. Mientras se desarrolla
no molesta, pero un cliente real necesita su proyecto en plan Pro o arriesga perder el acceso.

---

## T04 · Fase 0: cimientos

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

- Proyecto con Vite, TypeScript, Tailwind, ESLint y Prettier.
- Motor de conversión y costeo portado a TypeScript, con tests unitarios.
- Sistema de diseño: tokens y componentes base.
- Estructura de carpetas modular.

### Criterio de cierre

`npm test` pasa, hay 3 pantallas navegables con la paleta nueva, y el motor de costeo delega
ningún cálculo al DOM.

---

## T04 · Fase 0: cimientos

### Prompt textual

> "Perfecto, ahora todo este repo lo copié a Presupuesto-v2, podemos pasarnos a este repo y me haces
> los commit push? Así ya te planteo la consigna"

Seguido de la confirmación de stack:

> "Perfecto, esta idea me encanta porque puedo crear la aplicación y si algún dia algún cliente
> quiere comprar mi servicio puedo activar el plan pro cobrandole alguna cuota mensual para el
> mantenimiento de su página no? Me encantó esa idea, me ayudas con supabase entonces? Me gustaría
> buscar también una opción distinta a github pages ya que el problema es que debo dejar el código
> publico, pero por ahora centrémonos en lo que falta para comenzar, decime qué hago con lo de
> supabase asi continuamos, si precise instalar algo hazlo"

Y las consultas durante la configuración:

> "pongo enable data api y automatically expose new tablets que vienen marcadas por defecto? También
> hay una opcion sin marcar que dice enable automatic RLS"

### Estado

Completada.

### Trabajo realizado

1. **Proyecto base**: Vite 6 + Svelte 5 + TypeScript estricto + Tailwind 3.4 + Vitest.
2. **Codigo de la v1 movido a `legacy/`** para conservarlo como referencia sin que estorbe el
   desarrollo nuevo.
3. **Motor de costeo reescrito** en TypeScript (`src/lib/costing.ts` y `src/lib/unidades.ts`) como
   funciones puras, sin DOM y sin dependencias.
4. **48 tests unitarios** que cubren conversiones, prorrateo de paquetes, margen y redondeo.
5. **Migracion SQL inicial** (`supabase/migrations/0001_esquema_inicial.sql`) con 14 tablas, indices,
   funciones de apoyo y 18 politicas de Row Level Security.
6. **Shell de la aplicacion** con el sistema de diseno aplicado y una pantalla que muestra el estado
   de la conexion y un ejemplo de costeo real.

### Bugs corregidos en el motor (cubiertos por tests)

| Bug heredado | Correccion |
|---|---|
| Producto con costo manual imposible de guardar | `costoDeProducto` acepta `costoManual` y lo respeta sin invalidar los errores de la receta |
| Pedir paquetes de un insumo simple daba un costo miles de veces menor | Devuelve el error `paquete-sobre-ingrediente-simple` en vez de un numero falso |
| Costos congelados sin recalcular | El costo se calcula siempre desde el inventario, nunca queda guardado en el producto |
| Ingredientes identificados por nombre | Todo se identifica por `id` |
| Mezclar peso y volumen en silencio | `convertirCantidad` devuelve `null` y el costeo marca `unidad-incompatible` |
| Paquetes prorroteados con la unidad equivocada | El precio por unidad base se calcula sobre el contenido real del paquete |

### Dos bugs encontrados por los tests durante esta fase

| Bug | Sintoma | Causa |
|---|---|---|
| Prorrateo de paquetes | 4 paquetes de 500 g por $900, receta de 250 g daba $28,125 en vez de $112,50 | Se dividia el precio del lote por la cantidad de paquetes y despues se prorroteaba |
| Test con unidades mezcladas | Un test pedia 2 unidades a un paquete cuyo contenido estaba en gramos | El test mezclaba tipos de unidad; se reescribio con dos casos correctos |

El primero es exactamente el tipo de error que la v1 hacia en silencio. Ahora lo detecta el test.

### Verificaciones

| Verificacion | Resultado |
|---|---|
| Tests | 48 pasan |
| Typecheck (`svelte-check`) | 0 errores, 0 avisos |
| Build de produccion | Correcto, 74,65 KB gzip de JavaScript |
| Conexion con Supabase | Correcta, responde 200 |

### Agregado

- `src/lib/tipos.ts`, `src/lib/unidades.ts`, `src/lib/costing.ts` y sus tests.
- `src/lib/supabase.ts` con el cliente y deteccion de configuracion faltante.
- `supabase/migrations/0001_esquema_inicial.sql`.
- `.gitignore` que protege `.env`, `node_modules` y `dist`.
- `.env.example` con las variables documentadas.

### Cambiado

- El codigo de la v1 dejo de estar en la raiz y paso a `legacy/`.
- La configuracion de tests se separo de la de Vite (`vitest.config.ts`) porque Vitest trae su
  propia copia de Vite y los tipos chocaban.
- Se eligio Tailwind 3.4 en lugar de la version 4: la 4 depende de un binario nativo que puede no
  funcionar en la CPU de la maquina de desarrollo. Se podra migrar cuando el equipo se actualice.

### Notas de la configuracion de Supabase

- Las tres opciones del asistente quedaron marcadas: Data API, exponer tablas nuevas automaticamente y
  RLS automatica. La tercera instala un trigger que activa la RLS en cada tabla nueva, de modo que
  falla hacia el cerrado en vez de dejar la tabla abierta.
- La migracion ademas hace `revoke` de los permisos de `anon`, porque la aplicacion exige cuenta y no
  necesita acceso sin iniciar sesion.
- La clave publicada (`sb_publishable_...`) vive en `.env`, que esta en `.gitignore`. Nunca se sube.

### Limitacion detectada en Supabase

El envio de correos de confirmacion esta habilitado, pero el plan gratuito tiene un SMTP integrado
muy limitado. Cuando se implemente el registro de usuarios habra que configurar un SMTP propio
(Resend, Brevo o similar, con dominio propio) para que los correos lleguen a clientes reales.

---

## T04b · Base de datos en Supabase y Fase 1 (inicio)

### Prompt textual

> "Me dice Succes. No rows returned"

> "borro lo que habia puesto y pongo esto que me dices ahora?"

> "borre todo y puse lo que me dijiste, al poner run me sale ua tabla que dice anon_ve_negocios false
> anon_inserta_productos false anon_ve_clientes false pero no veo esos numeros que decis, que es eso de
> anon?"

> "Ah muchas gracias por aclararme y por toda la ayuda, no se qué haría sin vos :D me salió tablas 14
> con_rls 14 politicas 17 unidades_cargadas 7"

### Estado

Completada.

### Migracion aplicada y verificada

El usuario aplico `0001_esquema_inicial.sql` desde el editor SQL del panel (el Supabase CLI no funciona
en la maquina). La verificacion con `supabase/verificar.sql` dio exactamente lo esperado:

| Verificacion | Resultado | Interpretacion |
|---|---|---|
| Tablas | 14 | Esquema completo |
| Tablas con RLS | 14 | Todas protegidas |
| Politicas | 17 | Aislamiento por negocio aplicado |
| Unidades cargadas | 7 | Catalogo global poblado |
| `anon` puede ver negocios | false | Visitantes sin cuenta no leen datos |
| `anon` puede insertar productos | false | No pueden escribir nada |
| `anon` puede ver clientes | false | Datos personales de clientes protegidos |
| Funciones de apoyo | 3, todas `security_definer` | La pertenencia a un negocio no se puede falsear |

### Lo que se le explico al usuario

- Que es el rol `anon`: el rol de Postgres que usa toda peticion que no tiene sesion iniciada, que
  incluye la propia aplicacion web. Como la clave publicada va incrustada en el codigo y es publica,
  este chequeo determina que puede hacer alguien que copie esa clave sin ser cliente.
- Que el editor de Supabase muestra solo el resultado de la ultima consulta cuando se mandan varias
  juntas, por eso era preferible correrlas de a una.

### Fase 1 (inicio): sistema de diseño y navegación

Construido el esqueleto mobile first con navegacion inferior en movil y barra lateral en escritorio:

| Archivo | Contenido |
|---|---|
| `src/lib/rutas.ts` | Rutas tipadas y resolucion por hash, sin libreria de enrutado |
| `src/layouts/MarcoApp.svelte` | Marco con navegacion adaptativa y area segura inferior |
| `src/components/Boton.svelte` | Boton con variantes primario, secundario, fantasma y peligro |
| `src/components/Campo.svelte` | Campo de formulario con etiqueta, error y descripcion |
| `src/components/Tarjeta.svelte` | Contenedor de contenido |
| `src/components/EstadoVacio.svelte` | Estado vacio con icono, texto y accion |
| `src/pages/*.svelte` | Inicio, Pedidos, Agenda, Inventario y Mas |

El sistema de diseno vive en `src/app.css` y `tailwind.config.js`: paleta propia, tipografia,
espaciado de 44 px para el tacto, sombras y componentes declarativos (`.boton`, `.campo`,
`.tarjeta`, `.error-campo`).

### Verificaciones

| Verificacion | Resultado |
|---|---|
| Tests | 48 pasan |
| Typecheck | 0 errores, 0 avisos |
| Build | Correcto, 85,85 KB gzip |

### Errores propios corregidos durante la fase

| Error | Causa |
|---|---|
| `tipo`, `nombre`, `requerido` no existen como atributos | Properties del componente con nombre en espanol proyectadas sobre atributos HTML en ingles |
| `bind:value` sin variable `value` | El componente usa `valor` con `$bindable`, habia que enlazar explicitamente |
| `await` en el `<script>` del componente | Svelte 5 no permite espera en el nivel superior del componente; se movio a `onMount` |

### Agregado

- `supabase/verificar.sql`, consultable y reutilizable en cualquier momento.
- El sistema de diseno completo y las cinco pantallas base.

### Nota sobre el tamano del bundle

El bundle paso de 74 KB a 86 KB gzip por sumar la navegacion, los iconos de Lucide y las pantallas.
El costo viene casi entero de la libreria de iconos. Cuando se sepa que iconos se usan de verdad,
conviene importar solo esos y no el paquete completo.

---

## T05 · Fase 1: diseño y navegación

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

Layout mobile first, navegación inferior en móvil y sidebar en escritorio, componentes completos,
tema claro y oscuro, estados vacíos y accesibilidad.

---

## T06 · Fase 2: cuentas y negocios

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

Registro e inicio de sesión, recuperación de contraseña, onboarding del negocio, invitación de
empleados, Row Level Security probada e importación de datos desde la v1.

---

## T07 · Fase 3: inventario y costos

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

Ingredientes, proveedores, compras con varias líneas, recálculo en cascada de costos y márgenes,
recetas, productos e historial de costos.

---

## T08 · Fase 4: clientes y pedidos

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

Cartera de clientes, pedidos con líneas y estados, formas de pago, saldos y resumen del día.

---

## T09 · Fase 5: agenda y entregas

### Prompt textual

> _pendiente_

### Estado

Pendiente.

### Alcance previsto

Calendario con vistas día/semana/mes, pedidos en sus fechas de producción y entrega, vista de carga
por día, "para hoy" y reparto.

---

## Registro de decisiones técnicas

Tabla maestra. Si una decisión cambia, se agrega una fila nueva en lugar de reescribir la anterior.

| # | Decisión | Fecha | Motivo | Reversible |
|---|---|---|---|---|
| D01 | Supabase como base de datos y autenticación | T03 | Cuentas multi negocio, RLS, imágenes, sin servidores propios | No (migrar de proveedor es un proyecto) |
| D02 | Aislamiento por negocio con Row Level Security | T03 | Garantía real de que un local no ve datos de otro | No (es el modelo de seguridad) |
| D03 | Reescritura de la capa visual conservando el motor de costeo | T03 | La v1 no soporta cuentas ni pedidos; el motor de cálculo sí vale | Parcialmente |
| D04 | Imágenes en Supabase Storage, no en `localStorage` | T03 | La cuota del navegador rompe la app en silencio | Sí |
| D05 | Identificadores por `id`, nunca por nombre | T03 | Los nombres colisionan y rompen ediciones y borrados | No |
| D06 | Costo actual calculado vs. costo histórico congelado | T03 | Un pedido viejo debe seguir cuadrando aunque cambien los costos | No (es el modelo de datos) |
| D07 | Identificadores de fecha locales, no UTC | T03 | Un pedido del viernes no debe saltar de día al convertir | Sí |
| D08 | **Supabase confirmado por el usuario** | T03c | El usuario confirmo que puede con el plan gratuito y que no tiene presupuesto de hosting propio | No |
| D09 | **Cloudflare Pages** en lugar de GitHub Pages | T03c | GitHub Pages obliga a publicar el código; Cloudflare permite repositorio privado en plan gratuito y sin límite de ancho de banda | Sí (cambiar de hosting es una variable de entorno) |
| D10 | **Un proyecto de Supabase por cliente** | T03c | Permite cobrar la cuota mensual, aislar datos y dar de baja un cliente sin riesgo | No una vez que haya clientes |
| D11 | **No usar el Supabase CLI** | T03c | El binario no arranca en la CPU de la máquina de desarrollo (Intel Atom N450). Las migraciones se aplican desde el editor SQL del panel web | Sí |
| D12 | Deploy en plan Pro recién cuando hay cliente | T03c | Los proyectos gratuitos se pausan a la semana de inactividad; mientras se desarrolla no molesta | Sí |
| D13 | **Tailwind 3.4 en lugar de 4** | T04 | La version 4 depende de un binario nativo (lightningcss) que puede no arrancar en la CPU de la maquina de desarrollo | Sí |
| D14 | Codigo de la v1 conservado en `legacy/` | T04 | Sirve de referencia para comparar y no estorba el desarrollo nuevo | Sí |
| D15 | Configuracion de tests separada de la de Vite | T04 | Vitest arrastra su propia copia de Vite y los tipos de plugins chocaban | Sí |
| D16 | Las tres opciones del asistente de Supabase marcadas | T04 | La RLS automatica evita que una tabla nueva quede abierta por olvido | Sí |
| D17 | Navegacion por hash propia, sin libreria de enrutado | T04b | Cinco rutas no justifican una dependencia; ademas mantiene el bundle chico | Sí |
| D18 | Componentes con propiedades en espanol y atributos HTML en ingles | T04b | Evita las colisiones entre el nombre de la property y el del atributo real | No (es convencion del proyecto) |
