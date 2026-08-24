'use strict';
// ============================================================
// PUSH DELIVERY BRIDGE v1.0.0 — STEP 10
// Web transport adapter only. Canonical notification creation succeeds before
// this bridge runs. Sender/network failures are deliberately non-authoritative.
// ============================================================
(function(){
  if(window.PushDeliveryBridge)return;
  var VERSION='1.0.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function valid(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function currentFirebaseUser(){
    try{return window.firebase&&firebase.auth&&firebase.auth().currentUser||null;}catch(e){return null;}
  }
  function eventActor(event){return event&&event.actor&&event.actor.uid?String(event.actor.uid):null;}
  function wantsPush(event){return !Array.isArray(event&&event.channels)||event.channels.indexOf('push')>=0;}
  function emit(detail){try{window.dispatchEvent(new CustomEvent('familyapp:push-dispatch',{detail:detail}));}catch(e){} }

  function dispatchCreated(event){
    var c=context();
    if(!event||!event.id||!valid(c))return Promise.resolve({sent:false,reason:'context-or-event-unavailable'});
    if(!wantsPush(event))return Promise.resolve({sent:false,reason:'push-channel-disabled'});
    var actor=eventActor(event);
    if(!actor||actor!==String(c.uid))return Promise.resolve({sent:false,reason:'current-user-not-event-actor'});
    var user=currentFirebaseUser();
    if(!user||String(user.uid||'')!==String(c.uid)||typeof user.getIdToken!=='function')return Promise.resolve({sent:false,reason:'firebase-token-unavailable'});
    if(!window.fetch)return Promise.resolve({sent:false,reason:'fetch-unavailable'});

    var tokenIdentity=[String(c.uid),String(c.householdId),String(c.revision||0)].join('|');
    return Promise.resolve(user.getIdToken()).then(function(idToken){
      var latest=context();
      var latestIdentity=valid(latest)?[String(latest.uid),String(latest.householdId),String(latest.revision||0)].join('|'):'';
      if(latestIdentity!==tokenIdentity)throw new Error('PUSH_CONTEXT_CHANGED_BEFORE_DISPATCH');
      return window.fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(idToken)},
        body:JSON.stringify({householdId:String(c.householdId),notificationId:String(event.id)})
      });
    }).then(function(response){
      return Promise.resolve(response&&response.json?response.json():null).catch(function(){return null;}).then(function(body){
        if(!response||!response.ok){
          var error=new Error(body&&body.error||'PUSH_SEND_FAILED');
          error.status=response&&response.status||0;throw error;
        }
        var result={sent:true,delivery:body&&body.delivery||null,notificationId:String(event.id)};
        emit(Object.assign({status:'success'},result));return result;
      });
    }).catch(function(error){
      var result={sent:false,reason:String(error&&error.message||'PUSH_SEND_FAILED'),notificationId:String(event.id)};
      emit(Object.assign({status:'failed'},result));
      // Reject so NotificationStore can log delivery failure, while its already
      // committed canonical event remains untouched.
      throw error;
    });
  }

  window.PushDeliveryBridge={version:VERSION,dispatchCreated:dispatchCreated,status:function(){var c=context();return{version:VERSION,uid:c&&c.uid||null,householdId:c&&c.householdId||null,available:!!window.fetch};}};
})();
