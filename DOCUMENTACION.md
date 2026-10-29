# Plataforma interna de formación y equipo · Díaz y Asociados

**Documentación del proyecto y siguientes pasos.** Actualizado el 29 de octubre de 2026.

Este documento tiene dos mitades. La primera (apartados 1 a 6) está pensada para
dirección y para cualquier persona del despacho: qué es la plataforma, qué hace
cada pantalla, cómo se usa en el día a día y qué pidió dirección que ya está
hecho. La segunda (apartados 7 a 9) es para quien la mantenga: cómo está
construida, cómo se opera y qué hay que hacer para pasarla a producción.
El apartado 10 son los siguientes pasos.

---

## 1. Qué es y en qué estado está

La plataforma es el portal interno del despacho. Nació como sitio de formación y
onboarding y hoy cubre cinco cosas:

| Área | Qué resuelve |
|---|---|
| **Formación** | 18 módulos en 6 bloques (60 lecciones, unas 11 horas), con vídeo primero y apuntes debajo, exámenes por módulo y registro de quién ha visto qué. |
| **Objetivos y ranking** | Las metas de cada persona, los resultados que publica dirección cada mes y la puntuación y el ranking calculados solos. Histórico importado de enero a septiembre de 2026. |
| **Equipo y comunicación** | Novedades, empleado del mes, tablón, Quién es quién con fotos, Conecta (la red social interna) y la actividad reciente. |
| **Soporte informático** | Tickets a informática con estados, hilo de mensajes, encuesta de calidad al resolver e histórico con tiempos. |
| **Seguimiento para dirección** | Por persona: lecciones, vídeos, exámenes, objetivos, tickets. |

**Estado:** funciona completa en un ordenador del despacho con el servidor local
(`arrancar.bat`). Está lista para enseñarla y para que el equipo la pruebe en
red local. Lo que falta para que sea «de verdad» es la puesta en producción
(acceso con Google verificado, alojamiento y base de datos en la nube), que se
describe en el apartado 10.

Sin dependencias externas: HTML, CSS y JavaScript nativos, y un servidor Node
propio. No hay nada que instalar aparte de Node.

---

## 2. Cómo se entra

- **Pantalla de acceso.** Mientras el acceso con Google no esté verificado, el
  botón «Acceder con Google» abre un selector con las cuentas del despacho
  (las 23 cuentas de Google Workspace exportadas por informática, más una de
  invitado). Cuando se configure el ID de cliente de Google, ese botón pasará
  a ser el de Google de verdad y solo entrarán las cuentas dadas de alta y
  activas en «Personas y accesos».
- **Papeles.** `equipo` (portal completo) y `administracion` (además: panel de
  administración, seguimiento, bandeja de informática y moderación de
  Conecta). Hoy administran las dos cuentas de Ilyes. Dirección puede recibir
  ese papel desde el panel; si se quiere que dirección vea el seguimiento sin
  recibir los tickets de informática, hay que crear un papel «dirección» aparte
  (ver siguientes pasos).
- **Dos copias del progreso.** El avance en la formación se guarda en el
  navegador de cada persona y también en el servidor; al entrar se cruzan las
  dos. Así dirección ve el avance real y nadie pierde nada si cambia de
  ordenador.

---

## 3. Mapa del portal, pantalla a pantalla

La navegación es una **barra lateral fija** con todo a la vista; en móvil es un
cajón que abre el botón de la cabecera. La cabecera lleva la marca, el buscador
(tecla `/`), la campana de avisos, el tema claro u oscuro, el acceso al panel
(solo administración) y el avatar con el menú de perfil.

### Inicio
Saludo, botón «Continuar donde lo dejaste», anillo de progreso y puntos,
novedades del despacho, **actividad reciente** del equipo (módulos completados,
exámenes aprobados, formación nueva, publicaciones de Conecta, comunicados,
cumpleaños), tarjeta «Tus objetivos» con la puntuación del mes y el puesto, y
accesos rápidos (itinerario, primera semana, novedades, soporte, lección
sorpresa).

### Formación
- **Itinerario de formación.** Los 18 módulos por bloques:
  1. Fundamentos del despacho: Bienvenida y funcionamiento · Servicios · Protocolo interno · Coordinación interna.
  2. Herramientas y entorno digital: Herramientas y entorno informático · HubSpot / CRM · Control y gestión de clientes.
  3. Operativa y expedientes: Citas y agenda · Trámites · Gestión documental · Incidencias.
  4. Comercial y clientes: Leads · Formación comercial y cierre · Atención al cliente · Marketing.
  5. Administración y cumplimiento: Facturación y cobros · Protección de datos.
  6. Desarrollo continuo: Formación continua.
