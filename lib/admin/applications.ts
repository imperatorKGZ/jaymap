import {
  supabase,
} from "@/lib/supabase/client";

export type AdminApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface AdminRealtorApplication {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  agency_name: string | null;
  social_url: string | null;
  photo_url: string;
  status: AdminApplicationStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export async function getAdminRealtorApplications(
  status: AdminApplicationStatus = "pending"
): Promise<AdminRealtorApplication[]> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_admin_realtor_applications",
    {
      p_status:
        status,
    }
  );

  if (error) {
    console.error(
      "[Admin] Failed to load realtor applications:",
      error
    );

    throw error;
  }

  return (
    (data ??
      []) as AdminRealtorApplication[]
  );
}

export async function approveRealtorApplication(
  applicationId: string
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "approve_realtor_application",
    {
      p_application_id:
        applicationId,
    }
  );

  if (error) {
    console.error(
      "[Admin] Failed to approve realtor application:",
      error
    );

    throw error;
  }

  return data;
}

export async function rejectRealtorApplication(
  applicationId: string
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "reject_realtor_application",
    {
      p_application_id:
        applicationId,
    }
  );

  if (error) {
    console.error(
      "[Admin] Failed to reject realtor application:",
      error
    );

    throw error;
  }

  return data;
}
