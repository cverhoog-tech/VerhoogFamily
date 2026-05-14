/* trade-engine.js - FamilyApp Taken ruilen engine */
(function(){
  if(window.__familyTradeEngine)return; window.__familyTradeEngine=true;
  var ME='Shane', PEOPLE=['Shane','Esra','Mila'], KEY='fam_trade_engine_v2';
  function parse(x){try{return JSON.parse(x||'null')}catch(e){return null}}
  function load(){return parse(localStorage.getItem(KEY))}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
  function uid(){return 'tr_'+Date.now()+'_'+Math.random().toString(16).slice(2)}
  function A(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function txt(e){return(e&&e.textContent||'').toLowerCase()}
  function root(){return document.getElementById('task-content')||document.querySelector('.task-content')}
  function isTask(){return txt(document.querySelector('.header-title')).indexOf('taken')>-1||!!document.querySelector('.task-tabs')}
  function isTrade(){var a=document.querySelector('.ttab.active,.task-tabs .active');return !!a&&txt(a).indexOf('🤝')>-1}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function rawTasks(){
    var out=[];
    ['fam_tasks_v023','fam_tasks_v022','fam_tasks_v021','fam_q49'].forEach(function(k){var v=parse(localStorage.getItem(k));if(Array.isArray(v))out=out.concat(v)});
    if(window.taskData&&Array.isArray(window.taskData))out=out.concat(window.taskData);
    return out;
  }
  function icon(title){title=(title||'').toLowerCase();if(title.indexOf('was')>-1)return'🧺';if(title.indexOf('afwas')>-1)return'🍽️';if(title.indexOf('boodschap')>-1)return'🛍️';if(title.indexOf('stof')>-1)return'🧹';if(title.indexOf('auto')>-1)return'🚗';if(title.indexOf('gras')>-1)return'🚜';if(title.indexOf('cadeau')>-1)return'🎁';return'✅'}
  function norm(t,i){
    if(Array.isArray(t)){var title=t[2]||t[1]||'Taak';return{id:String(t[0]||i),title:title,owner:t[5]||'Esra',date:t[11]||t[4]||'',duration:'± '+(10+i*5)+' min',points:parseInt(String(t[6]||'10').replace(/[^0-9]/g,''),10)||10,icon:icon(title)}}
    var title2=t.title||t.name||'Taak';return{id:String(t.id||i),title:title2,owner:t.assignee||t.owner||'Esra',date:t.date||'',duration:t.duration||'± 15 min',points:t.points||10,icon:icon(title2)};
  }
  function seed(){
    var tasks=rawTasks().map(norm);
    if(!tasks.length){tasks=[{id:'dish',title:'Afwas doen',owner:'Esra',date:'Vandaag vóór 20:00',duration:'± 15 min',points:10,icon:'🍽️'},{id:'wash',title:'Was draaien',owner:'Mila',date:'Morgen vóór 09:00',duration:'± 10 min',points:8,icon:'🧺'},{id:'shop',title:'Boodschappen doen',owner:'Shane',date:'Vrijdag',duration:'± 30 min',points:15,icon:'🛍️'},{id:'vacuum',title:'Stofzuigen woonkamer',owner:'Esra',date:'Zaterdag',duration:'± 10 min',points:7,icon:'🧹'}]}
    var req=tasks.filter(function(t){return t.owner!==ME}).slice(0,6).map(function(t,i){return{requestId:'req_'+t.id,task:t,from:t.owner,to:null,status:'open',priority:i===0?'h':i===2?'l':'m',helpers:['👩🏻','🧔🏻','👩🏽'].slice(0,2+(i%2)),createdAt:Date.now()-i*3600000}});
    return{filter:'all',xp:{Shane:0,Esra:0,Mila:0},helped:{Shane:0,Esra:0,Mila:0},offers:[],requests:req,available:true,notificationAsked:false};
  }
  function S(){var s=load();if(!s){s=seed();save(s)}return s}
  function badge(n){return'<span class="trB">'+n+'</span>'}
  function pr(c){return c==='h'?['🔥 Hoog','h']:c==='l'?['♨ Laag','l']:['☝ Normaal','m']}
  function when(t){return t.date||'Vandaag'}
  function row(r){var p=pr(r.priority),done=r.status==='accepted';return '<div class="trRow"><div class="trIcon">'+r.task.icon+'</div><div><div class="trTitle">'+esc(r.task.title)+'</div><div class="trBy">'+esc(r.from)+' vraagt hulp</div><div class="trMeta"><span>◷ '+esc(when(r.task))+'</span><span>◷ '+esc(r.task.duration)+'</span></div><div class="trPts">⭐ +'+r.task.points+' punten</div></div><div class="trSide"><span class="trPr '+p[1]+'">'+p[0]+'</span><div style="display:flex;align-items:center;gap:12px"><div class="trAvs">'+r.helpers.map(function(h){return'<span class="trAv">'+h+'</span>'}).join('')+'<button class="trPlus" type="button">+</button></div><button class="trHelp '+(done?'done':'')+'" data-help="'+r.requestId+'" type="button">'+(done?'Overgenomen':'Ik help!')+'</button></div></div></div>'}
  function filtered(s){var r=s.requests||[];if(s.filter==='open')return r.filter(function(x){return x.status==='open'});if(s.filter==='help')return r.filter(function(x){return x.from!==ME&&x.status==='open'});if(s.filter==='mine')return[];return r}
  function person(name,color,s){var n=s.helped[name]||0,max=Math.max(1,s.helped.Shane||0,s.helped.Esra||0,s.helped.Mila||0),w=Math.round(n/max*82),face=name==='Shane'?'🧔🏽':name==='Esra'?'👩🏻':'👩🏽';return'<div class="trP"><div>'+face+'</div><div><b style="color:'+color+'">'+name+(name===ME?' (jij)':'')+'</b><div class="trBar"><i style="width:'+w+'%;background:'+color+'"></i></div></div><small>'+n+' geholpen</small></div>'}
  function fair(s){var v=PEOPLE.map(function(p){return s.helped[p]||0}),mx=Math.max.apply(null,v),mn=Math.min.apply(null,v);return mx-mn<=2?'Goed bezig! Het is redelijk in balans. ⚖️':'Let op: de hulp is wat scheef verdeeld. ⚖️'}
  function offer(o){return'<div class="trOffer"><div class="trIcon">'+o.icon+'</div><div><div class="trTitle">'+esc(o.give)+'</div><div class="trMeta">↻ Aangeboden door jou · wil overnemen: '+esc(o.take)+'</div><div style="font-size:12px;color:#667085;margin-top:6px">'+esc(o.message||'Geen berichtje toegevoegd.')+'</div></div><span class="trStatus">⏳ Wacht op hulp</span></div>'}
  function render(){
    var r=root(); if(!r||!isTask()||!isTrade())return;
    var s=S(),mark=[s.filter,s.requests.map(function(q){return q.requestId+q.status}).join(','),s.offers.length,JSON.stringify(s.helped),s.available].join('|');
    if(r.dataset.tradeEngine===mark)return; r.dataset.tradeEngine=mark;
    var vis=filtered(s),open=s.requests.filter(function(q){return q.status==='open'}),earned=s.requests.reduce(function(a,q){return a+(q.status==='accepted'?q.task.points:0)},0);
    r.innerHTML='<div class="trw"><div class="trHero"><h2>Taken ruilen 🤝</h2><p>Help elkaar en houd het in balans.</p><div class="trStats"><span>▣ <b>'+open.length+'</b> open verzoeken</span><span>⭐ <b>'+(120+earned)+'</b> punten deze week</span></div><div class="trArt">🤝</div></div><div class="trFilters"><button class="trF '+(s.filter==='all'?'on':'')+'" data-filter="all" type="button">▦ Alles</button><button class="trF '+(s.filter==='open'?'on':'')+'" data-filter="open" type="button">▧ Open verzoeken '+badge(open.length)+'</button><button class="trF '+(s.filter==='help'?'on':'')+'" data-filter="help" type="button">♙ Ik kan helpen</button><button class="trF '+(s.filter==='mine'?'on':'')+'" data-filter="mine" type="button">⚑ Door mij aangeboden</button></div><div class="trSec"><h3>Open verzoeken '+badge(vis.length)+'</h3><a>Bekijk alle</a></div>'+(vis.length?'<div class="trList">'+vis.map(row).join('')+'</div>':'<div class="trCard"><h4>Geen taken gevonden</h4><p style="color:#667085;font-size:13px">Voor deze filter staan er nog geen verzoeken.</p></div>')+'<div class="trChallenge"><div class="trTrophy">🏆</div><div><b>Snelle bonus challenge 🔥</b><p>Neem vandaag 2 extra taken over en verdien +25 bonuspunten!</p></div><button class="trPurple" data-bonus="1" type="button">Challenge bekijken</button></div><div class="trGrid"><div class="trCard"><h4>Ik kan vandaag helpen <button data-availability="1" type="button" style="float:right;border:0;background:transparent;color:#2f7f2e;font-weight:900">'+(s.available?'Bewerken':'Aanmelden')+'</button></h4><div class="trAvail"><div style="font-size:30px">👋</div><div><b>'+(s.available?'Je staat op beschikbaar':'Je staat niet beschikbaar')+'</b><p>Anderen kunnen jou vragen om taken over te nemen.</p></div></div><div class="trMini"><span>✓ Iedere taak</span><span>Kleine taken</span><span>Alleen avond</span></div></div><div class="trCard"><h4>Fairness deze week ⓘ</h4>'+person('Shane','#2f8b2d',s)+person('Esra','#7c3aed',s)+person('Mila','#f4b400',s)+'<div class="trGood">'+fair(s)+'</div></div></div><div class="trSec"><h3>Door mij aangeboden '+badge(s.offers.length)+'</h3><a>Bekijk alle</a></div>'+(s.offers.length?s.offers.map(offer).join(''):'<div class="trOffer"><div class="trIcon">🚜</div><div><div class="trTitle">Gras maaien</div><div class="trMeta">↻ Voorbeeld aangeboden taak</div><div style="font-size:12px;color:#667085;margin-top:6px">Gebruik ✦ om je eigen taak aan te bieden.</div></div><span class="trStatus">Demo</span></div>')+'<button class="trFab" data-open-sheet="1" type="button">✦</button></div>';
    bind(r);
  }
  function bind(r){
    A('[data-filter]',r).forEach(function(b){b.onclick=function(){var s=S();s.filter=b.dataset.filter;save(s);r.dataset.tradeEngine='';render()}});
    A('[data-help]',r).forEach(function(b){b.onclick=function(){var s=S(),q=s.requests.find(function(x){return x.requestId===b.dataset.help});if(!q||q.status==='accepted')return;q.status='accepted';q.to=ME;s.helped[ME]=(s.helped[ME]||0)+1;s.xp[ME]=(s.xp[ME]||0)+q.task.points;save(s);notify('Taak overgenomen',ME+' helpt met '+q.task.title);toast('Taak overgenomen: +'+q.task.points+' XP');r.dataset.tradeEngine='';render()}});
    A('[data-availability]',r).forEach(function(b){b.onclick=function(){var s=S();s.available=!s.available;save(s);toast(s.available?'Je bent beschikbaar.':'Je bent niet beschikbaar.');r.dataset.tradeEngine='';render()}});
    A('[data-bonus]',r).forEach(function(b){b.onclick=function(){var s=S();if((s.helped[ME]||0)>=2){s.xp[ME]=(s.xp[ME]||0)+25;save(s);toast('Bonus geclaimd: +25 XP')}else toast('Neem eerst 2 taken over om de bonus te claimen.')}});
    A('[data-open-sheet]',r).forEach(function(b){b.onclick=sheet});
  }
  function sheet(){
    var tasks=rawTasks().map(norm); if(!tasks.length)tasks=[{title:'Auto wassen',owner:ME,icon:'🚗'},{title:'Verjaardag cadeau kopen',owner:'Esra',icon:'🎁'}];
    var mine=tasks.filter(function(t){return t.owner===ME}),other=tasks.filter(function(t){return t.owner!==ME}); if(!mine.length)mine=[{title:'Auto wassen',owner:ME,icon:'🚗'}]; if(!other.length)other=[{title:'Verjaardag cadeau kopen',owner:'Esra',icon:'🎁'}];
    var e=document.createElement('div');e.className='trSheet';e.innerHTML='<div class="trPanel"><div class="trHandle"></div><h2>🤝 Taak ruilen</h2><div class="trLbl">Jouw taak (aanbieden)</div><select class="trSelect" id="trGive">'+mine.map(function(t){return'<option>'+esc(t.title)+'</option>'}).join('')+'</select><div class="trLbl">Taak die je wil overnemen</div><select class="trSelect" id="trTake">'+other.map(function(t){return'<option>'+esc(t.title)+'</option>'}).join('')+'</select><div class="trLbl">Berichtje erbij (optioneel)</div><input class="trInput" id="trMsg" placeholder="bijv. Ik haat stofzuigen 😅"><button class="trSubmit" type="button">Toevoegen</button></div>';document.body.appendChild(e);e.onclick=function(ev){if(ev.target===e)e.remove()};
    e.querySelector('.trSubmit').onclick=function(){var s=S(),give=e.querySelector('#trGive').value,take=e.querySelector('#trTake').value,msg=e.querySelector('#trMsg').value;s.offers.push({id:uid(),give:give,take:take,message:msg,icon:icon(give),createdAt:Date.now()});save(s);e.remove();notify('Ruilverzoek toegevoegd','Je taakruil staat nu open.');toast('Ruilverzoek toegevoegd.');var r=root();if(r)r.dataset.tradeEngine='';render()};
  }
  function toast(m){var e=document.createElement('div');e.className='trToast';e.textContent=m;document.body.appendChild(e);setTimeout(function(){e.remove()},2400)}
  function notify(title,body){try{if(!('Notification'in window))return;if(Notification.permission==='granted')new Notification(title,{body:body});else if(Notification.permission!=='denied')Notification.requestPermission()}catch(e){}}
  function tick(){var r=root();if(r&&!isTrade())r.dataset.tradeEngine='';render()}
  document.addEventListener('click',function(){setTimeout(tick,80);setTimeout(tick,260)});window.addEventListener('load',function(){for(var i=0;i<14;i++)setTimeout(tick,i*180)});setInterval(tick,900);new MutationObserver(tick).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
})();
