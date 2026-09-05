#!/usr/bin/env node
'use strict';
// ============================================================
// CONTRACT TEST: Cleaning runtime reachability (P0 wiring recovery guard)
//
// Statically proves that, starting from the real app entry point
// (navigation.js's dynamic import of cleaningScreen.js), every file in
// src/modules/cleaning/ listed below as functionally required is actually
// reachable through the real ES-module import graph -- not merely present
// on disk.
//
// This is the regression guard for the 05-09-2026 P0 runtime-wiring audit,
// which found seven files (the Task-Detail-Popup-scoped exception/
// execution/task-supply family) sitting in the same folder as every other
// Cleaning module but never imported by anything reachable from the real
// entry. A file existing under src/modules/cleaning/ is not sufficient
// evidence that it runs; only an actual import chain from navigation.js is.
//
// This test intentionally does NOT just grep cleaningExperienceBootstrap.js
// for a filename string. It walks the real static `import './x.js'`
// declarations (and the one dynamic `import('/path.js')` at the true entry)
// file by file, the same way a browser's module loader would, and only
// then checks whether each required file turned up in that walk.
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLEANING_DIR = path.join(ROOT, 'src', 'modules', 'cleaning');
const NAVIGATION_FILE = path.join(ROOT, 'src', 'core', 'navigation.js');

// Every file that must be reachable from the real entry. Keep this list in
// sync with src/modules/cleaning/: a file that exists on disk but is not
// listed here is assumed intentionally excluded (e.g. genuinely unfinished
// work); a file listed here that becomes unreachable fails this test.
const REQUIRED_CLEANING_FILES = [
  'cleaningActivePlanReconciler.js',
  'cleaningApprovalClarity.js',
  'cleaningDerivedCleanup.js',
  'cleaningDomain.js',
  'cleaningExceptionContract.js',
  'cleaningExceptionRuntime.js',
  'cleaningExceptionTaskUi.js',
  'cleaningExecutionSync.js',
  'cleaningExecutionUiGuard.js',
  'cleaningExecutionWriteRuntime.js',
  'cleaningExperienceBootstrap.js',
  'cleaningHouseholdRepository.js',
  'cleaningOverviewExperience.js',
  'cleaningPauseAgendaProjection.js',
  'cleaningPauseExperience.js',
  'cleaningPlanApprovalUi.js',
  'cleaningPlanPersistenceContract.js',
  'cleaningPlanSanitizer.js',
  'cleaningPlannerContract.js',
  'cleaningProjectionService.js',
  'cleaningQuickChoiceFeedback.js',
  'cleaningRecurringPlanContract.js',
  'cleaningRepositoryContract.js',
  'cleaningRollingPlannerService.js',
  'cleaningRoomListControlsV2.js',
  'cleaningRoomWorkflowUx.js',
  'cleaningRoutineExperience.js',
  'cleaningRoutineTemplates.js',
  'cleaningShoppingCleanup.js',
  'cleaningSupplyDirectManager.js',
  'cleaningSupplyExperience.js',
  'cleaningTaskSupplyUi.js',
  'cleaningWeekAssist.js'
  // cleaningScreen.js is the entry file itself; asserted separately below.
];

// The exact dependency order established by the 05-09-2026 audit for the
// Task-Detail-Popup-scoped family. See cleaningExperienceBootstrap.js for
// the full rationale for each ordering constraint.
const BOOTSTRAP_EXPECTED_ORDER = [
  'cleaningExceptionContract.js',
  'cleaningExecutionSync.js',
  'cleaningExecutionUiGuard.js',
  'cleaningExecutionWriteRuntime.js',
  'cleaningExceptionRuntime.js',
  'cleaningExceptionTaskUi.js',
  'cleaningTaskSupplyUi.js'
];

let failed = false;

