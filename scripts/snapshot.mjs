// Builds the same application as dist/, with every bundled asset in one HTML file.
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'public');
const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

async function embedPublicAsset(url) {
  const file = path.resolve(publicRoot, `.${url}`);
  if (!file.startsWith(`${publicRoot}${path.sep}`)) throw new Error(`Asset is outside public/: ${url}`);
  const mime = mimeTypes[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`Unsupported snapshot asset: ${url}`);
  return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
}

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  jsx: 'automatic',
  legalComments: 'eof',
  outdir: 'out',
  loader: { '.woff2': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl' },
  plugins: [{
    name: 'embed-demo-photos',
    setup(builder) {
      builder.onLoad({ filter: /[\\/]assets[\\/]photos\.json$/ }, async ({ path: file }) => {
        const photos = JSON.parse(await readFile(file, 'utf8'));
        const embedded = await Promise.all(Object.entries(photos).map(async ([key, url]) => {
          if (!url.startsWith('/assets/')) throw new Error(`Demo photo must be local for offline review: ${key}`);
          return [key, await embedPublicAsset(url)];
        }));
        return { contents: JSON.stringify(Object.fromEntries(embedded)), loader: 'json' };
      });
    },
  }],
});

const outputText = extension => {
  const file = result.outputFiles.find(item => item.path.endsWith(extension));
  if (!file) throw new Error(`Snapshot build did not produce ${extension}.`);
  return file.text;
};

const css = outputText('.css').replace(/<\/style/gi, '<\\/style');
const js = outputText('.js').replace(/<\/script/gi, '<\\/script');
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const stylesheet = /<link\b[^>]*href=["']\/app\.css["'][^>]*>/;
const script = /<script\b[^>]*src=["']\/app\.js["'][^>]*>\s*<\/script>/;
if (!stylesheet.test(html) || !script.test(html)) throw new Error('index.html must reference /app.css and /app.js.');
html = html.replace(stylesheet, () => `<style>${css}</style>`);
html = html.replace(script, () => `<script>${js}</script>`);

const favicon = html.match(/<link\b[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/);
if (favicon?.[1].startsWith('/assets/')) {
  const embeddedIcon = await embedPublicAsset(favicon[1]);
  html = html.replace(favicon[0], () => favicon[0].replace(favicon[1], embeddedIcon));
}

const licenseFiles = ['Fraunces-OFL.txt', 'NunitoSans-OFL.txt'];
const licenses = await Promise.all(licenseFiles.map(name => readFile(path.join(publicRoot, 'assets/fonts', name), 'utf8')));
const credits = await readFile(path.join(root, 'ASSETS.md'), 'utf8');
html = html.replace('</head>', () => `<!--\n${[credits, ...licenses].join('\n\n').replace(/-->/g, '-- >')}\n-->\n</head>`);

await writeFile(path.join(root, 'Open Monty.html'), html, 'utf8');
console.log(`Offline preview written: Open Monty.html (${Math.round(Buffer.byteLength(html) / 1024)} KB).`);
