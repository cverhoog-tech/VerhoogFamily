'use strict';
// STEP 13.5 — canonical recipe-detail entrypoint for meal proposals.
(function(){
  if(window.MealProposalRecipeEntryBridge)return;

  function attach(recipeId){
    var host=document.querySelector('#recipe-detail-view .rd-primary-actions');
    if(!host||host.querySelector('#rd-propose-meal'))return false;
    var btn=document.createElement('button');
    btn.type='button';
    btn.id='rd-propose-meal';
    btn.className='rd-actionbtn proposal';
    btn.innerHTML='<span aria-hidden="true">💬</span><span>Maaltijd voorstellen</span>';
    btn.onclick=function(){
      if(window.MealProposalUi&&typeof MealProposalUi.openComposer==='function')MealProposalUi.openComposer(recipeId);
      else if(typeof window.openMealProposalComposer==='function')window.openMealProposalComposer(recipeId);
      else if(typeof window.showToast==='function')window.showToast('Maaltijdvoorstellen worden geladen');
    };
    host.appendChild(btn);
    return true;
  }

  function wrap(){
    if(typeof window.openRecipeDetail!=='function'||window.openRecipeDetail.__mealProposalEntryWrapped)return false;
    var original=window.openRecipeDetail;
    var wrapped=function(id){
      var result=original.apply(this,arguments);
      setTimeout(function(){attach(id);},0);
      setTimeout(function(){attach(id);},60);
      return result;
    };
    wrapped.__mealProposalEntryWrapped=true;
    window.openRecipeDetail=wrapped;
    try{openRecipeDetail=wrapped;}catch(e){}
    return true;
  }

  function css(){
    if(document.getElementById('meal-proposal-recipe-entry-css'))return;
    var s=document.createElement('style');
    s.id='meal-proposal-recipe-entry-css';
    s.textContent='.rd-primary-actions:has(#rd-propose-meal){grid-template-columns:1fr 1fr}.rd-actionbtn.proposal{grid-column:1/-1;background:linear-gradient(135deg,#d8875f,#b86442);box-shadow:0 8px 18px rgba(184,100,66,.22)}';
    document.head.appendChild(s);
  }

  function boot(){
    css();
    var tries=0,t=setInterval(function(){tries++;if(wrap()||tries>120)clearInterval(t);},50);
  }

  window.MealProposalRecipeEntryBridge={version:'1.0.0',attach:attach,wrap:wrap};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
