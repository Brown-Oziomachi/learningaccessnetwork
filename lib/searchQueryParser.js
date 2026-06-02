/**
 * searchQueryParser.js
 * Client-side utility — parses a raw academic search string into
 * structured tokens so the frontend can build targeted Firestore
 * .where() chains instead of naïve substring matching.
 *
 * Examples handled:
 *   "MEE 301 FUTA past questions"
 *   "ECON 201 University of Ghana lecture notes"
 *   "Dr. Mensah"
 *   "biochemistry 300 level OAU"
 */

/* ─── Known institution aliases ─────────────────────────────── */
const INSTITUTION_MAP = {
    unilag: "University of Lagos",
    oau: "Obafemi Awolowo University",
    abu: "Ahmadu Bello University",
    ui: "University of Ibadan",
    futa: "Federal University of Technology Akure",
    uniben: "University of Benin",
    lasu: "Lagos State University",
    ug: "University of Ghana",
    unn: "University of Nigeria Nsukka",
    eksu: "Ekiti State University",
    uniport: "University of Port Harcourt",
    fuoye: "Federal University Oye-Ekiti",
    noun: "National Open University of Nigeria",
    buk: "Bayero University Kano",
    unijos: "University of Jos",
};

/* ─── Document type keywords ─────────────────────────────────── */
const DOC_TYPE_MAP = {
    "past questions": "Past Questions",
    "past question": "Past Questions",
    exam: "Past Questions",
    exams: "Past Questions",
    "lecture notes": "Lecture Notes",
    "lecture note": "Lecture Notes",
    notes: "Lecture Notes",
    textbook: "Textbook",
    textbooks: "Textbook",
    "lab manual": "Lab Manual",
    "lab report": "Lab Report",
    assignment: "Assignment",
    project: "Project",
    thesis: "Thesis",
    dissertation: "Thesis",
    summary: "Summary",
    slides: "Slides",
    handout: "Handout",
};

/* ─── Level keywords ─────────────────────────────────────────── */
const LEVEL_PATTERNS = [
    /\b(100|200|300|400|500|600)\s*(?:level|l)\b/i,
    /\b(first|second|third|fourth|fifth|final)\s*year\b/i,
    /\byr\s*(1|2|3|4|5)\b/i,
];

/* ─── Course code pattern (e.g. MEE301, ECON 201, CSC 3101) ─── */
const COURSE_CODE_REGEX = /\b([A-Z]{2,6})\s*(\d{3,4})\b/gi;

/* ─── Title / name patterns ─────────────────────────────────── */
const PERSON_PREFIX =
    /\b(dr\.?|prof\.?|professor|mr\.?|mrs\.?|ms\.?|engr\.?)\s+(\w+)/i;

