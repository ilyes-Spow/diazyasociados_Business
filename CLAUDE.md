# Plataforma de formación interna · Díaz y Asociados

Sitio estático para el onboarding y la formación del equipo de un despacho de
abogados. Sin dependencias, sin compilación: HTML, CSS y JavaScript nativo con
módulos ES.

## Comandos

- `npm run dev` — servidor local en el puerto 8099
- `npm run admin` — panel de administración en el puerto 8100
- `npm run validar` — comprueba la integridad de los contenidos (**ejecutar antes de cada commit**)
- `npm run empaquetar` — genera `dist/formacion-diazyasociados.html`, versión de un solo archivo

## Arquitectura

- `content/` es la única fuente de contenidos y está separada del código.
  `curriculo.js` registra módulos y grupos; `modulos/NN-slug.js` contiene cada
  módulo (con `video` y `examen` opcionales); `novedades.js` es el histórico
  de novedades.
- **La formación es «vídeo primero»**: cada lección puede llevar
  `video: { url, titulo, minutos }` y es lo primero que se muestra; `md` son
  los apuntes y puede quedar vacío si hay vídeo. La videoteca (`#/videos`)
  lista todos los vídeos principales.
- `content/personas.js` es el equipo y los accesos (correo de Google, nombre,
  puesto, foto, rol `administracion`|`equipo`, `activo`). Si tiene entradas,
  solo entran las activas cuando Google esté configurado; `administradores.js`
  se deriva de él y no se edita a mano.
- `assets/js/markdown.js` es un renderizador propio de un subconjunto de
  Markdown. No hay librería externa.
- `assets/js/iconos.js` es el juego de iconos propio (trazo + relleno
  suave). Todo icono sale de `ico('nombre')`; en `index.html` y en el panel
  los elementos fijos llevan `data-ico="nombre"` y se rellenan al arrancar.
  Es el primer módulo que empaqueta `empaquetar.mjs`.
- `assets/js/app.js` también lleva el movimiento de la interfaz: pantalla
  de acceso, barra de lectura, revelado al hacer scroll,
  foco luminoso, ondas al pulsar y confeti al completar. Todo respeta
  `prefers-reduced-motion`.
- `assets/js/vistas.js` genera el HTML de cada pantalla como cadena de texto.
- **Navegación**: barra lateral fija en todas las pantallas
  (`navegacionLateral` en `vistas.js`), con los destinos agrupados en
  Inicio · Formación · Despacho · Tú y el equipo; dentro de un módulo,
  debajo va el índice de módulos. En pantallas pequeñas es un cajón que
  abre el botón de la cabecera. La cabecera solo lleva marca, buscador y
  acciones. **Toda sección nueva debe tener su enlace en la barra lateral;
  nada va solo en desplegables ni solo en el menú del avatar.**
- **Mi perfil** (`#/perfil`): foto, puesto, sede, idiomas, frase y cumpleaños
  de cada persona, guardados por `servidor.mjs` en `datos/perfiles.json`
  (API `GET /api/perfiles`, `POST /api/perfil`, `POST`/`DELETE
  /api/perfil/foto`; fotos en `datos/perfiles-fotos/`, reducidas a 320 px en el
  cliente). `assets/js/perfiles.js` es la copia en memoria que usan las vistas:
  la foto del perfil manda sobre la del panel. Las preferencias (tema, letra,
  menos movimiento, qué enciende la campana) viven en `localStorage`
  (`estado.js`, `preferencias`).
- `assets/js/app.js` contiene el enrutador por hash, la pantalla de acceso con
  Google, la delegación de eventos sobre `#vista` y el cliente del Muro.
