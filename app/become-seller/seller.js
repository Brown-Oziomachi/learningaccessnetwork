"use client";
import React, { useState, useEffect } from "react";
import {
    Store, Building2, CreditCard, CheckCircle, ArrowLeft,
    Loader2, GraduationCap, Info, X, TrendingUp, Clock,
    Shield, ChevronRight, Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function BecomeSellerClient() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const [showLecturerInfo, setShowLecturerInfo] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "", surname: "", email: "", phoneNumber: "",
        title: "", bankName: "", bankCode: "", accountNumber: "",
        accountName: "", isCustomBank: false, businessName: "",
        businessDescription: "", university: "", department: "",
        agreeToTerms: false,
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: "", type: "error" });

    const showToast = (message, type = "error") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type }), 5000);
    };

    const nigerianBanks = [
        { name: "Access Bank", code: "044" },
        { name: "Citibank Nigeria", code: "023" },
        { name: "Ecobank Nigeria", code: "050" },
        { name: "Fidelity Bank", code: "070" },
        { name: "First Bank of Nigeria", code: "011" },
        { name: "First City Monument Bank (FCMB)", code: "214" },
        { name: "Guaranty Trust Bank (GTBank)", code: "058" },
        { name: "Heritage Bank", code: "030" },
        { name: "Keystone Bank", code: "082" },
        { name: "Polaris Bank", code: "076" },
        { name: "Providus Bank", code: "101" },
        { name: "Stanbic IBTC Bank", code: "221" },
        { name: "Standard Chartered Bank", code: "068" },
        { name: "Sterling Bank", code: "232" },
        { name: "Union Bank of Nigeria", code: "032" },
        { name: "United Bank for Africa (UBA)", code: "033" },
        { name: "Unity Bank", code: "215" },
        { name: "Wema Bank", code: "035" },
        { name: "Zenith Bank", code: "057" },
        { name: "Opay Bank", code: "999992" },

    ];

    const isAcademic = ["Lecturer", "Dr.", "Prof.", "Professor"].includes(formData.title);
    const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (cu) => {
            if (cu) await fetchUserData(cu.uid);
            else router.push("/auth/signin");
        });
        return () => unsub();
    }, [router]);

    const fetchUserData = async (uid) => {
        try {
            setLoading(true);
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 8000));
            const snap = await Promise.race([getDoc(doc(db, "users", uid)), timeout]);
            if (snap.exists()) {
                const d = snap.data();
                if (d.isSeller) { router.push("/my-account/seller-account"); return; }
                setUser({ uid, ...d });
                setFormData(p => ({
                    ...p,
                    firstName: d.firstName || "",
                    surname: d.surname || "",
                    email: d.email || auth.currentUser?.email || "",
                    phoneNumber: d.phoneNumber || "",
                }));
            } else {
                setUser({ uid, email: auth.currentUser?.email || "", firstName: "", surname: "" });
                setFormData(p => ({ ...p, email: auth.currentUser?.email || "" }));
            }
        } catch {
            if (auth.currentUser) {
                setUser({ uid: auth.currentUser.uid, email: auth.currentUser.email, firstName: "", surname: "" });
                setFormData(p => ({ ...p, email: auth.currentUser.email }));
                showToast("Could not load profile. You can still proceed.", "error");
            } else {
                router.push("/my-account");
            }
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const e = {};
        if (!formData.phoneNumber) e.phoneNumber = "Phone number is required";
        if (!formData.bankName) e.bankName = "Please select a bank";
        if (formData.isCustomBank && !formData.bankCode) e.bankCode = "Bank code is required";
        if (!formData.accountNumber) e.accountNumber = "Account number is required";
        if (formData.accountNumber && formData.accountNumber.length !== 10) e.accountNumber = "Must be 10 digits";
        if (!formData.accountName) e.accountName = "Account name is required";
        if (!formData.agreeToTerms) e.agreeToTerms = "You must agree to the terms";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const flwRes = await fetch("/api/flutterwave/create-subaccount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid, email: formData.email,
                    firstName: formData.firstName, surname: formData.surname,
                    phoneNumber: formData.phoneNumber, bankCode: formData.bankCode,
                    accountNumber: formData.accountNumber,
                    businessName: formData.businessName || `${formData.firstName} ${formData.surname}`,
                }),
            });
            const flwData = await flwRes.json();
            if (!flwData.success) throw new Error(flwData.error || "Failed to create subaccount.");
            const flutterwaveSubaccountId = flwData.subaccount_id;

            const batch = writeBatch(db);
            batch.update(doc(db, "users", user.uid), {
                isSeller: true, phoneNumber: formData.phoneNumber,
                flutterwaveSubaccountId, updatedAt: serverTimestamp(),
            });
            batch.set(doc(db, "sellers", user.uid), {
                accountBalance: 0, totalEarnings: 0, booksSold: 0,
                bankDetails: {
                    bankName: formData.bankName, bankCode: formData.bankCode,
                    accountNumber: formData.accountNumber, accountName: formData.accountName,
                },
                businessInfo: {
                    businessName: formData.businessName || `${formData.firstName} ${formData.surname}`,
                    businessDescription: formData.businessDescription,
                },
                sellerName: `${formData.firstName} ${formData.surname}`.trim(),
                title: formData.title || "",
                university: formData.university || "",
                department: formData.department || "",
                createdAt: serverTimestamp(),
                status: "active",
                flutterwaveSubaccountId,
            });
            await batch.commit();
            showToast("Seller account created successfully! 🎉", "success");
            setTimeout(() => router.push("/my-account/seller-account"), 2000);
        } catch (error) {
            let msg = `Setup failed: ${error.message}`;
            if (error.message.includes("permission")) msg = "Setup failed: Permission denied. Contact support.";
            else if (error.message.includes("account")) msg = "We couldn't verify your account number. Please check and retry.";
            else if (error.message.includes("timeout")) msg = "Request timed out. Check your connection.";
            showToast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="lsb-loading">
            <div className="lsb-spinner" />
            <p>Loading your profile…</p>
        </div>
    );

    return (
        <>
            <style>{CSS}</style>

            {/* Top nav bar */}
            <header className="lsb-topbar">
                <div className="lsb-topbar-inner">
                    <div className="lsb-topbar-right">
                        <span className="lsb-topbar-user">{formData.firstName || "Seller"} Account</span>
                    </div>
                </div>
            </header>

            {/* Orange accent bar */}
            <div className="lsb-accent-bar" />

            <div className="lsb-root">
                {/* Breadcrumb */}
                <div className="lsb-breadcrumb">
                    <button onClick={() => router.back()} className="lsb-bread-link">
                        <ArrowLeft size={13} /> Back
                    </button>
                    <ChevronRight size={12} className="lsb-bread-sep" />
                    <span className="lsb-bread-link">My Account</span>
                    <ChevronRight size={12} className="lsb-bread-sep" />
                    <span className="lsb-bread-active">Become a Seller</span>
                </div>

                <div className="lsb-layout">

                    {/* ── LEFT COLUMN: main form ── */}
                    <div className="lsb-main">

                        {/* Page title */}
                        <div className="lsb-page-title-block">
                            <h1 className="lsb-page-title">Seller Registration</h1>
                            <p className="lsb-page-sub">Complete your application to start selling on LAN Library</p>
                        </div>

                        {/* STEP 1 – Personal Info */}
                        <div className="lsb-section">
                            <div className="lsb-section-head">
                                <span className="lsb-step-badge">1</span>
                                <h2 className="lsb-section-title">Personal Information</h2>
                            </div>
                            <div className="lsb-grid2">
                                <div className="lsb-field">
                                    <label className="lsb-label">First Name</label>
                                    <input value={formData.firstName} disabled className="lsb-input lsb-input-disabled" />
                                </div>
                                <div className="lsb-field">
                                    <label className="lsb-label">Surname</label>
                                    <input value={formData.surname} disabled className="lsb-input lsb-input-disabled" />
                                </div>
                                <div className="lsb-field lsb-span2">
                                    <label className="lsb-label">Email Address</label>
                                    <input value={formData.email} disabled className="lsb-input lsb-input-disabled" />
                                </div>
                                <div className="lsb-field lsb-span2">
                                    <label className="lsb-label">Phone Number <span className="lsb-req">*</span></label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={e => set("phoneNumber", e.target.value)}
                                        placeholder="08012345678"
                                        className={`lsb-input${errors.phoneNumber ? " lsb-input-err" : ""}`}
                                    />
                                    {errors.phoneNumber && <p className="lsb-err-msg">{errors.phoneNumber}</p>}
                                </div>
                            </div>

                            {/* Title / Profession */}
                            <div className="lsb-field" style={{ marginTop: 16 }}>
                                <div className="lsb-label-row">
                                    <label className="lsb-label">Title / Profession</label>
                                    <button type="button" onClick={() => setShowLecturerInfo(true)} className="lsb-info-btn">
                                        <Info size={11} /> Why?
                                    </button>
                                </div>
                                <select
                                    value={formData.title}
                                    onChange={e => set("title", e.target.value)}
                                    className="lsb-input lsb-select"
                                >
                                    <option value="">Select title (optional)</option>
                                    <option value="Lecturer">Lecturer</option>
                                    <option value="Dr.">Dr.</option>
                                    <option value="Prof.">Prof.</option>
                                    <option value="Professor">Professor</option>
                                </select>
                            </div>

                            {isAcademic && (
                                <>
                                    <div className="lsb-academic-banner">
                                        <div className="lsb-academic-icon"><GraduationCap size={18} /></div>
                                        <div>
                                            <p className="lsb-academic-title">Academic Profile Activated 🎓</p>
                                            <p className="lsb-academic-sub">
                                                As <strong>{formData.title}</strong>, you'll be featured in our University Lecturers directory — students can discover your materials by department and university.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="lsb-grid2" style={{ marginTop: 14 }}>
                                        <div className="lsb-field">
                                            <label className="lsb-label">University</label>
                                            <input
                                                type="text"
                                                value={formData.university}
                                                onChange={e => set("university", e.target.value)}
                                                placeholder="e.g. University of Lagos"
                                                required
                                                className="lsb-input"
                                            />
                                        </div>
                                        <div className="lsb-field">
                                            <label className="lsb-label">Department</label>
                                            <input
                                                type="text"
                                                value={formData.department}
                                                onChange={e => set("department", e.target.value)}
                                                placeholder="e.g. Computer Science"
                                                required
                                                className="lsb-input"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* STEP 2 – Bank Details */}
                        <div className="lsb-section">
                            <div className="lsb-section-head">
                                <span className="lsb-step-badge">2</span>
                                <h2 className="lsb-section-title">Bank Account Details</h2>
                            </div>
                            <div className="lsb-info-note">
                                <Shield size={14} />
                                <span>Your banking information is encrypted and used only for seller payouts.</span>
                            </div>
                            <div className="lsb-grid2" style={{ marginTop: 16 }}>
                                <div className="lsb-field lsb-span2">
                                    <label className="lsb-label">Bank Name <span className="lsb-req">*</span></label>
                                    <select
                                        value={formData.isCustomBank ? "other" : formData.bankName}
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v === "other") {
                                                setFormData(p => ({ ...p, bankName: "", bankCode: "", isCustomBank: true }));
                                            } else {
                                                const b = nigerianBanks.find(b => b.name === v);
                                                setFormData(p => ({ ...p, bankName: v, bankCode: b?.code || "", isCustomBank: false }));
                                            }
                                        }}
                                        className={`lsb-input lsb-select${errors.bankName ? " lsb-input-err" : ""}`}
                                    >
                                        <option value="">— Select your bank —</option>
                                        {nigerianBanks.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                                        <option value="other">🏦 Other Bank (Not Listed)</option>
                                    </select>
                                    {errors.bankName && <p className="lsb-err-msg">{errors.bankName}</p>}
                                </div>

                                {formData.isCustomBank && (
                                    <>
                                        <div className="lsb-field">
                                            <label className="lsb-label">Bank Name <span className="lsb-req">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.bankName}
                                                onChange={e => set("bankName", e.target.value)}
                                                placeholder="Enter bank name"
                                                className={`lsb-input${errors.bankName ? " lsb-input-err" : ""}`}
                                            />
                                        </div>
                                        <div className="lsb-field">
                                            <label className="lsb-label">Bank Code <span className="lsb-req">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.bankCode}
                                                onChange={e => set("bankCode", e.target.value.replace(/\D/g, ""))}
                                                placeholder="e.g. 044"
                                                maxLength={3}
                                                className={`lsb-input${errors.bankCode ? " lsb-input-err" : ""}`}
                                            />
                                            {errors.bankCode && <p className="lsb-err-msg">{errors.bankCode}</p>}
                                            <p className="lsb-hint">Find your bank code on your bank's website or mobile app.</p>
                                        </div>
                                    </>
                                )}

                                {!formData.isCustomBank && formData.bankCode && (
                                    <div className="lsb-field lsb-span2">
                                        <label className="lsb-label">Bank Code</label>
                                        <input value={formData.bankCode} disabled className="lsb-input lsb-input-disabled" />
                                    </div>
                                )}

                                <div className="lsb-field">
                                    <label className="lsb-label">Account Number <span className="lsb-req">*</span></label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={formData.accountNumber}
                                        onChange={e => set("accountNumber", e.target.value.replace(/\D/g, ""))}
                                        placeholder="0123456789"
                                        className={`lsb-input${errors.accountNumber ? " lsb-input-err" : ""}`}
                                    />
                                    {errors.accountNumber && <p className="lsb-err-msg">{errors.accountNumber}</p>}
                                </div>
                                <div className="lsb-field">
                                    <label className="lsb-label">Account Name <span className="lsb-req">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.accountName}
                                        onChange={e => set("accountName", e.target.value)}
                                        placeholder="Account holder name"
                                        className={`lsb-input${errors.accountName ? " lsb-input-err" : ""}`}
                                    />
                                    {errors.accountName && <p className="lsb-err-msg">{errors.accountName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* STEP 3 – Business Info */}
                        <div className="lsb-section">
                            <div className="lsb-section-head">
                                <span className="lsb-step-badge">3</span>
                                <h2 className="lsb-section-title">
                                    Business Information
                                    <span className="lsb-optional-badge">Optional</span>
                                </h2>
                            </div>
                            <div className="lsb-field" style={{ marginBottom: 14 }}>
                                <label className="lsb-label">Business / Store Name</label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={e => set("businessName", e.target.value)}
                                    placeholder={`${formData.firstName} ${formData.surname}`.trim() || "Your store name"}
                                    className="lsb-input"
                                />
                            </div>
                            <div className="lsb-field">
                                <label className="lsb-label">Store Description</label>
                                <textarea
                                    value={formData.businessDescription}
                                    onChange={e => set("businessDescription", e.target.value)}
                                    placeholder="Tell buyers what kinds of books and materials you sell…"
                                    rows={3}
                                    className="lsb-input lsb-textarea"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="lsb-terms-box">
                            <label className="lsb-terms-label">
                                <div className="lsb-checkbox-wrap">
                                    <input
                                        type="checkbox"
                                        checked={formData.agreeToTerms}
                                        onChange={e => set("agreeToTerms", e.target.checked)}
                                        className="lsb-checkbox-native"
                                    />
                                    <div className={`lsb-checkbox-custom${formData.agreeToTerms ? " checked" : ""}`}>
                                        {formData.agreeToTerms && <CheckCircle size={12} color="#fff" />}
                                    </div>
                                </div>
                                <span className="lsb-terms-text">
                                    I agree to LAN Library's Seller Terms. I understand I will receive <strong>80%</strong> of each sale, with a <strong>₦1,000</strong> minimum withdrawal, processed within 24 hours.
                                </span>
                            </label>
                            {errors.agreeToTerms && <p className="lsb-err-msg" style={{ marginTop: 8 }}>{errors.agreeToTerms}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="lsb-actions">
                            <button onClick={() => router.back()} disabled={submitting} className="lsb-btn-cancel">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting} className="lsb-btn-submit">
                                {submitting
                                    ? <><Loader2 size={17} className="lsb-spin" /> Creating Account…</>
                                    : <><CheckCircle size={17} /> Complete Registration</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <aside className="lsb-sidebar">

                        {/* Earnings summary card */}
                        <div className="lsb-side-card lsb-earnings-card">
                            <p className="lsb-side-card-title">Your Earnings Breakdown</p>
                            <div className="lsb-earn-row">
                                <span className="lsb-earn-label">Book sale (₦1,000)</span>
                                <span className="lsb-earn-val">₦1,000</span>
                            </div>
                            <div className="lsb-earn-row">
                                <span className="lsb-earn-label">Platform fee (20%)</span>
                                <span className="lsb-earn-val lsb-earn-neg">−₦200</span>
                            </div>
                            <div className="lsb-earn-divider" />
                            <div className="lsb-earn-row">
                                <span className="lsb-earn-total-label">You receive</span>
                                <span className="lsb-earn-total-val">₦800</span>
                            </div>
                            <div className="lsb-earn-badge">80% kept by you</div>
                        </div>

                        {/* Benefits */}
                        <div className="lsb-side-card">
                            <p className="lsb-side-card-title">Why Sell on LAN Library?</p>
                            {[
                                { icon: <TrendingUp size={15} />, t: "Earn 80% per sale", s: "Industry-leading revenue share" },
                                { icon: <Clock size={15} />, t: "Fast withdrawals", s: "Funds processed within 24 hours" },
                                { icon: <Shield size={15} />, t: "Secure & free", s: "No setup or listing fees" },
                                { icon: <Star size={15} />, t: "Grow your brand", s: "Reach thousands of Nigerian students" },
                            ].map((b, i) => (
                                <div key={i} className="lsb-benefit-row">
                                    <div className="lsb-benefit-icon">{b.icon}</div>
                                    <div>
                                        <p className="lsb-benefit-t">{b.t}</p>
                                        <p className="lsb-benefit-s">{b.s}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Help */}
                        <div className="lsb-side-card lsb-help-card">
                            <p className="lsb-help-title">Need help?</p>
                            <p className="lsb-help-sub">Our seller support team is available 9am – 6pm WAT.</p>
                            <a href="mailto:support@lanlibrary.com" className="lsb-help-link">Contact Support →</a>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Lecturer info modal */}
            {showLecturerInfo && (
                <div className="lsb-overlay" onClick={() => setShowLecturerInfo(false)}>
                    <div className="lsb-modal" onClick={e => e.stopPropagation()}>
                        <div className="lsb-modal-header">
                            <div className="lsb-modal-icon"><GraduationCap size={22} /></div>
                            <div>
                                <h3 className="lsb-modal-title">Academic Seller Benefits</h3>
                                <p className="lsb-modal-sub">What you unlock with an academic title</p>
                            </div>
                            <button onClick={() => setShowLecturerInfo(false)} className="lsb-modal-close"><X size={18} /></button>
                        </div>
                        <div className="lsb-modal-body">
                            {[
                                { icon: "🎓", t: "Featured in Lecturers Directory", d: "Your profile appears where students search for academic materials by lecturer name." },
                                { icon: "🔍", t: "Searchable by Dept & University", d: "Students can filter by your department and institution once you fill in those fields." },
                                { icon: "📚", t: "Build Your Academic Brand", d: "Establish yourself as a trusted academic resource across Nigerian universities." },
                                { icon: "💰", t: "Monetise Course Materials", d: "Earn from every download of your notes, past questions, and slides." },
                            ].map((item, i) => (
                                <div key={i} className="lsb-modal-item">
                                    <span className="lsb-modal-emoji">{item.icon}</span>
                                    <div>
                                        <p className="lsb-modal-item-t">{item.t}</p>
                                        <p className="lsb-modal-item-d">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                            <p className="lsb-modal-note">Applies to: Lecturer · Dr. · Prof. · Professor</p>
                            <button onClick={() => setShowLecturerInfo(false)} className="lsb-btn-submit" style={{ width: "100%", marginTop: 4 }}>
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast.show && (
                <div className={`lsb-toast lsb-toast-${toast.type}`}>
                    <div className="lsb-toast-icon">
                        {toast.type === "error" ? <X size={16} /> : <CheckCircle size={16} />}
                    </div>
                    <div className="lsb-toast-body">
                        <p className="lsb-toast-title">{toast.type === "error" ? "Something went wrong" : "Success!"}</p>
                        <p className="lsb-toast-msg">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(p => ({ ...p, show: false }))} className="lsb-toast-close"><X size={14} /></button>
                </div>
            )}
        </>
    );
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --amz-orange: #FF9900;
    --amz-orange-dark: #c45500;
    --amz-navy: #131921;
    --amz-navy2: #232F3E;
    --amz-blue: #146EB4;
    --amz-blue-light: #e8f4fb;
    --amz-green: #067D62;
    --amz-bg: #EAEDED;
    --amz-surface: #ffffff;
    --amz-border: #D5D9D9;
    --amz-border2: #888C8C;
    --amz-text: #0F1111;
    --amz-muted: #565959;
    --amz-hint: #767676;
    --amz-err: #CC0C39;
    --amz-academic-bg: #f0f3fa;
    --amz-academic-border: #b0bdd6;
    --amz-academic: #1a3c5e;
    --font: -apple-system, 'Segoe UI', Roboto, sans-serif;
}

/* Loading */
.lsb-loading {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: var(--amz-bg); font-family: var(--font);
    gap: 14px; color: var(--amz-muted); font-size: 14px;
}
.lsb-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--amz-border);
    border-top-color: var(--amz-orange);
    border-radius: 50%; animation: lsb-spin .75s linear infinite;
}
@keyframes lsb-spin { to { transform: rotate(360deg); } }

/* Topbar */
.lsb-topbar {
    background: var(--amz-navy);
    border-bottom: 1px solid #3a4553;
    position: sticky; top: 0; z-index: 40;
}
.lsb-topbar-inner {
    max-width: 1080px; margin: 0 auto;
    padding: 0 16px; height: 52px;
    display: flex; align-items: center; justify-content: space-between;
}
.lsb-logo {
    font-size: 20px; font-weight: 800; color: #fff;
    letter-spacing: -0.3px; font-family: var(--font);
}
.lsb-logo span { color: var(--amz-orange); }
.lsb-topbar-user { font-size: 12px; color: #ccc; }

/* Orange underline bar */
.lsb-accent-bar { height: 3px; background: var(--amz-orange); }

/* Page root */
.lsb-root {
    max-width: 1080px; margin: 0 auto;
    padding: 14px 16px 60px;
    background: var(--amz-bg);
    min-height: calc(100vh - 55px);
    font-family: var(--font);
}

/* Breadcrumb */
.lsb-breadcrumb {
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; color: var(--amz-muted);
    margin-bottom: 14px; flex-wrap: wrap;
}
.lsb-bread-link {
    display: inline-flex; align-items: center; gap: 3px;
    color: var(--amz-blue); background: none; border: none;
    cursor: pointer; font-size: 12px; font-family: var(--font);
}
.lsb-bread-link:hover { color: var(--amz-orange-dark); text-decoration: underline; }
.lsb-bread-sep { color: var(--amz-border2); }
.lsb-bread-active { color: var(--amz-muted); }

/* Two-column layout */
.lsb-layout {
    display: grid;
    grid-template-columns: 1fr 290px;
    gap: 16px;
    align-items: start;
}
.lsb-main { display: flex; flex-direction: column; gap: 10px; }

/* Page title block */
.lsb-page-title-block {
    background: var(--amz-surface);
    border: 1px solid var(--amz-border);
    border-top: 4px solid var(--amz-orange);
    border-radius: 4px;
    padding: 18px 22px 16px;
}
.lsb-page-title {
    font-size: 21px; font-weight: 700; color: var(--amz-text);
    font-family: var(--font); margin-bottom: 4px;
}
.lsb-page-sub { font-size: 13px; color: var(--amz-muted); }

/* Form sections */
.lsb-section {
    background: var(--amz-surface);
    border: 1px solid var(--amz-border);
    border-radius: 4px;
    padding: 20px 22px;
}
.lsb-section-head {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 14px; margin-bottom: 16px;
    border-bottom: 1px solid #f0f2f2;
}
.lsb-step-badge {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--amz-navy); color: var(--amz-orange);
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lsb-section-title {
    font-size: 15px; font-weight: 700; color: var(--amz-text);
    font-family: var(--font); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.lsb-optional-badge {
    font-size: 11px; font-weight: 400; color: var(--amz-muted);
    background: #f0f2f2; border-radius: 99px; padding: 2px 8px;
}

/* Grid */
.lsb-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.lsb-span2 { grid-column: 1 / -1; }

/* Fields */
.lsb-field { display: flex; flex-direction: column; }
.lsb-label {
    font-size: 13px; font-weight: 700; color: var(--amz-text);
    margin-bottom: 4px;
}
.lsb-label-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.lsb-req { color: var(--amz-err); }

.lsb-input {
    width: 100%; padding: 7px 10px;
    border: 1px solid #a6a6a6; border-radius: 3px;
    font-size: 13px; color: var(--amz-text);
    background: #fff; font-family: var(--font);
    outline: none; transition: border-color .12s, box-shadow .12s;
    line-height: 1.4;
}
.lsb-input:focus {
    border-color: #e77600;
    box-shadow: 0 0 0 3px rgba(228,121,17,0.25);
}
.lsb-input-disabled {
    background: #f0f2f2; color: var(--amz-muted);
    cursor: not-allowed; border-color: #d5d9d9;
}
.lsb-input-err { border-color: var(--amz-err) !important; }
.lsb-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
}
.lsb-textarea { resize: vertical; line-height: 1.5; min-height: 76px; }
.lsb-err-msg { font-size: 12px; color: var(--amz-err); margin-top: 3px; }
.lsb-hint { font-size: 11px; color: var(--amz-muted); margin-top: 3px; }

.lsb-info-btn {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 11px; color: var(--amz-blue);
    background: none; border: none; cursor: pointer;
    padding: 0; font-family: var(--font);
}
.lsb-info-btn:hover { text-decoration: underline; }

/* Info note */
.lsb-info-note {
    display: flex; align-items: center; gap: 8px;
    background: var(--amz-blue-light); border: 1px solid #c8e6f5;
    border-radius: 3px; padding: 9px 11px;
    font-size: 12px; color: #0066c0;
}

/* Academic banner */
.lsb-academic-banner {
    display: flex; gap: 12px; align-items: flex-start;
    background: var(--amz-academic-bg);
    border: 1px solid var(--amz-academic-border);
    border-left: 4px solid var(--amz-academic);
    border-radius: 3px; padding: 13px; margin-top: 12px;
}
.lsb-academic-icon {
    width: 32px; height: 32px; border-radius: 6px;
    background: var(--amz-academic); color: var(--amz-orange);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lsb-academic-title { font-size: 13px; font-weight: 700; color: var(--amz-academic); }
.lsb-academic-sub { font-size: 12px; color: #3a506b; margin-top: 3px; line-height: 1.5; }

/* Terms */
.lsb-terms-box {
    background: var(--amz-surface); border: 1px solid var(--amz-border);
    border-radius: 4px; padding: 16px 18px;
}
.lsb-terms-label { display: flex; align-items: flex-start; gap: 9px; cursor: pointer; }
.lsb-checkbox-wrap {
    position: relative; flex-shrink: 0;
    width: 17px; height: 17px; margin-top: 1px;
}
.lsb-checkbox-native {
    position: absolute; opacity: 0;
    width: 100%; height: 100%; cursor: pointer; margin: 0;
}
.lsb-checkbox-custom {
    width: 17px; height: 17px;
    border: 1px solid #888c8c; border-radius: 2px;
    background: linear-gradient(to bottom, #f0f2f2, #e3e6e6);
    display: flex; align-items: center; justify-content: center;
    transition: all .12s; pointer-events: none;
}
.lsb-checkbox-custom.checked {
    background: linear-gradient(to bottom, #f0c14b, #e47911);
    border-color: #a66321;
}
.lsb-terms-text { font-size: 13px; color: var(--amz-text); line-height: 1.55; }

/* Buttons */
.lsb-actions { display: flex; gap: 8px; }
.lsb-btn-cancel {
    padding: 8px 18px; border-radius: 3px;
    border: 1px solid #a6a6a6;
    background: linear-gradient(to bottom, #f7f8fa, #e7e9ec);
    font-size: 13px; font-weight: 700; color: var(--amz-text);
    cursor: pointer; font-family: var(--font);
    box-shadow: 0 1px 0 rgba(255,255,255,.6) inset;
    transition: all .1s;
}
.lsb-btn-cancel:hover { background: linear-gradient(to bottom, #e7e9ec, #d9dce0); }
.lsb-btn-cancel:disabled { opacity: .55; cursor: not-allowed; }

.lsb-btn-submit {
    flex: 1; padding: 8px 18px; border-radius: 3px;
    border: 1px solid #c07800;
    background: #082f49;
    font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: var(--font);
    display: flex; align-items: center; justify-content: center; gap: 6px;
    box-shadow: 0 1px 0 rgba(255,255,255,.4) inset, 0 1px 2px rgba(0,0,0,.2);
    transition: all .1s;
}
.lsb-btn-submit:hover:not(:disabled) {
    background: linear-gradient(to bottom, #ddb347, #c96c0c);
}
.lsb-btn-submit:disabled { opacity: .55; cursor: not-allowed; }
.lsb-spin { animation: lsb-spin .8s linear infinite; }

/* Sidebar */
.lsb-sidebar { display: flex; flex-direction: column; gap: 10px; }

.lsb-side-card {
    background: var(--amz-surface); border: 1px solid var(--amz-border);
    border-radius: 4px; padding: 16px;
}
.lsb-side-card-title {
    font-size: 14px; font-weight: 700; color: var(--amz-text);
    margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f2;
    font-family: var(--font);
}

/* Earnings card */
.lsb-earnings-card { border-top: 3px solid var(--amz-orange); }
.lsb-earn-row {
    display: flex; justify-content: space-between;
    align-items: center; padding: 4px 0; font-size: 13px;
}
.lsb-earn-label { color: var(--amz-muted); }
.lsb-earn-val { color: var(--amz-text); font-weight: 500; }
.lsb-earn-neg { color: var(--amz-err); }
.lsb-earn-divider { height: 1px; background: var(--amz-border); margin: 7px 0; }
.lsb-earn-total-label { font-weight: 700; font-size: 13px; color: var(--amz-text); }
.lsb-earn-total-val { font-size: 20px; font-weight: 700; color: var(--amz-green); }
.lsb-earn-badge {
    margin-top: 10px; text-align: center;
    background: #e8f5e9; color: var(--amz-green);
    border-radius: 2px; padding: 4px 12px;
    font-size: 12px; font-weight: 700; border: 1px solid #c8e6c9;
}

/* Benefit rows */
.lsb-benefit-row {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 7px 0; border-bottom: 1px solid #f7f8fa;
}
.lsb-benefit-row:last-child { border-bottom: none; }
.lsb-benefit-icon {
    width: 26px; height: 26px; border-radius: 4px;
    background: #fff8e7; color: var(--amz-orange-dark);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; border: 1px solid #ffd580;
}
.lsb-benefit-t { font-size: 13px; font-weight: 700; color: var(--amz-text); }
.lsb-benefit-s { font-size: 11px; color: var(--amz-muted); margin-top: 1px; }

/* Help card */
.lsb-help-card { background: #f7fbff; border-color: #c8e6f5; }
.lsb-help-title { font-size: 13px; font-weight: 700; color: var(--amz-text); margin-bottom: 5px; }
.lsb-help-sub { font-size: 12px; color: var(--amz-muted); line-height: 1.5; margin-bottom: 8px; }
.lsb-help-link { font-size: 12px; color: var(--amz-blue); text-decoration: none; font-weight: 700; }
.lsb-help-link:hover { color: var(--amz-orange-dark); text-decoration: underline; }

/* Modal */
.lsb-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.52);
    z-index: 50; display: flex;
    align-items: center; justify-content: center; padding: 16px;
}
.lsb-modal {
    background: #fff; border-radius: 4px;
    width: 100%; max-width: 430px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.28);
    max-height: 90vh; overflow-y: auto;
}
.lsb-modal-header {
    display: flex; align-items: center; gap: 11px;
    padding: 16px 18px 12px; border-bottom: 1px solid var(--amz-border);
}
.lsb-modal-icon {
    width: 36px; height: 36px; border-radius: 4px;
    background: var(--amz-navy); color: var(--amz-orange);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lsb-modal-title { font-size: 14px; font-weight: 700; color: var(--amz-text); }
.lsb-modal-sub { font-size: 12px; color: var(--amz-muted); margin-top: 1px; }
.lsb-modal-close {
    margin-left: auto; background: none; border: none;
    color: var(--amz-muted); cursor: pointer; padding: 4px; border-radius: 3px;
}
.lsb-modal-close:hover { background: #f0f2f2; color: var(--amz-text); }
.lsb-modal-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 9px; }
.lsb-modal-item {
    display: flex; gap: 11px; align-items: flex-start;
    padding: 11px 12px; background: #fafafa;
    border: 1px solid #f0f2f2; border-radius: 3px;
}
.lsb-modal-emoji { font-size: 18px; flex-shrink: 0; line-height: 1.4; }
.lsb-modal-item-t { font-size: 13px; font-weight: 700; color: var(--amz-text); }
.lsb-modal-item-d { font-size: 12px; color: var(--amz-muted); margin-top: 2px; line-height: 1.5; }
.lsb-modal-note { font-size: 11px; color: var(--amz-muted); text-align: center; }

/* Toast */
.lsb-toast {
    position: fixed; bottom: 20px; right: 16px; z-index: 60;
    display: flex; align-items: flex-start; gap: 9px;
    min-width: 290px; max-width: 360px;
    background: #fff; border-radius: 4px;
    padding: 12px 13px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
    border: 1px solid var(--amz-border);
    border-left: 4px solid transparent;
    animation: lsb-slide-up .25s ease;
    font-family: var(--font);
}
@keyframes lsb-slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
}
.lsb-toast-error { border-left-color: var(--amz-err); }
.lsb-toast-success { border-left-color: var(--amz-green); }
.lsb-toast-icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lsb-toast-error .lsb-toast-icon { background: #fff0f3; color: var(--amz-err); }
.lsb-toast-success .lsb-toast-icon { background: #e8f5e9; color: var(--amz-green); }
.lsb-toast-body { flex: 1; }
.lsb-toast-title { font-size: 13px; font-weight: 700; color: var(--amz-text); }
.lsb-toast-msg { font-size: 12px; color: var(--amz-muted); margin-top: 2px; line-height: 1.5; }
.lsb-toast-close {
    background: none; border: none;
    color: var(--amz-muted); cursor: pointer; padding: 2px; flex-shrink: 0;
}
.lsb-toast-close:hover { color: var(--amz-text); }

/* ── RESPONSIVE ── */
@media (max-width: 860px) {
    .lsb-layout { grid-template-columns: 1fr; }
    .lsb-sidebar {
        order: -1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 600px) {
    .lsb-root { padding: 10px 12px 60px; }
    .lsb-sidebar { grid-template-columns: 1fr; }
    .lsb-grid2 { grid-template-columns: 1fr; }
    .lsb-span2 { grid-column: auto; }
    .lsb-section { padding: 14px 15px; }
    .lsb-page-title-block { padding: 14px 15px; }
    .lsb-page-title { font-size: 18px; }
    .lsb-actions { flex-direction: column; }
    .lsb-btn-cancel { order: 2; text-align: center; }
    .lsb-btn-submit { order: 1; }
    .lsb-earn-total-val { font-size: 17px; }
}
@media (max-width: 360px) {
    .lsb-page-title { font-size: 16px; }
    .lsb-logo { font-size: 17px; }
}
`;