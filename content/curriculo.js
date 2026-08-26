/* ===============================================================
   curriculo.js - Registro central de contenidos
   ---------------------------------------------------------------
   Para añadir un modulo nuevo:
     1. Crear el archivo en content/modulos/
     2. Importarlo aqui
     3. Anadirlo al array MODULOS en la posicion que corresponda
   =============================================================== */

import m01 from './modulos/01-bienvenida.js';
import m02 from './modulos/02-servicios.js';
import m03 from './modulos/03-protocolo.js';
import m04 from './modulos/04-coordinacion.js';
import m05 from './modulos/05-herramientas.js';
import m06 from './modulos/06-hubspot.js';
import m07 from './modulos/07-control-clientes.js';
import m08 from './modulos/08-citas.js';
import m09 from './modulos/09-tramites.js';
import m10 from './modulos/10-documental.js';
import m11 from './modulos/11-incidencias.js';
import m12 from './modulos/12-leads.js';
import m13 from './modulos/13-comercial.js';
import m14 from './modulos/14-atencion.js';
import m15 from './modulos/15-marketing.js';
import m16 from './modulos/16-facturacion.js';
import m17 from './modulos/17-proteccion-datos.js';
import m18 from './modulos/18-formacion-continua.js';

export const VERSION = '1.0.0';

export const GRUPOS = [
  {
    id: 'fundamentos',
    titulo: 'Fundamentos del despacho',
    descripcion: 'Quiénes somos, qué hacemos y cómo nos organizamos. Punto de partida para cualquier incorporación.'
  },
  {
    id: 'herramientas',
    titulo: 'Herramientas y entorno digital',
    descripcion: 'Las aplicaciones que usamos a diario y cómo registramos la información de clientes.'
  },
  {
    id: 'operativa',
    titulo: 'Operativa y expedientes',
    descripcion: 'El trabajo del día a día: agenda, plazos, trámites, documentación e incidencias.'
  },
  {
    id: 'comercial',
    titulo: 'Comercial y clientes',
    descripcion: 'Desde que entra un contacto hasta que se convierte en cliente satisfecho que recomienda.'
  },
  {
    id: 'administracion',
    titulo: 'Administración y cumplimiento',
    descripcion: 'Facturación, cobros y las obligaciones que no admiten margen de error.'
  },
  {
    id: 'desarrollo',
    titulo: 'Desarrollo continuo',
    descripcion: 'Cómo se mantiene actualizado el equipo y cómo contribuyes a esta plataforma.'
  }
];

export const MODULOS = [
  m01, m02, m03, m04, m05, m06, m07, m08, m09,
  m10, m11, m12, m13, m14, m15, m16, m17, m18
];

/* Indice plano de lecciones, en orden de itinerario. */
export const LECCIONES = MODULOS.flatMap((mod) =>
  mod.lecciones.map((lec) => ({
    ...lec,
    moduloId: mod.id,
    moduloTitulo: mod.titulo,
    moduloNum: mod.num,
    clave: mod.id + '/' + lec.id
  }))
);

export const moduloPorId = (id) => MODULOS.find((m) => m.id === id) || null;
export const grupoPorId = (id) => GRUPOS.find((g) => g.id === id) || null;
export const modulosDeGrupo = (id) => MODULOS.filter((m) => m.grupo === id);

export const TOTAL_LECCIONES = LECCIONES.length;
export const TOTAL_MINUTOS = MODULOS.reduce((s, m) => s + (m.duracion || 0), 0);
