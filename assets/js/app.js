/* ===============================================================
   app.js - Arranque, enrutador y control de la interfaz
   =============================================================== */

import { LECCIONES, TOTAL_LECCIONES, VERSION, moduloPorId } from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import equipo from '../../content/equipo.js';
import modelos from '../../content/modelos.js';
import {
  sesion, tema, progreso, novedadesVistas, vistos, objetivosHechos,
  autorMuro, almacenamientoDisponible
} from './estado.js';
import { buscar, resaltar, normalizar, construirIndice } from './buscador.js';
import {
  vistaInicio, vistaModulo, vistaNovedades, vistaBusqueda,
  vistaNoEncontrada, vistaFormacion, vistaOnboarding, vistaEquipo,
  vistaModelos, vistaMuro, piezaPublicacion, piezaOficial, elementosOficiales,
  navegacionLateral, formatearFecha, objetivosDelMes, mesActual
} from './vistas.js';

/* ── Acceso con Google (Google Identity Services) ────────────
   [PENDIENTE] Crear en Google Cloud Console un "ID de cliente de
   OAuth" de tipo Aplicación web, añadir como orígenes autorizados
   http://localhost:8099 y la dirección donde se publique el sitio,
   y pegar aquí el identificador (acaba en .apps.googleusercontent.com).
   Mientras esté vacío, la pantalla de acceso deja entrar sin verificar. */
const CLIENTE_GOOGLE = '';

/* Restricción de cuentas. Si ambas listas quedan vacías se admite
   cualquier cuenta de Google que pase por la pantalla de acceso.
   [PENDIENTE] Rellenar con las cuentas asignadas por el despacho. */
const DOMINIO_PERMITIDO = '';        // p. ej. 'diazyasociados.es'
const CORREOS_PERMITIDOS = [];       // p. ej. ['persona@gmail.com']

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ── Utilidades ──────────────────────────────────────────────── */
let temporizadorAviso = null;
function avisar(mensaje) {
  const el = $('#aviso');
  el.textContent = mensaje;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('aviso--visible'));
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => {
    el.classList.remove('aviso--visible');
    setTimeout(() => { el.hidden = true; }, 300);
  }, 2600);
}

