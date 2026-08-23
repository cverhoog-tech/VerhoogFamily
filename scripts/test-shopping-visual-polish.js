'use strict';
const fs=require('fs');
const assert=require('assert');

const page=fs.readFileSync('src/modules/shop/shoppingPageV2.js','utf8');
const sheet=fs.readFileSync('src/modules/shop/groceryAddSheet.js','utf8');
const resolver=fs.readFileSync('src/ui/icons/familyAppUtilityIconResolver.js','utf8');
const basket=fs.readFileSync('src/ui/icons/assets/familyapp-product-basket.svg','utf8');

assert.ok(page.includes("var VERSION='2.1.0'"),'shopping visual polish must be installed');
assert.ok(page.includes('width:23px;height:23px'),'shopping checkbox must be visually slim');
assert.ok(page.includes('border:1.4px solid #9fb39b'),'shopping checkbox must use a light ring');
assert.ok(page.includes('shopv2-product{width:38px;height:38px;background:transparent;border:0;border-radius:0'),'product artwork must not sit inside a square tile/outline');
assert.ok(page.includes("Gezin · live · 0 te kopen"),'restored list selector must show list context and open-count metadata');
assert.ok(page.includes('shopv2-picker{width:100%;display:flex;align-items:center;gap:9px;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;min-height:54px'),'list selector must use the lighter pre-rework card treatment');
assert.ok(page.includes('.shopping-list-option{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px'),'list picker sheet must restore the clearer bordered list-card treatment');
assert.ok(sheet.includes('.grocery-auto-icon,.grocery-icon-preview{width:42px;height:42px;background:transparent;border:0;border-radius:0;box-shadow:none'),'add-sheet product artwork must also be borderless');
assert.ok(resolver.includes("PRODUCT_BASKET='src/ui/icons/assets/familyapp-product-basket.svg?v=1'"),'unknown grocery products must use the dedicated mixed product basket asset');
assert.ok(resolver.includes("if(key==='utilityCategory')return renderProductBasket(clean)"),'unknown/category fallback must render the mixed product basket');
assert.ok(basket.includes('utility-product-basket'),'mixed product basket symbol missing');
assert.ok(basket.includes('#78bdd2')&&basket.includes('#df5b55')&&basket.includes('#62b35a')&&basket.includes('#ef9b43'),'mixed product basket must use blue/red/green/orange product accents');
assert.ok(!basket.toLowerCase().includes('#6c58bd')&&!basket.toLowerCase().includes('#8055bf'),'mixed product basket must not use the previous purple palette');

console.log('STEP 7 shopping visual polish contract: PASS');
