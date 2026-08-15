'use strict';
// ============================================================
// PERSOON TAB PREMIUM v4.1
// Pure renderer over PersonDashboardService. No name-based task lookups.
// ============================================================
(function(){
  if(window.__personTabPremiumV4) return;
  window.__personTabPremiumV4=true;

  var VERSION='4.1.0',selectedUid=null,currentTarget=null,unsubscribe=null,serviceLoading=false;
  var