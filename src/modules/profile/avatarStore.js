export const avatarKey = 'familyapp-current-user-avatar-v1';
export const avatarIdKey = 'familyapp-current-user-avatar-id-v1';
export const nameKey = 'familyapp-profile-name-v1';
export const partnerKey = 'familyapp-partner-name-v1';

const uploadedAvatarBaseUrl = 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/FamilyApp-clean-avatar-background-fix/src/assets/avatars';
const newAvatarRarities = [
  'common','epic','legendary','rare','mythic','rare','common','mythic','epic','common',
  'rare','common','epic','uncommon','celestial','rare','rare','uncommon','legendary','common',
  'epic','legendary','rare','rare','uncommon','mythic','mythic','celestial','epic','epic',
  'legendary','uncommon','rare','uncommon','legendary','mythic','legendary','mythic','rare','common',
  'epic','epic','rare','legendary','epic','uncommon','rare','mythic','epic','legendary',
];

export const animeAvatarCollection = [
  { id: 'shadow-swordsman', category: 'Helden', label: 'Shadow Swordsman', seed: 'shadow-swordsman', bg: 'e8f5e3', rarity: 'legendary' },
  { id: 'gold-knight', category: 'Helden', label: 'Gold Knight', seed: 'gold-knight', bg: 'fff4d8', rarity: 'epic' },
  { id: 'blue-guardian', category: 'Helden', label: 'Blue Guardian', seed: 'blue-guardian', bg: 'e8f7ff', rarity: 'epic' },
  { id: 'ice-ranger', category: 'Helden', label: 'Ice Ranger', seed: 'ice-ranger', bg: 'eaf1ff', rarity: 'rare' },
  { id: 'forest-prince', category: 'Helden', label: 'Forest Prince', seed: 'forest-prince', bg: 'e8fff1', rarity: 'rare' },
  { id: 'fire-fox', category: 'Fantasy', label: 'Fire Fox', seed: 'fire-fox', bg: 'fff1e4', rarity: 'epic' },
  { id: 'sun-lion', category: 'Fantasy', label: 'Sun Lion', seed: 'sun-lion', bg: 'fff7dd', rarity: 'legendary' },
  { id: 'moon-mage', category: 'Fantasy', label: 'Moon Mage', seed: 'moon-mage', bg: 'f3e8ff', rarity: 'epic' },
  { id: 'earth-giant', category: 'Fantasy', label: 'Earth Guardian', seed: 'earth-giant', bg: 'f2efe5', rarity: 'rare' },
  { id: 'rose-healer', category: 'Fantasy', label: 'Rose Healer', seed: 'rose-healer', bg: 'ffeef8', rarity: 'rare' },
  { id: 'cozy-boy', category: 'Cozy', label: 'Cozy Boy', seed: 'cozy-boy', bg: 'f7f7f7', rarity: 'common' },
  { id: 'cozy-girl', category: 'Cozy', label: 'Cozy Girl', seed: 'cozy-girl', bg: 'fff0f8', rarity: 'common' },
  { id: 'cafe-dreamer', category: 'Cozy', label: 'Cafe Dreamer', seed: 'cafe-dreamer', bg: 'fff4e8', rarity: 'common' },
  { id: 'soft-purple', category: 'Cozy', label: 'Soft Purple', seed: 'soft-purple', bg: 'f6f2ff', rarity: 'common' },
  { id: 'pink-spark', category: 'Cozy', label: 'Pink Spark', seed: 'pink-spark', bg: 'ffe8f3', rarity: 'rare' },
  { id: 'cyber-boy', category: 'Modern', label: 'Cyber Boy', seed: 'cyber-boy', bg: 'eef3ff', rarity: 'epic' },
  { id: 'cyber-girl', category: 'Modern', label: 'Cyber Girl', seed: 'cyber-girl', bg: 'f0f7ff', rarity: 'epic' },
  { id: 'tokyo-shadow', category: 'Modern', label: 'Tokyo Shadow', seed: 'tokyo-shadow', bg: 'f1f5f9', rarity: 'rare' },
  { id: 'red-aura', category: 'Modern', label: 'Red Aura', seed: 'red-aura', bg: 'ffe9e9', rarity: 'rare' },
  { id: 'blue-aura', category: 'Modern', label: 'Blue Aura', seed: 'blue-aura', bg: 'e9f0ff', rarity: 'rare' },
  { id: 'family-dad', category: 'Familie', label: 'Anime Dad', seed: 'family-dad', bg: 'e8f5e3', rarity: 'common' },
  { id: 'family-mom', category: 'Familie', label: 'Anime Mom', seed: 'family-mom', bg: 'ffeef8', rarity: 'common' },
  { id: 'teen-boy', category: 'Familie', label: 'Teen Boy', seed: 'teen-boy', bg: 'eef3ff', rarity: 'common' },
  { id: 'teen-girl', category: 'Familie', label: 'Teen Girl', seed: 'teen-girl', bg: 'fff0f8', rarity: 'common' },
  { id: 'kid-hero', category: 'Familie', label: 'Kid Hero', seed: 'kid-hero', bg: 'fff8e8', rarity: 'common' },
  { id: 'real-shane', category: 'Realistisch', label: 'Realistisch 1', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80', rarity: 'common' },
  { id: 'real-esra', category: 'Realistisch', label: 'Realistisch 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80', rarity: 'common' },
  ...newAvatarRarities.map((rarity, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `anime-${number}`,
      category: 'Nieuwe avatars',
      label: `Avatar ${number}`,
      url: `${uploadedAvatarBaseUrl}/avatar-${number}.webp`,
      rarity,
    };
  }),
];

export function avatarUrlForId(id) {
  const found = animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
  if (found.url) return found.url;
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(found.seed)}&backgroundColor=${found.bg}`;
}

export function getProfileName() {
  return localStorage.getItem(nameKey) || 'Shane';
}

export function getPartnerName() {
  return localStorage.getItem(partnerKey) || 'Esra';
}

export function getCurrentAvatarId() {
  return localStorage.getItem(avatarIdKey) || 'shadow-swordsman';
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
  if (explicitAvatar && (explicitAvatar.includes('dicebear') || explicitAvatar.includes('images.unsplash.com') || explicitAvatar.includes('raw.githubusercontent.com'))) return explicitAvatar;
  if (name.includes('esra')) return avatarUrlForId('family-mom');
  if (name.includes('sophie')) return avatarUrlForId('teen-girl');
  if (name.includes('mark')) return avatarUrlForId('family-dad');
  if (name.includes('emma')) return avatarUrlForId('kid-hero');
  if (name.includes('boodschappen')) return avatarUrlForId('cozy-girl');
  if (name.includes('verjaardag')) return avatarUrlForId('kid-hero');
  return avatarUrlForId('cozy-boy');
}
