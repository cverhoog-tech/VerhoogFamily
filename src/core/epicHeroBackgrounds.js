'use strict';
// ============================================================
// EPIC HERO BACKGROUNDS v0.299
// Fixed deterministic hero background rotation for group/dungeon/raid.
// Keep this simple and predictable until local asset packs are added.
// ============================================================

(function(){
  var RAID_DUNGEON_BACKGROUNDS = [
    {
      id: 'raid-dragon-boss',
      title: 'Dragon Boss Raid',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['raid','dungeon'],
      tags: ['raid','dungeon','boss','dragon','epic','battle','challenge']
    },
    {
      id: 'dungeon-ancient-ruins',
      title: 'Ancient Dungeon',
      url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['dungeon','raid'],
      tags: ['dungeon','ruins','ancient','exploration','mystery','quest']
    },
    {
      id: 'raid-storm-voyage',
      title: 'Storm Raid',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['raid','dungeon'],
      tags: ['raid','adventure','storm','journey','epic','danger']
    }
  ];

  var GROUP_BACKGROUNDS = [
    {
      id: 'group-mountain-team',
      title: 'Mountain Team Quest',
      url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group'],
      tags: ['group','teamwork','partnership','together','climb','help']
    },
    {
      id: 'group-unity-party',
      title: 'United Party',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group'],
      tags: ['group','unity','family','party','cooperate','help']
    },
    {
      id: 'group-adventure-journey',
      title: 'Shared Adventure',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=92&fm=webp',
      types: ['group','adventure'],
      tags: ['group','adventure','journey','friendship','together']
    }
  ];

  function words(quest){
    quest = quest || {};
    return [quest.title, quest.description, quest.questType, quest.type, quest.partyType, quest.difficulty, (quest.tags || []).join(' '), quest.helpRequested ? 'group help teamwork' : ''].join(' ').toLowerCase();
  }

  function seedIndex(quest, list){
    var key = String((quest && (quest.id || quest.title)) || 'quest');
    var seed = key.split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0);
    return Math.abs(seed) % list.length;
  }

  function isRaidDungeon(quest){
    var text = words(quest);
    var type = String((quest && (quest.questType || quest.type)) || '').toLowerCase();
    return type === 'raid' || type === 'dungeon' || /\b(raid|dungeon|boss|dragon|cave|ruins)\b/.test(text);
  }

  function isGroup(quest){
    var text = words(quest);
    return !!(quest && quest.helpRequested) || quest.partyType === 'group' || /\b(group|teamwork|party|together|help|partnership|family)\b/.test(text);
  }

  function getHeroBackground(quest){
    if(quest && quest.background && !quest.autoBackground) return quest.background;
    if(isRaidDungeon(quest)) return RAID_DUNGEON_BACKGROUNDS[seedIndex(quest, RAID_DUNGEON_BACKGROUNDS)].url;
    if(isGroup(quest)) return GROUP_BACKGROUNDS[seedIndex(quest, GROUP_BACKGROUNDS)].url;
    return GROUP_BACKGROUNDS[seedIndex(quest, GROUP_BACKGROUNDS)].url;
  }

  function getHeroBackgroundMeta(quest){
    if(isRaidDungeon(quest)) return RAID_DUNGEON_BACKGROUNDS[seedIndex(quest, RAID_DUNGEON_BACKGROUNDS)];
    if(isGroup(quest)) return GROUP_BACKGROUNDS[seedIndex(quest, GROUP_BACKGROUNDS)];
    return GROUP_BACKGROUNDS[seedIndex(quest, GROUP_BACKGROUNDS)];
  }

  window.EpicHeroBackgrounds = {
    version: '0.299',
    raidDungeon: RAID_DUNGEON_BACKGROUNDS,
    group: GROUP_BACKGROUNDS,
    all: RAID_DUNGEON_BACKGROUNDS.concat(GROUP_BACKGROUNDS),
    getHeroBackground: getHeroBackground,
    getHeroBackgroundMeta: getHeroBackgroundMeta
  };
})();
