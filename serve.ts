import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game/', import.meta.url)));
const portFlag = process.argv.indexOf('--port');
const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 8080;
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'], ['.wasm', 'application/wasm'], ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'], ['.wav', 'audio/wav'], ['.m4a', 'audio/mp4'],
]);

createServer((request, response) => {
  let pathname: string;
  try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad request'); return; }
  const target = resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden'); return;
  }
  const file = pathname.endsWith('/') ? resolve(target, 'index.html') : target;
  if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end('Forbidden'); return; }
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
    response.writeHead(200, { 'Content-Type': mime.get(extname(file).toLowerCase()) || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '0.0.0.0');
