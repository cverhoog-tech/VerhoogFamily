'use strict';
// ============================================================
// ACHIEVEMENT UID BRIDGE v2.0.0 — STEP 9 compatibility adapter
//
// Achievement authority now belongs to ProgressionStore. This adapter owns no
// Firebase listener and never mutates XP/achievement state. It only keeps the
// existing achievement UI reactive while legacy screens are migrated.
// ============================================================
(function(){
  if(window.__achievementUidBridgeV2)return;
  window.__achievementUidBridgeV2=true;

  function store(){return window.ProgressionStore||null;}
  function renderIfOpen(){
    try{
      var screen=document.getElementById('screen-achievements');
      if(typeof window.renderAch==='function'&&screen&&screen.classList.contains('active'))window.renderAch();
    }catch(e){}
  }
  function start(){
    var s=store();
    try{if(s&&typeof s.start==='function')s.start();}catch(e){}
    renderIfOpen();
    return !!s;
  }

  window.addEventListener('familyapp:progression-updated',renderIfOpen);
  window.addEventListener('familyapp:household-context',start);

  window.AchievementUidBridge={
    version:'2.0.0',
    start:start,
    status:function(){
      var s=store(),status=null;
      try{status=s&&typeof s.status==='function'?s.status():null;}catch(e){}
      return{
        ready:!!(status&&status.attached),
        uid:status&&status.uid||null,
        householdId:status&&status.householdId||null,
        attached:!!(status&&status.attached),
        authority:s?'ProgressionStore':'legacy-projection'
      };
    }
  };
})();
