'use strict';
(function(){
  if(window.FamilyAppAuthProviders)return;
  // Central provider availability. Apple stays disabled until the Apple
  // Developer + Firebase setup is complete. Microsoft is intentionally kept
  // visible as "Coming soon" but disabled for the current Family & Friends beta.
  window.FamilyAppAuthProviders=Object.freeze({
    google:true,
    email:true,
    microsoft:false,
    apple:false
  });
})();
