/* ===============================================================
   vistas.js - Generación del HTML de cada pantalla
   =============================================================== */

import {
  MODULOS, GRUPOS, LECCIONES, VERSION,
  moduloPorId, modulosDeGrupo, TOTAL_LECCIONES, TOTAL_MINUTOS
} from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import { render, escapar } from './markdown.js';
import { progreso } from './estado.js';

/* ── Utilidades ──────────────────────────────────────────────── */
const clavesDe = (mod) => mod.lecciones.map((l) => mod.id + '/' + l.id);

const ico = (d, clase = '') =>
  '<svg class="' + clase + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';

const ICO = {
  reloj: 'M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  libro: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  tick: 'M20 6L9 17l-5-5',
  flecha: 'M5 12h14M13 6l6 6-6 6'
};

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
  p.push('<span class="pastilla">' + ico(ICO.reloj) + mod.duracion + ' min</span>');
  p.push('<span class="pastilla">' + ico(ICO.libro) + mod.lecciones.length +
         (mod.lecciones.length === 1 ? ' lección' : ' lecciones') + '</span>');
  return p.join('');
}

function tarjetaModulo(mod) {
  const claves = clavesDe(mod);
  const hechas = progreso.contar(claves);
  const completo = hechas === claves.length;
  return (
    '<a class="tarjeta' + (completo ? ' tarjeta--hecha' : '') + '" href="#/modulo/' + mod.id + '">' +
      '<div class="tarjeta__cab">' +
        '<span class="tarjeta__n">' + (completo ? ico(ICO.tick) : mod.num) + '</span>' +
        '<h3>' + escapar(mod.titulo) + '</h3>' +
      '</div>' +
      '<p>' + escapar(mod.resumen) + '</p>' +
      '<div class="tarjeta__pie">' +
        pastillasModulo(mod) +
        (hechas > 0 && !completo
          ? '<span class="pastilla pastilla--info">' + hechas + '/' + claves.length + '</span>'
          : '') +
        (completo ? '<span class="pastilla pastilla--ok">' + ico(ICO.tick) + 'Completado</span>' : '') +
      '</div>' +
    '</a>'
  );
}

/* ── Portada ─────────────────────────────────────────────────── */
export function vistaInicio() {
  const hechas = progreso.contar(LECCIONES.map((l) => l.clave));
  const pct = TOTAL_LECCIONES ? Math.round((hechas / TOTAL_LECCIONES) * 100) : 0;

  // Siguiente lección pendiente del itinerario.
  const siguiente = LECCIONES.find((l) => !progreso.hecha(l.clave));
  const empezado = hechas > 0;

  const grupos = GRUPOS.map((g) => {
    const mods = modulosDeGrupo(g.id);
    if (!mods.length) return '';
    return (
      '<section>' +
        '<div class="seccion-tit"><h2>' + escapar(g.titulo) + '</h2></div>' +
        '<p style="margin:-.5rem 0 1.1rem;color:var(--tinta-3);font-size:.9rem;max-width:60ch">' +
          escapar(g.descripcion) + '</p>' +
        '<div class="rejilla">' + mods.map(tarjetaModulo).join('') + '</div>' +
      '</section>'
    );
  }).join('');

  const ultimaNovedad = novedades[0];

  return (
    '<div class="envoltorio envoltorio--ancho">' +
      '<div class="heroe">' +
        '<p class="heroe__saludo">Plataforma de formación interna</p>' +
        '<h1>' + (empezado ? 'Continúa donde lo dejaste' : 'Bienvenido o bienvenida a Díaz y Asociados') + '</h1>' +
        '<p>' + (empezado
          ? 'Llevas ' + hechas + ' de ' + TOTAL_LECCIONES + ' lecciones completadas. Aquí encontrarás todo lo que necesitas para trabajar con criterio en el despacho.'
          : 'Aquí está reunido cómo funciona el despacho, qué herramientas usamos y cuáles son los procedimientos del día a día. Sigue el itinerario en orden y marca cada lección al terminarla.') +
        '</p>' +
        '<div class="heroe__acciones">' +
          (siguiente
            ? '<a class="btn btn--primario" href="#/modulo/' + siguiente.moduloId + '/' + siguiente.id + '">' +
                (empezado ? 'Continuar' : 'Empezar el itinerario') + ico(ICO.flecha) + '</a>'
            : '<span class="btn btn--primario">Itinerario completado' + ico(ICO.tick) + '</span>') +
          '<a class="btn btn--secundario" href="#/novedades">Ver novedades</a>' +
        '</div>' +
      '</div>' +

      '<div class="cifras">' +
        '<div class="cifra"><span class="cifra__n">' + MODULOS.length + '</span><span class="cifra__t">Módulos</span></div>' +
        '<div class="cifra"><span class="cifra__n">' + TOTAL_LECCIONES + '</span><span class="cifra__t">Lecciones</span></div>' +
        '<div class="cifra"><span class="cifra__n">' + Math.round(TOTAL_MINUTOS / 60) + ' h</span><span class="cifra__t">Duración estimada</span></div>' +
        '<div class="cifra"><span class="cifra__n">' + pct + '%</span><span class="cifra__t">Tu avance</span></div>' +
      '</div>' +

      (ultimaNovedad
        ? '<a class="llamada llamada--nota" href="#/novedades" style="text-decoration:none">' +
            ico('M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0', 'llamada__ico') +
            '<div class="llamada__txt"><span class="llamada__tit">Última novedad · ' +
              formatearFecha(ultimaNovedad.fecha) + '</span>' +
              '<p>' + escapar(ultimaNovedad.titulo) + '</p></div>' +
          '</a>'
        : '') +

      grupos +
    '</div>'
  );
}

