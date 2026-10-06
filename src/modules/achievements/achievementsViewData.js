'use strict';
// Read-only achievement projections. Never use global/demo/cache scores.
(function(){
  var ref=null,handler=null,key=null,generation=0,records={},loaded=false;
  function context(){return window.HouseholdContext&&window.HouseholdContext.snapshot();}
  function scope(c){return c&&c.ready&&c.uid&&c.householdId?c.householdId+':'+c.uid:null;}
  function repaint(){var el=document.getElementById('screen-achievements');if(el&&el.classList.contains('active')&&typeof window.renderAch==='function')window.renderAch();}
  function reset(){generation++;if(ref&&handler)ref.off('value',handler);ref=null;handler=null;records={};loaded=false;key=null;}
  function bind(){
    var c=context(),next=scope(c);
    if(next===key&&ref)return;
    reset();key=next;
    if(!next){repaint();return;}
    var db=window.fbDb;if(!db){repaint();return;}
    var token=generation;
    ref=db.ref('families/'+c.householdId+'/members');
    handler=function(snap){
      if(token!==generation||scope(context())!==next)return;
      records=snap.val()||{};loaded=true;repaint();
    };
    ref.on('value',handler,function(){
      if(token!==generation||scope(context())!==next)return;
      records={};loaded=false;repaint();
    });
    repaint();
  }
  function number(v){var n=Number(v);return isFinite(n)?Math.max(0,n):0;}
  function get(){
    var c=context(),s=window.ProgressionStore,status=s&&s.status(),empty={ready:false,xp:0,badges:{},doneTasks:0,players:[]};
    if(!scope(c)||!status||!status.attached||status.uid!==c.uid||status.householdId!==c.householdId)return empty;
    var own=s.get(),badges={};
    Object.keys(own.achievements||{}).forEach(function(id){var a=own.achievements[id];if(a&&a.unlocked!==false)badges[id]=true;});
    var players=[];
    if(loaded&&key===scope(c))Object.keys(records).forEach(function(uid){
      var m=records[uid];if(!m||m.status==='removed'||m.status==='inactive')return;
      var name=String(m.displayName||m.name||'Gezinslid');
      // Canonical zero must win over any old member XP. Unmigrated records
      // use only this household's actual member value, never a demo default.
      var xp=uid===c.uid?own.xp:(m.progression?m.progression.xp:m.xp);
      players.push({uid:uid,name:name,initials:name.slice(0,2).toUpperCase(),color:/^#[0-9a-f]{3,8}$/i.test(m.color||'')?m.color:'#2d5a27',xp:number(xp)});
    });
    var tasks=Array.isArray(window.taskData)?window.taskData:[];
    return {ready:true,xp:number(own.xp),badges:badges,doneTasks:tasks.filter(function(t){return t&&(t.done===true||t.status==='completed')&&t.completedByUid===c.uid;}).length,players:players.sort(function(a,b){return b.xp-a.xp;})};
  }
  window.AchievementsViewData={get:get};
  window.addEventListener('familyapp:household-context',bind);
  window.addEventListener('familyapp:progression-updated',repaint);
  window.addEventListener('familyapp:tasks-updated',repaint);
  window.addEventListener('familyapp:session-state',function(e){if(!e.detail||!e.detail.ready){reset();repaint();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
