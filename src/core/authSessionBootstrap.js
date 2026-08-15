'use strict';
// ============================================================
// AUTH SESSION BOOTSTRAP v1.0
// Single defensive transition from Firebase auth -> household -> visible app.
// Prevents mobile redirect flows from hiding login before the app can render.
// ============================================================
(function(){
  if(window.__familyAuthSessionBootstrapV1) return;
