import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoState, totals, addToCart, placeOrder, confirmPickup, saveOffer, toggleSaved, expireOrders, rateOrder, shopRating, startNewDay, offerState, merchantSummary } from '../src/model.mjs';
import { photoURL } from '../src/photos.js';
import { setMinutes, parseTime } from '../src/clock.mjs';

/* The clock is now part of the rules, so every test states the time it is
   testing at rather than inheriting whichever hour the suite happens to run
   in. 17:45 is inside Little Loaf's window and outside Sansar's, which is the
   same moment the interface opens on. */
const AFTERNOON = 17 * 60 + 45;
setMinutes(AFTERNOON);

/* A settled invoice. In the application this comes back from payments.mjs; a
   production build gets it from a server that has spoken to QPay. Either way
   placeOrder will not create an order without one. */
const paidWith = total => ({ provider: 'demo-qpay', invoiceId: 'DEMOTEST01', status: 'paid', paidAmount: total, paidAt: new Date().toISOString(), paidVia: 'Khan Bank' });
const pay = (state, cart) => placeOrder(state, cart, paidWith(totals(state, cart).total));

test('one shop checkout snapshots prices, intersects pickup windows and deducts stock without mutating input', () => {
  const initial = createDemoState();
  let cart = addToCart(initial, [], 'o1', 2);
  cart = addToCart(initial, cart, 'o2', 1);
  assert.deepEqual(totals(initial, cart), { total: 12300, originalTotal: 24600, savings: 12300, quantity: 3, merchantId: 'm1' });
  const { state, order } = pay(initial, cart);
  assert.equal(state.offers.find(offer => offer.id === 'o1').quantity, 6);
  assert.equal(initial.offers.find(offer => offer.id === 'o1').quantity, 8);
  assert.equal(initial.orders.length, 0);
  assert.equal(order.pickupStart, '17:30');
  assert.equal(order.pickupEnd, '19:00');
  assert.match(order.code, /^[A-Z2-9]{6}$/);
  assert.equal(order.paymentStatus, 'demo-paid');
  assert.equal(order.status, 'ready');
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.total, 12300);
});

test('invalid or excess quantities and mixed shops are rejected before modifying inventory', () => {
  const state = createDemoState();
  for (const quantity of [0, -1, 1.5, NaN, Infinity, '2']) {
    assert.throws(() => addToCart(state, [], 'o1', quantity), /whole-number/);
    assert.throws(() => pay(state, [{ offerId: 'o1', quantity }]), /whole-number/);
  }
  assert.throws(() => addToCart(state, [], 'o1', 9), /Only 8/);
  const cart = addToCart(state, [], 'o1', 5);
  assert.throws(() => addToCart(state, cart, 'o1', 4), /Only 8/);
  assert.throws(() => addToCart(state, cart, 'o3', 1), /One shop per order/);
  assert.throws(() => pay(state, [{ offerId: 'o1', quantity: 1 }, { offerId: 'o3', quantity: 1 }]), /One shop per order/);
  assert.equal(state.offers[0].quantity, 8);
  assert.deepEqual(cart, [{ offerId: 'o1', quantity: 5 }]);
});

test('stale, inactive, duplicate and unknown basket items cannot be ordered', () => {
  const state = createDemoState();
  assert.throws(() => pay(state, []), /Add something/);
  assert.throws(() => addToCart(state, [], 'missing', 1), /could not be found/);
  assert.throws(() => pay(state, [{ offerId: 'o1', quantity: 1 }, { offerId: 'o1', quantity: 1 }]), /same item/);
  const paused = saveOffer(state, { id: 'o1', active: false });
  assert.throws(() => pay(paused, [{ offerId: 'o1', quantity: 1 }]), /no longer available/);
  const soldOut = pay(state, [{ offerId: 'o1', quantity: 8 }]).state;
  assert.throws(() => pay(soldOut, [{ offerId: 'o1', quantity: 1 }]), /Only 0/);
});

