/* ===============================================================
   admin.mjs - Panel de administración local
   ---------------------------------------------------------------
   Uso:  npm run admin        (o: node herramientas/admin.mjs)
   Opciones:  --puerto 8100

   Levanta un panel en el navegador para crear y editar módulos,
   lecciones, novedades y vídeos. Escribe directamente los archivos
   de content/, así que los cambios se ven en git y se publican con
   un commit normal.

   Solo escucha en 127.0.0.1: no es accesible desde la red.
   =============================================================== */

import { createServer } from 'node:http';
import { readFile, writeFile, readdir, stat, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join, normalize, sep } from 'node:path';
import { RAIZ, leerTodo, guardarTodo, aIdentificador } from './contenido.mjs';

const ejecutar = promisify(execFile);

const argumento = (nombre, pordefecto) => {
  const i = process.argv.indexOf('--' + nombre);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : pordefecto;
};
const PUERTO = Number(argumento('puerto', 8100));

const DIR_PANEL = join(RAIZ, 'herramientas', 'admin');
const DIR_VIDEO = join(RAIZ, 'assets', 'video');
const EXTENSIONES_VIDEO = new Set(['.mp4', '.webm', '.ogv']);
const LIMITE_VIDEO = 200 * 1024 * 1024; // 200 MB

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

/* ── Utilidades de respuesta ─────────────────────────────────── */
const json = (respuesta, datos, codigo = 200) => {
  respuesta.writeHead(codigo, { 'content-type': TIPOS['.json'], 'cache-control': 'no-store' });
  respuesta.end(JSON.stringify(datos));
};

function cuerpo(peticion, limite = 32 * 1024 * 1024) {
  return new Promise((cumplir, fallar) => {
    const trozos = [];
    let total = 0;
    peticion.on('data', (t) => {
      total += t.length;
      if (total > limite) { fallar(new Error('El contenido supera el límite permitido.')); peticion.destroy(); return; }
      trozos.push(t);
    });
    peticion.on('end', () => cumplir(Buffer.concat(trozos)));
    peticion.on('error', fallar);
  });
}

/* ── Estado de git, para avisar de cambios sin guardar ───────── */
async function estadoGit() {
  try {
    const { stdout: rama } = await ejecutar('git', ['branch', '--show-current'], { cwd: RAIZ });
    const { stdout: cambios } = await ejecutar('git', ['status', '--porcelain', 'content'], { cwd: RAIZ });
    return { disponible: true, rama: rama.trim(), pendientes: cambios.trim().split('\n').filter(Boolean).length };
  } catch (e) {
    return { disponible: false, rama: '', pendientes: 0 };
  }
}

