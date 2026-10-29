/* ===============================================================
   contenido.mjs - Lectura y escritura de los archivos de content/
   ---------------------------------------------------------------
   El panel de administración usa este módulo para leer los
   contenidos actuales y volver a escribirlos manteniendo el mismo
   formato que si se hubieran editado a mano.
   =============================================================== */

import { readFile, writeFile, rename, unlink, readdir, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_MODULOS = join(RAIZ, 'content', 'modulos');
const DIR_COPIAS = join(RAIZ, '.copias-admin');

/* ── Serialización ───────────────────────────────────────────── */

/* Cadena entre comillas simples, con los escapes necesarios. */
export function comillas(valor) {
  return "'" + String(valor)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n') + "'";
}

/* Texto largo dentro de una plantilla. Hay que neutralizar el
   acento grave y la secuencia de interpolación. */
export function plantilla(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/* Identificador seguro para archivos y rutas, a partir de un título. */
export function aIdentificador(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sin-titulo';
}

const dosDigitos = (n) => String(n).padStart(2, '0');
export const nombreArchivo = (mod) => dosDigitos(mod.num) + '-' + mod.id + '.js';

/* ── Escritura de un módulo ──────────────────────────────────── */
export function serializarModulo(mod) {
  const etiquetas = (mod.etiquetas || []).map(comillas).join(', ');

  const lecciones = (mod.lecciones || []).map((lec) => {
    const cuerpo = String(lec.md || '').replace(/^\n+|\n+$/g, '');
    const lineas = [
      '    {',
      '      id: ' + comillas(lec.id) + ',',
      '      titulo: ' + comillas(lec.titulo) + ','
    ];
    // El vídeo va antes que los apuntes: es lo primero que se ve.
    if (lec.video && String(lec.video.url || '').trim()) {
      lineas.push(
        '      video: {',
        '        url: ' + comillas(String(lec.video.url).trim()) + ',',
        '        titulo: ' + comillas(lec.video.titulo || '') + ',',
        '        minutos: ' + (Number(lec.video.minutos) || 0),
        '      },'
      );
    }
    lineas.push(
      '      md: `',
      plantilla(cuerpo),
      '`',
      '    }'
    );
    return lineas.join('\n');
  }).join(',\n');

  const cabecera = [
    'export default {',
    '  id: ' + comillas(mod.id) + ',',
    '  num: ' + Number(mod.num) + ',',
    '  grupo: ' + comillas(mod.grupo) + ',',
    '  titulo: ' + comillas(mod.titulo) + ',',
    '  resumen: ' + comillas(mod.resumen) + ',',
    '  duracion: ' + Number(mod.duracion) + ',',
    '  etiquetas: [' + etiquetas + '],'
  ];
  // Vídeo de presentación del módulo (opcional).
  if (mod.video && String(mod.video.url || '').trim()) {
    cabecera.push(
      '  video: {',
      '    url: ' + comillas(String(mod.video.url).trim()) + ',',
      '    titulo: ' + comillas(mod.video.titulo || '') + ',',
      '    minutos: ' + (Number(mod.video.minutos) || 0),
      '  },'
    );
  }
  // Examen del módulo (opcional): preguntas tipo test.
  if (mod.examen && Array.isArray(mod.examen.preguntas) && mod.examen.preguntas.length) {
    const preguntas = mod.examen.preguntas.map((p) => [
      '      {',
      '        id: ' + comillas(p.id) + ',',
      '        texto: ' + comillas(p.texto) + ',',
      '        opciones: [' + (p.opciones || []).map(comillas).join(', ') + '],',
      '        correcta: ' + (Number(p.correcta) || 0) + ',',
      '        explicacion: ' + comillas(p.explicacion || ''),
      '      }'
    ].join('\n')).join(',\n');
    cabecera.push(
      '  examen: {',
      '    aprobado: ' + (Number(mod.examen.aprobado) || 70) + ',',
      '    preguntas: [',
      preguntas,
      '    ]',
      '  },'
    );
  }

  return cabecera.concat([
    '  lecciones: [',
    lecciones,
    '  ]',
    '};',
    ''
  ]).join('\n');
}

/* ── Escritura de novedades ──────────────────────────────────── */
export function serializarNovedades(lista) {
  const entradas = lista.map((nov) => {
    const cuerpo = String(nov.md || '').replace(/^\n+|\n+$/g, '');
    const etiquetas = (nov.etiquetas || []).map(comillas).join(', ');
    return [
      '  {',
      '    fecha: ' + comillas(nov.fecha) + ',',
      '    nivel: ' + comillas(nov.nivel) + ',',
      '    etiquetas: [' + etiquetas + '],',
      '    titulo: ' + comillas(nov.titulo) + ',',
      '    md: `',
      plantilla(cuerpo),
      '`',
      '  }'
    ].join('\n');
  }).join(',\n');

  return [
    '/* ===============================================================',
    '   novedades.js - Registro de novedades del despacho',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin), pero puede editarse a mano sin problema.',
    '   Las entradas van de más reciente a más antigua.',
    '   Niveles: \'critica\' | \'importante\' | \'informativa\'',
    '   =============================================================== */',
    '',
    'export default [',
    entradas,
    '];',
    ''
  ].join('\n');
}

/* ── Escritura del currículo ─────────────────────────────────── */
export function serializarCurriculo({ version, grupos, modulos }) {
  const importaciones = modulos.map((mod, i) =>
    'import m' + dosDigitos(i + 1) + " from './modulos/" + nombreArchivo(mod).replace(/\.js$/, '.js') + "';"
  ).join('\n');

  const listaGrupos = grupos.map((g) => [
    '  {',
    '    id: ' + comillas(g.id) + ',',
    '    titulo: ' + comillas(g.titulo) + ',',
    '    descripcion: ' + comillas(g.descripcion),
    '  }'
  ].join('\n')).join(',\n');

  const nombres = modulos.map((_, i) => 'm' + dosDigitos(i + 1));
  const filas = [];
  for (let i = 0; i < nombres.length; i += 9) {
    filas.push('  ' + nombres.slice(i, i + 9).join(', '));
  }

  return [
    '/* ===============================================================',
    '   curriculo.js - Registro central de contenidos',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin), pero puede editarse a mano sin problema.',
    '',
    '   Para añadir un módulo a mano:',
    '     1. Crear el archivo en content/modulos/',
    '     2. Importarlo aquí',
    '     3. Añadirlo al array MODULOS en la posición que corresponda',
    '',
    '   Los módulos de un mismo grupo deben ir seguidos y su número',
    '   debe ser correlativo desde 1. Comprobar con: npm run validar',
    '   =============================================================== */',
    '',
    importaciones,
    '',
    'export const VERSION = ' + comillas(version) + ';',
    '',
    'export const GRUPOS = [',
    listaGrupos,
    '];',
    '',
    'export const MODULOS = [',
    filas.join(',\n'),
    '];',
    '',
    '/* Índice plano de lecciones, en orden de itinerario. */',
    'export const LECCIONES = MODULOS.flatMap((mod) =>',
    '  mod.lecciones.map((lec) => ({',
    '    ...lec,',
    '    moduloId: mod.id,',
    '    moduloTitulo: mod.titulo,',
    '    moduloNum: mod.num,',
    "    clave: mod.id + '/' + lec.id",
    '  }))',
    ');',
    '',
    'export const moduloPorId = (id) => MODULOS.find((m) => m.id === id) || null;',
    'export const grupoPorId = (id) => GRUPOS.find((g) => g.id === id) || null;',
    'export const modulosDeGrupo = (id) => MODULOS.filter((m) => m.grupo === id);',
    '',
    'export const TOTAL_LECCIONES = LECCIONES.length;',
    'export const TOTAL_MINUTOS = MODULOS.reduce((s, m) => s + (m.duracion || 0), 0);',
    ''
  ].join('\n');
}

