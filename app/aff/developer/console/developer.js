'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, getDocs,
  updateDoc, doc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { db, auth } from '@/lib/firebaseConfig';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#05070f',
  surface: '#0a0d16',
  panel: '#0f1320',
  border: '#1a2035',
  purple: '#7c3aed',
  purpleL: '#a78bfa',
  purpleD: '#4c1d95',
  purpleGlow: 'rgba(124,58,237,0.15)',
  lime: '#a3e635',
  limeGlow: 'rgba(163,230,53,0.1)',
  red: '#f87171',
  amber: '#fbbf24',
  cyan: '#22d3ee',
  text: '#eef2ff',
  muted: '#475569',
  muted2: '#8892a4',
  mono: '"JetBrains Mono","Fira Code",monospace',
  sans: '"Inter",system-ui,-apple-system,sans-serif',
};

const ALL_CATEGORIES = [
  'business', 'education', 'technology', 'science', 'past questions',
  'literature', 'health wellness', 'history', 'arts culture',
  'personal development', 'mathematics', 'law', 'engineering',
  'economics', 'religion & spirituality', 'general',
];

const NAV_SECTIONS = [
  { id: 'key', label: 'API Key', icon: '🔑' },
  { id: 'origins', label: 'Origins', icon: '🛡' },
  { id: 'builder', label: 'Builder', icon: '⚙' },
  { id: 'snippets', label: 'Snippets', icon: '{ }' },
  { id: 'schema', label: 'Schema', icon: '◈' },
  { id: 'limits', label: 'Limits', icon: '⚡' },
];