- **Un módulo.** Vídeo de presentación (si lo hay), lecciones desplegables con
  el vídeo primero y los apuntes debajo, botón «Marcar como completada», y al
  final el **examen del módulo** (tipo test, se aprueba con el porcentaje que
  fije el panel, se puede repetir; la corrección explica cada pregunta). Hoy
  tienen examen los módulos 1 (Bienvenida) y 6 (HubSpot).
- **Videoteca.** Todos los vídeos de la formación, por módulo.
- **Tu primera semana.** El onboarding por niveles con misiones, insignias y
  «Descubre el despacho» (equipo, reseñas, oficinas).

### Despacho
- **Novedades.** Histórico de avisos del despacho con nivel (crítica,
  importante, informativa).
- **Equipo y ranking.** Empleado del mes, el **ranking de objetivos** del mes
  (podio animado, flechas de subida y bajada respecto al mes anterior, pestañas
  para ver meses anteriores y el acumulado del año), tablón, Quién es quién y
  las oficinas.
- **Modelos de documentos.** Plantillas para descargar, por categoría.
- **Soporte informático.** Abrir un ticket (qué pasa, tipo, urgencia,
  detalles), seguir los propios, hilo con informática y encuesta al resolver.
  Administración ve además la **bandeja** (apartado 4.5).
- **Seguimiento (solo dirección).** Cifras del equipo y tablas por persona
  (lecciones, vídeos, exámenes, objetivos, última actividad), por vídeo (quién
  lo ha visto y cuánto), últimos exámenes y soporte informático (abiertos,
  resueltos, tiempo medio, valoración).

### Tú y el equipo
- **Conecta.** Red social interna: sugerencias, ideas, preguntas,
  agradecimientos, celebraciones, quejas y encuestas; fotos, etiquetas,
  menciones, reacciones, hilos, tendencias y ranking de actividad.
- **Mis objetivos.** Las metas de la persona, cada mes publicado con lo
  conseguido y los puntos por objetivo, el puesto del mes, la media del año y
  la evolución en barras.
- **Mi perfil.** Foto, puesto, sede, idiomas, frase y cumpleaños; tema, tamaño
  de letra y «menos movimiento»; qué enciende la campana; copia y reinicio del
  progreso (con confirmación escrita y deshacer).

### Campana de avisos
Avisa de novedades, tablón, empleado del mes, ranking, objetivos publicados,
modelos nuevos, movimiento en Conecta, actividad del equipo y, para cada uno,
de sus tickets. A informática, de los tickets abiertos.

---

## 4. Cómo se usa en el día a día

### 4.1 Publicar una formación nueva (panel → Módulos y lecciones)
1. «Nuevo módulo»: título, bloque y resumen.
2. En cada lección, «Vídeo de la lección»: elegir uno de la biblioteca o pegar
   un enlace de YouTube (no listado) o Vimeo (con contraseña). Los apuntes son
   opcionales si hay vídeo.
3. Opcional: vídeo de presentación del módulo y **examen** (preguntas, opciones,
   cuál es la correcta, explicación, nota para aprobar).
4. «Guardar cambios». Al guardar, la actividad reciente y la campana avisan al
   equipo de la formación nueva; con el correo configurado, también por correo.

### 4.2 Cerrar el mes de objetivos (panel → Objetivos)
1. Pestaña **Resultados del mes**: elegir el mes.
2. Por cada persona, escribir lo conseguido en los objetivos con meta (clientes
   captados, expedientes cerrados, facturación, colaboraciones, reseñas) y los
   puntos de los que valora dirección (MN, contabilidad, RRSS, limpieza,
   actitud). Los puntos de los objetivos con meta se calculan solos; se pueden
   fijar a mano si hace falta.
3. Si dirección decide una nota final distinta de la suma, «Puntuación final».
4. El ranking del mes se ve en vivo a la derecha. «Guardar cambios» lo publica:
   cada persona ve lo suyo en «Mis objetivos», el equipo ve el ranking en
   Equipo, y la actividad reciente lo anuncia.
5. Las **metas** de cada persona se ajustan en «Personas y metas»; las
   **plantillas** (qué objetivos tiene cada tipo de puesto y cómo se puntúan)
   en «Plantillas». Hay tres: comercial (10 objetivos, 11 puntos con el extra
   de actitud), marketing (12) e informática (10 criterios del plan de carrera,
   10 puntos).

