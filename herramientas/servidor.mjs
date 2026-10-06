/* ===============================================================
   servidor.mjs - Servidor de la plataforma, sin dependencias
   ---------------------------------------------------------------
   Uso:  npm run dev        (o: node herramientas/servidor.mjs)
   Opciones:  --puerto 3000

   Además de servir los archivos, expone la API del Muro del
   despacho (publicaciones del equipo) en /api/muro. Los datos se
   guardan en datos/muro.json, fuera del control de versiones.
   =============================================================== */

import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, stat, unlink } from 'node:fs/promises';
import { extname, join, resolve, normalize, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enviarAviso } from './correo.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO_MURO = join(RAIZ, 'datos', 'muro.json');
const DIR_FOTOS_MURO = join(RAIZ, 'datos', 'muro-fotos');
const MAX_PUBLICACIONES = 500;
const TIPOS_MURO = new Set(['sugerencia', 'queja', 'idea', 'agradecimiento']);
const EXTENSIONES_FOTO_MURO = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const LIMITE_FOTO_MURO = 6 * 1024 * 1024; // 6 MB

const argumento = (nombre, pordefecto) => {
  const i = process.argv.indexOf('--' + nombre);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : pordefecto;
};
const PUERTO = Number(argumento('puerto', 8099));

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt':  'application/vnd.oasis.opendocument.text',
  '.ods':  'application/vnd.oasis.opendocument.spreadsheet',
  '.odp':  'application/vnd.oasis.opendocument.presentation',
  '.rtf':  'application/rtf'
};

