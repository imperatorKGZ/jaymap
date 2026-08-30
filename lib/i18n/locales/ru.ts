/**
 * ru.ts — русские переводы (язык по умолчанию).
 *
 * Здесь же объявлен интерфейс Locale — единственный источник истины
 * для формы словаря.
 *
 * en.ts и ky.ts обязаны реализовать тот же интерфейс,
 * поэтому отсутствие нового ключа в одном из языков
 * будет обнаружено TypeScript.
 */

export interface Locale {
  common: {
    from: string;
    to: string;
    any: string;

    close: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    retry: string;
    search: string;
    clear: string;
    apply: string;
    reset: string;
    yes: string;
    no: string;
    error: string;
    success: string;
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

    validationError: string;
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
    add: string;
    remove: string;
    authRequired: string;
    loading: string;
  };

  history: {
    empty: string;
    title: string;
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
    empty: string;
  };

  profile: {
    guest: string;
    loginPrompt: string;
    login: string;

    title: string;
    displayName: string;
    email: string;
    phone: string;
    bio: string;
    avatar: string;
    changeAvatar: string;
    removeAvatar: string;
    saveChanges: string;
    saved: string;
    saveError: string;
  };

  navbar: {
    login: string;
    logout: string;
    post: string;
    search: string;
    searchPlaceholder: string;
    profile: string;
  };

  auth: {
    title: string;
    description: string;

    close: string;

    google: string;
    googleLoading: string;

    divider: string;

    phoneTitle: string;
    phoneDescription: string;
    phoneComingSoon: string;

    cancel: string;

    terms: string;

    errorGoogle: string;
  };

  listings: {
    title: string;
    create: string;
    edit: string;
    publish: string;
    saveDraft: string;
    delete: string;
    close: string;

    noListings: string;
    myListings: string;

    titleField: string;
    titlePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;

    price: string;
    currency: string;

    address: string;
    addressPlaceholder: string;

    city: string;
    cityPlaceholder: string;

    district: string;
    districtPlaceholder: string;

    type: string;

    rooms: string;
    area: string;
    floor: string;
    totalFloors: string;

    furnished: string;
    parking: string;
    pets: string;

    photos: string;
    addPhoto: string;
    removePhoto: string;
    photoLimit: string;

    location: string;
    chooseLocation: string;
    locationSelected: string;

    status: string;
    statusDraft: string;
    statusPublished: string;
    statusPaused: string;
    statusArchived: string;

    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;

    createError: string;
    updateError: string;
    deleteError: string;

    required: string;
  };

  listingPopup: {
    close: string;
    favorite: string;
    unfavorite: string;

    rooms: string;
    area: string;
    floor: string;
    furnished: string;
    parking: string;
    pets: string;

    contacts: string;
    phone: string;
    telegram: string;
    whatsapp: string;

    contactsLoading: string;
    contactsLoginRequired: string;
    contactsUnavailable: string;

    login: string;
    loginToSeeContacts: string;

    noPhotos: string;
    previousPhoto: string;
    nextPhoto: string;

    notFound: string;
    loading: string;

    viewed: string;
    showMore: string;

    closeAria: string;
    favoriteAria: string;
  };

  map: {
    preparing: string;
    loading: string;
    noListings: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
  };

  dialogs: {
    unsavedChanges: string;
    deleteConfirmation: string;
    deleteConfirmationDescription: string;
    confirmDelete: string;
  };
    myListings: {
    title: string;
    description: string;
    countOne: string;
    countFew: string;
    countMany: string;

    all: string;

    loading: string;
    loadingCities: string;

    loadErrorTitle: string;
    loadErrorDescription: string;

    emptyTitle: string;
    emptyFilteredTitle: string;
    emptyDescription: string;

    filteredOf: string;

    premium: string;

    propertyRental: string;
    propertyCommercial: string;
    propertyLand: string;
    propertyDaily: string;
  };
}

