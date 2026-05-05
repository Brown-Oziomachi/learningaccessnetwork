"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, AlertCircle, X, GraduationCap, BookOpen, ChevronRight, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { booksData } from "@/lib/booksData";
import Navbar from '@/components/NavBar';
import { usePayment } from '../hooks/usePayment';
import { fetchBookDetails, validateBookForPurchase, fetchSellerDetails } from '@/utils/bookUtils';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { PaymentForm } from '@/components/PaymentForm';
import { OrderSummary } from '@/components/OrderSummary';

/* ─── colour tokens ───────────────────────────────────────────── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

const getThumbnailUrl = (book) => {
    if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
    if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
    if (book.embedUrl) {
        const match = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
        if (match) {
            const fileId = match[1] || match[2] || match[3];
            if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
        }
    }
    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com')) {
        const match = book.pdfUrl.match(/[-\w]{25,}/);
        if (match) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w400`;
    }
    return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};

const bookIsFromLecturer = (book, sellerDetails) => {
    if (!book || !sellerDetails) return false;
    return (
        book.sellerRole === 'lecturer' ||
        book.isLecturer === true ||
        sellerDetails?.role === 'lecturer' ||
        sellerDetails?.isLecturer === true
    );
};

const completeReferralOnPurchase = async (buyerUid) => {
    try {
        if (!buyerUid) return;
        const userDoc = await getDoc(doc(db, 'users', buyerUid));
        if (!userDoc.exists()) return;
        const referredBy = userDoc.data()?.referredBy;
        if (!referredBy) return;
        const refQuery = query(
            collection(db, 'referrals'),
            where('referredUserId', '==', buyerUid),
            where('status', '==', 'pending')
        );
        const refSnap = await getDocs(refQuery);
        if (refSnap.empty) return;
        const updates = refSnap.docs.map(refDoc =>
            updateDoc(refDoc.ref, { status: 'completed', completedAt: serverTimestamp() })
        );
        await Promise.all(updates);
    } catch (err) {
        console.error('Error completing referral:', err);
    }
};

export default function PaymentClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawBookId = searchParams.get('bookId');
    const bookId = rawBookId?.startsWith('firestore-') ? rawBookId : `firestore-${rawBookId}`;

    const [allBooks, setAllBooks] = useState([]);
    const [book, setBook] = useState(null);
    const [sellerDetails, setSellerDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('flutterwave');
    const [referralCompleted, setReferralCompleted] = useState(false);
    const [alreadyPurchased, setAlreadyPurchased] = useState(false);
    const [isLecturerSeller, setIsLecturerSeller] = useState(false);
    const [studentDepartment, setStudentDepartment] = useState('');
    const [departmentError, setDepartmentError] = useState('');
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentModalStep, setStudentModalStep] = useState('question');
    const [isClassStudent, setIsClassStudent] = useState(null);
    const [studentRegNo, setStudentRegNo] = useState('');
    const [regNoError, setRegNoError] = useState('');
    const [pendingPaymentAction, setPendingPaymentAction] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinView, setPinView] = useState('enter');
    const [setupPin, setSetupPin] = useState('');
    const [setupPinConfirm, setSetupPinConfirm] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [newResetPin, setNewResetPin] = useState('');
    const [pinLocalError, setPinLocalError] = useState('');
    const pendingRegNoRef = useRef(null);
    const [formData, setFormData] = useState({
        email: auth.currentUser?.email || '',
        phone: '',
        name: ''
    });

    const {
        processing,
        paymentSuccess,
        setPaymentSuccess,
        error: paymentError,
        setError: setPaymentError,
        processFlutterwavePayment,
        processPayPalPayment,
        processWalletPayment,
        setupInitialPin,
        requestPinReset,
        verifyOtpAndSetPin,
    } = usePayment(book, formData, sellerDetails);

    const pinNotSet = paymentError?.message?.includes("haven't set");

    useEffect(() => {
        const loadBook = async () => {
            if (!bookId) { setError("No book ID provided"); setLoading(false); return; }
            try {
                setLoading(true);
                const bookData = await fetchBookDetails(bookId);
                if (!bookData) { setError("Book not found"); setLoading(false); return; }
                const validation = validateBookForPurchase(bookData);
                if (!validation.valid) { setError(validation.error); setLoading(false); return; }
                setBook(bookData);
                try {
                    const uid = auth.currentUser?.uid;
                    if (uid) {
                        const userSnap = await getDoc(doc(db, 'users', uid));
                        const purchasedBooks = userSnap.data()?.purchasedBooks || {};
                        const rawId = bookId.replace('firestore-', '');
                        if (purchasedBooks[bookId] || purchasedBooks[rawId]) {
                            setAlreadyPurchased(true);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (purchaseErr) {
                    console.warn('Purchase check failed:', purchaseErr.message);
                }
                const sellerInfo = await fetchSellerDetails(bookData);
                if (sellerInfo) {
                    setSellerDetails(sellerInfo);
                    try {
                        const sellerId = sellerInfo.id || bookData.sellerId || bookData.userId;
                        if (sellerId) {
                            const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
                            if (sellerSnap.exists()) {
                                const rawSeller = sellerSnap.data();
                                setIsLecturerSeller(rawSeller?.title?.toLowerCase() === 'lecturer');
                                setSellerDetails(prev => ({
                                    ...prev,
                                    title: rawSeller.title,
                                    sellerName: rawSeller.sellerName || prev?.sellerName,
                                    businessName: rawSeller.businessInfo?.businessName || prev?.businessName,
                                }));
                            }
                        }
                    } catch (sellerErr) {
                        console.warn('Could not fetch raw seller doc:', sellerErr.message);
                    }
                } else {
                    setError("Seller information unavailable");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                setError("Failed to load book details: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadBook();
    }, [bookId]);

    useEffect(() => {
        if (paymentSuccess) {
            setTimeout(() => {
                router.push(`/book/preview?id=${bookId}&purchased=true`);
            }, 3000);
        }
    }, [paymentSuccess, bookId, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const executePayment = (method) => {
        const extraData = {
            studentRegNo: studentRegNo || null,
            department: studentDepartment || null,
        };
        if (method === 'flutterwave') {
            processFlutterwavePayment(extraData);
        } else if (method === 'paypal') {
            const cover = encodeURIComponent(getThumbnailUrl(book));
            const params = new URLSearchParams({
                bookId: rawBookId || bookId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                price: book.price,
                title: book.title,
                author: book.author || '',
                cover,
                studentRegNo: studentRegNo || '',
                department: studentDepartment || '',
            });
            router.push(`/payment/paypal-checkout?${params.toString()}`);
        } else if (method === 'wallet') {
            pendingRegNoRef.current = {
                studentRegNo: studentRegNo || null,
                department: studentDepartment || null,
            };
            setEnteredPin('');
            setPinLocalError('');
            setPinView('enter');
            setPaymentError(null);
            setShowPinModal(true);
        }
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.phone || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }
        if (isLecturerSeller) {
            setPendingPaymentAction(paymentMethod);
            setStudentModalStep('question');
            setIsClassStudent(null);
            setStudentRegNo('');
            setRegNoError('');
            setShowStudentModal(true);
            return;
        }
        executePayment(paymentMethod);
    };

    const handleStudentChoice = (choice) => {
        setIsClassStudent(choice);
        if (choice) {
            setStudentModalStep('regNo');
        } else {
            setShowStudentModal(false);
            executePayment(pendingPaymentAction);
        }
    };

    const handleRegNoSubmit = () => {
        if (!studentRegNo.trim()) { setRegNoError('Please enter your registration number.'); return; }
        if (!studentDepartment.trim()) { setDepartmentError('Please enter your department.'); return; }
        setRegNoError('');
        setDepartmentError('');
        setShowStudentModal(false);
        executePayment(pendingPaymentAction);
    };

    const handlePinConfirm = () => {
        setPinLocalError('');
        if (!enteredPin || enteredPin.length < 4) { setPinLocalError('Please enter your 4-digit PIN.'); return; }
        processWalletPayment(enteredPin, pendingRegNoRef.current);
        setShowPinModal(false);
        setEnteredPin('');
    };

    const handleSetupPin = async () => {
        setPinLocalError('');
        if (setupPin.length < 4) { setPinLocalError('PIN must be 4 digits.'); return; }
        if (setupPin !== setupPinConfirm) { setPinLocalError('PINs do not match.'); return; }
        const result = await setupInitialPin(setupPin);
        if (result.success) {
            setSetupPin(''); setSetupPinConfirm(''); setPinView('enter'); setPaymentError(null);
        }
    };

    const handleRequestOtp = async () => {
        setPinLocalError('');
        const result = await requestPinReset();
        if (result.success) { setPinView('otp'); }
        else { setPinLocalError('Failed to send code. Try again.'); }
    };

    const handleVerifyOtp = async () => {
        setPinLocalError('');
        if (otpInput.length < 6) { setPinLocalError('Enter the 6-digit code.'); return; }
        if (newResetPin.length < 4) { setPinLocalError('New PIN must be 4 digits.'); return; }
        try {
            await verifyOtpAndSetPin(otpInput, newResetPin);
            setOtpInput(''); setNewResetPin(''); setPinView('enter'); setPaymentError(null);
        } catch (err) { setPinLocalError(err.message); }
    };

    const lecturerName = sellerDetails?.name || book?.sellerName || 'your Lecturer';

    /* ── Shared modal styles ── */
    const modalOverlay = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    };
    const modalBox = {
        background: '#fff', width: '100%', maxWidth: '400px', overflow: 'hidden',
        border: `0.5px solid rgba(184,150,62,0.3)`,
    };
    const modalHeader = {
        background: NAVY,
        backgroundImage: 'radial-gradient(rgba(184,150,62,0.06) 1px,transparent 1px)',
        backgroundSize: '24px 24px',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(184,150,62,0.2)',
    };
    const modalCloseBtn = {
        width: '32px', height: '32px',
        border: '0.5px solid rgba(255,255,255,0.2)',
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.6)',
    };
    const inputStyle = (hasError) => ({
        width: '100%', padding: '12px 14px',
        border: `0.5px solid ${hasError ? '#ef4444' : '#e5ddd0'}`,
        background: CREAM, fontSize: '13px', color: NAVY,
        fontFamily: "'Lato',sans-serif", outline: 'none',
        boxSizing: 'border-box', marginBottom: '4px',
    });
    const navyBtn = {
        width: '100%', background: NAVY, color: '#fff',
        padding: '13px', border: 'none', fontSize: '12px',
        fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif",
        letterSpacing: '0.06em', transition: 'background 0.18s',
    };
    const goldBtn = {
        width: '100%', background: GOLD, color: NAVY,
        padding: '13px', border: 'none', fontSize: '12px',
        fontWeight: 700, cursor: 'pointer', fontFamily: "'Lato',sans-serif",
        letterSpacing: '0.06em',
    };

    /* ════════════════════════════════════════════════════════════════
       LOADING
    ════════════════════════════════════════════════════════════════ */
    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', color: NAVY }}>Loading book details…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    /* ════════════════════════════════════════════════════════════════
       ALREADY PURCHASED
    ════════════════════════════════════════════════════════════════ */
    if (alreadyPurchased && book) return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap');`}</style>
            <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Lato',sans-serif" }}>
                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '40px 32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', border: `0.5px solid rgba(184,150,62,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: CREAM }}>
                        <CheckCircle size={28} style={{ color: '#16a34a' }} />
                    </div>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', fontFamily: "'Lato',sans-serif" }}>Already Purchased</p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: NAVY, margin: '0 0 10px' }}>You already own this!</h2>
                    <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.7, margin: '0 0 20px', fontFamily: "'Lato',sans-serif" }}>
                        You've already purchased <strong style={{ color: NAVY }}>{book.title}</strong>. Head to your library to read it anytime.
                    </p>
                    <img src={getThumbnailUrl(book)} alt={book.title}
                        style={{ width: '80px', aspectRatio: '3/4', objectFit: 'cover', display: 'block', margin: '0 auto 24px', border: '0.5px solid #e5ddd0' }}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link href={`/book/preview?id=${bookId}&purchased=true`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: NAVY, color: '#fff', padding: '13px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em' }}>
                            <BookOpen size={14} /> READ BOOK NOW
                        </Link>
                        <Link href="/my-books"
                            style={{ display: 'block', padding: '13px', border: `0.5px solid #e5ddd0`, color: NAVY, fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', textAlign: 'center' }}>
                            GO TO MY LIBRARY
                        </Link>
                        <button onClick={() => router.back()}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '12px', fontFamily: "'Lato',sans-serif", padding: '8px' }}>
                            ← Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    /* ════════════════════════════════════════════════════════════════
       ERROR
    ════════════════════════════════════════════════════════════════ */
    if (error || !book) return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap');`}</style>
            <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Lato',sans-serif" }}>
                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '48px 32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', border: '0.5px solid #fca5a5', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Book Not Found</p>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 24px', fontFamily: "'Lato',sans-serif" }}>{error || "The book you're looking for doesn't exist."}</p>
                    <button onClick={() => window.history.back()} style={{ ...navyBtn, width: 'auto', padding: '12px 28px' }}>GO BACK</button>
                </div>
            </div>
        </>
    );

    /* ════════════════════════════════════════════════════════════════
       PAYMENT SUCCESS
    ════════════════════════════════════════════════════════════════ */
    if (paymentSuccess) return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900&family=Lato:wght@300;400;700&display=swap');`}</style>
            <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Lato',sans-serif" }}>
                <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '40px 32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', border: '0.5px solid #86efac', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle size={28} style={{ color: '#16a34a' }} />
                    </div>
                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px' }}>Payment Confirmed</p>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: NAVY, margin: '0 0 20px' }}>Payment Successful!</h2>
                    <div style={{ background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                        {[['Email', formData.email], ['Book', book.title], ['Amount', `₦${book.price.toLocaleString()}`], sellerDetails ? ['Seller', sellerDetails.name] : null].filter(Boolean).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '0.5px solid rgba(184,150,62,0.15)' }}>
                                <span style={{ color: '#aaa' }}>{k}</span>
                                <span style={{ fontWeight: 700, color: NAVY, maxWidth: '200px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>Redirecting to book preview…</p>
                    <Link href={`/book/preview?id=${bookId}&purchased=true`} style={{ display: 'block', background: NAVY, color: '#fff', padding: '13px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', textAlign: 'center' }}>
                        VIEW YOUR BOOK
                    </Link>
                </div>
            </div>
        </>
    );

    /* ════════════════════════════════════════════════════════════════
       MAIN PAYMENT PAGE
    ════════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .pay-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
                .related-card { text-decoration:none; display:block; }
                .related-card img { transition:box-shadow 0.2s; }
                .related-card:hover img { box-shadow:0 8px 24px rgba(13,34,68,0.18); }
                .related-card h4 { font-family:'Playfair Display',serif; font-size:11px; font-weight:700; color:${NAVY}; margin:6px 0 3px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
                .related-card p { font-size:10px; color:#aaa; margin:0; }
                .section-card { background:#fff; border:0.5px solid #e5ddd0; padding:24px; margin-bottom:16px; }
                .meta-row { display:flex; justify-content:space-between; font-size:11px; padding:7px 0; border-bottom:0.5px solid #f0ebe0; }
                .warn-bar { background:rgba(234,179,8,0.08); border:0.5px solid rgba(234,179,8,0.3); padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
                .promo-bar { background:${NAVY}; backgroundImage:radial-gradient(rgba(184,150,62,0.08) 1px,transparent 1px); backgroundSize:24px 24px; color:#fff; padding:14px 20px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; border:0.5px solid rgba(184,150,62,0.2); }
            `}</style>

            <div className="pay-root">
                <Navbar />

                <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>

                    {/* Page title */}
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>Checkout</p>
                        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '26px', fontWeight: 700, color: NAVY, margin: 0 }}>Complete Your Purchase</h1>
                    </div>

                    {/* Seller warning */}
                    {!sellerDetails && (
                        <div className="warn-bar">
                            <AlertCircle size={16} style={{ color: '#ca8a04', flexShrink: 0 }} />
                            <p style={{ fontSize: '12px', color: '#713f12', fontWeight: 700, margin: 0 }}>Warning: Seller information is missing.</p>
                        </div>
                    )}

                    {/* Book hero card */}
                    <div className="section-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img src={getThumbnailUrl(book)} alt={'Cover of ' + book.title}
                                    style={{ width: '100px', aspectRatio: '3/4', objectFit: 'cover', display: 'block', border: '0.5px solid #e5ddd0' }}
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
                                    loading="lazy"
                                />
                                <span style={{ position: 'absolute', top: '6px', left: '6px', background: NAVY, color: GOLD, fontSize: '7px', fontWeight: 700, padding: '2px 5px', fontFamily: "'Lato',sans-serif" }}>PDF</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>
                                    {book.category || 'Document'}
                                </p>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.3 }}>{book.title}</h2>
                                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px', fontFamily: "'Lato',sans-serif" }}>by {book.author}</p>
                                <p style={{ fontSize: '22px', fontWeight: 700, color: NAVY, fontFamily: "'Playfair Display',serif", margin: '0 0 12px' }}>₦{book.price.toLocaleString()}</p>
                                {book.source === 'platform' && (
                                    <span style={{ display: 'inline-block', background: CREAM, border: '0.5px solid rgba(184,150,62,0.3)', color: NAVY, fontSize: '9px', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.08em', fontFamily: "'Lato',sans-serif" }}>PLATFORM BOOK</span>
                                )}
                            </div>
                        </div>
                                {book.description && (
                                    <div style={{ marginTop: '14px', background: CREAM, border: '0.5px solid rgba(184,150,62,0.15)', padding: '12px 14px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>Description</p>
                                        <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.65, margin: 0 }}>{book.description}</p>
                                    </div>
                                )}
                    </div>

                    {/* Promo bar */}
                    <div className="promo-bar">
                        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '14px', fontWeight: 700, margin: 0 }}>Save 80% by selling on LAN Library!</p>
                        <span style={{ fontSize: '9px', color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Learn more →</span>
                    </div>

                    {/* Main grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="pay-grid">
                        <style>{`@media(min-width:1024px){ .pay-grid{ grid-template-columns:1fr 320px !important; } }`}</style>

                        {/* LEFT: Payment form */}
                        <div>
                            <div className="section-card">
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>Step 1</p>
                                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 20px' }}>Payment Information</h3>
                                <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
                                <PaymentForm
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    processing={processing}
                                    onSubmit={handlePayment}
                                    paymentMethod={paymentMethod}
                                    book={book}
                                    paymentError={paymentError}
                                />
                                {/* Referral strip */}
                                <div style={{ marginTop: '16px', background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{ fontSize: '12px', color: NAVY, fontWeight: 700, margin: 0 }}>Invite friends & earn ₦500</p>
                                    <Link href="/referral" style={{ fontSize: '11px', fontWeight: 700, color: GOLD, textDecoration: 'none', fontFamily: "'Lato',sans-serif" }}>Get link →</Link>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Order summary */}
                        <div>
                            <OrderSummary book={book} sellerDetails={sellerDetails} />
                        </div>
                    </div>

                    {/* You might also like */}
                    <div style={{ marginTop: '40px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>Discover</p>
                        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>You Might Also Like</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }} className="also-grid">
                            <style>{`@media(min-width:640px){ .also-grid{ grid-template-columns:repeat(3,1fr) !important; } } @media(min-width:1024px){ .also-grid{ grid-template-columns:repeat(5,1fr) !important; } }`}</style>
                            {(allBooks.length > 0 ? allBooks : booksData)
                                .filter(rb => rb.id !== bookId)
                                .slice(0, 10)
                                .map(rb => (
                                    <Link key={rb.id} href={`/book/preview?id=${rb.id}`} className="related-card">
                                        <div style={{ position: 'relative' }}>
                                            <img src={getThumbnailUrl(rb)} alt={rb.title}
                                                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', border: '0.5px solid #e5ddd0' }}
                                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }}
                                                loading="lazy"
                                            />
                                            <span style={{ position: 'absolute', top: '5px', left: '5px', background: NAVY, color: GOLD, fontSize: '7px', fontWeight: 700, padding: '2px 5px', fontFamily: "'Lato',sans-serif" }}>PDF</span>
                                        </div>
                                        <h4>{rb.title}</h4>
                                        <p>{rb.author}</p>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </main>

                {/* ══════════════════════════════════════════════════════
                    STUDENT IDENTITY MODAL
                ══════════════════════════════════════════════════════ */}
                {showStudentModal && (
                    <div style={modalOverlay}>
                        <div style={modalBox}>
                            <div style={modalHeader}>
                                <div>
                                    <p style={{ fontSize: '9px', color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>Almost there</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>One quick question</p>
                                </div>
                                <button style={modalCloseBtn}
                                    onClick={() => { setShowStudentModal(false); setIsClassStudent(null); setStudentRegNo(''); setStudentDepartment(''); setRegNoError(''); setDepartmentError(''); }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ padding: '24px' }}>

                                {/* ── Step 1: Yes / No ── */}
                                {studentModalStep === 'question' && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: CREAM, border: '0.5px solid rgba(184,150,62,0.2)', padding: '12px 14px', marginBottom: '16px' }}>
                                            <div style={{ width: '36px', height: '36px', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <GraduationCap size={16} style={{ color: GOLD }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '9px', color: GOLD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>Uploaded by</p>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>{lecturerName}</p>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65, marginBottom: '16px', fontFamily: "'Lato',sans-serif" }}>
                                            Are you a student of <strong style={{ color: NAVY }}>{lecturerName}</strong>?
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button onClick={() => handleStudentChoice(true)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: `1.5px solid ${NAVY}`, background: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>Yes, I'm in this lecturer's class</p>
                                                    <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>Reg No required for class records</p>
                                                </div>
                                                <ChevronRight size={16} style={{ color: NAVY, flexShrink: 0 }} />
                                            </button>

                                            <button onClick={() => handleStudentChoice(false)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '0.5px solid #e5ddd0', background: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = CREAM}
                                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#555', margin: '0 0 2px', fontFamily: "'Lato',sans-serif" }}>No, I'm buying for personal study</p>
                                                    <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'Lato',sans-serif" }}>Reg No not required</p>
                                                </div>
                                                <ChevronRight size={16} style={{ color: '#ccc', flexShrink: 0 }} />
                                            </button>
                                        </div>

                                        <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', marginTop: '16px', lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                            This helps <span style={{ color: '#888' }}>{lecturerName}</span> track which students have accessed the course material.
                                        </p>
                                    </>
                                )}

                                {/* ── Step 2: Reg No + Dept ── */}
                                {studentModalStep === 'regNo' && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <BookOpen size={14} style={{ color: NAVY }} />
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Lato',sans-serif" }}>Enter your details</p>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px', lineHeight: 1.6, fontFamily: "'Lato',sans-serif" }}>
                                            Your details will be recorded so <strong style={{ color: '#666' }}>{lecturerName}</strong> can verify access.
                                        </p>

                                        <input type="text" value={studentRegNo}
                                            onChange={e => { setStudentRegNo(e.target.value); if (regNoError) setRegNoError(''); }}
                                            style={inputStyle(!!regNoError)}
                                            placeholder="Registration number e.g. 2021/123456"
                                            autoFocus
                                        />
                                        {regNoError && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                                                <p style={{ fontSize: '11px', color: '#ef4444', margin: 0, fontFamily: "'Lato',sans-serif" }}>{regNoError}</p>
                                            </div>
                                        )}

                                        <input type="text" value={studentDepartment}
                                            onChange={e => { setStudentDepartment(e.target.value); if (departmentError) setDepartmentError(''); }}
                                            style={{ ...inputStyle(!!departmentError), marginTop: regNoError ? '0' : '8px' }}
                                            placeholder="Department e.g. Computer Science"
                                        />
                                        {departmentError && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                                                <p style={{ fontSize: '11px', color: '#ef4444', margin: 0, fontFamily: "'Lato',sans-serif" }}>{departmentError}</p>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button onClick={handleRegNoSubmit} style={navyBtn}>CONFIRM & PROCEED TO PAYMENT</button>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ flex: 1, height: '0.5px', background: '#e5ddd0' }} />
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>or</span>
                                                <div style={{ flex: 1, height: '0.5px', background: '#e5ddd0' }} />
                                            </div>
                                            <button onClick={() => { setStudentModalStep('question'); setRegNoError(''); setDepartmentError(''); }}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '11px', fontFamily: "'Lato',sans-serif", padding: '6px' }}>
                                                ← Back
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════
                    PIN MODAL
                ══════════════════════════════════════════════════════ */}
                {showPinModal && (
                    <div style={modalOverlay}>
                        <div style={modalBox}>
                            <div style={modalHeader}>
                                <div>
                                    <p style={{ fontSize: '9px', color: GOLD, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>Confirm payment</p>
                                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                        {pinView === 'setup' ? 'Create Your PIN' : pinView === 'forgot' ? 'Reset PIN' : pinView === 'otp' ? 'Enter Reset Code' : 'Enter Your PIN'}
                                    </p>
                                </div>
                                <button style={modalCloseBtn} onClick={() => { setShowPinModal(false); setEnteredPin(''); setPinLocalError(''); setPinView('enter'); }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ padding: '24px' }}>
                                {(pinLocalError || paymentError) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff1f2', border: '0.5px solid #fca5a5', padding: '10px 14px', marginBottom: '16px' }}>
                                        <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                                        <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, fontFamily: "'Lato',sans-serif" }}>{pinLocalError || paymentError?.message}</p>
                                    </div>
                                )}

                                {/* ── Enter PIN ── */}
                                {pinView === 'enter' && (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>
                                            Authorise payment of <strong style={{ color: NAVY }}>₦{book.price.toLocaleString()}</strong> for <strong style={{ color: NAVY }}>{book.title}</strong>
                                        </p>

                                        {/* PIN dots */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                                            {Array.from({ length: 4 }, (_, i) => i < enteredPin.length).map((filled, i) => (
                                                <div key={i} style={{ width: '52px', height: '54px', border: `1.5px solid ${filled ? NAVY : '#e5ddd0'}`, background: filled ? CREAM : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: filled ? NAVY : '#e5ddd0', transition: 'all 0.15s' }}>
                                                    {filled ? '●' : '○'}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px', fontFamily: "'Lato',sans-serif" }}>
                                            <button onClick={() => { setPinView('forgot'); setPinLocalError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: GOLD, fontSize: '11px', fontWeight: 700 }}>Forgot PIN?</button>
                                            {pinNotSet && (
                                                <button onClick={() => { setPinView('setup'); setPinLocalError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '11px', fontWeight: 700 }}>Setup PIN Now</button>
                                            )}
                                        </div>

                                        {/* Numpad */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '6px' }}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                <button key={n} onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + String(n)); setPinLocalError(''); setPaymentError(null); } }}
                                                    disabled={enteredPin.length >= 4}
                                                    style={{ height: '50px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '18px', fontWeight: 700, color: NAVY, cursor: 'pointer', transition: 'background 0.12s', fontFamily: "'Lato',sans-serif" }}>
                                                    {n}
                                                </button>
                                            ))}
                                    </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '16px' }}>
                                    <div />
                                    <button onClick={() => { if (enteredPin.length < 4) { setEnteredPin(p => p + '0'); setPinLocalError(''); setPaymentError(null); } }}
                                        disabled={enteredPin.length >= 4}
                                        style={{ height: '50px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '18px', fontWeight: 700, color: NAVY, cursor: 'pointer', fontFamily: "'Lato',sans-serif'" }}>
                                        0
                                    </button>
                                    <button onClick={() => setEnteredPin(p => p.slice(0, -1))}
                                        style={{ height: '50px', border: '0.5px solid #e5ddd0', background: '#fff', fontSize: '18px', color: '#aaa', cursor: 'pointer' }}>
                                        ⌫
                                    </button>
                                </div>

                                <button onClick={handlePinConfirm} disabled={enteredPin.length < 4 || processing} style={{ ...navyBtn, opacity: (enteredPin.length < 4 || processing) ? 0.4 : 1 }}>
                                    {processing ? 'Verifying…' : 'CONFIRM PAYMENT'}
                                </button>
                            </>
                                )}

                            {/* ── Setup PIN ── */}
                            {pinView === 'setup' && (
                                <>
                                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginBottom: '16px', fontFamily: "'Lato',sans-serif" }}>Create a 4-digit wallet PIN</p>
                                    <input type="password" value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle(false), textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }} placeholder="New PIN" maxLength={4} inputMode="numeric" />
                                    <input type="password" value={setupPinConfirm} onChange={e => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle(false), textAlign: 'center', fontSize: '22px', letterSpacing: '8px', marginTop: '8px' }} placeholder="Confirm PIN" maxLength={4} inputMode="numeric" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                                        <button onClick={handleSetupPin} disabled={processing || setupPin.length < 4 || setupPinConfirm.length < 4} style={{ ...goldBtn, opacity: (processing || setupPin.length < 4 || setupPinConfirm.length < 4) ? 0.4 : 1 }}>
                                            {processing ? 'SAVING…' : 'SET PIN & CONTINUE'}
                                        </button>
                                        <button onClick={() => { setPinView('enter'); setPinLocalError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '11px', fontFamily: "'Lato',sans-serif", padding: '6px' }}>Back</button>
                                    </div>
                                </>
                            )}

                            {/* ── Forgot PIN ── */}
                            {pinView === 'forgot' && (
                                <>
                                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginBottom: '20px', fontFamily: "'Lato',sans-serif" }}>We'll send a 6-digit reset code to verify your identity.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button onClick={handleRequestOtp} disabled={processing} style={{ ...navyBtn, opacity: processing ? 0.5 : 1 }}>
                                            {processing ? 'SENDING…' : 'SEND RESET CODE'}
                                        </button>
                                        <button onClick={() => { setPinView('enter'); setPinLocalError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '11px', fontFamily: "'Lato',sans-serif", padding: '6px' }}>Back</button>
                                    </div>
                                </>
                            )}

                            {/* ── OTP + new PIN ── */}
                            {pinView === 'otp' && (
                                <>
                                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginBottom: '16px', fontFamily: "'Lato',sans-serif" }}>Enter the 6-digit code and your new PIN</p>
                                    <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ ...inputStyle(false), textAlign: 'center', fontSize: '18px', letterSpacing: '6px' }} placeholder="6-digit code" maxLength={6} inputMode="numeric" />
                                    <input type="password" value={newResetPin} onChange={e => setNewResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={{ ...inputStyle(false), textAlign: 'center', fontSize: '22px', letterSpacing: '8px', marginTop: '8px' }} placeholder="New 4-digit PIN" maxLength={4} inputMode="numeric" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                                        <button onClick={handleVerifyOtp} disabled={processing || otpInput.length < 6 || newResetPin.length < 4} style={{ ...navyBtn, opacity: (processing || otpInput.length < 6 || newResetPin.length < 4) ? 0.4 : 1 }}>
                                            {processing ? 'VERIFYING…' : 'RESET PIN & CONTINUE'}
                                        </button>
                                        <button onClick={() => { setPinView('forgot'); setPinLocalError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '11px', fontFamily: "'Lato',sans-serif", padding: '6px' }}>Back</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    </div>
                )}
        </div >
        </>
    );
}