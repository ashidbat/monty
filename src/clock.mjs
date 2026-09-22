/* The clock the application reads.

   Every pickup window in the catalogue is a pair of strings — '17:00' to
   '19:00' — and until now nothing ever compared them to a real time. That made
   the whole premise decorative: an order could be collected at three in the
   morning, a window that shut two hours ago looked exactly like one shutting
   in ten minutes, and nothing ever expired. Food that expires tonight is the
   entire product, so the product has to know what time it is.

   It is a demo clock rather than `new Date()` for one practical reason: a
   reviewer opens the file when they open it. At eleven in the morning every
   window is upcoming and nothing is collectable; at midnight everything is
   shut. Either way they see the least interesting version of the app. So the
   clock starts inside the trading day, runs forward in real time from there,
   and can be pushed around — which turns "windows close" from a claim into
   something a reviewer can watch happen.

   For production, delete `base`, `nudge` and `reset`, and make `nowMinutes`
   return the real wall clock. Nothing else here changes. */

// Minutes since midnight, which is all any window comparison needs. No window
// in the catalogue crosses midnight, and the arithmetic below assumes that.
export const DAY = 24 * 60;

/* Quarter to six: Little Loaf and Orchard Café are open, Orchard is inside its
   last hour, Seoul Street and Steppe Table open shortly, Sansar has just shut
   and Blue Sky has not started. One glance shows every state a window has. */
export const DEMO_START = 17 * 60 + 45;

// Outside these hours the catalogue has nothing open, so a real clock would
// only ever show a reviewer an empty shop.
const TRADING = [13 * 60, 22 * 60 + 30];

function realMinutes() {
  const at = new Date();
  return at.getHours() * 60 + at.getMinutes();
}

function openingMinutes() {
  const real = realMinutes();
  return real >= TRADING[0] && real <= TRADING[1] ? real : DEMO_START;
}

let base = openingMinutes();
let startedAt = Date.now();
const listeners = new Set();

/* Time of day in minutes, advancing in real time from wherever the demo was
   last set. Fractional, so a countdown crosses a minute boundary cleanly. */
export function nowMinutes() {
  return (base + (Date.now() - startedAt) / 60000) % DAY;
}

export function isSimulated() {
  return Math.abs(nowMinutes() - realMinutes()) > 2;
}

function announce() {
  for (const listener of listeners) listener();
}

/* One shared interval rather than one per component: a countdown only has to
   be right to the minute, and twenty seconds keeps the last minute honest
   without waking the page up constantly. */
let timer = null;
export function subscribe(listener) {
  listeners.add(listener);
  if (!timer) timer = setInterval(announce, 20000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) { clearInterval(timer); timer = null; }
  };
}

export function nudge(deltaMinutes) {
  base = (((base + (Date.now() - startedAt) / 60000 + deltaMinutes) % DAY) + DAY) % DAY;
  startedAt = Date.now();
  announce();
}

export function setMinutes(minutes) {
  base = ((minutes % DAY) + DAY) % DAY;
  startedAt = Date.now();
  announce();
}

export function reset() {
  setMinutes(openingMinutes());
}

export function parseTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? ''));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatTime(minutes) {
  const whole = Math.floor(((minutes % DAY) + DAY) % DAY);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

/* The last forty-five minutes of a window are the ones worth shouting about:
   long enough to still walk there, short enough that waiting is a decision. */
export const CLOSING_SOON = 45;

export function windowState(pickupStart, pickupEnd, minutes = nowMinutes()) {
  const start = parseTime(pickupStart);
  const end = parseTime(pickupEnd);
  if (start === null || end === null) return 'open';
  if (minutes < start) return 'upcoming';
  if (minutes >= end) return 'closed';
  return end - minutes <= CLOSING_SOON ? 'closing' : 'open';
}

export function minutesUntil(time, minutes = nowMinutes()) {
  const target = parseTime(time);
  return target === null ? null : Math.max(0, Math.round(target - minutes));
}

// A pickup window that has shut is the one state that stops a sale, because
// the shop is closing and nobody is there to hand the bag over.
export function isCollectable(pickupStart, pickupEnd, minutes = nowMinutes()) {
  return windowState(pickupStart, pickupEnd, minutes) !== 'closed';
}

export function isOpenNow(pickupStart, pickupEnd, minutes = nowMinutes()) {
  const state = windowState(pickupStart, pickupEnd, minutes);
  return state === 'open' || state === 'closing';
}
