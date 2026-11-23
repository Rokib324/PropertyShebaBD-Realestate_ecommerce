"use client";

import { assets } from "@/assests/assets";
import Image from "next/image";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SideBar from "@/components/AdminComponents/Sidebar";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";

function AdminHeader() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";

  return (
    <div className="flex items-center justify-between w-full py-3 max-h-[60px] px-6 sm:px-12 border-b border-black bg-white">
      <h3 className="font-semibold text-xl">Admin Panel</h3>
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {session.user.username || session.user.name || "Admin"}
            </p>
            <span
              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isSuperAdmin
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {isSuperAdmin ? "Super Admin" : "Sub-Admin"}
            </span>
          </div>
        )}
        <Image src={assets.profile_icon} width={40} alt="profile" />
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/register";

  if (isAuthPage) {
    return (
      <SessionProvider>
        <ToastContainer theme="dark" />
        {children}
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <div>
        <div className="flex">
          <ToastContainer theme="dark" />
          <SideBar />
          <div className="flex flex-col w-full">
            <AdminHeader />
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
