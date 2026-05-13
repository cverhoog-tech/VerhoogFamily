


(function(){
try{
if(window.__famV023){return;} window.__famV023=1;

/* ── LANGUAGE ── */
var lang=localStorage.getItem('fam_lang')||'nl';
var tr={
  en:{add:'+ Add Quest',today:'Today',tomorrow:'Tomorrow',overmorrow:'Day after tomorrow',week:'Next week',later:'Later',done:'completed',level:'Level',streak:'Streak',party:'Party',newq:'New Quest',complete:'Mark as completed',reopen:'Reopen quest',help:'Ask for help',rewards:'Rewards',subprog:'completed',askhelp:'Ask for help 👥',groupq:'GROUP QUEST',helpreq:'Help requested!',helpat:'asks for help with:',xpboth:'+20 XP for both of you',decline:'Decline',accept:'Accept'},
  nl:{add:'+ Quest toevoegen',today:'Vandaag',tomorrow:'Morgen',overmorrow:'Overmorgen',week:'Volgende week',later:'Later',done:'voltooid',level:'Level',streak:'Streak',party:'Party',newq:'Nieuwe Quest',complete:'Markeer als voltooid',reopen:'Quest opnieuw openen',help:'Vraag om hulp',rewards:'Beloningen',subprog:'voltooid',askhelp:'Vraag hulp 👥',groupq:'GROUP QUEST',helpreq:'Hulp gevraagd!',helpat:'vraagt om hulp bij:',xpboth:'+20 XP voor jullie beiden',decline:'Weigeren',accept:'Accepteren'}
};
var L=function(k){return (tr[lang]&&tr[lang][k])||k;};

/* ── IMAGE MAPS ── */
var H={tasks:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=95&fm=webp',shop:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=95&fm=webp',posts:'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=95&fm=webp',recipes:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=95&fm=webp'};
var I={today:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=95&fm=webp',level:'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=95&fm=webp',streak:'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=900&q=95&fm=webp',party:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=95&fm=webp',home:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=90&fm=webp',plant:'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=700&q=90&fm=webp',car:'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=700&q=90&fm=webp',dent:'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=90&fm=webp',kids:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=90&fm=webp',food:'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=700&q=90&fm=webp',work:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=90&fm=webp',laundry:'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=700&q=90&fm=webp'};

function pick(s){
  s=(s||'').toLowerCase();
  if(s.indexOf('kind')>-1||s.indexOf('school')>-1){return I.kids;}
  if(s.indexOf('auto')>-1||s.indexOf('car')>-1){return I.car;}
  if(s.indexOf('plant')>-1){return I.plant;}
  if(s.indexOf('was')>-1||s.indexOf('laundry')>-1){return I.laundry;}
  if(s.indexOf('eten')>-1||s.indexOf('kook')>-1||s.indexOf('boodschap')>-1){return I.food;}
  if(s.indexOf('tand')>-1||s.indexOf('dokter')>-1){return I.dent;}
  if(s.indexOf('kamer')>-1||s.indexOf('huis')>-1||s.indexOf('stof')>-1){return I.home;}
  return I.work;
}

/* ── PRIORITY HELPERS ── */
function prioCls(p){
  if(!p)return '';
  p=p.toLowerCase();
  if(p==='hoog'||p==='high')return 'hoog';
  if(p==='normaal'||p==='medium'||p==='normal')return 'normaal';
  return 'laag';
}
function prioLabel(p){
  if(!p)return 'Laag';
  var m={hoog:'Hoog',high:'Hoog',normaal:'Normaal',medium:'Normaal',normal:'Normaal',laag:'Laag',low:'Laag'};
  return m[p.toLowerCase()]||p;
}
function xpForType(type,prio){
  if(!prio)prio='laag';
  prio=prio.toLowerCase();
  if(type.indexOf('RAID')>-1)return '+120 XP';
  if(type.indexOf('DUNGEON')>-1)return '+60 XP';
  if(prio==='hoog'||prio==='high')return '+30 XP';
  if(prio==='normaal'||prio==='medium')return '+20 XP';
  return '+10 XP';
}

/* ── DATA ── */
var data=JSON.parse(localStorage.getItem('fam_tasks_v023')||localStorage.getItem('fam_tasks_v022')||localStorage.getItem('fam_tasks_v021')||'null')||[
  ['living','SIDE QUEST','Stofzuigen woonkamer','Maak de woonkamer weer fris.','2026-05-13','Esra','+20 XP',I.home,['Kussens opruimen','Vloer stofzuigen','Kleed schoonmaken'],1,'once','2026-05-13','laag'],
  ['plant','SIDE QUEST','Planten water geven','Zorg dat alle planten genoeg water hebben.','2026-05-14','Esra','+10 XP',I.plant,['Gieter vullen','Alle planten nalopen'],0,'once','2026-05-14','laag'],
  ['car','SIDE QUEST','Auto wassen','Maak de auto van buiten en binnen schoon.','2026-05-20','Shane','+40 XP',I.car,['Buitenkant wassen','Interieur opruimen'],0,'once','2026-05-20','normaal']
];

function save(){localStorage.setItem('fam_tasks_v023',JSON.stringify(data));}

/* ── HOME BG ── */
function bg(el,url){
  if(!el){return;}
  el.style.setProperty('background-image','url('+url+')','important');
  el.style.setProperty('background-size','cover','important');
  el.style.setProperty('background-position','center','important');
  var im=el.querySelector('img');
  if(im){im.src=url;im.style.opacity=1;im.style.objectFit='cover';}
}
function home(){
  if(!T(A('.header-title')[0]).match(/familie|family/)){return;}
  var c=A('.home-epic-cards .epic-card,.home-pills .home-pill,.home-card,.home-pills>*,.home-epic-cards>*');
  bg(c[0],H.tasks);bg(c[1],H.shop);bg(c[2],H.posts);
  var s=A('.home-carousel .home-slide,.home-slide,.recipes-slide,.agenda-slide,.meals-slide');
  bg(s[0],H.recipes);
}

/* ── HELPERS ── */
var A=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var T=function(e){return (e&&e.textContent||'').toLowerCase();};
function task(){return A('.task-tabs,.ttab').length||T(A('.header-title')[0]).match(/taken|tasks/);}
function overview(){var a=A('.ttab.active,.task-tabs .active')[0];return !a||T(a).match(/overzicht|overview/);}
function root(){return document.getElementById('task-content')||A('.task-content')[0];}

/* ── GROUPING ── */
function group(x){
  var d=new Date(x[11]||x[4]);
  var now=new Date();now.setHours(0,0,0,0);
  var diff=Math.round((new Date(d.toDateString())-now)/86400000);
  if(isNaN(diff)){return L('later');}
  if(diff===0){return L('today');}
  if(diff===1){return L('tomorrow');}
  if(diff===2){return L('overmorrow');}
  if(diff>2&&diff<8){return L('week');}
  return L('later');
}

/* ── STAT TILES ── */
function stats(done,total){
  var pct=Math.round(done/Math.max(total,1)*100);
  return '<div class="fqStats">'+
    '<div class="fqStat" data-stat="level" style="background-image:url('+I.level+')">'+
      '<div class="fqIcon">⭐</div>'+
      '<h4>'+L('level').toUpperCase()+'</h4>'+
      '<b>12</b>'+
      '<div class="fqBar p"><i style="width:56%"></i></div>'+
      '<p>450 / 800 XP</p>'+
      '<div class="fqNext">›</div>'+
    '</div>'+
    '<div class="fqStat" data-stat="streak" style="background-image:url('+I.streak+')">'+
      '<div class="fqIcon">🔥</div>'+
      '<h4>'+L('streak').toUpperCase()+'</h4>'+
      '<b>7</b>'+
      '<p>dagen op rij</p>'+
      '<div class="fqNext">›</div>'+
    '</div>'+
    '<div class="fqStat" data-stat="party" style="background-image:url('+I.party+')">'+
      '<div class="fqIcon">👥</div>'+
      '<h4>'+L('party').toUpperCase()+'</h4>'+
      '<b>3</b>'+
      '<div class="fqPartyAvatars"><div class="fqPav fqPav1">SK</div><div class="fqPav fqPav2">ES</div><div class="fqPav fqPav3">SH</div></div>'+
      '<div class="fqNext">›</div>'+
    '</div>'+
  '</div>';
}

/* ── QUEST CARD ── */
function card(x){
  var isRaid=x[1].indexOf('RAID')>-1;
  var isDung=x[1].indexOf('DUNGEON')>-1;
  var cls=isRaid?'raid':(isDung?'dungeon':'');
  var prio=x[12]||'laag';
  var typeBadge='<span class="fqBadge '+(isRaid?'raid':(isDung?'dungeon':'side'))+'">'+x[1]+'</span>';
  var prioBadge='<span class="fqBadge '+prioCls(prio)+'">'+prioLabel(prio)+'</span>';
  var actionBtn=(isRaid||isDung)?'<button class="fqStartBtn '+(isRaid?'raid':'dungeon')+'">'+(isRaid?'Start raid':'Start dungeon')+'</button>':'<div class="fqArrow">›</div>';
  var ppTag=x[13]?'<span class="fqMetaTag pp">👥 '+x[13]+'</span>':'';
  return '<div class="fqCard '+(x[9]?'done ':'')+cls+'" data-id="'+x[0]+'">'+
    '<button class="fqDel" data-del="'+x[0]+'">✕</button>'+
    '<div class="fqImg" style="background-image:url('+x[7]+')">'+
      '<div class="fqChk">'+(x[9]?'✓':'')+'</div>'+
    '</div>'+
    '<div class="fqBody">'+
      '<div class="fqBadges">'+typeBadge+prioBadge+'</div>'+
      '<div class="fqTitle">'+x[2]+'</div>'+
      '<div class="fqDesc">'+x[3]+'</div>'+
      '<div class="fqMeta">'+
        '<span class="fqMetaTag">📅 '+(x[11]||x[4])+'</span>'+
        '<span class="fqMetaTag">'+x[5]+'</span>'+
        ppTag+
        '<span class="fqMetaTag xp">'+x[6]+'</span>'+
      '</div>'+
    '</div>'+
    actionBtn+
  '</div>';
}

/* ── RENDER OVERVIEW ── */
function ensure(){
  if(!document.getElementById('famBg')){
    var d=document.createElement('div');d.id='famBg';document.body.prepend(d);
  }
}

function render(force){
  ensure();
  document.body.classList.toggle('famTask',!!task());
  var r=root();
  if(!r||!task()){return;}
  if(!overview()){r.dataset.v023='';return;}
  if(!force&&r.dataset.v023==='1'){return;}
  r.dataset.v023='1';
  var done=data.filter(function(x){return x[9];}).length;
  var groups={};
  data.forEach(function(x){var g=group(x);(groups[g]||(groups[g]=[])).push(x);});
  var order=[L('today'),L('tomorrow'),L('overmorrow'),L('week'),L('later')];
  var groupsHtml=order.filter(function(g){return groups[g];}).map(function(g){
    var gDone=groups[g].filter(function(x){return x[9];}).length;
    var gTotal=groups[g].length;
    var pct=Math.round(gDone/Math.max(gTotal,1)*100);
    return '<div class="fqHead" id="grp-'+g.replace(/\s+/g,'-')+'">'+
      '<h3>'+g+'<span style="font-size:14px;color:var(--m);font-weight:600;margin-left:6px;letter-spacing:0"> • '+ new Date().toLocaleDateString(lang==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'long'})+'</span></h3>'+
      '<span>'+gDone+' / '+gTotal+' '+L('done')+'</span>'+
    '</div>'+
    '<div class="fqDayBar"><i style="width:'+pct+'%"></i></div>'+
    groups[g].map(card).join('');
  }).join('');
  r.innerHTML='<div class="fq">'+
    '<div class="fqTop"><button class="fqAdd">'+L('add')+'</button></div>'+
    stats(done,data.length)+
    groupsHtml+
  '</div>';

  /* card click handlers */
  A('.fqCard',r).forEach(function(e){
    e.onclick=function(ev){
      var delBtn=ev.target.closest('[data-del]');
      if(delBtn){ev.stopPropagation();data=data.filter(function(x){return x[0]!==delBtn.dataset.del;});save();r.dataset.v023='';render(true);return;}
      var startBtn=ev.target.closest('.fqStartBtn');
      if(startBtn){ev.stopPropagation();detail(e.dataset.id);return;}
      detail(e.dataset.id);
    };
  });

  A('.fqAdd',r)[0].onclick=create;

  A('.fqStat',r).forEach(function(s){
    s.onclick=function(){
      var t=s.dataset.stat;
      if(t==='today'){var el=document.getElementById('grp-'+L('today'));if(el){el.scrollIntoView({behavior:'smooth'});}else{simpleModal(L('today'),'Geen quests voor vandaag.',I.today);}}
      if(t==='level'){levelModal();}
      if(t==='streak'){streakModal();}
      if(t==='party'){partyModal();}
    };
  });
}

/* ── MODAL BASE ── */
function modal(html){
  var m=document.getElementById('fqModal');
  if(!m){m=document.createElement('div');m.id='fqModal';m.className='fqModal';document.body.appendChild(m);}
  m.innerHTML=html;
  document.body.style.overflow='hidden';
  requestAnimationFrame(function(){m.classList.add('open');});
  m.onclick=function(e){if(e.target===m){closeModal();}};
  A('.fqClose,.fqBackBtn',m).forEach(function(b){b.onclick=function(){closeModal();};});
  return m;
}
function closeModal(){
  var m=document.getElementById('fqModal');
  if(m){
    var pg=m.querySelector('.fqPage');
    if(pg){pg.style.transform='translateY(100%)';}
    setTimeout(function(){m.classList.remove('open');document.body.style.overflow='';if(pg){pg.style.transform='';}},320);
  }
}

function hero(img,badges,title,meta){
  return '<div class="fqPage"><button class="fqBackBtn" onclick="closeModal()">&#8592;</button>'+
    '<div class="fqHero" style="background-image:url('+img+')">'+
      '<div class="fqHeroT">'+
        (badges?'<div class="fqBadges">'+badges+'</div>':'')+
        '<h2>'+title+'</h2>'+
        (meta?'<small>'+meta+'</small>':'')+
      '</div>'+
    '</div>'+
    '<div class="fqContent">';
}

function simpleModal(t,b,img){
  modal(hero(img,'',t,'')+'<div class="fqBox"><p>'+b+'</p></div></div></div>');
}

/* ── LEVEL MODAL ── */
function levelModal(){
  var ups=[
    ['Quest voltooid','Stofzuigen woonkamer','+20 XP'],
    ['Hulp gegeven aan Esra','Group quest assist','+15 XP'],
    ['Weekdoel bereikt','Familie productiviteit streak','+50 XP'],
    ['Ability vooruitgang','Planning Boost ontgrendelt binnenkort','72%']
  ];
  var leaders=[['1','Esra','950 XP'],['2','Jamie','720 XP'],['3','Shane','450 XP'],['4','Liam','380 XP']];
  var u=ups.map(function(x){return '<div class="fqUpdate"><div><b style="color:#fff">'+x[0]+'</b><br><small>'+x[1]+'</small></div><b style="color:#6bd35b">'+x[2]+'</b></div>';}).join('');
  var l=leaders.map(function(x){return '<div class="fqLeader"><b style="color:#fff">'+x[0]+'</b><span style="color:#d5dbe8">'+x[1]+'<br><small style="color:#9aa7bd">Family rank</small></span><b style="color:#6bd35b">'+x[2]+'</b></div>';}).join('');
  var m=modal(
    hero(I.level,'<span class="fqBadge side">LEVEL PROGRESS</span>','Level 12','450 / 800 XP richting je volgende ability.')+
    '<div class="fqBox"><b>Context updates</b>'+u+'</div>'+
    '<div class="fqBox"><b>Vergelijk met anderen</b>'+
      '<div class="fqFilter"><button class="on">Familie</button><button>Huishouden</button><button>Vrienden</button></div>'+
      l+
    '</div></div>'+
    '<div class="fqDoneWrap"><button class="fqDone" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)" onclick="document.getElementById(\'fqModal\').classList.remove(\'open\');document.body.style.overflow=\'\'">Sluiten</button></div>'+
    '</div>'
  );
  A('.fqFilter button',m).forEach(function(btn){btn.onclick=function(){A('.fqFilter button',m).forEach(function(b){b.classList.remove('on');});btn.classList.add('on');};});
}

/* ── STREAK MODAL ── */
function streakModal(){
  var rs=[['3 dagen','+10 XP','✓'],['7 dagen','+25 XP','✓'],['14 dagen','+50 XP','🔒'],['30 dagen','+100 XP','🔒']].map(function(x){
    return '<div class="fqUpdate"><div><b style="color:#fff">'+x[0]+'</b><br><small>Streak reward</small></div><b style="color:'+(x[2]==='✓'?'#6bd35b':'#9aa7bd')+'">'+x[1]+' '+x[2]+'</b></div>';
  }).join('');
  modal(
    hero(I.streak,'<span class="fqBadge side">STREAK</span>','7 dagen','Je hebt 7 dagen achter elkaar minimaal een quest voltooid.')+
    '<div class="fqBox"><b>Waarom dit telt</b><p>Je streak laat zien dat het huishouden ritme krijgt. Houd hem vast om extra XP en family abilities sneller vrij te spelen.</p></div>'+
    '<div class="fqBox"><b>Volgende mijlpaal</b><p>14 dagen streak — nog 7 dagen te gaan.</p><div class="fqProgBar" style="margin-top:10px"><i style="width:50%"></i></div></div>'+
    '<div class="fqBox"><b>Rewards</b>'+rs+'</div></div>'+
    '<div class="fqDoneWrap"><button class="fqDone" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)" onclick="document.getElementById(\'fqModal\').classList.remove(\'open\');document.body.style.overflow=\'\'">Sluiten</button></div>'+
    '</div>'
  );
}

/* ── PARTY MODAL ── */
function partyModal(){
  var members=[
    {init:'SK',color:'#3b82f6',name:'Shane K.',xp:'450 XP',streak:'7'},
    {init:'ES',color:'#ec4899',name:'Esra S.',xp:'720 XP',streak:'5'},
    {init:'SH',color:'#f97316',name:'Shane H.',xp:'380 XP',streak:'3'}
  ];
  var mhtml=members.map(function(m){
    return '<div class="fqLeader">'+
      '<div style="width:32px;height:32px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">'+m.init+'</div>'+
      '<span style="color:#d5dbe8">'+m.name+'<br><small style="color:#9aa7bd">'+m.xp+' &nbsp;·&nbsp; 🔥 '+m.streak+'</small></span>'+
      '<b style="color:#6bd35b">actief</b>'+
    '</div>';
  }).join('');
  modal(
    hero(I.party,'<span class="fqBadge side">PARTY</span>','3 Actief','Jullie werken samen aan het huishouden.')+
    '<div class="fqBox"><b>Party leden</b>'+mhtml+'</div>'+
    '<div class="fqBox"><p>Nodig iemand uit om quests samen te doen en extra XP te verdienen!</p>'+
      '<button class="fqHelp" onclick="">+ Iemand uitnodigen</button>'+
    '</div></div>'+
    '<div class="fqDoneWrap"><button class="fqDone" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)" onclick="document.getElementById(\'fqModal\').classList.remove(\'open\');document.body.style.overflow=\'\'">Sluiten</button></div>'+
    '</div>'
  );
}

/* ── DETAIL MODAL ── */
function get(id){return data.find(function(x){return x[0]===id;})||data[0];}
function sub(x){return JSON.parse(localStorage.getItem('fqsub_'+x[0])||'null')||x[8].map(function(){return !!x[9];});}
function setsub(x,s){localStorage.setItem('fqsub_'+x[0],JSON.stringify(s));}

function detail(id){
  var x=get(id);
  var st=sub(x);
  var isRaid=x[1].indexOf('RAID')>-1;
  var isDung=x[1].indexOf('DUNGEON')>-1;
  var prio=x[12]||'laag';
  var typeBadge='<span class="fqBadge '+(isRaid?'raid':(isDung?'dungeon':'side'))+'">'+x[1]+'</span>';
  var prioBadge='<span class="fqBadge '+prioCls(prio)+'">'+prioLabel(prio)+'</span>';

  /* subquest XP distribution */
  var subXPs=x[8].map(function(){return '+5 XP';});
  if(x[6]){
    var totalNum=parseInt(x[6])||20;
    var perSub=Math.max(5,Math.round(totalNum/Math.max(x[8].length,1)/5)*5);
    subXPs=x[8].map(function(){return '+'+perSub+' XP';});
  }

  function subHtml(){
    return st.map(function(done,i){
      return '<div class="fqSub '+(done?'done':'')+'" data-si="'+i+'">'+
        '<div class="fqSubChk">'+(done?'✓':'')+'</div>'+
        '<span class="fqSubText">'+x[8][i]+'</span>'+
        '<span class="fqSubXP">'+subXPs[i]+'</span>'+
        '<button class="fqSubDel" data-si="'+i+'">✕</button>'+
      '</div>';
    }).join('');
  }

  var m=modal(
    hero(x[7],typeBadge+prioBadge,x[2],(x[11]||x[4])+' &nbsp;·&nbsp; '+x[5]+' &nbsp;·&nbsp; '+x[6])+
    '<p>'+x[3]+'</p>'+
    '<div class="fqBox">'+
      '<div class="fqProgLabel" id="fqPL"></div>'+
      '<div class="fqProgBar"><i id="fqPB"></i></div>'+
      '<div id="fqSubList">'+subHtml()+'</div>'+
      '<button class="fqSubAdd">+ Subquest toevoegen</button>'+
    '</div>'+
    '<div class="fqBox">'+
      '<b>'+L('help')+'</b>'+
      '<p>Maak er een group quest van en verdien samen extra XP!</p>'+
      '<button class="fqHelp fqHelpBtn">'+L('askhelp')+'</button>'+
    '</div>'+
    '<div class="fqBox">'+
      '<b>'+L('rewards')+'</b>'+
      '<div class="fqRewards">'+
        '<div class="fqRewardChip"><div class="fqRewardIcon xp">🏆</div><div class="fqRewardLabel">XP</div><div class="fqRewardVal">'+x[6]+'</div></div>'+
        '<div class="fqRewardChip"><div class="fqRewardIcon disc">⭐</div><div class="fqRewardLabel">Discipline</div><div class="fqRewardVal">+5</div></div>'+
        '<div class="fqRewardChip"><div class="fqRewardIcon home">🏠</div><div class="fqRewardLabel">Homekeeping</div><div class="fqRewardVal">+10</div></div>'+
      '</div>'+
    '</div>'+
    '</div>'+
    '<div class="fqDoneWrap"><button class="fqDone" id="fqDoneBtn">'+L('complete')+'</button></div>'+
    '</div>'
  );

  function upd(){
    var rows=A('.fqSub',m);
    st=rows.map(function(r){return r.classList.contains('done');});
    var d=st.filter(Boolean).length,t=rows.length;
    var pb=document.getElementById('fqPB');
    var pl=document.getElementById('fqPL');
    var btn=document.getElementById('fqDoneBtn');
    setsub(x,st);
    if(pb){pb.style.width=(t?Math.round(d/t*100):0)+'%';}
    if(pl){pl.textContent=d+' / '+t+' '+L('subprog');}
    if(t&&d===t){btn.textContent='↩ '+L('reopen');btn.classList.add('reopen');x[9]=1;}
    else{btn.textContent='✓ '+L('complete');btn.classList.remove('reopen');x[9]=0;}
    save();
    var r=root();if(r){r.dataset.v023='';render(true);}
  }

  /* bind sub clicks */
  A('.fqSub',m).forEach(function(row){
    row.onclick=function(ev){
      var del=ev.target.closest('.fqSubDel');
      if(del){
        ev.stopPropagation();
        var si=parseInt(del.dataset.si);
        x[8].splice(si,1);st.splice(si,1);setsub(x,st);save();
        detail(x[0]);return;
      }
      row.classList.toggle('done');
      var chk=row.querySelector('.fqSubChk');
      if(chk){chk.textContent=row.classList.contains('done')?'✓':'';}
      upd();
    };
  });

  A('.fqSubAdd',m)[0].onclick=function(){
    var s=prompt('Subquest naam?');
    if(!s){return;}
    x[8].push(s);st.push(false);setsub(x,st);save();detail(x[0]);
  };

  A('.fqDoneBtn',m);
  document.getElementById('fqDoneBtn').onclick=function(){
    var allDone=!x[9];
    A('.fqSub',m).forEach(function(row){
      row.classList.toggle('done',allDone);
      var chk=row.querySelector('.fqSubChk');
      if(chk){chk.textContent=allDone?'✓':'';}
    });
    upd();
  };

  A('.fqHelpBtn',m).forEach(function(btn){
    btn.onclick=function(){showGQPopup(x[2]);};
  });

  upd();
}

/* ── GROUP QUEST POPUP ── */
function showGQPopup(questTitle){
  closeModal();
  var pop=document.getElementById('fqGQPop');
  if(!pop){
    pop=document.createElement('div');
    pop.id='fqGQPop';
    pop.className='fqGQPop';
    document.body.appendChild(pop);
  }
  // overlay
  var ov=document.getElementById('fqGQOv');
  if(!ov){ov=document.createElement('div');ov.id='fqGQOv';ov.className='fqGQOverlay';document.body.appendChild(ov);}

  pop.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'+
      '<div style="width:36px;height:36px;border-radius:50%;background:#ede9fe;display:flex;align-items:center;justify-content:center;font-size:18px;">🛡️</div>'+
      '<div><div class="fqGQTag">'+L('groupq')+'</div><div class="fqGQTitle">'+L('helpreq')+'</div></div>'+
      '<button class="fqGQClose" style="margin-left:auto;">✕</button>'+
    '</div>'+
    '<div style="font-size:13px;color:var(--m);margin-bottom:3px;">Shane '+L('helpat')+'</div>'+
    '<div class="fqGQQuest">'+questTitle+'</div>'+
    '<div class="fqGQAvs">'+
      '<div class="fqPav fqPav3" style="width:34px;height:34px;font-size:11px;">SH</div>'+
      '<div class="fqPav fqPav1" style="width:34px;height:34px;font-size:11px;">SK</div>'+
      '<span class="fqGQXP">'+L('xpboth')+'</span>'+
    '</div>'+
    '<div class="fqGQBtns">'+
      '<button class="fqGQBtn no">'+L('decline')+'</button>'+
      '<button class="fqGQBtn yes">'+L('accept')+'</button>'+
    '</div>';

  requestAnimationFrame(function(){
    pop.classList.add('open');
    ov.classList.add('open');
  });

  function closeGQ(){
    pop.classList.remove('open');
    ov.classList.remove('open');
  }
  A('.fqGQClose,.fqGQBtn',pop).forEach(function(b){b.onclick=closeGQ;});
  ov.onclick=closeGQ;
}

/* ── CREATE QUEST ── */
function create(){
  var m=modal(
    '<div class="fqPage">'+
    '<div class="fqHero" style="background-image:url(https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&q=88)">'+
      '<button class="fqBackBtn" onclick="closeModal()">&#8592;</button>'+
      '<div class="fqHeroT">'+
        '<div class="fqBadges"><span class="fqBadge side">NIEUWE QUEST</span></div>'+
        '<h2>'+L('newq')+'</h2>'+
      '</div>'+
    '</div>'+
    '<div class="fqContent">'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:7px;">NAAM</b>'+
      '<input id="qn" placeholder="Wat moet er gebeuren?" style="width:100%;box-sizing:border-box;border:1.5px solid #edf0ec;border-radius:14px;padding:13px 14px;font-size:15px;background:#fff;color:#111827;font-family:inherit;outline:none;">'+
    '</div>'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:7px;">OMSCHRIJVING</b>'+
      '<textarea id="qd" rows="3" placeholder="Korte beschrijving..." style="width:100%;box-sizing:border-box;border:1.5px solid #edf0ec;border-radius:14px;padding:13px 14px;font-size:15px;background:#fff;color:#111827;font-family:inherit;outline:none;resize:none;"></textarea>'+
    '</div>'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:10px;">QUEST TYPE</b>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">'+
        '<button id="qside" class="fqQTypeBtn active" onclick="fqSetQType(\'SIDE QUEST\',\'qside\')">Side Quest</button>'+
        '<button id="qdun" class="fqQTypeBtn" onclick="fqSetQType(\'DUNGEON\',\'qdun\')">Dungeon</button>'+
        '<button id="qraid" class="fqQTypeBtn" onclick="fqSetQType(\'RAID\',\'qraid\')">Raid</button>'+
      '</div>'+
    '</div>'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:10px;">PRIORITEIT</b>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">'+
        '<button id="qlaag" class="fqQPrioBtn active" onclick="fqSetQPrio(\'laag\',\'qlaag\')">Laag</button>'+
        '<button id="qnorm" class="fqQPrioBtn" onclick="fqSetQPrio(\'normaal\',\'qnorm\')">Normaal</button>'+
        '<button id="qhoog" class="fqQPrioBtn" onclick="fqSetQPrio(\'hoog\',\'qhoog\')">Hoog</button>'+
      '</div>'+
    '</div>'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:7px;">DATUM</b>'+
      '<input id="qdate" type="date" style="width:100%;box-sizing:border-box;border:1.5px solid #edf0ec;border-radius:14px;padding:13px 14px;font-size:15px;background:#fff;color:#111827;font-family:inherit;outline:none;">'+
    '</div>'+
    '<div class="fqBox">'+
      '<b style="font-size:13px;font-weight:900;color:#667085;display:block;margin-bottom:7px;">TOEGEWEZEN AAN</b>'+
      '<select id="qwho" style="width:100%;box-sizing:border-box;border:1.5px solid #edf0ec;border-radius:14px;padding:13px 14px;font-size:15px;background:#fff;color:#111827;font-family:inherit;outline:none;appearance:none;">'+
        '<option>Shane</option><option>Esra</option><option>Beiden</option>'+
      '</select>'+
    '</div>'+
    '</div>'+
    '<div class="fqDoneWrap"><button class="fqDone fqSaveBtn">Quest opslaan</button></div>'+
    '</div>'
  );

  window._qtype='SIDE QUEST'; window._qprio='laag';

  A('.fqSaveBtn',m)[0].onclick=function(){
    var n=A('#qn',m)[0].value.trim();
    if(!n){A('#qn',m)[0].style.border='1.5px solid #dc2626';return;}
    var d=A('#qd',m)[0].value.trim()||'Nieuwe quest.';
    var date=A('#qdate',m)[0].value||new Date().toISOString().slice(0,10);
    var who=A('#qwho',m)[0].value;
    var xp=xpForType(window._qtype,window._qprio);
    data.push(['q'+Date.now(),window._qtype,n,d,date,who,xp,pick(n+' '+d),['Eerste stap'],0,'once',date,window._qprio]);
    save();closeModal();
    var r=root();if(r){r.dataset.v023='';render(true);}
  };
}

window.fqSetQType=function(t,id){
  window._qtype=t;
  document.querySelectorAll('.fqQTypeBtn').forEach(function(b){b.classList.remove('active');});
  var el=document.getElementById(id);if(el)el.classList.add('active');
};
window.fqSetQPrio=function(p,id){
  window._qprio=p;
  document.querySelectorAll('.fqQPrioBtn').forEach(function(b){b.classList.remove('active');});
  var el=document.getElementById(id);if(el)el.classList.add('active');
};


function langBtn(){
  if(document.getElementById('famLang')){return;}
  var b=document.createElement('button');
  b.id='famLang';b.className='famLang';
  b.textContent=lang==='en'?'NL':'EN';
  b.onclick=function(){lang=lang==='en'?'nl':'en';localStorage.setItem('fam_lang',lang);run();};
  document.body.appendChild(b);
}

/* ── BIND TABS ── */
function bind(){
  A('.ttab,.task-tabs button,.nav-btn').forEach(function(t){
    if(t.dataset.v023){return;}
    t.dataset.v023='1';
    t.addEventListener('click',function(){
      var r=root();if(r){r.dataset.v023='';}
      setTimeout(run,30);
      setTimeout(function(){render(true);},180);
    });
  });
}

/* ── MAIN LOOP ── */
function run(){
  home();bind();render(false);langBtn();
  if(!task()){document.body.classList.remove('famTask');}
  // Force overzicht tab when on tasks screen to prevent old UI showing
  if(task()&&overview()){
    if(window.taskTab&&(window.taskTab==='week'||window.taskTab==='vast')){
      window.taskTab='overzicht';
      var tabs=document.querySelectorAll('.ttab');
      tabs.forEach(function(b){b.classList.remove('active');});
      if(tabs[0])tabs[0].classList.add('active');
    }
  }
}

document.addEventListener('DOMContentLoaded',function(){run();setTimeout(function(){render(true);},60);});
window.addEventListener('load',function(){run();setTimeout(function(){render(true);},120);});
for(var i=0;i<12;i++){setTimeout(run,i*150);}
setInterval(run,900);
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

}catch(e){console.error('fam v0.23 failed',e);}
})();



