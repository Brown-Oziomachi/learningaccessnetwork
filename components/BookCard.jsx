"use client";
import { Download, Lock, FileText } from "lucide-react";

export default function BookCard({
  book,
  isPurchased,
  onPurchase,
  onDownload,
}) {
  return (
    <div
      className="
        flex-none snap-start
        w-[55.333%] sm:w-[180px] lg:w-auto
        bg-white border border-gray-200 rounded-lg
        overflow-hidden hover:shadow-lg transition-shadow
      "
    >
      {/* Image */}
      <div className="relative">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-52 sm:h-64 object-cover"
        />

        <span className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <FileText size={14} />
          PDF
        </span>

        {book.discount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
            {book.discount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
          {book.title}
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 mb-1">
          {book.author}
        </p>

        <p className="text-xs text-gray-500 mb-2">
          {book.pages} pages
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-xs sm:text-sm">
            {"★".repeat(Math.floor(book.rating))}
            {"☆".repeat(5 - Math.floor(book.rating))}
          </div>
          <span className="text-xs text-gray-600">
            ({book.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-base sm:text-xl font-bold text-gray-900">
            ₦ {book.price.toLocaleString()}
          </span>
          {book.oldPrice && (
            <span className="text-xs sm:text-sm text-gray-500 line-through">
              ₦ {book.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Action */}
        {isPurchased(book.id) ? (
          <button
            onClick={() => onDownload(book)}
            className="w-full bg-green-600 text-white py-2 text-xs sm:text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
        ) : (
          <button
            onClick={() => onPurchase(book)}
            className="w-full bg-blue-950 text-white py-2 text-xs sm:text-sm rounded hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Purchase
          </button>
        )}
      </div>
    </div>
  );
}
