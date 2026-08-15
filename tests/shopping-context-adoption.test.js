'use strict';
const fs=require('fs');
const assert=require('assert');

function read(p){return fs.readFileSync(p,'utf8');}
const lists=read('src/modules/shop/shoppingLists.js');
const shop=read('src/modules/shop/shop.js');
const add=read('src/core/foodAddBridge.js');
const quick=read('src/core/groceryQuickAddModal.js');
const service=read('src/modules/shop/shoppingListService.js');
const receipt=read('src/modules/shop/shoppingReceiptFinance.js');

assert(lists.includes('HouseholdContext'),'ShoppingLists must use HouseholdContext');
assert(lists.includes('sharedUnsub')&&lists.includes('privateUnsub'),'ShoppingLists must retain unsubscribe handles');
assert(lists.includes('SHOPPING_CONTEXT_CHANGED'),'ShoppingLists must reject stale mutations');
assert(lists.includes('familyapp_active_shopping_list_v2:'),'active list preference must be UID/household scoped');
assert(!shop.includes("localStorage.setItem('familyapp_food_shop_v001'"),'shop.js must not persist a parallel shopping authority');
assert(!shop.includes("HouseholdRepository.write('groceries'"),'shop.js must not write legacy groceries authority');
assert(!add.includes('localStorage.setItem('),'FoodAddBridge must not persist shopping authority');
assert(!add.includes("HouseholdRepository.write('groceries'"),'FoodAddBridge must not write legacy groceries authority');
assert(add.includes('ShoppingLists'),'FoodAddBridge must delegate to ShoppingLists');
assert(quick.includes('ShoppingLists.addItem'),'Quick Add must delegate to ShoppingLists');
assert(quick.includes('HouseholdContext'),'Quick Add must capture household context');
assert(quick.includes('GroceryProductClassifier'),'Quick Add must use the central classifier');
assert(!quick.includes('localStorage.setItem('),'Quick Add must not persist shopping authority');
assert(!quick.includes("HouseholdRepository.write('groceries'"),'Quick Add must not write legacy groceries authority');
assert(service.includes('HouseholdContext'),'ShoppingListService must capture household context');
assert(service.includes('SHOPPING_CONTEXT_CHANGED'),'ShoppingListService must reject stale commands');
assert(receipt.includes('HouseholdContext'),'shopping receipt must capture household context');
assert(receipt.includes("token.householdId+':'+row.key"),'receipt source id must include household scope');
assert(receipt.includes('whoUid:token.uid'),'receipt finance transaction must carry actor UID');
assert(receipt.includes('householdId:token.householdId'),'receipt finance transaction must carry household id');

console.log('shopping-context-adoption: PASS');
