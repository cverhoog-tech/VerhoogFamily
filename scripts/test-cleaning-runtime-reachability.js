#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLEANING_DIR = path.join(ROOT, 'src', 'modules', 'cleaning');
const NAVIGATION_FILE = path.join(ROOT, 'src', 'core', 'navigation.js');

const REQUIRED_CLEANING_FILES = [
  'cleaningActivePlanReconciler.js','cleaningActivityProjector.js','cleaningApprovalClarity.js','cleaningAvailabilityContract.js','cleaningAvailabilityExperience.js',
  'cleaningDerivedCleanup.js','cleaningDomain.js','cleaningExceptionContract.js','cleaningExceptionRuntime.js','cleaningExceptionTaskUi.js',
  'cleaningExecutionSync.js','cleaningExecutionUiGuard.js','cleaningExecutionWriteRuntime.js','cleaningExperienceBootstrap.js','cleaningHelpNotificationUi.js','cleaningHelpRequestUi.js',
  'cleaningHistoryExperience.js','cleaningHouseholdRepository.js','cleaningNotificationProjector.js','cleaningOverviewExperience.js','cleaningPauseAgendaProjection.js','cleaningPauseExperience.js',
  'cleaningPlanApprovalUi.js','cleaningPlanPersistenceContract.js','cleaningPlanSanitizer.js','cleaningPlannerContract.js','cleaningPreferencesUi.js',
  'cleaningProjectionService.js','cleaningQuickChoiceFeedback.js','cleaningRecurringPlanContract.js','cleaningRepositoryContract.js','cleaningRollingPlannerService.js',
  'cleaningRoomListControlsV2.js','cleaningRoomWorkflowUx.js','cleaningRoutineExperience.js','cleaningRoutineTemplates.js','cleaningShoppingCleanup.js',
  'cleaningSupplyDirectManager.js','cleaningSupplyExperience.js','cleaningTaskSupplyUi.js','cleaningWeekAssist.js'
];

const BOOTSTRAP_EXPECTED_ORDER = [
  'cleaningExceptionContract.js','cleaningExecutionSync.js','cleaningExecutionUiGuard.js','cleaningExecutionWriteRuntime.js',
  'cleaningExceptionRuntime.js','cleaningHelpNotificationUi.js','cleaningExceptionTaskUi.js','cleaningHelpRequestUi.js','cleaningAvailabilityContract.js',
  'cleaningAvailabilityExperience.js','cleaningHistoryExperience.js','cleaningActivityProjector.js','cleaningNotificationProjector.js','cleaningTaskSupplyUi.js'
];

let failed = false;
function fail(message){failed=true;console.error('FAIL: '+message);}
function readFile(filePath){return fs.readFileSync(filePath,'utf8');}
function extractRelativeImportSpecifiers(source){const out=[];const re=/import\s*(?:[^'";]*?from\s*)?['"](\.[^'"]+)['"]/g;let m;while((m=re.exec(source)))out.push(m[1]);return out;}
function stripQuery(specifier){const i=specifier.indexOf('?');return i>=0?specifier.slice(0,i):specifier;}
function resolveRelative(fromFile,specifier){return path.normalize(path.join(path.dirname(fromFile),stripQuery(specifier)));}
function walkImportGraph(entryFile){const visited=new Set(),queue=[entryFile];while(queue.length){const current=queue.shift();if(visited.has(current))continue;visited.add(current);if(!fs.existsSync(current))continue;extractRelativeImportSpecifiers(readFile(current)).forEach((specifier)=>{const resolved=resolveRelative(current,specifier);if(!visited.has(resolved))queue.push(resolved);});}return visited;}
function findCleaningScreenDynamicImportPath(source){const match=/import\(\s*['"]([^'"]*cleaningScreen\.js[^'"]*)['"]\s*\)/.exec(source);return match?match[1]:null;}

function main(){
  if(!fs.existsSync(NAVIGATION_FILE)){fail('src/core/navigation.js not found; cannot verify the real Cleaning entry point.');return;}
  const dynamicImportPath=findCleaningScreenDynamicImportPath(readFile(NAVIGATION_FILE));
  if(!dynamicImportPath){fail('navigation.js no longer dynamically imports cleaningScreen.js. Update this guard with any intentional entry-point move.');return;}
  const entryFile=path.join(ROOT,stripQuery(dynamicImportPath).replace(/^\//,''));
  if(!fs.existsSync(entryFile)){fail('The dynamically-imported Cleaning entry file does not exist: '+entryFile);return;}
  const reachable=walkImportGraph(entryFile),reachableCleaningFiles=new Set();
  reachable.forEach((filePath)=>{if(path.dirname(filePath)===CLEANING_DIR)reachableCleaningFiles.add(path.basename(filePath));});
  if(!reachableCleaningFiles.has('cleaningScreen.js'))fail('cleaningScreen.js itself was not resolved.');
  const missing=REQUIRED_CLEANING_FILES.filter((name)=>!reachableCleaningFiles.has(name));
  if(missing.length)fail('Functionally required Cleaning modules are unreachable from navigation.js -> cleaningScreen.js: '+missing.join(', '));

  const bootstrapFile=path.join(CLEANING_DIR,'cleaningExperienceBootstrap.js');
  if(!fs.existsSync(bootstrapFile)){fail('cleaningExperienceBootstrap.js is missing entirely.');}
  else{
    const names=extractRelativeImportSpecifiers(readFile(bootstrapFile)).map(stripQuery).map((specifier)=>path.basename(specifier));
    const actual=names.filter((name)=>BOOTSTRAP_EXPECTED_ORDER.indexOf(name)>=0);
    const matches=actual.length===BOOTSTRAP_EXPECTED_ORDER.length&&actual.every((name,index)=>name===BOOTSTRAP_EXPECTED_ORDER[index]);
    if(!matches)fail('Bootstrap dependency order changed. Expected: '+BOOTSTRAP_EXPECTED_ORDER.join(' -> ')+'. Found: '+actual.join(' -> ')+'.');
  }
  if(!failed)console.log('OK: all '+REQUIRED_CLEANING_FILES.length+' required Cleaning modules are reachable and bootstrap order is preserved.');
}
main();
if(failed){console.error('\nCleaning runtime reachability contract FAILED.');process.exitCode=1;}
