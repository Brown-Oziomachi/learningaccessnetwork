"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Menu,
  X,
  Monitor,
  Upload,
  Smartphone,
  ChevronDown,
  Download,
  LogOut,
  AlignEndVertical,
  Bookmark,
  Globe,
  Book,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { booksData } from "@/lib/booksData";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingSeller, setCheckingSeller] = useState(true);

  // Fetch all books (from booksData + Firestore)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(
          collection(db, "advertMyBook"),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);

        const firestoreBooks = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreBooks.push({
            id: `firestore-${docSnap.id}`,
            title: data.bookTitle,
            author: data.author,
            category: data.category,
            price: data.price,
            rating: 4.5,
          });
        });

        setAllBooks([...booksData, ...firestoreBooks]);
      } catch (error) {
        console.error("Error fetching books:", error);
        setAllBooks(booksData);
      }
    };

    fetchBooks();
  }, []);

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
      } else {
        console.log("User document not found");
        setIsSeller(false);
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
      setIsSeller(false);
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
    console.log("Button clicked, isSeller:", isSeller);

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
  // Group books by category
  const getBooksByCategory = (categoryName) => {
    return allBooks
      .filter((book) =>
        book.category?.toLowerCase().includes(categoryName.toLowerCase())
      )
      .slice(0, 6);
  };

  const menuCategories = {
    education: {
      title: "Education Documents",
      description:
        "Explore educational materials, study guides, and academic resources",
      books: getBooksByCategory("education"),
    },
    business: {
      title: "Business Documents",
      description:
        "Looking to take your organization to new heights? Use our extensive library of business documents",
      books: getBooksByCategory("business"),
    },
    technology: {
      title: "Technology Documents",
      description:
        "Discover programming guides, tech tutorials, and software development resources",
      books: getBooksByCategory("technology"),
    },
    science: {
      title: "Science Documents",
      description:
        "Access scientific papers, research materials, and academic studies",
      books: getBooksByCategory("science"),
    },
    personal: {
      title: "Personal Development",
      description:
        "Improve yourself with self-help books, productivity guides, and wellness resources",
      books: getBooksByCategory("personal"),
    },
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  <div className="bg-gray-50 py-16">
    <div className="max-w-5xl mx-auto px-4 text-center">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
        Share the wealth <span className="text-gray-700">[of knowledge]</span>.
      </h2>

      <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
        Turn your books into income. Upload your work, reach a global audience{" "}
        <span className="font-medium text-gray-900">[90M+]</span>, and earn
        whenever readers discover and purchase your content.
      </p>

      <div className="bg-white rounded-xl shadow-lg py-16 flex flex-col items-center justify-center">
        <div className="flex items-center gap-8 mb-8 text-gray-800">
          <Monitor size={64} strokeWidth={1.5} />
          <Upload size={48} strokeWidth={2} />
          <Smartphone size={56} strokeWidth={1.5} />
        </div>

        <button
          onClick={HandleClick}
          disabled={checkingSeller}
          className="bg-blue-950 hover:bg-blue-800 text-white px-8 py-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          {checkingSeller ? (
            <>
              <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" />
              Loading...
            </>
          ) : isSeller ? (
            <>
              <Upload size={20} />
              Upload Document
            </>
          ) : (
            "Become a Seller"
          )}
        </button>

        {/* Optional: Show seller status */}
        {!checkingSeller && isSeller && (
          <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            You're a verified seller
          </p>
        )}
      </div>
    </div>
  </div>;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const handleMobileMenuClick = (category) => {
    setMobileSubmenu(mobileSubmenu === category ? null : category);
  };

  return (
    <>
      <header className="bg-blue-950 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <Link href="/">
          <div className="bg-white flex items-center justify-center gap-2 text-blue-950 py-2">
            <h1 className="text-sm">2026 latest book</h1>
            <ChevronRight size={16} />
          </div>
        </Link>

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-50"
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowMobileSearch(false);
              }}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              href="/home"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-50">
                [LAN Library]
              </h1>
            </Link>

            <button
              onClick={() => {
                setShowMobileSearch(!showMobileSearch);
                setShowMobileMenu(false);
              }}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-50"
            >
              <Search size={22} />
            </button>

            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search PDF books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-white text-gray-900 placeholder-gray-400 px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <Link
                href="/my-books"
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <Book size={18} />
                <span>My Books</span>
              </Link>
              <Link
                href="/my-account"
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <User size={18} />
                <span>My Account</span>
              </Link>
              <Link
                href="/saved-my-book"
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <Bookmark size={18} />
                <span>Saved</span>
              </Link>

              <button
                onClick={HandleClick}
                disabled={checkingSeller}
                className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-4 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {checkingSeller ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : isSeller ? (
                  <>
                    <Upload size={20} />
                    Upload Document
                  </>
                ) : (
                  <>Become a Seller</>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
              >
                <LogOut size={18} className="lg:w-5 lg:h-5" />
                <span className=" lg:inline">Logout</span>
              </button>
            </nav>
          </div>

          {showMobileSearch && (
            <div className="mt-3 md:hidden animate-slideDown">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search PDF books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full text-gray-900 px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Categories Bar */}
        <div className="hidden md:block bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1">
              <Link
                href="/about/lan"
                className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
              >
                What is LAN Library?
              </Link>

              {/* Education Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("education")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-blue-950 w-full hover:bg-gray-100 flex items-center gap-1">
                  Education{" "}
                  <ChevronDown
                    size={14}
                    className={
                      activeDropdown === "education" ? "rotate-180" : ""
                    }
                  />
                </button>
                {activeDropdown === "education" &&
                  menuCategories.education.books.length > 0 && (
                    <div className="absolute lg:-left-0 top-full mx-auto w-screen lg:max-w-7xl bg-white text-blue-950 border border-gray-200 shadow-lg py-6 px-8 animate-slideDown">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.education.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.education.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {menuCategories.education.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.title}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h5>
                              <p className="text-xs text-gray-600">
                                Added by {book.author}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/category/education"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        All Education Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              {/* Business Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("business")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                  Business{" "}
                  <ChevronDown
                    size={14}
                    className={
                      activeDropdown === "business" ? "rotate-180" : ""
                    }
                  />
                </button>
                {activeDropdown === "business" &&
                  menuCategories.business.books.length > 0 && (
                    <div className="absolute lg:-left-50 top-full w-screen lg:max-w-7xl text-blue-950 bg-white border border-gray-200 shadow-lg py-6 px-8 animate-slideDown">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.business.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.business.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {menuCategories.business.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.title}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h5>
                              <p className="text-xs text-gray-600">
                                Added by {book.author}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/category/business"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        All Business Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              {/* Technology Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("technology")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                  Technology{" "}
                  <ChevronDown
                    size={14}
                    className={
                      activeDropdown === "technology" ? "rotate-180" : ""
                    }
                  />
                </button>
                {activeDropdown === "technology" &&
                  menuCategories.technology.books.length > 0 && (
                    <div className="absolute lg:-left-50 top-full w-screen lg:max-w-7xl text-blue-950 bg-white border border-gray-200 shadow-lg py-6 px-8 animate-slideDown">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.technology.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.technology.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {menuCategories.technology.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h5>
                              <p className="text-xs text-gray-600">
                                Added by {book.author}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/category/technology"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        All Technology Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              {/* Science Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("science")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                  Science{" "}
                  <ChevronDown
                    size={14}
                    className={activeDropdown === "science" ? "rotate-180" : ""}
                  />
                </button>
                {activeDropdown === "science" &&
                  menuCategories.science.books.length > 0 && (
                    <div className="absolute lg:-left-70 top-full w-screen lg:max-w-7xl text-blue-950 bg-white border border-gray-200 shadow-lg py-6 px-8 animate-slideDown">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.science.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.science.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {menuCategories.science.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h5>
                              <p className="text-xs text-gray-600">
                                Added by {book.author}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/category/science"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        All Science Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              {/* Personal Development Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("personal")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                  Personal Growth{" "}
                  <ChevronDown
                    size={14}
                    className={
                      activeDropdown === "personal" ? "rotate-180" : ""
                    }
                  />
                </button>
                {activeDropdown === "personal" &&
                  menuCategories.personal.books.length > 0 && (
                    <div className="absolute lg:-left-100 top-full w-screen lg:max-w-7xl text-blue-950 bg-white border border-gray-200 shadow-lg py-6 px-8 animate-slideDown">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.personal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.personal.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {menuCategories.personal.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h5>
                              <p className="text-xs text-gray-600">
                                Added by {book.author}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/category/personal-development"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        All Personal Development Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              <Link
                href="/pdf"
                className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
              >
                All Documents
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-white z-50 md:hidden overflow-y-auto text-blue-950">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                [LAN Library]
              </h1>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {mobileSubmenu === null ? (
              <div className="space-y-2 text-blue-950">
                <button
                  onClick={HandleClick}
                  disabled={checkingSeller}
                  className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-4 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {checkingSeller ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : isSeller ? (
                    <>
                      <Upload size={20} />
                      Upload Document
                    </>
                  ) : (
                    <>Become a Seller</>
                  )}
                </button>
                <Link
                  href="/my-books"
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <Book size={18} />
                  <span>My Books</span>
                </Link>
                <Link
                  href="/my-account"
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <User size={18} />
                  <span>My Account</span>
                </Link>
                <Link
                  href="/saved-my-book"
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <Bookmark size={18} />
                  <span>Saved</span>
                </Link>
                <Link
                  href="/lan/net/help-center"
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  <User size={20} />
                  <span>FAQ and support</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 lg:gap-2 px-5 bg-red-700 lg:px-3 py-2 text-white hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
                >
                  <LogOut size={18} className="lg:w-5 lg:h-5" />
                  <span>Logout</span>
                </button>

                <div className="border-t border-gray-200 my-4 pt-4">
                  <button
                    onClick={() => router.push("/lan/net/help-center")}
                    className="text-sm font-semibold text-gray-500 mb-2 px-4"
                  >
                    What is LAN Library?
                  </button>

                  {Object.keys(menuCategories).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleMobileMenuClick(key)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-100 rounded-lg"
                    >
                      <span>
                        {menuCategories[key].title.replace(" Documents", "")}
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  ))}

                  <Link
                    href="/pdf"
                    className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
                  >
                    All Documents
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setMobileSubmenu(null)}
                  className="flex items-center gap-2 mb-4 text-gray-700"
                >
                  <ChevronRight size={20} className="rotate-180" />
                  <span>Back</span>
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {menuCategories[mobileSubmenu]?.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {menuCategories[mobileSubmenu]?.description}
                </p>

                <div className="space-y-3">
                  {menuCategories[mobileSubmenu]?.books.map((book) => (
                    <Link
                      key={book.id}
                      href={`/book/preview?id=${book.id}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md"
                    >
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm line-clamp-2 mb-1">
                          {book.title}
                        </h5>
                        <p className="text-xs text-gray-600">
                          by {book.author}
                        </p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/category/${mobileSubmenu}`}
                    onClick={() => setShowMobileMenu(false)}
                    className="block text-center text-blue-600 font-semibold py-2"
                  >
                    View All {menuCategories[mobileSubmenu]?.title} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
