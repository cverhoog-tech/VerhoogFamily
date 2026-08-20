const fs=require('fs');
const path=require('path');
function read(p){return fs.readFileSync(path.join(process.cwd(),p),'utf8');}
function assert(cond,msg){if(!cond){throw new Error(msg);}}
const app=read('api/app.js');
const router=read('src/modules/tasks/taskOverviewCanonical.js');
const view=read('src/modules/tasks/personTabV2.js');
const css=read('src/styles/personTabV2.css');
assert(app.includes('personTabV2.js?v=1'),'runtime must load personTabV2');
assert(app.includes('personTabV2.css?v=1'),'runtime must load personTabV2 stylesheet');
assert(!app.includes('personTabPremium.js?v=44'),'legacy personTabPremium must not be injected');
assert(!app.includes('personTabLayoutFix.css?v=2'),'legacy personTabLayoutFix must not be injected');
assert(router.includes('PersonTabV2.render'),'canonical task router must route Persoon to V2');
assert(!view.includes(':has('),'person tab V2 renderer must not depend on :has layout selectors');
assert(!css.includes('.task-tabs'),'person tab V2 stylesheet must not style shared task tabs');
assert(view.includes('PersonDashboardService.subscribe'),'V2 must render from PersonDashboardService');
assert(view.includes('member.heroImage||member.avatar'),'hero must come from the view model');
console.log('PersonTabV2 runtime contract OK');
