const fs=require('fs');
const assert=require('assert');
function read(p){return fs.readFileSync(p,'utf8');}

const shared=read('src/modules/feed/feedSharedData.js');
const interaction=read('src/modules/feed/feedInteractionController.js');
const activity=read('src/modules/feed/feedActivityPresentation.js');
const tagging=read('src/modules/feed/feedTagging.js');
const proposalRepo=read('src/modules/meals/mealProposalRepository.js');
const proposalSvc=read('src/modules/meals/mealProposalService.js');
const proposalUi=read('src/modules/meals/mealProposalUi.js');
const producers=read('src/platform/activity/activityDomainProducers.js');

// Manual/social Feed remains a separate mutable authority.
assert(shared.includes("COLLECTION='feedPosts'"),'manual posts must remain in feedPosts');
assert(shared.includes("type:'post'"),'manual post records must remain explicitly typed');
assert(shared.includes("'likes',me"),'likes must remain UID-scoped booleans, never counters');
assert(shared.includes("'comments',commentKey"),'comments must use unique record keys');

// Comment UI is single-flight and draft state is not stored in Firebase records.
assert(interaction.includes('submittingComments:Object.create(null)'),'comment submissions need an in-flight registry');
assert(interaction.includes('if(state.submittingComments[id])return'),'double comment submit must be blocked');
assert(interaction.includes('commentDrafts:Object.create(null)'),'comment drafts must remain transient');

// Immutable activity cards are presentation-only and never routed to social mutations.
assert(activity.includes("kind:'activity'"),'unified Feed must distinguish activity from post');
assert(activity.includes("if(item.kind==='activity')return card(item.value)"),'activity rows must use activity renderer');
assert(!activity.includes('toggleReaction('),'activity presentation must not mutate social reactions');
assert(!activity.includes('addComment('),'activity presentation must not mutate social comments');

// Structured references are deduped and manual-post rendering remains wrapped, not replaced.
assert(shared.includes('var seen={}'),'Feed reference normalization must dedupe references');
assert(tagging.includes('supplied.concat(current.filter'),'composer refs must merge without duplicate pending refs');
assert(tagging.includes('originalRenderPost'),'tag rendering must wrap the existing manual post renderer');

// Meal proposal acceptance is atomic and canonical.
assert(proposalRepo.includes('ref.transaction(function(current)'),'proposal state transition must be transactional');
assert(proposalRepo.includes('PROPOSAL_STATE_CONFLICT'),'proposal race conflicts must be explicit');
assert(proposalSvc.includes("transition(id,'pending',claimPatch)"),'accept must atomically claim pending proposal');
assert(proposalSvc.includes('MealPlanStore.replaceSlot(mealRecord)'),'accept must delegate to canonical MealPlanStore');
assert(proposalSvc.includes('ShoppingListStore.appendRecipeIngredients'),'shopping handoff must delegate to canonical ShoppingListStore');
assert(proposalSvc.includes("transition(id,'accepting',finalPatch)"),'proposal must finalize only after canonical writes');
assert(proposalSvc.includes('releaseClaim(id,actor,error)'),'failed canonical mutation must release the accepting claim');

// Proposal cards remain workflow UI, not fake social posts.
assert(proposalUi.includes('data-meal-proposal'),'proposal cards need their own identity');
assert(!proposalUi.includes('FeedSharedData.createPost'),'proposal UI must not create shadow social posts');
assert(!proposalUi.includes('FeedSharedData.addComment'),'proposal UI must not reuse comment mutation authority');

// Immutable activity producers keep deterministic occurrence identity.
assert(producers.includes('occurrenceKey:'),'activity producers must provide deterministic occurrence keys');
assert(producers.includes("occurrenceKey:'meal:'+id+':planned:'+version"),'meal planned event must remain deterministically keyed');

console.log('STEP 13.6 Feed interaction/idempotency contracts: OK');
