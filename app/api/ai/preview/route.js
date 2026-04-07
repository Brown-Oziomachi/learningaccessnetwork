import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

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

        // ── 1. SMART DATA STRATEGY ──
        // If we have screen text and it's NOT a full book summary, skip the PDF download!
        const canSkipDownload = currentlyVisibleText && currentlyVisibleText.length > 50 && !isSummary;

        if (canSkipDownload) {
            console.log("⚡ Optimization: Using visible text only (skipping PDF download)");
            aiParts.push({
                text: `CONTEXT FROM BOOK PAGE:\n"""\n${currentlyVisibleText}\n"""`
            });
        } else {
            // ── 2. Fallback: Download PDF only if necessary (Summary or no screen text) ──
            let finalDownloadUrl = pdfUrl;
            if (pdfUrl && pdfUrl.includes("drive.google.com")) {
                const fileId = pdfUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
                if (!fileId) throw new Error("Invalid Google Drive URL.");
                finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId[1] || fileId[2]}`;
            }

            const pdfRes = await fetch(finalDownloadUrl, {
                headers: { "User-Agent": "Mozilla/5.0" },
            });

            if (!pdfRes.ok) throw new Error("MiFi connection too slow to fetch full book.");

            const contentType = pdfRes.headers.get("content-type");
            if (!contentType || !contentType.includes("application/pdf")) {
                throw new Error("File source returned a webpage. Try a different book.");
            }

            const arrayBuffer = await pdfRes.arrayBuffer();
            if (arrayBuffer.byteLength > 12 * 1024 * 1024) {
                return NextResponse.json({ error: "Book too large for full scan (Max 12MB)." }, { status: 413 });
            }

            const base64Data = Buffer.from(arrayBuffer).toString("base64");
            aiParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf",
                },
            });
        }

        // ── 3. Build Prompt ──
        const promptText = isSummary
            ? `Role: Expert LAN Library Tutor. Book: "${bookTitle}". Task: Provide a Smart Summary in exactly 3 points. Format: **Point 1: [Concept]** Explanation... Add a quote block and [[Term: Definition]].`
            : `Role: Expert LAN Library Tutor. Book: "${bookTitle}". Section: "${activeSection || 'General'}". 
               Task: Answer the student's question using the provided context. 
               Student Question: ${userQuestion}`;

        aiParts.push({ text: promptText });

        // ── 4. Execute Gemini ──
        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: aiParts }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
        });

        const aiReply = result.text;

        // ── 5. Log to Firestore ──
        await adminDb.collection("student_queries").add({
            bookTitle,
            bookId: bookId || "unknown",
            studentId: userId || "anonymous",
            question: userQuestion || (isSummary ? "Summary" : "Query"),
            answer: aiReply,
            timestamp: new Date(),
        });

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ LAN AI Error:", error.message);
        const isQuota = error.message.includes("429") || error.message.includes("quota");
        return NextResponse.json(
            { error: isQuota ? "AI is cooling down (15s). Try again." : error.message },
            { status: isQuota ? 429 : 500 }
        );
    }
}