/* ===============================================================
   clave.mjs - Calcula la huella de una clave de acceso
   ---------------------------------------------------------------
   Uso:  npm run clave -- "NuevaClave"

   Copia la huella resultante en la constante HUELLA_CLAVE de
   assets/js/app.js. Si además usas la puerta en servidor, pon la
   clave en claro en la variable SITE_PASSWORD de Netlify.
   =============================================================== */

import { createHash } from 'node:crypto';

const clave = process.argv[2];

if (!clave) {
  console.error('\n  Falta la clave.\n  Uso: npm run clave -- "NuevaClave"\n');
  process.exit(1);
}

const normalizada = clave.trim().toLowerCase();
const huella = createHash('sha256').update(normalizada).digest('hex');

console.log('');
console.log('  Clave      : ' + clave);
console.log('  Normalizada: ' + normalizada + '   (se admite en cualquier combinación de mayúsculas)');
console.log('  Huella     : ' + huella);
console.log('');
console.log('  1. Pega la huella en HUELLA_CLAVE, dentro de assets/js/app.js');
console.log('  2. Si usas la puerta en servidor, pon "' + clave + '" en SITE_PASSWORD (Netlify)');
console.log('');
