'use strict';
// ============================================================
// GROUP QUEST EDITOR POLISH v0.287
// Premium typography, richer fields and checklist-style subtasks.
// Safe CSS layer on top of the quest-sheet creator.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('group-quest-editor-polish-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'group-quest-editor-polish-styles';
    s.textContent = [
      '.gqePanel{font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif!important;letter-spacing:-.01em}',
      '.gqeHero h2{font-size:35px!important;font-weight:980!important;letter-spacing:-1.05px!important;line-height:.94!important}',
      '.gqeHero p{font-size:14px!important;font-weight:650!important;color:rgba(255,255,255,.80)!important}',
      '.gqeChip{font-size:9.5px!important;font-weight:980!important;letter-spacing:.105em!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.20)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}',
      '.gqeXpPreview{font-weight:980!important;font-size:12px!important;letter-spacing:.01em!important;padding:9px 13px!important;box-shadow:0 14px 28px rgba(250,204,21,.22), inset 0 1px 0 rgba(255,255,255,.42)!important}',
      '.gqeSection{border-radius:24px!important;padding:15px!important;background:linear-gradient(180deg,rgba(255,255,255,.105),rgba(255,255,255,.065))!important;border:1px solid rgba(255,255,255,.135)!important;box-shadow:0 16px 34px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.07)!important}',
      '.gqeField label{font-size:10px!important;font-weight:980!important;color:rgba(255,255,255,.58)!important;letter-spacing:.13em!important}',
      '.gqeField input,.gqeField textarea{border-radius:19px!important;background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.075))!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 18px rgba(0,0,0,.12)!important;font-size:16px!important;font-weight:850!important;letter-spacing:-.02em!important;color:#fff!important}',
      '.gqeField input:focus,.gqeField textarea:focus{border-color:rgba(196,181,253,.78)!important;box-shadow:0 0 0 3px rgba(196,181,253,.13), inset 0 1px 0 rgba(255,255,255,.08)!important}',
      '.gqeTypeCard{border-radius:20px!important;background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.065))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important}',
      '.gqeTypeCard b{font-weight:980!important;letter-spacing:-.02em!important}.gqeTypeCard span{font-weight:950!important}',
      '.gqeSubAdd{align-items:center!important}.gqeSubAdd button{border-radius:18px!important;box-shadow:0 12px 24px rgba(49,95,44,.22), inset 0 1px 0 rgba(255,255,255,.30)!important}',
      '.gqeSteps{gap:8px!important;margin-top:12px!important}',
      '.gqeStep{position:relative!important;display:grid!important;grid-template-columns:30px minmax(0,1fr) 28px!important;align-items:center!important;gap:9px!important;border-radius:18px!important;padding:11px 10px!important;background:linear-gradient(180deg,rgba(255,255,255,.115),rgba(255,255,255,.065))!important;border:1px solid rgba(255,255,255,.13)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important}',
      '.gqeStep:before{content:"";width:22px;height:22px;border-radius:8px;border:2px solid rgba(134,239,172,.75);background:rgba(134,239,172,.10);box-shadow:0 0 0 4px rgba(134,239,172,.06), inset 0 1px 0 rgba(255,255,255,.16)}',
      '.gqeStep span{font-size:14px!important;font-weight:850!important;color:rgba(255,255,255,.90)!important;letter-spacing:-.025em!important}',
      '.gqeStep button{width:28px!important;height:28px!important;border-radius:10px!important;background:rgba(239,68,68,.16)!important;color:#fecaca!important;font-size:16px!important;line-height:1!important}',
      '.gqeMembers{gap:9px!important}.gqeMember{border-radius:20px!important;background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.065))!important;border:1px solid rgba(255,255,255,.135)!important;font-weight:950!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important}',
      '.gqeMember b{width:38px!important;height:38px!important;font-weight:980!important;box-shadow:0 10px 18px rgba(0,0,0,.20)!important}',
      '.gqeActions button{font-size:14px!important;font-weight:980!important;letter-spacing:-.01em!important;border-radius:19px!important;padding:13px 14px!important}',
      '@media(max-width:420px){.gqeHero h2{font-size:32px!important}.gqeSection{padding:14px!important}.gqeStep span{font-size:13.5px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
  setTimeout(inject, 300);
  setTimeout(inject, 1000);
})();
