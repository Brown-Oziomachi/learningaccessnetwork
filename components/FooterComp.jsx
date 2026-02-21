"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
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
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  
   const checkSellerStatus = async (userId) => {
      try {
        setCheckingSeller(true);
        console.log("Checking seller status for user:", userId);
  
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isUserSeller = userData.isSeller === true;
          console.log("User is seller:", isUserSeller);
          setIsSeller(isUserSeller);
          setUserRole(userData.role || null); // ✅ Add this line
        } else {
          console.log("User document not found");
          setIsSeller(false);
          setUserRole(null); // ✅ Add this line
        }
      } catch (error) {
        console.error("Error checking seller status:", error);
        setIsSeller(false);
        setUserRole(null); // ✅ Add this line
      } finally {
        setCheckingSeller(false);
      }
  };
  
   // Check seller status
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
  
        if (currentUser) {
          await checkSellerStatus(currentUser.uid);
        } else {
          setIsSeller(false);
          setCheckingSeller(false);
        }
      });
  
      return () => unsubscribe();
    }, []);
  
   const HandleClick = () => {
     if (!user) {
       router.push("/auth/signin");
       return;
     }

     if (isSeller) {
       // User is already a seller, go to upload page
       router.push("/advertise");
     } else {
       // User is not a seller, go to become seller page
       router.push("/become-seller");
     }
   };
  
  return (
    <footer className="bg-blue-950 text-blue-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-200">
              <Link
                href="/home"
                className="flex items-center gap-2 flex-shrink-0"
              >
                <h1
                  className="text-4xl sm:text-3xl font-bold"
                  style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                >
                  [LAN Library]
                  <h2
                    className="text-xs sm:text-base font-light"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    The Global Student Library 📚
                  </h2>
                </h1>
              </Link>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Digital PDF library making knowledge accessible to everyone.
              Discover, learn, and grow with our extensive collection.
            </p>
            <div className="flex items-center gap-3 text-sm text-blue-200">
              <Book className="w-4 h-4" />
              <span>90M+ Documents Available</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-blue-200 py-1 max-md:py-10 ">
            <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about/lan"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>About Us</span>
                </Link>
                <Link
                  href="/contact/lan/4/enquiry"
                  className=" hover:text-blue-950 mt-2 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/make-money"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>How It Works</span>
                </Link>
              </li>
              <button
                onClick={HandleClick}
                disabled={checkingSeller}
                className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                {checkingSeller ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : isSeller ? (
                  <>Upload</>
                ) : (
                  <>Become a Seller</>
                )}
              </button>

              <li>
                <Link
                  href="/lan/faqs"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>FAQs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/referrals"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Referral</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/lan/net/help-center"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Help Center</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold  mb-4 text-lg">Categories</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/category/education"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Education</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/business"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Business</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/technology"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Technology</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/category/science"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Science</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/documents"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>All Documents</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Customer Service</h4>
            <ul className="space-y-3 mb-4">
              <li>
                <Link
                  href="/my-account"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>My Account</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/my-books"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>My Books</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/saved-my-book"
                  className=" hover:text-blue-950 transition-colors flex items-center gap-2 group"
                >
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Saved Books</span>
                </Link>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="space-y-2 text-sm ">
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
              <h4 className="font-bold  mb-3 text-sm">Connect With Us</h4>
              <div className="flex items-center gap-3">
                {/* <a
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
                </a> */}
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
              <h4 className="font-bold mb-3 text-sm">Stay Updated</h4>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
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

        {/* Payment Methods Section */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="text-center">
            <h4 className="font-bold text-blue-950 mb-4 text-sm">
              Safe & Secure Payment Methods
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
              {/* Flutterwave Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 px-5 py-2.5 rounded-lg border border-orange-200 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  Powered by
                </span>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Flutterwave
                </span>
              </div>

              {/* Payment Icons */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {/* Card Payment - Blue gradient */}
                <div
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  title="Card Payment"
                >
                  <CreditCard className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold text-white">Card</span>
                </div>

                {/* Bank Transfer - Green gradient */}
                <div
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  title="Bank Transfer"
                >
                  <Building2 className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold text-white">
                    Bank Transfer
                  </span>
                </div>

                {/* USSD - Purple gradient */}
                <div
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  title="USSD Payment"
                >
                  <Smartphone className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold text-white">USSD</span>
                </div>

                {/* eNaira - Teal gradient (Nigerian green) */}
                <div
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  title="eNaira"
                >
                  <Wallet className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold text-white">
                    eNaira
                  </span>
                </div>

                {/* PayPal - Official PayPal blue */}
                <div
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  title="PayPal"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L8.926 14.5"
                      fill="white"
                    />
                    <path
                      d="M8.926 14.5l.63-3.993.04-.22a.805.805 0 0 1 .794-.68h.5c3.238 0 5.774-1.314 6.514-5.12.256-1.313.192-2.446-.3-3.327-.503-.9-1.446-1.537-2.818-1.917a13.6 13.6 0 0 0-2.114-.238H8.114c-.386 0-.716.28-.777.66L5.23 13.558c-.083.466.27.887.746.887h2.95z"
                      fill="white"
                    />
                    <path
                      d="M9.644 2.762c.061-.38.39-.66.777-.66h4.058c.721 0 1.351.047 1.886.143-1.074 5.5-4.54 7.376-9.042 7.376H5.976l1.922-12.198c.061-.38.39-.66.777-.66h4.058"
                      fill="white"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    PayPal
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-200 max-w-2xl mx-auto">
              All transactions are encrypted and secured with industry-standard
              SSL technology. Your payment information is safe with us.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-200">
            <p className="text-center md:text-left">
              &copy; {currentYear} [ LAN Library ] Learning Access Network. All
              rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/lan/privacy-policy"
                className="hover:text-blue-950 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/lan/terms-of-service"
                className="hover:text-blue-950 transition-colors"
              >
                Terms of Service
              </Link>
              {/* <Link
                href="/cookie-policy"
                className="hover:text-blue-950 transition-colors"
              >
                Cookie Policy
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-blue-950 text-white rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
        aria-label="Back to top"
      >
        <ArrowRight className="w-5 h-5 -rotate-90" />
      </button>
    </footer>
  );
}