/* rsvp-form.js — two-step RSVP form: step navigation, validation, submission.
   ==========================================================================
   WHERE DO REPLIES GO?  ->  a Google Sheet you own

   ONE THING TO DO before the form is live: paste the Apps Script Web App URL
   into ENDPOINT below. Nothing else needs changing.

   Setup, once (about five minutes) — full walkthrough in README.md:

     1. Make a new Google Sheet. Name it whatever you like.
     2. In the Sheet: Extensions > Apps Script.
     3. Delete whatever is in the editor and paste the whole contents of
        google-apps-script/rsvp-endpoint.gs from this project. Save.
     4. Deploy > New deployment > (gear) Web app.
          Execute as:      Me
          Who has access:  Anyone          <-- must be "Anyone", not "Anyone with
                                               a Google account", or guests get
                                               a sign-in page instead of a form.
     5. Authorise it when Google asks. Copy the deployment URL — it ends in
        /exec — and paste it between the quotes below.

   Replies then land as rows in the sheet, and nothing passes through any third
   party: the data goes from the guest's browser straight to your own Google
   account.

   Until ENDPOINT is filled in the form still validates properly and then tells
   the guest it is not connected yet, rather than silently losing a reply.

   Using something else instead? Any URL that accepts a POST works — put it in
   ENDPOINT and set SEND_AS to 'json' (Formspree, Basin, Getform, your own
   handler). Apps Script needs 'text', for the reason noted at the fetch call.
   ========================================================================== */

