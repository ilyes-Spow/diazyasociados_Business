export default {
  id: 'coordinacion',
  num: 4,
  grupo: 'fundamentos',
  titulo: 'Coordinación interna',
  resumen: 'Cómo se reparte el trabajo, cómo se hace seguimiento y cómo se toman decisiones entre áreas.',
  duracion: 25,
  etiquetas: ['obligatorio'],
  lecciones: [
    {
      id: 'ritmo',
      titulo: 'El ritmo de trabajo del despacho',
      md: `
## Rutinas fijas

El despacho funciona con un ritmo de reuniones y revisiones que no se improvisa. Conocerlo te ahorra reuniones innecesarias.

> [!PENDIENTE] Ajustar días y horas a la realidad del despacho.

| Rutina | Frecuencia | Quién participa | Objetivo |
|---|---|---|---|
| Repaso de agenda del día | Diaria, primera hora | Coordinación y responsables | Ver citas, vencimientos y ausencias del día |
| Reunión de equipo | Semanal | Todo el equipo | Casos relevantes, novedades, bloqueos |
| Revisión de cartera | Mensual | Dirección y responsables de área | Estado de expedientes, asuntos parados |
| Revisión comercial | Semanal | Comercial y Dirección | Leads, presupuestos pendientes, cierres |
| Revisión de cobros | Mensual | Administración y Dirección | Facturación emitida e impagados |

## Cómo se prepara una reunión de equipo

No se llega a la reunión a improvisar. Antes de la reunión:

1. Revisa tus expedientes activos y detecta los que están **bloqueados** (esperando algo que no llega).
2. Anota en una línea qué necesitas de quién.
3. Si vas a plantear un caso, lleva el expediente localizado y los datos a mano.

Durante la reunión:
- Se habla de lo que está bloqueado o de lo que ha cambiado, no de lo que va bien.
- Toda decisión que se tome se anota en el expediente correspondiente al terminar.

> [!BUENA] Regla de los dos minutos: si tu punto necesita más de dos minutos de contexto, no es un punto de reunión de equipo, es una reunión aparte con quien corresponda.
`
    },
    {
      id: 'reparto',
      titulo: 'Reparto de asuntos y responsabilidad',
      md: `
## Quién es el responsable de un expediente

Todo expediente tiene **un responsable único** identificado en el CRM. Puede haber varias personas trabajando en él, pero solo una responde de:

- Que los plazos estén controlados.
- Que el cliente esté informado.
- Que el expediente esté completo y ordenado.
- Que la facturación esté emitida cuando corresponde.

## Cómo se asigna

> [!PENDIENTE] Documentar el criterio real de asignación del despacho.

Criterios habituales, en orden:

1. **Área de especialidad** del asunto.
2. **Carga de trabajo** actual de cada persona.
3. **Continuidad**: si el cliente ya trabajó con alguien del equipo, se mantiene el mismo interlocutor salvo motivo justificado.
4. **Conflicto de interés**: si existe, se reasigna o se rechaza el asunto.

## Delegación

Puedes delegar tareas concretas (recopilar documentación, redactar un borrador, presentar un escrito), pero **la responsabilidad no se delega**. Si delegas:

- Di qué hay que hacer, para cuándo y con qué formato.
- Comprueba el resultado antes de que salga del despacho.
- Deja constancia en el expediente de que se delegó y a quién.

## Traspaso de un expediente

Cuando un expediente cambia de responsable:

- [ ] Reunión de traspaso con ambos responsables
- [ ] Nota de traspaso en el CRM: estado, próximos pasos, plazos vivos, particularidades del cliente
- [ ] Cambio del responsable en el CRM y en el gestor documental
- [ ] Comunicación al cliente del nuevo interlocutor
- [ ] Traspaso de citas de agenda

> [!IMPORTANTE] Un expediente no se considera traspasado hasta que el nuevo responsable lo confirma por escrito. Hasta ese momento sigue siendo tuyo.
`
    },
    {
      id: 'escalado',
      titulo: 'Cuándo y cómo escalar',
      md: `
## Escalar no es fracasar

Escalar a tiempo es una señal de criterio. Lo que sí es un problema es escalar tarde.

## Escala inmediatamente, sin esperar

- Un **plazo perdido o en riesgo** de perderse.
- Un **error** que ya ha salido del despacho.
- Un **cliente que amenaza** con reclamar, denunciar o acudir al Colegio.
- Una **sospecha de conflicto de interés** aparecida a mitad de asunto.
- Cualquier posible **brecha de seguridad** o pérdida de datos.
- Una petición del cliente que te parece **irregular o ilícita**.
- Un requerimiento de un juzgado, la Agencia Tributaria o cualquier autoridad dirigido al despacho.

## Escala en el plazo de la jornada

- Un asunto que se complica más allá del presupuesto cerrado.
- Un cliente insatisfecho, aunque no amenace.
- Un impago que ya supera el plazo previsto.
- Una duda jurídica que te bloquea y no has resuelto en un tiempo razonable.

## Cómo escalar bien

Un buen escalado ocupa cuatro frases:

1. **Qué ha pasado**, en una frase, sin rodeos.
2. **A quién afecta**: cliente, expediente, importe, plazo.
3. **Qué has hecho ya**.
4. **Qué necesitas**: una decisión, una autorización, ayuda concreta.

Ejemplo:

> "El expediente 2024-118 tiene vista el jueves y el cliente no ha aportado la nómina que le pedimos hace dos semanas. Le he llamado tres veces y he enviado dos correos, sin respuesta. Necesito saber si vamos a la vista sin ese documento o pedimos suspensión."

> [!AVISO] Nunca escales un problema por chat sin asegurarte de que se ha leído. Si es grave, llama.

## Lo que no se escala

- Decisiones que están claramente dentro de tu ámbito y sobre las que ya tienes criterio.
- Consultas que puedes resolver leyendo esta plataforma o el expediente.

> [!CLAVE] Antes de escalar una duda de procedimiento, busca en el buscador de esta plataforma. Muchas respuestas ya están escritas.
`
    }
  ]
};
