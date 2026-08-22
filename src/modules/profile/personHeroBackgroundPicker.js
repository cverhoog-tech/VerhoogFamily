'use strict';
(function(){
  if(window.PersonHeroBackgroundPicker)return;
  var VERSION='1.1.0',root=null,activeUid=null,currentConfig=null,busy=false,prepared=null,progress=0;
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function clone(v){try{return JSON.parse(JSON.stringify(v||null));}catch(e){return v||null;}}
  function uploadService(){return window.HeroBackdropUploadService||null;}
  function repo(){return window.MemberHeroBackgroundRepository||null;}
  function catalog(){return window.HeroBackdropCatalog&&HeroBackdropCatalog.listPresets?HeroBackdropCatalog.listPresets():[];}
  function defaultId(){return window.HeroBackdropCatalog&&HeroBackdropCatalog.defaultId||null;}
  function currentPresetId(){return currentConfig&&currentConfig.type==='preset'&&currentConfig.presetId?currentConfig.presetId:(!currentConfig?defaultId():null);}
  function isCurrentUpload(){return !!(currentConfig&&currentConfig.type==='upload'&&currentConfig.storagePath);}
  function formatBytes(bytes){var n=Number(bytes||0);if(n<1024)return n+' B';if(n<1024*1024)return (n/1024).toFixed(0)+' KB';return (n/(1024*1024)).toFixed(1)+' MB';}
  function message(err,fallback){var text=err&&err.message||fallback||'Er ging iets mis.';try{if(typeof window.showToast==='function')window.showToast(text);else alert(text);}catch(e){alert(text);}}

  function ensureRoot(){
    if(root&&document.body.contains(root))return root;
    root=document.createElement('div');root.className='phbp-overlay';root.setAttribute('aria-hidden','true');
    root.innerHTML='<div class="phbp-sheet" role="dialog" aria-modal="true" aria-label="Hero-achtergrond kiezen">'
      +'<div class="phbp-handle"></div><div class="phbp-head"><div><h2>Achtergrond kiezen</h2><p>Kies een sfeer of gebruik je eigen foto.</p></div><button type="button" class="phbp-close" data-phbp-close aria-label="Sluiten">×</button></div>'
      +'<div class="phbp-grid" data-phbp-grid></div>'
      +'<div class="phbp-upload" data-phbp-upload-wrap></div>'
      +'<input type="file" accept="image/*" data-phbp-file hidden>'
      +'<div class="phbp-actions"><button type="button" class="phbp-reset" data-phbp-reset>Standaard herstellen</button></div>'
      +'<div class="phbp-note">Alleen jij kunt jouw hero-achtergrond aanpassen.</div></div>';
    document.body.appendChild(root);bind();return root;
  }

  function renderGrid(){
    var r=ensureRoot(),grid=r.querySelector('[data-phbp-grid]'),activeId=currentPresetId();if(!grid)return;
    grid.innerHTML=catalog().map(function(p){var active=String(p.id)===String(activeId||'');return'<button type="button" class="phbp-card'+(active?' is-active':'')+'" data-phbp-preset="'+esc(p.id)+'"><span class="phbp-thumb"><img src="'+esc(p.thumbnailUrl||p.imageUrl)+'" alt=""><i>'+(active?'✓':'')+'</i></span><strong>'+esc(p.label||p.id)+'</strong></button>';}).join('');
  }

  function renderUpload(){
    var r=ensureRoot(),wrap=r.querySelector('[data-phbp-upload-wrap]');if(!wrap)return;
    if(prepared){
      wrap.innerHTML='<div class="phbp-preview-card"><div class="phbp-preview-image"><img src="'+esc(prepared.previewUrl)+'" alt="Voorbeeld eigen achtergrond"></div>'
        +'<div class="phbp-preview-copy"><strong>Voorbeeld</strong><span>'+esc(prepared.width)+' × '+esc(prepared.height)+' · '+esc(formatBytes(prepared.blob&&prepared.blob.size))+'</span></div>'
        +'<div class="phbp-progress"'+(busy?'':' hidden')+'><i style="width:'+Math.round(progress*100)+'%"></i></div>'
        +'<div class="phbp-preview-actions"><button type="button" data-phbp-discard>Andere kiezen</button><button type="button" class="is-primary" data-phbp-confirm>'+(busy?'Bezig…':'Deze foto gebruiken')+'</button></div></div>';
      return;
    }
    wrap.innerHTML='<button type="button" class="phbp-upload-button" data-phbp-upload><span class="phbp-upload-mark">＋</span><span><strong>'+(isCurrentUpload()?'Andere eigen foto kiezen':'Eigen foto gebruiken')+'</strong><small>Wordt automatisch verkleind en geoptimaliseerd</small></span></button>'+(isCurrentUpload()?'<div class="phbp-current-upload">✓ Eigen foto is nu actief</div>':'');
  }

  function render(){renderGrid();renderUpload();}
  function setBusy(v){busy=!!v;if(root)root.classList.toggle('is-busy',busy);renderUpload();}
  function disposePrepared(){var s=uploadService();if(prepared&&s&&typeof s.dispose==='function')s.dispose(prepared);prepared=null;progress=0;}

  function close(){if(busy||!root)return;disposePrepared();root.classList.remove('is-open');root.setAttribute('aria-hidden','true');activeUid=null;currentConfig=null;var input=root.querySelector('[data-phbp-file]');if(input)input.value='';}

  function cleanupOldUpload(oldConfig,newPath){var s=uploadService();if(!oldConfig||oldConfig.type!=='upload'||!oldConfig.storagePath||oldConfig.storagePath===newPath||!s||typeof s.deletePath!=='function')return Promise.resolve();return s.deletePath(activeUid,oldConfig.storagePath).catch(function(err){console.warn('[HeroBackgroundPicker] old upload cleanup failed',err);});}

  function savePreset(id){
    if(busy||!activeUid)return;var r=repo();if(!r||typeof r.setPreset!=='function')return;
    var old=clone(currentConfig);setBusy(true);
    r.setPreset(activeUid,id).then(function(){currentConfig={type:'preset',presetId:id};return cleanupOldUpload(old,null);}).then(function(){setBusy(false);setTimeout(close,90);}).catch(function(err){setBusy(false);console.warn('[HeroBackgroundPicker]',err);message(err,'Achtergrond opslaan is niet gelukt.');});
  }

  function reset(){
    if(busy||!activeUid)return;var r=repo();if(!r||typeof r.reset!=='function')return;
    var old=clone(currentConfig);setBusy(true);
    r.reset(activeUid).then(function(){currentConfig=null;return cleanupOldUpload(old,null);}).then(function(){setBusy(false);setTimeout(close,90);}).catch(function(err){setBusy(false);console.warn('[HeroBackgroundPicker]',err);message(err,'Achtergrond herstellen is niet gelukt.');});
  }

  function chooseFile(){if(busy||!activeUid)return;var input=ensureRoot().querySelector('[data-phbp-file]');if(input){input.value='';input.click();}}
  function prepareFile(file){
    var s=uploadService();if(!s||typeof s.prepare!=='function'){message(null,'Foto-upload is niet beschikbaar.');return;}
    disposePrepared();setBusy(true);
    s.prepare(file).then(function(result){prepared=result;progress=0;setBusy(false);render();}).catch(function(err){setBusy(false);console.warn('[HeroBackgroundPicker] prepare failed',err);message(err,'De foto kon niet worden voorbereid.');});
  }

  function confirmUpload(){
    if(busy||!activeUid||!prepared)return;var s=uploadService(),r=repo();if(!s||!r||typeof s.upload!=='function'||typeof r.setUpload!=='function')return;
    var old=clone(currentConfig),newMeta=null;progress=.02;setBusy(true);
    s.upload(activeUid,prepared,function(value){progress=value;if(root){var bar=root.querySelector('.phbp-progress i');if(bar)bar.style.width=Math.round(progress*100)+'%';}})
      .then(function(meta){newMeta=meta;progress=1;return r.setUpload(activeUid,meta).catch(function(err){return s.deletePath(activeUid,meta.storagePath).catch(function(){}).then(function(){throw err;});});})
      .then(function(){currentConfig=clone(newMeta);return cleanupOldUpload(old,newMeta.storagePath);})
      .then(function(){disposePrepared();setBusy(false);setTimeout(close,90);})
      .catch(function(err){setBusy(false);console.warn('[HeroBackgroundPicker] upload failed',err);message(err,'Uploaden is niet gelukt.');});
  }

  function discardPrepared(){if(busy)return;disposePrepared();renderUpload();}

  function bind(){
    root.addEventListener('click',function(e){
      if((e.target===root||e.target.closest('[data-phbp-close]'))&&!busy){close();return;}
      var preset=e.target.closest('[data-phbp-preset]');if(preset){savePreset(preset.getAttribute('data-phbp-preset'));return;}
      if(e.target.closest('[data-phbp-reset]')){reset();return;}
      if(e.target.closest('[data-phbp-upload]')){chooseFile();return;}
      if(e.target.closest('[data-phbp-confirm]')){confirmUpload();return;}
      if(e.target.closest('[data-phbp-discard]')){discardPrepared();return;}
    });
    var input=root.querySelector('[data-phbp-file]');if(input)input.addEventListener('change',function(){var file=input.files&&input.files[0];if(file)prepareFile(file);});
  }

  function open(uid,config){
    var r=repo();if(!r||!r.canEdit||!r.canEdit(uid))return false;
    disposePrepared();activeUid=String(uid);currentConfig=clone(config);progress=0;render();
    var el=ensureRoot();el.classList.add('is-open');el.setAttribute('aria-hidden','false');return true;
  }

  window.PersonHeroBackgroundPicker={version:VERSION,open:open,close:close};
})();
