import { NextResponse } from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

export async function middleware(
  request: Request
) {
  const response =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader =
              request.headers.get(
                "cookie"
              );

            if (!cookieHeader) {
              return [];
            }

            return cookieHeader
              .split(";")
              .map((cookie) => {
                const index =
                  cookie.indexOf("=");

                if (index === -1) {
                  return null;
                }

                return {
                  name: cookie
                    .slice(0, index)
                    .trim(),
                  value: decodeURIComponent(
                    cookie
                      .slice(index + 1)
                      .trim()
                  ),
                };
              })
              .filter(
                (
                  cookie
                ): cookie is {
                  name: string;
                  value: string;
                } => cookie !== null
              );
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};