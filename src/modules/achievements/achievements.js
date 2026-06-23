'use strict';
// ============================================================
// ACHIEVEMENTS
// ============================================================

// ============================================================
// ============================================================
// GAMIFICATION — uitgebreide XP, badges, titels, taakhandel
// ============================================================

var LEVEL_TITLES = [
  {lv:1,  title:'🥚 Huishoud-embryo',        desc:'Welkom in het gezin. Probeer niet alles te breken.'},
  {lv:2,  title:'🐣 Uitgebroed',             desc:'Je hebt de app geopend. Proficiat.'},
  {lv:3,  title:'🧻 Wc-papier-paleisje',     desc:'Je weet waar het wc-papier ligt. Soms.'},
  {lv:4,  title:'🍜 Noedel-newbie',          desc:'Instant noedels tellen ook als koken. Toch?'},
  {lv:5,  title:'🧦 Sokkenzoeker',           desc:'50% kans op matchende sokken. Elke dag opnieuw.'},
  {lv:6,  title:'🧹 Bezem-apprentice',       desc:'Je weet hoe een bezem werkt. Revolutionair.'},
  {lv:7,  title:'🍳 Keukenprinses/-prins',   desc:'De geur van succes, of aangebrand. Allebei.'},
  {lv:8,  title:'📋 To-do-lijstje Held',     desc:'Je schrijft taken op. Of je ze doet is iets anders.'},
  {lv:9,  title:'🛒 Supermarkt-overlever',   desc:'Terug zonder vergeten melk. Bijna.'},
  {lv:10, title:'🔔 Reminder-addict',        desc:'Zonder notificaties zou je niks doen. Eerlijk.'},
  {lv:11, title:'💪 Taak-atleet',            desc:'Taken afvinken voelt als sporten. Bijna.'},
  {lv:12, title:'🔁 Routine-robot',          desc:'Zaterdag = stofzuigen. Zondag = hetzelfde.'},
  {lv:13, title:'🏠 Huishoud-officier',      desc:'Rang: Luitenant der Afwas, 2e klasse.'},
  {lv:14, title:'⚡ Taak-destroyer',         desc:'Taken vrezen jouw naam. Beetje dan.'},
  {lv:15, title:'💸 Budget-whisperer',       desc:'Je kent het verschil tussen netto en bruto. Eindelijk.'},
  {lv:16, title:'🌟 Gezins-strateeg',        desc:'Je plant verder dan morgenochtend. Respect.'},
  {lv:17, title:'🎯 Efficiëntie-expert',     desc:'Je doet 2 taken terwijl anderen er 1 doen.'},
  {lv:18, title:'🧠 Systeem-architect',      desc:'Jouw to-do lijst heeft een to-do lijst.'},
  {lv:19, title:'🏅 Huishoud-kampioen',      desc:'Goud voor de 400 meter stofzuigen.'},
  {lv:20, title:'👑 Gezins-CEO',             desc:'CFO, CMO, afwasmachine en visie ineen.'},
  {lv:21, title:'🌋 Chaos-temmer Deluxe',    desc:'Entropie heeft het opgegeven bij jou.'},
  {lv:22, title:'🎖️ Generaal der Taken',     desc:'Jouw gezin is jouw imperium.'},
  {lv:23, title:'🔥 Onomstotelijk Meester',  desc:'Zelfs de robotstofzuiger vraagt advies.'},
  {lv:24, title:'💎 Platina Huishoudbaas',   desc:'Moeilijk te bereiken, maar jij bent hier.'},
  {lv:25, title:'🌌 Huishoud-Legende',       desc:'Mythen worden over jou gefluisterd.'},
  {lv:26, title:'⚗️ Alchemist der Routine',  desc:'Je maakt goud van klusjes. Bijna letterlijk.'},
  {lv:27, title:'🌠 Kosmische Planner',      desc:'Je plant zelfs je dromen in.'},
  {lv:28, title:'🧬 Taak-DNA',              desc:'Taken doen zit in je bloed nu.'},
  {lv:29, title:'🛸 Buitenaards Efficient',  desc:'Mensen vragen of je menselijk bent.'},
  {lv:30, title:'🌌 HUISHOUD-GOD',          desc:'Zelfs de vaatwasser buigt voor jou. Einde bereikt.'},
  {lv:31, title:'🌀 Dimensie-shifter',       desc:'Je bent voorbij het einde gegaan. Respect.'},
  {lv:32, title:'🧿 Oog van het Huishouden', desc:'Niets ontgaat jou. Helemaal niets.'},
  {lv:33, title:'⚜️ Grootmeester Ordenis',   desc:'Je hebt een eigen orde opgericht.'},
  {lv:34, title:'🌊 Vloed van Productiviteit',desc:'Je bent onstuitbaar.'},
  {lv:35, title:'💫 Supernova-planner',       desc:'Zelfs sterrenstelsels zijn jaloers.'},
  // ── MORE RARE ──
  {id:'notes_10',    icon:'📖', name:'Dagboekschrijver',   desc:'10 notities gemaakt',                  rarity:'rare',      xp:18, funny:'10 notities. Je bent haast Virginia Woolf.'},
  {id:'cal_10',      icon:'📅', name:'Agenda-addict',      desc:'10 afspraken aangemaakt',              rarity:'rare',      xp:12, funny:'Je agenda is voller dan je koelkast.'},
  {id:'savings_1',   icon:'🏦', name:'Eerste spaarder',    desc:'Eerste storting gedaan',               rarity:'rare',      xp:10, funny:'Het begin van rijkdom. (Misschien.)'},
  {id:'goal_reached',icon:'🎯', name:'Doel bereikt!',      desc:'Spaardoel volledig bereikt',           rarity:'rare',      xp:20, funny:'Je hebt het echt gedaan. Koop iets leuks.'},
  {id:'recipe_5',    icon:'📕', name:'Kookboek-beginner',  desc:'5 recepten aangemaakt',                rarity:'rare',      xp:15, funny:'5 recepten. Bijna een kookboek.'},
  {id:'landscape',   icon:'📱', name:'Zijwaartse denker',  desc:'App in landscape gebruikt',            rarity:'rare',      xp:5,  funny:'Je telefoon op zijn zij. Creatief.'},
  {id:'darkswitch',  icon:'🌓', name:'Dag-nacht-ritme',    desc:'5x gewisseld tussen dark en light',    rarity:'rare',      xp:8,  funny:'5x wisselen. Kun je niet kiezen?'},
  {id:'ability_3',   icon:'🧙', name:'Leerling-tovenaar',  desc:'3 abilities gebruikt',                 rarity:'rare',      xp:12, funny:'3 spreuken. Je hebt de smaak te pakken.'},
  // ── MORE EPIC ──
  {id:'task_75',     icon:'🦅', name:'Taak-adelaar',       desc:'75 taken afgevinkt',                   rarity:'epic',      xp:45, funny:'75 taken. De adelaar brengt taken naar de hemel.'},
  {id:'savings_5k',  icon:'💰', name:'Spaar-kampioen',     desc:'€ 5000 totaal gespaard',               rarity:'epic',      xp:40, funny:'€ 5000! Je kunt nu iets heel moois kopen.'},
  {id:'skill_all',   icon:'🎭', name:'Ware Renaissance-mens',desc:'Alle skills op level 3+',            rarity:'epic',      xp:55, funny:'Alles op level 3. Je bent een wandelend huishoudboek.'},
  {id:'streak_21',   icon:'🌙', name:'Drie-weken-held',    desc:'21 weken streak',                      rarity:'epic',      xp:60, funny:'21 weken. Bijna half jaar consistentie.'},
  {id:'recipe_10',   icon:'👨‍🍳', name:'Thuiskok',           desc:'10 recepten aangemaakt',              rarity:'epic',      xp:35, funny:'10 recepten. Gordon Ramsay belt niet, maar respect.'},
  {id:'quests_15',   icon:'⚔️',  name:'Quest-Ridder',       desc:'15 weekly quests voltooid',            rarity:'epic',      xp:40, funny:'15 quests. Jij bent een ridder van het huishouden.'},
  {id:'abilities_10',icon:'🪄', name:'Hogwarts-alumni',    desc:'10 abilities gebruikt',                rarity:'epic',      xp:35, funny:'10 spreuken. Stuur ons je Hogwarts-diploma.'},
  // ── MORE LEGENDARY ──
  {id:'level25_badge',icon:'💎', name:'Kwart-eeuw-level',  desc:'Level 25 bereikt',                     rarity:'legendary', xp:80, funny:'Level 25. Je verdient een eigen wiki-pagina.'},
  {id:'task_150',    icon:'🏰', name:'Taak-kasteel',       desc:'150 taken afgevinkt',                  rarity:'legendary', xp:100,funny:'150 taken. Je hebt een kasteel verdiend. Klein dan.'},
  {id:'savings_all', icon:'🏆', name:'Spaardoel-grootmeester',desc:'Alle spaardoelen bereikt',          rarity:'legendary', xp:120,funny:'Alles gespaard. Nu nieuwe doelen verzinnen.'},
  {id:'streak_365',  icon:'📆', name:'Jaar-rondom',        desc:'365 dagen streaks bijgehouden',        rarity:'legendary', xp:300,funny:'365 dagen. Je bent niet menselijk.'},
  {id:'skill_10_10', icon:'💯', name:'Absolute perfectionist',desc:'10 skills op level 10+',           rarity:'legendary', xp:200,funny:'10 skills op 10. Wie BEN jij eigenlijk?'},
  {id:'abilities_25',icon:'🔮', name:'Zwarte-Belt Tovenaar',desc:'25 abilities gebruikt',              rarity:'legendary', xp:150,funny:'25 spreuken. De Zwarte Belt van de magie.'},
  {id:'level35',     icon:'🌀', name:'Voorbij de dimensies',desc:'Level 35 bereikt (GEHEIM)',           rarity:'legendary', xp:500,funny:'Level 35. Dit hadden wij zelf niet verwacht.'},
];

