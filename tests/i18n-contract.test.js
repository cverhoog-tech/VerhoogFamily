'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadI18n(options) {
  options = options || {};
  const store = Object.assign({}, options.store || {});
  const window = {
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); }
    },
    navigator: {
      language: options.language || 'nl-NL',
      languages: options.languages || [options.language || 'nl-NL']
    },
    addEventListener() {},
    dispatchEvent() {}
  };
  const document = {
    readyState: 'complete',
    documentElement: { lang: '' },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; }

  const sandbox = { window, document, CustomEvent, Intl, Date, Number, String, Array, Object, RegExp, console };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(__dirname, '../src/core/i18n.js'), 'utf8');
  vm.runInContext(source, sandbox, { filename: 'i18n.js' });
  return { i18n: window.FamilyI18n, store, document };
}

(function () {
  const initial = loadI18n({ language: 'tr-TR' });
  assert.strictEqual(initial.i18n.getPreference(), 'nl', 'existing beta users must stay Dutch until they opt in');
  assert.strictEqual(initial.i18n.getLanguage(), 'nl');
  assert.strictEqual(initial.document.documentElement.lang, 'nl');

  initial.i18n.setPreference('tr');
  assert.strictEqual(initial.i18n.getLanguage(), 'tr');
  assert.strictEqual(initial.i18n.t('nav.tasks'), 'Görevler');

  initial.i18n.setPreference('pl');
  assert.strictEqual(initial.i18n.t('tasks.count', { count: 1 }), '1 zadanie');
  assert.strictEqual(initial.i18n.t('tasks.count', { count: 2 }), '2 zadania');
  assert.strictEqual(initial.i18n.t('tasks.count', { count: 5 }), '5 zadań');

  initial.i18n.setPreference('system');
  assert.strictEqual(initial.i18n.getLanguage(), 'tr', 'system preference should resolve the device language');

  const unsupported = loadI18n({ language: 'fr-FR', store: { 'familyapp-language-v1': 'system' } });
  assert.strictEqual(unsupported.i18n.getLanguage(), 'nl', 'unsupported system languages should safely fall back to Dutch');

  const romanian = loadI18n({ store: { 'familyapp-language-v1': 'ro' } });
  assert.strictEqual(romanian.i18n.t('home.greeting.morning', { name: 'Ana' }), 'Bună dimineața, Ana');

  console.log('i18n-contract: ok');
})();
