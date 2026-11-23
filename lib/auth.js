import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./config/db";
import AdminModel from "./models/AdminModel";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────
    // Only the super_admin can sign in via Google.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ── Username + Password (sub-admins and admins) ───────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) return null;

          await connectDB();

          const admin = await AdminModel.findOne({
            username: {
              $regex: new RegExp(`^${credentials.username.trim()}$`, "i"),
            },
            isActive: true,
          });

          if (!admin) return null;

          // Must be approved by super_admin first
          if (!admin.isApproved) {
            throw new Error("PENDING_APPROVAL");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            admin.password
          );
          if (!isValid) return null;

          return {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.username,
            role: admin.role,
          };
        } catch (err) {
          if (err.message === "PENDING_APPROVAL") throw err;
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── Google sign-in gate ───────────────────────────────────────
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const userEmail = (user.email || "").trim().toLowerCase();
          const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "rakib4458@gmail.com").trim().toLowerCase();

          const existing = await AdminModel.findOne({ email: userEmail });

          if (existing) {
            // Auto-promote if designated super admin email
            if (userEmail === superAdminEmail && existing.role !== "super_admin") {
              existing.role = "super_admin";
              existing.isApproved = true;
              existing.isActive = true;
              await existing.save();
            }

            // Must be super_admin and active
            if (existing.role !== "super_admin") {
              return "/admin/login?error=NotSuperAdmin";
            }

            if (!existing.isActive) {
              return "/admin/login?error=AccessRevoked";
            }

            // Update googleId and approve if missing
            const updates = {};
            if (!existing.googleId && profile?.sub) updates.googleId = profile.sub;
            if (!existing.isApproved) updates.isApproved = true;
            if (Object.keys(updates).length > 0) {
              await AdminModel.findByIdAndUpdate(existing._id, updates);
            }

            return true;
          }

          // If no existing record in DB, allow if matching super admin email or no super_admin exists yet
          const superAdminCount = await AdminModel.countDocuments({ role: "super_admin" });
          if (userEmail === superAdminEmail || superAdminCount === 0) {
            const username = (user.name || userEmail.split("@")[0])
              .replace(/\s+/g, "_")
              .toLowerCase();
            await AdminModel.create({
              username,
              email: userEmail,
              password: "google-oauth-no-password",
              role: "super_admin",
              isActive: true,
              isApproved: true,
              authProvider: "google",
              googleId: profile?.sub || null,
            });
            return true;
          }

          // Google account not authorized as super_admin
          return "/admin/login?error=NotAuthorized";
        } catch (err) {
          console.error("Google sign-in error:", err);
          return "/admin/login?error=ServerError";
        }
      }
      return true;
    },

    // ── Enrich JWT with DB role ───────────────────────────────────
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update" || !token.role) {
        try {
          await connectDB();
          const emailToLookup = (user?.email || token?.email || "").trim().toLowerCase();
          if (emailToLookup) {
            const admin = await AdminModel.findOne(
              { email: emailToLookup },
              { _id: 1, role: 1, username: 1, isActive: 1, isApproved: 1 }
            );
            if (admin) {
              token.id = admin._id.toString();
              token.role = admin.role;
              token.username = admin.username;
              token.isActive = admin.isActive;
              token.isApproved = admin.isApproved;
            }
          }
        } catch (err) {
          console.error("JWT callback error:", err);
        }
      }
      return token;
    },

    // ── Expose role on the client session object ──────────────────
    async session({ session, token }) {
      if (token && session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.isActive = token.isActive;
        session.user.isApproved = token.isApproved;
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
