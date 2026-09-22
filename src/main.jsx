import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {merchants, createDemoState, totals, addToCart, placeOrder, toggleSaved, expireOrders, rateOrder, shopRating, startNewDay, offerState, isBuyable, STATE_VERSION} from './model.mjs';
import {DISTRICTS} from './catalogue.mjs';
import {PLACES, RADII, DEFAULT_PLACE, DEFAULT_RADIUS, locate, permissionState, watchLocation, isInCity, metresBetween, formatDistance, walkMinutes, withinRadius, placeName} from './geo.mjs';
import {qrPath} from './qr.mjs';
import {money, date, t} from './i18n.js';
import {offerTitle, offerDescription, shopName, shopAddress, shopKind, shopPickupNote, allergenName, lineTitle} from './content.js';
import {initPreferences, applyTheme, applyLocale, savePreferences, watchSystemTheme} from './preferences.js';
import Operations from './Operations.jsx';
import Wordmark from './Wordmark.jsx';
import Icon from './components/Icon.jsx';
import Pet from './components/Pets.jsx';
import TalkingPet from './components/TalkingPet.jsx';
import MiniMap from './components/MiniMap.jsx';
import {PETS, petName, petTrait} from './pets.js';
import {FoodPhoto, Modal, Stepper, ThemeControl, LanguageControl} from './components/Controls.jsx';
import {isDrawing} from './photos.js';
import {nowMinutes, formatTime, subscribe as subscribeClock, windowState} from './clock.mjs';
import Payment from './components/Payment.jsx';
import Countdown, {windowLabel} from './components/Countdown.jsx';
import {ShopRating, RateOrder} from './components/Rating.jsx';
import {transition, useDiscoveryMotion, useRailScroll} from './hooks/motion.js';
import './fonts.css';
import './tokens.css';
import './styles.css';
import './location.css';
import './lifecycle.css';
import './operations.css';

const shopFor = id => merchants.find(shop => shop.id === id);
const savingsPercent = offer => Math.round((1 - offer.price / offer.originalPrice) * 100);
const orderDate = order => date(order.createdAt);

/* The ids are the values stored in state and compared against model data, so
   they stay English while only the label travels between languages. */
const categories = [
  {id: 'All food', icon: 'discover', key: 'category.all', en: 'All food'},
  {id: 'Bakery', icon: 'bread', key: 'category.bakery', en: 'Bakery'},
  {id: 'Meals', icon: 'meal', key: 'category.meals', en: 'Meals'},
  {id: 'Sweet', icon: 'sweet', key: 'category.sweet', en: 'Sweet'},
  {id: 'Drinks', icon: 'cup', key: 'category.drinks', en: 'Drinks'},
  {id: 'Grocery', icon: 'basket', key: 'category.grocery', en: 'Grocery'},
];
const sorts = [
  {id: 'Nearby', key: 'sort.nearby', en: 'Nearby'},
  {id: 'Lowest price', key: 'sort.price', en: 'Lowest price'},
  {id: 'Biggest savings', key: 'sort.savings', en: 'Biggest savings'},
  {id: 'Ending soonest', key: 'sort.ending', en: 'Ending soonest'},
];
const labelFor = (list, id) => {
  const entry = list.find(item => item.id === id);
  return entry ? t(entry.key, entry.en) : id;
};

/* A hundred and twenty listings is a real catalogue and a slow first paint if
   every one of them mounts at once, so the list grows a page at a time. */
const PAGE = 12;

/* Nearest first, by shop rather than by item.

   Sorting a hundred and twenty listings on their shop's distance puts twenty
   cards from the nearest bakery at the top and hides the other five shops
   below a fold nobody reaches. Taking one item from each shop in turn keeps
   the nearest shop's best find in first place and still shows a reader what
   the city has, which is the question the discover screen is answering.
   Within a shop the biggest saving leads, because that is what a reader is
   scrolling a discount marketplace for. */
function nearbyOrder(offers, distanceTo) {
  const byShop = new Map();
  for (const offer of offers) {
    if (!byShop.has(offer.merchantId)) byShop.set(offer.merchantId, []);
    byShop.get(offer.merchantId).push(offer);
  }
  const queues = [...byShop.entries()]
    .sort(([a], [b]) => distanceTo(a) - distanceTo(b))
    .map(([, items]) => items.sort((a, b) => savingsPercent(b) - savingsPercent(a) || b.quantity - a.quantity));
  const ordered = [];
  for (let round = 0; ordered.length < offers.length; round += 1) {
    for (const queue of queues) if (queue[round]) ordered.push(queue[round]);
  }
  return ordered;
}

/* The clock has to reach the render tree, and every countdown on screen has
   to move together. One subscription at the top, one re-render, rather than a
   timer per card. */
function useClock() {
  const [minutes, setMinutes] = useState(nowMinutes);
  useEffect(() => subscribeClock(() => setMinutes(nowMinutes())), []);
  return [minutes, setMinutes];
}

const preferences = initPreferences();

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem('monty-demo-v3'));
    if (saved?.version === STATE_VERSION && Array.isArray(saved.offers) && Array.isArray(saved.orders) && Array.isArray(saved.saved)
      && saved.offers.every(offer => shopFor(offer.merchantId) && Array.isArray(offer.allergens))
      && saved.orders.every(order => shopFor(order.merchantId) && Array.isArray(order.items))) return saved;
  } catch { /* Storage may be unavailable in a local file or private window. */ }
  return createDemoState();
}

