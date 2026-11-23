import connectDB from "@/lib/config/db";
import AdminModel from "@/lib/models/AdminModel";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Helper: get the authenticated super_admin from the NextAuth JWT
const getSuperAdmin = async (request) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "super_admin") return null;
  return token;
};

/**
 * GET /api/admin/approve
 * List all pending + approved sub-admins (super_admin only)
 */
async function GET(request) {
  try {
    const caller = await getSuperAdmin(request);
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super admin access required." },
        { status: 403 }
      );
    }

    await connectDB();

    const admins = await AdminModel.find(
      { role: { $ne: "super_admin" } },
      { password: 0 }
    ).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("❌ List admins error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/approve
 * Approve or revoke a sub-admin (super_admin only)
 * Body: { adminId, action: "approve" | "revoke" }
 */
async function PATCH(request) {
  try {
    const caller = await getSuperAdmin(request);
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super admin access required." },
        { status: 403 }
      );
    }

    const { adminId, action } = await request.json();

    if (!adminId || !["approve", "revoke"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "adminId and action ('approve' or 'revoke') are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const target = await AdminModel.findById(adminId);
    if (!target) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    // Cannot revoke/modify the super_admin via this endpoint
    if (target.role === "super_admin") {
      return NextResponse.json(
        { success: false, message: "Cannot modify super admin via this endpoint." },
        { status: 403 }
      );
    }

    if (action === "approve") {
      await AdminModel.findByIdAndUpdate(adminId, {
        isApproved: true,
        isActive: true,
      });
      return NextResponse.json({
        success: true,
        message: `${target.username} has been approved and can now log in.`,
      });
    }

    if (action === "revoke") {
      await AdminModel.findByIdAndUpdate(adminId, {
        isApproved: false,
        isActive: false,
      });
      return NextResponse.json({
        success: true,
        message: `${target.username}'s access has been revoked.`,
      });
    }
  } catch (error) {
    console.error("❌ Approve/revoke error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/approve?adminId=...
 * Permanently delete a sub-admin account (super_admin only)
 */
async function DELETE(request) {
  try {
    const caller = await getSuperAdmin(request);
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "adminId is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const target = await AdminModel.findById(adminId);
    if (!target) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    if (target.role === "super_admin") {
      return NextResponse.json(
        { success: false, message: "Cannot delete the super admin account." },
        { status: 403 }
      );
    }

    await AdminModel.findByIdAndDelete(adminId);

    return NextResponse.json({
      success: true,
      message: `${target.username} has been permanently deleted.`,
    });
  } catch (error) {
    console.error("❌ Delete admin error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export { GET, PATCH, DELETE };