/* ── Pantalla de acceso ──────────────────────────────────────── */
function decodificarCredencial(credencial) {
  // El token de Google es un JWT: cabecera.carga.firma, en base64url.
  const carga = credencial.split('.')[1]
    .replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(carga), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function cuentaPermitida(correo) {
  const c = String(correo || '').toLowerCase();
  if (!c) return false;
  if (CORREOS_PERMITIDOS.length) {
    return CORREOS_PERMITIDOS.some((p) => p.toLowerCase() === c);
  }
  if (DOMINIO_PERMITIDO) return c.endsWith('@' + DOMINIO_PERMITIDO.toLowerCase());
  return true;
}

function entrarEnApp() {
  $('#acceso').hidden = true;
  arrancarApp();
}

function iniciarAcceso() {
  const acceso = $('#acceso');
  const boton = $('#acceso-entrar');
  const error = $('#acceso-error');
  acceso.hidden = false;

  // Sin identificador de cliente todavía: la pantalla se muestra igual,
  // pero el botón entra directamente y se avisa de que falta configurarlo.
  if (!CLIENTE_GOOGLE) {
    boton.hidden = false;
    $('#acceso-pendiente').hidden = false;
    boton.addEventListener('click', () => {
      sesion.abrir({});
      entrarEnApp();
    });
    return;
  }

  const guion = document.createElement('script');
  guion.src = 'https://accounts.google.com/gsi/client';
  guion.async = true;
  guion.onload = () => {
    window.google.accounts.id.initialize({
      client_id: CLIENTE_GOOGLE,
      callback: (respuesta) => {
        let datos;
        try {
          datos = decodificarCredencial(respuesta.credential);
        } catch (e) {
          error.textContent = 'No se pudo leer la respuesta de Google. Inténtalo de nuevo.';
          error.hidden = false;
          return;
        }
        if (!cuentaPermitida(datos.email)) {
          error.textContent = 'La cuenta ' + datos.email + ' no tiene acceso a esta plataforma. Usa la cuenta que te asignó el despacho.';
          error.hidden = false;
          return;
        }
        sesion.abrir({ correo: datos.email, nombre: datos.name || '' });
        entrarEnApp();
      }
    });
    window.google.accounts.id.renderButton($('#acceso-google'), {
      theme: 'filled_blue', size: 'large', shape: 'pill',
      text: 'signin_with', locale: 'es', width: 300
    });
  };
  guion.onerror = () => {
    error.textContent = 'No se pudo cargar el acceso de Google. Comprueba la conexión y recarga la página.';
    error.hidden = false;
  };
  document.head.appendChild(guion);
}

/* ── Enrutador ───────────────────────────────────────────────── */
function rutaActual() {
  const h = location.hash || '#/inicio';
  return h.startsWith('#/') ? h : '#/inicio';
}

function pintar() {
  const ruta = rutaActual();
  const partes = ruta.slice(2).split('/').filter(Boolean);
  const vista = $('#vista');

  let html;
  if (!partes.length || partes[0] === 'inicio') {
    html = vistaInicio();
  } else if (partes[0] === 'modulo') {
    html = vistaModulo(partes[1], partes[2]);
  } else if (partes[0] === 'formacion') {
    html = vistaFormacion();
  } else if (partes[0] === 'onboarding') {
    html = vistaOnboarding();
  } else if (partes[0] === 'conecta' || partes[0] === 'muro') {
    html = vistaMuro();
  } else if (partes[0] === 'modelos') {
    html = vistaModelos();
    if (modelos.length) {
      const reciente = modelos.map((m) => m.actualizado || '').sort().pop();
      vistos.marcar('modelos', reciente);
      actualizarPuntoAvisos();
    }
  } else if (partes[0] === 'equipo') {
    html = vistaEquipo();
    if (equipo.tablon.length) vistos.marcar('tablon', equipo.tablon[0].fecha);
    if (equipo.empleadosDelMes.length) vistos.marcar('empleado', equipo.empleadosDelMes[0].mes);
    if (equipo.ranking && equipo.ranking.actualizado) vistos.marcar('ranking', equipo.ranking.actualizado);
    actualizarPuntoAvisos();
  } else if (partes[0] === 'novedades') {
    html = vistaNovedades();
    if (novedades.length) {
      novedadesVistas.marcarVistas(novedades[0].fecha);
      actualizarPuntoAvisos();
    }
  } else if (partes[0] === 'buscar') {
    const consulta = decodeURIComponent(partes.slice(1).join('/') || '');
    const terminos = normalizar(consulta).split(/\s+/).filter((t) => t.length >= 2);
    html = vistaBusqueda(consulta, buscar(consulta, 60), resaltar, terminos);
  } else {
    html = vistaNoEncontrada();
  }

  vista.innerHTML = html;
  $('#lateral-nav').innerHTML = navegacionLateral(ruta);
  actualizarProgreso();
  cerrarLateral();

  // Sección activa en la navegación superior. Dentro de un módulo se
  // resalta Formación, que es el itinerario al que pertenece.
  const seccion = !partes.length ? 'inicio'
    : partes[0] === 'modulo' ? 'formacion'
    : partes[0] === 'muro' ? 'conecta'
    : partes[0];
  $$('#nav-principal a').forEach((enlace) => {
    if (enlace.dataset.seccion === seccion) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });

  // La barra lateral solo se muestra dentro de un módulo.
  $('#app').classList.toggle('app--sin-lateral', partes[0] !== 'modulo');

  if (partes[0] === 'conecta' || partes[0] === 'muro') cargarMuro();

  // Desplazamiento a la lección abierta, o al principio.
  if (partes[0] === 'modulo' && partes[2]) {
    const el = document.getElementById('lec-' + partes[2]);
    if (el) { desplazarA(el); return; }
  }
  window.scrollTo(0, 0);
}

/* Desplaza dejando libre la cabecera fija. */
function desplazarA(el) {
  requestAnimationFrame(() => {
    const alto = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--alto-cabecera'), 10) || 60;
    const arriba = el.getBoundingClientRect().top + window.scrollY - alto - 16;
    window.scrollTo({ top: Math.max(0, arriba), behavior: 'auto' });
  });
}

/* ── Centro de avisos (campana) ──────────────────────────────── */
const icoAviso = (d) =>
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
const AVISO_ICO = {
  campana: 'M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  trofeo: 'M8 21h8M12 17v4M7 4h10v4.5a5 5 0 01-10 0zM7 6H4.5a2.5 2.5 0 002.5 3M17 6h2.5A2.5 2.5 0 0117 9',
  calendario: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  diana: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 12h.01',
  documento: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4'
};

const modeloMasReciente = () =>
  modelos.map((m) => m.actualizado || '').sort().pop() || '';

function hayAvisosNuevos() {
  if (novedades.length && novedadesVistas.hayNuevas(novedades[0].fecha)) return true;
  if (equipo.tablon.length && vistos.hayNuevo('tablon', equipo.tablon[0].fecha)) return true;
  if (equipo.empleadosDelMes.length && vistos.hayNuevo('empleado', equipo.empleadosDelMes[0].mes)) return true;
  if (equipo.ranking && equipo.ranking.actualizado && vistos.hayNuevo('ranking', equipo.ranking.actualizado)) return true;
  if (objetivosDelMes().lista.length && vistos.hayNuevo('objetivos', mesActual())) return true;
  if (modelos.length && vistos.hayNuevo('modelos', modeloMasReciente())) return true;
  if (muroUltimaFecha && vistos.hayNuevo('muro', muroUltimaFecha)) return true;
  return false;
}

function actualizarPuntoAvisos() {
  $('#punto-novedades').hidden = !hayAvisosNuevos();
}

function filaAviso(ruta, icono, titulo, detalle, nuevo) {
  return (
    '<a class="noti__item" href="' + ruta + '">' +
      '<span class="noti__ico">' + icoAviso(AVISO_ICO[icono]) + '</span>' +
      '<span class="noti__txt"><strong>' + titulo + '</strong><small>' + detalle + '</small></span>' +
      (nuevo ? '<span class="noti__nuevo">Nuevo</span>' : '') +
    '</a>'
  );
}

function listaAvisos() {
  const filas = [];

  const obj = objetivosDelMes();
  if (obj.lista.length) {
    filas.push(filaAviso('#/inicio', 'diana',
      'Objetivos del mes asignados',
      obj.lista.length + (obj.lista.length === 1 ? ' objetivo de RRHH' : ' objetivos de RRHH'),
      vistos.hayNuevo('objetivos', mesActual())));
  }

  const edm = equipo.empleadosDelMes[0];
  if (edm) {
    filas.push(filaAviso('#/equipo', 'trofeo',
      'Empleado/a del mes: ' + edm.nombre, 'Reconocimiento del despacho',
      vistos.hayNuevo('empleado', edm.mes)));
  }

  if (equipo.ranking && equipo.ranking.actualizado) {
    filas.push(filaAviso('#/equipo', 'trofeo',
      'Ranking de formación actualizado', 'Publicado por RRHH',
      vistos.hayNuevo('ranking', equipo.ranking.actualizado)));
  }

  if (muroUltimaFecha) {
    filas.push(filaAviso('#/conecta', 'campana',
      'Movimiento en Conecta', 'Publicaciones del equipo',
      vistos.hayNuevo('muro', muroUltimaFecha)));
  }

  if (modelos.length && vistos.hayNuevo('modelos', modeloMasReciente())) {
    filas.push(filaAviso('#/modelos', 'documento',
      'Modelos de documentos actualizados',
      modelos.length + (modelos.length === 1 ? ' modelo disponible' : ' modelos disponibles'),
      true));
  }

  equipo.tablon.slice(0, 3).forEach((an) => {
    filas.push(filaAviso('#/equipo', 'calendario', an.titulo,
      formatearFecha(an.fecha), vistos.hayNuevo('tablon', an.fecha)));
  });

  novedades.slice(0, 3).forEach((nov) => {
    filas.push(filaAviso('#/novedades', 'campana', nov.titulo,
      formatearFecha(nov.fecha), novedadesVistas.hayNuevas(nov.fecha)));
  });

  return filas.length ? filas.join('') :
    '<p class="noti__vacio">No hay avisos todavía.</p>';
}

function iniciarNotificaciones() {
  const boton = $('#btn-noti');
  const panel = $('#noti-panel');
  const lista = $('#noti-lista');

  actualizarPuntoAvisos();

  const cerrar = () => {
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
  };

  boton.addEventListener('click', () => {
    if (!panel.hidden) { cerrar(); return; }
    lista.innerHTML = listaAvisos();
    panel.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    // Al abrir el panel, todo queda visto.
    if (novedades.length) novedadesVistas.marcarVistas(novedades[0].fecha);
    if (equipo.tablon.length) vistos.marcar('tablon', equipo.tablon[0].fecha);
    if (equipo.empleadosDelMes.length) vistos.marcar('empleado', equipo.empleadosDelMes[0].mes);
    if (equipo.ranking && equipo.ranking.actualizado) vistos.marcar('ranking', equipo.ranking.actualizado);
    if (objetivosDelMes().lista.length) vistos.marcar('objetivos', mesActual());
    if (modelos.length) vistos.marcar('modelos', modeloMasReciente());
    if (muroUltimaFecha) vistos.marcar('muro', muroUltimaFecha);
    actualizarPuntoAvisos();
  });

  document.addEventListener('click', (ev) => {
    if (!panel.hidden && !ev.target.closest('.noti')) cerrar();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !panel.hidden) cerrar();
  });
  panel.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) cerrar();
  });
}

