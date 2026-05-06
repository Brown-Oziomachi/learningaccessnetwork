"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    CheckCircle, Shield, FileText, DollarSign, User,
    AlertTriangle, ChevronRight, ArrowLeft, BookOpen,
    Lock, Star, Zap, Globe, Clock, XCircle,
} from "lucide-react";

const SECTIONS = [
    { id: "ownership", label: "Ownership & Copyright", icon: Shield },
    { id: "content", label: "Content Standards", icon: FileText },
    { id: "revenue", label: "Revenue & Payments", icon: DollarSign },
    { id: "privacy", label: "User Data & Privacy", icon: Lock },
    { id: "intellectual", label: "Intellectual Property", icon: Star },
    { id: "conduct", label: "Seller Conduct", icon: User },
    { id: "reviews", label: "Review & Takedowns", icon: AlertTriangle },
    { id: "liability", label: "Liability & Disclaimers", icon: Zap },
    { id: "jurisdiction", label: "Jurisdiction & Law", icon: Globe },
    { id: "termination", label: "Termination", icon: XCircle },
    { id: "amendments", label: "Amendments", icon: Clock },
];

function SectionAnchor({ id }) {
    return <span id={id} className="absolute -top-24" />;
}

function Clause({ number, children }) {
    return (
        <div className="flex gap-4 py-3.5 border-b border-[#1e2535] last:border-0">
            <span className="text-[11px] font-bold text-[#a7b9d6] bg-[#1a2540] border border-[#2a3a5c] rounded-md px-1.5 py-0.5 h-fit mt-0.5 shrink-0 font-mono">
                {number}
            </span>
            <p className="text-[14px] text-[#94a3b8] leading-[1.75]">{children}</p>
        </div>
    );
}

function SectionCard({ id, icon: Icon, title, children }) {
    return (
        <section id={id} className="relative scroll-mt-28">
            <SectionAnchor id={id} />
            <div className="bg-[#0d1117] border border-[#1e2535] rounded-2xl overflow-hidden mb-6 hover:border-[#2a3a5c] transition-colors">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e2535] bg-[#0a0e17]">
                    <div className="w-8 h-8 rounded-lg bg-[#1a2540] border border-[#2a3a5c] flex items-center justify-center shrink-0">
                        <Icon size={15} className="text-[#4069aa]" />
                    </div>
                    <h2 className="text-[15px] font-semibold text-[#e2e8f0] tracking-tight">{title}</h2>
                </div>
                <div className="px-6 py-2">{children}</div>
            </div>
        </section>
    );
}

function Highlight({ children }) {
    return (
        <span className="text-[#e2e8f0] font-semibold">{children}</span>
    );
}

