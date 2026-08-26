export default {
  id: 'proteccion-datos',
  num: 17,
  grupo: 'administracion',
  titulo: 'Protección de datos, confidencialidad y seguridad',
  resumen: 'El módulo más importante en términos de riesgo. Secreto profesional, RGPD, derechos de los clientes y seguridad de la información.',
  duracion: 45,
  etiquetas: ['obligatorio', 'cumplimiento'],
  lecciones: [
    {
      id: 'secreto',
      titulo: 'Secreto profesional',
      md: `
## Qué cubre

El secreto profesional cubre **todo** lo que conoces por razón de tu trabajo:

- Lo que el cliente te cuenta.
- Lo que descubres investigando su asunto.
- El hecho mismo de que sea cliente del despacho.
- Lo que sabes de la parte contraria.
- Las conversaciones con otros abogados.
- Los documentos del expediente.

## Características

- **Es indefinido.** No termina al acabar el asunto ni al dejar el despacho.
- **Es irrenunciable** por parte del profesional.
- **Alcanza a todo el personal**, esté colegiado o no.
- **No admite excepciones por confianza.** Ni pareja, ni familia, ni amistades.

> [!IMPORTANTE] Contar un caso "sin decir nombres" sigue siendo una vulneración si la persona es identificable por el contexto. En una ciudad mediana, "un divorcio de un empresario del sector de la hostelería" identifica a alguien.

## Situaciones cotidianas de riesgo

| Situación | Riesgo | Qué hacer |
|---|---|---|
| Conversación en el ascensor del juzgado | Alguien escucha | No se habla de asuntos fuera del despacho |
| Llamada en el tren | Todo el vagón oye | Se devuelve la llamada al llegar |
| Pantalla en una cafetería | Visible por detrás | Filtro de privacidad o no trabajar ahí |
| Comentario en redes | Público e indeleble | Nunca |
| Contar el caso en casa | Vulneración | Nunca, aunque sea interesante |
| Coincidencia de clientes en la sala de espera | Se identifican | Coordinación evita solapamientos |

> [!AVISO] Que un caso salga en prensa **no** te libera del secreto. Que sea público lo que publica el periódico no autoriza a confirmar, matizar ni ampliar nada.

## Excepciones

Existen supuestos muy tasados en los que la normativa contempla la posibilidad de revelar información, y otros en que impone deberes de comunicación (señaladamente en materia de prevención de blanqueo).

> [!IMPORTANTE] Ninguna de esas decisiones la tomas tú. Si crees estar ante un supuesto así, **escala a Dirección de inmediato** y no hagas ni digas nada mientras tanto.
`
    },
    {
      id: 'rgpd',
      titulo: 'RGPD en el día a día',
      md: `
## Los principios que aplican a tu trabajo

- **Minimización.** Solo los datos necesarios. No pidas el DNI para una consulta inicial.
- **Limitación de la finalidad.** Los datos recogidos para un asunto no se usan para marketing.
- **Limitación del plazo.** No se conserva indefinidamente. Ver el módulo de Gestión documental.
- **Exactitud.** Datos actualizados. Si el cliente cambia de domicilio, se corrige.
- **Integridad y confidencialidad.** Medidas de seguridad adecuadas.
- **Responsabilidad proactiva.** Hay que poder **demostrar** el cumplimiento, no solo cumplirlo.

## Categorías especiales de datos

Salud, ideología, religión, afiliación sindical, orientación sexual, origen étnico, datos genéticos y biométricos. Y los datos relativos a infracciones y condenas penales, con régimen propio.

Un despacho los trata con frecuencia: incapacidades, familia, penal, laboral.

Reglas:
- Solo si son **estrictamente necesarios** para el asunto.
- Con medidas de seguridad reforzadas.
- Nunca en canales no seguros (mensajería personal, correo sin cifrar).
- Nunca en campos del CRM que no estén previstos para ello.

> [!IMPORTANTE] Un informe médico de un cliente **no** se envía por WhatsApp ni se adjunta sin protección a un correo. Se sube al gestor documental y se comparte por enlace protegido.

## Derechos de las personas

El cliente (y también un tercero cuyos datos tratamos) puede ejercer:

| Derecho | Qué implica |
|---|---|
| Acceso | Saber qué datos suyos tenemos y obtener copia |
| Rectificación | Corregir datos inexactos |
| Supresión | Que se borren, con los límites de nuestras obligaciones de conservación |
| Oposición | Oponerse a un tratamiento concreto |
| Limitación | Que se conserven pero no se usen |
| Portabilidad | Recibirlos en formato estructurado |

### Qué haces tú si recibes una solicitud

1. **No la respondas por tu cuenta.**
2. Regístrala con la fecha exacta de recepción.
3. Trasládala **el mismo día** al responsable de protección de datos del despacho.

> [!IMPORTANTE] El plazo de respuesta es de **un mes** desde la recepción. Ese plazo corre desde que la solicitud llega al despacho, no desde que la ve el responsable. Un retraso interno consume el plazo legal.

> [!PENDIENTE] Identificar quién es el responsable de protección de datos del despacho y si existe Delegado de Protección de Datos designado.

## Documentación obligatoria del despacho

> [!PENDIENTE] Verificar que existe y está actualizada: registro de actividades de tratamiento, análisis de riesgos, contratos de encargado de tratamiento con todos los proveedores (CRM, hosting, gestoría, destructora, asesoría), cláusulas informativas y política de conservación.
`
    },
    {
      id: 'seguridad',
      titulo: 'Seguridad de la información',
      md: `
## Medidas básicas obligatorias

- [ ] Contraseñas únicas gestionadas en el gestor de contraseñas
- [ ] Doble factor en todos los servicios que lo permitan
- [ ] Cifrado de disco en portátiles y móviles
- [ ] Bloqueo automático de pantalla
- [ ] Antivirus actualizado
- [ ] Sistema operativo y aplicaciones actualizados
- [ ] Copias de seguridad verificadas
- [ ] Nunca conectarse a wifi pública sin VPN

## Phishing y fraude

Un despacho es objetivo prioritario: maneja datos sensibles y, sobre todo, **movimientos de dinero**.

### Señales de alerta
- Urgencia inusual: "hay que pagar hoy mismo".
- Remitente parecido pero no idéntico al habitual.
- Cambio de número de cuenta comunicado por correo.
- Petición de confidencialidad respecto del resto del equipo.
- Enlaces que no coinciden con el texto que muestran.
- Adjuntos inesperados.

> [!IMPORTANTE] **Fraude del CEO y estafa de cambio de cuenta.** Ante cualquier comunicación que solicite un pago o comunique un cambio de número de cuenta, se verifica **por teléfono, llamando al número que ya tenemos registrado**, nunca al que aparece en el correo. Sin excepciones, aunque el correo parezca de Dirección.

### Si sospechas
1. No abras adjuntos ni pulses enlaces.
2. No respondas.
3. Comunícalo al responsable de sistemas.
4. Si ya has pulsado algo: **desconecta el equipo de la red** (sin apagarlo) y avisa de inmediato.

## Brechas de seguridad

Es brecha cualquier incidente que suponga destrucción, pérdida, alteración o acceso no autorizado a datos personales.

Ejemplos reales y frecuentes:
- Correo con datos de un cliente enviado a la persona equivocada.
- Portátil o móvil perdido o robado.
- Documentación en papel extraviada.
- Acceso indebido a una cuenta.
- Ataque de ransomware.
- Envío masivo con las direcciones en copia visible en lugar de copia oculta.

### Protocolo

1. **Comunicación interna inmediata** a Dirección. En minutos, no en horas.
2. Contención: revocar accesos, cambiar credenciales, intentar retirar el envío.
3. Documentar: qué ha pasado, cuándo, qué datos, cuántas personas afectadas.
4. Valoración del riesgo por el responsable de protección de datos.
5. Notificación a la autoridad de control si procede: **plazo de 72 horas** desde el conocimiento.
6. Comunicación a los afectados si el riesgo es alto.
7. Registro de la brecha en el registro interno, **también si se decide no notificar**.

> [!IMPORTANTE] Las 72 horas cuentan desde que **cualquier persona del despacho** tiene conocimiento, no desde que lo sabe Dirección. Cada hora que tardas en comunicarlo internamente es una hora menos para responder.

> [!AVISO] Nunca ocultes una brecha por miedo a las consecuencias. No notificar es una infracción independiente y más grave que la brecha misma, y el despacho responde igual.

## Proveedores

Todo proveedor que accede a datos de nuestros clientes (CRM, hosting, gestoría, asesoría, destructora, informática) debe tener firmado un **contrato de encargado de tratamiento**.

> [!AVISO] No contrates ni empieces a usar una herramienta nueva que trate datos de clientes sin pasar por Dirección. Aunque sea gratuita. Aunque sea "solo para probar". Especialmente si es una herramienta de inteligencia artificial: subir un expediente a un servicio no autorizado es una cesión de datos no consentida y una posible vulneración del secreto profesional.
`
    }
  ]
};
