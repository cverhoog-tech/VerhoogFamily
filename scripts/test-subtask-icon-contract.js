'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function read(path){return fs.readFileSync(path,'utf8');}

const popup = read('src/modules/tasks/taskDetailPopup.js');

// ============================================================
// PART 1 -- static contract (source-level assertions)
// ============================================================

// 1. Old keyword/content auto-classifier must be fully gone -- no fallback
//    sparkle/basket/drawer/appliance icon logic left anywhere in the file.
assert.ok(!popup.includes('function subIcon('), 'the keyword-based subIcon() auto-classifier must be removed');
assert.ok(!popup.includes('SUB_ICON_PATHS'), 'the old SUB_ICON_PATHS icon set must be removed');
assert.ok(!/sparkle:/.test(popup), 'no sparkle fallback icon definition may remain');

// 2. New explicit, optional icon model.
assert.ok(popup.includes('function getSubIcon('), 'a single canonical getSubIcon() reader must exist');
assert.ok(/getSubIcon\(s\)\{var v=s&&s\.icon;return \(typeof v===.string.&&v\)\?v:null;\}/.test(popup),
  'getSubIcon must treat undefined, missing, and null identically as "no icon" (never assume physical icon:null presence)');

// 3. Curated categorized picker (SubtaskIconPicker), not a full unicode keyboard clone.
assert.ok(popup.includes('SUBTASK_ICON_CATEGORIES'), 'a curated category list must back the picker');
assert.ok(popup.includes('subtaskIconPickerHtml'), 'a shared picker-panel renderer must exist');
assert.ok(popup.includes('subtaskIconButtonHtml'), 'a shared icon-slot button renderer must exist');
assert.ok(popup.includes('Geen icoon'), 'the picker must offer an explicit "no icon" clear option');

