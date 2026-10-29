/* ===============================================================
   perfiles.js - Perfiles del equipo (foto, puesto, sede, frase…)
   ---------------------------------------------------------------
   Los perfiles los guarda el servidor en datos/perfiles.json y se
   cargan al arrancar. Aquí solo vive la copia en memoria que usan
   las vistas para pintar avatares y el directorio. La clave de cada
   perfil es la misma que en Conecta: el correo de Google o, sin
   Google, "nombre:<nombre>".
   =============================================================== */

const PERFILES_CACHE = {};

export function fijarPerfiles(lista) {
  Object.keys(PERFILES_CACHE).forEach((k) => { delete PERFILES_CACHE[k]; });
  Object.entries(lista || {}).forEach(([clave, perfil]) => {
    if (perfil && typeof perfil === 'object') PERFILES_CACHE[String(clave).toLowerCase()] = perfil;
  });
}

export function fijarPerfil(perfil) {
  if (perfil && perfil.clave) PERFILES_CACHE[String(perfil.clave).toLowerCase()] = perfil;
}

export function perfilDe(clave) {
  return PERFILES_CACHE[String(clave || '').toLowerCase()] || null;
}

export function todosLosPerfiles() {
  return Object.values(PERFILES_CACHE);
}

/* Sedes que puede elegir cada persona en su perfil. */
export const SEDES_PERFIL = [
  ['', 'Sin indicar'],
  ['madrid', 'Madrid'],
  ['alicante', 'Alicante'],
  ['valencia', 'Valencia'],
  ['marbella', 'Marbella'],
  ['londres', 'Londres'],
  ['latinoamerica', 'Latinoamérica']
];

export function nombreSede(id) {
  const sede = SEDES_PERFIL.find((s) => s[0] === id);
  return sede ? sede[1] : '';
}
