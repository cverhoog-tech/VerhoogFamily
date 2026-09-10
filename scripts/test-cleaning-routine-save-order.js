'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningScreen.js'),'utf8');

const start=source.indexOf('function onSheetSubmit(event)');
const end=source.indexOf('function onSheetChange(event)',start);
assert.ok(start>=0&&end>start,'v2 sheet submit owner must exist');
const block=source.slice(start,end);
assert.match(block,/routineAction=routineId\?updateRoutine\(routineId,routineValues\):createRoutine/,'routine form must call the single v2 repository mutation path');
assert.match(block,/disableForm\(form,true\)/,'routine form disables duplicate submits immediately');
assert.match(block,/routineAction\.then\(\(\)=>\{toast\('Routine opgeslagen/,'sheet transition must wait for successful persistence');
assert.doesNotMatch(block,/renderCleaningScreen\(/,'routine submit must not rebuild the full Cleaning screen while the sheet is active');
console.log('Cleaning v2 routine save flow contract passed.');
