'use strict';
// ============================================================
// QUEST ENGINE FOUNDATION v0.273
// Central model helpers for tasks, group quests, journeys and
// future ability/reward/challenge integrations.
//
// This module is intentionally non-invasive for now. Existing UI
// modules can adopt these helpers step-by-step without a risky rewrite.
// ============================================================

(function(){
  var QUEST_ENGINE_VERSION = '0.273';
  var QUESTS_KEY = 'fam_unified_quests_v001';
  var ACTIVITY_KEY = 'fam_activity_events_v001';

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function nowIso(){ return new Date().toISOString(); }

  function uid(prefix){
    return (prefix || 'id') + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function normalizeMemberList(value){
    if(!value) return [];
    if(Array.isArray(value)) return value.filter(Boolean);
    return [value].filter(Boolean);
  }

  function normalizeSteps(steps){
    if(!Array.isArray(steps)) return [];
    return steps.map(function(step, index){
      if(typeof step === 'string'){
        return {
          id: uid('step'),
          title: step,
          status: 'open',
          order: index,
          completedBy: null,
          completedAt: null
        };
      }
      return {
        id: step.id || uid('step'),
        title: step.title || step.name || ('Stap ' + (index + 1)),
        status: step.status || (step.done ? 'completed' : 'open'),
        order: typeof step.order === 'number' ? step.order : index,
        completedBy: step.completedBy || null,
        completedAt: step.completedAt || null
      };
    });
  }

  function calculateProgress(quest){
    var steps = quest.steps || [];
    if(steps.length){
      var done = steps.filter(function(step){ return step.status === 'completed' || step.done; }).length;
      return {
        completed: done,
        total: steps.length,
        percent: Math.round((done / Math.max(1, steps.length)) * 100)
      };
    }
    var target = quest.target || quest.progressTarget || 1;
    var value = quest.progressValue || quest.progress || 0;
    return {
      completed: Math.min(value, target),
      total: target,
      percent: Math.round((Math.min(value, target) / Math.max(1, target)) * 100)
    };
  }

  function normalizeQuest(input){
    var q = input || {};
    var createdAt = q.createdAt || nowIso();
    var quest = {
      id: q.id || uid('quest'),
      title: q.title || 'Nieuwe quest',
      description: q.description || '',
      questType: q.questType || q.type || 'task',
      partyType: q.partyType || 'solo',
      status: q.status || 'open',
      ownerId: q.ownerId || q.owner || 'shane',
      assignedMemberIds: normalizeMemberList(q.assignedMemberIds || q.assigned || q.who),
      invitedMemberIds: normalizeMemberList(q.invitedMemberIds || q.invitedMembers),
      acceptedMemberIds: normalizeMemberList(q.acceptedMemberIds || q.acceptedMembers),
      declinedMemberIds: normalizeMemberList(q.declinedMemberIds || q.declinedMembers),
      helpRequested: !!q.helpRequested,
      steps: normalizeSteps(q.steps || q.subtasks || q.subTasks || []),
      rewards: q.rewards || {
        xp: q.xp || q.rewardXp || 0,
        coins: q.coins || q.coinReward || 0
      },
      abilitiesApplied: q.abilitiesApplied || [],
      challengeModifiers: q.challengeModifiers || [],
      recurrence: q.recurrence || null,
      journeyId: q.journeyId || null,
      chapterId: q.chapterId || null,
      background: q.background || q.heroImage || null,
      createdAt: createdAt,
      updatedAt: q.updatedAt || createdAt
    };
    quest.progress = calculateProgress(quest);
    return quest;
  }

  function loadQuests(){
    return safeParse(localStorage.getItem(QUESTS_KEY), []);
  }

  function saveQuests(quests){
    localStorage.setItem(QUESTS_KEY, JSON.stringify(quests || []));
    window.dispatchEvent(new CustomEvent('familyapp:quests-updated', { detail: { quests: quests || [] } }));
  }

  function upsertQuest(questInput){
    var quest = normalizeQuest(questInput);
    var quests = loadQuests();
    var index = quests.findIndex(function(q){ return q.id === quest.id; });
    quest.updatedAt = nowIso();
    if(index > -1) quests[index] = quest;
    else quests.unshift(quest);
    saveQuests(quests);
    logActivity({
      type: index > -1 ? 'quest.updated' : 'quest.created',
      actorId: quest.ownerId,
      questId: quest.id,
      message: quest.title
    });
    return quest;
  }

  function convertToGroupQuest(questId, memberIds){
    var quests = loadQuests();
    var quest = quests.find(function(q){ return q.id === questId; });
    if(!quest) return null;
    quest.partyType = 'group';
    quest.helpRequested = true;
    quest.invitedMemberIds = Array.from(new Set((quest.invitedMemberIds || []).concat(normalizeMemberList(memberIds))));
    quest.updatedAt = nowIso();
    quest.progress = calculateProgress(quest);
    saveQuests(quests);
    logActivity({
      type: 'quest.help_requested',
      actorId: quest.ownerId,
      questId: quest.id,
      message: quest.title,
      metadata: { invitedMemberIds: quest.invitedMemberIds }
    });
    return quest;
  }

  function acceptQuestInvite(questId, memberId){
    var quests = loadQuests();
    var quest = quests.find(function(q){ return q.id === questId; });
    if(!quest) return null;
    quest.acceptedMemberIds = Array.from(new Set((quest.acceptedMemberIds || []).concat([memberId])));
    quest.invitedMemberIds = (quest.invitedMemberIds || []).filter(function(id){ return id !== memberId; });
    quest.updatedAt = nowIso();
    saveQuests(quests);
    logActivity({
      type: 'quest.invite_accepted',
      actorId: memberId,
      questId: quest.id,
      message: quest.title
    });
    return quest;
  }

  function completeStep(questId, stepId, memberId){
    var quests = loadQuests();
    var quest = quests.find(function(q){ return q.id === questId; });
    if(!quest) return null;
    quest.steps = (quest.steps || []).map(function(step){
      if(step.id !== stepId) return step;
      return Object.assign({}, step, {
        status: 'completed',
        completedBy: memberId || null,
        completedAt: nowIso()
      });
    });
    quest.progress = calculateProgress(quest);
    if(quest.progress.percent >= 100) quest.status = 'completed';
    quest.updatedAt = nowIso();
    saveQuests(quests);
    logActivity({
      type: 'quest.step_completed',
      actorId: memberId || quest.ownerId,
      questId: quest.id,
      message: quest.title,
      metadata: { stepId: stepId }
    });
    return quest;
  }

  function loadActivity(){
    return safeParse(localStorage.getItem(ACTIVITY_KEY), []);
  }

  function logActivity(eventInput){
    var event = Object.assign({
      id: uid('activity'),
      type: 'activity',
      actorId: null,
      targetId: null,
      questId: null,
      journeyId: null,
      challengeId: null,
      abilityId: null,
      message: '',
      metadata: {},
      createdAt: nowIso()
    }, eventInput || {});
    var events = loadActivity();
    events.unshift(event);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events.slice(0, 250)));
    window.dispatchEvent(new CustomEvent('familyapp:activity-event', { detail: { event: event } }));
    return event;
  }

  window.QuestEngine = {
    version: QUEST_ENGINE_VERSION,
    normalizeQuest: normalizeQuest,
    calculateProgress: calculateProgress,
    loadQuests: loadQuests,
    saveQuests: saveQuests,
    upsertQuest: upsertQuest,
    convertToGroupQuest: convertToGroupQuest,
    acceptQuestInvite: acceptQuestInvite,
    completeStep: completeStep,
    logActivity: logActivity,
    loadActivity: loadActivity
  };
})();
