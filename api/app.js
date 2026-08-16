const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    html = html.replace(/\s*<script src="src\/modules\/tasks\/quest-overlay\.js"><\/script>\s*/g, '\n');
    html = html.replace('<script src="src/modules/tasks/taskSharedData.js"></script>','<script src="src/modules/tasks/taskSharedData.js?v=3"></script>\n  <script src="src/modules/tasks/taskContextBoundary.js?v=1"></script>');
    html = html.replace('<script src="src/modules/tasks/personTabPremium.js"></script>','<script src="src/modules/tasks/personDashboardService.js?v=3"></script>\n  <script src="src/modules/tasks/personTabPremium.js?v=44"></script>');
    html = html.replace('<script src="src/modules/home/home.js"></script>','<script src="src/modules/home/homeDashboardService.js?v=1"></script>\n  <script src="src/modules/home/home.js?v=2"></script>');
    html = html.replace('<script src="src/core/autocomplete.js"></script>','<script src="src/core/searchContextService.js?v=2"></script>\n  <script src="src/core/autocomplete.js?v=2"></script>\n  <script src="src/core/autocompleteContextBridge.js?v=1"></script>');
    html = html.replace('<script src="src/core/search.js"></script>','<script src="src/core/search.js?v=2"></script>');
    html = html.replace('<link rel="stylesheet" href="src/styles/quest.css">','<link rel="stylesheet" href="src/styles/quest.css">\n  <link rel="stylesheet" href="src/styles/personTabLayoutFix.css?v=2">\n  <link rel="stylesheet" href="src/styles/taskDetailControlFix.css?v=1">');
    html = html.replace('<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>','<script src="src/modules/tasks/taskCreateReadinessFix.js?v=3"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCompactPrimary.js?v=1"></script>\n  <script src="src/modules/tasks/taskSwapRequests.js?v=2"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=3"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/core/progressionEngine.js?v=2"></script>\n  <script src="src/core/progressionStore.js?v=2"></script>\n  <script src="src/core/progressionUidBridge.js?v=3"></script>\n  <script src="src/modules/achievements/achievementUidBridge.js?v=2"></script>\n  <script src="src/modules/tasks/taskRewardBridge.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestContextService.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestActiveContextView.js?v=1"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=3"></script>\n  <script src="src/modules/tasks/partyQuestContextUi.js?v=1"></script>\n  <script src="src/modules/tasks/taskCompactLifecycle.js?v=1"></script>\n  <script src="src/modules/tasks/taskXpViewSync.js?v=1"></script>');
    html = html.replace('<script src="src/modules/achievements/achievements.js"></script>','<script src="src/modules/achievements/achievements.js?v=2"></script>\n  <script src="src/modules/achievements/achievementsPremium.js?v=1"></script>');

    html = html.replace(
      '<script src="src/modules/feed/feed.js"></script>',
      '<script src="src/modules/feed/feedSharedData.js?v=5"></script>\n'
      + '  <script src="src/modules/feed/feed.js?v=6"></script>\n'
      + '  <script src="src/modules/feed/feedContextIdentity.js?v=1"></script>\n'
      + '  <script src="src/modules/feed/feedInteractionController.js?v=5"></script>\n'
      + '  <script src="src/platform/activity/householdActivity.js?v=7"></script>\n'
      + '  <script src="src/platform/activity/activityDomainProducers.js?v=1"></script>\n'
      + '  <script src="src/modules/feed/feedActivityPresentation.js?v=5"></script>'
    );

    html = html.replace(
      '<script src="src/modules/tasks/duoQuests.js"></script>',
      '<script src="src/modules/tasks/duoQuests.js"></script>\n'
      + '  <script src="src/core/householdPlatform.js?v=2"></script>\n'
      + '  <script src="src/core/householdInviteLifecycle.js?v=1"></script>\n'
      + '  <script src="src/core/householdIdentityFirebaseBridge.js?v=4"></script>\n'
      + '  <script src="src/core/householdSessionHardening.js?v=2"></script>\n'
      + '  <script src="src/core/authSessionBootstrap.js?v=2"></script>\n'
      + '  <script src="src/core/householdContext.js?v=1"></script>\n'
      + '  <script src="src/core/familyDataContract.js?v=2"></script>\n'
      + '  <script src="src/modules/profile/profileContextService.js?v=1"></script>\n'
      + '  <script src="src/modules/profile/profileRuntimeContextBridge.js?v=2"></script>'
    );

    html = html.replace('<script src="src/modules/meals/mealPlanStore.js"></script>','<script src="src/modules/meals/mealPlanStore.js?v=2"></script>');
    html = html.replace('<script src="src/modules/meals/mealPlannerBottomSheetBridge.js"></script>','<script src="src/modules/meals/mealPlannerBottomSheetBridge.js?v=1"></script>\n  <script src="src/modules/meals/mealPlannerContextGuard.js?v=1"></script>');

    html = html.replace('</body>','<script src="src/modules/skills/skillsProgressionBridge.js?v=4"></script>\n<script src="src/modules/tasks/taskOverviewCanonical.js?v=5"></script>\n<script src="src/app/uiConsistencyPolish.js?v=1"></script>\n<script src="src/core/mobileUxFixes.js?v=2"></script>\n<script src="src/app/freshStartReset.js?v=1"></script>\n<script src="src/core/legacyAuthorityRetirement.js?v=1"></script></body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};