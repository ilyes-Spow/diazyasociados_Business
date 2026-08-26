export default {
  id: 'hubspot',
  num: 6,
  grupo: 'herramientas',
  titulo: 'HubSpot / CRM',
  resumen: 'Cómo trabajamos en el CRM: contactos, empresas, negocios, tareas y notas. La fuente de verdad del despacho.',
  duracion: 45,
  etiquetas: ['obligatorio', 'herramientas', 'comercial'],
  lecciones: [
    {
      id: 'conceptos',
      titulo: 'Conceptos básicos de HubSpot',
      md: `
## Los cuatro objetos que usamos

HubSpot organiza la información en objetos relacionados entre sí. Entender la diferencia evita el 90% de los errores de uso.

| Objeto | Qué representa | Ejemplo |
|---|---|---|
| **Contacto** | Una persona | María López, con su teléfono y su correo |
| **Empresa** | Una organización | Reformas López S.L. |
| **Negocio** (deal) | Una oportunidad concreta con un importe y una fase | "Despido improcedente - María López" |
| **Ticket** | Una incidencia o solicitud de servicio | "Reclamación de factura duplicada" |

Además usamos:
- **Tareas**: lo que tienes que hacer, con fecha.
- **Notas**: lo que ha pasado, con fecha.
- **Actividades**: llamadas, correos y reuniones registradas.

> [!CLAVE] Un mismo cliente puede tener **varios negocios** a lo largo del tiempo. No se reutiliza un negocio cerrado para un asunto nuevo: se crea uno nuevo. Así se conserva el histórico real.

## Contacto frente a empresa

- Si el cliente es un **particular**, se crea solo el contacto.
- Si el cliente es una **empresa**, se crea la empresa **y** el contacto de la persona con la que hablamos, asociándolos.
- La facturación se emite a quien corresponda jurídicamente, que no siempre es con quien hablas.

> [!AVISO] Nunca crees un contacto duplicado. Antes de crear, **busca por teléfono, por correo y por NIF**. Los duplicados rompen los informes y hacen que un cliente reciba comunicaciones dos veces.

## Qué NO va en HubSpot

- Documentación pesada del expediente (va al gestor documental; en HubSpot se enlaza).
- Datos de categorías especiales sin necesidad justificada (salud, ideología, condenas penales). Ver el módulo de Protección de datos.
- Comentarios personales sobre el cliente. Todo lo que escribas puede ser objeto de un derecho de acceso.
`
    },
    {
      id: 'ciclo',
      titulo: 'El ciclo de vida en el CRM',
      md: `
## Del lead al cliente

Todo contacto recorre un ciclo. Mantener actualizada la fase es lo que permite saber en qué estado real está el despacho.

> [!PENDIENTE] Ajustar los nombres de fases al pipeline realmente configurado en la cuenta de HubSpot del despacho.

### Fases del pipeline comercial

| Fase | Qué significa | Qué hay que hacer para avanzar |
|---|---|---|
| Nuevo lead | Ha entrado un contacto, sin cualificar | Contactar en menos de 24 h |
| Contactado | Hemos hablado con él | Cualificar: materia, urgencia, viabilidad, capacidad de pago |
| Cualificado | Encaja con nuestros servicios | Agendar primera cita |
| Cita agendada | Tiene fecha en la agenda | Celebrar la cita y analizar el asunto |
| Presupuesto enviado | Tiene una propuesta por escrito | Seguimiento hasta respuesta |
| Ganado | Ha aceptado y firmado la hoja de encargo | Abrir expediente |
| Perdido | No sigue adelante | Registrar **el motivo real** de la pérdida |

> [!IMPORTANTE] Marcar un negocio como perdido **sin motivo** es peor que no marcarlo. El motivo de pérdida es la información más valiosa que genera el despacho: dice si perdemos por precio, por plazo, por competencia o por falta de seguimiento.

## Propiedades obligatorias

Antes de mover un negocio a "Ganado", estas propiedades deben estar rellenas:

- [ ] Nombre y apellidos completos / razón social
- [ ] NIF o CIF
- [ ] Teléfono y correo verificados
- [ ] Dirección a efectos de facturación
- [ ] Materia del asunto
- [ ] Origen del lead
- [ ] Importe del negocio
- [ ] Responsable asignado
- [ ] Fecha prevista de cierre

## Higiene del CRM

Una vez por semana, revisa tu vista de negocios y comprueba:
- Ningún negocio lleva más de 15 días sin actividad registrada.
- Ninguna tarea está vencida sin cerrar o reprogramar.
- Ningún negocio está en una fase que ya no corresponde con la realidad.

> [!BUENA] Bloquea 20 minutos fijos en tu agenda, el mismo día cada semana, para la higiene del CRM. Si no lo agendas, no se hace.
`
    },
    {
      id: 'notas-tareas',
      titulo: 'Notas, tareas y registro de actividad',
      md: `
## Cómo se escribe una nota útil

Una nota es para el compañero que abrirá el expediente dentro de seis meses sin contexto. Y potencialmente para el propio cliente, que puede pedir acceso a sus datos.

### Estructura recomendada

    [CANAL] Fecha - Con quién
    QUÉ NOS DICE: ...
    QUÉ HEMOS DICHO: ...
    ACORDADO: ...
    PRÓXIMO PASO: ... (con fecha)

### Ejemplo

    [LLAMADA] 12/03 - María López
    QUÉ NOS DICE: Ha recibido carta de despido con fecha 10/03. Antigüedad 6 años.
    Dice que no le han pagado las dos últimas nóminas.
    QUÉ HEMOS DICHO: El plazo para papeleta de conciliacion son 20 dias habiles
    desde el despido. Necesitamos carta, contrato y ultimas 6 nominas.
    ACORDADO: Envia documentacion antes del 15/03. Cita presencial el 18/03 a las 11:00.
    PRÓXIMO PASO: Si el 15/03 no ha enviado, llamar. Tarea creada.

> [!AVISO] Nunca escribas en una nota juicios de valor sobre el cliente, comentarios sobre su aspecto, su situación personal o su solvencia percibida. El cliente tiene derecho a acceder a todos sus datos, incluidas las notas.

## Tareas

Toda nota que termine en "hay que hacer algo" debe generar una **tarea con fecha y responsable**. Sin fecha, no es una tarea: es un deseo.

Reglas:
- El título de la tarea empieza por un verbo: "Llamar a...", "Enviar...", "Revisar...".
- La fecha es la fecha en que hay que hacerla, no la fecha límite del asunto.
- Si la tarea depende de otra persona, se le asigna a esa persona, no a ti.
- Una tarea vencida se cierra o se reprograma; no se deja vencida.

## Registro de llamadas y correos

- **Correos**: con la integración activada se registran solos. Comprueba que el correo queda asociado al contacto correcto.
- **Llamadas**: se registran manualmente. Duración aproximada, resultado y nota.
- **Reuniones**: se registran con el resultado y los acuerdos.
- **WhatsApp o canales no integrados**: se traslada el contenido relevante a una nota.

> [!CLAVE] La regla práctica: **si has hablado con un cliente y no queda rastro en HubSpot, no has hablado con él.**
`
    },
    {
      id: 'automatizaciones',
      titulo: 'Vistas, informes y automatizaciones',
      md: `
## Vistas que deberías tener guardadas

Configura estas vistas en tu panel el primer día:

1. **Mis negocios abiertos**, ordenados por fecha de cierre prevista.
2. **Mis tareas de hoy y vencidas.**
3. **Negocios sin actividad en más de 15 días.**
4. **Leads nuevos sin contactar.**
5. **Mis expedientes activos** (si se gestionan como objeto personalizado o negocio).

## Informes que mira Dirección

> [!PENDIENTE] Confirmar qué informes están realmente configurados y quién los revisa.

- Leads entrados por origen y por semana.
- Tasa de conversión de lead a cita, y de cita a cliente.
- Tiempo medio de primera respuesta a un lead.
- Motivos de pérdida agrupados.
- Facturación prevista por fase del pipeline.

Estos informes solo son fiables si el CRM está bien alimentado. Cada campo que dejas vacío es una decisión que el despacho toma a ciegas.

## Automatizaciones activas

> [!PENDIENTE] Documentar los workflows realmente activos en la cuenta, quién los mantiene y qué hacer si uno falla.

Ejemplos de automatizaciones habituales:
- Correo automático de confirmación al recibir un formulario de la web.
- Tarea automática de seguimiento a los 3 días de enviar un presupuesto.
- Recordatorio de cita al cliente 24 horas antes.
- Alerta interna si un lead lleva más de 24 horas sin contactar.

> [!AVISO] No crees automatizaciones por tu cuenta sin avisar. Un workflow mal configurado puede enviar decenas de correos a clientes reales en minutos, y eso no se deshace.

## Si algo no funciona

1. Comprueba que el problema no es tu vista o tu filtro.
2. Reprodúcelo una segunda vez y anota los pasos exactos.
3. Captura de pantalla.
4. Comunícalo al responsable de la herramienta con los pasos y la captura.

No intentes arreglarlo tocando la configuración global.
`
    }
  ]
};