/* ── Conecta ─────────────────────────────────────────────────── */
let muroPublicaciones = [];
let muroUltimaFecha = '';
let muroTipoElegido = 'sugerencia';
let muroFoto = null; // File elegido para la próxima publicación

function quitarFotoMuro() {
  muroFoto = null;
  const caja = $('#muro-adjunto');
  const img = $('#muro-adjunto-img');
  const campo = $('#muro-foto');
  if (img && img.src) { try { URL.revokeObjectURL(img.src); } catch (e) { /* nada */ } img.removeAttribute('src'); }
  if (caja) caja.hidden = true;
  if (campo) campo.value = '';
}

function elegirFotoMuro(campo) {
  const archivo = campo.files && campo.files[0];
  if (!archivo) return;
  if (archivo.size > 6 * 1024 * 1024) {
    avisar('La foto no puede superar los 6 MB.');
    campo.value = '';
    return;
  }
  muroFoto = archivo;
  const caja = $('#muro-adjunto');
  const img = $('#muro-adjunto-img');
  if (caja && img) {
    img.src = URL.createObjectURL(archivo);
    caja.hidden = false;
  }
}

function claveActual() {
  const a = autorMuro.de();
  return a ? a.clave : '';
}

/* El hilo mezcla publicaciones del equipo y anuncios oficiales,
   ordenados por fecha, y se pinta por páginas con scroll infinito. */