var BADGES = [
  {id:'first_task',    icon:'✅', name:'Eerste stap',        desc:'Eerste taak afgevinkt',                rarity:'common',    xp:3,  funny:'Geweldig, je deed iets!'},
  {id:'shopper',       icon:'🛒', name:'Boodschapper',       desc:'Eerste boodschap gekocht',             rarity:'common',    xp:3,  funny:'De melk staat niet meer op de lijst'},
  {id:'noter',         icon:'📝', name:'Notulist',           desc:'Eerste notitie gemaakt',               rarity:'common',    xp:4,  funny:'Jij schrijft alles op. Héros.'},
  {id:'poster',        icon:'📸', name:'Vlogger',            desc:'Eerste post geplaatst',                rarity:'common',    xp:3,  funny:'Influencer mode: ON'},
  {id:'liker',         icon:'❤️', name:'Lief zijn',          desc:'Post geliked',                         rarity:'common',    xp:2,  funny:'Even een hartje. Zo simpel.'},
  {id:'theme',         icon:'🎨', name:'Interieur-expert',   desc:'Thema gewisseld',                      rarity:'common',    xp:2,  funny:'Wil je het donker of kawaii?'},
  {id:'darkmode',      icon:'🌙', name:'Nacht-uil',          desc:'Dark mode aangezet',                   rarity:'common',    xp:2,  funny:'Scherm dimmen = productief voelen'},
  {id:'first_recipe',  icon:'🍳', name:'Kok in spe',         desc:'Eerste recept aangemaakt',             rarity:'common',    xp:3,  funny:'Gordon Ramsay liegt in zijn handjes'},
  {id:'first_skill',   icon:'⚡', name:'Skill-starter',      desc:'Eerste skill ge-logged',               rarity:'common',    xp:3,  funny:'Level 1! De enige weg is omhoog.', check:function(){return Object.values(skillsData).some(function(p){return Object.values(p).some(function(s){return s.xp>0;});});}},
  {id:'income_edit',   icon:'💰', name:'Loononderhandelaar', desc:'Inkomen bijgesteld',                   rarity:'common',    xp:3,  funny:'Salaris omhoog? Wishful thinking.', check:function(){return false;}},
  {id:'first_quest',   icon:'📜', name:'Quest-starter',      desc:'Eerste weekly quest voltooid',         rarity:'common',    xp:5,  funny:'Je eerste quest done. Meer komen eraan.', check:function(){return questsCompleted>=1;}},
  {id:'routine',       icon:'🔁', name:'Routinekoning',      desc:'Vaste taak 3x op rij',                rarity:'rare',      xp:10, funny:'Je doet het echt elke keer. Indrukwekkend.'},
  {id:'budget',        icon:'💸', name:'Budgetbewust',       desc:'Eerste vaste last betaald',            rarity:'rare',      xp:8,  funny:'De huur is betaald. Fijn!'},
  {id:'task_5',        icon:'📋', name:'Takenmaster',        desc:'5 taken afgevinkt',                    rarity:'rare',      xp:12, funny:'5 taken. Tel je je vingers ook?'},
  {id:'task_10',       icon:'💪', name:'Taak-atleet',        desc:'10 taken afgevinkt',                   rarity:'rare',      xp:15, funny:'10 taken! Bijna sportief.'},
  {id:'shop_5',        icon:'🏪', name:'Supermarktpro',      desc:'5 boodschappen gekocht',               rarity:'rare',      xp:10, funny:'Je weet nu dat kaas bij Zuivel hoort'},
  {id:'streak_3',      icon:'🔥', name:'Lekker bezig!',      desc:'Streak van 3',                         rarity:'rare',      xp:10, funny:'3 keer op rij! Je bent op dreef.'},
  {id:'negotiator',    icon:'🤝', name:'Dealmaker',          desc:'Taakruil aangeboden',                  rarity:'rare',      xp:7,  funny:'Jij: "ik doe de was, jij de afwas?" Klassiek.'},
  {id:'accepted',      icon:'🎯', name:'Deal gesloten',      desc:'Taakruil geaccepteerd',                rarity:'rare',      xp:8,  funny:'Contracten zijn getekend. (Niet echt)'},
  {id:'finance_king',  icon:'📊', name:'Financieel genie',   desc:'Financiën tabblad geopend',            rarity:'rare',      xp:5,  funny:'Kijken naar getallen = financieel genie'},
  {id:'skill_lv3',     icon:'🌱', name:'Groene vingers',     desc:'Eén skill naar level 3',               rarity:'rare',      xp:10, funny:'Je doet het vaker dan je dacht.', check:function(){return SKILL_DEFS.some(function(d){return skillLevelFromXp((skillsData[myName]||{})[d.id]&&skillsData[myName][d.id].xp||0)>=3;});}},
  {id:'ability_used',  icon:'🪄', name:'Eerste spreuk',      desc:'Eerste ability gebruikt',              rarity:'rare',      xp:8,  funny:'Bibbidi-bobbidi-bobbidi-uitstellen.', check:function(){return abilitiesUsed>=1;}},
  {id:'quest_3',       icon:'📜', name:'Quest-loper',        desc:'3 weekly quests voltooid',             rarity:'rare',      xp:12, funny:'Je doet meer dan gevraagd. Verdacht.', check:function(){return questsCompleted>=3;}},
  {id:'streak_7',      icon:'🌋', name:'On fire!',           desc:'Streak van 7',                         rarity:'epic',      xp:20, funny:'7 weken! Je bent haast professioneel.'},
  {id:'hero',          icon:'🏆', name:'Gezinsheld',         desc:'Level 10 bereikt',                     rarity:'epic',      xp:15, funny:'Level 10. Je gezin is trots. (Of verbaasd.)'},
  {id:'allscreens',    icon:'🗺️', name:'Ontdekker',          desc:'Alle schermen bezocht',                rarity:'epic',      xp:15, funny:'Je hebt de hele app gezien. Nu doen!'},
  {id:'task_25',       icon:'🦾', name:'Taak-cyborg',        desc:'25 taken afgevinkt',                   rarity:'epic',      xp:20, funny:'25 taken. Ben je menselijk?'},
  {id:'task_50',       icon:'🤖', name:'Taak-machine',       desc:'50 taken afgevinkt',                   rarity:'epic',      xp:28, funny:'50 taken. Zoek hulp. (Maar dan de goede soort.)'},
  {id:'streak_10',     icon:'💎', name:'Diamond streak',     desc:'Streak van 10',                        rarity:'epic',      xp:22, funny:'10 weken op rij. Respect.'},
  {id:'notes_5',       icon:'📚', name:'Schrijver',          desc:'5 notities gemaakt',                   rarity:'epic',      xp:12, funny:'5 notities. Bijna een roman.'},
  {id:'feed_10',       icon:'📣', name:'Social butterfly',   desc:'10 posts geplaatst',                   rarity:'epic',      xp:14, funny:'10 posts! Word je een influencer?'},
  {id:'trade_5',       icon:'🤑', name:'Marktmeester',       desc:'5 taakruilen gedaan',                  rarity:'epic',      xp:18, funny:'Je ruilt taken als cryptomunten.'},
  {id:'skill_lv7',     icon:'🔧', name:'Vakman/-vrouw',      desc:'Eén skill naar level 7',               rarity:'epic',      xp:22, funny:'Iemand die echt weet wat hij doet.', check:function(){return SKILL_DEFS.some(function(d){return skillLevelFromXp((skillsData[myName]||{})[d.id]&&skillsData[myName][d.id].xp||0)>=7;});}},
  {id:'skill_5_lv5',   icon:'🏅', name:'Allrounder',         desc:'5 skills naar level 5',                rarity:'epic',      xp:25, funny:'Multi-skilled? Ja.', check:function(){return SKILL_DEFS.filter(function(d){return skillLevelFromXp((skillsData[myName]||{})[d.id]&&skillsData[myName][d.id].xp||0)>=5;}).length>=5;}},
  {id:'quest_10',      icon:'⚔️', name:'Quest-veteraan',     desc:'10 weekly quests voltooid',            rarity:'epic',      xp:22, funny:'10 quests. Je bent onstopbaar.', check:function(){return questsCompleted>=10;}},
  {id:'ability_5',     icon:'🪄', name:'Tovenaar',           desc:'5 abilities gebruikt',                 rarity:'epic',      xp:20, funny:'5 spreuken. Zweinstein belt je binnenkort.', check:function(){return abilitiesUsed>=5;}},
  {id:'superstar',     icon:'🌟', name:'Superster',          desc:'Level 15 bereikt',                     rarity:'legendary', xp:30, funny:'Level 15. Jij bent eigenlijk de baas hier.'},
  {id:'streak_14',     icon:'👑', name:'Streak Royale',      desc:'Streak van 14',                        rarity:'legendary', xp:30, funny:'14 weken. Je bent een machine.'},
  {id:'legend',        icon:'⚡', name:'Legendarisch',        desc:'Level 20 bereikt',                     rarity:'legendary', xp:40, funny:'Level 20. Vermeldenswaardig op je grafsteen.'},
  {id:'perfectionist', icon:'💯', name:'Perfectionist',      desc:'Een volledige week 0 taken open',      rarity:'legendary', xp:35, funny:'Alles klaar. Mag de internet nu uit.'},
  {id:'millionaire',   icon:'💎', name:'XP-miljonair',       desc:'5000 XP bereikt',                      rarity:'legendary', xp:50, funny:'5000 XP. Je hebt een leven besteed aan taken.', check:function(){return myXP>=5000;}},
  {id:'task_100',      icon:'🏛️', name:'Centurion',          desc:'100 taken afgevinkt',                  rarity:'legendary', xp:40, funny:'100 taken. Officieel bezig geweest.'},
  {id:'godmode',       icon:'🌌', name:'Huishoud-God',       desc:'Level 25 bereikt',                     rarity:'legendary', xp:70, funny:'Level 25. Kalm aan, Zeus.'},
  {id:'skill_max',     icon:'🦄', name:'Skill-unicorn',      desc:'Een skill naar level 15',              rarity:'legendary', xp:60, funny:'Level 15 in een skill. Bestaat maar 1x.', check:function(){return SKILL_DEFS.some(function(d){return skillLevelFromXp((skillsData[myName]||{})[d.id]&&skillsData[myName][d.id].xp||0)>=15;});}},
  {id:'master_trader', icon:'🏦', name:'Taak-Wallstreet',    desc:'10 taakruilen gedaan',                 rarity:'legendary', xp:40, funny:'Je ruilt taken. Op Wall Street ruilen ze aandelen.'},
  {id:'quest_25',      icon:'🌠', name:'Quest-legende',      desc:'25 weekly quests voltooid',            rarity:'legendary', xp:50, funny:'25 quests. Je hebt geen vrije weekenden meer.', check:function(){return questsCompleted>=25;}},
  {id:'streak_52',     icon:'🔱', name:'Jaar-streak',        desc:'52 weken streak',                      rarity:'legendary', xp:100,funny:'Een heel jaar. Kun je nog normaal doen?'},
  {id:'level30',       icon:'🌌', name:'God-modus Actief',   desc:'Level 30 bereikt',                     rarity:'legendary', xp:200,funny:'Level 30. Er is geen level 31. Jij hebt gewonnen.', check:function(){return getLevel(myXP)>=30;}},
];

