'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
    ArrowRight, Sparkles, Upload, X, Check,
    AlertCircle, FileText, Image as ImageIcon,
    Shield, GraduationCap, ExternalLink, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

const NAVY = '#0d2244';
const GOLD = '#b8963e';
const GOLDD = '#d4aa5a';
const BG = '#f5f1ea';

const FACULTY_TITLES = ["Dr.", "Prof.", "Engr.", "Pharm.", "Barr.", "Lecturer"];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .fv-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 16px; }

  .fv-card {
    background:#fff; border:0.5px solid #e5ddd0;
    width:100%; max-width:560px; padding:52px 48px;
    position:relative; animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both;
  }
  .fv-card::before { content:''; position:absolute; top:0; left:0; width:40px; height:40px; border-top:2px solid ${GOLD}; border-left:2px solid ${GOLD}; }
  .fv-card::after  { content:''; position:absolute; bottom:0; right:0; width:40px; height:40px; border-bottom:2px solid ${GOLD}; border-right:2px solid ${GOLD}; }

  .fv-eyebrow {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(184,150,62,0.12); border:1px solid rgba(184,150,62,0.28);
    border-radius:999px; padding:5px 13px; margin-bottom:20px;
    font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
    color:${GOLDD}; font-family:'Lato',sans-serif;
  }

  .fv-heading {
    font-family:'Playfair Display',Georgia,serif;
    font-size:clamp(24px,4vw,34px); font-weight:900;
    color:${NAVY}; line-height:1.1; margin:0 0 10px; letter-spacing:-0.5px;
  }

  .fv-divider { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .fv-divider::before,.fv-divider::after { content:''; flex:1; height:1px; background:rgba(184,150,62,0.25); }
  .fv-diamond { width:7px; height:7px; background:${GOLD}; transform:rotate(45deg); flex-shrink:0; }

  .fv-sub { font-size:14px; color:#888; font-weight:300; line-height:1.7; margin:0 0 24px; font-family:'Lato',sans-serif; }

  .fv-input {
    width:100%; padding:13px 16px;
    border:0.5px solid #d4cfc8; background:#faf8f5;
    font-size:14px; font-family:'Lato',sans-serif; color:${NAVY};
    outline:none; transition:border-color 0.18s, box-shadow 0.18s;
  }
  .fv-input:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.08); }
  .fv-input::placeholder { color:#bbb; }

  .fv-label { font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#888; margin-bottom:6px; display:block; }

  .fv-upload-zone {
    border:2px dashed #e5ddd0; padding:24px; text-align:center;
    cursor:pointer; transition:all 0.2s;
  }
  .fv-upload-zone:hover { border-color:${GOLD}; background:rgba(184,150,62,0.03); }
  .fv-upload-zone.has-file { border-color:#16a34a; border-style:solid; background:rgba(22,163,74,0.04); }
  .fv-upload-zone.error { border-color:#dc2626; }

  .fv-progress-track { height:4px; background:#f0ebe0; margin-top:8px; overflow:hidden; }
  .fv-progress-fill { height:100%; background:${GOLD}; transition:width 0.3s ease; }

  .fv-error {
    display:flex; align-items:center; gap:8px;
    background:#fff5f5; border:0.5px solid #fca5a5;
    padding:10px 14px; margin-bottom:12px;
    font-size:12px; color:#991b1b; font-family:'Lato',sans-serif;
  }

  .fv-notice {
    display:flex; align-items:flex-start; gap:10px;
    background:rgba(13,34,68,0.04); border:0.5px solid rgba(13,34,68,0.1);
    padding:12px 16px; margin-bottom:20px;
  }
  .fv-notice p { font-size:12px; color:#666; line-height:1.6; margin:0; }

  .fv-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 36px; background:${NAVY}; color:#fff;
    font-size:13px; font-weight:700; letter-spacing:0.06em;
    font-family:'Lato',sans-serif; border:none; cursor:pointer;
    transition:background 0.18s; width:100%; justify-content:center; margin-top:8px;
  }
  .fv-btn:hover:not(:disabled) { background:#1a3a6e; }
  .fv-btn:disabled { opacity:0.45; cursor:not-allowed; }

  .fv-skip {
    display:block; text-align:center; margin-top:14px;
    font-size:12px; color:#bbb; cursor:pointer; font-family:'Lato',sans-serif;
    background:none; border:none; text-decoration:underline;
  }
  .fv-skip:hover { color:#888; }

  .fv-back {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:700; letter-spacing:0.1em;
    text-transform:uppercase; color:#bbb; text-decoration:none;
    margin-bottom:28px; transition:color 0.18s;
  }
  .fv-back:hover { color:${NAVY}; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to { transform:rotate(360deg); } }
`;

export default function VerifyFacultyClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    console.log('Client rendered'); // 👈 add here

    const [formData, setFormData] = useState({});
    const [lecturerTitle, setLecturerTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [department, setDepartment] = useState('');
    const [facultyProfileUrl, setFacultyProfileUrl] = useState('');

    // Staff ID upload
    const [staffIdFile, setStaffIdFile] = useState(null);
    const [staffIdPreview, setStaffIdPreview] = useState(null);
    const [staffIdProgress, setStaffIdProgress] = useState(0);
    const [staffIdUploading, setStaffIdUploading] = useState(false);
    const [staffIdUrl, setStaffIdUrl] = useState('');
    const [staffIdError, setStaffIdError] = useState('');

    // Appointment letter upload
    const [letterFile, setLetterFile] = useState(null);
    const [letterProgress, setLetterProgress] = useState(0);
    const [letterUploading, setLetterUploading] = useState(false);
    const [letterUrl, setLetterUrl] = useState('');
    const [letterError, setLetterError] = useState('');

    const [user, setUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Read all params passed through the flow
    useEffect(() => {
        const data = {
            firstName: searchParams.get('firstName') || '',
            surname: searchParams.get('surname') || '',
            dateOfBirth: searchParams.get('dateOfBirth') || '',
            email: searchParams.get('email') || '',
            password: searchParams.get('password') || '',
            country: searchParams.get('country') || '',
            role: searchParams.get('role') || '',
            studentSubRole: searchParams.get('studentSubRole') || '',
            studyLevel: searchParams.get('studyLevel') || '',
            fieldOfStudy: searchParams.get('fieldOfStudy') || '',
            institution: searchParams.get('institution') || '',
        };
        setFormData(data);

        // ✅ URL param first, then sessionStorage, never empty
        setInstitution(searchParams.get('institution') || sessionStorage.getItem('institution') || '');
        setDepartment(searchParams.get('department') || sessionStorage.getItem('department') || '');
        setLecturerTitle(searchParams.get('lecturerTitle') || sessionStorage.getItem('lecturerTitle') || '');

        // Redirect non-faculty roles away from this page
        const role = searchParams.get('role') || '';
        if (role && role !== 'lecturer') {
            const params = new URLSearchParams(data);
            router.replace(`/auth/create-account/confirm?${params.toString()}`);
        }
    }, [searchParams]);


    useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
        console.log('Auth state:', u); // 👈 null is fine, just need to see it fires
        setUser(u);
    });
    return () => unsub();
    }, []);
    
   

    // ── File validation ──────────────────────────────────────────────────────
    const validateFile = (file, allowPdf = true) => {
        const ALLOWED_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const ALLOWED_TYPES = allowPdf ? [...ALLOWED_IMAGES, 'application/pdf'] : ALLOWED_IMAGES;
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (!ALLOWED_TYPES.includes(file.type)) {
            return allowPdf
                ? 'File must be an image (JPG/PNG/WEBP) or PDF.'
                : 'File must be an image (JPG/PNG/WEBP).';
        }
        if (file.size > MAX_SIZE) return 'File must be under 5MB.';
        return null;
    };

    // ── Upload to Firebase Storage ────────────────────────────────────────────
    // ── Upload to Cloudinary ────────────────────────────────────────────────────
    const uploadToCloudinary = (file, onProgress, onDone, onError) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'lan_library_docs');
        formData.append('folder', 'lecturer-docs');

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                onProgress(pct);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                const viewableUrl = data.secure_url.replace('/upload/', '/upload/fl_attachment:false/');
                onDone(viewableUrl);            
                } else {
                const err = JSON.parse(xhr.responseText);
                console.error('Cloudinary error:', err);
                onError('Upload failed. Please try again.');
            }
        });

        xhr.addEventListener('error', () => {
            onError('Upload failed. Please check your connection.');
        });

        xhr.open('POST', 'https://api.cloudinary.com/v1_1/dgkuyf3dq/auto/upload');
        xhr.send(formData);
    };

    // ── Staff ID handler ────────────────────────────────────────────────────────
    const handleStaffIdSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const err = validateFile(file, true);
        if (err) { setStaffIdError(err); return; }

        setStaffIdError('');
        setStaffIdFile(file);

        if (file.type.startsWith('image/')) {
            setStaffIdPreview(URL.createObjectURL(file));
        } else {
            setStaffIdPreview(null);
        }

        setStaffIdUploading(true);
        uploadToCloudinary(
            file,
            setStaffIdProgress,
            (url) => { setStaffIdUrl(url); setStaffIdUploading(false); },
            (errMsg) => { setStaffIdError(errMsg); setStaffIdUploading(false); }
        );
    };

    // ── Appointment letter handler ──────────────────────────────────────────────
    const handleLetterSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const err = validateFile(file, true);
        if (err) { setLetterError(err); return; }

        setLetterError('');
        setLetterFile(file);
        setLetterUploading(true);

        uploadToCloudinary(
            file,
            setLetterProgress,
            (url) => { setLetterUrl(url); setLetterUploading(false); },
            (errMsg) => { setLetterError(errMsg); setLetterUploading(false); }
        );
    };

    const handleNext = () => {
        const newErrors = {};
        if (!lecturerTitle) newErrors.title = 'Please select your title.';
        if (!institution.trim()) newErrors.institution = 'Please enter your institution.';

        // ✅ At least one proof required
        const hasAtLeastOneProof = staffIdUrl || letterUrl || facultyProfileUrl.trim();
        if (!hasAtLeastOneProof) {
            newErrors.proof = 'Please provide at least one of: Staff ID, Appointment Letter, or Faculty Profile URL.';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        // Save to sessionStorage so confirm page picks them up
        sessionStorage.setItem('lecturerTitle', lecturerTitle);
        sessionStorage.setItem('institution', institution);
        sessionStorage.setItem('department', department);
        sessionStorage.setItem('staffIdUrl', staffIdUrl);
        sessionStorage.setItem('appointmentLetterUrl', letterUrl);
        sessionStorage.setItem('facultyProfileUrl', facultyProfileUrl);

        const ref = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
        const params = new URLSearchParams({
            ...formData,
            lecturerTitle,
            institution,
            department,
            staffIdUrl,
            appointmentLetterUrl: letterUrl,
            facultyProfileUrl,
        });
        if (ref) params.append('referral_code', ref);

        router.push(`/auth/create-account/confirm?${params.toString()}`);
    };

    // ── Skip (submit without docs) ────────────────────────────────────────────
    const handleSkip = () => {
        sessionStorage.setItem('lecturerTitle', lecturerTitle);
        sessionStorage.setItem('institution', institution);
        sessionStorage.setItem('department', department);

        const ref = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
        const params = new URLSearchParams({ ...formData, lecturerTitle, institution, department });
        if (ref) params.append('referral_code', ref);
        router.push(`/auth/create-account/confirm?${params.toString()}`);
    };

    const isFaculty = !!lecturerTitle;
    const backPath = `/auth/create-account/password?${new URLSearchParams(formData).toString()}`;

    return (
        <>
            <style>{STYLES}</style>
            <div className="fv-root">
                <div className="fv-card">

                    <Link href={backPath} className="fv-back">
                        <ChevronLeft size={13} /> Back
                    </Link>

                    {/* Eyebrow */}
                    <div className="fv-eyebrow">
                        <GraduationCap size={11} />
                        Faculty Verification
                    </div>

                    <h1 className="fv-heading">Verify your faculty credentials</h1>
                    <div className="fv-divider"><div className="fv-diamond" /></div>
                    <p className="fv-sub">
                        Tell us about your academic role. This unlocks your Verified Faculty badge on the platform.
                    </p>

                    {/* Security notice */}
                    <div className="fv-notice">
                        <Shield size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                        <p>Your documents are encrypted and only visible to LAN Library admins for verification. They will never be shared publicly.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* ── Title selector ── */}
                        <div>
                            <label className="fv-label">
                                Your Title <span style={{ color: '#e53e3e' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {FACULTY_TITLES.map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setLecturerTitle(t); setErrors(e => ({ ...e, title: '' })); }}
                                        style={{
                                            padding: '8px 14px',
                                            border: `1.5px solid ${lecturerTitle === t ? NAVY : '#e5ddd0'}`,
                                            background: lecturerTitle === t ? NAVY : '#fff',
                                            color: lecturerTitle === t ? '#fff' : '#666',
                                            fontSize: '13px', fontWeight: 700,
                                            cursor: 'pointer', fontFamily: "'Lato',sans-serif",
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {errors.title && (
                                <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '5px' }}>{errors.title}</p>
                            )}
                        </div>

                        {/* ── Institution ── */}
                        <div>
                            <label className="fv-label">
                                Institution / University <span style={{ color: '#e53e3e' }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. University of Lagos"
                                value={institution}
                                onChange={e => { setInstitution(e.target.value); setErrors(er => ({ ...er, institution: '' })); }}
                                className="fv-input"
                            />
                            {errors.institution && (
                                <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '5px' }}>{errors.institution}</p>
                            )}
                        </div>

                        {/* ── Department ── */}
                        <div>
                            <label className="fv-label">Department</label>
                            <input
                                type="text"
                                placeholder="e.g. Department of Computer Science"
                                value={department}
                                onChange={e => setDepartment(e.target.value)}
                                className="fv-input"
                            />
                        </div>

                        {/* ── Faculty Profile URL ── */}
                        <div>
                            <label className="fv-label">Faculty Profile URL</label>
                            <input
                                type="url"
                                placeholder="https://unilag.edu.ng/staff/your-profile"
                                value={facultyProfileUrl}
                                onChange={e => setFacultyProfileUrl(e.target.value)}
                                className="fv-input"
                            />
                            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                                Optional — link to your official university staff page to speed up verification.{' '}
                                <strong style={{ color: GOLD }}>Counts as proof if provided.</strong>
                            </p>
                        </div>

                        {/* ── Staff ID upload (only shown for faculty titles) ── */}
                        {isFaculty && (
                            <>
                                {/* Staff ID */}
                                <div>
                                    <label className="fv-label">Staff ID Card</label>
                                    <label className={`fv-upload-zone ${staffIdFile ? 'has-file' : ''} ${staffIdError ? 'error' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                            onChange={handleStaffIdSelect}
                                            style={{ display: 'none' }}
                                            disabled={staffIdUploading}
                                        />
                                        {staffIdFile ? (
                                            <div>
                                                {staffIdPreview ? (
                                                    <img
                                                        src={staffIdPreview}
                                                        alt="Staff ID preview"
                                                        style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }}
                                                    />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <FileText size={22} style={{ color: NAVY }} />
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: staffIdUrl ? '#16a34a' : NAVY, margin: 0 }}>
                                                    {staffIdUrl ? '✓ Uploaded successfully' : staffIdUploading ? `Uploading… ${staffIdProgress}%` : staffIdFile.name}
                                                </p>
                                                {!staffIdUrl && !staffIdUploading && (
                                                    <p style={{ fontSize: '11px', color: '#aaa', margin: '3px 0 0' }}>
                                                        {(staffIdFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <ImageIcon size={28} style={{ color: '#ccc', margin: '0 auto 8px', display: 'block' }} />
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', margin: '0 0 3px' }}>
                                                    Upload Staff ID
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#bbb', margin: 0 }}>
                                                    JPG, PNG, WEBP or PDF · Max 5MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                    {/* Progress bar */}
                                    {staffIdUploading && (
                                        <div>
                                            <div className="fv-progress-track">
                                                <div className="fv-progress-fill" style={{ width: `${staffIdProgress}%` }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                                <span>Uploading…</span>
                                                <span>{staffIdProgress}%</span>
                                            </div>
                                        </div>
                                    )}
                                    {staffIdUrl && !staffIdUploading && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Saved securely</span>
                                            <button
                                                type="button"
                                                onClick={() => { setStaffIdFile(null); setStaffIdUrl(''); setStaffIdPreview(null); setStaffIdProgress(0); }}
                                                style={{ marginLeft: 'auto', fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    {staffIdError && (
                                        <div className="fv-error" style={{ marginTop: '8px' }}>
                                            <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                            {staffIdError}
                                        </div>
                                    )}
                                </div>

                                {/* Appointment Letter */}
                                <div>
                                    <label className="fv-label">Appointment Letter / Employment Proof</label>
                                    <label className={`fv-upload-zone ${letterFile ? 'has-file' : ''} ${letterError ? 'error' : ''}`}>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                            onChange={handleLetterSelect}
                                            style={{ display: 'none' }}
                                            disabled={letterUploading}
                                        />
                                        {letterFile ? (
                                            <div>
                                                <FileText size={22} style={{ color: NAVY, margin: '0 auto 6px', display: 'block' }} />
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: letterUrl ? '#16a34a' : NAVY, margin: 0 }}>
                                                    {letterUrl ? '✓ Uploaded successfully' : letterUploading ? `Uploading… ${letterProgress}%` : letterFile.name}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <FileText size={28} style={{ color: '#ccc', margin: '0 auto 8px', display: 'block' }} />
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', margin: '0 0 3px' }}>
                                                    Upload Appointment Letter
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#bbb', margin: 0 }}>
                                                    PDF or image · Max 5MB · Optional
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                    {letterUploading && (
                                        <div>
                                            <div className="fv-progress-track">
                                                <div className="fv-progress-fill" style={{ width: `${letterProgress}%` }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                                <span>Uploading…</span>
                                                <span>{letterProgress}%</span>
                                            </div>
                                        </div>
                                    )}
                                    {letterUrl && !letterUploading && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Saved securely</span>
                                            <button
                                                type="button"
                                                onClick={() => { setLetterFile(null); setLetterUrl(''); setLetterProgress(0); }}
                                                style={{ marginLeft: 'auto', fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    {letterError && (
                                        <div className="fv-error" style={{ marginTop: '8px' }}>
                                            <AlertCircle size={13} style={{ flexShrink: 0 }} />
                                            {letterError}
                                        </div>
                                    )}
                                </div>

                                {/* Verification timeline notice */}
                                <div style={{ background: 'rgba(184,150,62,0.07)', border: '0.5px solid rgba(184,150,62,0.25)', padding: '12px 16px', display: 'flex', gap: '10px' }}>
                                    <Shield size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: NAVY, margin: '0 0 3px', fontFamily: "'Lato',sans-serif" }}>
                                            Verification takes 24–48 hours
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: 1.6 }}>
                                            Once approved, your profile will show the <strong style={{ color: NAVY }}>Verified Faculty</strong> badge and you'll get access to advanced analytics and export tools.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Non-faculty notice */}
                        {lecturerTitle && !isFaculty && (
                            <div style={{ background: '#fff5f5', border: '0.5px solid #fca5a5', padding: '12px 16px', display: 'flex', gap: '10px' }}>
                                <AlertCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: '12px', color: '#991b1b', margin: 0, lineHeight: 1.6 }}>
                                    The title "{lecturerTitle}" is not on our recognized faculty list. You can still create an account, but you won't receive a Verified Faculty badge.
                                </p>
                            </div>
                        )}
                    </div>

                    

                    {/* Add this just above the <button onClick={handleNext}> */}
                    {errors.proof && (
                        <div className="fv-error" style={{ marginTop: '8px' }}>
                            <AlertCircle size={13} style={{ flexShrink: 0 }} />
                            {errors.proof}
                        </div>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={staffIdUploading || letterUploading}
                        className="fv-btn"
                        style={{ marginTop: '24px' }}
                    >
                        {staffIdUploading || letterUploading ? (
                            <>
                                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Uploading…
                            </>
                        ) : (
                            <>Continue <ArrowRight size={13} /></>
                        )}
                    </button>

                    <p style={{ fontSize: '11px', color: '#bbb', marginTop: '28px', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', textAlign: 'center' }}>
                        Learning Access Network  ·  African EdTech Marketplace
                    </p>
                </div>
            </div>
        </>
    );
}