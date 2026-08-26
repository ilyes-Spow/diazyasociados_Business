export default {
  id: 'comercial',
  num: 13,
  grupo: 'comercial',
  titulo: 'Formación comercial y cierre',
  resumen: 'Cómo se conduce una primera visita, se presenta una propuesta y se cierra un encargo sin dejar de ser abogado.',
  duracion: 45,
  etiquetas: ['comercial'],
  lecciones: [
    {
      id: 'primera-visita',
      titulo: 'La primera visita',
      md: `
## Vender no es engañar

En un despacho, vender consiste en que una persona con un problema entienda qué opciones tiene y decida con información. Si el asunto no tiene recorrido, decirlo también es hacer bien tu trabajo.

## Antes de la visita

- [ ] Leída la nota de cualificación
- [ ] Revisada la documentación que haya enviado
- [ ] Comprobado el conflicto de interés
- [ ] Identificados los plazos aparentes
- [ ] Sala preparada, sin documentación de otros clientes a la vista
- [ ] Hoja de encargo y presupuesto disponibles por si se cierra en el momento

## Estructura de la visita

### 1. Acogida (2 min)
Nombre, agua, sitio. Explica cuánto va a durar la reunión y cómo va a ir.

### 2. Escucha (15-20 min)
Es la parte más importante y la que más se acorta por prisa. **No interrumpas.** Toma notas. Cuando termine, resume lo que has entendido y pide que te corrija.

Preguntas útiles:
- "¿Qué es lo que más te preocupa de todo esto?"
- "¿Qué has hecho hasta ahora?"
- "¿Qué te gustaría que pasara idealmente?"
- "¿Hay algún plazo o alguna fecha que tengas encima?"

### 3. Análisis (10 min)
Explica la situación jurídica en lenguaje comprensible. Sin artículos ni citas salvo que aporten. Tres cosas:
- **Dónde está** ahora.
- **Qué opciones** tiene, con sus pros y contras.
- **Qué recomiendas** y por qué.

### 4. Propuesta (5 min)
Alcance, honorarios, plazos, qué necesitas de él. Ver la lección siguiente.

### 5. Siguiente paso (3 min)
Nunca termines sin un compromiso concreto y con fecha.

> [!CLAVE] La proporción correcta es **escuchar el doble de lo que hablas**. El cliente que ha sido escuchado contrata; el que ha recibido una clase magistral, se va a pensarlo.

## Errores frecuentes

- Empezar hablando del despacho en lugar de escuchar.
- Usar tecnicismos para demostrar conocimiento.
- Prometer un resultado.
- Improvisar un precio.
- Dejar la visita sin siguiente paso.
- Dar todo el asesoramiento en la visita y no cerrar nada.
`
    },
    {
      id: 'propuesta',
      titulo: 'Presentar la propuesta',
      md: `
## Estructura de la propuesta

Toda propuesta se entrega **por escrito**, aunque se explique en persona.

1. **Situación**: el problema, en las palabras del cliente.
2. **Objetivo**: qué se pretende conseguir.
3. **Alcance**: actuaciones concretas incluidas.
4. **Fuera de alcance**: qué no está incluido, explícitamente.
5. **Honorarios**: importe, modelo y forma de pago.
6. **Gastos y suplidos**: estimación aparte.
7. **Plazos**: hitos previsibles, con la cautela debida.
8. **Qué necesitamos de ti**: documentación y decisiones.
9. **Validez** de la propuesta.

> [!AVISO] El apartado "fuera de alcance" es el que evita el 90% de los conflictos posteriores. Escríbelo siempre, aunque parezca obvio.

## Cómo se presenta el precio

**No** empieces por el precio. El precio solo tiene sentido después de que el cliente entienda el valor y el riesgo.

Secuencia:
1. Recuerda lo que está en juego, en sus términos.
2. Explica qué trabajo concreto hay detrás.
3. Da la cifra, con naturalidad y **sin disculparte**.
4. Cállate.

> [!CLAVE] Después de decir el precio, **guarda silencio**. Es incómodo, dura unos segundos y es determinante. Quien habla primero después de un precio, negocia contra sí mismo.

## Objeciones habituales

| Objeción | Qué suele significar | Respuesta |
|---|---|---|
| "Es caro" | No ve el valor todavía | Volver al riesgo y al trabajo concreto, no rebajar |
| "Me lo tengo que pensar" | Falta información o hay otro decisor | Preguntar qué falta exactamente para decidir |
| "Lo tengo que hablar con mi pareja/socio" | Hay un decisor ausente | Proponer una segunda reunión con esa persona |
| "He pedido otro presupuesto" | Está comparando | Preguntar qué incluye el otro; competir en alcance, no en precio |
| "¿Y si no ganamos?" | Miedo al riesgo | Explicar escenarios y costas con honestidad |

> [!IMPORTANTE] Nunca garantices un resultado judicial para cerrar. Además de ser deontológicamente incorrecto, crea un cliente que reclamará si pierde.

## Bajar el precio

Si hay que ajustar, **se ajusta el alcance, no la tarifa**. Bajar el precio sin tocar el alcance le dice al cliente que tu primer precio era inflado, y le enseña a negociar siempre.

Alternativas antes de rebajar:
- Fraccionar el pago.
- Reducir el alcance a la fase inicial.
- Ajustar el modelo (fijo más variable).
`
    },
    {
      id: 'cierre',
      titulo: 'El cierre y la hoja de encargo',
      md: `
## Pedir la decisión

Muchos encargos se pierden simplemente porque nadie pidió el sí. Cerrar es preguntar, con naturalidad:

- "¿Te parece que empecemos?"
- "Si te encaja, firmamos hoy y mañana mismo pido la documentación al juzgado."
- "¿Qué te falta para decidir?"

## El cierre por plazo (cuando es real)

Si hay un plazo objetivo, dilo. No como presión artificial, sino como información:

> "El plazo para impugnar termina el día 28. Para llegar con margen necesitaría empezar esta semana. Si decides más tarde, seguimos pudiendo, pero con menos margen de maniobra."

> [!AVISO] Nunca inventes una urgencia que no existe. Se detecta, destruye la confianza y en un despacho es especialmente grave.

## La hoja de encargo

Es obligatoria y es el documento que protege a ambas partes. Debe recoger:

- Identificación completa de las partes.
- Objeto del encargo y alcance, con las exclusiones.
- Honorarios, modelo, forma y calendario de pago.
- Provisión de fondos.
- Gastos y suplidos.
- Duración y causas de terminación.
- Información de protección de datos.
- Vía de reclamación y sometimiento, en su caso, al arbitraje o mediación colegial.

> [!IMPORTANTE] **No se inicia ninguna actuación sin hoja de encargo firmada**, salvo urgencia justificada y autorizada por Dirección, en cuyo caso se firma en cuanto sea posible y se deja constancia del motivo.

## Justo después del cierre

- [ ] Hoja de encargo firmada y archivada
- [ ] Negocio marcado como ganado en HubSpot
- [ ] Expediente creado con la estructura estándar
- [ ] Provisión de fondos solicitada
- [ ] Plazos iniciales anotados en agenda
- [ ] Correo de bienvenida enviado, con el interlocutor asignado
- [ ] Primera acción del asunto agendada

> [!BUENA] El correo de bienvenida enviado el mismo día del cierre reduce drásticamente el arrepentimiento del cliente. Es el momento en que decide si acertó.

## Después de un no

Un no no es el final. Registra el motivo real, agradece la confianza y déjale la puerta abierta:

> "Gracias por contar con nosotros. Si cambia algo o te surge cualquier duda más adelante, aquí estamos."

Muchos clientes vuelven meses después, o recomiendan a alguien.
`
    }
  ]
};
