'use strict';
// ============================================================
// LEGACY YOUTUBE MUSIC MODULE DISABLED
// Music was removed from FamilyApp app-shell because it created hidden
// floating layers and header/scroll conflicts on mobile Safari.
// ============================================================

(function(){
  function noop(){ return false; }
  window.openYouTubeMusic = noop;
  window.openYTSearch = noop;
  window.openYTQuery = noop;
  window.ytTogglePlay = noop;
  window.ytNext = noop;
  window.ytPrev = noop;
  window.closeYtBar = noop;
})();
