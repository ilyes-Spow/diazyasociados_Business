/* ===============================================================
   app.js - Arranque, enrutador y control de la interfaz
   =============================================================== */

import { LECCIONES, TOTAL_LECCIONES, VERSION, moduloPorId } from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import { sesion, tema, progreso, novedadesVistas, almacenamientoDisponible } from './estado.js';
import { buscar, resaltar, normalizar, construirIndice } from './buscador.js';
import {
  vistaInicio, vistaModulo, vistaNovedades, vistaBusqueda,
  vistaNoEncontrada, navegacionLateral
} from './vistas.js';

/* Huella de la clave de acceso del despacho.
   Se compara el SHA-256 de la clave introducida, en minúsculas y
   sin espacios sobrantes. Para cambiarla, sustituye este valor por
   el hash de la nueva clave (ver README). */
const HUELLA_CLAVE = 'a4963c49961afb237b424cf89f69899c335dd77ec4681e9402c0040cd05b17c0';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ── Utilidades ──────────────────────────────────────────────── */
async function sha256(texto) {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

/* ── Puerta de acceso ────────────────────────────────────────── */
function iniciarPuerta() {
  const puerta = $('#puerta');
  const form = $('#puerta-form');
  const campo = $('#puerta-clave');
  const error = $('#puerta-error');
  const ver = $('#puerta-ver');

  puerta.hidden = false;
  setTimeout(() => campo.focus(), 120);

  ver.addEventListener('click', () => {
    campo.type = campo.type === 'password' ? 'text' : 'password';
    campo.focus();
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    error.hidden = true;

    const introducida = campo.value.trim().toLowerCase();
    if (!introducida) return;

    let coincide = false;
    try {
      coincide = (await sha256(introducida)) === HUELLA_CLAVE;
    } catch (e) {
      // Sin Web Crypto (contexto no seguro): no se puede validar.
      error.textContent = 'Este navegador no permite validar la clave. Accede por HTTPS o contacta con Coordinación.';
      error.hidden = false;
      return;
    }

    if (!coincide) {
      error.textContent = 'La clave no es correcta. Revísala e inténtalo de nuevo.';
      error.hidden = false;
      campo.value = '';
      campo.focus();
      form.classList.remove('puerta--sacude');
      void form.offsetWidth;
      form.classList.add('puerta--sacude');
      return;
    }

    sesion.abrir($('#puerta-recordar').checked);
    puerta.hidden = true;
    arrancarApp();
  });
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
  } else if (partes[0] === 'novedades') {
    html = vistaNovedades();
    if (novedades.length) {
      novedadesVistas.marcarVistas(novedades[0].fecha);
      $('#punto-novedades').hidden = true;
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

    const marcar = ev.target.closest('[data-accion="marcar"]');
    if (marcar) {
      const clave = marcar.dataset.clave;
      const ahoraHecha = progreso.alternar(clave);
      avisar(ahoraHecha ? 'Lección marcada como completada' : 'Lección marcada como pendiente');

      const art = marcar.closest('.leccion');
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

  if (novedades.length && novedadesVistas.hayNuevas(novedades[0].fecha)) {
    $('#punto-novedades').hidden = false;
  }

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
  else iniciarPuerta();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicio);
} else {
  inicio();
}
