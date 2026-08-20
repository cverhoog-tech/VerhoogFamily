'use strict';
// ============================================================
// CENTRAL STATE STORE - FamilieApp v0.24
// Single source of truth for all app data
// NOTE: shopping-list data is intentionally NOT part of this store.
// ShoppingListStore.js (Firebase-backed) owns it exclusively — see
// src/modules/shop/shoppingListStore.js. AppState previously also held a
// 'shop' array here; that was one of several competing shopping-state
// owners and has been removed as part of the Boodschappen rebuild.
// ============================================================

var FAM_VERSION = '0.24.0';
var FAM_STORAGE_KEY = 'familieapp_state_v024';

// ── DEFAULT STATE ──
var _defaultState = {
  meta: { version: FAM_VERSION, lastSaved: null },
  user: { name: 'Shane', initials: 'SK', color: '#2d5a27', partnerName: 'Esra' },
  tasks: [],
  taskNextId: 1,
  recur: [],
  recurNextId: 1,
  notes: [],
  noteNextId: 1,
  cal: [],
  calNextId: 1,
  feed: [],
  feedNextId: 1,
  finance: { trans: [], savings: [], income: [], nextId: 1 },
  skills: {},
  xp: 0,
  streak: 0,
  lastLogin: null,
  settings: { lang: 'nl', theme: 'default', darkMode: false },
};

// ── RUNTIME STATE (merged from localStorage + defaults) ──
var AppState = (function() {
  var _state = {};

  function _load() {
    try {
      var saved = localStorage.getItem(FAM_STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        _state = _deepMerge(_defaultState, parsed);
      } else {
        _state = _deepMerge({}, _defaultState);
        _migrate(); // migrate from old keys
      }
    } catch(e) {
      console.warn('[FamApp] State load error, using defaults:', e);
      _state = _deepMerge({}, _defaultState);
    }
    // Sync globals for legacy compatibility
    _syncGlobals();
    console.log('[FamApp] State loaded v' + FAM_VERSION);
  }

  function _migrate() {
    // Migrate from v022/v023 keys
    var oldTasks = localStorage.getItem('fam_tasks_v023')
      || localStorage.getItem('fam_tasks_v022')
      || localStorage.getItem('fam_tasks_v021');
    if (oldTasks) {
      try {
        var parsed = JSON.parse(oldTasks);
        if (Array.isArray(parsed)) {
          _state.tasks = parsed.map(function(t, i) {
            return {
              id: i + 1,
              title: t[2] || t.title || '',
              desc: t[3] || t.desc || '',
              date: t[11] || t[4] || t.date || null,
              who: t[5] ? [t[5]] : (t.who || ['Shane']),
              xp: t[6] || '+10 XP',
              img: t[7] || t.img || null,
              subs: t[8] || t.subs || [],
              done: !!(t[9] || t.done),
              type: t[1] || 'SIDE QUEST',
              prio: t[12] || t.prio || 'laag',
            };
          });
          _state.taskNextId = _state.tasks.length + 1;
          console.log('[FamApp] Migrated ' + _state.tasks.length + ' tasks from legacy');
        }
      } catch(e) { console.warn('[FamApp] Migration failed:', e); }
    }

    // Migrate other legacy keys
    var legacyKeys = {
      'fam_notes': 'notes',
      'fam_cal': 'cal',
    };
    Object.keys(legacyKeys).forEach(function(key) {
      var val = localStorage.getItem(key);
      if (val) {
        try { _state[legacyKeys[key]] = JSON.parse(val) || []; } catch(e) {}
      }
    });
  }

  function _save() {
    try {
      _state.meta.lastSaved = new Date().toISOString();
      localStorage.setItem(FAM_STORAGE_KEY, JSON.stringify(_state));
    } catch(e) {
      console.error('[FamApp] Save failed:', e);
    }
  }

  function _syncGlobals() {
    // Keep legacy globals in sync for backward compat
    myName = _state.user.name;
    partnerName = _state.user.partnerName;
    myColor = _state.user.color;
    myInitials = _state.user.initials;
    taskData = _state.tasks;
    taskNextId = _state.taskNextId;
    recurData = _state.recur;
    recurNextId = _state.recurNextId;
    noteData = _state.notes;
    calData = _state.cal;
  }

  function _deepMerge(target, source) {
    var result = Object.assign({}, target);
    if (!source) return result;
    Object.keys(source).forEach(function(key) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = _deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  }

  return {
    load: _load,
    save: _save,
    get: function(key) { return key ? _state[key] : _state; },
    set: function(key, value) {
      _state[key] = value;
      _syncGlobals();
      _save();
    },
    update: function(key, updater) {
      _state[key] = updater(_state[key]);
      _syncGlobals();
      _save();
    },

    // ── TASK METHODS ──
    addTask: function(task) {
      task.id = _state.taskNextId++;
      _state.tasks.unshift(task);
      _syncGlobals();
      _save();
      return task;
    },
    updateTask: function(id, changes) {
      var idx = _state.tasks.findIndex(function(t) { return t.id === id; });
      if (idx > -1) {
        _state.tasks[idx] = Object.assign({}, _state.tasks[idx], changes);
        _syncGlobals();
        _save();
      }
    },
    deleteTask: function(id) {
      _state.tasks = _state.tasks.filter(function(t) { return t.id !== id; });
      _syncGlobals();
      _save();
    },
    toggleTask: function(id) {
      var task = _state.tasks.find(function(t) { return t.id === id; });
      if (task) {
        task.done = !task.done;
        _syncGlobals();
        _save();
      }
    },

    // ── USER METHODS ──
    setUser: function(userData) {
      _state.user = Object.assign(_state.user, userData);
      _syncGlobals();
      _save();
    },
  };
})();

// Auto-load on script parse
AppState.load();

// Expose save globally for legacy calls
function famSave() { AppState.save(); }
