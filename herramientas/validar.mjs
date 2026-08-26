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

  const idsLeccion = new Set();
  for (const lec of mod.lecciones || []) {
    const dondeLec = `${donde} / lección ${lec.id || '(sin id)'}`;
    if (!lec.id || !lec.titulo || !lec.md) error(`${dondeLec}: faltan campos obligatorios`);
    if (idsLeccion.has(lec.id)) error(`${dondeLec}: identificador repetido`);
    idsLeccion.add(lec.id);
    try {
      const html = render(lec.md);
      if (/undefined/.test(html)) error(`${dondeLec}: aparece "undefined" en el HTML generado`);
      if (!aTextoPlano(lec.md).trim()) error(`${dondeLec}: el texto plano queda vacío`);
    } catch (e) {
      error(`${dondeLec}: fallo al renderizar (${e.message})`);
    }
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

const pendientes = LECCIONES.reduce((n, l) => n + (l.md.match(/\[!PENDIENTE\]/g) || []).length, 0);
const videos = LECCIONES.reduce((n, l) => n + (l.md.match(/^[ \t]*(\`\`\`|:::)video/gm) || []).length, 0);
const palabras = LECCIONES.reduce((n, l) => n + aTextoPlano(l.md).split(/\s+/).length, 0);

console.log('');
console.log(`  Módulos          ${MODULOS.length}`);
console.log(`  Grupos           ${GRUPOS.length}`);
console.log(`  Lecciones        ${LECCIONES.length}`);
console.log(`  Novedades        ${novedades.length}`);
console.log(`  Vídeos           ${videos}`);
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
