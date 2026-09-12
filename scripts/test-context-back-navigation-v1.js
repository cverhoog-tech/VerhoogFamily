'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const js=read('src/core/contextBackNavigationV1.js');
const css=read('src/styles/contextBackNavigationV1.css');
const shell=read('api/app-v7.js');
const navigation=read('src/core/navigation.js');

assert(js.includes("VERSION='1.0.0'"),'contextual back controller version missing');
assert(js.includes('var stack=[]'),'app-level screen history stack missing');
assert(js.includes('MAX_DEPTH=12'),'history stack must remain bounded');
assert(js.includes('rawShowScreen=window.showScreen'),'contextual history must wrap the canonical router rather than own screen rendering');
assert(js.includes("#bottom-nav [data-goto],#bottom-nav #nav-feed-btn,#more-grid [data-goto-more]"),'root navigation affordances must clear contextual history');
assert(js.includes('rawShowScreen(target.id)'),'back action must delegate to the canonical router');
assert(js.includes('restoreScroll(target.scrollY)'),'back action must restore prior scroll context');
assert(js.includes("#screen-tasks .tv3-brand"),'Tasks V3 custom header must receive the contextual back affordance');
assert(!/history\.back|history\.go|popstate|pushState/.test(js),'contextual app history must never become browser-history authority');
assert(css.includes('.familyapp-context-back'),'contextual back button styling missing');
assert(css.includes('border-radius:50%'),'back affordance must stay circular');
assert(css.includes('[data-theme*="dark"] .familyapp-context-back'),'dark-mode back affordance missing');
assert(shell.includes('/src/styles/contextBackNavigationV1.css?v=1'),'served shell must load contextual back styles');
assert(shell.includes('/src/core/contextBackNavigationV1.js?v=1'),'served shell must load contextual back controller');
assert(navigation.includes('function showScreen(id)'),'canonical showScreen router must remain present');

console.log('FamilyApp contextual module back navigation contract: PASS');
