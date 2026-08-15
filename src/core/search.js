'use strict';
// ============================================================
// GLOBAL SEARCH v2.0
// Context-safe UI facade over SearchContextService.
// ============================================================
function openSearch() {
  var ov=document.getElementById('search-overlay');
  if(ov){ov.style.display='flex';setTimeout(function(){var i=document.getElementById('search-inp');if(i)i.focus();},100);}
  var inp=document.getElementById('search-inp');
  if(inp){inp.value='';inp.oninput=function(){runSearch(inp.value);};}
}
function closeSearch(){var ov=document.getElementById('search-overlay');if(ov)ov.style.display='none';}
function searchEsc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function runSearch(q){
  var el=document.getElementById('search-results');if(!el)return;
  q=String(q||'').trim();
  if(q.length<2){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3);font-size:14px">Begin met typen...</div>';return;}
  var svc=window.SearchContextService;
  if(!svc||typeof svc.search!=='function'){
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3)">Zoeken is nog niet beschikbaar</div>';return;
  }
  var results=[];try{results=svc.search(q,{limit:60});}catch(err){
    if(err&&err.code==='SEARCH_CONTEXT_CHANGED')return runSearch(q);
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3)">Zoeken is tijdelijk niet beschikbaar</div>';return;
  }
  if(!results.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3)">Geen resultaten voor "'+searchEsc(q)+'"</div>';return;}
  var grouped={};results.forEach(function(r){if(!grouped[r.type])grouped[r.type]=[];grouped[r.type].push(r);});
  var allR=[];Object.keys(grouped).forEach(function(type){grouped[type].forEach(function(r){allR.push(r);});});
  el.innerHTML=Object.keys(grouped).map(function(type){return '<div class="search-section-title">'+searchEsc(type)+'</div>'+grouped[type].map(function(r){return '<div class="search-result-item"><div style="font-size:20px;width:28px;flex-shrink:0">'+searchEsc(r.icon)+'</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--c-text)">'+searchEsc(r.label)+'</div>'+(r.sub?'<div style="font-size:11px;color:var(--c-text2)">'+searchEsc(r.sub)+'</div>':'')+'</div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>';}).join('');}).join('');
  el.querySelectorAll('.search-result-item').forEach(function(item,i){item.onclick=function(){var r=allR[i];closeSearch();if(!r)return;if(r.kind==='recipe'){if(typeof window.showScreen==='function')showScreen('recipes');setTimeout(function(){if(typeof window.openRecipeDetail==='function')openRecipeDetail(r.id);},200);return;}if(r.screen==='shop'&&typeof window.showScreenMore==='function'){showScreenMore('shop');return;}if(typeof window.showScreen==='function')showScreen(r.screen);};});
}
