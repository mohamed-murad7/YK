# Yara & Kareem — wedding invitation

A static website. No build step, no package manager, no dependencies. Open the
folder in VS Code, edit a file, refresh the browser.

---

## Running it locally

Anything that serves static files works. With VS Code, the **Live Server**
extension is the easiest option — right-click `index.html` → *Open with Live
Server*.

Opening `index.html` directly from the file system also mostly works, but
some browsers refuse to load fonts over `file://`, so prefer a local server.

---

## What lives where

```
index.html          The whole one-page invitation. One commented block per
                    section, in the order they appear on screen.
rsvp.html           The two-step RSVP form.

css/
  base.css          Fonts, design tokens, reset, shared typography.
                    START HERE for colours and type sizes.
  components.css    Things used in more than one place: buttons, the
                    navigation bar, photo cards, the FAQ accordion.
  rsvp-page.css     The RSVP page only.
  sections/         One file per section of the home page, named to match.

js/                 One small file per behaviour. All plain JavaScript.
  nav.js            Small-screen menu.
  countdown.js      The countdown on the envelope.
  envelope.js       Opens the envelope when you click it.
  schedule.js       Fills the timeline rails as you scroll.
  accordion.js      The FAQ.
  closing.js        Starts the two hands reaching for each other.
  reveal.js         Fades sections in, and sweeps the gold labels, on scroll.
  rsvp-form.js      Form steps, validation, submission.  <-- needs setup

assets/
  fonts/            Self-hosted woff2. Nothing is fetched from Google.
  images/           WebP, most in a small and a large version for retina.
  icons/            Favicon, Apple touch icon, social sharing image.
```

### The envelope, layer by layer

The "save the date" envelope is five flat images stacked in one box. Clicking it
adds `.is-open`, which lifts the flap, slides the card up and fades the seal
out. Filenames say what each piece actually is:

| File | What it is |
| --- | --- |
| `envelope-body` | the envelope front, side flaps meeting in a V |
| `envelope-flap` | the scalloped gold-edged front flap (flipped vertically) |
| `envelope-flap-open` | the underside of the lifted flap, linen-lined |
| `envelope-card` | the deckle-edged paper the date is printed on |
| `wax-seal` | the seal, which "breaks" when it opens |

Every offset in `css/sections/countdown.css` is a multiple of `--env-w`, the
envelope's width, so changing that one value rescales the whole assembly.

### The hands reaching (closing section)

The two hands start tilted and pushed apart, then rotate level and slide
together when the section scrolls into view — about two seconds, on a spring
that moves fast then eases into stillness.

The starting pose lives in `css/sections/closing.css`:

```css
.is-ready .closing__hand--left  { transform: translateX(-37.4%) rotate(11deg); }
.is-ready .closing__hand--right { transform: translate(28.2%, 21.1%) rotate(20deg); }
```

Both offsets are percentages of each image's own size, so the gesture scales
with the section instead of drifting on a phone. The finished pose is simply
`transform: none`, which is also what you get with JavaScript disabled or
reduced motion switched on — the hands render already joined, no animation.

The easing is `--ease-reach` in `css/base.css`. Its stops were sampled from the
original frame by frame, so the motion matches rather than merely resembles it.
To make the whole thing quicker or slower, change `--dur-reach` (currently
`2.02s`) — nothing else needs touching.

### The signature writing itself on

"Yara & Kareem" is not simply there — it writes on left to right over about two
seconds as it scrolls into view, like handwriting appearing. The original does
this with an SVG mask whose rectangle grows; here it is a horizontal clip, which
keeps the signature as real, selectable, editable text instead of a picture of
text.

```html
<p class="closing__signature"><span class="closing__signature-ink">Yara &amp; Kareem</span></p>
```

The clip is on the inner `span`, and that split is load-bearing: clipping an
element also collapses its own IntersectionObserver ratio, so if the clip sat on
`.closing__signature` the observer watching it could never fire and the wipe
would never start. The outer `<p>` stays unclipped and is what gets watched.

Timing is `--dur-write` / `--ease-write` in `css/base.css`, sampled from the
original the same way as the hands. The vertical insets are negative so the
script's swashes and descenders are never clipped — only the right edge sweeps.

Three things about this section are deliberate and easy to "fix" by mistake:

