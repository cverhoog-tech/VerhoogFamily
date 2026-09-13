'use strict';
(function(){
  if(window.RecipePhotoUploadFixV1)return;

  var TARGET_BYTES=112000;
  var MAX_EDGE=1100;
  var MIN_EDGE=560;
  var INPUTS=Object.freeze({'rep-photo-file':'editor','rp-file':'detail'});

  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function objectUrl(file){try{return URL.createObjectURL(file);}catch(e){return null;}}
  function revoke(url){if(!url)return;setTimeout(function(){try{URL.revokeObjectURL(url);}catch(e){}},1800);}

  function previewEditor(file){
    var hero=document.getElementById('rep-hero');
    if(!hero)return null;
    var url=objectUrl(file);if(!url)return null;
    var img=hero.querySelector('img.rep-hero-img');
    if(!img){
      img=document.createElement('img');
      img.className='rep-hero-img rep-upload-preview-v1';
      img.alt='';
      hero.insertBefore(img,hero.firstChild);
    }else img.classList.add('rep-upload-preview-v1');
    img.src=url;
    img.style.display='block';
    hero.style.backgroundImage='none';
    return url;
  }

  function previewDetail(file){
    var button=document.getElementById('rp-upbtn');
    var host=button&&button.parentElement;
    if(!host)return null;
    var url=objectUrl(file);if(!url)return null;
    var img=host.querySelector('.rp-upload-preview-v1');
    if(!img){
      img=document.createElement('img');
      img.className='rp-upload-preview-v1';
      img.alt='Gekozen receptfoto';
      img.style.cssText='display:block;width:100%;height:112px;object-fit:cover;border-radius:12px;margin-top:9px;border:1px solid var(--c-border,#e5e7eb)';
      host.appendChild(img);
    }
    img.src=url;
    return url;
  }

  function showImmediatePreview(file,input){
    return INPUTS[input&&input.id]==='detail'?previewDetail(file):previewEditor(file);
  }

  function loadImage(file){
    return new Promise(function(resolve,reject){
      var url=objectUrl(file);
      if(!url){reject(new Error('object-url'));return;}
      var img=new Image();
      img.onload=function(){resolve({img:img,url:url});};
      img.onerror=function(){revoke(url);reject(new Error('decode'));};
      img.src=url;
    });
  }

  function toBlob(canvas,quality){
    return new Promise(function(resolve,reject){
      try{canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(new Error('encode'));},'image/jpeg',quality);}catch(e){reject(e);}
    });
  }

  function fitSize(width,height,maxEdge){
    var largest=Math.max(width,height)||1;
    var ratio=Math.min(1,maxEdge/largest);
    return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
  }

  async function compress(file){
    var loaded=await loadImage(file),img=loaded.img;
    try{
      var edge=MAX_EDGE,qualities=[.78,.68,.58,.50];
      for(var round=0;round<5;round++){
        var size=fitSize(img.naturalWidth||img.width,img.naturalHeight||img.height,edge);
        var canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
        var ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('canvas');
        ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size.width,size.height);ctx.drawImage(img,0,0,size.width,size.height);
        for(var q=0;q<qualities.length;q++){
          var blob=await toBlob(canvas,qualities[q]);
          if(blob.size<=TARGET_BYTES)return blob;
        }
        edge=Math.max(MIN_EDGE,Math.round(edge*.80));
      }
      var finalSize=fitSize(img.naturalWidth||img.width,img.naturalHeight||img.height,MIN_EDGE);
      var finalCanvas=document.createElement('canvas');finalCanvas.width=finalSize.width;finalCanvas.height=finalSize.height;
      var finalCtx=finalCanvas.getContext('2d',{alpha:false});if(!finalCtx)throw new Error('canvas');
      finalCtx.fillStyle='#ffffff';finalCtx.fillRect(0,0,finalSize.width,finalSize.height);finalCtx.drawImage(img,0,0,finalSize.width,finalSize.height);
      return await toBlob(finalCanvas,.44);
    }finally{revoke(loaded.url);}
  }

  function invokeOriginal(input,handler,file){
    if(typeof handler!=='function')throw new Error('missing-original-handler');
    handler.call(input,{target:{files:[file]}});
  }

  function buttonFor(input){
    return INPUTS[input&&input.id]==='detail'?document.getElementById('rp-upbtn'):document.getElementById('rep-photo-btn');
  }

  document.addEventListener('change',function(event){
    var input=event.target;
    if(!input||!INPUTS[input.id])return;
    var file=input.files&&input.files[0];if(!file)return;
    var original=input.onchange;if(typeof original!=='function')return;

    // Stop the raw FileReader target handler. After normalization the exact same
    // canonical UI handler receives a compact JPEG; no recipe persistence owner changes.
    event.preventDefault();
    event.stopImmediatePropagation();

    var previewUrl=showImmediatePreview(file,input);
    var button=buttonFor(input);
    if(button){button.disabled=true;button.dataset.oldText=button.textContent||'';button.textContent='Foto verwerken…';}

    compress(file).then(function(blob){
      if(!blob||blob.size>TARGET_BYTES*1.12)throw new Error('too-large');
      invokeOriginal(input,original,blob);
      revoke(previewUrl);
    }).catch(function(error){
      console.warn('[RecipePhotoUploadFixV1] photo processing failed',error);
      revoke(previewUrl);
      if(file.size<=TARGET_BYTES&&/^image\/(?:jpeg|jpg|png|webp)$/i.test(String(file.type||''))){
        try{invokeOriginal(input,original,file);return;}catch(e){}
      }
      if(button){button.disabled=false;button.textContent=button.dataset.oldText||(INPUTS[input.id]==='detail'?'Upload eigen foto':'Eigen foto toevoegen');}
      toast('Deze foto kon niet worden verwerkt. Kies een andere foto.');
    });
  },true);

  window.RecipePhotoUploadFixV1={version:'1.1.0',targetBytes:TARGET_BYTES,maxEdge:MAX_EDGE,inputs:Object.freeze(Object.keys(INPUTS))};
})();