var questsCompleted = 0;
var abilitiesUsed = 0;


var unlockedBadges = {};
var newBadges = {};
var visitedScreens = new Set(['home']);
var partnerXP = 95;

// ── TASK TRADE SYSTEM ──
var tradeOffers = []; // {id, from, toTask, offerTask, status:'pending'|'accepted'|'declined', msg}
var tradeNextId = 1;
var tradesCount = 0;

function openTradeSheet() {
  var myTasks = taskData.filter(function(t){return !t.done && t.who && t.who.indexOf(myName)>-1;});
  var partnerTasks = taskData.filter(function(t){return !t.done && t.who && t.who.indexOf(partnerName)>-1;});
  if(!myTasks.length){showToast('Je hebt geen open taken om aan te bieden');return;}
  if(!partnerTasks.length){showToast(partnerName+' heeft geen taken die je kunt overnemen');return;}

  currentAddType='trade';
  document.getElementById('sheet-title').textContent='🤝 Taak ruilen';
  document.getElementById('sheet-fields').innerHTML=
    '<div class="field"><label>Jouw taak (aanbieden)</label>'
    +'<select id="trade-my-task">'
    +myTasks.map(function(t){return '<option value="'+t.id+'">'+t.title+'</option>';}).join('')
    +'</select></div>'
    +'<div class="field"><label>Taak die je wil overnemen (van '+partnerName+')</label>'
    +'<select id="trade-their-task">'
    +partnerTasks.map(function(t){return '<option value="'+t.id+'">'+t.title+'</option>';}).join('')
    +'</select></div>'
    +'<div class="field"><label>Berichtje erbij (optioneel)</label>'
    +'<input id="trade-msg" placeholder="bijv. Ik haat stofzuigen 😅">'
    +'</div>';
  document.getElementById('add-overlay').classList.add('open');
  setTimeout(function(){var f=document.getElementById('trade-my-task');if(f)f.focus();},200);
}

