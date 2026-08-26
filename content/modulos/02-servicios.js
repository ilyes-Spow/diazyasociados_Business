export default {
  id: 'servicios',
  num: 2,
  grupo: 'fundamentos',
  titulo: 'Servicios del despacho',
  resumen: 'Qué vendemos exactamente, a quién y con qué alcance. Saber explicarlo con precisión es la base de todo lo demás.',
  duracion: 35,
  etiquetas: ['obligatorio', 'comercial'],
  lecciones: [
    {
      id: 'catalogo',
      titulo: 'Catálogo de servicios',
      md: `
## Por qué necesitas dominar el catálogo

Cualquier persona del equipo puede recibir una llamada, un correo o una consulta en la puerta. Si no sabes qué hace el despacho, transmites inseguridad y pierdes al cliente antes de empezar.

No necesitas ser experto en todas las áreas. Necesitas saber:

1. **Qué áreas cubrimos** y cuáles no.
2. **A quién derivar** cada tipo de consulta.
3. **Qué incluye y qué no incluye** cada servicio.

## Áreas de práctica

> [!PENDIENTE] Sustituir esta tabla por el catálogo real del despacho, con los servicios efectivamente prestados, el responsable de cada área y el rango de honorarios vigente.

| Área | Servicios típicos | Perfil de cliente |
|---|---|---|
| Derecho civil | Contratos, reclamaciones de cantidad, arrendamientos, responsabilidad civil | Particular y empresa |
| Derecho de familia | Divorcios, custodias, pensiones, modificación de medidas | Particular |
| Derecho laboral | Despidos, reclamaciones salariales, incapacidades, asesoramiento a empresa | Particular y empresa |
| Derecho mercantil | Constitución de sociedades, pactos de socios, contratación mercantil | Empresa y autónomo |
| Derecho administrativo | Recursos, sanciones, licencias, extranjería | Particular y empresa |
| Derecho penal | Asistencia al detenido, delitos leves, personación como acusación | Particular |
| Asesoramiento continuado | Cuota mensual con consultas y revisión de documentación | Empresa y autónomo |

## Qué NO hacemos

Tan importante como saber qué ofrecemos es saber decir que no. Rechazar bien un asunto protege al cliente y protege al despacho.

Motivos habituales para no aceptar un asunto:

- **Fuera de nuestras áreas.** Se deriva a un compañero de confianza, no se improvisa.
- **Conflicto de interés.** Si ya representamos a la parte contraria, o la hemos representado en un asunto conexo, no podemos aceptar.
- **Asunto sin viabilidad.** Si el análisis dice que no hay recorrido, se explica con franqueza en lugar de cobrar por un proceso perdido.
- **Plazo imposible.** Si el plazo ya ha vencido o es materialmente inasumible, se dice.

> [!IMPORTANTE] La detección de conflictos de interés se hace **antes** de la primera reunión sustantiva, comprobando el nombre y el NIF de las partes en el CRM. Ver el módulo de Gestión de leads.
`
    },
    {
      id: 'alcance',
      titulo: 'Alcance, honorarios y expectativas',
      md: `
## Definir el alcance es prevenir conflictos

La mayor parte de las quejas de clientes no vienen de un mal resultado jurídico: vienen de una **expectativa mal fijada al principio**.

Todo encargo debe dejar claro por escrito, en la hoja de encargo:

- Qué actuación concreta se contrata.
- Qué **no** está incluido (recursos posteriores, ejecución, instancias superiores, gastos de terceros).
- Qué honorarios se aplican y cuándo se facturan.
- Qué provisiones de fondos se piden y para qué.
- Qué necesitamos del cliente y en qué plazo.

## Modelos de honorarios

| Modelo | Cuándo se usa | Riesgo a vigilar |
|---|---|---|
| Precio cerrado | Actuaciones acotadas y previsibles | Que el asunto se complique fuera de alcance |
| Por horas | Asuntos de recorrido incierto | Que el cliente no vea el detalle y discuta la factura |
| Cuota mensual (iguala) | Asesoramiento continuado a empresa | Que el cliente consuma muy por encima de lo previsto |
| Mixto (fijo + variable por éxito) | Reclamaciones de cantidad | Que no quede claro sobre qué base se calcula el éxito |

> [!AVISO] Los **gastos y suplidos** (tasas, procurador, peritos, notaría, registros) no son honorarios y se repercuten aparte. Hay que decirlo en la primera conversación, no en la primera factura.

## Cómo explicar el precio sin bajar la guardia

Cuando un cliente dice "es caro", casi nunca está comparando con otro despacho: está comparando con **una idea vaga que traía de casa**. La respuesta no es rebajar, es concretar:

1. Recuerda el problema en sus términos y lo que está en juego.
2. Explica qué trabajo concreto hay detrás del precio.
3. Explica qué pasa si no se hace o si se hace mal.
4. Ofrece la opción de fraccionar el pago antes que la de rebajar el precio.

> [!BUENA] Nunca improvises un precio en una primera llamada si el asunto no es un servicio de tarifa cerrada. Di: "para darte una cifra que se sostenga necesito ver la documentación; te propongo una primera cita y salimos de ahí con un presupuesto cerrado".
`
    },
    {
      id: 'discurso',
      titulo: 'Cómo presentar el despacho en dos minutos',
      md: `
## El discurso de presentación

Debes ser capaz de explicar qué hace el despacho en menos de dos minutos, sin sonar a folleto. Estructura recomendada:

### 1. Qué problema resolvemos (20 segundos)
No empieces por "somos un despacho fundado en...". Empieza por el cliente.

> "Trabajamos con personas y empresas que tienen un problema legal y necesitan saber, desde el primer día, qué opciones tienen y cuánto les va a costar."

### 2. Cómo lo hacemos (40 segundos)
Aquí sí entran las áreas, pero enfocadas al interlocutor. Si hablas con un autónomo, no le recites derecho de familia.

### 3. Qué nos diferencia (30 segundos)
Elige dos o tres puntos concretos y verificables. Evita adjetivos vacíos como "cercanos" o "profesionales": eso lo dice todo el mundo.

Ejemplos de diferenciales concretos:
- Un interlocutor asignado que el cliente conoce por su nombre.
- Presupuesto cerrado por escrito antes de empezar.
- Informe de estado del asunto en un plazo comprometido.
- Respuesta a consultas en un plazo comprometido.

### 4. Siguiente paso (10 segundos)
Nunca termines una presentación sin proponer algo concreto: una cita, una llamada, el envío de documentación.

> [!CLAVE] La presentación no termina cuando dejas de hablar, sino cuando el interlocutor tiene una fecha en la agenda.

## Errores frecuentes

- **Hablar de derecho al primer minuto.** El cliente no ha venido a una clase de derecho.
- **Prometer resultados.** Nunca se garantiza un resultado judicial. Se explica el escenario probable y los riesgos.
- **Enumerar todas las áreas.** Transmite dispersión. Habla de la que le interesa.
- **Improvisar honorarios.** Ver la lección anterior.

## Ejercicio

Escribe tu propia versión del discurso, en tus palabras, y pruébala en voz alta con tu responsable antes de usarla con un cliente. Debe sonar a ti, no a un guion leído.
`
    }
  ]
};
