'use strict';
(function(){
  if(window.FamilyAppAuthProviders)return;
  // Central provider availability. Apple remains disabled until the
  // Firebase Authentication + Apple Developer configuration is complete.
  // Do not expose a non-working login button to users.
  window.FamilyAppAuthProviders=Object.freeze({
    google:true,
    email:true,
    apple:false
  });
})();
