'use strict';
// ============================================================
// DATA
// ============================================================

// ── API CONFIG — Google Gemini (gratis) ──
var GEMINI_API_KEY = localStorage.getItem('familie_gemini_key') || '';
var GEMINI_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

function callGemini(prompt, systemPrompt, maxTokens) {
  var key = GEMINI_API_KEY;
  if(!key) return Promise.reject(new Error('NO_KEY'));
  var contents = [];
  if(systemPrompt) contents.push({role:'user', parts:[{text:'[SYSTEEM INSTRUCTIE]: '+systemPrompt}]}, {role:'model', parts:[{text:'Begrepen, ik zal dat doen.'}]});
  contents.push({role:'user', parts:[{text:prompt}]});
  return fetch(GEMINI_URL_BASE + key, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      contents: contents,
      generationConfig: {maxOutputTokens: maxTokens||400, temperature:0.7}
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.error) throw new Error(d.error.message||'Gemini fout');
    var text = d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]?d.candidates[0].content.parts[0].text:'';
    return text;
  });
}

function checkApiKey() {
  if(!GEMINI_API_KEY) {
    showToast('⚙️ Stel eerst je Gemini API key in via Profiel');
    showScreenMore('profile');
    return false;
  }
  return true;
}

var myName = 'Shane';
var partnerName = 'Esra';
var myColor = '#2d5a27';
var myInitials = 'SK';

var taskData = [
  {id:1,title:'Auto wassen',who:['Shane'],date:'2026-05-06',done:false,prio:'med'},
  {id:2,title:'Belasting aangifte',who:['Shane'],date:'2026-05-15',done:false,prio:'high'},
  {id:3,title:'Stofzuigen woonkamer',who:['Esra'],date:'2026-05-04',done:true,prio:'low'},
  {id:4,title:'Verjaardag cadeau kopen',who:['Shane','Esra'],date:'2026-05-20',done:false,prio:'med'},
  {id:5,title:'Planten water geven',who:['Esra'],date:'2026-05-05',done:false,prio:'low'},
  {id:6,title:'Tandarts bevestigen',who:['Shane'],date:'2026-05-07',done:false,prio:'high'}
];
var taskNextId = 7;

var recurData = [
  {id:'r1',title:'Stofzuigen',who:['Esra'],freq:'weekly',days:['maandag'],streak:3,doneWeek:{},doneDates:{}},
  {id:'r2',title:'Boodschappen doen',who:['Shane','Esra'],freq:'weekly',days:['woensdag','zaterdag'],streak:7,doneWeek:{},doneDates:{}},
  {id:'r3',title:'Badkamer schoon',who:['Shane'],freq:'weekly',days:['zaterdag'],streak:2,doneWeek:{},doneDates:{}},
  {id:'r4',title:'Was doen',who:['Esra'],freq:'weekly',days:['dinsdag','vrijdag'],streak:5,doneWeek:{},doneDates:{}},
  {id:'r5',title:'Auto tanken',who:['Shane'],freq:'monthly1',days:[],week:2,day:'vrijdag',streak:1,doneWeek:{},doneDates:{}},
  {id:'r6',title:'Planten water',who:['Esra'],freq:'weekly',days:['zondag'],streak:4,doneWeek:{},doneDates:{}}
];
var recurNextId = 7;

var shopData = [
  {id:1,name:'Melk',qty:'2x',cat:'Zuivel',who:'Shane',done:false,photo:'🥛'},
  {id:2,name:'Appels',qty:'6 stuks',cat:'Fruit',who:'Esra',done:false,photo:'🍎'},
  {id:3,name:'Brood',qty:'1 brood',cat:'Brood',who:'Shane',done:true,photo:'🍞'},
  {id:4,name:'Kaas',qty:'200g',cat:'Zuivel',who:'Esra',done:false,photo:'🧀'},
  {id:5,name:'Tomaten',qty:'500g',cat:'Groente',who:'Shane',done:false,photo:'🍅'}
];
var shopNextId = 6;

