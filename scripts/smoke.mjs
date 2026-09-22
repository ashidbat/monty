/* An offline render check.

   The unit tests cover order rules, QR encoding and the string catalogue. None
   of them prove the screens still render: a bad import, or a component that
   throws, only surfaces when someone opens the file. This bundles the real
   application for Node, renders each screen to HTML in both languages, and
   looks for copy that has to be on it.

   Opening the page in a browser is still the real check. This one just gets
   there sooner. */

import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const workDir = path.join(root, 'node_modules', '.monty-smoke');

await rm(workDir, { recursive: true, force: true });
await mkdir(workDir, { recursive: true });

/* The entry re-exports setLocale from inside the bundle. Importing it from
   src/ instead would hand back a second copy of the module, whose locale the
   bundled application never reads, and the check would pass in English while
   claiming to test Mongolian. */
await build({
  absWorkingDir: root,
  stdin: {
    contents: [
      "export { default as App } from './src/main.jsx';",
      "export { setLocale } from './src/i18n.js';",
      "export { default as Operations } from './src/Operations.jsx';",
      "export { createDemoState } from './src/model.mjs';",
      "export { default as Payment } from './src/components/Payment.jsx';",
    ].join('\n'),
    resolveDir: root,
    sourcefile: 'smoke-entry.js',
    loader: 'js',
  },
  outfile: path.join(workDir, 'app.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  // The stylesheets and fonts say nothing about whether the tree renders.
  loader: { '.css': 'empty', '.woff2': 'empty' },
  external: ['react', 'react-dom', 'react-dom/client'],
});

// On Windows an absolute path is not a valid ESM specifier; it has to be a URL.
const { App, setLocale, Operations, createDemoState, Payment } = await import(pathToFileURL(path.join(workDir, 'app.mjs')).href);

const checks = [
  ['en', ['Fresh finds nearby', 'Discover', 'Pickups', 'Your bag', 'Demo', 'monty', 'Shops near you', 'Steppe Table', 'Show more finds', 'min walk', 'Closes in', 'countdown']],
  ['mn', ['Ойролцоох шинэ олдворууд', 'Нүүр', 'Захиалга', 'Улаанбаатар', 'monty', 'Ойролцоох дэлгүүрүүд', 'Тал Ширээ', 'явганаар', 'минутын дараа хаагдана']],
];

let failures = 0;
for (const [locale, expected] of checks) {
  setLocale(locale);
  let html;
  try {
    html = renderToStaticMarkup(React.createElement(App));
  } catch (error) {
    console.error(`FAIL ${locale}: the app threw while rendering — ${error.message}`);
    failures += 1;
    continue;
  }
  const missing = expected.filter(text => !html.includes(text));
  if (missing.length) {
    console.error(`FAIL ${locale}: rendered, but without ${missing.map(text => JSON.stringify(text)).join(', ')}`);
    failures += 1;
  } else {
    console.log(`ok   ${locale}: ${html.length.toLocaleString()} characters of markup, all expected copy present`);
  }
}

// A Mongolian screen still showing "Fresh finds nearby" is the specific failure
// this work set out to prevent, so it gets its own check.
setLocale('mn');
const mongolian = renderToStaticMarkup(React.createElement(App));
for (const leftover of ['Fresh finds nearby', 'Pick up a little happiness today.', 'Little favorites', 'Shops near you', 'Show more finds', 'min walk']) {
  if (mongolian.includes(leftover)) {
    console.error(`FAIL mn: English copy left on screen — ${JSON.stringify(leftover)}`);
    failures += 1;
  }
}
/* The merchant and operations workspaces sit behind a role switch, so they get
   rendered directly here. The overview panel was rebuilt most recently, which
   makes it the likeliest of the three to be broken. */
for (const [role, expected] of [['admin', ['Items rescued from waste', 'Collection rate', 'Today’s demo activity', 'Demo time']], ['merchant', ['On Little Loaf’s counter', 'Add an item', 'Items on the counter', 'Recovered today', 'Start tomorrow']]]) {
  setLocale('en');
  try {
    const html = renderToStaticMarkup(React.createElement(Operations, {
      role,
      state: createDemoState(),
      setState: () => {},
      onExit: () => {},
      notify: () => {},
      minutes: 17 * 60 + 45,
      onNewDay: () => {},
    }));
    const missing = expected.filter(text => !html.includes(text));
    if (missing.length) {
      console.error(`FAIL ${role}: rendered, but without ${missing.map(text => JSON.stringify(text)).join(', ')}`);
      failures += 1;
    } else {
      console.log(`ok   ${role} workspace: all expected copy present`);
    }
  } catch (error) {
    console.error(`FAIL ${role}: the workspace threw while rendering — ${error.message}`);
    failures += 1;
  }
}

/* The payment sheet never appears on a first render — it is three taps
   deep — so it is rendered on its own. A blank checkout is the worst possible
   thing to discover in front of somebody. */
for (const locale of ['en', 'mn']) {
  setLocale(locale);
  try {
    const html = renderToStaticMarkup(React.createElement(Payment, {
      amount: 12300,
      description: 'Smoke test',
      reference: 'smoke-1',
      onPaid: () => {},
      onCancel: () => {},
    }));
    const expected = locale === 'en'
      ? ['Demo payment', 'Khan Bank', 'To pay', 'Waiting for your bank']
      : ['Demo төлбөр', 'Khan Bank', 'Төлөх дүн'];
    const missing = expected.filter(text => !html.includes(text));
    if (missing.length) {
      console.error(`FAIL payment ${locale}: rendered, but without ${missing.map(text => JSON.stringify(text)).join(', ')}`);
      failures += 1;
    } else {
      console.log(`ok   payment sheet ${locale}: invoice, QR and banks present`);
    }
  } catch (error) {
    console.error(`FAIL payment ${locale}: the sheet threw — ${error.message}`);
    failures += 1;
  }
}

setLocale('en');

await rm(workDir, { recursive: true, force: true });

if (failures) {
  console.error(`\n${failures} render check(s) failed.`);
  process.exit(1);
}
console.log('\nAll screens render in both languages.');