function SaveButton({offer, saved, onSave}) {
  const title = offerTitle(offer);
  return <button className={`heart-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? t('offer.unsave', 'Unsave {title}', {title}) : t('offer.save', 'Save {title}', {title})} aria-pressed={saved} onClick={() => onSave(offer.id)}><Icon name="heart" size={21}/></button>;
}

function OfferCard({offer, featured, saved, distance, minutes, rating, onSave, onOpen}) {
  const shop = shopFor(offer.merchantId);
  const state = offerState(offer, minutes);
  const available = state === 'available';
  const title = offerTitle(offer);
  return <article className={`offer-card ${featured ? 'featured' : 'compact'} ${available ? '' : 'unavailable'}`}>
    <div className="offer-photo">
      <button className="photo-button" onClick={() => onOpen(offer)} aria-label={t('offer.view', 'View {title}', {title})}>
        <FoodPhoto src={offer.image} alt={title} loading={featured ? 'eager' : 'lazy'} fetchPriority={featured ? 'high' : 'auto'} style={{viewTransitionName: `food-${offer.id}`}}/>
      </button>
      {featured && <span className="discount-ticket"><strong>{savingsPercent(offer)}%</strong><span>{t('offer.discount.featured', 'less, just as lovely')}</span></span>}
      <SaveButton offer={offer} saved={saved} onSave={onSave}/>
    </div>
    <button className="offer-info" onClick={() => onOpen(offer)} aria-label={`${title}, ${money(offer.price)}, ${shopName(shop)}`}>
      <div className="shop-line"><span>{shopName(shop)}</span><span>{formatDistance(distance)}</span></div>
      <ShopRating rating={rating} compact/>
      <h3>{title}</h3>
      <div className="offer-prices"><strong>{money(offer.price)}</strong><s>{money(offer.originalPrice)}</s>{!featured && <span className="saving-label">−{savingsPercent(offer)}%</span>}</div>
      <div className="offer-bottom"><Countdown offer={offer} minutes={minutes}/><span className={`stock-label ${offer.quantity <= 3 ? 'low' : ''}`}>{state === 'closed' ? t('offer.closed', 'Too late today') : state === 'paused' ? t('offer.paused', 'Paused') : state === 'soldout' ? t('offer.unavailable', 'Unavailable') : t('offer.left', '{count} left', {count: offer.quantity})}</span></div>
    </button>
  </article>;
}

function PageHeader({title, onBack}) {
  return <header className="page-header"><button className="icon-button" aria-label={t('bag.back', 'Go back')} onClick={onBack}><Icon name="back"/></button><h2>{title}</h2><span/></header>;
}

function Empty({title, description, action, onClick, pet}) {
  return <div className="empty-state"><TalkingPet pet={pet} mood="empty" size={136} placement="above"/><h2>{title}</h2><p>{description}</p><button className="primary-button" onClick={onClick}>{action || t('empty.action', 'Explore today’s food')}<Icon name="arrow" size={18}/></button></div>;
}

/* One shop, as a card: the thing that was missing when there were three shops
   and is unavoidable now that there are six. */
function ShopChip({shop, metres, count, chosen, onClick}) {
  return <button type="button" className={`shop-chip ${chosen ? 'chosen' : ''}`} aria-pressed={chosen} onClick={onClick}>
    <span className="shop-chip-mark"><Icon name="shop" size={19}/></span>
    <span className="shop-chip-body">
      <strong>{shopName(shop)}</strong>
      <small>{formatDistance(metres)} · {t('shop.walk', '{minutes} min walk', {minutes: walkMinutes(metres)})}</small>
      <small>{t('shop.finds', '{count} finds', {count})}</small>
    </span>
  </button>;
}

/* initialTab only exists so the render check can reach the screens behind the
   bottom nav. The profile shipped blank once because nothing but Discover was
   ever rendered outside a browser. */
function App({initialTab = 'discover', initialModal = null} = {}) {
  const [state, setState] = useState(readState);
  const [theme, setTheme] = useState(preferences.theme);
  const [locale, setLocaleState] = useState(preferences.locale);
  const [pet, setPet] = useState(preferences.pet);
  const [role, setRole] = useState('customer');
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(null);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All food');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Nearby');
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [district, setDistrict] = useState('all');
  const [shopFilter, setShopFilter] = useState(null);
  const [locating, setLocating] = useState(false);
  const [following, setFollowing] = useState(false);
  const [fixReason, setFixReason] = useState(null);
  const [mapShop, setMapShop] = useState(null);
  const [visible, setVisible] = useState(PAGE);
  const [modal, setModal] = useState(initialModal);
  const [toast, setToast] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [pickupFilter, setPickupFilter] = useState('ready');
  const [minutes] = useClock();
  const scroll = useRef(null);
  const saveTimer = useRef(null);
  const shopRail = useRef(null);
  const categoryRail = useRef(null);
  const toastTimer = useRef(null);
  const alive = useRef(true);
  const checkoutLock = useRef(false);
  const discover = role === 'customer' && !page && tab === 'discover';
  useDiscoveryMotion(scroll, discover);
  // Both rails only exist on the discover screen, so the handlers attach when
  // it mounts and let go when it does not.
  useRailScroll(shopRail, discover);
  useRailScroll(categoryRail, discover);

  /* Thirty-eight kilobytes of JSON on every heart tap is work nobody asked
     for. A short debounce collapses a burst of changes into one write, and
     the unmount flush means the last one is never the one that is lost. */
  useEffect(() => {
    clearTimeout(saveTimer.current);
    const write = () => { try { localStorage.setItem('monty-demo-v3', JSON.stringify(state)); } catch {} };
    saveTimer.current = setTimeout(write, 400);
    return () => clearTimeout(saveTimer.current);
  }, [state]);
  // The flush has to see the newest state, not the one this effect closed over
  // on the first render, or leaving writes the opening demo back over the day.
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => () => { try { localStorage.setItem('monty-demo-v3', JSON.stringify(latest.current)); } catch {} }, []);

  /* A paid order nobody collected has to become something. Sweeping on the
     clock rather than on read keeps the customer's list and the merchant's
     list telling the same story. */
  useEffect(() => { setState(current => expireOrders(current, minutes)); }, [minutes]);
  useEffect(() => { scroll.current?.scrollTo({top: 0, behavior: 'instant'}); }, [page, tab, role]);
  useEffect(() => () => { clearTimeout(toastTimer.current); alive.current = false; }, []);
  // On 'system' the resolved background changes under us, so theme-color needs
  // recomputing when the device flips, not only when the reader picks.
  useEffect(() => (theme === 'system' ? watchSystemTheme(() => applyTheme('system')) : undefined), [theme]);
  // Narrowing the search and keeping page four of the old results is nobody's
  // idea of a filter.
  useEffect(() => { setVisible(PAGE); }, [category, query, sort, district, radius, shopFilter, place.id]);

  // Each of these writes the whole record, so picking one preference must not
  // drop the other two.
  function chooseTheme(next) {
    setTheme(next);
    applyTheme(next);
    savePreferences({theme: next, locale, pet});
  }
  function chooseLanguage(next) {
    setLocaleState(next);
    applyLocale(next);
    savePreferences({theme, locale: next, pet});
    // Copy already on screen was built in the previous language.
    setToast('');
  }
  function choosePet(next) {
    setPet(next);
    savePreferences({theme, locale, pet: next});
    notify(t('toast.pet', '{name} is coming along with you.', {name: petName(next)}));
  }

  function notify(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }
  function navigate(next) { transition(() => { setTab(next); setPage(null); setQuery(''); }); }
  function openOffer(offer) { transition(() => { setQty(1); setPage({type: 'offer', id: offer.id}); }); }
  function openPass(code) { transition(() => { setOrderCode(code); setPage({type: 'pass'}); }); }
  function openBag() { transition(() => setPage({type: 'bag'})); }
  function save(id) { setState(current => toggleSaved(current, id)); }

  /* One place where a fix becomes the screen, so a position arriving on load,
     a position arriving from the watcher and a position the reader asked for
     all land the same way. */
  function applyFix(fix, announce) {
    setPlace(fix);
    setFixReason(fix.reason ?? null);
    setDistrict('all');
    setMapShop(null);
    /* A true fix outside Ulaanbaatar is thousands of kilometres from every
       shop in the catalogue, and the default 5 km radius would leave a blank
       screen with no way to guess why. Opening the radius keeps the city
       visible and still sorts it nearest-first, which is the honest reading of
       "nearby" from somewhere that has no nearby. */
    if (!fix.simulated && !isInCity(fix)) setRadius(0);
    if (!announce) return;
    if (fix.simulated) notify(t('toast.located.demo', 'No location from your browser, so Monty is standing near {place}.', {place: t('place.square', 'Sükhbaatar Square')}));
    else notify(t('toast.located', 'Found you. Distances are updated.'));
  }

  async function findMe(announce = true) {
    if (locating) return;
    setLocating(true);
    const fix = await locate();
    if (!alive.current) return;
    setLocating(false);
    applyFix(fix, announce);
    // Only a real fix is worth watching; a simulated one never moves.
    setFollowing(!fix.simulated);
  }

  /* Location follows the device the way the clock follows it. A permission
     already granted needs no button, so the fix arrives on load and the reader
     simply sees real distances. A permission not yet granted is left alone:
     browsers want a gesture before the prompt, and a prototype that throws a
     location dialog at someone the moment they open it has earned the refusal
     it gets. */
  useEffect(() => {
    let live = true;
    permissionState().then(state => { if (live && state === 'granted') findMe(false); });
    return () => { live = false; };
  }, []);

  // While following, the reader walking is enough to update every distance.
  useEffect(() => {
    if (!following) return undefined;
    return watchLocation(fix => { if (alive.current) applyFix(fix, false); });
  }, [following]);

  function choosePlace(next) {
    // Standing somewhere by hand is a decision; stop overwriting it.
    setFollowing(false);
    setFixReason(null);
    setPlace(next);
    setDistrict('all');
    setMapShop(null);
    notify(t('toast.place', 'Standing at {place}. Distances are updated.', {place: placeName(next)}));
  }

  function browseShop(id) {
    setShopFilter(id);
    setCategory('All food');
    setQuery('');
    setModal(null);
    transition(() => { setPage(null); setTab('discover'); });
  }

  function add(offer, replace = false) {
    try {
      const next = addToCart(state, replace ? [] : cart, offer.id, qty);
      setCart(next);
      setModal(null);
      transition(() => setPage({type: 'bag'}));
      notify(t('bag.added', '{count} × {title} added to your bag.', {count: qty, title: offerTitle(offer)}));
    } catch (error) {
      if (cart.length && state.offers.find(item => item.id === cart[0].offerId)?.merchantId !== offer.merchantId) setModal('switch-shop');
      else notify(error.message);
    }
  }
  function updateCart(id, quantity) {
    if (quantity <= 0) { setCart(cart.filter(item => item.offerId !== id)); return; }
    const offer = state.offers.find(item => item.id === id);
    if (quantity > offer.quantity) { notify(t('bag.error.stock', 'Only {count} available.', {count: offer.quantity})); return; }
    setCart(cart.map(item => item.offerId === id ? {...item, quantity} : item));
  }
  /* Payment first, order second. The old flow created the order and called
     it paid in the same breath, which is the one thing a real integration can
     never do: the money moves somewhere else, and this screen only finds out
     afterwards. See payments.mjs. */
  function checkout(payment) {
    if (checkoutLock.current) return;
    checkoutLock.current = true;
    setBusy(true);
    try {
      const result = placeOrder(state, cart, payment);
      setState(result.state);
      setCart([]);
      setOrderCode(result.order.code);
      setPickupFilter('ready');
      transition(() => { setPage({type: 'pass'}); setTab('pickups'); });
      notify(t('toast.order', 'Paid. Your pickup pass is ready.'));
    } catch (error) { notify(error.message); setPage({type: 'bag'}); }
    finally { checkoutLock.current = false; setBusy(false); }
  }

  function rate(orderId, score) {
    try { setState(current => rateOrder(current, orderId, score)); notify(t('toast.rated', 'Thank you. Your rating helps the next neighbour.')); }
    catch (error) { notify(error.message); }
  }

  function newDay() {
    setState(current => startNewDay(current, minutes));
    notify(t('toast.newday', 'A new day. Recurring items are back on the counter.'));
  }

  /* Distance is read once per shop per position rather than per card, because
     with six shops and a hundred and twenty cards the alternative is a hundred
     and twenty haversines on every keystroke in the search field. */
  const distances = useMemo(() => Object.fromEntries(merchants.map(shop => [shop.id, metresBetween(place, shop)])), [place]);
  const distanceTo = id => distances[id] ?? 0;

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const ratings = useMemo(() => Object.fromEntries(merchants.map(shop => [shop.id, shopRating(state, shop.id)])), [state]);
  const active = state.offers.filter(offer => isBuyable(offer, minutes));
  const inRange = active.filter(offer => {
    const shop = shopFor(offer.merchantId);
    return withinRadius(distanceTo(shop.id), radius) && (district === 'all' || shop.district === district);
  });
  const filtered = inRange.filter(offer => (category === 'All food' || category === offer.category)
    && (!shopFilter || offer.merchantId === shopFilter)
    && (!query || [offerTitle(offer), offer.title, shopName(shopFor(offer.merchantId)), offerDescription(offer)].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
  if (sort === 'Lowest price') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'Biggest savings') filtered.sort((a, b) => savingsPercent(b) - savingsPercent(a));
  if (sort === 'Ending soonest') filtered.sort((a, b) => a.pickupEnd.localeCompare(b.pickupEnd) || distanceTo(a.merchantId) - distanceTo(b.merchantId));
  // Whatever is already inside its last forty-five minutes goes to the top of
  // 'Nearby' too, because that is the food actually about to be thrown away.
  if (sort === 'Nearby') filtered.sort((a, b) => Number(windowState(b.pickupStart, b.pickupEnd, minutes) === 'closing') - Number(windowState(a.pickupStart, a.pickupEnd, minutes) === 'closing'));
  const ordered = sort === 'Nearby' ? nearbyOrder(filtered, distanceTo) : filtered;
  const shown = ordered.slice(0, visible);

  const nearbyShops = merchants
    .filter(shop => withinRadius(distanceTo(shop.id), radius) && (district === 'all' || shop.district === district))
    .map(shop => ({shop, metres: distanceTo(shop.id), count: inRange.filter(offer => offer.merchantId === shop.id).length}))
    .sort((a, b) => a.metres - b.metres);

  const offer = page?.type === 'offer' ? state.offers.find(item => item.id === page.id) : null;
  const available = offer ? offer.quantity - (cart.find(item => item.offerId === offer.id)?.quantity || 0) : 0;
  const order = state.orders.find(item => item.code === orderCode);
  const readyOrders = state.orders.filter(item => item.status === 'ready');
  const card = (item, featured = false) => <OfferCard key={item.id} offer={item} featured={featured} minutes={minutes} rating={ratings[item.merchantId]} distance={distanceTo(item.merchantId)} saved={state.saved.includes(item.id)} onSave={save} onOpen={openOffer}/>;
  const goDiscover = () => { setShopFilter(null); navigate('discover'); };
  const clearFilters = () => { setQuery(''); setCategory('All food'); setDistrict('all'); setShopFilter(null); setRadius(0); };
  const filterShop = shopFilter ? shopFor(shopFilter) : null;

  function renderHome() {
    return <>
      <section className="bakery-banner" aria-labelledby="discovery-title">
        <div className="awning" aria-hidden="true">{Array.from({length: 10}, (_, index) => <i key={index}/>)}</div>
        <div className="bakery-message"><div><span className="hero-kicker">{t('home.kicker', 'Good evening, neighbor')}</span><h1 id="discovery-title">{t('home.title.line1', 'A little good.')}<br/>{t('home.title.line2', 'Close to home.')}</h1><p>{t('home.subtitle', 'Today’s food. A sweeter price.')}</p></div><div className="hero-mascot"><TalkingPet pet={pet} size={150}/></div></div>
        <div className="bakery-sign"><Icon name="leaf" size={15}/><span>{t('home.sign', 'Made with care. Too good to spare.')}</span></div>
      </section>
      <div className="discover-controls">
        <div className="search-field"><Icon name="search" size={21}/><input type="search" aria-label={t('home.search.label', 'Search food or shops')} placeholder={t('home.search.placeholder', 'A croissant? A little kimbap?')} value={query} onChange={event => setQuery(event.target.value)}/><button aria-label={t('home.filter', 'Filter and sort offers')} className={`filter-button ${sort !== 'Nearby' ? 'has-filter' : ''}`} onClick={() => setModal('filters')}><Icon name="sliders" size={20}/></button></div>
        <div className="category-rail is-rail" ref={categoryRail} role="group" aria-label={t('home.categories', 'Food categories')}>{categories.map(entry => <button key={entry.id} className={`category ${category === entry.id ? 'active' : ''}`} aria-pressed={category === entry.id} onClick={() => setCategory(entry.id)}><Icon name={entry.icon} size={23}/><span>{t(entry.key, entry.en)}</span></button>)}</div>
      </div>

      <section className="shop-rail-section" aria-labelledby="shops-near-you">
        <div className="section-heading"><div><h2 id="shops-near-you">{t('home.shops.title', 'Shops near you')}</h2><p>{t('home.shops.subtitle', '{count} contracted shops around the city.', {count: merchants.length})}</p></div><button className="text-button" onClick={() => setModal('location')}><Icon name="pin" size={15}/>{t('home.shops.map', 'Map')}</button></div>
        <div className="shop-rail is-rail" ref={shopRail} role="group" aria-label={t('home.shops.title', 'Shops near you')}>
          <button type="button" className={`shop-chip all ${shopFilter ? '' : 'chosen'}`} aria-pressed={!shopFilter} onClick={() => setShopFilter(null)}>
            <span className="shop-chip-mark"><Icon name="discover" size={19}/></span>
            <span className="shop-chip-body"><strong>{t('home.shops.all', 'All shops')}</strong><small>{t('shop.finds', '{count} finds', {count: inRange.length})}</small></span>
          </button>
          {nearbyShops.map(({shop, metres, count: finds}) => <ShopChip key={shop.id} shop={shop} metres={metres} count={finds} chosen={shopFilter === shop.id} onClick={() => setShopFilter(shopFilter === shop.id ? null : shop.id)}/>)}
        </div>
      </section>

      <div className="section-heading"><div><h2>{query ? t('home.results.search', 'Your little finds') : filterShop ? shopName(filterShop) : category === 'All food' ? t('home.results.all', 'Fresh finds nearby') : t('home.results.category', '{category} nearby', {category: labelFor(categories, category)})}</h2><p>{filterShop ? shopKind(filterShop) : t('home.results.subtitle', 'Pick up a little happiness today.')}</p></div><span>{t('home.results.count', '{count} finds', {count: ordered.length})}</span></div>
      {filterShop && <button className="active-filter" onClick={() => setShopFilter(null)}>{t('home.shops.only', 'Only {shop}', {shop: shopName(filterShop)})}<Icon name="close" size={15}/></button>}
      <div className="offers-list">{shown.length ? shown.map((item, index) => card(item, index === 0)) : <Empty pet={pet} title={t('home.empty.title', 'Still looking for your little good?')} description={t('home.empty.body', 'Try another food, widen how far you will walk, or look across the whole city.')} action={t('home.empty.action', 'Show all food')} onClick={clearFilters}/>}</div>
      {shown.length < ordered.length && <button className="show-more" onClick={() => setVisible(current => current + PAGE)}>{t('home.more', 'Show more finds')}<small>{t('home.showing', '{shown} of {total} shown', {shown: shown.length, total: ordered.length})}</small></button>}
      <div className="end-note"><Icon name="leaf" size={20}/><p>{t('home.endnote', 'A good day for less food waste.')}</p><span>{t('home.endnote.small', 'Sample shops, photos & pickup times')}</span></div>
    </>;
  }

  function renderOffer() {
    const shop = shopFor(offer.merchantId);
    const title = offerTitle(offer);
    const metres = distanceTo(shop.id);
    return <>
      <div className="detail-photo"><FoodPhoto src={offer.image} alt={title} style={{viewTransitionName: `food-${offer.id}`}}/><div className="detail-photo-actions"><button className="round-button" aria-label={t('offer.back', 'Back to food')} onClick={() => transition(() => setPage(null))}><Icon name="back"/></button><SaveButton offer={offer} saved={state.saved.includes(offer.id)} onSave={save}/></div><span className="detail-discount">{t('offer.discount.detail', 'A lovely {percent}% less', {percent: savingsPercent(offer)})}</span></div>
      <div className="detail-copy"><div className="shop-line"><span><Icon name="shop" size={16}/>{shopName(shop)}</span><span>{t('offer.away', '{distance} away', {distance: formatDistance(metres)})}</span></div><h1>{title}</h1><div className="detail-price"><strong>{money(offer.price)}</strong><s>{money(offer.originalPrice)}</s><span>{offer.category === 'Meals' ? t('offer.per.roll', 'per roll') : t('offer.per.item', 'per item')}</span></div>
        <div className={`pickup-window is-${windowLabel(offer, minutes).state}`}><span className="icon-tile"><Icon name="clock" size={24}/></span><div><strong>{windowLabel(offer, minutes).text}</strong><span>{t('offer.pickup.window', 'Pickup window {start}–{end}', {start: offer.pickupStart, end: offer.pickupEnd})}</span></div><span className="stock-badge">{offer.active ? t('offer.left', '{count} left', {count: offer.quantity}) : t('offer.paused', 'Paused')}</span></div>
        <h2>{t('offer.description.title', 'Made today, with love')}</h2><p>{offerDescription(offer)}</p>
        <div className="allergens"><strong>{t('offer.allergens', 'Allergens')}</strong><span>{offer.allergens.length ? offer.allergens.map(allergenName).join(' · ') : t('offer.allergens.none', 'Ask the shop before ordering')}</span></div>
        <div className="shop-address"><Icon name="pin"/><div><strong>{shopName(shop)}</strong><ShopRating rating={ratings[shop.id]}/><p>{shopAddress(shop)}</p><small>{shopPickupNote(shop)}</small></div></div>
        <p className="trust-line"><Icon name="leaf" size={17}/><span>{t('trust.rescued', '{count} meals rescued from this shop so far.', {count: ratings[shop.id]?.rescued ?? 0})}</span></p>
        <div className="detail-map">
          <MiniMap centre={place} shops={[shop]} selected={shop.id} accuracy={place.accuracy || 0} compact/>
          <p className="detail-walk"><Icon name="walk" size={18}/><span>{t('offer.walk', '{distance} from {place} · about {minutes} minutes on foot', {distance: formatDistance(metres), place: placeName(place), minutes: walkMinutes(metres)})}</span></p>
        </div>
        <p className="gentle-note"><Icon name="leaf" size={18}/><span>{t('offer.gentle', 'Same good food. A little less waste.')}<br/>{isDrawing(offer.image) ? t('offer.gentle.drawing', 'Drawing, not a photograph: this shop has not sent one yet.') : t('offer.gentle.photo', 'Photo is illustrative for this demo.')}</span></p>
        {(!isBuyable(offer, minutes) || available <= 0) && <p className="inline-warning">{!offer.active ? t('offer.warning.paused', 'This item is currently paused.') : offerState(offer, minutes) === 'closed' ? t('offer.warning.closed', 'Today’s pickup window has closed. This one is back tomorrow.') : t('offer.warning.none', 'No more available. Check your bag or choose another find.')}</p>}
      </div>
    </>;
  }

  function bagData() {
    const rows = cart.map(line => ({...line, offer: state.offers.find(item => item.id === line.offerId)})).filter(row => row.offer);
    let summary, error;
    try { summary = totals(state, cart); } catch (issue) { error = issue.message; }
    const start = rows.reduce((time, row) => row.offer.pickupStart > time ? row.offer.pickupStart : time, '00:00');
    const end = rows.reduce((time, row) => row.offer.pickupEnd < time ? row.offer.pickupEnd : time, '23:59');
    if (start >= end) error = t('bag.error.times', 'These items have different pickup times. Please order them separately.');
    return {rows, summary, error, start, end, shop: shopFor(rows[0]?.offer.merchantId)};
  }

  function renderBag(isCheckout = false) {
    const back = () => transition(() => setPage(isCheckout ? {type: 'bag'} : null));
    if (!cart.length) return <><PageHeader title={t('bag.title', 'Your bag')} onBack={back}/><Empty pet={pet} title={t('bag.empty.title', 'Room for something lovely')} description={t('bag.empty.body', 'Find a warm loaf or tonight’s dinner from a shop nearby.')} onClick={goDiscover}/></>;
    const {rows, summary, error, start, end, shop} = bagData();
    return <><PageHeader title={isCheckout ? t('bag.title.checkout', 'Demo checkout') : t('bag.title.full', 'Your little bag')} onBack={back}/><div className="bag-content">
      <div className="bag-shop"><span className="icon-tile"><Icon name="shop" size={25}/></span><div><h1>{shopName(shop)}</h1><p>{t('bag.shop.note', 'One shop. One happy pickup.')}</p></div></div>
      {!isCheckout ? rows.map(({offer: item, quantity}) => <article className="bag-item" key={item.id}><FoodPhoto src={item.image} alt={offerTitle(item)}/><div><h3>{offerTitle(item)}</h3><strong>{money(item.price * quantity)}</strong><div className="bag-item-controls"><Stepper value={quantity} max={item.quantity} label={offerTitle(item)} onChange={next => updateCart(item.id, next)}/><button className="text-button" onClick={() => updateCart(item.id, 0)}>{t('bag.remove', 'Remove')}</button></div></div></article>) : <div className="checkout-items">{rows.map(({offer: item, quantity}) => <p key={item.id}><span>{quantity} × {offerTitle(item)}</span><strong>{money(item.price * quantity)}</strong></p>)}</div>}
      {!isCheckout && <button className="add-more" onClick={() => browseShop(shop.id)}><Icon name="plus" size={18}/>{t('bag.addmore', 'Add something from {shop}', {shop: shopName(shop)})}</button>}
      <div className="pickup-window"><Icon name="clock"/><div><strong>{t('bag.pickup', 'Pickup today, {start}–{end}', {start, end})}</strong><span>{shop ? shopAddress(shop) : ''}</span></div></div>
      {error && <p role="alert" className="inline-warning">{error}</p>}
      {summary && <><div className="receipt-summary"><div><span>{t('bag.summary.usual', 'Usual price')}</span><s>{money(summary.originalTotal)}</s></div><div className="saving-line"><span>{t('bag.summary.saving', 'You’re saving')}</span><strong>−{money(summary.savings)}</strong></div><div className="total-line"><strong>{t('bag.summary.total', 'Total')}</strong><strong>{money(summary.total)}</strong></div></div>
        {isCheckout ? <>{error || busy
          ? <p className="checkout-note">{busy ? t('bag.checkout.busy', 'Preparing your pass…') : error}</p>
          : <Payment
            amount={summary.total}
            description={t('bag.payment.description', 'Monty pickup from {shop}', {shop: shopName(shop)})}
            reference={`${shop?.id ?? 'shop'}-${summary.total}-${rows.length}`}
            onPaid={checkout}
            onCancel={() => transition(() => setPage({type: 'bag'}))}
          />}</> : <><p className="checkout-note">{t('bag.continue.note', 'Pay first, then collect with your pickup pass.\nThis preview settles a demo invoice, so no money moves.').split('\n').map((line, index) => <React.Fragment key={index}>{index ? <br/> : null}{line}</React.Fragment>)}</p><button className="primary-button full" disabled={!!error} onClick={() => transition(() => setPage({type: 'checkout'}))}>{t('bag.continue', 'Continue to payment')}<Icon name="arrow" size={19}/></button></>}
      </>}
      <p className="small-note">{t('bag.footnote', 'Demo shop · no real purchase is made')}</p>
    </div></>;
  }

  function renderPass() {
    if (!order) return <Empty pet={pet} title={t('pass.empty.title', 'Your pass will be here')} description={t('pass.empty.body', 'Choose something lovely to get your pickup pass.')} onClick={goDiscover}/>;
    const shop = shopFor(order.merchantId);
    const qr = qrPath(order.code);
    const collected = order.status === 'collected';
    return <><PageHeader title={t('pass.title', 'Your pickup pass')} onBack={() => navigate('pickups')}/><div className="pass-intro"><TalkingPet pet={pet} mood="success" size={88}/><div><h1>{collected ? t('pass.hero.collected', 'A happy ending.') : t('pass.hero.ready', 'A little good, all yours.')}</h1><p>{collected ? t('pass.hero.collected.body', 'Thanks for giving good food a home.') : t('pass.hero.ready.body', 'Just bring your pass and your appetite.')}</p></div></div>
      <article className={`pickup-pass ${collected ? 'is-collected' : ''} ${order.status === 'expired' ? 'is-expired' : ''}`}><div className="pass-heading"><Wordmark small/><span><Icon name="check" size={14}/>{collected ? t('pass.status.collected', 'Collected') : order.status === 'expired' ? t('pass.status.expired', 'Expired') : t('pass.status.ready', 'Ready for pickup')}</span></div><div className="pass-shop"><h2>{shopName(shop)}</h2><p>{orderDate(order)} · {order.pickupStart}–{order.pickupEnd}</p>{order.status === 'ready' && <Countdown offer={order} minutes={minutes}/>}</div>
        <div className="qr-wrap"><svg role="img" aria-label={t('pass.qr', 'Pickup QR code {code}', {code: order.code})} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#352638"/></svg>{collected && <span className="collected-stamp">{t('pass.stamp', 'Collected')} <Icon name="check" size={18}/></span>}</div>
        <div className="pass-code"><span>{t('pass.code', 'Or give the shop this code')}</span><strong>{order.code}</strong></div><div className="perforation"/>
        <div className="pass-items">{order.items.map(item => <div key={item.offerId}><span>{item.quantity} × {lineTitle(item)}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="pass-total"><span>{order.payment?.paidVia ? t('pass.paid.via', 'Paid · {bank}', {bank: order.payment.paidVia}) : t('pass.paid', 'Demo paid')}</span><strong>{money(order.total)}</strong></div></div><div className="pass-footer"><Icon name="leaf" size={16}/>{t('pass.saved', 'A good find. {amount} saved.', {amount: money(order.originalTotal - order.total)})}</div>
      </article><div className="pickup-instructions"><Icon name="pin" size={23}/><div><strong>{shopAddress(shop)}</strong><p>{t('pass.instructions', '{note} The shop verifies this code once.', {note: shopPickupNote(shop)})}</p></div></div>
      {collected && <div className="pass-rate"><RateOrder value={order.rating} onRate={score => rate(order.id, score)}/></div>}
      {order.status === 'expired' && <p className="inline-warning pass-expired" role="alert">{t('pass.expired', 'This pickup window closed before the order was collected. A live service would offer a refund or put it back on the counter here.')}</p>}
      <div className="pass-map"><MiniMap centre={place} shops={[shop]} selected={shop.id} accuracy={place.accuracy || 0} compact/><p className="detail-walk"><Icon name="walk" size={18}/><span>{t('offer.walk', '{distance} from {place} · about {minutes} minutes on foot', {distance: formatDistance(distanceTo(shop.id)), place: placeName(place), minutes: walkMinutes(distanceTo(shop.id))})}</span></p></div>
      <button className="secondary-button pass-browse" onClick={goDiscover}>{t('pass.browse', 'Back to the neighborhood')}</button><p className="small-note">{t('pass.footnote', 'Demo pass · not valid at a real shop')}</p></>;
  }

  function renderPickups() {
    const orders = state.orders.filter(item => pickupFilter === 'ready' ? item.status === 'ready' : item.status !== 'ready');
    return <div className="tab-content"><div className="tab-heading"><Icon name="ticket" size={30}/><h1>{t('pickups.title', 'Your pickups')}</h1><p>{t('pickups.subtitle', 'Good things with your name on them.')}</p></div><div className="segmented" aria-label={t('pickups.status', 'Order status')}>{[['ready', t('pickups.ready', 'Ready ({count})', {count: readyOrders.length})], ['history', t('pickups.history', 'History')]].map(([id, label]) => <button key={id} aria-pressed={pickupFilter === id} onClick={() => setPickupFilter(id)}>{label}</button>)}</div>
      {orders.length ? orders.map(item => <button className="order-card" key={item.id} onClick={() => openPass(item.code)}><div className="order-top"><span className={`status-tag ${item.status === 'collected' ? 'done' : ''} ${item.status === 'expired' ? 'missed' : ''}`}>{item.status === 'collected' ? t('pass.status.collected', 'Collected') : item.status === 'expired' ? t('pass.status.expired', 'Expired') : t('pass.status.ready', 'Ready for pickup')}</span><span>{orderDate(item)}</span></div><h2>{shopName(shopFor(item.merchantId))}</h2><p>{item.items.map(line => `${line.quantity} × ${lineTitle(line)}`).join(', ')}</p><div className="order-bottom">{item.status === 'ready' ? <Countdown offer={item} minutes={minutes}/> : <span><Icon name="clock" size={15}/>{item.pickupStart}–{item.pickupEnd}</span>}<strong>{money(item.total)}</strong></div><span className="show-pass">{item.status === 'collected' ? (item.rating ? t('pickups.receipt', 'View receipt') : t('pickups.rate', 'Rate this pickup')) : item.status === 'expired' ? t('pickups.expired', 'See what happened') : t('pickups.show', 'Show pickup pass')}<Icon name="arrow" size={18}/></span></button>) : <Empty pet={pet} title={pickupFilter === 'ready' ? t('pickups.empty.ready.title', 'Something to look forward to') : t('pickups.empty.history.title', 'Good food, good memories')} description={pickupFilter === 'ready' ? t('pickups.empty.ready.body', 'Your passes appear here once you confirm a demo order.') : t('pickups.empty.history.body', 'Your collected orders and receipts will be kept here.')} onClick={goDiscover}/>}</div>;
  }

  function renderSaved() {
    const saved = state.offers.filter(item => state.saved.includes(item.id));
    return <div className="tab-content"><div className="tab-heading"><Icon name="heart" size={30}/><h1>{t('saved.title', 'Little favorites')}</h1><p>{t('saved.subtitle', 'For the next time you’re peckish.')}</p></div><p className="saved-note">{t('saved.note', 'Saving a find doesn’t reserve it. Availability can change.')}</p>{saved.length ? <div className="offers-list saved-list">{saved.map(item => card(item))}</div> : <Empty pet={pet} title={t('saved.empty.title', 'Keep the good ones close')} description={t('saved.empty.body', 'Tap the heart on a find and it will be waiting here.')} onClick={goDiscover}/>}</div>;
  }

  function renderProfile() {
    const savedTotal = state.orders.reduce((sum, item) => sum + item.originalTotal - item.total, 0);
    return <div className="tab-content"><div className="profile-greeting"><TalkingPet pet={pet} size={128}/><span className="demo-account">{t('you.account', 'Demo neighbor')}</span><h1>{t('you.greeting', 'Hello, neighbor.')}</h1><p>{t('you.subtitle', 'A little kindness goes a long way.')}</p><p className="pet-caption">{petName(pet)} · {petTrait(pet)}</p></div><div className="profile-stats"><div><strong>{state.orders.length}</strong><span>{t('you.stat.orders', 'happy orders')}</span></div><div><strong>{money(savedTotal)}</strong><span>{t('you.stat.saved', 'saved so far')}</span></div></div>
      {/* Buttons rather than radios, to match the appearance and language
          controls beside them, and each one is drawn by the same component that
          draws the big one above, so a reader sees exactly what they are
          choosing. The stagger keeps the row from bobbing in lockstep. */}
      <section className="pet-picker">
        <div className="pet-picker-heading"><h2>{t('you.pet.title', 'Your little companion')}</h2><p>{t('you.pet.body', 'Whoever you pick keeps you company all the way to the counter.')}</p></div>
        <div className="pet-grid" role="group" aria-label={t('you.pet.choose', 'Choose your companion')}>
          {PETS.map((entry, index) => <button
            key={entry.id}
            type="button"
            className={`pet-option ${entry.id === pet ? 'chosen' : ''}`}
            style={{'--pet-delay': `${index * 0.32}s`}}
            aria-pressed={entry.id === pet}
            onClick={() => choosePet(entry.id)}
          >
            <Pet id={entry.id} size={62} mood={entry.id === pet ? 'success' : 'hello'}/>
            <strong>{t(entry.key, entry.en)}</strong>
            <small>{t(entry.traitKey, entry.traitEn)}</small>
            {entry.id === pet && <span className="pet-chosen-tick"><Icon name="check" size={14}/></span>}
          </button>)}
        </div>
      </section>
      <section className="profile-preferences">
        <div className="preference-row"><span><Icon name="auto" size={18}/>{t('pref.theme', 'Appearance')}</span><ThemeControl value={theme} onChange={chooseTheme}/></div>
        <div className="preference-row"><span><Icon name="globe" size={18}/>{t('pref.language', 'Language')}</span><LanguageControl value={locale} onChange={chooseLanguage}/></div>
        <div className="preference-row is-clock"><span><Icon name="clock" size={18}/>{t('clock.label', 'Local time')}<small>{t('clock.device', 'Pickup windows follow your device clock')}</small></span>{clockControl}</div>
      </section>
      <div className="profile-links">
      <button onClick={() => setModal('location')}><Icon name="pin"/><span>{t('you.link.area', 'Where you are')}<small>{placeName(place)} · {labelFor(DISTRICTS, district)}</small></span><Icon name="arrow" size={18}/></button>
      <button onClick={() => {setPickupFilter('history'); navigate('pickups');}}><Icon name="receipt"/><span>{t('you.link.history', 'Order history')}<small>{t('you.link.history.small', 'Your past pickups & receipts')}</small></span><Icon name="arrow" size={18}/></button>
      <button onClick={() => navigate('saved')}><Icon name="heart"/><span>{t('you.link.saved', 'Saved finds')}<small>{t('you.link.saved.small', '{count} little favorites', {count: state.saved.length})}</small></span><Icon name="arrow" size={18}/></button>
      <button onClick={() => setModal('how')}><Icon name="leaf"/><span>{t('you.link.how', 'How Monty works')}<small>{t('you.link.how.small', 'Good food, a second chance')}</small></span><Icon name="arrow" size={18}/></button>
    </div><section className="preview-note"><h2>{t('you.preview.title', 'A small taste of Monty')}</h2><p>{t('you.preview.body', 'This is a demo account with sample shops and payments. Changes stay in this browser when storage is available.')}</p><div className="workspace-links"><button onClick={() => setRole('merchant')}><Icon name="shop" size={18}/>{t('you.workspace.merchant', 'Merchant workspace')}<Icon name="arrow" size={16}/></button><button onClick={() => setRole('admin')}><Icon name="sliders" size={18}/>{t('you.workspace.admin', 'Operations workspace')}<Icon name="arrow" size={16}/></button></div><button className="reset-button" onClick={() => setModal('reset')}>{t('you.reset', 'Start a fresh demo')}</button></section></div>;
  }

  function renderLocationSheet() {
    const chosen = mapShop ? shopFor(mapShop) : null;
    const chosenMetres = chosen ? distanceTo(chosen.id) : 0;
    return <Modal title={t('modal.location.title', 'Where you are')} onClose={() => setModal(null)}>
      <div className="location-sheet">
        <p className="modal-description">{t('modal.location.body', 'Monty measures every distance from here. Your position stays in this browser and is never sent anywhere.')}</p>
        <MiniMap centre={place} shops={merchants} radius={radius} selected={mapShop} accuracy={place.accuracy || 0} onSelect={id => setMapShop(id === mapShop ? null : id)}/>
        {chosen
          ? <div className="map-detail">
            <div><strong>{shopName(chosen)}</strong><small>{shopKind(chosen)} · {labelFor(DISTRICTS, chosen.district)}</small><small>{formatDistance(chosenMetres)} · {t('shop.walk', '{minutes} min walk', {minutes: walkMinutes(chosenMetres)})}</small></div>
            <button className="secondary-button" onClick={() => browseShop(chosen.id)}>{t('map.browse', 'See this shop’s food')}<Icon name="arrow" size={16}/></button>
          </div>
          : <p className="map-hint">{t('map.hint', 'Tap a pin to see the shop. You are the dot in the middle.')}</p>}

        <button
          className={`locate-button ${locating ? 'is-busy' : ''} ${following ? 'is-following' : ''}`}
          onClick={() => (following ? setFollowing(false) : findMe())}
          disabled={locating}
          aria-pressed={following}
        >
          <Icon name={following ? 'target' : 'target'} size={19}/>
          {locating ? t('location.locating', 'Finding you…') : following ? t('location.following', 'Following your location') : t('location.use', 'Use my location')}
        </button>
        {following && <p className="location-live"><span className="location-dot"/>{t('location.live', 'Distances update as you move. Tap again to stop.')}</p>}
        {fixReason && <p className="location-problem"><Icon name="shield" size={15}/>{fixReason === 'denied'
          ? t('location.denied', 'Your browser refused the location permission, so Monty is standing near Sükhbaatar Square. Allow location in your browser settings to use your own.')
          : fixReason === 'timeout'
            ? t('location.timeout', 'Your device took too long to find a position, so Monty is standing near Sükhbaatar Square.')
            : t('location.unsupported', 'This browser will not share a location from a file opened off disk, so Monty is standing near Sükhbaatar Square.')}</p>}

        <h3 className="location-heading">{t('location.places', 'Or stand somewhere else')}</h3>
        <div className="place-grid">{PLACES.map(entry => <button key={entry.id} className={`place-option ${entry.id === place.id ? 'chosen' : ''}`} aria-pressed={entry.id === place.id} onClick={() => choosePlace(entry)}><Icon name="pin" size={16}/><span>{t(entry.key, entry.en)}</span></button>)}</div>

        <h3 className="location-heading">{t('location.radius', 'How far will you walk?')}</h3>
        <div className="radius-row" role="group" aria-label={t('location.radius', 'How far will you walk?')}>{RADII.map(entry => <button key={entry.id} className={`radius-option ${entry.id === radius ? 'chosen' : ''}`} aria-pressed={entry.id === radius} onClick={() => setRadius(entry.id)}>{t(entry.key, entry.en)}</button>)}</div>

        <h3 className="location-heading">{t('location.districts', 'Districts')}</h3>
        {DISTRICTS.map(entry => {
          const shops = entry.id === 'all' ? merchants.length : merchants.filter(shop => shop.district === entry.id).length;
          return <button className={`location-option ${entry.id === district ? 'chosen' : ''}`} key={entry.id} aria-pressed={entry.id === district} onClick={() => { setDistrict(entry.id); setShopFilter(null); }}>
            <Icon name="pin"/><span>{t(entry.key, entry.en)}<small>{t('location.shops', '{count} contracted shops', {count: shops})}</small></span>{entry.id === district && <Icon name="check" size={18}/>}
          </button>;
        })}
        <p className="small-note">{place.simulated === false
          ? t('modal.location.note.live', 'Your device’s own position, read in this browser only. Nothing is stored or sent, and the shops are demo shops.')
          : t('modal.location.note', 'A demo position near Sükhbaatar Square. Nothing is stored or sent, and the shops are demo shops.')}</p>
      </div>
    </Modal>;
  }

  /* A readout, not a control. The clock is the device's own, so there is
     nothing here to set — it is shown because every window, countdown and
     expiry on the screen is measured against it, and it helps to see the
     number they are all being compared to.

     It is declared above `content` because renderProfile puts it on the You
     screen. `content` calls that renderer immediately, so a `const` declared
     further down is still in its dead zone when the profile is the open tab,
     and reading it throws rather than rendering. */
  const clockControl = <div className="clock-control" aria-label={t('clock.label', 'Local time')}>
    <Icon name="clock" size={15}/>
    <strong><time aria-live="off">{formatTime(minutes)}</time></strong>
  </div>;

  const screens = {discover: renderHome, pickups: renderPickups, saved: renderSaved, you: renderProfile};
  const content = page?.type === 'offer' && offer ? renderOffer() : page?.type === 'bag' ? renderBag() : page?.type === 'checkout' ? renderBag(true) : page?.type === 'pass' ? renderPass() : screens[tab]();
  const toastNode = toast && <div className={`toast ${role === 'customer' ? 'in-app' : ''}`} role="status"><Icon name="check" size={20}/><span>{toast}</span><button aria-label={t('toast.dismiss', 'Dismiss message')} onClick={() => setToast('')}><Icon name="close" size={18}/></button></div>;
  const roles = [['customer', t('role.customer', 'Customer')], ['merchant', t('role.merchant', 'Merchant')], ['admin', t('role.admin', 'Operations')]];

  return <><main className={`presentation ${role !== 'customer' ? 'workspace-mode' : ''}`}>
    <header className="presentation-header"><Wordmark small/><span className="prototype-label"><span/>{t('app.tagline', 'Ulaanbaatar · interactive demo')}</span>
      <div className="header-preferences">{clockControl}<ThemeControl value={theme} onChange={chooseTheme}/><LanguageControl value={locale} onChange={chooseLanguage}/></div>
      <nav className="role-picker" aria-label={t('role.workspace', 'Preview workspace')}>{roles.map(([id, label]) => <button key={id} aria-pressed={role === id} onClick={() => setRole(id)}>{label}</button>)}</nav></header>
    {role === 'customer' ? <div className="customer-app">
      <header className={`app-header ${discover ? 'discovery-header' : ''}`}><div className="brand-row"><button className="brand-home" aria-label={t('app.home', 'Monty home')} onClick={goDiscover}><Wordmark/></button><span className="demo-badge">{t('app.demo', 'Demo')}</span><button className="bag-button" aria-label={t('app.bag', 'Your bag, {count} items', {count})} onClick={openBag}><Icon name="bag" size={24}/>{count > 0 && <b key={count}>{count}</b>}</button></div>{discover && <button className="location-button" onClick={() => setModal('location')}><Icon name="pin" size={16}/><span>{placeName(place)}</span>{radius > 0 && <i>{labelFor(RADII, radius)}</i>}<Icon name="chevron" size={15}/></button>}</header>
      <div className={`screen-scroll ${page?.type === 'pass' ? 'pass-screen' : ''}`} ref={scroll} id="app-content">{content}</div>
      {page?.type === 'offer' && offer && <div className="detail-action"><Stepper value={qty} onChange={setQty} max={Math.max(0, available)}/><button className="primary-button" onClick={() => add(offer)} disabled={!isBuyable(offer, minutes) || available < qty}><span>{t('offer.add', 'Add to bag')}</span><span>{money(qty * offer.price)}</span></button></div>}
      {!page && count > 0 && <button className="floating-bag" onClick={openBag}><span><Icon name="bag" size={18}/>{count === 1 ? t('floating.one', '{count} good thing in your bag', {count}) : t('floating.many', '{count} good things in your bag', {count})}</span><span>{t('floating.view', 'View bag')} <Icon name="arrow" size={16}/></span></button>}
      <nav className="bottom-nav" aria-label={t('nav.main', 'Main navigation')}>{[['discover', 'discover', t('nav.discover', 'Discover')], ['saved', 'heart', t('nav.saved', 'Saved')], ['pickups', 'ticket', t('nav.pickups', 'Pickups')], ['you', 'person', t('nav.you', 'You')]].map(([id, icon, label]) => <button key={id} className={tab === id ? 'selected' : ''} aria-current={!page && tab === id ? 'page' : undefined} onClick={() => navigate(id)}><span><Icon name={icon} size={22}/>{id === 'pickups' && readyOrders.length > 0 && <i/>}</span>{label}</button>)}</nav>
      {toastNode}
    </div> : <Operations role={role} state={state} setState={setState} onExit={() => setRole('customer')} notify={notify} place={place} distances={distances} minutes={minutes} onNewDay={newDay}/>}
  </main>{role !== 'customer' && toastNode}
    {modal === 'location' && renderLocationSheet()}
    {modal === 'filters' && <Modal title={t('modal.filters.title', 'Your kind of good')} onClose={() => setModal(null)}><p className="modal-description">{t('modal.filters.body', 'Show food by…')}</p>{sorts.map(entry => <button key={entry.id} className={`location-option ${entry.id === sort ? 'chosen' : ''}`} aria-pressed={entry.id === sort} onClick={() => setSort(entry.id)}><span>{t(entry.key, entry.en)}</span>{entry.id === sort && <Icon name="check"/>}</button>)}<button className="primary-button full" onClick={() => setModal(null)}>{t('modal.filters.apply', 'Show my finds')}<Icon name="arrow" size={18}/></button></Modal>}
    {modal === 'switch-shop' && offer && <Modal title={t('modal.switch.title', 'Start a bag from this shop?')} onClose={() => setModal(null)}><p className="modal-description">{t('modal.switch.body', 'Each order comes from one shop. Replace your current bag with {count} × {title} from {shop}, or keep your bag to order it first.', {count: qty, title: offerTitle(offer), shop: shopName(shopFor(offer.merchantId))})}</p><button className="primary-button full" onClick={() => add(offer, true)}>{t('modal.switch.new', 'Start new bag')}</button><button className="secondary-button full" onClick={() => setModal(null)}>{t('modal.switch.keep', 'Keep my current bag')}</button></Modal>}
    {modal === 'how' && <Modal title={t('modal.how.title', 'Good food, a happy ending')} onClose={() => setModal(null)}>{[['search', t('modal.how.find.title', 'Find something good'), t('modal.how.find.body', 'Shops share food made today at a lower price. Choose the specific items and quantities you want.')], ['bag', t('modal.how.pay.title', 'Pay before pickup'), t('modal.how.pay.body', 'Each order is from one shop. In this preview, payment is a demo and no money is charged.')], ['ticket', t('modal.how.collect.title', 'Pop by for pickup'), t('modal.how.collect.body', 'Show your QR pass or backup code at the counter during your pickup window.')]].map(([icon, title, description]) => <div className="how-step" key={icon}><Icon name={icon}/><div><h3>{title}</h3><p>{description}</p></div></div>)}<button className="primary-button full" onClick={() => setModal(null)}>{t('modal.how.done', 'Sounds lovely')}</button></Modal>}
    {modal === 'reset' && <Modal title={t('modal.reset.title', 'A fresh little start?')} onClose={() => setModal(null)}><p className="modal-description">{t('modal.reset.body', 'This clears demo orders, favorites and shop edits saved in this browser.')}</p><button className="primary-button full" onClick={() => {setState(createDemoState()); setCart([]); setModal(null); clearFilters(); setPlace(DEFAULT_PLACE); setRadius(DEFAULT_RADIUS); navigate('discover'); notify(t('toast.reset', 'All fresh. Have another look around.'));}}>{t('modal.reset.confirm', 'Reset demo')}</button><button className="secondary-button full" onClick={() => setModal(null)}>{t('modal.reset.keep', 'Keep exploring')}</button></Modal>}
  </>;
}

export default App;

// Guarded so the component can also be rendered by the offline render check in
// scripts/smoke.mjs, which has no document to mount into.
const container = typeof document !== 'undefined' ? document.getElementById('root') : null;
if (container) createRoot(container).render(<App />);
