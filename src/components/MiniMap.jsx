import React, { useId } from 'react';
import { metresBetween, offsetMetres, formatDistance, placeName } from '../geo.mjs';
import { t } from '../i18n.js';
import { shopName } from '../content.js';

/* A schematic map, and drawn so nobody mistakes it for a real one.

   Street tiles are the part of a map that has to be surveyed, licensed and
   fetched over a network, and this preview has none of those. What it does
   have is coordinates, so what it draws is what coordinates can honestly
   support: a compass-correct scatter of the shops around you, a scale bar, and
   a ring for the distance you said you would walk. The grid underneath is
   decoration and is marked as such; it is not Ulaanbaatar's street plan.

   Everything is positioned by projecting metres and scaling once, so a pin is
   always in the right direction and the right relative distance. */

const VIEW = { w: 300, h: 216 };
const CENTRE = { x: 150, y: 108 };
const EDGE = 84; // pixels from the centre to the furthest a pin may sit

function scaleFor(points, centre, radius) {
  const furthest = points.reduce((most, point) => Math.max(most, metresBetween(centre, point)), 0);
  // The ring stays on the map whenever it reasonably can, so the radius the
  // reader chose is something they can see rather than something they trust.
  const span = Math.max(furthest * 1.12, radius ? radius * 1.05 : 0, 400);
  return EDGE / span;
}

function niceBar(metresPerPixel) {
  const target = 70 * metresPerPixel;
  const steps = [100, 200, 250, 500, 1000, 2000, 2500, 5000];
  return steps.find(step => step >= target) ?? steps[steps.length - 1];
}

export default function MiniMap({ centre, shops, radius = 0, selected, onSelect, accuracy = 0, compact = false }) {
  /* useId spells its values with punctuation React reserves for itself, and a
     `url(#…)` reference has to survive being parsed as a URL fragment. Two
     maps can share a screen, so the id still has to be unique. */
  const id = `map${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const scale = scaleFor(shops, centre, radius);
  const placed = shops.map(shop => {
    const { east, north } = offsetMetres(centre, shop);
    return { shop, x: CENTRE.x + east * scale, y: CENTRE.y - north * scale, metres: metresBetween(centre, shop) };
  });
  const bar = niceBar(1 / scale);
  const ring = radius * scale;
  const accuracyRing = Math.max(9, accuracy * scale);
  const label = t('map.label', 'Schematic map of {count} shops around {place}', { count: shops.length, place: placeName(centre) });

  return <figure className={`mini-map ${compact ? 'is-compact' : ''}`}>
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={label}>
      <defs>
        <pattern id={`${id}-grid`} width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-9 150 108)">
          <path d="M30 0H0v30" fill="none" stroke="var(--map-line)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEW.w} height={VIEW.h} rx="18" fill="var(--map-bg)" />
      <rect width={VIEW.w} height={VIEW.h} rx="18" fill={`url(#${id}-grid)`} />
      {/* The Tuul runs along the south of the city, which is the one piece of
          real geography worth keeping in a drawing this abstract. */}
      <path d="M-6 190q60-20 110-6t120-16 82-10" fill="none" stroke="var(--map-water)" strokeWidth="11" strokeLinecap="round" />
      <path d="M-6 148q84-24 150 2t162-12" fill="none" stroke="var(--map-road)" strokeWidth="5" strokeLinecap="round" />
      <path d="M-6 92q90 12 156-10t156 4" fill="none" stroke="var(--map-road)" strokeWidth="6" strokeLinecap="round" />

      {ring > 8 && <circle cx={CENTRE.x} cy={CENTRE.y} r={ring} fill="var(--map-ring-fill)" stroke="var(--map-ring)" strokeWidth="1.5" strokeDasharray="5 5" />}

      {placed.map(({ shop, x, y }) => {
        const chosen = shop.id === selected;
        const pin = <g className={`map-pin ${chosen ? 'is-selected' : ''}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
          <path d="M0 3c0-7 5-12 5-17A5 5 0 0 0-5-14c0 5 5 10 5 17Z" transform="translate(0 4) scale(1.5)" />
          <circle cx="0" cy="-16.5" r="4" className="map-pin-eye" />
        </g>;
        return onSelect
          ? <g key={shop.id} role="button" tabIndex={0} aria-label={`${shopName(shop)}, ${formatDistance(metresBetween(centre, shop))}`} aria-pressed={chosen} className="map-hit" onClick={() => onSelect(shop.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(shop.id); } }}>
            <circle cx={x} cy={y} r="17" fill="transparent" />{pin}
          </g>
          : <React.Fragment key={shop.id}>{pin}</React.Fragment>;
      })}

      <circle cx={CENTRE.x} cy={CENTRE.y} r={accuracyRing} className="map-accuracy" />
      <circle cx={CENTRE.x} cy={CENTRE.y} r="6" className="map-you" />

      <g className="map-scale" transform={`translate(18 ${VIEW.h - 16})`}>
        <path d={`M0 0h${(bar * scale).toFixed(1)}`} />
        <path d="M0-4v8" /><path d={`M${(bar * scale).toFixed(1)}-4v8`} />
        <text x={(bar * scale) / 2} y="-7" textAnchor="middle">{formatDistance(bar)}</text>
      </g>
      <text x={VIEW.w - 16} y="24" textAnchor="end" className="map-north">N</text>
      <path d={`M${VIEW.w - 20} 30v10`} className="map-north-arrow" />
    </svg>
    <figcaption>{t('map.caption', 'Directions and distances are real. The streets are a sketch, and your position is simulated.')}</figcaption>
  </figure>;
}
