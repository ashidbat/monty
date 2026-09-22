/* Checks the Mongolian catalogue against the calls the interface makes.

   `t('bag.remove', 'Remove')` keeps its English at the call site, so a key
   nobody translated never throws and never fails a test. It just renders in
   English in the middle of an otherwise Mongolian screen. A reader spots that
   immediately; no test does, unless the test reads the source. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogue } from '../src/i18n.js';
import { SHOPS, ITEMS, CATEGORIES, DISTRICTS } from '../src/catalogue.mjs';
import { ART_NAMES, foodArt } from '../src/foodart.mjs';
import { PLACES, metresBetween } from '../src/geo.mjs';

const root = fileURLToPath(new URL('../src/', import.meta.url));

function sources(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(jsx?|mjs)$/.test(entry.name) && entry.name !== 'i18n.js' ? [full] : [];
  });
}

/* Matches t('key', 'English') and t('key', "English"), every form the interface
   uses. Keys built from a template literal (the demo content lookups) are
   deliberately not matched: their fallback is a record's own field, so there is
   nothing to compare against. */
const CALL = /\bt\(\s*'([\w.]+)'\s*,\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g;

const calls = new Map();
const referenced = new Set();
for (const file of sources()) {
  const text = readFileSync(file, 'utf8');
  for (const [, key, , english] of text.matchAll(CALL)) {
    if (!calls.has(key)) calls.set(key, { english: english.replace(/\\n/g, '\n'), file });
  }
  // Some keys reach `t` through a lookup table: the category, sort, area and
  // workspace-tab lists pair a key with its English in a const, away from the
  // call site. Those are still used, so a plain mention of the key counts.
  for (const [, key] of text.matchAll(/'([a-z][\w]*(?:\.[\w]+)+)'/g)) referenced.add(key);
}

test('the source actually calls the catalogue', () => {
  // A guard on the guard: if the regex stops matching, the checks below would
  // pass by finding nothing to check.
  assert.ok(calls.size > 150, `expected the interface to use many keys, found ${calls.size}`);
});

test('every string the interface asks for is translated into Mongolian', () => {
  const missing = [...calls.keys()].filter(key => !(key in catalogue.mn)).sort();
  assert.deepEqual(missing, [], `untranslated keys would render in English: ${missing.join(', ')}`);
});

test('no catalogue entry is left behind by the interface', () => {
  // Demo content is looked up with a computed key, so those are expected to be
  // absent from the scan and are not stale.
  const unused = Object.keys(catalogue.mn)
    .filter(key => !key.startsWith('demo.'))
    .filter(key => !referenced.has(key))
    .sort();
  assert.deepEqual(unused, [], `catalogue entries nothing renders: ${unused.join(', ')}`);
});

test('Mongolian keeps every placeholder its English has', () => {
  // A dropped {count} or a typo'd {shop} survives every other check here and
  // turns up on screen.
  const names = text => (String(text).match(/\{(\w+)\}/g) || []).sort().join(',');
  const mismatched = [...calls.entries()]
    .filter(([key, { english }]) => key in catalogue.mn && names(english) !== names(catalogue.mn[key]))
    .map(([key]) => key)
    .sort();
  assert.deepEqual(mismatched, []);
});

/* ---- The demo catalogue -------------------------------------------------
   Six shops and a hundred and twenty items is past the size where a reader
   notices a gap by scrolling past it, so each way the catalogue can be wrong
   gets its own check. */

test('every shop is contracted, placed in Ulaanbaatar and named in both languages', () => {
  assert.ok(SHOPS.length >= 5, `the brief asks for five or more shops, found ${SHOPS.length}`);
  assert.equal(new Set(SHOPS.map(shop => shop.id)).size, SHOPS.length, 'two shops share an id');
  const districts = DISTRICTS.map(entry => entry.id);
  for (const shop of SHOPS) {
    assert.ok(districts.includes(shop.district), `${shop.id} sits in no listed district`);
    // A coordinate typo puts a shop in the wrong hemisphere and the map still
    // draws, so the bounds are checked rather than the digits.
    assert.ok(shop.lat > 47.8 && shop.lat < 48.0, `${shop.id} is not in Ulaanbaatar`);
    assert.ok(shop.lng > 106.7 && shop.lng < 107.1, `${shop.id} is not in Ulaanbaatar`);
    for (const language of ['en', 'mn']) {
      for (const field of ['address', 'pickupNote', 'kind']) {
        assert.ok(shop[language]?.[field]?.trim(), `${shop.id} has no ${language} ${field}`);
      }
    }
  }
});

test('every shop carries around twenty items, and every category is stocked', () => {
  for (const shop of SHOPS) {
    const count = ITEMS.filter(entry => entry.shop === shop.id).length;
    assert.ok(count >= 18 && count <= 24, `${shop.id} has ${count} items, which is not around twenty`);
  }
  for (const category of CATEGORIES) {
    const count = ITEMS.filter(entry => entry.category === category).length;
    assert.ok(count >= 15, `only ${count} items in ${category}`);
  }
});

test('no item is missing a translation, a price rule or a drawing', () => {
  assert.equal(new Set(ITEMS.map(entry => entry.id)).size, ITEMS.length, 'two items share an id');
  for (const entry of ITEMS) {
    assert.ok(CATEGORIES.includes(entry.category), `${entry.id} has category ${entry.category}`);
    assert.ok(SHOPS.some(shop => shop.id === entry.shop), `${entry.id} belongs to no shop`);
    assert.ok(entry.price < entry.originalPrice, `${entry.id} is not discounted`);
    assert.ok(Number.isSafeInteger(entry.price) && entry.price > 0, `${entry.id} has a strange price`);
    assert.ok(entry.pickupStart < entry.pickupEnd, `${entry.id} ends before it starts`);
    for (const language of ['en', 'mn']) {
      assert.ok(entry[language]?.title?.trim(), `${entry.id} has no ${language} title`);
      assert.ok(entry[language]?.description?.trim(), `${entry.id} has no ${language} description`);
    }
    // Mongolian that is still the English sentence is the failure a glance
    // across a translated screen would not catch on item ninety.
    assert.notEqual(entry.mn.title, entry.en.title, `${entry.id} was never translated`);
    if (!entry.art.startsWith('/')) assert.ok(ART_NAMES.includes(entry.art), `${entry.id} names a drawing that does not exist: ${entry.art}`);
  }
});

test('a basket from any one shop always has an overlapping pickup window', () => {
  // A shop whose items cannot be ordered together is a dead end the customer
  // only finds at checkout.
  for (const shop of SHOPS) {
    const items = ITEMS.filter(entry => entry.shop === shop.id);
    const start = items.reduce((latest, entry) => entry.pickupStart > latest ? entry.pickupStart : latest, '00:00');
    const end = items.reduce((earliest, entry) => entry.pickupEnd < earliest ? entry.pickupEnd : earliest, '23:59');
    assert.ok(start < end, `${shop.id} has no window shared by all of its items`);
  }
});

test('every drawing renders, and none is left unused', () => {
  const used = new Set(ITEMS.map(entry => entry.art).filter(art => !art.startsWith('/')));
  assert.deepEqual(ART_NAMES.filter(name => !used.has(name)), [], 'drawings nothing draws');
  for (const name of ART_NAMES) {
    const uri = foodArt(name);
    assert.match(uri, /^data:image\/svg\+xml,/, `${name} did not encode`);
    const markup = decodeURIComponent(uri.slice('data:image/svg+xml,'.length));
    assert.doesNotMatch(markup, /undefined|NaN/, `${name} drew an undefined colour or coordinate`);
    assert.match(markup, /<\/svg>$/, `${name} is not a closed document`);
  }
  assert.equal(foodArt('not-a-drawing'), null);
});

test('distances are measured, not stated, and come out the size a city is', () => {
  const square = PLACES.find(place => place.id === 'square');
  assert.equal(metresBetween(square, square), 0);
  for (const shop of SHOPS) {
    const metres = metresBetween(square, shop);
    assert.ok(metres > 0 && metres < 12000, `${shop.id} is ${metres} m from the square`);
  }
  // Symmetric, and in step with a known separation: the two ends of the
  // catalogue are a real distance apart on a real map.
  const zaisan = PLACES.find(place => place.id === 'zaisan');
  assert.equal(metresBetween(square, zaisan), metresBetween(zaisan, square));
  assert.ok(Math.abs(metresBetween(square, zaisan) - 3550) < 400, 'Zaisan moved');
});
