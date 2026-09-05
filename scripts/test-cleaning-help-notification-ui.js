'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('src/modules/cleaning/cleaningHelpNotificationUi.js','utf8');
const calendar=fs.readFileSync('src/modules/calendar/calendar.js','utf8');
const bootstrap=fs.readFileSync('src/modules/cleaning/cleaningExperienceBootstrap.js','utf8');
const exceptionUi=fs.readFileSync('src/modules/cleaning/cleaningExceptionTaskUi.js','utf8');

let activeUid='member-a';
let root={occurrences:{}};
const calls=[];
const readIds=[];

const HouseholdContext={snapshot(){return{ready:true,uid:activeUid,householdId:'house-1',revision:1};}};
const CleaningHouseholdRepository={snapshot(){return{ready:true,data:root};}};
const NotificationStore={markRead(id){readIds.push(String(id));return Promise.resolve(true);},list(){return[];}};
const CleaningExceptionRuntime={respondToHelpRequest(id,action){calls.push({id:String(id),action:String(action)});const row=root.occurrences[String(id)];if(!row||!row.helpRequest||row.helpRequest.status!=='PENDING')return Promise.reject(new Error('Deze hulpvraag is niet meer actief'));if(String(row.helpRequest.toUid)!==String(activeUid))return Promise.reject(new Error('Deze hulpvraag is niet voor jou'));row.helpRequest.status=action==='ACCEPT_HELP'?'ACCEPTED':'DECLINED';if(action==='ACCEPT_HELP')row.assignmentUids=Array.from(new Set([...(row.assignmentUids||[]),activeUid]));return Promise.resolve({action,occurrenceIds:[String(id)]});}};
const window={HouseholdContext,CleaningHouseholdRepository,NotificationStore,CleaningExceptionRuntime};
const sandbox={window,HouseholdContext,CleaningHouseholdRepository,NotificationStore,CleaningExceptionRuntime,console,Promise,Date,setTimeout,clearTimeout};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'cleaningHelpNotificationUi.js'});
const ui=window.CleaningHelpNotificationUi;

function event(id='n1'){return{id,type:'cleaning.help.requested',body:'Er is hulp gevraagd.',data:{occurrenceId:'occ-1'},entity:{type:'cleaningOccurrence',id:'occ-1'}};}
function pending(toUid='member-a'){root={occurrences:{'occ-1':{id:'occ-1',assignmentUids:['owner'],helpRequest:{fromUid:'owner',toUid,status:'PENDING',requestedAt:1}}}};}
function labels(model){return Array.from(model.actions||[],a=>String(a.label));}

(async function(){
  assert.ok(ui);
  assert.strictEqual(ui.version,'0.1.0');
  assert.ok(!source.includes('.transaction('),'notification bridge may not own a Cleaning transaction');
  assert.ok(!source.includes('.update('),'notification bridge may not write Cleaning directly');
  assert.ok(!source.includes('window.NotificationActions='),'notification bridge may not replace the frozen NotificationActions core');
  assert.ok(source.includes('respondToHelpRequest'),'canonical CleaningExceptionRuntime must own accept/decline writes');

  pending();
  let model=ui.modelForEvent(event());
  assert.strictEqual(model.statusLabel,'Wacht op jouw reactie');
  assert.deepStrictEqual(labels(model),['Accepteren','Afwijzen']);

  await ui.respond(event('accept-n'),'accept');
  assert.deepStrictEqual(calls.at(-1),{id:'occ-1',action:'ACCEPT_HELP'});
  assert.deepStrictEqual(root.occurrences['occ-1'].assignmentUids,['owner','member-a']);
  assert.strictEqual(root.occurrences['occ-1'].helpRequest.status,'ACCEPTED');
  assert.ok(readIds.includes('accept-n'));
  model=ui.modelForEvent(event());
  assert.strictEqual(model.statusLabel,'Geaccepteerd ✓');
  assert.strictEqual(model.actions.length,0);

  pending();
  await ui.respond(event('decline-n'),'decline');
  assert.deepStrictEqual(calls.at(-1),{id:'occ-1',action:'DECLINE_HELP'});
  assert.deepStrictEqual(root.occurrences['occ-1'].assignmentUids,['owner']);
  assert.strictEqual(root.occurrences['occ-1'].helpRequest.status,'DECLINED');
  assert.ok(readIds.includes('decline-n'));

  pending('member-b');
  model=ui.modelForEvent(event());
  assert.strictEqual(model.statusLabel,'Niet voor jou');
  assert.strictEqual(model.actions.length,0);

  // Both actual runtime paths must load the bridge after the exception runtime.
  assert.ok(calendar.includes("load('src/modules/cleaning/cleaningHelpNotificationUi.js?v=1'"));
  assert.ok(calendar.indexOf('cleaningExceptionRuntime.js?v=1')<calendar.indexOf('cleaningHelpNotificationUi.js?v=1'));
  assert.ok(calendar.indexOf('cleaningHelpNotificationUi.js?v=1')<calendar.indexOf('cleaningExceptionTaskUi.js?v=1'));
  assert.ok(bootstrap.includes("import './cleaningHelpNotificationUi.js?v=1';"));
  assert.ok(bootstrap.indexOf('cleaningExceptionRuntime.js?v=1')<bootstrap.indexOf('cleaningHelpNotificationUi.js?v=1'));

  // User feedback: incomplete-work choices must remain concise and concrete.
  assert.ok(exceptionUi.includes('Wat wil je doen?'));
  assert.ok(exceptionUi.includes('Plan alleen de open stappen opnieuw.'));
  assert.ok(exceptionUi.includes('Stop voor nu. De routine gaat verder bij de volgende normale beurt.'));
  assert.ok(exceptionUi.includes('Sla de open stappen van deze beurt over.'));
  assert.ok(exceptionUi.includes('Vraag iemand om bij deze beurt mee te helpen.'));

  console.log('Cleaning help notification accept/decline + concise incomplete-work UX: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
