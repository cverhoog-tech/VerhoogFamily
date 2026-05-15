'use strict';
// ============================================================
// APP MODULES v0.321
// Stable bootstrap modules only.
// ============================================================

(function(){
  var VERSION = '0.321';
  var loaded = {};
  var failed = {};
  var booting = false;
  var booted = false;

  var registry = [
    { id: 'mobile-viewport-lock-js', src: 'src/core/mobileViewportLock.js', group: 'core', critical: false },
    { id: 'live-sync-adapter-js', src: 'src/core/liveSyncAdapter.js', group: 'core', critical: false },
    { id: 'household-identity-js', src: 'src/core/householdIdentity.js', group: 'core', critical: false },
    { id: 'reactive-household-state-js', src: 'src/core/reactiveHouseholdState.js', group: 'core', critical: false },
    { id: 'quest-engine-js', src: 'src/core/questEngine.js', group: 'quests', critical: false },
    { id: 'quest-adapter-js', src: 'src/core/questAdapter.js', group: 'quests', critical: false },
    { id: 'epic-hero-backgrounds-js', src: 'src/core/epicHeroBackgrounds.js', group: 'rendering', critical: false },
    { id: 'quest-renderer-js', src: 'src/core/questRenderer.js', group: 'rendering', critical: false },

    // Tasks
    { id: 'task-nav-native-css-js', src: 'src/modules/tasks/taskNavNativeCss.js', group: 'tasks', critical: false },
    { id: 'quest-renderer-preview-js', src: 'src/modules/tasks/questRendererPreview.js', group: 'tasks', critical: false },
    { id: 'group-quest-premium-js', src: 'src/modules/tasks/groupQuestPremium.js', group: 'tasks', critical: false },
    { id: 'group-quest-layout-fix-js', src: 'src/modules/tasks/groupQuestLayoutFix.js', group: 'tasks', critical: false },
    { id: 'raid-card-polish-js', src: 'src/modules/tasks/raidCardPolish.js', group: 'tasks', critical: false },
    { id: 'group-quest-editor-js', src: 'src/modules/tasks/groupQuestEditor.js', group: 'tasks', critical: false },
    { id: 'group-quest-editor-compact-polish-js', src: 'src/modules/tasks/groupQuestEditorCompactPolish.js', group: 'tasks', critical: false }
  ];

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent('familyapp:modules:' + name, { detail: detail || {} }));
    } catch(e) {}
  }

  function loadScript(module){
    if(!module || !module.id || !module.src) return Promise.resolve(null);
    if(loaded[module.id] || document.getElementById(module.id)){
      loaded[module.id] = true;
      return Promise.resolve(module);
    }
    return new Promise(function(resolve){
      var script = document.createElement('script');
      script.id = module.id;
      script.src = module.src;
      script.defer = true;
      script.onload = function(){ loaded[module.id] = true; emit('loaded', module); resolve(module); };
      script.onerror = function(){ failed[module.id] = module; console.warn('[AppModules] failed to load', module.id, module.src); emit('failed', module); resolve(null); };
      document.body.appendChild(script);
    });
  }

  function boot(){
    if(booting || booted) return Promise.resolve(status());
    booting = true;
    var chain = Promise.resolve();
    registry.forEach(function(module){ chain = chain.then(function(){ return loadScript(module); }); });
    return chain.then(function(){ booting = false; booted = true; emit('ready', status()); return status(); });
  }

  function status(){
    return { version: VERSION, registered: registry.length, loaded: Object.keys(loaded), failed: Object.keys(failed), registry: registry.slice() };
  }

  function register(module){
    if(!module || !module.id || !module.src) return false;
    if(!registry.some(function(item){ return item.id === module.id; })) registry.push(module);
    return true;
  }

  window.AppModules = { version: VERSION, register: register, boot: boot, loadScript: loadScript, status: status };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
