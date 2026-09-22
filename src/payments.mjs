/* Payments, and the seam a real provider drops into.

   Mongolia pays by QPay: the merchant's server asks QPay for an invoice, QPay
   answers with a QR and a list of bank applications that can settle it, the
   customer pays in whichever bank they hold, and the merchant's server learns
   about it from a callback or by polling. Nothing about that flow can be done
   from a browser — it needs a server, a merchant contract and credentials that
   must never reach a page — so this file does not attempt it.

   What it does is model the flow exactly, with a provider interface shaped
   like QPay's own API, and one implementation that settles imaginary money.
   Every screen, state and error the real integration needs already exists and
   is already designed. When the QPay contract is signed:

     1. Write a `qpay` provider with the same four functions below. Each one
        calls YOUR server, never QPay directly: the client id and secret are
        server credentials, and a browser cannot hold them.
     2. Your server calls POST /v2/auth/token, then POST /v2/invoice, and
        returns the invoice to the browser. QPay's response already carries
        `qr_text`, a base64 `qr_image` and a `urls` array of bank deeplinks —
        map those onto `qrText`, `qrImage` and `banks` and this interface will
        render them unchanged.
     3. Point `checkInvoice` at your server's wrapper around
        POST /v2/payment/check. Treat your server's answer as the truth; the
        browser's opinion about whether something is paid is worth nothing.
     4. Set ACTIVE to the new provider. No screen has to change.

   The one thing a production build must not inherit from here is trust.
   `demoQPay` decides on its own that it has been paid, which is the correct
   behaviour for a prototype and a fraud vector in anything real. An order is
   only ever paid because a server that talked to QPay says so. */

const DEMO_PREFIX = 'DEMO';

/* Ulaanbaatar's banks and wallets, in roughly the order QPay lists them. They
   are here because a payment sheet without them would not look like the thing
   being designed — names only, no logos, no deeplinks and nothing that could
   reach a real application. Tapping one settles the demo invoice. */
export const DEMO_BANKS = [
  { id: 'khan', name: 'Khan Bank', short: 'KH' },
  { id: 'tdb', name: 'Trade & Development Bank', short: 'TDB' },
  { id: 'golomt', name: 'Golomt Bank', short: 'GL' },
  { id: 'state', name: 'State Bank', short: 'ST' },
  { id: 'xac', name: 'Xac Bank', short: 'XC' },
  { id: 'mbank', name: 'M Bank', short: 'M' },
  { id: 'monpay', name: 'MonPay', short: 'MP' },
  { id: 'social', name: 'SocialPay', short: 'SP' },
];

const INVOICE_MINUTES = 10;

function reference() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(5));
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return DEMO_PREFIX + [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

/* A store rather than a variable: a reviewer can open a second invoice before
   abandoning the first, and both have to keep their own state. */
const invoices = new Map();

export const demoQPay = {
  id: 'demo-qpay',
  /* The name a customer reads. It says demo first and on purpose: a payment
     sheet is the one screen where a reader must never be left guessing. */
  labelKey: 'pay.provider.demo',
  labelEn: 'Demo QPay',

  /* Mirrors POST /v2/invoice. A real one takes an amount, a description and
     the merchant's own reference, and is called from a server. */
  createInvoice({ amount, description, orderReference }) {
    if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('An invoice needs a whole-tögrög amount.');
    const invoiceId = reference();
    const invoice = {
      provider: 'demo-qpay',
      invoiceId,
      amount,
      description: String(description ?? ''),
      orderReference: String(orderReference ?? ''),
      /* QPay returns an EMVCo payload here and a ready-made PNG in `qr_image`.
         The bundled encoder is a version 1 symbol and holds seventeen
         characters, which is the invoice reference and not a payment
         instrument. A real integration renders `qrImage` instead and never
         has to encode anything. */
      qrText: invoiceId,
      qrImage: null,
      banks: DEMO_BANKS,
      status: 'pending',
      paidAmount: 0,
      paidAt: null,
      paidVia: null,
      createdAt: Date.now(),
      expiresInMinutes: INVOICE_MINUTES,
    };
    invoices.set(invoiceId, invoice);
    return { ...invoice };
  },

  // Mirrors POST /v2/payment/check. The browser polls this; in production the
  // answer comes from your server, which has heard from QPay.
  checkInvoice(invoiceId) {
    const invoice = invoices.get(invoiceId);
    if (!invoice) return { status: 'unknown', paidAmount: 0 };
    if (invoice.status === 'pending' && Date.now() - invoice.createdAt > INVOICE_MINUTES * 60000) {
      invoice.status = 'expired';
    }
    return { status: invoice.status, paidAmount: invoice.paidAmount, paidAt: invoice.paidAt, paidVia: invoice.paidVia };
  },

  cancelInvoice(invoiceId) {
    const invoice = invoices.get(invoiceId);
    if (invoice && invoice.status === 'pending') invoice.status = 'cancelled';
    return invoice ? { ...invoice } : null;
  },

  /* The part with no production equivalent, and the reason this provider is
     not safe to ship: it settles its own invoice. In the real flow the
     customer's bank tells QPay, QPay tells your server, and the browser only
     ever finds out by asking. Deleting this function is step one of going
     live. */
  settleInvoice(invoiceId, bankId = 'khan', outcome = 'paid') {
    const invoice = invoices.get(invoiceId);
    if (!invoice || invoice.status !== 'pending') return null;
    if (outcome === 'paid') {
      invoice.status = 'paid';
      invoice.paidAmount = invoice.amount;
      invoice.paidAt = new Date().toISOString();
      invoice.paidVia = DEMO_BANKS.find(bank => bank.id === bankId)?.name ?? bankId;
    } else {
      invoice.status = outcome === 'expired' ? 'expired' : 'failed';
    }
    return { ...invoice };
  },
};

/* The single line a production build changes. Everything downstream reads the
   provider through this, so no screen knows which one it is talking to. */
export const ACTIVE = demoQPay;

export function createInvoice(request) { return ACTIVE.createInvoice(request); }
export function checkInvoice(invoiceId) { return ACTIVE.checkInvoice(invoiceId); }
export function cancelInvoice(invoiceId) { return ACTIVE.cancelInvoice(invoiceId); }

// Present only while ACTIVE is a demo provider, so the interface can hide the
// simulation controls the moment a real one is wired in.
export function canSimulate() { return typeof ACTIVE.settleInvoice === 'function'; }
export function simulate(invoiceId, bankId, outcome) { return ACTIVE.settleInvoice?.(invoiceId, bankId, outcome) ?? null; }
