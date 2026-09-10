'use strict';
// ============================================================
// MEAL PROPOSAL UI v1.0.0 — STEP 13.5
// Presentation only. Workflow writes go through MealProposalService.
// ============================================================
(function(){
  if(window.MealProposalUi)return;
  var VERSION='1.0.0',sub=null,baseFeedBody=null,recipeWrapped=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(v){if(typeof window.showToast==='function')window.showToast(v);}
  function svc(){return window.MealProposalService||null;}
  function recipes(){try{return window.RecipeStore&&RecipeStore.list?RecipeStore.list():(window.recipesData||[]);}catch(e){return[];}}
  function recipe(id){return recipes().find(function(r){return String(r.id)===String(id);})||null;}
  function members(){try{return window.FeedSharedData&&FeedSharedData.members?FeedSharedData.members():[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function memberName(uid){var m=member(uid)||{};return m.displayName||m.name||'Gezinslid';}
  function memberAvatar(uid){var m=member(uid)||{},url=m.avatar||m.avatarUrl||m.photoURL||m.photoUrl||'';if(url)return'<img class="mp-author" src="'+esc(url)+'" alt="'+esc(memberName(uid))+'">';return'<span class="mp-author mp-author-fallback">'+esc(memberName(uid).charAt(0).toUpperCase())+'</span>';}
  function dateLabel(v){if(!v)return'Nog geen dag';var d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});}
  function mealLabel(v){return v==='breakfast'?'Ontbijt':v==='lunch'?'Lunch':'Diner';}
  function currentUid(){try{var c=window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;return c&&c.uid||null;}catch(e){return null;}}

  function card(p){
    var effective=svc()&&svc().effectiveProposal?svc().effectiveProposal(p,{}):p;
    var photo=p.recipePhoto?'<img class="mp-photo" src="'+esc(p.recipePhoto)+'" alt="'+esc(p.recipeTitle)+'">':'<div class="mp-photo mp-photo-fallback">🍽️</div>';
    var pending=p.status==='pending',counter=!!p.counterProposal,statusText=p.status==='accepted'?'Geaccepteerd ✓':p.status==='rejected'?'Afgewezen':'Voorstel';
    return '<article class="fs-card mp-card mp-'+esc(p.status)+'" data-meal-proposal="'+esc(p.id)+'">'
      +'<div class="mp-head">'+memberAvatar(p.proposerUid)+'<div class="mp-head-copy"><span>'+esc(statusText.toUpperCase())+'</span><strong>'+esc(memberName(p.proposerUid))+' stelt voor…</strong></div></div>'
      +'<div class="mp-recipe">'+photo+'<div><h3>'+esc(p.recipeTitle)+'</h3><div class="mp-meta"><span>📅 '+esc(dateLabel(effective.date))+'</span><span>🍽 '+esc(mealLabel(effective.mealType))+'</span><span>👥 '+esc(effective.persons||p.persons||4)+'p</span></div>'+(p.note?'<p>'+esc(p.note)+'</p>':'')+(counter?'<small>↪ Tegenvoorstel actief</small>':'')+'</div></div>'
      +(pending?'<div class="mp-actions"><button type="button" onclick="event.stopPropagation();mealProposalReject(\''+esc(p.id)+'\')">Afwijzen</button><button type="button" onclick="event.stopPropagation();mealProposalCounter(\''+esc(p.id)+'\')">Tegenvoorstel</button><button type="button" class="primary" onclick="event.stopPropagation();mealProposalAccept(\''+esc(p.id)+'\')">Accepteren</button></div>':'<div class="mp-result">'+(p.status==='accepted'?'Staat nu in de maaltijdplanning':'Dit voorstel is afgesloten')+'</div>')
      +'</article>';
  }

  function proposalHtml(){var s=svc();if(!s||typeof s.list!=='function')return'';return s.list().slice(0,12).map(card).join('');}
  function installFeedBridge(){
    if(window.feedListBodyHTML&&window.feedListBodyHTML.__mealProposalWrapped)return;
    if(typeof window.feedListBodyHTML!=='function')return false;
    baseFeedBody=window.feedListBodyHTML;
    var wrapped=function(){var normal=baseFeedBody.apply(this,arguments),proposals=proposalHtml();return proposals+normal;};
    wrapped.__mealProposalWrapped=true;window.feedListBodyHTML=wrapped;return true;
  }
  function rerender(){try{var screen=document.getElementById('screen-feed');if(screen&&screen.classList.contains('active')&&typeof window.renderFeed==='function')window.renderFeed();}catch(e){}}

  function tomorrow(){var d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10);}
  function openComposer(recipeId){
    var r=recipe(recipeId);if(!r){toast('Recept niet gevonden');return false;}if(!window.BottomSheet){toast('Voorstel kan niet openen');return false;}
    BottomSheet.open({title:'🍽️ Maaltijd voorstellen',html:'<div class="mp-compose-preview">'+(r.photo?'<img src="'+esc(r.photo)+'">':'<div>🍽️</div>')+'<span><b>'+esc(r.name)+'</b><small>'+esc(r.cat||'Recept')+'</small></span></div><div class="fam-modal-field"><label>Dag</label><input id="mp-proposal-date" type="date" value="'+tomorrow()+'"></div><div class="fam-modal-field"><label>Moment</label><select id="mp-proposal-type"><option value="dinner">Diner</option><option value="lunch">Lunch</option><option value="breakfast">Ontbijt</option></select></div><div class="fam-modal-field"><label>Personen</label><input id="mp-proposal-persons" type="number" min="1" value="'+esc(r.persons||4)+'"></div><div class="fam-modal-field"><label>Vraag / notitie</label><textarea id="mp-proposal-note" rows="2" placeholder="Zullen we dit dinsdag eten?"></textarea></div>',actions:[{label:'Annuleren'},{label:'Voorstellen',primary:true,keepOpen:true,onClick:function(ctx){var m=ctx.modal,data={recipeId:r.id,date:m.querySelector('#mp-proposal-date').value,mealType:m.querySelector('#mp-proposal-type').value,persons:parseInt(m.querySelector('#mp-proposal-persons').value,10)||r.persons||4,note:m.querySelector('#mp-proposal-note').value||''};var s=svc();if(!s)return false;s.create(data).then(function(){ctx.close();toast('Maaltijdvoorstel gedeeld ✓');rerender();}).catch(function(e){toast(e&&e.message||'Voorstel maken mislukt');});return false;}}]});return false;
  }

  function openAccept(id){var p=svc()&&svc().get(id);if(!p)return;var hasRecipe=!!p.recipeId;BottomSheet.open({title:'Voorstel accepteren',html:'<div class="mp-accept-copy"><b>'+esc(p.recipeTitle)+'</b><span>'+esc(dateLabel((p.counterProposal||{}).date||p.date))+' · '+esc(mealLabel((p.counterProposal||{}).mealType||p.mealType))+'</span></div>'+(hasRecipe?'<label class="mp-shop-choice"><input id="mp-add-ingredients" type="checkbox" checked><span>🛒 Ingrediënten ook naar de boodschappenlijst</span></label>':''),actions:[{label:'Terug'},{label:'Accepteren',primary:true,keepOpen:true,onClick:function(ctx){var add=!!(ctx.modal.querySelector('#mp-add-ingredients')||{}).checked;svc().accept(id,{addIngredients:add}).then(function(result){ctx.close();var n=result&&result.shopping&&result.shopping.added?result.shopping.added.length:0;toast(add?'Gepland · '+n+' ingrediënten toegevoegd ✓':'Maaltijd gepland ✓');rerender();}).catch(function(e){toast(e&&e.message||'Accepteren mislukt');});return false;}}]});}
  function openReject(id){BottomSheet.open({title:'Voorstel afwijzen',html:'<div style="font-size:14px;line-height:1.5">Weet je zeker dat je dit maaltijdvoorstel wilt afwijzen?</div>',actions:[{label:'Annuleren'},{label:'Afwijzen',primary:true,keepOpen:true,onClick:function(ctx){svc().reject(id).then(function(){ctx.close();toast('Voorstel afgewezen');rerender();}).catch(function(e){toast(e&&e.message||'Afwijzen mislukt');});return false;}}]});}
  function openCounter(id){var p=svc()&&svc().get(id);if(!p)return;var e=svc().effectiveProposal(p,{});BottomSheet.open({title:'Tegenvoorstel',html:'<div class="fam-modal-field"><label>Andere dag</label><input id="mp-counter-date" type="date" value="'+esc(e.date)+'"></div><div class="fam-modal-field"><label>Moment</label><select id="mp-counter-type"><option value="dinner">Diner</option><option value="lunch">Lunch</option><option value="breakfast">Ontbijt</option></select></div><div class="fam-modal-field"><label>Personen</label><input id="mp-counter-persons" type="number" min="1" value="'+esc(e.persons)+'"></div><div class="fam-modal-field"><label>Notitie</label><textarea id="mp-counter-note" rows="2">'+esc(e.note||'')+'</textarea></div>',onOpen:function(ctx){var sel=ctx.modal.querySelector('#mp-counter-type');if(sel)sel.value=e.mealType;},actions:[{label:'Annuleren'},{label:'Tegenvoorstel sturen',primary:true,keepOpen:true,onClick:function(ctx){var m=ctx.modal;svc().counter(id,{date:m.querySelector('#mp-counter-date').value,mealType:m.querySelector('#mp-counter-type').value,persons:parseInt(m.querySelector('#mp-counter-persons').value,10)||e.persons,note:m.querySelector('#mp-counter-note').value||''}).then(function(){ctx.close();toast('Tegenvoorstel gedeeld ✓');rerender();}).catch(function(err){toast(err&&err.message||'Tegenvoorstel mislukt');});return false;}}]});}

  function wrapRecipeDetail(){
    if(recipeWrapped||typeof window.openRecipeDetail!=='function')return false;var original=window.openRecipeDetail;
    var wrapped=function(id){var out=original.apply(this,arguments);setTimeout(function(){var row=document.querySelector('.recipe-manage-direct');if(!row||row.querySelector('.mp-propose-recipe'))return;var b=document.createElement('button');b.type='button';b.className='mp-propose-recipe';b.textContent='🍽️ Voorstellen';b.onclick=function(){openComposer(id);};row.appendChild(b);},40);return out;};
    wrapped.__mealProposalWrapped=true;window.openRecipeDetail=wrapped;try{openRecipeDetail=wrapped;}catch(e){}recipeWrapped=true;return true;
  }

  function css(){if(document.getElementById('meal-proposal-ui-style'))return;var s=document.createElement('style');s.id='meal-proposal-ui-style';s.textContent=''
    +'.mp-card{background:linear-gradient(145deg,#fff7ef,#fffaf5)!important;border:1px solid #efdccc!important;overflow:hidden}.mp-head{display:flex;align-items:center;gap:10px}.mp-author{width:38px;height:38px;border-radius:50%;object-fit:cover}.mp-author-fallback{display:grid;place-items:center;background:#f0dfd3;color:#8a5a42;font-weight:950}.mp-head-copy span{display:block;font-size:9px;letter-spacing:.12em;font-weight:950;color:#b56e4b}.mp-head-copy strong{display:block;font-size:13px;margin-top:2px}.mp-recipe{display:grid;grid-template-columns:76px 1fr;gap:12px;margin-top:12px}.mp-photo{width:76px;height:76px;border-radius:16px;object-fit:cover}.mp-photo-fallback{display:grid;place-items:center;background:#f8e7db;font-size:28px}.mp-recipe h3{margin:1px 0 7px;font-size:17px}.mp-meta{display:flex;gap:6px;flex-wrap:wrap}.mp-meta span{font-size:10px;font-weight:850;background:rgba(181,110,75,.09);padding:5px 7px;border-radius:999px}.mp-recipe p{margin:8px 0 0;font-size:12px;color:var(--c-text2,#6b7280)}.mp-recipe small{display:block;margin-top:5px;color:#a25f40;font-weight:800}.mp-actions{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:7px;margin-top:13px}.mp-actions button{height:36px;border:1px solid #e6d6cb;border-radius:11px;background:#fff;color:var(--c-text,#111827);font-size:11px;font-weight:900}.mp-actions .primary{border-color:#4f8d58;background:#4f8d58;color:#fff}.mp-result{margin-top:12px;padding:10px;border-radius:12px;background:rgba(79,141,88,.09);font-size:11px;font-weight:850}.mp-rejected{opacity:.72}.mp-compose-preview{display:flex;align-items:center;gap:10px;margin-bottom:12px}.mp-compose-preview img,.mp-compose-preview>div{width:54px;height:54px;border-radius:13px;object-fit:cover;background:#f8e7db;display:grid;place-items:center}.mp-compose-preview b,.mp-compose-preview small{display:block}.mp-compose-preview small{color:var(--c-text2,#777);margin-top:3px}.mp-accept-copy b,.mp-accept-copy span{display:block}.mp-accept-copy span{margin-top:4px;color:var(--c-text2,#777);font-size:12px}.mp-shop-choice{display:flex;align-items:center;gap:10px;margin-top:16px;padding:12px;border:1px solid var(--c-border,#e5e7eb);border-radius:14px;font-size:13px;font-weight:800}.mp-propose-recipe{background:#fff1e8!important;color:#9b5b3e!important}'
    +'[data-theme="dark"] .mp-card,.dark .mp-card,body.dark-mode .mp-card{background:linear-gradient(145deg,#33241f,#2b211d)!important;border-color:#50372d!important}.dark .mp-actions button,body.dark-mode .mp-actions button{background:#2b2522;border-color:#4b3b33;color:#eee}';document.head.appendChild(s);}

  function boot(){css();installFeedBridge();wrapRecipeDetail();var tries=0,t=setInterval(function(){tries++;installFeedBridge();wrapRecipeDetail();if(tries>80)clearInterval(t);},100);if(svc()&&typeof svc().subscribe==='function')sub=svc().subscribe(function(){rerender();});window.addEventListener('familyapp:meal-proposals',rerender);}

  window.mealProposalAccept=openAccept;window.mealProposalReject=openReject;window.mealProposalCounter=openCounter;window.openMealProposalComposer=openComposer;
  window.MealProposalUi={version:VERSION,boot:boot,renderCards:proposalHtml,openComposer:openComposer};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
