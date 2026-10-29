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
import { pathToFileURL } from 'node:url';
import { RAIZ, leerTodo, guardarTodo, aIdentificador } from './contenido.mjs';
import { enviarAviso } from './correo.mjs';
import { registrarEvento } from './datos.mjs';
import { rankingDe, nombreMes, puntuacion } from '../assets/js/objetivos-calculo.js';

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

const DIR_MODELOS = join(RAIZ, 'assets', 'modelos');
const REGISTRO_MODELOS = join(RAIZ, 'content', 'modelos.js');
const EXTENSIONES_MODELO = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.odt', '.ods', '.odp', '.rtf', '.txt'
]);
const LIMITE_MODELO = 25 * 1024 * 1024; // 25 MB

const DIR_FOTOS = join(RAIZ, 'assets', 'img', 'equipo');
const EXTENSIONES_FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const LIMITE_FOTO = 8 * 1024 * 1024; // 8 MB

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.rtf': 'application/rtf',
  '.txt': 'text/plain; charset=utf-8'
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

/* ── Fotos del equipo ────────────────────────────────────────── */
async function listarFotos() {
  if (!existsSync(DIR_FOTOS)) return [];
  const nombres = await readdir(DIR_FOTOS);
  const salida = [];
  for (const nombre of nombres) {
    if (!EXTENSIONES_FOTO.has(extname(nombre).toLowerCase())) continue;
    const info = await stat(join(DIR_FOTOS, nombre));
    salida.push({ nombre, ruta: 'assets/img/equipo/' + nombre, bytes: info.size });
  }
  return salida.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/* ── Modelos de documentos ───────────────────────────────────── */
async function listarArchivosModelo() {
  if (!existsSync(DIR_MODELOS)) return [];
  const nombres = await readdir(DIR_MODELOS);
  const salida = [];
  for (const nombre of nombres) {
    if (!EXTENSIONES_MODELO.has(extname(nombre).toLowerCase())) continue;
    const info = await stat(join(DIR_MODELOS, nombre));
    salida.push({ nombre, ruta: 'assets/modelos/' + nombre, bytes: info.size });
  }
  return salida.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

async function leerRegistroModelos() {
  try {
    const url = pathToFileURL(REGISTRO_MODELOS).href + '?v=' + Date.now();
    const mod = await import(url);
    return Array.isArray(mod.default) ? mod.default : [];
  } catch (e) {
    return [];
  }
}

const comillas = (v) => "'" + String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ') + "'";

/* Reconstruye content/modelos.js a partir de los archivos presentes,
   conservando el título, la categoría y la descripción ya escritos.
   Con "extra" se aplican datos nuevos a un archivo concreto. */
async function sincronizarModelos(extra) {
  const archivos = await listarArchivosModelo();
  const previos = await leerRegistroModelos();
  const porRuta = new Map(previos.map((m) => [m.archivo, m]));
  const hoy = new Date().toISOString().slice(0, 10);

  const lista = archivos.map((a) => {
    const previo = porRuta.get(a.ruta) || {};
    const cambios = extra && extra.archivo === a.ruta ? extra : {};
    const base = a.nombre.slice(0, a.nombre.length - extname(a.nombre).length);
    return {
      id: previo.id || aIdentificador(base),
      titulo: cambios.titulo || previo.titulo || base.replace(/[-_]+/g, ' '),
      descripcion: cambios.descripcion !== undefined ? cambios.descripcion : (previo.descripcion || ''),
      categoria: cambios.categoria || previo.categoria || 'General',
      archivo: a.ruta,
      bytes: a.bytes,
      actualizado: cambios.nuevo ? hoy : (previo.actualizado || hoy)
    };
  });

  const cuerpoJs = lista.map((m) =>
    '  {\n' +
    '    id: ' + comillas(m.id) + ',\n' +
    '    titulo: ' + comillas(m.titulo) + ',\n' +
    '    descripcion: ' + comillas(m.descripcion) + ',\n' +
    '    categoria: ' + comillas(m.categoria) + ',\n' +
    '    archivo: ' + comillas(m.archivo) + ',\n' +
    '    bytes: ' + m.bytes + ',\n' +
    '    actualizado: ' + comillas(m.actualizado) + '\n' +
    '  }'
  ).join(',\n');

  const texto =
    '/* ===============================================================\n' +
    '   modelos.js - Modelos de documentos del despacho\n' +
    '   ---------------------------------------------------------------\n' +
    '   GENERADO por el panel de administracion al subir o borrar\n' +
    '   archivos en assets/modelos/. Se pueden retocar a mano el\n' +
    '   titulo, la descripcion y la categoria: el panel los conserva.\n' +
    '   =============================================================== */\n\n' +
    'const MODELOS = [\n' + cuerpoJs + '\n];\n\n' +
    'export default MODELOS;\n';

  await writeFile(REGISTRO_MODELOS, texto, 'utf8');
  return lista;
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
    if (mod.video && typeof mod.video === 'object' && mod.video.url !== undefined && mod.video.url !== '' && !texto(mod.video.url)) {
      fallos.push(donde + ': la dirección del vídeo de presentación no es válida.');
    }
    if (mod.examen && typeof mod.examen === 'object') {
      const aprobado = Number(mod.examen.aprobado);
      if (mod.examen.aprobado !== undefined && (!Number.isFinite(aprobado) || aprobado < 1 || aprobado > 100)) {
        fallos.push(donde + ': la nota para aprobar el examen debe estar entre 1 y 100.');
      }
      for (const p of mod.examen.preguntas || []) {
        const dondeP = donde + ', pregunta "' + (p.texto || p.id || 'sin texto') + '"';
        if (!texto(p.texto)) fallos.push(donde + ' tiene una pregunta del examen sin texto.');
        const opciones = Array.isArray(p.opciones) ? p.opciones.filter(texto) : [];
        if (opciones.length < 2) fallos.push(dondeP + ': necesita al menos dos opciones.');
        if (!Number.isInteger(Number(p.correcta)) || Number(p.correcta) < 0 || Number(p.correcta) >= opciones.length) {
          fallos.push(dondeP + ': la opción correcta no es válida.');
        }
      }
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
      const conVideo = lec.video && typeof lec.video === 'object' && texto(lec.video.url);
      if (lec.video && typeof lec.video === 'object' && lec.video.url && !conVideo) {
        fallos.push(donde + ', lección "' + lec.titulo + '": la dirección del vídeo no es válida.');
      }
      if (conVideo && lec.video.minutos !== undefined && lec.video.minutos !== '' &&
          (!Number.isFinite(Number(lec.video.minutos)) || Number(lec.video.minutos) < 0)) {
        fallos.push(donde + ', lección "' + lec.titulo + '": la duración del vídeo no es válida.');
      }
      if ((typeof lec.md !== 'string' || !lec.md.trim()) && !conVideo) {
        fallos.push(donde + ', lección "' + lec.titulo + '": necesita un vídeo o unos apuntes.');
      }
    }
  }

  if (datos.personas !== undefined) {
    if (!Array.isArray(datos.personas)) {
      fallos.push('La lista de personas no es válida.');
    } else {
      const correos = new Set();
      for (const p of datos.personas) {
        const correo = String(p.correo || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
          fallos.push('"' + (p.correo || 'sin correo') + '" no parece un correo válido en Personas.');
          continue;
        }
        if (correos.has(correo)) fallos.push('El correo ' + correo + ' está repetido en Personas.');
        correos.add(correo);
        if (!texto(p.nombre)) fallos.push('La persona ' + correo + ' no tiene nombre.');
        if (!['administracion', 'equipo'].includes(p.rol)) fallos.push('El rol de ' + correo + ' no es válido.');
      }
      const administradoresActivos = datos.personas.filter((p) => p.rol === 'administracion' && p.activo !== false);
      if (datos.personas.length && !administradoresActivos.length) {
        fallos.push('Tiene que quedar al menos una persona activa con rol de administración.');
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

  const eq = datos.equipo;
  if (eq && typeof eq === 'object') {
    for (const p of eq.empleadosDelMes || []) {
      const donde = 'El reconocimiento de "' + (p.nombre || 'sin nombre') + '"';
      if (!texto(p.nombre)) fallos.push('Hay un empleado del mes sin nombre.');
      if (!/^\d{4}-\d{2}$/.test(p.mes || '')) fallos.push(donde + ' necesita un mes en formato AAAA-MM.');
    }
    for (const an of eq.tablon || []) {
      const donde = 'El anuncio "' + (an.titulo || 'sin título') + '"';
      if (!texto(an.titulo)) fallos.push('Hay un anuncio del tablón sin título.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(an.fecha || '')) fallos.push(donde + ' no tiene una fecha válida.');
      if (!['evento', 'aviso', 'celebracion'].includes(an.tipo)) fallos.push(donde + ' no tiene un tipo válido.');
    }
    const rk = eq.ranking;
    if (rk) {
      if (rk.actualizado && !/^\d{4}-\d{2}-\d{2}$/.test(rk.actualizado)) {
        fallos.push('La fecha de actualización del ranking no es válida.');
      }
      for (const p of rk.personas || []) {
        if (!texto(p.nombre)) fallos.push('Hay una persona del ranking sin nombre.');
        if (!Number.isFinite(Number(p.puntos)) || Number(p.puntos) < 0) {
          fallos.push('Los puntos de "' + (p.nombre || 'sin nombre') + '" no son válidos.');
        }
      }
    }
  }

  if (datos.objetivos && typeof datos.objetivos === 'object') {
    const ob = datos.objetivos;
    const plantillas = ob.plantillas || {};
    for (const [pid, p] of Object.entries(plantillas)) {
      const donde = 'La plantilla de objetivos "' + (p.titulo || pid) + '"';
      if (!texto(p.titulo)) fallos.push('Hay una plantilla de objetivos sin título.');
      const ids = new Set();
      for (const o of p.objetivos || []) {
        if (!texto(o.texto)) fallos.push(donde + ' tiene un objetivo sin texto.');
        if (!o.id || !/^[a-z0-9-]+$/.test(o.id) || ids.has(o.id)) fallos.push(donde + ' tiene un objetivo con identificador repetido o no válido.');
        ids.add(o.id);
        if (!(Number(o.max) >= 0)) fallos.push(donde + ': la puntuación máxima de "' + (o.texto || o.id) + '" no es válida.');
        if (o.tipo === 'proporcional' && !(Number(o.meta) > 0)) fallos.push(donde + ': "' + (o.texto || o.id) + '" necesita una meta mayor que cero.');
        if (o.tipo === 'relativo' && !(p.objetivos || []).some((x) => x.id === o.base)) fallos.push(donde + ': "' + (o.texto || o.id) + '" se calcula sobre un objetivo que no existe.');
        if (o.tipo === 'relativo' && !(Number(o.proporcion) > 0)) fallos.push(donde + ': "' + (o.texto || o.id) + '" necesita una proporción mayor que cero.');
      }
    }
    const idsPersona = new Set();
    for (const p of ob.personas || []) {
      if (!texto(p.nombre)) fallos.push('Hay una persona de objetivos sin nombre.');
      if (!p.id || idsPersona.has(p.id)) fallos.push('La persona de objetivos "' + (p.nombre || '') + '" tiene un identificador repetido o vacío.');
      idsPersona.add(p.id);
      if (!plantillas[p.plantilla]) fallos.push((p.nombre || p.id) + ' tiene una plantilla de objetivos que no existe.');
      if (p.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.correo))) fallos.push('El correo de ' + (p.nombre || p.id) + ' en objetivos no es válido.');
    }
    for (const [mes, porPersona] of Object.entries(ob.meses || {})) {
      if (!/^\d{4}-\d{2}$/.test(mes)) fallos.push('El mes "' + mes + '" de objetivos no tiene formato AAAA-MM.');
      for (const [pid, r] of Object.entries(porPersona || {})) {
        if (!idsPersona.has(pid)) fallos.push('En objetivos de ' + mes + ' hay resultados de "' + pid + '", que no está dado de alta.');
        if (r && r.total !== undefined && r.total !== null && r.total !== '' && !(Number(r.total) >= 0)) fallos.push('La puntuación final de "' + pid + '" en ' + mes + ' no es válida.');
      }
    }
  }

  return fallos;
}

/* ── Actividad reciente: lo nuevo que publica el panel ───────── */
async function anotarActividad(previo, nuevo) {
  const modulosPrevios = new Map((previo.modulos || []).map((m) => [m.id, m]));
  for (const mod of nuevo.modulos || []) {
    const antes = modulosPrevios.get(mod.id);
    if (!antes) {
      await registrarEvento({ tipo: 'formacion', texto: 'Nueva formación disponible: «' + mod.titulo + '»', ruta: '#/modulo/' + mod.id, actor: { clave: '', nombre: 'Formación' } });
      continue;
    }
    const leccionesAntes = new Set((antes.lecciones || []).map((l) => l.id));
    const nuevas = (mod.lecciones || []).filter((l) => !leccionesAntes.has(l.id));
    if (nuevas.length) {
      await registrarEvento({ tipo: 'formacion', texto: (nuevas.length === 1 ? 'Nueva lección «' + nuevas[0].titulo + '»' : nuevas.length + ' lecciones nuevas') + ' en «' + mod.titulo + '»', ruta: '#/modulo/' + mod.id, actor: { clave: '', nombre: 'Formación' } });
    }
    const videosAntes = new Set((antes.lecciones || []).filter((l) => l.video && l.video.url).map((l) => l.id));
    const conVideoNuevo = (mod.lecciones || []).filter((l) => l.video && l.video.url && !videosAntes.has(l.id) && leccionesAntes.has(l.id));
    if (conVideoNuevo.length) {
      await registrarEvento({ tipo: 'video', texto: 'Vídeo nuevo en «' + mod.titulo + '»: ' + conVideoNuevo.map((l) => l.titulo).join(', '), ruta: '#/modulo/' + mod.id + '/' + conVideoNuevo[0].id, actor: { clave: '', nombre: 'Formación' } });
    }
    const examenAntes = antes.examen && (antes.examen.preguntas || []).length;
    if (!examenAntes && mod.examen && (mod.examen.preguntas || []).length) {
      await registrarEvento({ tipo: 'examen', texto: 'Ya puedes hacer el examen de «' + mod.titulo + '»', ruta: '#/modulo/' + mod.id, actor: { clave: '', nombre: 'Formación' } });
    }
  }
  const nov = (nuevo.novedades || [])[0];
  if (nov && !(previo.novedades || []).some((x) => x.fecha === nov.fecha && x.titulo === nov.titulo)) {
    await registrarEvento({ tipo: 'novedad', texto: 'Nuevo comunicado: «' + nov.titulo + '»', ruta: '#/novedades', actor: { clave: '', nombre: 'Despacho' } });
  }
  const edm = ((nuevo.equipo || {}).empleadosDelMes || [])[0];
  const edmPrevio = ((previo.equipo || {}).empleadosDelMes || [])[0];
  if (edm && (!edmPrevio || edmPrevio.mes !== edm.mes)) {
    await registrarEvento({ tipo: 'reconocimiento', texto: edm.nombre + ' es el empleado o empleada del mes', ruta: '#/equipo', actor: { clave: '', nombre: 'Despacho' } });
  }
  // Resultados de objetivos: un mes nuevo, o un mes que pasa a tener datos.
  const mesesAntes = (previo.objetivos && previo.objetivos.meses) || {};
  const mesesAhora = (nuevo.objetivos && nuevo.objetivos.meses) || {};
  for (const mes of Object.keys(mesesAhora).sort()) {
    const ahora = Object.keys(mesesAhora[mes] || {}).length;
    const antes = Object.keys(mesesAntes[mes] || {}).length;
    if (!ahora || ahora <= antes) continue;
    const ranking = rankingDe(nuevo.objetivos, mes);
    const primero = ranking[0];
    await registrarEvento({
      tipo: 'objetivos',
      texto: 'Publicados los resultados de objetivos de ' + nombreMes(mes) +
        (primero ? ': ' + primero.persona.nombre + ' encabeza el ranking con ' + puntuacion(primero.total) + ' puntos' : ''),
      ruta: '#/objetivos',
      actor: { clave: '', nombre: 'Dirección' }
    });
  }
}

/* ── Avisos por correo al publicar cosas nuevas ──────────────── */
function avisarNovedades(previo, nuevo) {
  const yaEstaba = (lista, elemento, campos) =>
    (lista || []).some((x) => campos.every((c) => x[c] === elemento[c]));

  const nov = (nuevo.novedades || [])[0];
  if (nov && !yaEstaba(previo.novedades, nov, ['fecha', 'titulo'])) {
    enviarAviso('Novedad del despacho: ' + nov.titulo,
      'Se ha publicado una novedad (' + nov.fecha + '):\n\n' + nov.titulo +
      '\n\nEntra en la plataforma para leerla completa.');
  }

  const eq = nuevo.equipo || {};
  const eqPrevio = previo.equipo || {};

  const anuncio = (eq.tablon || [])[0];
  if (anuncio && !yaEstaba(eqPrevio.tablon, anuncio, ['fecha', 'titulo'])) {
    enviarAviso('Tablón del despacho: ' + anuncio.titulo,
      'Nuevo anuncio en el tablón (' + anuncio.tipo + ', ' + anuncio.fecha + '):\n\n' +
      anuncio.titulo + '\n\nEntra en la plataforma para verlo.');
  }

  const edm = (eq.empleadosDelMes || [])[0];
  const edmPrevio = (eqPrevio.empleadosDelMes || [])[0];
  if (edm && (!edmPrevio || edmPrevio.mes !== edm.mes)) {
    enviarAviso('Empleado/a del mes: ' + edm.nombre,
      edm.nombre + ' es el empleado/a del mes (' + edm.mes + ').\n\n' +
      (edm.motivo || '') + '\n\n¡Dale la enhorabuena! Lo tienes en la sección Equipo.');
  }

  const rk = eq.ranking || {};
  const rkPrevio = eqPrevio.ranking || {};
  if (rk.actualizado && rk.actualizado !== rkPrevio.actualizado && (rk.personas || []).length) {
    enviarAviso('Ranking de formación actualizado',
      'RRHH ha publicado el ranking (' + rk.actualizado + ').\n\n' +
      'Primer puesto: ' + rk.personas[0].nombre +
      '\n\nLa clasificación completa está en la sección Equipo.');
  }
}

/* ── Rutas ───────────────────────────────────────────────────── */
async function atender(peticion, respuesta) {
  const url = new URL(peticion.url, 'http://localhost');
  const ruta = decodeURIComponent(url.pathname);

  /* --- API --- */
  if (ruta === '/api/estado' && peticion.method === 'GET') {
    const datos = await leerTodo();
    return json(respuesta, {
      ...datos,
      videos: await listarVideos(),
      modelos: await leerRegistroModelos(),
      fotos: await listarFotos(),
      git: await estadoGit()
    });
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
      const previo = await leerTodo();
      const ordenados = await guardarTodo(datos);
      console.log(`  Guardado: ${ordenados.length} módulos, ${datos.novedades.length} novedades` +
        (Array.isArray(datos.personas) ? `, ${datos.personas.length} personas` : ''));
      avisarNovedades(previo, datos);
      anotarActividad(previo, datos).catch(() => {});
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

  if (ruta === '/api/foto' && peticion.method === 'POST') {
    const propuesto = url.searchParams.get('nombre') || '';
    const extension = extname(propuesto).toLowerCase();
    if (!EXTENSIONES_FOTO.has(extension)) {
      return json(respuesta, { ok: false, error: 'Formato no admitido. Usa .jpg, .png o .webp.' }, 400);
    }
    const nombre = aIdentificador(propuesto.slice(0, -extension.length)) + extension;
    try {
      const datos = await cuerpo(peticion, LIMITE_FOTO);
      await mkdir(DIR_FOTOS, { recursive: true });
      await writeFile(join(DIR_FOTOS, nombre), datos);
      console.log(`  Foto añadida: assets/img/equipo/${nombre}`);
      return json(respuesta, { ok: true, nombre, ruta: 'assets/img/equipo/' + nombre, fotos: await listarFotos() });
    } catch (e) {
      return json(respuesta, { ok: false, error: e.message }, 400);
    }
  }

  if (ruta === '/api/foto' && peticion.method === 'DELETE') {
    const nombre = url.searchParams.get('nombre') || '';
    if (nombre.includes('/') || nombre.includes('\\') || nombre.includes('..')) {
      return json(respuesta, { ok: false, error: 'Nombre no válido.' }, 400);
    }
    const destino = join(DIR_FOTOS, nombre);
    if (!existsSync(destino)) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    await unlink(destino);
    console.log(`  Foto eliminada: ${nombre}`);
    return json(respuesta, { ok: true, fotos: await listarFotos() });
  }

  if (ruta === '/api/modelo' && peticion.method === 'POST') {
    const propuesto = url.searchParams.get('nombre') || '';
    const extension = extname(propuesto).toLowerCase();
    if (!EXTENSIONES_MODELO.has(extension)) {
      return json(respuesta, { ok: false, error: 'Formato no admitido. Usa PDF, Word, Excel, PowerPoint, OpenDocument, RTF o TXT.' }, 400);
    }
    const nombre = aIdentificador(propuesto.slice(0, -extension.length)) + extension;
    try {
      const datos = await cuerpo(peticion, LIMITE_MODELO);
      await mkdir(DIR_MODELOS, { recursive: true });
      await writeFile(join(DIR_MODELOS, nombre), datos);
      const modelos = await sincronizarModelos({ archivo: 'assets/modelos/' + nombre, nuevo: true });
      console.log(`  Modelo añadido: assets/modelos/${nombre} (${(datos.length / 1048576).toFixed(1)} MB)`);
      return json(respuesta, { ok: true, nombre, modelos });
    } catch (e) {
      return json(respuesta, { ok: false, error: e.message }, 400);
    }
  }

  if (ruta === '/api/modelo' && peticion.method === 'DELETE') {
    const nombre = url.searchParams.get('nombre') || '';
    if (nombre.includes('/') || nombre.includes('\\') || nombre.includes('..')) {
      return json(respuesta, { ok: false, error: 'Nombre no válido.' }, 400);
    }
    const destino = join(DIR_MODELOS, nombre);
    if (!existsSync(destino)) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
    await unlink(destino);
    const modelos = await sincronizarModelos();
    console.log(`  Modelo eliminado: ${nombre}`);
    return json(respuesta, { ok: true, modelos });
  }

  if (ruta === '/api/modelo-datos' && peticion.method === 'POST') {
    let datos;
    try {
      datos = JSON.parse((await cuerpo(peticion, 64 * 1024)).toString('utf8'));
    } catch (e) {
      return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    }
    if (typeof datos.archivo !== 'string' || !datos.archivo.startsWith('assets/modelos/')) {
      return json(respuesta, { ok: false, error: 'Archivo no válido.' }, 400);
    }
    const modelos = await sincronizarModelos({
      archivo: datos.archivo,
      titulo: typeof datos.titulo === 'string' ? datos.titulo.trim() : undefined,
      categoria: typeof datos.categoria === 'string' ? datos.categoria.trim() : undefined,
      descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : undefined
    });
    return json(respuesta, { ok: true, modelos });
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
