import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase-admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const {
            pdfUrl,
            userQuestion,
            bookTitle,
            bookId,
            userId,
            activeSection,
            currentlyVisibleText,
            type,
        } = await req.json();

        const isSummary = type === "summary";
        let aiParts = [];
        let sellerContext = "";

        // 1. FETCH SELLER'S DESCRIPTION
        if (bookId) {
            try {
                const cleanBookId = bookId.replace("firestore-", "");
                const bookDoc = await adminDb.collection("advertMyBook").doc(cleanBookId).get();

                if (bookDoc.exists) {
                    const data = bookDoc.data();
                    sellerContext = `
                        SELLER'S DESCRIPTION: ${data.description || "N/A"}
                        SELLER'S MESSAGE/SUMMARY: ${data.message || "N/A"}
                        AUTHOR: ${data.author || "Unknown"}
                        CATEGORY: ${data.category || "General"}
                    `.trim();
                    console.log("✅ Prioritizing Seller Context");
                }
            } catch (err) {
                console.warn("⚠️ Firestore Fetch Warning:", err.message);
            }
        }

        if (sellerContext) {
            aiParts.push({ text: `PRIMARY CONTEXT:\n${sellerContext}` });
        }

        // 2. DATA STRATEGY: LONG TIMEOUT FOR PDF DOWNLOADS
        const hasEnoughContext = sellerContext.length > 100 || (currentlyVisibleText && currentlyVisibleText.length > 200);
        const shouldDownloadPdf = isSummary ? !sellerContext : !hasEnoughContext;

        if (shouldDownloadPdf && pdfUrl) {
            console.log("⬇️ Downloading PDF with extended timeout...");

            let finalDownloadUrl = pdfUrl;
            if (pdfUrl.includes("drive.google.com")) {
                const fileId = pdfUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
                if (fileId) {
                    finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId[1] || fileId[2]}`;
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            try {
                const pdfRes = await fetch(finalDownloadUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    signal: controller.signal
                });

                if (pdfRes.ok) {
                    const arrayBuffer = await pdfRes.arrayBuffer();
                    const base64Data = Buffer.from(arrayBuffer).toString("base64");
                    aiParts.push({
                        inlineData: { data: base64Data, mimeType: "application/pdf" },
                    });
                }
            } catch (fetchErr) {
                console.error("PDF Download failed (Timeout):", fetchErr.message);
            } finally {
                clearTimeout(timeoutId);
            }
        } else if (currentlyVisibleText) {
            aiParts.push({ text: `PAGE CONTENT:\n${currentlyVisibleText}` });
        }

        // 3. BUILD THE INSTRUCTION
        const purchaseNudgeInstruction = `
            ROLE: LAN Library Student Assistant.
            RULES:
            - If you need the full book to answer, provide a partial answer + "Purchase the book for full access."
            - Otherwise, answer directly. Be warm, encouraging, and use **bold** text.
            - If a student asks who founded or created LAN Library, respond with:
              "LAN Library was founded by **Brown Oziomachi**, a Software Developer & Full-Stack Developer. You can check out his portfolio at [browncode.name.ng](https://browncode.name.ng) 🚀"
        `.trim();

        const instruction = isSummary
            ? `${purchaseNudgeInstruction}\n\nProvide a "Smart Summary" of "${bookTitle}" in 3 key bold points based on the context. Use the seller's summary as the foundation.`
            : `${purchaseNudgeInstruction}\n\nStudent Question: "${userQuestion}"`;

        aiParts.push({ text: instruction });

        // 4. MULTI-MODEL FALLBACK (Fixes 404/Quota issues)
        const MODEL_CHAIN = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
        let aiReply = null;
        let lastError = null;

        for (const modelName of MODEL_CHAIN) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: aiParts }],
                    generationConfig: { maxOutputTokens: 2048, temperature: 0.5 },
                });
                aiReply = result.response.text();
                if (aiReply) break;
            } catch (err) {
                lastError = err;
                const msg = err.message?.toLowerCase() || "";
                if (msg.includes("404") || msg.includes("429") || msg.includes("quota") || msg.includes("not found")) {
                    continue;
                }
                break;
            }
        }

        // 5. HANDLING FAILURES WITH FRIENDLY MESSAGES
        if (!aiReply) {
            const errMsg = lastError?.message || "";
            const isQuota = errMsg.includes("429") || errMsg.includes("quota");
            const isNetwork = errMsg.includes("fetch failed") || errMsg.includes("network");

            let friendlyMessage;
            if (isNetwork) {
                friendlyMessage = "📡 **Connection Issue:** I couldn't reach the library servers. Please check your internet and try again!";
            } else if (isQuota) {
                friendlyMessage = "🚀 **High Demand:** Lots of students are studying right now! Please wait a moment and try your question again.";
            } else {
                friendlyMessage = "🛠️ **Maintenance:** I'm having a little trouble reading this right now. Please try again in a few seconds!";
            }

            return NextResponse.json({
                error: friendlyMessage,
                tip: "Keep going! While I'm rebooting, why not try reviewing your last few notes?"
            }, { status: 503 });
        }

        // 6. LOGGING & SUCCESS
        adminDb.collection("student_queries").add({
            bookTitle, bookId, studentId: userId || "anonymous",
            question: userQuestion || "Summary", answer: aiReply, timestamp: new Date(),
        }).catch(e => console.error("Log Error:", e));

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        // FINAL GLOBAL CATCH
        const msg = error.message || "";
        const isNetwork = msg.includes("fetch failed") || msg.includes("network");
        const isQuota = msg.includes("429") || msg.includes("quota");

        let friendlyMessage;
        if (isNetwork) {
            friendlyMessage = "Could not reach the AI service. Please check your internet connection and try again.";
        } else if (isQuota) {
            friendlyMessage = "Our AI is currently experiencing high demand. Please wait a moment and try again.";
        } else {
            friendlyMessage = "Something went wrong. Please try again.";
        }

        console.error("❌ LAN AI API Error:", msg);
        return NextResponse.json({ error: friendlyMessage }, { status: 500 });
    }
}