- **`.closing` is `overflow: visible`.** The bride's hand reaches 209px above
  the section and is meant to be seen against the pale band above it. Setting
  `overflow: hidden` here chops her hand off at the section edge. Sideways
  spill during the reach is caught by `html { overflow-x: clip }` in base.css.
- **`.closing` has `margin-top: 190px`.** That band is what her hand reaches
  into. Remove it and the hand lands on top of the last FAQ row.
- **Each hand is anchored to the edge it bleeds off** — `left: 0` for his,
  `right: 0` for hers — not positioned with a percentage offset from the left.
  A left offset has to add up to exactly 100% with the width, and when the
  percentages round even a little short you get a thin strip of background
  showing down the right edge of the photograph.

---

## Common edits

### Change a colour or a font size

Everything is a token at the top of `css/base.css` under `:root`. Change it
once and it updates everywhere.

```css
--c-sage: #6f7e62;   /* buttons, the signature */
--c-gold: #cdb371;   /* the small labels above headings */
--fs-heading: 42px;  /* section headings */
```

### Change wording

All text is directly in `index.html` and `rsvp.html`. Search for the words you
want to change. There is no CMS and no data file to hunt through.

Note that buttons and navigation links deliberately contain their label
**twice** — that is what makes the hover effect slide one label out while the
other slides in. Change both copies.

```html
<span class="btn__labels"><span>Submit RSVP</span><span>Submit RSVP</span></span>
```

### Change the couple's names in the hero

Edit the `<h1 class="hero__title">`. The type is sized as a percentage of the
caption width so it always spans the frame; if a much longer or shorter name
no longer reaches the edges, nudge this single number in
`css/sections/hero.css`:

```css
.hero__title { font-size: 15.3494cqw; }
```

### Add or remove a schedule entry / FAQ question / guest-info block

Copy an existing `<li class="slot">`, `<div class="qa">` or
`<li class="detail">` and edit the text. The layout alternates sides
automatically using `:nth-child(even)`, so you do not need to set anything.

For a new FAQ item, give the panel a fresh `id` and point the button's
`aria-controls` at it.

### Move a story card

Each memory in "How it started" positions its three pieces — photo card, note,
wax stamp — from a single anchor. Change the two values at the top of the
memory's rule in `css/sections/story.css` and everything moves together:

```css
.memory:nth-child(2) {
  --photo-x: 551px;   /* how far right the photo card sits */
  --photo-y: -74px;   /* and how far up */
}
```

---

## One thing that still needs your input

### 1. The RSVP form is not connected yet

Replies go into a Google Sheet you own. Nothing passes through a third-party
service — the data goes from the guest's browser straight into your Google
account. Setup takes about five minutes, once.

**Step 1.** Make a new Google Sheet. Name it whatever you like.

**Step 2.** In that sheet: **Extensions → Apps Script**.

**Step 3.** Delete whatever is in the editor, and paste the entire contents of
`google-apps-script/rsvp-endpoint.gs` from this project. Save (Ctrl+S).

**Step 4.** **Deploy → New deployment**, click the gear icon and pick
**Web app**, then set:

| | |
| --- | --- |
| Description | `RSVP endpoint` |
| Execute as | **Me** |
| Who has access | **Anyone** |

> "Who has access" must be **Anyone** — not "Anyone with a Google account".
> The second one makes guests sign in to Google before they can reply, and most
> of them won't.

**Step 5.** Google will ask for authorisation the first time. It shows a
warning because the script is yours and unverified: click **Advanced → Go to
(project name) → Allow**.

**Step 6.** Copy the deployment URL. It ends in `/exec`. Paste it into
`js/rsvp-form.js`:

```js
var ENDPOINT = 'https://script.google.com/macros/s/AKfy…/exec';
```

**To check it worked:** open that `/exec` URL in a browser — you should see
`{"ok":true,"endpoint":"rsvp","sheet":"RSVPs"}`. Then send a test reply from the
site and watch a row appear in the sheet.

> **Test it through a local server, not `file://`.** Apps Script answers a POST
> with a redirect to another Google domain, and browsers refuse to follow a
> cross-origin redirect from a page opened straight off the disk. The form
> detects this and says so, rather than looking broken.

