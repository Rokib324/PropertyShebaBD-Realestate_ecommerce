"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { assets } from "@/assests/assets";
import { FaGoogle } from "react-icons/fa";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin");
    }
  }, [status, router]);

  // Show errors from NextAuth redirect
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    if (error === "NotSuperAdmin") {
      toast.error("Access denied. Only the super admin can log in with Google.");
    } else if (error === "NotAuthorized") {
      toast.error("Access denied. This Google account is not recognized as the super admin.");
    } else if (error === "ServerError") {
      toast.error("Database connection failed. Please check MongoDB Atlas Network Access and whitelist your current IP address.");
    } else if (error === "AccessRevoked") {
      toast.error("Your access has been revoked. Contact the super admin.");
    } else if (error === "CredentialsSignin") {
      toast.error("Invalid username or password, or account is pending approval.");
    } else if (error === "OAuthSignin") {
      toast.error("Error initiating Google sign-in. Check GOOGLE_CLIENT_ID & NEXTAUTH_SECRET in .env.");
    } else if (error === "OAuthCallback") {
      toast.error("Google callback failed. Verify authorized redirect URI in Google Console matches http://localhost:3000/api/auth/callback/google.");
    } else {
      toast.error(`Login error: ${error}`);
    }
  }, [searchParams]);

  // ── Google login (super admin only) ────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/admin" });
    } catch (err) {
      setIsGoogleLoading(false);
      toast.error("Failed to connect to Google.");
    }
  };

  // ── Credentials login (sub-admins) ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      setIsLoading(false);

      if (result?.ok) {
        toast.success("Login successful! Redirecting...");
        router.push("/admin");
      } else if (result?.error === "PENDING_APPROVAL") {
        toast.error("Your account is pending approval from the super admin.");
      } else {
        toast.error("Invalid username or password, or account not yet approved.");
      }
    } catch (err) {
      setIsLoading(false);
      toast.error("An error occurred during login.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Checking session...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image src={assets.logo} alt="Property Sheba BD" width={180} height={60} priority unoptimized />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
          <p className="text-gray-600">Access the Property Sheba BD admin panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">

          {/* ── Google login (Super Admin) ── */}
          <div>
            <p className="text-xs text-gray-500 text-center uppercase tracking-wide mb-3 font-semibold">
              Super Admin
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 hover:border-red-500 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-red-600" />
              ) : (
                <FaGoogle className="text-red-500 text-lg" />
              )}
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Only the registered super admin Gmail (rakib4458@gmail.com) can access via Google.
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* ── Credentials login (Sub-admins) ── */}
          <div>
            <p className="text-xs text-gray-500 text-center uppercase tracking-wide mb-3 font-semibold">
              Sub-Admin Login
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>

          {/* Register link */}
          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              Want sub-admin access?{" "}
              <a href="/admin/register" className="text-red-600 hover:underline font-semibold">
                Register here
              </a>
              <span className="block text-xs text-gray-400 mt-1">
                Your account will be reviewed by the super admin.
              </span>
            </p>
          </div>

          {/* Security notice */}
          <p className="text-xs text-gray-400 text-center">
            🔒 Secure admin area. Unauthorized access is prohibited.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Property Sheba BD © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
