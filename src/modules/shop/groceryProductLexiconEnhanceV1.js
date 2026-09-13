'use strict';
(function(){
  if(window.GroceryProductLexiconEnhanceV1)return;
  var base=window.FamilyAppProductLexicon;
  if(!base||typeof base.match!=='function')return;

  function row(category,iconKey,legacyIcon,qty,pattern){
    return Object.freeze({category:category,iconKey:iconKey,legacyIcon:legacyIcon||null,qty:qty,pattern:pattern});
  }

  // Higher-priority product families requested for the shopping UI.
  // Category ownership stays unchanged; only recognition/icon specificity improves.
  var RULES=Object.freeze([
    row('Diepvries','utilityFryer',null,'1 st',/\b(?:friet|patat|frikandel[a-z]*|kroket[a-z]*|bitterbal[a-z]*|kaassouffle[a-z]*|bamischijf[a-z]*|nasischijf[a-z]*|frituursnack[a-z]*)\b/),
    row('Voorraad','utilityFryer',null,'1 l',/\b(?:frituurolie|frituurvet)\b/),
    row('Diepvries','utilityFrozen','🧊','1 st',/\b(?:diepvries[a-z]*|bevroren|vriesproduct[a-z]*|vriespizza[a-z]*|diepvriespizza[a-z]*|diepvriesgroente[a-z]*|diepvriesfruit[a-z]*|ijsjes?|roomijs|sorbet)\b/),

    row('Voorraad','utilitySauce',null,'1 st',/\b(?:saus[a-z]*|ketchup|mayonaise|mayo|currysaus|knoflooksaus|chilisaus|barbecuesaus|bbq\s*saus|sojasaus|ketjap|sriracha|sambal|pesto|dressing)\b/),
    row('Voorraad','utilitySpices',null,'1 st',/\b(?:kruid[a-z]*|specerij[a-z]*|peper|zout|oregano|basilicum|tijm|rozemarijn|komijn|kurkuma|kerrie|curry\s*poeder|paprikapoeder|chilipoeder|cayenne|kaneel|nootmuskaat|laurier|bieslook|peterselie|dille)\b/),

    row('Zuivel','utilityDairy','🥛','1 st',/\b(?:melk|karnemelk|chocolademelk|yoghurt|kwark|skyr|vla|room|slagroom|kookroom|creme\s+fraiche|boter|roomboter)\b/),
    row('Vlees','utilityMeat','🥩','500 g',/\b(?:vlees|rund[a-z]*|varken[a-z]*|varkensvlees|gehakt|biefstuk[a-z]*|steak[a-z]*|schnitzel[a-z]*|shoarma|hamburger[a-z]*|burger[a-z]*|worst[a-z]*|slavink[a-z]*|speklap[a-z]*|bacon|spek)\b/),
    row('Vlees','utilityChicken','🍗','500 g',/\b(?:kip[a-z]*|kippen[a-z]*|kipfilet[a-z]*|kippendij[a-z]*|drumstick[a-z]*)\b/),

    row('Dranken','utilitySoda','🥤','1 l',/\b(?:cola|coca\s*cola|pepsi|fanta|sinas|sprite|7up|cassis|frisdrank[a-z]*|energy\s*drink|energydrink[a-z]*|red\s*bull)\b/),
    row('Dranken','utilityDrinks','🧃','1 l',/\b(?:sap|juice|appelsap|sinaasappelsap|multivitamine\s*sap|limonade|ranja|water|bronwater|mineraalwater|spa\s*(?:rood|blauw)?|drank[a-z]*)\b/),
    row('Dranken','utilityCoffee','☕','1 st',/\b(?:koffie|espresso|cappuccino|latte|koffiebonen)\b/),
    row('Dranken','utilityTea','🫖','1 st',/\b(?:thee|theezakjes?)\b/)
  ]);

  function normalize(value){return base.normalize?base.normalize(value):String(value||'').toLowerCase().trim();}
  function match(name){
    var text=normalize(name);
    if(text){
      for(var i=0;i<RULES.length;i++){
        if(RULES[i].pattern.test(text)){
          return Object.freeze({
            category:RULES[i].category,
            iconKey:RULES[i].iconKey,
            legacyIcon:RULES[i].legacyIcon,
            qty:RULES[i].qty,
            confidence:1,
            normalized:text,
            matched:'grocery-family-v1'
          });
        }
      }
    }
    return base.match(name);
  }

  window.FamilyAppProductLexicon={
    version:String(base.version||'')+'+families-v1',
    normalize:normalize,
    match:match,
    rules:Object.freeze(RULES.concat(Array.isArray(base.rules)?base.rules:[]))
  };
  window.GroceryProductLexiconEnhanceV1={version:'1.0.0',rules:RULES};
})();
