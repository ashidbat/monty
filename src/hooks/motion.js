import {useEffect} from 'react';
import {flushSync} from 'react-dom';

export function transition(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

/* Makes a horizontal rail behave like one.

   Touch already swipes a scroll container natively and re-implementing it
   only fights the platform's own momentum, so this leaves touch alone. What
   it adds is the half nobody else provides: a mouse cannot swipe, the
   scrollbar is hidden by design, and a wheel over a horizontal rail scrolls
   the page instead. So a pointer can grab the rail and pull it, and the
   fading edges say there is more in that direction.

   A drag that ends on top of a chip must not also press it, which is why the
   click is swallowed once afterwards. */
export function useRailScroll(railRef, enabled = true) {
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !enabled) return;

    const edges = () => {
      const room = rail.scrollWidth - rail.clientWidth;
      rail.classList.toggle('has-start', rail.scrollLeft > 2);
      rail.classList.toggle('has-end', room > 2 && rail.scrollLeft < room - 2);
    };

    let pointer = null;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let swallowClick = false;

    const down = event => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      pointer = event.pointerId;
      startX = event.clientX;
      startLeft = rail.scrollLeft;
      dragging = false;
    };
    const move = event => {
      if (event.pointerId !== pointer) return;
      const travelled = event.clientX - startX;
      // Four pixels of slop, so pressing a chip is still a press.
      if (!dragging && Math.abs(travelled) < 4) return;
      if (!dragging) {
        dragging = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture?.(pointer);
      }
      event.preventDefault();
      rail.scrollLeft = startLeft - travelled;
    };
    const up = event => {
      if (event.pointerId !== pointer) return;
      if (dragging) {
        rail.releasePointerCapture?.(pointer);
        swallowClick = true;
      }
      pointer = null;
      dragging = false;
      rail.classList.remove('is-dragging');
    };
    const click = event => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    rail.addEventListener('pointerdown', down);
    rail.addEventListener('pointermove', move);
    rail.addEventListener('pointerup', up);
    rail.addEventListener('pointercancel', up);
    rail.addEventListener('click', click, true);
    rail.addEventListener('scroll', edges, { passive: true });
    // A language change or a longer shop name resizes the chips, and the
    // fades have to follow.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(edges) : null;
    observer?.observe(rail);
    edges();

    return () => {
      rail.removeEventListener('pointerdown', down);
      rail.removeEventListener('pointermove', move);
      rail.removeEventListener('pointerup', up);
      rail.removeEventListener('pointercancel', up);
      rail.removeEventListener('click', click, true);
      rail.removeEventListener('scroll', edges);
      observer?.disconnect();
      rail.classList.remove('is-dragging', 'has-start', 'has-end');
    };
  }, [railRef, enabled]);
}

export function useDiscoveryMotion(scrollRef, enabled) {
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !enabled) return;
    const app = scroller.closest('.customer-app');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = scroller.scrollTop;
      app.classList.toggle('is-scrolled', distance > 48);
      app.style.setProperty('--hero-shift', '0px');
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    scroller.addEventListener('scroll', onScroll, {passive: true});
    preference.addEventListener('change', update);
    update();
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      preference.removeEventListener('change', update);
      cancelAnimationFrame(frame);
      app.classList.remove('is-scrolled');
      app.style.removeProperty('--hero-shift');
    };
  }, [enabled, scrollRef]);
}
