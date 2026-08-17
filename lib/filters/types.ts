/**
 * Canonical filter contract for JayMap.
 *
 * This type is the single contract between:
 * Sidebar → page state → MainMap → Supabase API.
 *
 * The map viewport is optional here because it is injected by MainMap
 * immediately before requesting GeoJSON data.
 */

export type ListingType =
  | "rental"
  | "commercial"
  | "land"
  | "daily";

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ListingsFilter {
  /**
   * Current map viewport.
   * MainMap injects this before calling the API.
   */
  bounds?: MapBounds;

  /**
   * Main application mode.
   */
  type?: ListingType;

  /**
   * Location filters.
   */
  cityId?: string;
  district?: string;

  /**
   * Common numeric filters.
   */
  priceMin?: number;
  priceMax?: number;

  rooms?: number;

  areaMin?: number;
  areaMax?: number;

  floorMin?: number;
  floorMax?: number;

  totalFloorsMin?: number;
  totalFloorsMax?: number;

  /**
   * Common boolean filters.
   */
  furnished?: boolean;
  parking?: boolean;
  pets?: boolean;

  /**
   * Rental / commercial / land specific filters.
   */
  propertyType?: string;

  purpose?: string[];

  buildingClass?: string;

  ratePerSqmMax?: number;

  landUse?: string;

  utilities?: string[];

  documentsReady?: string;

  /**
   * Additional exact JSONB filters.
   *
   * This is intentionally generic so that rare/extended
   * listing attributes can live in listings.params without
   * polluting the main filter contract.
   */
  params?: Record<string, unknown>;
}