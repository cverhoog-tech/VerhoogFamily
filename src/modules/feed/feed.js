'use strict';
// ============================================================
// FEED - soft social layout
// ============================================================

var STICKERS = ['😂','🥰','🔥','💪','✅','🎉','🤯','😴','🧹','🍳','🛒','💸','❤️','👏','🙈','😅','🤝','🎮','🍕','☕','🌿','⚡','🏆','🦄'];
var REACTIONS = ['❤️','😂','👏','🔥','😮','😢'];
var composeMediaDataUrl = null;
var composeMediaType = 'image';
var composeLinkedTask = null;
var feedNextId = 100;
var feedFilter = 'all';

var FEED_IMAGES = {
  forest:'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=90&fm=webp',
  dog:'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=700&q=90&fm=webp',
  lake:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=90&fm=webp'
};

var feedData = JSON.parse(localStorage.getItem('fam_feed_v2') || 'null') || [
  {id:1,type:'post',author:'Sophie',initials:'SO',color:'#edf2ff',text:'Heerlijke wandeling gemaakt in het bos vandaag! 🌳🚶',time:'2 uur geleden',likes:['Shane','Esra','Mark','Oma','Opa','Emma','Noa','Liam','Mila','Sam','Finn','Sophie','Jamie'],comments:[{author:'Mark',initials:'MA',color:'#eef6f3',text:"Wat een mooie foto\'s! 🥾",time:'1 uur geleden',likes:['Shane','Sophie']}],media:[FEED_IMAGES.forest,FEED_IMAGES.dog,FEED_IMAGES.lake],_showComments:true},
  {id:2,type:'task',author:'Shane',initials:'SH',color:'#eaf7e5',text:'heeft een taak afgerond',title:'Vuilnis buiten zetten',reward:'+10 punten',time:'1u',likes:['Esra','Sophie','Mark','Oma','Opa','Emma','Noa','Liam'],comments:[],_showComments:true},
  {id:3,type:'agenda',author:'Esra',initials:'ES',color:'#efe8ff',text:'heeft een afspraak toegevoegd',title:'Tandarts - Emma',subtitle:'Morgen om 14:30',time:'2u',likes:['Shane','Sophie','Mark'],comments:[],_showComments:true}
];