test('disjoint or merely touching pickup windows fail checkout atomically', () => {
  const initial = createDemoState();
  for (const pickupStart of ['19:00', '20:00']) {
    const state = saveOffer(initial, { id: 'o2', pickupStart, pickupEnd: '21:00' });
    const before = JSON.stringify(state);
    assert.throws(() => pay(state, [{ offerId: 'o1', quantity: 1 }, { offerId: 'o2', quantity: 1 }]), /different pickup times/);
    assert.equal(JSON.stringify(state), before);
  }
});

test('only the owning merchant can redeem a code, and only once', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o3', quantity: 2 }]);
  setMinutes(18 * 60 + 30);
  assert.throws(() => confirmPickup(state, 'm1', order.code), /for your shop/);
  assert.throws(() => confirmPickup(state, 'm2', 'NOPE00'), /for your shop/);
  const collected = confirmPickup(state, 'm2', ` ${order.code.toLowerCase()} `);
  assert.equal(collected.orders[0].status, 'collected');
  assert.equal(state.orders[0].status, 'ready');
  assert.throws(() => confirmPickup(collected, 'm2', order.code), /already been collected/);
  setMinutes(AFTERNOON);
});

test('an order without a confirmed demo payment cannot be collected', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 1 }]);
  for (const paymentStatus of [undefined, 'pending', 'failed']) {
    const unpaid = { ...state, orders: [{ ...order, paymentStatus }] };
    assert.throws(() => confirmPickup(unpaid, 'm1', order.code), /demo payment/);
    assert.equal(unpaid.orders[0].status, 'ready');
    assert.equal(unpaid.orders[0].collectedAt, undefined);
  }
});

test('merchant photo links never resolve to unrelated built-in photos', () => {
  assert.equal(photoURL('/assets/croissant.jpg'), '/assets/croissant.jpg');
  assert.equal(photoURL('https://merchant.example/food/croissant.jpg'), 'https://merchant.example/food/croissant.jpg');
  assert.equal(photoURL('https://merchant.example/cake.jpg?width=800'), 'https://merchant.example/cake.jpg?width=800');
  assert.equal(photoURL('/assets/custom.jpg'), '/assets/custom.jpg');
});

test('editing the current listing leaves earlier paid order snapshots unchanged', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 1 }]);
  const snapshot = structuredClone(order);
  const edited = saveOffer(state, { id: 'o1', title: 'New croissant', price: 2000, image: '/assets/bread.jpg', pickupStart: '18:00', pickupEnd: '20:00' });
  assert.equal(edited.offers.find(item => item.id === 'o1').price, 2000);
  assert.deepEqual(edited.orders[0], snapshot);
  assert.equal(edited.orders[0].items[0].title, 'Butter croissant');
  assert.equal(edited.orders[0].total, 3900);
});

test('new and edited offers validate quantities, discounts, times and merchant ownership', () => {
  const state = createDemoState();
  const template = { ...state.offers[0] };
  delete template.id;
  const next = saveOffer(state, { ...template, title: '  New bake  ', quantity: 0 });
  assert.equal(next.offers.length, state.offers.length + 1);
  assert.equal(next.offers[0].title, 'New bake');
  assert.equal(next.offers[0].quantity, 0);
  assert.equal(state.offers.length, createDemoState().offers.length);
  for (const patch of [
    { price: 0 }, { price: -1 }, { price: 1.5 }, { price: 7800 }, { originalPrice: 3000 },
    { quantity: -1 }, { quantity: 1.5 }, { pickupStart: '25:00' }, { pickupEnd: '16:00' },
    { title: ' ' }, { merchantId: 'missing' }, { category: 'Unknown' }, { active: 'yes' },
  ]) assert.throws(() => saveOffer(state, { id: 'o1', ...patch }));
  assert.throws(() => saveOffer(state, { id: 'missing', ...template }), /could not be found/);
  assert.throws(() => saveOffer(state, { id: 'o1', merchantId: 'm2' }), /another shop/);
});

