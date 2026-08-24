'use strict';
// ============================================================
// PROGRESSION PRODUCER BRIDGE v1.1.0 — STEP 9
//
// Adds deterministic reward context to legacy UI producers without changing
// their accepted UI/business flow. Contexts use real stable entity/batch ids
// and are identity-bound by ProgressionRuntime.
// ============================================================
(function(){
  if(window.ProgressionProducerBridge)return;

  var VERSION='1.1.0';

  function runtime(){return window.ProgressionRuntime||null;}
  function queue(reason,options){
    var r=runtime();
    if(!r||typeof r.queueLegacyReward!=='function')return null;
    try{return r.queueLegacyReward(reason,options,2000);}catch(e){console.error('[ProgressionProducerBridge] queue failed',reason,e);return null;}
  }
  function cancel(token){
    var r=runtime();
    if(token!=null&&r&&typeof r.cancelLegacyReward==='function')try{r.cancelLegacyReward(token);}catch(e){}
  }

  function wrapNotes(){
    if(typeof window.saveNote!=='function')return false;
    if(window.saveNote.__progressionProducerBridge)return true;
    var raw=window.saveNote;
    var wrapped=function(){
      var isNew=!window.activeNoteId;
      var nextId=window.noteNextId;
      var token=null;
      if(isNew&&nextId!=null){
        token=queue('Notitie',{
          key:'note:'+String(nextId),
          source:'note',
          sourceId:String(nextId)
        });
      }
      try{return raw.apply(this,arguments);}finally{
        if(token!=null)cancel(token);
      }
    };
    wrapped.__progressionProducerBridge=true;
    wrapped.__wrappedSaveNote=raw;
    window.saveNote=wrapped;
    return true;
  }

  function wrapFeed(){
    var feed=window.FeedSharedData;
    if(!feed)return false;
    var changed=false;

    if(typeof feed.createPost==='function'&&!feed.createPost.__progressionProducerBridge){
      (function(raw){
        var wrapped=function(){
          var self=this,args=arguments;
          return Promise.resolve(raw.apply(self,args)).then(function(created){
            if(created&&created.id!=null){
              queue('Post',{
                key:'feedPost:'+String(created.id),
                source:'feed-post',
                sourceId:String(created.id)
              });
            }
            return created;
          });
        };
        wrapped.__progressionProducerBridge=true;
        wrapped.__wrappedCreatePost=raw;
        feed.createPost=wrapped;
        changed=true;
      })(feed.createPost);
    }

    if(typeof feed.toggleReaction==='function'&&!feed.toggleReaction.__progressionProducerBridge){
      (function(raw){
        var wrapped=function(id){
          var self=this,args=arguments,postId=String(id);
          return Promise.resolve(raw.apply(self,args)).then(function(result){
            if(result&&result.liked){
              queue('Like',{
                key:'feedLike:'+postId,
                source:'feed-like',
                sourceId:postId
              });
            }
            return result;
          });
        };
        wrapped.__progressionProducerBridge=true;
        wrapped.__wrappedToggleReaction=raw;
        feed.toggleReaction=wrapped;
        changed=true;
      })(feed.toggleReaction);
    }
    return changed||!!(feed.createPost&&feed.createPost.__progressionProducerBridge&&feed.toggleReaction&&feed.toggleReaction.__progressionProducerBridge);
  }

  function wrapRecipes(){
    var recipes=window.RecipeStore;
    if(!recipes||typeof recipes.create!=='function')return false;
    if(recipes.create.__progressionProducerBridge)return true;
    var raw=recipes.create;
    var wrapped=function(){
      var self=this,args=arguments;
      return Promise.resolve(raw.apply(self,args)).then(function(result){
        var recipe=result&&result.recipe;
        if(recipe&&recipe.id!=null){
          queue('Recept aangemaakt',{
            key:'recipe:'+String(recipe.id),
            source:'recipe',
            sourceId:String(recipe.id)
          });
        }
        return result;
      });
    };
    wrapped.__progressionProducerBridge=true;
    wrapped.__wrappedRecipeCreate=raw;
    recipes.create=wrapped;
    return true;
  }

  function wrapTaskTemplates(){
    if(typeof window.activateTemplate!=='function')return false;
    if(window.activateTemplate.__progressionProducerBridge)return true;
    var raw=window.activateTemplate;
    var wrapped=function(id){
      var tmpl=(window.taskTemplates||[]).find(function(t){return t&&String(t.id)===String(id);});
      var firstTaskId=window.taskNextId;
      var token=null;
      if(tmpl&&firstTaskId!=null){
        token=queue('Template',{
          key:'taskTemplate:'+String(id)+':activation:'+String(firstTaskId),
          source:'task-template',
          sourceId:String(id)
        });
      }
      try{return raw.apply(this,arguments);}finally{if(token!=null)cancel(token);}
    };
    wrapped.__progressionProducerBridge=true;
    wrapped.__wrappedActivateTemplate=raw;
    window.activateTemplate=wrapped;
    return true;
  }

  function install(){
    return{
      notes:wrapNotes(),
      feed:wrapFeed(),
      recipes:wrapRecipes(),
      taskTemplates:wrapTaskTemplates()
    };
  }

  window.ProgressionProducerBridge={
    version:VERSION,
    install:install,
    status:function(){
      var feed=window.FeedSharedData,recipes=window.RecipeStore;
      return{
        notes:!!(window.saveNote&&window.saveNote.__progressionProducerBridge),
        feedPost:!!(feed&&feed.createPost&&feed.createPost.__progressionProducerBridge),
        feedLike:!!(feed&&feed.toggleReaction&&feed.toggleReaction.__progressionProducerBridge),
        recipe:!!(recipes&&recipes.create&&recipes.create.__progressionProducerBridge),
        taskTemplates:!!(window.activateTemplate&&window.activateTemplate.__progressionProducerBridge)
      };
    }
  };

  window.addEventListener('familyapp:progression-updated',install);
  window.addEventListener('familyapp:feed-updated',install);
  window.addEventListener('familyapp:recipes-synced',install);
  window.addEventListener('familyapp:tasks-updated',install);
  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
