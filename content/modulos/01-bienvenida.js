export default {
  id: 'bienvenida',
  num: 1,
  grupo: 'fundamentos',
  titulo: 'Bienvenida y funcionamiento del despacho',
  resumen: 'Quiénes somos, cómo trabajamos y qué se espera de ti durante tus primeras semanas en Díaz y Asociados.',
  duracion: 30,
  etiquetas: ['onboarding', 'obligatorio'],
  lecciones: [
    {
      id: 'quienes-somos',
      titulo: 'Quiénes somos',
      md: `
## Bienvenido o bienvenida al equipo

Si estás leyendo esto es porque acabas de incorporarte a **Díaz y Asociados**. Esta plataforma es el punto de partida: aquí encontrarás cómo funciona el despacho, qué herramientas usamos y cuáles son los procedimientos que seguimos en el día a día.

No hace falta que lo leas todo hoy. Sigue el itinerario en orden y marca cada lección como completada según avances. Tu progreso se guarda en este navegador.

## Nuestra razón de ser

Somos un despacho de servicios jurídicos que trabaja con particulares y empresas. Lo que nos diferencia no es únicamente el conocimiento técnico: es **la forma en que acompañamos al cliente**.

Un cliente que acude a un despacho suele llegar con un problema que le preocupa y con poca información sobre cómo se va a resolver. Nuestro trabajo tiene dos dimensiones inseparables:

1. **Resolver bien el asunto** desde el punto de vista jurídico.
2. **Que el cliente entienda en todo momento** en qué punto está, qué va a pasar después y cuánto le va a costar.

Un expediente técnicamente impecable con un cliente desinformado es un trabajo mal hecho.

## Los tres principios que rigen el despacho

### 1. Nada se queda sin registrar
Toda conversación relevante con un cliente, todo documento y todo plazo tiene que quedar reflejado en el CRM y en el expediente. Si no está registrado, para el despacho no existe. Esto no es burocracia: es lo que permite que cualquier compañero pueda continuar un asunto si tú estás de vacaciones o de baja.

### 2. Los plazos son sagrados
En derecho, un plazo perdido rara vez tiene remedio. Cualquier fecha con consecuencias jurídicas se anota en la agenda **el mismo día en que se conoce**, con recordatorios anticipados.

### 3. Ante la duda, se pregunta
Nadie espera que sepas todo desde el primer día. Se espera que preguntes antes de actuar cuando no estés seguro. Un error detectado a tiempo cuesta cinco minutos; un error enviado al cliente o al juzgado puede costar el asunto.

> [!CLAVE] Si tuvieras que quedarte con una sola frase de todo el onboarding: **registra, avisa y pregunta**.
`
    },
    {
      id: 'estructura',
      titulo: 'Estructura y áreas del despacho',
      md: `
## Cómo se organiza el equipo

El despacho se organiza en áreas funcionales. Cada persona tiene un área principal, pero es habitual colaborar entre áreas en asuntos complejos.

| Área | De qué se ocupa | Interlocución principal |
|---|---|---|
| Dirección | Estrategia, decisiones sobre asuntos delicados, aprobación de presupuestos fuera de tarifa | Todo el equipo |
| Asesoría jurídica | Estudio de asuntos, redacción de escritos, representación | Cliente y organismos |
| Coordinación / Secretaría | Agenda, entrada de documentación, seguimiento de plazos, atención telefónica | Cliente y equipo |
| Comercial | Primer contacto, cualificación de leads, presupuestos, cierre | Lead y cliente nuevo |
| Administración | Facturación, cobros, contabilidad, proveedores | Cliente y gestoría |
| Marketing | Comunicación, captación, contenidos, presencia digital | Público general |

> [!PENDIENTE] Completar con el organigrama real del despacho: nombres, cargos, extensiones telefónicas y correos internos de cada área.

## A quién dirigirte según el tema

- **Duda jurídica sobre un asunto concreto** → responsable del expediente.
- **Duda de procedimiento interno** → Coordinación.
- **Problema con una herramienta o acceso** → responsable de sistemas.
- **Duda sobre una factura o un cobro** → Administración.
- **Cliente descontento o incidencia grave** → tu responsable directo, de inmediato.

## Tu responsable directo

Desde el primer día tienes asignada una persona de referencia. Es tu primer punto de contacto para cualquier duda, y quien revisará tu trabajo durante el periodo de adaptación.

> [!NOTA] Durante las primeras cuatro semanas es normal (y deseable) que todo lo que salga del despacho con tu firma pase antes por una revisión. No es desconfianza: es cómo se aprende el criterio del despacho.
`
    },
    {
      id: 'jornada',
      titulo: 'Jornada, presencia y comunicación interna',
      md: `
## Horario y presencia

> [!PENDIENTE] Ajustar esta sección al régimen real del despacho: horario de apertura, horario de atención al público, días de teletrabajo permitidos, sistema de fichaje y política de flexibilidad.

Como referencia general:

- **Horario de atención al público**: se respeta con puntualidad. Si hay una visita a las 10:00, a las 10:00 hay alguien disponible.
- **Registro de jornada**: obligatorio por ley. Se ficha al entrar y al salir, también en teletrabajo.
- **Ausencias imprevistas**: se comunican a Coordinación lo antes posible, para poder reorganizar la agenda y avisar a los clientes afectados.

## Cómo nos comunicamos internamente

Cada canal tiene un uso. Usarlos bien evita ruido y evita que se pierdan cosas importantes.

| Canal | Para qué | Tiempo de respuesta esperado |
|---|---|---|
| Chat interno | Consultas rápidas, coordinación del día | Durante la jornada |
| Correo interno | Asuntos que requieren constancia o van con adjuntos | 24 horas laborables |
| CRM (notas del expediente) | Todo lo que afecta a un cliente o a un asunto | En el momento |
| Reunión de equipo | Decisiones, casos complejos, novedades | Semanal |

> [!AVISO] El chat interno **no es el sitio** donde se registra la información de un cliente. Si en una conversación de chat surge un dato relevante del asunto, se traslada a la nota del expediente en el CRM. El chat se borra; el expediente permanece.

## Reglas básicas de convivencia digital

- Los mensajes fuera de horario no requieren respuesta inmediata salvo urgencia real.
- Antes de enviar un correo a todo el equipo, pregúntate si realmente todos necesitan leerlo.
- Los asuntos delicados (un error, un conflicto, una queja) se hablan en persona o por teléfono, no por escrito en grupo.
`
    },
    {
      id: 'primeros-dias',
      titulo: 'Tu lista de las dos primeras semanas',
      md: `
## Checklist de incorporación

Repasa esta lista con tu responsable al final de la primera semana y al final de la segunda.

### Accesos y equipo
- [ ] Cuenta de correo corporativo creada y configurada
- [ ] Acceso al CRM con el rol correspondiente
- [ ] Acceso al gestor documental y a las carpetas de tu área
- [ ] Acceso al gestor de contraseñas del despacho
- [ ] Doble factor de autenticación activado en todas las cuentas
- [ ] Teléfono / extensión asignada
- [ ] Firma de correo configurada según la plantilla del despacho

### Documentación firmada
- [ ] Contrato y documentación laboral
- [ ] Acuerdo de confidencialidad
- [ ] Documento de política de protección de datos y uso de sistemas
- [ ] Autorización de uso de imagen, si procede

### Formación
- [ ] Módulos 1 a 4 de esta plataforma completados
- [ ] Módulo 5 (Herramientas) completado y accesos probados
- [ ] Sesión de presentación con cada área
- [ ] Acompañamiento en al menos dos primeras visitas de cliente

### Conocimiento del despacho
- [ ] Sabes explicar los servicios del despacho en dos minutos
- [ ] Sabes dónde se guarda un documento nuevo de un cliente
- [ ] Sabes qué hacer si entra una llamada de un cliente que no es tuyo
- [ ] Sabes a quién escalar una incidencia

> [!BUENA] Guarda esta lista abierta durante tus primeros días y ve marcándola. Es la forma más rápida de detectar qué te falta antes de que se convierta en un problema.

## Qué se espera de ti al final del primer mes

No se espera dominio técnico. Se espera:

1. **Autonomía en lo operativo**: sabes usar las herramientas y seguir los procedimientos sin preguntar cada paso.
2. **Criterio para pedir ayuda**: distingues lo que puedes resolver de lo que hay que consultar.
3. **Rigor en el registro**: tus expedientes están al día y tus notas son comprensibles para otro compañero.
`
    }
  ]
};
