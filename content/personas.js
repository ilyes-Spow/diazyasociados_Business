/* ===============================================================
   personas.js - Equipo del despacho y accesos a la plataforma
   ---------------------------------------------------------------
   Este archivo lo mantiene el panel de administración
   (npm run admin, pestaña «Personas y accesos»), pero puede
   editarse a mano sin problema.

   - correo: la cuenta de Google con la que entra la persona.
   - rol: 'administracion' (ve el panel y modera Conecta)
          o 'equipo' (portal completo).
   - activo: con false la persona deja de poder entrar cuando el
     acceso con Google esté activo, sin borrar sus datos.
   - puesto y foto son opcionales; la foto sale de assets/img/equipo/.

   Mientras la lista esté vacía se admite cualquier cuenta.
   =============================================================== */

const PERSONAS = [
  {
    correo: 'adrianmerchan@diazyasociados.es',
    nombre: 'Adrian Merchan',
    puesto: '',
    foto: 'assets/img/equipo/adrian.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'alvarovergara@diazyasociados.es',
    nombre: 'Alvaro Vergara',
    puesto: '',
    foto: 'assets/img/equipo/alvaro.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'carmencarruego@diazyasociados.es',
    nombre: 'Carmen Carruego',
    puesto: '',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'contacto@diazyasociados.es',
    nombre: 'Contacto general',
    puesto: 'Buzón compartido',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'diegoescarpizo@diazyasociados.es',
    nombre: 'Diego Escarpizo',
    puesto: '',
    foto: 'assets/img/equipo/diego.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'oficinamexico@diazyasociados.es',
    nombre: 'Dominique',
    puesto: '',
    foto: 'assets/img/equipo/dominique.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'ignaciodiaz@diazyasociados.es',
    nombre: 'Ignacio Diaz',
    puesto: '',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'ilyes@diazyasociados.es',
    nombre: 'Ilyes Taleb',
    puesto: '',
    foto: 'assets/img/equipo/ilyes.jpg',
    rol: 'administracion',
    activo: true
  },
  {
    correo: 'oficinamedellin@diazyasociados.es',
    nombre: 'Karol Garcia',
    puesto: '',
    foto: 'assets/img/equipo/karol.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'lucasvillanueva@diazyasociados.es',
    nombre: 'Lucas Villanueva',
    puesto: '',
    foto: 'assets/img/equipo/lucas.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'lucianadiaz@diazyasociados.es',
    nombre: 'Luciana Diaz',
    puesto: '',
    foto: 'assets/img/equipo/luciana.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'mariamolinero@diazyasociados.es',
    nombre: 'Maria Molinero',
    puesto: '',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'mercedes@diazyasociados.es',
    nombre: 'Mercedes Caviglia',
    puesto: '',
    foto: 'assets/img/equipo/mercedes.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'nacho@diazyasociados.es',
    nombre: 'Nacho Sanchez',
    puesto: '',
    foto: 'assets/img/equipo/nacho.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'oficinamadrid@diazyasociados.es',
    nombre: 'Nico Spinoso',
    puesto: '',
    foto: 'assets/img/equipo/nico.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'oficinabogota@diazyasociados.es',
    nombre: 'Oficina de Bogotá',
    puesto: 'Buzón de oficina',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'oficinabsas@diazyasociados.es',
    nombre: 'Oficina de Buenos Aires',
    puesto: 'Buzón de oficina',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'london@diazyasociados.es',
    nombre: 'Oficina de Londres',
    puesto: 'Buzón de oficina',
    foto: '',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'syuzanna@diazyasociados.es',
    nombre: 'Syuzanna Shahnazaryan',
    puesto: '',
    foto: 'assets/img/equipo/syuzanna.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'victorarrieta@diazyasociados.es',
    nombre: 'Victor Arrieta',
    puesto: '',
    foto: 'assets/img/equipo/victor.jpg',
    rol: 'equipo',
    activo: true
  },
  {
    correo: 'yuyan@diazyasociados.es',
    nombre: 'Yuyan Yang',
    puesto: '',
    foto: '',
    rol: 'equipo',
    activo: true
  }
];

export default PERSONAS;