/* ── El Muro: publicaciones del equipo ───────────────────────── */
async function leerMuro() {
  try {
    const bruto = await readFile(ARCHIVO_MURO, 'utf8');
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

async function guardarMuro(lista) {
  await mkdir(dirname(ARCHIVO_MURO), { recursive: true });
  const temporal = ARCHIVO_MURO + '.tmp';
  await writeFile(temporal, JSON.stringify(lista, null, 2), 'utf8');
  await rename(temporal, ARCHIVO_MURO);
}

function cuerpo(peticion, limite = 64 * 1024) {
  return new Promise((cumplir, fallar) => {
    const trozos = [];
    let total = 0;
    peticion.on('data', (t) => {
      total += t.length;
      if (total > limite) { fallar(new Error('demasiado grande')); peticion.destroy(); return; }
      trozos.push(t);
    });
    peticion.on('end', () => cumplir(Buffer.concat(trozos)));
    peticion.on('error', fallar);
  });
}

const json = (respuesta, datos, codigo = 200) => {
  respuesta.writeHead(codigo, { 'content-type': TIPOS['.json'], 'cache-control': 'no-store' });
  respuesta.end(JSON.stringify(datos));
};

const limpiar = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

async function atenderMuro(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    return json(respuesta, { ok: true, publicaciones: await leerMuro() });
  }

  if (peticion.method === 'POST' && url.pathname === '/api/muro/foto') {
    const propuesto = url.searchParams.get('nombre') || '';
    const extension = extname(propuesto).toLowerCase();
    if (!EXTENSIONES_FOTO_MURO.has(extension)) {
      return json(respuesta, { ok: false, error: 'Formato no admitido. Usa .jpg, .png, .webp o .gif.' }, 400);
    }
    try {
      const datos = await cuerpo(peticion, LIMITE_FOTO_MURO);
      if (!datos.length) return json(respuesta, { ok: false, error: 'La imagen llegó vacía.' }, 400);
      const nombre = Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + extension;
      await mkdir(DIR_FOTOS_MURO, { recursive: true });
      await writeFile(join(DIR_FOTOS_MURO, nombre), datos);
      return json(respuesta, { ok: true, ruta: 'datos/muro-fotos/' + nombre });
    } catch (e) {
      return json(respuesta, { ok: false, error: 'La imagen supera los 6 MB o no se pudo guardar.' }, 400);
    }
  }

  if (peticion.method === 'POST' && url.pathname === '/api/muro') {
    let datos;
    try {
      datos = JSON.parse((await cuerpo(peticion)).toString('utf8'));
    } catch (e) {
      return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    }
    const nombre = limpiar(datos.nombre, 60);
    const clave = limpiar(datos.clave, 120).toLowerCase();
    const tipo = String(datos.tipo || '');
    const texto = String(datos.texto || '').trim().slice(0, 500);
    const foto = String(datos.foto || '');
    if (!nombre || !clave) return json(respuesta, { ok: false, error: 'Falta el nombre.' }, 400);
    if (!TIPOS_MURO.has(tipo)) return json(respuesta, { ok: false, error: 'Tipo no válido.' }, 400);
    if (!texto && !foto) return json(respuesta, { ok: false, error: 'Escribe algo o adjunta una foto antes de publicar.' }, 400);
    if (foto && !/^datos\/muro-fotos\/[a-z0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(foto)) {
      return json(respuesta, { ok: false, error: 'Foto no válida.' }, 400);
    }

    const lista = await leerMuro();
    const publicacion = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fecha: new Date().toISOString(),
      nombre,
      clave,
      tipo,
      texto,
      foto,
      gracias: []
    };
    lista.unshift(publicacion);
    if (lista.length > MAX_PUBLICACIONES) lista.length = MAX_PUBLICACIONES;
    await guardarMuro(lista);
    enviarAviso(
      'Conecta · ' + nombre + ' ha publicado',
      nombre + ' ha publicado en Conecta (' + tipo + '):\n\n' +
      (texto || '(foto)') + '\n\nEntra en la plataforma para verlo y reaccionar.'
    );
    return json(respuesta, { ok: true, publicacion });
  }

  if (peticion.method === 'POST' && url.pathname === '/api/muro/gracias') {
    let datos;
    try {
      datos = JSON.parse((await cuerpo(peticion)).toString('utf8'));
    } catch (e) {
      return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    }
    const clave = limpiar(datos.clave, 120).toLowerCase();
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === datos.id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    const i = publicacion.gracias.indexOf(clave);
    if (i === -1) publicacion.gracias.push(clave);
    else publicacion.gracias.splice(i, 1);
    await guardarMuro(lista);
    return json(respuesta, { ok: true, publicacion });
  }

  if (peticion.method === 'DELETE') {
    const id = url.searchParams.get('id') || '';
    const clave = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    if (publicacion.clave !== clave) {
      return json(respuesta, { ok: false, error: 'Solo puedes borrar tus propias publicaciones.' }, 403);
    }
    await guardarMuro(lista.filter((p) => p.id !== id));
    if (publicacion.foto) {
      try { await unlink(join(RAIZ, publicacion.foto)); } catch (e) { /* ya no existe */ }
    }
    return json(respuesta, { ok: true });
  }

  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

const servidor = createServer(async (peticion, respuesta) => {
  const url = new URL(peticion.url, 'http://localhost');
  let ruta = decodeURIComponent(url.pathname);

  if (ruta === '/api/muro' || ruta.startsWith('/api/muro/')) {
    try {
      return await atenderMuro(peticion, respuesta, url);
    } catch (e) {
      return json(respuesta, { ok: false, error: 'Error del servidor: ' + e.message }, 500);
    }
  }

  if (ruta.endsWith('/')) ruta += 'index.html';

  // Se impide salir del directorio del proyecto.
  const destino = join(RAIZ, normalize(ruta).replace(/^(\.\.[/\\])+/, ''));
  if (!destino.startsWith(RAIZ + sep) && destino !== RAIZ) {
    respuesta.writeHead(403).end('Prohibido');
    return;
  }

  try {
    const info = await stat(destino);
    if (info.isDirectory()) throw new Error('es un directorio');
    const contenido = await readFile(destino);
    respuesta.writeHead(200, {
      'content-type': TIPOS[extname(destino).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    respuesta.end(contenido);
  } catch (e) {
    // Todo lo que no exista cae en index.html (enrutado del lado del cliente).
    try {
      const inicio = await readFile(join(RAIZ, 'index.html'));
      respuesta.writeHead(200, { 'content-type': TIPOS['.html'], 'cache-control': 'no-store' });
      respuesta.end(inicio);
    } catch {
      respuesta.writeHead(404).end('No encontrado');
    }
  }
});

servidor.listen(PUERTO, () => {
  console.log('');
  console.log('  Plataforma de formación · Díaz y Asociados');
  console.log('  ------------------------------------------');
  console.log('  Abre  http://localhost:' + PUERTO);
  console.log('');
  console.log('  Ctrl+C para detener.');
  console.log('');
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${PUERTO} está ocupado.`);
    console.error(`  Prueba con: npm run dev -- --puerto ${PUERTO + 1}\n`);
    process.exit(1);
  }
  throw e;
});
