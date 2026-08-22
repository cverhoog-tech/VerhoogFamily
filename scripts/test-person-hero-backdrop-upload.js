const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const service=read('src/modules/profile/heroBackdropUploadService.js');
const repo=read('src/modules/profile/memberHeroBackgroundRepository.js');
const picker=read('src/modules/profile/personHeroBackgroundPicker.js');
const person=read('src/modules/tasks/personTabV2.js');
const loader=read('api/app.js');
const storageRules=read('storage.rules');
const firebaseConfig=read('firebase.json');

assert(service.includes("String(c.uid)===String(uid)"),'upload service must restrict writes to own UID');
assert(service.includes('HouseholdContext.capture')&&service.includes('HouseholdContext.isCurrent'),'upload service must guard stale household context');
assert(service.includes('new Uint8Array(16)')&&service.includes('getRandomValues'),'storage object id must use 128-bit secure randomness');
assert(service.includes("'/hero-backdrops/'"),'scoped hero backdrop storage path missing');
assert(service.includes('MAX_SOURCE_BYTES=15*1024*1024'),'source size validation missing');
assert(service.includes("canvas.toBlob")&&service.includes("'image/webp'"),'client-side resize/compression boundary missing');
assert(service.includes('resolveConfig')&&service.includes('getDownloadURL'),'download URL must be resolved only at presentation boundary');
assert(repo.includes('setUpload'),'repository upload persistence contract missing');
assert(repo.includes("type:'upload',storagePath:storagePath"),'repository must persist storagePath metadata');
assert(!repo.includes('imageUrl:'),'repository must not persist a Firebase download URL/token');
assert(picker.includes('data-phbp-file')&&picker.includes('data-phbp-confirm'),'picker must provide select + confirm flow');
assert(picker.includes('.prepare(file)')&&picker.includes('.upload(activeUid,prepared')&&picker.includes('r.setUpload'),'picker must prepare, upload and persist through canonical boundaries');
assert(person.includes('HeroBackdropUploadService')&&person.includes('resolveConfig'),'person tab must resolve uploaded media inside active session');
assert(loader.includes('firebase-storage-compat.js'),'Firebase Storage compat SDK must be in served runtime');
assert(loader.indexOf('heroBackdropUploadService.js')<loader.indexOf('memberHeroBackgroundRepository.js'),'upload service must load before repository/picker');
assert(storageRules.includes('allow list: if false'),'Storage listing must be denied');
assert(storageRules.includes('request.auth.uid == memberUid'),'Storage writes must be UID-scoped');
assert(storageRules.includes("request.resource.contentType.matches('image/.*')"),'Storage rules must validate image type');
assert(storageRules.includes("request.resource.metadata.familyAppPurpose == 'hero-backdrop'"),'Storage rules must validate FamilyApp purpose metadata');
assert(firebaseConfig.includes('"storage"')&&firebaseConfig.includes('"storage.rules"'),'firebase.json must register Storage rules');
console.log('person hero backdrop upload contract OK');
