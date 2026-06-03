import { Suspense } from "react";
import UniversityHubClient from "./UniversityHubClient";
import { AFRICAN_UNIVERSITIES } from "@/lib/africanUniversities";
import { adminDb } from "@/lib/firebase-admin";

export const UNIVERSITY_REGISTRY = AFRICAN_UNIVERSITIES;

// Allow slugs not in generateStaticParams to be SSR'd on demand
export const dynamicParams = true;

// Re-generate each page at most once per hour (ISR)
export const revalidate = 3600;

// Hard cap per-page build time just under Next.js 60s worker limit
export const maxDuration = 55;

const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug];
    if (!uni) return { title: "University Hub | LAN Library" };
    return {
        title: `${uni.name} Textbooks, Past Questions & Study Materials | LAN Library`,
        description: `Verified textbooks, lecture notes and past questions for ${uni.name} students.`,
    };
}

// Only pre-build the busiest universities at build time.
// Every other slug is rendered on first request and then cached (dynamicParams = true).
export async function generateStaticParams() {
    const TOP_SLUGS = [
        "unilag", "ui", "uniben", "uniabuja", "uniport",
        "oau", "abu", "unn", "lasu", "futa",
    ];
    return TOP_SLUGS.map((slug) => ({ slug }));
}

export default async function UniversityHubPage({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug] || null;
    const uniName = uni?.name || null;

    console.log("🏫 Slug:", slug, "| uniName:", uniName);

    let contributors = [];
    let allSellerIds = new Set();

    if (uniName && adminDb) {
        try {
            const sellersSnap = await adminDb
                .collection("sellers")
                .where("university", "==", uniName)
                .get();

            console.log("👥 Sellers found:", sellersSnap.size);

            sellersSnap.forEach((ds) => {
                allSellerIds.add(ds.id);
                const data = ds.data();
                const title = (data.title || "").toLowerCase();
                const isLecturer = FACULTY_TITLES.some((t) =>
                    title.includes(t.toLowerCase())
                );
                if (!isLecturer) return;

                contributors.push({
                    id: ds.id,
                    name: data.sellerName || data.displayName || "Unknown",
                    title: data.title || "Lecturer",
                    photoUrl: null,
                    department: data.department || null,
                    faculty: data.faculty || null,
                    verified: false,
                    role: "lecturer",
                    totalMaterials: 0,
                    profileId: ds.id,
                });
            });

            // Fetch photos for contributors (parallel)
            contributors = await Promise.all(
                contributors.map(async (c) => {
                    try {
                        const ud = await adminDb.collection("users").doc(c.id).get();
                        if (ud.exists) {
                            const u = ud.data();
                            return { ...c, photoUrl: u.photoBase64 || u.photoURL || null };
                        }
                    } catch { }
                    return c;
                })
            );
        } catch (err) {
            console.error("❌ Sellers fetch error:", err.message);
        }
    }

    // ── Fetch books ────────────────────────────────────────────────────────────
    let books = [];

    if (adminDb) {
        try {
            const contributorMap = {};
            contributors.forEach((c) => {
                contributorMap[c.id] = c;
            });

            // Primary queries: by university name + by institutionalCategory
            const [byUniversity, byInstitution] = await Promise.all([
                adminDb
                    .collection("advertMyBook")
                    .where("status", "==", "approved")
                    .where("university", "==", uniName)
                    .get(),
                adminDb
                    .collection("advertMyBook")
                    .where("status", "==", "approved")
                    .where("institutionalCategory", "==", "university")
                    .get(),
            ]);

            const seen = new Set();

            const processDoc = (ds) => {
                if (seen.has(ds.id)) return;
                const data = ds.data();
                if (data.university && data.university !== uniName) return;
                if (
                    !data.university &&
                    !allSellerIds.has(data.userId || data.sellerId || "")
                )
                    return;
                seen.add(ds.id);

                const ownerId = data.userId || data.sellerId || "";
                const contributor = contributorMap[ownerId] || null;

                books.push({
                    id: `firestore-${ds.id}`,
                    firestoreId: ds.id,
                    title: data.bookTitle || data.title || "Untitled",
                    author:
                        data.author ||
                        contributor?.name ||
                        data.sellerName ||
                        "Unknown Author",
                    price: Number(data.price) || 0,
                    resourceType: data.docType || data.resourceType || "Document",
                    courseCode: data.courseCode || "",
                    department: data.department || contributor?.department || "",
                    faculty: data.faculty || contributor?.faculty || "",
                    level: data.level || "",
                    driveFileId: data.driveFileId || null,
                    pdfUrl: data.pdfUrl || data.pdfLink || null,
                    embedUrl: data.embedUrl || null,
                    sellerName: data.sellerName || contributor?.name || "",
                    sellerId: ownerId,
                    coverImage: data.coverImage || data.image || null,
                    contributorId: contributor?.id || null,
                    contributorName: contributor?.name || null,
                    contributorTitle: contributor?.title || null,
                    contributorPhoto: contributor?.photoUrl || null,
                    contributorDept: contributor?.department || null,
                    contributorProfileId: contributor?.profileId || null,
                });
            };

            byUniversity.forEach(processDoc);
            byInstitution.forEach(processDoc);

            // ── Fallback: batched seller-id queries (replaces full collection scan) ──
            // Only runs when we have sellers whose books weren't caught above.
            if (allSellerIds.size > 0) {
                const sellerIdArray = [...allSellerIds];

                // Firestore 'in' supports max 30 values per query
                const chunks = [];
                for (let i = 0; i < sellerIdArray.length; i += 30) {
                    chunks.push(sellerIdArray.slice(i, i + 30));
                }

                const chunkSnaps = await Promise.all(
                    chunks.map((chunk) =>
                        adminDb
                            .collection("advertMyBook")
                            .where("status", "==", "approved")
                            .where("userId", "in", chunk)
                            .get()
                    )
                );

                chunkSnaps.forEach((snap) =>
                    snap.forEach((ds) => {
                        if (seen.has(ds.id)) return;
                        const data = ds.data();
                        seen.add(ds.id);

                        const ownerId = data.userId || data.sellerId || "";
                        const contributor = contributorMap[ownerId] || null;

                        books.push({
                            id: `firestore-${ds.id}`,
                            firestoreId: ds.id,
                            title: data.bookTitle || data.title || "Untitled",
                            author: data.author || contributor?.name || "Unknown",
                            price: Number(data.price) || 0,
                            resourceType:
                                data.docType || data.resourceType || "Document",
                            courseCode: data.courseCode || "",
                            department:
                                data.department || contributor?.department || "",
                            faculty: data.faculty || "",
                            level: data.level || "",
                            driveFileId: data.driveFileId || null,
                            pdfUrl: data.pdfUrl || null,
                            embedUrl: data.embedUrl || null,
                            sellerName: data.sellerName || "",
                            sellerId: ownerId,
                            coverImage: data.coverImage || null,
                            contributorId: contributor?.id || null,
                            contributorName: contributor?.name || null,
                            contributorTitle: contributor?.title || null,
                            contributorPhoto: contributor?.photoUrl || null,
                            contributorDept: contributor?.department || null,
                            contributorProfileId: contributor?.profileId || null,
                        });
                    })
                );
            }

            // Count materials per contributor
            const countMap = {};
            books.forEach((b) => {
                if (b.contributorId)
                    countMap[b.contributorId] =
                        (countMap[b.contributorId] || 0) + 1;
            });
            contributors.forEach((c) => {
                c.totalMaterials = countMap[c.id] || 0;
            });
        } catch (err) {
            console.error("❌ Books fetch error:", err.message);
        }
    }

    contributors.sort((a, b) => b.totalMaterials - a.totalMaterials);

    // ── Student count ──────────────────────────────────────────────────────────
    let studentCount = null;
    if (uniName && adminDb) {
        try {
            const [byUniversity, byInstitution] = await Promise.all([
                adminDb
                    .collection("users")
                    .where("university", "==", uniName)
                    .count()
                    .get(),
                adminDb
                    .collection("users")
                    .where("institution", "==", uniName)
                    .count()
                    .get(),
            ]);
            studentCount =
                (byUniversity.data().count || 0) +
                (byInstitution.data().count || 0);
        } catch (err) {
            console.error("❌ Student count error:", err.message);
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