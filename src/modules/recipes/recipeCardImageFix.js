'use strict';
// RECIPE CATEGORY HEROES v0.276
(function(){
  function bg(cat){
    if(cat==='Ontbijt'||cat==='Dessert'||cat==='Bakken') return 'linear-gradient(145deg,#f2bd67,#c86b4f 48%,#342b4d)';
    if(cat==='Lunch'||cat==='Snack') return 'linear-gradient(145deg,#7aaa72,#3d7e72 48%,#26344d)';
    return 'linear-gradient(145deg,#75464b,#4a3454 48%,#1c213b)';
  }
  function emoji(cat){return {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'}[cat]||'🍴';}
  function find(id){return (Array.isArray(window.recipesData)?window.recipesData:[]).find(function(r){return r&&String(r.id)===String(id);})||null;}
  function apply(){
    var grid=document.getElementById('rg');
    if(grid) grid.querySelectorAll('.rc').forEach(function(card){
      var recipe=find(String(card.id||'').replace(/^rc-/,''));
      if(!recipe||recipe.photo) return;
      var wrap=card.querySelector('.rc-img'); if(!wrap) return;
      wrap.style.background=bg(recipe.cat); wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='center';
      var img=wrap.querySelector('img'); if(img) img.style.display='none';
      if(!wrap.querySelector('.recipe-preset-emoji')){var e=document.createElement('span');e.className='recipe-preset-emoji';e.textContent=emoji(recipe.cat);e.style.fontSize='52px';wrap.appendChild(e);}
    });
    return true;
  }
  function boot(){apply();}
  window.RecipeCardImageFix={version:'0.276',apply:apply,boot:boot};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
