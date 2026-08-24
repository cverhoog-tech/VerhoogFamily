'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

async function servedHtml(){
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  assert.ok(body.includes('<!DOCTYPE html>'),'api/app must produce the served HTML');
  return body;
}
function scripts(html){
  const out=[];const re=/<script[^>]+src=["']([^"']+)["'][^>]*>/g;let m;
  while((m=re.exec(html)))out.push(m[1]);
  return out;
}
function indexOfScript(list,prefix){return list.findIndex(x=>String(x).startsWith(prefix));}

(async function(){
  const html=await servedHtml();
  const list=scripts(html);
  const expected=[
    'src/core/householdContext.js?v=1',
    'src/core/notificationHouseholdRepository.js?v=1',
    'src/core/notificationStore.js?v=2',
    'src/core/notificationEvents.js?v=2',
    'src/core/notificationActions.js?v=3',
    'src/core/notificationCenter.js?v=2',
    'src/core/notificationDelivery.js?v=2',
    'src/modules/tasks/taskNotificationProjector.js?v=2',
    'src/modules/tasks/taskSwapNotificationProjector.js?v=2',
    'src/modules/tasks/partyQuestNotificationProjector.js?v=2',
    'src/core/progressionStore.js?v=1'
  ];
  let previous=-1;
  expected.forEach(src=>{
    const idx=list.indexOf(src);
    assert.ok(idx>=0,src+' must be present in actual served HTML');
    assert.ok(idx>previous,src+' must load in canonical notification order');
    previous=idx;
  });

  const repository=fs.readFileSync('src/core/notificationHouseholdRepository.js','utf8');
  const store=fs.readFileSync('src/core/notificationStore.js','utf8');
  const events=fs.readFileSync('src/core/notificationEvents.js','utf8');
  const actions=fs.readFileSync('src/core/notificationActions.js','utf8');
  const center=fs.readFileSync('src/core/notificationCenter.js','utf8');
  const delivery=fs.readFileSync('src/core/notificationDelivery.js','utf8');
  const taskProjector=fs.readFileSync('src/modules/tasks/taskNotificationProjector.js','utf8');
  const swapProjector=fs.readFileSync('src/modules/tasks/taskSwapNotificationProjector.js','utf8');
  const partyProjector=fs.readFileSync('src/modules/tasks/partyQuestNotificationProjector.js','utf8');

  assert.ok(repository.includes("VERSION='1.0.0'"));
  assert.ok(store.includes("VERSION='2.0.0'"));
  assert.ok(events.includes("VERSION='2.0.0'"));
  assert.ok(actions.includes("VERSION='3.0.0'"));
  assert.ok(center.includes("VERSION='2.0.0'"));
  assert.ok(delivery.includes("VERSION='2.0.0'"));
  assert.ok(taskProjector.includes("VERSION='2.0.0'"));
  assert.ok(swapProjector.includes("VERSION='2.0.0'"));
  assert.ok(partyProjector.includes("VERSION='2.0.0'"));

  // Canonical notification modules may not silently restore older identity
  // owners after activation.
  [repository,store,events,actions,center,delivery,taskProjector,swapProjector,partyProjector].forEach((source,i)=>{
    assert.ok(!/window\.fbUser/.test(source),'served notification module '+i+' must not use legacy fbUser identity');
    assert.ok(!/\bfbFamilyId\b/.test(source),'served notification module '+i+' must not use legacy fbFamilyId identity');
  });
  assert.ok(repository.includes('HouseholdContext.capture'));
  assert.ok(repository.includes('HouseholdContext.isCurrent'));
  assert.ok(store.includes('publishOnce'));
  assert.ok(store.includes('NOTIFICATION_EVENT_KEY_REQUIRED'));
  assert.ok(events.includes('publishToUidsOnce'));
  assert.ok(events.includes('publishHouseholdOnce'));

  // Notification UI must be active instead of the old permanent loading state.
  assert.ok(indexOfScript(list,'src/core/notificationCenter.js')>indexOfScript(list,'src/modules/finance/finance.js'),'NotificationCenter must load after legacy finance renderer so it owns renderNotifs');

  // STEP 10 push delivery is intentionally not activated by this in-app cutover.
  // No messaging service worker is injected by api/app at this checkpoint.
  assert.ok(!list.some(x=>/firebase-messaging-sw|pushDelivery|pushDevice/i.test(x)),'push adapter must remain separate until its own contract is implemented');

  console.log('STEP 10 served canonical notification runtime audit: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
