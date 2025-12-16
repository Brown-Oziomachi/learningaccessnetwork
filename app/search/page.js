"use client";

import { booksData } from "@/lib/booksData";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q")?.toLowerCase() || "";

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        if (!q) {
            setResults([]);
            setLoading(false);
            return;
        }

        const filtered = booksData.filter(
            (book) =>
                book.title?.toLowerCase().includes(q) ||
                book.author?.toLowerCase().includes(q) ||
                book.type?.toLowerCase().includes(q)
        );

        setResults(filtered);
        setLoading(false);
    }, [q]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-950">
                Search Results for: "{q}"
            </h2>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin h-10 w-10 border-b-2 border-blue-950 rounded-full"></div>
                </div>
            ) : results.length === 0 ? (
                <p className="text-gray-600">No results found.</p>
            ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative">
                                <img
                                    src={book.imageUrl || "/placeholder-book.png"}
                                    alt={book.title}
                                    className="w-full h-48 object-cover"
                                />
                                {book.discount && (
                                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                        -{book.discount}%
                                    </span>
                                )}
                                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2h12v20H6V2zm2 2v16h8V4H8z" />
                                    </svg>
                                    PDF
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col gap-1">
                                <h3 className="font-semibold text-lg text-blue-950">{book.title}</h3>
                                {book.author && (
                                    <p className="text-gray-600 text-sm">{book.author}</p>
                                )}
                                {book.pages && (
                                    <p className="text-gray-500 text-sm">{book.pages} pages</p>
                                )}

                                {book.rating && (
                                    <p className="text-yellow-400 text-sm flex items-center gap-1">
                                        {"★".repeat(Math.floor(book.rating))}
                                        {"☆".repeat(5 - Math.floor(book.rating))}
                                        <span className="text-gray-600 text-xs">({book.reviews})</span>
                                    </p>
                                )}

                                <div className="mt-2 flex items-center gap-2">
                                    <span className="font-bold text-blue-950 text-lg">
                                        ₦ {book.price?.toLocaleString()}
                                    </span>
                                    {book.oldPrice && (
                                        <span className="text-gray-400 line-through text-sm">
                                            ₦ {book.oldPrice?.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <button className="mt-3 w-full bg-blue-950 text-white py-2 rounded hover:bg-blue-800 transition">
                                    Purchase & Access
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
