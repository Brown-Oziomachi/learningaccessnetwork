'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { BookOpen, DollarSign, BookOpenText, Upload, TrendingUp, Users } from 'lucide-react';
import { auth } from '@/lib/firebaseConfig';
import WhatIsLanModal from "@/components/WhatIsLanModal";

export default function LearningAccessNetwork() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [showWhatIsLanModal, setShowWhatIsLanModal] = useState(false);

  const bookImages = [
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1920&h=1080&fit=crop',
    // 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/home");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === bookImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [bookImages.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bookImages[currentImageIndex]})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="pt-8 px-4 md:pt-12 bg-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-center text-3xl lg:text-7xl md:text-5xl font-bold">
              <span className="text-white bg-blue-950 px-4 py-2 rounded">LAN</span>
              <span className="text-blue-950 ml-3">Library</span>
            </h1>
            <h2 className="text-blue-950 text-sm md:text-2xl font-semibold mt-3 text-center">
              Learning Access Network
            </h2>
          </motion.div>
        </header>

        {/* Main Content - Different layouts for mobile and desktop */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          
          {/* Mobile Layout */}
          <div className="lg:hidden w-full max-w-md space-y-6">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-blue-950 mb-4">
                Buy & Sell Knowledge 📚
              </h3>
              <p className="text-gray-700 leading-relaxed">
                A digital marketplace where creators <span className="font-bold text-blue-950">sell their books</span> and readers <span className="font-bold text-blue-950">discover knowledge</span>. Easy, secure, and rewarding for everyone.
              </p>
              <div>
                <button
                onClick={() => setShowWhatIsLanModal(true)}
                className="py-5 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap text-center underline"
              >
                What is LAN Library?
              </button>
              </div>
            </motion.div>

            {/* Quick Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-4 rounded-xl text-white">
                <BookOpenText className="w-8 h-8 mb-2" />
                <h4 className="font-bold text-sm">Buy Books</h4>
                <p className="text-xs mt-1 opacity-90">Access thousands of titles</p>
              </div>
              <div className="bg-white p-4 rounded-xl text-blue-950">
                <Upload className="w-8 h-8 mb-2" />
                <h4 className="font-bold text-sm">Sell Books</h4>
                <p className="text-xs mt-1 opacity-90">Earn from your content</p>
              </div>
            </motion.div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex w-full max-w-7xl gap-8 items-center">
            {/* Left Side - Value Propositions */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 space-y-6"
            >
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                   <BookOpenText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-950">For Readers</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Purchase books</strong> from verified sellers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Instant access</strong> to digital content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Browse thousands</strong> of books across all categories</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900">For Sellers</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Upload & sell</strong> your books or documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Earn money</strong> from every sale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Reach 90M+ readers</strong> globally</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Right Side - Main Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1"
            >
              <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-10 rounded-2xl shadow-2xl text-white">
                <div className="flex items-center gap-4 mb-6">
                  <BookOpen className="w-12 h-12" />
                  <div>
                    <h3 className="text-3xl font-bold">Knowledge Marketplace</h3>
                    <p className="text-blue-200">Where Opportunity Meets Learning</p>
                  </div>
                </div>
                
                <p className="text-lg leading-relaxed mb-6 text-blue-50">
                  <strong className="text-white">LAN Library</strong> is a digital knowledge marketplace connecting book creators with readers worldwide. 
                  <span className="block mt-2 text-yellow-300">
                    ✨ Sellers earn income, buyers access knowledge
                  </span>
                </p>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <div className="text-2xl font-bold">90M+</div>
                    <div className="text-xs text-blue-200">Global Reach</div>
                  </div>
                  <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <div className="text-2xl font-bold">1000+</div>
                    <div className="text-xs text-blue-200">Books Listed</div>
                  </div>
                  <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-xs text-blue-200">Active Sellers</div>
                  </div>
                </div>
             <div>
                <button
                onClick={() => setShowWhatIsLanModal(true)}
                className="py-10 text-sm whitespace-nowrap text-center underline"
              >
                What is LAN Library?
              </button>
              </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer Buttons */}
        <footer className="pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto"
          >
            <a
              href="/auth/signin"
              className="w-full md:w-auto bg-white text-center font-bold text-gray-800 px-12 py-4 rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
            >
              SIGN IN
            </a>
            <Link
              href="/advertise"
              className="w-full md:w-auto bg-gradient-to-r from-blue-950 to-blue-950 text-white px-10 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 text-center shadow-lg"
            >
              START SELLING NOW
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center gap-6 mt-6"
          >
            <Link href="/learn/make-money">
              <button className="text-white hover:text-blue-300 transition-colors underline">
                How it works?
              </button>
            </Link>
          </motion.div>
        </footer>

        {/* Carousel Indicators */}
        <div className="fixed bottom-20 right-6 flex flex-col gap-3 z-20">
          {bookImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? 'bg-white h-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="relative z-10 border-t border-white bg-black backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/80">
            <p className="text-center md:text-left">
              &copy; {currentYear} Learning Access Network (LAN Library). All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
        <WhatIsLanModal
        isOpen={showWhatIsLanModal}
        onClose={() => setShowWhatIsLanModal(false)}
      />
    </div>
  );
}