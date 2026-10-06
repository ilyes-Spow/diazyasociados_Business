export default {
  id: 'atencion',
  num: 14,
  grupo: 'comercial',
  titulo: 'Atención y comunicación con clientes',
  resumen: 'Cómo hablamos y escribimos a los clientes: teléfono, correo, mensajería y trato presencial.',
  duracion: 35,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'telefono',
      titulo: 'Atención telefónica',
      md: `
## Cómo se descuelga

Fórmula estándar, en menos de tres tonos:

> "Díaz y Asociados, buenos días, le atiende NOMBRE. ¿En qué puedo ayudarle?"

Y a partir de ahí:

- Pregunta y **usa el nombre** del interlocutor.
- Toma notas mientras habla, no después.
- No comas, no teclees ruidosamente, no hables con otra persona a la vez.

## Si preguntan por alguien que no está

Nunca digas solo "no está". Ofrece siempre una alternativa:

> "En este momento NOMBRE no está disponible. ¿Prefiere que le devuelva la llamada esta tarde o puedo ayudarle yo?"

Y si tomas un mensaje, recoge: **quién llama, teléfono, expediente o asunto, motivo, urgencia y mejor franja horaria**. El mensaje se registra en el CRM, no en un papel.

> [!IMPORTANTE] Nunca confirmes a un tercero que una persona es cliente del despacho, ni siquiera respondiendo a "¿lleváis el caso de...?". Eso vulnera el secreto profesional. Fórmula segura: *"No puedo darle información sobre eso. Si me indica su nombre y su teléfono, traslado el mensaje a quien corresponda."*

## Verificación de identidad al teléfono

Antes de dar información sobre un expediente, verifica con quién hablas:

- Nombre completo.
- Un dato del expediente que solo el cliente conozca.
- Ante la mínima duda, no des información: ofrece devolver la llamada al teléfono registrado en el CRM.

> [!AVISO] La suplantación telefónica es una técnica habitual de fraude y de obtención de información en asuntos de familia y laborales. La regla es simple: **si dudas, devuelves la llamada al número que tienes registrado**.

## Poner en espera y transferir

- Pide permiso antes de poner en espera y explica por qué.
- No dejes a nadie en espera más de un minuto sin volver.
- Antes de transferir, **avisa a quien recibe** de quién es y qué quiere. Nadie debe contar su problema dos veces.

## Devolución de llamadas

Toda llamada perdida se devuelve **el mismo día**. Si no se ha podido contactar, se deja mensaje y se registra el intento.
`
    },
    {
      id: 'escrito',
      titulo: 'Comunicación escrita',
      md: `
## Principios

El cliente no es abogado. Escribir claro no es escribir de forma menos rigurosa: es hacer bien tu trabajo.

- **Frases cortas.** Una idea por frase.
- **Sin latinajos** salvo que sean imprescindibles, y entonces se explican.
- **Estructura visible**: párrafos cortos, listas cuando hay pasos.
- **Lo importante primero.** No entierres la conclusión en el párrafo cuarto.
- **Siempre un siguiente paso** al final.

## Estructura de un correo a cliente

    Asunto: [Expediente] Asunto concreto y comprensible

    Estimado/a NOMBRE:

    [CONCLUSIÓN O NOVEDAD EN UNA FRASE]

    [EXPLICACIÓN, EN 2-3 PÁRRAFOS CORTOS]

    [QUÉ NECESITAMOS DE TI, SI PROCEDE]

    [PRÓXIMO PASO Y CUÁNDO]

    Quedo a tu disposición para cualquier duda.

    Un saludo,
    NOMBRE - CARGO
    Díaz y Asociados

## Asuntos de correo

Malos: "Consulta", "Info", "RE: RE: RE: FW: documentación".

Buenos:
- "Exp. 2024-118 - Señalamiento de juicio: 14 de mayo"
- "Exp. 2024-091 - Necesitamos 3 documentos antes del viernes"
- "Presupuesto reclamación de cantidad - Díaz y Asociados"

> [!BUENA] El asunto debe permitir al cliente saber de qué va el correo **sin abrirlo**, y encontrarlo dentro de un año buscando en su bandeja.

## Antes de enviar, siempre

- [ ] Destinatario correcto (cuidado con el autocompletado)
- [ ] Sin destinatarios de más en copia
- [ ] Adjunto correcto, **abierto y comprobado**
- [ ] Sin datos de otros clientes en el hilo reenviado
- [ ] Nombre del cliente bien escrito
- [ ] Sin errores de plantilla
- [ ] Tono adecuado, releído en frío si el asunto es delicado

> [!IMPORTANTE] Si el correo lleva documentación sensible, no la envíes como adjunto abierto: usa enlace protegido o cifrado. Y nunca respondas en caliente: los correos escritos con enfado acaban en un procedimiento.

## Datos de contacto oficiales

Los que figuran en la web corporativa y los únicos que se dan a clientes:

- Correo: **contacto@diazyasociados.es**
- Teléfono: **+34 625 39 04 53**

Nunca des tu móvil personal ni un correo que no sea corporativo.

## Mensajería instantánea

> [!PENDIENTE] Definir si el despacho usa WhatsApp Business con clientes y con qué límites.

Si se usa:
- Solo desde la línea corporativa, nunca desde el móvil personal.
- Para coordinación (confirmar citas, avisar de retrasos), no para asesoramiento.
- Nunca se envían documentos con datos personales.
- Todo contenido relevante se traslada a nota del CRM.
- Se responde en horario laboral; fuera de él no se atiende.
`
    },
    {
      id: 'presencial',
      titulo: 'Trato presencial y situaciones difíciles',
      md: `
## Recepción de visitas

- Se atiende **al llegar**, aunque sea para decir "un momento, ahora le atiendo".
- Nadie espera de pie ni sin saber cuánto va a esperar.
- Si hay retraso, se comunica el motivo y el tiempo aproximado.
- Se ofrece agua.

## La sala de espera

- Sin expedientes ni documentación a la vista.
- Sin conversaciones sobre otros clientes audibles.
- Si dos clientes coinciden y no deben verse, se gestiona la agenda para evitarlo.

> [!AVISO] En asuntos de familia, laborales o penales pueden coincidir en la sala de espera personas enfrentadas. Coordinación debe vigilar los solapamientos al agendar.

## Durante la reunión

- Móvil silenciado y fuera de la mesa.
- No se interrumpe una reunión con un cliente salvo urgencia real.
- No se atienden llamadas delante del cliente.
- Se toman notas: transmite atención y evita olvidos.

## Comunicar malas noticias

1. **Directo desde el principio.** No lo envuelvas en tres minutos de preámbulo: aumenta la ansiedad.
2. **Con claridad**, sin tecnicismos que suavicen artificialmente.
3. **Qué significa** en su vida real.
4. **Qué opciones** quedan.
5. **Qué recomiendas.**
6. **Espacio para reaccionar.** Silencio. Deja que procese.
7. **Confirmación por escrito** después.

> [!CLAVE] No adornes una mala noticia. El cliente detecta el adorno, deja de confiar en lo que le cuentas y empieza a buscar una segunda opinión.

## Cliente muy afectado emocionalmente

- Baja el ritmo. No hay prisa.
- Reconoce la emoción sin invadir: "Entiendo que esto es muy duro."
- No des consejos vitales. No eres su terapeuta.
- Si no está en condiciones de decidir, propón retomarlo otro día.
- Ofrece los recursos públicos de apoyo cuando proceda.

## Cliente que exige lo imposible

- No prometas para calmar. La promesa incumplida hoy es la queja de mañana.
- Explica el límite y **por qué** existe.
- Ofrece lo que sí puedes hacer.
- Si insiste, escala.

> [!BUENA] Frase útil: *"Entiendo perfectamente lo que necesitas. No puedo prometerte eso porque no depende de nosotros. Lo que sí puedo garantizarte es X, y lo voy a hacer en este plazo."*
`
    }
  ]
};