const FEED_PAGINA = 8;
let feedElementos = [];
let feedMostrados = 0;
let feedObservador = null;

function construirFeed() {
  const clave = claveActual();
  const publicaciones = muroPublicaciones.map((p) => ({
    fecha: p.fecha, html: piezaPublicacion(p, clave)
  }));
  const oficiales = elementosOficiales().map((o) => ({
    fecha: o.fecha, html: piezaOficial(o)
  }));
  feedElementos = publicaciones.concat(oficiales)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

function mostrarMasFeed() {
  const feed = $('#muro-feed');
  if (!feed || feedMostrados >= feedElementos.length) return;
  const trozo = feedElementos.slice(feedMostrados, feedMostrados + FEED_PAGINA);
  feed.insertAdjacentHTML('beforeend', trozo.map((e) => e.html).join(''));
  feedMostrados += trozo.length;
  const centinela = $('#muro-centinela');
  if (centinela) {
    centinela.textContent = feedMostrados < feedElementos.length ? '' : 'No hay nada más antiguo.';
  }
}

function pintarFeedMuro() {
  const feed = $('#muro-feed');
  if (!feed) return;
  construirFeed();
  if (!feedElementos.length) {
    feed.innerHTML = '<p class="objetivos__vacio" style="color:var(--tinta-3)">Todavía no hay nada. Estrena Conecta: una sugerencia, una idea, un agradecimiento…</p>';
    return;
  }
  feed.innerHTML = '';
  feedMostrados = 0;
  mostrarMasFeed();

  // Al acercarse al final, se carga la siguiente página sola.
  const centinela = $('#muro-centinela');
  if (feedObservador) feedObservador.disconnect();
  if (centinela && 'IntersectionObserver' in window) {
    feedObservador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) mostrarMasFeed();
    }, { rootMargin: '400px' });
    feedObservador.observe(centinela);
  }
}

