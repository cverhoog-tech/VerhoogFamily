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
    ['common.close','Sluiten','Close','Kapat','Zamknij','Închide'],
    ['common.cancel','Annuleren','Cancel','İptal','Anuluj','Anulează'],
    ['common.save','Opslaan','Save','Kaydet','Zapisz','Salvează'],
    ['common.edit','Bewerken','Edit','Düzenle','Edytuj','Editează'],
    ['common.delete','Verwijderen','Delete','Sil','Usuń','Șterge'],
    ['common.items','items','items','öğe','pozycje','articole'],
    ['common.today','Vandaag','Today','Bugün','Dzisiaj','Astăzi'],
    ['common.tomorrow','Morgen','Tomorrow','Yarın','Jutro','Mâine'],
    ['common.later','Later','Later','Daha sonra','Później','Mai târziu'],
    ['common.family','Gezin','Family','Aile','Rodzina','Familie']
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

    ['shop.household','Gezin','Family','Aile','Rodzina','Familie'],
    ['shop.placeholderWeekly','bijv. Weekboodschappen','e.g. Weekly groceries','örn. Haftalık alışveriş','np. Zakupy tygodniowe','ex. Cumpărături săptămânale'],
    ['shop.toggleBought','Markeer gekocht: {{name}}','Mark bought: {{name}}','Satın alındı olarak işaretle: {{name}}','Oznacz jako kupione: {{name}}','Marchează cumpărat: {{name}}'],
    ['shop.toggleOpen','Terug naar te kopen: {{name}}','Move back to to-buy: {{name}}','Alınacaklara geri taşı: {{name}}','Przenieś z powrotem do kupienia: {{name}}','Mută înapoi la de cumpărat: {{name}}'],
    ['shop.deleteItem','Verwijder {{name}}','Delete {{name}}','{{name}} sil','Usuń {{name}}','Șterge {{name}}'],
    ['shop.addLoading','Toevoegen wordt geladen…','Add is loading…','Ekleme yükleniyor…','Dodawanie jest ładowane…','Adăugarea se încarcă…']

  ];
  var moduleLanguages = ['nl','en','tr','pl','ro'];
  moduleUiRows.forEach(function(row){
    for(var mi=0;mi<moduleLanguages.length;mi+=1){
      var lang=moduleLanguages[mi];
      if(dictionaries[lang]) dictionaries[lang][row[0]]=row[mi+1];
    }
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
