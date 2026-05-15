/**
 * LAN Divinity — Slug & Category Utilities
 * -----------------------------------------
 * Centralises all slug ↔ Firestore-tag conversions so every
 * page, link, and query stays in sync automatically.
 */

/* ─── Canonical category map ──────────────────────────────────────────────
   Single source of truth.  Add new traditions here and everything else
   (navigation, Firestore queries, breadcrumbs, meta tags) updates for free.
──────────────────────────────────────────────────────────────────────────── */
export const THEO_CATEGORIES = [
    {
        id: "christian",
        label: "Christian Theology",
        slug: "christian-theology",          // URL segment
        firestoreTag: "christian_theology",          // Firestore field value
        icon: "Cross",
        color: "#3b1f5e",
        image: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800",
        description: "Systematic theology, commentaries, sermon notes, patristics, and ecclesiology",
        sub: ["Systematic Theology", "Commentaries", "Sermon Notes", "Patristics", "Ecclesiology"],
    },
    {
        id: "islamic",
        label: "Islamic Studies",
        slug: "islamic-studies",
        firestoreTag: "islamic_studies",
        icon: "Moon",
        color: "#0d3320",
        image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
        description: "Hadith sciences, Sharia law, Arabic grammar, Quranic tafsir, and Islamic jurisprudence",
        sub: ["Hadith", "Sharia Law", "Arabic Grammar", "Tafsir", "Fiqh"],
    },
    {
        id: "comparative",
        label: "Comparative Religion & Philosophy",
        slug: "comparative-religion",
        firestoreTag: "comparative_religion",
        icon: "Globe",
        color: "#2a1a10",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
        description: "Philosophy of religion, inter-faith dialogue, world religions, and religious ethics",
        sub: ["Philosophy of Religion", "World Religions", "Inter-faith Dialogue", "Religious Ethics"],
    },
    {
        id: "sacred-texts",
        label: "Sacred Texts & Manuscripts",
        slug: "sacred-texts",
        firestoreTag: "sacred_texts",
        icon: "ScrollText",
        color: "#1a1505",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
        description: "Ancient manuscripts, canonical texts, apocrypha, liturgical writings, and scriptural analysis",
        sub: ["Canonical Texts", "Apocrypha", "Liturgical Writings", "Manuscript Studies"],
    },
];


/* ─── Core slug generator ─────────────────────────────────────────────────
   Converts any free-form string into a clean, URL-safe hyphenated slug.

   generateSlug("Divinity / Christian Theology")
   → "divinity/christian-theology"

   generateSlug("Sacred Texts & Manuscripts")
   → "sacred-texts-manuscripts"
──────────────────────────────────────────────────────────────────────────── */
export function generateSlug(text = "") {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s/]/g, "")   // strip everything except alphanum, spaces, forward slashes
        .replace(/\s+/g, "-")            // spaces → hyphens
        .replace(/-+/g, "-")             // collapse duplicate hyphens
        .replace(/\/+/g, "/")            // collapse duplicate slashes
        .replace(/^[-/]+|[-/]+$/g, "");  // trim leading / trailing hyphens or slashes
}


/* ─── Slug → category object ──────────────────────────────────────────────
   Used inside DivinityCategoryPage to resolve useParams() → category data.

   getCategoryBySlug("islamic-studies")
   → { id: "islamic", label: "Islamic Studies", firestoreTag: "islamic_studies", … }
──────────────────────────────────────────────────────────────────────────── */
export function getCategoryBySlug(slug = "") {
    return THEO_CATEGORIES.find((c) => c.slug === slug) ?? null;
}


/* ─── Slug → Firestore tag ────────────────────────────────────────────────
   Convenience wrapper for building Firestore queries directly from the URL.

   getFirestoreTag("sacred-texts")
   → "sacred_texts"
──────────────────────────────────────────────────────────────────────────── */
export function getFirestoreTag(slug = "") {
    return getCategoryBySlug(slug)?.firestoreTag ?? null;
}


/* ─── Firestore tag → slug ────────────────────────────────────────────────
   Reverse lookup — useful when you have a document and need its page URL.

   slugFromFirestoreTag("christian_theology")
   → "christian-theology"
──────────────────────────────────────────────────────────────────────────── */
export function slugFromFirestoreTag(tag = "") {
    return THEO_CATEGORIES.find((c) => c.firestoreTag === tag)?.slug ?? null;
}


/* ─── Build a canonical divinity path ────────────────────────────────────
   divinityPath("islamic-studies")   → "/divinity/islamic-studies"
   divinityPath()                    → "/divinity/browse"
──────────────────────────────────────────────────────────────────────────── */
export function divinityPath(slug = "") {
    return slug ? `/divinity/${slug}` : "/divinity/religious-archive";
}