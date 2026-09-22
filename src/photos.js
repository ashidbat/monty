import photos from '../public/assets/photos.json' with { type: 'json' };
import { foodArt } from './foodart.mjs';

/* Three kinds of picture reach this function and only one of them is a file:
   a bundled sample photograph, a drawing named in the catalogue, or a link a
   merchant typed. A merchant link is never rewritten — resolving
   `https://their-shop.example/cake.jpg` to our own cake photograph would put
   the wrong food on their listing. */
export function photoURL(path) {
  const value = String(path || '');
  if (value.startsWith('art:')) return foodArt(value.slice(4)) || value;
  const sample = /^\/assets\/([a-z-]+)\.jpg$/.exec(value);
  return sample ? photos[sample[1]] || value : value;
}

// Merchant-supplied links can 404; a drawing or a bundled photo cannot.
export function isDrawing(path) {
  return String(path || '').startsWith('art:');
}
