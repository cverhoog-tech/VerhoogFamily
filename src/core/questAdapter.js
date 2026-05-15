'use strict';
// ============================================================
// QUEST ADAPTER v0.274
// Bridges existing legacy taskData/group quest data into the new
// QuestEngine model without rewriting current screens yet.
// ============================================================

(function(){
  var ADAPTER_VERSION = '0.274';

  function hasQuestEngine(){
    return !!(window.QuestEngine && typeof window.QuestEngine.normalizeQuest === 'function');
  }

  function initialsToMemberId(value){
    if(!value) return 'shane';
    var v = String(value).toLowerCase();
    if(v === 'sk' || v.indexOf('shane') > -1) return 'shane';
    if(v === 'es' || v.indexOf('esra') > -1) return 'esra';
    if(v === 'gf' || v.indexOf('gezin') > -1 || v.indexOf('family') > -1) return 'family';
    return v.replace(/[^a-z0-9]+/g, '-');
  }

  function parseXp(value){
    if(typeof value === 'number') return value;
    var match = String(value || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function legacyArrayTaskToQuest(row){
    if(!hasQuestEngine() || !Array.isArray(row)) return null;
    var assigned = row[5] ? [initialsToMemberId(row[5])] : [];
    var steps = Array.isArray(row[8]) ? row[8] : [];
    var isGroup = String(row[1] || '').toLowerCase().indexOf('group') > -1 || String(row[13] || '').toLowerCase().indexOf('group') > -1;
    return window.QuestEngine.normalizeQuest({
      id: 'legacy-' + (row[0] || Date.now()),
      title: row[2] || 'Quest',
      description: row[3] || '',
      questType: 'task',
      partyType: isGroup ? 'group' : 'solo',
      status: row[9] ? 'completed' : 'open',
      ownerId: assigned[0] || 'shane',
      assignedMemberIds: assigned,
      acceptedMemberIds: isGroup ? assigned : [],
      helpRequested: isGroup,
      steps: steps,
      rewards: {
        xp: parseXp(row[6]),
        coins: 0
      },
      background: row[7] || null,
      createdAt: row[10] || null,
      updatedAt: new Date().toISOString()
    });
  }

  function legacyObjectTaskToQuest(task){
    if(!hasQuestEngine() || !task) return null;
    var assigned = (task.assigned || task.who || []).map(initialsToMemberId);
    return window.QuestEngine.normalizeQuest({
      id: 'task-' + (task.id || Date.now()),
      title: task.title || 'Taak',
      description: task.description || task.note || '',
      questType: task.recurrence ? 'weekly' : 'task',
      partyType: task.partyType || ((assigned.length > 1) ? 'group' : 'solo'),
      status: task.done ? 'completed' : 'open',
      ownerId: assigned[0] || 'shane',
      assignedMemberIds: assigned,
      acceptedMemberIds: assigned.length > 1 ? assigned : [],
      helpRequested: !!task.helpRequested,
      steps: task.steps || task.subtasks || [],
      rewards: {
        xp: task.xp || task.rewardXp || 4,
        coins: task.coins || 0
      },
      recurrence: task.recurrence || null,
      background: task.background || task.image || null,
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || new Date().toISOString()
    });
  }

  function groupQuestToUnifiedQuest(groupQuest){
    if(!hasQuestEngine() || !groupQuest) return null;
    var members = (groupQuest.members || []).map(function(m){ return m.id; });
    return window.QuestEngine.normalizeQuest({
      id: 'group-' + groupQuest.id,
      title: groupQuest.title,
      description: groupQuest.description,
      questType: groupQuest.type || 'weekly',
      partyType: 'group',
      status: groupQuest.status || 'open',
      ownerId: members[0] || 'shane',
      assignedMemberIds: members,
      acceptedMemberIds: members,
      invitedMemberIds: groupQuest.invitedMemberIds || [],
      helpRequested: true,
      steps: groupQuest.steps || [],
      rewards: {
        xp: groupQuest.xp || 0,
        coins: groupQuest.coinReward || 0,
        multiplier: groupQuest.multiplier || 1
      },
      progress: groupQuest.progress || 0,
      target: groupQuest.target || 1,
      background: groupQuest.background || null,
      updatedAt: new Date().toISOString()
    });
  }

  function getLegacyTaskQuests(){
    if(!hasQuestEngine()) return [];
    var quests = [];
    if(Array.isArray(window.taskData)){
      window.taskData.forEach(function(task){
        var q = Array.isArray(task) ? legacyArrayTaskToQuest(task) : legacyObjectTaskToQuest(task);
        if(q) quests.push(q);
      });
    }
    return quests;
  }

  function getGroupQuestQuests(){
    if(!hasQuestEngine() || typeof window.loadGroupQuests !== 'function') return [];
    return window.loadGroupQuests().map(groupQuestToUnifiedQuest).filter(Boolean);
  }

  function getAllUnifiedQuests(){
    var byId = {};
    getLegacyTaskQuests().concat(getGroupQuestQuests()).forEach(function(q){
      byId[q.id] = q;
    });
    return Object.keys(byId).map(function(id){ return byId[id]; });
  }

  function syncSnapshotToQuestEngine(){
    if(!hasQuestEngine()) return [];
    var quests = getAllUnifiedQuests();
    window.QuestEngine.saveQuests(quests);
    return quests;
  }

  function convertLegacyTaskToGroup(taskId, invitedMemberIds){
    if(!hasQuestEngine()) return null;
    var legacyQuestId = 'task-' + taskId;
    var quests = syncSnapshotToQuestEngine();
    var match = quests.find(function(q){ return q.id === legacyQuestId || q.id === 'legacy-' + taskId; });
    if(!match) return null;
    window.QuestEngine.upsertQuest(match);
    return window.QuestEngine.convertToGroupQuest(match.id, invitedMemberIds || ['esra']);
  }

  window.QuestAdapter = {
    version: ADAPTER_VERSION,
    legacyArrayTaskToQuest: legacyArrayTaskToQuest,
    legacyObjectTaskToQuest: legacyObjectTaskToQuest,
    groupQuestToUnifiedQuest: groupQuestToUnifiedQuest,
    getLegacyTaskQuests: getLegacyTaskQuests,
    getGroupQuestQuests: getGroupQuestQuests,
    getAllUnifiedQuests: getAllUnifiedQuests,
    syncSnapshotToQuestEngine: syncSnapshotToQuestEngine,
    convertLegacyTaskToGroup: convertLegacyTaskToGroup
  };

  window.addEventListener('familyapp:group-quests-updated', function(){
    if(hasQuestEngine()) syncSnapshotToQuestEngine();
  });

  setTimeout(function(){
    if(hasQuestEngine()) syncSnapshotToQuestEngine();
  }, 600);
})();
