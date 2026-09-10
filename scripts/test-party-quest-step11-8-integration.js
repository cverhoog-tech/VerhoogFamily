'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const crypto=require('crypto');

function read(path){return fs.readFileSync(path,'utf8');}
function count(haystack,needle){return haystack.split(needle).length-1;}
function gitBlobSha(source){
  return crypto.createHash('sha1').update(Buffer.concat([
    Buffer.from('blob '+Buffer.byteLength(source)+'\0'),
    Buffer.from(source)
  ])).digest('hex');
}

const partyQuestModules=[
  'src/modules/tasks/partyQuestRepository.js',
  'src/modules/tasks/partyQuestService.js',
  'src/modules/tasks/partyQuestActiveView.js',
  'src/modules/tasks/partyQuestHelpUi.js',
  'src/modules/tasks/partyQuestCompletionReward.js',
  'src/modules/tasks/partyQuestInvites.js',
  'src/modules/tasks/partyQuestNotificationProjector.js'
];

for(const path of partyQuestModules){
  new vm.Script(read(path),{filename:path});
}

// Frozen notification action boundary must remain exact through the integrated
// STEP 11 release candidate.
assert.strictEqual(
  gitBlobSha(read('src/core/notificationActions.js')),
  '60a48daa628bc56531395d188a0811711d82a328',
  'frozen NotificationActions blob must remain exact'
);

async function renderServedHtml(){
  const handler=require('../api/app.js');
  let statusCode=200,body='',headers={};
  const res={
    setHeader(name,value){headers[String(name).toLowerCase()]=String(value);},
    status(code){statusCode=code;return this;},
    send(value){body=String(value);return this;}
  };
  await handler({},res);
  assert.strictEqual(statusCode,200,'served app loader must render successfully');
  assert.ok(/text\/html/i.test(headers['content-type']||''),'served app must remain HTML');
  assert.ok(/no-store/i.test(headers['cache-control']||''),'served app shell must remain no-store');
  return body;
}

(async function(){
  const html=await renderServedHtml();

  // Canonical STEP 11 runtime candidate. Each layer must be served exactly once.
  const requiredScripts=[
    'src/modules/tasks/partyQuestRepository.js?v=2',
    'src/modules/tasks/partyQuestService.js?v=4',
    'src/modules/tasks/partyQuestActiveView.js?v=7',
    'src/modules/tasks/partyQuestHelpUi.js?v=1',
    'src/modules/tasks/partyQuestCompletionReward.js?v=4',
    'src/modules/tasks/partyQuestInvites.js?v=8',
    'src/modules/tasks/partyQuestNotificationProjector.js?v=3'
  ];
  for(const script of requiredScripts){
    assert.strictEqual(count(html,script),1,'served runtime must contain exactly one '+script);
  }

  // Canonical dependencies/authorities must also be singular in the final shell.
  const authorityScripts=[
    'src/core/householdContext.js?v=1',
    'src/modules/tasks/taskHouseholdRepository.js?v=1',
    'src/core/progressionStore.js?v=1',
    'src/core/progressionRuntime.js?v=2',
    'src/core/notificationStore.js?v=3',
    'src/core/notificationEvents.js?v=3',
    'src/core/notificationActions.js?v=4'
  ];
  for(const script of authorityScripts){
    assert.strictEqual(count(html,script),1,'canonical authority must be served exactly once: '+script);
  }

  // Within the canonical bootstrap block, dependencies must retain their safe
  // order: HouseholdContext before PartyQuestRepository before PartyQuestService,
  // and NotificationStore before events/actions/projector.
  const idx=(s)=>html.indexOf(s);
  assert.ok(idx('src/core/householdContext.js?v=1')<idx('src/modules/tasks/partyQuestRepository.js?v=2'),'HouseholdContext must precede PartyQuestRepository');
  assert.ok(idx('src/modules/tasks/partyQuestRepository.js?v=2')<idx('src/modules/tasks/partyQuestService.js?v=4'),'PartyQuestRepository must precede PartyQuestService');
  assert.ok(idx('src/core/notificationStore.js?v=3')<idx('src/core/notificationEvents.js?v=3'),'NotificationStore must precede NotificationEvents');
  assert.ok(idx('src/core/notificationEvents.js?v=3')<idx('src/core/notificationActions.js?v=4'),'NotificationEvents must precede NotificationActions');
  assert.ok(idx('src/core/notificationActions.js?v=4')<idx('src/modules/tasks/partyQuestNotificationProjector.js?v=3'),'NotificationActions must be established before the Party Quest projector');

  // Current task UX remains available, while the dormant pre-rebuild Party Quest
  // prototype stays quarantined from the served application.
  assert.strictEqual(count(html,'src/modules/tasks/duoQuests.js?v=3'),1,'current duoQuests task UX must remain served once');
  ['groupQuests.js','groupQuestEditor.js','groupQuestPremium.js'].forEach(file=>{
    assert.strictEqual(count(html,file),0,'legacy Party Quest prototype must not be served: '+file);
  });

  // No accidental second/unversioned canonical Party Quest script may sneak in.
  partyQuestModules.forEach(path=>{
    const basename=path.split('/').pop();
    const matches=(html.match(new RegExp('src/modules/tasks/'+basename.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'(?:\\?v=\\d+)?','g'))||[]);
    assert.strictEqual(matches.length,1,'Party Quest module must have one served script reference: '+basename);
  });

  console.log('party quest STEP 11.8 integrated served-runtime candidate: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
