/* ===============================================================
   acceso.ts - Puerta de acceso validada en el servidor
   ---------------------------------------------------------------
   Se activa SOLO si existe la variable de entorno SITE_PASSWORD.
   Sin ella, deja pasar todas las peticiones y la protección queda
   en manos de la puerta del navegador (assets/js/app.js).

   Cómo activarla:
     Netlify > Site configuration > Environment variables
     SITE_PASSWORD = la clave del despacho
   =============================================================== */

const COOKIE_SESION = 'dya_sesion';
const COOKIE_AVISO = 'dya_gate';
const RUTA_LOGIN = '/__acceso';
const DURACION = 60 * 60 * 24 * 30; // 30 días en segundos

const codificador = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function firmar(mensaje: string, secreto: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    'raw', codificador.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', clave, codificador.encode(mensaje));
  return b64url(new Uint8Array(firma));
}

async function crearToken(secreto: string): Promise<string> {
  const caduca = String(Math.floor(Date.now() / 1000) + DURACION);
  return caduca + '.' + (await firmar(caduca, secreto));
}

async function tokenValido(token: string | null, secreto: string): Promise<boolean> {
  if (!token) return false;
  const partes = token.split('.');
  if (partes.length !== 2) return false;
  const [caduca, firma] = partes;
  if (!/^\d+$/.test(caduca) || Number(caduca) < Math.floor(Date.now() / 1000)) return false;

  const esperada = await firmar(caduca, secreto);
  if (esperada.length !== firma.length) return false;
  // Comparación de tiempo constante.
  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
  }
  return diferencia === 0;
}

function leerCookie(cabecera: string | null, nombre: string): string | null {
  if (!cabecera) return null;
  for (const trozo of cabecera.split(';')) {
    const [k, ...v] = trozo.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

function paginaLogin(fallo: boolean, destino: string): Response {
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Acceso restringido · Díaz y Asociados</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.25rem;
 font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
 color:#101a26;background:linear-gradient(160deg,#0a1a2b,#12263f 55%,#0d2138)}
form{width:min(430px,100%);background:#fff;border-radius:22px;padding:2.1rem 2rem 1.7rem;
 box-shadow:0 18px 45px rgba(0,0,0,.35)}
h1{font-family:Georgia,serif;font-size:1.5rem;margin:0 0 .45rem;letter-spacing:-.02em}
p{margin:0 0 1.4rem;color:#3d4b5c;font-size:.9rem;line-height:1.6}
label{display:block;font-size:.82rem;font-weight:600;color:#3d4b5c;margin-bottom:.4rem}
input{width:100%;padding:.72rem .9rem;border-radius:10px;border:1.5px solid #c4ccd9;
 background:#f9fafb;font:inherit}
input:focus{outline:none;border-color:#2a5580;box-shadow:0 0 0 3.5px rgba(42,85,128,.18)}
button{width:100%;margin-top:1.3rem;padding:.7rem 1.15rem;border:0;border-radius:10px;
 background:#12263f;color:#fff;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1b3a5c}
.marca{display:flex;align-items:center;gap:.8rem;margin-bottom:1.6rem}
.marca svg{width:44px;height:44px;flex:none}
.marca strong{display:block;font-family:Georgia,serif;font-size:1.02rem}
.marca span{display:block;font-size:.78rem;color:#697b8f}
.err{margin:.85rem 0 0;padding:.6rem .8rem;border-radius:6px;font-size:.85rem;
 background:#fdeceb;color:#b3261e;border:1px solid rgba(179,38,30,.3)}
</style></head><body>
<form method="POST" action="${RUTA_LOGIN}">
<input type="hidden" name="destino" value="${destino.replace(/"/g, '&quot;')}">
<div class="marca">
<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#12263f"/>
<g fill="none" stroke="#c9a227" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M32 15v34"/><path d="M18 21h28"/><path d="M18 21l-6 13h12z"/><path d="M46 21l-6 13h12z"/><path d="M23 49h18"/>
</g></svg>
<div><strong>Díaz y Asociados</strong><span>Plataforma de formación interna</span></div>
</div>
<h1>Acceso restringido</h1>
<p>Este espacio contiene documentación interna del despacho. Introduce la clave facilitada por Dirección.</p>
<label for="clave">Clave de acceso</label>
<input type="password" id="clave" name="clave" required autofocus autocomplete="current-password" placeholder="••••••••••">
${fallo ? '<p class="err">La clave no es correcta. Inténtalo de nuevo.</p>' : ''}
<button type="submit">Entrar</button>
</form></body></html>`;

  return new Response(html, {
    status: fallo ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

export default async function acceso(request: Request): Promise<Response | void> {
  const secreto = Deno.env.get('SITE_PASSWORD');

  // Sin clave configurada, la función no hace nada.
  if (!secreto) return;

  const url = new URL(request.url);
  const cookies = request.headers.get('cookie');

  // Envío del formulario de acceso.
  if (request.method === 'POST' && url.pathname === RUTA_LOGIN) {
    const datos = await request.formData();
    const introducida = String(datos.get('clave') || '').trim();
    const destinoBruto = String(datos.get('destino') || '/');
    // Solo se admiten rutas internas, para evitar redirecciones abiertas.
    const destino = destinoBruto.startsWith('/') && !destinoBruto.startsWith('//')
      ? destinoBruto : '/';

    if (introducida.toLowerCase() !== secreto.trim().toLowerCase()) {
      return paginaLogin(true, destino);
    }

    const token = await crearToken(secreto);
    const base = `Path=/; Max-Age=${DURACION}; SameSite=Lax; Secure`;
    const cabeceras = new Headers({ location: destino, 'cache-control': 'no-store' });
    cabeceras.append('set-cookie', `${COOKIE_SESION}=${token}; HttpOnly; ${base}`);
    cabeceras.append('set-cookie', `${COOKIE_AVISO}=ok; ${base}`);
    return new Response(null, { status: 303, headers: cabeceras });
  }

  // Sesión válida: se deja pasar.
  if (await tokenValido(leerCookie(cookies, COOKIE_SESION), secreto)) return;

  // Recursos que pueden servirse sin sesión (nada sensible).
  if (url.pathname === '/robots.txt' || url.pathname.startsWith('/assets/img/')) return;

  return paginaLogin(false, url.pathname + url.search);
}
