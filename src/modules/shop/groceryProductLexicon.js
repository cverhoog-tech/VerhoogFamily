'use strict';
// ============================================================
// GROCERY PRODUCT LEXICON v1.0.0
// Canonical product-family matcher shared by classifier + icon resolver.
// Handles compound names, common Dutch spelling variants and legacy recipe
// ingredient labels without coupling recognition rules to UI components.
// ============================================================
(function(){
  if(window.FamilyAppProductLexicon)return;
  var VERSION='1.0.0';

  function normalize(value){
    return String(value||'')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/\([^)]*\)/g,' ')
      .replace(/^[\s\-–—]*\d+(?:[.,]\d+)?\s*(?:mg|g|kg|ml|l|liter|gram|kilo|st|stuks?|teentjes?|pakken?|zakken?|flessen?|rollen?|bakken?)?\s*/,'')
      .replace(/[^a-z0-9\s-]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function row(category,iconKey,legacyIcon,qty,pattern){
    return Object.freeze({category:category,iconKey:iconKey,legacyIcon:legacyIcon,qty:qty,pattern:pattern});
  }

  // Ordered from most specific product families to broad fallbacks.
  // Compound-friendly expressions intentionally match stems (e.g.
  // aardappelpartjes, kippendijenfilet) instead of exact whole words only.
  var RULES=Object.freeze([
    row('Groente','utilityBroccoli','🥦','500 g',/\b(?:broccoli|brocolli|brocoli|bloemkool)(?:[a-z]*)?\b/),
    row('Groente','utilityPotato','🥔','1 kg',/\b(?:aardappel[a-z]*|krieltj[a-z]*|krieltjes|pieper[a-z]*)\b/),
    row('Groente','utilityVegetable','🌱','500 g',/\b(?:kousenband|boontj[a-z]*|bonen|sperzieboon[a-z]*|haricots?\s*verts?|peultj[a-z]*|snijboon[a-z]*)\b/),
    row('Groente','utilityVegetable','🧅','500 g',/\b(?:ui|uien|rode\s+ui|sjalot[a-z]*)\b/),
    row('Groente','utilityVegetable','🧄','1 st',/\b(?:knoflook|knoflookteen[a-z]*|teentj[a-z]*\s+knoflook)\b/),
    row('Groente','utilityTomato','🍅','500 g',/\b(?:tomaat[a-z]*|cherrytomaat[a-z]*)\b/),
    row('Groente','utilityVegetable','🥕','500 g',/\b(?:wortel[a-z]*|winterpeen|peen)\b/),
    row('Groente','utilityVegetable','🥒','1 st',/\b(?:komkommer[a-z]*|courgette[a-z]*|aubergine[a-z]*)\b/),
    row('Groente','utilityVegetable','🫑','3 st',/\bpaprika[a-z]*\b/),
    row('Groente','utilityVegetable','🥬','1 st',/\b(?:sla|spinazie|andijvie|boerenkool|spruitj[a-z]*|prei)\b/),
    row('Groente','utilityVegetable','🍄','250 g',/\b(?:champignon[a-z]*|paddenstoel[a-z]*)\b/),

    row('Vlees','utilityChicken','🍗','500 g',/\b(?:kip[a-z]*|kippen[a-z]*|drumstick[a-z]*|kipfilet[a-z]*|kippendij[a-z]*)\b/),
    row('Vlees','utilityMeat','🥩','500 g',/\b(?:gehakt|rund[a-z]*|biefstuk[a-z]*|steak[a-z]*)\b/),
    row('Vlees','utilityMeat','🥓','250 g',/\b(?:spek|bacon)\b/),
    row('Vis','utilityFish','🐟','500 g',/\b(?:vis|zalm[a-z]*|kabeljauw[a-z]*|tonijn[a-z]*|pangasius[a-z]*)\b/),

    row('Zuivel','utilityDairy','🥛','1 l',/\b(?:melk|karnemelk|chocolademelk|havermelk|amandelmelk|sojamelk)\b/),
    row('Zuivel','utilityCheese','🧀','200 g',/\b(?:kaas|cheddar|mozzarella|parmezaan|feta)\b/),
    row('Zuivel','utilityEggs','🥚','6 st',/\b(?:ei|eieren)\b/),
    row('Zuivel','utilityDairy','🥣','500 g',/\b(?:yoghurt|kwark|skyr|vla)\b/),
    row('Zuivel','utilityDairy','🥛','250 ml',/\b(?:room|slagroom|kookroom|creme\s+fraiche)\b/),

    row('Fruit','utilityBanana','🍌','6 st',/\bbanaan[a-z]*\b/),
    row('Fruit','utilityBerries','🍓','400 g',/\b(?:aardbei[a-z]*|bosbes[a-z]*|blauwe\s+bessen?|druif[a-z]*)\b/),
    row('Fruit','utilityCitrus','🍊','1 kg',/\b(?:sinaasappel[a-z]*|mandarijn[a-z]*|citroen[a-z]*|limoen[a-z]*)\b/),
    row('Fruit','utilityFruit','🍎','1 kg',/\b(?:appel[a-z]*|peer|peren|kiwi[a-z]*|meloen[a-z]*)\b/),

    row('Voorraad','utilityPantry','🫒','500 ml',/\b(?:zonnebloemolie|olijfolie|bakolie|frituurolie|olie)\b/),
    row('Voorraad','utilityPasta','🍝','500 g',/\b(?:pasta|spaghetti|macaroni|penne|fusilli|tagliatelle)\b/),
    row('Voorraad','utilityRice','🍚','1 kg',/\b(?:rijst|basmati|jasmijnrijst)\b/),
    row('Voorraad','utilityPantry','🥫','1 st',/\b(?:kidneybonen|kikkererwten|linzen|tomatenblokjes|blik)\b/),

    row('Elektronica','utilityLaptop','💻','1 st',/\b(?:laptop|macbook|chromebook|notebook|computer|pc)\b/),
    row('Elektronica','utilityPhone','📱','1 st',/\b(?:telefoon|smartphone|iphone|android\s+telefoon)\b/),
    row('Elektronica','utilityCharger','🔌','1 st',/\b(?:oplader|adapter|charger|stekker)\b/),
    row('Elektronica','utilityCable','🔌','1 st',/\b(?:usb(?:-c)?\s*kabel|lightning\s*kabel|hdmi\s*kabel|kabel)\b/),
    row('Elektronica','utilityBattery','🔋','1 st',/\b(?:powerbank|batterij[a-z]*|accu)\b/),

    row('Wonen','utilitySofa','🛋️','1 st',/\b(?:bankstel|bank|sofa)\b/),
    row('Wonen','utilityChair','🪑','1 st',/\b(?:bureaustoel|stoel[a-z]*)\b/),
    row('Wonen','utilityBed','🛏️','1 st',/\b(?:matras|bed)\b/),

    row('Reizen','utilityPlane','✈️','1 st',/\b(?:vliegtuig|vlucht|vliegticket|boarding\s+pass)\b/),
    row('Reizen','utilityPassport','🛂','1 st',/\b(?:paspoort|reisdocument)\b/),
    row('Reizen','utilitySuitcase','🧳','1 st',/\b(?:koffer|trolley|bagage)\b/),
    row('Reizen','utilityHotel','🏨','1 st',/\b(?:hotel|overnachting|accommodatie)\b/),
    row('Reizen','utilityFuel','⛽','1 st',/\b(?:benzine|diesel|brandstof|tanken)\b/)
  ]);

  function match(name){
    var text=normalize(name);
    if(!text)return null;
    for(var i=0;i<RULES.length;i++){
      if(RULES[i].pattern.test(text)){
        return Object.freeze({category:RULES[i].category,iconKey:RULES[i].iconKey,legacyIcon:RULES[i].legacyIcon,qty:RULES[i].qty,confidence:1,normalized:text});
      }
    }
    return null;
  }

  window.FamilyAppProductLexicon={version:VERSION,normalize:normalize,match:match,rules:RULES};
})();
