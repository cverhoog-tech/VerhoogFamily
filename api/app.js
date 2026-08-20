const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    html = html.replace(/\s*<script src="src\/modules\/tasks\/quest-overlay\.js"><\/script>\s*/g, '\n');
    html = html.replace('<script src="src/modules/tasks/taskSharedData.js"></script>','<script src="src/modules/tasks/taskSharedData.js?v=2"></script>');
    html = html.replace('<script src="src/modules/tasks/personTabPremium.js"></script>','<script src="src/core/profileMedia.js?v=3"></script>\n  <script src="src/core/heroBackdropCatalog.js?v=2"></script>\n  <script src="src/core/heroBackdropResolver.js?v=2"></script>\n  <script src="src/modules/tasks/personDashboardService.js?v=4"></script>\n  <script src="src/modules/tasks/personTabV2.js?v=6"></script>');
    html = html.replace('<link rel="stylesheet" href="src/styles/quest.css">','<link rel="stylesheet" href="src/styles/quest.css">\n  <link rel="stylesheet" href="src/styles/taskShellThemes.css?v=2">\n  <link rel="stylesheet" href="src/styles/personTabV2.css?v=6">\n  <link rel="stylesheet" href="src/styles/taskDetailControlFix.css?v=1">');
    html = html.replace('<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>','<script src="src/modules/tasks/taskCreateReadinessFix.js?v=2"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCompactPrimary.js?v=1"></script>\n  <script src="src/modules/tasks/taskSwapRequests.js?v=2"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=3"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/core/progressionUidBridge.js?v=2"></script>\n  <script src="src/core/legacyXpOverwriteGuard.js?v=1"></script>\n  <script src="src/modules/achievements/achievementUidBridge.js?v=1"></script>\n  <script src="src/modules/tasks/taskRewardBridge.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestActiveView.js?v=5"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestInvites.js?v=4"></script>\n  <script src="src/modules/tasks/taskCompactLifecycle.js?v=1"></script>\n  <script src="src/modules/tasks/taskXpViewSync.js?v=1"></script>');
    html = html.replace('<script src="src/modules/achievements/achievements.js"></script>','<script src="src/modules/achievements/achievements.js?v=2"></script>\n  <script src="src/modules/achievements/achievementsPremium.js?v=1"></script>');

    // STEP 1/2: exactly one authenticated-session bootstrap owner, followed by
    // the read-only household context derived from that session.
    html = html.replace(
      '<script src="src/modules/tasks/duoQuests.js"></script>',
      '<script src="src/modules/tasks/duoQuests.js?v=3"></script>\n  <script src="src/core/authenticatedSessionController.js?v=1"></script>\n  <script src="src/core/householdContext.js?v=1"></script>'
    );

    // Retire the historical 600ms localStorage app reveal. It could expose Home
    // before Firebase auth/household resolution and raced the canonical session.
    html = html.replace(/\s*window\.addEventListener\(['"]load['"],\s*function\s*\(\)\s*\{\s*setTimeout\s*\(\s*function\s*\(\)\s*\{[\s\S]*?familyapp-profile-name-v1[\s\S]*?\},\s*600\s*\);\s*\}\);?/g, '\n');

    // Canonical Feed runtime: social post persistence -> renderer -> transient
    // interaction state -> immutable household activity -> activity presentation.
    html = html.replace(
      '<script src="src/modules/feed/feed.js"></script>',
      '<script src="src/modules/feed/feedSharedData.js?v=4"></script>\n'
      + '  <script src="src/modules/feed/feed.js?v=6"></script>\n'
      + '  <script src="src/modules/feed/feedInteractionController.js?v=5"></script>\n'
      + '  <script src="src/platform/activity/householdActivity.js?v=5"></script>\n'
      + '  <script src="src/modules/feed/feedActivityPresentation.js?v=5"></script>'
    );

    html = html.replace('</body>','<script src="src/modules/tasks/taskOverviewCanonical.js?v=7"></script>\n<script src="src/app/uiConsistencyPolish.js?v=1"></script>\n<script src="src/core/mobileUxFixes.js?v=2"></script>\n<script src="src/app/freshStartReset.js?v=1"></script></body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};