test('saved offers toggle independently, fresh demo states do not share mutable arrays', () => {
  const state = createDemoState();
  const saved = toggleSaved(state, 'o1');
  assert.deepEqual(saved.saved, ['o1']);
  assert.deepEqual(toggleSaved(saved, 'o1').saved, []);
  assert.deepEqual(state.saved, []);
  assert.throws(() => toggleSaved(state, 'missing'), /could not be found/);
  state.offers[0].allergens.push('Something');
  assert.equal(createDemoState().offers[0].allergens.includes('Something'), false);
  assert.deepEqual(totals(state, []), { total: 0, originalTotal: 0, savings: 0, quantity: 0, merchantId: null });
});

/* ---- The clock, payment, trust and tomorrow ----------------------------
   The lifecycle the model had no opinion about until now. These are the rules
   a reviewer is most likely to walk into, and the ones a server will have to
   enforce for real. */

test('an order cannot exist without money behind it', () => {
  const state = createDemoState();
  const cart = [{ offerId: 'o1', quantity: 1 }];
  const total = totals(state, cart).total;
  for (const bad of [undefined, null, {}, { status: 'pending', paidAmount: total }, { status: 'failed', paidAmount: total }]) {
    assert.throws(() => placeOrder(state, cart, bad), /has not been paid/);
  }
  // Paying the wrong amount is the interesting failure: an invoice created for
  // an older basket must not settle the new one.
  assert.throws(() => placeOrder(state, cart, { status: 'paid', paidAmount: total - 1 }), /does not match/);
  const { order } = pay(state, cart);
  assert.equal(order.payment.amount, total);
  assert.equal(order.payment.provider, 'demo-qpay');
  assert.equal(order.payment.paidVia, 'Khan Bank');
  assert.equal(state.orders.length, 0);
});

test('a closed pickup window stops the sale, an unopened one does not', () => {
  const state = createDemoState();
  // Sansar Coffee House shuts at 17:00 and 17:30; Blue Sky opens at 19:00.
  setMinutes(17 * 60 + 45);
  assert.equal(offerState(state.offers.find(offer => offer.id === 'o103'), 17 * 60 + 45), 'closed');
  assert.throws(() => addToCart(state, [], 'o103', 1), /window .* has closed/);
  // Pre-ordering something that opens later is the whole point of a pickup
  // window, so it has to keep working.
  assert.equal(offerState(state.offers.find(offer => offer.id === 'o82'), 17 * 60 + 45), 'available');
  assert.deepEqual(addToCart(state, [], 'o82', 1), [{ offerId: 'o82', quantity: 1 }]);
  setMinutes(AFTERNOON);
});

test('collection is refused before the window opens and after it shuts', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 1 }]);
  const start = parseTime(order.pickupStart);
  const end = parseTime(order.pickupEnd);
  assert.throws(() => confirmPickup(state, 'm1', order.code, start - 30), /can be collected from/);
  assert.throws(() => confirmPickup(state, 'm1', order.code, end + 30), /window has closed/);
  const collected = confirmPickup(state, 'm1', order.code, start + 10);
  assert.equal(collected.orders[0].status, 'collected');
});

test('a paid order nobody collected expires, once, and says so', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 1 }]);
  const end = parseTime(order.pickupEnd);
  assert.equal(expireOrders(state, end - 10), state, 'nothing expires while the window is open');
  const swept = expireOrders(state, end + 1);
  assert.equal(swept.orders[0].status, 'expired');
  assert.ok(swept.orders[0].expiredAt);
  assert.equal(state.orders[0].status, 'ready', 'the input is not mutated');
  // Sweeping twice must not rewrite the timestamp or resurrect anything.
  assert.equal(expireOrders(swept, end + 90), swept);
  assert.throws(() => confirmPickup(swept, 'm1', order.code, end + 5), /expired/);
});

