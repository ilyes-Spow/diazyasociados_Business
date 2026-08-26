export default {
  id: 'herramientas',
  num: 5,
  grupo: 'herramientas',
  titulo: 'Herramientas y entorno informático',
  resumen: 'El conjunto de aplicaciones que usamos, para qué sirve cada una y las reglas de uso que no se negocian.',
  duracion: 40,
  etiquetas: ['obligatorio', 'herramientas'],
  lecciones: [
    {
      id: 'mapa',
      titulo: 'Mapa de herramientas',
      md: `
## Una herramienta, un propósito

El error más común al incorporarse es usar la herramienta equivocada: guardar un documento de cliente en el escritorio, apuntar un plazo en una nota adhesiva o registrar una conversación en el chat. Cada cosa tiene su sitio.

> [!PENDIENTE] Sustituir por el listado real de herramientas contratadas, con enlaces de acceso y responsable de cada una.

| Herramienta | Para qué | Nunca se usa para |
|---|---|---|
| Correo corporativo | Comunicación externa con constancia | Almacenar documentos definitivos |
| HubSpot (CRM) | Clientes, leads, expedientes, notas, tareas | Archivo documental pesado |
| Gestor documental | Documentos de expediente, plantillas, escaneos | Ficheros personales |
| Agenda compartida | Citas, vistas, vencimientos, ausencias | Tareas sin fecha |
| Gestor de contraseñas | Todas las credenciales del despacho | Compartir claves por chat |
| Firma electrónica | Firma de hojas de encargo y documentos | Documentos que exigen firma manuscrita |
| Chat interno | Coordinación rápida del día | Registro de información de cliente |
| Videollamada | Reuniones con cliente y equipo | Grabar sin consentimiento |
| Programa de facturación | Facturas, cobros, remesas | Presupuestos no aceptados |

## Regla de oro del archivo

**Nada relevante vive en tu equipo local.** El escritorio, la carpeta de descargas y el disco duro no son sitios de archivo. Si tu portátil desaparece hoy, no se puede perder nada.

Excepción práctica: puedes tener un archivo temporal mientras trabajas en él, pero al terminar la sesión debe estar en el gestor documental y borrado de local.

> [!IMPORTANTE] Guardar documentación de cliente en un servicio personal (tu Drive particular, tu WhatsApp, tu correo personal) es una infracción grave de protección de datos y del deber de secreto. No hay circunstancia que lo justifique.
`
    },
    {
      id: 'accesos',
      titulo: 'Accesos, contraseñas y doble factor',
      md: `
## Gestor de contraseñas: obligatorio

Todas las credenciales del despacho viven en el gestor de contraseñas. No en un cuaderno, no en un archivo de texto, no en el navegador sin protección.

### Reglas
- **Una contraseña por servicio.** Nunca reutilizar.
- **Generadas por el gestor**, no inventadas.
- **Nunca se comparten por chat o correo.** Se comparte el elemento desde el propio gestor.
- **Doble factor activado** en todo servicio que lo permita, sin excepciones.

### Qué hacer si necesitas un acceso que no tienes
1. Solicítalo a quien gestiona sistemas indicando **para qué** lo necesitas.
2. No pidas a un compañero que te preste el suyo. Los accesos son nominativos: lo que se haga con ellos queda a tu nombre.

> [!IMPORTANTE] Compartir tus credenciales con otra persona, aunque sea del equipo, te hace responsable de todo lo que se haga con ellas. Y rompe la trazabilidad que exige la normativa de protección de datos.

## Doble factor

Configúralo con una aplicación de autenticación, no por SMS cuando haya alternativa.

Guarda los **códigos de recuperación** en el gestor de contraseñas del despacho, nunca en el mismo teléfono que genera los códigos.

## Bloqueo de sesión

- Bloqueo automático de pantalla a los pocos minutos de inactividad.
- Bloqueo manual siempre que te levantes.
- Cierre de sesión al terminar la jornada en equipos compartidos.

## Al causar baja o cambiar de puesto

- [ ] Revocación de todos los accesos el mismo día
- [ ] Devolución de equipos y tarjetas de acceso
- [ ] Traspaso documentado de expedientes
- [ ] Recordatorio por escrito de que el deber de secreto continúa
`
    },
    {
      id: 'archivo',
      titulo: 'Nomenclatura y estructura de carpetas',
      md: `
## Por qué importa el nombre de un archivo

Un documento mal nombrado es un documento perdido. Cuando un compañero busca "la sentencia del caso de la comunidad de propietarios" y encuentra tres archivos llamados "documento final v2 BUENO.pdf", el sistema ha fallado.

## Estructura estándar de expediente

> [!PENDIENTE] Ajustar a la estructura real del gestor documental del despacho.

Propuesta de estructura por expediente:

    AÑO-NÚMERO - APELLIDOS CLIENTE - MATERIA/
      01 - Encargo y honorarios/
      02 - Documentación del cliente/
      03 - Comunicaciones/
      04 - Escritos presentados/
      05 - Resoluciones y notificaciones/
      06 - Prueba/
      07 - Facturación/
      99 - Trabajo interno/

## Nomenclatura de archivos

Formato: **FECHA - TIPO - DESCRIPCIÓN BREVE**

La fecha en formato AAAA-MM-DD para que la ordenación alfabética coincida con la cronológica.

Ejemplos correctos:

    2024-03-12 - Demanda - Reclamacion cantidad.pdf
    2024-04-02 - Contestacion - Parte contraria.pdf
    2024-04-18 - Auto - Admision a tramite.pdf
    2024-05-06 - Nomina cliente - Marzo 2024.pdf

Ejemplos incorrectos:

    demanda.pdf
    Documento1 (2).docx
    escaneo_20240312_final_BUENO_v3.pdf
    IMG_4471.jpg

## Reglas
- Sin tildes ni caracteres especiales en el nombre de archivo (evita problemas al sincronizar).
- Sin espacios al principio ni al final.
- Sin nombres personales de trabajadores en el archivo.
- **Versiones**: no se acumulan versiones en la carpeta principal. El definitivo va en su sitio; los borradores, en "99 - Trabajo interno".

> [!BUENA] Antes de guardar, pregúntate: si un compañero busca este documento dentro de dos años sin saber nada del caso, ¿lo encontraría por el nombre? Si no, renómbralo.
`
    },
    {
      id: 'buenas-practicas',
      titulo: 'Buenas prácticas y errores frecuentes',
      md: `
## Correo electrónico

- **Revisa el destinatario antes de enviar.** El autocompletado es la primera causa de fugas de datos en despachos.
- **Copia oculta** cuando escribas a varios clientes que no deben verse entre sí.
- **Adjuntos**: comprueba que el archivo adjunto es el correcto abriéndolo, no fiándote del nombre.
- **Documentación sensible**: envío por enlace protegido del gestor documental, no como adjunto abierto.
- Todo correo relevante con un cliente se vincula al expediente en el CRM.

> [!AVISO] Un correo enviado no se puede recuperar. La función de "deshacer envío" dura segundos y no funciona si el destinatario es externo. Lee dos veces antes de pulsar enviar.

## Escaneo y digitalización

- Escanea en PDF, no en imagen suelta.
- Un documento, un archivo. No mezcles cinco documentos distintos en un PDF.
- Comprueba que todas las páginas están y son legibles antes de destruir el original.
- Los originales que el cliente debe recuperar se guardan aparte y se anota su devolución.

## Equipos y movilidad

- Portátil con cifrado de disco activado.
- Nunca dejes el equipo en el coche a la vista.
- Nunca trabajes con documentación de cliente en un espacio donde la pantalla sea visible por terceros (tren, cafetería, sala de espera del juzgado).
- Filtro de privacidad en la pantalla si trabajas fuera con frecuencia.

## Errores más frecuentes del primer mes

| Error | Consecuencia | Cómo evitarlo |
|---|---|---|
| Guardar en el escritorio | El documento no existe para el resto del equipo | Guardar directamente en el gestor documental |
| Apuntar un plazo en papel | Plazo perdido | Todo plazo va a la agenda al conocerlo |
| Responder a un cliente sin registrar | Nadie más sabe qué se le dijo | Nota en el CRM en el momento |
| Reenviar un correo con hilo completo | Se filtra información de terceros | Revisar el hilo antes de reenviar |
| Usar el móvil personal para el cliente | Datos fuera de control del despacho | Usar los canales corporativos |

> [!CLAVE] Si dudas de si algo debe registrarse, regístralo. El coste de registrar de más es un minuto; el de registrar de menos puede ser un asunto.
`
    }
  ]
};
