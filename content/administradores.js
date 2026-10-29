/* ===============================================================
   administradores.js - Quién administra la plataforma
   ---------------------------------------------------------------
   Se deriva de content/personas.js: son las personas activas con
   rol 'administracion'. Ven el acceso al panel desde el portal y
   pueden moderar Conecta (borrar cualquier publicación).

   No se edita a mano: cambia el rol de la persona en el panel
   (pestaña «Personas y accesos») o en personas.js.
   =============================================================== */

import personas from './personas.js';

const ADMINISTRADORES = personas
  .filter((p) => p.activo !== false && p.rol === 'administracion')
  .map((p) => String(p.correo || '').toLowerCase());

export default ADMINISTRADORES;
