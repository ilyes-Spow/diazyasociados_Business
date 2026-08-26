export default {
  id: 'incidencias',
  num: 11,
  grupo: 'operativa',
  titulo: 'Incidencias y situaciones especiales',
  resumen: 'Qué hacer cuando algo sale mal: errores, quejas, urgencias, clientes difíciles y situaciones límite.',
  duracion: 35,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'errores',
      titulo: 'Cuando cometemos un error',
      md: `
## El principio

Los errores ocurren. Lo que define a un despacho no es no cometerlos, sino **cómo reacciona** cuando ocurren.

La secuencia es siempre la misma, y el primer paso no es negociable:

### 1. Comunicar de inmediato
En cuanto detectas un error, se lo dices a tu responsable. No esperas a ver si tiene solución, no intentas arreglarlo solo primero, no lo dejas para el final del día.

### 2. Contener
Se valora qué se puede hacer todavía: subsanar, alegar, recurrir, solicitar la nulidad, negociar con la otra parte.

### 3. Evaluar el impacto real
¿Afecta al resultado del asunto? ¿Es reversible? ¿Genera un perjuicio económico?

### 4. Informar al cliente
Si el error le afecta, se le informa. Siempre. Con franqueza y con la propuesta de solución ya preparada.

### 5. Activar el seguro
Si hay posible responsabilidad profesional, se comunica al seguro **en los plazos de la póliza**. Esta decisión es de Dirección.

### 6. Corregir el proceso
Se analiza por qué ocurrió y qué cambia para que no se repita. Se documenta.

> [!IMPORTANTE] Ocultar un error es infinitamente más grave que cometerlo. Un error comunicado a tiempo casi siempre se contiene. Un error ocultado se descubre siempre, en el peor momento, y destruye la confianza.

## Cultura de error

Este despacho no sanciona al que comunica un error. Sanciona al que lo oculta. Esa distinción es lo que permite que los problemas se resuelvan.
`
    },
    {
      id: 'quejas',
      titulo: 'Quejas y reclamaciones de clientes',
      md: `
## Recibir una queja

Una queja es información. El cliente que se queja todavía quiere seguir; el que no se queja ya se ha ido.

### Cómo se recibe

1. **Escucha completa, sin interrumpir** y sin defenderte mientras habla.
2. **Toma nota** de los hechos concretos, con fechas.
3. **Reformula** para confirmar que has entendido: "Entonces lo que te preocupa es que...".
4. **Reconoce** lo que sea reconocible, sin admitir responsabilidades que no te corresponde valorar.
5. **No prometas** una solución que no puedas garantizar.
6. **Comprométete a un plazo** de respuesta y cúmplelo.

> [!AVISO] Nunca discutas con un cliente que se queja, aunque no tenga razón. Y nunca respondas en caliente por escrito. Un correo defensivo escrito con enfado se convierte en prueba.

### Después

- [ ] Registro de la queja en el CRM, como ticket
- [ ] Comunicación al responsable del expediente
- [ ] Comunicación a Dirección si es grave
- [ ] Análisis interno de lo ocurrido
- [ ] Respuesta al cliente en el plazo comprometido
- [ ] Registro de la resolución y del resultado

## Escalado obligatorio a Dirección

- El cliente menciona reclamar al Colegio de Abogados.
- El cliente menciona acciones legales contra el despacho.
- El cliente pide copia completa del expediente en tono de reclamación.
- La queja se refiere a honorarios facturados.
- La queja se refiere a un posible incumplimiento de plazo.
- El cliente publica una reseña negativa.

> [!IMPORTANTE] Nunca respondas por tu cuenta a una reclamación colegial, a un requerimiento de un abogado ajeno o a una reseña pública negativa. Ese tipo de respuestas las gestiona Dirección.

## Reseñas negativas

Se responden siempre, pero:
- Solo desde la cuenta oficial y por quien tenga esa función asignada.
- Sin confirmar jamás que la persona ha sido cliente (revelarlo vulnera el secreto profesional).
- Con tono sereno, ofreciendo un canal privado de contacto.
`
    },
    {
      id: 'urgencias',
      titulo: 'Urgencias y situaciones límite',
      md: `
## Qué es realmente urgente

No todo lo que el cliente llama urgente lo es. Es urgente lo que tiene un plazo que vence o una consecuencia inmediata e irreversible.

### Urgencias reales

| Situación | Ventana de actuación | Primer paso |
|---|---|---|
| Detención de un cliente | Inmediata | Contactar con el responsable y con el servicio de guardia |
| Plazo que vence hoy o mañana | Horas | Escalar a Dirección de inmediato |
| Embargo o ejecución inminente | Horas o días | Localizar el expediente y al responsable |
| Lanzamiento o desahucio señalado | Días | Verificar la fecha y las opciones |
| Medida cautelar contra el cliente | Horas | Escalar de inmediato |
| Requerimiento con plazo perentorio | Según plazo | Registrar, calcular y escalar |

> [!PENDIENTE] Definir el protocolo de guardia del despacho: teléfono de urgencias, quién está disponible fuera de horario, y cómo se activa.

### No son urgencias

- Un cliente que quiere hablar "ahora mismo" sin motivo con plazo.
- Una consulta que puede esperar a mañana.
- Una duda sobre una factura.

Tratarlo todo como urgente hace que las urgencias reales pasen desapercibidas.

## Situaciones delicadas

### Cliente en situación de vulnerabilidad
Violencia de género, riesgo para menores, riesgo de exclusión, crisis emocional grave.

- Escalar siempre a un responsable.
- No dar consejo fuera del ámbito jurídico.
- Conocer y facilitar los recursos públicos disponibles.
- Extremar el cuidado con la confidencialidad: comprobar a qué teléfono y correo es seguro escribir.

> [!IMPORTANTE] En casos de violencia de género, **nunca** envíes comunicaciones a un domicilio o teléfono que pueda ser accesible por el agresor. Confirma siempre con la clienta el canal seguro y déjalo anotado en el expediente.

### Cliente agresivo
- Mantén el tono bajo y las frases cortas.
- No respondas a la agresión.
- Si hay amenazas o la situación se descontrola, termina la conversación educadamente y avisa a un responsable.
- Registra lo ocurrido por escrito el mismo día.

### Petición de actuación irregular
Si un cliente pide algo que puede ser ilícito (ocultar bienes, falsear un documento, aportar prueba manipulada):

- No lo discutas ni lo valores en el momento.
- Di que lo consultas.
- Escala inmediatamente a Dirección.

Nunca se acepta. Y en algunos supuestos puede existir un deber de comunicación que valorará Dirección.

## Incidencias técnicas

| Incidencia | Primer paso | A quién |
|---|---|---|
| Caída del CRM o del gestor documental | Comprobar si es general o local | Responsable de sistemas |
| Fallo en presentación electrónica | Captura con hora visible | Responsable del expediente |
| Sospecha de acceso no autorizado | **No apagar el equipo**, desconectar de la red | Dirección, de inmediato |
| Correo sospechoso o intento de fraude | No abrir adjuntos, no responder | Responsable de sistemas |
| Pérdida o robo de un equipo | Comunicar en el momento | Dirección y sistemas |

> [!IMPORTANTE] Una posible brecha de seguridad tiene un plazo de notificación a la autoridad de protección de datos de **72 horas** desde que se tiene conocimiento. Cada hora de retraso en comunicarlo internamente consume ese plazo.
`
    }
  ]
};
