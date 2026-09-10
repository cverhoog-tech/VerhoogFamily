'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningScreen.js'),'utf8');

assert.match(source,/memberFilterUid:''/,'planning filter stays local UI state');
assert.match(source,/data-cv2-member-filter/,'week plan exposes member filter controls');
assert.match(source,/ui\.memberFilterUid=text\(target\.dataset\.cv2MemberFilter\)/,'filter handler only changes local UI state');
assert.match(source,/if\(ui\.memberFilterUid&&assignees\.indexOf\(ui\.memberFilterUid\)<0\)ui\.memberFilterUid=''/,'stale member filter clears after live plan changes');
assert.match(source,/row\.assignmentUids\|\|\[\]/,'filter derives identities from canonical assignmentUids');
assert.match(source,/var visible=ui\.memberFilterUid\?all\.filter/,'visible plan cards use selected member');
assert.match(source,/minutes=visible\.reduce/,'visible workload total follows filtered cards');
const handlerStart=source.indexOf('if(target.dataset.cv2MemberFilter!==undefined)');
const handlerEnd=source.indexOf('if(target.dataset.cv2Turn)',handlerStart);
assert.ok(handlerStart>=0&&handlerEnd>handlerStart,'v2 member filter handler must exist');
const handler=source.slice(handlerStart,handlerEnd);
assert.doesNotMatch(handler,/Firebase|writeContext|transaction|update\(/,'member filtering must perform no persistence work');
console.log('Cleaning v2 planning member filter contract: PASS');
