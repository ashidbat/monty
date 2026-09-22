import React from 'react';
import Icon from './Icon.jsx';
import { windowState, minutesUntil } from '../clock.mjs';
import { t } from '../i18n.js';

/* What a pickup window says once the app knows the time.

   '17:00–19:00' is a fact a reader has to do arithmetic on. "Closes in 34 min"
   is the same fact with the arithmetic done, and it is the difference between
   a listing and a reason to leave the house. The plain times stay alongside,
   because somebody deciding whether they can get there still wants them. */

export function windowLabel(offer, minutes) {
  const state = windowState(offer.pickupStart, offer.pickupEnd, minutes);
  if (state === 'upcoming') {
    const until = minutesUntil(offer.pickupStart, minutes);
    return until <= 90
      ? { state, text: t('window.opens.soon', 'Opens in {minutes} min', { minutes: until }) }
      : { state, text: t('window.opens', 'From {time}', { time: offer.pickupStart }) };
  }
  if (state === 'closed') return { state, text: t('window.closed', 'Closed for today') };
  if (state === 'closing') return { state, text: t('window.closing', 'Closes in {minutes} min', { minutes: minutesUntil(offer.pickupEnd, minutes) }) };
  return { state, text: t('window.open', 'Until {time}', { time: offer.pickupEnd }) };
}

export default function Countdown({ offer, minutes, showRange = false }) {
  const { state, text } = windowLabel(offer, minutes);
  return <span className={`countdown is-${state}`}>
    <Icon name="clock" size={14} />
    <span>{text}</span>
    {showRange && <small>{offer.pickupStart}–{offer.pickupEnd}</small>}
  </span>;
}
