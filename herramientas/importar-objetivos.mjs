/* ===============================================================
   importar-objetivos.mjs - Vuelca las hojas de objetivos de Excel
   en content/objetivos.js
   ---------------------------------------------------------------
   Uso:  node herramientas/importar-objetivos.mjs --carpeta "C:\ruta" [--ano 2026]

   Lee todos los libros "OBJETIVOS <NOMBRE>.xlsx" de la carpeta. Cada
   libro tiene una hoja por mes con la misma rejilla:
     A = objetivo · C = puntos dados · E = puntuación máxima ·
     F = resultado real · G = meta
   Solo se leen esas columnas: los comentarios de las demás (que
   pueden llevar nombres de clientes) no se tocan ni se guardan.

   - Las hojas sin puntos (plantillas vacías) se ignoran.
   - Los puntos históricos se guardan tal cual se dieron («fijados»);
     los resultados numéricos (clientes, euros, reseñas…) también, para
     que el portal pueda enseñar meta frente a resultado.
   - Las metas de cada persona salen de la columna G de su último mes
     puntuado. Se pueden cambiar después en el panel.
   - Lo que ya existiera en objetivos.js (plantillas, personas, otros
     meses) se conserva; los meses importados se sobrescriben.
   =============================================================== */

import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { leerXlsx } from './xlsx.mjs';
import { RAIZ, serializarObjetivos, escribirAtomico, normalizarObjetivos } from './contenido.mjs';

/* ── Argumentos ──────────────────────────────────────────────── */
const argumento = (nombre, porDefecto) => {
  const i = process.argv.indexOf('--' + nombre);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto;
};
const CARPETA = argumento('carpeta', '');
const ANO = Number(argumento('ano', new Date().getFullYear()));
if (!CARPETA) {
  console.error('\n  Indica la carpeta con los libros: --carpeta "C:\\ruta\\a\\los\\excel"\n');
  process.exit(1);
}

/* ── Plantillas canónicas ────────────────────────────────────── */
const PLANTILLAS = {
  comercial: {
    titulo: 'Objetivos comerciales',
    objetivos: [
      { id: 'captacion', texto: 'Captación de nuevos clientes', max: 0.25, tipo: 'proporcional', meta: 15, unidad: 'clientes' },
      { id: 'cerrados', texto: 'Expedientes cerrados', max: 1, tipo: 'relativo', base: 'captacion', proporcion: 0.5, unidad: 'expedientes' },
      { id: 'mn', texto: 'MN', max: 1, tipo: 'valoracion' },
      { id: 'contabilidad', texto: 'Contabilidad y control de clientes', max: 1, tipo: 'valoracion' },
      { id: 'facturacion', texto: 'Facturación', max: 4, tipo: 'proporcional', meta: 15000, unidad: '€' },
      { id: 'colaboraciones', texto: 'Colaboraciones externas', max: 0.5, tipo: 'proporcional', meta: 2, unidad: 'colaboraciones' },
      { id: 'rrss', texto: 'RRSS', max: 1, tipo: 'valoracion' },
      { id: 'resenas', texto: 'Reseñas de Google', max: 1, tipo: 'proporcional', meta: 15, unidad: 'reseñas' },
      { id: 'limpieza', texto: 'Limpieza y material', max: 0.25, tipo: 'valoracion' },
      { id: 'actitud', texto: 'Actitud (punto extra)', max: 1, tipo: 'valoracion', extra: true }
    ]
  },
  marketing: {
    titulo: 'Objetivos de marketing',
    objetivos: [
      { id: 'contenidos', texto: 'Guiones, calendario y publicaciones (posts, vídeos, reels)', max: 2, tipo: 'valoracion' },
      { id: 'colaboraciones', texto: 'Colaboraciones', max: 0.5, tipo: 'proporcional', meta: 2, unidad: 'colaboraciones' },
      { id: 'branding', texto: 'Branding (imagen de marca)', max: 1, tipo: 'valoracion' },
      { id: 'captacion-rrss', texto: 'Captación comercial de clientes a través de RRSS', max: 1, tipo: 'proporcional', meta: 3, unidad: 'clientes' },
      { id: 'seguidores', texto: 'Crecimiento de seguidores en RRSS', max: 1, tipo: 'valoracion' },
      { id: 'eventos', texto: 'Participación en eventos', max: 0.5, tipo: 'proporcional', meta: 1, unidad: 'eventos' },
      { id: 'merchandising', texto: 'Merchandising (presentaciones, folletos, regalos)', max: 0.75, tipo: 'valoracion' },
      { id: 'proyectos', texto: 'Proyectos (nuevas aperturas)', max: 1, tipo: 'valoracion' },
      { id: 'resenas', texto: 'Reseñas (seguimiento de oficinas, principal Madrid)', max: 1, tipo: 'valoracion' },
      { id: 'offline', texto: 'Captación de clientes offline (publicidad)', max: 0.25, tipo: 'proporcional', meta: 1, unidad: 'acciones' },
      { id: 'historias', texto: 'Historias diarias en WhatsApp e Instagram', max: 1, tipo: 'valoracion' },
      { id: 'actitud', texto: 'Actitud (punto extra)', max: 1, tipo: 'valoracion', extra: true }
    ]
  }
};

