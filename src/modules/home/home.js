'use strict';
// ============================================================
// HOME
// ============================================================

function renderHome() {
  updateHomeXP();
  var h = new Date().getHours();
  var greet;
  if(h<12) greet='Goedemorgen';
  else if(h<17) greet='Goedemiddag';
  else greet='Goedenavond';
  var el=document.getElementById('home-greeting');
  if(el) el.textContent=greet+', '+myName;
  var days=['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  var months=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var now=new Date();
  var sub=document.getElementById('home-sub');
  if(sub) sub.textContent=days[now.getDay()]+' · '+now.getDate()+' '+months[now.getMonth()];
  renderHomeBg(currentTheme);
  updateStats();
  renderActivityList();
}

function renderActivityList() {
  var el=document.getElementById('activity-list');if(!el)return;
  el.innerHTML=activityData.slice(0,10).map(function(a){
    return '<div class="activity-item">'
      +'<div class="activity-icon" style="background:'+a.bg+'">'+a.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:13px;color:#333">'+a.text+'</div>'
      +'<div style="font-size:11px;color:#aaa">'+a.time+'</div></div>'
      +'</div>';
  }).join('');
}

