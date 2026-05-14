'use strict';
// ============================================================
// NOTITIES
// ============================================================

function renderNotes() {
  renderNoteGrid();
}

function setNbFilter(f, btn) {
  nbFilter=f;
  document.querySelectorAll('#nb-chips .chip').forEach(function(c){c.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderNoteGrid();
}

function renderNoteGrid() {
  var grid=document.getElementById('notes-grid');if(!grid)return;
  var notes=noteData;
  if(nbFilter!=='all')notes=notes.filter(function(n){return n.nb===nbFilter;});
  if(!notes.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;color:#ccc;font-size:14px">Geen notities</div>';return;}
  grid.innerHTML=notes.map(function(n){
    var preview=(n.blocks||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.content||'';}).join(' ').substring(0,80);
    return '<div class="note-card nc-'+n.color+'" onclick="openNoteEditor('+n.id+')">'
      +'<div class="note-card-title">'+n.title+'</div>'
      +'<div class="note-card-preview">'+(preview||'<em style="color:#ccc">Leeg</em>')+'</div>'
      +'<div class="note-card-foot"><span class="note-nb">'+(n.nb||'Gezin')+'</span><span>'+(n.time||'')+'</span></div>'
      +'</div>';
  }).join('');
}

// ── EDITOR ──
function openNoteEditor(id) {
  activeNoteId=id;
  var note=id?noteData.find(function(n){return n.id===id;}):null;
  neBlocks=JSON.parse(JSON.stringify(note?note.blocks||[]:[]));
  neBlockNextId=neBlocks.length?Math.max.apply(null,neBlocks.map(function(b){return b.id||0;}))+1:1;
  neSelected=null;neMode='select';neHistory=[];neImgHistory={};neDrawOnImg=null;
  neNoteColor=note?note.color||'yellow':'yellow';

  document.getElementById('ne-title').value=note?note.title||'':'';
  var nb=document.getElementById('ne-nb');if(nb&&note)nb.value=note.nb||'Gezin';
  document.getElementById('ne-lastmod').textContent=note?(note.who||'')+' · '+(note.time||''):'';
  document.querySelectorAll('.ne-cdot').forEach(function(d){d.classList.toggle('active',d.dataset.c===neNoteColor);});

  document.getElementById('ne-screen').classList.add('open');
  renderNeBlocks();
  setNeMode('select');
  setTimeout(function(){resizeNeCanvas();},50);

  // Events (only bind once by checking)
  document.getElementById('ne-back').onclick=function(){closeNoteEditor(true);};
  document.getElementById('ne-save-btn').onclick=function(){
    saveNote();
    var btn=document.getElementById('ne-save-btn');
    btn.textContent='✓ Opgeslagen';btn.style.background='#16a34a';
    setTimeout(function(){btn.textContent='Opslaan';btn.style.background='#2d5a27';},1500);
  };
  document.getElementById('ne-draw-color').oninput=function(e){neDrawColor=e.target.value;};
  document.getElementById('ne-draw-size').oninput=function(e){neDrawSize=parseInt(e.target.value);};
  document.getElementById('ne-img-inp').onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var area=document.getElementById('ne-canvas-area');
      var scrollY=area?area.scrollTop:0;
      var b={id:neBlockNextId++,type:'image',src:ev.target.result,x:20,y:scrollY+20,w:260,h:195,drawStrokes:[]};
      neBlocks.push(b);renderNeBlocks();selectBlock(b.id);
    };
    reader.readAsDataURL(file);
    e.target.value='';
  };
}

function closeNoteEditor(save) {
  if(save)saveNote();
  document.getElementById('ne-screen').classList.remove('open');
  renderNoteGrid();
}

function saveNote() {
  var title=document.getElementById('ne-title').value.trim()||'Naamloos';
  var nb=(document.getElementById('ne-nb')||{}).value||'Gezin';
  // Capture text from contenteditable blocks
  neBlocks.forEach(function(b){
    if(b.type==='text'){
      var el=document.getElementById('ne-txt-'+b.id);
      if(el)b.content=el.innerText;
    }
    if(b.type==='image'&&neImgHistory[b.id]){b.drawStrokes=neImgHistory[b.id];}
  });
  var now=new Date().toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
  if(activeNoteId){
    var n=noteData.find(function(x){return x.id===activeNoteId;});
    if(n){n.title=title;n.blocks=JSON.parse(JSON.stringify(neBlocks));n.color=neNoteColor;n.nb=nb;n.time=now;n.who=myName;}
  } else {
    var newNote={id:noteNextId++,title:title,blocks:JSON.parse(JSON.stringify(neBlocks)),color:neNoteColor,nb:nb,who:myName,time:'Zojuist'};
    noteData.unshift(newNote);
    activeNoteId=newNote.id;
    awardXP(4,'Notitie');addActivity('📝','#f0ede8',myName+' maakte notitie "'+title+'" aan');
  }
}

