'use strict';
// ============================================================
// SHOPPING LIST STORE v1.0.0
// The ONLY canonical owner of shopping-list state.
//
// Owns:
//   - realtime subscriptions to Firebase (FamilyDataStore 'shoppingLists')
//   - all mutations (add / toggle / delete / reset / createList / setActiveList)
//   - the canonical projection consumed by rendering + counters
//   - one-time, multi-device-race-safe legacy migration
//   - household/session rebind (stale-callback safe)
//
// Deliberately does NOT use FamilyDataStore.transactPath() for regular
// mutations: that helper currently resolves instead of rejecting on
// failed/uncommitted writes (see the strict write check below), and
// FamilyDataStore is shared infrastructure used by other modules — this
// rebuild does not change its global semantics. Toggle/add/delete use plain
// writeSharedPath/writePrivatePath writes on a per-item leaf instead, which
// is safe for a single boolean/record and avoids relying on that helper.
// The one place this store DOES need atomic compare-and-set semantics
// (the legacy migration claim, see below) talks to the raw Firebase ref
// directly with its own strict transaction handling, scoped to this file.
// ============================================================
(function(){
  if(window.ShoppingListStore && window.ShoppingListStore.version === '1.0.0') return;
  var VERSION = '1.0.0';
  var COLLECTION = 'shoppingLists';
  var PREF_KEY = 'familyapp_active_shopping_list_v1';
  var LEGACY_STATE_KEY = 'familieapp_state_v024'; // AppState's storage key — read-only, one-time migration source
  var MIGRATION_STALE_MS = 2 * 60 * 1000; // a claim older than this is considered abandoned and may be retried

  var shared = {}, priv = {};
  var activeKey = null;
  var booted = false;
  var identity = { uid: null, familyId: null };
  var changeListeners = [];
  var unsubShared = null, unsubPrivate = null;
  var migrationAttempted = false;

  // ── infra helpers ──
  function fds(){ return window.FamilyDataStore || null; }
  function status(){ return fds() && fds().status ? fds().status() : {}; }
  function currentUid(){ return status().userId || null; }
  function currentFamilyId(){ return status().familyId || null; }
  function now(){ return Date.now(); }
  function itemMap(v){ return fds() && fds().itemMap ? fds().itemMap(v) : {}; }
  function itemArray(v){
    var m = itemMap(v);
    return Object.keys(m).map(function(k){ return Object.assign({}, m[k], { _key: k }); })
      .sort(function(a, b){ return Number(b.createdAt || 0) - Number(a.createdAt || 0); });
  }
  function canonicalName(v){ return String(v || '').trim().toLowerCase(); }
  function emitChange(){ changeListeners.slice().forEach(function(fn){ try{ fn(); }catch(e){ console.warn('[ShoppingListStore] listener failed', e); } }); }

  // ── strict write-result check ──
  // FamilyDataStore's writePath() always RESOLVES, even when the Firebase
  // write never actually confirmed (offline, permission error, network
  // failure — it resolves with {mode:'local'|'local-pending', error}).
  // Shopping mutations must not silently accept that as success: a caller
  // (the Add Sheet, toggle handler, etc.) needs a real rejection so it can
  // show an error and keep the UI in a "not saved" state.
  function confirmWrite(resultPromise, failMessage){
    return Promise.resolve(resultPromise).then(function(result){
      if(!result || result.mode !== 'firebase'){
        var err = new Error(failMessage || 'Wijziging kon niet worden bevestigd door Firebase');
        err.writeResult = result;
        err.confirmed = false;
        throw err;
      }
      return result;
    });
  }
  function writer(scope){
    var store = fds();
    if(!store) return null;
    return scope === 'shared' ? store.writeSharedPath : store.writePrivatePath;
  }
  function writePathConfirmed(scope, path, value, failMessage){
    var store = fds(), fn = writer(scope);
    if(!store || typeof fn !== 'function') return Promise.reject(new Error('Opslag niet beschikbaar'));
    return confirmWrite(fn.call(store, COLLECTION, path, value), failMessage);
  }

  // ── projection ──
  function rows(){
    var out = [];
    Object.keys(shared || {}).forEach(function(id){
      if(shared[id]) out.push({ scope: 'shared', key: 'shared:' + id, list: normalizeList(shared[id]) });
    });
    Object.keys(priv || {}).forEach(function(id){
      if(priv[id]) out.push({ scope: 'private', key: 'private:' + id, list: normalizeList(priv[id]) });
    });
    return out.sort(function(a, b){ return Number(b.list.updatedAt || 0) - Number(a.list.updatedAt || 0); });
  }
  function normalizeList(raw){
    if(!raw) return raw;
    var copy = Object.assign({}, raw);
    copy.items = itemMap(copy.items);
    return copy;
  }
  function findRow(key){
    return rows().find(function(r){ return r.key === key; }) || null;
  }
  function active(){
    var all = rows();
    var found = all.find(function(r){ return r.key === activeKey; })
      || all.find(function(r){ return r.scope === 'shared'; })
      || all[0]
      || null;
    if(found && found.key !== activeKey){
      activeKey = found.key;
      try{ localStorage.setItem(PREF_KEY, activeKey); }catch(e){}
    }
    return found;
  }
  function projection(){
    var row = active();
    if(!row) return { key: null, name: null, scope: null, openItems: [], doneItems: [], openCount: 0, doneCount: 0 };
    var items = itemArray(row.list.items);
    var open = items.filter(function(i){ return !i.done; });
    var done = items.filter(function(i){ return i.done; });
    // Single computation: counters and rendered items always come from this
    // exact same array, so they can never diverge.
    return { key: row.key, name: row.list.name, scope: row.scope, icon: row.list.icon, openItems: open, doneItems: done, openCount: open.length, doneCount: done.length };
  }

  function setActiveList(key){
    if(!findRow(key)) return false;
    activeKey = key;
    try{ localStorage.setItem(PREF_KEY, key); }catch(e){}
    emitChange();
    return true;
  }

  function findItemKey(row, id){
    var items = itemMap(row.list.items);
    var candidate = String(id == null ? '' : id);
    if(candidate && items[candidate]) return candidate;
    var matches = Object.keys(items).filter(function(k){ return items[k] && String(items[k].id) === candidate; });
    return matches.length === 1 ? matches[0] : null;
  }
  function touchList(row){
    return Promise.all([
      writePathConfirmed(row.scope, [row.list.id, 'updatedAt'], now()),
      writePathConfirmed(row.scope, [row.list.id, 'updatedBy'], currentUid())
    ]);
  }

  // ── item normalization (shared by manual add + recipe import) ──
  function normalizeItemInput(input){
    input = input || {};
    var name = String(input.name || '').trim();
    if(!name) return null;
    return {
      name: name,
      qty: String(input.qty || '1 st'),
      amount: input.amount != null ? input.amount : null,
      unit: input.unit || null,
      cat: input.cat || 'Overig',
      who: input.who || (window.myName || 'Gezin'),
      done: false,
      photo: input.photo == null ? null : input.photo,
      source: input.source || null,
      sourceRecipeId: input.sourceRecipeId || null,
      sourceRecipeName: input.sourceRecipeName || null
    };
  }

  function addItems(listKey, items, options){
    options = options || {};
    var key = listKey || activeKey;
    var row = findRow(key) || active();
    if(!row) return Promise.reject(new Error('Geen winkellijst beschikbaar'));
    var store = fds();
    if(!store) return Promise.reject(new Error('Opslag niet beschikbaar'));

    var existing = row.list.items && typeof row.list.items === 'object' ? row.list.items : {};
    var existingNames = {};
    Object.keys(existing).forEach(function(k){ var x = existing[k]; if(x && !x.done) existingNames[canonicalName(x.name)] = true; });

    var added = [], skipped = [];
    (Array.isArray(items) ? items : [items]).forEach(function(input){
      var clean = normalizeItemInput(input);
      if(!clean) return;
      var n = canonicalName(clean.name);
      if(options.dedupe !== false && existingNames[n]){ skipped.push(clean); return; }
      existingNames[n] = true;
      var itemKey = store.makeId('item');
      added.push(Object.assign({}, clean, {
        _key: itemKey, createdAt: now(), createdBy: currentUid(), updatedAt: now(), updatedBy: currentUid()
      }));
    });

    if(!added.length) return Promise.resolve({ listKey: row.key, added: [], skipped: skipped });

    var jobs = added.map(function(record){
      return writePathConfirmed(row.scope, [row.list.id, 'items', record._key], record, 'Item kon niet worden opgeslagen');
    });
    return Promise.all(jobs)
      .then(function(){ return touchList(row); })
      .then(function(){ emitChange(); return { listKey: row.key, added: added, skipped: skipped }; });
  }

  function addItem(item){
    return addItems(activeKey, [item], { dedupe: false }).then(function(result){
      if(!result.added.length){
        throw new Error('Item kon niet worden toegevoegd');
      }
      return result.added[0];
    });
  }

  function ingredientText(ingredient){
    if(ingredient && typeof ingredient === 'object') return String(ingredient.rawText || ingredient.text || ingredient.name || '').trim();
    return String(ingredient || '').trim();
  }
  function classifyIngredient(text){
    var parser = window.GroceryInputParser, classifier = window.GroceryProductClassifier;
    var parsed = parser && typeof parser.parse === 'function' ? parser.parse(text) : { productName: text, amount: null, unit: null };
    var guess = classifier && typeof classifier.classify === 'function' ? classifier.classify(parsed.productName) : { category: 'Overig', icon: null, qty: '1 st' };
    var unit = parsed.unit || (guess.qty ? guess.qty.replace(/^[0-9.,]+\s*/, '') : 'st');
    var amount = parsed.amount != null ? parsed.amount : (guess.qty ? parseFloat(guess.qty) || 1 : 1);
    return {
      name: parsed.productName || text,
      amount: amount, unit: unit,
      qty: amount + ' ' + unit,
      cat: guess.category || 'Overig',
      photo: guess.icon || null
    };
  }
  function appendRecipeIngredients(recipe, listKey){
    if(!recipe) return Promise.reject(new Error('Recept ontbreekt'));
    var items = (recipe.ingredients || []).map(function(ingredient){
      var text = ingredientText(ingredient);
      if(!text) return null;
      var built = classifyIngredient(text);
      return Object.assign(built, { source: 'recipe', sourceRecipeId: recipe.id || null, sourceRecipeName: recipe.name || null });
    }).filter(Boolean);
    return addItems(listKey || activeKey, items, { dedupe: true });
  }

  function toggleItem(id){
    var row = active();
    if(!row) return Promise.reject(new Error('Geen winkellijst actief'));
    var key = findItemKey(row, id);
    if(!key) return Promise.reject(new Error('Item niet gevonden'));
    var current = itemMap(row.list.items)[key];
    if(!current) return Promise.reject(new Error('Item niet gevonden'));
    var next = Object.assign({}, current, { done: !current.done, updatedAt: now(), updatedBy: currentUid(), _key: key });
    return writePathConfirmed(row.scope, [row.list.id, 'items', key], next, 'Kon item niet bijwerken')
      .then(function(){ return touchList(row); })
      .then(function(){ emitChange(); return next; });
  }

  function deleteItem(id){
    var row = active();
    if(!row) return Promise.reject(new Error('Geen winkellijst actief'));
    var key = findItemKey(row, id);
    if(!key) return Promise.reject(new Error('Item niet gevonden'));
    return writePathConfirmed(row.scope, [row.list.id, 'items', key], null, 'Kon item niet verwijderen')
      .then(function(){ return touchList(row); })
      .then(function(){ emitChange(); return true; });
  }

  function clearDone(){
    var row = active();
    if(!row) return Promise.reject(new Error('Geen winkellijst actief'));
    var items = itemMap(row.list.items);
    var doneKeys = Object.keys(items).filter(function(k){ return items[k] && items[k].done; });
    if(!doneKeys.length) return Promise.resolve(true);
    var jobs = doneKeys.map(function(k){ return writePathConfirmed(row.scope, [row.list.id, 'items', k], null, 'Kon gekochte items niet legen'); });
    return Promise.all(jobs)
      .then(function(){ return touchList(row); })
      .then(function(){ emitChange(); return true; });
  }

  function createList(options){
    options = options || {};
    var store = fds();
    if(!store) return Promise.reject(new Error('Opslag niet beschikbaar'));
    var scope = options.visibility === 'private' ? 'private' : 'shared';
    var id = store.makeId('list');
    var list = {
      id: id, name: options.name || 'Winkellijst', icon: options.icon || '🛒',
      visibility: scope === 'private' ? 'private' : 'household',
      ownerUid: currentUid(), createdBy: currentUid(), createdAt: now(), updatedAt: now(), items: {}
    };
    var writeFn = scope === 'shared' ? store.writeSharedRecord : store.writePrivateRecord;
    return confirmWrite(writeFn.call(store, COLLECTION, id, list), 'Kon lijst niet aanmaken').then(function(){
      setActiveList(scope + ':' + id);
      return list;
    });
  }

  // ── legacy migration: race-safe, at-most-once, existing Firebase data always wins ──
  //
  // Behaviour when Shane and Esra each have a *different* local legacy list
  // before this ships: only the device that wins the migration claim (first
  // to successfully run the transaction below) has its local list uploaded
  // as the household's shared default list. The other device's local legacy
  // list is left untouched in its own localStorage and is NOT merged — an
  // automatic merge of two independently-edited lists could silently create
  // duplicate or conflicting entries, so instead nothing is guessed: the
  // "losing" household member can re-add anything from their own device that
  // is missing from the list that won, exactly once, manually.
  function readLegacyLocalList(){
    try{
      var raw = localStorage.getItem(LEGACY_STATE_KEY);
      if(!raw) return [];
      var parsed = JSON.parse(raw);
      var arr = parsed && parsed.shop;
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function rawDb(){ try{ return window.fbDb || (window.firebase && firebase.database && firebase.database()) || null; }catch(e){ return null; } }
  function claimRef(familyId){
    var db = rawDb();
    return db ? db.ref('families/' + familyId + '/shared/shoppingListsMigrationClaim') : null;
  }
  // Strict, locally-scoped transaction wrapper used ONLY for this claim —
  // deliberately not routed through FamilyDataStore.transactPath(), which
  // resolves instead of rejecting on failure/non-commit (see file header).
  function runClaimTransaction(ref, uid){
    return new Promise(function(resolve, reject){
      ref.transaction(function(current){
        if(current && current.status === 'done') return; // abort: already migrated
        if(current && current.status === 'in_progress' && (now() - Number(current.claimedAt || 0)) < MIGRATION_STALE_MS) return; // abort: another client is actively migrating
        return { status: 'in_progress', claimedBy: uid, claimedAt: now() };
      }, function(error, committed, snapshot){
        if(error){ reject(error); return; }
        resolve({ committed: committed, value: snapshot ? snapshot.val() : null });
      }, false);
    });
  }
  function markClaim(ref, status, extra){
    return ref.set(Object.assign({ status: status, at: now() }, extra || {})).catch(function(){ /* best effort; a stale in_progress claim self-heals after MIGRATION_STALE_MS */ });
  }
  function attemptMigration(){
    if(migrationAttempted) return Promise.resolve({ ran: false, reason: 'already-attempted-this-session' });
    migrationAttempted = true;
    var uid = currentUid(), familyId = currentFamilyId();
    if(!uid || !familyId) return Promise.resolve({ ran: false, reason: 'identity-unresolved' });
    if(Object.keys(shared || {}).length) return Promise.resolve({ ran: false, reason: 'shared-lists-already-exist' });

    var ref = claimRef(familyId);
    if(!ref) return Promise.resolve({ ran: false, reason: 'no-db' });

    return runClaimTransaction(ref, uid).then(function(result){
      if(!result.committed){
        // Someone else already claimed (or already finished) — this client
        // does nothing further; its subscription will receive the migrated
        // data through the normal realtime listener once it lands.
        return { ran: false, reason: 'lost-claim-race', claim: result.value };
      }
      // Re-check for the empty-vs-existing race: another client could have
      // written shared lists between our initial check and winning the claim.
      var store = fds();
      return store.readShared(COLLECTION, {}).then(function(existingShared){
        if(existingShared && Object.keys(existingShared).length){
          return markClaim(ref, 'done', { note: 'skipped-existing-data-found-after-claim' }).then(function(){
            return { ran: false, reason: 'shared-lists-appeared-during-claim' };
          });
        }
        var legacyItems = readLegacyLocalList();
        if(!legacyItems.length){
          return markClaim(ref, 'done', { note: 'no-legacy-items-on-this-device' }).then(function(){
            return { ran: false, reason: 'no-legacy-items' };
          });
        }
        var list = store.defaultShoppingList(legacyItems);
        return writePathConfirmed('shared', [list.id], list, 'Migratie kon niet worden opgeslagen')
          .then(function(){ return markClaim(ref, 'done', { note: 'migrated-from-' + uid, listId: list.id }); })
          .then(function(){ return { ran: true, list: list }; })
          .catch(function(err){
            // Leave the claim as 'in_progress' (already set) so a later boot
            // (on this or another device) can retry after MIGRATION_STALE_MS
            // instead of permanently losing the import.
            console.warn('[ShoppingListStore] migration write failed, will retry after stale window', err);
            return { ran: false, reason: 'write-failed', error: err };
          });
      });
    });
  }

  // ── realtime subscriptions + rebind ──
  function onSharedData(value){
    if(currentFamilyId() !== identity.familyId) return; // stale callback from a previous household — discard
    shared = value || {};
    emitChange();
  }
  function onPrivateData(value){
    if(currentUid() !== identity.uid) return; // stale callback from a previous session — discard
    priv = value || {};
    emitChange();
  }
  function unsubscribeAll(){
    if(typeof unsubShared === 'function'){ try{ unsubShared(); }catch(e){} }
    if(typeof unsubPrivate === 'function'){ try{ unsubPrivate(); }catch(e){} }
    unsubShared = null; unsubPrivate = null;
  }
  function subscribeAll(){
    var store = fds();
    if(!store) return false;
    identity = { uid: currentUid(), familyId: currentFamilyId() };
    unsubShared = store.subscribeShared(COLLECTION, onSharedData, {});
    unsubPrivate = store.subscribePrivate(COLLECTION, onPrivateData, {});
    return true;
  }
  // Call after household/session change (auth swap, household switch). This
  // store does not listen for auth events itself — the single owner of that
  // lifecycle calls rebind() explicitly, per the existing architectural rule
  // that AuthSessionBootstrap owns the post-auth pipeline.
  function rebind(){
    unsubscribeAll();
    shared = {}; priv = {}; activeKey = null; migrationAttempted = false;
    emitChange();
    if(!ready()) return false;
    subscribeAll();
    attemptMigration();
    return true;
  }
  function ready(){ var s = status(); return !!(s.userId && s.familyId); }

  function boot(){
    if(booted) return true;
    if(!fds() || !ready()) return false;
    booted = true;
    try{ activeKey = localStorage.getItem(PREF_KEY) || null; }catch(e){}
    subscribeAll();
    attemptMigration();
    return true;
  }
  function bootWhenReady(){
    if(boot()) return;
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      if(boot() || tries > 300) clearInterval(timer);
    }, 100);
  }

  function onChange(cb){
    if(typeof cb !== 'function') return function(){};
    changeListeners.push(cb);
    return function(){ changeListeners = changeListeners.filter(function(fn){ return fn !== cb; }); };
  }

  window.ShoppingListStore = {
    version: VERSION,
    boot: boot,
    rebind: rebind,
    all: rows,
    active: active,
    projection: projection,
    setActiveList: setActiveList,
    createList: createList,
    addItem: addItem,
    addItems: addItems,
    appendRecipeIngredients: appendRecipeIngredients,
    toggleItem: toggleItem,
    deleteItem: deleteItem,
    clearDone: clearDone,
    onChange: onChange
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootWhenReady);
  else bootWhenReady();
})();
