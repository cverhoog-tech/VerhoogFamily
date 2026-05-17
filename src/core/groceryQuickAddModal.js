'use strict';
// ============================================================
// GROCERY QUICK ADD v0.353
// Uses the new ModalManager/BottomSheet foundation.
// Keeps smart suggestions, emoji/category matching and repository persistence.
// ============================================================

(function(){
  var VERSION = '0.353';
  var STORAGE_KEY = 'familyapp_food_shop_v001';
  var STYLE_ID = 'grocery-bottom-sheet-style';

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
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.grocery-sheet-grid{display:grid;grid-template-columns:1fr 86px;gap:10px}',
      '.grocery-suggestions{display:none;margin-top:8px;border:1px solid var(--c-border,#edf0ec);border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(17,24,39,.13)}',
      '.grocery-suggestion{width:100%;border:0;background:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer}',
      '.grocery-suggestion:active{background:#f3f7f0}',
      '.grocery-suggestion-emoji{font-size:23px;width:28px;text-align:center}',
      '.grocery-suggestion-title{display:block;font-size:14px;color:var(--c-text,#1f2933);font-weight:900}',
      '.grocery-suggestion-meta{font-size:11px;color:var(--c-text2,#697386)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function sheetHtml(){
    return ''
      +'<div class="fam-modal-field"><label>Product</label><input id="grocery-name" autocomplete="off" placeholder="bijv. Melk"><div class="grocery-suggestions" id="grocery-suggestions"></div></div>'
      +'<div class="grocery-sheet-grid">'
      +'<div class="fam-modal-field"><label>Hoeveelheid</label><input id="grocery-qty" placeholder="1x"></div>'
      +'<div class="fam-modal-field"><label>Icoon</label><input id="grocery-emoji" value="📦"></div>'
      +'</div>'
      +'<div class="fam-modal-field"><label>Categorie</label><select id="grocery-cat"><option>Groente</option><option>Fruit</option><option>Zuivel</option><option>Brood</option><option>Vlees</option><option>Dranken</option><option>Overig</option></select></div>';
  }

  function attachAutocomplete(modal){
    var name = modal.querySelector('#grocery-name');
    var qty = modal.querySelector('#grocery-qty');
    var emoji = modal.querySelector('#grocery-emoji');
    var cat = modal.querySelector('#grocery-cat');
    var box = modal.querySelector('#grocery-suggestions');
    if(!name || !box) return;

    function apply(item){
      if(!item) return;
      name.value = item.n || name.value;
      if(qty) qty.value = item.q || '1x';
      if(emoji) emoji.value = item.e || '📦';
      if(cat) cat.value = item.c || 'Overig';
      box.style.display = 'none';
      if(qty) qty.focus();
    }

    function onInput(){
      var value = name.value.trim();
      var g = guess(value);
      if(value){
        if(emoji) emoji.value = g.e || '📦';
        if(cat) cat.value = g.c || 'Overig';
        if(qty && !qty.value) qty.value = g.q || '1x';
      }
      var results = getSuggestions(value);
      if(!results.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
      box.style.display = 'block';
      box.innerHTML = results.map(function(item, index){
        return '<button class="grocery-suggestion" data-i="'+index+'" type="button"><span class="grocery-suggestion-emoji">'+item.e+'</span><span style="flex:1"><b class="grocery-suggestion-title">'+item.n+'</b><small class="grocery-suggestion-meta">'+item.q+' · '+item.c+'</small></span></button>';
      }).join('');
      box.querySelectorAll('[data-i]').forEach(function(btn){
        btn.onclick = function(){ apply(results[parseInt(btn.getAttribute('data-i'),10)]); };
      });
    }

    name.oninput = onInput;
    name.onfocus = function(){ if(name.value.trim()) onInput(); };
    setTimeout(function(){ name.focus(); }, 80);
  }

  function valuesFrom(modal){
    var name = modal.querySelector('#grocery-name');
    var qty = modal.querySelector('#grocery-qty');
    var emoji = modal.querySelector('#grocery-emoji');
    var cat = modal.querySelector('#grocery-cat');
    var value = name ? name.value.trim() : '';
    var g = guess(value);
    return {
      name: value,
      qty: qty && qty.value ? qty.value : (g.q || '1x'),
      emoji: emoji && emoji.value ? emoji.value : (g.e || '📦'),
      cat: cat && cat.value ? cat.value : (g.c || 'Overig')
    };
  }

  function saveFromModal(modal){
    ensureState();
    var v = valuesFrom(modal);
    if(!v.name) return true;
    window.shopData.unshift({
      id: window.shopNextId++,
      name: v.name,
      qty: v.qty,
      cat: v.cat,
      who: window.myName || 'Gezin',
      done: false,
      photo: v.emoji
    });
    persist();
    if(typeof window.renderShop === 'function') window.renderShop();
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.addActivity === 'function') window.addActivity('🛒','#fff3dc',(window.myName || 'Gezin')+' voegde "'+v.name+'" toe');
    if(typeof window.showToast === 'function') window.showToast('Boodschap toegevoegd ✓');
    return true;
  }

  function open(){
    ensureState();
    ensureStyles();
    if(!window.ModalManager || !window.BottomSheet){
      if(typeof window.openAdd === 'function') return window.openAdd('shop');
      return;
    }
    window.BottomSheet.open({
      title: '🛒 Boodschap toevoegen',
      html: sheetHtml(),
      onOpen: function(ctx){ attachAutocomplete(ctx.modal); },
      actions: [
        { label: 'Annuleren' },
        { label: 'Toevoegen', primary: true, onClick: function(ctx){ return saveFromModal(ctx.modal); } }
      ]
    });
  }

  function installButton(){
    var screen = document.getElementById('screen-shop');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;
    var btn = header.querySelector('.add-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.textContent = '+ Toevoegen';
      header.appendChild(btn);
    }
    btn.setAttribute('onclick','return GroceryQuickAddModal.open()');
    btn.onclick = function(e){ if(e) e.preventDefault(); open(); return false; };
    btn.textContent = '+ Toevoegen';
    btn.style.pointerEvents = 'auto';
  }

  function boot(){
    ensureStyles();
    installButton();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(installButton, delay); });
  }

  window.GroceryQuickAddModal = { version: VERSION, open: open, installButton: installButton, guess: guess, getSuggestions: getSuggestions };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