export const ru: Locale = {
  common: {
    from: "От",
    to: "До",
    any: "Любой",

    close: "Закрыть",
    cancel: "Отмена",
    save: "Сохранить",
    delete: "Удалить",
    edit: "Редактировать",
    back: "Назад",
    next: "Далее",
    previous: "Назад",
    loading: "Загрузка...",
    retry: "Повторить",
    search: "Поиск",
    clear: "Очистить",
    apply: "Применить",
    reset: "Сбросить",
    yes: "Да",
    no: "Нет",
    error: "Ошибка",
    success: "Готово",
  },

  sidebar: {
    panelLabel:
      "Боковая панель JayMap",

    expandPanel:
      "Развернуть панель",

    collapsePanel:
      "Свернуть панель",

    mainSectionsAria:
      "Основные разделы",

    secondarySectionsAria:
      "Вспомогательные разделы",

    loadingAria:
      "Загрузка раздела",

    mainMenuTitle:
      "Главное меню",

    backDefault:
      "Главное",

    decreaseAria:
      "Уменьшить",

    increaseAria:
      "Увеличить",

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

    validationError:
      "Проверьте значения фильтров.",
  },

  rental: {
    propertyType:
      "Тип жилья",

    apartment:
      "Квартира",

    house:
      "Дом",

    room:
      "Комната",

    price:
      "Цена, сом/мес",

    rooms:
      "Комнаты",

    roomsCount:
      "Количество",

    area:
      "Площадь, м²",

    floor:
      "Этаж",

    furnished:
      "С мебелью",

    parking:
      "Парковка",

    pets:
      "Можно с животными",

    showListings:
      "Показать объекты",
  },

  commercial: {
    purpose:
      "Назначение",

    office:
      "Офис",

    retail:
      "Торговое помещение",

    warehouse:
      "Склад",

    production:
      "Производство",

    catering:
      "Общепит",

    buildingClass:
      "Класс здания",

    area:
      "Площадь, м²",

    rate:
      "Ставка, сом за м²/мес — до",

    ratePlaceholder:
      "Например, 1200",

    separateEntrance:
      "Отдельный вход",

    groundFloor:
      "Первая линия / 1 этаж",

    showListings:
      "Показать объекты",
  },

  land: {
    landUse:
      "Назначение земли",

    residential:
      "ИЖС",

    agricultural:
      "Сельскохозяйственное",

    commercial:
      "Коммерция",

    area:
      "Площадь, соток",

    utilities:
      "Коммуникации",

    electricity:
      "Электричество",

    water:
      "Вода",

    gas:
      "Газ",

    sewage:
      "Канализация",

    documents:
      "Документы",

    ready:
      "Готовы",

    inProcess:
      "В процессе",

    showPlots:
      "Показать участки",
  },

  daily: {
    dates:
      "Даты",

    guests:
      "Гости",

    guestsCount:
      "Количество гостей",

    hostRating:
      "Рейтинг хозяина",

    instantBooking:
      "Мгновенное бронирование",

    instantBookingDesc:
      "Без подтверждения хозяином",

    showOptions:
      "Показать варианты",
  },

  agencies: {
    search:
      "Поиск",

    searchPlaceholder:
      "Название агентства",

    sort:
      "Сортировка",

    byRating:
      "Рейтинг",

    byListings:
      "Объектов",

    byName:
      "А–Я",

    specialization:
      "Специализация",

    rental:
      "Аренда",

    commercial:
      "Коммерция",

    land:
      "Земля",

    listingsSuffix:
      "объектов",
  },

  favorites: {
    empty:
      "Отмечайте объекты сердечком на карте — они появятся здесь.",

    add:
      "Добавить в избранное",

    remove:
      "Убрать из избранного",

    authRequired:
      "Войдите, чтобы сохранять объявления.",

    loading:
      "Обновление избранного...",
  },

  history: {
    empty:
      "Здесь появятся объявления, которые вы просматривали.",

    title:
      "История",
  },

  layers: {
    heatmap:
      "Тепловая карта цен",

    transit:
      "Общественный транспорт",

    schools:
      "Школы и садики",

    boundaries:
      "Границы районов",
  },

  settings: {
    theme:
      "Тема",

    themeDark:
      "Тёмная",

    themeLight:
      "Светлая",

    themeCustom:
      "Кастомная",

    units:
      "Единицы измерения",

    unitsMetric:
      "м² / сом",

    unitsImperial:
      "ft² / $",

    notifications:
      "Уведомления",
  },

  subscriptions: {
    description:
      "Уведомим, когда появятся подходящие варианты по вашим сохранённым фильтрам.",

    newListings:
      "Новые объявления",

    priceDrops:
      "Снижение цены",

    empty:
      "У вас пока нет сохранённых подписок.",
  },

  profile: {
    guest:
      "Гость",

    loginPrompt:
      "Войдите, чтобы сохранять избранное и подписки",

    login:
      "Войти",

    title:
      "Профиль",

    displayName:
      "Имя",

    email:
      "Email",

    phone:
      "Телефон",

    bio:
      "О себе",

    avatar:
      "Фото профиля",

    changeAvatar:
      "Изменить фото",

    removeAvatar:
      "Удалить фото",

    saveChanges:
      "Сохранить изменения",

    saved:
      "Изменения сохранены.",

    saveError:
      "Не удалось сохранить изменения.",
    description:
      "Измените имя и контактные данные.",

    avatarHint:
      "JPG, PNG или WebP · до 5 МБ",

    removeSelectedAvatar:
      "Убрать выбранное фото",

    deletePhoto:
      "Удалить фото",

    deleting:
      "Удаляем...",

    photoTypeError:
      "Поддерживаются только JPG, PNG и WebP.",

    photoSizeError:
      "Размер изображения не должен превышать 5 МБ.",

    avatarDeleteError:
      "Не удалось удалить фото. Попробуйте ещё раз.",

    nameRequired:
      "Введите имя.",

    nameTooShort:
      "Имя должно содержать минимум 2 символа.",

    nameTooLong:
      "Имя слишком длинное.",

    profileSaveError:
      "Не удалось сохранить профиль. Попробуйте ещё раз.",

    savedMessage:
      "Профиль сохранён.",

    yourName:
      "Ваше имя",

    saveLoading:
      "Сохранение...",
  },

  navbar: {
    login:
      "Войти",

    logout:
      "Выйти",

    post:
      "Разместить",

    search:
      "Выберите город",

    searchPlaceholder:
      "Выберите город...",

    profile:
      "Профиль",
  },

  auth: {
    title:
      "Войти в JayMap",

    description:
      "Войдите, чтобы видеть контакты, сохранять объявления и размещать свои объекты.",

    close:
      "Закрыть",

    google:
      "Продолжить с Google",

    googleLoading:
      "Подключение...",

    divider:
      "или",

    phoneTitle:
      "Вход по номеру телефона",

    phoneDescription:
      "Авторизация по SMS появится позже.",

    phoneComingSoon:
      "Эта функция пока недоступна.",

    cancel:
      "Отмена",

    terms:
      "Продолжая, вы соглашаетесь с правилами использования JayMap.",

    errorGoogle:
      "Не удалось открыть Google. Попробуйте ещё раз.",
  },

  listings: {
    title:
      "Объявление",

    create:
      "Разместить объявление",

    edit:
      "Редактировать объявление",

    publish:
      "Опубликовать",

    saveDraft:
      "Сохранить черновик",

    delete:
      "Удалить объявление",

    close:
      "Закрыть",

    noListings:
      "Объявлений пока нет.",

    myListings:
      "Мои объявления",

    titleField:
      "Заголовок",

    titlePlaceholder:
      "Например, уютная квартира в центре",

    description:
      "Описание",

    descriptionPlaceholder:
      "Опишите объект",

    price:
      "Цена",

    currency:
      "Валюта",

    address:
      "Адрес",

    addressPlaceholder:
      "Введите адрес",

    city:
      "Город",

    cityPlaceholder:
      "Выберите город",

    district:
      "Район",

    districtPlaceholder:
      "Введите район",

    type:
      "Тип объекта",

    rooms:
      "Комнаты",

    area:
      "Площадь, м²",

    floor:
      "Этаж",

    totalFloors:
      "Этажей в здании",

    furnished:
      "С мебелью",

    parking:
      "Парковка",

    pets:
      "Можно с животными",

    photos:
      "Фотографии",

    addPhoto:
      "Добавить фото",

    removePhoto:
      "Удалить фото",

    photoLimit:
      "Можно добавить до 10 фотографий.",

    location:
      "Местоположение",

    chooseLocation:
      "Указать на карте",

    locationSelected:
      "Местоположение выбрано",

    status:
      "Статус",

    statusDraft:
      "Черновик",

    statusPublished:
      "Опубликовано",

    statusPaused:
      "На паузе",

    statusArchived:
      "В архиве",

    createSuccess:
      "Объявление создано.",

    updateSuccess:
      "Объявление обновлено.",

    deleteSuccess:
      "Объявление удалено.",

    createError:
      "Не удалось создать объявление.",

    updateError:
      "Не удалось обновить объявление.",

    deleteError:
      "Не удалось удалить объявление.",

    required:
      "Обязательное поле",
  },

  listingPopup: {
    close:
      "Закрыть",

    favorite:
      "Добавить в избранное",

    unfavorite:
      "Убрать из избранного",

    rooms:
      "комн.",

    area:
      "м²",

    floor:
      "этаж",

    furnished:
      "С мебелью",

    parking:
      "Парковка",

    pets:
      "Животные",

    contacts:
      "Контакты",

    phone:
      "Телефон",

    telegram:
      "Telegram",

    whatsapp:
      "WhatsApp",

    contactsLoading:
      "Загрузка контактов...",

    contactsLoginRequired:
      "Войдите, чтобы увидеть контакты владельца.",

    contactsUnavailable:
      "Контакты недоступны.",

    login:
      "Войти",

    loginToSeeContacts:
      "Войдите, чтобы увидеть контакты.",

    noPhotos:
      "Фотографии отсутствуют.",

    previousPhoto:
      "Предыдущая фотография",

    nextPhoto:
      "Следующая фотография",

    notFound:
      "Объявление не найдено.",

    loading:
      "Загрузка объявления...",

    viewed:
      "Просмотрено",

    showMore:
      "Показать полностью",

    photo:
      "Фото",

    closeAria:
      "Закрыть объявление",

    favoriteAria:
      "Избранное",
  },

  map: {
    preparing:
      "Подготовка карты...",

    loading:
      "Загрузка объектов...",

    noListings:
      "В этой области объявлений нет.",

    zoomIn:
      "Приблизить",

    zoomOut:
      "Отдалить",

    resetView:
      "Вернуть исходный вид",
  },

  dialogs: {
    unsavedChanges:
      "Есть несохранённые изменения.",

    deleteConfirmation:
      "Удалить объявление?",

    deleteConfirmationDescription:
      "Это действие нельзя отменить.",

    confirmDelete:
      "Удалить",
  },
    myListings: {
    title:
      "Мои объявления",

    description:
      "Управление вашими объявлениями",

    countOne:
      "объявление",

    countFew:
      "объявления",

    countMany:
      "объявлений",

    all:
      "Все",

    loading:
      "Загружаем объявления…",

    loadingCities:
      "Загружаем города…",

    loadErrorTitle:
      "Не удалось загрузить объявления",

    loadErrorDescription:
      "Попробуйте ещё раз.",

    emptyTitle:
      "У вас пока нет объявлений",

    emptyFilteredTitle:
      "Нет объявлений со статусом",

    emptyDescription:
      "Здесь будут отображаться ваши объявления.",

    filteredOf:
      "из",

    premium:
      "Premium",

    propertyRental:
      "Аренда",

    propertyCommercial:
      "Коммерция",

    propertyLand:
      "Земля",

    propertyDaily:
      "Посуточно",
  },
};