export default {
  id: 'tramites',
  num: 9,
  grupo: 'operativa',
  titulo: 'Trámites y procedimientos',
  resumen: 'El circuito estándar de un asunto, de la apertura al archivo, y los trámites recurrentes del despacho.',
  duracion: 45,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'circuito',
      titulo: 'El circuito estándar de un asunto',
      md: `
## Las siete fases

Todo asunto, sea de la materia que sea, recorre las mismas fases. Cambia el contenido, no la estructura.

### 1. Apertura
Alta del cliente, hoja de encargo firmada, expediente creado, responsable asignado. Ver el módulo de Control y gestión de clientes.

### 2. Estudio
Análisis de la documentación, identificación de plazos, valoración de viabilidad y estrategia. Termina con una **nota de estrategia** en el expediente: qué pretendemos, por qué vía y con qué riesgos.

### 3. Actuaciones previas
Requerimientos, reclamaciones extrajudiciales, negociación, actos de conciliación, agotamiento de la vía administrativa. Muchos asuntos terminan aquí, que suele ser el mejor resultado para el cliente.

### 4. Presentación
Escrito inicial presentado ante el órgano competente. Justificante archivado el mismo día.

### 5. Tramitación
Seguimiento de notificaciones, escritos intermedios, prueba, señalamientos. Es la fase más larga y donde más asuntos se descuidan.

### 6. Resolución
Recepción, análisis, comunicación al cliente, valoración de recurso con su plazo anotado.

### 7. Cierre o ejecución
Ejecución de lo resuelto o archivo del expediente. Factura final. Devolución de originales.

> [!CLAVE] La fase 5 es donde se pierden los asuntos. No por dificultad técnica, sino porque nadie los mira durante meses. De ahí la revisión mensual de cartera.

## Documentación de cada fase

En cada cambio de fase debe quedar en el expediente:

- **Qué** se ha hecho.
- **Cuándo**.
- **Quién** lo ha hecho.
- **Qué viene después** y con qué plazo.
`
    },
    {
      id: 'notificaciones',
      titulo: 'Notificaciones y comunicaciones electrónicas',
      md: `
## Revisión diaria obligatoria

Los sistemas de notificación electrónica tienen plazos que corren **desde la puesta a disposición**, se lea o no. No revisarlos un día puede costar un plazo.

> [!PENDIENTE] Listar los sistemas realmente utilizados por el despacho (LexNET, DEHú, sede electrónica de la AEAT, plataformas autonómicas, etc.), quién revisa cada uno y con qué frecuencia.

| Sistema | Responsable de revisión | Frecuencia |
|---|---|---|
| Sistema de notificaciones judiciales | Coordinación | Diaria, primera hora |
| Buzón electrónico de la Administración | Administración | Diaria |
| Sede electrónica tributaria | Administración | Diaria |
| Correo corporativo del despacho | Coordinación | Continua en jornada |

> [!IMPORTANTE] En muchos sistemas, si no se accede a la notificación en el plazo legal, se entiende **rechazada y practicada** igualmente. El plazo empieza a correr aunque nadie la haya abierto.

## Circuito de una notificación entrante

1. **Descarga** y guardado en el expediente correspondiente, con nomenclatura estándar.
2. **Registro** en el CRM: fecha de notificación y contenido en una línea.
3. **Cálculo del plazo** que abre, si abre alguno.
4. **Anotación** en agenda y tarea, con los recordatorios escalonados.
5. **Aviso** al responsable del expediente el mismo día.
6. **Comunicación al cliente** en el plazo comprometido.

> [!AVISO] Una notificación descargada y no registrada es peor que una notificación no descargada: el plazo corre y nadie lo sabe.

## Notificaciones que no reconoces

Si llega una notificación de un expediente que no identificas:

- No la ignores ni la dejes para mañana.
- Busca por número de procedimiento y por nombre de las partes en el CRM.
- Si no aparece, comunícalo a Coordinación el mismo día.

Puede ser un asunto antiguo, un error del juzgado o una parte contraria que nos identifica mal. En todos los casos hay que resolverlo el mismo día.
`
    },
    {
      id: 'presentacion',
      titulo: 'Presentación de escritos',
      md: `
## Antes de presentar

Checklist obligatoria antes de cualquier presentación:

- [ ] Escrito revisado por el responsable
- [ ] Datos de las partes correctos y completos
- [ ] Número de procedimiento y órgano correctos
- [ ] Todos los documentos anunciados están adjuntos
- [ ] Documentos numerados y coincidentes con lo citado en el cuerpo del escrito
- [ ] Firma del profesional que corresponde
- [ ] Tasa liquidada, si procede
- [ ] Poder acreditado y aportado, si procede
- [ ] Plazo comprobado: hoy no es el último día
- [ ] Copias para traslado a las demás partes

> [!AVISO] No presentes el último día del plazo salvo imposibilidad. Los sistemas electrónicos fallan, y fallan precisamente los días de mayor carga. Objetivo interno: presentar **con 48 horas de margen** como mínimo.

## Después de presentar

- [ ] Justificante de presentación descargado
- [ ] Justificante archivado en el expediente con nomenclatura estándar
- [ ] Registro en el CRM de la presentación
- [ ] Comunicación al cliente
- [ ] Tarea creada para el siguiente hito previsible
- [ ] Plazo original cerrado en la agenda

> [!IMPORTANTE] El justificante de presentación es la única prueba de que se presentó en plazo. Si no está archivado, el trámite no está acreditado. Descárgalo **el mismo día**.

## Si la presentación falla

1. Captura de pantalla del error, con la hora visible.
2. Intento por vía alternativa si existe.
3. Comunicación inmediata al responsable.
4. Registro detallado de todos los intentos y sus horas.

Este registro es lo que permite acreditar la imposibilidad técnica si hay que alegarla.
`
    },
    {
      id: 'recurrentes',
      titulo: 'Trámites recurrentes del despacho',
      md: `
## El recorrido tipo de un expediente de extranjería

La web corporativa resume el camino que recorre un expediente de extranjería. Memorízalo: es el mapa sobre el que el cliente te preguntará «¿en qué punto estamos?».

1. Evaluación del caso
2. Preparación documental
3. Presentación ante consulado, UGE u Oficina de Extranjería
4. Resolución
5. Entrada o estancia en España
6. Empadronamiento, cuando proceda
7. Toma de huellas
8. Recogida de la TIE
9. Renovación o modificación futura

> [!NOTA] Los **modelos oficiales de extranjería** (solicitudes reguladas por la LO 4/2000) están disponibles para descarga en la web corporativa, y las plantillas internas del despacho en la sección **Modelos** de esta plataforma.

## Fichas de trámite

Para cada trámite recurrente el despacho mantiene una ficha con: documentación necesaria, plazos, organismo, coste y pasos.

> [!PENDIENTE] Este es el apartado que más valor aporta a medio plazo. Hay que ir creando una ficha por cada trámite habitual del despacho, con los datos reales. Empezar por los cinco más frecuentes.

### Plantilla de ficha de trámite

    TRÁMITE: nombre
    ÁREA: materia
    ORGANISMO: ante quién se presenta
    PLAZO: cuál es y desde cuándo se cuenta
    DOCUMENTACIÓN NECESARIA:
      - documento 1
      - documento 2
    PASOS:
      1. ...
      2. ...
    COSTE: tasas y suplidos
    DURACIÓN ESTIMADA: cuánto tarda en resolverse
    ERRORES FRECUENTES: qué suele salir mal
    RESPONSABLE INTERNO: quién lo domina

### Trámites a documentar primero

Siguiendo las áreas reales del despacho (extranjería y mercantil):

- [ ] Solicitud de residencia (por cada vía habitual del despacho)
- [ ] Solicitud de visado ante consulado
- [ ] Arraigo
- [ ] Renovación de autorización de residencia
- [ ] Toma de huellas y recogida de TIE
- [ ] Solicitud de nacionalidad española
- [ ] Constitución de sociedad limitada
- [ ] Recurso de reposición administrativo

> [!BUENA] Cuando hagas un trámite por primera vez, ve anotando los pasos mientras lo haces. Tardarás cinco minutos más y crearás una ficha que ahorrará horas al resto del equipo.

## Actualización de las fichas

Los trámites cambian: cambian las sedes electrónicas, los formularios y las tasas. Cada ficha lleva **fecha de última revisión**. Si una ficha tiene más de un año, hay que verificarla antes de usarla.

Cuando detectes que una ficha está desactualizada, actualízala tú y comunícalo en Novedades. No lo dejes para otro.
`
    }
  ]
};