async function listarVideos() {
  if (!existsSync(DIR_VIDEO)) return [];
  const nombres = await readdir(DIR_VIDEO);
  const salida = [];
  for (const nombre of nombres) {
    if (!EXTENSIONES_VIDEO.has(extname(nombre).toLowerCase())) continue;
    const info = await stat(join(DIR_VIDEO, nombre));
    salida.push({ nombre, ruta: 'assets/video/' + nombre, bytes: info.size });
  }
  return salida.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/* ── Validación de lo recibido ───────────────────────────────── */
function revisar(datos) {
  const fallos = [];
  const texto = (v) => typeof v === 'string' && v.trim().length > 0;

  if (!texto(datos.version)) fallos.push('Falta la versión de contenidos.');
  if (!Array.isArray(datos.grupos) || !datos.grupos.length) fallos.push('No hay ningún grupo definido.');
  if (!Array.isArray(datos.modulos)) fallos.push('La lista de módulos no es válida.');
  if (!Array.isArray(datos.novedades)) fallos.push('La lista de novedades no es válida.');
  if (fallos.length) return fallos;

  const idsGrupo = new Set(datos.grupos.map((g) => g.id));
  const vistos = new Set();

  for (const g of datos.grupos) {
    if (!texto(g.id) || !texto(g.titulo)) fallos.push('Hay un grupo sin identificador o sin título.');
  }

  for (const mod of datos.modulos) {
    const donde = 'El módulo "' + (mod.titulo || mod.id || 'sin nombre') + '"';
    if (!texto(mod.id)) { fallos.push(donde + ' no tiene identificador.'); continue; }
    if (vistos.has(mod.id)) fallos.push('Hay dos módulos con el identificador "' + mod.id + '".');
    vistos.add(mod.id);
    if (!texto(mod.titulo)) fallos.push(donde + ' no tiene título.');
    if (!texto(mod.resumen)) fallos.push(donde + ' no tiene resumen.');
    if (!idsGrupo.has(mod.grupo)) fallos.push(donde + ' está en un grupo que no existe.');
    if (!Number.isFinite(Number(mod.duracion)) || Number(mod.duracion) <= 0) {
      fallos.push(donde + ' necesita una duración en minutos.');
    }
    if (!Array.isArray(mod.lecciones) || !mod.lecciones.length) {
      fallos.push(donde + ' no tiene ninguna lección.');
      continue;
    }
    const idsLeccion = new Set();
    for (const lec of mod.lecciones) {
      if (!texto(lec.id) || !texto(lec.titulo)) { fallos.push(donde + ' tiene una lección sin título.'); continue; }
      if (idsLeccion.has(lec.id)) fallos.push(donde + ' tiene dos lecciones con el identificador "' + lec.id + '".');
      idsLeccion.add(lec.id);
      if (typeof lec.md !== 'string' || !lec.md.trim()) {
        fallos.push(donde + ', lección "' + lec.titulo + '": el contenido está vacío.');
      }
    }
  }

  for (const nov of datos.novedades) {
    const donde = 'La novedad "' + (nov.titulo || 'sin título') + '"';
    if (!texto(nov.titulo)) fallos.push('Hay una novedad sin título.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nov.fecha || '')) fallos.push(donde + ' no tiene una fecha válida.');
    if (!['critica', 'importante', 'informativa'].includes(nov.nivel)) fallos.push(donde + ' no tiene un nivel válido.');
    if (typeof nov.md !== 'string' || !nov.md.trim()) fallos.push(donde + ' no tiene contenido.');
  }

  return fallos;
}

/* ── Rutas ───────────────────────────────────────────────────── */
async function atender(peticion, respuesta) {
  const url = new URL(peticion.url, 'http://localhost');
  const ruta = decodeURIComponent(url.pathname);

  /* --- API --- */
  if (ruta === '/api/estado' && peticion.method === 'GET') {
    const datos = await leerTodo();
    return json(respuesta, { ...datos, videos: await listarVideos(), git: await estadoGit() });
  }

  if (ruta === '/api/guardar' && peticion.method === 'POST') {
    let datos;
    try {
      datos = JSON.parse((await cuerpo(peticion)).toString('utf8'));
    } catch (e) {
      return json(respuesta, { ok: false, fallos: ['No se ha podido leer lo enviado: ' + e.message] }, 400);
    }
    const fallos = revisar(datos);
    if (fallos.length) return json(respuesta, { ok: false, fallos }, 400);

    try {
      const ordenados = await guardarTodo(datos);
      console.log(`  Guardado: ${ordenados.length} módulos, ${datos.novedades.length} novedades`);
      return json(respuesta, { ok: true, modulos: ordenados.length });
    } catch (e) {
      console.error('  Error al guardar:', e.message);
      return json(respuesta, { ok: false, fallos: ['Error al escribir los archivos: ' + e.message] }, 500);
    }
  }

  if (ruta === '/api/video' && peticion.method === 'POST') {
    const propuesto = url.searchParams.get('nombre') || '';
    const extension = extname(propuesto).toLowerCase();
    if (!EXTENSIONES_VIDEO.has(extension)) {
      return json(respuesta, { ok: false, error: 'Formato no admitido. Usa .mp4, .webm o .ogv.' }, 400);
    }
    const nombre = aIdentificador(propuesto.slice(0, -extension.length)) + extension;
    try {
      const datos = await cuerpo(peticion, LIMITE_VIDEO);
      await mkdir(DIR_VIDEO, { recursive: true });
      await writeFile(join(DIR_VIDEO, nombre), datos);
      console.log(`  Vídeo añadido: assets/video/${nombre} (${(datos.length / 1048576).toFixed(1)} MB)`);
      return json(respuesta, { ok: true, nombre, ruta: 'assets/video/' + nombre, bytes: datos.length });
    } catch (e) {
      return json(respuesta, { ok: false, error: e.message }, 400);
    }
  }

  if (ruta === '/api/video' && peticion.method === 'DELETE') {
    const nombre = url.searchParams.get('nombre') || '';
    if (nombre.includes('/') || nombre.includes('\\') || nombre.includes('..')) {
      return json(respuesta, { ok: false, error: 'Nombre no válido.' }, 400);
    }
    const destino = join(DIR_VIDEO, nombre);
    if (!existsSync(destino)) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    await unlink(destino);
    console.log(`  Vídeo eliminado: ${nombre}`);
    return json(respuesta, { ok: true });
  }

  /* --- Archivos del panel y del proyecto --- */
  const base = ruta === '/' || ruta === '/index.html' ? join(DIR_PANEL, 'index.html')
    : ruta.startsWith('/panel/') ? join(DIR_PANEL, normalize(ruta.slice(7)))
    : join(RAIZ, normalize(ruta).replace(/^([/\\])+/, ''));

  if (!base.startsWith(RAIZ + sep)) {
    respuesta.writeHead(403).end('Prohibido');
    return;
  }

  try {
    const contenido = await readFile(base);
    respuesta.writeHead(200, {
      'content-type': TIPOS[extname(base).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    respuesta.end(contenido);
  } catch (e) {
    respuesta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    respuesta.end('No encontrado: ' + ruta);
  }
}

const servidor = createServer((peticion, respuesta) => {
  atender(peticion, respuesta).catch((e) => {
    console.error('  Error:', e.message);
    if (!respuesta.headersSent) json(respuesta, { ok: false, error: e.message }, 500);
    else respuesta.end();
  });
});

// Solo escucha en el equipo local: nunca queda expuesto en la red.
servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log('');
  console.log('  Panel de administración · Díaz y Asociados');
  console.log('  -----------------------------------------');
  console.log('  Abre  http://localhost:' + PUERTO);
  console.log('');
  console.log('  Los cambios se escriben en content/. Revísalos con');
  console.log('  git diff y publícalos con un commit normal.');
  console.log('');
  console.log('  Ctrl+C para detener.');
  console.log('');
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${PUERTO} está ocupado.`);
    console.error(`  Prueba con: npm run admin -- --puerto ${PUERTO + 1}\n`);
    process.exit(1);
  }
  throw e;
});
