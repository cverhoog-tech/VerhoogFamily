'use strict';
(function(){
  if(window.FamilyAppIconRenderer)return;
  var VERSION='1.2.0';
  var ALIASES=Object.freeze({utilityProduct:'utilityCategory'});
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function render(key,opts){
    opts=opts||{};
    key=ALIASES[String(key||'')]||key;
    var registry=window.FamilyAppIconRegistry;
    var row=registry&&registry.resolve?registry.resolve(key,opts.variant):(registry&&registry.get?registry.get(key):null);
    if(!row)return'';
    var size=String(opts.size||'md'),tone=String(opts.tone||row.tone||'default');
    var label=opts.label===false?'':String(opts.label||row.label||'');
    var variant=row.variant?String(row.variant):String(opts.variant||'default');
    var cls='fa-icon fa-icon-'+esc(size)+' fa-icon-tone-'+esc(tone)+' fa-icon-variant-'+esc(variant)+(opts.className?' '+esc(opts.className):'');
    var aria=label?' role="img" aria-label="'+esc(label)+'"':' aria-hidden="true"';
    // Per-icon visual-size normalization (see familyAppIconRegistry.js task() comment).
    // Only applies to the premium/default sprite -- the compact sprite is separate
    // artwork with its own geometry and is left untouched. Scaling is done natively
    // on the <use> element around the shared viewBox center (16,16); native SVG
    // transform math has a fixed, well-defined origin (unlike CSS transform-box on
    // nested SVG, which has historically been inconsistent in Safari), so this stays
    // reliable across browsers and UI-scale zoom levels without any manual offset.
    var scale=(variant!=='compact'&&row.visualScale&&row.visualScale!==1)?Number(row.visualScale):1;
    var useTransform=scale!==1?' transform="translate(16,16) scale('+scale+') translate(-16,-16)"':'';
    return '<svg class="'+cls+'" viewBox="0 0 32 32"'+aria+'><use href="'+esc(row.sprite)+'#'+esc(row.symbol)+'"'+useTransform+'></use></svg>';
  }
  window.FamilyAppIconRenderer={version:VERSION,render:render};
  window.renderFamilyAppIcon=render;
})();