function saveFeed(){try{localStorage.setItem('fam_feed_v2',JSON.stringify(feedData));}catch(e){}}
function escHtml(s){return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function myPhotoUrl(){try{return firebase.auth().currentUser && firebase.auth().currentUser.photoURL;}catch(e){return null;}}
function avatarUrlFor(name){return name===myName ? myPhotoUrl() : null;}
function avatarHTML(name, initials, color, cls){var url=avatarUrlFor(name); if(url)return '<img class="'+cls+'" src="'+url+'" alt="'+escHtml(name)+'">'; return '<div class="'+cls+'" style="background:'+(color||'#edf2ff')+'">'+escHtml(initials||(name||'?').slice(0,2).toUpperCase())+'</div>';}
function filteredFeed(){if(feedFilter==='tasks')return feedData.filter(function(p){return p.type==='task';}); if(feedFilter==='agenda')return feedData.filter(function(p){return p.type==='agenda';}); return feedData;}
function icon(type){if(type==='task')return '<div class="fs-icon task">✓</div>'; if(type==='agenda')return '<div class="fs-icon agenda">▣</div>'; if(type==='shop')return '<div class="fs-icon shop">▤</div>'; return '<div class="fs-icon post">▧</div>';}

function renderFeed(){
  installFeedCSS();
  decorateCompose();
  var el=document.getElementById('feed-list'); if(!el)return;
  var av=document.getElementById('compose-avatar');
  if(av){av.className='fs-compose-avatar';av.innerHTML=avatarHTML(myName,myInitials,myColor,'fs-compose-avatar-inner');av.style.background='transparent';}
  el.innerHTML=topHTML()+filteredFeed().map(renderPostHTML).join('');
  wireCompose(); wireCommentInputs();
}

function topHTML(){
  var t=feedData.filter(function(p){return p.type==='task';}).length+3;
  var a=feedData.filter(function(p){return p.type==='agenda';}).length+1;
  return '<div class="fs-top"><div class="fs-stats">'+stat('✓',t,'Taken afgerond','task')+stat('▣',a,'Afspraken','agenda')+stat('▤',3,'Boodschappen','shop')+stat('●●',feedData.length+2,'Nieuwe updates','updates')+'</div><div class="fs-filters">'+filter('all','⌂ Alle updates')+filter('tasks','☑ Taken')+filter('agenda','▣ Agenda')+'</div></div>';
}
function stat(i,n,l,c){return '<div class="fs-stat '+c+'"><div>'+i+'</div><b>'+n+'</b><span>'+l+'</span></div>';}
function filter(k,l){return '<button class="fs-filter '+(feedFilter===k?'active':'')+'" onclick="setFeedFilter(\''+k+'\')">'+l+'</button>';}
function setFeedFilter(k){feedFilter=k;renderFeed();}

function renderPostHTML(p){
  var likes=(p.likes||[]).length, comments=(p.comments||[]).length, liked=(p.likes||[]).indexOf(myName)>-1;
  var h='<article class="fs-card '+(p.type||'post')+'"><div class="fs-row"><div class="fs-left">'+icon(p.type)+'</div><div class="fs-body">';
  h+='<div class="fs-head"><div class="fs-line"><strong>'+escHtml(p.author)+'</strong> <span>'+escHtml(p.text||'')+'</span></div><div class="fs-time">'+escHtml(p.time||'nu')+' <button onclick="deletePost('+p.id+')">•••</button></div></div>';
  if(p.type==='task'){h+='<h3>'+escHtml(p.title||'Taak afgerond')+'</h3><div class="fs-reward">'+escHtml(p.reward||'+10 punten')+'</div>';}
  if(p.type==='agenda'){h+='<div class="fs-agenda"><b>▣ '+escHtml(p.title||'Afspraak')+'</b><span>'+escHtml(p.subtitle||'')+'</span></div>';}
  if(p.media)h+=mediaHTML(p.media,p.mediaType);
  h+='<div class="fs-actions"><button class="fs-pill '+(liked?'liked':'')+'" onclick="toggleLike('+p.id+')">♥ '+likes+'</button><button class="fs-pill" onclick="toggleComments('+p.id+')">○ '+comments+'</button></div><div class="fs-sep"></div>';
  h+=commentsHTML(p)+replyHTML(p)+'</div></div></article>'; return h;
}
function mediaHTML(m,type){if(type==='sticker')return '<div class="fs-sticker">'+m+'</div>'; var arr=Array.isArray(m)?m:[m]; return '<div class="fs-media">'+arr.slice(0,3).map(function(u){return '<img src="'+u+'" alt="foto">';}).join('')+'</div>';}
function commentsHTML(p){var cs=p.comments||[]; if(!p._showComments||!cs.length)return ''; return '<div class="fs-comments">'+cs.map(function(c){return '<div class="fs-comment">'+avatarHTML(c.author,c.initials,c.color,'fs-comment-avatar')+'<div><b>'+escHtml(c.author)+'</b><span>'+escHtml(c.text)+'</span><small>'+escHtml(c.time||'nu')+' &nbsp; Beantwoorden &nbsp;♡ '+((c.likes||[]).length||0)+'</small></div></div>';}).join('')+'</div>';}
function replyHTML(p){return '<div class="fs-reply">'+avatarHTML(myName,myInitials,myColor,'fs-reply-avatar')+'<div class="fs-input"><input id="cmt-inp-'+p.id+'" placeholder="Schrijf een reactie..."><button onclick="submitComment('+p.id+')">›</button></div></div>';}

function toggleLike(id){var p=feedData.find(function(x){return x.id===id;}); if(!p)return; p.likes=p.likes||[]; var i=p.likes.indexOf(myName); if(i>-1)p.likes.splice(i,1); else{p.likes.push(myName); if(typeof awardXP==='function')awardXP(1,'Like');} saveFeed();renderFeed();}
function toggleComments(id){var p=feedData.find(function(x){return x.id===id;}); if(!p)return; p._showComments=!p._showComments; renderFeed(); setTimeout(function(){var inp=document.getElementById('cmt-inp-'+id); if(inp)inp.focus();},80);}
function submitComment(id){var inp=document.getElementById('cmt-inp-'+id); if(!inp)return; var text=inp.value.trim(); if(!text){inp.focus();return;} var p=feedData.find(function(x){return x.id===id;}); if(!p)return; p.comments=p.comments||[]; p.comments.push({author:myName,initials:myInitials,color:myColor,text:text,time:'nu',likes:[]}); p._showComments=true; inp.value=''; saveFeed(); renderFeed(); if(typeof addNotif==='function'&&p.author!==myName)addNotif('💬','#f3e8ff',myName+' reageerde op je post','"'+text+'"');}
function deletePost(id){if(!confirm('Post verwijderen?'))return; feedData=feedData.filter(function(p){return p.id!==id;}); saveFeed(); renderFeed(); if(typeof updateStats==='function')updateStats();}
function toggleReaction(){}
function toggleReactionPicker(){}

function clearComposeMedia(){composeMediaDataUrl=null;composeMediaType='image';var prev=document.getElementById('compose-media-preview');var img=document.getElementById('compose-preview-img');if(prev)prev.style.display='none';if(img){img.src='';img.style.display='block';}var s=document.getElementById('sticker-preview-big');if(s)s.remove();}
function clearFeedStatus(){composeLinkedTask=null;var row=document.getElementById('feed-status-row');if(row)row.style.display='none';}
function toggleStickerPicker(){var p=document.getElementById('sticker-picker');if(!p)return;var v=p.style.display==='flex';p.style.display=v?'none':'flex';if(!v)p.innerHTML=STICKERS.map(function(s){return '<button onclick="pickSticker(\''+s+'\')">'+s+'</button>';}).join('');}
function pickSticker(s){composeMediaDataUrl=s;composeMediaType='sticker';var prev=document.getElementById('compose-media-preview');if(prev){prev.style.display='block';var ex=document.getElementById('sticker-preview-big');if(!ex){ex=document.createElement('div');ex.id='sticker-preview-big';ex.style.cssText='font-size:64px;text-align:center;padding:10px';prev.appendChild(ex);}ex.textContent=s;}var p=document.getElementById('sticker-picker');if(p)p.style.display='none';}
function openGifPicker(){var u=prompt('Plak een GIF URL:');if(!u)return;composeMediaDataUrl=u;composeMediaType='gif';var prev=document.getElementById('compose-media-preview'),img=document.getElementById('compose-preview-img');if(prev&&img){img.src=u;img.style.display='block';prev.style.display='block';}}
function openTaskStatusPicker(){if(typeof showToast==='function')showToast('Taak koppelen komt zo terug in Feed 2.0');}
function publishPost(){var ca=document.getElementById('compose-area');var text=(ca?ca.innerText||ca.textContent:'').trim();if(!text&&!composeMediaDataUrl){if(typeof showToast==='function')showToast('Typ iets of voeg een foto toe');return;}feedData.unshift({id:feedNextId++,type:'post',author:myName,initials:myInitials,color:myColor,text:text,time:'nu',likes:[],comments:[],media:composeMediaDataUrl?(composeMediaType==='sticker'?composeMediaDataUrl:[composeMediaDataUrl]):null,mediaType:composeMediaType,_showComments:true});if(ca)ca.textContent='';clearComposeMedia();clearFeedStatus();saveFeed();renderFeed();if(typeof updateStats==='function')updateStats();if(typeof awardXP==='function')awardXP(3,'Post');}
function wireCompose(){var ca=document.getElementById('compose-area');if(ca&&!ca._wired){ca._wired=true;ca.setAttribute('data-placeholder','Deel iets met het gezin...');ca.addEventListener('focus',function(){ca.setAttribute('data-placeholder','');});ca.addEventListener('blur',function(){if(!ca.textContent.trim())ca.setAttribute('data-placeholder','Deel iets met het gezin...');});}var ph=document.getElementById('feed-photo-inp');if(ph&&!ph._wired){ph._wired=true;ph.onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){composeMediaDataUrl=ev.target.result;composeMediaType=f.type==='image/gif'?'gif':'image';var prev=document.getElementById('compose-media-preview'),img=document.getElementById('compose-preview-img');if(prev&&img){img.src=ev.target.result;img.style.display='block';prev.style.display='block';}};r.readAsDataURL(f);ph.value='';};}}
function wireCommentInputs(){feedData.forEach(function(p){var inp=document.getElementById('cmt-inp-'+p.id);if(inp)inp.onkeydown=function(e){if(e.key==='Enter')submitComment(p.id);};});}
function decorateCompose(){var c=document.getElementById('feed-compose-card');if(c)c.classList.add('fs-compose');}

