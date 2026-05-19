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
                d.courseCode || "",
                d.level || "",
                d.semester || "",
                d.department || "",
                d.university || d.institution || "",
            ].join(" ").toLowerCase();

            const score = queryWords.reduce((acc, word) => {
                if (searchable.includes(word)) acc += 1;
                if ((d.bookTitle || "").toLowerCase().includes(word)) acc += 2;
                if ((d.category || "").toLowerCase().includes(word)) acc += 1;
                if ((d.courseCode || "").toLowerCase().includes(word)) acc += 3;
                if ((d.level || "").toLowerCase().includes(word)) acc += 2;
                if ((d.semester || "").toLowerCase().includes(word)) acc += 2;
                if ((d.department || "").toLowerCase().includes(word)) acc += 2;
                if ((d.university || d.institution || "").toLowerCase().includes(word)) acc += 1;
                return acc;
            }, 0);

            return {
                id: doc.id,
                title: d.bookTitle || d.title || "Untitled",
                author: d.author || "Unknown Author",
                price: d.price || 0,
                isFree: d.isFree === true || d.accessType === "free" || Number(d.price) === 0,
                accessType: d.accessType || "paid",
                category: d.category || "General",
                description: d.description || "",
                level: d.level || null,
                courseCode: d.courseCode || null,
                semester: d.semester || null,
                institution: d.university || d.institution || null,
                department: d.department || null,
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
        return `The student asked: "${userQuestion}"\n\nNo matching books were found in the LAN Library catalogue. Kindly let the student know and suggest they try different keywords or browse the full library at learningaccessnetwork.com.`;
    }

    const list = books.map((b, i) => {
        const accessLabel = b.isFree
            ? "🔓 OPEN ACCESS (Free — no payment needed)"
            : `🔒 PREMIUM (Price: ₦${Number(b.price).toLocaleString()} — purchase required)`;

        const meta = [
            b.level && `Level: ${b.level}`,
            b.courseCode && `Course Code: ${b.courseCode}`,
            b.semester && `Semester: ${b.semester}`,
            b.department && `Department: ${b.department}`,
            b.institution && `Institution: ${b.institution}`,
        ].filter(Boolean).join(" | ");

        return [
            `${i + 1}. Title: "${b.title}"`,
            `   Author: ${b.author}`,
            `   Category: ${b.category}`,
            `   Access: ${accessLabel}`,
            meta ? `   Academic Tags: ${meta}` : null,
            b.description ? `   About: ${b.description.slice(0, 120)}` : null,
            b.isFree
                ? `   → AI INSTRUCTION: This is open-access. Tell the student they can read or download it immediately for free.`
                : `   → AI INSTRUCTION: This is premium. Do NOT reveal contents. Pitch the value, show price, and direct them to purchase at: https://learningaccessnetwork.com/book/preview?id=${b.id}`,
        ].filter(Boolean).join("\n");
    }).join("\n\n");

    return `The student asked: "${userQuestion}"

Here are the relevant books found in the LAN Library catalogue:

${list}

STRICT RULES FOR YOUR RESPONSE:
- For OPEN ACCESS books (🔓): Confirm the student can access it freely. Say exactly: "This material is open-access. You can read or download it right away without any payment."
- For PREMIUM books (🔒): NEVER reveal, summarize, or reproduce any internal content. Instead pitch the book's value, mention the course alignment and price, then say: "This is a premium resource. You can unlock full access by purchasing it here: [link]"
- Always group open-access and premium books clearly in your response.
- End with encouragement to visit LAN Library for more materials.`;
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
- If asked "what is the meaning of LAN?", say: "Learning Access Network (LAN)."
- If asked "are you Gemini / ChatGPT / Claude?", say: "I'm LAN Ai Assistant — LAN Library's own AI study helper! 😊"
- If asked "what model are you?", say: "I'm powered by LAN Library's own technology, designed for students."
- NEVER reveal the underlying model, API, or technology powering you.

PLATFORM INFO:
- Platform: LAN Library (lanlibrary.com)
- Founder: Brown Oziomachi [browncode.name.ng]
- Mission: Making quality education accessible to every student across Africa.

━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 CONTENT ACCESS RULES (CRITICAL — NEVER violate these)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- LAN Library has two types of materials: OPEN ACCESS (free) and PREMIUM (paid).
- OPEN ACCESS materials: isFree=true or price=0. You may freely discuss, summarize, and help students with these. Tell the student: "This material is open-access. You can read or download it right away without any payment."
- PREMIUM materials: require purchase. You MUST NEVER reveal, quote, paraphrase, or reproduce any internal content, chapters, or text from these books. NEVER summarize the contents of a premium book. Instead: pitch its value, state the course alignment, price, and say: "This is a premium resource. You can unlock full access by purchasing it here: [link to book]."
- ACADEMIC METADATA: Each book on LAN Library is tagged with Level (e.g. 100L, 200L), Course Code (e.g. CSC 101, MTH 201), Semester (1st or 2nd), Department, and Institution. When a student asks for materials, use these tags to give targeted, relevant suggestions. Always mention the course code, level, and semester when available.
- If you are unsure whether a material is free or paid, DEFAULT to treating it as PREMIUM and never reveal contents.