async function cargarMuro() {
  const feed = $('#muro-feed');
  try {
    const r = await fetch('/api/muro');
    const datos = await r.json();
    if (!datos.ok) throw new Error(datos.error || 'respuesta no válida');
    muroPublicaciones = datos.publicaciones || [];
    muroUltimaFecha = muroPublicaciones.length ? muroPublicaciones[0].fecha : '';
    pintarFeedMuro();
    if (muroUltimaFecha) vistos.marcar('muro', muroUltimaFecha);
    actualizarPuntoAvisos();
  } catch (e) {
    if (feed) {
      feed.innerHTML = '<p class="objetivos__vacio" style="color:var(--tinta-3)">Conecta necesita el servidor de la plataforma. Arráncalo con <strong>npm run dev</strong> (o el archivo arrancar.bat) y recarga.</p>';
    }
  }
}

/* Solo para saber si hay publicaciones nuevas, al arrancar. */
async function sondearMuro() {
  try {
    const r = await fetch('/api/muro');
    const datos = await r.json();
    if (datos.ok && datos.publicaciones && datos.publicaciones.length) {
      muroUltimaFecha = datos.publicaciones[0].fecha;
      actualizarPuntoAvisos();
    }
  } catch (e) { /* sin servidor: el muro simplemente no avisa */ }
}

async function publicarEnMuro() {
  const texto = ($('#muro-texto') ? $('#muro-texto').value : '').trim();
  if (!texto && !muroFoto) { avisar('Escribe algo o adjunta una foto.'); return; }

  let autor = autorMuro.de();
  if (!autor) {
    const campo = $('#muro-nombre');
    const nombre = campo ? campo.value.trim() : '';
    if (!nombre) { avisar('Dinos tu nombre para publicar.'); if (campo) campo.focus(); return; }
    autorMuro.guardarNombre(nombre);
    autor = autorMuro.de();
  }

  try {
    // Primero la foto, si la hay; después la publicación que la referencia.
    let foto = '';
    if (muroFoto) {
      const rf = await fetch('/api/muro/foto?nombre=' + encodeURIComponent(muroFoto.name), {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: muroFoto
      });
      const datosFoto = await rf.json();
      if (!datosFoto.ok) { avisar(datosFoto.error || 'No se ha podido subir la foto.'); return; }
      foto = datosFoto.ruta;
    }

    const r = await fetch('/api/muro', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: autor.nombre, clave: autor.clave,
        tipo: muroTipoElegido, texto, foto
      })
    });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido publicar.'); return; }
    muroPublicaciones.unshift(datos.publicacion);
    muroUltimaFecha = datos.publicacion.fecha;
    vistos.marcar('muro', muroUltimaFecha);
    $('#muro-texto').value = '';
    quitarFotoMuro();
    pintarFeedMuro();
    avisar('Publicado en Conecta');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.');
  }
}

