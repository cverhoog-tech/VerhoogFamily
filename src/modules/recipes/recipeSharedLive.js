'use strict';
// ============================================================
// RECIPE STORE + SHARED LIVE v2.1
// Shared household recipes via FamilyDataStore.
// Record-level writes prevent unrelated recipes overwriting each other.
// Large inline image payloads are rejected until persistent image storage exists.
// ============================================================
(function(){
  if(window.RecipeStore && window.RecipeStore.version === '2.1.0') return;

  var VERSION='2.1.0', COLLECTION='recipes', LEGACY_KEY='fam_recipes_v1', SEED_KEY='fam_recipes_seeded_v1';
  var MAX_INLINE_PHOTO_CHARS=180000;
  var state={attached:false,ready:false,items:{},unsubscribe:null,booting:null,listeners:[]};

  function now(){return Date.now();}
  function ds(){return window.FamilyDataStore||null;}
  function userId(){try{return ds()&&ds().status().userId||null;}catch(e){return null;}}
  function familyId(){try{return ds()&&ds().status().familyId||window.fbFamilyId||null;}catch(e){return window.fbFamilyId||null;}}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function keyFor(id){return 'id_'+String(id||'').replace(/[.#$\[\]\/]/g,'_');}
  function newId(){var s=ds();return s&&s.makeId?s.makeId('recipe'):('recipe_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,7));}
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
      return {id:String(value.id||('ing_'+index)),name:String(value.name||raw).trim(),quantity:String(value.quantity||'').trim(),unit:String(value.unit||'').trim(),rawText:raw||String(value.name||'').trim()};
    }
    var text=String(value||'').trim();
    return {id:'ing_'+index,name:text,quantity:'',unit:'',rawText:text};
  }
  function normalizeRecipe(input,existing){
    input=input||{};existing=existing||{};
    var id=String(input.id||existing.id||newId());
    var cat=String(input.cat||existing.cat||'Diner');
    var ingredients=Array.isArray(input.ingredients)?input.ingredients:(Array.isArray(existing.ingredients)?existing.ingredients:[]);
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
      createdAt:existing.createdAt||input.createdAt||now(),
      createdBy:existing.createdBy||input.createdBy||userId(),
      updatedAt:now(),
      updatedBy:userId()
    };
  }
  function list(){return Object.keys(state.items).map(function(k){return state.items[k];}).filter(Boolean).sort(function(a,b){return (b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0);});}
  function get(id){var wanted=String(id||''),keys=Object.keys(state.items);for(var i=0;i<keys.length;i++){var r=state.items[keys[i]];if(r&&String(r.id)===wanted)return r;}return null;}
  function fromPayload(value){
    var raw=value&&value.items&&typeof value.items==='object'?value.items:{};var out={};
    Object.keys(raw).forEach(function(k){var r=raw[k];if(!r)return;try{var n=normalizeRecipe(r,r);n.updatedAt=r.updatedAt||n.updatedAt;out[keyFor(n.id)]=n;}catch(e){console.warn('[RecipeStore] skipped oversized legacy inline photo for recipe',r&&r.id,e&&e.code);var safe=Object.assign({},r,{photo:null,imageMode:'preset'});var n2=normalizeRecipe(safe,safe);n2.updatedAt=r.updatedAt||n2.updatedAt;out[keyFor(n2.id)]=n2;}});
    return out;
  }
  function cache(){var rows=list();window.recipesData=rows;try{localStorage.setItem(LEGACY_KEY,JSON.stringify(rows));localStorage.setItem(SEED_KEY,'1');}catch(e){}return rows;}
  function render(){var screen=document.getElementById('screen-recipes');if(!screen)return;var active=screen.classList.contains('active')||screen.style.display==='block'||screen.offsetParent!==null;if(active&&typeof window.renderRecipes==='function')try{window.renderRecipes();}catch(e){}}
  function emit(meta){var rows=cache();state.listeners.slice().forEach(function(fn){try{fn(rows,meta||{});}catch(e){}});try{window.dispatchEvent(new CustomEvent('familyapp:recipes-synced',{detail:{familyId:familyId(),recipes:rows.slice(),meta:meta||{}}}));}catch(e){}render();}
  function subscribe(cb){if(typeof cb!=='function')return function(){};state.listeners.push(cb);try{cb(list(),{source:'current'});}catch(e){}return function(){state.listeners=state.listeners.filter(function(fn){return fn!==cb;});};}

  function legacyLocal(){try{var raw=localStorage.getItem(LEGACY_KEY),parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch(e){return[];}}
  function legacyFirebase(){
    try{var db=window.fbDb||(window.firebase&&firebase.database&&firebase.database()),fid=familyId();if(!db||!fid)return Promise.resolve([]);return db.ref('families/'+fid+'/recipes').once('value').then(function(s){var raw=s.val();if(!raw)return[];if(Array.isArray(raw))return raw.filter(Boolean);if(raw.items&&typeof raw.items==='object')return Object.keys(raw.items).map(function(k){return raw.items[k];}).filter(Boolean);if(typeof raw==='object')return Object.keys(raw).map(function(k){return raw[k];}).filter(function(v){return v&&typeof v==='object';});return[];}).catch(function(){return[];});}catch(e){return Promise.resolve([]);}
  }
  function initialPayload(recipes,source){var items={};(recipes||[]).forEach(function(r){try{var n=normalizeRecipe(r,r);items[keyFor(n.id)]=n;}catch(e){var safe=Object.assign({},r,{photo:null,imageMode:'preset'});var n2=normalizeRecipe(safe,safe);items[keyFor(n2.id)]=n2;}});return{schemaVersion:2,initialized:true,items:items,migratedAt:now(),migratedFrom:source,updatedAt:now(),updatedBy:userId()};}
  function ensureInitialized(existing){
    var s=ds();if(existing&&existing.initialized)return Promise.resolve(existing);
    if(Array.isArray(existing)&&existing.length){var a=initialPayload(existing,'shared-recipes-array');return s.writeShared(COLLECTION,a).then(function(){return a;});}
    return legacyFirebase().then(function(remote){var local=legacyLocal(),seed=remote.length?remote:local,src=remote.length?'families/{householdId}/recipes':(local.length?LEGACY_KEY:'empty');var p=initialPayload(seed,src);return s.writeShared(COLLECTION,p).then(function(){return p;});});
  }
  function attach(){
    var s=ds();if(!s||state.attached||!familyId()||!userId())return false;state.attached=true;
    state.unsubscribe=s.subscribeShared(COLLECTION,function(value,meta){if(!value||!value.initialized)return;state.items=fromPayload(value);state.ready=true;emit(meta||{source:'firebase'});},{schemaVersion:2,initialized:true,items:{}});return true;
  }
  function boot(){
    if(state.booting)return state.booting;var s=ds();if(!s||!familyId()||!userId())return Promise.resolve(status());
    state.booting=s.readShared(COLLECTION,null).then(ensureInitialized).then(function(value){state.items=fromPayload(value);state.ready=true;emit({source:'boot'});attach();return status();}).catch(function(err){console.error('[RecipeStore] boot failed',err);return status();}).then(function(v){state.booting=null;return v;});return state.booting;
  }
  function create(input){var s=ds();if(!s)return Promise.reject(new Error('FamilyDataStore unavailable'));var r;try{r=normalizeRecipe(input||{},null);}catch(e){return Promise.reject(e);}if(!r.name)return Promise.reject(new Error('Recipe name required'));var k=keyFor(r.id);return s.writeSharedPath(COLLECTION,['items',k],r).then(function(result){state.items[k]=r;emit({source:'create'});return{recipe:clone(r),result:result};});}
  function upsert(input){var old=get(input&&input.id);if(!old)return create(input);var s=ds(),r;try{r=normalizeRecipe(input,old);}catch(e){return Promise.reject(e);}var k=keyFor(r.id);return s.writeSharedPath(COLLECTION,['items',k],r).then(function(result){state.items[k]=r;emit({source:'upsert'});return{recipe:clone(r),result:result};});}
  function remove(id){var s=ds(),old=get(id);if(!s)return Promise.reject(new Error('FamilyDataStore unavailable'));if(!old)return Promise.resolve({removed:false});var k=keyFor(old.id);return s.writeSharedPath(COLLECTION,['items',k],null).then(function(result){delete state.items[k];emit({source:'remove'});return{removed:true,recipe:clone(old),result:result};});}
  function status(){return{version:VERSION,ready:state.ready,attached:state.attached,count:list().length,familyId:familyId(),userId:userId(),maxInlinePhotoChars:MAX_INLINE_PHOTO_CHARS};}

  window.RecipeStore={version:VERSION,boot:boot,ready:function(){return state.ready;},list:list,get:get,subscribe:subscribe,create:create,upsert:upsert,remove:remove,normalizeRecipe:normalizeRecipe,status:status};
  window.RecipeSharedLive={version:VERSION,sync:boot,save:function(){return Promise.resolve({deprecated:true,reason:'Use RecipeStore record-level mutations'});},status:status};

  function start(){var tries=0,t=setInterval(function(){tries++;if(ds()&&familyId()&&userId()){clearInterval(t);boot();}else if(tries>240)clearInterval(t);},250);boot();}
  window.addEventListener('online',boot);window.addEventListener('focus',boot);window.addEventListener('familyapp:household-members-updated',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
