import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── 1. API KEYS ──
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
].filter(Boolean);

// ── TIERED MODEL CHAINS ──
const MODEL_CHAIN_FREE = [
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
];
const MODEL_CHAIN_PRO = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash-lite-preview-06-17",
    "gemini-1.5-flash",
];

// ── 2. FREEMIUM TIER CONFIG ──
const TIERS = {
    free: {
        dailyLimit: 5,
        window: 24 * 60 * 60 * 1000,
        models: MODEL_CHAIN_FREE,
        canSummarize: false,
    },
    pro: {
        dailyLimit: Infinity,
        window: 24 * 60 * 60 * 1000,
        models: MODEL_CHAIN_PRO,
        canSummarize: true,
    },
};

// ── 3. FIRESTORE-BACKED RATE LIMITER ──
async function checkRateLimit(userId, tier) {
    if (!userId || userId === "anonymous") return { allowed: true, queriesLeft: 3 };

    const config = TIERS[tier] || TIERS.free;
    if (config.dailyLimit === Infinity) return { allowed: true, queriesLeft: Infinity };

    const now = Date.now();
    const ref = adminDb.collection("ai_rate_limits").doc(userId);

    try {
        const snap = await ref.get();
        const data = snap.exists ? snap.data() : null;

        if (!data || now > data.resetAt) {
            await ref.set({ count: 1, resetAt: now + config.window });
            return { allowed: true, queriesLeft: config.dailyLimit - 1 };
        }
        if (data.count >= config.dailyLimit) {
            const hoursLeft = Math.ceil((data.resetAt - now) / 3600000);
            return { allowed: false, hoursLeft, upgradePrompt: true };
        }
        await ref.update({ count: FieldValue.increment(1) });
        return { allowed: true, queriesLeft: config.dailyLimit - data.count - 1 };
    } catch (err) {
        console.warn("Rate limit check failed, allowing through:", err.message);
        return { allowed: true, queriesLeft: 1 };
    }
}

// ── 4. FETCH USER PLAN FROM FIRESTORE ──
async function getUserPlan(userId) {
    if (!userId || userId === "anonymous") return { tier: "free", credits: 0 };
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return { tier: "free", credits: 0 };
        const data = userDoc.data();
        const isPremium = data.isPremium === true;
        const aiCredits = typeof data.aiCredits === "number" ? data.aiCredits : 0;
        return {
            tier: isPremium ? "pro" : "free",
            credits: aiCredits,
            isPremium,
        };
    } catch (err) {
        console.warn("getUserPlan failed:", err.message);
        return { tier: "free", credits: 0 };
    }
}

// ── 5. DEDUCT ONE AI CREDIT ──
async function deductCredit(userId) {
    try {
        await adminDb.collection("users").doc(userId).update({
            aiCredits: FieldValue.increment(-1),
        });
        console.log(`💳 1 AI credit deducted from ${userId}`);
    } catch (err) {
        console.warn("Credit deduction failed:", err.message);
    }
}

