/* ===============================================================
   objetivos.js - Objetivos, metas y resultados por persona
   ---------------------------------------------------------------
   Este archivo lo mantiene el panel de administración
   (npm run admin); el histórico se puede volcar desde los Excel
   con herramientas/importar-objetivos.mjs.

   - plantillas: la lista de objetivos de cada tipo de puesto, con
     su puntuación máxima y cómo se puntúa (proporcional a una meta,
     proporción sobre otro objetivo o valoración de dirección).
   - personas: quién tiene objetivos, con qué plantilla y sus metas
     propias (lo que no se indica usa la meta de la plantilla).
   - meses: por mes y persona, los resultados reales y los puntos
     fijados a mano. Lo que no está fijado se calcula solo. Si
     dirección publicó una puntuación final distinta de la suma,
     va en `total` y es la que manda en el ranking.

   AVISO: viaja al navegador de todo el equipo. Solo cifras y
   puntuaciones, nunca comentarios ni datos de clientes.
   =============================================================== */

const OBJETIVOS = {

  plantillas: {
    comercial: {
      titulo: 'Objetivos comerciales',
      objetivos: [
        { id: 'captacion', texto: 'Captación de nuevos clientes', max: 0.25, tipo: 'proporcional', meta: 15, unidad: 'clientes' },
        { id: 'cerrados', texto: 'Expedientes cerrados', max: 1, tipo: 'relativo', base: 'captacion', proporcion: 0.5, unidad: 'expedientes' },
        { id: 'mn', texto: 'MN', max: 1, tipo: 'valoracion' },
        { id: 'contabilidad', texto: 'Contabilidad y control de clientes', max: 1, tipo: 'valoracion' },
        { id: 'facturacion', texto: 'Facturación', max: 4, tipo: 'proporcional', meta: 15000, unidad: '€' },
        { id: 'colaboraciones', texto: 'Colaboraciones externas', max: 0.5, tipo: 'proporcional', meta: 2, unidad: 'colaboraciones' },
        { id: 'rrss', texto: 'RRSS', max: 1, tipo: 'valoracion' },
        { id: 'resenas', texto: 'Reseñas de Google', max: 1, tipo: 'proporcional', meta: 15, unidad: 'reseñas' },
        { id: 'limpieza', texto: 'Limpieza y material', max: 0.25, tipo: 'valoracion' },
        { id: 'actitud', texto: 'Actitud (punto extra)', max: 1, tipo: 'valoracion', extra: true }
      ]
    },
    marketing: {
      titulo: 'Objetivos de marketing',
      objetivos: [
        { id: 'contenidos', texto: 'Guiones, calendario y publicaciones (posts, vídeos, reels)', max: 2, tipo: 'valoracion' },
        { id: 'colaboraciones', texto: 'Colaboraciones', max: 0.5, tipo: 'proporcional', meta: 2, unidad: 'colaboraciones' },
        { id: 'branding', texto: 'Branding (imagen de marca)', max: 1, tipo: 'valoracion' },
        { id: 'captacion-rrss', texto: 'Captación comercial de clientes a través de RRSS', max: 1, tipo: 'proporcional', meta: 3, unidad: 'clientes' },
        { id: 'seguidores', texto: 'Crecimiento de seguidores en RRSS', max: 1, tipo: 'valoracion' },
        { id: 'eventos', texto: 'Participación en eventos', max: 0.5, tipo: 'proporcional', meta: 1, unidad: 'eventos' },
        { id: 'merchandising', texto: 'Merchandising (presentaciones, folletos, regalos)', max: 0.75, tipo: 'valoracion' },
        { id: 'proyectos', texto: 'Proyectos (nuevas aperturas)', max: 1, tipo: 'valoracion' },
        { id: 'resenas', texto: 'Reseñas (seguimiento de oficinas, principal Madrid)', max: 1, tipo: 'valoracion' },
        { id: 'offline', texto: 'Captación de clientes offline (publicidad)', max: 0.25, tipo: 'proporcional', meta: 1, unidad: 'acciones' },
        { id: 'historias', texto: 'Historias diarias en WhatsApp e Instagram', max: 1, tipo: 'valoracion' },
        { id: 'actitud', texto: 'Actitud (punto extra)', max: 1, tipo: 'valoracion', extra: true }
      ]
    },
    informatica: {
      titulo: 'Informática y soporte tecnológico',
      objetivos: [
        { id: 'soporte', texto: 'Soporte informático y resolución de incidencias', max: 2, tipo: 'valoracion' },
        { id: 'workspace', texto: 'Administración de Google Workspace y seguridad', max: 1.25, tipo: 'valoracion' },
        { id: 'equipos', texto: 'Preparación y configuración de equipos', max: 1, tipo: 'valoracion' },
        { id: 'fichaje', texto: 'Soporte y formación en la aplicación de fichaje', max: 0.5, tipo: 'valoracion' },
        { id: 'nomadas', texto: 'Apoyo a expedientes de nómada digital y herramientas', max: 1, tipo: 'valoracion' },
        { id: 'traducciones', texto: 'Calidad y cumplimiento de plazos en traducciones', max: 0.75, tipo: 'valoracion' },
        { id: 'clientes', texto: 'Apoyo en la atención a clientes', max: 0.5, tipo: 'valoracion' },
        { id: 'plataforma', texto: 'Desarrollo y mejora de la plataforma interna', max: 2, tipo: 'valoracion' },
        { id: 'documentacion', texto: 'Documentación, prevención y mejora continua', max: 0.5, tipo: 'valoracion' },
        { id: 'actitud', texto: 'Colaboración, actitud e implicación', max: 0.5, tipo: 'valoracion' }
      ]
    }
  },

  personas: [
    { id: 'adrian', nombre: 'Adrian', correo: 'adrianmerchan@diazyasociados.es', foto: 'assets/img/equipo/adrian.jpg', plantilla: 'comercial', metas: {  } },
    { id: 'alvaro', nombre: 'Alvaro', correo: 'alvarovergara@diazyasociados.es', foto: 'assets/img/equipo/alvaro.jpg', plantilla: 'comercial', metas: { facturacion: 17000, colaboraciones: 1 } },
    { id: 'diego', nombre: 'Diego', correo: 'diegoescarpizo@diazyasociados.es', foto: 'assets/img/equipo/diego.jpg', plantilla: 'marketing', metas: {  } },
    { id: 'dominique', nombre: 'Dominique', correo: 'oficinamexico@diazyasociados.es', foto: 'assets/img/equipo/dominique.jpg', plantilla: 'comercial', metas: { facturacion: 20000 } },
    { id: 'ilyes', nombre: 'Ilyes', correo: 'ilyes@diazyasociados.es', foto: 'assets/img/equipo/ilyes.jpg', plantilla: 'informatica', metas: {  } },
    { id: 'jonathan', nombre: 'Jonathan', correo: '', plantilla: 'comercial', baja: true, metas: {  } },
    { id: 'lucas', nombre: 'Lucas', correo: 'lucasvillanueva@diazyasociados.es', foto: 'assets/img/equipo/lucas.jpg', plantilla: 'comercial', metas: { facturacion: 10000 } },
    { id: 'luciana', nombre: 'Luciana', correo: 'lucianadiaz@diazyasociados.es', foto: 'assets/img/equipo/luciana.jpg', plantilla: 'comercial', metas: {  } },
    { id: 'mercedes', nombre: 'Mercedes', correo: 'mercedes@diazyasociados.es', foto: 'assets/img/equipo/mercedes.jpg', plantilla: 'comercial', metas: { facturacion: 10000 } },
    { id: 'monse', nombre: 'Monse', correo: '', plantilla: 'comercial', baja: true, metas: {  } },
    { id: 'nacho', nombre: 'Nacho', correo: 'nacho@diazyasociados.es', foto: 'assets/img/equipo/nacho.jpg', plantilla: 'comercial', metas: { captacion: 20, cerrados: 0.7, facturacion: 50000 } },
    { id: 'pedro', nombre: 'Pedro', correo: '', plantilla: 'comercial', baja: true, metas: {  } },
    { id: 'syuzanna', nombre: 'Syuzanna', correo: 'syuzanna@diazyasociados.es', foto: 'assets/img/equipo/syuzanna.jpg', plantilla: 'comercial', metas: { captacion: 30, facturacion: 20000 } },
    { id: 'victor', nombre: 'Victor', correo: 'victorarrieta@diazyasociados.es', foto: 'assets/img/equipo/victor.jpg', plantilla: 'comercial', metas: { facturacion: 20000 } }
  ],

  meses: {
    '2026-01': {
      lucas: {
        resultados: { captacion: 7, cerrados: 5, facturacion: 10141, colaboraciones: 0, resenas: 4 },
        puntos: { captacion: 0.06, cerrados: 1, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.27, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 13, cerrados: 2, facturacion: 4050, colaboraciones: 0 },
        puntos: { captacion: 0.25, cerrados: 0.4, mn: 1, contabilidad: 0.75, facturacion: 2.15, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 1, actitud: 1 }
      },
      nacho: {
        resultados: { captacion: 23, cerrados: 6, facturacion: 14600, colaboraciones: 3, resenas: 26 },
        puntos: { captacion: 0.25, cerrados: 0.55, mn: 1, contabilidad: 0.9, facturacion: 3.9, colaboraciones: 0.6, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      syuzanna: {
        resultados: { captacion: 51, cerrados: 11, facturacion: 10565, colaboraciones: 1, resenas: 6 },
        puntos: { captacion: 0.25, cerrados: 0.45, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0.25, rrss: 1, resenas: 0.4, limpieza: 0.25, actitud: 0.25 }
      },
      victor: {
        resultados: { captacion: 25, cerrados: 6, colaboraciones: 1, rrss: 1, resenas: 6 },
        puntos: { captacion: 0.21, cerrados: 0.5, mn: 0.75, contabilidad: 1, facturacion: 5.7, colaboraciones: 0.25, rrss: 1, resenas: 0.4, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-02': {
      lucas: {
        resultados: { captacion: 14, cerrados: 5, facturacion: 6120, colaboraciones: 1, resenas: 13 },
        puntos: { captacion: 0.25, cerrados: 0.71, mn: 0.75, contabilidad: 1, facturacion: 2.45, colaboraciones: 0.25, rrss: 1, resenas: 0.86, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 30, cerrados: 7, facturacion: 6750, colaboraciones: 0 },
        puntos: { captacion: 0.25, cerrados: 0.46, mn: 0, contabilidad: 0.5, facturacion: 1.59, colaboraciones: 0, rrss: 1, resenas: 0.5, limpieza: 0.25, actitud: 0.5 }
      },
      nacho: {
        resultados: { captacion: 24, cerrados: 12, facturacion: 19650, colaboraciones: 2, resenas: 23 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 1, contabilidad: 0.9, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      syuzanna: {
        resultados: { captacion: 62, cerrados: 13, facturacion: 5350, colaboraciones: 2, rrss: 1, resenas: 1 },
        puntos: { captacion: 0.25, cerrados: 0.43, mn: 1, contabilidad: 0.75, facturacion: 2.67, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 0.75 }
      },
      victor: {
        resultados: { captacion: 21, cerrados: 5, facturacion: 12250, colaboraciones: 0, resenas: 13 },
        puntos: { captacion: 0.25, cerrados: 0.5, mn: 0.33, contabilidad: 0.5, facturacion: 4.9, colaboraciones: 0, rrss: 1, resenas: 0.87, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-03': {
      lucas: {
        resultados: { captacion: 17, cerrados: 7, facturacion: 12400, colaboraciones: 3, resenas: 18 },
        puntos: { captacion: 0.25, cerrados: 0.87, mn: 1, contabilidad: 0.9, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 20, cerrados: 17, facturacion: 5490, colaboraciones: 0, resenas: 15 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.8, contabilidad: 0.7, facturacion: 1.3, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      nacho: {
        resultados: { captacion: 25, cerrados: 10, facturacion: 15700, colaboraciones: 2, resenas: 15 },
        puntos: { captacion: 0.25, cerrados: 0.85, mn: 0.9, contabilidad: 0.5, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      syuzanna: {
        resultados: { captacion: 36, cerrados: 19, facturacion: 10500, colaboraciones: 1, resenas: 15 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 1, contabilidad: 0.9, facturacion: 4, colaboraciones: 0.25, rrss: 1, resenas: 1, limpieza: 0.1, actitud: 1 }
      },
      victor: {
        resultados: { captacion: 10, cerrados: 6, facturacion: 15260, colaboraciones: 0, resenas: 8 },
        puntos: { captacion: 1.17, cerrados: 1, mn: 0.8, contabilidad: 0.5, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.54, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-04': {
      lucas: {
        resultados: { captacion: 8, cerrados: 4, facturacion: 11384, colaboraciones: 1, resenas: 13 },
        puntos: { captacion: 0.14, cerrados: 1, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0.25, rrss: 1, resenas: 0.86, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 26, cerrados: 10, facturacion: 23360, colaboraciones: 0, resenas: 25 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.9, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1.5 }
      },
      monse: {
        resultados: {  },
        puntos: {  },
        total: 6.7
      },
      nacho: {
        resultados: { captacion: 24, cerrados: 15, facturacion: 23810, colaboraciones: 1, resenas: 4 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.75, contabilidad: 1, facturacion: 4, colaboraciones: 0.25, rrss: 1, resenas: 0.27, limpieza: 0.25, actitud: 1 },
        total: 9.52
      },
      pedro: {
        resultados: {  },
        puntos: {  },
        total: 7.94
      },
      syuzanna: {
        resultados: { captacion: 25, cerrados: 12, facturacion: 30190, colaboraciones: 0, resenas: 4 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.25, limpieza: 0.25, actitud: 1 }
      },
      victor: {
        resultados: { captacion: 12, cerrados: 4, facturacion: 20000, colaboraciones: 0, resenas: 8 },
        puntos: { captacion: 0.2, cerrados: 0.67, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.54, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-05': {
      diego: {
        resultados: { colaboraciones: 1, 'captacion-rrss': 1, eventos: 0 },
        puntos: { contenidos: 1, colaboraciones: 0.25, branding: 0.25, 'captacion-rrss': 0.5, seguidores: 1, eventos: 0, merchandising: 0.5, proyectos: 0.25, resenas: 0.5, offline: 0.25, historias: 1, actitud: 1 }
      },
      lucas: {
        resultados: { captacion: 12, cerrados: 6, facturacion: 20645, colaboraciones: 0, resenas: 5 },
        puntos: { captacion: 0.2, cerrados: 1, mn: 0.6, contabilidad: 0.5, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.33, limpieza: 0.25, actitud: 1 },
        total: 8.68
      },
      mercedes: {
        resultados: { captacion: 11, cerrados: 10, facturacion: 9475, colaboraciones: 4, resenas: 23 },
        puntos: { captacion: 0.18, cerrados: 0.9, mn: 0, contabilidad: 0.2, facturacion: 2.23, colaboraciones: 0.5, rrss: 0.5, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      monse: {
        resultados: {  },
        puntos: {  },
        total: 4.06
      },
      nacho: {
        resultados: { captacion: 25, cerrados: 10, facturacion: 28070, colaboraciones: 2, resenas: 12 },
        puntos: { captacion: 0.25, cerrados: 0.8, mn: 0.5, contabilidad: 0.8, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 0.8, limpieza: 0.25, actitud: 1 }
      },
      pedro: {
        resultados: {  },
        puntos: {  },
        total: 8.5
      },
      syuzanna: {
        resultados: { captacion: 24, cerrados: 5, facturacion: 19037, colaboraciones: 3, resenas: 12 },
        puntos: { captacion: 0.25, cerrados: 0.4, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 0.8, limpieza: 0.25, actitud: 1 },
        total: 10.02
      },
      victor: {
        resultados: { captacion: 17, cerrados: 7, facturacion: 17061, colaboraciones: 0, rrss: 1, resenas: 9 },
        puntos: { captacion: 0.25, cerrados: 0.8, mn: 0.5, contabilidad: 0.6, facturacion: 3.4, colaboraciones: 0, rrss: 1, resenas: 0.6, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-06': {
      alvaro: {
        resultados: { captacion: 8, cerrados: 1, facturacion: 1640, colaboraciones: 0 },
        puntos: { captacion: 0.25, cerrados: 0.25, mn: 1, contabilidad: 1, facturacion: 0.65, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      diego: {
        resultados: { colaboraciones: 1, 'captacion-rrss': 5, seguidores: 240, eventos: 0 },
        puntos: { contenidos: 2, colaboraciones: 0.25, branding: 0.25, 'captacion-rrss': 1, seguidores: 0.75, eventos: 0, merchandising: 0.75, proyectos: 0.25, resenas: 0.5, offline: 0, historias: 1, actitud: 1 }
      },
      lucas: {
        resultados: { captacion: 13, cerrados: 6, facturacion: 20973, colaboraciones: 2, resenas: 4 },
        puntos: { captacion: 0.22, cerrados: 0.9, mn: 0.5, contabilidad: 0.8, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 0.26, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 13, cerrados: 7, facturacion: 4270, colaboraciones: 0, resenas: 20 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.8, contabilidad: 0.3, facturacion: 1.7, colaboraciones: 0, rrss: 0.5, resenas: 1, limpieza: 0.25, actitud: 0.75 }
      },
      nacho: {
        resultados: { captacion: 20, cerrados: 14, facturacion: 37105, resenas: 5 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0, contabilidad: 0.5, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 0.33, limpieza: 0.25, actitud: 1 }
      },
      pedro: {
        resultados: {  },
        puntos: {  },
        total: 8.03
      },
      syuzanna: {
        resultados: { captacion: 33, cerrados: 11, facturacion: 27087, resenas: 2 },
        puntos: { captacion: 0.25, cerrados: 0.65, mn: 1, contabilidad: 0.8, facturacion: 4, colaboraciones: 0, rrss: 0.7, resenas: 0.13, limpieza: 0.25, actitud: 1 }
      },
      victor: {
        resultados: { captacion: 10, cerrados: 8, facturacion: 19280, colaboraciones: 1, resenas: 4 },
        puntos: { captacion: 0.16, cerrados: 0.77, mn: 0.5, contabilidad: 0.6, facturacion: 3.85, colaboraciones: 0.25, rrss: 0.8, resenas: 0.26, limpieza: 0.25, actitud: 0.5 },
        total: 7.69
      }
    },
    '2026-07': {
      adrian: {
        resultados: { captacion: 17, cerrados: 7, facturacion: 11003, colaboraciones: 0, resenas: 15 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.4, contabilidad: 0, facturacion: 2.93, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      alvaro: {
        resultados: { captacion: 18, cerrados: 6, facturacion: 20790 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 1, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      diego: {
        resultados: { colaboraciones: 2, 'captacion-rrss': 3, seguidores: 240, eventos: 0 },
        puntos: { contenidos: 2, colaboraciones: 0.5, branding: 0.5, 'captacion-rrss': 1, seguidores: 1, eventos: 0, merchandising: 0.75, proyectos: 0.5, resenas: 1, offline: 0, historias: 1, actitud: 1 }
      },
      lucas: {
        resultados: { captacion: 9, cerrados: 8, resenas: 11 },
        puntos: { captacion: 0.15, cerrados: 1, mn: 1, contabilidad: 0.4, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.73, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 21, cerrados: 7, facturacion: 11230, colaboraciones: 0, resenas: 21 },
        puntos: { captacion: 0.25, cerrados: 0.66, mn: 0, contabilidad: 1, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      nacho: {
        resultados: { captacion: 10, cerrados: 16, facturacion: 44000 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0, contabilidad: 0, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      syuzanna: {
        resultados: { captacion: 32, cerrados: 15, facturacion: 27522.3, colaboraciones: 0, resenas: 15 },
        puntos: { captacion: 0.25, cerrados: 0.94, mn: 0.8, contabilidad: 0.5, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      victor: {
        resultados: { captacion: 18, cerrados: 5, resenas: 11 },
        puntos: { captacion: 0.25, cerrados: 0.55, mn: 1, contabilidad: 0.3, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.73, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-08': {
      adrian: {
        resultados: { captacion: 14, cerrados: 5, facturacion: 4170, resenas: 22 },
        puntos: { captacion: 0.25, cerrados: 0.71, mn: 0.5, contabilidad: 0.5, facturacion: 1.11, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      alvaro: {
        resultados: { captacion: 16, cerrados: 4, facturacion: 6937, colaboraciones: 0, resenas: 21 },
        puntos: { captacion: 0.25, cerrados: 0.5, mn: 0, contabilidad: 0.5, facturacion: 1.63, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      diego: {
        resultados: {  },
        puntos: { contenidos: 2, colaboraciones: 0.15, branding: 0.5, 'captacion-rrss': 1, seguidores: 1, eventos: 0.5, merchandising: 0.5, proyectos: 0, resenas: 1, offline: 0.25, historias: 1, actitud: 1 }
      },
      dominique: {
        resultados: { captacion: 14, cerrados: 2, facturacion: 8886, colaboraciones: 0, resenas: 15 },
        puntos: { captacion: 0.23, cerrados: 0.28, mn: 0, contabilidad: 0.3, facturacion: 1.77, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      lucas: {
        resultados: { captacion: 11, cerrados: 3, facturacion: 18000, resenas: 3 },
        puntos: { captacion: 0.18, cerrados: 0.54, mn: 0, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.2, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 23, cerrados: 2, facturacion: 3940, resenas: 12 },
        puntos: { captacion: 0.25, cerrados: 0.17, mn: 0, contabilidad: 0, facturacion: 1.58, colaboraciones: 0, rrss: 1, resenas: 0.8, limpieza: 0.25, actitud: 1 }
      },
      nacho: {
        resultados: { captacion: 13, cerrados: 9, facturacion: 41500 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0, contabilidad: 0.5, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      syuzanna: {
        resultados: { captacion: 21, cerrados: 4, facturacion: 9070, resenas: 5 },
        puntos: { captacion: 0.25, cerrados: 0.38, mn: 0.5, contabilidad: 0.7, facturacion: 1.65, colaboraciones: 0, rrss: 1, resenas: 0.33, limpieza: 0.25, actitud: 1 }
      },
      victor: {
        resultados: { captacion: 10, cerrados: 4, mn: 0, contabilidad: 0.5, facturacion: 20400, colaboraciones: 0, resenas: 8, limpieza: 0.25, actitud: 1 },
        puntos: { captacion: 0.17, cerrados: 0.8, mn: 0, contabilidad: 0.5, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.53, limpieza: 0.25, actitud: 1 }
      }
    },
    '2026-09': {
      adrian: {
        resultados: { captacion: 11, cerrados: 6, facturacion: 12170 },
        puntos: { captacion: 0.18, cerrados: 1, mn: 0.3, contabilidad: 0.5, facturacion: 3.25, colaboraciones: 0, rrss: 1, resenas: 0.33, limpieza: 0.25, actitud: 1 }
      },
      alvaro: {
        resultados: { captacion: 11, cerrados: 4, facturacion: 9480, colaboraciones: 1, resenas: 8 },
        puntos: { captacion: 0.18, cerrados: 0.72, mn: 0.3, contabilidad: 0.8, facturacion: 2.23, colaboraciones: 0.25, rrss: 1, resenas: 0.53, limpieza: 0.25, actitud: 1 },
        total: 7.04
      },
      diego: {
        resultados: {  },
        puntos: { contenidos: 2, colaboraciones: 0.5, branding: 1, 'captacion-rrss': 1, seguidores: 0.75, eventos: 0.5, merchandising: 0.75, proyectos: 0.5, resenas: 1, offline: 0.25, historias: 1, actitud: 1 }
      },
      dominique: {
        resultados: { captacion: 10, cerrados: 7, facturacion: 18139, rrss: 1 },
        puntos: { captacion: 0.18, cerrados: 1, mn: 0, contabilidad: 0.5, facturacion: 3.23, colaboraciones: 0.25, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 }
      },
      ilyes: {
        resultados: {  },
        puntos: {  },
        total: 5
      },
      jonathan: {
        resultados: {  },
        puntos: {  },
        total: 4.92
      },
      lucas: {
        resultados: { captacion: 12, cerrados: 7, facturacion: 23000, colaboraciones: 1, resenas: 9 },
        puntos: { captacion: 0.18, cerrados: 1, mn: 1, contabilidad: 0.5, facturacion: 4, colaboraciones: 0.25, rrss: 1, resenas: 0.6, limpieza: 0.25, actitud: 1 }
      },
      mercedes: {
        resultados: { captacion: 15, cerrados: 9, facturacion: 11525, colaboraciones: 2 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.7, contabilidad: 1, facturacion: 4, colaboraciones: 0.5, rrss: 1, resenas: 1, limpieza: 0.25, actitud: 1 },
        total: 9.88
      },
      nacho: {
        resultados: { captacion: 23, cerrados: 9, facturacion: 31000, resenas: 5 },
        puntos: { captacion: 0.25, cerrados: 0.56, mn: 0.25, contabilidad: 0.5, facturacion: 2.48, colaboraciones: 0.5, rrss: 0.25, resenas: 0.33, limpieza: 0, actitud: 0 }
      },
      syuzanna: {
        resultados: { captacion: 25, cerrados: 15, resenas: 12 },
        puntos: { captacion: 0.25, cerrados: 1, mn: 0.75, contabilidad: 1, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 0.8, limpieza: 0.25, actitud: 1 },
        total: 9.85
      },
      victor: {
        resultados: { captacion: 14, cerrados: 0, facturacion: 20000, colaboraciones: 0, resenas: 15 },
        puntos: { captacion: 0.23, cerrados: 0, mn: 1, contabilidad: 0.5, facturacion: 4, colaboraciones: 0, rrss: 1, resenas: 1, limpieza: 0, actitud: 0 }
      }
    }
  }

};

export default OBJETIVOS;
