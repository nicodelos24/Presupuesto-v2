const form = document.getElementById("form-prod");
const tabla = document.getElementById("tabla-prod");
const total = document.getElementById("ganancia-total");

const formIng = document.getElementById("form-ing");
const tablaIng = document.getElementById("tabla-ing").querySelector("tbody");
const ingImagenInput = document.getElementById("ing-imagen");

const tablaProdBody = tabla.querySelector("tbody");

const unidadSelect = document.getElementById("ing-unidad");
const contenidoInput = document.getElementById("ing-contenido");
const grupoPaquete = document.getElementById("grupo-paquete");

unidadSelect.addEventListener("change", () => {
  if (unidadSelect.value === "paquete") {
    grupoPaquete.style.display = "flex";
  } else {
    grupoPaquete.style.display = "none";
    contenidoInput.value = "";
  }
});

const costoInput = document.getElementById("costo");
const precioInput = document.getElementById("precio");
const imagenInput = document.getElementById("imagen");
const gananciaInput = document.getElementById("ganancia-deseada");

let ingredientes = JSON.parse(localStorage.getItem("ingredientes")) || [];
const productos = JSON.parse(localStorage.getItem("productos")) || [];

let gananciaTotal = 0;

function actualizarGananciaTotal() {
  const tabla = document.querySelector("#tabla-prod tbody");
  let totalGanancia = 0;

  tabla.querySelectorAll("tr").forEach((fila) => {
    const costo =
      parseFloat(fila.children[1].textContent.replace(/[^\d.-]/g, "")) || 0;
    const precio =
      parseFloat(fila.children[2].textContent.replace(/[^\d.-]/g, "")) || 0;
    totalGanancia += precio - costo;
  });

  document.getElementById("ganancia-total").textContent =
    totalGanancia.toFixed(2);
}

const conversion = {
  g: { tipo: "peso", factor: 1 },
  kg: { tipo: "peso", factor: 1000 },
  ml: { tipo: "volumen", factor: 1 },
  cl: { tipo: "volumen", factor: 10 },
  l: { tipo: "volumen", factor: 1000 },
  unidad: { tipo: "unidad", factor: 1 },
};

function obtenerTipoUnidad(unidad) {
  const conv = conversion[unidad];
  return conv ? conv.tipo : "unidad"; //si no la encuentra asumimos tipo 'unidad'
}

function convertirCantidad(cantidad, unidadOrigen, unidadDestino) {
  //si son iguales no hay nada que convertir
  if (unidadOrigen === unidadDestino) return cantidad;

  const origen = conversion[unidadOrigen];
  const destino = conversion[unidadDestino];

  // si alguna cantidad no existe devolvemos la cantidad original
  if (!origen || !destino) return cantidad;

  //solo convertir si son del mismo tipo peso a peso, o volumen a volumen
  if (origen.tipo !== destino.tipo) {
    console.warn(
      `⚠️ No se puede convertir de ${unidadOrigen} a ${unidadDestino}`
    );
    return cantidad;
  }

  //fórmula: cantidad * (factorOrigen / factorDestino)
  return (cantidad * origen.factor) / destino.factor;
}

// esto es lo de leer la imagen y convertir a Base64 y lo guarda en localStorage
function leerImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function agregarIngredienteATabla(ing) {
  const fila = document.createElement("tr");

  // calcular correctamente precio unitario
  let precioUnitario = ing.precio / ing.cantidad;
  let unidadReferencia = ing.unidad;

  //Si es un paquete. calcular precio por el contenido
  if (ing.unidad === "paquete" && ing.contenido && ing.contenidoUnidad) {
    precioUnitario = ing.precio / (ing.cantidad * ing.contenido);
    unidadReferencia = ing.contenidoUnidad; // mostrar por unidad de contenido
  }

  fila.innerHTML = `
  <td>${ing.nombre}</td>
  <td>${ing.cantidad}</td>
  <td>${ing.unidad}</td>
  <td>$${ing.precio.toFixed(2)}</td>
  <td>$${precioUnitario.toFixed(1)} por ${unidadReferencia}</td>
  <td>${ing.imagen ? `<img src="${ing.imagen}" width="50">` : "-"}</td>
  <button class ="editar-ing">✏️</button>
  <button class ="borrar-ing">🗑️</button>
  </td>
  `;
  tablaIng.appendChild(fila);

  fila.querySelector(".editar-ing").addEventListener("click", () => {
    document.getElementById("ing-nombre").value = ing.nombre;
    document.getElementById("ing-cantidad").value = ing.cantidad;
    document.getElementById("ing-unidad").value = ing.unidad;
    document.getElementById("ing-precio").value = ing.precio;

    if (ing.unidad === "paquete") {
      grupoPaquete.style.display = "flex";
      contenidoInput.value = ing.contenido;
      document.getElementById("ing-contenido-unidad").value =
        ing.contenidoUnidad;
    } else {
      grupoPaquete.style.display = "none";
    }

    // guardar indice del ingrediente en edicion
    formIng.dataset.editIndex = ingredientes.findIndex(
      (i) => i.nombre === ing.nombre
    );
    formIng.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("ing-nombre").focus();
  });

  fila.querySelector(".borrar-ing").addEventListener("click", () => {
    ingredientes = ingredientes.filter((i) => i.nombre !== ing.nombre);
    localStorage.setItem("ingredientes", JSON.stringify(ingredientes));
    fila.remove();
  });
}