var noteData = [
  {id:1,title:'Vakantie ideeën 🌍',blocks:[{id:1,type:'text',x:20,y:20,w:260,h:100,content:'Italië, Kroatië of Griekenland?\nBudget: € 2500'}],color:'yellow',nb:'Gezin',who:'Esra',time:'Gisteren'},
  {id:2,title:'Wifi wachtwoord',blocks:[{id:1,type:'text',x:20,y:20,w:240,h:80,content:'Netwerk: FamilieNet\nWachtwoord: FamilieNet2024!'}],color:'blue',nb:'Gezin',who:'Shane',time:'2 wk geleden'},
  {id:3,title:'Lasagne recept 🍝',blocks:[{id:1,type:'text',x:20,y:20,w:260,h:140,content:'Ingrediënten:\n- 500g gehakt\n- Lasagne platen\n- Béchamelsaus\n\nOven 180°C, 45 min'}],color:'pink',nb:'Recepten',who:'Esra',time:'3 dagen geleden'}
];
var noteNextId = 4;


var calData = [
  {id:1,title:'Tandarts Shane',date:'2026-05-07',time:'14:00',color:'#2d5a27'},
  {id:2,title:'Verjaardagsfeest mama',date:'2026-05-17',time:'15:00',color:'#c0547a'},
  {id:3,title:'Auto APK',date:'2026-05-22',time:'09:00',color:'#d97706'}
];
var calNextId = 4;
var calYear = 2026;
var calMonth = 4;
var calSelDay = null;

var vasteLasten = [
  {id:'vl1',name:'Huur',amount:1200,cat:'Wonen',day:1,who:'Samen',paid:{}},
  {id:'vl2',name:'Energie',amount:180,cat:'Wonen',day:3,who:'Samen',paid:{}},
  {id:'vl3',name:'Internet',amount:45,cat:'Abonnementen',day:5,who:'Shane',paid:{}},
  {id:'vl4',name:'Netflix',amount:18,cat:'Abonnementen',day:8,who:'Esra',paid:{}},
  {id:'vl5',name:'Sportschool',amount:30,cat:'Gezondheid',day:10,who:'Shane',paid:{}}
];
var vlNextId = 6;
// Initial fallback only, used for the brief moment before FinanceStore has
// booted. enterFinanceScreen() (calendarLegacy.js) re-derives this from
// new Date() every time the user navigates into Financiën — never hardcode
// a specific month/year here.
var mpYear = new Date().getFullYear();
var mpMonth = new Date().getMonth();
var samenBetaler = 'Beiden';
var inkomenShane = {label:'Salaris',amount:2800};
var inkomenEsra  = {label:'Salaris',amount:2400};

