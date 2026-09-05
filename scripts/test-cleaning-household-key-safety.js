'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningDomain.js'),'utf8');
const sandbox={window:{},console,JSON,Object,Array,String,Number,Math,Date};
sandbox.window.window=sandbox.window;
vm.runInNewContext(source,sandbox,{filename:'cleaningDomain.js'});
const domain=sandbox.window.CleaningDomain;

assert.ok(domain,'CleaningDomain must register');
assert.strictEqual(domain.version,'0.2.0','household-key hardening must preserve the existing domain API/version contract');
assert.strictEqual(domain.firebaseKey('family-123'),'family-123');
assert.strictEqual(domain.basePath('family-123'),'families/family-123/cleaning');
assert.strictEqual(domain.paths('family-123').occurrences,'families/family-123/cleaning/occurrences');

[
  'family/other','family.other','family#other','family$other','family[other','family]other',
  ' family-123','family-123 ','family\u0000other','family\nother','family\u007fother',''
].forEach((value)=>{
  const decoded=value.replace('\\u0000','\u0000').replace('\\n','\n').replace('\\u007f','\u007f');
  assert.strictEqual(domain.firebaseKey(decoded),'','invalid household Firebase key must be rejected: '+JSON.stringify(value));
  assert.strictEqual(domain.basePath(decoded),null,'invalid household id must never resolve to a Cleaning path: '+JSON.stringify(value));
  assert.strictEqual(domain.paths(decoded),null,'invalid household id must never resolve collection paths: '+JSON.stringify(value));
});

assert.notStrictEqual(domain.basePath('family/other'),'families/family_other/cleaning','invalid household ids must never be silently rewritten');
assert.strictEqual(domain.safeId('room/upper'),'room_upper','existing child-id sanitation remains unchanged');
assert.ok(domain.PRIORITY&&domain.PRIORITY.NORMAL==='NORMAL','existing enum API must remain intact');
assert.ok(domain.PLAN_STATUS&&domain.PLAN_STATUS.PARTIALLY_ACCEPTED==='PARTIALLY_ACCEPTED','existing plan status API must remain intact');
assert.ok(typeof domain.normalizeRoom==='function');
assert.ok(typeof domain.normalizeRoutineItem==='function');
assert.ok(typeof domain.normalizeOccurrence==='function');
assert.ok(typeof domain.normalizeUserPreferences==='function');

console.log('cleaning household Firebase key validation + legacy domain API preservation: ok');
