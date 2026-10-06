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

**Sobre la numeración:** las entradas con `T` son tareas realmente ejecutadas y conservan el prompt
textual del usuario. Las entradas con `F` son fases planificadas que todavía no se empezaron, y por
eso no tienen prompt. Cuando una fase `F` se empiece a trabajar, se agrega su entrada `T` con el
prompt del usuario y la `F` queda solo como registro del alcance que se había fijado.

**Sobre `Usuario-revisiones.txt`:** es el archivo del usuario para anotar cosas que quiere corregir,
implementar o quitar, en cualquier momento y sin depender de una sesión. Cada línea arranca con un
símbolo que dice en qué estado está:

| Símbolo | Significado |
|---|---|
| `.` | Quiero implementarlo, o ya lo probé y no funciona |
| `x` | Ya se implementó y el usuario lo corroboró |
| `-` | Hay que quitarlo |
| `+` | Se agregó pero todavía no fue revisado por el usuario |

**Cómo se usa en la práctica:** al empezar una tarea hay que leer ese archivo. Si algo de lo que está
anotado se resuelve, se marca con `x` y se menciona en la entrada correspondiente de este registro.
Si no se tocó, se deja como está. El archivo nunca se reescribe: solo cambian los símbolos.

**Sobre el acceso a GitHub: siempre por SSH.** El remoto de este repositorio es una dirección SSH
(`git@github.com:...`), nunca una HTTPS.

El usuario trabaja en **dos computadoras**: una con Linux y otra con Windows. Con una clave SSH
registrada una sola vez en GitHub, las dos funcionan sin pedir credenciales cada vez. Con HTTPS, Git
pide usuario y contraseña o token en cada máquina y hay que resolverlo cada vez que se cambia.

**Regla para quien trabaje en este proyecto:** no cambiar el remoto a HTTPS, no pedir credenciales, no
sugerir cambiar a token. Si una operación falla por autenticación, es que la clave SSH no está
instalada en esa máquina, y se arregla en la máquina, no en el repositorio.

```
ssh -T git@github.com
```

Si responde `Hi nicodelos24! You've successfully authenticated...`, la clave está bien y no hay que
tocar nada más. Si dice `Permission denied (publickey)`, falta instalarla en esa computadora.

<details>
<summary>Instalar la clave en una máquina nueva</summary>

**Linux y macOS**

```bash
ls ~/.ssh/id_ed25519 2>/dev/null || ssh-keygen -t ed25519 -C "nicodelos24@gmail.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

Copiar la clave que imprime y pegarla en GitHub, en *Settings → SSH and GPG keys → New SSH key*.

**Windows (PowerShell, sin administrador)**

```powershell
if (-not (Test-Path "$env:USERPROFILE\.ssh\id_ed25519")) {
  ssh-keygen -t ed25519 -C "nicodelos24@gmail.com"
}
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

**Nunca copiar el archivo `id_ed25519` entre máquinas.** Solo la clave pública (`.pub`), que es la que
se registra en GitHub. La privada se genera en cada computadora por separado.

</details>

**Si el remoto quedó en HTTPS por error**, se corrige una sola vez y vuelve a quedar bien:

```bash
git remote set-url origin git@github.com:nicodelos24/Presupuesto-v2.git
```

**Aviso al momento de escribir esto:** el remoto del repositorio estaba en
`https://github.com/nicodelos24/Presupuesto-v2.git`, no en SSH como dice la bitácora de `T01`. Se deja
constar acá porque es la clase de cosa que hace perder una tarde: el síntoma es que la PC con Linux
funciona perfecto y la de Windows pide credenciales, y parece un problema de la clave cuando el
problema es que cada máquina resuelve la URL como puede.

---

## Índice de tareas

### Tareas ejecutadas

