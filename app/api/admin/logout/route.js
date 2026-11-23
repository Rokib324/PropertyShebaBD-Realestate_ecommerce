import { NextResponse } from "next/server";

/**
 * This legacy logout route is superseded by NextAuth signOut().
 * Use NextAuth's signOut() client function or /api/auth/signout instead.
 */

export async function POST() {
  return NextResponse.json(
    { success: false, message: "This endpoint is deprecated. Use NextAuth signOut() to log out." },
    { status: 410 }
  );
}