/* ── Módulo ──────────────────────────────────────────────────── */
export function vistaModulo(idModulo, idLeccion) {
  const mod = moduloPorId(idModulo);
  if (!mod) return vistaNoEncontrada();

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
          '<span class="leccion__marca">' + ico(ICO.tick) + '</span>' +
          '<span class="leccion__tit">' + escapar(lec.titulo) + '</span>' +
          ico('M6 9l6 6 6-6', 'leccion__flecha') +
        '</button>' +
        '<div class="leccion__cuerpo prosa"' + (abierta ? '' : ' hidden') + '>' +
          render(lec.md) +
          '<div class="leccion__acciones">' +
            '<button class="btn ' + (hecha ? 'btn--secundario' : 'btn--ok') + '" data-accion="marcar" data-clave="' +
              escapar(clave) + '">' + ico(ICO.tick) +
              (hecha ? 'Marcar como pendiente' : 'Marcar como completada') + '</button>' +
          '</div>' +
        '</div>' +
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

      lecciones +

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
      '<nav class="migas" aria-label="Ruta de navegación">' +
        '<a href="#/inicio">Inicio</a><span aria-hidden="true">/</span><span>Novedades</span>' +
      '</nav>' +
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
      '<header class="pagina-cab">' +
        '<h1>Contenido no encontrado</h1>' +
        '<p class="pagina-cab__sub">La página que buscas no existe o ha cambiado de dirección.</p>' +
      '</header>' +
      '<a class="btn btn--primario" href="#/inicio">Volver al inicio</a>' +
    '</div>'
  );
}

/* ── Índice lateral ──────────────────────────────────────────── */
export function navegacionLateral(rutaActual) {
  return GRUPOS.map((g) => {
    const mods = modulosDeGrupo(g.id);
    if (!mods.length) return '';

    const items = mods.map((mod) => {
      const claves = clavesDe(mod);
      const completo = progreso.contar(claves) === claves.length;
      const activo = rutaActual === '#/modulo/' + mod.id ||
                     rutaActual.startsWith('#/modulo/' + mod.id + '/');
      return (
        '<a class="nav-item' + (completo ? ' nav-item--hecho' : '') + '" href="#/modulo/' + mod.id + '"' +
          (activo ? ' aria-current="page"' : '') + '>' +
          '<span class="nav-item__n">' + mod.num + '</span>' +
          '<span class="nav-item__txt">' + escapar(mod.titulo) + '</span>' +
          ico(ICO.tick, 'nav-item__tick') +
        '</a>'
      );
    }).join('');

    return (
      '<div class="nav-grupo">' +
        '<div class="nav-grupo__tit"><i></i>' + escapar(g.titulo) + '</div>' +
        items +
      '</div>'
    );
  }).join('') +
  '<div class="nav-grupo">' +
    '<div class="nav-grupo__tit"><i></i>General</div>' +
    '<a class="nav-item" href="#/novedades"' + (rutaActual === '#/novedades' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">N</span><span class="nav-item__txt">Novedades</span>' +
    '</a>' +
  '</div>';
}

export { VERSION };
