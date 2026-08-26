export default {
  id: 'citas',
  num: 8,
  grupo: 'operativa',
  titulo: 'Gestión de citas y agenda',
  resumen: 'Cómo se agenda, se confirma y se prepara una cita, y cómo se controlan los vencimientos.',
  duracion: 30,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'agendar',
      titulo: 'Agendar una cita',
      md: `
## La agenda es única y compartida

No existen agendas paralelas. Todo lo que ocupa tiempo de una persona del equipo está en la agenda compartida: citas, vistas, desplazamientos, reuniones internas, ausencias y bloqueos de trabajo concentrado.

Si tu agenda dice que estás libre, se te puede agendar algo. Bloquea lo que necesites.

## Datos mínimos de una cita

Toda cita creada debe llevar:

- **Título**: tipo de cita + nombre del cliente. Ejemplo: "Primera visita - María López".
- **Fecha, hora e **duración realista** (no todas las citas duran 30 minutos).
- **Modalidad**: presencial, videollamada o teléfono.
- **Ubicación o enlace** de la videollamada.
- **Asistentes** internos.
- **Vinculación** al contacto y al negocio en el CRM.
- **Nota** con el motivo y lo que hay que preparar.

> [!AVISO] Nunca agendes una cita sin teléfono de contacto del cliente. Si hay que avisar de un cambio de última hora y no tienes su móvil, el problema es tuyo.

## Tipos de cita y duración orientativa

> [!PENDIENTE] Ajustar duraciones al criterio real del despacho.

| Tipo | Duración | Preparación previa |
|---|---|---|
| Primera visita | 45-60 min | Revisar el lead y la documentación enviada |
| Seguimiento de asunto | 30 min | Revisar el expediente y el estado actual |
| Firma de documentación | 20 min | Documentos impresos o firma electrónica preparada |
| Videollamada de consulta | 30 min | Enlace enviado con 24 h de antelación |
| Vista o comparecencia | Bloque completo + desplazamiento | Expediente preparado el día anterior |

## Reglas de agenda

- **Margen entre citas**: mínimo 15 minutos. Las citas se alargan.
- **Desplazamientos**: se bloquean en la agenda, ida y vuelta.
- **No se agenda sobre una vista.** Nunca.
- **Primera hora de la mañana**: se reserva para el repaso de agenda, no para citas.
`
    },
    {
      id: 'confirmacion',
      titulo: 'Confirmación, recordatorios y ausencias',
      md: `
## Confirmación

Toda cita se confirma **dos veces**:

1. **Al agendarla**: correo o mensaje con fecha, hora, lugar, duración prevista y qué debe traer.
2. **24 horas antes**: recordatorio breve pidiendo confirmación.

Si a las 24 horas el cliente no confirma, se le llama. Una cita no confirmada por teléfono tiene el doble de probabilidad de no presentarse.

## Qué incluye la confirmación inicial

- Fecha, hora y duración prevista.
- Dirección exacta con indicaciones de acceso y aparcamiento, o enlace de videollamada.
- Nombre de quien le atenderá.
- **Documentación que debe traer**, en lista concreta.
- Qué hacer si no puede acudir.

> [!BUENA] Enviar la lista de documentación con la confirmación multiplica la utilidad de la primera visita. Una primera visita sin documentos obliga a una segunda visita y retrasa el asunto semanas.

## Si el cliente no se presenta

1. Llamada a los 10 minutos de la hora prevista.
2. Si no contesta, mensaje ofreciendo reprogramar.
3. Registro en el CRM como cita no celebrada, con el motivo.
4. Segundo intento de contacto en 48 horas.
5. Si tras dos ausencias no hay respuesta, se registra y se comunica al responsable.

> [!NOTA] Registrar las ausencias no es burocracia: un cliente que falla repetidamente a sus citas es un indicador de riesgo del asunto y de impago.

## Si somos nosotros los que no podemos

- Aviso al cliente **en cuanto se sabe**, nunca el mismo día si se sabía antes.
- Llamada telefónica, no solo correo.
- Propuesta de nueva fecha en la misma comunicación.
- Disculpa clara, sin excusas largas.

## Cancelaciones y reprogramaciones

Se registran siempre en el CRM con el motivo. Una cita borrada de la agenda sin rastro impide reconstruir qué pasó.
`
    },
    {
      id: 'vencimientos',
      titulo: 'Control de plazos y vencimientos',
      md: `
## El sistema de doble anotación

Todo plazo con consecuencias jurídicas se anota **en dos sitios**:

1. En la **agenda compartida**, como evento de día completo.
2. En el **expediente del CRM**, como tarea con responsable.

Y siempre con **recordatorios anticipados**, no solo el día del vencimiento.

## Escalonado de recordatorios

| Antelación | Acción |
|---|---|
| Al conocer el plazo | Anotación en agenda y tarea en CRM |
| 15 días antes | Revisión: ¿tenemos todo lo necesario? |
| 7 días antes | Recordatorio activo al responsable |
| 3 días antes | Alerta. Si no está listo, se escala |
| Día del vencimiento | Bloque de agenda reservado |

> [!IMPORTANTE] Un plazo procesal perdido es, casi siempre, irreversible y constituye responsabilidad profesional. **Nunca** confíes un plazo solo a tu memoria ni a una nota en papel.

## Cómo se calcula y se anota

- Anota **la fecha real de vencimiento**, ya calculada, no "20 días desde la notificación".
- Deja constancia en la nota de **cómo se ha calculado**: fecha de notificación, tipo de días (hábiles o naturales), norma aplicable.
- Ten en cuenta el mes de agosto y los días inhábiles del calendario judicial correspondiente.
- Ante la mínima duda sobre el cómputo, **consulta antes de anotar**.

> [!AVISO] Un error de cómputo anotado se propaga a todos los recordatorios. Verifica el cálculo con un compañero cuando el plazo sea crítico.

## Revisión periódica

- **Diaria**: Coordinación repasa los vencimientos de los próximos 7 días.
- **Semanal**: cada responsable repasa sus vencimientos del mes.
- **Mensual**: revisión de cartera, con foco en expedientes sin movimiento.

## Si un plazo está en riesgo

No esperes al último día. En cuanto detectes que no vas a llegar:

1. Comunícalo a tu responsable **inmediatamente**.
2. Valora las alternativas: solicitud de prórroga, suspensión, presentación parcial.
3. Documenta lo que se decida.

Un plazo en riesgo comunicado a tiempo casi siempre tiene solución. Comunicado el día antes, casi nunca.
`
    }
  ]
};
