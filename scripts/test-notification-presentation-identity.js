'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const actionsSource=fs.readFileSync('src/core/notificationActions.js','utf8');
const centerSource=fs.readFileSync('src/core/notificationCenter.js','utf8');
const deliverySource=fs.readFileSync('src/core/notificationDelivery.js','utf8');

(function(){
  // Presentation/action identity must come from HouseholdContext, never a second
  // Firebase auth/global owner.
  [
    ['NotificationActions',actionsSource,'3.0.0'],
    ['NotificationCenter',centerSource,'2.0.0'],
    ['NotificationDelivery',deliverySource,'2.0.0']
  ].forEach(([name,source,version])=>{
    assert.ok(source.includes(version),name+' version must be current');
    assert.ok(source.includes('HouseholdContext'),name+' must depend on HouseholdContext');
    assert.ok(!/firebase\.auth\s*\(/.test(source),name+' must not read Firebase auth directly');
    assert.ok(!/window\.fbUser/.test(source),name+' must not read legacy fbUser identity directly');
  });
  assert.ok(centerSource.includes('HouseholdContext.subscribe'), 'NotificationCenter must clear/re-render presentation on identity changes');
  assert.ok(deliverySource.includes('HouseholdContext.subscribe'), 'NotificationDelivery must bind live banner queue to identity changes');
  assert.ok(deliverySource.includes('clearLive()'), 'NotificationDelivery must clear queued/live notification presentation on identity changes');

  // Runtime check for action identity: same service instance follows context
  // changes and rejects an action after logout instead of consulting fbUser.
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const HouseholdContext={snapshot(){return Object.assign({},current);}};
  const marks=[];
  const window={
    HouseholdContext,
    NotificationStore:{markRead(id){marks.push({id,uid:current.uid});return Promise.resolve(true);},list(){return[];}},
    taskData:[]
  };
  const sandbox={window,HouseholdContext,console,Promise,Date,Math,JSON,Object,String,Number,Array};
  vm.createContext(sandbox);
  vm.runInContext(actionsSource,sandbox,{filename:'notificationActions.js'});
  sandbox.NotificationStore=window.NotificationStore;
  const actions=window.NotificationActions;
  assert.ok(actions);
  assert.strictEqual(actions.currentUid(),'userA');
  current={ready:true,uid:'userB',householdId:'houseA',revision:2};
  assert.strictEqual(actions.currentUid(),'userB','same-household account switch must immediately change action identity');
  current={ready:false,uid:null,householdId:null,revision:3};
  assert.strictEqual(actions.currentUid(),null,'logout must clear action identity');
  assert.rejects(()=>actions.run({id:'n1',type:'system.message'}),/Niet ingelogd/);

  console.log('STEP 10 notification presentation/action identity contract: PASS');
})();
