'use strict';
// ============================================================
// UTILS
// ============================================================

// One shared icon vocabulary for shell, Home cards and notification UI.
// SVGs inherit currentColor so each surface owns colour without duplicating icon art.
(function(){
  if(window.FamilyIcons) return;
  var paths={
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/><path d="M9 4.5c.7-1 1.7-1.5 3-1.5s2.3.5 3 1.5"/>',
    tasks:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    cart:'<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
    chat:'<path d="M5 18.5 3.5 21l4.2-1.2A9 9 0 1 0 5 18.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    recipes:'<path d="M7 4h10v16H7z"/><path d="M10 4v16M13.5 8.5c1.9-2.6 4.3-1.6 3.3.4-.7 1.4-2.1 2-3.3 2.4"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7 2.8v4.5M17 2.8v4.5M3.5 9.5h17"/><path d="m8.5 15 2.2 2.2 4.8-5"/>',
    meals:'<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 3 7 0 9"/>',
    moon:'<path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
    help:'<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-.9.6-1.5 1.1-1.5 2.4M12 17h.01"/>',
    party:'<path d="M12 3.5 18.5 6v5.3c0 4.3-2.8 7.1-6.5 8.5-3.7-1.4-6.5-4.2-6.5-8.5V6L12 3.5Z"/><path d="M8.5 13.5c.5-2 1.8-3 3.5-3s3 1 3.5 3M12 10.5V7"/>',
    undo:'<path d="M4 7v5h5"/><path d="M5 11a8 8 0 1 1 2.3 6"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>'
  };
  function svg(name,size,extraClass){
    var body=paths[name]||paths.help;
    return '<svg'+(extraClass?' class="'+extraClass+'"':'')+' viewBox="0 0 24 24" width="'+(size||20)+'" height="'+(size||20)+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+body+'</svg>';
  }
  window.FamilyIcons={svg:svg,has:function(name){return !!paths[name];}};
})();

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

// Deprecated compatibility facade. Legacy callers may still invoke addNotif(),
// but it must never create household/persistent notifications. Cross-device
// events are owned exclusively by NotificationEvents + domain projectors.
function addNotif(icon, bg, title, body) {
  try{console.warn('[addNotif] legacy call ignored:',title||'Melding',body||'');}catch(e){}
  return Promise.resolve(false);
}

function showToast(msg) {
  if(msg==='Taak kon niet worden opgeslagen'){
    var authUid=null;
    try{authUid=(window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){}
    if(!authUid) msg='Log in om gedeelde taken op te slaan';
  }
  var t=document.createElement('div');
  t.className='toast';t.textContent=msg;
  // Do not derive the toast background from --c-text: dark themes intentionally
  // make that token light, which previously produced white text on a white toast.
  // Keep the transient confirmation surface contrast-safe in every theme.
  t.style.zIndex='12050';
  t.style.background='rgba(28,28,30,.96)';
  t.style.color='#fff';
  t.style.border='1px solid rgba(255,255,255,.12)';
  t.style.boxShadow='0 10px 30px rgba(0,0,0,.28)';
  t.style.maxWidth='calc(100vw - 32px)';
  t.style.whiteSpace='normal';
  t.style.textAlign='center';
  t.style.lineHeight='1.35';
  t.style.bottom='calc(80px + env(safe-area-inset-bottom))';
  t.style.backdropFilter='blur(14px)';
  t.style.webkitBackdropFilter='blur(14px)';
  t.setAttribute('role','status');
  t.setAttribute('aria-live','polite');
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
  el=document.getElementById('stat-shop');if(el)el.textContent=(window.ShoppingListStore&&typeof window.ShoppingListStore.projection==='function')?window.ShoppingListStore.projection().openCount:0;
  el=document.getElementById('stat-feed');if(el)el.textContent=feedData.length;
}

function whoTag(who) {
  if(!who||!who.length) return '';
  if(who.length>1) return '<span class="tag tag-both">Beiden</span>';
  if(who[0]==='Shane') return '<span class="tag tag-shane">Shane</span>';
  return '<span class="tag tag-esra">Esra</span>';
}
