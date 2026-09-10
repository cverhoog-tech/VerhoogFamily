#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const CLEANING=path.join(ROOT,'src','modules','cleaning');
const navigation=fs.readFileSync(path.join(ROOT,'src','core','navigation.js'),'utf8');
let failed=false;
function fail(message){failed=true;console.error('FAIL: '+message);}
function imports(source){const out=[];const re=/import\s*(?:[^'";]*?from\s*)?['"](\.[^'"]+)['"]/g;let match;while((match=re.exec(source)))out.push(match[1]);return out;}
function strip(spec){return spec.split('?')[0];}
function walk(entry){const seen=new Set(),queue=[entry];while(queue.length){const file=queue.shift();if(seen.has(file)||!fs.existsSync(file))continue;seen.add(file);imports(fs.readFileSync(file,'utf8')).forEach(spec=>queue.push(path.normalize(path.join(path.dirname(file),strip(spec)))));}return seen;}
const dynamic=/import\(\s*['"]([^'"]*cleaningScreen\.js[^'"]*)['"]\s*\)/.exec(navigation);
if(!dynamic)fail('navigation.js must lazily import cleaningScreen.js');
else{
  const entry=path.join(ROOT,strip(dynamic[1]).replace(/^\//,'')),reached=walk(entry),names=[...reached].filter(file=>path.dirname(file)===CLEANING).map(file=>path.basename(file)).sort();
  const expected=['cleaningPlanPersistenceContract.js','cleaningPlannerContract.js','cleaningScreen.js'].sort();
  if(JSON.stringify(names)!==JSON.stringify(expected))fail('served Cleaning v2 graph must stay minimal. Expected '+expected.join(', ')+', found '+names.join(', '));
}
const screen=fs.readFileSync(path.join(CLEANING,'cleaningScreen.js'),'utf8');
const premium=fs.readFileSync(path.join(CLEANING,'cleaningPremiumFeedback.js'),'utf8');
const inbox=fs.readFileSync(path.join(ROOT,'src','platform','inbox','actionInboxBootstrap.js'),'utf8');
if(/new\s+MutationObserver|MutationObserver\s*\(|TaskDetailPopup|TaskSharedData|CleaningExecutionWriteRuntime|CleaningProjectionService/.test(screen))fail('served v2 graph regained a legacy freeze-prone owner');
if(!/disabledForCleaningV2:true/.test(premium)||/new\s+MutationObserver|MutationObserver\s*\(|addEventListener\s*\(/.test(premium))fail('premium compatibility import must stay inert');
if(/modules\/cleaning|cleaningHouseholdRepository|cleaningRoutineExperience|cleaningHelpRequestUi|cleaningPermissions/.test(inbox))fail('app startup must not eagerly load Cleaning');
if(!failed)console.log('Cleaning v2 minimal served runtime reachability: PASS');
else process.exitCode=1;