function installFeedCSS(){if(document.getElementById('feed-soft-css-v2'))return;var style=document.createElement('style');style.id='feed-soft-css-v2';style.textContent=`
#screen-feed{background:linear-gradient(180deg,#f7faf6 0%,#fff 55%,#f7faf6 100%);padding-bottom:110px}.fs-top{padding:16px 18px 2px}.fs-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}.fs-stat{min-height:96px;background:#fff;border:1px solid #eef1ed;border-radius:22px;padding:16px;box-shadow:0 10px 28px rgba(17,24,39,.055)}.fs-stat div{width:32px;height:32px;border-radius:16px;background:#eef8ea;color:#2f7f2b;display:flex;align-items:center;justify-content:center;font-weight:900;margin-bottom:10px}.fs-stat.agenda div{background:#efe8ff;color:#7d61d8}.fs-stat.shop div{background:#fff0e5;color:#e27a24}.fs-stat.updates div{background:#e9f0ff;color:#5982e8}.fs-stat b{display:block;font-size:24px;line-height:1;color:#0f172a;margin-bottom:6px}.fs-stat span{font-size:14px;color:#273142}.fs-filters{display:flex;gap:12px;overflow-x:auto;padding-bottom:14px}.fs-filters::-webkit-scrollbar{display:none}.fs-filter{flex:0 0 auto;border:0;border-radius:999px;background:#fff;color:#111827;font-size:17px;font-weight:900;padding:15px 22px;box-shadow:0 10px 26px rgba(17,24,39,.06)}.fs-filter.active{background:#3f7f2f;color:#fff;box-shadow:0 14px 30px rgba(63,127,47,.2)}.fs-compose{margin:6px 18px 18px!important;border:1px solid #eef1ed!important;border-radius:26px!important;background:#fff!important;box-shadow:0 10px 30px rgba(17,24,39,.06)!important;padding:18px!important}.fs-compose-avatar{background:transparent!important}.fs-compose-avatar-inner{width:54px!important;height:54px!important;border-radius:50%!important;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900}.fs-compose-avatar-inner img{width:100%;height:100%;object-fit:cover}#screen-feed .compose-input{min-height:78px!important;border:1.5px solid #e5e9ee;border-radius:18px;padding:15px 16px!important;font-size:17px!important;color:#111827!important;background:#fff!important}#screen-feed .feed-compose-card [onclick='publishPost()']{background:#3f7f2f!important;border-radius:999px!important;padding:11px 22px!important;font-size:15px!important}.fs-card{margin:0 18px 18px;background:#fff;border:1px solid #eef1ed;border-radius:30px;box-shadow:0 13px 32px rgba(17,24,39,.06);padding:30px 20px 24px;overflow:hidden}.fs-row{display:flex;gap:22px;align-items:flex-start}.fs-left{flex:0 0 58px}.fs-icon{width:58px;height:58px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900}.fs-icon.task{background:#eaf7e5;color:#3f7f2f}.fs-icon.agenda{background:#efe8ff;color:#7557d7}.fs-icon.shop{background:#fff0e5;color:#e27a24}.fs-icon.post{background:#edf2ff;color:#6e8ee8}.fs-body{flex:1;min-width:0}.fs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.fs-line{font-size:20px;line-height:1.34;color:#586174}.fs-line strong{color:#111827;font-weight:950}.fs-time{font-size:16px;color:#9aa3b2;white-space:nowrap}.fs-time button{border:0;background:transparent;color:#9aa3b2}.fs-card h3{font-size:26px;line-height:1.15;margin:14px 0 8px;color:#0f172a;letter-spacing:-.7px}.fs-reward{color:#3f7f2f;font-size:22px;font-weight:900;margin-bottom:26px}.fs-agenda{display:inline-flex;flex-direction:column;background:#f0eafb;border-radius:22px;padding:18px 22px;margin:22px 0 28px;color:#1f2937}.fs-agenda b{font-size:22px}.fs-agenda span{font-size:18px;color:#8a8f9d;margin-top:6px}.fs-media{display:flex;gap:12px;overflow-x:auto;padding:22px 0}.fs-media::-webkit-scrollbar{display:none}.fs-media img{width:142px;height:112px;object-fit:cover;border-radius:18px;box-shadow:0 8px 18px rgba(17,24,39,.08);flex:0 0 auto}.fs-sticker{font-size:62px;text-align:center;padding:20px 0}.fs-actions{display:flex;gap:14px;margin:10px 0 24px}.fs-pill{border:0;border-radius:999px;background:#f5f6f8;color:#5f6878;font-size:20px;font-weight:850;padding:13px 22px;min-width:88px}.fs-pill.liked{background:#fff1f4;color:#e11d48}.fs-sep{height:1px;background:#e9edf1;margin-bottom:20px}.fs-comments{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}.fs-comment{display:flex;gap:15px}.fs-comment-avatar,.fs-reply-avatar{width:54px;height:54px;border-radius:50%;object-fit:cover;flex:0 0 54px;display:flex;align-items:center;justify-content:center;color:#111827;font-weight:900}.fs-comment b{display:block;font-size:20px;color:#111827}.fs-comment span{display:block;font-size:20px;color:#111827;line-height:1.25;margin-top:2px}.fs-comment small{display:block;font-size:16px;color:#8d96a6;margin-top:8px}.fs-reply{display:flex;align-items:center;gap:14px}.fs-input{height:58px;border:1.5px solid #e3e8ef;border-radius:999px;display:flex;align-items:center;flex:1;background:#fff;overflow:hidden}.fs-input input{flex:1;border:0;outline:0;background:transparent;padding:0 20px;font-size:18px;color:#111827}.fs-input input::placeholder{color:#a1a8b3}.fs-input button{width:50px;height:50px;border:0;border-radius:50%;background:#edf8ea;color:#3f7f2f;font-size:28px;font-weight:900;margin-right:4px}@media(max-width:380px){.fs-card{margin-left:14px;margin-right:14px;padding:24px 16px}.fs-line{font-size:18px}.fs-row{gap:16px}.fs-left{flex-basis:52px}.fs-icon{width:52px;height:52px}.fs-media img{width:126px;height:102px}.fs-filter{font-size:15px;padding:13px 18px}}`;
document.head.appendChild(style);}