- `herramientas/servidor.mjs` sirve los archivos y expone la API de Conecta
  (`/api/muro`): publicaciones del equipo guardadas en `datos/muro.json`,
  fuera del control de versiones. Es la única parte que necesita servidor.
  Rutas: `POST /api/muro` (alta; con `encuesta.opciones` si `tipo` es
  `encuesta`), `POST /api/muro/reaccion` (alterna una de `aplauso`, `corazon`,
  `risa`, `idea`, `fuego`, `fiesta`), `POST`/`DELETE /api/muro/respuesta`
  (hilo), `POST /api/muro/voto`, `POST /api/muro/foto` y `DELETE /api/muro`.
  Las publicaciones antiguas con `gracias` se migran al leerlas. **Cualquier
  cambio en el servidor exige reiniciarlo** (`npm run dev` o `arrancar.bat`).
- **Seguimiento por persona** (progreso, visualizaciones de vídeo, exámenes
  y actividad reciente): `herramientas/datos.mjs` es la capa de datos
  (colecciones JSON en `datos/`, escritura encadenada por colección,
  `registrarEvento`, `esAdministrador`, `curriculoFresco`) y
  `herramientas/api.mjs` expone `GET`/`POST /api/progreso`,
  `/api/visualizaciones`, `/api/examenes` y `/api/actividad`. Cada petición
  lleva la `clave` de la persona (correo o `nombre:<nombre>`); con
  `?todos=1` solo responde a administración (lo comprueba en el servidor
  con `personas.js`). El servidor corrige los exámenes y anota en la
  actividad los módulos completados, los exámenes aprobados, las
  publicaciones de Conecta y lo nuevo que publica el panel. **Al pasar a
  Supabase se sustituyen solo `datos.mjs` y `assets/js/api.js`.**
- **Soporte informático** (`#/soporte`, `vistaSoporte`, `piezaTicket`):
  tickets en `datos/tickets.json` por `/api/tickets` (GET propios o
  `?todos=1` para administración; POST abre), `/api/tickets/estado` (solo
  administración: pendiente → en-proceso → resuelto; reabrir borra la
  encuesta), `/api/tickets/mensaje` (hilo entre la persona e informática)
  y `/api/tickets/encuesta` (estrellas 1-5, tiempo, quién atendió; solo
  quien abrió el ticket y solo resuelto), `/api/tickets/nota` (notas
  internas, nunca se envían a la persona) y `/api/tickets/ajustar`
  (urgencia y tipo). Informática = personas con rol `administracion`;
  reciben correo por `enviarAviso(asunto, texto, destinatarios)` si hay
  `datos/correo.json`, y el portal sondea cada minuto y avisa con un toast
  de cada ticket nuevo. La bandeja tiene búsqueda (sin repintar), filtros
  por estado y tipo, orden, respuestas rápidas, aviso de retraso según la
  urgencia y exportación CSV. La campana avisa a informática de los
  abiertos y a cada persona de los movimientos de los suyos; el
  seguimiento de dirección resume tiempos y valoraciones.
- **Ranking de Equipo**: escenario oscuro con auroras y chispas, podio que
  sube, anillo giratorio del primero, contadores decimales
  (`data-contar` + `data-decimales`) y subidas/bajadas respecto al mes
  publicado anterior (`rk-delta`). Todo respeta `prefers-reduced-motion`
  y la preferencia «menos movimiento».
- `assets/js/api.js` es el único cliente de esa API en el portal: falla en
  silencio si no hay servidor o no hay cuenta. `app.js` cruza el progreso
  local con el del servidor al entrar, registra las lecciones marcadas, el
  avance de cada `<video>` (10/25/50/75/90 % y final) y el inicio de los
  vídeos externos.
- **Exámenes**: `mod.examen = { aprobado, preguntas: [{ id, texto, opciones,
  correcta, explicacion }] }` en el módulo. Se editan en el panel («Examen
  del módulo», bajo el vídeo de presentación), los serializa
  `contenido.mjs` y los valida `validar.mjs`. El portal los muestra al final
  del módulo (`tarjetaExamen`, `piezaExamen`, `piezaResultadoExamen`).