(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzPHFVg7cwpdOJTaykqTeWACRPXaHnHZ-YC0iz-4q_toIsLCyzJRiNF8Uel9EyMxROH/exec';       /* <-- paste your Apps Script /exec URL here */
  var SEND_AS  = 'text';   /* 'text' for Google Apps Script, 'json' for others */

  var form = document.getElementById('rsvp-form');
  if (!form) return;

  var steps   = Array.prototype.slice.call(form.querySelectorAll('.rsvp-form__step'));
  var dots    = Array.prototype.slice.call(form.querySelectorAll('.rsvp-form__dots li'));
  var prevBtn = form.querySelector('.rsvp-form__prev');
  var nextBtn = form.querySelector('.rsvp-form__next');
  var sendBtn = form.querySelector('.rsvp-form__submit');
  var status  = form.querySelector('.rsvp-form__status');
  var current = 0;

  /* ---------------------------------------------------------------- pills */
  /* Mirror :checked onto the label so the styling also works without :has(). */
  function syncPills() {
    form.querySelectorAll('.pill').forEach(function (pill) {
      var input = pill.querySelector('input');
      pill.classList.toggle('is-checked', !!(input && input.checked));
    });
  }
  form.addEventListener('change', syncPills);
  syncPills();

  /* ------------------------------------------------------------ stepping */
  function show(index) {
    current = index;
    steps.forEach(function (step, i) {
      step.hidden = i !== index;
      step.classList.toggle('is-active', i === index);
    });
    dots.forEach(function (dot, i) { dot.classList.toggle('is-current', i === index); });

    var last = index === steps.length - 1;
    prevBtn.hidden = index === 0;
    nextBtn.hidden = last;
    sendBtn.hidden = !last;

    setStatus('');
    var firstField = steps[index].querySelector('input, textarea');
    if (firstField) firstField.focus({ preventScroll: true });
  }

  function setStatus(message, kind) {
    status.textContent = message || '';
    status.className = 'rsvp-form__status' + (kind ? ' is-' + kind : '');
  }

  /* ---------------------------------------------------------- validation */
  function fieldOf(input) { return input.closest('.field'); }

  /* Returns true when every required answer inside `step` is present. */
  function validate(step) {
    var ok = true;
    var seenGroups = {};

    step.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-invalid'); });

    step.querySelectorAll('[required]').forEach(function (input) {
      /* Radios and checkboxes are both judged per group: at least one ticked.
         Checkboxes are handled here too so marking the events question required
         later just works. */
      if (input.type === 'radio' || input.type === 'checkbox') {
        if (seenGroups[input.name]) return;
        seenGroups[input.name] = true;
        var chosen = form.querySelector('input[name="' + input.name + '"]:checked');
        if (!chosen) { fieldOf(input).classList.add('is-invalid'); ok = false; }
      } else if (!input.value.trim()) {
        fieldOf(input).classList.add('is-invalid');
        ok = false;
      }
    });

    if (!ok) setStatus('Please complete the highlighted answers.', 'error');
    return ok;
  }

  nextBtn.addEventListener('click', function () {
    if (!validate(steps[current])) return;
    if (current < steps.length - 1) show(current + 1);
  });

  prevBtn.addEventListener('click', function () {
    if (current > 0) show(current - 1);
  });

  /* Clear the error styling as soon as the reader starts fixing it. */
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f) f.classList.remove('is-invalid');
  });

  /* ---------------------------------------------------------- submission */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Every step must be valid, not just the visible one. */
    for (var i = 0; i < steps.length; i++) {
      if (!validate(steps[i])) { show(i); return; }
    }

    /* Spam trap filled in means a bot. Pretend success and drop it. */
    if (form.elements.website && form.elements.website.value) {
      succeed();
      return;
    }

    if (!ENDPOINT) {
      setStatus('This form is not connected yet — add your Apps Script URL in js/rsvp-form.js.', 'error');
      return;
    }

    /* Apps Script answers a POST with a redirect to another Google domain, and a
       browser refuses to follow a cross-origin redirect from a page opened
       straight off the disk. Submitting would fail however correct the endpoint
       is, so say what is actually wrong instead of blaming the connection. */
    if (location.protocol === 'file:') {
      setStatus('Open the site through a local server — VS Code’s Live Server, or your real hosting. ' +
                'A page opened directly from disk (file://) cannot submit this form.', 'error');
      return;
    }

    var data = new FormData(form);
    data.delete('website');

    /* One key can legitimately appear more than once: "Which events will you
       attend?" is a checkbox group, so a guest coming to two events sends
       "Event" twice. Join repeats instead of letting the last one overwrite the
       rest, which keeps every answer in a single column in the sheet. */
    var payload = {};
    data.forEach(function (value, key) {
      payload[key] = Object.prototype.hasOwnProperty.call(payload, key)
        ? payload[key] + ', ' + value
        : value;
    });

    sendBtn.disabled = true;
    setStatus('Sending…');

    /* Content type matters here. A JSON content type makes this a "preflighted"
       cross-origin request, and Apps Script cannot answer the OPTIONS probe the
       browser sends first — so the reply would never arrive. text/plain keeps it
       a simple request that goes straight through; the body is still JSON and
       the script parses it the same way. */
    var options = SEND_AS === 'text'
      ? { method: 'POST', redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload) }
      : { method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload) };

    fetch(ENDPOINT, options)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (body) {
        /* The script answers {"ok":true}. Anything else means it ran but could
           not write the row, which is worth telling the guest about. */
        var ok = true;
        try { ok = JSON.parse(body).ok !== false; } catch (e) { /* not JSON: assume sent */ }
        if (!ok) throw new Error('rejected');
        succeed();
      })
      .catch(function () {
        sendBtn.disabled = false;
        setStatus('Sorry — that did not go through. Please try again, or send us a WhatsApp message instead.', 'error');
      });
  });

  function succeed() {
    var thanks = document.createElement('div');
    thanks.className = 'rsvp-form__thanks';
    thanks.innerHTML = '<h1>Thank you</h1><p>Your reply is in. We cannot wait to celebrate with you.</p>' +
                       '<p><a class="rsvp-form__prev" href="index.html">Back to the invitation</a></p>';
    form.classList.add('is-sent');
    setStatus('');
    form.appendChild(thanks);
  }

  show(0);
})();
