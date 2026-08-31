'use strict';
// ============================================================
// CLEANING DOMAIN CONTRACT v0.2.1
// Pure domain contract only: no Firebase, no localStorage, no DOM writes.
// Source of truth for one concrete clean remains CleaningOccurrence.
// Routine -> room relationship is canonical through routine.roomId only.
// Household identity is never rewritten for Firebase paths.
// ============================================================
(function(){
