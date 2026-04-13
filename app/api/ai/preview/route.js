import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

// ── 1. API KEYS ──
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
].filter(Boolean);

const MODEL_CHAIN = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
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
        return { allowed: false, minutesLeft: Math.ceil((record.resetAt - now) / 60000) };
    }
    record.count += 1;
    return { allowed: true };
}

// ── 3. LAN DOCS KNOWLEDGE BASE ──
// Mirrors your SEARCH_INDEX. Update both together when you add new docs.
// Injected into every AI call so the AI can answer platform questions accurately.
const LAN_DOCS = [
    { title: "What is LAN Library?", desc: "LAN Library is a digital knowledge marketplace where users purchase permanent access to books, notes, research papers, and study guides. It combines a digital library with a marketplace." },
    { title: "The L.A.N Network", desc: "The Learning Access Network (L.A.N) is a transformative platform for leadership development and personal growth. It connects individuals with resources, mentors, and a supportive community to empower people to reach their full potential." },
    { title: "Creating Your Account", desc: "Sign up with Google Sign In or email and password. No subscription required to browse. Full guide at /lan/net/help-center/article/creating-your-account" },
    { title: "How to Purchase a Book", desc: "Search for a book, preview it, then click Purchase. Payment is processed securely and the book is instantly added to your personal library permanently. Guide at /docs" },
    { title: "Downloading Your PDFs", desc: "After purchasing, go to My Books. Books are stored permanently and accessible from any device anytime. Guide at /lan/net/help-center/article/downloading-pdfs" },
    { title: "Becoming a Seller", desc: "Complete your seller profile and pass quick verification. Then upload documents to start selling and earning money. Sellers set their own prices." },
    { title: "Uploading Documents", desc: "As a seller, go to the Upload/Advertise page. Add a detailed description, set your price, and submit for quality review before it goes live." },
    { title: "Pricing Your Content", desc: "Creators set their own prices and have full control over the value of their work. The platform takes a small commission to maintain operations — more money goes directly to creators." },
    { title: "Earnings and Withdrawals", desc: "Earnings accumulate in your secure LAN wallet instantly when someone purchases your document. Request withdrawals at any time through your seller dashboard." },
    { title: "Analytics Dashboard", desc: "Track your sales, monitor content performance, and view detailed analytics for all your uploaded documents from your seller account." },
    { title: "Quality Standards", desc: "Every document is verified for originality, relevance, and appropriateness before going live. Sellers with high-quality content earn badges and featured placement." },
    { title: "Security and Trust", desc: "Every transaction is encrypted using industry-standard protocols. Digital watermarking prevents unauthorized sharing. Every seller is verified before selling." },
    { title: "Wallet System", desc: "A managed wallet system where every transaction is tracked, verified, and protected. Buyers pay securely, sellers earn instantly, withdrawals are available anytime." },
    { title: "Content Protection", desc: "Digital watermarking and tracking systems prevent unauthorized sharing and copyright violations. Continuous monitoring protects both buyers and sellers." },
    { title: "Payment Methods", desc: "Secure payment processing protected by international security standards. Multiple payment options available. Guide at /lan/net/help-center/article/payment-methods" },
    { title: "Refund Policy", desc: "Refund policy protects buyers while maintaining fairness for creators. Exceptions are made in specific circumstances. Full policy at /lan/net/help-center/article/refund-policy" },
    { title: "Payment Failed", desc: "If payment fails, check your card details, ensure sufficient balance, and retry. Common fixes at /lan/net/help-center/article/payment-failed" },
    { title: "Data Protection", desc: "User data is kept private and never shared with third parties without explicit consent. Full details at /lan/net/help-center/article/data-protection" },
    { title: "Commission Structure", desc: "The platform takes a small commission percentage to maintain operations. The majority of the sale price goes directly to the content creator." },
    { title: "Reviews and Ratings", desc: "Buyers can leave reviews and ratings on purchased documents. Sellers can respond to feedback. This helps others make informed decisions." },
    { title: "Personal Library", desc: "All purchased documents are stored permanently in your personal library. Accessible from any device, any time. Organized with custom folders." },
    { title: "Contact Support", desc: "Get help from the support team via the Help Center at /lan/net/help-center. Support is available for both buyers and sellers." },
    { title: "Seller Verification", desc: "Every seller goes through a verification process to ensure only genuine, valuable content reaches the marketplace. This protects buyers from fraud." },
    { title: "Who Benefits from LAN Library", desc: "Students find study materials and textbooks. Educators share lesson plans and earn income. Professionals access specialized guides. Authors publish and sell their work directly." },
    { title: "The Vision of LAN Library", desc: "To democratize education — make knowledge accessible to everyone regardless of location or economic status, while fairly compensating creators for their work." },
    { title: "Future of LAN Library", desc: "Planned features include live tutoring, AI-powered study assistants, note-taking, highlighting, bookmark syncing, video lectures, audio courses, and institutional partnerships." },
    { title: "Founder", desc: "LAN Library was founded by Brown Oziomachi, a Software Developer. Portfolio: browncode.name.ng" },
];