// ── 6. LAN DOCS KNOWLEDGE BASE ──
const LAN_DOCS = [
    { title: "What is LAN Library?", desc: "LAN Library is a digital knowledge marketplace where users purchase permanent access to books, notes, research papers, and study guides. It combines a digital library with a marketplace." },
    { title: "The L.A.N Network", desc: "The Learning Access Network (L.A.N) is a transformative platform for leadership development and personal growth. It connects individuals with resources, mentors, and a supportive community to empower people to reach their full potential." },
    { title: "Creating Your Account", desc: "Sign up with Google Sign In or email and password. No subscription required to browse. Full guide at learningaccessnetwork.com/docs" },
    { title: "How to Purchase a Book", desc: "Search for a book, preview it, then click Purchase. Payment is processed securely and the book is instantly added to your personal library permanently. Guide at learningaccessnetwork.com/docs" },
    { title: "Downloading Your PDFs", desc: "After purchasing, go to My Books. Books are stored permanently and accessible from any device anytime. Guide at learningaccessnetwork.com/docs" },
    { title: "Becoming a Seller", desc: "Complete your seller profile and pass quick verification. Then upload documents to start selling and earning money. Sellers set their own prices." },
    { title: "Uploading Documents", desc: "As a seller, go to the Upload/Advertise page. Add a detailed description, set your price, and submit for quality review before it goes live." },
    { title: "Pricing Your Content", desc: "Creators set their own prices and have full control over the value of their work. The platform takes a small commission to maintain operations — more money goes directly to creators." },
    { title: "Earnings and Withdrawals", desc: "Earnings accumulate in your secure LAN wallet instantly when someone purchases your document. Request withdrawals at any time through your seller dashboard." },
    { title: "Analytics Dashboard", desc: "Track your sales, monitor content performance, and view detailed analytics for all your uploaded documents from your seller account." },
    { title: "Quality Standards", desc: "Every document is verified for originality, relevance, and appropriateness before going live. Sellers with high-quality content earn badges and featured placement." },
    { title: "Security and Trust", desc: "Every transaction is encrypted using industry-standard protocols. Digital watermarking prevents unauthorized sharing. Every seller is verified before selling." },
    { title: "Wallet System", desc: "A managed wallet system where every transaction is tracked, verified, and protected. Buyers pay securely, sellers earn instantly, withdrawals are available anytime." },
    { title: "Content Protection", desc: "Digital watermarking and tracking systems prevent unauthorized sharing and copyright violations. Continuous monitoring protects both buyers and sellers." },
    { title: "Payment Methods", desc: "Secure payment processing protected by international security standards. Multiple payment options available. Guide at learningaccessnetwork.com/docs" },
    { title: "Refund Policy", desc: "Refund policy protects buyers while maintaining fairness for creators. Exceptions are made in specific circumstances. Full policy at learningaccessnetwork.com/docs" },
    { title: "Payment Failed", desc: "If payment fails, check your card details, ensure sufficient balance, and retry. Common fixes at learningaccessnetwork.com/docs" },
    { title: "Data Protection", desc: "User data is kept private and never shared with third parties without explicit consent. Full details at learningaccessnetwork.com/docs" },
    { title: "Commission Structure", desc: "The platform takes a small commission percentage to maintain operations. The majority of the sale price goes directly to the content creator." },
    { title: "Reviews and Ratings", desc: "Buyers can leave reviews and ratings on purchased documents. Sellers can respond to feedback. This helps others make informed decisions." },
    { title: "Personal Library", desc: "All purchased documents are stored permanently in your personal library. Accessible from any device, any time. Organized with custom folders." },
    { title: "Contact Support", desc: "Get help from the support team via the Help Center at /lan/net/help-center. Support is available for both buyers and sellers." },
    { title: "Seller Verification", desc: "Every seller goes through a verification process to ensure only genuine, valuable content reaches the marketplace. This protects buyers from fraud." },
    { title: "Who Benefits from LAN Library", desc: "Students find study materials and textbooks. Educators share lesson plans and earn income. Professionals access specialized guides. Authors publish and sell their work directly." },
    { title: "The Vision of LAN Library", desc: "To democratize education — make knowledge accessible to everyone regardless of location or economic status, while fairly compensating creators for their work." },
    { title: "Future of LAN Library", desc: "Planned features include live tutoring, AI-powered study assistants, note-taking, highlighting, bookmark syncing, video lectures, audio courses, and institutional partnerships." },
    { title: "Founder", desc: "LAN Library was founded by Brown Oziomachi, a Software Developer. Portfolio: browncode.name.ng" },
    { title: "LAN AI Pro Plan", desc: "Upgrade to LAN AI Pro for unlimited questions, advanced AI models (Gemini 2.5), full PDF analysis, and comprehensive Smart Summaries. Contact support or pay via the in-chat upgrade option to get started." },
    { title: "AI Credits", desc: "Don't want a full subscription? Buy AI credits as a pay-as-you-go option. Use credits for extra questions beyond your free daily limit of 5. Contact support or use the in-chat credits option to purchase." },
];

const LAN_KNOWLEDGE_STRING = LAN_DOCS
    .map(d => `• ${d.title}: ${d.desc}`)
    .join("\n");

