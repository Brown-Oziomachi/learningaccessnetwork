// app/uni/page.js
import { AFRICAN_UNIVERSITIES, UNIVERSITY_COUNTRIES } from "@/lib/africanUniversities";
import UniversityDirectoryClient from "./UniversityDirectoryClient";
import { adminDb } from "@/lib/firebase-admin";

export const metadata = {
    title: "African University Hubs — Textbooks & Study Materials | LAN Library",
    description: "Find verified textbooks, past questions, and lecture notes for universities across Africa.",
};

const LECTURER_TITLES = ["lecturer", "dr.", "prof.", "professor", "mrs", "mr"];

export default async function UniversityDirectoryPage() {
    const allUniversities = Object.entries(AFRICAN_UNIVERSITIES).map(([slug, uni]) => ({
        slug,
        ...uni,
    }));

    let lecturers = [];

    try {
        if (!adminDb) throw new Error("adminDb not initialized");

        const snap = await adminDb.collection("sellers").get();

        snap.forEach(ds => {
            const data = ds.data();
            const title = (data.title || "").toLowerCase();
            const isLecturer = LECTURER_TITLES.some(t => title.includes(t));
            if (!isLecturer) return;
            if (!data.university) return;

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
        console.error("❌ Lecturers fetch error:", err.message);
    }

    return (
        <UniversityDirectoryClient
            allUniversities={allUniversities}
            totalCount={allUniversities.length}
            countryCount={UNIVERSITY_COUNTRIES?.length || Object.keys(
                allUniversities.reduce((acc, u) => { acc[u.country] = 1; return acc; }, {})
            ).length}
            lecturers={lecturers}
        />
    );
}