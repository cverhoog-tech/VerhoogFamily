'use strict';
// ============================================================
// TASK CATEGORY ICONS v1
// Shared premium fantasy/RPG glyph language for Compact + task card.
// Visual-only: no task data, Firebase, UID or completion behavior changes.
// ============================================================
(function(){
  if(window.TaskCategoryIcons)return;

  var PATHS={
    quest:'<path d="M7 4l5 5m5-5-5 5M5 3l4 1 1 4-6 6-2-2 6-6M19 3l-4 1-1 4 6 6 2-2-6-6"/><path d="M8.5 15.5 5 19m10.5-3.5L19 19M4 20l2-2m14 2-2-2"/>',
    laundry:'<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><circle cx="12" cy="13" r="4.5"/><path d="M7.5 7h1m2.5 0h1M9.2 13c.9-1.4 2-2.1 3.3-2.1 1 0 1.8.3 2.5 1"/><path d="M12 1.8v1.7m-2.8-.7.8 1.1m4.8-1.1-.8 1.1"/>',
    cleaning:'<path d="M9 4l6 16M6.5 17.5l9.5-4 2 4.5-9.8 2.5Z"/><path d="M5 5.5h4M7 3.5v4"/><path d="M17.5 4.5v3m-1.5-1.5h3M19.5 9.5v2m-1-1h2"/>',
    kitchen:'<path d="M7 3v7m-3-7v5a3 3 0 0 0 6 0V3M7 10v11"/><path d="M17 3v18M17 3c2.5 1.7 3 5.8 0 9"/><path d="M4.5 19.5 19.5 4.5" opacity=".45"/>',
    groceries:'<path d="M5 9h14l-1.5 9H6.5Z"/><path d="M8 9a4 4 0 0 1 8 0"/><path d="M9 13h6m-3-2v5"/><path d="M4 7.5 7 5m13 2.5L17 5" opacity=".6"/>',
    admin:'<path d="M7 4.5h10a2 2 0 0 1 2 2v12H8a3 3 0 0 1-3-3v-9a2 2 0 0 1 2-2Z"/><path d="M8 8h7M8 11.5h6M8 15h4"/><path d="M17 4.5c-1 1.3-1 2.7 0 4"/><path d="M5 15.5c0 1.7 1.3 3 3 3"/>',
    family:'<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M12 17.5s-4-2.2-4-5a2.2 2.2 0 0 1 4-1.3 2.2 2.2 0 0 1 4 1.3c0 2.8-4 5-4 5Z"/>',
    garden:'<path d="M12 21V10"/><path d="M12 13c-5 0-7-3-7-7 5 0 7 3 7 7Z"/><path d="M12 16c5 0 7-3 7-7-5 0-7 3-7 7Z"/><path d="M8.5 19h7M10 21h4"/>',
    travel:'<circle cx="12" cy="12" r="8.5"/><path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2Z"/><path d="M12 1.8v2.1M12 20.1v2.1M1.8 12h2.1M20.1 12h2.1"/>',
    dropoff:'<path d="M4 14.5h13.5l2 2.5H4Z"/><path d="M6 14.5 8 9h6l3.5 5.5"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/><path d="M17 5h5m-2.2-2.2L22 5l-2.2 2.2"/><path d="M5 7.5h4" opacity=".5"/>',
    pickup:'<path d="M4 14.5h13.5l2 2.5H4Z"/><path d="M6 14.5 8 9h6l3.5 5.5"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/><path d="M22 5h-5m2.2-2.2L17 5l2.2 2.2"/><path d="M5 7.5h4" opacity=".5"/>'
  };

  var ACCENTS={laundry:'#0284c7',cleaning:'#7c3aed',kitchen:'#0d9488',groceries:'#059669',admin:'#6366f1',family:'#db2777',garden:'#65a30d',travel:'#2563eb',dropoff:'#c2410c',pickup:'#0891b2',quest:'#7c3aed'};
  var KNOWN={quest:1,laundry:1,cleaning:1,kitchen:1,groceries:1,admin:1,family:1,garden:1,travel:1,dropoff:1,pickup:1};

  function infer(raw){
    raw=String(raw||'').toLowerCase();
    if(/ophalen|haal op|afhalen|pickup|pick up|pick-up/.test(raw))return'pickup';
    if(/wegbrengen|brengen|afzetten|dropoff|drop off|drop-off/.test(raw))return'dropoff';
    if(/reizen|reis|travel|trip|vakantie|vliegveld|airport|vlucht/.test(raw))return'travel';
    if(/was|laundry|kleding/.test(raw))return'laundry';
    if(/stof|schoon|clean|dweil|badkamer|toilet/.test(raw))return'cleaning';
    if(/vaat|keuken|kitchen|koken/.test(raw))return'kitchen';
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

  function svg(cat,size,strokeWidth){
    cat=PATHS[cat]?cat:'quest';
    size=size||24;
    return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="'+(strokeWidth||1.7)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+PATHS[cat]+'</svg>';
  }

  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function compactCat(node){
    var row=node.closest('[data-task-id]');
    if(row){var t=taskById(row.getAttribute('data-task-id'));if(t)return detect(t);}
    var cls=String(node.className||'');
    var m=cls.match(/tch-icon--(laundry|cleaning|kitchen|groceries|admin|family|garden|travel|dropoff|pickup|quest)/);
    return m?m[1]:'quest';
  }
  function patchCompact(){
    document.querySelectorAll('.tch-icon').forEach(function(node){
      var cat=compactCat(node),old=node.querySelector('svg');
      if(old&&old.getAttribute('data-rpg-cat')===cat)return;
      node.innerHTML=svg(cat,14,1.65).replace('<svg ','<svg data-rpg-cat="'+cat+'" ');
    });
  }

  var activeDetailCat=null;
  function selectedCreateCat(){var x=document.querySelector('[data-cat-pick].active');return x&&x.getAttribute('data-cat-pick');}
  function createTitleCat(){var x=document.getElementById('tdp-create-title');return x?infer(x.value):'quest';}
  function patchPopup(){
    var inner=document.querySelector('.tdp-icon-inner');
    if(!inner)return;
    var selected=selectedCreateCat();
    var cat=(selected&&selected!=='quest')?selected:(createTitleCat()!=='quest'?createTitleCat():(activeDetailCat||selected||'quest'));
    var old=inner.querySelector('svg');
    if(!old||old.getAttribute('data-rpg-cat')!==cat){
      inner.innerHTML=svg(cat,20,1.65).replace('<svg ','<svg data-rpg-cat="'+cat+'" ');
    }
    document.querySelectorAll('[data-cat-pick]').forEach(function(btn){
      var c=btn.getAttribute('data-cat-pick')||'quest';
      if(!btn.querySelector('.tdp-cat-glyph')){
        var wrap=document.createElement('span');wrap.className='tdp-cat-glyph';wrap.innerHTML=svg(c,14,1.7);wrap.style.cssText='display:inline-grid;place-items:center;margin-right:5px;vertical-align:-2px;color:'+(ACCENTS[c]||ACCENTS.quest);
        btn.insertBefore(wrap,btn.firstChild);
      }
    });
  }

  function hookPopup(){
    if(!window.TaskDetailPopup||window.TaskDetailPopup.__categoryIconsHooked)return false;
    var api=window.TaskDetailPopup,rawOpen=api.open,rawCreate=api.openCreate;
    if(typeof rawOpen==='function')api.open=function(id){activeDetailCat=detect(taskById(id));var r=rawOpen.apply(this,arguments);setTimeout(patchPopup,0);return r;};
    if(typeof rawCreate==='function')api.openCreate=function(){activeDetailCat='quest';var r=rawCreate.apply(this,arguments);setTimeout(patchPopup,0);return r;};
    api.__categoryIconsHooked=true;
    return true;
  }

  document.addEventListener('input',function(e){if(e.target&&e.target.id==='tdp-create-title')patchPopup();});
  var observer=new MutationObserver(function(){patchCompact();if(document.querySelector('.tdp-overlay'))patchPopup();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hookPopup();
  patchCompact();
  var tries=0,timer=setInterval(function(){tries++;if(hookPopup()||tries>40)clearInterval(timer);},100);

  window.TaskCategoryIcons={paths:PATHS,accents:ACCENTS,detect:detect,infer:infer,svg:svg,patchCompact:patchCompact,patchPopup:patchPopup};
  window.dispatchEvent(new CustomEvent('familyapp:task-icons-ready'));
})();
