/* ===============================================================
   objetivos-calculo.js - Cálculo de objetivos y ranking
   ---------------------------------------------------------------
   Lo usan el portal y el panel. Todas las funciones reciben el
   objeto OBJETIVOS (content/objetivos.js, o la copia que edita el
   panel) para que la puntuación salga igual en los dos sitios.

   Estructura de OBJETIVOS:
   - plantillas: { id: { titulo, objetivos: [ { id, texto, max, tipo,
       meta | base + proporcion, unidad, extra } ] } }
   - personas: [ { id, nombre, correo, plantilla, metas: { objetivoId: n } } ]
   - meses: { 'AAAA-MM': { personaId: { resultados: {}, puntos: {}, nota } } }

   Tipos de objetivo:
   - proporcional: puntos = resultado / meta * max (con tope en max).
   - relativo: puntos = (resultado / resultado del objetivo base) /
     proporción * max. Ej.: expedientes cerrados sobre clientes captados.
   - valoracion: los puntos los pone dirección a mano.
   Un valor en `puntos` del mes manda siempre sobre el cálculo (así el
   histórico importado conserva la puntuación que se dio en su día).
   =============================================================== */

export const TIPOS_OBJETIVO = {
  proporcional: 'Proporcional a una meta',
  relativo: 'Proporción sobre otro objetivo',
  valoracion: 'Valoración de dirección'
};

export const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;

const vacio = (v) => v === undefined || v === null || v === '';

export function plantillaDe(datos, persona) {
  const plantillas = (datos && datos.plantillas) || {};
  return (persona && plantillas[persona.plantilla]) || Object.values(plantillas)[0] || { titulo: '', objetivos: [] };
}

/* Los objetivos de una persona, con sus metas propias aplicadas. */
export function objetivosDe(datos, persona) {
  const plantilla = plantillaDe(datos, persona);
  const metas = (persona && persona.metas) || {};
  return (plantilla.objetivos || []).map((o) => {
    const porDefecto = o.tipo === 'relativo' ? Number(o.proporcion) || 0 : Number(o.meta) || 0;
    return {
      ...o,
      max: Number(o.max) || 0,
      meta: vacio(metas[o.id]) ? porDefecto : Number(metas[o.id]) || 0
    };
  });
}

export function registroDe(datos, personaId, mes) {
  const m = datos && datos.meses && datos.meses[mes];
  return (m && m[personaId]) || null;
}

function puntosDe(obj, registro, resultados) {
  const fijado = registro && registro.puntos ? registro.puntos[obj.id] : undefined;
  if (!vacio(fijado)) return { puntos: redondear(fijado), origen: 'fijado' };
  const r = resultados[obj.id];
  if (obj.tipo === 'proporcional') {
    if (vacio(r)) return { puntos: null, origen: 'sin-dato' };
    if (!(obj.meta > 0)) return { puntos: null, origen: 'sin-meta' };
    return { puntos: redondear(Math.min(obj.max, (Number(r) / obj.meta) * obj.max)), origen: 'calculado' };
  }
  if (obj.tipo === 'relativo') {
    const base = resultados[obj.base];
    if (vacio(r)) return { puntos: null, origen: 'sin-dato' };
    if (!(Number(base) > 0) || !(obj.meta > 0)) return { puntos: null, origen: 'sin-base' };
    return { puntos: redondear(Math.min(obj.max, ((Number(r) / Number(base)) / obj.meta) * obj.max)), origen: 'calculado' };
  }
  return { puntos: null, origen: 'sin-dato' };
}

/* Una persona en un mes: cada objetivo con su resultado, sus puntos y
   de dónde salen, más el total. */
export function calcularMes(datos, persona, mes) {
  const registro = registroDe(datos, persona.id, mes) || { resultados: {}, puntos: {} };
  const resultados = registro.resultados || {};
  const filas = objetivosDe(datos, persona).map((o) => {
    const { puntos, origen } = puntosDe(o, registro, resultados);
    return {
      ...o,
      resultado: vacio(resultados[o.id]) ? null : Number(resultados[o.id]),
      puntos,
      origen,
      pct: o.max ? Math.max(0, Math.min(100, Math.round(((puntos || 0) / o.max) * 100))) : 0
    };
  });
  const calculado = redondear(filas.reduce((n, f) => n + (f.puntos || 0), 0));
  const maximo = redondear(filas.reduce((n, f) => n + f.max, 0));
  // Si dirección publicó una puntuación final distinta, esa es la que vale.
  const ajustado = !vacio(registro.total);
  const total = ajustado ? redondear(registro.total) : calculado;
  const conDetalle = filas.some((f) => f.puntos !== null);
  return { persona, mes, filas, total, calculado, ajustado, maximo, conDatos: conDetalle || ajustado, conDetalle, nota: registro.nota || '' };
}

