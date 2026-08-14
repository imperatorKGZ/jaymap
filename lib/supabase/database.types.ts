/**
 * lib/supabase/database.types.ts
 * ------------------------------------------------------------
 * ЗАГЛУШКА — замените на сгенерированные типы.
 *
 * Генерация:
 *   npx supabase gen types typescript \
 *     --project-id YOUR_PROJECT_ID \
 *     --schema public > lib/supabase/database.types.ts
 *
 * Или через Supabase CLI:
 *   supabase login
 *   supabase gen types typescript --linked > lib/supabase/database.types.ts
 * ------------------------------------------------------------
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          type: "rental" | "commercial" | "land" | "daily";
          price: number;
          currency: string;
          rooms: number | null;
          area: number | null;
          floor: number | null;
          total_floors: number | null;
          furnished: boolean;
          parking: boolean;
          pets: boolean;
          purpose: string | null;
          city_id: string | null;
          district: string | null;
          address: string | null;
          coordinates: unknown; // geography(point)
          title: string;
          description: string | null;
          phone: string | null;
          telegram: string | null;
          whatsapp: string | null;
          photos: string[];
          user_id: string | null;
          is_active: boolean;
          is_premium: boolean;
          params: Json;
          search_vector: unknown | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["listings"]["Row"],
          "id" | "created_at" | "updated_at" | "search_vector"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      cities: {
        Row: {
          id: string;
          name: string;
          name_ru: string | null;
          name_ky: string | null;
          coordinates: unknown;
          population: number | null;
          rank: number | null;
          region: string | null;
          min_zoom: number | null;
        };
        Insert: Database["public"]["Tables"]["cities"]["Row"];
        Update: Partial<Database["public"]["Tables"]["cities"]["Row"]>;
      };
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["favorites"]["Row"];
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_listings_geojson: {
        Args: {
          p_west?: number;
          p_south?: number;
          p_east?: number;
          p_north?: number;
          p_type?: string;
          p_city_id?: string;
          p_price_min?: number;
          p_price_max?: number;
          p_rooms?: number;
          p_area_min?: number;
          p_area_max?: number;
          p_furnished?: boolean;
          p_parking?: boolean;
          p_pets?: boolean;
          p_params?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
