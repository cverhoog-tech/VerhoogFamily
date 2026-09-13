'use strict';
(function(){
  if(window.FamilyAppAuthProviders)return;
  // Central provider availability. Apple remains disabled until the
  // Apple Developer + Firebase configuration is complete. Microsoft is the
  // second social provider for the Family & Friends beta.
  window.FamilyAppAuthProviders=Object.freeze({
    google:true,
    email:true,
    microsoft:true,
    apple:false
  });
})();