// Acá se selecciona ingresar precio o calcular según porcentaje ganancia
precioInput.addEventListener("input", () => {
  if (precioInput.value !== "") {
    gananciaInput.disabled = true;
    gananciaInput.value = "";
  } else {
    gananciaInput.disabled = false;
  }
});

gananciaInput.addEventListener("input", () => {
  if (gananciaInput.value !== "") {
    precioInput.disabled = true;
    precioInput.value = "";
  } else {
    precioInput.disabled = false;
  }
});

//acá los ingredientes disponibles
const listaIngredientesUso = document.getElementById("lista-ingredientes-uso");
const agregarIngredienteUsoBtn = document.getElementById(
  "agregar-ingrediente-uso"
);
const costoIngredientesSpan = document.getElementById("costo-ingredientes");

let ingredientesUsados = []; //ingredientes para el producto actual

agregarIngredienteUsoBtn.addEventListener("click", (e) => {
  e.preventDefault();

  if (ingredientes.length === 0) {
    alert("Primero agrega ingredientes al inventario.");
    return;
  }

  // se crea contenedor del nuevo ingrediente usado
  const cont = document.createElement("div");
  cont.classList.add("ingrediente-uso");

  //creo selector con ingredientes existentes
  const select = document.createElement("select");
  ingredientes.forEach((ing) => {
    const opt = document.createElement("option");
    opt.value = ing.nombre;
    opt.textContent = `
  ${ing.nombre} ($${(ing.precio / ing.cantidad).toFixed(2)} por ${ing.unidad})
  `;
    select.appendChild(opt);
  });

  //cantidad
  const cantidadInput = document.createElement("input");
  cantidadInput.type = "number";
  cantidadInput.placeholder = "Cantidad usada";
  cantidadInput.min = "0";
  cantidadInput.step = "any";

  const unidadSelect = document.createElement("select");

  // asi se actualizan las opciones segun el tipo de unidad
  function actualizarOpcionesUnidad(unidadBase) {
    const tipo = obtenerTipoUnidad(unidadBase);
    let opciones = "";

    if (tipo === "peso") {
      opciones = `
    <optgroup label="Peso">
      <option value="g">Gramos (g)</option>
      <option value="kg">Kilogramos (kg)</option>
    </optgroup>
    `;
    } else if (tipo === "volumen") {
      opciones = `
    <optgroup label="Volumen">
      <option value="ml">Mililitros (ml)</option>
      <option value="cl">Centilitros (cl)</option>
      <option value="l">Litros (l)</option>
    </optgroup>
    `;
    } else {
      opciones = `
    <optgroup label="Unidades">
    <option value="unidad">Unidad</option>
    <option value="paquete">Paquete</option>
    </optgroup>
    `;
    }
    unidadSelect.innerHTML = opciones;
  }

  // Actualiza las opciones cuando se elige un ingrediente
  select.addEventListener("change", () => {
    const ingData = ingredientes.find((i) => i.nombre === select.value);
    if (ingData) {
      actualizarOpcionesUnidad(ingData.unidad);
    }
    actualizarCostoIngredientes();
  });

  // mostrar opciones correctas apenas se crea el campo (usando el primer ingrediente por defecto)
  if (ingredientes[0]) {
    actualizarOpcionesUnidad(ingredientes[0].unidad);
  }

  // costo parcial
  const costoParcial = document.createElement("span");
  costoParcial.textContent = "$0.00";

  //btn eliminar
  const btnBorrar = document.createElement("button");
  btnBorrar.type = "button";
  btnBorrar.textContent = "❌";
  btnBorrar.addEventListener("click", () => {
    cont.remove();
    actualizarCostoIngredientes();
  });

  // Evento para recalcular costo cuando haya cambios
  cantidadInput.addEventListener("input", actualizarCostoIngredientes);
  select.addEventListener("change", actualizarCostoIngredientes);
  unidadSelect.addEventListener("change", actualizarCostoIngredientes);

  cont.append(select, cantidadInput, unidadSelect, costoParcial, btnBorrar);
  listaIngredientesUso.prepend(cont);

  actualizarCostoIngredientes();
});