/* ── Escritura de la vida interna (equipo.js) ────────────────── */
export function serializarEquipo({ empleadosDelMes, tablon, ranking }) {
  const edm = (empleadosDelMes || []).map((p) => [
    '    {',
    '      mes: ' + comillas(p.mes) + ',',
    '      nombre: ' + comillas(p.nombre) + ',',
    '      iniciales: ' + comillas(p.iniciales) + ',',
    '      foto: ' + comillas(p.foto || '') + ',',
    '      motivo: ' + comillas(p.motivo) + '',
    '    }'
  ].join('\n')).join(',\n');

  const anuncios = (tablon || []).map((an) => {
    const cuerpo = String(an.md || '').replace(/^\n+|\n+$/g, '');
    return [
      '    {',
      '      fecha: ' + comillas(an.fecha) + ',',
      '      tipo: ' + comillas(an.tipo) + ',',
      '      titulo: ' + comillas(an.titulo) + ',',
      '      md: `',
      plantilla(cuerpo),
      '`',
      '    }'
    ].join('\n');
  }).join(',\n');

  const r = ranking || { actualizado: '', personas: [] };
  const personas = (r.personas || []).map((p) => [
    '      {',
    '        nombre: ' + comillas(p.nombre) + ',',
    '        iniciales: ' + comillas(p.iniciales) + ',',
    '        foto: ' + comillas(p.foto || '') + ',',
    '        puntos: ' + (Number(p.puntos) || 0),
    '      }'
  ].join('\n')).join(',\n');

  return [
    '/* ===============================================================',
    '   equipo.js - Vida interna del despacho',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin), pero puede editarse a mano sin problema.',
    "   - empleadosDelMes: el más reciente PRIMERO (mes en AAAA-MM).",
    "   - tablon: anuncios internos, el más reciente PRIMERO.",
    "     tipo: 'evento' | 'aviso' | 'celebracion'",
    '   - ranking: clasificación que publica RRHH periódicamente.',
    '   =============================================================== */',
    '',
    'const EQUIPO = {',
    '',
    '  empleadosDelMes: [',
    edm,
    '  ],',
    '',
    '  tablon: [',
    anuncios,
    '  ],',
    '',
    '  ranking: {',
    '    actualizado: ' + comillas(r.actualizado || '') + ',',
    '    personas: [',
    personas,
    '    ]',
    '  }',
    '',
    '};',
    '',
    'export default EQUIPO;',
    ''
  ].join('\n');
}