function Tag({ children, color = "blue" }) {
    const colors = {
        blue: "bg-[#1a2a4a] text-[#60a5fa] border-[#2a3a6a]",
        green: "bg-[#0f2a1a] text-[#4ade80] border-[#1a4a2a]",
        red: "bg-[#2a0f0f] text-[#f87171] border-[#4a1a1a]",
        yellow: "bg-[#2a200a] text-[#fbbf24] border-[#4a380a]",
    };
    return (
        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors[color]} mx-0.5`}>
            {children}
        </span>
    );
}

export default function UploaderAgreement() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("ownership");
    const [agreed, setAgreed] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const lastUpdated = "January 15, 2025";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);

            // Scroll spy
            for (const section of SECTIONS) {
                const el = document.getElementById(section.id);
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                if (rect.top <= 120 && rect.bottom > 120) {
                    setActiveSection(section.id);
                    break;
                }
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#060912] text-[#e2e8f0]" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

            {/* ── TOP NAV ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3 transition-all duration-200 ${scrolled ? "bg-[#060912]/95 backdrop-blur-md border-b border-[#1e2535]" : "bg-transparent"}`}>
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#1e2535] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2a3a5c] transition-colors"
                >
                    <ArrowLeft size={15} />
                </button>

                <Link href="/home" className="flex items-center gap-2 no-underline">
                    <BookOpen size={16} className="text-[#3b82f6]" />
                    <span className="text-[13px] font-semibold text-[#e2e8f0]">LAN Library</span>
                    <span className="text-[#2a3a5c]">/</span>
                    <span className="text-[13px] text-[#64748b]">Uploader Agreement</span>
                </Link>

                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(o => !o)}
                    className="ml-auto lg:hidden flex items-center gap-1.5 text-[12px] text-[#64748b] border border-[#1e2535] rounded-lg px-3 py-1.5 hover:border-[#2a3a5c] transition-colors"
                >
                    <FileText size={13} />
                    Contents
                </button>

                <Link
                    href="/upload-document"
                    className="hidden sm:flex ml-auto items-center gap-1.5 text-[12.5px] font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] px-4 py-1.5 rounded-lg transition-colors no-underline"
                >
                    Start Uploading
                    <ChevronRight size={13} />
                </Link>
            </nav>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <div className="flex pt-14">

                {/* ── LEFT SIDEBAR ── */}
                <aside className={`
          fixed top-14 left-0 bottom-0 z-40 w-64 bg-[#060912] border-r border-[#1e2535] overflow-y-auto
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
                    <div className="py-6 px-4">
                        <p className="text-[10px] font-bold text-[#59616b] uppercase tracking-widest mb-3 px-2">On this page</p>
                        {SECTIONS.map((s) => {
                            const Icon = s.icon;
                            const isActive = activeSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all mb-0.5 ${isActive
                                            ? "bg-[#1a2540] text-[#60a5fa] border border-[#2a3a6a]"
                                            : "text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0d1117]"
                                        }`}
                                >
                                    <Icon size={13} className={isActive ? "text-[#3b82f6]" : "text-[#334155]"} />
                                    <span className="text-[12.5px] font-medium">{s.label}</span>
                                </button>
                            );
                        })}

                        <div className="mt-6 pt-5 border-t border-[#1e2535]">
                            <div className="bg-[#0d1117] border border-[#1e2535] rounded-xl p-4">
                                <p className="text-[11px] text-[#334155] mb-1 font-semibold uppercase tracking-wider">Last Updated</p>
                                <p className="text-[12px] text-[#64748b]">{lastUpdated}</p>
                                <p className="text-[11px] text-[#334155] mt-3 mb-1 font-semibold uppercase tracking-wider">Questions?</p>
                                <Link href="/lan/net/help-center" className="text-[12px] text-[#3b82f6] hover:text-[#60a5fa] no-underline">
                                    Visit Help Center →
                                </Link>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="lg:ml-64 flex-1 min-w-0 px-5 sm:px-8 lg:px-12 py-10 pb-24 max-w-4xl">

                    {/* Hero */}
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 bg-[#1a2540] border border-[#2a3a5c] rounded-full px-3 py-1 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                            <span className="text-[11px] font-semibold text-[#60a5fa] uppercase tracking-wider">Legal Document</span>
                        </div>
                        <h1 className="text-[32px] sm:text-[40px] font-bold text-[#f1f5f9] leading-[1.15] tracking-tight mb-3">
                            Uploader Agreement
                        </h1>
                        <p className="text-[15px] text-[#64748b] leading-[1.7] max-w-2xl mb-6">
                            This agreement governs the upload and sale of educational content on LAN Library. By uploading any document, you confirm that you have read, understood, and agreed to all terms outlined below.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#475569]">
                            <span className="flex items-center gap-1.5"><Clock size={12} /> Effective: {lastUpdated}</span>
                            <span className="text-[#1e2535]">·</span>
                            <span className="flex items-center gap-1.5"><Globe size={12} /> Applies globally</span>
                            <span className="text-[#1e2535]">·</span>
                            <span className="flex items-center gap-1.5"><FileText size={12} /> 11 sections</span>
                        </div>
                    </div>

                    {/* Intro callout */}
                    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-5 mb-8 flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[#1a2a4a] border border-[#2a3a6a] flex items-center justify-center shrink-0">
                            <Shield size={16} className="text-[#3b82f6]" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-[#93c5fd] mb-1">Before you upload</p>
                            <p className="text-[13px] text-[#64748b] leading-[1.65]">
                                LAN Library is a trusted educational marketplace. We hold all sellers to high standards of originality, accuracy, and professionalism. This agreement exists to protect both you and the students who purchase your content.
                            </p>
                        </div>
                    </div>

                    {/* ── SECTION 1 ── */}
                    <SectionCard id="ownership" icon={Shield} title="1. Ownership and Copyright">
                        <Clause number="1.1">
                            <Highlight>Originality:</Highlight> You must own the full copyright or possess explicit, documented permission to distribute any file you upload to LAN Library. Submitting work that is not your own — even if you purchased it — does not grant you redistribution rights.
                        </Clause>
                        <Clause number="1.2">
                            <Highlight>Prohibited uploads:</Highlight> Uploading pirated textbooks, unauthorized scanned copies of copyrighted works, or materials belonging to other publishers, institutions, or digital platforms is strictly prohibited and may constitute a criminal offence under applicable copyright law.
                        </Clause>
                        <Clause number="1.3">
                            <Highlight>License to LAN Library:</Highlight> By uploading content, you grant LAN Library a <Tag color="blue">non-exclusive</Tag> <Tag color="blue">royalty-free</Tag> <Tag color="blue">worldwide</Tag> license to host, display, index, promote, and distribute your content to registered users of the platform for as long as it remains listed.
                        </Clause>
                        <Clause number="1.4">
                            <Highlight>Retention of rights:</Highlight> You retain full ownership of your intellectual property. The license granted to LAN Library does not transfer ownership or prevent you from publishing your work elsewhere.
                        </Clause>
                        <Clause number="1.5">
                            <Highlight>Indemnification:</Highlight> If a copyright claim is filed against LAN Library as a result of your upload, you agree to indemnify and hold harmless LAN Library, its operators, and affiliates from any resulting liabilities, damages, or legal costs.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 2 ── */}
                    <SectionCard id="content" icon={FileText} title="2. Content Standards">
                        <Clause number="2.1">
                            <Highlight>Relevance:</Highlight> All content must be academic or educational in nature. Acceptable formats include lecture notes, past examination questions, lab manuals, textbooks, study guides, course outlines, syllabi, theses, and research papers.
                        </Clause>
                        <Clause number="2.2">
                            <Highlight>Supported formats:</Highlight> Files must be submitted in supported formats — primarily <Tag color="green">PDF</Tag> — and must be clear, legible, and complete. Corrupted, password-protected, or deliberately incomplete files are not permitted.
                        </Clause>
                        <Clause number="2.3">
                            <Highlight>Quality standards:</Highlight> Documents must be properly formatted, free from excessive typos or grammatical errors, and must accurately match the title and description provided at upload. Misleading descriptions constitute a violation.
                        </Clause>
                        <Clause number="2.4">
                            <Highlight>Prohibited content:</Highlight> You may not upload content that is defamatory, obscene, politically inciting, racially offensive, sexually explicit, or contains malware, viruses, or embedded tracking scripts of any kind.
                        </Clause>
                        <Clause number="2.5">
                            <Highlight>Duplicate submissions:</Highlight> Uploading the same document under multiple listings to manipulate search rankings or inflate sales counts is prohibited and will result in removal of all duplicate listings.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 3 ── */}
                    <SectionCard id="revenue" icon={DollarSign} title="3. Revenue and Payments">
                        <Clause number="3.1">
                            <Highlight>Pricing:</Highlight> Sellers set their own prices. LAN Library recommends pricing between <Tag color="green">₦2,500</Tag> and <Tag color="green">₦3,200</Tag> for trending academic notes, but final pricing is at the seller's discretion within platform-permitted ranges.
                        </Clause>
                        <Clause number="3.2">
                            <Highlight>Commission:</Highlight> LAN Library deducts a service commission from each completed sale to cover payment processing, platform infrastructure, and customer support. The current commission rate is disclosed in your Seller Dashboard and may be updated with prior notice.
                        </Clause>
                        <Clause number="3.3">
                            <Highlight>Wallet credits:</Highlight> Revenue from sales is credited to your <Tag color="blue">accountBalance</Tag> within the Seller Dashboard after the transaction is confirmed and the buyer's payment has cleared.
                        </Clause>
                        <Clause number="3.4">
                            <Highlight>Withdrawals:</Highlight> You may request a withdrawal once your balance meets the minimum threshold set by the platform. Withdrawals are processed to your verified bank account. LAN Library is not liable for delays caused by third-party payment processors.
                        </Clause>
                        <Clause number="3.5">
                            <Highlight>Refunds:</Highlight> In cases where LAN Library grants a buyer a refund due to a legitimate complaint about your content (e.g., misrepresentation, corrupted file), the corresponding amount may be deducted from your balance. Repeated refund triggers may result in account review.
                        </Clause>
                        <Clause number="3.6">
                            <Highlight>Tax obligations:</Highlight> You are solely responsible for declaring and paying any taxes applicable to income earned through LAN Library in your jurisdiction. LAN Library does not provide tax advice and does not withhold taxes on your behalf.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 4 ── */}
                    <SectionCard id="privacy" icon={Lock} title="4. User Data and Privacy">
                        <Clause number="4.1">
                            <Highlight>Profile visibility:</Highlight> Your seller profile — including your display name, seller rating, and number of documents uploaded — will be publicly visible to all registered users of the platform.
                        </Clause>
                        <Clause number="4.2">
                            <Highlight>Data accuracy:</Highlight> You agree to provide truthful and accurate information regarding your identity, bank account details, and contact information. Providing false information may result in account suspension and forfeiture of earnings.
                        </Clause>
                        <Clause number="4.3">
                            <Highlight>Buyer data:</Highlight> You will not have access to the personal data of buyers unless they voluntarily contact you. Misuse of any buyer information obtained through the platform is strictly prohibited and may be subject to legal action.
                        </Clause>
                        <Clause number="4.4">
                            <Highlight>Platform data use:</Highlight> LAN Library may use anonymized data from your uploads and sales (e.g., category popularity, pricing trends) to improve platform recommendations and marketing — never to identify or expose individual sellers without consent.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 5 ── */}
                    <SectionCard id="intellectual" icon={Star} title="5. Intellectual Property Protection">
                        <Clause number="5.1">
                            <Highlight>Watermarking:</Highlight> LAN Library may apply digital watermarks or metadata to your uploaded files to identify the source of unauthorized distribution and protect both the platform and your content.
                        </Clause>
                        <Clause number="5.2">
                            <Highlight>DMCA compliance:</Highlight> LAN Library respects intellectual property rights and complies with applicable copyright laws. If you believe another seller has uploaded your work without authorization, you may submit a takedown request via the Support Ticket system.
                        </Clause>
                        <Clause number="5.3">
                            <Highlight>Counter-notices:</Highlight> If your content is removed in response to a copyright claim and you believe the removal was in error, you may submit a counter-notice. LAN Library will review all counter-notices in good faith.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 6 ── */}
                    <SectionCard id="conduct" icon={User} title="6. Seller Conduct">
                        <Clause number="6.1">
                            <Highlight>Professionalism:</Highlight> Sellers are expected to respond to buyer reviews and feedback professionally. Harassment, threats, or abusive language directed at buyers or platform staff will result in immediate suspension.
                        </Clause>
                        <Clause number="6.2">
                            <Highlight>Manipulation:</Highlight> Artificially inflating your seller rating through fake purchases, review manipulation, or collusion with other users is strictly prohibited.
                        </Clause>
                        <Clause number="6.3">
                            <Highlight>Accurate descriptions:</Highlight> You must provide honest, accurate, and complete descriptions for all uploaded documents. Intentionally misleading buyers about the content, page count, subject, or level of a document will result in listing removal and potential account action.
                        </Clause>
                        <Clause number="6.4">
                            <Highlight>Competitive conduct:</Highlight> You may not use LAN Library to collect information about other sellers for the purpose of undercutting, copying, or otherwise engaging in unfair competitive practices.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 7 ── */}
                    <SectionCard id="reviews" icon={AlertTriangle} title="7. Review and Takedowns">
                        <Clause number="7.1">
                            <Highlight>Pre-publication review:</Highlight> All uploads are subject to a review process before going live. LAN Library reserves the right to reject any submission that does not meet the platform's content standards, without obligation to provide a detailed reason.
                        </Clause>
                        <Clause number="7.2">
                            <Highlight>Post-publication takedowns:</Highlight> LAN Library may remove any listed document at any time if it is found to violate this agreement, applicable law, or platform policies — even after it has been approved and is actively generating sales.
                        </Clause>
                        <Clause number="7.3">
                            <Highlight>Appeals:</Highlight> Sellers whose content has been removed may appeal the decision by contacting LAN Library support. Appeals are reviewed within 5–10 business days. The platform's decision on appeals is final.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 8 ── */}
                    <SectionCard id="liability" icon={Zap} title="8. Liability and Disclaimers">
                        <Clause number="8.1">
                            <Highlight>No guarantee of earnings:</Highlight> LAN Library does not guarantee any minimum level of sales or earnings. Visibility, search ranking, and sales performance are influenced by many factors outside the platform's control.
                        </Clause>
                        <Clause number="8.2">
                            <Highlight>Platform availability:</Highlight> LAN Library is provided on an "as-is" and "as-available" basis. We do not guarantee uninterrupted access and are not liable for losses resulting from downtime, technical errors, or data loss.
                        </Clause>
                        <Clause number="8.3">
                            <Highlight>Content accuracy:</Highlight> LAN Library does not endorse or verify the academic accuracy of uploaded content. Buyers rely on seller-provided descriptions and their own judgment. LAN Library is not liable for any educational or financial harm arising from inaccurate content.
                        </Clause>
                        <Clause number="8.4">
                            <Highlight>Limitation of liability:</Highlight> To the maximum extent permitted by law, LAN Library's total liability to any seller shall not exceed the total commissions earned by the platform from that seller's sales in the preceding 3 months.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 9 ── */}
                    <SectionCard id="jurisdiction" icon={Globe} title="9. Jurisdiction and Governing Law">
                        <Clause number="9.1">
                            <Highlight>Governing law:</Highlight> This agreement is governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict-of-law provisions.
                        </Clause>
                        <Clause number="9.2">
                            <Highlight>Dispute resolution:</Highlight> Any disputes arising under this agreement shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be referred to mediation before any formal legal proceedings are initiated.
                        </Clause>
                        <Clause number="9.3">
                            <Highlight>International sellers:</Highlight> Sellers operating from outside Nigeria acknowledge that use of the platform constitutes acceptance of Nigerian governing law for platform-related disputes. This does not affect your local consumer or seller rights.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 10 ── */}
                    <SectionCard id="termination" icon={XCircle} title="10. Termination of Account">
                        <Clause number="10.1">
                            <Highlight>Violation:</Highlight> Any material breach of this agreement — especially copyright infringement, fraud, or repeated content violations — may result in immediate deactivation of your seller account and forfeiture of pending earnings below the minimum withdrawal threshold.
                        </Clause>
                        <Clause number="10.2">
                            <Highlight>Voluntary deactivation:</Highlight> You may choose to deactivate your seller account at any time by contacting support. Upon deactivation, your listings will be removed, but previously purchased materials will remain accessible in buyers' personal libraries permanently.
                        </Clause>
                        <Clause number="10.3">
                            <Highlight>Outstanding balance:</Highlight> Upon voluntary deactivation, any outstanding balance above the minimum withdrawal threshold will be processed and paid out to your verified bank account within 14 business days.
                        </Clause>
                        <Clause number="10.4">
                            <Highlight>Survival:</Highlight> Clauses relating to intellectual property, indemnification, liability, and governing law shall survive termination of this agreement.
                        </Clause>
                    </SectionCard>

                    {/* ── SECTION 11 ── */}
                    <SectionCard id="amendments" icon={Clock} title="11. Amendments to This Agreement">
                        <Clause number="11.1">
                            <Highlight>Right to amend:</Highlight> LAN Library reserves the right to update or amend this agreement at any time. Significant changes will be communicated to sellers via email or an in-platform notification at least 14 days before taking effect.
                        </Clause>
                        <Clause number="11.2">
                            <Highlight>Continued use:</Highlight> Continuing to use the seller features of the platform after the effective date of any amendment constitutes your acceptance of the revised agreement.
                        </Clause>
                        <Clause number="11.3">
                            <Highlight>Version history:</Highlight> Previous versions of this agreement are archived and available upon request through the LAN Library support team.
                        </Clause>
                    </SectionCard>

                    {/* AI Note */}
                    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-5 mb-8">
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-[#1a2a4a] border border-[#2a3a6a] flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[13px]">✦</span>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-[#60a5fa] uppercase tracking-wider mb-1">Note from LAN Library</p>
                                <p className="text-[13px] text-[#64748b] leading-[1.7]">
                                     I recommend reviewing the full legal documentation on the LAN Library website or contacting the team via the <Link href="/lan/net/help-center" className="text-[#3b82f6] hover:text-[#60a5fa] no-underline">Support Ticket system</Link> if you have specific legal questions. This document is updated periodically — always confirm you are reading the latest version.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Agreement checkbox + CTA */}
                    <div className="bg-[#060912] border border-white rounded-2xl p-6 sticky bottom-4 shadow-2xl shadow-black/50">
                        <label className="flex items-start gap-3 cursor-pointer mb-5 group">
                            <div
                                onClick={() => setAgreed(a => !a)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed
                                        ? "bg-[#3b82f6] border-[#3b82f6]"
                                        : "border-[#334155] group-hover:border-[#475569]"
                                    }`}
                            >
                                {agreed && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-[13.5px] text-[#94a3b8] leading-[1.65]">
                                I have read and understood the LAN Library Uploader Agreement. I confirm that any content I upload complies with all terms above, and I accept full responsibility for its originality and accuracy.
                            </span>
                        </label>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={agreed ? "/upload-document" : "/become-seller"}
                                onClick={e => { if (!agreed) e.preventDefault(); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-all no-underline ${agreed
                                        ? "bg-blue-950 hover:bg-[#2563eb] text-white shadow-lg shadow-blue-500/20"
                                        : "bg-[#0d1117] text-[#334155] cursor-not-allowed border border-[#1e2535]"
                                    }`}
                            >
                                <CheckCircle size={15} />
                                I Agree — Start Uploading
                            </Link>
                            <Link
                                href="/lan/net/help-center" target="_blank"
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium text-[#64748b] border border-[#1e2535] hover:border-[#2a3a5c] hover:text-[#94a3b8] transition-colors no-underline"
                            >
                                Questions? Visit Help Center
                            </Link>
                        </div>

                        {!agreed && (
                            <p className="text-[11px] text-[#334155] text-center mt-3">
                                You must check the box above to proceed to the upload dashboard.
                            </p>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}