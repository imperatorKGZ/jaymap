/**
 * ru.ts — русские переводы (язык по умолчанию).
 * Здесь же объявлен интерфейс Locale — единственный источник истины
 * для формы словаря. en.ts и ky.ts обязаны реализовать тот же интерфейс,
 * поэтому потерять или переименовать ключ в одном из языков невозможно
 * без ошибки компиляции TypeScript.
 */
export interface Locale {
  common: {
    from: string;
    to: string;
    any: string;
  };
  sidebar: {
    panelLabel: string;
    expandPanel: string;
    collapsePanel: string;
    mainSectionsAria: string;
    secondarySectionsAria: string;
    loadingAria: string;
    mainMenuTitle: string;
    backDefault: string;
    decreaseAria: string;
    increaseAria: string;
    sections: {
      rental: string;
      commercial: string;
      land: string;
      daily: string;
      agencies: string;
      favorites: string;
      subscriptions: string;
      history: string;
      layers: string;
      settings: string;
      profile: string;
    };
  };
  rental: {
    propertyType: string;
    apartment: string;
    house: string;
    room: string;
    price: string;
    rooms: string;
    roomsCount: string;
    area: string;
    floor: string;
    furnished: string;
    parking: string;
    pets: string;
    showListings: string;
  };
  commercial: {
    purpose: string;
    office: string;
    retail: string;
    warehouse: string;
    production: string;
    catering: string;
    buildingClass: string;
    area: string;
    rate: string;
    ratePlaceholder: string;
    separateEntrance: string;
    groundFloor: string;
    showListings: string;
  };
  land: {
    landUse: string;
    residential: string;
    agricultural: string;
    commercial: string;
    area: string;
    utilities: string;
    electricity: string;
    water: string;
    gas: string;
    sewage: string;
    documents: string;
    ready: string;
    inProcess: string;
    showPlots: string;
  };
  daily: {
    dates: string;
    guests: string;
    guestsCount: string;
    hostRating: string;
    instantBooking: string;
    instantBookingDesc: string;
    showOptions: string;
  };
  agencies: {
    search: string;
    searchPlaceholder: string;
    sort: string;
    byRating: string;
    byListings: string;
    byName: string;
    specialization: string;
    rental: string;
    commercial: string;
    land: string;
    listingsSuffix: string;
  };
  favorites: {
    empty: string;
  };
  layers: {
    heatmap: string;
    transit: string;
    schools: string;
    boundaries: string;
  };
  settings: {
    theme: string;
    themeDark: string;
    themeLight: string;
    themeCustom: string;
    units: string;
    unitsMetric: string;
    unitsImperial: string;
    notifications: string;
  };
  subscriptions: {
    description: string;
    newListings: string;
    priceDrops: string;
  };
  profile: {
    guest: string;
    loginPrompt: string;
    login: string;
  };
  navbar: {
    login: string;
    post: string;
    search: string;
    searchPlaceholder: string;
  };
  map: {
    preparing: string;
  };
}

export const ru: Locale = {
  common: {
    from: "От",
    to: "До",
    any: "Любой",
  },
  sidebar: {
    panelLabel: "Боковая панель JayMap",
    expandPanel: "Развернуть панель",
    collapsePanel: "Свернуть панель",
    mainSectionsAria: "Основные разделы",
    secondarySectionsAria: "Вспомогательные разделы",
    loadingAria: "Загрузка раздела",
    mainMenuTitle: "Главное меню",
    backDefault: "Главное",
    decreaseAria: "Уменьшить",
    increaseAria: "Увеличить",
    sections: {
      rental: "Аренда",
      commercial: "Коммерция",
      land: "Земельные участки",
      daily: "Посуточная аренда",
      agencies: "Агентства",
      favorites: "Избранное",
      subscriptions: "Подписки",
      history: "История",
      layers: "Слои карты",
      settings: "Настройки",
      profile: "Профиль",
    },
  },
  rental: {
    propertyType: "Тип жилья",
    apartment: "Квартира",
    house: "Дом",
    room: "Комната",
    price: "Цена, ₽/мес",
    rooms: "Комнаты",
    roomsCount: "Количество",
    area: "Площадь, м²",
    floor: "Этаж",
    furnished: "С мебелью",
    parking: "Парковка",
    pets: "Можно с животными",
    showListings: "Показать объекты",
  },
  commercial: {
    purpose: "Назначение",
    office: "Офис",
    retail: "Торговое",
    warehouse: "Склад",
    production: "Производство",
    catering: "Общепит",
    buildingClass: "Класс здания",
    area: "Площадь, м²",
    rate: "Ставка, ₽ за м²/мес — до",
    ratePlaceholder: "Например, 1200",
    separateEntrance: "Отдельный вход",
    groundFloor: "Первая линия / 1 этаж",
    showListings: "Показать объекты",
  },
  land: {
    landUse: "Назначение земли",
    residential: "ИЖС",
    agricultural: "СХ",
    commercial: "Коммерция",
    area: "Площадь, соток",
    utilities: "Коммуникации",
    electricity: "Электричество",
    water: "Вода",
    gas: "Газ",
    sewage: "Канализация",
    documents: "Документы",
    ready: "Готовы",
    inProcess: "В процессе",
    showPlots: "Показать участки",
  },
  daily: {
    dates: "Даты",
    guests: "Гости",
    guestsCount: "Количество гостей",
    hostRating: "Рейтинг хозяина",
    instantBooking: "Мгновенное бронирование",
    instantBookingDesc: "Без подтверждения хозяином",
    showOptions: "Показать варианты",
  },
  agencies: {
    search: "Поиск",
    searchPlaceholder: "Название агентства",
    sort: "Сортировка",
    byRating: "Рейтинг",
    byListings: "Объектов",
    byName: "А–Я",
    specialization: "Специализация",
    rental: "Аренда",
    commercial: "Коммерция",
    land: "Земля",
    listingsSuffix: "объектов",
  },
  favorites: {
    empty: "Отмечайте объекты сердечком на карте — они появятся здесь.",
  },
  layers: {
    heatmap: "Тепловая карта цен",
    transit: "Общественный транспорт",
    schools: "Школы и садики",
    boundaries: "Границы районов",
  },
  settings: {
    theme: "Тема",
    themeDark: "Тёмная",
    themeLight: "Светлая",
    themeCustom: "Кастомная",
    units: "Единицы измерения",
    unitsMetric: "м² / ₽",
    unitsImperial: "ft² / $",
    notifications: "Уведомления",
  },
  subscriptions: {
    description: "Уведомим, когда появятся подходящие варианты по вашим сохранённым фильтрам.",
    newListings: "Новые объявления",
    priceDrops: "Снижение цены",
  },
  profile: {
    guest: "Гость",
    loginPrompt: "Войдите, чтобы сохранять избранное и подписки",
    login: "Войти",
  },
  navbar: {
    login: "Войти",
    search: "Выберите город",
    post: "Разместить",
    searchPlaceholder: "Выберите город...",
  },
  map: {
    preparing: "Подготовка карты...",
  },
};
