/**
 * en.ts — English translations.
 *
 * Implements the `Locale` interface declared in `ru.ts`.
 * TypeScript will fail to compile if a key is missing
 * or misspelled here.
 */

import type { Locale } from "./ru";

export const en: Locale = {
  common: {
    from: "From",
    to: "To",
    any: "Any",

    close: "Close",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    previous: "Previous",
    loading: "Loading...",
    retry: "Retry",
    search: "Search",
    clear: "Clear",
    apply: "Apply",
    reset: "Reset",
    yes: "Yes",
    no: "No",
    error: "Error",
    success: "Done",
  },

  sidebar: {
    panelLabel:
      "JayMap sidebar",

    expandPanel:
      "Expand panel",

    collapsePanel:
      "Collapse panel",

    mainSectionsAria:
      "Main sections",

    secondarySectionsAria:
      "Secondary sections",

    loadingAria:
      "Loading section",

    mainMenuTitle:
      "Main menu",

    backDefault:
      "Main",

    decreaseAria:
      "Decrease",

    increaseAria:
      "Increase",

    sections: {
      rental:
        "Rentals",

      commercial:
        "Commercial",

      land:
        "Land plots",

      daily:
        "Daily rentals",

      agencies:
        "Agencies",

      favorites:
        "Favorites",

      subscriptions:
        "Subscriptions",

      history:
        "History",

      layers:
        "Map tools",

      settings:
        "Settings",

      profile:
        "Profile",
    },

    validationError:
      "Please check the filter values.",
  },

  rental: {
    propertyType:
      "Property type",

    apartment:
      "Apartment",

    house:
      "House",

    room:
      "Room",

    price:
      "Price, som/mo",

    rooms:
      "Rooms",

    roomsCount:
      "Number",

    area:
      "Area, m²",

    floor:
      "Floor",

    furnished:
      "Furnished",

    parking:
      "Parking",

    pets:
      "Pets allowed",

    showListings:
      "Show listings",
  },

  commercial: {
    purpose:
      "Purpose",

    office:
      "Office",

    retail:
      "Retail",

    warehouse:
      "Warehouse",

    production:
      "Production",

    catering:
      "Catering",

    buildingClass:
      "Building class",

    area:
      "Area, m²",

    rate:
      "Rate, som per m²/mo — up to",

    ratePlaceholder:
      "e.g. 1200",

    separateEntrance:
      "Separate entrance",

    groundFloor:
      "Street front / 1st floor",

    showListings:
      "Show listings",
  },

  land: {
    landUse:
      "Land use",

    residential:
      "Residential",

    agricultural:
      "Agricultural",

    commercial:
      "Commercial",

    area:
      "Area, sotka",

    utilities:
      "Utilities",

    electricity:
      "Electricity",

    water:
      "Water",

    gas:
      "Gas",

    sewage:
      "Sewage",

    documents:
      "Documents",

    ready:
      "Ready",

    inProcess:
      "In progress",

    showPlots:
      "Show plots",
  },

  daily: {
    dates:
      "Dates",

    guests:
      "Guests",

    guestsCount:
      "Number of guests",

    hostRating:
      "Host rating",

    instantBooking:
      "Instant booking",

    instantBookingDesc:
      "No host confirmation needed",

    showOptions:
      "Show options",
  },

  agencies: {
    search:
      "Search",

    searchPlaceholder:
      "Agency name",

    sort:
      "Sort by",

    byRating:
      "Rating",

    byListings:
      "Listings",

    byName:
      "A–Z",

    specialization:
      "Specialization",

    rental:
      "Rentals",

    commercial:
      "Commercial",

    land:
      "Land",

    listingsSuffix:
      "listings",
  },

  favorites: {
    empty:
      "Tap the heart on any listing on the map — it will show up here.",

    add:
      "Add to favorites",

    remove:
      "Remove from favorites",

    authRequired:
      "Sign in to save listings.",

    loading:
      "Updating favorites...",
  },

  history: {
    empty:
      "Listings you view will appear here.",

    title:
      "History",
  },

  layers: {
    heatmap:
      "Price heatmap",

    transit:
      "Public transit",

    schools:
      "Schools & kindergartens",

    boundaries:
      "District boundaries",
  },

  settings: {
    theme:
      "Theme",

    themeDark:
      "Dark",

    themeLight:
      "Light",

    themeCustom:
      "Custom",

    units:
      "Units",

    unitsMetric:
      "m² / som",

    unitsImperial:
      "ft² / $",

    notifications:
      "Notifications",
  },

  subscriptions: {
    description:
      "We'll notify you when matching listings appear for your saved filters.",

    newListings:
      "New listings",

    priceDrops:
      "Price drops",

    empty:
      "You don't have any saved subscriptions yet.",
  },

  profile: {
    guest:
      "Guest",

    loginPrompt:
      "Sign in to save favorites and subscriptions",

    login:
      "Sign in",

    title:
      "Profile",

    displayName:
      "Name",

    email:
      "Email",

    phone:
      "Phone",

    bio:
      "About",

    avatar:
      "Profile photo",

    changeAvatar:
      "Change photo",

    removeAvatar:
      "Remove photo",

    saveChanges:
      "Save changes",

    saved:
      "Changes saved.",

    saveError:
      "Failed to save changes.",

    description:
      "Edit your name and contact details.",

    avatarHint:
      "JPG, PNG or WebP · up to 5 MB",

    removeSelectedAvatar:
      "Remove selected photo",

    deletePhoto:
      "Delete photo",

    deleting:
      "Deleting...",

    photoTypeError:
      "Only JPG, PNG and WebP are supported.",

    photoSizeError:
      "The image size must not exceed 5 MB.",

    avatarDeleteError:
      "Failed to delete photo. Please try again.",

    nameRequired:
      "Enter your name.",

    nameTooShort:
      "Name must contain at least 2 characters.",

    nameTooLong:
      "Name is too long.",

    profileSaveError:
      "Failed to save profile. Please try again.",

    savedMessage:
      "Profile saved.",

    yourName:
      "Your name",

    saveLoading:
      "Saving...",
  },

  navbar: {
    login:
      "Sign in",

    logout:
      "Sign out",

    post:
      "Post",

    search:
      "Choose a city",

    searchPlaceholder:
      "Choose a city...",

    profile:
      "Profile",
  },

  auth: {
    title:
      "Sign in to JayMap",

    description:
      "Sign in to see contacts, save listings, and post your own properties.",

    close:
      "Close",

    google:
      "Continue with Google",

    googleLoading:
      "Connecting...",

    divider:
      "or",

    phoneTitle:
      "Sign in with phone number",

    phoneDescription:
      "SMS authentication will be available later.",

    phoneComingSoon:
      "This feature is not available yet.",

    cancel:
      "Cancel",

    terms:
      "By continuing, you agree to the JayMap terms of use.",

    errorGoogle:
      "Could not open Google. Please try again.",
  },

  listings: {
    title:
      "Listing",

    create:
      "Post a listing",

    edit:
      "Edit listing",

    publish:
      "Publish",

    saveDraft:
      "Save draft",

    delete:
      "Delete listing",

    close:
      "Close",

    noListings:
      "There are no listings yet.",

    myListings:
      "My listings",

    titleField:
      "Title",

    titlePlaceholder:
      "For example, cozy apartment in the city center",

    description:
      "Description",

    descriptionPlaceholder:
      "Describe the property",

    price:
      "Price",

    currency:
      "Currency",

    address:
      "Address",

    addressPlaceholder:
      "Enter address",

    city:
      "City",

    cityPlaceholder:
      "Choose a city",

    district:
      "District",

    districtPlaceholder:
      "Enter district",

    type:
      "Property type",

    rooms:
      "Rooms",

    area:
      "Area, m²",

    floor:
      "Floor",

    totalFloors:
      "Total floors",

    furnished:
      "Furnished",

    parking:
      "Parking",

    pets:
      "Pets allowed",

    photos:
      "Photos",

    addPhoto:
      "Add photo",

    removePhoto:
      "Remove photo",

    photoLimit:
      "You can add up to 10 photos.",

    location:
      "Location",

    chooseLocation:
      "Choose on map",

    locationSelected:
      "Location selected",

    status:
      "Status",

    statusDraft:
      "Draft",

    statusPublished:
      "Published",

    statusPaused:
      "Paused",

    statusArchived:
      "Archived",

    createSuccess:
      "Listing created.",

    updateSuccess:
      "Listing updated.",

    deleteSuccess:
      "Listing deleted.",

    createError:
      "Failed to create listing.",

    updateError:
      "Failed to update listing.",

    deleteError:
      "Failed to delete listing.",

    required:
      "Required field",
  },

  listingPopup: {
    close:
      "Close",

    favorite:
      "Add to favorites",

    unfavorite:
      "Remove from favorites",

    rooms:
      "rooms",

    area:
      "m²",

    floor:
      "floor",

    furnished:
      "Furnished",

    parking:
      "Parking",

    pets:
      "Pets allowed",

    contacts:
      "Contacts",

    phone:
      "Phone",

    telegram:
      "Telegram",

    whatsapp:
      "WhatsApp",

    contactsLoading:
      "Loading contacts...",

    contactsLoginRequired:
      "Sign in to see the owner's contacts.",

    contactsUnavailable:
      "Contacts unavailable.",

    login:
      "Sign in",

    loginToSeeContacts:
      "Sign in to see contacts.",

    noPhotos:
      "No photos available.",

    previousPhoto:
      "Previous photo",

    nextPhoto:
      "Next photo",

    notFound:
      "Listing not found.",

    loading:
      "Loading listing...",

    viewed:
      "Viewed",

    showMore:
      "Show full description",

    photo:
      "Photo",

    closeAria:
      "Close listing",

    favoriteAria:
      "Favorites",
  },

  map: {
    preparing:
      "Preparing map...",

    loading:
      "Loading listings...",

    noListings:
      "There are no listings in this area.",

    zoomIn:
      "Zoom in",

    zoomOut:
      "Zoom out",

    resetView:
      "Reset view",
  },

  dialogs: {
    unsavedChanges:
      "You have unsaved changes.",

    deleteConfirmation:
      "Delete listing?",

    deleteConfirmationDescription:
      "This action cannot be undone.",

    confirmDelete:
      "Delete",
  },

  myListings: {
    title:
      "My listings",

    description:
      "Manage your listings",

    countOne:
      "listing",

    countFew:
      "listings",

    countMany:
      "listings",

    all:
      "All",

    loading:
      "Loading listings…",

    loadingCities:
      "Loading cities…",

    loadErrorTitle:
      "Failed to load listings",

    loadErrorDescription:
      "Please try again.",

    emptyTitle:
      "You don't have any listings yet",

    emptyFilteredTitle:
      "No listings with status",

    emptyDescription:
      "Your listings will appear here.",

    filteredOf:
      "of",

    premium:
      "Premium",

    propertyRental:
      "Rentals",

    propertyCommercial:
      "Commercial",

    propertyLand:
      "Land",

    propertyDaily:
      "Daily rentals",
  },
};