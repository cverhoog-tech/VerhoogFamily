'use strict';
const fs=require('fs');
const assert=require('assert');

const source=fs.readFileSync('src/modules/shop/shoppingReceiptFinance.js','utf8');

assert.ok(source.includes("version:'1.6.0'"),'receipt bridge version must be current');
assert.ok(source.includes('id="receipt-name"'),'receipt modal must expose editable transaction name');
assert.ok(source.includes('<select id="receipt-category">'),'receipt category must be a fixed select');
assert.ok(!source.includes('receipt-category-options'),'receipt category must no longer use free-text datalist suggestions');
assert.ok(source.includes('<option value="">Geen categorie</option>'),'receipt category must allow an explicit empty choice');
assert.ok(source.includes("'Boodschappen'"),'fixed categories should include groceries');
assert.ok(source.includes("'Uitjes'"),'fixed categories should include outings');
assert.ok(source.includes("'Thuisbezorgd'"),'fixed categories should include delivery');
assert.ok(source.includes('normalizeCategory'),'receipt category must be validated against the fixed set');
assert.ok(source.includes("RECEIPT_CATEGORIES.indexOf(value)>=0?value:''"),'unknown category values must normalize to empty');
assert.ok(source.includes('name:transactionName'),'Finance transaction name must come from user input');
assert.ok(source.includes('cat:category'),'Finance transaction category must use the normalized fixed choice');
assert.ok(source.includes('shoppingItemsSnapshot:snapshot'),'Finance receipt transaction must retain an item snapshot for history/analysis');
assert.ok(source.includes('shoppingItemCount:bought.length'),'Finance receipt transaction must retain purchased-item count');
assert.ok(source.includes("sourceType:'shoppingReceipt'"),'receipt bridge must preserve stable source type');
assert.ok(source.includes('receiptSourceId(row,bought)'),'receipt source id must identify the exact purchased batch, not only the shopping list');
assert.ok(!source.includes('var sourceId=row.key;'),'list-level source ids would overwrite older receipts from the same shopping list');
assert.ok(source.includes("keys=processedItemKeys(items).sort()"),'receipt batch identity must be deterministic across retries');
assert.ok(source.includes("+'__receipt_'+hashText(keys.join('|'))"),'different purchased batches on one list must receive distinct source ids');
assert.ok(source.includes('FinanceStore.upsertSourceTransaction'),'receipt bridge must remain idempotent through FinanceStore');
assert.ok(source.includes('repo.clearDone(row.scope,row.list.id,keys)'),'cleanup must delete only the exact processed purchased keys');
assert.ok(source.includes('function onProcessed(fn)'),'receipt bridge must expose the STEP 13.2 post-success domain signal');
assert.ok(source.includes('emitProcessed({sourceId:sourceId'),'receipt bridge must emit the stable receipt source id after Finance success');

const writeIndex=source.indexOf('FinanceStore.upsertSourceTransaction');
const clearIndex=source.indexOf('return clearProcessedItems(row,bought)',writeIndex);
assert.ok(writeIndex>=0&&clearIndex>writeIndex,'purchased items may only be cleared after the Finance write succeeds');

console.log('STEP 8/13 shopping receipt finance metadata + cleanup contract: PASS');
