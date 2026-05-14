'use strict';
// ============================================================
// FEED - premium soft social layout
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

var PROFILE_AVATAR_KEY = 'familyapp-current-user-avatar-v1';
var PROFILE_AVATAR_ID_KEY = 'familyapp-current-user-avatar-id-v1';
var PROFILE_NAME_KEY = 'familyapp-profile-name-v1';
var EXACT_AVATAR_BASE = './src/assets/avatars/exact';
var EXACT_AVATARS = {
  aiden: EXACT_AVATAR_BASE + '/01-aiden.webp',
  kai: EXACT_AVATAR_BASE + '/02-kai.webp',
  liam: EXACT_AVATAR_BASE + '/03-liam.webp',
  asuna: EXACT_AVATAR_BASE + '/04-asuna.webp',
  elizabeth: EXACT_AVATAR_BASE + '/05-elizabeth.webp',
  mila: EXACT_AVATAR_BASE + '/06-mila.webp',
  dylan: EXACT_AVATAR_BASE + '/07-dylan.webp',
  ethan: EXACT_AVATAR_BASE + '/08-ethan.webp',
  noah: EXACT_AVATAR_BASE + '/09-noah.webp',
  sophie: EXACT_AVATAR_BASE + '/10-sophie.webp',
  luna: EXACT_AVATAR_BASE + '/11-luna.webp',
  zara: EXACT_AVATAR_BASE + '/12-zara.webp'
};
function profileName(){
  try { return localStorage.getItem(PROFILE_NAME_KEY) || myName || 'Shane'; }
  catch(e) { return 'Shane'; }
}
function isOwnFeedAuthor(name){
  var n = String(name || '').trim().toLowerCase();
  var mine = String(profileName() || 'Shane').trim().toLowerCase();
  return !n || n === mine || n === 'shane' || n === 'jij' || n === 'me';
}
function currentProfileAvatarUrl(){
  try {
    var uploaded = localStorage.getItem(PROFILE_AVATAR_KEY);
    if (uploaded && (uploaded.indexOf('data:') === 0 || uploaded.indexOf('/src/assets/avatars/exact/') > -1 || uploaded.indexOf('./src/assets/avatars/exact/') === 0)) return uploaded;
    var id = localStorage.getItem(PROFILE_AVATAR_ID_KEY) || 'aiden';
    return EXACT_AVATARS[id] || EXACT_AVATARS.aiden;
  } catch(e) {
    return EXACT_AVATARS.aiden;
  }
}
function fallbackAvatarForName(name){
  var n = String(name || '').toLowerCase();
  if(n.indexOf('esra') > -1) return EXACT_AVATARS.sophie;
  if(n.indexOf('sophie') > -1) return EXACT_AVATARS.sophie;
  if(n.indexOf('mark') > -1) return EXACT_AVATARS.ethan;
  if(n.indexOf('emma') > -1) return EXACT_AVATARS.elizabeth;
  if(n.indexOf('boodschappen') > -1) return EXACT_AVATARS.luna;
  return EXACT_AVATARS.aiden;
}
function stableAvatarUrl(name){
  name = name || profileName();
  if(isOwnFeedAuthor(name)) return currentProfileAvatarUrl();
  var stored = localStorage.getItem('fam_avatar_'+String(name).toLowerCase());
  if(stored) return stored;
  return fallbackAvatarForName(name);
}
function avatarHTML(name, initials, color, cls){return '<img class="'+cls+'" src="'+stableAvatarUrl(name)+'" alt="'+escHtml(name||'avatar')+'" style="object-fit:cover;object-position:50% 36%;" onerror="this.onerror=null;this.src=\''+EXACT_AVATARS.aiden+'\'">';}
function filteredFeed(){if(feedFilter==='tasks')return feedData.filter(function(p){return p.type==='task';}); if(feedFilter==='agenda')return feedData.filter(function(p){return p.type==='agenda';}); return feedData;}
function svgIcon(type){
  var stroke = 'currentColor';
  if(type==='task') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  if(type==='agenda') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
  if(type==='shop') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M6 10h12M7 14h10M8 18h8"/></svg>';
  if(type==='updates') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="12" r="3.5"/><circle cx="16" cy="12" r="3.5"/></svg>';
  if(type==='home') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>';
  if(type==='comment') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1.2-4A8 8 0 1 1 21 12z"/></svg>';
  if(type==='bookmark') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v17l-6-4-6 4V4z"/></svg>';
  if(type==='send') return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="'+stroke+'" stroke-width="2.2"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';
}
function icon(type){return '<div class="fs-icon '+(type||'post')+'">'+svgIcon(type||'post')+'</div>';}

