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
    'src/core/notificationStore.js?v=3',
    'src/core/notificationEvents.js?v=2',
    'src/core/notificationActions.js?v=4',
    'src/core/notificationCenter.js?v=2',
    'src/core/notificationDelivery.js?v=2',
    'src/core/pushDeviceRegistry.js?v=1',
    'src/core/pushRegistrationService.js?v=2',
    'src/core/pushDeliveryBridge.js?v=1',
    'src/core/pushNotificationSettings.js?v=3',
    'src/modules/tasks/taskNotificationProjector.js?v=2',
    'src/modules/tasks/taskSwapNotificationProjector.js?v=2',
    'src/modules/tasks/partyQuestNotificationProjector.js?v=2',
    'src/core/progressionStore.js?v=1'
  ];
  let previous=-1;
  expected.forEach(src=>{
    const idx=list.indexOf(src);
    assert.ok(idx>=0,src+' must be present in actual served HTML');
    assert.ok(idx>previous,src+' must load in canonical STEP 10 order');
    previous=idx;
  });

  const repository=fs.readFileSync('src/core/notificationHouseholdRepository.js','utf8');
  const store=fs.readFileSync('src/core/notificationStore.js','utf8');
  const events=fs.readFileSync('src/core/notificationEvents.js','utf8');
  const actions=fs.readFileSync('src/core/notificationActions.js','utf8');
  const center=fs.readFileSync('src/core/notificationCenter.js','utf8');
  const delivery=fs.readFileSync('src/core/notificationDelivery.js','utf8');
  const pushRegistry=fs.readFileSync('src/core/pushDeviceRegistry.js','utf8');
  const pushService=fs.readFileSync('src/core/pushRegistrationService.js','utf8');
  const pushBridge=fs.readFileSync('src/core/pushDeliveryBridge.js','utf8');
  const pushSettings=fs.readFileSync('src/core/pushNotificationSettings.js','utf8');
  const pushSw=fs.readFileSync('firebase-messaging-sw.js','utf8');
  const pushConfig=fs.readFileSync('api/push-config.js','utf8');
  const pushSend=fs.readFileSync('api/push-send.js','utf8');
  const pushSender=fs.readFileSync('src/server/firebasePushSender.js','utf8');
  const profileTarget=fs.readFileSync('src/modules/profile/ProfileScreen.target.js','utf8');
  const taskProjector=fs.readFileSync('src/modules/tasks/taskNotificationProjector.js','utf8');
  const swapProjector=fs.readFileSync('src/modules/tasks/taskSwapNotificationProjector.js','utf8');
  const partyProjector=fs.readFileSync('src/modules/tasks/partyQuestNotificationProjector.js','utf8');

  assert.ok(repository.includes("VERSION='1.0.0'"));
  assert.ok(store.includes("VERSION='2.1.0'"));
  assert.ok(events.includes("VERSION='2.0.0'"));
  assert.ok(actions.includes("VERSION='3.1.0'"));
  assert.ok(center.includes("VERSION='2.0.0'"));
  assert.ok(delivery.includes("VERSION='2.0.0'"));
  assert.ok(pushRegistry.includes("VERSION='1.0.0'"));
  assert.ok(pushService.includes("VERSION='1.1.0'"));
  assert.ok(pushBridge.includes("VERSION='1.0.0'"));
  assert.ok(pushSettings.includes("VERSION='1.1.1'"));
  assert.ok(taskProjector.includes("VERSION='2.0.0'"));
  assert.ok(swapProjector.includes("VERSION='2.0.0'"));
  assert.ok(partyProjector.includes("VERSION='2.0.0'"));

  [repository,store,events,actions,center,delivery,pushRegistry,pushService,pushBridge,taskProjector,swapProjector,partyProjector].forEach((source,i)=>{
    assert.ok(!/window\.fbUser/.test(source),'served STEP 10 module '+i+' must not use legacy fbUser identity');
    assert.ok(!/\bfbFamilyId\b/.test(source),'served STEP 10 module '+i+' must not use legacy fbFamilyId identity');
  });
  assert.ok(repository.includes('HouseholdContext.capture'));
  assert.ok(repository.includes('HouseholdContext.isCurrent'));
  assert.ok(store.includes('publishOnce'));
  assert.ok(store.includes('NOTIFICATION_EVENT_KEY_REQUIRED'));
  assert.ok(store.includes('var bridge=window.PushDeliveryBridge')&&store.includes('bridge.dispatchCreated'),'canonical creation must hand new events to best-effort push delivery');
  assert.ok(events.includes('publishToUidsOnce'));
  assert.ok(events.includes('publishHouseholdOnce'));

  assert.ok(indexOfScript(list,'src/core/notificationCenter.js')>indexOfScript(list,'src/modules/finance/finance.js'),'NotificationCenter must load after legacy finance renderer so it owns renderNotifs');

  assert.ok(pushRegistry.includes("'users/'+uid+'/private/pushDevices/'"),'push tokens must live in the user-private registry');
  assert.ok(!/families\/.*fcmTokens/.test(pushRegistry),'new push registry must not restore household-shared token storage');

  // Startup remains prompt-free and readiness is checked before the only
  // Notification.requestPermission call.
  assert.ok(pushService.includes('window.setupPushNotifications=function(){return api.start();};'),'legacy startup push entrypoint must be neutralized');
  assert.strictEqual((pushService.match(/Notification\.requestPermission\(\)/g)||[]).length,1,'only explicit requestEnable flow may request permission');
  assert.ok(pushService.indexOf('assertDeliveryConfig();')<pushService.indexOf('Notification.requestPermission()'),'delivery readiness must be checked before permission');
  assert.ok(pushService.includes('PUSH_SENDER_NOT_CONFIGURED'));
  assert.ok(pushSettings.includes('st.senderConfigured===false'));
  assert.ok(pushSettings.includes('st.vapidConfigured===false'));
  assert.ok(pushSettings.includes('svc.requestEnable()'),'notification settings button must own explicit push opt-in');
  assert.ok(pushSettings.indexOf('st.iosLike&&!st.standalone')<pushSettings.indexOf('!st.supported'),'iPhone Safari must show Home Screen guidance before generic unsupported messaging');
  assert.ok(profileTarget.includes("button.dataset.profileRow === 'Meldingen'"),'profile notification row must have a real navigation branch');
  assert.ok(profileTarget.includes("window.showScreen('notif')"),'profile notification row must navigate to the canonical notification screen');

  // Web Push delivery files are present. The public readiness endpoint may read
  // protected env vars server-side, but returns only readiness booleans plus the
  // intentionally public VAPID key. The executable handler contract is covered
  // separately by test-push-config-readiness.js.
  assert.ok(pushSw.includes('firebase-messaging-compat.js'));
  assert.ok(pushSw.includes('onBackgroundMessage'));
  assert.ok(pushSw.includes("self.addEventListener('notificationclick'"));
  assert.ok(pushConfig.includes('FAMILYAPP_WEB_PUSH_VAPID_KEY'));
  assert.ok(pushConfig.includes('vapidConfigured:vapidConfigured'));
  assert.ok(pushConfig.includes('senderConfigured:senderConfigured'));
  assert.ok(!pushConfig.includes('senderEmail:senderEmail'),'public response may not expose sender email');
  assert.ok(!pushConfig.includes('senderPrivateKey:senderPrivateKey'),'public response may not expose private key');

  // Trusted sender accepts only canonical notification identity from the client
  // and resolves recipients/tokens server-side.
  assert.ok(pushBridge.includes("window.fetch('/api/push-send'"));
  assert.ok(pushBridge.includes('householdId:String(c.householdId)'));
  assert.ok(pushBridge.includes('notificationId:String(event.id)'));
  assert.ok(!pushBridge.includes('token:')&&!pushBridge.includes('title:String'),'client bridge must not send raw token/title authority');
  assert.ok(pushSend.includes('sendCanonicalNotification'));
  assert.ok(pushSender.includes('sendCanonicalNotification'));
  assert.ok(pushSender.includes('FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL'));
  assert.ok(pushSender.includes('FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY'));

  console.log('STEP 10 served notification + readiness-aware Web Push sender audit: PASS');
})().catch(error=>{console.error(error);process.exit(1);});