function actualizarCostoIngredientes() {
  let total = 0;
  const filas = listaIngredientesUso.querySelectorAll(".ingrediente-uso");

  ingredientesUsados = [];

  filas.forEach((fila) => {
    const selects = fila.querySelectorAll("select");
    const nombreIng = selects[0].value;
    const cantidadUsada = parseFloat(fila.querySelector("input").value) || 0;
    const unidadUsada = selects[1] ? selects[1].value : "g";
    const spanCosto = fila.querySelector("span");

    const ingData = ingredientes.find((i) => i.nombre === nombreIng);
    if (!ingData) {
      return;
    }

    let cantidadConvertida;

    // caso 1- ingrediente guardado como "paquete" pero usado en otra unidad (por ejemplo unidades o gramos)
    if (ingData.unidad === "paquete" && unidadUsada !== "paquete") {
      const contenidoEnBase = convertirCantidad(
        ingData.contenido,
        ingData.contenidoUnidad,
        unidadUsada
      );

      // costo total = precio total * fracción usada del stock total
      const costoFraccion =
        ingData.precio * (cantidadUsada / (ingData.cantidad * contenidoEnBase));

      spanCosto.textContent = `$${costoFraccion.toFixed(2)}`;
      total += costoFraccion;

      ingredientesUsados.push({
        nombre: nombreIng,
        cantidad: cantidadUsada,
        unidad: unidadUsada,
        costo: costoFraccion,
      });

      return; // sale de esta iteración, ya se calculo este ingrediente
    }

    // caso 2 -ingrediente guardado en unidades/peso pero usado en paquetes
    else if (ingData.unidad !== "paquete" && unidadUsada === "paquete") {
      const contenidoEnBase = convertirCantidad(
        ingData.contenido,
        ingData.contenidoUnidad,
        ingData.unidad
      );
      cantidadConvertida = cantidadUsada * contenidoEnBase;
    }

    // caso3 -conversión normal (sin paquetes)
    else {
      cantidadConvertida = convertirCantidad(
        cantidadUsada,
        unidadUsada,
        ingData.unidad
      );
    }

    // cálculo de costo normal
    const costoUnitario = ingData.precio / ingData.cantidad;
    const costoTotal = costoUnitario * cantidadConvertida;

    spanCosto.textContent = `$${costoTotal.toFixed(2)}`;
    total += costoTotal;

    ingredientesUsados.push({
      nombre: nombreIng,
      cantidad: cantidadUsada,
      unidad: unidadUsada,
      costo: costoTotal,
    });
  });

  // 🧾 mostrar total final
  costoIngredientesSpan.textContent = total.toFixed(2);
  costoInput.value = total.toFixed(2);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const editId = form.dataset.editId;

  let imagenProducto = "";

  // si estamos editando, mantenemos la imagen anterior
  if (form.dataset.editId !== undefined) {
    const prodExistente = productos.find((p) => p.id == form.dataset.editId);
    if (prodExistente) imagenProducto = prodExistente.imagen || "";
  }

  // si se seleccionó un archivo nuevo, lo leemos
  if (imagenInput.files[0]) {
    imagenProducto = await leerImagen(imagenInput.files[0]);
  }

  const nombre = document.getElementById("nombre").value;
  const costo = parseFloat(costoInput.value);

  if (!nombre || isNaN(costo) || costo <= 0) {
    alert("el nombre o costo no es valido");
    return;
  }

  let precioFinal;

  //comprobar si el usuario pone un precio (campo no vacio)
  if (precioInput.value !== "") {
    precioFinal = parseFloat(precioInput.value);
  } else if (gananciaInput.value !== "") {
    const porcentaje = parseFloat(gananciaInput.value);
    precioFinal = costo + (costo * porcentaje) / 100;
  } else {
    alert("Debes ingresar precio de producto o porcentaje deseado de ganancia");
    return;
  }

  //validación extra por si parseFloat devuelve un Nan
  if (isNaN(precioFinal)) {
    alert("El precio calculado no es válido. Revisa el precio/ porcentaje.");
    return;
  }

  const ganancia = precioFinal - costo;
  //const ganancia = precio - costo;
  const porcentaje = ((precioFinal - costo) / costo) * 100;

  const producto = {
    id: editId || Date.now(),
    nombre,
    costo,
    precio: precioFinal,
    ganancia,
    porcentaje,
    ingredientes: [...ingredientesUsados],
    imagen: imagenProducto,
  };

  if (editId) {
    const index = productos.findIndex((p) => p.id == editId);
    productos[index] = producto;
    delete form.dataset.editId;
    tabla.querySelector("tbody").innerHTML = "";
    productos.forEach(agregarProductoATabla);
    alert("Producto actualizado correctamente.");
  } else {
    productos.push(producto);
    agregarProductoATabla(producto);
    actualizarGananciaTotal();
    alert("Producto agregado.");
  }

  localStorage.setItem("productos", JSON.stringify(productos));

  gananciaTotal = productos.reduce((acc, p) => acc + p.ganancia, 0);
  total.textContent = gananciaTotal.toFixed(2);

  form.reset();
  precioInput.disabled = false;
  gananciaInput.disabled = false;

  listaIngredientesUso.innerHTML = "";
  ingredientesUsados = [];
  costoIngredientesSpan.textContent = "0.00";
});

