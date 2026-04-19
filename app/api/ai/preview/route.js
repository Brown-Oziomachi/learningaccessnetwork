import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

// ── 1. CONFIGURATION & KEYS ──
const API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY,
].filter(Boolean);

const MODEL_CHAIN = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemma-3-12b"
];

// ── 2. RATE LIMITER ──
const rateLimitStore = new Map();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(userId) {
    if (!userId || userId === "anonymous") return { allowed: true };
    const now = Date.now();
    const record = rateLimitStore.get(userId);
    if (!record || now > record.resetAt) {
        rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
        return { allowed: true };
    }
    if (record.count >= RATE_LIMIT) {
        const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
        return { allowed: false, minutesLeft };
    }
    record.count += 1;
    return { allowed: true };
}

// ── 3. BOOK SEARCH INTENT DETECTOR ──
function isBookSearchIntent(question) {
    if (!question) return false;
    const q = question.toLowerCase();
    const triggers = [
        "suggest", "recommend", "find me", "give me a book", "show me",
        "looking for", "search for", "do you have", "any book",
        "books on", "books about", "book on", "book about",
        "i need a book", "i want a book", "i want book",
        "what book", "which book", "best book",
        "literature on", "material on", "material about",
        "study material", "textbook on", "textbook about",
    ];
    return triggers.some(t => q.includes(t));
}