Cómo se puntúa: los objetivos **proporcionales** dan `conseguido ÷ meta ×
máximo`, con tope en el máximo (15 reseñas de meta y 14 conseguidas: 0,93
sobre 1). Los **relativos** se miden sobre otro objetivo (expedientes cerrados
sobre clientes captados, al 50 %). Las **valoraciones** las pone dirección. El
ranking mensual ordena por puntuación; el acumulado del año es la media de los
meses puntuados.

### 4.3 Dar de alta a una persona (panel → Personas y accesos)
Nombre, correo de Google, puesto, foto (se puede subir: el panel la recorta y
reduce sola), papel y activo. Con la cuenta enlazada, la persona ve sus
objetivos, su foto sale en el ranking y en Quién es quién, y podrá entrar cuando
Google esté verificado. Quien deja el despacho se pone «inactivo» (y en
Objetivos, «ya no está en el despacho»): conserva su histórico y desaparece de
los meses nuevos.

### 4.4 Publicar una novedad, un reconocimiento o un modelo
Pestañas Novedades, Reconocimientos y tablón, y Modelos de documentos. Todo
avisa en la campana y en la actividad reciente al guardar.

### 4.5 Atender un ticket (portal → Soporte informático, solo administración)
La bandeja muestra los tickets abiertos con los urgentes arriba, cifras
(pendientes, en proceso, tiempo medio, valoración media), búsqueda, filtros por
estado y tipo, y orden. En cada ticket: **Empezar** (en proceso), **Resolver**
(pide confirmación), **Volver a pendiente** o **Reabrir**; cambiar urgencia y
tipo; respuestas rápidas de un clic; hilo de mensajes con la persona; **notas
internas** que solo ve informática; aviso «Se retrasa» si lleva demasiado
abierto para su urgencia. Al resolver, la persona recibe la encuesta: calidad
(1 a 5 estrellas), si se resolvió a tiempo, quién la atendió y su feedback.
«Exportar» descarga el histórico en CSV para Excel. El portal comprueba cada
minuto y avisa de los tickets nuevos; con el correo configurado, también
llega un correo.

---

## 5. Datos y privacidad

| Dónde | Qué guarda | Control de versiones |
|---|---|---|
| `content/` | Módulos, lecciones, exámenes, novedades, equipo, objetivos (plantillas, metas, resultados), personas y accesos, modelos. | Sí (git). Los edita el panel. |
| `datos/` | Lo que genera el uso: progreso en servidor, visualizaciones de vídeo, intentos de examen, actividad, tickets, publicaciones y fotos de Conecta, perfiles y sus fotos, configuración del correo. | No (fuera de git). Hay que copiarlo en las copias de seguridad. |
| Navegador de cada persona | Progreso local, preferencias, qué avisos ha visto. | No. |
| `assets/img/equipo/` | Fotos del equipo recortadas a 640 px. | Sí. |

Quién ve qué:

| Dato | La persona | El equipo | Administración |
|---|---|---|---|
| Progreso, vídeos vistos, exámenes | Lo suyo | No | Todo (Seguimiento) |
| Objetivos: metas y resultados | Lo suyo | Solo la puntuación total en el ranking | Todo |
| Tickets | Los suyos | No | Todos, con notas internas |
| Conecta, novedades, tablón | Todo | Todo | Todo y modera |

Reglas que no se saltan: nunca entran datos de clientes (ni en ejemplos, ni en
tickets, ni en objetivos: el importador de Excel ignoró a propósito las columnas
de comentarios con nombres). Los contenidos de `content/` viajan al navegador
de todo el equipo, así que allí solo van cifras y textos operativos, nunca
valoraciones personales. Las notas internas de los tickets no salen del
servidor hacia la persona. Cuando esto pase a producción habrá que informar al
equipo de qué se registra (RGPD): progreso, visualizaciones, exámenes,
objetivos y tickets.

---

## 6. Lo que pidió dirección y en qué estado está

Respuesta de dirección del 27 de octubre de 2026, bloque a bloque:

