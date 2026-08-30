import type { Locale } from "./ru";

export const ky: Locale = {
  common: {
    from: "Баштап",
    to: "Чейин",
    any: "Каалаган",

    close: "Жабуу",
    cancel: "Жокко чыгаруу",
    save: "Сактоо",
    delete: "Өчүрүү",
    edit: "Өзгөртүү",
    back: "Артка",
    next: "Кийинки",
    previous: "Мурунку",
    loading: "Жүктөлүүдө...",
    retry: "Кайра аракет кылуу",
    search: "Издөө",
    clear: "Тазалоо",
    apply: "Колдонуу",
    reset: "Баштапкы абалга келтирүү",
    yes: "Ооба",
    no: "Жок",
    error: "Ката",
    success: "Даяр",
  },

  sidebar: {
    panelLabel:
      "JayMap каптал панели",

    expandPanel:
      "Панелди ачуу",

    collapsePanel:
      "Панелди жыйноо",

    mainSectionsAria:
      "Негизги бөлүмдөр",

    secondarySectionsAria:
      "Кошумча бөлүмдөр",

    loadingAria:
      "Бөлүм жүктөлүүдө",

    mainMenuTitle:
      "Башкы меню",

    backDefault:
      "Башкы",

    decreaseAria:
      "Азайтуу",

    increaseAria:
      "Көбөйтүү",

    sections: {
      rental:
        "Ижара",

      commercial:
        "Коммерция",

      land:
        "Жер тилкелери",

      daily:
        "Суткалык ижара",

      agencies:
        "Агенттиктер",

      favorites:
        "Тандалмалар",

      subscriptions:
        "Жазылуулар",

      history:
        "Тарых",

      layers:
        "Карта куралдары",

      settings:
        "Жөндөөлөр",

      profile:
        "Профиль",
    },

    validationError:
      "Чыпкалардын маанилерин текшериңиз.",
  },

  rental: {
    propertyType:
      "Турак жайдын түрү",

    apartment:
      "Батир",

    house:
      "Үй",

    room:
      "Бөлмө",

    price:
      "Баасы, сом/ай",

    rooms:
      "Бөлмөлөр",

    roomsCount:
      "Саны",

    area:
      "Аянты, м²",

    floor:
      "Кабат",

    furnished:
      "Эмерек менен",

    parking:
      "Унаа токтотуучу жай",

    pets:
      "Үй жаныбарлары менен",

    showListings:
      "Объекттерди көрсөтүү",
  },

  commercial: {
    purpose:
      "Максаты",

    office:
      "Кеңсе",

    retail:
      "Соода жайы",

    warehouse:
      "Кампа",

    production:
      "Өндүрүш",

    catering:
      "Коомдук тамактануу",

    buildingClass:
      "Имараттын классы",

    area:
      "Аянты, м²",

    rate:
      "Ставка, сом/м²/ай — чейин",

    ratePlaceholder:
      "Мисалы, 1200",

    separateEntrance:
      "Өзүнчө кире бериш",

    groundFloor:
      "Биринчи линия / 1-кабат",

    showListings:
      "Объекттерди көрсөтүү",
  },

  land: {
    landUse:
      "Жердин максаты",

    residential:
      "Жеке турак жай куруу",

    agricultural:
      "Айыл чарба",

    commercial:
      "Коммерция",

    area:
      "Аянты, сотых",

    utilities:
      "Коммуникациялар",

    electricity:
      "Электр энергиясы",

    water:
      "Суу",

    gas:
      "Газ",

    sewage:
      "Канализация",

    documents:
      "Документтер",

    ready:
      "Даяр",

    inProcess:
      "Процессте",

    showPlots:
      "Жер тилкелерин көрсөтүү",
  },

  daily: {
    dates:
      "Күндөр",

    guests:
      "Коноктор",

    guestsCount:
      "Коноктордун саны",

    hostRating:
      "Ээсинин рейтинги",

    instantBooking:
      "Дароо брондоо",

    instantBookingDesc:
      "Ээсинин ырастоосу талап кылынбайт",

    showOptions:
      "Варианттарды көрсөтүү",
  },

  agencies: {
    search:
      "Издөө",

    searchPlaceholder:
      "Агенттиктин аталышы",

    sort:
      "Иреттөө",

    byRating:
      "Рейтинг боюнча",

    byListings:
      "Объекттер боюнча",

    byName:
      "А–Я",

    specialization:
      "Адистешүүсү",

    rental:
      "Ижара",

    commercial:
      "Коммерция",

    land:
      "Жер",

    listingsSuffix:
      "объект",
  },

  favorites: {
    empty:
      "Картадагы каалаган объектти жүрөкчө менен белгилеңиз — ал бул жерде пайда болот.",

    add:
      "Тандалмаларга кошуу",

    remove:
      "Тандалмалардан алып салуу",

    authRequired:
      "Жарыяларды сактоо үчүн кириңиз.",

    loading:
      "Тандалмалар жаңыртылууда...",
  },

  history: {
    empty:
      "Сиз көргөн жарыялар бул жерде пайда болот.",

    title:
      "Тарых",
  },

  layers: {
    heatmap:
      "Баалардын жылуулук картасы",

    transit:
      "Коомдук транспорт",

    schools:
      "Мектептер жана бала бакчалар",

    boundaries:
      "Райондордун чек аралары",
  },

  settings: {
    theme:
      "Тема",

    themeDark:
      "Караңгы",

    themeLight:
      "Ачык",

    themeCustom:
      "Ыңгайлаштырылган",

    units:
      "Өлчөө бирдиктери",

    unitsMetric:
      "м² / сом",

    unitsImperial:
      "ft² / $",

    notifications:
      "Билдирмелер",
  },

  subscriptions: {
    description:
      "Сакталган чыпкаларыңызга ылайык келген жаңы объекттер пайда болгондо сизге билдиребиз.",

    newListings:
      "Жаңы жарыялар",

    priceDrops:
      "Баанын төмөндөшү",

    empty:
      "Азырынча сакталган жазылуулар жок.",
  },

  profile: {
    guest:
      "Конок",

    loginPrompt:
      "Тандалмаларды жана жазылууларды сактоо үчүн кириңиз",

    login:
      "Кирүү",

    title:
      "Профиль",

    displayName:
      "Аты-жөнү",

    email:
      "Email",

    phone:
      "Телефон",

    bio:
      "Өзүңүз жөнүндө",

    avatar:
      "Профиль сүрөтү",

    changeAvatar:
      "Сүрөттү өзгөртүү",

    removeAvatar:
      "Сүрөттү өчүрүү",

    saveChanges:
      "Өзгөртүүлөрдү сактоо",

    saved:
      "Өзгөртүүлөр сакталды.",

    saveError:
      "Өзгөртүүлөрдү сактоо мүмкүн болгон жок.",

    description:
      "Атыңызды жана байланыш маалыматтарыңызды өзгөртүңүз.",

    avatarHint:
      "JPG, PNG же WebP · 5 МБ чейин",

    removeSelectedAvatar:
      "Тандалган сүрөттү алып салуу",

    deletePhoto:
      "Сүрөттү өчүрүү",

    deleting:
      "Өчүрүлүүдө...",

    photoTypeError:
      "JPG, PNG жана WebP гана колдоого алынат.",

    photoSizeError:
      "Сүрөттүн көлөмү 5 МБдан ашпашы керек.",

    avatarDeleteError:
      "Сүрөт өчүрүлгөн жок. Кайра аракет кылыңыз.",

    nameRequired:
      "Атыңызды жазыңыз.",

    nameTooShort:
      "Аты-жөнү кеминде 2 белгиден турушу керек.",

    nameTooLong:
      "Аты-жөнү өтө узун.",

    profileSaveError:
      "Профиль сакталган жок. Кайра аракет кылыңыз.",

    savedMessage:
      "Профиль сакталды.",

    yourName:
      "Атыңыз",

    saveLoading:
      "Сакталууда...",
  },

  navbar: {
    login:
      "Кирүү",

    logout:
      "Чыгуу",

    post:
      "Жарыя берүү",

    search:
      "Шаарды тандаңыз",

    searchPlaceholder:
      "Шаарды тандаңыз...",

    profile:
      "Профиль",
  },

  auth: {
    title:
      "JayMap'ка кирүү",

    description:
      "Байланыш маалыматтарын көрүү, жарыяларды сактоо жана өзүңүздүн объекттериңизди жайгаштыруу үчүн кириңиз.",

    close:
      "Жабуу",

    google:
      "Google менен улантуу",

    googleLoading:
      "Туташуу...",

    divider:
      "же",

    phoneTitle:
      "Телефон номери менен кирүү",

    phoneDescription:
      "SMS аркылуу авторизация кийинчерээк жеткиликтүү болот.",

    phoneComingSoon:
      "Бул функция азырынча жеткиликтүү эмес.",

    cancel:
      "Жокко чыгаруу",

    terms:
      "Улантуу менен JayMap колдонуу эрежелерине макул болосуз.",

    errorGoogle:
      "Google'ду ачуу мүмкүн болгон жок. Кайра аракет кылыңыз.",
  },

  listings: {
    title:
      "Жарыя",

    create:
      "Жарыя берүү",

    edit:
      "Жарыяны өзгөртүү",

    publish:
      "Жарыялоо",

    saveDraft:
      "Караламаны сактоо",

    delete:
      "Жарыяны өчүрүү",

    close:
      "Жабуу",

    noListings:
      "Азырынча жарыялар жок.",

    myListings:
      "Менин жарыяларым",

    titleField:
      "Аталышы",

    titlePlaceholder:
      "Мисалы, борбордогу жайлуу батир",

    description:
      "Сүрөттөмө",

    descriptionPlaceholder:
      "Объектти сүрөттөп бериңиз",

    price:
      "Баасы",

    currency:
      "Валюта",

    address:
      "Дарек",

    addressPlaceholder:
      "Даректи киргизиңиз",

    city:
      "Шаар",

    cityPlaceholder:
      "Шаарды тандаңыз",

    district:
      "Район",

    districtPlaceholder:
      "Районду киргизиңиз",

    type:
      "Объекттин түрү",

    rooms:
      "Бөлмөлөр",

    area:
      "Аянты, м²",

    floor:
      "Кабат",

    totalFloors:
      "Имараттагы кабаттардын саны",

    furnished:
      "Эмерек менен",

    parking:
      "Унаа токтотуучу жай",

    pets:
      "Үй жаныбарлары менен",

    photos:
      "Сүрөттөр",

    addPhoto:
      "Сүрөт кошуу",

    removePhoto:
      "Сүрөттү өчүрүү",

    photoLimit:
      "10 сүрөткө чейин кошсоңуз болот.",

    location:
      "Жайгашкан жери",

    chooseLocation:
      "Картадан көрсөтүү",

    locationSelected:
      "Жайгашкан жери тандалды",

    status:
      "Статус",

    statusDraft:
      "Каралама",

    statusPublished:
      "Жарыяланды",

    statusPaused:
      "Убактылуу токтотулду",

    statusArchived:
      "Архивде",

    createSuccess:
      "Жарыя түзүлдү.",

    updateSuccess:
      "Жарыя жаңыртылды.",

    deleteSuccess:
      "Жарыя өчүрүлдү.",

    createError:
      "Жарыя түзүлгөн жок.",

    updateError:
      "Жарыя жаңыртылган жок.",

    deleteError:
      "Жарыя өчүрүлгөн жок.",

    required:
      "Милдеттүү талаа",
  },

  listingPopup: {
    close:
      "Жабуу",

    favorite:
      "Тандалмаларга кошуу",

    unfavorite:
      "Тандалмалардан алып салуу",

    rooms:
      "бөлмө",

    area:
      "м²",

    floor:
      "кабат",

    furnished:
      "Эмерек менен",

    parking:
      "Унаа токтотуучу жай",

    pets:
      "Үй жаныбарлары менен",

    contacts:
      "Байланыш маалыматтары",

    phone:
      "Телефон",

    telegram:
      "Telegram",

    whatsapp:
      "WhatsApp",

    contactsLoading:
      "Байланыш маалыматтары жүктөлүүдө...",

    contactsLoginRequired:
      "Ээсинин байланыш маалыматтарын көрүү үчүн кириңиз.",

    contactsUnavailable:
      "Байланыш маалыматтары жеткиликтүү эмес.",

    login:
      "Кирүү",

    loginToSeeContacts:
      "Байланыш маалыматтарын көрүү үчүн кириңиз.",

    noPhotos:
      "Сүрөттөр жок.",

    previousPhoto:
      "Мурунку сүрөт",

    nextPhoto:
      "Кийинки сүрөт",

    notFound:
      "Жарыя табылган жок.",

    loading:
      "Жарыя жүктөлүүдө...",

    viewed:
      "Көрүлдү",

    showMore:
      "Толук көрсөтүү",

    photo:
      "Сүрөт",

    closeAria:
      "Жарыяны жабуу",

    favoriteAria:
      "Тандалмалар",
  },

  map: {
    preparing:
      "Карта даярдалууда...",

    loading:
      "Объекттер жүктөлүүдө...",

    noListings:
      "Бул аймакта жарыялар жок.",

    zoomIn:
      "Жакындатуу",

    zoomOut:
      "Алыстатуу",

    resetView:
      "Баштапкы көрүнүшкө кайтуу",
  },

  dialogs: {
    unsavedChanges:
      "Сакталбаган өзгөртүүлөр бар.",

    deleteConfirmation:
      "Жарыяны өчүрүү керекпи?",

    deleteConfirmationDescription:
      "Бул аракетти кайра кайтарууга болбойт.",

    confirmDelete:
      "Өчүрүү",
  },

  myListings: {
    title:
      "Менин жарыяларым",

    description:
      "Жарыяларыңызды башкаруу",

    countOne:
      "жарыя",

    countFew:
      "жарыя",

    countMany:
      "жарыя",

    all:
      "Баары",

    loading:
      "Жарыялар жүктөлүүдө…",

    loadingCities:
      "Шаарлар жүктөлүүдө…",

    loadErrorTitle:
      "Жарыяларды жүктөө мүмкүн болгон жок",

    loadErrorDescription:
      "Кайра аракет кылыңыз.",

    emptyTitle:
      "Азырынча жарыяларыңыз жок",

    emptyFilteredTitle:
      "Бул статус боюнча жарыялар жок",

    emptyDescription:
      "Сиздин жарыяларыңыз бул жерде көрсөтүлөт.",

    filteredOf:
      "ичинен",

    premium:
      "Premium",

    propertyRental:
      "Ижара",

    propertyCommercial:
      "Коммерция",

    propertyLand:
      "Жер",

    propertyDaily:
      "Суткалык ижара",
  },
};