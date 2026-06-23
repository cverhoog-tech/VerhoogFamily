'use strict';
// ============================================================
// GROUP QUEST EDITOR COMPACT POLISH v0.301
// Compact premium styling layer for the group quest creator.
// Keeps editor behavior unchanged, only refines visual hierarchy.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('group-quest-editor-compact-polish');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'group-quest-editor-compact-polish';
    s.textContent = [
      '.gqePanel{background:linear-gradient(180deg,#121a2b,#0e1726)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif!important}',
      '.gqeHero{min-height:210px!important;padding:66px 20px 20px!important}',
      '.gqeHero h2{font-size:30px!important;letter-spacing:-.9px!important}',
      '.gqeHero p{font-size:13px!important;max-width:310px!important;color:rgba(255,255,255,.76)!important}',
      '.gqeXpPreview{margin-top:12px!important;padding:7px 11px!important;font-size:11px!important}',
      '.gqeBody{padding:13px 13px 92px!important;background:linear-gradient(180deg,#121a2b,#0b1320)!important}',
      '.gqeSection{border-radius:20px!important;padding:12px!important;margin-bottom:10px!important;background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.045))!important;border:1px solid rgba(255,255,255,.10)!important;box-shadow:0 10px 24px rgba(0,0,0,.13),inset 0 1px 0 rgba(255,255,255,.05)!important}',
      '.gqeField{margin-bottom:10px!important}.gqeField label{font-size:9.5px!important;letter-spacing:.13em!important;color:rgba(255,255,255,.52)!important;margin-bottom:6px!important}',
      '.gqeField input,.gqeField textarea{border-radius:15px!important;padding:11px 12px!important;font-size:15px!important;font-weight:800!important;background:rgba(255,255,255,.065)!important;border:1px solid rgba(255,255,255,.105)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important}',
      '.gqeField textarea{min-height:70px!important}',

      '.gqeTypeGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}',
      '.gqeTypeCard{min-height:0!important;border-radius:16px!important;padding:9px 8px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.09)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important}',
      '.gqeTypeCard b{font-size:12.5px!important;line-height:1!important;letter-spacing:.02em!important;margin:0 0 4px!important;text-transform:uppercase!important;color:rgba(255,255,255,.84)!important}',
      '.gqeTypeCard span{font-size:11px!important;font-weight:950!important;color:#86efac!important;line-height:1!important}',
      '.gqeTypeCard:has(input:checked){background:linear-gradient(135deg,rgba(49,95,44,.32),rgba(109,40,217,.34))!important;border-color:rgba(196,181,253,.68)!important;box-shadow:0 0 0 1px rgba(196,181,253,.12),inset 0 1px 0 rgba(255,255,255,.08)!important}',

      '.gqeSubAdd{gap:7px!important}.gqeSubAdd input{height:46px!important}.gqeSubAdd button{height:46px!important;padding:0 14px!important;border-radius:15px!important;font-size:12px!important;box-shadow:0 8px 18px rgba(49,95,44,.18)!important}',
      '.gqeSteps{gap:7px!important;margin-top:9px!important}.gqeStep{border-radius:15px!important;padding:9px 10px!important;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.09)!important}',
      '.gqeStep span{font-size:12.5px!important;font-weight:850!important;color:rgba(255,255,255,.84)!important}',
      '.gqeStep button{width:25px!important;height:25px!important;border-radius:9px!important;background:rgba(239,68,68,.16)!important;color:#fecaca!important}',

      '.gqeMembers{gap:7px!important}.gqeMember{border-radius:16px!important;padding:9px 7px!important;font-size:11px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.09)!important}',
      '.gqeMember b{width:32px!important;height:32px!important;margin-bottom:5px!important;font-size:9px!important}',

      '.gqeActions{gap:8px!important;padding:10px 14px calc(14px + env(safe-area-inset-bottom))!important;background:linear-gradient(180deg,rgba(11,19,32,.10),rgba(11,19,32,.96) 34%)!important}',
      '.gqeActions button{min-height:50px!important;border-radius:16px!important;padding:0 14px!important;font-size:13px!important;font-weight:950!important;box-shadow:0 8px 18px rgba(49,95,44,.18)!important}',
      '.gqeActions button.ghost{box-shadow:none!important;background:rgba(255,255,255,.075)!important;border:1px solid rgba(255,255,255,.11)!important;color:rgba(255,255,255,.88)!important}',

      '@media(max-width:420px){.gqeHero{min-height:200px!important}.gqeHero h2{font-size:28px!important}.gqeBody{padding-left:12px!important;padding-right:12px!important}.gqeTypeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.gqeActions{flex-direction:row!important}.gqeActions button{min-height:48px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
  setTimeout(inject, 300);
  setTimeout(inject, 1000);
})();
