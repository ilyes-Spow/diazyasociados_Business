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
import { render, escapar } from './markdown.js';
import { progreso, sesion, objetivosHechos } from './estado.js';

/* ── Utilidades ──────────────────────────────────────────────── */
const clavesDe = (mod) => mod.lecciones.map((l) => mod.id + '/' + l.id);

/* Puntos que otorga cada lección completada. */
export const XP_LECCION = 20;

const ico = (d, clase = '') =>
  '<svg class="' + clase + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';

const ICO = {
  reloj: 'M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  libro: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  tick: 'M20 6L9 17l-5-5',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  candado: 'M5 10.5h14v9.5H5zM8.5 10.5V7.5a3.5 3.5 0 017 0v3',
  estrella: 'M12 3l2.2 4.8 5.3 1.2-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 9l5.3-1.2z',
  campana: 'M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  columnas: 'M4 9.5L12 4l8 5.5M5.5 11.5h13M7.5 14v5M12 14v5M16.5 14v5M5 21h14',
  bandera: 'M6 21V4M6 5h11l-2.5 3.5L17 12H6',
  diana: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 12h.01',
  documento: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4',
  descarga: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  trofeo: 'M8 21h8M12 17v4M7 4h10v4.5a5 5 0 01-10 0zM7 6H4.5a2.5 2.5 0 002.5 3M17 6h2.5A2.5 2.5 0 0117 9',
  calendario: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  brujula: 'M12 21a9 9 0 100-18 9 9 0 000 18zM14.5 9.5l-1.7 4.3-4.3 1.7 1.7-4.3z',
  usuarios: 'M9 11a3.2 3.2 0 100-6.4A3.2 3.2 0 009 11zM3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5M16.5 11.6a2.6 2.6 0 100-5.2M15 14.7c2.3.1 4.2 1.5 4.8 4.3'
};

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
    { nombre: 'Primer día', icono: ICO.estrella, ganada: true },
    { nombre: 'En marcha', icono: ICO.brujula, ganada: total >= 1 },
    { nombre: 'Con método', icono: ICO.libro, ganada: Boolean(m3 && moduloCompleto(m3)) },
    { nombre: 'Del equipo', icono: ICO.usuarios, ganada: Boolean(m4 && moduloCompleto(m4)) }
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

/* Objetivos asignados por RRHH a la persona con sesión abierta. */
export function objetivosDelMes() {
  const u = sesion.usuario();
  const correo = (u && u.correo || '').toLowerCase();
  if (!correo) return { correo: '', lista: [] };
  const porMes = objetivos[correo] || {};
  const lista = porMes[mesActual()] || [];
  return { correo, lista };
}

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
  p.push('<span class="pastilla">' + ico(ICO.reloj) + mod.duracion + ' min</span>');
  p.push('<span class="pastilla">' + ico(ICO.libro) + mod.lecciones.length +
         (mod.lecciones.length === 1 ? ' lección' : ' lecciones') + '</span>');
  return p.join('');
}

