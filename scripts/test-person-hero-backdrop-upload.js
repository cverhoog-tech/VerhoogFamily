const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const service=read('src/modules/profile/heroBackdropUploadService.js');
const repo=read('src/modules/profile/memberHeroBackgroundRepository.js');
const picker=read('src/modules/profile/personHeroBackgroundPicker.js');
const person=read('src/modules/tasks/personTabV2.js');
const loader=read('api/app.js');
const firebaseConfig=read('firebase.json');

assert(service.includes("String(c.uid)===String(uid)"),'upload service must restrict UI writes to own UID');
assert(service.includes('HouseholdContext.capture')&&service.includes('HouseholdContext.isCurrent'),'upload service must guard stale household context');
assert(service.includes("CLOUD_NAME='rg86slp4'")&&service.includes("UPLOAD_PRESET='fa_hero_91c8f43ad0b6_v1'"),'Cloudinary provider/preset contract missing');
assert(service.includes("api.cloudinary.com/v1_1/")&&service.includes("XMLHttpRequest"),'Cloudinary upload transport missing');
assert(service.includes('MAX_SOURCE_BYTES=15*1024*1024'),'source size validation missing');
assert(service.includes("canvas.toBlob")&&service.includes("'image/webp'"),'client-side resize/compression boundary missing');
assert(service.includes('retireUpload:queueRetirement')&&service.includes('/private/mediaCleanup/cloudinary/'),'retired Cloudinary assets must be tracked privately for later cleanup');
assert(!service.includes('firebase.storage'),'hero upload runtime must not depend on Firebase Storage');
assert(repo.includes("provider:'cloudinary'")&&repo.includes("cloudName:CLOUD_NAME"),'repository must persist Cloudinary provider metadata');
assert(repo.includes('imageUrl:cleanText(upload.imageUrl'),'repository must persist the selected Cloudinary delivery URL');
assert(repo.includes('CLOUDINARY_ORIGIN'),'repository must reject non-canonical upload URLs');
assert(picker.includes('data-phbp-file')&&picker.includes('data-phbp-confirm'),'picker must provide select + confirm flow');
assert(picker.includes('.prepare(file)')&&picker.includes('.upload(activeUid,prepared')&&picker.includes('r.setUpload'),'picker must prepare, upload and persist through canonical boundaries');
assert(picker.includes('retireUpload'),'picker must queue replaced uploads for later signed cleanup');
assert(person.includes('HeroBackdropResolver')&&person.includes('cfg&&cfg.type===\'upload\''),'person tab must render uploaded backdrop config');
assert(!loader.includes('firebase-storage-compat.js'),'Firebase Storage compat SDK must not be served after Cloudinary pivot');
assert(loader.indexOf('heroBackdropUploadService.js')<loader.indexOf('memberHeroBackgroundRepository.js'),'upload service must load before repository/picker');
assert(!firebaseConfig.includes('"storage"'),'firebase.json must not register paid Firebase Storage for this prototype');
assert(!fs.existsSync('storage.rules'),'retired Firebase Storage rules file must stay removed');
console.log('person hero backdrop Cloudinary upload contract OK');
