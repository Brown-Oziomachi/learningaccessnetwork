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
   PAGE CONTENT MAP  — All seller-focused, Africa-wide
═══════════════════════════════════════════════════════════════ */
const PAGES = {
    "seller-network": {
        badge: "Seller Network",
        badgeIcon: "🛒",
        category: "SELLER GUIDE",
        readTime: "10 min read",
        title: "The LAN Seller Network",
        subtitle:
            "Africa's largest academic document marketplace — open to every student, graduate, tutor, and knowledge creator who has something valuable to share.",
        hero: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80",
        intro: `The LAN Seller Network is the broadest participation tier on the platform — open to anyone across Africa who has created academic content worth sharing. You do not need to be a professor. You do not need an institutional affiliation. If you have notes, summaries, guides, past papers, study materials, or any academic content that other students would find useful, you can sell it on LAN.

Thousands of sellers across Nigeria, Ghana, Kenya, South Africa, Uganda, Tanzania, Rwanda, and a growing number of African countries are already generating consistent income from content they created as students, tutors, or independent educators. The Seller Network is the entry point for all of them — and for you.`,
        sections: [
            {
                heading: "What Is the LAN Seller Network?",
                body: `The LAN Seller Network is a verified community of document sellers serving the African student population. Unlike faculty-exclusive platforms, the Seller Network is intentionally broad: it accommodates final-year students selling their best notes, private tutors sharing structured study materials, professional exam coaches selling certification guides, independent educators creating original learning content, and graduates who accumulated exceptional academic resources during their studies.

What unites every member of the Seller Network is a commitment to quality and authenticity. LAN's review team examines every document before it goes live — checking that the content is original, accurate, relevant to the course or topic it claims to cover, and formatted in a way that serves students well. This quality filter is what makes LAN the most trusted academic document marketplace in Africa, and it is what allows sellers on the platform to charge meaningful prices and generate consistent income.

Every seller receives a public profile page, a personal document catalogue, a real-time earnings wallet, and access to the full suite of seller tools including analytics, pricing controls, and the <link slug="referral" text="referral programme" />. The network is the infrastructure that makes all of it work together.`,
            },
            {
                heading: "Who Can Sell on LAN?",
                body: `The Seller Network is open to any individual who has created original academic content and wants to monetise it. There are no educational prerequisites, no institutional affiliations required, and no minimum number of documents to list. What matters is that your content is original, accurate, and genuinely useful to the students who will buy it.

Current students at African universities and polytechnics are among the most active sellers on the platform. A final-year student who has developed exceptional notes over four years of study has accumulated substantial intellectual assets. Those notes, past papers, and summary guides do not lose value at graduation — they continue to serve incoming cohorts of students for years.

Private tutors and academic coaches form another major segment of the Seller Network. If you teach A-level mathematics, JAMB preparation, WAEC revision, professional accounting examinations, or any other structured academic topic, your teaching materials have commercial value on LAN. Students actively seek preparation materials from known coaches and tutors — your reputation in your local tutoring market translates directly into demand for your documents on the platform.

Independent content creators who produce original study guides, examination preparation packs, or subject-specific reference materials are equally welcome. If you have created something genuinely useful for African students, the Seller Network is built for you.`,
            },
            {
                heading: "What Can You Sell?",
                body: `The document catalogue on LAN spans the full range of academic content types relevant to African students. Lecture and class notes — structured summaries of course content organised by week or topic — are consistently among the highest-demand items on the platform. Past examination papers, both university-level and professional certification, are perennially high in demand particularly in the weeks before examination periods. Structured study guides and revision materials, especially those that break down complex topics into accessible summaries, perform extremely well.

Professional examination preparation materials are a particularly valuable category for sellers with relevant expertise. ACCA, ICAN, CIMA, CFA, bar examination guides, medical licensing preparation, and similar professional certification materials command premium prices because the professional stakes for buyers are high and quality preparation materials are scarce.

You can also sell language and writing guides, research methodology handbooks, project report templates, WAEC and JAMB preparation packs, secondary school revision materials, and vocational training guides. If it helps a student learn something or prepare for an examination, it belongs on LAN.

All content must be original — created by you or substantially developed by you. You cannot sell textbooks, journal articles, or other copyrighted third-party materials. <link slug="upload-document" text="The upload process" /> includes a content originality check as part of the review workflow.`,
            },
            {
                heading: "How Earnings Work for Sellers",
                body: `Sellers earn 80% of every transaction. The remaining 20% covers platform operations, payment processing infrastructure, student discovery tools, and the review team that maintains quality standards. There are no listing fees, no monthly subscriptions, and no minimum sales requirements to keep your account active.

Every sale credits your <link slug="lan-wallet" text="LAN wallet" /> immediately. There is no weekly payment cycle or holding period. When a student buys your document at any hour of any day, your wallet balance increases within seconds. <link slug="withdraw-earnings" text="Withdrawal to your bank account or mobile money wallet" /> is available at any time, with processing completed within 24 hours on business days across all supported African markets.

Our top sellers — a mix of prolific note-takers, professional tutors, and dedicated content creators — maintain catalogues of 30 to 150 documents and earn the equivalent of USD 300 to USD 1,500 per month in passive document sales. The key differentiator between modest and high income is almost always catalogue size and metadata quality, not content quality alone. A large, well-tagged catalogue in high-demand course categories generates income around the clock without any ongoing effort.`,
            },
            {
                heading: "How the Seller Network Supports Your Growth",
                body: `Joining the Seller Network is not just creating an account and uploading documents. It is joining a platform infrastructure designed to actively grow your income over time without requiring ongoing active effort from you.

LAN's search algorithm continuously surfaces your documents to students searching for relevant course materials. As your documents accumulate purchase history and buyer reviews, they rank progressively higher in search results — creating a compounding effect where early sales generate visibility that drives further sales. A document you upload today may take a few weeks to build its search ranking, but once established, it will continue generating income for years.

Your <link slug="seller-dashboard" text="Seller Dashboard" /> provides the analytics to understand what is working and what is not: which documents convert well, which courses are generating the most search traffic, where your buyers are located geographically, and what price points maximise your revenue. This data lets you make informed decisions about what to upload next and how to optimise your existing catalogue.

The <link slug="referral" text="referral programme" /> creates an additional income layer that many sellers underutilise. Every student you refer who makes a purchase, and every seller you introduce who lists and sells documents, generates an automatic commission credited to your wallet. For sellers with large social networks or active academic communities around them, referral income can meaningfully supplement document sales income.`,
            },
            {
                heading: "Seller Tiers and What They Unlock",
                body: `The Seller Network has four progressive tiers — Bronze, Silver, Gold, and Platinum — determined by your cumulative earnings, document catalogue quality, buyer review ratings, and account standing. Each tier upgrade unlocks tangible benefits that compound your earning potential.

Bronze is the entry tier for all new sellers. Bronze sellers have access to all core platform features — uploading, pricing, analytics, referrals, and withdrawals with a small flat fee. As your catalogue grows and sales accumulate, you progress automatically to Silver, which eliminates withdrawal fees and increases your document upload priority in the review queue.

Gold sellers receive priority review processing for new uploads, eligibility for Promoted Listings at discounted rates, and access to the platform's seasonal marketing campaigns that surface featured sellers to students during peak demand periods. Platinum sellers — the top tier of the Seller Network — receive dedicated account management, maximum priority across all platform systems, and invitation to LAN's exclusive content partnership programmes.

Tier progression is automatic — there is no application process. The platform continuously evaluates your account metrics and upgrades your tier as you meet the thresholds. Your tier is displayed on your public profile, serving as a quality signal to buyers about your track record on the platform.`,
            },
        ],
        cta: { label: "Join Seller Network", href: "/auth/signup" },
        related: [
            "upload-document",
            "seller-dashboard",
            "lan-wallet",
            "withdraw-earnings",
            "referral",
            "recharge-services",
        ],
        tags: ["Africa", "Sellers", "Passive Income", "Documents"],
    },

    "upload-document": {
        badge: "Upload Document",
        badgeIcon: "📤",
        category: "GETTING STARTED",
        readTime: "11 min read",
        title: "Upload Your Documents",
        subtitle:
            "One upload. Passive income. Here is everything you need to know to publish your first document and make it earn from day one.",
        hero: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&q=80",
        intro: `Uploading to LAN is the action that converts your academic work into a permanent income stream. Documents you created months or years ago — notes from your best semester, a study guide you built before a professional exam, a past paper collection you assembled for a course — continue generating income indefinitely once they are live on the platform.

This guide covers everything from accepted file formats and pricing strategy to metadata optimisation and what happens during the review process. The decisions you make at the moment of upload have a larger impact on your long-term earnings than almost anything else, so understanding them properly is worth the time.`,
        sections: [
            {
                heading: "Accepted File Formats and Which Perform Best",
                body: `LAN accepts a wide range of file types to accommodate the different tools and workflows that document creators use. PDF is the recommended format above all others. It renders consistently across every device — smartphone, tablet, laptop — preserves your original formatting, and carries the strongest trust signal with buyers. A student choosing between two similar documents will almost always prefer the PDF over a Word file.

Microsoft Word documents in .docx format are accepted and automatically converted to PDF during the review process. The conversion handles standard formatting well — headings, tables, body text, numbered lists — but complex multi-column layouts or documents using specialist fonts may not convert perfectly. If your content is in Word format, it is worth reviewing the conversion result in your pending uploads panel before the document goes live.

PowerPoint files in .pptx format are also accepted and converted to PDF. Image files in JPEG and PNG format are supported for handwritten notes, annotated diagrams, and physical study materials photographed for upload. ZIP archives can package multiple files together for course packs and multi-document bundles.

All uploaded files pass through LAN's document processing pipeline: quality checked for readability across device sizes, watermarked with invisible buyer-specific identifiers that allow attribution in cases of redistribution, reformatted to a consistent presentation template that displays your seller credentials, and scanned for content originality. Maximum file size is 500MB per upload, sufficient for even richly illustrated textbooks and comprehensive course packs.`,
            },
            {
                heading: "Setting the Right Price for Your Documents",
                body: `You set your own price. LAN imposes no minimum or maximum. You can adjust pricing at any time from your <link slug="seller-dashboard" text="Seller Dashboard" /> without resubmitting for review. This flexibility matters: many experienced sellers start at a lower price point to build purchase history and reviews quickly, then raise prices once a document has established its credibility with buyers.

Platform data across African markets reveals consistent pricing patterns that high-earning sellers have converged on through experience. Single-session past examination papers typically price between the equivalent of USD 1 and USD 3 — students buy them frequently and in multiples, so high volume at modest unit prices generates meaningful income. Comprehensive semester notes and structured study guides perform well between USD 3 and USD 10 depending on depth and subject. Professional certification preparation packs — ACCA, ICAN, CFA, bar examination guides, medical licensing materials — command USD 15 to USD 80 because the stakes for buyers are high and quality materials are scarce.

Currency display on LAN adapts automatically to the buyer's location. A student in Accra sees your price in Ghanaian Cedis. A student in Nairobi sees it in Kenyan Shillings. A student in Lagos sees Nigerian Naira. You set one price in the platform's base currency and LAN handles all conversion, display, and payment processing across every African market simultaneously. Your pricing decision applies continent-wide without any additional configuration.

Pricing strategy benefits from monitoring your document's conversion rate in the <link slug="seller-dashboard" text="analytics dashboard" />. High views with low purchases typically signals overpricing or a description that does not match the content. Low views with high conversion typically signals underpricing — buyers who find the document trust its value enough to buy. Both patterns are actionable with a price adjustment.`,
            },
            {
                heading: "Metadata: The Biggest Driver of Document Discovery",
                body: `Metadata is the single most impactful variable in how many students find and buy your document. A well-written, fairly priced document with poor metadata will earn a fraction of what an equivalent document with complete, precise metadata earns. This is not a marginal difference — documents with complete metadata receive four times more organic search traffic than documents with minimal tags.

The reason is simple: students search with specificity. They do not search for "economics notes." They search for "ECON 201 University of Ghana semester 1 2023 lecture notes." They search for "ACCA F7 past questions 2022 study guide." They search for "Civil Engineering 300 level exam solutions OAU." Your metadata fields are what make your document appear in those searches.

Required metadata includes the exact course code and full course title, the institution name and common abbreviation if the content is institution-specific, the subject area and academic discipline, the academic level and target student year, the document type, and the examination session or academic year if applicable. Optional fields that meaningfully improve discoverability include topic keywords, examination months, whether the document includes worked solutions, and the target examination or certification body.

Metadata is editable at any time from your dashboard without resubmitting for review. Many experienced sellers revisit their metadata periodically — particularly at the start of a new academic session — to add newly relevant course codes, update academic year tags, or optimise keyword coverage based on search traffic data visible in their analytics panel.`,
            },
            {
                heading: "The Review Process: What Happens After You Upload",
                body: `After submission, your document enters LAN's review queue. The review process is conducted by a dedicated content quality team who verify that your document delivers on what its title and description promise, that its metadata accurately describes the content and matches known course structures at the referenced institution, that file rendering is clean and readable across device sizes, and that the content is original and compliant with LAN's content policy.

Standard review turnaround is 24 to 48 hours for most documents. Gold and Platinum sellers receive priority review processing, typically completing within 6 to 12 hours. During active examination periods — the pre-examination weeks when student demand is highest and sellers are most motivated to publish quickly — priority processing can make a meaningful practical difference.

If a document is flagged during review, you receive specific feedback via email and in-app notification describing exactly what needs to be addressed. Common flags include mismatched metadata — for example, a course code that does not match the institution you listed — unclear file rendering at certain zoom levels, or a description that overstates the scope of the content. These are administrative issues resolved with a straightforward resubmission. No document is permanently rejected without giving you the opportunity to address the flagged concern.

Once approved, your document is immediately indexed in LAN's search system and discoverable by students. Sales data begins appearing in your <link slug="seller-dashboard" text="Seller Dashboard" /> from the moment of the first purchase.`,
            },
            {
                heading: "Building Course Packs and Bundles",
                body: `One of the most effective monetisation strategies available to established sellers is bundling related documents into course packs — collections of complementary materials sold together at a price that represents value to the buyer and a revenue premium to the seller compared to individual sales.

A typical high-performing course pack might bundle five years of past examination papers for a popular course alongside model answers and a revision summary. Or it might package a full semester's lecture notes with the corresponding tutorial sheets and a course outline. Students respond extremely well to course packs because they solve a discovery and assembly problem — instead of hunting for and separately purchasing five related documents, the student gets everything in one transaction.

From a revenue perspective, course packs increase your average transaction value significantly. A student who might have bought one or two documents at USD 3 each may purchase a pack priced at USD 12 that contains five documents — generating more revenue from a single transaction than multiple individual purchases would have.

Course packs are created from your Seller Dashboard after the component documents are individually live and approved. You define the bundle composition, set the bundle price independently of the individual document prices, and publish. The bundle appears in search results alongside individual listings, giving students multiple entry points into your catalogue.`,
            },
            {
                heading: "Managing Your Document Catalogue Over Time",
                body: `The documents you upload are not static inventory — they are living assets that benefit from active management. The sellers who generate the highest consistent income on LAN treat their catalogue as a managed portfolio: reviewing performance data regularly, optimising metadata, adjusting pricing in response to demand signals, and adding new documents strategically at peak demand moments.

You can update a document's title, description, price, metadata, and cover image at any time from your dashboard without any review process. These administrative changes are immediate. Updating the file content itself — uploading a corrected or revised version — requires a new review cycle, but version updates for existing documents are typically reviewed faster than first-time submissions.

Documents can be unpublished temporarily without being permanently deleted. This is useful for examination papers that are highly seasonal — demand spikes immediately before the examination date and drops after — or for materials you are planning to update and re-release. Unpublished documents retain all their historical purchase and review data, so reactivating them later does not require rebuilding their credibility from zero.

The most productive catalogue management activity is adding new documents consistently. Even two or three new documents per month compounds significantly over a year — a seller who adds three documents monthly has 36 additional earning assets after one year, each accumulating its own purchase history, reviews, and search ranking. The income growth from a consistently expanding catalogue is non-linear: each new document has a lower marginal cost than the previous one, but contributes equally to the income base.`,
            },
        ],
        cta: { label: "Start Uploading", href: "/auth/signup" },
        related: [
            "seller-network",
            "seller-dashboard",
            "lan-wallet",
            "withdraw-earnings",
            "referral",
            "recharge-services",
        ],
        tags: ["PDF", "Pricing", "Metadata", "Africa"],
    },

    "lan-wallet": {
        badge: "LAN Wallet",
        badgeIcon: "💼",
        category: "PAYMENTS GUIDE",
        readTime: "8 min read",
        title: "Your LAN Wallet",
        subtitle:
            "Your earnings hub — where every sale lands instantly, ready to withdraw, spend, or transfer across Africa.",
        hero: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&q=80",
        intro: `The LAN Wallet is the financial core of your seller account. Every naira, cedi, shilling, or rand equivalent you earn from document sales lands here immediately. Every referral commission is credited here. Every Bounty reward is deposited here. And from here, you can move your money out in any direction that suits you — bank transfer, mobile money, or direct utility payment through Recharge Services.

Understanding how the wallet works — how earnings are credited, what the available balance means, how transfers and spending work — is the foundation of managing your seller income effectively.`,
        sections: [
            {
                heading: "How Earnings Land in Your Wallet",
                body: `Every time a student purchases one of your documents, 80% of the transaction amount is credited to your LAN Wallet immediately. There is no processing delay, no weekly payment cycle, no end-of-month settlement. The credit happens within seconds of the buyer's payment being confirmed.

Your wallet displays two balance figures at all times: your total balance and your available balance. For most sellers at most times, these figures are identical. The distinction matters only in the rare case of an active buyer dispute — if a student initiates a dispute about a purchase, the corresponding amount is temporarily held from your available balance while the dispute is reviewed. Once resolved, the funds are either returned to your available balance or refunded to the buyer, depending on the dispute outcome. Disputes are uncommon and the resolution process is typically completed within 48 hours.

Your wallet also records earnings from the <link slug="referral" text="referral programme" /> — commissions for students you referred who made purchases, and commissions for sellers you referred who made their first sales. These referral credits are logged separately in your transaction ledger so you can always see exactly how much of your wallet balance came from document sales versus referral commissions versus any other income stream.`,
            },
            {
                heading: "Understanding Your Transaction Ledger",
                body: `The transaction ledger in your <link slug="seller-dashboard" text="Seller Dashboard" /> shows the complete financial history of your LAN account. Every credit and debit is logged with a timestamp, description, amount, and running balance. The ledger is updated in real time and is always accurate to the second.

Credit entries in your ledger include document sale payouts with the document title and buyer's approximate location, referral commissions with the referred user's account type, Bounty reward payouts, incoming peer-to-peer transfers from other LAN users, and any promotional credits or bonuses applied to your account.

Debit entries include withdrawal transfers to your bank account or mobile money wallet, <link slug="recharge-services" text="Recharge Services" /> payments for airtime, data, electricity, and cable TV, outgoing peer-to-peer transfers, and the platform fee component shown as context alongside each sale (the 20% that goes to LAN is shown for transparency, but is not deducted from your wallet — your wallet only ever receives the 80% payout, not the full transaction amount).

Your ledger can be filtered by date range, transaction type, and amount. For sellers managing their income across multiple income streams, these filters make reconciliation straightforward — you can isolate all document sale payouts for a given month in a single filtered view, for example, which makes income reporting simple.`,
            },
            {
                heading: "Transferring Between LAN Users",
                body: `The LAN Wallet supports peer-to-peer transfers between registered LAN accounts. This feature allows sellers to split earnings with collaborators who contributed to a document, send payment to other sellers for content licensing arrangements, and settle informal financial agreements within the LAN community.

To initiate a peer-to-peer transfer, navigate to the Transfer section of your Seller Dashboard. Enter the recipient's LAN account number or registered email address, specify the amount, confirm the recipient's details on the confirmation screen, and authenticate the transfer with your Transfer PIN. The recipient's wallet is credited immediately and both parties receive transaction notifications.

Transfer PIN authentication is required for all wallet outflows — withdrawals, recharge purchases, and peer-to-peer transfers. Your Transfer PIN is a 4-digit code set up separately from your account password during onboarding. If you have not set up a Transfer PIN, you will be prompted to do so before your first outflow transaction. The PIN can be reset at any time through the OTP process available in your account security settings.`,
            },
            {
                heading: "Wallet Security and Fraud Protection",
                body: `Your LAN Wallet is protected by multiple security layers designed to ensure that only you can access and spend your funds. Account-level authentication — your email and password — controls access to the platform and dashboard. Transaction-level authentication — your 4-digit Transfer PIN — is required for every outflow transaction regardless of amount. These two independent authentication layers mean that even if your account password were somehow compromised, a bad actor could not access your wallet funds without also knowing your Transfer PIN.

LAN's fraud monitoring system continuously analyses transaction patterns for anomalies. Unusually large withdrawals, transfers to new recipient accounts, or transaction volumes significantly above your account's historical baseline may trigger a brief additional verification step. This is not a penalty or restriction — it is an automated protection mechanism. The verification step is typically a simple OTP confirmation sent to your registered email or phone number.

If you believe your account has been accessed without your authorisation, contact LAN Support immediately through your dashboard. The support team can place an immediate hold on all outflows while the security incident is investigated. Sellers who report suspicious activity promptly have consistently recovered their full account security with no loss of funds in LAN's operating history.`,
            },
            {
                heading: "Wallet Balances Across African Currencies",
                body: `Your LAN Wallet stores your balance in the platform's base currency, but the dashboard displays your balance in the local currency you have selected — or automatically defaults to your account's registered country currency. You can switch your display currency at any time from the dashboard header without affecting your actual balance or any pending transactions.

Supported display currencies include Nigerian Naira, Ghanaian Cedi, Kenyan Shilling, South African Rand, Ugandan Shilling, Tanzanian Shilling, Rwandan Franc, Ethiopian Birr, Egyptian Pound, Moroccan Dirham, and several additional African currencies. Display conversion uses estimated exchange rates updated periodically — these are for display purposes only. Your actual payout amount when you <link slug="withdraw-earnings" text="withdraw" /> is determined by the exchange rate applied at the time of the transfer, as published in your withdrawal confirmation.

This multi-currency display is particularly useful for sellers who travel between African countries or who have buyers across multiple markets. Seeing your balance in a familiar currency denomination helps with financial planning without requiring you to maintain separate accounts or manage complex currency conversions manually.`,
            },
            {
                heading: "Using Your Wallet for Everyday Spending",
                body: `Your LAN Wallet is not just a holding account for funds waiting to be withdrawn to a bank. It is an active spending tool you can use for everyday utility payments without initiating a bank transfer. <link slug="recharge-services" text="LAN Recharge Services" /> allow you to pay for airtime, mobile data bundles, electricity prepaid tokens, and cable television subscriptions directly from your wallet balance across major African providers.

Recharge Services transactions debit your wallet immediately and process the utility payment in real time — airtime within 30 seconds, data within 60 seconds, electricity tokens within 2 minutes, cable TV renewals within 3 minutes. There are no recharge service fees, and mobile data bundles are available at SME wholesale rates that are typically 30 to 40% cheaper than buying directly from the network's consumer channel.

For sellers whose monthly document income covers their regular utility costs, using Recharge Services to pay those bills directly eliminates the need to withdraw that portion of their income — saving the withdrawal processing time and, for Bronze-tier sellers, the small withdrawal fee. Many established sellers use a hybrid approach: withdrawing their net savings to their bank account at the end of the month while using their wallet for recurring utility payments throughout the month.`,
            },
        ],
        cta: { label: "Go to Wallet", href: "/home/wallet" },
        related: [
            "withdraw-earnings",
            "seller-dashboard",
            "recharge-services",
            "referral",
            "upload-document",
            "seller-network",
        ],
        tags: ["Wallet", "Earnings", "Security", "Africa"],
    },

    "withdraw-earnings": {
        badge: "Withdraw Earnings",
        badgeIcon: "🏦",
        category: "PAYMENTS GUIDE",
        readTime: "8 min read",
        title: "Withdraw Your Earnings",
        subtitle:
            "Your money. Your account. Bank transfers and mobile money across Africa — processed within 24 hours.",
        hero: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1400&q=80",
        intro: `The LAN withdrawal system was built to serve the financial reality of African sellers — not the assumption of a single banking system. A seller in Lagos withdrawing to a Nigerian bank account, a seller in Accra using MTN Mobile Money, a seller in Nairobi transferring to M-Pesa, a seller in Johannesburg receiving funds at a South African commercial bank: all of these are first-class, equally supported withdrawal experiences on LAN.

The money in your wallet is yours, and moving it to wherever you need it should be fast, transparent, and as close to fee-free as your seller tier allows.`,
        sections: [
            {
                heading: "How to Initiate a Withdrawal",
                body: `Withdrawals are initiated from the Wallet section of your <link slug="seller-dashboard" text="Seller Dashboard" />. The process is designed to complete in under 60 seconds once you have a bank account or mobile money number linked.

Open your dashboard and navigate to Wallet, then select Withdraw Earnings. Enter the amount you want to withdraw — the minimum is the equivalent of USD 2.50 in your local currency. Confirm your linked account details on the preview screen, then authenticate the withdrawal with your 4-digit Transfer PIN. You receive an immediate in-app notification confirming the request, and a second notification when the transfer is complete.

If you have not yet linked a bank account or mobile money number, you will be prompted to add one before your first withdrawal. You can link up to three accounts and specify which one receives each withdrawal. Switching between linked accounts is available on the withdrawal confirmation screen without requiring a settings change.`,
            },
            {
                heading: "Supported Withdrawal Methods Across Africa",
                body: `LAN supports a comprehensive and expanding range of withdrawal channels across the continent. The coverage reflects how African sellers actually manage their finances — a mix of traditional banking, mobile money, and fintech accounts that varies significantly by country.

In Nigeria, all major commercial banks are supported including Access Bank, GTBank, Zenith Bank, First Bank, UBA, Stanbic IBTC, Fidelity Bank, Sterling Bank, Polaris Bank, and Wema Bank. Fintech accounts including Kuda, Opay, PalmPay, and Moniepoint are fully supported with processing times equivalent to traditional bank accounts.

In Ghana, withdrawals process to major commercial banks including GCB Bank, Ecobank Ghana, Stanbic Ghana, Absa Ghana, and Standard Chartered Ghana. Mobile money withdrawals to MTN MoMo, Vodafone Cash, and AirtelTigo Money are available with near-instant processing. In Kenya, M-Pesa withdrawals are fully supported alongside Equity Bank, KCB, Cooperative Bank, and other major commercial institutions. In Uganda and Tanzania, MTN Mobile Money and major commercial banks are supported.

In South Africa, all major commercial banks including Standard Bank, ABSA, FNB, Nedbank, and Capitec are supported. For sellers in other African countries not yet listed, contact LAN Support through your dashboard — new withdrawal corridors are added regularly based on seller demand, and the support team can advise on the current status of your country.`,
            },
            {
                heading: "Withdrawal Fees by Seller Tier",
                body: `Withdrawal fees on LAN decrease as your seller tier increases — a direct reward for the performance and commitment that higher-tier sellers demonstrate. Your tier is determined automatically by your cumulative earnings, catalogue quality, and buyer review ratings.

Bronze sellers — new and early-stage sellers — pay a flat fee equivalent to USD 0.10 per withdrawal. This fee is fixed regardless of the withdrawal amount, so it represents a smaller proportion of larger withdrawals. Silver sellers enjoy zero withdrawal fees, making every withdrawal entirely cost-free. Gold sellers receive zero fees with priority same-business-day processing. Platinum sellers — the network's highest tier — receive zero fees with near-instant transfer, typically completing within minutes of request.

There are no hidden charges beyond the tier-applicable flat fee. No currency conversion margins on top of published rates. No minimum balance requirements. What your wallet displays as available balance is what arrives in your account, minus only the applicable tier fee. The fee structure is always visible on the withdrawal confirmation screen before you submit the request.`,
            },
            {
                heading: "How Long Do Withdrawals Take?",
                body: `The published withdrawal guarantee is 24 hours for standard processing. In practice, most withdrawals complete considerably faster. Nigerian bank accounts typically receive transfers within 4 to 8 hours on business days. Ghana and Kenya mobile money accounts typically process within 1 to 3 hours. South African bank accounts process within the standard interbank transfer window of 1 to 3 business hours.

Factors that can extend processing time beyond the standard window include public holidays in your country, where bank system limitations impose delays regardless of LAN's processing speed. Very large withdrawals — above the equivalent of USD 5,000 in a single transaction — may trigger a brief compliance verification step that typically takes under 2 hours. Withdrawals to newly added bank accounts or mobile money numbers require additional verification for the first transfer, adding a small delay to protect against fraud.

If your withdrawal has not arrived within 24 hours, contact LAN Support through your <link slug="seller-dashboard" text="dashboard" />. The team has a 2-business-hour resolution commitment for withdrawal issues and can investigate the transfer status, re-process failed transfers, or initiate a manual credit in cases where a technical failure has occurred.`,
            },
            {
                heading: "Withdrawal Limits and High-Value Transfers",
                body: `The minimum withdrawal amount is the equivalent of USD 2.50 in your local currency. There is no maximum withdrawal limit for Silver, Gold, and Platinum sellers. Bronze sellers have a daily withdrawal limit of the equivalent of USD 1,200 which resets every 24 hours — this limit is not typically reached by early-stage sellers but can be raised by contacting support if your income growth requires it.

For single-transaction withdrawals above the equivalent of USD 5,000 — which primarily applies to Gold and Platinum sellers with substantial monthly catalogue income — LAN's compliance team conducts a brief identity confirmation before processing. This involves no new documentation if your account is already verified with standard KYC credentials. The confirmation step typically completes within 2 hours of submission.

Sellers who regularly withdraw large amounts are encouraged to contact the seller support team to establish an expedited processing arrangement. Gold and Platinum sellers can be assigned a dedicated account relationship contact who facilitates priority processing for high-value withdrawals and can answer questions about withdrawal optimisation for your specific location and bank.`,
            },
            {
                heading: "Alternatives to Withdrawing: Recharge Services",
                body: `Not all of your wallet income needs to flow through a bank transfer. For everyday utility expenses, <link slug="recharge-services" text="LAN Recharge Services" /> allow you to spend your document earnings directly on mobile airtime, data bundles, electricity prepaid tokens, and cable television subscriptions — with no withdrawal fee and at rates that are often more competitive than retail purchase channels.

Mobile data through Recharge Services is available at wholesale SME rates — typically 30 to 40% cheaper than buying the same bundle directly from the network. Airtime is available at face value with no markup. Electricity and cable TV are processed at published official rates with no LAN service charge added.

A practical example: a seller who earns the equivalent of USD 30 per month in document income might spend USD 8 of that on data, USD 4 on airtime, and USD 5 on electricity through Recharge Services — handling USD 17 of their monthly utility costs from their wallet — and withdraw the remaining USD 13 to their bank account. Compared to withdrawing the full USD 30 and then purchasing utilities separately, this approach saves the withdrawal fee on USD 17 of spending and often saves 30 to 40% on the data cost specifically.`,
            },
        ],
        cta: { label: "Go to Wallet", href: "/home/wallet" },
        related: [
            "lan-wallet",
            "seller-dashboard",
            "recharge-services",
            "seller-network",
            "upload-document",
            "referral",
        ],
        tags: ["Bank Transfer", "Mobile Money", "Africa", "Fees"],
    },

    referral: {
        badge: "Referral Programme",
        badgeIcon: "🔗",
        category: "EARN MORE",
        readTime: "9 min read",
        title: "Referral Programme",
        subtitle:
            "Earn commissions every time someone you introduce joins LAN — as a buyer, a seller, or a verified faculty member.",
        hero: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80",
        intro: `The LAN Referral Programme turns your social network into a passive income stream that runs alongside your document sales. Every student you refer who makes a purchase, every seller you introduce who uploads and sells, and every faculty member you bring to the platform who verifies and sells — all generate automatic commissions credited to your wallet with no action required after the initial introduction.

For sellers who are active in academic communities — university WhatsApp groups, student forums, tutoring circles, departmental networks — the referral programme can generate income that rivals or exceeds their document sales income. The mechanics are straightforward and the upside is uncapped.`,
        sections: [
            {
                heading: "How the Referral System Works",
                body: `Every LAN account is assigned a unique referral link and referral code at the moment of account creation. Your referral link is a standard URL. When someone visits that link and creates a new LAN account, they are permanently attributed to you in the referral system.

The attribution is durable — it does not expire and cannot be overwritten. A student you referred six months ago who finally makes their first purchase today generates your referral commission today. A seller you referred who uploads their first document and makes their first sale three weeks after joining generates your commission at the moment of that first sale.

Share your referral link through any channel that reaches people who might benefit from LAN: WhatsApp groups, student Telegram channels, academic Facebook pages, university subreddits, email threads, in-person conversations, or your social media profiles. The link works identically regardless of sharing channel, and there is no limit on how many people can use it.`,
            },
            {
                heading: "Commission Rates for Every Referral Type",
                body: `Referral commissions are structured around the type of user you refer and the qualifying action that triggers your payment.

Referring a student buyer who makes their first document purchase earns you a flat commission equivalent to approximately USD 0.50. Student buyers are the most numerous and fastest-converting referral type — a message in an active student WhatsApp group can generate multiple conversions within hours. The individual commission is modest, but volume makes this a significant income stream for sellers with large academic networks.

Referring a new document seller who uploads their first document and completes their first sale earns you approximately USD 1.25. Document sellers are more engaged platform participants than casual buyers, and the commission reflects that value.

Referring a new faculty member who completes <link slug="seller-network" text="Faculty Verification" /> and makes their first document sale earns the highest base commission — approximately USD 2.50. Verified faculty members generate large, consistent document income and long-term buyer traffic. Your referral commission reflects the significant lifetime value you contribute by bringing them to the platform.

Volume bonuses apply on a monthly cycle. Referring ten or more people in a calendar month — any combination of buyer, seller, and faculty referrals — earns an additional bonus equivalent to approximately USD 12.50 paid at month end. Top referrers who consistently exceed the volume threshold earn the monthly bonus on top of their individual referral commissions every month.`,
            },
            {
                heading: "Finding and Sharing Your Referral Link",
                body: `Your referral link is always accessible from three locations in the platform. The primary location is your <link slug="seller-dashboard" text="Seller Dashboard" /> under the Referral Programme tab, where your full referral link and referral code are displayed with one-click copy buttons. Your profile settings page also shows both. In the LAN mobile app, the Referral Programme entry in the main menu provides your link with a built-in sharing interface integrated with WhatsApp, email, and your device's native sharing sheet.

You can generate a custom referral code that is easier to communicate verbally or in written form — for example, TUTOR-KWAME or ACCRA-PREP — rather than sharing a raw URL. Custom codes are particularly useful when promoting LAN in contexts where a URL would look awkward, such as in spoken recommendations, on a whiteboard during a tutoring session, or in a short social media caption.

Including your referral code in your standard communications — your tutoring WhatsApp message template, your social media bio, your email signature — creates passive referral generation. Once it is in place, every interaction you have through those channels is a potential referral without any additional effort.`,
            },
            {
                heading: "Tracking Referrals and Conversions in Real Time",
                body: `Your Referral Dashboard shows a complete picture of every referral you have made and every commission you have earned. The dashboard displays your total referred users broken down by type (buyer, seller, faculty), referrals who have signed up but not yet taken a qualifying action (pending), referrals who have converted (active with commission paid), total referral commission earned to date, your current month referral count relative to the volume bonus threshold, and your position on the monthly referral leaderboard.

All data is updated in real time. You receive an in-app notification every time a referred user takes a qualifying action — a student you referred makes their first purchase, a seller you referred completes their first sale. The corresponding commission appears in your wallet transaction ledger simultaneously.

The pending referrals list is particularly actionable for motivated referrers. It shows you which referred accounts have been created but not yet converted. For a friend who signed up after your recommendation but has not yet uploaded or purchased anything, a follow-up message is often all that is needed. You are in the best position to follow up because you have the personal relationship — the platform does not contact pending referrals on your behalf.`,
            },
            {
                heading: "Referral Strategies That Work for Sellers",
                body: `The most effective referral strategies for LAN sellers leverage the academic communities they are already part of. The highest-converting channels are almost always existing WhatsApp groups and Telegram channels where the members are active students with immediate academic needs.

The most effective referral message is specific rather than generic. Instead of "join this platform," a message that says "I have past papers for GST 212 at LASU on LAN — here is my link if you want to check it out" converts at a much higher rate. You are simultaneously referencing content relevant to the recipient, demonstrating that you personally use the platform, and providing the referral link in context. This approach takes 30 seconds to craft and dramatically outperforms generic platform promotion.

For sellers who are also tutors, mentioning LAN during sessions as a resource for past papers and study guides — and providing your referral code to students who ask — converts at very high rates because the student is in a learning context and has an immediate, relevant need. For sellers in university contexts, sharing your profile link (rather than just the generic referral link) at the start of examination season when students are actively searching for study materials creates a natural, high-conversion referral flow.`,
            },
            {
                heading: "Is There a Limit on What You Can Earn?",
                body: `There is no cap on referral earnings and no maximum number of referrals. The programme is designed to scale with the size of your network and the depth of your academic community engagement. There is also no expiry on your referral link — it remains active and attributing new sign-ups to your account indefinitely.

Top-performing referrers in the Seller Network generate the equivalent of USD 80 to USD 250 per month in referral commissions alone, entirely separate from their passive document income. These are typically sellers embedded in large active academic communities — popular tutors, student leaders, academic content creators with substantial followings — who created a single system for referral sharing and let it run passively.

Your referral income stacks with every other income stream on the platform. Document sales, referral commissions, and Bounty rewards all flow to the same <link slug="lan-wallet" text="LAN Wallet" /> and are equally available for <link slug="withdraw-earnings" text="withdrawal" /> or <link slug="recharge-services" text="Recharge Services" /> spending. There is no administrative separation between income types — your wallet is your wallet, and every source of income contributes to the same balance.`,
            },
        ],
        cta: { label: "Get Your Referral Link", href: "/ref/invite-friends" },
        related: [
            "seller-network",
            "withdraw-earnings",
            "seller-dashboard",
            "lan-wallet",
            "upload-document",
            "recharge-services",
        ],
        tags: ["Commission", "Community", "Africa", "Passive Income"],
    },

    "seller-dashboard": {
        badge: "Seller Dashboard",
        badgeIcon: "📊",
        category: "PLATFORM GUIDE",
        readTime: "9 min read",
        title: "Your Seller Dashboard",
        subtitle:
            "Real-time earnings, per-document analytics, catalogue management, and full financial control — all from one screen.",
        hero: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80",
        intro: `The LAN Seller Dashboard is your complete command centre for managing your document business on the platform. Every sale, every document view, every referral conversion, every withdrawal, and every item in your catalogue is tracked, displayed, and actionable from a single interface that updates in real time.

The sellers who generate the highest consistent income on LAN are not always those with the best content — they are those who understand their performance data and act on it. The dashboard is what makes that possible.`,
        sections: [
            {
                heading: "Earnings Overview: Reading Your Numbers",
                body: `The earnings overview panel is the first thing you see when you open your profile. At the summary level, it shows your total lifetime earnings, your current month earnings with a trend line by day, your available wallet balance ready for withdrawal, and your projected month-end earnings based on current-month trajectory.

Beneath the summary panel, a revenue chart breaks down earnings by document, by buyer institution or location, and by time period. You can switch between weekly, monthly, quarterly, and annual views. The chart answers the questions sellers ask most often: which documents are generating the most revenue, where buyers are coming from geographically, and whether income is trending up or plateauing.

Every sale generates an immediate credit entry in your transaction ledger — the document title, the buyer's approximate region, the transaction amount, and your 80% payout are all recorded and visible. The ledger can be filtered and exported, making it straightforward to reconcile your LAN income with your broader personal financial records.`,
            },
            {
                heading: "Per-Document Analytics: Finding What Works",
                body: `The document performance panel is where you identify your best performers and diagnose your underperformers. For every document in your catalogue, the dashboard shows total views since listing, total purchases, conversion rate (views-to-purchases percentage), total revenue generated, average buyer rating, and a trend indicator showing whether the document's performance is improving or declining over the past 30 days.

Conversion rate is the most actionable metric in this panel. A document receiving many views but few purchases is signalling something — most commonly overpricing, a description that overpromises relative to the content, or a cover image and preview that do not reflect the document quality. A document with moderate views and high conversion is performing efficiently and may be a candidate for increased visibility through a Promoted Listing.

View data updates in real time. Every time a student opens your document's listing page and reads the description or preview, that view is recorded. Understanding the ratio between preview engagement and purchase conversion is the most direct insight available into how students perceive the value of your specific documents — and it is directly actionable through pricing, description, and metadata adjustments.`,
            },
            {
                heading: "Managing Your Document Catalogue",
                body: `The catalogue panel gives you complete administrative control over every document you have <link slug="upload-document" text="uploaded" />. Documents are shown with their live status, performance summary, and a contextual action menu for common tasks.

Individual document actions available from the catalogue panel include editing the title, description, price, metadata, and cover image — all without triggering a new review cycle. File version updates — replacing the document file itself — require a new review, but these are processed faster than first-time submissions for established documents.

Bulk catalogue actions allow you to reprice multiple documents simultaneously, apply consistent metadata updates across a category of documents, bundle multiple documents into a course pack, and temporarily unpublish documents that are undergoing revision. Bulk actions are particularly useful at the start of a new academic session when updating academic year tags across your entire catalogue or adjusting prices to reflect new demand data.

Promoted Listing applications are also managed from the catalogue panel. A Promoted Listing increases your document's visibility in search results for its tagged course codes and subjects, surfacing it above standard organic results for students searching those terms. Promoted Listings are particularly effective during peak examination periods when search volumes spike and competition for student attention is highest.`,
            },
            {
                heading: "Referral Dashboard and Commission Tracking",
                body: `Your Seller Dashboard includes a dedicated <link slug="referral" text="Referral Programme" /> panel that tracks every referral you have made and every commission you have earned. The panel shows your referred user count by type, your conversion rate (the percentage of referred sign-ups who make a qualifying purchase or upload), total referral commission earned, and your position on the monthly referral leaderboard.

The pending referrals list — sign-ups attributed to your referral link who have not yet converted — is visible here and updated in real time. This list is useful for sellers who actively follow up with referred contacts. Seeing which friends or colleagues signed up but have not yet purchased or uploaded gives you specific, targeted information for personal follow-up.

Referral commissions are displayed in your wallet transaction ledger alongside document sale payouts, so your complete income picture is always visible in one place. The referral panel provides the breakdown by referral type; the wallet panel shows the aggregated credits.`,
            },
            {
                heading: "Withdrawal and Wallet Management",
                body: `The wallet panel in your Seller Dashboard is the financial control layer of your account. From here you can initiate <link slug="withdraw-earnings" text="withdrawals" /> to your linked bank account or mobile money wallet, view your pending and available balance, access your full transaction history with filtering options, manage your linked bank accounts and mobile money numbers, and access <link slug="recharge-services" text="Recharge Services" /> for direct utility payments from your wallet balance.

The wallet panel also shows your seller tier — Bronze, Silver, Gold, or Platinum — and the withdrawal fee applicable to your current tier. As your tier advances, the fee decreases and processing speed increases. The panel shows you the metrics contributing to your tier status and how close you are to the next tier threshold, giving you a clear view of what additional performance would unlock improved terms.

Withdrawal history is displayed with full detail: the amount, the receiving account, the processing status, the reference number, and any admin notes. For sellers managing their income as a formal business, this transaction history is the source of truth for income documentation.`,
            },
            {
                heading: "Notifications and Account Health",
                body: `The notification centre in your Seller Dashboard surfaces every platform event relevant to your account in real time. Sale notifications appear immediately when a purchase is made. Review notifications arrive when a buyer leaves a rating or written review on one of your documents. Upload status notifications inform you when a document completes review and goes live, or when a document is flagged with feedback requiring your attention.

Account health indicators surface any situations requiring your attention — a document flagged during a periodic quality audit, a buyer dispute requiring your response, a bank account detail that needs verification before the next withdrawal, or a referral link that has been flagged for misuse. These indicators are shown prominently on the dashboard home screen so you do not miss anything time-sensitive.

The dashboard is available as a mobile-responsive web interface accessible from any smartphone browser without requiring the LAN app to be installed. Sellers who monitor their dashboard regularly — particularly during active examination periods when document demand is highest — consistently outperform those who check in infrequently, because they can respond to performance signals faster and take advantage of peak demand windows with timely price adjustments and new uploads.`,
            },
        ],
        cta: { label: "Access Your Dashboard", href: "/home/seller-dashboard" },
        related: [
            "upload-document",
            "lan-wallet",
            "withdraw-earnings",
            "seller-network",
            "referral",
            "recharge-services",
        ],
        tags: ["Analytics", "Earnings", "Catalogue", "Real-time"],
    },

    "recharge-services": {
        badge: "Recharge Services",
        badgeIcon: "⚡",
        category: "PLATFORM FEATURE",
        readTime: "7 min read",
        title: "Recharge Services",
        subtitle:
            "Convert your document earnings into everyday utilities — airtime, data, electricity, and cable TV — directly from your wallet, across Africa.",
        hero: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80",
        intro: `LAN Recharge Services turns your wallet into a direct payment channel for the utilities you use every day. Instead of withdrawing your document income to a bank account and then separately purchasing airtime or paying your electricity bill, Recharge Services lets you do both in a single platform — at rates that are often more competitive than retail alternatives.

For sellers who want to extract maximum value from their earnings without the friction of multiple transfers, Recharge Services is the most direct path from document sale to real-world value.`,
        sections: [
            {
                heading: "What You Can Pay For",
                body: `LAN Recharge currently supports four major utility categories across a growing number of African countries.

Airtime top-ups are available for MTN, Airtel, Glo, and 9mobile in Nigeria; MTN, AirtelTigo, and Vodafone in Ghana; Safaricom, Airtel Kenya, and Telkom in Kenya; MTN Uganda and Airtel Uganda; and additional networks in Tanzania, Rwanda, South Africa, and other supported markets. Top-ups are available from the equivalent of USD 0.10 with no minimum and no service markup.

Mobile data bundles are available at SME wholesale rates across all supported airtime networks. These are the same rates used by fintech platforms and VAS resellers — typically 30 to 40% cheaper than buying the equivalent data bundle directly through the network's consumer app or USSD channel. Bundles are available in daily, weekly, and monthly configurations.

Electricity prepaid meter top-ups are supported for all major Nigerian DISCO regions (IKEDC, EKEDC, AEDC, PHEDC, EEDC, IBEDC, JED, KEDC, KAEDCO, and YEDC), Kenya Power prepaid meters, and ECG meters in Ghana. Additional electricity providers are being added as coverage expands.

Cable television renewals are processed for DSTV, GOTV, and Startimes across all supported markets. School fees and institutional levies for participating institutions are also available, with the list of participating institutions expanding regularly.`,
            },
            {
                heading: "How to Make a Recharge Payment",
                body: `Recharge payments are funded entirely from your LAN wallet balance — the same wallet that receives your document sales income and referral commissions. There is no card to enter, no bank transfer to initiate, and no third-party payment app to open.

To make a payment, go to your <link slug="seller-dashboard" text="Seller Dashboard" /> and open the Recharge Services panel — or access it directly from the Quick Recharge shortcut on your dashboard home screen. Select the service you want to pay for, enter the relevant identifier (phone number for airtime and data, prepaid meter number for electricity, smartcard number for cable TV), select the bundle or amount, review the transaction summary, and confirm.

The full process from opening the Recharge panel to a confirmed transaction takes under 30 seconds in most cases. Standard session authentication covers all recharge transactions below the equivalent of USD 50 — no additional PIN or OTP is required for routine utility purchases within that threshold.`,
            },
            {
                heading: "Pricing: How Recharge Rates Compare",
                body: `Data bundle rates through LAN Recharge use the same SME wholesale pricing available to fintech platforms and VAS resellers across Africa. For Nigerian sellers purchasing MTN or Airtel data, this typically means 30 to 40% savings compared to buying through the network's MyMTN app or AirtelTigo self-care portal. Similar savings apply to Ghanaian and Kenyan network data.

Airtime is available at face value — one unit of wallet balance purchases one unit of airtime on the selected network. This is the standard practice for established fintech platforms and represents no markup over face value.

Electricity top-ups and cable television renewals are processed at the published official tariff rates of the respective providers. LAN adds no margin on top of these official rates and charges no Recharge service fee for any category. The only cost of a Recharge transaction is the face value of what you are purchasing.

When you compare Recharge Services data costs against retail network rates, the savings on a monthly basis can be meaningful — particularly for sellers who consume significant mobile data for content creation, research, or communication. Using your document income to pay for data at wholesale rates effectively gives you a discount on a regular operating expense.`,
            },
            {
                heading: "Processing Speed and What Happens if a Transaction Fails",
                body: `All Recharge transactions are processed in real time with guaranteed delivery timelines. Airtime reaches your phone within 30 seconds of a confirmed transaction. Data bundle activation completes within 60 seconds. Electricity tokens are delivered within 2 minutes — displayed on screen, sent to your registered email, and also accessible in your transaction history for easy re-entry at the meter. Cable TV subscription renewals process within 3 minutes.

LAN maintains direct API integrations with all supported providers rather than routing through third-party VAS intermediaries. This direct integration significantly reduces failure rates and processing delays compared to consumer-facing alternatives that rely on intermediary networks.

If a transaction fails — due to a temporary provider outage, a network connectivity issue, or an invalid account identifier — your wallet balance is automatically refunded within 10 minutes. You receive an in-app notification confirming the refund, and no manual claim process is required. The notification includes the specific reason for the failure — incorrect meter number, provider system unavailable, invalid smartcard number — so you can address the issue and retry immediately if appropriate.`,
            },
            {
                heading: "Recharge vs. Withdrawal: A Practical Comparison",
                body: `The choice between using Recharge Services and initiating a bank <link slug="withdraw-earnings" text="withdrawal" /> to cover your utility costs is a practical financial calculation that most sellers settle into naturally based on their spending patterns.

Recharge makes more sense when the specific utility is available on the platform, the amount is relatively small (making a separate bank transfer disproportionate), and you want immediate real-world value from your earnings without any transfer delay. The additional advantage for Bronze-tier sellers is that each Recharge transaction avoids the flat withdrawal fee — using USD 10 of wallet balance on data through Recharge costs exactly USD 10, while withdrawing USD 10 and then purchasing data separately costs USD 10.10 plus the retail markup on the data.

A withdrawal makes more sense when you want to consolidate your earnings into your bank account for budgeting purposes, when the amount is large relative to what you can spend on utilities, or when you have a specific purchase that is not available through Recharge Services.

Many established sellers use both in combination: a scheduled monthly withdrawal for the bulk of their earnings, with Recharge Services handling recurring utility bills throughout the month as they come due. This hybrid approach minimises total withdrawal fee exposure while maintaining a single clear bank transfer each month for financial planning purposes.`,
            },
            {
                heading: "Countries and Providers Currently Supported",
                body: `Recharge Services coverage is growing continuously. The current supported provider list is most comprehensive for Nigeria, Ghana, and Kenya — reflecting the largest concentrations of LAN sellers in those markets. South Africa, Uganda, Tanzania, and Rwanda have growing but more limited coverage.

For Nigerian sellers, all four major mobile networks (MTN, Airtel, Glo, 9mobile) and all major DISCO electricity regions are supported. For Ghanaian sellers, all three major networks and ECG electricity are supported. For Kenyan sellers, Safaricom (including M-Pesa airtime top-up), Airtel Kenya, and Kenya Power are supported.

If your country or provider is not yet listed, the most effective way to accelerate its addition is to contact LAN Support through your <link slug="seller-dashboard" text="dashboard" /> and express your interest. Provider additions are prioritised based on demonstrated seller demand — multiple requests for the same provider or country significantly accelerate the timeline for that addition. The support team can also advise on the current timeline for specific provider additions you are waiting for.`,
            },
        ],
        cta: { label: "Go to Recharge", href: "/home/recharge" },
        related: [
            "withdraw-earnings",
            "lan-wallet",
            "seller-dashboard",
            "referral",
            "upload-document",
            "seller-network",
        ],
        tags: ["Airtime", "Data", "Electricity", "Africa"],
    },
};

