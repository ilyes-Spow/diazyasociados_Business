/* ===============================================================
   app.js - Arranque, enrutador y control de la interfaz
   =============================================================== */

import { LECCIONES, TOTAL_LECCIONES, VERSION, moduloPorId } from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import equipo from '../../content/equipo.js';
import modelos from '../../content/modelos.js';
import administradores from '../../content/administradores.js';
import personas from '../../content/personas.js';
import {
  sesion, tema, progreso, novedadesVistas, vistos, objetivosHechos,
  autorMuro, almacenamientoDisponible, preferencias
} from './estado.js';
import { fijarPerfiles, fijarPerfil, perfilDe } from './perfiles.js';
import { buscar, resaltar, normalizar, construirIndice } from './buscador.js';
import { ico } from './iconos.js';
import {
  configurarIdentidad, registrarProgreso, subirProgreso, progresoRemoto,
  registrarVisualizacion, entregarExamen, misExamenes, actividadReciente,
  todoElProgreso, todasLasVisualizaciones, todosLosExamenes,
  misTickets, todosLosTickets, abrirTicket, cambiarEstadoTicket, responderTicket, valorarTicket,
  notaInternaTicket, ajustarTicket
} from './api.js';
import {
  vistaInicio, vistaModulo, vistaNovedades, vistaBusqueda,
  vistaNoEncontrada, vistaFormacion, vistaOnboarding, vistaEquipo,
  vistaModelos, vistaMuro, vistaMisObjetivos, vistaVideoteca, vistaPerfil, piezaPublicacion, piezaOficial,
  elementosOficiales, navegacionLateral, formatearFecha, objetivosDelMes,
  etiquetasDe, widgetTendencias, widgetActivos, REACCIONES_MURO, MURO_MAX, tonoDe,
  fijarModoAdmin, vistaSeguimiento, piezaActividad, piezaExamen, piezaResultadoExamen, estadoExamen, tiempoRelativo, fotoDe,
  vistaSoporte, ESTADOS_TICKET, CATEGORIAS_TICKET, URGENCIAS_TICKET
} from './vistas.js';
import { puntuacion, nombreMes } from './objetivos-calculo.js';

/* La API de seguimiento necesita saber quién es la persona actual. */
configurarIdentidad(() => autorMuro.de() || { clave: '', nombre: '' });

const escaparHtml = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
function ocultarAviso() {
  const el = $('#aviso');
  clearTimeout(temporizadorAviso);
  el.classList.remove('aviso--visible');
  setTimeout(() => { el.hidden = true; }, 300);
}

/* Aviso flotante. Con opciones.accion se añade un botón (p. ej.
   «Deshacer») y el aviso dura más. */
function avisar(mensaje, icono = 'tickCirculo', opciones = {}) {
  const el = $('#aviso');
  el.innerHTML = ico(icono);
  el.appendChild(document.createTextNode(mensaje));
  if (opciones.accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'aviso__accion';
    boton.textContent = opciones.accion;
    boton.addEventListener('click', () => { ocultarAviso(); if (opciones.alPulsar) opciones.alPulsar(); });
    el.appendChild(boton);
  }
  const duracion = opciones.duracion || (opciones.accion ? 9000 : 2600);
  el.style.setProperty('--aviso-duracion', duracion + 'ms');
  el.hidden = false;
  // Se quita y se vuelve a poner la clase para que la barra de
  // tiempo del aviso arranque de cero aunque ya hubiera uno visible.
  el.classList.remove('aviso--visible');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('aviso--visible')));
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(ocultarAviso, duracion);
}

/* Diálogo propio de confirmación, en lugar de los avisos del
   navegador. Devuelve true si la persona acepta. */
function confirmar(titulo, texto, opciones = {}) {
  const dlg = $('#dialogo');
  if (!dlg || typeof dlg.showModal !== 'function') return Promise.resolve(window.confirm(texto));
  return new Promise((resolver) => {
    const form = $('#dialogo-form');
    const si = $('#dialogo-si');
    const no = $('#dialogo-no');
    $('#dialogo-tit').textContent = titulo;
    $('#dialogo-txt').textContent = texto;
    $('#dialogo-ico').innerHTML = ico(opciones.icono || (opciones.peligro ? 'alerta' : 'info'));
    si.textContent = opciones.boton || 'Confirmar';
    si.className = 'btn ' + (opciones.peligro ? 'btn--peligro' : 'btn--oro');
    no.textContent = opciones.cancelar || 'Cancelar';
    dlg.classList.toggle('dialogo--peligro', Boolean(opciones.peligro));
    // Si el diálogo nace desde el menú del avatar, el menú se cierra.
    const menuPerfil = $('#perfil-menu');
    if (menuPerfil && !menuPerfil.hidden) { menuPerfil.hidden = true; $('#btn-perfil').setAttribute('aria-expanded', 'false'); }

    // Para lo irreversible: hay que escribir una palabra antes de
    // que el botón se active. Así no se acepta por inercia.
    const extra = $('#dialogo-extra');
    extra.innerHTML = '';
    si.disabled = false;
    let palabra = null;
    if (opciones.escribir) {
      extra.innerHTML =
        '<label class="dialogo__escribir"><span>Para confirmar, escribe <b>' + opciones.escribir + '</b></span>' +
          '<input type="text" id="dialogo-palabra" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + opciones.escribir + '"></label>' +
        (opciones.nota ? '<small class="dialogo__nota">' + opciones.nota + '</small>' : '');
      si.disabled = true;
      palabra = $('#dialogo-palabra');
      palabra.addEventListener('input', () => {
        si.disabled = palabra.value.trim().toUpperCase() !== opciones.escribir.toUpperCase();
      });
    } else if (opciones.nota) {
      extra.innerHTML = '<small class="dialogo__nota">' + opciones.nota + '</small>';
    }

    const cerrar = (valor) => {
      form.removeEventListener('submit', aceptar);
      no.removeEventListener('click', rechazar);
      dlg.removeEventListener('cancel', rechazar);
      dlg.removeEventListener('click', fuera);
      dlg.classList.add('dialogo--sale');
      setTimeout(() => { dlg.close(); dlg.classList.remove('dialogo--sale'); extra.innerHTML = ''; si.disabled = false; }, 160);
      resolver(valor);
    };
    const aceptar = (ev) => { ev.preventDefault(); if (si.disabled) return; cerrar(true); };
    const rechazar = (ev) => { if (ev) ev.preventDefault(); cerrar(false); };
    const fuera = (ev) => { if (ev.target === dlg) cerrar(false); };
    form.addEventListener('submit', aceptar);
    no.addEventListener('click', rechazar);
    dlg.addEventListener('cancel', rechazar);
    dlg.addEventListener('click', fuera);
    dlg.showModal();
    // En las acciones peligrosas el foco empieza en «Cancelar» (o en
    // el campo de la palabra, si lo hay).
    (palabra || (opciones.peligro ? no : si)).focus();
  });
}

/* Reiniciar el progreso: palabra de confirmación, aviso con
   «Deshacer» y copia que se puede restaurar desde Mi perfil. */
async function reiniciarProgresoConConfirmacion() {
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  if (!hechas) { avisar('No hay progreso que reiniciar.', 'info'); return; }
  const acepta = await confirmar(
    'Reiniciar tu progreso',
    'Se borrarán tus ' + hechas + (hechas === 1 ? ' lección completada' : ' lecciones completadas') +
      '. Tendrás unos segundos para deshacerlo y, después, podrás restaurar el último reinicio desde Mi perfil.',
    { boton: 'Reiniciar', peligro: true, escribir: 'REINICIAR', nota: 'Si quieres conservar una copia, descárgala antes desde Mi perfil.' });
  if (!acepta) return;
  const borradas = Object.keys(progreso.todo());
  progreso.reiniciar();
  // El servidor también lo olvida; si se deshace, se vuelve a subir.
  subirProgreso(Object.fromEntries(borradas.map((k) => [k, false])));
  actualizarProgreso();
  repintarEnSitio();
  avisar('Progreso reiniciado', 'alerta', {
    accion: 'Deshacer',
    alPulsar: () => {
      const n = progreso.deshacerReinicio();
      subirProgreso(Object.fromEntries(Object.keys(progreso.todo()).map((k) => [k, true])));
      actualizarProgreso();
      repintarEnSitio();
      avisar(n ? 'Progreso recuperado: ' + n + (n === 1 ? ' lección' : ' lecciones') : 'No había nada que recuperar.');
    }
  });
}

function deshacerUltimoReinicio() {
  const n = progreso.deshacerReinicio();
  if (n) subirProgreso(Object.fromEntries(Object.keys(progreso.todo()).map((k) => [k, true])));
  actualizarProgreso();
  repintarEnSitio();
  avisar(n ? 'Progreso recuperado: ' + n + (n === 1 ? ' lección' : ' lecciones') : 'No hay ningún reinicio que recuperar.');
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
  // Si hay personas dadas de alta en el panel, mandan ellas: solo
  // entran las activas. Las listas de abajo quedan como respaldo.
  const activas = personas.filter((p) => p && p.activo !== false);
  if (activas.length) return activas.some((p) => String(p.correo || '').toLowerCase() === c);
  if (CORREOS_PERMITIDOS.length) {
    return CORREOS_PERMITIDOS.some((p) => p.toLowerCase() === c);
  }
  if (DOMINIO_PERMITIDO) return c.endsWith('@' + DOMINIO_PERMITIDO.toLowerCase());
  return true;
}

function entrarEnApp() {
  const acceso = $('#acceso');
  const app = $('#app');
  // La pantalla de acceso se desvanece mientras baja la cabecera.
  acceso.classList.add('acceso--saliendo');
  app.classList.add('app--entrando');
  arrancarApp();
  setTimeout(() => {
    acceso.hidden = true;
    acceso.classList.remove('acceso--saliendo');
    app.classList.remove('app--entrando');
  }, 650);
}