/* ── Objetivos: plantillas, personas, metas y resultados ──────── */
const TIPOS_OBJETIVO = ['proporcional', 'relativo', 'valoracion'];
const numeroONulo = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* Deja el objeto OBJETIVOS con la forma esperada, venga de donde venga. */
export function normalizarObjetivos(bruto) {
  const b = bruto && typeof bruto === 'object' ? bruto : {};
  const plantillas = {};
  for (const [id, p] of Object.entries(b.plantillas || {})) {
    if (!p || typeof p !== 'object') continue;
    plantillas[id] = {
      titulo: String(p.titulo || id),
      objetivos: (Array.isArray(p.objetivos) ? p.objetivos : []).map((o) => {
        const tipo = TIPOS_OBJETIVO.includes(o.tipo) ? o.tipo : 'valoracion';
        const obj = { id: String(o.id || ''), texto: String(o.texto || ''), max: numeroONulo(o.max) ?? 0, tipo };
        if (tipo === 'proporcional') { obj.meta = numeroONulo(o.meta) ?? 0; obj.unidad = String(o.unidad || ''); }
        if (tipo === 'relativo') { obj.base = String(o.base || ''); obj.proporcion = numeroONulo(o.proporcion) ?? 0; obj.unidad = String(o.unidad || ''); }
        if (o.extra) obj.extra = true;
        return obj;
      })
    };
  }
  const personas = (Array.isArray(b.personas) ? b.personas : []).map((p) => ({
    id: String(p.id || ''),
    nombre: String(p.nombre || ''),
    correo: String(p.correo || '').trim().toLowerCase(),
    foto: String(p.foto || '').trim(),
    plantilla: String(p.plantilla || ''),
    ...(p.baja ? { baja: true } : {}),
    metas: Object.fromEntries(Object.entries(p.metas || {}).map(([k, v]) => [k, numeroONulo(v)]).filter(([, v]) => v !== null))
  }));
  const meses = {};
  for (const [mes, porPersona] of Object.entries(b.meses || {})) {
    if (!porPersona || typeof porPersona !== 'object') continue;
    meses[mes] = {};
    for (const [personaId, r] of Object.entries(porPersona)) {
      if (!r || typeof r !== 'object') continue;
      const limpiar = (mapa) => Object.fromEntries(Object.entries(mapa || {}).map(([k, v]) => [k, numeroONulo(v)]).filter(([, v]) => v !== null));
      meses[mes][personaId] = { resultados: limpiar(r.resultados), puntos: limpiar(r.puntos) };
      if (numeroONulo(r.total) !== null) meses[mes][personaId].total = numeroONulo(r.total);
      if (r.nota) meses[mes][personaId].nota = String(r.nota);
    }
  }
  return { plantillas, personas, meses };
}

