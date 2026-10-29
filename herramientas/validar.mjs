/* ===============================================================
   validar.mjs - Comprueba la integridad de los contenidos
   ---------------------------------------------------------------
   Uso:  npm run validar

   Verifica que los módulos están bien formados, que no hay
   identificadores repetidos, que la numeración es correlativa, que
   los grupos van seguidos y que todo el Markdown se renderiza.
   =============================================================== */

import { MODULOS, GRUPOS, LECCIONES, TOTAL_MINUTOS } from '../content/curriculo.js';
import novedades from '../content/novedades.js';
import personas from '../content/personas.js';
import objetivos from '../content/objetivos.js';
import { render, aTextoPlano } from '../assets/js/markdown.js';

const errores = [];
const avisos = [];
const error = (m) => errores.push(m);
const aviso = (m) => avisos.push(m);

const gruposValidos = new Set(GRUPOS.map((g) => g.id));
const ids = new Set();
const nums = new Set();

for (const mod of MODULOS) {
  const donde = 'módulo ' + (mod.id || '(sin id)');

  for (const campo of ['id', 'num', 'grupo', 'titulo', 'resumen', 'duracion', 'lecciones']) {
    if (mod[campo] === undefined) error(`${donde}: falta el campo "${campo}"`);
  }
  if (ids.has(mod.id)) error(`${donde}: identificador repetido`);
  ids.add(mod.id);
  if (nums.has(mod.num)) error(`${donde}: número repetido (${mod.num})`);
  nums.add(mod.num);
  if (!gruposValidos.has(mod.grupo)) error(`${donde}: grupo desconocido "${mod.grupo}"`);
  if (!Array.isArray(mod.lecciones) || !mod.lecciones.length) error(`${donde}: sin lecciones`);
  if (mod.video && !(typeof mod.video.url === 'string' && mod.video.url.trim())) {
    error(`${donde}: el vídeo de presentación no tiene dirección`);
  }
  if (mod.examen) {
    const preguntas = Array.isArray(mod.examen.preguntas) ? mod.examen.preguntas : [];
    if (!preguntas.length) error(`${donde}: el examen no tiene preguntas`);
    const idsPregunta = new Set();
    preguntas.forEach((p, i) => {
      const dondeP = `${donde} / pregunta ${i + 1}`;
      if (!p.id || !p.texto) error(`${dondeP}: falta el identificador o el texto`);
      if (idsPregunta.has(p.id)) error(`${dondeP}: identificador repetido`);
      idsPregunta.add(p.id);
      if (!Array.isArray(p.opciones) || p.opciones.length < 2) error(`${dondeP}: necesita al menos dos opciones`);
      else if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= p.opciones.length) error(`${dondeP}: la opción correcta no es válida`);
    });
  }

  const idsLeccion = new Set();
  for (const lec of mod.lecciones || []) {
    const dondeLec = `${donde} / lección ${lec.id || '(sin id)'}`;
    const conVideo = Boolean(lec.video && typeof lec.video.url === 'string' && lec.video.url.trim());
    if (!lec.id || !lec.titulo) error(`${dondeLec}: faltan campos obligatorios`);
    if (!conVideo && !(lec.md || '').trim()) error(`${dondeLec}: no tiene ni vídeo ni apuntes`);
    if (lec.video && !conVideo) error(`${dondeLec}: el vídeo no tiene dirección`);
    if (idsLeccion.has(lec.id)) error(`${dondeLec}: identificador repetido`);
    idsLeccion.add(lec.id);
    if ((lec.md || '').trim()) {
      try {
        const html = render(lec.md);
        if (/undefined/.test(html)) error(`${dondeLec}: aparece "undefined" en el HTML generado`);
        if (!aTextoPlano(lec.md).trim()) error(`${dondeLec}: el texto plano queda vacío`);
      } catch (e) {
        error(`${dondeLec}: fallo al renderizar (${e.message})`);
      }
    }
  }
}

/* Personas y accesos */
const correosVistos = new Set();
for (const p of personas) {
  const donde = 'persona "' + (p.correo || p.nombre || '(sin datos)') + '"';
  const correo = String(p.correo || '').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) error(`${donde}: correo no válido`);
  if (correosVistos.has(correo)) error(`${donde}: correo repetido`);
  correosVistos.add(correo);
  if (!p.nombre) error(`${donde}: sin nombre`);
  if (!['administracion', 'equipo'].includes(p.rol)) error(`${donde}: rol desconocido "${p.rol}"`);
}
if (personas.length && !personas.some((p) => p.rol === 'administracion' && p.activo !== false)) {
  error('no queda ninguna persona activa con rol de administración');
}

