/* schedule.js — fills each timeline rail as its slot scrolls past.
   Sets a --progress custom property from 0 to 1; the height is worked out in
   CSS (see css/sections/schedule.css). Reads are batched into one rAF frame so
   scrolling stays smooth. */

(function () {
  'use strict';

  var slots = Array.prototype.slice.call(document.querySelectorAll('.slot'));
  if (!slots.length) return;

  /* Reduced motion: show every rail filled rather than animating on scroll. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slots.forEach(function (slot) { slot.style.setProperty('--progress', '1'); });
    return;
  }

  var queued = false;

  function update() {
    queued = false;
    var viewportH = window.innerHeight;

    slots.forEach(function (slot) {
      var rect = slot.getBoundingClientRect();

      /* 0 when the slot's top reaches 85% of the viewport height,
         1 by the time it has travelled up to 35%. */
      var start = viewportH * 0.85;
      var end   = viewportH * 0.35;
      var p = (start - rect.top) / (start - end);

      if (p < 0) p = 0; else if (p > 1) p = 1;
      slot.style.setProperty('--progress', p.toFixed(3));
    });
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