function renderFeed(){installFeedCSS();decorateCompose();var el=document.getElementById('feed-list');if(!el)return;var av=document.getElementById('compose-avatar');if(av){av.className='fs-compose-avatar';av.innerHTML=avatarHTML(myName,myInitials,myColor,'fs-compose-avatar-inner');av.style.background='transparent';}el.innerHTML=topHTML()+filteredFeed().map(renderPostHTML).join('');wireCompose();wireCommentInputs();}

window.openFeedShortcut = function openFeedShortcut(type){
  var target = { task:'tasks', agenda:'cal', shop:'shop', updates:'feed' }[type] || type;
  try {
    if (target === 'feed') {
      feedFilter = 'all';
      if (typeof showScreen === 'function') { showScreen('feed'); return; }
      renderFeed();
      return;
    }
    if ((target === 'shop' || target === 'cal') && typeof showScreenMore === 'function') {
      showScreenMore(target);
      return;
    }
    if (typeof showScreen === 'function') {
      showScreen(target);
      return;
    }
    var selector = '[data-goto="' + target + '"], [data-goto-more="' + target + '"]';
    var btn = document.querySelector(selector);
    if (btn) { btn.click(); return; }
    if (typeof showToast === 'function') showToast('Open module: ' + target);
  } catch(e) {
    if (typeof showToast === 'function') showToast('Open module: ' + target);
  }
};

function topHTML(){var t=feedData.filter(function(p){return p.type==='task';}).length+3;var a=feedData.filter(function(p){return p.type==='agenda';}).length+1;return '<div class="fs-top"><div class="fs-stats">'+stat('task',t,'Taken afgerond')+stat('agenda',a,'Afspraken')+stat('shop',3,'Boodschappen')+stat('updates',feedData.length+2,'Nieuwe updates')+'</div><div class="fs-filters">'+filter('all','home','Alle updates')+filter('tasks','task','Taken')+filter('agenda','agenda','Agenda')+'</div></div>';}
function stat(type,n,l){return '<button type="button" class="fs-stat '+type+'" onclick="openFeedShortcut(\''+type+'\')" aria-label="Open '+escHtml(l)+'"><div class="fs-stat-ico">'+svgIcon(type)+'</div><div class="fs-stat-copy"><b>'+n+'</b><span>'+l+'</span></div><span class="fs-stat-arr">›</span></button>'; }
function filter(k,type,l){return '<button class="fs-filter '+(feedFilter===k?'active':'')+'" onclick="setFeedFilter(\''+k+'\')"><span>'+svgIcon(type)+'</span>'+l+'</button>';}
function setFeedFilter(k){feedFilter=k;renderFeed();}

