"use client";
import React from "react";
import Link from "next/link";
import {
  Globe,
  Book,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-blue-950 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-3xl font-bold text-blue-950">
                [LAN Library]
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Digital PDF library making knowledge accessible to everyone.
              Discover, learn, and grow with our extensive collection.
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Book className="w-4 h-4" />
              <span>90M+ Documents Available</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-blue-950 mb-4 text-lg">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about/lan"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>About Us</span>
                </Link>
                <Link
                  href="/contact/lan/4/enquiry"
                  className="text-gray-600 hover:text-blue-950 mt-2 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/make-money"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>How It Works</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/become-seller"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Become a Seller</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/lan/faqs"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>FAQs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/lan/net/help-center"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Help Center</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-blue-950 mb-4 text-lg">Categories</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/category/education"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Education</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/business"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Business</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/technology"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Technology</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/science"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Science</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/documents"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>All Documents</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-blue-950 mb-4 text-lg">
              Customer Service
            </h4>
            <ul className="space-y-3 mb-4">
              <li>
                <Link
                  href="/my-account"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>My Account</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/my-books"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>My Books</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/saved-my-book"
                  className="text-gray-600 hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Saved Books</span>
                </Link>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:support@lanlibrary.com"
                  className="hover:text-blue-950 transition-colors"
                >
                  support@lanlibrary.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+2341234567890"
                  className="hover:text-blue-950 transition-colors"
                >
                  +234 123 456 7890
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Abuja, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Media Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-bold text-blue-950 mb-3 text-sm">
                Connect With Us
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-950 text-blue-950 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-950 text-blue-950 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-950 text-blue-950 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-950 text-blue-950 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-950 text-blue-950 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="flex flex-col items-center md:items-end">
              <h4 className="font-bold text-blue-950 mb-3 text-sm">
                Stay Updated
              </h4>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                />
                <button className="bg-blue-950 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap text-sm font-semibold">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center md:text-right">
                Get the latest books and updates delivered to your inbox
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p className="text-center md:text-left">
              &copy; {currentYear} Learning Access Network (LAN Library). All
              rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy-policy"
                className="hover:text-blue-950 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-blue-950 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookie-policy"
                className="hover:text-blue-950 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-950 text-white rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 flex items-center justify-center z-40"
        aria-label="Back to top"
      >
        <ArrowRight className="w-5 h-5 -rotate-90" />
      </button>
    </footer>
  );
}