function fail(message) {
  failed = true;
  console.error('FAIL: ' + message);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Matches both side-effect imports (import './x.js';) and named/default
// imports (import { foo } from './x.js';), but only relative specifiers
// (starting with '.'), which is the only import style used in this
// codebase's Cleaning module. Absolute site paths used by the one dynamic
// import() at the real entry are handled separately below.
function extractRelativeImportSpecifiers(source) {
  const specifiers = [];
  const importRegex = /import\s*(?:[^'";]*?from\s*)?['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(source))) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function stripQuery(specifier) {
  const queryIndex = specifier.indexOf('?');
  return queryIndex >= 0 ? specifier.slice(0, queryIndex) : specifier;
}

function resolveRelative(fromFile, specifier) {
  return path.normalize(path.join(path.dirname(fromFile), stripQuery(specifier)));
}

function walkImportGraph(entryFile) {
  const visited = new Set();
  const queue = [entryFile];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    if (!fs.existsSync(current)) continue;
    const source = readFile(current);
    extractRelativeImportSpecifiers(source).forEach((specifier) => {
      const resolved = resolveRelative(current, specifier);
      if (!visited.has(resolved)) queue.push(resolved);
    });
  }
  return visited;
}

function findCleaningScreenDynamicImportPath(navigationSource) {
  const dynamicImportRegex = /import\(\s*['"]([^'"]*cleaningScreen\.js[^'"]*)['"]\s*\)/;
  const match = dynamicImportRegex.exec(navigationSource);
  return match ? match[1] : null;
}

function main() {
  if (!fs.existsSync(NAVIGATION_FILE)) {
    fail('src/core/navigation.js not found; cannot verify the real Cleaning entry point.');
    return;
  }

  const navigationSource = readFile(NAVIGATION_FILE);
  const dynamicImportPath = findCleaningScreenDynamicImportPath(navigationSource);
  if (!dynamicImportPath) {
    fail(
      'navigation.js no longer dynamically imports cleaningScreen.js. ' +
      'The real Cleaning entry point may have moved; update this contract test alongside that code change ' +
      'rather than deleting it.'
    );
    return;
  }

  // The dynamic import path is written as an absolute site path
  // ('/src/modules/cleaning/cleaningScreen.js?v=1'), matching how the
  // browser actually requests it. Resolve it against the repo root the
  // same way.
  const cleanedDynamicPath = stripQuery(dynamicImportPath).replace(/^\//, '');
  const entryFile = path.join(ROOT, cleanedDynamicPath);
  if (!fs.existsSync(entryFile)) {
    fail('The dynamically-imported Cleaning entry file does not exist on disk: ' + cleanedDynamicPath);
    return;
  }

  const reachable = walkImportGraph(entryFile);
  const reachableCleaningFiles = new Set();
  reachable.forEach((filePath) => {
    if (path.dirname(filePath) === CLEANING_DIR) {
      reachableCleaningFiles.add(path.basename(filePath));
    }
  });

  if (!reachableCleaningFiles.has('cleaningScreen.js')) {
    fail('cleaningScreen.js itself was not resolved while walking its own import graph; the walker or the entry path is broken.');
  }

  const missing = REQUIRED_CLEANING_FILES.filter((name) => !reachableCleaningFiles.has(name));
  if (missing.length) {
    fail(
      'The following functionally required Cleaning modules are NOT reachable from the real app entry ' +
      '(navigation.js -> dynamic import -> cleaningScreen.js -> static imports): ' + missing.join(', ') + '. ' +
      'Existing on disk under src/modules/cleaning/ is not sufficient; each module must be reachable through ' +
      'an actual import chain starting at the real entry point.'
    );
  }

  // Guard against exactly the failure mode found in the 05-09-2026 audit:
  // the bootstrap file must itself exist and must import all seven
  // Task-Detail-Popup-scoped files in the documented dependency order.
  const bootstrapFile = path.join(CLEANING_DIR, 'cleaningExperienceBootstrap.js');
  if (fs.existsSync(bootstrapFile)) {
    const bootstrapSource = readFile(bootstrapFile);
    const bootstrapImportedNames = extractRelativeImportSpecifiers(bootstrapSource)
      .map(stripQuery)
      .map((specifier) => path.basename(specifier));
    const actualOrder = bootstrapImportedNames.filter((name) => BOOTSTRAP_EXPECTED_ORDER.indexOf(name) >= 0);
    const orderMatches =
      actualOrder.length === BOOTSTRAP_EXPECTED_ORDER.length &&
      actualOrder.every((name, index) => name === BOOTSTRAP_EXPECTED_ORDER[index]);
    if (!orderMatches) {
      fail(
        'cleaningExperienceBootstrap.js no longer imports the exception/execution/task-supply family in the ' +
        'documented dependency order. Expected: ' + BOOTSTRAP_EXPECTED_ORDER.join(' -> ') + '. ' +
        'Found: ' + actualOrder.join(' -> ') + '.'
      );
    }
  } else {
    fail('cleaningExperienceBootstrap.js is missing entirely.');
  }

  if (!failed) {
    console.log(
      'OK: all ' + REQUIRED_CLEANING_FILES.length + ' required Cleaning modules are reachable from the real ' +
      'app entry, and cleaningExperienceBootstrap.js preserves its documented dependency order.'
    );
  }
}

main();

if (failed) {
  console.error('\nCleaning runtime reachability contract FAILED.');
  process.exitCode = 1;
}