/* ════════════════════════════════════════════════════════════════
   Main parser
════════════════════════════════════════════════════════════════ */
export function parseSearchQuery(raw) {
    if (!raw || typeof raw !== "string") {
        return { raw: "", tokens: {}, isPersonSearch: false, cleanQuery: "" };
    }

    const input = raw.trim();
    const lower = input.toLowerCase();
    const tokens = {};

    // ── 1. Person name detection ──────────────────────────────────
    const personMatch = input.match(PERSON_PREFIX);
    const isPersonSearch = Boolean(personMatch);
    if (personMatch) {
        tokens.personName = personMatch[0];
        tokens.personSurname = personMatch[2];
    }

    // ── 2. Course code extraction ─────────────────────────────────
    const courseCodes = [];
    let ccMatch;
    const ccRegexCopy = new RegExp(COURSE_CODE_REGEX.source, "gi");
    while ((ccMatch = ccRegexCopy.exec(input)) !== null) {
        courseCodes.push(`${ccMatch[1].toUpperCase()}${ccMatch[2]}`); // e.g. "MEE301"
    }
    if (courseCodes.length) tokens.courseCodes = courseCodes;

    // ── 3. Institution detection ──────────────────────────────────
    for (const [abbr, fullName] of Object.entries(INSTITUTION_MAP)) {
        const abbrRegex = new RegExp(`\\b${abbr}\\b`, "i");
        if (abbrRegex.test(lower)) {
            tokens.institution = fullName;
            tokens.institutionAbbr = abbr.toUpperCase();
            break;
        }
        // Also check full names
        if (lower.includes(fullName.toLowerCase())) {
            tokens.institution = fullName;
            tokens.institutionAbbr = abbr.toUpperCase();
            break;
        }
    }

    // ── 4. Document type detection ────────────────────────────────
    for (const [phrase, normalised] of Object.entries(DOC_TYPE_MAP)) {
        if (lower.includes(phrase)) {
            tokens.documentType = normalised;
            break;
        }
    }

    // ── 5. Academic level detection ───────────────────────────────
    for (const pattern of LEVEL_PATTERNS) {
        const m = lower.match(pattern);
        if (m) {
            tokens.level = m[0];
            break;
        }
    }

    // ── 6. Year detection (4-digit year like 2022, 2023) ─────────
    const yearMatch = lower.match(/\b(20[1-2]\d)\b/);
    if (yearMatch) tokens.year = yearMatch[1];

    // ── 7. Clean query (strip parsed tokens, keep subject words) ──
    let clean = lower
        .replace(COURSE_CODE_REGEX, "")
        .replace(PERSON_PREFIX, "")
        .replace(/\b(dr|prof|mr|mrs|ms|engr)\.?\b/gi, "")
        .replace(/\b(20[1-2]\d)\b/g, "")
        .replace(/\b(100|200|300|400|500|600)\s*(level|l)?\b/gi, "")
        .replace(/\bpast\s+questions?\b/gi, "")
        .replace(/\blecture\s+notes?\b/gi, "")
        .replace(/\btextbooks?\b/gi, "")
        .replace(/\bslides\b/gi, "");

    // Remove institution abbreviations from clean query
    for (const abbr of Object.keys(INSTITUTION_MAP)) {
        clean = clean.replace(new RegExp(`\\b${abbr}\\b`, "gi"), "");
    }

    tokens.cleanSubject = clean.replace(/\s+/g, " ").trim();

    return {
        raw: input,
        tokens,
        isPersonSearch,
        cleanQuery: tokens.cleanSubject || lower,
        // Convenience booleans
        hasStructuredTokens: Boolean(
            tokens.courseCodes?.length || tokens.institution || tokens.documentType,
        ),
    };
}

/* ════════════════════════════════════════════════════════════════
   Firestore query builder
   Takes parsed tokens + optional UI filters and returns
   a { platformQuery, firestoreQuery } pair of Firestore Query objects.
   Caller must import { collection, query, where, orderBy, limit } from firebase/firestore.
════════════════════════════════════════════════════════════════ */
export function buildFirestoreQueries(db, parsedQuery, filters = {}) {
    const { tokens } = parsedQuery;
    const {
        institutionFilter,
        yearFilter,
        documentTypeFilter,
        priceMin,
        priceMax,
        facultyOnly,
        fullyTaggedOnly,
    } = filters;

    const {
        collection,
        query,
        where,
        orderBy,
        limit,
    } = require("firebase/firestore");

    // Base ref
    const advertRef = collection(db, "advertMyBook");

    let constraints = [
        where("status", "==", "approved"),
        orderBy("searchScore", "desc"),
        limit(60),
    ];

    // ── Explicit field filters (UI panel) ─────────────────────────
    if (institutionFilter || tokens.institution) {
        constraints.push(
            where("university", "==", institutionFilter || tokens.institution),
        );
    }
    if (documentTypeFilter || tokens.documentType) {
        constraints.push(
            where("resourceType", "==", documentTypeFilter || tokens.documentType),
        );
    }
    if (yearFilter || tokens.year) {
        constraints.push(where("year", "==", yearFilter || tokens.year));
    }
    if (priceMin !== undefined && priceMin !== null) {
        constraints.push(where("price", ">=", Number(priceMin)));
    }
    if (priceMax !== undefined && priceMax !== null) {
        constraints.push(where("price", "<=", Number(priceMax)));
    }
    if (facultyOnly) {
        constraints.push(where("isFaculty", "==", true));
    }
    if (fullyTaggedOnly) {
        constraints.push(where("isFullyTagged", "==", true));
    }

    // Course code — query for the first parsed code (most specific)
    if (tokens.courseCodes?.length) {
        constraints.push(where("courseCode", "==", tokens.courseCodes[0]));
    }

    return query(advertRef, ...constraints);
}
