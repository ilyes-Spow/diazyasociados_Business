/* ===============================================================
   api.mjs - API de seguimiento: progreso, visualizaciones,
   exámenes y actividad
   ---------------------------------------------------------------
   La usa servidor.mjs para todo lo que no es Conecta ni perfiles.
   Cada petición lleva la "clave" de la persona (su correo de Google
   o, sin Google, "nombre:<nombre>"). Lo que ve toda la plataforma
   (actividad) es público para el equipo; lo de cada persona solo lo
   ve ella, y la administración lo ve todo (?todos=1).
   =============================================================== */

import {
  leerColeccion, modificar, registrarEvento, esAdministrador, personasFrescas,
  curriculoFresco, limpiar, idNuevo, ahora
} from './datos.mjs';
import { enviarAviso } from './correo.mjs';

const json = (respuesta, datos, codigo = 200) => {
  respuesta.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  respuesta.end(JSON.stringify(datos));
};

function cuerpo(peticion, limite = 256 * 1024) {
  return new Promise((cumplir, fallar) => {
    const trozos = [];
    let total = 0;
    peticion.on('data', (t) => {
      total += t.length;
      if (total > limite) { fallar(new Error('demasiado grande')); peticion.destroy(); return; }
      trozos.push(t);
    });
    peticion.on('end', () => cumplir(Buffer.concat(trozos)));
    peticion.on('error', fallar);
  });
}

async function leerJson(peticion) {
  try { return JSON.parse((await cuerpo(peticion)).toString('utf8')); } catch (e) { return null; }
}

const claveDe = (url, datos) => limpiar((datos && datos.clave) || url.searchParams.get('clave'), 120).toLowerCase();

/* Lectura de una colección: lo propio, o todo para administración. */
async function leerPropioOTodo(peticion, respuesta, url, nombre, campo, filtro) {
  const clave = claveDe(url);
  const lista = await leerColeccion(nombre, []);
  if (url.searchParams.get('todos') === '1') {
    if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo administración.' }, 403);
    return json(respuesta, { ok: true, [campo]: lista });
  }
  return json(respuesta, { ok: true, [campo]: lista.filter((x) => filtro(x, clave)) });
}

/* ── Progreso por persona ────────────────────────────────────── */
/* progreso.json: { [clave]: { nombre, lecciones: { "mod/lec": fechaISO }, actualizado } } */
async function progreso(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    const clave = claveDe(url);
    const todos = await leerColeccion('progreso', {});
    if (url.searchParams.get('todos') === '1') {
      if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo administración.' }, 403);
      return json(respuesta, { ok: true, progreso: todos });
    }
    return json(respuesta, { ok: true, lecciones: (todos[clave] && todos[clave].lecciones) || {} });
  }
  if (peticion.method === 'POST') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = claveDe(url, datos);
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    // Una lección (leccion + hecha) o varias de golpe (lecciones: { clave: true/false }).
    const cambios = {};
    if (datos.lecciones && typeof datos.lecciones === 'object') {
      for (const [k, v] of Object.entries(datos.lecciones)) if (String(k).includes('/')) cambios[limpiar(k, 120)] = Boolean(v);
    }
    const unaLeccion = limpiar(datos.leccion, 120);
    if (unaLeccion.includes('/')) cambios[unaLeccion] = Boolean(datos.hecha);
    if (!Object.keys(cambios).length) return json(respuesta, { ok: false, error: 'Faltan datos.' }, 400);

    const { porId } = await curriculoFresco();
    const resultado = await modificar('progreso', {}, (todos) => {
      const mio = todos[clave] || { nombre: '', lecciones: {} };
      mio.nombre = limpiar(datos.nombre, 60) || mio.nombre;
      const completadosAhora = [];
      for (const [leccion, hecha] of Object.entries(cambios)) {
        const mod = porId.get(leccion.split('/')[0]);
        const yaCompleto = mod && mod.lecciones.every((l) => mio.lecciones[mod.id + '/' + l.id]);
        if (hecha) mio.lecciones[leccion] = mio.lecciones[leccion] || ahora(); else delete mio.lecciones[leccion];
        if (hecha && mod && !yaCompleto && mod.lecciones.every((l) => mio.lecciones[mod.id + '/' + l.id])) completadosAhora.push(mod);
      }
      mio.actualizado = ahora();
      todos[clave] = mio;
      return { lecciones: mio.lecciones, nombre: mio.nombre, completadosAhora };
    });

    // Si con esto se completa un módulo, queda en la actividad (solo
    // cuando es una marca de la persona, no una sincronización masiva).
    if (unaLeccion) {
      for (const mod of resultado.completadosAhora) {
        await registrarEvento({
          tipo: 'modulo',
          texto: (resultado.nombre || 'Alguien') + ' ha completado el módulo «' + mod.titulo + '»',
          ruta: '#/modulo/' + mod.id,
          actor: { clave, nombre: resultado.nombre }
        });
      }
    }
    return json(respuesta, { ok: true, lecciones: resultado.lecciones });
  }
  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

