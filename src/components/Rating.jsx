import React from 'react';
import Icon from './Icon.jsx';
import { t } from '../i18n.js';

/* Trust, which a marketplace this young has none of by default.

   A stranger is asking you to pay in advance for food you cannot see, from a
   shop you have not been to, in a model most of Ulaanbaatar has never used.
   A score and a count are the cheapest honest answer to that, and the count
   matters more than the score: 4.8 from nine people is a rumour, 4.8 from
   three hundred is a reputation. */

export function Stars({ score, size = 14 }) {
  return <span className="stars" aria-hidden="true">
    {[1, 2, 3, 4, 5].map(step => <i key={step} className={score >= step - 0.25 ? 'on' : score >= step - 0.75 ? 'half' : ''} style={{ width: size, height: size }}>
      <Icon name="star" size={size} />
    </i>)}
  </span>;
}

export function ShopRating({ rating, compact = false }) {
  if (!rating) return null;
  return <span className={`shop-rating ${compact ? 'is-compact' : ''}`} title={t('trust.rating.long', '{score} out of 5 from {count} collections', { score: rating.score, count: rating.count })}>
    <Stars score={rating.score} size={compact ? 12 : 14} />
    <strong>{rating.score.toFixed(1)}</strong>
    <small>{t('trust.count', '({count})', { count: rating.count })}</small>
  </span>;
}

/* Only offered on a collected order: you went, you ate it, you have an
   opinion. Asking before that is asking someone to rate a photograph. */
export function RateOrder({ value, onRate }) {
  return <div className="rate-order">
    <strong>{value ? t('trust.rated', 'Thanks — you rated this {value} out of 5.', { value }) : t('trust.rate', 'How was it?')}</strong>
    <div role="group" aria-label={t('trust.rate', 'How was it?')}>
      {[1, 2, 3, 4, 5].map(score => <button
        key={score}
        type="button"
        className={`rate-star ${value >= score ? 'on' : ''}`}
        aria-label={t('trust.rate.value', 'Rate {score} out of 5', { score })}
        aria-pressed={value === score}
        onClick={() => onRate(score)}
      ><Icon name="star" size={26} /></button>)}
    </div>
    {!value && <small>{t('trust.rate.note', 'Your rating is only counted once you have collected the order.')}</small>}
  </div>;
}