function renderPostHTML(p){var likes=(p.likes||[]).length,comments=(p.comments||[]).length,liked=(p.likes||[]).indexOf(myName)>-1;var h='<article class="fs-card '+(p.type||'post')+'">';if(p.type==='post')h+=postHeader(p);else h+='<div class="fs-row"><div class="fs-left">'+icon(p.type)+'</div><div class="fs-body">'+eventHead(p);if(p.type==='task'){h+='<h3>'+escHtml(p.title||'Taak afgerond')+'</h3><div class="fs-reward">'+escHtml(p.reward||'+10 punten')+'</div>';}if(p.type==='agenda'){h+='<div class="fs-agenda"><b>'+svgIcon('agenda')+escHtml(p.title||'Afspraak')+'</b><span>'+escHtml(p.subtitle||'')+'</span></div>';}if(p.media)h+=mediaHTML(p.media,p.mediaType);h+=actionsHTML(p,likes,comments,liked);h+=commentsHTML(p)+replyHTML(p);if(p.type==='post')h+='';else h+='</div></div>';h+='</article>';return h;}
function postHeader(p){return '<div class="fs-post-head">'+avatarHTML(p.author,p.initials,p.color,'fs-author-avatar')+'<div class="fs-post-meta"><b>'+escHtml(p.author)+'</b><span>'+escHtml(p.time||'nu')+' · 👥</span></div><button onclick="deletePost('+p.id+')">•••</button></div><div class="fs-post-text">'+escHtml(p.text||'')+'</div>'+(p.media?mediaHTML(p.media,p.mediaType):'');}
function eventHead(p){return '<div class="fs-head"><div class="fs-line"><strong>'+escHtml(p.author)+'</strong> <span>'+escHtml(p.text||'')+'</span></div><div class="fs-time">'+escHtml(p.time||'nu')+' <button onclick="deletePost('+p.id+')">•••</button></div></div>';}
function actionsHTML(p,likes,comments,liked){return '<div class="fs-actions"><button class="fs-pill '+(liked?'liked':'')+'" onclick="toggleLike('+p.id+')"><span>♥</span>'+likes+'</button><button class="fs-pill" onclick="toggleComments('+p.id+')"><span>'+svgIcon('comment')+'</span>'+comments+'</button><button class="fs-bookmark" aria-label="Bewaren">'+svgIcon('bookmark')+'</button></div><div class="fs-sep"></div>';}
function mediaHTML(m,type){
  if(type==='sticker')return '<div class="fs-sticker">'+m+'</div>';
  var arr=Array.isArray(m)?m:[m];
  return '<div class="fs-media">'+arr.slice(0,3).map(function(u,i){
    var id='feed-photo-'+Math.random().toString(36).slice(2);
    return '<button class="fs-media-tile" type="button" onclick="openFeedPhotoViewer(\''+encodeURIComponent(u)+'\')" aria-label="Foto openen"><img id="'+id+'" src="'+u+'" alt="foto"><span class="fs-media-hint">Bekijk</span></button>';
  }).join('')+'</div>';
}
function openFeedPhotoViewer(encodedUrl){
  var url='';
  try{url=decodeURIComponent(encodedUrl||'');}catch(e){url=encodedUrl||'';}
  if(!url)return;
  var existing=document.getElementById('feed-photo-viewer');
  if(existing)existing.remove();
  var overlay=document.createElement('div');
  overlay.id='feed-photo-viewer';
  overlay.className='fs-photo-viewer';
  overlay.innerHTML='<div class="fs-photo-backdrop" onclick="closeFeedPhotoViewer()"></div><div class="fs-photo-sheet"><button class="fs-photo-close" onclick="closeFeedPhotoViewer()">×</button><img class="fs-photo-full" src="'+url+'" alt="Feed foto"><div class="fs-photo-actions"><button onclick="saveFeedPhoto(\''+encodedUrl+'\')">Opslaan</button><button onclick="openFeedPhotoInNewTab(\''+encodedUrl+'\')">Openen</button></div></div>';
  document.body.appendChild(overlay);
}
function closeFeedPhotoViewer(){var el=document.getElementById('feed-photo-viewer');if(el)el.remove();}
function saveFeedPhoto(encodedUrl){
  var url='';
  try{url=decodeURIComponent(encodedUrl||'');}catch(e){url=encodedUrl||'';}
  if(!url)return;
  var a=document.createElement('a');
  a.href=url;
  a.download='familyapp-feed-foto.png';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){try{a.remove();}catch(e){}},50);
}
function openFeedPhotoInNewTab(encodedUrl){
  var url='';
  try{url=decodeURIComponent(encodedUrl||'');}catch(e){url=encodedUrl||'';}
  if(url)window.open(url,'_blank','noopener');
}

