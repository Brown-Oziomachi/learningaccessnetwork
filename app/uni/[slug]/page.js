// app/uni/[slug]/page.js
import { Suspense } from "react";
import { collection, query, where, getDocs, getDoc, doc, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import UniversityHubClient from "./UniversityHubClient";

/* ─── Registry: slug → university full name ─── */
export const UNIVERSITY_REGISTRY = {
    uniabuja: { name: "University of Abuja", short: "UniAbuja", state: "FCT, Abuja", founded: 1988, type: "Federal University" },
    unilag: { name: "University of Lagos", short: "UNILAG", state: "Lagos State", founded: 1962, type: "Federal University" },
    ui: { name: "University of Ibadan", short: "UI", state: "Oyo State", founded: 1948, type: "Federal University" },
    uniben: { name: "University of Benin", short: "UNIBEN", state: "Edo State", founded: 1970, type: "Federal University" },
    oau: { name: "Obafemi Awolowo University", short: "OAU", state: "Osun State", founded: 1961, type: "Federal University" },
    unn: { name: "University of Nigeria, Nsukka", short: "UNN", state: "Enugu State", founded: 1960, type: "Federal University" },
    abu: { name: "Ahmadu Bello University", short: "ABU", state: "Kaduna State", founded: 1962, type: "Federal University" },
    futa: { name: "Federal University of Technology, Akure", short: "FUTA", state: "Ondo State", founded: 1981, type: "Federal University of Technology" },
    covenant: { name: "Covenant University", short: "CU", state: "Ogun State", founded: 2002, type: "Private University" },
    babcock: { name: "Babcock University", short: "Babcock", state: "Ogun State", founded: 1999, type: "Private University" },
};

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug];
    if (!uni) return { title: "University Hub | LAN Library" };
    return {
        title: `${uni.name} Textbooks, Past Questions & Study Materials | LAN Library`,
        description: `Verified textbooks, lecture notes and past questions for ${uni.name} (${uni.short}) students.`,
        openGraph: { title: `${uni.short} Academic Hub | LAN Library`, type: "website" },
        alternates: { canonical: `https://learningaccessnetwork.vercel.app/uni/${slug}` },
    };
}

export async function generateStaticParams() {
    return Object.keys(UNIVERSITY_REGISTRY).map(slug => ({ slug }));
}

export default async function UniversityHubPage({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug] || null;
    const uniName = uni?.name || null;

    const LECTURER_TITLES = ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"];

    // ── 1. Contributors (lecturers) ───────────────────────────────
    let contributors = [];
    if (uniName) {
        try {
            const sellersSnap = await getDocs(
                query(collection(db, "sellers"), where("university", "==", uniName))
            );

            const lecturerDocs = sellersSnap.docs.filter(ds => {
                const title = (ds.data().title || "").toLowerCase();
                return LECTURER_TITLES.some(t => title.includes(t));
            });

            const withPhotos = await Promise.all(
                lecturerDocs.map(async (ds) => {
                    const data = ds.data();
                    let photo = null;
                    try {
                        const ud = await getDoc(doc(db, "users", ds.id));
                        if (ud.exists()) {
                            const udata = ud.data();
                            photo = udata.photoBase64 || udata.photoURL || udata.profilePicture || null;
                        }
                    } catch { }

                    return {
                        id: ds.id,
                        name: data.sellerName || data.displayName || "Unknown",
                        title: data.title || "Lecturer",
                        photoUrl: photo,
                        department: data.department || null,
                        faculty: data.faculty || null,
                        verified: data.verifiedSchool || data.isVerified || false,
                        role: "lecturer",
                        totalMaterials: 0,
                        profileId: ds.id,
                    };
                })
            );

            contributors = withPhotos;
        } catch (err) {
            console.error("Contributors fetch error:", err);
        }
    }

    // ── 2. Fetch books — mirrors SellerProfileClient exactly ────────
    // SellerProfileClient fetches ALL advertMyBook docs then filters by
    // (data.userId === sellerId || data.sellerId === sellerId) && status === "approved"
    // We do the same: one full collection scan, filter per contributor id.
    let books = [];
    try {
        // Build contributor lookup: id → contributor
        const contributorMap = {};
        contributors.forEach(c => { contributorMap[c.id] = c; });
        const contributorIds = new Set(contributors.map(c => c.id));

        // One scan of the entire advertMyBook collection — same as SellerProfileClient
        const advertSnap = await getDocs(collection(db, "advertMyBook"));

        advertSnap.forEach(ds => {
            const data = ds.data();

            // Must be approved
            if (data.status !== "approved") return;

            // Must belong to one of our contributors (userId OR sellerId)
            const ownerId = data.userId || data.sellerId || "";
            if (!contributorIds.has(ownerId)) return;

            const contributor = contributorMap[ownerId];

            books.push({
                id: `firestore-${ds.id}`,
                firestoreId: ds.id,
                title: data.bookTitle || data.title || "Untitled",
                author: data.author || contributor.name || "Unknown Author",
                price: Number(data.price) || 0,
                resourceType: data.resourceType || "Document",
                courseCode: data.courseCode || "",
                department: data.department || contributor.department || "",
                faculty: data.faculty || contributor.faculty || "",
                level: data.level || "",
                driveFileId: data.driveFileId || null,
                pdfUrl: data.pdfUrl || data.pdfLink || null,
                embedUrl: data.embedUrl || null,
                sellerName: data.sellerName || contributor.name || "",
                sellerId: ownerId,
                // ── Lecturer attribution ──
                contributorId: contributor.id,
                contributorName: contributor.name,
                contributorTitle: contributor.title,
                contributorPhoto: contributor.photoUrl,
                contributorDept: contributor.department,
                contributorProfileId: contributor.profileId,
            });
        });

        // Count materials per contributor and update totalMaterials
        const countMap = {};
        books.forEach(b => {
            countMap[b.contributorId] = (countMap[b.contributorId] || 0) + 1;
        });
        contributors.forEach(c => { c.totalMaterials = countMap[c.id] || 0; });

    } catch (err) {
        console.error("Books fetch error:", err);
    }

    // Sort contributors by most materials first
    contributors.sort((a, b) => b.totalMaterials - a.totalMaterials);

    // ── 3. Real registered student count ────────────────────────
    let studentCount = null;
    if (uniName) {
        try {
            const snap = await getCountFromServer(
                query(collection(db, "users"), where("university", "==", uniName))
            );
            studentCount = snap.data().count || 0;
        } catch (err) {
            console.error("Student count error:", err);
            studentCount = null;
        }
    }

    return (
        <Suspense fallback={null}>
            <UniversityHubClient
                slug={slug}
                uni={uni}
                initialBooks={books}
                contributors={contributors}
                studentCount={studentCount}
            />
        </Suspense>
    );
}