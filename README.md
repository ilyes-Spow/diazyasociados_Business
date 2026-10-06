# Plataforma de formación interna · Díaz y Asociados

Espacio interno del despacho para el onboarding del equipo, la documentación de
procedimientos y la difusión de novedades sobre las herramientas que utilizamos.

---

## Qué contiene

18 módulos agrupados en 6 bloques temáticos, con 58 lecciones:

| # | Bloque | Módulos |
|---|---|---|
| 1 | Fundamentos del despacho | Bienvenida y funcionamiento · Servicios · Protocolo interno · Coordinación interna |
| 2 | Herramientas y entorno digital | Herramientas y entorno informático · HubSpot / CRM · Control y gestión de clientes |
| 3 | Operativa y expedientes | Gestión de citas y agenda · Trámites y procedimientos · Gestión documental · Incidencias y situaciones especiales |
| 4 | Comercial y clientes | Gestión de leads · Formación comercial y cierre · Atención y comunicación · Marketing y comunicación |
| 5 | Administración y cumplimiento | Contabilidad, facturación y cobros · Protección de datos, confidencialidad y seguridad |
| 6 | Desarrollo continuo | Formación continua y actualizaciones |

Además, una sección de **Novedades** para comunicar cambios de herramientas,
procedimientos y normativa.

## Funcionalidades

- **Seguimiento del progreso** por persona, guardado en su navegador.
- **Buscador de texto completo** sobre todos los contenidos, insensible a tildes.
  Se abre con la tecla `/` o con `Ctrl/Cmd + K`.
- **Tema claro y oscuro**, respetando la preferencia del sistema.
- **Diseño adaptable** a móvil, tablet y escritorio.
- **Impresión** de módulos en formato limpio.
- **Vídeos** de YouTube, Vimeo, Loom o archivos propios, con carga diferida.
- **Panel de administración local** para editar contenidos sin tocar código.
- **El Muro**: el "twitter" interno del despacho. Cada persona publica
  sugerencias, quejas, ideas y agradecimientos, con reacciones. Necesita el
  servidor (`npm run dev`); las publicaciones viven en `datos/muro.json`,
  fuera de git. En desarrollo la identidad es declarativa (el nombre que
  cada uno pone); cuando se active el acceso con Google, se usará la cuenta.

---

## Desarrollo en VS Code

Requiere **Node.js 18 o superior**. No hay dependencias que instalar.

```bash
git clone <url-del-repositorio>
cd formacion-diazyasociados
npm run dev
```

Abre `http://localhost:8099`. El servidor no cachea nada, así que basta con
recargar el navegador tras cada cambio.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor local en el puerto 8099 |
| `npm run dev -- --puerto 3000` | Lo levanta en otro puerto |
| `npm run admin` | Abre el panel de administración en el puerto 8100 |
| `npm run validar` | Comprueba que los contenidos están bien formados |
| `npm run empaquetar` | Genera la versión en un solo archivo |

### Lo que ya viene configurado

Al abrir la carpeta en VS Code:

- El **servidor de desarrollo arranca solo** (tarea automática).
- `Ctrl/Cmd + Shift + B` genera la versión de un solo archivo.
- `Ctrl/Cmd + Shift + P → Ejecutar tarea de prueba` valida los contenidos.
- `F5` abre la plataforma en el navegador con el depurador conectado.
- VS Code te recomendará un **corrector ortográfico en español**, muy útil
  porque casi todo el proyecto es prosa.

> Ejecuta `npm run validar` antes de cada commit. Detecta identificadores
> repetidos, numeración descolocada, fechas mal escritas y Markdown roto.

---

## Acceso con Google

La pantalla de entrada pide **acceder con la cuenta de Google** que el
despacho asigna a cada persona. Funciona con Google Identity Services y se
configura en tres pasos:

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   crea unas credenciales de tipo **ID de cliente de OAuth → Aplicación web**.
2. En «Orígenes de JavaScript autorizados» añade `http://localhost:8099` y la
   dirección donde se publique el sitio.
3. Copia el identificador (termina en `.apps.googleusercontent.com`) en la
   constante `CLIENTE_GOOGLE` de `assets/js/app.js`.

Para limitar qué cuentas entran, rellena en el mismo archivo
`DOMINIO_PERMITIDO` (un dominio propio) o `CORREOS_PERMITIDOS` (lista de
cuentas concretas).

**Mientras `CLIENTE_GOOGLE` esté vacío**, la pantalla se muestra igual pero el
botón entra directamente, avisando de que la verificación está pendiente.