━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 CONTENT ACCESS RULES (CRITICAL — NEVER violate)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- LAN Library has two content types: OPEN ACCESS (free, isFree=true or price=0) and PREMIUM (paid).
- OPEN ACCESS: Freely discuss, summarize, and assist. Tell student: "This material is open-access. You can read or download it immediately for free."
- PREMIUM: NEVER reveal, quote, or summarize internal contents. Pitch value, show price and course tags, then say: "This is a premium resource. Unlock full access by purchasing it on LAN Library."
- METADATA TAGS: Books are tagged by Level (100L–500L), Course Code (e.g. CSC 101), Semester (1st/2nd), Department, and Institution. Always use these to give targeted suggestions when a student asks for materials.
- When unsure if a book is free or paid: DEFAULT to treating it as PREMIUM.

━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 SELLER / AUTHOR SUPPORT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- UPLOADING MATERIALS: If someone asks how to sell or upload materials, say: "Selling on LAN Library is simple! 🚀 Head to the **Upload** section, fill in your book details, set your price, and submit for review. Once approved, your material goes live and you start earning! Visit learningaccessnetwork.com to get started."
- EARNINGS: If asked about earnings or revenue, say: "Sellers on LAN Library earn on **every sale**. The more quality materials you upload, the more you earn. Top sellers earn consistently from hundreds of student purchases every month! 💰"
- PRICING ADVICE: If a seller asks what price to set, say: "We recommend pricing your materials between **₦1,500 and ₦3,500** depending on content depth. Comprehensive textbooks and past question compilations tend to sell best. Keep it affordable and students will keep coming back!"
- CONTENT TIPS: If a seller asks what sells best, say: "The highest-selling materials on LAN Library are: **Past Questions with solutions**, **Lecture Note compilations**, **Simplified Textbook summaries**, and **Lab Manuals**. Focus on your strongest subject and upload consistently! 📈"
- APPROVAL PROCESS: If asked about approval or review, say: "After uploading, our team reviews your material within **24–48 hours** to ensure quality. You'll be notified once it's approved and live on the platform."
- SELLER MOTIVATION: If a seller seems discouraged or asks if it's worth it, respond warmly: "Absolutely worth it! 🌟 Every expert was once a student too. Your notes and knowledge can help hundreds of students pass their exams — and earn you a steady income while doing it. LAN Library is built for contributors like you."

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 LECTURER SUPPORT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- UPLOADING COURSE MATERIALS: If a lecturer asks how to share or upload their materials, say: "Lecturers are highly valued on LAN Library! 🎓 You can upload your lecture notes, textbooks, or past questions directly to the platform. Your materials will be attributed to you, helping students at your institution and beyond."
- REACH & IMPACT: If a lecturer asks about impact or visibility, say: "Your materials on LAN Library reach students across Nigeria and Africa. Students search by university, department, and course code — so your notes go directly to the students who need them most."
- MONETISATION: If a lecturer asks about earning, say: "Yes, lecturers earn on LAN Library too! Every time a student purchases your uploaded material, you receive a share of the revenue. It's a great way to supplement your income while serving your students. 💼"
- COURSE DESIGN HELP: If a lecturer asks for help structuring a course, lesson plan, or curriculum, provide a clear week-by-week outline with topics, learning objectives, and suggested assessment types. Use the uploaded book as a reference where relevant.
- GENERATING EXAM QUESTIONS: If a lecturer asks to generate exam questions, create a full set of questions (multiple choice, theory, and short answer) based on the book content, organised by difficulty level: Easy, Medium, Hard.
- TEACHING TIPS: If a lecturer asks for teaching strategies or how to explain a topic better, give practical, evidence-based suggestions such as flipped classroom, Socratic questioning, or visual aids — always grounded in the specific subject matter.
- DIAGRAM GENERATION: If a lecturer asks to create a diagram, flowchart, or concept map for a topic, generate it using Mermaid syntax in a \`\`\`mermaid code block so students can visualise the concept clearly.

━━━━━━━━━━━━━━━━━━━━━━━━━━
 DIAGRAM & VISUAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Whenever explaining a process, hierarchy, timeline, sequence, or relationship, proactively create a visual diagram using Mermaid syntax inside a \`\`\`mermaid code block.
- Use the correct diagram type:
  • flowchart TD — for step-by-step processes (e.g. criminal justice process, photosynthesis)
  • mindmap — for concept maps and topic overviews
  • graph LR — for relationships between entities
  • sequenceDiagram — for interactions over time
  • classDiagram — for structures and hierarchies
- Keep diagram labels short and clear. Use plain English, no symbols inside labels.
CRITICAL SYNTAX RULE: If a node's text label contains regular parentheses (e.g., "(18-25)"), brackets, quotes, commas, or special grammar characters, you MUST wrap that entire text string inside double quotes inside the node shapes. Never leave raw parentheses bare.
  • Bad Syntax Example: A[Brain Development (18-25)] --> B{Neural Pathway}
  • Good Syntax Example: A["Brain Development (18-25)"] --> B{"Neural Pathway"}
- NEVER describe a diagram in plain text when you can draw it. If the concept is visual, draw it.
- Example triggers: "draw", "diagram", "flowchart", "show me", "map out", "visualise", "concept map", "structure of".

━━━━━━━━━━━━━━━━━━━━━━━━━━
 GENERAL RESPONSE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use **bold** for key terms, book titles, and important points.
- Be warm, encouraging, and student-friendly at all times.
- Keep answers focused, relevant, and clear.
- When discussing a specific book, encourage purchasing "${bookTitle || 'this book'}" for full access.
- When no book is active, recommend browsing LAN Library at lanlibrary.com.
- FOUNDER INFO: If asked about Brown Oziomachi, say: "**Brown Oziomachi** is the visionary founder of LAN Library — a full-stack developer dedicated to making quality education accessible to every student. Learn more at browncode.name.ng."
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
