/* accordion.js — the FAQ list.
   Opening one question closes the others, matching the original. Panels are
   real elements toggled with [hidden], so every answer is still in the page
   for search engines and for readers without JavaScript. */

(function () {
  'use strict';

  var triggers = Array.prototype.slice.call(document.querySelectorAll('.qa__trigger'));
  if (!triggers.length) return;

  /* Animate height so the panel slides rather than jumps.
     `after` always runs: once on transitionend, or on a timer if the
     transition never fires (reduced motion, a zero duration, or a second
     click landing mid-animation). Without that fallback a panel could be
     left with display:block but zero height, i.e. invisible but focusable. */
  var DURATION = 400;

  function animate(panel, from, to, after) {
    if (panel._settle) { clearTimeout(panel._settle); panel._settle = null; }

    panel.style.height = from;
    void panel.offsetHeight;                 /* force a reflow */
    panel.style.transition = 'height ' + DURATION + 'ms cubic-bezier(0.44, 0, 0.56, 1)';
    panel.style.height = to;

    function settle() {
      panel.removeEventListener('transitionend', onEnd);
      panel._settle = null;
      panel.style.transition = '';
      panel.style.height = '';
      if (after) after();
    }
    function onEnd(e) { if (e.propertyName === 'height') settle(); }

    panel.addEventListener('transitionend', onEnd);
    panel._settle = setTimeout(settle, DURATION + 80);
  }

  function open(panel) {
    panel.hidden = false;
    animate(panel, '0px', panel.scrollHeight + 'px');
  }

  function close(panel) {
    animate(panel, panel.scrollHeight + 'px', '0px', function () { panel.hidden = true; });
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      var isOpen = trigger.getAttribute('aria-expanded') === 'true';

      /* Collapse whichever one is currently open. */
      triggers.forEach(function (other) {
        if (other === trigger || other.getAttribute('aria-expanded') !== 'true') return;
        var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
        other.setAttribute('aria-expanded', 'false');
        if (otherPanel) close(otherPanel);
      });

      trigger.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) close(panel); else open(panel);
    });
  });
})();