/* ── Visualizaciones de vídeo ────────────────────────────────── */
/* visualizaciones.json: [ { clave, nombre, modulo, leccion, src, titulo,
     primera, ultima, porcentaje, segundos, completo, veces } ] */
async function visualizaciones(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    return leerPropioOTodo(peticion, respuesta, url, 'visualizaciones', 'visualizaciones', (v, clave) => v.clave === clave);
  }
  if (peticion.method === 'POST') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = claveDe(url, datos);
    const src = limpiar(datos.src, 300);
    if (!clave || !src) return json(respuesta, { ok: false, error: 'Faltan datos.' }, 400);
    const porcentaje = Math.max(0, Math.min(100, Math.round(Number(datos.porcentaje) || 0)));
    const v = await modificar('visualizaciones', [], (lista) => {
      let v = lista.find((x) => x.clave === clave && x.src === src);
      if (!v) {
        v = { clave, nombre: limpiar(datos.nombre, 60), modulo: limpiar(datos.modulo, 60), leccion: limpiar(datos.leccion, 60),
          src, titulo: limpiar(datos.titulo, 120), primera: ahora(), ultima: ahora(), porcentaje: 0, segundos: 0, completo: false, veces: 0 };
        lista.unshift(v);
      }
      v.nombre = limpiar(datos.nombre, 60) || v.nombre;
      v.ultima = ahora();
      v.porcentaje = Math.max(v.porcentaje, porcentaje);
      v.segundos = Math.max(v.segundos, Math.round(Number(datos.segundos) || 0));
      if (datos.inicio) v.veces += 1;
      if (datos.completo || v.porcentaje >= 95) { v.porcentaje = Math.max(v.porcentaje, 95); v.completo = true; }
      if (lista.length > 5000) lista.length = 5000;
      return v;
    });
    return json(respuesta, { ok: true, visualizacion: v });
  }
  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

/* ── Exámenes ────────────────────────────────────────────────── */
/* examenes.json: [ { id, clave, nombre, modulo, fecha, aciertos, total,
     nota, aprobado, respuestas } ]. El servidor corrige con el examen
   real del módulo, así que la nota no depende del navegador. */
