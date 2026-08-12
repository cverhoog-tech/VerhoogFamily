'use strict';
// ============================================================
// UTILS
// ============================================================

function getWk() {
  var d = new Date();
  var thu = new Date(d);
  thu.setDate(d.getDate()-((d.getDay()+6)%7)+3);
  var jan = new Date(thu.getFullYear(),0,1);
  return thu.getFullYear()+'-W'+Math.ceil(((thu-jan)/86400000+1)/7);
}
function getMk() {
  var d=new Date();
  return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1);
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function todayName() {
  var days=['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
  return days[new Date().getDay()];
}
function weekOfMonth() { return Math.ceil(new Date().getDate()/7); }
function formatDate(s) {
  if(!s) return '';
  var d=new Date(s+'T00:00:00');
  var t=new Date().toISOString().split('T')[0];
  if(s===t) return 'Vandaag';
  var y=new Date(); y.setDate(y.getDate()+1);
  if(s===y.toISOString().split('T')[0]) return 'Morgen';
  return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
}

function addActivity(icon, bg, text) {
  activityData.unshift({id:actNextId++,icon:icon,bg:bg,text:text,time:'Zojuist'});
  if(activityData.length>20) activityData.length=20;
  var el=document.getElementById('activity-list');
  if(el) renderActivityList();
}

function addNotif(icon, bg, title, body) {
  notifData.unshift({id:notifNextId++,icon:icon,bg:bg,title:title,body:body,time:'Zojuist',read:false});
  var dot=document.getElementById('notif-dot');
  if(dot) dot.style.display='block';
}

function showToast(msg) {
  var t=document.createElement('div');
  t.className='toast';t.textContent=msg;
  // Toasts are feedback, so they must remain visible above task/detail overlays
  // and other modal layers. The task overlay currently lives at z-index 9500.
  t.style.zIndex='12050';
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},2000);
}

function spawnParticles(el) {
  if(!el) return;
  var rect=el.getBoundingClientRect();
  var emojis=['✨','⭐','💚','✅'];
  for(var i=0;i<4;i++){
    (function(j){
      var p=document.createElement('div');
      p.className='float-particle';
      p.textContent=emojis[j%emojis.length];
      p.style.left=(rect.left+rect.width/2+(Math.random()-.5)*30)+'px';
      p.style.top=(rect.top+rect.height/2)+'px';
      p.style.fontSize=(10+Math.random()*8)+'px';
      p.style.animationDelay=(j*.08)+'s';
      document.body.appendChild(p);
      setTimeout(function(){p.remove();},900);
    })(i);
  }
  var r=document.createElement('div');
  r.className='ripple';
  r.style.left=(rect.left+rect.width/2)+'px';
  r.style.top=(rect.top+rect.height/2)+'px';
  document.body.appendChild(r);
  setTimeout(function(){r.remove();},500);
}

function updateStats() {
  var el;
  el=document.getElementById('stat-tasks');if(el)el.textContent=taskData.filter(function(t){return !t.done;}).length;
  el=document.getElementById('stat-shop');if(el)el.textContent=shopData.filter(function(i){return !i.done;}).length;
  el=document.getElementById('stat-feed');if(el)el.textContent=feedData.length;
}

function whoTag(who) {
  if(!who||!who.length) return '';
  if(who.length>1) return '<span class="tag tag-both">Beiden</span>';
  if(who[0]==='Shane') return '<span class="tag tag-shane">Shane</span>';
  return '<span class="tag tag-esra">Esra</span>';
}