// 4. One picker implementation reused by both detail and create views (no duplication).
const pickerHtmlCalls = (popup.match(/subtaskIconPickerHtml\(/g) || []).length;
const pickerBtnCalls = (popup.match(/subtaskIconButtonHtml\(/g) || []).length;
assert.ok(pickerHtmlCalls >= 2, 'subtaskIconPickerHtml must be reused by both the detail view and the create view, not duplicated');
assert.ok(pickerBtnCalls >= 2, 'subtaskIconButtonHtml must be reused by both the detail view and the create view, not duplicated');

// 5. Picker state is tracked per subtask id, not a single ambiguous boolean.
assert.ok(popup.includes('var iconPickerForId = null'), 'picker-open state must be keyed by subtask id');
assert.ok(!/var iconPickerOpen\s*=\s*(true|false)/.test(popup), 'must not use a bare global boolean for icon-picker visibility');

// 6. Icon values are escaped, never raw-injected as HTML.
assert.ok(popup.includes("esc(subId)") && popup.includes('data-icon-value="\'+esc(ic)+\'"'),
  'curated icon values must be escaped when written into picker markup');
assert.ok(popup.includes('icon?esc(icon)'), "a subtask's stored icon must be escaped before rendering");

// 7. Icon slot and checkbox are separate controls; icon click must not toggle completion.
assert.ok(popup.includes('data-sub-icon-toggle='), 'icon slot must be its own distinct control (separate attribute from data-sub-toggle)');
assert.ok(popup.includes('data-sub-toggle='), 'checkbox toggle control must still exist independently');
const iconToggleHandler = popup.split("querySelectorAll('[data-sub-icon-toggle]')")[1] || '';
assert.ok(iconToggleHandler.slice(0, 120).includes('stopPropagation'), 'icon-slot click handler must stop propagation so it cannot bubble into row/checkbox handling');

// 8. done remains the sole completion field; no rename, no task-model migration triggered by this change.
assert.ok(popup.includes('s.done'), 'subtask completion must still be read via the existing done field');
assert.ok(!popup.includes('s.completed'), 'this change must not introduce/rename to a completed field');

// 9. Persistence still goes through the existing patch()/TaskSharedData.update boundary --
//    no new storage layer, no localStorage, no parallel task array.
assert.ok(popup.includes('patch(task.id,{subtasks:next},render)'), 'icon selection must persist via the existing patch() boundary in the detail view');
assert.ok(!popup.includes('localStorage.setItem'), 'no new localStorage authority may be introduced by this change');

console.log('subtask-icon-contract (static): ok');

// ============================================================
// PART 2 -- interactive behaviour, executed via a minimal hand-rolled
// DOM shim (Node core only: vm/fs/assert -- no jsdom, no dependencies).
// Deliberately scoped to exactly what taskDetailPopup.js needs:
//   - id/class/attribute-presence lookups (no full CSS selector engine)
//   - innerHTML parsing of the plain tag/attr markup this module emits
//   - onclick assignment + manual dispatch (no bubbling model)
// This is not a general-purpose DOM; it exists only to make the
// pick/change/clear, checkbox-independence, persistence, and
// create-flow regressions reproducible from `node scripts/test-*.js`
// without adding new test dependencies.
// ============================================================

function decodeEntities(s){
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
}

class MiniElement {
  constructor(tag){
    this.tag = tag;
    this.type = 'element';
    this.attrs = {};
    this.children = [];
    this.parentNode = null;
    this._onclick = null;
    this._style = {};
  }
  get id(){ return this.attrs.id || ''; }
  set id(v){ this.attrs.id = v; }
  get className(){ return this.attrs.class || ''; }
  set className(v){ this.attrs.class = v; }
  get classList(){
    const self = this;
    return {
      contains(c){ return (self.attrs.class || '').split(/\s+/).filter(Boolean).includes(c); },
      add(c){ const cur = (self.attrs.class || '').split(/\s+/).filter(Boolean); if(!cur.includes(c)) cur.push(c); self.attrs.class = cur.join(' '); },
      remove(c){ const cur = (self.attrs.class || '').split(/\s+/).filter(Boolean).filter(x => x !== c); self.attrs.class = cur.join(' '); }
    };
  }
  get style(){ return this._style; }
  get onclick(){ return this._onclick; }
  set onclick(fn){ this._onclick = fn; }
  addEventListener(){ /* no-op: not needed for the flows under test */ }
  getAttribute(name){ return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; }
  setAttribute(name, val){ this.attrs[name] = String(val); }
  appendChild(child){ child.parentNode = this; this.children.push(child); return child; }
  removeChild(child){ const i = this.children.indexOf(child); if(i > -1) this.children.splice(i, 1); return child; }
  get textContent(){
    let out = '';
    for(const c of this.children){ out += c.type === 'text' ? c.text : c.textContent; }
    return out;
  }
  set textContent(v){ this.children = [{ type: 'text', text: String(v) }]; }
  set innerHTML(html){
    this.children = parseHTML(html);
    for(const c of this.children){ if(c.type === 'element') c.parentNode = this; }
  }
  querySelectorAll(sel){ const out = []; collectMatches(this, sel, out); return out; }
  querySelector(sel){ return this.querySelectorAll(sel)[0] || null; }
  get value(){ return this.attrs.value || ''; }
  set value(v){ this.attrs.value = String(v); }
  get disabled(){ return this.attrs.disabled !== undefined; }
  set disabled(v){ if(v) this.attrs.disabled = ''; else delete this.attrs.disabled; }
}

function matchesPart(el, part){
  if(part[0] === '#') return el.attrs.id === part.slice(1);
  if(part[0] === '.') return (el.attrs.class || '').split(/\s+/).filter(Boolean).includes(part.slice(1));
  const m = part.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
  if(m){
    const name = m[1], val = m[2];
    if(!(name in el.attrs)) return false;
    return val === undefined ? true : el.attrs[name] === val;
  }
  return false;
}
// Supports simple compound selectors like '.class[attr="value"]' (the only
// forms this shim's callers use) by splitting into #id/.class/[attr] parts.
function matches(el, sel){
  const parts = sel.match(/(#[\w-]+|\.[\w-]+|\[[^\]]+\])/g) || [sel];
  return parts.every(p => matchesPart(el, p));
}
function collectMatches(node, sel, out){
  for(const c of node.children || []){
    if(c.type === 'element'){
      if(matches(c, sel)) out.push(c);
      collectMatches(c, sel, out);
    }
  }
}

function parseHTML(html){
  const root = [];
  const stack = [{ children: root }];
  const voidTags = new Set(['input', 'br', 'img', 'hr', 'meta', 'link']);
  const attrRe = /([\w-]+)(?:="([^"]*)"|='([^']*)')?/g;
  let i = 0;
  while(i < html.length){
    if(html[i] === '<'){
      const end = html.indexOf('>', i);
      if(html[i + 1] === '/'){
        stack.pop();
        i = end + 1;
        continue;
      }
      let tagContent = html.slice(i + 1, end);
      const selfClose = tagContent.endsWith('/');
      if(selfClose) tagContent = tagContent.slice(0, -1);
      const tagMatch = tagContent.match(/^([a-zA-Z0-9]+)/);
      const tag = tagMatch[1];
      const attrsStr = tagContent.slice(tag.length);
      const attrs = {};
      attrRe.lastIndex = 0;
      let am;
      while((am = attrRe.exec(attrsStr))){
        const name = am[1];
        if(am[2] !== undefined) attrs[name] = decodeEntities(am[2]);
        else if(am[3] !== undefined) attrs[name] = decodeEntities(am[3]);
        else attrs[name] = '';
      }
      const el = new MiniElement(tag);
      el.attrs = attrs;
      stack[stack.length - 1].children.push(el);
      if(!(selfClose || voidTags.has(tag))) stack.push(el);
      i = end + 1;
    } else {
      const next = html.indexOf('<', i);
      const textEnd = next === -1 ? html.length : next;
      const text = html.slice(i, textEnd);
      if(text.length) stack[stack.length - 1].children.push({ type: 'text', text: decodeEntities(text) });
      i = textEnd;
    }
  }
  return root;
}

function makeDocument(){
  const head = new MiniElement('head');
  const body = new MiniElement('body');
  return {
    head, body,
    createElement(tag){ return new MiniElement(tag); },
    getElementById(id){
      function search(node){
        for(const c of node.children || []){
          if(c.type === 'element'){
            if(c.attrs.id === id) return c;
            const r = search(c);
            if(r) return r;
          }
        }
        return null;
      }
      return search(head) || search(body);
    },
    querySelectorAll(sel){ const out = []; collectMatches(head, sel, out); collectMatches(body, sel, out); return out; },
    querySelector(sel){ return this.querySelectorAll(sel)[0] || null; }
  };
}

function click(el){
  if(el && typeof el.onclick === 'function') el.onclick({ target: el, stopPropagation(){} });
}
function tick(ms){ return new Promise(resolve => setTimeout(resolve, ms || 0)); }

async function runInteractiveChecks(){
  const document = makeDocument();
  const localStorageStore = {};
  const localStorage = {
    getItem(k){ return Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null; },
    setItem(k, v){ localStorageStore[k] = String(v); }
  };

  const db = { tasks: {} };
  const TaskSharedData = {
    update(id, patchObj){
      return new Promise(resolve => {
        const t = db.tasks[id];
        Object.assign(t, patchObj);
        resolve(JSON.parse(JSON.stringify(t)));
      });
    },
    status(){ return { ready: true }; },
    members(){ return []; },
    isTaskOwner(){ return true; },
    create(obj){
      const id = 'created_' + Date.now();
      db.tasks[id] = Object.assign({ id }, obj);
      sandbox.__lastCreated = db.tasks[id];
      return Promise.resolve(db.tasks[id]);
    }
  };

  const task = {
    id: 't1', title: 'Keuken opruimen', category: 'kitchen', done: false,
    subtasks: [
      { id: 's_legacy', title: 'Legacy subtaak zonder icon veld', done: false },
      { id: 's_null', title: 'Subtaak met icon null', done: false, icon: null },
      { id: 's_pick', title: 'Subtaak om icoon te kiezen', done: false }
    ]
  };
  db.tasks.t1 = task;

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    document,
    localStorage,
    TaskSharedData,
    taskData: [task],
    AppState: { save(){} },
    requestAnimationFrame(cb){ cb(); },
    prompt(){ return null; },
    confirm(){ return true; },
    __lastCreated: null
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(popup, sandbox, { filename: 'taskDetailPopup.js' });

  function q(sel){ return document.querySelector(sel); }
  function qa(sel){ return document.querySelectorAll(sel); }
  function findChip(subId, value){
    return qa('.tdp-icon-chip[data-icon-pick="' + subId + '"]').find(el => el.getAttribute('data-icon-value') === value);
  }
  function clearBtn(subId){ return qa('.tdp-icon-clear-btn[data-icon-pick="' + subId + '"]')[0]; }

  // 1) legacy subtask (no icon field) renders the placeholder, no crash
  sandbox.window.TaskDetailPopup.open('t1');
  await tick(10);
  const rows = qa('.tdp-sub-row');
  assert.ok(rows[0].querySelector('.tdp-sub-icon-empty'), 'legacy subtask without icon field renders the + placeholder');
  assert.ok(!rows[0].textContent.includes('undefined'), 'legacy subtask does not leak "undefined" into markup');

  // 2) icon:null renders identically to a missing field
  assert.ok(rows[1].querySelector('.tdp-sub-icon-empty'), 'icon:null renders the same + placeholder as a missing field');

  // 3) plain new subtask never gets an automatic content icon
  assert.ok(rows[2].querySelector('.tdp-sub-icon-empty'), 'plain new subtask has no auto-assigned icon');

  // 4) tapping the icon slot opens the picker for that subtask only
  click(rows[2].querySelector('[data-sub-icon-toggle="s_pick"]'));
  await tick(10);
  assert.ok(qa('.tdp-sub-row')[2].querySelector('.tdp-icon-picker'), 'picker opens under the tapped subtask');
  assert.ok(!qa('.tdp-sub-row')[0].querySelector('.tdp-icon-picker'), 'picker does NOT open for other subtasks (per-id state, not a global boolean)');
  assert.strictEqual(task.done, false, 'opening the icon picker did not toggle task.done');

  // 5) select a chip -> persists via patch()/TaskSharedData.update; icon-click never toggles completion
  const chip = findChip('s_pick', '\uD83E\uDDF9'); // broom
  assert.ok(chip, 'curated broom emoji chip exists in the Schoonmaken category');
  click(chip);
  await tick(10);
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').icon, '\uD83E\uDDF9', 'chosen icon persisted via the existing update boundary');
  assert.ok(!q('.tdp-icon-picker'), 'picker closes after a selection');
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').done, false, 'selecting an icon does not toggle done');

  // 6) checkbox still works independently and does not disturb the icon
  click(q('[data-sub-toggle="s_pick"]'));
  await tick(10);
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').done, true, 'checkbox toggle still works after adding the icon feature');
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').icon, '\uD83E\uDDF9', 'toggling done does not disturb the icon');
  click(q('[data-sub-toggle="s_pick"]'));
  await tick(10);

  // 7) change an existing icon
  click(q('[data-sub-icon-toggle="s_pick"]'));
  await tick(10);
  assert.ok(findChip('s_pick', '\uD83E\uDDF9').classList.contains('selected'), 'currently-set icon is marked selected in the picker');
  click(findChip('s_pick', '\uD83D\uDED2')); // shopping cart
  await tick(10);
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').icon, '\uD83D\uDED2', 'icon can be changed to a different emoji');

  // 8) clear back to null via "Geen icoon"
  click(q('[data-sub-icon-toggle="s_pick"]'));
  await tick(10);
  click(clearBtn('s_pick'));
  await tick(10);
  assert.strictEqual(db.tasks.t1.subtasks.find(s => s.id === 's_pick').icon, null, '"Geen icoon" clears the icon back to null');
  assert.ok(qa('.tdp-sub-row')[2].querySelector('.tdp-sub-icon-empty'), 'placeholder + is shown again after clearing');

  // 9) real reload: icon survives re-opening from the persisted store with fresh objects
  sandbox.window.TaskDetailPopup.close();
  await tick(260);
  db.tasks.t1.subtasks.find(s => s.id === 's_pick').icon = '\uD83D\uDED2';
  sandbox.taskData = [JSON.parse(JSON.stringify(db.tasks.t1))];
  sandbox.window.TaskDetailPopup.open('t1');
  await tick(10);
  assert.ok(qa('.tdp-sub-row')[2].textContent.includes('\uD83D\uDED2'), 'icon survives a full reload from the persisted datastore');
  sandbox.window.TaskDetailPopup.close();
  await tick(260);

  // 10) create flow: new subtask has no default icon; a chosen icon survives save
  sandbox.prompt = () => 'Subtaak zonder icoon';
  sandbox.window.TaskDetailPopup.openCreate();
  await tick(10);
  click(q('#tdp-sub-add-btn'));
  await tick(10);
  let createdRows = qa('.tdp-sub-row');
  assert.strictEqual(createdRows.length, 1, 'subtask added in create flow');
  assert.ok(createdRows[0].querySelector('.tdp-sub-icon-empty'), 'freshly added create-flow subtask has NO default icon');

  sandbox.prompt = () => 'Tweede subtaak met icoon';
  click(q('#tdp-sub-add-btn'));
  await tick(10);
  createdRows = qa('.tdp-sub-row');
  const secondId = createdRows[1].querySelector('[data-sub-icon-toggle]').getAttribute('data-sub-icon-toggle');
  click(createdRows[1].querySelector('[data-sub-icon-toggle]'));
  await tick(10);
  click(findChip(secondId, '\uD83D\uDCDE')); // phone
  await tick(10);

  const titleInput = q('#tdp-create-title');
  titleInput.value = 'Taak met subtaak-iconen';
  const created = await (function saveAndWait(){
    click(q('#tdp-create-save-btn'));
    return tick(10).then(() => sandbox.__lastCreated);
  })();

  assert.ok(created, 'task was created via TaskSharedData.create');
  assert.strictEqual(created.subtasks.length, 2, 'both create-flow subtasks were saved');
  assert.ok(created.subtasks[0].icon === undefined || created.subtasks[0].icon === null, 'subtask without a chosen icon is saved with no icon (not a default)');
  assert.strictEqual(created.subtasks[1].icon, '\uD83D\uDCDE', 'icon chosen during create flow survives into the saved task');

  console.log('subtask-icon-contract (interactive): ok');
}

runInteractiveChecks().catch(err => {
  console.error(err);
  process.exit(1);
});
