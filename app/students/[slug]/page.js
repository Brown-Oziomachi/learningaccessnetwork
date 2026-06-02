"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAds } from "@/lib/useAds";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#faf8f4";
const BORDER = "#e8e0d0";

/* ═══════════════════════════════════════════════════════════════
   PAGE CONTENT MAP — student-focused guides
═══════════════════════════════════════════════════════════════ */
const PAGES = {
    "ai-tutor": {
        badge: "AI Tutor",
        badgeIcon: "✦",
        category: "LEARNING TOOLS",
        readTime: "8 min read",
        title: "AI Tutor: Ask Anything About Your Books",
        subtitle:
            "Powered by LAN AI — your personal academic assistant that reads your textbooks, explains concepts, and helps you prepare for exams.",
        hero: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1400&q=80",
        intro: `The LAN AI Tutor is not a generic chatbot. It is a document-aware assistant that reads the specific books and study materials in your library and answers questions about their exact content — chapter summaries, concept explanations, exam-focused breakdowns, and detailed walkthroughs of difficult passages.

Every student on LAN gets access to AI Tutor sessions. Whether you are wrestling with a thermodynamics derivation at 2am, trying to understand a legal principle before a morning tutorial, or looking for a concise summary of a 400-page text before an exam, LAN AI Tutor is built for that moment.`,
        sections: [
            {
                heading: "How AI Tutor Works with Your Library",
                body: `When you open an AI Tutor session linked to a book in your library, the AI loads the document content and uses it as the primary reference for every answer. Ask it to explain a passage, and it pulls the exact section. Ask for a summary, and it synthesises the author's own words. Ask a question not directly in the text, and it reasons from the material to give you the most accurate answer possible.

This document-aware approach is what separates LAN AI Tutor from generic AI assistants. The AI does not guess or hallucinate generic answers — it reasons from your specific study material. The result is answers that match the terminology, framework, and examples your lecturer and textbook actually use, which is precisely what exam performance depends on.

To start a session, go to your Library tab, select a book, and tap "Ask AI Tutor." Alternatively, open AI Tutor from the navigation and choose a book from your collection. Your session history is saved so you can continue where you left off across devices.`,
            },
            {
                heading: "What to Ask: Getting the Most from Every Session",
                body: `The students who get the most value from AI Tutor treat it like a study partner who has read every page of the book more carefully than anyone else. The most productive questions are specific, not generic.

Effective questions include: "Explain the difference between mitosis and meiosis as described in Chapter 4." "Summarise the key arguments in section 3.2 of this document." "What are the five principles of contract formation covered in this text, and can you give me an example of each?" "Create five exam-style questions based on Chapter 7 and then answer them." "I do not understand the derivation on page 83 — walk me through it step by step."

Less effective are questions like "explain thermodynamics" with no book context — the AI will answer from general knowledge rather than from your specific course material, which may not align with your syllabus. Keeping your questions anchored to the document you have loaded ensures the answers are directly relevant to what you will be assessed on.

You can also use AI Tutor to generate study notes, create revision flashcards from a chapter, translate complex academic language into plain terms, and compare how two sections of the same document relate to each other. Think of it as the most patient, knowledgeable study partner you have ever had — one who never gets tired of your questions.`,
            },
            {
                heading: "Session History and Continuing Your Studies",
                body: `Every AI Tutor conversation is automatically saved to your session history. You can return to any previous session from the AI tab on your dashboard and continue the conversation from exactly where you stopped — the AI retains the context of the earlier exchange and picks up naturally.

Session history is organised by the book each conversation was about, making it easy to find your notes for a specific course or exam. You can also see how many messages each session contains and when it was last active, so you can quickly locate recent study sessions without scrolling through everything.

For students preparing for an exam over several days, this continuity is particularly valuable. You might spend Monday's session working through Chapter 3 questions, return on Wednesday to tackle the concepts that were still unclear, and revisit the session one more time the night before the exam for a final summary pass — all in the same continuous conversation that remembers everything discussed.`,
            },
            {
                heading: "AI Tutor for Exam Preparation",
                body: `Exam preparation is where AI Tutor delivers its most concentrated value. Three specific use cases have emerged as consistently high-impact for students across African universities.

The first is past question practice. If you have past examination papers in your library, you can load them into an AI Tutor session and ask the AI to walk you through each question — explaining the correct approach, identifying the marking criteria implied by the question structure, and explaining why common wrong answers are wrong. This is the closest thing to having a personal tutor review your exam technique.

The second is concept mapping. Before a multi-topic exam, ask AI Tutor to identify the ten most important concepts from each document in your library and explain how they connect to each other. The AI can build you a concept hierarchy that reveals the structural relationships between topics — information that is often more valuable for an exam than knowing any individual fact in isolation.

The third is weak-point targeting. Tell the AI which topics you find most difficult and ask it to generate progressively harder questions on just those areas. Start with definition-level questions, move to application questions, then tackle analysis and evaluation questions. This targeted drill on weak areas is how exam performance improves fastest in the days before an assessment.`,
            },
            {
                heading: "Privacy and Your Study Data",
                body: `Your AI Tutor sessions are private. No other student, lecturer, or platform user can see your conversations. Session data is used only to maintain your conversation history and is not used to train AI models or shared with third parties.

The documents you read and the questions you ask are treated as personal academic data. LAN does not surface your study patterns, question history, or session content to sellers, lecturers, or other students. What you ask the AI is between you and the AI.

Session data is retained for the duration of your LAN account and is deleted when you close your account. If you want to clear individual session histories without closing your account, you can delete specific conversations from the AI tab on your dashboard at any time.`,
            },
        ],
        cta: { label: "Start AI Tutor Session", href: "/ai-chat" },
        related: ["my-library", "past-questions", "study-groups", "how-to-buy", "wishlist"],
        tags: ["AI", "Exam Prep", "Study Tools", "Claude"],
    },

    "my-library": {
        badge: "My Library",
        badgeIcon: "📚",
        category: "YOUR COLLECTION",
        readTime: "7 min read",
        title: "Your Personal Academic Library",
        subtitle:
            "Every document you purchase lives here permanently — accessible on any device, with AI Tutor built in for every book.",
        hero: "/land.png",
        intro: `Your LAN Library is a permanent, personal collection of every academic document you have purchased on the platform. Unlike borrowing a physical book or accessing a shared university resource that disappears after your enrollment ends, every document in your Library is yours indefinitely — accessible the day before your exam and accessible ten years from now if you need it again.

The Library is the centre of your LAN experience. From here you read your documents, launch AI Tutor sessions, track your learning progress, and manage your saved and wishlist items.`,
        sections: [
            {
                heading: "What Lives in Your Library",
                body: `Every document you purchase on LAN is automatically added to your Library the moment payment is confirmed. There is no download step, no manual organisation required, and no limit on how many documents your Library can contain.

Your Library displays all documents with their cover image, title, author or seller name, and — where you have had AI Tutor sessions about that book — a summary of your most recent session. This gives you an instant reading-comprehension snapshot for each document without opening it: how recently you engaged with it and what your last questions were.

Documents are organised by default in the order you purchased them, with the most recent at the top. You can also sort by title, by author, by course category, and by how recently you opened each document. If you have purchased documents across multiple subjects — Engineering, Law, Accounting, Sciences — the category filter makes it straightforward to pull up everything relevant to one course without scrolling through your entire collection.`,
            },
            {
                heading: "Reading Your Documents",
                body: `All documents on LAN are delivered as PDF. The in-app reader renders them cleanly across every device — the same document reads well on your phone on the bus, your tablet in the library, and your laptop at your desk. No additional software, no PDF reader app, no downloads needed.

The reader includes standard navigation controls — page number input, next and previous page, zoom in and out — as well as a table of contents panel for documents that include one. If you want to jump directly to a specific chapter or section, the table of contents gives you one-tap navigation to that page.

Documents are secured with invisible, buyer-specific watermarks that allow LAN to identify the source of any shared copy. This is not a restriction on your reading or use — you can read your documents as often as you like, on as many of your own devices as you like. The watermark is a deterrent against redistribution, protecting both the academic work of the sellers who created the material and the ecosystem that allows sellers to keep producing affordable academic content for students.`,
            },
            {
                heading: "AI Tutor Integration with Your Books",
                body: `Every document in your Library has a direct "Ask AI Tutor" button. Tapping it opens a new AI Tutor session pre-loaded with that document as the reference material. You can ask questions immediately — the AI is ready without any setup.

Your AI Tutor session history is linked to your Library. On the Library card for each book, you can see how many AI sessions you have had about that document, your last session date, and the title of your most recent conversation. This gives you a quick gauge of which materials you have engaged with deeply and which you have not yet started working through with the AI.

For students working through multiple documents for a single course — a lecturer's notes, a past question pack, and a supplementary guide — you can run separate AI Tutor sessions for each document and then ask the AI to synthesise insights across them in a fresh session. This cross-document synthesis is one of the most powerful exam-preparation strategies available on the platform.`,
            },
            {
                heading: "Accessing Your Library Across Devices",
                body: `Your Library is cloud-based. Every document you purchase is accessible immediately on any device where you are signed into your LAN account — no syncing, no waiting, no manual transfers. Open LAN on your phone and your full Library is there. Switch to your laptop and it is identical.

Reading progress is not yet synchronised across devices in this version of the platform — the reader on your phone does not automatically remember the last page you read on your laptop. This is planned for a future update. In the meantime, the table of contents and the AI Tutor session history (which does sync) can help you orient quickly when switching devices.

The mobile experience is optimised for reading and AI interaction. The AI Tutor interface on mobile is designed for short, conversational exchanges that work well with a phone keyboard — asking a quick question between classes and getting a focused, useful answer in under a minute.`,
            },
            {
                heading: "Managing and Organising Your Collection",
                body: `As your Library grows, a few features make it easier to navigate. The search bar in the Library tab searches across all your document titles, author names, and category tags simultaneously — typing a course code or topic name will pull up all relevant documents instantly.

Saved and Wishlist documents are separate from your purchased Library. Items you have saved to your Wishlist are books you are considering but have not yet bought. They are visible from the Saved tab on your dashboard. Once you purchase a Wishlist item, it moves automatically to your Library.

If you purchased a document and believe it does not match what was described in its listing, LAN's buyer protection policy allows you to report the issue within 72 hours of purchase. The support team reviews reported documents and, where the claim is valid, provides a resolution that may include a replacement document or a credit to your wallet for a future purchase.`,
            },
        ],
        cta: { label: "Go to My Library", href: "/dashboard" },
        related: ["ai-tutor", "how-to-buy", "past-questions", "wishlist", "study-groups"],
        tags: ["Library", "PDF", "Documents", "Access"],
    },

    "how-to-buy": {
        badge: "How to Buy",
        badgeIcon: "🛒",
        category: "GETTING STARTED",
        readTime: "6 min read",
        title: "Finding and Buying Documents on LAN",
        subtitle:
            "Search by course code, lecturer, or subject — pay in your local currency — and get instant access to your documents.",
        hero: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1400&q=80",
        intro: `Buying a document on LAN takes under two minutes from search to access. The platform is built to remove every friction between a student who needs a specific study material and the moment they can start reading it. No waiting periods, no shipping addresses, no complicated checkout flows — just find what you need and get it.

This guide covers how search works, how to evaluate a document before buying, how payment works across African currencies, and what happens immediately after you complete a purchase.`,
        sections: [
            {
                heading: "Finding the Right Document",
                body: `The search bar on LAN's documents page is the fastest way to find what you are looking for. Search is tuned for academic specificity — it understands course codes, subject names, institution names, and academic terminology in a way that generic search engines do not.

The most effective searches combine a course code or subject with a document type. For example: "GST 201 past questions UI", "Anatomy 300 level lecture notes", "ACCA F3 study guide 2023", "Criminal Law LLB notes University of Lagos." The more specific you are, the more relevant the results.

If your first search returns too many results, use the filter panel to narrow by institution, subject area, document type, price range, and whether the document includes worked solutions. If it returns too few results, try a broader search — use just the subject name or course code without the institution name, or try alternative spellings of the institution.

You can also browse by lecturer profile. If your course is taught by a lecturer who is registered on LAN, their profile page lists all the documents they have uploaded. Browsing a known lecturer's catalogue is often the fastest way to find course-specific materials that match exactly what is taught in your class.`,
            },
            {
                heading: "Evaluating a Document Before You Buy",
                body: `Every document listing on LAN shows you a preview before you commit to buying. The preview displays enough of the document — typically the first 10 to 15 pages — for you to assess the writing quality, how the content is organised, whether it matches the syllabus section you need, and whether the formatting is clean and readable.

In addition to the preview, every listing shows the seller's rating, the number of reviews from previous buyers, the total number of purchases, and when the document was uploaded. A document with 40 purchases and a 4.8-star rating from buyers who left written reviews is a strong signal of reliable quality. A recently uploaded document with no reviews yet may still be excellent — it simply has not accumulated purchase history yet.

Written reviews from previous buyers are the most valuable signal. Students who bought the same document for the same course often leave comments about how helpful it was for the exam, whether the content matched what was taught, and what they found most useful. Reading two or three reviews takes thirty seconds and can save you from buying something that does not serve your specific need.`,
            },
            {
                heading: "Payment Methods and Currencies",
                body: `LAN accepts payment in local African currencies across all major markets. A student in Nigeria pays in Naira. A student in Ghana pays in Cedis. A student in Kenya pays in Kenyan Shillings. The price displayed on every listing is automatically converted to your local currency at a rate that is updated regularly.

Accepted payment methods include all major Nigerian bank cards (Visa, Mastercard, Verve), mobile money across Ghana, Kenya, Uganda, and Tanzania (MTN MoMo, M-Pesa, AirtelTigo Money), bank transfers for students who prefer not to use cards, and wallet balance for students who have earned referral credits or received promotional wallet top-ups.

Payment is processed securely through LAN's payment infrastructure. Your card or bank details are not stored on LAN's servers — they are handled entirely by the payment processor. The checkout page uses HTTPS encryption and the payment processor is PCI-DSS compliant. If a payment fails, your account is not charged and no partial transactions are held.`,
            },
            {
                heading: "What Happens After You Pay",
                body: `Document access is instant. The moment your payment is confirmed — typically within 3 to 10 seconds of completing checkout — the document appears in your Library. There is no email link to click, no separate download to initiate, and no wait while the seller manually approves your access. The process is fully automated.

You will receive a purchase confirmation notification in the LAN app and an email to your registered address. The confirmation includes the document title, the amount paid, and a link directly to the document in your Library. The email serves as your purchase receipt and is stored in your account history for as long as you have an account.

If payment is confirmed but the document does not appear in your Library within five minutes, contact LAN Support through the Help section of your dashboard. This situation is rare — it typically indicates a technical issue with the payment confirmation webhook — and the support team resolves it immediately by manually crediting the document to your Library.`,
            },
            {
                heading: "Buyer Protection and Disputes",
                body: `LAN's buyer protection policy covers you if a document you purchased does not match its listing description. If the document you received is significantly different from what was advertised — for example, a past question pack that contains questions for a different course than listed, or a "complete semester notes" listing that covers only two weeks of material — you can raise a dispute within 72 hours of purchase.

To raise a dispute, go to your purchase history in your account settings, select the relevant transaction, and tap "Report Issue." Describe specifically how the document differs from the listing. The LAN review team examines the document against the listing and typically resolves disputes within 48 hours.

Valid disputes result in a resolution that may include a credit to your LAN wallet equivalent to the purchase price, or — if a replacement document is available — access to a more accurate alternative. LAN does not offer unconditional refunds: the dispute process is designed to address genuine misrepresentation, not to accommodate buyer's remorse. Buying a document, reading it, and then disputing it simply because you found a free version elsewhere will not result in a resolution in your favour.`,
            },
        ],
        cta: { label: "Browse Documents", href: "/documents" },
        related: ["my-library", "past-questions", "ai-tutor", "wishlist", "study-groups"],
        tags: ["Buying", "Payment", "Search", "Africa"],
    },

    "past-questions": {
        badge: "Past Questions",
        badgeIcon: "📝",
        category: "EXAM PREP",
        readTime: "7 min read",
        title: "Past Questions and Exam Preparation",
        subtitle:
            "The highest-demand document category on LAN — previous exam papers with model answers, across hundreds of courses and institutions.",
        hero: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&q=80",
        intro: `Past examination questions are the single most effective study tool available to any student preparing for an assessment. Research on exam performance is unambiguous: students who practise answering previous exam questions — rather than simply re-reading their notes — consistently outperform those who do not. LAN hosts one of the largest collections of past questions for African universities, polytechnics, and professional examinations available anywhere.

This guide covers how to find past questions for your specific course, how to use them effectively with AI Tutor, and how to build a systematic exam preparation practice from the materials available on the platform.`,
        sections: [
            {
                heading: "Finding Past Questions for Your Course",
                body: `Past question documents on LAN are tagged with the institution, course code, course title, academic year, and examination session. This tagging makes them highly searchable by anyone who knows their course code.

The most reliable search for past questions is a course code followed by "past questions" and your institution's name or abbreviation. For example: "MEE 301 past questions FUTA", "BIO 201 past questions UNN", "ICAN PE2 past questions 2022", "LLB Criminal Law past questions UNILAG." The results will surface all past question documents on the platform that match those criteria, sorted by relevance.

If your course is not represented in the results, try searching just the course code, or the subject name without the institution. Past question documents uploaded by students from your institution may be tagged slightly differently from how you expect, and broadening the search often surfaces documents that a narrow search misses. You can also browse your lecturer's profile page — if your lecturer has uploaded past papers they personally set, they will be listed there.`,
            },
            {
                heading: "How to Use Past Questions Effectively",
                body: `The most common mistake students make with past questions is treating them as a reading exercise: flipping through the questions, reading the model answers, and feeling prepared. This approach is significantly less effective than attempting the questions under exam conditions before looking at any answers.

An evidence-based approach to past question practice looks like this: set a timer for the duration of the actual exam, attempt every question without looking at any reference material, then compare your answers to the model answers and note every question where your answer was wrong, incomplete, or approached differently from the model. The gap between your attempt and the model answer is precisely what you need to study — not the topics you already know.

AI Tutor is particularly powerful for this method. After completing your timed attempt, open an AI Tutor session with the past question document loaded. For each question where you struggled, ask the AI to explain the correct approach in detail, explain why your reasoning was incorrect if applicable, and generate two or three similar questions at the same difficulty level so you can practise the concept before the real exam.`,
            },
            {
                heading: "Past Questions for Professional Examinations",
                body: `LAN has particularly strong coverage of professional examination past questions for certifications that are widely pursued by students across Africa. ACCA (all levels, Papers F1 to P7 and Strategic Professional), ICAN (Foundation, Skills, Professional, and Advanced levels), CIMA, CFA (Levels 1, 2, and 3), WAEC and NECO (all subjects), JAMB, bar examinations, medical licensing, and engineering professional certifications are all represented.

Professional examination past questions are typically more expensive than university course past questions because they are harder to source, require more expertise to annotate with model answers, and carry higher stakes for buyers whose professional career depends on passing. The price premium is reflected in the quality: professional exam past question packs on LAN typically include detailed marking schemes, examiner commentary where available, and worked solutions that explain not just the answer but the approach an examiner is looking for.

For ACCA, ICAN, and CFA preparation specifically, LAN sellers who are qualified practitioners in those fields have uploaded study guides, past question banks, and structured revision programmes that cover multiple examination sittings. These materials are used by students across multiple countries and have a track record of pass rates that sellers cite in their listing descriptions.`,
            },
            {
                heading: "Building a Past Question Study Schedule",
                body: `The most effective use of past questions is not a single marathon session the night before an exam — it is a distributed practice schedule that begins three to four weeks before the assessment date.

A simple framework that works across disciplines: in weeks three and four before the exam, use past questions as diagnostic tools. Attempt papers from three or four years ago to identify which topics you can handle comfortably and which reveal gaps in your understanding. The gaps you find are your study agenda for the following weeks.

In weeks one and two before the exam, use more recent past questions as timed practice assessments. Simulate exam conditions as closely as possible: same duration, no reference materials, handwritten answers if the actual exam will be handwritten. After each practice paper, use AI Tutor to review every question — including the ones you got right, to confirm your reasoning was sound and not accidentally correct.

In the final week, use the AI Tutor summary function to generate a condensed review of the highest-frequency topics across all the past papers you have practised. These are the topics that appear repeatedly — they are the core of what the course is examined on — and your final revision should be weighted heavily toward them.`,
            },
            {
                heading: "Uploading Your Own Past Questions",
                body: `If you have access to past examination papers that are not currently on LAN — papers from your department's physical archive, past questions shared by a lecturer, or exam papers from a year not yet represented on the platform — you can upload them as a seller and earn from them.

Past question uploads require the same review process as all documents on LAN. The review team checks that the content is what the listing claims, that it has not already been uploaded by another seller in an identical form, and that the document quality is readable. Past questions that include model answers or worked solutions are significantly more valuable than question-only documents and should be priced accordingly.

<link slug="how-to-buy" text="Students who are curious about selling" /> their own materials can start from the seller onboarding guide. Many of LAN's most active past question sellers started as students who uploaded the resources they had accumulated during their own studies.`,
            },
        ],
        cta: { label: "Browse Past Questions", href: "/document-type/past-question" },
        related: ["ai-tutor", "my-library", "how-to-buy", "study-groups", "wishlist"],
        tags: ["Exams", "Past Papers", "ACCA", "ICAN", "WAEC"],
    },

    "study-groups": {
        badge: "Study Groups",
        badgeIcon: "👥",
        category: "COMMUNITY",
        readTime: "6 min read",
        title: "Study Groups and Collaborative Learning",
        subtitle:
            "Connect with students at your institution and across Africa — share notes, discuss concepts, and prepare for exams together.",
        hero: "/lanstu.png",
        intro: `Academic performance is not a solo endeavour. Students who engage in structured peer discussion consistently develop deeper understanding than those who study exclusively alone — explaining a concept to someone else is one of the fastest ways to identify gaps in your own knowledge, and hearing someone else's interpretation of a difficult idea often unlocks an understanding that re-reading the textbook alone never does.

LAN Study Groups bring this collaboration online and make it accessible across institutions, cities, and countries. Join an existing group for your course, start your own, and connect with students who are working toward the same examination goals as you.`,
        sections: [
            {
                heading: "Finding a Study Group for Your Course",
                body: `Study groups on LAN are organised by course, subject, and institution. When you visit the Study Groups page — accessible from your dashboard navigation under Collaborate — you can browse groups by subject area, search by course code, or filter by institution.

Groups display their name, the course they focus on, how many members they have, and how recently there was activity. Active groups — those with discussion in the past 24 hours — are marked with a green indicator. If you are looking for a group to join right before an exam period, active groups with recent discussion are the most likely to be engaged and responsive.

If no group exists for your specific course, you can create one in under 30 seconds. Give it a name, add the course code and institution, write a brief description, and invite a few classmates from your contact list or by sharing the group link. Groups on LAN are not restricted to a single institution — if students from multiple universities take the same professional examination or cover the same core syllabus content, a cross-institutional group can be more active and diverse than a single-institution one.`,
            },
            {
                heading: "What Happens Inside a Study Group",
                body: `LAN Study Groups have a discussion channel — a message thread where members ask questions, share notes, discuss confusing concepts, and coordinate exam preparation. The thread is persistent: messages from last week are still there when you return, and you can scroll back through previous discussions to find explanations of topics that came up before you joined.

Members can share links to documents from the LAN catalogue — if someone in your group buys a particularly useful past question pack, they can share the link in the group thread so other members can easily find and purchase the same document. Sharing a document link is not sharing the document itself — each student still needs to purchase access individually.

Group members can also share AI Tutor conversation excerpts. If you had a particularly useful AI session that explained a difficult concept clearly, you can copy the key exchange and paste it into the group thread for others to benefit from. This is an informal but effective way for a group to collectively build a library of AI-generated explanations for the hardest topics in a course.`,
            },
            {
                heading: "Hosting a Group Study Session",
                body: `Beyond the asynchronous discussion thread, group leaders can schedule live study sessions. A live session announcement in the group thread — with a date, time, and topic focus — lets members plan to be online simultaneously for a real-time discussion.

Live group sessions on LAN work best for three specific activities. The first is timed past-question practice: all members attempt the same past paper simultaneously, then reconvene in the discussion thread to compare approaches and debate the best answers. The second is concept clarification: one member explains a concept they feel confident about to the rest of the group, and others ask questions or offer alternative framings. The third is AI Tutor co-sessions: members all bring the same AI Tutor session to the group, each running their own copy, and share notable questions and answers in the group thread in real time.

Group leaders can pin important messages in the discussion thread — pinned messages are shown at the top of the thread for all members. Use pinned messages for the group's exam schedule, links to essential documents, and summaries of key concept discussions that every member should read.`,
            },
            {
                heading: "The Community Beyond Your Study Group",
                body: `The broader LAN community extends well beyond individual study groups. The message notifications feature on your dashboard surfaces direct messages from other students — whether that is a question from someone who read your study notes, a connection from a peer at another institution studying the same course, or a message from a seller who wants to understand what kind of materials would be most useful for your subject area.

LAN's active student leaderboard on your dashboard shows which students in the community are most engaged. This is not a competitive ranking based on grades — it is a participation indicator that surfaces students who are active on the platform and may be open to connection. Students in the top positions on the leaderboard are often the most helpful and knowledgeable members of the community.

The community across LAN spans dozens of African institutions and growing. A student at Ahmadu Bello University preparing for the same ICAN examination as a student at the University of Cape Town shares the same examination content, the same pressure, and the same potential benefit from collaboration. The platform's cross-institutional nature means that the community you can access through LAN is considerably broader than the physical campus around you.`,
            },
            {
                heading: "Etiquette and Getting Value from Groups",
                body: `Study groups work best when members contribute as well as consume. A group where everyone asks questions but no one answers them quickly loses its value for all members. The most effective groups have a culture of reciprocity: members who receive help from the group make a point of helping others in return, even on topics they are still learning themselves.

The act of explaining a concept to a peer — even imperfectly — reinforces your own understanding in a way that passive reading does not. If a group member asks a question you can partially answer, attempt an answer and flag where you are uncertain. Another member may correct or extend your answer, and the resulting exchange often produces a clearer explanation than any one person could have given alone.

Avoid using study groups for requests to share purchased documents without buying — this is a violation of LAN's terms of service and undermines the platform's ability to compensate the sellers who created the materials. Sharing document links so others can purchase the same material is encouraged. Sharing the document file itself is not permitted and may result in account suspension.`,
            },
        ],
        cta: { label: "Join a Study Group", href: "/collaborate" },
        related: ["ai-tutor", "past-questions", "my-library", "how-to-buy", "wishlist"],
        tags: ["Community", "Collaboration", "Peers", "Africa"],
    },

    wishlist: {
        badge: "Wishlist & Saved",
        badgeIcon: "❤",
        category: "YOUR ACCOUNT",
        readTime: "5 min read",
        title: "Wishlist: Save Books for Later",
        subtitle:
            "Bookmark documents you want to buy, track price changes, and build your exam preparation reading list before you are ready to purchase.",
        hero: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80",
        intro: `Not every document you need is one you need right now. Semester reading lists, professional examination reading lists, and supplementary material catalogues are all things students discover well before they are ready to purchase every item. The LAN Wishlist is designed for exactly this — saving documents you have found and evaluated, organising your future reading list, and buying items when you are ready.`,
        sections: [
            {
                heading: "How to Save a Document to Your Wishlist",
                body: `Any document on LAN can be saved to your Wishlist by tapping the heart icon on the document's listing card. The heart icon appears on the listing card in search results, on the full listing page, and in the preview reader. A single tap saves the document; tapping again removes it from your Wishlist.

Saved documents appear in the Saved tab on your dashboard. Each Wishlist item shows the document cover, title, seller, and price. From your Wishlist you can preview the document again, go directly to the checkout to purchase it, or remove it from your list if you decide you no longer need it.

There is no limit on how many items your Wishlist can contain. Students building a comprehensive reading list for a full academic year often add 15 to 30 items at the start of the year and purchase them progressively through the semester as the relevant courses begin and the budget allows.`,
            },
            {
                heading: "Using Your Wishlist as a Reading Plan",
                body: `For students following a structured study plan — particularly those preparing for multi-part professional examinations like ACCA, ICAN, or CFA — the Wishlist doubles as a reading roadmap. Add every document relevant to your upcoming examination level at the start of the preparation period, then purchase and work through them systematically as you move through each topic.

This approach has two advantages over buying everything at once. First, it allows you to spend your budget progressively rather than all at once, which may be more practical depending on your financial situation. Second, it surfaces the full scope of what you plan to study in one place, so you can see at a glance how far through your preparation reading you have progressed.

You can also share Wishlist items with study group members by copying the document link from the listing page. If your group collectively identifies the four most important past question packs for your upcoming exam, sharing those links in the group thread lets everyone easily find and evaluate the same materials.`,
            },
            {
                heading: "Price Changes and Purchase Timing",
                body: `Sellers on LAN control their own pricing and can change prices at any time. The price shown on a Wishlist item reflects the current live price, which may be higher or lower than the price when you first saved it. If a seller reduces their price — common during examination periods when sellers temporarily discount popular documents to drive purchase volume — you benefit from the lower price at the time you buy.

LAN does not currently send automatic price drop notifications for Wishlist items, but this feature is in development. In the meantime, checking your Wishlist in the weeks before an important exam is a practical habit — sellers often reduce prices in response to the spike in student demand during examination periods, and a document that seemed expensive two months ago may be significantly cheaper when you are ready to buy.

There is no price lock on Wishlist items. If a document increases in price between when you saved it and when you buy it, you pay the higher current price. For documents you know you will need for an upcoming exam, buying sooner rather than later is generally the lower-risk approach.`,
            },
            {
                heading: "Wishlist vs. Saved Sessions",
                body: `Your Wishlist stores documents you intend to buy. Your AI Tutor session history stores conversations about documents you have already bought and read. These are separate — your Wishlist is a pre-purchase planning tool, while your AI session history is a post-purchase learning record.

There is one useful pattern that bridges the two: if you add a document to your Wishlist after reading the preview and finding it promising, and the listing page for that document shows that other buyers have asked the seller questions — some sellers have a Q&A section on their profile — the answers to those questions can give you additional information about the document's suitability for your specific course before you decide to buy.

Once you purchase a Wishlist item, it moves from your Saved tab to your Library. The transition is immediate and automatic. You do not need to manually remove it from your Wishlist — the purchase action clears it from the list and adds it to your collection simultaneously.`,
            },
        ],
        cta: { label: "View My Wishlist", href: "/dashboard" },
        related: ["my-library", "how-to-buy", "past-questions", "ai-tutor", "study-groups"],
        tags: ["Wishlist", "Saved", "Planning", "Buying"],
    },
};

