'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src','styles','cleaning-room-premium.css'),'utf8');
const compactCss=css.replace(/\s+/g,'');
const v2Css=fs.readFileSync(path.join(root,'src','styles','cleaning.css'),'utf8');
const compactV2Css=v2Css.replace(/\s+/g,'');
const v24Css=fs.readFileSync(path.join(root,'src','styles','cleaning-v24.css'),'utf8');
const overview=fs.readFileSync(path.join(root,'src','modules','cleaning','cleaningOverviewExperience.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'src','modules','cleaning','cleaningRoomWorkflowUx.js'),'utf8');
const screen=fs.readFileSync(path.join(root,'src','modules','cleaning','cleaningScreen.js'),'utf8');

const roomTypes=['living-room','kitchen','bathroom','toilet','kids-room','bedroom','laundry','hall','outdoor'];
const themes=['light','dark'];

function webpDimensions(buffer,label){
  assert.ok(buffer.length>=30,label+' must contain a complete WebP frame');
  assert.strictEqual(buffer.toString('ascii',0,4),'RIFF',label+' must start with RIFF');
  assert.strictEqual(buffer.readUInt32LE(4)+8,buffer.length,label+' RIFF length must match the checked-out file');
  assert.strictEqual(buffer.toString('ascii',8,12),'WEBP',label+' must identify as WebP');

  var offset=12;
  while(offset+8<=buffer.length){
    var fourcc=buffer.toString('ascii',offset,offset+4),chunkSize=buffer.readUInt32LE(offset+4),dataStart=offset+8,dataEnd=dataStart+chunkSize;
    assert.ok(dataEnd<=buffer.length,label+' contains a truncated '+fourcc+' chunk');
    if(fourcc==='VP8 '){
      assert.deepStrictEqual(Array.from(buffer.subarray(dataStart+3,dataStart+6)),[0x9d,0x01,0x2a],label+' must contain a valid VP8 frame header');
      return{width:buffer.readUInt16LE(dataStart+6)&0x3fff,height:buffer.readUInt16LE(dataStart+8)&0x3fff};
    }
    offset=dataEnd+(chunkSize%2);
  }
  assert.fail(label+' has no decodable VP8 image chunk');
}

const hashes=new Set();
const themeBytes={light:0,dark:0};
themes.forEach(function(theme){
  roomTypes.forEach(function(type){
    var label=type+' '+theme+' room image';
    var assetPath=path.join(root,'src','assets','cleaning-rooms',type+'-'+theme+'.webp');
    var buffer=fs.readFileSync(assetPath);
    var hash=crypto.createHash('sha256').update(buffer).digest('hex');
    assert.deepStrictEqual(webpDimensions(buffer,label),{width:960,height:540},label+' must be a mobile-friendly 16:9 image');
    assert.ok(buffer.length>=20000&&buffer.length<=175000,label+' must remain visibly detailed without becoming an oversized PWA payload');
    hashes.add(hash);
    themeBytes[theme]+=buffer.length;
  });
  assert.ok(themeBytes[theme]<=850000,theme+' room set must stay within its mobile payload budget');
});
assert.strictEqual(hashes.size,roomTypes.length*themes.length,'all light and dark room photographs must be visually distinct files');

assert.ok(css.includes('[data-theme*="dark"] #screen-cleaning .cleaning-room-card'),'dark theme selector must cover named dark themes');
assert.ok(compactCss.includes('--room-photo:var(--room-photo-light)'),'light mode must use the canonical light room image');
assert.ok(compactCss.includes('--room-photo:var(--room-photo-dark)'),'dark mode must use the canonical dark room image');
assert.ok(compactCss.includes('background-size:100%100%,cover!important'),'room photography must fill each complete card');
assert.ok(!compactCss.includes('room-atlas-')&&!compactCss.includes('300%300%')&&!compactCss.includes('--room-photo-x'),'runtime CSS must not crop room identity from a shared atlas');
assert.ok(compactCss.includes('rgba(250,248,245,.38)')&&compactCss.includes('rgba(5,10,18,.40)'),'light/dark overlays must remain local and restrained');
assert.ok(compactV2Css.includes('background-size:100%100%,cover'),'Cleaning V2 room cards and detail sheets must use full-bleed photography');
assert.ok(!v2Css.includes('room-atlas-')&&!v24Css.includes('room-atlas-'),'active Cleaning V2 presentation must load individual room images');

roomTypes.forEach(function(type){
  themes.forEach(function(theme){
    var declaration="--room-photo-"+theme+":url('../assets/cleaning-rooms/"+type+'-'+theme+".webp?v=20260912-1')";
    assert.ok(compactCss.includes(declaration),type+' must map to its own '+theme+' photograph');
    var v2Declaration="--cv2-room-photo-"+theme+":url('/src/assets/cleaning-rooms/"+type+'-'+theme+".webp?v=20260912-1')";
    assert.ok(compactV2Css.includes(v2Declaration),type+' must map to its own '+theme+' photograph in Cleaning V2');
  });
});

assert.ok(overview.includes('class="cleaning-planned-room-card" data-cleaning-room-id="'),'Gepland per kamer must identify every room card');
assert.ok(overview.includes('data-cleaning-room-visual="\'+esc(text(room.type)||\'custom\')+\'"'),'Gepland per kamer must use the canonical room type for its photo tile');
assert.ok(screen.includes('data-cv2-room="\'+esc(room.id)+\'" data-room-type="\'+esc(room.type||\'custom\')+\'"'),'Cleaning V2 room cards must receive the canonical room type');
assert.ok(screen.includes('data-cv2-room-new>＋ Kamer</button>'),'room creation must be visibly reachable');
assert.ok(screen.includes('data-cv2-room-edit="\'+esc(room.id)+\'"')&&screen.includes('data-cv2-room-delete="\'+esc(room.id)+\'"'),'room edit and permission-bound delete must be reachable from the room sheet');
assert.ok(compactCss.includes('.cleaning-quick-icon{width:42px!important;height:42px!important')&&css.includes('background-image:url("data:image/svg+xml'),'quick actions must use substantial, consistent line-icon containers');

const touchRule=css.match(/([^{}]+)\{\s*min-width:\s*44px\s*!important;\s*min-height:\s*44px\s*!important;?\s*\}/);
assert.ok(touchRule,'premium room controls must have an authoritative 44x44 touch-target rule');
[
  'cleaning-add-room-button','cleaning-room-toggle-btn','cleaning-room-edit-button','cleaning-room-expand-button',
  'cleaning-room-pause-button','cleaning-room-supplies-button','cleaning-add-routine-button','cleaning-routine-more',
  'cleaning-routine-menu-action','cleaning-icon-button','cleaning-room-order-button','cleaning-routine-edit-button',
  'cleaning-routine-assign-button','cleaning-routine-pause-button','cleaning-routine-remove-button'
].forEach(function(className){
  assert.ok(touchRule[1].includes('#screen-cleaning .'+className),className+' must remain at least 44x44');
});
assert.ok(compactCss.includes('.cleaning-room-primary-action')&&compactCss.includes('min-height:44px!important;height:44px!important'),'primary room action must keep a 44px touch target');

assert.strictEqual((workflow.match(/var VERSION='0\.2\.0';/g)||[]).length,1,'CleaningRoomWorkflowUx version must remain exactly 0.2.0');

console.log('cleaning full-bleed room photography, mapping, management, themes, planned cards and touch targets: ok');
