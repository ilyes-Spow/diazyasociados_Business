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
import { atiendeApi, atenderApi } from './api.mjs';
import { registrarEvento } from './datos.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO_MURO = join(RAIZ, 'datos', 'muro.json');
const DIR_FOTOS_MURO = join(RAIZ, 'datos', 'muro-fotos');
const ARCHIVO_PERFILES = join(RAIZ, 'datos', 'perfiles.json');
const DIR_FOTOS_PERFIL = join(RAIZ, 'datos', 'perfiles-fotos');
const LIMITE_FOTO_PERFIL = 3 * 1024 * 1024; // 3 MB (el cliente la reduce antes)
const SEDES_PERFIL = new Set(['', 'madrid', 'alicante', 'valencia', 'marbella', 'londres', 'latinoamerica']);
const MAX_PUBLICACIONES = 500;
const MAX_RESPUESTAS = 200;
const TIPOS_MURO = new Set(['sugerencia', 'queja', 'idea', 'agradecimiento', 'pregunta', 'celebracion', 'encuesta']);
const REACCIONES_MURO = ['aplauso', 'corazon', 'risa', 'idea', 'fuego', 'fiesta'];
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

/* Papel de administración: las personas activas con rol de
   administración en content/personas.js pueden moderar Conecta.
   Se importa fresco para recoger los cambios hechos desde el panel. */
async function esAdministradorServidor(clave) {
  try {
    const { pathToFileURL } = await import('node:url');
    const url = pathToFileURL(join(RAIZ, 'content', 'personas.js')).href + '?v=' + Date.now();
    const personas = (await import(url)).default;
    return Array.isArray(personas) && personas.some((p) =>
      p && p.activo !== false && p.rol === 'administracion' &&
      String(p.correo || '').toLowerCase() === clave);
  } catch (e) {
    return false;
  }
}

/* ── Conecta: publicaciones del equipo ───────────────────────── */

/* Las publicaciones antiguas (solo con "gracias") se completan al
   vuelo con reacciones, respuestas y encuesta, para que el cliente
   siempre reciba la misma forma. */
function normalizarPublicacion(p) {
  if (!p.reacciones || typeof p.reacciones !== 'object') p.reacciones = {};
  for (const r of REACCIONES_MURO) if (!Array.isArray(p.reacciones[r])) p.reacciones[r] = [];
  if (Array.isArray(p.gracias) && p.gracias.length) {
    for (const c of p.gracias) if (!p.reacciones.corazon.includes(c)) p.reacciones.corazon.push(c);
  }
  delete p.gracias;
  if (!Array.isArray(p.respuestas)) p.respuestas = [];
  if (p.tipo === 'encuesta') {
    if (!p.encuesta || !Array.isArray(p.encuesta.opciones)) p.encuesta = { opciones: [] };
    p.encuesta.opciones.forEach((o) => { if (!Array.isArray(o.votos)) o.votos = []; });
  } else {
    p.encuesta = null;
  }
  return p;
}

async function leerMuro() {
  try {
    const bruto = await readFile(ARCHIVO_MURO, 'utf8');
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista.map(normalizarPublicacion) : [];
  } catch (e) {
    return [];
  }
}

