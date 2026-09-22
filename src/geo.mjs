/* Where you are, in a preview that cannot know.

   Nothing here touches navigator.geolocation. A design prototype should not
   ask for a permission it has no way to honour, and a reviewer opening the
   file in Hamburg or Seoul still needs "nearby" to mean something. So the
   reader picks a spot in Ulaanbaatar, or asks for a simulated fix, and every
   distance on every screen is then computed from it with real arithmetic
   against real coordinates. The shop is where the shop is; only the reader is
   pretend, and the interface says so wherever it shows a distance.

   A production build replaces `locate()` with the real thing and changes
   nothing else. */

import { t } from './i18n.js';

const EARTH = 6371000;
const rad = degrees => (degrees * Math.PI) / 180;

/* Named spots a reader can stand on. Real places, roughly where a map puts
   them, spread across the districts so the radius filter has something to do. */
export const PLACES = [
  { id: 'square', key: 'place.square', en: 'Sükhbaatar Square', lat: 47.9186, lng: 106.9177 },
  { id: 'statedept', key: 'place.statedept', en: 'State Department Store', lat: 47.9186, lng: 106.9092 },
  { id: 'seoul', key: 'place.seoul', en: 'Seoul Street', lat: 47.9137, lng: 106.9158 },
  { id: 'ardkino', key: 'place.ardkino', en: 'Ard Kino Square', lat: 47.9146, lng: 106.8724 },
  { id: 'sansar', key: 'place.sansar', en: 'Sansar crossroads', lat: 47.9221, lng: 106.9489 },
  { id: 'zaisan', key: 'place.zaisan', en: 'Zaisan', lat: 47.8869, lng: 106.9281 },
];

export const DEFAULT_PLACE = PLACES[0];

/* Metres. 'all' keeps every shop, which is also what a reader who has not
   thought about radius should get. */
export const RADII = [
  { id: 1000, key: 'radius.1', en: '1 km' },
  { id: 3000, key: 'radius.3', en: '3 km' },
  { id: 5000, key: 'radius.5', en: '5 km' },
  { id: 0, key: 'radius.all', en: 'Anywhere' },
];

export const DEFAULT_RADIUS = 5000;

export function metresBetween(from, to) {
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH * Math.asin(Math.min(1, Math.sqrt(a))));
}

/* Under a kilometre people think in fifties of metres, over it in tenths of a
   kilometre. Rounding to anything finer reads as false precision from a
   position that is itself a guess. */
export function formatDistance(metres) {
  if (!Number.isFinite(metres)) return '';
  if (metres < 1000) return t('unit.metres', '{value} m', { value: Math.max(50, Math.round(metres / 50) * 50) });
  return t('unit.kilometres', '{value} km', { value: (metres / 1000).toFixed(1) });
}

// 4.5 km/h, which is a real walking speed in a city with real winters.
export function walkMinutes(metres) {
  return Math.max(1, Math.round(metres / 75));
}

export function withinRadius(metres, radius) {
  return !radius || metres <= radius;
}

/* A simulated fix. The jitter is what makes it read as a measurement rather
   than a menu choice: you land near the square, not exactly on it, and the map
   draws the accuracy ring that goes with it. */
export function locate() {
  const spread = 0.0016;
  return {
    id: 'here',
    key: 'place.here',
    en: 'Your demo location',
    lat: DEFAULT_PLACE.lat + (Math.random() - 0.5) * spread,
    lng: DEFAULT_PLACE.lng + (Math.random() - 0.5) * spread * 1.5,
    accuracy: 40 + Math.round(Math.random() * 80),
  };
}

export function placeName(place) {
  return t(place.key, place.en);
}

/* Flat-earth projection, which is correct to well under a pixel across a city
   and keeps the map honest about north. Returns metres east and north of the
   centre; the map component decides how many pixels that is. */
export function offsetMetres(centre, point) {
  const perDegreeLat = 111320;
  const perDegreeLng = 111320 * Math.cos(rad(centre.lat));
  return {
    east: (point.lng - centre.lng) * perDegreeLng,
    north: (point.lat - centre.lat) * perDegreeLat,
  };
}
