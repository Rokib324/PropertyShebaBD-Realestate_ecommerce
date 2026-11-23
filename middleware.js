import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Helper: read NextAuth JWT
  const getAdminToken = () =>
    getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // ── Protect admin UI pages (not login/register) ───────────────
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    pathname !== "/admin/register"
  ) {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Revoked or unapproved session → kick out
    if (token.isActive === false || token.isApproved === false) {
      const response = NextResponse.redirect(
        new URL("/admin/login?error=AccessRevoked", request.url)
      );
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // Sub-admins page: super_admin only
    if (
      pathname.startsWith("/admin/sub-admins") &&
      token.role !== "super_admin"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // ── Protect admin API routes ──────────────────────────────────
  const publicAdminApis = [
    "/api/admin/login",     // kept for backward compat
    "/api/admin/logout",    // kept for backward compat
    "/api/admin/register",  // sub-admins self-register (open)
    "/api/auth",            // NextAuth catch-all
  ];

  const isPublicApi = publicAdminApis.some((p) => pathname.startsWith(p));

  if (pathname.startsWith("/api/admin") && !isPublicApi) {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // approve + transfer endpoints: super_admin only
    if (
      (pathname.startsWith("/api/admin/approve") ||
        pathname.startsWith("/api/admin/transfer-superadmin")) &&
      token.role !== "super_admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super admin access required.",
        },
        { status: 403 }
      );
    }
  }

  // ── Protect data-write API routes ─────────────────────────────
  const protectedApiRoutes = [
    "/api/property",
    "/api/land",
    "/api/interior",
    "/api/marble",
    "/api/sanitary",
    "/api/slider",
  ];

  const isProtectedRoute = protectedApiRoutes.some((r) =>
    pathname.startsWith(r)
  );

  if (
    isProtectedRoute &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    const token = await getAdminToken();

    if (!token || token.isActive === false || token.isApproved === false) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/auth/:path*",
    "/api/property/:path*",
    "/api/land/:path*",
    "/api/interior/:path*",
    "/api/marble/:path*",
    "/api/sanitary/:path*",
    "/api/slider/:path*",
  ],
};