// ── Primitives ────────────────────────────────────────────────────────────────
const Dot = ({ color, glow }) => (
  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${glow || color}`, flexShrink: 0 }} />
);

const Pill = ({ ok, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', backgroundColor: ok ? T.limeGlow : 'rgba(248,113,113,.08)', border: `1px solid ${ok ? 'rgba(163,230,53,.18)' : 'rgba(248,113,113,.18)'}`, color: ok ? T.lime : T.red, fontFamily: T.mono }}>
    <Dot color={ok ? T.lime : T.red} />{label}
  </span>
);

const Tag = ({ children, color = T.purpleL }) => (
  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '.06em', backgroundColor: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.2)', color, fontFamily: T.mono }}>{children}</span>
);

const MetaCell = ({ label, value, accent }) => (
  <div style={{ padding: '10px 12px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.panel }}>
    <div style={{ fontSize: 8, fontFamily: T.mono, color: T.muted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: T.mono, fontSize: 12, color: accent || T.text, fontWeight: 600 }}>{value}</div>
  </div>
);

const CopyBtn = ({ text, label = 'COPY', sx = {} }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: '4px 10px', fontSize: 9, fontWeight: 700, fontFamily: T.mono, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', border: `1px solid ${copied ? 'rgba(163,230,53,.3)' : T.border}`, borderRadius: 4, transition: 'all .15s', backgroundColor: copied ? T.limeGlow : 'rgba(255,255,255,.03)', color: copied ? T.lime : T.muted2, flexShrink: 0, ...sx }}>
      {copied ? '✓ COPIED' : label}
    </button>
  );
};

function SyntaxHighlight({ code }) {
  if (!code) return null;
  return (
    <>{code.split('\n').map((line, i) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      return (
        <span key={i} style={{ display: 'block', color: isComment ? '#546e7a' : undefined }}>
          {line.split(/('.*?'|".*?")/g).map((seg, j) =>
            j % 2 === 1 ? <span key={j} style={{ color: '#a8d8ff' }}>{seg}</span> : <span key={j}>{seg}</span>
          )}{'\n'}
        </span>
      );
    })}</>
  );
}

const CodeBlock = ({ code, language = '', maxHeight = 380 }) => (
  <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', backgroundColor: T.panel, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, opacity: .7 }} />)}
        </div>
        <span style={{ fontSize: 9, fontFamily: T.mono, color: T.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginLeft: 6 }}>{language}</span>
      </div>
      <CopyBtn text={code} />
    </div>
    <pre style={{ margin: 0, padding: '16px', fontFamily: T.mono, fontSize: 11.5, lineHeight: 1.75, color: '#cdd9e5', backgroundColor: T.surface, overflowX: 'auto', maxHeight, overflowY: 'auto', whiteSpace: 'pre' }}>
      <SyntaxHighlight code={code} />
    </pre>
  </div>
);

const Card = ({ id, children, sx = {} }) => (
  <div id={id} style={{ padding: '24px 20px', borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.surface, ...sx }}>{children}</div>
);

const CardTitle = ({ tag, title, desc }) => (
  <div style={{ marginBottom: 18 }}>
    <Tag style={{ marginBottom: 6 }}>{tag}</Tag>
    <h2 style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: '-.01em' }}>{title}</h2>
    {desc && <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted2, lineHeight: 1.6, fontFamily: T.mono }}>{desc}</p>}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AffiliateDeveloperSuiteClient() {
  const [user, setUser] = useState(null);
  const [keyData, setKeyData] = useState(null);
  const [keyDocId, setKeyDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('proxy');
  const [activeSection, setActiveSection] = useState('key');
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Mobile nav state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navRef = useRef(null);

  // Builder state
  const [queryLimit, setQueryLimit] = useState(10);
  const [selectedCats, setSelectedCats] = useState(['all']);
  const [priceFilter, setPriceFilter] = useState('all');

  // Close mobile nav on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (mobileNavOpen && navRef.current && !navRef.current.contains(e.target)) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileNavOpen]);

  // Close nav on escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'api_keys'), where('ownerUid', '==', user.uid), where('status', '==', 'active'));
        const snap = await getDocs(q);
        if (!snap.empty) { setKeyData(snap.docs[0].data()); setKeyDocId(snap.docs[0].id); }
      } catch { }
      setLoading(false);
    })();
  }, [user]);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const provisionKey = useCallback(async () => {
    if (!user) return;
    setProvisioning(true);
    try {
      const idToken = await getIdToken(user);
      const res = await fetch('/api/affiliate/provision-key', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
      const json = await res.json();
      if (json.success) { setKeyData(json.data); setKeyDocId(json.keyId); showToast('API key provisioned.'); }
      else showToast(json.error || 'Provisioning failed.', false);
    } catch { showToast('Network error.', false); }
    setProvisioning(false);
  }, [user]);

  const validateDomain = d => /^(https?:\/\/[\w.-]+(:\d+)?(\/.*)?)$/.test(d.trim()) || /^\*\.[\w.-]+$/.test(d.trim());

  const addDomain = useCallback(async () => {
    const val = newDomain.trim().toLowerCase();
    if (!validateDomain(val)) { setDomainError('Must be a valid origin: https://yourdomain.com or *.yourdomain.com'); return; }
    if ((keyData?.allowedOrigins || []).includes(val)) { setDomainError('Origin already registered.'); return; }
    setDomainLoading(true);
    try {
      await updateDoc(doc(db, 'api_keys', keyDocId), { allowedOrigins: arrayUnion(val) });
      setKeyData(p => ({ ...p, allowedOrigins: [...(p.allowedOrigins || []), val] }));
      setNewDomain(''); setDomainError(''); showToast('Domain registered.');
    } catch { showToast('Failed to add domain.', false); }
    setDomainLoading(false);
  }, [newDomain, keyData, keyDocId]);

  const removeDomain = useCallback(async domain => {
    try {
      await updateDoc(doc(db, 'api_keys', keyDocId), { allowedOrigins: arrayRemove(domain) });
      setKeyData(p => ({ ...p, allowedOrigins: (p.allowedOrigins || []).filter(d => d !== domain) }));
      showToast('Domain removed.');
    } catch { showToast('Failed to remove domain.', false); }
  }, [keyDocId]);

  const toggleCategory = (cat) => {
    if (cat === 'all') { setSelectedCats(['all']); return; }
    setSelectedCats(prev => {
      const without = prev.filter(c => c !== 'all');
      if (without.includes(cat)) {
        const next = without.filter(c => c !== cat);
        return next.length === 0 ? ['all'] : next;
      }
      return [...without, cat];
    });
  };

  const handleNavSelect = (sectionId) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
  };

  const apiKey = keyData?.apiKey || '—';
  const developerId = keyData?.developerId || '—';
  const origins = keyData?.allowedOrigins || [];
  const BASE = 'https://www.lanlibrary.com';

  const buildQS = () => {
    const parts = [`limit=${queryLimit}`];
    if (!selectedCats.includes('all') && selectedCats.length === 1) parts.push(`category=${encodeURIComponent(selectedCats[0])}`);
    if (priceFilter !== 'all') parts.push(`isFree=${priceFilter === 'free'}`);
    return parts.join('&');
  };
  const endpoint = `${BASE}/api/v1/books?${buildQS()}`;

  // ── Thumbnail helper (unchanged) ─────────────────────────────────────────
  const thumbnailHelper = `// Resolves the best available thumbnail from a LAN book object
const getThumbnailUrl = (book) => {
  if (book.driveFileId)
    return \`https://drive.google.com/thumbnail?id=\${book.driveFileId}&sz=w400\`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\\/d\\/(.*?)\\/|\\/file\\/d\\/(.*?)\\/|id=(.*?)(&|$)/);
    if (m) { const id = m[1]||m[2]||m[3]; if (id) return \`https://drive.google.com/thumbnail?id=\${id}&sz=w400\`; }
  }
  if (book.pdfUrl?.includes('drive.google.com')) {
    const m = book.pdfUrl.match(/[-\\w]{25,}/);
    if (m) return \`https://drive.google.com/thumbnail?id=\${m[0]}&sz=w400\`;
  }
  return book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};`;

  const multiCatNote = !selectedCats.includes('all') && selectedCats.length > 1
    ? `\n// NOTE: You selected ${selectedCats.length} categories. The LAN API filters by one category\n// per request. Loop the array below to fetch each and merge results.\nconst CATEGORIES = ${JSON.stringify(selectedCats)};\n`
    : '';

  // ── Code snippets ─────────────────────────────────────────────────────────
  const S = {

    // ── Proxy route ───────────────────────────────────────────────────────
    proxy: `// app/api/lan-books/route.js  —  copy into YOUR Next.js project
// Secure server-side proxy: your LAN API key is never sent to the browser.
//
// Add to .env.local:
//   LAN_API_KEY = lan_live_xxxxxxxxxxxx
//   LAN_API_URL = https://www.lanlibrary.com

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || 'all';
  const limit    = searchParams.get('limit')    || '${queryLimit}';
  const isFree   = searchParams.get('isFree');

  const params = new URLSearchParams({ limit });
  if (category !== 'all') params.set('category', category);
  if (isFree !== null)     params.set('isFree', isFree);

  try {
    const res = await fetch(
      \`\${process.env.LAN_API_URL}/api/v1/books?\${params}\`,
      {
        headers: { 'x-api-key': process.env.LAN_API_KEY || '' },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { success: false, error: \`Upstream \${res.status}\` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return Response.json({ success: true, data: json.data || json });
  } catch (err) {
    console.error('[lan-proxy]', err);
    return Response.json({ success: false, error: 'Proxy failed.' }, { status: 500 });
  }
}`,

    // ── cURL ──────────────────────────────────────────────────────────────
    curl: `# Direct server-side request  —  never run from a public browser or CI log
${multiCatNote ? '# Multiple categories selected: run once per category, merge the results.\n' : ''}
curl -s -X GET \\
  '${endpoint}' \\
  -H 'x-api-key: ${apiKey}' \\
  -H 'Accept: application/json' \\
  | jq '.data[] | {title, author, price, isFree}'`,

    // ── Fetch ─────────────────────────────────────────────────────────────
    fetch: `// Node.js ≥18 — server-side only. Never call the LAN API directly from a browser.
${multiCatNote}
async function getLanBooks({
  category = '${selectedCats.includes('all') ? 'all' : selectedCats[0]}',
  limit    = ${queryLimit},${priceFilter !== 'all' ? `\n  isFree   = ${priceFilter === 'free'},` : ''}
} = {}) {
  const params = new URLSearchParams({ limit });
  if (category !== 'all') params.set('category', category);${priceFilter !== 'all' ? `\n  params.set('isFree', String(isFree));` : ''}

  const res = await fetch(
    \`https://www.lanlibrary.com/api/v1/books?\${params}\`,
    { headers: { 'x-api-key': process.env.LAN_API_KEY } }
  );

  if (!res.ok) throw new Error(\`LAN API \${res.status}\`);
  const { data } = await res.json();
  return data;
}

const books = await getLanBooks();
console.log(books);`,

    // ── Next.js server component — LAN-style 4-card carousel ────────────
    nextjs: `// app/books/page.jsx  —  Next.js App Router Server Component
// Key lives only on the server; it never reaches the browser.
// Cards exactly match LAN Library's own document listing style.
${multiCatNote}
'use client'; // ← needed for the carousel arrows; move data-fetching to a parent server component

import { useState } from 'react';

/* ── Design tokens (same as LAN Library) ──────────────────────── */
const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const GOLDD = '#d4aa5a';
const CREAM = '#f5f0e8';
const BG    = '#f5f1ea';

/* ── Thumbnail resolver ────────────────────────────────────────── */
${thumbnailHelper}

const isFreeBook = (b) => b.isFree === true || Number(b.price) === 0;

/* ── Book card — identical markup to LAN Library ──────────────── */
function BookCard({ book }) {
  const free = isFreeBook(book);
  const image = getThumbnailUrl(book);

  return (
    <a
      href={book.affiliatePurchaseUrl || '#'}
      target="_blank"
      rel="noreferrer"
      style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}
      className="lan-book-card"
    >
      {/* Cover */}
      <div style={{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
        <img
          src={image}
          alt={book.title}
          className="lan-book-img"
          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
        />
        {/* PDF badge — top left */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: NAVY, padding: '4px 10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
        </div>
        {/* Free badge — top right */}
        {free && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg,#14532d,#166534)', color: '#86efac', fontSize: '8px', fontWeight: 700, padding: '3px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3 }}>
            🔓 FREE
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {book.title}
        </h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.author || 'Unknown'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
          {free
            ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif", background: 'linear-gradient(135deg,#14532d,#166534)', color: '#86efac', padding: '3px 8px', border: '0.5px solid rgba(134,239,172,0.4)' }}>
                🔓 Open Access
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                ₦{Number(book.price).toLocaleString()}
              </span>
            )
          }
          {book.category && (
            <span style={{ fontSize: '9px', fontWeight: 700, background: CREAM, border: '0.5px solid rgba(184,150,62,0.35)', color: GOLD, padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {book.category}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

/* ── Arrow button ──────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: 36, height: 36, borderRadius: '50%', border: \`0.5px solid \${disabled ? '#e5ddd0' : NAVY}\`, background: disabled ? CREAM : NAVY, color: disabled ? '#ccc' : '#fff', fontSize: 16, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

/* ── Carousel — shows 4 cards, arrows to step through ─────────── */
function BookCarousel({ books, title = 'Academic Documents' }) {
  const [start, setStart] = useState(0);
  const visible = 4;
  const canPrev = start > 0;
  const canNext = start + visible < books.length;

  return (
    <div style={{ fontFamily: "'Lato',sans-serif", background: BG }}>
      <style>{\`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&display=swap');
        .lan-book-card { text-decoration: none; display: block; }
        .lan-book-img  { transition: opacity .22s; }
        .lan-book-card:hover .lan-book-img { opacity: .88; }
        .lan-book-card:hover h4 { color: \${GOLD}; }
        h4 { transition: color .18s; }
      \`}</style>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>
            LAN Library
          </p>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: NAVY }}>
            {title}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ArrowBtn dir="prev" onClick={() => setStart(s => Math.max(0, s - visible))} disabled={!canPrev} />
          <ArrowBtn dir="next" onClick={() => setStart(s => Math.min(books.length - visible, s + visible))} disabled={!canNext} />
        </div>
      </div>

      {/* Cards row — exactly 4 visible */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {books.slice(start, start + visible).map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Dot indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
        {Array.from({ length: Math.ceil(books.length / visible) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStart(i * visible)}
            style={{ width: i === Math.floor(start / visible) ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all .2s', background: i === Math.floor(start / visible) ? NAVY : '#d4c9b8', padding: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Usage ─────────────────────────────────────────────────────── */
// In your server component parent, fetch and pass books down:
//
// async function getData() {
//   const res = await fetch('${endpoint}', {
//     headers: { 'x-api-key': process.env.LAN_API_KEY },
//     next: { revalidate: 3600 },
//   });
//   const { data } = await res.json();
//   return data || [];
// }
//
// export default async function Page() {
//   const books = await getData();
//   return <BookCarousel books={books} title="Study Materials" />;
// }`,

    // ── React client — LAN-style 4-card carousel (calls proxy) ──────────
    react: `// components/LanBookCatalog.jsx  —  calls YOUR proxy at /api/lan-books
// Cards exactly match LAN Library's own document listing style.
// Set up the Proxy Route first.
${multiCatNote}
'use client';
import { useEffect, useState } from 'react';

/* ── Design tokens (same as LAN Library) ──────────────────────── */
const NAVY  = '#0d2244';
const GOLD  = '#b8963e';
const CREAM = '#f5f0e8';
const BG    = '#f5f1ea';

/* ── Thumbnail resolver ────────────────────────────────────────── */
${thumbnailHelper}

const isFreeBook = (b) => b.isFree === true || Number(b.price) === 0;

const CATEGORIES = [
  { value: 'all', label: 'All' },${ALL_CATEGORIES.map(c => `\n  { value: '${c}', label: '${c.charAt(0).toUpperCase() + c.slice(1)}' },`).join('')}
];

/* ── Book card — identical markup to LAN Library ──────────────── */
function BookCard({ book }) {
  const free  = isFreeBook(book);
  const image = getThumbnailUrl(book);

  return (
    <a
      href={book.affiliatePurchaseUrl || '#'}
      target="_blank"
      rel="noreferrer"
      style={{ flexShrink: 0, width: '200px', textDecoration: 'none', display: 'block' }}
      className="lan-book-card"
    >
      {/* Cover */}
      <div style={{ position: 'relative', marginBottom: '12px', background: '#e8e4dc' }}>
        <img
          src={image}
          alt={book.title}
          className="lan-book-img"
          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'; }}
        />
        {/* PDF badge — top left */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: NAVY, padding: '4px 10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD, fontFamily: "'Lato',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PDF</span>
        </div>
        {/* Free badge — top right */}
        {free && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg,#14532d,#166534)', color: '#86efac', fontSize: '8px', fontWeight: 700, padding: '3px 7px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3 }}>
            🔓 FREE
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '13px', fontWeight: 700, color: NAVY, margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {book.title}
        </h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', fontFamily: "'Lato',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.author || 'Unknown'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
          {free
            ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Lato',sans-serif", background: 'linear-gradient(135deg,#14532d,#166534)', color: '#86efac', padding: '3px 8px', border: '0.5px solid rgba(134,239,172,0.4)' }}>
                🔓 Open Access
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: NAVY, fontFamily: "'Lato',sans-serif" }}>
                ₦{Number(book.price).toLocaleString()}
              </span>
            )
          }
          {book.category && (
            <span style={{ fontSize: '9px', fontWeight: 700, background: CREAM, border: '0.5px solid rgba(184,150,62,0.35)', color: GOLD, padding: '3px 8px', fontFamily: "'Lato',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {book.category}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

/* ── Arrow button ──────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 36, height: 36, borderRadius: '50%', border: \`0.5px solid \${disabled ? '#e5ddd0' : NAVY}\`, background: disabled ? CREAM : NAVY, color: disabled ? '#ccc' : '#fff', fontSize: 16, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

/* ── Main catalog with 4-card carousel ────────────────────────── */
export default function LanBookCatalog() {
  const [books,       setBooks]    = useState([]);
  const [loading,     setLoading]  = useState(true);
  const [error,       setError]    = useState(null);
  const [category,    setCategory] = useState('${selectedCats.includes('all') ? 'all' : selectedCats[0]}');
  const [priceFilter, setPrice]    = useState('${priceFilter}');
  const [start,       setStart]    = useState(0);
  const visible = 4;

  // Reset carousel when filters change
  useEffect(() => { setStart(0); }, [category, priceFilter]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '${queryLimit}' });
    if (category !== 'all')    params.set('category', category);
    if (priceFilter !== 'all') params.set('isFree', String(priceFilter === 'free'));

    fetch(\`/api/lan-books?\${params}\`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ data }) => { setBooks(data || []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [category, priceFilter]);

  const canPrev = start > 0;
  const canNext = start + visible < books.length;
  const pages   = Math.ceil(books.length / visible);
  const page    = Math.floor(start / visible);

  return (
    <>
      <style>{\`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .lan-book-card  { text-decoration: none; display: block; }
        .lan-book-img   { transition: opacity .22s; }
        .lan-book-card:hover .lan-book-img { opacity: .88; }
        .lan-book-card:hover h4 { color: #b8963e; }
        h4 { transition: color .18s; }
        .lan-filter-select { border: 0.5px solid #e5ddd0; background: #fff; color: #0d2244; font-family: 'Lato',sans-serif; font-size: 12px; font-weight: 700; padding: 8px 12px; outline: none; cursor: pointer; }
        @media (max-width: 640px) {
          .lan-cards-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      \`}</style>

      <div style={{ fontFamily: "'Lato',sans-serif", background: BG }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontFamily: "'Lato',sans-serif" }}>LAN Library</p>
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: NAVY }}>
              Academic Documents
            </h2>
          </div>
          {/* Arrows */}
          <div style={{ display: 'flex', gap: 8 }}>
            <ArrowBtn dir="prev" onClick={() => setStart(s => Math.max(0, s - visible))} disabled={!canPrev} />
            <ArrowBtn dir="next" onClick={() => setStart(s => Math.min(books.length - visible, s + visible))} disabled={!canNext} />
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', border: '0.5px solid #e5ddd0', padding: '12px 16px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} className="lan-filter-select">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all','All'], ['free','Free 🔓'], ['paid','Paid']].map(([val, lbl]) => (
              <button key={val} onClick={() => setPrice(val)} style={{ padding: '7px 14px', border: \`0.5px solid \${priceFilter === val ? NAVY : '#e5ddd0'}\`, background: priceFilter === val ? NAVY : '#fff', color: priceFilter === val ? '#fff' : NAVY, fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                {lbl}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa', fontFamily: "'Lato',sans-serif" }}>
            {books.length} document{books.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cards */}
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontFamily: "'Lato',sans-serif" }}>Loading catalog…</div>}
        {error   && <div style={{ color: '#ef4444', padding: 20, fontFamily: "'Lato',sans-serif" }}>Could not load. Check /api/lan-books proxy.</div>}
        {!loading && !error && (
          <>
            <div className="lan-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {books.slice(start, start + visible).map(book => (
                <BookCard key={book.id} book={book} />
              ))}
              {/* Placeholder cells so grid stays full */}
              {books.length > 0 && Array.from({ length: Math.max(0, visible - books.slice(start, start + visible).length) }).map((_, i) => (
                <div key={\`ph-\${i}\`} />
              ))}
            </div>

            {/* Dot pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} onClick={() => setStart(i * visible)} style={{ width: i === page ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', transition: 'all .2s', background: i === page ? NAVY : '#d4c9b8', padding: 0 }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}`,

    // ── PHP ─────────────────────────────────────────────────────────────────
    php: `<?php
// proxy/lan-books.php  —  store API key in .env or wp-config.php, never hardcode
// Cards match LAN Library's own document listing exactly.
${multiCatNote ? '// Multiple categories: call get_lan_books() once per category, then merge arrays.\n' : ''}
define('LAN_API_KEY', getenv('LAN_API_KEY'));

function get_lan_books(
  string $category = '${selectedCats.includes('all') ? 'all' : selectedCats[0]}',
  int    $limit    = ${queryLimit}${priceFilter !== 'all' ? `,\n  bool   $isFree   = ${priceFilter === 'free' ? 'true' : 'false'}` : ''}
): array {
  $params = http_build_query(array_filter([
    'limit'    => $limit,
    'category' => $category !== 'all' ? $category : null,${priceFilter !== 'all' ? `\n    'isFree'   => $isFree ? 'true' : 'false',` : ''}
  ]));
  $url = "https://www.lanlibrary.com/api/v1/books?{$params}";

  // WordPress: swap for wp_remote_get() + wp_remote_retrieve_body()
  $ctx = stream_context_create([
    'http' => ['method' => 'GET', 'header' => 'x-api-key: '.LAN_API_KEY."\\r\\n", 'timeout' => 10],
  ]);
  $body = @file_get_contents($url, false, $ctx);
  if (!$body) return [];
  $json = json_decode($body, true);
  return ($json['success'] ?? false) ? ($json['data'] ?? []) : [];
}

// ── Thumbnail resolver (mirrors LAN Library exactly) ───────────────────────
function get_thumbnail(array $b): string {
  if (!empty($b['driveFileId']))
    return "https://drive.google.com/thumbnail?id={$b['driveFileId']}&sz=w400";
  foreach (['embedUrl','pdfUrl'] as $key) {
    if (!empty($b[$key]) && str_contains($b[$key], 'drive.google.com'))
      if (preg_match('/[-\\w]{25,}/', $b[$key], $m))
        return "https://drive.google.com/thumbnail?id={$m[0]}&sz=w400";
  }
  return $b['coverImage'] ?? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
}

$books = get_lan_books();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Academic Catalog</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font-family:'Lato',sans-serif;background:#f5f1ea}
    header{background:#0d2244;padding:40px 24px 32px}
    .eyebrow{margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(184,150,62,.7)}
    header h1{margin:0;font-family:'Playfair Display',serif;font-size:clamp(22px,4vw,36px);font-weight:700;color:#fff}
    .header-sub{margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.45)}

    .section{max-width:1200px;margin:0 auto;padding:40px 24px 80px}
    .section-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
    .section-label{margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#b8963e}
    .section-title{margin:0;font-family:'Playfair Display',serif;font-size:clamp(20px,3vw,28px);font-weight:700;color:#0d2244}
    .arrows{display:flex;gap:8px}
    .arr{width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;border:0.5px solid #0d2244;background:#0d2244;color:#fff}
    .arr:disabled{border-color:#e5ddd0;background:#f5f0e8;color:#ccc;cursor:default}

    /* 4-column grid, collapses to 2 on mobile */
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
    @media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:480px){.cards{gap:14px}}

    /* Book card — identical markup to LAN Library */
    .lan-card{text-decoration:none;display:block}
    .lan-card:hover .lan-img{opacity:.88}
    .lan-card:hover .lan-title{color:#b8963e}
    .lan-img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;transition:opacity .22s}
    .lan-cover{position:relative;background:#e8e4dc;margin-bottom:12px}

    /* PDF badge — NAVY bg, GOLD text, green dot — top left — same as AllBooksClient */
    .badge-pdf{position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:5px;background:#0d2244;padding:4px 10px}
    .pdf-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0}
    .pdf-lbl{font-size:9px;font-weight:700;color:#b8963e;font-family:'Lato',sans-serif;letter-spacing:.1em;text-transform:uppercase}

    /* Free badge — green gradient top right */
    .badge-free{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#14532d,#166534);color:#86efac;font-size:8px;font-weight:700;padding:3px 7px;font-family:'Lato',sans-serif;letter-spacing:.06em;display:flex;align-items:center;gap:3px}

    /* Open Access inline badge (shown in price row for free books) */
    .oa-badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-family:'Lato',sans-serif;background:linear-gradient(135deg,#14532d,#166534);color:#86efac;padding:3px 8px;border:0.5px solid rgba(134,239,172,.4)}

    .lan-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#0d2244;margin:0 0 4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color .18s}
    .lan-author{font-size:11px;color:#888;margin:0 0 8px;font-family:'Lato',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .price-row{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}
    .price-ngn{font-size:13px;font-weight:700;color:#0d2244;font-family:'Lato',sans-serif}
    .cat-tag{font-size:9px;font-weight:700;background:#f5f0e8;border:0.5px solid rgba(184,150,62,.35);color:#b8963e;padding:3px 8px;font-family:'Lato',sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}

    /* Dot pagination */
    .dots{display:flex;justify-content:center;gap:6px;margin-top:20px}
    .dot{height:6px;border-radius:3px;border:none;cursor:pointer;transition:all .2s;background:#d4c9b8;padding:0}
  </style>
</head>
<body>

<header>
  <p class="eyebrow">Academic Library</p>
  <h1>Documents &amp; Study Materials</h1>
  <p class="header-sub"><?= count($books) ?> documents available</p>
</header>

<div class="section">
  <div class="section-header">
    <div>
      <p class="section-label">LAN Library</p>
      <h2 class="section-title">Academic Documents</h2>
    </div>
    <div class="arrows">
      <button class="arr" id="prev" onclick="go(-1)" disabled>&#8249;</button>
      <button class="arr" id="next" onclick="go(1)">&#8250;</button>
    </div>
  </div>

  <div class="cards" id="cards">
  <?php foreach ($books as $i => $b):
    $free  = ($b['isFree'] ?? false) || (float)($b['price'] ?? 0) === 0.0;
    $price = number_format((float)($b['price'] ?? 0));
    $thumb = get_thumbnail($b);
    $href  = htmlspecialchars($b['affiliatePurchaseUrl'] ?? '#');
    $title = htmlspecialchars($b['title']    ?? 'Untitled');
    $auth  = htmlspecialchars($b['author']   ?? 'Unknown');
    $cat   = htmlspecialchars($b['category'] ?? '');
    $hide  = $i >= 4 ? 'style="display:none"' : '';
  ?>
    <a href="<?= $href ?>" target="_blank" rel="noreferrer" class="lan-card" data-i="<?= $i ?>" <?= $hide ?>>
      <div class="lan-cover">
        <img src="<?= $thumb ?>" alt="<?= $title ?>" class="lan-img" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'" />
        <div class="badge-pdf"><span class="pdf-dot"></span><span class="pdf-lbl">PDF</span></div>
        <?php if ($free): ?><div class="badge-free">🔓 FREE</div><?php endif; ?>
      </div>
      <h4 class="lan-title"><?= $title ?></h4>
      <p class="lan-author"><?= $auth ?></p>
      <div class="price-row">
        <?php if ($free): ?>
          <span class="oa-badge">🔓 Open Access</span>
        <?php else: ?>
          <span class="price-ngn">₦<?= $price ?></span>
        <?php endif; ?>
        <?php if ($cat): ?><span class="cat-tag"><?= $cat ?></span><?php endif; ?>
      </div>
    </a>
  <?php endforeach; ?>
  </div>

  <div class="dots" id="dots"></div>
</div>

<script>
(function(){
  var PER=4,cards=Array.from(document.querySelectorAll('.lan-card')),
      n=cards.length,pages=Math.ceil(n/PER),cur=0,
      prevBtn=document.getElementById('prev'),
      nextBtn=document.getElementById('next'),
      dotsEl=document.getElementById('dots');

  function buildDots(){
    for(var i=0;i<pages;i++){
      var d=document.createElement('button');d.className='dot';d.dataset.p=i;
      d.style.cssText='width:'+(i===0?'20px':'6px')+';background:'+(i===0?'#0d2244':'#d4c9b8');
      d.onclick=(function(p){return function(){go2(p)};})(i);dotsEl.appendChild(d);
    }
  }
  function go2(page){
    cur=Math.max(0,Math.min(page,pages-1));
    var s=cur*PER;
    cards.forEach(function(c,i){c.style.display=(i>=s&&i<s+PER)?'':'none';});
    prevBtn.disabled=cur===0;nextBtn.disabled=cur>=pages-1;
    dotsEl.querySelectorAll('.dot').forEach(function(d,i){
      d.style.width=i===cur?'20px':'6px';d.style.background=i===cur?'#0d2244':'#d4c9b8';
    });
  }
  function go(dir){go2(cur+dir);}
  window.go=go;
  if(pages>1)buildDots();
  prevBtn.disabled=true;nextBtn.disabled=pages<=1;
})();
</script>
</body>
</html>`,
};

// ── Snippet tabs ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'proxy', label: 'Proxy Route', lang: 'javascript', note: 'Copy this into app/api/lan-books/route.js. Keeps your API key server-side. The React and Fetch snippets call this route — never the LAN API directly.' },
  { id: 'curl', label: 'cURL', lang: 'bash', note: 'Run in any terminal. Pipe to jq to inspect the JSON. Never expose your key in public CI logs.' },
  { id: 'fetch', label: 'Fetch', lang: 'javascript', note: 'Node.js ≥18 server-side only. Do not call the LAN API from a browser — key exposure risk.' },
  { id: 'nextjs', label: 'Next.js', lang: 'jsx', note: 'Server component + client carousel. Cards match LAN Library exactly: NAVY PDF badge, Open Access green badge, Playfair Display / Lato fonts, ₦ price or "Open Access" inline badge. Shows 4 per row with arrow + dot pagination.' },
  { id: 'react', label: 'React', lang: 'jsx', note: 'Client component calling YOUR /api/lan-books proxy. Same LAN card style — 4-column grid, arrow navigation, dot pagination, responsive to 2 columns on mobile. Set up the proxy first.' },
  { id: 'php', label: 'PHP', lang: 'php', note: 'Drop-in PHP page with full LAN card style — Playfair Display / Lato fonts, NAVY PDF badge, green Free badge, Open Access inline badge, ₦ price. JS carousel shows 4 per row with arrows and dot pagination. Works in WordPress too.' },
];

// ── Section renderer ──────────────────────────────────────────────────────
const renderSection = () => {
  if (!keyData) return null;
  switch (activeSection) {

    case 'key': return (
      <Card>
        <CardTitle tag="AUTH" title="Your API Key" desc="Send as the x-api-key request header on every call" />
        <div style={{ padding: '11px 13px', borderRadius: 6, border: `1px solid ${isKeyVisible ? 'rgba(124,58,237,.35)' : T.border}`, backgroundColor: T.bg, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, transition: 'border-color .2s', flexWrap: 'wrap' }}>
          <code style={{ flex: 1, fontFamily: T.mono, fontSize: 11, color: isKeyVisible ? T.purpleL : T.muted, wordBreak: 'break-all', letterSpacing: '.025em', minWidth: 0 }}>
            {isKeyVisible ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
          </code>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => setIsKeyVisible(v => !v)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: T.muted2, fontSize: 9, fontFamily: T.mono, letterSpacing: '.06em' }}>
              {isKeyVisible ? 'HIDE' : 'SHOW'}
            </button>
            <CopyBtn text={apiKey} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, marginBottom: 14 }}>
          <MetaCell label="Affiliate ID" value={developerId} accent={T.purpleL} />
          <MetaCell label="Requests" value={(keyData.requestCount || 0).toLocaleString()} />
          <MetaCell label="Last used" value={keyData.lastUsed ? new Date(keyData.lastUsed).toLocaleDateString('en-NG') : 'Never'} />
          <MetaCell label="Status" value={keyData.status || 'active'} accent={T.lime} />
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(251,191,36,.12)', backgroundColor: 'rgba(251,191,36,.04)', marginBottom: 14 }}>
          <p style={{ margin: 0, fontFamily: T.mono, fontSize: 9.5, color: T.amber, lineHeight: 1.6 }}>
            ⚠ Never expose this key in client-side code.<br />Store it in your server environment variables only.
          </p>
        </div>

        {/* Learn how to use link */}
        <a href="/seller/api-integration" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 7, border: `1px solid rgba(124,58,237,.35)`, backgroundColor: T.purpleGlow, textDecoration: 'none', transition: 'border-color .15s' }}>
          <span style={{ fontSize: 14 }}>📘</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.purpleL, letterSpacing: '.04em' }}>Learn how to use the Developer Suite</span>
          <span style={{ fontSize: 11, color: T.muted }}>→</span>
        </a>
      </Card>
    );

    case 'origins': return (
      <Card>
        <CardTitle tag="SECURITY" title="Allowed Origins" desc="Restrict which domains can send browser requests with your key" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {origins.length === 0 ? (
            <div style={{ padding: '10px 12px', borderRadius: 6, border: `1px dashed ${T.border}`, fontFamily: T.mono, fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
              No origins registered. Server-to-server calls work without this.<br />Add a domain to allow browser requests.
            </div>
          ) : origins.map(o => (
            <div key={o} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Dot color={T.lime} glow={T.limeGlow} />
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.purpleL, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o}</span>
              </div>
              <button onClick={() => removeDomain(o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0 }} title="Remove">×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <input value={newDomain} onChange={e => { setNewDomain(e.target.value); setDomainError(''); }} onKeyDown={e => e.key === 'Enter' && addDomain()} placeholder="https://yourwebsite.com"
            style={{ flex: 1, minWidth: 180, padding: '8px 11px', fontFamily: T.mono, fontSize: 11, backgroundColor: T.bg, color: T.text, border: `1px solid ${domainError ? T.red : T.border}`, borderRadius: 6, outline: 'none' }} />
          <button onClick={addDomain} disabled={domainLoading}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: `linear-gradient(135deg,${T.purple},#6d28d9)`, color: '#fff', fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', cursor: 'pointer', opacity: domainLoading ? .5 : 1 }}>
            {domainLoading ? '…' : 'ADD'}
          </button>
        </div>
        {domainError && <p style={{ margin: '4px 0 6px', fontFamily: T.mono, fontSize: 9.5, color: T.red }}>{domainError}</p>}
        <p style={{ margin: '4px 0 0', fontFamily: T.mono, fontSize: 9, color: T.muted, lineHeight: 1.6 }}>Formats: https://example.com · http://localhost:3000 · *.example.com</p>
      </Card>
    );

    case 'builder': return (
      <Card>
        <CardTitle tag="BUILDER" title="Live Endpoint Builder" desc="Configure your query — URL and all code snippets update instantly" />

        {/* Price filter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Content Type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { val: 'all', label: 'All Documents', desc: 'Free + Paid' },
              { val: 'free', label: 'Free Only', desc: 'Open Access' },
              { val: 'paid', label: 'Paid Only', desc: 'Earn commission' },
            ].map(({ val, label, desc }) => (
              <button key={val} onClick={() => setPriceFilter(val)} style={{
                padding: '8px 14px', borderRadius: 6, cursor: 'pointer', transition: 'all .1s',
                border: `1px solid ${priceFilter === val ? T.purple : T.border}`,
                backgroundColor: priceFilter === val ? T.purpleGlow : 'transparent',
                color: priceFilter === val ? T.purpleL : T.muted2,
                fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              }}>
                <span style={{ fontSize: 10 }}>{label}</span>
                <span style={{ fontSize: 8, opacity: .7, fontWeight: 400 }}>{desc}</span>
              </button>
            ))}
          </div>
          {priceFilter !== 'all' && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 5, border: `1px solid ${T.border}`, backgroundColor: T.panel, fontFamily: T.mono, fontSize: 9, color: T.muted2, lineHeight: 1.6 }}>
              {priceFilter === 'free'
                ? '🔓 Only Open Access documents — isFree=true. Great for educational sites and resource hubs.'
                : '💰 Only paid documents — isFree=false. Your affiliate link earns commission on every purchase.'}
            </div>
          )}
        </div>

        {/* Category multi-select */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase' }}>Categories</span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted2 }}>
              {selectedCats.includes('all') ? 'All selected' : `${selectedCats.length} selected`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <button onClick={() => toggleCategory('all')} style={{
              padding: '4px 10px', borderRadius: 4, fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .1s',
              border: `1px solid ${selectedCats.includes('all') ? T.purple : T.border}`,
              backgroundColor: selectedCats.includes('all') ? T.purpleGlow : 'transparent',
              color: selectedCats.includes('all') ? T.purpleL : T.muted,
            }}>ALL</button>
            {ALL_CATEGORIES.map(c => {
              const active = !selectedCats.includes('all') && selectedCats.includes(c);
              return (
                <button key={c} onClick={() => toggleCategory(c)} style={{
                  padding: '4px 10px', borderRadius: 4, fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .1s',
                  border: `1px solid ${active ? T.cyan : T.border}`,
                  backgroundColor: active ? 'rgba(34,211,238,.1)' : 'transparent',
                  color: active ? T.cyan : T.muted,
                }}>{c}</button>
              );
            })}
          </div>
          {!selectedCats.includes('all') && selectedCats.length > 1 && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 5, border: `1px solid rgba(34,211,238,.2)`, backgroundColor: 'rgba(34,211,238,.05)', fontFamily: T.mono, fontSize: 9, color: T.cyan, lineHeight: 1.6 }}>
              ℹ The LAN API filters by one category per request. Your snippet includes an array of selected categories — loop through them and merge the results.
            </div>
          )}
        </div>

        {/* Limit slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase' }}>Results per request</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text, fontWeight: 700 }}>{queryLimit} books</span>
          </div>
          <input type="range" min={1} max={100} value={queryLimit} onChange={e => setQueryLimit(+e.target.value)} style={{ width: '100%', accentColor: T.purple }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: T.mono, fontSize: 8, color: T.muted }}>
            <span>1</span><span>50</span><span>100</span>
          </div>
        </div>

        {/* Live URL */}
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Live endpoint URL</div>
        <div style={{ padding: '10px 12px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.bg, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <code style={{ flex: 1, fontFamily: T.mono, fontSize: 10, color: T.purpleL, wordBreak: 'break-all', lineHeight: 1.5, minWidth: 0 }}>{endpoint}</code>
          <CopyBtn text={endpoint} label="URL" />
        </div>

        {/* Summary chips */}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { k: 'Price', v: priceFilter === 'all' ? 'All' : priceFilter === 'free' ? 'Free only 🔓' : 'Paid only 💰' },
            { k: 'Categories', v: selectedCats.includes('all') ? 'All' : selectedCats.join(', ') },
            { k: 'Limit', v: `${queryLimit} per request` },
          ].map(({ k, v }) => (
            <div key={k} style={{ padding: '6px 10px', borderRadius: 5, border: `1px solid ${T.border}`, backgroundColor: T.panel, fontFamily: T.mono, fontSize: 9 }}>
              <span style={{ color: T.muted, marginRight: 6 }}>{k}:</span>
              <span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    );

    case 'snippets': return (
      <Card>
        <CardTitle tag="INTEGRATION" title="Code Snippets" desc="Start with the Proxy Route tab — every other snippet depends on it" />

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, padding: 3, backgroundColor: T.bg, borderRadius: 7, border: `1px solid ${T.border}`, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '5px 11px', borderRadius: 5, fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: '.04em', cursor: 'pointer', transition: 'all .1s',
              border: activeTab === t.id ? `1px solid ${T.border}` : '1px solid transparent',
              backgroundColor: activeTab === t.id ? T.panel : 'transparent',
              color: activeTab === t.id ? (t.id === 'proxy' ? T.amber : T.lime) : T.muted,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {t.id === 'proxy' && <span style={{ marginRight: 4 }}>🔑</span>}{t.label}
            </button>
          ))}
        </div>

        {activeTab === 'proxy' && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(251,191,36,.25)', backgroundColor: 'rgba(251,191,36,.05)', fontFamily: T.mono, fontSize: 10, color: T.amber, lineHeight: 1.7 }}>
            <strong>Start here.</strong> Copy this into <code style={{ backgroundColor: 'rgba(255,255,255,.07)', padding: '1px 5px', borderRadius: 3 }}>app/api/lan-books/route.js</code>.<br />
            Add <code style={{ backgroundColor: 'rgba(255,255,255,.07)', padding: '1px 5px', borderRadius: 3 }}>LAN_API_KEY=lan_live_xxx</code> to <code style={{ backgroundColor: 'rgba(255,255,255,.07)', padding: '1px 5px', borderRadius: 3 }}>.env.local</code>. The React and Fetch snippets call this route.
          </div>
        )}

        <CodeBlock code={S[activeTab]} language={TABS.find(t => t.id === activeTab)?.lang} maxHeight={440} />

        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.panel, fontFamily: T.mono, fontSize: 10, color: T.muted2, lineHeight: 1.7 }}>
          {TABS.find(t => t.id === activeTab)?.note}
        </div>

        {/* Learn more link */}
        <div style={{ marginTop: 14 }}>
          <a href="/seller/api-integration" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 6, border: `1px solid rgba(124,58,237,.3)`, backgroundColor: T.purpleGlow, textDecoration: 'none' }}>
            <span style={{ fontSize: 13 }}>📘</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.purpleL, letterSpacing: '.04em' }}>Full integration guide</span>
            <span style={{ fontSize: 11, color: T.muted }}>→</span>
          </a>
        </div>
      </Card>
    );

    case 'schema': return (
      <Card>
        <CardTitle tag="SCHEMA" title="Response Shape" desc="Every book object in the data array" />
        <CodeBlock language="typescript" maxHeight={360} code={`// 200 OK
{
  success:   true,
  affiliate: string,        // your registered name
  count:     number,
  data: Array<{
    id:                   string,
    title:                string,
    author:               string,
    category:             string,
    coverImage:           string,   // may be empty — use getThumbnailUrl() helper
    driveFileId:          string,   // preferred thumbnail source
    embedUrl:             string,   // fallback thumbnail source
    pdfUrl:               string,   // fallback thumbnail source
    description:          string,
    price:                number,   // 0 = free
    isFree:               boolean,
    currency:             "NGN",
    slug:                 string,
    affiliatePurchaseUrl: string,   // ?aff=YOUR_ID auto-appended
  }>
}

// ── Thumbnail resolution ─────────────────────────────────────────
// Always call getThumbnailUrl(book) — not book.coverImage directly.
// driveFileId  →  https://drive.google.com/thumbnail?id=…&sz=w400
// embedUrl     →  extract Drive ID from URL
// pdfUrl       →  extract Drive ID from URL
// fallback     →  book.coverImage or placeholder

// Error responses
{ success: false, error: string }
// 401  Missing x-api-key header
// 403  Invalid key · origin not whitelisted
// 500  Server error`} />
      </Card>
    );

    case 'limits': return (
      <Card>
        <CardTitle tag="LIMITS" title="Rate Limits & Notes" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
          {[
            ['Max limit', '100 results'],
            ['Default limit', '10 results'],
            ['Auth method', 'x-api-key header'],
            ['Protocol', 'HTTPS only'],
            ['CORS', 'Origin whitelist'],
            ['Cache hint', '60 – 3 600 s'],
            ['Format', 'JSON'],
            ['Tracking', '?aff= auto-appended'],
            ['Free filter', 'isFree=true/false'],
            ['Category filter', 'One per request'],
            ['Thumbnails', 'Use getThumbnailUrl()'],
            ['Cost', 'Free (beta)'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '9px 11px', borderRadius: 6, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 8, fontFamily: T.mono, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
    );

    default: return null;
  }
};

// ── Render ────────────────────────────────────────────────────────────────
return (
  <div style={{ minHeight: '100vh', backgroundColor: T.bg, color: T.text, fontFamily: T.sans, fontSize: 13 }}>

    <style>{`
                @keyframes pulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
                @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes slide-in{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
                input[type="range"]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:${T.border};outline:none}
                input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.purple};cursor:pointer;box-shadow:0 0 8px rgba(124,58,237,.5)}
                .aff-nav-btn{background:none;border:none;cursor:pointer;transition:all .15s;text-align:left}
                .aff-nav-btn:hover{background:rgba(255,255,255,.04)!important}
                .aff-section{animation:fade-in .2s ease}
                .mobile-nav-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(2px);z-index:199}
                .mobile-nav-drawer{animation:slide-in .2s ease;position:fixed;top:0;left:0;bottom:0;width:240px;background:${T.surface};border-right:1px solid ${T.border};z-index:200;overflow-y:auto;display:flex;flex-direction:column}
                @media(min-width:768px){.mobile-menu-btn{display:none!important}.desktop-sidebar{display:flex!important}}
                @media(max-width:767px){.desktop-sidebar{display:none!important}.mobile-menu-btn{display:flex!important}}
            `}</style>

    {/* Toast */}
    {toast && (
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 18px', borderRadius: 8, backgroundColor: toast.ok ? 'rgba(163,230,53,.08)' : 'rgba(248,113,113,.08)', border: `1px solid ${toast.ok ? 'rgba(163,230,53,.2)' : 'rgba(248,113,113,.2)'}`, color: toast.ok ? T.lime : T.red, fontFamily: T.mono, fontSize: 11, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 'calc(100vw - 40px)' }}>
        <Dot color={toast.ok ? T.lime : T.red} />{toast.msg}
      </div>
    )}

    {/* Mobile nav overlay */}
    {mobileNavOpen && (
      <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
    )}

    {/* Mobile nav drawer */}
    {mobileNavOpen && (
      <div className="mobile-nav-drawer" ref={navRef}>
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dot color={T.lime} glow="rgba(163,230,53,.6)" />
            <span style={{ fontFamily: T.mono, fontWeight: 800, fontSize: 12, color: T.text, letterSpacing: '.04em' }}>
              LAN<span style={{ color: T.purpleL }}>::</span>AFFILIATE
            </span>
          </div>
          <button onClick={() => setMobileNavOpen(false)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted2, fontSize: 16 }}>×</button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '8px 0', flex: 1 }}>
          <div style={{ padding: '8px 16px 6px', fontFamily: T.mono, fontSize: 8, color: T.muted, letterSpacing: '.14em', textTransform: 'uppercase' }}>Navigation</div>
          {NAV_SECTIONS.map(s => (
            <button key={s.id} className="aff-nav-btn" onClick={() => handleNavSelect(s.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 18px',
              backgroundColor: activeSection === s.id ? T.purpleGlow : 'transparent',
              borderLeft: `2px solid ${activeSection === s.id ? T.purple : 'transparent'}`,
              color: activeSection === s.id ? T.purpleL : T.muted2,
              fontFamily: T.mono, fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400,
              letterSpacing: '.03em',
            }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Learn link in drawer */}
        <div style={{ padding: '12px 14px 20px', borderTop: `1px solid ${T.border}` }}>
          <a href="/seller/api-integration" onClick={() => setMobileNavOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 7, border: `1px solid rgba(124,58,237,.3)`, backgroundColor: T.purpleGlow, textDecoration: 'none' }}>
            <span style={{ fontSize: 14 }}>📘</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.purpleL, letterSpacing: '.03em', lineHeight: 1.4 }}>Integration Guide</span>
          </a>
        </div>
      </div>
    )}

    {/* Top bar */}
    <header style={{ borderBottom: `1px solid ${T.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54, backgroundColor: T.surface, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Hamburger — mobile only */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileNavOpen(v => !v)}
          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 5, width: 34, height: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
          aria-label="Open navigation"
        >
          {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 16, height: 1.5, backgroundColor: T.muted2, borderRadius: 1 }} />)}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot color={T.lime} glow="rgba(163,230,53,.6)" />
          <span style={{ fontFamily: T.mono, fontWeight: 800, fontSize: 13, color: T.text, letterSpacing: '.04em' }}>
            LAN<span style={{ color: T.purpleL }}>::</span><span style={{ display: 'inline' }}>AFFILIATE</span>
          </span>
        </div>
        <span style={{ width: 1, height: 18, backgroundColor: T.border, display: 'none' }} className="sep" />
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', display: 'none' }} className="ver">v1.2</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Pill ok={!!keyData} label={keyData ? 'KEY ACTIVE' : 'NO KEY'} />
        <Pill ok={!!user} label={user ? 'AUTH' : 'SIGNED OUT'} />
      </div>
    </header>

    {/* Page hero */}
    <div style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}`, padding: '24px 16px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Tag color={T.cyan}>GET /api/v1/books</Tag>
        <h1 style={{ margin: '10px 0 6px', fontSize: 'clamp(16px,4vw,24px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.15 }}>Affiliate Developer Suite</h1>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: T.muted2, maxWidth: 480, lineHeight: 1.65 }}>Embed LAN Library's academic catalog on your website. Every purchase earns commission — tracked automatically via your affiliate ID.</p>

        {/* Learn how to use — hero link */}
        <a href="/seller/api-integration" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 6, border: `1px solid rgba(124,58,237,.35)`, backgroundColor: T.purpleGlow, textDecoration: 'none', transition: 'border-color .15s' }}>
          <span style={{ fontSize: 13 }}>📘</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.purpleL, letterSpacing: '.04em' }}>Learn how to use the Developer Suite</span>
          <span style={{ fontSize: 10, color: T.muted }}>→</span>
        </a>

        {keyData && (
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.panel, fontFamily: T.mono, fontSize: 10 }}>
            <span style={{ color: T.muted, letterSpacing: '.06em' }}>AFFILIATE ID</span>
            <span style={{ color: T.purpleL, fontWeight: 700, fontSize: 12 }}>{developerId}</span>
            <CopyBtn text={developerId} label="COPY ID" />
          </div>
        )}
      </div>
    </div>

    {/* Auth gates */}
    {!user ? (
      <div style={{ maxWidth: 440, margin: '60px auto 0', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ padding: 40, borderRadius: 12, border: `1px dashed ${T.border}`, backgroundColor: T.surface }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔐</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Authentication Required</h3>
          <p style={{ margin: 0, color: T.muted2, fontSize: 12, lineHeight: 1.6 }}>Sign in to your LAN Library account to access your API key and developer tools.</p>
        </div>
      </div>
    ) : loading ? (
      <div style={{ textAlign: 'center', padding: 80, color: T.muted, fontFamily: T.mono, fontSize: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: T.purple, animation: `pulse 1.2s ease-in-out ${i * .2}s infinite` }} />)}
        </div>
        Fetching key data…
      </div>
    ) : !keyData ? (
      <div style={{ maxWidth: 480, margin: '60px auto 0', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ padding: 40, borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${T.purple},${T.purpleD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px' }}>🔑</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>No API Key Found</h3>
          <p style={{ margin: '0 0 24px', color: T.muted2, fontSize: 12, lineHeight: 1.7 }}>You don't have an affiliate API key yet. Generate yours instantly.</p>
          <button onClick={provisionKey} disabled={provisioning} style={{ padding: '12px 28px', borderRadius: 8, border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer', background: provisioning ? T.muted : `linear-gradient(135deg,${T.purple},#6d28d9)`, color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '.02em', transition: 'opacity .15s', opacity: provisioning ? .6 : 1, boxShadow: provisioning ? 'none' : '0 4px 20px rgba(124,58,237,.4)' }}>
            {provisioning ? 'Generating…' : '⚡ Generate My API Key'}
          </button>
          <p style={{ margin: '12px 0 0', fontFamily: T.mono, fontSize: 9, color: T.muted }}>Free · Instant · No approval needed</p>
        </div>
      </div>
    ) : (
      /* Main dashboard */
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 54px)' }}>

        {/* Desktop Sidebar */}
        <nav className="desktop-sidebar" style={{ width: 196, flexShrink: 0, borderRight: `1px solid ${T.border}`, padding: '20px 0', position: 'sticky', top: 54, height: 'calc(100vh - 54px)', overflowY: 'auto', backgroundColor: T.surface, flexDirection: 'column' }}>
          <div style={{ padding: '0 12px 10px', fontFamily: T.mono, fontSize: 8, color: T.muted, letterSpacing: '.14em', textTransform: 'uppercase' }}>Navigation</div>
          {NAV_SECTIONS.map(s => (
            <button key={s.id} className="aff-nav-btn" onClick={() => setActiveSection(s.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              backgroundColor: activeSection === s.id ? T.purpleGlow : 'transparent',
              borderLeft: `2px solid ${activeSection === s.id ? T.purple : 'transparent'}`,
              color: activeSection === s.id ? T.purpleL : T.muted2,
              fontFamily: T.mono, fontSize: 11, fontWeight: activeSection === s.id ? 700 : 400,
              letterSpacing: '.03em',
            }}>
              <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
              {s.label}
              {s.id === 'builder' && (
                <span style={{ marginLeft: 'auto', fontSize: 8, color: T.muted, fontFamily: T.mono }}>
                  {priceFilter === 'free' ? '🔓' : priceFilter === 'paid' ? '💰' : '·'}
                </span>
              )}
              {s.id === 'snippets' && activeSection !== 'snippets' && (
                <span style={{ marginLeft: 'auto', fontSize: 8, color: T.muted, fontFamily: T.mono }}>{activeTab}</span>
              )}
            </button>
          ))}

          {/* Learn link */}
          <div style={{ margin: '16px 12px 0', padding: '12px', borderRadius: 7, border: `1px solid rgba(124,58,237,.25)`, backgroundColor: T.purpleGlow }}>
            <a href="/seller/api-integration" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
              <span style={{ fontSize: 14 }}>📘</span>
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.purpleL, letterSpacing: '.03em', lineHeight: 1.4 }}>Integration<br />Guide →</span>
            </a>
          </div>

          {/* Stats */}
          <div style={{ margin: '12px 12px 0', padding: '12px', borderRadius: 6, border: `1px solid ${T.border}`, backgroundColor: T.panel }}>
            <div style={{ fontFamily: T.mono, fontSize: 8, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Requests</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.text }}>{(keyData.requestCount || 0).toLocaleString()}</div>
            <div style={{ fontFamily: T.mono, fontSize: 8, color: T.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 10, marginBottom: 4 }}>Last used</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted2 }}>{keyData.lastUsed ? new Date(keyData.lastUsed).toLocaleDateString('en-NG') : 'Never'}</div>
          </div>
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px 16px 80px', minWidth: 0, overflowX: 'hidden' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: '.08em', textTransform: 'uppercase', flexWrap: 'wrap' }}>
            <span>Dashboard</span>
            <span style={{ color: T.border }}>›</span>
            <span style={{ color: T.purpleL }}>{NAV_SECTIONS.find(s => s.id === activeSection)?.label}</span>
          </div>
          <div className="aff-section" key={activeSection}>
            {renderSection()}
          </div>
        </main>
      </div>
    )}
  </div>
);
}