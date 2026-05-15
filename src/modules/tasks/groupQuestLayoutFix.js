'use strict';
// ============================================================
// GROUP QUEST LAYOUT FIX v0.282
// Safe CSS-only override for Group Quest screen alignment/overflow.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('group-quest-layout-fix-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'group-quest-layout-fix-styles';
    s.textContent = [
      '#task-content{max-width:100%;overflow-x:hidden;box-sizing:border-box}',
      '#task-content .group-quests-view.premium{width:100%;max-width:100%;box-sizing:border-box;padding:22px 16px 132px!important;overflow-x:hidden}',
      '#task-content .group-quests-view.premium *{box-sizing:border-box}',
      '#task-content .gq-hero{width:100%!important;max-width:100%!important;margin:0 0 13px!important;border-radius:28px!important;transform:none!important}',
      '#task-content .gq-summary-grid{width:100%!important;max-width:100%!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}',
      '#task-content .gq-summary-grid div{min-width:0!important;padding-left:5px!important;padding-right:5px!important}',
      '#task-content .gq-card.premium{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;transform:none!important}',
      '#task-content .gq-card-content{width:100%!important;max-width:100%!important;min-width:0!important}',
      '#task-content .gq-card-top{min-width:0!important}',
      '#task-content .gq-card-top>div{min-width:0!important}',
      '#task-content .gq-card h3{word-break:break-word!important;overflow-wrap:anywhere!important}',
      '#task-content .gq-progress-wrap,#task-content .gq-party-row{min-width:0!important}',
      '#task-content .gq-progress{min-width:0!important}',
      '#task-content .gq-actions{width:100%!important}',
      '#task-content .gq-actions button{min-width:0!important}',
      '@media(max-width:420px){#task-content .group-quests-view.premium{padding:24px 16px 138px!important}#task-content .gq-hero{min-height:158px!important}#task-content .gq-card.premium{min-height:316px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
  setTimeout(inject, 300);
  setTimeout(inject, 900);
})();
