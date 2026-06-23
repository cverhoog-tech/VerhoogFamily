'use strict';
// ============================================================
// DUO QUESTS
// ============================================================
var duoQuestProgress={duo_tasks:0,duo_cook:0,duo_shop:0};
var activeDuoQuest={id:'duo_tasks_10',icon:'👫',desc:'Shane én Esra samen 10 taken voltooien',target:10,type:'duo_tasks'};
var duoQuestDone=false;
function trackDuoProgress(type){
  if(!duoQuestProgress[type])duoQuestProgress[type]=0;
  duoQuestProgress[type]++;
  if(activeDuoQuest&&activeDuoQuest.type===type&&!duoQuestDone&&duoQuestProgress[type]>=activeDuoQuest.target){
    duoQuestDone=true;
    queueUnlock({icon:'👫',type:'👫 Duo Quest voltooid!',title:activeDuoQuest.desc,desc:'Jullie hebben het samen gedaan! +30 XP',who:null,confetti:true});
    awardXP(30,'Duo quest');
  }
}

// Wire saveItem for new templates
var _origSaveItem=saveItem;
saveItem=function(){
  if(currentAddType==='new_template'){saveNewTemplate();return;}
  if(currentAddType==='meal_pick')return;
  if(currentAddType==='yt_search')return;
  _origSaveItem();
};

// ============================================================
// FIREBASE — AUTH + SYNC + PUSH
// ============================================================

var fb = null; var fbDb = null; var fbAuth = null; var fbMsg = null;
var fbUser = null; var fbFamilyId = null;
var offlineMode = false;
var syncDebounce = {};

var FB_CONFIG_KEY = 'familie_fb_config';
var HARDCODED_FB_CONFIG = {
  apiKey: "AIzaSyA4vXaF85pfv2Cxy5VG-KJXxsOG14UeN1s",
  authDomain: "verhoog-family.firebaseapp.com",
  databaseURL: "https://verhoog-family-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "verhoog-family",
  storageBucket: "verhoog-family.firebasestorage.app",
  messagingSenderId: "216169661092",
  appId: "1:216169661092:web:ee86eb0b7b18bd4ae05c31"
};
var savedFbConfig = HARDCODED_FB_CONFIG;

function initFirebase(config) {
  try {
    if(typeof firebase==='undefined') return false;
    if(!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(config);
    }
    fbDb   = firebase.database();
    fbAuth = firebase.auth();
    try { fbMsg = firebase.messaging(); } catch(e){ fbMsg=null; }
    return true;
  } catch(e){ console.error('Firebase init:',e); showAuthError('Init fout: '+e.message); return false; }
}

function toggleFbConfig() {
  var p=document.getElementById('fb-config-panel');
  if(p) p.style.display=p.style.display==='none'?'block':'none';
}

function saveFbConfig() {
  var inp=document.getElementById('fb-config-input');
  var st =document.getElementById('fb-config-status');
  try {
    var cfg=JSON.parse((inp?inp.value:'').trim());
    if(!cfg.apiKey) throw new Error('Mist apiKey');
    localStorage.setItem(FB_CONFIG_KEY,JSON.stringify(cfg));
    savedFbConfig=cfg;
    var ok=initFirebase(cfg);
    if(st) st.innerHTML=ok?'<span style="color:#16a34a">✅ Verbonden!</span>':'<span style="color:#dc2626">❌ Mislukt</span>';
    var w=document.getElementById('fb-config-warning');
    if(w&&ok) w.style.display='none';
  } catch(e){ if(st) st.innerHTML='<span style="color:#dc2626">❌ '+e.message+'</span>'; }
}

