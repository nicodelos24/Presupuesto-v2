import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const target = document.getElementById("app");

if (!target) {
  throw new Error("No se encontro el contenedor #app");
}

mount(App, { target });