/* Cómo reconocer cada objetivo por su texto en la hoja (ya normalizado). */
const RECONOCER = [
  ['marketing', 'contenidos', /^guiones/],
  ['marketing', 'branding', /^branding/],
  ['marketing', 'captacion-rrss', /^captacion comercial/],
  ['marketing', 'seguidores', /^crecimiento seguidores/],
  ['marketing', 'eventos', /^participacion en eventos/],
  ['marketing', 'merchandising', /^merchandising/],
  ['marketing', 'proyectos', /^proyectos/],
  ['marketing', 'resenas', /^resenas \(seguimiento/],
  ['marketing', 'offline', /^captacion clientes offline/],
  ['marketing', 'historias', /^historias diarias/],
  ['marketing', 'colaboraciones', /^colaboraciones$/],
  ['comercial', 'captacion', /^captacion nuevos clientes/],
  ['comercial', 'cerrados', /^expedientes cerrados/],
  ['comercial', 'mn', /^mn\b/],
  ['comercial', 'contabilidad', /^contabilidad/],
  ['comercial', 'facturacion', /^facturacion/],
  ['comercial', 'colaboraciones', /^colaboraciones externas/],
  ['comercial', 'rrss', /^rrss/],
  ['comercial', 'resenas', /^resenas google/],
  ['comercial', 'limpieza', /^limpieza/],
  ['ambas', 'actitud', /actitud/]
];

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, sept: 9, octubre: 10, noviembre: 11, diciembre: 12
};

