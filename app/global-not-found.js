import "./globals.css";
import { Inter } from "next/font/google";
import GoHomeButton from '@/components/GoHomeButton';

const inter = Inter({ subsets: ["latin"] });

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-sm w-full text-center">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-sm mb-6">
            The page you're looking for doesn't exist in LAN Library.
            Head back home or visit the help center.
          </p>

          {/* Button */}
          <GoHomeButton />

        </div>

      </body>
    </html>
  );
}