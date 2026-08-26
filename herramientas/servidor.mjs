/* ===============================================================
   servidor.mjs - Servidor de desarrollo, sin dependencias
   ---------------------------------------------------------------
   Uso:  npm run dev        (o: node herramientas/servidor.mjs)
   Opciones:  --puerto 3000
   =============================================================== */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
  '.md':   'text/markdown; charset=utf-8'
};

const servidor = createServer(async (peticion, respuesta) => {
  const url = new URL(peticion.url, 'http://localhost');
  let ruta = decodeURIComponent(url.pathname);
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
    // Todo lo que no exista cae en index.html, igual que en Netlify.
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
  console.log('  Clave de acceso: Onboarding');
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