| # | Tarea | Estado |
|---|---|---|
| [T00](#t00--documentación-de-la-v1) | Documentación de la v1 | Completada |
| [T01](#t01--commit-y-push-de-la-documentación) | Commit y push de la documentación | Completada |
| [T02](#t02--migración-a-presupuesto-v2) | Migración del repo a Presupuesto-v2 | Completada |
| [T03](#t03--plan-de-producto-v2) | Plan de producto v2 (visión, roadmap, este registro) | Completada |
| [T03c](#t03c--confirmación-del-stack-y-modelo-de-cobro) | Confirmación de stack, costos reales y modelo de cobro | Completada |
| [T04](#t04--fase-0-cimientos) | Fase 0: cimientos del proyecto | Completada |
| [T04b](#t04b--base-de-datos-en-supabase-y-fase-1-inicio) | Base de datos aplicada y verificada, inicio de Fase 1 | Completada |
| [T05](#t05--reforma-estética-e-inventario-rama-featdiseno-profesional) | Reforma estética e inventario | Completada |
| [T06](#t06--plan-funcional-del-sistema) | Plan funcional del sistema | Completada |
| [T07](#t07--ampliación-del-plan-proveedores-stock-recetas-de-recetas-y-avisos) | Ampliación del plan y modelo de datos | Completada |
| [T08](#t08--artículos-unificados-motor-recursivo-y-recetario) | Artículos unificados, motor recursivo y recetario | Completada |
| [T09b](#t09b--ajuste-de-stock-y-compra-de-urgencia) | Ajuste de stock y compra de urgencia | Documentada |
| [T10](#t10--todo-vendible-vencimientos-y-receta-de-recetas) | Todo vendible, vencimientos y receta de recetas | Completada |
| [T11](#t11--separación-de-pantallas-y-recetas-que-salen-en-porciones) | Separación de pantallas y recetas que salen en porciones | Completada |
| [T12](#t12--se-elimina-la-merma-de-las-recetas-y-se-planifican-los-gastos) | Se elimina la merma y se planifican los gastos | Completada |

### Fases planificadas

| # | Fase | Estado |
|---|---|---|
| [F0](#f0--fase-0-cimientos-alcance-previsto) | Fase 0: cimientos | Completada |
| [F1](#f1--fase-1-diseño-y-navegación-alcance-previsto) | Fase 1: diseño y navegación | Completada |
| [F2](#f2--fase-2-cuentas-y-negocios-alcance-previsto) | Fase 2: cuentas y negocios | Pendiente |
| [F3](#f3--fase-3-inventario-y-costos-reales-alcance-previsto) | Fase 3: inventario y costos reales | Pendiente |
| [F4](#f4--fase-4-clientes-y-pedidos-alcance-previsto) | Fase 4: clientes y pedidos | Pendiente |
| [F5](#f5--fase-5-agenda-y-entregas-alcance-previsto) | Fase 5: agenda y entregas | Pendiente |

### Inventario de la deuda técnica

Los problemas verificados que hay hoy en el código, con la forma de comprobarlos, viven en
[DEUDA_TECNICA.md](DEUDA_TECNICA.md) y no se repiten acá. Cada tarea que cierre uno lo borra de esa
lista y lo registra en su entrada correspondiente.

Esa lista se creó después de T11, al auditar qué de lo que se había conversado quedó anotado y qué
no. El resultado fue que faltaban cinco problemas, siendo el más grave que **no hay persistencia:
los datos se pierden al recargar la página**.

Esa auditoría también desmintió una sospecha: se creía que la merma se contaba dos veces al anidar
recetas, y al comprobarlo con un test resultó que no. El test que lo fija quedó en
`src/lib/coherencia.test.ts`. La merma como porcentaje se eliminó después, en T12.

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

| #   | Hallazgo                                                                                                                                                         | Consecuencia para la v2                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | El costo del producto se sobreescribe con el total de ingredientes, y la validación exige `costo > 0`: **un producto con costo manual es imposible de guardar**. | Requiere distinguir costo calculado de costo manual.            |
| 2   | Editar o borrar un ingrediente **no recalcula** los productos ya guardados: costo, ganancia y margen quedan congelados con valores falsos.                       | Es el bug más peligroso: muestra una ganancia que ya no existe. |
| 3   | El **nombre** del ingrediente es su identidad: dos insumos con el mismo nombre colisionan al editar o borrar.                                                    | Todo debe identificarse por `id`.                               |
| 4   | El "caso 2" del cálculo (usar un insumo no-paquete como paquete) produce resultados ~3000 veces equivocados sin avisar.                                          | El motor de costeo se reescribe y se testea.                    |
| 5   | Las imágenes en Base64 dentro de `localStorage` agotan la cuota (~5 MB) y el error se maneja en silencio: **la app dice "guardado" sin haber guardado**.         | Las imágenes van a un storage externo.                          |
| 6   | El total se calcula por dos caminos distintos (leyendo el DOM vs. el modelo de datos).                                                                           | Una sola fuente de verdad.                                      |
| 7   | `innerHTML` con datos de usuario: nombres maliciosos se ejecutan.                                                                                                | Un framework que escape por defecto.                            |

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

> **Corrección posterior:** aunque acá se dejó asentado que el remoto quedó en SSH, al revisar el
> repositorio en 2026-10-05 se encontró que `origin` estaba en
> `https://github.com/nicodelos24/Presupuesto-v2.git`. La convención SSH sigue siendo la correcta y
> está documentada en la cabecera de este archivo, pero el remoto real había quedado en HTTPS.

### Diferencias con la v1

| Aspecto               | v1              | v2                                   |
| --------------------- | --------------- | ------------------------------------ |
| Rama                  | `master`        | `main`                               |
| Artefacto `index.zip` | Sí              | **No** (eliminado a propósito)       |
| `.gitattributes`      | No              | Sí, ya venia del repo nuevo          |
| Base                  | Código original | Copia exacta, lista para reconstruir |

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

| Decisión                                                                              | Alternativas descartadas                            | Motivo                                                                                                                                           |
| ------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Base de datos y autenticación: Supabase**                                           | Firebase, backend propio, seguir con `localStorage` | Es la única opción que da cuentas, aislamiento por negocio, imágenes y backups sin mantener servidores. El costo de cambiar después es altísimo. |
| **Aislamiento por negocio con Row Level Security**, no solo filtrando en el código    | Filtrar por `store_id` en cada consulta             | Un filtro olvidado en una consulta expone datos de otro cliente. La RLS es la garantía real.                                                     |
| **Reescritura de la capa visual y de datos, conservando el motor de costeo**          | Arreglar la v1 línea por línea                      | La v1 no tiene cuentas, ni pedidos, ni compras. Es una reescritura igual; la diferencia es qué código se tira y qué se conserva.                 |
| **El motor de conversión de unidades se conserva**                                    | Rehacer los cálculos                                | Es la parte mejor pensada de la v1. Se porta a TypeScript con tests.                                                                             |
| **Las imágenes pasan a Supabase Storage**                                             | Seguir con Base64 en el navegador                   | La cuota de `localStorage` rompe la app y falla en silencio.                                                                                     |
| **Modelo de datos relacional con entidades de compras, clientes, pedidos y entregas** | Seguir con arrays de objetos                        | Sin historial de compras no hay costo real; sin clientes y pedidos no hay calendario.                                                            |

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

| Herramienta                    | Resultado                             |
| ------------------------------ | ------------------------------------- |
| Node 20.19.2, npm 9.2.0        | Funcionan                             |
| esbuild 0.28.2 (motor de Vite) | **Funciona** en esta CPU              |
| Supabase CLI                   | **No arranca**: `Illegal instruction` |
| Docker                         | No instalado                          |

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
2. **Código de la v1 movido a `legacy/`** para conservarlo como referencia sin que estorbe el
   desarrollo nuevo.
3. **Motor de costeo reescrito** en TypeScript (`src/lib/costing.ts` y `src/lib/unidades.ts`) como
   funciones puras, sin DOM y sin dependencias.
4. **48 tests unitarios** que cubren conversiones, prorrateo de paquetes, margen y redondeo.
5. **Migración SQL inicial** (`supabase/migrations/0001_esquema_inicial.sql`) con 14 tablas, índices,
   funciones de apoyo y 18 políticas de Row Level Security.
6. **Shell de la aplicación** con el sistema de diseno aplicado y una pantalla que muestra el estado
   de la conexion y un ejemplo de costeo real.

### Bugs corregidos en el motor (cubiertos por tests)

| Bug heredado                                                          | Corrección                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Producto con costo manual imposible de guardar                        | `costoDeProducto` acepta `costoManual` y lo respeta sin invalidar los errores de la receta |
| Pedir paquetes de un insumo simple daba un costo miles de veces menor | Devuelve el error `paquete-sobre-ingrediente-simple` en vez de un número falso             |
| Costos congelados sin recalcular                                      | El costo se calcula siempre desde el inventario, nunca queda guardado en el producto       |
| Ingredientes identificados por nombre                                 | Todo se identifica por `id`                                                                |
| Mezclar peso y volumen en silencio                                    | `convertirCantidad` devuelve `null` y el costeo marca `unidad-incompatible`                |
| Paquetes prorroteados con la unidad equivocada                        | El precio por unidad base se calcula sobre el contenido real del paquete                   |

### Dos bugs encontrados por los tests durante esta fase

| Bug                         | Síntoma                                                                      | Causa                                                                              |
| --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Prorrateo de paquetes       | 4 paquetes de 500 g por $900, receta de 250 g daba $28,125 en vez de $112,50 | Se dividía el precio del lote por la cantidad de paquetes y después se prorroteaba |
| Test con unidades mezcladas | Un test pedia 2 unidades a un paquete cuyo contenido estaba en gramos        | El test mezclaba tipos de unidad; se reescribio con dos casos correctos            |

El primero es exactamente el tipo de error que la v1 hacía en silencio. Ahora lo detecta el test.

### Verificaciones

| Verificación               | Resultado                             |
| -------------------------- | ------------------------------------- |
| Tests                      | 48 pasan                              |
| Typecheck (`svelte-check`) | 0 errores, 0 avisos                   |
| Build de producción        | Correcto, 74,65 KB gzip de JavaScript |
| Conexion con Supabase      | Correcta, responde 200                |

### Agregado

- `src/lib/tipos.ts`, `src/lib/unidades.ts`, `src/lib/costing.ts` y sus tests.
- `src/lib/supabase.ts` con el cliente y detección de configuración faltante.
- `supabase/migrations/0001_esquema_inicial.sql`.
- `.gitignore` que protege `.env`, `node_modules` y `dist`.
- `.env.example` con las variables documentadas.

### Cambiado

- El código de la v1 dejo de estar en la raiz y paso a `legacy/`.
- La configuración de tests se separo de la de Vite (`vitest.config.ts`) porque Vitest trae su
  propia copia de Vite y los tipos chocaban.
- Se eligió Tailwind 3.4 en lugar de la versión 4: la 4 depende de un binario nativo que puede no
  funcionar en la CPU de la máquina de desarrollo. Se podrá migrar cuando el equipo se actualice.

### Notas de la configuración de Supabase

- Las tres opciones del asistente quedaron marcadas: Data API, exponer tablas nuevas automáticamente y
  RLS automática. La tercera instala un trigger que activa la RLS en cada tabla nueva, de modo que
  falla hacia el cerrado en vez de dejar la tabla abierta.
- La migración además hace `revoke` de los permisos de `anon`, porque la aplicación exige cuenta y no
  necesita acceso sin iniciar sesión.
- La clave publicada (`sb_publishable_...`) vive en `.env`, que está en `.gitignore`. Nunca se sube.

### Limitación detectada en Supabase

El envio de correos de confirmación está habilitado, pero el plan gratuito tiene un SMTP integrado
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

### Migración aplicada y verificada

El usuario aplico `0001_esquema_inicial.sql` desde el editor SQL del panel (el Supabase CLI no funciona
en la máquina). La verificación con `supabase/verificar.sql` dio exactamente lo esperado:

| Verificación                    | Resultado                   | Interpretacion                                  |
| ------------------------------- | --------------------------- | ----------------------------------------------- |
| Tablas                          | 14                          | Esquema completo                                |
| Tablas con RLS                  | 14                          | Todas protegidas                                |
| Políticas                       | 17                          | Aislamiento por negocio aplicado                |
| Unidades cargadas               | 7                           | Catálogo global poblado                         |
| `anon` puede ver negocios       | false                       | Visitantes sin cuenta no leen datos             |
| `anon` puede insertar productos | false                       | No pueden escribir nada                         |
| `anon` puede ver clientes       | false                       | Datos personales de clientes protegidos         |
| Funciones de apoyo              | 3, todas `security_definer` | La pertenencia a un negocio no se puede falsear |

### Lo que se le explico al usuario

- Que es el rol `anon`: el rol de Postgres que usa toda peticion que no tiene sesión iniciada, que
  incluye la propia aplicación web. Como la clave publicada va incrustada en el código y es publica,
  este chequeo determina que puede hacer alguien que copie esa clave sin ser cliente.
- Que el editor de Supabase muestra solo el resultado de la última consulta cuando se mandan varias
  juntas, por eso era preferible correrlas de a una.

### Fase 1 (inicio): sistema de diseño y navegación

Construido el esqueleto mobile first con navegación inferior en móvil y barra lateral en escritorio:

| Archivo                             | Contenido                                                     |
| ----------------------------------- | ------------------------------------------------------------- |
| `src/lib/rutas.ts`                  | Rutas tipadas y resolución por hash, sin librería de enrutado |
| `src/layouts/MarcoApp.svelte`       | Marco con navegación adaptativa y area segura inferior        |
| `src/components/Boton.svelte`       | Boton con variantes primario, secundario, fantasma y peligro  |
| `src/components/Campo.svelte`       | Campo de formulario con etiqueta, error y descripcion         |
| `src/components/Tarjeta.svelte`     | Contenedor de contenido                                       |
| `src/components/EstadoVacio.svelte` | Estado vacio con icono, texto y acción                        |
| `src/pages/*.svelte`                | Inicio, Pedidos, Agenda, Inventario y Mas                     |

El sistema de diseno vive en `src/app.css` y `tailwind.config.js`: paleta propia, tipografía,
espaciado de 44 px para el tacto, sombras y componentes declarativos (`.boton`, `.campo`,
`.tarjeta`, `.error-campo`).

### Verificaciones

| Verificación | Resultado               |
| ------------ | ----------------------- |
| Tests        | 48 pasan                |
| Typecheck    | 0 errores, 0 avisos     |
| Build        | Correcto, 85,85 KB gzip |

### Errores propios corregidos durante la fase

| Error                                                   | Causa                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `tipo`, `nombre`, `requerido` no existen como atributos | Properties del componente con nombre en español proyectadas sobre atributos HTML en inglés |
| `bind:value` sin variable `value`                       | El componente usa `valor` con `$bindable`, había que enlazar explicitamente                |
| `await` en el `<script>` del componente                 | Svelte 5 no permite espera en el nivel superior del componente; se movió a `onMount`       |

### Agregado

- `supabase/verificar.sql`, consultable y reutilizable en cualquier momento.
- El sistema de diseno completo y las cinco pantallas base.

### Acceso desde el celular durante el desarrollo

Se configuro el servidor de desarrollo para escuchar en todas las interfaces (`host: true` en
`vite.config.ts`), de modo que la aplicación se puede abrir desde el celular en la misma red local
usando `http://192.168.1.68:5173`.

Detalle útil de esta máquina: la primera peticion al servidor tardó 17 segundos (arranque en frío,
precompilación de dependencias y compilacion de componentes) y las siguientes bajaron a menos de un
segundo. Si la pagina parece colgada, recargar: casi siempre es el arranque en frío, no un error.

Nota: `localhost` en el celular apunta al celular. Hay que usar la IP de la red.

### Nota sobre el tamaño del bundle

El bundle paso de 74 KB a 86 KB gzip por sumar la navegación, los iconos de Lucide y las pantallas.
El costo viene casi entero de la librería de iconos. Cuando se sepa que iconos se usan de verdad,
conviene importar solo esos y no el paquete completo.

---

## T05 · Reforma estética e inventario (rama `feat/diseno-profesional`)

### Prompt textual

> "Listo ahora si funciona, me gustaria darle un poquito mas de vida a la pagina visualmente, pero sin
> perder esa estetica profesional, porque todo entra por la vista y quiza esta demasiado sobria aun la
> estetica, quiza darle un toque mas dinamico y moderno sin perder lo profesional, otra duda que tengo es
> que actualmente no se pueden agregar cosas al inventario, no se si es un eror o si todavia no se ha
> implementado la funcionalidad, me ayudas con eso? Asegurate de tener todo commiteado y pusheado, y quiza
> vemos esta reforma estetica en una branch si lo ves conveniente te parece? Asi continuamos, ademas
> quisiera quitar ese color rosa, ya que la primer version era para una clienta femenina, y esta version ya
> es para proponerla a negocios, asi que quiza deberia tener colores mas profesionales"

### Estado

Completada (rama `feat/diseno-profesional`).

### Decisión sobre la rama

Se logro que la reforma visual y el inventario-functional vivan en una rama aparte, para poder revisar
el aspecto nuevo sin mezclarlo con el resto del trabajo. La rama parte de `main` y se fusiona cuando
el usuario apruebe el diseno.

### Cambio de identidad visual: fuera el rosa

Motivo de negocio, no estético: la v1 fue hecha para una clienta y la v2 se ofrece a negocios. El rosa
era una decisión de contexto que hoy pesa mal.

| Antes (v1)                                 | Ahora (v2)                                                   |
| ------------------------------------------ | ------------------------------------------------------------ |
| Rosa pastel `#d46a8c` como color principal | Azul profundo `#365ef2` a `#1b2eb2`                          |
| Fondo rosa `#fff6f8`                       | Fondo neutro con dos halos suaves azul y verde               |
| Sin acento de color                        | Verde esmeralda reservado para ganancias y estados positivos |
| Iconos emoji (X, lupa)                     | Iconos de linea de Lucide                                    |
| Tablas planas                              | Tarjetas con sombra, borde y elevación al pasar el mouse     |

### Que se agrego para darle vida sin perder seriedad

| Recurso                                     | Donde      | Para que                                                                 |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Encabezado con degradado y tres indicadores | Inicio     | Da entrada visual y muestra el estado del día de un vistazo              |
| Pastillas de estado con color               | Inicio     | Conectado en verde, sin sesión en ámbar                                  |
| Realce en la ganancia                       | Inicio     | La ganancia va sobre un bloque verde, es el dato que el dueño quiere ver |
| Indicador de navegación activo              | Navegación | Pastilla de fondo y color en la sección actual                           |
| Barra lateral con degradado                 | Escritorio | Marca la navegación principal sin competir con el contenido              |
| Animaciones de entrada                      | Pantallas  | Aparición suave, sin marear                                              |
| Esqueletos de carga                         | Inventario | Evita el salto de contenido al cargar                                    |
| Estados vacios con icono en cuadro de color | Todas      | Deja de sentirse como una pantalla muerta                                |

### Inventario funcional

Se implemento alta, edicion, busqueda y borrado de insumos. **No era un error: era una funcionalidad
pendiente** de la Fase 3, adelantada ahora porque era lo único que bloqueaba probar el costeo.

Como todavia no hay inicio de sesión, las políticas de seguridad impiden escribir en la base. Para no
tirar el trabajo, el acceso a datos se separo en un repositorio con dos implementaciones tras la misma
interfaz:

| Implementacion             | Cuando se usa      | Comportamiento                                                |
| -------------------------- | ------------------ | ------------------------------------------------------------- |
| `crearRepositorioMemoria`  | Ahora, sin sesión  | Guarda en memoria con datos de ejemplo, se pierde al recargar |
| `crearRepositorioSupabase` | Cuando haya sesión | Escribe en la tabla `insumos` del negocio del usuario         |

La pantalla muestra un aviso claro de que está en modo demostracion, para que nadie crea que sus datos
estan guardados. La interfaz, las validaciones y los cálculos de precio unitario **no se tira**: se
reutilizan tal cual cuando se conecte el repositorio de Supabase.

Validaciones agregadas: nombre obligatorio, cantidad mayor a cero, precio no negativo y, cuando la unidad
es paquete, contenido y unidad del contenido obligatorios. Cada insumo muestra su precio por unidad ya
calculado (por ejemplo, `$48 por kg`).

### Errores propios corregidos

| Error                                                | Causa                                                                                             | Como se resolvio                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `The utility '' contains an invalid theme value`     | Se uso `@apply boton` dentro de `.boton-primario`, y Tailwind no permite aplicar una clase propia | La clase base se declara en una lista de selectores compartida |
| Los estilos no cambiaban al recargar                 | Cambiar `tailwind.config.js` exige reiniciar el servidor de desarrollo                            | Se documento y se reinicio                                     |
| `boton-{variante}` no generaba clases                | Una clase interpolada no la puede detectar Tailwind                                               | Mapa de variantes con nombres de clase literales               |
| Tipo incompatible con `null` en los datos de paquete | El tipo `Insumo` no admitía `null` y la base si lo devuelve                                       | El tipo ahora acepta `null`, que describe mejor la base        |

### Verificaciones

| Verificación | Resultado                                          |
| ------------ | -------------------------------------------------- |
| Typecheck    | 0 errores (tras corregir los 5 del primer intento) |
| Build        | Correcto                                           |
| Tests        | 48 pasan, sin cambios en el motor                  |

### Advertencia sobre el rendimiento de la máquina

El typecheck paso de 5 minutos a más de 10. La causa es saturación de CPU: con el servidor de
desarrollo, el typecheck y el navegador abiertos a la vez, el load average llega a 12 en un
procesador de dos núcleos. Recomendacion: correr el typecheck con el navegador cerrado y antes de
commitear, no en cada cambio.

### Agregado

- `src/lib/datos/inventario.ts`: interfaz del repositorio, validaciones y semilla.
- `src/lib/datos/inventarioSupabase.ts`: adaptador real contra la base.
- `src/pages/Inventario.svelte`: pantalla completa con lista, buscador, formulario y confirmacion.

### Decisiones

| #   | Decisión                                                         | Motivo                                                            | Reversible              |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| D19 | Azul profundo como color principal y verde esmeralda como acento | Seriedad para proponer a negocios: el rosa era de la v1           | Sí, son tokens          |
| D20 | Acceso a datos detras de una interfaz de repositorio             | Permite escribir contra Supabase sin reescribir la pantalla       | No (es la arquitectura) |
| D21 | La reforma visual en una rama aparte                             | Permite revisar el aspecto sin mezclarlo con el resto del trabajo | Sí                      |

---

## T06 · Plan funcional del sistema

### Prompt textual

> "Me gusta mucho el rediseno, esta buenisimo, ahora haz los commit push necesarios y quisiera
> comenzar a encontrarle la funcionalidad y el diseno real que deberia tener todo, ya que ahora mismo se
> perdio la funcionalidad principal de la pagina que era poder calcular ganancias y costos de recetas a
> traves de los ingredientes del inventario, otra cosa que veo es que ya no se pueden agregar fotos para
> ver los productos y eso era como una forma visual de tener las cosas a mano, pero no se si es buena
> idea por el tema de consumo de espacio una vez que la pagina este levantada y con su base de datos,
> podriamos comenzar a planear como deberia funcionar? Otra cosa que me gustaria es que en la parte de
> agenda se muestre un calendario donde se pueda agendar pedidos por ejemplo, entonces se podria marcar
> una fecha en la que deberia estar pronto ese pedido, y asi calcular los costos que vamos a tener
> haciendo y vendiendo tal producto, y luego pode ver las ganancias que se tienen o que se van a tener
> segun los productos que se van a vender, o los vendidos, tambien poder ver las ganancias y gastos de
> productos que pueda ir guardando, como una especie de 'recetario' donde ya tenga la cantidad de
> ingredientes que se necesitan para cada cosa ya guardados, entonces en base a todo eso se podrian
> calcular cuanto inventario va a quedar una vez que marque cuantos productos se van a vender en el
> calendario (o en esa seccion), es algo complicado de explicar pero podemos ir avanzando y haciendo
> los cambios en la marcha y una vez terminemos podemos hacer toda la parte del servidor, no se si es
> buena idea hacer eso, te parece?"

### Estado

Completada (planificación). La implementacion queda para las fases siguientes.

### Que se entrego

Se escribió `PLAN_FUNCIONAL.md`, que define el modelo mental del producto **antes** de construirlo,
respondiendo a las preguntas que aparecen en el pedido.

### Las preguntas del usuario y su respuesta

**1. Se perdió la función principal (costear recetas con los ingredientes del inventario).**
Es correcto y es lo primero a recuperar. El motor de cálculo nunca se perduo: está escrito y testeado
en `src/lib/costing.ts`, lo que falta es la pantalla que lo use, el recetario.

**2. Las fotos: no es buena idea por el tema del espacio.**
El riesgo era real en la v1 (Base64 dentro del navegador, límite de 5 MB y fallos silenciosos), pero
en la v2 no lo es: las fotos van a Supabase Storage y el plan gratuito ofrece 1 GB. Reduciendo la
imagen a 1200 px y WebP en el celular, cada foto queda entre 80 y 250 KB, o sea que entran entre 4.000
y 10.000 fotos. Es una capacidad de sobra para un negocio. Además la foto tiene que ser siempre
opcional: si no entra, el producto se guarda igual sin foto.

**3. El calendario para agendar pedidos y calcular costos, ganancias e inventario restante.**
Es la mejor idea del proyecto y la que más justifica cobrar una cuota. Se especificó así:

- Se marca en una fecha cuántos productos se van a producir, y el sistema calcula al instante el costo
  de producción, los ingresos esperados y la ganancia de ese día.
- Se cruza con el inventario para mostrar el stock disponible, el stock comprometido por pedidos
  anteriores y el stock que queda.
- Avisa los faltantes: que insumo hay que comprar si o si y a cuánto proveedor. Ese aviso es lo que
  un cuaderno no puede dar y lo que justifica el sistema.
- Además se convirtió en el cálculo de inventario restante que pidió: si se agenda producir X unidades,
  se descuenta del stock lo que llevan las recetas de esos productos.

**4. Un 'recetario' con las cantidades ya guardadas.**
Es exactamente el modulo de Recetario: productos con su receta de ingredientes. El costo se calcula
siempre en vivo mientras se carga la receta, y el total y el margen se ven antes de guardar.

**5. Poder ver ganancias y gastos.**
Se agrego el modulo de gastos (luz, gas, packaging, servicios) para poder mostrar el resultado del
mes: ventas menos costo de insumos menos otros gastos. Sin eso el sistema solo sirve para cotizar.

**6. Conviene construir todo antes del servidor.**
Es buena idea con una condicion. Se puede y conviene, porque el motor de cálculo ya existe y la
interfaz trabaja contra un repositorio intercambiable, no contra Supabase. La condicion es que el
paso de cuentas de usuario no se deje para el final: es la parte con más riesgo técnico y si llega
tarde, arrastra cambios. Por eso el orden propuesto las pone antes de pedidos y entregas.

### Orden de construccion acordado

| Orden | Que                                           | Razón                        |
| ----- | --------------------------------------------- | ---------------------------- |
| 1     | Recetario con costeo en vivo                  | Es la funcion principal      |
| 2     | Agenda con producción planificada y faltantes | Es lo que da valor real      |
| 3     | Inventario conectado al recetario             | La pantalla ya existe        |
| 4     | Cuentas de usuario y persistencia             | Sin esto no se guarda nada   |
| 5     | Pedidos, clientes y entregas                  | Vienen sobre lo anterior     |
| 6     | Gastos y resultado mensual                    | Cierra el circulo financiero |

### Cambio de navegación propuesto

Se libera un lugar en la barra inferior: **Mas** no es operación diaria y pasa a la cabecera,
dejando el lugar para **Recetario**.

```
Antes:  Inicio · Pedidos · Agenda · Inventario · Mas
Ahora:  Inicio · Recetario · Pedidos · Agenda · Inventario
```

### Agregado

- `PLAN_FUNCIONAL.md`: especificación de las pantallas, del calendario de producción, de los pedidos,
  de los gastos, de la política de fotos, del orden de construccion y de las decisiones a tomar.

### Rama y merge

La rama `feat/diseno-profesional` se fusiono a `main` al ser aprobado el rediseño por el usuario
(commit `318e527`).

---

## T07 · Ampliación del plan: proveedores, stock, recetas de recetas y avisos

### Prompt textual

> "Bien, algo mas que podemos agregar al plan es que ademas de tener un inventario de productos y
> recetario, tambien se pueda agendar en el calendario cuando van a llegar los pedidos de proveedores en
> el caso de un restaurant, entonces se va a poder calcular si va a faltar algo en algun pedido para tal
> fecha, eso tendria bastante sentido, y que ademas en el inventario se pueda agregar cosas para ir
> teniendo el inventario actualizado, y lo mismo para el recetario, por ejemplo si un restaurante quiere
> tener varios platos ya preparados como tortillas, spagettis congelados ya hechos, salsas, etc, esas
> cosas se guardarian por catidad en las recetas, asi una vez que se hayan hecho varias recetas, los
> ingredientes deberian restarse automaticamente del inventario, de esta forma todo tendria congruencia
> y sentido, si ves baches en mi plan podrias corregirme, acosnejarme y asesorarme sobre la organizacion?
> Una vez tengamos la idea ya hecha me gustaria poder agregar una parte de graficas para ver las ganancias,
> pedidas, clientes, etc, quiza que lleguen notificaciones de cuando van a haber pedidos proximos, reparto
> de proveedores, o cualquier cosa agendada, hasta cuando el inventario se este agotando algo incluso, o
> hasta algun recordatorio de que se debe actualizar el inventario por si acaso a alguna hora programada,
> todo esto ultimo no se se si se puede implementar, pero quiero que vayas teniendo estas ideas en el
> plan asi podemos hacer un buen proyecto profesional cotizable que sirva para negocios, me ayudas a
> continuar entonces?"

### Estado

Completada (planificación y esquema de datos). La implementacion queda para las fases siguientes.

### Baches encontrados en el plan y como se corrigieron

Las ideas del usuario son correctas y valientes. Al juntarlas aparecieron cinco problemas que habría
costado mucho corregir más tarde:

| Bache                                                   | Por que es grave                                                                                                                                | Corrección                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| El stock se guardaba como "cantidad comprada"           | Con compras, producción, mermas y conteos, un número guardado deja de ser cierto                                                                | El stock pasa a ser la **suma de movimientos** (libro contable) y **nunca se edita a mano**          |
| Las recetas de recetas no se podian expresar            | Habia dos tablas separadas (`insumos` y `productos`) con lógica duplicada; un preparado que se vende y se usa en otra receta no cabe en ninguna | Se **unifica en una tabla `articulos`** con banderas (`es_vendible`, `es_elaborado`)                 |
| No estaba contemplado el **rendimiento ni la merma**    | Elaborar 500 g de arroz rinde 400 g cocidos; sin esto el costo sale bajo y el dueño vende creyendo que gana cuando no                           | Se agregan `rendimiento_cantidad`, `rendimiento_unidad` y `merma_pct` a cada receta                  |
| La llegada prevista de proveedor se confundía con stock | Prometería mercadería que no llegó: el error más caro posible                                                                                   | Tabla `llegadas_previstas` separada, que **no** suma stock, y proyección que las usa como estimación |
| Faltaba el **conteo físico**                            | Sin el, en tres meses el stock deja de cuadrar y el local abandona la app                                                                       | Tabla de movimientos tipo `ajuste_conteo` con registro de quien ajusto y cuando                      |

Además se detectaron dos problemas técnicos de implementacion: el **ciclo de recetas** (una salsa que
contiene una tortilla que contiene la misma salsa) y el **doble descuento** de insumos al elaborar y
al vender. Ambos quedaron documentados con su regla de resolución.

### Lo que se entrego

1. **`MODELO_DATOS.md`**: el modelo completo, con las correcciones explicadas y el porque de cada una.
2. **`supabase/migrations/0002_articulos_y_movimientos.sql`**: rehace el esquema con `articulos`,
   `movimientos`, `llegadas_previstas`, `producciones`, `gastos` y las políticas de seguridad.
3. **`supabase/verificar_0002.sql`**: consultas para comprobar que quedo bien aplicado.
4. **`PLAN_FUNCIONAL.md`** sección 11: los modulos nuevos y la advertencia sobre el calendario.

### Detalles técnicos que quedaron documentados

| Decisión técnica                      | Como quedo resuelto                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valorar el stock                      | **Costo promedio ponderado**, recalculado solo en compras. Se descarto FIFO por complejidad para un negocio chico.                                                                            |
| A que hora empieza el día del negocio | Campo `hora_corte_dia` (4:00 por defecto) para panaderías que producen de noche                                                                                                               |
| Aviso de stock bajo                   | Campo `stock_minimo` por artículo, con activador por negocio                                                                                                                                  |
| Recordatorio de conteo                | `aviso_conteo_dia` (día del mes) y `hora_resumen_correo` (7:00 por defecto)                                                                                                                   |
| Notificaciones                        | Avisos dentro de la app y correo diario. El push del navegador se agrega al final, con la salvedad de que en iPhone exige instalar la app en la pantalla de inicio. SMS descartado por costo. |
| Gráficas                              | Siete gráficas definidas, cada una respondiendo una pregunta concreta. Se descartaron las que no responden nada                                                                               |

### Funcionalidades que se agregaron al plan por sugerencia propia

| Agregado                            | Por que                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Lista para comprar al proveedor** | Se genera sola con los faltantes. Es lo que más va a usar el dueño.                                             |
| **Comanda de producción**           | Por pedido, que preparar y en que orden. Se imprime y va a la cocina.                                           |
| **Historial de precio de insumos**  | Para detectar que subio un insumo y los productos mantienen el precio viejo, y el margen se está comiendo solo. |
| **Corte del día configurable**      | Una panadería produce de noche; sin esto los pedidos de la madrugada caen en el día anterior.                   |

### Orden de construccion revisado

| #   | Modulo                                                      |
| --- | ----------------------------------------------------------- |
| 1   | Artículos unificados y libro de movimientos                 |
| 2   | Recetario con costo en vivo y rendimiento                   |
| 3   | Cuentas de usuario y persistencia real                      |
| 4   | Agenda: producción agendada, llegadas previstas y faltantes |
| 5   | Inventario: conteos, ajustes y mínimos                      |
| 6   | Pedidos y clientes con costo congelado                      |
| 7   | Listas para imprimir (compras y comanda)                    |
| 8   | Gastos y resultado mensual                                  |
| 9   | Avisos en la app y correo diario                            |
| 10  | Gráficas y notificaciones push                              |

### Nota sobre la reescritura del esquema

La migración 0002 **borra y rehace** varias tablas de la 0001. Es seguro porque el proyecto está en
desarrollo y no hay datos reales todavia. Se hizo a propósito: cambiar el modelo con datos en
producción sería mucho más caro que rehacerlo ahora.

### Estado de la base

La migración 0002 **todavia no fue aplicada**. El usuario debe correrla en el panel de Supabase y luego
verificar con `supabase/verificar_0002.sql`, una consulta a la vez.

---

## T08 · Artículos unificados, motor recursivo y recetario

### Prompt textual

Continuacion de la consigna anterior, ejecutada sobre el plan documentado.

### Estado

Completada.

### Trabajo realizado

1. **Modelo unificado**: se reemplazo `Insumo` por `Articulo`, con banderas `esVendible` y
   `esElaborado`, para que un preparado pueda venderse y usarse en otra receta a la vez.
2. **Motor de costeo recursivo** (`src/lib/costoRecetas.ts`) que resuelve recetas de recetas, divide
   por el rendimiento de la tanda, aplica la merma, detecta ciclos y calcula insumos faltantes.
3. **Recetario** (`src/pages/Recetario.svelte`): alta de productos con receta y costeo en vivo.
4. **Estado compartido** (`src/lib/estado.svelte.ts`) para que los datos sobrevivan a la navegación.
5. **Navegación**: Recetario entra en la barra inferior y Mas pasa a la cabecera.

### Bugs propios detectados durante la implementacion

| Bug                                                  | Causa                                               | Corrección                                               |
| ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Los datos se perdian al cambiar de pantalla          | Cada pagina creaba su propio repositorio en memoria | Estado compartido en un único modulo                     |
| Un preparado con receta circular rompia el cálculo   | No habia detección de ciclos                        | Se detectan antes de calcular, con límite de profundidad |
| `cargando` no se podia reasignar                     | Un estado exportado es una constante en Svelte 5    | Se paso a un objeto `estado.cargando`                    |
| El costo de un preparado con paquete mal prorrateado | Se dividía por paquetes y después se prorroteaba    | Se convierte primero a la unidad base del contenido      |

### Corrección conceptual importante

La `merma` y el `rendimiento` no son lo mismo, y está distincion quedo implementada de forma explícita:

- **Rendimiento**: cuánto sale de una tanda. Si 500 g de arroz rinden 400 g cocidos, el rendimiento es
  400 g. El costo se divide por eso.
- **Merma**: el costo extra del proceso (aceite, especias, lo que se rompe). Se aplica como
  multiplicador sobre el costo.

Antes habia una sola idea para los dos casos y el costo salia mal.

### Verificaciones

| Verificación        | Resultado                                                     |
| ------------------- | ------------------------------------------------------------- |
| Tests               | 39 pasan                                                      |
| Typecheck           | 0 errores, 0 avisos                                           |
| Cobertura del motor | 20 tests: conversiones, rendimiento, merma, ciclos, faltantes |

### Pendiente

- El **libro de movimientos** que actualiza el stock automáticamente al producir todavia no está
  implementado: el stock se edita a mano desde Inventario. Es el próximo paso y es lo que impide que
  los números sean falsos.
- El precio de venta se calcula y se muestra en el formulario, pero todavia no hay pantalla de ventas
  ni de pedidos.

---

## T09b · Ajuste de stock y compra de urgencia

### Prompt textual

> "No se si voy a aplicar lo de 'nunca se edita a mano' porque haz de cuenta que un restaurante en un
> apuro se queda sin stock y compra de urgencia alguna cosa que les falte, en ese caso no ingresaria
> ese producto por un proveedor, es algo que tengo que solucionar"

> "Prefiero que pensemos mejor todo esto, pero dejalo apuntado documentado para tenerlo muy en cuenta si
> es que no lo esta todavia"

### Estado

Documentada. **Sin implementacion**: es una tarea de Fase 3 y todavia no se decidio cuando se ejecuta.

### Que se aclaro

La regla "el stock nunca se edita a mano" estaba escrita en `MODELO_DATOS.md` pero se leía como "el
usuario no puede cambiar el stock nunca". No es eso. La distincion real es:

- **Sobreescribir** un número (prohibido): el sistema pierde la cuenta y el stock deja de ser cierto.
- **Anotar un movimiento** (correcto): el humano si puede cambiar el stock, queda registrado y el
  resultado se deriva de la suma.

### El caso de la compra de urgencia ya está resuelto por el esquema

No hace falta ningun tipo de movimiento nuevo ni ninguna excepción. Es una `compra` con
`proveedor_id = null`, y esa columna ya es nullable en `0002_articulos_y_movimientos.sql`. Todos los
casos manuales del día a día mapean a movimientos que ya existen:

| Situación real                 | Movimiento                         |
| ------------------------------ | ---------------------------------- |
| Compra de urgencia sin factura | `compra` con `proveedor_id = null` |
| Llega mercadería del proveedor | `compra`                           |
| El conteo difiere del sistema  | `ajuste_conteo`                    |
| Se perdio o vencio algo        | `merma` / `descarte`               |
| Se elaboro una tanda           | `produccion`                       |

**Conclusión:** el modelo de datos no necesita cambios para esto. Lo que hay que cambiar es la
interfaz: el campo de stock de `Inventario.svelte` deja de ser editable y pasa a ser una acción
"Ajustar stock" que pregunta que paso y anota el movimiento correspondiente.

### El riesgo que si es real: el precio, no la cantidad

Si el local compra un insumo de urgencia más caro, el `costo_promedio` cambia en cascada y el margen
de todos los productos que lo usan se achica sin que nadie mire. Eso si es un perjuicio económico, a
diferencia de un ajuste de cantidad.

Por eso quedo asentado que:

1. El precio de la compra de urgencia **no es opcional**: si no se informa, se asume el costo actual y
   la compra queda marcada como supuesto en la nota.
2. Hay que **avisar que productos cambiaron de costo y cuánto** al recalcular en cascada. Es la parte
   que hoy no existe y ya estaba prevista en la Fase 3 del `ROADMAP.md`.
3. Inventario debería mostrar la **última variación del costo** de cada artículo.

Este es el bug 9.2 de la v1 invertido: la v1 congelaba el costo viejo; el riesgo actual es que se
aplique el costo nuevo sin que nadie lo mire.

### Decisiones

| #   | Decisión                                                                            | Motivo                                                             | Reversible                      |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- |
| D22 | La compra de urgencia es una `compra` sin proveedor, no un tipo de movimiento nuevo | El esquema ya lo permite y cubre todos los casos reales            | Sí, es una decisión de interfaz |
| D23 | El precio de una compra de urgencia no es opcional                                  | Un costo promedio que cambia en silencio es un perjuicio económico | Sí                              |

### Estado real de la interfaz (lo que hay que corregir)

`src/pages/Inventario.svelte` sigue con un `<input>` de stock editable que escribe directo a
`Articulo.stock`, lo cual contradice la regla y el comentario del propio tipo (`tipos.ts`: "Nunca se
edita a mano: es el resultado de los movimientos"). Es el pendiente más grave que ya estaba
registrado en T08.

### Agregado

- `MODELO_DATOS.md` secciones 1.1bis y 1.1ter, con las dos distinciones y la tabla de casos reales.
- Decisiones D22 y D23 en el registro de decisiones técnicas.

---

## T10 · Todo vendible, vencimientos y receta de recetas

### Prompts textuales

> "Ahora mismo tenemos inventario y recetario, pero en recetario hay 3 tipos que se pueden elegir,
> producto, preparado y materia prima, explicame un poco más sobre cuál es el cometido de esto y cómo
> debería funcionar"

> "Yo creo que el problema está en cómo se organiza la gestión, quizá lo mejor sea que en inventario
> existan 2 secciones/pestañas, una para la materia prima (arroz, leche, fideos, azucar,etc) y la otra
> que sea de elaborados [...] por ejemplo un emprendedor que quiera vender pizzas congeladas y tambien la
> salsa que hace, así no debería agregar la salsa a recetas y podría venderlas directamente desde su
> producción"

> "Ahora mismo estoy en una pc con buenos recursos, si hace falta instalar algo para facilitar y
> agilizar todo podés hacerlo, así implementamos los cambios"

### Estado

Completada. La migración `0004` **está escrita pero todavía no aplicada**: la tiene que correr el
usuario en el panel de Supabase.

### La pregunta que desbloqueó el resto

Elusuario preguntó: _"¿por qué existe materia prima en recetas? sigo creyendo que habría que
quitártelo"_. Tenía razón, y no era solo redundancia: creaba un artículo con costo cero que
envenenaba en silencio todos los cálculos que lo tocaban.

### El error de fondo: el campo `tipo`

`tipo` (producto / preparado / materia prima) **no lo lee ningún cálculo**. El motor entero decide con
las dos banderas, `esElaborado` y `esVendible`. Y el formulario obligaba a elegir un tipo que se
comportaba igual a otro:

| Tipo elegido  | `esElaborado` | `esVendible` |
| ------------- | ------------- | ------------ |
| Producto      | `true`        | `true`       |
| Preparado     | `true`        | `true`       |
| Materia prima | `false`       | `false`      |

Producto y preparado producían valores idénticos. El `tipo` se daba por redundante y se sacó del
formulario.

### Lo que quedó: cuatro ejes independientes

| Eje          | Campo           | Pregunta                 |
| ------------ | --------------- | ------------------------ |
| ¿Lo elaboro? | `esElaborado`   | ¿Tiene receta?           |
| ¿Lo vendo?   | `esVendible`    | ¿Aparece para vender?    |
| ¿Cómo entra? | —               | ¿Se compra o se produce? |
| ¿Vence?      | `duracion_dias` | ¿Cuánto dura?            |

Con esto entran negocios que antes no entraban, sin código nuevo:

| Negocio                         | Cómo queda                                        |
| ------------------------------- | ------------------------------------------------- |
| Carnicería, verdulería, almacén | Compra y revende. Sin receta, con costo de compra |
| Panadería, pizzeria             | Elabora para vender, sin stock intermedio         |
| Restaurante con producción      | Elabora por lotes, con vencimiento                |

El módulo de recetas es opcional: si el negocio no crea ninguna, nunca lo ve.

### Corrección conceptual importante

El usuario propuso que la salsa _"no debería agregarse a recetas"_ porque se vende directa. **Es al
revés**: puede hacer las dos cosas a la vez. Si la salsa no está en la receta de la pizza, el motor
cuesta la pizza desde cero con los insumos crudos y además el stock de salsa queda sin descontar.

**Usar en receta y vender no son alternativas: son ejes separados**, igual que la tortilla que
justificó unificar el modelo en T08.

### El bug que impedía las recetas de recetas

El selector de ingredientes filtraba `!a.esElaborado`, así que **una tortilla no podía ser
ingrediente de un plato**. El motor lo resolvía y estaba testeado (`costoRecetas.test.ts` tiene el
caso del plato con tortillas), pero la interfaz no lo dejaba usar. Era exactamente el motivo por el
que se unificó el modelo.

Ahora el selector ofrece todo artículo activo, agrupado en "Preparados" e "Insumos".

### Vencimientos

Se agregó `duracion_dias` (nullable) a los artículos: `null` = no vence. Es lo que necesita el caso
de la salsa de 4 días, y no obliga a nada a la harina ni a la pasta.

El matiz que quedó documentado: **el vencimiento es del lote, no del artículo**. Por eso
`movimientos.vence_el` guarda el vencimiento de cada entrada concreta, para lo que se compra con
fecha impresa. Todavía no hay interfaz que lo muestre: eso llega con la implementación de
movimientos.

### Red de seguridad en el motor

Un artículo sin costo no puede pasar como si costara cero:

```ts
if (articulo.costoPromedio <= 0) {
  ctx.errores.push("precio-invalido");
  resultado = 0;
}
```

Antes solo se disparaba con `NaN`. Con el cambio, un costo en cero marca el artículo y **sube en
cascada a todos los productos que lo usan**, que es lo que evita que el dueño venda creyendo que
gana.

### Bug encontrado de paso

Editar un artículo desde Inventario **le borraba la receta y el rendimiento**, porque el formulario
mandaba `esElaborado: false` y `receta: []` siempre. Ahora preserva lo que ya tenía.

### Verificaciones

| Verificación | Resultado                        |
| ------------ | -------------------------------- |
| Tests        | 43 pasan (39 previos + 4 nuevos) |
| Typecheck    | 0 errores, 0 avisos              |
| Build        | Correcto, 97,46 KB gzip          |

### Pendiente para el usuario

1. Correr `supabase/migrations/0004_vencimientos.sql` en el panel de Supabase.
2. Verificar con `supabase/verificar_0004.sql`, una sola consulta, debe devolver `TODO VERDE`.

### Nota sobre las herramientas

El usuario pasó a una PC con recursos (i5-5200U, 4 núcleos, 6 GB) y ofreció instalar herramientas.
El `npm install -g supabase` está bloqueado por la política de seguridad del entorno, así que la
migración sigue yendo por el método del panel que ya funciona. Con una máquina mejor se puede
plantar Tailwind 4 (D13) o ESLint/Prettier, que siguen faltando.

### Decisiones

| #   | Decisión                                                               | Motivo                                                                              | Reversible                              |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| D24 | `tipo` deja de ser un campo que se elige: queda como etiqueta derivada | Producto y preparado se comportaban igual; el tipo no lo lee ningún cálculo         | Sí                                      |
| D25 | Todo artículo puede ser vendible, tenga receta o no                    | Habilita carnicerías, verdulerías, almacenes y almacenes de barrio sin código extra | Sí                                      |
| D26 | `duracion_dias` es opcional y en días enteros, no una fecha            | La salsa dura 4 días; la harina no dura nada. Una fecha obligaría a calcular        | Sí                                      |
| D27 | Un costo promedio en cero es un error, no un valor                     | Un insumo sin costo muestra márgenes falsos sin avisar                              | No (es la red de seguridad del cálculo) |

### Agregado

- `supabase/migrations/0004_vencimientos.sql` y `supabase/verificar_0004.sql`.
- `duracionDias` en `tipos.ts`, `datos/articulos.ts` y ambos formularios.
- Cuatro tests nuevos en `costoRecetas.test.ts`.
- Estilos `.opcion-fila` y `.opcion-activa` en `app.css`.

---

## T11 · Separación de pantallas y recetas que salen en porciones

### Prompts textuales

> "Hay muchas cosas que no me están cuadrando ahora mismo, te las digo para que también se agreguen
> al ia guide y las analicemos"

> "lo que ahora mismo está fallando es que si borro algo del recetario también se borra de los
> ingredientes, y el recetario está mostrando lo mismo que el inventario ahora mismo, y creo que no
> debería ser así, todo lo que está en el recetario automáticamente debería marcarse como que se puede
> vender, lo que debería tener esas opciones es lo que aparece en inventario y en
> elaboraciones/producción, no tiene sentido que me pregunte eso en recetas"

> "otra cosa que es poco intuitiva, es que por ejemplo si agrego una receta me debería dar la opción
> de elegir cuántas porciones rinde, así la receta queda por un lado, pero las porciones que es lo que
> se vende sería lo que queda registrado en recetario, digamos que debería tener una parte con las
> recetas y las cantidades que lleva cada una, y las porciones que se agregan al inventario de ventas
> al hacer una receta, no se si me explico"

> "Exacto, ese ejemplo es lo que te digo, si hago una torta y salen 8 porciones deberían contarse por
> porciones o por producto en esos casos, debería existir esa implementación, todas estas cuestiones
> trata de documentarlas tanto en el iaguide con mis palabras en lo posible, tanto como en el resto
> de la documentación para que luego podamos tener todo esto en cuenta y razonar bien las cosas"

### Estado

Completada.

## El bug que reportó el usuario

### Síntoma

> "si borro algo del recetario también se borra de los ingredientes, y el recetario está mostrando lo
> mismo que el inventario"

### Causa

`estado.svelte.ts` tiene **un solo array `articulos`** y las dos pantallas lo pintaban entero, sin
filtrar. `eliminarArticulo` marca `activo: false` sobre ese array compartido, así que borrar en una
pantalla desaparecía en la otra.

No era un error de borrado: era que **las dos pantallas mostraban la misma lista**.

### Corrección

Las dos pantallas se dividieron por el campo que ya existía:

| Pantalla | Filtro | Qué es |
|---|---|---|
| **Inventario** | `!esElaborado` | Lo que se compra y se tiene. Materias primas y lo que se revende sin receta |
| **Recetario** | `esElaborado` | Lo que se sabe hacer. Catálogo de venta |

## Lo que dejó de preguntar el Recetario

El usuario fue explícito:

> "todo lo que está en el recetario automáticamente debería marcarse como que se puede vender, lo que
> debería tener esas opciones es lo que aparece en inventario y elaboraciones/producción, no tiene
> sentido que me pregunte eso en recetas"

Se quitaron del Recetario dos cosas:

1. **La casilla "¿se puede vender?"**, que se invirtió a *"Solo para usar en otras recetas"*. Todo lo
   del recetario se vende; el caso raro, que es un intermedio que nunca se ofrece (una salsa de la
   casa), es el que se destapa.
2. **El radio "¿Lo elaboro acá / Lo compro y lo revendo?"**. Este además era un bug: si se elegía
   "lo compro", se guardaba con `esElaborado: false` y **desaparecía de la lista del Recetario**, que
   ahora filtra por ese mismo campo.

El caso de "comprar y revender sin receta" quedó en Inventario, que es donde corresponde: es una
carne en una carnicería o un bife en un almacén.

## El error propio que encontré durante esta tarea

Al quitar el bloque `{#if esElaborado}` del formulario con un script, tomé el `{:else}` equivocado
(era el de "Agrega el primer ingrediente", no el de la rama de materias primas) y borré un `</p>` en
lugar del `{/if}`. `svelte-check` lo detectó y se reparó.

Queda anotado porque es el riesgo de editar archivos `.svelte` con scripts en vez del editor: un
error de índice rompe la estructura del archivo y el error que reporta el parser apunta a otro
lugar del que está el problema.

## El rendimiento va en porciones vendibles

### Lo que propuso el usuario

> "si agrego una receta me debería dar la opción de elegir cuántas porciones rinde, así la receta
> queda por un lado, pero las porciones que es lo que se vende sería lo que queda registrado en
> recetario"

> "si hago una torta y salen 8 porciones deberían contarse por porciones o por producto en esos
> casos, debería existir esa implementación"

### Lo que se encontró

**El motor ya lo hacía bien.** La pregunta era si el cálculo era correcto, y lo es, siempre que el
rendimiento se exprese en la unidad que se vende:

```
costo por porción = costo total de la receta / rendimiento × merma
tandas para N     = N / rendimiento
```

Para la torta, con `rendimientoCantidad: 8`:

- Costo por porción = costo de la torta ÷ 8. Correcto.
- Pedir 16 porciones pide **2 tortas**, no 16. Correcto.

Eso se comprobó con tres tests nuevos antes de tocar nada de la interfaz. Si el rendimiento fuera
`1` (una torta entera), pedir 16 porciones pediría 16 tortas: ese es el error que se evita
documentando la regla.

### Lo que sí faltaba era la explicación

El campo decía *"Una tanda rinde"* y el selector decía *"En"*. Nada indicaba que ese número
describe **lo que vendés**, y no un intermedio.

Ahora dice:

| Antes | Ahora |
|---|---|
| "Una tanda rinde: 6" | "De esta receta salen: 6" |
| "En" | "Se venden como" |

Con la explicación: *"Este número va en lo que vendés, no en el intermedio. Una tanda de tortilla que
salen 6 tortillas va 6. Una torta que se corta en 8 porciones también va 8."*

**Que el rendimiento se exprese en porciones vendibles es lo que hace que no haga falta una entidad
aparte para la porción.** El artículo es la torta, el rendimiento dice cuántas porciones salen, y el
stock se cuenta en porciones. Eso evita duplicar datos y evita el problema de mantener sincronizadas
dos filas.

### El caso que sí queda pendiente

Si un negocio vende **la torta entera y también porciones**, hace falta un segundo artículo, porque
una porción no tiene receta propia y su costo sale de dividir el de la torta. El motor todavía no
puede calcular eso. Queda anotado en `MODELO_DATOS.md` sección 2.0bis como pendiente, no como
resuelto.

## Herramientas agregadas

| Herramienta | Para qué |
|---|---|
| **ESLint** | Detectar código muerto y errores de lógica |
| **Prettier** | Formateo consistente |
| **Supabase CLI 2.119.0** | Instalado. Sigue sin usarse para aplicar migraciones: eso va por el panel web |

Scripts nuevos: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`.

### Lo que ESLint encontró en el proyecto

| Símbolo | Problema |
|---|---|
| `PROFUNDIDAD_MAXIMA` | El límite de profundidad que la documentación promete, declarado y nunca usado |
| `detectaCiclo` | Una segunda detección de ciclos, escrita y nunca conectada, mientras el motor tiene la suya |
| `limpiarArticulos` | Exportado y nunca llamado |
| `repositorio` | Exportado y nunca importado |
| `UNIDADES_CONVERTIBLES`, `UNIDADES_POR_TIPO` | Exportados y nunca usados |

TypeScript no los detectaba porque `noUnusedLocals` no vigila los símbolos **exportados**: al
exportarlos salen de su radar. Ese fue el argumento concreto para instalar el linter.

### Un error propio con Prettier

El primer `npm run format` incluyó `*.md` y reformateó las tablas de todos los documentos: alineó
columnas y pasó los archivos a LF. El contenido quedó intacto, pero el diff mezcló formato con
contenido en `IA_GUIDE.md`, que es la bitácora del proyecto. Se sacó del alcance los `.md` para que
no vuelva a pasar.

### Tres reglas desactivadas, con motivo

| Regla | Por qué |
|---|---|
| `@typescript-eslint/no-unused-vars` en `.svelte` | Con los runes de Svelte 5 lo que produce un `$derived` lo consume el template y ESLint no lo ve. Daba 9 falsos positivos en `Inicio.svelte` |
| `no-undef` en los `.ts` | TypeScript ya avisa. Marcaba el tipo `string` como variable no definida |
| `svelte/prefer-svelte-reactivity` | `catalogo()` arma un `Map` nuevo en cada llamada y nadie lo muta después. La regla no puede saber eso |

## Verificaciones

| Verificación | Resultado |
|---|---|
| Tests | 46 pasan (43 previos + 3 de porciones) |
| Typecheck | 0 errores, 0 avisos |
| ESLint | 0 errores, 0 avisos |
| Prettier | Sin diferencias pendientes |
| Build | Correcto, 97,05 KB gzip |

### Decisiones

| # | Decisión | Motivo | Reversible |
|---|---|---|---|
| D28 | Inventario y Recetario se separan por `esElaborado` | Mostrar lo mismo en dos pantallas hacía que borrar en una afectara a la otra | Sí |
| D29 | El Recetario siempre crea artículos elaborados y vendibles | Lo que se compra y se revende vive en Inventario | Sí |
| D30 | El rendimiento se expresa en la unidad que se vende | Hace que el motor resuelva la torta en 8 porciones sin una entidad aparte | Sí |
| D31 | Vender la torta entera y porciones a la vez queda pendiente | Requiere que una porción herede el costo de la torta, que el motor no resuelve | No (es una limitación real) |
---

## T12 · Se elimina la merma de las recetas y se planifican los gastos

### Prompts textuales

> "Esa parte de la merma no la veo muy necesaria la verdad, creo que es un gasto que el usuario debe
> saber, y no se calcula con la aplicación (que es lo que tendría sentido) La idea sería que se calculen
> cuánto viene de luz/gas/agua, etc por mes para que esas cosas se puedan agregar como parte del costo
> del producto, pero que sea una opción adicional, sería algo muy bueno para el usuario tener algo así
> implementado, es una de las cosas que podemos agregar en el ia guide y las cosas por implementar, pero
> por ahora esa función de merma deberíamos quitarla"

### Estado

La **eliminación de la merma** está completa. La **pantalla de gastos** queda planificada, sin
implementar.

## Qué estaba mal de la merma

La merma se había definido en `T08` como *"costo extra del proceso (aceite, especias, lo que se
rompe)"*, pero se calculaba multiplicando la cantidad de ingredientes:

```ts
resultado = (costeo.costoTotal / rendimiento) * (1 + mermaPct / 100)
```

Eso son dos cosas distintas con el mismo nombre:

| Lo que dice la etiqueta | Lo que hace el cálculo |
|---|---|
| Es el sobrecosto del proceso | Es "sale menos de lo que declaraste" |

Una torta que rinde 6 con 20% de merma no es una torta que costó 20% más: es una torta de la que
salieron menos. Son dos hechos distintos sobre la mesa.

**La observación del usuario es la correcta:** el aceite con el que se fríe es un gasto real, con
factura y con un precio concreto. Meterlo como porcentaje significa inventarlo. Y la luz, el gas y el
agua tampoco se calculan: se pagan.

## Qué se eliminó

| Dónde | Qué |
|---|---|
| `tipos.ts` | El campo `mermaPct` |
| `costoRecetas.ts` | Las dos multiplicaciones por merma |
| `datos/articulos.ts` | El campo, su validación y la semilla |
| `Recetario.svelte` | El campo *"Costo extra del proceso (%)"* del formulario |
| `Inventario.svelte` | El valor que se pasaba al guardar |
| Base de datos | La columna, con la migración `0005_quitar_merma.sql` |

El motor quedó más simple: el costo de un preparado es exactamente

```
costo total de la receta / rendimiento
```

**Lo que NO se eliminó:** el movimiento de stock tipo `merma`. Es otra cosa: se usa cuando se pudrió,
se venció o se rompió mercadería, y sigue haciendo falta para que el stock cuadre. `verificar_0005.sql`
comprueba que sigue existiendo, justamente para que nadie lo borre por confusion.

## La decisión de fondo

> La pérdida de masa la cubre el **rendimiento**, que es el campo que existe para eso.
> El sobrecosto del proceso es un **gasto real**, que se registra en la tabla `gastos`.

Un campo menos en el formulario, y el número que queda es uno que el dueño puede defender: *"salen 6
tortillas de esta tanda"*, no *"esta receta tiene 15% de merma"* que nadie sabe de dónde salió.

## Lo que queda planificado: la pantalla de gastos

**La tabla ya existe** en la migración `0002` y está lista:

```sql
create table public.gastos (
  id, negocio_id,
  categoria text not null,              -- luz, gas, agua, packaging...
  concepto text not null,
  monto numeric not null,
  fecha date not null,
  proveedor_id uuid,
  gasto_por_articulo_id uuid,           -- <-- permite atribuir el gasto a un artículo
  notas text, creado_en
);
```

Esa última columna es la que hace posible lo que el usuario pidió: **que un gasto entre al costo de un
producto**. Ya está en el esquema, no hay que rediseñar nada.

### Cómo se vería

```
Gastos del mes
  Luz .................. $ 4.200
  Gas .................. $ 2.100
  Agua ................. $   900
  Packaging ............ $ 1.300
  ─────────────────────────────
  Total ................ $ 8.500

El ACEITE para freír, en cambio, es directo:
  se compra como un insumo más y entra en la receta.
```

Esa distinción es la clave y conviene que la pantalla la enseñe: **lo que se gasta fraccionando (la
luz, el agua) se reparte; lo que se gasta por unidad (el aceite, el packaging) se compra como
insumo**.

### El problema abierto: cómo se reparte

Un gasto de luz de $4.200 por mes no se divide entre los productos de la misma manera. Hay tres
criterios posibles y cada uno sirve para un negocio distinto:

| Criterio | Cómo reparte | Le sirve a |
|---|---|---|
| **Sobre la venta** | El 8% de la venta de cada producto es luz | Cuando no hay forma de medir. Simple, y es el que usa la mayoría |
| **Por consumo** | La torta consume X kWh porque se frió Y minutos | Cuando hay contador o se puede medir de verdad |
| **Directo al artículo** | El $1.300 de packaging es solo de las cajas | Cuando el gasto se puede atribuir sin repartir |

**Este es el punto a decidir y no está resuelto.** Por eso la pantalla queda como opción adicional y
no como algo obligatorio: si el dueño no carga gastos, el sistema sigue funcionando igual y los
márgenes que muestra son los de insumos, que es lo que la mayoría de los negocios quiere ver.

### Por qué es una buena función

Es de lo poco que justifica cobrar el servicio. Un cuaderno no calcula cuánto de la boleta de luz te
corresponde a cada torta. Y es exactamente el dato que falta para saber si el negocio **gana** en
realidad: hoy el margen que muestra el sistema es sobre insumos, no sobre el resultado final.

### Orden sugerido

Va después del libro de movimientos, porque los gastos se registran con la misma lógica: un hecho que
pasa, con fecha, que queda registrado y que nunca se edita a mano.

```
1. Libro de movimientos (el stock sale de compras y producción)
2. Pantalla de gastos con los tres criterios de reparto
3. Resultado mensual: ventas - insumos - gastos
```

El paso 3 es el que cierra el círculo financiero y es el que va a justificar el precio del servicio.

### Verificaciones

| Verificación | Resultado |
|---|---|
| Tests | 48 pasan |
| Typecheck | 0 errores, 0 avisos |
| ESLint | 0 errores |
| Build | Correcto |

### Decisiones

| # | Decisión | Motivo | Reversible |
|---|---|---|---|
| D32 | Se elimina el porcentaje de merma de las recetas | Fingía ser un sobrecosto y en realidad multiplicaba cantidades. El sobrecosto real va a la tabla de gastos | Sí, pero requiere volver a calcular los costos |
| D33 | El movimiento de stock tipo `merma` se conserva | Es mercadería que se pudrió, no un porcentaje. Sin él el stock deja de cuadrar | No (es el libro de movimientos) |
| D34 | Los gastos son una función opcional | Si el dueño no los carga, el sistema funciona igual y el margen es el de insumos | Sí |

---



## Fases planificadas

Esta sección reúne las fases que están **planificadas pero todavía no se ejecutaron**. No son tareas
registradas: no tienen prompt textual porque todavía no hubo un pedido del usuario que las ejecute.

Se numeran con `F` y no con `T` a propósito. Antes estas fases se anotaban como `T04`, `T05`… y
pisaban la numeración de las tareas que sí se hicieron: había dos T04, dos T05, dos T06, dos T07 y
dos T08, y los enlaces del índice apuntaban a la copia equivocada. Con `T` queda solo el trabajo
hecho y con `F` lo que falta.

Cuando una de estas fases se empiece a trabajar, se agrega una entrada `T` con el prompt textual del
usuario y esta entrada `F` se deja como referencia de alcance.

---

## F0 · Fase 0: cimientos (alcance previsto)

### Estado

Completada. Su registro está en [T04](#t04--fase-0-cimientos). Se conserva acá el alcance original
que se había fijado antes de empezar.

### Alcance previsto

- Proyecto con Vite, TypeScript, Tailwind, ESLint y Prettier.
- Motor de conversión y costeo portado a TypeScript, con tests unitarios.
- Sistema de diseño: tokens y componentes base.
- Estructura de carpetas modular.

### Criterio de cierre

`npm test` pasa, hay 3 pantallas navegables con la paleta nueva, y el motor de costeo delega
ningún cálculo al DOM.

---

## F1 · Fase 1: diseño y navegación (alcance previsto)

### Estado

Completada. Su registro está en [T05](#t05--reforma-estética-e-inventario-rama-featdiseno-profesional).

### Alcance previsto

Layout mobile first, navegación inferior en móvil y sidebar en escritorio, componentes completos,
tema claro y oscuro, estados vacíos y accesibilidad.

---

## F2 · Fase 2: cuentas y negocios (alcance previsto)

### Estado

Pendiente. Es la fase con más riesgo técnico del proyecto: si llega tarde, arrastra cambios en todo
lo demás.

### Prompt textual

> _pendiente_

### Alcance previsto

Registro e inicio de sesión, recuperación de contraseña, onboarding del negocio, invitación de
empleados, Row Level Security probada e importación de datos desde la v1.

---

## F3 · Fase 3: inventario y costos reales (alcance previsto)

### Estado

Pendiente. Empieza por el libro de movimientos, que es lo que impide que los números sean falsos.

### Prompt textual

> _pendiente_

### Alcance previsto

Ingredientes, proveedores, compras con varias líneas, recálculo en cascada de costos y márgenes,
recetas, productos e historial de costos.

### Advertencia registrada

El alcance de esta fase cambió después de la aclaración sobre el ajuste de stock. Hay que tener
presente lo que quedó asentado en [T09b](#t09b--ajuste-de-stock-y-compra-de-urgencia): la compra
de urgencia es una `compra` sin proveedor, el stock deja de editarse a mano para anotarse como
movimiento, y el precio de esa compra no puede ser opcional porque el `costo_promedio` que cambia en
silencio hace que el dueño venda a pérdida sin enterarse.

---

## F4 · Fase 4: clientes y pedidos (alcance previsto)

### Estado

Pendiente.

### Prompt textual

> _pendiente_

### Alcance previsto

Cartera de clientes, pedidos con líneas y estados, formas de pago, saldos y resumen del día.

---

## F5 · Fase 5: agenda y entregas (alcance previsto)

### Estado

Pendiente.

### Prompt textual

> _pendiente_

### Alcance previsto

Calendario con vistas día/semana/mes, pedidos en sus fechas de producción y entrega, vista de carga
por día, "para hoy" y reparto.

---

## Registro de decisiones técnicas

Tabla maestra. Si una decisión cambia, se agrega una fila nueva en lugar de reescribir la anterior.

| #   | Decisión                                                                                        | Fecha | Motivo                                                                                                                                      | Reversible                                         |
| --- | ----------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| D01 | Supabase como base de datos y autenticación                                                     | T03   | Cuentas multi negocio, RLS, imágenes, sin servidores propios                                                                                | No (migrar de proveedor es un proyecto)            |
| D02 | Aislamiento por negocio con Row Level Security                                                  | T03   | Garantía real de que un local no ve datos de otro                                                                                           | No (es el modelo de seguridad)                     |
| D03 | Reescritura de la capa visual conservando el motor de costeo                                    | T03   | La v1 no soporta cuentas ni pedidos; el motor de cálculo sí vale                                                                            | Parcialmente                                       |
| D04 | Imágenes en Supabase Storage, no en `localStorage`                                              | T03   | La cuota del navegador rompe la app en silencio                                                                                             | Sí                                                 |
| D05 | Identificadores por `id`, nunca por nombre                                                      | T03   | Los nombres colisionan y rompen ediciones y borrados                                                                                        | No                                                 |
| D06 | Costo actual calculado vs. costo histórico congelado                                            | T03   | Un pedido viejo debe seguir cuadrando aunque cambien los costos                                                                             | No (es el modelo de datos)                         |
| D07 | Identificadores de fecha locales, no UTC                                                        | T03   | Un pedido del viernes no debe saltar de día al convertir                                                                                    | Sí                                                 |
| D08 | **Supabase confirmado por el usuario**                                                          | T03c  | El usuario confirmo que puede con el plan gratuito y que no tiene presupuesto de hosting propio                                             | No                                                 |
| D09 | **Cloudflare Pages** en lugar de GitHub Pages                                                   | T03c  | GitHub Pages obliga a publicar el código; Cloudflare permite repositorio privado en plan gratuito y sin límite de ancho de banda            | Sí (cambiar de hosting es una variable de entorno) |
| D10 | **Un proyecto de Supabase por cliente**                                                         | T03c  | Permite cobrar la cuota mensual, aislar datos y dar de baja un cliente sin riesgo                                                           | No una vez que haya clientes                       |
| D11 | **No usar el Supabase CLI**                                                                     | T03c  | El binario no arranca en la CPU de la máquina de desarrollo (Intel Atom N450). Las migraciones se aplican desde el editor SQL del panel web | Sí                                                 |
| D12 | Deploy en plan Pro recién cuando hay cliente                                                    | T03c  | Los proyectos gratuitos se pausan a la semana de inactividad; mientras se desarrolla no molesta                                             | Sí                                                 |
| D13 | **Tailwind 3.4 en lugar de 4**                                                                  | T04   | La versión 4 depende de un binario nativo (lightningcss) que puede no arrancar en la CPU de la máquina de desarrollo                        | Sí                                                 |
| D14 | Código de la v1 conservado en `legacy/`                                                         | T04   | Sirve de referencia para comparar y no estorba el desarrollo nuevo                                                                          | Sí                                                 |
| D15 | Configuración de tests separada de la de Vite                                                   | T04   | Vitest arrastra su propia copia de Vite y los tipos de plugins chocaban                                                                     | Sí                                                 |
| D16 | Las tres opciones del asistente de Supabase marcadas                                            | T04   | La RLS automática evita que una tabla nueva quede abierta por olvido                                                                        | Sí                                                 |
| D17 | Navegación por hash propia, sin librería de enrutado                                            | T04b  | Cinco rutas no justifican una dependencia; además mantiene el bundle chico                                                                  | Sí                                                 |
| D18 | Componentes con propiedades en español y atributos HTML en inglés                               | T04b  | Evita las colisiones entre el nombre de la property y el del atributo real                                                                  | No (es convencion del proyecto)                    |
| D22 | La compra de urgencia es una `compra` con `proveedor_id = null`, no un tipo de movimiento nuevo | T09b  | El esquema ya lo admite y cubre todos los casos manuales reales; evita una excepción que dejaria de cuadrar                                 | Sí                                                 |
| D23 | El precio de una compra de urgencia no es opcional                                              | T09b  | Un `costo_promedio` que cambia en cascada sin aviso hace que el dueño venda a pérdida sin enterarse                                         | Sí                                                 |
| D24 | `tipo` deja de elegirse en el formulario y queda como etiqueta derivada                         | T10   | Producto y preparado se comportaban igual y ningún cálculo leía el campo                                                                    | Sí                                                 |
| D25 | Cualquier artículo puede ser vendible, tenga receta o no                                        | T10   | Habilita carnicerías, verdulerías, almacenes y revendedores sin código extra                                                                | Sí                                                 |
| D26 | `duracion_dias` es opcional y en días enteros, no una fecha                                     | T10   | La salsa dura 4 días y la harina no se pudre; una fecha obligaría a calcular                                                                | Sí                                                 |
| D27 | Un costo promedio en cero es un error, no un valor                                              | T10   | Un insumo sin costo produce márgenes falsos y el dueño los ve como buenos                                                                   | No (es la red de seguridad del cálculo)            |

### Verificación: el problema de copiar resultados a mano

El editor de Supabase solo muestra el resultado de la última consulta de un lote, y el usuario termino
transcribiendo a mano una lista de veinte filas de políticas. Se resolvio con dos artefactos:

- `supabase/verificar_rapido.sql`: una sola consulta que devuelve **un texto**: `TODO VERDE` o el
  nombre exacto del problema. Así el usuario solo tiene que informar una palabra.
- `supabase/0003_corregir_nombre_politica.sql`: corrige el nombre de una política que quedo mal escrito
  (`acceso provedores`) al copiar el archivo a mano. No cambia el comportamiento.

Regla para adelante: toda verificación que se le pida al usuario debe devolver **una sola fila y una
sola columna de texto**.

### Error de la migración 0002 y su corrección

La primera corrida dio `ERROR 42710: type "estado_pedido" already exists`. Causa: los tipos de estado
de pedido, pago y entrega ya los habia creado la migración 0001 y la 0002 los volvia a crear. Se
agregaron los `drop type if exists` correspondientes al principio de la 0002.

Detalle útil: el editor de SQL es solo un cuaderno. Pegar texto no crea nada; solo se aplica al
presionar Run. El usuario puede borrar y pegar libremente entre ejecuciones.

### Estado de la base tras aplicar 0001 y 0002

| Verificación       | Resultado                   |
| ------------------ | --------------------------- |
| Tablas             | 17                          |
| Tablas con RLS     | 17                          |
| Políticas          | 20                          |
| Funciones de apoyo | 3, todas `security_definer` |

Las 17 tablas son las 4 de la 0001 que sobreviven (`unidades`, `negocios`, `miembros`, `proveedores`)
mas las 13 de la 0002. Las 20 políticas son las 6 que quedaron de la 0001 mas las 13 de la 0002, con
una de nombre mal escrito que se corrigio en la 0003.
