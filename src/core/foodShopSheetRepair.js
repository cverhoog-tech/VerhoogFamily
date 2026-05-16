'use strict';
// ============================================================
// FOOD SHOP SHEET REPAIR v0.339
// Restores the grocery add popup with autocomplete + emoji/category match.
// ============================================================

(function(){
  var VERSION = '0.339';

  var FALLBACK_ITEMS = [
    {n:'Melk',e:'🥛',c:'Zuivel',q:'1 liter'},
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
    {n:'Toiletpapier',e:'🧻',c:'Overig',q:'1 pak'}
  ];

  function getSuggestions(q){
    q = String(q || '').trim().toLowerCase();
    if(!q) return [];
    var all = (window.AC_SHOP || FALLBACK_ITEMS).concat((window.shopData || []).map(function(i){
      return { n:i.name, e:(i.photo && !String(i.photo).startsWith('http')) ? i.photo : '🛒', c:i.cat || 'Overig', q:i.qty || '1x' };
    }));
    var seen = {};
    return all.filter(function(item){
      if(!item || !item.n) return false;
      var k = String(item.n).toLowerCase();
      if(seen[k]) return false;
      seen[k] = true;
      return k.indexOf(q) > -1;
    }).slice(0, 8);
  }

  function guessItem(name){
    var results = getSuggestions(name);
    if(results.length) return results[0];
    var n = String(name || '').toLowerCase();
    if(n.indexOf('melk')>-1 || n.indexOf('yoghurt')>-1) return {e:'🥛',c:'Zuivel',q:'1x'};
    if(n.indexOf('kaas')>-1) return {e:'🧀',c:'Zuivel',q:'200g'};
    if(n.indexOf('brood')>-1) return {e:'🍞',c:'Brood',q:'1 brood'};
    if(n.indexOf('appel')>-1) return {e:'🍎',c:'Fruit',q:'1 zak'};
    if(n.indexOf('banaan')>-1) return {e:'🍌',c:'Fruit',q:'6 stuks'};
    if(n.indexOf('tomaat')>-1) return {e:'🍅',c:'Groente',q:'500g'};
    if(n.indexOf('kip')>-1) return {e:'🍗',c:'Vlees',q:'500g'};
    if(n.indexOf('gehakt')>-1 || n.indexOf('bief')>-1) return {e:'🥩',c:'Vlees',q:'500g'};
    if(n.indexOf('pasta')>-1 || n.indexOf('spaghetti')>-1) return {e:'🍝',c:'Overig',q:'500g'};
    if(n.indexOf('rijst')>-1) return {e:'🍚',c:'Overig',q:'1 kg'};
    return {e:'📦',c:'Overig',q:'1x'};
  }

  function shopFieldsHtml(){
    return '<div class="field"><label>Product</label>'
      +'<div class="ac-wrap" style="position:relative"><input id="f1" placeholder="bijv. Melk" autocomplete="off">'
      +'<div class="ac-dropdown" id="ac-shop" style="display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:99999;background:#fff;border:1px solid var(--c-border);border-radius:14px;box-shadow:0 12px 32px rgba(17,24,39,.14);overflow:hidden"></div></div></div>'
      +'<div class="field"><label>Hoeveelheid</label><input id="f2" placeholder="bijv. 2x, 500g"></div>'
      +'<div class="field"><label>Categorie</label><select id="f3">'
      +'<option>Groente</option><option>Fruit</option><option>Zuivel</option><option>Brood</option><option>Vlees</option><option>Dranken</option><option>Overig</option>'
      +'</select></div>'
      +'<div class="field"><label>Icoon</label><input id="f4" placeholder="Emoji" value="📦"></div>';
  }

  function attachAutocomplete(){
    var inp = document.getElementById('f1');
    var qty = document.getElementById('f2');
    var cat = document.getElementById('f3');
    var emoji = document.getElementById('f4');
    var drop = document.getElementById('ac-shop');
    if(!inp || !drop) return;

    function apply(item, moveFocus){
      if(!item) return;
      if(item.n) inp.value = item.n;
      if(qty && (!qty.value || moveFocus)) qty.value = item.q || '1x';
      if(cat && item.c) cat.value = item.c;
      if(emoji) emoji.value = item.e || '📦';
      drop.style.display = 'none';
      if(moveFocus && qty) qty.focus();
    }

    inp.oninput = function(){
      var value = inp.value.trim();
      var guessed = guessItem(value);
      if(value && emoji) emoji.value = guessed.e;
      if(value && cat) cat.value = guessed.c;
      if(value && qty && !qty.value) qty.value = guessed.q;
      var results = getSuggestions(value);
      if(!results.length){ drop.style.display = 'none'; return; }
      drop.style.display = 'block';
      drop.innerHTML = results.map(function(item){
        return '<button type="button" class="ac-item" data-name="'+String(item.n).replace(/"/g,'&quot;')+'" data-qty="'+String(item.q).replace(/"/g,'&quot;')+'" data-cat="'+String(item.c).replace(/"/g,'&quot;')+'" data-emoji="'+String(item.e).replace(/"/g,'&quot;')+'" style="width:100%;border:0;background:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer">'
          +'<span style="font-size:22px;width:28px;text-align:center">'+item.e+'</span>'
          +'<span style="flex:1"><b style="display:block;font-size:14px;color:var(--c-text)">'+item.n+'</b><small style="font-size:11px;color:var(--c-text2)">'+item.q+' · '+item.c+'</small></span>'
          +'</button>';
      }).join('');
      drop.querySelectorAll('.ac-item').forEach(function(btn){
        btn.onmousedown = btn.ontouchstart = function(ev){
          ev.preventDefault();
          apply({n:btn.dataset.name,q:btn.dataset.qty,c:btn.dataset.cat,e:btn.dataset.emoji}, true);
        };
      });
    };
    inp.onfocus = function(){ if(inp.value.trim()) inp.oninput(); };
    inp.onblur = function(){ setTimeout(function(){ drop.style.display = 'none'; }, 180); };
  }

  function openShopAdd(){
    var title = document.getElementById('sheet-title');
    var fields = document.getElementById('sheet-fields');
    var overlay = document.getElementById('add-overlay');
    if(!title || !fields || !overlay) return false;
    window.currentAddType = 'shop';
    title.textContent = 'Boodschap toevoegen';
    fields.innerHTML = shopFieldsHtml();
    overlay.classList.add('open');
    overlay.style.display = '';
    setTimeout(function(){
      attachAutocomplete();
      var f = document.getElementById('f1');
      if(f) f.focus();
    }, 30);
    return true;
  }

  function wrapOpenAdd(){
    if(typeof window.openAdd !== 'function' || window.openAdd.__foodShopSheetWrapped) return;
    var original = window.openAdd;
    window.openAdd = function(type){
      if(type === 'shop') return openShopAdd();
      return original.apply(this, arguments);
    };
    window.openAdd.__foodShopSheetWrapped = true;
  }

  function boot(){
    wrapOpenAdd();
    [100, 300, 800, 1500].forEach(function(delay){ setTimeout(wrapOpenAdd, delay); });
    try { window.dispatchEvent(new CustomEvent('familyapp:food-shop-sheet-repair-ready', { detail:{ version:VERSION } })); } catch(error) {}
  }

  window.FoodShopSheetRepair = { version: VERSION, openShopAdd: openShopAdd, attachAutocomplete: attachAutocomplete };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
