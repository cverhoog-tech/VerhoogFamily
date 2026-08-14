'use strict';
// ============================================================
// RECIPE HERO RESOLVER v1.1
// One central visual resolver for grid, detail and editor preview.
// Custom photo wins. Otherwise a stable FamilyApp preset asset is used
// when present, with a cozy RPG gradient underneath as guaranteed fallback.
// ============================================================
(function(){
  if(window.RecipeHero && window.RecipeHero.version==='1.1.0') return;

  var MOOD={
    Ontbijt:{
      asset:'backgrounds/recipe_hero_breakfast.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,236,189,.65),transparent 60%),linear-gradient(155deg,#ffdd9a 0%,#e8a94a 48%,#8a5a24 100%)',
      accent:'#c8862c',emoji:'🥞'
    },
    Lunch:{
      asset:'backgrounds/recipe_hero_lunch.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(236,248,201,.65),transparent 60%),linear-gradient(155deg,#d3eca0 0%,#8fbf5a 48%,#3f6b2a 100%)',
      accent:'#5c8a34',emoji:'🥗'
    },
    Diner:{
      asset:'backgrounds/recipe_hero_dinner.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(240,201,136,.4),transparent 60%),linear-gradient(155deg,#caa25a 0%,#7a3f6b 55%,#241333 100%)',
      accent:'#8a4fa0',emoji:'🍽️'
    },
    Snack:{
      asset:'backgrounds/recipe_hero_snack.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,215,194,.65),transparent 60%),linear-gradient(155deg,#ffc9a8 0%,#e2896a 48%,#7a3626 100%)',
      accent:'#d9714c',emoji:'🍿'
    },
    Dessert:{
      asset:'backgrounds/recipe_hero_dessert.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,217,236,.6),transparent 60%),linear-gradient(155deg,#f6b9d9 0%,#c976ab 48%,#5c2a52 100%)',
      accent:'#b8579c',emoji:'🍰'
    },
    Bakken:{
      asset:'backgrounds/recipe_hero_baking.webp',
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,231,179,.6),transparent 60%),linear-gradient(155deg,#f2cf8e 0%,#c98a3f 48%,#6b3d1a 100%)',
      accent:'#c98a3f',emoji:'🧁'
    }
  };

  function moodFor(cat){return MOOD[cat]||MOOD.Diner;}
  function cssUrl(url){return 'url("'+String(url||'').replace(/"/g,'%22')+'")';}

  function resolveRecipeHero(recipeLike){
    var r=recipeLike||{};
    var cat=MOOD[r.cat]?r.cat:'Diner';
    var mood=moodFor(cat);
    var hasPhoto=!!r.photo;
    return {
      cat:cat,
      hasPhoto:hasPhoto,
      photoUrl:hasPhoto?r.photo:null,
      presetUrl:mood.asset,
      // Multiple CSS backgrounds: if preset asset is not deployed yet,
      // the failed URL layer is transparent and the gradient still renders.
      background:cssUrl(mood.asset)+','+mood.bg,
      fallbackBackground:mood.bg,
      accent:mood.accent,
      emoji:r.emoji||mood.emoji
    };
  }

  window.RecipeHero={
    version:'1.1.0',
    resolve:resolveRecipeHero,
    MOOD:MOOD,
    icon:function(cat){return moodFor(cat).emoji;},
    accent:function(cat){return moodFor(cat).accent;},
    presetUrl:function(cat){return moodFor(cat).asset;},
    CATS:['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken']
  };
})();
