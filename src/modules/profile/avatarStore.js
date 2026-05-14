export const avatarKey = 'familyapp-current-user-avatar-v1';
export const avatarIdKey = 'familyapp-current-user-avatar-id-v1';
export const nameKey = 'familyapp-profile-name-v1';
export const partnerKey = 'familyapp-partner-name-v1';

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

export function avatarUrlForId(id) {
  const found = animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
  return found.url;
}

export function avatarMetaForId(id) {
  return animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
}

export function getProfileName() {
  return localStorage.getItem(nameKey) || 'Shane';
}

export function getPartnerName() {
  return localStorage.getItem(partnerKey) || 'Esra';
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
