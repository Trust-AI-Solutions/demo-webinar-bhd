// Delidom · calce de las líneas leídas por la IA con el catálogo.
// Igual que en la solución real: la IA solo TRANSCRIBE lo que dice el mensaje o la
// orden de compra ('JUGO CHINOLA 12 OZ (DELIDOM)', '4 galones de chinola'); el producto
// lo decide este módulo con reglas verificables, y si hay empate no adivina.
//
// Orden de intentos, del más confiable al menos:
//   1. código de barras (EAN)  — así vienen las órdenes de los supermercados
//   2. código del cliente      — alias aprendido de pedidos anteriores
//   3. alias de texto          — descripción que alguien ya confirmó antes
//   4. descripción del catálogo — texto normalizado idéntico
//   5. sabor + presentación    — deducción; si hay empate deja la línea para elegir
// Sin DOM: las pruebas (pruebas/delidom.prueba.mjs) importan este mismo archivo.

export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/Ñ/gi, "N")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function presentacion(descripcion) {
  const d = normalizar(descripcion);
  const oz = /\b(128|64|32|16|12|8|6)\s*(?:OZ|ONZ)\b/.exec(d);
  if (oz) return oz[1] === "128" ? "GL" : `${oz[1]}oz`;
  if (/\b(GL|GAL|GALON|GALONES)\b/.test(d) || /\b128\b/.test(d)) return "GL";
  if (/\b(LB|LIBRA|LIBRAS)\b/.test(d)) return "LB";
  return null;
}

// '... 12oz - 20 UND' llega normalizado como '... 12OZ 20 UND'.
export function unidadesPorBulto(descripcion) {
  const m = /\b(\d{1,3})\s*UND\b/.exec(normalizar(descripcion));
  return m ? +m[1] : null;
}

// Línea de producto: distingue 'JUGO DE CHINOLA / GL' de 'PULPA DE CHINOLA / GL'.
export function familia(descripcion) {
  const d = normalizar(descripcion);
  if (/\bPULPA/.test(d)) return "pulpa";
  if (/\bJUGO/.test(d)) return "jugo";
  return null;
}

