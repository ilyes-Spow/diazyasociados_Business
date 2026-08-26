export default {
  id: 'documental',
  num: 10,
  grupo: 'operativa',
  titulo: 'Gestión documental y expedientes',
  resumen: 'Cómo se crea, se ordena, se conserva y se destruye la documentación de un expediente.',
  duracion: 35,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'ciclo-doc',
      titulo: 'El ciclo de vida del documento',
      md: `
## Entrada de documentación

Todo documento que entra en el despacho, por el canal que sea, pasa por el mismo circuito:

1. **Recepción**: papel, correo, portal del cliente, notificación electrónica.
2. **Identificación**: a qué expediente pertenece. Si no se sabe, se pregunta antes de archivar.
3. **Digitalización**: escaneo en PDF si llegó en papel.
4. **Nombrado**: nomenclatura estándar (ver módulo de Herramientas).
5. **Archivo**: en la subcarpeta que corresponde del expediente.
6. **Registro**: anotación en el CRM de que se ha recibido.
7. **Aviso**: al responsable del expediente si requiere acción.

> [!AVISO] Un documento que llega y se deja "encima de la mesa para luego" es un documento perdido. El circuito se completa **el mismo día** de la recepción.

## Documentos originales

Los originales del cliente son suyos y hay que devolverlos.

- Se guardan **físicamente separados** y localizables, no dentro del expediente de trabajo.
- Se registra qué originales tenemos, de qué cliente y desde cuándo.
- Se devuelven al cerrar el asunto, con **acuse de recibo firmado**.
- Si el cliente los reclama antes, se le entregan sin condicionarlo al pago.

> [!IMPORTANTE] Retener documentación original de un cliente como medida de presión por impago es una práctica prohibida deontológicamente. La reclamación de honorarios tiene sus propias vías.

## Versiones y borradores

- Los borradores viven en la carpeta de trabajo interno.
- Solo el documento definitivo va a la carpeta oficial del expediente.
- Cuando un documento se firma o se presenta, esa versión es **inmutable**: no se sobrescribe nunca.

## Documentos que no se guardan

- Copias duplicadas de lo mismo.
- Descargas temporales sin valor.
- Correos internos de coordinación sin contenido sustantivo.

Un expediente con 400 archivos de los que 300 son ruido es tan inservible como uno vacío.
`
    },
    {
      id: 'conservacion',
      titulo: 'Conservación, plazos y destrucción',
      md: `
## Cuánto tiempo se conserva

> [!PENDIENTE] Fijar la política de conservación del despacho por escrito, revisada con el asesor de protección de datos, con los plazos concretos por tipo de documento y su base legal.

Criterios generales que conviven:

- **Prescripción de la responsabilidad profesional**: el expediente debe conservarse mientras el cliente pueda reclamar.
- **Obligaciones mercantiles y fiscales**: la documentación contable y las facturas tienen plazos propios de conservación.
- **Prevención de blanqueo**: la documentación de identificación tiene su propio plazo obligatorio.
- **Protección de datos**: los datos personales **no pueden conservarse indefinidamente** sin justificación. Cumplido el plazo, hay que suprimirlos o anonimizarlos.

> [!IMPORTANTE] "Lo guardamos todo por si acaso" no es una política de conservación válida. La normativa de protección de datos exige un plazo determinado y una justificación para cada tipo de dato.

## Archivo de expedientes cerrados

Al cerrar un expediente:

- [ ] Verificación de que está completo
- [ ] Eliminación de duplicados y borradores irrelevantes
- [ ] Devolución de originales al cliente, con registro
- [ ] Marcado como cerrado en el CRM, con fecha
- [ ] Movido al archivo de expedientes cerrados
- [ ] Anotada la **fecha de destrucción prevista** según la política

## Destrucción

- **Papel**: destructora de corte cruzado o servicio certificado de destrucción. Nunca a la papelera ni al contenedor.
- **Digital**: borrado seguro, incluidas copias de seguridad, según el procedimiento del proveedor.
- **Registro**: se anota qué se destruye y cuándo.

## Dispositivos

- Los equipos que se retiran se borran de forma segura antes de salir del despacho.
- Los soportes extraíbles (USB, discos externos) están desaconsejados. Si se usan, van cifrados y se registran.
`
    },
    {
      id: 'plantillas',
      titulo: 'Plantillas y modelos',
      md: `
## La biblioteca de plantillas

El despacho mantiene una biblioteca de modelos que ahorra tiempo y garantiza consistencia.

> [!PENDIENTE] Inventariar las plantillas existentes, asignar responsable de cada una y fijar la fecha de revisión.

### Plantillas mínimas que debe tener el despacho

- [ ] Hoja de encargo profesional
- [ ] Presupuesto / propuesta de honorarios
- [ ] Información de protección de datos para clientes
- [ ] Carta de bienvenida al nuevo cliente
- [ ] Informe de estado del asunto
- [ ] Comunicación de resolución judicial
- [ ] Carta de cierre de asunto
- [ ] Acuse de devolución de originales
- [ ] Requerimiento extrajudicial
- [ ] Reclamación de honorarios impagados
- [ ] Firma de correo corporativa

## Reglas de uso

1. **Se parte siempre de la plantilla**, nunca de un documento de otro cliente.
2. **Se guarda como copia**, sin sobrescribir el modelo.
3. Se revisa que **no queden datos del modelo**: nombres de ejemplo, campos entre corchetes, importes de muestra.

> [!IMPORTANTE] Partir del documento de otro cliente es la causa número uno de fugas de datos en despachos. Un nombre olvidado en el pie de página revela a un cliente ante otro. Se parte **siempre** de la plantilla limpia.

## Control de versiones de las plantillas

- Cada plantilla lleva **fecha de última revisión** visible.
- Solo el responsable de la plantilla la modifica.
- Los cambios relevantes se anuncian en Novedades.
- Las versiones antiguas se retiran de la carpeta activa.

> [!BUENA] Antes de enviar un documento generado desde plantilla, ábrelo en PDF y léelo entero una vez. Los errores de plantilla se ven leyendo, no repasando los campos.
`
    }
  ]
};
