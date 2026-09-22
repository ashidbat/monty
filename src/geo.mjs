/* Where you are.

   The device knows, so the app asks it. navigator.geolocation is the source,
   and every distance on every screen is computed from that fix with real
   arithmetic against real coordinates.

   Two things stop that being the whole story, and both are ordinary rather
   than exceptional. The permission can be refused. And this file is meant to
   be opened from disk, where a browser hands out no position at all, because
   a file:// page has no origin to attach the grant to. Either way `locate()`
   settles on a simulated fix near the square so that "nearby" still means
   something, and marks it `simulated` so the interface can say which one the
   reader is looking at rather than quietly inventing a position. */

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

/* A simulated fix, used when the device will not give a real one. The jitter
   is what makes it read as a measurement rather than a menu choice: you land
   near the square, not exactly on it, and the map draws the accuracy ring that
   goes with it. */
export function simulatedFix(reason = 'unsupported') {
  const spread = 0.0016;
  return {
    id: 'here',
    key: 'place.here',
    en: 'Your location',
    lat: DEFAULT_PLACE.lat + (Math.random() - 0.5) * spread,
    lng: DEFAULT_PLACE.lng + (Math.random() - 0.5) * spread * 1.5,
    accuracy: 40 + Math.round(Math.random() * 80),
    simulated: true,
    reason,
  };
}

export function geolocationAvailable() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/* enableHighAccuracy because the difference between two bakeries is a few
   hundred metres. maximumAge lets a fix from the last minute stand rather than
   waking the radio up again for a screen that has not moved. */
const FIX_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

function toPlace(position) {
  return {
    id: 'here',
    key: 'place.here',
    en: 'Your location',
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Math.round(position.coords.accuracy) || 0,
    simulated: false,
    reason: null,
  };
}

function reasonFor(error) {
  if (error?.code === 1) return 'denied';
  if (error?.code === 3) return 'timeout';
  return 'unavailable';
}

/* Resolves rather than rejects. Every caller wants a position to draw the
   screen with, and a refused permission is a normal answer here, not a fault:
   the simulated fix is the answer, and `reason` says why it is the one. */
export function locate() {
  return new Promise(resolve => {
    if (!geolocationAvailable()) { resolve(simulatedFix('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(
      position => resolve(toPlace(position)),
      error => resolve(simulatedFix(reasonFor(error))),
      FIX_OPTIONS,
    );
  });
}

/* Asks the browser what it would do before anything asks it to do it. A grant
   already given is the case worth knowing about: it means the fix can arrive
   on load without a prompt nobody asked for. */
export async function permissionState() {
  if (!geolocationAvailable()) return 'unsupported';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    /* Permissions is missing or refuses the query — Safari has done both. The
       honest answer is that we do not know, which callers treat as 'prompt'. */
    return 'unknown';
  }
}

/* Keeps the fix current the way the clock keeps the time current: the reader
   walks, the distances follow, and nothing has to be pressed. Returns an
   unsubscribe for the effect that owns it. */
export function watchLocation(onFix) {
  if (!geolocationAvailable()) return () => {};
  const id = navigator.geolocation.watchPosition(
    position => onFix(toPlace(position)),
    () => {},
    FIX_OPTIONS,
  );
  return () => navigator.geolocation.clearWatch(id);
}

/* Every shop in the catalogue is in Ulaanbaatar. A reader opening this in
   Hamburg gets a true fix that is five thousand kilometres from all of them,
   and a 5 km radius would hand them an empty screen and no way to guess why.
   Sixty kilometres is generous enough to cover the city and the ger districts
   around it without calling Darkhan local. */
const CITY_RANGE = 60000;

export function isInCity(place) {
  return metresBetween(DEFAULT_PLACE, place) <= CITY_RANGE;
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
