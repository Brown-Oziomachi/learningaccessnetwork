"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoriesWithImages } from "@/lib/categoriesData";

export default function MobileCategoriesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Group categories into slides of 4 (2 columns x 2 rows = 4 per slide)
  const categoriesPerSlide = 4;
  const slides = [];
  for (let i = 0; i < categoriesWithImages.length; i += categoriesPerSlide) {
    slides.push(categoriesWithImages.slice(i, i + categoriesPerSlide));
  }

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      nextSlide();
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right
      prevSlide();
    }
  };

  // Convert category name to URL slug
  const getCategorySlug = (categoryName) => {
    return categoryName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-");
  };

  return (
    <div className="lg:hidden px-4 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Browse by Category
      </h2>

      <div className="relative">
        {/* Carousel Container */}
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, slideIndex) => (
              <div
                key={slideIndex}
                className="min-w-full grid grid-cols-2 gap-4"
              >
                {slide.map((category) => (
                  <Link
                    key={category.name}
                    href={`/category/${getCategorySlug(category.name)}`}
                    className="group bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Text Content - Top Section (like desktop) */}
                    <div className="p-4 bg-gray-100">
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {category.name}
                      </h3>
                      {/* <p className="text-xs text-gray-600">
                        {category.subcategories} categories
                      </p> */}
                    </div>

                    {/* Image - Bottom Section (like desktop) */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg z-10 disabled:opacity-50"
              aria-label="Previous slide"
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg z-10 disabled:opacity-50"
              aria-label="Next slide"
              disabled={currentSlide === totalSlides - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-blue-950" : "w-2 bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide Counter */}
        <div className="text-center mt-3 text-sm text-gray-600">
          {currentSlide + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
}
