import './cleaningPlanApprovalUi.js?v=1';
import './cleaningRecurringPlanContract.js?v=1';
import './cleaningActivePlanReconciler.js?v=1';
import './cleaningProjectionService.js?v=2';

// ============================================================
// CLEANING ROUTINE TEMPLATES v0.1.3
// Static suggestions only. Once selected, a template becomes a
// normal CleaningRoutineItem and is fully editable by the household.
// Side-effect imports load recurring planning, approvals, active-plan
// reconciliation and Task/Calendar projections in a stable order.
// ============================================================

const PRESETS = Object.freeze({
  'living-room': Object.freeze([
    preset('living-vacuum','Stofzuigen',7,20,'NORMAL'),
    preset('living-dust','Afstoffen',7,15,'NORMAL'),
    preset('living-mop','Dweilen',14,20,'NORMAL'),
    preset('living-deep','Meubels en oppervlakken grondig reinigen',30,20,'EXTRA')
  ]),
  kitchen: Object.freeze([
    preset('kitchen-worktop','Werkblad en kookplaat reinigen',2,10,'NORMAL'),
    preset('kitchen-sink','Spoelbak en kraan schoonmaken',3,10,'NORMAL'),
    preset('kitchen-floor','Keukenvloer reinigen',7,15,'NORMAL'),
    preset('kitchen-fridge','Koelkast schoonmaken',30,25,'EXTRA'),
    preset('kitchen-oven','Oven grondig reinigen',30,30,'EXTRA')
  ]),
  bathroom: Object.freeze([
    preset('bathroom-shower','Douche en bad schoonmaken',7,15,'NORMAL'),
    preset('bathroom-sink','Wastafel en spiegel reinigen',7,10,'NORMAL'),
    preset('bathroom-toilet','Toilet reinigen',7,10,'NORMAL'),
    preset('bathroom-floor','Badkamervloer reinigen',7,10,'NORMAL'),
    preset('bathroom-descale','Kranen en douche ontkalken',30,20,'EXTRA')
  ]),
  toilet: Object.freeze([
    preset('toilet-bowl','Toilet grondig reinigen',3,10,'NORMAL'),
    preset('toilet-sink','Wastafel en kraan reinigen',7,5,'BASIC'),
    preset('toilet-floor','Vloer reinigen',7,10,'NORMAL')
  ]),
  bedroom: Object.freeze([
    preset('bedroom-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('bedroom-dust','Afstoffen',14,10,'NORMAL'),
    preset('bedroom-bedding','Beddengoed verschonen',14,15,'NORMAL'),
    preset('bedroom-deep','Kamer grondig reinigen',30,20,'EXTRA')
  ]),
  'kids-room': Object.freeze([
    preset('kids-tidy','Speelgoed en oppervlakken opruimen',2,10,'BASIC'),
    preset('kids-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('kids-dust','Afstoffen',14,10,'NORMAL'),
    preset('kids-deep','Speelgoed en meubels grondig reinigen',30,20,'EXTRA')
  ]),
  hall: Object.freeze([
    preset('hall-vacuum','Hal stofzuigen',7,10,'NORMAL'),
    preset('hall-mop','Hal dweilen',14,10,'NORMAL'),
    preset('hall-handles','Deuren en grepen reinigen',30,10,'EXTRA')
  ]),
  laundry: Object.freeze([
    preset('laundry-floor','Wasruimte vloer reinigen',14,10,'NORMAL'),
    preset('laundry-machines','Wasmachine en droger buitenkant reinigen',14,10,'NORMAL'),
    preset('laundry-deep','Wasruimte grondig reinigen',30,20,'EXTRA')
  ]),
  outdoor: Object.freeze([
    preset('outdoor-sweep','Balkon of terras vegen',14,20,'NORMAL'),
    preset('outdoor-rail','Reling en oppervlakken reinigen',30,20,'NORMAL'),
    preset('outdoor-deep','Buitenruimte grondig reinigen',60,30,'EXTRA')
  ]),
  custom: Object.freeze([
    preset('custom-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('custom-dust','Afstoffen',14,10,'NORMAL'),
    preset('custom-mop','Dweilen',14,15,'NORMAL')
  ])
});

function preset(key,title,intervalDays,estimatedMinutes,priority){
  return Object.freeze({
    key:key,
    title:title,
    intervalDays:intervalDays,
    estimatedMinutes:estimatedMinutes,
    priority:priority
  });
}

export function routineTemplatesForRoomType(roomType){
  const key = String(roomType || 'custom');
  return PRESETS[key] || PRESETS.custom;
}

export const CLEANING_ROUTINE_TEMPLATES_VERSION = '0.1.3';