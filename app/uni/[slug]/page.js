import { Suspense } from "react";
import UniversityHubClient from "./UniversityHubClient";
import { AFRICAN_UNIVERSITIES } from "@/lib/africanUniversities";
import { adminDb } from "@/lib/firebase-admin";

export const UNIVERSITY_REGISTRY = AFRICAN_UNIVERSITIES;

export const dynamicParams = true;
export const revalidate = 3600;
export const maxDuration = 55;

const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

const isQuotaError = (err) =>
    err?.code === 8 || /RESOURCE_EXHAUSTED/.test(err?.message || "");

// Dev: swallow quota errors so the UI stays usable. Prod: rethrow so ISR keeps the last good page.
const handleFetchError = (label, err) => {
    console.error(label, err.message);
    if (isQuotaError(err) && process.env.NODE_ENV === "development") return;
    throw err;
};

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug];
    if (!uni) return { title: "University Hub | LAN Library" };
    return {
        title: `${uni.name} Textbooks, Past Questions & Study Materials | LAN Library`,
        description: `Verified textbooks, lecture notes and past questions for ${uni.name} students.`,
    };
}

export async function generateStaticParams() {
    const TOP_SLUGS = [
        "unilag", "ui", "uniben", "uniabuja", "uniport",
        "oau", "abu", "unn", "lasu", "futa",
    ];
    return TOP_SLUGS.map((slug) => ({ slug }));
}

const mapBook = (ds, data, ownerId, contributor) => ({
    id: `firestore-${ds.id}`,
    firestoreId: ds.id,
    title: data.bookTitle || data.title || "Untitled",
    author: data.author || contributor?.name || data.sellerName || "Unknown Author",
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

export default async function UniversityHubPage({ params }) {
    const { slug } = await params;
    const uni = UNIVERSITY_REGISTRY[slug] || null;
    const uniName = uni?.name || null;

    // Every spelling a seller/book might have stored for this university
    const uniNames = [uniName, uni?.short, slug].filter(Boolean);
    const uniNameSet = new Set(uniNames);

    let contributors = [];
    const allSellerIds = new Set();

    // ── Sellers / lecturers ───────────────────────────────────────────────────
    if (uniName && adminDb) {
        try {
            const sellersSnap = await adminDb
                .collection("sellers")
                .where("university", "in", uniNames)
                .get();

            console.log("👥 Sellers found:", sellersSnap.size, "for", slug);

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

            // Photos: one batched call instead of N separate reads
            if (contributors.length) {
                const refs = contributors.map((c) =>
                    adminDb.collection("users").doc(c.id)
                );
                const docs = await adminDb.getAll(...refs);
                contributors = contributors.map((c, i) => {
                    const u = docs[i].exists ? docs[i].data() : null;
                    return u
                        ? { ...c, photoUrl: u.photoBase64 || u.photoURL || null }
                        : c;
                });
            }
       } catch (err) {
    handleFetchError("❌ Lecturers fetch error:", err);
}
    }

    // ── Books ─────────────────────────────────────────────────────────────────
    let books = [];

    if (uniName && adminDb) {
        try {
            const contributorMap = {};
            contributors.forEach((c) => { contributorMap[c.id] = c; });

            const seen = new Set();

            // 1. Books tagged with this university
            const byUniversity = await adminDb
                .collection("advertMyBook")
                .where("status", "==", "approved")
                .where("university", "in", uniNames)
                .get();

            byUniversity.forEach((ds) => {
                if (seen.has(ds.id)) return;
                const data = ds.data();
                if (data.university && !uniNameSet.has(data.university)) return;
                seen.add(ds.id);
                const ownerId = data.userId || data.sellerId || "";
                books.push(mapBook(ds, data, ownerId, contributorMap[ownerId] || null));
            });

            // 2. Books from this university's sellers (batched, max 30 per 'in')
            if (allSellerIds.size > 0) {
                const ids = [...allSellerIds];
                const chunks = [];
                for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

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
                        books.push(mapBook(ds, data, ownerId, contributorMap[ownerId] || null));
                    })
                );
            }

            // Count materials per contributor
            const countMap = {};
            books.forEach((b) => {
                if (b.contributorId)
                    countMap[b.contributorId] = (countMap[b.contributorId] || 0) + 1;
            });
            contributors.forEach((c) => { c.totalMaterials = countMap[c.id] || 0; });
        } catch (err) {
            handleFetchError("❌ Books fetch error:", err);
        }
    }

    contributors.sort((a, b) => b.totalMaterials - a.totalMaterials);

    // ── Student count (aggregation: ~1 read per 1,000 matches) ────────────────
    let studentCount = null;
    if (uniName && adminDb) {
        try {
            const [byUniversity, byInstitution] = await Promise.all([
                adminDb.collection("users").where("university", "==", uniName).count().get(),
                adminDb.collection("users").where("institution", "==", uniName).count().get(),
            ]);
            studentCount =
                (byUniversity.data().count || 0) +
                (byInstitution.data().count || 0);
        } catch (err) {
            console.error("❌ Student count error:", err.message);
            // not critical: show "—" instead of failing the whole page
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