/* Clave de objeto: sin comillas si es un identificador válido. */
const claveJs = (k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : comillas(k);
const mapaNumeros = (mapa) => '{ ' + Object.entries(mapa || {}).map(([k, v]) => claveJs(k) + ': ' + Number(v)).join(', ') + ' }';

export function serializarObjetivos(bruto) {
  const datos = normalizarObjetivos(bruto);

  const plantillas = Object.entries(datos.plantillas).map(([id, p]) => {
    const objetivos = p.objetivos.map((o) => {
      const partes = ['id: ' + comillas(o.id), 'texto: ' + comillas(o.texto), 'max: ' + o.max, 'tipo: ' + comillas(o.tipo)];
      if (o.tipo === 'proporcional') partes.push('meta: ' + o.meta, 'unidad: ' + comillas(o.unidad || ''));
      if (o.tipo === 'relativo') partes.push('base: ' + comillas(o.base), 'proporcion: ' + o.proporcion, 'unidad: ' + comillas(o.unidad || ''));
      if (o.extra) partes.push('extra: true');
      return '        { ' + partes.join(', ') + ' }';
    }).join(',\n');
    return '    ' + claveJs(id) + ': {\n      titulo: ' + comillas(p.titulo) + ',\n      objetivos: [\n' + objetivos + '\n      ]\n    }';
  }).join(',\n');

  const personas = datos.personas.map((p) =>
    '    { id: ' + comillas(p.id) + ', nombre: ' + comillas(p.nombre) + ', correo: ' + comillas(p.correo) +
    (p.foto ? ', foto: ' + comillas(p.foto) : '') +
    ', plantilla: ' + comillas(p.plantilla) + (p.baja ? ', baja: true' : '') + ', metas: ' + mapaNumeros(p.metas) + ' }'
  ).join(',\n');

  const meses = Object.keys(datos.meses).sort().map((mes) => {
    const registros = Object.keys(datos.meses[mes]).sort().map((personaId) => {
      const r = datos.meses[mes][personaId];
      return '      ' + claveJs(personaId) + ': {\n' +
        '        resultados: ' + mapaNumeros(r.resultados) + ',\n' +
        '        puntos: ' + mapaNumeros(r.puntos) +
        (r.total !== undefined ? ',\n        total: ' + Number(r.total) : '') +
        (r.nota ? ',\n        nota: ' + comillas(r.nota) : '') + '\n      }';
    }).join(',\n');
    return '    ' + comillas(mes) + ': {\n' + registros + '\n    }';
  }).join(',\n');

  return [
    '/* ===============================================================',
    '   objetivos.js - Objetivos, metas y resultados por persona',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin); el histórico se puede volcar desde los Excel',
    '   con herramientas/importar-objetivos.mjs.',
    '',
    '   - plantillas: la lista de objetivos de cada tipo de puesto, con',
    '     su puntuación máxima y cómo se puntúa (proporcional a una meta,',
    '     proporción sobre otro objetivo o valoración de dirección).',
    '   - personas: quién tiene objetivos, con qué plantilla y sus metas',
    '     propias (lo que no se indica usa la meta de la plantilla).',
    '   - meses: por mes y persona, los resultados reales y los puntos',
    '     fijados a mano. Lo que no está fijado se calcula solo. Si',
    '     dirección publicó una puntuación final distinta de la suma,',
    '     va en `total` y es la que manda en el ranking.',
    '',
    '   AVISO: viaja al navegador de todo el equipo. Solo cifras y',
    '   puntuaciones, nunca comentarios ni datos de clientes.',
    '   =============================================================== */',
    '',
    'const OBJETIVOS = {',
    '',
    '  plantillas: {',
    plantillas,
    '  },',
    '',
    '  personas: [',
    personas,
    '  ],',
    '',
    '  meses: {',
    meses,
    '  }',
    '',
    '};',
    '',
    'export default OBJETIVOS;',
    ''
  ].join('\n');
}

