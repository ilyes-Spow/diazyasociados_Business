/* ===============================================================
   contenido.mjs - Lectura y escritura de los archivos de content/
   ---------------------------------------------------------------
   El panel de administración usa este módulo para leer los
   contenidos actuales y volver a escribirlos manteniendo el mismo
   formato que si se hubieran editado a mano.
   =============================================================== */

import { readFile, writeFile, rename, unlink, readdir, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_MODULOS = join(RAIZ, 'content', 'modulos');
const DIR_COPIAS = join(RAIZ, '.copias-admin');

/* ── Serialización ───────────────────────────────────────────── */

/* Cadena entre comillas simples, con los escapes necesarios. */
export function comillas(valor) {
  return "'" + String(valor)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n') + "'";
}

/* Texto largo dentro de una plantilla. Hay que neutralizar el
   acento grave y la secuencia de interpolación. */
export function plantilla(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/* Identificador seguro para archivos y rutas, a partir de un título. */
export function aIdentificador(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sin-titulo';
}

const dosDigitos = (n) => String(n).padStart(2, '0');
export const nombreArchivo = (mod) => dosDigitos(mod.num) + '-' + mod.id + '.js';

/* ── Escritura de un módulo ──────────────────────────────────── */
export function serializarModulo(mod) {
  const etiquetas = (mod.etiquetas || []).map(comillas).join(', ');

  const lecciones = (mod.lecciones || []).map((lec) => {
    const cuerpo = String(lec.md || '').replace(/^\n+|\n+$/g, '');
    return [
      '    {',
      '      id: ' + comillas(lec.id) + ',',
      '      titulo: ' + comillas(lec.titulo) + ',',
      '      md: `',
      plantilla(cuerpo),
      '`',
      '    }'
    ].join('\n');
  }).join(',\n');

  return [
    'export default {',
    '  id: ' + comillas(mod.id) + ',',
    '  num: ' + Number(mod.num) + ',',
    '  grupo: ' + comillas(mod.grupo) + ',',
    '  titulo: ' + comillas(mod.titulo) + ',',
    '  resumen: ' + comillas(mod.resumen) + ',',
    '  duracion: ' + Number(mod.duracion) + ',',
    '  etiquetas: [' + etiquetas + '],',
    '  lecciones: [',
    lecciones,
    '  ]',
    '};',
    ''
  ].join('\n');
}

/* ── Escritura de novedades ──────────────────────────────────── */
export function serializarNovedades(lista) {
  const entradas = lista.map((nov) => {
    const cuerpo = String(nov.md || '').replace(/^\n+|\n+$/g, '');
    const etiquetas = (nov.etiquetas || []).map(comillas).join(', ');
    return [
      '  {',
      '    fecha: ' + comillas(nov.fecha) + ',',
      '    nivel: ' + comillas(nov.nivel) + ',',
      '    etiquetas: [' + etiquetas + '],',
      '    titulo: ' + comillas(nov.titulo) + ',',
      '    md: `',
      plantilla(cuerpo),
      '`',
      '  }'
    ].join('\n');
  }).join(',\n');

  return [
    '/* ===============================================================',
    '   novedades.js - Registro de novedades del despacho',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin), pero puede editarse a mano sin problema.',
    '   Las entradas van de más reciente a más antigua.',
    '   Niveles: \'critica\' | \'importante\' | \'informativa\'',
    '   =============================================================== */',
    '',
    'export default [',
    entradas,
    '];',
    ''
  ].join('\n');
}

/* ── Escritura del currículo ─────────────────────────────────── */
export function serializarCurriculo({ version, grupos, modulos }) {
  const importaciones = modulos.map((mod, i) =>
    'import m' + dosDigitos(i + 1) + " from './modulos/" + nombreArchivo(mod).replace(/\.js$/, '.js') + "';"
  ).join('\n');

  const listaGrupos = grupos.map((g) => [
    '  {',
    '    id: ' + comillas(g.id) + ',',
    '    titulo: ' + comillas(g.titulo) + ',',
    '    descripcion: ' + comillas(g.descripcion),
    '  }'
  ].join('\n')).join(',\n');

  const nombres = modulos.map((_, i) => 'm' + dosDigitos(i + 1));
  const filas = [];
  for (let i = 0; i < nombres.length; i += 9) {
    filas.push('  ' + nombres.slice(i, i + 9).join(', '));
  }

  return [
    '/* ===============================================================',
    '   curriculo.js - Registro central de contenidos',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin), pero puede editarse a mano sin problema.',
    '',
    '   Para añadir un módulo a mano:',
    '     1. Crear el archivo en content/modulos/',
    '     2. Importarlo aquí',
    '     3. Añadirlo al array MODULOS en la posición que corresponda',
    '',
    '   Los módulos de un mismo grupo deben ir seguidos y su número',
    '   debe ser correlativo desde 1. Comprobar con: npm run validar',
    '   =============================================================== */',
    '',
    importaciones,
    '',
    'export const VERSION = ' + comillas(version) + ';',
    '',
    'export const GRUPOS = [',
    listaGrupos,
    '];',
    '',
    'export const MODULOS = [',
    filas.join(',\n'),
    '];',
    '',
    '/* Índice plano de lecciones, en orden de itinerario. */',
    'export const LECCIONES = MODULOS.flatMap((mod) =>',
    '  mod.lecciones.map((lec) => ({',
    '    ...lec,',
    '    moduloId: mod.id,',
    '    moduloTitulo: mod.titulo,',
    '    moduloNum: mod.num,',
    "    clave: mod.id + '/' + lec.id",
    '  }))',
    ');',
    '',
    'export const moduloPorId = (id) => MODULOS.find((m) => m.id === id) || null;',
    'export const grupoPorId = (id) => GRUPOS.find((g) => g.id === id) || null;',
    'export const modulosDeGrupo = (id) => MODULOS.filter((m) => m.grupo === id);',
    '',
    'export const TOTAL_LECCIONES = LECCIONES.length;',
    'export const TOTAL_MINUTOS = MODULOS.reduce((s, m) => s + (m.duracion || 0), 0);',
    ''
  ].join('\n');
}

