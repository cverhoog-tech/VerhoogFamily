'use strict';
// ============================================================
// EPIC HERO BACKGROUNDS v0.296
// Tagged hero background registry for group quests, dungeons and raids.
// Uses stable remote hero images for now. Later these can be replaced by
// checked-in /public/assets/quest-heroes files without changing callers.
// ============================================================

(function(){
  var HERO_BACKGROUNDS = [
    {
      id: 'group-help-summit',
      title: 'Summit Help',
      url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group'],
      tags: ['group','teamwork','help','partnership','climb','mountain','together'],
      mood: ['warm','heroic','cooperative'],
      priority: 96
    },
    {
      id: 'group-together-sunset',
      title: 'Together at Sunset',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group','adventure'],
      tags: ['group','together','journey','family','friendship','adventure'],
      mood: ['warm','hopeful','premium'],
      priority: 92
    },
    {
      id: 'group-unity-hands',
      title: 'United We Stand',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group'],
      tags: ['group','unity','teamwork','hands','partnership','family'],
      mood: ['social','cooperative'],
      priority: 88
    },
    {
      id: 'group-expedition-mountain',
      title: 'Mountain Expedition',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group','adventure'],
      tags: ['group','expedition','mountain','climb','journey','quest'],
      mood: ['epic','cold','heroic'],
      priority: 90
    },
    {
      id: 'raid-dragon-battle',
      title: 'Dragon Raid',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['raid'],
      tags: ['raid','boss','dragon','battle','epic','combat','challenge'],
      mood: ['dark','intense','epic'],
      priority: 100
    },
    {
      id: 'raid-arena-challenge',
      title: 'Arena Challenge',
      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['raid','pvp'],
      tags: ['raid','arena','battle','challenge','pvp','competition'],
      mood: ['intense','event'],
      priority: 86
    },
    {
      id: 'dungeon-entrance',
      title: 'Dungeon Entrance',
      url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['dungeon'],
      tags: ['dungeon','entrance','mystery','exploration','ruins','ancient'],
      mood: ['dark','mystery'],
      priority: 95
    },
    {
      id: 'dungeon-cave-bridge',
      title: 'Cave Crossing',
      url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['dungeon','adventure'],
      tags: ['dungeon','cave','bridge','explore','deep','adventure'],
      mood: ['dark','adventure'],
      priority: 90
    },
    {
      id: 'adventure-storm-voyage',
      title: 'Storm Voyage',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['adventure','raid'],
      tags: ['adventure','ship','storm','voyage','journey','raid'],
      mood: ['dramatic','epic'],
      priority: 82
    },
    {
      id: 'dungeon-ancient-ruins',
      title: 'Ancient Ruins',
      url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['dungeon'],
      tags: ['dungeon','ruins','ancient','mystery','exploration'],
      mood: ['mystery','warm'],
      priority: 84
    },
    {
      id: 'group-seaside-gathering',
      title: 'Seaside Gathering',
      url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group'],
      tags: ['group','social','together','friendship','family','gathering'],
      mood: ['warm','social'],
      priority: 80
    },
    {
      id: 'group-campfire-quest',
      title: 'Campfire Quest',
      url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group','adventure'],
      tags: ['group','campfire','quest','together','adventure','night'],
      mood: ['warm','cozy','adventure'],
      priority: 78
    }
  ];

  function normalize(value){
    if(!value) return [];
    if(Array.isArray(value)) return value.map(function(v){ return String(v).toLowerCase(); });
    return String(value).toLowerCase().split(/[\s,._/-]+/).filter(Boolean);
  }

  function questWords(quest){
    quest = quest || {};
    return normalize([
      quest.title || '',
      quest.description || '',
      quest.questType || '',
      quest.type || '',
      quest.partyType || '',
      quest.difficulty || '',
      (quest.tags || []).join(' '),
      quest.helpRequested ? 'group teamwork help' : ''
    ].join(' '));
  }

  function scoreBackground(bg, quest, seed){
    var words = questWords(quest);
    var type = String(quest.questType || quest.type || '').toLowerCase();
    var partyType = String(quest.partyType || '').toLowerCase();
    var score = bg.priority || 0;

    if(type && bg.types.indexOf(type) > -1) score += 70;
    if(partyType && bg.types.indexOf(partyType) > -1) score += 70;
    if(quest.helpRequested && bg.types.indexOf('group') > -1) score += 55;

    bg.tags.forEach(function(tag){ if(words.indexOf(tag) > -1) score += 18; });
    bg.mood.forEach(function(tag){ if(words.indexOf(tag) > -1) score += 9; });

    if(words.indexOf('raid') > -1 && bg.types.indexOf('raid') > -1) score += 35;
    if(words.indexOf('dungeon') > -1 && bg.types.indexOf('dungeon') > -1) score += 35;
    if(words.indexOf('group') > -1 && bg.types.indexOf('group') > -1) score += 35;
    if(words.indexOf('pvp') > -1 && bg.types.indexOf('pvp') > -1) score += 35;

    score += ((seed || 0) % 7);
    return score;
  }

  function getHeroBackground(quest){
    quest = quest || {};
    if(quest.background && !quest.autoBackground) return quest.background;
    var seed = Math.abs(String(quest.id || quest.title || '').split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0));
    var ranked = HERO_BACKGROUNDS.slice().sort(function(a,b){
      return scoreBackground(b, quest, seed) - scoreBackground(a, quest, seed);
    });
    return ranked[0].url;
  }

  function getHeroBackgroundMeta(quest){
    quest = quest || {};
    var seed = Math.abs(String(quest.id || quest.title || '').split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0));
    var ranked = HERO_BACKGROUNDS.slice().sort(function(a,b){
      return scoreBackground(b, quest, seed) - scoreBackground(a, quest, seed);
    });
    return ranked[0];
  }

  window.EpicHeroBackgrounds = {
    version: '0.296',
    all: HERO_BACKGROUNDS,
    getHeroBackground: getHeroBackground,
    getHeroBackgroundMeta: getHeroBackgroundMeta
  };
})();