function setNoteColor(c, el) {
  neNoteColor=c;
  document.querySelectorAll('.ne-cdot').forEach(function(d){d.classList.toggle('active',d.dataset.c===c);});
}

function setNeMode(mode) {
  neMode=mode;
  var canvas=document.getElementById('ne-draw-canvas');
  var drawTools=document.getElementById('ne-draw-tools');
  var selTools=document.getElementById('ne-sel-tools');
  document.getElementById('ne-mode-sel').classList.toggle('active',mode==='select');
  document.getElementById('ne-mode-draw').classList.toggle('active',mode==='draw');
  if(canvas){canvas.style.pointerEvents=mode==='draw'?'auto':'none';canvas.style.cursor=mode==='draw'?'crosshair':'default';}
  if(drawTools)drawTools.style.display=mode==='draw'?'flex':'none';
  if(selTools)selTools.style.display=mode==='select'?'flex':'none';
  if(mode==='draw')initCanvasDraw();
}

function setDrawTool(t) {
  neDrawTool=t;
  ['pen','marker','eraser'].forEach(function(x){
    var el=document.getElementById('ne-'+x);if(el)el.classList.toggle('active',x===t);
  });
}

function addTextBlock() {
  var area = document.getElementById('ne-canvas-area');
  var scrollY = area ? area.scrollTop : 0;
  var maxBottom = neBlocks.reduce(function(m,b){ return Math.max(m,(b.y||0)+(b.h||80)+12); }, scrollY+16);
  var b = {id:neBlockNextId++, type:'text', x:12, y:maxBottom, w:0, h:80, content:''};
  neBlocks.push(b);
  renderNeBlocks();
  selectBlock(b.id);
  setTimeout(function(){
    var el = document.getElementById('ne-txt-'+b.id);
    if(el){ el.focus(); }
  }, 60);
}

function placeCursorAtEnd(el) {
  try {
    var range = document.createRange(), sel = window.getSelection();
    range.selectNodeContents(el); range.collapse(false);
    sel.removeAllRanges(); sel.addRange(range);
  } catch(e){}
}

function deleteSelectedBlock() { if(neSelected) deleteBlock(neSelected); }

function deleteBlock(id) {
  neBlocks = neBlocks.filter(function(b){ return b.id !== id; });
  if(neSelected === id) neSelected = null;
  renderNeBlocks();
}

function selectBlock(id) {
  neSelected = id;
  document.querySelectorAll('.ne-block').forEach(function(el){
    el.classList.toggle('sel', el.id === 'neb-'+id);
  });
}