> [!PENDIENTE] Crear el ID de cliente y decidir la lista de cuentas
> permitidas. Además, esta verificación ocurre en el navegador: disuade, pero
> los archivos del sitio siguen siendo públicos para quien tenga la dirección.
> La protección de verdad hay que ponerla en el servidor que lo sirva
> (por ejemplo Cloudflare Access o Google IAP, ambos con cuentas de Google).
> Por eso ningún contenido debe incluir datos de clientes.

## Despliegue

Es un sitio estático sin proceso de compilación: puede servirse desde
cualquier alojamiento de archivos estáticos.

> [!PENDIENTE] Decidir dónde se publica.

---

## Versión en un solo archivo

Para enviar la plataforma por correo, llevarla en un USB o abrirla a doble
clic sin servidor:

```bash
node herramientas/empaquetar.mjs
```

Genera `dist/formacion-diazyasociados.html`, un único archivo con todo
incrustado (estilos, contenidos, imágenes y lógica). No lleva dependencias
y funciona sin conexión.

> El `index.html` normal **necesita un servidor** porque usa módulos ES: si lo
> abres a doble clic desde el disco, el navegador bloquea la carga. La versión
> de un solo archivo no tiene ese problema.

---

## Panel de administración

Una interfaz para crear y editar contenidos sin tocar código:

```bash
npm run admin
```

Abre `http://localhost:8100`. Permite:

- Crear, editar, reordenar y borrar **módulos y lecciones**, con vista previa en
  vivo mientras escribes.
- Publicar **novedades**, con fecha, nivel y etiquetas.
- Gestionar los **grupos** temáticos y su orden.
- Subir **vídeos** propios y generar el bloque para YouTube, Vimeo o Loom.

### Qué hace y qué no

El panel **escribe los archivos de `content/`** y nada más. No publica: los
cambios quedan en tu equipo hasta que hagas `git commit` y `git push`. Esto es
deliberado, porque significa que:

- Todo cambio pasa por git y queda revisable con `git diff`.
- Cualquier error se deshace con `git checkout`.
- No hace falta base de datos, ni servidor, ni cuentas de usuario.

Antes de sobrescribir un archivo guarda una copia en `.copias-admin/`
(fuera del control de versiones, con las 300 más recientes).

### Flujo recomendado

```bash
npm run admin          # editar en el navegador y pulsar Guardar
npm run validar        # comprobar que todo está bien formado
git diff               # revisar qué ha cambiado exactamente
git add . && git commit -m "Actualizar el módulo de herencias"
git push
```

> El panel solo escucha en `127.0.0.1`, así que no es accesible desde la red
> local ni desde internet. Escribe archivos en tu proyecto: no lo expongas.

### Numeración y orden

No hace falta llevar la cuenta de los números de módulo. Al guardar, el panel
recorre los grupos en su orden, renumera los módulos de forma correlativa,
renombra los archivos y reescribe `curriculo.js`. Así los grupos siempre quedan
seguidos y la numeración nunca se descoloca.

---

## Cómo editar los contenidos

Los contenidos están separados del código, en `content/`.

```
content/
├── curriculo.js          Registro de módulos y bloques temáticos
├── novedades.js          Entradas de la sección de Novedades
├── equipo.js             Empleado/a del mes y tablón del despacho
├── objetivos.js          Objetivos mensuales por persona (RRHH)
└── modulos/
    ├── 01-bienvenida.js
    ├── 02-servicios.js
    └── ...
```

### Equipo y objetivos del mes

- `equipo.js` alimenta la sección **Equipo**: empleado/a del mes, el
  **ranking de formación** que publica RRHH y el tablón de anuncios internos
  (eventos, avisos, celebraciones). La campana de la cabecera avisa de lo
  nuevo.
- `objetivos.js` guarda los **objetivos mensuales que RRHH asigna a cada
  persona**, ligados al correo de Google con el que entra. Cada empleado ve
  solo los suyos en la portada y los marca al completarlos (la marca queda
  en su navegador).
- Ambos se editan desde el panel de administración (pestañas **Equipo** y
  **Objetivos**), que también permite subir **fotos del equipo** a
  `assets/img/equipo/`. El ranking lo publica RRHH a mano: el progreso de
  cada persona vive en su navegador, así que no puede calcularse solo.

> [!IMPORTANTE] Como todos los contenidos, estos archivos viajan al
> navegador de todo el equipo: quien sepa mirar puede leer los objetivos de
> otros. Escribe solo objetivos operativos, nunca valoraciones personales,
> y pide permiso antes de publicar fotos o datos personales del equipo.

### Editar una lección

Abre el archivo del módulo y modifica el campo `md` de la lección. Se escribe
en Markdown.

### Añadir un módulo nuevo