| Bloque | Estado | Dónde |
|---|---|---|
| Formaciones nuevas (HubSpot por funcionalidad, atención telefónica, legales, comercial) | Pendiente de los vídeos | Se crean desde el panel en minutos; los vídeos los graba el despacho. |
| Examen por formación | Hecho | Panel → Examen del módulo; portal al final del módulo. Hay dos escritos (módulos 1 y 6). |
| Ver quién vio cada vídeo, cuándo, si completo, y resultados de exámenes | Hecho | Seguimiento. Los vídeos externos (YouTube) solo registran que se empezaron. |
| Notificación de formación nueva | Hecho en campana y actividad; por correo cuando se configure `datos/correo.json` | Panel al guardar. |
| Fotos (Diego) | Hecho con los retratos recibidos | Quién es quién, ranking, acceso. |
| Objetivos con puntuación máxima, proporcional, ranking automático | Hecho, con el histórico de enero a septiembre | Panel → Objetivos; portal → Mis objetivos y Equipo. |
| Modelos subidos y consultados por compañeros | Parcial: los sube el panel y se consultan en el portal | Falta subida desde el portal con categorías. |
| Colaboraciones por sector y ciudad | Pendiente | |
| Cumpleaños: lista para dirección y aviso el día | Parcial: la actividad anuncia el cumpleaños del día si la persona lo puso en su perfil | Falta la lista ordenada para dirección. |
| Actividad reciente al entrar | Hecho | Inicio y campana. |
| Tickets de informática con estados, aviso, encuesta e histórico | Hecho | Soporte informático. |
| Reconocimientos públicos y privados; feedback constructivo y confidencial | Pendiente (hoy existe el empleado del mes y los agradecimientos de Conecta) | |
| Panel de seguimiento para dirección | Hecho | Seguimiento. |

---

## 7. Cómo está construida (para mantenimiento)

### 7.1 Principios
- Sin dependencias ni compilación. Node 18 o superior para los servidores y
  las herramientas. Todo en español: código, comentarios y commits.
- `content/` es la única fuente de contenidos y está separada del código.
  Los archivos son plantillas de JavaScript: sin acentos graves dentro; bloques
  con `:::`; los datos que faltan del despacho se marcan `> [!PENDIENTE]`.
- La capa de datos del servidor está aislada para poder cambiarla por Supabase
  sin tocar el resto (ver 7.4).

### 7.2 Estructura
```
index.html                      Portal (una sola página con enrutador por hash)
arrancar.bat                    Arranca portal (8099) y panel (8100) con doble clic
assets/css/styles.css           Hoja de estilos única, por secciones numeradas
assets/js/app.js                Arranque, enrutador, acceso, delegación de eventos, Conecta,
                                exámenes, vídeos, soporte, seguimiento, animaciones
assets/js/vistas.js             El HTML de cada pantalla como cadena de texto
assets/js/objetivos-calculo.js  Puntuación de objetivos y ranking (portal, panel y servidor)
assets/js/api.js                Cliente de la API de seguimiento y tickets
assets/js/estado.js             Todo el acceso a localStorage
assets/js/perfiles.js           Perfiles en memoria
assets/js/iconos.js             Juego de iconos propio (ico('nombre'))
assets/js/markdown.js           Renderizador propio de Markdown (subconjunto)
assets/js/buscador.js           Índice y búsqueda
content/                        curriculo.js, modulos/NN-slug.js, novedades.js, equipo.js,
                                objetivos.js, personas.js, administradores.js, modelos.js
herramientas/servidor.mjs       Servidor del portal: archivos estáticos, Conecta y perfiles
herramientas/api.mjs            API: progreso, visualizaciones, exámenes, actividad, tickets
herramientas/datos.mjs          Capa de datos (JSON en datos/, escritura encadenada)
herramientas/correo.mjs         Avisos por correo (SMTP propio) si existe datos/correo.json
herramientas/admin.mjs          Servidor del panel (solo 127.0.0.1) y su API
herramientas/admin/             El panel (index.html, panel.js, panel.css)
herramientas/contenido.mjs      Lee content/ y lo vuelve a escribir con el mismo formato
herramientas/validar.mjs        Comprueba la integridad de los contenidos
herramientas/empaquetar.mjs     Versión de un solo archivo en dist/
herramientas/importar-objetivos.mjs  Vuelca los Excel de objetivos en objetivos.js
herramientas/xlsx.mjs           Lector de .xlsx sin dependencias
datos/                          Datos de uso (fuera de git)
```

### 7.3 API del portal (servidor en el puerto 8099)
Cada petición lleva la `clave` de la persona (su correo o `nombre:<nombre>`);
`?todos=1` solo responde a administración, comprobado en el servidor contra
`personas.js`.