function submitTrade() {
  var myTaskId = parseInt((document.getElementById('trade-my-task')||{}).value);
  var theirTaskId = parseInt((document.getElementById('trade-their-task')||{}).value);
  var msg = (document.getElementById('trade-msg')||{}).value||'';
  var myTask = taskData.find(function(t){return t.id===myTaskId;});
  var theirTask = taskData.find(function(t){return t.id===theirTaskId;});
  if(!myTask||!theirTask){closeAdd();return;}

  tradeOffers.unshift({
    id: tradeNextId++,
    from: myName,
    myTask: myTask,
    theirTask: theirTask,
    msg: msg,
    status: 'pending',
    time: 'Zojuist'
  });
  tradesCount++;
  addActivity('🤝','#fff3dc',myName+' stelt taakruil voor: "'+myTask.title+'" ↔ "'+theirTask.title+'"');
  addNotif('🤝','#fff3dc','Taakruil aangeboden!','"'+myTask.title+'" ↔ "'+theirTask.title+'"');
  awardXP(8,'Taakruil aangeboden');
  checkAchievements();
  closeAdd();
  showToast('Taakruil aangeboden! 🤝');
  // Show trades in tasks screen
  if(document.getElementById('screen-tasks').classList.contains('active')) renderTasks();
}

function acceptTrade(id) {
  var trade = tradeOffers.find(function(t){return t.id===id;});if(!trade)return;
  trade.status='accepted';
  // Actually swap the tasks
  var myT = taskData.find(function(t){return t.id===trade.myTask.id;});
  var theirT = taskData.find(function(t){return t.id===trade.theirTask.id;});
  if(myT) myT.who = [partnerName];
  if(theirT) theirT.who = [myName];
  tradesCount++;
  addActivity('🎯','#e8f5e3',partnerName+' accepteerde taakruil!');
  addNotif('🎯','#e8f5e3','Deal gesloten! 🎉','"'+trade.myTask.title+'" en "'+trade.theirTask.title+'" zijn gewisseld');
  awardXP(10,'Taakruil geaccepteerd');
  checkAchievements();
  renderTasks();
  showToast('Deal gesloten! Taken zijn gewisseld 🎉');
}

