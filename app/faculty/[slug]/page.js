"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/* ─── colour tokens ─────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#faf8f4";
const BORDER = "#e8e0d0";

/* ═══════════════════════════════════════════════════════════════
   PAGE CONTENT MAP  — All faculty-focused, Africa-wide
═══════════════════════════════════════════════════════════════ */
const PAGES = {
  network: {
    badge: "Faculty Network",
    badgeIcon: "🏛️",
    category: "FACULTY GUIDE",
    readTime: "10 min read",
    title: "The LAN Faculty Network",
    subtitle:
      "Africa's dedicated platform for academic professionals to publish, distribute, and monetise their intellectual work.",
    hero: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80",
    intro: `The LAN Faculty Network is Africa's first and most comprehensive platform built exclusively for academic professionals — lecturers, professors, researchers, and educators across every country on the continent. Unlike generic content marketplaces or student-facing document libraries, LAN was architected from the ground up around the unique publishing workflow, credentialing requirements, and financial needs of African academia.

Whether you are a professor at a research university in Nairobi, a visiting lecturer at a polytechnic in Accra, a PhD candidate with teaching responsibilities in Lagos, or an adjunct faculty member at a private institution in Johannesburg — LAN gives you a structured, trusted, and rewarding environment to share what you know and earn from it indefinitely.`,
    sections: [
      {
        heading: "What Is the Faculty Network and Why Does It Exist?",
        body: `Academic professionals across Africa face a common frustration: they produce an enormous volume of high-quality intellectual content — meticulously prepared lecture notes, carefully curated past questions, original textbooks, research summaries, tutorial guides — yet most of this work disappears into institutional hard drives or gets photocopied and distributed without any financial return to the creator.

The LAN Faculty Network exists to change that. It is a verified community of over 3,200 academic professionals across Nigeria, Ghana, Kenya, South Africa, Uganda, Tanzania, Rwanda, Ethiopia, Egypt, Senegal, and a growing number of other African nations. Every member is credentialed, every document is protected, and every sale generates real income — credited directly to the faculty member who created the work.

The platform operates on a principle that is simple but radical in the African academic context: the knowledge you produce as a faculty member has lasting commercial value beyond the lecture hall. A past examination paper you set three years ago is still relevant to students preparing for that course today. Lecture notes you refined over a decade of teaching are more valuable than any generic textbook. LAN monetises that institutional expertise on your behalf, automatically, without requiring any ongoing effort after the initial upload.`,
      },
      {
        heading: "Who Can Join the Faculty Network?",
        body: `The Faculty Network is open to any academic professional at an accredited university, polytechnic, college of education, or recognised higher institution across Africa. This includes full professors and associate professors at any rank, senior and junior lecturers, assistant lecturers, graduate teaching assistants with documented teaching responsibilities, postdoctoral researchers with demonstrable course involvement, adjunct and part-time faculty staff, visiting academics and external examiners, and retired faculty who wish to continue generating income from their archived work.

There is no restriction based on country of residence or nationality. A Kenyan professor teaching at a South African university is eligible. A Ghanaian lecturer who has since moved to diaspora but produced materials while teaching on the continent is eligible. What matters is that the academic work you are publishing was produced in the context of your professional academic role.

<link slug="verify" text="Verification is required" /> for all Faculty Network members. The process is free, takes 24–48 hours, and permanently associates your institutional credentials with your seller profile. Once verified, your profile displays the Verified Faculty badge that students across Africa rely on as a quality signal.`,
      },
      {
        heading: "What Kinds of Academic Content Can You Publish?",
        body: `Faculty members can publish any academic content they personally created or substantially developed in their professional capacity. The platform is built to handle the full spectrum of academic publishing formats.

Course materials are the most common category: lecture notes, course outlines, weekly reading summaries, and slide decks. Past examination questions are among the highest-demand items on the platform — students preparing for upcoming examinations actively seek past papers from the actual lecturers who set them, and verified faculty past questions command premium prices. Textbooks, course readers, and custom-authored references are also extremely popular, particularly in fields where standard textbooks are prohibitively expensive or poorly adapted to African academic contexts.

Beyond traditional course materials, faculty members publish tutorial and assignment sheets, research methodology guides, professional certification study packs, language and writing handbooks adapted for African student contexts, and even audio and video learning supplements. If you produced it as an academic professional, it is publishable on LAN.

All published content is processed through LAN's document protection system, which embeds invisible watermarks and buyer-specific identifiers in every downloaded file. Your intellectual work remains legally yours. <link slug="upload" text="The upload process" /> is straightforward and takes under five minutes per document.`,
      },
      {
        heading: "How Does Earning Work Across Africa?",
        body: `Faculty members earn 80% of every transaction. The remaining 20% covers platform operations, payment processing, and student discovery infrastructure. There are no listing fees, no monthly subscriptions, and no minimum sales thresholds to maintain your account.

Sales are credited to your <link slug="dashboard" text="LAN wallet" /> immediately after each purchase. Wallet balances are stored in the local currency equivalent of the Nigerian Naira base currency. Faculty members can <link slug="withdraw" text="withdraw earnings" /> to bank accounts, mobile money accounts, or fintech wallets across their country. Supported withdrawal methods include Nigerian banks and fintechs, M-Pesa and other Kenyan mobile money providers, Ghana's MTN MoMo and bank networks, South African bank accounts, and major mobile money providers across East and West Africa.

Our top Faculty earners maintain catalogues of 50 to 200 documents and generate the equivalent of USD 800 to USD 3,000 per month in passive document sales alone — without any ongoing effort after the initial upload. Additionally, the <link slug="referral" text="referral programme" /> adds a powerful secondary income stream that compounds as you grow your academic network.`,
      },
      {
        heading: "How the Faculty Network Differs From Generic Platforms",
        body: `LAN is not a general document marketplace. It is not a freelance platform. It is not a student note-sharing app. Every architectural decision was made specifically for the workflow of African academic professionals.

Search on LAN is structured around academic hierarchies: institution, faculty, department, course code, academic level, and session year. A student searching for ECON 201 past papers at the University of Ghana does not wade through results from irrelevant institutions — they find verified content from credentialed faculty at exactly the institution they attend.

Pricing is calibrated to the African academic economy. Document price ranges, student purchasing patterns, and seasonal demand peaks (pre-examination periods, semester starts) are all factored into recommendations provided to faculty sellers through their <link slug="dashboard" text="analytics dashboard" />. The platform understands the academic calendar across different African educational systems and surfaces your content at peak relevance moments automatically.

Faculty verification is not just a trust badge — it is an algorithmic advantage. Verified faculty documents receive prioritised placement in search results for their specific courses and institutions. Students are explicitly shown which documents were created by the actual faculty member who teaches the course. This is the most powerful conversion signal in academic document purchasing, and it is available exclusively through the LAN Faculty Network.`,
      },
      {
        heading: "Building a Long-Term Passive Income Stream",
        body: `The most successful Faculty Network members approach LAN as a long-term passive income infrastructure rather than a short-term side income. The difference in mindset produces dramatically different results.

A faculty member who uploads ten documents per semester and does nothing else will generate modest but consistent income. A faculty member who treats each upload as an asset — optimising its title, description, course code tags, and institutional metadata — will see compound growth as each document accumulates views, purchases, and search ranking over time.

Content that does well in one academic session tends to do even better the following year, because the document has already accumulated reviews, buyer history, and search authority. A past examination paper uploaded today will still be generating income three years from now when new cohorts of students prepare for the same course.

The <link slug="referral" text="referral programme" /> creates a further compounding effect. Faculty members who introduce colleagues to the platform earn referral commissions that stack on top of their document income. A senior professor who refers even five junior colleagues can generate significant monthly referral income with no additional effort beyond a single conversation or email.`,
      },
    ],
    cta: { label: "Join Faculty Network", href: "/auth/signup" },
    related: ["verify", "dashboard", "upload", "withdraw", "referral", "recharge"],
    tags: ["Africa", "Publishing", "Passive Income", "Academic"],
  },

  verify: {
    badge: "Faculty Verification",
    badgeIcon: "✅",
    category: "HOW IT WORKS",
    readTime: "9 min read",
    title: "Faculty Verification",
    subtitle:
      "Your Verified Faculty badge is the single most powerful credibility signal available to academic sellers on the platform.",
    hero: "/lanlect.png",
    intro: `When a student in Accra is choosing between two sets of lecture notes for the same course — one from a verified uploader, one from a Verified Faculty member who actually teaches that course — the outcome is not a close decision. Verified faculty documents sell at three to four times the rate of a verified uploader across every institution and subject category on LAN.

Faculty Verification is the credential that separates academic publishing from generic content selling. It signals to students across Africa that they are purchasing material from someone with institutional expertise, real teaching experience, and a professional reputation behind the content. That trust premium translates directly into higher conversion rates, the ability to charge premium prices, and dramatically more consistent sales month after month.`,
    sections: [
      {
        heading: "What Does Faculty Verification Actually Do?",
        body: `Faculty Verification is LAN's process of confirming that you are a legitimate, credentialed academic professional at an accredited institution. The process is run by LAN's dedicated academic verification team, who review your submitted documents against institutional records and cross-reference your credentials through established academic databases.

Once verified, your profile permanently displays the Verified Faculty badge — a blue credentialing mark visible on your public profile, all your document listings, and your seller page. The badge is not a decorative icon; it is an active signal that the platform's search and recommendation algorithm uses to rank and surface your content above unverified alternatives.

Verified faculty members also unlock capabilities unavailable to standard sellers: access to high-value Faculty Bounties posted by students and institutions, priority placement in course-specific search results, eligibility for the LAN Featured Faculty programme, detailed analytics through your <link slug="dashboard" text="Faculty Dashboard" />, and priority processing for new <link slug="upload" text="document uploads" />.`,
      },
      {
        heading: "Who Is Eligible for Faculty Verification?",
        body: `Faculty Verification is available to academic professionals at any accredited university, polytechnic, college of education, or recognised higher institution across Africa. There is no restriction on seniority — from assistant lecturers in their first year of teaching to emeritus professors with decades of experience, all are eligible.

Eligible categories include full-time and part-time academic staff with a formal appointment letter, PhD students with documented teaching responsibilities such as tutorial facilitation or course co-teaching, postdoctoral researchers supervising or co-teaching formal coursework, retired faculty seeking to continue earning from archived course materials, and visiting academics teaching at African institutions on formal visiting appointments.

The key eligibility criterion is a verifiable, documented relationship with an accredited academic institution in your professional capacity as an educator or researcher. LAN's verification team makes final eligibility determinations and will communicate with applicants who fall outside standard categories to find a workable path to verification.`,
      },
      {
        heading: "What Documents Do You Need to Apply?",
        body: `The verification application requires a small set of documentation designed to be minimally burdensome while providing sufficient evidence of your academic credentials.

You will need a valid institutional email address — typically in the format yourname@institution.edu.gh or yourname@university.ac.ke, depending on your country. You will also need a clear photograph of your staff identification card or your academic appointment letter. The document should clearly show your name, your position title, your department, and your institution. Photographs taken with a smartphone are perfectly acceptable — the image does not need to be professionally scanned.

Additionally, you provide your department, faculty, and the course codes you teach or have taught. This metadata is used to configure your search profile and ensure your documents appear in the right course-specific search results from day one of your verification.

No external endorsement is required. No third-party academic reference letters. No institutional approval. Verification is assessed entirely by LAN's academic team based on the documentation you provide. After submission, you will receive an acknowledgement email within a few hours confirming your application is under review.`,
      },
      {
        heading: "How Long Does Verification Take?",
        body: `Standard Faculty Verification takes 24 to 48 business hours from the time your application is submitted with all required documentation present. For applicants at major institutions where LAN already has an established institutional data relationship — including several of the largest universities in Nigeria, Ghana, Kenya, and South Africa — verification may be completed within a few hours.

If your application is incomplete — for example, if an ID photograph is unclear or a course code list is missing — LAN's team will contact you at your registered email address with specific guidance on what to resubmit. No application is outright rejected without first giving you the opportunity to provide additional documentation.

Silver, Gold, and Platinum Faculty sellers receive priority verification processing, typically completing within 6 to 12 hours. If you are an established academic professional with a significant body of work to publish, priority verification can make a meaningful difference to how quickly you begin generating income on the platform.`,
      },
      {
        heading: "What Changes After You Are Verified?",
        body: `The moment your Faculty Verification is approved, several changes take effect simultaneously. Your profile displays the Verified Faculty badge permanently — visible to every student who finds your documents in search, clicks your seller name, or views your profile page. All of your existing and future document listings display the badge at listing level, not just at profile level.

Your documents are immediately boosted in search results for the courses and departments associated with your verified credentials. If you teach Biochemistry 201 at the University of Nairobi, your materials for that course will rank above unverified alternatives in student searches — even if the unverified alternative was uploaded before yours.

You gain access to Faculty Bounties, which are student and institutional requests for specific academic materials with attached reward payments. Bounty values range from the equivalent of USD 5 to USD 500, and verified faculty members have an exclusive fulfilment window before bounties are opened to the broader platform.

Your <link slug="dashboard" text="Faculty Dashboard" /> surfaces expanded analytics specific to verified sellers: course-level performance data, institutional buyer distribution maps, peer benchmarking metrics, and personalised document pricing recommendations based on market demand in your discipline. You also receive a named listing in the LAN Faculty Directory — a publicly searchable database of verified African academic professionals — which can serve as a professional profile independent of your document sales.`,
      },
      {
        heading: "Does Verification Expire or Need Renewal?",
        body: `Your Verified Faculty badge does not expire as long as your LAN account remains active and in good standing. There are no annual renewal fees and no reapplication requirements triggered by the passage of time alone.

LAN conducts periodic verification audits of the Faculty Directory, typically on a 24-month cycle. These audits are a simple, one-step process: you confirm that your institutional affiliation remains current. For faculty members who have changed institutions, the audit is an opportunity to update your credentials and ensure your search profile reflects your current appointment. The process takes under five minutes and does not disrupt your document sales or wallet balance in any way.

Faculty members who retire or leave academic positions can retain their verified status for materials created during their academic career. Retired faculty are a valued part of the LAN Faculty Network — their archived course materials remain relevant to students for years after retirement, and LAN has specific credential pathways for emeritus and retired academics.`,
      },
    ],
    cta: { label: "Apply for Verification", href: "/auth/signup" },
    related: ["network", "dashboard", "upload", "withdraw", "referral", "recharge"],
    tags: ["Trust", "Badge", "Credibility", "Africa"],
  },

  upload: {
    badge: "Upload Materials",
    badgeIcon: "📤",
    category: "GETTING STARTED",
    readTime: "12 min read",
    title: "Upload Your Academic Materials",
    subtitle:
      "One upload. Passive income. Forever. Here is everything you need to know to publish your first document and make it perform.",
    hero: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&q=80",
    intro: `Uploading to LAN is the single action that converts your existing academic work — materials you have already created in the course of your professional duties — into a permanent income stream that continues generating revenue long after the original lecture ended. 

This guide covers everything from accepted file formats and optimal pricing strategies to metadata best practices and what happens after you submit. The detail here is intentional: the difference between a document that earns consistently and one that sits idle almost always comes down to decisions made at the moment of upload.`,
    sections: [
      {
        heading: "What File Formats Are Accepted and Which Perform Best?",
        body: `LAN accepts a broad range of file types to accommodate the different ways academic materials are created and stored. PDF is the strongly recommended format — it renders consistently across all devices, preserves your original formatting including tables, equations, and diagrams, and carries the highest student trust signal. Students on mobile devices, tablets, and desktop computers can all read PDFs without any additional software.

Microsoft Word documents in .docx format are accepted and automatically converted to PDF during the review process. The conversion preserves most standard formatting, but complex layouts with multiple columns, custom fonts, or advanced table structures may not convert perfectly. If you have materials in Word format, reviewing the converted PDF before your document goes live is advisable.

PowerPoint presentations in .pptx format are similarly accepted and converted to PDF during review. Image files — JPEG and PNG — are supported for handwritten notes, annotated diagrams, and physical materials that exist as photographs. ZIP archives can be submitted for multi-file course packs, containing any combination of the above formats.

All uploaded files are processed by LAN's document pipeline: quality checked, reformatted to a standard presentation template that includes your faculty credentials, watermarked with invisible buyer-specific identifiers, and protected against bulk download or redistribution. The maximum file size per upload is 500MB, which is more than sufficient for the vast majority of academic documents including illustrated textbooks.`,
      },
      {
        heading: "How Should You Price Your Documents?",
        body: `You set your own price. LAN imposes no minimum or maximum. You can change your price at any time from your <link slug="dashboard" text="Faculty Dashboard" /> without resubmitting the document for review. That flexibility is important: many experienced faculty sellers start at the lower end of the range and raise prices once a document has accumulated reviews and sales history.

Platform data across African markets shows consistent demand patterns. Past examination questions for a single academic session typically price between the equivalent of USD 1 and USD 4 — students buy them in volume, so even low unit prices generate meaningful income across a semester's worth of students. Semester-length lecture notes perform well between USD 4 and USD 10, while complete textbooks and course readers command USD 8 to USD 40 depending on length and discipline. Professional certification study packs and comprehensive course materials command the highest prices, often USD 20 to USD 120 for flagship institutional exam preparation materials.

Verified Faculty documents command a 30 to 50% price premium over equivalent unverified uploads. This is not a platform-imposed premium — it is the natural result of student willingness to pay more for credentialed material. If you are not yet <link slug="verify" text="verified" />, this premium is waiting for you on the other side of the verification process.

Currency display on LAN adapts to the buyer's location. A student in Kenya sees prices in Kenyan Shillings. A student in Ghana sees Ghanaian Cedis. You set your price in the platform's base currency and LAN handles all conversion and display automatically — your pricing decision is made once and applies across every African market simultaneously.`,
      },
      {
        heading: "What Metadata Determines Whether Students Find Your Document?",
        body: `Metadata is the single biggest driver of document discovery on LAN. A well-priced, high-quality document with poor metadata will generate far fewer sales than an average document with complete, precise metadata. This is not a platform quirk — it reflects how students actually search for academic materials.

The search behaviour of African students is highly specific. They do not search for "economics notes." They search for "ECON 201 University of Ghana 2023 semester 1 lecture notes." They search for "Biochemistry 301 past questions Makerere University." They search for "Civil Engineering 402 exam solutions Obafemi Awolowo University." Your metadata needs to satisfy these specific searches.

Required metadata fields include your institution's full official name and common abbreviation, your faculty and department, the exact course code and full course title as it appears in your institutional course catalogue, the academic level (100-level through 400-level, or postgraduate), the academic year or examination session, and the document type. Optional but highly valuable metadata includes the specific topics covered, examination months if applicable, and whether the document includes worked solutions.

Documents with complete metadata receive four times more organic search traffic than documents with minimal tags. That directly affects how much you <link slug="withdraw" text="earn and withdraw" /> each month. Platform data consistently shows that the top-earning faculty documents are not necessarily the highest-quality content — they are the most completely tagged content in high-demand course categories.`,
      },
      {
        heading: "What Happens During the Review Process?",
        body: `After submission, your document enters LAN's review queue. The review is conducted by a team of academic content specialists who check for content quality and academic relevance — ensuring the document delivers on what its title and description claim, accurate metadata and course code matching against known institutional course structures, file integrity and rendering quality across different device types, and compliance with LAN's content policy which prohibits plagiarised material, commercially licensed third-party content, and materials that violate student or institutional privacy.

Standard review turnaround is 24 to 48 hours. <link slug="verify" text="Verified Faculty" /> documents are reviewed ahead of the general queue, typically within 12 to 24 hours. For faculty in active examination seasons — when rapid document turnover is most valuable — priority review status makes a meaningful practical difference.

If a document is flagged during review, you receive specific feedback via email and in-app notification. The feedback identifies the exact issue and provides guidance on how to resubmit. Common flagged issues include mismatched course codes, file rendering problems with complex formatting, and missing required metadata fields. These are administrative issues, not content rejections, and are resolved with a simple resubmission.

Once your document is approved and goes live, it is immediately discoverable in LAN's search index. Sales data begins appearing in your <link slug="dashboard" text="analytics dashboard" /> from the moment of the first purchase. For popular course materials at large institutions, that first purchase can come within hours of going live.`,
      },
      {
        heading: "Updating, Revising, and Managing Your Document Catalogue",
        body: `Academic content is not static. Courses are revised, examination formats change, and new research supersedes older material. LAN is built to accommodate the ongoing management of a living document catalogue.

You can update a document's title, description, price, metadata, and cover image at any time from your Faculty Dashboard without any review process. These administrative changes take effect immediately. Pricing adjustments in particular can be made in response to demand signals — if you notice a document receiving many views but few purchases, a price adjustment experiment requires only a few seconds.

To update the file content itself — for example, to upload a revised edition of lecture notes — you submit a new version for review. The review process for version updates is faster than first-time review because the document already has an established record. Previous versions are archived and not visible to future buyers, but students who purchased previous versions retain access to the version they purchased. You can also unpublish any document temporarily — removing it from search and purchase — without permanently deleting it, which is useful for course materials that are seasonal or undergoing significant revision.

The most successful faculty sellers on LAN treat their document catalogue as a managed asset portfolio: regularly reviewing performance data, updating metadata to capitalise on emerging search patterns, repricing in response to competitive and seasonal signals, and adding new documents at the start of each academic session when student demand is at its seasonal peak.`,
      },
      {
        heading: "Bundling Documents Into Course Packs",
        body: `One of the most powerful monetisation strategies available to faculty sellers is the course pack — a bundled collection of related documents sold at a combined price that represents a discount to individual purchase but a revenue premium to the seller compared to selling each document separately.

A course pack might contain all past examination papers for a five-year period, combined with the corresponding model answers and a course outline. It might contain a complete semester's lecture notes alongside the tutorial sheets, reading lists, and a study guide. Students respond very well to course packs because they solve a discovery and curation problem — instead of assembling multiple separate purchases, students get everything they need for a course in one transaction.

From the faculty seller's perspective, course packs improve average transaction value, increase the proportion of your document library that any given student discovers and purchases, and provide a compelling product for students who are prepared to spend more for comprehensive preparation.

Course packs are created from your Faculty Dashboard after your component documents are individually live. You define the bundle, set the bundle price, and publish. The bundle appears in search results alongside individual document listings, giving students multiple entry points into your catalogue.`,
      },
    ],
    cta: { label: "Start Uploading", href: "/auth/signup" },
    related: ["verify", "network", "dashboard", "withdraw", "referral", "recharge"],
    tags: ["PDF", "Pricing", "Metadata", "Africa"],
  },

  dashboard: {
    badge: "Faculty Dashboard",
    badgeIcon: "📊",
    category: "PLATFORM GUIDE",
    readTime: "9 min read",
    title: "Your Faculty Dashboard",
    subtitle:
      "Real-time earnings, analytics, and full control of your academic catalogue — everything visible from a single command centre.",
    hero: "/LAN seller.png",
    intro: `The LAN Faculty Dashboard is your command centre. Every sale, every document view, every withdrawal request, every referral conversion, and every document in your catalogue is tracked, reported, and visualised in real time — giving you the data infrastructure to manage your academic publishing operation strategically rather than blindly.

Most faculty members who use the dashboard properly earn significantly more than those who upload and leave. The difference is not luck or content quality alone — it is the ability to see what is working, understand why, and act on that information. The dashboard is designed to make that possible without requiring any analytical expertise.`,
    sections: [
      {
        heading: "The Earnings Overview: Understanding What You See",
        body: `The primary panel of your Faculty Dashboard is the earnings overview. At the top level, you see your total lifetime earnings, your current month earnings with a day-by-day trend line, your available wallet balance ready for withdrawal, and your projected month-end earnings based on current trajectory.

Below the summary panel, a revenue breakdown chart shows earnings by document, by institution of buyer, by country or region, and by time period. You can toggle between weekly, monthly, quarterly, and yearly views. The chart immediately answers the questions most faculty sellers ask first: which documents are driving the majority of revenue, which institutions produce the most buyers, and whether income is growing or plateauing.

Every sale generates an immediate wallet credit and a corresponding entry in your transaction ledger. The ledger shows the document purchased, the transaction amount, your 80% payout after the platform fee, and — aggregated by region — where the buyer is located. For faculty at large institutions with alumni spread across multiple African countries, this geographic data often reveals unexpected demand beyond their home institution.`,
      },
      {
        heading: "Per-Document Analytics: Finding Your Best Performers",
        body: `The document performance panel is where strategic content decisions begin. For each document in your catalogue, the dashboard displays total views since listing, total purchases, conversion rate (the percentage of viewers who purchase), total revenue generated, average rating from buyer reviews, and a trend indicator showing whether performance is improving or declining.

The most important number for document optimisation is the conversion rate. A document with high views but low conversion is signalling a problem with price, description, or a mismatch between what students expect and what they find. A document with moderate views but high conversion is performing well and may benefit from increased visibility through a Promoted Listing.

Document view data is updated in real time. Every time a student previews your document — reading the description, viewing the cover page, checking the table of contents — that view is recorded. Views without purchases indicate students who were interested but not convinced. The document description, pricing, and preview quality are the variables to optimise in response to this signal.

<link slug="verify" text="Verified Faculty members" /> at Distinguished and Emeritus tier receive a monthly analytics PDF report emailed directly to their registered address. This report provides a full performance breakdown with trend analysis, peer benchmarking against anonymised faculty sellers in the same discipline and institution category, and personalised recommendations for growing their <link slug="network" text="Faculty Network presence" />.`,
      },
      {
        heading: "Managing Your Document Catalogue",
        body: `The catalogue management panel gives you complete control over every document you have <link slug="upload" text="uploaded" />. Documents are displayed with their current status — live, pending review, flagged, or unpublished — alongside their performance summary. You can take action on individual documents or use bulk actions to update multiple documents simultaneously.

Common catalogue management actions available from the dashboard include updating pricing across multiple documents at once, which is particularly useful at the start of a new academic session when demand patterns shift; editing metadata to add newly relevant course codes or institutional tags as your document gains discoverability in unexpected markets; creating or modifying course packs by bundling related documents; and applying for Promoted Listings for specific high-performing documents to increase their search visibility during peak demand periods.

The catalogue view also flags any documents that have been pending review for longer than the standard window, allowing you to follow up with LAN's support team if needed. Documents with buyer disputes or quality flags are surfaced here for your attention and response.`,
      },
      {
        heading: "Understanding Your Earnings Timeline and Wallet",
        body: `Your earnings timeline shows the complete financial history of your Faculty Network participation. Every transaction — sale, referral commission, Bounty reward, withdrawal, and recharge service purchase — is logged with its timestamp, amount, and status.

Earnings are credited to your LAN wallet immediately after each transaction. There is no holding period, no escrow delay, and no weekly payment cycle. When a student in Kampala buys your lecture notes at 11pm on a Saturday, your wallet balance increases within seconds.

<link slug="withdraw" text="Withdrawals" /> are initiated from the wallet panel and processed within 24 hours on business days. The dashboard shows your pending balance (earnings not yet available for withdrawal due to any active disputes), available balance (immediately withdrawable), total withdrawn to date, and projected monthly earnings. A visual breakdown of every transaction's 80/20 revenue split is displayed alongside the raw amounts, so you always have full transparency on exactly how your income is calculated.

For faculty members who prefer to use their wallet balance directly without initiating a bank transfer, the <link slug="recharge" text="LAN Recharge Services" /> panel allows you to pay for airtime, mobile data, electricity tokens, and cable television directly from your earnings — at rates that are typically more favourable than retail purchase channels.`,
      },
      {
        heading: "Bounty Board: High-Value Commissioned Work",
        body: `The Bounty Board is one of the most powerful and under-utilised features of the Faculty Dashboard for verified academic professionals. Students and institutions post specific requests for academic materials — past papers for a particular examination session, lecture notes for a course not currently available on the platform, custom study guides for professional certification examinations — with attached reward payments that are held in escrow until the bounty is fulfilled.

Bounty values range from the equivalent of USD 5 for simple single-document requests to USD 500 or more for comprehensive custom content packages. <link slug="verify" text="Verified Faculty members" /> have an exclusive priority window to claim and fulfil bounties before they are opened to the broader platform. This gives you first-mover access to the highest-value requests.

Your dashboard's Bounty panel shows all open bounties that match your verified institutional and disciplinary credentials, the current claimed and fulfilled status of bounties you have taken on, and your complete Bounty earnings history. Faculty members who actively monitor and fulfil Bounties earn significantly more than those who rely solely on passive document sales — and the process of fulfilling a Bounty often produces a new document that can be listed in your catalogue for ongoing passive income.`,
      },
    ],
    cta: { label: "Access Your Dashboard", href: "/home/faculty-dashboard" },
    related: ["upload", "verify", "withdraw", "network", "referral", "recharge"],
    tags: ["Analytics", "Earnings", "Catalogue", "Real-time"],
  },

  withdraw: {
    badge: "Withdraw Earnings",
    badgeIcon: "🏦",
    category: "PAYMENTS GUIDE",
    readTime: "8 min read",
    title: "Withdraw Your Earnings",
    subtitle:
      "Every unit of currency you earn on LAN belongs to you. Here is exactly how to get it into your account, wherever you are in Africa.",
    hero: "/earn.jpeg",
    intro: `LAN was built to serve academic professionals across an entire continent with enormously varied financial infrastructure. A professor in Lagos withdrawing to a Nigerian commercial bank account has different needs to a lecturer in Nairobi withdrawing to M-Pesa, or a faculty member in Accra transferring to an MTN Mobile Money wallet. The withdrawal system is designed to serve all of these realities with equal speed and zero friction.

The principle behind every withdrawal design decision is simple: the money in your wallet is yours, and getting it to you should be the fastest, most transparent, most fee-free experience the platform can provide.`,
    sections: [
      {
        heading: "How to Initiate a Withdrawal",
        body: `Withdrawals are initiated from the Wallet section of your <link slug="dashboard" text="Faculty Dashboard" />. The process is designed to take under 60 seconds once you have your bank or mobile money details linked.

Navigate to your dashboard and select Wallet, then choose Withdraw Earnings. Enter the amount you wish to withdraw — the minimum withdrawal is the equivalent of USD 2.50, adjusted to your local currency. Confirm your linked bank account or mobile money details on screen, then submit the request. You will receive an immediate in-app notification and email confirming the withdrawal request has been received, followed by a second notification when the transfer is complete.

Security on withdrawals is enforced through your Transfer PIN — a 4-digit code you set up separately from your account password. Every withdrawal request requires PIN confirmation. If you have not set up a Transfer PIN, you will be prompted to do so before your first withdrawal. If you need to reset your PIN, the process is handled through an OTP sent to your registered email address.`,
      },
      {
        heading: "Supported Withdrawal Methods Across Africa",
        body: `LAN supports a comprehensive and growing range of withdrawal methods across the African continent, built to match the actual financial infrastructure that faculty members use in different countries.

In Nigeria, all major commercial banks are supported including Access Bank, GTBank, Zenith Bank, First Bank, UBA, Stanbic IBTC, Fidelity Bank, Sterling Bank, Polaris Bank, and Wema Bank. Fintech accounts including Kuda, Opay, PalmPay, and Moniepoint are fully supported with no additional processing delay compared to traditional bank accounts.

In Ghana, withdrawals are processed to all major commercial banks including GCB Bank, Ecobank Ghana, Stanbic Ghana, Absa Ghana, and Standard Chartered Ghana. Mobile money withdrawals to MTN MoMo, Vodafone Cash, and AirtelTigo Money are supported with instant processing.

In Kenya, withdrawals are processed to M-Pesa accounts, Equity Bank, KCB Bank, Cooperative Bank, Standard Chartered Kenya, and all major commercial banks. In Uganda and Tanzania, major commercial banks and MTN Mobile Money are supported. In South Africa, all major banks including Standard Bank, ABSA, FNB, Nedbank, and Capitec are fully supported.

The withdrawal system continues to expand. If your country or preferred withdrawal method is not yet listed, contact LAN Support through your <link slug="dashboard" text="dashboard" /> to discuss your situation. New withdrawal corridors are added regularly based on faculty member demand.`,
      },
      {
        heading: "Withdrawal Fees and Tier Benefits",
        body: `Withdrawal fees on LAN are structured around seller tier, which is determined by your cumulative performance on the <link slug="network" text="Faculty Network" /> — your total earnings, document catalogue size, verification status, and review rating. The fee structure is designed to reward active, high-performing faculty sellers with progressively better withdrawal conditions.

Bronze Faculty members — new faculty sellers in their first earning period — pay a flat fee equivalent to USD 0.10 per withdrawal. This is a fixed fee regardless of withdrawal amount; withdrawing a large sum costs the same as withdrawing a small one. Silver Faculty members enjoy zero withdrawal fees. Distinguished Faculty members receive zero fees with same-business-day processing. Emeritus Faculty members — the top tier of LAN's academic community — receive zero fees with near-instant transfer, typically completing within minutes of request submission.

There are no hidden charges beyond the tier-based fee. No percentage deductions. No minimum balance requirements. No currency conversion margins on top of published rates. What your dashboard shows as your available balance is what arrives in your account, minus only the applicable flat withdrawal fee.`,
      },
      {
        heading: "How Long Do Withdrawals Actually Take?",
        body: `The published withdrawal guarantee is 24 hours for standard processing. In practice, the vast majority of withdrawals complete significantly faster. For Nigerian bank accounts, most withdrawals complete within 4 to 8 hours of submission on business days. For mobile money accounts in Ghana and Kenya, processing is typically 1 to 3 hours.

Factors that can extend processing time include public holidays in your country, where banking system limitations may delay credit regardless of LAN's processing speed; very large withdrawal amounts above the equivalent of USD 5,000 in a single transaction, which may trigger a brief compliance verification step that typically takes under 2 hours; and recently changed bank account details, where additional verification is required to protect against fraud.

If your withdrawal has not completed within 24 hours, contact LAN Support directly through your <link slug="dashboard" text="dashboard" />. The support team has a 2-business-hour resolution commitment for withdrawal issues. Common resolution actions include manual re-processing of delayed transfers, verification of bank account details, and in rare cases where a transfer has failed on the bank side, cancellation and resubmission.`,
      },
      {
        heading: "Withdrawal Limits and High-Value Transfers",
        body: `The minimum withdrawal amount is the equivalent of USD 2.50 in your local currency. There is no maximum withdrawal limit for Silver tier and above. Bronze Faculty members have a daily withdrawal limit of the equivalent of USD 1,200, which resets every 24 hours — in practice, this limit is not reached by the majority of Bronze-tier sellers.

For withdrawals above the equivalent of USD 5,000 in a single transaction — which applies primarily to Distinguished and Emeritus Faculty members with large monthly document income — LAN's compliance team conducts a brief identity confirmation. This process requires no new documents if you are already <link slug="verify" text="verified faculty" />; it is simply a confirmation step that typically completes within 2 hours of the large withdrawal request being submitted.

Faculty members with regular large monthly withdrawals are encouraged to contact LAN's faculty support team to set up an expedited processing arrangement. Distinguished and Emeritus Faculty members are assigned a dedicated account manager who can facilitate this directly.`,
      },
      {
        heading: "Using Your Wallet Without Withdrawing",
        body: `Not every use of your Faculty Network earnings requires a bank transfer. For faculty members who prefer to use earnings in their day-to-day life without the friction of a transfer, <link slug="recharge" text="LAN Recharge Services" /> allow you to spend your wallet balance directly on mobile airtime and data, electricity tokens, and cable television subscriptions across major African providers.

Recharge transactions are processed in real time with no withdrawal fee and at rates that are often more favourable than retail purchase channels — mobile data bundles in particular are typically available at the SME rate through LAN, which is 30 to 40% cheaper than buying directly from the network provider.

This means a faculty member who sells enough documents to cover a month's worth of mobile data, airtime, and electricity can effectively eliminate those expenses from their personal budget using income generated entirely from their academic work — without ever initiating a bank transfer.`,
      },
    ],
    cta: { label: "Go to Wallet", href: "/home/wallet" },
    related: ["dashboard", "network", "recharge", "verify", "upload", "referral"],
    tags: ["Bank Transfer", "Mobile Money", "Africa", "Wallet"],
  },

  recharge: {
    badge: "Recharge Services",
    badgeIcon: "⚡",
    category: "PLATFORM FEATURE",
    readTime: "7 min read",
    title: "Recharge Services",
    subtitle:
      "Pay for everyday utilities across Africa — airtime, data, electricity, and cable — directly from your LAN earnings wallet.",
    hero: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80",
    intro: `LAN Recharge Services lets you convert your academic publishing income into everyday utility payments without ever initiating a bank transfer. Your earnings wallet is not just a holding account for funds waiting to be withdrawn — it is a live spending tool that works across the utility infrastructure of every supported African country.

For faculty members who prefer the immediacy of spending earnings directly rather than routing through a bank transfer, Recharge Services provides a practical, fee-free channel that also often delivers better rates than retail utility purchase platforms.`,
    sections: [
      {
        heading: "What Services Can You Pay For?",
        body: `LAN Recharge currently supports four major utility categories, with country-specific coverage that reflects the most-used utility payment channels across Africa.

Airtime top-ups are supported for MTN, Airtel, Glo, and 9mobile in Nigeria; MTN, AirtelTigo, and Vodafone in Ghana; Safaricom, Airtel Kenya, and Telkom in Kenya; MTN Uganda, Airtel Uganda; and additional networks across Tanzania, Rwanda, South Africa, and other supported markets. Top-ups are available from the equivalent of USD 0.10 with no minimum and no service markup — one unit of currency in your wallet buys one unit of airtime on your network.

Mobile data bundles are available at SME and wholesale rates — typically 30 to 40% cheaper than buying the same bundle directly through the network's consumer app or USSD channel. Data bundles are available for all supported airtime networks in daily, weekly, and monthly configurations.

Electricity prepaid meter top-ups are available for all major Distribution Company regions in Nigeria (IKEDC, EKEDC, AEDC, PHEDC, EEDC, IBEDC, JED, KEDC, KAEDCO, and YEDC), Kenya Power prepaid meters in Kenya, and ECG meters in Ghana. Additional electricity providers are being added regularly.

Cable television renewals are processed for DSTV, GOTV, and Startimes across all supported African countries where those services operate. School fees and levies for participating institutions are also available through the Recharge panel, with additional institutional partners being added on an ongoing basis.`,
      },
      {
        heading: "How to Make a Recharge Payment",
        body: `All recharge payments are funded directly from your LAN wallet balance — the same wallet where your <link slug="upload" text="document sale earnings" /> and <link slug="referral" text="referral commissions" /> are deposited. No card number entry, no bank transfer initiation, no third-party payment app. Your earnings fund your utilities in a single step.

To make a recharge payment, navigate to your <link slug="dashboard" text="Faculty Dashboard" /> and select the Recharge Services panel. Choose the service type you want to pay for, then enter the relevant identifier — your phone number for airtime and data, your prepaid meter number for electricity, or your smartcard number for cable television. Select the amount or bundle, review the transaction summary, and confirm.

The entire process from opening the Recharge panel to a confirmed transaction typically takes under 30 seconds. There is no secondary verification step for recharge transactions below the equivalent of USD 50 — they are processed with your standard session authentication.`,
      },
      {
        heading: "Are Recharge Rates Competitive?",
        body: `The data bundle rates available through LAN Recharge are the same SME-grade rates used by VAS resellers and fintech platforms across Africa — not the retail consumer rates charged by the networks' own apps. For Nigerian faculty members buying data for MTN or Airtel, this typically means 30 to 40% savings compared to buying directly through the network's retail channel. Similar savings apply to Ghanaian and Kenyan network data bundles.

Airtime is available at face value — one unit of wallet balance buys one unit of airtime on the selected network, with no markup. This is consistent with the practice of most established African fintech platforms.

Electricity top-ups and cable television renewals are processed at the published official rates of the respective providers. LAN does not add any margin on top of these published rates, and there is no Recharge service fee regardless of the amount being processed. The only cost of a Recharge transaction is the face value of what you are buying.

This rate competitiveness makes Recharge Services genuinely practical for day-to-day use. A faculty member who generates the equivalent of USD 50 in monthly document income can eliminate their monthly mobile data, airtime, and electricity costs from that income — effectively receiving those utilities as a benefit of their academic publishing activity.`,
      },
      {
        heading: "Processing Speed and Transaction Reliability",
        body: `Recharge transactions are processed in real time with guaranteed completion timelines. Airtime credit reaches your phone within 30 seconds of a confirmed transaction. Mobile data bundle activation completes within 60 seconds. Electricity prepaid tokens are delivered within 2 minutes and displayed both on screen and via email for meter entry. Cable television renewals process within 3 minutes.

Processing reliability is very high — the platform maintains direct API integrations with all supported providers rather than routing through third-party VAS intermediaries, which reduces failure rates significantly compared to consumer-facing alternatives.

In the event of a failed transaction — which may occur due to a temporary provider outage or network connectivity issue — your wallet balance is automatically refunded within 10 minutes. You receive an in-app notification confirming the refund. There is no manual claim process required. You can then retry the transaction once the provider system is confirmed to be operational, or switch to an alternative provider or method.`,
      },
      {
        heading: "Recharge Services vs. Withdrawal: Which Should You Use?",
        body: `The choice between using Recharge Services and initiating a bank <link slug="withdraw" text="withdrawal" /> is a personal financial preference with no single correct answer. Both channels convert your wallet earnings into real-world value.

Recharge Services makes more sense when the utility cost you want to cover is directly available on the platform, when the amount is relatively small and a bank transfer would be disproportionate, or when you want immediate real-world value from your earnings without any transfer delay.

A bank withdrawal makes more sense when you want to consolidate earnings into your personal bank account for budgeting purposes, when the amount exceeds what you can practically spend through utility payments, or when you prefer to maintain a clear separation between your academic income and your utility spending.

Many faculty members use both: a regular withdrawal for the bulk of their monthly earnings, with Recharge Services handling incidental utilities throughout the month. Your wallet balance is always available for either use, in any combination, at any time.`,
      },
    ],
    cta: { label: "Go to Recharge", href: "/home/recharge" },
    related: ["withdraw", "dashboard", "referral", "verify", "upload", "network"],
    tags: ["Airtime", "Data", "Electricity", "Africa"],
  },

  referral: {
    badge: "Referral Programme",
    badgeIcon: "🔗",
    category: "EARN MORE",
    readTime: "9 min read",
    title: "Referral Programme",
    subtitle:
      "Earn commissions every time you grow the LAN community — students, sellers, or verified faculty members all generate income for you.",
    hero: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80",
    intro: `The LAN Referral Programme is a structured commission system that rewards you for growing the academic publishing community that benefits everyone on the platform. Every person you introduce to LAN who makes a purchase, uploads a document, or joins as a verified faculty member generates an automatic commission credited to your wallet — no forms to fill, no claiming process, no minimum referral threshold.

For faculty members who are well-connected within their academic institutions and networks, the referral programme can generate income comparable to or exceeding their passive document sales income. The maths are straightforward: a professor with a department of 20 colleagues who persuades half of them to join and verify as faculty sellers can generate significant recurring referral income with no ongoing effort beyond the initial introduction.`,
    sections: [
      {
        heading: "How the Referral System Works",
        body: `Every LAN account — student, seller, and faculty alike — is automatically assigned a unique referral link and referral code at the time of account creation. Your referral link is a standard URL that, when visited by someone who subsequently creates an account, permanently associates that new account with yours in the referral system.

Share your referral link through any channel: WhatsApp, email, in-person, social media, institutional communication channels, or posted on your department noticeboard. When someone creates their LAN account through your link, they are attributed to you permanently. If they make a purchase as a student buyer, upload and sell as a document seller, or join and verify as a faculty member, the appropriate commission is automatically credited to your wallet.

The referral attribution is permanent and does not expire. A colleague you referred two years ago who is still selling documents on the platform generates commissions for your initial referral for the lifetime of their account activity. You receive your referral commission from their first qualifying transaction, not ongoing commissions from every transaction — the programme is structured to reward network growth, not to share in colleagues' ongoing income.`,
      },
      {
        heading: "Commission Rates for Different Referral Types",
        body: `Commission rates are differentiated by the type of person you refer and the action that triggers the commission payment.

Referring a new student buyer who makes their first document purchase earns you a flat commission equivalent to approximately USD 0.50. This is a relatively modest individual commission, but student buyers are the easiest referrals to make and the easiest to convert — a single WhatsApp message to a group of students studying for an examination can generate multiple conversions within hours.

Referring a new document seller who uploads their first document and makes their first sale earns you a commission equivalent to approximately USD 1.25. Document sellers are more valuable to the platform than casual buyers, and the commission reflects that.

Referring a new faculty member who completes <link slug="verify" text="Faculty Verification" /> and makes their first document sale earns you the highest base commission — equivalent to approximately USD 2.50. Verified faculty members are the highest-value participants on the platform, creating content that drives student traffic and purchases for years. Your referral commission reflects the lifetime value you are contributing by expanding the verified faculty community.

Volume bonuses stack on top of individual commissions. Referring ten or more people in a calendar month earns a bonus equivalent to approximately USD 12.50, paid at the end of the month. The most active referrers — typically faculty members who systematically introduce colleagues and students at their institutions — can earn the equivalent of USD 50 to USD 200 per month in referral commissions alone.`,
      },
      {
        heading: "Finding and Sharing Your Referral Link",
        body: `Your referral link is accessible from multiple locations in the platform to ensure it is always easy to find and share regardless of where you are when an opportunity to make a referral arises.

The primary location is your <link slug="dashboard" text="Faculty Dashboard" /> under the Referral Programme tab, where your full referral link and your referral code are displayed with one-click copy buttons for each. Your profile settings page also shows your referral link. In the LAN mobile app, the Referral Programme section of the main menu provides your link alongside a built-in sharing interface that integrates with WhatsApp, email, and other sharing channels on your device.

You can generate a custom referral code that is easier to communicate verbally — for example, PROF-OKONKWO or MAKERERE-BIO — rather than sharing the full URL. Custom codes are particularly useful when making referrals in person, at department meetings, or in written communications where a clean, memorable code is more professional than a URL.

Some faculty members have found it effective to include their referral code in their course syllabi or email signature with a brief note explaining that students can access their course materials directly on LAN. This converts students who were already going to seek your materials into referred buyers — effectively earning you a referral commission on purchases you would have generated through organic discovery anyway.`,
      },
      {
        heading: "Tracking Your Referrals and Conversions",
        body: `Your Referral Dashboard provides complete visibility into every referral you have made and every commission you have earned. The dashboard displays your total number of referred users with a breakdown by type (buyer, seller, faculty), referrals who have signed up but not yet made a qualifying action (pending conversions), referrals who have made a purchase or upload (active), total commission earned from referrals to date, your current month referral count and its position relative to the volume bonus threshold, and your ranking on the monthly referral leaderboard.

All referral data is updated in real time. You receive an in-app notification every time a referred user takes a qualifying action — a student you referred makes their first purchase, a colleague completes faculty verification — and the corresponding commission is credited to your wallet simultaneously with the notification.

The pending conversion list is particularly useful for motivated referrers. It shows you which referred users have created accounts but not yet converted. For a faculty colleague who signed up but has not yet uploaded a document, a follow-up conversation about the <link slug="upload" text="upload process" /> might be all that is needed to complete the conversion. The platform does not contact pending referrals on your behalf — that relationship-based follow-up is yours to make.`,
      },
      {
        heading: "Building a Referral Strategy as a Faculty Member",
        body: `The most effective referral strategies for faculty members leverage the natural network relationships that exist in academic environments — departmental relationships, institutional communities, professional associations, and alumni networks.

Within your institution, department meetings, faculty development workshops, and common room conversations are natural opportunities to mention LAN to colleagues. The most effective introduction is usually a concrete one: showing a colleague your actual earnings dashboard rather than describing the platform abstractly. Seeing a peer's document income tends to be far more persuasive than any description of how the platform works.

Beyond your immediate institution, professional associations and academic networks across Africa provide channels to reach faculty members at other universities. A post in an academic WhatsApp group, a mention at a conference, or an email to a professional mailing list can generate referrals from institutions you have no direct connection to. Each of those referrals, if they verify and sell, generates a faculty referral commission for you.

The referral programme also works retroactively in a practical sense. If colleagues at your institution are already selling on LAN but joined through organic discovery rather than your link, you can still earn commissions on future colleagues by being the connector for new faculty joiners. Building a reputation within your institution as the person who introduced LAN to the department can sustain referral income for years as new academic staff join and seek guidance on getting started.`,
      },
      {
        heading: "Is There a Cap on Referral Earnings?",
        body: `There is no cap on referral earnings. There is no maximum number of referrals. There is no expiry on commission eligibility. The programme is designed to scale with your network — the larger and more active the academic community you introduce to LAN, the more you earn.

Our highest-performing referrers generate the equivalent of USD 100 to USD 300 per month in referral commissions, entirely separate from their passive document income and Bounty earnings. These are typically faculty members at large institutions with broad departmental networks who systematically introduced LAN to their colleagues and students over a sustained period.

Referral income stacks additively with every other income stream on the platform. A faculty member earning from document sales, receiving Bounty rewards, and generating referral commissions is building three independent passive income streams simultaneously — all from a single account, all flowing to the same wallet, all withdrawable through the same fast, fee-free <link slug="withdraw" text="withdrawal process" />.`,
      },
    ],
    cta: { label: "Get Your Referral Link", href: "/ref/invite-friends" },
    related: ["network", "withdraw", "dashboard", "verify", "upload", "recharge"],
    tags: ["Commission", "Network", "Africa", "Passive Income"],
  },
};

