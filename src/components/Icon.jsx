import React from 'react';

const drawings = {
  pin: <><path d="M19 10c0 5.1-7 10.4-7 10.4S5 15.1 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/></>,
  bag: <><path d="m5.4 8-1 11.1A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.7-1.9L18.6 8Z"/><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/></>,
  heart: <path d="M12 20s-8.5-5.2-8.5-11A4.7 4.7 0 0 1 12 6.2 4.7 4.7 0 0 1 20.5 9c0 5.8-8.5 11-8.5 11Z"/>,
  discover: <><path d="M12 3c.9 4.7 3.8 7.6 9 9-5.2 1.4-8.1 4.3-9 9-.9-4.7-3.8-7.6-9-9 5.2-1.4 8.1-4.3 9-9Z"/><circle cx="12" cy="12" r="1.4"/></>,
  ticket: <><path d="M5 4h14a1 1 0 0 1 1 1v4a3 3 0 0 0 0 6v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a3 3 0 0 0 0-6V5a1 1 0 0 1 1-1Z"/><path d="M14 5.5V7m0 4v2m0 4v1.5"/></>,
  person: <><circle cx="12" cy="7.5" r="3.8"/><path d="M4.5 20.5v-1a7.5 7.5 0 0 1 15 0v1"/></>,
  clock: <><circle cx="12" cy="12" r="8.7"/><path d="M12 6.7V12l3.4 2"/></>,
  arrow: <path d="m9 6 6 6-6 6"/>,
  back: <><path d="m10 6-6 6 6 6M4 12h16"/></>,
  chevron: <path d="m7 9.5 5 5 5-5"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 5 5"/></>,
  check: <path d="m5 12 4.5 4.5L19 7"/>,
  close: <path d="m6.5 6.5 11 11m-11 0 11-11"/>,
  leaf: <><path d="M20 3.5c-7.5-.6-15 1.9-15 9a6.5 6.5 0 0 0 6.5 6.5C18.6 19 20.6 11 20 3.5Z"/><path d="m4 21 11-11m-7.5 7.5V13m0 4.5H12"/></>,
  sliders: <><path d="M4 7h4m4 0h8M4 17h8m4 0h4"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/></>,
  bread: <><path d="M5.5 12a4.6 4.6 0 0 1-2-3.8c0-3.1 3.4-5.1 6.1-3.8a4.5 4.5 0 0 1 4.8 0c2.7-1.3 6.1.7 6.1 3.8a4.6 4.6 0 0 1-2 3.8v6.7a1.8 1.8 0 0 1-1.8 1.8H7.3a1.8 1.8 0 0 1-1.8-1.8Z"/><path d="m8.5 9 1 3m2-4 1 3m2-2 1 3"/></>,
  meal: <><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Zm4.5 8h8M7 7c-2-2 1-2 0-4m5 4c-2-2 1-2 0-4m5 4c-2-2 1-2 0-4"/></>,
  sweet: <><path d="m6 12 1.7 7.4a1.4 1.4 0 0 0 1.4 1.1h5.8a1.4 1.4 0 0 0 1.4-1.1L18 12ZM6 12a3 3 0 0 1-1-5.8 3.4 3.4 0 0 1 5.1-2.9 3.4 3.4 0 0 1 5.8 1.2A3.8 3.8 0 0 1 18 12M10 15l.3 2.5M14 15l-.3 2.5"/></>,
  shop: <><path d="M4.5 11v9.5h15V11M4 3.5h16l1 5a2.8 2.8 0 0 1-4.5 2.2A2.8 2.8 0 0 1 12 11a2.8 2.8 0 0 1-4.5-.3A2.8 2.8 0 0 1 3 8.5l1-5Z"/><path d="m8.2 3.5-.7 5m9-5 .7 5M9 20.5v-6h6v6"/></>,
  // A cup with a lid, which is what a Monty drink listing actually is.
  cup: <><path d="M6.5 6.5h11l-1.2 13a1.8 1.8 0 0 1-1.8 1.6H9.5a1.8 1.8 0 0 1-1.8-1.6Z"/><path d="M5 3.5h14v3H5zM7.4 12h9.2"/></>,
  basket: <><path d="M3.5 9.5h17l-1.6 9.1a2 2 0 0 1-2 1.7H7.1a2 2 0 0 1-2-1.7Z"/><path d="m8 9.5 2.5-6m5.5 6-2.5-6M10 13.5v3m4-3v3"/></>,
  walk: <><circle cx="13.5" cy="4.2" r="2"/><path d="m8 21 2.6-6.2-2.1-2.3.9-4.4 3.6-1 2.6 2.8 2.9 1.2"/><path d="m12.4 14.4 2.3 2.4.8 4.2M8.4 8.6 5.9 10"/></>,
  target: <><circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="2.3"/><path d="M12 2.2v2.6m0 14.4v2.6M2.2 12h2.6m14.4 0h2.6"/></>,
  star: <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85Z"/>,
  // A stack of coins, for the figure a merchant came here for.
  payout: <><ellipse cx="12" cy="6.4" rx="7.4" ry="2.9"/><path d="M4.6 6.4v5c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9v-5"/><path d="M4.6 11.4v5c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9v-5"/></>,
  // A day flipping over, for the control that restocks the counter.
  sunrise: <><path d="M12 3.6v4.2m-6 2.6L4.4 9M18 10.4 19.6 9M2.6 20.4h18.8M6.4 16.4a5.6 5.6 0 0 1 11.2 0"/><path d="M4.2 20.4h15.6"/></>,
  repeat: <><path d="M4 9.5A4.5 4.5 0 0 1 8.5 5H18"/><path d="m15.5 2.5 3 2.5-3 2.5"/><path d="M20 14.5A4.5 4.5 0 0 1 15.5 19H6"/><path d="m8.5 21.5-3-2.5 3-2.5"/></>,
  shield: <><path d="m12 3 7.5 2.7v5.5c0 5.5-7.5 9.8-7.5 9.8S4.5 16.7 4.5 11.2V5.7L12 3Z"/><path d="m8.3 11.5 2.4 2.5 5-5"/></>,
  receipt: <><path d="M6 3.5 9 5l3-1.5L15 5l3-1.5v17L15 19l-3 1.5L9 19l-3 1.5Z"/><path d="M9 9h6m-6 4h6m-6 3h3"/></>,
  refresh: <><path d="M19.4 8.5A8 8 0 0 0 4 10m.6 5.5A8 8 0 0 0 20 14"/><path d="M15 8.5h4.5V4M9 15.5H4.5V20"/></>,
  pause: <><path d="M8 5v14m8-14v14"/></>,
  edit: <><path d="m14.5 5 4.5 4.5M5 19l4.5-1 10-10a2.4 2.4 0 0 0-3.5-3.5l-10 10L5 19Z"/><path d="M12 20h8"/></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  sun: <><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2m0 14.4v2.2M4.4 4.4 6 6m12 12 1.6 1.6M2.6 12h2.2m14.4 0h2.2M4.4 19.6 6 18M18 6l1.6-1.6"/></>,
  moon: <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"/>,
  // The half-filled disc is the usual shorthand for 'follow the device'.
  auto: <><circle cx="12" cy="12" r="8.6"/><path d="M12 3.4a8.6 8.6 0 0 1 0 17.2Z" fill="currentColor" stroke="none"/></>,
  globe: <><circle cx="12" cy="12" r="8.6"/><path d="M3.6 9.6h16.8M3.6 14.4h16.8"/><path d="M12 3.4c4 4.6 4 12.6 0 17.2-4-4.6-4-12.6 0-17.2Z"/></>,
};

export default function Icon({ name, size = 22, className = '', ...props }) {
  return <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={`monty-icon ${className}`.trim()}
    {...props}
  >{drawings[name] || drawings.discover}</svg>;
}
