const familyIdKey = 'familyapp-current-family-id-v1';
const familyNameKey = 'familyapp-current-family-name-v1';
const currentUserIdKey = 'familyapp-current-user-id-v1';
const currentUserRoleKey = 'familyapp-current-user-role-v1';

function safeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getCurrentFamilyId() {
  let familyId = localStorage.getItem(familyIdKey);
  if (!familyId) {
    familyId = safeId('family');
    localStorage.setItem(familyIdKey, familyId);
  }
  return familyId;
}

export function getCurrentFamilyName() {
  return localStorage.getItem(familyNameKey) || 'Familie Verhoog';
}

export function setCurrentFamilyName(name) {
  localStorage.setItem(familyNameKey, name || 'Mijn gezin');
  window.dispatchEvent(new CustomEvent('familyapp:family-updated', { detail: getFamilyEnvironment() }));
}

export function getCurrentUserId() {
  let userId = localStorage.getItem(currentUserIdKey);
  if (!userId) {
    userId = safeId('user');
    localStorage.setItem(currentUserIdKey, userId);
  }
  return userId;
}

export function getCurrentUserRole() {
  return localStorage.getItem(currentUserRoleKey) || 'owner';
}

export function setCurrentUserRole(role) {
  localStorage.setItem(currentUserRoleKey, role || 'parent');
  window.dispatchEvent(new CustomEvent('familyapp:family-updated', { detail: getFamilyEnvironment() }));
}

export function getFamilyEnvironment() {
  return {
    familyId: getCurrentFamilyId(),
    familyName: getCurrentFamilyName(),
    currentUserId: getCurrentUserId(),
    role: getCurrentUserRole(),
    storageMode: 'local',
    encrypted: false,
    realtime: false,
  };
}

export function familyStorageKey(key) {
  return `familyapp:${getCurrentFamilyId()}:${key}`;
}

export function getFamilyValue(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(familyStorageKey(key));
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export function setFamilyValue(key, value) {
  localStorage.setItem(familyStorageKey(key), JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('familyapp:data-updated', {
    detail: { familyId: getCurrentFamilyId(), key, value },
  }));
}

export function createInviteCode() {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const invite = {
    code,
    familyId: getCurrentFamilyId(),
    familyName: getCurrentFamilyName(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  localStorage.setItem(familyStorageKey('invite'), JSON.stringify(invite));
  return invite;
}

export function joinFamilyWithInvite(invite) {
  if (!invite || !invite.familyId) return false;
  if (invite.expiresAt && Date.now() > invite.expiresAt) return false;
  localStorage.setItem(familyIdKey, invite.familyId);
  localStorage.setItem(familyNameKey, invite.familyName || 'Mijn gezin');
  localStorage.setItem(currentUserRoleKey, 'parent');
  window.dispatchEvent(new CustomEvent('familyapp:family-updated', { detail: getFamilyEnvironment() }));
  return true;
}

export function resetLocalFamilyEnvironment() {
  localStorage.removeItem(familyIdKey);
  localStorage.removeItem(familyNameKey);
  localStorage.removeItem(currentUserIdKey);
  localStorage.removeItem(currentUserRoleKey);
  return getFamilyEnvironment();
}
