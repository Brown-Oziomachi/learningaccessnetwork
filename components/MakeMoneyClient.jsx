"use client";

import { useState } from "react";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  X,
} from "lucide-react";
import Link from "next/link";

export default function MakeMoneyPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const currentYear = new Date().getFullYear()
  const videos = [
    {
      id: 1,
      title: "Getting Started with LAN Library",
      description:
        "Learn the basics of setting up your account and understanding the platform",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
      duration: "5:30",
    },
    {
      id: 2,
      title: "AI Tools For Writing Books",
      description:
        "Today’s a fantastic time to be writing a book. With a plethora of digital tools and online resources, you can tackle your writing project with ease.",
      thumbnail: "/make.png",
      videoUrl: "/tools.mp4",
      duration: "8:45",
    },
    {
      id: 3,
      title: "Pricing Strategies That Work",
      description:
        "Discover the best pricing strategies to maximize your earnings",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "6:20",
    },
    {
      id: 4,
      title: "Marketing Your Books Effectively",
      description: "Learn how to promote your books and reach more buyers",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "10:15",
    },
    {
      id: 5,
      title: "Understanding Your Earnings",
      description: "How the payment system works and when you get paid",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "7:10",
    },
    {
      id: 6,
      title: "Success Stories & Case Studies",
      description: "Real sellers sharing their success stories and tips",
      thumbnail: "/make.png",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "12:30",
    },
  ];

  const stats = [
    { icon: DollarSign, value: "₦500K+", label: "Average Monthly Earnings" },
    { icon: Users, value: "1,000+", label: "Active Sellers" },
    { icon: BookOpen, value: "5,000+", label: "Books Sold Monthly" },
    { icon: TrendingUp, value: "85%", label: "Revenue Share" },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Seller Account",
      description:
        "Sign up and complete your seller profile with your bank details. Get approved within 24 hours.",
    },
    {
      number: "02",
      title: "Upload Your Books",
      description:
        "Upload your PDF books with descriptions and set your prices. We accept academic materials, textbooks, and more.",
    },
    {
      number: "03",
      title: "Start Earning",
      description:
        "Every time someone buys your book, you earn 85% of the sale. Withdraw anytime you reach ₦5,000.",
    },
  ];

  const handlePrevious = () => {
    setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
  };

  const getVisibleVideos = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentVideoIndex + i) % videos.length;
      visible.push(videos[index]);
    }
    return visible;
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-white text-blue-950">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-blue-950 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
            <h1
              className="text-4xl sm:text-6xl font-bold text-gray-50"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
            >
              [LAN Library]
              <h2
                className="text-xs sm:text-base font-light"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Digital Platform For Knowledge Access
              </h2>
            </h1>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block bg-blue-950 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
          New
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Make Money
          <br />
          Selling Books
        </h1>
        <p className="text-gray-900 text-xl mb-8 max-w-2xl mx-auto">
          Learn how to write and publish your first book with our comprehensive
          guide. From developing ideas to marketing your finished work, we cover
          every step of the process
        </p>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-blue-950 text-whiterounded-xl p-6 text-center border border-gray-800 hover:border-blue-600 transition-colors"
              >
                <Icon className="w-8 h-8 mx-auto mb-3 text-blue-950 bg-white px-2 py-1 rounded-full" />
                <div className="text-3xl font-bold mb-2 text-white">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Video Carousel Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 shadow-2xl  border border-gray-800 bg-blue-950/90">
        <h2 className="text-4xl font-bold mb-4 text-center text-white ">
          Watch & Learn
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Step-by-step video tutorials to help you succeed
        </p>

        {/* Desktop Carousel */}
        <div className="hidden md:block relative">
          <div className="grid grid-cols-3 gap-6">
            {getVisibleVideos().map((video, index) => (
              <div
                key={video.id}
                className={`transition-all duration-300 ${
                  index === 1 ? "scale-105" : "scale-95 opacity-70"
                }`}
              >
                <div className=" rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-600 transition-all group cursor-pointer">
                  <div
                    className="relative aspect-video "
                    onClick={() => handleVideoClick(video)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity "
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors group-hover:scale-110 transform duration-300">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                      </button>
                    </div>
                    <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full text-sm">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold mb-2 text-blue-950">
                      {video.title}
                    </h3>
                    <p className="text-gray-950 text-sm">{video.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div
            className="overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-4" style={{ width: "max-content" }}>
              {videos.map((video) => (
                <div key={video.id} className="w-[280px] snap-start">
                  <div className="bg-gray-900  overflow-hidden border border-gray-800 cursor-pointer">
                    <div
                      className="relative aspect-video bg-gradient-to-br from-blue-900 to-purple-900"
                      onClick={() => handleVideoClick(video)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </button>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-bold text-blue-950 mb-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-950 text-sm">
                        {video.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentVideoIndex ? "bg-blue-600 w-8" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <div className="bg-blue-950 text-white">
        <section className="max-w-7xl mx-auto px-4 py-16 mt-10">
          <h2 className="text-4xl font-bold mb-4 text-center">How It Works</h2>
          <p className="text-gray-400 text-center mb-12">
            Three simple steps to start earning
          </p>

          <div className=" md:grid-cols-3 gap-1 flex overflow-x-auto max-md:w-full space-x-2 px-  md:space-x-0  md:overflow-visible  md:flex-none  md:px-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative w-80 md:w-auto flex-shrink-0 md:flex-shrink md:mx-0"
              >
                <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50  p-5 border border-blue-600/30 hover:border-blue-600 transition-all group">
                  <div className="text-6xl font-bold text-blue-600/30 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-3xl p-12 border border-blue-600/30">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Why Sell on LAN Library?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Earn 85% of every sale - highest in the industry",
                "No upfront costs or hidden fees",
                "Instant payment processing",
                "Reach thousands of students and professionals",
                "Keep full ownership of your content",
                "24/7 customer support for sellers",
                "Easy-to-use upload system",
                "Detailed sales analytics dashboard",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Start Earning?</h2>
        <p className="text-gray-900 text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of sellers who are already making money with their
          knowledge
        </p>

        <div className="fle flex-col sm:flex-row gap-4 justify-center mx-auto">
          <Link href="/become-seller">
            <button className="bg-blue-950 text-white lg:px-15 lg:py-4 max-md:text-sm max-lg:px-15 max-lg:py-3  rounded-md font-semibold hover:bg-white hover:shadow-2xl hover:text-blue-950 transition-colors">
              BECOME A SELLER
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className=" text-center mx-auto px-4 text-gray-500">
          <p className="">
            &copy; {currentYear} [LAN Library] Learning Access Network. All
            rights reserved.
          </p>{" "}
        </div>
      </footer>

      {/* Full Screen Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeVideoModal}
            className="absolute top-4 right-4 z-[110] w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
          >
            <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Video Title */}
          <div className="absolute top-4 left-4 z-[110] bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <h3 className="text-white font-semibold text-lg">
              {selectedVideo.title}
            </h3>
          </div>

          {/* Video Container */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
            <div className="w-full h-full max-w-7xl max-h-full">
              <iframe
                src={selectedVideo.videoUrl}
                title={selectedVideo.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
