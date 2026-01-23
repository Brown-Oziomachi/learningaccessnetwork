"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  HelpCircle,
  Crown,
  School2Icon,
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
import WhatIsLanModal from "./WhatIsLanModal";

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWhatIsLanModal, setShowWhatIsLanModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const router = useRouter();
  const [isSeller, setIsSeller] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [userRole, setUserRole] = useState(null);

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
        setUserRole(userData.role || null); // ✅ Add this line
      } else {
        console.log("User document not found");
        setIsSeller(false);
        setUserRole(null); // ✅ Add this line
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
      setIsSeller(false);
      setUserRole(null); // ✅ Add this line
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

  
      const handleLogout = async () => {
          try {
              await signOut(auth);
              router.push('/');
          } catch (error) {
              console.error("Logout error:", error);
              alert("Failed to logout. Please try again.");
          }
      };

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

  const handleMyAccountClick = async () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        router.push("/role-selection");
        return;
      }

      const data = snap.data();

      // 👇 NO ROLE YET
      if (!data.role || data.role === "") {
        router.push("/role-selection");
        return;
      }

      // 👇 ROLE ROUTING
      if (data.role === "student") {
        router.push("/student/dashboard");
      } else if (data.role === "seller" || data.isSeller) {
        router.push("/my-account/seller-account");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err) {
      console.error(err);
      router.push("/student/dashboard");
    }
  };


 const menuCategories = useMemo(() => {
  const categories = {
    education: {
      title: "Education Documents",
      description: "Explore educational materials, study guides, and academic resources",
      books: getBooksByCategory("education"),
    },
    business: {
      title: "Business Documents",
      description: "Looking to take your organization to new heights? Use our extensive library of business documents",
      books: getBooksByCategory("business"),
    },
    technology: {
      title: "Technology Documents",
      description: "Discover programming guides, tech tutorials, and software development resources",
      books: getBooksByCategory("technology"),
    },
    science: {
      title: "Science Documents",
      description: "Access scientific papers, research materials, and academic studies",
      books: getBooksByCategory("science"),
    },
    personal: {
      title: "Personal Development",
      description: "Improve yourself with self-help books, productivity guides, and wellness resources",
      books: getBooksByCategory("personal"),
    },
    sexeducation: {
      title: "Sex Education",
      description: "Learn everything you need to know about sex education through peoples experience",
      books: getBooksByCategory("sex education"),
    },
    relationship: {
      title: "Relationships",
      description: "Discover the book written by relation therapist on LAN Library",
      books: getBooksByCategory("relationship"),
    },
  };
  
  // Debug log
  console.log("=== MENU CATEGORIES CREATED ===");
  Object.entries(categories).forEach(([key, value]) => {
    console.log(`${key}: ${value.books.length} books`);
  });
  
  return categories;
}, [allBooks]);

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
        <Link href="/latest/documentations" className="no-underline">
          <div className="bg-white flex items-center justify-center gap-2 text-blue-950 ">
            <h1 className=" font-bold text-lg">Recently Published...</h1>
            <ChevronRight size={16} />
          </div>
        </Link>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-50"
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
              <div>
                <h1
                  className="text-4xl sm:text-3xl font-bold text-gray-50"
                  style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                >
                  [LAN Library]
                </h1>
                <h2
                  className="text-xs sm:text-base font-light"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Digital Platform For Knowledge Access
                </h2>
              </div>
            </Link>

            <button
              onClick={() => {
                setShowMobileSearch(!showMobileSearch);
                setShowMobileMenu(false);
              }}
              className="p-2 bg-white text-blue-950 rounded-lg cursor-pointer hover:bg-blue-950 hover:text-white"
            >
              <Search size={22} />
            </button>

            <nav className="hidden lg:flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <Link
                href="/my-books"
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <Book size={18} />
                <span>My Books</span>
              </Link>
              <button
                onClick={handleMyAccountClick}
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <User size={18} />
                <span>My Account</span>
              </button>
              <Link
                href="/bestsellers"
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 hover:text-blue-950 rounded-lg text-sm text-gray-50"
              >
                <Crown size={18} />
                <span>Bestsellers</span>
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
                className="text-blue-950 hover:bg-blue-950 transition-colors cursor-pointer bg-white font-semibold px-8 py-2 hover:text-white rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              {/* <Link
                href="/register-school"
                className="text-blue-950 hover:bg-blue-950 transition-colors bg-white font-semibold px-8 py-2 hover:text-white rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <School2Icon size={18} />
                <span>Register School</span>
              </Link> */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 lg:gap-2 px-2 cursor-pointer lg:px-3 py-2 bg-red-800 text-white hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
              >
                <LogOut size={18} className="lg:w-5 lg:h-5" />
                <span className=" lg:inline">Logout</span>
              </button>
            </nav>
          </div>

          {showMobileSearch && (
            <div className="mt-3 animate-slideDown">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search PDF books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full text-gray-900 bg-white px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="hidden lg:block bg-gray-50 border-t border-gray-200 ">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowWhatIsLanModal(true)}
                className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
              >
                What is LAN Library?
              </button>

              {/* Education Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("education")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-blue-950 w-full hover:bg-gray-100 flex items-center gap-1 ">
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
                    <div className="absolute top-full mx-auto z-50 bg-white text-blue-950">
                      <div className="bg-white  p-6 mx-auto w-200 text-blue-950">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.education.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.education.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3 p-6">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4 p-6">
                        {menuCategories.education.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden  transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline p-6"
                      >
                        All Education Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

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

                {/* Remove the books.length check here */}
                {activeDropdown === "business" && (
                  <div className="absolute top-full mx-auto z-50 bg-white text-blue-950">
                    <div className="bg-white  p-6 mx-auto w-200 text-blue-950">
                      <h3 className="text-lg font-bold text-gray-900">
                        {menuCategories.business.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {menuCategories.business.description}
                      </p>
                    </div>

                    {/* Check length inside the dropdown */}
                    {menuCategories.business.books.length > 0 ? (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-3 p-6">
                          Documents recommended for you
                        </h4>
                        <div className="grid grid-cols-3 gap-4 p-6">
                          {menuCategories.business.books.map((book) => (
                            <Link
                              key={book.id}
                              href={`/book/preview?id=${book.id}`}
                              onClick={() => setActiveDropdown(null)}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <div className="p-3">
                                <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
                          className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline p-6"
                        >
                          All Business Documents{" "}
                          <ChevronRight size={14} className="inline" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No documents available in this category yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

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

                {/* Remove the books.length check here */}
                {activeDropdown === "technology" && (
                  <div className="absolute top-full mx-auto z-50 bg-white text-blue-950">
                    <div className="bg-white  p-6 mx-auto w-200 text-blue-950">
                      <h3 className="text-lg font-bold text-gray-900">
                        {menuCategories.technology.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {menuCategories.technology.description}
                      </p>
                    </div>

                    {/* Check length inside the dropdown */}
                    {menuCategories.technology.books.length > 0 ? (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-3 p-6">
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
                                <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
                          className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline p-6"
                        >
                          All Technology Documents{" "}
                          <ChevronRight size={14} className="inline" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 p-6">
                        No documents available in this category yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

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

                {/* Remove the books.length check here */}
                {activeDropdown === "science" && (
                  <div className="absolute top-full mx-auto z-50 bg-white text-blue-950">
                    <div className="bg-white  p-6 mx-auto w-200 text-blue-950">
                      <h3 className="text-lg font-bold text-gray-900">
                        {menuCategories.science.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {menuCategories.science.description}
                      </p>
                    </div>

                    {/* Check length inside the dropdown */}
                    {menuCategories.science.books.length > 0 ? (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-3 p-6">
                          Documents recommended for you
                        </h4>
                        <div className="grid grid-cols-3 gap-4 p-6">
                          {menuCategories.science.books.map((book) => (
                            <Link
                              key={book.id}
                              href={`/book/preview?id=${book.id}`}
                              onClick={() => setActiveDropdown(null)}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <div className="p-3">
                                <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
                          className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline p-6"
                        >
                          All Science Documents{" "}
                          <ChevronRight size={14} className="inline" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 p-6">
                        No documents available in this category yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("sex-education")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                  Sex Education{" "}
                  <ChevronDown
                    size={14}
                    className={
                      activeDropdown === "sex-education" ? "rotate-180" : ""
                    }
                  />
                </button>
                {activeDropdown === "sex-education" && // ✅ Fixed here
                  menuCategories.sexeducation.books.length > 0 && (
                    <div className="absolute top-full mx-auto z-50 bg-white text-blue-950">
                      <div className="bg-white  p-6 mx-auto w-200 text-blue-950">
                        <h3 className="text-lg font-bold text-gray-900">
                          {menuCategories.sexeducation.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {menuCategories.sexeducation.description}
                        </p>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-3 p-6">
                        Documents recommended for you
                      </h4>
                      <div className="grid grid-cols-3 gap-4 p-6">
                        {menuCategories.sexeducation.books.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/preview?id=${book.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
                        href="/category/sex-education"
                        className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline p-6"
                      >
                        All Sex Education Documents{" "}
                        <ChevronRight size={14} className="inline" />
                      </Link>
                    </div>
                  )}
              </div>

              <Link
                href="/documents"
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
        <div className="fixed inset-0 bg-white z-50 lg:hidden overflow-y-auto text-blue-950 max-w-90">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6 ">
              <Link
                href="/home"
                className="flex items-center gap-2 flex-shrink-0"
              >
                <div>
                  <h1
                    className="text-4xl sm:text-3xl font-bold text-blue-950"
                    style={{
                      fontFamily: "'Playfair Display', 'Georgia', serif",
                    }}
                  >
                    [LAN Library]
                  </h1>
                  <h2
                    className="text-xs sm:text-base font-light"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Digital Platform For Knowledge Access
                  </h2>
                </div>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {mobileSubmenu === null ? (
              <div className="space-y-5 text-blue-950">
                <button
                  onClick={HandleClick}
                  disabled={checkingSeller}
                  className="bg-blue-950 hover:bg-blue-800 transition-colors text-white font-semibold px-8 py-4 rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                {/* <Link
                  href="/register-school"
                  className="text-blue-950 hover:bg-blue-800 transition-colors bg-white font-semibold px-8 py-2 hover:text-white rounded-lg shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <School2Icon size={18} />
                  <span>Register School</span>
                </Link> */}
                <Link
                  href="/my-books"
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <Book size={18} />
                  <span>My Books</span>
                </Link>
                <button
                  onClick={handleMyAccountClick}
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <User size={18} />
                  <span>My Account</span>
                </button>
                <Link
                  href="/bestsellers"
                  className="flex items-center gap-3 w-full px-4 py-1 hover:bg-gray-100 rounded-lg"
                >
                  <Crown size={16} />
                  Bestsellers
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
                  <HelpCircle size={20} />
                  <span>FAQ and support</span>
                </Link>

                <div className="border-t border-blue-950 my-4 pt-4">
                  <button
                    onClick={() => {
                      setShowWhatIsLanModal(true);
                      setShowMobileMenu(false);
                    }}
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
                    href="/documents"
                    className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
                  >
                    All Documents
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 mt-10 ml-auto lg:gap-2 px-5 bg-red-700 lg:px-3 py-2  text-white hover:bg-red-900/30 rounded-lg transition-colors text-sm lg:text-base"
                >
                  <LogOut size={18} className="lg:w-5 lg:h-5" />
                  <span>Logout</span>
                </button>
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
                        <h5 className="font-semibold text-sm line-clamp-2 mb-1 break-words overflow-hidden">
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
      {/* What is LAN Library Modal */}
      <WhatIsLanModal
        isOpen={showWhatIsLanModal}
        onClose={() => setShowWhatIsLanModal(false)}
      />
    </>
  );
}
