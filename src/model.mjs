// Local design-preview data only. This module does not authorize real payments
// or pickups; a production application must enforce these rules on its server.

import { CATEGORIES, SHOPS, ITEMS } from './catalogue.mjs';
import { isCollectable, isOpenNow, nowMinutes, parseTime } from './clock.mjs';

export { CATEGORIES };

/* The shops carry coordinates rather than a "350 m" string, so the distance a
   reader sees is computed from where they said they are. See geo.mjs. */
export const merchants = SHOPS.map(({ id, name, mnName, district, lat, lng, rating, ratings, rescued, since, en }) => ({
  id, name, mnName, district, lat, lng, rating, ratings, rescued, since,
  address: en.address, pickupNote: en.pickupNote, kind: en.kind,
}));

const seedOffers = ITEMS.map(entry => ({
  id: entry.id,
  title: entry.en.title,
  merchantId: entry.shop,
  category: entry.category,
  description: entry.en.description,
  allergens: entry.allergens,
  price: entry.price,
  originalPrice: entry.originalPrice,
  quantity: entry.quantity,
  /* What a new day puts back on the counter. A bakery does not relist its
     surprise bag by hand every evening for the rest of its life; it says
     "every day, six of them, from five" once. */
  dailyQuantity: entry.quantity,
  recurring: entry.recurring !== false,
  pickupStart: entry.pickupStart,
  pickupEnd: entry.pickupEnd,
  // A bundled photograph keeps its path; everything else names a drawing.
  image: entry.art.startsWith('/') ? entry.art : `art:${entry.art}`,
  active: true,
}));

/* Version 3 adds the clock: orders can expire, offers know whether they come
   back tomorrow, and a collected order can be rated. A browser holding an
   older record is handed a fresh state rather than a partial merge, because a
   half-migrated demo is worse than a clean one. */
export const STATE_VERSION = 3;

export function createDemoState() {
  return {
    version: STATE_VERSION,
    offers: seedOffers.map(offer => ({ ...offer, allergens: [...offer.allergens] })),
    orders: [],
    saved: [],
    ratings: {},
    day: 1,
  };
}

function requireMerchant(id) {
  const merchant = merchants.find(item => item.id === id);
  if (!merchant) throw new Error('Choose a valid shop.');
  return merchant;
}

function requireOffer(state, id) {
  const offer = state.offers.find(item => item.id === id);
  if (!offer) throw new Error('This offer could not be found.');
  return offer;
}

function requireQuantity(quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Choose a whole-number quantity of at least 1.');
}

