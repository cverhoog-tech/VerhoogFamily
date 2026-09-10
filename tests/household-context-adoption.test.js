'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

const bridge=fs.readFileSync(path.join(__dirname,'../src/core/householdIdentityFirebaseBridge.js'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'../api/app.js'),'utf8');

assert(bridge.includes('HouseholdContext.subscribe'),'identity bridge must subscribe to HouseholdContext');
assert(!bridge.includes('setInterval('),'identity bridge must not poll for household readiness');
assert(!bridge.includes("window.addEventListener('focus'"),'identity bridge must not use focus as lifecycle owner');
assert(!bridge.includes("window.addEventListener('online'"),'identity bridge must not use online event as household rebind owner');
assert(bridge.includes("off('value',membersCb)"),'members listener must detach its exact callback');
assert(bridge.includes("off('value',presenceCb)"),'presence listener must detach its exact callback');
assert(runtime.includes('src/core/authenticatedSessionController.js?v=1'),'session controller must load in runtime');
assert(runtime.includes('src/core/householdContext.js?v=1'),'HouseholdContext must load directly after session ownership');

console.log('household-context-adoption: ok');
