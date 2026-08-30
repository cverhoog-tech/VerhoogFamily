'use strict';
// STEP 13.4 — composer toolbar root-cause fix contract.
// Verifies the real fix (canonical .feed-compose-actions container +
// direct-sibling tag buttons) is in place, and that the two dead-code
// workarounds (feedComposerToolbar.js normalize(), feedComposerToolbarFix.css)
// were actually removed rather than left as inert leftovers.
const fs = require('fs');
const assert = require('assert');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function exists(p) { return fs.existsSync(p); }

const html = read('index.html');
const tagging = read('src/modules/feed/feedTagging.js');
const feedJs = read('src/modules/feed/feed.js');
const app = read('api/app.js');

// ------------------------------------------------------------------
// 1. index.html — one real, canonical action container
// ------------------------------------------------------------------
assert.ok(html.includes('class="feed-compose-actions"'),
  'the real composer toolbar must carry the canonical .feed-compose-actions class');

// Extract the toolbar block (from the canonical container open tag to the
// closing feed-compose-card div) so we can assert on sibling order.
const toolbarStart = html.indexOf('class="feed-compose-actions"');
assert.ok(toolbarStart > -1, 'toolbar container not found');
const toolbarBlock = html.slice(toolbarStart, html.indexOf('</div>\n  </div>', toolbarStart));

assert.ok(!/>GIF</.test(toolbarBlock) && !toolbarBlock.includes('openGifPicker()'),
  'GIF button must be permanently removed from the static composer markup');
assert.ok(!toolbarBlock.includes('toggleStickerPicker()') && !toolbarBlock.includes('>\u{1F60A}<'),
  'emoji/sticker button must be permanently removed from the static composer markup');
assert.ok(!/style="flex:1"/.test(toolbarBlock),
  'the old flex:1 spacer div must be removed — Posten is pushed right via canonical CSS, not a spacer sibling');

// Photo, pin and Posten must appear in this order inside the container
// (member/recipe tag buttons are inserted between pin and Posten at runtime
// by feedTagging.js — see part 2).
const photoIdx = toolbarBlock.indexOf('\u{1F4F7}');
const pinIdx = toolbarBlock.indexOf('\u{1F4CC}');
const postIdx = toolbarBlock.indexOf('id="feed-send-btn"');
assert.ok(photoIdx > -1 && pinIdx > -1 && postIdx > -1, 'photo, pin and Posten controls must all be present');
assert.ok(photoIdx < pinIdx && pinIdx < postIdx,
  'static markup order must be photo, pin, ..., Posten (Posten last)');

// ------------------------------------------------------------------
// 2. feedTagging.js — tag buttons inserted as direct siblings, no wrapper
// ------------------------------------------------------------------
assert.ok(!tagging.includes('feed-tag-tools'),
  'the old #feed-tag-tools wrapper div must be gone — buttons are inserted as direct siblings now');
assert.ok(!tagging.includes('removeBrokenComposerActions'),
  'the runtime GIF/emoji removal shim is superfluous now the buttons are gone from markup, and must be removed');
assert.ok(!tagging.includes(".compose-actions,.feed-compose-actions") && !tagging.includes("querySelector('.compose-actions"),
  'decorateComposer must no longer probe a class that never existed on the real toolbar');
assert.ok(tagging.includes("card.querySelector('.feed-compose-actions')"),
  'decorateComposer must target the canonical .feed-compose-actions container directly');
assert.ok(tagging.includes("id='feed-tag-member-btn'") || tagging.includes('feed-tag-member-btn'),
  'member tag button must be inserted with a stable id');
assert.ok(tagging.includes('feed-tag-recipe-btn'),
  'recipe tag button must be inserted with a stable id');
assert.ok(tagging.includes("actions.insertBefore(memberBtn,post)") && tagging.includes("actions.insertBefore(recipeBtn,post)"),
  'tag buttons must be inserted directly before the Posten button as siblings, not wrapped');

// ------------------------------------------------------------------
// 3. feed.js — canonical layout CSS lives in the existing Feed stylesheet,
//    not bolted onto feedTagging.js (which owns tagging behaviour, not layout)
// ------------------------------------------------------------------
assert.ok(feedJs.includes('.feed-compose-actions{display:flex'),
  'canonical composer action-row layout must live in the existing Feed CSS (installFeedCSS), not a separate patch file');
assert.ok(feedJs.includes('flex-wrap:nowrap'),
  'the canonical action row must be explicitly flex-wrap:nowrap');
assert.ok(feedJs.includes('#feed-send-btn{margin-left:auto'),
  'Posten must be pushed right via margin-left:auto on the button itself, not a spacer sibling');

assert.ok(!tagging.includes('.feed-compose-actions{'),
  'feedTagging.js must not own the composer action-row layout rules (responsibility now lives in feed.js)');

// ------------------------------------------------------------------
// 4. Dead workaround files must actually be gone, not just unreferenced
// ------------------------------------------------------------------
assert.ok(!exists('src/modules/feed/feedComposerToolbar.js'),
  'feedComposerToolbar.js (dead-code normalize() that never matched a real selector) must be deleted');
assert.ok(!exists('src/styles/feedComposerToolbarFix.css'),
  'feedComposerToolbarFix.css (dead CSS targeting a class that never existed) must be deleted');

// ------------------------------------------------------------------
// 5. api/app.js — loader must not inject the deleted files, and must
//    cache-bust the changed runtime files for iOS Safari
// ------------------------------------------------------------------
assert.ok(!app.includes('feedComposerToolbar.js'),
  'app.js must no longer inject the deleted feedComposerToolbar.js script');
assert.ok(!app.includes('feedComposerToolbarFix.css'),
  'app.js must no longer inject the deleted feedComposerToolbarFix.css stylesheet');
const tagCacheBust = app.match(/feedTagging\.js\?v=(\d+)/);
assert.ok(tagCacheBust && Number(tagCacheBust[1]) >= 4,
  'feedTagging.js cache-bust must remain at or beyond the fixed revision (iOS Safari caches aggressively)');
assert.ok(app.includes('feed.js?v=7'),
  'feed.js cache-bust must be bumped since its stylesheet block changed');

console.log('STEP 13.4 composer toolbar root-cause fix contract: PASS');
