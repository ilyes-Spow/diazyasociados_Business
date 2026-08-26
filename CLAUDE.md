# Plataforma de formación interna · Díaz y Asociados

Sitio estático para el onboarding y la formación del equipo de un despacho de
abogados. Sin dependencias, sin compilación: HTML, CSS y JavaScript nativo con
módulos ES.

## Comandos

- `npm run dev` — servidor local en el puerto 8099
- `npm run validar` — comprueba la integridad de los contenidos (**ejecutar antes de cada commit**)
- `npm run empaquetar` — genera `dist/formacion-diazyasociados.html`, versión de un solo archivo
- `npm run clave -- "Clave"` — calcula la huella SHA-256 de una clave de acceso

## Arquitectura

- `content/` es la única fuente de contenidos y está separada del código.
  `curriculo.js` registra módulos y grupos; `modulos/NN-slug.js` contiene cada
  módulo; `novedades.js` es el histórico de novedades.
- `assets/js/markdown.js` es un renderizador propio de un subconjunto de
  Markdown. No hay librería externa.
- `assets/js/vistas.js` genera el HTML de cada pantalla como cadena de texto.
- `assets/js/app.js` contiene el enrutador por hash, la puerta de acceso y la
  delegación de eventos sobre `#vista`.
- `assets/js/estado.js` encapsula todo el acceso a `localStorage`, tolerante a
  fallos (navegación privada, almacenamiento lleno).

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
