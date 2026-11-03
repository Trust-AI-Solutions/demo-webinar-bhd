// Delidom · los pedidos de la demo: los ficticios de hoy y del historial (datos.js) más lo
// que se crea o cambia durante la presentación (pedidos nuevos, cambios de estado,
// clientes nuevos y alias aprendidos), guardado en el navegador con comun/estado.js.

import { crearEstado } from "../../comun/estado.js";
import { hoyISO } from "../../comun/ia.js";
import * as D from "./datos.js";

const estado = crearEstado("delidom", () => ({ creados: [], cambios: {}, alias: [], clientesNuevos: [], borrador: null }));

export const alCambiar = estado.alCambiar;
export const restablecer = estado.restablecer;
export const hoy = () => hoyISO();
export const minutosAhora = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

let cache = null;
function base() {
  const h = hoy();
  if (cache?.fecha !== h) cache = { fecha: h, ...D.generarPedidos(h) };
  return cache;
}

export function clientes() {
  return [...D.CLIENTES, ...estado.leer().clientesNuevos];
}
export const cliente = (id) => clientes().find((c) => c.id === id);

export function catalogo() {
  return { productos: D.PRODUCTOS, alias: [...D.ALIAS_BASE, ...estado.leer().alias] };
}

function aplicar(p, cambios) {
  const c = cambios[p.id];
  return c ? { ...p, ...c } : p;
}

// Pedidos recibidos hoy (los de la demo y los creados en la presentación).
export function pedidosDeHoy() {
  const e = estado.leer();
  return [...base().hoy, ...e.creados.filter((p) => p.fecha === hoy())].map((p) => aplicar(p, e.cambios));
}

export function historial() {
  return [...base().historial, ...pedidosDeHoy()];
}

export const pedido = (id) => pedidosDeHoy().find((p) => p.id === id);

// Pasa el pedido al siguiente estado; devuelve el estado anterior (para deshacer).
export function avanzar(id) {
  const p = pedido(id);
  const sig = D.siguienteEstado(p?.estado);
  if (!sig) return null;
  const ahora = minutosAhora();
  estado.modificar((e) => {
    e.cambios[id] = { ...e.cambios[id], estado: sig, ...(sig === "preparacion" ? { preparacion: ahora } : { despacho: ahora }) };
  }, { tipo: "estado", id });
  return p.estado;
}

export function fijarEstado(id, nuevo) {
  estado.modificar((e) => {
    e.cambios[id] = { ...e.cambios[id], estado: nuevo, ...(nuevo === "pendiente" ? { preparacion: null, despacho: null } : nuevo === "preparacion" ? { despacho: null } : {}) };
  }, { tipo: "estado", id });
}

// datos: { cliente_id, items: [{ producto_id, cantidad, unidad, unidades_por_bulto }], canal, origen, nota, fecha_entrega, numero_externo }
export function crearPedido(datos) {
  const c = cliente(datos.cliente_id);
  return estado.modificar((e) => {
    const numero = base().siguiente + 1 + e.creados.length;
    const p = {
      id: `D-${numero}`, cliente_id: c.id, cliente: c.nombre, ruta: datos.ruta !== undefined ? datos.ruta : c.ruta,
      estado: "pendiente", canal: datos.canal, origen: datos.origen, items: datos.items, nota: datos.nota ?? "",
      numero_externo: datos.numero_externo ?? null, fecha: hoy(), fecha_entrega: datos.fecha_entrega,
      recibido: minutosAhora(), preparacion: null, despacho: null,
    };
    e.creados.push(p);
    return p;
  }, { tipo: "pedido" });
}

export function agregarCliente({ nombre, direccion, telefono, ruta }) {
  return estado.modificar((e) => {
    const c = { id: 1000 + e.clientesNuevos.length + 1, nombre, direccion, telefono, ruta: ruta || null, tipo: "nuevo" };
    e.clientesNuevos.push(c);
    return c;
  }, { tipo: "cliente" });
}

// Alias aprendidos al confirmar un borrador (la próxima vez la línea calza sola).
export function aprender(alias) {
  if (!alias.length) return;
  estado.modificar((e) => { e.alias.push(...alias); }, { tipo: "alias" });
}

export const leerBorrador = () => estado.leer().borrador;
export function guardarBorrador(b) {
  estado.modificar((e) => { e.borrador = b; }, { tipo: "borrador" });
}