function declineTrade(id) {
  var trade = tradeOffers.find(function(t){return t.id===id;});if(!trade)return;
  trade.status='declined';
  addActivity('❌','#fee2e2',partnerName+' weigerde de taakruil');
  renderTasks();
  showToast('Taakruil afgewezen 😬');
}

// ── ACHIEVEMENTS ──
function checkAchievements() {
  // Dynamic checks
  BADGES.find(function(b){return b.id==='trade_5';}).check = function(){return tradesCount>=5;};
  BADGES.find(function(b){return b.id==='master_trader';}).check = function(){return tradesCount>=10;};
  BADGES.find(function(b){return b.id==='notes_5';}).check = function(){return noteData.length>=5;};
  BADGES.find(function(b){return b.id==='feed_10';}).check = function(){return feedData.length>=10;};
  BADGES.find(function(b){return b.id==='task_10';}).check = function(){return taskData.filter(function(t){return t.done;}).length>=10;};
  BADGES.find(function(b){return b.id==='task_25';}).check = function(){return taskData.filter(function(t){return t.done;}).length>=25;};
  BADGES.find(function(b){return b.id==='streak_3';}).check = function(){return recurData.some(function(r){return r.streak>=3;});};
  BADGES.find(function(b){return b.id==='streak_10';}).check = function(){return recurData.some(function(r){return r.streak>=10;});};
  BADGES.find(function(b){return b.id==='millionaire';}).check = function(){return myXP>=1000;};
  BADGES.find(function(b){return b.id==='godmode';}).check = function(){return getLevel(myXP)>=10;};
  BADGES.find(function(b){return b.id==='finance_king';}).check = function(){return visitedScreens.has('finance');};

  BADGES.forEach(function(badge) {
    if(unlockedBadges[badge.id]) return;
    if(badge.check && badge.check()) {
      unlockedBadges[badge.id] = true;
      newBadges[badge.id] = true;
      // Award badge XP
      myXP += badge.xp;
      showAchievementToast(badge);
    }
  });
}

