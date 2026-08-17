'use strict';
// Feed presentation identity adapter. Authorization remains in FeedSharedData.
(function(){
  if(window.FeedContextIdentity)return;
  function current(){try{return window.HouseholdContext&&HouseholdContext.current?HouseholdContext.current():null;}catch(e){return null;}}
  function uid(){var c=current();return c&&c.uid||null;}
  function members(){try{return window.FeedSharedData&&FeedSharedData.members?FeedSharedData.members():[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function name(){var m=member(uid())||{};return m.displayName||m.name||'Gezinslid';}
  function ownPost(post){return!!(post&&post.authorUid&&uid()&&String(post.authorUid)===String(uid()));}
  window.currentUid=uid;
  window.profileName=name;
  window.isOwnFeedPost=ownPost;
  window.FeedContextIdentity={version:'1.0.0',uid:uid,name:name,member:member,isOwnPost:ownPost};
})();
