'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const css=read('src/styles/tasksV3DarkPremium.css');
const shell=read('api/app-v7.js');

assert(css.includes('PREMIUM DARK OVERVIEW'),'premium dark overview stylesheet identity missing');
assert(css.includes('[data-theme*="dark"] body[data-task-view="overview"][data-task-v3="1"]'),'dark overview styling must be tightly scoped to Tasks V3 overview');
assert(css.includes('linear-gradient(180deg,#071115 0%,#071316 48%,#061014 100%)'),'deep charcoal/blue-black overview canvas missing');
assert(css.includes('.tv3-stat--open'),'open summary card treatment missing');
assert(css.includes('.tv3-stat--important'),'important summary card treatment missing');
assert(css.includes('.tv3-stat--overdue'),'overdue summary card treatment missing');
assert(css.includes('#ecd58f'),'approved soft-gold active filter treatment missing');
assert(css.includes('.tv3-task-row'),'premium task-row surface treatment missing');
assert(css.includes('.tv3-xp'),'warm bronze XP treatment missing');
assert(css.includes("url('/src/assets/task-heroes/cozy-home.webp')"),'quote banner photo treatment missing');
assert(!css.includes('.tv3d-card'),'premium overview pass must not redesign the accepted detail card');
assert(!css.includes('.tv3e-card'),'premium overview pass must not redesign the accepted editor card');
assert(shell.includes('/src/styles/tasksV3DarkPremium.css?v=1'),'live V7 shell must serve premium dark overview stylesheet');
assert(shell.indexOf('tasksV3Polish.css?v=2')<shell.indexOf('tasksV3DarkPremium.css?v=1'),'premium dark overview stylesheet must load after the base overview polish');

console.log('Tasks V3 premium high-contrast dark overview contract: PASS');