var transData = [
  {id:1,  name:'Jumbo',          cat:'Boodschappen',   amount:-67.50, who:'Shane', date:'2026-05-03'},
  {id:2,  name:'Pizzeria Roma',  cat:'Uit eten',       amount:-32.00, who:'Esra',  date:'2026-05-02'},
  {id:3,  name:'Tankstation BP', cat:'Transport',      amount:-58.40, who:'Shane', date:'2026-04-30'},
  {id:4,  name:'Apotheek',       cat:'Gezondheid',     amount:-12.80, who:'Esra',  date:'2026-04-29'},
  {id:5,  name:'Netflix',        cat:'Abonnementen',   amount:-17.99, who:'Shane', date:'2026-04-27'},
  {id:6,  name:'Albert Heijn',   cat:'Boodschappen',   amount:-54.20, who:'Esra',  date:'2026-04-25'},
  {id:7,  name:'Hema',           cat:'Kleding',        amount:-43.00, who:'Esra',  date:'2026-04-22'},
  {id:8,  name:'NS Trein',       cat:'Transport',      amount:-22.50, who:'Shane', date:'2026-04-20'},
  {id:9,  name:'Jumbo',          cat:'Boodschappen',   amount:-71.30, who:'Esra',  date:'2026-04-18'},
  {id:10, name:'Tandarts',       cat:'Gezondheid',     amount:-85.00, who:'Shane', date:'2026-04-15'},
  {id:11, name:'Jumbo',          cat:'Boodschappen',   amount:-63.10, who:'Shane', date:'2026-03-28'},
  {id:12, name:'Uit eten',       cat:'Uit eten',       amount:-55.00, who:'Esra',  date:'2026-03-22'},
  {id:13, name:'Bol.com',        cat:'Shopping',       amount:-38.99, who:'Esra',  date:'2026-03-15'},
  {id:14, name:'Tankstation',    cat:'Transport',      amount:-62.00, who:'Shane', date:'2026-03-10'},
  {id:15, name:'Spotify',        cat:'Abonnementen',   amount:-10.99, who:'Shane', date:'2026-03-05'},
  {id:16, name:'Jumbo',          cat:'Boodschappen',   amount:-69.40, who:'Esra',  date:'2026-02-25'},
  {id:17, name:'Restaurant',     cat:'Uit eten',       amount:-78.00, who:'Shane', date:'2026-02-14'},
  {id:18, name:'Intersport',     cat:'Kleding',        amount:-89.50, who:'Shane', date:'2026-02-10'},
  {id:19, name:'GVB OV',         cat:'Transport',      amount:-45.00, who:'Esra',  date:'2026-02-05'},
  {id:20, name:'Kruidvat',       cat:'Gezondheid',     amount:-24.60, who:'Esra',  date:'2026-01-28'}
];
var transNextId = 21;

// Eenmalige / extra inkomsten
var extraIncome = [
  {id:1, name:'Vakantiegeld',   amount:1200, who:'Shane', date:'2026-05-01', cat:'Vakantiegeld'},
  {id:2, name:'Belastingterug', amount:850,  who:'Esra',  date:'2026-03-15', cat:'Belasting'},
  {id:3, name:'Bonus Q1',       amount:500,  who:'Shane', date:'2026-04-01', cat:'Bonus'}
];
var extraIncNextId = 4;

var notifData = [
  {id:1,icon:'✅',bg:'#e8f5e3',title:'Welkom!',body:'FamilieApp is klaar voor gebruik.',time:'Nu',read:false}
];
var notifNextId = 2;

var activityData = [
  {id:1,icon:'🏠',bg:'#e8f5e3',text:'FamilieApp gestart!',time:'Nu'}
];
var actNextId = 2;

var myXP = parseInt(localStorage.getItem('fam_myxp_v1')||'120',10);
var partnerXPStore = parseInt(localStorage.getItem('fam_partnerxp_v1')||'95',10);

// Level thresholds — designed for ~1.5-2 year progression at normal use
// ~150-300 XP/week = 7800-15600 XP/year
// Level 30 = ~120,000 XP (several years of play)
var LEVEL_XP = (function(){
  var thresholds = [0];
  for(var i=1;i<=30;i++){
    // Exponential growth: each level ~40% harder than previous
    var needed = Math.round(80 * Math.pow(1.42, i-1));
    thresholds.push(thresholds[i-1] + needed);
  }
  return thresholds;
})();

function getLevel(xp){
  for(var i=LEVEL_XP.length-1;i>=0;i--){if(xp>=LEVEL_XP[i])return i+1;}
  return 1;
}
function getLevelName(lv){
  if(typeof LEVEL_TITLES!=='undefined'){
    var t=LEVEL_TITLES[Math.min(lv-1,LEVEL_TITLES.length-1)];
    return t?t.title.replace(/^\S+ /,''):lv+'';
  }
  return lv+'';
}

var taskTab = 'overzicht';
var finTab = 'maandplan';
var nbFilter = 'all';
var activeNoteId = null;
var currentAddType = '';

// Note editor state
var neBlocks = [];
var neSelected = null;
var neMode = 'select';
var neDrawTool = 'pen';
var neDrawColor = '#2d5a27';
var neDrawSize = 3;
var neHistory = [];
var neImgHistory = {};
var neDrawOnImg = null;
var neBlockNextId = 1;
var neNoteColor = 'yellow';
