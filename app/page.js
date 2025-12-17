'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function LearningAccessNetwork() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const bookImages = [
    '/image1.png',
    '/image2.png',
    '/image3.png',
    '/image4.png',
    '/image5.png',
    // 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === bookImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [bookImages.length]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0 mask-b-from-0 mask-t-from-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-no-repeat lg:bg-cover bg-center"
              style={{
                backgroundImage: `url(${bookImages[currentImageIndex]})`,
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 " />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen bg-black/0">
        {/* Header */}
        <header className="pt-8 px-4 md:pt-12">
          <h1 className="text-center text-3xl md:text-5xl font-bold">
            <span className="text-white bg-blue-950 px-2">LEARNING </span>
            <span className="text-blue-900 font-black ml-3">ACCESS NETWORK</span>
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-5 md:py-0">
          {/* Globe Icon */}
          <div className="mb-8 md:mb-12">
            <div className="relative w-44 h-44 md:w-76 md:h-76">
              {/* Globe SVG with rotation animation */}
              <svg viewBox="0 0 200 200" className="w-full h-full animate-spin" style={{ animationDuration: '8s' }}>
                {/* Top half - blue */}
                <ellipse cx="100" cy="100" rx="80" ry="80" fill="#0c7c9e" />

                {/* Bottom half - dark */}
                <path d="M 20 100 A 80 80 0 0 0 180 100 Z" fill="#2d3e50" />

                {/* Grid lines */}
                <ellipse cx="100" cy="100" rx="80" ry="80" fill="none" stroke="#8b9299" strokeWidth="2" />
                <ellipse cx="100" cy="100" rx="60" ry="80" fill="none" stroke="#8b9299" strokeWidth="2" />
                <ellipse cx="100" cy="100" rx="30" ry="80" fill="none" stroke="#8b9299" strokeWidth="2" />
                <line x1="20" y1="100" x2="180" y2="100" stroke="#8b9299" strokeWidth="2" />
                <ellipse cx="100" cy="100" rx="80" ry="50" fill="none" stroke="#8b9299" strokeWidth="2" />
                <ellipse cx="100" cy="100" rx="80" ry="25" fill="none" stroke="#8b9299" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Info Box */}
          <div className="w-full max-w-4xl mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-blue-950/90 backdrop-blur-sm text-white p-6 md:p-8 rounded-lg shadow-2xl"
            >
              <p className="text-base md:text-lg leading-relaxed">
                <span className="bg-white text-blue-950 px-2"> Learning Access Network</span> is a digital platform designed to make knowledge easily accessible to everyone.
                The website allows users to discover, read, and purchase books across various categories,
                including education, personal development, business, technology, and more.
              </p>
            </motion.div>

            {/* Read More Button - Only visible on desktop */}
            {/* <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden md:block mt-4 bg-white text-gray-800 px-8 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Read More
            </motion.button> */}
          </div>
        </main>

        {/* Footer Buttons */}
        <footer className="pb-8 md:pb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <a
              href="/auth/signin"
              className="w-full md:w-auto bg-white text-center font-bold text-gray-800 px-12 py-3 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              SIGN IN
            </a>
            <Link
              href="/advertise"
              className="inline-block w-full md:w-auto bg-blue-950 text-white px-8 py-3 rounded font-medium hover:bg-blue-800 transition-colors text-center"
            >
              ADVERTISE WITH US
            </Link>
          </motion.div>
        </footer>

        {/* Carousel Indicators */}
        <div className="fixed bottom-0 right-6 flex gap-5 z-20">
          {bookImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}