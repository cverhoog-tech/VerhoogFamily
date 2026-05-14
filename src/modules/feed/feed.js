'use strict';
// ============================================================
// FEED
// ============================================================

// ============================================================
// FEED
// ============================================================

var STICKERS = ['😂','🥰','🔥','💪','✅','🎉','🤯','😴','🧹','🍳','🛒','💸','❤️','👏','🙈','😅','🤝','🎮','🍕','☕','🌿','⚡','🏆','🦄'];
var REACTIONS = ['❤️','😂','👏','🔥','😮','😢'];

var composeMediaDataUrl = null;
var composeMediaType = 'image'; // 'image' | 'gif' | 'sticker'
var composeLinkedTask = null;   // {id, title, who}
var feedNextId = 10;

// Starter feed data
var feedData = [
  {id:1, author:'Esra', color:'#c0547a', initials:'ES', text:'Hoi! De app is er 🎉', time:'Gisteren', likes:['Shane'], reactions:{}, comments:[], _showComments:false},
  {id:2, author:'Shane', color:'#2d5a27', initials:'SH', text:'Ziet er goed uit! 💪', time:'Gisteren', likes:[], reactions:{'❤️':['Esra']}, comments:[], _showComments:false},
];

function renderFeed() {
  var el = document.getElementById('feed-list');
  if(!el) return;

  // Update compose avatar
  var av = document.getElementById('compose-avatar');
  if(av) { av.textContent = myInitials; av.style.background = myColor; }

  el.innerHTML = feedData.map(function(p){ return renderPostHTML(p); }).join('');

  // Wire up compose placeholder
  var ca = document.getElementById('compose-area');
  if(ca) {
    ca.setAttribute('data-placeholder', 'Deel iets met het gezin...');
    if(!ca._wired) {
      ca._wired = true;
      ca.addEventListener('focus', function(){ ca.setAttribute('data-placeholder',''); });
      ca.addEventListener('blur', function(){
        if(!ca.textContent.trim()) ca.setAttribute('data-placeholder','Deel iets met het gezin...');
      });
    }
  }

  // Wire photo input
  var photoInp = document.getElementById('feed-photo-inp');
  if(photoInp && !photoInp._wired) {
    photoInp._wired = true;
    photoInp.onchange = function(e) {
      var file = e.target.files[0]; if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        composeMediaDataUrl = ev.target.result;
        composeMediaType = file.type === 'image/gif' ? 'gif' : 'image';
        var prev = document.getElementById('compose-media-preview');
        var img  = document.getElementById('compose-preview-img');
        if(prev && img) { img.src = ev.target.result; prev.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
      photoInp.value = '';
    };
  }

  // Wire comment inputs
  feedData.forEach(function(p) {
    if(!p._showComments) return;
    var inp = document.getElementById('cmt-inp-'+p.id);
    if(inp) {
      inp.onkeydown = function(e) { if(e.key==='Enter') submitComment(p.id); };
    }
  });
}

function renderPostHTML(p) {
  var likedByMe = p.likes.indexOf(myName) > -1;
  var totalLikes = p.likes.length;

  // Reaction counts
  var reactionCounts = {};
  Object.keys(p.reactions||{}).forEach(function(emoji){
    reactionCounts[emoji] = (p.reactions[emoji]||[]).length;
  });
  var hasReactions = Object.keys(reactionCounts).some(function(e){return reactionCounts[e]>0;});

  var html = '<div class="feed-post" id="fp-'+p.id+'">';

  // Header
  html += '<div class="feed-post-header">'
    +'<div class="feed-post-avatar" style="background:'+p.color+'">'+p.initials+'</div>'
    +'<div class="feed-post-meta">'
    +'<div class="feed-post-author">'+p.author
    +(p.statusText ? ' <span style="font-size:12px;font-weight:400;color:var(--c-text2)">— '+p.statusText+'</span>' : '')
    +'</div>'
    +(p.linkedTask ? '<div class="feed-post-status">📌 '+p.linkedTask.title+'</div>' : '')
    +'<div class="feed-post-time">'+p.time+'</div>'
    +'</div>'
    +'<button onclick="deletePost('+p.id+')" style="background:none;border:none;font-size:16px;color:var(--c-text3);cursor:pointer;padding:4px">⋯</button>'
    +'</div>';

  // Task badge
  if(p.linkedTask) {
    html += '<div class="feed-task-badge">📋 '+p.linkedTask.title+'</div>';
  }

  // Text
  if(p.text) html += '<div class="feed-post-text">'+escHtml(p.text)+'</div>';

  // Media
  if(p.media) {
    if(p.mediaType === 'sticker') {
      html += '<div class="feed-post-sticker">'+p.media+'</div>';
    } else {
      html += '<img class="feed-post-img" src="'+p.media+'" alt="foto">';
    }
  }

  // Reactions bar
  if(hasReactions) {
    html += '<div class="feed-emoji-row">';
    Object.keys(reactionCounts).forEach(function(emoji){
      if(!reactionCounts[emoji]) return;
      var mine = (p.reactions[emoji]||[]).indexOf(myName) > -1;
      html += '<button class="feed-emoji-btn'+(mine?' mine':'')+'" onclick="toggleReaction('+p.id+',\''+emoji+'\')">'
        +emoji+' '+reactionCounts[emoji]+'</button>';
    });
    html += '</div>';
  }

  // Actions
  html += '<div class="feed-post-actions">'
    +'<button class="feed-act-btn'+(likedByMe?' liked':'')+'" onclick="toggleLike('+p.id+')">'
    +(likedByMe?'❤️':'🤍')+' '+totalLikes+'</button>'
    +'<button class="feed-act-btn" onclick="toggleComments('+p.id+')">'
    +'💬 '+(p.comments.length||0)+'</button>'
    +'<button class="feed-act-btn" onclick="toggleReactionPicker('+p.id+')">'
    +'😊 Reactie</button>'
    +'</div>';

  // Reaction picker
  if(p._showReactions) {
    html += '<div style="display:flex;gap:8px;padding:8px 14px;background:var(--c-surface2)">'
      +REACTIONS.map(function(emoji){
        return '<button onclick="toggleReaction('+p.id+',\''+emoji+'\')" '
          +'style="background:none;border:none;font-size:24px;cursor:pointer;transition:transform .12s" '
          +'onmousedown="this.style.transform=\'scale(1.3)\'" '
          +'onmouseup="this.style.transform=\'scale(1)\'">'+emoji+'</button>';
      }).join('')
      +'</div>';
  }

  // Comments
  if(p._showComments) {
    html += '<div class="feed-comments">';
    html += '<div id="cmt-list-'+p.id+'">';
    p.comments.forEach(function(c){
      html += '<div class="feed-comment">'
        +'<div class="feed-cmt-avatar" style="background:'+(c.color||'#888')+'">'+((c.author||'?').substring(0,2).toUpperCase())+'</div>'
        +'<div class="feed-cmt-bubble">'
        +'<div class="feed-cmt-author">'+c.author+'</div>'
        +'<div class="feed-cmt-text">'+escHtml(c.text)+'</div>'
        +'</div></div>';
    });
    html += '</div>'; // close cmt-list
    html += '<div class="feed-cmt-inp-row">'
      +'<input class="feed-cmt-inp" id="cmt-inp-'+p.id+'" placeholder="Schrijf een reactie...">'
      +'<button class="feed-cmt-send" onclick="submitComment('+p.id+')">'
      +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
      +' Sturen</button>'
      +'</div>'
      +'</div>'; // close feed-comments
  }

  html += '</div>';
  return html;
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toggleLike(id) {
  var p = feedData.find(function(x){return x.id===id;});
  if(!p) return;
  var idx = p.likes.indexOf(myName);
  if(idx > -1) { p.likes.splice(idx,1); }
  else { p.likes.push(myName); awardXP(1,'Like'); }
  renderFeed();
}

function toggleReaction(id, emoji) {
  var p = feedData.find(function(x){return x.id===id;});
  if(!p) return;
  if(!p.reactions) p.reactions = {};
  if(!p.reactions[emoji]) p.reactions[emoji] = [];
  var idx = p.reactions[emoji].indexOf(myName);
  if(idx > -1) p.reactions[emoji].splice(idx, 1);
  else p.reactions[emoji].push(myName);
  p._showReactions = false;
  renderFeed();
}

function toggleReactionPicker(id) {
  var p = feedData.find(function(x){return x.id===id;});
  if(!p) return;
  feedData.forEach(function(x){ if(x.id!==id) x._showReactions=false; });
  p._showReactions = !p._showReactions;
  renderFeed();
}

function toggleComments(id) {
  var p = feedData.find(function(x){return x.id===id;});
  if(!p) return;
  p._showComments = !p._showComments;
  renderFeed();
  if(p._showComments) {
    setTimeout(function(){
      var inp = document.getElementById('cmt-inp-'+id);
      if(inp) inp.focus();
    }, 100);
  }
}

function submitComment(id) {
  var inp = document.getElementById('cmt-inp-'+id);
  var btn = inp ? inp.parentNode.querySelector('.feed-cmt-send') : null;
  if(!inp) return;
  var text = inp.value.trim();
  if(!text) { inp.focus(); return; }
  var p = feedData.find(function(x){return x.id===id;});
  if(!p) return;

  // Animate button — send state
  if(btn) {
    btn.classList.add('sending');
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Verstuurd!';
  }

  // Add comment to data
  var comment = {author:myName, color:myColor, text:text, time:'Nu'};
  p.comments.push(comment);
  inp.value = '';
  inp.disabled = true;

  // Short delay then switch to sent state + inject new comment without full re-render
  setTimeout(function(){
    if(btn) {
      btn.classList.remove('sending');
      btn.classList.add('sent');
    }

    // Inject new comment directly into DOM
    var cmtList = document.getElementById('cmt-list-'+id);
    if(cmtList) {
      var div = document.createElement('div');
      div.className = 'feed-comment';
      div.style.animation = 'fadeSlideIn .25s ease';
      div.innerHTML = '<div class="feed-cmt-avatar" style="background:'+comment.color+'">'+comment.author.substring(0,2).toUpperCase()+'</div>'
        +'<div class="feed-cmt-bubble">'
        +'<div class="feed-cmt-author">'+comment.author+'</div>'
        +'<div class="feed-cmt-text">'+escHtml(comment.text)+'</div>'
        +'</div>';
      cmtList.appendChild(div);
      div.scrollIntoView({behavior:'smooth', block:'nearest'});
    }

    // Success badge below input
    var inpRow = inp.parentNode;
    var existing = inpRow.parentNode.querySelector('.feed-cmt-success');
    if(!existing) {
      var badge = document.createElement('div');
      badge.className = 'feed-cmt-success';
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        +' Reactie geplaatst!';
      inpRow.parentNode.insertBefore(badge, inpRow.nextSibling);
      setTimeout(function(){ badge.style.animation='fadeSlideIn .2s ease reverse'; setTimeout(function(){badge.remove();},200); }, 2200);
    }

    // Re-enable input + reset button after 1.5s
    setTimeout(function(){
      inp.disabled = false;
      inp.focus();
      if(btn){
        btn.classList.remove('sent');
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Sturen';
      }
    }, 1500);

  }, 180);

  // Notify partner
  if(p.author !== myName) {
    addNotif('💬', '#f3e8ff', myName+' reageerde op je post', '"'+text+'"');
  }
  trackWeeklyProgress('likes');
}

function deletePost(id) {
  if(!confirm('Post verwijderen?')) return;
  feedData = feedData.filter(function(p){return p.id!==id;});
  renderFeed(); updateStats();
}

// ── COMPOSE HELPERS ──
function clearComposeMedia() {
  composeMediaDataUrl = null;
  var prev = document.getElementById('compose-media-preview');
  if(prev) prev.style.display = 'none';
}

function clearFeedStatus() {
  composeLinkedTask = null;
  var row = document.getElementById('feed-status-row');
  if(row) row.style.display = 'none';
}

function toggleStickerPicker() {
  var picker = document.getElementById('sticker-picker');
  if(!picker) return;
  var visible = picker.style.display === 'flex';
  picker.style.display = visible ? 'none' : 'flex';
  if(!visible) {
    picker.innerHTML = STICKERS.map(function(s){
      return '<button onclick="pickSticker(\''+s+'\')" style="background:none;border:none;font-size:28px;cursor:pointer;padding:4px;transition:transform .12s" onmousedown="this.style.transform=\'scale(1.3)\'" onmouseup="this.style.transform=\'scale(1)\'">'+s+'</button>';
    }).join('');
  }
}

function pickSticker(sticker) {
  composeMediaDataUrl = sticker;
  composeMediaType = 'sticker';
  var prev = document.getElementById('compose-media-preview');
  var img  = document.getElementById('compose-preview-img');
  // Show sticker as text in preview
  if(prev) {
    prev.style.display = 'block';
    if(img) { img.style.display = 'none'; }
    // Add sticker preview div
    var existing = document.getElementById('sticker-preview-big');
    if(!existing) {
      existing = document.createElement('div');
      existing.id = 'sticker-preview-big';
      existing.style.cssText = 'font-size:64px;text-align:center;padding:10px';
      prev.appendChild(existing);
    }
    existing.textContent = sticker;
  }
  document.getElementById('sticker-picker').style.display = 'none';
}

function openGifPicker() {
  // Show a simple GIF URL input
  var url = prompt('Plak een GIF URL:');
  if(!url) return;
  composeMediaDataUrl = url;
  composeMediaType = 'gif';
  var prev = document.getElementById('compose-media-preview');
  var img  = document.getElementById('compose-preview-img');
  if(prev && img) { img.src = url; img.style.display = 'block'; prev.style.display = 'block'; }
}

function openTaskStatusPicker() {
  // Show tasks as a sheet to pick from
  var myTasks = taskData.filter(function(t){return !t.done;}).slice(0, 15);
  currentAddType = 'task_status_pick';
  document.getElementById('sheet-title').textContent = '📌 Koppel aan taak';
  document.getElementById('sheet-fields').innerHTML =
    '<div style="font-size:12px;color:var(--c-text2);margin-bottom:10px">Kies een taak om als status te koppelen aan je post:</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">'
    +myTasks.map(function(t){
      return '<button data-taskpick="'+t.id+'" style="background:var(--c-surface2);border:none;border-radius:10px;padding:10px 12px;text-align:left;font-size:13px;font-weight:600;color:var(--c-text);cursor:pointer">'
        +(t.prio==='high'?'🔴 ':t.prio==='medium'?'🟡 ':'')
        +t.title+(t.who&&t.who.length?' · <span style="color:var(--c-text2);font-weight:400">'+t.who.join(', ')+'</span>':'')
        +'</button>';
    }).join('')
    +(myTasks.length===0?'<div style="color:var(--c-text2);text-align:center;padding:20px">Geen open taken</div>':'')
    +'</div>';
  document.getElementById('add-overlay').classList.add('open');
  setTimeout(function(){
    document.querySelectorAll('[data-taskpick]').forEach(function(btn){
      btn.onclick = function(){
        var t = taskData.find(function(x){return x.id===parseInt(btn.dataset.taskpick);});
        if(t) {
          composeLinkedTask = {id:t.id, title:t.title, who:t.who};
          var row = document.getElementById('feed-status-row');
          var lbl = document.getElementById('feed-status-task-label');
          if(row) row.style.display = 'block';
          if(lbl) lbl.textContent = t.title;
        }
        closeAdd();
      };
    });
  }, 100);
}

function publishPost() {
  var ca = document.getElementById('compose-area');
  var text = (ca ? ca.innerText || ca.textContent : '').trim();
  if(!text && !composeMediaDataUrl) { showToast('Typ iets of voeg een foto toe'); return; }

  var statusText = null;
  if(composeLinkedTask) {
    var hours = new Date().getHours();
    statusText = (hours < 12 ? 'is bezig met' : hours < 17 ? 'is aan het' : 'deed') + ' ' + composeLinkedTask.title.toLowerCase();
  }

  var post = {
    id: feedNextId++,
    author: myName,
    color: myColor,
    initials: myInitials,
    text: text,
    time: 'Nu',
    likes: [],
    reactions: {},
    comments: [],
    _showComments: false,
    _showReactions: false,
    media: composeMediaDataUrl || null,
    mediaType: composeMediaType,
    linkedTask: composeLinkedTask || null,
    statusText: statusText
  };

  feedData.unshift(post);

  // Reset compose
  if(ca) ca.textContent = '';
  clearComposeMedia();
  clearFeedStatus();
  composeLinkedTask = null;
  composeMediaDataUrl = null;

  renderFeed(); updateStats();
  awardXP(3, 'Post');
  addActivity('📸', '#f3e8ff', myName+' plaatste in de feed'+(statusText?' ('+statusText+')':''));

  // Notify partner
  addNotif('📸','#f3e8ff', myName+' plaatste iets', text.substring(0,60)||(post.media?'(foto/sticker)':''));
  trackWeeklyProgress('posts');
}