/* ─── Related meta ─────────────────────────────────────────── */
const RELATED_META = {
    "ai-tutor": { label: "AI Tutor", icon: "✦", desc: "Document-aware AI study assistant" },
    "my-library": { label: "My Library", icon: "📚", desc: "Your permanent document collection" },
    "how-to-buy": { label: "How to Buy", icon: "🛒", desc: "Find, evaluate, and pay for documents" },
    "past-questions": { label: "Past Questions", icon: "📝", desc: "Exam papers across hundreds of courses" },
    "study-groups": { label: "Study Groups", icon: "👥", desc: "Collaborate with peers across Africa" },
    wishlist: { label: "Wishlist", icon: "❤", desc: "Save and plan your purchases" },
};

/* ─── Parse inline link syntax ─────────────────────────────── */
function parseBody(text) {
    const parts = [];
    const regex = /<link slug="([^"]+)" text="([^"]+)" \/>/g;
    let last = 0, match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push({ type: "text", content: text.slice(last, match.index) });
        parts.push({ type: "link", slug: match[1], text: match[2] });
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ type: "text", content: text.slice(last) });
    return parts;
}

function RichParagraph({ text }) {
    const parts = parseBody(text);
    return (
        <>
            {parts.map((p, i) =>
                p.type === "link" ? (
                    <Link
                        key={i}
                        href={`/students/${p.slug}`}
                        style={{ color: GOLD, textDecoration: "underline", textDecorationColor: "rgba(184,150,62,0.4)", textUnderlineOffset: "3px", fontWeight: 600, transition: "color .15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = GOLDD}
                        onMouseLeave={e => e.currentTarget.style.color = GOLD}
                    >{p.text}</Link>
                ) : <span key={i}>{p.content}</span>
            )}
        </>
    );
}

function BodyBlock({ body }) {
    const paragraphs = body.split("\n\n");
    return (
        <>
            {paragraphs.map((para, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.85, color: "#3a3530", margin: i < paragraphs.length - 1 ? "0 0 20px" : 0, fontFamily: "'Lato', sans-serif", fontWeight: 400 }}>
                    <RichParagraph text={para} />
                </p>
            ))}
        </>
    );
}

