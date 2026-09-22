/* The clock the application reads.

   Every pickup window in the catalogue is a pair of strings — '17:00' to
   '19:00' — and they only mean anything if something compares them to a real
   time. Without that the whole premise is decorative: an order could be
   collected at three in the morning, a window that shut two hours ago looks
   exactly like one shutting in ten minutes, and nothing ever expires. Food
   that expires tonight is the entire product, so the product knows what time
   it is.

   That time is the device's own clock. There is no demo offset and nothing to
   push around: the app is as open or as shut as the shops actually are. The
   one seam is `setMinutes`, which the tests use to stand at a chosen hour. */

// Minutes since midnight, which is all any window comparison needs. No window
// in the catalogue crosses midnight, and the arithmetic below assumes that.
export const DAY = 24 * 60;

/* Seconds are folded in so the value is fractional. A countdown rounds to the
   minute, and without the seconds it would round the same way either side of
   a minute boundary and appear to stick. */
function realMinutes() {
  const at = new Date();
  return at.getHours() * 60 + at.getMinutes() + at.getSeconds() / 60;
}

/* null means "follow the device", which is every case but a test. */
let base = null;
let startedAt = Date.now();
const listeners = new Set();

export function nowMinutes() {
  if (base === null) return realMinutes();
  return (base + (Date.now() - startedAt) / 60000) % DAY;
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

/* Test seam. Standing the clock at a fixed hour is the only way to assert on
   a window opening, closing or expiring without waiting for the day to reach
   it. Production code reads the device clock and never calls this. */
export function setMinutes(minutes) {
  base = ((minutes % DAY) + DAY) % DAY;
  startedAt = Date.now();
  announce();
}

// Hands the clock back to the device, undoing a test's setMinutes.
export function useDeviceClock() {
  base = null;
  announce();
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
