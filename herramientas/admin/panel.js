/* ===============================================================
   panel.js - Lógica del panel de administración
   ---------------------------------------------------------------
   Trabaja sobre una copia en memoria de los contenidos. Nada se
   escribe en disco hasta que se pulsa "Guardar cambios".
   =============================================================== */

import { render } from '/assets/js/markdown.js';

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => Array.from(raiz.querySelectorAll(s));

/* ── Estado ──────────────────────────────────────────────────── */
let datos = null;      // { version, grupos, modulos, novedades }
let original = '';     // instantánea para detectar cambios
let vista = 'modulos';
let abierto = null;    // identificador del elemento en edición
let videos = [];
let modelos = [];
let fotos = [];

const sucio = () => datos && JSON.stringify(datos) !== original;

function marcarCambios() {
  const hay = sucio();
  $('#estado-cambios').hidden = !hay;
  $('#btn-descartar').hidden = !hay;
  $('#btn-guardar').disabled = !hay;
}

/* ── Utilidades ──────────────────────────────────────────────── */
const esc = (t) => String(t ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function identificador(texto) {
  return String(texto).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'sin-titulo';
}

function idUnico(base, usados) {
  let id = base, n = 2;
  while (usados.includes(id)) id = base + '-' + n++;
  return id;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const fechaLarga = (iso) => {
  const [a, m, d] = String(iso).split('-');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return Number(d) + ' de ' + (meses[Number(m) - 1] || m) + ' de ' + a;
};

const tamano = (bytes) => bytes > 1048576
  ? (bytes / 1048576).toFixed(1) + ' MB'
  : Math.round(bytes / 1024) + ' KB';

let tempAviso = null;
function avisar(mensaje, tipo = '') {
  const el = $('#aviso');
  el.textContent = mensaje;
  el.className = 'aviso' + (tipo ? ' aviso--' + tipo : '');
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('aviso--visible'));
  clearTimeout(tempAviso);
  tempAviso = setTimeout(() => {
    el.classList.remove('aviso--visible');
    setTimeout(() => { el.hidden = true; }, 280);
  }, tipo === 'error' ? 6000 : 2800);
}

function confirmar(titulo, texto) {
  return new Promise((resolver) => {
    const dlg = $('#dialogo');
    $('#dialogo-tit').textContent = titulo;
    $('#dialogo-cuerpo').innerHTML = '<p>' + esc(texto) + '</p>';
    const si = $('#dialogo-si'), no = $('#dialogo-no');
    const cerrar = (valor) => {
      dlg.close();
      si.removeEventListener('click', aceptar);
      no.removeEventListener('click', rechazar);
      resolver(valor);
    };
    const aceptar = () => cerrar(true);
    const rechazar = () => cerrar(false);
    si.addEventListener('click', aceptar);
    no.addEventListener('click', rechazar);
    dlg.showModal();
  });
}

/* ── Carga y guardado ────────────────────────────────────────── */
async function cargar() {
  const respuesta = await fetch('/api/estado');
  const cuerpo = await respuesta.json();
  videos = cuerpo.videos || [];
  modelos = cuerpo.modelos || [];
  fotos = cuerpo.fotos || [];
  datos = {
    version: cuerpo.version,
    grupos: cuerpo.grupos,
    modulos: cuerpo.modulos,
    novedades: cuerpo.novedades,
    equipo: cuerpo.equipo || { empleadosDelMes: [], tablon: [], ranking: { actualizado: '', personas: [] } },
    objetivos: cuerpo.objetivos || {}
  };
  original = JSON.stringify(datos);

  const git = cuerpo.git || {};
  $('#estado-git').textContent = git.disponible
    ? git.rama + (git.pendientes ? ' · ' + git.pendientes + ' sin confirmar' : '')
    : '';
  marcarCambios();
  pintar();
}

async function guardar() {
  const boton = $('#btn-guardar');
  boton.disabled = true;
  boton.textContent = 'Guardando…';

  try {
    const respuesta = await fetch('/api/guardar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();

    if (!resultado.ok) {
      pintar(resultado.fallos);
      avisar('No se ha guardado: revisa los avisos.', 'error');
      return;
    }
    avisar('Contenidos guardados en content/', 'ok');
    await cargar();
  } catch (e) {
    avisar('Error de conexión con el panel: ' + e.message, 'error');
  } finally {
    boton.textContent = 'Guardar cambios';
    marcarCambios();
  }
}

/* ── Pintado ─────────────────────────────────────────────────── */
function pintar(errores) {
  const lienzo = $('#lienzo');
  const aviso = errores && errores.length
    ? '<div class="errores"><strong>No se ha podido guardar:</strong><ul>' +
      errores.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul></div>'
    : '';

  const vistas = {
    modulos: vistaModulos,
    novedades: vistaNovedades,
    videos: vistaVideos,
    modelos: vistaModelosPanel,
    equipo: vistaEquipoPanel,
    objetivos: vistaObjetivosPanel,
    grupos: vistaGrupos,
    ayuda: vistaAyuda
  };
  lienzo.innerHTML = aviso + vistas[vista]();
  $$('.pestana').forEach((p) => p.classList.toggle('pestana--activa', p.dataset.vista === vista));
  refrescarVistasPrevias();
}

function refrescarVistasPrevias() {
  $$('[data-vista-previa]').forEach((caja) => {
    const area = $('#' + caja.dataset.vistaPrevia);
    if (area) caja.innerHTML = render(area.value);
  });
}

/* ── Vista: módulos ──────────────────────────────────────────── */
function vistaModulos() {
  if (abierto && abierto.tipo === 'modulo') return editorModulo();

  const bloques = datos.grupos.map((g) => {
    const mods = datos.modulos.filter((m) => m.grupo === g.id);
    const filas = mods.length ? mods.map((mod) => {
      const i = datos.modulos.indexOf(mod);
      const primero = mods[0] === mod;
      const ultimo = mods[mods.length - 1] === mod;
      return `
        <div class="fila">
          <span class="fila__n">${mod.num}</span>
          <div class="fila__txt">
            <div class="fila__tit">${esc(mod.titulo)}</div>
            <div class="fila__sub">${mod.lecciones.length} ${mod.lecciones.length === 1 ? 'lección' : 'lecciones'} · ${mod.duracion} min · ${esc(mod.resumen)}</div>
          </div>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--icono" data-mover="${i}" data-paso="-1" ${primero ? 'disabled' : ''} title="Subir">&uarr;</button>
            <button class="btn btn--sutil btn--icono" data-mover="${i}" data-paso="1" ${ultimo ? 'disabled' : ''} title="Bajar">&darr;</button>
            <button class="btn btn--secundario btn--pequeno" data-editar-modulo="${esc(mod.id)}">Editar</button>
            <button class="btn btn--sutil btn--pequeno" data-borrar-modulo="${esc(mod.id)}">Borrar</button>
          </div>
        </div>`;
    }).join('') : '<div class="vacio">Este grupo todavía no tiene módulos.</div>';

    return `<section class="grupo-bloque">
        <h2 class="grupo-bloque__tit"><i></i>${esc(g.titulo)}</h2>
        ${filas}
      </section>`;
  }).join('');

  const totalLecciones = datos.modulos.reduce((n, m) => n + m.lecciones.length, 0);

  return `
    <div class="cab">
      <div>
        <h1>Módulos</h1>
        <p>${datos.modulos.length} módulos y ${totalLecciones} lecciones. El orden dentro de cada grupo define el itinerario; la numeración se recalcula sola al guardar.</p>
      </div>
      <button class="btn btn--primario" data-nuevo-modulo>Nuevo módulo</button>
    </div>
    ${bloques}`;
}

function editorModulo() {
  const mod = datos.modulos.find((m) => m.id === abierto.id);
  if (!mod) { abierto = null; return vistaModulos(); }

  const opciones = datos.grupos.map((g) =>
    `<option value="${esc(g.id)}" ${g.id === mod.grupo ? 'selected' : ''}>${esc(g.titulo)}</option>`).join('');

  const etiquetas = (mod.etiquetas || []).map((e, i) =>
    `<span class="pastilla${e === 'obligatorio' ? ' pastilla--oro' : ''}">${esc(e)}<button data-quitar-etiqueta="${i}" title="Quitar">&times;</button></span>`).join('');

  const lecciones = mod.lecciones.map((lec, i) => {
    const abiertaAhora = abierto.leccion === lec.id;
    return `
      <div class="leccion-caja">
        <div class="leccion-caja__cab">
          <span class="fila__n">${i + 1}</span>
          <span class="fila__tit">${esc(lec.titulo)}</span>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--icono" data-mover-leccion="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
            <button class="btn btn--sutil btn--icono" data-mover-leccion="${i}" data-paso="1" ${i === mod.lecciones.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
            <button class="btn btn--secundario btn--pequeno" data-abrir-leccion="${esc(lec.id)}">${abiertaAhora ? 'Cerrar' : 'Editar'}</button>
            <button class="btn btn--sutil btn--pequeno" data-borrar-leccion="${esc(lec.id)}">Borrar</button>
          </div>
        </div>
        ${abiertaAhora ? `
        <div class="leccion-caja__cuerpo">
          <div class="rejilla rejilla--2" style="margin-bottom:1rem">
            <label class="campo"><span>Título de la lección</span>
              <input type="text" data-leccion-campo="titulo" data-leccion-id="${esc(lec.id)}" value="${esc(lec.titulo)}"></label>
            <label class="campo"><span>Identificador <small>(se usa en el enlace)</small></span>
              <input type="text" value="${esc(lec.id)}" readonly></label>
          </div>
          <div class="editor">
            <div>
              <div class="editor__rotulo"><span>Contenido</span><span style="font-weight:400;color:var(--tinta-3)">Markdown</span></div>
              <div class="herramientas-md">
                <button class="btn btn--sutil btn--pequeno" data-insertar="## Título" data-destino="md-${esc(lec.id)}">Encabezado</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="- [ ] Punto a comprobar" data-destino="md-${esc(lec.id)}">Casilla</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="| Columna | Columna |&#10;|---|---|&#10;| Dato | Dato |" data-destino="md-${esc(lec.id)}">Tabla</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar="> [!AVISO] Texto del aviso." data-destino="md-${esc(lec.id)}">Llamada</button>
                <button class="btn btn--sutil btn--pequeno" data-insertar-video="md-${esc(lec.id)}">Vídeo</button>
              </div>
              <textarea id="md-${esc(lec.id)}" data-leccion-campo="md" data-leccion-id="${esc(lec.id)}" spellcheck="true">${esc(lec.md)}</textarea>
            </div>
            <div>
              <div class="editor__rotulo"><span>Vista previa</span></div>
              <div class="editor__vista prosa" data-vista-previa="md-${esc(lec.id)}"></div>
            </div>
          </div>
        </div>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="cab">
      <div>
        <h1>${esc(mod.titulo)}</h1>
        <p>Módulo ${mod.num} · ${esc((datos.grupos.find((g) => g.id === mod.grupo) || {}).titulo || '')}</p>
      </div>
      <button class="btn btn--secundario" data-cerrar-modulo>Volver a la lista</button>
    </div>

    <div class="tarjeta">
      <h2>Datos del módulo</h2>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Título</span>
          <input type="text" data-modulo-campo="titulo" value="${esc(mod.titulo)}"></label>
        <label class="campo"><span>Identificador <small>(se usa en el enlace; no se cambia)</small></span>
          <input type="text" value="${esc(mod.id)}" readonly></label>
      </div>
      <div class="rejilla rejilla--2" style="margin-top:.95rem">
        <label class="campo"><span>Resumen <small>Una frase; aparece en la portada y en el buscador.</small></span>
          <input type="text" data-modulo-campo="resumen" value="${esc(mod.resumen)}"></label>
        <div class="rejilla rejilla--2">
          <label class="campo"><span>Grupo</span>
            <select data-modulo-campo="grupo">${opciones}</select></label>
          <label class="campo"><span>Duración (min)</span>
            <input type="number" min="1" max="600" data-modulo-campo="duracion" value="${mod.duracion}"></label>
        </div>
      </div>
      <div class="campo" style="margin-top:.95rem">
        <span>Etiquetas <small>"obligatorio" resalta el módulo en la portada.</small></span>
        <div class="pastillas">
          ${etiquetas}
          <button class="btn btn--sutil btn--pequeno" data-anadir-etiqueta>+ Añadir</button>
        </div>
      </div>
    </div>

    <div class="cab" style="margin-top:1.8rem">
      <div><h1 style="font-size:1.2rem">Lecciones</h1></div>
      <button class="btn btn--primario" data-nueva-leccion>Nueva lección</button>
    </div>
    ${lecciones || '<div class="vacio">Este módulo aún no tiene lecciones. Añade la primera.</div>'}`;
}

/* ── Vista: novedades ────────────────────────────────────────── */
function vistaNovedades() {
  if (abierto && abierto.tipo === 'novedad') return editorNovedad();

  const filas = datos.novedades.length ? datos.novedades.map((nov, i) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="fila__tit">${esc(nov.titulo)}</div>
        <div class="fila__sub">${fechaLarga(nov.fecha)}</div>
      </div>
      <span class="pastilla pastilla--${esc(nov.nivel)}">${esc(nov.nivel)}</span>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--icono" data-mover-novedad="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
        <button class="btn btn--sutil btn--icono" data-mover-novedad="${i}" data-paso="1" ${i === datos.novedades.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
        <button class="btn btn--secundario btn--pequeno" data-editar-novedad="${i}">Editar</button>
        <button class="btn btn--sutil btn--pequeno" data-borrar-novedad="${i}">Borrar</button>
      </div>
    </div>`).join('') : '<div class="vacio">Todavía no hay novedades publicadas.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Novedades</h1>
        <p>Cambios de herramientas, procedimientos y normativa. La primera de la lista es la que se destaca en la portada y la que marca el aviso de novedad sin leer.</p>
      </div>
      <button class="btn btn--primario" data-nueva-novedad>Nueva novedad</button>
    </div>
    ${filas}`;
}

function editorNovedad() {
  const nov = datos.novedades[abierto.indice];
  if (!nov) { abierto = null; return vistaNovedades(); }

  const niveles = [
    ['critica', 'Crítica · afecta a plazos, cumplimiento o seguridad'],
    ['importante', 'Importante · cambia un procedimiento habitual'],
    ['informativa', 'Informativa · conviene saberlo']
  ].map(([v, t]) => `<option value="${v}" ${nov.nivel === v ? 'selected' : ''}>${esc(t)}</option>`).join('');

  const etiquetas = (nov.etiquetas || []).map((e, i) =>
    `<span class="pastilla">${esc(e)}<button data-quitar-etiqueta-nov="${i}" title="Quitar">&times;</button></span>`).join('');

  return `
    <div class="cab">
      <div><h1>${nov.titulo ? esc(nov.titulo) : 'Nueva novedad'}</h1></div>
      <button class="btn btn--secundario" data-cerrar-novedad>Volver a la lista</button>
    </div>

    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Fecha</span>
          <input type="date" data-novedad-campo="fecha" value="${esc(nov.fecha)}"></label>
        <label class="campo"><span>Nivel</span>
          <select data-novedad-campo="nivel">${niveles}</select></label>
        <div class="campo"><span>Etiquetas</span>
          <div class="pastillas">${etiquetas}
            <button class="btn btn--sutil btn--pequeno" data-anadir-etiqueta-nov>+ Añadir</button>
          </div>
        </div>
      </div>
      <label class="campo" style="margin-top:.95rem"><span>Título</span>
        <input type="text" data-novedad-campo="titulo" value="${esc(nov.titulo)}" placeholder="Qué ha cambiado, en una frase"></label>
    </div>

    <div class="tarjeta">
      <div class="editor">
        <div>
          <div class="editor__rotulo"><span>Contenido</span><span style="font-weight:400;color:var(--tinta-3)">Markdown</span></div>
          <div class="herramientas-md">
            <button class="btn btn--sutil btn--pequeno" data-insertar="**Qué tienes que hacer:**" data-destino="md-novedad">Negrita</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar="- Punto" data-destino="md-novedad">Lista</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar="> [!AVISO] Texto del aviso." data-destino="md-novedad">Llamada</button>
            <button class="btn btn--sutil btn--pequeno" data-insertar-video="md-novedad">Vídeo</button>
          </div>
          <textarea id="md-novedad" data-novedad-campo="md" spellcheck="true">${esc(nov.md)}</textarea>
        </div>
        <div>
          <div class="editor__rotulo"><span>Vista previa</span></div>
          <div class="editor__vista prosa" data-vista-previa="md-novedad"></div>
        </div>
      </div>
    </div>`;
}

/* ── Vista: vídeos ───────────────────────────────────────────── */
function vistaVideos() {
  const filas = videos.length ? videos.map((v) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="fila__tit">${esc(v.nombre)}</div>
        <div class="fila__sub">${esc(v.ruta)} · ${tamano(v.bytes)}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--secundario btn--pequeno" data-copiar-video="${esc(v.ruta)}">Copiar bloque</button>
        <button class="btn btn--sutil btn--pequeno" data-borrar-video="${esc(v.nombre)}">Borrar</button>
      </div>
    </div>`).join('') : '<div class="vacio">No hay vídeos subidos. Las sesiones largas conviene alojarlas en YouTube o Vimeo.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Vídeos</h1>
        <p>Clips cortos alojados junto al sitio, y sesiones largas en YouTube o Vimeo. En ambos casos el reproductor solo se carga cuando alguien pulsa.</p>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Enlazar un vídeo de YouTube, Vimeo o Loom</h2>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Dirección del vídeo</span>
          <input type="url" id="video-url" placeholder="https://www.youtube.com/watch?v=..."></label>
        <label class="campo"><span>Título</span>
          <input type="text" id="video-titulo" placeholder="Sesión sobre gestión de plazos"></label>
      </div>
      <div style="margin-top:.9rem"><button class="btn btn--primario" data-generar-bloque>Generar el bloque</button></div>
      <div id="video-salida" style="margin-top:.9rem"></div>
      <div class="llamada llamada--aviso" style="margin-top:1rem">
        <svg class="llamada__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/></svg>
        <div class="llamada__txt"><span class="llamada__tit">Atención</span>
          <p>Sube las grabaciones internas como <strong>no listadas</strong> en YouTube o con contraseña en Vimeo. Nunca públicas: pueden contener referencias a asuntos.</p>
        </div>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Subir un vídeo propio</h2>
      <p style="margin:0 0 .9rem;color:var(--tinta-3);font-size:.87rem">
        Se guarda en <code>assets/video/</code> y se publica con el sitio. Adecuado para clips
        de pocos minutos: los archivos grandes encarecen el alojamiento y tardan en cargar.
        Máximo 200 MB por archivo.
      </p>
      <input type="file" id="video-archivo" accept="video/mp4,video/webm,video/ogg">
      <div id="video-progreso" style="margin-top:.7rem;color:var(--tinta-3);font-size:.85rem"></div>
    </div>

    <div class="cab" style="margin-top:1.8rem"><div><h1 style="font-size:1.2rem">Vídeos subidos</h1></div></div>
    ${filas}`;
}

/* ── Vista: modelos de documentos ────────────────────────────── */
function vistaModelosPanel() {
  const filas = modelos.length ? modelos.map((m) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="fila__tit">${esc(m.titulo)} <span style="color:var(--tinta-3);font-weight:400">· ${esc(m.categoria)}</span></div>
        <div class="fila__sub">${esc(m.archivo)} · ${tamano(m.bytes)}${m.descripcion ? ' · ' + esc(m.descripcion) : ''}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--secundario btn--pequeno" data-datos-modelo="${esc(m.archivo)}">Datos</button>
        <button class="btn btn--sutil btn--pequeno" data-borrar-modelo="${esc(m.archivo.split('/').pop())}">Borrar</button>
      </div>
    </div>`).join('') : '<div class="vacio">No hay modelos subidos todavía.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Modelos de documentos</h1>
        <p>Plantillas y escritos que el equipo descarga desde la sección Modelos de la plataforma. Al subir o borrar, el registro se actualiza solo; con «Datos» ajustas el título, la categoría y la descripción.</p>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Subir un modelo</h2>
      <p style="margin:0 0 .9rem;color:var(--tinta-3);font-size:.87rem">
        Se guarda en <code>assets/modelos/</code> y aparece al momento en la plataforma.
        Admite PDF, Word, Excel, PowerPoint, OpenDocument, RTF y TXT. Máximo 25 MB.
        <strong>Sube solo plantillas vacías, nunca documentos con datos de clientes.</strong>
      </p>
      <input type="file" id="modelo-archivo" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt">
      <div id="modelo-progreso" style="margin-top:.7rem;color:var(--tinta-3);font-size:.85rem"></div>
    </div>

    <div class="cab" style="margin-top:1.8rem"><div><h1 style="font-size:1.2rem">Modelos publicados</h1></div></div>
    ${filas}`;
}

/* ── Vista: equipo (empleado del mes, tablón, ranking, fotos) ── */
function opcionesFoto(seleccionada) {
  return '<option value="">Sin foto (iniciales)</option>' +
    fotos.map((f) =>
      `<option value="${esc(f.ruta)}"${f.ruta === seleccionada ? ' selected' : ''}>${esc(f.nombre)}</option>`
    ).join('');
}

function vistaEquipoPanel() {
  const eq = datos.equipo;

  const edm = eq.empleadosDelMes.map((p, i) => `
    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Mes</span>
          <input type="month" value="${esc(p.mes)}" data-edm-campo="mes" data-edm-indice="${i}"></label>
        <label class="campo"><span>Nombre</span>
          <input type="text" value="${esc(p.nombre)}" data-edm-campo="nombre" data-edm-indice="${i}"></label>
        <label class="campo"><span>Iniciales</span>
          <input type="text" maxlength="3" value="${esc(p.iniciales)}" data-edm-campo="iniciales" data-edm-indice="${i}"></label>
      </div>
      <div class="rejilla rejilla--2" style="margin-top:.9rem">
        <label class="campo"><span>Foto</span>
          <select data-edm-campo="foto" data-edm-indice="${i}">${opcionesFoto(p.foto)}</select></label>
        <label class="campo"><span>Motivo del reconocimiento</span>
          <input type="text" value="${esc(p.motivo)}" data-edm-campo="motivo" data-edm-indice="${i}"></label>
      </div>
      <div style="margin-top:.9rem;text-align:right">
        <button class="btn btn--peligro btn--pequeno" data-borrar-edm="${i}">Borrar reconocimiento</button>
      </div>
    </div>`).join('');

  const anuncios = eq.tablon.map((an, i) => `
    <div class="tarjeta">
      <div class="rejilla rejilla--3">
        <label class="campo"><span>Fecha</span>
          <input type="date" value="${esc(an.fecha)}" data-anuncio-campo="fecha" data-anuncio-indice="${i}"></label>
        <label class="campo"><span>Tipo</span>
          <select data-anuncio-campo="tipo" data-anuncio-indice="${i}">
            <option value="evento"${an.tipo === 'evento' ? ' selected' : ''}>Evento</option>
            <option value="aviso"${an.tipo === 'aviso' ? ' selected' : ''}>Aviso</option>
            <option value="celebracion"${an.tipo === 'celebracion' ? ' selected' : ''}>Celebración</option>
          </select></label>
        <label class="campo"><span>Título</span>
          <input type="text" value="${esc(an.titulo)}" data-anuncio-campo="titulo" data-anuncio-indice="${i}"></label>
      </div>
      <label class="campo" style="margin-top:.9rem"><span>Texto <small>(Markdown, opcional)</small></span>
        <textarea style="min-height:80px" data-anuncio-campo="md" data-anuncio-indice="${i}">${esc(an.md)}</textarea></label>
      <div style="margin-top:.9rem;text-align:right">
        <button class="btn btn--peligro btn--pequeno" data-borrar-anuncio="${i}">Borrar anuncio</button>
      </div>
    </div>`).join('');

  const personas = eq.ranking.personas.map((p, i) => `
    <div class="fila">
      <div class="fila__txt">
        <div class="rejilla" style="grid-template-columns:2fr 80px 110px 1.5fr;gap:.6rem;align-items:end">
          <label class="campo"><span>Nombre</span>
            <input type="text" value="${esc(p.nombre)}" data-ranking-campo="nombre" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Iniciales</span>
            <input type="text" maxlength="3" value="${esc(p.iniciales)}" data-ranking-campo="iniciales" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Puntos</span>
            <input type="number" min="0" value="${Number(p.puntos) || 0}" data-ranking-campo="puntos" data-ranking-indice="${i}"></label>
          <label class="campo"><span>Foto</span>
            <select data-ranking-campo="foto" data-ranking-indice="${i}">${opcionesFoto(p.foto)}</select></label>
        </div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--pequeno" data-borrar-ranking="${i}">Borrar</button>
      </div>
    </div>`).join('');

  const galeria = fotos.length ? fotos.map((f) => `
    <div class="fila">
      <img src="/${esc(f.ruta)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:10px;flex:none">
      <div class="fila__txt">
        <div class="fila__tit">${esc(f.nombre)}</div>
        <div class="fila__sub">${esc(f.ruta)} · ${tamano(f.bytes)}</div>
      </div>
      <div class="fila__acc">
        <button class="btn btn--sutil btn--pequeno" data-borrar-foto="${esc(f.nombre)}">Borrar</button>
      </div>
    </div>`).join('') : '<div class="vacio">No hay fotos subidas. Pide permiso a cada persona antes de publicar la suya.</div>';

  return `
    <div class="cab">
      <div>
        <h1>Equipo</h1>
        <p>Empleado/a del mes, tablón de anuncios y ranking. Todo lo que edites aquí se publica en la sección Equipo al pulsar «Guardar cambios».</p>
      </div>
    </div>

    <div class="cab" style="margin-top:.4rem"><div><h1 style="font-size:1.15rem">Empleado/a del mes</h1></div>
      <button class="btn btn--secundario btn--pequeno" data-anadir-edm>+ Añadir reconocimiento</button></div>
    ${edm || '<div class="vacio">Sin reconocimientos todavía. El más reciente va primero.</div>'}

    <div class="cab" style="margin-top:1.6rem"><div><h1 style="font-size:1.15rem">Tablón del despacho</h1></div>
      <button class="btn btn--secundario btn--pequeno" data-anadir-anuncio>+ Añadir anuncio</button></div>
    ${anuncios || '<div class="vacio">Sin anuncios. Eventos, avisos y celebraciones del despacho.</div>'}

    <div class="cab" style="margin-top:1.6rem"><div><h1 style="font-size:1.15rem">Ranking</h1></div>
      <button class="btn btn--secundario btn--pequeno" data-anadir-ranking>+ Añadir persona</button></div>
    <div class="tarjeta">
      <label class="campo" style="max-width:220px"><span>Fecha de actualización</span>
        <input type="date" value="${esc(eq.ranking.actualizado)}" data-ranking-fecha></label>
      <p style="margin:.7rem 0 1rem;color:var(--tinta-3);font-size:.84rem">
        El progreso de cada persona vive en su navegador, así que el ranking lo publica RRHH:
        pídele a cada uno sus puntos (aparecen en su portada) o usa vuestros propios criterios.
        En la plataforma se ordena solo, de más a menos puntos.
      </p>
      ${personas || '<div class="vacio">Sin personas en el ranking.</div>'}
    </div>

    <div class="cab" style="margin-top:1.6rem"><div><h1 style="font-size:1.15rem">Fotos del equipo</h1></div></div>
    <div class="tarjeta">
      <p style="margin:0 0 .9rem;color:var(--tinta-3);font-size:.87rem">
        Se guardan en <code>assets/img/equipo/</code> y puedes elegirlas en los desplegables de arriba.
        Formatos .jpg, .png o .webp, máximo 8 MB. <strong>Pide permiso a la persona antes de publicar su foto.</strong>
      </p>
      <input type="file" id="foto-archivo" accept="image/jpeg,image/png,image/webp">
      <div id="foto-progreso" style="margin:.7rem 0;color:var(--tinta-3);font-size:.85rem"></div>
      ${galeria}
    </div>`;
}

/* ── Vista: objetivos mensuales por persona ──────────────────── */
function vistaObjetivosPanel() {
  const correos = Object.keys(datos.objetivos).sort();

  const bloques = correos.map((correo) => {
    const meses = Object.keys(datos.objetivos[correo]).sort().reverse().map((mes) => {
      const lista = datos.objetivos[correo][mes].map((o, i) => `
        <div class="fila">
          <div class="fila__txt">
            <input type="text" value="${esc(o.texto)}" style="width:100%;padding:.45rem .65rem;border-radius:8px;border:1.5px solid var(--borde);background:var(--papel-2)"
              data-obj-texto data-obj-correo="${esc(correo)}" data-obj-mes="${esc(mes)}" data-obj-indice="${i}">
          </div>
          <div class="fila__acc">
            <button class="btn btn--sutil btn--pequeno" data-borrar-objetivo data-obj-correo="${esc(correo)}" data-obj-mes="${esc(mes)}" data-obj-indice="${i}">Borrar</button>
          </div>
        </div>`).join('');
      return `
        <div style="margin-bottom:1.1rem">
          <div class="grupo-bloque__tit" style="margin-bottom:.5rem"><i></i>${esc(mes)}
            <button class="btn btn--sutil btn--pequeno" style="margin-left:auto" data-anadir-objetivo data-obj-correo="${esc(correo)}" data-obj-mes="${esc(mes)}">+ Objetivo</button>
            <button class="btn btn--sutil btn--pequeno" data-borrar-mes data-obj-correo="${esc(correo)}" data-obj-mes="${esc(mes)}">Borrar mes</button>
          </div>
          ${lista || '<div class="vacio" style="padding:1rem">Sin objetivos este mes.</div>'}
        </div>`;
    }).join('');

    return `
      <div class="tarjeta">
        <h2 style="display:flex;align-items:center;gap:.55rem">${esc(correo)}
          <button class="btn btn--sutil btn--pequeno" style="margin-left:auto" data-anadir-mes data-obj-correo="${esc(correo)}">+ Mes</button>
          <button class="btn btn--peligro btn--pequeno" data-borrar-persona data-obj-correo="${esc(correo)}">Quitar persona</button>
        </h2>
        ${meses || '<div class="vacio" style="padding:1rem">Sin meses. Añade uno para empezar.</div>'}
      </div>`;
  }).join('');

  return `
    <div class="cab">
      <div>
        <h1>Objetivos del mes</h1>
        <p>Los asigna RRHH por persona y mes. Cada empleado ve solo los suyos al entrar con su cuenta de Google, y los marca al completarlos.</p>
      </div>
      <button class="btn btn--primario btn--pequeno" data-anadir-persona>+ Añadir persona</button>
    </div>

    <div class="llamada llamada--aviso">
      <div class="llamada__txt"><span class="llamada__tit">Privacidad</span>
        <p>Este archivo viaja al navegador de todo el equipo. Escribe solo objetivos operativos, nunca valoraciones personales.</p>
      </div>
    </div>

    ${bloques || '<div class="vacio">Sin personas todavía. Pulsa «Añadir persona» y usa el correo de Google con el que entra cada una.</div>'}`;
}

/* ── Vista: grupos ───────────────────────────────────────────── */
function vistaGrupos() {
  const filas = datos.grupos.map((g, i) => {
    const cuantos = datos.modulos.filter((m) => m.grupo === g.id).length;
    return `
    <div class="tarjeta">
      <div class="cab" style="margin-bottom:.9rem">
        <div><h2 style="margin:0">${esc(g.titulo)}</h2>
          <p style="margin:.2rem 0 0;font-size:.82rem;color:var(--tinta-3)">${cuantos} ${cuantos === 1 ? 'módulo' : 'módulos'}</p></div>
        <div class="fila__acc">
          <button class="btn btn--sutil btn--icono" data-mover-grupo="${i}" data-paso="-1" ${i === 0 ? 'disabled' : ''} title="Subir">&uarr;</button>
          <button class="btn btn--sutil btn--icono" data-mover-grupo="${i}" data-paso="1" ${i === datos.grupos.length - 1 ? 'disabled' : ''} title="Bajar">&darr;</button>
        </div>
      </div>
      <div class="rejilla rejilla--2">
        <label class="campo"><span>Título</span>
          <input type="text" data-grupo-campo="titulo" data-grupo-indice="${i}" value="${esc(g.titulo)}"></label>
        <label class="campo"><span>Identificador</span>
          <input type="text" value="${esc(g.id)}" readonly></label>
      </div>
      <label class="campo" style="margin-top:.9rem"><span>Descripción <small>Aparece bajo el título del grupo en la portada.</small></span>
        <input type="text" data-grupo-campo="descripcion" data-grupo-indice="${i}" value="${esc(g.descripcion)}"></label>
    </div>`;
  }).join('');

  return `
    <div class="cab">
      <div>
        <h1>Grupos</h1>
        <p>Los bloques temáticos del itinerario. Su orden aquí determina el orden de los módulos en la portada y en el índice lateral.</p>
      </div>
      <button class="btn btn--primario" data-nuevo-grupo>Nuevo grupo</button>
    </div>
    ${filas}`;
}

/* ── Vista: ayuda ────────────────────────────────────────────── */
function vistaAyuda() {
  return `
    <div class="cab"><div><h1>Ayuda</h1><p>Cómo se escriben los contenidos y qué pasa al guardar.</p></div></div>
    <div class="tarjeta ayuda">
      <h2>Qué ocurre al guardar</h2>
      <p>El panel reescribe los archivos de <code>content/</code>. No publica nada: los cambios quedan
      en tu equipo hasta que hagas <code>git commit</code> y <code>git push</code>. Antes de sobrescribir,
      guarda una copia de cada archivo en <code>.copias-admin/</code>.</p>
      <p>Después de guardar conviene ejecutar <code>npm run validar</code> y revisar el resultado
      con <code>git diff</code>.</p>

      <h2>Formato del contenido</h2>
      <table>
        <thead><tr><th>Se escribe</th><th>Resultado</th></tr></thead>
        <tbody>
          <tr><td><code>## Título</code></td><td>Encabezado de sección</td></tr>
          <tr><td><code>### Subtítulo</code></td><td>Encabezado menor</td></tr>
          <tr><td><code>**texto**</code></td><td>Negrita</td></tr>
          <tr><td><code>*texto*</code></td><td>Cursiva</td></tr>
          <tr><td><code>- punto</code></td><td>Lista con viñetas</td></tr>
          <tr><td><code>1. punto</code></td><td>Lista numerada</td></tr>
          <tr><td><code>- [ ] tarea</code></td><td>Casilla de verificación</td></tr>
          <tr><td><code>| a | b |</code></td><td>Tabla (con la fila de guiones debajo)</td></tr>
          <tr><td><code>[texto](url)</code></td><td>Enlace</td></tr>
          <tr><td><code>---</code></td><td>Separador</td></tr>
        </tbody>
      </table>

      <h2>Llamadas destacadas</h2>
      <pre>&gt; [!NOTA] Información complementaria.
&gt; [!AVISO] Algo que conviene vigilar.
&gt; [!IMPORTANTE] Riesgo real si se incumple.
&gt; [!CLAVE] La idea que hay que retener.
&gt; [!BUENA] Buena práctica recomendada.
&gt; [!PENDIENTE] Falta completar con datos del despacho.</pre>

      <h2>Vídeos</h2>
      <pre>:::video
https://www.youtube.com/watch?v=IDENTIFICADOR
Título del vídeo
:::</pre>
      <p>Admite YouTube, Vimeo, Loom y archivos propios de <code>assets/video/</code>.
      El reproductor no se carga hasta que alguien pulsa, así que no se instala ninguna
      cookie de terceros mientras nadie reproduce.</p>

      <h2>Bloques de texto tal cual</h2>
      <p>Para plantillas y estructuras de carpetas, sangra el texto <strong>cuatro espacios</strong>.
      Se mostrará con tipografía de máquina y respetando los saltos de línea.</p>

      <h2>Lo que nunca se escribe aquí</h2>
      <ul>
        <li>Datos reales de clientes, ni siquiera en ejemplos. Se inventan.</li>
        <li>Nombres de personas del despacho asociados a un asunto.</li>
        <li>Fechas o umbrales normativos sin verificar: márcalos con <code>[!PENDIENTE]</code>.</li>
      </ul>
    </div>`;
}

/* ── Interacción ─────────────────────────────────────────────── */
function insertarEn(idArea, texto) {
  const area = document.getElementById(idArea);
  if (!area) return;
  const ini = area.selectionStart, fin = area.selectionEnd;
  const antes = area.value.slice(0, ini);
  const separador = antes && !antes.endsWith('\n\n') ? (antes.endsWith('\n') ? '\n' : '\n\n') : '';
  area.value = antes + separador + texto + '\n' + area.value.slice(fin);
  area.dispatchEvent(new Event('input', { bubbles: true }));
  area.focus();
  const pos = (antes + separador + texto).length;
  area.setSelectionRange(pos, pos);
}

function bloqueVideo(url, titulo) {
  return ':::video\n' + url + (titulo ? '\n' + titulo : '') + '\n:::';
}

document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('button');
  if (!b) return;

  /* Pestañas */
  if (b.classList.contains('pestana')) {
    vista = b.dataset.vista; abierto = null; pintar(); return;
  }

  /* --- Módulos --- */
  if (b.hasAttribute('data-nuevo-modulo')) {
    const titulo = prompt('Título del módulo nuevo:');
    if (!titulo || !titulo.trim()) return;
    const id = idUnico(identificador(titulo), datos.modulos.map((m) => m.id));
    datos.modulos.push({
      id, num: datos.modulos.length + 1,
      grupo: datos.grupos[0].id,
      titulo: titulo.trim(),
      resumen: 'Pendiente de describir.',
      duracion: 30, etiquetas: [],
      lecciones: [{ id: 'introduccion', titulo: 'Introducción', md: '## Introducción\n\nPendiente de redactar.' }]
    });
    abierto = { tipo: 'modulo', id, leccion: 'introduccion' };
    marcarCambios(); pintar(); return;
  }

  if (b.hasAttribute('data-editar-modulo')) {
    abierto = { tipo: 'modulo', id: b.dataset.editarModulo, leccion: null };
    pintar(); return;
  }
  if (b.hasAttribute('data-cerrar-modulo')) { abierto = null; pintar(); return; }

  if (b.hasAttribute('data-borrar-modulo')) {
    const mod = datos.modulos.find((m) => m.id === b.dataset.borrarModulo);
    if (!await confirmar('Borrar el módulo',
      `Se eliminará "${mod.titulo}" con sus ${mod.lecciones.length} lecciones. Podrás recuperarlo con git mientras no confirmes los cambios.`)) return;
    datos.modulos = datos.modulos.filter((m) => m !== mod);
    marcarCambios(); pintar(); return;
  }

  if (b.hasAttribute('data-mover')) {
    const i = Number(b.dataset.mover);
    const paso = Number(b.dataset.paso);
    const mod = datos.modulos[i];
    const hermanos = datos.modulos.filter((m) => m.grupo === mod.grupo);
    const pos = hermanos.indexOf(mod);
    const destino = hermanos[pos + paso];
    if (!destino) return;
    const j = datos.modulos.indexOf(destino);
    datos.modulos[i] = destino; datos.modulos[j] = mod;
    marcarCambios(); pintar(); return;
  }

  /* --- Etiquetas de módulo --- */
  if (b.hasAttribute('data-anadir-etiqueta')) {
    const etiqueta = prompt('Etiqueta (por ejemplo: obligatorio, comercial, herramientas):');
    if (!etiqueta || !etiqueta.trim()) return;
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    mod.etiquetas = mod.etiquetas || [];
    const limpia = etiqueta.trim().toLowerCase();
    if (!mod.etiquetas.includes(limpia)) mod.etiquetas.push(limpia);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-quitar-etiqueta')) {
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    mod.etiquetas.splice(Number(b.dataset.quitarEtiqueta), 1);
    marcarCambios(); pintar(); return;
  }

  /* --- Lecciones --- */
  if (b.hasAttribute('data-nueva-leccion')) {
    const titulo = prompt('Título de la lección nueva:');
    if (!titulo || !titulo.trim()) return;
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    const id = idUnico(identificador(titulo), mod.lecciones.map((l) => l.id));
    mod.lecciones.push({ id, titulo: titulo.trim(), md: '## ' + titulo.trim() + '\n\nPendiente de redactar.' });
    abierto.leccion = id;
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-abrir-leccion')) {
    const id = b.dataset.abrirLeccion;
    abierto.leccion = abierto.leccion === id ? null : id;
    pintar(); return;
  }
  if (b.hasAttribute('data-borrar-leccion')) {
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    const lec = mod.lecciones.find((l) => l.id === b.dataset.borrarLeccion);
    if (mod.lecciones.length === 1) { avisar('Un módulo necesita al menos una lección.', 'error'); return; }
    if (!await confirmar('Borrar la lección', `Se eliminará "${lec.titulo}".`)) return;
    mod.lecciones = mod.lecciones.filter((l) => l !== lec);
    if (abierto.leccion === lec.id) abierto.leccion = null;
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-leccion')) {
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    const i = Number(b.dataset.moverLeccion), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= mod.lecciones.length) return;
    [mod.lecciones[i], mod.lecciones[j]] = [mod.lecciones[j], mod.lecciones[i]];
    marcarCambios(); pintar(); return;
  }

  /* --- Novedades --- */
  if (b.hasAttribute('data-nueva-novedad')) {
    datos.novedades.unshift({ fecha: hoy(), nivel: 'informativa', etiquetas: [], titulo: '', md: '' });
    abierto = { tipo: 'novedad', indice: 0 };
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-editar-novedad')) {
    abierto = { tipo: 'novedad', indice: Number(b.dataset.editarNovedad) };
    pintar(); return;
  }
  if (b.hasAttribute('data-cerrar-novedad')) { abierto = null; pintar(); return; }
  if (b.hasAttribute('data-borrar-novedad')) {
    const nov = datos.novedades[Number(b.dataset.borrarNovedad)];
    if (!await confirmar('Borrar la novedad', `Se eliminará "${nov.titulo || 'sin título'}".`)) return;
    datos.novedades.splice(Number(b.dataset.borrarNovedad), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-novedad')) {
    const i = Number(b.dataset.moverNovedad), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= datos.novedades.length) return;
    [datos.novedades[i], datos.novedades[j]] = [datos.novedades[j], datos.novedades[i]];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-etiqueta-nov')) {
    const etiqueta = prompt('Etiqueta (por ejemplo: Herramientas, Procedimiento, Normativa):');
    if (!etiqueta || !etiqueta.trim()) return;
    const nov = datos.novedades[abierto.indice];
    nov.etiquetas = nov.etiquetas || [];
    if (!nov.etiquetas.includes(etiqueta.trim())) nov.etiquetas.push(etiqueta.trim());
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-quitar-etiqueta-nov')) {
    datos.novedades[abierto.indice].etiquetas.splice(Number(b.dataset.quitarEtiquetaNov), 1);
    marcarCambios(); pintar(); return;
  }

  /* --- Grupos --- */
  if (b.hasAttribute('data-nuevo-grupo')) {
    const titulo = prompt('Título del grupo nuevo:');
    if (!titulo || !titulo.trim()) return;
    const id = idUnico(identificador(titulo), datos.grupos.map((g) => g.id));
    datos.grupos.push({ id, titulo: titulo.trim(), descripcion: 'Pendiente de describir.' });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-mover-grupo')) {
    const i = Number(b.dataset.moverGrupo), j = i + Number(b.dataset.paso);
    if (j < 0 || j >= datos.grupos.length) return;
    [datos.grupos[i], datos.grupos[j]] = [datos.grupos[j], datos.grupos[i]];
    marcarCambios(); pintar(); return;
  }

  /* --- Herramientas del editor --- */
  if (b.hasAttribute('data-insertar')) {
    insertarEn(b.dataset.destino, b.dataset.insertar.replace(/&#10;/g, '\n'));
    return;
  }
  if (b.hasAttribute('data-insertar-video')) {
    const url = prompt('Dirección del vídeo (YouTube, Vimeo, Loom o assets/video/archivo.mp4):');
    if (!url || !url.trim()) return;
    const titulo = prompt('Título del vídeo (opcional):') || '';
    insertarEn(b.dataset.insertarVideo, bloqueVideo(url.trim(), titulo.trim()));
    return;
  }

  /* --- Vídeos --- */
  if (b.hasAttribute('data-generar-bloque')) {
    const url = $('#video-url').value.trim();
    if (!url) { avisar('Falta la dirección del vídeo.', 'error'); return; }
    const bloque = bloqueVideo(url, $('#video-titulo').value.trim());
    $('#video-salida').innerHTML =
      '<div class="editor__rotulo"><span>Pega esto en la lección</span></div>' +
      '<pre style="background:var(--marino-900);color:#dfe7f0;padding:.85rem 1rem;border-radius:6px;font-family:var(--f-mono);font-size:.82rem;white-space:pre-wrap">' +
      esc(bloque) + '</pre>' +
      '<div class="editor__rotulo" style="margin-top:.8rem"><span>Así se verá</span></div>' +
      '<div class="prosa">' + render(bloque) + '</div>';
    try { await navigator.clipboard.writeText(bloque); avisar('Bloque copiado al portapapeles', 'ok'); }
    catch (e) { avisar('Bloque generado. Cópialo a mano.'); }
    return;
  }
  if (b.hasAttribute('data-copiar-video')) {
    const bloque = bloqueVideo(b.dataset.copiarVideo, '');
    try { await navigator.clipboard.writeText(bloque); avisar('Bloque copiado al portapapeles', 'ok'); }
    catch (e) { avisar('No se ha podido copiar. Escríbelo a mano.', 'error'); }
    return;
  }
  if (b.hasAttribute('data-borrar-video')) {
    const nombre = b.dataset.borrarVideo;
    if (!await confirmar('Borrar el vídeo', `Se eliminará ${nombre} del proyecto. Esta acción no se puede deshacer desde el panel.`)) return;
    const r = await fetch('/api/video?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    videos = videos.filter((v) => v.nombre !== nombre);
    avisar('Vídeo eliminado', 'ok'); pintar(); return;
  }

  if (b.hasAttribute('data-datos-modelo')) {
    const archivo = b.dataset.datosModelo;
    const actual = modelos.find((m) => m.archivo === archivo);
    if (!actual) return;
    const titulo = prompt('Título del modelo:', actual.titulo);
    if (titulo === null) return;
    const categoria = prompt('Categoría (por ejemplo: Extranjería, Interno, Facturación):', actual.categoria);
    if (categoria === null) return;
    const descripcion = prompt('Descripción breve (opcional):', actual.descripcion || '');
    if (descripcion === null) return;
    const r = await fetch('/api/modelo-datos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archivo, titulo, categoria, descripcion })
    });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido guardar.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Datos del modelo guardados', 'ok'); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-modelo')) {
    const nombre = b.dataset.borrarModelo;
    if (!await confirmar('Borrar el modelo', `Se eliminará ${nombre} del proyecto. Esta acción no se puede deshacer desde el panel.`)) return;
    const r = await fetch('/api/modelo?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Modelo eliminado', 'ok'); pintar(); return;
  }

  /* --- Equipo: empleado del mes, tablón y ranking --- */
  if (b.hasAttribute('data-anadir-edm')) {
    const mes = new Date().toISOString().slice(0, 7);
    datos.equipo.empleadosDelMes.unshift({ mes, nombre: '', iniciales: '', foto: '', motivo: '' });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-edm')) {
    if (!await confirmar('Borrar el reconocimiento', 'Se quitará de la lista al guardar.')) return;
    datos.equipo.empleadosDelMes.splice(Number(b.dataset.borrarEdm), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-anuncio')) {
    const hoy = new Date().toISOString().slice(0, 10);
    datos.equipo.tablon.unshift({ fecha: hoy, tipo: 'aviso', titulo: '', md: '' });
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-anuncio')) {
    if (!await confirmar('Borrar el anuncio', 'Se quitará del tablón al guardar.')) return;
    datos.equipo.tablon.splice(Number(b.dataset.borrarAnuncio), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-ranking')) {
    datos.equipo.ranking.personas.push({ nombre: '', iniciales: '', foto: '', puntos: 0 });
    if (!datos.equipo.ranking.actualizado) {
      datos.equipo.ranking.actualizado = new Date().toISOString().slice(0, 10);
    }
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-ranking')) {
    datos.equipo.ranking.personas.splice(Number(b.dataset.borrarRanking), 1);
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-borrar-foto')) {
    const nombre = b.dataset.borrarFoto;
    if (!await confirmar('Borrar la foto', `Se eliminará ${nombre}. Si alguna tarjeta la usa, quedará sin foto.`)) return;
    const r = await fetch('/api/foto?nombre=' + encodeURIComponent(nombre), { method: 'DELETE' });
    const res = await r.json();
    if (!res.ok) { avisar(res.error || 'No se ha podido borrar.', 'error'); return; }
    fotos = res.fotos || [];
    avisar('Foto eliminada', 'ok'); pintar(); return;
  }

  /* --- Objetivos por persona --- */
  if (b.hasAttribute('data-anadir-persona')) {
    const correo = (prompt('Correo de Google de la persona:') || '').trim().toLowerCase();
    if (!correo) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { avisar('Eso no parece un correo válido.', 'error'); return; }
    if (!datos.objetivos[correo]) {
      datos.objetivos[correo] = { [new Date().toISOString().slice(0, 7)]: [] };
      marcarCambios();
    }
    pintar(); return;
  }
  if (b.hasAttribute('data-borrar-persona')) {
    const correo = b.dataset.objCorreo;
    if (!await confirmar('Quitar a la persona', `Se borrarán todos los objetivos de ${correo}.`)) return;
    delete datos.objetivos[correo];
    marcarCambios(); pintar(); return;
  }
  if (b.hasAttribute('data-anadir-mes')) {
    const mes = (prompt('Mes (AAAA-MM):', new Date().toISOString().slice(0, 7)) || '').trim();
    if (!mes) return;
    if (!/^\d{4}-\d{2}$/.test(mes)) { avisar('El mes debe tener formato AAAA-MM.', 'error'); return; }
    const persona = datos.objetivos[b.dataset.objCorreo];
    if (persona && !persona[mes]) { persona[mes] = []; marcarCambios(); }
    pintar(); return;
  }
  if (b.hasAttribute('data-borrar-mes')) {
    if (!await confirmar('Borrar el mes', 'Se borrarán los objetivos de ese mes.')) return;
    const persona = datos.objetivos[b.dataset.objCorreo];
    if (persona) { delete persona[b.dataset.objMes]; marcarCambios(); }
    pintar(); return;
  }
  if (b.hasAttribute('data-anadir-objetivo')) {
    const lista = datos.objetivos[b.dataset.objCorreo]?.[b.dataset.objMes];
    if (lista) {
      lista.push({ id: 'obj-' + Date.now().toString(36), texto: '' });
      marcarCambios(); pintar();
    }
    return;
  }
  if (b.hasAttribute('data-borrar-objetivo')) {
    const lista = datos.objetivos[b.dataset.objCorreo]?.[b.dataset.objMes];
    if (lista) { lista.splice(Number(b.dataset.objIndice), 1); marcarCambios(); pintar(); }
    return;
  }

  /* --- Barra superior --- */
  if (b.id === 'btn-guardar') { await guardar(); return; }
  if (b.id === 'btn-descartar') {
    if (!await confirmar('Descartar los cambios', 'Se perderá todo lo que hayas editado desde el último guardado.')) return;
    abierto = null; await cargar(); avisar('Cambios descartados'); return;
  }
});

/* Cambios en los campos */
document.addEventListener('input', (ev) => {
  const el = ev.target;
  let cambiado = false;

  if (el.dataset.moduloCampo && abierto?.tipo === 'modulo') {
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    mod[el.dataset.moduloCampo] = el.type === 'number' ? Number(el.value) : el.value;
    cambiado = true;
    if (el.dataset.moduloCampo === 'grupo') { marcarCambios(); pintar(); return; }
  }

  if (el.dataset.leccionCampo && abierto?.tipo === 'modulo') {
    const mod = datos.modulos.find((m) => m.id === abierto.id);
    const lec = mod.lecciones.find((l) => l.id === el.dataset.leccionId);
    if (lec) { lec[el.dataset.leccionCampo] = el.value; cambiado = true; }
  }

  if (el.dataset.novedadCampo && abierto?.tipo === 'novedad') {
    datos.novedades[abierto.indice][el.dataset.novedadCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.grupoCampo) {
    datos.grupos[Number(el.dataset.grupoIndice)][el.dataset.grupoCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.edmCampo) {
    datos.equipo.empleadosDelMes[Number(el.dataset.edmIndice)][el.dataset.edmCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.anuncioCampo) {
    datos.equipo.tablon[Number(el.dataset.anuncioIndice)][el.dataset.anuncioCampo] = el.value;
    cambiado = true;
  }

  if (el.dataset.rankingCampo) {
    const p = datos.equipo.ranking.personas[Number(el.dataset.rankingIndice)];
    p[el.dataset.rankingCampo] = el.dataset.rankingCampo === 'puntos' ? Number(el.value) : el.value;
    cambiado = true;
  }

  if (el.hasAttribute('data-ranking-fecha')) {
    datos.equipo.ranking.actualizado = el.value;
    cambiado = true;
  }

  if (el.hasAttribute('data-obj-texto')) {
    const lista = datos.objetivos[el.dataset.objCorreo]?.[el.dataset.objMes];
    if (lista && lista[Number(el.dataset.objIndice)]) {
      lista[Number(el.dataset.objIndice)].texto = el.value;
      cambiado = true;
    }
  }

  if (cambiado) {
    marcarCambios();
    // Vista previa en vivo, sin volver a pintar toda la pantalla.
    const caja = document.querySelector('[data-vista-previa="' + el.id + '"]');
    if (caja) caja.innerHTML = render(el.value);
  }
});

/* Subida de fotos del equipo */
document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'foto-archivo') return;
  const archivo = ev.target.files[0];
  if (!archivo) return;

  const progreso = $('#foto-progreso');
  progreso.textContent = 'Subiendo ' + archivo.name + '…';

  try {
    const r = await fetch('/api/foto?nombre=' + encodeURIComponent(archivo.name), {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: archivo
    });
    const res = await r.json();
    if (!res.ok) { progreso.textContent = ''; avisar(res.error || 'No se ha podido subir.', 'error'); return; }
    fotos = res.fotos || [];
    avisar('Foto subida. Ya puedes elegirla en los desplegables.', 'ok');
    pintar();
  } catch (e) {
    progreso.textContent = '';
    avisar('Error al subir: ' + e.message, 'error');
  }
});

/* Subida de modelos de documentos */
document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'modelo-archivo') return;
  const archivo = ev.target.files[0];
  if (!archivo) return;

  const progreso = $('#modelo-progreso');
  progreso.textContent = 'Subiendo ' + archivo.name + ' (' + tamano(archivo.size) + ')…';

  try {
    const r = await fetch('/api/modelo?nombre=' + encodeURIComponent(archivo.name), {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: archivo
    });
    const res = await r.json();
    if (!res.ok) { progreso.textContent = ''; avisar(res.error || 'No se ha podido subir.', 'error'); return; }
    modelos = res.modelos || [];
    avisar('Modelo subido. Pulsa «Datos» para ponerle título y categoría.', 'ok');
    pintar();
  } catch (e) {
    progreso.textContent = '';
    avisar('Error al subir: ' + e.message, 'error');
  }
});

/* Subida de vídeo */
document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'video-archivo') return;
  const archivo = ev.target.files[0];
  if (!archivo) return;

  const progreso = $('#video-progreso');
  progreso.textContent = 'Subiendo ' + archivo.name + ' (' + tamano(archivo.size) + ')…';

  try {
    const r = await fetch('/api/video?nombre=' + encodeURIComponent(archivo.name), {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: archivo
    });
    const res = await r.json();
    if (!res.ok) { progreso.textContent = ''; avisar(res.error || 'No se ha podido subir.', 'error'); return; }
    videos.push({ nombre: res.nombre, ruta: res.ruta, bytes: res.bytes });
    videos.sort((a, b2) => a.nombre.localeCompare(b2.nombre, 'es'));
    avisar('Vídeo subido a ' + res.ruta, 'ok');
    pintar();
  } catch (e) {
    progreso.textContent = '';
    avisar('Error al subir: ' + e.message, 'error');
  }
});

/* Aviso al cerrar con cambios sin guardar */
window.addEventListener('beforeunload', (ev) => {
  if (sucio()) { ev.preventDefault(); ev.returnValue = ''; }
});

/* Guardar con Ctrl/Cmd + S */
document.addEventListener('keydown', (ev) => {
  if ((ev.key === 's' || ev.key === 'S') && (ev.metaKey || ev.ctrlKey)) {
    ev.preventDefault();
    if (sucio()) guardar();
  }
});

cargar().catch((e) => {
  $('#lienzo').innerHTML = '<div class="errores"><strong>No se han podido cargar los contenidos.</strong><p>' +
    esc(e.message) + '</p></div>';
});
