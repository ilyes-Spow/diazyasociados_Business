export default {
  id: 'leads',
  num: 12,
  grupo: 'comercial',
  titulo: 'Gestión de leads',
  resumen: 'Qué hacemos desde que entra un contacto nuevo hasta que se convierte en cita: canales, respuesta, cualificación y seguimiento.',
  duracion: 40,
  etiquetas: ['comercial'],
  lecciones: [
    {
      id: 'canales',
      titulo: 'Canales de entrada',
      md: `
## Por dónde nos llegan

> [!PENDIENTE] Ajustar a los canales realmente activos y añadir el volumen aproximado de cada uno.

| Canal | Quién lo atiende | Registro |
|---|---|---|
| Formulario de la web | Comercial | Automático en HubSpot |
| Llamada telefónica | Coordinación | Manual, en el momento |
| Correo a la dirección general | Coordinación | Vinculación al contacto |
| WhatsApp Business | Comercial | Traslado a nota de CRM |
| Redes sociales | Marketing | Traslado a CRM |
| Recomendación de cliente | Quien la recibe | Manual, marcando el origen |
| Visita sin cita | Coordinación | Manual |
| Plataformas de directorios | Comercial | Según la plataforma |

> [!IMPORTANTE] **Todo** lead entra en el CRM, sin excepción, incluso los que se descartan en la primera frase. Un lead descartado y registrado alimenta los informes; un lead descartado y no registrado hace que el despacho no sepa de dónde viene su demanda real.

## El origen del lead

Es el dato más importante y el que más se olvida rellenar. Sin él no se puede saber qué canal funciona y dónde tiene sentido invertir.

Se pregunta siempre, con naturalidad: *"¿Cómo nos has conocido?"*

Y se registra la respuesta **literal**, no una interpretación. "Me lo recomendó mi cuñado que fue cliente vuestro" es información distinta de "recomendación".

## Tiempo de primera respuesta

> [!CLAVE] El tiempo de respuesta es el factor que más influye en la conversión de un lead jurídico. Una persona con un problema legal contacta con varios despachos: normalmente contrata al primero que le da una respuesta seria.

Compromiso del despacho:

| Canal | Objetivo de primera respuesta |
|---|---|
| Llamada | Se atiende en el momento |
| Formulario web en horario | Menos de 1 hora |
| Formulario web fuera de horario | Antes de las 10:00 del siguiente día hábil |
| WhatsApp | Menos de 2 horas en horario |
| Correo | Menos de 4 horas en horario |

Aunque la respuesta sea provisional: *"Hemos recibido tu consulta, la estamos revisando y te llamamos hoy antes de las 18:00."* Eso ya te sitúa por delante de la mayoría.
`
    },
    {
      id: 'cualificacion',
      titulo: 'Cualificación del lead',
      md: `
## Objetivo de la primera conversación

**No** es resolver la consulta. Es determinar si podemos ayudar, si el asunto encaja y conseguir una cita.

> [!AVISO] El error clásico del primer contacto es dar asesoramiento gratuito por teléfono. Además de regalar el trabajo, se hace mal: sin documentación no se puede asesorar con rigor, y una opinión precipitada compromete al despacho.

Cómo salir de ahí sin sonar evasivo:

> "Por lo que me cuentas, esto tiene recorrido y es exactamente el tipo de asunto que llevamos. Para darte una respuesta seria necesito ver la documentación, porque los detalles cambian mucho el enfoque. Te propongo que nos veamos el jueves."

## Las cinco preguntas de cualificación

### 1. ¿Qué ha pasado?
Deja que lo cuente. No interrumpas los primeros noventa segundos. Toma notas.

### 2. ¿Hay algún plazo?
Fechas de notificación, de despido, de recepción de una carta, de un requerimiento. **Es lo primero que hay que determinar**: puede convertir una consulta ordinaria en urgente.

### 3. ¿Encaja con lo que hacemos?
Materia, complejidad, ámbito territorial. Si no encaja, se dice y se deriva.

### 4. ¿Hay conflicto de interés?
Nombre completo y NIF de todas las partes implicadas, comprobados en el CRM **antes de profundizar**.

### 5. ¿Es viable económicamente?
No se pregunta "¿cuánto puedes pagar?". Se explica el orden de magnitud y se observa la reacción:

> "Para que te hagas una idea, un asunto de este tipo suele moverse en el entorno de X. ¿Encaja con lo que tenías previsto?"

Si la respuesta indica que no hay encaje, es mejor saberlo ahora.

## Registro de la cualificación

Al terminar, el negocio en HubSpot debe tener:

- [ ] Materia identificada
- [ ] Urgencia y plazos anotados
- [ ] Origen del lead
- [ ] Conflicto de interés comprobado
- [ ] Importe estimado
- [ ] Fase actualizada
- [ ] Próximo paso con fecha
- [ ] Nota con el resumen de la conversación

## Descarte

Si el lead no encaja, se descarta **con elegancia**: se explica por qué, se deriva si se puede y se registra el motivo. Un lead bien descartado recomienda igual.
`
    },
    {
      id: 'seguimiento-lead',
      titulo: 'Seguimiento y recuperación',
      md: `
## Los leads no se pierden: se abandonan

La mayoría de los leads que no se convierten no dijeron que no. Simplemente dejaron de responder y nadie insistió.

## Cadencia de seguimiento

Tras un primer contacto sin cierre:

| Momento | Acción | Canal |
|---|---|---|
| Día 0 | Primera respuesta y propuesta de cita | Teléfono |
| Día 1 | Resumen por escrito de lo hablado | Correo |
| Día 3 | Seguimiento aportando algo de valor | Teléfono o WhatsApp |
| Día 7 | Segundo seguimiento | Correo |
| Día 14 | Último intento, con cierre limpio | Teléfono |
| Día 15 | Marcar como perdido con motivo, o pasar a nutrición | CRM |

> [!BUENA] Cada seguimiento debe **aportar algo**, no solo preguntar. Un artículo relevante, un dato sobre plazos, una precisión que se te ocurrió después. "¿Has pensado algo?" es el peor seguimiento posible.

## El cierre limpio

En el último intento, da una salida explícita:

> "Te llamo por última vez para no molestarte más. Si has decidido no seguir adelante o has resuelto con otro despacho, no hay ningún problema: dímelo y cierro tu consulta. Y si sigue en el aire, me dices y lo retomamos cuando te venga bien."

Esta llamada tiene una tasa de respuesta sorprendentemente alta, porque libera al interlocutor de la incomodidad de decir que no.

## Motivos de pérdida

Registrar siempre uno de estos, y solo uno:

- Precio
- Ha contratado a otro despacho
- Ha decidido no actuar
- Fuera de nuestras áreas
- Conflicto de interés
- Asunto sin viabilidad
- No responde
- Plazo ya vencido

> [!IMPORTANTE] "No responde" **no** es lo mismo que "precio". Si el 40% de tus pérdidas son "no responde", el problema no es tu precio: es tu seguimiento. Registrar el motivo real es lo que permite verlo.

## Leads a largo plazo

Un lead que no compra ahora puede comprar en un año. Si ha dado consentimiento para comunicaciones:

- Pasa a la lista de nutrición.
- Recibe contenido útil, no publicidad.
- Se revisa cada seis meses por si su situación ha cambiado.

Si no ha dado consentimiento, no se le envía comunicación comercial. Ver el módulo de Protección de datos.
`
    }
  ]
};
