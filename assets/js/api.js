/* ===============================================================
   api.js - Cliente de la API de seguimiento
   ---------------------------------------------------------------
   Único punto por el que el portal habla con el servidor para el
   progreso, las visualizaciones, los exámenes y la actividad. Si la
   plataforma pasa a Supabase, se reescribe este módulo y el resto
   del portal no cambia. Todas las llamadas fallan en silencio
   cuando no hay servidor (p. ej., el paquete de un solo archivo).
   =============================================================== */

let identidad = () => ({ clave: '', nombre: '' });

/* El arranque indica cómo saber quién es la persona actual. */
export function configurarIdentidad(fn) {
  identidad = fn;
}

const SIN_CUENTA = { ok: false, error: 'Para que quede registrado hay que entrar con una cuenta.' };

/* publica = true para lo que no depende de quién pregunta (actividad). */
async function pedir(ruta, cuerpo, metodo, publica = false) {
  const yo = identidad();
  if (!publica && !yo.clave) return SIN_CUENTA;
  const url = new URL(ruta, location.origin);
  if (!cuerpo && yo.clave) url.searchParams.set('clave', yo.clave);
  const r = await fetch(url.toString(), {
    method: metodo || (cuerpo ? 'POST' : 'GET'),
    headers: cuerpo ? { 'content-type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify({ clave: yo.clave, nombre: yo.nombre, ...cuerpo }) : undefined
  });
  return r.json();
}

/* Devuelve null si no hay servidor, no hay cuenta o algo falla: el
   portal sigue funcionando igual. */
async function intentar(ruta, cuerpo, metodo, publica = false) {
  try {
    const datos = await pedir(ruta, cuerpo, metodo, publica);
    return datos && datos.ok ? datos : null;
  } catch (e) {
    return null;
  }
}

/* ── Progreso ────────────────────────────────────────────────── */
export const registrarProgreso = (leccion, hecha) => intentar('/api/progreso', { leccion, hecha: Boolean(hecha) });
export const subirProgreso = (lecciones) => intentar('/api/progreso', { lecciones });
export const progresoRemoto = () => intentar('/api/progreso');

/* ── Visualizaciones ─────────────────────────────────────────── */
export const registrarVisualizacion = (datos) => intentar('/api/visualizaciones', datos);
export const misVisualizaciones = () => intentar('/api/visualizaciones');

/* ── Exámenes ────────────────────────────────────────────────── */
export const entregarExamen = (modulo, respuestas) => pedir('/api/examenes', { modulo, respuestas });
export const misExamenes = () => intentar('/api/examenes');

/* ── Actividad ───────────────────────────────────────────────── */
export const actividadReciente = (limite = 40) => intentar('/api/actividad?limite=' + limite, null, 'GET', true);

/* ── Soporte informático (tickets) ───────────────────────────── */
export const misTickets = () => intentar('/api/tickets');
export const todosLosTickets = () => intentar('/api/tickets?todos=1');
export const abrirTicket = (datos) => pedir('/api/tickets', datos);
export const cambiarEstadoTicket = (id, estado, nota) => pedir('/api/tickets/estado', { id, estado, nota: nota || '' });
export const responderTicket = (id, texto) => pedir('/api/tickets/mensaje', { id, texto });
export const valorarTicket = (id, datos) => pedir('/api/tickets/encuesta', { id, ...datos });
export const notaInternaTicket = (id, texto) => pedir('/api/tickets/nota', { id, texto });
export const ajustarTicket = (id, datos) => pedir('/api/tickets/ajustar', { id, ...datos });

/* ── Seguimiento (solo administración) ───────────────────────── */
export const todoElProgreso = () => intentar('/api/progreso?todos=1');
export const todasLasVisualizaciones = () => intentar('/api/visualizaciones?todos=1');
export const todosLosExamenes = () => intentar('/api/examenes?todos=1');