function validTime(time) {
  return typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function validateOffer(offer) {
  requireMerchant(offer.merchantId);
  if (typeof offer.title !== 'string' || !offer.title.trim()) throw new Error('Give your item a name.');
  if (typeof offer.description !== 'string') throw new Error('Add a description for your item.');
  if (!Array.isArray(offer.allergens) || offer.allergens.some(item => typeof item !== 'string')) throw new Error('Allergens must be a list of names.');
  if (!Number.isSafeInteger(offer.price) || offer.price < 1 || !Number.isSafeInteger(offer.originalPrice) || offer.originalPrice <= offer.price) {
    throw new Error('Use positive whole-tögrög prices, with the discounted price below the usual price.');
  }
  if (!Number.isSafeInteger(offer.quantity) || offer.quantity < 0) throw new Error('Available quantity must be a whole number of 0 or more.');
  if (!validTime(offer.pickupStart) || !validTime(offer.pickupEnd) || offer.pickupEnd <= offer.pickupStart) {
    throw new Error('Choose a pickup end time later than its start time.');
  }
  if (!CATEGORIES.includes(offer.category)) throw new Error(`Choose one of: ${CATEGORIES.join(', ')}.`);
  if (typeof offer.image !== 'string' || !offer.image.trim()) throw new Error('Add an item photo.');
  if (typeof offer.active !== 'boolean') throw new Error('Choose whether the offer is available.');
  if (offer.recurring !== undefined && typeof offer.recurring !== 'boolean') throw new Error('Choose whether this item comes back tomorrow.');
  if (offer.dailyQuantity !== undefined && (!Number.isSafeInteger(offer.dailyQuantity) || offer.dailyQuantity < 0)) {
    throw new Error('A daily quantity must be a whole number of 0 or more.');
  }
}

/* Availability, and the reason this file needed a clock.

   An offer can be bought before its window opens — that is what pre-ordering
   a pickup is — but not after it shuts, because the shop is closing and there
   is nobody left to hand the bag over. */
export function offerState(offer, minutes = nowMinutes()) {
  if (!offer.active) return 'paused';
  if (!offer.quantity) return 'soldout';
  return isCollectable(offer.pickupStart, offer.pickupEnd, minutes) ? 'available' : 'closed';
}

export function isBuyable(offer, minutes = nowMinutes()) {
  return offerState(offer, minutes) === 'available';
}

function checkedCart(state, cart, allowEmpty = false) {
  if (!Array.isArray(cart)) throw new Error('Your basket could not be read.');
  if (!cart.length) {
    if (allowEmpty) return [];
    throw new Error('Add something delicious to your basket first.');
  }
  const seen = new Set();
  let shopId;
  const rows = cart.map(line => {
    if (!line || typeof line !== 'object') throw new Error('Your basket contains an invalid item.');
    requireQuantity(line.quantity);
    const offer = requireOffer(state, line.offerId);
    validateOffer(offer);
    if (seen.has(offer.id)) throw new Error('Your basket contains the same item more than once.');
    seen.add(offer.id);
    if (!offer.active) throw new Error(`${offer.title} is no longer available.`);
    if (!isCollectable(offer.pickupStart, offer.pickupEnd)) throw new Error(`The pickup window for ${offer.title.toLowerCase()} has closed for today.`);
    if (line.quantity > offer.quantity) throw new Error(`Only ${offer.quantity} ${offer.title.toLowerCase()} available. Please adjust your basket.`);
    if (shopId && shopId !== offer.merchantId) throw new Error('One shop per order. Complete or clear your basket before choosing another shop.');
    shopId = offer.merchantId;
    return { offer, quantity: line.quantity };
  });
  return rows;
}

export function totals(state, cart) {
  const rows = checkedCart(state, cart, true);
  const total = rows.reduce((sum, row) => sum + row.offer.price * row.quantity, 0);
  const originalTotal = rows.reduce((sum, row) => sum + row.offer.originalPrice * row.quantity, 0);
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(originalTotal)) throw new Error('This basket is too large. Please choose fewer items.');
  return {
    total, originalTotal, savings: originalTotal - total,
    quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    merchantId: rows[0]?.offer.merchantId ?? null,
  };
}

