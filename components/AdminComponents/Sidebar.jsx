"use client";

import { assets } from "@/assests/assets";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "react-toastify";

const SideBar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };

  const linkClass =
    "font-semibold flex items-center gap-2 py-1 px-3 sm:px-6 border border-solid border-black shadow-[-5px_5px_0px_#494949] hover:shadow-[-5px_5px_0px_#FF0000] transition-all duration-300";

  return (
    <div className="flex flex-col bg-slate-100">
      <div className="px-2 sm:pl-14 py-3">
        <Image src={assets.logo} alt="logo" width={50} />
      </div>
      <div className="w-28 sm:w-80 h-screen relative py-12 border border-black">
        <div className="w-[50%] sm:w-[80%] absolute right-0">

          <Link href="/admin/add_slider" className={`${linkClass} mt-0`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Slider</p>
          </Link>
          <Link href="/admin/slider_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Slider List</p>
          </Link>
          <Link href="/admin/add_categories" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Category</p>
          </Link>
          <Link href="/admin/Category_List" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Category List</p>
          </Link>
          <Link href="/admin/add_land" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Land</p>
          </Link>
          <Link href="/admin/Land_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Land List</p>
          </Link>
          <Link href="/admin/add_realestate" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Real Estate</p>
          </Link>
          <Link href="/admin/realeste_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Real Estate List</p>
          </Link>
          <Link href="/admin/add_interior" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Interior</p>
          </Link>
          <Link href="/admin/interior_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Interior List</p>
          </Link>
          <Link href="/admin/add_marvel" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Marvel</p>
          </Link>
          <Link href="/admin/marvel_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Marvel List</p>
          </Link>
          <Link href="/admin/add_sanitary" className={`${linkClass} mt-5`}>
            <Image src={assets.add_icon} alt="" width={28} /> <p>Add Sanitary</p>
          </Link>
          <Link href="/admin/sanitary_list" className={`${linkClass} mt-5`}>
            <Image src={assets.blog_icon} alt="" width={28} /> <p>Sanitary List</p>
          </Link>

          {/* Super admin only */}
          {isSuperAdmin && (
            <Link
              href="/admin/sub-admins"
              className={`${linkClass} mt-5 text-red-700 border-red-300 hover:shadow-[-5px_5px_0px_#FF0000]`}
            >
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>Sub-Admins</p>
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="font-semibold mt-8 flex items-center gap-2 py-1 px-3 sm:px-6 border border-solid border-red-600 bg-red-600 text-white shadow-[-5px_5px_0px_#494949] hover:shadow-[-5px_5px_0px_#FF0000] hover:bg-red-700 transition-all duration-300 w-full"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l-4-4m0 0l4-4m-4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <p>Logout</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
