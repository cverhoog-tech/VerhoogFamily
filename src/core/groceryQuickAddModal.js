'use strict';
// GROCERY QUICK ADD v0.432 - classifier driven defaults + FamilyApp utility icon presentation.
(function(){
  var VERSION='0.432',STORAGE_KEY='familyapp_food_shop_v001',STYLE_ID='grocery-bottom-sheet-style';
  var FALLBACK_ITEMS=[{n:'Melk',e:'🥛',c:'Zuivel',q:'1 l'},{n:'Kaas',e:'🧀',c:'Zuivel',q:'200 g'},{n:'Eieren',e:'🥚',c:'Zuivel',q:'6 st'},{n:'Brood',e:'🍞',c:'Brood',q:'1 st'},{n:'Bananen',e:'🍌',c:'Fruit',q:'6 st'},{n:'Appels',e:'🍎',c:'Fruit',q:'1 kg'},{n:'Tomaten',e:'🍅',c:'Groente',q:'500 g'},{n:'Kipfilet',e:'🍗',c:'Vlees',q:'500 g'},{n:'Pasta',e:'🍝',c:'Voorraad',q:'500 g'},{n:'Water',e:'💧',c:'Dranken',q:'1.5 l'}];

  function safeParse(raw,f){try{return raw?JSON.parse(raw):f;}catch(e){return f;}}
  function ensureState(){if(!Array.isArray(window.shopData))window.shopData=safeParse(localStorage.getItem(STORAGE_KEY),[]);window.shopNextId=Math.max.apply(null,(window.shopData||[]).map(function(i){return Number(i.id)||0;}).concat([0]))+1;}
  function allSuggestions(){ensureState();var prev=(window.shopData||[]).map(function(i){return{n:i.name,e:i.photo||'🛒',c:i.cat||'Overig',q:i.qty||'1 st'};}),all=(window.AC_SHOP||FALLBACK_ITEMS).concat(prev),seen={};return all.filter(function(i){var k=i&&i.n&&String(i.n).toLowerCase();if(!k||seen[k])return false;seen[k]=true;return true;});}
  function getSuggestions(q){q=String(q||'').trim().toLowerCase();return q?allSuggestions().filter(function(i){return String(i.n).toLowerCase().indexOf(q)>-1;}).slice(0,8):[];}
  function utility(c,e,size){var r=window.FamilyAppUtilityIconResolver;return r&&typeof r.render==='function'?r.render(c,e,{size:size||'lg'}):e;}
  function toast(msg){if(typeof window.showToast==='function')window.showToast(msg);}

  function classifierGuess(query){if(window.GroceryProductClassifier&&typeof window.GroceryProductClassifier.classify==='function'){var r=window.GroceryProductClassifier.classify(query);return {e:r.icon||'📦',c:r.category||'Overig',q:r.qty||'1 st',confidence:r.confidence||0};}return null;}
  function guess(query){var learned=getSuggestions(query)[0],classified=classifierGuess(query);if(classified&&classified.confidence>0)return classified;if(learned)return learned;return classified||{e:'📦',c:'Overig',q:'1 st'};}
  function splitQty(qty){var raw=String(qty||'').trim(),m=raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|l|ml|st|stuk|stuks|pak|zak|fles|flessen|rol|bak|brood)?$/i);if(!m)return{amount:raw||'1',unit:'st'};var unit=(m[2]||'st').toLowerCase();if(unit==='stuk'||unit==='stuks')unit='st';return{amount:m[1].replace(',','.'),unit:unit};}
  function composeQty(amount,unit){return (String(amount||'1').trim()||'1')+' '+(String(unit||'st').trim()||'st');}
  function categoryOptions(){var cats=window.GroceryProductClassifier&&typeof window.GroceryProductClassifier.categories==='function'?window.GroceryProductClassifier.categories():['Groente','Fruit','Zuivel','Brood','Vlees','Dranken','Overig'];return cats.map(function(c){return '<option>'+c+'</option>';}).join('');}

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent=''
      +'.grocery-sheet-grid{display:grid;grid-template-columns:1fr 112px;gap:10px}.grocery-qty-grid{display:grid;grid-template-columns:1fr 92px;gap:8px}'
      +'.grocery-auto-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--c-border);border-radius:14px;background:var(--c-surface2);margin-bottom:12px}.grocery-auto-icon,.grocery-icon-preview{width:42px;height:42px;border-radius:13px;background:var(--c-surface);border:1px solid var(--c-border);display:grid;place-items:center;flex-shrink:0}.grocery-icon-preview{margin:auto}'
      +'.grocery-auto-title{font-size:12px;font-weight:800;color:var(--c-text)}.grocery-auto-meta{font-size:11px;color:var(--c-text2);margin-top:2px}'
      +'.grocery-suggestions{display:none;margin-top:8px;border:1px solid var(--c-border);border-radius:16px;overflow:hidden;background:var(--c-surface)}.grocery-suggestion{width:100%;border:0;background:var(--c-surface);padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left}.grocery-suggestion-emoji{width:34px;height:34px;display:grid;place-items:center;flex:none}.grocery-suggestion-title{display:block;font-size:14px;color:var(--c-text);font-weight:900}.grocery-suggestion-meta{font-size:11px;color:var(--c-text2)}';document.head.appendChild(s);
  }

  function activeListLabel(){var r=window.ShoppingLists&&ShoppingLists.active?ShoppingLists.active():null;return r&&r.list?r.list.name:'Gezinslijst';}
  function sheetHtml(){var fallback=utility('Overig','📦','lg');return '<div style="font-size:11px;font-weight:800;color:var(--c-primary);margin:-4px 0 10px">Toevoegen aan · '+activeListLabel()+'</div>'
      +'<div class="fam-modal-field"><label>Product</label><input id="grocery-name" autocomplete="off" placeholder="bijv. Melk, broccoli, laptop"><div class="grocery-suggestions" id="grocery-suggestions"></div></div>'
      +'<div class="grocery-auto-row"><div class="grocery-auto-icon" id="grocery-auto-icon">'+fallback+'</div><div><div class="grocery-auto-title">Automatisch herkend</div><div class="grocery-auto-meta" id="grocery-auto-meta">Overig · 1 st</div></div></div>'
      +'<div class="grocery-sheet-grid"><div class="fam-modal-field"><label>Hoeveelheid</label><div class="grocery-qty-grid"><input id="grocery-amount" inputmode="decimal" value="1"><select id="grocery-unit"><option>st</option><option>g</option><option>kg</option><option>ml</option><option>l</option><option>pak</option><option>zak</option><option>fles</option><option>rol</option><option>bak</option></select></div></div><div class="fam-modal-field"><label>Icoon</label><div class="grocery-icon-preview" id="grocery-icon-preview">'+fallback+'</div><input id="grocery-emoji" type="hidden" value="📦"></div></div>'
      +'<div class="fam-modal-field"><label>Categorie</label><select id="grocery-cat">'+categoryOptions()+'</select></div>';}

  function applyGuessToFields(g,q,e,c,meta,forceQty){e.value=g.e;c.value=g.c;var parts=splitQty(g.q);if(forceQty||!q.value||q.dataset.auto==='1'){q.value=parts.amount;var unit=q.ownerDocument.getElementById('grocery-unit');if(unit)unit.value=Array.prototype.some.call(unit.options,function(o){return o.value===parts.unit;})?parts.unit:'st';q.dataset.auto='1';}if(meta)meta.textContent=g.c+' · '+g.q;var html=utility(g.c,g.e,'lg'),icon=e.ownerDocument.getElementById('grocery-auto-icon'),preview=e.ownerDocument.getElementById('grocery-icon-preview');if(icon)icon.innerHTML=html;if(preview)preview.innerHTML=html;}
  function attachAutocomplete(m){var n=m.querySelector('#grocery-name'),q=m.querySelector('#grocery-amount'),unit=m.querySelector('#grocery-unit'),e=m.querySelector('#grocery-emoji'),c=m.querySelector('#grocery-cat'),box=m.querySelector('#grocery-suggestions'),meta=m.querySelector('#grocery-auto-meta');q.oninput=function(){q.dataset.auto='0';};unit.onchange=function(){q.dataset.auto='0';};c.onchange=function(){c.dataset.manual='1';};function input(){var g=guess(n.value),r=getSuggestions(n.value);if(n.value){if(c.dataset.manual==='1')g.c=c.value;applyGuessToFields(g,q,e,c,meta,false);}box.innerHTML=r.map(function(i,x){return '<button class="grocery-suggestion" data-i="'+x+'"><span class="grocery-suggestion-emoji">'+utility(i.c,i.e,'md')+'</span><span><b class="grocery-suggestion-title">'+i.n+'</b><small class="grocery-suggestion-meta">'+i.q+' · '+i.c+'</small></span></button>';}).join('');box.style.display=r.length?'block':'none';box.querySelectorAll('[data-i]').forEach(function(b){b.onclick=function(){var i=r[+b.getAttribute('data-i')];n.value=i.n;c.dataset.manual='';applyGuessToFields(i,q,e,c,meta,true);box.style.display='none';q.focus();};});}n.oninput=input;setTimeout(function(){n.focus();},80);}
  function values(m){var n=m.querySelector('#grocery-name'),q=m.querySelector('#grocery-amount'),unit=m.querySelector('#grocery-unit'),e=m.querySelector('#grocery-emoji'),c=m.querySelector('#grocery-cat'),name=n.value.trim(),g=guess(name);return{name:name,qty:composeQty(q.value||splitQty(g.q).amount,unit.value||splitQty(g.q).unit),emoji:e.value||g.e,cat:c.value||g.c};}

  function saveFromModal(m,close){
    ensureState();
    var v=values(m);
    if(!v.name){toast('Vul eerst een productnaam in');return false;}
    var item={id:window.shopNextId++,name:v.name,qty:v.qty,cat:v.cat,who:window.myName||'Gezin',done:false,photo:v.emoji,createdAt:Date.now()};
    var lists=window.ShoppingLists;
    if(lists&&typeof lists.addItem==='function'&&lists.active()){
      var submit=m.querySelector('.fam-modal-primary');
      if(submit){submit.disabled=true;submit.textContent='Toevoegen…';}
      Promise.resolve().then(function(){return lists.addItem(item);}).then(function(saved){
        if(!saved)throw new Error('Boodschappenlijst kon item niet opslaan');
        toast('Toegevoegd aan '+activeListLabel()+' ✓');
        if(typeof window.addActivity==='function')window.addActivity('🛒','#fff3dc',(window.myName||'Gezin')+' voegde "'+v.name+'" toe');
        if(typeof close==='function')close();
      }).catch(function(error){
        console.error('[GroceryQuickAdd] add failed',error);
        if(submit){submit.disabled=false;submit.textContent='Toevoegen';}
        toast('Toevoegen mislukt. Probeer opnieuw.');
      });
      return false;
    }
    window.shopData.unshift(item);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(window.shopData));}catch(error){}
    if(typeof window.renderShop==='function')window.renderShop();
    toast('Boodschap toegevoegd ✓');
    if(typeof window.addActivity==='function')window.addActivity('🛒','#fff3dc',(window.myName||'Gezin')+' voegde "'+v.name+'" toe');
    if(typeof close==='function')close();
    return false;
  }

  function open(){ensureState();ensureStyles();if(!window.BottomSheet)return window.openAdd&&window.openAdd('shop');BottomSheet.open({title:'Item toevoegen',html:sheetHtml(),onOpen:function(ctx){attachAutocomplete(ctx.modal);},actions:[{label:'Annuleren'},{label:'Toevoegen',primary:true,keepOpen:true,onClick:function(ctx){return saveFromModal(ctx.modal,ctx.close);}}]});}
  function installButton(){var screen=document.getElementById('screen-shop'),header=screen&&screen.querySelector('.list-header');if(!header)return;var btn=header.querySelector('.add-btn');if(!btn){btn=document.createElement('button');btn.className='add-btn';header.appendChild(btn);}btn.onclick=function(e){if(e)e.preventDefault();open();return false;};btn.textContent='+ Toevoegen';}
  function boot(){ensureStyles();installButton();[100,300,800,1500].forEach(function(d){setTimeout(installButton,d);});}
  window.GroceryQuickAddModal={version:VERSION,open:open,installButton:installButton,guess:guess,getSuggestions:getSuggestions};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
