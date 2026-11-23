import connectDB from "@/lib/config/db";
import AdminModel from "@/lib/models/AdminModel";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

/**
 * POST /api/admin/transfer-superadmin
 * Transfer the super_admin role to another approved admin.
 * - Only the current super_admin can call this.
 * - The old super_admin is downgraded to 'admin'.
 * - Both writes happen in a single atomic transaction.
 * Body: { targetAdminId: string }
 */
async function POST(request) {
  try {
    // ── Auth check ────────────────────────────────────────────────
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only super admin can transfer this role." },
        { status: 403 }
      );
    }

    const { targetAdminId } = await request.json();

    if (!targetAdminId) {
      return NextResponse.json(
        { success: false, message: "targetAdminId is required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(targetAdminId)) {
      return NextResponse.json(
        { success: false, message: "Invalid targetAdminId format." },
        { status: 400 }
      );
    }

    await connectDB();

    // Find target — must be approved, active, and not already super_admin
    const target = await AdminModel.findById(targetAdminId);

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Target admin not found." },
        { status: 404 }
      );
    }

    if (!target.isApproved || !target.isActive) {
      return NextResponse.json(
        { success: false, message: "Target admin must be approved and active." },
        { status: 400 }
      );
    }

    if (target.role === "super_admin") {
      return NextResponse.json(
        { success: false, message: "Target is already the super admin." },
        { status: 400 }
      );
    }

    // Find current super_admin from DB (use token email as source of truth)
    const currentSuperAdmin = await AdminModel.findOne({
      email: token.email,
      role: "super_admin",
    });

    if (!currentSuperAdmin) {
      return NextResponse.json(
        { success: false, message: "Current super admin record not found." },
        { status: 404 }
      );
    }

    // ── Atomic transaction: swap roles ────────────────────────────
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Promote target to super_admin
      await AdminModel.findByIdAndUpdate(
        targetAdminId,
        { role: "super_admin" },
        { session }
      );

      // Demote current super_admin to admin
      await AdminModel.findByIdAndUpdate(
        currentSuperAdmin._id,
        { role: "admin" },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

    console.log(
      `✅ Super admin transferred: ${currentSuperAdmin.email} → ${target.email}`
    );

    return NextResponse.json({
      success: true,
      message: `Super admin role successfully transferred to ${target.username}. Please log out and have them log in.`,
      newSuperAdmin: {
        id: target._id,
        username: target.username,
        email: target.email,
      },
    });
  } catch (error) {
    console.error("❌ Transfer super admin error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during transfer." },
      { status: 500 }
    );
  }
}

export { POST };