var loginTab='login';
function signInWithGoogle() {
  if(!fbAuth) {
    showAuthError('Firebase niet verbonden. Stel Firebase in via ⚙️');
    // Open config panel
    var p = document.getElementById('fb-config-panel');
    if(p) p.style.display = 'block';
    return;
  }

  var btn = document.getElementById('google-btn');
  if(btn) { btn.textContent = '⏳ Bezig...'; btn.disabled = true; }

  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  fbAuth.signInWithPopup(provider)
    .then(function(result) {
      fbUser = result.user;
      var isNew = result.additionalUserInfo && result.additionalUserInfo.isNewUser;

      if(isNew) {
        // First time: show name setup step
        showNameSetupStep(fbUser);
      } else {
        // Existing user: load family and go
        loadUserFamily()
          .then(onLoggedIn)
          .catch(function() {
            // User exists in Auth but no family data yet → show setup
            showNameSetupStep(fbUser);
          });
      }
    })
    .catch(function(e) {
      if(btn) { btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Inloggen met Google'; btn.disabled = false; }
      showAuthError(translateFbError(e)+' ['+e.code+']');
    });
}

function showNameSetupStep(user) {
  // Nieuwe logindesign: vul Google naam alvast in het naam-veld
  var displayName = user.displayName || '';
  var firstName = displayName.split(' ')[0] || '';
  
  // Sla avatar op uit Google
  if(user.photoURL) {
    localStorage.setItem('familyapp-current-user-avatar-v1', user.photoURL);
  }
  
  // Vul naam alvast in als die nog leeg is
  var nameInput = document.getElementById('login-myname');
  if(nameInput && !nameInput.value && firstName) {
    nameInput.value = firstName;
    nameInput.style.borderColor = 'rgba(99,211,113,.6)';
  }

  // Toon een bevestiging
  var err = document.getElementById('login-error');
  if(err) {
    err.style.color = '#63d371';
    err.textContent = '✅ Ingelogd als ' + (displayName || user.email) + ' — vul namen in en start!';
  }

  // Als namen al bekend zijn direct doorgaan
  var savedName = localStorage.getItem('familyapp-profile-name-v1');
  var savedPartner = localStorage.getItem('familyapp-partner-name-v1');
  if(savedName && savedPartner) {
    onLoggedIn();
  }
}


function finishGoogleSetup() {
  var name    = (document.getElementById('step2-name')||{}).value||'';
  var partner = (document.getElementById('step2-partner')||{}).value||'';
  var errEl   = document.getElementById('step2-error');

  if(!name.trim()) {
    if(errEl) { errEl.textContent='Vul je naam in'; errEl.style.display='block'; }
    return;
  }
  name = name.trim();
  partner = partner.trim() || 'Partner';

  // Update Firebase Auth profile
  fbUser.updateProfile({displayName: name}).catch(function(){});

  // Create family in database
  setupNewFamily(name, partner).then(onLoggedIn).catch(function(e) {
    if(errEl) { errEl.textContent='Fout: '+e.message; errEl.style.display='block'; }
  });
}


function submitAuth() {
  var email=(document.getElementById('auth-email')||{}).value||'';
  var pass =(document.getElementById('auth-password')||{}).value||'';
  var btn  =document.getElementById('auth-submit-btn');
  if(!email||!pass){showAuthError('Vul e-mail en wachtwoord in');return;}
  if(!fbAuth){showAuthError('Firebase niet verbonden. Stel Firebase in of gebruik offline modus.');return;}
  btn.textContent='⏳...'; btn.disabled=true;
  if(loginTab==='register') {
    var name=(document.getElementById('auth-name')||{}).value||'';
    var partner=(document.getElementById('auth-partner')||{}).value||'Partner';
    if(!name){showAuthError('Vul je naam in');btn.disabled=false;btn.textContent='Account aanmaken';return;}
    fbAuth.createUserWithEmailAndPassword(email,pass)
      .then(function(c){fbUser=c.user;return c.user.updateProfile({displayName:name});})
      .then(function(){return setupNewFamily(name,partner);})
      .then(onLoggedIn)
      .catch(function(e){showAuthError(translateFbError(e));btn.disabled=false;btn.textContent='Account aanmaken';});
  } else {
    fbAuth.signInWithEmailAndPassword(email,pass)
      .then(function(c){fbUser=c.user;return loadUserFamily();})
      .then(onLoggedIn)
      .catch(function(e){showAuthError(translateFbError(e));btn.disabled=false;btn.textContent='Inloggen';});
  }
}

function showAuthError(msg){var e=document.getElementById('auth-error');if(e){e.textContent=msg;e.style.display='block';}}
function translateFbError(e){
  return({'auth/user-not-found':'Geen account met dit e-mailadres','auth/wrong-password':'Wachtwoord onjuist',
    'auth/email-already-in-use':'E-mail al in gebruik','auth/weak-password':'Min. 6 tekens',
    'auth/invalid-email':'Ongeldig e-mailadres','auth/network-request-failed':'Geen internet'}[e.code]||e.message);
}

function useOfflineMode(){
  offlineMode=true;
  var n=localStorage.getItem('familie_offline_name');
  if(n){myName=n;myInitials=n.substring(0,2).toUpperCase();}
  hideLoginScreen();
}

function setupNewFamily(name,partner){
  var uid=fbUser.uid; fbFamilyId=uid;
  myName=name; partnerName=partner; myInitials=name.substring(0,2).toUpperCase();
  return fbDb.ref('families/'+uid).set({
    members:{},tasks:{},shop:{},cal:{},feed:{},trans:{},savingsGoals:{},extraIncome:{},vasteLasten:{},recurData:{}
  }).then(function(){
    return fbDb.ref('users/'+uid).set({familyId:uid,name:name,partner:partner});
  }).then(function(){
    return fbDb.ref('families/'+uid+'/members/'+uid).set({name:name,color:'#2d5a27',partner:partner,xp:0,joined:Date.now()});
  });
}

function loadUserFamily(){
  var uid=fbUser.uid;
  return fbDb.ref('users/'+uid).once('value').then(function(snap){
    var d=snap.val();
    if(!d||!d.familyId) throw new Error('Geen gezin gevonden');
    fbFamilyId=d.familyId;
    myName=d.name||fbUser.displayName||'Gebruiker';
    partnerName=d.partner||'Partner';
    myInitials=myName.substring(0,2).toUpperCase();
  });
}

function onLoggedIn(){
  hideLoginScreen();
  if(typeof initApp === 'function') initApp();
  startFirebaseSync();
  setupPushNotifications();
  showToast('👋 Welkom '+myName+'!');
}

function hideLoginScreen(){
  // Verwijder de CSS die alles verbergt
  var preloginCss = document.getElementById('prelogin-css');
  if(preloginCss) preloginCss.remove();
  // Verberg login scherm
  var ls = document.getElementById('login-screen');
  if(ls) ls.style.display = 'none';
  // Render de app
  renderNav();
  renderHome();
  renderNotifs();
  updateHomeXP();
  setTimeout(function(){ checkAchievements(); checkDailyBonus(); }, 400);
}


var _fbSyncActive=false;
function startFirebaseSync(){
  if(!fbDb||!fbFamilyId||offlineMode||_fbSyncActive) return;
  _fbSyncActive=true;
  var ref=fbDb.ref('families/'+fbFamilyId);
  ref.on('value',function(snap){
    var data=snap.val(); if(!data) return;
    // Only overwrite local data if Firebase has actual content (not empty)
    if(data.tasks        && objToArr(data.tasks).length)        taskData     =objToArr(data.tasks);
    if(data.shop         && objToArr(data.shop).length)         shopData     =objToArr(data.shop);
    if(data.cal          && objToArr(data.cal).length)          calData      =objToArr(data.cal);
    if(data.feed         && objToArr(data.feed).length)         feedData     =objToArr(data.feed);
    if(data.trans        && objToArr(data.trans).length)        transData    =objToArr(data.trans);
    if(data.savingsGoals && objToArr(data.savingsGoals).length) savingsGoals =objToArr(data.savingsGoals);
    if(data.extraIncome  && objToArr(data.extraIncome).length)  extraIncome  =objToArr(data.extraIncome);
    if(data.vasteLasten  && objToArr(data.vasteLasten).length)  vasteLasten  =objToArr(data.vasteLasten);
    if(data.recurData    && objToArr(data.recurData).length)    recurData    =objToArr(data.recurData);

    if(data.members) Object.values(data.members).forEach(function(m){
      if(m.name!==myName){partnerName=m.name;partnerXPStore=m.xp||0;}
      else myXP=m.xp||myXP;
    });
    _renderScreen(_currentScreen);
    updateHomeXP();
  });
  // Listen for partner push messages
  fbDb.ref('families/'+fbFamilyId+'/push').on('child_added',function(snap){
    var n=snap.val();
    if(n&&n.to===myName&&!n.seen){showPushBanner(n);snap.ref.update({seen:true});}
  });
}

function objToArr(obj){if(Array.isArray(obj))return obj;if(!obj)return[];return Object.values(obj);}
function arrToObj(arr){var o={};(arr||[]).forEach(function(item,i){o[(item.id!==undefined?'id_'+item.id:'i_'+i)]=item;});return o;}

var _syncTimer=null;
function syncToFirebase(){
  if(!fbDb||!fbFamilyId||offlineMode) return;
  clearTimeout(_syncTimer);
  _syncTimer=setTimeout(function(){
    var uid=fbUser?fbUser.uid:'anon';
    fbDb.ref('families/'+fbFamilyId).update({
      tasks:arrToObj(taskData),shop:arrToObj(shopData),cal:arrToObj(calData),
      feed:arrToObj(feedData),trans:arrToObj(transData),savingsGoals:arrToObj(savingsGoals),
      extraIncome:arrToObj(extraIncome),vasteLasten:arrToObj(vasteLasten),recurData:arrToObj(recurData)
    });
    fbDb.ref('families/'+fbFamilyId+'/members/'+uid).update({xp:myXP,name:myName,lastSeen:Date.now()});
  },800);
}

function sendPushToPartner(title,body,icon){
  if(!fbDb||!fbFamilyId||offlineMode) return;
  fbDb.ref('families/'+fbFamilyId+'/push').push({
    to:partnerName,from:myName,title:title,body:body,icon:icon||'🔔',time:Date.now(),seen:false
  });
}

function showPushBanner(n){
  var el=document.createElement('div');
  el.style.cssText='position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:400;'
    +'background:var(--c-surface);border-radius:14px;padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,.2);'
    +'display:flex;align-items:center;gap:10px;min-width:240px;max-width:90%;'
    +'animation:achSlideIn .3s ease;cursor:pointer;border-left:4px solid var(--c-primary)';
  el.innerHTML='<div style="font-size:22px">'+(n.icon||'🔔')+'</div>'
    +'<div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--c-text)">'+n.title+'</div>'
    +'<div style="font-size:11px;color:var(--c-text2)">'+n.body+'</div></div>'
    +'<div style="font-size:10px;color:var(--c-text3)">'+n.from+'</div>';
  el.onclick=function(){el.remove();};
  document.body.appendChild(el);
  setTimeout(function(){if(el.parentNode){el.style.animation='achSlideOut .3s ease forwards';setTimeout(function(){el.remove();},300);}},5000);
  addNotif(n.icon||'🔔','#ede9fe',n.title,n.body);
}

function setupPushNotifications(){
  if(!fbMsg) return;
  try {
    Notification.requestPermission().then(function(p){
      if(p!=='granted') return;
      fbMsg.getToken().then(function(t){
        if(t&&fbDb&&fbFamilyId&&fbUser) fbDb.ref('families/'+fbFamilyId+'/fcmTokens/'+fbUser.uid).set({token:t,name:myName});
      }).catch(function(){});
    });
  } catch(e){}
}

// Hook sync into key actions
var _oadXP=awardXP;
awardXP=function(a,r){_oadXP(a,r);syncToFirebase();};

var _oanotif=addNotif;
addNotif=function(icon,bg,title,body){
  _oanotif(icon,bg,title,body);
  sendPushToPartner(title,body,icon);
  syncToFirebase();
};

function logoutUser(){ document.body.classList.remove('logged-in');
  if(fbAuth) fbAuth.signOut().catch(function(){});
  offlineMode=false; fbUser=null; _fbSyncActive=false;
  var ls=document.getElementById('login-screen');
  if(ls){ls.style.display='flex';ls.style.animation='fadeIn .3s ease';}
}

// Always init Firebase with hardcoded config
if(typeof firebase !== 'undefined') {
  var _fbOk = initFirebase(HARDCODED_FB_CONFIG);
  if(_fbOk) {
    firebase.auth().onAuthStateChanged(function(user){
      if(user){
        fbUser=user;
        loadUserFamily().then(onLoggedIn).catch(function(){
          showNameSetupStep(user);
          var ls=document.getElementById('login-screen');
          if(ls) ls.style.display='flex';
        });
      } else {
        // Not logged in — make sure login screen is visible
        var ls=document.getElementById('login-screen');
        if(ls) ls.style.display='flex';
      }
    });
  }
}


// App init runs ONLY after login
function initApp() {
  renderNav();
  attachNavDelegation();
  renderHome();
  renderFeed();
  renderFinance();
  renderNotifs();
  updateHomeXP();
  setTimeout(function(){
    checkAchievements();
    checkDailyBonus();
  }, 400);
}



