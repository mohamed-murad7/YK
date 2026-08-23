/* reveal.js — two scroll-triggered effects, both driven by one observer:
     • [data-reveal]   sections fade and rise the first time they appear
     • .eyebrow--shine section labels sweep their gold highlight once

   The hiding rules for [data-reveal] are scoped to .is-ready on <html>, which
   an inline script in <head> sets before first paint. If JavaScript never runs,
   .is-ready is simply never removed and nothing is hidden; the gold labels stay
   solid, which is their correct resting state. */

(function () {
  'use strict';

  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var shines  = Array.prototype.slice.call(document.querySelectorAll('.eyebrow--shine'));
  if (!reveals.length && !shines.length) return;

  /* Can't observe, or the reader asked for less motion: show everything as-is. */
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.remove('is-ready');
    return;
  }

  function watch(elements, apply, options) {
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        apply(entry.target);
        observer.unobserve(entry.target);
      });
    }, options);
    elements.forEach(function (el) { observer.observe(el); });
  }

  watch(reveals, function (el) { el.classList.add('is-visible'); },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

  watch(shines, function (el) { el.classList.add('is-shining'); },
        { threshold: 0.5 });
})();
