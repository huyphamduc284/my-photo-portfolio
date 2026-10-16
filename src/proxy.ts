import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const next = request.nextUrl.clone();
      next.pathname = "/login";
      return NextResponse.redirect(next);
    }
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/admin")) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    return NextResponse.redirect(next);
  }

  if (user && path === "/login") {
    const next = request.nextUrl.clone();
    next.pathname = "/admin";
    return NextResponse.redirect(next);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
