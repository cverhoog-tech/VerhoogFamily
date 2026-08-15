export const avatarKey = 'familyapp-current-user-avatar-v1'; // migration-only legacy key
export const avatarIdKey = 'familyapp-current-user-avatar-id-v1'; // migration-only legacy key
export const nameKey = 'familyapp-profile-name-v1'; // migration-only legacy key
export const partnerKey = 'familyapp-partner-name-v1'; // migration-only legacy key

const exactAvatarBaseUrl = './src/assets/avatars/exact';
const AVATAR_PREF_PREFIX = 'familyapp-profile-v2:';

export const animeAvatarCollection = [
  { id:'aiden',category:'Anime / Fantasy',label:'Aiden',url:`${exactAvatarBaseUrl}/01-aiden.webp`,rarity:'legendary',objectPosition:'50% 36%' },
  { id:'kai',category:'Anime / Fantasy',label:'Kai',url:`${exactAvatarBaseUrl}/02-kai.webp`,rarity:'legendary',objectPosition:'50% 34%' },
  { id:'liam',category:'Anime / Fantasy',label:'Liam',url:`${exactAvatarBaseUrl}/03-liam.webp`,rarity:'epic',objectPosition:'50% 36%' },
  { id:'asuna',category:'Anime / Fantasy',label:'Asuna',url:`${exactAvatarBaseUrl}/04-asuna.webp`,rarity:'epic',objectPosition:'50% 34%' },
  { id:'elizabeth',category:'Anime / Fantasy',label:'Elizabeth',url:`${exactAvatarBaseUrl}/05-elizabeth.webp`,rarity:'rare',objectPosition:'50% 35%' },
  { id:'mila',category:'Anime / Fantasy',label:'Mila',url:`${exactAvatarBaseUrl}/06-mila.webp`,rarity:'mythic',objectPosition:'50% 35%' },
  { id:'dylan',category:'Realistisch',label:'Dylan',url:`${exactAvatarBaseUrl}/07-dylan.webp`,rarity:'rare',objectPosition:'50% 36%' },
  { id:'ethan',category:'Realistisch',label:'Ethan',url:`${exactAvatarBaseUrl}/08-ethan.webp`,rarity:'legendary',objectPosition:'50% 35%' },
  { id:'noah',category:'Realistisch',label:'Noah',url:`${exactAvatarBaseUrl}/09-noah.webp`,rarity:'rare',objectPosition:'50% 36%' },
  { id:'sophie',category:'Realistisch',label:'Sophie',url:`${exactAvatarBaseUrl}/10-sophie.webp`,rarity:'epic',objectPosition:'50% 36%' },
  { id:'luna',category:'Realistisch',label:'Luna',url:`${exactAvatarBaseUrl}/11-luna.webp`,rarity:'epic',objectPosition:'50% 35%' },
  { id:'zara',category:'Realistisch',label:'Zara',url:`${exactAvatarBaseUrl}/12-zara.webp`,rarity:'mythic',objectPosition:'50% 35%' },
];

function contextSnapshot(){
  try {
    const c=window.HouseholdContext;
    if(!c||!c.current)return null;
    const cur=c.current();
    return cur&&cur.uid&&cur.householdId?{uid:String(cur.uid),householdId:String(cur.householdId)}:null;
  } catch(e){ return null; }
}
function currentMember(){
  try {
    if(window.ProfileContextService&&ProfileContextService.getCurrentMember)return ProfileContextService.getCurrentMember();
  } catch(e){}
  return null;
}
function members(){
  try {
    if(window.ProfileContextService&&ProfileContextService.getMembers)return ProfileContextService.getMembers()||[];
  } catch(e){}
  return [];
}
function prefKey(name){ const c=contextSnapshot(); return c?`${AVATAR_PREF_PREFIX}${c.uid}:${name}`:null; }
function readPref(name){ const k=prefKey(name); if(!k)return null; try{return localStorage.getItem(k);}catch(e){return null;} }
function writePref(name,value){ const k=prefKey(name); if(!k)return; try{ if(value==null)localStorage.removeItem(k); else localStorage.setItem(k,String(value)); }catch(e){} }
function isAvatarUrl(v){ return typeof v==='string' && /^(data:image\/|blob:|https?:|\.?\/)/i.test(v); }
function deterministicAvatarId(seed){
  const s=String(seed||'family-member'); let h=0; for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;
  return animeAvatarCollection[Math.abs(h)%animeAvatarCollection.length].id;
}
function canonicalAvatar(){ const m=currentMember(); const v=m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto); return isAvatarUrl(v)?v:''; }
function canonicalName(){ const m=currentMember(); return String(m&&(m.displayName||m.name)||'Gezinslid'); }

export function avatarUrlForId(id) {
  const found = animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0];
  return found.url;
}
export function avatarMetaForId(id) { return animeAvatarCollection.find((avatar) => avatar.id === id) || animeAvatarCollection[0]; }
export function getProfileName() { return canonicalName(); }
export function getPartnerName() {
  const c=contextSnapshot(); if(!c)return '';
  const other=members().find((m)=>String(m.uid||m.id)!==c.uid);
  return other?String(other.displayName||other.name||'Gezinslid'):'';
}
export function getCurrentAvatarId() {
  const storedId=readPref('avatar-id');
  if(storedId==='upload')return 'upload';
  if(animeAvatarCollection.some((avatar)=>avatar.id===storedId))return storedId;
  const m=currentMember(); return deterministicAvatarId(m&&(m.uid||m.id||m.displayName||m.name));
}
export function getCurrentAvatarUrl() { return canonicalAvatar() || avatarUrlForId(getCurrentAvatarId()); }
async function persistAvatar(url,id){
  const c=contextSnapshot(); if(!c)throw new Error('PROFILE_CONTEXT_REQUIRED');
  if(window.ProfileContextService&&ProfileContextService.updateAvatar)await ProfileContextService.updateAvatar(url);
  else throw new Error('PROFILE_STORE_UNAVAILABLE');
  writePref('avatar-id',id);
  window.dispatchEvent(new CustomEvent('familyapp:avatar-updated',{detail:{id,url,uid:c.uid,householdId:c.householdId}}));
  return url;
}
export function setPresetAvatar(id) { const safe=animeAvatarCollection.some((a)=>a.id===id)?id:'aiden'; return persistAvatar(avatarUrlForId(safe),safe); }
export function setUploadedAvatar(dataUrl) { if(!isAvatarUrl(dataUrl))return Promise.reject(new Error('INVALID_AVATAR')); return persistAvatar(dataUrl,'upload'); }
export function getUserAvatar(author, explicitAvatar) {
  if(isAvatarUrl(explicitAvatar))return explicitAvatar;
  const key=String(author||'');
  const found=members().find((m)=>String(m.uid||m.id)===key || String(m.displayName||m.name||'')===key);
  const url=found&&(found.avatar||found.avatarUrl||found.photoURL||found.profilePhoto);
  if(isAvatarUrl(url))return url;
  return avatarUrlForId(deterministicAvatarId(found&&(found.uid||found.id)||key));
}
