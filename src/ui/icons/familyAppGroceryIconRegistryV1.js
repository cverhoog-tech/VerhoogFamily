'use strict';
(function(){
  if(window.FamilyAppGroceryIconRegistryV1)return;
  var base=window.FamilyAppIconRegistry;
  if(!base||typeof base.get!=='function')return;

  var SPRITE='/src/ui/icons/assets/familyapp-grocery-special-icons.svg?v=1';
  var EXTRA=Object.freeze({
    utilitySpices:Object.freeze({symbol:'utility-spices',label:'Kruiden',tone:'utility-warm',sprite:SPRITE,family:'utility'}),
    utilitySauce:Object.freeze({symbol:'utility-sauce',label:'Sauzen',tone:'utility-red',sprite:SPRITE,family:'utility'}),
    utilityFryer:Object.freeze({symbol:'utility-fryer',label:'Frituur',tone:'utility-orange',sprite:SPRITE,family:'utility'})
  });

  function extra(key){
    var row=EXTRA[String(key||'')];
    return row?Object.freeze(Object.assign({key:String(key)},row)):null;
  }
  function get(key){return extra(key)||(base.get?base.get(key):null);}
  function resolve(key,variant){
    var row=extra(key);
    if(row)return row;
    return base.resolve?base.resolve(key,variant):(base.get?base.get(key):null);
  }
  function has(key){return !!EXTRA[String(key||'')]||(base.has?base.has(key):!!(base.get&&base.get(key)));}
  function keys(){
    var prior=base.keys?base.keys():[];
    return prior.concat(Object.keys(EXTRA).filter(function(key){return prior.indexOf(key)===-1;}));
  }

  window.FamilyAppIconRegistry={
    version:String(base.version||'')+'+grocery-v1',
    get:get,
    resolve:resolve,
    has:has,
    keys:keys
  };
  window.FamilyAppGroceryIconRegistryV1={version:'1.0.0',keys:Object.freeze(Object.keys(EXTRA))};
})();