function awardXP(amount, label) {
  var prevLevel = getLevel(myXP);
  myXP += amount;
  localStorage.setItem('fam_myxp_v1', String(myXP));
  var newLevel = getLevel(myXP);
  showXPPopup(amount, label);
  updateHomeXP();
  if(newLevel > prevLevel) setTimeout(function(){showLevelUp(newLevel);}, 600);
  checkAchievements();
}

// ── RENDER ACHIEVEMENTS ──
function renderAch() {
  var el=document.getElementById('ach-content');if(!el)return;
  var lv=getLevel(myXP);
  var titleData=LEVEL_TITLES[Math.min(lv-1,LEVEL_TITLES.length-1)];
  var prevXP=LEVEL_XP[lv-1]||0;
  var nextXP=LEVEL_XP[Math.min(lv,LEVEL_XP.length-1)]||LEVEL_XP[LEVEL_XP.length-1];
  var pct=nextXP>prevXP?Math.round((myXP-prevXP)/(nextXP-prevXP)*100):100;

  var html='<div class="ach-banner">'
    +'<div class="ach-level-ring"><div class="ach-level-num">'+lv+'</div><div class="ach-level-lbl">Level</div></div>'
    +'<div class="ach-title">'+titleData.title+'</div>'
    +'<div class="ach-subtitle" style="font-style:italic;opacity:.65">'+titleData.desc+'</div>'
    +'<div class="ach-xp-bar"><div class="ach-xp-fill" style="width:'+pct+'%"></div></div>'
    +'<div class="ach-xp-txt">'+myXP+' XP · Nog '+(nextXP-myXP)+' XP tot level '+(lv+1)+'</div>'
    +'</div>';

  // Stat pills
  var maxStreak=recurData.reduce(function(m,r){return Math.max(m,r.streak||0);},0);
  var doneTasks=taskData.filter(function(t){return t.done;}).length;
  var unlockedCount=Object.keys(unlockedBadges).length;
  html+='<div class="ach-section-title">📊 Statistieken</div>'
    +'<div class="streak-bar">'
    +'<div class="streak-card"><div class="streak-fire">🔥</div><div class="streak-num">'+maxStreak+'</div><div class="streak-lbl">Max streak</div></div>'
    +'<div class="streak-card"><div class="streak-fire">✅</div><div class="streak-num">'+doneTasks+'</div><div class="streak-lbl">Taken klaar</div></div>'
    +'<div class="streak-card"><div class="streak-fire">🏅</div><div class="streak-num">'+unlockedCount+'/'+BADGES.length+'</div><div class="streak-lbl">Badges</div></div>'
    +'<div class="streak-card"><div class="streak-fire">🤝</div><div class="streak-num">'+tradesCount+'</div><div class="streak-lbl">Ruilen</div></div>'
    +'</div>';

  // Leaderboard
  var players=[
    {name:myName,color:myColor,initials:myInitials,xp:myXP},
    {name:partnerName,color:'#c0547a',initials:partnerName.substring(0,2).toUpperCase(),xp:partnerXP}
  ].sort(function(a,b){return b.xp-a.xp;});
  html+='<div class="ach-section-title">🏆 Ranglijst</div>';
  players.forEach(function(p,i){
    var rankIcon=['🥇','🥈','🥉'][i]||''+(i+1);
    var plv=getLevel(p.xp);
    var ptitle=LEVEL_TITLES[Math.min(plv-1,LEVEL_TITLES.length-1)];
    html+='<div class="lb-item">'
      +'<div class="lb-rank '+(i===0?'gold':i===1?'silver':'bronze')+'">'+rankIcon+'</div>'
      +'<div class="lb-avatar" style="background:'+p.color+'">'+p.initials+'</div>'
      +'<div class="lb-info"><div class="lb-name">'+p.name+'</div>'
      +'<div class="lb-level">'+ptitle.title+'</div></div>'
      +'<div class="lb-xp-badge">'+p.xp+' XP</div>'
      +'</div>';
  });

  // Level roadmap — next 3 titles
  html+='<div class="ach-section-title">🗺️ Titels vooruitblik</div>'
    +'<div style="padding:0 16px 12px">';
  for(var i=lv;i<Math.min(lv+3,LEVEL_TITLES.length);i++){
    var lt=LEVEL_TITLES[i];
    html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:.5px solid var(--c-border)">'
      +'<div style="width:28px;height:28px;border-radius:50%;background:var(--c-surface2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--c-text2);flex-shrink:0">'+lt.lv+'</div>'
      +'<div><div style="font-size:13px;font-weight:700;color:var(--c-text)">'+lt.title+'</div>'
      +'<div style="font-size:11px;color:var(--c-text2)">'+lt.desc+'</div></div>'
      +'<div style="margin-left:auto;font-size:11px;color:var(--c-primary);font-weight:600">'+LEVEL_XP[i]+' XP</div>'
      +'</div>';
  }
  html+='</div>';

  // Badges per rarity
  var rarityOrder=['legendary','epic','rare','common'];
  var rarityLabel={legendary:'👑 Legendarisch',epic:'💜 Episch',rare:'💙 Zeldzaam',common:'⚪ Gewoon'};
  rarityOrder.forEach(function(rarity){
    var group=BADGES.filter(function(b){return b.rarity===rarity;});
    html+='<div class="ach-section-title">'+rarityLabel[rarity]+'</div>'
      +'<div class="badge-grid">';
    group.forEach(function(b){
      var unlocked=!!unlockedBadges[b.id];
      var isNew=!!newBadges[b.id];
      html+='<div class="badge-card '+(unlocked?'unlocked':'locked')+' rarity-'+b.rarity+'" onclick="'+(unlocked?'showBadgeDetail(\''+b.id+'\')':'')+'">'
        +(isNew?'<div class="badge-new-dot"></div>':'')
        +'<div class="badge-icon-wrap">'+b.icon+'</div>'
        +'<div class="badge-name">'+b.name+'</div>'
        +'<div class="badge-rarity '+b.rarity+'">'+(unlocked?'+'+b.xp+' XP':'???')+'</div>'
        +'</div>';
    });
    html+='</div>';
  });

  // Weekly quests + abilities
  html += renderWeeklyQuestsHtml();
  html += renderAbilitiesHtml();

  el.innerHTML=html;
  setTimeout(function(){newBadges={};},1000);
}

