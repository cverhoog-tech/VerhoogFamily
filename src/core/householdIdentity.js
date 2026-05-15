'use strict';
// ============================================================
// HOUSEHOLD IDENTITY v0.305
// Central identity layer for household members.
// Prepares local prototype users for future auth/live sync accounts.
// ============================================================

(function(){
  var VERSION = '0.305';
  var MEMBERS_KEY = 'familyapp_household_members_v001';
  var ACTIVE_MEMBER_KEY = 'familyapp_active_member_id_v001';

  function nowIso(){ return new Date().toISOString(); }

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function initialsFromName(name){
    return String(name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .map(function(part){ return part[0]; })
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  }

  function normalizeMember(member){
    member = member || {};
    var name = member.name || member.displayName || member.fullName || member.id || 'Gezinslid';
    var id = member.id || member.uid || member.memberId || member.userId || String(name).toLowerCase().replace(/\s+/g, '-');
    return {
      id: String(id),
      accountId: member.accountId || member.authUid || null,
      name: name,
      displayName: member.displayName || name,
      initials: member.initials || initialsFromName(name),
      avatar: member.avatar || member.avatarUrl || member.photoURL || member.photoUrl || member.image || member.imageUrl || member.profileImage || member.profileImageUrl || '',
      role: member.role || 'member',
      status: member.status || 'active',
      onlineStatus: member.onlineStatus || 'offline',
      xp: Number(member.xp || 0),
      level: Number(member.level || 1),
      titles: Array.isArray(member.titles) ? member.titles : [],
      activeTitle: member.activeTitle || '',
      abilities: Array.isArray(member.abilities) ? member.abilities : [],
      stats: Object.assign({ questsCompleted: 0, groupJoins: 0, contributions: 0 }, member.stats || {}),
      permissions: Object.assign({ canCreateQuests: true, canJoinQuests: true, canManageHousehold: false }, member.permissions || {}),
      createdAt: member.createdAt || nowIso(),
      updatedAt: nowIso()
    };
  }

  function defaultMembers(){
    return [
      normalizeMember({ id: 'shane', name: 'Shane', initials: 'SH', role: 'owner', permissions: { canCreateQuests: true, canJoinQuests: true, canManageHousehold: true } }),
      normalizeMember({ id: 'esra', name: 'Esra', initials: 'ES', role: 'member' })
    ];
  }

  function readLegacyMembers(){
    var keys = [
      'fam_members',
      'fam_family_members',
      'family_members',
      'fam_profiles',
      'fam_user_profiles',
      'fam_household_members',
      'fam_group_members',
      'fam_group_quest_members_v001'
    ];
    var found = [];
    keys.forEach(function(key){
      var value = safeParse(localStorage.getItem(key), null);
      if(!value) return;
      if(Array.isArray(value)) found = found.concat(value);
      else if(Array.isArray(value.members)) found = found.concat(value.members);
      else if(Array.isArray(value.profiles)) found = found.concat(value.profiles);
      else if(typeof value === 'object'){
        Object.keys(value).forEach(function(id){
          if(value[id] && typeof value[id] === 'object') found.push(Object.assign({ id: id }, value[id]));
        });
      }
    });
    return found;
  }

  function mergeMembers(primary, secondary){
    var byId = {};
    (primary || []).concat(secondary || []).forEach(function(member){
      var normalized = normalizeMember(member);
      var existing = byId[normalized.id] || {};
      byId[normalized.id] = Object.assign({}, existing, normalized, {
        avatar: normalized.avatar || existing.avatar || '',
        titles: normalized.titles && normalized.titles.length ? normalized.titles : (existing.titles || []),
        abilities: normalized.abilities && normalized.abilities.length ? normalized.abilities : (existing.abilities || []),
        stats: Object.assign({}, existing.stats || {}, normalized.stats || {}),
        permissions: Object.assign({}, existing.permissions || {}, normalized.permissions || {})
      });
    });
    return Object.keys(byId).map(function(id){ return byId[id]; });
  }

  function getMembers(){
    var stored = safeParse(localStorage.getItem(MEMBERS_KEY), null);
    if(stored && Array.isArray(stored) && stored.length) return stored.map(normalizeMember);
    var legacy = readLegacyMembers();
    var members = mergeMembers(defaultMembers(), legacy);
    saveMembers(members, { silent: true });
    return members;
  }

  function saveMembers(members, options){
    var normalized = (members || []).map(normalizeMember);
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(normalized));
    if(window.LiveSyncAdapter && typeof window.LiveSyncAdapter.writeCollection === 'function'){
      window.LiveSyncAdapter.writeCollection(MEMBERS_KEY, normalized, 'household-members');
    }
    if(!options || !options.silent){
      window.dispatchEvent(new CustomEvent('familyapp:household-members-updated', { detail: normalized }));
    }
    return normalized;
  }

  function getMember(id){
    var needle = String(id || '').toLowerCase();
    return getMembers().find(function(member){
      return String(member.id).toLowerCase() === needle || String(member.name).toLowerCase() === needle || String(member.displayName).toLowerCase() === needle;
    }) || null;
  }

  function upsertMember(member){
    var normalized = normalizeMember(member);
    var members = getMembers();
    var index = members.findIndex(function(item){ return item.id === normalized.id; });
    if(index >= 0) members[index] = Object.assign({}, members[index], normalized, { updatedAt: nowIso() });
    else members.push(normalized);
    saveMembers(members);
    return normalized;
  }

  function setMemberAvatar(id, avatar){
    var member = getMember(id);
    if(!member) return null;
    member.avatar = avatar || '';
    member.updatedAt = nowIso();
    upsertMember(member);
    return member;
  }

  function getActiveMemberId(){
    return localStorage.getItem(ACTIVE_MEMBER_KEY) || (window.LiveSyncAdapter && window.LiveSyncAdapter.getActiveUser ? window.LiveSyncAdapter.getActiveUser().id : 'shane');
  }

  function getActiveMember(){
    return getMember(getActiveMemberId()) || getMembers()[0] || null;
  }

  function setActiveMember(id){
    var member = getMember(id);
    if(!member) return null;
    localStorage.setItem(ACTIVE_MEMBER_KEY, member.id);
    if(window.LiveSyncAdapter && typeof window.LiveSyncAdapter.setActiveUser === 'function'){
      window.LiveSyncAdapter.setActiveUser({ id: member.id, displayName: member.displayName, avatar: member.avatar, role: member.role });
    }
    window.dispatchEvent(new CustomEvent('familyapp:active-member-updated', { detail: member }));
    return member;
  }

  function getAvatar(id){
    var member = getMember(id);
    return member ? member.avatar : '';
  }

  function getInitials(id){
    var member = getMember(id);
    return member ? member.initials : initialsFromName(id);
  }

  function getProfile(id){
    return getMember(id) || normalizeMember({ id: id, name: id });
  }

  window.HouseholdIdentity = {
    version: VERSION,
    normalizeMember: normalizeMember,
    getMembers: getMembers,
    saveMembers: saveMembers,
    getMember: getMember,
    getProfile: getProfile,
    upsertMember: upsertMember,
    setMemberAvatar: setMemberAvatar,
    getAvatar: getAvatar,
    getInitials: getInitials,
    getActiveMemberId: getActiveMemberId,
    getActiveMember: getActiveMember,
    setActiveMember: setActiveMember
  };

  window.getHouseholdMember = window.getHouseholdMember || getMember;
})();
