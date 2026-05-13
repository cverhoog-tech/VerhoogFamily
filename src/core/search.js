'use strict';
// ============================================================
// GLOBAL SEARCH
// ============================================================
function openSearch() {
  var ov=document.getElementById('search-overlay');
  if(ov){ov.style.display='flex';setTimeout(function(){var i=document.getElementById('search-inp');if(i)i.focus();},100);}
  var inp=document.getElementById('search-inp');
  if(inp){inp.value='';inp.oninput=function(){runSearch(inp.value.toLowerCase());};}
}
function closeSearch(){var ov=document.getElementById('search-overlay');if(ov)ov.style.display='none';}
function runSearch(q){
  var el=document.getElementById('search-results');if(!el)return;
  if(!q||q.length<2){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3);font-size:14px">Begin met typen...</div>';return;}
  var results=[];
  taskData.filter(function(t){return t.title&&t.title.toLowerCase().indexOf(q)>-1;}).forEach(function(t){
    results.push({type:'Taak',icon:'✅',label:t.title,sub:t.done?'Gedaan':'Open',action:function(){closeSearch();showScreen('tasks');}});
  });
  recipesData.filter(function(r){return r.name&&r.name.toLowerCase().indexOf(q)>-1;}).forEach(function(r){
    results.push({type:'Recept',icon:'🍳',label:r.name,sub:r.cat,action:function(){closeSearch();showScreen('recipes');setTimeout(function(){openRecipeDetail(r.id);},200);}});
  });
  shopData.filter(function(s){return s.name&&s.name.toLowerCase().indexOf(q)>-1;}).forEach(function(s){
    results.push({type:'Boodschap',icon:'🛒',label:s.name,sub:s.qty||s.cat||'',action:function(){closeSearch();showScreenMore('shop');}});
  });
  (noteData||[]).filter(function(n){return n.title&&n.title.toLowerCase().indexOf(q)>-1;}).forEach(function(n){
    results.push({type:'Notitie',icon:'📝',label:n.title,sub:'',action:function(){closeSearch();showScreen('notes');}});
  });
  calData.filter(function(e){return e.title&&e.title.toLowerCase().indexOf(q)>-1;}).forEach(function(e){
    results.push({type:'Agenda',icon:'📅',label:e.title,sub:formatDate(e.date),action:function(){closeSearch();showScreen('cal');}});
  });
  if(!results.length){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--c-text3)">Geen resultaten voor "'+q+'"</div>';return;}
  var grouped={};results.forEach(function(r){if(!grouped[r.type])grouped[r.type]=[];grouped[r.type].push(r);});
  var allR=[]; Object.values(grouped).forEach(function(a){a.forEach(function(r){allR.push(r);});});
  el.innerHTML=Object.keys(grouped).map(function(type){
    return '<div class="search-section-title">'+type+'</div>'
      +grouped[type].map(function(r){
        return '<div class="search-result-item">'
          +'<div style="font-size:20px;width:28px;flex-shrink:0">'+r.icon+'</div>'
          +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--c-text)">'+r.label+'</div>'
          +(r.sub?'<div style="font-size:11px;color:var(--c-text2)">'+r.sub+'</div>':'')+'</div>'
          +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
          +'</div>';
      }).join('');
  }).join('');
  el.querySelectorAll('.search-result-item').forEach(function(item,i){item.onclick=allR[i].action;});
}

