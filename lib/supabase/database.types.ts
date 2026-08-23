/**
 * lib/supabase/database.types.ts
 *
 * Типы текущей публичной схемы JayMap.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]:
        | Json
        | undefined;
    }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;

          contact_phone: string | null;
          contact_email: string | null;

          bio: string | null;

          role:
            | "user"
            | "realtor"
            | "admin";

          verification_status:
            | "unverified"
            | "pending"
            | "verified"
            | "rejected";

          onboarding_completed: boolean;

          created_at: string;
          updated_at: string;
        };

        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;

          contact_phone?: string | null;
          contact_email?: string | null;

          bio?: string | null;

          role?:
            | "user"
            | "realtor"
            | "admin";

          verification_status?:
            | "unverified"
            | "pending"
            | "verified"
            | "rejected";

          onboarding_completed?: boolean;

          created_at?: string;
          updated_at?: string;
        };

        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;

          contact_phone?: string | null;
          contact_email?: string | null;

          bio?: string | null;

          role?:
            | "user"
            | "realtor"
            | "admin";

          verification_status?:
            | "unverified"
            | "pending"
            | "verified"
            | "rejected";

          onboarding_completed?: boolean;

          created_at?: string;
          updated_at?: string;
        };
      };

      listings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;

          type:
            | "rental"
            | "commercial"
            | "land"
            | "daily";

          status:
            | "draft"
            | "published"
            | "paused"
            | "archived";

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

          coordinates: unknown;

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

          search_vector:
            | unknown
            | null;
        };

        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;

          type:
            | "rental"
            | "commercial"
            | "land"
            | "daily";

          status?:
            | "draft"
            | "published"
            | "paused"
            | "archived";

          price: number;
          currency?: string;

          rooms?: number | null;
          area?: number | null;
          floor?: number | null;
          total_floors?: number | null;

          furnished?: boolean;
          parking?: boolean;
          pets?: boolean;

          purpose?: string | null;

          city_id?: string | null;
          district?: string | null;
          address?: string | null;

          coordinates: unknown;

          title: string;
          description?: string | null;

          phone?: string | null;
          telegram?: string | null;
          whatsapp?: string | null;

          photos?: string[];

          user_id?: string | null;

          is_active?: boolean;
          is_premium?: boolean;

          params?: Json;
        };

        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;

          type?:
            | "rental"
            | "commercial"
            | "land"
            | "daily";

          status?:
            | "draft"
            | "published"
            | "paused"
            | "archived";

          price?: number;
          currency?: string;

          rooms?: number | null;
          area?: number | null;
          floor?: number | null;
          total_floors?: number | null;

          furnished?: boolean;
          parking?: boolean;
          pets?: boolean;

          purpose?: string | null;

          city_id?: string | null;
          district?: string | null;
          address?: string | null;

          coordinates?: unknown;

          title?: string;
          description?: string | null;

          phone?: string | null;
          telegram?: string | null;
          whatsapp?: string | null;

          photos?: string[];

          user_id?: string | null;

          is_active?: boolean;
          is_premium?: boolean;

          params?: Json;
        };
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

        Insert: {
          id: string;
          name: string;

          name_ru?: string | null;
          name_ky?: string | null;

          coordinates: unknown;

          population?: number | null;
          rank?: number | null;
          region?: string | null;
          min_zoom?: number | null;
        };

        Update: {
          id?: string;
          name?: string;

          name_ru?: string | null;
          name_ky?: string | null;

          coordinates?: unknown;

          population?: number | null;
          rank?: number | null;
          region?: string | null;
          min_zoom?: number | null;
        };
      };

      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };

        Insert: {
          user_id: string;
          listing_id: string;
          created_at?: string;
        };

        Update: {
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
      };
    };

    Views: Record<
      string,
      never
    >;

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

      get_public_listing: {
        Args: {
          p_listing_id: string;
        };

        Returns: Json;
      };

      get_listing_contacts: {
        Args: {
          p_listing_id: string;
        };

        Returns: Json;
      };
    };

    Enums: Record<
      string,
      never
    >;

    CompositeTypes: Record<
      string,
      never
    >;
  };
}