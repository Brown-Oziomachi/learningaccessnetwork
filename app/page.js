'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  BookOpen, DollarSign, BookOpenText, TrendingUp, Users,
  ArrowRight, CheckCircle, X, Play, ChevronLeft, ChevronRight,
  Star, ShoppingCart, Download, Shield, Zap
} from 'lucide-react';
import { auth, db } from '@/lib/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import WhatIsLanModal from "@/components/WhatIsLanModal";

export default function LearningAccessNetwork() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentStudentImageIndex, setCurrentStudentImageIndex] = useState(0);
  const [currentSellerImageIndex, setCurrentSellerImageIndex] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [showWhatIsLanModal, setShowWhatIsLanModal] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const heroImages = [
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1920&h=1080&fit=crop',
  ];

  // Student activity images - showing students using LAN Library
  const studentActivityImages = [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80', // Students studying together with laptops
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80', // Student reading on tablet
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80', // Student with laptop and books
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80', // Happy student with digital device
    'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80', // Student browsing online
  ];

  // Seller activity images - showing sellers earning and uploading
  const sellerActivityImages = [
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80', // Person working on laptop happily
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80', // Woman celebrating success
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&q=80', // Professional uploading content
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80', // Person earning money online
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80', // Author working on content
  ];

  const stats = [
    { icon: DollarSign, value: "₦500K+", label: "Average Monthly Earnings" },
    { icon: Users, value: "500+", label: "Active Sellers" },
    { icon: BookOpen, value: "5,000+", label: "Books Sold Monthly" },
    { icon: TrendingUp, value: "85%", label: "Revenue Share" },
  ];

  const videos = [
    {
      id: 1,
      title: "Getting Started with LAN Library",
      description: "Learn the basics of setting up your account and understanding the platform",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "5:30",
    },
    {
      id: 2,
      title: "AI Tools For Writing Books",
      description: "Today's a fantastic time to be writing a book. With a plethora of digital tools and online resources, you can tackle your writing project with ease.",
      thumbnail: "/make.png",
      videoUrl: "/tools.mp4",
      duration: "8:45",
    },
    {
      id: 3,
      title: "Pricing Strategies That Work",
      description: "Discover the best pricing strategies to maximize your earnings",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "6:20",
    },
  ];

  // Helper function to generate thumbnails
  const getThumbnailUrl = (book) => {
    if (book.driveFileId) {
      return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    }
    if (book.embedUrl) {
      const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
      if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
      }
    }
    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
      const match = book.pdfUrl.match(/[-\w]{25,}/);
      if (match) {
        return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
      }
    }
    return book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
  };

  // Fetch books from Firestore
  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setLoadingBooks(true);
        const advertBooksRef = collection(db, 'advertMyBook');
        const snapshot = await getDocs(advertBooksRef);

        if (!snapshot.empty) {
          const books = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.bookTitle) {
              const bookData = {
                id: `firestore-${doc.id}`,
                firestoreId: doc.id,
                title: data.bookTitle,
                author: data.author || 'Unknown Author',
                category: (data.category || 'education').toLowerCase(),
                price: Number(data.price) || 0,
                description: data.description || 'No description available',
                driveFileId: data.driveFileId,
                pdfUrl: data.pdfUrl,
                embedUrl: data.embedUrl,
                rating: (4 + Math.random()).toFixed(1),
                reviews: Math.floor(Math.random() * 500) + 50,
              };
              bookData.image = getThumbnailUrl(bookData);
              books.push(bookData);
            }
          });
          setFeaturedBooks(books.sort(() => 0.5 - Math.random()));
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchFeaturedBooks();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/home");
      } else {
        setTimeout(() => setLoading(false), 1500);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Hero carousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Student images auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStudentImageIndex((prev) => (prev + 1) % studentActivityImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [studentActivityImages.length]);

  // Seller images auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSellerImageIndex((prev) => (prev + 1) % sellerActivityImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sellerActivityImages.length]);

  const navigateToSignIn = (preSelectedRole = null) => {
    if (preSelectedRole) {
      sessionStorage.setItem('preSelectedRole', preSelectedRole);
    }
    router.push('/auth/signin');
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
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
          <div className="relative w-24 h-28">
            {/* Book with turning pages */}
            <div className="book-container">
              {/* Book Base */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-blue-800 rounded-lg shadow-2xl">
                {/* Spine */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-blue-950 to-blue-900 rounded-l-lg"></div>
                
                {/* Pages turning animation */}
                <div className="page-turn page-1"></div>
                <div className="page-turn page-2"></div>
                <div className="page-turn page-3"></div>
                
                {/* Cover content that transitions */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="book-content-transition">
                    {/* Book icon phase */}
                    <div className="content-phase book-icon-phase">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    
                    {/* LAN text phase */}
                    <div className="content-phase lan-text-phase">
                      <div className="flex gap-1 text-white font-black text-3xl">
                        <span className="inline-block lan-bounce" style={{ animationDelay: '0s' }}>L</span>
                        <span className="inline-block lan-bounce" style={{ animationDelay: '0.1s' }}>A</span>
                        <span className="inline-block lan-bounce" style={{ animationDelay: '0.2s' }}>N</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg pointer-events-none"></div>
              </div>
            </div>
            
            {/* Loading indicator */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <div className="w-2 h-2 bg-blue-950 rounded-full loading-dot" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-blue-800 rounded-full loading-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full loading-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>

            <style jsx>{`
              .book-container {
                position: relative;
                width: 100%;
                height: 100%;
                transform-style: preserve-3d;
              }
              
              .page-turn {
                position: absolute;
                right: 2px;
                width: calc(100% - 8px);
                height: calc(100% - 8px);
                top: 4px;
                background: linear-gradient(to right, #e5e7eb 0%, #f9fafb 50%, #ffffff 100%);
                border-radius: 0 4px 4px 0;
                transform-origin: left center;
                opacity: 0;
                box-shadow: 2px 0 8px rgba(0,0,0,0.1);
              }
              
              .page-1 {
                animation: pageTurn 3s ease-in-out infinite;
                animation-delay: 0s;
              }
              
              .page-2 {
                animation: pageTurn 3s ease-in-out infinite;
                animation-delay: 0.15s;
              }
              
              .page-3 {
                animation: pageTurn 3s ease-in-out infinite;
                animation-delay: 0.3s;
              }
              
              @keyframes pageTurn {
                0%, 100% {
                  transform: perspective(600px) rotateY(0deg);
                  opacity: 0;
                }
                20%, 80% {
                  opacity: 1;
                }
                50% {
                  transform: perspective(600px) rotateY(-120deg);
                  opacity: 0.7;
                }
              }
              
              .book-content-transition {
                position: relative;
                width: 100%;
                height: 100%;
              }
              
              .content-phase {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: contentFade 6s ease-in-out infinite;
              }
              
              .book-icon-phase {
                animation-delay: 0s;
              }
              
              .lan-text-phase {
                animation-delay: 3s;
              }
              
              @keyframes contentFade {
                0%, 45% {
                  opacity: 1;
                  transform: scale(1);
                }
                50%, 95% {
                  opacity: 0;
                  transform: scale(0.8);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              
              @keyframes lan-bounce {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-6px);
                }
              }
              
              .lan-bounce {
                animation: lan-bounce 0.8s ease-in-out infinite;
              }
              
              @keyframes loading-dot {
                0%, 100% {
                  transform: scale(1);
                  opacity: 0.5;
                }
                50% {
                  transform: scale(1.3);
                  opacity: 1;
                }
              }
              
              .loading-dot {
                animation: loading-dot 1.2s ease-in-out infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-950 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white text-blue-950 px-2 py-2 rounded-full font-black text-xl">
               [ LAN
              </div>
              <span className="font-bold text-white text-lg hidden md:block">Library]</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateToSignIn()}
                className="text-white hover:text-blue-200 font-semibold hidden md:block"
              >
                Browse Books
              </button>
              <button
                onClick={() => navigateToSignIn('seller')}
                className="px-6 py-2.5 text-blue-950 bg-white font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Selling
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile: Text on Image */}
      <section className="relative lg:hidden h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[currentImageIndex]}
              alt="Books"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-950/70 to-blue-950/70" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-end p-6 pb-12">
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            The Global Student Library 📚
          </h1>
          <p className="text-white text-lg mb-6 leading-relaxed">
            A secure marketplace where <span className="font-bold text-yellow-300">students and authors sell original works</span> and <span className="font-bold text-yellow-300">learners access course-specific knowledge</span> they need to excel.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigateToSignIn()}
              className="bg-white text-blue-950 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Browse Books
            </button>
            <button
              onClick={() => setShowWhatIsLanModal(true)}
              className="text-white font-bold underline"
            >
              PLATFORM GUIDE →
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section - Desktop: Text Beside Image */}
      <section className="hidden lg:block relative h-[800px] overflow-hidden">
        {/* Image Carousel Background - Full Width */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[currentImageIndex]}
              alt="Books"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block bg-blue-950 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                  Global Academic Marketplace
                </div>

                <h1 className="text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                  The Global Student Library 📚
                </h1>

                <p className="text-xl text-white mb-8 leading-relaxed drop-shadow-md">
                  A secure marketplace where <span className="font-bold text-blue-200">students and authors sell original works</span> and <span className="font-bold text-blue-200">learners access course-specific knowledge</span> they need to excel. Easy, secure, and rewarding for everyone.
                </p>

                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => navigateToSignIn()}
                    className="px-8 py-4 bg-blue-950 text-white font-bold rounded-lg hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2"
                  >
                    Browse Books
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowWhatIsLanModal(true)}
                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all"
                  >
                    Platform Guide
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(0, 4).map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-md border border-gray-200">
                        <Icon className="w-8 h-8 text-blue-950 mb-2" />
                        <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <button
          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-900" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
            />
          ))}
        </div>
      </section>

      {/* For Students Section - Desktop: Image on Right, Mobile: Text on Image */}
      <section className="relative lg:py-20 bg-white">
        {/* Mobile */}
        <div className="lg:hidden relative h-[700px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStudentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={studentActivityImages[currentStudentImageIndex]}
                alt="Students using LAN Library"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-950/60 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 h-full flex flex-col justify-end p-6 pb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-3 rounded-full">
                <BookOpenText className="w-8 h-8 text-blue-950" />
              </div>
              <h2 className="text-3xl font-black text-white">For Students</h2>
            </div>

            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Discover Specialized Content:</strong> Find course-specific books, lecture notes, and research documents tailored to your university curriculum.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Instant Knowledge Unlock:</strong> Gain immediate digital access to materials that help you ace your exams.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Global Academic Reach:</strong> Browse thousands of verified resources from top academics worldwide.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          <div className="grid lg:grid-cols-2">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center bg-white px-12 py-20"
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-950 p-4 rounded-2xl">
                    <BookOpenText className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900">For Students & Learners</h2>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-blue-950 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-blue-950 text-lg">Discover Specialized Content:</strong>
                      <p className="text-gray-700 mt-1">Find course-specific books, lecture notes, and research documents tailored to your university curriculum.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-blue-950 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-blue-950 text-lg">Instant Knowledge Unlock:</strong>
                      <p className="text-gray-700 mt-1">Gain immediate digital access to materials that help you ace your exams and master your field.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-blue-950 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-blue-950 text-lg">Global Academic Reach:</strong>
                      <p className="text-gray-700 mt-1">Browse thousands of verified resources from top-performing students and academics worldwide.</p>
                    </div>
                  </li>
                </ul>

                <button
                  onClick={() => navigateToSignIn()}
                  className="mt-8 px-8 py-4 bg-blue-950 text-white font-bold rounded-lg hover:bg-blue-900 transition-all shadow-lg"
                >
                  Start Learning →
                </button>
              </div>
            </motion.div>

            {/* Right - Image Carousel - Full Width */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[700px] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStudentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img
                    src={studentActivityImages[currentStudentImageIndex]}
                    alt="Students using LAN Library"
                    className="w-full h-full object-cover"
                  />
                  {/* Activity indicator overlay */}
                  <div className="absolute bottom-6 left-6 bg-blue-950/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl">
                    <p className="text-sm font-semibold">Students accessing LAN Library</p>
                    <p className="text-xs text-blue-200">Reading purchased books • Browsing materials</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation dots */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                {studentActivityImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStudentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentStudentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Sellers Section - Desktop: Image on Left, Mobile: Text on Image */}
      <section className="relative lg:py-0 bg-gray-50">
        {/* Mobile */}
        <div className="lg:hidden relative h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSellerImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={sellerActivityImages[currentSellerImageIndex]}
                alt="Sellers earning on LAN Library"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/95 via-green-900/60 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 h-full flex flex-col justify-end p-6 pb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-3 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">For Sellers</h2>
                <p className="text-yellow-300 font-bold">Students & Authors</p>
              </div>
            </div>

            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Monetize Your Knowledge:</strong> Turn your study guides into steady passive income.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Empower Your Peers:</strong> Help fellow students succeed by sharing your materials.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <span><strong>Seamless Selling:</strong> Upload once and reach 90M+ learners with automated payouts.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          <div className="grid lg:grid-cols-2">
            {/* Left - Image Carousel - Full Width */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[700px] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSellerImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img
                    src={sellerActivityImages[currentSellerImageIndex]}
                    alt="Sellers earning on LAN Library"
                    className="w-full h-full object-cover"
                  />
                  {/* Activity indicator overlay */}
                  <div className="absolute bottom-6 left-6 bg-green-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl">
                    <p className="text-sm font-semibold">Sellers earning on LAN Library</p>
                    <p className="text-xs text-green-200">Uploading content • Processing transactions</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation dots */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                {sellerActivityImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSellerImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentSellerImageIndex ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right - Text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex items-center bg-gray-50 px-12 py-20"
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-600 p-4 rounded-2xl">
                    <DollarSign className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-gray-900">For Sellers</h2>
                    <p className="text-green-700 font-bold text-lg">Students & Authors</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-green-900 text-lg">Monetize Your Knowledge:</strong>
                      <p className="text-gray-700 mt-1">Turn your high-quality study guides, research papers or written books into a steady stream of passive income.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-green-900 text-lg">Empower Your Peers:</strong>
                      <p className="text-gray-700 mt-1">Help fellow students succeed by sharing the resources that helped you excel.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <strong className="text-green-900 text-lg">Seamless Selling:</strong>
                      <p className="text-gray-700 mt-1">Upload once, set your price, and reach a global audience of 90M+ learners with automated payouts.</p>
                    </div>
                  </li>
                </ul>

                <button
                  onClick={() => navigateToSignIn('seller')}
                  className="mt-8 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg"
                >
                  Start Selling →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      {!loadingBooks && featuredBooks.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-4">Featured Books</h2>
              <p className="text-gray-600 text-lg">Recently published by our community</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {featuredBooks.slice(0, 10).map((book) => (
                <button
                  key={book.id}
                  onClick={() => navigateToSignIn()}
                  className="group text-left"
                >
                  <div className="relative mb-3 overflow-hidden shadow-lg">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-white font-bold">Sign in to view</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-950">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{book.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Over 10,000+ people love us. You will too.
            </h2>
            <p className="text-2xl text-gray-600">Watch The Video And Learn More About Us.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Unimaginably Excellent</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  I could not imagine how great LAN Library works until I signed up with them. Honestly, this is my first time reviewing about any website but I must say that I'm happy to write how excellent this platform operates.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                    K
                  </div>
                  <span className="font-semibold text-gray-900">Kevin</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Best in Class Support</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  LAN Library is a great company with one of the best supports I've ever seen.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    T
                  </div>
                  <span className="font-semibold text-gray-900">Theresa</span>
                </div>
              </div>
            </div>

            {/* Center Column - Video */}
            <div className="lg:row-span-1">
              <button
                onClick={() => handleVideoClick(videos[1])}
                className="group relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl"
              >
                <img
                  src="/lanlogo.jpg"
                  alt="Testimonial video"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 to-transparent" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-10 h-10 text-gray-900 fill-gray-900 ml-1" />
                  </div>
                </div>

                {/* Name at Bottom */}
                <div className="absolute bottom-8 left-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-950 to-blue-950 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    LAN
                  </div>
                  <span className="text-blue-950 font-bold text-xl">LAN Library</span>
                </div>
              </button>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Best exchange rates</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The platform is intuitive, seamless and easy to use. It is also the platform with the best prices for buying books and materials.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <span className="font-semibold text-gray-900">Banji</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Seamless for Purchases</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  LAN Library has been helping me since last year that I found it, I don't have to stress about finding books anymore as it comes quickly and very fast.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <span className="font-semibold text-gray-900">Blessing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-950 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of sellers making money with their knowledge. Get 80% revenue share on every sale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigateToSignIn('seller')}
              className="px-10 py-4 bg-white text-blue-950 font-black rounded-lg hover:bg-gray-100 transition-all shadow-xl text-lg"
            >
              Start Selling Now
            </button>
            <button
              onClick={() => navigateToSignIn()}
              className="px-10 py-4 border-2 border-white text-white font-black rounded-lg hover:bg-white/10 transition-all text-lg"
            >
              Browse Books
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-black mb-2">80%</div>
              <div className="text-blue-200">Revenue Share</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">90M+</div>
              <div className="text-blue-200">Global Reach</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2">24/7</div>
              <div className="text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white text-blue-950 px-4 py-2 rounded-lg font-black text-xl">LAN</div>
                <span className="font-bold text-lg">Library</span>
              </div>
              <p className="text-gray-400">Global marketplace for academic excellence</p>
            </div>

            <div>
              <h3 className="font-bold mb-4">For Students</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigateToSignIn()} className="hover:text-white">Browse Books</button></li>
                <li><button onClick={() => navigateToSignIn()} className="hover:text-white">Categories</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">For Sellers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigateToSignIn('seller')} className="hover:text-white">Start Selling</button></li>
                <li><button onClick={() => navigateToSignIn('seller')} className="hover:text-white">Pricing</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setShowWhatIsLanModal(true)} className="hover:text-white">About Us</button></li>
                <li><Link href="/lan/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/lan/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {currentYear} LAN Library - Learning Access Network. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 z-[110] bg-white/10 hover:bg-white/20 p-3 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="w-full h-full max-w-5xl max-h-[80vh]">
            <video
              src={selectedVideo.videoUrl}
              title={selectedVideo.title}
              className="w-full h-full rounded-lg"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      <WhatIsLanModal
        isOpen={showWhatIsLanModal}
        onClose={() => setShowWhatIsLanModal(false)}
      />
    </div>
  );
}