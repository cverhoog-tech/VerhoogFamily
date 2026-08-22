'use strict';
const fs=require('fs');
const assert=require('assert');
const sheet=fs.readFileSync('src/modules/shop/groceryAddSheet.js','utf8');
const shop=fs.readFileSync('src/modules/shop/shop.js','utf8');
const store=fs.readFileSync('src/modules/shop/shoppingListStore.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

assert.ok(sheet.includes('keepOpen:true'),'grocery add sheet must remain open while async save is pending');
assert.ok(sheet.includes('submitBtn.disabled=true'),'submit button must be disabled only while a save is in flight');
assert.ok(sheet.includes('submitBtn.disabled=false'),'failed save must re-enable the submit button instead of freezing the sheet');
assert.ok(sheet.includes('s.addItem(item).then'),'grocery add must write through ShoppingListStore asynchronously');
assert.ok(sheet.includes("if(typeof close==='function')close()"),'successful add must close the sheet only after the write resolves');
assert.ok(shop.includes('GroceryAddSheet.open'),'shopping header add button must open the canonical grocery add sheet');
assert.ok(!store.includes('FamilyDataStore'),'STEP 7 store must not route adds through legacy FamilyDataStore semantics');
assert.ok(loader.includes('shoppingListStore.js?v=1'),'runtime must load the STEP 7 shopping boundary before the shopping renderer');
assert.ok(store.includes('ShoppingListHouseholdRepository'),'ShoppingListStore bundle must install the canonical household repository boundary');
assert.ok(store.indexOf('SHOPPING LIST HOUSEHOLD REPOSITORY')<store.indexOf('SHOPPING LIST STORE v2.0.0'),'repository boundary must be defined before the ShoppingListStore facade');
console.log('grocery add freeze regression contract: PASS');
