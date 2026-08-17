/**
 * Canonical UI keys used by Sidebar workspaces.
 *
 * These keys describe the shape of workspace state.
 * They are intentionally separated from ListingsFilter because
 * UI state can contain strings such as "" / "any" that are
 * normalized before reaching the API.
 */

export const WORKSPACE_KEYS = {
  RENTAL: {
    PROPERTY_TYPE: "propertyType",
    PRICE_MIN: "priceMin",
    PRICE_MAX: "priceMax",
    ROOMS: "rooms",
    AREA_MIN: "areaMin",
    AREA_MAX: "areaMax",
    FLOOR_MIN: "floorMin",
    FLOOR_MAX: "floorMax",
    FURNISHED: "furnished",
    PARKING: "parking",
    PETS: "pets",
  },

  COMMERCIAL: {
    PURPOSE: "purpose",
    AREA_MIN: "areaMin",
    AREA_MAX: "areaMax",
    RATE_PER_SQM: "ratePerSqm",
    BUILDING_CLASS: "buildingClass",
    SEPARATE_ENTRANCE: "separateEntrance",
    GROUND_FLOOR: "groundFloor",
  },

  LAND: {
    LAND_USE: "landUse",
    AREA_SOT_MIN: "areaSotMin",
    AREA_SOT_MAX: "areaSotMax",
    UTILITIES: "utilities",
    DOCUMENTS_READY: "documentsReady",
  },

  DAILY: {
    CHECK_IN: "checkIn",
    CHECK_OUT: "checkOut",
    GUESTS: "guests",
    INSTANT_BOOKING: "instantBooking",
    MIN_RATING: "minRating",
  },

  AGENCIES: {
    SORT_BY: "sortBy",
    SPECIALIZATION: "specialization",
    QUERY: "query",
  },

  LAYERS: {
    HEATMAP: "heatmap",
    TRANSIT: "transit",
    SCHOOLS: "schools",
    BOUNDARIES: "boundaries",
  },

  SETTINGS: {
    THEME: "theme",
    UNITS: "units",
    NOTIFICATIONS: "notifications",
  },
} as const;