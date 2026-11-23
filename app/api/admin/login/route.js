import { NextResponse } from "next/server";

/**
 * This legacy login route is superseded by NextAuth.
 * All login is now handled via /api/auth/[...nextauth] (NextAuth v4).
 * These endpoints return 410 Gone to prevent accidental use of the old system.
 */

export async function POST() {
  return NextResponse.json(
    { success: false, message: "This endpoint is deprecated. Use /api/auth/signin via NextAuth." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "This endpoint is deprecated. Use /api/auth/session to check auth status." },
    { status: 410 }
  );
}