// Build a compact knowledge string injected into every AI request
const LAN_KNOWLEDGE_STRING = LAN_DOCS
    .map(d => `• ${d.title}: ${d.desc}`)
    .join("\n");

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
        const cleanBookId = String(bookId || "").replace("firestore-", "");
        const normalizedQuestion = (userQuestion || "")
            .toLowerCase().trim().replace(/\s+/g, " ").slice(0, 120);

        // ── 4. RATE LIMIT ──
        const { allowed, minutesLeft } = checkRateLimit(userId);
        if (!allowed) {
            return NextResponse.json({
                error: `You have reached the limit of ${RATE_LIMIT} questions per hour. Try again in ${minutesLeft} minute(s).`,
                rateLimited: true,
            }, { status: 429 });
        }

        // ── 5. NO KEYS CHECK ──
        if (API_KEYS.length === 0) {
            console.error("❌ No Gemini API keys configured");
            return NextResponse.json({ error: "AI service is not configured. Please contact support." }, { status: 503 });
        }

        // ── 6. CACHE CHECK — ai_cache first ──
        // ── 6. CACHE CHECK — ai_cache first ──
        let cacheKey = null;
        if (normalizedQuestion) {
            try {
                // Define keywords that represent platform-wide questions
                const platformKeywords = ["lan library", "founder", "purchase", "download", "seller", "wallet", "withdraw", "account", "payment"];
                const isPlatformQuestion = platformKeywords.some(keyword => normalizedQuestion.includes(keyword));

                if (isPlatformQuestion) {
                    // SHARED CACHE: Question is about the platform, not a specific book
                    cacheKey = `global__${normalizedQuestion}`;
                } else if (cleanBookId) {
                    // BOOK CACHE: Question is specifically about this book's content
                    cacheKey = `${cleanBookId}__${normalizedQuestion}`;
                }

                if (cacheKey) {
                    const cached = await adminDb.collection("ai_cache").doc(cacheKey).get();
                    if (cached.exists) {
                        console.log("⚡ ai_cache hit:", cacheKey);
                        return NextResponse.json({ reply: cached.data().answer, fromCache: true });
                    }
                }
            } catch (e) {
                console.warn("ai_cache read skipped:", e.message);
            }
        }

        // ── 7. FALLBACK CACHE — student_queries ──
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
                    console.log("⚡ student_queries cache hit");
                    // Promote to fast cache
                    if (cacheKey) {
                        adminDb.collection("ai_cache").doc(cacheKey)
                            .set({ answer: cachedAnswer, cachedAt: new Date() })
                            .catch(() => { });
                    }
                    return NextResponse.json({ reply: cachedAnswer, fromCache: true });
                }
            } catch (e) {
                console.warn("student_queries cache read skipped:", e.message);
            }
        }

        // ── 8. BUILD AI PARTS ──
        // The contents array for @google/genai new SDK must be:
        // [{ role: "user", parts: [{ text: "..." }, ...] }]
        const parts = [];

        // ── INJECT LAN DOCS KNOWLEDGE BASE (always included) ──
        parts.push({
            text: `LAN PLATFORM KNOWLEDGE BASE:\n${LAN_KNOWLEDGE_STRING}\n\nUse the above knowledge base to answer any questions about LAN Library, how it works, its features, pricing, security, or the founder. Always answer platform questions from this knowledge base first before using general knowledge.`
        });

        // ── BOOK CONTEXT from Firestore ──
        let sellerContext = "";
        if (bookId && cleanBookId) {
            try {
                const bookDoc = await adminDb.collection("advertMyBook").doc(cleanBookId).get();
                if (bookDoc.exists) {
                    const data = bookDoc.data();
                    sellerContext = [
                        data.description && `DESCRIPTION: ${data.description}`,
                        data.message && `SUMMARY: ${data.message}`,
                        data.author && `AUTHOR: ${data.author}`,
                        data.category && `CATEGORY: ${data.category}`,
                    ].filter(Boolean).join(" | ");
                    console.log("✅ Book context loaded");
                }
            } catch (err) {
                console.warn("Firestore book context skipped:", err.message);
            }
        }

        if (sellerContext) {
            parts.push({ text: `BOOK CONTEXT:\n${sellerContext}` });
        }

        // ── PDF ──
        const needsPdf = isSummary ? !sellerContext : (!sellerContext && !currentlyVisibleText);
        if (pdfUrl && needsPdf) {
            let finalUrl = pdfUrl;
            if (pdfUrl.includes("drive.google.com")) {
                const match = pdfUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
                if (match) finalUrl = `https://drive.google.com/uc?export=download&id=${match[1] || match[2]}`;
            }
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 25000);
                const pdfRes = await fetch(finalUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    signal: controller.signal,
                });
                clearTimeout(tid);
                if (pdfRes.ok) {
                    const buf = await pdfRes.arrayBuffer();
                    parts.push({
                        inlineData: {
                            data: Buffer.from(buf).toString("base64"),
                            mimeType: "application/pdf",
                        },
                    });
                    console.log("✅ PDF loaded");
                }
            } catch (e) {
                console.warn("PDF fetch skipped:", e.message);
            }
        } else if (currentlyVisibleText) {
            parts.push({ text: `PAGE CONTENT:\n${currentlyVisibleText}` });
        }

        // ── SYSTEM PROMPT ──
        const systemPrompt = `You are the LAN Library AI Student Assistant — friendly, warm, and helpful.

RULES:
1. For questions about LAN Library platform (how it works, features, pricing, security, seller info, the founder, etc.) — ALWAYS answer using the LAN PLATFORM KNOWLEDGE BASE provided above. Be specific and accurate.
2. For questions about a specific book — use the BOOK CONTEXT or PDF content provided.
3. Use **bold** for key concepts and important terms.
4. If a question requires reading the full book content you don't have, naturally mention they can purchase "${bookTitle || "the book"}" for full access.
5. Keep responses concise, clear, and student-friendly.
6. If asked about a path or link from the knowledge base, mention it so the user knows where to go.`;

        const instruction = isSummary
            ? `${systemPrompt}\n\nProvide a Smart Summary of "${bookTitle}" in exactly 3 key points. Format each in **bold**.`
            : `${systemPrompt}\n\nStudent Question: "${userQuestion}"`;

        parts.push({ text: instruction });

        // ── 9. AI CALL LOOP (@google/genai SDK) ──
        // Correct contents format for this SDK:
        // contents: [{ role: "user", parts: [ ...parts ] }]
        let aiReply = null;
        let lastError = null;
        let keyIndex = 0;

        for (const modelName of MODEL_CHAIN) {
            const currentKey = API_KEYS[keyIndex % API_KEYS.length];
            keyIndex++;

            if (!currentKey) continue;

            try {
                const client = new GoogleGenAI({ apiKey: currentKey });
                const keyHint = `...${currentKey.slice(-4)}`;
                console.log(`🤖 Trying ${modelName} [${keyHint}]`);

                const response = await client.models.generateContent({
                    model: modelName,
                    contents: [
                        {
                            role: "user",
                            parts: parts,
                        }
                    ],
                    config: {
                        maxOutputTokens: 2048,
                        temperature: 0.5,
                    },
                });

                // @google/genai: response.text is a property (not a function)
                const reply = response.text;

                if (reply) {
                    aiReply = reply;
                    console.log(`✅ ${modelName} responded`);
                    break;
                }
            } catch (err) {
                lastError = err;
                const msg = err.message || "";
                const retryable =
                    msg.includes("429") ||
                    msg.includes("quota") ||
                    msg.includes("RESOURCE_EXHAUSTED") ||
                    msg.includes("404") ||
                    msg.includes("not found") ||
                    msg.includes("deprecated") ||
                    msg.includes("unavailable");

                console.warn(`⚠️ ${modelName}: ${msg.slice(0, 100)}`);
                if (!retryable) break;
            }
        }

        // ── 10. ALL MODELS FAILED ──
        if (!aiReply) {
            const msg = lastError?.message || "";
            const isQuota = msg.includes("429") || msg.includes("quota");
            const isNetwork = msg.includes("fetch failed") || msg.includes("ENOTFOUND");

            console.error("❌ All models failed:", msg.slice(0, 150));
            return NextResponse.json({
                error: isQuota
                    ? "Our AI is experiencing high demand. Please wait a moment and try again."
                    : isNetwork
                        ? "Could not reach the AI service. Please check your internet connection."
                        : "The AI service is temporarily unavailable. Please try again in a few seconds.",
            }, { status: 503 });
        }

        // ── 11. SAVE TO CACHE ──
        if (cacheKey) {
            adminDb.collection("ai_cache").doc(cacheKey)
                .set({ answer: aiReply, bookId: cleanBookId, cachedAt: new Date() })
                .then(() => console.log("💾 Cached:", cacheKey))
                .catch(e => console.warn("Cache write failed:", e.message));
        }

        // ── 12. LOG QUERY ──
        adminDb.collection("student_queries").add({
            bookTitle: bookTitle || "",
            bookId: cleanBookId,
            studentId: userId || "anonymous",
            question: userQuestion || "Summary Request",
            questionNormalized: normalizedQuestion,
            answer: aiReply,
            fromCache: false,
            timestamp: new Date(),
        }).catch(e => console.warn("Query log failed:", e.message));

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ Unhandled server error:", error.message);
        const isNetwork = error.message?.includes("fetch") || error.message?.includes("ENOTFOUND");
        return NextResponse.json({
            error: isNetwork
                ? "Could not reach the AI service. Please check your internet connection."
                : "Something went wrong. Please try again.",
        }, { status: 500 });
    }
}