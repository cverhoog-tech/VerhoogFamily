'use strict';
// ============================================================
// TASK HERO TEMPLATES v1
// Visual-only template layer for Task Detail/Create popup heroes.
// Keeps task/Firebase logic untouched; real image assets can replace
// individual templates later without changing popup behavior.
// ============================================================
(function(){
  if(window.__taskHeroTemplatesV1)return;
  window.__taskHeroTemplatesV1=true;

  var activeTaskId=null;
  var activeCreate=true;
  var TEMPLATES={
    quest:{key:'quest',label:'Avontuur',style:'radial-gradient(120% 140% at 78% -10%,rgba(172,120,255,.55),transparent 58%),linear-gradient(135deg,#3b2368 0%,#171126 72%)'},
    laundry:{key:'laundry',label:'Wasgoed',style:'radial-gradient(110% 130% at 82% 0%,rgba(93,187,255,.55),transparent 58%),linear-gradient(135deg,#1b4f74 0%,#142238 72%)'},
    cleaning:{key:'cleaning',label:'Schoonmaak',style:'radial-gradient(120% 135% at 82% 0%,rgba(191,132,255,.5),transparent 58%),linear-gradient(135deg,#5a357a 0%,#211b36 72%)'},
    kitchen:{key:'kitchen',label:'Keuken',style:'radial-gradient(120% 135% at 82% 0%,rgba(59,205,190,.52),transparent 58%),linear-gradient(135deg,#17695f 0%,#142c2c 72%)'},
    groceries:{key:'groceries',label:'Boodschappen',style:'radial-gradient(120% 135% at 82% 0%,rgba(92,206,126,.5),transparent 58%),linear-gradient(135deg,#2b6b48 0%,#183126 72%)'},
    admin:{key:'admin',label:'Administratie',style:'radial-gradient(120% 135% at 82% 0%,rgba(120,134,255,.48),transparent 58%),linear-gradient(135deg,#394b87 0%,#1b223f 72%)'},
    family:{key:'family',label:'Gezin',style:'radial-gradient(120% 135% at 82% 0%,rgba(240,111,165,.48),transparent 58%),linear-gradient(135deg,#8c3e66 0%,#392035 72%)'},
    garden:{key:'garden',label:'Tuin',style:'radial-gradient(120% 135% at 82% 0%,rgba(139,201,92,.5),transparent 58%),linear-gradient(135deg,#496b34 0%,#1f321d 72%)'},
    travel:{key:'travel',label:'Reizen',style:'radial-gradient(120% 135% at 82% 0%,rgba(86,155,255,.55),transparent 58%),linear-gradient(135deg,#2e5a99 0%,#172a47 72%)'},
    dropoff:{key:'dropoff',label:'Wegbrengen',style:'radial-gradient(120% 135% at 82% 0%,rgba(247,164,72,.52),transparent 58%),linear-gradient(135deg,#91551f 0%,#3c2819 72%)'},
    pickup:{key:'pickup',label:'Ophalen',style:'radial-gradient(120% 135% at 82% 0%,rgba(65,205,218,.52),transparent 58%),linear-gradient(135deg,#1d7382 0%,#18333a 72%)'}
  };

  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function infer(task){
    if(window.TaskCategoryIcons&&typeof TaskCategoryIcons.detect==='function')return TaskCategoryIcons.detect(task||{});
    var raw=String(task&&((task.category||task.type||task.title))||'').toLowerCase();
    if(/ophalen|afhalen|pickup|pick-up/.test(raw))return'pickup';
    if(/wegbrengen|brengen|afzetten|dropoff|drop-off/.test(raw))return'dropoff';
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
  function selectedCreateCategory(){var b=document.querySelector('[data-cat-pick].active');return b&&b.getAttribute('data-cat-pick');}
  function createTitle(){var x=document.getElementById('tdp-create-title');return x&&x.value||'';}
  function category(){
    if(!activeCreate&&activeTaskId){var t=taskById(activeTaskId);if(t)return infer(t);}
    var selected=selectedCreateCategory();if(selected&&TEMPLATES[selected])return selected;
    return infer({title:createTitle()});
  }
  function apply(){
    var hero=document.querySelector('#tdp-overlay .tdp-hero');if(!hero)return;
    var cat=category(),tpl=TEMPLATES[cat]||TEMPLATES.quest;
    var existing=hero.getAttribute('data-task-hero-template');
    if(existing===tpl.key)return;
    hero.setAttribute('data-task-hero-template',tpl.key);
    // Do not overwrite a real explicit image. The popup already supports
    // task.heroImage/imageUrl/etc.; this layer is only the template fallback.
    var inline=hero.style.backgroundImage||'';
    var hasReal=/url\(/i.test(inline);
    if(!hasReal){hero.style.backgroundImage=tpl.style;hero.style.backgroundPosition='center';hero.style.backgroundSize='cover';}
  }
  function hook(){
    var api=window.TaskDetailPopup;if(!api)return false;
    if(api.__heroTemplatesHooked)return true;
    var open=api.open,create=api.openCreate;
    if(typeof open==='function')api.open=function(id){activeCreate=false;activeTaskId=id;var r=open.apply(this,arguments);setTimeout(apply,0);return r;};
    if(typeof create==='function')api.openCreate=function(){activeCreate=true;activeTaskId=null;var r=create.apply(this,arguments);setTimeout(apply,0);return r;};
    api.__heroTemplatesHooked=true;return true;
  }
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='tdp-create-title')setTimeout(apply,0);});
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-cat-pick]');if(b)setTimeout(apply,0);},true);
  var observer=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      if(muts[i].addedNodes&&muts[i].addedNodes.length){if(document.querySelector('#tdp-overlay .tdp-hero')){apply();break;}}
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hook();var tries=0,t=setInterval(function(){tries++;if(hook()||tries>40)clearInterval(t);},100);
  window.TaskHeroTemplates={templates:TEMPLATES,apply:apply,category:category};
})();
