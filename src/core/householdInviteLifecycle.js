'use strict';
(function(){
  if(window.__householdInviteLifecycleV1) return;
  window.__householdInviteLifecycleV1=true;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function user(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function safe(v){return String(v||'').trim().toUpperCase();}

  function revokeInvite(code){
    var d=db(),u=user(),householdId=hid();code=safe(code);
    if(!d||!u||!householdId)return Promise.reject(new Error('Geen actief gezin'));
    if(!code)return Promise.reject(new Error('Geen uitnodigingscode opgegeven'));

    return Promise.all([
      d.ref('families/'+householdId+'/members/'+u.uid).once('value'),
      d.ref('invites/'+code).once('value')
    ]).then(function(results){
      var member=results[0].val(),invite=results[1].val();
      if(!member||member.status!=='active'||(member.role!=='owner'&&member.role!=='admin')) throw new Error('Alleen een beheerder kan uitnodigingen intrekken');
      if(!invite) throw new Error('Uitnodiging niet gevonden');
      if(invite.householdId!==householdId) throw new Error('Deze uitnodiging hoort niet bij dit gezin');
      if(invite.status==='revoked') return {code:code,status:'revoked',alreadyRevoked:true};
      if(invite.status!=='active') throw new Error('Alleen een actieve uitnodiging kan worden ingetrokken');

      var revoked={};
      Object.keys(invite).forEach(function(k){revoked[k]=invite[k];});
      revoked.status='revoked';
      revoked.revokedBy=u.uid;
      revoked.revokedAt=Date.now();

      return d.ref('invites/'+code).set(revoked).then(function(){
        return d.ref('families/'+householdId+'/inviteCodes/'+code).remove().catch(function(){});
      }).then(function(){
        try{window.dispatchEvent(new CustomEvent('familyapp:invite-revoked',{detail:{code:code,householdId:householdId,revokedBy:u.uid}}));}catch(e){}
        return {code:code,status:'revoked',householdId:householdId};
      });
    });
  }

  function install(){
    if(!window.FamilyHousehold)return false;
    window.FamilyHousehold.revokeInvite=revokeInvite;
    return true;
  }

  var tries=0,t=setInterval(function(){tries++;if(install()||tries>80)clearInterval(t);},100);
  setTimeout(install,0);
  window.HouseholdInviteLifecycle={version:'1.0.0',revokeInvite:revokeInvite,install:install};
})();