export function addToCart(state, cart, offerId, quantity) {
  requireQuantity(quantity);
  checkedCart(state, cart, true);
  requireOffer(state, offerId);
  const existing = cart.find(item => item.offerId === offerId);
  const next = existing
    ? cart.map(item => item.offerId === offerId ? { ...item, quantity: item.quantity + quantity } : { ...item })
    : [...cart.map(item => ({ ...item })), { offerId, quantity }];
  checkedCart(state, next);
  return next;
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

/* An order exists only once money has moved, which is why `payment` is
   required rather than assumed. The demo provider in payments.mjs hands back a
   settled invoice; a production build hands back whatever its own server said
   after talking to QPay. Either way this function refuses to create a paid
   order from a promise. */
export function placeOrder(state, cart, payment) {
  const rows = checkedCart(state, cart);
  const summary = totals(state, cart);
  if (!payment || payment.status !== 'paid') throw new Error('This order has not been paid for yet.');
  if (payment.paidAmount !== summary.total) throw new Error('The amount paid does not match this basket.');
  const pickupStart = rows.reduce((time, row) => row.offer.pickupStart > time ? row.offer.pickupStart : time, '00:00');
  const pickupEnd = rows.reduce((time, row) => row.offer.pickupEnd < time ? row.offer.pickupEnd : time, '23:59');
  if (pickupStart >= pickupEnd) throw new Error('These items have different pickup times. Please order them separately.');
  let code;
  do { code = randomCode(); } while (state.orders.some(order => order.code === code));
  const order = {
    id: `order-${globalThis.crypto.randomUUID()}`, code,
    merchantId: summary.merchantId, status: 'ready', paymentStatus: 'demo-paid',
    payment: {
      provider: payment.provider ?? 'demo-qpay',
      invoiceId: payment.invoiceId ?? null,
      paidVia: payment.paidVia ?? null,
      paidAt: payment.paidAt ?? new Date().toISOString(),
      amount: payment.paidAmount,
    },
    total: summary.total, originalTotal: summary.originalTotal,
    items: rows.map(({ offer, quantity }) => ({ offerId: offer.id, title: offer.title, image: offer.image, price: offer.price, originalPrice: offer.originalPrice, quantity })),
    pickupStart, pickupEnd, createdAt: new Date().toISOString(), rating: null,
  };
  const next = {
    ...state,
    offers: state.offers.map(offer => {
      const row = rows.find(item => item.offer.id === offer.id);
      return row ? { ...offer, quantity: offer.quantity - row.quantity } : offer;
    }),
    orders: [order, ...state.orders],
  };
  return { state: next, order };
}

export function confirmPickup(state, merchantId, code, minutes = nowMinutes()) {
  requireMerchant(merchantId);
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const order = state.orders.find(item => item.code === normalizedCode);
  if (!order || order.merchantId !== merchantId) throw new Error('No order with this pickup code was found for your shop.');
  if (order.status === 'collected') throw new Error('This order has already been collected.');
  if (order.status === 'expired') throw new Error('This pickup window has closed and the order has expired.');
  if (order.status !== 'ready') throw new Error('This order is not ready for pickup.');
  if (order.paymentStatus !== 'demo-paid') throw new Error('Confirm the demo payment before collecting this order.');
  /* The counter is the one place the clock is not advisory. Handing a bag over
     an hour after closing is the thing a pickup window exists to prevent, and
     a customer who turns up early has to be told why rather than refused. */
  if (!isOpenNow(order.pickupStart, order.pickupEnd, minutes)) {
    throw new Error(minutes < parseTime(order.pickupStart)
      ? `This order can be collected from ${order.pickupStart}.`
      : 'This pickup window has closed. The order can no longer be collected.');
  }
  return { ...state, orders: state.orders.map(item => item.id === order.id ? { ...item, status: 'collected', collectedAt: new Date().toISOString() } : item) };
}

/* A paid order nobody collected is the case the old model had no answer for.
   It is swept rather than checked on read, so the merchant's list and the
   customer's list agree about what happened and the stock goes back on the
   counter for whoever is still out there. */
export function expireOrders(state, minutes = nowMinutes()) {
  const stale = state.orders.filter(order => order.status === 'ready' && !isCollectable(order.pickupStart, order.pickupEnd, minutes));
  if (!stale.length) return state;
  const expiredAt = new Date().toISOString();
  return {
    ...state,
    orders: state.orders.map(order => stale.includes(order) ? { ...order, status: 'expired', expiredAt } : order),
  };
}

const RATINGS = [1, 2, 3, 4, 5];

/* Ratings are the trust layer, and they are only offered where they mean
   something: you collected it, so you ate it, so you have an opinion. */
export function rateOrder(state, orderId, rating) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order) throw new Error('This order could not be found.');
  if (order.status !== 'collected') throw new Error('Only a collected order can be rated.');
  if (!RATINGS.includes(rating)) throw new Error('Choose a rating from 1 to 5.');
  const shopRatings = state.ratings?.[order.merchantId] ?? [];
  return {
    ...state,
    orders: state.orders.map(item => item.id === orderId ? { ...item, rating } : item),
    ratings: {
      ...state.ratings,
      // Re-rating replaces the reader's own score rather than stacking a
      // second one on top of it.
      [order.merchantId]: order.rating ? [...shopRatings.filter((_, index) => index !== shopRatings.indexOf(order.rating)), rating] : [...shopRatings, rating],
    },
  };
}

