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

Somos una firma **internacional** con dos grandes áreas, tal como se presentan en la web corporativa:

| Área | Servicios típicos | Perfil de cliente |
|---|---|---|
| Extranjería y movilidad internacional | Residencia, visados, arraigos, renovaciones y TIE, nacionalidad española | Personas, familias, profesionales, estudiantes, inversores y empresas |
| Derecho mercantil y corporativo | Operaciones internacionales, constitución y gobierno corporativo, contratación, due diligence, protección patrimonial y movilidad de talento | Empresas, inversores y family offices |

> [!PENDIENTE] Completar con el responsable interno de cada área y el rango de honorarios vigente.

## A quién servimos

- **Personas y familias** — residencia, nacionalidad, movilidad y decisiones patrimoniales.
- **Empresas** — mercantil, corporate, contratación y gobierno corporativo.
- **Inversores** — estructuras, operaciones, due diligence y activos en España.
- **Partners** — alianzas con consultoras, asesorías, inmobiliarias, family offices y redes internacionales.

## Presencia internacional

El despacho tiene presencia en **España, Colombia, México, Argentina y Reino Unido**, con web propia por país y oficinas conectadas con clientes globales. Cuando un asunto cruza fronteras, no se improvisa: se coordina con la oficina o el partner correspondiente.

## Nuestra forma de trabajar

Este es el proceso que el despacho comunica públicamente, y el que el cliente espera vivir:

1. **Escuchamos** el caso y entendemos el objetivo.
2. **Analizamos** la vía legal más adecuada.
3. **Diseñamos** una estrategia personalizada.
4. **Preparamos y revisamos** la documentación.
5. **Acompañamos** durante todo el proceso.
6. **Mantenemos comunicación** clara y constante.

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

> "Acompañamos a personas, familias, empresas e inversores que necesitan vivir, trabajar, invertir o establecerse legalmente en España, y a empresas con proyectos internacionales. Desde el primer día saben qué opciones tienen, qué pasos siguen y cuánto les va a costar."

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
