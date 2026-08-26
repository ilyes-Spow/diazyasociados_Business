/* ===============================================================
   novedades.js - Registro de novedades del despacho
   ---------------------------------------------------------------
   Añade cada nueva entrada AL PRINCIPIO del array.
   Niveles: 'critica' | 'importante' | 'informativa'
   Etiquetas sugeridas: Herramientas, Procedimiento, Normativa,
   Plantillas, Formación, Seguridad.
   =============================================================== */

export default [
  {
    fecha: '2026-08-26',
    nivel: 'importante',
    etiquetas: ['Formación', 'Herramientas'],
    titulo: 'Se publica la plataforma de formación interna',
    md: `
Ya está disponible la plataforma de formación interna del despacho, con **18 módulos** que cubren desde la bienvenida hasta el cumplimiento normativo.

**Qué tienes que hacer ahora:**

- Completa los módulos marcados como obligatorios de tu área.
- Si acabas de incorporarte, sigue el itinerario en orden desde el módulo 1.
- Revisa esta sección de Novedades una vez por semana.

**Cómo funciona:**

- Tu progreso se guarda automáticamente en este navegador.
- Puedes buscar en todo el contenido con la tecla barra inclinada o el botón de búsqueda.
- Cada lección se marca como completada con el botón del final.

> [!PENDIENTE] Muchos módulos contienen apartados marcados como pendientes de completar con los datos reales del despacho (organigrama, tarifas, canales, calendario fiscal, herramientas contratadas). Es la primera tarea a abordar antes de dar la plataforma por cerrada.
`
  },
  {
    fecha: '2026-08-26',
    nivel: 'informativa',
    etiquetas: ['Procedimiento'],
    titulo: 'Cómo proponer cambios en los contenidos',
    md: `
Esta plataforma la mantiene todo el equipo. Si detectas algo desactualizado, incompleto o confuso:

1. Identifica el **módulo** y la **lección**.
2. Explica qué está mal o qué falta.
3. Propón el texto alternativo si puedes.

Ver el módulo 18, lección "Cómo contribuir a esta plataforma", para el formato completo.
`
  }
];
