'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function read(relativePath){
  return fs.readFileSync(path.join(__dirname,'..',relativePath),'utf8');
}

(function(){
  const screen=read('src/modules/cleaning/cleaningScreen.js');
  const css=read('src/styles/cleaning.css');
  const plannerImport=screen.indexOf("import './cleaningPlannerContract.js?v=1';");
  const persistenceImport=screen.indexOf("import './cleaningPlanPersistenceContract.js?v=1';");
  const repositoryImport=screen.indexOf("import './cleaningHouseholdRepository.js?v=7';");

  assert.ok(plannerImport>-1&&persistenceImport>plannerImport&&repositoryImport>persistenceImport,'planner and persistence contracts load before the repository');
  assert.ok(screen.includes('bridge.subscribe((members) =>'),'Planning reacts to canonical household member updates');
  assert.ok(screen.includes('planner.generateConceptPlan({'),'the UI delegates calculation to the pure planner contract');
  assert.ok(screen.includes('repository.saveDraftPlan(concept)'),'the UI delegates persistence to the household repository');
  assert.ok(screen.includes('data-cleaning-plan-generate'),'Planning exposes one explicit concept generation action');
  assert.ok(screen.includes('plan.occurrenceIds.map((id) =>'),'rendering follows persisted plan-to-occurrence references');
  assert.ok(screen.includes('geen Taken- of Agenda-items aangemaakt'),'the concept boundary is visible to the household');
  assert.strictEqual(screen.includes('.ref('),false,'the Cleaning UI must never write Firebase directly');
  assert.strictEqual(screen.includes('localStorage'),false,'the Cleaning UI has no second local data authority');
  assert.strictEqual(screen.includes('createTask'),false,'concept generation creates no Task projection');
  assert.strictEqual(screen.includes('createCalendar'),false,'concept generation creates no Agenda projection');
  assert.ok(css.includes('#screen-cleaning .cleaning-plan-generate'),'Planning styles stay scoped to the Cleaning screen');
  assert.ok(/\.cleaning-plan-generate\s*\{[^}]*min-height:\s*48px;/s.test(css),'the primary Planning action is comfortably tappable');

  const window={
    CleaningPlanPersistenceContract:{planIdForWindow(){return 'week-test';}},
    HouseholdIdentityFirebaseBridge:{getMembers(){return[{uid:'member-a',displayName:'Shane',status:'active'}];}}
  };
  const executable=screen
    .replace(/^import .*;$/gm,'')
    .replace('export function renderCleaningScreen','function renderCleaningScreen')
    +'\nwindow.__planningUiTest={state:state,planningPanel:planningPanel};';
  const sandbox={window,document:{getElementById(){return null;}},Intl,Date,Object,String,Number,Array,Set,Math,JSON,Error};
  vm.createContext(sandbox);
  vm.runInContext(executable,sandbox,{filename:'cleaningScreen.js'});
  const ui=window.__planningUiTest;
  ui.state.repository={
    ready:true,
    error:null,
    data:{
      rooms:{bathroom:{name:'Badkamer',type:'bathroom',active:true}},
      routines:{sink:{roomId:'bathroom',title:'Wastafel',active:true,estimatedMinutes:10}},
      plans:{'week-test':{status:'DRAFT',occurrenceIds:['occurrence-test'],summary:{occurrenceCount:1,routineCount:1,totalEstimatedMinutes:10,imbalanceMinutes:10,memberLoads:[{uid:'member-a',estimatedMinutes:10,bundleCount:1}]}}},
      occurrences:{'occurrence-test':{planId:'week-test',status:'DRAFT',roomId:'bathroom',dueState:'DUE_IN_WINDOW',estimatedMinutes:10,assignmentUids:['member-a'],checklist:[{title:'Wastafel',estimatedMinutes:10}]}}
    }
  };
  const markup=ui.planningPanel();
  assert.ok(markup.includes('Conceptplan voor deze week'));
  assert.ok(markup.includes('Badkamer')&&markup.includes('Wastafel'),'the visible plan follows canonical occurrence content');
  assert.ok(markup.includes('Shane')&&markup.includes('10 min totaal'),'member assignment and total minutes render together');
  assert.ok(markup.includes('Opnieuw berekenen'),'an existing DRAFT remains explicitly regenerable');

  console.log('cleaning-planning-ui-contract: ok');
})();
