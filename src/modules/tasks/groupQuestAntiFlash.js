'use strict';
// ============================================================
// GROUP QUEST ANTI FLASH v0.285
// Prevents the older group quest renderer from flashing before the
// premium readability renderer takes over.
// ============================================================

(function(){
  var STYLE_ID = 'group-quest-anti-flash-style';
  if(document.getElementById(STYLE_ID)) return;
  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = [
    '#task-content .group-quests-view.premium:not(.gq284):not(.gq285){opacity:0!important;visibility:hidden!important;min-height:430px!important;pointer-events:none!important}',
    '#task-content .gq-card.premium:not(.gq284Card){opacity:0!important;visibility:hidden!important}'
  ].join('\n');
  document.head.appendChild(s);
})();