/* ── Lectura ─────────────────────────────────────────────────── */

/* Los archivos guardan el texto entre saltos de línea; se retiran
   para que el panel muestre el contenido tal cual. */
const recortar = (t) => String(t || '').replace(/^\n+|\n+$/g, '');
/* Se importa el módulo real, para ver exactamente lo mismo que ve
   la aplicación. El parámetro evita la caché de módulos de Node. */
async function importarFresco(rutaRelativa) {
  const url = pathToFileURL(join(RAIZ, rutaRelativa)).href + '?v=' + Date.now();
  return import(url);
}

export async function leerTodo() {
  const curriculo = await importarFresco('content/curriculo.js');
  const novedades = await importarFresco('content/novedades.js');
  return {
    version: curriculo.VERSION,
    grupos: curriculo.GRUPOS.map((g) => ({ ...g })),
    modulos: curriculo.MODULOS.map((m) => ({
      ...m,
      etiquetas: [...(m.etiquetas || [])],
      lecciones: m.lecciones.map((l) => ({ id: l.id, titulo: l.titulo, md: recortar(l.md) }))
    })),
    novedades: novedades.default.map((n) => ({ ...n, etiquetas: [...(n.etiquetas || [])], md: recortar(n.md) }))
  };
}

/* ── Guardado ────────────────────────────────────────────────── */

/* Cuántas copias de seguridad se conservan antes de ir borrando las
   más antiguas. Cada guardado genera una por archivo modificado. */
const MAX_COPIAS = 300;

/* Copia de seguridad de un archivo antes de sobrescribirlo. */
async function respaldar(rutaAbsoluta) {
  if (!existsSync(rutaAbsoluta)) return;
  await mkdir(DIR_COPIAS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, '-');
  const nombre = rutaAbsoluta.slice(RAIZ.length + 1).replace(/[/\\]/g, '_');
  await copyFile(rutaAbsoluta, join(DIR_COPIAS, marca + '__' + nombre));
}

/* Retira las copias más antiguas. El nombre empieza por la marca de
   tiempo, así que el orden alfabético es el cronológico. */
async function podarCopias() {
  if (!existsSync(DIR_COPIAS)) return;
  const archivos = (await readdir(DIR_COPIAS)).sort();
  const sobran = archivos.length - MAX_COPIAS;
  for (let i = 0; i < sobran; i++) {
    await unlink(join(DIR_COPIAS, archivos[i]));
  }
}

async function escribirAtomico(rutaAbsoluta, contenido) {
  await respaldar(rutaAbsoluta);
  const temporal = rutaAbsoluta + '.tmp';
  await writeFile(temporal, contenido, 'utf8');
  await rename(temporal, rutaAbsoluta);
}

/* Reordena, renumera y renombra. Los grupos se recorren en el
   orden de GRUPOS, de modo que siempre quedan seguidos. */
export function ordenar(grupos, modulos) {
  const ordenados = [];
  for (const g of grupos) {
    for (const m of modulos) if (m.grupo === g.id) ordenados.push(m);
  }
  // Cualquier módulo con grupo desconocido se coloca al final.
  for (const m of modulos) if (!ordenados.includes(m)) ordenados.push(m);
  ordenados.forEach((m, i) => { m.num = i + 1; });
  return ordenados;
}

export async function guardarTodo({ version, grupos, modulos, novedades }) {
  const ordenados = ordenar(grupos, modulos);
  const deseados = new Set(ordenados.map(nombreArchivo));

  // Se escriben primero con un nombre temporal, para que un cambio de
  // numeración no pise un archivo que todavía hace falta.
  const provisionales = [];
  for (const mod of ordenados) {
    const destino = join(DIR_MODULOS, nombreArchivo(mod));
    const provisional = destino + '.nuevo';
    await respaldar(destino);
    await writeFile(provisional, serializarModulo(mod), 'utf8');
    provisionales.push([provisional, destino]);
  }

  // Se retiran los archivos que ya no corresponden a ningún módulo.
  for (const archivo of await readdir(DIR_MODULOS)) {
    if (!archivo.endsWith('.js') || deseados.has(archivo)) continue;
    await respaldar(join(DIR_MODULOS, archivo));
    await unlink(join(DIR_MODULOS, archivo));
  }

  for (const [provisional, destino] of provisionales) await rename(provisional, destino);

  await escribirAtomico(join(RAIZ, 'content', 'curriculo.js'),
    serializarCurriculo({ version, grupos, modulos: ordenados }));
  await escribirAtomico(join(RAIZ, 'content', 'novedades.js'),
    serializarNovedades(novedades));

  await podarCopias();

  return ordenados;
}
