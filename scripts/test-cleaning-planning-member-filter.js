const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'src', 'modules', 'cleaning', 'cleaningScreen.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function assert(condition, message){
  if(!condition){
    console.error('FAIL:', message);
    process.exitCode = 1;
  }
}

assert(source.includes("memberFilterUid: ''"), 'planning keeps member filter in local UI state');
assert(source.includes('data-cleaning-plan-member-filter'), 'member load cards expose a planning filter control');
assert(source.includes("state.planning.memberFilterUid = state.planning.memberFilterUid === uid ? '' : uid;"), 'tapping the same member toggles the filter off');
assert(source.includes('const filterableUids = new Set(memberLoads.map'), 'filter validity is derived from current plan member loads');
assert(source.includes("if(selectedUid && !filterableUids.has(selectedUid))"), 'stale member filters are cleared after realtime plan changes');
assert(source.includes('occurrence.assignmentUids.map(String).includes(selectedUid)'), 'visible occurrences are filtered by canonical assignmentUids');
assert(source.includes('const visibleMinutes = visibleOccurrences.reduce'), 'visible minute total follows the filtered occurrence set');
assert(source.includes('const occurrenceCards = occurrences.map'), 'all occurrence cards remain in canonical plan order');
assert(source.includes('return occurrenceCardMarkup(occurrence, !assignedToSelected);'), 'nonmatching occurrence cards are hidden instead of removed');
assert(source.includes("return '<article class=\"cleaning-plan-card\"'+(hidden?' hidden':'')+'>'"), 'hidden attribute preserves approval DOM indexing while filtering');
assert(!source.includes('visibleOccurrences.map(occurrenceCardMarkup)'), 'filtered rendering must not drop cards from the approval UI DOM sequence');

const handlerStart = source.indexOf("root.querySelectorAll('[data-cleaning-plan-member-filter]')");
const handlerEnd = source.indexOf("root.querySelectorAll('[data-cleaning-room-edit]')", handlerStart);
assert(handlerStart >= 0 && handlerEnd > handlerStart, 'member filter event handler is present');
if(handlerStart >= 0 && handlerEnd > handlerStart){
  const handler = source.slice(handlerStart, handlerEnd);
  assert(!/CleaningHouseholdRepository|saveDraftPlan|transaction/i.test(handler), 'member filter handler performs no repository/Firebase mutation');
}

if(process.exitCode){
  process.exit(process.exitCode);
}
console.log('PASS: cleaning planning member filter contract');
