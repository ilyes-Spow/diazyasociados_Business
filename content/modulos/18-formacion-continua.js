export default {
  id: 'formacion-continua',
  num: 18,
  grupo: 'desarrollo',
  titulo: 'Formación continua y actualizaciones',
  resumen: 'Cómo se mantiene actualizado el equipo, cómo se incorporan novedades y cómo contribuyes tú a esta plataforma.',
  duracion: 25,
  etiquetas: ['desarrollo'],
  lecciones: [
    {
      id: 'sistema',
      titulo: 'El sistema de formación del despacho',
      md: `
## Por qué es obligatorio mantenerse al día

En un despacho, estar desactualizado no es una carencia formativa: es un riesgo de responsabilidad profesional. Una norma que cambió hace seis meses y no conoces puede costar un asunto.

Además, los profesionales colegiados tienen obligaciones de formación continua propias.

## Los cuatro niveles

### 1. Actualización normativa
Seguimiento de los cambios que afectan a nuestras áreas.

> [!PENDIENTE] Definir quién sigue qué área, con qué fuentes y con qué periodicidad.

Fuentes recomendadas: boletines oficiales, circulares del Colegio, bases de datos jurídicas contratadas, newsletters especializadas.

### 2. Formación técnica
Cursos, seminarios y jornadas. El despacho apoya la formación relacionada con el puesto.

> [!PENDIENTE] Definir la política: presupuesto anual por persona, horas de formación en jornada laboral y procedimiento de solicitud.

### 3. Formación interna
Sesiones del propio equipo. La persona que ha llevado un asunto complejo o ha aprendido una herramienta lo comparte con el resto.

Formato recomendado: 30 minutos, una vez al mes, un tema, quien lo domina lo explica.
Las sesiones se graban y se publican aquí, para quien no pudiera asistir y para
las incorporaciones futuras.

:::video
https://www.youtube.com/watch?v=aqz-KE-bpKQ
Sesión interna de ejemplo
:::

> [!PENDIENTE] Sustituir por la grabación real de la primera sesión interna.
> Las grabaciones se suben a YouTube **como no listadas** o a Vimeo con
> contraseña: nunca públicas, porque pueden contener referencias a asuntos.


### 4. Esta plataforma
El conocimiento operativo del despacho. Se actualiza continuamente.

## Compromiso individual

- [ ] Revisar las Novedades de la plataforma al menos una vez por semana
- [ ] Completar los módulos obligatorios de tu área
- [ ] Rehacer los módulos que se marquen como actualizados
- [ ] Aportar al menos una mejora al año a esta plataforma
- [ ] Participar en las sesiones internas
`
    },
    {
      id: 'novedades-uso',
      titulo: 'Cómo se gestionan las novedades',
      md: `
## Qué es una novedad

Cualquier cambio que afecte a cómo trabaja el equipo:

- Una herramienta nueva o una función nueva de una existente.
- Un cambio de procedimiento interno.
- Un cambio normativo relevante para nuestras áreas.
- Una plantilla nueva o modificada.
- Un cambio en tarifas, plazos o formularios de un organismo.
- Una incidencia recurrente y cómo evitarla.

## Circuito de una novedad

1. **Detección.** Cualquier persona del equipo puede detectarla.
2. **Comunicación** al responsable del área correspondiente.
3. **Verificación.** Se comprueba que es real y se determina el alcance.
4. **Publicación** en la sección de Novedades de esta plataforma.
5. **Actualización** del módulo afectado, si procede.
6. **Aviso** al equipo si el cambio es crítico.

> [!CLAVE] Si detectas algo que ha cambiado y no lo comunicas, el resto del equipo seguirá haciéndolo mal. Comunicarlo cuesta dos minutos.

## Niveles de una novedad

| Nivel | Qué significa | Cómo se comunica |
|---|---|---|
| Crítica | Afecta a plazos, cumplimiento o seguridad | Publicación + aviso directo + punto en reunión |
| Importante | Cambia un procedimiento habitual | Publicación + mención en reunión semanal |
| Informativa | Conviene saberlo | Publicación en Novedades |

## Herramientas nuevas

Cuando se incorpora una herramienta:

- [ ] Justificación de para qué se necesita
- [ ] Verificación de protección de datos y contrato de encargado de tratamiento
- [ ] Responsable interno asignado
- [ ] Formación al equipo antes del uso
- [ ] Módulo o ficha creada en esta plataforma
- [ ] Novedad publicada
- [ ] Herramienta que sustituye, retirada

> [!AVISO] Ninguna herramienta se usa con datos de clientes antes de completar esta lista. Ni siquiera en pruebas.
`
    },
    {
      id: 'contribuir',
      titulo: 'Cómo contribuir a esta plataforma',
      md: `
## Esta plataforma es del equipo

No la mantiene una sola persona. Cada uno de nosotros la mejora cuando detecta algo incompleto, desactualizado o confuso.

## Qué puedes aportar

- **Correcciones**: algo que ya no funciona así.
- **Precisiones**: un paso que falta y que descubriste sobre la marcha.
- **Fichas de trámite** nuevas, especialmente de los trámites que hagas por primera vez.
- **Preguntas frecuentes** que te hagan los clientes y la respuesta que funciona.
- **Errores frecuentes** que hayas visto cometer, para que otros no los repitan.

## Cómo se propone un cambio

> [!PENDIENTE] Definir el canal concreto: correo a una dirección, ticket, formulario o edición directa por parte de las personas autorizadas.

Formato de la propuesta:

    MÓDULO: cuál
    LECCIÓN: cuál
    QUÉ ESTÁ MAL O FALTA: ...
    PROPUESTA DE TEXTO: ...
    FUENTE O MOTIVO: ...

## Cómo se escribe contenido para esta plataforma

Si te toca redactar un módulo o una ficha:

1. **Escribe para quien no sabe nada.** No des por supuesto contexto.
2. **Pasos numerados** para procedimientos, listas para comprobaciones.
3. **Ejemplos concretos.** Un ejemplo vale más que tres párrafos de teoría.
4. **Marca lo que falta** con una llamada de tipo pendiente, en lugar de dejarlo vago.
5. **Sin datos reales de clientes.** Ni en ejemplos. Se inventan.
6. **Fecha de revisión** en todo contenido que dependa de normativa o de tarifas.

## Revisión periódica de contenidos

> [!PENDIENTE] Asignar un responsable por módulo y fijar la periodicidad de revisión.

Criterio: todo módulo debe revisarse al menos **una vez al año**, y siempre que se produzca un cambio que le afecte. Los módulos de cumplimiento y fiscalidad, con mayor frecuencia.

> [!BUENA] La mejor contribución que puedes hacer en tus primeras semanas es anotar **todo lo que no encuentras aquí**. Eres la única persona del despacho que ve la plataforma con ojos nuevos, y esa perspectiva se pierde en un mes.
`
    }
  ]
};
