'use strict';
// ============================================================
// RECEPTEN MODULE v0.280 — complete rebuild, zero tricks
// Werkt direct op de bestaande HTML structuur.
// ============================================================
(function () {

  var VERSION = '0.280';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var SEEDED_KEY  = 'familyapp_seeded_v0280';

  var CAT_EMOJIS = { Ontbijt:'🥞', Lunch:'🥗', Diner:'🍽️', Snack:'🍿', Dessert:'🍰', Bakken:'🧁' };

  var FALLBACKS = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'
  ];

  // ── SEED DATA ────────────────────────────────────────────
  var SEEDS = [
    {name:'Lasagne',cat:'Diner',cuisine:'Italiaans',persons:4,time:60,emoji:'🍝',photo:'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',ingredients:['500g gehakt','2 uien','2 teentjes knoflook','1 blik tomaten','Lasagne platen','500ml béchamelsaus','100g geraspte kaas','Olijfolie, zout, peper'],steps:['Verwarm oven op 180°C.','Bak gehakt met ui en knoflook.','Voeg tomaten toe, 15 min sudderen.','Laag voor laag: lasagne, vleessaus, béchamel.','Afsluiten met kaas, 40 min bakken.'],notes:'Lekker de volgende dag ook!'},
    {name:'Shakshuka',cat:'Ontbijt',cuisine:'Midden-Oosten',persons:2,time:20,emoji:'🍳',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',ingredients:['4 eieren','1 blik tomaten','1 ui','1 paprika','Komijn, paprikapoeder','Feta optioneel'],steps:['Bak ui en paprika zacht.','Voeg tomaten en kruiden toe.','Maak kuiltjes en breek eieren erin.','Deksel op pan, 8-10 min.'],notes:'Lekker met knapperig brood'},
    {name:'Bananenbrood',cat:'Bakken',cuisine:'Internationaal',persons:8,time:65,emoji:'🍌',photo:'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80',ingredients:['3 rijpe bananen','200g bloem','100g suiker','2 eieren','80g boter','1 tl bakpoeder','Snuf zout'],steps:['Verwarm oven op 175°C.','Prak bananen fijn.','Meng alle ingrediënten.','In broodvorm 55 min bakken.'],notes:''},
    {name:'Surinaamse roti met kip masala',cat:'Diner',cuisine:'Surinaams',persons:4,time:75,emoji:'🍛',photo:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',ingredients:['4 rotiplaten','600g kipdijfilet','600g aardappelen','400g kousenband','4 eieren','2 uien','3 teentjes knoflook','2 el masala','1 tl komijn','Olie, zout, peper'],steps:['Kook eieren hard.','Bak ui en knoflook glazig.','Voeg kip en masala toe.','Stoof aardappelen gaar.','Serveer met roti.'],notes:'Sambal apart serveren voor kinderen.'},
    {name:'Pom met kip',cat:'Diner',cuisine:'Surinaams',persons:6,time:110,emoji:'🥘',photo:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',ingredients:['1kg pomtayer','700g kip','2 uien','3 teentjes knoflook','2 tomaten','Sap van 1 sinaasappel','Sap van 1 citroen','2 el suiker','Olie, zout, peper'],steps:['Marineer kip.','Bak kip met ui en tomaat.','Meng pomtayer met citrus.','Laag voor laag in ovenschaal.','Bak 90 min op 180°C.'],notes:'Lekker met rijst en zuurgoed.'},
    {name:'Saoto soep',cat:'Diner',cuisine:'Surinaams',persons:4,time:80,emoji:'🍲',photo:'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',ingredients:['1 hele kip','2 liter water','1 ui','Laos, salam','Taugé','Gekookte eieren','Gebakken uitjes','Rijst','Selderij'],steps:['Trek bouillon van kip.','Pluk kip, breng op smaak.','Kook rijst en eieren.','Vul kommen en schenk bouillon erover.'],notes:'Sambal ketjap apart serveren.'},
    {name:'Nasi goreng',cat:'Diner',cuisine:'Indonesisch',persons:4,time:35,emoji:'🍚',photo:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',ingredients:['500g koude rijst','3 eieren','250g kip','2 sjalotten','3 teentjes knoflook','2 el ketjap manis','1 el sambal','Komkommer','Kroepoek'],steps:['Bak sjalot, knoflook en sambal.','Voeg kip toe en bak gaar.','Voeg rijst toe, roerbak.','Bak eieren apart.','Serveer met komkommer en kroepoek.'],notes:'Koude rijst van gisteren werkt het best.'},
    {name:'Rendang daging',cat:'Diner',cuisine:'Indonesisch',persons:6,time:180,emoji:'🥩',photo:'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=80',ingredients:['1kg runderriblappen','400ml kokosmelk','2 stengels citroengras','4 limoenblaadjes','2 uien','4 teentjes knoflook','Gember, laos','Komijn, koriander','Rode pepers'],steps:['Maak boemboe van kruiden.','Bak boemboe geurig.','Voeg vlees toe.','Voeg kokosmelk toe.','Stoof 2,5 uur tot dik en donker.'],notes:'Beter na een nacht rusten.'},
    {name:'Sate ayam',cat:'Diner',cuisine:'Indonesisch',persons:4,time:50,emoji:'🍢',photo:'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?auto=format&fit=crop&w=800&q=80',ingredients:['600g kipdijfilet','3 el ketjap manis','2 teentjes knoflook','1 tl koriander','1 el limoensap','Pindasaus','Komkommer'],steps:['Marineer kip.','Rijg aan stokjes.','Grill gaar.','Serveer met pindasaus.'],notes:'Week houten stokjes vooraf in water.'},
    {name:'Köfte met bulgur',cat:'Diner',cuisine:'Turks',persons:4,time:50,emoji:'🥙',photo:'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',ingredients:['600g rundergehakt','1 ui geraspt','2 teentjes knoflook','1 ei','1 tl komijn','1 tl paprikapoeder','250g bulgur','Tomaat, komkommer','Peterselie, citroen'],steps:['Meng gehakt met kruiden.','Vorm kleine köfte.','Maak bulgur salade.','Bak of grill köfte.','Serveer met yoghurt.'],notes:'Ook goed voor meal prep.'},
    {name:'Menemen',cat:'Ontbijt',cuisine:'Turks',persons:2,time:20,emoji:'🍳',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',ingredients:['4 eieren','3 tomaten','1 groene peper','1 tl pul biber','Peterselie','Olijfolie','Brood'],steps:['Fruit peper in olijfolie.','Voeg tomaat toe.','Roer eieren erdoor.','Laat romig stollen.','Serveer met brood.'],notes:'Zacht en sappig houden.'},
    {name:'Lahmacun',cat:'Diner',cuisine:'Turks',persons:4,time:70,emoji:'🍕',photo:'https://images.unsplash.com/photo-1642784353782-096640cb7028?auto=format&fit=crop&w=800&q=80',ingredients:['4 dunne wraps','300g gehakt','1 ui','1 tomaat','1 paprika','2 el tomatenpuree','Peterselie','Komijn, paprika'],steps:['Mix gehakt met groenten en kruiden.','Smeer dun op wraps.','Bak heet in oven.','Serveer met citroen en sla.'],notes:'Rol op voor serveren.'},
    {name:'Spaghetti carbonara',cat:'Diner',cuisine:'Italiaans',persons:4,time:25,emoji:'🍝',photo:'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',ingredients:['400g spaghetti','150g pancetta','3 eieren','80g Parmezaan','Zwarte peper','Zout'],steps:['Kook spaghetti al dente.','Bak pancetta krokant.','Klop eieren met kaas.','Meng pasta off heat met ei-mengsel.','Voeg pastawater toe tot romig.'],notes:'Geen room nodig.'},
    {name:'Pizza margherita',cat:'Diner',cuisine:'Italiaans',persons:4,time:60,emoji:'🍕',photo:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',ingredients:['Pizzadeeg','Tomatensaus','Mozzarella','Basilicum','Olijfolie'],steps:['Verwarm oven maximaal.','Rol deeg dun.','Beleg met saus en mozzarella.','Bak krokant.','Garneer met basilicum.'],notes:''},
    {name:'Boerenkool stamppot',cat:'Diner',cuisine:'Nederlands',persons:4,time:40,emoji:'🥬',photo:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',ingredients:['1kg aardappelen','500g boerenkool','1 rookworst','150ml melk','40g boter','Mosterd','Zout, peper, nootmuskaat'],steps:['Kook aardappelen met boerenkool.','Warm rookworst.','Stamp met melk en boter.','Breng op smaak.','Serveer met rookworst.'],notes:'Extra lekker met spekjes.'},
    {name:'Pannenkoeken',cat:'Diner',cuisine:'Nederlands',persons:4,time:35,emoji:'🥞',photo:'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',ingredients:['250g bloem','2 eieren','500ml melk','Snuf zout','Boter','Stroop, poedersuiker'],steps:['Klop beslag glad.','Laat 10 min rusten.','Verhit boter.','Bak goudbruin aan beide kanten.','Serveer met stroop.'],notes:'Ideale gezinsmaaltijd.'},
    {name:'Appeltaart',cat:'Bakken',cuisine:'Nederlands',persons:10,time:90,emoji:'🥧',photo:'https://images.unsplash.com/photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=800&q=80',ingredients:['300g bloem','200g boter','150g suiker','1 ei','1kg appels','Rozijnen','Kaneel'],steps:['Maak deeg.','Bekleed springvorm.','Vul met appel-kaneel mengsel.','Maak raster.','Bak 60 min op 175°C.'],notes:'Laat afkoelen voor mooie punten.'},
    {name:'Erwtensoep',cat:'Diner',cuisine:'Nederlands',persons:6,time:120,emoji:'🥣',photo:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',ingredients:['500g spliterwten','1 prei','1 winterpeen','1 knolselderij','1 rookworst','Speklap','Selderij'],steps:['Kook erwten met vlees.','Voeg groenten toe.','Kook tot dik.','Snijd vlees fijn.','Breng op smaak.'],notes:'De volgende dag nog beter.'}
  ];

  // ── STATE ────────────────────────────────────────────────
  var _recipes = [];
  var _filter  = 'all';
  var _search  = '';
  var _checked = {}; // { recipeId: { ing: Set, step: Set } }

  // ── STORAGE ──────────────────────────────────────────────
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { var p = JSON.parse(raw); if (Array.isArray(p) && p.length) _recipes = p; }
    } catch(e) {}
    // sync to legacy globals
    window.recipesData = _recipes;
  }

  function save() {
    window.recipesData = _recipes;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_recipes)); } catch(e) {}
    try {
      if (window.HouseholdRepository && window.HouseholdRepository.write)
        window.HouseholdRepository.write('recipes', _recipes, { source:'recipes', version:VERSION });
    } catch(e) {}
  }

  function seed() {
    try { if (localStorage.getItem(SEEDED_KEY) === VERSION) return; } catch(e) {}
    var names = {};
    _recipes.forEach(function(r){ names[r.name.toLowerCase()] = true; });
    var n = 0;
    SEEDS.forEach(function(s) {
      if (names[s.name.toLowerCase()]) return;
      var r = JSON.parse(JSON.stringify(s));
      r.id = Date.now() + (n++);
      r.seeded = true;
      _recipes.push(r);
      names[r.name.toLowerCase()] = true;
    });
    save();
    try { localStorage.setItem(SEEDED_KEY, VERSION); } catch(e) {}
  }

  function nextId() {
    var max = 0;
    _recipes.forEach(function(r){ if (Number(r.id) > max) max = Number(r.id); });
    return max + 1;
  }

  // ── HELPERS ──────────────────────────────────────────────
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function norm(v) { return String(v||'').toLowerCase().trim(); }
  function photo(r) {
    if (r && r.photo) return r.photo;
    var k = (r && r.name ? r.name.length : 0);
    return FALLBACKS[k % FALLBACKS.length];
  }
  function checkedFor(id) {
    if (!_checked[id]) _checked[id] = { ing: new Set(), step: new Set() };
    return _checked[id];
  }
  function toast(m) { if (typeof window.showToast === 'function') window.showToast(m); }
  function xp(n,l)  { if (typeof window.awardXP === 'function') window.awardXP(n,l); }

  // ── STYLES ───────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('rfcss280')) return;
    var el = document.createElement('style');
    el.id = 'rfcss280';
    el.textContent = [
      /* Search */
      '#rf-search{padding:0 16px 10px}',
      '#rf-search input{width:100%;height:46px;border-radius:18px;border:1px solid var(--c-border,#edf0ec);background:var(--c-surface,#fff);padding:0 44px 0 16px;font-size:15px;font-weight:700;outline:none;-webkit-appearance:none;box-sizing:border-box}',
      '#rf-autocomplete{position:absolute;top:48px;left:0;right:0;background:var(--c-surface,#fff);border:1px solid var(--c-border,#edf0ec);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.1);z-index:999;overflow:hidden;display:none}',
      '#rf-autocomplete .rf-ac{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:1px solid rgba(0,0,0,.04)}',
      '#rf-autocomplete .rf-ac:last-child{border-bottom:0}',
      '#rf-autocomplete .rf-ac:active{background:var(--c-surface2,#f4f7f2)}',
      /* Grid */
      '#recipe-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;padding:0 16px 100px!important}',
      /* Card */
      '.rfc{position:relative;min-height:200px;border-radius:22px;overflow:hidden;cursor:pointer;background:#1a1a2e;box-shadow:0 12px 28px rgba(0,0,0,.15)}',
      '.rfc:active{transform:scale(.97)}',
      '.rfc-bg{position:absolute;inset:0;background-size:cover;background-position:center}',
      '.rfc-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(0,0,0,.7) 100%)}',
      '.rfc-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px}',
      '.rfc-top{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between}',
      '.rfc-pill{height:26px;padding:0 9px;border-radius:99px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff;font-size:11px;font-weight:800;display:inline-flex;align-items:center}',
      '.rfc-bottom{position:absolute;left:12px;right:12px;bottom:12px;color:#fff}',
      '.rfc-name{font-size:16px;font-weight:950;line-height:1.1;text-shadow:0 2px 8px rgba(0,0,0,.4)}',
      '.rfc-meta{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap}',
      /* Detail */
      '.rfd-hero{width:100%;height:200px;position:relative;overflow:hidden;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:64px}',
      '.rfd-hero img{width:100%;height:100%;object-fit:cover}',
      '.rfd-photobtn{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.55);color:#fff;border:0;border-radius:99px;padding:6px 13px;font-size:12px;font-weight:800;cursor:pointer}',
      '.rfd-actions{display:flex;gap:8px;flex-wrap:wrap;padding:14px 16px 6px}',
      '.rfd-btn{border:0;border-radius:99px;padding:9px 14px;font-size:12px;font-weight:900;cursor:pointer;background:var(--c-surface2,#f4f7f2);color:var(--c-text,#111)}',
      '.rfd-btn.pri{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.rfd-btn.red{background:#fff0f0;color:#c00}',
      '.rfd-section{background:var(--c-surface,#fff);border-radius:20px;margin:10px 16px;padding:14px;border:1px solid var(--c-border,#edf0ec);box-shadow:0 4px 14px rgba(0,0,0,.04)}',
      '.rfd-stitle{font-size:12px;font-weight:950;letter-spacing:.05em;text-transform:uppercase;color:var(--c-text2,#667085);margin-bottom:10px}',
      /* Ingredient row */
      '.rfd-ing{display:flex;align-items:flex-start;gap:11px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);cursor:pointer;-webkit-tap-highlight-color:transparent}',
      '.rfd-ing:last-child{border-bottom:0}',
      '.rfd-circle{width:24px;height:24px;min-width:24px;border-radius:50%;border:2px solid var(--c-border,#ccc);display:flex;align-items:center;justify-content:center;transition:.15s}',
      '.rfd-circle.on{background:var(--c-primary,#3f7f2f);border-color:var(--c-primary,#3f7f2f)}',
      '.rfd-label{font-size:14px;line-height:1.4;flex:1;color:var(--c-text,#111);transition:.15s}',
      '.rfd-label.on{color:var(--c-text3,#999);text-decoration:line-through}',
      /* Step row */
      '.rfd-step{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--c-border,#edf0ec);margin-bottom:7px;cursor:pointer;-webkit-tap-highlight-color:transparent}',
      '.rfd-stepn{width:26px;height:26px;min-width:26px;border-radius:9px;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--c-text2,#667)}',
      /* Shop btn */
      '.rfd-shopbtn{width:100%;margin-top:12px;padding:13px;border:0;border-radius:14px;background:var(--c-primary,#3f7f2f);color:#fff;font-size:14px;font-weight:950;cursor:pointer}',
      /* Notes */
      '.rfd-notes{margin:10px 16px;padding:12px 14px;background:var(--c-surface2,#f4f7f2);border-radius:14px}',
      /* Back btn */
      '.rfd-back{border:0;background:var(--c-surface2,#f4f7f2);border-radius:99px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;margin:10px 0 0 16px;display:inline-block}',
      /* Add btn */
      '.rf-addbtn{background:var(--c-primary,#3f7f2f);color:#fff;border:0;border-radius:99px;padding:9px 18px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 6px 16px rgba(63,127,47,.2)}',
      /* Empty */
      '.rf-empty{grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--c-text2,#667)}',
      '@media(max-width:380px){#recipe-grid{gap:10px!important;padding:0 12px 100px!important}.rfc{min-height:186px}.rfc-name{font-size:14px}}'
    ].join('');
    document.head.appendChild(el);
  }

  // ── SHOW/HIDE VIEWS ──────────────────────────────────────
  // Simple: just toggle display on the two main views
  function showList() {
    var lv = document.getElementById('recipe-list-view');
    var dv = document.getElementById('recipe-detail-view');
    var ev = document.getElementById('recipe-editor-view');
    var iv = document.getElementById('recipe-import-view');
    if (lv) lv.style.display = '';
    if (dv) dv.style.display = 'none';
    if (ev) ev.style.display = 'none';
    if (iv) iv.style.display = 'none';
  }
  function showDetail() {
    var lv = document.getElementById('recipe-list-view');
    var dv = document.getElementById('recipe-detail-view');
    if (lv) lv.style.display = 'none';
    if (dv) dv.style.display = '';
  }

  // ── RENDER GRID ──────────────────────────────────────────
  function renderGrid() {
    var grid = document.getElementById('recipe-grid');
    if (!grid) return;

    var q = norm(_search);
    var list = _recipes.filter(function(r) {
      if (_filter !== 'all' && r.cat !== _filter) return false;
      if (!q) return true;
      return norm(r.name+' '+r.cuisine+' '+r.cat+' '+(r.ingredients||[]).join(' ')).indexOf(q) > -1;
    });

    if (!list.length) {
      grid.innerHTML = '<div class="rf-empty">Geen recepten gevonden</div>';
      return;
    }

    grid.innerHTML = list.map(function(r) {
      var p = photo(r);
      var e = r.emoji || CAT_EMOJIS[r.cat] || '🍴';
      var bg = p
        ? '<div class="rfc-bg" style="background-image:url(\''+esc(p)+'\')"></div><div class="rfc-ov"></div>'
        : '<div class="rfc-emoji">'+e+'</div>';
      return '<div class="rfc" data-id="'+esc(r.id)+'">'
        + bg
        + '<div class="rfc-top">'
        + '<span class="rfc-pill">'+esc(r.cuisine||r.cat)+'</span>'
        + '<span class="rfc-pill">⏱ '+esc(r.time||20)+'m</span>'
        + '</div>'
        + '<div class="rfc-bottom">'
        + '<div class="rfc-name">'+esc(r.name)+'</div>'
        + '<div class="rfc-meta">'
        + '<span class="rfc-pill">'+e+' '+esc(r.cat)+'</span>'
        + '<span class="rfc-pill">👥 '+esc(r.persons||4)+'p</span>'
        + '</div></div></div>';
    }).join('');

    // Single click listener on grid (event delegation)
    grid.onclick = function(e) {
      var card = e.target.closest('[data-id]');
      if (card) openDetail(card.getAttribute('data-id'));
    };
  }

  // ── SETUP LIST VIEW ──────────────────────────────────────
  function setupListView() {
    // Category chips via event delegation
    var chips = document.getElementById('recipe-cat-chips');
    if (chips) {
      chips.onclick = function(e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        chips.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        _filter = chip.dataset.rcat || 'all';
        renderGrid();
      };
    }

    // Search bar — rebuild every time
    var existing = document.getElementById('rf-search');
    if (existing) existing.parentNode.removeChild(existing);

    var listView = document.getElementById('recipe-list-view');
    var chipsEl  = document.getElementById('recipe-cat-chips');
    if (!listView) return;

    var wrap = document.createElement('div');
    wrap.id = 'rf-search';
    wrap.style.position = 'relative';
    wrap.innerHTML = '<input id="rf-search-inp" placeholder="🔎 Zoek recept of keuken..." autocomplete="off">'
      + '<div id="rf-autocomplete"></div>';

    if (chipsEl) {
      listView.insertBefore(wrap, chipsEl);
    } else {
      var grid = document.getElementById('recipe-grid');
      listView.insertBefore(wrap, grid || null);
    }

    var inp = document.getElementById('rf-search-inp');
    var ac  = document.getElementById('rf-autocomplete');
    if (!inp) return;

    inp.value = _search;
    inp.oninput = function() {
      _search = inp.value;
      renderGrid();
      showAC(inp.value);
    };
    inp.onfocus = function() { if (inp.value) showAC(inp.value); };
    document.addEventListener('click', function hide(e) {
      if (!wrap.contains(e.target)) { ac.style.display = 'none'; }
    });

    function showAC(q) {
      if (!q) { ac.style.display = 'none'; return; }
      var qn = norm(q);
      var hits = _recipes.filter(function(r){ return norm(r.name).indexOf(qn) > -1; }).slice(0,6);
      if (!hits.length) { ac.style.display = 'none'; return; }
      ac.innerHTML = hits.map(function(r){
        return '<div class="rf-ac" data-acid="'+esc(r.id)+'">'
          + '<span style="font-size:20px">'+(r.emoji||CAT_EMOJIS[r.cat]||'🍴')+'</span>'
          + '<div><div style="font-size:14px;font-weight:800">'+esc(r.name)+'</div>'
          + '<div style="font-size:11px;color:var(--c-text2)">'+esc(r.cuisine||r.cat)+'</div></div>'
          + '</div>';
      }).join('');
      ac.style.display = 'block';
      ac.onclick = function(e) {
        var item = e.target.closest('[data-acid]');
        if (!item) return;
        ac.style.display = 'none';
        inp.value = '';
        _search = '';
        openDetail(item.getAttribute('data-acid'));
      };
    }

    // Add button
    var header = listView.querySelector('.list-header');
    if (header && !document.getElementById('rf-addbtn')) {
      header.querySelectorAll('.add-btn').forEach(function(b){ b.style.display = 'none'; });
      var btn = document.createElement('button');
      btn.id = 'rf-addbtn';
      btn.className = 'rf-addbtn';
      btn.textContent = '+ Recept';
      btn.onclick = function(){ openEditor(null); };
      header.appendChild(btn);
    }
  }

  // ── DETAIL VIEW ──────────────────────────────────────────
  function openDetail(id) {
    var r = _recipes.find(function(x){ return String(x.id) === String(id); });
    if (!r) { toast('Recept niet gevonden'); return; }
    if (!Array.isArray(r.ingredients)) r.ingredients = [];
    if (!Array.isArray(r.steps)) r.steps = [];

    var ch = checkedFor(id);
    var p  = photo(r);
    var e  = r.emoji || CAT_EMOJIS[r.cat] || '🍴';

    var CHECK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    var ingsHtml = r.ingredients.length ? r.ingredients.map(function(ing, i) {
      var on = ch.ing.has(i);
      return '<div class="rfd-ing" data-ing="'+i+'">'
        + '<div class="rfd-circle'+(on?' on':'')+'">'+( on?CHECK:'')+'</div>'
        + '<div class="rfd-label'+(on?' on':'')+'">'+esc(ing)+'</div>'
        + '</div>';
    }).join('') : '<p style="color:var(--c-text2);padding:8px 0">Geen ingrediënten</p>';

    var stepsHtml = r.steps.length ? r.steps.map(function(step, i) {
      var on = ch.step.has(i);
      return '<div class="rfd-step" data-step="'+i+'">'
        + '<div class="rfd-circle'+(on?' on':'')+'">'+( on?CHECK:'')+'</div>'
        + '<div class="rfd-stepn">'+(i+1)+'</div>'
        + '<div class="rfd-label'+(on?' on':'')+'">'+esc(step)+'</div>'
        + '</div>';
    }).join('') : '<p style="color:var(--c-text2);padding:8px 0">Geen stappen</p>';

    var dc = document.getElementById('recipe-detail-content');
    if (!dc) return;

    dc.innerHTML =
      '<div class="rfd-hero">'
      + (p ? '<img src="'+esc(p)+'" onerror="this.style.display=\'none\'">' : e)
      + '<button class="rfd-photobtn" data-photobtn>📷 Foto</button>'
      + '</div>'
      + '<div style="padding:18px 16px 8px">'
      + '<h2 style="margin:0 0 8px">'+esc(r.name)+'</h2>'
      + '<div style="display:flex;gap:7px;flex-wrap:wrap">'
      + '<span class="recipe-tag">📂 '+esc(r.cat)+'</span>'
      + '<span class="recipe-tag">⏱ '+esc(r.time||20)+' min</span>'
      + '<span class="recipe-tag">👥 '+esc(r.persons||4)+' pers</span>'
      + '</div></div>'
      + '<div class="rfd-actions">'
      + '<button class="rfd-btn pri" data-editbtn>✏️ Bewerken</button>'
      + '<button class="rfd-btn red" data-delbtn>🗑️ Verwijderen</button>'
      + '</div>'
      + '<div class="rfd-section">'
      + '<div class="rfd-stitle">Ingrediënten</div>'
      + ingsHtml
      + '<button class="rfd-shopbtn" data-shopbtn>🛒 Alles op boodschappenlijst</button>'
      + '</div>'
      + '<div class="rfd-section">'
      + '<div class="rfd-stitle">Bereiding</div>'
      + stepsHtml
      + '</div>'
      + (r.notes ? '<div class="rfd-notes"><div style="font-size:12px;font-weight:900;color:var(--c-text2);margin-bottom:5px">💡 Notities</div><div style="font-size:14px">'+esc(r.notes)+'</div></div>' : '')
      + '<div style="height:40px"></div>';

    // Wire up back button in the detail header
    var backBtn = document.querySelector('#recipe-detail-view .rfd-back, #recipe-detail-view .back-btn');
    if (backBtn) backBtn.onclick = function(){ closeDetail(); };

    // Ingredient toggle
    dc.querySelectorAll('[data-ing]').forEach(function(row) {
      row.onclick = function() {
        var i = parseInt(row.getAttribute('data-ing'));
        ch.ing.has(i) ? ch.ing.delete(i) : ch.ing.add(i);
        var on = ch.ing.has(i);
        var circle = row.querySelector('.rfd-circle');
        var label  = row.querySelector('.rfd-label');
        circle.className = 'rfd-circle' + (on ? ' on' : '');
        circle.innerHTML = on ? CHECK : '';
        label.className  = 'rfd-label'  + (on ? ' on' : '');
      };
    });

    // Step toggle
    dc.querySelectorAll('[data-step]').forEach(function(row) {
      row.onclick = function() {
        var i = parseInt(row.getAttribute('data-step'));
        ch.step.has(i) ? ch.step.delete(i) : ch.step.add(i);
        var on = ch.step.has(i);
        var circle = row.querySelector('.rfd-circle');
        var label  = row.querySelector('.rfd-label');
        circle.className = 'rfd-circle' + (on ? ' on' : '');
        circle.innerHTML = on ? CHECK : '';
        label.className  = 'rfd-label'  + (on ? ' on' : '');
      };
    });

    // Buttons
    var photoBtn = dc.querySelector('[data-photobtn]');
    var editBtn  = dc.querySelector('[data-editbtn]');
    var delBtn   = dc.querySelector('[data-delbtn]');
    var shopBtn  = dc.querySelector('[data-shopbtn]');
    if (photoBtn) photoBtn.onclick = function(){ openPhotoSheet(r); };
    if (editBtn)  editBtn.onclick  = function(){ openEditor(r.id); };
    if (delBtn)   delBtn.onclick   = function(){ deleteRecipe(r.id); };
    if (shopBtn)  shopBtn.onclick  = function(){ addToShop(r); };

    showDetail();
  }

  function closeDetail() {
    showList();
    renderGrid();
  }

  // ── EDITOR ───────────────────────────────────────────────
  function openEditor(id) {
    var r = id ? _recipes.find(function(x){ return String(x.id) === String(id); }) : null;
    if (!window.BottomSheet) return;
    window.BottomSheet.open({
      title: r ? '✏️ Bewerken' : '🍳 Nieuw recept',
      html: '<div class="fam-modal-field"><label>Naam</label><input id="rfe-name" value="'+esc(r?r.name:'')+'"></div>'
        + '<div class="fam-modal-field"><label>Categorie</label><select id="rfe-cat"><option>Ontbijt</option><option>Lunch</option><option>Diner</option><option>Snack</option><option>Dessert</option><option>Bakken</option></select></div>'
        + '<div class="fam-modal-field"><label>Keuken</label><input id="rfe-cuis" value="'+esc(r?r.cuisine||'':'')+'"></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        + '<div class="fam-modal-field"><label>Personen</label><input id="rfe-pers" type="number" value="'+esc(r?r.persons:4)+'"></div>'
        + '<div class="fam-modal-field"><label>Tijd (min)</label><input id="rfe-time" type="number" value="'+esc(r?r.time:30)+'"></div>'
        + '</div>'
        + '<div class="fam-modal-field"><label>Ingrediënten (1 per regel)</label><textarea id="rfe-ings" rows="5">'+esc(r?(r.ingredients||[]).join('\n'):'')+'</textarea></div>'
        + '<div class="fam-modal-field"><label>Stappen (1 per regel)</label><textarea id="rfe-steps" rows="5">'+esc(r?(r.steps||[]).join('\n'):'')+'</textarea></div>'
        + '<div class="fam-modal-field"><label>Notities</label><textarea id="rfe-notes" rows="2">'+esc(r?r.notes||'':'')+'</textarea></div>',
      onOpen: function(ctx) {
        var catEl = ctx.modal.querySelector('#rfe-cat');
        if (catEl && r) catEl.value = r.cat || 'Diner';
        var nameEl = ctx.modal.querySelector('#rfe-name');
        if (nameEl) setTimeout(function(){ nameEl.focus(); }, 80);
      },
      actions: [
        { label: 'Annuleren' },
        { label: 'Opslaan', primary: true, onClick: function(ctx) {
          var m = ctx.modal;
          var name = (m.querySelector('#rfe-name').value||'').trim();
          if (!name) { toast('Naam is verplicht'); return false; }
          var ings = (m.querySelector('#rfe-ings').value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean);
          if (!ings.length) { toast('Voeg minstens 1 ingrediënt toe'); return false; }
          if (r) {
            r.name = name; r.cat = m.querySelector('#rfe-cat').value;
            r.cuisine = (m.querySelector('#rfe-cuis').value||'').trim();
            r.persons = parseInt(m.querySelector('#rfe-pers').value)||4;
            r.time    = parseInt(m.querySelector('#rfe-time').value)||30;
            r.ingredients = ings;
            r.steps   = (m.querySelector('#rfe-steps').value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean);
            r.notes   = m.querySelector('#rfe-notes').value||'';
          } else {
            r = { id:nextId(), name:name, cat:m.querySelector('#rfe-cat').value,
              cuisine:(m.querySelector('#rfe-cuis').value||'').trim(),
              persons:parseInt(m.querySelector('#rfe-pers').value)||4,
              time:parseInt(m.querySelector('#rfe-time').value)||30,
              emoji:CAT_EMOJIS[m.querySelector('#rfe-cat').value]||'🍴', photo:null,
              ingredients:ings,
              steps:(m.querySelector('#rfe-steps').value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean),
              notes:m.querySelector('#rfe-notes').value||'' };
            _recipes.unshift(r);
            xp(4,'Recept aangemaakt');
          }
          save(); toast('Opgeslagen ✓');
          setTimeout(function(){ openDetail(r.id); }, 80);
          return true;
        }}
      ]
    });
  }

  // ── PHOTO SHEET ──────────────────────────────────────────
  function openPhotoSheet(r) {
    if (!window.BottomSheet) return;
    var cur = r.photo || '';
    window.BottomSheet.open({
      title: '📷 Receptfoto',
      html: '<div style="width:100%;height:140px;border-radius:16px;background:var(--c-surface2);background-size:cover;background-position:center;margin-bottom:12px" id="rfp-prev" '+(cur?'style="background-image:url(\''+esc(cur)+'\')"':'')+'></div>'
        + '<div class="fam-modal-field"><label>Foto URL</label><input id="rfp-url" value="'+esc(cur)+'"></div>'
        + '<div style="display:flex;gap:8px;margin-bottom:8px">'
        + '<button type="button" class="rfd-btn" id="rfp-upload">📂 Uploaden</button>'
        + '<input type="file" accept="image/*" id="rfp-file" style="display:none">'
        + '<button type="button" class="rfd-btn" id="rfp-random">✨ Willekeurig</button>'
        + '</div>',
      onOpen: function(ctx) {
        var urlEl  = ctx.modal.querySelector('#rfp-url');
        var prev   = ctx.modal.querySelector('#rfp-prev');
        var upBtn  = ctx.modal.querySelector('#rfp-upload');
        var fileEl = ctx.modal.querySelector('#rfp-file');
        var rndBtn = ctx.modal.querySelector('#rfp-random');
        function setP(src) { if(urlEl) urlEl.value=src||''; if(prev) prev.style.backgroundImage=src?"url('"+src+"')":''; }
        if (urlEl) urlEl.oninput = function(){ setP(urlEl.value); };
        if (upBtn && fileEl) { upBtn.onclick = function(){ fileEl.click(); }; }
        if (fileEl) fileEl.onchange = function(e) {
          var f = e.target.files[0]; if(!f) return;
          var rd = new FileReader();
          rd.onload = function(ev){ setP(ev.target.result); };
          rd.readAsDataURL(f);
        };
        if (rndBtn) rndBtn.onclick = function(){ setP(FALLBACKS[Math.floor(Math.random()*FALLBACKS.length)]); };
      },
      actions: [
        { label: 'Annuleren' },
        { label: 'Opslaan', primary: true, onClick: function(ctx) {
          var url = (ctx.modal.querySelector('#rfp-url').value||'').trim();
          r.photo = url || null;
          save(); toast('Foto opgeslagen ✓');
          setTimeout(function(){ openDetail(r.id); }, 80);
          return true;
        }}
      ]
    });
  }

  // ── DELETE ───────────────────────────────────────────────
  function deleteRecipe(id) {
    var r = _recipes.find(function(x){ return String(x.id) === String(id); });
    if (!r || !confirm('Recept "'+r.name+'" verwijderen?')) return;
    _recipes = _recipes.filter(function(x){ return String(x.id) !== String(id); });
    save(); toast('Verwijderd');
    closeDetail();
  }

  // ── SHOP ────────────────────────────────────────────────
  function addToShop(r) {
    var added = 0;
    (r.ingredients||[]).forEach(function(ing) {
      var match = ing.match(/^([\d\/]+\s*(?:g|kg|ml|l|el|tl|stuks?|blik|teen|teentjes|snuf|takje)?\s+)/i);
      var qty  = match ? match[1].trim() : '1x';
      var name = match ? ing.slice(match[0].length).trim() : ing;
      if (!Array.isArray(window.shopData)) window.shopData = [];
      var exists = window.shopData.some(function(s){ return norm(s.name)===norm(name) && !s.done; });
      if (!exists) {
        if (!window.shopNextId) window.shopNextId = 1;
        window.shopData.unshift({ id:window.shopNextId++, name:name, qty:qty, cat:'Overig', who:window.myName||'', done:false, photo:null });
        added++;
      }
    });
    if (typeof window.updateStats === 'function') window.updateStats();
    toast(added + ' ingrediënten toegevoegd ✓');
  }

  // ── MAIN ENTRY ───────────────────────────────────────────
  function renderRecipes() {
    injectCSS();
    load();
    seed();
    showList();
    setupListView();
    renderGrid();
  }

  // ── LEGACY COMPAT GLOBALS ────────────────────────────────
  window.renderRecipes       = renderRecipes;
  window.renderRecipeGrid    = renderGrid;
  window.openRecipeDetail    = openDetail;
  window.closeRecipeDetail   = closeDetail;
  window.openRecipeEditor    = openEditor;
  window.openRecipeEditSheet = openEditor;
  window.saveRecipe          = function(){};
  window.closeRecipeEditor   = closeDetail;
  window.openRecipePhotoSheet= openPhotoSheet;
  window.addRecipeToShop     = addToShop;
  window.deleteRecipeManaged = deleteRecipe;
  window.CAT_EMOJIS          = CAT_EMOJIS;
  window.recipesData         = _recipes;
  window.recipeNextId        = 1;

  // Boot
  load();
  seed();

})();
