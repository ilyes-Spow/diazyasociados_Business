/* ===============================================================
   markdown.js - Renderizador de un subconjunto de Markdown
   ---------------------------------------------------------------
   Soporta: encabezados (##, ###, ####), párrafos, listas ordenadas
   y sin ordenar (con anidación), casillas de verificación, tablas,
   citas, llamadas (> [!NOTA]), separadores, bloques de código y
   marcas en línea (**negrita**, *cursiva*, `código`, [enlace](url)).
   =============================================================== */

import { ico } from './iconos.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/* Tipos de llamada disponibles: > [!NOTA] Texto */
const LLAMADAS = {
  NOTA:      { clase: 'nota',      titulo: 'Nota',           icono: 'info' },
  AVISO:     { clase: 'aviso',     titulo: 'Atención',       icono: 'alerta' },
  IMPORTANTE:{ clase: 'peligro',   titulo: 'Importante',     icono: 'alertaCirculo' },
  CLAVE:     { clase: 'clave',     titulo: 'Idea clave',     icono: 'bombilla' },
  BUENA:     { clase: 'ok',        titulo: 'Buena práctica', icono: 'tickCirculo' },
  PENDIENTE: { clase: 'pendiente', titulo: 'Pendiente de completar', icono: 'relojArena' }
};

const TICK = ico('tick');

/* Centinela interno para apartar el código en línea del resto de reglas. */
const SEP = '\uE000';
const RE_SEP = new RegExp(SEP + '(\\d+)' + SEP, 'g');

/* -- Marcas en línea ------------------------------------------ */
export function enLinea(texto) {
  let s = escapar(texto);

  const trozos = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    trozos.push('<code>' + c + '</code>');
    return SEP + (trozos.length - 1) + SEP;
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
    const externo = /^https?:\/\//i.test(url);
    const extra = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
    return '<a href="' + url + '"' + extra + '>' + txt + '</a>';
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:)!?]|$)/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return s.replace(RE_SEP, (_, i) => trozos[+i]);
}

/* -- Vídeos ---------------------------------------------------- */
/* Interpreta la URL y devuelve el tipo de reproductor y su origen.
   Se usa youtube-nocookie y carga diferida: no se contacta con el
   proveedor hasta que alguien pulsa el botón de reproducir. */
export function interpretarVideo(url) {
  const limpia = String(url || '').trim();

  const yt = limpia.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (yt) return { tipo: 'incrustado', proveedor: 'YouTube', src: 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0' };

  const vimeo = limpia.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { tipo: 'incrustado', proveedor: 'Vimeo', src: 'https://player.vimeo.com/video/' + vimeo[1] };

  const loom = limpia.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/);
  if (loom) return { tipo: 'incrustado', proveedor: 'Loom', src: 'https://www.loom.com/embed/' + loom[1] };

  if (/^https?:\/\//i.test(limpia) && /\.(mp4|webm|ogv)(\?|$)/i.test(limpia)) {
    return { tipo: 'archivo', proveedor: 'Vídeo', src: limpia };
  }
  if (/^(?!https?:)[\w./-]+\.(mp4|webm|ogv)$/i.test(limpia)) {
    return { tipo: 'archivo', proveedor: 'Vídeo', src: limpia };
  }

  return { tipo: 'enlace', proveedor: 'Enlace', src: limpia };
}

function renderVideo(lineas) {
  const url = (lineas[0] || '').trim();
  const titulo = lineas.slice(1).join(' ').trim();
  return videoHtml(url, titulo);
}

/* HTML de un vídeo a partir de su dirección. Lo usan los bloques
   :::video del Markdown y el vídeo principal de cada lección. */
