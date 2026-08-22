'use strict';
// ============================================================
// RECIPE STORE COMPATIBILITY FACADE v3.0.0
// STEP 4: RecipeHouseholdRepository is the only recipe persistence/listener owner.
//
// Existing recipe UI keeps using window.RecipeStore, but every read/write now
// flows through the canonical UID + HouseholdContext repository boundary.
// No generic shared-store listener and no unscoped legacy recipe-cache authority.
// ============================================================
(function(){
  if(window.RecipeStore&&window.RecipeStore.version==='3.0.0')return;

  var VERSION='3.0.0';
  var MAX_INLINE_PHOTO_CHARS=180000;
  var projectionUnsubscribe=null;
  var startTimer=null;
  var listeners=[];
  var projection=[];
  var lastMeta={source:'idle',ready:false};

  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.RecipeHouseholdRepository||window.RecipeRepository||null;}
  function ctx(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function userId(){var c=ctx();return c&&c.uid||null;}
  function householdId(){var c=ctx();return c&&c.householdId||null;}
  function newId(){return 'recipe_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function isInlinePhoto(v){return typeof v==='string'&&/^data:image\//i.test(v);}
  function validatePhoto(v){
    if(v==null||v==='')return null;
    var text=String(v);
    if(isInlinePhoto(text)&&text.length>MAX_INLINE_PHOTO_CHARS){
      var err=new Error('Recipe photo is too large for inline storage');
      err.code='RECIPE_PHOTO_TOO_LARGE';
      throw err;
    }
    return text;
  }
  function normalizeIngredient(value,index){
    if(value&&typeof value==='object'){
      var raw=String(value.rawText||value.text||value.name||'').trim();
      return {
        id:String(value.id||('ing_'+index)),
        name:String(value.name||raw).trim(),
        quantity:String(value.quantity||'').trim(),
        unit:String(value.unit||'').trim(),
        rawText:raw||String(value.name||'').trim()
      };
    }
    var text=String(value||'').trim();
    return {id:'ing_'+index,name:text,quantity:'',unit:'',rawText:text};
  }
  function normalizeRecipe(input,existing){
    input=input||{};existing=existing||{};
    var id=String(input.id||existing.id||newId());
    var cat=String(input.cat||existing.cat||'Diner');
    var ingredients=Array.isArray(input.ingredients)?input.ingredients:(Array.isArray(existing.ingredients)?existing.ingredients:[]);
    var actor=userId();
    return {
      id:id,
      name:String(input.name!=null?input.name:(existing.name||'')).trim(),
      cat:cat,
      cuisine:String(input.cuisine!=null?input.cuisine:(existing.cuisine||'')).trim(),
      persons:Math.max(1,parseInt(input.persons!=null?input.persons:existing.persons,10)||4),
      time:Math.max(0,parseInt(input.time!=null?input.time:existing.time,10)||0),
      emoji:String(input.emoji||existing.emoji||''),
      photo:input.photo!==undefined?validatePhoto(input.photo||null):validatePhoto(existing.photo||null),
      imageMode:String(input.imageMode||existing.imageMode||(input.photo||existing.photo?'custom':'preset')),
      heroPreset:String(input.heroPreset||existing.heroPreset||cat.toLowerCase()),
      ingredients:ingredients.map(normalizeIngredient).filter(function(x){return x.rawText||x.name;}),
      steps:(Array.isArray(input.steps)?input.steps:(existing.steps||[])).map(function(x){return String(x||'').trim();}).filter(Boolean),
      notes:String(input.notes!=null?input.notes:(existing.notes||'')).trim(),
      sourceProvider:String(input.sourceProvider||existing.sourceProvider||'manual'),
      sourceUrl:String(input.sourceUrl||existing.sourceUrl||''),
      createdAt:Number(existing.createdAt||input.createdAt)||now(),
      createdByUid:existing.createdByUid||input.createdByUid||existing.createdBy||input.createdBy||actor,
      createdBy:existing.createdBy||input.createdBy||existing.createdByUid||input.createdByUid||actor,
      updatedAt:Number(input.updatedAt||existing.updatedAt)||now(),
      updatedByUid:input.updatedByUid||existing.updatedByUid||input.updatedBy||existing.updatedBy||actor,
      updatedBy:input.updatedBy||existing.updatedBy||input.updatedByUid||existing.updatedByUid||actor,
      householdId:existing.householdId||input.householdId||householdId(),
      schemaVersion:Number(existing.schemaVersion||input.schemaVersion)||3
    };
  }
  function currentList(){
    var r=repo();
    if(r&&typeof r.list==='function')return r.list();
    return projection.map(clone);
  }
  function get(id){
    var r=repo();
    if(r&&typeof r.get==='function')return r.get(id);
    var wanted=String(id||'');
    return projection.find(function(row){return String(row&&row.id)===wanted||String(row&&row._key)===wanted;})||null;
  }
  function renderIfVisible(){
    var screen=document.getElementById('screen-recipes');
    if(!screen)return;
    var active=screen.classList.contains('active')||screen.style.display==='block'||screen.offsetParent!==null;
    if(active&&typeof window.renderRecipes==='function')try{window.renderRecipes();}catch(e){}
  }
  function publishProjection(rows,meta){
    projection=Array.isArray(rows)?rows.map(clone):[];
    lastMeta=clone(meta||{})||{};
    window.recipesData=projection.map(clone);
    listeners.slice().forEach(function(fn){try{fn(projection.map(clone),clone(lastMeta));}catch(e){console.warn('[RecipeStore] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:recipes-synced',{detail:{householdId:lastMeta.householdId||householdId(),recipes:projection.map(clone),meta:clone(lastMeta)}}));}catch(e){}
    renderIfVisible();
  }
  function subscribe(cb){
    if(typeof cb!=='function')return function(){};
    listeners.push(cb);
    try{cb(currentList(),clone(lastMeta));}catch(e){}
    return function(){var i=listeners.indexOf(cb);if(i>=0)listeners.splice(i,1);};
  }
  function ready(){var r=repo(),s=r&&typeof r.status==='function'?r.status():null;return !!(s&&s.ready);}

  function create(input){
    var r=repo();
    if(!r||typeof r.create!=='function')return Promise.reject(new Error('Recipe repository is not ready'));
    var recipe;
    try{recipe=normalizeRecipe(input||{},null);}catch(e){return Promise.reject(e);}
    if(!recipe.name)return Promise.reject(new Error('Recipe name required'));
    recipe.updatedAt=now();recipe.updatedByUid=userId();recipe.updatedBy=userId();
    return r.create(recipe).then(function(saved){return{recipe:clone(saved),result:{mode:'firebase',source:'recipe-household-repository'}};});
  }
  function upsert(input){
    var old=get(input&&input.id);
    if(!old)return create(input);
    var r=repo();
    if(!r||typeof r.updateOne!=='function')return Promise.reject(new Error('Recipe repository is not ready'));
    var recipe;
    try{recipe=normalizeRecipe(input,old);}catch(e){return Promise.reject(e);}
    if(!recipe.name)return Promise.reject(new Error('Recipe name required'));
    recipe.updatedAt=now();recipe.updatedByUid=userId();recipe.updatedBy=userId();
    return r.updateOne(old.id,recipe).then(function(saved){return{recipe:clone(saved),result:{mode:'firebase',source:'recipe-household-repository'}};});
  }
  function remove(id){
    var old=get(id),r=repo();
    if(!r||typeof r.remove!=='function')return Promise.reject(new Error('Recipe repository is not ready'));
    if(!old)return Promise.resolve({removed:false});
    return r.remove(old.id).then(function(result){return{removed:true,recipe:clone(old),result:{mode:'firebase',source:'recipe-household-repository',value:result}};});
  }

  function start(){
    var r=repo();
    if(!r||typeof r.subscribe!=='function'){
      if(!startTimer){
        var tries=0;
        startTimer=setInterval(function(){tries++;if(start()||tries>200){clearInterval(startTimer);startTimer=null;}},50);
      }
      return false;
    }
    if(typeof r.start==='function')r.start();
    if(!projectionUnsubscribe)projectionUnsubscribe=r.subscribe(publishProjection);
    return true;
  }
  function stop(){
    if(startTimer){clearInterval(startTimer);startTimer=null;}
    if(projectionUnsubscribe){try{projectionUnsubscribe();}catch(e){}projectionUnsubscribe=null;}
    projection=[];window.recipesData=[];
  }
  function boot(){start();return Promise.resolve(status());}
  function status(){
    var r=repo(),base=r&&typeof r.status==='function'?r.status():{};
    return Object.assign({version:VERSION,ready:ready(),count:currentList().length,maxInlinePhotoChars:MAX_INLINE_PHOTO_CHARS},base);
  }

  window.RecipeStore={
    version:VERSION,
    boot:boot,
    start:start,
    stop:stop,
    ready:ready,
    list:currentList,
    get:get,
    subscribe:subscribe,
    create:create,
    upsert:upsert,
    remove:remove,
    normalizeRecipe:normalizeRecipe,
    status:status
  };
  window.RecipeSharedLive={
    version:VERSION,
    sync:boot,
    save:function(){return Promise.resolve({deprecated:true,reason:'Use RecipeStore record-level mutations'});},
    status:status
  };

  window.addEventListener('familyapp:household-context',start);
  window.addEventListener('familyapp:session-state',start);
  window.addEventListener('load',function(){start();},{once:true});
  start();
})();
