import React, { useEffect, useRef, useState } from 'react';
import { merchants, saveOffer, confirmPickup, merchantSummary, shopRating, offerState, CATEGORIES } from './model.mjs';
import { DISTRICTS } from './catalogue.mjs';
import { ART_NAMES } from './foodart.mjs';
import { formatDistance } from './geo.mjs';
import { photoURL } from './photos.js';
import Wordmark from './Wordmark.jsx';
import Icon from './components/Icon.jsx';
import MiniMap from './components/MiniMap.jsx';
import { money, t } from './i18n.js';
import { formatTime, windowState } from './clock.mjs';
import Countdown from './components/Countdown.jsx';
import { ShopRating } from './components/Rating.jsx';
import { offerTitle, shopName, shopKind, shopAddress, lineTitle } from './content.js';

/* The five photographs, then the drawings. A shop that has sent us a picture
   should reach for it first; the rest of the list is what everyone else has. */
const photos = [
  { image: '/assets/croissant.jpg', title: 'Croissant', key: 'demo.offer.o1.title' },
  { image: '/assets/cinnamon.jpg', title: 'Cinnamon roll', key: 'demo.offer.o2.title' },
  { image: '/assets/kimbap.jpg', title: 'Kimbap', key: 'demo.offer.o3.title' },
  { image: '/assets/cake.jpg', title: 'Cake', key: 'demo.offer.o4.title' },
  { image: '/assets/bread.jpg', title: 'Sourdough', key: 'demo.offer.o5.title' },
  ...ART_NAMES.map(name => ({ image: `art:${name}`, title: name, key: `art.${name}` })),
];
const blankOffer = merchantId => ({ merchantId, title: '', description: '', category: 'Bakery', price: '', originalPrice: '', quantity: 5, dailyQuantity: 5, recurring: true, pickupStart: '17:00', pickupEnd: '19:00', image: photos[0].image, allergens: '', active: true });
const itemCount = orders => orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0);

// The editor writes the English category value that model.mjs validates; only
// the option text follows the reader's language.
const CATEGORY_KEYS = {
  Bakery: 'category.bakery', Meals: 'category.meals', Sweet: 'category.sweet',
  Drinks: 'category.drinks', Grocery: 'category.grocery',
};
const districtLabel = id => { const entry = DISTRICTS.find(item => item.id === id); return entry ? t(entry.key, entry.en) : id; };

function Empty({ title, children }) {
  return <div className="ops-empty"><h3>{title}</h3><p>{children}</p></div>;
}