export function videoHtml(url, titulo) {
  const v = interpretarVideo(String(url || '').trim());
  const rotulo = titulo || 'Vídeo de formación';

  if (v.tipo === 'enlace') {
    return '<p class="video-enlace"><a href="' + escapar(v.src) +
           '" target="_blank" rel="noopener noreferrer">' + escapar(rotulo) + '</a></p>';
  }

  if (v.tipo === 'archivo') {
    return '<figure class="video"><video controls preload="none" playsinline src="' +
           escapar(v.src) + '"></video>' +
           (titulo ? '<figcaption>' + escapar(titulo) + '</figcaption>' : '') + '</figure>';
  }

  return '<figure class="video">' +
    '<button type="button" class="video__portada" data-accion="reproducir" data-src="' +
      escapar(v.src) + '" data-titulo="' + escapar(rotulo) + '">' +
      '<span class="video__play">' + ico('play') + '</span>' +
      '<span class="video__txt">' +
        '<span class="video__tit">' + escapar(rotulo) + '</span>' +
        '<span class="video__nota">Reproducir en ' + escapar(v.proveedor) +
          ' · no se conecta con el proveedor hasta que pulsas</span>' +
      '</span>' +
    '</button>' +
    (titulo ? '<figcaption>' + escapar(titulo) + '</figcaption>' : '') +
    '</figure>';
}

/* -- Utilidades internas -------------------------------------- */
const sangria = (l) => (l.match(/^ */) || [''])[0].length;

function celdas(línea) {
  return línea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/* Convierte un bloque de líneas de lista en HTML, con anidación. */
function renderLista(líneas, ordenada) {
  const base = sangria(líneas[0]);
  const items = [];
  let esChecklist = false;

  for (const línea of líneas) {
    if (sangria(línea) > base && items.length) {
      items[items.length - 1].hijas.push(línea);
      continue;
    }
    items.push({ cuerpo: línea.trim().replace(/^(?:[-*+]|\d+[.)])\s+/, ''), hijas: [] });
  }

  const cuerpos = items.map((it) => {
    let texto = it.cuerpo;
    let marcada = null;

    const chk = texto.match(/^\[([ xX])\]\s*(.*)$/);
    if (chk) {
      esChecklist = true;
      marcada = chk[1].toLowerCase() === 'x';
      texto = chk[2];
    }

    let interno = enLinea(texto);
    if (it.hijas.length) {
      const desangrado = it.hijas.map((l) => l.slice(Math.min(sangria(l), base + 2))).join('\n');
      interno += bloques(desangrado);
    }

    if (marcada !== null) {
      return '<li data-hecho="' + (marcada ? 1 : 0) + '"><span class="chk__caja">' + TICK +
             '</span><span>' + interno + '</span></li>';
    }
    return '<li>' + interno + '</li>';
  });

  const etiqueta = ordenada ? 'ol' : 'ul';
  const clase = esChecklist ? ' class="chk"' : '';
  return '<' + etiqueta + clase + '>' + cuerpos.join('') + '</' + etiqueta + '>';
}

