import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { qrPath } from '../qr.mjs';
import { money, t } from '../i18n.js';
import { createInvoice, checkInvoice, cancelInvoice, canSimulate, simulate, ACTIVE } from '../payments.mjs';

/* The payment sheet.

   Shaped around QPay because that is what Ulaanbaatar pays with: an invoice
   becomes a QR and a list of banks, the customer pays in whichever bank they
   hold, and the shop finds out by asking rather than by being told by the
   phone in front of it. Every state that flow can be in is here — pending,
   paid, failed, expired, cancelled — because those are the states that decide
   what this screen looks like, and they do not change when the provider does.

   The polling loop is deliberate. It is what a browser has to do while a
   payment happens somewhere else entirely, and building the screen without it
   would hide the only genuinely hard part of the integration. */

const POLL_MS = 900;

function Banks({ banks, onPay, disabled }) {
  return <div className="pay-banks" role="group" aria-label={t('pay.banks', 'Pay from your bank app')}>
    {banks.map(bank => <button
      key={bank.id}
      type="button"
      className="pay-bank"
      disabled={disabled}
      onClick={() => onPay(bank.id)}
    ><span aria-hidden="true">{bank.short}</span>{bank.name}</button>)}
  </div>;
}

export default function Payment({ amount, description, reference, onPaid, onCancel }) {
  /* Asked for during the first render rather than in an effect. An invoice is
     the whole content of this screen, and creating it afterwards means one
     paint of an empty sheet — and a sheet that renders as nothing at all
     without a browser, which is how a broken checkout reaches somebody. */
  const [opened] = useState(() => {
    try { return { invoice: createInvoice({ amount, description, orderReference: reference }), error: '' }; }
    catch (failure) { return { invoice: null, error: failure.message }; }
  });
  const invoice = opened.invoice;
  const error = opened.error;
  const [status, setStatus] = useState(invoice ? invoice.status : 'failed');
  const settled = useRef(false);

  /* Asking, rather than waiting to be told. A real build polls its own server,
     which polls QPay or has heard from QPay's callback; the shape of the loop
     and everything it has to handle is identical. */
  useEffect(() => {
    if (!invoice || status !== 'pending') return;
    const poll = setInterval(() => {
      const result = checkInvoice(invoice.invoiceId);
      if (result.status === 'pending') return;
      clearInterval(poll);
      setStatus(result.status);
      if (result.status === 'paid' && !settled.current) {
        settled.current = true;
        onPaid({
          provider: invoice.provider,
          invoiceId: invoice.invoiceId,
          status: 'paid',
          paidAmount: result.paidAmount,
          paidAt: result.paidAt,
          paidVia: result.paidVia,
        });
      }
    }, POLL_MS);
    return () => clearInterval(poll);
  }, [invoice, status, onPaid]);

  // Walking away from a half-finished payment has to release the invoice, or
  // the reader comes back to a sheet that thinks it is still waiting.
  useEffect(() => () => { if (invoice && !settled.current) cancelInvoice(invoice.invoiceId); }, [invoice]);

  if (!invoice) {
    return <div className="pay-sheet"><div className="pay-failed" role="alert"><strong>{t('pay.failed', 'The payment did not go through')}</strong><p>{error || t('pay.failed.body', 'Nothing was charged. Start the payment again whenever you are ready.')}</p><button className="primary-button full" onClick={onCancel}>{t('pay.back', 'Back to the basket')}</button></div></div>;
  }

  if (status === 'paid') {
    return <div className="pay-sheet"><div className="pay-done"><span className="pay-tick"><Icon name="check" size={26} /></span><strong>{t('pay.paid', 'Payment received')}</strong><p>{t('pay.paid.body', 'Creating your order and pickup pass…')}</p></div></div>;
  }

  const failed = status === 'failed' || status === 'expired' || status === 'cancelled';
  const qr = qrPath(invoice.qrText);

  return <div className="pay-sheet">
    <p className="pay-banner"><Icon name="shield" size={17} />{t('pay.banner', 'Demo payment. No money moves, no bank is contacted and no card details are asked for.')}</p>

    <div className="pay-amount"><span>{t('pay.amount', 'To pay')}</span><strong>{money(amount)}</strong></div>

    {failed ? <div className="pay-failed" role="alert">
      <strong>{status === 'expired' ? t('pay.expired', 'This invoice timed out') : status === 'cancelled' ? t('pay.cancelled', 'Payment cancelled') : t('pay.failed', 'The payment did not go through')}</strong>
      <p>{error || t('pay.failed.body', 'Nothing was charged. Start the payment again whenever you are ready.')}</p>
      <button className="primary-button full" onClick={onCancel}>{t('pay.back', 'Back to the basket')}</button>
    </div> : <>
      {/* A real QPay invoice arrives with its own PNG, so a production build
          renders that and never encodes anything. The bundled encoder is a
          version 1 symbol holding the demo invoice reference — not a payment
          instrument, and it says so underneath. */}
      <div className="pay-qr">
        {invoice.qrImage
          ? <img src={invoice.qrImage} alt={t('pay.qr.alt', 'Payment QR code')} />
          : <svg role="img" aria-label={t('pay.qr.alt', 'Payment QR code')} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff" /><path d={qr.path} fill="#352638" /></svg>}
        <p>{t('pay.qr.note', 'Scan in your banking app, or choose your bank below.')}</p>
        <code>{invoice.invoiceId}</code>
      </div>

      <Banks banks={invoice.banks} disabled={!canSimulate()} onPay={bank => { simulate(invoice.invoiceId, bank, 'paid'); }} />

      <p className="pay-waiting" role="status"><Icon name="refresh" size={17} />{t('pay.waiting', 'Waiting for your bank to confirm…')}</p>

      {/* Present only while the provider is a demo one. The moment ACTIVE is a
          real QPay, canSimulate() is false and these disappear. */}
      {canSimulate() && <div className="pay-simulate">
        <span>{t('pay.simulate', 'Reviewer controls · {provider}', { provider: t(ACTIVE.labelKey, ACTIVE.labelEn) })}</span>
        <div>
          <button type="button" onClick={() => simulate(invoice.invoiceId, 'khan', 'paid')}>{t('pay.simulate.paid', 'Simulate a paid invoice')}</button>
          <button type="button" onClick={() => simulate(invoice.invoiceId, 'khan', 'failed')}>{t('pay.simulate.failed', 'Simulate a decline')}</button>
        </div>
      </div>}

      <button className="secondary-button full" onClick={onCancel}>{t('pay.cancel', 'Cancel payment')}</button>
    </>}
  </div>;
}
