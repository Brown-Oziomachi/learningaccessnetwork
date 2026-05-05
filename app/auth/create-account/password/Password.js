'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validatePassword } from '@/lib/auth/authValidation';
import { Eye, EyeOff, ShieldCheck, ArrowRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const GOLDD = '#d4aa5a';
const BG    = '#f5f1ea';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .lan-auth-root {
    font-family: 'Lato', sans-serif;
    background: ${BG};
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 40px 16px;
  }

  .lan-auth-card {
    background: #fff;
    border: 0.5px solid #e5ddd0;
    width: 100%; max-width: 520px;
    padding: 56px 48px;
    position: relative;
    animation: fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;
  }
  .lan-auth-card::before {
    content:''; position:absolute; top:0; left:0;
    width:40px; height:40px;
    border-top:2px solid ${GOLD}; border-left:2px solid ${GOLD};
  }
  .lan-auth-card::after {
    content:''; position:absolute; bottom:0; right:0;
    width:40px; height:40px;
    border-bottom:2px solid ${GOLD}; border-right:2px solid ${GOLD};
  }

  .lan-back {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:700; letter-spacing:0.1em;
    text-transform:uppercase; color:#bbb; text-decoration:none;
    margin-bottom:28px; transition:color 0.18s; font-family:'Lato',sans-serif;
  }
  .lan-back:hover { color:${NAVY}; }

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
  .lan-toggle-btn {
    position:absolute; right:14px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:#bbb; display:flex; align-items:center;
    transition:color 0.18s; padding:0;
  }
  .lan-toggle-btn:hover { color:${NAVY}; }

  .lan-input {
    width:100%; padding:14px 44px 14px 42px;
    border:0.5px solid #d4cfc8; background:#faf8f5;
    font-size:14px; font-family:'Lato',sans-serif; color:${NAVY};
    outline:none; transition:border-color 0.18s, box-shadow 0.18s;
  }
  .lan-input:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.08); }
  .lan-input::placeholder { color:#bbb; }

  /* step progress */
  .step-strip { display:flex; gap:4px; margin-bottom:32px; }
  .step-seg { height:2px; flex:1; background:#e5ddd0; transition:background 0.3s; }
  .step-seg.done   { background:${GOLD}; }
  .step-seg.active { background:${NAVY}; }

  /* strength */
  .sw-track { display:flex; gap:3px; margin-top:10px; margin-bottom:6px; }
  .sw-seg { flex:1; height:3px; border-radius:2px; transition:background 0.3s; }

  /* error */
  .lan-error {
    display:flex; align-items:center; gap:8px;
    background:#fff5f5; border:0.5px solid #fca5a5;
    padding:10px 14px; margin-bottom:14px;
    font-size:13px; color:#991b1b; font-family:'Lato',sans-serif;
  }

  /* hint pills */
  .hint-pill {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; color:#999; font-family:'Lato',sans-serif;
    background:rgba(13,34,68,0.04); border:0.5px solid #e5ddd0;
    padding:5px 10px; transition:color 0.2s, background 0.2s, border-color 0.2s;
  }
  .hint-pill.met { color:#16a34a; background:rgba(22,163,74,0.06); border-color:rgba(22,163,74,0.25); }
  .hint-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; transition:background 0.2s; }

  /* cta */
  .lan-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 36px; background:${NAVY}; color:#fff;
    font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
    font-family:'Lato',sans-serif; border:none; cursor:pointer;
    transition:background 0.18s; margin-top:8px;
  }
  .lan-btn:hover:not(:disabled) { background:#1a3a6e; }
  .lan-btn:disabled { opacity:0.4; cursor:not-allowed; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  @media(max-width:540px) { .lan-auth-card { padding:44px 24px; } }
`;

export default function PasswordClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [password,     setPassword]     = useState('');
    const [errors,       setErrors]       = useState({});
    const [formData,     setFormData]     = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [strength,     setStrength]     = useState(0);

    useEffect(() => {
        setFormData({
            firstName:      searchParams.get('firstName')      || '',
            surname:        searchParams.get('surname')        || '',
            dateOfBirth:    searchParams.get('dateOfBirth')    || '',
            email:          searchParams.get('email')          || '',
            accountType:    searchParams.get('accountType')    || '',
            country:        searchParams.get('country')        || '',
            role:           searchParams.get('role')           || '',
            studentSubRole: searchParams.get('studentSubRole') || '',
            studyLevel:     searchParams.get('studyLevel')     || '',
            fieldOfStudy:   searchParams.get('fieldOfStudy')  || '',
            institution: searchParams.get('institution') || '',
            institutionSlug: searchParams.get('institutionSlug') || sessionStorage.getItem('institutionSlug') || '',
            department: searchParams.get('department') || sessionStorage.getItem('department') || '',
            lecturerTitle: searchParams.get('lecturerTitle') || sessionStorage.getItem('lecturerTitle') || '',
            selectedUniversity: searchParams.get('selectedUniversity') || sessionStorage.getItem('selectedUniversity') || '',
        });
    }, [searchParams]);

    useEffect(() => {
        if (!password) { setStrength(0); return; }
        let s = 0;
        if (password.length >= 6)  s++;
        if (password.length >= 10) s++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
        if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) s++;
        setStrength(s);
    }, [password]);

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#dc2626', '#f59e0b', GOLD, '#16a34a'];

    const handleNext = () => {
        const validation = validatePassword(password);
        if (!validation.isValid) { setErrors(validation.errors); return; }
        const ref    = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
        const params = new URLSearchParams({ ...formData, password });
        if (ref) params.append('referral_code', ref);
        router.push(`/auth/create-account/confirm?${params.toString()}`);
    };

    const backPath = `/auth/create-account/email?${new URLSearchParams(formData).toString()}`;

    const hints = [
        { label: '6+ characters',   met: password.length >= 6 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Number or symbol', met: /\d|[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <>
            <style>{STYLES}</style>
            <div className="lan-auth-root">
                <div className="lan-auth-card">

                    {/* step bar — step 3 of 4 */}
                    <div className="step-strip">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`step-seg ${i < 2 ? 'done' : i === 2 ? 'active' : ''}`} />
                        ))}
                    </div>

                    <Link href={backPath} className="lan-back">
                        <ChevronLeft size={13} /> Back
                    </Link>

                    <div className="lan-eyebrow">
                        <ShieldCheck size={11} /> Secure Your Account
                    </div>

                    <h1 className="lan-heading">Create a password</h1>
                    <div className="lan-divider"><div className="lan-diamond" /></div>
                    <p className="lan-sub">
                        At least 6 characters. Make it strong — it guards your entire library.
                    </p>

                    {/* input */}
                    <div className="lan-input-wrap">
                        <ShieldCheck size={15} className="lan-input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setErrors({}); }}
                            className="lan-input"
                        />
                        <button type="button" className="lan-toggle-btn" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>

                    {/* strength bar */}
                    {password && (
                        <div style={{ marginBottom: '14px' }}>
                            <div className="sw-track">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="sw-seg"
                                        style={{ background: strength >= i ? strengthColor[strength] : '#e5ddd0' }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: strengthColor[strength], fontFamily: "'Lato',sans-serif", margin: 0 }}>
                                {strengthLabel[strength]}
                            </p>
                        </div>
                    )}

                    {/* error */}
                    {errors.password && (
                        <div className="lan-error">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', flexShrink: 0, display: 'inline-block' }} />
                            {errors.password}
                        </div>
                    )}

                    {/* hint pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '32px' }}>
                        {hints.map(({ label, met }) => (
                            <span key={label} className={`hint-pill${met ? ' met' : ''}`}>
                                <span className="hint-dot" style={{ background: met ? '#16a34a' : '#e5ddd0' }} />
                                {label}
                            </span>
                        ))}
                    </div>

                    <button onClick={handleNext} disabled={!password} className="lan-btn">
                        Next <ArrowRight size={13} />
                    </button>

                    <p style={{ fontSize: '11px', color: '#bbb', marginTop: '32px', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', textAlign: 'center' }}>
                        LAN Library — Est. for African Scholars
                    </p>

                </div>
            </div>
        </>
    );
}