function commentsHTML(p){var cs=p.comments||[];if(!p._showComments||!cs.length)return '';return '<div class="fs-comments">'+cs.map(function(c){return '<div class="fs-comment">'+avatarHTML(c.author,c.initials,c.color,'fs-comment-avatar')+'<div><b>'+escHtml(c.author)+'</b><span>'+escHtml(c.text)+'</span><small>'+escHtml(c.time||'nu')+' &nbsp; Beantwoorden &nbsp;♡ '+((c.likes||[]).length||0)+'</small></div></div>';}).join('')+'</div>';}
function replyHTML(p){return '<div class="fs-reply">'+avatarHTML(myName,myInitials,myColor,'fs-reply-avatar')+'<div class="fs-input"><input id="cmt-inp-'+p.id+'" placeholder="Schrijf een reactie..."><button onclick="submitComment('+p.id+')">'+svgIcon('send')+'</button></div></div>';}

function toggleLike(id){var p=feedData.find(function(x){return x.id===id;});if(!p)return;p.likes=p.likes||[];var i=p.likes.indexOf(myName);if(i>-1)p.likes.splice(i,1);else{p.likes.push(myName);if(typeof awardXP==='function')awardXP(1,'Like');}saveFeed();renderFeed();}
function toggleComments(id){var p=feedData.find(function(x){return x.id===id;});if(!p)return;p._showComments=!p._showComments;renderFeed();setTimeout(function(){var inp=document.getElementById('cmt-inp-'+id);if(inp)inp.focus();},80);}
function submitComment(id){var inp=document.getElementById('cmt-inp-'+id);if(!inp)return;var text=inp.value.trim();if(!text){inp.focus();return;}var p=feedData.find(function(x){return x.id===id;});if(!p)return;p.comments=p.comments||[];p.comments.push({author:profileName(),initials:myInitials,color:myColor,text:text,time:'nu',likes:[]});p._showComments=true;inp.value='';saveFeed();renderFeed();if(typeof addNotif==='function'&&p.author!==myName)addNotif('💬','#f3e8ff',myName+' reageerde op je post','"'+text+'"');}
function deletePost(id){if(!confirm('Post verwijderen?'))return;feedData=feedData.filter(function(p){return p.id!==id;});saveFeed();renderFeed();if(typeof updateStats==='function')updateStats();}
function toggleReaction(){}function toggleReactionPicker(){}
function clearComposeMedia(){composeMediaDataUrl=null;composeMediaType='image';var prev=document.getElementById('compose-media-preview');var img=document.getElementById('compose-preview-img');if(prev)prev.style.display='none';if(img){img.src='';img.style.display='block';}var s=document.getElementById('sticker-preview-big');if(s)s.remove();}
function clearFeedStatus(){composeLinkedTask=null;var row=document.getElementById('feed-status-row');if(row)row.style.display='none';}
function toggleStickerPicker(){var p=document.getElementById('sticker-picker');if(!p)return;var v=p.style.display==='flex';p.style.display=v?'none':'flex';if(!v)p.innerHTML=STICKERS.map(function(s){return '<button onclick="pickSticker(\''+s+'\')">'+s+'</button>';}).join('');}
function pickSticker(s){composeMediaDataUrl=s;composeMediaType='sticker';var prev=document.getElementById('compose-media-preview');if(prev){prev.style.display='block';var ex=document.getElementById('sticker-preview-big');if(!ex){ex=document.createElement('div');ex.id='sticker-preview-big';ex.style.cssText='font-size:64px;text-align:center;padding:10px';prev.appendChild(ex);}ex.textContent=s;}var p=document.getElementById('sticker-picker');if(p)p.style.display='none';}
function openGifPicker(){var u=prompt('Plak een GIF URL:');if(!u)return;composeMediaDataUrl=u;composeMediaType='gif';var prev=document.getElementById('compose-media-preview'),img=document.getElementById('compose-preview-img');if(prev&&img){img.src=u;img.style.display='block';prev.style.display='block';}}
function openTaskStatusPicker(){if(typeof showToast==='function')showToast('Taak koppelen komt zo terug in Feed 2.0');}
function publishPost(){var ca=document.getElementById('compose-area');var text=(ca?ca.innerText||ca.textContent:'').trim();if(!text&&!composeMediaDataUrl){if(typeof showToast==='function')showToast('Typ iets of voeg een foto toe');return;}feedData.unshift({id:feedNextId++,type:'post',author:profileName(),initials:myInitials,color:myColor,text:text,time:'nu',likes:[],comments:[],media:composeMediaDataUrl?(composeMediaType==='sticker'?composeMediaDataUrl:[composeMediaDataUrl]):null,mediaType:composeMediaType,_showComments:true});if(ca)ca.textContent='';clearComposeMedia();clearFeedStatus();saveFeed();renderFeed();if(typeof updateStats==='function')updateStats();if(typeof awardXP==='function')awardXP(3,'Post');}
function wireCompose(){var ca=document.getElementById('compose-area');if(ca&&!ca._wired){ca._wired=true;ca.setAttribute('data-placeholder','Deel iets met het gezin...');ca.addEventListener('focus',function(){ca.setAttribute('data-placeholder','');});ca.addEventListener('blur',function(){if(!ca.textContent.trim())ca.setAttribute('data-placeholder','Deel iets met het gezin...');});}var ph=document.getElementById('feed-photo-inp');if(ph&&!ph._wired){ph._wired=true;ph.onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){composeMediaDataUrl=ev.target.result;composeMediaType=f.type==='image/gif'?'gif':'image';var prev=document.getElementById('compose-media-preview'),img=document.getElementById('compose-preview-img');if(prev&&img){img.src=ev.target.result;img.style.display='block';prev.style.display='block';}};r.readAsDataURL(f);ph.value='';};}}
function wireCommentInputs(){feedData.forEach(function(p){var inp=document.getElementById('cmt-inp-'+p.id);if(inp)inp.onkeydown=function(e){if(e.key==='Enter')submitComment(p.id);};});}
function decorateCompose(){var c=document.getElementById('feed-compose-card');if(c)c.classList.add('fs-compose');}