/* Personas en activo (las dadas de baja solo aparecen en los meses
   en los que tienen datos). */
export const personasEnActivo = (datos) => ((datos && datos.personas) || []).filter((p) => !p.baja);

export function mesesConDatos(datos) {
  const meses = (datos && datos.meses) || {};
  return Object.keys(meses).filter((m) => Object.keys(meses[m] || {}).length).sort();
}

export function ultimoMesConDatos(datos) {
  const meses = mesesConDatos(datos);
  return meses[meses.length - 1] || '';
}

/* Ranking de un mes: todas las personas con datos, de más a menos puntos. */
export function rankingDe(datos, mes) {
  const personas = (datos && datos.personas) || [];
  return personas
    .filter((p) => registroDe(datos, p.id, mes))
    .map((p) => calcularMes(datos, p, mes))
    .filter((c) => c.conDatos)
    .sort((a, b) => b.total - a.total || a.persona.nombre.localeCompare(b.persona.nombre))
    .map((c, i) => ({ ...c, puesto: i + 1 }));
}

/* Acumulado: media de los totales mensuales de cada persona (así no
   sale penalizado quien se incorporó más tarde). */
export function rankingAcumulado(datos, meses) {
  const lista = meses && meses.length ? meses : mesesConDatos(datos);
  const personas = (datos && datos.personas) || [];
  return personas.map((p) => {
    const calculos = lista.map((m) => registroDe(datos, p.id, m) && calcularMes(datos, p, m)).filter((c) => c && c.conDatos);
    const suma = redondear(calculos.reduce((n, c) => n + c.total, 0));
    return { persona: p, meses: calculos.length, suma, media: calculos.length ? redondear(suma / calculos.length) : 0 };
  }).filter((f) => f.meses)
    .sort((a, b) => b.media - a.media || b.meses - a.meses || a.persona.nombre.localeCompare(b.persona.nombre))
    .map((f, i) => ({ ...f, puesto: i + 1 }));
}

export function puestoDe(datos, personaId, mes) {
  const ranking = rankingDe(datos, mes);
  const mio = ranking.find((c) => c.persona.id === personaId);
  return mio ? { puesto: mio.puesto, de: ranking.length } : null;
}

/* Meses en los que una persona tiene datos, del más reciente al más antiguo. */
export function mesesDe(datos, personaId) {
  return mesesConDatos(datos).filter((m) => {
    const r = registroDe(datos, personaId, m);
    return r && (Object.keys(r.puntos || {}).length || Object.keys(r.resultados || {}).length || !vacio(r.total));
  }).reverse();
}

const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/* Qué persona de objetivos corresponde a la sesión: primero por correo
   y, si no, por el nombre de pila. */
export function personaDeSesion(datos, usuario) {
  const personas = (datos && datos.personas) || [];
  const correo = normalizar(usuario && usuario.correo);
  if (correo) {
    const porCorreo = personas.find((x) => normalizar(x.correo) === correo);
    if (porCorreo) return porCorreo;
  }
  const nombre = normalizar(usuario && usuario.nombre).split(/\s+/)[0];
  if (!nombre) return null;
  return personas.find((x) => normalizar(x.nombre).split(/\s+/)[0] === nombre) || null;
}

/* Puntuación con coma decimal, al estilo español (9,5). */
export const puntuacion = (n) => redondear(n).toLocaleString('es-ES', { maximumFractionDigits: 2 });

export function formatearResultado(n, unidad) {
  if (vacio(n)) return '—';
  const num = Number(n);
  if (unidad === '€') return num.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
  if (unidad === '%') return puntuacion(num) + ' %';
  return puntuacion(num) + (unidad ? ' ' + unidad : '');
}

/* Meta legible: "15 clientes", "50.000 €", "50 % de los captados". */
export function formatearMeta(obj, datos, persona) {
  if (obj.tipo === 'relativo') {
    const base = objetivosDe(datos, persona).find((o) => o.id === obj.base);
    return Math.round((obj.meta || 0) * 100) + ' % de ' + (base ? base.texto.toLowerCase() : obj.base);
  }
  if (obj.tipo === 'valoracion') return 'Valoración de dirección';
  return formatearResultado(obj.meta, obj.unidad);
}

export const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function nombreMes(aaaamm, conAno = true) {
  const [a, m] = String(aaaamm || '').split('-');
  const nombre = NOMBRES_MES[Number(m) - 1] || String(m || '');
  return conAno ? nombre + ' de ' + a : nombre;
}
