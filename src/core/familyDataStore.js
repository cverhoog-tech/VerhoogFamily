'use strict';
// ============================================================
// FAMILY DATA STORE v1.5.0
// Firebase UID/household scoped persistence boundary.
// localStorage is cache/offline fallback, never household identity authority.
// ============================================================
(function(){
  if(window.FamilyDataStore)return;
  var VERSION='1.5.0',CACHE_PREFIX='familyapp_data_v1_',listeners={},subscriptions={};
  var SHARED={shoppingLists:'