/* ─── Related meta ─────────────────────────────────────────── */
const RELATED_META = {
    "seller-network": {
        label: "Seller Network",
        icon: "🛒",
        desc: "Join Africa's largest academic document marketplace",
    },
    "upload-document": {
        label: "Upload Document",
        icon: "📤",
        desc: "Turn your notes into passive income",
    },
    "lan-wallet": {
        label: "LAN Wallet",
        icon: "💼",
        desc: "Your earnings hub — instant credits, instant spending",
    },
    "withdraw-earnings": {
        label: "Withdraw Earnings",
        icon: "🏦",
        desc: "Bank and mobile money across Africa",
    },
    referral: {
        label: "Referral Programme",
        icon: "🔗",
        desc: "Earn commissions for every person you bring in",
    },
    "seller-dashboard": {
        label: "Seller Dashboard",
        icon: "📊",
        desc: "Real-time analytics and catalogue control",
    },
    "recharge-services": {
        label: "Recharge Services",
        icon: "⚡",
        desc: "Pay utilities directly from your wallet",
    },
};

/* ─── Parse inline link syntax ─────────────────────────────── */
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
                        href={`/seller/${p.slug}`}
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
                boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.3)" : "none",
                transition: "box-shadow .2s",
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
                    href="/seller/seller-network"
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
                    Seller Hub
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
                    Start Selling
                </Link>
            </div>
        </nav>
    );
}

