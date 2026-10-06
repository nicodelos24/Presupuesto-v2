# Presupuesto v2

> **Estado del proyecto: en reconstrucción.**
> Este repositorio arranca como una copia de la v1 (`Proyecto-Fer`, una app estática en HTML, CSS y
> JavaScript vanilla) y se está reconstruyendo como un producto comercial con cuentas de usuario,
> diseño mobile first y arquitectura modular.
>
> - [PLAN_FUNCIONAL.md](PLAN_FUNCIONAL.md) — cómo debe funcionar cada pantalla, el calendario de
>   producción, los pedidos, los gastos y el manejo de fotos.
> - [MODELO_DATOS.md](MODELO_DATOS.md) — stock por movimientos, costo promedio, recetas de recetas,
>   rendimiento y merma, llegadas de proveedores y avisos.
> - [ROADMAP.md](ROADMAP.md) — visión, arquitectura y hoja de ruta por fases.
> - [IA_GUIDE.md](IA_GUIDE.md) — bitácora de pedidos, decisiones y cambios.
> - [DOCUMENTACION.md](DOCUMENTACION.md) — análisis técnico de la base heredada y sus problemas.
> - [DEUDA_TECNICA.md](DEUDA_TECNICA.md) — problemas verificados que hay hoy en el código, con cómo
>   se comprueban.
> - [Usuario-revisiones.txt](Usuario-revisiones.txt) — lista del usuario con lo que quiere corregir,
>   implementar o quitar. Cada línea arranca con un símbolo que dice en qué estado está.
>
> El código actual en `index.html`, `css/` y `js/` es **la v1 sin modificar** y describe el estado
> anterior del proyecto. Reemplazará a medida que se completen las fases.

### Acceso al repositorio

El remoto es **SSH** (`git@github.com:nicodelos24/Presupuesto-v2.git`), no HTTPS.

El proyecto se trabaja en dos computadoras, una con Linux y otra con Windows. Con una clave SSH
registrada una sola vez en GitHub, las dos funcionan sin pedir credenciales. Con HTTPS hay que
resolverlo cada vez que se cambia de máquina.

Si el remoto quedó en HTTPS por error:

```bash
git remote set-url origin git@github.com:nicodelos24/Presupuesto-v2.git
```

En una máquina nueva, después de clonar, conviene comprobar con `ssh -T git@github.com`. La
instalación de la clave en Linux y en Windows está en [IA_GUIDE.md](IA_GUIDE.md).

### Publicar la página

La publicación es con **Cloudflare Pages**, no con GitHub Pages. La razón está en
[ROADMAP.md](ROADMAP.md): GitHub Pages obliga a que el repositorio sea público, y el código de un
producto que se vende es la parte que menos se quiere exponer. Cloudflare Pages acepta repositorio
privado en plan gratuito y sin límite de ancho de banda.

La configuración, en el panel de Cloudflare, al conectar el repositorio:

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Variable `NODE_VERSION` | `22` |

**Variables de entorno** (opcionales pero recomendadas), en *Settings → Environment variables*:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sin esas variables la aplicación igual funciona: `src/lib/supabase.ts` detecta que no hay conexión
configurada y la app queda en modo local sin base de datos. Se avisó de esto al migrar el proyecto.

**No hacen falta reglas de redirección.** La navegación usa direcciones con `#` (`#/recetario`), que
se resuelven en el navegador sin pedir archivos al servidor, así que no hay que crear el `404.html`
que las aplicaciones de una sola página suelen necesitar.

Cloudflare Pages se conecta al repositorio y construye en cada push, así que no hay ningún archivo de
configuración en el proyecto ni workflow de despliegue que mantener.

---

# Proyecto Fer — Calculadora de presupuestos y costos

Aplicación web de una sola página para calcular el **costo real de productos** (por ejemplo, recetas de
pastelería o artesanía) a partir de un inventario de insumos, y definir su **precio de venta** en
pesos uruguayos (UYU). _Esta sección describe la v1._