function Stats({ values }) {
  return <div className="ops-stats">{values.map(([value, label]) => <div className="ops-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>;
}

/* The overview gets scanned, not read, so it leads with a single figure and
   keeps the four supporting numbers quiet beneath it. The collection meter is a
   ratio against a whole, so it gets a track; a fifth tile would only compete
   with the other four. */
function Overview({ orders, readyOrders, collectedOrders }) {
  const rescued = itemCount(collectedOrders);
  const value = orders.reduce((sum, order) => sum + order.total, 0);
  const savings = orders.reduce((sum, order) => sum + order.originalTotal - order.total, 0);
  const rate = orders.length ? Math.round((collectedOrders.length / orders.length) * 100) : 0;
  const tiles = [
    ['clock', readyOrders.length, t('ops.overview.awaiting', 'Orders awaiting pickup')],
    ['check', collectedOrders.length, t('ops.overview.collectedorders', 'Orders collected')],
    ['receipt', money(value), t('ops.overview.value', 'Value of demo orders')],
    ['heart', money(savings), t('ops.overview.savings', 'Customer savings')],
  ];
  return <div className="ops-admin-grid">
    <section className="ops-panel ops-overview">
      <h2>{t('ops.overview.title', 'Today’s demo activity')}</h2>
      <div className="ops-figure">
        <span className="ops-figure-mark" aria-hidden="true"><Icon name="leaf" size={26} /></span>
        <div>
          <strong>{rescued}</strong>
          <span>{t('ops.overview.rescued', 'Items rescued from waste')}</span>
          <small>{t('ops.overview.rescued.note', 'Food items inside collected demo orders.')}</small>
        </div>
      </div>
      <div className="ops-kpis">
        {tiles.map(([icon, figure, label]) => <div className="ops-kpi" key={label}>
          <span className="ops-kpi-label"><Icon name={icon} size={15} />{label}</span>
          <strong>{figure}</strong>
        </div>)}
      </div>
      <div className="ops-meter">
        <div className="ops-meter-top"><span>{t('ops.overview.rate', 'Collection rate')}</span><strong>{orders.length ? `${rate}%` : '—'}</strong></div>
        <div className="ops-meter-track" role="img" aria-label={orders.length
          ? t('ops.overview.rate.body', '{collected} of {total} orders collected at the counter.', { collected: collectedOrders.length, total: orders.length })
          : t('ops.overview.rate.none', 'The collection rate appears here once an order is placed.')}>
          <i style={{ width: `${orders.length ? rate : 0}%` }} />
        </div>
        <small>{orders.length
          ? t('ops.overview.rate.body', '{collected} of {total} orders collected at the counter.', { collected: collectedOrders.length, total: orders.length })
          : t('ops.overview.rate.none', 'The collection rate appears here once an order is placed.')}</small>
      </div>
    </section>
    <section className="ops-panel ops-admin-note">
      <h2>{t('ops.overview.note.title', 'Small beginnings.')}</h2>
      <p>{t('ops.overview.note.1', '{shops} contracted shops across Ulaanbaatar. A great many lovely things to eat. One simple way to collect them.', { shops: merchants.length })}</p>
      <p>{t('ops.overview.note.2', 'These numbers update when you place an order, change an offer or confirm a pickup.')}</p>
      <p>{t('ops.overview.note.3', 'Demo order value is simulated. It is not platform income or a merchant payout.')}</p>
    </section>
  </div>;
}

function Orders({ orders, showMerchant = false }) {
  if (!orders.length) return <Empty title={t('ops.orders.empty.title', 'The counter is quiet for now.')}>{t('ops.orders.empty.body', 'Place an order in the customer preview, then come back here to see it.')}</Empty>;
  return <div className="ops-order-list">{orders.map(order => <article key={order.id} className="ops-order">
    <div className="ops-order-top"><strong>{order.code}</strong><span className={`ops-status ${order.status === 'collected' ? 'collected' : ''}`}>{order.status === 'collected' ? t('ops.order.status.collected', 'Collected') : t('ops.order.status.ready', 'Awaiting pickup')}</span></div>
    {showMerchant && <p className="ops-order-merchant">{shopName(merchants.find(shop => shop.id === order.merchantId))}</p>}
    <ul>{order.items.map(item => <li key={item.offerId}><span>{item.quantity} × {lineTitle(item)}</span><span>{money(item.price * item.quantity)}</span></li>)}</ul>
    <div className="ops-order-footer"><span>{t('ops.order.pickup', 'Pickup {start}–{end}', { start: order.pickupStart, end: order.pickupEnd })}<br />{t('ops.order.paid', 'Demo payment completed')}</span><strong>{money(order.total)}</strong></div>
  </article>)}</div>;
}

function OfferRows({ offers, minutes, onEdit, onReuse, onToggle, showMerchant = false }) {
  if (!offers.length) return <Empty title={t('ops.offers.empty.title', 'Make room for something good.')}>{t('ops.offers.empty.body', 'Add your first item with a photo, price and pickup time.')}</Empty>;
  return <ul className="ops-offers">{offers.map(offer => {
    const title = offerTitle(offer);
    return <li key={offer.id} className="ops-offer">
      <img src={photoURL(offer.image)} alt={title} loading="lazy" />
      <div className="ops-offer-info">
        <h3>{title}</h3>
        <p>{showMerchant ? `${shopName(merchants.find(shop => shop.id === offer.merchantId))} · ` : ''}{t('ops.offer.available', '{count} available', { count: offer.quantity })} · <Countdown offer={offer} minutes={minutes} /></p>
        <p><span className={`ops-status ${offerState(offer, minutes) === 'available' ? '' : 'paused'}`}>{{
          paused: t('ops.offer.status.paused', 'Paused'),
          soldout: t('ops.offer.status.soldout', 'Sold out'),
          closed: t('ops.offer.status.closed', 'Window closed'),
          available: t('ops.offer.status.live', 'On the counter'),
        }[offerState(offer, minutes)]}</span>{offer.recurring && <span className="ops-recurring-tag"><Icon name="repeat" size={13} />{t('ops.offer.daily', 'Daily')}</span>}</p>
        <div className="ops-offer-price">{money(offer.price)}<del>{money(offer.originalPrice)}</del></div>
      </div>
      {onEdit && <div className="ops-offer-actions"><button onClick={() => onEdit(offer)} aria-label={t('ops.offer.edit.label', 'Edit {title}', { title })}>{t('ops.offer.edit', 'Edit')}</button><button onClick={() => onReuse(offer)} aria-label={t('ops.offer.reuse.label', 'Reuse {title}', { title })}>{t('ops.offer.reuse', 'Reuse item')}</button><button onClick={() => onToggle(offer)} aria-label={`${offer.active ? t('ops.offer.pause', 'Pause') : t('ops.offer.publish', 'Publish')} ${title}`}>{offer.active ? t('ops.offer.pause', 'Pause') : t('ops.offer.publish', 'Publish')}</button></div>}
    </li>;
  })}</ul>;
}

function OfferEditor({ draft, setDraft, onSave, onClose, error, heading }) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, [draft.id, heading]);
  const update = (field, value) => setDraft(previous => ({ ...previous, [field]: value }));
  return <section className="ops-editor" aria-label={heading}>
    <div className="ops-editor-title"><h2>{heading}</h2><button className="ops-close" type="button" aria-label={t('ops.editor.close', 'Close item editor')} onClick={onClose}>×</button></div>
    {error && <p className="ops-error" role="alert">{error}</p>}
    <form className="ops-form" onSubmit={onSave}>
      <label className="ops-field">{t('ops.field.title', 'Item name')}<input ref={titleRef} required maxLength={80} value={draft.title} onChange={event => update('title', event.target.value)} placeholder={t('ops.field.title.placeholder', 'e.g. Butter croissant')} /></label>
      <label className="ops-field">{t('ops.field.description', 'Description')}<textarea required maxLength={600} value={draft.description} onChange={event => update('description', event.target.value)} placeholder={t('ops.field.description.placeholder', 'What makes it delicious?')} /></label>
      <label className="ops-field">{t('ops.field.category', 'Category')}<select value={draft.category} onChange={event => update('category', event.target.value)}>{CATEGORIES.map(id => <option key={id} value={id}>{t(CATEGORY_KEYS[id], id)}</option>)}</select></label>
      <div className="ops-form-pair"><label className="ops-field">{t('ops.field.original', 'Usual price (₮)')}<input required inputMode="numeric" type="number" min="2" step="1" value={draft.originalPrice} onChange={event => update('originalPrice', event.target.value)} /></label><label className="ops-field">{t('ops.field.price', 'Monty price (₮)')}<input required inputMode="numeric" type="number" min="1" step="1" value={draft.price} onChange={event => update('price', event.target.value)} /></label></div>
      <label className="ops-field">{t('ops.field.quantity', 'Quantity available today')}<input required inputMode="numeric" type="number" min="0" step="1" value={draft.quantity} onChange={event => update('quantity', event.target.value)} /></label>
      {/* The feature a bakery actually needs. Nobody relists the same surprise
          bag by hand every evening for the rest of their life; they say it
          once and it comes back. */}
      <label className="ops-check ops-recurring"><input type="checkbox" checked={draft.recurring !== false} onChange={event => update('recurring', event.target.checked)} /><span><Icon name="repeat" size={16} />{t('ops.field.recurring', 'Put this back on the counter every day')}</span></label>
      {draft.recurring !== false && <label className="ops-field">{t('ops.field.daily', 'How many each day')}<input required inputMode="numeric" type="number" min="0" step="1" value={draft.dailyQuantity ?? draft.quantity} onChange={event => update('dailyQuantity', event.target.value)} /><small>{t('ops.field.daily.note', 'Tomorrow starts from this number, whatever is left over tonight.')}</small></label>}
      <div className="ops-form-pair"><label className="ops-field">{t('ops.field.from', 'Pickup from')}<input required type="time" value={draft.pickupStart} onChange={event => update('pickupStart', event.target.value)} /></label><label className="ops-field">{t('ops.field.until', 'Pickup until')}<input required type="time" value={draft.pickupEnd} onChange={event => update('pickupEnd', event.target.value)} /></label></div>
      <div className="ops-field"><span>{t('ops.field.photo', 'Picture')}</span><div className="ops-photo-choices" role="group" aria-label={t('ops.field.photo.group', 'Choose a sample photo or a drawing')}>{photos.map((photo, index) => <button className="ops-photo-choice" key={photo.image} type="button" aria-label={index < 5 ? t('ops.field.photo.use', 'Use {title} sample photo', { title: t(photo.key, photo.title).toLowerCase() }) : t('ops.field.photo.drawing', 'Use drawing {number}', { number: index - 4 })} aria-pressed={draft.image === photo.image} onClick={() => update('image', photo.image)}><img src={photoURL(photo.image)} alt="" loading="lazy" /></button>)}</div><small>{t('ops.field.photo.note', 'Five sample photographs, then the drawings a listing uses until you send a photo of your own.')}</small></div>
      <label className="ops-field">{t('ops.field.link', 'Or paste a photo link')}<input required type="text" value={draft.image} onChange={event => update('image', event.target.value)} /><small>{t('ops.field.link.note', 'Use an https:// image link, or keep a sample above.')}</small></label>
      <label className="ops-field">{t('ops.field.allergens', 'Allergens')}<input value={draft.allergens} onChange={event => update('allergens', event.target.value)} placeholder={t('ops.field.allergens.placeholder', 'e.g. Wheat, milk, eggs')} /><small>{t('ops.field.allergens.note', 'Separate each allergen with a comma.')}</small></label>
      <label className="ops-check"><input type="checkbox" checked={draft.active} onChange={event => update('active', event.target.checked)} />{t('ops.field.active', 'Show this item to customers')}</label>
      <button className="ops-button" type="submit">{draft.id ? t('ops.field.save.changes', 'Save changes') : t('ops.field.save', 'Save item')}</button>
    </form>
  </section>;
}