/* ── Utilidades ──────────────────────────────────────────────── */
const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/^\s*\d+\s*[.)-]?\s*/, '').replace(/\s+/g, ' ').trim();
const valorDe = (c) => (c && typeof c === 'object' && 'v' in c) ? c.v : c;
const numero = (v) => {
  v = valorDe(v);
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const limpio = v.replace(/[^\d,.\-]/g, '').replace(',', '.');
  if (!limpio || /^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
};

/* Meta de la columna G: número, rango "15-30" o porcentaje "70%". */
function meta(v, objetivoId) {
  v = valorDe(v);
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return null;   // Excel lo convirtió en fecha
  const texto = String(v).trim();
  if (/%/.test(texto)) {
    const n = Number(texto.replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : null;
  }
  const rango = /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/.exec(texto);
  let n;
  if (rango) {
    const a = Number(rango[1].replace(',', '.')), b = Number(rango[2].replace(',', '.'));
    // El objetivo es el mínimo del rango; en captación la referencia
    // habitual del despacho son 15 clientes si el rango la incluye.
    n = objetivoId === 'captacion' ? Math.max(a, Math.min(b, 15)) : a;
  } else {
    n = numero(texto);
  }
  if (n === null) return null;
  if (objetivoId === 'facturacion' && n < 1000) n *= 1000;   // «15-20» son miles de euros
  if (objetivoId === 'resenas' && n < 5) return null;        // un 0.6 copiado de otra fila
  return n;
}

function reconocer(textoA) {
  const t = normalizar(textoA);
  if (!t || t.startsWith('total') || t.startsWith('puntuacion') || t.startsWith('temas')) return null;
  for (const [plantilla, id, patron] of RECONOCER) if (patron.test(t)) return { plantilla, id };
  return null;
}

/* ── Lectura de un libro ─────────────────────────────────────── */
function leerLibro(ruta) {
  const meses = [];
  for (const hoja of leerXlsx(ruta)) {
    const clave = normalizar(hoja.nombre).replace(/\s.*$/, '');
    const numMes = MESES[clave];
    if (!numMes) continue;
    const ano = numMes === 12 && ANO ? ANO - 1 : ANO;   // diciembre es del año anterior
    const mes = ano + '-' + String(numMes).padStart(2, '0');

    const puntos = {}, resultados = {}, metas = {}, maximos = {};
    const plantillas = { comercial: 0, marketing: 0 };
    for (const fila of hoja.filas) {
      const c = fila.celdas;
      const obj = reconocer(c.A);
      if (!obj) continue;
      if (obj.plantilla !== 'ambas') plantillas[obj.plantilla]++;
      const p = numero(c.C);
      if (p !== null) puntos[obj.id] = Math.round(p * 100) / 100;
      const r = numero(c.F);
      if (r !== null) resultados[obj.id] = obj.id === 'facturacion' && r > 0 && r < 1000 ? r * 1000 : r;
      const m = meta(c.G, obj.id);
      if (m !== null) metas[obj.id] = m;
      const mx = numero(c.E);
      if (mx !== null) maximos[obj.id] = mx;
    }
    // Plantillas vacías o meses a medio rellenar (menos de la mitad de
    // los objetivos puntuados) no cuentan.
    const reconocidos = plantillas.comercial + plantillas.marketing + (puntos.actitud !== undefined ? 1 : 0);
    if (!Object.keys(puntos).length || Object.keys(puntos).length < Math.max(3, reconocidos / 2)) continue;
    meses.push({ mes, plantilla: plantillas.marketing > plantillas.comercial ? 'marketing' : 'comercial', puntos, resultados, metas });
  }
  return meses;
}

/* ── Importación ─────────────────────────────────────────────── */
const archivos = readdirSync(CARPETA).filter((a) => /^objetivos\s+.+\.xlsx$/i.test(a) && !a.startsWith('~$')).sort();
if (!archivos.length) {
  console.error('\n  En esa carpeta no hay libros "OBJETIVOS <NOMBRE>.xlsx".\n');
  process.exit(1);
}

const url = pathToFileURL(join(RAIZ, 'content', 'objetivos.js')).href + '?v=' + Date.now();
let existente = {};
try { existente = (await import(url)).default || {}; } catch (e) { existente = {}; }
const datos = normalizarObjetivos(existente);
if (!Object.keys(datos.plantillas).length) datos.plantillas = JSON.parse(JSON.stringify(PLANTILLAS));
for (const [id, p] of Object.entries(PLANTILLAS)) if (!datos.plantillas[id]) datos.plantillas[id] = JSON.parse(JSON.stringify(p));

console.log('');
let totalMeses = 0;
for (const archivo of archivos) {
  const nombreBruto = archivo.replace(/\.xlsx$/i, '').replace(/^objetivos\s+/i, '').trim();
  const nombre = nombreBruto.charAt(0).toUpperCase() + nombreBruto.slice(1).toLowerCase();
  const id = normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let meses;
  try { meses = leerLibro(resolve(CARPETA, archivo)); } catch (e) { console.log('  ' + archivo + ': no se ha podido leer (' + e.message + ')'); continue; }

  const plantilla = meses.length ? meses[meses.length - 1].plantilla : 'comercial';
  let persona = datos.personas.find((p) => p.id === id);
  if (!persona) {
    persona = { id, nombre, correo: '', plantilla, metas: {} };
    datos.personas.push(persona);
  } else {
    persona.nombre = persona.nombre || nombre;
    persona.plantilla = persona.plantilla || plantilla;
  }
  // Metas: para cada objetivo medible, la de la hoja más reciente que
  // la tenga, sin pisar las que ya se hubieran ajustado en el panel.
  const base = datos.plantillas[persona.plantilla];
  if (base) {
    for (const o of base.objetivos) {
      if (o.tipo === 'valoracion') continue;
      if (persona.metas[o.id] !== undefined && persona.metas[o.id] !== '') continue;
      for (let i = meses.length - 1; i >= 0; i--) {
        const valor = meses[i].metas[o.id];
        if (valor === undefined) continue;
        if (o.tipo === 'relativo' ? (valor > 0 && valor <= 1) : valor >= 1) { persona.metas[o.id] = valor; break; }
      }
      // Las metas iguales a las de la plantilla sobran.
      const porDefecto = o.tipo === 'relativo' ? o.proporcion : o.meta;
      if (persona.metas[o.id] !== undefined && Number(persona.metas[o.id]) === Number(porDefecto)) delete persona.metas[o.id];
    }
  }

  for (const m of meses) {
    datos.meses[m.mes] = datos.meses[m.mes] || {};
    datos.meses[m.mes][id] = { resultados: m.resultados, puntos: m.puntos };
    totalMeses++;
  }
  const totales = meses.map((m) => m.mes.slice(5) + ': ' + Object.values(m.puntos).reduce((n, v) => n + v, 0).toFixed(2)).join(' · ');
  console.log('  ' + nombre.padEnd(10) + (meses.length ? meses.length + ' meses (' + plantilla + ') → ' + totales : 'sin meses puntuados (solo plantilla)'));
}

datos.personas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
await escribirAtomico(join(RAIZ, 'content', 'objetivos.js'), serializarObjetivos(datos));
console.log('\n  Guardado content/objetivos.js: ' + datos.personas.length + ' personas, ' + totalMeses + ' meses importados.\n');
