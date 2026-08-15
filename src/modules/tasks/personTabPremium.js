'use strict';
// ============================================================
// PERSOON TAB PREMIUM v4.2
// Pure renderer over PersonDashboardService. No name-based task lookups.
// ============================================================
(function(){
  if(window.__personTabPremiumV4) return;
  window.__personTabPremiumV4=true;

  var VERSION='4.2.0';
  var selectedUid=null