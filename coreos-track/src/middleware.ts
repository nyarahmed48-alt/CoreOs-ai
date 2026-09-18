import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

/**
 * First line of defence: is there a valid session at all?
 *
 * Approval is deliberately *not* decided here. The session cookie carries
 * identity only, so approving or revoking a member takes effect immediately —
 * the app layout, the /pending page and every API handler read role and status
 * straight from the database.
 */
const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/register", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API.includes(pathname)) return NextResponse.next();

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  if (!session) {
    if (isPublicPage) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Signed in: keep them off the auth pages.
  if (isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/entries";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
