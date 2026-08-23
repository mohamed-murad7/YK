/**
 * RSVP endpoint — Yara & Kareem
 * ===========================================================================
 * Receives replies from the wedding site's RSVP form and appends them as rows
 * to this spreadsheet. Nothing passes through a third-party service: the data
 * goes from the guest's browser straight into your own Google account.
 *
 * HOW TO INSTALL
 *
 *   1. Open the Google Sheet that should collect the replies.
 *   2. Extensions > Apps Script.
 *   3. Delete everything in the editor and paste this whole file. Save.
 *   4. Deploy > New deployment > (gear icon) Web app
 *          Description:      RSVP endpoint
 *          Execute as:       Me
 *          Who has access:   Anyone
 *
 *      "Anyone" is required. "Anyone with a Google account" makes guests sign
 *      in to Google before they can reply, which most of them will not do.
 *
 *   5. Google asks for authorisation the first time — allow it. The warning
 *      screen appears because the script is yours and unverified; click
 *      Advanced > Go to (project name).
 *   6. Copy the deployment URL. It ends in /exec. Paste it into ENDPOINT at the
 *      top of js/rsvp-form.js on the site.
 *
 * TO CHECK IT WORKS
 *   Open the /exec URL in a browser. You should see {"ok":true,...}. Then send
 *   a test reply from the site and watch a row appear in the sheet.
 *
 * AFTER EDITING THIS FILE
 *   Deploy > Manage deployments > (pencil) > Version: New version > Deploy.
 *   Editing alone does not update the live URL.
 * ===========================================================================
 */

/* --------------------------------------------------------------------------
   Settings
   -------------------------------------------------------------------------- */

/** Tab the replies are written to. Created automatically if missing. */
var SHEET_NAME = 'RSVPs';

/** Leave '' for no email. Otherwise every reply is also emailed here. */
var NOTIFY_EMAIL = '';

/**
 * Columns, in order. The names on the left must match the form field names in
 * rsvp.html exactly; the text on the right is only the column heading, so
 * translate those freely.
 */
var COLUMNS = [
  { field: 'Attending',          heading: 'Attending' },
  { field: 'Which Side',         heading: 'Side' },
  { field: 'Name',               heading: 'Full name' },
  { field: 'Phone',              heading: 'Phone / WhatsApp' },
  /* Multi-select. The site joins the ticked events with commas, so this arrives
     as one string like "Wedding Ceremony, After Party". */
  { field: 'Event',              heading: 'Events' },
  { field: 'No. of Guests',      heading: 'Guests' },
  { field: 'Message for Couple', heading: 'Message' }
];

/* --------------------------------------------------------------------------
   Handlers
   -------------------------------------------------------------------------- */

/** The form posts here. */
function doPost(e) {
  try {
    var data = parseBody(e);

    /* The form carries a hidden "website" field that people never see. If it
       has a value, a bot filled the form in. Answer ok so it stops retrying,
       but write nothing. */
    if (data.website) return reply({ ok: true, spam: true });

    /* Ignore a completely empty post rather than adding a blank row. */
    if (!data.Name && !data.Phone && !data.Attending) {
      return reply({ ok: false, error: 'empty submission' });
    }

    appendRow(data);
    if (NOTIFY_EMAIL) notify(data);

    return reply({ ok: true });
  } catch (err) {
    /* Logged under Executions in the Apps Script editor. */
    console.error(err);
    return reply({ ok: false, error: String(err) });
  }
}

/** Visiting the URL in a browser — handy for confirming the deployment is up. */
function doGet() {
  return reply({ ok: true, endpoint: 'rsvp', sheet: SHEET_NAME });
}

/* --------------------------------------------------------------------------
   Internals
   -------------------------------------------------------------------------- */

/**
 * The site sends JSON with a text/plain content type, which is what lets the
 * request skip the CORS preflight that Apps Script cannot answer. Form-encoded
 * posts are accepted too, so the endpoint still works from a plain HTML form.
 */
function parseBody(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* fall through */ }
  }
  return (e && e.parameter) ? e.parameter : {};
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function appendRow(data) {
  var sheet = getSheet();

  /* First reply also writes the header row. */
  if (sheet.getLastRow() === 0) {
    var headings = ['Received'];
    for (var i = 0; i < COLUMNS.length; i++) headings.push(COLUMNS[i].heading);
    sheet.appendRow(headings);
    sheet.getRange(1, 1, 1, headings.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(headings.length, 420);   /* the message column */
  }

  var row = [new Date()];
  for (var j = 0; j < COLUMNS.length; j++) {
    var value = data[COLUMNS[j].field];
    row.push(value === undefined || value === null ? '' : String(value));
  }

  /* A lock keeps two guests replying at the same second from landing on the
     same row. */
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function notify(data) {
  var lines = [];
  for (var i = 0; i < COLUMNS.length; i++) {
    var value = data[COLUMNS[i].field];
    if (value) lines.push(COLUMNS[i].heading + ': ' + value);
  }
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'RSVP from ' + (data.Name || 'a guest'),
    body: lines.join('\n') + '\n\n— sent by the wedding site'
  });
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
