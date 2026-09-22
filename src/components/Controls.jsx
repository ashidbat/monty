import React, {useEffect, useId, useRef, useState} from 'react';
import Icon from './Icon.jsx';
import {photoURL} from '../photos.js';
import {t} from '../i18n.js';
import {THEMES} from '../preferences.js';

export function FoodPhoto({src, alt, className = '', ...props}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <div className={`photo-fallback ${className}`} role="img" aria-label={t('offer.photo.unavailable', '{alt}: photo unavailable', {alt})}>
    <Icon name="bread" size={32}/><span>{t('offer.photo.missing', 'Photo unavailable')}</span>
  </div> : <img className={className} src={photoURL(src)} alt={alt} decoding="async" onError={() => setFailed(true)} {...props}/>;
}

export function Stepper({value, onChange, max = 99, min = 1, label = t('offer.quantity', 'Quantity')}) {
  return <div className="stepper" role="group" aria-label={label}>
    <button aria-label={t('offer.quantity.decrease', 'Decrease {label}', {label: label.toLowerCase()})} onClick={() => onChange(value - 1)} disabled={value <= min}><Icon name="minus" size={16}/></button>
    <output aria-live="polite">{value}</output>
    <button aria-label={t('offer.quantity.increase', 'Increase {label}', {label: label.toLowerCase()})} onClick={() => onChange(value + 1)} disabled={value >= max}><Icon name="plus" size={16}/></button>
  </div>;
}

export function Modal({title, onClose, children}) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return <dialog ref={ref} className="monty-modal" aria-labelledby={id} onCancel={onClose} onClick={event => {
    if (event.target === ref.current) {
      const box = ref.current.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }
  }}>
    <div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" aria-label={t('modal.close', 'Close dialog')} onClick={onClose}><Icon name="close"/></button></div>
    {children}
  </dialog>;
}

const THEME_ICONS = {system: 'auto', light: 'sun', dark: 'moon'};
const THEME_LABELS = {
  system: ['pref.theme.system', 'Follow my device'],
  light: ['pref.theme.light', 'Light'],
  dark: ['pref.theme.dark', 'Dark'],
};

/* Icon-only on the demo header, where space is tight. Labelled in the profile
   screen, where it reads as the product's own setting and not as review chrome. */
export function ThemeControl({value, onChange, labelled = false}) {
  return <div className="pref-control" role="group" aria-label={t('pref.theme', 'Appearance')}>
    {THEMES.map(theme => {
      const [key, english] = THEME_LABELS[theme];
      const label = t(key, english);
      return <button
        key={theme}
        type="button"
        aria-pressed={value === theme}
        aria-label={labelled ? undefined : label}
        title={labelled ? undefined : label}
        onClick={() => onChange(theme)}
      ><Icon name={THEME_ICONS[theme]} size={17}/>{labelled && <span>{label}</span>}</button>;
    })}
  </div>;
}

export function LanguageControl({value, onChange, labelled = false}) {
  return <div className="pref-control" role="group" aria-label={t('pref.language', 'Language')}>
    {labelled && <Icon name="globe" size={17} className="pref-lead"/>}
    {[['en', 'English', 'EN'], ['mn', 'Монгол', 'МН']].map(([code, full, short]) => <button
      key={code}
      type="button"
      lang={code}
      aria-pressed={value === code}
      aria-label={labelled ? undefined : full}
      title={labelled ? undefined : full}
      onClick={() => onChange(code)}
    >{labelled ? full : short}</button>)}
  </div>;
}
