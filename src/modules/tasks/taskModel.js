'use strict';
// ============================================================
// TASK MODEL v0.298b
// Central compatibility layer for legacy array tasks and future object tasks.
// Goal: new code should stop reading/writing raw task indexes directly.
// ============================================================

(function(){
  var LEGACY = {
    id: 0,
    type: 1,
    title: 2,
    description: 3,
    dueDate: 4,
    assignedTo: 5,
    xpReward: 6,
    image: 7,
    subtasks: 8,
    progress: 9,
    recurrence: 10,
    recurrenceDate: 11,
    priority: 12,
    helpRequested: 13,
    helpers: 14
  };

  function isArrayTask(task){ return Array.isArray(task); }
  function isObjectTask(task){ return task && typeof task === 'object' && !Array.isArray(task); }
  function value(task, legacyKey, objectKeys, fallback){
    if(isArrayTask(task)){
      var v = task[LEGACY[legacyKey]];
      return v == null || v === '' ? fallback : v;
    }
    if(isObjectTask(task)){
      for(var i=0; i<objectKeys.length; i++){
        var key = objectKeys[i];
        if(task[key] != null && task[key] !== '') return task[key];
      }
    }
    return fallback;
  }
  function setValue(task, legacyKey, objectKey, val){
    if(isArrayTask(task)) task[LEGACY[legacyKey]] = val;
    else if(isObjectTask(task)) task[objectKey] = val;
    return task;
  }

  function getId(task){ return String(value(task, 'id', ['id'], '')); }
  function getType(task){ return value(task, 'type', ['type', 'questType'], 'SIDE QUEST'); }
  function getTitle(task){ return value(task, 'title', ['title', 'name'], 'Nieuwe taak'); }
  function getDescription(task){ return value(task, 'description', ['description', 'desc', 'notes'], ''); }
  function getDueDate(task){ return value(task, 'dueDate', ['dueDate', 'date', 'deadline'], ''); }
  function getAssignedTo(task){ return value(task, 'assignedTo', ['assignedTo', 'assignee', 'memberId'], ''); }
  function getXpReward(task){ return value(task, 'xpReward', ['xpReward', 'xp', 'reward'], '+10 XP'); }
  function getPriority(task){ return value(task, 'priority', ['priority', 'prio'], 'laag'); }
  function getRecurrence(task){ return value(task, 'recurrence', ['recurrence', 'repeat'], 'once'); }
  function getProgress(task){ return Number(value(task, 'progress', ['progress', 'completedCount'], 0)) || 0; }

  function getImage(task){
    if(!task) return '';
    if(isArrayTask(task)) return task[LEGACY.image] || '';
    return task.imageUrl || task.image || task.photo || task.cover || task.imageDataUrlFallback || '';
  }

  function setImage(task, image){ return setValue(task, 'image', 'imageUrl', image || ''); }
  function setImageStorage(task, path){ if(isObjectTask(task)) task.imageStoragePath = path || ''; return task; }
  function setImageFallback(task, dataUrl){ if(isObjectTask(task)) task.imageDataUrlFallback = dataUrl || ''; else setImage(task, dataUrl || ''); return task; }

  function getSubtasks(task){
    var subtasks = value(task, 'subtasks', ['subtasks', 'steps', 'checklist'], []);
    return Array.isArray(subtasks) ? subtasks : [];
  }
  function setSubtasks(task, subtasks){ return setValue(task, 'subtasks', 'subtasks', Array.isArray(subtasks) ? subtasks : []); }

  function getHelpRequested(task){ return !!value(task, 'helpRequested', ['helpRequested', 'helpState'], false); }
  function setHelpRequested(task, bool){ return setValue(task, 'helpRequested', 'helpRequested', !!bool || bool === 'Hulp gevraagd' ? 'Hulp gevraagd' : ''); }

  function getHelpers(task){
    var helpers = value(task, 'helpers', ['helpers', 'joinedHelpers', 'assistingMembers'], []);
    return Array.isArray(helpers) ? helpers : [];
  }
  function setHelpers(task, helpers){ return setValue(task, 'helpers', 'helpers', Array.isArray(helpers) ? helpers : []); }

  function addHelper(task, helper){
    if(!task || !helper) return task;
    var id = String(helper.memberId || helper.id || helper.name || '');
    var helpers = getHelpers(task).slice();
    if(id && !helpers.some(function(h){ return String(h.memberId || h.id || h.name || '') === id; })){
      helpers.push(Object.assign({ joinedAt: new Date().toISOString(), contribution: 0 }, helper));
      setHelpers(task, helpers);
      setHelpRequested(task, true);
    }
    return task;
  }

  function removeHelper(task, memberId){
    var id = String(memberId || '');
    setHelpers(task, getHelpers(task).filter(function(h){ return String(h.memberId || h.id || h.name || '') !== id; }));
    return task;
  }

  function toObject(task){
    if(!task) return null;
    if(isObjectTask(task)){
      return Object.assign({
        id: getId(task),
        title: getTitle(task),
        description: getDescription(task),
        type: getType(task),
        priority: getPriority(task),
        dueDate: getDueDate(task),
        assignedTo: getAssignedTo(task),
        imageUrl: getImage(task),
        helpRequested: getHelpRequested(task),
        helpers: getHelpers(task),
        subtasks: getSubtasks(task),
        xpReward: getXpReward(task),
        recurrence: getRecurrence(task),
        progress: getProgress(task)
      }, task);
    }
    return {
      id: getId(task),
      type: getType(task),
      title: getTitle(task),
      description: getDescription(task),
      dueDate: getDueDate(task),
      assignedTo: getAssignedTo(task),
      xpReward: getXpReward(task),
      imageUrl: getImage(task),
      imageDataUrlFallback: /^data:image\//.test(getImage(task)) ? getImage(task) : '',
      subtasks: getSubtasks(task),
      progress: getProgress(task),
      recurrence: getRecurrence(task),
      recurrenceDate: value(task, 'recurrenceDate', ['recurrenceDate'], ''),
      priority: getPriority(task),
      helpRequested: getHelpRequested(task),
      helpers: getHelpers(task),
      status: getProgress(task) >= Math.max(1, getSubtasks(task).length) ? 'completed' : 'open'
    };
  }

  function fromLegacyArray(task){ return toObject(task); }

  function toLegacyArray(task){
    if(isArrayTask(task)) return task;
    var obj = toObject(task) || {};
    var arr = [];
    arr[LEGACY.id] = obj.id || ('q' + Date.now());
    arr[LEGACY.type] = obj.type || 'SIDE QUEST';
    arr[LEGACY.title] = obj.title || 'Nieuwe taak';
    arr[LEGACY.description] = obj.description || '';
    arr[LEGACY.dueDate] = obj.dueDate || '';
    arr[LEGACY.assignedTo] = obj.assignedTo || '';
    arr[LEGACY.xpReward] = obj.xpReward || '+10 XP';
    arr[LEGACY.image] = obj.imageUrl || obj.imageDataUrlFallback || obj.image || '';
    arr[LEGACY.subtasks] = Array.isArray(obj.subtasks) ? obj.subtasks : [];
    arr[LEGACY.progress] = Number(obj.progress || 0) || 0;
    arr[LEGACY.recurrence] = obj.recurrence || 'once';
    arr[LEGACY.recurrenceDate] = obj.recurrenceDate || obj.dueDate || '';
    arr[LEGACY.priority] = obj.priority || 'laag';
    arr[LEGACY.helpRequested] = obj.helpRequested ? 'Hulp gevraagd' : '';
    arr[LEGACY.helpers] = Array.isArray(obj.helpers) ? obj.helpers : [];
    return arr;
  }

  function normalizeList(tasks, mode){
    var list = Array.isArray(tasks) ? tasks : [];
    if(mode === 'legacy') return list.map(toLegacyArray);
    if(mode === 'object') return list.map(toObject).filter(Boolean);
    return list;
  }

  window.TaskModel = {
    version: '0.298b',
    LEGACY: LEGACY,
    isArrayTask: isArrayTask,
    isObjectTask: isObjectTask,
    getId: getId,
    getType: getType,
    getTitle: getTitle,
    getDescription: getDescription,
    getDueDate: getDueDate,
    getAssignedTo: getAssignedTo,
    getXpReward: getXpReward,
    getPriority: getPriority,
    getRecurrence: getRecurrence,
    getProgress: getProgress,
    getImage: getImage,
    setImage: setImage,
    setImageStorage: setImageStorage,
    setImageFallback: setImageFallback,
    getSubtasks: getSubtasks,
    setSubtasks: setSubtasks,
    getHelpRequested: getHelpRequested,
    setHelpRequested: setHelpRequested,
    getHelpers: getHelpers,
    setHelpers: setHelpers,
    addHelper: addHelper,
    removeHelper: removeHelper,
    toObject: toObject,
    fromLegacyArray: fromLegacyArray,
    toLegacyArray: toLegacyArray,
    normalizeList: normalizeList
  };
})();
