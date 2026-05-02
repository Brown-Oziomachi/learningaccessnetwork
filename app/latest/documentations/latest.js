"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Star, Search, Clock, ArrowLeft, Sparkles, BookOpen, Flame, X, ShoppingBag, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/NavBar';

/* ─── design tokens ─────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const BG    = "#f5f1ea";

/* ─── thumbnail ─────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
  if (!book) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
  if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]||m[2]}&sz=w400`;
  }
  const src = book.pdfUrl || book.pdfLink;
  if (src?.includes('drive.google.com')) {
    const m = src.match(/\/d\/([\w-]{25,})|\/file\/d\/([\w-]{25,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]||m[2]}&sz=w400`;
  }
  return book.image || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';
};

export default function LatestDocsClient() {
  const router = useRouter();
  const [books, setBooks]        = useState([]);
  const [loading, setLoading]    = useState(true);
  const [filterBy, setFilterBy]  = useState('all');
  const [sortBy, setSortBy]      = useState('newest');
  const [searchQuery, setSearch] = useState('');
  const [stats, setStats]        = useState({ totalBooks:0, thisMonth:0, thisWeek:0, today:0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (!u) router.push('/auth/signin'); });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const s2026 = Timestamp.fromDate(new Date('2026-01-01T00:00:00'));
        const e2026 = Timestamp.fromDate(new Date('2026-12-31T23:59:59'));
        const q = query(
          collection(db,'advertMyBook'),
          where('status','==','approved'),
          where('createdAt','>=',s2026),
          where('createdAt','<=',e2026),
          orderBy('createdAt','desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        const now = new Date();
        const som = new Date(now.getFullYear(), now.getMonth(), 1);
        const sow = new Date(now); sow.setDate(now.getDate()-now.getDay());
        const sod = new Date(now); sod.setHours(0,0,0,0);
        let mC=0,wC=0,dC=0;
        const fetched = [];
        snap.forEach(ds => {
          const data = ds.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          if (createdAt>=som) mC++;
          if (createdAt>=sow) wC++;
          if (createdAt>=sod) dC++;
          const b = {
            id:`firestore-${ds.id}`, firestoreId:ds.id,
            title:data.bookTitle, author:data.author,
            category:data.category, price:data.price, rating:4.5,
            views:data.views||0, purchases:data.purchases||0,
            driveFileId:data.driveFileId, pdfUrl:data.pdfUrl, embedUrl:data.embedUrl,
            createdAt, isNew:(now-createdAt)<(7*24*60*60*1000),
          };
          b.image = getThumbnailUrl(b);
          fetched.push(b);
        });
        setStats({totalBooks:fetched.length,thisMonth:mC,thisWeek:wC,today:dC});
        setBooks(fetched);
      } catch(err){console.error(err);}
      finally{setLoading(false);}
    };
    fetchBooks();
  }, []);

  const filterBooks = arr => {
    const now = new Date();
    if (filterBy==='today')      { const d=new Date(now);d.setHours(0,0,0,0);return arr.filter(b=>b.createdAt>=d); }
    if (filterBy==='this-week')  { const w=new Date(now);w.setDate(now.getDate()-now.getDay());return arr.filter(b=>b.createdAt>=w); }
    if (filterBy==='this-month') return arr.filter(b=>b.createdAt>=new Date(now.getFullYear(),now.getMonth(),1));
    return arr;
  };
  const searchBooks = arr => {
    if (!searchQuery) return arr;
    const q=searchQuery.toLowerCase();
    return arr.filter(b=>b.title?.toLowerCase().includes(q)||b.author?.toLowerCase().includes(q)||b.category?.toLowerCase().includes(q));
  };
  const sortBooks = arr => {
    const s=[...arr];
    if (sortBy==='popular')    return s.sort((a,b)=>(b.views+b.purchases*10)-(a.views+a.purchases*10));
    if (sortBy==='price-low')  return s.sort((a,b)=>a.price-b.price);
    if (sortBy==='price-high') return s.sort((a,b)=>b.price-a.price);
    if (sortBy==='title')      return s.sort((a,b)=>a.title?.localeCompare(b.title));
    return s.sort((a,b)=>b.createdAt-a.createdAt);
  };
  const displayBooks = sortBooks(searchBooks(filterBooks(books)));

  const S = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      .ld-root { font-family:'Lato',sans-serif; background:${BG}; min-height:100vh; }
      .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
      .sbar-none::-webkit-scrollbar { display:none; }

      /* HERO */
      .hero-wrap {
        background-color:${NAVY};
        background-image:radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px),
                         radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px);
        background-size:28px 28px,14px 14px;
        background-position:0 0,7px 7px;
        position:relative; overflow:hidden;
      }
      .hero-inner { max-width:1100px; margin:0 auto; padding:32px 16px 0; }

      /* STAT GRID — 2×2 on mobile */
      .stat-grid {
        display:grid;
        grid-template-columns:1fr 1fr;
        border-top:0.5px solid rgba(184,150,62,.15);
        margin-top:24px;
      }
      .stat-cell {
        padding:16px 10px;
        text-align:center;
        border-right:0.5px solid rgba(184,150,62,.1);
        border-bottom:0.5px solid rgba(184,150,62,.08);
      }
      /* remove right border from every 2nd cell (even columns) */
      .stat-cell:nth-child(2n) { border-right:none; }
      /* remove bottom border from last two cells */
      .stat-cell:nth-child(n+3) { border-bottom:none; }

      /* MAIN */
      .page-inner { max-width:1100px; margin:0 auto; padding:16px 14px 80px; }

      /* FILTER CARD */
      .filter-card { background:#fff; border:0.5px solid #e5ddd0; padding:12px 12px 10px; margin-bottom:14px; }

      /* SEARCH */
      .srch-wrap { position:relative; margin-bottom:10px; }
      .srch-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
      .srch-input {
        width:100%; padding:9px 32px 9px 32px;
        font-family:'Lato',sans-serif; font-size:13px;
        background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY};
        outline:none; transition:border-color .15s;
      }
      .srch-input:focus { border-color:${GOLD}; }
      .srch-input::placeholder { color:#bbb; }
      .srch-clear {
        position:absolute; right:9px; top:50%; transform:translateY(-50%);
        background:none; border:none; cursor:pointer; color:#aaa; display:flex;
      }

      /* FILTER PILLS — scroll horizontally, never wrap */
      .pill-row {
        display:flex; gap:5px;
        overflow-x:auto; flex-wrap:nowrap;
        padding-bottom:2px; margin-bottom:10px;
      }
      .pill-row::-webkit-scrollbar { display:none; }
      .f-pill {
        display:inline-flex; align-items:center; gap:4px;
        padding:5px 11px; font-size:9px; font-weight:700;
        letter-spacing:.1em; text-transform:uppercase;
        font-family:'Lato',sans-serif;
        border:0.5px solid #e5ddd0; background:transparent;
        cursor:pointer; transition:all .15s;
        white-space:nowrap; flex-shrink:0;
      }
      .f-pill.on { background:${NAVY}; color:#fff; border-color:${NAVY}; }
      .f-pill:not(.on):hover { border-color:${NAVY}; color:${NAVY}; }

      /* SORT ROW */
      .sort-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .res-lbl {
        font-family:'Lato',sans-serif; font-size:10px; font-weight:700;
        letter-spacing:.08em; text-transform:uppercase; color:#aaa;
      }
      .sort-sel {
        font-family:'Lato',sans-serif; font-size:10px; font-weight:700;
        background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY};
        padding:6px 10px; cursor:pointer; outline:none;
        transition:border-color .15s; max-width:150px;
      }
      .sort-sel:focus { border-color:${GOLD}; }

      /* BOOK GRID — 2 col mobile-first */
      .books-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }

      /* BOOK CARD */
      .bk-card {
        display:block; background:#fff;
        border:0.5px solid #e5ddd0; text-decoration:none;
        transition:transform .22s,box-shadow .22s,border-color .22s;
        overflow:hidden;
      }
      .bk-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(13,34,68,.1); border-color:${GOLD}; }
      .bk-cover { position:relative; overflow:hidden; }
      .bk-img {
        width:100%; aspect-ratio:2/3; object-fit:cover; display:block;
        transition:transform .5s cubic-bezier(.4,0,.2,1);
      }
      .bk-card:hover .bk-img { transform:scale(1.05); }
      .bk-info { padding:8px 8px 10px; border-top:0.5px solid #f0ebe0; }
      .bk-title {
        font-family:'Playfair Display',serif; font-size:11px; font-weight:700;
        color:${NAVY}; margin:0 0 2px;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
        overflow:hidden; line-height:1.3;
      }
      .bk-author {
        font-size:9px; color:#aaa; font-family:'Lato',sans-serif;
        margin:0 0 5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      .bk-price { font-family:'Playfair Display',serif; font-weight:700; font-size:12px; color:${NAVY}; }
      .bk-cat {
        font-size:8px; font-weight:700; letter-spacing:.08em;
        text-transform:uppercase; color:${GOLD}; font-family:'Lato',sans-serif;
        display:block; margin-top:3px;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }

      /* BADGE helpers */
      .badge-pdf {
        position:absolute; top:6px; left:6px;
        background:${NAVY}; color:#fff;
        font-size:8px; font-weight:700; padding:2px 6px;
        font-family:'Lato',sans-serif; letter-spacing:.06em;
        display:flex; align-items:center; gap:3px;
      }
      .badge-new {
        position:absolute; top:6px; right:6px;
        background:${GOLD}; color:${NAVY};
        font-size:8px; font-weight:700; padding:2px 6px;
        font-family:'Lato',sans-serif; letter-spacing:.06em;
        display:flex; align-items:center; gap:2px;
      }
      .badge-sold {
        position:absolute; bottom:6px; right:6px;
        background:rgba(13,34,68,.82); color:#fff;
        font-size:8px; padding:2px 6px;
        font-family:'Lato',sans-serif;
        display:flex; align-items:center; gap:3px;
      }

      /* EMPTY */
      .empty-box { text-align:center; padding:60px 20px; background:#fff; border:0.5px solid #e5ddd0; }

      /* BACK BTN */
      .back-btn {
        display:inline-flex; align-items:center; gap:6px;
        background:none; border:none; cursor:pointer;
        color:rgba(245,240,232,.5); font-family:'Lato',sans-serif;
        font-size:10px; font-weight:700; letter-spacing:.08em;
        text-transform:uppercase; margin-bottom:20px; padding:0;
        transition:color .15s;
      }
      .back-btn:hover { color:${GOLDD}; }

      /* ANIMATIONS */
      @keyframes spin { to{transform:rotate(360deg)} }
      @keyframes slideUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
      .anim-up { animation:slideUp .5s cubic-bezier(.4,0,.2,1) both; }

      /* DESKTOP OVERRIDES */
      @media(min-width:600px) {
        .books-grid { grid-template-columns:repeat(3,1fr); gap:12px; }
        .bk-title { font-size:12px; }
        .bk-info  { padding:10px 10px 12px; }
      }
      @media(min-width:900px) {
        .books-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; }
        .stat-grid  { grid-template-columns:repeat(4,1fr); }
        /* on desktop, all cells in a single row — remove bottom borders, restore right borders */
        .stat-cell  { border-bottom:none !important; }
        .stat-cell:nth-child(2n) { border-right:0.5px solid rgba(184,150,62,.1) !important; }
        .stat-cell:last-child    { border-right:none !important; }
        .hero-inner { padding:52px 24px 0; }
        .page-inner { padding:28px 24px 80px; }
        .filter-card { padding:16px 20px 14px; }
      }
    `}</style>
  );

  /* LOADING */
  if (loading) return (
    <div className="ld-root" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <S/>
      <Navbar/>
      <div style={{textAlign:"center",paddingTop:"120px"}}>
        <div style={{width:"44px",height:"44px",border:`3px solid ${GOLD}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 14px"}}/>
        <p style={{fontFamily:"'Lato',sans-serif",fontSize:"10px",color:"#888",letterSpacing:".08em",textTransform:"uppercase"}}>Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="ld-root">
      <S/>
      <Navbar/>

      {/* ══ HERO ══ */}
      <div className="hero-wrap">
        <div style={{position:"absolute",bottom:"-10px",right:"10px",fontSize:"clamp(50px,14vw,110px)",fontFamily:"'Playfair Display',serif",fontWeight:900,color:"rgba(255,255,255,.03)",pointerEvents:"none",userSelect:"none",lineHeight:1}}>LAN</div>

        <div className="hero-inner">
          <button onClick={()=>router.back()} className="back-btn"><ArrowLeft size={13}/>Back</button>

          <div style={{textAlign:"center",marginBottom:"24px"}}>
            {/* badge */}
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(184,150,62,.14)",border:"1px solid rgba(184,150,62,.3)",borderRadius:"999px",padding:"5px 14px",marginBottom:"14px"}}>
              <Sparkles size={10} style={{color:GOLD}}/>
              <span style={{fontSize:"9px",fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:GOLDD,fontFamily:"'Lato',sans-serif"}}>Fresh & New</span>
            </div>
            <h1 className="anim-up" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,6vw,58px)",fontWeight:900,color:"#fff",margin:"0 0 10px",lineHeight:1.05}}>
              Recently Published
            </h1>
            <p style={{fontSize:"clamp(11px,2vw,14px)",color:"rgba(245,240,232,.5)",fontFamily:"'Lato',sans-serif",fontWeight:300,maxWidth:"460px",margin:"0 auto",lineHeight:1.6}}>
              Discover the newest additions to our library. Stay updated with fresh content.
            </p>
          </div>

          {/* stat grid: 2×2 mobile → 1×4 desktop */}
          <div className="stat-grid">
            {[
              {val:stats.totalBooks,label:"All 2026",  Icon:Calendar,  clr:"#fde68a"},
              {val:stats.thisMonth, label:"This Month",Icon:Flame,     clr:"#fca5a5"},
              {val:stats.thisWeek,  label:"This Week", Icon:TrendingUp,clr:"#86efac"},
              {val:stats.today,     label:"Today",     Icon:Clock,     clr:"#93c5fd"},
            ].map(({val,label,Icon,clr})=>(
              <div key={label} className="stat-cell">
                <Icon size={16} style={{color:clr,display:"block",margin:"0 auto 6px"}}/>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,28px)",fontWeight:700,color:"#fff",display:"block"}}>{val}</span>
                <span style={{fontFamily:"'Lato',sans-serif",fontSize:"9px",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(184,150,62,.7)",marginTop:"3px",display:"block"}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="page-inner">

        {/* Filter card */}
        <div className="filter-card">
          {/* Search */}
          <div className="srch-wrap">
            <Search size={12} className="srch-icon"/>
            <input type="text" placeholder="Search by title, author, or category…"
              value={searchQuery} onChange={e=>setSearch(e.target.value)} className="srch-input"/>
            {searchQuery && <button onClick={()=>setSearch("")} className="srch-clear"><X size={11}/></button>}
          </div>

          {/* Time pills — horizontal scroll, no wrap */}
          <div className="pill-row sbar-none">
            {[
              {value:'all',       label:'All 2026',  Icon:Calendar},
              {value:'this-month',label:'This Month',Icon:Flame},
              {value:'this-week', label:'This Week', Icon:TrendingUp},
              {value:'today',     label:'Today',     Icon:Clock},
            ].map(({value,label,Icon})=>(
              <button key={value} onClick={()=>setFilterBy(value)} className={`f-pill${filterBy===value?" on":""}`}>
                <Icon size={8}/>{label}
              </button>
            ))}
          </div>

          {/* Results count + sort */}
          <div className="sort-row">
            <span className="res-lbl">{displayBooks.length} result{displayBooks.length!==1?"s":""}</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="sort-sel">
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Books */}
        {displayBooks.length > 0 ? (
          <div className="books-grid">
            {displayBooks.map(book=>(
              <a key={book.id} href={`/book/preview?id=${String(book.id).replace("firestore-","")}`} className="bk-card">
                <div className="bk-cover">
                  <img src={book.image} alt={book.title} className="bk-img"
                    onError={e=>{e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400';}}
                    loading="lazy"/>
                  <div className="badge-pdf">
                    <span style={{width:"4px",height:"4px",borderRadius:"50%",background:"#22c55e",display:"inline-block",flexShrink:0}}/>PDF
                  </div>
                  {book.isNew && <div className="badge-new"><Sparkles size={7}/>NEW</div>}
                  {book.purchases>0 && <span className="badge-sold"><ShoppingBag size={7}/>{book.purchases}</span>}
                </div>
                <div className="bk-info">
                  <h4 className="bk-title">{book.title}</h4>
                  <p className="bk-author">{book.author}</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span className="bk-price">₦{book.price?.toLocaleString()}</span>
                    <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                      <Star size={8} style={{color:GOLD,fill:GOLD}}/>
                      <span style={{fontSize:"8px",color:"#aaa",fontFamily:"'Lato',sans-serif"}}>{book.rating}</span>
                    </div>
                  </div>
                  {book.category && <span className="bk-cat">{book.category}</span>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-box">
            <div style={{width:"52px",height:"52px",border:"2px solid #e5ddd0",transform:"rotate(45deg)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
              <BookOpen size={20} style={{color:"#e5ddd0",transform:"rotate(-45deg)"}}/>
            </div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",color:NAVY,marginBottom:"8px"}}>No Books Found</h3>
            <p style={{fontSize:"12px",color:"#bbb",fontFamily:"'Lato',sans-serif",marginBottom:"18px"}}>
              {searchQuery?`No results for "${searchQuery}"`:"No books for the selected period."}
            </p>
            <button onClick={()=>{setFilterBy('all');setSearch('');}}
              style={{background:NAVY,color:"#fff",padding:"9px 20px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",fontFamily:"'Lato',sans-serif"}}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}