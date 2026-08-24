export const avatarKey = 'familyapp-current-user-avatar-v1';
export const avatarIdKey = 'familyapp-current-user-avatar-id-v1';
// Legacy unscoped keys stay exported for old compatibility code only.
// Authenticated profile editing never reads/writes these keys as authority.
export const nameKey = 'familyapp-profile-name-v1';
export const partnerKey = 'familyapp-partner-name-v1';

const scopedNameBase = 'familyapp-profile-name-v2';
const scopedPartnerBase = 'familyapp-partner-name-v2';
const exactAvatarBaseUrl = './src/assets/avatars/exact';

export const animeAvatarCollection = [
  {
    id: 'aiden',
    category: 'Anime / Fantasy',
    label: 'Aiden',
    url: `${exactAvatarBaseUrl}/01-aiden.webp`,
    rarity: 'legendary',
    objectPosition: '50% 36%',
  },
  {
    id: 'kai',
    category: 'Anime / Fantasy',
    label: 'Kai',
    url: `${exactAvatarBaseUrl}/02-kai.webp`,
    rarity: 'legendary',
    objectPosition: '50% 34%',
  },
  {
    id: 'liam',
    category: 'Anime / Fantasy',
    label: 'Liam',
    url: `${exactAvatarBaseUrl}/03-liam.webp`,
    rarity: 'epic',
    objectPosition: '50% 36%',
  },
  {
    id: 'asuna',
    category: 'Anime / Fantasy',
    label: 'Asuna',
    url: `${exactAvatarBaseUrl}/04-asuna.webp`,
    rarity: 'epic',
    objectPosition: '50% 34%',
  },
  {
    id: 'elizabeth',
    category: 'Anime / Fantasy',
    label: 'Elizabeth',
    url: `${exactAvatarBaseUrl}/05-elizabeth.webp`,
    rarity: 'rare',
    objectPosition: '50% 35%',
  },
  {
    id: 'mila',
    category: 'Anime / Fantasy',
    label: 'Mila',
    url: `${exactAvatarBaseUrl}/06-mila.webp`,
    rarity: 'mythic',
    objectPosition: '50% 35%',
  },
  {
    id: 'dylan',
    category: 'Realistisch',
    label: 'Dylan',
    url: `${exactAvatarBaseUrl}/07-dylan.webp`,
    rarity: 'rare',
    objectPosition: '50% 36%',
  },
  {
    id: 'ethan',
    category: 'Realistisch',
    label: 'Ethan',
    url: `${exactAvatarBaseUrl}/08-ethan.webp`,
    rarity: 'legendary',
    objectPosition: '50% 35%',
  },
  {
    id: 'noah',
    category: 'Realistisch',
    label: 'Noah',
    url: `${exactAvatarBaseUrl}/09-noah.webp`,
    rarity: 'rare',
    objectPosition: '50% 36%',
  },
  {
    id: 'sophie',
    category: 'Realistisch',
    label: 'Sophie',
    url: `${exactAvatarBaseUrl}/10-sophie.webp`,
    rarity: 'epic',
    objectPosition: '50% 36%',
  },
  {
    id: 'luna',
    category: 'Realistisch',
    label: 'Luna',
    url: `${exactAvatarBaseUrl}/11-luna.webp`,
    rarity: 'epic',
    objectPosition: '50% 35%',
  },
  {
    id: 'zara',
    category: 'Realistisch',
    label: 'Zara',
    url: `${exactAvatarBaseUrl}/12-zara.webp`,
    rarity: 'mythic',
    objectPosition: '50% 35%',
  },
];

function authUser() {
  try {
    if (window.fbAuth && window.fbAuth.currentUser) return window.fbAuth.currentUser;
  } catch (error) {}
  try {
    if (window.fbUser && window.fbUser.uid) return window.fbUser;
  } catch (error) {}
  try {
    if (window.firebase && typeof window.firebase.auth === 'function') return window.firebase.auth().currentUser || null;
  } catch (error) {}
  return null;
}

function activeUid() {
  try {
    const context = window.HouseholdContext;
    const snapshot = context && typeof context.snapshot === 'function' ? context.snapshot() : null;
    if (snapshot && snapshot.uid) return String(snapshot.uid);
  } catch (error) {}
  const user = authUser();
  return user && user.uid ? String(user.uid) : '';
}

function scopedKey(base, uid) {
  return uid ? `${base}:${uid}` : base;
}

