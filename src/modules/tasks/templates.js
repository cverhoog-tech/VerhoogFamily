'use strict';
function templateTr(key,fallback,params){try{if(window.FamilyI18n&&typeof window.FamilyI18n.t==='function'){var value=window.FamilyI18n.t(key,params||{});if(value&&value!==key)return value;}}catch(error){}return fallback;}
var TEMPLATE_NAME_KEYS={'Grote schoonmaak':'templates.seed.deepClean','Weeklijst boodschappen':'templates.seed.weekGroceries','Administratie':'templates.seed.admin'};
var TEMPLATE_TASK_KEYS={'Stofzuigen':'templates.seed.vacuum','Dweilen':'templates.seed.mop','Ramen zemen':'templates.seed.windows','Badkamer schoon':'templates.seed.bathroom','Keuken reinigen':'templates.seed.kitchen','Stofafnemen':'templates.seed.dust','Melk':'templates.seed.milk','Brood':'templates.seed.bread','Eieren':'templates.seed.eggs','Groente':'templates.seed.vegetables','Fruit':'templates.seed.fruit','Vlees':'templates.seed.meat','Post verwerken':'templates.seed.mail','Rekeningen betalen':'templates.seed.bills','Belasting bijwerken':'templates.seed.tax'};
function templateName(value){return templateTr(TEMPLATE_NAME_KEYS[value]||'',value);}
function templateTask(value){return templateTr(TEMPLATE_TASK_KEYS[value]||'',value);}
// ============================================================
// TAAK TEMPLATES
// ============================================================
var taskTemplates=[
  {id:1,name:'Grote schoonmaak',icon:'🧹',tasks:['Stofzuigen','Dweilen','Ramen zemen','Badkamer schoon','Keuken reinigen','Stofafnemen']},
  {id:2,name:'Weeklijst boodschappen',icon:'🛒',tasks:['Melk','Brood','Eieren','Groente','Fruit','Vlees']},
  {id:3,name:'Administratie',icon:'📂',tasks:['Post verwerken','Rekeningen betalen','Belasting bijwerken']},
];
var templateNextId=4;
function renderTemplates(){
  var el=document.getElementById('templates-content');if(!el)return;
  var html='<div style="padding:14px 16px 8px;display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:18px;font-weight:800;color:var(--c-text)">'+templateTr('templates.title','📋 Taak Templates')+'</div>'
    +'<button onclick="openNewTemplate()" style="background:var(--c-primary);color:#fff;border:none;border-radius:20px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer">'+templateTr('templates.new','+ Nieuw')+'</button>'
    +'</div>'
    +'<div style="padding:0 16px 8px;font-size:12px;color:var(--c-text2)">'+templateTr('templates.hint','Activeer een template om taken in één keer toe te voegen.')+'</div>';
  taskTemplates.forEach(function(tmpl){
    html+='<div style="background:var(--c-surface);border-radius:14px;margin:0 16px 10px;padding:14px;box-shadow:0 1px 4px var(--c-card-shadow)">'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      +'<div style="font-size:26px">'+tmpl.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:15px;font-weight:700;color:var(--c-text)">'+templateName(tmpl.name)+'</div>'
      +'<div style="font-size:12px;color:var(--c-text2)">'+templateTr('templates.taskCount',tmpl.tasks.length+' taken',{count:tmpl.tasks.length})+'</div></div>'
      +'<button onclick="deleteTemplate('+tmpl.id+')" style="background:none;border:none;color:var(--c-text3);font-size:14px;cursor:pointer">🗑</button>'
      +'</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">'
      +tmpl.tasks.slice(0,5).map(function(t){return '<span style="background:var(--c-surface2);border-radius:6px;padding:2px 8px;font-size:11px;color:var(--c-text2)">'+templateTask(t)+'</span>';}).join('')
      +(tmpl.tasks.length>5?'<span style="font-size:11px;color:var(--c-text3)">+'+( tmpl.tasks.length-5)+' '+templateTr('templates.more','+'+(tmpl.tasks.length-5)+' meer',{count:tmpl.tasks.length-5}).replace(/^\+\d+\s*/, '')+'</span>':'')
      +'</div>'
      +'<button onclick="activateTemplate('+tmpl.id+')" style="width:100%;background:var(--c-primary);color:#fff;border:none;border-radius:10px;padding:9px;font-size:13px;font-weight:700;cursor:pointer">'+templateTr('templates.activate','▶ Template activeren')+'</button>'
      +'</div>';
  });
  el.innerHTML=html;
}
function activateTemplate(id){
  var tmpl=taskTemplates.find(function(t){return t.id===id;});if(!tmpl)return;
  tmpl.tasks.forEach(function(title){taskData.unshift({id:taskNextId++,title:templateTask(title),who:[myName],date:todayStr(),prio:'normal',done:false,cat:'Overig'});});
  awardXP(5,'Template');showToast('✅ '+templateTr('templates.taskCount',tmpl.tasks.length+' taken',{count:tmpl.tasks.length})+' toegevoegd!');showScreen('tasks');
}
function deleteTemplate(id){if(!confirm(templateTr('templates.confirmDelete','Template verwijderen?')))return;taskTemplates=taskTemplates.filter(function(t){return t.id!==id;});renderTemplates();}
function openNewTemplate(){
  currentAddType='new_template';
  document.getElementById('sheet-title').textContent=templateTr('templates.newTitle','📋 Nieuw template');
  document.getElementById('sheet-fields').innerHTML=
    '<div class="field"><label>'+templateTr('templates.name','Naam')+'</label><input id="tmpl-name" placeholder="'+templateTr('templates.namePlaceholder','bijv. Grote schoonmaak')+'"></div>'
    +'<div class="field"><label>'+templateTr('templates.icon','Icoon')+'</label><div style="display:flex;gap:8px;flex-wrap:wrap">'
    +['🧹','🛒','📂','🏠','🍳','🌿','💪','🎯','📋','⚡'].map(function(ic){
      return '<button type="button" data-ticon="'+ic+'" style="font-size:22px;padding:6px;border-radius:8px;border:2px solid var(--c-border);background:var(--c-surface);cursor:pointer">'+ic+'</button>';
    }).join('')+'</div></div>'
    +'<div class="field"><label>'+templateTr('templates.tasksLabel','Taken (één per regel)')+'</label><textarea id="tmpl-tasks" rows="5" placeholder="'+templateTr('templates.tasksPlaceholder','Stofzuigen\nDweilen\nRamen zemen').replace(/\n/g,'&#10;')+'"></textarea></div>';
  document.getElementById('add-overlay').classList.add('open');
  setTimeout(function(){
    document.querySelectorAll('[data-ticon]').forEach(function(btn){
      btn.onclick=function(){document.querySelectorAll('[data-ticon]').forEach(function(b){b.style.borderColor='var(--c-border)';});btn.style.borderColor='var(--c-primary)';};
    });
  },100);
}
function saveNewTemplate(){
  var name=(document.getElementById('tmpl-name')||{}).value||'';
  var tasks=((document.getElementById('tmpl-tasks')||{}).value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean);
  var iconBtn=document.querySelector('[data-ticon][style*="var(--c-primary)"]');
  var icon=iconBtn?iconBtn.dataset.ticon:'📋';
  if(!name||!tasks.length){showToast(templateTr('templates.required','Vul naam en taken in'));return;}
  taskTemplates.push({id:templateNextId++,name:name,icon:icon,tasks:tasks});
  closeAdd();renderTemplates();showToast(templateTr('templates.created','Template aangemaakt ✓'));
}


window.addEventListener('familyapp:language-changed',function(){try{renderTemplates();}catch(error){}});
