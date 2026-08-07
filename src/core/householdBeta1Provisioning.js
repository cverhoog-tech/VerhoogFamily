'use strict';
// ============================================================
// HOUSEHOLD BETA 1 PROVISIONING v1
// Replaces legacy setupNewFamily with the durable Beta-1 household schema.
// ============================================================
(function(){
  if(window.HouseholdBeta1Provisioning) return;
  var VERSION='1.0.0';

  function user(){
    try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(window.firebase&&firebase.auth&&