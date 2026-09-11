'use strict';
const fs=require('fs');
const path=require('path');
function read(p){return fs.readFileSync(path.join(__dirname,'..',p),'utf8');}
function ok(value,message){if(!value)throw new Error(message);}
const bridge=read('src/modules/cleaning/cleaningPremiumFeedback.js');
const css=read('src/styles/cleaning-v24.css');
const screen=read('src/modules/cleaning/cleaningScreen.js');
ok(bridge.includes("CleaningV24Visual=Object.freeze({version:'2.4.0',presentationOnly:true})"),'V2.4 presentation marker missing');
ok(bridge.includes("cleaning-v24.css?v=1"),'V2.4 stylesheet is not lazy-loaded by Cleaning bridge');
ok(bridge.includes("CleaningPremiumFeedback=Object.freeze({version:'2.2.1'"),'Accepted V2.2.1 bridge marker changed');
ok(css.includes('#screen-cleaning .cv2-room-grid'),'V2.4 room-grid polish missing');
ok(css.includes('#screen-cleaning .cv2-turn-card'),'V2.4 turn-card polish missing');
ok(css.includes('[data-theme*="dark"] #screen-cleaning'),'V2.4 dark-mode contract missing');
ok(!/backdrop-filter\s*:|filter\s*:|will-change\s*:/.test(css),'V2.4 must not add paint-heavy filters/will-change');
ok(!/animation\s*:/.test(css),'V2.4 must not add continuous CSS animation');
ok(!/MutationObserver|setInterval\s*\(|setTimeout\s*\(/.test(bridge),'V2.4 bridge must not add observers/timers');
ok(!/firebase|\.subscribe\s*\(/i.test(bridge),'V2.4 bridge must not own Firebase/subscriptions');
ok(screen.includes("const VERSION='2.0.0'"),'Primary Cleaning V2.0 owner version changed unexpectedly');
console.log('Cleaning V2.4 visual performance contract OK');