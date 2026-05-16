'use strict';
// ============================================================
// GROCERY QUICK ADD MODAL v0.340
// Independent grocery add flow. Does not depend on legacy add-overlay,
// openAdd(), addSheet.js, or the async AppModules loader.
// ============================================================

(function(){
  var VERSION = '0.340';
  var STORAGE_KEY = 'familyapp_food_shop_v001';
  var modalId = 'grocery-quick-add-modal';

  var FALLBACK_ITEMS = [
    {n:'Melk',e:'🥛',c:'Zuivel',q:'1 liter'},
    {n:'Halfvolle melk',e:'🥛',c:'Zuivel',q:'1 liter'},
    {n:'Kaas',e:'🧀',c:'Zuivel',q:'200g'},
    {n:'Eieren',e:'🥚',c:'Zuivel',q:'6 stuks'},
    {n:'Brood',e:'🍞',c:'Brood',q:'1 brood'},
    {n:'Bananen',e:'🍌',c:'Fruit',q:'6 stuks'},
    {n:'Appels',e:'🍎',c:'Fruit',q:'1 zak'},
    {n:'Tomaten',e:'🍅',c:'Groente',q:'500g'},
    {n:'Paprika',e:'🫑',c:'Groente',q:'2 stuks'},
    {n:'Komkommer',e:'🥒',c:'Groente',q:'1 stuk'},
    {n:'Aardappelen',e:'🥔',c:'Groente',q:'1 kg'},
    {n:'Kipfilet',e:'🍗',c:'Vlees',q:'500g'},
    {n:'Gehakt',e:'🥩',c:'Vlees',q:'500g'},
    {n:'Pasta',e:'🍝',c:'Overig',q:'500g'},
    {n:'Rijst',e:'🍚',c:'Overig',q:'1 kg'},
    {n:'Olijfolie',e:'🫙',c:'Overig',q:'1 fles'},
    {n:'Cola',e:'🥤',c:'Dranken',q:'1.5 liter'},
    {n:'Water',e:'💧',c:'Dranken',q:'6 flessen'},
    {n:'Toiletpapier',e:'🧻',c:'Overig',q:'1 pak'},
    {n:'Wasmiddel',e:'🧺',c:'Overig',q:'1 fles'}
  ];

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch(error) { return fallback; }
  }

  function ensureState(){
    if(!Array.isArray(window.shopData)) window.shopData = safeParse(localStorage.getItem(STORAGE_KEY), []);
    window.shopNextId = Math.max.apply(null, (window.shopData || []).map(function(item){ return Number(item.id) || 0; }).concat([0])) + 1;
  }

  function persist(){
    ensureState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.shopData || []));
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('groceries', window.shopData || [], { source:'groceryQuickAddModal', operation:'saveGroceries', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:grocery-updated', { detail:{ items:window.shopData || [] } })); } catch(error) {}
  }

  function allSuggestions(){
    ensureState();
    var prev = (window.shopData || []).map(function(item){
      return { n:item.name, e:(item.photo && !String(item.photo).startsWith('http')) ? item.photo : '🛒', c:item.cat || 'Overig', q:item.qty || '1x' };
    });
    var all = (window.AC_SHOP || FALLBACK_ITEMS).concat(prev);
    var seen = {};
    return all.filter(function(item){
      if(!item || !item.n) return false;
      var key = String(item.n).toLowerCase();
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function getSuggestions(query){
    var q = String(query || '').trim().toLowerCase();
    if(!q) return [];
    return allSuggestions().filter(function(item){ return String(item.n).toLowerCase().indexOf(q) > -1; }).slice(0, 8);
  }

  function guess(query){
    var found = getSuggestions(query)[0];
    if(found) return found;
    var q = String(query || '').toLowerCase();
    if(q.indexOf('melk')>-1 || q.indexOf('yoghurt')>-1 || q.indexOf('kwark')>-1) return {e:'🥛',c:'Zuivel',q:'1x'};
    if(q.indexOf('kaas')>-1) return {e:'🧀',c:'Zuivel',q:'200g'};
    if(q.indexOf('ei')>-1) return {e:'🥚',c:'Zuivel',q:'6 stuks'};
    if(q.indexOf('brood')>-1) return {e:'🍞',c:'Brood',q:'1 brood'};
    if(q.indexOf('appel')>-1) return {e:'🍎',c:'Fruit',q:'1 zak'};
    if(q.indexOf('banaan')>-1) return {e:'🍌',c:'Fruit',q:'6 stuks'};
    if(q.indexOf('tomaat')>-1) return {e:'🍅',c:'Groente',q:'500g'};
    if(q.indexOf('komkommer')>-1) return {e:'🥒',c:'Groente',q:'1 stuk'};
    if(q.indexOf('aardappel')>-1) return {e:'🥔',c:'Groente',q:'1 kg'};
    if(q.indexOf('kip')>-1) return {e:'🍗',c:'Vlees',q:'500g'};
    if(q.indexOf('gehakt')>-1 || q.indexOf('rund')>-1) return {e:'🥩',c:'Vlees',q:'500g'};
    if(q.indexOf('pasta')>-1 || q.indexOf('spaghetti')>-1) return {e:'🍝',c:'Overig',q:'500g'};
    if(q.indexOf('rijst')>-1) return {e:'🍚',c:'Overig',q:'1 kg'};
    if(q.indexOf('cola')>-1) return {e:'🥤',c:'Dranken',q:'1.5 liter'};
    if(q.indexOf('water')>-1) return {e:'💧',c:'Dranken',q:'6 flessen'};
    return {e:'📦',c:'Overig',q:'1x'};
  }

  function ensureStyles(){
    if(document.getElementById('grocery-quick-add-style')) return;
    var style = document.createElement('style');
    style.id = 'grocery-quick-add-style';
    style.textContent = [
      '#'+modalId+'{position:fixed!important;inset:0!important;z-index:999999!important;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.46)!important}',
      '#'+modalId+'.open{display:flex!important}',
      '#'+modalId+' .gqa-sheet{width:100%;max-width:480px;background:var(--c-sheet-bg,#fff);border-radius:24px 24px 0 0;padding:18px 16px 34px;box-shadow:0 -18px 45px rgba(0,0,0,.22)}',
      '#'+modalId+' .gqa-title{font-size:20px;font-weight:950;color:var(--c-text,#1f2933);margin-bottom:14px}',
      '#'+modalId+' label{display:block;font-size:11px;font-weight:900;color:var(--c-text2,#697386);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px}',
      '#'+modalId+' input,#'+modalId+' select{width:100%;border:1.5px solid var(--c-border,#edf0ec);border-radius:18px;padding:12px;font-size:15px;background:var(--c-input-bg,#fff);color:var(--c-text,#1f2933);outline:none}',
      '#'+modalId+' input:focus,#'+modalId+' select:focus{border-color:var(--c-primary,#3f7f2f)}',
      '#'+modalId+' .gqa-row{display:grid;grid-template-columns:1fr 88px;gap:10px}',
      '#'+modalId+' .gqa-actions{display:flex;gap:10px;margin-top:16px}',
      '#'+modalId+' .gqa-btn{flex:1;border:0;border-radius:18px;padding:14px;font-size:15px;font-weight:950}',
      '#'+modalId+' .gqa-save{background:var(--c-primary,#3f7f2f);color:#fff}',
      '#'+modalId+' .gqa-cancel{background:var(--c-surface2,#f8faf7);color:var(--c-text2,#697386)}',
      '#'+modalId+' .gqa-suggestions{display:none;margin-top:8px;border:1px solid var(--c-border,#edf0ec);border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(17,24,39,.13)}',
      '#'+modalId+' .gqa-suggestion{width:100%;border:0;background:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left}',
      '#'+modalId+' .gqa-suggestion:active{background:#f3f7f0}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureModal(){
    ensureStyles();
    var modal = document.getElementById(modalId);
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = modalId;
    modal.innerHTML = '<div class="gqa-sheet">'
      +'<div style="width:42px;height:4px;background:var(--c-border,#edf0ec);border-radius:99px;margin:0 auto 16px"></div>'
      +'<div class="gqa-title">🛒 Boodschap toevoegen</div>'
      +'<label>Product</label><input id="gqa-name" placeholder="bijv. Melk" autocomplete="off">'
      +'<div class="gqa-suggestions" id="gqa-suggestions"></div>'
      +'<div class="gqa-row"><div><label>Hoeveelheid</label><input id="gqa-qty" placeholder="1x"></div><div><label>Icoon</label><input id="gqa-emoji" value="📦"></div></div>'
      +'<label>Categorie</label><select id="gqa-cat"><option>Groente</option><option>Fruit</option><option>Zuivel</option><option>Brood</option><option>Vlees</option><option>Dranken</option><option>Overig</option></select>'
      +'<div class="gqa-actions"><button class="gqa-btn gqa-cancel" id="gqa-cancel">Annuleren</button><button class="gqa-btn gqa-save" id="gqa-save">Toevoegen</button></div>'
      +'</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e){ if(e.target === modal) close(); });
    modal.querySelector('#gqa-cancel').onclick = close;
    modal.querySelector('#gqa-save').onclick = save;
    modal.querySelector('#gqa-name').oninput = onInput;
    return modal;
  }

  function onInput(){
    var name = document.getElementById('gqa-name');
    var qty = document.getElementById('gqa-qty');
    var emoji = document.getElementById('gqa-emoji');
    var cat = document.getElementById('gqa-cat');
    var box = document.getElementById('gqa-suggestions');
    if(!name || !box) return;
    var g = guess(name.value);
    if(name.value.trim()){
      if(emoji) emoji.value = g.e || '📦';
      if(cat) cat.value = g.c || 'Overig';
      if(qty && !qty.value) qty.value = g.q || '1x';
    }
    var results = getSuggestions(name.value);
    if(!results.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
    box.style.display = 'block';
    box.innerHTML = results.map(function(item, index){
      return '<button class="gqa-suggestion" data-i="'+index+'" type="button"><span style="font-size:23px;width:28px;text-align:center">'+item.e+'</span><span style="flex:1"><b style="display:block;font-size:14px;color:#1f2933">'+item.n+'</b><small style="font-size:11px;color:#697386">'+item.q+' · '+item.c+'</small></span></button>';
    }).join('');
    box.querySelectorAll('.gqa-suggestion').forEach(function(btn){
      btn.onclick = function(){
        var item = results[parseInt(btn.getAttribute('data-i'),10)];
        if(!item) return;
        name.value = item.n;
        if(qty) qty.value = item.q;
        if(emoji) emoji.value = item.e;
        if(cat) cat.value = item.c;
        box.style.display = 'none';
        if(qty) qty.focus();
      };
    });
  }

  function open(){
    ensureState();
    var modal = ensureModal();
    modal.classList.add('open');
    ['gqa-name','gqa-qty'].forEach(function(id){ var el = document.getElementById(id); if(el) el.value = ''; });
    var e = document.getElementById('gqa-emoji'); if(e) e.value = '📦';
    var c = document.getElementById('gqa-cat'); if(c) c.value = 'Overig';
    var box = document.getElementById('gqa-suggestions'); if(box){ box.style.display = 'none'; box.innerHTML = ''; }
    setTimeout(function(){ var n = document.getElementById('gqa-name'); if(n) n.focus(); }, 40);
  }

  function close(){
    var modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('open');
  }

  function save(){
    ensureState();
    var name = document.getElementById('gqa-name');
    var qty = document.getElementById('gqa-qty');
    var emoji = document.getElementById('gqa-emoji');
    var cat = document.getElementById('gqa-cat');
    var value = name ? name.value.trim() : '';
    if(!value) return close();
    var g = guess(value);
    var item = {
      id: window.shopNextId++,
      name: value,
      qty: qty && qty.value ? qty.value : (g.q || '1x'),
      cat: cat && cat.value ? cat.value : (g.c || 'Overig'),
      who: window.myName || 'Gezin',
      done: false,
      photo: emoji && emoji.value ? emoji.value : (g.e || '📦')
    };
    window.shopData.unshift(item);
    persist();
    if(typeof window.renderShop === 'function') window.renderShop();
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.addActivity === 'function') window.addActivity('🛒','#fff3dc',(window.myName || 'Gezin')+' voegde "'+value+'" toe');
    if(typeof window.showToast === 'function') window.showToast('Boodschap toegevoegd ✓');
    close();
  }

  function installButton(){
    var screen = document.getElementById('screen-shop');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;
    var oldBtn = header.querySelector('.add-btn');
    if(oldBtn){
      oldBtn.setAttribute('onclick','GroceryQuickAddModal.open()');
      oldBtn.onclick = function(e){ e.preventDefault(); open(); return false; };
      oldBtn.textContent = '+ Toevoegen';
      oldBtn.style.pointerEvents = 'auto';
      return;
    }
    var btn = document.createElement('button');
    btn.className = 'add-btn';
    btn.textContent = '+ Toevoegen';
    btn.onclick = function(e){ e.preventDefault(); open(); return false; };
    header.appendChild(btn);
  }

  function boot(){
    ensureStyles();
    ensureModal();
    installButton();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(installButton, delay); });
  }

  window.GroceryQuickAddModal = { version: VERSION, open: open, close: close, save: save, installButton: installButton };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