/* ─── Related meta ─────────────────────────────────────────── */
const RELATED_META = {
  network: { label: "Faculty Network", icon: "🏛️", desc: "Join 3,200+ academic professionals across Africa" },
  verify: { label: "Faculty Verification", icon: "✅", desc: "Get your trusted badge in 24–48h" },
  upload: { label: "Upload Materials", icon: "📤", desc: "Turn your academic work into income" },
  dashboard: { label: "Faculty Dashboard", icon: "📊", desc: "Track earnings and analytics in real time" },
  withdraw: { label: "Withdraw Earnings", icon: "🏦", desc: "Bank and mobile money across Africa" },
  recharge: { label: "Recharge Services", icon: "⚡", desc: "Pay utilities from your wallet" },
  referral: { label: "Referral Programme", icon: "🔗", desc: "Earn commissions per referral" },
};

/* ─── Parse inline link syntax in body text ─────────────────── */
function parseBody(text) {
  const parts = [];
  const regex = /<link slug="([^"]+)" text="([^"]+)" \/>/g;
  let last = 0,
    match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last)
      parts.push({ type: "text", content: text.slice(last, match.index) });
    parts.push({ type: "link", slug: match[1], text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length)
    parts.push({ type: "text", content: text.slice(last) });
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
            href={`/faculty/${p.slug}`}
            style={{
              color: GOLD,
              textDecoration: "underline",
              textDecorationColor: "rgba(184,150,62,0.4)",
              textUnderlineOffset: "3px",
              fontWeight: 600,
              transition: "color .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLDD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = GOLD)}
          >
            {p.text}
          </Link>
        ) : (
          <span key={i}>{p.content}</span>
        )
      )}
    </>
  );
}

