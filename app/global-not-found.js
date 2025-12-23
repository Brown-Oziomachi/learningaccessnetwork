import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import GoHomeButton from '@/components/GoHomeButton'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white shadow-lg rounded-2xl p-10">
          {/* 404 */}
          <h1 className="text-7xl font-extrabold text-blue-950 mb-4">
            404
          </h1>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page not found
          </h2>

          {/* Description */}
         <p className="text-gray-600 mb-8">
               Why wasting time searching for a page that doesn't exist in LAN Library. Go to help-center and learn how to use our system.
        </p>
          <GoHomeButton/>
          </div>
      </body>
    </html>
  );
}
