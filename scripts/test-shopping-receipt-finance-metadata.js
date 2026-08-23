'use strict';
const fs=require('fs');
const assert=require('assert');

const source=fs.readFileSync('src/modules/shop/shoppingReceiptFinance.js','utf8');

assert.ok(source.includes("version:'1.4.0'"),'receipt bridge version must be bumped');
assert.ok(source.includes('id="receipt-name"'),'receipt modal must expose editable transaction name');
assert.ok(source.includes('id="receipt-category"'),'receipt modal must expose editable category');
assert.ok(source.includes('receipt-category-options'),'receipt category must provide suggestions while remaining free text');
assert.ok(source.includes("'Uitjes'"),'receipt category suggestions should include outings');
assert.ok(source.includes("'Thuisbezorgd'"),'receipt category suggestions should include delivery');
assert.ok(source.includes('name:transactionName'),'Finance transaction name must come from user input');
assert.ok(source.includes('cat:category'),'Finance transaction category must come from user input');
assert.ok(source.includes("sourceType:'shoppingReceipt'"),'receipt bridge must preserve stable source type');
assert.ok(source.includes('sourceId:sourceId'),'receipt bridge must preserve stable source id for idempotent re-processing');
assert.ok(source.includes('FinanceStore.upsertSourceTransaction'),'receipt bridge must remain idempotent through FinanceStore');

console.log('STEP 8 shopping receipt finance metadata contract: PASS');