export default function Operations({ role, state, setState, onExit, notify, place, distances = {}, minutes, onNewDay }) {
  const isAdmin = role === 'admin';
  const [merchantId, setMerchantId] = useState('m1');
  const [tab, setTab] = useState(isAdmin ? 'Overview' : 'Items');
  // Every shop's whole counter at once is a hundred and twenty rows, so the
  // operations list filters by shop before it prints.
  const [shopFilter, setShopFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [editorHeading, setEditorHeading] = useState(null);
  const [error, setError] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [pickupSuccess, setPickupSuccess] = useState('');
  useEffect(() => { setTab(isAdmin ? 'Overview' : 'Items'); setDraft(null); setError(''); }, [isAdmin]);
  const shop = merchants.find(merchant => merchant.id === merchantId);
  const offers = state.offers.filter(offer => isAdmin || offer.merchantId === merchantId);
  const orders = state.orders.filter(order => isAdmin || order.merchantId === merchantId);
  const readyOrders = orders.filter(order => order.status === 'ready');
  const collectedOrders = orders.filter(order => order.status === 'collected');
  const liveOffers = offers.filter(offer => offerState(offer, minutes) === 'available');
  const summary = merchantSummary(state, isAdmin ? null : merchantId);
  const rating = isAdmin ? null : shopRating(state, merchantId);
  const feedback = message => { if (notify) notify(message); };
  // Headings are held as a key so a language change re-reads them. Holding the
  // text would leave the editor titled in whichever language it was opened in.
  const headingText = {
    new: t('ops.editor.new', 'A new little offering'),
    edit: t('ops.editor.edit', 'A little change'),
    reuse: t('ops.editor.reuse', 'Put it back on the counter'),
  }[editorHeading || 'new'];

  const TABS = {
    Overview: ['ops.tab.overview', 'Overview'],
    Shops: ['ops.tab.shops', 'Shops'],
    Offers: ['ops.tab.offers', 'Offers'],
    Orders: ['ops.tab.orders', 'Orders'],
    People: ['ops.tab.people', 'People'],
    Items: ['ops.tab.items', 'Items'],
    Pickups: ['ops.tab.pickups', 'Pickups'],
    Money: ['ops.tab.money', 'Money'],
  };

  function editOffer(offer, reuse = false) {
    setError('');
    setEditorHeading(reuse ? 'reuse' : 'edit');
    setDraft({ ...offer, ...(reuse ? { id: undefined, quantity: offer.dailyQuantity ?? 5, active: true } : {}), allergens: offer.allergens.join(', ') });
  }

  function submitOffer(event) {
    event.preventDefault();
    try {
      const image = draft.image.trim();
      if (!(image.startsWith('/assets/') || /^https?:\/\//i.test(image))) throw new Error(t('ops.error.photo', 'Choose a sample photo or paste an http:// or https:// image link.'));
      const next = saveOffer(state, { ...draft, image, price: Number(draft.price), originalPrice: Number(draft.originalPrice), quantity: Number(draft.quantity), dailyQuantity: Number(draft.dailyQuantity ?? draft.quantity), recurring: draft.recurring !== false, allergens: draft.allergens.split(',').map(value => value.trim()).filter(Boolean) });
      setState(next);
      setDraft(null);
      setError('');
      feedback(draft.id ? t('ops.saved.edit', 'Your item has been updated.') : t('ops.saved.new', 'Your new item has been saved.'));
    } catch (failure) { setError(failure.message); feedback(failure.message); }
  }

  function toggleOffer(offer) {
    try { setState(saveOffer(state, { id: offer.id, active: !offer.active })); setError(''); feedback(offer.active ? t('ops.toggled.paused', 'Item paused.') : t('ops.toggled.live', 'Item is on the counter.')); }
    catch (failure) { setError(failure.message); feedback(failure.message); }
  }

  function collectOrder(event) {
    event.preventDefault();
    try {
      setState(confirmPickup(state, merchantId, pickupCode, minutes));
      setPickupError('');
      setPickupSuccess(t('ops.pickups.success', 'Order {code} collected. Thank you!', { code: pickupCode.trim().toUpperCase() }));
      setPickupCode('');
      feedback(t('ops.pickups.toast', 'Pickup confirmed. Enjoy every bite!'));
    } catch (failure) { setPickupError(failure.message); setPickupSuccess(''); feedback(failure.message); }
  }

  return <div className="ops">
    <div className="ops-demo">{t('ops.demo', 'Demo workspace · no real payments')}</div>
    <div className="ops-shell">
      <div className="ops-topline"><Wordmark small />
        <span className="ops-clock"><Icon name="clock" size={15} />{t('ops.clock', 'Local time {time} · day {day}', { time: formatTime(minutes), day: state.day ?? 1 })}</span>
        {onNewDay && <button className="ops-newday" onClick={onNewDay}><Icon name="sunrise" size={16} />{t('ops.newday', 'Start tomorrow')}</button>}
        <button className="ops-back" onClick={onExit}>{t('ops.back', 'Back to the customer app')}</button></div>
      <header className="ops-heading"><div><h1>{isAdmin ? t('ops.admin.title', 'A little care, behind the scenes.') : t('ops.merchant.title', 'Your little shop, on Monty.')}</h1><p>{isAdmin ? t('ops.admin.subtitle', 'A clear view of the shops, food and pickups in this demo.') : t('ops.merchant.subtitle', 'Put today’s good food on the counter. We’ll help it find a home.')}</p></div>{!isAdmin && <label className="ops-field ops-shop-picker">{t('ops.shop.picker', 'Shop preview')}<select value={merchantId} onChange={event => { setMerchantId(event.target.value); setDraft(null); setError(''); setPickupError(''); setPickupSuccess(''); setPickupCode(''); }}>{merchants.map(merchant => <option key={merchant.id} value={merchant.id}>{shopName(merchant)}</option>)}</select></label>}</header>
      <Stats values={isAdmin
        ? [[merchants.length, t('ops.stat.shops', 'Contracted shops')], [liveOffers.length, t('ops.stat.offers', 'Available offers')], [orders.length, t('ops.stat.orders', 'Orders placed')], [itemCount(collectedOrders), t('ops.stat.collected', 'Items collected')]]
        : [[liveOffers.length, t('ops.stat.counter', 'Items on the counter')], [readyOrders.length, t('ops.stat.awaiting', 'Orders awaiting pickup')], [itemCount(collectedOrders), t('ops.stat.collected', 'Items collected')], [money(summary.payout), t('ops.stat.payout', 'Recovered today')]]} />
      <nav className="ops-tabs" aria-label={isAdmin ? t('ops.nav.admin', 'Operations workspace') : t('ops.nav.merchant', 'Shop workspace')}>{(isAdmin ? ['Overview', 'Shops', 'Offers', 'Orders', 'People'] : ['Items', 'Pickups', 'Money']).map(label => <button key={label} aria-pressed={tab === label} className="ops-tab" onClick={() => { setTab(label); setError(''); }}>{t(TABS[label][0], TABS[label][1])}{label === 'Pickups' && readyOrders.length ? ` (${readyOrders.length})` : ''}</button>)}</nav>

      {!isAdmin && tab === 'Money' && <section aria-label={t('ops.money.manage', 'Your money')}>
        <div className="ops-section-heading"><div><h2>{t('ops.money.heading', 'What today put back in the till')}</h2><p>{t('ops.money.subtitle', 'Food you would have thrown away, and what it came back as.')}</p></div></div>
        <div className="ops-admin-grid">
          <section className="ops-panel ops-overview">
            <div className="ops-figure">
              <span className="ops-figure-mark" aria-hidden="true"><Icon name="payout" size={26} /></span>
              <div>
                <strong>{money(summary.payout)}</strong>
                <span>{t('ops.money.payout', 'Recovered from collected orders')}</span>
                <small>{t('ops.money.payout.note', 'Only collected orders count. An order nobody came for is food that went in the bin anyway.')}</small>
              </div>
            </div>
            <div className="ops-kpis">
              {[['clock', money(summary.pending), t('ops.money.pending', 'Paid, waiting to be collected')],
                ['leaf', summary.rescued, t('ops.money.rescued', 'Items rescued')],
                ['close', summary.wasted, t('ops.money.wasted', 'Items nobody came for')],
                ['repeat', summary.recurring, t('ops.money.recurring', 'Standing daily listings')]].map(([icon, figure, label]) => <div className="ops-kpi" key={label}>
                  <span className="ops-kpi-label"><Icon name={icon} size={15} />{label}</span>
                  <strong>{figure}</strong>
                </div>)}
            </div>
          </section>
          <section className="ops-panel ops-admin-note">
            <h2>{t('ops.money.trust.title', 'What your customers think')}</h2>
            {rating && <div className="ops-trust"><ShopRating rating={rating} /><p>{t('ops.money.trust.body', '{count} people have rated a collection from you, and {rescued} meals have left this counter instead of a bin.', { count: rating.count, rescued: rating.rescued })}</p></div>}
            <p>{t('ops.money.settle', 'Payouts in this preview are a figure, not a transfer. A live service settles to your bank on its own schedule.')}</p>
          </section>
        </div>
      </section>}

      {!isAdmin && tab === 'Items' && <section aria-label={t('ops.items.manage', 'Manage items')}><div className="ops-section-heading"><div><h2>{t('ops.items.heading', 'On {shop}’s counter', { shop: shopName(shop) })}</h2><p>{t('ops.items.subtitle', 'Keep your photo and details. Reuse an item whenever it’s available again.')}</p></div><button className="ops-button" onClick={() => { setDraft(blankOffer(merchantId)); setEditorHeading('new'); setError(''); }}>{t('ops.items.add', '+ Add an item')}</button></div>{error && !draft && <p className="ops-error" role="alert">{error}</p>}<div className={draft ? 'ops-split' : ''}><OfferRows offers={offers} minutes={minutes} onEdit={offer => editOffer(offer)} onReuse={offer => editOffer(offer, true)} onToggle={toggleOffer} />{draft && <OfferEditor draft={draft} setDraft={setDraft} heading={headingText} onSave={submitOffer} error={error} onClose={() => { setDraft(null); setError(''); }} />}</div></section>}

      {!isAdmin && tab === 'Pickups' && <section aria-label={t('ops.pickups.manage', 'Manage pickups')}><div className="ops-section-heading"><div><h2>{t('ops.pickups.heading', 'A little handover')}</h2><p>{t('ops.pickups.subtitle', 'Check the customer’s pass, then confirm collection.')}</p></div></div><div className="ops-split"><Orders orders={orders} /><section className="ops-panel ops-pickup-panel"><h2>{t('ops.pickups.panel', 'At the counter')}</h2><p>{t('ops.pickups.panel.body', 'Ask the customer for the six-character code on their pickup pass.')}</p>{pickupError && <p className="ops-error" role="alert">{pickupError}</p>}{pickupSuccess && <p className="ops-success" role="status">{pickupSuccess}</p>}<form className="ops-pickup-form" onSubmit={collectOrder}><label className="ops-field">{t('ops.pickups.code', 'Pickup code')}<input className="ops-code-input" required value={pickupCode} onChange={event => { setPickupCode(event.target.value); setPickupSuccess(''); setPickupError(''); }} autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={6} placeholder="e.g. AB3D7K" /></label><button className="ops-button" type="submit">{t('ops.pickups.confirm', 'Confirm pickup')}</button></form></section></div></section>}

      {isAdmin && tab === 'Overview' && <Overview orders={orders} readyOrders={readyOrders} collectedOrders={collectedOrders} />}
      {isAdmin && tab === 'Shops' && <section aria-label={t('ops.shops.label', 'Contracted shops')}>
        {place && <div className="ops-panel ops-map-panel"><h2>{t('ops.shops.map', 'The network, from the city centre')}</h2><MiniMap centre={place} shops={merchants} /></div>}
        <div className="ops-merchants">{merchants.map(merchant => <article className="ops-merchant-card" key={merchant.id}>
          <h3>{shopName(merchant)}</h3>
          <p className="ops-merchant-kind">{shopKind(merchant)} · {districtLabel(merchant.district)}</p>
          <p>{shopAddress(merchant)}</p>
          <dl>
            <dt>{t('ops.shops.distance', 'From the reader')}</dt><dd>{distances[merchant.id] === undefined ? '—' : formatDistance(distances[merchant.id])}</dd>
            <dt>{t('ops.shops.offers', 'Available offers')}</dt><dd>{state.offers.filter(offer => offer.merchantId === merchant.id && offer.active && offer.quantity > 0).length}</dd>
            <dt>{t('ops.shops.awaiting', 'Orders awaiting pickup')}</dt><dd>{state.orders.filter(order => order.merchantId === merchant.id && order.status === 'ready').length}</dd>
            <dt>{t('ops.shops.completed', 'Completed pickups')}</dt><dd>{state.orders.filter(order => order.merchantId === merchant.id && order.status === 'collected').length}</dd>
          </dl>
        </article>)}</div>
      </section>}
      {isAdmin && tab === 'Offers' && <section aria-label={t('ops.offers.all', 'All offers')}>
        <div className="ops-section-heading"><div><h2>{t('ops.offers.all.heading', 'Every shop’s counter')}</h2><p>{t('ops.offers.all.count', '{count} listings across {shops} shops.', { count: state.offers.length, shops: merchants.length })}</p></div>
          <label className="ops-field ops-shop-picker">{t('ops.offers.filter', 'Show')}<select value={shopFilter} onChange={event => setShopFilter(event.target.value)}><option value="all">{t('ops.offers.filter.all', 'Every shop')}</option>{merchants.map(merchant => <option key={merchant.id} value={merchant.id}>{shopName(merchant)}</option>)}</select></label>
        </div>
        <OfferRows offers={shopFilter === 'all' ? offers : offers.filter(offer => offer.merchantId === shopFilter)} minutes={minutes} showMerchant />
      </section>}
      {isAdmin && tab === 'Orders' && <section aria-label={t('ops.orders.all', 'All orders')}><div className="ops-section-heading"><h2>{t('ops.orders.all.heading', 'From checkout to collection')}</h2></div><Orders orders={orders} showMerchant /></section>}
      {isAdmin && tab === 'People' && <section className="ops-panel"><h2>{t('ops.people.title', 'People in this preview')}</h2><p>{t('ops.people.body', 'This preview has no registered users. The customer, shop and operations views let you try each side of Monty.')}</p><ul className="ops-admin-list"><li><span>{t('ops.people.customer', 'Customer view')}</span><strong>{t('ops.people.customer.value', 'One local demo')}</strong></li><li><span>{t('ops.people.shops', 'Shop views')}</span><strong>{t('ops.people.shops.value', '{count} contracted shops', { count: merchants.length })}</strong></li><li><span>{t('ops.people.admin', 'Operations view')}</span><strong>{t('ops.people.admin.value', 'This workspace')}</strong></li></ul></section>}
      <p className="ops-footnote">{t('ops.footnote', 'All shops, listings and orders shown here are demo examples. Switching roles is for previewing the design.')}</p>
    </div>
  </div>;
}