/* ── Escritura del equipo y los accesos (personas.js) ────────── */
export function serializarPersonas(lista) {
  const personas = (lista || []).map((p) => [
    '  {',
    '    correo: ' + comillas(String(p.correo || '').trim().toLowerCase()) + ',',
    '    nombre: ' + comillas(p.nombre || '') + ',',
    '    puesto: ' + comillas(p.puesto || '') + ',',
    '    foto: ' + comillas(p.foto || '') + ',',
    '    rol: ' + comillas(p.rol === 'administracion' ? 'administracion' : 'equipo') + ',',
    '    activo: ' + (p.activo === false ? 'false' : 'true'),
    '  }'
  ].join('\n')).join(',\n');

  return [
    '/* ===============================================================',
    '   personas.js - Equipo del despacho y accesos a la plataforma',
    '   ---------------------------------------------------------------',
    '   Este archivo lo mantiene el panel de administración',
    '   (npm run admin, pestaña «Personas y accesos»), pero puede',
    '   editarse a mano sin problema.',
    '',
    '   - correo: la cuenta de Google con la que entra la persona.',
    "   - rol: 'administracion' (ve el panel y modera Conecta)",
    "          o 'equipo' (portal completo).",
    '   - activo: con false la persona deja de poder entrar cuando el',
    '     acceso con Google esté activo, sin borrar sus datos.',
    '   - puesto y foto son opcionales; la foto sale de assets/img/equipo/.',
    '',
    '   Mientras la lista esté vacía se admite cualquier cuenta.',
    '   =============================================================== */',
    '',
    'const PERSONAS = [',
    personas,
    '];',
    '',
    'export default PERSONAS;',
    ''
  ].join('\n');
}

/* ── Lectura ─────────────────────────────────────────────────── */

/* Los archivos guardan el texto entre saltos de línea; se retiran
   para que el panel muestre el contenido tal cual. */
const recortar = (t) => String(t || '').replace(/^\n+|\n+$/g, '');
/* Se importa el módulo real, para ver exactamente lo mismo que ve
   la aplicación. El parámetro evita la caché de módulos de Node. */
async function importarFresco(rutaRelativa) {
  const url = pathToFileURL(join(RAIZ, rutaRelativa)).href + '?v=' + Date.now();
  return import(url);
}

export async function leerTodo() {
  const curriculo = await importarFresco('content/curriculo.js');
  // Los módulos se leen archivo a archivo y en fresco: el import de
  // curriculo.js arrastra sus imports anidados desde la caché de Node,
  // y tras un guardado devolvería las lecciones antiguas (y un segundo
  // guardado las pisaría). El orden lo da el número de cada módulo.
  const archivosModulo = (await readdir(DIR_MODULOS))
    .filter((a) => /^\d{2}-.+\.js$/.test(a))
    .sort();
  const modulosFrescos = [];
  for (const archivo of archivosModulo) {
    const mod = (await importarFresco('content/modulos/' + archivo)).default;
    if (mod && mod.id) modulosFrescos.push(mod);
  }
  modulosFrescos.sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0));
  const novedades = await importarFresco('content/novedades.js');
  const equipo = (await importarFresco('content/equipo.js')).default || {};
  const objetivos = (await importarFresco('content/objetivos.js')).default || {};
  let personas = [];
  try {
    personas = (await importarFresco('content/personas.js')).default || [];
  } catch (e) {
    personas = [];
  }

  const ranking = equipo.ranking || {};
  return {
    version: curriculo.VERSION,
    grupos: curriculo.GRUPOS.map((g) => ({ ...g })),
    modulos: modulosFrescos.map((m) => ({
      ...m,
      etiquetas: [...(m.etiquetas || [])],
      video: m.video && m.video.url
        ? { url: String(m.video.url), titulo: m.video.titulo || '', minutos: Number(m.video.minutos) || 0 }
        : null,
      examen: m.examen && Array.isArray(m.examen.preguntas)
        ? {
            aprobado: Number(m.examen.aprobado) || 70,
            preguntas: m.examen.preguntas.map((p) => ({
              id: p.id || '', texto: p.texto || '', opciones: [...(p.opciones || [])],
              correcta: Number(p.correcta) || 0, explicacion: p.explicacion || ''
            }))
          }
        : null,
      lecciones: m.lecciones.map((l) => ({
        id: l.id,
        titulo: l.titulo,
        video: l.video && l.video.url
          ? { url: String(l.video.url), titulo: l.video.titulo || '', minutos: Number(l.video.minutos) || 0 }
          : null,
        md: recortar(l.md)
      }))
    })),
    personas: (Array.isArray(personas) ? personas : []).map((p) => ({
      correo: String(p.correo || '').toLowerCase(),
      nombre: p.nombre || '',
      puesto: p.puesto || '',
      foto: p.foto || '',
      rol: p.rol === 'administracion' ? 'administracion' : 'equipo',
      activo: p.activo !== false
    })),
    novedades: novedades.default.map((n) => ({ ...n, etiquetas: [...(n.etiquetas || [])], md: recortar(n.md) })),
    equipo: {
      empleadosDelMes: (equipo.empleadosDelMes || []).map((p) => ({
        mes: p.mes || '', nombre: p.nombre || '', iniciales: p.iniciales || '',
        foto: p.foto || '', motivo: p.motivo || ''
      })),
      tablon: (equipo.tablon || []).map((an) => ({
        fecha: an.fecha || '', tipo: an.tipo || 'aviso',
        titulo: an.titulo || '', md: recortar(an.md)
      })),
      ranking: {
        actualizado: ranking.actualizado || '',
        personas: (ranking.personas || []).map((p) => ({
          nombre: p.nombre || '', iniciales: p.iniciales || '',
          foto: p.foto || '', puntos: Number(p.puntos) || 0
        }))
      }
    },
    objetivos: normalizarObjetivos(objetivos)
  };
}

