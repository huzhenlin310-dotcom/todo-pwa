import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const root = new URL('../', import.meta.url);
const output = new URL('_site/', root);
const worker = 'service-worker.js';
const versionFile = 'version.json';
const files = new Map([
  ['index.html', 'text/html; charset=utf-8'],
  ['styles.css', 'text/css; charset=utf-8'],
  ['app.js', 'text/javascript; charset=utf-8'],
  ['app-update.js', 'text/javascript; charset=utf-8'],
  ['task-store.js', 'text/javascript; charset=utf-8'],
  ['install-prompt.js', 'text/javascript; charset=utf-8'],
  [worker, 'text/javascript; charset=utf-8'],
  ['manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['icons/icon-192.png', 'image/png'],
  ['icons/icon-512.png', 'image/png'],
  ['icons/apple-touch-icon.png', 'image/png']
]);

async function siteContents() {
  const sourceFiles = [...files.keys(), 'releases.json'];
  const assets = new Map(await Promise.all(sourceFiles.map(async file => [file, await readFile(new URL(file, root))])));
  const history = JSON.parse(assets.get('releases.json'));
  const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  if (history[0]?.version !== version) throw new Error('The latest release must match package.json');

  const digest = createHash('sha256');
  for (const [file, contents] of assets) digest.update(file).update('\0').update(contents);
  const build = digest.digest('hex').slice(0, 20);
  assets.delete('releases.json');
  const source = assets.get(worker).toString('utf8');
  const marker = "const CACHE_VERSION = 'source';";
  if (!source.includes(marker)) throw new Error('Service worker is missing its release version marker');
  assets.set(worker, source.replace(marker, `const CACHE_VERSION = '${build}';`));
  const entry = assets.get('index.html').toString('utf8');
  const release = JSON.stringify({ build, history }).replaceAll('<', '\\u003c');
  assets.set('index.html', entry.replace('name="app-build" content="source"', `name="app-build" content="${build}"`)
    .replace('type="application/json">{}</script>', () => `type="application/json">${release}</script>`)
    .replaceAll('?v=source', `?v=${build}`));
  assets.set(versionFile, JSON.stringify({ build, version }));
  return assets;
}

async function build() {
  const assets = await siteContents();
  await mkdir(new URL('icons/', output), { recursive: true });
  await Promise.all([...assets].map(([file, contents]) => writeFile(new URL(file, output), contents)));
  console.log('Site built in _site/');
}

function serve() {
  const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = request.url.split('?')[0];
    const file = path === '/' ? 'index.html' : path.slice(1);
    const contentType = file === versionFile ? 'application/json; charset=utf-8' : files.get(file);
    if (!contentType) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const contents = [worker, 'index.html', versionFile].includes(file)
        ? (await siteContents()).get(file) : await readFile(new URL(file, root));
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': file === versionFile ? 'no-store' : 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : contents);
    } catch (error) {
      console.error(error);
      response.writeHead(500).end('Could not read site');
    }
  });
  server.listen(Number(process.env.PORT ?? 4173), '127.0.0.1', () => {
    console.log(`Todo is running at http://127.0.0.1:${server.address().port}/`);
  });
}

if (process.argv[2] === 'build') await build();
else if (process.argv[2] === 'serve') serve();
else throw new Error('Expected build or serve');
