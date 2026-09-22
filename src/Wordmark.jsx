import React from 'react';
import './components/identity.css';

/* One wordmark for the whole product. The customer app, the merchant
   workspace and the pickup pass all render this same component so a shop
   owner and a customer are looking at the same brand. */
export default function Wordmark({ small = false }) {
  return <span className={small ? 'wordmark small' : 'wordmark'}>
    <span className="wordmark-letters">monty</span>
    <svg className="wordmark-grain" viewBox="0 0 24 28" fill="none" aria-hidden="true" focusable="false">
      <path d="M11 25c2-6 3-12 3-20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 8C9 6 9 2 12 1c3 1 4 4 2 7ZM13 14C7 14 4 10 6 7c4 0 7 3 7 7Zm-2 7c-6 0-9-4-7-7 4 0 7 3 7 7Zm3-10c0-5 4-7 7-5 0 4-3 6-7 5Zm-1 8c1-5 5-7 8-5-1 4-4 6-8 5Z" fill="currentColor"/>
    </svg>
  </span>;
}
