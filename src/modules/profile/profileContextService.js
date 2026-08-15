'use strict';
// ============================================================
// PROFILE CONTEXT SERVICE v1.0.0
// Context-safe public household profile identity + presence facade.
// Firebase family members/presence remain authoritative through the
// HouseholdIdentityFirebaseBridge. localStorage is compatibility cache only.
// ============================================================
(function(){
  if(window.ProfileContextService&&window.ProfileContextService.version==='1.0.0')return;
  var VERSION='1.0.0',listeners=[];
  function hc(){return window.HouseholdContext||null;}function bridge(){return window.HouseholdIdentityFirebaseBridge||null;}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function capture(){var c=hc();if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function same(t){return!!(t&&hc()&&hc().isCurrent(t));}
  function assertToken(t){if(!same(t)){var e=new Error('PROFILE_CONTEXT_CHANGED');e.code='PROFILE_CONTEXT_CHANGED';throw e;}return t;}
  function members(){try{var b=bridge();return b&&typeof b.getMembers==='function'?(b.getMembers()||[]).map(clone):[];}catch(e){return[];}}
  function current(){var token;try{token=capture();}catch(e){return null;}var m=members().find(function(x){return String(x.uid||x.id)===String(token.uid);});return m?clone(m):null;}
  function presenceFor(member){member=member||{};var ts=Number(member.lastSeen||0),age=ts?Math.max(0,Date.now()-ts):Infinity,state=member.online===true?'online':age<=15*60*1000?'recent':age<=24*60*60*1000?'today':'offline';return{state:state,online:member.online===true,lastSeen:ts||null,area:member.area||''};}
  function mirrorOwnCache(member){if(!member)return;try{var uid=member.uid||member.id;if(!uid)return;if(member.displayName||member.name)localStorage.setItem('familyapp-profile-v2:'+uid+':name',member.displayName||member.name);if(member.avatar)localStorage.setItem('familyapp-profile-v2:'+uid+':avatar',member.avatar);}catch(e){}}
  function notify(){var detail={version:VERSION,current:current(),members:members()};listeners.slice().forEach(function(fn){try{fn(clone(detail));}catch(e){}});try{window.dispatchEvent(new CustomEvent('familyapp:profile-context-updated',{detail:detail}));}catch(e){}return detail;}
  function updateOwnProfile(patch){var token=capture(),b=bridge();if(!b||typeof b.updateOwnMemberProfile!=='function')return Promise.reject(new Error('PROFILE_STORE_UNAVAILABLE'));var clean={};if(patch&&typeof patch.name==='string'&&patch.name.trim())clean.name=patch.name.trim();if(patch&&typeof patch.avatar==='string'&&patch.avatar)clean.avatar=patch.avatar;if(!Object.keys(clean).length)return Promise.resolve(current());assertToken(token);return Promise.resolve(b.updateOwnMemberProfile(clean)).then(function(ok){assertToken(token);if(!ok)throw new Error('PROFILE_UPDATE_FAILED');var mine=current();mirrorOwnCache(mine||Object.assign({uid:token.uid},clean));notify();return mine||Object.assign({uid:token.uid},clean);});}
  function updateAvatar(url){return updateOwnProfile({avatar:String(url||'')});}
  function updateName(name){return updateOwnProfile({name:String(name||'')});}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);try{fn({version:VERSION,current:current(),members:members()});}catch(e){}return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  function refresh(){var b=bridge();try{if(b&&typeof b.sync==='function')b.sync();}catch(e){}return notify();}
  window.ProfileContextService={version:VERSION,capture:capture,isCurrent:same,getCurrentMember:current,getMembers:members,getPresence:function(uid){var m=members().find(function(x){return String(x.uid||x.id)===String(uid);});return presenceFor(m);},updateOwnProfile:updateOwnProfile,updateName:updateName,updateAvatar:updateAvatar,subscribe:subscribe,refresh:refresh,status:function(){var token=null;try{token=capture();}catch(e){}return{version:VERSION,context:token,current:current(),memberCount:members().length};}};
  window.addEventListener('familyapp:household-identity-synced',function(){var mine=current();mirrorOwnCache(mine);notify();});
  window.addEventListener('familyapp:household-context-changed',notify);window.addEventListener('familyapp:session:cleared',function(){notify();});
})();
