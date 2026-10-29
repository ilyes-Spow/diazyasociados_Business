/* ===============================================================
   vistas.js - Generación del HTML de cada pantalla
   =============================================================== */

import {
  MODULOS, GRUPOS, LECCIONES, VERSION,
  moduloPorId, modulosDeGrupo, TOTAL_LECCIONES, TOTAL_MINUTOS
} from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import equipo from '../../content/equipo.js';
import objetivos from '../../content/objetivos.js';
import modelos from '../../content/modelos.js';
import personas from '../../content/personas.js';
import { render, escapar, videoHtml, interpretarVideo } from './markdown.js';
import { progreso, sesion, autorMuro, preferencias, tema } from './estado.js';
import { ico } from './iconos.js';
import { perfilDe, SEDES_PERFIL, nombreSede } from './perfiles.js';
import {
  calcularMes, rankingDe, rankingAcumulado, mesesConDatos, mesesDe, personaDeSesion,
  puntuacion, formatearResultado, formatearMeta, puestoDe, objetivosDe, NOMBRES_MES
} from './objetivos-calculo.js';

/* ── Utilidades ──────────────────────────────────────────────── */
const clavesDe = (mod) => mod.lecciones.map((l) => mod.id + '/' + l.id);

/* Puntos que otorga cada lección completada. */
export const XP_LECCION = 20;

/* Personas dadas de alta en el panel (solo las activas). */
export const personasActivas = () => personas.filter((p) => p && p.activo !== false);
export const personaPorCorreo = (correo) =>
  personas.find((p) => String(p.correo || '').toLowerCase() === String(correo || '').toLowerCase()) || null;

/* ¿La lección tiene vídeo principal? */
export const conVideo = (lec) => Boolean(lec && lec.video && String(lec.video.url || '').trim());
const videosDe = (mod) => mod.lecciones.filter(conVideo);
/* Vídeos de un módulo: la presentación (si la hay) más los de sus lecciones. */
const totalVideos = (mod) => videosDe(mod).length + (conVideo(mod) ? 1 : 0);
const PANEL_URL = 'http://localhost:8100';
const huecoVideo = (texto, extra = '') =>
  '<div class="sin-video' + (extra ? ' ' + extra : '') + '">' + ico('video') + '<span>' + texto + '</span>' +
  '<a href="' + PANEL_URL + '" target="_blank" rel="noopener">Añadirlo en el panel' + ico('externo') + '</a></div>';

/* Quien administra ve además la pantalla de seguimiento; app.js lo
   fija al entrar, porque depende de la sesión. */
let modoAdmin = false;
export function fijarModoAdmin(valor) { modoAdmin = Boolean(valor); }

/* Examen de un módulo, si lo tiene y tiene preguntas. */
export const examenDe = (mod) =>
  (mod && mod.examen && Array.isArray(mod.examen.preguntas) && mod.examen.preguntas.length) ? mod.examen : null;

/* ── Datos derivados del progreso ────────────────────────────── */
function nombreDePila() {
  const u = sesion.usuario();
  if (!u || !u.nombre) return '';
  return u.nombre.trim().split(/\s+/)[0];
}

function saludoDelDia() {
  const h = new Date().getHours();
  if (h < 7) return 'Hola';
  if (h < 14) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

/* Días seguidos (contando hacia atrás desde hoy o ayer) con al
   menos una lección marcada. */
function rachaDias() {
  const marcas = Object.values(progreso.todo());
  if (!marcas.length) return 0;
  const dias = new Set(marcas.map((t) => new Date(t).toDateString()));
  const dia = new Date();
  if (!dias.has(dia.toDateString())) dia.setDate(dia.getDate() - 1);
  let racha = 0;
  while (dias.has(dia.toDateString())) {
    racha++;
    dia.setDate(dia.getDate() - 1);
  }
  return racha;
}

const moduloCompleto = (mod) => {
  const claves = clavesDe(mod);
  return claves.length > 0 && progreso.contar(claves) === claves.length;
};

const porNum = (num) => MODULOS.find((m) => m.num === num);

/* Insignias, calculadas siempre a partir del progreso real. */
export function insignias() {
  const total = progreso.contar(LECCIONES.map((l) => l.clave));
  const m3 = porNum(3);
  const m4 = porNum(4);
  return [
    { nombre: 'Primer día', icono: 'estrella', ganada: true },
    { nombre: 'En marcha', icono: 'brujula', ganada: total >= 1 },
    { nombre: 'Con método', icono: 'libro', ganada: Boolean(m3 && moduloCompleto(m3)) },
    { nombre: 'Del equipo', icono: 'usuarios', ganada: Boolean(m4 && moduloCompleto(m4)) }
  ];
}

/* Mes actual (hora local) en formato AAAA-MM y su nombre legible. */
export const mesActual = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

function nombreDeMes(aaaamm) {
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [a, m] = String(aaaamm).split('-');
  return (meses[Number(m) - 1] || m) + ' de ' + a;
}

/* La persona de objetivos que corresponde a la sesión abierta y su
   último mes con resultados publicados. */
export function objetivosDelMes() {
  const persona = personaDeSesion(objetivos, sesion.usuario() || {});
  if (!persona) return { persona: null, mes: '', calculo: null, lista: [] };
  const mes = mesesDe(objetivos, persona.id)[0] || '';
  const calculo = mes ? calcularMes(objetivos, persona, mes) : null;
  const puesto = calculo ? puestoDe(objetivos, persona.id, mes) : null;
  return { persona, mes, calculo, puesto, lista: calculo ? calculo.filas : [] };
}

/* Foto de una persona de objetivos: por su correo o, si no lo tiene
   enlazado, por su nombre de pila en Personas y accesos o en el
   ranking manual. */
const primerNombre = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0];
function fotoDePersonaObjetivos(p) {
  if (p.correo && fotoDe(p.correo)) return fotoDe(p.correo);
  if (p.foto) return p.foto;
  const alta = personasActivas().find((x) => primerNombre(x.nombre) === primerNombre(p.nombre));
  if (alta) return fotoDe(alta.correo, alta);
  const manual = ((equipo.ranking && equipo.ranking.personas) || []).find((x) => primerNombre(x.nombre) === primerNombre(p.nombre));
  return (manual && manual.foto) || '';
}

/* Mes en tres letras, para las gráficas pequeñas. */
const mesCorto = (aaaamm) => (NOMBRES_MES[Number(String(aaaamm).split('-')[1]) - 1] || '').slice(0, 3);