/* ── Guardado ────────────────────────────────────────────────── */

/* Cuántas copias de seguridad se conservan antes de ir borrando las
   más antiguas. Cada guardado genera una por archivo modificado. */
const MAX_COPIAS = 300;

/* Copia de seguridad de un archivo antes de sobrescribirlo. */
async function respaldar(rutaAbsoluta) {
  if (!existsSync(rutaAbsoluta)) return;
  await mkdir(DIR_COPIAS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, '-');
  const nombre = rutaAbsoluta.slice(RAIZ.length + 1).replace(/[/\\]/g, '_');
  await copyFile(rutaAbsoluta, join(DIR_COPIAS, marca + '__' + nombre));
}

/* Retira las copias más antiguas. El nombre empieza por la marca de
   tiempo, así que el orden alfabético es el cronológico. */
async function podarCopias() {
  if (!existsSync(DIR_COPIAS)) return;
  const archivos = (await readdir(DIR_COPIAS)).sort();
  const sobran = archivos.length - MAX_COPIAS;
  for (let i = 0; i < sobran; i++) {
    await unlink(join(DIR_COPIAS, archivos[i]));
  }
}

export async function escribirAtomico(rutaAbsoluta, contenido) {
  await respaldar(rutaAbsoluta);
  const temporal = rutaAbsoluta + '.tmp';
  await writeFile(temporal, contenido, 'utf8');
  await rename(temporal, rutaAbsoluta);
}

/* Reordena, renumera y renombra. Los grupos se recorren en el
   orden de GRUPOS, de modo que siempre quedan seguidos. */
export function ordenar(grupos, modulos) {
  const ordenados = [];
  for (const g of grupos) {
    for (const m of modulos) if (m.grupo === g.id) ordenados.push(m);
  }
  // Cualquier módulo con grupo desconocido se coloca al final.
  for (const m of modulos) if (!ordenados.includes(m)) ordenados.push(m);
  ordenados.forEach((m, i) => { m.num = i + 1; });
  return ordenados;
}

export async function guardarTodo({ version, grupos, modulos, novedades, equipo, objetivos, personas }) {
  const ordenados = ordenar(grupos, modulos);
  const deseados = new Set(ordenados.map(nombreArchivo));

  // Se escriben primero con un nombre temporal, para que un cambio de
  // numeración no pise un archivo que todavía hace falta.
  const provisionales = [];
  for (const mod of ordenados) {
    const destino = join(DIR_MODULOS, nombreArchivo(mod));
    const provisional = destino + '.nuevo';
    await respaldar(destino);
    await writeFile(provisional, serializarModulo(mod), 'utf8');
    provisionales.push([provisional, destino]);
  }

  // Se retiran los archivos que ya no corresponden a ningún módulo.
  for (const archivo of await readdir(DIR_MODULOS)) {
    if (!archivo.endsWith('.js') || deseados.has(archivo)) continue;
    await respaldar(join(DIR_MODULOS, archivo));
    await unlink(join(DIR_MODULOS, archivo));
  }

  for (const [provisional, destino] of provisionales) await rename(provisional, destino);

  await escribirAtomico(join(RAIZ, 'content', 'curriculo.js'),
    serializarCurriculo({ version, grupos, modulos: ordenados }));
  await escribirAtomico(join(RAIZ, 'content', 'novedades.js'),
    serializarNovedades(novedades));
  if (equipo) {
    await escribirAtomico(join(RAIZ, 'content', 'equipo.js'), serializarEquipo(equipo));
  }
  if (objetivos) {
    await escribirAtomico(join(RAIZ, 'content', 'objetivos.js'), serializarObjetivos(objetivos));
  }
  if (Array.isArray(personas)) {
    await escribirAtomico(join(RAIZ, 'content', 'personas.js'), serializarPersonas(personas));
  }

  await podarCopias();

  return ordenados;
}
