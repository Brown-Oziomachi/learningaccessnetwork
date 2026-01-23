"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// Left menu items
const leftMenu = [
  "Explore",
];

// All genres
const genres = [
  "Art",
  "Biography",
  "Business",
  "Children's",
  "Christian",
  "Classics",
  "Comics",
  "Cookbooks",
  "Ebooks",
  "Fantasy",
  "Fiction",
  "Graphic Novels",
  "Historical Fiction",
  "History",
  "Horror",
  "Memoir",
  "Music",
  "Mystery",
  "Nonfiction",
  "Poetry",
  "Psychology",
  "Romance",
  "Science",
  "Science Fiction",
  "Self Help",
  "Sports",
  "Thriller",
  "Travel",
  "Young Adult",
];

// Slugify for URLs
const slugify = (text) =>
  text.toLowerCase().replace(/'/g, "").replace(/ & /g, "-").replace(/ /g, "-");

export default function BrowseMegaMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Genres");
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 font-medium hover:text-blue-300"
      >
        Browse all
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Mega Menu */}
      {open && (
        <div className="absolute top-full left-0 mt-2 text-blue-950 overflow-y-auto w-full bg-white border rounded-lg shadow-xl z-50">
          {/* Left Panel */}
          <div className="w-48 border-r p-4 space-y-1">
            {leftMenu.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`block w-full text-left px-3 py-2 rounded text-sm ${
                  active === item
                    ? "bg-gray-100 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[400px]">
            <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase">
              Genres
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/category/${slugify(genre)}`}
                  className="text-gray-700 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {genre}
                </Link>
              ))}
              {/* More Genres */}
              <Link
                href="/categories"
                className="font-medium text-blue-600 hover:underline mt-2 block col-span-full"
              >
                More Genres
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