function renderNeBlocks() {
  var layer = document.getElementById('ne-blocks'); if(!layer) return;
  var area  = document.getElementById('ne-canvas-area');
  var areaW = area ? area.clientWidth : 360;
  var maxY  = neBlocks.reduce(function(m,b){ return Math.max(m,(b.y||0)+(b.h||80)+60); }, 300);
  layer.style.height = Math.max(maxY, area ? area.clientHeight : 400) + 'px';

  layer.innerHTML = neBlocks.map(function(b){
    var isSel = neSelected === b.id;
    var bw = Math.max(areaW - 24, 120);
    b.w = bw;
    var inner = '';
    if(b.type === 'text') {
      inner = '<div class="ne-block-drag-handle" data-bid="'+b.id+'">⠿ slepen</div>'
        +'<div id="ne-txt-'+b.id+'" class="ne-text-area" contenteditable="true" data-ph="Typ hier..."></div>';
    } else if(b.type === 'image') {
      inner = '<div class="ne-block-drag-handle" data-bid="'+b.id+'">⠿ slepen</div>'
        +'<div style="position:relative">'
        +'<img src="'+b.src+'" style="width:100%;display:block;border-radius:8px;pointer-events:none" draggable="false">'
        +'<canvas id="ne-ic-'+b.id+'" style="position:absolute;top:0;left:0;width:100%;border-radius:8px;'
        +(neDrawOnImg===b.id?'display:block;pointer-events:auto;cursor:crosshair':'display:none')
        +'" width="'+bw+'" height="'+(b.h||195)+'"></canvas>'
        +'</div>';
    }
    return '<div class="ne-block'+(isSel?' sel':'')+'" id="neb-'+b.id+'" style="left:'+b.x+'px;top:'+b.y+'px;width:'+bw+'px">'
      +inner
      +'<div class="ne-del" onclick="deleteBlock('+b.id+')">✕</div>'
      +'</div>';
  }).join('');

  neBlocks.forEach(function(b){
    var el  = document.getElementById('neb-'+b.id); if(!el) return;
    var txt = document.getElementById('ne-txt-'+b.id);
    var handle = el.querySelector('.ne-block-drag-handle');

    el.addEventListener('pointerdown', function(e){
      if(e.target.classList.contains('ne-del')) return;
      if(e.target.classList.contains('ne-block-drag-handle')) return;
      selectBlock(b.id);
    });

    if(handle) {
      handle.addEventListener('pointerdown', function(e){
        e.preventDefault(); e.stopPropagation();
        selectBlock(b.id);
        startBlockDrag(e, b);
      });
    }

    if(txt) {
      // Restore content after innerHTML wipe
      if(b.content) {
        txt.innerHTML = b.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
      txt.style.minHeight = Math.max(b.h-32, 40) + 'px';
      txt.addEventListener('input', function(){ autoGrow(b.id); saveBlockText(b.id); });
      txt.addEventListener('blur',  function(){ saveBlockText(b.id); });
      txt.addEventListener('focus', function(){ selectBlock(b.id); });
    }

    if(b.type === 'image') {
      var ic = document.getElementById('ne-ic-'+b.id);
      if(ic){ redrawImgCanvas(b.id); if(neDrawOnImg===b.id) attachImgDraw(b.id,ic); }
    }
  });

  resizeNeCanvas();
}

function startBlockDrag(e, b) {
  var el = document.getElementById('neb-'+b.id); if(!el) return;
  var startClientY = e.clientY;
  var startBlockY  = b.y || 0;
  el.style.opacity = '0.7';
  el.style.zIndex  = '10';

  function onMove(ev) {
    b.y = Math.max(0, startBlockY + (ev.clientY - startClientY));
    el.style.top = b.y + 'px';
    var layer = document.getElementById('ne-blocks');
    if(layer){ var need = b.y+(b.h||80)+60; if(parseInt(layer.style.height)<need) layer.style.height=need+'px'; }
  }
  function onUp() {
    el.style.opacity = '';
    el.style.zIndex  = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup',   onUp);
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup',   onUp);
}

// Keep startDrag for backwards compat (no-op now)
function startDrag(e,id){}

function saveBlockText(id){
  var b  = neBlocks.find(function(x){ return x.id===id; });
  var el = document.getElementById('ne-txt-'+id);
  if(b && el) b.content = el.innerText || '';
}

function autoGrow(id){
  var b  = neBlocks.find(function(x){ return x.id===id; });
  var el = document.getElementById('ne-txt-'+id);
  if(!b || !el) return;
  el.style.minHeight = '40px';
  b.h = el.scrollHeight + 32;
  el.style.minHeight = (b.h - 32) + 'px';
}


function startResize(e,id){
  e.preventDefault();e.stopPropagation();
  var b=neBlocks.find(function(x){return x.id===id;});if(!b)return;
  var startX=e.clientX;var startY=e.clientY;
  var origW=b.w||200;var origH=b.h||80;
  var el=document.getElementById('neb-'+id);
  function onMove(ev){
    b.w=Math.max(80,origW+(ev.clientX-startX));
    b.h=Math.max(40,origH+(ev.clientY-startY));
    if(el){
      el.style.width=b.w+'px';
      var txt=el.querySelector('.ne-text-area');
      if(txt)txt.style.width=(b.w-20)+'px';
      var img=el.querySelector('img');
      if(img)img.style.width=b.w+'px';
      var ic=document.getElementById('ne-ic-'+id);
      if(ic){ic.width=b.w;ic.style.width=b.w+'px';redrawImgCanvas(id);}
    }
  }
  function onUp(){window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);}
  window.addEventListener('pointermove',onMove);
  window.addEventListener('pointerup',onUp);
}

function toggleDrawOnImg(){
  var btn=document.getElementById('ne-draw-on-img-btn');
  if(!neSelected){showToast('Selecteer eerst een afbeelding');return;}
  var b=neBlocks.find(function(x){return x.id===neSelected;});
  if(!b||b.type!=='image'){showToast('Selecteer een afbeelding blok');return;}
  neDrawOnImg=neDrawOnImg===b.id?null:b.id;
  if(btn)btn.classList.toggle('active',neDrawOnImg===b.id);
  renderNeBlocks();
}

function resizeNeCanvas(){
  var area=document.getElementById('ne-canvas-area');if(!area)return;
  var layer=document.getElementById('ne-blocks');
  var h=Math.max(area.scrollHeight,layer?layer.offsetHeight:0,400);
  var canvas=document.getElementById('ne-draw-canvas');if(!canvas)return;
  var dpr=window.devicePixelRatio||1;
  canvas.width=area.clientWidth*dpr;
  canvas.height=h*dpr;
  canvas.style.width=area.clientWidth+'px';
  canvas.style.height=h+'px';
  redrawCanvas();
}

function initCanvasDraw(){
  var canvas=document.getElementById('ne-draw-canvas');if(!canvas)return;
  var painting=false;
  function getPos(e){
    var rect=canvas.getBoundingClientRect();
    var dpr=window.devicePixelRatio||1;
    var t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-rect.left)*dpr,y:(t.clientY-rect.top)*dpr};
  }
  canvas.onpointerdown=canvas.ontouchstart=function(e){
    if(neMode!=='draw')return;
    e.preventDefault();painting=true;
    var p=getPos(e);
    neHistory.push({tool:neDrawTool,color:neDrawColor,size:neDrawSize,points:[p]});
  };
  canvas.onpointermove=canvas.ontouchmove=function(e){
    if(!painting||neMode!=='draw')return;
    e.preventDefault();
    var p=getPos(e);
    if(neHistory.length)neHistory[neHistory.length-1].points.push(p);
    redrawCanvas();
  };
  canvas.onpointerup=canvas.ontouchend=function(){painting=false;};
}

