/* closing.js — the two entrances in the closing section.

     • the hands reach for each other as the section arrives
     • the signature writes itself on, left to right

   Each has its own trigger, because they sit far apart vertically: the hands
   are at the top of a 1115px section, the signature two thirds of the way
   down. Sharing one trigger would mean the signature finished writing long
   before anyone had scrolled far enough to see it.

   All the motion is CSS (css/sections/closing.css). This file only adds the
   classes, once each. If IntersectionObserver is missing or the reader prefers
   reduced motion, the .is-ready flag is dropped instead, which leaves the
   hands joined and the signature whole, with no animation at all. */

(function () {
  'use strict';

  var closing = document.querySelector('.closing');
  if (!closing) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.remove('is-ready');
    return;
  }

  /* Add `className` to `target` the first time it scrolls into view. */
  function onceInView(target, className, threshold) {
    if (!target) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(className);
        observer.unobserve(entry.target);
      });
    }, { threshold: threshold });
    observer.observe(target);
  }

  onceInView(closing, 'is-reaching', 0.2);
  onceInView(closing.querySelector('.closing__signature'), 'is-writing', 0.35);
})();
