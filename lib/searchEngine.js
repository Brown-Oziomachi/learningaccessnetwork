/* lib/searchEngine.js
   Client-side search engine for LAN Library.
   - Reads every field the upload form saves (advertMyBook)
   - Token based (any word order), typo tolerant, prefix aware
   - Course codes in any spelling: "CHE 301", "che301", "CHE-301"
   - University names, abbreviations and nicknames: UNILAG = University of Lagos
   - Verified faculty / verified sellers are ordered first (orderByTrust)
*/
import { UNIVERSITIES_BY_COUNTRY } from "@/lib/africanUniversities";

/* ═══════════════ text helpers ═══════════════ */
const stripMarks = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const norm = (s) =>
    stripMarks(String(s ?? ""))
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/['’`]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

export const stem = (w) => {
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
};

const uniq = (a) => [...new Set(a)];
const compact = (s) => norm(s).replace(/\s+/g, "");

/* Damerau-Levenshtein (adjacent swaps count as one edit), with early exit */
function lev(a, b, max) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > max) return max + 1;
    let pp = null;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        let rowMin = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                v = Math.min(v, pp[j - 2] + 1);
            }
            cur[j] = v;
            if (v < rowMin) rowMin = v;
        }
        if (rowMin > max) return max + 1;
        pp = prev;
        prev = cur;
    }
    return prev[n];
}

/* ═══════════════ vocabulary ═══════════════ */
const STOP = new Set([
    "the", "of", "and", "for", "in", "on", "a", "an", "to", "by", "at", "from", "with",
    "pdf", "file", "files", "document", "documents", "doc", "docs", "book", "books",
    "download", "please", "find", "search", "show", "me", "my", "all", "any",
]);

const HONORIFIC = new Set([
    "dr", "prof", "professor", "engr", "barr", "mr", "mrs", "ms", "miss", "chief",
    "lecturer", "pharm", "rev", "pastor", "sir", "madam",
]);

/* Groups of words that mean the same thing for students */
const SYN_GROUPS = [
    ["past question", "pq", "past paper", "exam question"],
    ["lecture note", "handout", "note"],
    ["textbook", "text book"],
    ["project", "thesis", "dissertation"],
    ["lab", "laboratory"],
    ["math", "maths", "mathematics"],
    ["econ", "economics"],
    ["computer science", "cs", "computing"],
    ["information technology", "ict"],
    ["chemistry", "chem"],
    ["biology", "bio"],
    ["physics", "phy"],
    ["statistics", "stat", "stats"],
    ["accounting", "acct", "acc"],
    ["business administration", "bus admin", "ba"],
    ["political science", "poli sci", "polsci"],
    ["mass communication", "mass comm", "mascom"],
    ["medicine", "med", "mbbs"],
    ["jamb", "utme"],
    ["waec", "wassce"],
    ["neco", "ssce"],
    ["tutorial", "tut"],
    ["syllabus", "course outline"],
    ["semester", "sem"],
    ["first", "1st"],
    ["second", "2nd"],
    ["novel", "fiction"],
    ["religion", "divinity", "theology"],
    ["islamic", "islam", "quran"],
];

const SYN_MAP = new Map();
const SYN_MEMBERS = [];
SYN_GROUPS.forEach((g, i) => {
    const members = g.map((p) => norm(p).split(" ").map(stem));
    SYN_MEMBERS.push(members);
    members.forEach((m) => SYN_MAP.set(m.join(" "), i));
});