/* -- Analizador por bloques ----------------------------------- */
export function bloques(md) {
  const líneas = String(md).replace(/\r\n?/g, '\n').split('\n');
  const salida = [];
  let i = 0;

  while (i < líneas.length) {
    const línea = líneas[i];

    if (!línea.trim()) { i++; continue; }

    // Bloque cercado. Admite dos delimitadores: ``` y :::
    // El segundo existe porque los contenidos viven dentro de plantillas
    // de JavaScript, donde un acento grave cerraría la cadena de texto.
    const cerca = línea.match(/^\s*(```|:::)[ \t]*([A-Za-z0-9_-]*)[ \t]*$/);
    if (cerca) {
      const delimitador = cerca[1];
      const idioma = cerca[2];
      const fin = delimitador === ':::' ? /^\s*:::/ : /^\s*```/;
      const buf = [];
      i++;
      while (i < líneas.length && !fin.test(líneas[i])) buf.push(líneas[i++]);
      i++;
      if (idioma.toLowerCase() === 'video') {
        salida.push(renderVideo(buf.filter((l) => l.trim())));
        continue;
      }
      const attr = idioma ? ' class="lang-' + escapar(idioma) + '"' : '';
      salida.push('<pre><code' + attr + '>' + escapar(buf.join('\n')) + '</code></pre>');
      continue;
    }

    // Separador
    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(línea)) { salida.push('<hr>'); i++; continue; }

    // Encabezado
    const enc = línea.match(/^(#{2,4})\s+(.*)$/);
    if (enc) {
      const n = enc[1].length;
      salida.push('<h' + n + '>' + enLinea(enc[2].trim()) + '</h' + n + '>');
      i++;
      continue;
    }

    // Cita o llamada
    if (/^\s*>/.test(línea)) {
      const buf = [];
      while (i < líneas.length && /^\s*>/.test(líneas[i])) {
        buf.push(líneas[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const tipo = buf[0] && buf[0].match(/^\[!([A-ZÁÉÍÓÚÑ]+)\]\s*(.*)$/);
      if (tipo && LLAMADAS[tipo[1]]) {
        const cfg = LLAMADAS[tipo[1]];
        const resto = [tipo[2], ...buf.slice(1)].join('\n').trim();
        salida.push(
          '<div class="llamada llamada--' + cfg.clase + '">' +
          ico(cfg.icono, 'llamada__ico') +
          '<div class="llamada__txt"><span class="llamada__tit">' + cfg.titulo + '</span>' +
          bloques(resto) + '</div></div>'
        );
      } else {
        salida.push('<blockquote>' + bloques(buf.join('\n')) + '</blockquote>');
      }
      continue;
    }

    // Tabla
    if (/^\s*\|/.test(línea) && /^\s*\|[\s:|-]+\|\s*$/.test(líneas[i + 1] || '')) {
      const cabeceras = celdas(línea);
      i += 2;
      const filas = [];
      while (i < líneas.length && /^\s*\|/.test(líneas[i])) filas.push(celdas(líneas[i++]));
      const th = cabeceras.map((c) => '<th>' + enLinea(c) + '</th>').join('');
      const tb = filas.map((f) => '<tr>' + f.map((c) => '<td>' + enLinea(c) + '</td>').join('') + '</tr>').join('');
      salida.push('<div class="tabla-env"><table><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody></table></div>');
      continue;
    }

    // Bloque con sangría (cuatro espacios o más), al estilo Markdown clásico.
    // Se comprueba antes que las listas, exigiendo que no sea una viñeta.
    if (/^ {4,}\S/.test(línea) && !/^\s*(?:[-*+]|\d+[.)])\s/.test(línea)) {
      const buf = [];
      while (i < líneas.length) {
        const l = líneas[i];
        if (/^ {4,}/.test(l)) { buf.push(l.slice(4)); i++; continue; }
        // Una línea en blanco solo continúa el bloque si después sigue sangrado.
        if (!l.trim() && /^ {4,}\S/.test(líneas[i + 1] || '')) { buf.push(''); i++; continue; }
        break;
      }
      salida.push('<pre><code>' + escapar(buf.join('\n')) + '</code></pre>');
      continue;
    }

    // Listas
    const esVinieta = /^\s*[-*+]\s+/.test(línea);
    const esOrdenada = /^\s*\d+[.)]\s+/.test(línea);
    if (esVinieta || esOrdenada) {
      const marca = esOrdenada ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
      const buf = [];
      while (i < líneas.length) {
        const l = líneas[i];
        const continuaAnidada = buf.length && l.trim() && sangria(l) >= 2;
        if (marca.test(l) || continuaAnidada) { buf.push(l); i++; continue; }
        break;
      }
      salida.push(renderLista(buf, esOrdenada));
      continue;
    }

    // Párrafo
    const buf = [];
    while (i < líneas.length && líneas[i].trim() &&
           !/^\s*(?:#{2,4}\s|>|\||```|:::|---|\*\*\*|___)/.test(líneas[i]) &&
           !/^\s*(?:[-*+]|\d+[.)])\s+/.test(líneas[i]) &&
           !/^ {4,}\S/.test(líneas[i])) {
      buf.push(líneas[i].trim());
      i++;
    }
    if (buf.length) salida.push('<p>' + enLinea(buf.join(' ')) + '</p>');
  }

  return salida.join('\n');
}

/* Convierte Markdown a HTML listo para insertar. */
export const render = (md) => bloques(md || '');

/* Extrae texto plano de un Markdown, para indexar en el buscador. */
export function aTextoPlano(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^[ \t]*:::[\s\S]*?^[ \t]*:::[ \t]*$/gm, ' ')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')
    .replace(/^\s*>\s*\[![A-ZÁÉÍÓÚÑ]+\]\s*/gm, '')
    .replace(/^\s*[>#|]+\s*/gm, ' ')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, ' ')
    .replace(/\[[ xX]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*`~_|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