async function examenes(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    return leerPropioOTodo(peticion, respuesta, url, 'examenes', 'intentos', (i, clave) => i.clave === clave);
  }
  if (peticion.method === 'POST') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = claveDe(url, datos);
    if (!clave) return json(respuesta, { ok: false, error: 'Falta la identidad.' }, 400);
    const { porId } = await curriculoFresco();
    const mod = porId.get(String(datos.modulo || ''));
    if (!mod || !mod.examen || !Array.isArray(mod.examen.preguntas) || !mod.examen.preguntas.length) {
      return json(respuesta, { ok: false, error: 'Este módulo no tiene examen.' }, 404);
    }
    const respuestas = Array.isArray(datos.respuestas) ? datos.respuestas.map((r) => Number(r)) : [];
    const preguntas = mod.examen.preguntas;
    const correccion = preguntas.map((p, i) => {
      const elegida = Number.isInteger(respuestas[i]) ? respuestas[i] : -1;
      const correcta = Number(p.correcta) || 0;
      return { id: p.id, correcta, elegida, acierto: elegida === correcta, explicacion: p.explicacion || '' };
    });
    const aciertos = correccion.filter((c) => c.acierto).length;
    const nota = Math.round((aciertos / preguntas.length) * 100);
    const aprobadoCon = Number(mod.examen.aprobado) || 70;
    const aprobado = nota >= aprobadoCon;
    const intento = {
      id: idNuevo(), clave, nombre: limpiar(datos.nombre, 60), modulo: mod.id, fecha: ahora(),
      aciertos, total: preguntas.length, nota, aprobado, respuestas: correccion.map((c) => c.elegida)
    };
    const { primeraVezAprobado, intentos } = await modificar('examenes', [], (lista) => {
      const anteriores = lista.filter((i) => i.clave === clave && i.modulo === mod.id);
      lista.unshift(intento);
      if (lista.length > 5000) lista.length = 5000;
      return { primeraVezAprobado: aprobado && !anteriores.some((i) => i.aprobado), intentos: anteriores.length + 1 };
    });
    if (primeraVezAprobado) {
      await registrarEvento({
        tipo: 'examen',
        texto: (intento.nombre || 'Alguien') + ' ha aprobado el examen de «' + mod.titulo + '» con un ' + nota + ' %',
        ruta: '#/modulo/' + mod.id,
        actor: { clave, nombre: intento.nombre }
      });
    }
    return json(respuesta, { ok: true, intento, resultado: { aciertos, total: preguntas.length, nota, aprobado, aprobadoCon, correccion, intentos } });
  }
  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

/* ── Actividad reciente ──────────────────────────────────────── */
async function actividad(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    const lista = await leerColeccion('actividad', []);
    const limite = Math.min(100, Number(url.searchParams.get('limite')) || 40);
    // Cumpleaños de hoy, a partir de los perfiles que lo muestran.
    const perfiles = await leerColeccion('perfiles', {});
    const hoy = new Date();
    const ddmm = String(hoy.getDate()).padStart(2, '0') + '/' + String(hoy.getMonth() + 1).padStart(2, '0');
    const cumples = Object.values(perfiles)
      .filter((p) => p && p.mostrarCumple !== false && p.cumple === ddmm && p.nombre)
      .map((p) => ({
        id: 'cumple-' + p.clave + '-' + hoy.toISOString().slice(0, 10),
        fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 8).toISOString(),
        tipo: 'cumple',
        texto: 'Hoy es el cumpleaños de ' + p.nombre + '. Felicítale en Conecta.',
        ruta: '#/conecta',
        actor: { clave: p.clave, nombre: p.nombre }
      }));
    return json(respuesta, { ok: true, eventos: cumples.concat(lista).slice(0, limite) });
  }
  if (peticion.method === 'POST') {
    // Solo administración puede anotar eventos a mano (comunicados).
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = claveDe(url, datos);
    if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo administración.' }, 403);
    const texto = limpiar(datos.texto, 200);
    if (!texto) return json(respuesta, { ok: false, error: 'Falta el texto.' }, 400);
    const evento = await registrarEvento({ tipo: limpiar(datos.tipo, 30) || 'comunicado', texto, ruta: limpiar(datos.ruta, 120) || '#/inicio', actor: { clave, nombre: limpiar(datos.nombre, 60) } });
    return json(respuesta, { ok: true, evento });
  }
  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

/* ── Soporte informático: tickets ────────────────────────────── */
/* tickets.json: [ { id, numero, fecha, actualizado, clave, nombre, titulo,
     descripcion, categoria, urgencia, estado, resuelto,
     historial: [ { fecha, estado, por } ],
     mensajes: [ { fecha, clave, nombre, texto, informatica } ],
     encuesta: { estrellas, tiempo, contacto, comentario, fecha } | null } ]
   Cada persona ve solo sus tickets; administración (informática) los ve
   todos y cambia el estado. */
