/* ===============================================================
   datos.mjs - Capa de datos del servidor (colecciones JSON)
   ---------------------------------------------------------------
   Todo lo que la plataforma recuerda de cada persona (progreso,
   visualizaciones, exámenes, actividad…) pasa por aquí. Hoy son
   archivos JSON en datos/, fuera del control de versiones; cuando
   se pase a Supabase, este es el único módulo del servidor que hay
   que sustituir, porque el resto solo conoce estas funciones.
   =============================================================== */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_DATOS = join(RAIZ, 'datos');
const archivoDe = (nombre) => join(DIR_DATOS, nombre + '.json');

/* ── Colecciones ─────────────────────────────────────────────── */
export async function leerColeccion(nombre, porDefecto = []) {
  try {
    const datos = JSON.parse(await readFile(archivoDe(nombre), 'utf8'));
    return datos === null || datos === undefined ? porDefecto : datos;
  } catch (e) {
    return porDefecto;
  }
}

export async function guardarColeccion(nombre, datos) {
  await mkdir(DIR_DATOS, { recursive: true });
  const temporal = archivoDe(nombre) + '.tmp';
  await writeFile(temporal, JSON.stringify(datos, null, 2), 'utf8');
  await rename(temporal, archivoDe(nombre));
}

export const idNuevo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const limpiar = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
export const ahora = () => new Date().toISOString();

/* Lectura-modificación-escritura de una colección sin pisarse:
   dos peticiones seguidas sobre el mismo archivo se encadenan.
   fn recibe los datos, los cambia en sitio y devuelve lo que quiera. */
const colas = new Map();
export function modificar(nombre, porDefecto, fn) {
  const anterior = colas.get(nombre) || Promise.resolve();
  const tarea = anterior.catch(() => {}).then(async () => {
    const datos = await leerColeccion(nombre, porDefecto);
    const resultado = await fn(datos);
    await guardarColeccion(nombre, datos);
    return resultado;
  });
  colas.set(nombre, tarea);
  return tarea;
}

/* ── Actividad: el hilo de lo que pasa en la plataforma ──────── */
const MAX_EVENTOS = 400;

/* evento: { tipo, texto, ruta, actor: { clave, nombre } } */
export function registrarEvento(evento) {
  return modificar('actividad', [], (lista) => {
    const nuevo = { id: idNuevo(), fecha: ahora(), ...evento };
    lista.unshift(nuevo);
    if (lista.length > MAX_EVENTOS) lista.length = MAX_EVENTOS;
    return nuevo;
  });
}

/* ── Identidad y papel ───────────────────────────────────────── */

/* Personas dadas de alta (content/personas.js), leídas en fresco
   para recoger los cambios hechos desde el panel. */
export async function personasFrescas() {
  try {
    const url = pathToFileURL(join(RAIZ, 'content', 'personas.js')).href + '?v=' + Date.now();
    const lista = (await import(url)).default;
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

export async function esAdministrador(clave) {
  const c = String(clave || '').toLowerCase();
  if (!c) return false;
  return (await personasFrescas()).some((p) =>
    p && p.activo !== false && p.rol === 'administracion' && String(p.correo || '').toLowerCase() === c);
}

/* ── Currículo en fresco (con una pequeña caché) ─────────────── */
let curriculoCache = null;
let curriculoMomento = 0;

export async function curriculoFresco() {
  if (curriculoCache && Date.now() - curriculoMomento < 60000) return curriculoCache;
  // Igual que en contenido.mjs: los módulos se importan archivo a
  // archivo para no arrastrar la caché de Node.
  const { readdir } = await import('node:fs/promises');
  const dir = join(RAIZ, 'content', 'modulos');
  const archivos = (await readdir(dir)).filter((a) => /^\d{2}-.+\.js$/.test(a)).sort();
  const modulos = [];
  for (const a of archivos) {
    const url = pathToFileURL(join(dir, a)).href + '?v=' + Date.now();
    const mod = (await import(url)).default;
    if (mod && mod.id) modulos.push(mod);
  }
  modulos.sort((x, y) => (Number(x.num) || 0) - (Number(y.num) || 0));
  curriculoCache = { modulos, porId: new Map(modulos.map((m) => [m.id, m])) };
  curriculoMomento = Date.now();
  return curriculoCache;
}

export function olvidarCurriculo() {
  curriculoCache = null;
}