async function graciasEnMuro(id) {
  const autor = autorMuro.de();
  if (!autor) { avisar('Dinos tu nombre arriba para poder reaccionar.'); return; }
  try {
    const r = await fetch('/api/muro/gracias', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, clave: autor.clave })
    });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido reaccionar.'); return; }
    const i = muroPublicaciones.findIndex((p) => p.id === id);
    if (i !== -1) muroPublicaciones[i] = datos.publicacion;
    const pieza = document.getElementById('pub-' + id);
    if (pieza) pieza.outerHTML = piezaPublicacion(datos.publicacion, autor.clave);
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.');
  }
}

async function borrarDelMuro(id) {
  const autor = autorMuro.de();
  if (!autor) return;
  if (!confirm('¿Borrar tu publicación? No se puede deshacer.')) return;
  try {
    const r = await fetch('/api/muro?id=' + encodeURIComponent(id) +
      '&clave=' + encodeURIComponent(autor.clave), { method: 'DELETE' });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido borrar.'); return; }
    muroPublicaciones = muroPublicaciones.filter((p) => p.id !== id);
    pintarFeedMuro();
    avisar('Publicación borrada');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.');
  }
}

/* ── Progreso ────────────────────────────────────────────────── */
function actualizarProgreso() {
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  const pct = TOTAL_LECCIONES ? Math.round((hechas / TOTAL_LECCIONES) * 100) : 0;
  $('#prog-pct').textContent = pct + '%';
  $('#prog-barra').style.width = pct + '%';
  $('#prog-detalle').textContent =
    hechas + ' de ' + TOTAL_LECCIONES + ' lecciones completadas';
}