- **Seguimiento** (`#/seguimiento`, `vistaSeguimiento`): solo para
  administración; por persona, por vídeo y últimos exámenes. Los enlaces
  llevan `data-solo-admin` y `fijarModoAdmin` lo activa en las vistas.
- **Pantalla de acceso sin Google**: si hay personas activas en
  `personas.js`, el botón abre un selector de cuentas (como el de Google)
  para entrar como cualquiera de ellas o como invitado; sin personas, entra
  directamente. `esAdministrador()` solo asume el modo de desarrollo cuando
  no hay personas dadas de alta.
- **Objetivos calculables** (`content/objetivos.js`): `plantillas`
  (objetivos con `max` y `tipo`: `proporcional` con `meta` y `unidad`,
  `relativo` con `base` y `proporcion`, o `valoracion`), `personas`
  (`id`, `nombre`, `correo` opcional, `plantilla`, `metas` propias) y
  `meses['AAAA-MM'][personaId] = { resultados, puntos, total? }`. Un valor en
  `puntos` manda sobre el cálculo (así se conserva el histórico) y `total`
  es la puntuación final publicada cuando dirección decidió una nota
  distinta de la suma (es la que cuenta en el ranking). Las personas con
  `baja: true` conservan su histórico pero no salen en los meses nuevos.
  El ranking del portal admite `#/equipo/AAAA-MM` para ver meses pasados. Toda la
  aritmética está en `assets/js/objetivos-calculo.js` (lo usan portal, panel
  y `admin.mjs`): `calcularMes`, `rankingDe`, `rankingAcumulado` (media de
  los meses), `personaDeSesion` (por correo o nombre de pila). El panel
  («Objetivos») tiene tres pestañas: resultados del mes con cálculo en
  vivo, personas y metas, plantillas. El histórico de los Excel se vuelca
  con `herramientas/importar-objetivos.mjs` (lector propio
  `herramientas/xlsx.mjs`); solo lee las columnas de puntuación, nunca los
  comentarios con nombres de clientes. El ranking manual de `equipo.js` es
  solo un respaldo mientras no haya meses publicados.
- `herramientas/correo.mjs` envía los avisos por correo (SMTP propio, sin
  dependencias) si existe `datos/correo.json`; sin él, no envía y no falla.
- `assets/js/estado.js` encapsula todo el acceso a `localStorage`, tolerante a
  fallos (navegación privada, almacenamiento lleno).
- `herramientas/contenido.mjs` lee `content/` importando los módulos reales y
  los vuelve a serializar con el mismo formato. Es la pieza que usa el panel:
  cualquier cambio en el formato de los archivos de contenido tiene que
  reflejarse aquí, y comprobarse con un ciclo de ida y vuelta.
- `herramientas/admin.mjs` sirve el panel y expone la API local. Escucha solo
  en 127.0.0.1 y valida todo lo recibido antes de escribir nada. El panel
  (`herramientas/admin/`) tiene Inicio con resumen y tareas, editor de lección
  con el vídeo delante, biblioteca de vídeos con uso, Personas y accesos y una
  barra de guardado fija; los altas se hacen con diálogos, nunca con `prompt`.

## Convenciones

- **Todo en español**: nombres de variables, funciones, comentarios y commits.
- Los contenidos viven en plantillas de JavaScript, así que **no se pueden usar
  acentos graves**. Para bloques cercados se usa el delimitador `:::`; para
  texto preformateado, sangría de cuatro espacios.
- Los puntos que necesitan datos reales del despacho se marcan con
  `> [!PENDIENTE]`, nunca se inventan.
- Los módulos de un mismo grupo van seguidos y su `num` es correlativo desde 1.
  `npm run validar` lo comprueba.
- Nunca se incluyen datos reales de clientes, ni siquiera en ejemplos.

## Al tocar contenidos con referencias normativas

Los módulos 16 (facturación) y 17 (protección de datos) contienen referencias a
obligaciones legales en cambio. No se afirman fechas ni umbrales concretos sin
verificarlos: se marcan como pendientes de confirmar con la asesoría.
