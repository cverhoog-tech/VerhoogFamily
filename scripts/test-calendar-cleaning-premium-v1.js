'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const js=read('src/modules/calendar/calendarCleaningPresentationV1.js');
const css=read('src/styles/calendarCleaningPremiumV1.css');
const shell=read('api/app-v7.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');

assert(js.includes("VERSION='1.0.0'"),'calendar Cleaning presentation version missing');
assert(js.includes("source==='cleaning-occurrence'||source==='cleaning-occurrence-group'"),'presentation must identify canonical Cleaning projections by source metadata');
assert(js.includes('projectionManaged===true'),'presentation must only replace projection-managed Cleaning events');
assert(js.includes("window.CalendarMealPlanIntegration"),'Cleaning presentation must install after the existing meal presentation wrapper');
assert(js.includes('originalRenderEvents.apply(this,arguments)'),'Cleaning presentation must decorate the canonical Calendar renderer rather than own Calendar data');
assert(js.includes('CleaningHouseholdRepository'),'Cleaning card deep link must resolve room identity from canonical Cleaning data');
assert(js.includes('CleaningTurnExperience')&&js.includes('openRoom'),'Cleaning card must open the existing Cleaning turn owner');
assert(!/\.set\(|\.update\(|firebase\.database|ref\(/.test(js),'Calendar Cleaning presentation must not write Cleaning or Calendar state');
assert(css.includes('.cal-cleaning-summary'),'premium Cleaning summary surface missing');
assert(css.includes('.cal-cleaning-card'),'premium Cleaning appointment card missing');
assert(css.includes('[data-theme*="dark"] #screen-cal .cal-cleaning-summary'),'dark-mode Cleaning appointment treatment missing');
assert(css.includes('#47755c'),'Cleaning-specific pine presentation accent missing');
assert(shell.includes('/src/styles/calendarCleaningPremiumV1.css?v=1'),'served shell must load Cleaning Calendar styles');
assert(shell.includes('/src/modules/calendar/calendarCleaningPresentationV1.js?v=1'),'served shell must load Cleaning Calendar presentation');
assert(projection.includes("sourceType:group.entries.length>1?'cleaning-occurrence-group':'cleaning-occurrence'"),'canonical Cleaning projection metadata must remain available');
assert(projection.includes('projectionManaged:true'),'canonical Cleaning projection ownership marker must remain available');

console.log('Agenda premium Cleaning occurrence presentation contract: PASS');
