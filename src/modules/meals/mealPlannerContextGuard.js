'use strict';
(function(){
  if(window.MealPlannerContextGuard)return;
  var VERSION='1.0.0',installed=false,originalOpen=null;
  function capture(){var c=window.HouseholdContext;if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function valid(t){return!!(t&&window.HouseholdContext&&window.HouseholdContext.isCurrent(t));}
  function changed(){var e=new Error('MEAL_PLAN_CONTEXT_CHANGED');e.code='MEAL_PLAN_CONTEXT_CHANGED';return e;}
  function install(){
    if(installed||!window.BottomSheet||typeof BottomSheet.open!=='function')return false;
    originalOpen=BottomSheet.open;
    BottomSheet.open=function(options){
      if(!options||options.title!=='📅 Maaltijd plannen')return originalOpen.apply(this,arguments);
      var t;try{t=capture();}catch(e){if(window.showToast)showToast('Maaltijdplanner niet beschikbaar');return null;}
      var next=Object.assign({},options);
      next.actions=(options.actions||[]).map(function(action){
        if(!action||typeof action.onClick!=='function')return action;
        var original=action.onClick;
        return Object.assign({},action,{onClick:function(ctx){
          if(!valid(t)){if(window.showToast)showToast('Gezin of account is gewijzigd');return false;}
          var result;try{result=original.apply(this,arguments);}catch(e){throw e;}
          if(result&&typeof result.then==='function')return result.then(function(v){if(!valid(t))throw changed();return v;});
          return result;
        }});
      });
      return originalOpen.call(this,next);
    };
    BottomSheet.open.__mealPlannerContextGuard=true;installed=true;return true;
  }
  function boot(){if(install())return;var n=0,t=setInterval(function(){n++;if(install()||n>120)clearInterval(t);},100);}
  window.MealPlannerContextGuard={version:VERSION,install:install,status:function(){return{installed:installed};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();