/* ── Interacción dentro de una vista ─────────────────────────── */
function iniciarDelegacion() {
  $('#vista').addEventListener('change', (ev) => {
    if (ev.target.id === 'muro-foto') elegirFotoMuro(ev.target);
  });

  $('#vista').addEventListener('click', (ev) => {
    const desplegar = ev.target.closest('[data-accion="desplegar"]');
    if (desplegar) {
      const art = desplegar.closest('.leccion');
      const cuerpo = art.querySelector('.leccion__cuerpo');
      const abierta = art.hasAttribute('open');
      if (abierta) { art.removeAttribute('open'); cuerpo.hidden = true; }
      else { art.setAttribute('open', ''); cuerpo.hidden = false; }
      desplegar.setAttribute('aria-expanded', String(!abierta));
      return;
    }

    const reproducir = ev.target.closest('[data-accion="reproducir"]');
    if (reproducir) {
      const marco = document.createElement('iframe');
      marco.src = reproducir.dataset.src;
      marco.title = reproducir.dataset.titulo || 'Vídeo';
      marco.loading = 'lazy';
      marco.allow = 'accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
      marco.allowFullscreen = true;
      marco.referrerPolicy = 'strict-origin-when-cross-origin';
      reproducir.replaceWith(marco);
      return;
    }

    const chipMuro = ev.target.closest('[data-tipo-muro]');
    if (chipMuro) {
      muroTipoElegido = chipMuro.dataset.tipoMuro;
      $$('#muro-chips .muro-chip').forEach((c) =>
        c.classList.toggle('muro-chip--activo', c === chipMuro));
      return;
    }

    const publicar = ev.target.closest('[data-accion="publicar-muro"]');
    if (publicar) { publicarEnMuro(); return; }

    const quitarFoto = ev.target.closest('[data-accion="quitar-foto-muro"]');
    if (quitarFoto) { quitarFotoMuro(); return; }

    const gracias = ev.target.closest('[data-accion="gracias-muro"]');
    if (gracias) { graciasEnMuro(gracias.dataset.id); return; }

    const borrarPub = ev.target.closest('[data-accion="borrar-muro"]');
    if (borrarPub) { borrarDelMuro(borrarPub.dataset.id); return; }

    const objetivo = ev.target.closest('[data-accion="objetivo"]');
    if (objetivo) {
      const hecho = objetivosHechos.alternar(objetivo.dataset.id);
      avisar(hecho ? 'Objetivo completado' : 'Objetivo pendiente de nuevo');
      const y = window.scrollY;
      pintar();
      window.scrollTo(0, y);
      return;
    }

    const marcar = ev.target.closest('[data-accion="marcar"]');
    if (marcar) {
      const clave = marcar.dataset.clave;
      const ahoraHecha = progreso.alternar(clave);
      avisar(ahoraHecha ? 'Lección marcada como completada' : 'Lección marcada como pendiente');

      const art = marcar.closest('.leccion');
      // Fuera de una lección (p. ej. una misión del onboarding): se
      // vuelve a pintar la vista entera conservando el desplazamiento.
      if (!art) {
        const y = window.scrollY;
        pintar();
        window.scrollTo(0, y);
        return;
      }
      art.classList.toggle('leccion--hecha', ahoraHecha);
      marcar.classList.toggle('btn--ok', !ahoraHecha);
      marcar.classList.toggle('btn--secundario', ahoraHecha);
      marcar.lastChild.textContent = ahoraHecha ? 'Marcar como pendiente' : 'Marcar como completada';

      actualizarProgreso();
      $('#lateral-nav').innerHTML = navegacionLateral(rutaActual());

      // Actualiza el contador de la cabecera del módulo.
      const mod = moduloPorId(clave.split('/')[0]);
      if (mod) {
        const claves = mod.lecciones.map((l) => mod.id + '/' + l.id);
        const n = progreso.contar(claves);
        const pastilla = document.querySelector('.pagina-cab__meta .pastilla--ok, .pagina-cab__meta .pastilla--info');
        if (pastilla) {
          pastilla.textContent = n + ' de ' + claves.length + ' completadas';
          pastilla.classList.toggle('pastilla--ok', n === claves.length);
          pastilla.classList.toggle('pastilla--info', n !== claves.length);
        }
      }
    }
  });
}

