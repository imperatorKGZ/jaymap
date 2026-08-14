/**
 * lib/supabase/client.ts
 * ------------------------------------------------------------
 * Единственный Supabase-клиент для браузера.
 * Singleton — не создаём новый инстанс на каждый рендер.
 *
 * Использование:
 *   import { supabase } from "@/lib/supabase/client";
 *   const { data } = await supabase.from("listings").select("*");
 * ------------------------------------------------------------
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
