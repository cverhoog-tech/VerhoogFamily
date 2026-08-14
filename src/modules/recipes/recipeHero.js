'use strict';
// ============================================================
// RECIPE HERO RESOLVER v1.0
// Single, centralised place that decides what visual a recipe shows:
// a custom photo (if present) or a mood-based FamilyApp preset built
// from CSS gradients keyed by meal type (cat). No image files are
// required for presets — the old HERO_PRESETS pointed at
// assets/recipes/hero-*.webp files that do not exist in the repo, so
// every card silently fell back to a plain emoji. This resolver
// replaces that with a procedural gradient (same approach already
// proven in taskDetailPopup.js's heroFallbackStyle) that always
// renders, has zero broken-image flicker, and gives each meal type
// its own distinct cozy-RPG mood.
//
// Used by:
//  - src/modules/recipes/recipes.js        (grid cards + detail hero)
//  - src/modules/recipes/recipeEditorPopup.js (create/edit hero preview)
// Do not add a second hero-resolving code path — extend MOOD/resolve
// here instead.
// ============================================================
(function(){
  if(window.RecipeHero) return;

  // Mood per meal type. `bg` is a full CSS background-image value
  // (radial glow + directional gradient), `accent` is a single colour
  // used for chips/badges, `emoji` is the watermark/fallback icon.
  var MOOD={
    Ontbijt:{ // warm ochtendlicht, honing, goud, beige — cozy early-morning kitchen
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,236,189,.65),transparent 60%),linear-gradient(155deg,#ffdd9a 0%,#e8a94a 48%,#8a5a24 100%)',
      accent:'#c8862c', emoji:'🥞'
    },
    Lunch:{ // fris maar warm, groen, goud, zacht daglicht — licht avontuurlijke cozy sfeer
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(236,248,201,.65),transparent 60%),linear-gradient(155deg,#d3ecA0 0%,#8fbf5a 48%,#3f6b2a 100%)',
      accent:'#5c8a34', emoji:'🥗'
    },
    Diner:{ // warm amber, diep paars, kaarslicht — tavern/avondmaaltijd sfeer
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(240,201,136,.4),transparent 60%),linear-gradient(155deg,#caa25a 0%,#7a3f6b 55%,#241333 100%)',
      accent:'#8a4fa0', emoji:'🍽️'
    },
    Snack:{ // cozy bakery, warme zoete tinten, lichte patisserie fantasy vibe
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,215,194,.65),transparent 60%),linear-gradient(155deg,#ffc9a8 0%,#e2896a 48%,#7a3626 100%)',
      accent:'#d9714c', emoji:'🍿'
    },
    Dessert:{ // cozy bakery, zoete patisserie tinten
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,217,236,.6),transparent 60%),linear-gradient(155deg,#f6b9d9 0%,#c976ab 48%,#5c2a52 100%)',
      accent:'#b8579c', emoji:'🍰'
    },
    Bakken:{ // cozy bakery, golden crust tinten
      bg:'radial-gradient(120% 140% at 82% -12%,rgba(255,231,179,.6),transparent 60%),linear-gradient(155deg,#f2cf8e 0%,#c98a3f 48%,#6b3d1a 100%)',
      accent:'#c98a3f', emoji:'🧁'
    }
  };

  function moodFor(cat){return MOOD[cat]||MOOD.Diner;}

  // recipeLike: any object with .cat / .photo / .emoji — a real recipe,
  // or a lightweight draft { cat, photo, emoji } from the editor popup.
  // Custom photo always wins; otherwise the FamilyApp preset for the
  // meal type is used.
  function resolveRecipeHero(recipeLike){
    var r=recipeLike||{};
    var cat=MOOD[r.cat]?r.cat:'Diner';
    var mood=moodFor(cat);
    var hasPhoto=!!r.photo;
    return {
      cat:cat,
      hasPhoto:hasPhoto,
      photoUrl:hasPhoto?r.photo:null,
      background:mood.bg,
      accent:mood.accent,
      emoji:r.emoji||mood.emoji
    };
  }

  window.RecipeHero={
    resolve:resolveRecipeHero,
    MOOD:MOOD,
    icon:function(cat){return moodFor(cat).emoji;},
    accent:function(cat){return moodFor(cat).accent;},
    CATS:['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken']
  };
})();
