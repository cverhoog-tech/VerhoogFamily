'use strict';
// ============================================================
// SAVINGS BOTTOM SHEET BRIDGE v0.355
// Migrates savings goal + savings transaction flows to ModalManager/BottomSheet.
// Leaves existing savings data/rendering intact.
// ============================================================

(function(){
  var VERSION = '0.355';
  var loadingPromise = null;

  var GOAL_ICONS_FALLBACK = ['🏠','🚗','✈️','💻','📱','🎓','💍','🌴','🛋️','🎸','⛵','👶','🐕','🏋️','🎮','🌍','💊','🏦','🎁','💰'];
  var GOAL_COLORS = ['#2d5a27','#1a6fa8','#7c3aed','#c0547a','#d97706','#dc2626','#059669','#0891b2'];

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 50){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[SavingsBottomSheetBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureBottomSheet(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js', 'src/core/modalManager.js', function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js', 'src/core/bottomSheet.js', function(){ return !!window.BottomSheet; }); });
    return loadingPromise;
  }

  function today(){
    if(typeof window.todayStr === 'function') return window.todayStr();
    return new Date().toISOString().slice(0,10);
  }

  function toast(msg){ if(typeof window.showToast === 'function') window.showToast(msg); }
  function xp(n, label){ if(typeof window.awardXP === 'function') window.awardXP(n, label); }
  function activity(icon, bg, text){ if(typeof window.addActivity === 'function') window.addActivity(icon, bg, text); }
  function notif(icon, bg, title, body){ if(typeof window.addNotif === 'function') window.addNotif(icon, bg, title, body); }

  function render(){ if(typeof window.renderSparen === 'function') window.renderSparen(); }

  function getGoals(){ return Array.isArray(window.savingsGoals) ? window.savingsGoals : []; }
  function getGoal(id){ return getGoals().find(function(g){ return Number(g.id) === Number(id); }); }

  function getNextId(){
    if(typeof window.savingsNextId === 'number') return window.savingsNextId++;
    var max = Math.max.apply(null, getGoals().map(function(g){ return Number(g.id) || 0; }).concat([0]));
    window.savingsNextId = max + 2;
    return max + 1;
  }

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function money(v){ return '€ '+Number(v || 0).toLocaleString('nl-NL', { maximumFractionDigits: 0 }); }

  function persistSavings(operation){
    try { localStorage.setItem('familyapp_finance_savings_v001', JSON.stringify(getGoals())); } catch(error) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('savingsGoals', getGoals(), { source:'savingsBottomSheetBridge', operation: operation || 'savingsMutation', version: VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:finance:savings-updated', { detail:{ goals:getGoals(), version:VERSION } })); } catch(error) {}
  }

  function whoButtons(active){
    active = active || window.myName || 'Shane';
    var partner = window.partnerName || 'Esra';
    var me = window.myName || 'Shane';
    return '<div class="fam-modal-field"><label>Wie?</label><div class="sbs-choice-row" id="sbs-who-row">'
      +'<button type="button" class="sbs-choice '+(active===me?'active':'')+'" data-sbs-who="'+esc(me)+'">'+esc(me)+'</button>'
      +'<button type="button" class="sbs-choice '+(active===partner?'active':'')+'" data-sbs-who="'+esc(partner)+'">'+esc(partner)+'</button>'
      +'</div></div>';
  }

  function ensureStyles(){
    if(document.getElementById('savings-bottom-sheet-style')) return;
    var style = document.createElement('style');
    style.id = 'savings-bottom-sheet-style';
    style.textContent = [
      '.sbs-choice-row{display:flex;gap:8px;flex-wrap:wrap}',
      '.sbs-choice{border:1.5px solid var(--c-border,#e5e7eb);background:var(--c-surface,#fff);color:var(--c-text,#111827);border-radius:14px;padding:10px 14px;font-weight:900;cursor:pointer}',
      '.sbs-choice.active{background:var(--c-primary,#3f7f2f);border-color:var(--c-primary,#3f7f2f);color:#fff}',
      '.sbs-icon-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}',
      '.sbs-icon-btn{height:32px;border:1.5px solid var(--c-border,#e5e7eb);border-radius:10px;background:var(--c-surface,#fff);font-size:17px;cursor:pointer}',
      '.sbs-icon-btn.active{border-color:var(--c-primary,#3f7f2f);background:rgba(63,127,47,.10)}',
      '.sbs-color-row{display:flex;gap:8px;flex-wrap:wrap}',
      '.sbs-color-btn{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer}',
      '.sbs-color-btn.active{border-color:#111827}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function selectedWho(modal){
    var btn = modal.querySelector('[data-sbs-who].active');
    return btn ? btn.getAttribute('data-sbs-who') : (window.myName || 'Shane');
  }

  function wireChoiceRows(modal){
    modal.querySelectorAll('.sbs-choice-row').forEach(function(row){
      row.querySelectorAll('.sbs-choice').forEach(function(btn){
        btn.onclick = function(){
          row.querySelectorAll('.sbs-choice').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
        };
      });
    });
  }

  function openTransaction(goalId, type){
    ensureBottomSheet().then(function(){
      ensureStyles();
      var g = getGoal(goalId);
      if(!g || !window.BottomSheet) return;
      type = type || 'deposit';
      var isDeposit = type === 'deposit';
      window.BottomSheet.open({
        title: (isDeposit ? '💰 Storting' : '📤 Opname') + ' — ' + g.name,
        html: ''
          +'<div class="fam-modal-field"><label>Bedrag (€)</label><input id="sbs-amount" type="number" min="1" step="1" placeholder="0"></div>'
          +'<div class="fam-modal-field"><label>Notitie</label><input id="sbs-note" placeholder="bijv. Maandelijkse bijdrage"></div>'
          +whoButtons(window.myName || 'Shane')
          +'<div class="fam-modal-field"><label>Datum</label><input id="sbs-date" type="date" value="'+today()+'"></div>',
        onOpen: function(ctx){
          wireChoiceRows(ctx.modal);
          var amount = ctx.modal.querySelector('#sbs-amount');
          if(amount) setTimeout(function(){ amount.focus(); }, 80);
        },
        actions: [
          { label:'Annuleren' },
          { label: isDeposit ? 'Storting toevoegen' : 'Opname verwerken', primary:true, onClick:function(ctx){
            var modal = ctx.modal;
            var amount = parseFloat((modal.querySelector('#sbs-amount') || {}).value) || 0;
            var note = (modal.querySelector('#sbs-note') || {}).value || '';
            var date = (modal.querySelector('#sbs-date') || {}).value || today();
            var who = selectedWho(modal);
            if(amount <= 0){ toast('Vul een bedrag in'); return false; }
            if(!isDeposit && amount > Number(g.saved || 0)){ toast('Je kunt niet meer opnemen dan gespaard ('+money(g.saved)+')'); return false; }
            if(!Array.isArray(g.log)) g.log = [];
            g.log.push({ date:date, amount:amount, type:type, note:note, who:who });
            if(isDeposit) g.saved = Number(g.saved || 0) + amount;
            else g.saved = Math.max(0, Number(g.saved || 0) - amount);
            persistSavings('saveSavingsTransaction');
            activity('💰','#dbeafe', who+' '+(isDeposit?'stortte':'nam op')+' '+money(amount)+' bij "'+g.name+'"');
            notif('💰','#dbeafe', (g.icon || '🎯')+' '+g.name, who+' '+(isDeposit?'+':'-')+money(amount)+' — '+note);
            if(isDeposit){ xp(2,'Spaartransactie'); }
            if(Number(g.saved || 0) >= Number(g.target || 0) && isDeposit){
              if(typeof window.queueUnlock === 'function') window.queueUnlock({ icon:g.icon || '🎯', type:'🎯 Spaardoel bereikt!', title:g.name, desc:money(g.target)+' gespaard!', who:who, confetti:true });
              xp(25,'Spaardoel bereikt');
            }
            render();
            toast(isDeposit ? 'Storting toegevoegd ✓' : 'Opname verwerkt ✓');
            return true;
          }}
        ]
      });
    });
  }

  function iconGrid(active){
    var icons = Array.isArray(window.GOAL_ICONS) ? window.GOAL_ICONS : GOAL_ICONS_FALLBACK;
    active = active || '🎯';
    return '<div class="fam-modal-field"><label>Icoon</label><div class="sbs-icon-grid">'
      +icons.map(function(ic){ return '<button type="button" class="sbs-icon-btn '+(ic===active?'active':'')+'" data-sbs-icon="'+esc(ic)+'">'+esc(ic)+'</button>'; }).join('')
      +'</div></div>';
  }

  function colorRow(active){
    active = active || '#2d5a27';
    return '<div class="fam-modal-field"><label>Kleur</label><div class="sbs-color-row">'
      +GOAL_COLORS.map(function(col){ return '<button type="button" class="sbs-color-btn '+(col===active?'active':'')+'" data-sbs-color="'+col+'" style="background:'+col+'"></button>'; }).join('')
      +'</div></div>';
  }

  function selectedIcon(modal){
    var btn = modal.querySelector('[data-sbs-icon].active');
    return btn ? btn.getAttribute('data-sbs-icon') : '🎯';
  }

  function selectedColor(modal){
    var btn = modal.querySelector('[data-sbs-color].active');
    return btn ? btn.getAttribute('data-sbs-color') : '#2d5a27';
  }

  function wirePickers(modal){
    modal.querySelectorAll('[data-sbs-icon]').forEach(function(btn){
      btn.onclick = function(){
        modal.querySelectorAll('[data-sbs-icon]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
      };
    });
    modal.querySelectorAll('[data-sbs-color]').forEach(function(btn){
      btn.onclick = function(){
        modal.querySelectorAll('[data-sbs-color]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
      };
    });
  }

  function openGoal(editId){
    ensureBottomSheet().then(function(){
      ensureStyles();
      if(!window.BottomSheet) return;
      var g = editId ? getGoal(editId) : null;
      window.BottomSheet.open({
        title: g ? '✏️ Spaardoel bewerken' : '🎯 Nieuw spaardoel',
        html: ''
          +'<div class="fam-modal-field"><label>Naam</label><input id="sbs-goal-name" placeholder="bijv. Vakantie" value="'+esc(g ? g.name : '')+'"></div>'
          +'<div class="fam-modal-field"><label>Doelbedrag (€)</label><input id="sbs-goal-target" type="number" min="1" step="1" placeholder="1000" value="'+esc(g ? g.target : '')+'"></div>'
          +(!g ? '<div class="fam-modal-field"><label>Startbedrag (€)</label><input id="sbs-goal-saved" type="number" min="0" step="1" placeholder="0" value="0"></div>' : '<div class="fam-modal-field"><label>Huidig gespaard (€)</label><input id="sbs-goal-saved" type="number" min="0" step="1" placeholder="0" value="'+esc(g.saved || 0)+'"></div>')
          +iconGrid(g ? g.icon : '🎯')
          +colorRow(g ? g.color : '#2d5a27'),
        onOpen: function(ctx){
          wirePickers(ctx.modal);
          var name = ctx.modal.querySelector('#sbs-goal-name');
          if(name) setTimeout(function(){ name.focus(); }, 80);
        },
        actions: [
          { label:'Annuleren' },
          { label:'Opslaan', primary:true, onClick:function(ctx){
            var modal = ctx.modal;
            var name = (modal.querySelector('#sbs-goal-name') || {}).value || '';
            name = name.trim();
            var target = parseFloat((modal.querySelector('#sbs-goal-target') || {}).value) || 0;
            var saved = parseFloat((modal.querySelector('#sbs-goal-saved') || {}).value) || 0;
            if(!name || target <= 0){ toast('Vul naam en doelbedrag in'); return false; }
            if(g){
              g.name = name;
              g.target = target;
              g.saved = Math.max(0, saved);
              g.icon = selectedIcon(modal);
              g.color = selectedColor(modal);
              persistSavings('saveSavingsGoal');
              toast('Spaardoel opgeslagen ✓');
            } else {
              var who = window.myName || 'Gezin';
              var newGoal = { id:getNextId(), name:name, icon:selectedIcon(modal), target:target, saved:Math.max(0,saved), who:'Beiden', color:selectedColor(modal), log:[] };
              if(saved > 0) newGoal.log.push({ date:today(), amount:saved, type:'deposit', note:'Startbedrag', who:who });
              getGoals().push(newGoal);
              persistSavings('createSavingsGoal');
              activity('🎯','#dbeafe', who+' maakte spaardoel "'+name+'" aan');
              xp(5,'Spaardoel aangemaakt');
              toast('Spaardoel aangemaakt ✓');
            }
            render();
            return true;
          }}
        ]
      });
    });
  }

  function override(){
    window.openSavingsSheet = openTransaction;
    window.openSavingsGoalSheet = openGoal;
  }

  function boot(){
    override();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(override, delay); });
  }

  window.SavingsBottomSheetBridge = { version:VERSION, boot:boot, openTransaction:openTransaction, openGoal:openGoal };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