/* ── Buscador ────────────────────────────────────────────────── */
function iniciarBuscador() {
  const caja = $('#buscador');
  const input = $('#buscador-input');
  const salida = $('#buscador-resultados');
  let activo = -1;
  let resultados = [];

  const abrir = () => {
    caja.hidden = false;
    input.value = '';
    salida.innerHTML = '<p class="buscador__vacio">Escribe para buscar en los ' +
      TOTAL_LECCIONES + ' contenidos de la plataforma.</p>';
    activo = -1;
    resultados = [];
    setTimeout(() => input.focus(), 40);
  };
  const cerrar = () => { caja.hidden = true; };

  const pintarResultados = () => {
    const consulta = input.value.trim();
    if (consulta.length < 2) {
      salida.innerHTML = '<p class="buscador__vacio">Escribe al menos dos caracteres.</p>';
      resultados = [];
      return;
    }
    resultados = buscar(consulta, 20);
    const terminos = normalizar(consulta).split(/\s+/).filter((t) => t.length >= 2);

    if (!resultados.length) {
      salida.innerHTML = '<p class="buscador__vacio">Sin resultados para "' +
        consulta.replace(/[<>&]/g, '') + '".</p>';
      return;
    }
    activo = 0;
    salida.innerHTML = resultados.map((r, i) =>
      '<a class="res' + (i === 0 ? ' act' : '') + '" href="' + r.ruta + '" data-i="' + i + '">' +
        '<div class="res__ruta">' + r.contexto + '</div>' +
        '<div class="res__tit">' + resaltar(r.titulo, terminos) + '</div>' +
        '<div class="res__frag">' + resaltar(r.frag, terminos) + '</div>' +
      '</a>').join('');
  };

  const mover = (paso) => {
    if (!resultados.length) return;
    activo = (activo + paso + resultados.length) % resultados.length;
    $$('.res').forEach((el, i) => el.classList.toggle('act', i === activo));
    const el = salida.querySelector('.res.act');
    if (el) el.scrollIntoView({ block: 'nearest' });
  };

  $('#btn-buscar').addEventListener('click', abrir);
  $('#buscador-velo').addEventListener('click', cerrar);
  input.addEventListener('input', pintarResultados);

  salida.addEventListener('click', (ev) => {
    if (ev.target.closest('.res')) cerrar();
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); mover(1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); mover(-1); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      const el = salida.querySelector('.res.act');
      if (el) { location.hash = el.getAttribute('href'); cerrar(); }
      else if (input.value.trim().length >= 2) {
        location.hash = '#/buscar/' + encodeURIComponent(input.value.trim());
        cerrar();
      }
    } else if (ev.key === 'Escape') { cerrar(); }
  });

  document.addEventListener('keydown', (ev) => {
    const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (ev.key === '/' && !enCampo && $('#app').hidden === false) {
      ev.preventDefault();
      abrir();
    } else if ((ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      abrir();
    } else if (ev.key === 'Escape' && !caja.hidden) {
      cerrar();
    }
  });
}

/* ── Menú lateral en pantallas pequeñas ──────────────────────── */
function abrirLateral() {
  $('#lateral').classList.add('lateral--abierto');
  $('#lateral-velo').hidden = false;
  $('#btn-menu').setAttribute('aria-expanded', 'true');
}
function cerrarLateral() {
  $('#lateral').classList.remove('lateral--abierto');
  $('#lateral-velo').hidden = true;
  $('#btn-menu').setAttribute('aria-expanded', 'false');
}

/* ── Arranque de la aplicación ───────────────────────────────── */
function arrancarApp() {
  $('#app').hidden = false;
  $('#version-contenidos').textContent = VERSION;

  construirIndice();

  iniciarNotificaciones();
  sondearMuro();

  if (!almacenamientoDisponible()) {
    avisar('Tu navegador no guarda datos: el progreso no se conservará al cerrar.');
  }

  pintar();
  window.addEventListener('hashchange', pintar);

  $('#btn-menu').addEventListener('click', () => {
    const abierto = $('#lateral').classList.contains('lateral--abierto');
    if (abierto) cerrarLateral(); else abrirLateral();
  });
  $('#lateral-velo').addEventListener('click', cerrarLateral);
  $('#lateral').addEventListener('click', (ev) => {
    if (ev.target.closest('.nav-item')) cerrarLateral();
  });

  $('#btn-tema').addEventListener('click', () => tema.alternar());

  $('#btn-salir').addEventListener('click', () => {
    if (!confirm('¿Cerrar la sesión? Tu progreso se conserva en este equipo.')) return;
    sesion.cerrar();
    location.reload();
  });

  $('#btn-reiniciar').addEventListener('click', () => {
    if (!confirm('Se borrarán todas tus marcas de lecciones completadas. Esta acción no se puede deshacer. ¿Continuar?')) return;
    progreso.reiniciar();
    pintar();
    avisar('Progreso reiniciado');
  });
}

/* ── Punto de entrada ────────────────────────────────────────── */
function inicio() {
  tema.aplicar(tema.actual());
  iniciarDelegacion();
  iniciarBuscador();

  if (sesion.activa()) arrancarApp();
  else iniciarAcceso();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicio);
} else {
  inicio();
}