const sinMovimiento = () =>
  Boolean((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    document.documentElement.classList.contains('menos-movimiento'));

/* Vida de la pantalla de acceso: entrada escalonada, título palabra
   a palabra, partículas doradas e inclinación del logotipo. */
function animarAcceso() {
  // Las piezas entran escalonadas; al terminar cada animación se
  // retira la clase para que el logotipo pueda inclinarse libremente.
  const reveladas = $$('.acceso__revela');
  reveladas.forEach((el) => {
    el.addEventListener('animationend', (ev) => {
      if (ev.target === el && !ev.pseudoElement) el.classList.remove('acceso__revela');
    });
  });
  // Red de seguridad: pase lo que pase, a los tres segundos todo visible.
  setTimeout(() => reveladas.forEach((el) => el.classList.remove('acceso__revela')), 3000);

  const titulo = $('#acceso-titulo');
  if (titulo && !titulo.querySelector('.palabra')) {
    const palabras = titulo.textContent.trim().split(/\s+/);
    titulo.innerHTML = palabras.map((p, i) =>
      '<span class="palabra' + (i === palabras.length - 1 ? ' palabra--oro' : '') +
        '" style="--p:' + i + '"><span>' + p.replace(/[<>&]/g, '') + '</span></span>'
    ).join(' ');
  }

  if (sinMovimiento()) return;

  const capa = $('#acceso-particulas');
  if (capa && !capa.childElementCount) {
    let html = '';
    for (let i = 0; i < 26; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;--t:' +
        (2 + Math.random() * 4).toFixed(1) + 'px;--d:' + (9 + Math.random() * 12).toFixed(1) +
        's;--r:-' + (Math.random() * 18).toFixed(1) + 's;--x:' +
        (Math.random() * 120 - 60).toFixed(0) + 'px"></i>';
    }
    capa.innerHTML = html;
  }

  const logo = $('#acceso-logo');
  const caja = $('#acceso-caja');
  if (logo && caja && matchMedia('(hover: hover)').matches) {
    caja.addEventListener('mousemove', (ev) => {
      const r = logo.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (ev.clientY - (r.top + r.height / 2)) / r.height;
      logo.style.setProperty('--ry', (dx * 14).toFixed(2) + 'deg');
      logo.style.setProperty('--rx', (-dy * 14).toFixed(2) + 'deg');
    });
    caja.addEventListener('mouseleave', () => {
      logo.style.setProperty('--ry', '0deg');
      logo.style.setProperty('--rx', '0deg');
    });
  }
}

function iniciarAcceso() {
  const acceso = $('#acceso');
  const boton = $('#acceso-entrar');
  const error = $('#acceso-error');
  acceso.hidden = false;
  animarAcceso();

  // Sin identificador de cliente todavía: la pantalla se muestra igual
  // y el botón abre un selector con las personas dadas de alta (como
  // el de Google), o entra directamente si no hay ninguna.
  if (!CLIENTE_GOOGLE) {
    boton.hidden = false;
    boton.addEventListener('click', () => {
      const cuentas = personas.filter((p) => p && p.activo !== false && p.correo);
      if (!cuentas.length) { sesion.abrir({}); entrarEnApp(); return; }
      mostrarSelectorCuentas(cuentas);
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
        // El nombre que puso el despacho en el panel manda sobre el de Google.
        const persona = personas.find((p) => String(p.correo || '').toLowerCase() === String(datos.email).toLowerCase());
        sesion.abrir({ correo: datos.email, nombre: (persona && persona.nombre) || datos.name || '' });
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

/* Selector de cuentas para cuando Google no está configurado: las
   personas dadas de alta en el panel, con su papel. Permite probar
   la plataforma tal y como la verá cada perfil. */
function mostrarSelectorCuentas(cuentas) {
  const caja = $('#acceso-cuentas');
  const boton = $('#acceso-entrar');
  const iniciales = (nombre) => String(nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
  caja.innerHTML =
    '<p class="acceso__cuentas-tit">Elige una cuenta</p>' +
    cuentas.map((p, i) => {
      const correo = String(p.correo).toLowerCase();
      return (
        '<button type="button" class="acceso__cuenta" data-correo="' + escaparHtml(correo) + '" style="--i:' + i + ';--h:' + tonoDe(correo) + '">' +
          '<span class="acceso__cuenta-avatar">' + (p.foto ? '<img src="' + escaparHtml(p.foto) + '" alt="">' : escaparHtml(iniciales(p.nombre))) + '</span>' +
          '<span class="acceso__cuenta-txt"><strong>' + escaparHtml(p.nombre) + '</strong>' +
            '<small>' + escaparHtml(correo) + (p.puesto ? ' · ' + escaparHtml(p.puesto) : '') + '</small></span>' +
          (p.rol === 'administracion' ? '<span class="acceso__cuenta-rol">Dirección</span>' : '') +
        '</button>'
      );
    }).join('') +
    '<button type="button" class="acceso__cuenta acceso__cuenta--otra" data-correo="" style="--i:' + cuentas.length + '">' +
      '<span class="acceso__cuenta-avatar acceso__cuenta-avatar--otra">' + ico('perfil') + '</span>' +
      '<span class="acceso__cuenta-txt"><strong>Usar otra cuenta</strong><small>Entrar como invitado, sin ficha</small></span>' +
    '</button>';
  boton.hidden = true;
  caja.hidden = false;
  caja.addEventListener('click', (ev) => {
    const b = ev.target.closest('.acceso__cuenta');
    if (!b) return;
    const persona = cuentas.find((p) => String(p.correo).toLowerCase() === b.dataset.correo);
    sesion.abrir(persona ? { correo: b.dataset.correo, nombre: persona.nombre } : {});
    entrarEnApp();
  }, { once: true });
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
  detenerSondeoMuro();
  // Al cambiar de pantalla se cierra el menú del avatar si estaba abierto.
  const menuPerfil = $('#perfil-menu');
  if (menuPerfil && !menuPerfil.hidden) { menuPerfil.hidden = true; $('#btn-perfil').setAttribute('aria-expanded', 'false'); }

  let html;
  if (!partes.length || partes[0] === 'inicio') {
    html = vistaInicio({ actividad: actividadCache });
    cargarActividad();
  } else if (partes[0] === 'modulo') {
    html = vistaModulo(partes[1], partes[2], { admin: esAdministrador(), intentos: examenesCache });
  } else if (partes[0] === 'seguimiento') {
    html = esAdministrador() ? vistaSeguimiento(seguimientoCache || { cargando: true }) : vistaNoEncontrada();
    if (esAdministrador()) cargarSeguimiento();
  } else if (partes[0] === 'soporte') {
    html = vistaSoporte({
      ...(soporteCache || { mios: [], todos: null, cargado: false }),
      admin: esAdministrador(), miClave: (autorMuro.de() || {}).clave || '',
      filtro: soporteFiltro, tipo: soporteTipo, orden: soporteOrden, busqueda: soporteBusqueda
    });
    cargarSoporte();
    setTimeout(aplicarBusquedaTickets, 0);
  } else if (partes[0] === 'formacion') {
    html = vistaFormacion();
  } else if (partes[0] === 'videos') {
    html = vistaVideoteca();
  } else if (partes[0] === 'onboarding') {
    html = vistaOnboarding();
  } else if (partes[0] === 'perfil') {
    html = vistaPerfil();
  } else if (partes[0] === 'objetivos') {
    html = vistaMisObjetivos();
    const obj = objetivosDelMes();
    if (obj.mes) {
      vistos.marcar('objetivos', obj.mes);
      actualizarPuntoAvisos();
    }
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
    html = vistaEquipo(partes[1] || '');
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
  prepararVista(vista);
  $('#lateral-nav-lista').innerHTML = navegacionLateral(ruta, insigniasNav());
  moverIndicadorLateral();
  actualizarProgreso();
  cerrarLateral();

  // Sección activa en la navegación superior: cuatro entradas que
  // agrupan las pantallas (Formación, Despacho, Conecta e Inicio).

  // La barra de lectura de la cabecera solo tiene sentido dentro de un módulo.
  $('#app').classList.toggle('app--leyendo', partes[0] === 'modulo');
  // En un módulo, el índice lateral se coloca sobre el módulo abierto.
  const moduloActivo = $('#lateral-nav .nav-item--modulo[aria-current="page"]');
  if (moduloActivo) moduloActivo.scrollIntoView({ block: 'nearest' });
  actualizarLectura();

  animarContadores();

  if (partes[0] === 'conecta' || partes[0] === 'muro') cargarMuro();

  // Desplazamiento a la lección abierta, o al principio.
  if (partes[0] === 'modulo' && partes[2]) {
    const el = document.getElementById('lec-' + partes[2]);
    if (el) { desplazarA(el); return; }
  }
  window.scrollTo(0, 0);
}

/* Números que suben hasta su valor al pintar la vista. */
function animarContadores() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('[data-contar]').forEach((el) => {
    const fin = Number(el.dataset.contar) || 0;
    const sufijo = el.dataset.sufijo || '';
    const decimales = Number(el.dataset.decimales) || 0;
    const duracion = decimales ? 1100 : 750;
    const inicio = performance.now();
    const formato = (v, exacto) => decimales
      ? v.toLocaleString('es-ES', { minimumFractionDigits: exacto ? 0 : decimales, maximumFractionDigits: decimales })
      : String(Math.round(v));
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / duracion);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = formato(p < 1 ? fin * suave : fin, p >= 1) + sufijo;
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

/* ── Movimiento de la interfaz ───────────────────────────────── */

/* Qué bloques se revelan al entrar en pantalla y qué tarjetas
   llevan el foco luminoso que sigue al ratón. */
const SELECTOR_REVELAR = [
  '.itin-grupo', '.leccion', '.nov', '.tab-anuncio', '.edm-mini', '.rk-fila',
  '.paso', '.reto', '.descubre__tarjeta', '.sede', '.obj-mes', '.modelo',
  '.mod-grupo > .seccion-tit', '.sedes-bloque > .seccion-tit',
  '.descubre > .seccion-tit', '.rk > .seccion-tit'
].join(',');
const SELECTOR_LUZ =
  '.itin-mod,.nov-tarjeta,.acceso-rapido,.modelo,.descubre__tarjeta,.edm-mini,.tab-anuncio,.tarjeta,.paso__enl,.obj-mes';

let observadorRevelado = null;

function prepararVista(vista) {
  vista.querySelectorAll(SELECTOR_LUZ).forEach((el) => el.classList.add('luz'));

  if (!('IntersectionObserver' in window) || sinMovimiento()) return;
  if (observadorRevelado) observadorRevelado.disconnect();
  observadorRevelado = new IntersectionObserver((entradas, obs) => {
    let n = 0;
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const retardo = Math.min(n++, 8) * 60;
      el.style.setProperty('--retardo', retardo + 'ms');
      el.classList.add('revelar--visto');
      obs.unobserve(el);
      // Una vez visible, el bloque recupera sus transiciones propias.
      setTimeout(() => el.classList.remove('revelar', 'revelar--visto'), retardo + 700);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  vista.querySelectorAll(SELECTOR_REVELAR).forEach((el) => {
    el.classList.add('revelar');
    observadorRevelado.observe(el);
  });
}

/* El foco luminoso: posición del ratón dentro de la tarjeta. */
function iniciarFocoLuminoso() {
  $('#vista').addEventListener('mousemove', (ev) => {
    const el = ev.target.closest('.luz');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
    el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
  }, { passive: true });
}

/* Pastilla que se desliza hasta la sección activa del menú. */
/* Barra de lectura: cuánto del módulo se ha recorrido. */
function actualizarLectura() {
  const el = $('#lectura');
  if (!el) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  el.style.setProperty('--lectura', p.toFixed(4));
}

/* Onda que nace donde se pulsa un botón. */
function iniciarOndas() {
  document.addEventListener('click', (ev) => {
    const boton = ev.target.closest('.btn, .icono-btn, .muro-chip, .acceso__boton');
    if (!boton || boton.disabled || sinMovimiento()) return;
    const r = boton.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const teclado = ev.clientX === 0 && ev.clientY === 0;
    const x = teclado ? r.width / 2 : ev.clientX - r.left;
    const y = teclado ? r.height / 2 : ev.clientY - r.top;
    const onda = document.createElement('span');
    onda.className = 'onda';
    onda.style.width = onda.style.height = d + 'px';
    onda.style.left = (x - d / 2) + 'px';
    onda.style.top = (y - d / 2) + 'px';
    boton.appendChild(onda);
    setTimeout(() => onda.remove(), 650);
  });
}

/* Confeti que sale del elemento indicado. */
function celebrar(origen, cantidad = 22) {
  const capa = $('#confeti');
  if (!capa || !origen || sinMovimiento()) return;
  const r = origen.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const colores = ['#c9a227', '#dcbb4e', '#1b3a5c', '#2a5580', '#ffffff', '#1f7a4d'];
  let html = '';
  for (let i = 0; i < cantidad; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 130;
    html += '<i style="--x:' + cx.toFixed(0) + 'px;--y:' + cy.toFixed(0) + 'px;--c:' + colores[i % colores.length] +
      ';--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * dist - 50).toFixed(0) +
      'px;--t:' + (5 + Math.random() * 6).toFixed(0) + 'px;--br:' + (Math.random() > 0.5 ? '50%' : '2px') +
      ';--rot:' + (Math.random() * 720 - 360).toFixed(0) + 'deg;--d:' + (0.7 + Math.random() * 0.5).toFixed(2) + 's"></i>';
  }
  const lote = document.createElement('span');
  lote.innerHTML = html;
  capa.appendChild(lote);
  setTimeout(() => lote.remove(), 1500);
}

/* Los iconos de la cabecera y el buscador se pintan desde el juego
   de iconos, para que index.html no los duplique. */
function pintarIconosFijos() {
  $$('[data-ico]').forEach((el) => {
    const nombres = el.dataset.ico.split(/\s+/).filter(Boolean);
    el.insertAdjacentHTML('afterbegin', nombres.map((n) => ico(n)).join(''));
  });
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
const modeloMasReciente = () =>
  modelos.map((m) => m.actualizado || '').sort().pop() || '';

function hayAvisosNuevos() {
  // Cada persona elige en su perfil qué enciende la campana.
  const quiere = preferencias.todas().avisos;
  if (quiere.novedades && novedades.length && novedadesVistas.hayNuevas(novedades[0].fecha)) return true;
  if (quiere.equipo && equipo.tablon.length && vistos.hayNuevo('tablon', equipo.tablon[0].fecha)) return true;
  if (quiere.equipo && equipo.empleadosDelMes.length && vistos.hayNuevo('empleado', equipo.empleadosDelMes[0].mes)) return true;
  if (quiere.equipo && equipo.ranking && equipo.ranking.actualizado && vistos.hayNuevo('ranking', equipo.ranking.actualizado)) return true;
  const obj = objetivosDelMes();
  if (quiere.objetivos && obj.mes && vistos.hayNuevo('objetivos', obj.mes)) return true;
  if (quiere.modelos && modelos.length && vistos.hayNuevo('modelos', modeloMasReciente())) return true;
  if (quiere.conecta && muroUltimaFecha && vistos.hayNuevo('muro', muroUltimaFecha)) return true;
  if (quiere.actividad !== false && actividadCache && actividadCache[0] && vistos.hayNuevo('actividad', actividadCache[0].fecha)) return true;
  const t = avisosTickets();
  if (t.informatica && vistos.hayNuevo('tickets-it', t.informatica.fecha)) return true;
  if (t.mio && vistos.hayNuevo('tickets', t.mio.fecha)) return true;
  return false;
}

/* Qué hay que avisar de los tickets: a informática, los abiertos; a
   cada persona, el último suyo que ha movido informática. */
function avisosTickets() {
  const r = { informatica: null, mio: null };
  if (!soporteCache) return r;
  const abiertos = (soporteCache.todos || []).filter((t) => t.estado !== 'resuelto');
  if (abiertos.length) {
    const fecha = abiertos.map((t) => t.actualizado || t.fecha).sort().pop();
    r.informatica = { cantidad: abiertos.length, fecha, ultimo: abiertos.slice().sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)))[0] };
  }
  const miClave = (autorMuro.de() || {}).clave || '';
  const movidos = (soporteCache.mios || []).filter((t) =>
    t.estado !== 'pendiente' || (t.mensajes || []).some((m) => m.informatica));
  if (movidos.length) {
    const ultimo = movidos.slice().sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)))[0];
    // Si lo último que pasó en el ticket lo hizo la propia persona, no hay nada nuevo que avisar.
    const ultimoMensaje = (ultimo.mensajes || []).slice(-1)[0];
    const ultimoCambio = (ultimo.historial || []).slice(-1)[0];
    const propio = ultimoMensaje && ultimoMensaje.clave === miClave && (!ultimoCambio || String(ultimoMensaje.fecha) > String(ultimoCambio.fecha));
    r.mio = { ticket: ultimo, fecha: propio ? '' : (ultimo.actualizado || ultimo.fecha) };
  }
  return r;
}

const ICONO_AVISO_ACTIVIDAD = {
  modulo: 'trofeo', examen: 'escudo', muro: 'conecta', respuesta: 'conecta', formacion: 'formacion',
  video: 'video', novedad: 'novedades', reconocimiento: 'medalla', cumple: 'pastel', comunicado: 'campana'
};

function actualizarPuntoAvisos() {
  $('#punto-novedades').hidden = !hayAvisosNuevos();
}

function filaAviso(ruta, icono, titulo, detalle, nuevo) {
  return (
    '<a class="noti__item" href="' + ruta + '">' +
      '<span class="noti__ico">' + ico(icono) + '</span>' +
      '<span class="noti__txt"><strong>' + titulo + '</strong><small>' + detalle + '</small></span>' +
      (nuevo ? '<span class="noti__nuevo">Nuevo</span>' : '') +
    '</a>'
  );
}

function listaAvisos() {
  const filas = [];

  // Tickets de informática: la bandeja (administración) y los propios.
  const t = avisosTickets();
  if (t.informatica) {
    filas.push(filaAviso('#/soporte', 'soporte',
      t.informatica.cantidad + (t.informatica.cantidad === 1 ? ' ticket de informática abierto' : ' tickets de informática abiertos'),
      'Último: #' + t.informatica.ultimo.numero + ' ' + escaparHtml(t.informatica.ultimo.titulo),
      vistos.hayNuevo('tickets-it', t.informatica.fecha)));
  }
  if (t.mio) {
    const e = ESTADOS_TICKET[t.mio.ticket.estado] || ESTADOS_TICKET.pendiente;
    filas.push(filaAviso('#/soporte', 'soporte',
      'Tu ticket #' + t.mio.ticket.numero + ': ' + e.texto.toLowerCase(),
      escaparHtml(t.mio.ticket.titulo) + (t.mio.ticket.estado === 'resuelto' && !t.mio.ticket.encuesta ? ' · valora la atención' : ''),
      Boolean(t.mio.fecha) && vistos.hayNuevo('tickets', t.mio.fecha)));
  }

  // Lo que pasa en la plataforma (servidor): lo más reciente, arriba.
  if (preferencias.todas().avisos.actividad !== false) {
    (actividadCache || []).slice(0, 5).forEach((ev) => {
      filas.push(filaAviso(ev.ruta || '#/inicio', ICONO_AVISO_ACTIVIDAD[ev.tipo] || 'chispa',
        escaparHtml(ev.texto), tiempoRelativo(ev.fecha), vistos.hayNuevo('actividad', ev.fecha)));
    });
  }

  const obj = objetivosDelMes();
  if (obj.mes && obj.calculo) {
    filas.push(filaAviso('#/objetivos', 'diana',
      'Resultados de objetivos: ' + nombreMes(obj.mes, false),
      puntuacion(obj.calculo.total) + ' de ' + puntuacion(obj.calculo.maximo) + ' puntos' +
        (obj.puesto ? ' · ' + obj.puesto.puesto + 'º de ' + obj.puesto.de : ''),
      vistos.hayNuevo('objetivos', obj.mes)));
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
    filas.push(filaAviso('#/conecta', 'conecta',
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
    filas.push(filaAviso('#/novedades', 'novedades', nov.titulo,
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
    const objMes = objetivosDelMes().mes;
    if (objMes) vistos.marcar('objetivos', objMes);
    if (modelos.length) vistos.marcar('modelos', modeloMasReciente());
    if (muroUltimaFecha) vistos.marcar('muro', muroUltimaFecha);
    if (actividadCache && actividadCache[0]) vistos.marcar('actividad', actividadCache[0].fecha);
    const t = avisosTickets();
    if (t.informatica) vistos.marcar('tickets-it', t.informatica.fecha);
    if (t.mio && t.mio.fecha) vistos.marcar('tickets', t.mio.fecha);
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
let muroFoto = null;          // File elegido para la próxima publicación
let muroPestana = 'todo';     // Para ti · Equipo · Oficial · Encuestas
let muroEtiqueta = '';        // #etiqueta activa como filtro
let muroSondeo = null;        // temporizador del sondeo en directo
let muroPendientes = null;    // lista más reciente, a la espera de que se pida

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
    avisar('La foto no puede superar los 6 MB.', 'alerta');
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

/* ¿La sesión actual tiene papel de administración? Con Google
   activo se decide por el correo; en desarrollo (sin Google) se
   asume que quien tiene el proyecto en su equipo es quien
   administra, así que el acceso al panel se muestra siempre. */
function esAdministrador() {
  const u = sesion.usuario() || {};
  const correo = (u.correo || '').toLowerCase();
  if (correo) return administradores.includes(correo);
  // Con personas dadas de alta, quien entra sin cuenta es invitado; sin
  // ninguna (proyecto recién creado) se mantiene el modo de desarrollo.
  const hayPersonas = personas.some((p) => p && p.activo !== false && p.correo);
  return !CLIENTE_GOOGLE && !hayPersonas;
}

/* El hilo mezcla publicaciones del equipo y anuncios oficiales,
   ordenados por fecha, y se pinta por páginas con scroll infinito. */
const FEED_PAGINA = 8;
let feedElementos = [];
let feedMostrados = 0;
let feedObservador = null;

function pasaFiltroMuro(elemento, oficial) {
  if (muroPestana === 'equipo' && oficial) return false;
  if (muroPestana === 'oficial' && !oficial) return false;
  if (muroPestana === 'encuesta' && (oficial || elemento.tipo !== 'encuesta')) return false;
  if (muroEtiqueta) {
    const texto = oficial ? elemento.titulo + ' ' + (elemento.detalle || '') : elemento.texto;
    if (!etiquetasDe(texto).includes(muroEtiqueta)) return false;
  }
  return true;
}

function construirFeed() {
  const clave = claveActual();
  const moderador = esAdministrador();
  const publicaciones = muroPublicaciones
    .filter((p) => pasaFiltroMuro(p, false))
    .map((p) => ({ fecha: p.fecha, html: piezaPublicacion(p, clave, moderador) }));
  const oficiales = elementosOficiales()
    .filter((o) => pasaFiltroMuro(o, true))
    .map((o) => ({ fecha: o.fecha, html: piezaOficial(o) }));
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

function textoVacioMuro() {
  if (muroEtiqueta) return 'Nada con esa etiqueta todavía. Sé quien la estrene.';
  if (muroPestana === 'encuesta') return 'Todavía no hay encuestas. Crea la primera con el icono de gráfica del redactor.';
  if (muroPestana === 'oficial') return 'No hay anuncios oficiales todavía.';
  return 'Todavía no hay nada. Estrena Conecta: una idea, una pregunta, un agradecimiento…';
}

function pintarFeedMuro() {
  const feed = $('#muro-feed');
  if (!feed) return;
  construirFeed();

  const filtro = $('#muro-filtro');
  if (filtro) {
    filtro.hidden = !muroEtiqueta;
    if (muroEtiqueta) {
      filtro.innerHTML = ico('buscar') + '<span>Viendo <strong>#' + muroEtiqueta.replace(/[<>&"]/g, '') +
        '</strong></span><button type="button" data-accion="quitar-etiqueta-muro">Quitar filtro &times;</button>';
    }
  }

  const centinela = $('#muro-centinela');
  if (!feedElementos.length) {
    feed.innerHTML = '<p class="muro-vacio">' + textoVacioMuro() + '</p>';
    if (centinela) centinela.textContent = '';
    return;
  }
  feed.innerHTML = '';
  feedMostrados = 0;
  mostrarMasFeed();

  // Al acercarse al final, se carga la siguiente página sola.
  if (feedObservador) feedObservador.disconnect();
  if (centinela && 'IntersectionObserver' in window) {
    feedObservador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) mostrarMasFeed();
    }, { rootMargin: '400px' });
    feedObservador.observe(centinela);
  }
}

function pintarLateralMuro() {
  const t = $('#widget-tendencias');
  if (t) t.innerHTML = widgetTendencias(muroPublicaciones);
  const a = $('#widget-activos');
  if (a) a.innerHTML = widgetActivos(muroPublicaciones);
}

function marcarPestanaMuro() {
  $$('[data-pestana-muro]').forEach((b) =>
    b.classList.toggle('conecta__pestana--activa', b.dataset.pestanaMuro === muroPestana));
}

function filtrarEtiquetaMuro(etiqueta) {
  muroEtiqueta = String(etiqueta || '').toLowerCase();
  muroPestana = 'todo';
  marcarPestanaMuro();
  pintarFeedMuro();
  const cabecera = $('#conecta-pestanas');
  if (cabecera) desplazarA(cabecera);
}

function detenerSondeoMuro() {
  if (muroSondeo) { clearInterval(muroSondeo); muroSondeo = null; }
  muroPendientes = null;
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
    pintarLateralMuro();
    actualizarContadorMuro();
    if (muroUltimaFecha) vistos.marcar('muro', muroUltimaFecha);
    actualizarPuntoAvisos();
    // Mientras se está en Conecta se mira cada medio minuto si hay
    // publicaciones nuevas de otras personas.
    detenerSondeoMuro();
    muroSondeo = setInterval(sondearNuevasMuro, 30000);
  } catch (e) {
    if (feed) {
      feed.innerHTML = '<p class="muro-vacio">Conecta necesita el servidor de la plataforma. Arráncalo con <strong>npm run dev</strong> (o el archivo arrancar.bat) y recarga.</p>';
    }
  }
}

async function sondearNuevasMuro() {
  if (!$('#muro-feed')) { detenerSondeoMuro(); return; }
  try {
    const r = await fetch('/api/muro');
    const datos = await r.json();
    if (!datos.ok) return;
    const lista = datos.publicaciones || [];
    const mia = claveActual();
    const nuevas = lista.filter((p) => p.fecha > muroUltimaFecha && p.clave !== mia).length;
    muroPendientes = lista;
    const aviso = $('#muro-nuevas');
    if (aviso && nuevas) {
      aviso.querySelector('span').textContent =
        nuevas === 1 ? 'Hay 1 publicación nueva' : 'Hay ' + nuevas + ' publicaciones nuevas';
      aviso.hidden = false;
    }
  } catch (e) { /* sin servidor: no pasa nada */ }
}

function cargarNuevasMuro() {
  if (muroPendientes) {
    muroPublicaciones = muroPendientes;
    muroUltimaFecha = muroPublicaciones.length ? muroPublicaciones[0].fecha : '';
    if (muroUltimaFecha) vistos.marcar('muro', muroUltimaFecha);
  }
  const aviso = $('#muro-nuevas');
  if (aviso) aviso.hidden = true;
  pintarFeedMuro();
  pintarLateralMuro();
  actualizarPuntoAvisos();
  const feed = $('#muro-feed');
  if (feed) desplazarA(feed);
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

/* ── Redactor ────────────────────────────────────────────────── */
function actualizarContadorMuro() {
  const campo = $('#muro-texto');
  const contador = $('#muro-contador');
  if (!campo || !contador) return;
  const n = campo.value.length;
  const restan = MURO_MAX - n;
  contador.style.setProperty('--p', String(Math.min(100, Math.round((n / MURO_MAX) * 100))));
  contador.querySelector('b').textContent = restan;
  contador.classList.toggle('contador--limite', restan <= 40);
  campo.style.height = 'auto';
  campo.style.height = Math.min(320, campo.scrollHeight) + 'px';
}

function insertarEmojiMuro(emoji) {
  const campo = $('#muro-texto');
  if (!campo) return;
  const ini = typeof campo.selectionStart === 'number' ? campo.selectionStart : campo.value.length;
  const fin = typeof campo.selectionEnd === 'number' ? campo.selectionEnd : ini;
  campo.value = campo.value.slice(0, ini) + emoji + campo.value.slice(fin);
  campo.focus();
  campo.selectionStart = campo.selectionEnd = ini + emoji.length;
  actualizarContadorMuro();
}

function alternarEncuestaMuro(forzar) {
  const editor = $('#encuesta-editor');
  if (!editor) return;
  const abrir = typeof forzar === 'boolean' ? forzar : editor.hidden;
  editor.hidden = !abrir;
  if (abrir) {
    const primera = editor.querySelector('input');
    if (primera) primera.focus();
  } else {
    $$('#encuesta-opciones input').forEach((campo, i) => { if (i >= 2) campo.remove(); else campo.value = ''; });
  }
}

function anadirOpcionEncuesta() {
  const caja = $('#encuesta-opciones');
  if (!caja) return;
  const n = caja.children.length;
  if (n >= 4) { avisar('Una encuesta tiene como mucho cuatro opciones.', 'alerta'); return; }
  caja.insertAdjacentHTML('beforeend',
    '<input type="text" class="encuesta-editor__opcion" maxlength="60" placeholder="Opción ' + (n + 1) + '">');
  caja.lastElementChild.focus();
}

function datosEncuestaRedactor() {
  const editor = $('#encuesta-editor');
  if (!editor || editor.hidden) return null;
  return { opciones: $$('#encuesta-opciones input').map((i) => i.value.trim()).filter(Boolean) };
}

async function publicarEnMuro() {
  const texto = ($('#muro-texto') ? $('#muro-texto').value : '').trim();
  const encuesta = datosEncuestaRedactor();
  if (encuesta && encuesta.opciones.length < 2) {
    avisar('Una encuesta necesita al menos dos opciones.', 'alerta');
    return;
  }
  if (!texto && !muroFoto && !encuesta) { avisar('Escribe algo, adjunta una foto o crea una encuesta.', 'alerta'); return; }

  let autor = autorMuro.de();
  if (!autor) {
    const campo = $('#muro-nombre');
    const nombre = campo ? campo.value.trim() : '';
    if (!nombre) { avisar('Dinos tu nombre para publicar.', 'alerta'); if (campo) campo.focus(); return; }
    autorMuro.guardarNombre(nombre);
    autor = autorMuro.de();
  }

  const boton = $('[data-accion="publicar-muro"]');
  if (boton) boton.disabled = true;
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
      if (!datosFoto.ok) { avisar(datosFoto.error || 'No se ha podido subir la foto.', 'alerta'); return; }
      foto = datosFoto.ruta;
    }

    const r = await fetch('/api/muro', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: autor.nombre, clave: autor.clave,
        tipo: encuesta ? 'encuesta' : muroTipoElegido,
        texto, foto, encuesta
      })
    });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido publicar.', 'alerta'); return; }
    muroPublicaciones.unshift(datos.publicacion);
    muroUltimaFecha = datos.publicacion.fecha;
    vistos.marcar('muro', muroUltimaFecha);
    $('#muro-texto').value = '';
    quitarFotoMuro();
    alternarEncuestaMuro(false);
    actualizarContadorMuro();
    // Tras publicar se vuelve a "Para ti" para que se vea lo recién escrito.
    muroPestana = 'todo';
    muroEtiqueta = '';
    marcarPestanaMuro();
    pintarFeedMuro();
    pintarLateralMuro();
    if (boton) celebrar(boton, datos.publicacion.tipo === 'celebracion' ? 50 : 16);
    avisar('Publicado en Conecta', 'enviar');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  } finally {
    if (boton) boton.disabled = false;
  }
}

/* ── Reacciones, respuestas y votos ──────────────────────────── */

/* Sustituye una publicación en memoria y en pantalla conservando el
   hilo abierto y la respuesta a medio escribir. */
function reemplazarPublicacion(pub) {
  const i = muroPublicaciones.findIndex((p) => p.id === pub.id);
  if (i !== -1) muroPublicaciones[i] = pub;
  const pieza = document.getElementById('pub-' + pub.id);
  if (!pieza) return null;
  const hilo = pieza.querySelector('.hilo');
  const hiloAbierto = hilo && !hilo.hidden;
  const borrador = pieza.querySelector('.hilo__redactor textarea');
  const textoBorrador = borrador ? borrador.value : '';
  pieza.outerHTML = piezaPublicacion(pub, claveActual(), esAdministrador());
  const nueva = document.getElementById('pub-' + pub.id);
  if (nueva) {
    nueva.style.animation = 'none';
    if (hiloAbierto) {
      const h = nueva.querySelector('.hilo');
      if (h) {
        h.hidden = false;
        const t = h.querySelector('textarea');
        if (t) t.value = textoBorrador;
      }
    }
  }
  pintarLateralMuro();
  return nueva;
}

async function pedirMuro(ruta, cuerpoJson, metodo = 'POST') {
  const r = await fetch(ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json' },
    body: cuerpoJson ? JSON.stringify(cuerpoJson) : undefined
  });
  return r.json();
}

/* Emojis que salen volando desde el botón pulsado. */
function flotarEmoji(origen, emoji, cantidad = 5) {
  if (!origen || sinMovimiento()) return;
  const r = origen.getBoundingClientRect();
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('span');
    el.className = 'emoji-vuela';
    el.textContent = emoji;
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top = (r.top + r.height / 2) + 'px';
    el.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
    el.style.setProperty('--rot', (Math.random() * 60 - 30).toFixed(0) + 'deg');
    el.style.animationDelay = (i * 70) + 'ms';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

function corazonGrande(pieza) {
  pieza.classList.remove('pub--late');
  void pieza.offsetWidth;
  pieza.classList.add('pub--late');
}

async function reaccionarMuro(id, tipo, origen) {
  const autor = autorMuro.de();
  if (!autor) { avisar('Dinos tu nombre arriba para poder reaccionar.', 'alerta'); return; }
  try {
    const datos = await pedirMuro('/api/muro/reaccion', { id, clave: autor.clave, tipo });
    if (!datos.ok) { avisar(datos.error || 'No se ha podido reaccionar.', 'alerta'); return; }
    const activada = ((datos.publicacion.reacciones || {})[tipo] || []).includes(autor.clave);
    reemplazarPublicacion(datos.publicacion);
    if (activada && origen) {
      const def = REACCIONES_MURO[tipo];
      flotarEmoji(origen, def ? def.emoji : '✨');
      if (tipo === 'fiesta') celebrar(origen, 36);
    }
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  }
}

async function responderMuro(id) {
  const campo = document.getElementById('resp-texto-' + id);
  const texto = campo ? campo.value.trim() : '';
  if (!texto) { avisar('Escribe una respuesta.', 'alerta'); if (campo) campo.focus(); return; }
  const autor = autorMuro.de();
  if (!autor) { avisar('Dinos tu nombre arriba para responder.', 'alerta'); return; }
  try {
    const datos = await pedirMuro('/api/muro/respuesta', { id, nombre: autor.nombre, clave: autor.clave, texto });
    if (!datos.ok) { avisar(datos.error || 'No se ha podido responder.', 'alerta'); return; }
    if (campo) campo.value = '';
    const nueva = reemplazarPublicacion(datos.publicacion);
    if (nueva) {
      const h = nueva.querySelector('.hilo');
      if (h) { h.hidden = false; const t = h.querySelector('textarea'); if (t) { t.value = ''; t.focus(); } }
    }
    avisar('Respuesta publicada', 'conecta');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  }
}

async function borrarRespuestaMuro(id, rid) {
  const autor = autorMuro.de();
  if (!autor) return;
  if (!await confirmar('Borrar la respuesta', 'Se eliminará esta respuesta del hilo. No se puede deshacer.',
    { boton: 'Borrar', peligro: true, icono: 'papelera' })) return;
  try {
    const datos = await pedirMuro('/api/muro/respuesta?id=' + encodeURIComponent(id) +
      '&rid=' + encodeURIComponent(rid) + '&clave=' + encodeURIComponent(autor.clave), null, 'DELETE');
    if (!datos.ok) { avisar(datos.error || 'No se ha podido borrar.', 'alerta'); return; }
    reemplazarPublicacion(datos.publicacion);
    avisar('Respuesta borrada');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  }
}

async function votarMuro(id, opcion, origen) {
  const autor = autorMuro.de();
  if (!autor) { avisar('Dinos tu nombre arriba para votar.', 'alerta'); return; }
  try {
    const datos = await pedirMuro('/api/muro/voto', { id, clave: autor.clave, opcion });
    if (!datos.ok) { avisar(datos.error || 'No se ha podido votar.', 'alerta'); return; }
    reemplazarPublicacion(datos.publicacion);
    const elegida = ((datos.publicacion.encuesta || {}).opciones || [])[opcion];
    if (elegida && Array.isArray(elegida.votos) && elegida.votos.includes(autor.clave)) flotarEmoji(origen, '🗳️', 3);
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  }
}

async function borrarDelMuro(id) {
  const autor = autorMuro.de();
  if (!autor) return;
  const pub = muroPublicaciones.find((p) => p.id === id);
  const ajena = pub && pub.clave !== autor.clave;
  const acepta = await confirmar(
    ajena ? 'Borrar como administración' : 'Borrar tu publicación',
    ajena
      ? 'Se eliminará la publicación de ' + (pub.nombre || 'otra persona') + '. No se puede deshacer.'
      : 'Se eliminará tu publicación con sus reacciones y respuestas. No se puede deshacer.',
    { boton: 'Borrar', peligro: true, icono: 'papelera' });
  if (!acepta) return;
  try {
    const r = await fetch('/api/muro?id=' + encodeURIComponent(id) +
      '&clave=' + encodeURIComponent(autor.clave), { method: 'DELETE' });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido borrar.', 'alerta'); return; }
    muroPublicaciones = muroPublicaciones.filter((p) => p.id !== id);
    pintarFeedMuro();
    pintarLateralMuro();
    avisar('Publicación borrada');
  } catch (e) {
    avisar('No hay conexión con el servidor de Conecta.', 'alerta');
  }
}

/* ── Lección sorpresa ────────────────────────────────────────── */
function dadoFormacion(origen) {
  if (!LECCIONES.length) return;
  const pendientes = LECCIONES.filter((l) => !progreso.hecha(l.clave));
  const bolsa = pendientes.length ? pendientes : LECCIONES;
  const eleccion = bolsa[Math.floor(Math.random() * bolsa.length)];
  const mod = moduloPorId(eleccion.moduloId);
  if (origen) celebrar(origen, 14);
  avisar('Lección sorpresa: ' + (mod ? mod.titulo : 'al azar'), 'chispa');
  location.hash = '#/modulo/' + eleccion.moduloId + '/' + eleccion.id;
}

/* ── Mi perfil ───────────────────────────────────────────────── */
async function cargarPerfiles() {
  try {
    const r = await fetch('/api/perfiles?clave=' + encodeURIComponent(claveActual()));
    const datos = await r.json();
    if (datos.ok) fijarPerfiles(datos.perfiles);
  } catch (e) { /* sin servidor: avatares con iniciales */ }
  pintarAvatarCabecera();
}

/* Quién soy, con la mejor información disponible. */
function datosPropios() {
  const u = sesion.usuario() || {};
  const autor = autorMuro.de();
  const clave = autor ? autor.clave : '';
  const perfil = (clave && perfilDe(clave)) || {};
  const persona = clave ? (personas.find((p) => String(p.correo || '').toLowerCase() === clave) || {}) : {};
  const nombre = perfil.nombre || (autor && autor.nombre) || persona.nombre || u.nombre || '';
  return { clave, nombre, correo: u.correo || '', foto: perfil.foto || persona.foto || (clave ? fotoDe(clave) : '') || '' };
}

function pintarAvatarCabecera() {
  const yo = datosPropios();
  const iniciales = yo.nombre
    ? yo.nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
    : '?';
  $$('#avatar-cabecera, #avatar-menu').forEach((el) => {
    el.style.setProperty('--h', tonoDe(yo.clave || yo.nombre || 'x'));
    el.innerHTML = yo.foto ? '<img src="' + yo.foto.replace(/"/g, '') + '" alt="">' : iniciales;
  });
  $('#menu-nombre').textContent = yo.nombre || 'Sin nombre todavía';
  $('#menu-correo').textContent = yo.correo || 'Acceso sin Google';
}

function iniciarMenuPerfil() {
  const boton = $('#btn-perfil');
  const menu = $('#perfil-menu');
  const cerrar = () => { menu.hidden = true; boton.setAttribute('aria-expanded', 'false'); };
  boton.addEventListener('click', () => {
    if (!menu.hidden) { cerrar(); return; }
    menu.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('click', (ev) => {
    if (!menu.hidden && !ev.target.closest('.perfil-cab')) cerrar();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !menu.hidden) cerrar();
  });
  menu.addEventListener('click', (ev) => { if (ev.target.closest('a')) cerrar(); });
}

/* Vuelve a pintar la vista sin perder el punto de lectura. */
function repintarEnSitio() {
  const y = window.scrollY;
  pintar();
  window.scrollTo(0, y);
}

async function guardarPerfil() {
  const campoNombre = $('#perfil-nombre');
  const nombre = (campoNombre ? campoNombre.value : '').trim();
  if (!nombre) { avisar('Dinos tu nombre.', 'alerta'); if (campoNombre) campoNombre.focus(); return; }
  const u = sesion.usuario() || {};
  sesion.renombrar(nombre);
  if (!u.correo) autorMuro.guardarNombre(nombre);
  const autor = autorMuro.de();
  if (!autor) { avisar('No se ha podido identificar la sesión.', 'alerta'); return; }
  const cumple = ($('#perfil-cumple').value || '').trim();
  if (cumple && !/^\d{2}\/\d{2}$/.test(cumple)) { avisar('El cumpleaños va como día/mes, por ejemplo 15/03.', 'alerta'); return; }
  try {
    const datos = await pedirMuro('/api/perfil', {
      clave: autor.clave,
      nombre,
      puesto: $('#perfil-puesto').value.trim(),
      sede: $('#perfil-sede').value,
      idiomas: $('#perfil-idiomas').value.split(',').map((s) => s.trim()).filter(Boolean),
      frase: $('#perfil-frase').value.trim(),
      cumple,
      mostrarCumple: $('#perfil-mostrar-cumple').checked
    });
    if (!datos.ok) { avisar(datos.error || 'No se ha podido guardar.', 'alerta'); return; }
    fijarPerfil(datos.perfil);
    pintarAvatarCabecera();
    repintarEnSitio();
    avisar('Perfil guardado', 'tickCirculo');
  } catch (e) {
    avisar('El perfil necesita el servidor de la plataforma (npm run dev).', 'alerta');
  }
}

/* Recorta al cuadrado y reduce la foto antes de subirla. */
async function reducirImagen(archivo, lado = 320) {
  const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const min = Math.min(mapa.width, mapa.height);
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = lado;
  lienzo.getContext('2d').drawImage(mapa, (mapa.width - min) / 2, (mapa.height - min) / 2, min, min, 0, 0, lado, lado);
  return new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', 0.86));
}

async function subirFotoPerfil(archivo) {
  const autor = autorMuro.de();
  if (!autor) { avisar('Primero guarda tu nombre.', 'alerta'); return; }
  if (!/^image\//.test(archivo.type)) { avisar('Elige una imagen (JPG, PNG o WebP).', 'alerta'); return; }
  try {
    const reducida = await reducirImagen(archivo);
    const r = await fetch('/api/perfil/foto?clave=' + encodeURIComponent(autor.clave) +
      '&nombre=foto.jpg&quien=' + encodeURIComponent(autor.nombre), {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: reducida
    });
    const datos = await r.json();
    if (!datos.ok) { avisar(datos.error || 'No se ha podido subir la foto.', 'alerta'); return; }
    fijarPerfil(datos.perfil);
    pintarAvatarCabecera();
    repintarEnSitio();
    celebrar($('.perfil__foto'), 18);
    avisar('Foto actualizada', 'foto');
  } catch (e) {
    avisar('No se ha podido procesar la foto. Prueba con otra imagen.', 'alerta');
  }
}

async function quitarFotoPerfil() {
  const autor = autorMuro.de();
  if (!autor) return;
  try {
    const datos = await pedirMuro('/api/perfil/foto?clave=' + encodeURIComponent(autor.clave), null, 'DELETE');
    if (!datos.ok) { avisar(datos.error || 'No se ha podido quitar la foto.', 'alerta'); return; }
    fijarPerfil(datos.perfil);
    pintarAvatarCabecera();
    repintarEnSitio();
    avisar('Foto quitada');
  } catch (e) {
    avisar('No hay conexión con el servidor.', 'alerta');
  }
}

function aplicarPreferencia(pref, valor) {
  if (pref === 'tema') {
    const raiz = document.documentElement;
    raiz.classList.add('tema-transicion');
    if (valor === 'auto') tema.restablecer(); else tema.aplicar(valor);
    setTimeout(() => raiz.classList.remove('tema-transicion'), 500);
  } else {
    preferencias.fijar(pref, valor);
  }
  actualizarPuntoAvisos();
  repintarEnSitio();
}

function exportarProgreso() {
  const copia = {
    plataforma: 'formacion-diazyasociados',
    exportado: new Date().toISOString(),
    progreso: progreso.todo(),
    objetivos: objetivosHechos.todo()
  };
  const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = 'mi-progreso-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  avisar('Copia descargada', 'descargar');
}

async function importarProgreso(archivo) {
  try {
    const datos = JSON.parse(await archivo.text());
    if (!datos || datos.plataforma !== 'formacion-diazyasociados') {
      avisar('Ese archivo no es una copia de esta plataforma.', 'alerta');
      return;
    }
    const nuevas = progreso.importar(datos.progreso);
    if (datos.objetivos && typeof datos.objetivos === 'object') {
      Object.keys(datos.objetivos).forEach((id) => {
        if (datos.objetivos[id] && !objetivosHechos.hecho(id)) objetivosHechos.alternar(id);
      });
    }
    actualizarProgreso();
    repintarEnSitio();
    avisar(nuevas ? 'Copia restaurada: ' + nuevas + (nuevas === 1 ? ' lección nueva' : ' lecciones nuevas') : 'Copia restaurada, sin cambios');
  } catch (e) {
    avisar('No se ha podido leer el archivo.', 'alerta');
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
    const el = ev.target;
    if (el.id === 'muro-foto') { elegirFotoMuro(el); return; }
    if (el.id === 'perfil-foto' && el.files && el.files[0]) { subirFotoPerfil(el.files[0]); el.value = ''; return; }
    if (el.id === 'perfil-importar' && el.files && el.files[0]) { importarProgreso(el.files[0]); el.value = ''; return; }
    if (el.matches('input[type="checkbox"][data-pref]')) {
      const pref = el.dataset.pref;
      if (pref === 'movimiento') aplicarPreferencia('movimiento', el.checked ? 'menos' : 'auto');
      else aplicarPreferencia(pref, el.checked);
    }
  });

  // Conecta: contador y altura del redactor, respuestas con Intro.
  $('#vista').addEventListener('input', (ev) => {
    if (ev.target.id === 'muro-texto') actualizarContadorMuro();
    if (ev.target.matches('.hilo__redactor textarea')) {
      ev.target.style.height = 'auto';
      ev.target.style.height = Math.min(120, ev.target.scrollHeight) + 'px';
    }
  });
  $('#vista').addEventListener('keydown', (ev) => {
    if (ev.target.id === 'muro-texto' && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      publicarEnMuro();
    } else if (ev.target.matches('.hilo__redactor textarea') && ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      responderMuro(ev.target.id.replace('resp-texto-', ''));
    }
  });
  iniciarSeguimientoVideo();

  // Formularios dentro de la vista: examen y tickets de soporte.
  $('#vista').addEventListener('submit', (ev) => {
    const examen = ev.target.closest('#examen-form');
    if (examen) { ev.preventDefault(); entregarExamenActual(examen); return; }
    const nuevoTicket = ev.target.closest('#ticket-form');
    if (nuevoTicket) { ev.preventDefault(); enviarTicket(nuevoTicket); return; }
    const respuesta = ev.target.closest('.ticket__responder');
    if (respuesta) { ev.preventDefault(); responderTicketUI(respuesta); return; }
    const encuesta = ev.target.closest('.ticket__encuesta');
    if (encuesta) { ev.preventDefault(); valorarTicketUI(encuesta); return; }
    const nota = ev.target.closest('.ticket__nota');
    if (nota) { ev.preventDefault(); guardarNotaTicketUI(nota); }
  });

  // Bandeja de informática: orden, urgencia y tipo de cada ticket, búsqueda.
  $('#vista').addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'ticket-orden') { soporteOrden = el.value; repintarEnSitio(); return; }
    if (el.dataset.ticketUrgencia) { ajustarTicketUI(el.dataset.ticketUrgencia, { urgencia: el.value }); return; }
    if (el.dataset.ticketCategoria) { ajustarTicketUI(el.dataset.ticketCategoria, { categoria: el.value }); }
  });
  $('#vista').addEventListener('input', (ev) => {
    if (ev.target.id === 'ticket-buscar') { soporteBusqueda = ev.target.value; aplicarBusquedaTickets(); }
  });
  $('#vista').addEventListener('change', (ev) => {
    const form = ev.target.closest('#examen-form');
    if (form && ev.target.matches('input[type="radio"]')) contarRespondidas(form);
  });

  // Doble clic sobre una publicación: corazón, como en las redes.
  $('#vista').addEventListener('dblclick', (ev) => {
    const pub = ev.target.closest('.pub');
    if (!pub || pub.classList.contains('pub--oficial')) return;
    if (ev.target.closest('button, a, textarea, input')) return;
    corazonGrande(pub);
    const boton = pub.querySelector('[data-tipo="corazon"]');
    if (boton && !boton.classList.contains('reaccion--mia')) reaccionarMuro(pub.dataset.id, 'corazon', boton);
  });

  $('#vista').addEventListener('click', async (ev) => {
    const desplegar = ev.target.closest('[data-accion="desplegar"]');
    if (desplegar) {
      const art = desplegar.closest('.leccion');
      const abierta = art.hasAttribute('open');
      // La altura la anima la hoja de estilos a partir del atributo.
      if (abierta) art.removeAttribute('open');
      else art.setAttribute('open', '');
      desplegar.setAttribute('aria-expanded', String(!abierta));
      return;
    }

    const reproducir = ev.target.closest('[data-accion="reproducir"]');
    if (reproducir) {
      // Un vídeo externo no cuenta el tiempo visto: queda como empezado.
      registrarVisualizacion({ ...contextoVideo(reproducir), inicio: true, porcentaje: 0 });
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

    /* ── Conecta ── */
    const chipMuro = ev.target.closest('[data-tipo-muro]');
    if (chipMuro) {
      muroTipoElegido = chipMuro.dataset.tipoMuro;
      $$('#muro-chips .muro-chip').forEach((c) =>
        c.classList.toggle('muro-chip--activo', c === chipMuro));
      return;
    }

    const pestanaMuro = ev.target.closest('[data-pestana-muro]');
    if (pestanaMuro) {
      muroPestana = pestanaMuro.dataset.pestanaMuro;
      muroEtiqueta = '';
      marcarPestanaMuro();
      pintarFeedMuro();
      return;
    }

    const etiqueta = ev.target.closest('[data-etiqueta]');
    if (etiqueta) { filtrarEtiquetaMuro(etiqueta.dataset.etiqueta); return; }

    const quitarEtiqueta = ev.target.closest('[data-accion="quitar-etiqueta-muro"]');
    if (quitarEtiqueta) { muroEtiqueta = ''; pintarFeedMuro(); return; }

    const emoji = ev.target.closest('[data-emoji]');
    if (emoji) { insertarEmojiMuro(emoji.dataset.emoji); return; }

    const encuesta = ev.target.closest('[data-accion="encuesta-muro"]');
    if (encuesta) { alternarEncuestaMuro(); return; }

    const opcionMas = ev.target.closest('[data-accion="encuesta-opcion-mas"]');
    if (opcionMas) { anadirOpcionEncuesta(); return; }

    const publicar = ev.target.closest('[data-accion="publicar-muro"]');
    if (publicar) { publicarEnMuro(); return; }

    const quitarFoto = ev.target.closest('[data-accion="quitar-foto-muro"]');
    if (quitarFoto) { quitarFotoMuro(); return; }

    const reaccion = ev.target.closest('[data-accion="reaccion-muro"]');
    if (reaccion) { reaccionarMuro(reaccion.dataset.id, reaccion.dataset.tipo, reaccion); return; }

    const responder = ev.target.closest('[data-accion="responder-muro"]');
    if (responder) {
      const hilo = document.getElementById('hilo-' + responder.dataset.id);
      if (hilo) {
        hilo.hidden = !hilo.hidden;
        if (!hilo.hidden) { const t = hilo.querySelector('textarea'); if (t) t.focus(); }
      }
      return;
    }

    const enviarResp = ev.target.closest('[data-accion="enviar-respuesta-muro"]');
    if (enviarResp) { responderMuro(enviarResp.dataset.id); return; }

    const borrarResp = ev.target.closest('[data-accion="borrar-respuesta-muro"]');
    if (borrarResp) { borrarRespuestaMuro(borrarResp.dataset.id, borrarResp.dataset.rid); return; }

    const votar = ev.target.closest('[data-accion="votar-muro"]');
    if (votar) { votarMuro(votar.dataset.id, Number(votar.dataset.opcion), votar); return; }

    const borrarPub = ev.target.closest('[data-accion="borrar-muro"]');
    if (borrarPub) { borrarDelMuro(borrarPub.dataset.id); return; }

    const nuevas = ev.target.closest('[data-accion="cargar-nuevas-muro"]');
    if (nuevas) { cargarNuevasMuro(); return; }

    const dado = ev.target.closest('[data-accion="dado-formacion"]');
    if (dado) { dadoFormacion(dado); return; }

    /* ── Examen del módulo ── */
    const empezar = ev.target.closest('[data-accion="empezar-examen"]');
    if (empezar) { empezarExamen(empezar.dataset.modulo); return; }

    const cerrarEx = ev.target.closest('[data-accion="cerrar-examen"]');
    if (cerrarEx) { cerrarExamen(); return; }

    /* ── Soporte informático ── */
    const filtroT = ev.target.closest('[data-filtro-ticket]');
    if (filtroT) { soporteFiltro = filtroT.dataset.filtroTicket; repintarEnSitio(); return; }

    const tipoT = ev.target.closest('[data-ticket-tipo]');
    if (tipoT) { soporteTipo = tipoT.dataset.ticketTipo === soporteTipo ? '' : tipoT.dataset.ticketTipo; repintarEnSitio(); return; }

    const exportarT = ev.target.closest('[data-accion="exportar-tickets"]');
    if (exportarT) { exportarTicketsCsv(); return; }

    const rapida = ev.target.closest('[data-respuesta-rapida]');
    if (rapida) {
      const campo = rapida.closest('.ticket').querySelector('.ticket__responder textarea');
      if (campo) {
        campo.value = (campo.value.trim() ? campo.value.trim() + ' ' : '') + rapida.dataset.respuestaRapida;
        campo.focus();
      }
      return;
    }

    const estadoT = ev.target.closest('[data-accion="ticket-estado"]');
    if (estadoT) { cambiarEstadoTicketUI(estadoT.dataset.id, estadoT.dataset.estado); return; }

    const estrellaT = ev.target.closest('[data-accion="ticket-estrella"]');
    if (estrellaT) {
      const form = estrellaT.closest('.ticket__encuesta');
      const valor = Number(estrellaT.dataset.valor);
      form.dataset.estrellas = valor;
      form.querySelectorAll('.estrella-btn').forEach((b) =>
        b.classList.toggle('estrella-btn--llena', Number(b.dataset.valor) <= valor));
      const txt = form.querySelector('.ticket__estrellas-txt');
      if (txt) txt.textContent = ['', 'Mal', 'Regular', 'Bien', 'Muy bien', 'Excelente'][valor] + ' · ' + valor + ' de 5';
      return;
    }

    /* ── Mi perfil ── */
    const segmento = ev.target.closest('button[data-pref]');
    if (segmento) { aplicarPreferencia(segmento.dataset.pref, segmento.dataset.valor); return; }

    const guardarP = ev.target.closest('[data-accion="guardar-perfil"]');
    if (guardarP) { guardarPerfil(); return; }

    const quitarFotoP = ev.target.closest('[data-accion="quitar-foto-perfil"]');
    if (quitarFotoP) { quitarFotoPerfil(); return; }

    const exportar = ev.target.closest('[data-accion="exportar-progreso"]');
    if (exportar) { exportarProgreso(); return; }

    const reiniciarP = ev.target.closest('[data-accion="reiniciar-progreso"]');
    if (reiniciarP) { reiniciarProgresoConConfirmacion(); return; }

    const deshacerR = ev.target.closest('[data-accion="deshacer-reinicio"]');
    if (deshacerR) { deshacerUltimoReinicio(); return; }

    const cerrarS = ev.target.closest('[data-accion="cerrar-sesion"]');
    if (cerrarS) { $('#btn-salir').click(); return; }

    const marcar = ev.target.closest('[data-accion="marcar"]');
    if (marcar) {
      const clave = marcar.dataset.clave;
      const ahoraHecha = progreso.alternar(clave);
      // El servidor lleva la copia que ve dirección en Seguimiento.
      registrarProgreso(clave, ahoraHecha).then(() => setTimeout(cargarActividad, 600));
      avisar(ahoraHecha ? 'Lección marcada como completada' : 'Lección marcada como pendiente',
             ahoraHecha ? 'tickCirculo' : 'relojArena');
      if (ahoraHecha) celebrar(marcar);

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
      const rotulo = marcar.querySelector('span:not(.onda)');
      if (rotulo) rotulo.textContent = ahoraHecha ? 'Marcar como pendiente' : 'Marcar como completada';

      actualizarProgreso();
      $('#lateral-nav-lista').innerHTML = navegacionLateral(rutaActual(), insigniasNav());
      moverIndicadorLateral();

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
        // Módulo entero completado: lluvia de confeti y enhorabuena.
        if (ahoraHecha && n === claves.length) {
          avisar('Módulo completado. Enhorabuena', 'trofeo');
          celebrar(marcar, 70);
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

/* ── Indicador dorado de la barra lateral ────────────────────── */
/* Una barra que se desliza hasta la sección activa (o el módulo
   abierto) cada vez que cambia la pantalla. */
function moverIndicadorLateral() {
  const nav = $('#lateral-nav');
  const ind = nav && nav.querySelector('.lateral__indicador');
  if (!nav || !ind) return;
  const activo = nav.querySelector('.nav-item--modulo[aria-current="page"]') ||
    nav.querySelector('.nav-item[aria-current="page"]');
  if (!activo) { ind.style.opacity = '0'; return; }
  ind.style.opacity = '1';
  ind.style.height = activo.offsetHeight + 'px';
  ind.style.transform = 'translateY(' + activo.offsetTop + 'px)';
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

/* ── Seguimiento: progreso en el servidor ────────────────────── */
/* El progreso vive en el navegador (como siempre) y, además, en el
   servidor, que es lo que ve dirección en «Seguimiento». Al entrar se
   cruzan las dos copias: lo que falte en una se completa con la otra. */
async function sincronizarProgreso() {
  const r = await progresoRemoto();
  if (!r) return;
  const remotas = r.lecciones || {};
  const locales = progreso.todo();
  const traer = {};
  let nuevas = 0;
  for (const [clave, fecha] of Object.entries(remotas)) {
    if (!locales[clave]) { traer[clave] = new Date(fecha).getTime() || Date.now(); nuevas++; }
  }
  if (nuevas) {
    progreso.importar(traer);
    actualizarProgreso();
    repintarEnSitio();
  }
  const subir = {};
  let pendientes = 0;
  for (const clave of Object.keys(locales)) {
    if (!remotas[clave]) { subir[clave] = true; pendientes++; }
  }
  if (pendientes) subirProgreso(subir);
}

/* ── Seguimiento: vídeos vistos ──────────────────────────────── */
const UMBRALES_VIDEO = [10, 25, 50, 75, 90];

/* De qué módulo y lección es un vídeo, a partir de dónde está. */
function contextoVideo(el) {
  const partes = rutaActual().slice(2).split('/').filter(Boolean);
  const art = el.closest('.leccion');
  const figura = el.closest('figure');
  const pie = figura && figura.querySelector('figcaption');
  return {
    src: el.getAttribute('src') || el.dataset.src || '',
    titulo: (pie && pie.textContent.trim()) || el.dataset.titulo || (el.getAttribute('title') || '') || '',
    modulo: partes[0] === 'modulo' ? (partes[1] || '') : '',
    leccion: art && art.dataset.clave ? art.dataset.clave.split('/')[1] : ''
  };
}

/* Los vídeos propios (<video>) cuentan de verdad: cuándo empiezan, qué
   porcentaje se ve y si se terminan. Los eventos de medios no suben
   por el árbol, de ahí la escucha en fase de captura. */
function iniciarSeguimientoVideo() {
  const vista = $('#vista');
  const enviar = (video, extra) => {
    const duracion = video.duration;
    const pct = duracion && isFinite(duracion) ? Math.round((video.currentTime / duracion) * 100) : 0;
    registrarVisualizacion({
      ...contextoVideo(video),
      porcentaje: extra.completo ? 100 : pct,
      segundos: Math.round(video.currentTime || 0),
      ...extra
    });
  };
  vista.addEventListener('play', (ev) => {
    const v = ev.target;
    if (!(v instanceof HTMLVideoElement) || v.dataset.seguido) return;
    v.dataset.seguido = '1';
    v.dataset.umbral = '0';
    enviar(v, { inicio: true });
  }, true);
  vista.addEventListener('timeupdate', (ev) => {
    const v = ev.target;
    if (!(v instanceof HTMLVideoElement) || !v.duration || !v.dataset.seguido) return;
    const pct = (v.currentTime / v.duration) * 100;
    const alcanzado = Number(v.dataset.umbral || 0);
    const siguiente = UMBRALES_VIDEO.find((u) => u > alcanzado && pct >= u);
    if (siguiente) { v.dataset.umbral = String(siguiente); enviar(v, {}); }
  }, true);
  vista.addEventListener('ended', (ev) => {
    const v = ev.target;
    if (!(v instanceof HTMLVideoElement)) return;
    if (!v.dataset.seguido) v.dataset.seguido = '1';
    v.dataset.umbral = '100';
    enviar(v, { completo: true });
    setTimeout(cargarActividad, 600);
  }, true);
}

/* ── Exámenes ────────────────────────────────────────────────── */
let examenesCache = [];

async function cargarExamenes() {
  const r = await misExamenes();
  if (!r) return;
  examenesCache = r.intentos || [];
  refrescarEstadoExamen();
}

function refrescarEstadoExamen() {
  const seccion = $('#examen');
  if (!seccion) return;
  const mod = moduloPorId(seccion.dataset.modulo);
  if (!mod) return;
  const mios = examenesCache.filter((i) => i.modulo === mod.id);
  const aprobado = mios.some((i) => i.aprobado);
  const estado = $('#examen-estado');
  if (estado) estado.innerHTML = estadoExamen(mod, examenesCache);
  seccion.classList.toggle('examen--aprobado', aprobado);
  const boton = seccion.querySelector('#examen-acciones [data-accion="empezar-examen"]');
  if (boton) {
    const rotulo = boton.querySelector('span:not(.onda)');
    if (rotulo) rotulo.textContent = mios.length ? 'Repetir el examen' : 'Hacer el examen';
    boton.classList.toggle('btn--oro', !aprobado);
    boton.classList.toggle('btn--secundario', aprobado);
  }
}

function empezarExamen(idModulo) {
  const mod = moduloPorId(idModulo);
  const cuerpo = $('#examen-cuerpo');
  if (!mod || !cuerpo) return;
  cuerpo.innerHTML = piezaExamen(mod);
  cuerpo.hidden = false;
  $('#examen-acciones').hidden = true;
  cuerpo.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' });
}

function cerrarExamen() {
  const cuerpo = $('#examen-cuerpo');
  if (!cuerpo) return;
  cuerpo.hidden = true;
  cuerpo.innerHTML = '';
  $('#examen-acciones').hidden = false;
  $('#examen').scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' });
}

function contarRespondidas(form) {
  const preguntas = Array.from(form.querySelectorAll('fieldset.pregunta'));
  let n = 0;
  preguntas.forEach((f) => {
    if (f.querySelector('input:checked')) { n++; f.classList.remove('pregunta--falta'); }
  });
  const cuenta = $('#examen-cuenta');
  if (cuenta) cuenta.textContent = n + ' de ' + preguntas.length + ' respondidas';
  return { n, total: preguntas.length };
}

async function entregarExamenActual(form) {
  const mod = moduloPorId(form.dataset.modulo);
  if (!mod) return;
  const preguntas = Array.from(form.querySelectorAll('fieldset.pregunta'));
  const respuestas = preguntas.map((f) => {
    const marcada = f.querySelector('input:checked');
    return marcada ? Number(marcada.value) : -1;
  });
  const faltan = preguntas.filter((f, i) => respuestas[i] < 0);
  if (faltan.length) {
    faltan.forEach((f) => f.classList.add('pregunta--falta'));
    faltan[0].scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'center' });
    avisar(faltan.length === 1 ? 'Te queda una pregunta sin responder' : 'Te quedan ' + faltan.length + ' preguntas sin responder', 'alerta');
    return;
  }
  const boton = form.querySelector('[data-accion="entregar-examen"]');
  if (boton) boton.disabled = true;
  let r = null;
  try { r = await entregarExamen(mod.id, respuestas); } catch (e) { r = null; }
  if (!r || !r.ok) {
    if (boton) boton.disabled = false;
    avisar((r && r.error) || 'No se ha podido entregar el examen. Comprueba que el servidor de la plataforma está en marcha.', 'alertaCirculo');
    return;
  }
  if (r.intento) examenesCache.unshift(r.intento);
  const cuerpo = $('#examen-cuerpo');
  cuerpo.innerHTML = piezaResultadoExamen(mod, r.resultado);
  refrescarEstadoExamen();
  cuerpo.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' });
  if (r.resultado.aprobado) {
    avisar('Examen aprobado con un ' + r.resultado.nota + ' %', 'trofeo');
    celebrar(cuerpo.querySelector('.examen-res__nota') || cuerpo, 70);
  } else {
    avisar('Nota: ' + r.resultado.nota + ' %. Puedes repetirlo cuando quieras.', 'relojArena');
  }
  setTimeout(cargarActividad, 600);
}

/* ── Actividad reciente ──────────────────────────────────────── */
let actividadCache;   // undefined hasta la primera carga

async function cargarActividad() {
  const r = await actividadReciente(40);
  if (!r) {
    if (!actividadCache) { actividadCache = []; pintarActividad(); }
    return;
  }
  const antes = JSON.stringify(actividadCache || null);
  actividadCache = r.eventos || [];
  if (JSON.stringify(actividadCache) !== antes) pintarActividad();
  actualizarPuntoAvisos();
}

function pintarActividad() {
  const el = $('#actividad-lista');
  if (el) el.innerHTML = piezaActividad(actividadCache);
}

/* ── Soporte informático: tickets ────────────────────────────── */
let soporteCache = null;      // { mios, todos (solo administración), cargado }
let soporteFiltro = 'abiertos';
let soporteTipo = '';
let soporteOrden = 'urgencia';
let soporteBusqueda = '';

async function cargarSoporte() {
  const [mios, todos] = await Promise.all([misTickets(), esAdministrador() ? todosLosTickets() : Promise.resolve(null)]);
  const nuevo = { mios: mios ? mios.tickets || [] : [], todos: todos ? todos.tickets || [] : null, cargado: true };
  const cambia = JSON.stringify(nuevo) !== JSON.stringify(soporteCache);
  // A informática se le avisa al momento de cada ticket nuevo.
  if (cambia && soporteCache && soporteCache.todos && nuevo.todos) {
    const conocidos = new Set(soporteCache.todos.map((t) => t.id));
    const miClave = (autorMuro.de() || {}).clave || '';
    const recienLlegados = nuevo.todos.filter((t) => !conocidos.has(t.id) && t.clave !== miClave);
    if (recienLlegados.length) {
      const t = recienLlegados[0];
      avisar((recienLlegados.length === 1 ? 'Nuevo ticket #' + t.numero + ': ' + t.titulo : recienLlegados.length + ' tickets nuevos de informática'), 'soporte',
        { accion: 'Ver', alPulsar: () => { location.hash = '#/soporte'; } });
    }
  }
  soporteCache = nuevo;
  if (cambia && rutaActual().startsWith('#/soporte')) repintarEnSitio();
  else if (cambia) refrescarNavLateral();
  actualizarPuntoAvisos();
}

/* Filtro de texto de la bandeja, sin repintar (para no perder el foco). */
function aplicarBusquedaTickets() {
  const q = soporteBusqueda.trim().toLowerCase();
  $$('.bandeja-it .ticket').forEach((el) => { el.hidden = Boolean(q) && !(el.dataset.buscar || '').includes(q); });
  const campo = $('#ticket-buscar');
  if (campo && campo.value !== soporteBusqueda) campo.value = soporteBusqueda;
}

async function ajustarTicketUI(id, datos) {
  let r = null;
  try { r = await ajustarTicket(id, datos); } catch (e) { r = null; }
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido guardar el cambio.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  avisar(datos.urgencia ? 'Urgencia: ' + (URGENCIAS_TICKET[datos.urgencia] || datos.urgencia).toLowerCase() : 'Tipo: ' + (CATEGORIAS_TICKET[datos.categoria] || datos.categoria), 'tickCirculo');
  repintarEnSitio();
}

async function guardarNotaTicketUI(form) {
  const campo = form.querySelector('input');
  const texto = (campo.value || '').trim();
  if (!texto) { campo.focus(); return; }
  let r = null;
  try { r = await notaInternaTicket(form.dataset.id, texto); } catch (e) { r = null; }
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido guardar la nota.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  avisar('Nota interna guardada', 'candado');
  repintarEnSitio();
}

/* Histórico en CSV para Excel (separador ; y BOM para las tildes). */
function exportarTicketsCsv() {
  const lista = (soporteCache && soporteCache.todos) || [];
  if (!lista.length) { avisar('Todavía no hay tickets que exportar.', 'info'); return; }
  const celda = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const fecha = (iso) => (iso ? String(iso).slice(0, 16).replace('T', ' ') : '');
  const cabecera = ['Número', 'Abierto', 'Persona', 'Título', 'Tipo', 'Urgencia', 'Estado', 'Resuelto', 'Horas hasta resolver', 'Calidad (1-5)', 'A tiempo', 'Atendió', 'Feedback', 'Descripción'];
  const filas = [...lista].sort((a, b) => Number(a.numero) - Number(b.numero)).map((t) => [
    t.numero, fecha(t.fecha), t.nombre, t.titulo, CATEGORIAS_TICKET[t.categoria] || t.categoria, URGENCIAS_TICKET[t.urgencia] || t.urgencia,
    (ESTADOS_TICKET[t.estado] || {}).texto || t.estado, fecha(t.resuelto),
    t.resuelto ? ((new Date(t.resuelto) - new Date(t.fecha)) / 36e5).toFixed(1).replace('.', ',') : '',
    t.encuesta ? t.encuesta.estrellas : '', t.encuesta ? ({ rapido: 'Rápido', normal: 'Razonable', lento: 'Tardó' })[t.encuesta.tiempo] || '' : '',
    t.encuesta ? t.encuesta.contacto || '' : '', t.encuesta ? t.encuesta.comentario || '' : '', t.descripcion || ''
  ]);
  const csv = '﻿' + [cabecera, ...filas].map((f) => f.map(celda).join(';')).join('\r\n');
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  enlace.download = 'tickets-informatica-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  avisar('Histórico descargado (' + lista.length + ' tickets)', 'descargar');
}

/* Cifras que acompañan a algunos enlaces del menú lateral: a
   informática, los tickets abiertos; a cada persona, los suyos movidos. */
function insigniasNav() {
  const insignias = {};
  const t = avisosTickets();
  if (t.informatica) insignias['#/soporte'] = t.informatica.cantidad;
  else if (t.mio && t.mio.fecha && vistos.hayNuevo('tickets', t.mio.fecha)) insignias['#/soporte'] = '1';
  return insignias;
}

function refrescarNavLateral() {
  const nav = $('#lateral-nav');
  if (!nav) return;
  const lista = $('#lateral-nav-lista');
  const html = navegacionLateral(rutaActual(), insigniasNav());
  if (lista && lista.innerHTML !== html) { lista.innerHTML = html; moverIndicadorLateral(); }
}

/* Sustituye (o añade) un ticket en la copia local sin esperar al servidor. */
function actualizarTicketEnCache(t) {
  if (!soporteCache) soporteCache = { mios: [], todos: esAdministrador() ? [] : null, cargado: true };
  const sustituir = (lista) => lista.some((x) => x.id === t.id) ? lista.map((x) => (x.id === t.id ? t : x)) : [t, ...lista];
  const miClave = (autorMuro.de() || {}).clave || '';
  if (t.clave === miClave) soporteCache.mios = sustituir(soporteCache.mios || []);
  if (soporteCache.todos) soporteCache.todos = sustituir(soporteCache.todos);
}

const desplazarATicket = (el) => el && el.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'center' });

async function enviarTicket(form) {
  if (!autorMuro.de()) { avisar('Para abrir un ticket, entra con tu cuenta o pon tu nombre en Conecta.', 'alerta'); return; }
  const datos = {
    titulo: form.titulo.value.trim(),
    descripcion: form.descripcion.value.trim(),
    categoria: form.categoria.value,
    urgencia: (form.querySelector('input[name="urgencia"]:checked') || {}).value || 'normal'
  };
  if (!datos.titulo) { avisar('Cuenta en una línea qué pasa.', 'alerta'); form.titulo.focus(); return; }
  const boton = form.querySelector('button[type="submit"]');
  if (boton) boton.disabled = true;
  let r = null;
  try { r = await abrirTicket(datos); } catch (e) { r = null; }
  if (boton) boton.disabled = false;
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido enviar el ticket. Comprueba que el servidor está en marcha.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  avisar('Ticket #' + r.ticket.numero + ' enviado a informática', 'tickCirculo');
  repintarEnSitio();
  const el = document.getElementById('ticket-' + r.ticket.id);
  desplazarATicket(el);
  if (el) celebrar(el, 16);
}

async function cambiarEstadoTicketUI(id, estado) {
  if (estado === 'resuelto') {
    const ok = await confirmar('Marcar como resuelto',
      'La persona verá el ticket como resuelto y podrá valorar la atención. Si quieres explicar qué se hizo, escríbelo antes en el hilo.',
      { boton: 'Resolver', icono: 'tickCirculo' });
    if (!ok) return;
  }
  let r = null;
  try { r = await cambiarEstadoTicket(id, estado, ''); } catch (e) { r = null; }
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido cambiar el estado.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  const e = ESTADOS_TICKET[estado] || ESTADOS_TICKET.pendiente;
  avisar('Ticket #' + r.ticket.numero + ': ' + e.texto.toLowerCase(), e.icono);
  repintarEnSitio();
}

async function responderTicketUI(form) {
  const campo = form.querySelector('textarea');
  const texto = (campo.value || '').trim();
  if (!texto) { campo.focus(); return; }
  let r = null;
  try { r = await responderTicket(form.dataset.id, texto); } catch (e) { r = null; }
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido enviar el mensaje.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  avisar('Mensaje enviado', 'enviar');
  repintarEnSitio();
  desplazarATicket(document.getElementById('ticket-' + r.ticket.id));
}

async function valorarTicketUI(form) {
  const estrellas = Number(form.dataset.estrellas) || 0;
  if (!estrellas) { avisar('Elige de 1 a 5 estrellas', 'alerta'); return; }
  const datos = {
    estrellas,
    tiempo: (form.querySelector('input[type="radio"]:checked') || {}).value || '',
    contacto: (form.contacto.value || '').trim(),
    comentario: (form.comentario.value || '').trim()
  };
  let r = null;
  try { r = await valorarTicket(form.dataset.id, datos); } catch (e) { r = null; }
  if (!r || !r.ok) { avisar((r && r.error) || 'No se ha podido guardar la valoración.', 'alertaCirculo'); return; }
  actualizarTicketEnCache(r.ticket);
  avisar('Gracias por valorar la atención', 'trofeo');
  celebrar(form, 24);
  repintarEnSitio();
}

/* ── Seguimiento (solo administración) ───────────────────────── */
let seguimientoCache = null;
let cargandoSeguimiento = false;

async function cargarSeguimiento() {
  if (cargandoSeguimiento) return;
  cargandoSeguimiento = true;
  const [p, v, e, t] = await Promise.all([todoElProgreso(), todasLasVisualizaciones(), todosLosExamenes(), todosLosTickets()]);
  cargandoSeguimiento = false;
  const nuevo = (!p || !v || !e)
    ? { error: 'No se han podido cargar los datos. Comprueba que el servidor de la plataforma está en marcha y que tu cuenta tiene papel de administración.' }
    : { progreso: p.progreso || {}, visualizaciones: v.visualizaciones || [], intentos: e.intentos || [], tickets: t ? t.tickets || [] : [] };
  const cambia = JSON.stringify(nuevo) !== JSON.stringify(seguimientoCache);
  seguimientoCache = nuevo;
  if (cambia && rutaActual().startsWith('#/seguimiento')) repintarEnSitio();
}

/* ── Arranque de la aplicación ───────────────────────────────── */
function arrancarApp() {
  $('#app').hidden = false;
  $('#version-contenidos').textContent = VERSION;

  construirIndice();

  fijarModoAdmin(esAdministrador());
  $$('[data-solo-admin]').forEach((el) => { el.hidden = !esAdministrador(); });

  iniciarNotificaciones();
  iniciarMenuPerfil();
  pintarAvatarCabecera();
  sondearMuro();
  cargarPerfiles();
  cargarActividad();
  cargarExamenes();
  cargarSoporte();
  // Informática ve llegar los tickets sin recargar.
  if (esAdministrador()) setInterval(cargarSoporte, 60000);
  sincronizarProgreso();

  $('#btn-admin').hidden = !esAdministrador();

  if (!almacenamientoDisponible()) {
    avisar('Tu navegador no guarda datos: el progreso no se conservará al cerrar.');
  }

  pintar();
  window.addEventListener('hashchange', pintar);
  window.addEventListener('scroll', actualizarLectura, { passive: true });
  window.addEventListener('resize', moverIndicadorLateral);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicadorLateral);

  $('#btn-menu').addEventListener('click', () => {
    const abierto = $('#lateral').classList.contains('lateral--abierto');
    if (abierto) cerrarLateral(); else abrirLateral();
  });
  $('#lateral-velo').addEventListener('click', cerrarLateral);
  $('#lateral').addEventListener('click', (ev) => {
    if (ev.target.closest('.nav-item')) cerrarLateral();
  });

  $('#btn-tema').addEventListener('click', () => {
    // Los colores se funden durante el cambio en lugar de saltar.
    const raiz = document.documentElement;
    raiz.classList.add('tema-transicion');
    tema.alternar();
    setTimeout(() => raiz.classList.remove('tema-transicion'), 500);
  });

  $('#btn-salir').addEventListener('click', async () => {
    if (!await confirmar('Cerrar sesión', 'Tu progreso se conserva en este equipo. Podrás volver a entrar cuando quieras.',
      { boton: 'Cerrar sesión', icono: 'salir' })) return;
    sesion.cerrar();
    location.reload();
  });

}

/* ── Punto de entrada ────────────────────────────────────────── */
function inicio() {
  // El tema se pinta sin fijarlo: quien no ha elegido sigue al sistema.
  tema.iniciar();
  preferencias.aplicar();
  if (window.matchMedia) {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!tema.guardado()) tema.iniciar();
    });
  }
  pintarIconosFijos();
  iniciarOndas();
  iniciarFocoLuminoso();
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
