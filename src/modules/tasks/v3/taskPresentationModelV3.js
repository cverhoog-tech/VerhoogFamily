'use strict';
// ============================================================
// FAMILYAPP TASKS V3 — PRESENTATION MODEL
// Read-only view model over canonical window.taskData / TaskSharedData.
// ============================================================
(function(){
  if(window.TaskPresentationModelV3)return;

  var PHOTO={
    bathroom:'/src/assets/cleaning-rooms/bathroom-light.webp',
    bedroom:'/src/assets/cleaning-rooms/bedroom-light.webp',
    hall:'/src/assets/cleaning-rooms/hall-light.webp',
    kids:'/src/assets/cleaning-rooms/kids-room-light.webp',
    kitchen:'/src/assets/cleaning-rooms/kitchen-light.webp',
    laundry:'/src/assets/cleaning-rooms/laundry-light.webp',
    living:'/src/assets/cleaning-rooms/living-room-light.webp',
    toilet:'/src/assets/cleaning-rooms/toilet-light.webp',
    outdoor:'/src/assets/cleaning-rooms/outdoor-light.webp',
    groceries:'/src/assets/task-heroes/market.webp',
    garden:'/src/assets/task-heroes/garden.webp',
    travel:'/src/assets/task-heroes/travel.webp',
    admin:'/src/assets/task-heroes/cozy-home.webp',
    generic:'/src/assets/task-heroes/cozy-home.webp'
  };

  function text(v){return String(v==null?'':v).trim();}
  function tasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function initials(name){return text(name||'G').split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function avatar(m){if(!m)return'';var direct=m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||'';if(direct)return direct;try{return localStorage.getItem('fam_avatar_'+text(m.displayName||m.name).toLowerCase())||'';}catch(e){return'';}}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function getTask(id){return tasks().find(function(t){return String(t&&(t.id||t._key))===String(id);})||null;}
  function assignees(task){
    var out=[];
    if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(uid){if(task.assignedToUids[uid]){var m=member(uid);out.push({uid:String(uid),name:(m&&(m.displayName||m.name))||'Gezinslid',avatar:avatar(m),member:m});}});
    if(!out.length&&task&&Array.isArray(task.who))task.who.forEach(function(name){out.push({uid:null,name:text(name)||'Gezinslid',avatar:'',member:null});});
    return out;
  }
  function helperPeople(task){var out=[];(Array.isArray(task&&task.helpers)?task.helpers:[]).forEach(function(h){var uid=String(h&&(h.uid||h.memberId||h.id)||'');if(!uid)return;var m=member(uid);out.push({uid:uid,name:(m&&(m.displayName||m.name))||h.name||'Helper',avatar:avatar(m),member:m});});return out;}
  function people(task){var list=assignees(task);helperPeople(task).forEach(function(h){if(!list.some(function(p){return String(p.uid)===String(h.uid);} ))list.push(h);});return list;}

  function localDay(date){if(!date)return null;var d=new Date(String(date)+'T00:00:00');if(isNaN(d.getTime()))return null;d.setHours(0,0,0,0);return d;}
  function today(){var d=new Date();d.setHours(0,0,0,0);return d;}
  function dayDiff(task){var d=localDay(task&&task.date);if(!d)return null;return Math.round((d-today())/86400000);}
  function group(task){if(task&&task.done)return'Voltooid';var diff=dayDiff(task);if(diff===null)return'Later';if(diff<0)return'Verlopen';if(diff===0)return'Vandaag';if(diff===1)return'Morgen';return'Later';}
  function dateLabel(task){
    if(!task||!task.date)return'Geen datum';var diff=dayDiff(task),d=localDay(task.date),label='';
    if(diff===0)label='Vandaag';else if(diff===1)label='Morgen';else if(diff===-1)label='Gisteren';else label=d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
    return label+(task.time?' · '+task.time:'');
  }
  function recurrenceLabel(task){var r=text(task&&task.recurrence||'once').toLowerCase();return{once:'Eenmalig',daily:'Dagelijks',weekly:'Wekelijks',monthly:'Maandelijks'}[r]||'Eenmalig';}
  function priorityLabel(task){var p=text(task&&(task.prio||task.priority)||'normaal').toLowerCase();if(/hoog|high|urgent/.test(p))return'Hoge prioriteit';if(/laag|low/.test(p))return'Lage prioriteit';return'Normale prioriteit';}
  function important(task){var p=text(task&&(task.prio||task.priority)||'').toLowerCase();return /hoog|high|urgent|belangrijk/.test(p);}
  function xp(task){var m=text(task&&(task.xp||task.xpReward||('+'+(task&&task.xpAmount||20)+' XP'))).match(/(\d+)/);return m?parseInt(m[1],10):20;}
  function ownImage(task){
    if(!task)return'';
    try{if(window.TaskModel&&typeof TaskModel.getImage==='function'){var img=TaskModel.getImage(task);if(img)return String(img);}}catch(e){}
    return text(task.heroImage||task.img||task.imageUrl||task.image||task.photo||task.cover||'');
  }
  function photoKey(task){
    var raw=text(task&&(task.cleaningRoomName||task.roomName||task.category||task.type||task.title)||'').toLowerCase();
    if(/badkamer|bathroom|douche/.test(raw))return'bathroom';
    if(/toilet|\bwc\b/.test(raw))return'toilet';
    if(/kinderkamer|kids|speelgoed|kind|toy/.test(raw))return'kids';
    if(/woonkamer|living/.test(raw))return'living';
    if(/slaapkamer|bedroom/.test(raw))return'bedroom';
    if(/hal|entree|hall/.test(raw))return'hall';
    if(/was|laundry|vouw|kleding/.test(raw))return'laundry';
    if(/bood|supermarkt|grocer|market/.test(raw))return'groceries';
    if(/keuken|kitchen|koken|vaat/.test(raw))return'kitchen';
    if(/tuin|garden|buiten|outside/.test(raw))return'garden';
    if(/reis|travel|vakantie/.test(raw))return'travel';
    if(/admin|rekening|factuur|bank|contract/.test(raw))return'admin';
    return'generic';
  }
  function photo(task){return ownImage(task)||PHOTO[photoKey(task)]||PHOTO.generic;}
  function statusSummary(){var out={open:0,important:0,overdue:0,done:0};tasks().forEach(function(t){if(!t)return;if(t.done){out.done++;return;}out.open++;if(important(t))out.important++;if(group(t)==='Verlopen')out.overdue++;});return out;}
  function isHydrated(){try{return !!(window.TaskSharedData&&TaskSharedData.status&&TaskSharedData.status().sharedSnapshot);}catch(e){return tasks().length>0;}}
  function supplies(task){
    var direct=Array.isArray(task&&task.supplies)?task.supplies.map(function(item){return typeof item==='string'?{name:item,status:'IN_STOCK'}:{name:text(item&&item.name),status:text(item&&item.status||'IN_STOCK').toUpperCase()};}).filter(function(x){return x.name;}):[];
    if(direct.length)return direct;
    try{
      var ui=window.CleaningTaskSupplyUi,repo=window.CleaningHouseholdRepository;
      if(ui&&ui._isManaged&&ui._deriveDetails&&ui._isManaged(task)&&repo&&repo.snapshot){var snap=repo.snapshot();if(snap&&snap.ready&&snap.data){var details=ui._deriveDetails(task,snap.data);return (details.items||[]).map(function(item){return{name:item.name,status:item.status||'IN_STOCK'};});}}
    }catch(e){}
    return[];
  }
  function view(task){
    var ps=people(task),subs=Array.isArray(task&&task.subtasks)?task.subtasks:[],done=subs.filter(function(s){return s&&s.done;}).length;
    return{id:String(task&&(task.id||task._key)||''),raw:task,title:text(task&&task.title)||'Taak',description:text(task&&(task.desc||task.description)),group:group(task),dateLabel:dateLabel(task),recurrenceLabel:recurrenceLabel(task),priorityLabel:priorityLabel(task),xp:xp(task),important:important(task),photo:photo(task),people:ps,primaryPerson:ps[0]||null,subtasks:subs,subDone:done,supplies:supplies(task)};
  }

  window.TaskPresentationModelV3={version:'3.0.0',tasks:tasks,members:members,member:member,avatar:avatar,initials:initials,currentUid:currentUid,getTask:getTask,assignees:assignees,people:people,group:group,dayDiff:dayDiff,dateLabel:dateLabel,recurrenceLabel:recurrenceLabel,priorityLabel:priorityLabel,xp:xp,photo:photo,statusSummary:statusSummary,isHydrated:isHydrated,supplies:supplies,view:view};
})();
