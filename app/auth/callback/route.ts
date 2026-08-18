import { NextResponse } from "next/server";

import {
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export async function GET(
  request: Request
) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code");

  const next =
    url.searchParams.get("next");

  const redirectPath =
    next &&
    next.startsWith("/")
      ? next
      : "/";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/?auth=error",
        url.origin
      )
    );
  }

  const supabase =
    await createSupabaseServerClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code
    );

  if (error) {
    console.error(
      "[Auth] callback error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/?auth=error",
        url.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      redirectPath,
      url.origin
    )
  );
}