const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'modules', 'cleaning', 'cleaningScreen.js'),
  'utf8'
);

const start = source.indexOf('function submitRoutine(root){');
const end = source.indexOf('\nfunction addRoutineTemplate', start);
assert(start >= 0 && end > start, 'submitRoutine source block should be present');

const block = source.slice(start, end);
const saveState = block.indexOf("state.routineForm.error = '';", block.indexOf('const payload = {'));
assert(saveState >= 0, 'submitRoutine should clear its save error state');

const request = block.indexOf(
  'const request = editing ? repository.updateRoutineItem(routineId,payload) : repository.createRoutineItem(payload);',
  saveState
);
const render = block.indexOf('renderCleaningScreen(root);', saveState);

assert(request >= 0, 'submitRoutine should invoke the wrapped routine repository method');
assert(render >= 0, 'submitRoutine should render its submitting state');
assert(
  request < render,
  'routine repository call must happen before re-render so assignment controls remain readable by CleaningRoutineExperience'
);

console.log('Cleaning routine save-order contract passed.');
