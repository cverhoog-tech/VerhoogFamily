'use strict';
(function(){
  if(window.__familyAppPwaIconV8)return;
  window.__familyAppPwaIconV8=true;

  // File name is kept for compatibility with the existing shell contract;
  // the runtime now serves the v9 Home Screen artwork.
  var V='9';
  var icons={
    apple:'/api/brand-icon?variant=180&v='+V,
    favicon:'/api/brand-icon?variant=32&v='+V,
    icon192:'/api/brand-icon?variant=192&v='+V
  };

  function ensure(id,rel,href,sizes){
    var el=document.getElementById(id);
    if(!el){
      el=document.createElement('link');
      el.id=id;
      el.rel=rel;
      document.head.appendChild(el);
    }
    if(sizes)el.setAttribute('sizes',sizes);
    el.href=href;
    return el;
  }

  function apply(){
    var manifest=document.querySelector('link[rel="manifest"]');
    if(manifest)manifest.href='/manifest.json?v='+V;
    ensure('apple-touch-icon','apple-touch-icon',icons.apple,'180x180');
    ensure('favicon','icon',icons.favicon,'32x32');
    ensure('app-icon-192','icon',icons.icon192,'192x192');
    ensure('shortcut-icon','shortcut icon',icons.favicon,'32x32');

    var preview=document.getElementById('icon-preview');
    if(preview){
      preview.innerHTML='<img src="'+icons.icon192+'" alt="FamilyApp app-icoon" style="width:100%;height:100%;display:block;object-fit:cover">';
    }
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
})();
