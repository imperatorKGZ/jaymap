import {
  supabase,
} from "@/lib/supabase/client";

export interface AdminDashboardStats {
  users: number;
  listings: number;
  active_listings: number;
  realtors: number;
  pending_realtor_applications: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_admin_dashboard_stats"
  );

  if (error) {
    console.error(
      "[Admin] Failed to load dashboard statistics:",
      error
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      "Admin dashboard statistics returned no data."
    );
  }

  return {
    users:
      Number(
        data.users
      ),

    listings:
      Number(
        data.listings
      ),

    active_listings:
      Number(
        data.active_listings
      ),

    realtors:
      Number(
        data.realtors
      ),

    pending_realtor_applications:
      Number(
        data.pending_realtor_applications
      ),
  };
}
