/* ===============================================================
   panel.js - Lógica del panel de administración
   ---------------------------------------------------------------
   Trabaja sobre una copia en memoria de los contenidos. Nada se
   escribe en disco hasta que se pulsa "Guardar cambios".

   Pantallas: inicio (resumen y tareas), módulos y lecciones (con el
   vídeo como primer elemento de cada lección), biblioteca de vídeos,
   bloques del itinerario, personas y accesos, reconocimientos y
   tablón, objetivos del mes, novedades, modelos y ayuda.
   =============================================================== */

import { render, videoHtml, interpretarVideo } from '/assets/js/markdown.js';
import { ico } from '/assets/js/iconos.js';
import {
  calcularMes, rankingDe, puestoDe, mesesConDatos, mesesDe, puntuacion, formatearMeta, nombreMes, TIPOS_OBJETIVO, registroDe
} from '/assets/js/objetivos-calculo.js';

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => Array.from(raiz.querySelectorAll(s));

/* ── Estado ──────────────────────────────────────────────────── */
let datos = null;      // { version, grupos, modulos, novedades, equipo, objetivos, personas }
let original = '';     // instantánea para detectar cambios
let vista = 'inicio';
let abierto = null;    // identificador del elemento en edición
let videos = [];
let modelos = [];
let fotos = [];

const sucio = () => datos && JSON.stringify(datos) !== original;

function marcarCambios() {
  const hay = sucio();
  $('#barra-guardar').hidden = !hay;
  $('#btn-guardar').disabled = !hay;
}

