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
      foto: 'assets/img/equipo/nacho.jpg',
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
        foto: 'assets/img/equipo/nacho.jpg',
        puntos: 9.5
      },
      {
        nombre: 'Diego',
        iniciales: 'DI',
        foto: 'assets/img/equipo/diego.jpg',
        puntos: 8.9
      },
      {
        nombre: 'Victor',
        iniciales: 'VI',
        foto: 'assets/img/equipo/victor.jpg',
        puntos: 8.25
      },
      {
        nombre: 'Lucas',
        iniciales: 'LU',
        foto: 'assets/img/equipo/lucas.jpg',
        puntos: 8.17
      },
      {
        nombre: 'Adrian',
        iniciales: 'AD',
        foto: 'assets/img/equipo/adrian.jpg',
        puntos: 6.32
      },
      {
        nombre: 'Alvaro',
        iniciales: 'AL',
        foto: 'assets/img/equipo/alvaro.jpg',
        puntos: 6.13
      },
      {
        nombre: 'Syuzanna',
        iniciales: 'SY',
        foto: 'assets/img/equipo/syuzanna.jpg',
        puntos: 6.06
      },
      {
        nombre: 'Mercedes',
        iniciales: 'ME',
        foto: 'assets/img/equipo/mercedes.jpg',
        puntos: 5.05
      }
    ]
  }

};

export default EQUIPO;