test('only a collected order can be rated, and a rating moves the shop score', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 1 }]);
  assert.throws(() => rateOrder(state, order.id, 5), /collected order/);
  const collected = confirmPickup(state, 'm1', order.code, parseTime(order.pickupStart) + 5);
  for (const bad of [0, 6, 2.5, '5', NaN]) assert.throws(() => rateOrder(collected, order.id, bad), /1 to 5/);
  assert.throws(() => rateOrder(collected, 'nope', 5), /could not be found/);

  const before = shopRating(collected, 'm1');
  const rated = rateOrder(collected, order.id, 1);
  const after = shopRating(rated, 'm1');
  assert.equal(rated.orders[0].rating, 1);
  assert.equal(after.count, before.count + 1);
  /* A shop with three hundred collections behind it does not swing on one
     rating, which is exactly why the count is shown beside the score. */
  assert.ok(after.score <= before.score);
  assert.ok(before.score - after.score < 0.1);

  // But the score is computed, not decorative: enough of them do move it.
  let angry = rated;
  for (let index = 0; index < 60; index += 1) {
    angry = { ...angry, ratings: { m1: [...(angry.ratings.m1 ?? []), 1] } };
  }
  assert.ok(shopRating(angry, 'm1').score < before.score - 0.4);

  // Changing your mind replaces your own score rather than stacking a second.
  const again = rateOrder(rated, order.id, 5);
  assert.equal(shopRating(again, 'm1').count, before.count + 1);
  assert.ok(shopRating(again, 'm1').score >= after.score);
});

test('a new day restocks standing listings and leaves one-offs alone', () => {
  let state = createDemoState();
  const recurring = state.offers.find(offer => offer.recurring);
  const oneOff = state.offers.find(offer => !offer.recurring);
  state = pay(state, [{ offerId: recurring.id, quantity: recurring.quantity }]).state;
  state = saveOffer(state, { id: oneOff.id, quantity: 0 });
  assert.equal(state.offers.find(offer => offer.id === recurring.id).quantity, 0);

  const tomorrow = startNewDay(state, 23 * 60);
  assert.equal(tomorrow.day, 2);
  assert.equal(tomorrow.offers.find(offer => offer.id === recurring.id).quantity, recurring.dailyQuantity);
  assert.equal(tomorrow.offers.find(offer => offer.id === oneOff.id).quantity, 0, 'a one-off does not come back');
  // Rolling the day over also settles yesterday's uncollected orders.
  assert.equal(tomorrow.orders[0].status, 'expired');
  assert.equal(state.offers.find(offer => offer.id === recurring.id).quantity, 0, 'the input is not mutated');
});

test('a merchant summary counts money it actually kept', () => {
  const { state, order } = pay(createDemoState(), [{ offerId: 'o1', quantity: 2 }]);
  const waiting = merchantSummary(state, 'm1');
  assert.equal(waiting.payout, 0, 'nothing is earned until it is handed over');
  assert.equal(waiting.pending, order.total);
  assert.equal(waiting.rescued, 0);

  const collected = confirmPickup(state, 'm1', order.code, parseTime(order.pickupStart) + 5);
  const earned = merchantSummary(collected, 'm1');
  assert.equal(earned.payout, order.total);
  assert.equal(earned.pending, 0);
  assert.equal(earned.rescued, 2);
  assert.equal(earned.wasted, 0);

  const missed = expireOrders(state, parseTime(order.pickupEnd) + 1);
  const lost = merchantSummary(missed, 'm1');
  assert.equal(lost.payout, 0, 'an expired order is not income');
  assert.equal(lost.wasted, 2);
  // Another shop's counter is none of this shop's business.
  assert.equal(merchantSummary(collected, 'm2').payout, 0);
});