/* ── Utilidades ──────────────────────────────────────────────── */
const esc = (t) => String(t ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function identificador(texto) {
  return String(texto).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'sin-titulo';
}

function idUnico(base, usados) {
  let id = base, n = 2;
  while (usados.includes(id)) id = base + '-' + n++;
  return id;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const mesActual = () => new Date().toISOString().slice(0, 7);

const fechaLarga = (iso) => {
  const [a, m, d] = String(iso).split('-');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return Number(d) + ' de ' + (meses[Number(m) - 1] || m) + ' de ' + a;
};

const tamano = (bytes) => bytes > 1048576
  ? (bytes / 1048576).toFixed(1) + ' MB'
  : Math.round(bytes / 1024) + ' KB';

const inicialesDe = (nombre) => {
  const partes = String(nombre || '?').trim().split(/\s+/);
  return ((partes[0] || '')[0] || '?').toUpperCase() + (partes.length > 1 ? ((partes[1] || '')[0] || '').toUpperCase() : '');
};
const tonoDe = (clave) => { let h = 0; for (const c of String(clave || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = (p) =>
  '<span class="avatar" style="--h:' + tonoDe(p.correo || p.nombre) + '">' +
    (p.foto ? '<img src="/' + esc(p.foto) + '" alt="">' : esc(inicialesDe(p.nombre))) + '</span>';

const modPorId = (id) => datos.modulos.find((m) => m.id === id);
const leccionConVideo = (lec) => Boolean(lec.video && String(lec.video.url || '').trim());
const moduloConVideo = (mod) => Boolean(mod.video && String(mod.video.url || '').trim());

/* Dónde se usa cada vídeo (presentación de módulo o lección). */
function usoDeVideos() {
  const uso = new Map();
  const anotar = (ruta, modulo, leccion) => {
    if (!uso.has(ruta)) uso.set(ruta, []);
    uso.get(ruta).push({ modulo, leccion });
  };
  datos.modulos.forEach((mod) => {
    if (moduloConVideo(mod)) anotar(mod.video.url.trim(), mod, null);
    mod.lecciones.forEach((lec) => {
      if (leccionConVideo(lec)) anotar(lec.video.url.trim(), mod, lec);
      const bloques = String(lec.md || '').match(/^[ \t]*:::video\s*\n([^\n]+)/gm) || [];
      bloques.forEach((b) => anotar(b.split('\n')[1].trim(), mod, lec));
    });
  });
  return uso;
}

/* ── Avisos y diálogos ───────────────────────────────────────── */
let tempAviso = null;
function avisar(mensaje, tipo = '') {
  const el = $('#aviso');
  el.innerHTML = ico(tipo === 'error' ? 'alerta' : tipo === 'ok' ? 'tickCirculo' : 'info');
  el.appendChild(document.createTextNode(mensaje));
  el.className = 'aviso' + (tipo ? ' aviso--' + tipo : '');
  el.hidden = false;
  el.classList.remove('aviso--visible');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('aviso--visible')));
  clearTimeout(tempAviso);
  tempAviso = setTimeout(() => {
    el.classList.remove('aviso--visible');
    setTimeout(() => { el.hidden = true; }, 280);
  }, tipo === 'error' ? 6000 : 2800);
}

/* Diálogo genérico. Con "campos" se convierte en un formulario y
   devuelve un objeto con los valores; sin campos, true/false. */
function dialogo(titulo, cuerpoHtml, campos, textoBoton) {
  return new Promise((resolver) => {
    const dlg = $('#dialogo');
    const form = $('#dialogo-form');
    $('#dialogo-tit').textContent = titulo;
    $('#dialogo-cuerpo').innerHTML = (cuerpoHtml || '') + (campos || []).map((c) => {
      const id = 'dlg-' + c.nombre;
      let control;
      if (c.tipo === 'select') {
        control = '<select id="' + id + '" name="' + esc(c.nombre) + '">' +
          c.opciones.map(([v, t]) => '<option value="' + esc(v) + '"' + (String(v) === String(c.valor ?? '') ? ' selected' : '') + '>' + esc(t) + '</option>').join('') +
          '</select>';
      } else if (c.tipo === 'textarea') {
        control = '<textarea id="' + id + '" name="' + esc(c.nombre) + '" rows="3" style="font-family:inherit;min-height:80px">' + esc(c.valor || '') + '</textarea>';
      } else {
        control = '<input id="' + id + '" name="' + esc(c.nombre) + '" type="' + (c.tipo || 'text') + '" value="' + esc(c.valor ?? '') + '"' +
          (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : '') + (c.requerido ? ' required' : '') +
          (c.min !== undefined ? ' min="' + c.min + '"' : '') + (c.max !== undefined ? ' max="' + c.max + '"' : '') + '>';
      }
      return '<label class="campo" for="' + id + '"><span>' + esc(c.etiqueta) + (c.requerido ? '' : ' <small>(opcional)</small>') + '</span>' +
        control + (c.ayuda ? '<small>' + esc(c.ayuda) + '</small>' : '') + '</label>';
    }).join('');
    $('#dialogo-si').textContent = textoBoton || (campos ? 'Guardar' : 'Confirmar');
    $('#dialogo-si').className = 'btn ' + (textoBoton === 'Borrar' ? 'btn--peligro' : 'btn--primario');

    const cerrar = (valor) => {
      dlg.close();
      form.removeEventListener('submit', aceptar);
      $('#dialogo-no').removeEventListener('click', rechazar);
      dlg.removeEventListener('cancel', rechazar);
      resolver(valor);
    };
    const aceptar = (ev) => {
      ev.preventDefault();
      if (!campos) { cerrar(true); return; }
      const salida = {};
      campos.forEach((c) => { salida[c.nombre] = form.elements[c.nombre].value.trim(); });
      cerrar(salida);
    };
    const rechazar = (ev) => { if (ev) ev.preventDefault(); cerrar(campos ? null : false); };
    form.addEventListener('submit', aceptar);
    $('#dialogo-no').addEventListener('click', rechazar);
    dlg.addEventListener('cancel', rechazar);
    dlg.showModal();
    const primero = form.querySelector('input, select, textarea');
    if (primero) primero.focus();
  });
}
const confirmar = (titulo, texto, boton = 'Confirmar') => dialogo(titulo, '<p>' + esc(texto) + '</p>', null, boton);
const formulario = (titulo, campos, boton, intro) => dialogo(titulo, intro ? '<p>' + esc(intro) + '</p>' : '', campos, boton);

/* ── Carga y guardado ────────────────────────────────────────── */
async function cargar() {
  const respuesta = await fetch('/api/estado');
  const cuerpo = await respuesta.json();
  videos = cuerpo.videos || [];
  modelos = cuerpo.modelos || [];
  fotos = cuerpo.fotos || [];
  datos = {
    version: cuerpo.version,
    grupos: cuerpo.grupos,
    modulos: cuerpo.modulos,
    novedades: cuerpo.novedades,
    equipo: cuerpo.equipo || { empleadosDelMes: [], tablon: [], ranking: { actualizado: '', personas: [] } },
    objetivos: cuerpo.objetivos && cuerpo.objetivos.plantillas ? cuerpo.objetivos : { plantillas: {}, personas: [], meses: {} },
    personas: cuerpo.personas || []
  };
  original = JSON.stringify(datos);

  const git = cuerpo.git || {};
  $('#estado-git').textContent = git.disponible
    ? 'rama ' + git.rama + (git.pendientes ? ' · ' + git.pendientes + ' archivo(s) sin confirmar' : '')
    : '';
  marcarCambios();
  pintar();
}

async function guardar() {
  const boton = $('#btn-guardar');
  boton.disabled = true;
  boton.querySelector('span').textContent = 'Guardando…';
  try {
    const r = await fetch('/api/guardar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const res = await r.json();
    if (!res.ok) { pintar(res.fallos || ['No se ha podido guardar.']); return; }
    await cargar();
    avisar('Guardado. Los cambios ya se ven en el portal.', 'ok');
  } catch (e) {
    avisar('Error de conexión con el panel: ' + e.message, 'error');
  } finally {
    boton.querySelector('span').textContent = 'Guardar cambios';
    marcarCambios();
  }
}

/* ── Pintado ─────────────────────────────────────────────────── */
function pintar(errores) {
  const lienzo = $('#lienzo');
  const aviso = errores && errores.length
    ? '<div class="errores"><strong>No se ha podido guardar. Revisa esto:</strong><ul>' +
      errores.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>'
    : '';

  const vistas = {
    inicio: vistaInicio,
    modulos: vistaModulos,
    videos: vistaVideos,
    grupos: vistaGrupos,
    personas: vistaPersonas,
    equipo: vistaEquipoPanel,
    objetivos: vistaObjetivosPanel,
    novedades: vistaNovedades,
    modelos: vistaModelosPanel,
    ayuda: vistaAyuda
  };
  lienzo.innerHTML = aviso + (vistas[vista] || vistaInicio)();
  lienzo.classList.remove('lienzo--entra');
  void lienzo.offsetWidth;
  lienzo.classList.add('lienzo--entra');
  $$('.pestana').forEach((p) => p.classList.toggle('pestana--activa', p.dataset.vista === vista));
  refrescarVistasPrevias();
  window.scrollTo({ top: 0 });
}

function refrescarVistasPrevias() {
  $$('[data-vista-previa]').forEach((caja) => {
    const area = $('#' + caja.dataset.vistaPrevia);
    if (area) caja.innerHTML = render(area.value);
  });
}

function irA(nuevaVista, nuevoAbierto = null) {
  vista = nuevaVista;
  abierto = nuevoAbierto;
  pintar();
}

/* ── Vista: inicio ───────────────────────────────────────────── */
function vistaInicio() {
  const lecciones = datos.modulos.flatMap((m) => m.lecciones);
  const conVideo = lecciones.filter(leccionConVideo).length;
  const pctVideo = lecciones.length ? Math.round((conVideo / lecciones.length) * 100) : 0;
  const pendientes = lecciones.reduce((n, l) => n + ((l.md || '').match(/\[!PENDIENTE\]/g) || []).length, 0);
  const activas = datos.personas.filter((p) => p.activo !== false);
  const admins = activas.filter((p) => p.rol === 'administracion');
  const sinFoto = activas.filter((p) => !p.foto).length;
  const uso = usoDeVideos();
  const videosSinUsar = videos.filter((v) => !uso.has(v.ruta)).length;

  const tareas = [];
  const modsSinVideo = datos.modulos.filter((m) => !moduloConVideo(m)).length;
  if (modsSinVideo) {
    tareas.push({ txt: modsSinVideo + (modsSinVideo === 1 ? ' módulo sin vídeo de presentación' : ' módulos sin vídeo de presentación'), sub: 'Un vídeo corto de quien lleva el módulo contando qué se va a aprender. Se pone en «Datos del módulo».', vista: 'modulos' });
  }
  if (lecciones.length - conVideo > 0) {
    tareas.push({ txt: (lecciones.length - conVideo) + ' lecciones todavía sin vídeo', sub: 'Abre un módulo y ponle vídeo a cada lección desde «Vídeo de la lección».', vista: 'modulos' });
  }
  if (pendientes) tareas.push({ txt: pendientes + ' bloques marcados como pendientes', sub: 'Datos reales del despacho que faltan en los textos (aparecen con el marco punteado).', vista: 'modulos' });
  const ob = datos.objetivos || {};
  if ((ob.personas || []).length) {
    const d = new Date();
    const mesAnterior = d.getMonth() === 0 ? (d.getFullYear() - 1) + '-12' : d.getFullYear() + '-' + String(d.getMonth()).padStart(2, '0');
    const con = Object.keys((ob.meses || {})[mesAnterior] || {}).length;
    if (con < ob.personas.length) {
      tareas.push({ txt: 'Resultados de objetivos de ' + nombreMes(mesAnterior, false) + (con ? ' a medias (' + con + ' de ' + ob.personas.length + ' personas)' : ' sin introducir'), sub: 'Al introducirlos, la puntuación y el ranking se publican solos en el portal.', vista: 'objetivos' });
    }
  }
  const modsSinExamen = datos.modulos.filter((m) => !moduloConExamen(m)).length;
  if (modsSinExamen) {
    tareas.push({ txt: modsSinExamen + (modsSinExamen === 1 ? ' módulo sin examen' : ' módulos sin examen'), sub: 'Unas preguntas tipo test al final de cada módulo. Se crean en el editor del módulo, debajo del vídeo de presentación.', vista: 'modulos' });
  }
  if (!datos.personas.length) tareas.push({ txt: 'Todavía no hay personas dadas de alta', sub: 'Mientras la lista esté vacía, cualquier cuenta de Google podrá entrar.', vista: 'personas' });
  if (sinFoto) tareas.push({ txt: sinFoto + (sinFoto === 1 ? ' persona sin foto' : ' personas sin foto'), sub: 'Con foto, el ranking, Conecta y el directorio quedan mucho mejor.', vista: 'personas' });
  if (videosSinUsar) tareas.push({ txt: videosSinUsar + (videosSinUsar === 1 ? ' vídeo subido sin usar' : ' vídeos subidos sin usar'), sub: 'Asígnalos a una lección desde la biblioteca.', vista: 'videos' });
  const tareasHtml = tareas.length
    ? tareas.map((t) => '<li class="tarea"><span class="tarea__ico">' + ico('alerta') + '</span><span class="tarea__txt">' + esc(t.txt) + '<small>' + esc(t.sub) + '</small></span>' +
        '<button class="btn btn--secundario btn--pequeno" data-ir="' + t.vista + '">Ir</button></li>').join('')
    : '<li class="tarea tarea--ok"><span class="tarea__ico">' + ico('tickCirculo') + '</span><span class="tarea__txt">Todo al día<small>No hay nada pendiente de tu parte.</small></span></li>';

  const cifra = (clase, icono, n, t, barra) =>
    '<div class="cifra ' + clase + '"><span class="cifra__ico">' + ico(icono) + '</span><span class="cifra__n">' + n + '</span><span class="cifra__t">' + t + '</span>' +
    (barra !== undefined ? '<span class="cifra__barra"><span style="width:' + barra + '%"></span></span>' : '') + '</div>';

  return `
    <div class="cab">
      <div><h1>Buenos días. Esto es lo que hay.</h1>
        <p>Un vistazo a la formación, el equipo y lo que conviene hacer ahora. Todo lo que cambies aquí se publica en el portal al guardar.</p></div>
      <div class="cab__acciones">
        <button class="btn btn--primario" data-ir="modulos" data-accion-rapida="nuevo-modulo">${ico('mas')}<span>Nuevo módulo</span></button>
      </div>
    </div>

    <div class="resumen">
      ${cifra('cifra--info', 'formacion', datos.modulos.length, 'módulos · ' + lecciones.length + ' lecciones')}
      ${cifra('cifra--ok', 'video', pctVideo + '%', conVideo + ' de ' + lecciones.length + ' lecciones con vídeo', pctVideo)}
      ${cifra('cifra--oro', 'usuarios', activas.length, 'personas con acceso · ' + admins.length + ' administran')}
      ${cifra('', 'novedades', datos.novedades.length, 'novedades publicadas')}
      ${cifra('', 'modelos', modelos.length, 'modelos de documentos')}
      ${cifra('', 'capas', videos.length, 'vídeos en la biblioteca')}
    </div>

    <div class="columnas">
      <div class="tarjeta">
        <h2>${ico('diana')}Qué hacer ahora</h2>
        <ul class="tareas">${tareasHtml}</ul>
      </div>
      <div>
        <div class="tarjeta">
          <h2>${ico('chispa')}Accesos rápidos</h2>
          <div class="accesos">
            <button class="acceso" data-ir="modulos" data-accion-rapida="nuevo-modulo"><span class="acceso__ico">${ico('formacion')}</span><span><strong>Nuevo módulo</strong><small>Crea un bloque de formación</small></span></button>
            <button class="acceso" data-ir="videos"><span class="acceso__ico">${ico('video')}</span><span><strong>Subir un vídeo</strong><small>A la biblioteca, listo para usar</small></span></button>
            <button class="acceso" data-ir="personas" data-accion-rapida="nueva-persona"><span class="acceso__ico">${ico('usuarios')}</span><span><strong>Dar de alta a alguien</strong><small>Nombre, correo y rol</small></span></button>
            <button class="acceso" data-ir="novedades" data-accion-rapida="nueva-novedad"><span class="acceso__ico">${ico('novedades')}</span><span><strong>Publicar una novedad</strong><small>Avisa a todo el equipo</small></span></button>
          </div>
        </div>
        <div class="tarjeta tarjeta--suave">
          <h2>${ico('info')}Cómo funciona</h2>
          <div class="pasos" style="grid-template-columns:1fr">
            <div class="paso"><b><i>1</i>Edita</b>Cambia lo que quieras en cualquier pantalla. Verás una barra abajo con los cambios sin guardar.</div>
            <div class="paso"><b><i>2</i>Guarda</b>Pulsa «Guardar cambios». El panel escribe los archivos del proyecto y hace copia de seguridad.</div>
            <div class="paso"><b><i>3</i>Comprueba</b>Abre el portal con «Ver el portal»: los cambios ya están ahí. Para publicarlos fuera se hace un commit.</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Vista: módulos ──────────────────────────────────────────── */
function vistaModulos() {
  if (abierto && abierto.tipo === 'modulo') return editorModulo();

  const bloques = datos.grupos.map((g) => {
    const mods = datos.modulos.filter((m) => m.grupo === g.id);
    const filas = mods.length ? mods.map((mod) => {
      const i = datos.modulos.indexOf(mod);
      const primero = mods[0] === mod;
      const ultimo = mods[mods.length - 1] === mod;
      const conVideo = mod.lecciones.filter(leccionConVideo).length;
      const pct = mod.lecciones.length ? Math.round((conVideo / mod.lecciones.length) * 100) : 0;
      return `
        <div class="fila">
          <span class="fila__n">${mod.num}</span>
          <div class="fila__txt">
            <div class="fila__tit">${esc(mod.titulo)}${(mod.etiquetas || []).includes('obligatorio') ? '<span class="pastilla pastilla--oro">Obligatorio</span>' : ''}${moduloConVideo(mod) ? '<span class="marca-video marca-video--si">' + ico('play') + 'presentación</span>' : ''}${moduloConExamen(mod) ? '<span class="marca-video marca-video--si">' + ico('escudo') + 'examen</span>' : ''}</div>
            <div class="fila__sub">${mod.lecciones.length} ${mod.lecciones.length === 1 ? 'lección' : 'lecciones'} · ${mod.duracion} min · ${esc(mod.resumen)}</div>
          </div>
          <div class="fila__video" title="${conVideo} de ${mod.lecciones.length} lecciones con vídeo">${ico('video')}<i style="--p:${pct}%"></i>${conVideo}/${mod.lecciones.length}</div>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--icono" data-mover="${i}" data-paso="-1" ${primero ? 'disabled' : ''} title="Subir">&uarr;</button>
            <button class="btn btn--sutil btn--icono" data-mover="${i}" data-paso="1" ${ultimo ? 'disabled' : ''} title="Bajar">&darr;</button>
            <button class="btn btn--secundario btn--pequeno" data-editar-modulo="${esc(mod.id)}">${ico('lapiz')}<span>Editar</span></button>
            <button class="btn btn--sutil btn--icono" data-borrar-modulo="${esc(mod.id)}" title="Borrar">${ico('papelera')}</button>
          </div>
        </div>`;
    }).join('') : '<div class="vacio">Este bloque todavía no tiene módulos.</div>';

    return `<section class="grupo-bloque">
        <h2 class="grupo-bloque__tit"><i></i>${esc(g.titulo)}</h2>
        ${filas}
      </section>`;
  }).join('');

  const lecciones = datos.modulos.flatMap((m) => m.lecciones);
  const conVideo = lecciones.filter(leccionConVideo).length;

  return `
    <div class="cab">
      <div>
        <h1>Módulos y lecciones</h1>
        <p>${datos.modulos.length} módulos, ${lecciones.length} lecciones, ${conVideo} con vídeo. Cada lección empieza por su vídeo; los apuntes van debajo. El orden dentro de cada bloque define el itinerario.</p>
      </div>
      <div class="cab__acciones">
        <button class="btn btn--primario" data-nuevo-modulo>${ico('mas')}<span>Nuevo módulo</span></button>
      </div>
    </div>
    ${bloques}`;
}

function opcionesVideoBiblioteca(seleccionada) {
  return '<option value="">— Elegir de la biblioteca —</option>' +
    videos.map((v) => '<option value="' + esc(v.ruta) + '"' + (v.ruta === seleccionada ? ' selected' : '') + '>' + esc(v.nombre) + ' (' + tamano(v.bytes) + ')</option>').join('');
}

function bloqueVideoLeccion(lec) {
  const con = leccionConVideo(lec);
  const v = lec.video || { url: '', titulo: '', minutos: 0 };
  const esLocal = videos.some((x) => x.ruta === v.url);
  const info = con ? interpretarVideo(v.url) : null;
  return `
    <section class="bloque-video ${con ? '' : 'bloque-video--vacio'}">
      <div class="bloque-video__cab">
        <h3>${ico('video')}Vídeo de la lección</h3>
        <span class="marca-video ${con ? 'marca-video--si' : 'marca-video--no'}">${ico(con ? 'tick' : 'alerta')}${con ? 'Con vídeo' + (info ? ' · ' + esc(info.proveedor) : '') : 'Sin vídeo todavía'}</span>
      </div>
      <p class="ayuda-campo">Es lo primero que verá la persona al abrir la lección. Elige un vídeo de la biblioteca, pega un enlace de YouTube, Vimeo o Loom, o sube uno nuevo.</p>
      <div class="rejilla rejilla--3">
        <label class="campo"><span>De la biblioteca</span>
          <select data-leccion-video="biblioteca" data-leccion-id="${esc(lec.id)}">${opcionesVideoBiblioteca(esLocal ? v.url : '')}</select></label>
        <label class="campo"><span>O un enlace externo</span>
          <input type="url" data-leccion-video="url" data-leccion-id="${esc(lec.id)}" value="${esc(esLocal ? '' : v.url)}" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label class="campo"><span>Duración (minutos)</span>
          <input type="number" min="0" max="600" data-leccion-video="minutos" data-leccion-id="${esc(lec.id)}" value="${Number(v.minutos) || ''}" placeholder="p. ej. 6"></label>
      </div>
      <label class="campo"><span>Título del vídeo <small>(opcional; si no, se usa el de la lección)</small></span>
        <input type="text" data-leccion-video="titulo" data-leccion-id="${esc(lec.id)}" value="${esc(v.titulo || '')}"></label>
      <div class="bloque-video__acciones">
        <label class="btn btn--secundario btn--pequeno">${ico('subir')}<span>Subir un vídeo nuevo</span>
          <input type="file" class="subida-video-leccion" data-leccion-id="${esc(lec.id)}" accept="video/mp4,video/webm,video/ogg" hidden></label>
        ${con ? '<button class="btn btn--sutil btn--pequeno" data-quitar-video="' + esc(lec.id) + '">Quitar el vídeo</button>' : ''}
        <span class="progreso" id="progreso-video-${esc(lec.id)}"></span>
      </div>
      <div class="bloque-video__previa prosa" id="previa-video-${esc(lec.id)}">${con ? videoHtml(v.url, v.titulo || lec.titulo) : ''}</div>
    </section>`;
}

function bloqueVideoModulo(mod) {
  const con = moduloConVideo(mod);
  const v = mod.video || { url: '', titulo: '', minutos: 0 };
  const esLocal = videos.some((x) => x.ruta === v.url);
  const info = con ? interpretarVideo(v.url) : null;
  return `
    <section class="bloque-video ${con ? '' : 'bloque-video--vacio'}" id="bloque-video-modulo">
      <div class="bloque-video__cab">
        <h3>${ico('video')}Vídeo de presentación del módulo</h3>
        <span class="marca-video ${con ? 'marca-video--si' : 'marca-video--no'}">${ico(con ? 'tick' : 'alerta')}${con ? 'Con vídeo' + (info ? ' · ' + esc(info.proveedor) : '') : 'Sin vídeo todavía'}</span>
      </div>
      <p class="ayuda-campo">Un vídeo corto de quien lleva el módulo contando qué se va a aprender. Se ve grande en la cabecera del módulo, antes de las lecciones.</p>
      <div class="rejilla rejilla--3">
        <label class="campo"><span>De la biblioteca</span>
          <select data-modulo-video="biblioteca">${opcionesVideoBiblioteca(esLocal ? v.url : '')}</select></label>
        <label class="campo"><span>O un enlace externo</span>
          <input type="url" data-modulo-video="url" value="${esc(esLocal ? '' : v.url)}" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label class="campo"><span>Duración (minutos)</span>
          <input type="number" min="0" max="600" data-modulo-video="minutos" value="${Number(v.minutos) || ''}" placeholder="p. ej. 2"></label>
      </div>
      <label class="campo"><span>Título del vídeo <small>(opcional; si no, se usa el del módulo)</small></span>
        <input type="text" data-modulo-video="titulo" value="${esc(v.titulo || '')}"></label>
      <div class="bloque-video__acciones">
        <label class="btn btn--secundario btn--pequeno">${ico('subir')}<span>Subir un vídeo nuevo</span>
          <input type="file" class="subida-video-modulo" accept="video/mp4,video/webm,video/ogg" hidden></label>
        ${con ? '<button class="btn btn--sutil btn--pequeno" data-quitar-video-modulo>Quitar el vídeo</button>' : ''}
        <span class="progreso" id="progreso-video-modulo"></span>
      </div>
      <div class="bloque-video__previa prosa" id="previa-video-modulo">${con ? videoHtml(v.url, v.titulo || mod.titulo) : ''}</div>
    </section>`;
}

/* ── Examen del módulo: preguntas tipo test ──────────────────── */
const examenDe = (mod) => (mod && mod.examen && Array.isArray(mod.examen.preguntas)) ? mod.examen : null;
const moduloConExamen = (mod) => Boolean(examenDe(mod) && examenDe(mod).preguntas.length);

function preguntaNueva(ex) {
  const usados = (ex.preguntas || []).map((p) => p.id);
  return { id: idUnico('p' + (usados.length + 1), usados), texto: '', opciones: ['', ''], correcta: 0, explicacion: '' };
}

function bloqueExamen(mod) {
  const ex = examenDe(mod);
  const n = ex ? ex.preguntas.length : 0;
  const preguntas = ex ? ex.preguntas.map((p, i) => `
    <div class="pregunta-caja" id="pregunta-${i}">
      <div class="pregunta-caja__cab">
        <span class="fila__n">${i + 1}</span>
        <input type="text" class="pregunta-caja__texto" data-pregunta-campo="texto" data-pregunta="${i}" value="${esc(p.texto)}" placeholder="Escribe la pregunta">
        <div class="fila__acc">
          <button class="btn btn--sutil btn--icono" data-mover-pregunta="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
          <button class="btn btn--sutil btn--icono" data-mover-pregunta="${i}" data-paso="1" ${i === n - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
          <button class="btn btn--sutil btn--icono" data-borrar-pregunta="${i}" title="Borrar la pregunta">${ico('papelera')}</button>
        </div>
      </div>
      <div class="pregunta-caja__opciones">
        ${(p.opciones || []).map((o, j) => `
          <div class="opcion-fila ${j === Number(p.correcta) ? 'opcion-fila--correcta' : ''}">
            <input type="radio" name="correcta-${i}" data-correcta="${i}" value="${j}" ${j === Number(p.correcta) ? 'checked' : ''} title="Marcar como la respuesta correcta" aria-label="Opción ${j + 1} es la correcta">
            <input type="text" data-opcion-texto="${i}" data-opcion="${j}" value="${esc(o)}" placeholder="Opción ${j + 1}">
            <button class="btn btn--sutil btn--icono" data-borrar-opcion="${i}" data-opcion="${j}" title="Quitar la opción" ${(p.opciones || []).length <= 2 ? 'disabled' : ''}>&times;</button>
          </div>`).join('')}
        <button class="btn btn--sutil btn--pequeno" data-nueva-opcion="${i}" ${(p.opciones || []).length >= 6 ? 'disabled' : ''}>+ Otra opción</button>
      </div>
      <p class="ayuda-examen">El círculo marca la respuesta correcta.</p>
      <label class="campo campo--compacto"><span>Explicación <small>(se enseña al corregir; opcional)</small></span>
        <input type="text" data-pregunta-campo="explicacion" data-pregunta="${i}" value="${esc(p.explicacion || '')}" placeholder="Por qué esa es la respuesta correcta"></label>
    </div>`).join('') : '';

  return `
    <section class="bloque-video bloque-examen ${ex ? '' : 'bloque-video--vacio'}" id="bloque-examen">
      <div class="bloque-video__cab">
        <h3>${ico('escudo')}Examen del módulo</h3>
        <span class="marca-video ${n ? 'marca-video--si' : 'marca-video--no'}">${ico(n ? 'tick' : 'alerta')}${n ? n + (n === 1 ? ' pregunta' : ' preguntas') : 'Sin examen'}</span>
      </div>
      <p class="ayuda-campo">Preguntas tipo test al final del módulo. Cada persona puede repetirlo y su resultado queda en «Seguimiento» del portal, que solo ve dirección.</p>
      ${ex ? `
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Nota para aprobar (%)</span>
          <input type="number" min="1" max="100" data-examen-campo="aprobado" value="${Number(ex.aprobado) || 70}"></label>
      </div>
      ${preguntas || '<div class="vacio">Todavía no hay preguntas. Añade la primera.</div>'}
      <div class="bloque-video__acciones">
        <button class="btn btn--secundario btn--pequeno" data-nueva-pregunta>${ico('mas')}<span>Añadir pregunta</span></button>
        <button class="btn btn--sutil btn--pequeno" data-quitar-examen>Quitar el examen</button>
      </div>` : `
      <div class="bloque-video__acciones">
        <button class="btn btn--secundario btn--pequeno" data-crear-examen>${ico('mas')}<span>Crear el examen</span></button>
      </div>`}
    </section>`;
}

function editorModulo() {
  const mod = modPorId(abierto.id);
  if (!mod) { abierto = null; return vistaModulos(); }

  const opciones = datos.grupos.map((g) =>
    `<option value="${esc(g.id)}" ${g.id === mod.grupo ? 'selected' : ''}>${esc(g.titulo)}</option>`).join('');

  const etiquetas = (mod.etiquetas || []).map((e, i) =>
    `<span class="pastilla${e === 'obligatorio' ? ' pastilla--oro' : ''}">${esc(e)}<button data-quitar-etiqueta="${i}" title="Quitar">&times;</button></span>`).join('');

  const lecciones = mod.lecciones.map((lec, i) => {
    const abiertaAhora = abierto.leccion === lec.id;
    const con = leccionConVideo(lec);
    return `
      <div class="leccion-caja ${abiertaAhora ? 'leccion-caja--abierta' : ''}" id="leccion-${esc(lec.id)}">
        <div class="leccion-caja__cab">
          <span class="fila__n">${i + 1}</span>
          <span class="fila__tit">${esc(lec.titulo)}
            <span class="marca-video ${con ? 'marca-video--si' : 'marca-video--no'}">${ico(con ? 'play' : 'alerta')}${con ? (lec.video.minutos ? lec.video.minutos + ' min' : 'vídeo') : 'sin vídeo'}</span>
          </span>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--icono" data-mover-leccion="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
            <button class="btn btn--sutil btn--icono" data-mover-leccion="${i}" data-paso="1" ${i === mod.lecciones.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
            <button class="btn ${abiertaAhora ? 'btn--sutil' : 'btn--secundario'} btn--pequeno" data-abrir-leccion="${esc(lec.id)}">${abiertaAhora ? 'Cerrar' : 'Editar'}</button>
            <button class="btn btn--sutil btn--icono" data-borrar-leccion="${esc(lec.id)}" title="Borrar">${ico('papelera')}</button>
          </div>
        </div>
        ${abiertaAhora ? `
        <div class="leccion-caja__cuerpo">
          <div class="rejilla rejilla--2">
            <label class="campo"><span>Título de la lección</span>
              <input type="text" data-leccion-campo="titulo" data-leccion-id="${esc(lec.id)}" value="${esc(lec.titulo)}"></label>
            <label class="campo"><span>Identificador <small>(se usa en el enlace)</small></span>
              <input type="text" value="${esc(lec.id)}" readonly></label>
          </div>
          ${bloqueVideoLeccion(lec)}
          <div class="editor">
            <div>
              <div class="editor__rotulo"><span>Apuntes ${con ? '<small>· opcionales con vídeo: un resumen, los pasos clave, enlaces</small>' : '<small>· mientras no haya vídeo, aquí va el contenido</small>'}</span></div>
              <div class="herramientas-md">
                <button class="btn btn--sutil btn--pequeno" data-insertar="## Título" data-destino="md-${esc(lec.id)}">Encabezado</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="- Punto" data-destino="md-${esc(lec.id)}">Lista</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="- [ ] Punto a comprobar" data-destino="md-${esc(lec.id)}">Casilla</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="| Columna | Columna |&#10;|---|---|&#10;| Dato | Dato |" data-destino="md-${esc(lec.id)}">Tabla</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="> [!CLAVE] La idea que hay que retener." data-destino="md-${esc(lec.id)}">Idea clave</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="> [!AVISO] Texto del aviso." data-destino="md-${esc(lec.id)}">Aviso</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar-video="md-${esc(lec.id)}">Vídeo extra</button>
              </div>
              <textarea id="md-${esc(lec.id)}" data-leccion-campo="md" data-leccion-id="${esc(lec.id)}" spellcheck="true" placeholder="Escribe aquí los apuntes…">${esc(lec.md)}</textarea>
            </div>
            <div>
              <div class="editor__rotulo"><span>Así se verá</span></div>
              <div class="editor__vista prosa" data-vista-previa="md-${esc(lec.id)}"></div>
            </div>
          </div>
        </div>` : ''}
      </div>`;
  }).join('');

  const grupo = datos.grupos.find((g) => g.id === mod.grupo) || {};
  const conVideo = mod.lecciones.filter(leccionConVideo).length;

  return `
    <nav class="migas"><button data-cerrar-modulo>Módulos</button><span>/</span><span>${esc(grupo.titulo || '')}</span><span>/</span><span>Módulo ${mod.num}</span></nav>
    <div class="cab">
      <div>
        <h1>${esc(mod.titulo)}</h1>
        <p>${mod.lecciones.length} lecciones · ${conVideo} con vídeo · ${mod.duracion} min${moduloConExamen(mod) ? ' · examen de ' + mod.examen.preguntas.length + ' preguntas' : ' · sin examen'}</p>
      </div>
      <div class="cab__acciones">
        <button class="btn btn--secundario" data-cerrar-modulo>${ico('chevron')}<span>Volver a la lista</span></button>
        <button class="btn btn--primario" data-nueva-leccion>${ico('mas')}<span>Nueva lección</span></button>
      </div>
    </div>

    <div class="tarjeta">
      <h2>${ico('lapiz')}Datos del módulo</h2>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Título</span>
          <input type="text" data-modulo-campo="titulo" value="${esc(mod.titulo)}"></label>
        <label class="campo"><span>Identificador <small>(se usa en el enlace; no se cambia)</small></span>
          <input type="text" value="${esc(mod.id)}" readonly></label>
      </div>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Resumen <small>Una frase; aparece en la portada y en el buscador.</small></span>
          <input type="text" data-modulo-campo="resumen" value="${esc(mod.resumen)}"></label>
        <div class="rejilla rejilla--2">
          <label class="campo"><span>Bloque del itinerario</span>
            <select data-modulo-campo="grupo">${opciones}</select></label>
          <label class="campo"><span>Duración total (min)</span>
            <input type="number" min="1" max="600" data-modulo-campo="duracion" value="${mod.duracion}"></label>
        </div>
      </div>
      <div class="campo">
        <span>Etiquetas <small>«obligatorio» resalta el módulo en la portada.</small></span>
        <div class="pastillas">
          ${etiquetas}
          <button class="btn btn--sutil btn--pequeno" data-anadir-etiqueta>+ Añadir</button>
        </div>
      </div>
    </div>

    ${bloqueVideoModulo(mod)}

    ${bloqueExamen(mod)}

    <div class="seccion">
      <h2>${ico('play')}Lecciones</h2>
      <p>Pulsa «Editar» en una lección para ponerle el vídeo y los apuntes. El orden es el que verá el equipo.</p>
    </div>
    ${lecciones || '<div class="vacio">Este módulo aún no tiene lecciones. Añade la primera.</div>'}`;
}

/* ── Vista: biblioteca de vídeos ─────────────────────────────── */
function vistaVideos() {
  const uso = usoDeVideos();
  const tarjetas = videos.length ? videos.map((v) => {
    const donde = uso.get(v.ruta) || [];
    return `
    <div class="video-tarjeta">
      <div class="video-tarjeta__previa">
        <video src="/${esc(v.ruta)}#t=1" preload="metadata" muted playsinline></video>
        <span class="video-tarjeta__play">${ico('play')}</span>
      </div>
      <div class="video-tarjeta__cuerpo">
        <strong title="${esc(v.nombre)}">${esc(v.nombre)}</strong>
        <small>${tamano(v.bytes)} · ${esc(v.ruta)}</small>
        <div class="video-tarjeta__uso">${donde.length
          ? donde.map((d) => d.leccion
              ? '<button class="pastilla pastilla--ok" data-ir-leccion="' + esc(d.modulo.id) + '|' + esc(d.leccion.id) + '" title="Abrir la lección">' + ico('play') + esc(d.modulo.num + ' · ' + d.leccion.titulo) + '</button>'
              : '<button class="pastilla pastilla--ok" data-ir-leccion="' + esc(d.modulo.id) + '|" title="Abrir el módulo">' + ico('play') + esc(d.modulo.num + ' · presentación del módulo') + '</button>').join('')
          : '<span class="pastilla">Sin usar todavía</span>'}</div>
      </div>
      <div class="video-tarjeta__pie">
        <button class="btn btn--secundario btn--pequeno" data-usar-video="${esc(v.ruta)}">${ico('formacion')}<span>Usar en una lección</span></button>
        <button class="btn btn--sutil btn--icono" data-borrar-video="${esc(v.nombre)}" title="Borrar">${ico('papelera')}</button>
      </div>
    </div>`;
  }).join('') : '<div class="vacio">Todavía no hay vídeos subidos. Arrastra uno a la zona de arriba o pulsa para elegirlo.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Biblioteca de vídeos</h1>
        <p>Los vídeos propios se guardan con el sitio y se asignan a las lecciones desde aquí o desde el editor del módulo. Las sesiones largas conviene alojarlas en YouTube (no listado) o Vimeo (con contraseña) y pegar el enlace en la lección.</p>
      </div>
      <div class="cab__acciones">
        <button class="btn btn--secundario" data-enlazar-video>${ico('externo')}<span>Enlazar vídeo externo</span></button>
      </div>
    </div>

    <label class="zona-subida" id="zona-video">
      ${ico('subir')}
      <strong>Arrastra aquí un vídeo o pulsa para elegirlo</strong>
      <small>MP4, WebM u OGV · máximo 200 MB · ideal para clips de pocos minutos</small>
      <input type="file" id="video-archivo" accept="video/mp4,video/webm,video/ogg">
    </label>
    <div class="progreso" id="video-progreso"></div>

    <div class="seccion"><h2>${ico('video')}Vídeos subidos (${videos.length})</h2></div>
    <div class="videoteca">${tarjetas}</div>

    <div class="llamada llamada--aviso" style="margin-top:1.4rem">
      ${ico('alerta', 'llamada__ico')}
      <div class="llamada__txt"><span class="llamada__tit">Atención</span>
        <p>Sube las grabaciones internas como <strong>no listadas</strong> en YouTube o con contraseña en Vimeo. Nunca públicas: pueden contener referencias a asuntos.</p>
      </div>
    </div>`;
}

/* Diálogo para asignar un vídeo (local o externo) a una lección. */
async function asignarVideoALeccion(urlInicial) {
  const opcionesLeccion = datos.modulos.flatMap((m) => [
    [m.id + '|__modulo', m.num + ' · ' + m.titulo + ' → Presentación del módulo' + (moduloConVideo(m) ? ' (ya tiene vídeo)' : '')],
    ...m.lecciones.map((l) =>
      [m.id + '|' + l.id, m.num + ' · ' + m.titulo + ' → ' + l.titulo + (leccionConVideo(l) ? ' (ya tiene vídeo)' : '')])
  ]);
  const campos = [];
  if (!urlInicial) {
    campos.push({ nombre: 'url', etiqueta: 'Dirección del vídeo', tipo: 'url', requerido: true, placeholder: 'https://www.youtube.com/watch?v=…', ayuda: 'YouTube, Vimeo, Loom o un archivo .mp4' });
  }
  campos.push(
    { nombre: 'leccion', etiqueta: 'Lección', tipo: 'select', opciones: opcionesLeccion, requerido: true },
    { nombre: 'titulo', etiqueta: 'Título del vídeo', tipo: 'text' },
    { nombre: 'minutos', etiqueta: 'Duración (minutos)', tipo: 'number', min: 0, max: 600 }
  );
  const r = await formulario('Usar el vídeo en una lección', campos, 'Asignar');
  if (!r) return;
  const url = urlInicial || r.url;
  const [modId, lecId] = r.leccion.split('|');
  const mod = modPorId(modId);
  if (!mod) return;
  if (lecId === '__modulo') {
    mod.video = { url, titulo: r.titulo || '', minutos: Number(r.minutos) || 0 };
    marcarCambios();
    avisar('Vídeo puesto como presentación de «' + mod.titulo + '». Recuerda guardar.', 'ok');
    irA('modulos', { tipo: 'modulo', id: mod.id, leccion: null });
    return;
  }
  const lec = mod.lecciones.find((l) => l.id === lecId);
  if (!lec) return;
  lec.video = { url, titulo: r.titulo || '', minutos: Number(r.minutos) || 0 };
  marcarCambios();
  avisar('Vídeo asignado a «' + lec.titulo + '». Recuerda guardar.', 'ok');
  irA('modulos', { tipo: 'modulo', id: mod.id, leccion: lec.id });
}

/* ── Vista: bloques del itinerario ───────────────────────────── */
function vistaGrupos() {
  const filas = datos.grupos.map((g, i) => {
    const cuantos = datos.modulos.filter((m) => m.grupo === g.id).length;
    return `
    <div class="tarjeta">
      <div class="cab" style="margin-bottom:.9rem">
        <div><h2>${esc(g.titulo)}</h2>
          <p>${cuantos} ${cuantos === 1 ? 'módulo' : 'módulos'}</p></div>
        <div class="fila__acc">
          <button class="btn btn--sutil btn--icono" data-mover-grupo="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
          <button class="btn btn--sutil btn--icono" data-mover-grupo="${i}" data-paso="1" ${i === datos.grupos.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
        </div>
      </div>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Título</span>
          <input type="text" data-grupo-campo="titulo" data-grupo-indice="${i}" value="${esc(g.titulo)}"></label>
        <label class="campo"><span>Identificador</span>
          <input type="text" value="${esc(g.id)}" readonly></label>
      </div>
      <label class="campo"><span>Descripción <small>Aparece bajo el título del bloque en la portada.</small></span>
        <input type="text" data-grupo-campo="descripcion" data-grupo-indice="${i}" value="${esc(g.descripcion)}"></label>
    </div>`;
  }).join('');

  return `
    <div class="cab">
      <div>
        <h1>Bloques del itinerario</h1>
        <p>Los bloques temáticos en los que se agrupan los módulos. Su orden aquí es el orden del itinerario.</p>
      </div>
      <div class="cab__acciones"><button class="btn btn--primario" data-nuevo-grupo>${ico('mas')}<span>Nuevo bloque</span></button></div>
    </div>
    ${filas}`;
}

/* ── Vista: personas y accesos ───────────────────────────────── */
function opcionesFoto(seleccionada) {
  return '<option value="">Sin foto (iniciales)</option>' +
    fotos.map((f) =>
      `<option value="${esc(f.ruta)}"${f.ruta === seleccionada ? ' selected' : ''}>${esc(f.nombre)}</option>`
    ).join('');
}

function vistaPersonas() {
  const lista = datos.personas;
  const activas = lista.filter((p) => p.activo !== false).length;
  const admins = lista.filter((p) => p.rol === 'administracion' && p.activo !== false).length;

  const filas = lista.length ? lista.map((p, i) => `
    <div class="persona ${p.activo === false ? 'persona--inactiva' : ''}">
      ${avatar(p)}
      <div class="persona__nombre">
        <input type="text" value="${esc(p.nombre)}" placeholder="Nombre y apellidos" data-persona-campo="nombre" data-persona-indice="${i}" aria-label="Nombre">
        <input type="text" value="${esc(p.puesto || '')}" placeholder="Puesto (opcional)" data-persona-campo="puesto" data-persona-indice="${i}" aria-label="Puesto" style="font-size:.8rem">
      </div>
      <div>
        <span class="persona__correo" title="${esc(p.correo)}">${esc(p.correo)}</span>
        <div style="margin-top:.25rem"><span class="etiqueta-rol ${p.rol === 'administracion' ? 'etiqueta-rol--admin' : 'etiqueta-rol--equipo'}">${p.rol === 'administracion' ? ico('escudo') + 'Administra' : 'Equipo'}</span></div>
      </div>
      <label class="campo"><span>Rol</span>
        <select data-persona-campo="rol" data-persona-indice="${i}">
          <option value="equipo"${p.rol !== 'administracion' ? ' selected' : ''}>Equipo</option>
          <option value="administracion"${p.rol === 'administracion' ? ' selected' : ''}>Administración</option>
        </select></label>
      <label class="campo"><span>Foto</span>
        <select data-persona-campo="foto" data-persona-indice="${i}">${opcionesFoto(p.foto)}</select></label>
      <div style="display:flex;flex-direction:column;gap:.5rem;align-items:flex-end">
        <label class="interruptor" title="Con acceso, la persona puede entrar con su cuenta de Google">
          <input type="checkbox" data-persona-activo="${i}" ${p.activo === false ? '' : 'checked'}><i></i><span>${p.activo === false ? 'Sin acceso' : 'Con acceso'}</span>
        </label>
        <button class="btn btn--sutil btn--pequeno" data-borrar-persona="${i}">${ico('papelera')}<span>Quitar</span></button>
      </div>
    </div>`).join('') : '<div class="vacio">Todavía no hay personas. Pulsa «Dar de alta» y añade a cada miembro del equipo con la cuenta de Google con la que entrará.</div>';

  const galeria = fotos.length ? fotos.map((f) => `
    <div class="fila">
      <img src="/${esc(f.ruta)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:50%;flex:none">
      <div class="fila__txt">
        <div class="fila__tit">${esc(f.nombre)}</div>
        <div class="fila__sub">${esc(f.ruta)} · ${tamano(f.bytes)} · usada por ${lista.filter((p) => p.foto === f.ruta).map((p) => p.nombre).join(', ') || 'nadie'}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--icono" data-borrar-foto="${esc(f.nombre)}" title="Borrar">${ico('papelera')}</button>
      </div>
    </div>`).join('') : '<div class="vacio" style="padding:1rem">No hay fotos subidas.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Personas y accesos</h1>
        <p>Quién forma parte del equipo, con qué cuenta entra y qué puede hacer. ${activas} ${activas === 1 ? 'persona' : 'personas'} con acceso, ${admins} con rol de administración.</p>
      </div>
      <div class="cab__acciones"><button class="btn btn--primario" data-nueva-persona>${ico('mas')}<span>Dar de alta</span></button></div>
    </div>

    <div class="llamada llamada--nota">
      ${ico('info', 'llamada__ico')}
      <div class="llamada__txt"><span class="llamada__tit">Cómo funciona el acceso</span>
        <p>Cuando el acceso con Google esté activo (ver README), <strong>solo entran las personas de esta lista con el interruptor «Con acceso»</strong>. Las de rol «Administración» ven además el botón del panel en el portal y pueden moderar Conecta. Si la lista está vacía, entra cualquier cuenta.</p>
      </div>
    </div>

    ${filas}

    <div class="seccion"><h2>${ico('foto')}Fotos del equipo</h2><p>Elige la foto de cada persona en su fila. Pide permiso antes de publicar una foto.</p></div>
    <label class="zona-subida" id="zona-foto">
      ${ico('foto')}
      <strong>Arrastra una foto o pulsa para elegirla</strong>
      <small>JPG, PNG o WebP · máximo 8 MB · mejor cuadrada</small>
      <input type="file" id="foto-archivo" accept="image/jpeg,image/png,image/webp">
    </label>
    <div class="progreso" id="foto-progreso"></div>
    <div style="margin-top:.9rem">${galeria}</div>`;
}

async function nuevaPersona() {
  const r = await formulario('Dar de alta a una persona', [
    { nombre: 'nombre', etiqueta: 'Nombre y apellidos', tipo: 'text', requerido: true },
    { nombre: 'correo', etiqueta: 'Cuenta de Google', tipo: 'email', requerido: true, placeholder: 'nombre@gmail.com', ayuda: 'Con esta cuenta entrará en el portal.' },
    { nombre: 'puesto', etiqueta: 'Puesto', tipo: 'text', placeholder: 'Abogada de extranjería, Recepción…' },
    { nombre: 'rol', etiqueta: 'Rol', tipo: 'select', opciones: [['equipo', 'Equipo · portal completo'], ['administracion', 'Administración · panel y moderación']], valor: 'equipo', requerido: true },
    { nombre: 'foto', etiqueta: 'Foto', tipo: 'select', opciones: [['', 'Sin foto (iniciales)'], ...fotos.map((f) => [f.ruta, f.nombre])], valor: '' }
  ], 'Dar de alta');
  if (!r) return;
  const correo = r.correo.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { avisar('Eso no parece un correo válido.', 'error'); return; }
  if (datos.personas.some((p) => p.correo === correo)) { avisar('Esa cuenta ya está dada de alta.', 'error'); return; }
  datos.personas.push({ correo, nombre: r.nombre, puesto: r.puesto, foto: r.foto, rol: r.rol, activo: true });
  marcarCambios();
  avisar(r.nombre + ' añadido. Recuerda guardar.', 'ok');
  irA('personas');
}

/* ── Vista: reconocimientos, tablón y ranking ────────────────── */
function vistaEquipoPanel() {
  const eq = datos.equipo;

  const edm = eq.empleadosDelMes.map((p, i) => `
    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Mes</span>
          <input type="month" value="${esc(p.mes)}" data-edm-campo="mes" data-edm-indice="${i}"></label>
        <label class="campo"><span>Nombre</span>
          <input type="text" value="${esc(p.nombre)}" data-edm-campo="nombre" data-edm-indice="${i}"></label>
        <label class="campo"><span>Iniciales</span>
          <input type="text" maxlength="3" value="${esc(p.iniciales)}" data-edm-campo="iniciales" data-edm-indice="${i}"></label>
      </div>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Foto</span>
          <select data-edm-campo="foto" data-edm-indice="${i}">${opcionesFoto(p.foto)}</select></label>
        <label class="campo"><span>Motivo del reconocimiento</span>
          <input type="text" value="${esc(p.motivo)}" data-edm-campo="motivo" data-edm-indice="${i}"></label>
      </div>
      <div style="margin-top:.9rem;text-align:right">
        <button class="btn btn--sutil btn--pequeno" data-borrar-edm="${i}">${ico('papelera')}<span>Borrar reconocimiento</span></button>
      </div>
    </div>`).join('');

  const anuncios = eq.tablon.map((an, i) => `
    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Fecha</span>
          <input type="date" value="${esc(an.fecha)}" data-anuncio-campo="fecha" data-anuncio-indice="${i}"></label>
        <label class="campo"><span>Tipo</span>
          <select data-anuncio-campo="tipo" data-anuncio-indice="${i}">
            <option value="evento"${an.tipo === 'evento' ? ' selected' : ''}>Evento</option>
            <option value="aviso"${an.tipo === 'aviso' ? ' selected' : ''}>Aviso</option>
            <option value="celebracion"${an.tipo === 'celebracion' ? ' selected' : ''}>Celebración</option>
          </select></label>
        <label class="campo"><span>Título</span>
          <input type="text" value="${esc(an.titulo)}" data-anuncio-campo="titulo" data-anuncio-indice="${i}"></label>
      </div>
      <label class="campo"><span>Texto <small>(opcional)</small></span>
        <textarea style="min-height:80px;font-family:inherit" data-anuncio-campo="md" data-anuncio-indice="${i}">${esc(an.md)}</textarea></label>
      <div style="margin-top:.9rem;text-align:right">
        <button class="btn btn--sutil btn--pequeno" data-borrar-anuncio="${i}">${ico('papelera')}<span>Borrar anuncio</span></button>
      </div>
    </div>`).join('');

  const personas = eq.ranking.personas.map((p, i) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="rejilla" style="grid-template-columns:2fr 80px 110px 1.5fr;gap:.6rem;align-items:end">
          <label class="campo"><span>Nombre</span>
            <input type="text" value="${esc(p.nombre)}" data-ranking-campo="nombre" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Iniciales</span>
            <input type="text" maxlength="3" value="${esc(p.iniciales)}" data-ranking-campo="iniciales" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Puntuación</span>
            <input type="number" min="0" step="0.01" value="${Number(p.puntos) || 0}" data-ranking-campo="puntos" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Foto</span>
            <select data-ranking-campo="foto" data-ranking-indice="${i}">${opcionesFoto(p.foto)}</select></label>
        </div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--icono" data-borrar-ranking="${i}" title="Quitar">${ico('papelera')}</button>
      </div>
    </div>`).join('');

  return `
    <div class="cab">
      <div>
        <h1>Reconocimientos y tablón</h1>
        <p>Empleado/a del mes, anuncios del despacho y ranking de formación. Se publica en la sección Equipo del portal y en Conecta.</p>
      </div>
    </div>

    <div class="seccion"><h2>${ico('trofeo')}Empleado/a del mes</h2>
      <button class="btn btn--secundario btn--pequeno" data-anadir-edm>${ico('mas')}<span>Añadir reconocimiento</span></button></div>
    ${edm || '<div class="vacio">Sin reconocimientos todavía. El más reciente va primero.</div>'}

    <div class="seccion"><h2>${ico('calendario')}Tablón del despacho</h2>
      <button class="btn btn--secundario btn--pequeno" data-anadir-anuncio>${ico('mas')}<span>Añadir anuncio</span></button></div>
    ${anuncios || '<div class="vacio">Sin anuncios. Eventos, avisos y celebraciones del despacho.</div>'}

    <div class="seccion"><h2>${ico('medalla')}Ranking de formación</h2>
      <button class="btn btn--secundario btn--pequeno" data-anadir-ranking>${ico('mas')}<span>Añadir persona</span></button></div>
    <div class="tarjeta">
      <label class="campo" style="max-width:220px"><span>Fecha de actualización</span>
        <input type="date" value="${esc(eq.ranking.actualizado)}" data-ranking-fecha></label>
      <p class="nota" style="margin-bottom:1rem">Este ranking manual solo se usa mientras no haya resultados de objetivos publicados. En cuanto los haya, el portal calcula el ranking solo a partir de la pestaña «Objetivos».</p>
      ${personas || '<div class="vacio" style="padding:1rem">Sin personas en el ranking.</div>'}
    </div>`;
}

/* ── Vista: objetivos (resultados, personas y metas, plantillas) ── */
let objetivosPestana = 'resultados';
let objetivosMes = '';

function objetivosDatos() {
  if (!datos.objetivos || typeof datos.objetivos !== 'object') datos.objetivos = {};
  const ob = datos.objetivos;
  ob.plantillas = ob.plantillas || {};
  ob.personas = ob.personas || [];
  ob.meses = ob.meses || {};
  return ob;
}

/* Mes que se está editando: el último con resultados, o el actual. */
function mesObjetivosElegido() {
  if (!objetivosMes) {
    const conDatos = mesesConDatos(objetivosDatos());
    objetivosMes = conDatos[conDatos.length - 1] || mesActual();
  }
  return objetivosMes;
}

const avatarObj = (p) => p.foto
  ? '<span class="obj-avatar obj-avatar--foto"><img src="/' + esc(p.foto) + '" alt=""></span>'
  : '<span class="obj-avatar">' + esc(inicialesDe(p.nombre)) + '</span>';
const personasObjOrdenadas = (ob) => [...ob.personas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

function registroObjetivos(personaId, mes, crear) {
  const ob = objetivosDatos();
  if (!ob.meses[mes]) { if (!crear) return null; ob.meses[mes] = {}; }
  if (!ob.meses[mes][personaId]) { if (!crear) return null; ob.meses[mes][personaId] = { resultados: {}, puntos: {} }; }
  const r = ob.meses[mes][personaId];
  r.resultados = r.resultados || {};
  r.puntos = r.puntos || {};
  return r;
}

function limpiarRegistroVacio(personaId, mes) {
  const ob = objetivosDatos();
  const r = ob.meses[mes] && ob.meses[mes][personaId];
  if (!r) return;
  if (!Object.keys(r.resultados || {}).length && !Object.keys(r.puntos || {}).length && !r.nota) {
    delete ob.meses[mes][personaId];
    if (!Object.keys(ob.meses[mes]).length) delete ob.meses[mes];
  }
}

function vistaObjetivosPanel() {
  const ob = objetivosDatos();
  const pestanas = [['resultados', 'Resultados del mes'], ['personas', 'Personas y metas'], ['plantillas', 'Plantillas']]
    .map(([id, t]) => `<button class="pestana-sec ${objetivosPestana === id ? 'pestana-sec--activa' : ''}" data-obj-pestana="${id}">${t}</button>`).join('');
  const accion = objetivosPestana === 'personas'
    ? `<button class="btn btn--primario" data-obj-nueva-persona>${ico('mas')}<span>Nueva persona</span></button>`
    : objetivosPestana === 'plantillas'
      ? `<button class="btn btn--primario" data-obj-nueva-plantilla>${ico('mas')}<span>Nueva plantilla</span></button>`
      : '';
  const cuerpo = objetivosPestana === 'personas' ? objetivosPersonasHtml(ob)
    : objetivosPestana === 'plantillas' ? objetivosPlantillasHtml(ob)
    : objetivosResultadosHtml(ob);
  return `
    <div class="cab">
      <div>
        <h1>Objetivos</h1>
        <p>Dirección introduce los resultados de cada mes; la puntuación y el ranking se calculan solos y cada persona ve lo suyo en «Mis objetivos» del portal.</p>
      </div>
      <div class="cab__acciones">${accion}</div>
    </div>
    <div class="pestanas-sec">${pestanas}</div>
    ${cuerpo}`;
}

/* Pestaña 1: resultados del mes, con cálculo en vivo. */
function objetivosResultadosHtml(ob) {
  const mes = mesObjetivosElegido();
  // Las personas de baja solo salen en los meses en los que tienen datos.
  const personas = personasObjOrdenadas(ob).filter((p) => !p.baja || registroDe(ob, p.id, mes));
  if (!personas.length) {
    return '<div class="vacio">Todavía no hay personas con objetivos. Crea la primera en «Personas y metas» o vuelca los Excel con <code>node herramientas/importar-objetivos.mjs</code>.</div>';
  }
  const pills = mesesConDatos(ob).map((m) =>
    `<button class="pastilla ${m === mes ? 'pastilla--oro' : ''}" data-obj-mes="${esc(m)}">${esc(nombreMes(m, false))} ${m.slice(0, 4)}</button>`).join('');
  return `
    <div class="obj-barra-mes">
      <label class="campo campo--inline"><span>Mes</span><input type="month" value="${esc(mes)}" data-obj-mes-sel></label>
      <div class="obj-barra-mes__pills"><small>Con resultados:</small>${pills || '<small>ninguno todavía</small>'}</div>
    </div>
    <p class="nota" style="margin:0 0 1rem">Escribe lo conseguido en cada objetivo con meta y los puntos de los que valora dirección. Los puntos de los objetivos con meta salen solos (y se pueden fijar a mano si hace falta). Se publica al guardar.</p>
    <div class="obj-rejilla">
      <div class="obj-rejilla__principal">${personas.map((p) => tarjetaResultadosPersona(ob, p, mes)).join('')}</div>
      <aside class="obj-rejilla__lateral"><div class="tarjeta obj-ranking" id="obj-ranking">${rankingPanelHtml(ob, mes)}</div></aside>
    </div>`;
}

function rankingPanelHtml(ob, mes) {
  const ranking = rankingDe(ob, mes);
  return `<h2>${ico('trofeo')}Ranking de ${esc(nombreMes(mes, false))}</h2>` +
    (ranking.length
      ? '<ol class="obj-ranking__lista">' + ranking.map((c) =>
          `<li><span class="obj-ranking__n">${c.puesto}</span><strong>${esc(c.persona.nombre)}</strong><b>${puntuacion(c.total)}</b><small>/ ${puntuacion(c.maximo)}</small></li>`).join('') + '</ol>'
      : '<p class="nota">Se calcula solo en cuanto introduzcas resultados.</p>') +
    '<p class="nota">Al guardar, lo ve todo el equipo en la sección Equipo del portal; cada persona solo ve el detalle de sus objetivos.</p>';
}

function textoPuesto(puesto) {
  return puesto ? puesto.puesto + 'º de ' + puesto.de : 'sin puesto';
}

function tarjetaResultadosPersona(ob, p, mes) {
  const c = calcularMes(ob, p, mes);
  const registro = (ob.meses[mes] || {})[p.id] || { resultados: {}, puntos: {} };
  const plantilla = ob.plantillas[p.plantilla] || { titulo: p.plantilla };
  const filas = c.filas.map((f) => {
    const medible = f.tipo !== 'valoracion';
    const res = (registro.resultados || {})[f.id];
    const pts = (registro.puntos || {})[f.id];
    const fijado = pts !== undefined && pts !== null && pts !== '';
    const marcador = `${esc(p.id)}|${esc(f.id)}`;
    return `
      <tr>
        <td class="obj-td-txt"><strong>${esc(f.texto)}${f.extra ? ' <span class="pastilla pastilla--oro">extra</span>' : ''}</strong>
          <small>${medible ? 'Meta: ' + esc(formatearMeta(f, ob, p)) : 'Valoración de dirección'} · máx. ${puntuacion(f.max)}</small></td>
        <td class="obj-td-res">${medible
          ? `<input type="number" step="any" min="0" value="${res === undefined ? '' : res}" data-obj-res="${marcador}" placeholder="${esc(f.unidad || 'cantidad')}" aria-label="Conseguido en ${esc(f.texto)}">`
          : '<span class="obj-sin">—</span>'}</td>
        <td class="obj-td-pts"><input type="number" step="0.01" min="0" value="${fijado ? pts : ''}" data-obj-pts="${marcador}" class="${fijado && medible ? 'obj-pts--fijado' : ''}"
          placeholder="${medible ? 'auto' : '0 a ' + puntuacion(f.max)}" aria-label="Puntos de ${esc(f.texto)}"></td>
        <td class="obj-td-calc"><span class="obj-calc ${f.origen === 'fijado' && medible ? 'obj-calc--fijado' : ''}" data-obj-calc="${marcador}">${f.puntos === null ? '—' : puntuacion(f.puntos)}</span><span class="obj-calc__max">/ ${puntuacion(f.max)}</span></td>
      </tr>`;
  }).join('');
  return `
    <section class="tarjeta obj-persona" id="obj-persona-${esc(p.id)}">
      <div class="obj-persona__cab">
        ${avatarObj(p)}
        <div class="obj-persona__quien"><strong>${esc(p.nombre)}</strong><small>${esc(plantilla.titulo || p.plantilla)}${p.correo ? ' · ' + esc(p.correo) : ' · por nombre de pila'}</small></div>
        <div class="obj-persona__total"><b data-obj-total="${esc(p.id)}" class="${c.ajustado ? 'obj-total--ajustado' : ''}">${puntuacion(c.total)}</b><small>/ ${puntuacion(c.maximo)}</small>
          <span class="obj-persona__puesto" data-obj-puesto="${esc(p.id)}">${textoPuesto(puestoDe(ob, p.id, mes))}</span></div>
        <button class="btn btn--sutil btn--icono" data-obj-borrar-registro="${esc(p.id)}" title="Vaciar los resultados de este mes" ${c.conDatos ? '' : 'disabled'}>${ico('papelera')}</button>
      </div>
      <table class="obj-tabla">
        <thead><tr><th>Objetivo</th><th>Conseguido</th><th>Puntos a mano</th><th>Puntos</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="obj-total-fijo">
        <label><span>Puntuación final <small>(solo si dirección decide una nota distinta de la suma)</small></span>
          <input type="number" step="0.01" min="0" value="${c.ajustado ? registro.total : ''}" placeholder="suma: ${puntuacion(c.calculado)}" data-obj-total-fijo="${esc(p.id)}"></label>
        <small data-obj-calculado="${esc(p.id)}">${c.ajustado ? 'La suma de los objetivos es ' + puntuacion(c.calculado) + '; en el ranking cuenta ' + puntuacion(c.total) + '.' : 'En el ranking cuenta la suma de los objetivos.'}</small>
      </div>
    </section>`;
}

/* Recalcula una persona y el ranking sin repintar (para no perder el foco). */
function refrescarObjetivos(personaId) {
  const ob = objetivosDatos();
  const mes = mesObjetivosElegido();
  const p = ob.personas.find((x) => x.id === personaId);
  if (!p) return;
  const c = calcularMes(ob, p, mes);
  const sel = (attr, valor) => document.querySelector('[' + attr + '="' + CSS.escape(valor) + '"]');
  c.filas.forEach((f) => {
    const calc = sel('data-obj-calc', p.id + '|' + f.id);
    if (calc) {
      calc.textContent = f.puntos === null ? '—' : puntuacion(f.puntos);
      calc.classList.toggle('obj-calc--fijado', f.origen === 'fijado' && f.tipo !== 'valoracion');
    }
  });
  const total = sel('data-obj-total', p.id);
  if (total) { total.textContent = puntuacion(c.total); total.classList.toggle('obj-total--ajustado', c.ajustado); }
  const fijo = sel('data-obj-total-fijo', p.id);
  if (fijo) fijo.placeholder = 'suma: ' + puntuacion(c.calculado);
  const calculado = sel('data-obj-calculado', p.id);
  if (calculado) calculado.textContent = c.ajustado ? 'La suma de los objetivos es ' + puntuacion(c.calculado) + '; en el ranking cuenta ' + puntuacion(c.total) + '.' : 'En el ranking cuenta la suma de los objetivos.';
  const borrar = sel('data-obj-borrar-registro', p.id);
  if (borrar) borrar.disabled = !c.conDatos;
  const rk = document.getElementById('obj-ranking');
  if (rk) rk.innerHTML = rankingPanelHtml(ob, mes);
  ob.personas.forEach((x) => {
    const el = sel('data-obj-puesto', x.id);
    if (el) el.textContent = textoPuesto(puestoDe(ob, x.id, mes));
  });
}

/* Pestaña 2: personas, cuenta enlazada, plantilla y metas propias. */
function objetivosPersonasHtml(ob) {
  const personas = personasObjOrdenadas(ob);
  if (!personas.length) return '<div class="vacio">Nadie tiene objetivos todavía. Pulsa «Nueva persona».</div>';
  const plantillaOpts = (actual) => Object.entries(ob.plantillas).map(([id, p]) =>
    `<option value="${esc(id)}" ${id === actual ? 'selected' : ''}>${esc(p.titulo || id)}</option>`).join('');
  const cuentaOpts = (actual) => {
    const lista = datos.personas.map((x) => [String(x.correo || '').toLowerCase(), x.nombre + ' · ' + x.correo]);
    if (actual && !lista.some(([c]) => c === actual)) lista.push([actual, actual]);
    return lista.map(([c, t]) => `<option value="${esc(c)}" ${c === actual ? 'selected' : ''}>${esc(t)}</option>`).join('');
  };
  return personas.map((p) => {
    const plantilla = ob.plantillas[p.plantilla];
    const medibles = plantilla ? plantilla.objetivos.filter((o) => o.tipo !== 'valoracion') : [];
    const nMeses = mesesDe(ob, p.id).length;
    const metas = medibles.map((o) => {
      const base = o.tipo === 'relativo' ? (plantilla.objetivos.find((x) => x.id === o.base) || {}).texto : '';
      const valor = p.metas && p.metas[o.id] !== undefined ? p.metas[o.id] : '';
      return `
        <label class="obj-meta-campo">
          <span>${esc(o.texto)}</span>
          <input type="number" step="any" min="0" value="${valor}" placeholder="${o.tipo === 'relativo' ? o.proporcion : o.meta}" data-obj-meta="${esc(p.id)}|${esc(o.id)}">
          <small>${o.tipo === 'relativo' ? 'proporción sobre ' + esc((base || o.base).toLowerCase()) : esc(o.unidad || '')}</small>
        </label>`;
    }).join('');
    return `
      <section class="tarjeta obj-persona">
        <div class="obj-persona__cab">
          ${avatarObj(p)}
          <div class="obj-persona__quien"><strong>${esc(p.nombre)}${p.baja ? ' <span class="pastilla">baja</span>' : ''}</strong><small>${nMeses ? nMeses + (nMeses === 1 ? ' mes puntuado' : ' meses puntuados') : 'sin resultados todavía'}</small></div>
          <button class="btn btn--sutil btn--pequeno" style="margin-left:auto" data-obj-borrar-persona="${esc(p.id)}">Quitar</button>
        </div>
        <div class="rejilla rejilla--3">
          <label class="campo"><span>Nombre</span>
            <input type="text" value="${esc(p.nombre)}" data-obj-persona-campo="${esc(p.id)}|nombre"></label>
          <label class="campo"><span>Cuenta del portal <small>(así ve sus objetivos al entrar)</small></span>
            <select data-obj-persona-campo="${esc(p.id)}|correo"><option value="">Por nombre de pila, sin enlazar</option>${cuentaOpts(p.correo)}</select></label>
          <label class="campo"><span>Plantilla de objetivos</span>
            <select data-obj-persona-campo="${esc(p.id)}|plantilla">${plantillaOpts(p.plantilla)}</select></label>
        </div>
        <label class="obj-baja"><input type="checkbox" ${p.baja ? 'checked' : ''} data-obj-persona-campo="${esc(p.id)}|baja">
          <span>Ya no está en el despacho <small>(se conserva su histórico; no aparece en los meses nuevos)</small></span></label>
        <div class="obj-foto-fila">
          <label class="campo" style="flex:1;margin:0"><span>Foto <small>(ranking, podio y seguimiento)</small></span>
            <select data-obj-persona-campo="${esc(p.id)}|foto">${opcionesFoto(p.foto)}</select></label>
          <label class="btn btn--secundario btn--pequeno">${ico('subir')}<span>Subir una foto</span>
            <input type="file" class="subida-foto-objetivo" data-persona-obj="${esc(p.id)}" accept="image/jpeg,image/png,image/webp" hidden></label>
          <span class="progreso" id="progreso-foto-${esc(p.id)}"></span>
        </div>
        <div class="campo">
          <span>Metas propias <small>En blanco se usa la meta de la plantilla.</small></span>
          <div class="obj-metas-rejilla">${metas || '<small class="nota">Esta plantilla no tiene objetivos con meta.</small>'}</div>
        </div>
      </section>`;
  }).join('');
}

/* Pestaña 3: plantillas. */
function objetivosPlantillasHtml(ob) {
  const entradas = Object.entries(ob.plantillas);
  if (!entradas.length) return '<div class="vacio">No hay plantillas. Pulsa «Nueva plantilla».</div>';
  const tipos = (actual) => Object.entries(TIPOS_OBJETIVO).map(([t, txt]) =>
    `<option value="${t}" ${t === actual ? 'selected' : ''}>${txt}</option>`).join('');
  return entradas.map(([pid, p]) => {
    const usan = ob.personas.filter((x) => x.plantilla === pid).length;
    const total = p.objetivos.reduce((n, o) => n + (Number(o.max) || 0), 0);
    const filas = p.objetivos.map((o, i) => {
      const m = `${esc(pid)}|${i}|`;
      let extra = '';
      if (o.tipo === 'proporcional') {
        extra = `
          <label class="obj-mini-campo"><span>Meta</span><input type="number" step="any" min="0" value="${o.meta}" data-obj-objetivo="${m}meta"></label>
          <label class="obj-mini-campo"><span>Unidad</span><input type="text" value="${esc(o.unidad || '')}" placeholder="clientes, €…" data-obj-objetivo="${m}unidad"></label>`;
      } else if (o.tipo === 'relativo') {
        const bases = p.objetivos.filter((x) => x.id !== o.id && x.tipo === 'proporcional');
        extra = `
          <label class="obj-mini-campo"><span>Sobre</span><select data-obj-objetivo="${m}base">${bases.map((x) =>
            `<option value="${esc(x.id)}" ${x.id === o.base ? 'selected' : ''}>${esc(x.texto)}</option>`).join('') || '<option value="">(sin objetivos con meta)</option>'}</select></label>
          <label class="obj-mini-campo"><span>Proporción</span><input type="number" step="0.05" min="0" max="1" value="${o.proporcion}" data-obj-objetivo="${m}proporcion"></label>
          <label class="obj-mini-campo"><span>Unidad</span><input type="text" value="${esc(o.unidad || '')}" data-obj-objetivo="${m}unidad"></label>`;
      }
      return `
        <div class="obj-plantilla-fila">
          <span class="fila__n">${i + 1}</span>
          <div class="obj-plantilla-fila__campos">
            <input type="text" class="obj-plantilla-fila__texto" value="${esc(o.texto)}" placeholder="Objetivo" data-obj-objetivo="${m}texto">
            <label class="obj-mini-campo"><span>Máximo</span><input type="number" step="0.05" min="0" value="${o.max}" data-obj-objetivo="${m}max"></label>
            <label class="obj-mini-campo obj-mini-campo--ancho"><span>Cómo se puntúa</span><select data-obj-objetivo="${m}tipo">${tipos(o.tipo)}</select></label>
            ${extra}
            <label class="obj-mini-campo obj-mini-campo--check"><input type="checkbox" ${o.extra ? 'checked' : ''} data-obj-objetivo="${m}extra"><span>Punto extra</span></label>
          </div>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--icono" data-obj-mover-objetivo="${esc(pid)}|${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
            <button class="btn btn--sutil btn--icono" data-obj-mover-objetivo="${esc(pid)}|${i}" data-paso="1" ${i === p.objetivos.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
            <button class="btn btn--sutil btn--icono" data-obj-borrar-objetivo="${esc(pid)}|${i}" title="Borrar">${ico('papelera')}</button>
          </div>
        </div>`;
    }).join('');
    return `
      <section class="tarjeta">
        <div class="obj-persona__cab">
          <label class="campo" style="flex:1;margin:0"><span>Nombre de la plantilla</span>
            <input type="text" value="${esc(p.titulo)}" data-obj-plantilla-campo="${esc(pid)}|titulo"></label>
          <div class="obj-persona__total"><b>${puntuacion(total)}</b><small>puntos en total</small><span class="obj-persona__puesto">${usan} ${usan === 1 ? 'persona' : 'personas'}</span></div>
        </div>
        ${filas || '<div class="vacio" style="padding:1rem">Sin objetivos. Añade el primero.</div>'}
        <div class="bloque-video__acciones">
          <button class="btn btn--secundario btn--pequeno" data-obj-nuevo-objetivo="${esc(pid)}">${ico('mas')}<span>Añadir objetivo</span></button>
          <button class="btn btn--sutil btn--pequeno" data-obj-borrar-plantilla="${esc(pid)}" ${usan ? 'disabled title="La usan ' + usan + ' personas"' : ''}>Borrar plantilla</button>
        </div>
      </section>`;
  }).join('');
}

/* ── Vista: novedades ────────────────────────────────────────── */
function vistaNovedades() {
  if (abierto && abierto.tipo === 'novedad') return editorNovedad();

  const filas = datos.novedades.length ? datos.novedades.map((nov, i) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="fila__tit">${esc(nov.titulo || '(sin título)')} <span class="pastilla pastilla--${esc(nov.nivel)}">${esc(nov.nivel)}</span></div>
        <div class="fila__sub">${fechaLarga(nov.fecha)}${i === 0 ? ' · destacada en la portada' : ''}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--icono" data-mover-novedad="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
        <button class="btn btn--sutil btn--icono" data-mover-novedad="${i}" data-paso="1" ${i === datos.novedades.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
        <button class="btn btn--secundario btn--pequeno" data-editar-novedad="${i}">${ico('lapiz')}<span>Editar</span></button>
        <button class="btn btn--sutil btn--icono" data-borrar-novedad="${i}" title="Borrar">${ico('papelera')}</button>
      </div>
    </div>`).join('') : '<div class="vacio">Todavía no hay novedades publicadas.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Novedades</h1>
        <p>Cambios de herramientas, procedimientos y normativa. La primera de la lista se destaca en la portada y enciende el aviso de la campana.</p>
      </div>
      <div class="cab__acciones"><button class="btn btn--primario" data-nueva-novedad>${ico('mas')}<span>Nueva novedad</span></button></div>
    </div>
    ${filas}`;
}

function editorNovedad() {
  const nov = datos.novedades[abierto.indice];
  if (!nov) { abierto = null; return vistaNovedades(); }

  const niveles = [
    ['critica', 'Crítica · afecta a plazos, cumplimiento o seguridad'],
    ['importante', 'Importante · cambia un procedimiento habitual'],
    ['informativa', 'Informativa · conviene saberlo']
  ].map(([v, t]) => `<option value="${v}" ${nov.nivel === v ? 'selected' : ''}>${esc(t)}</option>`).join('');

  const etiquetas = (nov.etiquetas || []).map((e, i) =>
    `<span class="pastilla">${esc(e)}<button data-quitar-etiqueta-nov="${i}" title="Quitar">&times;</button></span>`).join('');

  return `
    <nav class="migas"><button data-cerrar-novedad>Novedades</button><span>/</span><span>${nov.titulo ? esc(nov.titulo) : 'Nueva novedad'}</span></nav>
    <div class="cab">
      <div><h1>${nov.titulo ? esc(nov.titulo) : 'Nueva novedad'}</h1></div>
      <div class="cab__acciones"><button class="btn btn--secundario" data-cerrar-novedad>${ico('chevron')}<span>Volver a la lista</span></button></div>
    </div>

    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Fecha</span>
          <input type="date" data-novedad-campo="fecha" value="${esc(nov.fecha)}"></label>
        <label class="campo"><span>Nivel</span>
          <select data-novedad-campo="nivel">${niveles}</select></label>
        <div class="campo"><span>Etiquetas</span>
          <div class="pastillas">${etiquetas}
            <button class="btn btn--sutil btn--pequeno" data-anadir-etiqueta-nov>+ Añadir</button>
          </div>
        </div>
      </div>
      <label class="campo"><span>Título</span>
        <input type="text" data-novedad-campo="titulo" value="${esc(nov.titulo)}" placeholder="Qué ha cambiado, en una frase"></label>
    </div>

    <div class="tarjeta">
      <div class="editor">
        <div>
          <div class="editor__rotulo"><span>Contenido</span></div>
          <div class="herramientas-md">
            <button class="btn btn--sutil btn--pequeno" data-insertar="**Qué tienes que hacer:**" data-destino="md-novedad">Negrita</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar="- Punto" data-destino="md-novedad">Lista</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar="> [!AVISO] Texto del aviso." data-destino="md-novedad">Aviso</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar-video="md-novedad">Vídeo</button>
          </div>
          <textarea id="md-novedad" data-novedad-campo="md" spellcheck="true">${esc(nov.md)}</textarea>
        </div>
        <div>
          <div class="editor__rotulo"><span>Así se verá</span></div>
          <div class="editor__vista prosa" data-vista-previa="md-novedad"></div>
        </div>
      </div>
    </div>`;
}

/* ── Vista: modelos de documentos ────────────────────────────── */
function vistaModelosPanel() {
  const filas = modelos.length ? modelos.map((m) => `
    <div class="fila">
      <span class="fila__n">${esc((m.archivo.split('.').pop() || '').toUpperCase().slice(0, 4))}</span>
      <div class="fila__txt">
        <div class="fila__tit">${esc(m.titulo)} <span class="pastilla">${esc(m.categoria)}</span></div>
        <div class="fila__sub">${esc(m.archivo)} · ${tamano(m.bytes)}${m.descripcion ? ' · ' + esc(m.descripcion) : ''}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--secundario btn--pequeno" data-datos-modelo="${esc(m.archivo)}">${ico('lapiz')}<span>Datos</span></button>
        <button class="btn btn--sutil btn--icono" data-borrar-modelo="${esc(m.archivo.split('/').pop())}" title="Borrar">${ico('papelera')}</button>
      </div>
    </div>`).join('') : '<div class="vacio">No hay modelos subidos todavía.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Modelos de documentos</h1>
        <p>Plantillas y escritos que el equipo descarga desde la sección Modelos del portal. Al subir o borrar, el registro se actualiza solo; con «Datos» ajustas título, categoría y descripción.</p>
      </div>
    </div>

    <label class="zona-subida" id="zona-modelo">
      ${ico('documento')}
      <strong>Arrastra un modelo o pulsa para elegirlo</strong>
      <small>PDF, Word, Excel, PowerPoint, OpenDocument, RTF o TXT · máximo 25 MB · solo plantillas vacías, nunca documentos con datos de clientes</small>
      <input type="file" id="modelo-archivo" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt">
    </label>
    <div class="progreso" id="modelo-progreso"></div>

    <div class="seccion"><h2>${ico('modelos')}Modelos publicados (${modelos.length})</h2></div>
    ${filas}`;
}

/* ── Vista: ayuda ────────────────────────────────────────────── */
function vistaAyuda() {
  return `
    <div class="cab"><div><h1>Ayuda</h1><p>Cómo se escriben los contenidos y qué pasa al guardar.</p></div></div>
    <div class="tarjeta ayuda">
      <h2>Formación en vídeo</h2>
      <p>Cada lección tiene un <strong>vídeo principal</strong> que es lo primero que ve la persona, y unos
      <strong>apuntes</strong> opcionales debajo (resumen, pasos clave, enlaces). Para ponerle vídeo a una lección:
      abre el módulo, pulsa «Editar» en la lección y elige un vídeo de la biblioteca, pega un enlace o súbelo ahí mismo.</p>
      <ul>
        <li><strong>Clips cortos</strong> (unos minutos): súbelos a la biblioteca. Se guardan con el sitio.</li>
        <li><strong>Sesiones largas</strong>: YouTube como «no listado» o Vimeo con contraseña, y pega el enlace. El reproductor no se carga hasta que alguien pulsa.</li>
        <li>Indica la duración en minutos: aparece en el itinerario y en la videoteca del portal.</li>
      </ul>

      <h2>Personas y accesos</h2>
      <p>En «Personas y accesos» das de alta a cada miembro con la cuenta de Google con la que entrará. El interruptor
      «Con acceso» permite o quita el acceso sin borrar a la persona; el rol «Administración» muestra el botón del
      panel en el portal y permite moderar Conecta. Mientras la lista esté vacía, entra cualquier cuenta.</p>

      <h2>Qué ocurre al guardar</h2>
      <p>El panel reescribe los archivos de <code>content/</code>. No publica nada fuera: los cambios quedan
      en este equipo hasta que se haga <code>git commit</code> y <code>git push</code>. Antes de sobrescribir,
      guarda una copia de cada archivo en <code>.copias-admin/</code>.</p>

      <h2>Formato de los apuntes</h2>
      <table>
        <thead><tr><th>Se escribe</th><th>Resultado</th></tr></thead>
        <tbody>
          <tr><td><code>## Título</code></td><td>Encabezado de sección</td></tr>
          <tr><td><code>**texto**</code></td><td>Negrita</td></tr>
          <tr><td><code>- punto</code></td><td>Lista con viñetas</td></tr>
          <tr><td><code>1. punto</code></td><td>Lista numerada</td></tr>
          <tr><td><code>- [ ] tarea</code></td><td>Casilla de verificación</td></tr>
          <tr><td><code>| a | b |</code></td><td>Tabla (con la fila de guiones debajo)</td></tr>
          <tr><td><code>[texto](url)</code></td><td>Enlace</td></tr>
        </tbody>
      </table>

      <h2>Llamadas destacadas</h2>
      <pre>&gt; [!NOTA] Información complementaria.
&gt; [!AVISO] Algo que conviene vigilar.
&gt; [!IMPORTANTE] Riesgo real si se incumple.
&gt; [!CLAVE] La idea que hay que retener.
&gt; [!BUENA] Buena práctica recomendada.
&gt; [!PENDIENTE] Falta completar con datos del despacho.</pre>

      <h2>Vídeos adicionales dentro de los apuntes</h2>
      <pre>:::video
https://www.youtube.com/watch?v=IDENTIFICADOR
Título del vídeo
:::</pre>

      <h2>Lo que nunca se escribe aquí</h2>
      <ul>
        <li>Datos reales de clientes, ni siquiera en ejemplos. Se inventan.</li>
        <li>Nombres de personas del despacho asociados a un asunto.</li>
        <li>Fechas o umbrales normativos sin verificar: márcalos con <code>[!PENDIENTE]</code>.</li>
      </ul>
    </div>`;
}

/* ── Interacción ─────────────────────────────────────────────── */
function insertarEn(idArea, texto) {
  const area = document.getElementById(idArea);
  if (!area) return;
  const ini = area.selectionStart, fin = area.selectionEnd;
  const antes = area.value.slice(0, ini);
  const separador = antes && !antes.endsWith('\n\n') ? (antes.endsWith('\n') ? '\n' : '\n\n') : '';
  area.value = antes + separador + texto + '\n' + area.value.slice(fin);
  area.dispatchEvent(new Event('input', { bubbles: true }));
  area.focus();
  const pos = (antes + separador + texto).length;
  area.setSelectionRange(pos, pos);
}

function bloqueVideo(url, titulo) {
  return ':::video\n' + url + (titulo ? '\n' + titulo : '') + '\n:::';
}

/* Sube un archivo al panel mostrando el avance. */
function subir(ruta, archivo, progreso) {
  return new Promise((resolver, fallar) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ruta);
    xhr.setRequestHeader('content-type', 'application/octet-stream');
    xhr.upload.onprogress = (ev) => {
      if (!progreso || !ev.lengthComputable) return;
      const pct = Math.round((ev.loaded / ev.total) * 100);
      progreso.innerHTML = 'Subiendo ' + esc(archivo.name) + ' (' + tamano(archivo.size) + ') · ' + pct + '%' +
        '<div class="progreso__barra"><span style="width:' + pct + '%"></span></div>';
    };
    xhr.onload = () => {
      try { resolver(JSON.parse(xhr.responseText)); } catch (e) { fallar(new Error('Respuesta no válida')); }
    };
    xhr.onerror = () => fallar(new Error('Error de red'));
    xhr.send(archivo);
  });
}

async function nuevoModulo() {
  const r = await formulario('Nuevo módulo', [
    { nombre: 'titulo', etiqueta: 'Título del módulo', tipo: 'text', requerido: true, placeholder: 'Gestión de citas y agenda' },
    { nombre: 'grupo', etiqueta: 'Bloque del itinerario', tipo: 'select', opciones: datos.grupos.map((g) => [g.id, g.titulo]), requerido: true },
    { nombre: 'resumen', etiqueta: 'Resumen en una frase', tipo: 'text', placeholder: 'Qué aprenderá la persona' }
  ], 'Crear módulo');
  if (!r) return;
  const id = idUnico(identificador(r.titulo), datos.modulos.map((m) => m.id));
  datos.modulos.push({
    id, num: datos.modulos.length + 1,
    grupo: r.grupo,
    titulo: r.titulo,
    resumen: r.resumen || 'Pendiente de describir.',
    duracion: 30, etiquetas: [], video: null, examen: null,
    lecciones: [{ id: 'introduccion', titulo: 'Introducción', video: null, md: '## Introducción\n\nPendiente de redactar.' }]
  });
  marcarCambios();
  irA('modulos', { tipo: 'modulo', id, leccion: 'introduccion' });
}

async function nuevaLeccion() {
  const mod = modPorId(abierto.id);
  const r = await formulario('Nueva lección', [
    { nombre: 'titulo', etiqueta: 'Título de la lección', tipo: 'text', requerido: true },
    { nombre: 'url', etiqueta: 'Vídeo (enlace o de la biblioteca)', tipo: 'select', opciones: [['', 'Lo pongo después'], ...videos.map((v) => [v.ruta, v.nombre])], valor: '' },
    { nombre: 'minutos', etiqueta: 'Duración del vídeo (minutos)', tipo: 'number', min: 0, max: 600 }
  ], 'Crear lección', 'El vídeo es lo primero que verá la persona; los apuntes se añaden después.');
  if (!r) return;
  const id = idUnico(identificador(r.titulo), mod.lecciones.map((l) => l.id));
  mod.lecciones.push({
    id, titulo: r.titulo,
    video: r.url ? { url: r.url, titulo: '', minutos: Number(r.minutos) || 0 } : null,
    md: r.url ? '' : '## ' + r.titulo + '\n\nPendiente de redactar.'
  });
  abierto.leccion = id;
  marcarCambios(); pintar();
}

document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('button');
  if (!b) return;

  /* Onda al pulsar */
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) && (b.classList.contains('btn') || b.classList.contains('pestana'))) {
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const onda = document.createElement('span');
    onda.className = 'onda';
    onda.style.width = onda.style.height = d + 'px';
    onda.style.left = (ev.clientX - r.left - d / 2) + 'px';
    onda.style.top = (ev.clientY - r.top - d / 2) + 'px';
    b.appendChild(onda);
    setTimeout(() => onda.remove(), 650);
  }

  /* Menú y accesos rápidos */
  if (b.classList.contains('pestana')) { irA(b.dataset.vista); return; }
  if (b.hasAttribute('data-ir')) {
    irA(b.dataset.ir);
    const rapida = b.dataset.accionRapida;
    if (rapida === 'nuevo-modulo') nuevoModulo();
    if (rapida === 'nueva-persona') nuevaPersona();
    if (rapida === 'nueva-novedad') { datos.novedades.unshift({ fecha: hoy(), nivel: 'informativa', etiquetas: [], titulo: '', md: '' }); marcarCambios(); irA('novedades', { tipo: 'novedad', indice: 0 }); }
    return;
  }
  if (b.hasAttribute('data-ir-leccion')) {
    const [modId, lecId] = b.dataset.irLeccion.split('|');
    irA('modulos', { tipo: 'modulo', id: modId, leccion: lecId });
    const caja = document.getElementById('leccion-' + lecId);
    if (caja) caja.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }

  /* --- Módulos --- */
  if (b.hasAttribute('data-nuevo-modulo')) { nuevoModulo(); return; }
  if (b.hasAttribute('data-editar-modulo')) {
    abierto = { tipo: 'modulo', id: b.dataset.editarModulo, leccion: null };
    pintar(); return;
  }
  if (b.hasAttribute('data-cerrar-modulo')) { abierto = null; pintar(); return; }
  if (b.hasAttribute('data-borrar-modulo')) {
    const mod = modPorId(b.dataset.borrarModulo);
    if (!await confirmar('Borrar el módulo',
      `Se eliminará "${mod.titulo}" con sus ${mod.lecciones.length} lecciones. Podrás recuperarlo con git mientras no confirmes los cambios.`, 'Borrar')) return;
    datos.modulos = datos.modulos.filter((m) => m !== mod);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover')) {
    const i = Number(b.dataset.mover);
    const paso = Number(b.dataset.paso);
    const mod = datos.modulos[i];
    const hermanos = datos.modulos.filter((m) => m.grupo === mod.grupo);
    const pos = hermanos.indexOf(mod);
    const destino = hermanos[pos + paso];
    if (!destino) return;
    const j = datos.modulos.indexOf(destino);
    datos.modulos[i] = destino; datos.modulos[j] = mod;
    marcarCambios(); pintar(); return;
  }

  /* --- Etiquetas de módulo --- */
  if (b.hasAttribute('data-anadir-etiqueta')) {
    const r = await formulario('Añadir etiqueta', [{ nombre: 'etiqueta', etiqueta: 'Etiqueta', tipo: 'text', requerido: true, placeholder: 'obligatorio, comercial, herramientas…' }], 'Añadir');
    if (!r) return;
    const mod = modPorId(abierto.id);
    mod.etiquetas = mod.etiquetas || [];
    const limpia = r.etiqueta.toLowerCase();
    if (!mod.etiquetas.includes(limpia)) mod.etiquetas.push(limpia);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-quitar-etiqueta')) {
    const mod = modPorId(abierto.id);
    mod.etiquetas.splice(Number(b.dataset.quitarEtiqueta), 1);
    marcarCambios(); pintar(); return;
  }

  /* --- Lecciones --- */
  if (b.hasAttribute('data-nueva-leccion')) { nuevaLeccion(); return; }
  if (b.hasAttribute('data-abrir-leccion')) {
    const id = b.dataset.abrirLeccion;
    abierto.leccion = abierto.leccion === id ? null : id;
    pintar();
    const caja = document.getElementById('leccion-' + id);
    if (caja && abierto.leccion) caja.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }
  if (b.hasAttribute('data-borrar-leccion')) {
    const mod = modPorId(abierto.id);
    const lec = mod.lecciones.find((l) => l.id === b.dataset.borrarLeccion);
    if (mod.lecciones.length === 1) { avisar('Un módulo necesita al menos una lección.', 'error'); return; }
    if (!await confirmar('Borrar la lección', `Se eliminará "${lec.titulo}".`, 'Borrar')) return;
    mod.lecciones = mod.lecciones.filter((l) => l !== lec);
    if (abierto.leccion === lec.id) abierto.leccion = null;
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-leccion')) {
    const mod = modPorId(abierto.id);
    const i = Number(b.dataset.moverLeccion), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= mod.lecciones.length) return;
    [mod.lecciones[i], mod.lecciones[j]] = [mod.lecciones[j], mod.lecciones[i]];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-quitar-video')) {
    const mod = modPorId(abierto.id);
    const lec = mod.lecciones.find((l) => l.id === b.dataset.quitarVideo);
    if (lec) { lec.video = null; marcarCambios(); pintar(); }
    return;
  }
  if (b.hasAttribute('data-quitar-video-modulo')) {
    const mod = modPorId(abierto.id);
    if (mod) { mod.video = null; marcarCambios(); pintar(); }
    return;
  }

  /* --- Examen del módulo --- */
  if (b.hasAttribute('data-crear-examen')) {
    const mod = modPorId(abierto.id);
    mod.examen = { aprobado: 70, preguntas: [] };
    mod.examen.preguntas.push(preguntaNueva(mod.examen));
    marcarCambios(); pintar();
    const campo = document.querySelector('#pregunta-0 .pregunta-caja__texto');
    if (campo) { campo.scrollIntoView({ block: 'center', behavior: 'smooth' }); campo.focus(); }
    return;
  }
  if (b.hasAttribute('data-quitar-examen')) {
    const mod = modPorId(abierto.id);
    const n = examenDe(mod) ? mod.examen.preguntas.length : 0;
    if (!await confirmar('Quitar el examen',
      `Se eliminarán las ${n} preguntas del examen de "${mod.titulo}". Los resultados que ya tenga el equipo no se tocan.`, 'Quitar')) return;
    mod.examen = null;
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-nueva-pregunta')) {
    const ex = examenDe(modPorId(abierto.id));
    if (!ex) return;
    ex.preguntas.push(preguntaNueva(ex));
    marcarCambios(); pintar();
    const campo = document.querySelector('#pregunta-' + (ex.preguntas.length - 1) + ' .pregunta-caja__texto');
    if (campo) { campo.scrollIntoView({ block: 'center', behavior: 'smooth' }); campo.focus(); }
    return;
  }
  if (b.hasAttribute('data-borrar-pregunta')) {
    const ex = examenDe(modPorId(abierto.id));
    const i = Number(b.dataset.borrarPregunta);
    if (!ex || !ex.preguntas[i]) return;
    const p = ex.preguntas[i];
    if (p.texto && !await confirmar('Borrar la pregunta', `Se eliminará "${p.texto}".`, 'Borrar')) return;
    ex.preguntas.splice(i, 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-pregunta')) {
    const ex = examenDe(modPorId(abierto.id));
    const i = Number(b.dataset.moverPregunta), j = i + Number(b.dataset.paso);
    if (!ex || j < 0 || j >= ex.preguntas.length) return;
    [ex.preguntas[i], ex.preguntas[j]] = [ex.preguntas[j], ex.preguntas[i]];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-nueva-opcion')) {
    const ex = examenDe(modPorId(abierto.id));
    const p = ex && ex.preguntas[Number(b.dataset.nuevaOpcion)];
    if (!p || p.opciones.length >= 6) return;
    p.opciones.push('');
    marcarCambios(); pintar();
    const campos = document.querySelectorAll('#pregunta-' + b.dataset.nuevaOpcion + ' [data-opcion-texto]');
    if (campos.length) campos[campos.length - 1].focus();
    return;
  }
  if (b.hasAttribute('data-borrar-opcion')) {
    const ex = examenDe(modPorId(abierto.id));
    const p = ex && ex.preguntas[Number(b.dataset.borrarOpcion)];
    const j = Number(b.dataset.opcion);
    if (!p || p.opciones.length <= 2) return;
    p.opciones.splice(j, 1);
    if (Number(p.correcta) === j) p.correcta = 0;
    else if (Number(p.correcta) > j) p.correcta = Number(p.correcta) - 1;
    marcarCambios(); pintar(); return;
  }

  /* --- Novedades --- */
  if (b.hasAttribute('data-nueva-novedad')) {
    datos.novedades.unshift({ fecha: hoy(), nivel: 'informativa', etiquetas: [], titulo: '', md: '' });
    abierto = { tipo: 'novedad', indice: 0 };
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-editar-novedad')) {
    abierto = { tipo: 'novedad', indice: Number(b.dataset.editarNovedad) };
    pintar(); return;
  }
  if (b.hasAttribute('data-cerrar-novedad')) { abierto = null; pintar(); return; }
  if (b.hasAttribute('data-borrar-novedad')) {
    const nov = datos.novedades[Number(b.dataset.borrarNovedad)];
    if (!await confirmar('Borrar la novedad', `Se eliminará "${nov.titulo || 'sin título'}".`, 'Borrar')) return;
    datos.novedades.splice(Number(b.dataset.borrarNovedad), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-novedad')) {
    const i = Number(b.dataset.moverNovedad), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= datos.novedades.length) return;
    [datos.novedades[i], datos.novedades[j]] = [datos.novedades[j], datos.novedades[i]];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-etiqueta-nov')) {
    const r = await formulario('Añadir etiqueta', [{ nombre: 'etiqueta', etiqueta: 'Etiqueta', tipo: 'text', requerido: true, placeholder: 'Herramientas, Procedimiento, Normativa…' }], 'Añadir');
    if (!r) return;
    const nov = datos.novedades[abierto.indice];
    nov.etiquetas = nov.etiquetas || [];
    if (!nov.etiquetas.includes(r.etiqueta)) nov.etiquetas.push(r.etiqueta);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-quitar-etiqueta-nov')) {
    datos.novedades[abierto.indice].etiquetas.splice(Number(b.dataset.quitarEtiquetaNov), 1);
    marcarCambios(); pintar(); return;
  }

  /* --- Bloques --- */
  if (b.hasAttribute('data-nuevo-grupo')) {
    const r = await formulario('Nuevo bloque del itinerario', [
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'text', requerido: true },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'text' }
    ], 'Crear bloque');
    if (!r) return;
    const id = idUnico(identificador(r.titulo), datos.grupos.map((g) => g.id));
    datos.grupos.push({ id, titulo: r.titulo, descripcion: r.descripcion || 'Pendiente de describir.' });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-grupo')) {
    const i = Number(b.dataset.moverGrupo), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= datos.grupos.length) return;
    [datos.grupos[i], datos.grupos[j]] = [datos.grupos[j], datos.grupos[i]];
    marcarCambios(); pintar(); return;
  }

  /* --- Herramientas del editor --- */
  if (b.hasAttribute('data-insertar')) {
    insertarEn(b.dataset.destino, b.dataset.insertar.replace(/&#10;/g, '\n'));
    return;
  }
  if (b.hasAttribute('data-insertar-video')) {
    const r = await formulario('Insertar un vídeo en el texto', [
      { nombre: 'url', etiqueta: 'Dirección del vídeo', tipo: 'url', requerido: true, placeholder: 'https://www.youtube.com/watch?v=…' },
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'text' }
    ], 'Insertar');
    if (!r) return;
    insertarEn(b.dataset.insertarVideo, bloqueVideo(r.url, r.titulo));
    return;
  }

  /* --- Biblioteca de vídeos --- */
  if (b.hasAttribute('data-usar-video')) { asignarVideoALeccion(b.dataset.usarVideo); return; }
  if (b.hasAttribute('data-enlazar-video')) { asignarVideoALeccion(''); return; }
  if (b.hasAttribute('data-borrar-video')) {
    const nombre = b.dataset.borrarVideo;
    const ruta = 'assets/video/' + nombre;
    const usos = usoDeVideos().get(ruta) || [];
    const aviso = usos.length ? ` Lo usan ${usos.length} ${usos.length === 1 ? 'lección' : 'lecciones'}, que se quedarán sin vídeo.` : '';
    if (!await confirmar('Borrar el vídeo', `Se eliminará ${nombre} del proyecto.${aviso} Esta acción no se puede deshacer desde el panel.`, 'Borrar')) return;
    const r = await fetch('/api/video?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    videos = videos.filter((v) => v.nombre !== nombre);
    datos.modulos.forEach((m) => {
      if (m.video && m.video.url === ruta) m.video = null;
      m.lecciones.forEach((l) => { if (l.video && l.video.url === ruta) l.video = null; });
    });
    marcarCambios();
    avisar('Vídeo eliminado', 'ok'); pintar(); return;
  }

  /* --- Modelos --- */
  if (b.hasAttribute('data-datos-modelo')) {
    const archivo = b.dataset.datosModelo;
    const actual = modelos.find((m) => m.archivo === archivo);
    if (!actual) return;
    const r = await formulario('Datos del modelo', [
      { nombre: 'titulo', etiqueta: 'Título', tipo: 'text', valor: actual.titulo, requerido: true },
      { nombre: 'categoria', etiqueta: 'Categoría', tipo: 'text', valor: actual.categoria, placeholder: 'Extranjería, Interno, Facturación…', requerido: true },
      { nombre: 'descripcion', etiqueta: 'Descripción breve', tipo: 'text', valor: actual.descripcion || '' }
    ], 'Guardar');
    if (!r) return;
    const rs = await fetch('/api/modelo-datos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archivo, titulo: r.titulo, categoria: r.categoria, descripcion: r.descripcion })
    });
    const res = await rs.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido guardar.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Datos del modelo guardados', 'ok'); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-modelo')) {
    const nombre = b.dataset.borrarModelo;
    if (!await confirmar('Borrar el modelo', `Se eliminará ${nombre} del proyecto. Esta acción no se puede deshacer desde el panel.`, 'Borrar')) return;
    const r = await fetch('/api/modelo?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Modelo eliminado', 'ok'); pintar(); return;
  }

  /* --- Personas --- */
  if (b.hasAttribute('data-nueva-persona')) { nuevaPersona(); return; }
  if (b.hasAttribute('data-borrar-persona')) {
    const p = datos.personas[Number(b.dataset.borrarPersona)];
    if (!await confirmar('Quitar a ' + p.nombre, 'Dejará de tener acceso y desaparecerá de la lista. Si solo quieres bloquear el acceso temporalmente, usa el interruptor.', 'Borrar')) return;
    datos.personas.splice(Number(b.dataset.borrarPersona), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-foto')) {
    const nombre = b.dataset.borrarFoto;
    if (!await confirmar('Borrar la foto', `Se eliminará ${nombre}. Quien la use quedará con sus iniciales.`, 'Borrar')) return;
    const r = await fetch('/api/foto?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    fotos = res.fotos || [];
    avisar('Foto eliminada', 'ok'); pintar(); return;
  }

  /* --- Reconocimientos, tablón y ranking --- */
  if (b.hasAttribute('data-anadir-edm')) {
    const opciones = [['', 'Escribir a mano'], ...datos.personas.map((p) => [p.correo, p.nombre])];
    const r = await formulario('Nuevo reconocimiento', [
      { nombre: 'persona', etiqueta: 'Persona', tipo: 'select', opciones, valor: '' },
      { nombre: 'mes', etiqueta: 'Mes', tipo: 'month', valor: mesActual(), requerido: true },
      { nombre: 'motivo', etiqueta: 'Motivo del reconocimiento', tipo: 'textarea' }
    ], 'Añadir');
    if (!r) return;
    const p = datos.personas.find((x) => x.correo === r.persona);
    datos.equipo.empleadosDelMes.unshift({ mes: r.mes, nombre: p ? p.nombre : '', iniciales: p ? inicialesDe(p.nombre) : '', foto: p ? p.foto : '', motivo: r.motivo });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-edm')) {
    if (!await confirmar('Borrar el reconocimiento', 'Se quitará de la lista al guardar.', 'Borrar')) return;
    datos.equipo.empleadosDelMes.splice(Number(b.dataset.borrarEdm), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-anuncio')) {
    datos.equipo.tablon.unshift({ fecha: hoy(), tipo: 'aviso', titulo: '', md: '' });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-anuncio')) {
    if (!await confirmar('Borrar el anuncio', 'Se quitará del tablón al guardar.', 'Borrar')) return;
    datos.equipo.tablon.splice(Number(b.dataset.borrarAnuncio), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-ranking')) {
    const opciones = [['', 'Escribir a mano'], ...datos.personas.map((p) => [p.correo, p.nombre])];
    const r = await formulario('Añadir al ranking', [
      { nombre: 'persona', etiqueta: 'Persona', tipo: 'select', opciones, valor: '' },
      { nombre: 'puntos', etiqueta: 'Puntuación', tipo: 'number', min: 0, valor: 0, requerido: true }
    ], 'Añadir');
    if (!r) return;
    const p = datos.personas.find((x) => x.correo === r.persona);
    datos.equipo.ranking.personas.push({ nombre: p ? p.nombre : '', iniciales: p ? inicialesDe(p.nombre) : '', foto: p ? p.foto : '', puntos: Number(r.puntos) || 0 });
    if (!datos.equipo.ranking.actualizado) datos.equipo.ranking.actualizado = hoy();
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-ranking')) {
    datos.equipo.ranking.personas.splice(Number(b.dataset.borrarRanking), 1);
    marcarCambios(); pintar(); return;
  }

  /* --- Objetivos --- */
  if (b.hasAttribute('data-obj-pestana')) { objetivosPestana = b.dataset.objPestana; pintar(); return; }
  if (b.hasAttribute('data-obj-mes')) { objetivosMes = b.dataset.objMes; pintar(); return; }
  if (b.hasAttribute('data-obj-borrar-registro')) {
    const ob = objetivosDatos();
    const mes = mesObjetivosElegido();
    const p = ob.personas.find((x) => x.id === b.dataset.objBorrarRegistro);
    if (!p || !(ob.meses[mes] || {})[p.id]) return;
    if (!await confirmar('Vaciar los resultados', `Se borrarán los resultados y puntos de ${p.nombre} en ${nombreMes(mes)}.`, 'Vaciar')) return;
    delete ob.meses[mes][p.id];
    if (!Object.keys(ob.meses[mes]).length) delete ob.meses[mes];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-nueva-persona')) {
    const ob = objetivosDatos();
    const plantillas = Object.entries(ob.plantillas).map(([id, p]) => [id, p.titulo || id]);
    if (!plantillas.length) { avisar('Primero crea una plantilla de objetivos.', 'error'); objetivosPestana = 'plantillas'; pintar(); return; }
    const cuentas = datos.personas.map((x) => [String(x.correo || '').toLowerCase(), x.nombre + ' · ' + x.correo]);
    const r = await formulario('Nueva persona con objetivos', [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true, placeholder: 'Nombre de pila, como se le conoce en el despacho' },
      { nombre: 'plantilla', etiqueta: 'Plantilla de objetivos', tipo: 'select', opciones: plantillas, requerido: true },
      { nombre: 'correo', etiqueta: 'Cuenta del portal', tipo: 'select', opciones: [['', 'Por nombre de pila, sin enlazar'], ...cuentas], valor: '' }
    ], 'Crear');
    if (!r) return;
    const id = idUnico(identificador(r.nombre), ob.personas.map((x) => x.id));
    ob.personas.push({ id, nombre: r.nombre.trim(), correo: r.correo || '', plantilla: r.plantilla, metas: {} });
    objetivosPestana = 'personas';
    marcarCambios(); pintar();
    const tarjeta = document.getElementById('obj-persona-' + id);
    if (tarjeta) tarjeta.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  if (b.hasAttribute('data-obj-borrar-persona')) {
    const ob = objetivosDatos();
    const p = ob.personas.find((x) => x.id === b.dataset.objBorrarPersona);
    if (!p) return;
    const n = mesesDe(ob, p.id).length;
    if (!await confirmar('Quitar a ' + p.nombre + ' de los objetivos',
      n ? `Se borrarán también sus ${n} meses de resultados. Podrás recuperarlos con git mientras no confirmes los cambios.` : 'No tiene resultados todavía.', 'Quitar')) return;
    ob.personas = ob.personas.filter((x) => x !== p);
    for (const mes of Object.keys(ob.meses)) { delete ob.meses[mes][p.id]; if (!Object.keys(ob.meses[mes]).length) delete ob.meses[mes]; }
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-nueva-plantilla')) {
    const ob = objetivosDatos();
    const r = await formulario('Nueva plantilla de objetivos', [
      { nombre: 'titulo', etiqueta: 'Nombre', tipo: 'text', requerido: true, placeholder: 'Objetivos de administración' }
    ], 'Crear');
    if (!r) return;
    const id = idUnico(identificador(r.titulo), Object.keys(ob.plantillas));
    ob.plantillas[id] = { titulo: r.titulo.trim(), objetivos: [] };
    objetivosPestana = 'plantillas';
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-borrar-plantilla')) {
    const ob = objetivosDatos();
    const pid = b.dataset.objBorrarPlantilla;
    if (ob.personas.some((x) => x.plantilla === pid)) { avisar('Hay personas con esa plantilla. Cámbiales la plantilla antes.', 'error'); return; }
    if (!await confirmar('Borrar la plantilla', `Se eliminará "${(ob.plantillas[pid] || {}).titulo || pid}".`, 'Borrar')) return;
    delete ob.plantillas[pid];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-nuevo-objetivo')) {
    const ob = objetivosDatos();
    const p = ob.plantillas[b.dataset.objNuevoObjetivo];
    if (!p) return;
    const r = await formulario('Nuevo objetivo', [
      { nombre: 'texto', etiqueta: 'Objetivo', tipo: 'text', requerido: true, placeholder: 'Reseñas de Google' },
      { nombre: 'max', etiqueta: 'Puntuación máxima', tipo: 'number', min: 0, max: 20, valor: 1, requerido: true },
      { nombre: 'tipo', etiqueta: 'Cómo se puntúa', tipo: 'select', opciones: Object.entries(TIPOS_OBJETIVO), valor: 'proporcional', requerido: true },
      { nombre: 'meta', etiqueta: 'Meta (si es proporcional)', tipo: 'number', min: 0 },
      { nombre: 'unidad', etiqueta: 'Unidad (clientes, €, reseñas…)', tipo: 'text' }
    ], 'Añadir');
    if (!r) return;
    const id = idUnico(identificador(r.texto), p.objetivos.map((o) => o.id));
    const o = { id, texto: r.texto.trim(), max: Number(r.max) || 0, tipo: r.tipo };
    if (r.tipo === 'proporcional') { o.meta = Number(r.meta) || 1; o.unidad = r.unidad || ''; }
    if (r.tipo === 'relativo') { o.base = (p.objetivos.find((x) => x.tipo === 'proporcional') || {}).id || ''; o.proporcion = 0.5; o.unidad = r.unidad || ''; }
    p.objetivos.push(o);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-borrar-objetivo')) {
    const ob = objetivosDatos();
    const [pid, idx] = b.dataset.objBorrarObjetivo.split('|');
    const p = ob.plantillas[pid];
    const o = p && p.objetivos[Number(idx)];
    if (!o) return;
    if (!await confirmar('Borrar el objetivo', `Se quitará "${o.texto}" de la plantilla. Los resultados ya guardados de ese objetivo dejarán de contar.`, 'Borrar')) return;
    p.objetivos.splice(Number(idx), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-obj-mover-objetivo')) {
    const ob = objetivosDatos();
    const [pid, idx] = b.dataset.objMoverObjetivo.split('|');
    const p = ob.plantillas[pid];
    const i = Number(idx), j = i + Number(b.dataset.paso);
    if (!p || j < 0 || j >= p.objetivos.length) return;
    [p.objetivos[i], p.objetivos[j]] = [p.objetivos[j], p.objetivos[i]];
    marcarCambios(); pintar(); return;
  }

  /* --- Barra de guardado --- */
  if (b.id === 'btn-guardar') { await guardar(); return; }
  if (b.id === 'btn-descartar') {
    if (!await confirmar('Descartar los cambios', 'Se perderá todo lo que hayas editado desde el último guardado.', 'Descartar')) return;
    abierto = null; await cargar(); avisar('Cambios descartados'); return;
  }
});

/* Actualiza el vídeo (de una lección o del módulo) desde el campo
   editado y refresca la vista previa sin repintar toda la pantalla. */
function actualizarVideoDesde(el, objeto, campo, tituloPorDefecto, idPrevia) {
  objeto.video = objeto.video || { url: '', titulo: '', minutos: 0 };
  const bloque = el.closest('.bloque-video');
  if (campo === 'biblioteca') {
    if (el.value) {
      objeto.video.url = el.value;
      const externa = bloque && bloque.querySelector('input[type="url"]');
      if (externa) externa.value = '';
    } else if (videos.some((v) => v.ruta === objeto.video.url)) {
      objeto.video.url = '';
    }
  } else if (campo === 'url') {
    objeto.video.url = el.value.trim();
    const sel = bloque && bloque.querySelector('select');
    if (sel && el.value.trim()) sel.value = '';
  } else if (campo === 'minutos') {
    objeto.video.minutos = Number(el.value) || 0;
  } else if (campo === 'titulo') {
    objeto.video.titulo = el.value;
  }
  const con = Boolean(String(objeto.video.url || '').trim());
  const previa = document.getElementById(idPrevia);
  if (previa) previa.innerHTML = con ? videoHtml(objeto.video.url, objeto.video.titulo || tituloPorDefecto) : '';
  if (bloque) {
    bloque.classList.toggle('bloque-video--vacio', !con);
    const marca = bloque.querySelector('.marca-video');
    if (marca) {
      marca.className = 'marca-video ' + (con ? 'marca-video--si' : 'marca-video--no');
      const info = con ? interpretarVideo(objeto.video.url) : null;
      marca.innerHTML = ico(con ? 'tick' : 'alerta') + (con ? 'Con vídeo' + (info ? ' · ' + esc(info.proveedor) : '') : 'Sin vídeo todavía');
    }
  }
}

/* Cambios en los campos */
document.addEventListener('input', (ev) => {
  const el = ev.target;
  let cambiado = false;

  if (el.dataset.moduloCampo && abierto?.tipo === 'modulo') {
    const mod = modPorId(abierto.id);
    mod[el.dataset.moduloCampo] = el.type === 'number' ? Number(el.value) : el.value;
    cambiado = true;
    if (el.dataset.moduloCampo === 'grupo') { marcarCambios(); pintar(); return; }
  }

  if (el.dataset.leccionCampo && abierto?.tipo === 'modulo') {
    const mod = modPorId(abierto.id);
    const lec = mod.lecciones.find((l) => l.id === el.dataset.leccionId);
    if (lec) { lec[el.dataset.leccionCampo] = el.value; cambiado = true; }
  }

  if (el.dataset.leccionVideo && abierto?.tipo === 'modulo') {
    const mod = modPorId(abierto.id);
    const lec = mod.lecciones.find((l) => l.id === el.dataset.leccionId);
    if (lec) {
      actualizarVideoDesde(el, lec, el.dataset.leccionVideo, lec.titulo, 'previa-video-' + lec.id);
      cambiado = true;
    }
  }

  if (el.dataset.moduloVideo && abierto?.tipo === 'modulo') {
    const mod = modPorId(abierto.id);
    actualizarVideoDesde(el, mod, el.dataset.moduloVideo, mod.titulo, 'previa-video-modulo');
    cambiado = true;
  }

  /* Examen: nota, texto de las preguntas, opciones y explicación. */
  if (el.dataset.examenCampo && abierto?.tipo === 'modulo') {
    const ex = examenDe(modPorId(abierto.id));
    if (ex) { ex[el.dataset.examenCampo] = Number(el.value) || 0; cambiado = true; }
  }
  if (el.dataset.preguntaCampo && abierto?.tipo === 'modulo') {
    const ex = examenDe(modPorId(abierto.id));
    const p = ex && ex.preguntas[Number(el.dataset.pregunta)];
    if (p) { p[el.dataset.preguntaCampo] = el.value; cambiado = true; }
  }
  if (el.dataset.opcionTexto !== undefined && abierto?.tipo === 'modulo') {
    const ex = examenDe(modPorId(abierto.id));
    const p = ex && ex.preguntas[Number(el.dataset.opcionTexto)];
    if (p) { p.opciones[Number(el.dataset.opcion)] = el.value; cambiado = true; }
  }

  if (el.dataset.novedadCampo && abierto?.tipo === 'novedad') {
    datos.novedades[abierto.indice][el.dataset.novedadCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.grupoCampo) {
    datos.grupos[Number(el.dataset.grupoIndice)][el.dataset.grupoCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.personaCampo) {
    const p = datos.personas[Number(el.dataset.personaIndice)];
    if (p) { p[el.dataset.personaCampo] = el.value; cambiado = true; }
    if (el.dataset.personaCampo === 'rol' || el.dataset.personaCampo === 'foto') { marcarCambios(); pintar(); return; }
  }
  if (el.hasAttribute('data-persona-activo')) {
    const p = datos.personas[Number(el.dataset.personaActivo)];
    if (p) { p.activo = el.checked; marcarCambios(); pintar(); return; }
  }

  if (el.dataset.edmCampo) {
    datos.equipo.empleadosDelMes[Number(el.dataset.edmIndice)][el.dataset.edmCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.anuncioCampo) {
    datos.equipo.tablon[Number(el.dataset.anuncioIndice)][el.dataset.anuncioCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.rankingCampo) {
    const p = datos.equipo.ranking.personas[Number(el.dataset.rankingIndice)];
    p[el.dataset.rankingCampo] = el.dataset.rankingCampo === 'puntos' ? Number(el.value) : el.value;
    cambiado = true;
  }

  if (el.hasAttribute('data-ranking-fecha')) {
    datos.equipo.ranking.actualizado = el.value;
    cambiado = true;
  }

  /* Objetivos: resultados y puntos del mes, metas, personas y plantillas. */
  if (el.dataset.objRes !== undefined || el.dataset.objPts !== undefined) {
    const esResultado = el.dataset.objRes !== undefined;
    const [personaId, objId] = (esResultado ? el.dataset.objRes : el.dataset.objPts).split('|');
    const mes = mesObjetivosElegido();
    const r = registroObjetivos(personaId, mes, true);
    const mapa = esResultado ? r.resultados : r.puntos;
    if (el.value === '') delete mapa[objId]; else mapa[objId] = Number(el.value);
    if (!esResultado) el.classList.toggle('obj-pts--fijado', el.value !== '' && el.placeholder === 'auto');
    limpiarRegistroVacio(personaId, mes);
    refrescarObjetivos(personaId);
    cambiado = true;
  }
  if (el.dataset.objTotalFijo !== undefined) {
    const personaId = el.dataset.objTotalFijo;
    const mes = mesObjetivosElegido();
    const r = registroObjetivos(personaId, mes, true);
    if (el.value === '') delete r.total; else r.total = Number(el.value);
    limpiarRegistroVacio(personaId, mes);
    refrescarObjetivos(personaId);
    cambiado = true;
  }
  if (el.dataset.objMeta !== undefined) {
    const [personaId, objId] = el.dataset.objMeta.split('|');
    const p = objetivosDatos().personas.find((x) => x.id === personaId);
    if (p) {
      p.metas = p.metas || {};
      if (el.value === '') delete p.metas[objId]; else p.metas[objId] = Number(el.value);
      cambiado = true;
    }
  }
  if (el.dataset.objPersonaCampo !== undefined) {
    const [personaId, campo] = el.dataset.objPersonaCampo.split('|');
    const p = objetivosDatos().personas.find((x) => x.id === personaId);
    if (p) {
      if (campo === 'baja') { if (el.checked) p.baja = true; else delete p.baja; }
      else p[campo] = campo === 'correo' ? el.value.trim().toLowerCase() : el.value;
      if (campo === 'plantilla') { marcarCambios(); pintar(); return; }
      cambiado = true;
    }
  }
  if (el.dataset.objPlantillaCampo !== undefined) {
    const [pid, campo] = el.dataset.objPlantillaCampo.split('|');
    const p = objetivosDatos().plantillas[pid];
    if (p) { p[campo] = el.value; cambiado = true; }
  }
  if (el.dataset.objObjetivo !== undefined) {
    const [pid, idx, campo] = el.dataset.objObjetivo.split('|');
    const p = objetivosDatos().plantillas[pid];
    const o = p && p.objetivos[Number(idx)];
    if (o) {
      if (campo === 'extra') { if (el.checked) o.extra = true; else delete o.extra; }
      else if (campo === 'max' || campo === 'meta' || campo === 'proporcion') o[campo] = Number(el.value) || 0;
      else o[campo] = el.value;
      if (campo === 'tipo') {
        if (o.tipo === 'proporcional') { o.meta = o.meta || 1; o.unidad = o.unidad || ''; delete o.base; delete o.proporcion; }
        else if (o.tipo === 'relativo') { o.base = o.base || (p.objetivos.find((x) => x !== o && x.tipo === 'proporcional') || {}).id || ''; o.proporcion = o.proporcion || 0.5; o.unidad = o.unidad || ''; delete o.meta; }
        else { delete o.meta; delete o.base; delete o.proporcion; delete o.unidad; }
        marcarCambios(); pintar(); return;
      }
      cambiado = true;
    }
  }

  if (cambiado) {
    marcarCambios();
    const caja = document.querySelector('[data-vista-previa="' + el.id + '"]');
    if (caja) caja.innerHTML = render(el.value);
  }
});

/* ── Subidas de archivos ─────────────────────────────────────── */
/* Las fotos del equipo se recortan al cuadrado y se reducen antes de
   subirlas: una foto de móvil de varios MB queda en unas decenas de KB. */
async function reducirFotoEquipo(archivo, lado = 640) {
  const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const min = Math.min(mapa.width, mapa.height);
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = Math.min(lado, min);
  lienzo.getContext('2d').drawImage(mapa, (mapa.width - min) / 2, (mapa.height - min) / 2, min, min, 0, 0, lienzo.width, lienzo.height);
  const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', 0.88));
  return new File([blob], archivo.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

async function subirFoto(archivo, nombreDestino, progreso) {
  progreso = progreso || $('#foto-progreso');
  const limpiar = () => { if (progreso) progreso.textContent = ''; };
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) { avisar('Elige una imagen JPG, PNG o WebP.', 'error'); return null; }
    const reducida = await reducirFotoEquipo(archivo);
    const nombre = (nombreDestino || reducida.name).replace(/\.[^.]+$/, '') + '.jpg';
    const res = await subir('/api/foto?nombre=' + encodeURIComponent(nombre), reducida, progreso);
    if (!res.ok) { limpiar(); avisar(res.error || 'No se ha podido subir.', 'error'); return null; }
    fotos = res.fotos || [];
    return res;
  } catch (e) {
    limpiar();
    avisar('Error al subir: ' + e.message, 'error');
    return null;
  }
}

async function subirFotoEquipo(archivo) {
  const res = await subirFoto(archivo);
  if (!res) return;
  avisar('Foto subida. Ya puedes elegirla en cada persona.', 'ok');
  pintar();
}

/* Foto de una persona de objetivos: se sube con su identificador y
   queda asignada al momento. */
async function subirFotoObjetivo(archivo, personaId) {
  const p = objetivosDatos().personas.find((x) => x.id === personaId);
  if (!p) return;
  const res = await subirFoto(archivo, personaId, document.getElementById('progreso-foto-' + personaId));
  if (!res) return;
  p.foto = res.ruta;
  marcarCambios();
  avisar('Foto de ' + p.nombre + ' subida. Guarda para publicarla.', 'ok');
  pintar();
}

async function subirModelo(archivo) {
  const progreso = $('#modelo-progreso');
  try {
    const res = await subir('/api/modelo?nombre=' + encodeURIComponent(archivo.name), archivo, progreso);
    if (!res.ok) { progreso.textContent = ''; avisar(res.error || 'No se ha podido subir.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Modelo subido. Pulsa «Datos» para ponerle título y categoría.', 'ok');
    pintar();
  } catch (e) {
    progreso.textContent = '';
    avisar('Error al subir: ' + e.message, 'error');
  }
}

/* Sube un vídeo a la biblioteca; si viene de una lección, lo asigna. */
async function subirVideo(archivo, leccionId) {
  const esModulo = leccionId === '__modulo';
  const progreso = leccionId
    ? document.getElementById(esModulo ? 'progreso-video-modulo' : 'progreso-video-' + leccionId)
    : $('#video-progreso');
  if (archivo.size > 200 * 1024 * 1024) { avisar('El vídeo supera los 200 MB. Súbelo a YouTube o Vimeo y pega el enlace.', 'error'); return; }
  try {
    const res = await subir('/api/video?nombre=' + encodeURIComponent(archivo.name), archivo, progreso);
    if (!res.ok) { if (progreso) progreso.textContent = ''; avisar(res.error || 'No se ha podido subir.', 'error'); return; }
    videos = videos.filter((v) => v.nombre !== res.nombre).concat([{ nombre: res.nombre, ruta: res.ruta, bytes: res.bytes }]);
    if (leccionId && abierto?.tipo === 'modulo') {
      const mod = modPorId(abierto.id);
      const destino = esModulo ? mod : mod.lecciones.find((l) => l.id === leccionId);
      if (destino) {
        destino.video = { url: res.ruta, titulo: (destino.video && destino.video.titulo) || '', minutos: (destino.video && destino.video.minutos) || 0 };
        marcarCambios();
      }
      avisar(esModulo ? 'Vídeo subido y puesto como presentación del módulo. Recuerda guardar.' : 'Vídeo subido y puesto en la lección. Recuerda guardar.', 'ok');
    } else {
      avisar('Vídeo subido a la biblioteca.', 'ok');
    }
    pintar();
  } catch (e) {
    if (progreso) progreso.textContent = '';
    avisar('Error al subir: ' + e.message, 'error');
  }
}

document.addEventListener('change', (ev) => {
  const el = ev.target;

  // Objetivos: cambio de mes desde el selector.
  if (el.hasAttribute('data-obj-mes-sel')) {
    if (/^\d{4}-\d{2}$/.test(el.value)) { objetivosMes = el.value; pintar(); }
    return;
  }

  // Examen: qué opción es la correcta.
  if (el.dataset.correcta !== undefined && abierto?.tipo === 'modulo') {
    const ex = examenDe(modPorId(abierto.id));
    const p = ex && ex.preguntas[Number(el.dataset.correcta)];
    if (p) {
      p.correcta = Number(el.value) || 0;
      el.closest('.pregunta-caja__opciones').querySelectorAll('.opcion-fila').forEach((fila, j) =>
        fila.classList.toggle('opcion-fila--correcta', j === p.correcta));
      marcarCambios();
    }
    return;
  }

  const archivo = el.files && el.files[0];
  if (!archivo) return;
  if (el.id === 'foto-archivo') subirFotoEquipo(archivo);
  else if (el.classList.contains('subida-foto-objetivo')) subirFotoObjetivo(archivo, el.dataset.personaObj);
  else if (el.id === 'modelo-archivo') subirModelo(archivo);
  else if (el.id === 'video-archivo') subirVideo(archivo, null);
  else if (el.classList.contains('subida-video-leccion')) subirVideo(archivo, el.dataset.leccionId);
  else if (el.classList.contains('subida-video-modulo')) subirVideo(archivo, '__modulo');
});

/* Arrastrar y soltar sobre las zonas de subida. */
document.addEventListener('dragover', (ev) => {
  const zona = ev.target.closest('.zona-subida');
  if (!zona) return;
  ev.preventDefault();
  zona.classList.add('zona-subida--sobre');
});
document.addEventListener('dragleave', (ev) => {
  const zona = ev.target.closest('.zona-subida');
  if (zona) zona.classList.remove('zona-subida--sobre');
});
document.addEventListener('drop', (ev) => {
  const zona = ev.target.closest('.zona-subida');
  if (!zona) return;
  ev.preventDefault();
  zona.classList.remove('zona-subida--sobre');
  const archivo = ev.dataTransfer.files && ev.dataTransfer.files[0];
  if (!archivo) return;
  if (zona.id === 'zona-video') subirVideo(archivo, null);
  else if (zona.id === 'zona-foto') subirFotoEquipo(archivo);
  else if (zona.id === 'zona-modelo') subirModelo(archivo);
});

/* Ctrl+S guarda; se avisa antes de cerrar con cambios. */
document.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
    ev.preventDefault();
    if (sucio()) guardar();
  }
});
window.addEventListener('beforeunload', (ev) => {
  if (sucio()) { ev.preventDefault(); ev.returnValue = ''; }
});

/* Iconos de la barra lateral y los botones fijos. */
$$('[data-ico]').forEach((el) => {
  el.insertAdjacentHTML('afterbegin', ico(el.dataset.ico));
});

cargar().catch((e) => {
  $('#lienzo').innerHTML = '<div class="errores"><strong>No se ha podido cargar el panel.</strong>' + esc(e.message) + '</div>';
});
