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
  novedades:  PREFIJO + 'novedades.vistas',
  vistos:     PREFIJO + 'vistos',
  objetivos:  PREFIJO + 'objetivos',
  muroNombre: PREFIJO + 'muro.nombre',
  preferencias: PREFIJO + 'preferencias',
  progresoCopia: PREFIJO + 'progreso.copia'
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
  usuario() {
    const dato = leer(K.sesion, null);
    // Las sesiones de la antigua puerta con clave no llevaban correo:
    // se descartan para que todo el mundo pase por el acceso nuevo.
    if (!dato || !dato.desde || typeof dato.correo !== 'string') return null;
    if (Date.now() - dato.desde > DURACION_SESION) { this.cerrar(); return null; }
    return dato;
  },

  activa() {
    return this.usuario() !== null;
  },

  abrir(usuario) {
    escribir(K.sesion, {
      desde: Date.now(),
      correo: (usuario && usuario.correo) || '',
      nombre: (usuario && usuario.nombre) || ''
    });
  },

  /* Cambia el nombre que se muestra sin tocar la caducidad. */
  renombrar(nombre) {
    const actual = leer(K.sesion, null);
    if (!actual || !actual.desde) return;
    escribir(K.sesion, { ...actual, nombre: String(nombre || '').trim() });
  },

  cerrar() {
    borrar(K.sesion);
  }
};

/* ── Avisos vistos (tablón, empleado del mes, ...) ───────────── */
/* Guarda, por tipo de aviso, la marca (fecha o mes) más reciente
   que la persona ya ha visto. Sirve para el punto de la campana. */
export const vistos = {
  de(tipo) {
    return leer(K.vistos, {})[tipo] || '';
  },
  marcar(tipo, valor) {
    if (!valor) return;
    const v = leer(K.vistos, {});
    if (String(valor) > String(v[tipo] || '')) {
      v[tipo] = String(valor);
      escribir(K.vistos, v);
    }
  },
  hayNuevo(tipo, valor) {
    return Boolean(valor) && String(valor) > this.de(tipo);
  }
};

/* ── Identidad para el Muro ──────────────────────────────────── */
/* Con sesión de Google se usan su nombre y su correo. Sin ella
   (fase de desarrollo), el nombre se pide una vez y se recuerda. */
export const autorMuro = {
  de() {
    const u = sesion.usuario() || {};
    const nombre = (u.nombre || leer(K.muroNombre, '') || '').trim();
    if (!nombre) return null;
    const clave = u.correo
      ? u.correo.toLowerCase()
      : 'nombre:' + nombre.toLowerCase();
    return { nombre, clave };
  },
  guardarNombre(nombre) {
    escribir(K.muroNombre, String(nombre || '').trim());
  }
};

/* ── Objetivos del mes marcados como hechos ──────────────────── */
export const objetivosHechos = {
  todo() {
    const dato = leer(K.objetivos, {});
    return dato && typeof dato === 'object' ? dato : {};
  },
  hecho(id) {
    return Boolean(this.todo()[id]);
  },
  alternar(id) {
    const actual = this.todo();
    if (actual[id]) delete actual[id];
    else actual[id] = Date.now();
    escribir(K.objetivos, actual);
    return Boolean(actual[id]);
  }
};

/* ── Tema ────────────────────────────────────────────────────── */
export const tema = {
  actual() {
    const guardado = leer(K.tema, null);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;

    // Si el contenedor impone un tema (data-theme), se respeta.
    const anfitrion = document.documentElement.getAttribute('data-theme');
    if (anfitrion === 'dark') return 'oscuro';
    if (anfitrion === 'light') return 'claro';

    const prefiereOscuro = typeof matchMedia === 'function' &&
      matchMedia('(prefers-color-scheme: dark)').matches;
    return prefiereOscuro ? 'oscuro' : 'claro';
  },
  aplicar(valor) {
    document.documentElement.setAttribute('data-tema', valor);
    escribir(K.tema, valor);
  },
  /* Al arrancar: pinta el tema sin fijarlo, para que quien no haya
     elegido siga al sistema. */
  iniciar() {
    document.documentElement.setAttribute('data-tema', this.actual());
  },
  alternar() {
    const nuevo = this.actual() === 'oscuro' ? 'claro' : 'oscuro';
    this.aplicar(nuevo);
    return nuevo;
  },
  /* 'claro' | 'oscuro' si la persona lo fijó; null si sigue al sistema. */
  guardado() {
    const g = leer(K.tema, null);
    return g === 'claro' || g === 'oscuro' ? g : null;
  },
  /* Vuelve a seguir al sistema. */
  restablecer() {
    borrar(K.tema);
    document.documentElement.setAttribute('data-tema', this.actual());
  }
};

/* ── Preferencias de uso (viven en este navegador) ──────────── */
const PREFERENCIAS_DEFECTO = {
  movimiento: 'auto',     // 'auto' | 'menos'
  letra: 'normal',        // 'normal' | 'grande'
  avisos: { novedades: true, equipo: true, objetivos: true, modelos: true, conecta: true, actividad: true }
};

export const preferencias = {
  todas() {
    const d = leer(K.preferencias, {}) || {};
    return {
      ...PREFERENCIAS_DEFECTO,
      ...d,
      avisos: { ...PREFERENCIAS_DEFECTO.avisos, ...(d.avisos || {}) }
    };
  },
  /* fijar('letra', 'grande') o fijar('avisos.conecta', false) */
  fijar(nombre, valor) {
    const p = this.todas();
    if (nombre.startsWith('avisos.')) p.avisos[nombre.slice(7)] = Boolean(valor);
    else p[nombre] = valor;
    escribir(K.preferencias, p);
    this.aplicar();
    return p;
  },
  aplicar() {
    const p = this.todas();
    const raiz = document.documentElement;
    raiz.setAttribute('data-letra', p.letra);
    raiz.classList.toggle('menos-movimiento', p.movimiento === 'menos');
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

  /* Antes de borrar se guarda una copia para poder deshacerlo. */
  reiniciar() {
    const actual = this.todo();
    if (Object.keys(actual).length) escribir(K.progresoCopia, { fecha: Date.now(), marcas: actual });
    borrar(K.progreso);
  },

  hayCopiaReinicio() {
    const copia = leer(K.progresoCopia, null);
    return Boolean(copia && copia.marcas && Object.keys(copia.marcas).length);
  },

  /* Recupera el progreso del último reinicio. Devuelve cuántas
     lecciones se han recuperado. */
  deshacerReinicio() {
    const copia = leer(K.progresoCopia, null);
    if (!copia || !copia.marcas) return 0;
    const recuperadas = this.importar(copia.marcas);
    borrar(K.progresoCopia);
    return recuperadas;
  },

  /* Restaura una copia exportada desde «Mi perfil»; se suma a lo
     que ya hubiera. Devuelve cuántas marcas se han añadido. */
  importar(datos) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return 0;
    const actual = this.todo();
    let nuevas = 0;
    for (const [clave, valor] of Object.entries(datos)) {
      if (typeof clave !== 'string' || !clave.includes('/')) continue;
      const marca = Number(valor) || Date.now();
      if (!actual[clave]) nuevas++;
      actual[clave] = marca;
    }
    escribir(K.progreso, actual);
    return nuevas;
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
