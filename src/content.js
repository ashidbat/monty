/* Display text for records that carry demo content.

   The seeded shops and offers in catalogue.mjs are written in both languages,
   and a Mongolian reader should not meet them in English halfway through an
   otherwise translated screen. Each lookup is keyed by the record's own id, so
   an item a merchant typed into the editor finds no key and keeps the words
   they wrote, which is the right behaviour for real merchant content in any
   language. */

import { t } from './i18n.js';

export const offerTitle = offer => t(`demo.offer.${offer.id}.title`, offer.title);
export const offerDescription = offer => t(`demo.offer.${offer.id}.description`, offer.description);
export const shopAddress = shop => t(`demo.shop.${shop.id}.address`, shop.address);
export const shopPickupNote = shop => t(`demo.shop.${shop.id}.pickupNote`, shop.pickupNote);
export const shopKind = shop => t(`demo.shop.${shop.id}.kind`, shop.kind);
export const allergenName = name => t(`demo.allergen.${name}`, name);

/* Three of the six shops have names that are English words and stay that way
   in both languages, the way a brand does. The three with a Mongolian name
   carry it in the catalogue and it is published under the same key, so a
   reader never meets a transliteration nobody uses. */
export const shopName = shop => (shop ? t(`demo.shop.${shop.id}.name`, shop.name) : '');

// Order lines keep a copy of the title from the moment of purchase, so they are
// looked up by the offer id they were taken from, not by a record.
export const lineTitle = line => t(`demo.offer.${line.offerId}.title`, line.title);
