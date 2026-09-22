/* Monty's companions.

   The mascot used to be the loaf and nothing else. A reader can now keep a
   companion instead, so the roster lives here as plain data: preferences.js
   validates a stored choice against it, components/Pets.jsx draws it, and the
   profile picker lists it in this order.

   The id is what reaches storage, so it stays English and only the name, the
   trait line and the cheers travel between languages. The names are one word
   in both languages, written in the reader's own script: Mishee is Мишээ,
   Bankhar is Банхар, and the loaf stays Monty. */

import { t } from './i18n.js';

export const PETS = [
  {id: 'loaf', key: 'pet.loaf', en: 'Monty', traitKey: 'pet.loaf.trait', traitEn: 'Warm from the oven.'},
  {id: 'cat', key: 'pet.cat', en: 'Mishee', traitKey: 'pet.cat.trait', traitEn: 'Naps between pickups.'},
  {id: 'dog', key: 'pet.dog', en: 'Bankhar', traitKey: 'pet.dog.trait', traitEn: 'First one to the door.'},
  {id: 'bunny', key: 'pet.bunny', en: 'Khuvun', traitKey: 'pet.bunny.trait', traitEn: 'Hops to every find.'},
  {id: 'lamb', key: 'pet.lamb', en: 'Khonggor', traitKey: 'pet.lamb.trait', traitEn: 'Soft about leftovers.'},
  {id: 'camel', key: 'pet.camel', en: 'Botgo', traitKey: 'pet.camel.trait', traitEn: 'Carries the big bag.'},
];

/* What a companion says when it is tapped.

   These are encouragement and nothing else. Not a word about food, orders,
   shops or savings: a companion who cheers you on and then mentions the
   product is not cheering you on, it is selling, and a reader can feel the
   difference immediately. Every companion draws on the same fifteen, so the
   voice is the app's rather than one animal's. */
export const CHEERS = [
  {key: 'pet.cheer.luck', en: 'Good luck out there today.'},
  {key: 'pet.cheer.better', en: 'You are doing better than you think.'},
  {key: 'pet.cheer.showed', en: 'You showed up. That is the hard part.'},
  {key: 'pet.cheer.tired', en: 'Tired is not the same as failing.'},
  {key: 'pet.cheer.slowly', en: 'Slowly is still forward.'},
  {key: 'pet.cheer.onewin', en: 'Today only needs one small win.'},
  {key: 'pet.cheer.today', en: 'Whatever today is, you are handling it.'},
  {key: 'pet.cheer.rest', en: 'Resting counts as getting something done.'},
  {key: 'pet.cheer.kindself', en: 'Be kind to yourself today.'},
  {key: 'pet.cheer.harder', en: 'You have got through harder days than this one.'},
  {key: 'pet.cheer.breath', en: 'Take a breath. You are alright.'},
  {key: 'pet.cheer.step', en: 'One step, then another. That is all it takes.'},
  {key: 'pet.cheer.proud', en: 'Proud of you. Off you go.'},
  {key: 'pet.cheer.cold', en: 'Ulaanbaatar is cold. You are not.'},
  {key: 'pet.cheer.here', en: 'I am right here whenever you need me.'},
];

export const PET_IDS = PETS.map(pet => pet.id);
export const DEFAULT_PET = 'loaf';

/* An id from storage can be anything, including a companion a later build
   removed, so every lookup falls back to the loaf rather than to undefined. */
export const petFor = id => PETS.find(pet => pet.id === id) || PETS[0];
export const petName = id => { const pet = petFor(id); return t(pet.key, pet.en); };
export const petTrait = id => { const pet = petFor(id); return t(pet.traitKey, pet.traitEn); };
