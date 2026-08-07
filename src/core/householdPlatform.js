'use strict';
// ============================================================
// FAMILYAPP HOUSEHOLD PLATFORM v2.1
// Single source of truth for household create, join, resolve and presence.
// ============================================================
(function(){
  if(window.__familyHouseholdPlatformV21) return;
  window.__familyHouseholdPlatformV21=true;

  var VERSION=2, INVITE_TTL=7*24*60*60*1000, CLAIM_TTL=5*60*1000, presenceRef=null;
  function db(){try{return window.fbDb||(typeof fbDb!=='undefined'&&fbDb)||firebase.database();}catch(e){return null;}}
  function user(){try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(typeof fbAuth!=='undefined'&&fbAuth&&fbAuth.currentUser)||firebase.auth().currentUser;}catch(e){return null;}}
  function now(){return Date.now();}
  function safe(v){return String(v||'').trim();}
  function householdId(){var d=db();return d?d.ref('families').push().key:null;}
  function displayName(u){return safe((u&&u.displayName)||localStorage.getItem('familyapp-profile-name-v1')||(u&&u.email&&u.email.split('@')[0])||'Gezinslid');}
  function avatar(u){return (u&&u.photoURL)||localStorage.getItem('familyapp-current-user-avatar-v1')||'';}
  function setGlobals(hid,name){window.fbFamilyId=hid;window.myName=name;try{fbFamilyId=hid;}catch(e){}try{myName=name;}catch(e){}try{myInitials=name.substring(0,2).toUpperCase();}catch(e){}}
  function memberRecord(u,role){var t=now();return{uid:u.uid,name:displayName(u),email:u.email||'',avatar:avatar(u),role:role||'adult',status:'active',joinedAt:t,updatedAt:t};}
  function slugCode(){var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out='';if(window.crypto&&crypto.getRandomValues){var a=new Uint32Array(8);crypto.getRandomValues(a);for(var i=0;i<8;i++)out+=chars[a[i]%chars.length];}else for(var j=0;j<8;j++)out+=chars[Math.floor(Math.random()*chars.length)];return out.slice(0,4)+'-'+out.slice(4);}
  function readableError(err){var code=err&&err.code||'',msg=err&&err.message||'';if(code==='PERMISSION_DENIED'||code==='permission-denied'||/permission_denied/i.test(msg))return new Error('Firebase blokkeert deze stap. Controleer of de nieuwste database-regels succesvol zijn gedeployed.');return err instanceof Error?err:new Error(msg||'Er ging iets mis.');}

  function createHousehold(opts){
    opts=opts||{};var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));
    var hid=householdId();if(!hid)return Promise.reject(new Error('Kon geen gezins-ID maken'));
    var name=safe(opts.name)||displayName(u)+' Family',member=memberRecord(u,'owner'),t=now();
    var meta={id:hid,name:name,ownerUid:u.uid,version:VERSION,createdAt:t,updatedAt:t};

    // Step 1: create only household metadata. Rules explicitly permit an
    // authenticated user to create meta when ownerUid === auth.uid.
    return d.ref('families/'+hid+'/meta').set(meta).then(function(){
      // Step 2: now that meta exists, bootstrap the first owner membership.
      // The membership rule can safely verify meta.ownerUid === auth.uid.
      return d.ref('families/'+hid+'/members/'+u.uid).set(member);
    }).then(function(){
      // Step 3: only after an active membership exists, link the household to
      // the account. User validators can now verify that membership.
      var links={};
      links['users/'+u.uid+'/familyId']=hid;
      links['users/'+u.uid+'/activeHouseholdId']=hid;
      links['users/'+u.uid+'/name']=member.name;
      links['users/'+u.uid+'/households/'+hid]={role:'owner',status:'active',joinedAt:member.joinedAt};
      return d.ref().update(links);
    }).then(function(){
      setGlobals(hid,member.name);startPresence(hid);return{id:hid,name:name,role:'owner'};
    }).catch(function(err){
      // Do not delete anything automatically: partial bootstrap data is safer
      // to inspect/recover than a destructive cleanup during onboarding.
      throw readableError(err);
    });
  }

  function resolveHousehold(){
    var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));
    return d.ref('users/'+u.uid).once('value').then(function(s){
      var profile=s.val()||{},hid=profile.activeHouseholdId||profile.familyId;
      if(!hid){var e=new Error('HOUSEHOLD_REQUIRED');e.code='HOUSEHOLD_REQUIRED';throw e;}
      return d.ref('families/'+hid+'/members/'+u.uid).once('value').then(function(ms){
        var member=ms.val();if(!member||member.status!=='active'){var e2=new Error('HOUSEHOLD_REQUIRED');e2.code='HOUSEHOLD_REQUIRED';throw e2;}
        setGlobals(hid,member.name||profile.name||displayName(u));startPresence(hid);return{id:hid,user:profile,member:member};
      });
    });
  }

  function createInvite(role){
    var d=db(),u=user(),hid=window.fbFamilyId;if(!d||!u||!hid)return Promise.reject(new Error('Geen actief gezin'));role=role==='child'?'child':'adult';
    return d.ref('families/'+hid+'/members/'+u.uid).once('value').then(function(ms){
      var m=ms.val();if(!m||m.status!=='active'||(m.role!=='owner'&&m.role!=='admin'))throw new Error('Alleen een beheerder kan uitnodigen');
      var tries=0;function reserve(){if(++tries>5)throw new Error('Kon geen uitnodigingscode maken');var code=slugCode(),payload={code:code,householdId:hid,createdBy:u.uid,role:role,status:'active',createdAt:now(),expiresAt:now()+INVITE_TTL,maxUses:1,uses:0};return d.ref('invites/'+code).transaction(function(cur){return cur?undefined:payload;}).then(function(r){return r.committed?code:reserve();});}return reserve();
    }).catch(function(err){throw readableError(err);});
  }
  function inspectInvite(code){var d=db();code=safe(code).toUpperCase();if(!d||!code)return Promise.reject(new Error('Vul een uitnodigingscode in'));return d.ref('invites/'+code).once('value').then(function(s){var inv=s.val();if(!inv||inv.status!=='active'||inv.expiresAt<now()||(inv.uses||0)>=(inv.maxUses||1))throw new Error('Deze uitnodiging is ongeldig of verlopen');return{invite:inv,household:{id:inv.householdId,name:'FamilyApp gezin'}};});}
  function joinHousehold(code){
    var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));code=safe(code).toUpperCase();
    return inspectInvite(code).then(function(info){
      var inv=info.invite,hid=inv.householdId,member=memberRecord(u,inv.role||'adult');
      return d.ref('invites/'+code).transaction(function(cur){if(!cur||cur.status!=='active'||cur.expiresAt<now()||(cur.uses||0)>=(cur.maxUses||1))return;cur.uses=(cur.uses||0)+1;cur.usedBy=u.uid;cur.usedAt=now();if(cur.uses>=cur.maxUses)cur.status='used';return cur;}).then(function(r){if(!r.committed)throw new Error('Deze uitnodiging is al gebruikt');var claim={code:code,householdId:hid,uid:u.uid,role:inv.role||'adult',status:'approved',createdAt:now(),expiresAt:now()+CLAIM_TTL};return d.ref('joinClaims/'+hid+'/'+u.uid).set(claim);}).then(function(){return d.ref('families/'+hid+'/members/'+u.uid).set(member);}).then(function(){var links={};links['users/'+u.uid+'/familyId']=hid;links['users/'+u.uid+'/activeHouseholdId']=hid;links['users/'+u.uid+'/name']=member.name;links['users/'+u.uid+'/households/'+hid]={role:member.role,status:'active',joinedAt:member.joinedAt};return d.ref().update(links);}).then(function(){return d.ref('joinClaims/'+hid+'/'+u.uid).remove().catch(function(){});}).then(function(){setGlobals(hid,member.name);startPresence(hid);return info;});
    }).catch(function(err){throw readableError(err);});
  }

  function startPresence(hid){var d=db(),u=user();if(!d||!u||!hid)return;if(presenceRef)try{presenceRef.off();}catch(e){}presenceRef=d.ref('families/'+hid+'/presence/'+u.uid);d.ref('.info/connected').on('value',function(s){if(s.val()!==true)return;presenceRef.onDisconnect().set({online:false,lastSeen:firebase.database.ServerValue.TIMESTAMP,name:displayName(u)});presenceRef.set({online:true,lastSeen:firebase.database.ServerValue.TIMESTAMP,name:displayName(u),area:window._currentScreen||'home'});});}
  function setPresenceArea(area){if(presenceRef)presenceRef.update({online:true,lastSeen:firebase.database.ServerValue.TIMESTAMP,area:safe(area)||'app'});}

  function css(){if(document.getElementById('household-platform-css'))return;var s=document.createElement('style');s.id='household-platform-css';s.textContent='.hh-overlay{position:fixed;inset:0;z-index:10050;background:linear-gradient(160deg,#080b17 0%,#111126 52%,#190d2d 100%);color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}.hh-card{width:min(440px,100%);background:rgba(20,21,39,.94);border:1px solid rgba(150,103,255,.28);border-radius:28px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.42),0 0 50px rgba(124,58,237,.12)}.hh-mark{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:28px;background:linear-gradient(145deg,#7c3aed,#a855f7);margin-bottom:20px}.hh-card h2{font-size:27px;margin:0 0 8px}.hh-card p{color:#aaa9bd;line-height:1.5;margin:0 0 22px}.hh-choice,.hh-primary{box-sizing:border-box;width:100%;border-radius:18px;color:#fff;padding:17px;margin:8px 0}.hh-choice{background:#17182a;border:1px solid rgba(255,255,255,.09);text-align:left}.hh-choice b,.hh-choice span{display:block}.hh-choice span{color:#9897aa;font-size:12px;margin-top:4px}.hh-input{box-sizing:border-box;width:100%;height:52px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:#10111e;color:#fff;padding:0 15px;font-size:16px}.hh-primary{border:0;background:linear-gradient(135deg,#7c3aed,#a855f7);font-weight:800}.hh-primary:disabled{opacity:.55}.hh-back{background:none;border:0;color:#aaa9bd;margin-top:12px;width:100%;padding:12px}.hh-error{color:#fb7185;font-size:13px;min-height:18px;margin-top:8px}.hh-code{font-size:26px;letter-spacing:.12em;font-weight:900;text-align:center;padding:16px;background:#0e0f1b;border-radius:16px;margin:12px 0}.hh-copy{font-size:12px;color:#a78bfa;text-align:center}';document.head.appendChild(s);}
  function overlay(html){css();var old=document.getElementById('household-onboarding');if(old)old.remove();var el=document.createElement('div');el.id='household-onboarding';el.className='hh-overlay';el.innerHTML='<div class="hh-card">'+html+'</div>';document.body.appendChild(el);return el;}
  function closeOverlay(){var el=document.getElementById('household-onboarding');if(el)el.remove();}
  function showChooser(){var name=displayName(user()),el=overlay('<div class="hh-mark">🏰</div><h2>Welkom, '+name+'</h2><p>Maak een nieuw gezin of sluit veilig aan bij een bestaand gezin.</p><button class="hh-choice" data-hh="create"><b>✨ Nieuw gezin maken</b><span>Word beheerder en nodig gezinsleden uit</span></button><button class="hh-choice" data-hh="join"><b>🔗 Deelnemen aan gezin</b><span>Gebruik een persoonlijke uitnodigingscode</span></button>');el.querySelector('[data-hh="create"]').onclick=showCreate;el.querySelector('[data-hh="join"]').onclick=showJoin;}
  function showCreate(){var def=displayName(user())+' Family',el=overlay('<div class="hh-mark">✨</div><h2>Maak jullie gezin</h2><p>Dit wordt de gedeelde ruimte voor taken, winkelen, agenda, feed en voortgang.</p><input class="hh-input" id="hh-name" maxlength="50" value="'+def.replace(/"/g,'&quot;')+'"><div class="hh-error" id="hh-err"></div><button class="hh-primary" id="hh-create">Gezin aanmaken</button><button class="hh-back" id="hh-back">Terug</button>');el.querySelector('#hh-back').onclick=showChooser;el.querySelector('#hh-create').onclick=function(){var b=this,err=el.querySelector('#hh-err');err.textContent='';b.disabled=true;b.textContent='Gezin maken…';createHousehold({name:el.querySelector('#hh-name').value}).then(function(){closeOverlay();if(typeof onLoggedIn==='function')onLoggedIn();setTimeout(showInviteManager,350);}).catch(function(e){b.disabled=false;b.textContent='Gezin aanmaken';err.textContent=(e&&e.message)||'Aanmaken mislukt';});};}
  function showJoin(){var el=overlay('<div class="hh-mark">🔗</div><h2>Deelnemen aan gezin</h2><p>Vul de persoonlijke uitnodigingscode in.</p><input class="hh-input" id="hh-code" maxlength="9" placeholder="ABCD-EFGH" style="text-transform:uppercase;text-align:center"><div class="hh-error" id="hh-err"></div><button class="hh-primary" id="hh-join">Deelnemen</button><button class="hh-back" id="hh-back">Terug</button>');el.querySelector('#hh-back').onclick=showChooser;el.querySelector('#hh-join').onclick=function(){var b=this,err=el.querySelector('#hh-err');err.textContent='';b.disabled=true;joinHousehold(el.querySelector('#hh-code').value).then(function(){closeOverlay();if(typeof onLoggedIn==='function')onLoggedIn();}).catch(function(e){b.disabled=false;err.textContent=(e&&e.message)||'Deelnemen mislukt';});};}
  function showInviteManager(){var hid=window.fbFamilyId;if(!hid)return;var el=overlay('<div class="hh-mark">🤝</div><h2>Nodig iemand uit</h2><p>Maak een eenmalige code. De uitnodiging verloopt na 7 dagen.</p><button class="hh-primary" id="hh-invite">Maak uitnodigingscode</button><div id="hh-result"></div><button class="hh-back" id="hh-close">Nu niet</button>');el.querySelector('#hh-close').onclick=closeOverlay;el.querySelector('#hh-invite').onclick=function(){var b=this;b.disabled=true;createInvite('adult').then(function(code){b.style.display='none';el.querySelector('#hh-result').innerHTML='<div class="hh-code">'+code+'</div><div class="hh-copy">Deel deze code persoonlijk met je gezinslid</div>';}).catch(function(e){b.disabled=false;el.querySelector('#hh-result').innerHTML='<div class="hh-error">'+((e&&e.message)||'Kon geen code maken')+'</div>';});};}

  function installOverrides(){
    if(typeof window.loadUserFamily==='function'&&!window.loadUserFamily.__householdV21){var load=function(){return resolveHousehold();};load.__householdV21=true;window.loadUserFamily=load;try{loadUserFamily=load;}catch(e){}}
    if(typeof window.setupNewFamily==='function'&&!window.setupNewFamily.__householdV21){var create=function(name){return createHousehold({name:safe(name)||displayName(user())+' Family'});};create.__householdV21=true;window.setupNewFamily=create;try{setupNewFamily=create;}catch(e){}}
    if(typeof window.showNameSetupStep==='function'&&!window.showNameSetupStep.__householdV21){var setup=function(){showChooser();};setup.__householdV21=true;window.showNameSetupStep=setup;try{showNameSetupStep=setup;}catch(e){}}
    if(typeof window.showScreen==='function'&&!window.showScreen.__householdPresenceV21){var orig=window.showScreen,wrapped=function(name){var r=orig.apply(this,arguments);setPresenceArea(name);return r;};wrapped.__householdPresenceV21=true;window.showScreen=wrapped;try{showScreen=wrapped;}catch(e){}}
  }
  function boot(){var tries=0,t=setInterval(function(){tries++;installOverrides();if(tries>80)clearInterval(t);},100);setTimeout(installOverrides,0);}
  window.FamilyHousehold={version:VERSION,create:createHousehold,resolve:resolveHousehold,createInvite:createInvite,inspectInvite:inspectInvite,join:joinHousehold,showChooser:showChooser,showInviteManager:showInviteManager,startPresence:startPresence};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
