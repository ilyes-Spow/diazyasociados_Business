/* ===============================================================
   equipo.js - Vida interna del despacho
   ---------------------------------------------------------------
   Este archivo lo mantiene el panel de administración
   (npm run admin), pero puede editarse a mano sin problema.
   - empleadosDelMes: el más reciente PRIMERO (mes en AAAA-MM).
   - tablon: anuncios internos, el más reciente PRIMERO.
     tipo: 'evento' | 'aviso' | 'celebracion'
   - ranking: clasificación que publica RRHH periódicamente.
   =============================================================== */

const EQUIPO = {

  empleadosDelMes: [

  ],

  tablon: [

  ],

  ranking: {
    actualizado: '',
    personas: [

    ]
  }

};

export default EQUIPO;
