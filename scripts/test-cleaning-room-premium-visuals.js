'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'src','styles','cleaning-room-premium.css'),'utf8');
const overview=fs.readFileSync(path.join(root,'src','modules','cleaning','cleaningOverviewExperience.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'src','modules','cleaning','cleaningRoomWorkflowUx.js'),'utf8');

const atlases={
  light:{
    path:path.join(root,'src','assets','cleaning-rooms','room-atlas-light.webp'),
    bytes:427766,
    sha256:'1dd04f4c47b1b4591271b88e1ee4e0cc7405e323c050bedeb91365527dd0ff75'
  },
  dark:{
    path:path.join(root,'src','assets','cleaning-rooms','room-atlas-dark.webp'),
    bytes:349512,
    sha256:'10ae451ed10990e107da8fbf354cbec78a5394c06511ea97e25c368f0d4c95dc'
  }
};

function webpDimensions(buffer,label){
  assert.ok(buffer.length>=30,label+' atlas must contain a complete WebP frame');
  assert.strictEqual(buffer.toString('ascii',0,4),'RIFF',label+' atlas must start with RIFF');
  assert.strictEqual(buffer.readUInt32LE(4)+8,buffer.length,label+' atlas RIFF length must match the checked-out file');
  assert.strictEqual(buffer.toString('ascii',8,12),'WEBP',label+' atlas must identify as WebP');

  var offset=12;
  while(offset+8<=buffer.length){
    var fourcc=buffer.toString('ascii',offset,offset+4),chunkSize=buffer.readUInt32LE(offset+4),dataStart=offset+8,dataEnd=dataStart+chunkSize;
    assert.ok(dataEnd<=buffer.length,label+' atlas contains a truncated '+fourcc+' chunk');
    if(fourcc==='VP8 '){
      assert.deepStrictEqual(Array.from(buffer.subarray(dataStart+3,dataStart+6)),[0x9d,0x01,0x2a],label+' atlas must contain a valid VP8 frame header');
      return{width:buffer.readUInt16LE(dataStart+6)&0x3fff,height:buffer.readUInt16LE(dataStart+8)&0x3fff};
    }
    offset=dataEnd+(chunkSize%2);
  }
  assert.fail(label+' atlas has no decodable VP8 image chunk');
}

Object.keys(atlases).forEach(function(theme){
  var expected=atlases[theme],buffer=fs.readFileSync(expected.path),hash=crypto.createHash('sha256').update(buffer).digest('hex');
  assert.strictEqual(buffer.length,expected.bytes,theme+' atlas byte size changed');
  assert.strictEqual(hash,expected.sha256,theme+' atlas bytes changed');
  assert.deepStrictEqual(webpDimensions(buffer,theme),{width:2304,height:1296},theme+' atlas must contain nine 768x432 tiles');
});

assert.ok(css.includes("--room-photo:url('../assets/cleaning-rooms/room-atlas-light.webp')"),'light mode must load the light atlas');
assert.ok(css.includes("[data-theme*=\"dark\"] #screen-cleaning .cleaning-room-card"),'dark theme selector must cover named dark themes');
assert.ok(css.includes("--room-photo:url('../assets/cleaning-rooms/room-atlas-dark.webp')"),'dark mode must load the dark atlas');
assert.ok(css.includes('background-size:100% 100%,300% 300%!important'),'room photography must use the 3x3 atlas scale');

const positions={
  'living-room':['0%','0%'],
  kitchen:['50%','0%'],
  bathroom:['100%','0%'],
  bedroom:['0%','50%'],
  'kids-room':['50%','50%'],
  toilet:['100%','50%'],
  hall:['0%','100%'],
  laundry:['50%','100%'],
  outdoor:['100%','100%']
};
Object.keys(positions).forEach(function(type){
  var position=positions[type],rule='[data-cleaning-room-visual="'+type+'"]{--room-photo-x:'+position[0]+';--room-photo-y:'+position[1]+'}';
  assert.ok(css.includes(rule),type+' must map to '+position.join(' '));
});

assert.ok(overview.includes('class="cleaning-planned-room-card" data-cleaning-room-id="'),'Gepland per kamer must identify every room card');
assert.ok(overview.includes('data-cleaning-room-visual="\'+esc(text(room.type)||\'custom\')+\'"'),'Gepland per kamer must use the canonical room type for its photo tile');

const touchRule=css.match(/([^{}]+)\{min-width:44px!important;min-height:44px!important\}/);
assert.ok(touchRule,'premium room controls must have an authoritative 44x44 touch-target rule');
[
  'cleaning-add-room-button','cleaning-room-toggle-btn','cleaning-room-edit-button','cleaning-room-expand-button',
  'cleaning-room-pause-button','cleaning-room-supplies-button','cleaning-add-routine-button','cleaning-routine-more',
  'cleaning-routine-menu-action','cleaning-icon-button','cleaning-room-order-button','cleaning-routine-edit-button',
  'cleaning-routine-assign-button','cleaning-routine-pause-button','cleaning-routine-remove-button'
].forEach(function(className){
  assert.ok(touchRule[1].includes('#screen-cleaning .'+className),className+' must remain at least 44x44');
});

assert.strictEqual((workflow.match(/var VERSION='0\.2\.0';/g)||[]).length,1,'CleaningRoomWorkflowUx version must remain exactly 0.2.0');

console.log('cleaning premium room atlases, tile mapping, themes, planned cards and touch targets: ok');
