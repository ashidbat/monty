/* The location fix, without a browser.

   Every branch here is one a reviewer will actually hit: a granted permission,
   a refused one, and a file opened off disk where there is no geolocation to
   ask. The rule they share is that `locate()` always settles on a usable
   position, because a screen with no distances on it is worse than a screen
   with honest demo ones. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locate, permissionState, watchLocation, isInCity, simulatedFix, metresBetween, DEFAULT_PLACE, withinRadius } from '../src/geo.mjs';

const HAMBURG = { lat: 53.5511, lng: 9.9937 };
const SEOUL_STREET = { lat: 47.9137, lng: 106.9158 };

function withNavigator(geolocation, permissions) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...(geolocation ? { geolocation } : {}), ...(permissions ? { permissions } : {}) },
    configurable: true,
    writable: true,
  });
  return () => {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  };
}

test('a granted fix becomes a real position, not a simulated one', async () => {
  const restore = withNavigator({
    getCurrentPosition: success => success({ coords: { latitude: 47.92, longitude: 106.91, accuracy: 18.4 } }),
  });
  const fix = await locate();
  restore();
  assert.equal(fix.simulated, false);
  assert.equal(fix.reason, null);
  assert.equal(fix.lat, 47.92);
  assert.equal(fix.accuracy, 18, 'accuracy is rounded to whole metres');
});

test('a refused permission still yields a position, and says why', async () => {
  const restore = withNavigator({
    getCurrentPosition: (success, failure) => failure({ code: 1, message: 'denied' }),
  });
  const fix = await locate();
  restore();
  assert.equal(fix.simulated, true);
  assert.equal(fix.reason, 'denied');
  assert.ok(Number.isFinite(fix.lat) && Number.isFinite(fix.lng));
});

test('a timeout and an internal failure are told apart', async () => {
  for (const [code, reason] of [[3, 'timeout'], [2, 'unavailable']]) {
    const restore = withNavigator({ getCurrentPosition: (ok, fail) => fail({ code }) });
    const fix = await locate();
    restore();
    assert.equal(fix.reason, reason);
  }
});

test('a file opened off disk has no geolocation at all, and does not throw', async () => {
  const restore = withNavigator(null);
  const fix = await locate();
  const state = await permissionState();
  const stop = watchLocation(() => { throw new Error('must not be called'); });
  stop();
  restore();
  assert.equal(fix.simulated, true);
  assert.equal(fix.reason, 'unsupported');
  assert.equal(state, 'unsupported');
});

test('a permission query the browser refuses reads as unknown, not as granted', async () => {
  const restore = withNavigator(
    { getCurrentPosition: () => {} },
    { query: async () => { throw new Error('Safari says no'); } },
  );
  assert.equal(await permissionState(), 'unknown');
  restore();
});

test('a granted permission is reported so the fix can arrive without a prompt', async () => {
  const restore = withNavigator(
    { getCurrentPosition: () => {} },
    { query: async () => ({ state: 'granted' }) },
  );
  assert.equal(await permissionState(), 'granted');
  restore();
});

test('the watcher hands over every position and can be stopped', () => {
  let cleared = null;
  const seen = [];
  const restore = withNavigator({
    watchPosition: success => {
      success({ coords: { latitude: 47.91, longitude: 106.92, accuracy: 9 } });
      return 77;
    },
    clearWatch: id => { cleared = id; },
  });
  const stop = watchLocation(fix => seen.push(fix));
  stop();
  restore();
  assert.equal(seen.length, 1);
  assert.equal(seen[0].simulated, false);
  assert.equal(cleared, 77, 'the watch is cleared by the id the browser gave');
});

test('a position in the city is local, one abroad is not', () => {
  assert.equal(isInCity(SEOUL_STREET), true);
  assert.equal(isInCity(DEFAULT_PLACE), true);
  assert.equal(isInCity(HAMBURG), false);
});

test('a simulated fix lands near the square, close enough to keep shops in radius', () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const fix = simulatedFix();
    assert.equal(fix.simulated, true);
    assert.ok(isInCity(fix));
    assert.ok(withinRadius(metresBetween(fix, SEOUL_STREET), 5000), 'the demo position can still see the catalogue');
  }
});
