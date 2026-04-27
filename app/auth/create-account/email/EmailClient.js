'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Sparkles, Mail } from 'lucide-react';
import Link from 'next/link';
import { validateEmail } from '@/lib/auth/authValidation';

const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const GOLDD = '#d4aa5a';
const BG    = '#f5f1ea';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

  .lan-auth-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 16px; }

  .lan-auth-card {
    background:#fff; border:0.5px solid #e5ddd0;
    width:100%; max-width:520px; padding:56px 48px;
    position:relative;
  }
  .lan-auth-card::before { content:''; position:absolute; top:0; left:0; width:40px; height:40px; border-top:2px solid ${GOLD}; border-left:2px solid ${GOLD}; }
  .lan-auth-card::after  { content:''; position:absolute; bottom:0; right:0; width:40px; height:40px; border-bottom:2px solid ${GOLD}; border-right:2px solid ${GOLD}; }

  .lan-eyebrow {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(184,150,62,0.12); border:1px solid rgba(184,150,62,0.28);
    border-radius:999px; padding:5px 13px; margin-bottom:20px;
    font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
    color:${GOLDD}; font-family:'Lato',sans-serif;
  }

  .lan-heading {
    font-family:'Playfair Display',Georgia,serif;
    font-size:clamp(24px,4vw,36px); font-weight:900;
    color:${NAVY}; line-height:1.1; margin:0 0 10px; letter-spacing:-0.5px;
  }

  .lan-divider { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .lan-divider::before,.lan-divider::after { content:''; flex:1; height:1px; background:rgba(184,150,62,0.25); }
  .lan-diamond { width:7px; height:7px; background:${GOLD}; transform:rotate(45deg); flex-shrink:0; }

  .lan-sub { font-size:14px; color:#888; font-weight:300; line-height:1.7; margin:0 0 28px; font-family:'Lato',sans-serif; }

  .lan-input-wrap { position:relative; margin-bottom:8px; }
  .lan-input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }

  .lan-input {
    width:100%; padding:14px 16px 14px 42px;
    border:0.5px solid #d4cfc8; background:#faf8f5;
    font-size:14px; font-family:'Lato',sans-serif; color:${NAVY};
    outline:none; transition:border-color 0.18s, box-shadow 0.18s; box-sizing:border-box;
  }
  .lan-input:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.08); }
  .lan-input::placeholder { color:#bbb; }
  .lan-input:disabled { opacity:0.55; }

  .lan-error-box {
    display:flex; align-items:flex-start; gap:10px;
    background:#fff5f5; border:0.5px solid #fca5a5;
    padding:12px 16px; margin-bottom:12px;
  }
  .lan-error-box p { font-size:13px; color:#991b1b; line-height:1.5; margin:0 0 6px; font-family:'Lato',sans-serif; }
  .lan-error-link { font-size:12px; font-weight:700; color:${NAVY}; text-decoration:underline; font-family:'Lato',sans-serif; }

  .lan-notice {
    display:flex; align-items:flex-start; gap:10px;
    background:rgba(13,34,68,0.04); border:0.5px solid rgba(13,34,68,0.1);
    padding:12px 16px; margin-bottom:24px;
  }
  .lan-notice p { font-size:12px; color:#666; line-height:1.6; margin:0; font-family:'Lato',sans-serif; }

  .lan-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 36px; background:${NAVY}; color:#fff;
    font-size:13px; font-weight:700; letter-spacing:0.06em;
    font-family:'Lato',sans-serif; border:none; cursor:pointer;
    transition:background 0.18s; margin-top:8px;
  }
  .lan-btn:hover:not(:disabled) { background:#1a3a6e; }
  .lan-btn:disabled { opacity:0.45; cursor:not-allowed; }

  .lan-spinner {
    width:16px; height:16px;
    border:2px solid rgba(255,255,255,0.3);
    border-top-color:#fff; border-radius:50%;
    animation:spin 0.65s linear infinite; flex-shrink:0;
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .lan-auth-card { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
`;

export default function EmailClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail]               = useState('');
    const [errors, setErrors]             = useState({});
    const [loading, setLoading]           = useState(false);
    const [formData, setFormData]         = useState({});
    const [accountExists, setAccountExists] = useState(false);

    useEffect(() => {
        const prefilledEmail = searchParams.get('email');
        setFormData({
            firstName:      searchParams.get('firstName') || '',
            surname:        searchParams.get('surname') || '',
            dateOfBirth:    searchParams.get('dateOfBirth') || '',
            accountType:    searchParams.get('accountType') || '',
            country:        searchParams.get('country') || '',
            role:           searchParams.get('role') || '',
            studentSubRole: searchParams.get('studentSubRole') || '',
            studyLevel:     searchParams.get('studyLevel') || '',
            fieldOfStudy:   searchParams.get('fieldOfStudy') || '',
            institution:    searchParams.get('institution') || '',
        });
        if (prefilledEmail) setEmail(prefilledEmail);
    }, [searchParams]);

    const handleNext = async () => {
        setLoading(true); setErrors({}); setAccountExists(false);
        try {
            const validation = await validateEmail(email);
            if (!validation.isValid) {
                setErrors(validation.errors);
                if (validation.accountExists) setAccountExists(true);
                setLoading(false); return;
            }
            const ref    = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
            const params = new URLSearchParams({ ...formData, email });
            if (ref) params.append('referral_code', ref);
            router.push(`/auth/create-account/password?${params.toString()}`);
        } catch {
            setErrors({ email: 'Unable to validate email. Please try again.' });
        } finally { setLoading(false); }
    };

    return (
        <>
            <style>{STYLES}</style>
            <div className="lan-auth-root">
                <div className="lan-auth-card">

                    <div className="lan-eyebrow"><Sparkles size={11} />Africa's #1 Student Library</div>

                    <h1 className="lan-heading">What's your email?</h1>
                    <div className="lan-divider"><div className="lan-diamond" /></div>
                    <p className="lan-sub">Enter your Gmail address. We'll send your PDF books here.</p>

                    {/* input */}
                    <div className="lan-input-wrap">
                        <Mail size={15} className="lan-input-icon" />
                        <input
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value.toLowerCase().trim()); setErrors({}); setAccountExists(false); }}
                            className="lan-input"
                            disabled={loading}
                        />
                    </div>

                    {/* error */}
                    {errors.email && (
                        <div className="lan-error-box">
                            <AlertCircle size={15} style={{ color:'#dc2626', flexShrink:0, marginTop:2 }} />
                            <div>
                                <p>{errors.email}</p>
                                {(errors.email.includes('suspended') || errors.email.includes('under review')) && (
                                    <Link href="/lan/customer-care" className="lan-error-link">Contact Support →</Link>
                                )}
                                {accountExists && (
                                    <Link href={`/auth/signin?email=${encodeURIComponent(email)}`} className="lan-error-link" style={{ color:NAVY }}>
                                        Sign in instead →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* notice */}
                    <div className="lan-notice">
                        <span style={{ fontSize:'16px', flexShrink:0 }}>ℹ️</span>
                        <p>Only Gmail addresses are accepted. Make sure you have access to this email.</p>
                    </div>

                    <button onClick={handleNext} disabled={loading || !email} className="lan-btn">
                        {loading ? <><div className="lan-spinner" />Checking…</> : <>Next <ArrowRight size={13} /></>}
                    </button>

                    <p style={{ fontSize:'11px', color:'#bbb', marginTop:'32px', fontFamily:"'Playfair Display',serif", fontStyle:'italic', textAlign:'center' }}>
                        LAN Library — Est. for African Scholars
                    </p>
                </div>
            </div>
        </>
    );
}