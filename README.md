# Monty

An interactive design prototype of a surplus food pickup app for Ulaanbaatar.
Shops list the good food they still have at closing time, a customer reserves
and pays for it, and collects it at the counter inside a pickup window. English
and Mongolian, light and dark, demo data throughout.

To review it without installing anything, open `Open Monty.html`. `START HERE.txt`
is the guided tour. What follows is only about putting it on the web.

## Running it locally

```
npm install
npm start          # http://127.0.0.1:4173, rebuilds as you edit
npm run build      # dist/ for the web, and a fresh Open Monty.html
npm run check      # order rules, translations, and every screen rendered
```

## Putting it on the web

The repository is already configured for Vercel: `vercel.json` sets the build
command, the output directory and the cache headers.

1. Push this repository to GitHub.
2. At [vercel.com/new](https://vercel.com/new), import it. Leave every build
   setting alone — `vercel.json` has them.
3. Deploy. Vercel gives the project its own address — something like
   `https://monty-ashidbat.vercel.app`. Note that `monty.vercel.app` itself is
   already taken by an unrelated project, so the name will have something
   appended to it.

Or, from this folder, `npx vercel --prod`.

Either way the result is one address that opens on any phone browser. Nothing
is installed and there is no app store: the link *is* the app.

### The address the page tells search engines about

The canonical address, the share card and the sitemap all need the real domain
written into the HTML at build time. `scripts/site.mjs` resolves it in this
order:

| Source | Use it for |
| --- | --- |
| `SITE_URL` environment variable | a custom domain, e.g. `https://monty.mn` |
| `VERCEL_PROJECT_PRODUCTION_URL` | set by Vercel automatically; nothing to do |
| `FALLBACK_URL` in `scripts/site.mjs` | local builds |

On Vercel the middle one is already right, so a plain deploy needs no
configuration — unless **Automatically expose System Environment Variables** has
been switched off in the project's settings, in which case set `SITE_URL`
yourself. The fallback is a reserved example domain rather than a real one, so
a build that lost both is obviously wrong instead of quietly pointing search
engines at somebody else's site.

Worth checking once, after the first deploy: open the deployed page, view
source, and confirm the `canonical` link and `og:url` carry the real address.

If a custom domain is added later, set `SITE_URL` in the project's environment
variables (or edit `FALLBACK_URL`) and redeploy, so the page stops pointing at
the old address.

Preview deployments — every branch and pull request — serve a `robots.txt` that
asks search engines to stay away, so they never compete with the real site.

## Getting it into Google

Deploying does not put a site in Google; being crawled does. That normally takes
a few days to a couple of weeks, and can be hurried along:

1. Open [Google Search Console](https://search.google.com/search-console) and
   add the deployed address as a property.
2. Verify ownership. On Vercel the easiest route is the DNS record for a custom
   domain, or the HTML meta tag — paste it into the `web:start` block in
   `index.html` and redeploy.
3. Submit `https://<your address>/sitemap.xml` under **Sitemaps**.
4. Paste the address into **URL Inspection** and press **Request indexing**.

What to expect when it is indexed: searching the exact name and a word of
context — *monty ulaanbaatar food*, *monty surplus food prototype* — should find
it. The single word *monty* will not: it belongs to a great many older and
larger things, and a new site on a `vercel.app` subdomain does not outrank them.
A custom domain and links to the site from elsewhere are what move that, slowly.
For showing the prototype to somebody, the link itself is still the fast path —
it previews with the loaf card in any chat app.

## On a phone

Open the address in the phone's browser. It is a phone-shaped design and the
layout, the safe areas around the notch and the bottom bar, and the light and
dark themes all follow the device.

It can also be installed: **Share → Add to Home Screen** on iOS, or **Install app**
in Chrome's menu on Android. `public/manifest.webmanifest` names it, and it opens
full screen with the Monty loaf as its icon. It is still the same web page —
there is no native iPhone or Android build, and that remains future work.

The manifest deliberately does not lock the orientation, so the prototype still
works on a phone mounted sideways.

Once it has been opened once, it keeps working without a signal. Everything
Monty decides — the shops, the clock, the payments — it decides in the browser,
so `public/sw.js` only has to keep a copy of the files, and a tunnel or a flat
data plan no longer ends the demo. It asks the network first every time, so an
online phone is never looking at an old build; only the fonts, whose file names
carry a content hash, are answered from the copy directly. To retire it, delete
`public/sw.js` and its registration in `index.html` and deploy: browsers drop a
worker whose script has gone.

## What generates what

| File | Made by | Holds |
| --- | --- | --- |
| `dist/index.html` | `scripts/site.mjs` | the page, with `%SITE_URL%` filled in |
| `dist/robots.txt`, `dist/sitemap.xml` | `scripts/site.mjs` | what crawlers read first |
| `public/assets/icon-*.png`, `apple-touch-icon.png`, `monty-card.png` | `scripts/icons.mjs` | home screen icons and the share card, drawn from `public/assets/monty.svg` |
| `Open Monty.html` | `scripts/snapshot.mjs` | the whole prototype in one offline file |

`npm run build` runs all three. To redraw only the icons after changing the
mark, `npm run icons`.
