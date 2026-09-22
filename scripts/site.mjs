/* Where Monty lives on the web, and the three files that only matter once it
   lives there: the page with its address filled in, robots.txt and the
   sitemap. Both `npm run build` and `npm start` go through here so the local
   preview is the same page the deployment serves.

   A canonical address cannot be guessed at run time — it has to be in the HTML
   before a crawler reads it — so it is resolved here, in one place, in this
   order:

     SITE_URL                        set it yourself, e.g. a custom domain
     VERCEL_PROJECT_PRODUCTION_URL   set by Vercel on every build of a project,
                                     and always the production domain, so a
                                     preview deployment still points search
                                     engines at the real one
     the fallback below              a local build with neither of the above

   Change FALLBACK_URL if the project is deployed somewhere else. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

/* Deliberately a reserved example domain that can never belong to anybody.
   A canonical link is a page naming its own real home, so a fallback that
   happens to be somebody else's live site — monty.vercel.app is already a
   Next.js project belonging to a stranger — would hand Monty's search ranking
   to them on any build where the two variables above are missing. Wrong and
   obviously wrong beats wrong and plausible. Set SITE_URL, or replace this,
   once the real address exists. */
const FALLBACK_URL = 'https://monty.example';

export function siteUrl() {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const address = (process.env.SITE_URL || fromVercel || FALLBACK_URL).trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+$/.test(address)) throw new Error(`SITE_URL should be a bare origin such as https://monty.example: ${address}`);
  return address;
}

/* Vercel builds every branch and pull request at its own address. Those are
   the same page as production, so letting them into a search index would put
   Monty in competition with itself; only a production build invites crawlers. */
const isProduction = () => !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';

function robots(address) {
  if (!isProduction()) return ['# A preview build of Monty. The real one is at', `# ${address}`, 'User-agent: *', 'Disallow: /', ''].join('\n');
  return [
    '# Monty — an interactive design prototype of a surplus food pickup app.',
    '# Everything here is demo data and every page is welcome in search.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${address}/sitemap.xml`,
    '',
  ].join('\n');
}

/* Monty is one address: the screens are tabs inside the application, not
   separate pages, so there is exactly one URL to offer. */
function sitemap(address) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${address}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
`;
}

/* index.html carries %SITE_URL% wherever it needs an absolute address — the
   canonical link, the share card, the structured data — because a relative one
   is no use to anything quoting the page somewhere else. */
export async function writeSite(output) {
  const address = siteUrl();
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  await writeFile(path.join(output, 'index.html'), html.replaceAll('%SITE_URL%', address), 'utf8');
  await writeFile(path.join(output, 'robots.txt'), robots(address), 'utf8');
  await writeFile(path.join(output, 'sitemap.xml'), sitemap(address), 'utf8');
  return address;
}
