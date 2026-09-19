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
    dictionaries: dictionaries
  };

  function initialApply() {
    apply(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialApply, { once: true });
  } else {
    initialApply();
  }
})();
