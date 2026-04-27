"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { createUserAccount } from '@/lib/auth/authHelpers';

/* ─── colour tokens (match homepage) ─── */
const NAVY = "#0d2244";
const GOLD = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG = "#f5f1ea";

export default function ConfirmClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [accountType, setAccountType] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        email: '',
        password: '',
        country: '',
        role: '',
        studentSubRole: '',
        studyLevel: '',
        fieldOfStudy: '',
        institution: '',
    });

    const subRoleLabels = {
        undergraduate: 'Undergraduate',
        postgraduate: 'Postgraduate',
        researcher: 'PhD / Researcher',
        professional: 'Professional learner',
    };

    useEffect(() => {
        const role = searchParams.get('role') || sessionStorage.getItem('userRole') || 'student';
        setUserRole(role);
        const type = searchParams.get('accountType') || '';
        setAccountType(type);
        const refFromSession = sessionStorage.getItem('referredBy') || '';
        const refFromUrl = searchParams.get('referral_code') || '';
        setReferredBy(refFromSession || refFromUrl);
        setFormData({
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            password: searchParams.get('password') || '',
            country: searchParams.get('country') || '',
            role,
            studentSubRole: searchParams.get('studentSubRole') || sessionStorage.getItem('studentSubRole') || '',
            studyLevel: searchParams.get('studyLevel') || sessionStorage.getItem('studyLevel') || '',
            fieldOfStudy: searchParams.get('fieldOfStudy') || sessionStorage.getItem('fieldOfStudy') || '',
            institution: searchParams.get('institution') || sessionStorage.getItem('institution') || '',
        });
    }, [searchParams]);

    const handleRedirect = (role, type) => {
        if (type === 'university' || role === 'university') {
            router.push('/register-school?type=university');
        } else if (role === 'seller') {
            router.push('/become-seller');
        } else {
            router.push('/student/dashboard');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await createUserAccount({
                firstName: formData.firstName,
                surname: formData.surname,
                dateOfBirth: formData.dateOfBirth,
                email: formData.email,
                password: formData.password,
                country: formData.country,
                role: userRole,
                referredBy: referredBy || null,
                studentSubRole: formData.studentSubRole || null,
                studyLevel: formData.studyLevel || null,
                fieldOfStudy: formData.fieldOfStudy || null,
                institution: formData.institution || null,
            });

            if (result.success) {
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('referredBy');
                sessionStorage.removeItem('studentSubRole');
                sessionStorage.removeItem('studyLevel');
                sessionStorage.removeItem('fieldOfStudy');
                sessionStorage.removeItem('institution');

                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                    handleRedirect(userRole, accountType);
                }, 3000);
            } else {
                handleAuthError(result.error);
                setLoading(false);
            }
        } catch (err) {
            console.error('Submission Error:', err);
            alert('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleAuthError = (error) => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert('Email already registered. Redirecting to sign in...');
                router.push('/auth/signin');
                break;
            case 'auth/weak-password':
                alert('Password is too weak.');
                break;
            default:
                alert(`Error: ${error.message}`);
        }
    };

    const editParams = new URLSearchParams({
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email,
    });

    const displayRole = accountType === 'university' ? 'University' : userRole;
    const displaySubRole = formData.studentSubRole ? subRoleLabels[formData.studentSubRole] : null;

    const detailItems = [
        {
            label: 'Account Type',
            value: displaySubRole ? `${displayRole} · ${displaySubRole}` : displayRole,
        },
        { label: 'Name', value: `${formData.firstName} ${formData.surname}` },
        { label: 'Email', value: formData.email },
        { label: 'Country', value: formData.country || 'Not provided' },
        ...(formData.studyLevel ? [{ label: 'Year of Study', value: formData.studyLevel }] : []),
        ...(formData.fieldOfStudy ? [{ label: 'Field of Study', value: formData.fieldOfStudy }] : []),
        ...(formData.institution ? [{ label: 'Institution', value: formData.institution }] : []),
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
                .confirm-root { font-family: 'Lato', sans-serif; background: ${BG}; min-height: 100vh; }
                .confirm-serif { font-family: 'Playfair Display', Georgia, serif; }
                .confirm-card {
                    background: ${NAVY};
                    background-image: radial-gradient(rgba(184,150,62,0.06) 1px, transparent 1px);
                    background-size: 22px 22px;
                    border: 0.5px solid rgba(184,150,62,0.2);
                }
                .detail-row {
                    border-bottom: 0.5px solid rgba(184,150,62,0.15);
                    padding: 14px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: 16px;
                }
                .detail-row:last-child { border-bottom: none; }
                .confirm-btn {
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 14px 36px;
                    background: ${GOLD};
                    color: ${NAVY};
                    font-family: 'Lato', sans-serif;
                    font-size: 13px; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    transition: background 0.18s;
                    width: 100%;
                }
                .confirm-btn:hover:not(:disabled) { background: ${GOLDD}; }
                .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .edit-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 8px 18px;
                    border: 0.5px solid rgba(184,150,62,0.5);
                    color: ${GOLDD};
                    font-family: 'Lato', sans-serif;
                    font-size: 11px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    text-decoration: none;
                    transition: border-color 0.18s, background 0.18s;
                    background: transparent;
                }
                .edit-btn:hover { border-color: ${GOLD}; background: rgba(184,150,62,0.08); }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
                .toast-anim { animation: slideInRight 0.35s cubic-bezier(0.4,0,0.2,1) both; }
            `}</style>

            <AuthLayout backPath={`/auth/create-account/password?${new URLSearchParams(formData).toString()}`}>
                <div className="confirm-root">
                    {/* ── Eyebrow ── */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: `rgba(184,150,62,0.12)`, border: `1px solid rgba(184,150,62,0.25)`, borderRadius: '999px', padding: '6px 14px', marginBottom: '20px' }}>
                        <Sparkles size={12} style={{ color: GOLD }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD }}>
                            Final Step
                        </span>
                    </div>

                    <h1 className="confirm-serif" style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, color: NAVY, margin: '0 0 8px', lineHeight: 1.1 }}>
                        Confirm your details
                    </h1>
                    <p style={{ fontSize: '14px', color: '#888', marginBottom: '32px', fontWeight: 300, lineHeight: 1.7 }}>
                        Review your information before creating your account.
                    </p>

                    {/* ── Referred banner ── */}
                    {referredBy && (
                        <div style={{ marginBottom: '20px', background: `rgba(184,150,62,0.08)`, border: `0.5px solid rgba(184,150,62,0.35)`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px' }}>🎉</span>
                            <p style={{ fontSize: '12px', color: NAVY, fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                                You were invited by a friend!
                            </p>
                        </div>
                    )}

                    {/* ── Details card ── */}
                    <div className="confirm-card" style={{ padding: '28px', marginBottom: '28px' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.7)', marginBottom: '4px', fontFamily: "'Lato', sans-serif" }}>
                                    Account Summary
                                </p>
                                <p className="confirm-serif" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                    {formData.firstName} {formData.surname}
                                </p>
                            </div>
                            <Link href={`/auth/create-account?${editParams.toString()}`} className="edit-btn">
                                Edit
                            </Link>
                        </div>

                        {/* Gold divider */}
                        <div style={{ height: '0.5px', background: 'rgba(184,150,62,0.3)', marginBottom: '4px' }} />

                        {/* Detail rows */}
                        {detailItems.map((item, i) => (
                            <div className="detail-row" key={i}>
                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(184,150,62,0.65)', flexShrink: 0 }}>
                                    {item.label}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textAlign: 'right', textTransform: 'capitalize', fontFamily: "'Lato', sans-serif" }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ── Terms ── */}
                    <p style={{ fontSize: '11px', color: '#999', marginBottom: '24px', lineHeight: 1.75 }}>
                        By clicking Create Account, you agree to our{' '}
                        <Link href="/lan/terms-of-service" style={{ color: NAVY, fontWeight: 700, textDecoration: 'underline' }}>Terms</Link>
                        {' '}and{' '}
                        <Link href="/lan/privacy-policy" style={{ color: NAVY, fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</Link>.
                    </p>

                    {/* ── Submit ── */}
                    <button onClick={handleSubmit} disabled={loading} className="confirm-btn">
                        {loading ? (
                            <>
                                <span style={{ width: '12px', height: '12px', border: `2px solid rgba(13,34,68,0.2)`, borderTopColor: NAVY, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Creating Account…
                            </>
                        ) : (
                            <>Create Account <ArrowRight size={14} /></>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '28px' }}>
                        <Link href="/auth/signin" style={{ fontSize: '13px', color: NAVY, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Already have an account? Sign in <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </AuthLayout>

            {/* ── Toast ── */}
            {showToast && (
                <div className="toast-anim" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100, background: NAVY, border: `0.5px solid rgba(184,150,62,0.4)`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 48px rgba(13,34,68,0.25)' }}>
                    <div style={{ width: '36px', height: '36px', background: `rgba(184,150,62,0.15)`, border: `0.5px solid rgba(184,150,62,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={18} style={{ color: GOLD }} />
                    </div>
                    <div>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 2px' }}>Account Created!</p>
                        <p style={{ fontSize: '11px', color: 'rgba(184,150,62,0.8)', margin: 0, fontFamily: "'Lato', sans-serif" }}>
                            Welcome aboard, {formData.firstName} 🎉
                        </p>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}