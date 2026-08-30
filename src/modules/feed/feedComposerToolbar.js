'use strict';
// STEP 13.4 — force all composer actions into one actual DOM row.
(function(){
  if(window.FeedComposerToolbar)return;

  function normalize(){
    var card=document.getElementById('feed-compose-card')||document.querySelector('#screen-feed .feed-compose-card');
    if(!card)return false;
    var actions=card.querySelector('.compose-actions,.feed-compose-actions');
    if(!actions)return false;

    var post=actions.querySelector('[onclick="publishPost()"],#feed-send-btn')||card.querySelector('[onclick="publishPost()"],#feed-send-btn');
    var tagTools=card.querySelectorAll('.fs-tag-tool');

    // Move tag buttons themselves into the same action container as camera/pin/post.
    Array.prototype.forEach.call(tagTools,function(btn){
      if(btn.parentNode!==actions)actions.insertBefore(btn,post||null);
    });

    var wrapper=card.querySelector('#feed-tag-tools');
    if(wrapper&&wrapper.parentNode){
      while(wrapper.firstChild)actions.insertBefore(wrapper.firstChild,post||null);
      wrapper.remove();
    }

    actions.classList.add('fs-compose-action-row');
    if(post&&post.parentNode!==actions)actions.appendChild(post);
    return true;
  }

  function boot(){
    normalize();
    var observer=new MutationObserver(function(){normalize();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('familyapp:feed-updated',function(){setTimeout(normalize,0);});
  }

  window.FeedComposerToolbar={version:'1.0.0',normalize:normalize};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
