/* ===============================================================
   empaquetar.mjs - Genera una versión de la plataforma en un solo
   archivo HTML, sin dependencias externas ni servidor.
   ---------------------------------------------------------------
   Uso:  node herramientas/empaquetar.mjs
   Salida: dist/formacion-diazyasociados.html

   Útil para: enviar la plataforma por correo, llevarla en un USB,
   abrirla a doble clic (el index.html normal necesita servidor
   porque usa módulos ES) o publicarla como página única. Sin servidor
   no hay Conecta, perfiles, exámenes ni seguimiento: el portal lo
   detecta y sigue funcionando con el progreso local.
   =============================================================== */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8');

/* Convierte un módulo ES en código plano para un único ámbito. */
function aplanar(codigo, nombreDefecto) {
  let s = codigo
    // import ... from '...';  (incluidos los que ocupan varias líneas)
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];[ \t]*$/gm, '')
    // export { A, B };
    .replace(/^export\s*\{[^}]*\}\s*;[ \t]*$/gm, '');

  if (nombreDefecto) {
    s = s.replace(/^export\s+default\s+/m, `const ${nombreDefecto} = `);
  }
  // export const / export function / export class
  s = s.replace(/^export\s+(?=(const|let|var|function|class)\b)/gm, '');

  if (/^\s*(import|export)\b/m.test(s)) {
    throw new Error('Quedan import/export sin aplanar en el módulo ' + (nombreDefecto || '(sin nombre)'));
  }
  return s.trim();
}

/* ── Contenidos ──────────────────────────────────────────────── */
const ARCHIVOS_MODULOS = [
  '01-bienvenida', '02-servicios', '03-protocolo', '04-coordinacion',
  '05-herramientas', '06-hubspot', '07-control-clientes', '08-citas',
  '09-tramites', '10-documental', '11-incidencias', '12-leads',
  '13-comercial', '14-atencion', '15-marketing', '16-facturacion',
  '17-proteccion-datos', '18-formacion-continua'
];

const piezas = [];

piezas.push(aplanar(leer('assets/js/iconos.js')));
piezas.push(aplanar(leer('assets/js/markdown.js')));

ARCHIVOS_MODULOS.forEach((archivo, i) => {
  const nombre = 'm' + String(i + 1).padStart(2, '0');
  piezas.push(aplanar(leer(`content/modulos/${archivo}.js`), nombre));
});

piezas.push(aplanar(leer('content/curriculo.js')));
piezas.push(aplanar(leer('content/novedades.js'), 'novedades'));
piezas.push(aplanar(leer('content/equipo.js'), 'equipo'));
piezas.push(aplanar(leer('content/objetivos.js'), 'objetivos'));
piezas.push(aplanar(leer('content/modelos.js'), 'modelos'));
piezas.push(aplanar(leer('content/personas.js'), 'personas'));
piezas.push(aplanar(leer('content/administradores.js'), 'administradores'));
piezas.push(aplanar(leer('assets/js/estado.js')));
piezas.push(aplanar(leer('assets/js/objetivos-calculo.js')));
piezas.push(aplanar(leer('assets/js/buscador.js')));
piezas.push(aplanar(leer('assets/js/perfiles.js')));
piezas.push(aplanar(leer('assets/js/api.js')));
piezas.push(aplanar(leer('assets/js/vistas.js')));
piezas.push(aplanar(leer('assets/js/app.js')));

const guion = piezas.join('\n\n/* ---------------------------------------------- */\n\n');

/* ── Imágenes en línea ───────────────────────────────────────── */
const aDatos = (ruta) =>
  'data:image/svg+xml;base64,' + Buffer.from(leer(ruta), 'utf8').toString('base64');
const aDatosBinario = (ruta, mime) =>
  'data:' + mime + ';base64,' + readFileSync(resolve(RAIZ, ruta)).toString('base64');

const LOGO = aDatosBinario('assets/img/logo.png', 'image/png');
const LOGO_INT = aDatosBinario('assets/img/logo-internacional.jpg', 'image/jpeg');
const INSIGNIA = aDatosBinario('assets/img/insignia.jpg', 'image/jpeg');
const FAVICON = aDatos('assets/img/favicon.svg');

/* ── Montaje del HTML ────────────────────────────────────────── */
let html = leer('index.html');

// Se conserva solo el contenido del body.
const cuerpo = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

const enlaceFuentes = (html.match(/<link href="https:\/\/fonts\.googleapis[^>]*>/) || [''])[0];
const css = leer('assets/css/styles.css');

const salida = `<title>Formación Díaz y Asociados</title>
<link rel="icon" href="${FAVICON}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${enlaceFuentes}
<style>
${css}
</style>

<script>
/* Fija el tema antes del primer pintado para evitar el parpadeo. */
(function () {
  var anfitrion = document.documentElement.getAttribute('data-theme');
  var guardado = null;
  try { guardado = JSON.parse(localStorage.getItem('dya.formacion.tema')); } catch (e) { /* nada */ }
  var t = (guardado === 'claro' || guardado === 'oscuro') ? guardado
        : anfitrion === 'dark' ? 'oscuro'
        : anfitrion === 'light' ? 'claro'
        : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'oscuro'
        : 'claro';
  document.documentElement.setAttribute('data-tema', t);
})();
</script>
${cuerpo
  .replace(/<script type="module"[^>]*><\/script>/, '')
  .replace(/src="assets\/img\/logo\.png"/g, `src="${LOGO}"`)
  .replace(/src="assets\/img\/insignia\.jpg"/g, `src="${INSIGNIA}"`)
  .replace(/src="assets\/img\/logo-internacional\.jpg"/g, `src="${LOGO_INT}"`)
  .trimEnd()}

<script>
(function () {
'use strict';
${guion}
})();
</script>
`;

mkdirSync(resolve(RAIZ, 'dist'), { recursive: true });
const destino = resolve(RAIZ, 'dist/formacion-diazyasociados.html');
writeFileSync(destino, salida, 'utf8');

const kb = (Buffer.byteLength(salida, 'utf8') / 1024).toFixed(0);
console.log(`Generado dist/formacion-diazyasociados.html (${kb} KB)`);
