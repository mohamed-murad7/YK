/* envelope.js — the envelope opens when the reader clicks it, revealing the
   date and countdown, exactly as the original does.

   All the motion is in css/sections/countdown.css. This file only flips the
   .is-open class and keeps the button's aria-expanded state in step, so screen
   readers and keyboard users get the same behaviour as a mouse click. */

(function () {
  'use strict';

  var envelope = document.querySelector('[data-envelope]');
  if (!envelope) return;

  var stage = envelope.querySelector('.envelope__stage');
  var hint  = envelope.querySelector('.envelope__hint');
  if (!stage) return;

  function open() {
    if (envelope.classList.contains('is-open')) return;
    envelope.classList.add('is-open');
    stage.setAttribute('aria-expanded', 'true');
    stage.setAttribute('disabled', '');           /* it only opens once */
    if (hint) hint.textContent = 'The envelope is open';
  }

  stage.addEventListener('click', open);
})();
