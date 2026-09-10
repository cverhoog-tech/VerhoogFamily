'use strict';
// ============================================================
// MEAL PROPOSAL SERVICE v1.1.0 — STEP 13.5
// Workflow authority only. Delegates accepted planning to MealPlanStore and
// recipe ingredients to ShoppingListStore. Acceptance is atomically claimed
// before canonical meal/shopping mutations so two devices cannot double-apply.
// ============================================================
(function(){
  if(window.MealProposalService)return;

  var VERSION='1.1.0';

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function ctx(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function uid(){var c=ctx();return c&&c.uid||null;}
  function repo(){return window.MealProposalRepository||null;}
  function recipes(){try{return window.RecipeStore&&RecipeStore.list?RecipeStore.list():[];}catch(e){return[];}}
  function recipe(id){return recipes().find(function(r){return String(r.id)===String(id);})||null;}
  function requireRepo(){var r=repo();if(!r)throw new Error('Maaltijdvoorstellen zijn niet beschikbaar');return r;}
  function requireProposal(id){var p=requireRepo().get(id);if(!p)throw new Error('Voorstel niet gevonden');return p;}
  function assertPending(p){if(!p||p.status!=='pending')throw new Error('Dit voorstel is al afgehandeld');}
  function normalizeMealType(v){v=String(v||'dinner');return v==='breakfast'||v==='lunch'||v==='dinner'?v:'dinner';}
  function proposalInput(input){
    input=input||{};var r=input.recipeId?recipe(input.recipeId):null;
    return {recipeId:r?String(r.id):(input.recipeId!=null?String(input.recipeId):null),recipeTitle:String(input.recipeTitle||input.title||(r&&r.name)||'Maaltijd'),recipePhoto:input.recipePhoto||(r&&r.photo)||null,date:String(input.date||''),mealType:normalizeMealType(input.mealType),persons:Math.max(1,parseInt(input.persons,10)||(r&&r.persons)||4),note:String(input.note||''),targetUids:Array.isArray(input.targetUids)?input.targetUids.map(String):[]};
  }
  function create(input){var r;try{r=requireRepo();}catch(e){return Promise.reject(e);}var data=proposalInput(input);if(!data.date)return Promise.reject(new Error('Kies een dag voor het voorstel'));return r.create(data);}
  function reject(id){var p;try{p=requireProposal(id);assertPending(p);}catch(e){return Promise.reject(e);}var r=requireRepo(),actor=uid(),patch={status:'rejected',rejectedByUid:actor,rejectedAt:Date.now()};return typeof r.transition==='function'?r.transition(id,'pending',patch):r.update(id,patch);}
  function counter(id,changes){var p;try{p=requireProposal(id);assertPending(p);}catch(e){return Promise.reject(e);}changes=proposalInput(Object.assign({},p,changes||{}));var r=requireRepo(),patch={status:'pending',counterProposal:{date:changes.date,mealType:changes.mealType,persons:changes.persons,note:String(changes.note||''),proposedByUid:uid(),proposedAt:Date.now()}};return typeof r.transition==='function'?r.transition(id,'pending',patch):r.update(id,patch);}

  function effectiveProposal(p,options){options=options||{};var c=p.counterProposal&&options.useCounter!==false?p.counterProposal:null;return{date:String(options.date||c&&c.date||p.date||''),mealType:normalizeMealType(options.mealType||c&&c.mealType||p.mealType),persons:Math.max(1,parseInt(options.persons||c&&c.persons||p.persons,10)||4),note:String(options.note!=null?options.note:(c&&c.note!=null?c.note:p.note||'')),recipeId:p.recipeId||null,title:p.recipeTitle||'Maaltijd',emoji:(recipe(p.recipeId)||{}).emoji||'🍽️'};}

  function planAccepted(p,options){if(!window.MealPlanStore||typeof MealPlanStore.replaceSlot!=='function')return Promise.reject(new Error('Maaltijdplanner is niet beschikbaar'));var e=effectiveProposal(p,options);if(!e.date)return Promise.reject(new Error('Voorstel heeft geen geldige dag'));var mealRecord={date:e.date,mealType:e.mealType,title:e.title,recipeId:e.recipeId,persons:e.persons,emoji:e.emoji,notes:e.note,source:'meal-proposal',sourceProposalId:p.id};return MealPlanStore.replaceSlot(mealRecord).then(function(result){var record=result&&result.record||result||{};return{effective:e,mealRecord:record};});}
  function appendIngredients(p,listKey){if(!p.recipeId)return Promise.resolve({skipped:true,reason:'no-recipe'});var r=recipe(p.recipeId);if(!r)return Promise.resolve({skipped:true,reason:'recipe-not-found'});if(!window.ShoppingListStore||typeof ShoppingListStore.appendRecipeIngredients!=='function')return Promise.reject(new Error('Boodschappenlijst is niet beschikbaar'));return ShoppingListStore.appendRecipeIngredients(r,listKey||null);}
  function releaseClaim(id,actor,error){var r=repo();if(!r||typeof r.transition!=='function')return Promise.resolve();return r.transition(id,'accepting',{status:'pending',acceptingByUid:null,acceptingAt:null,lastAcceptError:error&&error.message||String(error||'accept-failed')}).catch(function(){return null;});}

  function accept(id,options){
    options=options||{};var p,r,actor=uid();try{p=requireProposal(id);assertPending(p);r=requireRepo();}catch(e){return Promise.reject(e);}
    var claimPatch={status:'accepting',acceptingByUid:actor,acceptingAt:Date.now()};
    var claim=typeof r.transition==='function'?r.transition(id,'pending',claimPatch):r.update(id,claimPatch);
    return claim.then(function(claimed){
      return planAccepted(claimed,options).then(function(planned){
        var shoppingPromise=options.addIngredients===true?appendIngredients(claimed,options.listKey):Promise.resolve(null);
        return shoppingPromise.then(function(shopping){
          var plannedId=planned.mealRecord&&planned.mealRecord.id||null,finalPatch={status:'accepted',acceptingByUid:null,acceptingAt:null,acceptedByUid:actor,acceptedAt:Date.now(),plannedMealId:plannedId,shoppingResult:shopping?{listKey:shopping.listKey||null,addedCount:Array.isArray(shopping.added)?shopping.added.length:0,skippedCount:Array.isArray(shopping.skipped)?shopping.skipped.length:0}:null};
          var done=typeof r.transition==='function'?r.transition(id,'accepting',finalPatch):r.update(id,finalPatch);
          return done.then(function(updated){try{window.dispatchEvent(new CustomEvent('familyapp:meal-proposal-accepted',{detail:{proposal:clone(updated),meal:clone(planned.mealRecord),shopping:clone(shopping)}}));}catch(e){}return{proposal:updated,meal:planned.mealRecord,shopping:shopping};});
        });
      }).catch(function(error){return releaseClaim(id,actor,error).then(function(){throw error;});});
    }).catch(function(error){if(error&&error.message==='PROPOSAL_STATE_CONFLICT')throw new Error('Dit voorstel wordt al door iemand afgehandeld');throw error;});
  }

  function list(){var r=repo();return r&&r.list?r.list():[];}
  function get(id){var r=repo();return r&&r.get?r.get(id):null;}
  function subscribe(fn){var r=repo();return r&&r.subscribe?r.subscribe(fn):function(){};}
  function status(){var r=repo();return Object.assign({version:VERSION},r&&r.status?r.status():{ready:false});}

  window.MealProposalService={version:VERSION,create:create,accept:accept,reject:reject,counter:counter,list:list,get:get,subscribe:subscribe,status:status,effectiveProposal:effectiveProposal};
})();
