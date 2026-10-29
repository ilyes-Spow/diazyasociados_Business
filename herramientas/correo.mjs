/* ===============================================================
   correo.mjs - Avisos por correo, sin dependencias
   ---------------------------------------------------------------
   Cliente SMTP mínimo sobre TLS (puerto 465) para enviar los
   avisos de la plataforma: publicaciones de Conecta, novedades,
   anuncios, empleado del mes y ranking.

   Configuración en datos/correo.json (fuera de git). Copia
   herramientas/correo.ejemplo.json y rellénalo. Mientras no
   exista o esté incompleto, los avisos simplemente no se envían
   y la plataforma funciona igual.
   =============================================================== */

import { readFile } from 'node:fs/promises';
import { connect } from 'node:tls';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO_CONFIG = join(RAIZ, 'datos', 'correo.json');

let avisadoSinConfig = false;

async function configuracion() {
  try {
    const bruto = await readFile(ARCHIVO_CONFIG, 'utf8');
    const c = JSON.parse(bruto);
    if (!c.servidor || !c.usuario || !c.clave || !Array.isArray(c.destinatarios) || !c.destinatarios.length) {
      return null;
    }
    return {
      servidor: String(c.servidor),
      puerto: Number(c.puerto) || 465,
      usuario: String(c.usuario),
      clave: String(c.clave),
      de: String(c.de || c.usuario),
      destinatarios: c.destinatarios.map(String)
    };
  } catch (e) {
    return null;
  }
}

/* Asunto con acentos, en formato de palabra codificada MIME. */
const asuntoMime = (texto) =>
  '=?UTF-8?B?' + Buffer.from(String(texto), 'utf8').toString('base64') + '?=';

function construirMensaje(config, asunto, texto) {
  const cuerpo = Buffer.from(String(texto), 'utf8').toString('base64')
    .replace(/(.{76})/g, '$1\r\n');
  return [
    'From: Plataforma Diaz y Asociados <' + config.de + '>',
    'To: ' + config.destinatarios.join(', '),
    'Subject: ' + asuntoMime(asunto),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'Date: ' + new Date().toUTCString(),
    '',
    cuerpo,
    ''
  ].join('\r\n');
}

/* Conversación SMTP sobre TLS implícito (puerto 465). */
function dialogoSmtp(config, mensaje) {
  return new Promise((cumplir, fallar) => {
    const temporizador = setTimeout(() => {
      try { conexion.destroy(); } catch (e) { /* nada */ }
      fallar(new Error('tiempo de espera agotado'));
    }, 20000);

    const conexion = connect({ host: config.servidor, port: config.puerto, servername: config.servidor });
    let restante = '';
    let paso = 0;
    let rcpt = 0;

    const enviar = (linea) => conexion.write(linea + '\r\n');

    const pasos = [
      () => enviar('EHLO plataforma.local'),
      () => enviar('AUTH LOGIN'),
      () => enviar(Buffer.from(config.usuario, 'utf8').toString('base64')),
      () => enviar(Buffer.from(config.clave, 'utf8').toString('base64')),
      () => enviar('MAIL FROM:<' + config.de + '>'),
      () => enviar('RCPT TO:<' + config.destinatarios[rcpt] + '>'),
      () => enviar('DATA'),
      () => { conexion.write(mensaje); enviar('.'); },
      () => enviar('QUIT')
    ];

    conexion.on('data', (trozo) => {
      restante += trozo.toString('utf8');
      let corte;
      while ((corte = restante.indexOf('\r\n')) !== -1) {
        const linea = restante.slice(0, corte);
        restante = restante.slice(corte + 2);
        // Las respuestas multilínea llevan guion tras el código (250-...).
        if (/^\d{3}-/.test(linea)) continue;
        const codigo = Number(linea.slice(0, 3));
        if (codigo >= 400) {
          clearTimeout(temporizador);
          conexion.destroy();
          return fallar(new Error('SMTP ' + linea.slice(0, 120)));
        }
        if (paso < pasos.length) {
          // Tras cada RCPT aceptado, repetirlo si quedan destinatarios.
          if (paso === 6 && rcpt < config.destinatarios.length - 1) {
            rcpt++;
            pasos[5]();
            continue;
          }
          pasos[paso++]();
        } else {
          clearTimeout(temporizador);
          conexion.end();
          return cumplir();
        }
      }
    });

    conexion.on('error', (e) => { clearTimeout(temporizador); fallar(e); });
  });
}

/* Envía un aviso a todo el equipo. Nunca lanza: devuelve el
   resultado para que quien llama decida si registrarlo. */
/* destinatarios (opcional): lista de correos que sustituye a la de
   datos/correo.json, p. ej. para avisar solo a informática. */
export async function enviarAviso(asunto, texto, destinatarios) {
  const config = await configuracion();
  if (!config) {
    if (!avisadoSinConfig) {
      avisadoSinConfig = true;
      console.log('  (avisos por correo apagados: falta datos/correo.json; ver herramientas/correo.ejemplo.json)');
    }
    return { enviado: false, motivo: 'sin configuración' };
  }
  try {
    const cfg = Array.isArray(destinatarios) && destinatarios.length ? { ...config, destinatarios: destinatarios.map(String) } : config;
    await dialogoSmtp(cfg, construirMensaje(cfg, asunto, texto));
    console.log('  Aviso enviado por correo: ' + asunto);
    return { enviado: true };
  } catch (e) {
    console.error('  No se pudo enviar el aviso por correo: ' + e.message);
    return { enviado: false, motivo: e.message };
  }
}