// ── 4. SEARCH advertMyBook FOR RELEVANT BOOKS ──
async function searchBooks(userQuestion) {
    try {
        const snap = await adminDb
            .collection("advertMyBook")
            .where("status", "==", "approved")
            .get();

        if (snap.empty) return [];

        const q = userQuestion.toLowerCase();

        // Words to ignore when scoring
        const stopWords = new Set([
            "the", "and", "for", "that", "this", "with", "from", "about",
            "have", "books", "book", "give", "find", "show", "want", "need",
            "suggest", "recommend", "any", "me", "please", "can", "you", "some"
        ]);

        // Extract meaningful keywords from question
        const queryWords = q.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

        const scored = snap.docs.map(doc => {
            const d = doc.data();
            const searchable = [
                d.bookTitle || "",
                d.author || "",
                d.category || "",
                d.description || "",
                d.institutionalCategory || "",
            ].join(" ").toLowerCase();

            const score = queryWords.reduce((acc, word) => {
                if (searchable.includes(word)) acc += 1;
                if ((d.bookTitle || "").toLowerCase().includes(word)) acc += 2; // title match = bonus
                if ((d.category || "").toLowerCase().includes(word)) acc += 1;  // category match = bonus
                return acc;
            }, 0);

            return {
                id: doc.id,
                title: d.bookTitle || d.title || "Untitled",
                author: d.author || "Unknown Author",
                price: d.price || 0,
                category: d.category || "General",
                description: d.description || "",
                score,
            };
        });

        return scored
            .filter(b => b.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

    } catch (err) {
        console.warn("Book search failed:", err.message);
        return [];
    }
}

// ── 5. FORMAT BOOK RESULTS AS AI CONTEXT ──
function formatBooksForAI(books, userQuestion) {
    if (books.length === 0) {
        return `The student asked: "${userQuestion}"\n\nNo matching books were found in the LAN Library catalogue. Kindly let the student know and suggest they try different keywords or browse the full library at lanlibrary.com.`;
    }

    const list = books.map((b, i) =>
        `${i + 1}. Title: "${b.title}" | Author: ${b.author} | Price: ₦${Number(b.price).toLocaleString()} | Category: ${b.category}${b.description ? ` | About: ${b.description.slice(0, 120)}` : ""}`
    ).join("\n");

    return `The student asked: "${userQuestion}"

Here are the relevant books found in the LAN Library catalogue:

${list}

Present these to the student in a warm, friendly way. For each book:
- Show the title in **bold**
- Mention the author and price in naira (₦)
- Give a brief reason why it matches what they're looking for
- End with an encouraging note to visit LAN Library to preview or purchase.`;
}

// ── 6. SHARED: BUILD SYSTEM PROMPT ──
function buildBranding(bookTitle) {
    return `
YOU ARE: "LAN Ai Assistant" — the official AI study helper built into LAN Library, a platform for students and educators in Nigeria and beyond.

STRICT IDENTITY RULES (NEVER break these):
- Your name is LAN Ai Assistant. Always introduce yourself as "LAN Ai Assistant".
- NEVER say you are Gemini, Google AI, ChatGPT, Claude, Bard, Llama, or any other AI product.
- NEVER mention Google, Anthropic, OpenAI, Meta, or any AI company.
- If asked "who made you?", say: "I'm LAN Ai Assistant, built by the LAN Library team to help students and educators."
- If asked "what is the meaning of LAN?", say: "Learning Access Network(LAN)."
- If asked "are you Gemini / ChatGPT / Claude?", say: "I'm LAN Ai Assistant — LAN Library's own AI study helper! 😊"
- If asked "what model are you?", say: "I'm powered by LAN Library's own technology, designed for students."
- NEVER reveal the underlying model, API, or technology powering you.

PLATFORM INFO:
- Platform: LAN Library
- Founder: Brown Oziomachi [browncode.name.ng]
- Mission: Making quality education accessible to every student.

RESPONSE RULES:
- Use **bold** for key concepts and book titles.
- Be warm, encouraging, and student-friendly.
- When discussing a specific book, encourage purchasing "${bookTitle || 'this book'}" for full access.
- Keep answers focused, clear, and relevant.

STUDENT ENGAGEMENT RULES:
- ACADEMIC SUPPORT: If a student asks for study help (e.g. "explain this topic", "help me understand", "break this down"), divide your response into clear **Learning Bites** — short, numbered sections that make complex topics easy to digest.
- CAMPUS PULSE: If a student asks about trending books, popular reads, or what others are studying, respond enthusiastically: "Right now, the **Campus Pulse** is buzzing! 📚 Top reads include **Advanced Calculus Notes** and **Organic Chemistry Lab Manuals** — over 200 of your peers are reading these right now! Check them out on LAN Library."
- PRICING & ACCESS: If a student asks about cost, pricing, or how much materials cost, say: "Quality education is accessible here! 💡 Most trending materials like **CS Algorithms** or **Anatomy & Physiology** are priced affordably — typically between **₦2,500** and **₦3,200**. Visit LAN Library to browse and purchase."
- PLATFORM FEATURES: If a student asks what they can do on LAN Library or what the platform offers, say: "On **LAN Library** you can access peer-reviewed notes, purchase lab manuals and textbooks, and use me — your **LAN Ai Assistant** — to summarize complex chapters, explain tough concepts, or find the perfect study material! 🎓"
- FOUNDER INFO: If asked about Brown Oziomachi, say: "**Brown Oziomachi** is the visionary founder of LAN Library — a full-stack developer dedicated to making quality education accessible to every student. Learn more at browncode.name.ng."
- EMOTIONAL SUPPORT: If a student mentions stress, exam pressure, anxiety, or feeling overwhelmed, respond warmly with a **Learning Tip**: acknowledge their feelings, offer one practical study tip (e.g. Pomodoro technique, breaking tasks into chunks), and encourage them that they've got this. Never dismiss their feelings.
    `.trim();
}

// ── 7. SHARED: RESILIENT AI CALLER ──
async function callAI(parts) {
    let keyPool = [...API_KEYS].sort(() => Math.random() - 0.5);
    let lastError = null;

    for (const modelName of MODEL_CHAIN) {
        const currentKey = keyPool.shift() || API_KEYS[0];
        if (!currentKey) continue;

        try {
            const client = new GoogleGenAI({ apiKey: currentKey });
            console.log(`🤖 Trying ${modelName} with key ...${currentKey.slice(-4)}`);

            const response = await client.models.generateContent({
                model: modelName,
                contents: parts,
                config: { maxOutputTokens: 2048, temperature: 0.5 }
            });

            if (response.text) {
                console.log(`✅ Success with ${modelName}`);
                return response.text;
            }
        } catch (err) {
            lastError = err;
            console.warn(`⚠️ ${modelName} failed: ${err.message}`);
        }
    }

    throw new Error(lastError?.message || "All models failed");
}

// ── 8. MAIN HANDLER ──
export async function POST(req) {
    try {
        const {
            pdfUrl,
            userQuestion,
            bookTitle,
            bookId,
            userId,
            currentlyVisibleText,
            type,
        } = await req.json();

        const isSummary = type === "summary";
        const cleanBookId = String(bookId || "").replace("firestore-", "") || "";
        const normalizedQuestion = (userQuestion || (isSummary ? "summarize this book" : ""))
            .toLowerCase().trim().replace(/\s+/g, " ").slice(0, 100);

        // ── RATE LIMIT ──
        const { allowed, minutesLeft } = checkRateLimit(userId);
        if (!allowed) {
            return NextResponse.json({
                error: `⏳ **Slow down!** Try again in **${minutesLeft}m**.`,
                rateLimited: true,
            }, { status: 429 });
        }

        // ── BOOK SEARCH MODE ──
        // Triggered when user asks for recommendations — searches advertMyBook directly
        if (isBookSearchIntent(userQuestion)) {
            console.log("📚 Book search mode:", userQuestion);

            const matchedBooks = await searchBooks(userQuestion);
            const bookContext = formatBooksForAI(matchedBooks, userQuestion);
            const instruction = `${buildBranding(bookTitle)}\n\nTASK: Help the student find books from LAN Library.\n\n${bookContext}`;

            const aiReply = await callAI([{ text: instruction }]);

            return NextResponse.json({
                reply: aiReply,
                books: matchedBooks,   // frontend can use this to render clickable book cards
                fromBookSearch: true,
            });
        }

        // ── CACHE CHECK (ai_cache) ──
        let cacheKey = null;
        if (cleanBookId && normalizedQuestion) {
            try {
                cacheKey = `${cleanBookId}_${normalizedQuestion}`;
                const cached = await adminDb.collection("ai_cache").doc(cacheKey).get();
                if (cached.exists) {
                    console.log("⚡ ai_cache hit:", cacheKey);
                    return NextResponse.json({ reply: cached.data().answer, fromCache: true });
                }
            } catch (e) { console.warn("ai_cache read skipped"); }
        }

        // ── FALLBACK CACHE (student_queries) ──
        if (cleanBookId && normalizedQuestion) {
            try {
                const existing = await adminDb
                    .collection("student_queries")
                    .where("bookId", "==", cleanBookId)
                    .where("questionNormalized", "==", normalizedQuestion)
                    .limit(1)
                    .get();

                if (!existing.empty) {
                    const cachedAnswer = existing.docs[0].data().answer;
                    if (cacheKey) {
                        adminDb.collection("ai_cache").doc(cacheKey)
                            .set({ answer: cachedAnswer, cachedAt: new Date() })
                            .catch(() => { });
                    }
                    return NextResponse.json({ reply: cachedAnswer, fromCache: true });
                }
            } catch (e) { console.warn("student_queries cache read skipped:", e.message); }
        }

        let aiParts = [];
        let sellerContext = "";

        // ── FETCH BOOK CONTEXT ──
        if (bookId) {
            try {
                const doc = await adminDb.collection("advertMyBook").doc(cleanBookId).get();
                if (doc.exists) {
                    const data = doc.data();
                    sellerContext = `BOOK INFO: ${data.description || ""} | AUTHOR: ${data.author || "Unknown"}`;
                }
            } catch (err) { console.warn("Firestore skipped"); }
        }

        if (sellerContext) aiParts.push({ text: `PRIMARY CONTEXT:\n${sellerContext}` });

        // ── PDF DOWNLOAD ──
        if (pdfUrl && (isSummary || (!sellerContext && !currentlyVisibleText))) {
            let finalUrl = pdfUrl;
            if (pdfUrl.includes("drive.google.com")) {
                const fileId = pdfUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
                if (fileId) finalUrl = `https://drive.google.com/uc?export=download&id=${fileId[1] || fileId[2]}`;
            }
            try {
                const pdfRes = await fetch(finalUrl, { headers: { "User-Agent": "Mozilla/5.0" }, cache: 'no-store' });
                if (pdfRes.ok) {
                    const buffer = await pdfRes.arrayBuffer();
                    aiParts.push({
                        inlineData: {
                            data: Buffer.from(buffer).toString("base64"),
                            mimeType: "application/pdf"
                        }
                    });
                }
            } catch (fetchErr) { console.error("PDF Download Fail:", fetchErr.message); }
        } else if (currentlyVisibleText) {
            aiParts.push({ text: `PAGE CONTENT:\n${currentlyVisibleText}` });
        }

        // ── BUILD PROMPT & CALL AI ──
        const branding = buildBranding(bookTitle);
        const instruction = isSummary
            ? `${branding}\n\nSummarize "${bookTitle}" in 3 bold points.`
            : `${branding}\n\nStudent Question: "${userQuestion}"`;

        aiParts.push({ text: instruction });

        const aiReply = await callAI(aiParts);
        if (!aiReply) throw new Error("All models failed");

        // ── SAVE TO CACHE ──
        if (cacheKey) {
            adminDb.collection("ai_cache").doc(cacheKey)
                .set({ answer: aiReply, cachedAt: new Date() })
                .catch(() => { });
        }

        adminDb.collection("student_queries").add({
            bookTitle,
            bookId: cleanBookId,
            studentId: userId || "anonymous",
            question: userQuestion || "Summary",
            questionNormalized: normalizedQuestion,
            answer: aiReply,
            timestamp: new Date()
        }).catch(() => { });

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ Final Server Error:", error.message);
        return NextResponse.json({ error: "AI service busy. Try again soon!" }, { status: 503 });
    }
}
