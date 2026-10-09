import { AFRICAN_UNIVERSITIES, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";
import UniversityDirectoryClient from "./UniversityDirectoryClient";
import { adminDb } from "@/lib/firebase-admin";

export const revalidate = 3600;

export const metadata = {
    title: "African University Hubs — Textbooks & Study Materials | LAN Library",
    description: "Find verified textbooks, past questions, and lecture notes for universities across Africa.",
};

const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

const isQuotaError = (err) =>
    err?.code === 8 || /RESOURCE_EXHAUSTED/.test(err?.message || "");

// Dev: swallow quota errors so the UI stays usable. Prod: rethrow so ISR keeps the last good page.
const handleFetchError = (label, err) => {
    console.error(label, err.message);
    if (isQuotaError(err) && process.env.NODE_ENV === "development") return;
    throw err;
};

export default async function UniversityDirectoryPage() {
    const allUniversities = Object.entries(AFRICAN_UNIVERSITIES).map(([slug, uni]) => ({
        slug,
        ...uni,
    }));

    const lecturers = [];

    try {
        if (!adminDb) throw new Error("adminDb not initialized");

        // Only sellers that have a university, and only the fields we use
        const snap = await adminDb
            .collection("sellers")
            .where("university", ">", "")
            .select("sellerName", "displayName", "title", "university", "department")
            .get();

        snap.forEach((ds) => {
            const data = ds.data();
            const title = (data.title || "").toLowerCase();
            const isLecturer = FACULTY_TITLES.some((t) => title.includes(t.toLowerCase()));
            if (!isLecturer) return;

            lecturers.push({
                id: ds.id,
                name: data.sellerName || data.displayName || "",
                title: data.title || "Lecturer",
                university: data.university || "",
                department: data.department || "",
            });
        });

        console.log("✅ Lecturers fetched:", lecturers.length);
    } catch (err) {
        handleFetchError("❌ Lecturers fetch error:", err);
    }

    return (
        <UniversityDirectoryClient
            allUniversities={allUniversities}
            totalCount={allUniversities.length}
            countryCount={
                UNIVERSITY_COUNTRIES?.length ||
                new Set(allUniversities.map((u) => u.country)).size
            }
            lecturers={lecturers}
        />
    );
}