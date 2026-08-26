export default {
  id: 'control-clientes',
  num: 7,
  grupo: 'herramientas',
  titulo: 'Control y gestión de clientes',
  resumen: 'Alta, seguimiento y mantenimiento de la relación con el cliente a lo largo de todo el ciclo de vida.',
  duracion: 35,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'alta',
      titulo: 'Alta de cliente',
      md: `
## El momento del alta

Un lead se convierte en cliente cuando **acepta el presupuesto y firma la hoja de encargo**. No antes. Hasta entonces sigue siendo un lead, aunque parezca seguro.

## Checklist de alta

- [ ] Comprobación de conflicto de interés realizada y registrada
- [ ] Identificación verificada (DNI/NIE/CIF) y copia archivada
- [ ] Datos completos en el CRM: nombre, NIF, dirección, teléfono, correo
- [ ] Hoja de encargo firmada y archivada
- [ ] Información de protección de datos entregada y consentimiento registrado
- [ ] Provisión de fondos solicitada, si procede
- [ ] Expediente creado en el gestor documental con la estructura estándar
- [ ] Responsable asignado en el CRM
- [ ] Plazos iniciales identificados y anotados en la agenda
- [ ] Cliente informado de quién es su interlocutor y cómo contactar

> [!IMPORTANTE] En los supuestos sujetos a la normativa de prevención de blanqueo de capitales, la identificación formal del cliente y del titular real es **obligatoria antes de iniciar la relación de negocio**, no después. Consulta con Dirección si tienes dudas sobre si un encargo está sujeto.

## Verificación de identidad

- Documento en vigor. Si está caducado, se pide el nuevo.
- Copia legible, completa y por ambas caras.
- Si actúa en representación de otra persona o de una sociedad, se pide y archiva el **poder** o la escritura que acredite la representación.
- Se comprueba que quien firma tiene facultades para hacerlo.

> [!AVISO] Firmar una hoja de encargo con quien no tiene capacidad de representación deja al despacho sin cobertura y sin cliente. Comprueba siempre las facultades.
`
    },
    {
      id: 'seguimiento',
      titulo: 'Seguimiento durante el asunto',
      md: `
## El compromiso de información

El cliente tiene derecho a saber en qué punto está su asunto. El despacho se compromete a informarle **de forma proactiva**, sin esperar a que pregunte.

> [!PENDIENTE] Fijar el compromiso concreto del despacho: cada cuánto se informa al cliente por defecto y en qué plazo se responde a una consulta.

Compromiso de referencia:

| Situación | Acción | Plazo |
|---|---|---|
| Novedad relevante en el asunto | Comunicación al cliente | Mismo día o siguiente día hábil |
| Consulta del cliente por correo | Respuesta, aunque sea provisional | 24 horas hábiles |
| Sin novedades | Informe de estado proactivo | Cada 30 días |
| Recepción de resolución judicial | Comunicación y explicación | 48 horas |
| Cambio de responsable | Comunicación al cliente | Antes del cambio efectivo |

> [!CLAVE] El "no hay novedades" es una novedad. Un cliente que lleva seis semanas sin saber nada asume que su asunto está abandonado, aunque esté perfectamente atendido.

## Cómo se comunica una mala noticia

1. **Por teléfono o en persona, nunca solo por correo.**
2. Directo, sin rodeos ni tecnicismos innecesarios.
3. Explica qué significa en términos prácticos para él.
4. Explica qué opciones quedan y cuál recomiendas.
5. Confirma después por escrito lo hablado.

## Registro del seguimiento

Toda comunicación con el cliente se registra en el CRM. La regla del módulo anterior se aplica aquí sin excepción: **si no está registrado, no ha pasado**.
`
    },
    {
      id: 'cartera',
      titulo: 'Mantenimiento de cartera y fidelización',
      md: `
## Segmentación de la cartera

No todos los clientes requieren la misma atención. Segmentar permite dedicar el esfuerzo donde tiene sentido.

> [!PENDIENTE] Definir la segmentación real del despacho y los criterios de cada segmento.

| Segmento | Criterio orientativo | Atención |
|---|---|---|
| Cliente recurrente / iguala | Relación continuada, facturación estable | Interlocutor fijo, revisión periódica programada |
| Cliente de asunto puntual activo | Un asunto en curso | Seguimiento según compromiso de información |
| Cliente inactivo | Sin asunto vivo, relación anterior | Contacto de mantenimiento periódico |
| Cliente perdido | Terminó insatisfecho o se fue | Análisis del motivo, no contacto comercial |

## Fin del asunto: el momento más desaprovechado

Cuando un asunto termina, la mayoría de los despachos cierran el expediente y se olvidan. Es el peor momento para desaparecer: el cliente acaba de comprobar tu trabajo.

Al cerrar un asunto:

- [ ] Comunicación de cierre explicando el resultado y qué implica
- [ ] Devolución de documentación original al cliente, con registro
- [ ] Factura final emitida y saldo comprobado
- [ ] Información sobre plazos posteriores que le afecten (recursos, ejecución, prescripción)
- [ ] Petición de valoración o reseña, si procede
- [ ] Expediente cerrado en CRM y archivado en el gestor documental
- [ ] Anotación de posibles necesidades futuras detectadas

> [!BUENA] Al cerrar, pregunta siempre: "¿hay algo más en lo que estés pensando y que te preocupe?" Es la pregunta que más asuntos nuevos genera en un despacho, y no suena a venta.

## Reactivación de clientes inactivos

- Nunca con un correo masivo genérico.
- Siempre con un motivo real: un cambio normativo que le afecta, un vencimiento próximo, una novedad de su sector.
- Desde la persona que le atendió, no desde una cuenta genérica.

## Indicadores de riesgo de fuga

Vigila estas señales y actúa antes de perderlo:
- Deja de responder a correos que antes contestaba.
- Pregunta por honorarios de forma inusual.
- Pide copia completa de su expediente.
- Empieza a copiar a terceros en las comunicaciones.
- Retrasa pagos que antes hacía puntualmente.
`
    }
  ]
};