/* ─── TOC item ──────────────────────────────────────────────── */
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
                href="/seller/seller-network"
                style={{
                    color: GOLD,
                    fontFamily: "'Lato', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                }}
            >
                ← Back to Seller Hub
            </Link>
        </div>
    );
}

/* ─── Guides Footer ─────────────────────────────────────────── */
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
                            Seller Guides
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
                        href="/seller/network"
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: GOLD,
                            fontFamily: "'Lato', sans-serif",
                            textDecoration: "none",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                        }}
                    >
                        View All Guides →
                    </Link>
                </div>

                {/* Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
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
                                href={`/seller/${slug}`}
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
                            href="/seller/seller-network"
                            style={{
                                fontSize: 11,
                                color: "rgba(245,240,232,.4)",
                                fontFamily: "'Lato', sans-serif",
                                textDecoration: "none",
                                fontWeight: 600,
                            }}
                        >
                            Seller Hub
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
                            Start Selling →
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
export default function SellerSlugPage() {
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
                <div
                    style={{ borderBottom: `1px solid ${BORDER}`, background: "#fff" }}
                >
                    <div
                        style={{
                            maxWidth: 1120,
                            margin: "0 auto",
                            padding: "36px clamp(20px,4vw,48px) 40px",
                        }}
                    >
                        {/* Breadcrumb */}
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
                                href="/seller/seller-network"
                                style={{
                                    fontSize: 12,
                                    color: "#999",
                                    textDecoration: "none",
                                    fontFamily: "'Lato', sans-serif",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
                            >
                                Seller Guides
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

                        {/* Category + read time */}
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
                                L
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
                                    LAN Seller Team
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "#aaa",
                                        fontFamily: "'Lato', sans-serif",
                                    }}
                                >
                                    Academic Document Marketplace · Africa
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
                        padding: "clamp(24px,3vw,48px) clamp(20px,4vw,48px)",
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
                                    {page.badge} — LAN Library Seller Guides · Africa
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
                                padding: "40px",
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
                                    Ready to start earning?
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
                                    Join thousands of sellers already generating passive income
                                    from their academic content across Africa.
                                </div>
                            </div>
                            <Link
                                href="/my-account/seller-account"
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

                    {/* ── SIDEBAR ── */}
                    <aside style={{ position: "sticky", top: 80 }}>
                        {/* Table of Contents */}
                        <div
                            style={{
                                background: "#fff",
                                border: `1px solid ${BORDER}`,
                                padding: "22px 20px",
                                marginBottom: 20,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: ".2em",
                                    textTransform: "uppercase",
                                    color: GOLD,
                                    marginBottom: 16,
                                    fontFamily: "'Lato', sans-serif",
                                }}
                            >
                                In This Article
                            </div>
                            {page.sections.map((sec, i) => (
                                <TocItem
                                    key={i}
                                    label={sec.heading}
                                    index={i}
                                    active={activeSection === i}
                                    onClick={(idx) => {
                                        setActiveSection(idx);
                                        document
                                            .getElementById(`section-${idx}`)
                                            ?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            });
                                    }}
                                />
                            ))}
                        </div>

                        {/* All guides directory */}
                        <div style={{ background: NAVY, padding: "20px" }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: ".2em",
                                    textTransform: "uppercase",
                                    color: "rgba(184,150,62,.5)",
                                    marginBottom: 14,
                                    fontFamily: "'Lato', sans-serif",
                                }}
                            >
                                All Seller Guides
                            </div>
                            {Object.entries(RELATED_META).map(([s, meta]) => (
                                <Link
                                    key={s}
                                    href={`/seller/${s}`}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "9px 0",
                                        borderBottom: "1px solid rgba(255,255,255,.05)",
                                        textDecoration: "none",
                                        fontSize: 11,
                                        color:
                                            s === slug ? GOLD : "rgba(245,240,232,.4)",
                                        fontFamily: "'Lato', sans-serif",
                                        fontWeight: s === slug ? 700 : 400,
                                        transition: "color .15s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.color = GOLD)
                                    }
                                    onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                        s === slug ? GOLD : "rgba(245,240,232,.4)")
                                    }
                                >
                                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                                    <span style={{ flex: 1 }}>{meta.label}</span>
                                    {s === slug && (
                                        <span
                                            style={{
                                                fontSize: 8,
                                                background: GOLD,
                                                color: NAVY,
                                                padding: "2px 7px",
                                                fontWeight: 800,
                                                letterSpacing: ".06em",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            NOW
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>

                {/* ── GUIDES FOOTER ── */}
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