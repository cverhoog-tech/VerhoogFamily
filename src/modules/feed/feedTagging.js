'use strict';
// ============================================================
// FEED TAGGING v1.0.0 — STEP 13.4
// Structured references for household members (UID) and recipes (recipe ID).
// Keeps the existing manual post model/renderer intact and decorates it.
// ============================================================
(function(){
  if(window.FeedTagging)return;

  var pending=[];
  var picker=null;
  var originalCreate=null;
  var originalRenderPost=null;
  var patchedCreate=false;
  var patchedRender=false;

  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function safeAttr(v){return esc(v).replace(/`/g,'&#096;');}
  function refs(value){return Array.isArray(value)?value.filter(function(r){return r&&((r.type==='member'&&r.uid)||(r.type==='recipe'&&r.recipeId));}).map(clone):[];}
  function key(ref){return ref.type==='member'?'member:'+String(ref.uid):'recipe:'+String(ref.recipeId);}
  function has(ref){var k=key(ref);return pending.some(function(x){return key(x)===k;});}
  function members(){
    try{if(window.FeedSharedData&&typeof FeedSharedData.members==='function')return FeedSharedData.members()||[];}catch(e){}
    try{if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function')return HouseholdIdentityFirebaseBridge.getMembers()||[];}catch(e){}
    return[];
  }
  function recipes(){
    try{if(window.RecipeStore&&typeof RecipeStore.list==='function')return RecipeStore.list()||[];}catch(e){}
    return Array.isArray(window.recipesData)?window.recipesData:[];
  }
  function memberRef(m){return{type:'member',uid:String(m.uid||m.id),displayName:String(m.displayName||m.name||'Gezinslid')};}
  function recipeRef(r){return{type:'recipe',recipeId:String(r.id),title:String(r.name||r.title||'Recept')};}
  function add(ref){if(!ref||has(ref))return;pending.push(clone(ref));renderPending();closePicker();}
  function remove(k){pending=pending.filter(function(r){return key(r)!==String(k);});renderPending();}
  function clear(){pending=[];renderPending();}
  function pendingRefs(){return pending.map(clone);}

  function chip(ref,removable){var label=ref.type==='member'?'@'+(ref.displayName||'Gezinslid'):(ref.title||'Recept');var ico=ref.type==='member'?'👤':'🍽️';var action=ref.type==='member'?"openFeedReference('member','"+safeAttr(ref.uid)+"')":"openFeedReference('recipe','"+safeAttr(ref.recipeId)+"')";return '<button type="button" class="fs-tag-chip fs-tag-'+esc(ref.type)+'" onclick="event.stopPropagation();'+action+'"><span>'+ico+'</span><b>'+esc(label)+'</b></button>'+(removable?'<button type="button" class="fs-tag-remove" aria-label="Tag verwijderen" onclick="event.stopPropagation();removeFeedTag(\''+safeAttr(key(ref))+'\')">×</button>':'');}
  function chipsHtml(list){list=refs(list);if(!list.length)return'';return '<div class="fs-post-tags">'+list.map(function(r){return'<span class="fs-tag-wrap">'+chip(r,false)+'</span>';}).join('')+'</div>';}
  function pendingHtml(){if(!pending.length)return'';return '<div class="fs-compose-tags">'+pending.map(function(r){return'<span class="fs-tag-wrap">'+chip(r,true)+'</span>';}).join('')+'</div>';}
  function renderPending(){var host=document.getElementById('feed-tag-pending');if(host)host.innerHTML=pendingHtml();}

  function pickerRows(type){
    if(type==='member'){
      var ms=members();if(!ms.length)return'<div class="fs-tag-empty">Geen gezinsleden beschikbaar</div>';
      return ms.map(function(m){var r=memberRef(m),avatar=m.avatar||m.avatarUrl||m.photoURL||'';return '<button type="button" class="fs-tag-choice" onclick="selectFeedTag(\'member\',\''+safeAttr(r.uid)+'\')">'+(avatar?'<img src="'+safeAttr(avatar)+'" alt="">':'<span class="fs-tag-choice-fallback">👤</span>')+'<span><b>'+esc(r.displayName)+'</b><small>Gezinslid</small></span><i>+</i></button>';}).join('');
    }
    var rs=recipes();if(!rs.length)return'<div class="fs-tag-empty">Nog geen recepten beschikbaar</div>';
    return rs.slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'nl');}).map(function(r){var ref=recipeRef(r);return '<button type="button" class="fs-tag-choice" onclick="selectFeedTag(\'recipe\',\''+safeAttr(ref.recipeId)+'\')"><span class="fs-tag-choice-fallback">🍽️</span><span><b>'+esc(ref.title)+'</b><small>'+esc(r.cat||r.cuisine||'Recept')+'</small></span><i>+</i></button>';}).join('');
  }
  function openPicker(type){closePicker();var root=document.createElement('div');root.id='feed-tag-picker';root.className='fs-tag-picker';root.innerHTML='<div class="fs-tag-backdrop" onclick="closeFeedTagPicker()"></div><section class="fs-tag-sheet"><div class="fs-tag-sheet-head"><div><small>TAG TOEVOEGEN</small><h3>'+(type==='member'?'Wie wil je taggen?':'Welk recept wil je taggen?')+'</h3></div><button type="button" onclick="closeFeedTagPicker()">×</button></div><div class="fs-tag-choices">'+pickerRows(type)+'</div></section>';document.body.appendChild(root);picker=root;}
  function closePicker(){if(picker&&picker.parentNode)picker.parentNode.removeChild(picker);picker=null;}
  function select(type,id){if(type==='member'){var m=members().find(function(x){return String(x.uid||x.id)===String(id);});if(m)add(memberRef(m));return;}var r=recipes().find(function(x){return String(x.id)===String(id);});if(r)add(recipeRef(r));}

  function openRef(type,id){
    closePicker();
    if(type==='recipe'){
      try{if(typeof window.showScreenMore==='function')window.showScreenMore('recipes');else if(typeof window.showScreen==='function')window.showScreen('recipes');}catch(e){}
      setTimeout(function(){try{if(typeof window.openRecipeDetail==='function')window.openRecipeDetail(id);}catch(e){}},120);
      return;
    }
    window.__familyFeedMemberFocusUid=String(id);
    try{if(typeof window.showScreen==='function')window.showScreen('tasks');}catch(e){}
    setTimeout(function(){
      try{
        var personTab=document.querySelector('#screen-tasks [data-tab="person"],#screen-tasks [data-task-tab="person"],#screen-tasks .ttab-person,#screen-tasks .task-tab-person');
        if(personTab&&typeof personTab.click==='function')personTab.click();
        setTimeout(function(){var btn=document.querySelector('[data-pt2-member="'+CSS.escape(String(id))+'"]');if(btn)btn.click();},80);
      }catch(e){}
    },80);
  }

  function decorateComposer(){
    var card=document.getElementById('feed-compose-card')||document.querySelector('#screen-feed .feed-compose-card');if(!card)return;
    if(!document.getElementById('feed-tag-tools')){
      var tools=document.createElement('div');tools.id='feed-tag-tools';tools.className='fs-tag-tools';tools.innerHTML='<button type="button" onclick="openFeedTagPicker(\'member\')">👤 Persoon</button><button type="button" onclick="openFeedTagPicker(\'recipe\')">🍽️ Recept</button><span>Tip: typ @ of #</span>';
      var input=card.querySelector('#compose-area,.compose-input');if(input&&input.parentNode)input.parentNode.insertBefore(tools,input.nextSibling);else card.appendChild(tools);
      var pendingHost=document.createElement('div');pendingHost.id='feed-tag-pending';tools.insertAdjacentElement('afterend',pendingHost);renderPending();
    }
    var ca=document.getElementById('compose-area');
    if(ca&&ca.dataset.feedTagWired!=='1'){
      ca.dataset.feedTagWired='1';
      ca.addEventListener('input',function(){var text=String(ca.innerText||ca.textContent||'');var last=text.slice(-1);if(last==='@'||last==='#'){ca.textContent=text.slice(0,-1);placeCaretEnd(ca);openPicker(last==='@'?'member':'recipe');}});
    }
  }
  function placeCaretEnd(el){try{var range=document.createRange();range.selectNodeContents(el);range.collapse(false);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);}catch(e){}}

  function patchCreate(){
    if(patchedCreate||!window.FeedSharedData||typeof FeedSharedData.createPost!=='function')return false;
    originalCreate=FeedSharedData.createPost;
    FeedSharedData.createPost=function(data){data=Object.assign({},data||{});var supplied=refs(data.references),current=pendingRefs();data.references=supplied.concat(current.filter(function(r){return !supplied.some(function(x){return key(x)===key(r);});}));return Promise.resolve(originalCreate.call(FeedSharedData,data)).then(function(row){clear();return row;});};
    patchedCreate=true;return true;
  }
  function patchRender(){
    if(patchedRender||typeof window.renderPostHTML!=='function')return false;
    originalRenderPost=window.renderPostHTML;
    window.renderPostHTML=function(p){var html=originalRenderPost(p);if(!p||p.type!=='post')return html;var tags=chipsHtml(p.references);if(!tags)return html;var re=/(<div class="fs-post-text">[\s\S]*?<\/div>)/;if(re.test(html))return html.replace(re,'$1'+tags);return html.replace('</article>',tags+'</article>');};
    patchedRender=true;return true;
  }
  function css(){if(document.getElementById('feed-tagging-css'))return;var s=document.createElement('style');s.id='feed-tagging-css';s.textContent=''
    +'.fs-tag-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px}.fs-tag-tools button{border:1px solid var(--c-border,#e5e7eb);background:var(--c-surface2,#f7f8f7);color:var(--c-text,#1f2937);border-radius:999px;padding:7px 11px;font-size:12px;font-weight:850}.fs-tag-tools>span{margin-left:auto;color:var(--c-text3,#9aa3b2);font-size:10px;font-weight:700}.fs-compose-tags,.fs-post-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.fs-post-tags{margin:2px 0 12px}.fs-tag-wrap{display:inline-flex;align-items:center}.fs-tag-chip{display:inline-flex;align-items:center;gap:5px;border:0;border-radius:999px;padding:7px 10px;background:#eef3ff;color:#49648d;font-size:12px;max-width:230px}.fs-tag-chip.fs-tag-recipe{background:#fff0e7;color:#9a5f43}.fs-tag-chip b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fs-tag-remove{margin-left:-7px;width:24px;height:24px;border:0;border-radius:50%;background:#fff;color:#7c8592;box-shadow:0 2px 8px rgba(17,24,39,.12)}'
    +'.fs-tag-picker{position:fixed;inset:0;z-index:100020;display:flex;align-items:flex-end;justify-content:center}.fs-tag-backdrop{position:absolute;inset:0;background:rgba(14,18,25,.34);backdrop-filter:blur(5px)}.fs-tag-sheet{position:relative;width:min(100%,520px);max-height:70vh;background:var(--c-surface,#fff);border-radius:28px 28px 0 0;box-shadow:0 -20px 60px rgba(0,0,0,.2);padding:18px 16px calc(22px + env(safe-area-inset-bottom));overflow:hidden}.fs-tag-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.fs-tag-sheet-head small{font-size:10px;letter-spacing:.11em;color:var(--c-text3,#9aa3b2);font-weight:900}.fs-tag-sheet-head h3{margin:2px 0 0;font-size:20px;color:var(--c-text,#111827)}.fs-tag-sheet-head>button{width:36px;height:36px;border:0;border-radius:50%;background:var(--c-surface2,#f1f3f2);font-size:25px;color:var(--c-text2,#68717e)}.fs-tag-choices{display:flex;flex-direction:column;gap:8px;overflow:auto;max-height:calc(70vh - 95px)}.fs-tag-choice{width:100%;display:grid;grid-template-columns:46px 1fr 28px;gap:11px;align-items:center;text-align:left;border:1px solid var(--c-border,#e7e9ec);background:var(--c-surface,#fff);border-radius:16px;padding:10px;color:var(--c-text,#111827)}.fs-tag-choice img,.fs-tag-choice-fallback{width:46px;height:46px;border-radius:14px;object-fit:cover;display:grid;place-items:center;background:var(--c-surface2,#f3f4f6);font-size:20px}.fs-tag-choice b{display:block;font-size:14px}.fs-tag-choice small{display:block;margin-top:2px;font-size:11px;color:var(--c-text2,#7c8592)}.fs-tag-choice i{font-style:normal;font-size:22px;color:var(--c-primary,#3f7f2f)}.fs-tag-empty{text-align:center;padding:30px;color:var(--c-text2,#7c8592)}'
    +'[data-theme="dark"] .fs-tag-chip,.dark .fs-tag-chip,body.dark-mode .fs-tag-chip{background:#263249;color:#b7c8e7}[data-theme="dark"] .fs-tag-chip.fs-tag-recipe,.dark .fs-tag-chip.fs-tag-recipe,body.dark-mode .fs-tag-chip.fs-tag-recipe{background:#3c2c25;color:#e4b59e}';document.head.appendChild(s);}

  function boot(){css();patchCreate();patchRender();decorateComposer();var obs=new MutationObserver(function(){patchCreate();patchRender();decorateComposer();});obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('familyapp:feed-updated',function(){setTimeout(decorateComposer,0);});}

  window.FeedTagging={version:'1.0.0',pending:pendingRefs,clear:clear,add:add,remove:remove,openPicker:openPicker,closePicker:closePicker,select:select,openReference:openRef,decorateComposer:decorateComposer};
  window.openFeedTagPicker=openPicker;window.closeFeedTagPicker=closePicker;window.selectFeedTag=select;window.removeFeedTag=remove;window.openFeedReference=openRef;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
