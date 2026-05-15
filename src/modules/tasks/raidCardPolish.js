'use strict';
// ============================================================
// RAID CARD POLISH v0.283
// Makes promoted/group raid cards in the overview calmer and more readable.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('raid-card-polish-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'raid-card-polish-styles';
    s.textContent = [
      '#task-content .fqCard.group-promoted{display:grid!important;grid-template-columns:92px minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;padding:16px!important;min-height:178px!important;border-radius:26px!important}',
      '#task-content .fqCard.group-promoted .fqImg{width:92px!important;height:92px!important;border-radius:20px!important;align-self:start!important}',
      '#task-content .fqCard.group-promoted .fqBody{min-width:0!important;padding-right:0!important}',
      '#task-content .fqCard.group-promoted .fqBadges{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-bottom:6px!important}',
      '#task-content .fqCard.group-promoted .fqBadge{font-size:10px!important;padding:5px 9px!important;line-height:1!important;white-space:nowrap!important}',
      '#task-content .fqCard.group-promoted .fqGroupBadge2{display:none!important}',
      '#task-content .fqCard.group-promoted .fqTitle{font-size:24px!important;line-height:1.02!important;margin:0 0 8px!important;letter-spacing:-.45px!important;max-width:100%!important}',
      '#task-content .fqCard.group-promoted .fqDesc{font-size:14px!important;line-height:1.25!important;margin-bottom:9px!important;color:rgba(255,255,255,.68)!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}',
      '#task-content .fqCard.group-promoted .fqMeta{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:0!important}',
      '#task-content .fqCard.group-promoted .fqMetaTag{font-size:11px!important;padding:5px 9px!important;line-height:1!important}',
      '#task-content .fqCard.group-promoted .fqMetaTag.pp{display:none!important}',
      '#task-content .fqCard.group-promoted .fqHelpMini2{margin-top:10px!important;padding:8px 12px!important;font-size:11px!important;line-height:1.1!important;border-radius:999px!important;background:linear-gradient(135deg,#315f2c,#6d28d9)!important;color:#fff!important;box-shadow:0 9px 18px rgba(109,40,217,.18)!important}',
      '#task-content .fqCard.group-promoted .fqStartBtn{align-self:center!important;min-width:116px!important;max-width:130px!important;padding:12px 14px!important;font-size:14px!important;border-radius:18px!important;white-space:nowrap!important}',
      '#task-content .fqCard.group-promoted .fqDel{top:14px!important;right:14px!important;width:34px!important;height:34px!important}',
      '@media(max-width:420px){#task-content .fqCard.group-promoted{grid-template-columns:88px minmax(0,1fr)!important;grid-template-areas:"img body" "actions actions"!important;gap:11px!important;padding:15px!important;min-height:188px!important}#task-content .fqCard.group-promoted .fqImg{grid-area:img;width:88px!important;height:88px!important}#task-content .fqCard.group-promoted .fqBody{grid-area:body}#task-content .fqCard.group-promoted .fqStartBtn{grid-area:actions;width:100%!important;max-width:none!important;margin-top:2px!important}#task-content .fqCard.group-promoted .fqTitle{font-size:21px!important}#task-content .fqCard.group-promoted .fqBadges .fqBadge:nth-child(n+4){display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
  setTimeout(inject, 300);
  setTimeout(inject, 900);
})();