function BodyBlock({ body }) {
  const paragraphs = body.split("\n\n");
  return (
    <>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          style={{
            fontSize: 16,
            lineHeight: 1.85,
            color: "#3a3530",
            margin: i < paragraphs.length - 1 ? "0 0 20px" : 0,
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
          }}
        >
          <RichParagraph text={para} />
        </p>
      ))}
    </>
  );
}

/* ─── Nav ───────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: NAVY,
        borderBottom: "1px solid rgba(184,150,62,.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(20px,4vw,48px)",
        height: 64,
        transition: "box-shadow .2s",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.3)" : "none",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: 19,
          color: "#fff",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          letterSpacing: "-.3px",
        }}
      >
        LAN <span style={{ color: GOLD }}>Library</span>
      </Link>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link
          href="/faculty/network"
          style={{
            color: "rgba(255,255,255,.55)",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: ".09em",
            textTransform: "uppercase",
            fontFamily: "'Lato', sans-serif",
          }}
        >
          Faculty Hub
        </Link>
        <Link
          href="/auth/signup"
          style={{
            background: GOLD,
            color: NAVY,
            padding: "9px 20px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'Lato', sans-serif",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = GOLDD)}
          onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
        >
          Join Free
        </Link>
      </div>
    </nav>
  );
}

/* ─── Table of Contents dot ─────────────────────────────────── */
function TocItem({ label, index, active, onClick }) {
  return (
    <button
      onClick={() => onClick(index)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "7px 0",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        borderBottom: "1px solid #f0ebe0",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          flexShrink: 0,
          background: active ? GOLD : "#d8cfbf",
          transition: "background .15s",
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontFamily: "'Lato', sans-serif",
          color: active ? NAVY : "#888",
          fontWeight: active ? 700 : 400,
          transition: "color .15s",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── 404 ───────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 40,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 72,
          fontWeight: 900,
          color: GOLD,
          lineHeight: 1,
        }}
      >
        404
      </div>
      <div
        style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: 18,
          color: NAVY,
          fontWeight: 700,
        }}
      >
        Page not found
      </div>
      <Link
        href="/faculty/network"
        style={{
          color: GOLD,
          fontFamily: "'Lato', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        ← Back to Faculty Network
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GUIDES FOOTER — Fiverr-style full grid of all guides
═══════════════════════════════════════════════════════════════ */
function GuidesFooter({ currentSlug }) {
  const allGuides = Object.entries(RELATED_META);

  return (
    <div
      style={{
        background: NAVY,
        borderTop: `1px solid rgba(184,150,62,.15)`,
        padding: "56px clamp(20px,4vw,48px) 48px",
        marginTop: 64,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 36,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "rgba(184,150,62,.6)",
                marginBottom: 8,
                fontFamily: "'Lato', sans-serif",
              }}
            >
              Faculty Guides
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(22px,3vw,32px)",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Everything You Need to Know
            </h2>
          </div>
          <Link
            href="/faculty/network"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: GOLD,
              fontFamily: "'Lato', sans-serif",
              textDecoration: "none",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            View All Guides →
          </Link>
        </div>

        {/* Guide grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 1,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.06)",
          }}
          className="guides-footer-grid"
        >
          {allGuides.map(([slug, meta]) => {
            const isCurrent = slug === currentSlug;
            return (
              <Link
                key={slug}
                href={`/faculty/${slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    padding: "24px 22px",
                    background: isCurrent
                      ? "rgba(184,150,62,.12)"
                      : "rgba(255,255,255,.03)",
                    borderRight: "1px solid rgba(255,255,255,.06)",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                    transition: "background .18s",
                    height: "100%",
                    boxSizing: "border-box",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent)
                      e.currentTarget.style.background =
                        "rgba(184,150,62,.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrent
                      ? "rgba(184,150,62,.12)"
                      : "rgba(255,255,255,.03)";
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: GOLD,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 28,
                      display: "block",
                      marginBottom: 12,
                      lineHeight: 1,
                    }}
                  >
                    {meta.icon}
                  </span>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: isCurrent ? GOLD : "rgba(184,150,62,.5)",
                      margin: "0 0 6px",
                      fontFamily: "'Lato', sans-serif",
                    }}
                  >
                    GUIDE
                  </p>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: isCurrent ? "#fff" : "rgba(255,255,255,.75)",
                      margin: "0 0 6px",
                      lineHeight: 1.25,
                    }}
                  >
                    {meta.label}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.35)",
                      margin: "0 0 14px",
                      fontFamily: "'Lato', sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    {meta.desc}
                  </p>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isCurrent ? GOLD : "rgba(184,150,62,.55)",
                      fontFamily: "'Lato', sans-serif",
                      letterSpacing: ".04em",
                    }}
                  >
                    {isCurrent ? "Currently reading" : "Read guide →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(184,150,62,.1)",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(245,240,232,.25)",
              fontFamily: "'Lato', sans-serif",
            }}
          >
            © 2026 LAN Library — Learning Access Network · Africa
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link
              href="/faculty/network"
              style={{
                fontSize: 11,
                color: "rgba(245,240,232,.4)",
                fontFamily: "'Lato', sans-serif",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Faculty Hub
            </Link>
            <Link
              href="/auth/signup"
              style={{
                fontSize: 11,
                color: GOLD,
                fontFamily: "'Lato', sans-serif",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Join Free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function FacultySlugPage() {
  const params = useParams();
  const slug = params?.slug;
  const page = PAGES[slug];
  const [activeSection, setActiveSection] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      const pct =
        (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(pct);
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  if (!page)
    return (
      <>
        <style>{GLOBAL_STYLE}</style>
        <div style={{ background: BG, minHeight: "100vh" }}>
          <Nav />
          <NotFound />
        </div>
      </>
    );

  return (
    <>
      <style>{GLOBAL_STYLE}</style>

      {/* Reading progress bar */}
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          zIndex: 99,
          height: 2,
          background: GOLD,
          width: `${progress}%`,
          transition: "width .1s linear",
        }}
      />

      <div
        style={{
          background: BG,
          minHeight: "100vh",
          fontFamily: "'Lato', sans-serif",
          color: NAVY,
        }}
      >
        <Nav />

        {/* ── ARTICLE HEADER ── */}
        <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "36px clamp(20px,4vw,48px) 40px",
            }}
          >
            {/* breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/"
                style={{
                  fontSize: 12,
                  color: "#999",
                  textDecoration: "none",
                  fontFamily: "'Lato', sans-serif",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
              >
                LAN Library
              </Link>
              <span style={{ color: "#ccc", fontSize: 12 }}>›</span>
              <Link
                href="/faculty/network"
                style={{
                  fontSize: 12,
                  color: "#999",
                  textDecoration: "none",
                  fontFamily: "'Lato', sans-serif",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
              >
                Faculty Guides
              </Link>
              <span style={{ color: "#ccc", fontSize: 12 }}>›</span>
              <span
                style={{
                  fontSize: 12,
                  color: GOLD,
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 600,
                }}
              >
                {page.badge}
              </span>
            </div>

            {/* category + read time */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: GOLD,
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                {page.category}
              </span>
              <span style={{ color: "#ddd", fontSize: 10 }}>•</span>
              <span
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  fontFamily: "'Lato', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>🕐</span> {page.readTime}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,48px)",
                fontWeight: 900,
                color: NAVY,
                lineHeight: 1.1,
                letterSpacing: "-.3px",
                margin: "0 0 16px",
                maxWidth: 760,
              }}
            >
              {page.title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(15px,1.6vw,18px)",
                color: "#666",
                fontWeight: 300,
                margin: "0 0 28px",
                maxWidth: 640,
                lineHeight: 1.65,
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {page.subtitle}
            </p>

            {/* Author meta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingTop: 20,
                borderTop: `1px solid ${BORDER}`,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: NAVY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: GOLD,
                  fontFamily: "'Playfair Display', serif",
                  flexShrink: 0,
                }}
              >
                <img src="/lanlog.png" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: NAVY,
                    fontFamily: "'Lato', sans-serif",
                  }}
                >
                  LAN Academic Review Board.
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    fontFamily: "'Lato', sans-serif",
                  }}
                >
                  Academic Publishing Platform · Africa
                </div>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {page.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#aaa",
                      background: BG,
                      border: `1px solid ${BORDER}`,
                      padding: "3px 10px",
                      fontFamily: "'Lato', sans-serif",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY GRID ── */}
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding:
              "clamp(24px,3vw,48px) clamp(20px,4vw,48px)",
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 56,
            alignItems: "start",
          }}
          className="lan-body-grid"
        >
          {/* ── ARTICLE ── */}
          <article>
            {/* Intro lede */}
            <div style={{ marginBottom: 40 }}>
              {page.intro.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 18,
                    lineHeight: 1.8,
                    color: "#2c2822",
                    fontWeight: i === 0 ? 400 : 300,
                    margin:
                      i < page.intro.split("\n\n").length - 1
                        ? "0 0 18px"
                        : 0,
                    fontFamily: "'Lato', sans-serif",
                    borderLeft: i === 0 ? `3px solid ${GOLD}` : "none",
                    paddingLeft: i === 0 ? 18 : 0,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Featured image */}
            <div
              style={{
                marginBottom: 40,
                overflow: "hidden",
                border: `1px solid ${BORDER}`,
              }}
            >
              <img
                src={page.hero}
                alt={page.title}
                style={{
                  width: "100%",
                  height: "clamp(200px,28vw,360px)",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  background: "#f7f4ef",
                  padding: "8px 14px",
                  borderTop: `1px solid ${BORDER}`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#aaa",
                    fontFamily: "'Lato', sans-serif",
                    fontStyle: "italic",
                  }}
                >
                  {page.badge} — LAN Library Faculty Guides · Africa
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 36,
              }}
            >
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#bbb",
                  fontFamily: "'Lato', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                In This Guide
              </span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            {/* Sections */}
            {page.sections.map((sec, i) => (
              <section
                key={i}
                id={`section-${i}`}
                style={{ marginBottom: 52 }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(20px,2.5vw,26px)",
                    fontWeight: 700,
                    color: NAVY,
                    lineHeight: 1.2,
                    marginBottom: 18,
                    paddingBottom: 12,
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      background: GOLD,
                      color: NAVY,
                      fontSize: 11,
                      fontWeight: 900,
                      fontFamily: "'Lato', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {sec.heading}
                </h2>
                <BodyBlock body={sec.body} />
              </section>
            ))}

            {/* CTA block */}
            <div
              style={{
                background: NAVY,
                backgroundImage:
                  "radial-gradient(rgba(184,150,62,.05) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
                padding: "40px 40px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  Ready to get started?
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(245,240,232,.45)",
                    fontFamily: "'Lato', sans-serif",
                    maxWidth: 340,
                    lineHeight: 1.6,
                  }}
                >
                  Join thousands of verified faculty members already earning
                  on LAN across Africa.
                </div>
              </div>
              <Link
                href={page.cta.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "15px 32px",
                  background: GOLD,
                  color: NAVY,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  fontFamily: "'Lato', sans-serif",
                  whiteSpace: "nowrap",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = GOLDD)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = GOLD)
                }
              >
                {page.cta.label} →
              </Link>
            </div>
          </article>

     
        </div>

        {/* ── GUIDES FOOTER — replaces "Continue Reading" ── */}
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
    .lan-body-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 600px) {
    .lan-body-grid {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }
    .guides-footer-grid {
      grid-template-columns: 1fr 1fr !important;
    }
  }

  @media (max-width: 400px) {
    .guides-footer-grid {
      grid-template-columns: 1fr !important;
    }
  }

  ::selection {
    background: rgba(184,150,62,.25);
    color: #0d2244;
  }
`;