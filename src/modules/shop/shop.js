'use strict';
// ============================================================
// BOODSCHAPPEN
// ============================================================

function renderShop() {
  var openEl=document.getElementById('shop-open');
  var doneEl=document.getElementById('shop-done');
  var ocnt=document.getElementById('shop-open-cnt');
  var dcnt=document.getElementById('shop-done-cnt');
  if(!openEl)return;

  var open=shopData.filter(function(i){return !i.done;});
  var done=shopData.filter(function(i){return i.done;});
  if(ocnt)ocnt.textContent=open.length;
  if(dcnt)dcnt.textContent=done.length;
  openEl.innerHTML=open.map(shopItemHTML).join('');
  doneEl.innerHTML=done.map(shopItemHTML).join('');
  updateStats();
}

function shopItemHTML(item) {
  return '<div class="shop-item" id="si-'+item.id+'">'
    +'<div class="check-circle '+(item.done?'done':'')+'" id="shck-'+item.id+'" onclick="toggleShop('+item.id+')" style="cursor:pointer;flex-shrink:0">'
    +(item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')
    +'</div>'
    +'<div class="shop-emoji">'+((item.photo&&!item.photo.startsWith('http'))?item.photo:'📦')+'</div>'
    +'<div class="shop-info">'
    +'<div class="shop-name'+(item.done?' done':'')+'">'+item.name+'</div>'
    +'<div class="shop-qty">'+item.qty+' · '+item.cat+'</div>'
    +'</div>'
    +'<button class="shop-del" onclick="deleteShop('+item.id+')">✕</button>'
    +'</div>';
}

function toggleShop(id) {
  var item=shopData.find(function(i){return i.id===id;});if(!item)return;
  var el=document.getElementById('shck-'+id);
  item.done=!item.done;
  if(el){
    el.classList.toggle('done',item.done);
    el.innerHTML=item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'';
    if(item.done) spawnParticles(el);
  }
  setTimeout(function(){renderShop();},150);
  if(item.done){awardXP(2,'Boodschap');addActivity('🛒','#fff3dc',myName+' kocht "'+item.name+'"');}
}

function deleteShop(id) {
  var i=shopData.findIndex(function(x){return x.id===id;});
  if(i>-1){shopData.splice(i,1);renderShop();}
}

function resetShop() {
  shopData=shopData.filter(function(i){return !i.done;});
  renderShop();
  showToast('Gekochte items geleegd ↺');
}

