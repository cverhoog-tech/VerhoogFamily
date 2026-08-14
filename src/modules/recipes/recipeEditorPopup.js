'use strict';
// ============================================================
// RECIPE EDITOR POPUP v1.0
// Premium "recipe card" create/edit popup for the receptenmodule.
// Visual language mirrors src/modules/tasks/taskDetailPopup.js
// (parchment card, Cinzel/Cormorant type, gold hairline, soft depth)
// but the hero itself uses the meal-type moods from
// src/modules/recipes/recipeHero.js instead of the tasks' purple/gold
// accent — see that file for the shared resolver used here, by the
// recipe grid cards, and by the recipe detail view.
//
// This popup owns only local *draft* form state. Saving always goes
// through window.RecipeStore.create()/.upsert() — the same write path
// recipes.js already used. No direct localStorage/HouseholdRepository
// writes, no DOM hacks/MutationObservers.
// ============================================================
(function(){
  if(window.RecipeEditorPopup) return;

  var draft=null;
  var saving=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function RH(){return window.RecipeHero;}
  function store(){return window.RecipeStore||null;}
  function toast(msg){if(typeof window.showToast==='function')window.showToast(msg);}

  function ingredientText(ing){if(ing&&typeof ing==='object')return String(ing.rawText||ing.text||ing.name||'').trim();return String(ing||'').trim();}
  function ingredientLines(list){return (list||[]).map(ingredientText).filter(Boolean);}
  function linesOf(v){return String(v||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);}

  function getRecipe(id){var s=store();if(s&&typeof s.get==='function')return s.get(id);return null;}

  var CLOSE_SVG='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>';
  var CHECK_SVG='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><polyline points="20 6 9 17 4 12"/></svg>';
  var CAM_SVG='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.4"/></svg>';

  var TITLE_PLACEHOLDER={Ontbijt:'Jouw nieuwe ontbijt',Lunch:'Jouw nieuwe lunch',Diner:'Jouw nieuwe diner',Snack:'Jouw nieuwe snack',Dessert:'Jouw nieuwe dessert',Bakken:'Jouw nieuwe bakproject'};

  function makeDraft(existing){
    if(existing){
      return {
        id:existing.id,
        name:existing.name||'',
        cat:existing.cat||'Diner',
        cuisine:existing.cuisine||'',
        persons:existing.persons||4,
        time:existing.time||30,
        ingredients:ingredientLines(existing.ingredients),
        steps:(existing.steps||[]).slice(),
        notes:existing.notes||'',
        photo:existing.photo||null,
        imageMode:existing.photo?'custom':'preset',
        emoji:existing.emoji||null,
        sourceProvider:existing.sourceProvider||'manual',
        sourceUrl:existing.sourceUrl||''
      };
    }
    return {id:null,name:'',cat:'Diner',cuisine:'',persons:4,time:30,ingredients:[],steps:[],notes:'',photo:null,imageMode:'preset',emoji:null,sourceProvider:'manual',sourceUrl:''};
  }

  function overlayEl(){
    var el=document.getElementById('rep-overlay');
    if(!el){el=document.createElement('div');el.id='rep-overlay';el.className='rep-overlay';document.body.appendChild(el);}
    return el;
  }

  function injectStyles(){
    if(document.getElementById('recipe-editor-popup-style'))return;
    var s=document.createElement('style');s.id='recipe-editor-popup-style';
    s.textContent=
      '@import url(\'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap\');'+

      '.rep-overlay{position:fixed;inset:0;background:rgba(8,6,16,.62);z-index:9500;display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;pointer-events:none;transition:opacity .22s;box-sizing:border-box}'+
      '.rep-overlay.open{opacity:1;pointer-events:auto}'+

      '.rep-card{--rep-bg:#fbf7ee;--rep-surface:#ffffff;--rep-surface-2:#f7f2e5;--rep-border:rgba(180,138,60,.32);--rep-border-soft:#efe7d6;--rep-text:#241f1a;--rep-text2:#8c8271;--rep-gold:#a9761f;'+
        'width:100%;max-width:400px;max-height:92vh;overflow-y:auto;background:var(--rep-bg);color:var(--rep-text);border-radius:22px;border:1.5px solid var(--rep-border);'+
        'box-shadow:0 24px 60px rgba(20,10,0,.28);transform:translateY(10px) scale(.98);transition:transform .22s}'+
      '.rep-overlay.open .rep-card{transform:translateY(0) scale(1)}'+
      '[data-theme*="dark"] .rep-card{--rep-bg:#1c1710;--rep-surface:#241d13;--rep-surface-2:#2a2216;--rep-border:#c89a4c;--rep-border-soft:rgba(234,197,94,.16);--rep-text:#f5efe0;--rep-text2:#c9bda0}'+

      '.rep-hero{position:relative;height:150px;background-size:cover;background-position:center;overflow:hidden}'+
      '.rep-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}'+
      '.rep-hero-shade{position:absolute;inset:0;pointer-events:none;'+
        'background:linear-gradient(180deg,rgba(0,0,0,.08) 0%,rgba(0,0,0,.06) 35%,rgba(10,6,4,.72) 100%),linear-gradient(180deg,rgba(0,0,0,.18),transparent 40%)}'+

      '.rep-close{position:absolute;top:9px;left:9px;width:27px;height:27px;border-radius:50%;background:rgba(20,15,10,.4);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,.4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;-webkit-appearance:none;appearance:none;padding:0}'+
      '.rep-photo-remove{position:absolute;top:9px;right:9px;z-index:3;background:rgba(20,15,10,.5);backdrop-filter:blur(6px);color:#fff;border:1.5px solid rgba(255,255,255,.35);border-radius:99px;padding:5px 11px;font-size:10.5px;font-weight:800;cursor:pointer}'+

      '.rep-hero-content{position:absolute;left:14px;right:14px;bottom:12px;z-index:2}'+
      '.rep-badge{display:inline-block;font-family:"Cinzel",Georgia,serif;font-size:9px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#fff;background:rgba(255,255,255,.16);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.3);border-radius:99px;padding:3px 9px;margin-bottom:6px}'+
      '.rep-hero-title{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:22px;color:#fff;line-height:1.12;text-shadow:0 2px 10px rgba(0,0,0,.5);word-break:break-word}'+
      '.rep-hero-sub{display:inline-block;margin-top:5px;font-size:11.5px;font-weight:700;color:#fff;opacity:.9;text-shadow:0 1px 6px rgba(0,0,0,.5)}'+

      '.rep-body{padding:14px 15px 15px}'+
      '.rep-divider{display:flex;align-items:center;gap:8px;margin:2px 0 12px;color:var(--rep-gold);opacity:.6}'+
      '.rep-divider:before,.rep-divider:after{content:"";flex:1;height:1px;background:var(--rep-border-soft)}'+
      '.rep-divider span{font-size:9px}'+

      '.rep-field{margin-bottom:11px}'+
      '.rep-label{display:block;font-size:9.5px;font-weight:900;color:var(--rep-text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}'+
      '.rep-input,.rep-select,.rep-textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--rep-border-soft);border-radius:12px;padding:9px 11px;font-size:13.5px;font-family:inherit;background:var(--rep-surface);color:var(--rep-text);outline:none;transition:border-color .15s, box-shadow .15s}'+
      '.rep-input:focus,.rep-select:focus,.rep-textarea:focus{border-color:var(--rep-gold);box-shadow:0 0 0 3px rgba(169,118,31,.14)}'+
      '.rep-textarea{resize:vertical;line-height:1.45}'+
      '.rep-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
      '.rep-hint{font-size:11px;color:var(--rep-text2);margin:-3px 0 12px;line-height:1.4}'+

      '.rep-photo-btn{width:100%;background:var(--rep-surface-2);border:1.5px dashed var(--rep-border,rgba(169,118,31,.5));border-radius:12px;padding:10px;font-size:12.5px;font-weight:800;color:var(--rep-gold);cursor:pointer;display:flex;align-items:center;justify-content:center}'+

      '.rep-actions{display:flex;gap:9px;margin-top:6px}'+
      '.rep-cta{flex:1;border:1.5px solid var(--rep-border-soft);border-radius:13px;padding:12px;font-size:13.5px;font-weight:800;background:var(--rep-surface);color:var(--rep-text);cursor:pointer;display:flex;align-items:center;justify-content:center}'+
      '.rep-cta.primary{background:linear-gradient(135deg,#c8862c,#a9761f);border-color:transparent;color:#fff;box-shadow:0 8px 18px rgba(169,118,31,.28)}'+
      '.rep-cta:disabled{opacity:.6;cursor:default}';
    document.head.appendChild(s);
  }

  function heroBadgeText(){return draft.id?'Recept bewerken':'Nieuw recept';}
  function heroTitleText(){var n=(draft.name||'').trim();return n?n:(TITLE_PLACEHOLDER[draft.cat]||'Jouw nieuwe recept');}
  function heroOf(){return RH().resolve({cat:draft.cat,photo:draft.imageMode==='custom'?draft.photo:null,emoji:draft.emoji});}

  function renderHero(){
    var hero=heroOf();
    return '<div class="rep-hero" id="rep-hero" style="'+(hero.hasPhoto?'':'background-image:'+hero.background)+'">'+
      (hero.hasPhoto?'<img class="rep-hero-img" src="'+esc(hero.photoUrl)+'" alt="">':'')+
      '<div class="rep-hero-shade"></div>'+
      '<button type="button" class="rep-close" id="rep-close-btn" aria-label="Sluiten">'+CLOSE_SVG+'</button>'+
      (hero.hasPhoto?'<button type="button" class="rep-photo-remove" id="rep-photo-remove">Verwijder foto</button>':'')+
      '<div class="rep-hero-content">'+
        '<span class="rep-badge" id="rep-badge">'+esc(heroBadgeText())+'</span>'+
        '<div class="rep-hero-title" id="rep-hero-title">'+esc(heroTitleText())+'</div>'+
        '<div class="rep-hero-sub" id="rep-hero-sub">'+hero.emoji+' '+esc(draft.cat)+'</div>'+
      '</div>'+
    '</div>';
  }

  function render(){
    injectStyles();
    var ov=overlayEl();
    var CATS=RH().CATS;
    var html=
      '<div class="rep-card" role="dialog" aria-modal="true" aria-label="'+esc(heroBadgeText())+'">'+
        renderHero()+
        '<div class="rep-body">'+
          '<input type="file" accept="image/*" id="rep-photo-file" style="display:none">'+
          '<div class="rep-field"><label class="rep-label">Naam</label><input class="rep-input" id="rep-name" placeholder="Bijv. Zondagse pannenkoeken" value="'+esc(draft.name)+'" maxlength="80"></div>'+
          '<div class="rep-field"><label class="rep-label">Maaltijdtype</label><select class="rep-select" id="rep-cat">'+
            CATS.map(function(c){return '<option value="'+c+'"'+(draft.cat===c?' selected':'')+'>'+c+'</option>';}).join('')+
          '</select></div>'+
          '<div class="rep-field"><label class="rep-label">Keuken</label><input class="rep-input" id="rep-cuisine" placeholder="Bijv. Italiaans" value="'+esc(draft.cuisine)+'"></div>'+
          '<div class="rep-row2">'+
            '<div class="rep-field"><label class="rep-label">Personen</label><input class="rep-input" id="rep-persons" type="number" min="1" value="'+esc(draft.persons)+'"></div>'+
            '<div class="rep-field"><label class="rep-label">Tijd (min)</label><input class="rep-input" id="rep-time" type="number" min="1" value="'+esc(draft.time)+'"></div>'+
          '</div>'+
          '<button type="button" class="rep-photo-btn" id="rep-photo-btn">'+CAM_SVG+(draft.imageMode==='custom'?'Andere foto kiezen':'Eigen foto toevoegen')+'</button>'+
          '<div class="rep-hint">Zonder eigen foto krijgt dit recept automatisch de FamilyApp '+esc(draft.cat)+' Hero.</div>'+
          '<div class="rep-divider"><span>◆</span></div>'+
          '<div class="rep-field"><label class="rep-label">Ingrediënten · 1 per regel</label><textarea class="rep-textarea" id="rep-ings" rows="6">'+esc(draft.ingredients.join('\n'))+'</textarea></div>'+
          '<div class="rep-field"><label class="rep-label">Stappen · 1 per regel</label><textarea class="rep-textarea" id="rep-steps" rows="5">'+esc(draft.steps.join('\n'))+'</textarea></div>'+
          '<div class="rep-field"><label class="rep-label">Notities</label><textarea class="rep-textarea" id="rep-notes" rows="2">'+esc(draft.notes)+'</textarea></div>'+
          '<div class="rep-actions">'+
            '<button type="button" class="rep-cta" id="rep-cancel-btn">Annuleren</button>'+
            '<button type="button" class="rep-cta primary" id="rep-save-btn">'+CHECK_SVG+'Opslaan</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    ov.innerHTML=html;
    ov.style.pointerEvents='';
    requestAnimationFrame(function(){ov.classList.add('open');});
    document.body.style.overflow='hidden';
    bind(ov);
  }

  // Cheap partial DOM patch for name/cat changes so typing never loses
  // input focus/cursor position via a full re-render.
  function updateHeroLive(){
    var heroEl=document.getElementById('rep-hero');
    if(!heroEl)return;
    var hero=heroOf();
    if(!hero.hasPhoto)heroEl.style.backgroundImage=hero.background;
    var t=document.getElementById('rep-hero-title');if(t)t.textContent=heroTitleText();
    var sub=document.getElementById('rep-hero-sub');if(sub)sub.textContent=hero.emoji+' '+draft.cat;
    var hint=heroEl.parentNode?heroEl.parentNode.querySelector('.rep-hint'):null;
    if(hint)hint.textContent='Zonder eigen foto krijgt dit recept automatisch de FamilyApp '+draft.cat+' Hero.';
  }

  function syncFields(){
    var n=document.getElementById('rep-name');if(n)draft.name=n.value;
    var cu=document.getElementById('rep-cuisine');if(cu)draft.cuisine=cu.value;
    var p=document.getElementById('rep-persons');if(p)draft.persons=p.value;
    var ti=document.getElementById('rep-time');if(ti)draft.time=ti.value;
    var ing=document.getElementById('rep-ings');if(ing)draft.ingredients=linesOf(ing.value);
    var st=document.getElementById('rep-steps');if(st)draft.steps=linesOf(st.value);
    var no=document.getElementById('rep-notes');if(no)draft.notes=no.value;
  }

  function bind(ov){
    ov.onclick=function(e){if(e.target===ov)cancel();};
    var closeBtn=document.getElementById('rep-close-btn');if(closeBtn)closeBtn.onclick=cancel;
    var cancelBtn=document.getElementById('rep-cancel-btn');if(cancelBtn)cancelBtn.onclick=cancel;
    var saveBtn=document.getElementById('rep-save-btn');if(saveBtn)saveBtn.onclick=doSave;

    var nameInput=document.getElementById('rep-name');
    if(nameInput)nameInput.oninput=function(){draft.name=nameInput.value;updateHeroLive();};

    var catSelect=document.getElementById('rep-cat');
    if(catSelect)catSelect.onchange=function(){draft.cat=catSelect.value;updateHeroLive();};

    var photoBtn=document.getElementById('rep-photo-btn');
    var photoFile=document.getElementById('rep-photo-file');
    if(photoBtn&&photoFile){
      photoBtn.onclick=function(){photoFile.click();};
      photoFile.onchange=function(ev){
        var f=ev.target.files&&ev.target.files[0];if(!f)return;
        var rd=new FileReader();
        rd.onload=function(e){syncFields();draft.photo=e.target.result;draft.imageMode='custom';render();};
        rd.readAsDataURL(f);
      };
    }
    var removeBtn=document.getElementById('rep-photo-remove');
    if(removeBtn)removeBtn.onclick=function(){syncFields();draft.photo=null;draft.imageMode='preset';render();};
  }

  function doSave(){
    if(saving)return;
    syncFields();
    var name=(draft.name||'').trim();
    if(!name){toast('Naam verplicht');return;}
    if(!draft.ingredients.length){toast('Voeg minstens 1 ingrediënt toe');return;}
    var s=store();
    if(!s){toast('Receptopslag niet beschikbaar');return;}

    var payload={
      name:name,
      cat:draft.cat,
      cuisine:(draft.cuisine||'').trim(),
      persons:parseInt(draft.persons,10)||4,
      time:parseInt(draft.time,10)||30,
      emoji:RH().icon(draft.cat),
      photo:draft.imageMode==='custom'?draft.photo:null,
      imageMode:draft.imageMode,
      heroPreset:draft.cat.toLowerCase(),
      ingredients:draft.ingredients,
      steps:draft.steps,
      notes:draft.notes||'',
      sourceProvider:draft.sourceProvider||'manual',
      sourceUrl:draft.sourceUrl||''
    };
    if(draft.id)payload.id=draft.id;

    saving=true;
    var saveBtn=document.getElementById('rep-save-btn');if(saveBtn)saveBtn.disabled=true;
    var job=draft.id?s.upsert(payload):s.create(payload);
    job.then(function(res){
      saving=false;
      var saved=(res&&res.recipe)||payload;
      var isNew=!draft.id;
      if(isNew&&typeof window.awardXP==='function')window.awardXP(4,'Recept aangemaakt');
      toast('Opgeslagen ✓');
      close();
      setTimeout(function(){if(typeof window.openRecipeDetail==='function')window.openRecipeDetail(saved.id);},80);
    }).catch(function(){
      saving=false;
      if(saveBtn)saveBtn.disabled=false;
      toast('Opslaan mislukt');
    });
  }

  function cancel(){close();}

  function close(){
    var ov=document.getElementById('rep-overlay');
    if(ov){
      ov.classList.remove('open');
      ov.style.pointerEvents='none';
      setTimeout(function(){if(ov&&!ov.classList.contains('open'))ov.innerHTML='';},220);
    }
    document.body.style.overflow='';
    draft=null;
    saving=false;
  }

  function open(id){
    var existing=id?getRecipe(id):null;
    draft=makeDraft(existing);
    render();
  }

  window.RecipeEditorPopup={open:open,close:close,isOpen:function(){return !!draft;}};
})();