const ESTADOS_TICKET = ['pendiente', 'en-proceso', 'resuelto'];
const CATEGORIAS_TICKET = ['equipo', 'correo', 'hubspot', 'telefonia', 'accesos', 'impresora', 'web', 'otro'];
const URGENCIAS_TICKET = ['baja', 'normal', 'alta'];
const TEXTO_ESTADO = { pendiente: 'pendiente', 'en-proceso': 'en proceso', resuelto: 'resuelto' };

async function correosInformatica() {
  return (await personasFrescas())
    .filter((p) => p && p.activo !== false && p.rol === 'administracion' && p.correo)
    .map((p) => String(p.correo).toLowerCase());
}

const avisarCorreo = (asunto, texto, destinatarios) => {
  if (!destinatarios || !destinatarios.length) return;
  enviarAviso(asunto, texto, destinatarios).catch(() => {});
};

async function tickets(peticion, respuesta, url) {
  if (peticion.method === 'GET') {
    const clave = claveDe(url);
    const lista = await leerColeccion('tickets', []);
    if (url.searchParams.get('todos') === '1') {
      if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo administración.' }, 403);
      return json(respuesta, { ok: true, tickets: lista });
    }
    // La persona ve sus tickets sin las notas internas de informática.
    return json(respuesta, { ok: true, tickets: lista.filter((t) => t.clave === clave).map(({ notas, ...t }) => t) });
  }
  if (peticion.method === 'POST') {
    const datos = await leerJson(peticion);
    if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
    const clave = claveDe(url, datos);
    if (!clave) return json(respuesta, { ok: false, error: 'Para abrir un ticket, entra con tu cuenta o pon tu nombre en Conecta.' }, 400);
    const titulo = limpiar(datos.titulo, 120);
    if (!titulo) return json(respuesta, { ok: false, error: 'Cuenta en una línea qué pasa.' }, 400);
    const descripcion = String(datos.descripcion || '').replace(/\r/g, '').trim().slice(0, 2000);
    const categoria = CATEGORIAS_TICKET.includes(datos.categoria) ? datos.categoria : 'otro';
    const urgencia = URGENCIAS_TICKET.includes(datos.urgencia) ? datos.urgencia : 'normal';
    const nombre = limpiar(datos.nombre, 60);
    const ticket = await modificar('tickets', [], (lista) => {
      const numero = lista.reduce((m, t) => Math.max(m, Number(t.numero) || 0), 0) + 1;
      const t = {
        id: idNuevo(), numero, fecha: ahora(), actualizado: ahora(), clave, nombre, titulo, descripcion, categoria, urgencia,
        estado: 'pendiente', resuelto: '', historial: [{ fecha: ahora(), estado: 'pendiente', por: nombre }], mensajes: [], notas: [], encuesta: null
      };
      lista.unshift(t);
      if (lista.length > 5000) lista.length = 5000;
      return t;
    });
    avisarCorreo('Soporte · ticket #' + ticket.numero + ': ' + titulo,
      (nombre || 'Alguien') + ' ha abierto un ticket de informática (' + categoria + ', urgencia ' + urgencia + ').\n\n' +
      (descripcion || '(sin detalles)') + '\n\nEntra en la plataforma, sección Soporte informático, para atenderlo.',
      await correosInformatica());
    return json(respuesta, { ok: true, ticket });
  }
  return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
}

