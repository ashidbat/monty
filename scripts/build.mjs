import { build } from 'esbuild';
import { mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');

await mkdir(output, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outdir: output,
  entryNames: 'app',
  minify: true,
  jsx: 'automatic',
  loader: { '.woff2': 'file' },
  legalComments: 'eof',
});
await cp(path.join(root, 'public'), output, { recursive: true });
await cp(path.join(root, 'index.html'), path.join(output, 'index.html'));
console.log('Monty built in dist/.');