1. Copia un archivo existente de `content/modulos/` y renómbralo.
2. Cambia `id`, `num`, `grupo`, `titulo`, `resumen`, `duracion` y `lecciones`.
3. Impórtalo en `content/curriculo.js` y añádelo al array `MODULOS` en la
   posición que le corresponda.

Los módulos del mismo `grupo` deben ir seguidos, y los `num` deben ser
correlativos desde 1.

### Publicar una novedad

Añade una entrada **al principio** del array de `content/novedades.js`:

```js
{
  fecha: '2026-09-15',              // AAAA-MM-DD
  nivel: 'importante',              // critica | importante | informativa
  etiquetas: ['Herramientas'],
  titulo: 'Título de la novedad',
  md: `Texto en Markdown.`
}
```

### Markdown admitido

| Sintaxis | Resultado |
|---|---|
| `## `, `### `, `#### ` | Encabezados |
| `**texto**`, `*texto*` | Negrita, cursiva |
| `- ` / `1. ` | Listas, con anidación de dos espacios |
| `- [ ]` / `- [x]` | Casillas de verificación |
| `\| a \| b \|` | Tablas |
| `> texto` | Cita |
| `---` | Separador |
| `[texto](url)` | Enlace |

**Vídeos.** Se escriben con un bloque `:::video`, la URL en la primera línea
y un título opcional en la segunda:

```
:::video
https://www.youtube.com/watch?v=IDENTIFICADOR
Título del vídeo
:::
```

Admite **YouTube, Vimeo, Loom** y archivos `.mp4` / `.webm` propios. El
reproductor **no se carga hasta que alguien pulsa**: hasta ese momento no se
hace ninguna petición al proveedor y no se instala ninguna cookie de terceros.
YouTube se incrusta además a través de `youtube-nocookie.com`.

> [!AVISO] Sube las grabaciones internas como **no listadas** (YouTube) o con
> contraseña (Vimeo). Nunca públicas: pueden contener referencias a asuntos.

**Bloques de texto preformateado** (plantillas, estructuras de carpetas): se
escriben sangrando el texto **cuatro espacios**. Dentro de los archivos de
contenido no se pueden usar acentos graves, porque cerrarían la cadena de
JavaScript; para eso está el delimitador `:::`.

**Llamadas destacadas** (bloques de color):

```
> [!NOTA] Información complementaria.
> [!AVISO] Algo que conviene vigilar.
> [!IMPORTANTE] Riesgo real si se incumple.
> [!CLAVE] La idea que hay que retener.
> [!BUENA] Buena práctica recomendada.
> [!PENDIENTE] Falta completar con datos reales del despacho.
```

---

## Estado de los contenidos

Los 18 módulos están redactados y son utilizables desde el primer día, pero
contienen **34 bloques marcados como `[!PENDIENTE]`** en los puntos donde hace
falta información que solo tiene el despacho: organigrama, tarifas, calendario
fiscal, herramientas realmente contratadas, canales activos, protocolo de
guardia y política de conservación documental.

Para localizarlos todos:

```bash
grep -rn "\[!PENDIENTE\]" content/
```

Completar esos bloques es la primera tarea antes de dar la plataforma por
cerrada.

---

## Estructura del proyecto

```
.
├── index.html                     Estructura de la página
├── robots.txt                     Bloqueo de indexación
├── assets/
│   ├── css/styles.css             Hoja de estilos completa
│   ├── img/                       Logotipo y favicon
│   └── js/
│       ├── app.js                 Arranque, enrutador e interfaz
│       ├── vistas.js              Generación del HTML de cada pantalla
│       ├── buscador.js            Índice y búsqueda
│       ├── estado.js              Tema y progreso
│       └── markdown.js            Renderizador de Markdown
├── content/                       Contenidos editables
└── herramientas/
    ├── servidor.mjs               Servidor de desarrollo local
    ├── admin.mjs                  Panel de administración
    ├── admin/                     Interfaz del panel
    ├── contenido.mjs              Lectura y escritura de content/
    ├── validar.mjs                Comprobación de los contenidos
    └── empaquetar.mjs             Genera la versión en un solo archivo
```

Sin dependencias ni proceso de compilación: HTML, CSS y JavaScript nativo con
módulos ES.

---

## Aviso sobre contenidos

Esta plataforma recoge criterios operativos internos y referencias generales a
obligaciones legales. **No sustituye la consulta de la normativa vigente ni el
asesoramiento del Colegio de Abogados o de la asesoría del despacho.** Las
referencias normativas (plazos fiscales, facturación electrónica, protección de
datos) deben verificarse antes de aplicarse.

Ningún contenido de esta plataforma debe incluir datos reales de clientes.
