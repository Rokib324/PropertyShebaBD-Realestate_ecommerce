import connectDB from "@/lib/config/db";
import AdminModel from "@/lib/models/AdminModel";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * POST /api/admin/register
 * Public endpoint — anyone can submit a registration request.
 * Account is created with isApproved: false and must be approved by super_admin.
 */
async function POST(request) {
  try {
    await connectDB();

    const { username, password, email } = await request.json();

    // Validate required fields
    if (!username || !password || !email) {
      return NextResponse.json(
        { success: false, message: "Username, password, and email are required." },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedEmail) {
      return NextResponse.json(
        { success: false, message: "Fields cannot be empty." },
        { status: 400 }
      );
    }

    // Email format
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format." },
        { status: 400 }
      );
    }

    // Password strength
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Duplicate check
    const existing = await AdminModel.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, "i") } },
        { email: trimmedEmail },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Username or email already taken." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(trimmedPassword);

    const admin = await AdminModel.create({
      username: trimmedUsername,
      password: hashedPassword,
      email: trimmedEmail,
      role: "admin",
      isActive: true,
      isApproved: false,       // ← must be approved by super_admin before login
      authProvider: "credentials",
    });

    console.log(`📋 New sub-admin registration (pending): ${admin.username} (${admin.email})`);

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful! Your account is pending approval from the super admin. You will be able to log in once approved.",
        pending: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Register error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Username or email already taken." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}

export { POST };
