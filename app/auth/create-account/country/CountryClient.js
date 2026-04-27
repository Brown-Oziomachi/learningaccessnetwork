'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Sparkles, Search } from 'lucide-react';

const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const GOLDD = '#d4aa5a';
const BG    = '#f5f1ea';

const countries = [
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi",
    "Cabo Verde","Cameroon","Central African Republic","Chad","Comoros",
    "Congo","Côte d'Ivoire","DR Congo","Djibouti","Egypt",
    "Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon",
    "Gambia","Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho",
    "Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
    "Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria",
    "Rwanda","São Tomé and Príncipe","Senegal","Seychelles",
    "Sierra Leone","Somalia","South Africa","South Sudan","Sudan",
    "Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe",
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');

  .lan-auth-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 16px; }

  .lan-auth-card {
    background:#fff; border:0.5px solid #e5ddd0;
    width:100%; max-width:520px; padding:48px 48px 56px;
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

  .lan-sub { font-size:14px; color:#888; font-weight:300; line-height:1.7; margin:0 0 24px; font-family:'Lato',sans-serif; }

  .lan-search-wrap { position:relative; margin-bottom:12px; }
  .lan-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
  .lan-search {
    width:100%; padding:12px 14px 12px 38px;
    border:0.5px solid #d4cfc8; background:#faf8f5;
    font-size:13px; font-family:'Lato',sans-serif; color:${NAVY};
    outline:none; transition:border-color 0.18s, box-shadow 0.18s;
    box-sizing:border-box;
  }
  .lan-search:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(184,150,62,0.08); }
  .lan-search::placeholder { color:#bbb; }

  .lan-list {
    height:220px; overflow-y:auto; border:0.5px solid #e5ddd0;
    margin-bottom:16px; scrollbar-width:thin; scrollbar-color:rgba(184,150,62,0.3) transparent;
  }
  .lan-list::-webkit-scrollbar { width:4px; }
  .lan-list::-webkit-scrollbar-thumb { background:rgba(184,150,62,0.3); }

  .lan-country-btn {
    width:100%; text-align:left; padding:11px 16px;
    font-size:13px; font-family:'Lato',sans-serif;
    border:none; border-bottom:0.5px solid #f0ebe0;
    cursor:pointer; transition:background 0.14s, color 0.14s;
    background:transparent; color:#555;
  }
  .lan-country-btn:last-child { border-bottom:none; }
  .lan-country-btn:hover { background:rgba(184,150,62,0.07); color:${NAVY}; }
  .lan-country-btn.selected { background:${NAVY}; color:#fff; font-weight:700; }

  .lan-selected-box {
    display:flex; align-items:center; gap:10px;
    background:rgba(13,34,68,0.04); border:0.5px solid rgba(13,34,68,0.12);
    padding:11px 16px; margin-bottom:16px;
    font-size:13px; font-family:'Lato',sans-serif; color:${NAVY}; font-weight:700;
  }
  .lan-selected-dot { width:8px; height:8px; background:${GOLD}; border-radius:50%; flex-shrink:0; }

  .lan-error { font-size:12px; color:#c0392b; margin:0 0 8px; font-family:'Lato',sans-serif; }

  .lan-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 36px; background:${NAVY}; color:#fff;
    font-size:13px; font-weight:700; letter-spacing:0.06em;
    font-family:'Lato',sans-serif; border:none; cursor:pointer;
    transition:background 0.18s; margin-top:8px;
  }
  .lan-btn:hover:not(:disabled) { background:#1a3a6e; }
  .lan-btn:disabled { opacity:0.45; cursor:not-allowed; }

  .lan-empty { text-align:center; padding:32px 16px; color:#ccc; font-size:13px; font-family:'Lato',sans-serif; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .lan-auth-card { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
`;

export default function CountryClient() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [country, setCountry] = useState('');
    const [search, setSearch]   = useState('');
    const [error, setError]     = useState('');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            firstName:      searchParams.get('firstName') || '',
            surname:        searchParams.get('surname') || '',
            dateOfBirth:    searchParams.get('dateOfBirth') || '',
            accountType:    searchParams.get('accountType') || '',
            role:           searchParams.get('role') || '',
            studentSubRole: searchParams.get('studentSubRole') || '',
            studyLevel:     searchParams.get('studyLevel') || '',
            fieldOfStudy:   searchParams.get('fieldOfStudy') || '',
            institution:    searchParams.get('institution') || '',
        });
    }, [searchParams]);

    const filtered = countries.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    const handleNext = () => {
        if (!country) { setError('Please select your country'); return; }
        const ref    = searchParams.get('referral_code') || sessionStorage.getItem('referredBy') || '';
        const params = new URLSearchParams({ ...formData, country });
        if (ref) params.append('referral_code', ref);
        router.push(`/auth/create-account/email?${params.toString()}`);
    };

    return (
        <>
            <style>{STYLES}</style>
            <div className="lan-auth-root">
                <div className="lan-auth-card">

                    <div className="lan-eyebrow"><Sparkles size={11} />Africa's #1 Student Library</div>

                    <h1 className="lan-heading">Where are you from?</h1>
                    <div className="lan-divider"><div className="lan-diamond" /></div>
                    <p className="lan-sub">Select the African country you currently live in.</p>

                    {/* search */}
                    <div className="lan-search-wrap">
                        <Search size={14} className="lan-search-icon" />
                        <input
                            type="text"
                            placeholder="Search country…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="lan-search"
                        />
                    </div>

                    {/* list */}
                    <div className="lan-list">
                        {filtered.length === 0
                            ? <div className="lan-empty">No country found</div>
                            : filtered.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setCountry(c); setError(''); }}
                                    className={`lan-country-btn${country === c ? ' selected' : ''}`}
                                >
                                    {c}
                                </button>
                            ))
                        }
                    </div>

                    {/* selected display */}
                    {country && (
                        <div className="lan-selected-box">
                            <div className="lan-selected-dot" />
                            {country}
                        </div>
                    )}

                    {error && <p className="lan-error">{error}</p>}

                    <button onClick={handleNext} disabled={!country} className="lan-btn">
                        Next <ArrowRight size={13} />
                    </button>

                    <p style={{ fontSize:'11px', color:'#bbb', marginTop:'32px', fontFamily:"'Playfair Display',serif", fontStyle:'italic', textAlign:'center' }}>
                        LAN Library — Est. for African Scholars
                    </p>
                </div>
            </div>
        </>
    );
}