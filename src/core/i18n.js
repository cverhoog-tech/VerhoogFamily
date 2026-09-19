(function () {
  'use strict';

  var STORAGE_KEY = 'familyapp-language-v1';
  var DEFAULT_LANGUAGE = 'nl';
  var SYSTEM_VALUE = 'system';

  var supported = [
    { code: 'nl', locale: 'nl-NL', nativeName: 'Nederlands' },
    { code: 'en', locale: 'en-GB', nativeName: 'English' },
    { code: 'tr', locale: 'tr-TR', nativeName: 'Türkçe' },
    { code: 'pl', locale: 'pl-PL', nativeName: 'Polski' },
    { code: 'ro', locale: 'ro-RO', nativeName: 'Română' }
  ];

  var localeByCode = supported.reduce(function (acc, item) {
    acc[item.code] = item.locale;
    return acc;
  }, {});

  var dictionaries = {
    nl: {
      'nav.home': 'Home',
      'nav.tasks': 'Taken',
      'nav.notes': 'Notities',
      'nav.shop': 'Boodschappen',
      'nav.calendar': 'Agenda',
      'nav.finance': 'Financiën',
      'nav.achievements': 'Achievements',
      'nav.notifications': 'Meldingen',
      'nav.profile': 'Profiel',
      'nav.recipes': 'Recepten',
      'nav.skills': 'Skills',
      'nav.meals': 'Maaltijden',
      'nav.templates': 'Templates',
      'nav.cleaning': 'Schoonmaken',
      'nav.feed': 'Feed',
      'nav.more': 'Meer',
      'nav.customize': 'Aanpassen',
      'nav.empty': 'Leeg',
      'nav.config.title': '📱 Navigatiebalk aanpassen',
      'nav.config.subtitle': 'Tik op een vakje om te wijzigen. Midden is altijd Feed.',
      'nav.config.chooseScreen': 'Kies een scherm',
      'nav.config.tapSlot': '👆 Tik op een vakje om te wijzigen',
      'nav.config.saved': 'Navigatie opgeslagen ✓',

      'screen.home': 'FamilieApp 🌿',
      'screen.tasks': 'Taken',
      'screen.feed': 'Feed',
      'screen.notes': 'Notities',
      'screen.shop': 'Boodschappen',
      'screen.calendar': 'Agenda',
      'screen.finance': 'Financiën',
      'screen.notifications': 'Meldingen',
      'screen.achievements': '🏆 Achievements',
      'screen.profile': 'Profiel',
      'screen.recipes': 'Recepten 🍳',
      'screen.skills': '⚡ Skills',
      'screen.meals': '🗓️ Maaltijdplanner',
      'screen.templates': '📋 Taak Templates',
      'screen.cleaning': 'Schoonmaken',

      'home.greeting.morning': 'Goedemorgen, {{name}}',
      'home.greeting.afternoon': 'Goedemiddag, {{name}}',
      'home.greeting.evening': 'Goedenavond, {{name}}',
      'home.cards.tasks': 'taken',
      'home.cards.shop': 'boodschappen',
      'home.cards.cleaning': 'schoonmaken',
      'home.carousel.recipes.title': 'Recepten',
      'home.carousel.recipes.tagline': 'Ontdek heerlijke recepten voor elke gelegenheid',
      'home.carousel.recipes.button': 'Bekijk recepten',
      'home.carousel.calendar.title': 'Agenda',
      'home.carousel.calendar.tagline': 'Houd je afspraken bij en blijf georganiseerd',
      'home.carousel.calendar.button': 'Bekijk agenda',
      'home.carousel.meals.title': 'Maaltijden',
      'home.carousel.meals.tagline': 'Plan je maaltijden met het gezin',
      'home.carousel.meals.button': 'Bekijk maaltijden',
      'home.activity': 'Activiteit',
      'home.music': 'Muziek',
      'home.theme.toggle': 'Wissel lichte en donkere modus',
      'common.previous': 'Vorige',
      'common.next': 'Volgende',

      'profile.language.title': 'Taal',
      'profile.language.subtitle': 'Kies de taal van FamilyApp op dit apparaat.',
      'profile.language.system': 'Systeemstandaard',
      'profile.language.changed': 'Taal aangepast',
      'profile.install.installedTitle': 'FamilyApp geïnstalleerd',
      'profile.install.installedCopy': 'Je gebruikt FamilyApp al vanaf je beginscherm.',
      'profile.install.iosCopy': 'Zet FamilyApp op je beginscherm voor een app-achtige ervaring zonder browserbalk.',
      'profile.install.browserCopy': 'Installeer FamilyApp op je telefoon en open hem voortaan direct vanaf je beginscherm.',
      'profile.install.homeTitle': 'FamilyApp op beginscherm',
      'profile.install.how': 'Hoe zet ik hem op mijn beginscherm?',
      'profile.install.button': 'Installeer FamilyApp',
      'profile.install.shareAria': 'iOS deelknop',
      'profile.install.step1': 'Tik onderin Safari op de deelknop.',
      'profile.install.step1hint': 'Dit is het vierkantje met het pijltje omhoog.',
      'profile.install.step2': 'Kies Zet op beginscherm.',
      'profile.install.step3': 'Tik op Voeg toe. Daarna opent FamilyApp als losse app.',
      'profile.install.browserSteps': 'De automatische installatieprompt is in deze browser nog niet beschikbaar. Open het browsermenu en kies App installeren of Toevoegen aan beginscherm.',
      'profile.install.modalTitle': 'Zet FamilyApp op je beginscherm',
      'profile.install.modalSubtitle': 'Eenmalig instellen, daarna open je hem als app.',
      'profile.install.gotIt': 'Begrepen',
      'profile.saved': 'Profiel opgeslagen',
      'profile.logoutUnavailable': 'Uitloggen is tijdelijk niet beschikbaar',
      'profile.scaleChanged': 'UI schaal ingesteld op {{scale}}%',
      'profile.install.installing': 'FamilyApp wordt geïnstalleerd',
      'profile.install.already': 'FamilyApp is al geïnstalleerd',
      'profile.avatar.updated': 'Avatar bijgewerkt',
      'profile.avatar.chosen': 'Avatar gekozen',
      'profile.notificationsUnavailable': 'Meldingen openen is tijdelijk niet beschikbaar',
      'profile.avatar.choose': 'Kies een avatar',
      'profile.avatar.change': 'Avatar wijzigen',
      'profile.activeAccount': 'Actief account',
      'profile.emailUnavailable': 'E-mailadres niet beschikbaar',
      'profile.myName': 'Mijn naam',
      'profile.partnerName': 'Partner naam',
      'profile.optional': 'Optioneel',
      'profile.avatar.info': 'Je gekozen avatar wordt direct gebruikt in feed, reacties en profiel.',
      'profile.avatar.mine': 'Mijn avatar',
      'profile.avatar.chooseApp': 'Kies uit de app',
      'profile.avatar.upload': 'Upload foto',
      'profile.scale.title': 'UI schaal',
      'profile.scale.copy': 'Vergroot of verklein de volledige app. De keuze blijft bewaard op dit apparaat.',
      'profile.settings.account': 'Account instellingen',
      'profile.settings.privacy': 'Privacy',
      'profile.settings.notifications': 'Meldingen',
      'profile.settings.logout': 'Uitloggen',
      'profile.category.all': 'Alle',

      'tasks.count': {
        one: '{{count}} taak',
        other: '{{count}} taken'
      }
    },

    en: {
      'nav.home': 'Home',
      'nav.tasks': 'Tasks',
      'nav.notes': 'Notes',
      'nav.shop': 'Groceries',
      'nav.calendar': 'Calendar',
      'nav.finance': 'Finances',
      'nav.achievements': 'Achievements',
      'nav.notifications': 'Notifications',
      'nav.profile': 'Profile',
      'nav.recipes': 'Recipes',
      'nav.skills': 'Skills',
      'nav.meals': 'Meals',
      'nav.templates': 'Templates',
      'nav.cleaning': 'Cleaning',
      'nav.feed': 'Feed',
      'nav.more': 'More',
      'nav.customize': 'Customise',
      'nav.empty': 'Empty',
      'nav.config.title': '📱 Customise navigation',
      'nav.config.subtitle': 'Tap a slot to change it. Feed always stays in the centre.',
      'nav.config.chooseScreen': 'Choose a screen',
      'nav.config.tapSlot': '👆 Tap a slot to change it',
      'nav.config.saved': 'Navigation saved ✓',

      'screen.home': 'FamilyApp 🌿',
      'screen.tasks': 'Tasks',
      'screen.feed': 'Feed',
      'screen.notes': 'Notes',
      'screen.shop': 'Groceries',
      'screen.calendar': 'Calendar',
      'screen.finance': 'Finances',
      'screen.notifications': 'Notifications',
      'screen.achievements': '🏆 Achievements',
      'screen.profile': 'Profile',
      'screen.recipes': 'Recipes 🍳',
      'screen.skills': '⚡ Skills',
      'screen.meals': '🗓️ Meal planner',
      'screen.templates': '📋 Task templates',
      'screen.cleaning': 'Cleaning',

      'home.greeting.morning': 'Good morning, {{name}}',
      'home.greeting.afternoon': 'Good afternoon, {{name}}',
      'home.greeting.evening': 'Good evening, {{name}}',
      'home.cards.tasks': 'tasks',
      'home.cards.shop': 'groceries',
      'home.cards.cleaning': 'cleaning',
      'home.carousel.recipes.title': 'Recipes',
      'home.carousel.recipes.tagline': 'Discover delicious recipes for every occasion',
      'home.carousel.recipes.button': 'View recipes',
      'home.carousel.calendar.title': 'Calendar',
      'home.carousel.calendar.tagline': 'Keep track of appointments and stay organised',
      'home.carousel.calendar.button': 'View calendar',
      'home.carousel.meals.title': 'Meals',
      'home.carousel.meals.tagline': 'Plan meals together with your family',
      'home.carousel.meals.button': 'View meals',
      'home.activity': 'Activity',
      'home.music': 'Music',
      'home.theme.toggle': 'Switch between light and dark mode',
      'common.previous': 'Previous',
      'common.next': 'Next',

      'profile.language.title': 'Language',
      'profile.language.subtitle': 'Choose the language FamilyApp uses on this device.',
      'profile.language.system': 'System default',
      'profile.language.changed': 'Language changed',
      'profile.install.installedTitle': 'FamilyApp installed',
      'profile.install.installedCopy': 'You already use FamilyApp from your home screen.',
      'profile.install.iosCopy': 'Add FamilyApp to your home screen for an app-like experience without the browser bar.',
      'profile.install.browserCopy': 'Install FamilyApp on your phone and open it directly from your home screen from now on.',
      'profile.install.homeTitle': 'FamilyApp on your home screen',
      'profile.install.how': 'How do I add it to my home screen?',
      'profile.install.button': 'Install FamilyApp',
      'profile.install.shareAria': 'iOS share button',
      'profile.install.step1': 'Tap the Share button at the bottom of Safari.',
      'profile.install.step1hint': 'It is the square with the upward arrow.',
      'profile.install.step2': 'Choose Add to Home Screen.',
      'profile.install.step3': 'Tap Add. FamilyApp will then open like a standalone app.',
      'profile.install.browserSteps': 'The automatic install prompt is not available in this browser yet. Open the browser menu and choose Install app or Add to Home Screen.',
      'profile.install.modalTitle': 'Add FamilyApp to your home screen',
      'profile.install.modalSubtitle': 'Set it up once, then open it like an app.',
      'profile.install.gotIt': 'Got it',
      'profile.saved': 'Profile saved',
      'profile.logoutUnavailable': 'Sign out is temporarily unavailable',
      'profile.scaleChanged': 'UI scale set to {{scale}}%',
      'profile.install.installing': 'FamilyApp is being installed',
      'profile.install.already': 'FamilyApp is already installed',
      'profile.avatar.updated': 'Avatar updated',
      'profile.avatar.chosen': 'Avatar selected',
      'profile.notificationsUnavailable': 'Notifications are temporarily unavailable',
      'profile.avatar.choose': 'Choose an avatar',
      'profile.avatar.change': 'Change avatar',
      'profile.activeAccount': 'Active account',
      'profile.emailUnavailable': 'Email address unavailable',
      'profile.myName': 'My name',
      'profile.partnerName': 'Partner name',
      'profile.optional': 'Optional',
      'profile.avatar.info': 'Your selected avatar is used immediately in the feed, comments and profile.',
      'profile.avatar.mine': 'My avatar',
      'profile.avatar.chooseApp': 'Choose from app',
      'profile.avatar.upload': 'Upload photo',
      'profile.scale.title': 'UI scale',
      'profile.scale.copy': 'Increase or decrease the whole app. Your choice is saved on this device.',
      'profile.settings.account': 'Account settings',
      'profile.settings.privacy': 'Privacy',
      'profile.settings.notifications': 'Notifications',
      'profile.settings.logout': 'Sign out',
      'profile.category.all': 'All',

      'tasks.count': {
        one: '{{count}} task',
        other: '{{count}} tasks'
      }
    },

    tr: {
      'nav.home': 'Ana Sayfa',
      'nav.tasks': 'Görevler',
      'nav.notes': 'Notlar',
      'nav.shop': 'Alışveriş',
      'nav.calendar': 'Takvim',
      'nav.finance': 'Finans',
      'nav.achievements': 'Başarımlar',
      'nav.notifications': 'Bildirimler',
      'nav.profile': 'Profil',
      'nav.recipes': 'Tarifler',
      'nav.skills': 'Beceriler',
      'nav.meals': 'Öğünler',
      'nav.templates': 'Şablonlar',
      'nav.cleaning': 'Temizlik',
      'nav.feed': 'Akış',
      'nav.more': 'Daha fazla',
      'nav.customize': 'Özelleştir',
      'nav.empty': 'Boş',
      'nav.config.title': '📱 Gezinmeyi özelleştir',
      'nav.config.subtitle': 'Değiştirmek için bir alana dokunun. Akış her zaman ortada kalır.',
      'nav.config.chooseScreen': 'Bir ekran seç',
      'nav.config.tapSlot': '👆 Değiştirmek için bir alana dokunun',
      'nav.config.saved': 'Gezinme kaydedildi ✓',

      'screen.home': 'FamilyApp 🌿',
      'screen.tasks': 'Görevler',
      'screen.feed': 'Akış',
      'screen.notes': 'Notlar',
      'screen.shop': 'Alışveriş',
      'screen.calendar': 'Takvim',
      'screen.finance': 'Finans',
      'screen.notifications': 'Bildirimler',
      'screen.achievements': '🏆 Başarımlar',
      'screen.profile': 'Profil',
      'screen.recipes': 'Tarifler 🍳',
      'screen.skills': '⚡ Beceriler',
      'screen.meals': '🗓️ Öğün planlayıcı',
      'screen.templates': '📋 Görev şablonları',
      'screen.cleaning': 'Temizlik',

      'home.greeting.morning': 'Günaydın, {{name}}',
      'home.greeting.afternoon': 'İyi günler, {{name}}',
      'home.greeting.evening': 'İyi akşamlar, {{name}}',
      'home.cards.tasks': 'görev',
      'home.cards.shop': 'alışveriş',
      'home.cards.cleaning': 'temizlik',
      'home.carousel.recipes.title': 'Tarifler',
      'home.carousel.recipes.tagline': 'Her durum için lezzetli tarifleri keşfedin',
      'home.carousel.recipes.button': 'Tarifleri görüntüle',
      'home.carousel.calendar.title': 'Takvim',
      'home.carousel.calendar.tagline': 'Randevularınızı takip edin ve düzenli kalın',
      'home.carousel.calendar.button': 'Takvimi görüntüle',
      'home.carousel.meals.title': 'Öğünler',
      'home.carousel.meals.tagline': 'Ailenizle öğünlerinizi planlayın',
      'home.carousel.meals.button': 'Öğünleri görüntüle',
      'home.activity': 'Etkinlik',
      'home.music': 'Müzik',
      'home.theme.toggle': 'Açık ve koyu mod arasında geçiş yap',
      'common.previous': 'Önceki',
      'common.next': 'Sonraki',

      'profile.language.title': 'Dil',
      'profile.language.subtitle': 'FamilyApp dilini bu cihaz için seçin.',
      'profile.language.system': 'Sistem varsayılanı',
      'profile.language.changed': 'Dil değiştirildi',
      'profile.install.installedTitle': 'FamilyApp yüklendi',
      'profile.install.installedCopy': 'FamilyApp’i zaten ana ekranından kullanıyorsun.',
      'profile.install.iosCopy': 'Tarayıcı çubuğu olmadan uygulama deneyimi için FamilyApp’i ana ekranına ekle.',
      'profile.install.browserCopy': 'FamilyApp’i telefonuna yükle ve bundan sonra doğrudan ana ekranından aç.',
      'profile.install.homeTitle': 'Ana ekranda FamilyApp',
      'profile.install.how': 'Ana ekrana nasıl eklerim?',
      'profile.install.button': 'FamilyApp’i yükle',
      'profile.install.shareAria': 'iOS paylaş düğmesi',
      'profile.install.step1': 'Safari’nin altındaki Paylaş düğmesine dokun.',
      'profile.install.step1hint': 'Yukarı ok bulunan kare simgedir.',
      'profile.install.step2': 'Ana Ekrana Ekle’yi seç.',
      'profile.install.step3': 'Ekle’ye dokun. FamilyApp bağımsız bir uygulama gibi açılır.',
      'profile.install.browserSteps': 'Otomatik yükleme istemi bu tarayıcıda henüz kullanılamıyor. Tarayıcı menüsünü aç ve Uygulamayı yükle veya Ana ekrana ekle seçeneğini seç.',
      'profile.install.modalTitle': 'FamilyApp’i ana ekranına ekle',
      'profile.install.modalSubtitle': 'Bir kez ayarla, sonra uygulama gibi aç.',
      'profile.install.gotIt': 'Anladım',
      'profile.saved': 'Profil kaydedildi',
      'profile.logoutUnavailable': 'Çıkış geçici olarak kullanılamıyor',
      'profile.scaleChanged': 'Arayüz ölçeği %{{scale}} olarak ayarlandı',
      'profile.install.installing': 'FamilyApp yükleniyor',
      'profile.install.already': 'FamilyApp zaten yüklü',
      'profile.avatar.updated': 'Avatar güncellendi',
      'profile.avatar.chosen': 'Avatar seçildi',
      'profile.notificationsUnavailable': 'Bildirimler geçici olarak kullanılamıyor',
      'profile.avatar.choose': 'Bir avatar seç',
      'profile.avatar.change': 'Avatarı değiştir',
      'profile.activeAccount': 'Aktif hesap',
      'profile.emailUnavailable': 'E-posta adresi kullanılamıyor',
      'profile.myName': 'Adım',
      'profile.partnerName': 'Partner adı',
      'profile.optional': 'İsteğe bağlı',
      'profile.avatar.info': 'Seçtiğin avatar akışta, yorumlarda ve profilde hemen kullanılır.',
      'profile.avatar.mine': 'Avatarım',
      'profile.avatar.chooseApp': 'Uygulamadan seç',
      'profile.avatar.upload': 'Fotoğraf yükle',
      'profile.scale.title': 'Arayüz ölçeği',
      'profile.scale.copy': 'Tüm uygulamayı büyüt veya küçült. Seçimin bu cihazda kaydedilir.',
      'profile.settings.account': 'Hesap ayarları',
      'profile.settings.privacy': 'Gizlilik',
      'profile.settings.notifications': 'Bildirimler',
      'profile.settings.logout': 'Çıkış yap',
      'profile.category.all': 'Tümü',

      'tasks.count': {
        other: '{{count}} görev'
      }
    },

    pl: {
      'nav.home': 'Strona główna',
      'nav.tasks': 'Zadania',
      'nav.notes': 'Notatki',
      'nav.shop': 'Zakupy',
      'nav.calendar': 'Kalendarz',
      'nav.finance': 'Finanse',
      'nav.achievements': 'Osiągnięcia',
      'nav.notifications': 'Powiadomienia',
      'nav.profile': 'Profil',
      'nav.recipes': 'Przepisy',
      'nav.skills': 'Umiejętności',
      'nav.meals': 'Posiłki',
      'nav.templates': 'Szablony',
      'nav.cleaning': 'Sprzątanie',
      'nav.feed': 'Aktualności',
      'nav.more': 'Więcej',
      'nav.customize': 'Dostosuj',
      'nav.empty': 'Puste',
      'nav.config.title': '📱 Dostosuj nawigację',
      'nav.config.subtitle': 'Dotknij pola, aby je zmienić. Aktualności zawsze pozostają pośrodku.',
      'nav.config.chooseScreen': 'Wybierz ekran',
      'nav.config.tapSlot': '👆 Dotknij pola, aby je zmienić',
      'nav.config.saved': 'Nawigacja zapisana ✓',

      'screen.home': 'FamilyApp 🌿',
      'screen.tasks': 'Zadania',
      'screen.feed': 'Aktualności',
      'screen.notes': 'Notatki',
      'screen.shop': 'Zakupy',
      'screen.calendar': 'Kalendarz',
      'screen.finance': 'Finanse',
      'screen.notifications': 'Powiadomienia',
      'screen.achievements': '🏆 Osiągnięcia',
      'screen.profile': 'Profil',
      'screen.recipes': 'Przepisy 🍳',
      'screen.skills': '⚡ Umiejętności',
      'screen.meals': '🗓️ Plan posiłków',
      'screen.templates': '📋 Szablony zadań',
      'screen.cleaning': 'Sprzątanie',

      'home.greeting.morning': 'Dzień dobry, {{name}}',
      'home.greeting.afternoon': 'Dzień dobry, {{name}}',
      'home.greeting.evening': 'Dobry wieczór, {{name}}',
      'home.cards.tasks': 'zadania',
      'home.cards.shop': 'zakupy',
      'home.cards.cleaning': 'sprzątanie',
      'home.carousel.recipes.title': 'Przepisy',
      'home.carousel.recipes.tagline': 'Odkrywaj pyszne przepisy na każdą okazję',
      'home.carousel.recipes.button': 'Zobacz przepisy',
      'home.carousel.calendar.title': 'Kalendarz',
      'home.carousel.calendar.tagline': 'Śledź terminy i zachowaj porządek',
      'home.carousel.calendar.button': 'Zobacz kalendarz',
      'home.carousel.meals.title': 'Posiłki',
      'home.carousel.meals.tagline': 'Planuj posiłki razem z rodziną',
      'home.carousel.meals.button': 'Zobacz posiłki',
      'home.activity': 'Aktywność',
      'home.music': 'Muzyka',
      'home.theme.toggle': 'Przełącz tryb jasny i ciemny',
      'common.previous': 'Poprzedni',
      'common.next': 'Następny',

      'profile.language.title': 'Język',
      'profile.language.subtitle': 'Wybierz język FamilyApp na tym urządzeniu.',
      'profile.language.system': 'Domyślny systemu',
      'profile.language.changed': 'Język zmieniony',
      'profile.install.installedTitle': 'FamilyApp zainstalowana',
      'profile.install.installedCopy': 'Korzystasz już z FamilyApp z ekranu głównego.',
      'profile.install.iosCopy': 'Dodaj FamilyApp do ekranu głównego, aby korzystać jak z aplikacji bez paska przeglądarki.',
      'profile.install.browserCopy': 'Zainstaluj FamilyApp na telefonie i otwieraj ją bezpośrednio z ekranu głównego.',
      'profile.install.homeTitle': 'FamilyApp na ekranie głównym',
      'profile.install.how': 'Jak dodać ją do ekranu głównego?',
      'profile.install.button': 'Zainstaluj FamilyApp',
      'profile.install.shareAria': 'przycisk udostępniania iOS',
      'profile.install.step1': 'Dotknij przycisku Udostępnij na dole Safari.',
      'profile.install.step1hint': 'To kwadrat ze strzałką skierowaną w górę.',
      'profile.install.step2': 'Wybierz Dodaj do ekranu głównego.',
      'profile.install.step3': 'Dotknij Dodaj. FamilyApp będzie otwierać się jak osobna aplikacja.',
      'profile.install.browserSteps': 'Automatyczne okno instalacji nie jest jeszcze dostępne w tej przeglądarce. Otwórz menu i wybierz Zainstaluj aplikację lub Dodaj do ekranu głównego.',
      'profile.install.modalTitle': 'Dodaj FamilyApp do ekranu głównego',
      'profile.install.modalSubtitle': 'Skonfiguruj raz, potem otwieraj jak aplikację.',
      'profile.install.gotIt': 'Rozumiem',
      'profile.saved': 'Profil zapisany',
      'profile.logoutUnavailable': 'Wylogowanie jest chwilowo niedostępne',
      'profile.scaleChanged': 'Skala interfejsu ustawiona na {{scale}}%',
      'profile.install.installing': 'FamilyApp jest instalowana',
      'profile.install.already': 'FamilyApp jest już zainstalowana',
      'profile.avatar.updated': 'Awatar zaktualizowany',
      'profile.avatar.chosen': 'Wybrano awatar',
      'profile.notificationsUnavailable': 'Powiadomienia są chwilowo niedostępne',
      'profile.avatar.choose': 'Wybierz awatar',
      'profile.avatar.change': 'Zmień awatar',
      'profile.activeAccount': 'Aktywne konto',
      'profile.emailUnavailable': 'Adres e-mail niedostępny',
      'profile.myName': 'Moje imię',
      'profile.partnerName': 'Imię partnera',
      'profile.optional': 'Opcjonalnie',
      'profile.avatar.info': 'Wybrany awatar jest od razu używany w aktualnościach, komentarzach i profilu.',
      'profile.avatar.mine': 'Mój awatar',
      'profile.avatar.chooseApp': 'Wybierz z aplikacji',
      'profile.avatar.upload': 'Prześlij zdjęcie',
      'profile.scale.title': 'Skala interfejsu',
      'profile.scale.copy': 'Powiększ lub pomniejsz całą aplikację. Wybór zostanie zapisany na tym urządzeniu.',
      'profile.settings.account': 'Ustawienia konta',
      'profile.settings.privacy': 'Prywatność',
      'profile.settings.notifications': 'Powiadomienia',
      'profile.settings.logout': 'Wyloguj się',
      'profile.category.all': 'Wszystkie',

      'tasks.count': {
        one: '{{count}} zadanie',
        few: '{{count}} zadania',
        many: '{{count}} zadań',
        other: '{{count}} zadania'
      }
    },

    ro: {
      'nav.home': 'Acasă',
      'nav.tasks': 'Sarcini',
      'nav.notes': 'Notițe',
      'nav.shop': 'Cumpărături',
      'nav.calendar': 'Calendar',
      'nav.finance': 'Finanțe',
      'nav.achievements': 'Realizări',
      'nav.notifications': 'Notificări',
      'nav.profile': 'Profil',
      'nav.recipes': 'Rețete',
      'nav.skills': 'Abilități',
      'nav.meals': 'Mese',
      'nav.templates': 'Șabloane',
      'nav.cleaning': 'Curățenie',
      'nav.feed': 'Activitate',
      'nav.more': 'Mai multe',
      'nav.customize': 'Personalizează',
      'nav.empty': 'Gol',
      'nav.config.title': '📱 Personalizează navigarea',
      'nav.config.subtitle': 'Atinge un câmp pentru a-l schimba. Activitatea rămâne mereu în centru.',
      'nav.config.chooseScreen': 'Alege un ecran',
      'nav.config.tapSlot': '👆 Atinge un câmp pentru a-l schimba',
      'nav.config.saved': 'Navigarea a fost salvată ✓',

      'screen.home': 'FamilyApp 🌿',
      'screen.tasks': 'Sarcini',
      'screen.feed': 'Activitate',
      'screen.notes': 'Notițe',
      'screen.shop': 'Cumpărături',
      'screen.calendar': 'Calendar',
      'screen.finance': 'Finanțe',
      'screen.notifications': 'Notificări',
      'screen.achievements': '🏆 Realizări',
      'screen.profile': 'Profil',
      'screen.recipes': 'Rețete 🍳',
      'screen.skills': '⚡ Abilități',
      'screen.meals': '🗓️ Planificator de mese',
      'screen.templates': '📋 Șabloane de sarcini',
      'screen.cleaning': 'Curățenie',

      'home.greeting.morning': 'Bună dimineața, {{name}}',
      'home.greeting.afternoon': 'Bună ziua, {{name}}',
      'home.greeting.evening': 'Bună seara, {{name}}',
      'home.cards.tasks': 'sarcini',
      'home.cards.shop': 'cumpărături',
      'home.cards.cleaning': 'curățenie',
      'home.carousel.recipes.title': 'Rețete',
      'home.carousel.recipes.tagline': 'Descoperă rețete delicioase pentru orice ocazie',
      'home.carousel.recipes.button': 'Vezi rețetele',
      'home.carousel.calendar.title': 'Calendar',
      'home.carousel.calendar.tagline': 'Ține evidența programărilor și rămâi organizat',
      'home.carousel.calendar.button': 'Vezi calendarul',
      'home.carousel.meals.title': 'Mese',
      'home.carousel.meals.tagline': 'Planifică mesele împreună cu familia',
      'home.carousel.meals.button': 'Vezi mesele',
      'home.activity': 'Activitate',
      'home.music': 'Muzică',
      'home.theme.toggle': 'Comută între modul luminos și întunecat',
      'common.previous': 'Anterior',
      'common.next': 'Următorul',

      'profile.language.title': 'Limbă',
      'profile.language.subtitle': 'Alege limba FamilyApp pe acest dispozitiv.',
      'profile.language.system': 'Implicit sistem',
      'profile.language.changed': 'Limba a fost schimbată',
      'profile.install.installedTitle': 'FamilyApp instalată',
      'profile.install.installedCopy': 'Folosești deja FamilyApp de pe ecranul principal.',
      'profile.install.iosCopy': 'Adaugă FamilyApp pe ecranul principal pentru o experiență de aplicație fără bara browserului.',
      'profile.install.browserCopy': 'Instalează FamilyApp pe telefon și deschide-o direct de pe ecranul principal.',
      'profile.install.homeTitle': 'FamilyApp pe ecranul principal',
      'profile.install.how': 'Cum o adaug pe ecranul principal?',
      'profile.install.button': 'Instalează FamilyApp',
      'profile.install.shareAria': 'butonul de partajare iOS',
      'profile.install.step1': 'Atinge butonul Partajare din partea de jos a Safari.',
      'profile.install.step1hint': 'Este pătratul cu săgeata în sus.',
      'profile.install.step2': 'Alege Adaugă pe ecranul principal.',
      'profile.install.step3': 'Atinge Adaugă. FamilyApp se va deschide ca o aplicație separată.',
      'profile.install.browserSteps': 'Promptul automat de instalare nu este disponibil încă în acest browser. Deschide meniul browserului și alege Instalează aplicația sau Adaugă pe ecranul principal.',
      'profile.install.modalTitle': 'Adaugă FamilyApp pe ecranul principal',
      'profile.install.modalSubtitle': 'Configurează o singură dată, apoi deschide-o ca pe o aplicație.',
      'profile.install.gotIt': 'Am înțeles',
      'profile.saved': 'Profil salvat',
      'profile.logoutUnavailable': 'Deconectarea este temporar indisponibilă',
      'profile.scaleChanged': 'Scara interfeței a fost setată la {{scale}}%',
      'profile.install.installing': 'FamilyApp se instalează',
      'profile.install.already': 'FamilyApp este deja instalată',
      'profile.avatar.updated': 'Avatar actualizat',
      'profile.avatar.chosen': 'Avatar ales',
      'profile.notificationsUnavailable': 'Notificările sunt temporar indisponibile',
      'profile.avatar.choose': 'Alege un avatar',
      'profile.avatar.change': 'Schimbă avatarul',
      'profile.activeAccount': 'Cont activ',
      'profile.emailUnavailable': 'Adresa de e-mail nu este disponibilă',
      'profile.myName': 'Numele meu',
      'profile.partnerName': 'Numele partenerului',
      'profile.optional': 'Opțional',
      'profile.avatar.info': 'Avatarul ales este folosit imediat în activitate, comentarii și profil.',
      'profile.avatar.mine': 'Avatarul meu',
      'profile.avatar.chooseApp': 'Alege din aplicație',
      'profile.avatar.upload': 'Încarcă fotografie',
      'profile.scale.title': 'Scală interfață',
      'profile.scale.copy': 'Mărește sau micșorează întreaga aplicație. Alegerea este salvată pe acest dispozitiv.',
      'profile.settings.account': 'Setări cont',
      'profile.settings.privacy': 'Confidențialitate',
      'profile.settings.notifications': 'Notificări',
      'profile.settings.logout': 'Deconectare',
      'profile.category.all': 'Toate',

      'tasks.count': {
        one: '{{count}} sarcină',
        few: '{{count}} sarcini',
        other: '{{count}} de sarcini'
      }
    }
  };

  function supportedCode(code) {
    return supported.some(function (item) { return item.code === code; });
  }

  function normaliseLanguage(value) {
    var raw = String(value || '').trim().toLowerCase().replace('_', '-');
    if (!raw) return DEFAULT_LANGUAGE;
    var short = raw.split('-')[0];
    return supportedCode(short) ? short : DEFAULT_LANGUAGE;
  }

  function getPreference() {
    try {
      var saved = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (saved === SYSTEM_VALUE) return SYSTEM_VALUE;
      if (supportedCode(saved)) return saved;
    } catch (error) {}
    return DEFAULT_LANGUAGE;
  }

  function resolveSystemLanguage() {
    var candidates = [];
    try {
      if (window.navigator && Array.isArray(window.navigator.languages)) {
        candidates = candidates.concat(window.navigator.languages);
      }
      if (window.navigator && window.navigator.language) candidates.push(window.navigator.language);
    } catch (error) {}

    for (var i = 0; i < candidates.length; i += 1) {
      var short = String(candidates[i] || '').toLowerCase().split(/[-_]/)[0];
      if (supportedCode(short)) return short;
    }
    return DEFAULT_LANGUAGE;
  }

  function getLanguage() {
    var preference = getPreference();
    return preference === SYSTEM_VALUE ? resolveSystemLanguage() : normaliseLanguage(preference);
  }

  function getLocale() {
    return localeByCode[getLanguage()] || localeByCode[DEFAULT_LANGUAGE];
  }

  function getValue(language, key) {
    var own = dictionaries[language] && dictionaries[language][key];
    if (own !== undefined) return own;
    var english = dictionaries.en && dictionaries.en[key];
    if (english !== undefined) return english;
    var dutch = dictionaries.nl && dictionaries.nl[key];
    if (dutch !== undefined) return dutch;
    return undefined;
  }

  function interpolate(value, params) {
    return String(value).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, function (_, name) {
      return params && params[name] !== undefined && params[name] !== null ? String(params[name]) : '';
    });
  }

  function t(key, params) {
    var language = getLanguage();
    var value = getValue(language, key);
    if (value === undefined) return key;

    if (value && typeof value === 'object') {
      var count = params && Number(params.count);
      var category = 'other';
      if (Number.isFinite(count) && typeof Intl !== 'undefined' && Intl.PluralRules) {
        try {
          category = new Intl.PluralRules(localeByCode[language] || language).select(count);
        } catch (error) {}
      }
      value = value[category] !== undefined ? value[category] : value.other;
    }

    return interpolate(value, params || {});
  }

  function formatDate(value, options) {
    var date = value instanceof Date ? value : new Date(value);
    try {
      return new Intl.DateTimeFormat(getLocale(), options || {}).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  function formatNumber(value, options) {
    try {
      return new Intl.NumberFormat(getLocale(), options || {}).format(value);
    } catch (error) {
      return String(value);
    }
  }

  function apply(root) {
    var scope = root || document;
    if (document && document.documentElement) {
      document.documentElement.lang = getLanguage();
    }

    var textNodes = scope.querySelectorAll ? scope.querySelectorAll('[data-i18n]') : [];
    Array.prototype.forEach.call(textNodes, function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });

    var placeholderNodes = scope.querySelectorAll ? scope.querySelectorAll('[data-i18n-placeholder]') : [];
    Array.prototype.forEach.call(placeholderNodes, function (node) {
      node.setAttribute('placeholder', t(node.getAttribute('data-i18n-placeholder')));
    });

    var ariaNodes = scope.querySelectorAll ? scope.querySelectorAll('[data-i18n-aria-label]') : [];
    Array.prototype.forEach.call(ariaNodes, function (node) {
      node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria-label')));
    });

    var titleNodes = scope.querySelectorAll ? scope.querySelectorAll('[data-i18n-title]') : [];
    Array.prototype.forEach.call(titleNodes, function (node) {
      node.setAttribute('title', t(node.getAttribute('data-i18n-title')));
    });

    localizeLegacySubtree(scope);
  }

  function emitChange() {
    try {
      window.dispatchEvent(new CustomEvent('familyapp:language-changed', {
        detail: {
          preference: getPreference(),
          language: getLanguage(),
          locale: getLocale()
        }
      }));
    } catch (error) {}
  }

  function setPreference(value) {
    var next = value === SYSTEM_VALUE ? SYSTEM_VALUE : normaliseLanguage(value);
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {}
    apply(document);
    emitChange();
    return getLanguage();
  }

  function getOptions() {
    return supported.map(function (item) {
      return {
        code: item.code,
        locale: item.locale,
        nativeName: item.nativeName
      };
    });
  }



  // Canonical UI copy for active FamilyApp modules. Module code should call
  // FamilyI18n.t(key) for system copy and keep user-authored content untouched.
  var moduleUiRows = [
    ['tasks.all','Alle taken','All tasks','Tüm görevler','Wszystkie zadania','Toate sarcinile'],
    ['tasks.open','open taken','open tasks','açık görev','otwarte zadania','sarcini deschise'],
    ['tasks.important','belangrijk','important','önemli','ważne','importante'],
    ['tasks.overdue','verlopen','overdue','gecikmiş','zaległe','întârziate'],
    ['tasks.overdueTitle','Verlopen','Overdue','Gecikmiş','Zaległe','Întârziate'],
    ['tasks.quote.title','Kleine taken, een rustiger thuis','Small tasks, a calmer home','Küçük görevler, daha huzurlu bir ev','Małe zadania, spokojniejszy dom','Sarcini mici, o casă mai liniștită'],
    ['tasks.quote.subtitle','Samen maken we tijd voor wat echt telt.','Together we make time for what really matters.','Birlikte gerçekten önemli olan şeylere zaman ayırıyoruz.','Razem znajdujemy czas na to, co naprawdę ważne.','Împreună facem timp pentru ceea ce contează cu adevărat.'],
    ['tasks.filter.cleaning','Schoonmaken','Cleaning','Temizlik','Sprzątanie','Curățenie'],
    ['tasks.section.completed','Voltooid','Completed','Tamamlandı','Ukończone','Finalizate'],

    ['meals.weekMenu','Week menu','Weekly menu','Haftalık menü','Menu tygodniowe','Meniu săptămânal'],
    ['meals.thisWeek','Deze week','This week','Bu hafta','W tym tygodniu','Săptămâna aceasta'],
    ['meals.nextWeek','Volgende week','Next week','Gelecek hafta','W przyszłym tygodniu','Săptămâna viitoare'],
    ['meals.hint','Tik op een slot om een recept of maaltijd te plannen.','Tap a slot to plan a recipe or meal.','Bir tarif veya öğün planlamak için bir alana dokun.','Dotknij pola, aby zaplanować przepis lub posiłek.','Atinge un interval pentru a planifica o rețetă sau o masă.'],
    ['meals.lunchChoose','Lunch kiezen...','Choose lunch...','Öğle yemeği seç...','Wybierz lunch...','Alege prânzul...'],
    ['meals.dinnerChoose','Diner kiezen...','Choose dinner...','Akşam yemeği seç...','Wybierz kolację...','Alege cina...'],
    ['meals.meal','Maaltijd','Meal','Öğün','Posiłek','Masă'],
    ['meals.addWeekIngredients','Voeg ingrediënten van deze week toe','Add this week’s ingredients','Bu haftanın malzemelerini ekle','Dodaj składniki z tego tygodnia','Adaugă ingredientele din această săptămână'],
    ['meals.loading','Maaltijdplanner wordt geladen','Meal planner is loading','Öğün planlayıcı yükleniyor','Planer posiłków jest ładowany','Planificatorul de mese se încarcă'],
    ['meals.storageUnavailable','Maaltijdopslag niet beschikbaar','Meal storage is unavailable','Öğün depolama kullanılamıyor','Pamięć planu posiłków jest niedostępna','Stocarea meselor nu este disponibilă'],
    ['meals.nonePlanned','Geen recepten gepland in deze week','No recipes planned this week','Bu hafta için tarif planlanmadı','Brak zaplanowanych przepisów na ten tydzień','Nu sunt rețete planificate în această săptămână'],
    ['meals.openShoppingFirst','Open eerst Boodschappen om een lijst te kiezen of aan te maken','Open Groceries first to choose or create a list','Bir liste seçmek veya oluşturmak için önce Alışveriş’i aç','Najpierw otwórz Zakupy, aby wybrać lub utworzyć listę','Deschide mai întâi Cumpărături pentru a alege sau crea o listă'],
    ['meals.ingredientsAdded','{{count}} ingrediënten toegevoegd','{{count}} ingredients added','{{count}} malzeme eklendi','Dodano {{count}} składników','Au fost adăugate {{count}} ingrediente'],
    ['recipes.search','Zoek recept, keuken...','Search recipe, cuisine...','Tarif veya mutfak ara...','Szukaj przepisu, kuchni...','Caută rețetă, bucătărie...'],
    ['recipes.none','Geen recepten gevonden','No recipes found','Tarif bulunamadı','Nie znaleziono przepisów','Nu s-au găsit rețete'],
    ['recipes.photo','Foto','Photo','Fotoğraf','Zdjęcie','Fotografie'],
    ['recipes.edit','Bewerken','Edit','Düzenle','Edytuj','Editează'],
    ['recipes.delete','Verwijderen','Delete','Sil','Usuń','Șterge'],
    ['recipes.ingredients','Ingrediënten','Ingredients','Malzemeler','Składniki','Ingrediente'],
    ['recipes.planMeal','Maaltijd plannen','Plan meal','Öğün planla','Zaplanuj posiłek','Planifică masa'],
    ['recipes.method','Bereiding','Method','Hazırlanış','Przygotowanie','Preparare'],
    ['recipes.deleteFailed','Verwijderen mislukt','Delete failed','Silme başarısız','Usuwanie nie powiodło się','Ștergerea a eșuat'],
    ['recipes.shoppingUnavailable','Boodschappenlijsten zijn nog niet beschikbaar','Shopping lists are not available yet','Alışveriş listeleri henüz kullanılamıyor','Listy zakupów nie są jeszcze dostępne','Listele de cumpărături nu sunt încă disponibile'],
    ['recipes.chooseShopping','Kies boodschappenlijst','Choose shopping list','Alışveriş listesi seç','Wybierz listę zakupów','Alege lista de cumpărături'],
    ['recipes.photoUrl','Eigen foto URL','Custom photo URL','Özel fotoğraf URL’si','Własny adres URL zdjęcia','URL fotografie proprie'],
    ['recipes.uploadPhoto','Upload eigen foto','Upload your own photo','Kendi fotoğrafını yükle','Prześlij własne zdjęcie','Încarcă fotografia proprie'],
    ['recipes.photoSaved','Eigen foto opgeslagen ✓','Custom photo saved ✓','Özel fotoğraf kaydedildi ✓','Własne zdjęcie zapisane ✓','Fotografia proprie a fost salvată ✓'],
    ['recipes.editorLoadFailed','Receptbewerker kon niet laden','Recipe editor could not load','Tarif düzenleyici yüklenemedi','Nie udało się wczytać edytora przepisu','Editorul de rețete nu s-a putut încărca'],
    ['recipes.error','FOUT','ERROR','HATA','BŁĄD','EROARE'],
    ['recipes.editTitle','Recept bewerken','Edit recipe','Tarifi düzenle','Edytuj przepis','Editează rețeta'],
    ['recipes.newTitle','Nieuw recept','New recipe','Yeni tarif','Nowy przepis','Rețetă nouă'],
    ['recipes.removePhoto','Verwijder foto','Remove photo','Fotoğrafı kaldır','Usuń zdjęcie','Șterge fotografia'],
    ['recipes.name','Naam','Name','Ad','Nazwa','Nume'],
    ['recipes.namePlaceholder','Bijv. Zondagse pannenkoeken','e.g. Sunday pancakes','örn. Pazar krepleri','np. Niedzielne naleśniki','ex. Clătite de duminică'],
    ['recipes.mealType','Maaltijdtype','Meal type','Öğün türü','Rodzaj posiłku','Tip masă'],
    ['recipes.cuisine','Keuken','Cuisine','Mutfak','Kuchnia','Bucătărie'],
    ['recipes.cuisinePlaceholder','Bijv. Italiaans','e.g. Italian','örn. İtalyan','np. Włoska','ex. Italiană'],
    ['recipes.people','Personen','People','Kişi','Osoby','Persoane'],
    ['recipes.timeMin','Tijd (min)','Time (min)','Süre (dk)','Czas (min)','Timp (min)'],
    ['recipes.chooseOtherPhoto','Andere foto kiezen','Choose another photo','Başka fotoğraf seç','Wybierz inne zdjęcie','Alege altă fotografie'],
    ['recipes.addOwnPhoto','Eigen foto toevoegen','Add your own photo','Kendi fotoğrafını ekle','Dodaj własne zdjęcie','Adaugă fotografia proprie'],
    ['recipes.autoHeroHint','Zonder eigen foto krijgt dit recept automatisch de FamilyApp {{category}} Hero.','Without your own photo, this recipe automatically gets the FamilyApp {{category}} Hero.','Kendi fotoğrafın olmadan bu tarif otomatik olarak FamilyApp {{category}} Hero görselini alır.','Bez własnego zdjęcia ten przepis automatycznie otrzyma FamilyApp {{category}} Hero.','Fără fotografie proprie, această rețetă primește automat imaginea FamilyApp {{category}} Hero.'],
    ['recipes.ingredientsPerLine','Ingrediënten · 1 per regel','Ingredients · 1 per line','Malzemeler · satır başına 1','Składniki · 1 na linię','Ingrediente · 1 pe rând'],
    ['recipes.stepsPerLine','Stappen · 1 per regel','Steps · 1 per line','Adımlar · satır başına 1','Kroki · 1 na linię','Pași · 1 pe rând'],
    ['recipes.notes','Notities','Notes','Notlar','Notatki','Notițe'],
    ['recipes.nameRequired','Naam verplicht','Name is required','Ad gerekli','Nazwa jest wymagana','Numele este obligatoriu'],
    ['recipes.ingredientRequired','Voeg minstens 1 ingrediënt toe','Add at least 1 ingredient','En az 1 malzeme ekle','Dodaj co najmniej 1 składnik','Adaugă cel puțin 1 ingredient'],
    ['recipes.storageUnavailable','Receptopslag niet beschikbaar','Recipe storage is unavailable','Tarif depolama kullanılamıyor','Pamięć przepisów jest niedostępna','Stocarea rețetelor nu este disponibilă'],
    ['recipes.created','Recept aangemaakt','Recipe created','Tarif oluşturuldu','Przepis utworzony','Rețetă creată'],
    ['recipes.saveFailed','Opslaan mislukt','Save failed','Kaydetme başarısız','Zapisywanie nie powiodło się','Salvarea a eșuat'],
    ['recipes.placeholder.breakfast','Jouw nieuwe ontbijt','Your new breakfast','Yeni kahvaltın','Twoje nowe śniadanie','Noul tău mic dejun'],
    ['recipes.placeholder.lunch','Jouw nieuwe lunch','Your new lunch','Yeni öğle yemeğin','Twój nowy lunch','Noul tău prânz'],
    ['recipes.placeholder.dinner','Jouw nieuwe diner','Your new dinner','Yeni akşam yemeğin','Twoja nowa kolacja','Noua ta cină'],
    ['recipes.placeholder.snack','Jouw nieuwe snack','Your new snack','Yeni atıştırmalığın','Twoja nowa przekąska','Noua ta gustare'],
    ['recipes.placeholder.dessert','Jouw nieuwe dessert','Your new dessert','Yeni tatlın','Twój nowy deser','Noul tău desert'],
    ['recipes.placeholder.baking','Jouw nieuwe bakproject','Your new baking project','Yeni pişirme projen','Twój nowy projekt pieczenia','Noul tău proiect de copt'],
    ['recipes.placeholder.recipe','Jouw nieuwe recept','Your new recipe','Yeni tarifin','Twój nowy przepis','Noua ta rețetă'],
    ['recipes.cat.breakfast','Ontbijt','Breakfast','Kahvaltı','Śniadanie','Mic dejun'],
    ['recipes.cat.lunch','Lunch','Lunch','Öğle yemeği','Lunch','Prânz'],
    ['recipes.cat.dinner','Diner','Dinner','Akşam yemeği','Kolacja','Cină'],
    ['recipes.cat.snack','Snack','Snack','Atıştırmalık','Przekąska','Gustare'],
    ['recipes.cat.dessert','Dessert','Dessert','Tatlı','Deser','Desert'],
    ['recipes.cat.baking','Bakken','Baking','Pişirme','Pieczenie','Copt'],
    ['recipes.add','+ Recept','+ Recipe','+ Tarif','+ Przepis','+ Rețetă'],
    ['recipes.importLink','Importeren via link','Import via link','Bağlantıdan içe aktar','Importuj przez link','Importă prin link'],
    ['recipes.all','Alle','All','Tümü','Wszystkie','Toate'],
    ['recipes.noSteps','Geen stappen','No steps','Adım yok','Brak kroków','Niciun pas'],
    ['recipes.back','← Terug','← Back','← Geri','← Wstecz','← Înapoi'],
    ['recipes.toShopping','Naar boodschappenlijst','Add to shopping list','Alışveriş listesine ekle','Dodaj do listy zakupów','Adaugă în lista de cumpărături'],
    ['recipes.confirmDelete','Verwijder “{{name}}”?','Delete “{{name}}”?','“{{name}}” silinsin mi?','Usunąć „{{name}}”?','Ștergi „{{name}}”?'],
    ['recipes.deleted','Verwijderd','Deleted','Silindi','Usunięto','Șters'],
    ['recipes.createShoppingFirst','Maak eerst een boodschappenlijst via Boodschappen','Create a shopping list in Groceries first','Önce Alışveriş bölümünde bir liste oluştur','Najpierw utwórz listę w Zakupach','Creează mai întâi o listă în Cumpărături'],
    ['recipes.list','Lijst','List','Liste','Lista','Listă'],
    ['recipes.private','Privé','Private','Özel','Prywatna','Privată'],
    ['recipes.addedToShopping','{{added}} toegevoegd','{{added}} added','{{added}} eklendi','Dodano: {{added}}','Adăugate: {{added}}'],
    ['recipes.alreadyExisted','{{count}} bestond al','{{count}} already existed','{{count}} zaten vardı','{{count}} już istniało','{{count}} existau deja'],
    ['recipes.addFailed','Toevoegen mislukt','Add failed','Ekleme başarısız','Dodawanie nie powiodło się','Adăugarea a eșuat'],
    ['recipes.image','Receptafbeelding','Recipe image','Tarif görseli','Zdjęcie przepisu','Imagine rețetă'],
    ['recipes.photoEmptyHint','Leeg = FamilyApp Hero','Empty = FamilyApp Hero','Boş = FamilyApp Hero','Puste = FamilyApp Hero','Gol = FamilyApp Hero'],
    ['recipes.photoHint','Laat het veld leeg om automatisch de FamilyApp {{category}} Hero te gebruiken.','Leave the field empty to automatically use the FamilyApp {{category}} Hero.','FamilyApp {{category}} Hero görselini otomatik kullanmak için alanı boş bırak.','Zostaw pole puste, aby automatycznie użyć FamilyApp {{category}} Hero.','Lasă câmpul gol pentru a folosi automat FamilyApp {{category}} Hero.'],
    ['recipes.heroSet','FamilyApp Hero ingesteld ✓','FamilyApp Hero set ✓','FamilyApp Hero ayarlandı ✓','Ustawiono FamilyApp Hero ✓','FamilyApp Hero a fost setat ✓'],
    ['recipes.personShort','pers','people','kişi','os.','pers.'],
    ['finance.savingsGoals','Spaardoelen','Savings goals','Tasarruf hedefleri','Cele oszczędnościowe','Obiective de economii'],
    ['finance.newGoal','+ Nieuw doel','+ New goal','+ Yeni hedef','+ Nowy cel','+ Obiectiv nou'],
    ['finance.noGoals','Nog geen spaardoelen. Voeg er een toe!','No savings goals yet. Add one!','Henüz tasarruf hedefi yok. Bir tane ekle!','Brak celów oszczędnościowych. Dodaj jeden!','Încă nu există obiective de economii. Adaugă unul!'],
    ['finance.goalReached','Doel bereikt!','Goal reached!','Hedefe ulaşıldı!','Cel osiągnięty!','Obiectiv atins!'],
    ['finance.remaining','Nog € {{amount}} te gaan','€ {{amount}} to go','€ {{amount}} kaldı','Pozostało € {{amount}}','Mai sunt € {{amount}}'],
    ['finance.deposit','Storting','Deposit','Yatırma','Wpłata','Depunere'],
    ['finance.withdrawal','Opname','Withdrawal','Çekim','Wypłata','Retragere'],
    ['finance.back','← Terug','← Back','← Geri','← Wstecz','← Înapoi'],
    ['finance.saved','Gespaard','Saved','Birikmiş','Zaoszczędzono','Economisit'],
    ['finance.ofTarget','van € {{amount}}','of € {{amount}}','€ {{amount}} hedefinden','z € {{amount}}','din € {{amount}}'],
    ['finance.reached','Bereikt! 🎉','Reached! 🎉','Ulaşıldı! 🎉','Osiągnięto! 🎉','Atins! 🎉'],
    ['finance.totalDeposited','Totaal gestort','Total deposited','Toplam yatırılan','Łącznie wpłacono','Total depus'],
    ['finance.totalWithdrawn','Totaal opgenomen','Total withdrawn','Toplam çekilen','Łącznie wypłacono','Total retras'],
    ['finance.transactions','Transacties','Transactions','İşlemler','Transakcje','Tranzacții'],
    ['finance.addDeposit','+ Storting toevoegen','+ Add deposit','+ Yatırma ekle','+ Dodaj wpłatę','+ Adaugă depunere'],
    ['finance.transactionLog','Transactielogboek','Transaction log','İşlem günlüğü','Dziennik transakcji','Jurnal tranzacții'],
    ['finance.noTransactions','Nog geen transacties','No transactions yet','Henüz işlem yok','Brak transakcji','Încă nu există tranzacții'],
    ['finance.amount','Bedrag (€)','Amount (€)','Tutar (€)','Kwota (€)','Sumă (€)'],
    ['finance.noteOptional','Notitie (optioneel)','Note (optional)','Not (isteğe bağlı)','Notatka (opcjonalnie)','Notiță (opțional)'],
    ['finance.notePlaceholder','bijv. Maandelijkse bijdrage','e.g. Monthly contribution','örn. Aylık katkı','np. Miesięczna wpłata','ex. Contribuție lunară'],
    ['finance.who','Wie?','Who?','Kim?','Kto?','Cine?'],
    ['finance.date','Datum','Date','Tarih','Data','Dată'],
    ['finance.amountRequired','Vul een bedrag in','Enter an amount','Bir tutar gir','Wpisz kwotę','Introdu o sumă'],
    ['finance.withdrawTooMuch','Je kunt niet meer opnemen dan gespaard (€ {{amount}})','You cannot withdraw more than saved (€ {{amount}})','Birikenden fazlasını çekemezsin (€ {{amount}})','Nie możesz wypłacić więcej niż zaoszczędzono (€ {{amount}})','Nu poți retrage mai mult decât ai economisit (€ {{amount}})'],
    ['finance.goalReachedType','🎯 Spaardoel bereikt!','🎯 Savings goal reached!','🎯 Tasarruf hedefi tamamlandı!','🎯 Cel oszczędnościowy osiągnięty!','🎯 Obiectiv de economii atins!'],
    ['finance.savedAmount','€ {{amount}} gespaard!','€ {{amount}} saved!','€ {{amount}} biriktirildi!','Zaoszczędzono € {{amount}}!','€ {{amount}} economisiți!'],
    ['finance.savingsTransaction','Spaartransactie','Savings transaction','Tasarruf işlemi','Transakcja oszczędnościowa','Tranzacție de economii'],
    ['finance.registered','{{type}} van € {{amount}} geregistreerd','{{type}} of € {{amount}} registered','€ {{amount}} tutarında {{type}} kaydedildi','Zarejestrowano {{type}} € {{amount}}','{{type}} de € {{amount}} înregistrată'],
    ['finance.editGoal','✏️ Doel bewerken','✏️ Edit goal','✏️ Hedefi düzenle','✏️ Edytuj cel','✏️ Editează obiectivul'],
    ['finance.newSavingsGoal','🎯 Nieuw spaardoel','🎯 New savings goal','🎯 Yeni tasarruf hedefi','🎯 Nowy cel oszczędnościowy','🎯 Obiectiv nou de economii'],
    ['finance.name','Naam','Name','Ad','Nazwa','Nume'],
    ['finance.namePlaceholder','bijv. Vakantie','e.g. Holiday','örn. Tatil','np. Wakacje','ex. Vacanță'],
    ['finance.targetAmount','Doelbedrag (€)','Target amount (€)','Hedef tutarı (€)','Kwota celu (€)','Sumă țintă (€)'],
    ['finance.icon','Pictogram','Icon','Simge','Ikona','Pictogramă'],
    ['finance.color','Kleur','Colour','Renk','Kolor','Culoare'],
    ['finance.goalRequired','Vul naam en doelbedrag in','Enter a name and target amount','Ad ve hedef tutarı gir','Wpisz nazwę i kwotę celu','Introdu numele și suma țintă'],
    ['finance.goalCreatedActivity','{{name}} maakte spaardoel “{{goal}}” aan (€ {{amount}})','{{name}} created savings goal “{{goal}}” (€ {{amount}})','{{name}}, “{{goal}}” tasarruf hedefini oluşturdu (€ {{amount}})','{{name}} utworzył(a) cel „{{goal}}” (€ {{amount}})','{{name}} a creat obiectivul „{{goal}}” (€ {{amount}})'],
    ['finance.goalCreated','Spaardoel aangemaakt','Savings goal created','Tasarruf hedefi oluşturuldu','Cel oszczędnościowy utworzony','Obiectiv de economii creat'],
    ['finance.goalSaved','Doel opgeslagen','Goal saved','Hedef kaydedildi','Cel zapisany','Obiectiv salvat'],
    ['finance.confirmDeleteGoal','Spaardoel verwijderen?','Delete savings goal?','Tasarruf hedefi silinsin mi?','Usunąć cel oszczędnościowy?','Ștergi obiectivul de economii?'],
    ['finance.goalDeleted','Doel verwijderd','Goal deleted','Hedef silindi','Cel usunięty','Obiectiv șters'],
    ['finance.notificationsLoading','Meldingen worden geladen…','Notifications are loading…','Bildirimler yükleniyor…','Ładowanie powiadomień…','Notificările se încarcă…'],
    ['finance.markedRead','Alles gemarkeerd als gelezen','Everything marked as read','Tümü okundu olarak işaretlendi','Wszystko oznaczono jako przeczytane','Totul a fost marcat ca citit'],
    ['finance.seed.newBank','Nieuwe bank','New sofa','Yeni koltuk','Nowa sofa','Canapea nouă'],
    ['finance.totalSaved','Totaal gespaard','Total saved','Toplam birikim','Łącznie zaoszczędzono','Total economisit'],
    ['finance.targetTotal','van € {{amount}} doel','of € {{amount}} target','€ {{amount}} hedefinden','z celu € {{amount}}','din obiectivul de € {{amount}}'],
    ['finance.goalsProgress','{{pct}}% van alle doelen bereikt','{{pct}}% of all goals reached','Tüm hedeflerin %{{pct}} kadarı tamamlandı','Osiągnięto {{pct}}% wszystkich celów','{{pct}}% din toate obiectivele atinse'],
    ['finance.toGo','Nog € {{amount}}','€ {{amount}} to go','€ {{amount}} kaldı','Pozostało € {{amount}}','Mai sunt € {{amount}}'],
    ['finance.depositDefault','Storting','Deposit','Yatırma','Wpłata','Depunere'],
    ['finance.withdrawalDefault','Opname','Withdrawal','Çekim','Wypłata','Retragere'],
    ['finance.goalBoth','Beiden','Both','İkiniz','Oboje','Amândoi'],
    ['finance.depositTitle','💰 Storting — {{name}}','💰 Deposit — {{name}}','💰 Yatırma — {{name}}','💰 Wpłata — {{name}}','💰 Depunere — {{name}}'],
    ['finance.withdrawalTitle','📤 Opname — {{name}}','📤 Withdrawal — {{name}}','📤 Çekim — {{name}}','📤 Wypłata — {{name}}','📤 Retragere — {{name}}'],
    ['finance.registerDeposit','💰 Storting','💰 Deposit','💰 Yatırma','💰 Wpłata','💰 Depunere'],
    ['finance.registerWithdrawal','📤 Opname','📤 Withdrawal','📤 Çekim','📤 Wypłata','📤 Retragere'],
    ['skills.titleSuffix','Skills','Skills','Beceriler','Umiejętności','Abilități'],
    ['skills.totalLevels','{{count}} totale levels','{{count}} total levels','Toplam {{count}} seviye','Łącznie poziomów: {{count}}','Total niveluri: {{count}}'],
    ['skills.best','Best','Best','En iyi','Najlepsza','Cea mai bună'],
    ['skills.all','Alle','All','Tümü','Wszystkie','Toate'],
    ['skills.recent','Recent','Recent','Son','Ostatnie','Recente'],
    ['skills.noActivity','Nog geen activiteit','No activity yet','Henüz etkinlik yok','Brak aktywności','Încă nu există activitate'],
    ['skills.autoXp','Auto XP','Auto XP','Otomatik XP','Auto XP','XP automat'],
    ['skills.taskContains','als taak bevat','when task contains','görev şunu içerdiğinde','gdy zadanie zawiera','când sarcina conține'],
    ['skills.useTag','gebruik tag','use tag','etiketi kullan','użyj tagu','folosește eticheta'],
    ['skills.autoXpToast','Voeg {{tag}} toe aan een taaknaam voor auto-XP!','Add {{tag}} to a task name for auto XP!','Otomatik XP için görev adına {{tag}} ekle!','Dodaj {{tag}} do nazwy zadania, aby zdobywać auto XP!','Adaugă {{tag}} în numele sarcinii pentru XP automat!'],
    ['skills.perTask','per taak','per task','görev başına','za zadanie','pe sarcină'],
    ['skills.did','{{person}} deed {{skill}}! +{{xp}} XP','{{person}} did {{skill}}! +{{xp}} XP','{{person}}, {{skill}} yaptı! +{{xp}} XP','{{person}} wykonał(a) {{skill}}! +{{xp}} XP','{{person}} a făcut {{skill}}! +{{xp}} XP'],
    ['skills.didActivity','{{person}} deed {{skill}} (Lv {{level}})','{{person}} did {{skill}} (Lv {{level}})','{{person}}, {{skill}} yaptı (Sv {{level}})','{{person}} wykonał(a) {{skill}} (Poz. {{level}})','{{person}} a făcut {{skill}} (Nv {{level}})'],

    ['skills.def.vacuum.name','Stofzuigen','Vacuuming','Süpürme','Odkurzanie','Aspirat'],
    ['skills.def.vacuum.desc','Stofzuig een ruimte','Vacuum a room','Bir odayı süpür','Odkurz pomieszczenie','Aspiră o cameră'],
    ['skills.def.windows.name','Ramen zemen','Window cleaning','Cam silme','Mycie okien','Spălat geamuri'],
    ['skills.def.windows.desc','Zeem alle ramen','Clean all windows','Tüm camları sil','Umyj wszystkie okna','Spală toate geamurile'],
    ['skills.def.cooking.name','Koken','Cooking','Yemek yapma','Gotowanie','Gătit'],
    ['skills.def.cooking.desc','Maak een maaltijd','Make a meal','Bir öğün hazırla','Przygotuj posiłek','Pregătește o masă'],
    ['skills.def.dishes.name','Afwassen','Washing dishes','Bulaşık yıkama','Zmywanie','Spălat vase'],
    ['skills.def.dishes.desc','Was de vaat af','Wash the dishes','Bulaşıkları yıka','Umyj naczynia','Spală vasele'],
    ['skills.def.laundry.name','Was doen','Laundry','Çamaşır','Pranie','Spălat rufe'],
    ['skills.def.laundry.desc','Was draaien + opvouwen','Wash and fold laundry','Çamaşır yıka + katla','Zrób pranie + złóż','Spală și împăturește rufele'],
    ['skills.def.ironing.name','Strijken','Ironing','Ütü','Prasowanie','Călcat'],
    ['skills.def.ironing.desc','Strijk een lading kleren','Iron a load of clothes','Bir sepet kıyafet ütüle','Wyprasuj partię ubrań','Calcă o tură de haine'],
    ['skills.def.groceries.name','Boodschappen','Groceries','Alışveriş','Zakupy','Cumpărături'],
    ['skills.def.groceries.desc','Doe de boodschappen','Do the grocery shopping','Alışverişi yap','Zrób zakupy','Fă cumpărăturile'],
    ['skills.def.cooking_pro.name','Gourmet koken','Gourmet cooking','Gurme yemek','Gotowanie gourmet','Gătit gourmet'],
    ['skills.def.cooking_pro.desc','Maak een uitgebreid gerecht','Make an elaborate dish','Özenli bir yemek hazırla','Przygotuj rozbudowane danie','Pregătește un preparat elaborat'],
    ['skills.def.tidying.name','Opruimen','Tidying','Toparlama','Porządkowanie','Ordine'],
    ['skills.def.tidying.desc','Ruim een ruimte op','Tidy a room','Bir odayı toparla','Posprzątaj pomieszczenie','Fă ordine într-o cameră'],
    ['skills.def.mopping.name','Dweilen','Mopping','Paspas','Mycie podłogi','Spălat pe jos'],
    ['skills.def.mopping.desc','Dweil de vloer','Mop the floor','Zemini paspasla','Umyj podłogę','Spală podeaua'],
    ['skills.def.bathroom.name','Badkamer schoon','Bathroom cleaning','Banyo temizliği','Sprzątanie łazienki','Curățenie baie'],
    ['skills.def.bathroom.desc','Maak de badkamer schoon','Clean the bathroom','Banyoyu temizle','Posprzątaj łazienkę','Curăță baia'],
    ['skills.def.garden.name','Tuinieren','Gardening','Bahçe işleri','Ogrodnictwo','Grădinărit'],
    ['skills.def.garden.desc','Werk in de tuin','Work in the garden','Bahçede çalış','Popracuj w ogrodzie','Lucrează în grădină'],
    ['skills.def.trash.name','Vuilnis','Trash','Çöp','Śmieci','Gunoi'],
    ['skills.def.trash.desc','Breng de vuilnisbakken weg','Take out the bins','Çöpleri çıkar','Wynieś pojemniki','Scoate tomberoanele'],
    ['skills.def.finance_sk.name','Budgetteren','Budgeting','Bütçeleme','Budżetowanie','Bugetare'],
    ['skills.def.finance_sk.desc','Bijhouden van financiën','Track finances','Finansları takip et','Prowadź finanse','Urmărește finanțele'],
    ['skills.def.planning.name','Plannen','Planning','Planlama','Planowanie','Planificare'],
    ['skills.def.planning.desc','Plan taken en activiteiten','Plan tasks and activities','Görev ve etkinlikleri planla','Planuj zadania i aktywności','Planifică sarcini și activități'],

    ['skills.level.1','🐣 Absolute beginner','🐣 Absolute beginner','🐣 Tam acemi','🐣 Absolutny początkujący','🐣 Începător absolut'],
    ['skills.level.2','🤷 Hoe doe je dit ook alweer?','🤷 How did this work again?','🤷 Bu nasıl yapılıyordu?','🤷 Jak to się robiło?','🤷 Cum se făcea asta?'],
    ['skills.level.3','😬 Gevaar voor omgeving','😬 Hazard to the surroundings','😬 Çevre için tehlike','😬 Zagrożenie dla otoczenia','😬 Pericol pentru împrejurimi'],
    ['skills.level.4','🧹 Bijna nuttig','🧹 Almost useful','🧹 Neredeyse faydalı','🧹 Prawie przydatny','🧹 Aproape util'],
    ['skills.level.5','👀 Het lijkt ergens op','👀 Starting to look like something','👀 Bir şeye benzemeye başladı','👀 Zaczyna to wyglądać','👀 Începe să semene a ceva'],
    ['skills.level.6','🐌 Langzaam maar zeker','🐌 Slowly but surely','🐌 Yavaş ama emin','🐌 Powoli, ale pewnie','🐌 Încet, dar sigur'],
    ['skills.level.7','🙂 Doet het gewoon','🙂 Gets it done','🙂 İşini yapıyor','🙂 Po prostu działa','🙂 Își face treaba'],
    ['skills.level.8','💪 Je begint het door te krijgen','💪 You are getting the hang of it','💪 İşi çözmeye başlıyorsun','💪 Zaczynasz łapać','💪 Începi să te prinzi'],
    ['skills.level.9','✅ Betrouwbaar','✅ Reliable','✅ Güvenilir','✅ Niezawodny','✅ De încredere'],
    ['skills.level.10','🌟 Echt goed bezig','🌟 Doing really well','🌟 Gerçekten iyisin','🌟 Naprawdę świetnie','🌟 Te descurci foarte bine'],
    ['skills.level.11','⚡ Vlot aan het werk','⚡ Smooth operator','⚡ Seri çalışıyor','⚡ Sprawnie do pracy','⚡ Lucrezi eficient'],
    ['skills.level.12','🏅 Trots op jezelf','🏅 Be proud of yourself','🏅 Kendinle gurur duy','🏅 Możesz być z siebie dumny','🏅 Fii mândru de tine'],
    ['skills.level.13','🎖️ Semi-professional','🎖️ Semi-professional','🎖️ Yarı profesyonel','🎖️ Półprofesjonalista','🎖️ Semi-profesionist'],
    ['skills.level.14','🔥 Onomstreden expert','🔥 Undisputed expert','🔥 Tartışmasız uzman','🔥 Niekwestionowany ekspert','🔥 Expert incontestabil'],
    ['skills.level.15','👑 Huishoud-legende','👑 Household legend','👑 Ev işleri efsanesi','👑 Legenda domu','👑 Legendă a casei'],
    ['skills.level.16','🌌 Mythische status','🌌 Mythic status','🌌 Mitik seviye','🌌 Status mityczny','🌌 Statut mitic'],
    ['skills.level.17','⚗️ Wijze der wijzen','⚗️ Wisest of the wise','⚗️ Bilgelerin bilgesi','⚗️ Mędrzec nad mędrcami','⚗️ Înțeleptul înțelepților'],
    ['skills.level.18','🦄 Bestaat maar 1x','🦄 One of a kind','🦄 Eşi benzeri yok','🦄 Jedyny w swoim rodzaju','🦄 Unic în felul său'],
    ['skills.level.19','🌠 Boven het niveau','🌠 Beyond the level','🌠 Seviyenin ötesinde','🌠 Ponad poziomem','🌠 Dincolo de nivel'],
    ['skills.level.20','🧬 Aangeboren talent','🧬 Natural talent','🧬 Doğuştan yetenek','🧬 Wrodzony talent','🧬 Talent înnăscut'],
    ['skills.level.21','🔮 Ziet de was aankomen','🔮 Sees the laundry coming','🔮 Çamaşırı önceden görür','🔮 Przewiduje pranie','🔮 Simte rufele dinainte'],
    ['skills.level.22','🌍 Aardse perfectie','🌍 Earthly perfection','🌍 Dünyevi mükemmellik','🌍 Ziemska perfekcja','🌍 Perfecțiune pământească'],
    ['skills.level.23','🪐 Planetaire schoonmaak','🪐 Planetary cleaning','🪐 Gezegensel temizlik','🪐 Planetarne sprzątanie','🪐 Curățenie planetară'],
    ['skills.level.24','☀️ Zon schijnt op jou','☀️ The sun shines on you','☀️ Güneş senin için parlıyor','☀️ Słońce świeci dla ciebie','☀️ Soarele strălucește pentru tine'],
    ['skills.level.25','⚡ Taak-godheid','⚡ Task deity','⚡ Görev tanrısı','⚡ Bóstwo zadań','⚡ Zeitate a sarcinilor'],
    ['skills.level.26','🌌 Kosmische meester','🌌 Cosmic master','🌌 Kozmik usta','🌌 Kosmiczny mistrz','🌌 Maestru cosmic'],
    ['skills.level.27','🦋 Één met het huishouden','🦋 One with the household','🦋 Evle bir bütün','🦋 Jedność z domem','🦋 Una cu gospodăria'],

    ['skills.diff.easy','Makkelijk','Easy','Kolay','Łatwe','Ușor'],
    ['skills.diff.normal','Normaal','Normal','Normal','Normalne','Normal'],
    ['skills.diff.challenging','Uitdagend','Challenging','Zorlu','Wymagające','Provocator'],
    ['skills.diff.hard','Zwaar','Hard','Zor','Trudne','Dificil'],
    ['skills.diff.epic','Episch','Epic','Epik','Epickie','Epic'],

    ['skills.quest.extra2','Doe 2 extra taken deze week','Do 2 extra tasks this week','Bu hafta 2 ekstra görev yap','Zrób 2 dodatkowe zadania w tym tygodniu','Fă 2 sarcini extra săptămâna aceasta'],
    ['skills.quest.extra3','Doe 3 extra taken deze week','Do 3 extra tasks this week','Bu hafta 3 ekstra görev yap','Zrób 3 dodatkowe zadania w tym tygodniu','Fă 3 sarcini extra săptămâna aceasta'],
    ['skills.quest.extra5','Doe 5 extra taken deze week','Do 5 extra tasks this week','Bu hafta 5 ekstra görev yap','Zrób 5 dodatkowych zadań w tym tygodniu','Fă 5 sarcini extra săptămâna aceasta'],
    ['skills.quest.extra8','Doe 8 extra taken — held van de week','Do 8 extra tasks — hero of the week','8 ekstra görev yap — haftanın kahramanı','Zrób 8 dodatkowych zadań — bohater tygodnia','Fă 8 sarcini extra — eroul săptămânii'],
    ['skills.quest.extra10','Doe 10 extra taken — legendarisch!','Do 10 extra tasks — legendary!','10 ekstra görev yap — efsanevi!','Zrób 10 dodatkowych zadań — legendarnie!','Fă 10 sarcini extra — legendar!'],
    ['skills.quest.house','Doe 3 extra huishoud-taken','Do 3 extra household tasks','3 ekstra ev işi yap','Zrób 3 dodatkowe prace domowe','Fă 3 sarcini casnice extra'],
    ['skills.quest.cooking','Doe 3 extra kook-taken','Do 3 extra cooking tasks','3 ekstra yemek görevi yap','Zrób 3 dodatkowe zadania kulinarne','Fă 3 sarcini de gătit extra'],
    ['skills.quest.groceries','Doe 3 extra boodschappen-taken','Do 3 extra grocery tasks','3 ekstra alışveriş görevi yap','Zrób 3 dodatkowe zadania zakupowe','Fă 3 sarcini de cumpărături extra'],
    ['skills.quest.streak','Doe elke dag 1+ extra taak (5 dagen)','Do 1+ extra task each day (5 days)','Her gün 1+ ekstra görev yap (5 gün)','Rób codziennie 1+ dodatkowe zadanie (5 dni)','Fă 1+ sarcină extra zilnic (5 zile)'],
    ['skills.quest.blitz','Doe 4 extra taken op één dag','Do 4 extra tasks in one day','Bir günde 4 ekstra görev yap','Zrób 4 dodatkowe zadania w jeden dzień','Fă 4 sarcini extra într-o singură zi'],

    ['skills.weekly.title','📜 Weekly Quests — Week {{week}}','📜 Weekly Quests — Week {{week}}','📜 Haftalık Görevler — Hafta {{week}}','📜 Zadania tygodniowe — Tydzień {{week}}','📜 Questuri săptămânale — Săptămâna {{week}}'],
    ['skills.weekly.onlyExtra','📌 Alleen extra taken tellen — taken die je doet boven je {{baseline}} vaste taken.','📌 Only extra tasks count — tasks you do above your {{baseline}} regular tasks.','📌 Yalnızca ekstra görevler sayılır — {{baseline}} düzenli görevinin üzerindeki görevler.','📌 Liczą się tylko dodatkowe zadania — ponad {{baseline}} stałych zadań.','📌 Contează doar sarcinile extra — peste cele {{baseline}} sarcini obișnuite.'],
    ['skills.weekly.canEarn','🏆 Je kunt nog 1 ability verdienen deze week!','🏆 You can still earn 1 ability this week!','🏆 Bu hafta hâlâ 1 yetenek kazanabilirsin!','🏆 Możesz jeszcze zdobyć 1 umiejętność w tym tygodniu!','🏆 Mai poți câștiga 1 abilitate săptămâna aceasta!'],
    ['skills.weekly.earned','✅ Ability al verdiend deze week. Extra quests = +20 XP.','✅ Ability already earned this week. Extra quests = +20 XP.','✅ Bu hafta yetenek zaten kazanıldı. Ek görevler = +20 XP.','✅ Umiejętność już zdobyta w tym tygodniu. Dodatkowe questy = +20 XP.','✅ Abilitate deja câștigată săptămâna aceasta. Questurile extra = +20 XP.'],
    ['skills.weekly.claim','🎁 Claim!','🎁 Claim!','🎁 Al!','🎁 Odbierz!','🎁 Revendică!'],
    ['skills.weekly.questComplete','📜 Quest voltooid! Je hebt al een ability deze week — +20 XP bonus','📜 Quest completed! You already earned an ability this week — +20 XP bonus','📜 Görev tamamlandı! Bu hafta zaten bir yetenek kazandın — +20 XP bonus','📜 Quest ukończony! Masz już umiejętność w tym tygodniu — bonus +20 XP','📜 Quest finalizat! Ai deja o abilitate săptămâna aceasta — bonus +20 XP'],
    ['skills.weekly.completed','✅ Quest voltooid!','✅ Quest completed!','✅ Görev tamamlandı!','✅ Quest ukończony!','✅ Quest finalizat!'],
    ['skills.weekly.reward','Beloning: {{ability}}','Reward: {{ability}}','Ödül: {{ability}}','Nagroda: {{ability}}','Recompensă: {{ability}}'],
    ['skills.weekly.claimAbility','🎁 Claim ability!','🎁 Claim ability!','🎁 Yeteneği al!','🎁 Odbierz umiejętność!','🎁 Revendică abilitatea!'],
    ['skills.weekly.questReward','Quest beloning','Quest reward','Görev ödülü','Nagroda questa','Recompensă quest'],
    ['skills.weekly.abilityEarned','🪄 Ability verkregen!','🪄 Ability obtained!','🪄 Yetenek kazanıldı!','🪄 Zdobyto umiejętność!','🪄 Abilitate obținută!'],
    ['skills.weekly.useVia','Gebruik via Achievements → 🪄 Abilities','Use via Achievements → 🪄 Abilities','Achievements → 🪄 Abilities üzerinden kullan','Użyj przez Osiągnięcia → 🪄 Umiejętności','Folosește prin Realizări → 🪄 Abilități'],
    ['skills.weekly.earnedNotif','{{name}} verdiende een ability!','{{name}} earned an ability!','{{name}} bir yetenek kazandı!','{{name}} zdobył(a) umiejętność!','{{name}} a câștigat o abilitate!'],
    ['skills.weekly.earnedDetail','{{ability}} — verdient door extra inzet deze week','{{ability}} — earned through extra effort this week','{{ability}} — bu haftaki ekstra çabayla kazanıldı','{{ability}} — zdobyta dzięki dodatkowym staraniom w tym tygodniu','{{ability}} — câștigată prin efort suplimentar săptămâna aceasta'],
    ['skills.weekly.earnedActivity','{{name}} verdiende ability: {{ability}}','{{name}} earned ability: {{ability}}','{{name}} yetenek kazandı: {{ability}}','{{name}} zdobył(a) umiejętność: {{ability}}','{{name}} a câștigat abilitatea: {{ability}}'],

    ['skills.abilities.titleAvailable','🪄 Abilities ({{count}} beschikbaar)','🪄 Abilities ({{count}} available)','🪄 Yetenekler ({{count}} mevcut)','🪄 Umiejętności (dostępne: {{count}})','🪄 Abilități ({{count}} disponibile)'],
    ['skills.abilities.titleEarn','🪄 Abilities — verdien via quests','🪄 Abilities — earn through quests','🪄 Yetenekler — görevlerle kazan','🪄 Umiejętności — zdobywaj przez questy','🪄 Abilități — câștigă prin questuri'],
    ['skills.abilities.use','Inzetten →','Use →','Kullan →','Użyj →','Folosește →'],
    ['skills.abilities.empty','Verdien abilities door weekly quests te voltooien.','Earn abilities by completing weekly quests.','Haftalık görevleri tamamlayarak yetenek kazan.','Zdobywaj umiejętności, wykonując zadania tygodniowe.','Câștigă abilități finalizând questurile săptămânale.'],
    ['skills.abilities.maxOne','Maximaal 1 ability per week','Maximum 1 ability per week','Haftada en fazla 1 yetenek','Maksymalnie 1 umiejętność tygodniowo','Maximum 1 abilitate pe săptămână'],
    ['skills.abilities.locked','🔒 Vergrendeld','🔒 Locked','🔒 Kilitli','🔒 Zablokowane','🔒 Blocat'],
    ['skills.abilities.more','...en nog {{count}} meer','...and {{count}} more','...ve {{count}} tane daha','...i jeszcze {{count}}','...și încă {{count}}'],
    ['skills.group.postpone','⏰ Uitstel','⏰ Postpone','⏰ Erteleme','⏰ Odroczenie','⏰ Amânare'],
    ['skills.group.manipulation','🔄 Manipulatie','🔄 Manipulation','🔄 Değişiklik','🔄 Manipulacja','🔄 Manipulare'],
    ['skills.group.protection','🛡️ Bescherming','🛡️ Protection','🛡️ Koruma','🛡️ Ochrona','🛡️ Protecție'],
    ['skills.group.xp','⚡ XP Boosts','⚡ XP Boosts','⚡ XP Güçlendirmeleri','⚡ Wzmocnienia XP','⚡ Boosturi XP'],
    ['skills.group.forgive','🎁 Vergeven','🎁 Forgive','🎁 Affetme','🎁 Wybaczenie','🎁 Iertare'],
    ['skills.group.special','🕵️ Speciaal','🕵️ Special','🕵️ Özel','🕵️ Specjalne','🕵️ Special'],
    ['skills.ability.postpone1.name','Dag Uitstel','Day Postpone','Günlük Erteleme','Dzień odroczenia','Amânare o zi'],
    ['skills.ability.postpone1.desc','Stel een taak 1 dag uit, geen straf','Postpone a task by 1 day, no penalty','Bir görevi 1 gün ertele, ceza yok','Przełóż zadanie o 1 dzień bez kary','Amână o sarcină cu 1 zi, fără penalizare'],
    ['skills.ability.postpone2.name','Weekend Uitstel','Weekend Postpone','Hafta Sonu Erteleme','Weekendowe odroczenie','Amânare de weekend'],
    ['skills.ability.postpone2.desc','Stel een taak 2 dagen uit','Postpone a task by 2 days','Bir görevi 2 gün ertele','Przełóż zadanie o 2 dni','Amână o sarcină cu 2 zile'],
    ['skills.ability.postpone7.name','Week Verlof','Week Off','Bir Hafta İzin','Tydzień wolnego','O săptămână liberă'],
    ['skills.ability.postpone7.desc','Geef een taak een week respijt','Give a task one week of breathing room','Bir göreve bir hafta süre tanı','Daj zadaniu tydzień oddechu','Oferă unei sarcini o săptămână de răgaz'],
    ['skills.ability.postpone14.name','Twee Weken Rust','Two Weeks Rest','İki Hafta Mola','Dwa tygodnie spokoju','Două săptămâni de pauză'],
    ['skills.ability.postpone14.desc','Taak 14 dagen op pauze zetten','Pause a task for 14 days','Görevi 14 gün duraklat','Wstrzymaj zadanie na 14 dni','Pune sarcina pe pauză 14 zile'],
    ['skills.ability.freetrade.name','Gratis Ruil','Free Swap','Ücretsiz Takas','Darmowa zamiana','Schimb gratuit'],
    ['skills.ability.freetrade.desc','Ruil een taak zonder tegenprestatie','Swap a task without anything in return','Bir görevi karşılıksız değiştir','Zamień zadanie bez świadczenia w zamian','Schimbă o sarcină fără nimic în schimb'],
    ['skills.ability.reassign.name','Taak Overdragen','Reassign Task','Görevi Devret','Przekaż zadanie','Transferă sarcina'],
    ['skills.ability.reassign.desc','Wijs een taak toe aan de ander zonder akkoord','Assign a task to the other person without approval','Onay olmadan görevi diğer kişiye ata','Przypisz zadanie drugiej osobie bez zgody','Atribuie sarcina celeilalte persoane fără aprobare'],
    ['skills.ability.split.name','Taak Halveren','Split Task','Görevi Böl','Podziel zadanie','Împarte sarcina'],
    ['skills.ability.split.desc','Splits een zware taak in twee kleinere','Split a heavy task into two smaller ones','Zor bir görevi iki küçük göreve böl','Podziel trudne zadanie na dwa mniejsze','Împarte o sarcină grea în două mai mici'],
    ['skills.ability.shield.name','Taak-schild','Task Shield','Görev Kalkanı','Tarcza zadania','Scut pentru sarcină'],
    ['skills.ability.shield.desc','Bescherm één taak deze week van deadlines','Protect one task from deadlines this week','Bu hafta bir görevi son tarihlerden koru','Chroń jedno zadanie przed terminami w tym tygodniu','Protejează o sarcină de termene săptămâna aceasta'],
    ['skills.ability.freeze.name','Taak-bevriezing','Task Freeze','Görev Dondurma','Zamrożenie zadania','Înghețare sarcină'],
    ['skills.ability.freeze.desc','Bevries een taak — tijdelijk onzichtbaar','Freeze a task — temporarily hidden','Bir görevi dondur — geçici olarak gizli','Zamroź zadanie — tymczasowo ukryte','Îngheață o sarcină — ascunsă temporar'],
    ['skills.ability.bubble.name','Zeepbel-modus','Bubble Mode','Baloncuk Modu','Tryb bańki','Mod bulă'],
    ['skills.ability.bubble.desc','Jouw taken zijn deze week onaantastbaar','Your tasks cannot be touched this week','Görevlerin bu hafta dokunulmaz','Twoje zadania są nietykalne w tym tygodniu','Sarcinile tale sunt de neatins săptămâna aceasta'],
    ['skills.ability.double.name','Dubbel-XP','Double XP','Çift XP','Podwójne XP','XP dublu'],
    ['skills.ability.double.desc','Volgende taak geeft dubbele XP','Your next task gives double XP','Sonraki görev çift XP verir','Następne zadanie daje podwójne XP','Următoarea sarcină oferă XP dublu'],
    ['skills.ability.triple.name','Triple-XP','Triple XP','Üçlü XP','Potrójne XP','XP triplu'],
    ['skills.ability.triple.desc','Volgende taak geeft drievoudige XP','Your next task gives triple XP','Sonraki görev üçlü XP verir','Następne zadanie daje potrójne XP','Următoarea sarcină oferă XP triplu'],
    ['skills.ability.xpbomb.name','XP-bom','XP Bomb','XP Bombası','Bomba XP','Bombă XP'],
    ['skills.ability.xpbomb.desc','Alle taken deze dag geven +50% XP','All tasks today give +50% XP','Bugünkü tüm görevler +%50 XP verir','Wszystkie zadania dzisiaj dają +50% XP','Toate sarcinile de azi oferă +50% XP'],
    ['skills.ability.skillboost.name','Skill-turbo','Skill Turbo','Beceri Turbo','Turbo umiejętności','Turbo abilitate'],
    ['skills.ability.skillboost.desc','Volgende skill-taak geeft 3x skill XP','Next skill task gives 3x skill XP','Sonraki beceri görevi 3x beceri XP verir','Następne zadanie umiejętności daje 3x XP','Următoarea sarcină de abilitate oferă 3x XP'],
    ['skills.ability.pardonne.name','Vrij Pardon','Free Pardon','Ücretsiz Af','Darmowe ułaskawienie','Iertare gratuită'],
    ['skills.ability.pardonne.desc','Verwijder een taak volledig zonder gevolgen','Remove a task completely without consequences','Bir görevi sonuç olmadan tamamen sil','Usuń zadanie całkowicie bez konsekwencji','Șterge complet o sarcină fără consecințe'],
    ['skills.ability.amnesia.name','Selectieve Amnesie','Selective Amnesia','Seçici Hafıza Kaybı','Selektywna amnezja','Amnezie selectivă'],
    ['skills.ability.amnesia.desc','Verwijder 3 taken tegelijk — poof, weg!','Remove 3 tasks at once — poof, gone!','3 görevi birden sil — puf, gitti!','Usuń 3 zadania naraz — puf, zniknęły!','Șterge 3 sarcini odată — puf, au dispărut!'],
    ['skills.ability.spy.name','Taak-spion','Task Spy','Görev Casusu','Szpieg zadań','Spion de sarcini'],
    ['skills.ability.spy.desc','Bekijk alle verborgen/bevroren taken van de ander','See all hidden/frozen tasks of the other person','Diğer kişinin tüm gizli/dondurulmuş görevlerini gör','Zobacz wszystkie ukryte/zamrożone zadania drugiej osoby','Vezi toate sarcinile ascunse/înghețate ale celeilalte persoane'],
    ['skills.ability.copycat.name','Kopieer-kat','Copycat','Taklitçi','Naśladowca','Imitator'],
    ['skills.ability.copycat.desc','Kopieer een voltooide taak van de ander als gedaan','Copy a completed task from the other person as done','Diğer kişinin tamamlanmış görevini yapılmış olarak kopyala','Skopiuj ukończone zadanie drugiej osoby jako wykonane','Copiază o sarcină finalizată de cealaltă persoană ca făcută'],
    ['skills.ability.streak_saver.name','Streak-redder','Streak Saver','Seri Kurtarıcı','Ratownik serii','Salvator de serie'],
    ['skills.ability.streak_saver.desc','Bescherm je streak als je een week mist','Protect your streak if you miss a week','Bir haftayı kaçırırsan serini koru','Chroń serię, jeśli ominiesz tydzień','Protejează seria dacă ratezi o săptămână'],
    ['skills.ability.auto_done.name','Auto-piloot','Auto Pilot','Otomatik Pilot','Autopilot','Pilot automat'],
    ['skills.ability.auto_done.desc','Markeer een taak als gedaan zonder hem te doen','Mark a task as done without doing it','Görevi yapmadan tamamlandı olarak işaretle','Oznacz zadanie jako wykonane bez robienia go','Marchează o sarcină ca făcută fără să o faci'],
    ['skills.ability.budget_eye.name','Budget-röntgen','Budget X-Ray','Bütçe Röntgeni','Rentgen budżetu','Radiografie buget'],
    ['skills.ability.budget_eye.desc','Zie alle uitgaven van de ander deze maand','See all spending by the other person this month','Bu ay diğer kişinin tüm harcamalarını gör','Zobacz wszystkie wydatki drugiej osoby w tym miesiącu','Vezi toate cheltuielile celeilalte persoane luna aceasta'],
    ['skills.ability.savings_boost.name','Spaar-multiplier','Savings Multiplier','Tasarruf Çarpanı','Mnożnik oszczędności','Multiplicator economii'],
    ['skills.ability.savings_boost.desc','Volgende storting telt dubbel in de tracker','Next deposit counts double in the tracker','Sonraki yatırma takipte iki kat sayılır','Następna wpłata liczy się podwójnie w trackerze','Următoarea depunere contează dublu în tracker']





,

    ['shop.title','Boodschappen','Groceries','Alışveriş','Zakupy','Cumpărături'],
    ['shop.add','Toevoegen','Add','Ekle','Dodaj','Adaugă'],
    ['shop.addPlus','+ Toevoegen','+ Add','+ Ekle','+ Dodaj','+ Adaugă'],
    ['shop.list','Winkellijst','Shopping list','Alışveriş listesi','Lista zakupów','Listă de cumpărături'],
    ['shop.toBuy','Te kopen','To buy','Alınacak','Do kupienia','De cumpărat'],
    ['shop.bought','Gekocht','Bought','Alındı','Kupione','Cumpărat'],
    ['shop.familyLive','Gezin · live','Family · live','Aile · canlı','Rodzina · na żywo','Familie · live'],
    ['shop.onlyMe','Alleen ik','Only me','Sadece ben','Tylko ja','Doar eu'],
    ['shop.toBuyMeta','{{count}} te kopen','{{count}} to buy','{{count}} alınacak','Do kupienia: {{count}}','De cumpărat: {{count}}'],
    ['shop.clearBought','Gekochte items verwijderen','Remove bought items','Alınan ürünleri sil','Usuń kupione produkty','Șterge articolele cumpărate'],
    ['shop.finishBought','Gekochte items afronden','Finish bought items','Alınan ürünleri tamamla','Zakończ kupione produkty','Finalizează articolele cumpărate'],
    ['shop.finish','Afronden','Finish','Tamamla','Zakończ','Finalizează'],
    ['shop.boughtReceiptOptional','{{count}} gekocht · bon opslaan is optioneel','{{count}} bought · saving the receipt is optional','{{count}} alındı · fişi kaydetmek isteğe bağlıdır','Kupiono: {{count}} · zapis paragonu jest opcjonalny','Cumpărate: {{count}} · salvarea bonului este opțională'],
    ['shop.allAtHome','Alles in huis','Everything at home','Evde her şey var','Wszystko jest w domu','Totul este în casă'],
    ['shop.emptyOpen','Voeg een product toe wanneer je iets nodig hebt.','Add a product when you need something.','Bir şeye ihtiyacın olduğunda ürün ekle.','Dodaj produkt, gdy czegoś potrzebujesz.','Adaugă un produs când ai nevoie de ceva.'],
    ['shop.noneBought','Nog niets gekocht','Nothing bought yet','Henüz bir şey alınmadı','Jeszcze nic nie kupiono','Încă nu s-a cumpărat nimic'],
    ['shop.emptyBought','Afgevinkte producten verschijnen hier direct.','Checked-off products appear here immediately.','İşaretlenen ürünler burada hemen görünür.','Odznaczone produkty pojawią się tutaj od razu.','Produsele bifate apar imediat aici.'],
    ['shop.other','Overig','Other','Diğer','Inne','Altele'],
    ['shop.newList','Nieuwe lijst','New list','Yeni liste','Nowa lista','Listă nouă'],
    ['shop.chooseList','Winkellijst kiezen','Choose shopping list','Alışveriş listesi seç','Wybierz listę zakupów','Alege lista de cumpărături'],
    ['shop.newShoppingList','Nieuwe winkellijst','New shopping list','Yeni alışveriş listesi','Nowa lista zakupów','Listă nouă de cumpărături'],
    ['shop.name','Naam','Name','Ad','Nazwa','Nume'],
    ['shop.visibility','Zichtbaarheid','Visibility','Görünürlük','Widoczność','Vizibilitate'],
    ['shop.createList','Lijst maken','Create list','Liste oluştur','Utwórz listę','Creează lista'],

    ['feed.post','Posten','Post','Paylaş','Opublikuj','Publică'],
    ['feed.sharePlaceholder','Deel iets met het gezin...','Share something with the family...','Ailenle bir şey paylaş...','Podziel się czymś z rodziną...','Împărtășește ceva cu familia...'],
    ['feed.tasks','Taken','Tasks','Görevler','Zadania','Sarcini'],
    ['feed.appointments','Afspraken','Appointments','Randevular','Wydarzenia','Programări'],
    ['feed.groceries','Boodschappen','Groceries','Alışveriş','Zakupy','Cumpărături'],
    ['feed.updates','Updates','Updates','Güncellemeler','Aktualizacje','Actualizări'],
    ['feed.allUpdates','Alle updates','All updates','Tüm güncellemeler','Wszystkie aktualizacje','Toate actualizările'],
    ['feed.completedCount','{{count}} afgerond','{{count}} completed','{{count}} tamamlandı','Ukończono: {{count}}','Finalizate: {{count}}'],
    ['feed.plannedCount','{{count}} gepland','{{count}} planned','{{count}} planlandı','Zaplanowano: {{count}}','Planificate: {{count}}'],
    ['feed.totalCount','{{count}} totaal','{{count}} total','Toplam {{count}}','Łącznie: {{count}}','Total: {{count}}'],
    ['feed.newCount','{{count}} nieuw','{{count}} new','{{count}} yeni','Nowe: {{count}}','Noi: {{count}}'],
    ['feed.newTaskKicker','NIEUWE TAAK','NEW TASK','YENİ GÖREV','NOWE ZADANIE','SARCINĂ NOUĂ'],
    ['feed.taskReady','Klaar om opgepakt te worden','Ready to be picked up','Üstlenilmeye hazır','Gotowe do podjęcia','Gata de preluat'],
    ['feed.taskCreated','Iets om straks af te vinken','Something to check off later','Sonra işaretlenecek bir şey','Coś do odhaczenia później','Ceva de bifat mai târziu'],
    ['feed.taskPlannedBy','{{name}} zette “{{task}}” op de planning','{{name}} added “{{task}}” to the plan','{{name}}, “{{task}}” görevini plana ekledi','{{name}} dodał(a) „{{task}}” do planu','{{name}} a adăugat „{{task}}” în plan'],

    ['cleaning.today','Vandaag','Today','Bugün','Dzisiaj','Astăzi'],
    ['cleaning.rooms','Kamers','Rooms','Odalar','Pokoje','Camere'],
    ['cleaning.weekplan','Weekplan','Week plan','Haftalık plan','Plan tygodnia','Plan săptămânal'],
    ['cleaning.history','Historie','History','Geçmiş','Historia','Istoric'],
    ['cleaning.housekeeping','HUISHOUDEN','HOUSEHOLD','EV İŞLERİ','DOM','GOSPODĂRIE'],
    ['cleaning.addRoom','+ Kamer','+ Room','+ Oda','+ Pokój','+ Cameră'],
    ['cleaning.routinesCount','{{count}} routines','{{count}} routines','{{count}} rutin','Rutyny: {{count}}','Rutine: {{count}}'],
    ['cleaning.heroKicker','SCHOONMAKEN','CLEANING','TEMİZLİK','SPRZĄTANIE','CURĂȚENIE'],
    ['cleaning.heroTitle','Rust in huis, zonder gedoe.','A calm home, without the hassle.','Evde huzur, zahmetsiz.','Spokojny dom, bez zamieszania.','O casă liniștită, fără bătaie de cap.'],
    ['cleaning.toDo','TE DOEN','TO DO','YAPILACAK','DO ZROBIENIA','DE FĂCUT'],
    ['cleaning.turnsInView','{{count}} beurten in beeld · {{minutes}} min','{{count}} turns in view · {{minutes}} min','Görünümde {{count}} tur · {{minutes}} dk','Widoczne tury: {{count}} · {{minutes}} min','Ture afișate: {{count}} · {{minutes}} min'],
    ['cleaning.noneOpen','Geen open schoonmaakbeurten','No open cleaning turns','Açık temizlik turu yok','Brak otwartych tur sprzątania','Nu există ture de curățenie deschise'],
    ['cleaning.noneOpenHint','Maak een weekplan of voeg eerst kamers en routines toe.','Create a week plan or add rooms and routines first.','Bir haftalık plan oluştur veya önce oda ve rutin ekle.','Utwórz plan tygodnia albo najpierw dodaj pokoje i rutyny.','Creează un plan săptămânal sau adaugă mai întâi camere și rutine.'],
    ['cleaning.planKicker','WEEKPLAN','WEEK PLAN','HAFTALIK PLAN','PLAN TYGODNIA','PLAN SĂPTĂMÂNAL'],
    ['cleaning.updatePlan','Werkplan bijwerken','Update work plan','Çalışma planını güncelle','Aktualizuj plan pracy','Actualizează planul de lucru'],
    ['cleaning.updatePlanBusy','Werkplan bijwerken…','Updating work plan…','Çalışma planı güncelleniyor…','Aktualizowanie planu pracy…','Se actualizează planul de lucru…'],
    ['cleaning.makePlan','Maak werkplan','Create work plan','Çalışma planı oluştur','Utwórz plan pracy','Creează planul de lucru'],
    ['cleaning.planning','PLANNING','PLANNING','PLANLAMA','PLANOWANIE','PLANIFICARE'],
    ['cleaning.perRoom','Per kamer','By room','Odaya göre','Według pokoju','Pe cameră'],
    ['cleaning.turnsMinutes','{{count}} beurten · {{minutes}} min','{{count}} turns · {{minutes}} min','{{count}} tur · {{minutes}} dk','Tury: {{count}} · {{minutes}} min','Ture: {{count}} · {{minutes}} min'],
    ['cleaning.doneMeta','{{done}} / {{total}} klaar · {{minutes}} min','{{done}} / {{total}} done · {{minutes}} min','{{done}} / {{total}} tamam · {{minutes}} dk','{{done}} / {{total}} gotowe · {{minutes}} min','{{done}} / {{total}} gata · {{minutes}} min'],
    ['cleaning.historyKicker','HISTORIE','HISTORY','GEÇMİŞ','HISTORIA','ISTORIC'],
    ['cleaning.historyTitle','Wat is er gedaan?','What has been done?','Neler yapıldı?','Co zostało zrobione?','Ce s-a făcut?'],
    ['cleaning.historySubtitle','Een rustig overzicht van afgeronde schoonmaakbeurten per kamer en routine.','A clear overview of completed cleaning turns by room and routine.','Oda ve rutine göre tamamlanan temizlik turlarının sade bir özeti.','Przejrzysty przegląd ukończonych tur sprzątania według pokoju i rutyny.','O prezentare clară a turelor de curățenie finalizate pe cameră și rutină.'],
    ['cleaning.thisWeek','deze week','this week','bu hafta','w tym tygodniu','săptămâna aceasta'],
    ['cleaning.minutes','minuten','minutes','dakika','minuty','minute'],
    ['cleaning.householdMembers','gezinsleden','family members','aile üyeleri','członkowie rodziny','membri ai familiei'],
    ['cleaning.last','Laatst','Last','Son','Ostatnio','Ultima dată'],
    ['cleaning.room','Kamer','Room','Oda','Pokój','Cameră'],
    ['cleaning.roomNew','Nieuwe kamer','New room','Yeni oda','Nowy pokój','Cameră nouă'],
    ['cleaning.roomEdit','Kamer bewerken','Edit room','Odayı düzenle','Edytuj pokój','Editează camera'],
    ['cleaning.roomDelete','Kamer verwijderen','Delete room','Odayı sil','Usuń pokój','Șterge camera'],
    ['cleaning.routines','Routines','Routines','Rutinler','Rutyny','Rutine'],
    ['cleaning.routineNew','Nieuwe routine','New routine','Yeni rutin','Nowa rutyna','Rutină nouă'],
    ['cleaning.routineEdit','Routine bewerken','Edit routine','Rutini düzenle','Edytuj rutynę','Editează rutina'],
    ['cleaning.routineDelete','Routine verwijderen','Delete routine','Rutini sil','Usuń rutynę','Șterge rutina'],
    ['cleaning.supplies','Benodigdheden','Supplies','Malzemeler','Materiały','Materiale'],
    ['cleaning.completeAll','Alles afronden','Complete all','Tümünü tamamla','Ukończ wszystko','Finalizează tot'],
    ['cleaning.saved','Opgeslagen ✓','Saved ✓','Kaydedildi ✓','Zapisano ✓','Salvat ✓'],
    ['cleaning.saving','Opslaan…','Saving…','Kaydediliyor…','Zapisywanie…','Se salvează…'],
    ['cleaning.next','Eerstvolgend','Next','Sıradaki','Następne','Următoarea'],
    ['cleaning.turns','Beurten','Turns','Turlar','Tury','Ture'],
    ['cleaning.completedCount','{{count}} afgerond','{{count}} completed','{{count}} tamamlandı','Ukończono: {{count}}','Finalizate: {{count}}'],
    ['cleaning.noRooms','Nog geen kamers','No rooms yet','Henüz oda yok','Brak pokoi','Încă nu există camere'],
    ['cleaning.noRoomsHint','Voeg je eerste kamer toe en stel daarna routines in.','Add your first room, then set up routines.','İlk odanı ekle, ardından rutinleri ayarla.','Dodaj pierwszy pokój, a potem ustaw rutyny.','Adaugă prima cameră, apoi configurează rutinele.'],
    ['cleaning.everyone','Iedereen','Everyone','Herkes','Wszyscy','Toată lumea'],
    ['cleaning.noActivePlan','Nog geen actief plan voor deze week.','No active plan for this week yet.','Bu hafta için henüz aktif plan yok.','Brak aktywnego planu na ten tydzień.','Încă nu există un plan activ pentru această săptămână.'],
    ['cleaning.planActive','Weekplan actief','Week plan active','Haftalık plan aktif','Plan tygodnia aktywny','Planul săptămânal este activ'],
    ['cleaning.makePlanBusy','Plan maken…','Creating plan…','Plan oluşturuluyor…','Tworzenie planu…','Se creează planul…'],
    ['cleaning.loadError','Schoonmaken kon niet laden','Cleaning could not load','Temizlik yüklenemedi','Nie udało się wczytać sprzątania','Curățenia nu a putut fi încărcată'],
    ['cleaning.loading','Schoonmaken laden…','Loading cleaning…','Temizlik yükleniyor…','Ładowanie sprzątania…','Se încarcă curățenia…'],
    ['cleaning.turn','Beurt','Turn','Tur','Tura','Tură'],
    ['cleaning.space','Ruimte','Room','Alan','Pomieszczenie','Spațiu'],
    ['cleaning.fixedTasks','Vaste taken','Recurring tasks','Sabit görevler','Stałe zadania','Sarcini recurente'],
    ['cleaning.routine','Routine','Routine','Rutin','Rutyna','Rutină'],
    ['cleaning.everyDays','Elke {{count}} dagen','Every {{count}} days','Her {{count}} günde','Co {{count}} dni','La fiecare {{count}} zile'],
    ['cleaning.noRoutines','Nog geen routines.','No routines yet.','Henüz rutin yok.','Brak rutyn.','Încă nu există rutine.'],
    ['cleaning.quickAdd','Snel toevoegen','Quick add','Hızlı ekle','Szybkie dodawanie','Adăugare rapidă'],
    ['cleaning.suggestions','Suggesties','Suggestions','Öneriler','Sugestie','Sugestii'],
    ['cleaning.edit','Bewerken','Edit','Düzenle','Edytuj','Editează'],
    ['cleaning.new','Nieuw','New','Yeni','Nowy','Nou'],
    ['cleaning.name','Naam','Name','Ad','Nazwa','Nume'],
    ['cleaning.type','Type','Type','Tür','Typ','Tip'],
    ['cleaning.roomPlaceholder','Bijv. Badkamer boven','e.g. Upstairs bathroom','örn. Üst kattaki banyo','np. Łazienka na piętrze','ex. Baia de la etaj'],
    ['cleaning.whatToDo','Wat moet er gebeuren?','What needs to be done?','Ne yapılması gerekiyor?','Co trzeba zrobić?','Ce trebuie făcut?'],
    ['cleaning.everyDaysLabel','Elke … dagen','Every … days','Her … günde','Co … dni','La fiecare … zile'],
    ['cleaning.timeMin','Tijd (min)','Time (min)','Süre (dk)','Czas (min)','Timp (min)'],
    ['cleaning.priority','Prioriteit','Priority','Öncelik','Priorytet','Prioritate'],
    ['cleaning.basic','Basis','Basic','Temel','Podstawowy','De bază'],
    ['cleaning.normal','Normaal','Normal','Normal','Normalny','Normal'],
    ['cleaning.extra','Extra','Extra','Ekstra','Dodatkowy','Extra'],
    ['cleaning.inStock','Op voorraad','In stock','Stokta','W magazynie','În stoc'],
    ['cleaning.lowStock','Bijna op','Low stock','Az kaldı','Niski stan','Stoc redus'],
    ['cleaning.outOfStock','Op','Out','Bitti','Brak','Epuizat'],
    ['cleaning.noSupplies','Nog geen benodigdheden gekoppeld.','No supplies linked yet.','Henüz malzeme bağlanmadı.','Brak przypisanych materiałów.','Încă nu sunt materiale asociate.'],
    ['cleaning.addSupply','Benodigd item toevoegen','Add required item','Gerekli malzeme ekle','Dodaj potrzebny element','Adaugă articol necesar'],
    ['cleaning.supplyPlaceholder','Bijv. Allesreiniger','e.g. Multi-purpose cleaner','örn. Çok amaçlı temizleyici','np. Uniwersalny środek czyszczący','ex. Soluție universală de curățare'],
    ['cleaning.roomSaved','Kamer opgeslagen ✓','Room saved ✓','Oda kaydedildi ✓','Pokój zapisany ✓','Camera a fost salvată ✓'],
    ['cleaning.routineSaved','Routine opgeslagen ✓','Routine saved ✓','Rutin kaydedildi ✓','Rutyna zapisana ✓','Rutina a fost salvată ✓'],
    ['cleaning.routineAdded','Routine toegevoegd ✓','Routine added ✓','Rutin eklendi ✓','Rutyna dodana ✓','Rutina a fost adăugată ✓'],
    ['cleaning.roomRemoved','Kamer verwijderd','Room removed','Oda silindi','Pokój usunięty','Camera a fost ștearsă'],
    ['cleaning.routineRemoved','Routine verwijderd','Routine removed','Rutin silindi','Rutyna usunięta','Rutina a fost ștearsă'],
    ['cleaning.saveFailed','Opslaan mislukt','Save failed','Kaydetme başarısız','Zapisywanie nie powiodło się','Salvarea a eșuat'],
    ['cleaning.deleteFailed','Verwijderen mislukt','Delete failed','Silme başarısız','Usuwanie nie powiodło się','Ștergerea a eșuat'],
    ['cleaning.routineAddFailed','Routine kon niet worden toegevoegd.','Routine could not be added.','Rutin eklenemedi.','Nie udało się dodać rutyny.','Rutina nu a putut fi adăugată.'],
    ['cleaning.roomSaveFailed','Kamer kon niet worden opgeslagen.','Room could not be saved.','Oda kaydedilemedi.','Nie udało się zapisać pokoju.','Camera nu a putut fi salvată.'],
    ['cleaning.routineSaveFailed','Routine kon niet worden opgeslagen.','Routine could not be saved.','Rutin kaydedilemedi.','Nie udało się zapisać rutyny.','Rutina nu a putut fi salvată.'],
    ['cleaning.supplyFirstRoutine','Voeg eerst een routine toe aan deze kamer.','Add a routine to this room first.','Önce bu odaya bir rutin ekle.','Najpierw dodaj rutynę do tego pokoju.','Adaugă mai întâi o rutină în această cameră.'],
    ['cleaning.supplyAddFailed','Kon item niet toevoegen.','Could not add item.','Öğe eklenemedi.','Nie udało się dodać pozycji.','Articolul nu a putut fi adăugat.'],
    ['cleaning.inventorySaveFailed','Voorraadstatus kon niet worden opgeslagen.','Stock status could not be saved.','Stok durumu kaydedilemedi.','Nie udało się zapisać stanu zapasów.','Starea stocului nu a putut fi salvată.'],
    ['cleaning.recurringTasks','Vaste taken','Recurring tasks','Sabit görevler','Stałe zadania','Sarcini recurente'],
    ['cleaning.routineSingular','routine','routine','rutin','rutyna','rutină'],
    ['cleaning.routinePlural','routines','routines','rutin','rutyny','rutine'],
    ['cleaning.history.deletedRoom','Verwijderde ruimte','Deleted room','Silinmiş oda','Usunięty pokój','Cameră ștearsă'],
    ['cleaning.history.cleaningRoutine','Schoonmaakroutine','Cleaning routine','Temizlik rutini','Rutyna sprzątania','Rutină de curățenie'],
    ['cleaning.history.never','Nog nooit','Never','Hiç','Nigdy','Niciodată'],
    ['cleaning.history.yesterday','Gisteren','Yesterday','Dün','Wczoraj','Ieri'],
    ['cleaning.history.completed','Afgerond','Completed','Tamamlandı','Ukończone','Finalizat'],
    ['cleaning.history.carried','Doorgeschoven','Carried forward','Ertelendi','Przeniesione','Reportat'],
    ['cleaning.history.skipped','Overgeslagen','Skipped','Atlandı','Pominięte','Omis'],
    ['cleaning.history.reopened','Heropend','Reopened','Yeniden açıldı','Ponownie otwarte','Redeschis'],
    ['cleaning.history.partial','Deels gedaan','Partially done','Kısmen yapıldı','Częściowo wykonane','Realizat parțial'],
    ['cleaning.history.updated','Bijgewerkt','Updated','Güncellendi','Zaktualizowane','Actualizat'],
    ['cleaning.history.byRoom','Geschiedenis per kamer','History by room','Odaya göre geçmiş','Historia według pokoju','Istoric pe cameră'],
    ['cleaning.history.source','uit completionLogs','from completion logs','tamamlama kayıtlarından','z dziennika ukończeń','din jurnalele de finalizare'],
    ['cleaning.history.empty','Zodra schoonmaakbeurten zijn afgerond of overgeslagen zie je hier de geschiedenis per kamer en routine.','Once cleaning turns are completed or skipped, you will see history here by room and routine.','Temizlik turları tamamlandığında veya atlandığında oda ve rutin geçmişini burada görürsün.','Po ukończeniu lub pominięciu tur sprzątania zobaczysz tutaj historię według pokoju i rutyny.','După finalizarea sau omiterea turelor de curățenie, vei vedea aici istoricul pe cameră și rutină.'],
    ['cleaning.history.roomsCount','{{count}} kamers','{{count}} rooms','{{count}} oda','{{count}} pokoje','{{count}} camere'],
    ['cleaning.history.noDetails','Geen routine-details beschikbaar in deze oudere log.','No routine details are available in this older log.','Bu eski kayıtta rutin ayrıntısı yok.','Brak szczegółów rutyny w tym starszym wpisie.','Nu sunt disponibile detalii despre rutină în acest jurnal mai vechi.'],
    ['cleaning.history.last','Laatst {{date}}','Last {{date}}','Son: {{date}}','Ostatnio {{date}}','Ultima dată {{date}}'],
    ['cleaning.history.activity30','{{count}}× in 30 dagen','{{count}}× in 30 days','30 günde {{count}}×','{{count}}× w 30 dni','{{count}}× în 30 de zile'],

    ['cleaning.overview.overdue','Achterstallig','Overdue','Gecikmiş','Zaległe','Întârziat'],
    ['cleaning.overview.houseStatus','Huisstatus','Home status','Ev durumu','Status domu','Starea casei'],
    ['cleaning.overview.weekProgress','{{count}} procent weekvoortgang','{{count}} percent weekly progress','Haftalık ilerleme yüzde {{count}}','{{count}} procent postępu tygodniowego','{{count}} la sută progres săptămânal'],
    ['cleaning.overview.plannedCount','{{count}} gepland','{{count}} planned','{{count}} planlandı','Zaplanowane: {{count}}','Planificate: {{count}}'],
    ['cleaning.overview.flexibleCount','{{count}} flexibel','{{count}} flexible','{{count}} esnek','Elastyczne: {{count}}','Flexibile: {{count}}'],
    ['cleaning.overview.attentionCount','{{count}} aandacht','{{count}} attention','{{count}} dikkat','Uwaga: {{count}}','Atenție: {{count}}'],
    ['cleaning.overview.todayOverdue','vandaag / verlopen','today / overdue','bugün / gecikmiş','dzisiaj / zaległe','astăzi / întârziate'],
    ['cleaning.overview.openTurns','open beurten','open turns','açık turlar','otwarte tury','ture deschise'],
    ['cleaning.overview.completedWeek','afgerond deze week','completed this week','bu hafta tamamlandı','ukończone w tym tygodniu','finalizate săptămâna aceasta'],
    ['cleaning.overview.attentionNeeded','Aandacht nodig','Attention needed','Dikkat gerekiyor','Wymaga uwagi','Necesită atenție'],
    ['cleaning.overview.roomAttention','{{room}} vraagt aandacht','{{room}} needs attention','{{room}} dikkat gerektiriyor','{{room}} wymaga uwagi','{{room}} necesită atenție'],
    ['cleaning.overview.viewPlanning','Bekijk in planning','View in planning','Planlamada görüntüle','Zobacz w planie','Vezi în planificare'],
    ['cleaning.overview.oneAttention','1 schoonmaakbeurt vraagt aandacht','1 cleaning turn needs attention','1 temizlik turu dikkat gerektiriyor','1 tura sprzątania wymaga uwagi','1 tură de curățenie necesită atenție'],
    ['cleaning.overview.manyAttention','{{count}} schoonmaakbeurten vragen aandacht','{{count}} cleaning turns need attention','{{count}} temizlik turu dikkat gerektiriyor','{{count}} tur sprzątania wymaga uwagi','{{count}} ture de curățenie necesită atenție'],
    ['cleaning.overview.onSchedule','Jullie huis loopt mooi op schema','Your home is nicely on schedule','Eviniz güzelce plana uygun gidiyor','Wasz dom działa zgodnie z planem','Casa voastră este bine în grafic'],
    ['cleaning.overview.pausedOne','1 routine staat tijdelijk gepauzeerd. ','1 routine is temporarily paused. ','1 rutin geçici olarak duraklatıldı. ','1 rutyna jest tymczasowo wstrzymana. ','1 rutină este pusă temporar pe pauză. '],
    ['cleaning.overview.pausedMany','{{count}} routines staan tijdelijk gepauzeerd. ','{{count}} routines are temporarily paused. ','{{count}} rutin geçici olarak duraklatıldı. ','{{count}} rutyn jest tymczasowo wstrzymanych. ','{{count}} rutine sunt puse temporar pe pauză. '],
    ['cleaning.overview.activeTurns','Er staan {{count}} actieve schoonmaakbeurten klaar.','There are {{count}} active cleaning turns ready.','{{count}} aktif temizlik turu hazır.','Gotowych jest {{count}} aktywnych tur sprzątania.','Sunt gata {{count}} ture de curățenie active.'],
    ['cleaning.overview.noOpenWork','Er staat nu geen open schoonmaakwerk.','There is no open cleaning work right now.','Şu anda açık temizlik işi yok.','Nie ma teraz otwartych prac porządkowych.','Nu există acum lucrări de curățenie deschise.'],
    ['cleaning.overview.quickActions','Snelle acties','Quick actions','Hızlı işlemler','Szybkie akcje','Acțiuni rapide'],
    ['cleaning.overview.continue','direct verder','continue now','hemen devam et','kontynuuj od razu','continuă acum'],
    ['cleaning.overview.recentActivity','Recente activiteit','Recent activity','Son etkinlik','Ostatnia aktywność','Activitate recentă'],
    ['cleaning.overview.lastFive','laatste 5 gebeurtenissen','last 5 events','son 5 olay','ostatnie 5 zdarzeń','ultimele 5 evenimente'],
    ['cleaning.overview.noHistory','Nog geen schoonmaakgeschiedenis. Afgeronde, gedeeltelijke en overgeslagen beurten verschijnen hier automatisch.','No cleaning history yet. Completed, partial and skipped turns will appear here automatically.','Henüz temizlik geçmişi yok. Tamamlanan, kısmi ve atlanan turlar burada otomatik görünür.','Brak historii sprzątania. Ukończone, częściowe i pominięte tury pojawią się tu automatycznie.','Încă nu există istoric de curățenie. Turele finalizate, parțiale și omise vor apărea automat aici.'],
    ['cleaning.overview.historyCarried','Deels gedaan · doorgeschoven','Partially done · carried forward','Kısmen yapıldı · ertelendi','Częściowo wykonane · przeniesione','Realizat parțial · reportat'],
    ['cleaning.overview.historySkipped','Schoonmaakbeurt overgeslagen','Cleaning turn skipped','Temizlik turu atlandı','Tura sprzątania pominięta','Tură de curățenie omisă'],
    ['cleaning.overview.historyPartial','Schoonmaakbeurt deels gedaan','Cleaning turn partially done','Temizlik turu kısmen yapıldı','Tura sprzątania częściowo wykonana','Tură de curățenie realizată parțial'],
    ['cleaning.overview.historyReopened','Schoonmaakbeurt heropend','Cleaning turn reopened','Temizlik turu yeniden açıldı','Tura sprzątania ponownie otwarta','Tură de curățenie redeschisă'],
    ['cleaning.overview.historyDone','Schoonmaakbeurt afgerond','Cleaning turn completed','Temizlik turu tamamlandı','Tura sprzątania ukończona','Tură de curățenie finalizată'],
    ['cleaning.overview.steps','{{done}} van {{total}} stappen','{{done}} of {{total}} steps','{{total}} adımın {{done}} tanesi','{{done}} z {{total}} kroków','{{done}} din {{total}} pași'],
    ['cleaning.overview.cleaningTurn','Schoonmaakbeurt','Cleaning turn','Temizlik turu','Tura sprzątania','Tură de curățenie'],
    ['cleaning.overview.noActivePlanned','Geen actieve schoonmaakbeurten gepland.','No active cleaning turns planned.','Planlanmış aktif temizlik turu yok.','Brak zaplanowanych aktywnych tur sprzątania.','Nu sunt planificate ture active de curățenie.'],
    ['cleaning.overview.planned','{{count}} gepland','{{count}} planned','{{count}} planlandı','Zaplanowane: {{count}}','Planificate: {{count}}'],
    ['cleaning.overview.pausedRoutine','1 routine gepauzeerd','1 routine paused','1 rutin duraklatıldı','1 rutyna wstrzymana','1 rutină în pauză'],
    ['cleaning.overview.pausedRoutines','{{count}} routines gepauzeerd','{{count}} routines paused','{{count}} rutin duraklatıldı','{{count}} rutyn wstrzymanych','{{count}} rutine în pauză']

,
    ['cleaning.addSupplyDone','Benodigd item toegevoegd ✓','Required item added ✓','Gerekli malzeme eklendi ✓','Dodano potrzebny element ✓','Articolul necesar a fost adăugat ✓'],
    ['cleaning.confirmRoomDelete','Deze kamer verwijderen? Historie blijft bewaard.','Delete this room? History will be kept.','Bu oda silinsin mi? Geçmiş korunacak.','Usunąć ten pokój? Historia zostanie zachowana.','Ștergi această cameră? Istoricul va fi păstrat.'],
    ['cleaning.confirmRoutineDelete','Deze routine verwijderen?','Delete this routine?','Bu rutin silinsin mi?','Usunąć tę rutynę?','Ștergi această rutină?'],
    ['cleaning.noPlanRoutines','Er zijn geen routines die deze week gepland hoeven te worden.','There are no routines to schedule this week.','Bu hafta planlanması gereken rutin yok.','Brak rutyn do zaplanowania w tym tygodniu.','Nu există rutine de planificat în această săptămână.'],
    ['cleaning.planReady','Weekplan staat klaar ✓','Week plan is ready ✓','Haftalık plan hazır ✓','Plan tygodnia jest gotowy ✓','Planul săptămânal este gata ✓'],
    ['cleaning.planExists','Er staat al een actief weekplan.','There is already an active week plan.','Zaten aktif bir haftalık plan var.','Istnieje już aktywny plan tygodnia.','Există deja un plan săptămânal activ.'],
    ['cleaning.planFailed','Weekplan kon niet worden gemaakt.','Week plan could not be created.','Haftalık plan oluşturulamadı.','Nie udało się utworzyć planu tygodnia.','Planul săptămânal nu a putut fi creat.'],
    ['cleaning.refreshUnavailable','Workplan sync is not loaded yet.','Workplan sync is not loaded yet.','Çalışma planı senkronizasyonu henüz yüklenmedi.','Synchronizacja planu pracy nie jest jeszcze załadowana.','Sincronizarea planului de lucru nu este încă încărcată.'],
    ['cleaning.workplanUnavailable','Werkplan is nog niet beschikbaar.','Work plan is not available yet.','Çalışma planı henüz kullanılamıyor.','Plan pracy nie jest jeszcze dostępny.','Planul de lucru nu este încă disponibil.'],
    ['cleaning.noRoutinesToPlan','Er zijn nu geen routines om in te plannen.','There are no routines to schedule right now.','Şu anda planlanacak rutin yok.','Nie ma teraz rutyn do zaplanowania.','Nu există rutine de planificat acum.'],
    ['cleaning.workplanRebuilt','Werkplan opnieuw opgebouwd uit je huidige kamers en routines ✓','Work plan rebuilt from your current rooms and routines ✓','Çalışma planı mevcut oda ve rutinlerinden yeniden oluşturuldu ✓','Plan pracy przebudowano na podstawie obecnych pokoi i rutyn ✓','Planul de lucru a fost reconstruit din camerele și rutinele actuale ✓'],
    ['cleaning.workplanReady','Werkplan staat klaar ✓','Work plan is ready ✓','Çalışma planı hazır ✓','Plan pracy jest gotowy ✓','Planul de lucru este gata ✓'],
    ['cleaning.workplanUpdateFailed','Werkplan kon niet worden bijgewerkt.','Work plan could not be updated.','Çalışma planı güncellenemedi.','Nie udało się zaktualizować planu pracy.','Planul de lucru nu a putut fi actualizat.'],
    ['cleaning.workplanAriaRebuild','Werkplan opnieuw opbouwen uit de huidige kamers en routines','Rebuild work plan from current rooms and routines','Çalışma planını mevcut oda ve rutinlerden yeniden oluştur','Przebuduj plan pracy z obecnych pokoi i rutyn','Reconstruiește planul de lucru din camerele și rutinele actuale'],
    ['cleaning.workplanAriaNew','Nieuw werkplan maken','Create new work plan','Yeni çalışma planı oluştur','Utwórz nowy plan pracy','Creează un plan de lucru nou'],
    ['cleaning.routineResumeDone','Routine hervat ✓','Routine resumed ✓','Rutin devam ettirildi ✓','Rutyna wznowiona ✓','Rutina a fost reluată ✓'],
    ['cleaning.routinePauseDone','Routine gepauzeerd ✓','Routine paused ✓','Rutin duraklatıldı ✓','Rutyna wstrzymana ✓','Rutina a fost pusă pe pauză ✓'],
    ['cleaning.routineRemovedPlanUpdated','Routine verwijderd en werkplan bijgewerkt','Routine removed and work plan updated','Rutin silindi ve çalışma planı güncellendi','Rutyna usunięta, a plan pracy zaktualizowany','Rutina a fost ștearsă și planul de lucru actualizat'],
    ['cleaning.confirmRoutineDeleteRefresh','Deze routine verwijderen? Het huidige werkplan wordt meteen bijgewerkt.','Delete this routine? The current work plan will be updated immediately.','Bu rutin silinsin mi? Mevcut çalışma planı hemen güncellenecek.','Usunąć tę rutynę? Bieżący plan pracy zostanie od razu zaktualizowany.','Ștergi această rutină? Planul de lucru actual va fi actualizat imediat.']
,
    ['cleaning.roomType.living-room','Woonkamer','Living room','Oturma odası','Salon','Living'],
    ['cleaning.roomType.kitchen','Keuken','Kitchen','Mutfak','Kuchnia','Bucătărie'],
    ['cleaning.roomType.bathroom','Badkamer','Bathroom','Banyo','Łazienka','Baie'],
    ['cleaning.roomType.toilet','Toilet','Toilet','Tuvalet','Toaleta','Toaletă'],
    ['cleaning.roomType.bedroom','Slaapkamer','Bedroom','Yatak odası','Sypialnia','Dormitor'],
    ['cleaning.roomType.kids-room','Kinderkamer','Kids room','Çocuk odası','Pokój dziecięcy','Camera copiilor'],
    ['cleaning.roomType.hall','Hal','Hall','Hol','Przedpokój','Hol'],
    ['cleaning.roomType.laundry','Wasruimte','Laundry','Çamaşır odası','Pralnia','Spălătorie'],
    ['cleaning.roomType.outdoor','Balkon / tuin','Balcony / garden','Balkon / bahçe','Balkon / ogród','Balcon / grădină'],
    ['cleaning.roomType.custom','Eigen ruimte','Custom room','Özel alan','Własne pomieszczenie','Spațiu personalizat'],
    ['cleaning.familyMember','Gezinslid','Family member','Aile üyesi','Członek rodziny','Membru al familiei'],
    ['cleaning.flexible','Flexibel','Flexible','Esnek','Elastycznie','Flexibil'],
    ['cleaning.preset.living-vacuum','Stofzuigen','Vacuum','Süpür','Odkurzanie','Aspirat'],
    ['cleaning.preset.living-dust','Afstoffen','Dust surfaces','Toz al','Ścieranie kurzu','Șters praful'],
    ['cleaning.preset.living-mop','Dweilen','Mop floor','Paspas yap','Mycie podłogi','Spălat pe jos'],
    ['cleaning.preset.living-deep','Meubels en oppervlakken grondig reinigen','Deep-clean furniture and surfaces','Mobilya ve yüzeyleri derinlemesine temizle','Dokładnie wyczyść meble i powierzchnie','Curăță în profunzime mobilierul și suprafețele'],
    ['cleaning.preset.kitchen-worktop','Werkblad en kookplaat reinigen','Clean worktop and hob','Tezgâh ve ocağı temizle','Wyczyść blat i płytę grzewczą','Curăță blatul și plita'],
    ['cleaning.preset.kitchen-sink','Spoelbak en kraan schoonmaken','Clean sink and tap','Evye ve musluğu temizle','Wyczyść zlew i kran','Curăță chiuveta și bateria'],
    ['cleaning.preset.kitchen-floor','Keukenvloer reinigen','Clean kitchen floor','Mutfak zeminini temizle','Wyczyść podłogę w kuchni','Curăță podeaua bucătăriei'],
    ['cleaning.preset.kitchen-fridge','Koelkast schoonmaken','Clean fridge','Buzdolabını temizle','Wyczyść lodówkę','Curăță frigiderul'],
    ['cleaning.preset.kitchen-oven','Oven grondig reinigen','Deep-clean oven','Fırını derinlemesine temizle','Dokładnie wyczyść piekarnik','Curăță cuptorul în profunzime'],
    ['cleaning.preset.bathroom-shower','Douche en bad schoonmaken','Clean shower and bath','Duş ve küveti temizle','Wyczyść prysznic i wannę','Curăță dușul și cada'],
    ['cleaning.preset.bathroom-sink','Wastafel en spiegel reinigen','Clean sink and mirror','Lavabo ve aynayı temizle','Wyczyść umywalkę i lustro','Curăță chiuveta și oglinda'],
    ['cleaning.preset.bathroom-toilet','Toilet reinigen','Clean toilet','Tuvaleti temizle','Wyczyść toaletę','Curăță toaleta'],
    ['cleaning.preset.bathroom-floor','Badkamervloer reinigen','Clean bathroom floor','Banyo zeminini temizle','Wyczyść podłogę w łazience','Curăță podeaua băii'],
    ['cleaning.preset.bathroom-descale','Kranen en douche ontkalken','Descale taps and shower','Musluk ve duşun kirecini temizle','Odkamień krany i prysznic','Detartrează robinetele și dușul'],
    ['cleaning.preset.toilet-bowl','Toilet grondig reinigen','Deep-clean toilet','Tuvaleti derinlemesine temizle','Dokładnie wyczyść toaletę','Curăță toaleta în profunzime'],
    ['cleaning.preset.toilet-sink','Wastafel en kraan reinigen','Clean sink and tap','Lavabo ve musluğu temizle','Wyczyść umywalkę i kran','Curăță chiuveta și bateria'],
    ['cleaning.preset.toilet-floor','Vloer reinigen','Clean floor','Zemini temizle','Wyczyść podłogę','Curăță podeaua'],
    ['cleaning.preset.bedroom-vacuum','Stofzuigen','Vacuum','Süpür','Odkurzanie','Aspirat'],
    ['cleaning.preset.bedroom-dust','Afstoffen','Dust surfaces','Toz al','Ścieranie kurzu','Șters praful'],
    ['cleaning.preset.bedroom-bedding','Beddengoed verschonen','Change bedding','Nevresimi değiştir','Zmień pościel','Schimbă lenjeria de pat'],
    ['cleaning.preset.bedroom-deep','Kamer grondig reinigen','Deep-clean room','Odayı derinlemesine temizle','Dokładnie wyczyść pokój','Curăță camera în profunzime'],
    ['cleaning.preset.kids-tidy','Speelgoed en oppervlakken opruimen','Tidy toys and surfaces','Oyuncakları ve yüzeyleri topla','Posprzątaj zabawki i powierzchnie','Strânge jucăriile și suprafețele'],
    ['cleaning.preset.kids-vacuum','Stofzuigen','Vacuum','Süpür','Odkurzanie','Aspirat'],
    ['cleaning.preset.kids-dust','Afstoffen','Dust surfaces','Toz al','Ścieranie kurzu','Șters praful'],
    ['cleaning.preset.kids-deep','Speelgoed en meubels grondig reinigen','Deep-clean toys and furniture','Oyuncak ve mobilyaları derinlemesine temizle','Dokładnie wyczyść zabawki i meble','Curăță în profunzime jucăriile și mobilierul'],
    ['cleaning.preset.hall-vacuum','Hal stofzuigen','Vacuum hall','Holü süpür','Odkurz przedpokój','Aspiră holul'],
    ['cleaning.preset.hall-mop','Hal dweilen','Mop hall','Holü paspasla','Umyj podłogę w przedpokoju','Spală pe jos în hol'],
    ['cleaning.preset.hall-handles','Deuren en grepen reinigen','Clean doors and handles','Kapı ve kolları temizle','Wyczyść drzwi i klamki','Curăță ușile și mânerele'],
    ['cleaning.preset.laundry-floor','Wasruimte vloer reinigen','Clean laundry floor','Çamaşır odası zeminini temizle','Wyczyść podłogę w pralni','Curăță podeaua spălătoriei'],
    ['cleaning.preset.laundry-machines','Wasmachine en droger buitenkant reinigen','Clean washer and dryer exterior','Çamaşır ve kurutma makinesinin dışını temizle','Wyczyść zewnętrzne części pralki i suszarki','Curăță exteriorul mașinii de spălat și al uscătorului'],
    ['cleaning.preset.laundry-deep','Wasruimte grondig reinigen','Deep-clean laundry room','Çamaşır odasını derinlemesine temizle','Dokładnie wyczyść pralnię','Curăță spălătoria în profunzime'],
    ['cleaning.preset.outdoor-sweep','Balkon of terras vegen','Sweep balcony or terrace','Balkon veya terası süpür','Zamiataj balkon lub taras','Mătură balconul sau terasa'],
    ['cleaning.preset.outdoor-rail','Reling en oppervlakken reinigen','Clean railing and surfaces','Korkuluk ve yüzeyleri temizle','Wyczyść balustradę i powierzchnie','Curăță balustrada și suprafețele'],
    ['cleaning.preset.outdoor-deep','Buitenruimte grondig reinigen','Deep-clean outdoor area','Dış alanı derinlemesine temizle','Dokładnie wyczyść przestrzeń zewnętrzną','Curăță spațiul exterior în profunzime'],
    ['cleaning.preset.custom-vacuum','Stofzuigen','Vacuum','Süpür','Odkurzanie','Aspirat'],
    ['cleaning.preset.custom-dust','Afstoffen','Dust surfaces','Toz al','Ścieranie kurzu','Șters praful'],
    ['cleaning.preset.custom-mop','Dweilen','Mop floor','Paspas yap','Mycie podłogi','Spălat pe jos']

,
    ['common.close','Sluiten','Close','Kapat','Zamknij','Închide'],
    ['common.cancel','Annuleren','Cancel','İptal','Anuluj','Anulează'],
    ['common.save','Opslaan','Save','Kaydet','Zapisz','Salvează'],
    ['common.edit','Bewerken','Edit','Düzenle','Edytuj','Editează'],
    ['common.delete','Verwijderen','Delete','Sil','Usuń','Șterge'],
    ['common.items','items','items','öğe','pozycje','articole'],
    ['common.today','Vandaag','Today','Bugün','Dzisiaj','Astăzi'],
    ['common.tomorrow','Morgen','Tomorrow','Yarın','Jutro','Mâine'],
    ['common.later','Later','Later','Daha sonra','Później','Mai târziu'],
    ['common.family','Gezin','Family','Aile','Rodzina','Familie'],
    ['common.loading','Laden...','Loading...','Yükleniyor...','Ładowanie...','Se încarcă...'],
    ['common.empty','Leeg','Empty','Boş','Puste','Gol'],
    ['common.justNow','Zojuist','Just now','Az önce','Przed chwilą','Chiar acum'],
    ['common.unnamed','Naamloos','Untitled','Adsız','Bez nazwy','Fără titlu'],
    ['common.saved','Opgeslagen ✓','Saved ✓','Kaydedildi ✓','Zapisano ✓','Salvat ✓'],
    ['common.drag','slepen','drag','sürükle','przeciągnij','trage'],
    ['common.typeHere','Typ hier...','Type here...','Buraya yaz...','Wpisz tutaj...','Scrie aici...']
,
    ['tasks.singular','Taak','Task','Görev','Zadanie','Sarcină'],
    ['notes.none','Geen notities','No notes','Not yok','Brak notatek','Nicio notiță'],
    ['notes.note','Notitie','Note','Not','Notatka','Notiță'],
    ['notes.imageFirst','Selecteer eerst een afbeelding','Select an image first','Önce bir görsel seç','Najpierw wybierz obraz','Selectează mai întâi o imagine'],
    ['notes.imageBlock','Selecteer een afbeelding blok','Select an image block','Bir görsel bloğu seç','Wybierz blok obrazu','Selectează un bloc de imagine'],
    ['notes.activityCreated','{{name}} maakte notitie “{{title}}” aan','{{name}} created note “{{title}}”','{{name}}, “{{title}}” notunu oluşturdu','{{name}} utworzył(a) notatkę „{{title}}”','{{name}} a creat notița „{{title}}”']

,
    ['common.pause','Pauzeren','Pause','Duraklat','Wstrzymaj','Pauză'],
    ['common.resume','Hervatten','Resume','Devam et','Wznów','Reia']

,

    ['tasks.brand','Samen rust en overzicht','Together: calm and clarity','Birlikte huzur ve düzen','Razem: spokój i porządek','Împreună: liniște și claritate'],
    ['tasks.new','Nieuwe taak','New task','Yeni görev','Nowe zadanie','Sarcină nouă'],
    ['tasks.summaryAria','Taaksamenvatting','Task summary','Görev özeti','Podsumowanie zadań','Rezumat sarcini'],
    ['tasks.filterAria','Taken filter','Task filter','Görev filtresi','Filtr zadań','Filtru sarcini'],
    ['tasks.noCategory','Geen taken in deze categorie.','No tasks in this category.','Bu kategoride görev yok.','Brak zadań w tej kategorii.','Nu există sarcini în această categorie.'],
    ['tasks.rewardAria','Taakbeloning','Task reward','Görev ödülü','Nagroda za zadanie','Recompensă sarcină'],
    ['tasks.assignedTo','Toegewezen aan','Assigned to','Atanan kişi','Przypisane do','Atribuit către'],
    ['tasks.subtasks','Subtaken','Subtasks','Alt görevler','Podzadania','Subsarcini'],
    ['tasks.supplies','Benodigdheden','Supplies','Malzemeler','Potrzebne','Materiale'],
    ['tasks.editClose','Bewerken sluiten','Close editing','Düzenlemeyi kapat','Zamknij edycję','Închide editarea'],
    ['tasks.postpone','Uitstellen','Postpone','Ertele','Przełóż','Amână'],
    ['tasks.markDone','Markeer als klaar','Mark as done','Tamamlandı olarak işaretle','Oznacz jako gotowe','Marchează ca gata'],
    ['tasks.once','Eenmalig','Once','Tek sefer','Jednorazowo','O singură dată'],
    ['tasks.daily','Dagelijks','Daily','Günlük','Codziennie','Zilnic'],
    ['tasks.weekly','Wekelijks','Weekly','Haftalık','Co tydzień','Săptămânal'],
    ['tasks.monthly','Maandelijks','Monthly','Aylık','Co miesiąc','Lunar'],
    ['tasks.priorityHigh','Hoge prioriteit','High priority','Yüksek öncelik','Wysoki priorytet','Prioritate ridicată'],
    ['tasks.priorityNormal','Normale prioriteit','Normal priority','Normal öncelik','Normalny priorytet','Prioritate normală'],
    ['tasks.priorityLow','Lage prioriteit','Low priority','Düşük öncelik','Niski priorytet','Prioritate scăzută'],
    ['tasks.syncing','Taken synchroniseren…','Syncing tasks…','Görevler senkronize ediliyor…','Synchronizowanie zadań…','Se sincronizează sarcinile…'],
    ['tasks.noCleaning','Geen schoonmaaktaken gepland.','No cleaning tasks planned.','Planlanmış temizlik görevi yok.','Brak zaplanowanych zadań sprzątania.','Nu sunt planificate sarcini de curățenie.'],
    ['tasks.categoryCalm','Deze categorie is helemaal rustig.','This category is completely clear.','Bu kategoride her şey sakin.','W tej kategorii jest spokojnie.','Această categorie este complet liberă.'],
    ['tasks.noneHere','Geen taken hier','No tasks here','Burada görev yok','Brak zadań tutaj','Nicio sarcină aici'],
    ['tasks.complete','Voltooi taak','Complete task','Görevi tamamla','Ukończ zadanie','Finalizează sarcina'],
    ['tasks.reopen','Heropen taak','Reopen task','Görevi yeniden aç','Otwórz ponownie zadanie','Redeschide sarcina'],
    ['tasks.completeStepsFirst','Voltooi eerst alle stappen','Complete all steps first','Önce tüm adımları tamamla','Najpierw ukończ wszystkie kroki','Finalizează mai întâi toți pașii'],
    ['tasks.syncingShort','Taken worden nog gesynchroniseerd','Tasks are still syncing','Görevler hâlâ senkronize ediliyor','Zadania są nadal synchronizowane','Sarcinile încă se sincronizează'],
    ['tasks.saveFailed','Kon niet opslaan','Could not save','Kaydedilemedi','Nie udało się zapisać','Nu s-a putut salva'],
    ['tasks.deleteFailedFull','Taak kon niet worden verwijderd','Task could not be deleted','Görev silinemedi','Nie udało się usunąć zadania','Sarcina nu a putut fi ștearsă'],
    ['tasks.helpTogether','Samen aan deze taak','Working on this task together','Bu görevde birlikte','Razem nad tym zadaniem','Împreună la această sarcină'],
    ['tasks.helping','Je helpt mee met deze taak.','You are helping with this task.','Bu göreve yardım ediyorsun.','Pomagasz przy tym zadaniu.','Ajuți la această sarcină.'],
    ['tasks.helpOpen','De hulpvraag staat open voor het gezin.','The help request is open to the family.','Yardım isteği aileye açık.','Prośba o pomoc jest otwarta dla rodziny.','Cererea de ajutor este deschisă familiei.'],
    ['tasks.inviteOpen','De uitnodiging staat nog open.','The invitation is still open.','Davet hâlâ açık.','Zaproszenie jest nadal otwarte.','Invitația este încă deschisă.'],
    ['tasks.assignedSentence','Deze taak is toegewezen aan','This task is assigned to','Bu görev şuna atandı','To zadanie jest przypisane do','Această sarcină este atribuită lui'],
    ['tasks.unassignedSentence','Deze taak is nog niet toegewezen.','This task has not been assigned yet.','Bu görev henüz atanmadı.','To zadanie nie jest jeszcze przypisane.','Această sarcină nu este încă atribuită.'],
    ['tasks.noMembers','Geen extra gezinsleden beschikbaar.','No additional family members available.','Ek aile üyesi yok.','Brak dodatkowych członków rodziny.','Nu sunt disponibili alți membri ai familiei.'],
    ['tasks.noSubtasks','Nog geen subtaken.','No subtasks yet.','Henüz alt görev yok.','Brak podzadań.','Încă nu există subsarcini.'],
    ['tasks.addSubtask','+ Subtaak toevoegen','+ Add subtask','+ Alt görev ekle','+ Dodaj podzadanie','+ Adaugă subsarcină'],
    ['tasks.editSubtask','Subtaak bewerken','Edit subtask','Alt görevi düzenle','Edytuj podzadanie','Editează subsarcina'],
    ['tasks.noSupplies','Geen benodigdheden gekoppeld.','No supplies linked.','Malzeme bağlı değil.','Brak przypisanych materiałów.','Nu sunt asociate materiale.'],
    ['tasks.manageCleaning','Beheer in Schoonmaken','Manage in Cleaning','Temizlik bölümünde yönet','Zarządzaj w Sprzątaniu','Gestionează în Curățenie'],
    ['tasks.unassigned','Niet toegewezen','Unassigned','Atanmamış','Nieprzypisane','Neatribuit'],
    ['tasks.completedWord','voltooid','completed','tamamlandı','ukończone','finalizate'],
    ['tasks.subtaskSaveFailed','Kon subtaak niet opslaan','Could not save subtask','Alt görev kaydedilemedi','Nie udało się zapisać podzadania','Nu s-a putut salva subsarcina'],
    ['tasks.syncingOne','Taak wordt nog gesynchroniseerd','Task is still syncing','Görev hâlâ senkronize ediliyor','Zadanie jest nadal synchronizowane','Sarcina încă se sincronizează'],
    ['tasks.noIcon','Geen','None','Yok','Brak','Niciunul'],
    ['tasks.editTask','Taak bewerken','Edit task','Görevi düzenle','Edytuj zadanie','Editează sarcina'],
    ['tasks.description','Beschrijving','Description','Açıklama','Opis','Descriere'],
    ['tasks.descriptionPlaceholder','Wat moet er gebeuren?','What needs to be done?','Ne yapılması gerekiyor?','Co trzeba zrobić?','Ce trebuie făcut?'],
    ['tasks.time','Tijd','Time','Süre','Czas','Timp'],
    ['tasks.recurrence','Herhaling','Repeat','Tekrar','Powtarzanie','Repetare'],
    ['tasks.priority','Prioriteit','Priority','Öncelik','Priorytet','Prioritate'],
    ['tasks.suppliesComma','Benodigdheden · gescheiden met komma’s','Supplies · separated by commas','Malzemeler · virgülle ayır','Materiały · rozdziel przecinkami','Materiale · separate prin virgule'],
    ['tasks.createAction','Taak aanmaken','Create task','Görev oluştur','Utwórz zadanie','Creează sarcina'],
    ['tasks.saveChanges','Wijzigingen opslaan','Save changes','Değişiklikleri kaydet','Zapisz zmiany','Salvează modificările'],
    ['tasks.deleteTask','Taak verwijderen','Delete task','Görevi sil','Usuń zadanie','Șterge sarcina'],
    ['tasks.confirmDelete','Deze taak verwijderen?','Delete this task?','Bu görev silinsin mi?','Usunąć to zadanie?','Ștergi această sarcină?'],
    ['tasks.saveTaskFailed','Taak kon niet worden opgeslagen','Task could not be saved','Görev kaydedilemedi','Nie udało się zapisać zadania','Sarcina nu a putut fi salvată'],
    ['tasks.created','Taak aangemaakt','Task created','Görev oluşturuldu','Zadanie utworzone','Sarcină creată'],
    ['tasks.doneShort','Klaar ✓','Done ✓','Bitti ✓','Gotowe ✓','Gata ✓'],
    ['tasks.reopenShort','Heropenen','Reopen','Yeniden aç','Otwórz ponownie','Redeschide'],
    ['tasks.stopHelping','Stop helpen','Stop helping','Yardımı bırak','Przestań pomagać','Oprește ajutorul'],
    ['tasks.helpRequested','Hulp gevraagd','Help requested','Yardım istendi','Poproszono o pomoc','Ajutor solicitat'],
    ['tasks.helpNeeded','Hulp nodig?','Need help?','Yardım lazım mı?','Potrzebujesz pomocy?','Ai nevoie de ajutor?'],
    ['tasks.askHelp','Hulp vragen','Ask for help','Yardım iste','Poproś o pomoc','Cere ajutor'],
    ['tasks.actionFailed','Actie mislukt','Action failed','İşlem başarısız','Akcja nie powiodła się','Acțiunea a eșuat'],
    ['tasks.askHelpFailed','Hulp vragen mislukt','Help request failed','Yardım isteği başarısız','Prośba o pomoc nie powiodła się','Cererea de ajutor a eșuat'],
    ['tasks.icon','Icoon','Icon','Simge','Ikona','Pictogramă'],
    ['tasks.taskName','Taaknaam','Task name','Görev adı','Nazwa zadania','Numele sarcinii'],
    ['tasks.taskNamePlaceholder','Bijv. badkamer schoonmaken','e.g. clean the bathroom','örn. banyoyu temizle','np. posprzątać łazienkę','ex. curăță baia'],
    ['tasks.date','Datum','Date','Tarih','Data','Dată'],
    ['tasks.notes','Opmerkingen','Comments','Yorumlar','Komentarze','Comentarii'],
    ['tasks.notePlaceholder','Laat een opmerking achter…','Leave a comment…','Bir yorum bırak…','Zostaw komentarz…','Lasă un comentariu…'],
    ['tasks.postComment','Plaats','Post','Gönder','Opublikuj','Publică'],
    ['tasks.subtask','Subtaak','Subtask','Alt görev','Podzadanie','Subsarcină'],
    ['tasks.suppliesPlaceholder','Allesreiniger, spons, doek','All-purpose cleaner, sponge, cloth','Genel temizleyici, sünger, bez','Środek uniwersalny, gąbka, ściereczka','Soluție universală, burete, lavetă'],
    ['tasks.manageSuppliesCleaning','Beheer benodigdheden in Schoonmaken','Manage supplies in Cleaning','Malzemeleri Temizlik bölümünde yönet','Zarządzaj materiałami w Sprzątaniu','Gestionează materialele în Curățenie'],
    ['tasks.nameRequired','Geef de taak een naam','Give the task a name','Göreve bir ad ver','Nadaj zadaniu nazwę','Dă un nume sarcinii'],
    ['tasks.savedChanges','Wijzigingen opgeslagen','Changes saved','Değişiklikler kaydedildi','Zmiany zapisane','Modificări salvate'],
    ['tasks.postponedDay','Taak één dag uitgesteld','Task postponed by one day','Görev bir gün ertelendi','Zadanie przełożone o jeden dzień','Sarcina a fost amânată cu o zi'],
    ['tasks.low','Laag','Low','Düşük','Niski','Scăzută'],
    ['tasks.normal','Normaal','Normal','Normal','Normalny','Normală'],
    ['tasks.high','Hoog','High','Yüksek','Wysoki','Ridicată'],
    ['tasks.subProgress','{{done}} van {{total}} voltooid','{{done}} of {{total}} completed','{{total}} içinden {{done}} tamamlandı','Ukończono {{done}} z {{total}}','{{done}} din {{total}} finalizate'],
    ['tasks.cleanRoom','{{room}} schoonmaken','Clean {{room}}','{{room}} temizliği','Posprzątaj: {{room}}','Curăță: {{room}}']
,
    ['tasks.askSomeone','Vraag iemand uit je gezin om mee te helpen.','Ask someone in your family to help.','Ailenden birinden yardım iste.','Poproś kogoś z rodziny o pomoc.','Roagă pe cineva din familie să ajute.'],
    ['tasks.joinHelp','Je kunt aansluiten bij deze taak.','You can join this task.','Bu göreve katılabilirsin.','Możesz dołączyć do tego zadania.','Te poți alătura acestei sarcini.'],
    ['tasks.withdrawHelp','Intrekken','Withdraw','Geri çek','Wycofaj','Retrage'],
    ['tasks.helpAlong','Meehelpen','Help','Yardım et','Pomóż','Ajută'],
    ['tasks.together','Samen','Together','Birlikte','Razem','Împreună'],
    ['tasks.noComments','Nog geen opmerkingen.','No comments yet.','Henüz yorum yok.','Brak komentarzy.','Încă nu există comentarii.'],
    ['tasks.savedChanges','Wijzigingen opgeslagen','Changes saved','Değişiklikler kaydedildi','Zmiany zapisane','Modificări salvate'],
    ['tasks.manageSupplies','Beheer benodigdheden in Schoonmaken','Manage supplies in Cleaning','Malzemeleri Temizlik bölümünde yönet','Zarządzaj materiałami w Sprzątaniu','Gestionează materialele în Curățenie']


,

    ['feed.itemsCount','{{count}} items','{{count}} items','{{count}} öğe','{{count}} pozycji','{{count}} articole'],
    ['feed.openModule','Open module: {{module}}','Open module: {{module}}','Modülü aç: {{module}}','Otwórz moduł: {{module}}','Deschide modulul: {{module}}'],
    ['feed.save','Opslaan','Save','Kaydet','Zapisz','Salvează'],
    ['feed.open','Openen','Open','Aç','Otwórz','Deschide'],
    ['feed.view','Bekijk','View','Görüntüle','Zobacz','Vezi'],
    ['feed.photoOpen','Foto openen','Open photo','Fotoğrafı aç','Otwórz zdjęcie','Deschide fotografia'],
    ['feed.bookmark','Bewaren','Save','Kaydet','Zapisz','Salvează'],
    ['feed.noPosts','Nog geen berichten','No posts yet','Henüz gönderi yok','Brak postów','Încă nu există postări'],
    ['feed.noPostsHint','Deel iets met het gezin hierboven','Share something with the family above','Yukarıdan ailenle bir şey paylaş','Podziel się czymś z rodziną powyżej','Împărtășește ceva cu familia mai sus'],
    ['feed.taskDone','Taak afgerond','Task completed','Görev tamamlandı','Zadanie ukończone','Sarcină finalizată'],
    ['feed.appointment','Afspraak','Appointment','Randevu','Wydarzenie','Programare'],
    ['feed.points','+10 punten','+10 points','+10 puan','+10 punktów','+10 puncte'],
    ['feed.activity.member','Gezinslid','Family member','Aile üyesi','Członek rodziny','Membru al familiei'],
    ['feed.activity.taskCreated.1','Er staat iets nieuws klaar','Something new is ready','Yeni bir şey hazır','Coś nowego jest gotowe','Ceva nou este gata'],
    ['feed.activity.taskCreated.2','Nieuwe missie voor thuis','New mission for home','Ev için yeni görev','Nowa misja domowa','Misiune nouă pentru acasă'],
    ['feed.activity.taskCreated.3','Iets om straks af te vinken','Something to check off later','Sonra işaretlenecek bir şey','Coś do odhaczenia później','Ceva de bifat mai târziu'],
    ['feed.activity.taskCreated.4','Op de planning ✨','On the plan ✨','Plana eklendi ✨','W planie ✨','În plan ✨'],
    ['feed.activity.taskDone.1','Weer eentje van de lijst ✓','Another one off the list ✓','Listeden bir tane daha ✓','Kolejne skreślone z listy ✓','Încă una bifată de pe listă ✓'],
    ['feed.activity.taskDone.2','Dat is geregeld ✨','That is sorted ✨','Bu iş tamam ✨','Załatwione ✨','Rezolvat ✨'],
    ['feed.activity.taskDone.3','Lekker afgevinkt','Nicely checked off','Güzelce tamamlandı','Ładnie odhaczone','Bifat cu succes'],
    ['feed.activity.taskDone.4','Een taak minder aan je hoofd','One less task on your mind','Aklında bir görev daha az','Jedno zadanie mniej na głowie','O sarcină mai puțin pe cap'],
    ['feed.activity.taskDone.5','Klaar is klaar 🙌','Done is done 🙌','Bitti demek bitti 🙌','Gotowe to gotowe 🙌','Gata înseamnă gata 🙌'],
    ['feed.activity.shopping.1','De voorraad is weer aangevuld','Supplies are stocked again','Stoklar yeniden doldu','Zapasy znów uzupełnione','Proviziile sunt din nou completate'],
    ['feed.activity.shopping.2','De buit is binnen 🛒','The haul is in 🛒','Alışveriş tamam 🛒','Zakupy są już w domu 🛒','Cumpărăturile au ajuns 🛒'],
    ['feed.activity.shopping.3','Koelkastmodus: aangevuld','Fridge mode: restocked','Buzdolabı modu: dolu','Tryb lodówki: uzupełniony','Mod frigider: reaprovizionat'],
    ['feed.activity.shopping.4','We kunnen weer vooruit','We are stocked and ready','Yola devam edebiliriz','Możemy działać dalej','Putem merge mai departe'],
    ['feed.activity.shopping.5','Boodschappen binnen ✓','Groceries are in ✓','Alışveriş geldi ✓','Zakupy są ✓','Cumpărăturile sunt aici ✓'],
    ['feed.activity.meal.1','Iets lekkers om naar uit te kijken','Something tasty to look forward to','Dört gözle beklenecek lezzetli bir şey','Coś pysznego, na co warto czekać','Ceva delicios de așteptat'],
    ['feed.activity.meal.2','Het menu krijgt vorm 🍽️','The menu is taking shape 🍽️','Menü şekilleniyor 🍽️','Menu nabiera kształtu 🍽️','Meniul prinde contur 🍽️'],
    ['feed.activity.meal.3','Eten staat op de planning','Food is on the plan','Yemek plana girdi','Jedzenie jest w planie','Masa este în plan'],
    ['feed.activity.meal.4','Dat wordt lekker','That will be tasty','Bu lezzetli olacak','Będzie pysznie','Va fi delicios'],
    ['feed.activity.party.1','Samen gefixt 🏆','Done together 🏆','Birlikte halledildi 🏆','Zrobione razem 🏆','Rezolvat împreună 🏆'],
    ['feed.activity.party.2','Teamwork betaald zich uit','Teamwork pays off','Takım çalışması işe yarıyor','Praca zespołowa się opłaca','Munca în echipă dă rezultate'],
    ['feed.activity.party.3','Quest geklaard ✨','Quest completed ✨','Görev tamamlandı ✨','Quest ukończony ✨','Quest finalizat ✨'],
    ['feed.activity.party.4','Als team weer eentje binnen','Another one done as a team','Takım olarak bir tane daha','Kolejne zrobione zespołowo','Încă una reușită ca echipă'],
    ['feed.activity.newTask','NIEUWE TAAK','NEW TASK','YENİ GÖREV','NOWE ZADANIE','SARCINĂ NOUĂ'],
    ['feed.activity.taskCompleted','TAAK AFGEROND','TASK COMPLETED','GÖREV TAMAMLANDI','ZADANIE UKOŃCZONE','SARCINĂ FINALIZATĂ'],
    ['feed.activity.mealPlanned','MAALTIJD GEPLAND','MEAL PLANNED','ÖĞÜN PLANLANDI','POSIŁEK ZAPLANOWANY','MASĂ PLANIFICATĂ'],
    ['feed.activity.groceries','BOODSCHAPPEN','GROCERIES','ALIŞVERİŞ','ZAKUPY','CUMPĂRĂTURI'],
    ['feed.activity.appointment','AFSPRAAK','APPOINTMENT','RANDEVU','WYDARZENIE','PROGRAMARE'],
    ['feed.activity.familyUpdate','GEZINSUPDATE','FAMILY UPDATE','AİLE GÜNCELLEMESİ','AKTUALIZACJA RODZINNA','ACTUALIZARE FAMILIE'],
    ['feed.activity.taskPlanned','{{actor}} zette “{{task}}” op de planning','{{actor}} added “{{task}}” to the plan','{{actor}}, “{{task}}” görevini plana ekledi','{{actor}} dodał(a) „{{task}}” do planu','{{actor}} a adăugat „{{task}}” în plan'],
    ['feed.activity.readyXp','Klaar voor {{xp}} XP','Ready for {{xp}} XP','{{xp}} XP için hazır','Gotowe na {{xp}} XP','Gata pentru {{xp}} XP'],
    ['feed.activity.readyPickup','Klaar om opgepakt te worden','Ready to be picked up','Üstlenilmeye hazır','Gotowe do podjęcia','Gata de preluat'],
    ['feed.activity.taskFinished','{{actor}} rondde “{{task}}” af','{{actor}} completed “{{task}}”','{{actor}}, “{{task}}” görevini tamamladı','{{actor}} ukończył(a) „{{task}}”','{{actor}} a finalizat „{{task}}”'],
    ['feed.activity.niceBonus','Mooi meegenomen','Nice bonus','Güzel bonus','Miły bonus','Bonus plăcut'],
    ['feed.activity.houseLighter','Het huis is weer een taak lichter','One less task for the household','Evde bir görev daha az','Jedno zadanie mniej w domu','O sarcină mai puțin pentru casă'],
    ['feed.activity.mealBy','{{meal}} is ingepland door {{actor}}','{{meal}} was planned by {{actor}}','{{meal}}, {{actor}} tarafından planlandı','{{meal}} zaplanował(a) {{actor}}','{{meal}} a fost planificat de {{actor}}'],
    ['feed.activity.breakfast','Ontbijt','Breakfast','Kahvaltı','Śniadanie','Mic dejun'],
    ['feed.activity.dinner','Diner','Dinner','Akşam yemeği','Kolacja','Cină'],
    ['feed.activity.shoppingDone','{{actor}} heeft de boodschappen gedaan','{{actor}} did the grocery shopping','{{actor}} alışverişi yaptı','{{actor}} zrobił(a) zakupy','{{actor}} a făcut cumpărăturile'],
    ['feed.activity.familyGroceries','Gezinsboodschappen','Family groceries','Aile alışverişi','Zakupy rodzinne','Cumpărături de familie'],
    ['feed.activity.partyDone','“{{quest}}” is samen afgerond','“{{quest}}” was completed together','“{{quest}}” birlikte tamamlandı','„{{quest}}” ukończono razem','„{{quest}}” a fost finalizat împreună'],
    ['feed.activity.teamwork','Goed teamwork','Great teamwork','İyi takım çalışması','Świetna praca zespołowa','Muncă de echipă grozavă'],
    ['feed.activity.lookForward','Iets om naar uit te kijken','Something to look forward to','Dört gözle beklenecek bir şey','Coś, na co warto czekać','Ceva de așteptat cu nerăbdare'],
    ['feed.activity.appointmentInCalendar','{{title}} staat in de agenda','{{title}} is in the calendar','{{title}} takvimde','{{title}} jest w kalendarzu','{{title}} este în calendar'],
    ['feed.activity.somethingNew','Er is iets nieuws thuis','There is something new at home','Evde yeni bir şey var','W domu jest coś nowego','Este ceva nou acasă'],
    ['feed.activity.updatedBy','{{actor}} heeft iets bijgewerkt','{{actor}} updated something','{{actor}} bir şeyi güncelledi','{{actor}} coś zaktualizował(a)','{{actor}} a actualizat ceva']
,

    ['shop.household','Gezin','Family','Aile','Rodzina','Familie'],
    ['shop.placeholderWeekly','bijv. Weekboodschappen','e.g. Weekly groceries','örn. Haftalık alışveriş','np. Zakupy tygodniowe','ex. Cumpărături săptămânale'],
    ['shop.toggleBought','Markeer gekocht: {{name}}','Mark bought: {{name}}','Satın alındı olarak işaretle: {{name}}','Oznacz jako kupione: {{name}}','Marchează cumpărat: {{name}}'],
    ['shop.toggleOpen','Terug naar te kopen: {{name}}','Move back to to-buy: {{name}}','Alınacaklara geri taşı: {{name}}','Przenieś z powrotem do kupienia: {{name}}','Mută înapoi la de cumpărat: {{name}}'],
    ['shop.deleteItem','Verwijder {{name}}','Delete {{name}}','{{name}} sil','Usuń {{name}}','Șterge {{name}}'],
    ['shop.addLoading','Toevoegen wordt geladen…','Add is loading…','Ekleme yükleniyor…','Dodawanie jest ładowane…','Adăugarea se încarcă…'],
    ['shop.updateFailed','Bijwerken mislukt. De lijst is hersteld.','Update failed. The list was restored.','Güncelleme başarısız. Liste geri yüklendi.','Aktualizacja nie powiodła się. Lista została przywrócona.','Actualizarea a eșuat. Lista a fost restaurată.'],
    ['shop.deleteFailed','Verwijderen mislukt','Delete failed','Silme başarısız','Usuwanie nie powiodło się','Ștergerea a eșuat'],
    ['shop.boughtRemoved','Gekochte items verwijderd','Bought items removed','Alınan ürünler silindi','Kupione produkty usunięte','Articolele cumpărate au fost șterse'],
    ['shop.clearFailed','Legen mislukt','Clearing failed','Temizleme başarısız','Czyszczenie nie powiodło się','Golirea a eșuat'],
    ['shop.listCreateFailed','Lijst kon niet worden aangemaakt','List could not be created','Liste oluşturulamadı','Nie udało się utworzyć listy','Lista nu a putut fi creată']
,
    ['shop.receipt.finishTitle','Gekochte items afronden','Finish bought items','Alınan ürünleri tamamla','Zakończ kupione produkty','Finalizează articolele cumpărate'],
    ['shop.receipt.summary','{{count}} gekocht · bon opslaan is optioneel','{{count}} bought · saving the receipt is optional','{{count}} alındı · fişi kaydetmek isteğe bağlıdır','Kupiono: {{count}} · zapis paragonu jest opcjonalny','Cumpărate: {{count}} · salvarea bonului este opțională'],
    ['shop.receipt.finish','Afronden','Finish','Tamamla','Zakończ','Finalizează'],
    ['shop.receipt.noCategory','Geen categorie','No category','Kategori yok','Bez kategorii','Fără categorie'],
    ['shop.receipt.unavailable','Gekochte items kunnen nu niet worden verwerkt','Bought items cannot be processed right now','Alınan ürünler şu anda işlenemiyor','Kupione produkty nie mogą być teraz przetworzone','Articolele cumpărate nu pot fi procesate acum'],
    ['shop.receipt.none','Er zijn geen gekochte items om te verwerken','There are no bought items to process','İşlenecek alınmış ürün yok','Brak kupionych produktów do przetworzenia','Nu există articole cumpărate de procesat'],
    ['shop.receipt.transactionName','Naam transactie','Transaction name','İşlem adı','Nazwa transakcji','Numele tranzacției'],
    ['shop.receipt.category','Categorie','Category','Kategori','Kategoria','Categorie'],
    ['shop.receipt.optional','(optioneel)','(optional)','(isteğe bağlı)','(opcjonalnie)','(opțional)'],
    ['shop.receipt.total','Totaalbedrag bon (€)','Receipt total (€)','Fiş toplamı (€)','Suma paragonu (€)','Total bon (€)'],
    ['shop.receipt.date','Datum','Date','Tarih','Data','Dată'],
    ['shop.receipt.boughtItems','Gekochte items','Bought items','Alınan ürünler','Kupione produkty','Articole cumpărate'],
    ['shop.receipt.clearOnly','Alleen leegmaken','Clear only','Sadece temizle','Tylko wyczyść','Doar golește'],
    ['shop.receipt.cleared','Gekochte items leeggemaakt ✓','Bought items cleared ✓','Alınan ürünler temizlendi ✓','Kupione produkty wyczyszczone ✓','Articolele cumpărate au fost golite ✓'],
    ['shop.receipt.clearFailed','Gekochte items konden niet worden verwijderd','Bought items could not be removed','Alınan ürünler silinemedi','Nie udało się usunąć kupionych produktów','Articolele cumpărate nu au putut fi șterse'],
    ['shop.receipt.processFinance','Verwerk in Financien','Process in Finances','Finansa işle','Przetwórz w Finansach','Procesează în Finanțe'],
    ['shop.receipt.financeUnavailable','Financien is nu niet beschikbaar','Finances is currently unavailable','Finans şu anda kullanılamıyor','Finanse są obecnie niedostępne','Finanțele nu sunt disponibile momentan'],
    ['shop.receipt.nameRequired','Geef de transactie een naam','Give the transaction a name','İşleme bir ad ver','Nadaj transakcji nazwę','Dă un nume tranzacției'],
    ['shop.receipt.amountRequired','Vul een totaalbedrag in of kies Alleen leegmaken','Enter a total amount or choose Clear only','Toplam tutarı gir veya Sadece temizle seç','Wpisz łączną kwotę lub wybierz Tylko wyczyść','Introdu suma totală sau alege Doar golește'],
    ['shop.receipt.processed','{{name}} verwerkt · gekochte lijst opgeschoond ✓','{{name}} processed · bought list cleared ✓','{{name}} işlendi · alınanlar listesi temizlendi ✓','Przetworzono {{name}} · lista kupionych wyczyszczona ✓','{{name}} procesat · lista cumpărată a fost curățată ✓'],
    ['shop.receipt.savedClearFailed','Bon opgeslagen, maar gekochte items konden niet worden verwijderd','Receipt saved, but bought items could not be removed','Fiş kaydedildi ancak alınan ürünler silinemedi','Paragon zapisany, ale nie udało się usunąć kupionych produktów','Bonul a fost salvat, dar articolele cumpărate nu au putut fi șterse'],
    ['shop.receipt.failed','Bon kon niet worden verwerkt','Receipt could not be processed','Fiş işlenemedi','Nie udało się przetworzyć paragonu','Bonul nu a putut fi procesat'],
    ['shop.receipt.cat.groceries','Boodschappen','Groceries','Market','Zakupy spożywcze','Cumpărături'],
    ['shop.receipt.cat.dining','Uit eten','Dining out','Dışarıda yemek','Jedzenie na mieście','Restaurant'],
    ['shop.receipt.cat.delivery','Thuisbezorgd','Delivery','Paket servis','Dostawa jedzenia','Livrare'],
    ['shop.receipt.cat.outings','Uitjes','Outings','Geziler','Wyjścia','Ieșiri'],
    ['shop.receipt.cat.transport','Transport','Transport','Ulaşım','Transport','Transport'],
    ['shop.receipt.cat.health','Gezondheid','Health','Sağlık','Zdrowie','Sănătate'],
    ['shop.receipt.cat.subscriptions','Abonnementen','Subscriptions','Abonelikler','Subskrypcje','Abonamente'],
    ['shop.receipt.cat.clothing','Kleding','Clothing','Giyim','Odzież','Îmbrăcăminte'],
    ['shop.receipt.cat.shopping','Shopping','Shopping','Alışveriş','Zakupy','Shopping'],
    ['shop.receipt.cat.housing','Wonen','Home','Ev','Dom','Casă'],
    ['shop.receipt.cat.children','Kinderen','Children','Çocuklar','Dzieci','Copii'],
    ['shop.receipt.cat.pets','Huisdieren','Pets','Evcil hayvanlar','Zwierzęta','Animale de companie'],
    ['shop.receipt.cat.other','Overig','Other','Diğer','Inne','Altele']


  ];
  var moduleLanguages = ['nl','en','tr','pl','ro'];
  var moduleUiSourceMaps = { en:{}, tr:{}, pl:{}, ro:{} };
  moduleUiRows.forEach(function(row){
    for(var mi=0;mi<moduleLanguages.length;mi+=1){
      var lang=moduleLanguages[mi];
      if(dictionaries[lang]) dictionaries[lang][row[0]]=row[mi+1];
    }
    moduleUiSourceMaps.en[row[1]]=row[2];
    moduleUiSourceMaps.tr[row[1]]=row[3];
    moduleUiSourceMaps.pl[row[1]]=row[4];
    moduleUiSourceMaps.ro[row[1]]=row[5];
  });

  // Legacy UI bridge: translates known FamilyApp system copy that is still
  // rendered by older modules. It deliberately uses an allow-list of exact
  // product strings so user-entered task/note/feed content is not generically
  // machine-translated.
  var legacyUiRows = [
    ['Home','Home','Ana Sayfa','Strona główna','Acasă'],
    ['Taken','Tasks','Görevler','Zadania','Sarcini'],
    ['Notities','Notes','Notlar','Notatki','Notițe'],
    ['Boodschappen','Groceries','Alışveriş','Zakupy','Cumpărături'],
    ['Agenda','Calendar','Takvim','Kalendarz','Calendar'],
    ['Financiën','Finances','Finans','Finanse','Finanțe'],
    ['Achievements','Achievements','Başarımlar','Osiągnięcia','Realizări'],
    ['Meldingen','Notifications','Bildirimler','Powiadomienia','Notificări'],
    ['Profiel','Profile','Profil','Profil','Profil'],
    ['Recepten','Recipes','Tarifler','Przepisy','Rețete'],
    ['Skills','Skills','Beceriler','Umiejętności','Abilități'],
    ['Maaltijden','Meals','Öğünler','Posiłki','Mese'],
    ['Templates','Templates','Şablonlar','Szablony','Șabloane'],
    ['Schoonmaken','Cleaning','Temizlik','Sprzątanie','Curățenie'],
    ['Feed','Feed','Akış','Aktualności','Activitate'],
    ['Meer','More','Daha fazla','Więcej','Mai multe'],
    ['Aanpassen','Customise','Özelleştir','Dostosuj','Personalizează'],

    ['Opslaan','Save','Kaydet','Zapisz','Salvează'],
    ['Toevoegen','Add','Ekle','Dodaj','Adaugă'],
    ['Verwijderen','Delete','Sil','Usuń','Șterge'],
    ['Annuleren','Cancel','İptal','Anuluj','Anulează'],
    ['Sluiten','Close','Kapat','Zamknij','Închide'],
    ['Bewerken','Edit','Düzenle','Edytuj','Editează'],
    ['Openen','Open','Aç','Otwórz','Deschide'],
    ['Start','Start','Başlat','Start','Pornește'],
    ['Starten','Start','Başlat','Uruchom','Pornește'],
    ['Stop','Stop','Durdur','Stop','Oprește'],
    ['Stoppen','Stop','Durdur','Zatrzymaj','Oprește'],
    ['Pauzeren','Pause','Duraklat','Wstrzymaj','Pauză'],
    ['Hervatten','Resume','Devam et','Wznów','Reia'],
    ['Goedkeuren','Approve','Onayla','Zatwierdź','Aprobă'],
    ['Afwijzen','Reject','Reddet','Odrzuć','Respinge'],
    ['Accepteren','Accept','Kabul et','Akceptuj','Acceptă'],
    ['Weigeren','Decline','Reddet','Odmów','Refuză'],
    ['Bevestigen','Confirm','Onayla','Potwierdź','Confirmă'],
    ['Terug','Back','Geri','Wstecz','Înapoi'],
    ['Volgende','Next','Sonraki','Dalej','Următorul'],
    ['Vorige','Previous','Önceki','Poprzedni','Anterior'],
    ['Klaar','Done','Bitti','Gotowe','Gata'],
    ['Begrepen','Got it','Anladım','Rozumiem','Am înțeles'],
    ['Kies','Choose','Seç','Wybierz','Alege'],
    ['Selecteer','Select','Seç','Wybierz','Selectează'],
    ['Zoeken','Search','Ara','Szukaj','Caută'],
    ['Zoek…','Search…','Ara…','Szukaj…','Caută…'],
    ['Zoek...','Search...','Ara...','Szukaj...','Caută...'],
    ['Filter','Filter','Filtrele','Filtruj','Filtrează'],
    ['Delen','Share','Paylaş','Udostępnij','Distribuie'],
    ['Plaatsen','Post','Yayınla','Opublikuj','Publică'],
    ['Versturen','Send','Gönder','Wyślij','Trimite'],
    ['Verzenden','Send','Gönder','Wyślij','Trimite'],
    ['Opnieuw','Again','Tekrar','Ponownie','Din nou'],
    ['Probeer opnieuw','Try again','Tekrar dene','Spróbuj ponownie','Încearcă din nou'],
    ['Aanmelden','Sign up','Kaydol','Zapisz się','Înscrie-te'],
    ['Koppelen','Link','Bağla','Połącz','Conectează'],
    ['Ontkoppelen','Unlink','Bağlantıyı kaldır','Odłącz','Deconectează'],
    ['Alles','All','Tümü','Wszystko','Toate'],
    ['Geen','None','Yok','Brak','Niciunul'],

    ['Vandaag','Today','Bugün','Dzisiaj','Astăzi'],
    ['Morgen','Tomorrow','Yarın','Jutro','Mâine'],
    ['Gisteren','Yesterday','Dün','Wczoraj','Ieri'],
    ['Deze week','This week','Bu hafta','W tym tygodniu','Săptămâna aceasta'],
    ['Volgende week','Next week','Gelecek hafta','W przyszłym tygodniu','Săptămâna viitoare'],
    ['Deze maand','This month','Bu ay','W tym miesiącu','Luna aceasta'],
    ['Actief','Active','Aktif','Aktywne','Activ'],
    ['Inactief','Inactive','Pasif','Nieaktywne','Inactiv'],
    ['Openstaand','Open','Açık','Otwarte','Deschis'],
    ['Voltooid','Completed','Tamamlandı','Ukończone','Finalizat'],
    ['Afgerond','Completed','Tamamlandı','Ukończone','Finalizat'],
    ['Gepland','Scheduled','Planlandı','Zaplanowane','Planificat'],
    ['Gepauzeerd','Paused','Duraklatıldı','Wstrzymane','În pauză'],
    ['Beschikbaar','Available','Müsait','Dostępny','Disponibil'],
    ['Niet beschikbaar','Unavailable','Müsait değil','Niedostępny','Indisponibil'],
    ['Bezig...','Working...','İşleniyor...','Trwa...','Se procesează...'],
    ['⏳ Bezig...','⏳ Working...','⏳ İşleniyor...','⏳ Trwa...','⏳ Se procesează...'],
    ['Laden...','Loading...','Yükleniyor...','Ładowanie...','Se încarcă...'],
    ['Klaar!','Done!','Bitti!','Gotowe!','Gata!'],
    ['Mislukt','Failed','Başarısız','Niepowodzenie','Eșuat'],
    ['Gelukt','Success','Başarılı','Sukces','Reușit'],

    ['Inloggen','Sign in','Giriş yap','Zaloguj się','Autentificare'],
    ['Account aanmaken','Create account','Hesap oluştur','Utwórz konto','Creează cont'],
    ['E-mail inloggen','Email sign in','E-posta ile giriş','Logowanie e-mailem','Autentificare cu e-mail'],
    ['Registreren','Register','Kayıt ol','Zarejestruj się','Înregistrare'],
    ['Inloggen met Google','Sign in with Google','Google ile giriş yap','Zaloguj się przez Google','Autentifică-te cu Google'],
    ['Doorgaan met Google','Continue with Google','Google ile devam et','Kontynuuj z Google','Continuă cu Google'],
    ['Google openen…','Opening Google…','Google açılıyor…','Otwieranie Google…','Se deschide Google…'],
    ['📱 Offline gebruiken','📱 Use offline','📱 Çevrimdışı kullan','📱 Użyj offline','📱 Folosește offline'],
    ['E-mailadres','Email address','E-posta adresi','Adres e-mail','Adresă de e-mail'],
    ['Wachtwoord','Password','Şifre','Hasło','Parolă'],
    ['Jouw naam (bijv. Shane)','Your name (e.g. Shane)','Adın (örn. Shane)','Twoje imię (np. Shane)','Numele tău (ex. Shane)'],
    ['Partner naam (bijv. Esra)','Partner name (e.g. Esra)','Partner adı (örn. Esra)','Imię partnera (np. Esra)','Numele partenerului (ex. Esra)'],
    ['Voornaam (bijv. Shane)','First name (e.g. Shane)','Ad (örn. Shane)','Imię (np. Shane)','Prenume (ex. Shane)'],
    ['Bijna klaar!','Almost done!','Neredeyse hazır!','Prawie gotowe!','Aproape gata!'],
    ['Wat wil je gebruikt worden in de app?','What name should the app use for you?','Uygulamada hangi adı kullanmak istersin?','Jakiego imienia aplikacja ma używać?','Ce nume vrei să folosească aplicația?'],
    ['🚀 App starten!','🚀 Start app!','🚀 Uygulamayı başlat!','🚀 Uruchom aplikację!','🚀 Pornește aplicația!'],
    ['Vul e-mail en wachtwoord in','Enter your email and password','E-posta ve şifreni gir','Wpisz e-mail i hasło','Introdu e-mailul și parola'],
    ['Vul ook jouw naam en partner naam in','Also enter your name and your partner’s name','Adını ve partnerinin adını da gir','Wpisz także swoje imię i imię partnera','Introdu și numele tău și al partenerului'],
    ['E-mail al in gebruik','Email already in use','E-posta zaten kullanımda','E-mail jest już używany','E-mailul este deja folosit'],
    ['Verkeerd wachtwoord','Incorrect password','Yanlış şifre','Nieprawidłowe hasło','Parolă incorectă'],
    ['Geen account gevonden','No account found','Hesap bulunamadı','Nie znaleziono konta','Nu s-a găsit niciun cont'],
    ['Wachtwoord te kort (min. 6 tekens)','Password too short (min. 6 characters)','Şifre çok kısa (en az 6 karakter)','Hasło za krótkie (min. 6 znaków)','Parola este prea scurtă (min. 6 caractere)'],
    ['Ongeldig e-mailadres','Invalid email address','Geçersiz e-posta adresi','Nieprawidłowy adres e-mail','Adresă de e-mail invalidă'],

    ['Overzicht','Overview','Genel bakış','Przegląd','Prezentare generală'],
    ['Compact','Compact','Kompakt','Kompakt','Compact'],
    ['Persoon','Person','Kişi','Osoba','Persoană'],
    ['Nieuwe taak','New task','Yeni görev','Nowe zadanie','Sarcină nouă'],
    ['Taak toevoegen','Add task','Görev ekle','Dodaj zadanie','Adaugă sarcină'],
    ['Taak bewerken','Edit task','Görevi düzenle','Edytuj zadanie','Editează sarcina'],
    ['Taak verwijderen','Delete task','Görevi sil','Usuń zadanie','Șterge sarcina'],
    ['Datum','Date','Tarih','Data','Dată'],
    ['Categorie','Category','Kategori','Kategoria','Categorie'],
    ['Beschrijving','Description','Açıklama','Opis','Descriere'],
    ['Prioriteit','Priority','Öncelik','Priorytet','Prioritate'],
    ['Herhaling','Repeat','Tekrar','Powtarzanie','Repetare'],
    ['Eenmalig','Once','Tek sefer','Jednorazowo','O singură dată'],
    ['Dagelijks','Daily','Günlük','Codziennie','Zilnic'],
    ['Wekelijks','Weekly','Haftalık','Co tydzień','Săptămânal'],
    ['Maandelijks','Monthly','Aylık','Co miesiąc','Lunar'],
    ['Geen taken','No tasks','Görev yok','Brak zadań','Nicio sarcină'],
    ['Alles klaar! 🎉','All done! 🎉','Hepsi bitti! 🎉','Wszystko gotowe! 🎉','Totul este gata! 🎉'],
    ['Goed bezig! 💪','Great job! 💪','Harika gidiyorsun! 💪','Świetnie Ci idzie! 💪','Te descurci grozav! 💪'],

    ['Boodschappenlijst','Shopping list','Alışveriş listesi','Lista zakupów','Listă de cumpărături'],
    ['Product toevoegen','Add product','Ürün ekle','Dodaj produkt','Adaugă produs'],
    ['Item toevoegen','Add item','Öğe ekle','Dodaj pozycję','Adaugă articol'],
    ['Aantal','Quantity','Miktar','Ilość','Cantitate'],
    ['Eenheid','Unit','Birim','Jednostka','Unitate'],
    ['Gekocht','Bought','Alındı','Kupione','Cumpărat'],
    ['Nog te kopen','Still to buy','Alınacak','Do kupienia','De cumpărat'],
    ['Geen boodschappen','No groceries','Alışveriş yok','Brak zakupów','Nicio cumpărătură'],

    ['Kamers','Rooms','Odalar','Pokoje','Camere'],
    ['Kamer toevoegen','Add room','Oda ekle','Dodaj pokój','Adaugă cameră'],
    ['Kamer bewerken','Edit room','Odayı düzenle','Edytuj pokój','Editează camera'],
    ['Kamer verwijderen','Delete room','Odayı sil','Usuń pokój','Șterge camera'],
    ['Routines','Routines','Rutinler','Rutyny','Rutine'],
    ['Routine toevoegen','Add routine','Rutin ekle','Dodaj rutynę','Adaugă rutină'],
    ['Routine bewerken','Edit routine','Rutini düzenle','Edytuj rutynę','Editează rutina'],
    ['Routine verwijderen','Delete routine','Rutini sil','Usuń rutynę','Șterge rutina'],
    ['Werkplan','Work plan','Çalışma planı','Plan pracy','Plan de lucru'],
    ['Werkplan berekenen','Calculate work plan','Çalışma planını hesapla','Oblicz plan pracy','Calculează planul de lucru'],
    ['Taken synchroniseren','Sync tasks','Görevleri senkronize et','Synchronizuj zadania','Sincronizează sarcinile'],
    ['Voorraad','Supplies','Malzemeler','Zapasy','Provizii'],
    ['Schoonmaakmiddelen','Cleaning supplies','Temizlik malzemeleri','Środki czystości','Produse de curățenie'],
    ['Geschiedenis','History','Geçmiş','Historia','Istoric'],
    ['Beschikbaarheid','Availability','Uygunluk','Dostępność','Disponibilitate'],
    ['Hulp vragen','Ask for help','Yardım iste','Poproś o pomoc','Cere ajutor'],
    ['Plan goedkeuren','Approve plan','Planı onayla','Zatwierdź plan','Aprobă planul'],
    ['Plan afwijzen','Reject plan','Planı reddet','Odrzuć plan','Respinge planul'],

    ['Mijn naam','My name','Adım','Moje imię','Numele meu'],
    ['Partner naam','Partner name','Partner adı','Imię partnera','Numele partenerului'],
    ['Optioneel','Optional','İsteğe bağlı','Opcjonalne','Opțional'],
    ['Actief account','Active account','Aktif hesap','Aktywne konto','Cont activ'],
    ['E-mailadres niet beschikbaar','Email address unavailable','E-posta adresi kullanılamıyor','Adres e-mail niedostępny','Adresa de e-mail nu este disponibilă'],
    ['Profiel opgeslagen','Profile saved','Profil kaydedildi','Profil zapisany','Profil salvat'],
    ['Mijn avatar','My avatar','Avatarım','Mój awatar','Avatarul meu'],
    ['Kies uit de app','Choose from app','Uygulamadan seç','Wybierz z aplikacji','Alege din aplicație'],
    ['Upload foto','Upload photo','Fotoğraf yükle','Prześlij zdjęcie','Încarcă fotografie'],
    ['Avatar wijzigen','Change avatar','Avatarı değiştir','Zmień awatar','Schimbă avatarul'],
    ['Kies een avatar','Choose an avatar','Bir avatar seç','Wybierz awatar','Alege un avatar'],
    ['Avatar bijgewerkt','Avatar updated','Avatar güncellendi','Awatar zaktualizowany','Avatar actualizat'],
    ['Avatar gekozen','Avatar selected','Avatar seçildi','Wybrano awatar','Avatar ales'],
    ['UI schaal','UI scale','Arayüz ölçeği','Skala interfejsu','Scală interfață'],
    ['Account instellingen','Account settings','Hesap ayarları','Ustawienia konta','Setări cont'],
    ['Privacy','Privacy','Gizlilik','Prywatność','Confidențialitate'],
    ['Uitloggen','Sign out','Çıkış yap','Wyloguj się','Deconectare'],
    ['Uitloggen is tijdelijk niet beschikbaar','Sign out is temporarily unavailable','Çıkış geçici olarak kullanılamıyor','Wylogowanie jest tymczasowo niedostępne','Deconectarea este temporar indisponibilă'],
    ['FamilyApp geïnstalleerd','FamilyApp installed','FamilyApp yüklendi','FamilyApp zainstalowana','FamilyApp instalată'],
    ['Installeer FamilyApp','Install FamilyApp','FamilyApp’i yükle','Zainstaluj FamilyApp','Instalează FamilyApp'],
    ['Zet FamilyApp op je beginscherm','Add FamilyApp to your home screen','FamilyApp’i ana ekranına ekle','Dodaj FamilyApp do ekranu głównego','Adaugă FamilyApp pe ecranul principal'],

    ['Deel iets met het gezin...','Share something with the family...','Ailenle bir şey paylaş...','Podziel się czymś z rodziną...','Împărtășește ceva cu familia...'],
    ['Reactie plaatsen','Post comment','Yorum gönder','Dodaj komentarz','Publică comentariul'],
    ['Vind ik leuk','Like','Beğen','Lubię to','Îmi place'],
    ['Taak afgerond','Task completed','Görev tamamlandı','Zadanie ukończone','Sarcină finalizată'],

    ['Nieuwe afspraak','New appointment','Yeni randevu','Nowe wydarzenie','Programare nouă'],
    ['Afspraak toevoegen','Add appointment','Randevu ekle','Dodaj wydarzenie','Adaugă programare'],
    ['Tik op een dag om afspraken te zien','Tap a day to see appointments','Randevuları görmek için bir güne dokun','Dotknij dnia, aby zobaczyć wydarzenia','Atinge o zi pentru a vedea programările'],
    ['Geen afspraken','No appointments','Randevu yok','Brak wydarzeń','Nicio programare'],

    ['Inkomsten','Income','Gelir','Przychody','Venituri'],
    ['Uitgaven','Expenses','Giderler','Wydatki','Cheltuieli'],
    ['Saldo','Balance','Bakiye','Saldo','Sold'],
    ['Transacties','Transactions','İşlemler','Transakcje','Tranzacții'],
    ['Spaardoelen','Savings goals','Tasarruf hedefleri','Cele oszczędnościowe','Obiective de economii'],
    ['Nieuw spaardoel','New savings goal','Yeni tasarruf hedefi','Nowy cel oszczędnościowy','Obiectiv nou de economii'],
    ['Bedrag','Amount','Tutar','Kwota','Sumă'],
    ['Vrij besteedbaar deze maand','Available to spend this month','Bu ay harcanabilir','Do wydania w tym miesiącu','Disponibil de cheltuit luna aceasta'],
    ['Nog geen transacties','No transactions yet','Henüz işlem yok','Brak transakcji','Încă nu există tranzacții'],
    ['Nog geen spaardoelen. Voeg er een toe!','No savings goals yet. Add one!','Henüz tasarruf hedefi yok. Bir tane ekle!','Brak celów oszczędnościowych. Dodaj jeden!','Încă nu există obiective de economii. Adaugă unul!'],

    ['Recept toevoegen','Add recipe','Tarif ekle','Dodaj przepis','Adaugă rețetă'],
    ['Ingrediënten','Ingredients','Malzemeler','Składniki','Ingrediente'],
    ['Bereiding','Method','Hazırlanış','Przygotowanie','Preparare'],
    ['Porties','Servings','Porsiyon','Porcje','Porții'],
    ['Week menu','Weekly menu','Haftalık menü','Menu tygodniowe','Meniu săptămânal'],
    ['Tik op een slot om een recept te koppelen.','Tap a slot to link a recipe.','Bir tarif bağlamak için bir alana dokun.','Dotknij pola, aby przypisać przepis.','Atinge un interval pentru a asocia o rețetă.'],
    ['Lunch kiezen...','Choose lunch...','Öğle yemeği seç...','Wybierz lunch...','Alege prânzul...'],
    ['Diner kiezen...','Choose dinner...','Akşam yemeği seç...','Wybierz kolację...','Alege cina...'],
    ['recepten naar boodschappenlijst','recipes to shopping list','tarifleri alışveriş listesine','przepisy do listy zakupów','rețete în lista de cumpărături'],

    ['Geen notities','No notes','Not yok','Brak notatek','Nicio notiță'],
    ['Nieuwe notitie','New note','Yeni not','Nowa notatka','Notiță nouă'],
    ['Titel...','Title...','Başlık...','Tytuł...','Titlu...'],

    ['Niveau','Level','Seviye','Poziom','Nivel'],
    ['Beloning','Reward','Ödül','Nagroda','Recompensă'],
    ['Ontgrendeld','Unlocked','Açıldı','Odblokowane','Deblocat'],
    ['Vergrendeld','Locked','Kilitli','Zablokowane','Blocat'],
    ['Behaald','Earned','Kazanıldı','Zdobyte','Obținut'],
    ['Niet behaald','Not earned','Kazanılmadı','Nie zdobyte','Neobținut']
  ];

  var legacyUiMaps = { en: {}, tr: {}, pl: {}, ro: {} };
  legacyUiRows.forEach(function (row) {
    legacyUiMaps.en[row[0]] = row[1];
    legacyUiMaps.tr[row[0]] = row[2];
    legacyUiMaps.pl[row[0]] = row[3];
    legacyUiMaps.ro[row[0]] = row[4];
  });

  function normalizeUiSource(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function translateUiText(source) {
    var normalized = normalizeUiSource(source);
    if (!normalized) return source;
    var language = getLanguage();
    if (language === 'nl') return normalized;
    var moduleMap = moduleUiSourceMaps[language] || moduleUiSourceMaps.en;
    if (moduleMap && moduleMap[normalized] !== undefined) return moduleMap[normalized];
    var map = legacyUiMaps[language] || legacyUiMaps.en;
    if (map[normalized] !== undefined) return map[normalized];

    var countMatch = normalized.match(/^(\d+)\s+taken$/i);
    if (countMatch) return t('tasks.count', { count: Number(countMatch[1]) });

    var remainingTasks = normalized.match(/^Nog\s+(\d+)\s+taken$/i);
    if (remainingTasks) {
      var count = Number(remainingTasks[1]);
      if (language === 'tr') return count + ' görev kaldı';
      if (language === 'pl') return 'Pozostało ' + count + ' zadań';
      if (language === 'ro') return 'Mai sunt ' + count + ' sarcini';
      return count + ' tasks remaining';
    }

    return source;
  }

  var sourceTextByNode = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var legacyObserver = null;
  var legacyApplyScheduled = false;

  function excludedUserContent(node) {
    var parent = node && node.parentElement;
    if (!parent || !parent.closest) return false;
    return !!parent.closest(
      '[contenteditable="true"],[data-user-content],.compose-input,.feed-post-text,.feed-comment-text,' +
      '.task-user-title,.note-user-content,.recipe-user-title,.profile-input-row input'
    );
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== 3 || excludedUserContent(node)) return;
    var raw = node.nodeValue || '';
    var trimmed = normalizeUiSource(raw);
    if (!trimmed) return;

    var source = sourceTextByNode && sourceTextByNode.get(node);
    var directKnown = legacyUiMaps.en[trimmed] !== undefined ||
      legacyUiMaps.tr[trimmed] !== undefined ||
      legacyUiMaps.pl[trimmed] !== undefined ||
      legacyUiMaps.ro[trimmed] !== undefined ||
      /^(?:Nog\s+)?\d+\s+taken$/i.test(trimmed);

    if (!source && directKnown) {
      source = trimmed;
      if (sourceTextByNode) sourceTextByNode.set(node, source);
    } else if (source) {
      var expected = normalizeUiSource(translateUiText(source));
      if (trimmed !== expected && directKnown) {
        source = trimmed;
        if (sourceTextByNode) sourceTextByNode.set(node, source);
      }
    }

    if (!source) return;
    var translated = translateUiText(source);
    if (normalizeUiSource(translated) === trimmed) return;

    var leading = raw.match(/^\s*/);
    var trailing = raw.match(/\s*$/);
    node.nodeValue = (leading ? leading[0] : '') + translated + (trailing ? trailing[0] : '');
  }

  function translateAttribute(el, name) {
    if (!el || !el.getAttribute || !el.hasAttribute(name)) return;
    var sourceAttr = 'data-familyapp-i18n-source-' + name.replace(/[^a-z0-9]/gi, '-');
    var source = el.getAttribute(sourceAttr);
    var current = el.getAttribute(name) || '';
    var normalizedCurrent = normalizeUiSource(current);
    var known = legacyUiMaps.en[normalizedCurrent] !== undefined ||
      legacyUiMaps.tr[normalizedCurrent] !== undefined ||
      legacyUiMaps.pl[normalizedCurrent] !== undefined ||
      legacyUiMaps.ro[normalizedCurrent] !== undefined;

    if (!source && known) {
      source = normalizedCurrent;
      el.setAttribute(sourceAttr, source);
    } else if (source && known && normalizedCurrent !== normalizeUiSource(translateUiText(source))) {
      source = normalizedCurrent;
      el.setAttribute(sourceAttr, source);
    }

    if (!source) return;
    var translated = translateUiText(source);
    if (translated !== current) el.setAttribute(name, translated);
  }

  function localizeLegacySubtree(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;

    var elementRoot = root.nodeType === 1 ? root : null;
    if (elementRoot) {
      translateAttribute(elementRoot, 'placeholder');
      translateAttribute(elementRoot, 'title');
      translateAttribute(elementRoot, 'aria-label');
    }

    var scope = root.nodeType === 9 ? root.documentElement : root;
    if (!scope || !scope.querySelectorAll) return;

    var attrs = scope.querySelectorAll('[placeholder],[title],[aria-label]');
    Array.prototype.forEach.call(attrs, function (el) {
      translateAttribute(el, 'placeholder');
      translateAttribute(el, 'title');
      translateAttribute(el, 'aria-label');
    });

    if (document.createTreeWalker && typeof NodeFilter !== 'undefined') {
      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      var textNode;
      while ((textNode = walker.nextNode())) translateTextNode(textNode);
    }
  }

  function scheduleLegacyApply(root) {
    if (legacyApplyScheduled) return;
    legacyApplyScheduled = true;
    var run = function () {
      legacyApplyScheduled = false;
      localizeLegacySubtree(root || document);
    };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function ensureLegacyObserver() {
    if (legacyObserver || typeof MutationObserver === 'undefined' || !document.documentElement) return;
    legacyObserver = new MutationObserver(function (mutations) {
      var root = null;
      for (var i = 0; i < mutations.length; i += 1) {
        var mutation = mutations[i];
        if (mutation.type === 'characterData') {
          root = mutation.target.parentNode || document;
          break;
        }
        if (mutation.addedNodes && mutation.addedNodes.length) {
          root = mutation.target || document;
          break;
        }
        if (mutation.type === 'attributes') {
          root = mutation.target || document;
          break;
        }
      }
      if (root) scheduleLegacyApply(root);
    });
    legacyObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });
  }

  window.FamilyI18n = {
    storageKey: STORAGE_KEY,
    systemValue: SYSTEM_VALUE,
    defaultLanguage: DEFAULT_LANGUAGE,
    getPreference: getPreference,
    setPreference: setPreference,
    getLanguage: getLanguage,
    getLocale: getLocale,
    getOptions: getOptions,
    t: t,
    formatDate: formatDate,
    formatNumber: formatNumber,
    apply: apply,
    translateUiText: translateUiText,
    localizeLegacySubtree: localizeLegacySubtree,
    dictionaries: dictionaries
  };

  function initialApply() {
    apply(document);
    ensureLegacyObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialApply, { once: true });
  } else {
    initialApply();
  }
})();
