export default {
  id: 'facturacion',
  num: 16,
  grupo: 'administracion',
  titulo: 'Contabilidad, facturación y cobros',
  resumen: 'Cómo se presupuesta, se factura, se cobra y se reclama en el despacho. Y qué hacer ante un impago.',
  duracion: 40,
  etiquetas: ['administracion'],
  lecciones: [
    {
      id: 'ciclo-facturacion',
      titulo: 'El ciclo de facturación',
      md: `
## Del encargo al cobro

    Hoja de encargo firmada
      -> Provisión de fondos solicitada
        -> Provisión cobrada
          -> Inicio de la actuación
            -> Hitos de facturación según encargo
              -> Factura emitida
                -> Cobro
                  -> Conciliación bancaria
                    -> Cierre del expediente económico

> [!IMPORTANTE] La regla del despacho: **no se inicia la actuación sin provisión de fondos cobrada**, salvo excepción autorizada por Dirección. La provisión no es desconfianza: es la práctica normal del sector y protege ambas partes.

## Provisión de fondos

- Se solicita **por escrito**, indicando concepto e importe.
- Se ingresa en la cuenta del despacho.
- Se aplica a la primera factura o a los suplidos según lo pactado.
- Si el asunto termina antes de consumirla, **se devuelve el sobrante**, con liquidación detallada.

> [!AVISO] La provisión de fondos no es un ingreso hasta que se aplica a una factura. Contablemente es un anticipo de clientes. Consulta con Administración antes de dar por facturado lo que solo es provisión.

## Cuándo se factura

> [!PENDIENTE] Fijar los hitos de facturación estándar del despacho por tipo de servicio.

Hitos habituales:

| Modelo | Hitos |
|---|---|
| Precio cerrado | 50% a la firma, 50% a la finalización |
| Por fases | Al término de cada fase |
| Por horas | Mensual, con detalle de horas y tareas |
| Iguala | Mensual, primer día del mes |
| Éxito | Al obtener el resultado y ser firme |

## Contenido obligatorio de la factura

- [ ] Número correlativo y serie
- [ ] Fecha de expedición
- [ ] Datos completos del despacho, con NIF
- [ ] Datos completos del cliente, con NIF
- [ ] Descripción del servicio, identificable
- [ ] Base imponible
- [ ] Tipo de IVA aplicado y cuota
- [ ] Retención de IRPF cuando proceda
- [ ] Suplidos, separados y sin IVA
- [ ] Importe total
- [ ] Forma de pago y vencimiento

> [!IMPORTANTE] Los **suplidos** (tasas, procurador, peritos, registros) se facturan aparte, sin IVA, y requieren que la factura del tercero esté a nombre del cliente. Si está a nombre del despacho, no es suplido y lleva IVA. Ante la duda, consulta con Administración.

## Descripción del servicio

Ni tan genérica que el cliente no sepa qué paga, ni tan detallada que revele información protegida por el secreto profesional.

- Mal: "Servicios jurídicos".
- Mal: "Asesoramiento en el divorcio contencioso con su cónyuge por infidelidad".
- Bien: "Honorarios por dirección letrada en procedimiento de familia. Expediente 2024-118."
`
    },
    {
      id: 'cobros',
      titulo: 'Cobros y control de tesorería',
      md: `
## Formas de pago admitidas

> [!PENDIENTE] Confirmar las formas de pago realmente aceptadas y sus límites.

- Transferencia bancaria a la cuenta del despacho.
- Domiciliación bancaria, con mandato firmado (habitual en igualas).
- Tarjeta, si hay TPV.
- Efectivo, **solo dentro de los límites legales** y con recibo.

> [!IMPORTANTE] Existen límites legales al pago en efectivo en operaciones con empresarios o profesionales. Superarlos es una infracción con sanción para ambas partes. Ante cualquier duda sobre un pago en efectivo, consulta con Dirección **antes** de aceptarlo.

## Señales de alerta en el cobro

Estas situaciones deben comunicarse a Dirección antes de aceptar el pago:

- Pago desde una cuenta de un tercero sin relación con el asunto.
- Pago fraccionado en importes justo por debajo de un límite legal.
- Pago desde el extranjero sin justificación.
- Oferta de pagar por encima de lo facturado.
- Cliente que evita justificar el origen de los fondos.

Son indicadores de riesgo en materia de prevención de blanqueo de capitales.

## Seguimiento de cobros

- **Semanal**: revisión de facturas vencidas no cobradas.
- **Mensual**: informe de antigüedad de la deuda por cliente.
- Toda gestión de cobro se **registra en el CRM**, con fecha y resultado.

## Escalado del impago

| Días de retraso | Acción | Quién |
|---|---|---|
| 3 | Recordatorio amable por correo, con la factura adjunta | Administración |
| 10 | Llamada telefónica para confirmar recepción y fecha de pago | Administración |
| 20 | Comunicación del responsable del expediente | Responsable |
| 30 | Requerimiento formal por escrito, con acuse | Administración |
| 45 | Valoración de suspensión de actuaciones | Dirección |
| 60 | Valoración de reclamación judicial o jura de cuentas | Dirección |

> [!AVISO] La suspensión de actuaciones por impago **nunca** puede dejar al cliente en indefensión. Si hay un plazo vivo, se atiende y se reclama por la vía que corresponda. Además, la renuncia a la defensa requiere comunicación y plazo suficiente para que el cliente designe otro profesional. Esta decisión es siempre de Dirección.

## Prevención del impago

- Provisión de fondos siempre.
- Presupuesto cerrado y aceptado por escrito.
- Facturación periódica en lugar de una factura grande al final.
- Comunicación de desviaciones **antes** de que se produzcan.
- Domiciliación en asuntos de larga duración.

> [!CLAVE] La mayoría de impagos no nacen de la mala fe: nacen de una factura que el cliente no esperaba. Un cliente informado paga.
`
    },
    {
      id: 'obligaciones',
      titulo: 'Obligaciones contables y fiscales',
      md: `
## Calendario fiscal del despacho

> [!PENDIENTE] Completar con el calendario real, los modelos aplicables y quién los presenta (gestoría externa o interno).

Obligaciones periódicas habituales de un despacho:

| Obligación | Periodicidad | Nota |
|---|---|---|
| IVA repercutido y soportado | Trimestral o mensual | Según régimen |
| Retenciones de IRPF practicadas | Trimestral | Profesionales y arrendamientos |
| Pagos fraccionados / Impuesto de Sociedades | Trimestral y anual | Según forma jurídica |
| Declaración anual de operaciones con terceros | Anual | Sobre umbral legal |
| Libros registro | Continua | Facturas emitidas, recibidas y bienes de inversión |

## Facturación electrónica

La normativa de facturación electrónica obligatoria entre empresas y profesionales, y los requisitos sobre sistemas informáticos de facturación, están en despliegue con calendarios propios.

> [!PENDIENTE] Verificar el estado de adaptación del despacho: si el programa de facturación cumple los requisitos de los sistemas informáticos de facturación, y en qué fecha resulta exigible según el tamaño del despacho. Confirmar con la asesoría fiscal.

> [!AVISO] Esta es un área en cambio normativo. No des por buena esta ficha sin verificar la fecha de última revisión y consultar con la asesoría.

## Qué necesita Administración de ti

- **Justificantes de gastos** el mismo mes en que se producen, no en diciembre.
- Facturas de proveedores **a nombre del despacho**, con el NIF correcto.
- Suplidos con la factura **a nombre del cliente**.
- Comunicación de cualquier cobro recibido directamente.
- Aviso de los hitos de facturación de tus expedientes.

> [!BUENA] Fotografía el justificante en el momento del gasto y súbelo el mismo día. Los tickets se pierden, se borran y dejan de ser legibles en semanas.

## Confidencialidad y contabilidad

La información económica del despacho es confidencial: facturación, márgenes, honorarios de otros compañeros y datos de clientes. No se comenta fuera del ámbito estrictamente necesario.
`
    }
  ]
};
