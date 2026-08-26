/* ===============================================================
   estado.js - Persistencia local: sesión, tema y progreso
   ---------------------------------------------------------------
   Todo se guarda en el navegador de cada persona. Nada viaja a
   ningún servidor: el progreso es individual y privado.
   =============================================================== */

const PREFIJO = 'dya.formacion.';
const K = {
  sesion:     PREFIJO + 'sesion',
  tema:       PREFIJO + 'tema',
  progreso:   PREFIJO + 'progreso',
  novedades:  PREFIJO + 'novedades.vistas'
};

/* Lectura y escritura tolerantes a fallos (modo privado, cookies
   bloqueadas, almacenamiento lleno). */
function leer(clave, porDefecto) {
  try {
    const bruto = localStorage.getItem(clave);
    return bruto === null ? porDefecto : JSON.parse(bruto);
  } catch (e) {
    return porDefecto;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

function borrar(clave) {
  try { localStorage.removeItem(clave); sessionStorage.removeItem(clave); } catch (e) { /* nada */ }
}

/* ── Sesión ──────────────────────────────────────────────────── */
const DURACION_SESION = 30 * 24 * 60 * 60 * 1000; // 30 días

export const sesion = {
  activa() {
    // Una cookie puesta por la función de borde (si está configurada)
    // vale como sesión ya validada en el servidor.
    if (typeof document !== 'undefined' && /(?:^|;\s*)dya_gate=ok/.test(document.cookie)) return true;

    let dato = leer(K.sesion, null);
    if (!dato) {
      try {
        const bruto = sessionStorage.getItem(K.sesion);
        dato = bruto ? JSON.parse(bruto) : null;
      } catch (e) { dato = null; }
    }
    if (!dato || !dato.desde) return false;
    if (Date.now() - dato.desde > DURACION_SESION) { this.cerrar(); return false; }
    return true;
  },

  abrir(recordar) {
    const dato = { desde: Date.now() };
    if (recordar) {
      escribir(K.sesion, dato);
    } else {
      try { sessionStorage.setItem(K.sesion, JSON.stringify(dato)); } catch (e) { /* nada */ }
    }
  },

  cerrar() {
    borrar(K.sesion);
    try {
      document.cookie = 'dya_gate=; Max-Age=0; path=/; SameSite=Lax';
    } catch (e) { /* nada */ }
  }
};

/* ── Tema ────────────────────────────────────────────────────── */
export const tema = {
  actual() {
    const guardado = leer(K.tema, null);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    const prefiereOscuro = typeof matchMedia === 'function' &&
      matchMedia('(prefers-color-scheme: dark)').matches;
    return prefiereOscuro ? 'oscuro' : 'claro';
  },
  aplicar(valor) {
    document.documentElement.setAttribute('data-tema', valor);
    escribir(K.tema, valor);
  },
  alternar() {
    const nuevo = this.actual() === 'oscuro' ? 'claro' : 'oscuro';
    this.aplicar(nuevo);
    return nuevo;
  }
};

/* ── Progreso ────────────────────────────────────────────────── */
/* Estructura: { "moduloId/leccionId": timestamp } */
export const progreso = {
  todo() {
    const dato = leer(K.progreso, {});
    return (dato && typeof dato === 'object' && !Array.isArray(dato)) ? dato : {};
  },

  hecha(clave) {
    return Boolean(this.todo()[clave]);
  },

  marcar(clave, valor) {
    const actual = this.todo();
    if (valor === false) delete actual[clave];
    else actual[clave] = Date.now();
    escribir(K.progreso, actual);
    return Boolean(actual[clave]);
  },

  alternar(clave) {
    return this.marcar(clave, !this.hecha(clave));
  },

  /* Cuántas lecciones de una lista están completadas. */
  contar(claves) {
    const actual = this.todo();
    return claves.reduce((n, c) => n + (actual[c] ? 1 : 0), 0);
  },

  reiniciar() {
    borrar(K.progreso);
  }
};

/* ── Novedades vistas ────────────────────────────────────────── */
export const novedadesVistas = {
  ultima() {
    return leer(K.novedades, null);
  },
  marcarVistas(fechaMasReciente) {
    escribir(K.novedades, fechaMasReciente);
  },
  hayNuevas(fechaMasReciente) {
    if (!fechaMasReciente) return false;
    const vista = this.ultima();
    return vista !== fechaMasReciente;
  }
};

/* Aviso si el almacenamiento no está disponible (navegación privada). */
export function almacenamientoDisponible() {
  try {
    const prueba = PREFIJO + 'prueba';
    localStorage.setItem(prueba, '1');
    localStorage.removeItem(prueba);
    return true;
  } catch (e) {
    return false;
  }
}
