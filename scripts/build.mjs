import { build } from 'esbuild';
import { mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeSite } from './site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');

// From scratch, so yesterday's fingerprinted bundles do not pile up in here.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

/* The bundle carries a hash of its own contents in its name. That is what
   lets it be cached hard: a phone can keep app-4BZK7XQ2.js for a year in
   perfect safety, because the next build is a different file at a different
   address rather than the same address meaning something new. The fixed names
   this replaces were cached for a year under exactly that promise and could
   not be withdrawn, which left phones running a build nobody could reach. */
const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outdir: output,
  entryNames: 'app-[hash]',
  minify: true,
  jsx: 'automatic',
  loader: { '.woff2': 'file' },
  legalComments: 'eof',
  metafile: true,
});

const bundled = extension => {
  const file = Object.keys(result.metafile.outputs).find(name => path.basename(name).startsWith('app-') && name.endsWith(extension));
  if (!file) throw new Error(`The build produced no ${extension} bundle.`);
  return `/${path.basename(file)}`;
};

await cp(path.join(root, 'public'), output, { recursive: true });
const address = await writeSite(output, { js: bundled('.js'), css: bundled('.css') });
console.log(`Monty built in dist/, for ${address}.`);