/* ── Portada ─────────────────────────────────────────────────── */
export function vistaInicio() {
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
          ico(ICO.campana) + '</span>' +
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
      '<span class="acceso-rapido__ico acceso-rapido__ico--marino">' + ico(ICO.columnas) + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Itinerario de formación</strong>' +
        '<span>' + MODULOS.length + ' módulos en ' + GRUPOS.length + ' bloques</span></span>' +
      ico('M9 6l6 6-6 6', 'acceso-rapido__flecha') +
    '</a>' +
    '<a class="acceso-rapido" href="#/onboarding">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--oro">' + ico(ICO.bandera) + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Tu primera semana</strong>' +
        '<span>Onboarding guiado por niveles</span></span>' +
      ico('M9 6l6 6-6 6', 'acceso-rapido__flecha') +
    '</a>' +
    '<a class="acceso-rapido" href="#/novedades">' +
      '<span class="acceso-rapido__ico acceso-rapido__ico--info">' + ico(ICO.campana) + '</span>' +
      '<span class="acceso-rapido__txt"><strong>Novedades</strong>' +
        '<span>Histórico de avisos del despacho</span></span>' +
      ico('M9 6l6 6-6 6', 'acceso-rapido__flecha') +
    '</a>';

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
                  'Continuar: ' + escapar(modSiguiente.titulo) + ico(ICO.flecha) + '</a>' +
                '<span class="panel-heroe__nota">Módulo ' + modSiguiente.num + ' de ' + MODULOS.length +
                  (pendientesDelMod === 1 ? ' · te queda 1 lección' : ' · te quedan ' + pendientesDelMod + ' lecciones') + '</span>'
              : '<a class="btn btn--oro" href="#/novedades">Ver novedades' + ico(ICO.flecha) + '</a>') +
          '</div>' +
        '</div>' +
        '<div class="panel-anillo">' +
          '<svg viewBox="0 0 120 120" role="img" aria-label="Progreso general: ' + pct + '%">' +
            '<circle cx="60" cy="60" r="52" fill="none" stroke="var(--fondo-alt)" stroke-width="11"/>' +
            '<circle cx="60" cy="60" r="52" fill="none" stroke="var(--oro-500)" stroke-width="11" stroke-linecap="round" ' +
              'stroke-dasharray="' + arco + ' ' + Math.round(circun) + '" transform="rotate(-90 60 60)"/>' +
            '<text x="60" y="57" text-anchor="middle" class="panel-anillo__pct">' + pct + '%</text>' +
            '<text x="60" y="76" text-anchor="middle" class="panel-anillo__et">completado</text>' +
          '</svg>' +
          '<strong>Tu progreso general</strong>' +
          '<span>' + modulosHechos + (modulosHechos === 1 ? ' módulo completado' : ' módulos completados') +
            ' · ' + puntos + ' puntos</span>' +
        '</div>' +
      '</div>' +

      '<div class="panel-columnas">' +
        '<section class="panel-col">' +
          '<div class="seccion-tit seccion-tit--fila"><h2>Novedades del despacho</h2>' +
            '<a class="seccion-tit__mas" href="#/novedades">Ver todas</a></div>' +
          (tarjetasNovedades
            ? '<div class="nov-lista">' + tarjetasNovedades + '</div>'
            : '<p class="prosa">Todavía no hay novedades publicadas.</p>') +
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

/* ── Objetivos del mes (asignados por RRHH) ──────────────────── */
function tarjetaObjetivos() {
  const { correo, lista } = objetivosDelMes();

  let cuerpo;
  if (!correo) {
    cuerpo = '<p class="objetivos__vacio">Entra con tu cuenta de Google para ver los objetivos que te asigne RRHH.</p>';
  } else if (!lista.length) {
    cuerpo = '<p class="objetivos__vacio">RRHH todavía no ha publicado tus objetivos de este mes.</p>';
  } else {
    const hechos = lista.filter((o) => objetivosHechos.hecho(mesActual() + '/' + o.id)).length;
    cuerpo =
      '<div class="objetivos__cuenta">' + hechos + ' de ' + lista.length + ' completados</div>' +
      '<div class="objetivos__lista">' +
        lista.map((o) => {
          const clave = mesActual() + '/' + o.id;
          const hecho = objetivosHechos.hecho(clave);
          return (
            '<button type="button" class="objetivo' + (hecho ? ' objetivo--hecho' : '') +
              '" data-accion="objetivo" data-id="' + escapar(clave) + '">' +
              '<span class="objetivo__marca">' + (hecho ? ico(ICO.tick) : '') + '</span>' +
              '<span>' + escapar(o.texto) + '</span>' +
            '</button>'
          );
        }).join('') +
      '</div>';
  }

  return (
    '<div class="objetivos">' +
      '<div class="objetivos__cab">' +
        '<span class="objetivos__ico">' + ico(ICO.diana) + '</span>' +
        '<div><strong>Tus objetivos del mes</strong>' +
        '<small>' + nombreDeMes(mesActual()) + ' · asignados por RRHH</small></div>' +
      '</div>' +
      cuerpo +
    '</div>'
  );
}

/* ── Equipo: empleado del mes y tablón ───────────────────────── */
const TIPOS_TABLON = {
  evento:      { texto: 'Evento',      icono: 'calendario', clase: 'tab-anuncio__ico--evento' },
  aviso:       { texto: 'Aviso',       icono: 'campana',    clase: 'tab-anuncio__ico--aviso' },
  celebracion: { texto: 'Celebración', icono: 'trofeo',     clase: 'tab-anuncio__ico--celebracion' }
};

