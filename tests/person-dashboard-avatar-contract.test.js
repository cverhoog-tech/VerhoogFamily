'use strict';
const fs = require('fs');
const path = require('path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}
function assert(cond,msg){if(!cond)throw new Error(msg);}

const service = read('src/modules/tasks/personDashboardService.js');
const view = read('src/modules/tasks/personTabPremium.js');

assert(service.includes('resolvedAvatar(identity,record)'), 'PersonDashboardService must resolve avatar at view-model level');
assert(service.includes('heroImage:avatar'), 'PersonDashboardService must expose the resolved avatar as heroImage');
assert(service.includes('familyapp:avatar-updated'), 'PersonDashboardService must refresh after avatar changes');
assert(view.includes('mem.avatar'), 'Person tab member selector must render the view-model avatar');
assert(view.includes('pp-hero-bg'), 'Person tab must render a hero background layer');
assert(!service.includes("window.addEventListener('load',boot"), 'PersonDashboardService must not use load as a lifecycle owner');

console.log('person-dashboard-avatar-contract: ok');