/* Lee el cuerpo JSON de una petición; null si no se puede. */
async function leerJson(peticion) {
  try {
    return JSON.parse((await cuerpo(peticion)).toString('utf8'));
  } catch (e) {
    return null;
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
    if (foto && !/^datos\/muro-fotos\/[a-z0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(foto)) {
      return json(respuesta, { ok: false, error: 'Foto no válida.' }, 400);
    }

    // Encuesta: entre dos y cuatro opciones de texto.
    let encuesta = null;
    if (tipo === 'encuesta') {
      const propuestas = datos.encuesta && Array.isArray(datos.encuesta.opciones) ? datos.encuesta.opciones : [];
      const opciones = propuestas.map((o) => limpiar(o, 60)).filter(Boolean).slice(0, 4);
      if (opciones.length < 2) {
        return json(respuesta, { ok: false, error: 'Una encuesta necesita entre dos y cuatro opciones.' }, 400);
      }
      encuesta = { opciones: opciones.map((t) => ({ texto: t, votos: [] })) };
    }
    if (!texto && !foto && !encuesta) {
      return json(respuesta, { ok: false, error: 'Escribe algo, adjunta una foto o crea una encuesta antes de publicar.' }, 400);
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
      reacciones: Object.fromEntries(REACCIONES_MURO.map((r) => [r, []])),
      respuestas: [],
      encuesta
    };
    lista.unshift(publicacion);
    if (lista.length > MAX_PUBLICACIONES) lista.length = MAX_PUBLICACIONES;
    await guardarMuro(lista);
    registrarEvento({
      tipo: 'muro',
      texto: nombre + (tipo === 'encuesta' ? ' ha lanzado una encuesta en Conecta' : ' ha publicado en Conecta'),
      ruta: '#/conecta',
      actor: { clave, nombre }
    }).catch(() => {});
    enviarAviso(
      'Conecta · ' + nombre + ' ha publicado',
      nombre + ' ha publicado en Conecta (' + tipo + '):\n\n' +
      (texto || '(foto)') + '\n\nEntra en la plataforma para verlo y reaccionar.'
    );
    return json(respuesta, { ok: true, publicacion });
  }

  /* Reacciones: se alternan. La ruta antigua /gracias equivale al corazón. */
  if (peticion.method === 'POST' && (url.pathname === '/api/muro/reaccion' || url.pathname === '/api/muro/gracias')) {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = limpiar(datos.clave, 120).toLowerCase();
    const tipo = url.pathname.endsWith('/gracias') ? 'corazon' : String(datos.tipo || '');
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    if (!REACCIONES_MURO.includes(tipo)) return json(respuesta, { ok: false, error: 'Reacción no válida.' }, 400);
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === datos.id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    const quienes = publicacion.reacciones[tipo];
    const i = quienes.indexOf(clave);
    if (i === -1) quienes.push(clave);
    else quienes.splice(i, 1);
    await guardarMuro(lista);
    return json(respuesta, { ok: true, publicacion });
  }

  /* Respuestas en hilo. */
  if (peticion.method === 'POST' && url.pathname === '/api/muro/respuesta') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const nombre = limpiar(datos.nombre, 60);
    const clave = limpiar(datos.clave, 120).toLowerCase();
    const texto = String(datos.texto || '').trim().slice(0, 300);
    if (!nombre || !clave) return json(respuesta, { ok: false, error: 'Falta el nombre.' }, 400);
    if (!texto) return json(respuesta, { ok: false, error: 'La respuesta está vacía.' }, 400);
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === datos.id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    if (publicacion.respuestas.length >= MAX_RESPUESTAS) {
      return json(respuesta, { ok: false, error: 'Este hilo ya no admite más respuestas.' }, 400);
    }
    publicacion.respuestas.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fecha: new Date().toISOString(),
      nombre, clave, texto
    });
    await guardarMuro(lista);
    registrarEvento({
      tipo: 'respuesta',
      texto: nombre + ' ha respondido a ' + (publicacion.nombre || 'una publicación') + ' en Conecta',
      ruta: '#/conecta',
      actor: { clave, nombre }
    }).catch(() => {});
    return json(respuesta, { ok: true, publicacion });
  }

  if (peticion.method === 'DELETE' && url.pathname === '/api/muro/respuesta') {
    const id = url.searchParams.get('id') || '';
    const rid = url.searchParams.get('rid') || '';
    const clave = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    const resp = publicacion.respuestas.find((r) => r.id === rid);
    if (!resp) return json(respuesta, { ok: false, error: 'La respuesta ya no existe.' }, 404);
    if (resp.clave !== clave && !(await esAdministradorServidor(clave))) {
      return json(respuesta, { ok: false, error: 'Solo puedes borrar tus propias respuestas.' }, 403);
    }
    publicacion.respuestas = publicacion.respuestas.filter((r) => r.id !== rid);
    await guardarMuro(lista);
    return json(respuesta, { ok: true, publicacion });
  }

  /* Votos de encuesta: uno por persona, se puede cambiar o retirar. */
  if (peticion.method === 'POST' && url.pathname === '/api/muro/voto') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = limpiar(datos.clave, 120).toLowerCase();
    const opcion = Number(datos.opcion);
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === datos.id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    if (!publicacion.encuesta) return json(respuesta, { ok: false, error: 'Esta publicación no es una encuesta.' }, 400);
    const elegida = publicacion.encuesta.opciones[opcion];
    if (!Number.isInteger(opcion) || !elegida) return json(respuesta, { ok: false, error: 'Opción no válida.' }, 400);
    const yaVotada = elegida.votos.includes(clave);
    publicacion.encuesta.opciones.forEach((o) => { o.votos = o.votos.filter((c) => c !== clave); });
    if (!yaVotada) elegida.votos.push(clave);
    await guardarMuro(lista);
    return json(respuesta, { ok: true, publicacion });
  }

  if (peticion.method === 'DELETE') {
    const id = url.searchParams.get('id') || '';
    const clave = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    const lista = await leerMuro();
    const publicacion = lista.find((p) => p.id === id);
    if (!publicacion) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    if (publicacion.clave !== clave && !(await esAdministradorServidor(clave))) {
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

/* ── Perfiles: la foto y los datos que elige cada persona ────── */
async function leerPerfiles() {
  try {
    const datos = JSON.parse(await readFile(ARCHIVO_PERFILES, 'utf8'));
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
  } catch (e) {
    return {};
  }
}

async function guardarPerfiles(perfiles) {
  await mkdir(dirname(ARCHIVO_PERFILES), { recursive: true });
  const temporal = ARCHIVO_PERFILES + '.tmp';
  await writeFile(temporal, JSON.stringify(perfiles, null, 2), 'utf8');
  await rename(temporal, ARCHIVO_PERFILES);
}

/* Lo que ven los demás: el cumpleaños solo si la persona lo muestra. */
function perfilPublico(p) {
  return { ...p, cumple: p.mostrarCumple ? p.cumple : '' };
}

async function atenderPerfiles(peticion, respuesta, url) {
  if (peticion.method === 'GET' && url.pathname === '/api/perfiles') {
    const mia = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    const todos = await leerPerfiles();
    const salida = {};
    for (const [clave, p] of Object.entries(todos)) salida[clave] = clave === mia ? p : perfilPublico(p);
    return json(respuesta, { ok: true, perfiles: salida });
  }

  if (peticion.method === 'POST' && url.pathname === '/api/perfil') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = limpiar(datos.clave, 120).toLowerCase();
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    const todos = await leerPerfiles();
    const previo = todos[clave] || {};
    const perfil = {
      clave,
      nombre: limpiar(datos.nombre, 60) || previo.nombre || '',
      puesto: limpiar(datos.puesto, 80),
      sede: SEDES_PERFIL.has(datos.sede) ? datos.sede : '',
      idiomas: Array.isArray(datos.idiomas) ? datos.idiomas.map((i) => limpiar(i, 30)).filter(Boolean).slice(0, 8) : [],
      frase: limpiar(datos.frase, 140),
      cumple: /^\d{2}\/\d{2}$/.test(String(datos.cumple || '')) ? datos.cumple : '',
      mostrarCumple: Boolean(datos.mostrarCumple),
      foto: previo.foto || '',
      actualizado: new Date().toISOString()
    };
    if (!perfil.nombre) return json(respuesta, { ok: false, error: 'Falta el nombre.' }, 400);
    todos[clave] = perfil;
    await guardarPerfiles(todos);
    return json(respuesta, { ok: true, perfil });
  }

  if (peticion.method === 'POST' && url.pathname === '/api/perfil/foto') {
    const clave = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    const propuesto = url.searchParams.get('nombre') || 'foto.jpg';
    const extension = extname(propuesto).toLowerCase();
    if (!EXTENSIONES_FOTO_MURO.has(extension)) {
      return json(respuesta, { ok: false, error: 'Formato no admitido. Usa .jpg, .png o .webp.' }, 400);
    }
    try {
      const datos = await cuerpo(peticion, LIMITE_FOTO_PERFIL);
      if (!datos.length) return json(respuesta, { ok: false, error: 'La imagen llegó vacía.' }, 400);
      const nombre = Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + extension;
      await mkdir(DIR_FOTOS_PERFIL, { recursive: true });
      await writeFile(join(DIR_FOTOS_PERFIL, nombre), datos);
      const todos = await leerPerfiles();
      const perfil = todos[clave] || { clave, nombre: limpiar(url.searchParams.get('quien'), 60), puesto: '', sede: '', idiomas: [], frase: '', cumple: '', mostrarCumple: false, foto: '' };
      if (perfil.foto) { try { await unlink(join(RAIZ, perfil.foto)); } catch (e) { /* ya no existe */ } }
      perfil.foto = 'datos/perfiles-fotos/' + nombre;
      perfil.actualizado = new Date().toISOString();
      todos[clave] = perfil;
      await guardarPerfiles(todos);
      return json(respuesta, { ok: true, perfil });
    } catch (e) {
      return json(respuesta, { ok: false, error: 'La imagen supera los 3 MB o no se pudo guardar.' }, 400);
    }
  }

  if (peticion.method === 'DELETE' && url.pathname === '/api/perfil/foto') {
    const clave = limpiar(url.searchParams.get('clave'), 120).toLowerCase();
    const todos = await leerPerfiles();
    const perfil = todos[clave];
    if (!perfil) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    if (perfil.foto) { try { await unlink(join(RAIZ, perfil.foto)); } catch (e) { /* ya no existe */ } }
    perfil.foto = '';
    perfil.actualizado = new Date().toISOString();
    await guardarPerfiles(todos);
    return json(respuesta, { ok: true, perfil });
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

  if (ruta === '/api/perfiles' || ruta === '/api/perfil' || ruta.startsWith('/api/perfil/')) {
    try {
      return await atenderPerfiles(peticion, respuesta, url);
    } catch (e) {
      return json(respuesta, { ok: false, error: 'Error del servidor: ' + e.message }, 500);
    }
  }

  if (atiendeApi(ruta)) return atenderApi(peticion, respuesta, url);

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
