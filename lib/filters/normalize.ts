import type {
  ListingType,
  ListingsFilter,
} from "./types";

type WorkspaceValues = Record<string, unknown>;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseNumber(value: unknown): number | undefined {
  if (isBlank(value)) return undefined;

  const normalized = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseInteger(value: unknown): number | undefined {
  const parsed = parseNumber(value);

  if (parsed === undefined || !Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

function normalizeAny(value: unknown): string | undefined {
  if (isBlank(value)) return undefined;

  const normalized = String(value).trim().toLowerCase();

  if (
    normalized === "any" ||
    normalized === "all" ||
    normalized === "*" ||
    normalized === "любые" ||
    normalized === "любой"
  ) {
    return undefined;
  }

  return String(value).trim();
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const result = value
    .map((item) => String(item).trim())
    .filter(Boolean);

  return result.length > 0 ? result : undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  return value === true ? true : undefined;
}

/**
 * Normalizes Rental workspace state.
 */
function normalizeRental(
  values: WorkspaceValues
): ListingsFilter {
  const filter: ListingsFilter = {
    type: "rental",
  };

  const propertyType = normalizeAny(values.propertyType);

  if (propertyType) {
    filter.propertyType = propertyType;
  }

  const priceMin = parseNumber(values.priceMin);
  const priceMax = parseNumber(values.priceMax);

  if (priceMin !== undefined) filter.priceMin = priceMin;
  if (priceMax !== undefined) filter.priceMax = priceMax;

  const rooms = parseInteger(values.rooms);

  if (rooms !== undefined && rooms >= 0) {
    filter.rooms = rooms;
  }

  const areaMin = parseNumber(values.areaMin);
  const areaMax = parseNumber(values.areaMax);

  if (areaMin !== undefined) filter.areaMin = areaMin;
  if (areaMax !== undefined) filter.areaMax = areaMax;

  const floorMin = parseInteger(values.floorMin);
  const floorMax = parseInteger(values.floorMax);

  if (floorMin !== undefined && floorMin >= 0) {
    filter.floorMin = floorMin;
  }

  if (floorMax !== undefined && floorMax >= 0) {
    filter.floorMax = floorMax;
  }

  const furnished = normalizeBoolean(values.furnished);
  const parking = normalizeBoolean(values.parking);
  const pets = normalizeBoolean(values.pets);

  if (furnished !== undefined) filter.furnished = furnished;
  if (parking !== undefined) filter.parking = parking;
  if (pets !== undefined) filter.pets = pets;

  return filter;
}

/**
 * Normalizes Commercial workspace state.
 */
function normalizeCommercial(
  values: WorkspaceValues
): ListingsFilter {
  const filter: ListingsFilter = {
    type: "commercial",
  };

  const purpose = normalizeStringArray(values.purpose);

  if (purpose) {
    filter.purpose = purpose;
  }

  const areaMin = parseNumber(values.areaMin);
  const areaMax = parseNumber(values.areaMax);

  if (areaMin !== undefined) filter.areaMin = areaMin;
  if (areaMax !== undefined) filter.areaMax = areaMax;

  const ratePerSqmMax = parseNumber(values.ratePerSqm);

  if (ratePerSqmMax !== undefined) {
    filter.ratePerSqmMax = ratePerSqmMax;
  }

  const buildingClass = normalizeAny(values.buildingClass);

  if (buildingClass) {
    filter.buildingClass = buildingClass;
  }

  const separateEntrance = normalizeBoolean(values.separateEntrance);
  const groundFloor = normalizeBoolean(values.groundFloor);

  if (separateEntrance !== undefined) {
    filter.params = {
      ...(filter.params ?? {}),
      separate_entrance: separateEntrance,
    };
  }

  if (groundFloor !== undefined) {
    filter.params = {
      ...(filter.params ?? {}),
      ground_floor: groundFloor,
    };
  }

  return filter;
}

/**
 * Normalizes Land workspace state.
 *
 * UI uses sotkas.
 * Database listings.area uses square meters.
 *
 * 1 sotka = 100 m²
 */
function normalizeLand(
  values: WorkspaceValues
): ListingsFilter {
  const filter: ListingsFilter = {
    type: "land",
  };

  const landUse = normalizeAny(values.landUse);

  if (landUse) {
    filter.landUse = landUse;
  }

  const areaSotMin = parseNumber(values.areaSotMin);
  const areaSotMax = parseNumber(values.areaSotMax);

  if (areaSotMin !== undefined) {
    filter.areaMin = areaSotMin * 100;
  }

  if (areaSotMax !== undefined) {
    filter.areaMax = areaSotMax * 100;
  }

  const utilities = normalizeStringArray(values.utilities);

  if (utilities) {
    filter.utilities = utilities;
  }

  const documentsReady = normalizeAny(values.documentsReady);

  if (documentsReady) {
    filter.documentsReady = documentsReady;
  }

  return filter;
}

/**
 * Normalizes Daily workspace state.
 *
 * Daily booking/availability is not part of the current listings RPC
 * yet. We intentionally normalize only values that have a clear
 * representation in the canonical filter contract.
 *
 * Backend support will be added separately.
 */
function normalizeDaily(
  values: WorkspaceValues
): ListingsFilter {
  return {
    type: "daily",
    params: {
      ...(isBlank(values.checkIn)
        ? {}
        : { check_in: String(values.checkIn).trim() }),
      ...(isBlank(values.checkOut)
        ? {}
        : { check_out: String(values.checkOut).trim() }),
      ...(parseInteger(values.guests) !== undefined
        ? { guests: parseInteger(values.guests) }
        : {}),
      ...(values.instantBooking === true
        ? { instant_booking: true }
        : {}),
      ...(normalizeAny(values.minRating)
        ? { min_rating: normalizeAny(values.minRating) }
        : {}),
    },
  };
}

/**
 * Normalizes a workspace's raw UI state into the single
 * canonical ListingsFilter contract.
 */
export function normalizeFilter(
  sectionId: string,
  values: WorkspaceValues
): ListingsFilter {
  switch (sectionId) {
    case "rental":
      return normalizeRental(values);

    case "commercial":
      return normalizeCommercial(values);

    case "land":
      return normalizeLand(values);

    case "daily":
      return normalizeDaily(values);

    default:
      return {};
  }
}

/**
 * Adds location context after the workspace filter itself
 * has already been normalized.
 */
export function withLocationFilter(
  filter: ListingsFilter,
  location: {
    cityId?: string;
    district?: string;
  }
): ListingsFilter {
  const result: ListingsFilter = {
    ...filter,
  };

  const cityId = normalizeAny(location.cityId);
  const district = normalizeAny(location.district);

  if (cityId) {
    result.cityId = cityId;
  }

  if (district) {
    result.district = district;
  }

  return result;
}

/**
 * Type guard for values that can safely represent a Sidebar
 * section type.
 */
export function isListingType(value: unknown): value is ListingType {
  return (
    value === "rental" ||
    value === "commercial" ||
    value === "land" ||
    value === "daily"
  );
}