// Solo el sabor: 'JUGO PITAHAYA GUANABANA 12 OZ (DELIDOM)' -> 'pitahaya guanabana'.
export function sabor(descripcion) {
  const d = normalizar(descripcion)
    .replace(/\b\d{1,3}\s*UND\b/g, "")
    .replace(/\b(128|64|32|16|12|8|6)\s*(?:OZ|ONZ)\b/g, "")
    .replace(/\b(GL|GAL|GALON|GALONES|LB|LIBRA|LIBRAS|UND|UN|UNIDAD|UNIDADES|FDO|FDOS|FARDO|FARDOS|FUNDA|FUNDAS|CAJA|CAJAS)\b/g, "")
    .replace(/\bDELIDOM\b/g, "")
    .replace(/\b(JUGOS?|PULPAS?)\b/g, "")
    .replace(/\b\d+\b/g, "")
    .replace(/\b(DE|DEL|LA|EL|POR|Y)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (d || normalizar(descripcion)).toLowerCase();
}

// 'FDO', 'fundas', 'galones', 'UN' -> la unidad del pedido.
export function unidadNormalizada(texto, desc) {
  const u = normalizar(texto);
  if (/\bFDO|FARDO|FUNDA/.test(u)) return "FDO"; // fardo o funda: un bulto con varias unidades
  if (/\bCAJA/.test(u)) return "CAJA";
  if (/\bGL|GAL/.test(u)) return "GL";
  if (/\bLB|LIBRA/.test(u)) return "LB";
  if (["UN", "UND", "UNIDAD", "UNIDADES"].includes(u)) return "UN";
  const p = presentacion(desc ?? texto);
  if (p === "GL") return "GL";
  if (p === "LB") return "LB";
  return "UN";
}

const soloDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const esEan = (v) => /^\d{13}$/.test(soloDigitos(v));

export const METODOS = {
  ean: "código de barras",
  codigo_cliente: "código del cliente",
  alias_texto: "aprendido de un pedido anterior",
  catalogo: "igual al catálogo",
  sabor_presentacion: "sabor y tamaño",
};

// item: { descripcion, codigo_externo, ean, cantidad, unidad, unidades_por_bulto }
// catalogo: { productos: [{ id, codigo, descripcion, sabor, presentacion, familia }], alias: [{ producto_id, cliente_id, codigo_externo, ean, descripcion_normalizada }] }
export function mapearItem(item, catalogo, clienteId = null) {
  const { productos, alias } = catalogo;
  const base = {
    ...item,
    unidad: unidadNormalizada(item.unidad, item.descripcion),
    producto_id: null, producto_codigo: null, producto_descripcion: null,
    metodo: null, motivo: null, supuesto: false, candidatos: [], cantidad_unidades: null,
  };
  const porId = new Map(productos.map((p) => [p.id, p]));
  const resolver = (id, metodo) => {
    const p = porId.get(id);
    if (!p) return { ...base, motivo: "el alias apunta a un producto que ya no está en el catálogo" };
    const bulto = item.unidades_por_bulto ?? unidadesPorBulto(p.descripcion);
    return {
      ...base, producto_id: p.id, producto_codigo: p.codigo, producto_descripcion: p.descripcion, metodo,
      unidades_por_bulto: bulto,
      cantidad_unidades: base.unidad === "FDO" && bulto ? +(item.cantidad * bulto).toFixed(2) : item.cantidad,
    };
  };

  // 1) EAN
  const ean = esEan(item.ean) ? soloDigitos(item.ean) : null;
  if (ean) {
    const porAlias = alias.find((a) => a.ean && soloDigitos(a.ean) === ean);
    if (porAlias) return resolver(porAlias.producto_id, "ean");
    const porCodigo = productos.find((p) => soloDigitos(p.codigo) === ean || soloDigitos(p.ean) === ean);
    if (porCodigo) return resolver(porCodigo.id, "ean");
  }

  // 2) Código del cliente: primero el alias de ESE cliente.
  const codigo = String(item.codigo_externo ?? "").trim();
  if (codigo) {
    const propio = alias.find((a) => a.codigo_externo === codigo && a.cliente_id === clienteId);
    if (propio) return resolver(propio.producto_id, "codigo_cliente");
    const global = alias.find((a) => a.codigo_externo === codigo && a.cliente_id === null);
    if (global) return resolver(global.producto_id, "codigo_cliente");
    const enCatalogo = productos.find((p) => p.codigo === codigo);
    if (enCatalogo) return resolver(enCatalogo.id, "codigo_cliente");
  }

  const norma = normalizar(item.descripcion);

  // 3) Alias de texto confirmado por alguien del equipo.
  const aliasTexto = alias.find((a) => a.descripcion_normalizada === norma && (a.cliente_id === clienteId || a.cliente_id === null));
  if (aliasTexto) return resolver(aliasTexto.producto_id, "alias_texto");

  // 4) Descripción idéntica a la del catálogo.
  const exacto = productos.find((p) => normalizar(p.descripcion) === norma);
  if (exacto) return resolver(exacto.id, "catalogo");

  // 5) Línea + sabor + presentación, de más estricta a más permisiva; se para en la
  // primera estrategia que deja UN solo candidato. Si tuvo que relajar algo, queda
  // marcada como supuesto para que el panel la resalte antes de confirmar.
  const s = sabor(item.descripcion);
  const f = familia(item.descripcion);
  const p = presentacion(item.descripcion) ?? (base.unidad === "GL" ? "GL" : base.unidad === "LB" ? "LB" : null);
  const palabras = s.split(" ").filter((w) => w.length > 2);

  const mismoSabor = (x) => x.sabor === s;
  const saborContenido = (x) => palabras.length > 0 && palabras.every((w) => (x.sabor ?? "").includes(w));
  const mismaPresentacion = (x) => !p || x.presentacion === p;
  const mismaFamilia = (x) => x.familia === f;
  // Si el mensaje no dice si es jugo o pulpa ('4 galones de chinola'), se prefiere jugo,
  // la línea principal del negocio.
  const familiaPreferida = (x) => x.familia === "jugo";

  const sinLinea = "el mensaje no dice si es jugo o pulpa — se asumió JUGO";
  const otraLinea = f ? `no hay ${f} con ese sabor y tamaño — se tomó la otra línea` : "se ignoró la línea (jugo o pulpa) para poder calzarlo";
  // Sin línea en el mensaje: si solo existe un producto con ese sabor y tamaño, no hay
  // nada que suponer; el supuesto se marca solo cuando jugo y pulpa compiten.
  const sinLineaUnico = f === null ? [(x) => mismoSabor(x) && mismaPresentacion(x), (x) => saborContenido(x) && mismaPresentacion(x)] : [];
  const estrategias = [
    { filtro: (x) => mismoSabor(x) && mismaPresentacion(x) && mismaFamilia(x), supuesto: null },
    ...(f === null ? [{ filtro: sinLineaUnico[0], supuesto: null }, { filtro: (x) => mismoSabor(x) && mismaPresentacion(x) && familiaPreferida(x), supuesto: sinLinea }] : []),
    { filtro: (x) => mismoSabor(x) && mismaPresentacion(x), supuesto: otraLinea },
    { filtro: (x) => saborContenido(x) && mismaPresentacion(x) && mismaFamilia(x), supuesto: null },
    ...(f === null ? [{ filtro: sinLineaUnico[1], supuesto: null }, { filtro: (x) => saborContenido(x) && mismaPresentacion(x) && familiaPreferida(x), supuesto: sinLinea }] : []),
    { filtro: (x) => saborContenido(x) && mismaPresentacion(x), supuesto: otraLinea },
  ];

  let ultimos = [];
  for (const { filtro, supuesto } of estrategias) {
    const candidatos = productos.filter(filtro);
    if (candidatos.length === 1) {
      const mapeado = resolver(candidatos[0].id, "sabor_presentacion");
      return supuesto ? { ...mapeado, supuesto: true, motivo: supuesto } : mapeado;
    }
    if (candidatos.length > 1 && !ultimos.length) ultimos = candidatos;
  }

  return {
    ...base,
    motivo: ultimos.length
      ? `hay ${ultimos.length} productos que calzan — elija cuál`
      : `no está en el catálogo${p ? ` con tamaño ${p === "GL" ? "galón" : p === "LB" ? "libra" : p}` : " (falta el tamaño: galón, 32 oz, libra…)"}`,
    candidatos: ultimos.slice(0, 8).map((c) => ({ id: c.id, codigo: c.codigo, descripcion: c.descripcion })),
  };
}

// Calza el nombre que leyó la IA con la lista de clientes.
// clientes: [{ id, nombre, ruta }]
export function mapearCliente(nombre, clientes) {
  const norma = normalizar(nombre);
  if (!norma) return { cliente_id: null, ruta: null, motivo: "el documento no trae el nombre del cliente", candidatos: [] };
  const conNorma = clientes.map((c) => ({ ...c, n: normalizar(c.nombre) }));
  const exacto = conNorma.find((c) => c.n === norma);
  if (exacto) return { cliente_id: exacto.id, ruta: exacto.ruta ?? null, motivo: null, candidatos: [] };
  // 'DOÑA MATI' contra 'Cafetería Doña Mati', 'SUPERMERCADOS LA CADENA, SRL' contra 'Supermercado La Cadena'.
  const sinSufijo = (t) => t.replace(/\b(SRL|S R L|SA|S A|EIRL)\b/g, "").replace(/\bSUPERMERCADOS\b/g, "SUPERMERCADO").trim();
  const n2 = sinSufijo(norma);
  const parciales = conNorma.filter((c) => { const m = sinSufijo(c.n); return m.includes(n2) || n2.includes(m); });
  if (parciales.length === 1) return { cliente_id: parciales[0].id, ruta: parciales[0].ruta ?? null, motivo: null, candidatos: [] };
  return {
    cliente_id: null,
    ruta: null,
    motivo: parciales.length
      ? `hay ${parciales.length} clientes parecidos a "${nombre}" — elija cuál`
      : `"${nombre}" no está en la lista de clientes — elíjalo o agréguelo`,
    candidatos: parciales.slice(0, 8).map((c) => ({ id: c.id, nombre: c.nombre })),
  };
}

// Fecha que leyó la IA: AAAA-MM-DD segura, una fecha ambigua tal cual ('12/11/2026') o nada.
// Devuelve { iso, opciones } — opciones son las dos lecturas posibles cuando es ambigua.
export function interpretarFecha(texto) {
  const t = String(texto ?? "").trim();
  if (!t) return { iso: null, opciones: [] };
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return { iso: t, opciones: [] };
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t);
  if (!m) return { iso: null, opciones: [] };
  const anio = m[3].length === 2 ? `20${m[3]}` : m[3];
  const a = +m[1], b = +m[2];
  const iso = (d, mes) => `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (a > 12 && b <= 12) return { iso: iso(a, b), opciones: [] };
  if (b > 12 && a <= 12) return { iso: iso(b, a), opciones: [] };
  if (a === b) return { iso: iso(a, b), opciones: [] };
  return { iso: null, opciones: [iso(a, b), iso(b, a)] }; // día/mes primero, luego mes/día
}
