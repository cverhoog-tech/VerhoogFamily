'use strict';
// HOUSEHOLD BETA 1 PROVISIONING v1.2
(function(){
  if(window.HouseholdBeta1Provisioning) return;
  var VERSION='1.2.0';
  function currentUser(){try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(typeof fbDb!=='undefined'&&fbDb)||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function makeId(d){return d.ref('families').push().key;}
  function createHousehold(name){
    var