'use strict';
// ============================================================
// FAMILYAPP DATA CONTRACT v1.1
// Canonical collection names + scoped path builders.
// ============================================================
(function(){
  if(window.FamilyDataContract) return;

  var SHARED=Object.freeze({
    tasks:'tasks',
    partyQuests:'partyQuests',
    shoppingLists:'shoppingLists',
    recipes:'recipes',
    mealPlans:'mealPlans',
    calendar:'calendar',
    finance:'finance',
    feed:'feed',
    notifications:'notifications',
    achievements:'achievements',
    activity:'activity',
    notes:'notes'
  });
  var PRIVATE=Object.freeze({
    preferences:'preferences',
    progression:'progression',
    notificationSettings:'notificationSettings',
    drafts:'drafts',
    shoppingLists:'shoppingLists',
    notes:'notes'
  });

  function ctx(){
    if(!window.HouseholdContext) throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');
    return window.HouseholdContext;
  }
  function assertCollection(map,name,scope){
    if(!name||!Object.prototype.hasOwnProperty.call(map,name)){
      var e=new Error('UNKNOWN_'+scope.toUpperCase()+'_COLLECTION');
      e.code='UNKNOWN_'+scope.toUpperCase()+'_COLLECTION';
      throw e;
    }
    return map[name];
  }
  function shared(name){
    var collection=assertCollection(SHARED,name,'shared');
    return {scope:'shared',key:name,collection:collection,path:ctx().sharedPath(collection)};
  }
  function privateCollection(name){
    var collection=assertCollection(PRIVATE,name,'private');
    return {scope:'private',key:name,collection:collection,path:ctx().privatePath(collection)};
  }
  function sharedRecord(name,id){
    if(id===undefined||id===null||id==='') throw new Error('RECORD_ID_REQUIRED');
    var base=shared(name);return Object.assign({},base,{id:String(id),path:base.path+'/'+String(id)});
  }
  function privateRecord(name,id){
    if(id===undefined||id===null||id==='') throw new Error('RECORD_ID_REQUIRED');
    var base=privateCollection(name);return Object.assign({},base,{id:String(id),path:base.path+'/'+String(id)});
  }

  window.FamilyDataContract={
    version:'1.1.0',
    sharedCollections:SHARED,
    privateCollections:PRIVATE,
    shared:shared,
    private:privateCollection,
    sharedRecord:sharedRecord,
    privateRecord:privateRecord
  };
})();