/* ─── Nav ───────────────────────────────────────────────────── */
function Nav() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);
    return (
        <nav style={{ position: "sticky", top: 0, zIndex: 100, background: NAVY, borderBottom: "1px solid rgba(184,150,62,.18)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,48px)", height: 64, boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.3)" : "none", transition: "box-shadow .2s" }}>
            <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 19, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-.3px" }}>
                LAN <span style={{ color: GOLD }}>Library</span>
            </Link>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Link href="/documents" style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 700, textDecoration: "none", letterSpacing: ".09em", textTransform: "uppercase", fontFamily: "'Lato', sans-serif" }}>
                    Browse
                </Link>
                <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,.08)", border: "0.5px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)", padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".06em", textTransform: "uppercase", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.14)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(255,255,255,.7)"; }}>
                    ← Back
                </button>
                <Link href="/dashboard" style={{ background: GOLD, color: NAVY, padding: "9px 20px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato', sans-serif", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                    onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                    Dashboard
                </Link>
            </div>
        </nav>
    );
}

/* ─── TOC item ──────────────────────────────────────────────── */
function TocItem({ label, index, active, onClick }) {
    return (
        <button onClick={() => onClick(index)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f0ebe0" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: active ? GOLD : "#d8cfbf", transition: "background .15s" }} />
            <span style={{ fontSize: 12, fontFamily: "'Lato', sans-serif", color: active ? NAVY : "#888", fontWeight: active ? 700 : 400, transition: "color .15s", lineHeight: 1.4 }}>{label}</span>
        </button>
    );
}

/* ─── 404 ───────────────────────────────────────────────────── */
function NotFound() {
    return (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 72, fontWeight: 900, color: GOLD, lineHeight: 1 }}>404</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 18, color: NAVY, fontWeight: 700 }}>Guide not found</div>
            <Link href="/dashboard" style={{ color: GOLD, fontFamily: "'Lato', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>← Back to Dashboard</Link>
        </div>
    );
}