/* Objetivos: plantillas, personas y meses */
const TIPOS_OBJETIVO = ['proporcional', 'relativo', 'valoracion'];
const plantillasObj = (objetivos && objetivos.plantillas) || {};
for (const [pid, p] of Object.entries(plantillasObj)) {
  const donde = 'plantilla de objetivos "' + pid + '"';
  const idsObj = new Set();
  if (!Array.isArray(p.objetivos) || !p.objetivos.length) error(`${donde}: sin objetivos`);
  for (const o of p.objetivos || []) {
    if (!o.id || !/^[a-z0-9-]+$/.test(o.id)) error(`${donde}: identificador de objetivo no válido "${o.id}"`);
    if (idsObj.has(o.id)) error(`${donde}: identificador repetido "${o.id}"`);
    idsObj.add(o.id);
    if (!o.texto) error(`${donde}: el objetivo "${o.id}" no tiene texto`);
    if (!(Number(o.max) >= 0)) error(`${donde}: la puntuación máxima de "${o.id}" no es válida`);
    if (!TIPOS_OBJETIVO.includes(o.tipo)) error(`${donde}: tipo desconocido "${o.tipo}" en "${o.id}"`);
    if (o.tipo === 'proporcional' && !(Number(o.meta) > 0)) error(`${donde}: "${o.id}" necesita una meta mayor que cero`);
    if (o.tipo === 'relativo' && !(Number(o.proporcion) > 0)) error(`${donde}: "${o.id}" necesita una proporción mayor que cero`);
    if (o.tipo === 'relativo' && !(p.objetivos || []).some((x) => x.id === o.base)) error(`${donde}: "${o.id}" se calcula sobre "${o.base}", que no existe`);
  }
}
const idsPersonaObj = new Set();
for (const p of (objetivos && objetivos.personas) || []) {
  const donde = 'persona de objetivos "' + (p.nombre || p.id || '(sin datos)') + '"';
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) error(`${donde}: identificador no válido`);
  if (idsPersonaObj.has(p.id)) error(`${donde}: identificador repetido`);
  idsPersonaObj.add(p.id);
  if (!p.nombre) error(`${donde}: sin nombre`);
  if (!plantillasObj[p.plantilla]) error(`${donde}: plantilla desconocida "${p.plantilla}"`);
  for (const [k, v] of Object.entries(p.metas || {})) if (!(Number(v) >= 0)) error(`${donde}: la meta de "${k}" no es un número`);
}
let mesesObj = 0;
for (const [mes, porPersona] of Object.entries((objetivos && objetivos.meses) || {})) {
  if (!/^\d{4}-\d{2}$/.test(mes)) error(`objetivos: el mes "${mes}" no tiene formato AAAA-MM`);
  for (const [pid, r] of Object.entries(porPersona || {})) {
    mesesObj++;
    if (!idsPersonaObj.has(pid)) error(`objetivos ${mes}: la persona "${pid}" no existe`);
    for (const mapa of [r.resultados, r.puntos]) {
      for (const [k, v] of Object.entries(mapa || {})) if (!Number.isFinite(Number(v))) error(`objetivos ${mes} / ${pid}: "${k}" no es un número`);
    }
    if (r.total !== undefined && !(Number(r.total) >= 0)) error(`objetivos ${mes} / ${pid}: la puntuación final no es válida`);
  }
}

MODULOS.forEach((mod, i) => {
  if (mod.num !== i + 1) error(`orden incorrecto: en la posición ${i + 1} está el número ${mod.num}`);
});

const secuencia = [];
for (const mod of MODULOS) {
  if (secuencia[secuencia.length - 1] !== mod.grupo) secuencia.push(mod.grupo);
}
if (new Set(secuencia).size !== secuencia.length) {
  error('los módulos de un mismo grupo no van seguidos en el itinerario');
}
for (const g of GRUPOS) {
  if (!secuencia.includes(g.id)) aviso(`el grupo "${g.id}" no tiene ningún módulo`);
}

for (const nov of novedades) {
  const donde = 'novedad "' + (nov.titulo || '(sin título)') + '"';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nov.fecha || '')) error(`${donde}: fecha no válida (se espera AAAA-MM-DD)`);
  if (!['critica', 'importante', 'informativa'].includes(nov.nivel)) {
    error(`${donde}: nivel no válido "${nov.nivel}"`);
  }
  try { render(nov.md); } catch (e) { error(`${donde}: fallo al renderizar (${e.message})`); }
}

const ordenadas = [...novedades].map((n) => n.fecha);
if (ordenadas.join() !== [...ordenadas].sort().reverse().join()) {
  aviso('las novedades no están ordenadas de más reciente a más antigua');
}

const pendientes = LECCIONES.reduce((n, l) => n + ((l.md || '').match(/\[!PENDIENTE\]/g) || []).length, 0);
const videosEnTexto = LECCIONES.reduce((n, l) => n + ((l.md || '').match(/^[ \t]*(\`\`\`|:::)video/gm) || []).length, 0);
const leccionesConVideo = LECCIONES.filter((l) => l.video && l.video.url).length;
const modulosConVideo = MODULOS.filter((m) => m.video && m.video.url).length;
const modulosConExamen = MODULOS.filter((m) => m.examen && (m.examen.preguntas || []).length).length;
const palabras = LECCIONES.reduce((n, l) => n + aTextoPlano(l.md || '').split(/\s+/).length, 0);

console.log('');
console.log(`  Módulos          ${MODULOS.length} (${modulosConVideo} con vídeo de presentación, ${modulosConExamen} con examen)`);
console.log(`  Grupos           ${GRUPOS.length}`);
console.log(`  Lecciones        ${LECCIONES.length} (${leccionesConVideo} con vídeo principal)`);
console.log(`  Novedades        ${novedades.length}`);
console.log(`  Personas         ${personas.length} (${personas.filter((p) => p.rol === 'administracion').length} administran)`);
console.log(`  Objetivos        ${((objetivos && objetivos.personas) || []).length} personas · ${mesesObj} meses puntuados · ${Object.keys(plantillasObj).length} plantillas`);
console.log(`  Vídeos           ${leccionesConVideo + modulosConVideo + videosEnTexto}`);
console.log(`  Palabras         ~${palabras.toLocaleString('es-ES')}`);
console.log(`  Duración         ${TOTAL_MINUTOS} min (${(TOTAL_MINUTOS / 60).toFixed(1)} h)`);
console.log(`  Sin completar    ${pendientes} bloques [!PENDIENTE]`);
console.log('');

if (avisos.length) {
  console.log('  AVISOS');
  avisos.forEach((a) => console.log('    · ' + a));
  console.log('');
}

if (errores.length) {
  console.log('  ERRORES');
  errores.forEach((e) => console.log('    · ' + e));
  console.log('');
  process.exit(1);
}

console.log('  Contenidos correctos.');
console.log('');
