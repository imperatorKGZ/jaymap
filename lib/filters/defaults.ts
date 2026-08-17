/**
 * Canonical default values for Sidebar workspaces.
 *
 * Эти значения относятся к UI/state-слою.
 * Они НЕ являются значениями, которые напрямую уходят в Supabase.
 *
 * Значения вроде "any", "" и null будут нормализованы
 * в lib/filters/normalize.ts перед отправкой в API.
 */

export type RentalWorkspaceDefaults = {
  propertyType: string;
  priceMin: string;
  priceMax: string;
  rooms: number | null;
  areaMin: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  furnished: boolean;
  parking: boolean;
  pets: boolean;
};

export const RENTAL_DEFAULTS: RentalWorkspaceDefaults = {
  propertyType: "any",
  priceMin: "",
  priceMax: "",
  rooms: null,
  areaMin: "",
  areaMax: "",
  floorMin: "",
  floorMax: "",
  furnished: false,
  parking: false,
  pets: false,
};

export type CommercialWorkspaceDefaults = {
  purpose: string[];
  areaMin: string;
  areaMax: string;
  ratePerSqm: string;
  buildingClass: string;
  separateEntrance: boolean;
  groundFloor: boolean;
};

export const COMMERCIAL_DEFAULTS: CommercialWorkspaceDefaults = {
  purpose: [],
  areaMin: "",
  areaMax: "",
  ratePerSqm: "",
  buildingClass: "any",
  separateEntrance: false,
  groundFloor: false,
};

export type LandWorkspaceDefaults = {
  landUse: string;
  areaSotMin: string;
  areaSotMax: string;
  utilities: string[];
  documentsReady: string;
};

export const LAND_DEFAULTS: LandWorkspaceDefaults = {
  landUse: "any",
  areaSotMin: "",
  areaSotMax: "",
  utilities: [],
  documentsReady: "any",
};

export type DailyWorkspaceDefaults = {
  checkIn: string;
  checkOut: string;
  guests: number;
  instantBooking: boolean;
  minRating: string;
};

export const DAILY_DEFAULTS: DailyWorkspaceDefaults = {
  checkIn: "",
  checkOut: "",
  guests: 2,
  instantBooking: false,
  minRating: "any",
};

export type AgenciesWorkspaceDefaults = {
  sortBy: string;
  specialization: string[];
  query: string;
};

export const AGENCIES_DEFAULTS: AgenciesWorkspaceDefaults = {
  sortBy: "rating",
  specialization: [],
  query: "",
};

export type LayersWorkspaceDefaults = {
  heatmap: boolean;
  transit: boolean;
  schools: boolean;
  boundaries: boolean;
};

export const LAYERS_DEFAULTS: LayersWorkspaceDefaults = {
  heatmap: false,
  transit: false,
  schools: false,
  boundaries: true,
};

export type SettingsWorkspaceDefaults = {
  theme: "dark" | "light" | "custom";
  units: string;
  notifications: boolean;
};

export const SETTINGS_DEFAULTS: SettingsWorkspaceDefaults = {
  theme: "dark",
  units: "metric",
  notifications: true,
};

/**
 * Registry used later by WorkspaceRenderer.
 *
 * Favorites, History and Profile do not have editable filter state,
 * therefore they intentionally receive an empty object.
 */
export const WORKSPACE_DEFAULTS: Record<
  string,
  Record<string, unknown>
> = {
  rental: RENTAL_DEFAULTS,
  commercial: COMMERCIAL_DEFAULTS,
  land: LAND_DEFAULTS,
  daily: DAILY_DEFAULTS,
  agencies: AGENCIES_DEFAULTS,
  layers: LAYERS_DEFAULTS,
  settings: SETTINGS_DEFAULTS,
  favorites: {},
  history: {},
  subscriptions: {},
  profile: {},
};