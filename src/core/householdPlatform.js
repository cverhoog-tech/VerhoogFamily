'use strict';
// ============================================================
// FAMILYAPP HOUSEHOLD PLATFORM v1.1
// Shared household identity, memberships, secure invites and presence.
// ============================================================
(function(){
  if(window.__familyHouseholdPlatform) return;
  window.__familyHouseholdPlatform=true;

  var VERSION=1, INVITE_TTL=7*24*60*60*1000, CLAIM_TTL=5*60*1000, presenceRef=null;
  function db(){ try{return fbDb||firebase.database();}catch(e){return null;} }
  function user(){ try{return fbUser||(fbAuth&&fbAuth.currentUser)||firebase.auth().currentUser;}catch(e){return null;} }
  function now(){return Date.now();}
  function safe(s){return String(s||'').trim();}
  function slugCode(){var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out='';if(window.crypto&&crypto.getRandomValues){var a=new Uint32Array(8);crypto.getRandomValues(a);for(var i=0;i<8;i++)out+=chars[a[i]%chars.length];}else for(var j=0;j<8;j++)out+=chars[Math.floor(Math.random()*chars.length)];return out.slice(0,4)+'-'+out.slice(4);}
  function householdId(){var d=db();return d?d.ref('families').push().key:null;}
  function displayName(u){return safe((u&&u.displayName)||localStorage.getItem('familyapp-profile-name-v1')||(u&&u.email&&u.email.split('@')[0])||'Gezinslid');}
  function avatar(u){return (u&&u.photoURL)||localStorage.getItem('familyapp-current-user-avatar-v1')||'';}
  function setGlobals(hid,name){try{fbFamilyId=hid;}catch(e){}window.fbFamilyId=hid;try{myName=name;}catch(e){}window.myName=name;try{myInitials=name.substring(0,2).toUpperCase();}catch(e){}}
  function memberRecord(u,role){return {uid:u.uid,name:displayName(u),email:u.email||'',avatar:avatar(u),role:role||'adult',status:'active',joinedAt:now(),updatedAt:now()};}

  function createHousehold(opts){
    opts=opts||{};var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));
    var hid=householdId(),name=safe(opts.name)||displayName(u)+' Family',member=memberRecord(u,'owner'),updates={};
    updates['families/'+hid+'/meta']={id:hid,name:name,ownerUid:u.uid,version:VERSION,createdAt:now(),updatedAt:now()};
    updates['families/'+hid+'/members/'+u.uid]=member;
    updates['users/'+u.uid]={familyId:hid,activeHouseholdId:hid,name:member.name,households:{}};
    updates['users/'+u.uid+'/households/'+hid]={role:'owner',status:'active',joinedAt:member.joinedAt};
    return d.ref().update(updates).then(function(){setGlobals(hid,member.name);startPresence(hid);return{id:hid,name:name,role:'owner'};});
  }

  function ensureLegacyMembership(hid,userData){
    var d=db(),u=user();if(!d||!u||!hid)return Promise.resolve(null);
    return d.ref('families/'+hid+'/meta').once('value').then(function(metaSnap){
      var meta=metaSnap.val(),name=(userData&&userData.name)||displayName(u),updates={};
      if(!meta)updates['families/'+hid+'/meta']={id:hid,name:((userData&&userData.partner)?name+' & '+userData.partner:name+' Family'),ownerUid:u.uid,version:VERSION,createdAt:now(),updatedAt:now(),migratedFromLegacy:true};
      return d.ref('families/'+hid+'/members/'+u.uid).once('value').then(function(ms){
        if(!ms.exists())updates['families/'+hid+'/members/'+u.uid]=memberRecord(u,(!meta||meta.ownerUid===u.uid)?'owner':'adult');
        updates['users/'+u.uid+'/activeHouseholdId']=hid;updates['users/'+u.uid+'/households/'+hid]={role:(!meta||meta.ownerUid===u.uid)?'owner':'adult',status:'active',joinedAt:now()};return d.ref().update(updates);
      });
    });
  }

  function resolveHousehold(){var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));return d.ref('users/'+u.uid).once('value').then(function(s){var data=s.val()||{},hid=data.activeHouseholdId||data.familyId;if(!hid)throw new Error('HOUSEHOLD_REQUIRED');return ensureLegacyMembership(hid,data).then(function(){setGlobals(hid,data.name||displayName(u));startPresence(hid);return{id:hid,user:data};});});}

  function createInvite(role){
    var d=db(),u=user(),hid=window.fbFamilyId||null;if(!d||!u||!hid)return Promise.reject(new Error('Geen actief gezin'));role=role==='child'?'child':'adult';
    return d.ref('families/'+hid+'/members/'+u.uid).once('value').then(function(ms){var m=ms.val();if(!m||m.status!=='active'||(m.role!=='owner'&&m.role!=='admin'))throw new Error('Alleen een beheerder kan uitnodigen');var attempt=0;function reserve(){if(++attempt>5)throw new Error('Kon geen uitnodigingscode maken');var code=slugCode(),createdAt=now(),expiresAt=createdAt+INVITE_TTL;return d.ref('invites/'+code).transaction(function(cur){if(cur)return;return{code:code,householdId:hid,createdBy:u.uid,role:role,status:'active',createdAt:createdAt,expiresAt:expiresAt,maxUses:1,uses:0};}).then(function(r){if(!r.committed)return reserve();
      // Mirror a lightweight, per-household index so the invite manager can list active codes
      // without querying the top-level invites node (which is intentionally unreadable as a list).
      return d.ref('families/'+hid+'/inviteCodes/'+code).set({code:code,createdAt:createdAt,expiresAt:expiresAt}).catch(function(){}).then(function(){return code;});
    });}return reserve();});
  }

  function listActiveInvites(hid){
    var d=db();if(!d||!hid)return Promise.resolve([]);
    return d.ref('families/'+hid+'/inviteCodes').once('value').then(function(snap){
      var codes=[];snap.forEach(function(c){codes.push(c.key);});
      return Promise.all(codes.map(function(code){return d.ref('invites/'+code).once('value').then(function(s){return s.val();}).catch(function(){return null;});}));
    }).then(function(vals){
      return vals.filter(function(v){return v&&v.status==='active'&&Number(v.expiresAt||0)>now()&&Number(v.uses||0)<Number(v.maxUses||1);})
        .sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);});
    });
  }

  function inspectInvite(code){var d=db();code=safe(code).toUpperCase();if(!d||!code)return Promise.reject(new Error('Vul een uitnodigingscode in'));return d.ref('invites/'+code).once('value').then(function(s){var inv=s.val();if(!inv||inv.status!=='active'||inv.expiresAt<now()||(inv.uses||0)>=(inv.maxUses||1))throw new Error('Deze uitnodiging is ongeldig of verlopen');return {invite:inv,household:{id:inv.householdId,name:'FamilyApp gezin'}};});}

  // Finishes joining a household: writes the join claim, the member record and the user's
  // household pointers. Uses only .set()/.update() so it is safe to re-run — a retry after a
  // partial failure repeats the same writes instead of creating duplicate or inconsistent state.
  function completeMembership(hid,role,code){
    var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));
    var member=memberRecord(u,role||'adult');
    var claim={code:code,householdId:hid,uid:u.uid,role:member.role,status:'approved',createdAt:now(),expiresAt:now()+CLAIM_TTL};
    return d.ref('joinClaims/'+hid+'/'+u.uid).set(claim).then(function(){
      return d.ref('families/'+hid+'/members/'+u.uid).set(member);
    }).then(function(){
      var updates={};updates['users/'+u.uid+'/familyId']=hid;updates['users/'+u.uid+'/activeHouseholdId']=hid;updates['users/'+u.uid+'/name']=member.name;updates['users/'+u.uid+'/households/'+hid]={role:member.role,status:'active',joinedAt:member.joinedAt};return d.ref().update(updates);
    }).then(function(){return d.ref('joinClaims/'+hid+'/'+u.uid).remove().catch(function(){});}).then(function(){
      setGlobals(hid,member.name);startPresence(hid);
      return {invite:{householdId:hid,role:member.role},household:{id:hid,name:'FamilyApp gezin'}};
    });
  }

  function joinHousehold(code){
    var d=db(),u=user();if(!d||!u)return Promise.reject(new Error('Niet ingelogd'));code=safe(code).toUpperCase();
    return d.ref('invites/'+code).once('value').then(function(snap){
      var existing=snap.val();
      // Idempotent resume: this exact account already consumed this code in an earlier, interrupted
      // attempt (e.g. the tab was closed mid-join). Finish the membership instead of failing with
      // "already used" — the code is not re-consumed and no second use is spent.
      if(existing&&existing.status==='used'&&existing.usedBy===u.uid){
        return completeMembership(existing.householdId,existing.role||'adult',code);
      }
      return inspectInvite(code).then(function(info){
        var inv=info.invite,hid=inv.householdId,role=inv.role||'adult';
        return d.ref('invites/'+code).transaction(function(cur){
          if(!cur||cur.status!=='active'||cur.expiresAt<now()||(cur.uses||0)>=(cur.maxUses||1))return;
          cur.uses=(cur.uses||0)+1;if(cur.uses>=cur.maxUses)cur.status='used';cur.usedBy=u.uid;cur.usedAt=now();return cur;
        }).then(function(r){
          if(!r.committed)throw new Error('Deze uitnodiging is al gebruikt');
          return completeMembership(hid,role,code).catch(function(err){
            // The code is now marked used, but the join itself did not finish. Revert the code back
            // to active so it is not permanently burned by a partial failure; the person can retry
            // with the same code (or the join will resume idempotently via the branch above).
            return d.ref('invites/'+code).transaction(function(cur){
              if(!cur||cur.usedBy!==u.uid)return;
              cur.uses=Math.max(0,(cur.uses||1)-1);cur.status='active';cur.usedBy=null;cur.usedAt=null;return cur;
            }).catch(function(){}).then(function(){throw err;});
          });
        });
      });
    });
  }

  function startPresence(hid){var d=db(),u=user();if(!d||!u||!hid)return;if(presenceRef)try{presenceRef.off();}catch(e){}presenceRef=d.ref('families/'+hid+'/presence/'+u.uid);var connected=d.ref('.info/connected');connected.on('value',function(s){if(s.val()!==true)return;presenceRef.onDisconnect().set({online:false,lastSeen:firebase.database.ServerValue.TIMESTAMP,name:displayName(u)});presenceRef.set({online:true,lastSeen:firebase.database.ServerValue.TIMESTAMP,name:displayName(u),area:window.currentScreen||'home'});});}
  function setPresenceArea(area){if(presenceRef)presenceRef.update({online:true,lastSeen:firebase.database.ServerValue.TIMESTAMP,area:safe(area)||'app'});}

  function css(){if(document.getElementById('household-platform-css'))return;var s=document.createElement('style');s.id='household-platform-css';s.textContent='.hh-overlay{position:fixed;inset:0;z-index:10050;background:linear-gradient(160deg,#080b17 0%,#111126 52%,#190d2d 100%);color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}.hh-card{width:min(440px,100%);background:rgba(20,21,39,.92);border:1px solid rgba(150,103,255,.28);border-radius:28px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.42),0 0 50px rgba(124,58,237,.12)}.hh-mark{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:28px;background:linear-gradient(145deg,#7c3aed,#a855f7);margin-bottom:20px}.hh-card h2{font-size:27px;margin:0 0 8px}.hh-card p{color:#aaa9bd;line-height:1.5;margin:0 0 22px}.hh-choice,.hh-primary{width:100%;border-radius:18px;color:#fff;padding:17px;margin:8px 0}.hh-choice{background:#17182a;border:1px solid rgba(255,255,255,.09);text-align:left}.hh-choice b,.hh-choice span{display:block}.hh-choice span{color:#9897aa;font-size:12px;margin-top:4px}.hh-input{box-sizing:border-box;width:100%;height:52px;border-radius:15px;border:1px solid rgba(255,255,255,.12);background:#10111e;color:#fff;padding:0 15px;font-size:16px}.hh-primary{border:0;background:linear-gradient(135deg,#7c3aed,#a855f7);font-weight:800}.hh-back{background:none;border:0;color:#aaa9bd;margin-top:12px;width:100%}.hh-error{color:#fb7185;font-size:13px;min-height:18px}.hh-code{font-size:26px;letter-spacing:.12em;font-weight:900;text-align:center;padding:16px;background:#0e0f1b;border-radius:16px;margin:12px 0}.hh-copy{font-size:12px;color:#a78bfa;text-align:center}.hh-invite-list{display:grid;gap:10px;margin:14px 0}.hh-invite-item{padding:14px;border-radius:15px;background:#0e0f1b;border:1px solid rgba(255,255,255,.08)}.hh-invite-code{font-size:22px;letter-spacing:.1em;font-weight:900}.hh-invite-meta{font-size:11px;color:#aaa9bd;margin-top:5px}.hh-invite-note{font-size:12px;color:#a78bfa;text-align:center;margin:10px 0 4px}';document.head.appendChild(s);}
  function overlay(html){css();var old=document.getElementById('household-onboarding');if(old)old.remove();var el=document.createElement('div');el.id='household-onboarding';el.className='hh-overlay';el.innerHTML='<div class="hh-card">'+html+'</div>';document.body.appendChild(el);return el;}
  function closeOverlay(){var el=document.getElementById('household-onboarding');if(el)el.remove();}
  function showChooser(){var name=displayName(user()),el=overlay('<div class="hh-mark">🏰</div><h2>Welkom, '+name+'</h2><p>Maak een nieuw huishouden of sluit veilig aan bij een bestaand gezin.</p><button class="hh-choice" data-hh="create"><b>✨ Nieuw gezin maken</b><span>Word beheerder en nodig gezinsleden uit</span></button><button class="hh-choice" data-hh="join"><b>🔗 Deelnemen aan gezin</b><span>Gebruik een persoonlijke uitnodigingscode</span></button>');el.querySelector('[data-hh="create"]').onclick=showCreate;el.querySelector('[data-hh="join"]').onclick=showJoin;}
  function showCreate(){var def=displayName(user())+' Family',el=overlay('<div class="hh-mark">✨</div><h2>Maak jullie gezin</h2><p>Dit wordt de gedeelde ruimte voor taken, boodschappen, agenda, feed en voortgang.</p><input class="hh-input" id="hh-name" maxlength="50" value="'+def.replace(/"/g,'&quot;')+'"><div class="hh-error" id="hh-err"></div><button class="hh-primary" id="hh-create">Gezin aanmaken</button><button class="hh-back" id="hh-back">Terug</button>');el.querySelector('#hh-back').onclick=showChooser;el.querySelector('#hh-create').onclick=function(){var b=this;b.disabled=true;createHousehold({name:el.querySelector('#hh-name').value}).then(function(){closeOverlay();if(typeof onLoggedIn==='function')onLoggedIn();setTimeout(showInviteManager,350);}).catch(function(e){b.disabled=false;el.querySelector('#hh-err').textContent=e.message;});};}
  function showJoin(){var el=overlay('<div class="hh-mark">🔗</div><h2>Deelnemen aan gezin</h2><p>Vul de persoonlijke uitnodigingscode in.</p><input class="hh-input" id="hh-code" maxlength="9" placeholder="ABCD-EFGH" style="text-transform:uppercase;text-align:center"><div class="hh-error" id="hh-err"></div><button class="hh-primary" id="hh-join">Deelnemen</button><button class="hh-back" id="hh-back">Terug</button>');el.querySelector('#hh-back').onclick=showChooser;el.querySelector('#hh-join').onclick=function(){var b=this;b.disabled=true;joinHousehold(el.querySelector('#hh-code').value).then(function(){closeOverlay();if(typeof onLoggedIn==='function')onLoggedIn();}).catch(function(e){b.disabled=false;el.querySelector('#hh-err').textContent=e.message;});};}
  function fmtDate(ts){try{return new Date(Number(ts)).toLocaleDateString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return'';}}
  function renderInviteRows(el,hid){
    var list=el.querySelector('#hh-invite-list');if(!list)return;
    listActiveInvites(hid).then(function(rows){
      list.innerHTML=rows.length?rows.map(function(v){return '<div class="hh-invite-item"><div class="hh-invite-code">'+v.code+'</div><div class="hh-invite-meta">actief · geldig tot '+fmtDate(v.expiresAt)+'</div></div>';}).join(''):'<div class="hh-invite-meta">Nog geen actieve uitnodigingscodes.</div>';
    }).catch(function(){list.innerHTML='';});
  }
  function showInviteManager(){
    var hid=window.fbFamilyId;if(!hid)return;
    var el=overlay('<div class="hh-mark">🤝</div><h2>Nodig iemand uit</h2><p>Maak voor ieder gezinslid een eigen code. Elke code is 7 dagen geldig en kan één keer gebruikt worden.</p><button class="hh-primary" id="hh-invite">Nieuwe uitnodigingscode maken</button><div class="hh-error" id="hh-invite-err"></div><div class="hh-invite-list" id="hh-invite-list"></div><div class="hh-invite-note">Je kunt meerdere uitnodigingen tegelijk actief hebben.</div><button class="hh-back" id="hh-close">Sluiten</button>');
    el.querySelector('#hh-close').onclick=closeOverlay;
    var btn=el.querySelector('#hh-invite'),err=el.querySelector('#hh-invite-err');
    btn.onclick=function(){
      btn.disabled=true;err.textContent='';
      createInvite('adult').then(function(){btn.disabled=false;renderInviteRows(el,hid);}).catch(function(e){btn.disabled=false;err.textContent=e&&e.message||'Kon geen uitnodiging maken';});
    };
    renderInviteRows(el,hid);
  }

  function installOverrides(){if(typeof window.loadUserFamily==='function'&&!window.loadUserFamily.__householdV1){var fn=function(){return resolveHousehold();};fn.__householdV1=true;window.loadUserFamily=fn;try{loadUserFamily=fn;}catch(e){}}if(typeof window.setupNewFamily==='function'&&!window.setupNewFamily.__householdV1){var create=function(name){return createHousehold({name:(safe(name)||displayName(user()))+' Family'});};create.__householdV1=true;window.setupNewFamily=create;try{setupNewFamily=create;}catch(e){}}if(typeof window.showNameSetupStep==='function'&&!window.showNameSetupStep.__householdV1){var setup=function(){showChooser();};setup.__householdV1=true;window.showNameSetupStep=setup;try{showNameSetupStep=setup;}catch(e){}}if(typeof window.showScreen==='function'&&!window.showScreen.__householdPresence){var orig=window.showScreen,wrapped=function(name){var r=orig.apply(this,arguments);setPresenceArea(name);return r;};wrapped.__householdPresence=true;window.showScreen=wrapped;try{showScreen=wrapped;}catch(e){}}}
  function boot(){var tries=0,t=setInterval(function(){tries++;installOverrides();if(tries>60)clearInterval(t);},150);setTimeout(installOverrides,0);}
  window.FamilyHousehold={create:createHousehold,resolve:resolveHousehold,createInvite:createInvite,inspectInvite:inspectInvite,join:joinHousehold,showOnboarding:showChooser,showInviteManager:showInviteManager,setPresenceArea:setPresenceArea,startPresence:startPresence};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
