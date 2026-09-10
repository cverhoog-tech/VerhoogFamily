#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'src/modules/cleaning/cleaningScreen.js'),'utf8');
const inbox=fs.readFileSync(path.join(ROOT,'src/platform/inbox/actionInboxBootstrap.js'),'utf8');
const rules=fs.readFileSync(path.join(ROOT,'database.rules.json'),'utf8');

// Cleaning v2 owns the client capability boundary directly so the old
// permissions decorator/runtime does not need to boot at all.
assert.match(source,/owner','admin','manager','beheerder/,'manager aliases must remain mapped');
assert.match(source,/adult','member','gezinslid/,'adult/member aliases must remain mapped');
assert.match(source,/child','limited','restricted','beperkt/,'limited aliases must remain mapped');
assert.match(source,/capability===CAP\.EXECUTION\|\|capability===CAP\.RESPOND/,'limited profiles keep execution/respond capability');
assert.match(source,/role==='MANAGER'\)return true/,'manager keeps all client capabilities');
assert.match(source,/role==='MEMBER'\)return capability===CAP\.STRUCTURE\|\|capability===CAP\.PLANNING\|\|capability===CAP\.SUPPLIES/,'adult/member keeps non-destructive household management');
assert.match(source,/requireCap\(CAP\.DESTRUCTIVE\)/,'destructive room/routine operations stay manager-only');
assert.match(source,/requireCap\(CAP\.STRUCTURE\)/,'room/routine mutations stay capability guarded');
assert.match(source,/requireCap\(CAP\.PLANNING\)/,'week planning stays capability guarded');
assert.match(source,/requireCap\(CAP\.SUPPLIES\)/,'supply mutations stay capability guarded');
assert.match(source,/requireCap\(CAP\.EXECUTION\)/,'canonical checklist execution stays capability guarded');
assert.match(source,/requireCap\(CAP\.RESPOND\)/,'Action Inbox Cleaning responses stay capability guarded');
assert.doesNotMatch(inbox,/cleaningPermissions|modules\/cleaning/,'Action Inbox must not eagerly boot a second permission/runtime path');
assert.ok(rules.includes('"$sharedData"'),'existing Firebase rules boundary remains explicit; no rules deployment is smuggled into this rebuild');
console.log('Cleaning v2 permissions contract PASSED.');
