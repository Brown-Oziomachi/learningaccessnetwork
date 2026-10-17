// app/blog/BlogCover.js
// Cover art drawn in code. No image files needed.

const ART = {
    book: (
        <>
            <path d="M20 150V50q40-18 80 0q40-18 80 0v100q-40-18-80 0q-40-18-80 0Z" />
            <path d="M100 50v100" />
            <path d="M40 82q25-8 45 0M40 104q25-8 45 0M115 82q25-8 45 0M115 104q25-8 45 0" />
        </>
    ),
    growth: (
        <>
            <rect x="28" y="118" width="30" height="52" />
            <rect x="76" y="88" width="30" height="82" />
            <rect x="124" y="56" width="30" height="114" />
            <path d="M28 82L82 50l30 16 56-40" />
            <path d="M150 26h18v18" />
        </>
    ),
    files: (
        <>
            <rect x="52" y="26" width="116" height="72" rx="4" fill="#12305c" />
            <rect x="34" y="58" width="116" height="72" rx="4" fill="#12305c" />
            <rect x="44" y="92" width="116" height="72" rx="4" fill="#12305c" />
            <path d="M62 112h80M62 130h60M62 148h44" />
        </>
    ),
    cap: (
        <>
            <path d="M100 38l82 36-82 36-82-36Z" />
            <path d="M52 92v36q48 26 96 0V92" />
            <path d="M182 74v52" />
            <circle cx="182" cy="132" r="6" />
        </>
    ),
    nodes: (
        <>
            <circle cx="100" cy="100" r="22" />
            <circle cx="40" cy="50" r="10" />
            <circle cx="165" cy="45" r="10" />
            <circle cx="160" cy="155" r="10" />
            <circle cx="45" cy="150" r="10" />
            <path d="M48 56l34 29M157 52l-39 33M153 148l-35-31M52 143l30-26" />
        </>
    ),
};

const KEY = {
    "Study Smarter": "book",
    "Earn From Knowledge": "growth",
    "Academic Resources": "files",
    "Faculty & Authors": "cap",
    "Student Skills": "nodes",
};

// `seed` (the post slug) gives each cover a slightly different layout
export default function BlogCover({ category, seed = "", showTag = true }) {
    const art = ART[KEY[category] || "book"];
    const v = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 3;
    return (
        <div className={`lb-cover lb-v${v}`} aria-hidden="true">
            <div className="lb-cover-glow" />
            <svg
                className="lb-cover-art"
                viewBox="0 0 200 200"
                fill="none"
                stroke="#d4aa5a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {art}
            </svg>
            {showTag && <span className="lb-cover-tag">{category}</span>}
        </div>
    );
}