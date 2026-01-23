"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthLayout({
  children,
  showBack = true,
  backPath = "/auth/signin",
  showLanguageSelector = false,
  showFindAccount = false,
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showBack && (
        <div className="p-4">
          <button
            onClick={() => router.push(backPath)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
        </div>
      )}

      {/* {showLanguageSelector && (
        <div className="px-4 mb-8">
          <select className="w-full text-center text-gray-600 py-2 focus:outline-none">
            <option>English (UK)</option>
            <option>English (US)</option>
          </select>
        </div>
      )} */}

      <div className="flex-1 px-6 pt-4 flex flex-col ">{children}</div>

      {showFindAccount && (
        <div className="py-8 px-6">
          <Link href="/auth/find-my-account">
            <button className="text-blue-950 hover:underline font-medium cursor-pointer">
              Find my account
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
