'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateName } from '@/lib/auth/authValidation';
import { ArrowRight, Sparkles } from 'lucide-react';

/* ── colour tokens (mirror homepage) ── */
const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const GOLDD = '#d4aa5a';
const CREAM = '#f5f0e8';
const BG    = '#f5f1ea';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

  .lan-auth-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 16px; }

  .lan-auth-card {
    background:#fff;
    border:0.5px solid #e5ddd0;
    width:100%;
    max-width:520px;
    padding:56px 48px;
    position:relative;
  }

  /* gold corner accent */
  .lan-auth-card::before {
    content:'';
    position:absolute;
    top:0; left:0;
    width:40px; height:40px;
    border-top:2px solid ${GOLD};
    border-left:2px solid ${GOLD};
  }
  .lan-auth-card::after {
    content:'';
    position:absolute;
    bottom:0; right:0;
    width:40px; height:40px;
    border-bottom:2px solid ${GOLD};
    border-right:2px solid ${GOLD};
  }

  .lan-eyebrow {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(184,150,62,0.12);
    border:1px solid rgba(184,150,62,0.28);
    border-radius:999px;
    padding:5px 13px;
    margin-bottom:20px;
    font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
    color:${GOLDD};
    font-family:'Lato',sans-serif;
  }

  .lan-heading {
    font-family:'Playfair Display',Georgia,serif;
    font-size:clamp(26px,4vw,38px);
    font-weight:900;
    color:${NAVY};
    line-height:1.1;
    margin:0 0 10px;
    letter-spacing:-0.5px;
  }

  .lan-sub {
    font-size:14px; color:#888; font-weight:300; line-height:1.7;
    margin:0 0 28px;
    font-family:'Lato',sans-serif;
  }

  .lan-badge-row { display:flex; align-items:center; gap:8px; margin-bottom:28px; }
  .lan-badge-label { font-size:12px; font-weight:700; color:${NAVY}; text-transform:capitalize; }
  .lan-badge-pill {
    font-size:10px; font-weight:700;
    background:rgba(13,34,68,0.07);
    color:${NAVY};
    border:0.5px solid rgba(13,34,68,0.18);
    padding:3px 10px;
    letter-spacing:0.06em;
  }

  .lan-input-row { display:flex; gap:14px; margin-bottom:6px; }
  .lan-input-wrap { flex:1; }

  .lan-input {
    width:100%;
    padding:14px 16px;
    border:0.5px solid #d4cfc8;
    background:#faf8f5;
    font-size:14px;
    font-family:'Lato',sans-serif;
    color:${NAVY};
    outline:none;
    transition:border-color 0.18s, box-shadow 0.18s;
    box-sizing:border-box;
  }
  .lan-input:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.08); }
  .lan-input::placeholder { color:#bbb; }

  .lan-error { font-size:12px; color:#c0392b; margin:4px 0 8px; font-family:'Lato',sans-serif; }

  .lan-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 36px;
    background:${NAVY};
    color:#fff;
    font-size:13px; font-weight:700; letter-spacing:0.06em;
    font-family:'Lato',sans-serif;
    border:none; cursor:pointer;
    transition:background 0.18s;
    margin-top:24px;
  }
  .lan-btn:hover:not(:disabled) { background:#1a3a6e; }
  .lan-btn:disabled { opacity:0.45; cursor:not-allowed; }

  /* gold divider line */
  .lan-divider {
    display:flex; align-items:center; gap:12px;
    margin-bottom:28px;
  }
  .lan-divider::before,.lan-divider::after {
    content:''; flex:1; height:1px; background:rgba(184,150,62,0.25);
  }
  .lan-diamond {
    width:7px; height:7px;
    background:${GOLD};
    transform:rotate(45deg);
    flex-shrink:0;
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .lan-auth-card { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
`;



export default function CreateAccountNameClient() {
    const router      = useRouter();
    const searchParams = useSearchParams();
    const prefilledEmail = searchParams.get('email');
    const refFromUrl     = searchParams.get('referral_code');

    const [formData, setFormData] = useState({
        firstName: '',
        surname: ''
    });

    const [errors, setErrors] = useState({});
    const [selectedRole, setSelectedRole]     = useState('');
    const [studentSubRole, setStudentSubRole] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const role = sessionStorage.getItem('userRole');
        if (role) setSelectedRole(role);

        const subRole = sessionStorage.getItem('studentSubRole');
        if (subRole) setStudentSubRole(subRole);

        if (refFromUrl) {
            sessionStorage.setItem('referredBy', refFromUrl);
        }
    }, [refFromUrl]);

    const subRoleLabels = {
        undergraduate: 'Undergraduate',
        postgraduate:  'Postgraduate',
        researcher:    'PhD / Researcher',
        professional:  'Professional learner',
    };

    const handleNext = () => {
        const validation = validateName(formData.firstName, formData.surname);
            console.log('validation result:', validation); 
        if (!validation.isValid) { setErrors(validation.errors); return; }

        setLoading(true);

        const ref = sessionStorage.getItem('referredBy') || refFromUrl || '';
        const params = new URLSearchParams({
            firstName: formData.firstName,
            surname: formData.surname,
        });

        if (prefilledEmail) params.append('email', prefilledEmail);
        if (ref) params.append('referral_code', ref);
        if (selectedRole) params.append('role', selectedRole);

        const studentSubRoleVal = sessionStorage.getItem('studentSubRole');
        const studyLevel = sessionStorage.getItem('studyLevel');
        const fieldOfStudy = sessionStorage.getItem('fieldOfStudy');
        const institution = sessionStorage.getItem('institution');

        if (studentSubRoleVal) params.append('studentSubRole', studentSubRoleVal);
        if (studyLevel) params.append('studyLevel', studyLevel);
        if (fieldOfStudy) params.append('fieldOfStudy', fieldOfStudy);
        if (institution) params.append('institution', institution);

        router.push(`/auth/create-account/dob?${params.toString()}`);
    };

    return (
        <>
            <style>{STYLES}</style>
            <div className="lan-auth-root">
                <div className="lan-auth-card">

                    {/* eyebrow */}
                    <div className="lan-eyebrow">
                        <Sparkles size={11} />
                        Africa's #1 Student Library
                    </div>

                    <h1 className="lan-heading">What's your name?</h1>

                    {/* gold divider */}
                    <div className="lan-divider"><div className="lan-diamond" /></div>

                    <p className="lan-sub">Enter the name you use in real life.</p>

                    {/* role badge */}
                    {selectedRole && (
                        <div className="lan-badge-row">
                            <span className="lan-badge-label">Creating {selectedRole} account</span>
                            {selectedRole === 'student' && studentSubRole && (
                                <span className="lan-badge-pill">
                                    {subRoleLabels[studentSubRole] || studentSubRole}
                                </span>
                            )}
                        </div>
                    )}

                    {/* inputs */}
                    <div className="lan-input-row">
                        <div className="lan-input-wrap">
                            <input
                                type="text"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={e => { setFormData(p => ({ ...p, firstName: e.target.value })); setErrors({}); }}
                                className="lan-input"
                            />
                            {errors.firstName && <p className="lan-error">{errors.firstName}</p>}
                        </div>
                        <div className="lan-input-wrap">
                            <input
                                type="text"
                                placeholder="Surname"
                                value={formData.surname}
                                onChange={e => { setFormData(p => ({ ...p, surname: e.target.value })); setErrors({}); }}
                                className="lan-input"
                            />
                            {errors.surname && <p className="lan-error">{errors.surname}</p>}
                        </div>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={loading || !formData.firstName.trim() || !formData.surname.trim()}
                        className="lan-btn"
                    >
                        {loading ? "Loading..." : <>Next <ArrowRight size={13} /></>}
                    </button>

                    {/* bottom crest note */}
                    <p style={{ fontSize:'11px', color:'#bbb', marginTop:'32px', fontFamily:"'Playfair Display',serif", fontStyle:'italic', textAlign:'center' }}>
                        Learning Access Network  ·  African EdTech Marketplace
                    </p>
                </div>
            </div>
        </>
    );
}