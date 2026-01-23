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
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/home");
      } else {
        setTimeout(() => setLoading(false), 5000);
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

  // ✅ UPDATED: Navigation functions for new auth flow
  const navigateToSignIn = (preSelectedRole = null) => {
  // Store pre-selected role in sessionStorage if provided
  if (preSelectedRole) {
    sessionStorage.setItem('preSelectedRole', preSelectedRole);
  }
  router.push('/auth/signin');
};

  const navigateToSchoolRegistration = () => {
    router.push('/register-school');
  };

  if (loading) {
    return (
      <div className="min-h-screen items-center justify-center flex flex-col space-y-1 bg-white">
        <h1 className="text-center justify-center items-center text-3xl lg:text-7xl md:text-5xl font-bold">
          <span className="text-white bg-blue-950 px-4 py-2 rounded">LAN</span>
          <span className="text-blue-950 ml-3">Library</span>
        </h1>
        <div>
          <h2 className="bg-blue-950 text-white text-xs md:text-xl font-semibold mt-3 text-center px-5 py-1 rounded">
            Learning Access Network
          </h2>
        </div>
        <div className="py-5">
          <img src="/Log.png" alt="Lan image explanation"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-blue-950">
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/80" />
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

        {/* Main Content - Mobile Layout */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="lg:hidden w-full max-w-md space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm p-6 shadow-2xl border-6 border-l-blue-950"
            >
              <h3 className="text-2xl font-bold text-blue-950 mb-4">
                The Global Student Library 📚
              </h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                A secure marketplace where students and authors <span className="font-bold text-blue-950">sell original works</span> and <span className="font-bold text-blue-950">learners access course-specific knowledge</span>. Easy, secure, and rewarding for everyone.
              </p>
              <p className="text-gray-700 leading-relaxed">The ultimate marketplace where students and authors sell original study materials while global learners access the knowledge they need to excel</p>
              <div>
                <button
                  onClick={() => setShowWhatIsLanModal(true)}
                  className="py-10 text-sm whitespace-nowrap text-blue-950 font-black underline cursor-pointer"
                >
                  PLATFORM GUIDES?
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 gap-4 md:flex"
            >
              <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-4 text-white">
                <div className="flex items-center gap-4 mb-4 w-100">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BookOpenText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white">For Students & Learners</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Discover Specialized Content:</strong> Find course-specific books, lecture notes, and research documents tailored to your university curriculum.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Instant Knowledge Unlock:</strong> Gain immediate digital access to materials that help you ace your exams and master your field.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Global Academic Reach:</strong> Browse thousands of verified resources from top-performing students and academics worldwide.</span>
                  </li>
                </ul>
              </div>
            
              <div className="bg-white p-4 text-blue-950">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-950">For Sellers</h3>
                    <h4 className="text-sm font-bold text-green-900">"Students & Authors"</h4>
                  </div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Monetize Your Knowledge:</strong> Turn your high-quality study guides, research papers or written books into a steady stream of passive income.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Empower Your Peers:</strong> Help fellow students succeed by sharing the resources that helped you excel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Seamless Selling:</strong> Upload once, set your price, and reach a global audience of 90M+ learners with automated payouts.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex w-full max-w-7xl gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 space-y-6"
            >
              <div className="bg-white/95 backdrop-blur-lg p-8 shadow-2xl border-6 border-l-blue-950">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BookOpenText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-950">For Students & Learners</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Discover Specialized Content:</strong> Find course-specific books, lecture notes, and research documents tailored to your university curriculum.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Instant Knowledge Unlock:</strong> Gain immediate digital access to materials that help you ace your exams and master your field.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span><strong>Global Academic Reach:</strong> Browse thousands of verified resources from top-performing students and academics worldwide.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/95 backdrop-blur-lg p-8 shadow-2xl border-6 border-l-blue-950">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-950">For Sellers</h3>
                    <h4 className="text-sm font-bold text-green-900">"Students & Authors"</h4>
                  </div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Monetize Your Knowledge:</strong> Turn your high-quality study guides, research papers or written books into a steady stream of passive income.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Empower Your Peers:</strong> Help fellow students succeed by sharing the resources that helped you excel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Seamless Selling:</strong> Upload once, set your price, and reach a global audience of 90M+ learners with automated payouts.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1"
            >
              <div className="bg-gradient-to-br from-blue-950 to-blue-950 p-10 shadow-2xl text-white">
                <div className="flex items-center gap-4 mb-6">
                  <BookOpen className="w-12 h-12" />
                  <div>
                    <h3 className="text-3xl font-bold">Knowledge Marketplace</h3>
                    <p className="text-blue-200">Where Academic Opportunity Meets Global Learning</p>
                  </div>
                </div>

                <p className="text-lg leading-relaxed text-blue-50">
                  <strong className="text-white">LAN Library</strong> is a premier digital ecosystem connecting university institutions, student-sellers, and global readers in one secure marketplace.
                </p>
                <p className="mb-6">The ultimate marketplace where students and authors sell original study materials while global learners access the knowledge they need to excel</p>
                <div>
                  <ul>
                    <li className="flex items-start gap-2 mb-2">
                      <span><strong>Students:</strong> Earn while you learn and access the world's best study materials.</span>
                    </li>
                    <li className="flex items-start gap-2 mb-2">
                      <span><strong>Universities:</strong> Digitally organize your institutional resources and empower your student body.</span>
                    </li>
                  </ul>
                  <span className="block mt-2 text-yellow-300">
                    ✨Sellers earn income, buyers bridges the knowledge gap
                  </span>
                </div>

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
                    className="py-10 text-sm whitespace-nowrap text-white font-black underline cursor-pointer"
                  >
                    PLATFORM GUIDE...
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* ✅ UPDATED: Footer Buttons with New Auth Flow */}
       <footer className="pb-8 px-4">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.6 }}
    className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto"
  >
  
    <button 
      onClick={() => navigateToSignIn('seller')}
      className="w-full md:w-auto bg-blue-950 text-center font-bold text-white px-12 py-2 rounded-lg hover:bg-blue-800 transition-all hover:scale-105 shadow-lg"
    >
     JOIN NOW
    </button>

    <button 
      // onClick={navigateToSchoolRegistration}
      className="w-full md:w-auto text-blue-950 opacity-20 text-center font-bold bg-white px-12 py-2 rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
    >
      REGISTER YOUR UNIVERSITY
    </button>
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
      <div className="relative z-10 border-t border-white bg-white text-blue-950 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-950">
            <p className="text-center md:text-left">
              &copy; {currentYear} LAN Library (Learning Access Network). All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/lan/privacy-policy" className="hover:text-blue-700 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/lan/terms-of-service" className="hover:text-blue-700 transition-colors">
                Terms of Service
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