/* The seeded history and this session's own ratings, as one number. A shop
   with three hundred collections does not swing on the reader's first bag,
   which is the whole point of showing a count beside the score. */
export function shopRating(state, merchantId) {
  const shop = merchants.find(item => item.id === merchantId);
  if (!shop) return null;
  const mine = state.ratings?.[merchantId] ?? [];
  const total = shop.rating * shop.ratings + mine.reduce((sum, value) => sum + value, 0);
  const count = shop.ratings + mine.length;
  return { score: Math.round((total / count) * 10) / 10, count, rescued: shop.rescued + collectedItems(state, merchantId) };
}

function collectedItems(state, merchantId) {
  return state.orders
    .filter(order => order.status === 'collected' && (!merchantId || order.merchantId === merchantId))
    .reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
}

/* Tomorrow.

   A demo that runs out of stock and never refills is a demo with a shelf life
   of one visit, and a shop that has to relist the same surprise bag by hand
   every evening is not a product anyone would sign up to. Both are the same
   feature: recurring items come back. */
export function startNewDay(state, minutes = nowMinutes()) {
  const swept = expireOrders(state, minutes);
  return {
    ...swept,
    day: (swept.day ?? 1) + 1,
    offers: swept.offers.map(offer => (offer.recurring
      ? { ...offer, quantity: offer.dailyQuantity ?? offer.quantity, active: true }
      : offer)),
  };
}

/* What a shop owner actually wants to know, which is not how many rows are in
   a table. Payouts are the number that decides whether they stay. */
export function merchantSummary(state, merchantId) {
  const orders = state.orders.filter(order => !merchantId || order.merchantId === merchantId);
  const collected = orders.filter(order => order.status === 'collected');
  const expired = orders.filter(order => order.status === 'expired');
  const offers = state.offers.filter(offer => !merchantId || offer.merchantId === merchantId);
  return {
    orders: orders.length,
    collected: collected.length,
    expired: expired.length,
    // Only a collected order is money the shop keeps; an expired one is food
    // that went in the bin anyway, and saying otherwise would be flattery.
    payout: collected.reduce((sum, order) => sum + order.total, 0),
    pending: orders.filter(order => order.status === 'ready').reduce((sum, order) => sum + order.total, 0),
    rescued: collected.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0),
    wasted: expired.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0),
    recurring: offers.filter(offer => offer.recurring).length,
    unsold: offers.reduce((sum, offer) => sum + offer.quantity, 0),
  };
}

export function saveOffer(state, offer) {
  if (!offer || typeof offer !== 'object') throw new Error('Add the item details before saving.');
  const existing = offer.id ? state.offers.find(item => item.id === offer.id) : null;
  if (offer.id && !existing) throw new Error('This offer could not be found.');
  const next = { ...existing, ...offer, id: existing?.id ?? `offer-${globalThis.crypto.randomUUID()}` };
  validateOffer(next);
  if (existing && existing.merchantId !== next.merchantId) throw new Error('An existing offer cannot be moved to another shop.');
  next.title = next.title.trim();
  next.description = next.description.trim();
  next.allergens = next.allergens.map(item => item.trim()).filter(Boolean);
  return {
    ...state,
    offers: existing ? state.offers.map(item => item.id === next.id ? next : item) : [next, ...state.offers],
  };
}

export function toggleSaved(state, id) {
  requireOffer(state, id);
  return { ...state, saved: state.saved.includes(id) ? state.saved.filter(item => item !== id) : [...state.saved, id] };
}
