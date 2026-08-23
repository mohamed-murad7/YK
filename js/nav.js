/* nav.js — small-screen menu toggle.
   The panel is plain markup that starts [hidden], so with JavaScript off the
   navigation links are still reachable from the footer and in-page anchors. */

(function () {
  'use strict';

  var burger = document.querySelector('.nav__burger');
  var panel  = document.getElementById('mobile-menu');
  if (!burger || !panel) return;

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.classList.toggle('is-open', open);
    panel.hidden = !open;
  }

  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  /* Close after tapping a link, and on Escape. */
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });

  /* The panel is a small-screen affordance only — collapse it if the viewport
     grows past the breakpoint while it happens to be open. */
  window.matchMedia('(min-width: 810px)').addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
})();
