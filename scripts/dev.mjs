// Rebuilds dist/ on every source change and serves it. For development only:
// `npm run build` is what produces the reviewable artefacts.
import { context } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, servePreview } from './static.mjs';

const output = path.join(projectRoot, 'dist');
await mkdir(output, { recursive: true });
await cp(path.join(projectRoot, 'public'), output, { recursive: true });
await cp(path.join(projectRoot, 'index.html'), path.join(output, 'index.html'));

const builder = await context({
  absWorkingDir: projectRoot,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outdir: output,
  entryNames: 'app',
  sourcemap: true,
  jsx: 'automatic',
  loader: { '.woff2': 'file' },
});
await builder.watch();

servePreview({ label: 'Monty dev preview (watching src/)' });