function installFeedCSS(){if(document.getElementById('feed-soft-css-v4'))return;var style=document.createElement('style');style.id='feed-soft-css-v4';style.textContent=`
#screen-feed{background:linear-gradient(180deg,#fbfcfb 0%,#fff 54%,#f7faf6 100%);padding-bottom:110px}.fs-top{padding:10px 16px 0;display:flex;flex-direction:column}.fs-stats{order:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}.fs-stat{height:78px;background:#fff;border:1px solid #edf0ee;border-radius:20px;appearance:none;-webkit-appearance:none;width:100%;text-align:left;cursor:pointer;font:inherit;padding:12px 14px;box-shadow:0 9px 24px rgba(17,24,39,.045);display:grid;grid-template-columns:38px 1fr 12px;align-items:center;gap:10px}.fs-stat-ico{width:34px!important;height:34px!important;border-radius:15px!important;background:#eef8ea;color:#2f7f2b;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important}.fs-stat-ico svg{width:18px;height:18px}.fs-stat.agenda .fs-stat-ico{background:#efe8ff;color:#7d61d8}.fs-stat.shop .fs-stat-ico{background:#fff0e5;color:#e27a24}.fs-stat.updates .fs-stat-ico{background:#e9f0ff;color:#5982e8}.fs-stat-copy b{display:block;font-size:22px;line-height:1;color:#111827;margin-bottom:4px;letter-spacing:-.3px}.fs-stat-copy span{font-size:13px;color:#273142;font-weight:500}.fs-stat-arr{color:#8d96a6;font-size:22px}.fs-stat:active{transform:scale(.985)}.fs-filters{order:2;display:grid;grid-template-columns:1.2fr .85fr .95fr;gap:9px;margin:0 0 14px;padding:0;overflow:visible}.fs-filter{min-width:0;border:0;border-radius:999px;background:#fff;color:#111827;font-size:14px;font-weight:850;padding:11px 10px;box-shadow:0 8px 22px rgba(17,24,39,.055);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center;gap:7px}.fs-filter span{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex:0 0 18px}.fs-filter svg{width:18px;height:18px}.fs-filter.active{background:#3f7f2f;color:#fff;box-shadow:0 12px 28px rgba(63,127,47,.18)}.fs-compose{margin:10px 16px 14px!important;border:1px solid #edf0ee!important;border-radius:24px!important;background:#fff!important;box-shadow:0 9px 24px rgba(17,24,39,.05)!important;padding:14px!important}.fs-compose-avatar{background:transparent!important}.fs-compose-avatar-inner{width:46px!important;height:46px!important;border-radius:50%!important;object-fit:cover;display:block!important;box-shadow:0 4px 12px rgba(17,24,39,.09)}#screen-feed .compose-input{min-height:60px!important;border:1.5px solid #e5e9ee;border-radius:18px;padding:13px 14px!important;font-size:15px!important;line-height:1.35;color:#111827!important;background:#fff!important}#screen-feed .feed-compose-card [onclick='publishPost()']{background:#3f7f2f!important;border-radius:999px!important;padding:10px 20px!important;font-size:14px!important;font-weight:850!important}.fs-card{margin:0 16px 14px;background:#fff;border:1px solid #edf0ee;border-radius:27px;box-shadow:0 10px 28px rgba(17,24,39,.055);padding:18px 16px 16px;overflow:hidden}.fs-row{display:flex;gap:14px;align-items:flex-start}.fs-left{flex:0 0 46px}.fs-icon{width:46px;height:46px;border-radius:18px;display:flex;align-items:center;justify-content:center}.fs-icon svg{width:22px;height:22px}.fs-icon.task{background:#eaf7e5;color:#3f7f2f}.fs-icon.agenda{background:#efe8ff;color:#7557d7}.fs-icon.shop{background:#fff0e5;color:#e27a24}.fs-icon.post{background:#edf2ff;color:#6e8ee8}.fs-body{flex:1;min-width:0}.fs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.fs-line{font-size:17px;line-height:1.32;color:#586174;letter-spacing:-.2px}.fs-line strong{color:#111827;font-weight:900}.fs-time{font-size:13px;color:#9aa3b2;white-space:nowrap;padding-top:1px}.fs-time button,.fs-post-head button{border:0;background:transparent;color:#9aa3b2;font-size:14px;padding:0}.fs-post-head{display:grid;grid-template-columns:48px 1fr 28px;gap:12px;align-items:center;margin-bottom:14px}.fs-author-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(17,24,39,.09)}.fs-post-meta b{display:block;font-size:16px;color:#111827;font-weight:900}.fs-post-meta span{display:block;font-size:13px;color:#8d96a6;margin-top:2px}.fs-post-text{font-size:16px;color:#172033;line-height:1.38;margin-bottom:12px}.fs-card h3{font-size:21px;line-height:1.15;margin:11px 0 6px;color:#0f172a;letter-spacing:-.5px;font-weight:950}.fs-reward{color:#3f7f2f;font-size:18px;font-weight:900;margin-bottom:17px}.fs-agenda{display:inline-flex;flex-direction:column;background:#f0eafb;border-radius:18px;padding:14px 17px;margin:16px 0 20px;color:#1f2937}.fs-agenda b{font-size:16px;display:flex;align-items:center;gap:8px}.fs-agenda b svg{width:17px;height:17px}.fs-agenda span{font-size:14px;color:#8a8f9d;margin-top:4px}.fs-media{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 0 15px;overflow:visible}.fs-media-tile{position:relative;border:0;background:transparent;padding:0;border-radius:15px;overflow:hidden;cursor:pointer;appearance:none;-webkit-appearance:none}.fs-media-tile:active{transform:scale(.985)}.fs-media img,.fs-media-tile img{width:100%;height:86px;object-fit:cover;border-radius:15px;box-shadow:0 6px 14px rgba(17,24,39,.07);display:block}.fs-media-hint{position:absolute;right:7px;bottom:7px;background:rgba(17,24,39,.72);color:#fff;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800;opacity:.0;transition:opacity .15s}.fs-media-tile:hover .fs-media-hint,.fs-media-tile:focus-visible .fs-media-hint{opacity:1}.fs-photo-viewer{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}.fs-photo-backdrop{position:absolute;inset:0;background:rgba(8,12,18,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.fs-photo-sheet{position:relative;z-index:1;width:min(100%,440px);display:flex;flex-direction:column;gap:12px}.fs-photo-full{width:100%;max-height:72vh;object-fit:contain;border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.35);background:#111}.fs-photo-close{position:absolute;top:-12px;right:-8px;width:38px;height:38px;border:0;border-radius:999px;background:#fff;color:#111827;font-size:27px;line-height:1;box-shadow:0 10px 28px rgba(0,0,0,.22)}.fs-photo-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fs-photo-actions button{border:0;border-radius:999px;padding:13px 14px;background:#fff;color:#111827;font-weight:900;font-size:15px}.fs-photo-actions button:first-child{background:#3f7f2f;color:#fff}.fs-sticker{font-size:46px;text-align:center;padding:14px 0}.fs-actions{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:10px;margin:7px 0 14px}.fs-pill{border:0;border-radius:999px;background:#f5f6f8;color:#5f6878;font-size:15px;font-weight:800;padding:9px 14px;min-width:60px;display:flex;align-items:center;justify-content:center;gap:7px}.fs-pill svg{width:17px;height:17px}.fs-pill.liked{background:#fff1f4;color:#e11d48}.fs-bookmark{justify-self:end;border:0;background:transparent;color:#172033;width:34px;height:34px;display:flex;align-items:center;justify-content:center}.fs-bookmark svg{width:21px;height:21px}.fs-sep{height:1px;background:#e9edf1;margin-bottom:13px}.fs-comments{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}.fs-comment{display:flex;gap:10px;align-items:flex-start}.fs-comment-avatar,.fs-reply-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;flex:0 0 42px;box-shadow:0 3px 10px rgba(17,24,39,.08)}.fs-comment b{display:inline;font-size:14px;color:#111827;margin-right:6px}.fs-comment span{display:inline;font-size:14px;color:#111827;line-height:1.28}.fs-comment small{display:block;font-size:12px;color:#8d96a6;margin-top:4px}.fs-reply{display:flex;align-items:center;gap:10px}.fs-input{height:46px;border:1.5px solid #e3e8ef;border-radius:999px;display:flex;align-items:center;flex:1;background:#fff;overflow:hidden}.fs-input input{flex:1;border:0;outline:0;background:transparent;padding:0 14px;font-size:15px;color:#111827;min-width:0}.fs-input input::placeholder{color:#a1a8b3}.fs-input button{width:38px;height:38px;border:0;border-radius:50%;background:#edf8ea;color:#3f7f2f;margin-right:4px;display:flex;align-items:center;justify-content:center}.fs-input button svg{width:18px;height:18px}@media(max-width:380px){.fs-top{padding-left:14px;padding-right:14px}.fs-compose,.fs-card{margin-left:14px!important;margin-right:14px!important}.fs-filter{font-size:13px;padding:10px 7px;gap:5px}.fs-line{font-size:16px}.fs-card h3{font-size:20px}.fs-media img{height:78px}.fs-row{gap:12px}.fs-left{flex-basis:44px}.fs-icon{width:44px;height:44px}.fs-comment-avatar,.fs-reply-avatar{width:38px;height:38px;flex-basis:38px}.fs-input{height:44px}.fs-input button{width:36px;height:36px}}`;
document.head.appendChild(style);}


// Keep the legacy feed in sync with the profile module. When a profile avatar
// changes, the feed re-renders so composer, new posts and reaction boxes all
// immediately show the selected avatar instead of the old fallback image.
if(!window.__familyAppFeedAvatarSyncV1){
  window.__familyAppFeedAvatarSyncV1 = true;
  window.addEventListener('familyapp:avatar-updated', function(){ try { renderFeed(); } catch(e) {} });
  window.addEventListener('storage', function(event){
    if(event && (event.key === PROFILE_AVATAR_KEY || event.key === PROFILE_AVATAR_ID_KEY || event.key === PROFILE_NAME_KEY)) {
      try { renderFeed(); } catch(e) {}
    }
  });
}
