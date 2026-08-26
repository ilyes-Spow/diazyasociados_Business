/* ===============================================================
   buscador.js - Índice y búsqueda de texto completo
   ---------------------------------------------------------------
   Índice en memoria construido al arrancar. Sin dependencias.
   =============================================================== */

import { MODULOS } from '../../content/curriculo.js';
import novedades from '../../content/novedades.js';
import { aTextoPlano, escapar } from './markdown.js';

/* Quita tildes y pasa a minúsculas para comparar sin acentos. */
export const normalizar = (t) => String(t)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

let INDICE = null;

export function construirIndice() {
  if (INDICE) return INDICE;
  const entradas = [];

  for (const mod of MODULOS) {
    entradas.push({
      tipo: 'modulo',
      ruta: '#/modulo/' + mod.id,
      titulo: mod.titulo,
      contexto: 'Módulo ' + mod.num,
      texto: mod.resumen,
      peso: 3
    });

    for (const lec of mod.lecciones) {
      entradas.push({
        tipo: 'leccion',
        ruta: '#/modulo/' + mod.id + '/' + lec.id,
        titulo: lec.titulo,
        contexto: 'Módulo ' + mod.num + ' · ' + mod.titulo,
        texto: aTextoPlano(lec.md),
        peso: 2
      });
    }
  }

  for (const nov of novedades) {
    entradas.push({
      tipo: 'novedad',
      ruta: '#/novedades',
      titulo: nov.titulo,
      contexto: 'Novedades · ' + nov.fecha,
      texto: aTextoPlano(nov.md),
      peso: 1
    });
  }

  INDICE = entradas.map((e) => ({
    ...e,
    nTitulo: normalizar(e.titulo),
    nContexto: normalizar(e.contexto),
    nTexto: normalizar(e.texto)
  }));

  return INDICE;
}

/* Devuelve un fragmento de texto alrededor de la primera coincidencia. */
function fragmento(texto, nTexto, termino, largo = 150) {
  const pos = nTexto.indexOf(termino);
  if (pos === -1) return texto.slice(0, largo) + (texto.length > largo ? '…' : '');
  const desde = Math.max(0, pos - Math.floor(largo / 3));
  const hasta = Math.min(texto.length, desde + largo);
  return (desde > 0 ? '…' : '') + texto.slice(desde, hasta).trim() + (hasta < texto.length ? '…' : '');
}

/* Resalta los términos dentro de un texto ya escapado. */
export function resaltar(texto, terminos) {
  let html = escapar(texto);
  const nHtml = normalizar(html);
  const marcas = [];

  for (const t of terminos) {
    if (t.length < 2) continue;
    let desde = 0;
    let pos;
    while ((pos = nHtml.indexOf(t, desde)) !== -1) {
      marcas.push([pos, pos + t.length]);
      desde = pos + t.length;
    }
  }
  if (!marcas.length) return html;

  marcas.sort((a, b) => a[0] - b[0]);
  const fusionadas = [marcas[0]];
  for (const [ini, fin] of marcas.slice(1)) {
    const ult = fusionadas[fusionadas.length - 1];
    if (ini <= ult[1]) ult[1] = Math.max(ult[1], fin);
    else fusionadas.push([ini, fin]);
  }

  let salida = '';
  let cursor = 0;
  for (const [ini, fin] of fusionadas) {
    salida += html.slice(cursor, ini) + '<mark>' + html.slice(ini, fin) + '</mark>';
    cursor = fin;
  }
  return salida + html.slice(cursor);
}

export function buscar(consulta, limite = 20) {
  const indice = construirIndice();
  const terminos = normalizar(consulta).split(/\s+/).filter((t) => t.length >= 2);
  if (!terminos.length) return [];

  const resultados = [];

  for (const e of indice) {
    let puntos = 0;
    let todos = true;

    for (const t of terminos) {
      const enTitulo = e.nTitulo.includes(t);
      const enContexto = e.nContexto.includes(t);
      const enTexto = e.nTexto.includes(t);

      if (!enTitulo && !enContexto && !enTexto) { todos = false; break; }

      if (enTitulo) puntos += e.nTitulo.startsWith(t) ? 60 : 40;
      if (enContexto) puntos += 8;
      if (enTexto) {
        // Cuenta hasta 5 apariciones para no premiar en exceso los textos largos.
        let n = 0, desde = 0, pos;
        while (n < 5 && (pos = e.nTexto.indexOf(t, desde)) !== -1) { n++; desde = pos + t.length; }
        puntos += n * 4;
      }
    }

    if (!todos) continue;
    puntos += e.peso * 5;
    resultados.push({ ...e, puntos, frag: fragmento(e.texto, e.nTexto, terminos[0]) });
  }

  return resultados.sort((a, b) => b.puntos - a.puntos).slice(0, limite);
}
