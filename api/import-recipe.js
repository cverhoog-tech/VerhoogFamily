'use strict';
// ============================================================
// FAMILYAPP RECIPE IMPORT API v0.277
// Free/professional URL import using schema.org Recipe JSON-LD.
// Designed for Vercel Serverless Functions.
// ============================================================

function send(res, status, body){
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function isHttpUrl(value){
  try {
    var u = new URL(String(value || ''));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch(e){ return false; }
}

function stripHtml(value){
  return String(value == null ? '' : value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function asText(value){
  if(value == null) return '';
  if(typeof value === 'string' || typeof value === 'number') return stripHtml(value);
  if(Array.isArray(value)) return value.map(asText).filter(Boolean).join(' ');
  if(typeof value === 'object') return asText(value.name || value.text || value['@value'] || value.description || '');
  return '';
}

function asArray(value){
  if(value == null) return [];
  if(Array.isArray(value)) return value;
  return [value];
}

function firstImage(value){
  if(!value) return '';
  if(typeof value === 'string') return value;
  if(Array.isArray(value)){
    for(var i = 0; i < value.length; i++){
      var found = firstImage(value[i]);
      if(found) return found;
    }
    return '';
  }
  if(typeof value === 'object') return value.url || value.contentUrl || '';
  return '';
}

function parseDurationToMinutes(value){
  value = String(value || '').trim();
  if(!value) return 30;
  // ISO-8601 duration e.g. PT1H20M, PT45M
  var iso = value.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i);
  if(iso && (iso[1] || iso[2])) return (parseInt(iso[1] || '0', 10) * 60) + parseInt(iso[2] || '0', 10);
  var h = value.match(/(\d+)\s*(uur|hour|hr|h)/i);
  var m = value.match(/(\d+)\s*(minuut|minuten|minute|minutes|min|m)/i);
  var total = (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  return total || 30;
}

function parseYield(value){
  var text = asText(value);
  var m = text.match(/\d+/);
  return m ? parseInt(m[0], 10) : 4;
}

function titleFromUrl(url){
  try {
    var u = new URL(url);
    var part = decodeURIComponent((u.pathname.split('/').filter(Boolean).pop() || u.hostname).replace(/[-_]+/g, ' '));
    return part.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, ' ').trim() || 'Geïmporteerd recept';
  } catch(e){ return 'Geïmporteerd recept'; }
}

function extractJsonLdBlocks(html){
  var blocks = [];
  var re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  var match;
  while((match = re.exec(html))){
    var raw = String(match[1] || '').trim();
    if(!raw) continue;
    raw = raw.replace(/<!--|-->/g, '').trim();
    try { blocks.push(JSON.parse(raw)); } catch(e) {}
  }
  return blocks;
}

function typeMatchesRecipe(node){
  var type = node && node['@type'];
  if(!type) return false;
  if(Array.isArray(type)) return type.map(function(x){ return String(x).toLowerCase(); }).indexOf('recipe') >= 0;
  return String(type).toLowerCase() === 'recipe';
}

function findRecipeNode(node){
  if(!node) return null;
  if(Array.isArray(node)){
    for(var i = 0; i < node.length; i++){
      var found = findRecipeNode(node[i]);
      if(found) return found;
    }
    return null;
  }
  if(typeof node !== 'object') return null;
  if(typeMatchesRecipe(node)) return node;

  var graph = node['@graph'];
  if(graph){
    var fromGraph = findRecipeNode(graph);
    if(fromGraph) return fromGraph;
  }

  var main = node.mainEntity || node.mainEntityOfPage;
  if(main){
    var fromMain = findRecipeNode(main);
    if(fromMain) return fromMain;
  }

  return null;
}

function stepsFromInstructions(value){
  var steps = [];
  asArray(value).forEach(function(item){
    if(!item) return;
    if(typeof item === 'string'){
      var txt = stripHtml(item);
      if(txt) steps.push(txt);
      return;
    }
    if(Array.isArray(item)){
      steps = steps.concat(stepsFromInstructions(item));
      return;
    }
    if(typeof item === 'object'){
      if(item.itemListElement) {
        steps = steps.concat(stepsFromInstructions(item.itemListElement));
        return;
      }
      var txt = asText(item.text || item.name || item.description);
      if(txt) steps.push(txt);
    }
  });
  return steps.filter(Boolean);
}

function recipeToFamilyFormat(recipe, sourceUrl){
  var ingredients = asArray(recipe.recipeIngredient || recipe.ingredients)
    .map(asText)
    .filter(Boolean);

  var steps = stepsFromInstructions(recipe.recipeInstructions || recipe.instructions);

  var totalTime = recipe.totalTime || recipe.cookTime || recipe.prepTime || '';
  var cuisine = asText(recipe.recipeCuisine) || asText(recipe.cuisine) || 'Onbekend';
  var category = asText(recipe.recipeCategory) || '';

  return {
    name: asText(recipe.name) || titleFromUrl(sourceUrl),
    cat: category && /dessert|cake|taart|gebak|baking|bak/i.test(category) ? 'Dessert' : 'Diner',
    cuisine: cuisine,
    persons: parseYield(recipe.recipeYield || recipe.yield),
    time: parseDurationToMinutes(totalTime),
    photo: firstImage(recipe.image) || '',
    ingredients: ingredients.length ? ingredients : ['Controleer ingrediënten via bronlink'],
    steps: steps.length ? steps : ['Controleer bereidingswijze via bronlink'],
    notes: 'Geïmporteerd via structured recipe data. Controleer het recept vóór gebruik.',
    sourceUrl: sourceUrl,
    importSource: 'schema-jsonld'
  };
}

function fallbackRecipe(url, reason){
  return {
    name: titleFromUrl(url),
    cat: 'Diner',
    cuisine: 'Onbekend',
    persons: 4,
    time: 30,
    photo: '',
    ingredients: ['Controleer ingrediënten via de bronlink'],
    steps: ['Open de bronlink en vul de bereidingsstappen aan'],
    notes: 'Geen gestructureerde receptdata gevonden. Basisconcept gemaakt uit de link.',
    sourceUrl: url,
    importSource: 'fallback',
    warning: reason || 'Geen receptdata gevonden'
  };
}

module.exports = async function handler(req, res){
  if(req.method !== 'POST') return send(res, 405, { ok:false, error:'Method not allowed' });

  var body = req.body;
  if(typeof body === 'string'){
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }
  body = body || {};
  var url = String(body.url || '').trim();

  if(!isHttpUrl(url)) return send(res, 400, { ok:false, error:'Plak een geldige http(s) link.' });

  try {
    var response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 FamilyApp Recipe Importer',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if(!response.ok) return send(res, 200, { ok:true, recipe:fallbackRecipe(url, 'Pagina kon niet worden opgehaald') });

    var html = await response.text();
    var blocks = extractJsonLdBlocks(html);
    var node = null;
    for(var i = 0; i < blocks.length; i++){
      node = findRecipeNode(blocks[i]);
      if(node) break;
    }

    if(!node) return send(res, 200, { ok:true, recipe:fallbackRecipe(url, 'Geen schema.org Recipe data gevonden') });

    return send(res, 200, { ok:true, recipe: recipeToFamilyFormat(node, url) });
  } catch(err){
    return send(res, 200, { ok:true, recipe:fallbackRecipe(url, 'Import mislukt: ' + (err && err.message ? err.message : 'onbekende fout')) });
  }
};
