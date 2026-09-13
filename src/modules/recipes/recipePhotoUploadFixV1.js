'use strict';
(function(){
  if(window.RecipePhotoUploadFixV1)return;

  var TARGET_BYTES=112000;
  var MAX_EDGE=1100;
  var MIN_EDGE=560;
  var PREVIEW_CLASS='rep-upload-preview-v1';

  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function objectUrl(file){try{return URL.createObjectURL(file);}catch(e){return null;}}
  function revoke(url){if(!url)return;setTimeout(function(){try{URL.revokeObjectURL(url);}catch(e){}},1800);}

  function showImmediatePreview(file){
    var hero=document.getElementById('rep-hero');
    if(!hero)return null;
    var url=objectUrl(file);if(!url)return null;
    var img=hero.querySelector('img.rep-hero-img');
    if(!img){
      img=document.createElement('img');
      img.className='rep-hero-img '+PREVIEW_CLASS;
      img.alt='';
      hero.insertBefore(img,hero.firstChild);
    }else{
      img.classList.add(PREVIEW_CLASS);
    }
    img.src=url;
    img.style.display='block';
    hero.style.backgroundImage='none';
    return url;
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
      try{
        canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(new Error('encode'));},'image/jpeg',quality);
      }catch(e){reject(e);}
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
      var edge=MAX_EDGE;
      var qualities=[.78,.68,.58,.50];
      for(var round=0;round<5;round++){
        var size=fitSize(img.naturalWidth||img.width,img.naturalHeight||img.height,edge);
        var canvas=document.createElement('canvas');
        canvas.width=size.width;canvas.height=size.height;
        var ctx=canvas.getContext('2d',{alpha:false});
        if(!ctx)throw new Error('canvas');
        ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size.width,size.height);
        ctx.drawImage(img,0,0,size.width,size.height);
        for(var q=0;q<qualities.length;q++){
          var blob=await toBlob(canvas,qualities[q]);
          if(blob.size<=TARGET_BYTES)return blob;
        }
        edge=Math.max(MIN_EDGE,Math.round(edge*.80));
      }
      var finalSize=fitSize(img.naturalWidth||img.width,img.naturalHeight||img.height,MIN_EDGE);
      var finalCanvas=document.createElement('canvas');
      finalCanvas.width=finalSize.width;finalCanvas.height=finalSize.height;
      var finalCtx=finalCanvas.getContext('2d',{alpha:false});
      finalCtx.fillStyle='#ffffff';finalCtx.fillRect(0,0,finalSize.width,finalSize.height);
      finalCtx.drawImage(img,0,0,finalSize.width,finalSize.height);
      return await toBlob(finalCanvas,.44);
    }finally{
      revoke(loaded.url);
    }
  }

  function invokeOriginal(input,handler,file){
    if(typeof handler!=='function')throw new Error('missing-original-handler');
    handler.call(input,{target:{files:[file]}});
  }

  document.addEventListener('change',function(event){
    var input=event.target;
    if(!input||input.id!=='rep-photo-file')return;
    var file=input.files&&input.files[0];
    if(!file)return;

    var original=input.onchange;
    if(typeof original!=='function')return;

    // Stop the old raw-FileReader path. We feed it a normalized, compact JPEG
    // after processing so RecipeStore stays the only persistence path.
    event.preventDefault();
    event.stopImmediatePropagation();

    var previewUrl=showImmediatePreview(file);
    var button=document.getElementById('rep-photo-btn');
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
      if(button){button.disabled=false;button.textContent=button.dataset.oldText||'Eigen foto toevoegen';}
      toast('Deze foto kon niet worden verwerkt. Kies een andere foto.');
    });
  },true);

  window.RecipePhotoUploadFixV1={version:'1.0.0',targetBytes:TARGET_BYTES,maxEdge:MAX_EDGE};
})();