/* ═══════════════ universities ═══════════════ */
const CURATED = [
    ["University of Lagos", ["unilag", "ul", "akoka"]],
    ["Obafemi Awolowo University", ["oau", "ife", "ile ife", "oau ife"]],
    ["Ahmadu Bello University", ["abu", "abu zaria", "zaria"]],
    ["University of Ibadan", ["ui", "ibadan"]],
    ["University of Nigeria Nsukka", ["unn", "nsukka"]],
    ["University of Benin", ["uniben", "benin"]],
    ["University of Port Harcourt", ["uniport", "port harcourt"]],
    ["University of Ilorin", ["unilorin", "ilorin"]],
    ["University of Jos", ["unijos", "jos"]],
    ["University of Abuja", ["uniabuja", "abuja"]],
    ["University of Calabar", ["unical", "calabar"]],
    ["University of Uyo", ["uniuyo", "uyo"]],
    ["University of Maiduguri", ["unimaid", "maiduguri"]],
    ["Nnamdi Azikiwe University", ["unizik", "awka"]],
    ["Federal University of Technology Akure", ["futa", "akure"]],
    ["Federal University of Technology Minna", ["futminna", "minna"]],
    ["Federal University of Technology Owerri", ["futo", "owerri"]],
    ["Federal University of Agriculture Abeokuta", ["funaab", "abeokuta"]],
    ["Lagos State University", ["lasu"]],
    ["Bayero University Kano", ["buk", "kano"]],
    ["Covenant University", ["covenant", "cu"]],
    ["Babcock University", ["babcock"]],
    ["Ladoke Akintola University of Technology", ["lautech", "ogbomoso"]],
    ["Delta State University", ["delsu", "abraka"]],
    ["Rivers State University", ["rsu"]],
    ["Ambrose Alli University", ["aau", "ekpoma"]],
    ["Michael Okpara University of Agriculture", ["mouau", "umudike"]],
    ["Olabisi Onabanjo University", ["oou", "ago iwoye"]],
    ["Adekunle Ajasin University", ["aaua", "akungba"]],
    ["Usmanu Danfodiyo University", ["udus", "sokoto"]],
    ["Kwara State University", ["kwasu"]],
    ["Osun State University", ["uniosun"]],
    ["University of Ghana", ["ug", "legon"]],
    ["Kwame Nkrumah University of Science and Technology", ["knust", "kumasi"]],
    ["University of Cape Coast", ["ucc"]],
    ["University of Nairobi", ["uon"]],
    ["Makerere University", ["mak"]],
    ["University of Cape Town", ["uct"]],
    ["University of the Witwatersrand", ["wits"]],
    ["University of Dar es Salaam", ["udsm"]],
];

const UNIS = [];
const UNI_BY_KEY = new Map();
const UNI_BY_ALIAS = new Map();

function addUni(canonical, aliases = []) {
    const key = norm(canonical);
    if (!key || UNI_BY_KEY.has(key)) return;
    const al = uniq(aliases.map(norm).filter(Boolean));
    const e = {
        canonical,
        key,
        aliases: al,
        short: (al.find((a) => !a.includes(" ")) || "").toUpperCase(),
    };
    UNIS.push(e);
    UNI_BY_KEY.set(key, e);
    al.forEach((a) => { if (!UNI_BY_ALIAS.has(a)) UNI_BY_ALIAS.set(a, e); });
}

const acronym = (name) =>
    norm(name).split(" ").filter((w) => !["of", "the", "and", "for", "in", "at"].includes(w)).map((w) => w[0]).join("");

CURATED.forEach(([n, a]) => addUni(n, a));

/* Every university offered by the upload form also becomes searchable, with an automatic acronym */
try {
    Object.values(UNIVERSITIES_BY_COUNTRY || {}).forEach((list) => {
        (Array.isArray(list) ? list : []).forEach((u) => {
            const name = typeof u === "string" ? u : u?.name;
            if (!name) return;
            const k = norm(name);
            if (UNI_BY_KEY.has(k) || UNIS.some((e) => k.includes(e.key))) return;
            const ac = acronym(name);
            addUni(name, ac.length >= 3 ? [ac] : []);
        });
    });
} catch { /* list unavailable, curated aliases still work */ }

/** Maps whatever the seller typed ("UNILAG", "Univ. of Lagos, Akoka") to a known university */
export function resolveUniversity(name) {
    const s = norm(name);
    if (!s) return null;
    const direct = UNI_BY_KEY.get(s) || UNI_BY_ALIAS.get(s);
    if (direct) return direct;
    if (s.length >= 6) {
        for (const e of UNIS) {
            if (s.includes(e.key) || (s.length >= 8 && e.key.includes(s))) return e;
        }
    }
    return null;
}