function identityName(uid, user) {
  try {
    const context = window.HouseholdContext;
    const snapshot = context && typeof context.snapshot === 'function' ? context.snapshot() : null;
    if (snapshot && snapshot.ready && String(snapshot.uid || '') === String(uid || '') && window.myName) {
      const householdName = String(window.myName).trim();
      if (householdName) return householdName;
    }
  } catch (error) {}
  if (user && user.displayName) {
    const displayName = String(user.displayName).trim();
    if (displayName) return displayName;
  }
  if (user && user.email) {
    const emailName = String(user.email).split('@')[0].trim();
    if (emailName) return emailName;
  }
  return 'Gezinslid';
}

export function avatarUrlForId(id) {
  const found = animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
  return found.url;
}

export function avatarMetaForId(id) {
  return animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
}

export function getProfileName() {
  const uid = activeUid();
  if (uid) {
    const stored = String(localStorage.getItem(scopedKey(scopedNameBase, uid)) || '').trim();
    if (stored) return stored;
    return identityName(uid, authUser());
  }
  return String(localStorage.getItem(nameKey) || '').trim() || 'Gezinslid';
}

export function getPartnerName() {
  const uid = activeUid();
  if (uid) return String(localStorage.getItem(scopedKey(scopedPartnerBase, uid)) || '').trim();
  return String(localStorage.getItem(partnerKey) || '').trim();
}

export function setProfileNames(name, partner) {
  const uid = activeUid();
  const cleanName = String(name || '').trim();
  const cleanPartner = String(partner || '').trim();
  if (uid) {
    const profileNameKey = scopedKey(scopedNameBase, uid);
    const profilePartnerKey = scopedKey(scopedPartnerBase, uid);
    if (cleanName) localStorage.setItem(profileNameKey, cleanName); else localStorage.removeItem(profileNameKey);
    if (cleanPartner) localStorage.setItem(profilePartnerKey, cleanPartner); else localStorage.removeItem(profilePartnerKey);
  } else {
    if (cleanName) localStorage.setItem(nameKey, cleanName); else localStorage.removeItem(nameKey);
    if (cleanPartner) localStorage.setItem(partnerKey, cleanPartner); else localStorage.removeItem(partnerKey);
  }
  try {
    window.dispatchEvent(new CustomEvent('familyapp:profile-updated', {
      detail: { uid: uid || null, name: cleanName, partner: cleanPartner },
    }));
  } catch (error) {}
}

export function getCurrentAvatarId() {
  const storedId = localStorage.getItem(avatarIdKey);
  if (storedId === 'upload') return 'upload';
  if (animeAvatarCollection.some((avatar) => avatar.id === storedId)) return storedId;
  return 'aiden';
}

export function getCurrentAvatarUrl() {
  const uploaded = localStorage.getItem(avatarKey);
  if (uploaded && uploaded.startsWith('data:')) return uploaded;
  return avatarUrlForId(getCurrentAvatarId());
}

export function setPresetAvatar(id) {
  localStorage.setItem(avatarIdKey, id);
  localStorage.setItem(avatarKey, avatarUrlForId(id));
  window.dispatchEvent(new CustomEvent('familyapp:avatar-updated', { detail: { id, url: avatarUrlForId(id) } }));
}

export function setUploadedAvatar(dataUrl) {
  localStorage.setItem(avatarKey, dataUrl);
  localStorage.setItem(avatarIdKey, 'upload');
  window.dispatchEvent(new CustomEvent('familyapp:avatar-updated', { detail: { id: 'upload', url: dataUrl } }));
}

export function getUserAvatar(author, explicitAvatar) {
  const name = String(author || '').toLowerCase();
  if (name.includes('shane')) return getCurrentAvatarUrl();
  if (explicitAvatar && explicitAvatar.startsWith('data:')) return explicitAvatar;
  if (explicitAvatar && explicitAvatar.includes('/src/assets/avatars/exact/')) return explicitAvatar;
  if (name.includes('esra')) return avatarUrlForId('sophie');
  if (name.includes('sophie')) return avatarUrlForId('sophie');
  if (name.includes('mark')) return avatarUrlForId('ethan');
  if (name.includes('emma')) return avatarUrlForId('elizabeth');
  if (name.includes('boodschappen')) return avatarUrlForId('luna');
  if (name.includes('verjaardag')) return avatarUrlForId('asuna');
  return avatarUrlForId('aiden');
}
