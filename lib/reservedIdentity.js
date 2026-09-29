// lib/reservedIdentity.js
// Shared by signup, seller registration and any API route that accepts a name.

const RESERVED_TERMS = [
    "lanlibrary",
    "learningaccessnetwork",
    "lanofficial",
    "lansupport",
    "lanadmin",
];

const OFFICIAL_EMAIL = "lanlibrarydocs@gmail.com";

// Lowercase, undo common look-alike swaps (L4N, l1brary), drop everything that isn't a letter
const normalizeName = (s = "") =>
    s
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/[1!|]/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/[^a-z]/g, "");

export const isReservedName = (name) => {
    const n = normalizeName(name);
    return RESERVED_TERMS.some((t) => n.includes(t));
};

// Gmail ignores dots and +tags, so lanlibrary.docs+x@gmail.com is the same inbox
const normalizeEmail = (email = "") => {
    const [local, domain] = email.trim().toLowerCase().split("@");
    if (!domain) return email.trim().toLowerCase();
    if (domain === "gmail.com" || domain === "googlemail.com") {
        return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
    }
    return `${local}@${domain}`;
};

export const isReservedEmail = (email) =>
    normalizeEmail(email) === normalizeEmail(OFFICIAL_EMAIL);

export const RESERVED_MESSAGE =
    "This identity is reserved for Official LAN Library. Contact support if this is you.";

export { OFFICIAL_EMAIL };