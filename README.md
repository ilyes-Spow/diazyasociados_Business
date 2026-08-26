# Plataforma de formación interna · Díaz y Asociados

Espacio interno del despacho para el onboarding del equipo, la documentación de
procedimientos y la difusión de novedades sobre las herramientas que utilizamos.

Publicada en **https://formacion-diazyasociados.netlify.app**

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

- **Puerta de acceso** con clave compartida.
- **Seguimiento del progreso** por persona, guardado en su navegador.
- **Buscador de texto completo** sobre todos los contenidos, insensible a tildes.
  Se abre con la tecla `/` o con `Ctrl/Cmd + K`.
- **Tema claro y oscuro**, respetando la preferencia del sistema.
- **Diseño adaptable** a móvil, tablet y escritorio.
- **Impresión** de módulos en formato limpio.

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
| `npm run validar` | Comprueba que los contenidos están bien formados |
| `npm run empaquetar` | Genera la versión en un solo archivo |
| `npm run clave -- "NuevaClave"` | Calcula la huella de una clave nueva |

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

## Acceso

La clave actual es **`Onboarding`** (se admite en mayúsculas o minúsculas).

### Cambiar la clave

La plataforma admite dos capas de protección. La primera está siempre activa;
la segunda es opcional y recomendable.

#### 1. Puerta del navegador (activa por defecto)

En `assets/js/app.js` se guarda el SHA-256 de la clave, no la clave en claro.
Para cambiarla, genera la huella de la nueva clave **en minúsculas**:

```bash
printf '%s' 'nuevaclave' | shasum -a 256
```

y sustituye el valor de la constante `HUELLA_CLAVE`.

> Esta capa disuade, pero no es seguridad real: los contenidos viajan al
> navegador y alguien con conocimientos técnicos puede leerlos sin la clave.
> Por eso ningún contenido de esta plataforma debe incluir datos de clientes.

#### 2. Puerta en el servidor (recomendada)

El repositorio incluye una función de borde (`netlify/edge-functions/acceso.ts`)
que valida la clave **antes** de servir nada. Para activarla:

1. En Netlify, ve a **Site configuration → Environment variables**.
2. Crea la variable `SITE_PASSWORD` con la clave del despacho.
3. Vuelve a desplegar.

A partir de ese momento nadie recibe el contenido sin haber introducido la
clave, y la puerta del navegador se salta automáticamente para no pedirla dos
veces. **Mientras la variable no exista, la función no hace nada.**

---

## Desplegar en tu propia cuenta de Netlify

No hay proceso de compilación: es un sitio estático que se sirve tal cual.
`netlify.toml` ya trae la configuración, así que no hay que rellenar nada.

### Opción A · Arrastrar y soltar (2 minutos, sin GitHub)

1. Descarga el proyecto como ZIP y descomprímelo.
2. Entra en [app.netlify.com/drop](https://app.netlify.com/drop) con tu cuenta.
3. Arrastra **la carpeta descomprimida** (no el ZIP).
4. Netlify te da una dirección del tipo `nombre-aleatorio.netlify.app`.
5. En **Site configuration → Change site name**, ponle el nombre que quieras.

Para actualizarlo más adelante: **Deploys → Deploy manually** y vuelves a
arrastrar la carpeta.

### Opción B · Conectado a Git (recomendada a medio plazo)

Cada cambio que subas se publica solo.

1. En Netlify: **Add new site → Import an existing project**.
2. Elige el proveedor (GitHub, GitLab o Bitbucket) y autoriza tu cuenta.
3. Selecciona este repositorio y la rama.
4. Deja el comando de compilación **vacío** y el directorio de publicación
   en `.` (Netlify lo lee de `netlify.toml`).
5. **Deploy site**.

Cada `git push` a la rama conectada vuelve a desplegar automáticamente.

### Después de desplegar, en cualquiera de las dos opciones

- **Nombre del sitio**: Site configuration → Change site name.
- **Dominio propio** (por ejemplo `formacion.diazyasociados.es`):
  Domain management → Add a domain. El certificado HTTPS es automático.
- **Clave en servidor** (recomendado): Site configuration →
  Environment variables → `SITE_PASSWORD`. Ver el apartado de Acceso.

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

## Cómo editar los contenidos

Los contenidos están separados del código, en `content/`.

```
content/
├── curriculo.js          Registro de módulos y bloques temáticos
├── novedades.js          Entradas de la sección de Novedades
└── modulos/
    ├── 01-bienvenida.js
    ├── 02-servicios.js
    └── ...
```

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
├── netlify.toml                   Configuración de despliegue y cabeceras
├── _redirects                     Enrutado del lado del cliente
├── robots.txt                     Bloqueo de indexación
├── assets/
│   ├── css/styles.css             Hoja de estilos completa
│   ├── img/                       Logotipo y favicon
│   └── js/
│       ├── app.js                 Arranque, enrutador e interfaz
│       ├── vistas.js              Generación del HTML de cada pantalla
│       ├── buscador.js            Índice y búsqueda
│       ├── estado.js              Sesión, tema y progreso
│       └── markdown.js            Renderizador de Markdown
├── content/                       Contenidos editables
├── herramientas/
│   ├── servidor.mjs               Servidor de desarrollo local
│   ├── validar.mjs                Comprobación de los contenidos
│   ├── empaquetar.mjs             Genera la versión en un solo archivo
│   └── clave.mjs                  Calcula la huella de una clave nueva
└── netlify/edge-functions/
    └── acceso.ts                  Puerta de acceso en servidor (opcional)
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
