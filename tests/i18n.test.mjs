import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED, getLocale, setLocale, t, money, date, catalogue } from '../src/i18n.js';

// The suite runs with --test-isolation=none, so the module-level locale is
// shared. Every test restores English before returning.
function withLocale(locale, run) {
  const previous = getLocale();
  try { setLocale(locale); return run(); }
  finally { setLocale(previous); }
}

test('money keeps Monty’s trailing tugrik symbol and groups by locale', () => {
  assert.equal(money(12500), '12,500 \u20AE');
  assert.equal(money(0), '0 \u20AE');
  // Tugrik has no minor unit: fractions are never shown.
  assert.equal(money(999.6), '1,000 \u20AE');
  withLocale('mn', () => assert.equal(money(12500), '12,500 \u20AE'));
});

test('money renders a figure rather than NaN for missing or unusable values', () => {
  for (const value of [undefined, null, '', 'abc', NaN]) assert.equal(money(value), '0 \u20AE');
  assert.equal(money('12500'), '12,500 \u20AE');
});

test('dates are day-first in English and follow the catalogue locale in Mongolian', () => {
  const at = '2026-09-21T10:00:00Z';
  // 21 Sept, never the US-only Sep 21 — Monty ships where day comes first.
  assert.equal(date(at), '21 Sept');
  assert.equal(date(new Date(at)), '21 Sept');
  withLocale('mn', () => assert.notEqual(date(at), '21 Sept'));
});

test('an order with a missing or unparseable timestamp still renders', () => {
  for (const value of [undefined, null, '', 'nonsense', new Date('nope')]) assert.equal(date(value), '');
});

test('only supported locales are accepted and the previous one survives a bad value', () => {
  assert.deepEqual(SUPPORTED, ['en', 'mn']);
  assert.equal(getLocale(), 'en');
  withLocale('mn', () => {
    assert.equal(getLocale(), 'mn');
    assert.equal(setLocale('fr'), 'mn');
    assert.equal(setLocale(undefined), 'mn');
    assert.equal(getLocale(), 'mn');
  });
  assert.equal(getLocale(), 'en');
});

test('English comes from the call site and Mongolian from the catalogue', () => {
  assert.equal(t('bag.remove', 'Remove'), 'Remove');
  withLocale('mn', () => assert.equal(t('bag.remove', 'Remove'), 'Хасах'));
});

test('an untranslated key shows the inline English rather than the key', () => {
  // Guards the documented promise: a key Mongolian has not reached yet still
  // renders real copy on screen.
  withLocale('mn', () => assert.equal(t('not.translated.yet', 'Pickup pass'), 'Pickup pass'));
  assert.equal(t('unknown.key'), 'unknown.key');
});

test('placeholders are filled, and an unknown one is left visible', () => {
  assert.equal(t('offer.left', '{count} left', { count: 3 }), '3 left');
  withLocale('mn', () => assert.equal(t('offer.left', '{count} left', { count: 3 }), '3 үлдсэн'));
  // A missing value must not print "undefined" as if it were copy.
  assert.equal(t('offer.left', '{count} left', {}), '{count} left');
});

test('the Mongolian catalogue holds no leftover English', () => {
  // Cyrillic is the tell: a value with no Cyrillic at all is an untranslated
  // line that slipped in. Latin inside an otherwise Cyrillic line (QR, Monty,
  // demo, pickup) is normal in Mongolian technical copy and does not fail.
  //
  // 'demo' is deliberately Latin: it is the loanword the project's own
  // Mongolian research documents use, not a word left untranslated.
  // 'pay.provider.demo' names the payment provider, and QPay is a proper
  // noun written in Latin on every Mongolian bank screen there is.
  const intentional = new Set(['app.demo', 'pay.provider.demo', 'trust.count']);
  const untranslated = Object.entries(catalogue.mn)
    .filter(([key]) => !intentional.has(key))
    .filter(([, value]) => !/[\u0400-\u04FF]/.test(value))
    .map(([key]) => key);
  assert.deepEqual(untranslated, []);
});
