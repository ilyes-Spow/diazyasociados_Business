export default {
  id: 'marketing',
  num: 15,
  grupo: 'comercial',
  titulo: 'Marketing y comunicación',
  resumen: 'Cómo se comunica el despacho hacia fuera, con qué límites deontológicos y qué papel tiene cada persona del equipo.',
  duracion: 30,
  etiquetas: ['comercial', 'marketing'],
  lecciones: [
    {
      id: 'limites',
      titulo: 'Marca y límites deontológicos',
      md: `
## La publicidad de un despacho está regulada

Un despacho puede publicitarse, pero con límites que no aplican a otros sectores. Conocerlos evita sanciones colegiales.

### Está prohibido
- **Revelar la identidad de clientes** o datos de asuntos sin consentimiento expreso y por escrito.
- **Garantizar resultados** o sugerir una tasa de éxito no acreditable.
- **Publicidad engañosa** o que induzca a error sobre servicios, precios o cualificación.
- **Denigrar** a otros profesionales o compararse de forma desleal.
- **Captación directa** de víctimas de siniestros o accidentes recientes y de sus allegados.
- Utilizar la condición profesional para **incitar al litigio** de forma indiscriminada.

### Está permitido
- Informar de las áreas de práctica, la trayectoria y el equipo.
- Publicar contenido divulgativo y análisis de novedades normativas.
- Mostrar casos **anonimizados** de forma que sea imposible identificar a las partes.
- Publicar reseñas y testimonios **con consentimiento expreso y por escrito**.
- Informar de honorarios y de criterios de facturación.

> [!IMPORTANTE] Un caso "anonimizado" no basta con quitar el nombre. Si la combinación de datos (localidad pequeña, sector, importe, fecha) permite identificar a la persona, sigue siendo un dato personal. Ante la duda, no se publica.

## Identidad del despacho

> [!PENDIENTE] Incorporar el manual de marca: logotipo y sus usos, colores corporativos, tipografías, tono de voz y plantillas oficiales.

Reglas mientras tanto:
- El logotipo no se modifica, no se deforma ni se recolorea.
- Las plantillas oficiales no se alteran.
- La firma de correo es la corporativa, sin frases ni imágenes añadidas.

## Tono de voz

- **Cercano pero profesional.** Se puede tutear en contenido divulgativo, no en comunicaciones formales.
- **Claro.** Si un texto necesita ser abogado para entenderse, está mal escrito.
- **Riguroso.** Nada de titulares alarmistas ni de simplificaciones que induzcan a error.
- **Sin promesas.** Nunca "recupera tu dinero", sino "cómo reclamar y qué plazos tienes".
`
    },
    {
      id: 'canales-mkt',
      titulo: 'Canales y contenidos',
      md: `
## Canales activos

> [!PENDIENTE] Ajustar a los canales realmente gestionados, con el responsable y la frecuencia de publicación de cada uno.

| Canal | Objetivo | Responsable | Frecuencia |
|---|---|---|---|
| Web y blog | Captación orgánica y credibilidad | Marketing | Semanal |
| Ficha de Google Empresa | Captación local y reseñas | Marketing | Continua |
| LinkedIn | Marca profesional y empresa | Marketing y equipo | Semanal |
| Newsletter | Fidelización y reactivación | Marketing | Mensual |
| Redes sociales generalistas | Notoriedad | Marketing | Según plan |

## Ideas de contenido que funcionan en un despacho

- **Explicación de un cambio normativo** y a quién afecta.
- **Respuesta a las preguntas que más os hacen** los clientes. Son las que la gente busca.
- **Plazos y calendarios** de trámites habituales.
- **Errores frecuentes** que comete la gente en una situación concreta.
- **Explicación de una resolución relevante**, en términos comprensibles.

> [!BUENA] La mejor fuente de contenido es la bandeja de entrada del despacho. Si tres clientes distintos han preguntado lo mismo este mes, eso es un artículo.

## El papel del equipo

No hace falta que todo el mundo publique. Pero sí:

- **Avisar a Marketing** cuando detectes un tema de interés o una novedad relevante.
- **Revisar técnicamente** el contenido de tu área antes de publicarse. Ningún contenido jurídico se publica sin revisión de alguien del área.
- **Compartir** las publicaciones del despacho desde tu perfil, si te apetece.

> [!AVISO] Nadie publica en nombre del despacho sin autorización. Y nadie publica contenido jurídico sin revisión técnica previa. Un error en un artículo público es un error atribuible al despacho.

## Reseñas

Las reseñas son el principal factor de decisión en la elección de despacho local.

- Se piden **al cerrar un asunto con buen resultado**, en persona o por teléfono, no por correo masivo.
- Se pide con naturalidad: *"Si has quedado contento, nos ayudaría mucho una reseña en Google. Te mando el enlace."*
- **Nunca** se ofrece contraprestación por una reseña.
- **Nunca** se escriben reseñas propias ni se piden a personas que no han sido clientes.
- Se responden todas, positivas y negativas, sin revelar nunca si la persona ha sido cliente.
`
    },
    {
      id: 'datos-mkt',
      titulo: 'Marketing y protección de datos',
      md: `
## Consentimiento para comunicaciones comerciales

No se puede enviar comunicación comercial a cualquiera que tenga un correo en el CRM.

### Cuándo se puede enviar
- Cuando la persona ha dado **consentimiento expreso**, mediante una casilla no premarcada, y consta registrado.
- Cuando existe relación contractual previa y el envío se refiere a **servicios similares** a los contratados, siempre ofreciendo la baja en cada envío.

### Cuándo no se puede
- Contactos obtenidos de directorios, listados o redes sin consentimiento.
- Leads que no aceptaron comunicaciones.
- Clientes que solicitaron la baja, aunque sigan siendo clientes.

> [!IMPORTANTE] Las sanciones por comunicaciones comerciales no consentidas son habituales y no requieren que nadie denuncie un daño. Un solo envío masivo mal hecho puede costar más que la campaña entera.

## Requisitos de cada envío

- [ ] Identificación clara del remitente
- [ ] Enlace de baja visible y funcional en todos los envíos
- [ ] Baja atendida de forma inmediata y sin pedir explicaciones
- [ ] Registro de la baja en el CRM
- [ ] Información sobre el tratamiento de datos accesible

## Formularios de la web

Todo formulario debe:
- Recoger **solo los datos necesarios**. No pidas el DNI para una consulta inicial.
- Informar de quién trata los datos, para qué y qué derechos tiene la persona.
- Tener casilla **no premarcada** para el consentimiento.
- Diferenciar el consentimiento para atender la consulta del consentimiento para comunicaciones comerciales.

## Cookies y analítica

> [!PENDIENTE] Verificar que el banner de cookies de la web cumple: rechazar debe ser tan fácil como aceptar, y no puede haber cookies no necesarias antes del consentimiento.

## Fotografías del equipo y de eventos

- Consentimiento por escrito de cada persona que aparezca.
- Si aparecen clientes o terceros, consentimiento también.
- Retirada de la imagen si la persona lo solicita.
`
    }
  ]
};
