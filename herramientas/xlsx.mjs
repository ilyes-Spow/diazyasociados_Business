/* ===============================================================
   xlsx.mjs - Lector mínimo de libros de Excel (.xlsx) sin
   dependencias: abre el zip y lee las hojas en XML.
   ---------------------------------------------------------------
   Devuelve, por hoja, las filas con sus celdas por referencia
   (A, B, C…). Lo usa importar-objetivos.mjs.
   =============================================================== */

import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

function leerZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('el archivo no es un .xlsx (no es un zip)');
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const archivos = new Map();
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('directorio del zip dañado');
    const metodo = buf.readUInt16LE(p + 10);
    const tamComp = buf.readUInt32LE(p + 20);
    const lNombre = buf.readUInt16LE(p + 28);
    const lExtra = buf.readUInt16LE(p + 30);
    const lCom = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    archivos.set(buf.toString('utf8', p + 46, p + 46 + lNombre), { metodo, tamComp, offset });
    p += 46 + lNombre + lExtra + lCom;
  }
  const leer = (nombre) => {
    const a = archivos.get(nombre);
    if (!a) return null;
    const q = a.offset;
    if (buf.readUInt32LE(q) !== 0x04034b50) throw new Error('cabecera del zip dañada');
    const inicio = q + 30 + buf.readUInt16LE(q + 26) + buf.readUInt16LE(q + 28);
    const datos = buf.subarray(inicio, inicio + a.tamComp);
    return a.metodo === 0 ? Buffer.from(datos) : inflateRawSync(datos);
  };
  return { leer };
}

const desXml = (s) => String(s || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const fechaExcel = (n) => new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000)).toISOString().slice(0, 10);

/* Lee un libro y devuelve [{ nombre, filas: [{ n, celdas: { A: valor } }] }].
   Las fechas llegan como 'AAAA-MM-DD'; las fórmulas, como su valor. */
export function leerXlsx(ruta) {
  const zip = leerZip(readFileSync(ruta));

  const cadenas = [];
  const ssXml = zip.leer('xl/sharedStrings.xml');
  if (ssXml) {
    for (const m of ssXml.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      cadenas.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => desXml(x[1])).join(''));
    }
  }

  const libro = zip.leer('xl/workbook.xml').toString('utf8');
  const rels = zip.leer('xl/_rels/workbook.xml.rels').toString('utf8');
  const relaciones = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((r) =>
    [/Id="([^"]+)"/.exec(r[0])[1], /Target="([^"]+)"/.exec(r[0])[1]]));
  const hojas = [...libro.matchAll(/<sheet\b[^>]*>/g)].map((h) => {
    const nombre = desXml(/name="([^"]*)"/.exec(h[0])[1]);
    let ruta = relaciones.get(/r:id="([^"]+)"/.exec(h[0])[1]) || '';
    if (ruta.startsWith('/')) ruta = ruta.slice(1); else if (!ruta.startsWith('xl/')) ruta = 'xl/' + ruta;
    return { nombre, ruta };
  });

  // Qué estilos de celda son fechas, para no confundirlas con números.
  const estilosFecha = new Set();
  const estilos = zip.leer('xl/styles.xml');
  if (estilos) {
    const s = estilos.toString('utf8');
    const formatos = new Map([...s.matchAll(/<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)].map((m) => [Number(m[1]), desXml(m[2])]));
    const xfs = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(s);
    if (xfs) {
      [...xfs[1].matchAll(/<xf\b[^>]*>/g)].forEach((x, i) => {
        const id = Number((/numFmtId="(\d+)"/.exec(x[0]) || [0, 0])[1]);
        const codigo = (formatos.get(id) || '').replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '');
        if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (/[dmy]/i.test(codigo) && !/[#0]/.test(codigo) && codigo !== 'General')) estilosFecha.add(i);
      });
    }
  }

  return hojas.map((h) => {
    const xml = zip.leer(h.ruta);
    if (!xml) return { nombre: h.nombre, filas: [] };
    const filas = [];
    for (const fila of xml.toString('utf8').matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const n = Number(/r="(\d+)"/.exec(fila[1])?.[1]);
      const celdas = {};
      for (const c of fila[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1]; const interior = c[2] || '';
        const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
        if (!ref) continue;
        const tipo = /t="([^"]+)"/.exec(attrs)?.[1];
        const estilo = Number(/s="(\d+)"/.exec(attrs)?.[1] ?? -1);
        let v = null;
        if (tipo === 's') v = cadenas[Number(/<v>([^<]*)<\/v>/.exec(interior)?.[1])];
        else if (tipo === 'inlineStr') v = [...interior.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => desXml(x[1])).join('');
        else if (tipo === 'str') v = desXml(/<v>([\s\S]*?)<\/v>/.exec(interior)?.[1] || '');
        else if (tipo === 'b') v = /<v>1<\/v>/.test(interior);
        else if (tipo === 'e') v = null;
        else {
          const bruto = /<v>([^<]*)<\/v>/.exec(interior)?.[1];
          if (bruto !== undefined) { const num = Number(bruto); v = estilosFecha.has(estilo) ? fechaExcel(num) : num; }
        }
        if (v !== null && v !== undefined && v !== '') celdas[ref] = v;
      }
      if (Object.keys(celdas).length) filas.push({ n, celdas });
    }
    return { nombre: h.nombre, filas };
  });
}
