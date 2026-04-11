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

        // 1. FETCH SELLER'S DESCRIPTION (Uses the Optimized adminDb)
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

            // Extended timeout for MiFi connections (2 minutes)
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
        const instruction = isSummary
            ? `Provide a "Smart Summary" of "${bookTitle}" in 3 key points based on the context. Use the seller's summary as the foundation. Format points in **bold**.`
            : `Answer the student question: "${userQuestion}" using the provided context. Be helpful and encouraging.`;

        aiParts.push({ text: instruction });

        // 4. CALL GEMINI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: aiParts }],
            generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
        });

        const aiReply = result.response.text();

        // 5. LOG TO FIRESTORE (Non-blocking)
        adminDb.collection("student_queries").add({
            bookTitle,
            bookId,
            studentId: userId || "anonymous",
            answer: aiReply,
            timestamp: new Date(),
        }).catch(e => console.error("Log Error:", e));

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ LAN AI API Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}