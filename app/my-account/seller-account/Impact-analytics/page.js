"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    collection, query, where, getDocs, getDoc, doc,
    orderBy, limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { useCurrency } from "@/app/context/CurrencyContext";

/* ─── Design Tokens ─────────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── Faculty Title Detection ───────────────────────────────── */
const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

/**
 * True when the user carries a recognised academic title on their user
 * doc or their seller profile. Title holders get automatic access —
 * they never go through the lecturerVerificationStatus flow.
 */
function hasFacultyTitle(user, seller) {
    if (!user) return false;
    return (
        FACULTY_TITLES.includes(user.title) ||
        FACULTY_TITLES.includes(seller?.title)
    );
}

/**
 * True when the user registered via the formal lecturer/role pathway
 * (role: "lecturer" or isLecturer: true). These users must pass the
 * lecturerVerificationStatus check before analytics are unlocked.
 */
function isRoleBasedLecturer(user) {
    if (!user) return false;
    return user.role === "lecturer" || user.isLecturer === true;
}

/**
 * Returns true if the user qualifies as faculty by ANY route:
 * academic title  OR  formal lecturer role.
 */
function isFacultyMember(user, seller) {
    return hasFacultyTitle(user, seller) || isRoleBasedLecturer(user);
}

/* ══════════════════════════════════════════════════════════════
   VERIFIED FACULTY BADGE
══════════════════════════════════════════════════════════════ */
export function VerifiedFacultyBadge({ user, seller, size = "md" }) {
    if (!user) return null;

    // Title holders (Dr., Prof., etc.) are considered verified automatically.
    // Role-based lecturers need isVerified + a non-pending/rejected status.
    const titleHolder = hasFacultyTitle(user, seller);
    const roleLecturer = isRoleBasedLecturer(user);

    const isVerifiedFaculty =
        isFacultyMember(user, seller) &&
        (
            titleHolder ||   // title → automatic
            (
                user.isVerified === true &&
                user.lecturerVerificationStatus !== "pending" &&
                user.lecturerVerificationStatus !== "rejected"
            )
        );

    // Only role-based lecturers who haven't completed verification show "pending"
    const isPending =
        roleLecturer &&
        !titleHolder &&
        user.lecturerVerificationStatus === "pending";

    if (!isVerifiedFaculty && !isPending) return null;

    const sizes = {
        sm: { badge: 14, icon: 10, gap: 4, px: "6px 10px",  text: 9  },
        md: { badge: 16, icon: 12, gap: 5, px: "6px 12px",  text: 10 },
        lg: { badge: 20, icon: 14, gap: 6, px: "8px 16px",  text: 11 },
    };
    const s = sizes[size] || sizes.md;

    const ShieldCheck = ({ sz }) => (
        <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2L4 5.5V11.5C4 16.1 7.4 20.4 12 21.5C16.6 20.4 20 16.1 20 11.5V5.5L12 2Z"
                fill={isPending ? "#f59e0b" : GOLD} opacity={0.18} />
            <path d="M12 2L4 5.5V11.5C4 16.1 7.4 20.4 12 21.5C16.6 20.4 20 16.1 20 11.5V5.5L12 2Z"
                stroke={isPending ? "#f59e0b" : GOLD} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
            {isVerifiedFaculty && (
                <path d="M9 12L11 14L15 10" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {isPending && (
                <text x="12" y="15" textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="700">?</text>
            )}
        </svg>
    );

    return (
        <span
            role="img"
            aria-label={isPending ? "Pending faculty verification" : "Verified faculty"}
            title={isPending
                ? "Faculty verification is pending"
                : `Verified ${seller?.title || user?.title || "Faculty"} — ${user?.department || "Academic Staff"}`}
            style={{
                display: "inline-flex", alignItems: "center", gap: s.gap,
                background: isPending ? "rgba(245,158,11,0.1)" : "rgba(184,150,62,0.13)",
                border: `0.5px solid ${isPending ? "rgba(245,158,11,0.35)" : "rgba(184,150,62,0.35)"}`,
                padding: s.px, borderRadius: "999px", cursor: "default",
                userSelect: "none", verticalAlign: "middle",
            }}
        >
            <ShieldCheck sz={s.icon} />
            <span style={{
                fontSize: s.text, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", fontFamily: "'Lato', sans-serif",
                color: isPending ? "#d97706" : GOLD, lineHeight: 1,
            }}>
                {isPending ? "Pending Verification" : "Verified Faculty"}
            </span>
        </span>
    );
}

/* ══════════════════════════════════════════════════════════════
   CORE ANALYTICS FETCHER
══════════════════════════════════════════════════════════════ */
export async function fetchFacultyAnalytics(uid) {
    console.log("[Analytics] Starting for uid:", uid);

    const results = {
        departmentalReach: 0,
        departmentBreakdown: {},
        courseEngagement: {},
        wishlistCount: 0,
        topCourse: null,
        totalViews: 0,
        totalDownloads: 0,
        wishlistByCountry: {},
        wishlistDetails: [],
        downloadsByDepartment: {},
        downloadsByBook: {},
        courseStudents: [],
        bookFeedback: [],
        physicalInventory: [],
        physicalPendingOrders: [],
        physicalSales: [],
        totalPhysicalSales: 0,
        totalSales: 0,
    };

    try {
        const booksSnap = await getDocs(
            query(collection(db, "advertMyBook"), where("sellerId", "==", uid))
        );
        console.log("[Analytics] advertMyBook docs:", booksSnap.size);

        if (booksSnap.empty) {
            console.warn("[Analytics] No books found for uid:", uid);
        }

        const bookCourseCodes = {};
        const bookTitles      = {};
        const prefixedBookIds = [];
        const unprefixedBookIds = [];

        booksSnap.docs.forEach((d) => {
            const data         = d.data();
            const rawId        = d.id;
            const prefixedId   = `firestore-${rawId}`;
            const unprefixedId = rawId;

            prefixedBookIds.push(prefixedId);
            unprefixedBookIds.push(unprefixedId);

            const title      = data.bookTitle || data.title || "Untitled";
            const courseCode = data.courseCode || "Uncategorised";

            bookCourseCodes[prefixedId]   = courseCode;
            bookCourseCodes[unprefixedId] = courseCode;
            bookTitles[prefixedId]        = title;
            bookTitles[unprefixedId]      = title;

            console.log(`[Analytics] Book: "${title}" | course:${courseCode} | id:${prefixedId}`);
        });

        const normalise = (id) => {
            if (!id) return null;
            const s = String(id).trim();
            return s.startsWith("firestore-") ? s : `firestore-${s}`;
        };

        /* STEP 2 — bookViews */
        const prefixedChunks = [];
        if (prefixedBookIds.length > 0) {
            for (let i = 0; i < prefixedBookIds.length; i += 30)
                prefixedChunks.push(prefixedBookIds.slice(i, i + 30));
        }
        for (const chunk of prefixedChunks) {
            try {
                const viewsSnap = await getDocs(
                    query(collection(db, "bookViews"), where("bookId", "in", chunk))
                );
                console.log("[Analytics] bookViews for chunk:", viewsSnap.size);
                viewsSnap.docs.forEach((d) => {
                    const data      = d.data();
                    const bookId    = normalise(data.bookId) || normalise(d.id);
                    const viewCount = typeof data.count === "number" ? data.count : 1;
                    const cc        = bookCourseCodes[bookId] || "Uncategorised";
                    if (!results.courseEngagement[cc])
                        results.courseEngagement[cc] = { views: 0, downloads: 0, physicalSales: 0, feedback: [] };
                    results.courseEngagement[cc].views += viewCount;
                    results.totalViews += viewCount;
                });
            } catch (e) {
                console.warn("[bookViews] chunk query error:", e.message);
            }
        }

        /* STEP 3 — Full users scan */
        const usersSnap = prefixedBookIds.length > 0
            ? await getDocs(collection(db, "users"))
            : { docs: [] };

        const wishlistUserIds = new Set();
        const lecturerCourses = [
            ...new Set(Object.values(bookCourseCodes))
        ].filter((c) => c !== "Uncategorised");

        for (const userDoc of usersSnap.docs) {
            if (userDoc.id === uid) continue;
            const userData = userDoc.data();

            /* 3a. Digital purchases */
            const purchasedBooks = userData.purchasedBooks || {};
            Object.entries(purchasedBooks).forEach(([, purchase]) => {
                if (!purchase || typeof purchase !== "object") return;
                if (purchase.sellerId !== uid) return;

                const rawBookId =
                    purchase.firestoreId ||
                    (typeof purchase.bookId === "string" ? purchase.bookId : null) ||
                    (typeof purchase.id     === "string" ? purchase.id     : null) ||
                    null;

                const prefixed  = rawBookId ? normalise(rawBookId) : null;
                const bookTitle = (prefixed && bookTitles[prefixed]) || purchase.title || "Unknown";

                const dept =
                    userData.department ||
                    userData.faculty    ||
                    purchase.buyerDepartment ||
                    null;

                if (dept) {
                    results.departmentBreakdown[dept]    = (results.departmentBreakdown[dept]    || 0) + 1;
                    results.downloadsByDepartment[dept]  = (results.downloadsByDepartment[dept]  || 0) + 1;
                }

                const bookKey = prefixed || `title:${bookTitle}`;
                if (!results.downloadsByBook[bookKey]) {
                    results.downloadsByBook[bookKey] = { title: bookTitle, count: 0, physicalCount: 0, departments: {} };
                }
                results.downloadsByBook[bookKey].count += 1;
                if (dept) {
                    results.downloadsByBook[bookKey].departments[dept] =
                        (results.downloadsByBook[bookKey].departments[dept] || 0) + 1;
                }

                const cc = (prefixed && bookCourseCodes[prefixed]) || "Uncategorised";
                if (!results.courseEngagement[cc])
                    results.courseEngagement[cc] = { views: 0, downloads: 0, physicalSales: 0, feedback: [] };
                results.courseEngagement[cc].downloads += 1;
                results.totalDownloads += 1;
            });

            /* 3b. Wishlists */
            const savedBooks   = Array.isArray(userData.savedBooks) ? userData.savedBooks : [];
            const matchedSaved = savedBooks.filter((saved) => {
                if (!saved?.id) return false;
                const norm = normalise(String(saved.id));
                return prefixedBookIds.includes(norm);
            });

            if (matchedSaved.length > 0 && !wishlistUserIds.has(userDoc.id)) {
                wishlistUserIds.add(userDoc.id);
                const country = userData.country || userData.location?.country || "Unknown";
                if (!results.wishlistByCountry[country])
                    results.wishlistByCountry[country] = { count: 0, materials: [] };
                results.wishlistByCountry[country].count += 1;

                matchedSaved.forEach((saved) => {
                    const pfxId = normalise(String(saved.id));
                    const title = bookTitles[pfxId] || saved?.title || "Unknown Book";
                    if (!results.wishlistByCountry[country].materials.includes(title))
                        results.wishlistByCountry[country].materials.push(title);
                    results.wishlistDetails.push({
                        userId:    userDoc.id,
                        userName:  userData.displayName || userData.firstName || "Anonymous",
                        country,
                        bookTitle: title,
                        bookId:    pfxId,
                        savedAt:   saved?.savedAt || null,
                    });
                });
            }

            /* 3c. Course students */
            const enrolled = [
                ...(Array.isArray(userData.enrolledCourses) ? userData.enrolledCourses : []),
                ...(Array.isArray(userData.courses)         ? userData.courses         : []),
            ];
            enrolled.forEach((courseCode) => {
                if (!lecturerCourses.includes(courseCode)) return;
                const alreadyAdded = results.courseStudents.some(
                    (s) => s.userId === userDoc.id && s.courseCode === courseCode
                );
                if (alreadyAdded) return;
                results.courseStudents.push({
                    userId:     userDoc.id,
                    name:       userData.displayName ||
                                `${userData.firstName || ""} ${userData.surname || ""}`.trim() || "Student",
                    email:      userData.email || "",
                    department: userData.department || userData.faculty || "Unknown",
                    university: userData.university || userData.institution || "",
                    courseCode,
                });
            });
        }

        results.wishlistCount = wishlistUserIds.size;
        console.log("[Analytics] totalDownloads:", results.totalDownloads, "wishlist:", results.wishlistCount);

        /* STEP 4 — bookFeedbacks */
        const allIdFormats  = [...new Set([...prefixedBookIds, ...unprefixedBookIds])];
        const feedbackChunks = [];
        if (allIdFormats.length > 0) {
            for (let i = 0; i < allIdFormats.length; i += 30)
                feedbackChunks.push(allIdFormats.slice(i, i + 30));
        }
        const seenFeedbackIds = new Set();

        for (const chunk of feedbackChunks) {
            try {
                const fbSnap = await getDocs(
                    query(collection(db, "bookFeedbacks"), where("bookId", "in", chunk))
                );
                console.log("[Analytics] bookFeedbacks for chunk:", fbSnap.size);
                fbSnap.docs.forEach((d) => {
                    if (seenFeedbackIds.has(d.id)) return;
                    seenFeedbackIds.add(d.id);
                    const data = d.data();
                    const fb   = {
                        id:         d.id,
                        userName:   data.userName   || "Anonymous",
                        userEmail:  data.userEmail  || "",
                        userId:     data.userId     || "",
                        feedback:   data.feedback   || "",
                        bookTitle:
                            data.bookTitle ||
                            bookTitles[normalise(data.bookId)] ||
                            bookTitles[data.bookId] ||
                            "Unknown",
                        bookId:     data.bookId     || "",
                        bookAuthor: data.bookAuthor || "",
                        createdAt:  data.createdAt?.toDate?.() || data.createdAt || null,
                        rating:     data.rating ?? null,
                    };
                    results.bookFeedback.push(fb);
                    const cc = bookCourseCodes[normalise(data.bookId)] ||
                               bookCourseCodes[data.bookId] || "Uncategorised";
                    if (!results.courseEngagement[cc])
                        results.courseEngagement[cc] = { views: 0, downloads: 0, physicalSales: 0, feedback: [] };
                    results.courseEngagement[cc].feedback.push(fb);
                });
            } catch (e) {
                console.warn("[bookFeedbacks] chunk query error:", e.message);
            }
        }

        /* STEP 5 — physicalInventory */
        try {
            const invSnap = await getDocs(
                query(collection(db, "physicalInventory"), where("sellerId", "==", uid))
            );
            console.log("[Analytics] physicalInventory docs:", invSnap.size);
            results.physicalInventory = invSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn("[physicalInventory] query error:", e.message);
        }

        /* STEP 6 — physicalOrders (pending pickup) */
        try {
            const ordersSnap = await getDocs(
                query(
                    collection(db, "physicalOrders"),
                    where("sellerId", "==", uid),
                    where("status",   "==", "pending_pickup")
                )
            );
            console.log("[Analytics] physicalOrders (pending):", ordersSnap.size);
            results.physicalPendingOrders = ordersSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || null,
            }));
        } catch (e) {
            console.warn("[physicalOrders] query error:", e.message);
        }

        /* STEP 7 — physicalSales */
        try {
            const salesSnap = await getDocs(
                query(collection(db, "physicalSales"), where("sellerId", "==", uid))
            );
            console.log("[Analytics] physicalSales docs:", salesSnap.size);
            results.physicalSales = salesSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                soldAt: d.data().soldAt?.toDate?.() || null,
            }));
            results.totalPhysicalSales = results.physicalSales.length;

            results.physicalSales.forEach((sale) => {
                const prefixed  = normalise(sale.bookId);
                const bookTitle = (prefixed && bookTitles[prefixed]) || sale.bookTitle || "Unknown";
                const bookKey   = prefixed || `title:${bookTitle}`;
                if (!results.downloadsByBook[bookKey]) {
                    results.downloadsByBook[bookKey] = { title: bookTitle, count: 0, physicalCount: 0, departments: {} };
                }
                results.downloadsByBook[bookKey].physicalCount =
                    (results.downloadsByBook[bookKey].physicalCount || 0) + 1;
                const cc = (prefixed && bookCourseCodes[prefixed]) || "Uncategorised";
                if (!results.courseEngagement[cc])
                    results.courseEngagement[cc] = { views: 0, downloads: 0, physicalSales: 0, feedback: [] };
                results.courseEngagement[cc].physicalSales =
                    (results.courseEngagement[cc].physicalSales || 0) + 1;
            });
        } catch (e) {
            console.warn("[physicalSales] query error:", e.message);
        }

        /* STEP 8 — Derived totals */
        results.totalSales        = results.totalDownloads + results.totalPhysicalSales;
        results.departmentalReach = Object.values(results.departmentBreakdown).reduce((s, c) => s + c, 0);

        let topScore = -1;
        Object.entries(results.courseEngagement).forEach(([cc, data]) => {
            const score =
                (data.views         || 0) * 1 +
                (data.downloads     || 0) * 3 +
                (data.physicalSales || 0) * 3 +
                (data.feedback?.length || 0) * 2;
            if (score > topScore) { topScore = score; results.topCourse = cc; }
        });

        console.log("[Analytics] DONE →", {
            views:          results.totalViews,
            digitalSales:   results.totalDownloads,
            physicalSales:  results.totalPhysicalSales,
            totalSales:     results.totalSales,
            wishlist:       results.wishlistCount,
            feedback:       results.bookFeedback.length,
            pendingPickups: results.physicalPendingOrders.length,
            topCourse:      results.topCourse,
        });

    } catch (err) {
        console.error("[fetchFacultyAnalytics] Fatal:", err);
    }

    return results;
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR LINK
══════════════════════════════════════════════════════════════ */
export function FacultyAnalyticsSidebarLink({ user, seller, onClick }) {
    const router = useRouter();
    if (!user) return null;

    // Accept any recognised faculty title or the legacy flags
    if (!isFacultyMember(user, seller)) return null;

    const isPending = user.lecturerVerificationStatus === "pending";

    const handleClick = () => {
        if (onClick) onClick();
        router.push("/my-account-seller-account/faculty-analytics");
    };

    return (
        <button
            onClick={handleClick}
            style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px",
                border: `0.5px solid ${isPending ? "rgba(245,158,11,0.25)" : "#e5ddd0"}`,
                background: isPending ? "rgba(245,158,11,0.06)" : "#fff",
                marginBottom: 6, cursor: "pointer", textAlign: "left", transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = GOLD;
                e.currentTarget.style.background  = CREAM;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isPending ? "rgba(245,158,11,0.25)" : "#e5ddd0";
                e.currentTarget.style.background  = isPending ? "rgba(245,158,11,0.06)" : "#fff";
            }}
        >
            <div style={{
                width: 34, height: 34,
                border: `0.5px solid ${isPending ? "rgba(245,158,11,0.3)" : "#e5ddd0"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, background: isPending ? "rgba(245,158,11,0.1)" : CREAM,
            }}>
                <BarChartIcon color={isPending ? "#d97706" : NAVY} />
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isPending ? "#92400e" : NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>
                    Faculty Analytics
                </p>
                <p style={{ fontSize: 11, color: isPending ? "#d97706" : "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                    {isPending ? "Pending verification" : "Dept. reach & engagement"}
                </p>
            </div>
            {isPending ? (
                <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                    background: "rgba(245,158,11,0.15)", color: "#b45309",
                    padding: "3px 8px", borderRadius: 999, fontFamily: "'Lato',sans-serif",
                    textTransform: "uppercase", flexShrink: 0,
                }}>Locked</span>
            ) : (
                <ChevronRight color="#ccc" />
            )}
        </button>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function FacultyAnalyticsPage() {
    const router = useRouter();
    const [user,      setUser]      = useState(null);
    const [seller,    setSeller]    = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const { fmt } = useCurrency();
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (cu) => {
            if (!cu) { router.push("/auth/signin"); return; }
            try {
                const userDoc = await getDoc(doc(db, "users", cu.uid));
                if (!userDoc.exists()) { router.push("/my-account"); return; }

                const userData = { uid: cu.uid, ...userDoc.data() };

                // Fetch seller profile first so we can check seller.title too
                const sellerDoc = await getDoc(doc(db, "sellers", cu.uid));
                const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
                if (sellerData) setSeller(sellerData);

                const isLecturer  = isFacultyMember(userData, sellerData);
                const titleHolder  = hasFacultyTitle(userData, sellerData);
                const roleLecturer = isRoleBasedLecturer(userData);
                const isSeller     = userData.isSeller === true;

                if (!isLecturer && !isSeller) {
                    router.replace("/my-account/seller-account");
                    return;
                }
                setUser(userData);

                // Title holders (Dr., Prof., Engr., etc.) get immediate access —
                // they never go through the lecturerVerificationStatus flow.
                // Role-based lecturers must have isVerified + approved status.
                // Pure sellers always pass (isLecturer is false → !isLecturer = true).
                const isVerified =
                    !isLecturer ||      // pure seller path
                    titleHolder  ||     // Dr. / Prof. / Engr. etc. → instant access
                    (
                        roleLecturer &&
                        userData.isVerified === true &&
                        userData.lecturerVerificationStatus !== "pending" &&
                        userData.lecturerVerificationStatus !== "rejected"
                    );

                if (isVerified) {
                    const data = await fetchFacultyAnalytics(cu.uid);
                    setAnalytics(data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [router]);

    if (loading) return <FullPageSpinner />;
    if (error)   return <PageShell><ErrorBanner message={error} /></PageShell>;

    const isLecturer = isFacultyMember(user, seller);
    const isFaculty  = isLecturer;
    const isPending  = isLecturer && user?.lecturerVerificationStatus === "pending";
    const isRejected = isLecturer && user?.lecturerVerificationStatus === "rejected";

    if (isPending)  return (
        <PageShell user={user} seller={seller} isFaculty={isFaculty}>
            <PendingGate />
        </PageShell>
    );
    if (isRejected) return (
        <PageShell user={user} seller={seller} isFaculty={isFaculty}>
            <RejectedGate reason={user?.verificationRejectedReason} />
        </PageShell>
    );

    return (
        <PageShell user={user} seller={seller} isFaculty={isFaculty}>
            <AnalyticsDashboard analytics={analytics} user={user} seller={seller} isFaculty={isFaculty} />
        </PageShell>
    );
}

/* ─── PageShell ─────────────────────────────────────────────── */
function PageShell({ children, user, seller, isFaculty }) {
    const router = useRouter();
    return (
        <>
            <GlobalStyles />
            <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Lato',sans-serif" }}>
                <div style={{
                    background: NAVY,
                    backgroundImage: "radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)",
                    backgroundSize: "24px 24px",
                    padding: "24px 32px",
                    display: "flex", alignItems: "center", gap: 16,
                }}>
                    <button
                        onClick={() => router.push("/my-account/seller-account")}
                        style={{
                            background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.7)", cursor: "pointer",
                            width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        aria-label="Back to dashboard"
                    >
                        <ChevronLeft color="rgba(255,255,255,0.7)" />
                    </button>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: GOLD, marginBottom: 4,
                            fontFamily: "'Lato',sans-serif",
                        }}>
                            {isFaculty ? "Faculty Portal" : "Seller Portal"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <h1 style={{
                                fontFamily: "'Playfair Display',Georgia,serif",
                                fontSize: "clamp(20px,4vw,28px)", fontWeight: 700,
                                color: "#fff", margin: 0,
                            }}>
                                {isFaculty ? "Faculty Analytics" : "Sales Analytics"}
                            </h1>
                            {user && isFaculty && <VerifiedFacultyBadge user={user} seller={seller} size="sm" />}
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>
                    {children}
                </div>
            </div>
        </>
    );
}

/* ─── Gates ─────────────────────────────────────────────────── */
function PendingGate() {
    const router = useRouter();
    return (
        <div style={{
            background: "#fff", border: "0.5px solid rgba(245,158,11,0.3)",
            padding: "40px 32px", textAlign: "center", maxWidth: 560, margin: "40px auto",
        }}>
            <div style={{
                width: 72, height: 72, margin: "0 auto 20px",
                background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <LockIcon color="#d97706" size={32} />
            </div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: NAVY, margin: "0 0 10px" }}>
                Analytics Locked
            </p>
            <div style={{
                background: "rgba(245,158,11,0.08)", border: "0.5px solid rgba(245,158,11,0.25)",
                padding: "16px 20px", margin: "0 0 24px", textAlign: "left",
            }}>
                <p style={{ fontSize: 13, color: "#92400e", fontFamily: "'Lato',sans-serif", margin: 0, lineHeight: 1.7 }}>
                    Analytics will be unlocked once your faculty credentials are verified by the{" "}
                    <strong style={{ color: "#78350f" }}>Abuja Registry</strong>. This typically takes{" "}
                    <strong style={{ color: "#78350f" }}>24–48 hours</strong> after document submission.
                </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                    onClick={() => router.push("/my-account/seller-account")}
                    style={{
                        background: NAVY, color: "#fff", border: "none", cursor: "pointer",
                        padding: "11px 24px", fontSize: 12, fontWeight: 700,
                        fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
                    }}
                >Back to Dashboard</button>
                <a href="/docs" style={{
                    background: "transparent", color: NAVY, border: `0.5px solid ${NAVY}`,
                    cursor: "pointer", padding: "11px 24px", fontSize: 12, fontWeight: 700,
                    fontFamily: "'Lato',sans-serif", letterSpacing: "0.06em",
                    textDecoration: "none", display: "inline-block",
                }}>Contact Support</a>
            </div>
        </div>
    );
}

function RejectedGate({ reason }) {
    return (
        <div style={{
            background: "#fef2f2", border: "0.5px solid #fecaca",
            padding: "32px", maxWidth: 520, margin: "40px auto", textAlign: "center",
        }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#dc2626", margin: "0 0 10px" }}>
                Verification Not Approved
            </p>
            <p style={{ fontSize: 13, color: "#991b1b", margin: "0 0 16px", lineHeight: 1.7 }}>
                {reason || "Your documents could not be verified at this time."}
            </p>
            <a href="/docs" style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>Contact support →</a>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN ANALYTICS DASHBOARD
══════════════════════════════════════════════════════════════ */
function AnalyticsDashboard({ analytics, user, seller, isFaculty }) {
    const [activeTab, setActiveTab] = useState("overview");

    const a = analytics || {
        departmentalReach: 0, departmentBreakdown: {}, courseEngagement: {},
        wishlistCount: 0, topCourse: null, totalViews: 0,
        totalDownloads: 0, totalPhysicalSales: 0, totalSales: 0,
        wishlistByCountry: {}, wishlistDetails: [], downloadsByDepartment: {},
        downloadsByBook: {}, courseStudents: [], bookFeedback: [],
        physicalInventory: [], physicalPendingOrders: [], physicalSales: [],
    };

    const tabs = [
        { id: "overview",  label: "Overview" },
        { id: "downloads", label: "Digital Sales" },
        { id: "physical",  label: `Physical (${a.totalPhysicalSales})` },
        { id: "wishlist",  label: "Wishlist & Countries" },
        { id: "students",  label: isFaculty ? "Course Students" : "Buyers" },
        { id: "feedback",  label: `Feedback (${a.bookFeedback.length})` },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Welcome strip */}
            <div style={{
                background: "#fff", border: "0.5px solid #e5ddd0",
                padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            }}>
                <img
                    src={user?.photoURL || user?.photoBase64 || "/lan-logo.png"}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }}
                    alt={user?.displayName}
                />
                <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(13px,3.5vw,17px)", fontWeight: 700, color: NAVY, margin: "0 0 4px", lineHeight: 1.3, wordBreak: "break-word" }}>
                            {/* Show the user's title (Dr., Prof., etc.) if available */}
                        {seller?.title || user?.title ? `${seller?.title || user?.title} ` : ""}
                        {user?.firstName} {user?.surname}
                    </p>
                        <p style={{ fontSize: 12, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isFaculty
                            ? `${seller?.department || seller?.university || "Department not set"} · Academic Analytics`
                            : `${seller?.businessInfo?.businessName || seller?.sellerName || `${user?.firstName || ""} ${user?.surname || ""}`.trim() || "Store"} · Sales Analytics`
                        }
                    </p>
                </div>
               <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80, marginLeft: "auto" }}>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,6vw,40px)", fontWeight: 700, color: GOLDD, margin: 0, lineHeight: 1 }}>
                            {a.wishlistCount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(184,150,62,0.5)", fontFamily: "'Lato',sans-serif", margin: "4px 0 0" }}>wishlisted</p>
                </div>
            </div>

            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
                <MetricCard
                    label="Total Sales"
                    sublabel="Digital + Physical"
                    value={a.totalSales.toLocaleString()}
                    icon={<DownloadIcon color={GOLD} />}
                    detail={`${a.totalDownloads} digital · ${a.totalPhysicalSales} physical`}
                />
                <MetricCard
                    label="Total Views"
                    sublabel="Book page visits"
                    value={a.totalViews.toLocaleString()}
                    icon={<BookOpenIcon color={GOLD} />}
                    detail={`Top: ${a.topCourse || "N/A"}`}
                />
                <MetricCard
                    label="Wishlisted"
                    sublabel={isFaculty ? "Students saving your work" : "Users saving your books"}
                    value={a.wishlistCount.toLocaleString()}
                    icon={<HeartIcon color={GOLD} />}
                    detail={`${Object.keys(a.wishlistByCountry).length} countr${Object.keys(a.wishlistByCountry).length !== 1 ? "ies" : "y"}`}
                />
                <MetricCard
                    label="Pending Pickup"
                    sublabel="Physical orders reserved"
                    value={a.physicalPendingOrders.length.toLocaleString()}
                    icon={<PackageIcon color={GOLD} />}
                    detail={`${a.physicalInventory.length} asset(s) at Abuja registry`}
                />
                <MetricCard
                    label={isFaculty ? "Student Reach" : "Buyer Reach"}
                    sublabel={isFaculty ? "Unique dept. buyers" : "Unique dept. purchasers"}
                    value={a.departmentalReach.toLocaleString()}
                    icon={<UsersIcon color={GOLD} />}
                    detail={`${Object.keys(a.departmentBreakdown).length} departments`}
                />
                <MetricCard
                    label="Feedback"
                    sublabel={isFaculty ? "Student reviews" : "Customer reviews"}
                    value={a.bookFeedback.length.toLocaleString()}
                    icon={<StarIcon color={GOLD} />}
                    detail={isFaculty
                        ? `${a.courseStudents.length} enrolled students found`
                        : `Across ${Object.keys(a.downloadsByBook).length} book(s)`}
                />
            </div>

            {/* Tab navigation */}
            <div style={{
                display: "flex", gap: 0, borderBottom: "0.5px solid #e5ddd0",
                background: "#fff", overflowX: "auto",
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "13px 18px", border: "none",
                            borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : "2px solid transparent",
                            background: "transparent", cursor: "pointer", fontSize: 12,
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? NAVY : "#999",
                            fontFamily: "'Lato',sans-serif", letterSpacing: "0.04em",
                            whiteSpace: "nowrap", transition: "all 0.15s",
                        }}
                    >{tab.label}</button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview"  && <OverviewTab  analytics={a} isFaculty={isFaculty} />}
            {activeTab === "downloads" && <DownloadsTab analytics={a} />}
            {activeTab === "physical"  && <PhysicalTab  analytics={a} />}
            {activeTab === "wishlist"  && <WishlistTab  analytics={a} isFaculty={isFaculty} />}
            {activeTab === "students"  && <StudentsTab  analytics={a} isFaculty={isFaculty} />}
            {activeTab === "feedback"  && <FeedbackTab  analytics={a} isFaculty={isFaculty} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: OVERVIEW
══════════════════════════════════════════════════════════════ */
function OverviewTab({ analytics: a, isFaculty }) {
    const courseEntries = Object.entries(a.courseEngagement).sort(
        ([, x], [, y]) =>
            (y.views + y.downloads * 3 + (y.physicalSales || 0) * 3) -
            (x.views + x.downloads * 3 + (x.physicalSales || 0) * 3)
    );
    const deptEntries = Object.entries(a.departmentBreakdown).sort(([, a], [, b]) => b - a);
    const maxDept = deptEntries[0]?.[1] || 1;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>

                {/* Course / Book Breakdown */}
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                    <SectionHeader
                        label="Activity"
                        title={isFaculty ? "Course Breakdown" : "Book Performance"}
                    />
                    {courseEntries.length === 0
                        ? <EmptyState message="No course engagement recorded yet." />
                        : (
                           <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <div style={{ minWidth: 480 }}>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 55px 65px 55px 55px 55px",
                                    gap: 4, padding: "8px 10px",
                                    background: CREAM, borderBottom: "0.5px solid #e5ddd0", marginBottom: 4,
                                }}>
                                    {[isFaculty ? "Course" : "Book / Tag", "Views", "Digital", "Physical", "Reviews", "Total"].map((h) => (
                                        <p key={h} style={{
                                            fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0,
                                            fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            textAlign: h !== (isFaculty ? "Course" : "Book / Tag") ? "right" : "left",
                                        }}>{h}</p>
                                    ))}
                                </div>
                                {courseEntries.slice(0, 10).map(([code, data]) => {
                                    const total        = data.views + data.downloads + (data.physicalSales || 0);
                                    const feedbackCount = data.feedback?.length || 0;
                                    const isTop        = code === a.topCourse;
                                    return (
                                        <div key={code} style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 55px 65px 55px 55px 55px",
                                            gap: 4, padding: "10px 10px",
                                            background: isTop ? "rgba(184,150,62,0.05)" : "#fff",
                                            borderBottom: "0.5px solid #f5f0e8",
                                            borderLeft: isTop ? `3px solid ${GOLD}` : "3px solid transparent",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{code}</p>
                                                {isTop && (
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                                                        background: "rgba(184,150,62,0.15)", color: GOLD,
                                                        padding: "2px 7px", borderRadius: 999, fontFamily: "'Lato',sans-serif",
                                                    }}>Top</span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: 12, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", textAlign: "right" }}>{data.views}</p>
                                            <p style={{ fontSize: 12, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", textAlign: "right" }}>{data.downloads}</p>
                                            <p style={{ fontSize: 12, color: data.physicalSales ? NAVY : "#ccc", margin: 0, fontFamily: "'Lato',sans-serif", textAlign: "right", fontWeight: data.physicalSales ? 700 : 400 }}>
                                                {data.physicalSales || "—"}
                                            </p>
                                            <p style={{
                                                fontSize: 12, color: feedbackCount > 0 ? GOLD : "#ccc", margin: 0,
                                                fontFamily: "'Lato',sans-serif", textAlign: "right",
                                                fontWeight: feedbackCount > 0 ? 700 : 400,
                                            }}>
                                                {feedbackCount > 0 ? `★ ${feedbackCount}` : "—"}
                                            </p>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif", textAlign: "right" }}>{total}</p>
                                        </div>
                                    )
                                })}
                                </div>  
                            </div>
        )}
                </div>

                {/* Departmental Reach */}
                <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                    <SectionHeader label="Reach" title="By Department" />
                    {deptEntries.length === 0
                        ? <EmptyState message="No departmental data yet." />
                        : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {deptEntries.slice(0, 8).map(([dept, count]) => (
                                    <div key={dept}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{dept}</p>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>{count}</p>
                                        </div>
                                        <div style={{ height: 4, background: "#f0ebe0" }}>
                                            <div style={{ height: "100%", background: GOLD, width: `${Math.round((count / maxDept) * 100)}%`, transition: "width 0.6s ease" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            </div>

            {/* Wishlist demand panel */}
            <div style={{
                background: NAVY,
                backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
                backgroundSize: "24px 24px",
                padding: "28px 32px", display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap",
            }}>
                <div style={{ width: 56, height: 56, border: "0.5px solid rgba(184,150,62,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <HeartIcon color={GOLD} size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>
                        Future Demand Signal
                    </p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                        {a.wishlistCount.toLocaleString()}{" "}
                        {isFaculty ? "student" : "user"}{a.wishlistCount !== 1 ? "s" : ""} have your materials wishlisted
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                        Spread across {Object.keys(a.wishlistByCountry).length} countries.
                        {a.physicalPendingOrders.length > 0 && ` · ${a.physicalPendingOrders.length} physical copies pending pickup at Abuja Registry.`}
                    </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64, marginLeft: "auto" }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 700, color: GOLDD, margin: 0, lineHeight: 1 }}>
                        {a.wishlistCount.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(184,150,62,0.5)", fontFamily: "'Lato',sans-serif", margin: "4px 0 0" }}>wishlisted</p>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: DIGITAL SALES
══════════════════════════════════════════════════════════════ */
function DownloadsTab({ analytics: a }) {
    const bookEntries = Object.entries(a.downloadsByBook).sort(([, x], [, y]) => y.count - x.count);
    const deptEntries = Object.entries(a.downloadsByDepartment).sort(([, x], [, y]) => y - x);
    const maxDept = deptEntries[0]?.[1] || 1;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Book Performance" title="Digital Downloads Per Book" />
                {bookEntries.length === 0
                    ? <EmptyState message="No digital download data yet." />
                    : (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>Book Title</p>
                                <p style={{ fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Downloads</p>
                            </div>
                            {bookEntries.map(([bookId, data], i) => (
                                <div key={bookId}>
                                    <div style={{
                                        display: "grid", gridTemplateColumns: "1fr 100px", gap: 8,
                                        padding: "14px 12px", borderBottom: "0.5px solid #f5f0e8",
                                        background: i === 0 ? "rgba(184,150,62,0.04)" : "#fff",
                                    }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 4px", fontFamily: "'Lato',sans-serif" }}>{data.title}</p>
                                            {data.physicalCount > 0 && (
                                                <p style={{ fontSize: 11, color: GOLD, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>
                                                    +{data.physicalCount} physical sold
                                                </p>
                                            )}
                                            {Object.keys(data.departments).length > 0 && (
                                                <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                    Top dept: {Object.entries(data.departments).sort(([, a], [, b]) => b - a)[0]?.[0]}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: i === 0 ? GOLD : NAVY, margin: 0 }}>{data.count}</p>
                                            {i === 0 && <p style={{ fontSize: 9, color: GOLD, fontFamily: "'Lato',sans-serif", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top</p>}
                                        </div>
                                    </div>
                                    {Object.keys(data.departments).length > 0 && (
                                        <div style={{
                                            padding: "8px 12px 12px 32px", background: "#fdfaf6",
                                            borderBottom: "0.5px solid #f5f0e8",
                                            borderLeft: `2px solid ${GOLD}`,
                                        }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", margin: "0 0 6px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                                Downloaded by department
                                            </p>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {Object.entries(data.departments)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([dept, count]) => (
                                                        <span key={dept} style={{
                                                            fontSize: 11,
                                                            background: "rgba(184,150,62,0.1)",
                                                            border: "0.5px solid rgba(184,150,62,0.2)",
                                                            color: NAVY, padding: "3px 10px", borderRadius: 999,
                                                            fontFamily: "'Lato',sans-serif", fontWeight: 600,
                                                        }}>
                                                            {dept} <strong style={{ color: GOLD }}>{count}</strong>
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Student Reach" title="Downloads by Department" />
                {deptEntries.length === 0
                    ? <EmptyState message="No departmental download data yet." />
                    : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {deptEntries.map(([dept, count]) => (
                                <div key={dept}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 8, height: 8, background: GOLD, borderRadius: "50%", flexShrink: 0 }} />
                                            <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{dept}</p>
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Playfair Display',serif" }}>{count}</p>
                                    </div>
                                    <div style={{ height: 6, background: "#f0ebe0" }}>
                                        <div style={{
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${GOLD}, ${GOLDD})`,
                                            width: `${Math.round((count / maxDept) * 100)}%`,
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PHYSICAL SALES & INVENTORY
══════════════════════════════════════════════════════════════ */
function PhysicalTab({ analytics: a }) {
    const { fmt } = useCurrency();
    const totalRevenue = a.physicalSales.reduce((s, sale) => s + (sale.sellerPayout || 0), 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
                {[
                    { label: "Copies Sold",        value: a.totalPhysicalSales,              color: NAVY      },
                    { label: "Pending Pickup",      value: a.physicalPendingOrders.length,    color: "#d97706" },
                    { label: "Payout Earned",       value: fmt(totalRevenue),                 color: "#16a34a" },
                    { label: "Assets at Registry",  value: a.physicalInventory.length,        color: NAVY      },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px 20px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color, margin: "0 0 4px" }}>{value}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                    </div>
                ))}
            </div>

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Registry Stock" title="Physical Inventory" />
                {a.physicalInventory.length === 0
                    ? <EmptyState message="No physical copies registered at the Abuja Registry yet." />
                    : (
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <div style={{ minWidth: 520 }}>
                                <div style={{
                                    display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 100px",
                                gap: 6, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0",
                            }}>
                                {["Book", "Asset ID", "In Stock", "Total", "Shelf"].map((h) => (
                                    <p key={h} style={{
                                        fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0,
                                        fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase",
                                        textAlign: h !== "Book" ? "right" : "left",
                                    }}>{h}</p>
                                ))}
                            </div>
                            {a.physicalInventory.map((inv) => {
                                const pct = inv.totalConsignment
                                    ? Math.round((inv.currentStock / inv.totalConsignment) * 100)
                                    : 0;
                                const stockColor = pct <= 20 ? "#dc2626" : pct <= 40 ? "#d97706" : "#16a34a";
                                return (
                                    <div key={inv.id} style={{
                                        display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 100px",
                                        gap: 6, padding: "12px 12px", borderBottom: "0.5px solid #f5f0e8",
                                    }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                            {inv.bookTitle || "Unknown"}
                                        </p>
                                        <p style={{ fontSize: 11, color: GOLD, margin: 0, fontFamily: "monospace", textAlign: "right" }}>
                                            {inv.assetId || "—"}
                                        </p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: stockColor, margin: 0, textAlign: "right", fontFamily: "'Playfair Display',serif" }}>
                                            {inv.currentStock ?? "—"}
                                        </p>
                                        <p style={{ fontSize: 12, color: "#888", margin: 0, textAlign: "right", fontFamily: "'Lato',sans-serif" }}>
                                            {inv.totalConsignment ?? "—"}
                                        </p>
                                        <p style={{ fontSize: 11, color: "#888", margin: 0, textAlign: "right", fontFamily: "'Lato',sans-serif" }}>
                                            {[inv.section, inv.shelfLocation].filter(Boolean).join(" / ") || "—"}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    )}
            </div>

           {a.physicalPendingOrders.length > 0 && (
    <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
        <SectionHeader label="Awaiting Collection" title="Pending Pickup Orders" />
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: 480 }}>
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 120px 100px 110px",
                            gap: 6, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0",
                        }}>
                            {["Book / Buyer", "Pickup Code", "Price", "Reserved On"].map((h) => (
                                <p key={h} style={{ fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</p>
                            ))}
                        </div>
                        {a.physicalPendingOrders.map((order) => (
                            <div key={order.id} style={{
                                display: "grid", gridTemplateColumns: "1fr 120px 100px 110px",
                                gap: 6, padding: "12px 12px", borderBottom: "0.5px solid #f5f0e8",
                            }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{order.bookTitle}</p>
                                    <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{order.userName || order.userEmail}</p>
                                </div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "monospace", alignSelf: "center" }}>
                                    {order.pickupCode}
                                </p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Playfair Display',serif", alignSelf: "center" }}>
                                    {fmt(order.price || 0)}
                                </p>
                                <p style={{ fontSize: 11, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", alignSelf: "center" }}>
                                    {order.createdAt
                                        ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                                        : "—"}
                                </p>
                          </div>
                     ))}
        </div>
        </div>
        </div>
    )}

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Sales Ledger" title="Completed Physical Sales" />
              {a.physicalSales.length === 0
    ? <EmptyState message="No physical sales recorded at the registry yet." />
    : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: 480 }}>
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 140px 100px 110px",
                                gap: 6, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0",
                            }}>
                                {["Book / Student", "Asset ID", "Your Payout", "Date Sold"].map((h) => (
                                    <p key={h} style={{ fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</p>
                                ))}
                            </div>
                            {a.physicalSales.map((sale) => (
                                <div key={sale.id} style={{
                                    display: "grid", gridTemplateColumns: "1fr 140px 100px 110px",
                                    gap: 6, padding: "12px 12px", borderBottom: "0.5px solid #f5f0e8",
                                }}>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px", fontFamily: "'Lato',sans-serif" }}>{sale.bookTitle}</p>
                                        <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{sale.studentName || sale.studentEmail}</p>
                                    </div>
                                    <p style={{ fontSize: 11, color: GOLD, margin: 0, fontFamily: "monospace", alignSelf: "center" }}>{sale.assetId}</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", margin: 0, fontFamily: "'Playfair Display',serif", alignSelf: "center" }}>
                                        {fmt(sale.sellerPayout || 0)}
                                    </p>
                                    <p style={{ fontSize: 11, color: "#888", margin: 0, fontFamily: "'Lato',sans-serif", alignSelf: "center" }}>
                                        {sale.soldAt
                                            ? new Date(sale.soldAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                            : "—"}
                                    </p>
                                </div>
                       ))}
        </div>
        </div>
        )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: WISHLIST & COUNTRIES
══════════════════════════════════════════════════════════════ */
function WishlistTab({ analytics: a, isFaculty }) {
    const countryEntries = Object.entries(a.wishlistByCountry).sort(([, x], [, y]) => y.count - x.count);
    const maxCount = countryEntries[0]?.[1]?.count || 1;

    const getFlagEmoji = (country) => {
        const flags = {
            "Nigeria": "🇳🇬", "Ghana": "🇬🇭", "Kenya": "🇰🇪", "South Africa": "🇿🇦",
            "United Kingdom": "🇬🇧", "United States": "🇺🇸", "Canada": "🇨🇦",
            "India": "🇮🇳", "Australia": "🇦🇺", "Germany": "🇩🇪", "France": "🇫🇷",
            "Uganda": "🇺🇬", "Tanzania": "🇹🇿", "Ethiopia": "🇪🇹", "Cameroon": "🇨🇲",
            "Unknown": "🌍",
        };
        return flags[country] || "🌍";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Global Reach" title="Wishlist by Country" />
                {countryEntries.length === 0
                    ? <EmptyState message="No wishlist data yet." />
                    : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            {countryEntries.map(([country, data]) => (
                                <div key={country} style={{ padding: "16px 0", borderBottom: "0.5px solid #f5f0e8" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                        <span style={{ fontSize: 24, lineHeight: 1 }}>{getFlagEmoji(country)}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{country}</p>
                                                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(184,150,62,0.12)", color: GOLD, padding: "2px 8px", borderRadius: 999, fontFamily: "'Lato',sans-serif" }}>
                                                    {data.count} {isFaculty ? "student" : "user"}{data.count !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <div style={{ height: 4, background: "#f0ebe0" }}>
                                                <div style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLDD})`, width: `${Math.round((data.count / maxCount) * 100)}%`, transition: "width 0.6s ease" }} />
                                            </div>
                                        </div>
                                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: GOLD, margin: 0, flexShrink: 0 }}>{data.count}</p>
                                    </div>
                                    <div style={{ paddingLeft: 36 }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", margin: "0 0 6px", fontFamily: "'Lato',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Materials saved</p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {data.materials.map((mat, i) => (
                                                <span key={i} style={{ fontSize: 11, background: CREAM, border: "0.5px solid #e5ddd0", color: NAVY, padding: "4px 12px", fontFamily: "'Lato',sans-serif", fontWeight: 600 }}>
                                                    📚 {mat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {countryEntries.length > 0 && (
              <div style={{
    background: NAVY,
    backgroundImage: "radial-gradient(rgba(184,150,62,0.07) 1px,transparent 1px)",
    backgroundSize: "24px 24px",
    padding: "28px 32px", display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap",
}}>
                    <GlobeIcon color={GOLD} size={28} />
                    <div>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>
                            Your materials reach {countryEntries.length} {countryEntries.length === 1 ? "country" : "countries"}
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                            {countryEntries.map(([c]) => c).join(" · ")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: STUDENTS / BUYERS
══════════════════════════════════════════════════════════════ */
function StudentsTab({ analytics: a, isFaculty }) {
    if (isFaculty) return <FacultyStudentsView analytics={a} />;
    return <SellerBuyersView analytics={a} />;
}

function FacultyStudentsView({ analytics: a }) {
    const [search,       setSearch]       = useState("");
    const [filterCourse, setFilterCourse] = useState("all");

    const courses  = [...new Set(a.courseStudents.map(s => s.courseCode))];
    const filtered = a.courseStudents.filter(s => {
        const matchSearch = !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.department.toLowerCase().includes(search.toLowerCase());
        const matchCourse = filterCourse === "all" || s.courseCode === filterCourse;
        return matchSearch && matchCourse;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Enrolled" title="Students in Your Courses" />
                <p style={{ fontSize: 12, color: "#888", fontFamily: "'Lato',sans-serif", margin: "0 0 16px", lineHeight: 1.6 }}>
                    Students registered on the platform whose <code>enrolledCourses</code> or <code>courses</code> field
                    matches the course codes on your published materials.
                </p>

                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, department…"
                        style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "0.5px solid #e5ddd0", background: CREAM, fontSize: 12, fontFamily: "'Lato',sans-serif", color: NAVY, outline: "none" }}
                    />
                    <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        style={{ padding: "9px 14px", border: "0.5px solid #e5ddd0", background: CREAM, fontSize: 12, fontFamily: "'Lato',sans-serif", color: NAVY, outline: "none", cursor: "pointer" }}
                    >
                        <option value="all">All Courses</option>
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <p style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato',sans-serif", margin: "0 0 12px" }}>
                    Showing {filtered.length} of {a.courseStudents.length} students
                </p>

                {filtered.length === 0 ? (
                    <EmptyState message={
                        a.courseStudents.length === 0
                            ? "No students found yet. Students appear here when their enrolledCourses array matches your published course codes."
                            : "No students match your filter."
                    } />
                ) : (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px", gap: 8, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0" }}>
                            {["Student Name", "Department", "Course Code", "Institution"].map(h => (
                                <p key={h} style={{ fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</p>
                            ))}
                        </div>
                        {filtered.map((student, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px", gap: 8, padding: "12px 12px", borderBottom: "0.5px solid #f5f0e8", background: i % 2 === 0 ? "#fff" : "#fdfaf6" }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 1px", fontFamily: "'Lato',sans-serif" }}>{student.name}</p>
                                    <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>{student.email}</p>
                                </div>
                                <p style={{ fontSize: 12, color: "#777", margin: 0, fontFamily: "'Lato',sans-serif", alignSelf: "center" }}>{student.department}</p>
                                <span style={{ display: "inline-flex", alignItems: "center", height: "fit-content", fontSize: 11, fontWeight: 700, background: "rgba(184,150,62,0.1)", color: GOLD, padding: "3px 9px", borderRadius: 999, fontFamily: "'Lato',sans-serif", alignSelf: "center" }}>
                                    {student.courseCode}
                                </span>
                                <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", alignSelf: "center" }}>{student.university || "—"}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SellerBuyersView({ analytics: a }) {
    const deptEntries = Object.entries(a.downloadsByDepartment).sort(([, x], [, y]) => y - x);
    const bookEntries = Object.entries(a.downloadsByBook).sort(
        ([, x], [, y]) => (y.count + (y.physicalCount || 0)) - (x.count + (x.physicalCount || 0))
    );
    const maxDept     = deptEntries[0]?.[1] || 1;
    const totalBuyers = Object.values(a.downloadsByDepartment).reduce((s, c) => s + c, 0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
                {[
                    { label: "Total Buyers",    value: totalBuyers,                           color: NAVY },
                    { label: "Departments",     value: deptEntries.length,                    color: GOLD },
                    { label: "Books Purchased", value: Object.keys(a.downloadsByBook).length, color: NAVY },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: "16px 20px", textAlign: "center" }}>
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color, margin: "0 0 4px" }}>{value}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                    </div>
                ))}
            </div>

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Purchase Reach" title="Buyers by Department" />
                {deptEntries.length === 0
                    ? <EmptyState message="No buyer department data yet." />
                    : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {deptEntries.map(([dept, count]) => (
                                <div key={dept}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 8, height: 8, background: GOLD, borderRadius: "50%", flexShrink: 0 }} />
                                            <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{dept}</p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Playfair Display',serif" }}>{count}</p>
                                            <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif" }}>{count === 1 ? "buyer" : "buyers"}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: "#f0ebe0" }}>
                                        <div style={{
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${GOLD}, ${GOLDD})`,
                                            width: `${Math.round((count / maxDept) * 100)}%`,
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader label="Book Breakdown" title="Purchases Per Book" />
                {bookEntries.length === 0
                    ? <EmptyState message="No purchase data yet." />
                    : (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 100px", gap: 8, padding: "8px 12px", background: CREAM, borderBottom: "0.5px solid #e5ddd0" }}>
                                {["Book", "Digital", "Physical"].map(h => (
                                    <p key={h} style={{
                                        fontSize: 9, fontWeight: 700, color: "#aaa", margin: 0,
                                        fontFamily: "'Lato',sans-serif", letterSpacing: "0.12em", textTransform: "uppercase",
                                        textAlign: h !== "Book" ? "right" : "left",
                                    }}>{h}</p>
                                ))}
                            </div>
                            {bookEntries.map(([bookId, data], i) => (
                                <div key={bookId} style={{
                                    display: "grid", gridTemplateColumns: "1fr 90px 100px", gap: 8,
                                    padding: "13px 12px", borderBottom: "0.5px solid #f5f0e8",
                                    background: i === 0 ? "rgba(184,150,62,0.04)" : "#fff",
                                }}>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>{data.title}</p>
                                        {Object.keys(data.departments).length > 0 && (
                                            <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                Top dept: {Object.entries(data.departments).sort(([, a], [, b]) => b - a)[0]?.[0]}
                                            </p>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: i === 0 ? GOLD : NAVY, margin: 0, fontFamily: "'Playfair Display',serif", textAlign: "right", alignSelf: "center" }}>
                                        {data.count}
                                    </p>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: (data.physicalCount || 0) > 0 ? NAVY : "#ddd", margin: 0, fontFamily: "'Playfair Display',serif", textAlign: "right", alignSelf: "center" }}>
                                        {data.physicalCount || "—"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   TAB: FEEDBACK
══════════════════════════════════════════════════════════════ */
function FeedbackTab({ analytics: a, isFaculty }) {
    const formatDate = (d) => {
        if (!d) return "";
        const date = d instanceof Date ? d : new Date(d);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const getSentiment = (text) => {
        if (!text) return "neutral";
        const lower    = text.toLowerCase();
        const positive = ["excellent", "great", "thank", "good", "amazing", "recommend", "helpful", "love", "best", "wonderful", "perfect", "outstanding"];
        const negative = ["poor", "bad", "wrong", "mistake", "error", "disappoint", "terrible", "worst", "useless"];
        const posScore = positive.filter(w => lower.includes(w)).length;
        const negScore = negative.filter(w => lower.includes(w)).length;
        if (posScore > negScore) return "positive";
        if (negScore > posScore) return "negative";
        return "neutral";
    };

    const sentimentColors = { positive: "#16a34a", negative: "#dc2626", neutral: "#d97706" };
    const sentimentBg     = { positive: "rgba(22,163,74,0.08)", negative: "rgba(220,38,38,0.08)", neutral: "rgba(217,119,6,0.08)" };
    const sentimentLabel  = { positive: "Positive", negative: "Needs Review", neutral: "Neutral" };

    const posCount = a.bookFeedback.filter(f => getSentiment(f.feedback) === "positive").length;
    const negCount = a.bookFeedback.filter(f => getSentiment(f.feedback) === "negative").length;

    const RatingStars = ({ value, size = 13 }) => (
        <span style={{ display: "inline-flex", gap: "2px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} width={size} height={size} viewBox="0 0 24 24"
                    fill={n <= Math.round(value) ? GOLD : "none"}
                    stroke={n <= Math.round(value) ? GOLD : "#ccc"}
                    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </span>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {a.bookFeedback.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
                    {[
                        { count: posCount,                                    label: "Positive",      color: "#16a34a", bg: "rgba(22,163,74,0.06)",  border: "rgba(22,163,74,0.2)"  },
                        { count: a.bookFeedback.length - posCount - negCount, label: "Neutral",       color: "#d97706", bg: "rgba(217,119,6,0.06)",  border: "rgba(217,119,6,0.2)"  },
                        { count: negCount,                                    label: "Needs Review",  color: "#dc2626", bg: "rgba(220,38,38,0.06)",  border: "rgba(220,38,38,0.2)"  },
                        { count: a.bookFeedback.length,                       label: "Total Reviews", color: GOLD,      bg: "rgba(184,150,62,0.06)", border: "rgba(184,150,62,0.2)" },
                    ].map(({ count, label, color, bg, border }) => (
                        <div key={label} style={{ background: bg, border: `0.5px solid ${border}`, padding: "16px 20px", textAlign: "center" }}>
                            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color, margin: "0 0 4px" }}>{count}</p>
                            <p style={{ fontSize: 11, fontWeight: 700, color, margin: 0, fontFamily: "'Lato',sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 24 }}>
                <SectionHeader
                    label={isFaculty ? "Student Reviews" : "Customer Reviews"}
                    title="Book Feedback"
                />
                {a.bookFeedback.length === 0 ? (
                    <EmptyState message="No feedback yet. Reviews will appear here once customers leave feedback on your books." />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {a.bookFeedback.map((fb) => {
                            const sentiment = getSentiment(fb.feedback);
                            return (
                                <div key={fb.id} style={{
                                    border: "0.5px solid #e8e0d4",
                                    borderLeft: `3px solid ${sentimentColors[sentiment]}`,
                                    padding: "16px 18px",
                                    background: sentimentBg[sentiment],
                                }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: "50%",
                                            background: NAVY, display: "flex", alignItems: "center",
                                            justifyContent: "center", flexShrink: 0, border: `1.5px solid ${GOLD}`,
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display',serif" }}>
                                                {(fb.userName || "?")[0].toUpperCase()}
                                            </span>
                                        </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                                    {fb.userName || "Anonymous"}
                                                </p>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                                                    color: sentimentColors[sentiment],
                                                    background: `${sentimentColors[sentiment]}1a`,
                                                    padding: "2px 7px", borderRadius: 999, fontFamily: "'Lato',sans-serif",
                                                }}>
                                                    {sentimentLabel[sentiment]}
                                                </span>
                                                {fb.createdAt && (
                                                    <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato',sans-serif", marginLeft: "auto" }}>
                                                        {formatDate(fb.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <RatingStars value={fb.rating || 0} size={13} />
                                                {fb.rating > 0 && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif" }}>
                                                        {Number(fb.rating).toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            {fb.userEmail && (
                                                <p style={{ fontSize: 11, color: "#aaa", margin: "3px 0 0", fontFamily: "'Lato',sans-serif" }}>
                                                    {fb.userEmail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                        <BookOpenIcon color={GOLD} size={12} />
                                        <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, margin: 0, fontFamily: "'Lato',sans-serif" }}>
                                            {fb.bookTitle}
                                        </p>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.7)", border: "0.5px solid rgba(0,0,0,0.06)", padding: "12px 14px" }}>
                                        <p style={{ fontSize: 13, color: "#444", margin: 0, fontFamily: "'Lato',sans-serif", lineHeight: 1.65, fontStyle: "italic" }}>
                                            "{fb.feedback || "(No details provided)"}"
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Shared sub-components ──────────────────────────────────── */
function MetricCard({ label, sublabel, value, icon, detail }) {
    return (
        <div style={{ background: "#fff", border: "0.5px solid #e5ddd0", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#aaa", margin: "0 0 3px", fontFamily: "'Lato',sans-serif" }}>{label}</p>
                    <p style={{ fontSize: 11, color: "#bbb", margin: 0, fontFamily: "'Lato',sans-serif" }}>{sublabel}</p>
                </div>
                <div style={{ width: 40, height: 40, border: "0.5px solid #e5ddd0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: CREAM }}>{icon}</div>
            </div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1 }}>{value}</p>
            {detail && <p style={{ fontSize: 11, color: "#aaa", margin: 0, fontFamily: "'Lato',sans-serif", borderTop: "0.5px solid #f5f0e8", paddingTop: 10 }}>{detail}</p>}
        </div>
    );
}

function SectionHeader({ label, title }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 4, fontFamily: "'Lato',sans-serif" }}>{label}</p>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>{title}</h3>
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div style={{ padding: "32px 0", textAlign: "center", borderTop: "0.5px solid #f0ebe0" }}>
            <p style={{ fontSize: 13, color: "#aaa", fontFamily: "'Lato',sans-serif", lineHeight: 1.6 }}>{message}</p>
        </div>
    );
}

function FullPageSpinner() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: NAVY }}>Checking analytics…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );
}

function ErrorBanner({ message }) {
    return (
        <div style={{ background: "#fef2f2", border: "0.5px solid #fecaca", padding: "16px 20px", margin: "24px 0" }}>
            <p style={{ fontSize: 13, color: "#dc2626", fontFamily: "'Lato',sans-serif", margin: 0 }}>Error: {message}</p>
        </div>
    );
}

function GlobalStyles() {
    return (
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
          @keyframes spin    { to { transform: rotate(360deg); } }
          @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        `}</style>
    );
}

/* ─── Icons ─────────────────────────────────────────────────── */
const ChevronRight = ({ color = "#ccc", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
);
const ChevronLeft = ({ color = "#ccc", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
);
const BarChartIcon = ({ color = NAVY, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
);
const LockIcon = ({ color = NAVY, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const UsersIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const BookOpenIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);
const HeartIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const DownloadIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const StarIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const GlobeIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
);
const PackageIcon = ({ color = GOLD, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
);