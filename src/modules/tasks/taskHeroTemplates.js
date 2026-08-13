'use strict';
// ============================================================
// TASK HERO TEMPLATES v6
// Visual-only hero asset layer for Task Detail/Create popup cards.
// Existing task/category keys remain stable; title keywords can select
// a more specific hero variant without migrating persisted task data.
// ============================================================
(function(){
  if(window.__taskHeroTemplatesV6)return;
  window.__taskHeroTemplatesV6=true;

  var activeTaskId=null;
  var activeCreate=true;
  var activeCreateCat=null;
  var ASSET_BASE='src/assets/task-heroes/';

  var TEMPLATES={
    quest:{key:'quest',label:'Avontuur',image:ASSET_BASE+'quest-adventure.webp',position:'center 55%',style:'radial-gradient(120% 140% at 78% -10%,rgba(172,120,255,.55),transparent 58%),linear-gradient(135deg,#3b2368 0%,#171126 72%)'},
    laundry:{key:'laundry',label:'Wasgoed',image:ASSET_BASE+'cozy-home.webp',position:'center 54%',style:'radial-gradient(110% 130% at 82% 0%,rgba(93,187,255,.55),transparent 58%),linear-gradient(135deg,#1b4f74 0%,#142238 72%)'},
    cleaning:{key:'cleaning',label:'Schoonmaak',image:ASSET_BASE+'cozy-home.webp',position:'center 54%',style:'radial-gradient(120% 135% at 82% 0%,rgba(191,132,255,.5),transparent 58%),linear-gradient(135deg,#5a357a 0%,#211b36 72%)'},
    kitchen:{key:'kitchen',label:'Keuken',image:ASSET_BASE+'kitchen.webp',position:'center 54%',style:'radial-gradient(120% 135% at 82% 0%,rgba(59,205,190,.52),transparent 58%),linear-gradient(135deg,#17695f 0%,#142c2c 72%)'},
    groceries:{key:'groceries',label:'Boodschappen',image:ASSET_BASE+'market.webp',position:'center 55%',style:'radial-gradient(120% 135% at 82% 0%,rgba(92,206,126,.5),transparent 58%),linear-gradient(135deg,#2b6b48 0%,#183126 72%)'},
    pantry:{key:'pantry',label:'Voorraad',image:ASSET_BASE+'market.webp',position:'center 55%',style:'radial-gradient(120% 135% at 82% 0%,rgba(230,170,65,.48),transparent 58%),linear-gradient(135deg,#74511f 0%,#302319 72%)'},
    admin:{key:'admin',label:'Administratie',image:ASSET_BASE+'quest-adventure.webp',position:'center 48%',style:'radial-gradient(120% 135% at 82% 0%,rgba(120,134,255,.48),transparent 58%),linear-gradient(135deg,#394b87 0%,#1b223f 72%)'},
    family:{key:'family',label:'Gezin',image:ASSET_BASE+'cozy-home.webp',position:'center 54%',style:'radial-gradient(120% 135% at 82% 0%,rgba(240,111,165,.48),transparent 58%),linear-gradient(135deg,#8c3e66 0%,#392035 72%)'},
    garden:{key:'garden',label:'Tuin',image:ASSET_BASE+'garden.webp',position:'center 55%',style:'radial-gradient(120% 135% at 82% 0%,rgba(139,201,92,.5),transparent 58%),linear-gradient(135deg,#496b34 0%,#1f321d 72%)'},
    travel:{key:'travel',label:'Reizen',image:ASSET_BASE+'travel.webp',position:'center 56%',style:'radial-gradient(120% 135% at 82% 0%,rgba(86,155,255,.55),transparent 58%),linear-gradient(135deg,#2e5a99 0%,#172a47 72%)'},
    dropoff:{key:'dropoff',label:'Wegbrengen',image:ASSET_BASE+'travel.webp',position:'center 56%',style:'radial-gradient(120% 135% at 82% 0%,rgba(247,164,72,.52),transparent 58%),linear-gradient(135deg,#91551f 0%,#3c2819 72%)'},
    pickup:{key:'pickup',label:'Ophalen',image:ASSET_BASE+'travel.webp',position:'center 56%',style:'radial-gradient(120% 135% at 82% 0%,rgba(65,205,218,.52),transparent 58%),linear-gradient(135deg,#1d7382 0%,#18333a 72%)'}
  };

  var VARIANTS={
    dishwashing:{key:'dishwashing',template:'kitchen'},
    cooking:{key:'cooking',template:'kitchen'},
    pantry:{key:'pantry',template:'pantry'},
    shopping:{key:'shopping',template:'groceries'},
    plants:{key:'plants',template:'garden'},
    laundry:{key:'laundry',template:'laundry'},
    cleaning:{key:'cleaning',template:'cleaning'},
    travel:{key:'travel',template:'travel'}
  };

  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function rawText(task){return String(task&&((task.title||'')+' '+(task.category||'')+' '+(task.type||''))||'').toLowerCase();}
  function heroVariant(task){
    var raw=rawText(task);
    if(/vaatwasser|afwas|afwassen|servies|bestek|borden/.test(raw))return'dishwashing';
    if(/voorraad|pantry|voorraadkast|kast aanvullen|voorraad aanvullen|organiseren|snack|snacks|snoep|chips|lekkers|lekkere dingen/.test(raw))return'pantry';
    if(/shoppen|winkelen|winkeltrip|cadeau|cadeaus|stad in/.test(raw))return'shopping';
    if(/plant|planten|tuin|bloem|bloemen|water geven/.test(raw))return'plants';
    if(/koken|maaltijd|eten maken|diner|lunch|ontbijt|bakken|snijden/.test(raw))return'cooking';
    if(/was|wassen|wasmand|droger|kleding|was vouwen|was ophangen/.test(raw))return'laundry';
    if(/stofzuigen|dweilen|schoonmaken|poetsen|opruimen|schoon/.test(raw))return'cleaning';
    if(/ophalen|afhalen|wegbrengen|brengen|afzetten|reizen|reis|travel|trip|station|vliegveld|airport|vlucht/.test(raw))return'travel';
    return'';
  }
  function infer(task){
    if(window.TaskCategoryIcons&&typeof TaskCategoryIcons.detect==='function')return TaskCategoryIcons.detect(task||{});
    var raw=rawText(task);
    if(/ophalen|afhalen|pickup|pick-up/.test(raw))return'pickup';
    if(/wegbrengen|brengen|afzetten|dropoff|drop-off/.test(raw))return'dropoff';
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
  function selectedCreateCategory(){
    var b=document.querySelector('[data-cat-pick].active,[data-extra-cat].active');
    var dom=b&&(b.getAttribute('data-cat-pick')||b.getAttribute('data-extra-cat'));
    return dom||activeCreateCat;
  }
  function createTitle(){var x=document.getElementById('tdp-create-title');return x&&x.value||'';}
  function currentTask(){
    if(!activeCreate&&activeTaskId)return taskById(activeTaskId);
    return {title:createTitle(),category:selectedCreateCategory()||''};
  }
  function category(){
    var task=currentTask();
    var selected=activeCreate?selectedCreateCategory():'';
    if(selected&&TEMPLATES[selected])return selected;
    return infer(task);
  }
  function templateFor(task){
    var variant=heroVariant(task);
    if(variant&&VARIANTS[variant])return TEMPLATES[VARIANTS[variant].template]||TEMPLATES.quest;
    return TEMPLATES[category()]||TEMPLATES.quest;
  }
  function isOwnAsset(bg){return String(bg||'').indexOf('src/assets/task-heroes/')!==-1;}
  function apply(){
    var hero=document.querySelector('#tdp-overlay .tdp-hero');if(!hero)return;
    var task=currentTask(),variant=heroVariant(task),tpl=templateFor(task),visualKey=variant||tpl.key;
    var inline=hero.style.backgroundImage||'';
    if(/url\(/i.test(inline)&&!isOwnAsset(inline)){
      hero.removeAttribute('data-task-hero-template');
      return;
    }
    if(hero.getAttribute('data-task-hero-template')===visualKey&&((tpl.image&&isOwnAsset(inline))||(!tpl.image&&!/url\(/i.test(inline))))return;
    hero.setAttribute('data-task-hero-template',visualKey);
    hero.style.backgroundImage=tpl.image?'url("'+tpl.image+'"),'+tpl.style:tpl.style;
    hero.style.backgroundPosition=tpl.position||'center';
    hero.style.backgroundSize='cover';
    hero.style.backgroundRepeat='no-repeat';
  }
  function hook(){
    var api=window.TaskDetailPopup;if(!api)return false;
    if(api.__heroTemplatesHookedV6)return true;
    var open=api.open,create=api.openCreate;
    if(typeof open==='function')api.open=function(id){activeCreate=false;activeCreateCat=null;activeTaskId=id;var r=open.apply(this,arguments);setTimeout(apply,0);return r;};
    if(typeof create==='function')api.openCreate=function(){activeCreate=true;activeTaskId=null;activeCreateCat=null;var r=create.apply(this,arguments);setTimeout(apply,0);return r;};
    api.__heroTemplatesHookedV6=true;return true;
  }
  document.addEventListener('input',function(e){if(e.target&&e.target.id==='tdp-create-title')setTimeout(apply,0);});
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('[data-cat-pick],[data-extra-cat]');
    if(!b)return;
    var cat=b.getAttribute('data-cat-pick')||b.getAttribute('data-extra-cat');
    if(cat&&TEMPLATES[cat]){activeCreateCat=cat;setTimeout(apply,0);}
  },true);
  var observer=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      if(muts[i].addedNodes&&muts[i].addedNodes.length&&document.querySelector('#tdp-overlay .tdp-hero')){apply();break;}
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hook();var tries=0,t=setInterval(function(){tries++;if(hook()||tries>40)clearInterval(t);},100);
  window.TaskHeroTemplates={templates:TEMPLATES,variants:VARIANTS,apply:apply,category:category,heroVariant:heroVariant};
})();
