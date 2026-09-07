/* ===============================================================
   equipo.js - Vida interna del despacho
   ---------------------------------------------------------------
   Lo publica quien administra la plataforma (RRHH / Coordinacion).
   - empleadosDelMes: el mas reciente PRIMERO. El campo "mes" usa
     el formato AAAA-MM. Las iniciales se muestran como avatar.
   - tablon: anuncios internos, el mas reciente PRIMERO.
     "tipo" admite: evento | aviso | celebracion
   =============================================================== */

const EQUIPO = {

  empleadosDelMes: [
    // > [!PENDIENTE] Publicar el primer reconocimiento. Ejemplo:
    // {
    //   mes: '2026-09',
    //   nombre: 'Nombre Apellido',
    //   iniciales: 'NA',
    //   motivo: 'Por que se le reconoce este mes, en una o dos frases.'
    // }
  ],

  tablon: [
    // > [!PENDIENTE] Publicar el primer anuncio. Ejemplo:
    // {
    //   fecha: '2026-09-15',            // AAAA-MM-DD
    //   tipo: 'evento',                 // evento | aviso | celebracion
    //   titulo: 'Comida de equipo',
    //   md: 'Texto del anuncio en Markdown.'
    // }
  ]

};

export default EQUIPO;
