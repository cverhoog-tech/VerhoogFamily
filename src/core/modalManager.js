'use strict';
// ============================================================
// MODAL MANAGER v0.352
// Centralized modal lifecycle for sheets/dialogs.
// Does not replace legacy addSheet yet; provides a stable new foundation.
// ============================================================

(function(){
  var VERSION = '0.352';
  var ROOT_ID = 'familyapp-modal-root';
  var STYLE_ID = 'familyapp-modal-manager-style';
  var activeModal = null;

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#'+ROOT_ID+'{position:relative;z-index:1000000}',
      '.fam-modal-overlay{position:fixed!important;inset:0!important;z-index:1000000!important;display:none;align-items:flex-end;justify-content:center;background:rgba(15,23,42,.42);backdrop-filter:blur(4px)}',
      '.fam-modal-overlay.open{display:flex!important}',
      '.fam-modal-backdrop{position:absolute;inset:0}',
      '.fam-modal-sheet{position:relative;width:100%;max-width:520px;background:var(--c-sheet-bg,var(--c-surface,#fff));border-radius:26px 26px 0 0;padding:14px 16px max(26px,env(safe-area-inset-bottom));box-shadow:0 -22px 52px rgba(15,23,42,.25);max-height:88vh;overflow:auto;-webkit-overflow-scrolling:touch;transform:translateY(14px);opacity:0;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s ease}',
      '.fam-modal-overlay.open .fam-modal-sheet{transform:translateY(0);opacity:1}',
      '.fam-modal-handle{width:44px;height:5px;border-radius:999px;background:var(--c-border,#e5e7eb);margin:0 auto 14px}',
      '.fam-modal-title{font-size:21px;font-weight:950;letter-spacing:-.035em;color:var(--c-text,#111827);margin:0 0 12px}',
      '.fam-modal-body{color:var(--c-text,#111827)}',
      '.fam-modal-actions{display:flex;gap:10px;margin-top:16px}',
      '.fam-modal-btn{flex:1;border:0;border-radius:17px;padding:13px 14px;font-size:15px;font-weight:900;cursor:pointer}',
      '.fam-modal-primary{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.fam-modal-secondary{background:var(--c-surface2,#f3f5f2);color:var(--c-text2,#667085)}',
      '.fam-modal-field{margin:12px 0}',
      '.fam-modal-field label{display:block;font-size:11px;font-weight:900;color:var(--c-text2,#667085);text-transform:uppercase;letter-spacing:.055em;margin-bottom:6px}',
      '.fam-modal-field input,.fam-modal-field select,.fam-modal-field textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--c-border,#e5e7eb);border-radius:16px;padding:12px 13px;background:var(--c-input-bg,#fff);color:var(--c-text,#111827);font-size:15px;outline:none}',
      '.fam-modal-field input:focus,.fam-modal-field select:focus,.fam-modal-field textarea:focus{border-color:var(--c-primary,#3f7f2f);box-shadow:0 0 0 3px rgba(63,127,47,.10)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureRoot(){
    ensureStyles();
    var root = document.getElementById(ROOT_ID);
    if(!root){
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    return root;
  }

  function close(){
    if(!activeModal) return;
    var modal = activeModal;
    activeModal = null;
    modal.classList.remove('open');
    setTimeout(function(){ if(modal && modal.parentNode) modal.parentNode.removeChild(modal); }, 220);
    document.body.classList.remove('fam-modal-lock');
  }

  function open(options){
    options = options || {};
    close();
    var root = ensureRoot();
    var overlay = document.createElement('div');
    overlay.className = 'fam-modal-overlay';
    overlay.innerHTML = '<div class="fam-modal-backdrop"></div><div class="fam-modal-sheet" role="dialog" aria-modal="true"><div class="fam-modal-handle"></div><div class="fam-modal-title"></div><div class="fam-modal-body"></div><div class="fam-modal-actions"></div></div>';

    var title = overlay.querySelector('.fam-modal-title');
    var body = overlay.querySelector('.fam-modal-body');
    var actions = overlay.querySelector('.fam-modal-actions');
    title.textContent = options.title || '';
    if(options.html) body.innerHTML = options.html;
    else if(options.content instanceof Node) body.appendChild(options.content);
    else body.textContent = options.text || '';

    if(options.actions && options.actions.length){
      actions.innerHTML = options.actions.map(function(action, i){
        return '<button type="button" class="fam-modal-btn '+(action.primary ? 'fam-modal-primary' : 'fam-modal-secondary')+'" data-action-index="'+i+'">'+(action.label || 'OK')+'</button>';
      }).join('');
      actions.querySelectorAll('[data-action-index]').forEach(function(btn){
        btn.onclick = function(){
          var action = options.actions[parseInt(btn.getAttribute('data-action-index'),10)];
          var result = action && action.onClick ? action.onClick({ modal: overlay, close: close }) : null;
          if(action && action.keepOpen) return;
          if(result !== false) close();
        };
      });
    } else {
      actions.style.display = 'none';
    }

    overlay.querySelector('.fam-modal-backdrop').onclick = function(){ if(options.closeOnBackdrop !== false) close(); };
    root.appendChild(overlay);
    activeModal = overlay;
    document.body.classList.add('fam-modal-lock');
    setTimeout(function(){ overlay.classList.add('open'); }, 20);
    if(typeof options.onOpen === 'function') setTimeout(function(){ options.onOpen({ modal: overlay, close: close }); }, 40);
    return overlay;
  }

  function confirm(options){
    options = options || {};
    return open({
      title: options.title || 'Weet je het zeker?',
      text: options.text || '',
      actions: [
        { label: options.cancelLabel || 'Annuleren' },
        { label: options.confirmLabel || 'Bevestigen', primary: true, onClick: options.onConfirm }
      ]
    });
  }

  window.ModalManager = { version: VERSION, open: open, close: close, confirm: confirm, ensureRoot: ensureRoot };
})();
