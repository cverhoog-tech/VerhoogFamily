'use strict';
// ============================================================
// GROCERY INPUT PARSER v1.0.0
// Single responsibility: split raw free-text grocery input into
// { productName, amount, unit, explicitAmount, explicitUnit }.
// Does NOT know about categories/icons — that is groceryProductClassifier.js.
// An explicitly typed amount/unit always takes priority over any default
// the classifier would otherwise suggest; callers must respect the
// explicitAmount/explicitUnit flags rather than overwriting them.
// ============================================================
(function(){
  var VERSION = '1.0.0';

  // Canonical unit set required by the spec: mg, g, kg, ml, l, st, pak, zak, fles, rol, bak.
  var UNIT_ALIASES = {
    mg: 'mg', milligram: 'mg', milligrams: 'mg', milligrammen: 'mg',
    g: 'g', gr: 'g', gram: 'g', grammen: 'g',
    kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilogrammen: 'kg',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml',
    l: 'l', ltr: 'l', liter: 'l', liters: 'l',
    st: 'st', stuk: 'st', stuks: 'st',
    pak: 'pak', pakje: 'pak', pakjes: 'pak', pakken: 'pak',
    zak: 'zak', zakje: 'zak', zakjes: 'zak', zakken: 'zak',
    fles: 'fles', flesje: 'fles', flesjes: 'fles', flessen: 'fles',
    rol: 'rol', rollen: 'rol',
    bak: 'bak', bakje: 'bak', bakjes: 'bak', bakken: 'bak'
  };

  var CANONICAL_UNITS = ['mg', 'g', 'kg', 'ml', 'l', 'st', 'pak', 'zak', 'fles', 'rol', 'bak'];

  function normalizeUnit(token){
    if(!token) return null;
    var key = String(token).toLowerCase();
    return UNIT_ALIASES[key] || null;
  }

  // Accepts "2 kg aardappelen", "500g gehakt", "1,5 liter melk", "1.5 l water",
  // "250 ml room", "500 mg product", "6 eieren", "3 flessen cola",
  // "2 pakken pasta", "1 zak chips", or plain "melk" with no quantity at all.
  function parse(raw){
    var text = String(raw == null ? '' : raw).trim();
    if(!text){
      return { productName: '', amount: null, unit: null, explicitAmount: false, explicitUnit: false };
    }

    var match = text.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Zà-ÿ]+)?\s*(.*)$/);
    if(!match || !match[1]){
      return { productName: text, amount: null, unit: null, explicitAmount: false, explicitUnit: false };
    }

    var amount = parseFloat(match[1].replace(',', '.'));
    var unitToken = match[2] || '';
    var rest = (match[3] || '').trim();
    var canonicalUnit = normalizeUnit(unitToken);

    if(canonicalUnit){
      var productName = rest || unitToken;
      return { productName: productName, amount: amount, unit: canonicalUnit, explicitAmount: true, explicitUnit: true };
    }

    // The token right after the number isn't a recognised unit word, so it's
    // actually the start of the product name (e.g. "6 eieren").
    var productNameNoUnit = (unitToken ? (unitToken + ' ' + rest) : rest).trim() || text;
    return { productName: productNameNoUnit, amount: amount, unit: null, explicitAmount: true, explicitUnit: false };
  }

  window.GroceryInputParser = {
    version: VERSION,
    canonicalUnits: CANONICAL_UNITS.slice(),
    normalizeUnit: normalizeUnit,
    parse: parse
  };
})();
