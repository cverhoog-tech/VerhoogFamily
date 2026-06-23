'use strict';
// TASK CUSTOM IMAGE SAVE FIX v0.298l
(function(){
  var KEY='fam_tasks_v023';
  function parse(v,f){try{return v?JSON.parse(v):f;}catch(e){return f;}}
  function titleOf(t){return String(Array.isArray(t)?t[2]:(t&&t.title)||'').trim();}
  function setImg(t,img){if(Array.isArray(t))t[7]=img;else if(t){t.imageUrl=img;t.image=img;t.imageDataUrlFallback=img;}}
  function apply(title,img){
    if(!title||!img||String(img).indexOf('data:image/')!==0)return false;
    var tasks=parse(localStorage.getItem(KEY),[]);
    if(!Array.isArray(tasks))tasks=[];
    for(var i=tasks.length-1;i>=0;i--){
      if(titleOf(tasks[i])===title){setImg(tasks[i],img);localStorage.setItem(KEY,JSON.stringify(tasks));return true;}
    }
    return false;
  }
  function bind(){
    if(document.__taskCustomImageSaveFix)return;document.__taskCustomImageSaveFix=true;
    document.addEventListener('click',function(ev){
      var btn=ev.target&&ev.target.closest?ev.target.closest('.fqSaveBtn,button'):null;if(!btn)return;
      var modal=btn.closest&&btn.closest('#fqModal');if(!modal||!modal.querySelector('#qn'))return;
      var img=modal.__questPhotoDataUrl||'';if(String(img).indexOf('data:image/')!==0)return;
      var title=String(modal.querySelector('#qn').value||'').trim();if(!title)return;
      setTimeout(function(){
        apply(title,img);
        try{window.dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{source:'TaskCustomImageSaveFix'}}));}catch(e){}
        setTimeout(function(){try{window.location.reload();}catch(e){}},80);
      },80);
    },false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.TaskCustomImageSaveFix={bind:bind,apply:apply};
})();