| Ruta | Para qué |
|---|---|
| `GET/POST /api/progreso` | Lecciones completadas por persona; `lecciones: {}` para sincronizar varias. |
| `GET/POST /api/visualizaciones` | Vídeos: inicio, porcentaje máximo, completo, veces. |
| `GET/POST /api/examenes` | Intentos; el servidor corrige con el examen real del módulo. |
| `GET /api/actividad` · `POST` (administración) | Hilo de actividad reciente; añade los cumpleaños del día. |
| `GET/POST /api/tickets` | Tickets propios (sin notas internas) o todos (administración); abrir. |
| `POST /api/tickets/estado` | Cambio de estado (administración); correo a la persona si tiene cuenta. |
| `POST /api/tickets/mensaje` | Hilo persona ↔ informática. |
| `POST /api/tickets/encuesta` | Calidad, tiempo, quién atendió, feedback; solo quien lo abrió y resuelto. |
| `POST /api/tickets/nota` · `/ajustar` | Notas internas; urgencia y tipo (administración). |
| `/api/muro`, `/api/muro/*` | Conecta: publicaciones, reacciones, respuestas, votos, fotos, borrado. |
| `/api/perfiles`, `/api/perfil`, `/api/perfil/foto` | Perfiles y sus fotos. |

API del panel (puerto 8100, solo local): `/api/estado`, `/api/guardar`,
`/api/foto`, `/api/video`, `/api/modelo`.

### 7.4 Modelo de objetivos
`content/objetivos.js` tiene tres partes: `plantillas` (objetivos con `max` y
`tipo`: `proporcional` con `meta` y `unidad`, `relativo` con `base` y
`proporcion`, o `valoracion`), `personas` (`id`, `nombre`, `correo`, `foto`,
`plantilla`, `metas` propias, `baja`) y `meses['AAAA-MM'][persona] =
{ resultados, puntos, total? }`. Un valor en `puntos` manda sobre el cálculo;
`total` es la nota final publicada cuando difiere de la suma. Toda la aritmética
está en `assets/js/objetivos-calculo.js` y la usan portal, panel y servidor.

### 7.5 Cómo se verifica
- `npm run validar` antes de cada commit: estructura de módulos, exámenes,
  personas, objetivos, Markdown.
- Ida y vuelta: `contenido.mjs` tiene que leer y volver a escribir cada archivo
  de `content/` sin cambiar un byte; cualquier campo nuevo pasa por su
  serializador y por `validar.mjs`.
- Los recorridos de comprobación se han hecho con Chrome sin ventana (acceso,
  examen, vídeo, actividad, seguimiento, objetivos, tickets, navegación, en
  claro, oscuro y móvil), sin errores de consola.

---

## 8. Operación

- **Arrancar:** doble clic en `arrancar.bat` (abre el portal en el 8099 y el
  panel en el 8100 y el navegador). O `npm run dev` y `npm run admin`.
- **Reiniciar:** cualquier cambio en `herramientas/*.mjs` exige reiniciar los
  servidores (cerrar las dos ventanas negras y volver a arrancar). Los cambios
  en `content/`, `assets/` e `index.html` se ven con recargar la página.
- **Compartir temporalmente** con otra oficina: un túnel tipo ngrok hacia el
  puerto 8099 (el panel no se expone: solo escucha en el propio ordenador).
- **Correo:** copiar `herramientas/correo.ejemplo.json` a `datos/correo.json`
  con una cuenta SMTP (en Gmail, una contraseña de aplicación) y los
  destinatarios. Los avisos de tickets van a las cuentas con papel de
  administración y a la persona del ticket si entró con su cuenta.
- **Copias de seguridad:** `content/` está en git; `datos/` hay que copiarlo
  aparte (ahí viven tickets, progreso, Conecta y perfiles).
- **Versión de un solo archivo:** `npm run empaquetar` genera
  `dist/formacion-diazyasociados.html` para abrir sin servidor (sin Conecta,
  perfiles, exámenes, tickets ni seguimiento: el portal lo detecta).
- **Importar objetivos desde Excel:** `node herramientas/importar-objetivos.mjs
  --carpeta "C:\ruta\con\los\excel"` (un libro «OBJETIVOS NOMBRE.xlsx» por
  persona, una hoja por mes).

---

## 9. Decisiones tomadas

- **Vídeo primero.** La formación se diseñó para que casi todo sea vídeo; el
  texto son apuntes.
- **Puntuación de objetivos.** Se respeta lo publicado por RRHH: donde la nota
  final difería de la suma de la hoja, se guardó como puntuación final; donde no
  había hoja (Ilyes, y personas que ya no están), solo la nota. Dominique
  aparece en agosto aunque no estaba en el PDF porque su hoja tiene datos.