export const uniShort = (name) => {
    const e = resolveUniversity(name);
    if (e && e.short && e.short.length <= 9) return e.short;
    return name || "";
};

/* ═══════════════ field builders ═══════════════ */
const INTENT_WORDS = {
    academic: "faculty academic university lecture course material",
    "student-prep": "student prep exam preparation past question waec neco jamb",
    divinity: "religion divinity theology sacred faith",
    commercial: "commercial book novel ebook general reading",
};
export const intentKey = (i) => (i === "students" ? "student-prep" : String(i || ""));
export const INTENT_LABEL = {
    academic: "Faculty / Academic",
    "student-prep": "Student Prep",
    divinity: "Divinity Vault",
    commercial: "Commercial",
};

function codeWords(code) {
    const c = compact(code);
    if (!c) return [];
    const parts = c.match(/[a-z]+|\d+[a-z]?/g) || [];
    return uniq([...norm(code).split(" "), ...parts, c]);
}

function levelText(level) {
    const l = norm(level);
    if (!l) return "";
    if (/^\d{3}$/.test(l)) return `${l} ${l}l ${l}lvl ${l}level level`;
    if (l === "pg") return "pg postgraduate masters msc phd graduate";
    if (/^ss\d$/.test(l)) return `${l} senior secondary ss`;
    return l;
}

function semesterText(s) {
    const t = norm(s);
    if (!t) return "";
    if (t.startsWith("first")) return `${t} 1st harmattan`;
    if (t.startsWith("second")) return `${t} 2nd rain`;
    return t;
}

function sessionText(s) {
    const ys = String(s || "").match(/\d{4}/g) || [];
    return [s, ...ys, ys.length === 2 ? `${ys[0].slice(2)} ${ys[1].slice(2)}` : ""].join(" ");
}

/* ═══════════════ Firestore doc -> unified book ═══════════════ */
export function fromFirestore(id, d) {
    const price = Number(d.price) || 0;
    return {
        id: `firestore-${id}`,
        firestoreId: id,
        source: "firestore",
        title: d.bookTitle || d.title || "",
        author: d.author || "",
        sellerId: d.sellerId || d.userId || "",
        sellerName: d.sellerName || "",
        docType: d.docType || d.resourceType || "",
        intent: intentKey(d.intent),
        category: d.category || "",
        description: d.description || "",
        toc: d.tableOfContents || "",
        university: d.university || "",
        universityCountry: d.universityCountry || "",
        department: d.department || "",
        faculty: d.faculty || "",
        courseCode: d.courseCode || "",
        level: d.level || "",
        semester: d.semester || "",
        session: d.session || "",
        examBody: d.examBody || "",
        school: d.school || "",
        theologicalCategory: d.theologicalCategory || "",
        doctrine: d.doctrine || "",
        genre: d.genre || "",
        isbn: d.isbn || "",
        edition: d.edition || "",
        subject: d.subject || "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        format: d.format || "PDF",
        pages: d.pages || null,
        price,
        isFree: d.isFree === true || price === 0,
        isNegotiable: d.isNegotiable === true,
        image: d.coverImage || d.image || "",
        driveFileId: d.driveFileId || "",
        embedUrl: d.embedUrl || "",
        pdfUrl: d.pdfUrl || "",
        averageRating: Number(d.averageRating ?? d.average_rating ?? 0) || 0,
        totalReviewCount: Number(d.totalReviewCount ?? d.total_review_count ?? 0) || 0,
        salesCount: Number(d.salesCount ?? d.sales_count ?? d.purchases ?? 0) || 0,
        views: Number(d.views || 0) || 0,
        searchScore: Number(d.searchScore || 0) || 0,
        createdMs: d.createdAt?.toMillis?.() ?? 0,
    };
}

