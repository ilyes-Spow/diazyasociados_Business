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
    {
      mes: '2026-08',
      nombre: 'Nacho',
      iniciales: 'NA',
      foto: '',
      motivo: 'Por su constancia y excelente actitud: compañerismo, proactividad y compromiso diario con el equipo. Gracias por su dedicación y por brindar siempre una atención excepcional a los clientes.'
    }
  ],

  tablon: [

  ],

  ranking: {
    actualizado: '2026-08-31',
    personas: [
      {
        nombre: 'Nacho',
        iniciales: 'NA',
        foto: '',
        puntos: 9.5
      },
      {
        nombre: 'Diego',
        iniciales: 'DI',
        foto: '',
        puntos: 8.9
      },
      {
        nombre: 'Victor',
        iniciales: 'VI',
        foto: '',
        puntos: 8.25
      },
      {
        nombre: 'Lucas',
        iniciales: 'LU',
        foto: '',
        puntos: 8.17
      },
      {
        nombre: 'Adrian',
        iniciales: 'AD',
        foto: '',
        puntos: 6.32
      },
      {
        nombre: 'Alvaro',
        iniciales: 'AL',
        foto: '',
        puntos: 6.13
      },
      {
        nombre: 'Syuzanna',
        iniciales: 'SY',
        foto: '',
        puntos: 6.06
      },
      {
        nombre: 'Mercedes',
        iniciales: 'ME',
        foto: '',
        puntos: 5.05
      }
    ]
  }

};

export default EQUIPO;