- **Informática = administración.** Hoy el papel de administración reúne panel,
  seguimiento, moderación y tickets.
- **Producción.** Decidido Cloudflare Pages (portal estático) + Supabase (base
  de datos, acceso con Google, archivos, región de Frankfurt) + panel local
  para contenidos. Netlify descartado. La clave de servicio de Supabase nunca
  se comparte ni se pone en el portal.

---

## 10. Siguientes pasos

### 10.1 Antes de enseñarla a dirección
1. Reiniciar `arrancar.bat` y recorrer el portal con dos cuentas: una de equipo
   (por ejemplo Mercedes) y la de administración.
2. Revisar en Objetivos → Personas y metas las metas deducidas de las hojas
   (referencia de 15 clientes, facturación por persona, colaboraciones de Alvaro).
3. Decidir si Nico e Ignacio reciben el papel de administración ya, o se espera
   al papel «dirección».
4. Pedir a cada persona que entre, ponga su foto si quiere otra, su cumpleaños y
   sus preferencias en «Mi perfil».

### 10.2 Puesta en producción
Lo que hace falta para que el equipo entre desde cualquier sitio con su cuenta:

1. **Acceso con Google.** Crear en Google Cloud Console un ID de cliente OAuth
   (aplicación web) con los orígenes autorizados (`http://localhost:8099` y el
   dominio final) y pegarlo en `CLIENTE_GOOGLE` de `assets/js/app.js`. Desde
   ese momento solo entran las cuentas activas de `personas.js`.
2. **Supabase** (proyecto en Frankfurt): tablas para progreso, visualizaciones,
   exámenes, actividad, tickets, publicaciones y perfiles; reglas de acceso por
   fila (cada persona lo suyo, administración todo); almacenamiento para fotos.
   Sustituir `herramientas/datos.mjs` y `assets/js/api.js`; el resto no cambia.
3. **Cloudflare Pages** para publicar el portal (el contenido sigue
   editándose en el panel local y se publica con un commit).
4. Dominio o subdominio del despacho y HTTPS (lo da Cloudflare).
5. Copias de seguridad automáticas de Supabase y aviso al equipo de qué se
   registra.

### 10.3 Lo que queda del encargo de dirección
En orden propuesto:

1. **Reconocimientos y feedback** en cuatro niveles: público positivo (cuenta
   para el ranking), privado positivo, feedback constructivo privado (solo
   destinatario) y confidencial (solo dirección). Bandeja privada por persona y
   vista para dirección.
2. **Cumpleaños:** lista ordenada para dirección (en Seguimiento) y aviso a
   todo el equipo el día, también por correo.
3. **Colaboraciones:** directorio por sector (inmobiliaria, finanzas,
   educación…) y dentro por ciudad, editable desde el panel.
4. **Modelos desde el portal:** que cualquiera suba un modelo (vacío, sin datos
   de clientes) con categoría y descripción, y que informática lo apruebe.
5. **Módulos nuevos «en preparación»:** HubSpot por funcionalidad, atención
   telefónica y al cliente, nómadas digitales, nacionalidad, extranjería,
   mercantil, constitución de sociedades, técnicas de venta. Se crean en el
   panel en cuanto haya el primer vídeo de cada uno.
6. **Aviso por correo de formación nueva** a todo el equipo (ya avisa en la
   plataforma; falta configurar el correo).

### 10.4 Mejoras recomendadas
- Papel **«dirección»** separado de «administración» (seguimiento y objetivos
  sin la bandeja de informática).
- El criterio «soporte informático» de los objetivos de Ilyes alimentado por
  los datos de los tickets (resueltos, tiempo medio, valoración).
- Informe mensual del ranking en PDF, con el mismo diseño que los que publicaba
  RRHH, generado desde el panel.
- Certificado al aprobar el examen de un módulo.
- Instalable en el móvil (PWA) con avisos push para tickets y formación nueva.

### 10.5 Lo que se necesita de dirección y del equipo
- Los **vídeos** de las formaciones (grabaciones de pantalla o sesiones; se
  suben no listados o con contraseña).
- Confirmar las **metas** de cada persona y los criterios de los exámenes.
- Decidir qué ve el equipo del ranking (hoy, la puntuación de todos) y
  comunicar al equipo qué se registra.
- Las **cuentas** que falten (hoy están las 23 de Google Workspace).