formIng.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("ing-nombre").value.trim();
  const cantidad = parseFloat(document.getElementById("ing-cantidad").value);
  const unidad = document.getElementById("ing-unidad").value.trim();
  const precio = parseFloat(document.getElementById("ing-precio").value);
  const contenido = parseFloat(contenidoInput.value) || 1;
  const contenidoUnidad = document.getElementById("ing-contenido-unidad").value;
  const editIndex = formIng.dataset.editIndex;

  //validaciones primero
  if (!nombre) return alert("Ingresa un nombre para el material/ingrediente");
  if (isNaN(cantidad) || cantidad <= 0)
    return alert("La cantidad debe ser mayor a 0.");
  if (isNaN(precio) || precio <= 0)
    return alert("El precio debe ser mayor que 0.");

  const contenidoFinal = unidad === "paquete" ? contenido : 1;
  let imagen =
    formIng.dataset.editIndex !== undefined
      ? ingredientes[formIng.dataset.editIndex].imagen
      : "";
  if (ingImagenInput.files[0]) {
    imagen = await leerImagen(ingImagenInput.files[0]);
  }

  const nuevoIng = {
    nombre,
    cantidad,
    unidad,
    precio,
    contenido: contenidoFinal,
    contenidoUnidad,
    imagen,
  };

  //editar
  if (editIndex !== undefined) {
    ingredientes[editIndex] = nuevoIng; //actualizar
    delete formIng.dataset.editIndex; //limpia el flag
  } else {
    ingredientes.push(nuevoIng); //agrego
  }

  localStorage.setItem("ingredientes", JSON.stringify(ingredientes));

  tablaIng.innerHTML = ""; //refrescar la tabla
  ingredientes.forEach(agregarIngredienteATabla);

  formIng.reset(); //limpiar formulario
  grupoPaquete.style.display = "none";
});