export function fromPlatform(b) {
    const price = Number(b.price) || 0;
    return {
        id: String(b.id),
        firestoreId: "",
        source: "platform",
        title: b.title || "",
        author: b.author || "",
        sellerId: "",
        sellerName: "",
        docType: b.resourceType || b.docType || "",
        intent: intentKey(b.intent),
        category: b.category || "",
        description: b.description || "",
        toc: "",
        university: b.university || "",
        universityCountry: "",
        department: b.department || "",
        faculty: b.faculty || "",
        courseCode: b.courseCode || "",
        level: b.level || "",
        semester: "",
        session: b.session || b.year || "",
        examBody: "",
        school: "",
        theologicalCategory: "",
        doctrine: "",
        genre: "",
        isbn: "",
        edition: "",
        subject: b.subject || "",
        tags: Array.isArray(b.tags) ? b.tags : [],
        format: b.format || "PDF",
        pages: b.pages || null,
        price,
        isFree: price === 0,
        isNegotiable: false,
        image: b.image || "",
        driveFileId: b.driveFileId || "",
        embedUrl: b.embedUrl || "",
        pdfUrl: b.pdfUrl || "",
        averageRating: Number(b.averageRating ?? b.average_rating ?? 0) || 0,
        totalReviewCount: Number(b.totalReviewCount ?? b.total_review_count ?? 0) || 0,
        salesCount: Number(b.salesCount ?? b.sales_count ?? 0) || 0,
        views: 0,
        searchScore: Number(b.searchScore || 0) || 0,
        createdMs: 0,
    };
}

/* ═══════════════ index ═══════════════ */
function makeAdder(fields) {
    return (k, w, text, fuzzy = true) => {
        const t = norm(text);
        if (!t) return;
        fields.push({ k, w, text: t, words: t.split(" ").map(stem), fuzzy });
    };
}

export function buildIndex(list) {
    return list.map((b) => {
        const uni = resolveUniversity(b.university);
        const uniText = [b.university, uni?.canonical, ...(uni?.aliases || []), b.universityCountry]
            .filter(Boolean).join(" ");
        const fields = [];
        const add = makeAdder(fields);

        add("title", 10, b.title);
        add("code", 9, codeWords(b.courseCode).join(" "), false);
        add("isbn", 8, b.isbn && b.isbn !== "N/A" ? `${b.isbn} ${compact(b.isbn)}` : "", false);
        add("uni", 7, uniText);
        add("author", 6, b.author);
        add("seller", 6, b.sellerName);
        add("type", 6, b.docType);
        add("exam", 6, b.examBody);
        add("dept", 5, `${b.department} ${b.faculty}`);
        add("cat", 4, `${b.category} ${b.genre} ${b.subject}`);
        add("school", 4, b.school);
        add("faith", 4, `${b.theologicalCategory} ${b.doctrine}`);
        add("tags", 4, (b.tags || []).join(" "));
        add("level", 4, levelText(b.level), false);
        add("sem", 3, semesterText(b.semester), false);
        add("session", 3, sessionText(b.session), false);
        add("intent", 3, INTENT_WORDS[intentKey(b.intent)] || "");
        add("edition", 2, b.edition);
        add("desc", 2.5, b.description, false);
        add("toc", 1.5, b.toc, false);

        const qBoost =
            1 + Math.min(
                0.25,
                Math.log1p(b.salesCount) * 0.04 + (b.averageRating / 5) * 0.08 + Math.log1p(b.views) * 0.01
            );

        return {
            book: b,
            fields,
            titleNorm: norm(b.title),
            codeCompact: compact(b.courseCode),
            level: norm(b.level),
            session: String(b.session || ""),
            uniKey: uni?.canonical || b.university || "",
            qBoost,
        };
    });
}

export function buildProfileIndex(list) {
    return list.map((p) => {
        const uni = resolveUniversity(p.university);
        const fields = [];
        const add = makeAdder(fields);
        add("name", 10, `${p.name} ${p.slug}`);
        add("business", 7, p.business);
        add("uni", 6, [p.university, uni?.canonical, ...(uni?.aliases || [])].filter(Boolean).join(" "));
        add("dept", 4, p.department);
        add("title", 3, p.title);
        add("state", 2, p.state);
        return { profile: p, fields };
    });
}

