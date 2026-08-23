/* countdown.js — counts down to the wedding day, shown inside the envelope.
   ------------------------------------------------------------------------
   TARGET is pinned to Egypt time (+03:00 in July) on purpose. Without the
   offset the browser would read it as the guest's own local midnight, so a
   guest abroad would see a different number of days left than one in Cairo.
   With it, everyone counts down to the same moment.

   If you change the date, change the one printed on the card too — that is
   the .envelope__date line in index.html.
   ------------------------------------------------------------------------ */

(function () {
  'use strict';

  var TARGET = '2027-07-17T00:00:00+03:00';   /* Saturday 17 July 2027, Cairo */
  var FINISHED_TEXT = 'Countdown finished!';

  var el = document.querySelector('[data-countdown]');
  if (!el) return;

  var target = new Date(TARGET).getTime();
  if (isNaN(target)) return;

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function render() {
    var remaining = target - Date.now();

    if (remaining <= 0) {
      el.textContent = FINISHED_TEXT;
      return false;
    }

    var totalSeconds = Math.floor(remaining / 1000);
    var days    = Math.floor(totalSeconds / 86400);
    var hours   = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    el.textContent = days > 0
      ? plural(days, 'day') + ' ' + plural(hours, 'hour')
      : hours > 0
        ? plural(hours, 'hour') + ' ' + plural(minutes, 'minute')
        : plural(minutes, 'minute') + ' ' + plural(seconds, 'second');

    return true;
  }

  if (render()) {
    var timer = setInterval(function () {
      if (!render()) clearInterval(timer);
    }, 1000);
  }
})();
