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

        // ── 1. Resolve Google Drive download URL ──
        let finalDownloadUrl = pdfUrl;
        if (pdfUrl && pdfUrl.includes("drive.google.com")) {
            const fileId = pdfUrl.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
            if (!fileId) throw new Error("Invalid Google Drive URL.");
            finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId[1] || fileId[2]}`;
        }

        // ── 2. Fetch PDF ──
        const pdfRes = await fetch(finalDownloadUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!pdfRes.ok) {
            throw new Error("Could not fetch PDF file.");
        }

        const arrayBuffer = await pdfRes.arrayBuffer();

        // ⚠️ Size guard (important)
        if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Book file too large (max 15MB)." },
                { status: 413 }
            );
        }

        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        // ── 3. Build context-aware prompt ──
        let contextBlock = "";

        if (activeSection) {
            contextBlock += `\nCurrent section: "${activeSection}".`;
        }

        if (currentlyVisibleText) {
            contextBlock += `\nVisible text:\n"""\n${currentlyVisibleText.slice(0, 1500)}\n"""`;
        }

        const isSummary = type === "summary";

        const promptText = isSummary
            ? `
Role: Expert LAN Library Tutor.
Book: "${bookTitle}".

Task: Provide a Smart Summary in exactly 3 points.

Format:
**Point 1:**
Explanation

**Point 2:**
Explanation

**Point 3:**
Explanation

Then add a practical example block.

End with 2-3 key terms like:
[[Term: Definition]]
`
            : `
Role: Expert LAN Library Tutor.
Book: "${bookTitle}".
${contextBlock}

Task: Answer ONLY from the PDF.

Student Question:
${userQuestion}

Rules:
- Use Markdown
- Use **bold** for key terms
- Add [p. X] if referencing a page
`;

        // ── 4. Gemini AI (NEW SDK — WORKING) ──
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: "application/pdf",
                            },
                        },
                        {
                            text: promptText,
                        },
                    ],
                },
            ],
        });

        const aiReply = result.text;

        // ── 5. Save to Firestore ──
        await adminDb.collection("student_queries").add({
            bookTitle,
            bookId: bookId || "unknown",
            studentId: userId || "anonymous",
            question: userQuestion || (isSummary ? "Smart Summary" : ""),
            answer: aiReply,
            type: type || "question",
            activeSection: activeSection || null,
            timestamp: new Date(),
        });

        return NextResponse.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ LAN AI Error:", error.message);

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}