/* ═══════════════ query parsing ═══════════════ */
export function parseQuery(raw) {
    const n = norm(raw);
    const rt = n.split(" ").filter(Boolean);
    const tokens = [];
    let i = 0;
    while (i < rt.length) {
        let used = 0, group = -1;
        for (let len = Math.min(3, rt.length - i); len >= 1; len--) {
            const phrase = rt.slice(i, i + len).map(stem).join(" ");
            if (SYN_MAP.has(phrase)) { group = SYN_MAP.get(phrase); used = len; break; }
        }
        if (group >= 0) {
            const own = rt.slice(i, i + used).map(stem);
            const variants = [{ w: own, q: 1 }];
            SYN_MEMBERS[group].forEach((m) => {
                if (m.join(" ") !== own.join(" ")) variants.push({ w: m, q: used > 1 ? 0.9 : 0.8 });
            });
            tokens.push({ variants, optional: false });
            i += used;
            continue;
        }
        const t = rt[i];
        i += 1;
        if (STOP.has(t)) continue;
        tokens.push({ variants: [{ w: [stem(t)], q: 1 }], optional: HONORIFIC.has(t) });
    }
    if (!tokens.length && rt.length) {
        // the query was only filler words: use them as they are
        rt.forEach((t) => tokens.push({ variants: [{ w: [stem(t)], q: 1 }], optional: false }));
    }

    const codes = [];
    const re = /\b([a-z]{2,4})\s?(\d{3,4}[a-z]?)\b/g;
    let m;
    while ((m = re.exec(n))) codes.push(m[1] + m[2]);

    const lv = n.match(/\b([1-9]00)\s?(?:l|lv|lvl|level)\b/) || n.match(/\blevel\s?([1-9]00)\b/);
    const years = n.match(/\b20\d{2}\b/g) || [];

    return { raw, n, tokens, codes: uniq(codes), level: lv ? lv[1] : "", years };
}

/** Small chips shown under the search box: what the engine understood */
export function queryHints(pq) {
    const chips = [];
    pq.codes.forEach((c) => {
        chips.push({ kind: "code", label: c.replace(/^([a-z]+)(\d.*)$/, (_, a, b) => `${a.toUpperCase()} ${b.toUpperCase()}`) });
    });
    const words = pq.n.split(" ").filter(Boolean);
    let found = null;
    for (let len = Math.min(4, words.length); len >= 1 && !found; len--) {
        for (let s = 0; s + len <= words.length && !found; s++) {
            const phrase = words.slice(s, s + len).join(" ");
            found = UNI_BY_ALIAS.get(phrase) || UNI_BY_KEY.get(phrase) || null;
        }
    }
    if (found) chips.push({ kind: "uni", label: found.canonical });
    if (pq.level) chips.push({ kind: "level", label: `${pq.level} Level` });
    pq.years.forEach((y) => chips.push({ kind: "year", label: y }));
    return chips;
}

/* ═══════════════ matching ═══════════════ */
function matchWord(t, f) {
    const ws = f.words;
    const tl = t.length;
    const numeric = /^\d+$/.test(t);
    let best = 0;
    for (let i = 0; i < ws.length; i++) {
        const w = ws[i];
        if (w === t) return 1;
        if (numeric) continue;
        if (tl >= 3 && w.length > tl && w.startsWith(t)) {
            const s = 0.72 + 0.2 * (tl / w.length);
            if (s > best) best = s;
            continue;
        }
        if (w.length >= 4 && tl > w.length && t.startsWith(w)) {
            if (best < 0.5) best = 0.5;
            continue;
        }
        if (f.fuzzy && tl >= 5 && Math.abs(w.length - tl) <= 2) {
            const k = tl >= 9 ? 2 : 1;
            if (lev(t, w, k) <= k) {
                const s = k === 1 ? 0.6 : 0.55;
                if (s > best) best = s;
            }
        }
    }
    if (best < 0.45 && tl >= 4 && f.fuzzy && f.text.includes(t)) best = 0.45;
    return best;
}