/* Texto plano corto a partir del Markdown de una novedad. */
function extracto(md, max) {
  const linea = String(md || '').split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith(':::'));
  if (!linea) return '';
  const plano = linea
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`|]/g, '');
  return plano.length > max ? plano.slice(0, max - 1).trimEnd() + '…' : plano;
}

export function formatearFecha(iso) {
  const [a, m, d] = String(iso).split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const mes = meses[Number(m) - 1] || m;
  return Number(d) + ' de ' + mes + ' de ' + a;
}

function pastillasModulo(mod) {
  const p = [];
  if (mod.etiquetas && mod.etiquetas.includes('obligatorio')) {
    p.push('<span class="pastilla pastilla--oro">Obligatorio</span>');
  }
  p.push('<span class="pastilla">' + ico('reloj') + mod.duracion + ' min</span>');
  p.push('<span class="pastilla">' + ico('libro') + mod.lecciones.length +
         (mod.lecciones.length === 1 ? ' lección' : ' lecciones') + '</span>');
  const nVid = videosDe(mod).length;
  if (nVid) p.push('<span class="pastilla pastilla--video">' + ico('play') + nVid + (nVid === 1 ? ' vídeo' : ' vídeos') + '</span>');
  return p.join('');
}

/* ── Portada ─────────────────────────────────────────────────── */
export function vistaInicio(opciones = {}) {
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  const pct = TOTAL_LECCIONES ? Math.round((hechas / TOTAL_LECCIONES) * 100) : 0;
  const puntos = hechas * XP_LECCION;
  const modulosHechos = MODULOS.filter(moduloCompleto).length;
  const racha = rachaDias();
  const nombre = nombreDePila();

  const siguiente = LECCIONES.find((l) => !progreso.hecha(l.clave));
  const modSiguiente = siguiente ? moduloPorId(siguiente.moduloId) : null;
  const pendientesDelMod = modSiguiente
    ? clavesDe(modSiguiente).length - progreso.contar(clavesDe(modSiguiente))
    : 0;

  const titularHeroe = nombre
    ? saludoDelDia() + ', ' + escapar(nombre) + '.'
    : saludoDelDia() + '.';
  const lineaRacha = racha >= 2
    ? ' Sigues en racha: ' + racha + ' días seguidos.'
    : '';

  // Circunferencia del anillo de progreso (r = 52).
  const circun = 2 * Math.PI * 52;
  const arco = Math.round((pct / 100) * circun);

  const tarjetasNovedades = novedades.slice(0, 3).map((nov, i) => {
    const nivel = NIVELES[nov.nivel] || NIVELES.informativa;
    return (
      '<a class="nov-tarjeta" href="#/novedades">' +
        '<span class="nov-tarjeta__ico nov-tarjeta__ico--' + escapar(nov.nivel || 'informativa') + '">' +
          ico('novedades') + '</span>' +
        '<span class="nov-tarjeta__txt">' +
          '<span class="nov-tarjeta__meta">' +
            (i === 0 ? '<span class="pastilla pastilla--oro">Nuevo</span>' : '') +
            '<span class="nov-tarjeta__fecha">' + formatearFecha(nov.fecha) + '</span>' +
            '<span class="pastilla ' + nivel.clase + '">' + nivel.texto + '</span>' +
          '</span>' +
          '<strong>' + escapar(nov.titulo) + '</strong>' +
          '<span class="nov-tarjeta__ext">' + escapar(extracto(nov.md, 150)) + '</span>' +
        '</span>' +
      '</a>'
    );
  }).join('');

  const accesos =
    '<a class="acceso-rapido" href="#/formacion">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--marino">' + ico('formacion') + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Itinerario de formación</strong>' +
        '<span>' + MODULOS.length + ' módulos en ' + GRUPOS.length + ' bloques</span></span>' +
      ico('chevron', 'acceso-rapido__flecha') +
    '</a>' +
    '<a class="acceso-rapido" href="#/onboarding">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--oro">' + ico('onboarding') + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Tu primera semana</strong>' +
        '<span>Onboarding guiado por niveles</span></span>' +
      ico('chevron', 'acceso-rapido__flecha') +
    '</a>' +
    '<a class="acceso-rapido" href="#/novedades">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--info">' + ico('novedades') + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Novedades</strong>' +
        '<span>Histórico de avisos del despacho</span></span>' +
      ico('chevron', 'acceso-rapido__flecha') +
    '</a>' +
    '<a class="acceso-rapido" href="#/soporte">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--soporte">' + ico('soporte') + '</span>' +
      '<span class="acceso-rapido__txt"><strong>¿Algo no funciona?</strong>' +
        '<span>Abre un ticket a informática</span></span>' +
      ico('chevron', 'acceso-rapido__flecha') +
    '</a>' +
    '<button type="button" class="acceso-rapido acceso-rapido--dado" data-accion="dado-formacion">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--sorpresa">' + ico('chispa') + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Sorpréndeme 🎲</strong>' +
        '<span>Una lección al azar, cinco minutos</span></span>' +
      ico('chevron', 'acceso-rapido__flecha') +
    '</button>';

  const reto = modSiguiente
    ? '<div class="reto">' +
        '<span class="reto__et">Reto de la semana</span>' +
        '<span class="reto__txt">Completa el módulo «' + escapar(modSiguiente.titulo) +
          '» y suma ' + (pendientesDelMod * XP_LECCION) + ' puntos.</span>' +
      '</div>'
    : '<div class="reto">' +
        '<span class="reto__et">Itinerario completado</span>' +
        '<span class="reto__txt">Has terminado los ' + MODULOS.length +
          ' módulos. Revisa las novedades para mantenerte al día.</span>' +
      '</div>';

  return (
    '<div class="envoltorio envoltorio--ancho">' +

      '<div class="panel-fila">' +
        '<div class="panel-heroe">' +
          '<p class="panel-heroe__cinta">' + (nombre ? saludoDelDia() : 'Plataforma de formación interna') + '</p>' +
          '<h1>' + (nombre ? 'Hola, ' + escapar(nombre) + '.' : titularHeroe) + lineaRacha + '</h1>' +
          '<p class="panel-heroe__sub">' + (siguiente
            ? 'Llevas ' + hechas + ' de ' + TOTAL_LECCIONES + ' lecciones. Continúa donde lo dejaste.'
            : 'Has completado el itinerario entero. Enhorabuena.') + '</p>' +
          '<div class="panel-heroe__acciones">' +
            (siguiente
              ? '<a class="btn btn--oro" href="#/modulo/' + siguiente.moduloId + '/' + siguiente.id + '">' +
                  (conVideo(siguiente) ? ico('play') + 'Ver el vídeo: ' + escapar(siguiente.titulo) : 'Continuar: ' + escapar(modSiguiente.titulo)) +
                  ico('flecha') + '</a>' +
                '<span class="panel-heroe__nota">Módulo ' + modSiguiente.num + ' de ' + MODULOS.length +
                  (pendientesDelMod === 1 ? ' · te queda 1 lección' : ' · te quedan ' + pendientesDelMod + ' lecciones') + '</span>'
              : '<a class="btn btn--oro" href="#/novedades">Ver novedades' + ico('flecha') + '</a>') +
          '</div>' +
        '</div>' +
        '<div class="panel-anillo">' +
          '<svg viewBox="0 0 120 120" role="img" aria-label="Progreso general: ' + pct + '%">' +
            '<circle cx="60" cy="60" r="52" fill="none" stroke="var(--fondo-alt)" stroke-width="11"/>' +
            '<circle cx="60" cy="60" r="52" fill="none" stroke="var(--oro-500)" stroke-width="11" stroke-linecap="round" ' +
              'stroke-dasharray="' + arco + ' ' + Math.round(circun) + '" transform="rotate(-90 60 60)"/>' +
            '<text x="60" y="57" text-anchor="middle" class="panel-anillo__pct" data-contar="' + pct + '" data-sufijo="%">' + pct + '%</text>' +
            '<text x="60" y="76" text-anchor="middle" class="panel-anillo__et">completado</text>' +
          '</svg>' +
          '<strong>Tu progreso general</strong>' +
          '<span>' + modulosHechos + (modulosHechos === 1 ? ' módulo completado' : ' módulos completados') +
            ' · <b data-contar="' + puntos + '">' + puntos + '</b> puntos</span>' +
        '</div>' +
      '</div>' +

      '<div class="panel-columnas">' +
        '<section class="panel-col">' +
          '<div class="seccion-tit seccion-tit--fila"><h2>Novedades del despacho</h2>' +
            '<a class="seccion-tit__mas" href="#/novedades">Ver todas</a></div>' +
          (tarjetasNovedades
            ? '<div class="nov-lista">' + tarjetasNovedades + '</div>'
            : '<p class="prosa">Todavía no hay novedades publicadas.</p>') +
          '<section class="actividad" id="actividad-reciente">' +
            '<div class="seccion-tit seccion-tit--fila"><h2>Actividad reciente</h2>' +
              '<span class="actividad__vivo"><i></i>Lo último del equipo</span></div>' +
            '<div id="actividad-lista">' + piezaActividad(opciones.actividad) + '</div>' +
          '</section>' +
        '</section>' +
        '<section class="panel-col panel-col--estrecha">' +
          tarjetaObjetivos() +
          '<div class="seccion-tit"><h2>Accesos rápidos</h2></div>' +
          '<div class="acceso-rapido-lista">' + accesos + '</div>' +
          reto +
        '</section>' +
      '</div>' +
    '</div>'
  );
}

/* ── Objetivos: la tarjeta de la portada ─────────────────────── */
function tarjetaObjetivos() {
  const { persona, mes, calculo } = objetivosDelMes();

  let cuerpo;
  let subtitulo;
  if (!persona) {
    subtitulo = 'Puntuación y ranking';
    cuerpo = '<p class="objetivos__vacio">Cuando dirección te dé de alta en objetivos verás aquí tu puntuación de cada mes y tu puesto en el ranking.</p>';
  } else if (!calculo) {
    subtitulo = nombreDeMes(mesActual()) + ' · pendiente de resultados';
    cuerpo = '<p class="objetivos__vacio">Tus metas ya están definidas. En cuanto dirección publique los resultados del mes, aquí saldrán tus puntos.</p>';
  } else {
    const puesto = puestoDe(objetivos, persona.id, mes);
    const pct = calculo.maximo ? Math.round((calculo.total / calculo.maximo) * 100) : 0;
    subtitulo = nombreDeMes(mes) + ' · resultados publicados';
    cuerpo =
      '<div class="objetivos__resumen">' +
        '<span class="objetivos__dato"><b>' + puntuacion(calculo.total) + '</b><small>de ' + puntuacion(calculo.maximo) + ' puntos</small></span>' +
        (puesto ? '<span class="objetivos__dato"><b>' + puesto.puesto + 'º</b><small>de ' + puesto.de + ' en el ranking</small></span>' : '') +
      '</div>' +
      '<div class="objetivos__barra"><span style="width:' + pct + '%"></span></div>' +
      '<div class="objetivos__lista">' +
        calculo.filas.slice(0, 4).map((f) =>
          '<div class="objetivo-mini">' +
            '<span class="objetivo-mini__txt">' + escapar(f.texto) + '</span>' +
            '<span class="objetivo-mini__barra"><i style="width:' + f.pct + '%"></i></span>' +
            '<b>' + (f.puntos === null ? '—' : puntuacion(f.puntos)) + '<small>/' + puntuacion(f.max) + '</small></b>' +
          '</div>'
        ).join('') +
      '</div>';
  }

  return (
    '<div class="objetivos">' +
      '<div class="objetivos__cab">' +
        '<span class="objetivos__ico">' + ico('diana') + '</span>' +
        '<div><strong>Tus objetivos</strong>' +
        '<small>' + subtitulo + '</small></div>' +
        '<a class="objetivos__todos" href="#/objetivos">Ver todo</a>' +
      '</div>' +
      cuerpo +
    '</div>'
  );
}

/* ── Mis objetivos: la página personal de cada empleado ──────── */
/* Filas de un mes: objetivo, meta frente a resultado y puntos. */
function filasObjetivos(calculo, persona) {
  return calculo.filas.map((f) => {
    const detalle = f.tipo === 'valoracion'
      ? 'Valoración de dirección'
      : 'Meta: ' + formatearMeta(f, objetivos, persona) +
        (f.resultado !== null ? ' · Conseguido: ' + formatearResultado(f.resultado, f.unidad) : '');
    return (
      '<div class="obj-fila' + (f.puntos === null ? ' obj-fila--sin' : '') + (f.pct >= 100 ? ' obj-fila--pleno' : '') + '">' +
        '<div class="obj-fila__txt"><strong>' + escapar(f.texto) + (f.extra ? ' <span class="pastilla pastilla--oro">Extra</span>' : '') + '</strong>' +
          '<small>' + detalle + '</small></div>' +
        '<div class="obj-fila__barra"><span style="width:' + f.pct + '%"></span></div>' +
        '<div class="obj-fila__pts"><b>' + (f.puntos === null ? '—' : puntuacion(f.puntos)) + '</b><small>/ ' + puntuacion(f.max) + '</small></div>' +
      '</div>'
    );
  }).join('');
}

/* Gráfica de barras con el total de cada mes. */
function evolucionObjetivos(persona, meses) {
  const orden = [...meses].sort();
  if (orden.length < 2) return '';
  return (
    '<section class="obj-evolucion">' +
      '<div class="seccion-tit"><h2>Tu evolución</h2></div>' +
      '<div class="obj-evolucion__barras">' +
        orden.map((mes) => {
          const c = calcularMes(objetivos, persona, mes);
          const pct = c.maximo ? Math.round((c.total / c.maximo) * 100) : 0;
          return (
            '<div class="obj-evolucion__mes" title="' + escapar(nombreDeMes(mes)) + ': ' + puntuacion(c.total) + ' de ' + puntuacion(c.maximo) + '">' +
              '<b>' + puntuacion(c.total) + '</b>' +
              '<span class="obj-evolucion__barra"><i style="height:' + Math.min(100, pct) + '%"></i></span>' +
              '<small>' + mesCorto(mes) + '</small>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
    '</section>'
  );
}

export function vistaMisObjetivos() {
  const nombre = nombreDePila();
  const persona = personaDeSesion(objetivos, sesion.usuario() || {});

  const cabecera = (datosCab, sub) =>
    '<div class="envoltorio">' +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Mis objetivos</h1>' +
          '<p class="pagina-cab__sub">' + sub + '</p>' +
        '</div>' +
        datosCab +
      '</div>';

  if (!persona) {
    return (
      cabecera('', 'Las metas de cada mes, lo conseguido y la puntuación, calculada sola.') +
        '<div class="objetivos" style="max-width:560px">' +
          '<div class="objetivos__cab">' +
            '<span class="objetivos__ico">' + ico('diana') + '</span>' +
            '<div><strong>Todavía no tienes ficha de objetivos</strong>' +
            '<small>La crea dirección en el panel de administración</small></div>' +
          '</div>' +
          '<p class="objetivos__vacio">Cuando dirección te dé de alta' + (nombre ? ', ' + escapar(nombre) + ',' : '') +
            ' verás aquí tus metas, tus resultados mes a mes y tu puesto en el ranking del equipo.</p>' +
        '</div>' +
      '</div>'
    );
  }

  const lista = objetivosDe(objetivos, persona);
  const maximo = lista.reduce((n, o) => n + o.max, 0);
  const metasHtml =
    '<section class="obj-metas">' +
      '<div class="seccion-tit"><h2>Tus metas</h2></div>' +
      '<p class="onb-nota" style="margin-top:0">Así se puntúa cada mes. Los objetivos con meta se calculan solos en proporción a lo conseguido, con tope en su máximo; el resto los valora dirección. En total, ' + puntuacion(maximo) + ' puntos.</p>' +
      '<div class="obj-metas__lista">' +
        lista.map((o) =>
          '<div class="obj-meta">' +
            '<span class="obj-meta__txt"><strong>' + escapar(o.texto) + '</strong><small>' + formatearMeta(o, objetivos, persona) + '</small></span>' +
            '<b>' + puntuacion(o.max) + ' pt</b>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</section>';

  const meses = mesesDe(objetivos, persona.id);
  if (!meses.length) {
    return (
      cabecera('', 'Hola' + (nombre ? ', ' + escapar(nombre) : '') + '. Estas son tus metas; los resultados los publica dirección cada mes.') +
        '<p class="objetivos__vacio" style="color:var(--tinta-3);max-width:60ch;margin-bottom:1.4rem">Todavía no hay resultados publicados. En cuanto dirección cierre el primer mes, aquí verás tu puntuación y tu puesto en el ranking.</p>' +
        metasHtml +
      '</div>'
    );
  }

  const ultimo = calcularMes(objetivos, persona, meses[0]);
  const puestoUltimo = puestoDe(objetivos, persona.id, meses[0]);
  const acumulado = rankingAcumulado(objetivos).find((f) => f.persona.id === persona.id);
  const datosCab =
    '<div class="itin-datos">' +
      '<span><small>' + escapar(nombreDeMes(meses[0])) + '</small><strong>' + puntuacion(ultimo.total) + ' / ' + puntuacion(ultimo.maximo) + '</strong></span>' +
      (puestoUltimo ? '<span><small>Puesto del mes</small><strong class="itin-datos__oro">' + puestoUltimo.puesto + 'º de ' + puestoUltimo.de + '</strong></span>' : '') +
      (acumulado ? '<span><small>Media del año</small><strong>' + puntuacion(acumulado.media) + '</strong></span>' : '') +
      '<span><small>Meses puntuados</small><strong>' + meses.length + '</strong></span>' +
    '</div>';

  const bloques = meses.map((mes, i) => {
    const c = i === 0 ? ultimo : calcularMes(objetivos, persona, mes);
    const puesto = i === 0 ? puestoUltimo : puestoDe(objetivos, persona.id, mes);
    const pct = c.maximo ? Math.round((c.total / c.maximo) * 100) : 0;
    return (
      '<details class="obj-mes' + (i === 0 ? ' obj-mes--actual' : '') + '"' + (i === 0 ? ' open' : '') + '>' +
        '<summary class="obj-mes__cab">' +
          '<h2>' + nombreDeMes(mes) + '</h2>' +
          (i === 0 ? '<span class="pastilla pastilla--oro">Último publicado</span>' : '') +
          (puesto ? '<span class="pastilla' + (puesto.puesto === 1 ? ' pastilla--ok' : '') + '">' + (puesto.puesto === 1 ? ico('trofeo') : '') + puesto.puesto + 'º de ' + puesto.de + '</span>' : '') +
          '<span class="obj-mes__cuenta">' + puntuacion(c.total) + ' / ' + puntuacion(c.maximo) + '</span>' +
          ico('chevronAbajo', 'obj-mes__flecha') +
        '</summary>' +
        '<div class="obj-mes__barra"><span style="width:' + pct + '%"></span></div>' +
        (c.ajustado
          ? '<p class="obj-mes__ajuste">' + ico('info') + 'Puntuación final publicada por dirección: <b>' + puntuacion(c.total) + '</b>' +
              (c.conDetalle ? ' · el detalle por objetivos suma ' + puntuacion(c.calculado) : '') + '</p>'
          : '') +
        (c.conDetalle
          ? '<div class="obj-filas">' + filasObjetivos(c, persona) + '</div>'
          : '<p class="objetivos__vacio" style="color:var(--tinta-3);padding:.6rem 1.25rem 1rem">Este mes no hay detalle por objetivos, solo la puntuación final.</p>') +
      '</details>'
    );
  }).join('');

  return (
    cabecera(datosCab, 'Hola' + (nombre ? ', ' + escapar(nombre) : '') + '. Tus metas, lo conseguido cada mes y la puntuación, calculada sola a partir de los resultados que publica dirección.') +
      bloques +
      evolucionObjetivos(persona, meses) +
      metasHtml +
    '</div>'
  );
}

/* ── Equipo: empleado del mes y tablón ───────────────────────── */
const TIPOS_TABLON = {
  evento:      { texto: 'Evento',      icono: 'calendario', clase: 'tab-anuncio__ico--evento' },
  aviso:       { texto: 'Aviso',       icono: 'campana',    clase: 'tab-anuncio__ico--aviso' },
  celebracion: { texto: 'Celebración', icono: 'trofeo',     clase: 'tab-anuncio__ico--celebracion' }
};

export function vistaEquipo(mesElegido) {
  const edm = equipo.empleadosDelMes[0];
  const historial = equipo.empleadosDelMes.slice(1, 7);

  const avatarDe = (p, clase) => p.foto
    ? '<span class="' + clase + '"><img src="' + escapar(p.foto) + '" alt=""></span>'
    : '<span class="' + clase + '">' + escapar(p.iniciales || (p.nombre || '?').slice(0, 2).toUpperCase()) + '</span>';

  const destacado = edm
    ? '<div class="edm">' +
        '<div class="edm__aura" aria-hidden="true"></div>' +
        '<span class="edm__cinta">' + ico('trofeo') + 'Empleado/a del mes · ' + nombreDeMes(edm.mes) + '</span>' +
        avatarDe(edm, 'edm__avatar') +
        '<h2>' + escapar(edm.nombre) + '</h2>' +
        '<p>' + escapar(edm.motivo || '') + '</p>' +
      '</div>'
    : '<div class="edm edm--vacio">' +
        '<span class="edm__cinta">' + ico('trofeo') + 'Empleado/a del mes</span>' +
        '<p class="objetivos__vacio">Todavía no se ha publicado el primer reconocimiento. Se anunciará aquí y en la campana de avisos.</p>' +
      '</div>';

  const historialHtml = historial.length
    ? '<div class="seccion-tit" style="margin-top:1.6rem"><h2>Reconocimientos anteriores</h2></div>' +
      '<div class="edm-historial">' +
        historial.map((p) =>
          '<div class="edm-mini">' +
            avatarDe(p, 'edm-mini__avatar') +
            '<div><strong>' + escapar(p.nombre) + '</strong><small>' + nombreDeMes(p.mes) + '</small></div>' +
          '</div>'
        ).join('') +
      '</div>'
    : '';

  const anuncios = equipo.tablon.length
    ? equipo.tablon.map((an) => {
        const tipo = TIPOS_TABLON[an.tipo] || TIPOS_TABLON.aviso;
        return (
          '<article class="tab-anuncio">' +
            '<span class="tab-anuncio__ico ' + tipo.clase + '">' + ico(tipo.icono) + '</span>' +
            '<div class="tab-anuncio__txt">' +
              '<span class="tab-anuncio__meta">' +
                '<span class="pastilla">' + tipo.texto + '</span>' +
                '<span class="nov-tarjeta__fecha">' + formatearFecha(an.fecha) + '</span>' +
              '</span>' +
              '<strong>' + escapar(an.titulo) + '</strong>' +
              (an.md ? '<div class="prosa prosa--compacta">' + render(an.md) + '</div>' : '') +
            '</div>' +
          '</article>'
        );
      }).join('')
    : '<p class="objetivos__vacio">El tablón está vacío. Los eventos, avisos y celebraciones del despacho aparecerán aquí.</p>';

  // Ranking: calculado a partir de los objetivos del mes elegido (o el
  // último publicado); si todavía no hay resultados, el manual de RRHH.
  const mesesRk = mesesConDatos(objetivos);
  const mesRanking = mesesRk.includes(mesElegido) ? mesElegido : (mesesRk[mesesRk.length - 1] || '');
  const rk = equipo.ranking || { actualizado: '', personas: [] };
  const clasificados = mesRanking
    ? rankingDe(objetivos, mesRanking).map((c) => ({
        nombre: c.persona.nombre, iniciales: '', foto: fotoDePersonaObjetivos(c.persona),
        puntos: c.total, maximo: c.maximo
      }))
    : [...(rk.personas || [])].sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
  const acumulado = mesRanking ? rankingAcumulado(objetivos) : [];
  let rankingHtml = '';
  if (clasificados.length) {
    const podio = clasificados.slice(0, 3);
    const resto = clasificados.slice(3);
    // Quién sube y quién baja respecto al mes publicado anterior.
    const indiceMes = mesesRk.indexOf(mesRanking);
    const mesPrevio = indiceMes > 0 ? mesesRk[indiceMes - 1] : '';
    const previos = mesPrevio ? rankingDe(objetivos, mesPrevio) : [];
    const deltaDe = (p, puesto) => {
      if (!mesPrevio) return '';
      const antes = previos.find((c) => c.persona.nombre === p.nombre);
      if (!antes) return '<span class="rk-delta rk-delta--nuevo" title="No estaba el mes anterior">nuevo</span>';
      const d = antes.puesto - puesto;
      if (d > 0) return '<span class="rk-delta rk-delta--sube" title="Sube ' + d + (d === 1 ? ' puesto' : ' puestos') + '">&#9650; ' + d + '</span>';
      if (d < 0) return '<span class="rk-delta rk-delta--baja" title="Baja ' + (-d) + (d === -1 ? ' puesto' : ' puestos') + '">&#9660; ' + (-d) + '</span>';
      return '<span class="rk-delta rk-delta--igual" title="Se mantiene">=</span>';
    };
    const maxPuntos = Math.max(1, ...clasificados.map((p) => Number(p.maximo) || 11));
    const contador = (n) => '<span data-contar="' + (Number(n) || 0) + '" data-decimales="2">' + puntuacion(n) + '</span>';
    // Chispas que titilan alrededor del podio (solo decoración).
    let chispas = '';
    for (let i = 0; i < 16; i++) {
      chispas += '<i class="rk-chispa" style="--x:' + (3 + ((i * 37) % 94)) + '%;--y:' + (5 + ((i * 53) % 72)) + '%;--d:' +
        ((i % 6) * 0.55).toFixed(2) + 's;--t:' + (2 + (i % 3)) + 'px" aria-hidden="true"></i>';
    }
    // El podio se pinta 2º · 1º · 3º, como en los juegos.
    const orden = [podio[1], podio[0], podio[2]].filter(Boolean);
    const corona = '<span class="podio__corona" aria-hidden="true">' + ico('corona') + '</span>';
    const podioHtml = orden.map((p) => {
      const puesto = clasificados.indexOf(p) + 1;
      return (
        '<div class="podio__puesto podio__puesto--' + puesto + '">' +
          (puesto === 1 ? corona : '<div class="podio__medalla">' + puesto + '</div>') +
          '<span class="podio__aro">' + avatarDe(p, 'podio__avatar') + '</span>' +
          '<strong>' + escapar(p.nombre) + '</strong>' +
          '<span class="podio__puntos">' + contador(p.puntos) + (p.maximo ? '<small>/ ' + puntuacion(p.maximo) + '</small>' : '') + '</span>' +
          deltaDe(p, puesto) +
          '<div class="podio__peana"><b>' + puesto + '</b></div>' +
        '</div>'
      );
    }).join('');
    const restoHtml = resto.map((p, i) =>
      '<div class="rk-fila" style="--i:' + i + '">' +
        '<span class="rk-fila__n">' + (i + 4) + '</span>' +
        avatarDe(p, 'rk-fila__avatar') +
        '<span class="rk-fila__txt"><strong>' + escapar(p.nombre) + '</strong>' +
          '<span class="rk-fila__barra"><i style="--w:' + Math.round(((Number(p.puntos) || 0) / maxPuntos) * 100) + '%"></i></span></span>' +
        deltaDe(p, i + 4) +
        '<span class="rk-fila__puntos">' + contador(p.puntos) + '</span>' +
      '</div>'
    ).join('');
    const acumuladoHtml = acumulado.length > 1
      ? '<div class="rk-acumulado">' +
          '<div class="rk-acumulado__cab"><strong>Acumulado del año</strong><small>Media de los meses puntuados</small></div>' +
          acumulado.map((f, i) =>
            '<div class="rk-acumulado__fila' + (f.puesto === 1 ? ' rk-acumulado__fila--primero' : '') + '" style="--i:' + i + '">' +
              '<span class="rk-acumulado__n">' + f.puesto + '</span>' +
              '<strong>' + escapar(f.persona.nombre) + '</strong>' +
              '<small>' + f.meses + (f.meses === 1 ? ' mes' : ' meses') + '</small>' +
              '<span class="rk-acumulado__barra"><i style="width:' + Math.min(100, Math.round((f.media / 11) * 100)) + '%"></i></span>' +
              '<b>' + puntuacion(f.media) + '</b>' +
            '</div>'
          ).join('') +
        '</div>'
      : '';
    // Pestañas con los meses publicados, del más reciente al más antiguo.
    const mesesHtml = mesesRk.length > 1
      ? '<nav class="rk-meses" aria-label="Ranking por meses">' +
          [...mesesRk].reverse().map((m) =>
            '<a class="rk-meses__item' + (m === mesRanking ? ' rk-meses__item--activo' : '') + '" href="#/equipo/' + m + '"' +
              (m === mesRanking ? ' aria-current="page"' : '') + '>' + NOMBRES_MES[Number(m.split('-')[1]) - 1] +
              (new Set(mesesRk.map((x) => x.slice(0, 4))).size > 1 ? ' ' + m.slice(0, 4) : '') + '</a>'
          ).join('') +
        '</nav>'
      : '';
    rankingHtml =
      '<section class="rk">' +
        '<div class="seccion-tit seccion-tit--fila"><h2>' + (mesRanking ? 'Ranking de objetivos' : 'Ranking de formación') + '</h2>' +
          (mesRanking
            ? '<span class="rk__fecha">' + escapar(nombreDeMes(mesRanking)) + '</span>'
            : (rk.actualizado ? '<span class="rk__fecha">Actualizado el ' + formatearFecha(rk.actualizado) + '</span>' : '')) +
        '</div>' +
        mesesHtml +
        '<div class="rk-escenario">' +
          '<span class="rk-escenario__aurora rk-escenario__aurora--1" aria-hidden="true"></span>' +
          '<span class="rk-escenario__aurora rk-escenario__aurora--2" aria-hidden="true"></span>' +
          '<span class="rk-escenario__haz" aria-hidden="true"></span>' +
          chispas +
          '<div class="podio">' + podioHtml + '</div>' +
        '</div>' +
        (restoHtml ? '<div class="rk-lista">' + restoHtml + '</div>' : '') +
        acumuladoHtml +
        '<p class="onb-nota">' + (mesRanking
          ? 'Se calcula solo con los resultados de objetivos que publica dirección cada mes. Cada persona ve el detalle de los suyos en «Mis objetivos».'
          : 'Lo publica RRHH periódicamente a partir de los puntos de formación de cada persona.') + '</p>' +
      '</section>';
  } else {
    rankingHtml =
      '<section class="rk">' +
        '<div class="seccion-tit"><h2>Ranking de objetivos</h2></div>' +
        '<p class="objetivos__vacio" style="color:var(--tinta-3)">En cuanto dirección publique los resultados del primer mes, la clasificación del equipo se calculará sola y aparecerá aquí.</p>' +
      '</section>';
  }

  const directorio = directorioEquipo();

  const SEDES = [
    { foto: 'madrid.jpg', nombre: 'Madrid' },
    { foto: 'alicante.jpg', nombre: 'Alicante' },
    { foto: 'valencia.jpg', nombre: 'Valencia' },
    { foto: 'marbella.jpg', nombre: 'Marbella' },
    { foto: 'londres.jpg', nombre: 'Londres' },
    { foto: 'buenos-aires.jpg', nombre: 'Buenos Aires' },
    { foto: 'mexico.jpg', nombre: 'México' }
  ];
  const presencia =
    '<section class="sedes-bloque">' +
      '<div class="seccion-tit"><h2>Nuestra presencia</h2></div>' +
      '<p class="onb-nota" style="margin-top:0">Oficinas en Madrid, Alicante, Valencia, Marbella y Londres, y presencia en Buenos Aires, Bogotá, Medellín y Ciudad de México.</p>' +
      '<div class="sedes">' +
        '<figure class="sede sede--grande">' +
          '<img src="assets/img/marca/recepcion.jpg" alt="Recepción del despacho" loading="lazy">' +
          '<figcaption>La oficina</figcaption>' +
        '</figure>' +
        SEDES.map((s) =>
          '<figure class="sede">' +
            '<img src="assets/img/marca/' + s.foto + '" alt="' + escapar(s.nombre) + '" loading="lazy">' +
            '<figcaption>' + escapar(s.nombre) + '</figcaption>' +
          '</figure>'
        ).join('') +
      '</div>' +
    '</section>';

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('despacho', '#/equipo') +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Equipo</h1>' +
          '<p class="pagina-cab__sub">La vida interna del despacho: reconocimientos, ranking, eventos y avisos.</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel-columnas">' +
        '<section class="panel-col panel-col--estrecha">' +
          destacado +
          historialHtml +
        '</section>' +
        '<section class="panel-col">' +
          rankingHtml +
          '<div class="seccion-tit" style="margin-top:1.6rem"><h2>Tablón del despacho</h2></div>' +
          '<div class="tab-lista">' + anuncios + '</div>' +
        '</section>' +
      '</div>' +
      directorio +
      presencia +
    '</div>'
  );
}

/* Quién es quién: las personas dadas de alta en el panel. */
function directorioEquipo() {
  const lista = personasActivas();
  if (!lista.length) return '';
  const fichas = lista.map((p) => {
    const perfil = perfilDe(p.correo) || {};
    const foto = fotoDe(p.correo, p);
    const puesto = perfil.puesto || p.puesto || 'Equipo';
    const sede = perfil.sede ? nombreSede(perfil.sede) : '';
    return (
      '<div class="ficha">' +
        '<span class="ficha__avatar" style="--h:' + tonoDe(p.correo) + '">' +
          (foto ? '<img src="' + escapar(foto) + '" alt="">' : escapar(inicialesDe(perfil.nombre || p.nombre))) + '</span>' +
        '<span class="ficha__txt"><strong>' + escapar(perfil.nombre || p.nombre) + '</strong>' +
          '<small>' + escapar(puesto) + (sede ? ' · ' + escapar(sede) : '') + '</small>' +
          (perfil.frase ? '<em class="ficha__frase">«' + escapar(perfil.frase) + '»</em>' : '') +
          (p.rol === 'administracion' ? '<span class="ficha__rol">' + ico('escudo') + 'Administra la plataforma</span>' : '') +
        '</span>' +
      '</div>'
    );
  }).join('');
  return (
    '<section class="directorio-bloque">' +
      '<div class="seccion-tit"><h2>Quién es quién</h2></div>' +
      '<p class="onb-nota" style="margin-top:0">' + lista.length + (lista.length === 1 ? ' persona' : ' personas') + ' en el equipo. Si falta alguien o algo no es correcto, avisa a Coordinación.</p>' +
      '<div class="directorio">' + fichas + '</div>' +
    '</section>'
  );
}

/* ── Videoteca: todos los vídeos de la formación ─────────────── */
export function vistaVideoteca() {
  const conVideos = MODULOS.filter((m) => totalVideos(m));
  const total = MODULOS.reduce((s, m) => s + totalVideos(m), 0);
  const minutos = LECCIONES.filter(conVideo).reduce((s, l) => s + (Number(l.video.minutos) || 0), 0) +
    MODULOS.filter(conVideo).reduce((s, m) => s + (Number(m.video.minutos) || 0), 0);
  const vistosYa = LECCIONES.filter((l) => conVideo(l) && progreso.hecha(l.clave)).length;

  const tarjetaPresentacion = (mod) => {
    const info = interpretarVideo(mod.video.url);
    return (
      '<a class="vid vid--presentacion" href="#/modulo/' + mod.id + '">' +
        '<span class="vid__previa">' +
          (info.tipo === 'archivo'
            ? '<video src="' + escapar(info.src) + '#t=1" preload="metadata" muted playsinline aria-hidden="true"></video>'
            : '') +
          '<span class="vid__play">' + ico('play') + '</span>' +
          (mod.video.minutos ? '<span class="vid__dur">' + mod.video.minutos + ' min</span>' : '') +
        '</span>' +
        '<span class="vid__cuerpo">' +
          '<span class="vid__mod">Presentación del módulo</span>' +
          '<span class="vid__tit">' + escapar(mod.video.titulo || mod.titulo) + '</span>' +
          '<span class="vid__prov">' + escapar(info.proveedor) + '</span>' +
        '</span>' +
      '</a>'
    );
  };

  const grupos = conVideos.map((mod) =>
    '<section class="videoteca-grupo">' +
      '<div class="seccion-tit"><h2>Módulo ' + mod.num + ' · ' + escapar(mod.titulo) + '</h2>' +
        '<a class="seccion-tit__mas" href="#/modulo/' + mod.id + '">Abrir el módulo</a></div>' +
      '<div class="videoteca-rejilla">' +
        (conVideo(mod) ? tarjetaPresentacion(mod) : '') +
        videosDe(mod).map((lec) => {
          const info = interpretarVideo(lec.video.url);
          const hecha = progreso.hecha(mod.id + '/' + lec.id);
          return (
            '<a class="vid' + (hecha ? ' vid--vista' : '') + '" href="#/modulo/' + mod.id + '/' + lec.id + '">' +
              '<span class="vid__previa">' +
                (info.tipo === 'archivo'
                  ? '<video src="' + escapar(info.src) + '#t=1" preload="metadata" muted playsinline aria-hidden="true"></video>'
                  : '') +
                '<span class="vid__play">' + ico('play') + '</span>' +
                (lec.video.minutos ? '<span class="vid__dur">' + lec.video.minutos + ' min</span>' : '') +
                (hecha ? '<span class="vid__hecho">' + ico('tick') + 'Vista</span>' : '') +
              '</span>' +
              '<span class="vid__cuerpo">' +
                '<span class="vid__mod">Lección ' + (mod.lecciones.indexOf(lec) + 1) + '</span>' +
                '<span class="vid__tit">' + escapar(lec.video.titulo || lec.titulo) + '</span>' +
                '<span class="vid__prov">' + escapar(info.proveedor) + '</span>' +
              '</span>' +
            '</a>'
          );
        }).join('') +
      '</div>' +
    '</section>'
  ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('formacion', '#/videos') +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Videoteca</h1>' +
          '<p class="pagina-cab__sub">Toda la formación en vídeo, lección a lección. Pulsa uno y se abre en su lección, con los apuntes debajo.</p>' +
        '</div>' +
        (total
          ? '<div class="itin-datos">' +
              '<span><small>Vídeos</small><strong data-contar="' + total + '">' + total + '</strong></span>' +
              '<span><small>Vistos</small><strong class="itin-datos__oro">' + vistosYa + '</strong></span>' +
              (minutos ? '<span><small>Duración</small><strong>' + (minutos >= 60 ? Math.round(minutos / 60 * 10) / 10 + ' h' : minutos + ' min') + '</strong></span>' : '') +
            '</div>'
          : '') +
      '</div>' +
      (total
        ? grupos
        : '<div class="muro-vacio">' +
            '<span class="no-encontrada__ico" aria-hidden="true" style="margin:0 auto 1rem">' + ico('video') + '</span>' +
            'Todavía no hay vídeos en la formación. Se añaden desde el panel de administración, lección a lección, y aparecerán aquí al momento.' +
          '</div>') +
    '</div>'
  );
}

/* ── Modelos de documentos ───────────────────────────────────── */
function tamanoLegible(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
}

export function vistaModelos() {
  const categorias = [];
  for (const m of modelos) {
    const cat = m.categoria || 'General';
    let entrada = categorias.find((c) => c.nombre === cat);
    if (!entrada) { entrada = { nombre: cat, lista: [] }; categorias.push(entrada); }
    entrada.lista.push(m);
  }

  const secciones = categorias.map((cat) =>
    '<section class="mod-grupo">' +
      '<div class="seccion-tit"><h2>' + escapar(cat.nombre) + '</h2></div>' +
      '<div class="mod-rejilla">' +
        cat.lista.map((m) => {
          const extension = (m.archivo.split('.').pop() || '').toUpperCase();
          return (
            '<div class="modelo">' +
              '<span class="modelo__ico">' + ico('documento') +
                '<b>' + escapar(extension) + '</b></span>' +
              '<div class="modelo__txt">' +
                '<strong>' + escapar(m.titulo) + '</strong>' +
                (m.descripcion ? '<p>' + escapar(m.descripcion) + '</p>' : '') +
                '<small>' + tamanoLegible(m.bytes) +
                  (m.actualizado ? ' · actualizado el ' + formatearFecha(m.actualizado) : '') + '</small>' +
              '</div>' +
              '<a class="btn btn--oro modelo__boton" href="' + escapar(m.archivo) + '" download>' +
                ico('descarga') + 'Descargar</a>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
    '</section>'
  ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('despacho', '#/modelos') +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Modelos de documentos</h1>' +
          '<p class="pagina-cab__sub">Plantillas y escritos listos para usar. Descarga el modelo, haz tu copia y trabaja sobre ella.</p>' +
        '</div>' +
        (modelos.length
          ? '<div class="itin-datos"><span><small>Disponibles</small><strong>' + modelos.length + '</strong></span></div>'
          : '') +
      '</div>' +
      (modelos.length
        ? secciones
        : '<p class="objetivos__vacio" style="color:var(--tinta-3)">Todavía no hay modelos publicados. Se suben desde el panel de administración (pestaña Modelos) y aparecerán aquí al momento.</p>') +
      '<div class="llamada llamada--aviso" style="margin-top:1.6rem">' +
        '<div class="llamada__txt"><span class="llamada__tit">Recuerda</span>' +
        '<p>Los modelos son plantillas: nunca guardes en ellos datos de clientes ni los subas rellenos.</p></div>' +
      '</div>' +
    '</div>'
  );
}

/* ── Conecta: la red social interna del despacho ─────────────── */
export const TIPOS_MURO = {
  sugerencia:     { texto: 'Sugerencia',  emoji: '✍️', clase: 'tipo--sugerencia' },
  idea:           { texto: 'Idea',        emoji: '💡', clase: 'tipo--idea' },
  pregunta:       { texto: 'Pregunta',    emoji: '❓', clase: 'tipo--pregunta' },
  agradecimiento: { texto: 'Gracias',     emoji: '🙏', clase: 'tipo--agradecimiento' },
  celebracion:    { texto: 'Celebración', emoji: '🎉', clase: 'tipo--celebracion' },
  queja:          { texto: 'Queja',       emoji: '😤', clase: 'tipo--queja' },
  encuesta:       { texto: 'Encuesta',    emoji: '📊', clase: 'tipo--encuesta' }
};

/* Reacciones disponibles en cada publicación, en el orden en que
   se muestran. El servidor acepta exactamente estos identificadores. */
export const REACCIONES_MURO = {
  aplauso: { emoji: '👏', texto: 'Aplausos' },
  corazon: { emoji: '❤️', texto: 'Me encanta' },
  risa:    { emoji: '😂', texto: 'Me río' },
  idea:    { emoji: '💡', texto: 'Buena idea' },
  fuego:   { emoji: '🔥', texto: 'Fuego' },
  fiesta:  { emoji: '🎉', texto: 'A celebrar' }
};

export const EMOJIS_RAPIDOS = ['😀', '😂', '🙌', '👏', '🎉', '💡', '☕', '⚖️', '🚀', '❤️', '🔥', '🤝'];

/* Límite de caracteres de una publicación (el servidor recorta igual). */
export const MURO_MAX = 500;

export function tiempoRelativo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return 'hace ' + min + ' min';
  const h = Math.round(min / 60);
  if (h < 24) return 'hace ' + h + ' h';
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? 'ayer' : 'hace ' + d + ' días';
  return formatearFecha(String(iso).slice(0, 10));
}

const inicialesDe = (nombre) => {
  const partes = String(nombre || '?').trim().split(/\s+/);
  return ((partes[0] || '')[0] || '?').toUpperCase() +
         (partes.length > 1 ? ((partes[1] || '')[0] || '').toUpperCase() : '');
};

/* Alias al estilo de las redes: "Ana Pérez" -> "@ana.perez". */
export function aliasDe(nombre) {
  const base = String(nombre || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return '@' + (base || 'equipo');
}

/* Un tono de color estable por persona, a partir de su clave. */
export function tonoDe(clave) {
  let h = 0;
  for (const c of String(clave || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/* Foto de una persona: la que eligió en su perfil, si no la del
   panel, y si no nada (iniciales). */
export function fotoDe(clave, persona) {
  const perfil = perfilDe(clave);
  if (perfil && perfil.foto) return perfil.foto;
  const p = persona || personaPorCorreo(clave);
  if (p && p.foto) return p.foto;
  // Sin perfil ni cuenta: la foto de su ficha de objetivos, por correo o
  // por nombre de pila (así se ve también a quien entra sin cuenta).
  const c = String(clave || '');
  const deObjetivos = personaDeSesion(objetivos, {
    correo: c.includes('@') ? c : '',
    nombre: c.startsWith('nombre:') ? c.slice(7) : ((p && p.nombre) || '')
  });
  return (deObjetivos && deObjetivos.foto) || '';
}

export function avatarMuro(nombre, clave, clase = '') {
  const foto = fotoDe(clave);
  const interior = foto
    ? '<img src="' + escapar(foto) + '" alt="">'
    : escapar(inicialesDe(nombre));
  return '<span class="pub__avatar' + (clase ? ' ' + clase : '') + '" style="--h:' + tonoDe(clave || nombre) + '">' +
    interior + '</span>';
}

/* Etiquetas (#tema) que contiene un texto, en minúsculas. */
export function etiquetasDe(texto) {
  const encontradas = String(texto || '').match(/(^|\s)#([\p{L}\p{N}_]{2,30})/gu) || [];
  return encontradas.map((t) => t.trim().slice(1).toLowerCase());
}

/* Texto escapado con las #etiquetas y @menciones resaltadas. */
export function enriquecerTexto(texto) {
  return escapar(texto)
    .replace(/(^|\s)#([\p{L}\p{N}_]{2,30})/gu,
      '$1<button type="button" class="etiqueta" data-etiqueta="$2">#$2</button>')
    .replace(/(^|\s)@([\p{L}\p{N}_.]{2,30})/gu, '$1<span class="mencion">@$2</span>');
}

/* ── Piezas de una publicación ───────────────────────────────── */
function barraReacciones(pub, miClave) {
  const reacciones = pub.reacciones || {};
  return '<div class="reacciones">' +
    Object.entries(REACCIONES_MURO).map(([id, def]) => {
      const lista = Array.isArray(reacciones[id]) ? reacciones[id] : [];
      const mia = lista.includes(miClave);
      return (
        '<button type="button" class="reaccion' + (mia ? ' reaccion--mia' : '') + (lista.length ? ' reaccion--con' : '') +
          '" data-accion="reaccion-muro" data-id="' + escapar(pub.id) + '" data-tipo="' + id +
          '" title="' + def.texto + '" aria-pressed="' + mia + '">' +
          '<span class="reaccion__emoji">' + def.emoji + '</span>' +
          (lista.length ? '<span class="reaccion__n">' + lista.length + '</span>' : '') +
        '</button>'
      );
    }).join('') +
  '</div>';
}

function piezaEncuesta(pub, miClave) {
  const enc = pub.encuesta;
  if (!enc || !Array.isArray(enc.opciones) || !enc.opciones.length) return '';
  const total = enc.opciones.reduce((s, o) => s + (Array.isArray(o.votos) ? o.votos.length : 0), 0);
  const miVoto = enc.opciones.findIndex((o) => Array.isArray(o.votos) && o.votos.includes(miClave));
  const votado = miVoto !== -1;
  return (
    '<div class="encuesta' + (votado ? ' encuesta--votada' : '') + '">' +
      enc.opciones.map((o, i) => {
        const n = Array.isArray(o.votos) ? o.votos.length : 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          '<button type="button" class="encuesta__opcion' + (i === miVoto ? ' encuesta__opcion--mia' : '') +
            '" data-accion="votar-muro" data-id="' + escapar(pub.id) + '" data-opcion="' + i + '">' +
            '<span class="encuesta__barra" style="width:' + (votado ? pct : 0) + '%"></span>' +
            '<span class="encuesta__texto">' + escapar(o.texto) + '</span>' +
            (votado ? '<span class="encuesta__pct">' + pct + '%</span>' : '') +
          '</button>'
        );
      }).join('') +
      '<span class="encuesta__total">' + (total === 1 ? '1 voto' : total + ' votos') +
        (votado ? ' · toca otra opción para cambiar tu voto' : ' · vota para ver los resultados') + '</span>' +
    '</div>'
  );
}

function piezaRespuestas(pub, miClave, puedoModerar) {
  const lista = Array.isArray(pub.respuestas) ? pub.respuestas : [];
  const nombrePila = String(pub.nombre || '').split(' ')[0];
  const items = lista.map((r) =>
    '<div class="resp" id="resp-' + escapar(r.id) + '">' +
      avatarMuro(r.nombre, r.clave, 'pub__avatar--mini') +
      '<div class="resp__cuerpo">' +
        '<span class="resp__cab"><strong>' + escapar(r.nombre) + '</strong>' +
          '<span class="pub__cuando">' + tiempoRelativo(r.fecha) + '</span>' +
          ((r.clave === miClave || puedoModerar)
            ? '<button type="button" class="pub__borrar" data-accion="borrar-respuesta-muro" data-id="' +
                escapar(pub.id) + '" data-rid="' + escapar(r.id) + '">Borrar</button>'
            : '') +
        '</span>' +
        '<p>' + enriquecerTexto(r.texto) + '</p>' +
      '</div>' +
    '</div>'
  ).join('');
  return (
    '<div class="hilo" id="hilo-' + escapar(pub.id) + '" hidden>' +
      items +
      '<div class="hilo__redactor">' +
        '<textarea id="resp-texto-' + escapar(pub.id) + '" maxlength="300" rows="1" placeholder="Responde a ' +
          escapar(nombrePila) + '…"></textarea>' +
        '<button type="button" class="btn btn--oro btn--mini" data-accion="enviar-respuesta-muro" data-id="' +
          escapar(pub.id) + '" aria-label="Enviar la respuesta">' + ico('enviar') + '</button>' +
      '</div>' +
    '</div>'
  );
}

export function piezaPublicacion(pub, miClave, puedoModerar) {
  const tipo = TIPOS_MURO[pub.tipo] || TIPOS_MURO.sugerencia;
  const mio = pub.clave === miClave;
  const nResp = Array.isArray(pub.respuestas) ? pub.respuestas.length : 0;
  return (
    '<article class="pub pub--' + escapar(pub.tipo || 'sugerencia') + '" id="pub-' + escapar(pub.id) +
      '" data-id="' + escapar(pub.id) + '">' +
      avatarMuro(pub.nombre, pub.clave) +
      '<div class="pub__cuerpo">' +
        '<header class="pub__cab">' +
          '<strong>' + escapar(pub.nombre) + '</strong>' +
          '<span class="pub__alias">' + escapar(aliasDe(pub.nombre)) + '</span>' +
          '<span class="pub__tipo ' + tipo.clase + '">' + tipo.emoji + ' ' + tipo.texto + '</span>' +
          '<span class="pub__cuando">· ' + tiempoRelativo(pub.fecha) + '</span>' +
          ((mio || puedoModerar)
            ? '<button type="button" class="pub__borrar" data-accion="borrar-muro" data-id="' + escapar(pub.id) +
                '" title="' + (mio ? 'Borrar mi publicación' : 'Moderar: borrar') + '" aria-label="Borrar">' +
                ico('papelera') + '</button>'
            : '') +
        '</header>' +
        (pub.texto ? '<p class="pub__texto">' + enriquecerTexto(pub.texto) + '</p>' : '') +
        (pub.foto
          ? '<a class="pub__foto" href="' + escapar(pub.foto) + '" target="_blank" rel="noopener">' +
              '<img src="' + escapar(pub.foto) + '" alt="Foto de la publicación" loading="lazy"></a>'
          : '') +
        piezaEncuesta(pub, miClave) +
        '<footer class="pub__pie">' +
          barraReacciones(pub, miClave) +
          '<button type="button" class="pub__responder' + (nResp ? ' pub__responder--con' : '') +
            '" data-accion="responder-muro" data-id="' + escapar(pub.id) + '">' +
            ico('conecta') + '<span>' + (nResp ? (nResp === 1 ? '1 respuesta' : nResp + ' respuestas') : 'Responder') + '</span>' +
          '</button>' +
        '</footer>' +
        piezaRespuestas(pub, miClave, puedoModerar) +
      '</div>' +
      '<span class="pub__corazon-grande" aria-hidden="true">❤️</span>' +
    '</article>'
  );
}

/* Anuncios oficiales que se mezclan en el hilo de Conecta. */
export function elementosOficiales() {
  const lista = [];

  novedades.forEach((nov) => {
    lista.push({
      id: 'nov-' + nov.fecha + '-' + nov.titulo.slice(0, 20),
      fecha: nov.fecha + 'T12:00:00.000Z',
      etiqueta: 'Novedad',
      titulo: nov.titulo,
      detalle: extracto(nov.md, 180),
      ruta: '#/novedades'
    });
  });

  (equipo.tablon || []).forEach((an) => {
    const tipo = TIPOS_TABLON[an.tipo] || TIPOS_TABLON.aviso;
    lista.push({
      id: 'tab-' + an.fecha + '-' + an.titulo.slice(0, 20),
      fecha: an.fecha + 'T11:00:00.000Z',
      etiqueta: tipo.texto,
      titulo: an.titulo,
      detalle: extracto(an.md, 180),
      ruta: '#/equipo'
    });
  });

  (equipo.empleadosDelMes || []).forEach((p) => {
    lista.push({
      id: 'edm-' + p.mes,
      fecha: p.mes + '-28T10:00:00.000Z',
      etiqueta: 'Empleado/a del mes',
      titulo: p.nombre + ', empleado/a del mes de ' + nombreDeMes(p.mes).split(' de ')[0],
      detalle: p.motivo || '',
      ruta: '#/equipo'
    });
  });

  const rk = equipo.ranking;
  if (rk && rk.actualizado && (rk.personas || []).length) {
    const primero = [...rk.personas].sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];
    lista.push({
      id: 'rk-' + rk.actualizado,
      fecha: rk.actualizado + 'T10:30:00.000Z',
      etiqueta: 'Ranking',
      titulo: 'Ranking de formación actualizado',
      detalle: 'Primer puesto: ' + primero.nombre + '. La clasificación completa está en Equipo.',
      ruta: '#/equipo'
    });
  }

  return lista;
}

export function piezaOficial(item) {
  return (
    '<article class="pub pub--oficial">' +
      '<span class="pub__avatar pub__avatar--oficial"><img src="assets/img/insignia.jpg" alt=""></span>' +
      '<div class="pub__cuerpo">' +
        '<header class="pub__cab">' +
          '<strong>Díaz &amp; Asociados</strong>' +
          '<span class="pub__verificado" title="Cuenta oficial del despacho">' + ico('escudo') + '</span>' +
          '<span class="pub__tipo tipo--oficial">' + escapar(item.etiqueta) + '</span>' +
          '<span class="pub__cuando">· ' + tiempoRelativo(item.fecha) + '</span>' +
        '</header>' +
        '<p class="pub__texto"><strong>' + escapar(item.titulo) + '</strong>' +
          (item.detalle ? '<br>' + escapar(item.detalle) : '') + '</p>' +
        '<footer class="pub__pie">' +
          '<a class="pub__enlace" href="' + escapar(item.ruta) + '">Abrir' + ico('flecha') + '</a>' +
        '</footer>' +
      '</div>' +
    '</article>'
  );
}

/* Tarjetas fantasma mientras llega el hilo del servidor. */
export function esqueletoMuro(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s +=
      '<div class="esqueleto" aria-hidden="true">' +
        '<i class="esqueleto__avatar"></i>' +
        '<div class="esqueleto__cuerpo">' +
          '<i class="esqueleto__linea esqueleto__linea--corta"></i>' +
          '<i class="esqueleto__linea"></i>' +
          '<i class="esqueleto__linea esqueleto__linea--media"></i>' +
        '</div>' +
      '</div>';
  }
  return s;
}

/* ── Lateral de Conecta ──────────────────────────────────────── */
export function widgetTendencias(publicaciones) {
  const cuenta = {};
  (publicaciones || []).forEach((p) => {
    etiquetasDe(p.texto).forEach((t) => { cuenta[t] = (cuenta[t] || 0) + 1; });
  });
  const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    '<h3>' + ico('fuego') + 'Tendencias</h3>' +
    (top.length
      ? '<ul class="tendencias">' + top.map(([t, n], i) =>
          '<li><button type="button" class="tendencia" data-etiqueta="' + escapar(t) + '">' +
            '<span class="tendencia__n">' + (i + 1) + '</span>' +
            '<span class="tendencia__txt"><strong>#' + escapar(t) + '</strong>' +
              '<small>' + n + (n === 1 ? ' publicación' : ' publicaciones') + '</small></span>' +
          '</button></li>'
        ).join('') + '</ul>'
      : '<p class="widget__vacio">Todavía no hay etiquetas. Escribe #cafe o #ideas en una publicación y aparecerá aquí.</p>')
  );
}

/* Puntos del mes: 3 por publicar, 2 por responder y 1 por cada
   reacción recibida. Solo cuentan los últimos 30 días. */
export function widgetActivos(publicaciones) {
  const desde = Date.now() - 30 * 86400000;
  const tabla = {};
  const fila = (nombre, clave) => tabla[clave] || (tabla[clave] = { nombre, clave, puntos: 0 });
  (publicaciones || []).forEach((p) => {
    if (new Date(p.fecha).getTime() < desde) return;
    const r = fila(p.nombre, p.clave);
    r.puntos += 3;
    Object.values(p.reacciones || {}).forEach((l) => { if (Array.isArray(l)) r.puntos += l.length; });
    (p.respuestas || []).forEach((x) => { fila(x.nombre, x.clave).puntos += 2; });
  });
  const top = Object.values(tabla).sort((a, b) => b.puntos - a.puntos).slice(0, 5);
  const medallas = ['🥇', '🥈', '🥉'];
  return (
    '<h3>' + ico('trofeo') + 'Más activos del mes</h3>' +
    (top.length
      ? '<ul class="activos">' + top.map((p, i) =>
          '<li>' + avatarMuro(p.nombre, p.clave, 'pub__avatar--mini') +
            '<span class="activos__txt"><strong>' + escapar(p.nombre) + '</strong>' +
              '<small>' + p.puntos + (p.puntos === 1 ? ' punto' : ' puntos') + '</small></span>' +
            '<span class="activos__medalla">' + (medallas[i] || '') + '</span>' +
          '</li>'
        ).join('') + '</ul>'
      : '<p class="widget__vacio">Publica, responde o reacciona y aparecerás aquí.</p>')
  );
}

export function widgetDado() {
  return (
    '<div class="widget widget--dado">' +
      '<h3>' + ico('chispa') + 'Lección sorpresa</h3>' +
      '<p>¿Cinco minutos libres? Te abrimos una lección al azar del itinerario.</p>' +
      '<button type="button" class="btn btn--oro btn--bloque" data-accion="dado-formacion">🎲 Sorpréndeme</button>' +
    '</div>'
  );
}

export function vistaMuro() {
  const autor = autorMuro.de();
  const chips = Object.entries(TIPOS_MURO)
    .filter(([id]) => id !== 'encuesta')
    .map(([id, t], i) =>
      '<button type="button" class="muro-chip' + (i === 0 ? ' muro-chip--activo' : '') +
        '" data-tipo-muro="' + id + '">' + t.emoji + ' ' + t.texto + '</button>'
    ).join('');
  const emojis = EMOJIS_RAPIDOS.map((e) =>
    '<button type="button" class="emoji-rapido" data-emoji="' + e + '" aria-label="Insertar ' + e + '">' + e + '</button>'
  ).join('');
  const pestanas = [['todo', 'Para ti'], ['equipo', 'Equipo'], ['oficial', 'Oficial'], ['encuesta', 'Encuestas']]
    .map(([id, t], i) =>
      '<button type="button" class="conecta__pestana' + (i === 0 ? ' conecta__pestana--activa' : '') +
        '" data-pestana-muro="' + id + '">' + t + '</button>'
    ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho conecta">' +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Conecta <span class="conecta__vivo"><i></i>En directo</span></h1>' +
          '<p class="pagina-cab__sub">La red del despacho: cuenta, pregunta, celebra y reacciona. Usa #etiquetas para agrupar temas y @nombre para mencionar a alguien.</p>' +
        '</div>' +
      '</div>' +

      '<div class="conecta__cuerpo">' +
        '<section class="conecta__feed">' +
          '<nav class="conecta__pestanas" id="conecta-pestanas" aria-label="Filtros del hilo">' + pestanas + '</nav>' +

          '<div class="redactor" id="muro-redactor">' +
            avatarMuro(autor ? autor.nombre : '?', autor ? autor.clave : 'anonimo') +
            '<div class="redactor__cuerpo">' +
              (autor
                ? '<div class="redactor__quien">Publicas como <strong>' + escapar(autor.nombre) + '</strong> ' +
                    '<span class="pub__alias">' + escapar(aliasDe(autor.nombre)) + '</span></div>'
                : '<input type="text" id="muro-nombre" class="redactor__nombre" maxlength="60" placeholder="Tu nombre (solo la primera vez)">') +
              '<textarea id="muro-texto" maxlength="' + MURO_MAX + '" rows="2" placeholder="¿Qué está pasando en el despacho?"></textarea>' +
              '<div class="redactor__emojis" aria-label="Emojis rápidos">' + emojis + '</div>' +
              '<div class="encuesta-editor" id="encuesta-editor" hidden>' +
                '<div class="encuesta-editor__cab"><span>📊 Encuesta</span>' +
                  '<button type="button" class="pub__borrar" data-accion="encuesta-muro">Quitar</button></div>' +
                '<div id="encuesta-opciones">' +
                  '<input type="text" class="encuesta-editor__opcion" maxlength="60" placeholder="Opción 1">' +
                  '<input type="text" class="encuesta-editor__opcion" maxlength="60" placeholder="Opción 2">' +
                '</div>' +
                '<button type="button" class="encuesta-editor__mas" data-accion="encuesta-opcion-mas">+ Añadir opción</button>' +
              '</div>' +
              '<div class="muro-adjunto" id="muro-adjunto" hidden>' +
                '<img id="muro-adjunto-img" alt="Foto adjunta">' +
                '<button type="button" class="muro-adjunto__quitar" data-accion="quitar-foto-muro" aria-label="Quitar la foto">&times;</button>' +
              '</div>' +
              '<div class="redactor__pie">' +
                '<div class="muro-chips" id="muro-chips">' + chips + '</div>' +
                '<div class="redactor__botones">' +
                  '<label class="redactor__herr" title="Adjuntar una foto">' + ico('foto') +
                    '<input type="file" id="muro-foto" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label>' +
                  '<button type="button" class="redactor__herr" data-accion="encuesta-muro" title="Crear una encuesta" aria-label="Crear una encuesta">' + ico('grafica') + '</button>' +
                  '<span class="contador" id="muro-contador" style="--p:0" title="Caracteres disponibles"><i></i><b>' + MURO_MAX + '</b></span>' +
                  '<button type="button" class="btn btn--oro" data-accion="publicar-muro">Publicar' + ico('enviar') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<button type="button" class="muro-nuevas" id="muro-nuevas" data-accion="cargar-nuevas-muro" hidden>' +
            ico('subir') + '<span>Hay publicaciones nuevas</span></button>' +
          '<div class="muro-filtro" id="muro-filtro" hidden></div>' +
          '<div id="muro-feed" class="muro-feed">' + esqueletoMuro(3) + '</div>' +
          '<div id="muro-centinela" class="muro-centinela" aria-hidden="true"></div>' +
        '</section>' +

        '<aside class="conecta__lateral">' +
          '<div class="widget" id="widget-tendencias">' + widgetTendencias([]) + '</div>' +
          '<div class="widget" id="widget-activos">' + widgetActivos([]) + '</div>' +
          widgetDado() +
          '<div class="widget widget--normas">' +
            '<h3>' + ico('escudo') + 'Las normas de la casa</h3>' +
            '<ul><li>Lo que se cuenta aquí, se queda aquí.</li>' +
            '<li>Nunca datos de clientes ni de expedientes.</li>' +
            '<li>Se critican ideas, no personas.</li>' +
            '<li>El humor es bienvenido. El sarcasmo, menos.</li></ul>' +
          '</div>' +
        '</aside>' +
      '</div>' +
    '</div>'
  );
}

/* ── Mi perfil: foto, datos y preferencias de cada persona ───── */
export function vistaPerfil() {
  const u = sesion.usuario() || {};
  const autor = autorMuro.de();                 // null si aún no hay nombre (sin Google)
  const clave = autor ? autor.clave : '';
  const perfil = (clave && perfilDe(clave)) || {};
  const persona = personaPorCorreo(clave) || {};
  const nombre = perfil.nombre || (autor && autor.nombre) || persona.nombre || '';
  const foto = perfil.foto || persona.foto || '';
  const puesto = perfil.puesto || persona.puesto || '';
  const prefs = preferencias.todas();
  const temaElegido = tema.guardado() || 'auto';
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  const puntos = hechas * XP_LECCION;
  const racha = rachaDias();
  const ganadas = insignias().filter((i) => i.ganada);

  const campo = (etiqueta, control, ancho) =>
    '<label class="perfil__campo' + (ancho ? ' perfil__campo--ancho' : '') + '"><span>' + etiqueta + '</span>' + control + '</label>';
  const segmentos = (pref, valor, opciones) =>
    '<div class="segmentos" role="group">' + opciones.map(([v, t]) =>
      '<button type="button" class="segmento' + (v === valor ? ' segmento--activo' : '') +
        '" data-pref="' + pref + '" data-valor="' + v + '" aria-pressed="' + (v === valor) + '">' + t + '</button>'
    ).join('') + '</div>';
  const conmutador = (atributos, activo, texto, ayuda) =>
    '<label class="conmutador"><input type="checkbox" ' + atributos + (activo ? ' checked' : '') + '><i></i>' +
      '<span><b>' + texto + '</b>' + (ayuda ? '<small>' + ayuda + '</small>' : '') + '</span></label>';
  const opcionesSede = SEDES_PERFIL.map(([v, t]) =>
    '<option value="' + v + '"' + (v === (perfil.sede || '') ? ' selected' : '') + '>' + escapar(t) + '</option>').join('');

  const tarjeta =
    '<aside class="perfil__tarjeta">' +
      '<div class="perfil__foto" style="--h:' + tonoDe(clave || 'x') + '">' +
        (foto ? '<img src="' + escapar(foto) + '" alt="">' : '<span>' + escapar(inicialesDe(nombre || '?')) + '</span>') +
        '<label class="perfil__cambiar" title="Cambiar la foto">' + ico('foto') + '<span>Cambiar foto</span>' +
          '<input type="file" id="perfil-foto" accept="image/jpeg,image/png,image/webp" hidden></label>' +
      '</div>' +
      '<strong class="perfil__nombre">' + escapar(nombre || 'Sin nombre todavía') + '</strong>' +
      '<span class="pub__alias">' + escapar(aliasDe(nombre || 'equipo')) + '</span>' +
      ((puesto || perfil.sede)
        ? '<small class="perfil__puesto">' + escapar(puesto) + (perfil.sede ? (puesto ? ' · ' : '') + escapar(nombreSede(perfil.sede)) : '') + '</small>'
        : '') +
      (perfil.frase ? '<p class="perfil__frase">«' + escapar(perfil.frase) + '»</p>' : '') +
      (Array.isArray(perfil.idiomas) && perfil.idiomas.length
        ? '<div class="perfil__idiomas">' + perfil.idiomas.map((i) => '<span class="pastilla">' + escapar(i) + '</span>').join('') + '</div>'
        : '') +
      '<div class="perfil__cifras">' +
        '<span><b data-contar="' + hechas + '">' + hechas + '</b>lecciones</span>' +
        '<span><b data-contar="' + puntos + '">' + puntos + '</b>puntos</span>' +
        '<span><b>' + racha + '</b>' + (racha === 1 ? 'día de racha' : 'días de racha') + '</span>' +
      '</div>' +
      '<div class="insignia-fila perfil__insignias">' + ganadas.map((i) =>
        '<span class="insignia"><span class="insignia__aro">' + ico(i.icono) + '</span><span class="insignia__nom">' + escapar(i.nombre) + '</span></span>'
      ).join('') + '</div>' +
      (perfil.foto ? '<button type="button" class="perfil__enlace" data-accion="quitar-foto-perfil">Quitar mi foto</button>' : '') +
      '<p class="perfil__nota">' + (u.correo
        ? 'Entras con <strong>' + escapar(u.correo) + '</strong>.'
        : 'Acceso sin Google: te identificas por tu nombre en este navegador.') + '</p>' +
    '</aside>';

  const bloqueEquipo =
    '<section class="perfil__bloque">' +
      '<h2>' + ico('usuarios') + 'Cómo te ve el equipo</h2>' +
      '<p class="perfil__ayuda">Esto lo ven tus compañeros en Conecta y en «Quién es quién».</p>' +
      '<div class="perfil__campos">' +
        campo('Nombre para mostrar', '<input type="text" id="perfil-nombre" maxlength="60" value="' + escapar(nombre) + '" placeholder="Nombre y apellidos">') +
        campo('Puesto', '<input type="text" id="perfil-puesto" maxlength="80" value="' + escapar(perfil.puesto || persona.puesto || '') + '" placeholder="Abogada de extranjería, Recepción…">') +
        campo('Sede', '<select id="perfil-sede">' + opcionesSede + '</select>') +
        campo('Idiomas <small>(separados por comas)</small>', '<input type="text" id="perfil-idiomas" maxlength="120" value="' + escapar((perfil.idiomas || []).join(', ')) + '" placeholder="Español, inglés, francés">') +
        campo('Una frase sobre ti', '<input type="text" id="perfil-frase" maxlength="140" value="' + escapar(perfil.frase || '') + '" placeholder="Café, extranjería y listas de tareas bien hechas">', true) +
        campo('Cumpleaños <small>(día/mes)</small>', '<input type="text" id="perfil-cumple" maxlength="5" value="' + escapar(perfil.cumple || '') + '" placeholder="15/03" inputmode="numeric">') +
        '<div class="perfil__campo perfil__campo--conmutador">' +
          conmutador('id="perfil-mostrar-cumple"', Boolean(perfil.mostrarCumple), 'Mostrar mi cumpleaños al equipo', 'Si lo activas, ese día se celebra en Conecta.') +
        '</div>' +
      '</div>' +
      '<div class="perfil__acciones">' +
        '<button type="button" class="btn btn--oro" data-accion="guardar-perfil">Guardar mi perfil' + ico('tick') + '</button>' +
        (!u.correo ? '<span class="perfil__ayuda">Sin Google, tu nombre es tu identidad en este navegador.</span>' : '') +
      '</div>' +
    '</section>';

  const bloquePreferencias =
    '<section class="perfil__bloque">' +
      '<h2>' + ico('ajustes') + 'Cómo prefieres usar la plataforma</h2>' +
      '<div class="perfil__opciones">' +
        '<div class="perfil__opcion"><span class="perfil__opcion-txt"><b>' + ico('sol') + 'Tema</b><small>Automático sigue al sistema.</small></span>' +
          segmentos('tema', temaElegido, [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']]) + '</div>' +
        '<div class="perfil__opcion"><span class="perfil__opcion-txt"><b>' + ico('letra') + 'Tamaño de letra</b><small>Grande hace todo un poco más legible.</small></span>' +
          segmentos('letra', prefs.letra, [['normal', 'Normal'], ['grande', 'Grande']]) + '</div>' +
        '<div class="perfil__opcion">' +
          conmutador('data-pref="movimiento"', prefs.movimiento === 'menos', 'Reducir las animaciones', 'Quita auroras, confeti y transiciones. Tu sistema también puede pedirlo solo.') +
        '</div>' +
      '</div>' +
    '</section>';

  const bloqueAvisos =
    '<section class="perfil__bloque">' +
      '<h2>' + ico('campana') + 'Qué enciende la campana</h2>' +
      '<div class="perfil__opciones perfil__opciones--lista">' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.novedades"', prefs.avisos.novedades, 'Novedades del despacho') + '</div>' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.equipo"', prefs.avisos.equipo, 'Equipo', 'Tablón, empleado del mes y ranking.') + '</div>' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.objetivos"', prefs.avisos.objetivos, 'Mis objetivos del mes') + '</div>' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.modelos"', prefs.avisos.modelos, 'Modelos de documentos nuevos') + '</div>' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.conecta"', prefs.avisos.conecta, 'Movimiento en Conecta') + '</div>' +
        '<div class="perfil__opcion">' + conmutador('data-pref="avisos.actividad"', prefs.avisos.actividad !== false, 'Actividad del equipo', 'Módulos completados, exámenes aprobados y formación nueva.') + '</div>' +
      '</div>' +
    '</section>';

  const bloqueProgreso =
    '<section class="perfil__bloque">' +
      '<h2>' + ico('formacion') + 'Tu progreso</h2>' +
      '<p class="perfil__ayuda">Llevas <strong>' + hechas + ' de ' + LECCIONES.length + '</strong> lecciones. El progreso vive en este navegador: descarga una copia si cambias de ordenador.</p>' +
      '<div class="perfil__acciones">' +
        '<button type="button" class="btn btn--secundario" data-accion="exportar-progreso">' + ico('descargar') + 'Descargar una copia</button>' +
        '<label class="btn btn--secundario">' + ico('subir') + 'Restaurar una copia<input type="file" id="perfil-importar" accept="application/json,.json" hidden></label>' +
        (progreso.hayCopiaReinicio()
          ? '<button type="button" class="btn btn--secundario" data-accion="deshacer-reinicio">' + ico('relojArena') + 'Recuperar el último reinicio</button>'
          : '') +
        '<button type="button" class="btn btn--sutil perfil__peligro" data-accion="reiniciar-progreso">Reiniciar mi progreso</button>' +
      '</div>' +
      '<p class="perfil__ayuda" style="margin:.7rem 0 0">Reiniciar pide escribir una palabra de confirmación y se puede deshacer justo después.</p>' +
    '</section>';

  const bloqueSesion =
    '<section class="perfil__bloque">' +
      '<h2>' + ico('salir') + 'Sesión</h2>' +
      '<p class="perfil__ayuda">' + (u.correo ? 'Sesión abierta con ' + escapar(u.correo) + '.' : 'Sesión abierta sin cuenta de Google.') + ' Al cerrarla, tu progreso se conserva en este equipo.</p>' +
      '<div class="perfil__acciones"><button type="button" class="btn btn--secundario" data-accion="cerrar-sesion">Cerrar sesión' + ico('salir') + '</button></div>' +
    '</section>';

  return (
    '<div class="envoltorio envoltorio--ancho perfil">' +
      '<div class="itin-cab"><div>' +
        '<h1>Mi perfil</h1>' +
        '<p class="pagina-cab__sub">Tu foto, cómo te ve el equipo y cómo prefieres usar la plataforma. La foto y los datos se guardan en el servidor del despacho; las preferencias, en este navegador.</p>' +
      '</div></div>' +
      '<div class="perfil__cuerpo">' +
        tarjeta +
        '<div class="perfil__columna">' + bloqueEquipo + bloquePreferencias + bloqueAvisos + bloqueProgreso + bloqueSesion + '</div>' +
      '</div>' +
    '</div>'
  );
}

/* ── Pestañas secundarias de cada sección ────────────────────── */
const SUBNAVS = {
  formacion: [
    ['#/formacion', 'formacion', 'Itinerario'],
    ['#/videos', 'video', 'Videoteca'],
    ['#/onboarding', 'onboarding', 'Tu primera semana']
  ],
  despacho: [
    ['#/novedades', 'novedades', 'Novedades'],
    ['#/equipo', 'equipo', 'Equipo'],
    ['#/modelos', 'modelos', 'Modelos'],
    ['#/soporte', 'soporte', 'Soporte TI']
  ]
};

export function subnav(grupo, activa) {
  const etiqueta = grupo === 'formacion' ? 'Formación' : 'Despacho';
  const enlaces = (SUBNAVS[grupo] || []).concat(
    grupo === 'despacho' && modoAdmin ? [['#/seguimiento', 'grafica', 'Seguimiento']] : []);
  return (
    '<nav class="subnav" aria-label="' + etiqueta + '">' +
      '<span class="subnav__grupo">' + etiqueta + '</span>' +
      enlaces.map(([ruta, icono, texto]) =>
        '<a class="subnav__item' + (ruta === activa ? ' subnav__item--activa' : '') + '" href="' + ruta + '"' +
          (ruta === activa ? ' aria-current="page"' : '') + '>' + ico(icono) + '<span>' + texto + '</span></a>'
      ).join('') +
    '</nav>'
  );
}

/* ── Itinerario de formación ─────────────────────────────────── */
export function vistaFormacion() {
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  const puntos = hechas * XP_LECCION;
  const modulosHechos = MODULOS.filter(moduloCompleto).length;
  const nInsignias = insignias().filter((i) => i.ganada).length;
  const modActual = MODULOS.find((m) => !moduloCompleto(m));

  const grupos = GRUPOS.map((g, gi) => {
    const mods = modulosDeGrupo(g.id);
    if (!mods.length) return '';

    const completos = mods.filter(moduloCompleto).length;
    const conAlgo = mods.some((m) => progreso.contar(clavesDe(m)) > 0);
    let estado;
    if (completos === mods.length) estado = '<span class="pastilla pastilla--ok">Completado</span>';
    else if (conAlgo) estado = '<span class="pastilla pastilla--oro">En curso</span>';
    else estado = '<span class="pastilla">Pendiente</span>';

    const tarjetas = mods.map((mod) => {
      const claves = clavesDe(mod);
      const n = progreso.contar(claves);
      const completo = n === claves.length;
      const actual = modActual && mod.id === modActual.id;
      const pctMod = claves.length ? Math.round((n / claves.length) * 100) : 0;
      const clase = completo ? ' itin-mod--hecho' : (actual ? ' itin-mod--actual' : (n === 0 ? ' itin-mod--pte' : ''));

      return (
        '<a class="itin-mod' + clase + '" href="#/modulo/' + mod.id + '">' +
          '<span class="itin-mod__cab">' +
            '<span class="itin-mod__n">Módulo ' + mod.num +
              (totalVideos(mod) ? ' <span class="itin-mod__video" title="Vídeos del módulo">' + ico('play') + totalVideos(mod) + '</span>' : '') +
            '</span>' +
            (completo
              ? '<span class="itin-mod__marca itin-mod__marca--ok">' + ico('tick') + '</span>' :
             actual
              ? '<span class="itin-mod__resta">' + (claves.length - n) +
                  (claves.length - n === 1 ? ' lección restante' : ' lecciones restantes') + '</span>'
              : (n === 0 ? '<span class="itin-mod__marca">' + ico('candado') + '</span>'
                         : '<span class="itin-mod__resta">' + n + '/' + claves.length + '</span>')) +
          '</span>' +
          '<strong>' + escapar(mod.titulo) + '</strong>' +
          '<span class="itin-mod__barra"><span style="width:' + pctMod + '%"' +
            (completo ? ' class="itin-mod__barra--ok"' : '') + '></span></span>' +
        '</a>'
      );
    }).join('');

    return (
      '<section class="itin-grupo">' +
        '<div class="itin-grupo__cab">' +
          '<span class="itin-grupo__num">' + (gi + 1) + '</span>' +
          '<h2>' + escapar(g.titulo) + '</h2>' +
          estado +
        '</div>' +
        '<div class="itin-rejilla">' + tarjetas + '</div>' +
      '</section>'
    );
  }).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('formacion', '#/formacion') +
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Itinerario de formación</h1>' +
          '<p class="pagina-cab__sub">' + GRUPOS.length + ' bloques temáticos · ' + MODULOS.length +
            ' módulos · ' + Math.round(TOTAL_MINUTOS / 60) + ' h estimadas. Avanza en orden o salta al que necesites.</p>' +
        '</div>' +
        '<div class="itin-datos">' +
          '<span><small>Completados</small><strong>' + modulosHechos + ' / ' + MODULOS.length + '</strong></span>' +
          '<span><small>Vídeos</small><strong>' + MODULOS.reduce((s, m) => s + totalVideos(m), 0) + '</strong></span>' +
          '<span><small>Puntos</small><strong class="itin-datos__oro" data-contar="' + puntos + '">' + puntos + '</strong></span>' +
          '<span><small>Insignias</small><strong data-contar="' + nInsignias + '">' + nInsignias + '</strong></span>' +
        '</div>' +
      '</div>' +
      grupos +
    '</div>'
  );
}

/* ── Onboarding: tu primera semana ───────────────────────────── */
export function vistaOnboarding() {
  const niveles = MODULOS.slice(0, 5);
  const nombre = nombreDePila();

  const xpNivel = (mod) => clavesDe(mod).length * XP_LECCION;
  const xpTotal = niveles.reduce((s, m) => s + xpNivel(m), 0);
  const xpGanada = niveles.reduce((s, m) => s + progreso.contar(clavesDe(m)) * XP_LECCION, 0);
  const pctXp = xpTotal ? Math.round((xpGanada / xpTotal) * 100) : 0;

  const actual = niveles.find((m) => !moduloCompleto(m));
  const nivelActual = actual ? niveles.indexOf(actual) + 1 : niveles.length;
  const terminado = !actual;

  const nodos = niveles.map((mod, i) => {
    const completo = moduloCompleto(mod);
    const esActual = actual && mod.id === actual.id;
    const clase = completo ? ' nivel--hecho' : (esActual ? ' nivel--actual' : ' nivel--bloqueado');
    return (
      '<a class="nivel' + clase + '" href="#/modulo/' + mod.id + '">' +
        '<span class="nivel__nodo">' +
          (completo ? ico('tick') : (esActual ? '<b>' + (i + 1) + '</b>' : ico('candado'))) +
        '</span>' +
        '<span class="nivel__et">' + (esActual ? 'Estás aquí' : 'Nivel ' + (i + 1)) + '</span>' +
        '<span class="nivel__tit">' + escapar(mod.titulo) + '</span>' +
        '<span class="nivel__xp">' + xpNivel(mod) + ' XP</span>' +
      '</a>'
    );
  }).join('');

  const misiones = actual ? actual.lecciones.map((lec) => {
    const clave = actual.id + '/' + lec.id;
    const hecha = progreso.hecha(clave);
    return (
      '<button type="button" class="mision' + (hecha ? ' mision--hecha' : '') +
        '" data-accion="marcar" data-clave="' + escapar(clave) + '">' +
        '<span class="mision__marca">' + (hecha ? ico('tick') : '') + '</span>' +
        '<span class="mision__txt">' + escapar(lec.titulo) + '</span>' +
        '<span class="mision__xp">+' + XP_LECCION + ' XP</span>' +
      '</button>'
    );
  }).join('') : '';

  const listaInsignias = insignias().map((ins) =>
    '<span class="insignia' + (ins.ganada ? '' : ' insignia--pte') + '">' +
      '<span class="insignia__aro">' + ico(ins.ganada ? ins.icono : 'candado') + '</span>' +
      '<span class="insignia__nom">' + escapar(ins.nombre) + '</span>' +
    '</span>'
  ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('formacion', '#/onboarding') +

      '<div class="onb-heroe">' +
        '<div class="onb-heroe__cab">' +
          '<div class="onb-heroe__txt">' +
            '<p class="panel-heroe__cinta">Tu primera semana</p>' +
            '<h1>' + (nombre ? 'Te damos la bienvenida, ' + escapar(nombre) + '.' : 'Te damos la bienvenida al despacho.') + '</h1>' +
            '<p class="panel-heroe__sub">Como en un juego: empieza por el nivel 1 y desbloquea el siguiente al completar cada uno. Cada nivel es un módulo del itinerario, con sus misiones.</p>' +
          '</div>' +
          '<div class="onb-xp">' +
            '<span class="onb-xp__fila"><span>' + (terminado ? 'Onboarding completado' : 'Nivel ' + nivelActual + ' de ' + niveles.length) + '</span>' +
              '<b><span data-contar="' + xpGanada + '">' + xpGanada + '</span> / ' + xpTotal + ' XP</b></span>' +
            '<span class="onb-xp__barra"><span style="width:' + pctXp + '%"></span></span>' +
          '</div>' +
        '</div>' +
        '<div class="onb-camino">' + nodos + '</div>' +
      '</div>' +

      '<div class="panel-columnas">' +
        '<section class="panel-col">' +
          (actual
            ? '<div class="seccion-tit seccion-tit--fila"><h2>Misiones del nivel ' + nivelActual +
                ' · ' + escapar(actual.titulo) + '</h2>' +
                '<a class="seccion-tit__mas" href="#/modulo/' + actual.id + '">Abrir el módulo</a></div>' +
              '<p class="onb-nota">Marca cada misión al terminarla; también puedes hacerlo desde la lección.</p>' +
              '<div class="mision-lista">' + misiones + '</div>'
            : '<div class="seccion-tit"><h2>Onboarding completado</h2></div>' +
              '<p class="prosa">Has terminado tu primera semana. Sigue con el resto del itinerario en Formación.</p>' +
              '<a class="btn btn--primario" href="#/formacion">Ir al itinerario' + ico('flecha') + '</a>') +
        '</section>' +
        '<section class="panel-col panel-col--estrecha">' +
          '<div class="seccion-tit"><h2>Tus insignias</h2></div>' +
          '<div class="insignia-fila">' + listaInsignias + '</div>' +
          '<div class="seccion-tit" style="margin-top:1.4rem"><h2>Lo que tienes que saber</h2></div>' +
          '<ul class="onb-saber">' +
            '<li>Horarios, calendario y funcionamiento del despacho</li>' +
            '<li>Quién es quién en el equipo</li>' +
            '<li>Canales de comunicación y cuándo usar cada uno</li>' +
            '<li>Confidencialidad y protección de datos desde el día uno</li>' +
          '</ul>' +
          '<p class="onb-nota">Todo está explicado en el <a href="#/modulo/' + niveles[0].id + '">módulo de bienvenida</a>.</p>' +
        '</section>' +
      '</div>' +

      descubreElDespacho() +
    '</div>'
  );
}

/* Bloque "Descubre el despacho" del onboarding: el equipo real,
   lo que dicen los clientes de ellos y las oficinas. Los datos
   salen de la web pública del despacho y del ranking. */
function descubreElDespacho() {
  // Primero las personas dadas de alta; si no hay, las del ranking.
  const companeros = personasActivas().length
    ? personasActivas()
    : [...((equipo.ranking && equipo.ranking.personas) || [])];
  const burbujas = companeros.map((p) =>
    '<span class="burbuja" title="' + escapar(p.nombre) + '">' +
      (p.foto ? '<img src="' + escapar(p.foto) + '" alt="">' : escapar(p.iniciales || p.nombre.slice(0, 2).toUpperCase())) +
    '</span>'
  ).join('');

  const OFICINAS = [
    { ciudad: 'Madrid', dir: 'C. Mayor, 3, 1º D Derecha · 28013 Madrid' },
    { ciudad: 'Alicante', dir: 'Poeta Campos Vasallo, 26, Entresuelo · 03004 Alicante · 865 44 37 63' },
    { ciudad: 'Valencia', dir: 'Av. del Marqués de Sotelo, 5 · 46002 València' },
    { ciudad: 'Marbella', dir: 'Av. Ricardo Soriano, 20, Local 4 · 29601 Marbella' },
    { ciudad: 'Londres', dir: '53 Davies St · London W1K 5JH' },
    { ciudad: 'Latinoamérica', dir: 'Buenos Aires · Bogotá · Medellín · Ciudad de México' }
  ];
  const oficinas = OFICINAS.map((o) =>
    '<li><strong>' + escapar(o.ciudad) + '</strong><span>' + escapar(o.dir) + '</span></li>'
  ).join('');

  return (
    '<section class="descubre">' +
      '<div class="seccion-tit"><h2>Descubre el despacho</h2></div>' +
      '<div class="descubre__rejilla">' +

        '<div class="descubre__tarjeta">' +
          '<h3>' + ico('usuarios') + 'El equipo que te espera</h3>' +
          (burbujas ? '<div class="burbujas">' + burbujas + '</div>' : '') +
          '<p>Pasa el ratón por los avatares y ponles cara en la sección <a href="#/equipo">Equipo</a>: ahí están el ranking, el empleado del mes y el tablón. Y preséntate en <a href="#/conecta">Conecta</a>, que para eso está.</p>' +
        '</div>' +

        '<div class="descubre__tarjeta">' +
          '<h3>' + ico('estrella') + 'Así hablan de tus compañeros</h3>' +
          '<p class="descubre__nota5">5,0 · más de 280 reseñas en Google</p>' +
          '<blockquote>&laquo;I want to thank Mercedes &amp; Ilyes for our experience here as they were very helpful.&raquo;<cite>Youcef, cliente</cite></blockquote>' +
          '<blockquote>&laquo;Excelente atención de Mercedes para nuestra estancia por estudios. [&hellip;] Destaco su amabilidad y su sólido conocimiento técnico.&raquo;<cite>Flávio, cliente</cite></blockquote>' +
          '<p>Pronto serás tú quien salga en una de estas. Atendemos en español, inglés, francés y ruso.</p>' +
        '</div>' +

        '<div class="descubre__tarjeta">' +
          '<h3>' + ico('columnas') + 'Nuestras oficinas</h3>' +
          '<ul class="descubre__oficinas">' + oficinas + '</ul>' +
        '</div>' +

      '</div>' +
    '</section>'
  );
}

/* ── Módulo ──────────────────────────────────────────────────── */
export function vistaModulo(idModulo, idLeccion, opciones = {}) {
  const mod = moduloPorId(idModulo);
  if (!mod) return vistaNoEncontrada();
  // Quien administra ve dónde faltan vídeos, con un atajo al panel.
  const admin = Boolean(opciones.admin);

  const claves = clavesDe(mod);
  const hechas = progreso.contar(claves);
  const idx = MODULOS.indexOf(mod);
  const anterior = MODULOS[idx - 1];
  const siguiente = MODULOS[idx + 1];

  const lecciones = mod.lecciones.map((lec) => {
    const clave = mod.id + '/' + lec.id;
    const hecha = progreso.hecha(clave);
    const abierta = idLeccion ? lec.id === idLeccion : false;

    return (
      '<article class="leccion' + (hecha ? ' leccion--hecha' : '') + '" id="lec-' + escapar(lec.id) + '"' +
        (abierta ? ' open' : '') + ' data-clave="' + escapar(clave) + '">' +
        '<button class="leccion__cab" type="button" data-accion="desplegar" aria-expanded="' + abierta + '">' +
          '<span class="leccion__marca">' + ico('tick') + '</span>' +
          '<span class="leccion__tit">' + escapar(lec.titulo) +
            (conVideo(lec)
              ? '<span class="leccion__video">' + ico('play') +
                  (lec.video.minutos ? lec.video.minutos + ' min' : 'vídeo') + '</span>'
              : '') +
          '</span>' +
          ico('chevronAbajo', 'leccion__flecha') +
        '</button>' +
        '<div class="leccion__cuerpo"><div class="leccion__interior"><div class="prosa">' +
          (conVideo(lec)
            ? '<div class="leccion__video-principal">' + videoHtml(lec.video.url, lec.video.titulo || lec.titulo) + '</div>'
            : (admin ? huecoVideo('Esta lección todavía no tiene vídeo.') : '')) +
          (String(lec.md || '').trim() ? render(lec.md) : '') +
          '<div class="leccion__acciones">' +
            '<button class="btn ' + (hecha ? 'btn--secundario' : 'btn--ok') + '" data-accion="marcar" data-clave="' +
              escapar(clave) + '">' + ico('tick') +
              '<span>' + (hecha ? 'Marcar como pendiente' : 'Marcar como completada') + '</span></button>' +
          '</div>' +
        '</div></div></div>' +
      '</article>'
    );
  }).join('');

  const grupo = GRUPOS.find((g) => g.id === mod.grupo);

  return (
    '<div class="envoltorio">' +
      '<nav class="migas" aria-label="Ruta de navegación">' +
        '<a href="#/inicio">Inicio</a>' +
        '<span aria-hidden="true">/</span>' +
        '<span>' + escapar(grupo ? grupo.titulo : '') + '</span>' +
        '<span aria-hidden="true">/</span>' +
        '<span>Módulo ' + mod.num + '</span>' +
      '</nav>' +

      '<header class="pagina-cab">' +
        '<h1>' + escapar(mod.titulo) + '</h1>' +
        '<p class="pagina-cab__sub">' + escapar(mod.resumen) + '</p>' +
        '<div class="pagina-cab__meta">' +
          pastillasModulo(mod) +
          '<span class="pastilla' + (hechas === claves.length ? ' pastilla--ok' : ' pastilla--info') + '">' +
            hechas + ' de ' + claves.length + ' completadas</span>' +
        '</div>' +
      '</header>' +

      // Vídeo de presentación del módulo: grande y antes de las lecciones.
      (conVideo(mod)
        ? '<section class="modulo-video">' +
            '<span class="modulo-video__et">' + ico('play') + 'Presentación del módulo' +
              (mod.video.minutos ? ' · ' + mod.video.minutos + ' min' : '') + '</span>' +
            videoHtml(mod.video.url, mod.video.titulo || mod.titulo) +
          '</section>'
        : (admin ? huecoVideo('Este módulo no tiene vídeo de presentación.', 'sin-video--modulo') : '')) +

      lecciones +

      tarjetaExamen(mod, opciones.intentos || [], admin) +

      '<nav class="paso" aria-label="Navegación entre módulos">' +
        (anterior
          ? '<a class="paso__enl" href="#/modulo/' + anterior.id + '">' +
              '<span class="paso__et">Anterior</span><span class="paso__tt">' + escapar(anterior.titulo) + '</span></a>'
          : '<span></span>') +
        (siguiente
          ? '<a class="paso__enl paso__enl--sig" href="#/modulo/' + siguiente.id + '">' +
              '<span class="paso__et">Siguiente</span><span class="paso__tt">' + escapar(siguiente.titulo) + '</span></a>'
          : '<span></span>') +
      '</nav>' +
    '</div>'
  );
}

/* ── Examen del módulo ───────────────────────────────────────── */
const intentosDe = (mod, intentos) =>
  (intentos || []).filter((i) => i && i.modulo === mod.id)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

/* Pastilla con el estado: sin hacer, aprobado con nota, o último intento. */
export function estadoExamen(mod, intentos) {
  if (!examenDe(mod)) return '';
  const mios = intentosDe(mod, intentos);
  if (!mios.length) return '<span class="pastilla pastilla--info">Sin hacer todavía</span>';
  const mejor = mios.reduce((m, i) => (!m || i.nota > m.nota) ? i : m, null);
  if (mejor.aprobado) {
    return '<span class="pastilla pastilla--ok">' + ico('tick') + 'Aprobado · ' + mejor.nota + ' %</span>' +
      '<small class="examen__fecha">' + tiempoRelativo(mejor.fecha) + '</small>';
  }
  return '<span class="pastilla pastilla--aviso">Último intento: ' + mios[0].nota + ' %</span>' +
    '<small class="examen__fecha">' + (mios.length === 1 ? '1 intento' : mios.length + ' intentos') + '</small>';
}

function tarjetaExamen(mod, intentos, admin) {
  const ex = examenDe(mod);
  if (!ex) {
    return admin
      ? '<div class="sin-video sin-video--examen">' + ico('escudo') + '<span>Este módulo todavía no tiene examen.</span>' +
          '<a href="' + PANEL_URL + '" target="_blank" rel="noopener">Crearlo en el panel' + ico('externo') + '</a></div>'
      : '';
  }
  const mios = intentosDe(mod, intentos);
  const aprobado = mios.some((i) => i.aprobado);
  return (
    '<section class="examen' + (aprobado ? ' examen--aprobado' : '') + '" id="examen" data-modulo="' + escapar(mod.id) + '">' +
      '<div class="examen__cab">' +
        '<span class="examen__ico">' + ico('escudo') + '</span>' +
        '<div class="examen__txt">' +
          '<span class="examen__et">Examen del módulo</span>' +
          '<h2>Comprueba lo que has aprendido</h2>' +
          '<p>' + ex.preguntas.length + ' preguntas tipo test. Se aprueba con el ' + (Number(ex.aprobado) || 70) +
            ' % y puedes repetirlo las veces que quieras; el resultado queda en tu ficha.</p>' +
        '</div>' +
        '<div class="examen__estado" id="examen-estado">' + estadoExamen(mod, mios) + '</div>' +
      '</div>' +
      '<div class="examen__acciones" id="examen-acciones">' +
        '<button type="button" class="btn ' + (aprobado ? 'btn--secundario' : 'btn--oro') + '" data-accion="empezar-examen" data-modulo="' + escapar(mod.id) + '">' +
          ico('play') + '<span>' + (mios.length ? 'Repetir el examen' : 'Hacer el examen') + '</span></button>' +
      '</div>' +
      '<div class="examen__cuerpo" id="examen-cuerpo" hidden></div>' +
    '</section>'
  );
}

/* El cuestionario en sí. */
export function piezaExamen(mod) {
  const ex = examenDe(mod);
  if (!ex) return '';
  return (
    '<form class="examen__form" id="examen-form" data-modulo="' + escapar(mod.id) + '" novalidate>' +
      ex.preguntas.map((p, i) =>
        '<fieldset class="pregunta" data-indice="' + i + '">' +
          '<legend><span class="pregunta__n">' + (i + 1) + '</span><span>' + escapar(p.texto) + '</span></legend>' +
          '<div class="pregunta__opciones">' +
            (p.opciones || []).map((o, j) =>
              '<label class="opcion">' +
                '<input type="radio" name="pregunta-' + i + '" value="' + j + '">' +
                '<span class="opcion__marca" aria-hidden="true"></span>' +
                '<span class="opcion__txt">' + escapar(o) + '</span>' +
              '</label>'
            ).join('') +
          '</div>' +
        '</fieldset>'
      ).join('') +
      '<div class="examen__pie">' +
        '<span class="examen__cuenta" id="examen-cuenta">0 de ' + ex.preguntas.length + ' respondidas</span>' +
        '<button type="button" class="btn btn--secundario" data-accion="cerrar-examen">Cancelar</button>' +
        '<button type="submit" class="btn btn--oro" data-accion="entregar-examen">' + ico('enviar') + '<span>Entregar</span></button>' +
      '</div>' +
    '</form>'
  );
}

/* La corrección, pregunta a pregunta. */
export function piezaResultadoExamen(mod, r) {
  const ex = examenDe(mod);
  if (!ex) return '';
  return (
    '<div class="examen-res ' + (r.aprobado ? 'examen-res--ok' : 'examen-res--ko') + '">' +
      '<div class="examen-res__cab">' +
        '<span class="examen-res__nota"><b data-contar="' + r.nota + '" data-sufijo=" %">' + r.nota + ' %</b>' +
          '<small>' + r.aciertos + ' de ' + r.total + ' aciertos</small></span>' +
        '<div class="examen-res__txt">' +
          '<strong>' + (r.aprobado ? 'Aprobado. Enhorabuena.' : 'Esta vez no, pero casi.') + '</strong>' +
          '<p>' + (r.aprobado
            ? 'Queda registrado en tu ficha' + (r.intentos > 1 ? ' (intento ' + r.intentos + ')' : '') + '. Abajo tienes la corrección por si quieres repasar.'
            : 'Se aprueba con el ' + r.aprobadoCon + ' %. Repasa las preguntas marcadas y vuelve a intentarlo cuando quieras.') + '</p>' +
        '</div>' +
      '</div>' +
      '<ol class="correccion">' +
        ex.preguntas.map((p, i) => {
          const c = r.correccion[i] || {};
          return (
            '<li class="correccion__item ' + (c.acierto ? 'correccion__item--ok' : 'correccion__item--ko') + '">' +
              '<span class="correccion__marca">' + ico(c.acierto ? 'tick' : 'cerrar') + '</span>' +
              '<div class="correccion__txt">' +
                '<strong>' + escapar(p.texto) + '</strong>' +
                '<span class="correccion__resp">' + (c.elegida >= 0 ? 'Tu respuesta: ' + escapar(p.opciones[c.elegida] || '') : 'Sin responder') + '</span>' +
                (!c.acierto ? '<span class="correccion__ok">Correcta: ' + escapar(p.opciones[c.correcta] || '') + '</span>' : '') +
                (c.explicacion ? '<span class="correccion__exp">' + escapar(c.explicacion) + '</span>' : '') +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ol>' +
      '<div class="examen__pie">' +
        '<button type="button" class="btn btn--secundario" data-accion="cerrar-examen">Cerrar</button>' +
        (r.aprobado ? '' :
          '<button type="button" class="btn btn--oro" data-accion="empezar-examen" data-modulo="' + escapar(mod.id) + '">' +
            ico('play') + '<span>Intentarlo de nuevo</span></button>') +
      '</div>' +
    '</div>'
  );
}

/* ── Actividad reciente ──────────────────────────────────────── */
const ICONO_ACTIVIDAD = {
  modulo: 'trofeo', examen: 'escudo', muro: 'conecta', respuesta: 'conecta', formacion: 'formacion',
  video: 'video', novedad: 'novedades', reconocimiento: 'medalla', cumple: 'pastel', comunicado: 'campana'
};

/* Lista de eventos; undefined = todavía cargando. */
export function piezaActividad(eventos, limite = 8) {
  if (!eventos) {
    return '<div class="actividad__lista actividad__lista--cargando" aria-busy="true">' +
      '<span class="actividad__hueso"></span><span class="actividad__hueso"></span><span class="actividad__hueso"></span></div>';
  }
  if (!eventos.length) {
    return '<p class="actividad__vacio">Todavía no hay actividad. Completa una lección, aprueba un examen o publica en Conecta y aparecerá aquí para todo el equipo.</p>';
  }
  return (
    '<ol class="actividad__lista">' +
      eventos.slice(0, limite).map((ev) => {
        const actor = ev.actor || {};
        const tipo = escapar(ev.tipo || 'otro');
        const avatar = actor.clave && actor.nombre
          ? avatarMuro(actor.nombre, actor.clave, 'actividad__avatar')
          : '<span class="actividad__ico actividad__ico--' + tipo + '">' + ico(ICONO_ACTIVIDAD[ev.tipo] || 'chispa') + '</span>';
        return (
          '<li class="actividad__item actividad__item--' + tipo + '">' +
            '<a href="' + escapar(ev.ruta || '#/inicio') + '">' +
              avatar +
              '<span class="actividad__txt">' + escapar(ev.texto) +
                '<small>' + tiempoRelativo(ev.fecha) + '</small></span>' +
              ico('chevron', 'actividad__flecha') +
            '</a>' +
          '</li>'
        );
      }).join('') +
    '</ol>'
  );
}

/* Soporte informático dentro del seguimiento: incidencias y tiempos. */
function seguimientoTickets(tickets) {
  if (!tickets) return '';
  const r = resumenTickets(tickets);
  const ultimos = [...tickets].sort((a, b) => String(b.actualizado || b.fecha).localeCompare(String(a.actualizado || a.fecha))).slice(0, 10);
  const tabla = ultimos.length
    ? '<div class="tabla-envoltorio"><table class="tabla tabla--seg">' +
        '<thead><tr><th>Ticket</th><th>Persona</th><th>Estado</th><th>Tiempo</th><th>Valoración</th></tr></thead><tbody>' +
        ultimos.map((t) => {
          const e = ESTADOS_TICKET[t.estado] || ESTADOS_TICKET.pendiente;
          return '<tr>' +
            '<td><a class="seg__enlace" href="#/soporte"><strong>#' + Number(t.numero) + ' ' + escapar(t.titulo) + '</strong><small>' + escapar(CATEGORIAS_TICKET[t.categoria] || 'Otra cosa') + ' · ' + tiempoRelativo(t.fecha) + '</small></a></td>' +
            '<td>' + escapar(t.nombre || '—') + '</td>' +
            '<td><span class="pastilla ' + e.clase + '">' + e.texto + '</span></td>' +
            '<td><small>' + (t.resuelto ? 'resuelto en ' + duracionLegible(new Date(t.resuelto) - new Date(t.fecha)) : 'abierto desde ' + tiempoRelativo(t.fecha).replace('hace ', 'hace ')) + '</small></td>' +
            '<td>' + (t.encuesta ? estrellasHtml(Number(t.encuesta.estrellas) || 0) : '<small>—</small>') + '</td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>'
    : '<p class="actividad__vacio">Nadie ha abierto todavía un ticket de informática.</p>';
  return (
    '<div class="seccion-tit"><h2>Soporte informático</h2></div>' +
    '<div class="seg-cifras">' +
      piezaCifra(r.pendientes + r.enProceso, 'tickets abiertos', 'soporte') +
      piezaCifra(r.resueltos, 'resueltos', 'tickCirculo') +
      piezaCifra(r.tiempoMedio, 'tiempo medio de resolución', 'reloj') +
      piezaCifra(r.valoracion, 'valoración media', 'estrella') +
    '</div>' + tabla
  );
}

/* ── Seguimiento (solo dirección) ────────────────────────────── */
/* datos: { cargando } | { error } | { progreso, visualizaciones, intentos, tickets } */
export function vistaSeguimiento(datos = {}) {
  const cabecera =
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('despacho', '#/seguimiento') +
      '<header class="pagina-cab">' +
        '<h1>Seguimiento del equipo</h1>' +
        '<p class="pagina-cab__sub">Quién ha completado qué, qué vídeos ha visto cada persona y cómo le ha ido en los exámenes. Solo lo ve dirección.</p>' +
      '</header>';

  if (datos.cargando) {
    return cabecera + '<div class="actividad__lista actividad__lista--cargando" aria-busy="true">' +
      '<span class="actividad__hueso"></span><span class="actividad__hueso"></span><span class="actividad__hueso"></span></div></div>';
  }
  if (datos.error) {
    return cabecera + '<div class="sin-video">' + ico('alertaCirculo') + '<span>' + escapar(datos.error) + '</span></div></div>';
  }

  const progresoTodos = datos.progreso || {};
  const visualizaciones = datos.visualizaciones || [];
  const intentos = datos.intentos || [];

  // Personas: las dadas de alta, más cualquiera que haya dejado rastro.
  const personasMap = new Map();
  personasActivas().forEach((p) => {
    const clave = String(p.correo || '').toLowerCase();
    personasMap.set(clave, { clave, nombre: p.nombre, puesto: p.puesto || '' });
  });
  const anotar = (clave, nombre) => {
    if (!clave || personasMap.has(clave)) return;
    personasMap.set(clave, { clave, nombre: nombre || clave.replace(/^nombre:/, ''), puesto: '' });
  };
  Object.entries(progresoTodos).forEach(([clave, d]) => anotar(clave, d && d.nombre));
  visualizaciones.forEach((v) => anotar(v.clave, v.nombre));
  intentos.forEach((i) => anotar(i.clave, i.nombre));

  const nombreDe = (clave) => (personasMap.get(clave) || {}).nombre || clave;
  const videos = MODULOS.flatMap((m) => [
    conVideo(m) ? { src: m.video.url, titulo: m.video.titulo || m.titulo, mod: m, lec: null } : null,
    ...m.lecciones.filter(conVideo).map((l) => ({ src: l.video.url, titulo: l.video.titulo || l.titulo, mod: m, lec: l }))
  ].filter(Boolean));
  const modulosConExamen = MODULOS.filter(examenDe);
  const clavesValidas = new Set(LECCIONES.map((l) => l.clave));
  const fechaMax = (lista) => lista.reduce((m, f) => (f && String(f) > m ? String(f) : m), '');

  const filas = [...personasMap.values()].map((p) => {
    const mio = progresoTodos[p.clave] || {};
    const lecciones = Object.keys(mio.lecciones || {}).filter((k) => clavesValidas.has(k)).length;
    const pct = TOTAL_LECCIONES ? Math.round((lecciones / TOTAL_LECCIONES) * 100) : 0;
    const misVideos = visualizaciones.filter((v) => v.clave === p.clave);
    const completos = misVideos.filter((v) => v.completo).length;
    const misIntentos = intentos.filter((i) => i.clave === p.clave);
    const aprobados = new Set(misIntentos.filter((i) => i.aprobado).map((i) => i.modulo)).size;
    const ultima = fechaMax([mio.actualizado, ...misVideos.map((v) => v.ultima), ...misIntentos.map((i) => i.fecha)]);
    // Objetivos: la ficha que corresponde por correo o por nombre.
    const personaObj = personaDeSesion(objetivos, { correo: p.clave.includes('@') ? p.clave : '', nombre: p.nombre });
    const mesObj = personaObj ? mesesDe(objetivos, personaObj.id)[0] : '';
    const objetivosDe_ = personaObj && mesObj
      ? { ...calcularMes(objetivos, personaObj, mesObj), puesto: puestoDe(objetivos, personaObj.id, mesObj) }
      : null;
    return { p, lecciones, pct, completos, empezados: misVideos.length - completos, aprobados, intentos: misIntentos.length, ultima, objetivos: objetivosDe_ };
  }).sort((a, b) => b.pct - a.pct || String(b.ultima).localeCompare(String(a.ultima)));

  const totalLecciones = filas.reduce((n, f) => n + f.lecciones, 0);
  const totalVideos = filas.reduce((n, f) => n + f.completos, 0);
  const totalAprobados = filas.reduce((n, f) => n + f.aprobados, 0);

  const cifra = (n, t, icono) =>
    '<div class="seg-cifra"><span class="seg-cifra__ico">' + ico(icono) + '</span>' +
      '<b data-contar="' + n + '">' + n + '</b><span>' + t + '</span></div>';

  const tablaPersonas = filas.length
    ? '<div class="tabla-envoltorio"><table class="tabla tabla--seg">' +
        '<thead><tr><th>Persona</th><th>Lecciones</th><th>Vídeos</th><th>Exámenes</th><th>Objetivos</th><th>Última actividad</th></tr></thead><tbody>' +
        filas.map((f) =>
          '<tr>' +
            '<td class="seg__persona">' + avatarMuro(f.p.nombre, f.p.clave, 'seg__avatar') +
              '<span><strong>' + escapar(f.p.nombre) + '</strong>' + (f.p.puesto ? '<small>' + escapar(f.p.puesto) + '</small>' : '') + '</span></td>' +
            '<td><span class="seg__barra"><span style="width:' + f.pct + '%"></span></span>' +
              '<small>' + f.lecciones + ' de ' + TOTAL_LECCIONES + ' · ' + f.pct + ' %</small></td>' +
            '<td>' + (f.completos || f.empezados
              ? '<strong>' + f.completos + '</strong> ' + (f.completos === 1 ? 'completo' : 'completos') +
                (f.empezados ? '<small>' + f.empezados + ' a medias</small>' : '')
              : '<small>Ninguno todavía</small>') + '</td>' +
            '<td>' + (f.intentos
              ? '<strong>' + f.aprobados + '</strong> de ' + modulosConExamen.length + ' aprobados<small>' + f.intentos + (f.intentos === 1 ? ' intento' : ' intentos') + '</small>'
              : '<small>Sin intentos</small>') + '</td>' +
            '<td>' + (f.objetivos
              ? '<strong>' + puntuacion(f.objetivos.total) + '</strong> de ' + puntuacion(f.objetivos.maximo) +
                '<small>' + escapar(nombreDeMes(f.objetivos.mes)) + (f.objetivos.puesto ? ' · ' + f.objetivos.puesto.puesto + 'º de ' + f.objetivos.puesto.de : '') + '</small>'
              : '<small>Sin ficha</small>') + '</td>' +
            '<td><small>' + (f.ultima ? tiempoRelativo(f.ultima) : 'Sin actividad') + '</small></td>' +
          '</tr>'
        ).join('') +
      '</tbody></table></div>'
    : '<p class="actividad__vacio">Todavía no hay nadie con actividad registrada.</p>';

  const tablaVideos = videos.length
    ? '<div class="tabla-envoltorio"><table class="tabla tabla--seg">' +
        '<thead><tr><th>Vídeo</th><th>Completo</th><th>A medias</th><th>Quién</th></tr></thead><tbody>' +
        videos.map((v) => {
          const vis = visualizaciones.filter((x) => x.src === v.src).sort((a, b) => String(b.ultima).localeCompare(String(a.ultima)));
          const completos = vis.filter((x) => x.completo);
          return '<tr>' +
            '<td><a class="seg__enlace" href="#/modulo/' + escapar(v.mod.id) + (v.lec ? '/' + escapar(v.lec.id) : '') + '">' +
              '<strong>' + escapar(v.titulo) + '</strong><small>Módulo ' + v.mod.num + (v.lec ? ' · ' + escapar(v.lec.titulo) : ' · presentación') + '</small></a></td>' +
            '<td><strong>' + completos.length + '</strong></td>' +
            '<td><strong>' + (vis.length - completos.length) + '</strong></td>' +
            '<td class="seg__quien">' + (vis.length
              ? vis.map((x) =>
                  '<span class="pastilla ' + (x.completo ? 'pastilla--ok' : 'pastilla--info') + '" title="' +
                    escapar(x.completo ? 'Completo' : x.porcentaje + ' % visto') + ' · ' + escapar(tiempoRelativo(x.ultima)) + '">' +
                    escapar(nombreDe(x.clave)) + ' · ' + (x.completo ? '100' : x.porcentaje) + ' %</span>').join('')
              : '<small>Nadie todavía</small>') + '</td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>'
    : '<p class="actividad__vacio">Todavía no hay vídeos en la formación.</p>';

  const recientes = [...intentos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 30);
  const tablaExamenes = recientes.length
    ? '<div class="tabla-envoltorio"><table class="tabla tabla--seg">' +
        '<thead><tr><th>Persona</th><th>Módulo</th><th>Nota</th><th>Resultado</th><th>Cuándo</th></tr></thead><tbody>' +
        recientes.map((i) => {
          const mod = moduloPorId(i.modulo);
          return '<tr>' +
            '<td><strong>' + escapar(nombreDe(i.clave)) + '</strong></td>' +
            '<td>' + (mod ? '<a class="seg__enlace" href="#/modulo/' + escapar(mod.id) + '">' + escapar(mod.titulo) + '</a>' : escapar(i.modulo)) + '</td>' +
            '<td><strong>' + i.nota + ' %</strong><small>' + i.aciertos + ' de ' + i.total + '</small></td>' +
            '<td><span class="pastilla ' + (i.aprobado ? 'pastilla--ok' : 'pastilla--aviso') + '">' + (i.aprobado ? 'Aprobado' : 'Suspenso') + '</span></td>' +
            '<td><small>' + tiempoRelativo(i.fecha) + '</small></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>'
    : '<p class="actividad__vacio">Todavía nadie ha hecho un examen.' +
        (modulosConExamen.length ? '' : ' Tampoco hay exámenes creados: se añaden desde el panel, en «Datos del módulo».') + '</p>';

  return (
    cabecera +
      '<div class="seg-cifras">' +
        cifra(filas.length, filas.length === 1 ? 'persona con actividad' : 'personas con actividad', 'usuarios') +
        cifra(totalLecciones, totalLecciones === 1 ? 'lección completada' : 'lecciones completadas', 'tickCirculo') +
        cifra(totalVideos, totalVideos === 1 ? 'vídeo visto entero' : 'vídeos vistos enteros', 'video') +
        cifra(totalAprobados, totalAprobados === 1 ? 'examen aprobado' : 'exámenes aprobados', 'escudo') +
      '</div>' +
      '<div class="seccion-tit"><h2>Por persona</h2></div>' + tablaPersonas +
      '<div class="seccion-tit"><h2>Por vídeo</h2></div>' + tablaVideos +
      '<div class="seccion-tit"><h2>Últimos exámenes</h2></div>' + tablaExamenes +
      seguimientoTickets(datos.tickets) +
      '<p class="seg__nota">Los datos se guardan en el servidor de la plataforma. Cada persona solo ve lo suyo; esta pantalla la ve únicamente quien tiene papel de administración.</p>' +
    '</div>'
  );
}

/* ── Soporte informático: tickets ────────────────────────────── */
export const ESTADOS_TICKET = {
  pendiente:    { texto: 'Pendiente',  clase: 'pastilla--aviso', icono: 'relojArena' },
  'en-proceso': { texto: 'En proceso', clase: 'pastilla--info',  icono: 'reloj' },
  resuelto:     { texto: 'Resuelto',   clase: 'pastilla--ok',    icono: 'tickCirculo' }
};
export const CATEGORIAS_TICKET = {
  equipo: 'Ordenador o equipo', correo: 'Correo electrónico', hubspot: 'HubSpot', telefonia: 'Teléfono o centralita',
  accesos: 'Accesos y contraseñas', impresora: 'Impresora o escáner', web: 'Web o redes sociales', otro: 'Otra cosa'
};
export const URGENCIAS_TICKET = { baja: 'Puede esperar', normal: 'Normal', alta: 'Urgente, no puedo trabajar' };
const TIEMPOS_ENCUESTA = { rapido: 'Rápido', normal: 'En un tiempo razonable', lento: 'Tardó demasiado' };
const PESO_URGENCIA = { alta: 3, normal: 2, baja: 1 };

function duracionLegible(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return min + ' min';
  const h = Math.round(min / 60);
  if (h < 48) return h + ' h';
  return Math.round(h / 24) + ' días';
}

const estrellasHtml = (n) => {
  let s = '';
  for (let i = 1; i <= 5; i++) s += '<span class="estrella' + (i <= n ? ' estrella--llena' : '') + '">' + ico('estrella') + '</span>';
  return '<span class="estrellas" aria-label="' + n + ' de 5 estrellas">' + s + '</span>';
};

/* Resumen de una lista de tickets: abiertos, tiempos y valoración. */
export function resumenTickets(tickets) {
  const lista = tickets || [];
  const resueltos = lista.filter((t) => t.estado === 'resuelto');
  const tiempos = resueltos.filter((t) => t.resuelto).map((t) => new Date(t.resuelto) - new Date(t.fecha));
  const valoraciones = resueltos.filter((t) => t.encuesta).map((t) => Number(t.encuesta.estrellas) || 0);
  return {
    total: lista.length,
    pendientes: lista.filter((t) => t.estado === 'pendiente').length,
    enProceso: lista.filter((t) => t.estado === 'en-proceso').length,
    resueltos: resueltos.length,
    tiempoMedio: tiempos.length ? duracionLegible(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : '—',
    valoracion: valoraciones.length ? (valoraciones.reduce((a, b) => a + b, 0) / valoraciones.length).toFixed(1).replace('.', ',') : '—',
    valoraciones: valoraciones.length
  };
}

export function piezaCifra(n, texto, icono) {
  return '<div class="seg-cifra"><span class="seg-cifra__ico">' + ico(icono) + '</span>' +
    '<b>' + n + '</b><span>' + texto + '</span></div>';
}

export function piezaTicket(t, opciones = {}) {
  const estado = ESTADOS_TICKET[t.estado] || ESTADOS_TICKET.pendiente;
  const admin = Boolean(opciones.admin);
  const mio = Boolean(opciones.miClave) && t.clave === opciones.miClave;
  const boton = (nuevoEstado, texto, clase) =>
    '<button type="button" class="btn btn--pequeno ' + clase + '" data-accion="ticket-estado" data-id="' + escapar(t.id) + '" data-estado="' + nuevoEstado + '">' + texto + '</button>';

  const eventos = [
    ...(t.historial || []).map((h) => ({ fecha: h.fecha, tipo: 'estado', estado: h.estado, por: h.por })),
    ...(t.mensajes || []).map((m) => ({ fecha: m.fecha, tipo: 'mensaje', nombre: m.nombre, texto: m.texto, informatica: m.informatica, propio: Boolean(opciones.miClave) && m.clave === opciones.miClave }))
  ].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const hilo = eventos.slice(1).map((e) => e.tipo === 'estado'
    ? '<li class="ticket__evento">' + ico((ESTADOS_TICKET[e.estado] || ESTADOS_TICKET.pendiente).icono) +
        '<span>' + escapar(e.por || 'Informática') + ' lo pasó a <b>' + (ESTADOS_TICKET[e.estado] || ESTADOS_TICKET.pendiente).texto.toLowerCase() + '</b></span>' +
        '<time>' + tiempoRelativo(e.fecha) + '</time></li>'
    : '<li class="ticket__msg' + (e.informatica ? ' ticket__msg--it' : '') + (e.propio ? ' ticket__msg--propio' : '') + '">' +
        '<span class="ticket__msg-quien">' + escapar(e.nombre || 'Informática') + (e.informatica ? ' · informática' : '') + '</span>' +
        '<p>' + escapar(e.texto).replace(/\n/g, '<br>') + '</p><time>' + tiempoRelativo(e.fecha) + '</time></li>'
  ).join('');

  const resueltoEn = t.resuelto ? duracionLegible(new Date(t.resuelto) - new Date(t.fecha)) : '';
  // Un ticket abierto que lleva demasiado tiempo sin resolver, según su urgencia.
  const LIMITE_HORAS = { alta: 4, normal: 48, baja: 24 * 7 };
  const horasAbierto = t.estado === 'resuelto' ? 0 : (Date.now() - new Date(t.fecha)) / 36e5;
  const atrasado = horasAbierto > (LIMITE_HORAS[t.urgencia] || 48);

  let acciones = '';
  let ajustes = '';
  let rapidas = '';
  let notasHtml = '';
  if (admin) {
    if (t.estado === 'pendiente') acciones = boton('en-proceso', 'Empezar', 'btn--oro') + boton('resuelto', 'Resolver', 'btn--ok');
    else if (t.estado === 'en-proceso') acciones = boton('resuelto', 'Resolver', 'btn--ok') + boton('pendiente', 'Volver a pendiente', 'btn--secundario');
    else acciones = boton('en-proceso', 'Reabrir', 'btn--secundario');

    const opciones = (mapa, actual) => Object.entries(mapa).map(([v, txt]) =>
      '<option value="' + v + '"' + (v === actual ? ' selected' : '') + '>' + txt + '</option>').join('');
    ajustes =
      '<div class="ticket__ajustes">' +
        '<label><span>Urgencia</span><select data-ticket-urgencia="' + escapar(t.id) + '">' + opciones(URGENCIAS_TICKET, t.urgencia || 'normal') + '</select></label>' +
        '<label><span>Tipo</span><select data-ticket-categoria="' + escapar(t.id) + '">' + opciones(CATEGORIAS_TICKET, t.categoria || 'otro') + '</select></label>' +
      '</div>';
    // Respuestas rápidas: un clic las pone en el cuadro de respuesta.
    rapidas = t.estado === 'resuelto' ? '' :
      '<div class="ticket__rapidas">' + [
        'Lo estoy mirando ahora mismo.',
        '¿Qué mensaje te sale exactamente? Si puedes, mándame una captura.',
        'Ya está arreglado: prueba de nuevo y me dices.',
        'Pásate por mi mesa cuando puedas y lo vemos juntos.'
      ].map((r) => '<button type="button" class="ticket__rapida" data-respuesta-rapida="' + escapar(r) + '">' + escapar(r) + '</button>').join('') +
      '</div>';
    // Notas internas: solo las ve informática.
    const notas = (t.notas || []).map((nt) =>
      '<li><span>' + escapar(nt.texto) + '</span><time>' + escapar(nt.nombre || 'Informática') + ' · ' + tiempoRelativo(nt.fecha) + '</time></li>').join('');
    notasHtml =
      '<div class="ticket__notas">' +
        '<div class="ticket__notas-cab">' + ico('candado') + '<span>Notas internas</span><small>solo las ve informática</small></div>' +
        (notas ? '<ul>' + notas + '</ul>' : '') +
        '<form class="ticket__nota" data-id="' + escapar(t.id) + '"><input type="text" maxlength="500" placeholder="Qué has comprobado, a quién has llamado, qué falta…">' +
          '<button type="submit" class="btn btn--sutil btn--pequeno">Guardar nota</button></form>' +
      '</div>';
  }

  let encuesta = '';
  if (t.estado === 'resuelto' && mio) {
    encuesta = t.encuesta
      ? '<div class="ticket__valorado">' + estrellasHtml(Number(t.encuesta.estrellas) || 0) +
          '<span>Tu valoración' + (t.encuesta.tiempo ? ' · ' + TIEMPOS_ENCUESTA[t.encuesta.tiempo] : '') +
          (t.encuesta.contacto ? ' · te atendió ' + escapar(t.encuesta.contacto) : '') + '</span></div>'
      : '<form class="ticket__encuesta" data-id="' + escapar(t.id) + '" data-estrellas="0">' +
          '<strong>¿Cómo ha ido? Valora la atención</strong>' +
          '<div class="ticket__encuesta-fila"><span>Calidad de la atención</span>' +
            '<div class="ticket__estrellas">' + [1, 2, 3, 4, 5].map((i) =>
              '<button type="button" class="estrella-btn" data-accion="ticket-estrella" data-valor="' + i + '" aria-label="' + i + ' de 5 estrellas">' + ico('estrella') + '</button>').join('') +
            '</div><em class="ticket__estrellas-txt">Elige de 1 a 5 estrellas</em></div>' +
          '<div class="ticket__encuesta-fila"><span>¿Se resolvió a tiempo?' + (resueltoEn ? ' <small>(tardó ' + resueltoEn + ')</small>' : '') + '</span>' + Object.entries(TIEMPOS_ENCUESTA).map(([v, txt]) =>
            '<label class="ticket__radio"><input type="radio" name="tiempo-' + escapar(t.id) + '" value="' + v + '"><span>' + txt + '</span></label>').join('') + '</div>' +
          '<div class="ticket-form__fila">' +
            '<label class="ticket__campo"><span>¿Quién te atendió?</span><input type="text" name="contacto" maxlength="80" placeholder="Nombre"></label>' +
            '<label class="ticket__campo"><span>Tu feedback (opcional)</span><input type="text" name="comentario" maxlength="500" placeholder="Qué ha ido bien o qué mejorarías"></label>' +
          '</div>' +
          '<button type="submit" class="btn btn--oro btn--pequeno">' + ico('enviar') + '<span>Enviar valoración</span></button>' +
        '</form>';
  } else if (t.encuesta && admin) {
    encuesta = '<div class="ticket__valorado">' + estrellasHtml(Number(t.encuesta.estrellas) || 0) +
      '<span><b>Calidad ' + (Number(t.encuesta.estrellas) || 0) + '/5</b> según ' + escapar(t.nombre || 'la persona') +
      (t.encuesta.tiempo ? ' · tiempo: ' + TIEMPOS_ENCUESTA[t.encuesta.tiempo].toLowerCase() : '') + (resueltoEn ? ' (' + resueltoEn + ' reales)' : '') +
      (t.encuesta.contacto ? ' · atendió ' + escapar(t.encuesta.contacto) : '') +
      (t.encuesta.comentario ? '<q class="ticket__feedback">' + escapar(t.encuesta.comentario) + '</q>' : '') + '</span></div>';
  }

  const responder = (mio || admin)
    ? '<form class="ticket__responder" data-id="' + escapar(t.id) + '">' +
        '<textarea rows="1" maxlength="1000" placeholder="' + (admin && !mio ? 'Responder a ' + escapar(t.nombre || 'la persona') : 'Añadir un mensaje para informática') + '"></textarea>' +
        '<button type="submit" class="btn btn--secundario btn--pequeno">' + ico('enviar') + '<span>Enviar</span></button>' +
      '</form>'
    : '';

  const buscable = (t.numero + ' ' + t.titulo + ' ' + (t.nombre || '') + ' ' + (t.descripcion || '') + ' ' + (CATEGORIAS_TICKET[t.categoria] || '')).toLowerCase();
  return (
    '<article class="ticket ticket--' + escapar(t.estado) + ' ticket--urg-' + escapar(t.urgencia || 'normal') + (atrasado ? ' ticket--tarde' : '') +
      '" id="ticket-' + escapar(t.id) + '" data-buscar="' + escapar(buscable) + '">' +
      '<header class="ticket__cab">' +
        '<span class="ticket__num">#' + Number(t.numero) + '</span>' +
        '<div class="ticket__txt"><strong>' + escapar(t.titulo) + '</strong>' +
          '<small>' + escapar(CATEGORIAS_TICKET[t.categoria] || 'Otra cosa') + ' · ' + escapar(URGENCIAS_TICKET[t.urgencia] || 'Normal') +
            ' · ' + tiempoRelativo(t.fecha) + (admin ? ' · ' + escapar(t.nombre || 'sin nombre') : '') +
            (resueltoEn ? ' · resuelto en ' + resueltoEn : (t.estado !== 'resuelto' ? ' · abierto ' + duracionLegible(Date.now() - new Date(t.fecha)) : '')) + '</small></div>' +
        (atrasado ? '<span class="pastilla pastilla--aviso ticket__tarde">' + ico('alerta') + 'Se retrasa</span>' : '') +
        '<span class="pastilla ' + estado.clase + '">' + ico(estado.icono) + estado.texto + '</span>' +
      '</header>' +
      (t.descripcion ? '<p class="ticket__desc">' + escapar(t.descripcion).replace(/\n/g, '<br>') + '</p>' : '') +
      (hilo ? '<ol class="ticket__hilo">' + hilo + '</ol>' : '') +
      (acciones ? '<div class="ticket__acciones">' + acciones + '</div>' : '') +
      ajustes + notasHtml + encuesta + rapidas + responder +
    '</article>'
  );
}

/* datos: { mios, todos, admin, miClave, filtro, cargado } */
export function vistaSoporte(d = {}) {
  const admin = Boolean(d.admin);
  const mios = d.mios || [];
  const opciones = { admin: false, miClave: d.miClave || '' };

  const formulario =
    '<section class="ticket-nuevo">' +
      '<div class="ticket-nuevo__cab">' +
        '<span class="ticket-nuevo__ico">' + ico('soporte') + '</span>' +
        '<div><h2>¿Algo no funciona? Abre un ticket</h2>' +
          '<p>Le llega a informática al momento. Cuenta qué pasa, en qué equipo y desde cuándo: cuanto más claro, antes se resuelve.</p></div>' +
      '</div>' +
      '<form id="ticket-form" class="ticket-form">' +
        '<label class="ticket__campo"><span>Qué pasa, en una línea</span>' +
          '<input type="text" name="titulo" maxlength="120" required placeholder="No puedo entrar en HubSpot"></label>' +
        '<div class="ticket-form__fila">' +
          '<label class="ticket__campo"><span>Tipo</span><select name="categoria">' +
            Object.entries(CATEGORIAS_TICKET).map(([v, txt]) => '<option value="' + v + '">' + txt + '</option>').join('') + '</select></label>' +
          '<div class="ticket__campo"><span>Urgencia</span><div class="ticket__urgencias">' +
            Object.entries(URGENCIAS_TICKET).map(([v, txt]) =>
              '<label class="ticket__radio ticket__radio--' + v + '"><input type="radio" name="urgencia" value="' + v + '"' + (v === 'normal' ? ' checked' : '') + '><span>' + txt + '</span></label>').join('') +
          '</div></div>' +
        '</div>' +
        '<label class="ticket__campo"><span>Detalles</span>' +
          '<textarea name="descripcion" rows="3" maxlength="2000" placeholder="Qué has intentado, qué mensaje sale, desde cuándo…"></textarea></label>' +
        '<div class="ticket-form__pie"><small>Nunca escribas aquí datos de clientes.</small>' +
          '<button type="submit" class="btn btn--oro">' + ico('enviar') + '<span>Enviar a informática</span></button></div>' +
      '</form>' +
    '</section>';

  let bandeja = '';
  if (admin) {
    const todos = d.todos || [];
    const r = resumenTickets(todos);
    const filtro = d.filtro || 'abiertos';
    const tipo = d.tipo || '';
    const ordenElegido = d.orden || 'urgencia';
    const porEstado = filtro === 'abiertos' ? todos.filter((t) => t.estado !== 'resuelto')
      : filtro === 'resueltos' ? todos.filter((t) => t.estado === 'resuelto') : todos;
    const visibles = tipo ? porEstado.filter((t) => (t.categoria || 'otro') === tipo) : porEstado;
    const porFecha = (a, b) => String(b.actualizado || b.fecha).localeCompare(String(a.actualizado || a.fecha));
    const orden = [...visibles].sort((a, b) =>
      ordenElegido === 'antiguos' ? -porFecha(a, b)
      : ordenElegido === 'recientes' ? porFecha(a, b)
      : ((PESO_URGENCIA[b.urgencia] || 2) - (PESO_URGENCIA[a.urgencia] || 2)) || porFecha(a, b));
    const filtros = [['abiertos', 'Abiertos (' + (r.pendientes + r.enProceso) + ')'], ['resueltos', 'Resueltos (' + r.resueltos + ')'], ['todos', 'Todos']]
      .map(([v, txt]) => '<button type="button" class="rk-meses__item' + (filtro === v ? ' rk-meses__item--activo' : '') + '" data-filtro-ticket="' + v + '">' + txt + '</button>').join('');
    // Tipos con cuántos hay en el filtro actual; un clic filtra por tipo.
    const cuentaTipo = (c) => porEstado.filter((t) => (t.categoria || 'otro') === c).length;
    const tipos = Object.entries(CATEGORIAS_TICKET).filter(([c]) => cuentaTipo(c) || c === tipo).map(([c, txt]) =>
      '<button type="button" class="bandeja-it__tipo' + (tipo === c ? ' bandeja-it__tipo--activo' : '') + '" data-ticket-tipo="' + c + '">' + txt + ' <b>' + cuentaTipo(c) + '</b></button>').join('');
    bandeja =
      '<section class="bandeja-it">' +
        '<div class="seccion-tit seccion-tit--fila"><h2>Bandeja de informática</h2>' +
          '<span class="rk__fecha">' + (d.cargado ? 'Solo lo ve administración · se actualiza sola cada minuto' : 'Cargando…') + '</span></div>' +
        '<div class="seg-cifras">' +
          piezaCifra(r.pendientes, r.pendientes === 1 ? 'pendiente' : 'pendientes', 'relojArena') +
          piezaCifra(r.enProceso, 'en proceso', 'reloj') +
          piezaCifra(r.tiempoMedio, 'tiempo medio de resolución', 'tickCirculo') +
          piezaCifra(r.valoracion, r.valoraciones ? 'valoración media (' + r.valoraciones + ')' : 'valoración media', 'estrella') +
        '</div>' +
        '<div class="bandeja-it__barra">' +
          '<input type="search" id="ticket-buscar" value="' + escapar(d.busqueda || '') + '" placeholder="Buscar por número, título, persona o texto…" aria-label="Buscar tickets">' +
          '<select id="ticket-orden" aria-label="Ordenar">' +
            [['urgencia', 'Urgentes primero'], ['recientes', 'Más recientes'], ['antiguos', 'Más antiguos']].map(([v, txt]) =>
              '<option value="' + v + '"' + (ordenElegido === v ? ' selected' : '') + '>' + txt + '</option>').join('') +
          '</select>' +
          '<button type="button" class="btn btn--secundario btn--pequeno" data-accion="exportar-tickets" title="Descarga el histórico en CSV para Excel">' + ico('descargar') + '<span>Exportar</span></button>' +
        '</div>' +
        '<div class="rk-meses">' + filtros + '</div>' +
        (tipos ? '<div class="bandeja-it__tipos">' + (tipo ? '<button type="button" class="bandeja-it__tipo bandeja-it__tipo--todos" data-ticket-tipo="">Todos los tipos</button>' : '') + tipos + '</div>' : '') +
        (orden.length
          ? orden.map((t) => piezaTicket(t, { admin: true, miClave: d.miClave || '' })).join('')
          : '<p class="actividad__vacio">' + (filtro === 'abiertos' ? 'Nada pendiente. Todo resuelto.' : 'Todavía no hay tickets aquí.') + '</p>') +
      '</section>';
  }

  const ordenMios = [...mios].sort((a, b) => String(b.actualizado || b.fecha).localeCompare(String(a.actualizado || a.fecha)));
  const abiertosMios = mios.filter((t) => t.estado !== 'resuelto').length;
  const misHtml = ordenMios.length
    ? ordenMios.map((t) => piezaTicket(t, opciones)).join('')
    : '<p class="actividad__vacio">Todavía no has abierto ningún ticket.' +
        (d.miClave ? '' : ' Para que informática sepa quién eres, entra con tu cuenta o pon tu nombre en Conecta.') + '</p>';

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      subnav('despacho', '#/soporte') +
      '<header class="pagina-cab">' +
        '<h1>Soporte informático</h1>' +
        '<p class="pagina-cab__sub">Pide ayuda con el ordenador, el correo, HubSpot, el teléfono o los accesos, y sigue cómo va tu ticket hasta que se resuelve.</p>' +
      '</header>' +
      formulario +
      bandeja +
      '<section class="mis-tickets">' +
        '<div class="seccion-tit seccion-tit--fila"><h2>Mis tickets</h2>' +
          (mios.length ? '<span class="rk__fecha">' + (abiertosMios ? abiertosMios + (abiertosMios === 1 ? ' abierto' : ' abiertos') : 'todo resuelto') + '</span>' : '') + '</div>' +
        misHtml +
      '</section>' +
    '</div>'
  );
}

/* ── Novedades ───────────────────────────────────────────────── */
const NIVELES = {
  critica:     { texto: 'Crítica',     clase: 'pastilla--aviso' },
  importante:  { texto: 'Importante',  clase: 'pastilla--info' },
  informativa: { texto: 'Informativa', clase: '' }
};

export function vistaNovedades() {
  const lista = novedades.map((nov, i) => {
    const nivel = NIVELES[nov.nivel] || NIVELES.informativa;
    const etiquetas = (nov.etiquetas || [])
      .map((e) => '<span class="pastilla">' + escapar(e) + '</span>').join('');

    return (
      '<article class="nov' + (i === 0 ? ' nov--nueva' : '') + '">' +
        '<div class="nov__caja">' +
          '<div class="nov__cab">' +
            '<span class="nov__fecha">' + formatearFecha(nov.fecha) + '</span>' +
            '<span class="pastilla ' + nivel.clase + '">' + nivel.texto + '</span>' +
            etiquetas +
          '</div>' +
          '<h3>' + escapar(nov.titulo) + '</h3>' +
          '<div class="prosa">' + render(nov.md) + '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  return (
    '<div class="envoltorio">' +
      subnav('despacho', '#/novedades') +
      '<header class="pagina-cab">' +
        '<h1>Novedades</h1>' +
        '<p class="pagina-cab__sub">Cambios en herramientas, procedimientos y normativa que afectan al trabajo del equipo. Revísalo al menos una vez por semana.</p>' +
      '</header>' +
      (lista ? '<div class="linea">' + lista + '</div>'
             : '<p class="prosa">Todavía no hay novedades publicadas.</p>') +
    '</div>'
  );
}

/* ── Búsqueda a página completa ──────────────────────────────── */
export function vistaBusqueda(consulta, resultados, resaltarFn, terminos) {
  const lista = resultados.length
    ? resultados.map((r) =>
        '<a class="tarjeta" href="' + r.ruta + '">' +
          '<span class="res__ruta">' + escapar(r.contexto) + '</span>' +
          '<h3>' + resaltarFn(r.titulo, terminos) + '</h3>' +
          '<p>' + resaltarFn(r.frag, terminos) + '</p>' +
        '</a>').join('')
    : '';

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      '<header class="pagina-cab">' +
        '<h1>Resultados de búsqueda</h1>' +
        '<p class="pagina-cab__sub">' + resultados.length +
          (resultados.length === 1 ? ' resultado para ' : ' resultados para ') +
          '<strong>' + escapar(consulta) + '</strong></p>' +
      '</header>' +
      (lista ? '<div class="rejilla">' + lista + '</div>'
             : '<p class="prosa">No se ha encontrado nada. Prueba con otras palabras o revisa el índice lateral.</p>') +
    '</div>'
  );
}

/* ── 404 ─────────────────────────────────────────────────────── */
export function vistaNoEncontrada() {
  return (
    '<div class="envoltorio">' +
      '<span class="no-encontrada__ico" aria-hidden="true">' + ico('brujula') + '</span>' +
      '<header class="pagina-cab">' +
        '<h1>Contenido no encontrado</h1>' +
        '<p class="pagina-cab__sub">La página que buscas no existe o ha cambiado de dirección.</p>' +
      '</header>' +
      '<a class="btn btn--primario" href="#/inicio">Volver al inicio</a>' +
    '</div>'
  );
}

/* ── Índice lateral ──────────────────────────────────────────── */
export function navegacionLateral(rutaActual, insignias = {}) {
  const ruta = String(rutaActual || '#/inicio');
  const enModulo = ruta.startsWith('#/modulo/');
  // Una sección está activa también en sus subpáginas (#/equipo/2026-05,
  // #/modulo/… dentro de Formación, #/muro como alias de Conecta).
  const activo = (destino) =>
    ruta === destino || ruta.startsWith(destino + '/') ||
    (destino === '#/formacion' && enModulo) ||
    (destino === '#/conecta' && ruta.startsWith('#/muro'));

  let orden = 0;
  const enlace = ([destino, icono, texto]) => {
    const n = insignias[destino];
    return (
      '<a class="nav-item" href="' + destino + '" style="--i:' + (orden++) + '"' + (activo(destino) ? ' aria-current="page"' : '') + '>' +
        '<span class="nav-item__ico">' + ico(icono) + '</span>' +
        '<span class="nav-item__txt">' + texto + '</span>' +
        (n ? '<span class="nav-item__insignia">' + escapar(String(n)) + '</span>' : '') +
      '</a>'
    );
  };

  // Todo a la vista, agrupado: lo que antes estaba en desplegables.
  const grupos = [
    ['', [['#/inicio', 'inicio', 'Inicio']]],
    ['Formación', [
      ['#/formacion',  'formacion',  'Itinerario de formación'],
      ['#/videos',     'video',      'Videoteca'],
      ['#/onboarding', 'onboarding', 'Tu primera semana']
    ]],
    ['Despacho', [
      ['#/novedades',  'novedades',  'Novedades'],
      ['#/equipo',     'equipo',     'Equipo y ranking'],
      ['#/modelos',    'modelos',    'Modelos de documentos'],
      ['#/soporte',    'soporte',    'Soporte informático']
    ].concat(modoAdmin ? [['#/seguimiento', 'grafica', 'Seguimiento (dirección)']] : [])],
    ['Tú y el equipo', [
      ['#/conecta',    'conecta',    'Conecta'],
      ['#/objetivos',  'objetivos',  'Mis objetivos'],
      ['#/perfil',     'perfil',     'Mi perfil']
    ]]
  ];
  const principal = grupos.map(([titulo, enlaces]) =>
    '<div class="nav-grupo">' +
      (titulo ? '<div class="nav-grupo__tit"><i></i>' + titulo + '</div>' : '') +
      enlaces.map(enlace).join('') +
    '</div>'
  ).join('');

  if (!enModulo) return principal;

  // Dentro de un módulo, debajo va el índice de módulos por bloques,
  // con el avance de cada uno.
  const modulos = GRUPOS.map((g) => {
    const mods = modulosDeGrupo(g.id);
    if (!mods.length) return '';
    const items = mods.map((mod) => {
      const claves = clavesDe(mod);
      const completo = progreso.contar(claves) === claves.length;
      const esActual = ruta === '#/modulo/' + mod.id || ruta.startsWith('#/modulo/' + mod.id + '/');
      return (
        '<a class="nav-item nav-item--modulo' + (completo ? ' nav-item--hecho' : '') + '" href="#/modulo/' + mod.id + '" style="--i:' + (orden++) + '"' +
          (esActual ? ' aria-current="page"' : '') + '>' +
          '<span class="nav-item__n">' + mod.num + '</span>' +
          '<span class="nav-item__txt">' + escapar(mod.titulo) + '</span>' +
          ico('tick', 'nav-item__tick') +
        '</a>'
      );
    }).join('');
    return '<div class="nav-grupo"><div class="nav-grupo__tit"><i></i>' + escapar(g.titulo) + '</div>' + items + '</div>';
  }).join('');

  return principal + '<div class="nav-separador">Módulos del itinerario</div>' + modulos;
}

export { VERSION };
