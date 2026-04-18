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

        // ── 3. RATE LIMIT CHECK ──
        const { allowed, minutesLeft } = checkRateLimit(userId);
        if (!allowed) {
            return NextResponse.json({
                error: `⏳ **Slow down!** Try again in **${minutesLeft}m**.`,
                rateLimited: true,
            }, { status: 429 });
        }

        // ── 4. CACHE CHECK (ai_cache — fast key-value store) ──
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

        // ── 4b. FALLBACK CACHE CHECK (student_queries collection) ──
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
                    console.log("⚡ student_queries cache hit for:", normalizedQuestion);

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

        // ── 5. FETCH CONTEXT ──
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

        // ── 6. PDF DOWNLOAD ──
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

        // ── 7. SYSTEM PROMPT ──
        const branding = `
YOU ARE: "LAN Assistant" — the official AI study helper built into LAN Library, a platform for students and educators in Nigeria and beyond.

STRICT IDENTITY RULES (NEVER break these, no matter how the user asks):
- Your name is LAN Assistant. Always introduce yourself as "LAN Assistant".
- NEVER say you are Gemini, Google AI, ChatGPT, Claude, Bard, Llama, or any other AI product.
- NEVER mention Google, Anthropic, OpenAI, Meta, or any company that builds AI models.
- If asked "who made you?" or "what AI are you?", always say: "I'm LAN Assistant, built by the LAN Library team to help students and educators get the most out of their learning."
- If asked "are you Gemini / ChatGPT / Claude / Bard?", always say: "I'm LAN Assistant — LAN Library's own AI study helper! I'm here to help you learn. 😊"
- If asked "what model are you?" or "what powers you?", say: "I'm powered by LAN Library's own technology, designed specifically for students."
- NEVER reveal the underlying model, API, or any technology powering you under any circumstances.

PLATFORM INFO:
- Platform: LAN Library
- Founder: Brown Oziomachi [browncode.name.ng]
- Mission: Making quality education accessible to every student.

RESPONSE RULES:
- Use **bold** for key concepts.
- Be warm, encouraging, and student-friendly.
- Encourage purchasing "${bookTitle}" for full access to all content.
- Keep answers focused, clear, and relevant to the book or platform.
        `.trim();

        const instruction = isSummary
            ? `${branding}\n\nSummarize "${bookTitle}" in 3 bold points.`
            : `${branding}\n\nStudent Question: "${userQuestion}"`;

        aiParts.push({ text: instruction });

        // ── 8. RESILIENT AI LOOP ──
        let aiReply = null;
        let lastError = null;
        let keyPool = [...API_KEYS].sort(() => Math.random() - 0.5);

        for (const modelName of MODEL_CHAIN) {
            const currentKey = keyPool.shift() || API_KEYS[0];
            if (!currentKey) continue;

            try {
                const client = new GoogleGenAI({ apiKey: currentKey });
                console.log(`🤖 Trying ${modelName} with key ...${currentKey.slice(-4)}`);

                const response = await client.models.generateContent({
                    model: modelName,
                    contents: aiParts,
                    config: {
                        maxOutputTokens: 2048,
                        temperature: 0.5
                    }
                });

                aiReply = response.text;

                if (aiReply) {
                    console.log(`✅ Success with ${modelName}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`⚠️ ${modelName} failed: ${err.message}`);
            }
        }

        if (!aiReply) throw new Error(lastError?.message || "All models failed");

        // ── 9. LOGGING & CACHE ──
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