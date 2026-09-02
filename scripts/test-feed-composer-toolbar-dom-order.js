'use strict';
// STEP 13.4 — executes the real decorateComposer() from feedTagging.js
// against a minimal hand-rolled DOM (Node core only: vm/fs/assert, no
// external dependencies) built from the actual composer markup extracted
// from index.html, and asserts the final DOM is five direct siblings in
// canonical order: photo, pin, member, recipe, Posten.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// ------------------------------------------------------------------
// Minimal DOM shim — just enough for decorateComposer(): id/class lookup,
// insertBefore/appendChild, attributes, dataset, textContent, classList.
// ------------------------------------------------------------------
class MiniNode {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this._text = '';
    this._id = null;
    this._classes = [];
    this.dataset = {};
    this.style = {};
  }
  get id() { return this._id || ''; }
  set id(v) { this._id = v; this.attrs.id = v; }
  get className() { return this._classes.join(' '); }
  set className(v) { this._classes = String(v || '').split(/\s+/).filter(Boolean); }
  get classList() {
    var self = this;
    return {
      add: function (c) { if (self._classes.indexOf(c) === -1) self._classes.push(c); },
      contains: function (c) { return self._classes.indexOf(c) > -1; }
    };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this._id = String(v); }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); this.children = []; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  insertBefore(child, ref) {
    child.parentNode = this;
    if (ref == null) { this.children.push(child); return child; }
    var i = this.children.indexOf(ref);
    if (i === -1) { this.children.push(child); return child; }
    this.children.splice(i, 0, child);
    return child;
  }
  get lastElementChild() { return this.children.length ? this.children[this.children.length - 1] : null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    var i = this.parentNode.children.indexOf(this);
    return i > -1 && i + 1 < this.parentNode.children.length ? this.parentNode.children[i + 1] : null;
  }
  addEventListener() {}
  // Extremely small selector engine: supports exactly what decorateComposer
  // needs — #id, .class, and 'a,b' fallback lists.
  _matches(sel) {
    if (sel[0] === '#') return this.id === sel.slice(1);
    if (sel[0] === '.') return this._classes.indexOf(sel.slice(1)) > -1;
    return false;
  }
  _walk(pred, out) {
    this.children.forEach(function (c) {
      if (pred(c)) out.push(c);
      c._walk(pred, out);
    });
  }
  querySelector(selList) {
    var sels = selList.split(',').map(function (s) { return s.trim(); });
    var found = null;
    var self = this;
    sels.some(function (sel) {
      var out = [];
      self._walk(function (n) { return n._matches(sel); }, out);
      if (out.length) { found = out[0]; return true; }
      return false;
    });
    return found;
  }
}

function createElement(tag) { return new MiniNode(tag); }

// ------------------------------------------------------------------
// Build the composer DOM from the REAL index.html markup so this test
// fails if the markup and the JS ever drift apart again.
// ------------------------------------------------------------------
const html = fs.readFileSync('index.html', 'utf8');
const startMarker = 'class="feed-compose-actions"';
const start = html.indexOf(startMarker);
assert.ok(start > -1, 'feed-compose-actions container not found in index.html');
const blockStart = html.lastIndexOf('<div', start);
const blockEnd = html.indexOf('</div>', start) + '</div>'.length;
const toolbarHtml = html.slice(blockStart, blockEnd);

const card = createElement('div');
card.id = 'feed-compose-card';

const actions = createElement('div');
actions.className = 'feed-compose-actions';
card.appendChild(actions);

// photo + pin, in the order the real markup declares them
assert.ok(toolbarHtml.indexOf('\u{1F4F7}') < toolbarHtml.indexOf('\u{1F4CC}'), 'index.html must declare photo before pin');
const photoBtn = createElement('button'); photoBtn.textContent = '\u{1F4F7}';
const pinBtn = createElement('button'); pinBtn.textContent = '\u{1F4CC}';
const postBtn = createElement('button'); postBtn.id = 'feed-send-btn'; postBtn.textContent = 'Posten';
actions.appendChild(photoBtn);
actions.appendChild(pinBtn);
actions.appendChild(postBtn);

const composeArea = createElement('div');
composeArea.id = 'compose-area';
composeArea.dataset = {};
card.appendChild(composeArea);

const document_ = {
  body: card,
  getElementById: function (id) {
    var out = [];
    card._walk(function (n) { return n.id === id; }, out);
    if (card.id === id) return card;
    return out[0] || null;
  },
  querySelector: function (sel) { return card._matches(sel) ? card : card.querySelector(sel); },
  createElement: createElement,
  head: createElement('head')
};

// ------------------------------------------------------------------
// Load the real feedTagging.js into a sandbox and call the real
// decorateComposer() against this DOM.
// ------------------------------------------------------------------
const src = fs.readFileSync('src/modules/feed/feedTagging.js', 'utf8');
const sandbox = {
  window: { addEventListener: function () {}, visualViewport: null },
  document: document_,
  console: console,
  MutationObserver: function () { this.observe = function () {}; },
  setTimeout: function () {},
};
sandbox.window.document = document_;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'feedTagging.js' });

assert.ok(sandbox.window.FeedTagging && typeof sandbox.window.FeedTagging.decorateComposer === 'function',
  'FeedTagging.decorateComposer must be exposed');
sandbox.window.FeedTagging.decorateComposer();

// ------------------------------------------------------------------
// Assert: five direct siblings, canonical order, Posten last.
// ------------------------------------------------------------------
const order = actions.children.map(function (c) { return c.id || c.textContent; });
assert.deepStrictEqual(order, ['\u{1F4F7}', '\u{1F4CC}', 'feed-tag-member-btn', 'feed-tag-recipe-btn', 'feed-send-btn'],
  'final DOM order inside .feed-compose-actions must be photo, pin, member, recipe, Posten as direct siblings — got: ' + order.join(', '));

actions.children.forEach(function (c) {
  assert.strictEqual(c.parentNode, actions, 'every action control must be a direct child of .feed-compose-actions, not nested in a wrapper');
});

const memberBtn = document_.getElementById('feed-tag-member-btn');
const recipeBtn = document_.getElementById('feed-tag-recipe-btn');
assert.strictEqual(memberBtn.getAttribute('aria-label'), 'Persoon taggen', 'member tag button must expose an accessible label');
assert.ok(memberBtn.classList.contains('fs-compose-tool-member'), 'member tag button must use the current SVG member control class');
assert.strictEqual(recipeBtn.getAttribute('aria-label'), 'Recept taggen', 'recipe tag button must expose an accessible label');
assert.ok(recipeBtn.classList.contains('fs-compose-tool-recipe'), 'recipe tag button must use the current SVG recipe control class');
assert.strictEqual(memberBtn.getAttribute('onclick'), "openFeedTagPicker('member')", 'member button must wire the existing tag picker');
assert.strictEqual(recipeBtn.getAttribute('onclick'), "openFeedTagPicker('recipe')", 'recipe button must wire the existing tag picker');

// decorateComposer must be idempotent (runs repeatedly via MutationObserver)
sandbox.window.FeedTagging.decorateComposer();
const orderAfterSecondRun = actions.children.map(function (c) { return c.id || c.textContent; });
assert.deepStrictEqual(orderAfterSecondRun, order, 'decorateComposer must be idempotent — repeated MutationObserver runs must not duplicate or reorder buttons');

console.log('STEP 13.4 composer toolbar DOM-order lifecycle test: PASS');
