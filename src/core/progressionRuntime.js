'use strict';
// ============================================================
// PROGRESSION RUNTIME v1.1.0 — STEP 9 canonical compatibility layer
//
// Keeps existing UI entry points (`awardXP`, `checkAchievements`) while moving
// their mutations to ProgressionStore. Domain producers should pass a stable
// `{key, source, sourceId}` as the third awardXP argument. For legacy async UI
// paths that cannot yet pass that third argument directly, queueLegacyReward()
// can attach a short-lived, identity-bound deterministic context.
// ============================================================
(function(){
  if(window.ProgressionRuntime)return;

  var VERSION='1.1.0';
  var fallbackSeq=0;
  var fallbackCount=0;
  var pendingSeq=0;
  var pendingLegacy={};
  var checking=Promise.resolve();
  var legacyAward=typeof window.awardXP==='function'?window.awardXP:null;
  var legacyCheck=typeof window.checkAchievements==='function'?window.checkAchievements:null;

  function store(){return window.ProgressionStore||null;}
  function safeNum(value){value=Number(value);return isFinite(value)?value:0;}
  function safeText(value){return String(value==null?'':value);}
  function getLevelFor(xp){
    try{return typeof window.getLevel==='function'?window.getLevel(xp):1;}catch(e){return 1;}
  }
  function currentXp(){
    var s=store();
    try{if(s&&typeof s.getCurrentXp==='function')return Math.max(0,Math.round(safeNum(s.getCurrentXp())));}catch(e){}
    return Math.max(0,Math.round(safeNum(window.myXP)));
  }
  function optionsOf(options){
    if(typeof options==='string')return{key:options};
    return options&&typeof options==='object'?options:{};
  }
  function identityPart(){
    var s=store(),status=null;
    try{status=s&&typeof s.status==='function'?s.status():null;}catch(e){}
    return safeText(status&&status.uid||'nouid')+':'+safeText(status&&status.householdId||'nohousehold');
  }
  function fallbackKey(reason){
    fallbackSeq++;
    fallbackCount++;
    var clean=safeText(reason||'xp').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,36)||'xp';
    var key='legacy:'+identityPart()+':'+clean+':'+Date.now().toString(36)+':'+fallbackSeq;
    try{console.warn('[ProgressionRuntime] reward producer without deterministic key:',reason||'XP');}catch(e){}
    return key;
  }
  function reasonBucket(reason){
    return safeText(reason||'xp').trim().toLowerCase().replace(/\s+/g,' ');
  }
  function copyRewardOptions(options){
    options=optionsOf(options);
    return{
      key:safeText(options.key||'').trim(),
      reason:options.reason==null?undefined:safeText(options.reason),
      source:options.source==null?undefined:safeText(options.source),
      sourceId:options.sourceId==null?null:safeText(options.sourceId)
    };
  }
  function queueLegacyReward(reason,options,ttlMs){
    var opts=copyRewardOptions(options);
    if(!opts.key)throw new Error('PROGRESSION_PENDING_REWARD_KEY_REQUIRED');
    var bucket=reasonBucket(reason);
    var token={
      id:++pendingSeq,
      bucket:bucket,
      identity:identityPart(),
      options:opts,
      expiresAt:Date.now()+Math.max(250,Math.min(10000,Math.round(safeNum(ttlMs)||2000))),
      cancelled:false
    };
    if(!pendingLegacy[bucket])pendingLegacy[bucket]=[];
    pendingLegacy[bucket].push(token);
    return token.id;
  }
  function cancelLegacyReward(tokenId){
    Object.keys(pendingLegacy).some(function(bucket){
      var row=(pendingLegacy[bucket]||[]).find(function(token){return token.id===tokenId;});
      if(!row)return false;
      row.cancelled=true;
      return true;
    });
  }
  function consumeLegacyReward(reason){
    var bucket=reasonBucket(reason),queue=pendingLegacy[bucket]||[],identity=identityPart(),now=Date.now();
    while(queue.length){
      var token=queue.shift();
      if(!token||token.cancelled||token.expiresAt<now||token.identity!==identity)continue;
      return token.options;
    }
    return null;
  }
  function pendingCount(){
    var now=Date.now(),identity=identityPart(),count=0;
    Object.keys(pendingLegacy).forEach(function(bucket){
      (pendingLegacy[bucket]||[]).forEach(function(token){
        if(token&&!token.cancelled&&token.expiresAt>=now&&token.identity===identity)count++;
      });
    });
    return count;
  }
  function mergePending(options,pending){
    var out={};
    pending=pending||{};options=optionsOf(options);
    Object.keys(pending).forEach(function(k){if(pending[k]!==undefined)out[k]=pending[k];});
    Object.keys(options).forEach(function(k){if(options[k]!==undefined)out[k]=options[k];});
    return out;
  }

  function uiAward(amount,label,prevXp,newXp){
    var prevLevel=getLevelFor(prevXp),newLevel=getLevelFor(newXp);
    try{if(typeof window.showXPPopup==='function')window.showXPPopup(amount,label);}catch(e){}
    try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){}
    if(newLevel>prevLevel){
      setTimeout(function(){try{if(typeof window.showLevelUp==='function')window.showLevelUp(newLevel);}catch(e){}},600);
    }
  }

  function setDynamicCheck(id,fn){
    var badges=Array.isArray(window.BADGES)?window.BADGES:[];
    var badge=badges.find(function(row){return row&&row.id===id;});
    if(badge)badge.check=fn;
  }

  function prepareDynamicChecks(){
    setDynamicCheck('trade_5',function(){return safeNum(window.tradesCount)>=5;});
    setDynamicCheck('master_trader',function(){return safeNum(window.tradesCount)>=10;});
    setDynamicCheck('notes_5',function(){return (window.noteData||[]).length>=5;});
    setDynamicCheck('feed_10',function(){return (window.feedData||[]).length>=10;});
    setDynamicCheck('task_10',function(){return (window.taskData||[]).filter(function(t){return t&&t.done;}).length>=10;});
    setDynamicCheck('task_25',function(){return (window.taskData||[]).filter(function(t){return t&&t.done;}).length>=25;});
    setDynamicCheck('streak_3',function(){return (window.recurData||[]).some(function(r){return safeNum(r&&r.streak)>=3;});});
    setDynamicCheck('streak_10',function(){return (window.recurData||[]).some(function(r){return safeNum(r&&r.streak)>=10;});});
    // Preserve the actually served legacy thresholds for compatibility during
    // STEP 9; product balancing can be corrected in a separate product pass.
    setDynamicCheck('millionaire',function(){return currentXp()>=1000;});
    setDynamicCheck('godmode',function(){return getLevelFor(currentXp())>=10;});
    setDynamicCheck('finance_king',function(){
      try{return !!(window.visitedScreens&&window.visitedScreens.has&&window.visitedScreens.has('finance'));}catch(e){return false;}
    });
  }

  function badgeEligible(badge){
    if(!badge||typeof badge.check!=='function')return false;
    try{return !!badge.check();}catch(e){
      try{console.warn('[ProgressionRuntime] achievement check failed',badge.id,e);}catch(_e){}
      return false;
    }
  }

  function runAchievementCheck(){
    var s=store();
    if(!s||typeof s.unlockAchievementOnce!=='function')return Promise.resolve([]);
    prepareDynamicChecks();
    var badges=Array.isArray(window.BADGES)?window.BADGES:[];
    var unlocked=[];
    var chain=Promise.resolve();

    badges.forEach(function(badge){
      chain=chain.then(function(){
        if(!badge||!badge.id||s.hasAchievement(badge.id)||!badgeEligible(badge))return null;
        return s.unlockAchievementOnce(badge.id,Math.max(0,Math.round(safeNum(badge.xp))),{
          reason:badge.name||'Achievement',
          source:'achievement',
          sourceId:badge.id
        }).then(function(result){
          if(result&&result.unlocked){
            window.newBadges=window.newBadges||{};
            window.newBadges[badge.id]=true;
            unlocked.push(badge.id);
            try{if(typeof window.showAchievementToast==='function')window.showAchievementToast(badge);}catch(e){}
          }
          return result;
        });
      });
    });
    return chain.then(function(){return unlocked;});
  }

  function checkAchievements(){
    checking=checking.then(runAchievementCheck,runAchievementCheck);
    return checking;
  }

  function awardXP(amount,label,options){
    var s=store();
    var delta=Math.max(0,Math.round(safeNum(amount)));
    var opts=optionsOf(options);
    if(!safeText(opts.key||'').trim()){
      var pending=consumeLegacyReward(label);
      if(pending)opts=mergePending(opts,pending);
    }
    var key=safeText(opts.key||'').trim()||fallbackKey(label);
    var prevXp=currentXp();

    if(!s||typeof s.awardOnce!=='function'){
      try{console.error('[ProgressionRuntime] ProgressionStore unavailable; XP not mutated',label||'XP');}catch(e){}
      return Promise.resolve({awarded:false,key:key,amount:0,xp:prevXp,error:'PROGRESSION_STORE_UNAVAILABLE'});
    }

    return s.awardOnce(key,delta,{
      reason:opts.reason||label||'XP',
      source:opts.source||'legacy-ui',
      sourceId:opts.sourceId==null?null:opts.sourceId
    }).then(function(result){
      var nextXp=currentXp();
      if(result&&result.awarded)uiAward(delta,label,prevXp,nextXp);
      return checkAchievements().then(function(){return result;});
    }).catch(function(error){
      try{console.error('[ProgressionRuntime] reward failed',key,error);}catch(e){}
      return{awarded:false,key:key,amount:0,xp:currentXp(),error:error&&error.message||String(error)};
    });
  }

  function install(){
    window.awardXP=awardXP;
    window.awardXP.__canonicalProgression=true;
    window.checkAchievements=checkAchievements;
    window.checkAchievements.__canonicalProgression=true;
    return true;
  }

  window.ProgressionRuntime={
    version:VERSION,
    install:install,
    awardXP:awardXP,
    checkAchievements:checkAchievements,
    currentXp:currentXp,
    queueLegacyReward:queueLegacyReward,
    cancelLegacyReward:cancelLegacyReward,
    status:function(){
      return{
        installed:window.awardXP===awardXP&&window.checkAchievements===checkAchievements,
        authority:store()?'ProgressionStore':'unavailable',
        fallbackRewardCount:fallbackCount,
        pendingRewardCount:pendingCount(),
        legacyAwardCaptured:!!legacyAward,
        legacyCheckCaptured:!!legacyCheck
      };
    }
  };

  install();
})();