function redrawCanvas(){
  var canvas=document.getElementById('ne-draw-canvas');if(!canvas)return;
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  neHistory.forEach(function(s){drawStroke(ctx,s);});
}

function drawStroke(ctx,s){
  if(!s.points||s.points.length<2)return;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(s.tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,1)';ctx.lineWidth=s.size*4;}
  else if(s.tool==='marker'){ctx.globalCompositeOperation='source-over';ctx.strokeStyle=s.color+'66';ctx.lineWidth=s.size*3;}
  else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=s.color;ctx.lineWidth=s.size;}
  ctx.beginPath();ctx.moveTo(s.points[0].x,s.points[0].y);
  s.points.forEach(function(p){ctx.lineTo(p.x,p.y);});
  ctx.stroke();ctx.restore();
}

function neUndo(){
  if(neMode==='draw'){neHistory.pop();redrawCanvas();}
  else if(neDrawOnImg&&neImgHistory[neDrawOnImg]){neImgHistory[neDrawOnImg].pop();redrawImgCanvas(neDrawOnImg);}
}

function attachImgDraw(id,canvas){
  if(!neImgHistory[id])neImgHistory[id]=[];
  var painting=false;
  function getPos(e){
    var rect=canvas.getBoundingClientRect();
    var t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-rect.left)*(canvas.width/rect.width),y:(t.clientY-rect.top)*(canvas.height/rect.height)};
  }
  canvas.onpointerdown=canvas.ontouchstart=function(e){e.preventDefault();painting=true;var p=getPos(e);neImgHistory[id].push({tool:neDrawTool,color:neDrawColor,size:neDrawSize,points:[p]});};
  canvas.onpointermove=canvas.ontouchmove=function(e){e.preventDefault();if(!painting)return;var p=getPos(e);if(neImgHistory[id].length)neImgHistory[id][neImgHistory[id].length-1].points.push(p);redrawImgCanvas(id);};
  canvas.onpointerup=canvas.ontouchend=function(){painting=false;};
}

function redrawImgCanvas(id){
  var canvas=document.getElementById('ne-ic-'+id);if(!canvas)return;
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var strokes=(neImgHistory[id]||[]).concat((neBlocks.find(function(b){return b.id===id;})||{}).drawStrokes||[]);
  strokes.forEach(function(s){drawStroke(ctx,s);});
}

