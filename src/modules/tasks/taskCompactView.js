'use strict';
// ============================================================
// TASK COMPACT VIEW v1
// Second renderer for the same shared taskData. View preference is local-only.
// ============================================================
(function(){
  if(window.__taskCompactViewV1)return;
  window.__taskCompactViewV1=true;
  var KEY='familyapp_task_view_mode_v1';
  var installed=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function mode(){try{return localStorage.getItem(KEY)==='compact'?'compact':'cards';}catch(e){return'cards';}}
  function setMode(next){try{localStorage.setItem(KEY,next==='compact'?'compact':'cards');}catch(e){}renderCurrent();}
  function membersByUid(){var out={};try{var list=window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members():[];(list||[]).forEach(function(m){var id=m.uid||m.id;if(id)out[id]=m;});}catch(e){}return out;}
  function assignees(task){
    var map=membersByUid(),out=[];
    if(task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])out.push(map[id]||{uid:id,name:'Gezinslid'});});
    if(!out.length&&Array.isArray(task.who))task.who.forEach(function(name){out.push({name:name});});
    return out;
  }
  function initials(member){var name=member.displayName||member.name||'G';return member.initials||name.split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase();}
  function dateLabel(value){if(!value)return'';var d=new Date(value+'T00:00:00');if(isNaN(d.getTime()))return value;var today=new Date();today.setHours(0,0,0,0);var diff=Math.round((d-today)/86400000);if(diff===0)return'Vandaag';if(diff===1)return'Morgen';if(diff===-1)return'Gisteren';return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}
  function injectStyles(){if(document.getElementById('task-compact-view-style'))return;var s=document.createElement('style');s.id='task-compact-view-style';s.textContent='.task-view-switch{display:flex;justify-content:flex-end;gap:4px;padding:8px 14px}.task-view-btn{border:1px solid #e5e7eb;background:#fff;color:#667085;border-radius:10px;padding:7px 10px;font-size:12px;font-weight:850}.task-view-btn.active{background:#111827;color:#fff;border-color:#111827}.task-compact-wrap{padding:2px 12px 100px}.task-compact-summary{display:flex;justify-content:space-between;align-items:end;padding:8px 2px 12px}.task-compact-title{font-size:20px;font-weight:950;color:#111827}.task-compact-count{font-size:12px;font-weight:750;color:#667085}.task-compact-list{background:#fff;border:1px solid #edf0ec;border-radius:18px;overflow:hidden}.task-compact-row{display:flex;align-items:center;gap:10px;min-height:54px;padding:9px 11px;border-bottom:1px solid #f0f2f4}.task-compact-row:last-child{border-bottom:0}.task-compact-check{width:24px;height:24px;border-radius:50%;border:2px solid #cfd5dc;background:transparent;display:flex;align-items:center;justify-content:center;flex:0 0 auto}.task-compact-check.done{background:#3f7f2f;border-color:#3f7f2f;color:#fff}.task-compact-main{flex:1;min-width:0}.task-compact-name{font-size:14px;font-weight:850;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.task-compact-row.is-done .task-compact-name{text-decoration:line-through;color:#98a2b3}.task-compact-meta{display:flex;gap:7px;margin-top:2px;font-size:10.5px;font-weight:700;color:#98a2b3}.task-compact-people{display:flex;flex:0 0 auto}.task-compact-avatar{width:25px;height:25px;border-radius:50%;margin-left:-5px;border:2px solid #fff;background:#6d28d9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900}.task-compact-avatar:first-child{margin-left:0}.task-compact-empty{text-align:center;padding:30px 16px;color:#98a2b3}.task-compact-add{position:sticky;bottom:14px;width:calc(100% - 24px);margin:14px 12px;border:0;border-radius:999px;padding:13px;background:#3f7f2f;color:#fff;font-size:14px;font-weight:900}';document.head.appendChild(s);}
  function switchHtml(){var m=mode();return'<div class="task-view-switch"><button class="task-view-btn '+(m==='cards'?'active':'')+'" onclick="TaskCompactView.setMode(\'cards\')">Kaarten</button><button class="task-view-btn '+(m==='compact'?'active':'')+'" onclick="TaskCompactView.setMode(\'compact\')">Compact</button></div>';}
  function renderCompact(el){
    injectStyles();var tasks=(window.taskData||[]).slice().sort(function(a,b){if(!!a.done!==!!b.done)return a.done?1:-1;return String(a.date||'9999').localeCompare(String(b.date||'9999'));});
    var open=tasks.filter(function(t){return!t.done;}).length;
    var h=switchHtml()+'<div class="task-compact-wrap"><div class="task-compact-summary"><div class="task-compact-title">Taken</div><div class="task-compact-count">'+open+' open · '+tasks.length+' totaal</div></div>';
    if(!tasks.length)h+='<div class="task-compact-list"><div class="task-compact-empty">Nog geen taken.</div></div>';
    else{h+='<div class="task-compact-list">';tasks.forEach(function(t){var people=assignees(t),id=JSON.stringify(t.id);h+='<div class="task-compact-row'+(t.done?' is-done':'')+'"><button class="task-compact-check'+(t.done?' done':'')+'" onclick="toggleTask('+esc(id)+')">'+(t.done?'✓':'')+'</button><div class="task-compact-main"><div class="task-compact-name">'+esc(t.title||'Taak')+'</div><div class="task-compact-meta">'+(t.date?'<span>'+esc(dateLabel(t.date))+'</span>':'')+(t.prio?'<span>'+esc(t.prio==='high'?'Hoge prioriteit':t.prio==='low'?'Lage prioriteit':'Normaal')+'</span>':'')+'</div></div><div class="task-compact-people">'+people.slice(0,3).map(function(p){return'<span class="task-compact-avatar" title="'+esc(p.displayName||p.name||'Gezinslid')+'">'+esc(initials(p))+'</span>';}).join('')+'</div></div>';});h+='</div>';}
    h+='<button class="task-compact-add" onclick="openAdd(\'task\')">+ Taak toevoegen</button></div>';el.innerHTML=h;
  }
  function renderCurrent(){if(typeof window.renderTasks==='function')window.renderTasks();}
  function install(){
    if(typeof window.renderTasks!=='function')return false;
    if(window.renderTasks.__taskCompactViewV1)return true;
    var original=window.renderTasks;
    window.renderTasks=function(){
      if(window.taskTab==='overzicht'&&mode()==='compact'){
        var el=document.getElementById('task-content');if(el){renderCompact(el);return;}
      }
      var result=original.apply(this,arguments);
      if(window.taskTab==='overzicht'&&mode()==='cards')setTimeout(function(){var el=document.getElementById('task-content');if(el&&!el.querySelector('.task-view-switch'))el.insertAdjacentHTML('afterbegin',switchHtml());},0);
      return result;
    };
    window.renderTasks.__taskCompactViewV1=true;installed=true;return true;
  }
  function ensure(){if(install())return;var tries=0,t=setInterval(function(){tries++;if(install()||tries>100)clearInterval(t);},100);}
  window.TaskCompactView={mode:mode,setMode:setMode,render:renderCompact};
  window.addEventListener('familyapp:tasks-updated',function(){if(window.taskTab==='overzicht'&&mode()==='compact')renderCurrent();});
  setTimeout(ensure,0);
})();