/* ─── Guides Footer ─────────────────────────────────────────── */
function GuidesFooter({ currentSlug }) {
    const all = Object.entries(RELATED_META);
    return (
        <div style={{ background: NAVY, borderTop: `1px solid rgba(184,150,62,.15)`, padding: "56px clamp(20px,4vw,48px) 48px", marginTop: 64 }}>
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(184,150,62,.6)", marginBottom: 8, fontFamily: "'Lato', sans-serif" }}>Student Guides</p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1 }}>Everything You Need to Know</h2>
                    </div>
                    <Link href="/documents" style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: "'Lato', sans-serif", textDecoration: "none", letterSpacing: ".08em", textTransform: "uppercase" }}>Browse All Documents →</Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.06)" }} className="guides-footer-grid">
                    {all.map(([slug, meta]) => {
                        const isCurrent = slug === currentSlug;
                        return (
                            <Link key={slug} href={`/students/${slug}`} style={{ textDecoration: "none" }}>
                                <div style={{ padding: "24px 22px", background: isCurrent ? "rgba(184,150,62,.12)" : "rgba(255,255,255,.03)", borderRight: "1px solid rgba(255,255,255,.06)", borderBottom: "1px solid rgba(255,255,255,.06)", transition: "background .18s", height: "100%", boxSizing: "border-box", position: "relative" }}
                                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(184,150,62,.08)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? "rgba(184,150,62,.12)" : "rgba(255,255,255,.03)"; }}>
                                    {isCurrent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: GOLD }} />}
                                    <span style={{ fontSize: 28, display: "block", marginBottom: 12, lineHeight: 1 }}>{meta.icon}</span>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: isCurrent ? GOLD : "rgba(184,150,62,.5)", margin: "0 0 6px", fontFamily: "'Lato', sans-serif" }}>GUIDE</p>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: isCurrent ? "#fff" : "rgba(255,255,255,.75)", margin: "0 0 6px", lineHeight: 1.25 }}>{meta.label}</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.35)", margin: "0 0 14px", fontFamily: "'Lato', sans-serif", lineHeight: 1.5 }}>{meta.desc}</p>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? GOLD : "rgba(184,150,62,.55)", fontFamily: "'Lato', sans-serif", letterSpacing: ".04em" }}>
                                        {isCurrent ? "Currently reading" : "Read guide →"}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(184,150,62,.1)" }}>
                    <span style={{ fontSize: 11, color: "rgba(245,240,232,.25)", fontFamily: "'Lato', sans-serif" }}>© 2026 LAN Library — Learning Access Network · Africa</span>
                    <div style={{ display: "flex", gap: 20 }}>
                        <Link href="/documents" style={{ fontSize: 11, color: "rgba(245,240,232,.4)", fontFamily: "'Lato', sans-serif", textDecoration: "none", fontWeight: 600 }}>Browse Documents</Link>
                        <Link href="/dashboard" style={{ fontSize: 11, color: GOLD, fontFamily: "'Lato', sans-serif", textDecoration: "none", fontWeight: 700 }}>Go to Dashboard →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function StudentSlugPage() {
    const params = useParams();
    const slug = params?.slug;
    const page = PAGES[slug];

    const [activeSection, setActiveSection] = useState(null);
    const [progress, setProgress] = useState(0);

    /* Reading progress bar */
    useEffect(() => {
        const h = () => {
            const el = document.documentElement;
            setProgress((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
        };
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    if (!page) return (
        <>
            <style>{GLOBAL_STYLE}</style>
            <div style={{ background: BG, minHeight: "100vh" }}><Nav /><NotFound /></div>
        </>
    );

    return (
        <>
            <style>{GLOBAL_STYLE}</style>

            {/* Reading progress bar */}
            <div style={{ position: "fixed", top: 64, left: 0, zIndex: 99, height: 2, background: GOLD, width: `${progress}%`, transition: "width .1s linear" }} />

            <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Lato', sans-serif", color: NAVY }}>
                <Nav />

                {/* ── ARTICLE HEADER ── */}
                <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
                    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "36px clamp(20px,4vw,48px) 40px" }}>

                        {/* Breadcrumb */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                            <Link href="/" style={{ fontSize: 12, color: "#999", textDecoration: "none", fontFamily: "'Lato', sans-serif" }}
                                onMouseEnter={e => e.currentTarget.style.color = GOLD}
                                onMouseLeave={e => e.currentTarget.style.color = "#999"}>LAN Library</Link>
                            <span style={{ color: "#ccc", fontSize: 12 }}>›</span>
                            <Link href="/dashboard" style={{ fontSize: 12, color: "#999", textDecoration: "none", fontFamily: "'Lato', sans-serif" }}
                                onMouseEnter={e => e.currentTarget.style.color = GOLD}
                                onMouseLeave={e => e.currentTarget.style.color = "#999"}>Student Guides</Link>
                            <span style={{ color: "#ccc", fontSize: 12 }}>›</span>
                            <span style={{ fontSize: 12, color: GOLD, fontFamily: "'Lato', sans-serif", fontWeight: 600 }}>{page.badge}</span>
                        </div>

                        {/* Category + read time */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD, fontFamily: "'Lato', sans-serif" }}>{page.category}</span>
                            <span style={{ color: "#ddd", fontSize: 10 }}>•</span>
                            <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                                <span>🕐</span> {page.readTime}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: NAVY, lineHeight: 1.1, letterSpacing: "-.3px", margin: "0 0 16px", maxWidth: 760 }}>
                            {page.title}
                        </h1>

                        {/* Subtitle */}
                        <p style={{ fontSize: "clamp(15px,1.6vw,18px)", color: "#666", fontWeight: 300, margin: "0 0 28px", maxWidth: 640, lineHeight: 1.65, fontFamily: "'Lato', sans-serif" }}>
                            {page.subtitle}
                        </p>

                        {/* Author meta */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 20, borderTop: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>L</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Lato', sans-serif" }}>LAN Student Team</div>
                                <div style={{ fontSize: 11, color: "#aaa", fontFamily: "'Lato', sans-serif" }}>Academic Document Platform · Africa</div>
                            </div>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {page.tags.slice(0, 3).map(tag => (
                                    <span key={tag} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", background: BG, border: `1px solid ${BORDER}`, padding: "3px 10px", fontFamily: "'Lato', sans-serif" }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BODY GRID ── */}
                <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(24px,3vw,48px) clamp(20px,4vw,48px)", display: "grid", gridTemplateColumns: "1fr 300px", gap: 56, alignItems: "start" }} className="lan-body-grid">

                    {/* ── ARTICLE ── */}
                    <article>
                        {/* Intro lede */}
                        <div style={{ marginBottom: 40 }}>
                            {page.intro.split("\n\n").map((para, i) => (
                                <p key={i} style={{ fontSize: 18, lineHeight: 1.8, color: "#2c2822", fontWeight: i === 0 ? 400 : 300, margin: i < page.intro.split("\n\n").length - 1 ? "0 0 18px" : 0, fontFamily: "'Lato', sans-serif", borderLeft: i === 0 ? `3px solid ${GOLD}` : "none", paddingLeft: i === 0 ? 18 : 0 }}>{para}</p>
                            ))}
                        </div>

                        {/* Hero image */}
                        <div style={{ marginBottom: 40, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                            <img src={page.hero} alt={page.title} style={{ width: "100%", height: "clamp(200px,28vw,360px)", objectFit: "cover", display: "block" }} />
                            <div style={{ background: "#f7f4ef", padding: "8px 14px", borderTop: `1px solid ${BORDER}` }}>
                                <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'Lato', sans-serif", fontStyle: "italic" }}>{page.badge} — LAN Library Student Guides · Africa</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
                            <div style={{ flex: 1, height: 1, background: BORDER }} />
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#bbb", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap" }}>In This Guide</span>
                            <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>

                        {/* Sections */}
                        {page.sections.map((sec, i) => (
                            <section key={i} id={`section-${i}`} style={{ marginBottom: 52 }}>
                                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 700, color: NAVY, lineHeight: 1.2, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: GOLD, color: NAVY, fontSize: 11, fontWeight: 900, fontFamily: "'Lato', sans-serif", flexShrink: 0 }}>
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    {sec.heading}
                                </h2>
                                <BodyBlock body={sec.body} />
                            </section>
                        ))}

                        {/* CTA block */}
                        <div style={{ background: NAVY, backgroundImage: "radial-gradient(rgba(184,150,62,.05) 1.5px, transparent 1.5px)", backgroundSize: "24px 24px", padding: "40px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                            <div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>Ready to dive in?</div>
                                <div style={{ fontSize: 13, color: "rgba(245,240,232,.45)", fontFamily: "'Lato', sans-serif", maxWidth: 340, lineHeight: 1.6 }}>
                                    Thousands of African students use LAN every day to study smarter, find better materials, and prepare for exams with confidence.
                                </div>
                            </div>
                            <Link href={page.cta.href} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 32px", background: GOLD, color: NAVY, fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Lato', sans-serif", whiteSpace: "nowrap", transition: "background .15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = GOLDD}
                                onMouseLeave={e => e.currentTarget.style.background = GOLD}>
                                {page.cta.label} →
                            </Link>
                        </div>
                    </article>

                    {/* ── SIDEBAR ── */}
                    <aside style={{ position: "sticky", top: 80 }}>
                        {/* Table of Contents */}
                        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, padding: "22px 20px", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, marginBottom: 16, fontFamily: "'Lato', sans-serif" }}>In This Article</div>
                            {page.sections.map((sec, i) => (
                                <TocItem key={i} label={sec.heading} index={i} active={activeSection === i}
                                    onClick={idx => {
                                        setActiveSection(idx);
                                        document.getElementById(`section-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }} />
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: CREAM, border: `1px solid ${BORDER}`, padding: "18px 20px", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD, marginBottom: 14, fontFamily: "'Lato', sans-serif" }}>Quick Actions</div>
                            {[
                                { label: "Browse Documents", href: "/documents", icon: "📄" },
                                { label: "AI Tutor Session", href: "/ai-chat", icon: "✦" },
                                { label: "Past Questions", href: "/document-type/past-question", icon: "📝" },
                                { label: "Study Groups", href: "/collaborate", icon: "👥" },
                            ].map(({ label, href, icon }) => (
                                <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid rgba(13,34,68,.06)", textDecoration: "none", fontSize: 12, color: NAVY, fontFamily: "'Lato', sans-serif", fontWeight: 600, transition: "color .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.color = GOLD}
                                    onMouseLeave={e => e.currentTarget.style.color = NAVY}>
                                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                                    <span style={{ flex: 1 }}>{label}</span>
                                    <span style={{ fontSize: 12, color: "#ccc" }}>›</span>
                                </Link>
                            ))}
                        </div>

                        {/* All guides */}
                        <div style={{ background: NAVY, padding: "20px" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(184,150,62,.5)", marginBottom: 14, fontFamily: "'Lato', sans-serif" }}>All Student Guides</div>
                            {Object.entries(RELATED_META).map(([s, meta]) => (
                                <Link key={s} href={`/students/${s}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.05)", textDecoration: "none", fontSize: 11, color: s === slug ? GOLD : "rgba(245,240,232,.4)", fontFamily: "'Lato', sans-serif", fontWeight: s === slug ? 700 : 400, transition: "color .15s" }}
                                    onMouseEnter={e => e.currentTarget.style.color = GOLD}
                                    onMouseLeave={e => e.currentTarget.style.color = s === slug ? GOLD : "rgba(245,240,232,.4)"}>
                                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                                    <span style={{ flex: 1 }}>{meta.label}</span>
                                    {s === slug && <span style={{ fontSize: 8, background: GOLD, color: NAVY, padding: "2px 7px", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>NOW</span>}
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>

                {/* ── FOOTER ── */}
                <GuidesFooter currentSlug={slug} />
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;600;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; overflow-x: hidden; }

  @media (max-width: 860px) {
    .lan-body-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 600px) {
    .lan-body-grid { padding-left: 20px !important; padding-right: 20px !important; }
    .guides-footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 400px) {
    .guides-footer-grid { grid-template-columns: 1fr !important; }
  }
  ::selection { background: rgba(184,150,62,.25); color: #0d2244; }
`;