- **Autor:** [nicodelos24](https://github.com/nicodelos24)
- **Repositorio base:** https://github.com/nicodelos24/Proyecto-Fer
- **Licencia:** sin licencia declarada
- **Stack:** HTML + CSS + JavaScript puro (vanilla). Sin frameworks, sin dependencias, sin build.

---

## 1. ¿Qué hace?

El usuario carga dos tipos de datos y la aplicación cruza ambos:

| Entrada                       | Dónde                            | Para qué sirve                                           |
| ----------------------------- | -------------------------------- | -------------------------------------------------------- |
| **Ingredientes** (inventario) | Formulario _Guardar ingrediente_ | Saber cuánto se paid por unidad real de cada insumo      |
| **Productos**                 | Formulario _Guardar_             | Calcular cuánto le cuesta producirlo y a cuánto venderlo |

### Flujo de uso típico

1. **Cargar el inventario.** Se registra cada insumo con su cantidad comprada, su unidad y lo que se
   pagó por el lote. Ej: `Harina — 25 kg — $1.200`. La app calcula sola el precio por kilo.
2. **Cargar el producto.** Se elige uno o más ingredientes del inventario, se indica la cantidad usada
   de cada uno, y la app suma el costo real de la receta, escribiéndolo en el campo _Costo en $UYU_.
3. **Definir el precio de venta.** De dos maneras excluyentes:
   - escribiendo el **precio** directamente, o
   - escribiendo el **% de ganancia deseado**, y la app lo calcula como
     `precio = costo + costo × %`.
4. **Consultar resultados.** La tabla de productos muestra costo, precio, ganancia en pesos y
   ganancia porcentual, más el detalle de ingredientes usados. Al pie se acumula la
   **ganancia total** de todos los productos.

Todo se guarda automáticamente en el navegador (`localStorage`). No hay servidor, no hay base de
datos, no hay login: los datos son locales a ese navegador y esa máquina.

---

## 2. Cómo ejecutarlo

Es una web estática pura, así que hay tres formas, de la más simple a la más completa:

**Opción A — abrir el archivo directamente**

```bash
xdg-open index.html      # o doble clic en index.html
```

**Opción B — servidor local (recomendado)**

```bash
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

**Opción C — GitHub Pages**

```bash
git push origin master
# Settings > Pages > Deploy from a branch > master / (root)
```

> La app **no necesita conexión a internet** ni dependencias. El archivo `index.zip` en la raíz es
> una copia empaquetada del sitio ya publicado y no es necesario para nada del desarrollo.

---

## 3. Estructura del proyecto

```
Proyecto-Fer/
├── index.html          # Estructura: 2 formularios + 2 tablas + total
├── css/
│   └── style.css       # Estilos (rosa pastel, tema "dulce")
├── js/
│   └── script.js       # Toda la lógica de la aplicación (649 líneas)
├── index.zip           # Copia empaquetada del sitio publicado (artefacto)
└── README.md           # Este documento
```

Todo el JavaScript vive en **un único archivo** sin módulos ni clases: son constantes globales de
referencia al DOM, funciones puras de cálculo y listeners de eventos. Para entender el proyecto
basta con leer `index.html` (qué existe) y `script.js` (qué hace).

---

## 4. Unidades y conversiones

Es el corazón del cálculo de costos. Las unidades se agrupan por _tipo_, y solo se puede convertir
dentro de un mismo tipo:

| Tipo    | Unidades            | Factor a la base     |
| ------- | ------------------- | -------------------- |
| Peso    | `g`, `kg`           | 1 g, 1000 g          |
| Volumen | `ml`, `cl`, `l`     | 1 ml, 10 ml, 1000 ml |
| Unidad  | `unidad`, `paquete` | 1                    |

Fórmula: `cantidadConvertida = cantidad × (factorOrigen / factorDestino)`

Ejemplo: un ingrediente guardado en `kg` (precio por kilo = `precio / cantidad`) que se usa en la
receta como `500 g` → se convierte `500 g → 0.5 kg` y el costo es `0.5 × precioPorKilo`.
Nunca se mezclan pesos con volumen: la app avisa por consola y devuelve el valor sin convertir.

---

## 5. Fórmulas de negocio

```text
Precio unitario del insumo   = precio del lote / cantidad del lote
Precio unitario (paquete)    = precio del lote / (cantidad × contenido)

Costo del producto           = Σ costo de cada ingrediente usado
                               (cantidad usada × precio unitario, ya convertido)

Precio por % ganancia        = costo + (costo × porcentaje / 100)
Ganancia                     = precio − costo
Porcentaje de ganancia       = (precio − costo) / costo × 100
Ganancia total               = Σ (precio − costo) de todos los productos
```

El porcentaje de ganancia es **margen sobre el costo** (markup), no sobre el precio de venta.

---

## 6. Documentación técnica

El detalle completo — arquitectura, modelo de datos, flujo de cada función, catálogo de funciones,
y un análisis de problemas detectados y mejoras sugeridas — está en
**[DOCUMENTACION.md](DOCUMENTACION.md)**.

---

## 7. Estado actual y limitaciones conocidas

- Solo 2 commits, sin `package.json`, sin tests, sin linter, sin `.gitignore`.
- Sin reacción a cambios en insumos: si editás o borrás un ingrediente, los productos ya guardados
  conservan el costo antiguo hasta que los edites a mano.
- El límite de `localStorage` (~5 MB) puede agotarse si se cargan muchas imágenes en Base64.
- Los nombres de ingredientes se usan como identificador único: dos ingredientes con el mismo
  nombre colisionan.
- `index.zip` duplica el código fuente en el repositorio y puede desincronizarse.
