import {
  supabase,
} from "./client";

export type ListingCapacityRole =
  | "user"
  | "realtor"
  | "admin"
  | string;

export interface ListingCapacity {
  role: ListingCapacityRole;
  base_limit: number | null;
  extra_limit: number;
  total_limit: number | null;
  published_count: number;
  remaining: number | null;
}

/**
 * Получает текущую квоту объявлений
 * для авторизованного пользователя.
 *
 * Источник истины — Supabase RPC:
 * get_my_listing_capacity()
 *
 * ВАЖНО:
 * Лимит на самом деле также enforced
 * серверным trigger при публикации.
 */
export async function getMyListingCapacity(): Promise<ListingCapacity> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized"
    );
  }

  /*
   * RPC появилась в БД отдельной миграцией.
   * Поэтому здесь намеренно используем локальный
   * runtime-ответ, пока generated Database types
   * не содержат эту функцию.
   */
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_my_listing_capacity" as never
    );

  if (error) {
    console.error(
      "[API] getMyListingCapacity error:",
      error
    );

    throw error;
  }

  if (
    !data ||
    typeof data !==
      "object"
  ) {
    throw new Error(
      "Invalid listing capacity response"
    );
  }

  const raw =
    data as Record<
      string,
      unknown
    >;

  return {
    role:
      typeof raw.role ===
      "string"
        ? raw.role
        : "user",

    base_limit:
      raw.base_limit ==
        null
        ? null
        : Number(
            raw.base_limit
          ),

    extra_limit:
      Number(
        raw.extra_limit ??
          0
      ),

    total_limit:
      raw.total_limit ==
        null
        ? null
        : Number(
            raw.total_limit
          ),

    published_count:
      Number(
        raw.published_count ??
          0
      ),

    remaining:
      raw.remaining ==
        null
        ? null
        : Number(
            raw.remaining
          ),
  };
}