export function vistaEquipo() {
  const edm = equipo.empleadosDelMes[0];
  const historial = equipo.empleadosDelMes.slice(1, 7);

  const avatarDe = (p, clase) => p.foto
    ? '<span class="' + clase + '"><img src="' + escapar(p.foto) + '" alt=""></span>'
    : '<span class="' + clase + '">' + escapar(p.iniciales || (p.nombre || '?').slice(0, 2).toUpperCase()) + '</span>';

  const destacado = edm
    ? '<div class="edm">' +
        '<div class="edm__aura" aria-hidden="true"></div>' +
        '<span class="edm__cinta">' + ico(ICO.trofeo) + 'Empleado/a del mes · ' + nombreDeMes(edm.mes) + '</span>' +
        avatarDe(edm, 'edm__avatar') +
        '<h2>' + escapar(edm.nombre) + '</h2>' +
        '<p>' + escapar(edm.motivo || '') + '</p>' +
      '</div>'
    : '<div class="edm edm--vacio">' +
        '<span class="edm__cinta">' + ico(ICO.trofeo) + 'Empleado/a del mes</span>' +
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
            '<span class="tab-anuncio__ico ' + tipo.clase + '">' + ico(ICO[tipo.icono]) + '</span>' +
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

  const rk = equipo.ranking || { actualizado: '', personas: [] };
  const clasificados = [...(rk.personas || [])].sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
  // Puntuaciones con coma decimal, al estilo español (9,5).
  const puntuacion = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-ES');
  let rankingHtml = '';
  if (clasificados.length) {
    const podio = clasificados.slice(0, 3);
    const resto = clasificados.slice(3);
    // El podio se pinta 2º · 1º · 3º, como en los juegos.
    const orden = [podio[1], podio[0], podio[2]].filter(Boolean);
    const corona =
      '<span class="podio__corona" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24"><path d="M4 18h16M4.5 16.5L3 7l5 4 4-6.5L16 11l5-4-1.5 9.5z" fill="currentColor" stroke="none"/></svg>' +
      '</span>';
    const podioHtml = orden.map((p) => {
      const puesto = clasificados.indexOf(p) + 1;
      return (
        '<div class="podio__puesto podio__puesto--' + puesto + '">' +
          (puesto === 1 ? corona : '<div class="podio__medalla">' + puesto + '</div>') +
          avatarDe(p, 'podio__avatar') +
          '<strong>' + escapar(p.nombre) + '</strong>' +
          '<span class="podio__puntos">' + puntuacion(p.puntos) + '</span>' +
          '<div class="podio__peana">' + (puesto !== 1 ? '<b>' + puesto + '</b>' : '') + '</div>' +
        '</div>'
      );
    }).join('');
    const restoHtml = resto.map((p, i) =>
      '<div class="rk-fila">' +
        '<span class="rk-fila__n">' + (i + 4) + '</span>' +
        avatarDe(p, 'rk-fila__avatar') +
        '<strong>' + escapar(p.nombre) + '</strong>' +
        '<span class="rk-fila__puntos">' + puntuacion(p.puntos) + '</span>' +
      '</div>'
    ).join('');
    rankingHtml =
      '<section class="rk">' +
        '<div class="seccion-tit seccion-tit--fila"><h2>Ranking de formación</h2>' +
          (rk.actualizado ? '<span class="rk__fecha">Actualizado el ' + formatearFecha(rk.actualizado) + '</span>' : '') +
        '</div>' +
        '<div class="podio">' + podioHtml + '</div>' +
        (restoHtml ? '<div class="rk-lista">' + restoHtml + '</div>' : '') +
        '<p class="onb-nota">Lo publica RRHH periódicamente a partir de los puntos de formación de cada persona.</p>' +
      '</section>';
  } else {
    rankingHtml =
      '<section class="rk">' +
        '<div class="seccion-tit"><h2>Ranking de formación</h2></div>' +
        '<p class="objetivos__vacio" style="color:var(--tinta-3)">RRHH publicará aquí la clasificación del equipo. Suma puntos completando lecciones y módulos.</p>' +
      '</section>';
  }

  return (
    '<div class="envoltorio envoltorio--ancho">' +
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
              '<span class="modelo__ico">' + ico(ICO.documento) +
                '<b>' + escapar(extension) + '</b></span>' +
              '<div class="modelo__txt">' +
                '<strong>' + escapar(m.titulo) + '</strong>' +
                (m.descripcion ? '<p>' + escapar(m.descripcion) + '</p>' : '') +
                '<small>' + tamanoLegible(m.bytes) +
                  (m.actualizado ? ' · actualizado el ' + formatearFecha(m.actualizado) : '') + '</small>' +
              '</div>' +
              '<a class="btn btn--oro modelo__boton" href="' + escapar(m.archivo) + '" download>' +
                ico(ICO.descarga) + 'Descargar</a>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
    '</section>'
  ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +
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
            '<span class="itin-mod__n">Módulo ' + mod.num + '</span>' +
            (completo
              ? '<span class="itin-mod__marca itin-mod__marca--ok">' + ico(ICO.tick) + '</span>' :
             actual
              ? '<span class="itin-mod__resta">' + (claves.length - n) +
                  (claves.length - n === 1 ? ' lección restante' : ' lecciones restantes') + '</span>'
              : (n === 0 ? '<span class="itin-mod__marca">' + ico(ICO.candado) + '</span>'
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
      '<div class="itin-cab">' +
        '<div>' +
          '<h1>Itinerario de formación</h1>' +
          '<p class="pagina-cab__sub">' + GRUPOS.length + ' bloques temáticos · ' + MODULOS.length +
            ' módulos · ' + Math.round(TOTAL_MINUTOS / 60) + ' h estimadas. Avanza en orden o salta al que necesites.</p>' +
        '</div>' +
        '<div class="itin-datos">' +
          '<span><small>Completados</small><strong>' + modulosHechos + ' / ' + MODULOS.length + '</strong></span>' +
          '<span><small>Puntos</small><strong class="itin-datos__oro">' + puntos + '</strong></span>' +
          '<span><small>Insignias</small><strong>' + nInsignias + '</strong></span>' +
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
          (completo ? ico(ICO.tick) : (esActual ? '<b>' + (i + 1) + '</b>' : ico(ICO.candado))) +
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
        '<span class="mision__marca">' + (hecha ? ico(ICO.tick) : '') + '</span>' +
        '<span class="mision__txt">' + escapar(lec.titulo) + '</span>' +
        '<span class="mision__xp">+' + XP_LECCION + ' XP</span>' +
      '</button>'
    );
  }).join('') : '';

  const listaInsignias = insignias().map((ins) =>
    '<span class="insignia' + (ins.ganada ? '' : ' insignia--pte') + '">' +
      '<span class="insignia__aro">' + ico(ins.ganada ? ins.icono : ICO.candado) + '</span>' +
      '<span class="insignia__nom">' + escapar(ins.nombre) + '</span>' +
    '</span>'
  ).join('');

  return (
    '<div class="envoltorio envoltorio--ancho">' +

      '<div class="onb-heroe">' +
        '<div class="onb-heroe__cab">' +
          '<div class="onb-heroe__txt">' +
            '<p class="panel-heroe__cinta">Tu primera semana</p>' +
            '<h1>' + (nombre ? 'Te damos la bienvenida, ' + escapar(nombre) + '.' : 'Te damos la bienvenida al despacho.') + '</h1>' +
            '<p class="panel-heroe__sub">Como en un juego: empieza por el nivel 1 y desbloquea el siguiente al completar cada uno. Cada nivel es un módulo del itinerario, con sus misiones.</p>' +
          '</div>' +
          '<div class="onb-xp">' +
            '<span class="onb-xp__fila"><span>' + (terminado ? 'Onboarding completado' : 'Nivel ' + nivelActual + ' de ' + niveles.length) + '</span>' +
              '<b>' + xpGanada + ' / ' + xpTotal + ' XP</b></span>' +
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
              '<a class="btn btn--primario" href="#/formacion">Ir al itinerario' + ico(ICO.flecha) + '</a>') +
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
    '<a class="nav-item" href="#/formacion"' + (rutaActual === '#/formacion' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">I</span><span class="nav-item__txt">Itinerario de formación</span>' +
    '</a>' +
    '<a class="nav-item" href="#/onboarding"' + (rutaActual === '#/onboarding' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">1ª</span><span class="nav-item__txt">Tu primera semana</span>' +
    '</a>' +
    '<a class="nav-item" href="#/novedades"' + (rutaActual === '#/novedades' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">N</span><span class="nav-item__txt">Novedades</span>' +
    '</a>' +
    '<a class="nav-item" href="#/equipo"' + (rutaActual === '#/equipo' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">E</span><span class="nav-item__txt">Equipo</span>' +
    '</a>' +
    '<a class="nav-item" href="#/modelos"' + (rutaActual === '#/modelos' ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-item__n">M</span><span class="nav-item__txt">Modelos de documentos</span>' +
    '</a>' +
  '</div>';
}

export { VERSION };
