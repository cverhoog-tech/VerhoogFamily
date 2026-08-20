'use strict';
// ============================================================
// GROCERY PRODUCT CLASSIFIER v1.2.0
// Classification uses FamilyAppProductLexicon first, then broad category
// fallbacks. UI/icon presentation stays outside this module.
// ============================================================
(function(){
  var VERSION='1.2.0';
  function normalize(value){
    var lex=window.FamilyAppProductLexicon;
    if(lex&&typeof lex.normalize==='function')return lex.normalize(value);
    return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  }
  function result(category,icon,qty,confidence,matched){return{category:category,icon:icon,qty:qty,confidence:confidence,matched:matched||null};}
  function classify(name){
    var lex=window.FamilyAppProductLexicon;
    var hit=lex&&typeof lex.match==='function'?lex.match(name):null;
    if(hit)return result(hit.category,hit.legacyIcon,hit.qty,hit.confidence,'lexicon');

    var text=normalize(name);
    if(!text)return result('Overig','📦','1 st',0,null);

    // Broad family fallbacks. These are deliberately category-level; exact
    // products belong in groceryProductLexicon.js so classifier and icon
    // resolver cannot drift apart.
    if(/\b(?:groente|salade|verspakket)\b/.test(text))return result('Groente','🌱','500 g',.35,'vegetable-family');
    if(/\b(?:fruit|vruchten)\b/.test(text))return result('Fruit','🍎','500 g',.35,'fruit-family');
    if(/\b(?:vlees|slager|burger)\b/.test(text))return result('Vlees','🥩','500 g',.35,'meat-family');
    if(/\b(?:vis|seafood)\b/.test(text))return result('Vis','🐟','500 g',.35,'fish-family');
    if(/\b(?:brood|bakker)\b/.test(text))return result('Brood','🍞','1 st',.35,'bread-family');
    if(/\b(?:zuivel|kaas|melkproduct)\b/.test(text))return result('Zuivel','🥛','1 st',.35,'dairy-family');
    if(/\b(?:sap|water|fris|drank)\b/.test(text))return result('Dranken','🥤','1 l',.35,'drink-family');
    if(/\b(?:olie|saus|poeder|meel|rijst|pasta|granen|kruiden|noten)\b/.test(text))return result('Voorraad','📦','500 g',.35,'pantry-family');
    if(/\b(?:schoonmaak|wasmiddel|afwas|papier|vuilnis)\b/.test(text))return result('Huishouden','🧴','1 st',.35,'household-family');
    if(/\b(?:shampoo|zeep|tand|deodorant|verzorging)\b/.test(text))return result('Verzorging','🧴','1 st',.35,'care-family');
    if(/\b(?:baby|luier)\b/.test(text))return result('Baby','👶','1 st',.35,'baby-family');
    if(/\b(?:hond|kat|huisdier)\b/.test(text))return result('Huisdieren','🐾','1 st',.35,'pet-family');
    if(/\b(?:usb|bluetooth|wifi|hdmi|elektrisch|electronisch|elektronisch|computer|telefoon)\b/.test(text))return result('Elektronica','📦','1 st',.3,'electronics-family');
    if(/\b(?:reis|vakantie|airport|luchthaven|station|hotel|ticket)\b/.test(text))return result('Reizen','🧳','1 st',.3,'travel-family');
    if(/\b(?:meubel|woon|interieur)\b/.test(text))return result('Wonen','🛋️','1 st',.3,'home-family');
    return result('Overig','📦','1 st',0,null);
  }
  function categories(){return['Zuivel','Brood','Ontbijt','Groente','Fruit','Vlees','Vis','Vega','Voorraad','Dranken','Snacks','Diepvries','Huishouden','Verzorging','Baby','Huisdieren','Elektronica','Wonen','Reizen','Overig'];}
  window.GroceryProductClassifier={version:VERSION,classify:classify,categories:categories,normalize:normalize};
})();