// ── 7. SEARCH BOOKS FROM FIRESTORE ──
async function searchBooks(queryText) {
    try {
        const keywords = queryText.toLowerCase().split(" ").filter(w => w.length > 3);
        if (keywords.length === 0) return "";

        const snapshot = await adminDb.collection("advertMyBook")
            .where("status", "==", "approved")
            .limit(20)
            .get();

        const books = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const textToMatch = `${data.title} ${data.category} ${data.description}`.toLowerCase();
            if (keywords.some(k => textToMatch.includes(k))) {
                books.push({
                    title: data.title,
                    price: data.price,
                    author: data.author,
                    id: doc.id,
                    isFeatured: data.isFeatured === true,
                    desc: data.description?.slice(0, 100) + "...",
                });
            }
        });

        if (books.length === 0) return "";
        books.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

        return books.slice(0, 8).map(b =>
            `• ${b.isFeatured ? "⭐ [FEATURED] " : ""}${b.title} by ${b.author} | Price: ₦${b.price} | Link: https://learningaccessnetwork.com/book/${b.id}`
        ).join("\n");
    } catch (err) {
        console.error("Book search failed:", err);
        return "";
    }
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
        const cleanBookId = String(bookId || "").replace("firestore-", "");
        const normalizedQuestion = (userQuestion || "")
            .toLowerCase().trim().replace(/\s+/g, " ").slice(0, 120);

        // ── FETCH USER PLAN ──
        const userPlan = await getUserPlan(userId);
        const { tier, credits, isPremium } = userPlan;
        const tierConfig = TIERS[tier] || TIERS.free;

        // ── SUMMARY TIER FLAG ──
        // No hard gate — free users get a teaser, Pro users get the full summary.
        const isFullSummary = isSummary && isPremium;

        // ── RATE LIMIT ──
        const { allowed, hoursLeft } = await checkRateLimit(userId, tier);

        if (!allowed) {
            if (credits > 0) {
                console.log(`💳 ${userId} over daily limit — using credit (${credits} left)`);
                await deductCredit(userId);
                // Falls through to AI call
            } else {
                return NextResponse.json({
                    error: `You've used all ${tierConfig.dailyLimit} free questions for today. Reset in ${hoursLeft} hour(s).`,
                    rateLimited: true,
                    upgradePrompt: true,
                    upgradeType: "rateLimit",
                    hoursLeft,
                }, { status: 429 });
            }
        }

        // ── NO KEYS CHECK ──
        if (API_KEYS.length === 0) {
            console.error("❌ No Gemini API keys configured");
            return NextResponse.json({ error: "AI service is not configured. Please contact support." }, { status: 503 });
        }

        // ── CACHE CHECK — ai_cache ──
        let cacheKey = null;
        if (normalizedQuestion) {
            try {
                const platformKeywords = ["lan library", "founder", "purchase", "download", "seller", "wallet", "withdraw", "account", "payment"];
                const isPlatformQuestion = platformKeywords.some(keyword => normalizedQuestion.includes(keyword));

                if (isPlatformQuestion) {
                    cacheKey = `global__${normalizedQuestion}`;
                } else if (cleanBookId) {
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

        // ── FALLBACK CACHE — student_queries ──
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

        // ── BUILD AI PARTS ──
        const parts = [];

        // ── DYNAMIC BOOK SEARCH ──
        const recommendationKeywords = ["suggest", "recommend", "find", "books for", "looking for", "study", "buy", "purchase"];
        const isAskingForRecs = recommendationKeywords.some(k => normalizedQuestion.includes(k));
        let searchResultsContext = "";
        if (isAskingForRecs) {
            console.log("🔍 Searching books for recommendations...");
            searchResultsContext = await searchBooks(normalizedQuestion);
        }

        if (searchResultsContext) {
            parts.push({
                text: `AVAILABLE BOOKS ON LAN LIBRARY FOUND FOR THIS STUDENT:\n${searchResultsContext}\n\nIf the user is asking for a book to study or buy, recommend the titles listed above specifically. Mention ⭐ Featured books first and with enthusiasm.`
            });
        }

        // ── INJECT LAN KNOWLEDGE BASE ──
        parts.push({
            text: `LAN PLATFORM KNOWLEDGE BASE:\n${LAN_KNOWLEDGE_STRING}\n\nUse the above knowledge base to answer any questions about LAN Library, how it works, its features, pricing, security, or the founder. Always answer platform questions from this knowledge base first before using general knowledge.`
        });

        // ── BOOK CONTEXT from Firestore ──
        let sellerContext = "";
        let bookPrice = null;
        if (bookId && cleanBookId) {
            try {
                const bookDoc = await adminDb.collection("advertMyBook").doc(cleanBookId).get();
                if (bookDoc.exists) {
                    const data = bookDoc.data();
                    bookPrice = data.price || null;
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
        // For full Pro summaries, load PDF even if sellerContext exists.
        // For free teaser summaries and regular questions, only load if no other context.
        const needsPdf = isFullSummary ? true : (!sellerContext && !currentlyVisibleText);
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
        const priceString = bookPrice ? `₦${bookPrice}` : "a great price";
        const systemPrompt = `You are the LAN Library AI Study Partner — friendly, warm, enthusiastic, and genuinely helpful.

USER TIER: ${tier.toUpperCase()}${isPremium ? " ✨" : ""}

RULES:
1. For questions about LAN Library platform (how it works, features, pricing, security, seller info, the founder, etc.) — ALWAYS answer using the LAN PLATFORM KNOWLEDGE BASE provided above. Be specific and accurate.
2. For questions about a specific book — use the BOOK CONTEXT or PDF content provided. Answer the first part of every deep question helpfully, then naturally invite them to unlock more.
3. Use **bold** for key concepts and important terms.
4. SALES FUNNEL — apply naturally, never pushy:
   • If the student is asking deep questions about a book they may not own yet: answer helpfully, then add: "📖 This book goes much deeper into this topic. You can unlock the full guide for only ${priceString} at learningaccessnetwork.com"
   • If the student seems to be studying intensely (3+ content questions in a row): mention "💡 Pro Tip: LAN AI Pro gives you unlimited questions + Smart Summaries to ace your exams faster. You can upgrade right from the chat."
   • If a free user asks for a summary: explain it's a Pro feature and invite them to upgrade from within the chat.
5. Keep responses concise, clear, and student-friendly.
6. If asked about a path or link from the knowledge base, mention it so the user knows where to go.
7. When recommending books from the AVAILABLE BOOKS list, mention the title, author, and link naturally in your response.`;

        // ── BUILD INSTRUCTION ──
        // isFullSummary  → Pro user tapped Summarize: give comprehensive Smart Summary
        // isSummary      → Free user tapped Summarize: give short teaser + upgrade nudge
        // else           → Regular question
        const instruction = isFullSummary
            ? `${systemPrompt}\n\nProvide a comprehensive Smart Summary of "${bookTitle}" with:\n- 5 key concepts in **bold**\n- 3 likely exam questions\n- 1 key takeaway paragraph.\nBe thorough — this is a Pro feature.`
            : isSummary
                ? `${systemPrompt}\n\nThe student tapped "Summarize this book". Give them a short teaser: a 2-3 sentence overview of "${bookTitle}" and 2 bold key concepts. Then end with: "✨ Upgrade to **LAN AI Pro** to unlock the full Smart Summary — with exam questions, deep concept breakdowns, and unlimited questions. You can upgrade right from this chat."`
                : `${systemPrompt}\n\nStudent Question: "${userQuestion}"`;

        parts.push({ text: instruction });

        // ── AI CALL LOOP ──
        const modelChain = tierConfig.models;
        let aiReply = null;
        let lastError = null;
        let keyIndex = 0;

        for (const modelName of modelChain) {
            const currentKey = API_KEYS[keyIndex % API_KEYS.length];
            keyIndex++;
            if (!currentKey) continue;

            try {
                const client = new GoogleGenAI({ apiKey: currentKey });
                const keyHint = `...${currentKey.slice(-4)}`;
                console.log(`🤖 [${tier.toUpperCase()}] Trying ${modelName} [${keyHint}]`);

                const response = await client.models.generateContent({
                    model: modelName,
                    contents: [{ role: "user", parts }],
                    config: {
                        maxOutputTokens: isPremium ? 4096 : 1024,
                        temperature: 0.5,
                    },
                });

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

        // ── ALL MODELS FAILED ──
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

        // ── SAVE TO CACHE ──
        if (cacheKey) {
            adminDb.collection("ai_cache").doc(cacheKey)
                .set({ answer: aiReply, bookId: cleanBookId, cachedAt: new Date() })
                .then(() => console.log("💾 Cached:", cacheKey))
                .catch(e => console.warn("Cache write failed:", e.message));
        }

        // ── LOG QUERY ──
        adminDb.collection("student_queries").add({
            bookTitle: bookTitle || "",
            bookId: cleanBookId,
            studentId: userId || "anonymous",
            question: userQuestion || "Summary Request",
            questionNormalized: normalizedQuestion,
            answer: aiReply,
            fromCache: false,
            tier,
            timestamp: new Date(),
        }).catch(e => console.warn("Query log failed:", e.message));

        return NextResponse.json({
            reply: aiReply,
            tier,
            isPremium,
        });

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