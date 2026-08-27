const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // STEP 2B.5 — one canonical visual identity across login, browser and PWA.
    // Install surfaces keep the square PWA variants; login uses a transparent
    // presentation variant so the crest visually belongs to the auth page.
    const brandIcon192 = '/api/brand-icon?variant=192&v=5';
    const brandIcon180 = '/api/brand-icon?variant=180&v=5';
    const brandIcon32 = '/api/brand-icon?variant=32&v=5';
    const brandLogin = '/api/brand-icon?variant=login&v=5-login1';

    html = html.replace('<meta name="apple-mobile-web-app-status-bar-style" content="default">','<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');
    html = html.replace('<meta name="theme-color" content="#f6faf7">','<meta name="theme-color" content="#140724">');
    html = html.replace(
      '<link rel="manifest" href="manifest.json">',
      '<link rel="manifest" href="manifest.json?v=5">\n' +
      '  <meta name="application-name" content="FamilieApp">\n' +
      '  <meta name="apple-mobile-web-app-title" content="FamilieApp">\n' +
      '  <link id="apple-touch-icon" rel="apple-touch-icon" sizes="180x180" href="' + brandIcon180 + '">\n' +
      '  <link id="favicon" rel="icon" type="image/png" sizes="32x32" href="' + brandIcon32 + '">\n' +
      '  <link id="app-icon-192" rel="icon" type="image/png" sizes="192x192" href="' + brandIcon192 + '">\n' +
      '  <link id="shortcut-icon" rel="shortcut icon" type="image/png" href="' + brandIcon32 + '">'
    );
    html = html.replace(
      '<link rel="stylesheet" href="src/styles/app.css?v=3">',
      '<link rel="stylesheet" href="src/styles/app.css?v=3">\n  <link rel="stylesheet" href="src/styles/homePwaShellFix.css?v=1">'
    );
    html = html.replace(
      '<div id="login-logo" style="font-size:56px;margin-bottom:8px">🏠</div>',
      '<div id="login-logo" style="width:108px;height:108px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;box-shadow:none;overflow:visible">' +
      '<img src="' + brandLogin + '" width="108" height="108" alt="FamilieApp" ' +
      'style="display:block;width:108px;height:108px;object-fit:contain;background:transparent;border:0;border-radius:0;box-shadow:none;filter:drop-shadow(0 10px 18px rgba(72,22,126,.16)) drop-shadow(0 2px 5px rgba(214,160,55,.16))">' +
      '</div>'
    );

    html = html.replace('<script src="src/core/store.js"></script>','<script src="src/core/store.js?v=1"></script>');
    html = html.replace('<script src="src/core/utils.js"></script>','<script src="src/core/utils.js?v=2"></script>');
    html = html.replace('<script src="src/core/appIcon.js"></script>','<script src="src/core/appIcon.js?v=6"></script>');
    html = html.replace(
      '<script src="src/core/profile.legacy.js"></script>',
      '<script src="src/core/sessionActions.js?v=1"></script>\n' +
      '  <script src="src/core/avatarIdentityBridge.js?v=2"></script>\n' +
      '  <script src="src/core/householdIdentityFirebaseBridge.js?v=5"></script>\n' +
      '  <script src="src/core/profile.legacy.js?v=2"></script>'
    );
    html = html.replace('<script src="src/core/addSheet.js"></script>','<script src="src/core/addSheet.js?v=1"></script>');
    html = html.replace('<script src="src/core/search.js"></script>','<script src="src/core/search.js?v=1"></script>');
    html = html.replace('<script src="src/core/swipe.js"></script>','<script src="src/core/swipe.js?v=1"></script>');
    html = html.replace('<script src="src/core/dailyBonus.js"></script>','<script src="src/core/dailyBonus.js?v=2"></script>');
    html = html.replace('<script src="src/modules/calendar/calendar.js"></script>','<script src="src/modules/calendar/calendar.js?v=3"></script>');

    html = html.replace(/\s*<script src="src\/modules\/tasks\/quest-overlay\.js"><\/script>\s*/g, '\n');
    html = html.replace('<script src="src/modules/tasks/taskSharedData.js"></script>','<script src="src/modules/tasks/taskHouseholdRepository.js?v=1"></script>\n  <script src="src/modules/tasks/taskSharedData.js?v=5"></script>');
    html = html.replace('<script src="src/modules/tasks/taskUidCreateBridge.js"></script>','<script src="src/modules/tasks/taskUidCreateBridge.js?v=2"></script>');
    html = html.replace(
      '<script src="src/modules/tasks/taskCompactHome.js"></script>',
      '<script src="src/ui/icons/familyAppIconRegistry.js?v=8"></script>\n' +
      '  <script src="src/ui/icons/familyAppIconRenderer.js?v=2"></script>\n' +
      '  <script src="src/ui/icons/familyAppFoodIconResolver.js?v=1"></script>\n' +
      '  <script src="src/modules/tasks/taskCompactHome.js?v=3"></script>'
    );
    html = html.replace('<script src="src/modules/tasks/personTabPremium.js"></script>','<script src="src/core/profileMedia.js?v=3"></script>\n  <script src="src/core/heroBackdropCatalog.js?v=4"></script>\n  <script src="src/core/heroBackdropResolver.js?v=3"></script>\n  <script src="src/modules/profile/heroBackdropUploadService.js?v=4"></script>\n  <script src="src/modules/profile/memberHeroBackgroundRepository.js?v=3"></script>\n  <script src="src/modules/profile/personHeroBackgroundPicker.js?v=3"></script>\n  <script src="src/modules/tasks/personDashboardService.js?v=5"></script>\n  <script src="src/modules/tasks/personTabV2.js?v=9"></script>');
    html = html.replace('<link rel="stylesheet" href="src/styles/quest.css">','<link rel="stylesheet" href="src/styles/quest.css">\n  <link rel="stylesheet" href="src/styles/taskShellThemes.css?v=2">\n  <link rel="stylesheet" href="src/styles/familyAppIcons.css?v=8">\n  <link rel="stylesheet" href="src/styles/personTabV2.css?v=8">\n  <link rel="stylesheet" href="src/styles/personHeroBackgroundPicker.css?v=2">\n  <link rel="stylesheet" href="src/styles/taskDetailControlFix.css?v=2">');
    html = html.replace('<script src="src/modules/tasks/taskDetailPopup.js?v=2"></script>','<script src="src/modules/tasks/taskCreateReadinessFix.js?v=2"></script>\n  <script src="src/modules/tasks/taskDetailPopup.js?v=3"></script>\n  <script src="src/modules/tasks/taskCompactPrimary.js?v=1"></script>\n  <script src="src/modules/tasks/taskSwapRequests.js?v=2"></script>\n  <script src="src/modules/tasks/taskCategoryIcons.js?v=5"></script>\n  <script src="src/modules/tasks/taskHeroTemplates.js?v=6"></script>\n  <script src="src/core/progressionUidBridge.js?v=3"></script>\n  <script src="src/core/legacyXpOverwriteGuard.js?v=1"></script>\n  <script src="src/modules/achievements/achievementUidBridge.js?v=2"></script>\n  <script src="src/modules/tasks/taskRewardBridge.js?v=3"></script>\n  <script src="src/modules/tasks/partyQuestActiveView.js?v=7"></script>\n  <script src="src/modules/tasks/partyQuestHelpUi.js?v=1"></script>\n  <script src="src/modules/tasks/partyQuestCompletionReward.js?v=4"></script>\n  <script src="src/modules/tasks/partyQuestInvites.js?v=8"></script>\n  <script src="src/modules/tasks/taskCompactLifecycle.js?v=1"></script>\n  <script src="src/modules/tasks/taskHouseholdHelpUi.js?v=2"></script>\n  <script src="src/modules/tasks/taskXpViewSync.js?v=1"></script>');
    html = html.replace('<script src="src/modules/achievements/achievements.js"></script>','<script src="src/modules/achievements/achievements.js?v=2"></script>\n  <script src="src/modules/achievements/achievementsPremium.js?v=1"></script>');

    html = html.replace('<script src="src/modules/shop/shop.js"></script>','<script src="src/modules/shop/groceryProductLexicon.js?v=1"></script>\n  <script src="src/ui/icons/familyAppUtilityIconResolver.js?v=5"></script>\n  <script src="src/core/bottomSheet.js?v=1"></script>\n  <script src="src/modules/shop/groceryInputParser.js?v=1"></script>\n  <script src="src/modules/shop/groceryProductClassifier.js?v=4"></script>\n  <script src="src/modules/shop/shoppingListStore.js?v=1"></script>\n  <script src="src/modules/shop/shoppingPageV2.js?v=1"></script>\n  <script src="src/modules/shop/shoppingRecipeDuplicateResolver.js?v=1"></script>\n  <script src="src/modules/shop/groceryAddSheet.js?v=3"></script>\n  <script src="src/modules/shop/shoppingReceiptFinance.js?v=3"></script>');
    html = html.replace('<script src="src/modules/recipes/recipeSharedLive.js"></script>','<script src="src/modules/recipes/recipeHouseholdRepository.js?v=1"></script>\n  <script src="src/modules/recipes/recipeSharedLive.js?v=4"></script>');
    html = html.replace('<script src="src/modules/recipes/recipeEditorPopup.js"></script>','<script src="src/modules/recipes/recipeEditorPopup.js?v=2"></script>');
    html = html.replace('<script src="src/modules/recipes/recipeServerlessLinkImport.js"></script>','<script src="src/modules/recipes/recipeServerlessLinkImport.js?v=2"></script>');
    html = html.replace('<script src="src/modules/recipes/recipes.js"></script>','<script src="src/modules/recipes/recipes.js?v=3"></script>\n  <script src="src/modules/recipes/recipePremiumCardBridge.js?v=2"></script>');
    html = html.replace('<script src="src/modules/meals/meals.js"></script>','<script src="src/modules/meals/mealPlanHouseholdRepository.js?v=1"></script>\n  <script src="src/modules/meals/mealPlanStore.js?v=2"></script>\n  <script src="src/modules/meals/mealPlannerBottomSheetBridge.js?v=2"></script>\n  <script src="src/modules/meals/meals.js?v=4"></script>');

    html = html.replace('<script src="src/modules/tasks/duoQuests.js"></script>','<script src="src/modules/tasks/duoQuests.js?v=3"></script>\n  <script src="src/modules/tasks/taskLegacySyncGuard.js?v=3"></script>\n  <script src="src/core/authProviderConfig.js?v=1"></script>\n  <script src="src/core/appleAuth.js?v=1"></script>\n  <script src="src/core/authenticatedSessionController.js?v=1"></script>\n  <script src="src/core/householdContext.js?v=1"></script>\n  <script src="src/modules/tasks/partyQuestRepository.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestService.js?v=4"></script>\n  <script src="src/core/legacyProfileUidBridge.js?v=1"></script>\n  <script src="src/core/notificationHouseholdRepository.js?v=1"></script>\n  <script src="src/core/notificationStore.js?v=3"></script>\n  <script src="src/core/notificationEvents.js?v=2"></script>\n  <script src="src/core/notificationActions.js?v=4"></script>\n  <script src="src/core/notificationCenter.js?v=2"></script>\n  <script src="src/core/notificationDelivery.js?v=2"></script>\n  <script src="src/core/pushDeviceRegistry.js?v=1"></script>\n  <script src="src/core/pushRegistrationService.js?v=2"></script>\n  <script src="src/core/pushDeliveryBridge.js?v=1"></script>\n  <script src="src/core/pushNotificationSettings.js?v=3"></script>\n  <script src="src/modules/tasks/taskNotificationProjector.js?v=2"></script>\n  <script src="src/modules/tasks/taskSwapNotificationProjector.js?v=2"></script>\n  <script src="src/modules/tasks/partyQuestNotificationProjector.js?v=2"></script>\n  <script src="src/core/progressionStore.js?v=1"></script>\n  <script src="src/core/progressionRuntime.js?v=2"></script>\n  <script src="src/modules/tasks/recurringTaskRewardBridge.js?v=1"></script>\n  <script src="src/core/progressionProducerBridge.js?v=3"></script>\n  <script src="src/modules/skills/skillsProgressionBridge.js?v=4"></script>\n  <script src="src/modules/finance/financeProgressionBridge.js?v=1"></script>\n  <script src="src/platform/admin/platformAdminFoundation.js?v=1"></script>');
    html = html.replace('<script src="src/core/authenticatedSessionController.js?v=1"></script>','<script src="src/core/googleAuthMobileFix.js?v=2"></script>\n  <script src="src/core/householdPlatform.js?v=2"></script>\n  <script src="src/core/householdOnboardingBridge.js?v=1"></script>\n  <script src="src/core/authenticatedSessionController.js?v=3"></script>');
    html = html.replace(/\s*window\.addEventListener\(['"]load['"],\s*function\s*\(\)\s*\{\s*setTimeout\s*\(\s*function\s*\(\)\s*\{[\s\S]*?familyapp-profile-name-v1[\s\S]*?\},\s*600\s*\);\s*\}\);?/g, '\n');
    html = html.replace(/\s*<button class="ttab ttab-trade"[^>]*onclick="openTradeSheet\(\)"[^>]*>🤝<\/button>\s*/g, '\n');
    html = html.replace('<script src="src/modules/feed/feed.js"></script>','<script src="src/modules/feed/feedSharedData.js?v=4"></script>\n  <script src="src/modules/feed/feed.js?v=6"></script>\n  <script src="src/modules/feed/feedInteractionController.js?v=5"></script>\n  <script src="src/platform/activity/householdActivity.js?v=5"></script>\n  <script src="src/modules/feed/feedActivityPresentation.js?v=5"></script>');
    html = html.replace('</body>','<script src="src/modules/tasks/taskOverviewCanonical.js?v=7"></script>\n<script src="src/app/uiConsistencyPolish.js?v=1"></script>\n<script src="src/core/mobileUxFixes.js?v=2"></script></body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FamilyApp loader error: ' + (error && error.message ? error.message : String(error)));
  }
};