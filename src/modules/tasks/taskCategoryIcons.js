'use strict';
// ============================================================
// TASK CATEGORY ICONS v5
// Canonical premium fantasy/RPG task family for Overview + popup.
// Compact rows use simplified artwork; detail/picker keep rich artwork.
// Theme-safe via FamilyApp icon tokens. Visual-only: no task data changes.
// ============================================================
(function(){
  if(window.TaskCategoryIcons)return;

  var ICON_KEYS={
    quest:'taskQuest',laundry:'taskLaundry',cleaning:'taskCleaning',kitchen:'taskKitchen',
    groceries:'taskGroceries',pantry:'taskPantry',admin:'taskAdmin',family:'taskFamily',
    garden:'taskGarden',travel:'taskTravel',dropoff:'taskDropoff',pickup:'taskPickup'
  };
  var KNOWN={quest:1,laundry:1,cleaning:1,kitchen:1,groceries:1,pantry:1,admin:1,family:1,garden:1,travel:1,dropoff:1,pickup:1};
  var EXTRA_CATEGORIES=[['travel','Reizen'],['dropoff','Wegbrengen'],['pickup','Ophalen']];

  function infer(raw){
    raw=String(raw||'').toLowerCase();
    if(/ophalen|haal op|afhalen|pickup|pick up|pick-up/.test(raw))return'pickup';
    if(/wegbrengen|brengen|afzetten|dropoff|drop off|drop-off/.test(raw))return'dropoff';
    if(/reizen|reis|travel|trip|vakantie|vliegveld|airport|vlucht/.test(raw))return'travel';
    if(/was|laundry|kleding/.test(raw))return'laundry';
    if(/stof|schoon|clean|dweil|badkamer|toilet/.test(raw))return'cleaning';
    if(/vaat|keuken|kitchen|koken/.test(raw))return'kitchen';
    if(/voorraad|pantry|voorraadkast|kast aanvullen|voorraad aanvullen|organiseren|snack|snacks|snoep|chips|lekkers|lekkere dingen/.test(raw))return'pantry';
    if(/bood|supermarkt|grocer/.test(raw))return'groceries';
    if(/admin|contract|rekening|factuur|bank/.test(raw))return'admin';
    if(/kind|speel|family|gezin/.test(raw))return'family';
    if(/tuin|garden|plant/.test(raw))return'garden';
    return'quest';
  }

  function detect(task){
    task=task||{};
    var explicit=String(task.category||task.type||'').toLowerCase();
    if(explicit&&explicit!=='quest'&&KNOWN[explicit])return explicit;
    var byTitle=infer(task.title||'');
    if(byTitle!=='quest')return byTitle;
    if(explicit&&KNOWN[explicit])return explicit;
    return'quest';
  }

  function icon(cat,size,variant){
    cat=KNOWN[cat]?cat:'quest';
    var key=ICON_KEYS[cat]||ICON_KEYS.quest;
    var html=window.FamilyAppIconRenderer&&typeof FamilyAppIconRenderer.render==='function'
      ? FamilyAppIconRenderer.render(key,{size:size||'sm',variant:variant||'default',label:false,className:'fa-task-category-icon'})
      : '';
    return html||'<span class="fa-task-fallback" aria-hidden="true"></span>';
  }

  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function compactCat(node){
    var row=node.closest('[data-task-id]');
    if(row){var t=taskById(row.getAttribute('data-task-id'));if(t)return detect(t);}
    var cls=String(node.className||'');
    var m=cls.match(/tch-icon--(laundry|cleaning|kitchen|groceries|pantry|admin|family|garden|travel|dropoff|pickup|quest)/);
    return m?m[1]:'quest';
  }
  function patchCompact(){
    document.querySelectorAll('.tch-icon').forEach(function(node){
      var cat=compactCat(node),old=node.querySelector('[data-rpg-cat]');
      if(old&&old.getAttribute('data-rpg-cat')===cat&&old.getAttribute('data-rpg-variant')==='compact')return;
      node.setAttribute('data-task-icon-family','fantasy');
      node.innerHTML='<span data-rpg-cat="'+cat+'" data-rpg-variant="compact" class="fa-task-icon-wrap fa-task-icon-wrap--compact">'+icon(cat,'sm','compact')+'</span>';
    });
  }

  var activeDetailCat=null;
  var activeCreateCat=null;
  function selectedCreateCat(){var x=document.querySelector('[data-cat-pick].active');return(x&&x.getAttribute('data-cat-pick'))||activeCreateCat;}
  function createTitleCat(){var x=document.getElementById('tdp-create-title');return x?infer(x.value):'quest';}

  function ensureExtraCategoryButtons(){
    var pick=document.querySelector('.tdp-member-pick');
    if(!pick||!pick.querySelector('[data-cat-pick]'))return;
    EXTRA_CATEGORIES.forEach(function(pair){
      var cat=pair[0],label=pair[1];
      if(pick.querySelector('[data-cat-pick="'+cat+'"]'))return;
      var proxy=pick.querySelector('[data-cat-pick="quest"]')||pick.querySelector('[data-cat-pick]');
      if(!proxy||typeof proxy.onclick!=='function')return;
      var btn=document.createElement('button');
      btn.className='tdp-member-chip';
      btn.setAttribute('data-cat-pick',cat);
      btn.textContent=label;
      btn.onclick=function(){var old=proxy.getAttribute('data-cat-pick');proxy.setAttribute('data-cat-pick',cat);proxy.onclick();proxy.setAttribute('data-cat-pick',old);};
      pick.appendChild(btn);
    });
  }

  function patchPopup(){
    var inner=document.querySelector('.tdp-icon-inner');
    if(!inner)return;
    ensureExtraCategoryButtons();
    var selected=selectedCreateCat();
    var cat=selected||(createTitleCat()!=='quest'?createTitleCat():(activeDetailCat||'quest'));
    var old=inner.querySelector('[data-rpg-cat]');
    if(!old||old.getAttribute('data-rpg-cat')!==cat||old.getAttribute('data-rpg-variant')!=='rich'){
      inner.innerHTML='<span data-rpg-cat="'+cat+'" data-rpg-variant="rich" class="fa-task-icon-wrap fa-task-icon-wrap--large">'+icon(cat,'lg','default')+'</span>';
    }
    document.querySelectorAll('[data-cat-pick]').forEach(function(btn){
      var c=btn.getAttribute('data-cat-pick')||'quest';
      var wrap=btn.querySelector('.tdp-cat-glyph');
      if(!wrap){wrap=document.createElement('span');wrap.className='tdp-cat-glyph fa-task-picker-icon';btn.insertBefore(wrap,btn.firstChild);}
      if(wrap.getAttribute('data-rpg-cat')!==c){wrap.setAttribute('data-rpg-cat',c);wrap.innerHTML=icon(c,'xs','compact');}
    });
  }

  function hookPopup(){
    if(!window.TaskDetailPopup||window.TaskDetailPopup.__categoryIconsHooked)return false;
    var api=window.TaskDetailPopup,rawOpen=api.open,rawCreate=api.openCreate;
    if(typeof rawOpen==='function')api.open=function(id){activeCreateCat=null;activeDetailCat=detect(taskById(id));var r=rawOpen.apply(this,arguments);setTimeout(patchPopup,0);return r;};
    if(typeof rawCreate==='function')api.openCreate=function(){activeDetailCat='quest';activeCreateCat=null;var r=rawCreate.apply(this,arguments);setTimeout(patchPopup,0);return r;};
    api.__categoryIconsHooked=true;return true;
  }

  function ensureStatusIconModule(){
    if(window.TaskStatusIcons||document.querySelector('script[data-familyapp-task-status-icons]'))return;
    var s=document.createElement('script');
    s.src='src/modules/tasks/taskStatusIcons.js?v=1';
    s.async=false;
    s.setAttribute('data-familyapp-task-status-icons','1');
    s.onload=function(){try{if(window.TaskStatusIcons&&typeof TaskStatusIcons.patch==='function')TaskStatusIcons.patch(document);}catch(e){}};
    document.head.appendChild(s);
  }

  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-cat-pick]');if(!b)return;var cat=b.getAttribute('data-cat-pick');if(cat&&KNOWN[cat]){activeCreateCat=cat;setTimeout(patchPopup,0);}},true);
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='tdp-create-title')patchPopup();});
  var observer=new MutationObserver(function(){patchCompact();if(document.querySelector('.tdp-overlay'))patchPopup();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hookPopup();patchCompact();ensureStatusIconModule();
  var tries=0,timer=setInterval(function(){tries++;if(hookPopup()||tries>40)clearInterval(timer);},100);

  window.TaskCategoryIcons={iconKeys:ICON_KEYS,detect:detect,infer:infer,icon:icon,patchCompact:patchCompact,patchPopup:patchPopup};
  window.dispatchEvent(new CustomEvent('familyapp:task-icons-ready'));
})();
