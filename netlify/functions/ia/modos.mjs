// Todos los agentes de la demo, en un solo registro. Cada solución define los suyos en su
// archivo (minis.mjs, rodelo.mjs, delidom.mjs) con esta forma:
//   "minis-chofer": { instrucciones: "...", definiciones: [...], documento: false }
// - instrucciones: fijas (sin fechas ni datos que cambien) para que la caché de Claude las reutilice.
// - definiciones: las herramientas, definidas una sola vez en public/<solución>/js/definiciones.js
//   (con la etiqueta que ve la persona); aquí se quita la etiqueta.
// - documento: true para un agente lector (recibe un PDF, una foto o un texto pegado en un solo mensaje).

import { AGENTES as MINIS } from "./minis.mjs";
import { AGENTES as RODELO } from "./rodelo.mjs";
import { AGENTES as DELIDOM } from "./delidom.mjs";

// La API de Claude solo acepta name, description e input_schema.
const paraClaude = (lista) => lista.map(({ name, description, input_schema }) => ({ name, description, input_schema }));

export const MODOS = Object.fromEntries(
  Object.entries({ ...MINIS, ...RODELO, ...DELIDOM }).map(([nombre, a]) => [nombre, { instrucciones: a.instrucciones, herramientas: paraClaude(a.definiciones), documento: !!a.documento }]),
);