/* Cambio de estado: solo informática (administración). */
async function ticketsEstado(peticion, respuesta, url) {
  if (peticion.method !== 'POST') return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
  const datos = await leerJson(peticion);
  if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
  const clave = claveDe(url, datos);
  if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo informática puede cambiar el estado.' }, 403);
  const estado = ESTADOS_TICKET.includes(datos.estado) ? datos.estado : '';
  if (!estado) return json(respuesta, { ok: false, error: 'Estado no válido.' }, 400);
  const nombre = limpiar(datos.nombre, 60) || 'Informática';
  const nota = String(datos.nota || '').replace(/\r/g, '').trim().slice(0, 1000);
  const ticket = await modificar('tickets', [], (lista) => {
    const t = lista.find((x) => x.id === datos.id);
    if (!t) return null;
    if (t.estado !== estado) {
      t.estado = estado;
      t.historial.push({ fecha: ahora(), estado, por: nombre });
      t.resuelto = estado === 'resuelto' ? ahora() : '';
      if (estado !== 'resuelto') t.encuesta = null;
    }
    if (nota) t.mensajes.push({ fecha: ahora(), clave, nombre, texto: nota, informatica: true });
    t.actualizado = ahora();
    return t;
  });
  if (!ticket) return json(respuesta, { ok: false, error: 'Ese ticket no existe.' }, 404);
  if (ticket.clave.includes('@')) {
    avisarCorreo('Soporte · tu ticket #' + ticket.numero + ' está ' + TEXTO_ESTADO[estado],
      'Tu ticket «' + ticket.titulo + '» ha pasado a ' + TEXTO_ESTADO[estado] + '.' + (nota ? '\n\nMensaje de informática:\n' + nota : '') +
      (estado === 'resuelto' ? '\n\nEntra en la plataforma, sección Soporte informático, para valorar la atención.' : ''), [ticket.clave]);
  }
  return json(respuesta, { ok: true, ticket });
}

/* Mensajes en el hilo: la persona que abrió el ticket o informática. */
async function ticketsMensaje(peticion, respuesta, url) {
  if (peticion.method !== 'POST') return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
  const datos = await leerJson(peticion);
  if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
  const clave = claveDe(url, datos);
  const texto = String(datos.texto || '').replace(/\r/g, '').trim().slice(0, 1000);
  if (!clave || !texto) return json(respuesta, { ok: false, error: 'Falta el mensaje.' }, 400);
  const admin = await esAdministrador(clave);
  const nombre = limpiar(datos.nombre, 60);
  let prohibido = false;
  const ticket = await modificar('tickets', [], (lista) => {
    const t = lista.find((x) => x.id === datos.id);
    if (!t) return null;
    if (t.clave !== clave && !admin) { prohibido = true; return null; }
    t.mensajes.push({ fecha: ahora(), clave, nombre, texto, informatica: admin && t.clave !== clave });
    t.actualizado = ahora();
    return t;
  });
  if (prohibido) return json(respuesta, { ok: false, error: 'Ese ticket no es tuyo.' }, 403);
  if (!ticket) return json(respuesta, { ok: false, error: 'Ese ticket no existe.' }, 404);
  if (admin && ticket.clave !== clave) {
    if (ticket.clave.includes('@')) avisarCorreo('Soporte · respuesta en tu ticket #' + ticket.numero, nombre + ' responde en «' + ticket.titulo + '»:\n\n' + texto, [ticket.clave]);
  } else {
    avisarCorreo('Soporte · mensaje en el ticket #' + ticket.numero, (nombre || 'La persona') + ' escribe en «' + ticket.titulo + '»:\n\n' + texto, await correosInformatica());
  }
  return json(respuesta, { ok: true, ticket });
}