function agregarProductoATabla(prod) {
  const fila = document.createElement("tr");
  fila.innerHTML = `
  <td>${prod.nombre}</td>
  <td>$UYU${prod.costo.toFixed(2)}</td>
  <td>$UYU${prod.precio.toFixed(2)}</td>
  <td>$UYU${prod.ganancia.toFixed(2)}</td>
  <td>${prod.porcentaje.toFixed(1)}%</td>
  <td>
  ${prod.ingredientes
    .map(
      (i) =>
        `${i.nombre} (${i.cantidad} ${i.unidad}${
          typeof i.costo === "number" ? " - $" + i.costo.toFixed(2) : ""
        })`
    )
    .join("<br>")}
  </td>
  <td>
  ${prod.imagen ? `<img src="${prod.imagen}" width="60">` : "-"}
  </td>
  <td>
  <button class="editar-prod">✏️</button>
  <button class="borrar-prod">🗑️</button>
  </td>
  `;
  tablaProdBody.appendChild(fila);

  fila.querySelector(".editar-prod").addEventListener("click", () => {
    document.getElementById("nombre").value = prod.nombre;
    costoInput.value = prod.costo;
    precioInput.value = prod.precio;
    gananciaInput.value = prod.porcentaje;

    // cargar ingredientes usados automáticamente
    listaIngredientesUso.innerHTML = "";
    ingredientesUsados = [];

    prod.ingredientes.forEach((ing) => {
      const cont = document.createElement("div");
      cont.classList.add("ingrediente-uso");

      const select = document.createElement("select");
      ingredientes.forEach((invIng) => {
        const opt = document.createElement("option");
        opt.value = invIng.nombre;
        opt.textContent = `${invIng.nombre} ($${(
          invIng.precio / invIng.cantidad
        ).toFixed(2)} por ${invIng.unidad})`;
        select.appendChild(opt);
      });
      select.value = ing.nombre;

      const cantidadInput = document.createElement("input");
      cantidadInput.type = "number";
      cantidadInput.placeholder = "Cantidad usada";
      cantidadInput.step = "any";
      cantidadInput.value = ing.cantidad;

      const unidadSelect = document.createElement("select");

      function actualizarOpcionesUnidad(unidadBase) {
        const tipo = obtenerTipoUnidad(unidadBase);
        let opciones = "";
        if (tipo === "peso") {
          opciones = `
            <optgroup label="Peso">
              <option value="g">Gramos (g)</option>
              <option value="kg">Kilogramos (kg)</option>
            </optgroup>`;
        } else if (tipo === "volumen") {
          opciones = `
            <optgroup label="Volumen">
              <option value="ml">Mililitros (ml)</option>
              <option value="cl">Centilitros (cl)</option>
              <option value="l">Litros (l)</option>
            </optgroup>`;
        } else {
          opciones = `
            <optgroup label="Unidades">
              <option value="unidad">Unidad</option>
              <option value="paquete">Paquete</option>
            </optgroup>`;
        }
        unidadSelect.innerHTML = opciones;
        unidadSelect.value = ing.unidad;
      }

      actualizarOpcionesUnidad(ing.unidad);

      const costoParcial = document.createElement("span");
      costoParcial.textContent = `$${ing.costo.toFixed(2)}`;

      const btnBorrar = document.createElement("button");
      btnBorrar.type = "button";
      btnBorrar.textContent = "❌";
      btnBorrar.addEventListener("click", () => {
        cont.remove();
        actualizarCostoIngredientes();
      });

      cantidadInput.addEventListener("input", actualizarCostoIngredientes);
      select.addEventListener("change", actualizarCostoIngredientes);
      unidadSelect.addEventListener("change", actualizarCostoIngredientes);

      cont.append(select, cantidadInput, unidadSelect, costoParcial, btnBorrar);
      listaIngredientesUso.appendChild(cont);

      ingredientesUsados.push(ing); // mantener ingredientesUsados
    });
    // fin carga de ingredientes
    actualizarCostoIngredientes();

    form.dataset.editId = prod.id;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("nombre").focus();
  });

  fila.querySelector(".borrar-prod").addEventListener("click", () => {
    if (confirm(`Deseas quitar "${prod.nombre}"?`)) {
      const index = productos.findIndex((p) => p.id === prod.id);
      productos.splice(index, 1);
      localStorage.setItem("productos", JSON.stringify(productos));
      fila.remove();
      actualizarGananciaTotal();
    }
  });
}

function cargarProductos() {
  tablaProdBody.innerHTML = ""; // limpiar la tabla antes
  productos.forEach(agregarProductoATabla);
  actualizarGananciaTotal(); // ctualizar ganancia total al cargar la página
}

function cargarIngredientes() {
  tablaIng.innerHTML = ""; // limpiar tabla
  ingredientes.forEach(agregarIngredienteATabla);
}

// llamar al cargar la página
cargarIngredientes();
cargarProductos();
