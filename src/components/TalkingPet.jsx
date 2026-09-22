import React, {useEffect, useRef, useState} from 'react';
import Pet from './Pets.jsx';
import {CHEERS, petName} from '../pets.js';
import {t} from '../i18n.js';
import './identity.css';

/* A companion you can tap.

   The drawing stays decorative and the button around it carries the label, so
   a screen reader is offered one control rather than a picture and a control.
   The bubble is positioned absolutely: a kind word should never push the
   screen underneath it around, least of all on the hero, where a reader may be
   mid-scroll. It opens beside the companion, into the space every screen keeps
   there, rather than under it, where each of these screens has a headline; the
   empty states pass "above" instead, having room overhead and none beside. It
   clears itself after a few seconds, and a second tap answers with a different
   line rather than the same one twice. */
const VISIBLE = 4600;

export default function TalkingPet({pet, mood = 'hello', size = 150, placement = 'left'}) {
  const [line, setLine] = useState(null);
  const previous = useRef(-1);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  // A companion swapped under us must not keep the last one's words.
  useEffect(() => {
    setLine(null);
    clearTimeout(timer.current);
  }, [pet]);

  function speak() {
    let index = Math.floor(Math.random() * CHEERS.length);
    // With this few lines, hearing the same one twice running reads as a bug
    // rather than as chance.
    if (index === previous.current) index = (index + 1) % CHEERS.length;
    previous.current = index;
    setLine({text: t(CHEERS[index].key, CHEERS[index].en), at: Date.now()});
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(null), VISIBLE);
  }

  return <div className={`pet-stage place-${placement} ${line ? 'is-cheering' : ''}`}>
    <button type="button" className="pet-tap" aria-label={t('pet.tap', 'Tap {name} for a kind word', {name: petName(pet)})} onClick={speak}>
      <Pet id={pet} mood={line ? 'success' : mood} size={size}/>
    </button>
    {/* Always in the tree, empty until there is something to say: a live
        region added to the page at the moment it fills is announced late or
        not at all. The inner element is keyed so each answer pops again. */}
    <p className="pet-speech" role="status">{line && <span key={line.at}>{line.text}</span>}</p>
  </div>;
}
