"use client";

import React, { useState } from "react";
import {
  Globe,
  Search,
  Book,
  CreditCard,
  Download,
  User,
  Shield,
  HelpCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      title: "Getting Started",
      articles: [
        { title: "Creating an account", slug: "creating-your-account" },
        { title: "Signing in to your account", slug: "signing-in" },
        { title: "Browsing the library", slug: "browsing-the-library" },
        { title: "Using the search function", slug: "using-search" },
      ],
    },
    {
      title: "Payments & Subscriptions",
      articles: [
        { title: "How to purchase a book", slug: "how-to-purchase-book" },
        { title: "Accepted payment methods", slug: "payment-methods" },
        { title: "Payment failed", slug: "payment-failed" },
        { title: "Refund policy", slug: "refund-policy" },
      ],
    },
    {
      title: "Downloads & Access",
      articles: [
        { title: "Downloading your PDFs", slug: "downloading-pdfs" },
        { title: "Accessing My Books", slug: "accessing-my-books" },
        { title: "PDF won’t open", slug: "pdf-wont-open" },
      ],
    },
    {
      title: "Account Management",
      articles: [
        { title: "Updating your profile", slug: "updating-profile" },
        { title: "Changing your password", slug: "changing-password" },
        { title: "Deleting your account", slug: "deleting-account" },
      ],
    },
    {
      title: "Security & Privacy",
      articles: [
        { title: "Privacy policy", slug: "privacy-policy" },
        { title: "Terms of service", slug: "terms-of-service" },
        { title: "Data protection", slug: "data-protection" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <HelpCircle className="w-14 h-14 mx-auto text-blue-950 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Help Center
          </h1>
          <p className="text-gray-600 mb-6">
            Support for Learning Access Network
          </p>

          {/* SEARCH */}
          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full border rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950"
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {helpCategories.map((category, index) => (
          <div key={index} className="mb-10">
            {/* CATEGORY TITLE */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {category.title}
            </h2>

            {/* SCRIBD-STYLE LIST */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {category.articles.map((article, i) => (
                <Link
                  key={i}
                  href={`/lan/net/help-center/article/${article.slug}`}
                  className="flex items-center justify-between px-4 py-4 text-sm text-gray-900 hover:bg-gray-50 transition border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-500" />
                    <span className="font-medium">{article.title}</span>
                  </div>

                  <ArrowRight size={16} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-500 text-center">
          <p>
            © {new Date().getFullYear()} Learning Access Network. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
