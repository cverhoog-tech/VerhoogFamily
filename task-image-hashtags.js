'use strict';
// ============================================================
// TASK IMAGE MATCHER v2.0.0
// Pure task-image classification/presentation helper.
// Task creation and persistence are owned by the canonical task modules.
// ============================================================
(function(){
  if(window.FamilyTaskImages)return;

  var VERSION='2.0.0';
  var IMAGE_TAGS={
    bathroom:{hashtags:['#badkamer','#douche','#wastafel','#spiegel','#bad','#bathroom'],keywords:['badkamer','douche','wastafel','spiegel','bad schoon','tegels','putje'],url:'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    livingroom:{hashtags:['#woonkamer','#bank','#salontafel','#tv','#livingroom'],keywords:['woonkamer','huiskamer','bank','salontafel','tv meubel','kleed','kussens'],url:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    toilet:{hashtags:['#wc','#toilet'],keywords:['wc','toilet','closet','bril schoon','toiletrol'],url:'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    bedroom:{hashtags:['#slaapkamer','#bed','#opmaken'],keywords:['slaapkamer','bed','dekbed','kussen','nachtkast','bed opmaken'],url:'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    attic:{hashtags:['#zolder','#opslag','#opruimen'],keywords:['zolder','opslag','dozen','berging','spullen uitzoeken'],url:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    vacuum:{hashtags:['#stofzuigen','#vloer','#schoonmaken'],keywords:['stofzuig','stofzuigen','vloer zuigen','kleed zuigen','tapijt'],url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    windows:{hashtags:['#ramen','#ramenzemen','#glas'],keywords:['ramen','ramenzemen','glas','raam','trekker','vensterbank'],url:'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    kidsroom:{hashtags:['#kinderkamer','#speelgoed','#kinderen'],keywords:['kinderkamer','speelgoed','knuffels','lego','kind','schooltas'],url:'https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    car:{hashtags:['#auto','#autowassen','#interieur'],keywords:['auto','autowassen','wassen auto','interieur','stofzuigen auto','tank','banden'],url:'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    familycar:{hashtags:['#gezin','#autorijden','#familycar'],keywords:['gezin auto','familie auto','kinderen auto','rit','wegbrengen','ophalen'],url:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    kitchen:{hashtags:['#keuken','#koken','#aanrecht'],keywords:['keuken','aanrecht','fornuis','oven','koelkast','koken'],url:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    dining:{hashtags:['#eettafel','#tafel','#eten'],keywords:['eettafel','tafel dekken','tafel afruimen','eten','diner'],url:'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    laundry:{hashtags:['#was','#wassen','#wasmachine'],keywords:['was','wassen','wasmachine','droger','wasmand','vouwen','strijken'],url:'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    dishes:{hashtags:['#afwas','#vaatwasser','#servies'],keywords:['afwas','vaat','vaatwasser','servies','borden','glazen','bestek'],url:'https://images.unsplash.com/photo-1607006483224-96f48b386c24?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    groceries:{hashtags:['#boodschappen','#voorraad','#winkel'],keywords:['boodschap','boodschappen','supermarkt','voorraad','winkel','lunchbox'],url:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    trash:{hashtags:['#afval','#vuilnis','#container'],keywords:['afval','vuilnis','container','prullenbak','papierbak','glasbak'],url:'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    closet:{hashtags:['#kast','#kleding','#opruimen'],keywords:['kast','kleding','kleren','schoenen','garderobe','opruimen kast'],url:'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    garden:{hashtags:['#tuin','#planten','#watergeven'],keywords:['tuin','planten','water geven','onkruid','bloemen','gras','gieter'],url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    pet:{hashtags:['#huisdier','#hond','#kat'],keywords:['hond','kat','huisdier','voer','uitlaten','mand','dierenarts'],url:'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    work:{hashtags:['#werkplek','#administratie','#planning'],keywords:['werkplek','bureau','administratie','planning','mail','documenten'],url:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=90&fm=webp'}
  };

  function norm(s){return String(s||'').toLowerCase();}
  function score(rule,text){var total=0;rule.hashtags.forEach(function(h){if(text.indexOf(h)>-1)total+=5;});rule.keywords.forEach(function(k){if(text.indexOf(k)>-1)total+=2;});return total;}
  function matchTaskImage(title,description){var text=norm(title+' '+(description||'')),best='work',bestScore=0;Object.keys(IMAGE_TAGS).forEach(function(key){var s=score(IMAGE_TAGS[key],text);if(s>bestScore){bestScore=s;best=key;}});return IMAGE_TAGS[best];}
  function decorateLegacyCards(){
    document.querySelectorAll('.fqCard').forEach(function(card){var title=card.querySelector('.fqTitle'),desc=card.querySelector('.fqDesc'),box=card.querySelector('.fqImg'),img=matchTaskImage(title&&title.textContent,desc&&desc.textContent);if(box&&img)box.style.backgroundImage='url('+img.url+')';});
    var hero=document.querySelector('.fqHero'),modalTitle=document.querySelector('.fqHero h2'),modalText=document.querySelector('.fqContent p');
    if(hero&&modalTitle){var img=matchTaskImage(modalTitle.textContent,modalText&&modalText.textContent);if(img)hero.style.backgroundImage='url('+img.url+')';}
  }
  function refresh(){decorateLegacyCards();}

  window.FamilyTaskImages={version:VERSION,tags:IMAGE_TAGS,match:matchTaskImage,refresh:refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
  window.addEventListener('familyapp:tasks-updated',refresh);
  window.addEventListener('familyapp:task-detail-opened',refresh);
})();