function matchVariant(v, f) {
    if (v.w.length === 1) return matchWord(v.w[0], f);
    let min = 1;
    for (const w of v.w) {
        const q = matchWord(w, f);
        if (!q) return 0;
        if (q < min) min = q;
    }
    return min;
}

function scoreItem(it, pq, relaxed, gate) {
    let sum = 0, req = 0, reqHit = 0, optHit = 0, titleHits = 0, gateHit = false;

    for (const tok of pq.tokens) {
        let best = 0, bestKey = "", bestQ = 0;
        for (const f of it.fields) {
            let q = 0;
            for (const v of tok.variants) {
                const m = matchVariant(v, f);
                if (m) {
                    const x = m * v.q;
                    if (x > q) q = x;
                }
            }
            if (q) {
                const s = q * f.w;
                if (s > best) { best = s; bestKey = f.k; bestQ = q; }
            }
        }
        if (tok.optional) {
            if (best) { optHit++; sum += best * 0.35; }
        } else {
            req++;
            if (best) {
                reqHit++;
                sum += best;
                if (bestKey === "title") titleHits++;
                if (gate && gate.includes(bestKey) && bestQ >= 0.6) gateHit = true;
            }
        }
    }

    const need = req === 0 ? 1 : relaxed ? 1 : req <= 2 ? req : Math.ceil(req * 0.7);
    const got = req === 0 ? optHit : reqHit;
    if (got < need) return null;
    if (gate && !gateHit && !(req === 0 && optHit)) return null;

    let score = sum;
    if (req > 0 && reqHit === req) score += 6 + 2 * req;
    if (titleHits >= 2) score += 5;

    if (it.titleNorm && pq.n.length >= 3) {
        if (it.titleNorm === pq.n) score += 40;
        else if (it.titleNorm.startsWith(pq.n)) score += 18;
        else if (it.titleNorm.includes(pq.n)) score += 12;
    }
    if (it.codeCompact) for (const c of pq.codes) if (it.codeCompact === c) score += 40;
    if (pq.level && it.level === pq.level) score += 14;
    if (pq.years.length && it.session && pq.years.some((y) => it.session.includes(y))) score += 8;
    if (it.book?.searchScore) score += Math.min(it.book.searchScore, 200) / 40;
    if (it.qBoost) score *= it.qBoost;
    return { score };
}

export function searchBooks(index, pq, relaxed = false) {
    if (!pq.tokens.length) return [];
    const out = [];
    for (const it of index) {
        const r = scoreItem(it, pq, relaxed, null);
        if (r) out.push({ item: it, score: r.score });
    }
    out.sort((a, b) => b.score - a.score);
    return relaxed ? out.slice(0, 80) : out;
}

/** People: a profile must match on the name (or shop name) to show up, other fields only add score */
export function searchProfiles(pindex, pq) {
    if (!pq.tokens.length) return [];
    const out = [];
    for (const it of pindex) {
        const r = scoreItem(it, pq, false, ["name", "business"]);
        if (r) out.push({ item: it, score: r.score });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
}

/* ═══════════════ trust ordering ═══════════════ */
export const trustTier = (t) =>
    t && t.faculty && t.verified ? 3 : t && t.faculty ? 2 : t && t.verified ? 1 : 0;

/**
 * Verified faculty and verified sellers come first, but only when their document is a real match
 * (at least 30% as relevant as the best result). Inside each group the best match wins.
 */
export function orderByTrust(results, trustOf) {
    const mult = [1, 1.1, 1.2, 1.3];
    const maxScore = results.reduce((m, r) => (r.score > m ? r.score : m), 0);
    const rows = results.map((r) => {
        const tier = trustTier(trustOf(r.item.book));
        return {
            book: r.item.book,
            uniKey: r.item.uniKey,
            score: r.score,
            tier,
            trusted: tier > 0 && r.score >= 0.3 * maxScore,
            rank: r.score * mult[tier],
        };
    });
    rows.sort((a, b) => Number(b.trusted) - Number(a.trusted) || b.rank - a.rank);
    return rows;
}