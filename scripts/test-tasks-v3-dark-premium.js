'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const css=read('src/styles/tasksV3DarkPremium.css');
const shell=read('api/app-v7.js');

assert(css.includes('PREMIUM DARK OVERVIEW'),'premium dark overview stylesheet identity missing');
assert(css.includes('[data-theme*="dark"] body[data-task-view="overview"][data-task-v3="1"]'),'dark overview styling must be tightly scoped to Tasks V3 overview');
assert(css.includes('linear-gradient(180deg,#040a0d 0%,#061013 42%,#050d10 100%)'),'deeper charcoal/blue-black overview canvas missing');
assert(css.includes('.tv3-stat--open'),'open summary card treatment missing');
assert(css.includes('.tv3-stat--important'),'important summary card treatment missing');
assert(css.includes('.tv3-stat--overdue'),'overdue summary card treatment missing');
assert(css.includes('#f3dd9a'),'approved luminous soft-gold active filter treatment missing');
assert(css.includes('.tv3-task-row'),'premium task-row surface treatment missing');
assert(css.includes('.tv3-xp'),'warm bronze XP treatment missing');
assert(css.includes("url('/src/assets/task-heroes/cozy-home.webp')"),'quote banner photo treatment missing');
assert(css.includes('#ai-fab'),'legacy AI fab defensive removal missing');
assert(css.includes('#ai-panel'),'legacy AI panel defensive removal missing');
assert(!css.includes('.tv3d-card'),'premium overview pass must not redesign the accepted detail card');
assert(!css.includes('.tv3e-card'),'premium overview pass must not redesign the accepted editor card');
assert(shell.includes('/src/styles/tasksV3DarkPremium.css?v=2'),'live V7 shell must serve latest premium dark overview stylesheet');
assert(shell.indexOf('tasksV3Polish.css?v=2')<shell.indexOf('tasksV3DarkPremium.css?v=2'),'premium dark overview stylesheet must load after the base overview polish');
assert(shell.includes("body.indexOf('<!-- AI PANEL (floating, per screen) -->')"),'served shell must strip the legacy global AI panel');
assert(shell.includes("body.indexOf('<!-- ACHIEVEMENTS -->', aiPanelStart)"),'AI panel strip must stop before achievements content');

console.log('Tasks V3 deeper premium dark overview + global legacy AI removal contract: PASS');
