/* The whole journey, once, in order.

   Every other test here checks one rule in isolation. None of them proved the
   rules compose: that an invoice settled by the payment provider is the same
   shape placeOrder demands, that the code on the pass is the code the counter
   accepts, that the stock a customer took is the stock the merchant lost, and
   that the money only appears in the shop's payout after somebody actually
   turned up. Those seams are where this breaks, and they are not visible from
   inside any single module.

   It runs against the model and the payment provider directly rather than
   through the interface, because that is where the state machine lives. */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDemoState, addToCart, totals, placeOrder, confirmPickup,
  expireOrders, rateOrder, shopRating, merchantSummary, startNewDay, isBuyable,
} from '../src/model.mjs';
import { createInvoice, checkInvoice, simulate, cancelInvoice } from '../src/payments.mjs';
import { setMinutes, parseTime } from '../src/clock.mjs';

const OPEN = 17 * 60 + 45; // Little Loaf is open, Sansar has shut.

function payFor(state, cart, bank = 'khan') {
  const due = totals(state, cart).total;
  const invoice = createInvoice({ amount: due, description: 'Test', orderReference: 'test' });
  // Nothing is paid until the bank says so, which is the whole point.
  assert.equal(checkInvoice(invoice.invoiceId).status, 'pending');
  simulate(invoice.invoiceId, bank, 'paid');
  const settled = checkInvoice(invoice.invoiceId);
  return { invoice, payment: { provider: invoice.provider, invoiceId: invoice.invoiceId, ...settled } };
}

test('browse, pay, collect, rate — and the shop sees every step of it', () => {
  setMinutes(OPEN);
  let state = createDemoState();

  // Browse. o1 is a Little Loaf croissant, 17:00–19:00, eight of them.
  const croissant = state.offers.find(offer => offer.id === 'o1');
  assert.ok(isBuyable(croissant, OPEN));
  const cart = addToCart(state, [], 'o1', 2);
  const due = totals(state, cart);
  assert.equal(due.total, croissant.price * 2);
  assert.equal(due.merchantId, 'm1');

  // Pay. The invoice is settled by the provider, not by the app asserting it.
  const { invoice, payment } = payFor(state, cart);
  assert.equal(payment.status, 'paid');
  assert.equal(payment.paidAmount, due.total);
  assert.equal(payment.paidVia, 'Khan Bank');

  // Order. Stock leaves the counter, money is waiting rather than earned.
  const placed = placeOrder(state, cart, payment);
  state = placed.state;
  const order = placed.order;
  assert.equal(state.offers.find(offer => offer.id === 'o1').quantity, croissant.quantity - 2);
  assert.match(order.code, /^[A-Z2-9]{6}$/);
  assert.equal(order.payment.invoiceId, invoice.invoiceId);
  assert.equal(merchantSummary(state, 'm1').payout, 0);
  assert.equal(merchantSummary(state, 'm1').pending, due.total);

  // Collect, at the counter, inside the window.
  state = confirmPickup(state, 'm1', order.code, parseTime(order.pickupStart) + 15);
  assert.equal(state.orders[0].status, 'collected');
  const earned = merchantSummary(state, 'm1');
  assert.equal(earned.payout, due.total);
  assert.equal(earned.rescued, 2);

  // Rate. Only now, and it counts.
  const before = shopRating(state, 'm1');
  state = rateOrder(state, order.id, 5);
  assert.equal(state.orders[0].rating, 5);
  assert.equal(shopRating(state, 'm1').count, before.count + 1);
  assert.equal(shopRating(state, 'm1').rescued, before.rescued);
});

test('the same journey, abandoned at every point it can be abandoned', () => {
  setMinutes(OPEN);
  const state = createDemoState();
  const cart = addToCart(state, [], 'o1', 1);
  const due = totals(state, cart).total;

  // Walking away from the payment sheet releases the invoice and creates
  // nothing. The reader's basket is untouched.
  const abandoned = createInvoice({ amount: due, description: 'Test', orderReference: 'test' });
  cancelInvoice(abandoned.invoiceId);
  assert.equal(checkInvoice(abandoned.invoiceId).status, 'cancelled');
  assert.throws(() => placeOrder(state, cart, checkInvoice(abandoned.invoiceId)), /has not been paid/);
  assert.equal(state.orders.length, 0);
  assert.equal(state.offers.find(offer => offer.id === 'o1').quantity, 8);

  // A declined payment leaves the same nothing behind.
  const declined = createInvoice({ amount: due, description: 'Test', orderReference: 'test' });
  simulate(declined.invoiceId, 'khan', 'failed');
  assert.equal(checkInvoice(declined.invoiceId).status, 'failed');
  assert.throws(() => placeOrder(state, cart, checkInvoice(declined.invoiceId)), /has not been paid/);

  // A settled invoice cannot be settled twice, so a retried poll cannot buy
  // two orders with one payment.
  const { payment, invoice } = payFor(state, cart);
  assert.equal(simulate(invoice.invoiceId, 'khan', 'paid'), null);
  const first = placeOrder(state, cart, payment);
  assert.equal(first.state.orders.length, 1);
});

test('paid, never collected: the customer, the shop and tomorrow all agree', () => {
  setMinutes(OPEN);
  let state = createDemoState();
  const cart = addToCart(state, [], 'o1', 3);
  state = placeOrder(state, cart, payFor(state, cart).payment).state;
  const order = state.orders[0];
  const closed = parseTime(order.pickupEnd) + 5;

  // The counter refuses it before anything sweeps, so a shop cannot hand over
  // a bag after closing even if nothing has run.
  assert.throws(() => confirmPickup(state, 'm1', order.code, closed), /window has closed/);

  state = expireOrders(state, closed);
  assert.equal(state.orders[0].status, 'expired');
  const missed = merchantSummary(state, 'm1');
  assert.equal(missed.payout, 0, 'nobody came, so nothing was earned');
  assert.equal(missed.wasted, 3);
  assert.equal(missed.rescued, 0);
  assert.throws(() => rateOrder(state, order.id, 5), /collected order/);

  // Tomorrow the shelf is full again and yesterday's failure is still on the
  // record rather than quietly erased.
  const tomorrow = startNewDay(state, closed);
  assert.equal(tomorrow.day, 2);
  assert.equal(tomorrow.offers.find(offer => offer.id === 'o1').quantity, 8);
  assert.equal(tomorrow.orders[0].status, 'expired');
  assert.equal(merchantSummary(tomorrow, 'm1').wasted, 3);
});

test('an order placed before a window opens is collectable once it does', () => {
  // Pre-ordering is the ordinary case, not an edge case: most people book a
  // pickup on the way home, before the shop has started handing anything out.
  setMinutes(OPEN);
  let state = createDemoState();
  const evening = state.offers.find(offer => offer.id === 'o82'); // Blue Sky, 19:00–21:30
  const cart = addToCart(state, [], evening.id, 1);
  state = placeOrder(state, cart, payFor(state, cart).payment).state;
  const order = state.orders[0];

  assert.throws(() => confirmPickup(state, 'm5', order.code, OPEN), /can be collected from/);
  assert.equal(expireOrders(state, OPEN), state, 'a window that has not opened has not closed');

  const collected = confirmPickup(state, 'm5', order.code, parseTime(order.pickupStart) + 5);
  assert.equal(collected.orders[0].status, 'collected');
});
