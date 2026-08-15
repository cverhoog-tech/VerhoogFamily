const fs=require('fs');const assert=require('assert');
const svc=fs.readFileSync('src/modules/home/homeDashboardService.js','utf8');const home=fs.readFileSync('src/modules/home/home.js','utf8');const app=fs.readFileSync('api/app.js','utf8');
assert(svc.includes('HomeDashboardService'));assert(svc.includes('HouseholdContext'));assert(svc.includes('ProfileContextService'));assert(svc.includes('ProgressionStore'));assert(svc.includes('ShoppingLists'));assert(svc.includes('FeedSharedData'));assert(svc.includes('ActivityService'));
assert(!svc.includes('firebase.database().ref'));assert(!svc.includes('fbFamilyId'));assert(!svc.includes('fbUser'));
assert(home.includes('HomeDashboardService'));assert(!home.includes("greet+', '+myName"));assert(!home.includes('activityData.slice'));assert(!home.includes('updateHomeXP();'));assert(!home.includes('shopData.filter'));assert(!home.includes('feedData.length'));
assert(app.includes('src/modules/home/homeDashboardService.js?v=1'));assert(app.indexOf('homeDashboardService.js?v=1')<app.indexOf('home.js?v=2'));
console.log('home context adoption ok');