function showBadgeDetail(id) {
  var badge=BADGES.find(function(b){return b.id===id;});if(!badge)return;
  showToast(badge.icon+' '+badge.name+' — '+badge.funny);
}



// ── XP FLOAT POPUP ──
function showXPPopup(amount, label) {
  var pop = document.createElement('div');
  pop.className = 'xp-popup';
  pop.innerHTML = '<span style="font-size:15px;font-weight:800;color:#2d5a27">+'+amount+' XP</span>'
    +(label?'<span style="font-size:11px;color:#888;margin-left:4px">'+label+'</span>':'');
  pop.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);background:#fff;border-radius:20px;padding:6px 14px;box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:200;pointer-events:none;animation:xpFloat 1.2s ease-out forwards;white-space:nowrap';
  document.body.appendChild(pop);
  setTimeout(function(){ pop.remove(); }, 1300);
}

// ── ACHIEVEMENT TOAST ──

// ── LEVEL UP ──

// ── CONFETTI ──
function spawnConfetti() {
  var canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var pieces = [];
  var colors = ['#2d5a27','#fde68a','#93c5fd','#f9a8d4','#86efac','#fca5a5','#c4b5fd'];
  for(var i=0; i<80; i++) {
    pieces.push({
      x: Math.random()*canvas.width,
      y: -10 - Math.random()*100,
      w: 6+Math.random()*8,
      h: 10+Math.random()*6,
      color: colors[Math.floor(Math.random()*colors.length)],
      rot: Math.random()*360,
      vx: (Math.random()-0.5)*4,
      vy: 2+Math.random()*4,
      vr: (Math.random()-0.5)*8
    });
  }
  var frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(function(p){
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    frame++;
    if(frame<90) requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
}

// ── UPDATE HOME XP STRIP ──
function updateHomeXP() {
  var lv = getLevel(myXP);
  var prevXP = LEVEL_XP[lv-1]||0;
  var nextXP = LEVEL_XP[Math.min(lv, LEVEL_XP.length-1)]||LEVEL_XP[LEVEL_XP.length-1];
  var pct = nextXP>prevXP ? Math.round((myXP-prevXP)/(nextXP-prevXP)*100) : 100;
  var el;
  // home screen elements
  el=document.getElementById('home-xp-avatar'); if(el) el.textContent=myInitials;
  el=document.getElementById('home-xp-level');  if(el) el.textContent='Level '+lv+' · '+getLevelName(lv);
  el=document.getElementById('home-xp-fill');   if(el) el.style.width=pct+'%';
  el=document.getElementById('home-xp-pts');    if(el) el.textContent=myXP+' XP';
  // profile screen elements
  el=document.getElementById('xp-fill');  if(el) el.style.width=pct+'%';
  el=document.getElementById('xp-text');  if(el) el.textContent=myXP+' XP';
}



