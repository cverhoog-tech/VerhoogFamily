'use strict';
(function(){
  if(window.FamilyAppIconRenderer)return;
  var VERSION='1.0.0';
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function render(key,opts){
    opts=opts||{};
    var registry=window.FamilyAppIconRegistry,row=registry&&registry.get?registry.get(key):null;
    if(!row)return'';
    var size=String(opts.size||'md'),tone=String(opts.tone||row.tone||'default');
    var label=opts.label===false?'':String(opts.label||row.label||'');
    var cls='fa-icon fa-icon-'+esc(size)+' fa-icon-tone-'+esc(tone)+(opts.className?' '+esc(opts.className):'');
    var aria=label?' role="img" aria-label="'+esc(label)+'"':' aria-hidden="true"';
    return '<svg class="'+cls+'" viewBox="0 0 32 32"'+aria+'><use href="'+esc(row.sprite)+'#'+esc(row.symbol)+'"></use></svg>';
  }
  window.FamilyAppIconRenderer={version:VERSION,render:render};
  window.renderFamilyAppIcon=render;
})();