**If the reply does not arrive**, in order of likelihood:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Opening the `/exec` URL shows "Access denied" / 403 | "Who has access" is not **Anyone** | Deploy → Manage deployments → pencil → set it to Anyone → **Version: New version** → Deploy |
| The form says to use a local server | the page is on `file://` | serve it over `http://` (Live Server) |
| `/exec` shows `{"ok":false,…}` | the script ran but could not write | check Executions in the Apps Script editor for the error |
| `/exec` shows a Google sign-in page | access is "Anyone with a Google account" | same fix as the 403 row |

Changing the access setting alone is not enough — you have to deploy a **new
version** for it to take effect. The URL stays the same.

The first reply also creates the header row and an `RSVPs` tab automatically.
Want an email for each reply as well? Put your address in `NOTIFY_EMAIL` near
the top of the script.

Until `ENDPOINT` is filled in, the form validates properly and then tells the
guest it is not connected, rather than silently losing their reply.

**If you ever edit the script**, changes don't go live until you redeploy:
**Deploy → Manage deployments → pencil icon → Version: New version → Deploy.**
The URL stays the same.

**Prefer a hosted service instead?** Any URL that accepts a POST works — put it
in `ENDPOINT` and change `SEND_AS` to `'json'`. Formspree, Basin, Getform and
Web3Forms all fit. Google Apps Script specifically needs `'text'`; the reason is
commented at the `fetch` call.

---

## Changing the wedding date

The date lives in two places and both need to agree:

- `TARGET` in `js/countdown.js` — currently `'2027-07-17T00:00:00+03:00'`
- the printed date in `index.html`, on the `class="envelope__date"` line —
  currently `July 17th, 2027`

The `+03:00` on the end is deliberate. It pins the countdown to Egypt time, so a
guest in London and a guest in Cairo both see the same number of days left.
Without it the browser would read the date as the guest's own local midnight and
the two would disagree.

If you also change the day of the week, the hero line in `index.html`
("Saturday 17th Jul, 2027") and the guest-information dates are separate text
and need editing by hand.

---

## Wording corrected from the previous version

These were leftovers from the Framer template, all now fixed:

| Where | Was | Now |
| --- | --- | --- |
| Accommodation block | booking code "OLIVIA & DANIEL" | "YARA & KAREEM" |
| Third story card | "**Daniel** planned… **Olivia** said yes" | "Kareem planned… Yara said yes" |
| Navigation | "Shedule" | "Schedule" |
| FAQ label | "FREQUESNTLY ASKED QUESTIONS" | "FREQUENTLY…" |
| FAQ, RSVP deadline | "by August 1, 2027" | "by July 1, 2027" |
| Accommodation deadline | "book by August 12, 2027" | "book by July 12, 2027" |

The last two both fell **after** the wedding. The day numbers are unchanged —
only the month moved — so the sequence now reads: RSVP by 1 July, book your room
by 12 July, wedding 17 July. The FAQ answer also matches the "RSVP by Jul 1"
line on the invitation, which it previously contradicted.

### The events question is multi-select

"Which events will you attend?" was radio buttons in the original, so a guest
could only pick one. It is now checkboxes: guests tick as many as apply, and can
untick to change their mind (radios cannot be unticked).

All four keep `name="Event"`, so several answers arrive under one key and
`js/rsvp-form.js` joins them with commas before sending. A guest coming to two
events lands in the sheet as a single cell:

```
Event  ->  Wedding Ceremony, After Party
```

That keeps one column per question. If you would rather have a separate column
per event, give each input its own `name` and add them to `COLUMNS` in
`google-apps-script/rsvp-endpoint.gs`.

The question is not required, so a guest can leave it blank. To insist on at
least one, add `required` to any one of the four inputs — the validation already
handles checkbox groups.

### Still your call

"The Willow Estate" and "Sonoma Valley, California" are the template's venue,
not a typo — change them wherever they appear in `index.html` when you have the
real venue.

---

## Browser support

Modern evergreen browsers. Two progressive niceties degrade gracefully:

- The hero type uses container query units, with a viewport-based fallback.
- The gold shimmer on section labels uses `background-clip: text`, falling back
  to solid gold.

Reduced-motion preferences are respected throughout: scroll reveals, the
envelope and the timeline rails all settle into their finished state instead of
animating.
