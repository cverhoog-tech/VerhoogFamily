'use strict';
// ============================================================
// RECEPTEN MODULE v1.0
// ============================================================
(function () {

  var SEEDS = [
    {name:'Lasagne',cat:'Diner',cuisine:'Italiaans',persons:4,time:60,emoji:'🍝',photo:'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',ingredients:['500g gehakt','2 uien','2 teentjes knoflook','1 blik tomaten','Lasagne platen','500ml béchamelsaus','100g geraspte kaas','Olijfolie, zout, peper'],steps:['Verwarm oven op 180°C.','Bak gehakt met ui en knoflook.','Voeg tomaten toe, 15 min sudderen.','Laag voor laag: lasagne, vleessaus, béchamel.','Afsluiten met kaas, 40 min bakken.'],notes:'Lekker de volgende dag ook!'},
    {name:'Shakshuka',cat:'Ontbijt',cuisine:'Midden-Oosten',persons:2,time:20,emoji:'🍳',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',ingredients:['4 eieren','1 blik tomaten','1 ui','1 paprika','Komijn, paprikapoeder','Feta optioneel'],steps:['Bak ui en paprika zacht.','Voeg tomaten en kruiden toe.','Maak kuiltjes en breek eieren erin.','Deksel op pan, 8-10 min.'],notes:'Lekker met knapperig brood'},
    {name:'Bananenbrood',cat:'Bakken',cuisine:'Internationaal',persons:8,time:65,emoji:'🍌',photo:'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',ingredients:['3 rijpe bananen','200g bloem','100g suiker','2 eieren','80g boter','1 tl bakpoeder','Snuf zout'],steps:['Verwarm oven op 175°C.','Prak bananen fijn.','Meng alle ingrediënten.','In broodvorm 55 min bakken.'],notes:''},
    {name:'Surinaamse roti met kip',cat:'Diner',cuisine:'Surinaams',persons:4,time:75,emoji:'🍛',photo:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',ingredients:['4 rotiplaten','600g kipdijfilet','600g aardappelen','400g kousenband','4 eieren','2 uien','3 teentjes knoflook','2 el masala','1 tl komijn','Olie, zout, peper'],steps:['Kook eieren hard.','Bak ui en knoflook glazig.','Voeg kip en masala toe.','Stoof aardappelen gaar.','Serveer met roti.'],notes:'Sambal apart voor kinderen.'},
    {name:'Pom met kip',cat:'Diner',cuisine:'Surinaams',persons:6,time:110,emoji:'🥘',photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',ingredients:['1kg pomtayer','700g kip','2 uien','3 teentjes knoflook','Sap van 1 sinaasappel','Sap van 1 citroen','2 el suiker','Olie, zout, peper'],steps:['Marineer kip.','Bak kip met ui.','Meng pomtayer met citrus.','Laag voor laag in ovenschaal.','Bak 90 min op 180°C.'],notes:'Lekker met rijst en zuurgoed.'},
    {name:'Saoto soep',cat:'Diner',cuisine:'Surinaams',persons:4,time:80,emoji:'🍲',photo:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',ingredients:['1 hele kip','2 liter water','1 ui','Laos, salam','Taugé','Gekookte eieren','Gebakken uitjes','Rijst','Selderij'],steps:['Trek bouillon van kip.','Pluk kip, breng op smaak.','Kook rijst en eieren.','Vul kommen en schenk bouillon erover.'],notes:'Sambal ketjap apart.'},
    {name:'Nasi goreng',cat:'Diner',cuisine:'Indonesisch',persons:4,time:35,emoji:'🍚',photo:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',ingredients:['500g koude rijst','3 eieren','250g kip','2 sjalotten','3 teentjes knoflook','2 el ketjap manis','1 el sambal','Komkommer','Kroepoek'],steps:['Bak sjalot, knoflook en sambal.','Voeg kip toe en bak gaar.','Voeg rijst toe, roerbak op hoog vuur.','Bak eieren apart.','Serveer met komkommer en kroepoek.'],notes:'Koude rijst van gisteren werkt het best.'},
    {name:'Rendang daging',cat:'Diner',cuisine:'Indonesisch',persons:6,time:180,emoji:'🥩',photo:'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',ingredients:['1kg runderriblappen','400ml kokosmelk','2 stengels citroengras','4 limoenblaadjes','2 uien','4 teentjes knoflook','Gember, laos','Komijn, koriander','Rode pepers'],steps:['Maak boemboe van kruiden.','Bak boemboe geurig.','Voeg vlees toe.','Voeg kokosmelk toe.','Stoof 2,5 uur tot dik en donker.'],notes:'Beter na een nacht rusten.'},
    {name:'Sate ayam',cat:'Diner',cuisine:'Indonesisch',persons:4,time:50,emoji:'🍢',photo:'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=800&q=80',ingredients:['600g kipdijfilet','3 el ketjap manis','2 teentjes knoflook','1 tl koriander','Pindasaus','Komkommer'],steps:['Marineer kip.','Rijg aan stokjes.','Grill gaar.','Serveer met pindasaus.'],notes:'Week houten stokjes vooraf.'},
    {name:'Kofte met bulgur',cat:'Diner',cuisine:'Turks',persons:4,time:50,emoji:'🥙',photo:'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',ingredients:['600g rundergehakt','1 ui geraspt','2 teentjes knoflook','1 ei','1 tl komijn','1 tl paprika','250g bulgur','Tomaat, komkommer','Peterselie, citroen'],steps:['Meng gehakt met kruiden.','Vorm kleine kofte.','Maak bulgur salade.','Bak of grill kofte.','Serveer met yoghurt.'],notes:''},
    {name:'Menemen',cat:'Ontbijt',cuisine:'Turks',persons:2,time:20,emoji:'🍳',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',ingredients:['4 eieren','3 tomaten','1 groene peper','1 tl pul biber','Peterselie','Olijfolie','Brood'],steps:['Fruit peper in olijfolie.','Voeg tomaat toe.','Roer eieren erdoor.','Laat romig stollen.','Serveer met brood.'],notes:'Zacht en sappig houden.'},
    {name:'Lahmacun',cat:'Diner',cuisine:'Turks',persons:4,time:70,emoji:'🍕',photo:'https://images.unsplash.com/photo-1642784353782-096640cb7028?w=800&q=80',ingredients:['4 dunne wraps','300g gehakt','1 ui','1 tomaat','1 paprika','2 el tomatenpuree','Peterselie','Komijn, paprika'],steps:['Mix gehakt met groenten.','Smeer dun op wraps.','Bak heet in oven.','Serveer met citroen en sla.'],notes:'Rol op voor serveren.'},
    {name:'Spaghetti carbonara',cat:'Diner',cuisine:'Italiaans',persons:4,time:25,emoji:'🍝',photo:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',ingredients:['400g spaghetti','150g pancetta','3 eieren','80g Parmezaan','Zwarte peper','Zout'],steps:['Kook spaghetti al dente.','Bak pancetta krokant.','Klop eieren met kaas.','Meng pasta off heat met ei-mengsel.','Voeg pastawater toe tot romig.'],notes:'Geen room nodig.'},
    {name:'Pizza margherita',cat:'Diner',cuisine:'Italiaans',persons:4,time:60,emoji:'🍕',photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',ingredients:['Pizzadeeg','Tomatensaus','Mozzarella','Basilicum','Olijfolie'],steps:['Verwarm oven maximaal.','Rol deeg dun.','Beleg met saus en mozzarella.','Bak krokant.','Garneer met basilicum.'],notes:''},
    {name:'Boerenkool stamppot',cat:'Diner',cuisine:'Nederlands',persons:4,time:40,emoji:'🥬',photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',ingredients:['1kg aardappelen','500g boerenkool','1 rookworst','150ml melk','40g boter','Mosterd'],steps:['Kook aardappelen met boerenkool.','Warm rookworst.','Stamp met melk en boter.','Breng op smaak.','Serveer met rookworst.'],notes:'Extra lekker met spekjes.'},
    {name:'Pannenkoeken',cat:'Diner',cuisine:'Nederlands',persons:4,time:35,emoji:'🥞',photo:'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80',ingredients:['250g bloem','2 eieren','500ml melk','Snuf zout','Boter','Stroop, poedersuiker'],steps:['Klop beslag glad.','Verhit boter.','Bak goudbruin aan beide kanten.','Serveer met stroop.'],notes:'Ideale gezinsmaaltijd.'},
    {name:'Appeltaart',cat:'Bakken',cuisine:'Nederlands',persons:10,time:90,emoji:'🥧',photo:'https://images.unsplash.com/photo-1621743478914-cc8a86d7e9f2?w=800&q=80',ingredients:['300g bloem','200g boter','150g suiker','1 ei','1kg appels','Rozijnen','Kaneel'],steps:['Maak deeg.','Bekleed springvorm.','Vul met appel-kaneel mengsel.','Maak raster.','Bak 60 min op 175°C.'],notes:'Laat afkoelen voor mooie punten.'},
    {name:'Erwtensoep',cat:'Diner',cuisine:'Nederlands',persons:6,time:120,emoji:'🥣',photo:'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',ingredients:['500g spliterwten','1 prei','1 winterpeen','1 knolselderij','1 rookworst','Speklap','Selderij'],steps:['Kook erwten met vlees.','Voeg groenten toe.','Kook tot dik.','Snijd vlees fijn.','Breng op smaak.'],notes:'De volgende dag nog beter.'}
  ];

  var FALLBACKS = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'
  ];

  var CAT_ICONS = {Ontbijt:'🥞',Lunch:'🥗',Diner:'🍽️',Snack:'🍿',Dessert:'🍰',Bakken:'🧁'};
  var STORE_KEY = 'fam_recipes_v1';
  var SEED_KEY  = 'fam_recipes_seeded_v1';

  var R = [];
  var checkedI = {};
  var checkedS = {};

  function loadData() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) R = p; }
    } catch(e) {}
    window.recipesData = R;
  }

  function saveData() {
    window.recipesData = R;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(R)); } catch(e) {}
    try { if (window.HouseholdRepository && window.HouseholdRepository.write) window.HouseholdRepository.write('recipes', R, {source:'recipes'}); } catch(e) {}
  }

  function seedData() {
    try { if (localStorage.getItem(SEED_KEY)) return; } catch(e) {}
    var names = {};
    R.forEach(function(r){ names[r.name.toLowerCase()] = 1; });
    SEEDS.forEach(function(s) {
      if (names[s.name.toLowerCase()]) return;
      var r = JSON.parse(JSON.stringify(s));
      r.id = 'r' + Date.now() + Math.random().toString(36).slice(2,6);
      R.push(r);
      names[s.name.toLowerCase()] = 1;
    });
    saveData();
    try { localStorage.setItem(SEED_KEY, '1'); } catch(e) {}
  }

  function newId() { return 'r' + Date.now() + Math.random().toString(36).slice(2,6); }

  function getPhoto(r) {
    return (r && r.photo) ? r.photo : FALLBACKS[Math.abs((r && r.name || '').length) % FALLBACKS.length];
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function addCSS() {
    if (document.getElementById('rcss1')) return;
    var s = document.createElement('style');
    s.id = 'rcss1';
    s.textContent = [
      '#rg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 14px 100px}',
      '#rs-wrap{padding:8px 14px 4px}',
      '#rs-inp{width:100%;height:44px;border-radius:16px;border:1.5px solid var(--c-border,#e5e7eb);background:var(--c-surface,#fff);padding:0 14px;font-size:14px;font-weight:600;outline:none;box-sizing:border-box;-webkit-appearance:none;display:block}',
      '.rc{border-radius:20px;overflow:hidden;cursor:pointer;position:relative;min-height:190px;background:#111}',
      '.rc-img{position:absolute;inset:0;overflow:hidden}',
      '.rc-img img{width:100%;height:100%;object-fit:cover;display:block}',
      '.rc-ov{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.75)100%)}',
      '.rc-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;background:#f3f4f0}',
      '.rc-top{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;gap:4px}',
      '.rc-tag{background:rgba(255,255,255,.2);backdrop-filter:blur(6px);color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:99px}',
      '.rc-bot{position:absolute;bottom:10px;left:10px;right:10px;color:#fff}',
      '.rc-name{font-size:15px;font-weight:900;line-height:1.15;text-shadow:0 1px 6px rgba(0,0,0,.5)}',
      '.rc-sub{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}',
      '.rc-sub span{background:rgba(255,255,255,.15);backdrop-filter:blur(4px);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px}',
      '#rd-hero{width:100%;height:200px;position:relative;overflow:hidden;background:var(--c-surface2,#f5f5f3);display:flex;align-items:center;justify-content:center;font-size:64px}',
      '#rd-hero img{width:100%;height:100%;object-fit:cover;display:block}',
      '.rd-photobtn{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;border:0;border-radius:99px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer}',
      '.rd-info{padding:16px 16px 8px}',
      '.rd-info h2{margin:0 0 8px;font-size:20px;font-weight:900}',
      '.rd-tags{display:flex;gap:6px;flex-wrap:wrap}',
      '.rd-actions{padding:0 16px 8px;display:flex;gap:8px;flex-wrap:wrap}',
      '.rd-btn{border:0;border-radius:99px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;background:var(--c-surface2,#f0f0ee);color:var(--c-text,#111)}',
      '.rd-btn.pri{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.rd-btn.red{background:#fff0f0;color:#b00}',
      '.rd-sec{background:var(--c-surface,#fff);border-radius:18px;margin:8px 14px;padding:14px;border:1px solid var(--c-border,#e5e7eb)}',
      '.rd-sec-h{font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--c-text2,#888);margin-bottom:10px}',
      '.rd-ing{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.05);cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}',
      '.rd-ing:last-child{border-bottom:0}',
      '.rd-dot{width:22px;height:22px;min-width:22px;border-radius:50%;border:2px solid var(--c-border,#ccc);display:flex;align-items:center;justify-content:center;transition:.12s;flex-shrink:0;margin-top:1px}',
      '.rd-dot.on{background:var(--c-primary,#3f7f2f);border-color:var(--c-primary,#3f7f2f)}',
      '.rd-ing-txt{font-size:14px;line-height:1.4;flex:1;transition:.12s}',
      '.rd-ing-txt.on{color:var(--c-text3,#aaa);text-decoration:line-through}',
      '.rd-step{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;border-radius:12px;border:1px solid var(--c-border,#e5e7eb);margin-bottom:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}',
      '.rd-stepn{width:24px;height:24px;min-width:24px;border-radius:8px;background:var(--c-surface2,#f0f0ee);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--c-text2,#888);flex-shrink:0}',
      '.rd-step-txt{font-size:14px;line-height:1.4;flex:1;transition:.12s}',
      '.rd-step-txt.on{color:var(--c-text3,#aaa);text-decoration:line-through}',
      '.rd-shopbtn{width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;background:var(--c-primary,#3f7f2f);color:#fff;font-size:14px;font-weight:900;cursor:pointer}',
      '.rd-notes{margin:8px 14px;padding:12px;background:var(--c-surface2,#f5f5f3);border-radius:14px;font-size:13px;line-height:1.5}',
      '#r-addbtn{background:var(--c-primary,#3f7f2f);color:#fff;border:0;border-radius:99px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}',
      '.r-empty{grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text2,#888);font-size:14px}'
    ].join('');
    document.head.appendChild(s);
  }

  var currentFilter = 'all';
  var currentSearch = '';

  function renderList() {
    console.log('[recipes] renderList start, R.length=', R.length);
    addCSS();
    var screen = document.getElementById('screen-recipes');
    if (!screen) return;

    var html = '<div id="recipe-list-view">';
    html += '<div class="list-header"><h2>Recepten</h2><button id="r-addbtn">+ Recept</button></div>';
    html += '<div id="rs-wrap"><input id="rs-inp" placeholder="Zoek recept, keuken..." autocomplete="off"></div>';
    html += '<div class="chips" style="padding:4px 14px 10px">';
    html += '<button class="chip' + (currentFilter === 'all' ? ' active' : '') + '" id="rf-all">Alle</button>';
    html += '<button class="chip' + (currentFilter === 'Diner' ? ' active' : '') + '" id="rf-diner">Diner</button>';
    html += '<button class="chip' + (currentFilter === 'Ontbijt' ? ' active' : '') + '" id="rf-ontbijt">Ontbijt</button>';
    html += '<button class="chip' + (currentFilter === 'Lunch' ? ' active' : '') + '" id="rf-lunch">Lunch</button>';
    html += '<button class="chip' + (currentFilter === 'Snack' ? ' active' : '') + '" id="rf-snack">Snack</button>';
    html += '<button class="chip' + (currentFilter === 'Dessert' ? ' active' : '') + '" id="rf-dessert">Dessert</button>';
    html += '<button class="chip' + (currentFilter === 'Bakken' ? ' active' : '') + '" id="rf-bakken">Bakken</button>';
    html += '</div>';
    html += '<div id="rg"></div>';
    html += '</div>';
    html += '<div id="recipe-detail-view" style="display:none"></div>';

    screen.innerHTML = html;

    // Wire up — all direct, no delegation, no tricks
    document.getElementById('r-addbtn').onclick = function() { openEditor(null); };
    document.getElementById('rs-inp').oninput = function() { currentSearch = this.value; renderGrid(); };
    document.getElementById('rf-all').onclick    = function() { setFilter('all'); };
    document.getElementById('rf-diner').onclick  = function() { setFilter('Diner'); };
    document.getElementById('rf-ontbijt').onclick = function() { setFilter('Ontbijt'); };
    document.getElementById('rf-lunch').onclick  = function() { setFilter('Lunch'); };
    document.getElementById('rf-snack').onclick  = function() { setFilter('Snack'); };
    document.getElementById('rf-dessert').onclick = function() { setFilter('Dessert'); };
    document.getElementById('rf-bakken').onclick = function() { setFilter('Bakken'); };

    renderGrid();
  }

  function setFilter(cat) {
    currentFilter = cat;
    renderList();
  }

  function renderGrid() {
    var grid = document.getElementById('rg');
    if (!grid) return;
    var q = currentSearch.toLowerCase().trim();
    var list = R.filter(function(r) {
      if (currentFilter !== 'all' && r.cat !== currentFilter) return false;
      if (!q) return true;
      return (r.name + ' ' + (r.cuisine||'') + ' ' + r.cat + ' ' + (r.ingredients||[]).join(' ')).toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) { grid.innerHTML = '<div class="r-empty">Geen recepten gevonden</div>'; return; }
    grid.innerHTML = list.map(function(r) {
      var p = getPhoto(r);
      var e = r.emoji || CAT_ICONS[r.cat] || '🍴';
      var id = esc(r.id);
      return '<div class="rc" id="rc-' + id + '">'
        + (p ? '<div class="rc-img"><img src="' + esc(p) + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + esc(FALLBACKS[0]) + '\';"></div><div class="rc-ov"></div>' : '<div class="rc-emoji">' + e + '</div>')
        + '<div class="rc-top"><span class="rc-tag">' + esc(r.cuisine||r.cat) + '</span><span class="rc-tag">⏱ ' + esc(r.time||20) + 'm</span></div>'
        + '<div class="rc-bot"><div class="rc-name">' + esc(r.name) + '</div>'
        + '<div class="rc-sub"><span>' + e + ' ' + esc(r.cat) + '</span><span>👥 ' + esc(r.persons||4) + 'p</span></div></div></div>';
    }).join('');
    list.forEach(function(r) {
      var el = document.getElementById('rc-' + esc(r.id));
      if (el) el.onclick = function() { renderDetail(r.id); };
    });
  }

  function renderDetail(id) {
    var r = R.find(function(x) { return String(x.id) === String(id); });
    if (!r) return;
    if (!checkedI[id]) checkedI[id] = new Set();
    if (!checkedS[id]) checkedS[id] = new Set();
    var ci = checkedI[id];
    var cs = checkedS[id];
    var p = getPhoto(r);
    var e = r.emoji || CAT_ICONS[r.cat] || '🍴';
    var SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    var ings = (r.ingredients||[]).length ? (r.ingredients||[]).map(function(ing, i) {
      var on = ci.has(i);
      return '<div class="rd-ing" id="ri-' + i + '"><div class="rd-dot' + (on ? ' on' : '') + '">' + (on ? SVG : '') + '</div><div class="rd-ing-txt' + (on ? ' on' : '') + '">' + esc(ing) + '</div></div>';
    }).join('') : '<p style="color:var(--c-text2);font-size:13px">Geen ingrediënten</p>';

    var steps = (r.steps||[]).length ? (r.steps||[]).map(function(step, i) {
      var on = cs.has(i);
      return '<div class="rd-step" id="rs-' + i + '"><div class="rd-dot' + (on ? ' on' : '') + '">' + (on ? SVG : '') + '</div><div class="rd-stepn">' + (i+1) + '</div><div class="rd-step-txt' + (on ? ' on' : '') + '">' + esc(step) + '</div></div>';
    }).join('') : '<p style="color:var(--c-text2);font-size:13px">Geen stappen</p>';

    var dv = document.getElementById('recipe-detail-view');
    if (!dv) return;
    dv.innerHTML = ''
      + '<div class="list-header" style="padding:10px 14px 6px"><button id="rd-back" class="add-btn" style="background:var(--c-surface2);color:var(--c-text);box-shadow:none">← Terug</button></div>'
      + '<div id="rd-hero">' + (p ? '<img src="' + esc(p) + '" onerror="this.style.display=\'none\'">' : e) + '<button class="rd-photobtn" id="rd-photobtn">📷 Foto</button></div>'
      + '<div class="rd-info"><h2>' + esc(r.name) + '</h2><div class="rd-tags"><span class="recipe-tag">' + esc(r.cat) + '</span><span class="recipe-tag">⏱ ' + esc(r.time||20) + ' min</span><span class="recipe-tag">👥 ' + esc(r.persons||4) + ' pers</span>' + (r.cuisine ? '<span class="recipe-tag">🌍 ' + esc(r.cuisine) + '</span>' : '') + '</div></div>'
      + '<div class="rd-actions"><button class="rd-btn pri" id="rd-edit">✏️ Bewerken</button><button class="rd-btn red" id="rd-del">🗑️ Verwijderen</button></div>'
      + '<div class="rd-sec"><div class="rd-sec-h">Ingrediënten</div>' + ings + '<button class="rd-shopbtn" id="rd-shop">🛒 Alles op boodschappenlijst</button></div>'
      + '<div class="rd-sec"><div class="rd-sec-h">Bereiding</div>' + steps + '</div>'
      + (r.notes ? '<div class="rd-notes">💡 ' + esc(r.notes) + '</div>' : '')
      + '<div style="height:50px"></div>';

    // Wire buttons
    document.getElementById('rd-back').onclick = function() { goBack(); };
    document.getElementById('rd-photobtn').onclick = function() { openPhotoSheet(r); };
    document.getElementById('rd-edit').onclick = function() { openEditor(r.id); };
    document.getElementById('rd-del').onclick = function() { deleteRecipe(r.id); };
    document.getElementById('rd-shop').onclick = function() { addToShop(r); };

    // Wire ingredient checkboxes
    (r.ingredients||[]).forEach(function(ing, i) {
      var row = document.getElementById('ri-' + i);
      if (!row) return;
      row.onclick = function() {
        ci.has(i) ? ci.delete(i) : ci.add(i);
        var on = ci.has(i);
        row.querySelector('.rd-dot').className = 'rd-dot' + (on ? ' on' : '');
        row.querySelector('.rd-dot').innerHTML = on ? SVG : '';
        row.querySelector('.rd-ing-txt').className = 'rd-ing-txt' + (on ? ' on' : '');
      };
    });

    // Wire step checkboxes
    (r.steps||[]).forEach(function(step, i) {
      var row = document.getElementById('rs-' + i);
      if (!row) return;
      row.onclick = function() {
        cs.has(i) ? cs.delete(i) : cs.add(i);
        var on = cs.has(i);
        row.querySelector('.rd-dot').className = 'rd-dot' + (on ? ' on' : '');
        row.querySelector('.rd-dot').innerHTML = on ? SVG : '';
        row.querySelector('.rd-step-txt').className = 'rd-step-txt' + (on ? ' on' : '');
      };
    });

    document.getElementById('recipe-list-view').style.display = 'none';
    dv.style.display = 'block';
  }

  function goBack() {
    var dv = document.getElementById('recipe-detail-view');
    var lv = document.getElementById('recipe-list-view');
    if (dv) dv.style.display = 'none';
    if (lv) lv.style.display = 'block';
    renderGrid();
  }

  function deleteRecipe(id) {
    var r = R.find(function(x) { return String(x.id) === String(id); });
    if (!r || !confirm('Verwijder "' + r.name + '"?')) return;
    R = R.filter(function(x) { return String(x.id) !== String(id); });
    saveData();
    if (typeof window.showToast === 'function') window.showToast('Verwijderd');
    goBack();
  }

  function addToShop(r) {
    if (!Array.isArray(window.shopData)) window.shopData = [];
    if (!window.shopNextId) window.shopNextId = 1;
    var added = 0;
    (r.ingredients||[]).forEach(function(ing) {
      var name = ing.replace(/^[\d\/,\.]+\s*(g|kg|ml|l|el|tl|stuks?|blik|teen|teentjes|snuf)?\s+/i, '').trim();
      if (!name) name = ing;
      var exists = window.shopData.some(function(s) { return s.name.toLowerCase() === name.toLowerCase() && !s.done; });
      if (!exists) {
        window.shopData.unshift({id: window.shopNextId++, name: name, qty: '1x', cat: 'Overig', who: window.myName || '', done: false, photo: null});
        added++;
      }
    });
    if (typeof window.updateStats === 'function') window.updateStats();
    if (typeof window.showToast === 'function') window.showToast(added + ' ingrediënten toegevoegd ✓');
  }

  function openPhotoSheet(r) {
    if (!window.BottomSheet) return;
    window.BottomSheet.open({
      title: '📷 Foto wijzigen',
      html: '<div class="fam-modal-field"><label>Foto URL</label><input id="rp-url" value="' + esc(r.photo||'') + '"></div><div><button type="button" class="add-btn" id="rp-upbtn">📂 Upload</button><input type="file" accept="image/*" id="rp-file" style="display:none"></div>',
      onOpen: function(ctx) {
        var ub = ctx.modal.querySelector('#rp-upbtn');
        var fi = ctx.modal.querySelector('#rp-file');
        if (ub && fi) {
          ub.onclick = function() { fi.click(); };
          fi.onchange = function(e) {
            var f = e.target.files[0]; if (!f) return;
            var rd = new FileReader();
            rd.onload = function(ev) { var u = ctx.modal.querySelector('#rp-url'); if (u) u.value = ev.target.result; };
            rd.readAsDataURL(f);
          };
        }
      },
      actions: [
        {label: 'Annuleren'},
        {label: 'Opslaan', primary: true, onClick: function(ctx) {
          var u = (ctx.modal.querySelector('#rp-url').value || '').trim();
          r.photo = u || null; saveData();
          if (typeof window.showToast === 'function') window.showToast('Foto opgeslagen ✓');
          setTimeout(function() { renderDetail(r.id); }, 80);
          return true;
        }}
      ]
    });
  }

  function openEditor(id) {
    var r = id ? R.find(function(x) { return String(x.id) === String(id); }) : null;
    if (!window.BottomSheet) return;
    window.BottomSheet.open({
      title: r ? '✏️ Bewerken' : '🍳 Nieuw recept',
      html: '<div class="fam-modal-field"><label>Naam</label><input id="re-name" value="' + esc(r ? r.name : '') + '"></div>'
        + '<div class="fam-modal-field"><label>Categorie</label><select id="re-cat"><option>Ontbijt</option><option>Lunch</option><option>Diner</option><option>Snack</option><option>Dessert</option><option>Bakken</option></select></div>'
        + '<div class="fam-modal-field"><label>Keuken</label><input id="re-cuis" value="' + esc(r ? r.cuisine||'' : '') + '"></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fam-modal-field"><label>Personen</label><input id="re-pers" type="number" value="' + esc(r ? r.persons : 4) + '"></div><div class="fam-modal-field"><label>Tijd (min)</label><input id="re-time" type="number" value="' + esc(r ? r.time : 30) + '"></div></div>'
        + '<div class="fam-modal-field"><label>Ingrediënten (1 per regel)</label><textarea id="re-ings" rows="5">' + esc(r ? (r.ingredients||[]).join('\n') : '') + '</textarea></div>'
        + '<div class="fam-modal-field"><label>Stappen (1 per regel)</label><textarea id="re-steps" rows="5">' + esc(r ? (r.steps||[]).join('\n') : '') + '</textarea></div>'
        + '<div class="fam-modal-field"><label>Notities</label><textarea id="re-notes" rows="2">' + esc(r ? r.notes||'' : '') + '</textarea></div>',
      onOpen: function(ctx) {
        var cat = ctx.modal.querySelector('#re-cat');
        if (cat && r) cat.value = r.cat || 'Diner';
        var nm = ctx.modal.querySelector('#re-name');
        if (nm) setTimeout(function() { nm.focus(); }, 80);
      },
      actions: [
        {label: 'Annuleren'},
        {label: 'Opslaan', primary: true, onClick: function(ctx) {
          var m = ctx.modal;
          var name = (m.querySelector('#re-name').value || '').trim();
          if (!name) { if (typeof window.showToast === 'function') window.showToast('Naam verplicht'); return false; }
          var ings = (m.querySelector('#re-ings').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
          if (!ings.length) { if (typeof window.showToast === 'function') window.showToast('Voeg minstens 1 ingrediënt toe'); return false; }
          if (r) {
            r.name = name; r.cat = m.querySelector('#re-cat').value;
            r.cuisine = (m.querySelector('#re-cuis').value || '').trim();
            r.persons = parseInt(m.querySelector('#re-pers').value) || 4;
            r.time = parseInt(m.querySelector('#re-time').value) || 30;
            r.ingredients = ings;
            r.steps = (m.querySelector('#re-steps').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
            r.notes = m.querySelector('#re-notes').value || '';
          } else {
            r = {id: newId(), name: name, cat: m.querySelector('#re-cat').value,
              cuisine: (m.querySelector('#re-cuis').value || '').trim(),
              persons: parseInt(m.querySelector('#re-pers').value) || 4,
              time: parseInt(m.querySelector('#re-time').value) || 30,
              emoji: CAT_ICONS[m.querySelector('#re-cat').value] || '🍴',
              photo: null, ingredients: ings,
              steps: (m.querySelector('#re-steps').value || '').split('\n').map(function(s) { return s.trim(); }).filter(Boolean),
              notes: m.querySelector('#re-notes').value || ''};
            R.unshift(r);
            if (typeof window.awardXP === 'function') window.awardXP(4, 'Recept aangemaakt');
          }
          saveData();
          if (typeof window.showToast === 'function') window.showToast('Opgeslagen ✓');
          setTimeout(function() { renderDetail(r.id); }, 80);
          return true;
        }}
      ]
    });
  }

  function renderRecipes() {
    try {
      loadData();
      seedData();
      renderList();
    } catch(err) {
      var screen = document.getElementById('screen-recipes');
      if (screen) screen.innerHTML = '<div style="padding:20px;color:red;font-size:13px">FOUT: ' + err.message + '<br><pre>' + err.stack + '</pre></div>';
      console.error('renderRecipes error:', err);
    }
  }

  window.renderRecipes     = renderRecipes;
  window.openRecipeDetail  = function(id) { renderDetail(id); };
  window.closeRecipeDetail = goBack;
  window.renderRecipeGrid  = renderGrid;
  window.recipesData       = R;

  loadData();
  seedData();

})();
