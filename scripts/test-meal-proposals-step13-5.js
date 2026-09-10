const fs=require('fs');
const assert=require('assert');
function read(p){return fs.readFileSync(p,'utf8');}
const repo=read('src/modules/meals/mealProposalRepository.js');
const service=read('src/modules/meals/mealProposalService.js');
const ui=read('src/modules/meals/mealProposalUi.js');
const producers=read('src/platform/activity/activityDomainProducers.js');
const loader=read('api/app.js');

assert(repo.includes("families/'+c.householdId+'/mealProposals"),'proposal repository must remain household scoped');
assert(repo.includes('ref.transaction(function(current)'),'proposal transitions must use Firebase transactions');
assert(repo.includes("PROPOSAL_STATE_CONFLICT"),'transaction conflicts must be explicit');
assert(service.includes("status:'accepting'"),'acceptance must claim pending proposal before domain writes');
assert(service.includes("transition(id,'pending',claimPatch)"),'acceptance claim must be atomic');
assert(service.includes('MealPlanStore.replaceSlot(mealRecord)'),'accepted proposal must use canonical meal planner');
assert(service.includes('ShoppingListStore.appendRecipeIngredients'),'ingredient handoff must use canonical shopping store');
assert(service.includes("transition(id,'accepting',finalPatch)"),'accepted state must finalize only after canonical writes');
assert(service.includes('releaseClaim(id,actor,error)'),'failed canonical writes must release accepting claim');
assert(producers.includes("occurrenceKey:'meal:'+id+':planned:'+version"),'meal activity must keep deterministic occurrence key');
assert(ui.includes('Afwijzen')&&ui.includes('Tegenvoorstel')&&ui.includes('Accepteren'),'feed card must expose all proposal actions');
assert(ui.includes('Ingrediënten ook naar de boodschappenlijst'),'acceptance UI must offer shopping handoff');
assert(ui.includes("className='mp-propose-recipe'"),'recipe detail must expose proposal entrypoint');
assert(loader.includes('mealProposalRepository.js?v=2'),'loader must serve race-safe repository');
assert(loader.includes('mealProposalService.js?v=2'),'loader must serve race-safe service');
assert(loader.includes('mealProposalUi.js?v=1'),'loader must serve proposal UI');
console.log('STEP 13.5 meal proposal contracts: OK');