/* Encuesta al resolver: solo quien abrió el ticket, una vez resuelto. */
async function ticketsEncuesta(peticion, respuesta, url) {
  if (peticion.method !== 'POST') return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
  const datos = await leerJson(peticion);
  if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
  const clave = claveDe(url, datos);
  const estrellas = Math.round(Number(datos.estrellas) || 0);
  if (!clave || estrellas < 1 || estrellas > 5) return json(respuesta, { ok: false, error: 'Elige de 1 a 5 estrellas.' }, 400);
  let motivo = '';
  const ticket = await modificar('tickets', [], (lista) => {
    const t = lista.find((x) => x.id === datos.id);
    if (!t) { motivo = 'Ese ticket no existe.'; return null; }
    if (t.clave !== clave) { motivo = 'Ese ticket no es tuyo.'; return null; }
    if (t.estado !== 'resuelto') { motivo = 'El ticket todavía no está resuelto.'; return null; }
    t.encuesta = {
      estrellas,
      tiempo: ['rapido', 'normal', 'lento'].includes(datos.tiempo) ? datos.tiempo : '',
      contacto: limpiar(datos.contacto, 80),
      comentario: String(datos.comentario || '').replace(/\r/g, '').trim().slice(0, 500),
      fecha: ahora()
    };
    t.actualizado = ahora();
    return t;
  });
  if (!ticket) return json(respuesta, { ok: false, error: motivo || 'No se ha podido guardar.' }, 400);
  return json(respuesta, { ok: true, ticket });
}

/* Nota interna de informática: no la ve la persona ni cambia el estado. */
async function ticketsNota(peticion, respuesta, url) {
  if (peticion.method !== 'POST') return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
  const datos = await leerJson(peticion);
  if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
  const clave = claveDe(url, datos);
  if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo informática.' }, 403);
  const texto = String(datos.texto || '').replace(/\r/g, '').trim().slice(0, 500);
  if (!texto) return json(respuesta, { ok: false, error: 'Falta la nota.' }, 400);
  const ticket = await modificar('tickets', [], (lista) => {
    const t = lista.find((x) => x.id === datos.id);
    if (!t) return null;
    t.notas = t.notas || [];
    t.notas.push({ fecha: ahora(), nombre: limpiar(datos.nombre, 60) || 'Informática', texto });
    return t;
  });
  if (!ticket) return json(respuesta, { ok: false, error: 'Ese ticket no existe.' }, 404);
  return json(respuesta, { ok: true, ticket });
}

/* Ajustes de informática: urgencia y tipo. */
async function ticketsAjustar(peticion, respuesta, url) {
  if (peticion.method !== 'POST') return json(respuesta, { ok: false, error: 'Método no admitido.' }, 405);
  const datos = await leerJson(peticion);
  if (!datos) return json(respuesta, { ok: false, error: 'No se ha podido leer lo enviado.' }, 400);
  const clave = claveDe(url, datos);
  if (!(await esAdministrador(clave))) return json(respuesta, { ok: false, error: 'Solo informática.' }, 403);
  const ticket = await modificar('tickets', [], (lista) => {
    const t = lista.find((x) => x.id === datos.id);
    if (!t) return null;
    if (URGENCIAS_TICKET.includes(datos.urgencia)) t.urgencia = datos.urgencia;
    if (CATEGORIAS_TICKET.includes(datos.categoria)) t.categoria = datos.categoria;
    return t;
  });
  if (!ticket) return json(respuesta, { ok: false, error: 'Ese ticket no existe.' }, 404);
  return json(respuesta, { ok: true, ticket });
}

/* ── Reparto ─────────────────────────────────────────────────── */
const RUTAS = {
  '/api/progreso': progreso,
  '/api/visualizaciones': visualizaciones,
  '/api/examenes': examenes,
  '/api/actividad': actividad,
  '/api/tickets': tickets,
  '/api/tickets/estado': ticketsEstado,
  '/api/tickets/mensaje': ticketsMensaje,
  '/api/tickets/encuesta': ticketsEncuesta,
  '/api/tickets/nota': ticketsNota,
  '/api/tickets/ajustar': ticketsAjustar
};

export function atiendeApi(ruta) {
  return Object.prototype.hasOwnProperty.call(RUTAS, ruta);
}

export async function atenderApi(peticion, respuesta, url) {
  const manejador = RUTAS[url.pathname];
  if (!manejador) return json(respuesta, { ok: false, error: 'No existe.' }, 404);
  try {
    return await manejador(peticion, respuesta, url);
  } catch (e) {
    return json(respuesta, { ok: false, error: 'Error del servidor: ' + e.message }, 500);
  }
}
