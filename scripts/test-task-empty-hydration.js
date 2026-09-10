'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'tasks', 'taskPersonCompatibility.js'), 'utf8');
const listeners = {};
const storage = {};
const context = {
  console,
  document: { getElementById: () => null },
  setTimeout: (callback) => { callback(); return 0; },
  localStorage: { setItem: (key, value) => { storage[key] = value; } },
  taskData: [],
  taskTab: 'compact',
  addEventListener: (name, callback) => { listeners[name] = callback; },
  TaskSharedData: {
    status: () => ({ready:true, count:0, source:'firebase-empty'}),
    members: () => []
  },
  TaskCompactHome: { render: () => {} }
};
context.window = context;
vm.runInNewContext(source, context, {filename:'taskPersonCompatibility.js'});

const status = context.TaskSharedData.status();
assert.strictEqual(status.sharedSnapshot, true);
assert.strictEqual(status.hydrated, true);
assert.strictEqual(context.TaskPersonCompatibility.canonicalSnapshotResolved({source:'binding', ready:true}), false);
assert.strictEqual(context.TaskPersonCompatibility.canonicalSnapshotResolved({source:'firebase-empty', ready:true}), true);
assert.strictEqual(context.TaskPersonCompatibility.canonicalSnapshotResolved({source:'firebase', ready:true}), true);
assert.strictEqual(context.TaskPersonCompatibility.canonicalSnapshotResolved({source:'context-not-ready', ready:false}), false);
assert.strictEqual(storage.fam_tasks_v023, '[]');

console.log('task authoritative empty snapshot hydration: ok');
