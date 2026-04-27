"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc,
  query, where, updateDoc, increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import {
  ArrowLeft, Search, X, ShoppingBag, BookOpen, GraduationCap,
  UserPlus, UserCheck, Users, Building2, Grid3X3, LayoutList,
  Star, Sparkles, TrendingUp, ChevronRight, BookMarked,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/NavBar";

/* ─── design tokens ─────────────────────────────────────── */
const NAVY  = "#0d2244";
const GOLD  = "#b8963e";
const GOLDD = "#d4aa5a";
const CREAM = "#f5f0e8";
const BG    = "#f5f1ea";

/* ─── thumbnail ─────────────────────────────────────────── */
const getThumbnailUrl = (book) => {
  if (!book) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
  if (book.driveFileId) return `https://drive.google.com/thumbnail?id=${book.driveFileId}&sz=w400`;
  if (book.embedUrl) {
    const m = book.embedUrl.match(/\/d\/(.*?)\/|\/file\/d\/(.*?)\/|id=(.*?)(&|$)/);
    if (m) { const id = m[1]||m[2]||m[3]; if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`; }
  }
  if (book.pdfUrl?.includes("drive.google.com")) {
    const m = book.pdfUrl.match(/[-\w]{25,}/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w400`;
  }
  return book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";
};

const isLecturer = (title) => {
  const t = (title || "").toLowerCase();
  return ["lecturer","dr.","prof.","professor","mrs","mr"].includes(t);
};

/* ═══════════════════════════════════════════════════════════
   BOOK CARD — editorial cover style
═══════════════════════════════════════════════════════════ */
function BookCard({ book, isPurchased, view }) {
  const href = `/book/preview?id=${String(book.id).replace("firestore-", "")}`;
  const owned = isPurchased(book.id);

  if (view === "list") {
    return (
      <Link href={href} style={{ display:"flex", alignItems:"center", gap:"14px", background:"#fff", border:`0.5px solid #e5ddd0`, padding:"12px 14px", textDecoration:"none", transition:"border-color .18s, box-shadow .18s" }}
        className="book-list-row">
        <img src={book.image} alt={book.title}
          style={{ width:"44px", height:"60px", objectFit:"cover", flexShrink:0, display:"block" }}
          onError={e => { e.target.src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
        <div style={{ flex:1, minWidth:0 }}>
          <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:"13px", fontWeight:700, color:NAVY, margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{book.title}</h4>
          <p style={{ fontSize:"11px", color:"#aaa", margin:"0 0 5px", textTransform:"capitalize", fontFamily:"'Lato',sans-serif" }}>{book.category}</p>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            {owned && <span style={{ fontSize:"9px", fontWeight:700, background:"#dcfce7", color:"#15803d", padding:"2px 7px", fontFamily:"'Lato',sans-serif", letterSpacing:".06em", textTransform:"uppercase" }}>Owned</span>}
            {book.soldCount > 0 && <span style={{ fontSize:"10px", color:"#aaa", display:"flex", alignItems:"center", gap:"3px", fontFamily:"'Lato',sans-serif" }}><ShoppingBag size={9}/>{book.soldCount} sold</span>}
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right" }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:NAVY, margin:0 }}>₦{book.price?.toLocaleString()}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} style={{ textDecoration:"none", display:"block", background:"#fff", border:`0.5px solid #e5ddd0`, transition:"transform .22s, box-shadow .22s, border-color .22s" }} className="book-grid-card">
      <div style={{ position:"relative" }}>
        <img src={book.image} alt={book.title}
          style={{ width:"100%", aspectRatio:"2/3", objectFit:"cover", display:"block", transition:"transform .5s cubic-bezier(.4,0,.2,1)" }}
          className="book-grid-img"
          onError={e => { e.target.src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"; }} />
        {/* PDF badge */}
        <div style={{ position:"absolute", top:"8px", left:"8px", background:NAVY, color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif", letterSpacing:".06em", display:"flex", alignItems:"center", gap:"4px" }}>
          <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>PDF
        </div>
        {owned && <span style={{ position:"absolute", top:"8px", right:"8px", background:"#16a34a", color:"#fff", fontSize:"9px", fontWeight:700, padding:"3px 7px", fontFamily:"'Lato',sans-serif" }}>OWNED</span>}
        {book.soldCount > 0 && (
          <span style={{ position:"absolute", bottom:"8px", right:"8px", background:"rgba(13,34,68,.85)", color:"#fff", fontSize:"9px", padding:"3px 7px", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", gap:"3px" }}>
            <ShoppingBag size={8}/>{book.soldCount}
          </span>
        )}
      </div>
      <div style={{ padding:"10px 10px 12px", borderTop:`0.5px solid #f0ebe0` }}>
        <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:"12px", fontWeight:700, color:NAVY, margin:"0 0 3px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.35 }}>{book.title}</h4>
        <p style={{ fontSize:"10px", color:"#aaa", margin:"0 0 6px", textTransform:"capitalize", fontFamily:"'Lato',sans-serif" }}>{book.category}</p>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:NAVY, margin:0 }}>₦{book.price?.toLocaleString()}</p>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function SellerProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sellerId = searchParams.get("sellerId");

  const [seller, setSeller]             = useState(null);
  const [sellerPhoto, setSellerPhoto]   = useState(null);
  const [sellerBooks, setSellerBooks]   = useState([]);
  const [filteredBooks, setFiltered]    = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearch]        = useState("");
  const [selectedCategory, setCategory]= useState("all");
  const [purchasedBookIds, setPurchased]= useState(new Set());
  const [isFollowing, setFollowing]     = useState(false);
  const [followerCount, setFollowers]   = useState(0);
  const [activeTab, setActiveTab]       = useState("materials");
  const [view, setView]                 = useState("grid");
  const [followLoading, setFollowLoad]  = useState(false);
  const [stats, setStats]               = useState({ totalSold:0, totalEarnings:0, totalBooks:0 });
  const user = auth.currentUser;

  /* follow check */
  useEffect(() => {
    const check = async () => {
      if (!user || !sellerId) return;
      const fd = await getDoc(doc(db, "follows", `${user.uid}_${sellerId}`));
      setFollowing(fd.exists());
      const q = query(collection(db, "follows"), where("lecturerId","==",sellerId));
      setFollowers((await getDocs(q)).size);
    };
    check();
  }, [user, sellerId]);

  /* toggle follow */
  const toggleFollow = async () => {
    if (!user) { alert("Please sign in to follow"); return; }
    if (followLoading) return;
    setFollowLoad(true);
    const followRef = doc(db,"follows",`${user.uid}_${sellerId}`);
    const sellerRef = doc(db,"sellers",sellerId);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        try { await updateDoc(sellerRef,{followersCount:increment(-1)}); } catch {}
        setFollowing(false); setFollowers(p=>Math.max(0,p-1));
      } else {
        await setDoc(followRef,{followerId:user.uid,lecturerId:sellerId,lecturerName:seller?.sellerName||"",createdAt:new Date()});
        try { await updateDoc(sellerRef,{followersCount:increment(1)}); } catch { await setDoc(sellerRef,{followersCount:1},{merge:true}); }
        setFollowing(true); setFollowers(p=>p+1);
      }
    } catch(err){console.error(err);} finally{setFollowLoad(false);}
  };

  /* fetch data */
  useEffect(()=>{
    const fetchSellerData=async()=>{
      if(!sellerId){router.push("/");return;}
      try{
        setLoading(true);
        let sellerName="Unknown",sellerTitle="",sellerDept="",sellerUni="",photo=null;
        const sd=await getDoc(doc(db,"sellers",sellerId));
        if(sd.exists()){const d=sd.data();sellerName=d.sellerName||d.displayName||sellerName;sellerTitle=d.title||"";sellerDept=d.department||"";sellerUni=d.university||"";}
        const ud=await getDoc(doc(db,"users",sellerId));
        if(ud.exists()){const u=ud.data();if(!sellerName||sellerName==="Unknown")sellerName=u.displayName||`${u.firstName||""} ${u.surname||""}`.trim()||sellerName;photo=u.photoBase64||u.photoURL||u.profilePicture||null;if(!sellerDept)sellerDept=u.department||"";if(!sellerUni)sellerUni=u.university||"";}
        setSellerPhoto(photo);
        const advertSnap=await getDocs(collection(db,"advertMyBook"));
        const books=[];
        advertSnap.forEach(ds=>{
          const data=ds.data();
          if((data.userId===sellerId||data.sellerId===sellerId)&&data.status==="approved"){
            const b={id:`firestore-${ds.id}`,firestoreId:ds.id,title:data.bookTitle||data.title,author:data.author||"Unknown",category:(data.category||"General").toLowerCase(),price:Number(data.price)||0,pages:data.pages||0,format:data.format||"PDF",description:data.description||"",driveFileId:data.driveFileId,pdfUrl:data.pdfUrl||data.pdfLink,embedUrl:data.embedUrl,status:data.status||"pending",isFromFirestore:true};
            b.image=getThumbnailUrl(b);books.push(b);
          }
        });
        let totalSold=0,totalEarnings=0;const salesMap={};
        const usersSnap=await getDocs(collection(db,"users"));
        usersSnap.docs.forEach(ud=>{Object.values(ud.data().purchasedBooks||{}).forEach(p=>{if(p.sellerId===sellerId){totalSold++;totalEarnings+=p.amount||0;const t=p.title||"Untitled";salesMap[t]=(salesMap[t]||0)+1;}});});
        books.forEach(b=>{b.soldCount=salesMap[b.title]||0;});
        const cu=auth.currentUser;
        if(cu){const md=await getDoc(doc(db,"users",cu.uid));if(md.exists()){const ids=new Set();Object.values(md.data().purchasedBooks||{}).forEach(p=>{const id=p.bookId||p.id||p.firestoreId;if(id){ids.add(id);ids.add(`firestore-${id}`);}});setPurchased(ids);}}
        setSeller({sellerId,sellerName,sellerTitle,sellerDept,sellerUni});
        setSellerBooks(books);setFiltered(books);
        setStats({totalSold,totalEarnings,totalBooks:books.length});
      }catch(err){console.error(err);}finally{setLoading(false);}
    };
    fetchSellerData();
  },[sellerId,router]);

  /* filter */
  useEffect(()=>{
    const q=searchQuery.toLowerCase();
    setFiltered(sellerBooks.filter(b=>{
      const ms=!q||b.title?.toLowerCase().includes(q)||b.category?.toLowerCase().includes(q);
      const mc=selectedCategory==="all"||b.category===selectedCategory;
      return ms&&mc;
    }));
  },[searchQuery,selectedCategory,sellerBooks]);

  const categories=[{value:"all",label:"All"},...Array.from(new Set(sellerBooks.map(b=>b.category))).filter(Boolean).map(c=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))];
  const isPurchased=id=>purchasedBookIds.has(id)||purchasedBookIds.has(String(id));
  const lecturerMode=isLecturer(seller?.sellerTitle);
  const displayTitle=seller?(lecturerMode?`${seller.sellerTitle} ${seller.sellerName}`:seller.sellerName):"Profile";

  /* global styles */
  const S = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
      .lan-root  { font-family:'Lato',sans-serif; background:${BG}; }
      .lan-serif { font-family:'Playfair Display',Georgia,serif; }
      .sbar-none { scrollbar-width:none; -ms-overflow-style:none; }
      .sbar-none::-webkit-scrollbar { display:none; }
      .book-list-row:hover  { border-color:${GOLD}!important; box-shadow:0 4px 16px rgba(13,34,68,.08); }
      .book-grid-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(13,34,68,.12); border-color:${GOLD}!important; }
      .book-grid-card:hover .book-grid-img { transform:scale(1.05); }
      .lan-tab { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:10px 22px; border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:'Lato',sans-serif; background:transparent; transition:all .18s; }
      .lan-tab-active  { color:${GOLD}; border-bottom-color:${GOLD}; }
      .lan-tab-inactive{ color:#888; }
      .lan-tab-inactive:hover { color:${NAVY}; }
      .search-input { font-family:'Lato',sans-serif; font-size:13px; outline:none; background:${BG}; border:0.5px solid #e5ddd0; color:${NAVY}; width:100%; padding:9px 12px 9px 34px; box-sizing:border-box; }
      .search-input:focus  { border-color:${GOLD}; }
      .search-input::placeholder { color:#aaa; }
      .cat-pill { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 14px; border:0.5px solid #e5ddd0; cursor:pointer; font-family:'Lato',sans-serif; transition:all .15s; background:transparent; }
      .cat-pill.active { background:${NAVY}; color:#fff; border-color:${NAVY}; }
      .cat-pill:not(.active):hover { border-color:${NAVY}; color:${NAVY}; }
      .view-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:0.5px solid #e5ddd0; background:transparent; cursor:pointer; transition:all .15s; }
      .view-btn.active { background:${NAVY}; border-color:${NAVY}; color:#fff; }
      .view-btn:not(.active):hover { border-color:${NAVY}; }
      .follow-btn { display:flex; align-items:center; gap:6px; padding:10px 22px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-family:'Lato',sans-serif; border:none; cursor:pointer; transition:all .18s; }
      .follow-btn.following { background:${GOLD};; color:${NAVY}; }
      .follow-btn.following:hover  { background:${GOLDD}; }
      .follow-btn.not-following { background:${GOLD}; color:${NAVY}; }
      .follow-btn.not-following:hover { background:${GOLDD}; }
      .stat-row:not(:last-child) { border-bottom:0.5px solid #f0ebe0; }
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      .anim-up { animation:slideUp .5s cubic-bezier(.4,0,.2,1) both; }
    `}</style>
  );

  /* loading */
  if (loading) return (
    <div className="lan-root" style={{ minHeight:"100vh" }}>
      <S/>
      <Navbar/>
      <div style={{ background:NAVY, height:"240px", position:"relative", overflow:"hidden",
        backgroundImage:`radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px)`, backgroundSize:"28px 28px" }}>
        <div style={{ position:"absolute", bottom:"20px", left:"24px", display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(255,255,255,.12)" }}/>
        </div>
      </div>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"24px", display:"grid", gridTemplateColumns:"280px 1fr", gap:"20px" }}>
        {[1,2].map(i=>(
          <div key={i} style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
            {[80,60,40].map(w=>(
              <div key={w} style={{ height:"12px", background:"#f0ebe0", marginBottom:"12px", width:`${w}%`, animation:"pulse 1.5s infinite" }}/>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );

  if (!seller) return (
    <div className="lan-root" style={{ minHeight:"100vh" }}>
      <S/><Navbar/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
        <div style={{ width:"64px", height:"64px", border:`2px solid #e5ddd0`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <BookOpen size={24} style={{ color:"#e5ddd0", transform:"rotate(-45deg)" }}/>
        </div>
        <h2 className="lan-serif" style={{ fontSize:"24px", color:NAVY, marginBottom:"8px" }}>Profile Not Found</h2>
        <button onClick={()=>router.push("/")}
          style={{ marginTop:"16px", background:NAVY, color:"#fff", padding:"10px 24px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="lan-root" style={{ minHeight:"100vh" }}>
      <S/>
      <Navbar/>

      {/* ── STICKY BACK BAR ── */}
      <div style={{ background:"#fff", borderBottom:`0.5px solid #e5ddd0`, position:"sticky", top:0, zIndex:40 }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"0 24px", height:"48px", display:"flex", alignItems:"center", gap:"12px" }}>
          <button onClick={()=>router.back()} style={{ background:"none", border:"none", cursor:"pointer", color:"#888", display:"flex", alignItems:"center" }}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <p style={{ fontSize:"13px", fontWeight:700, color:NAVY, margin:0, fontFamily:"'Playfair Display',serif" }}>{displayTitle}</p>
            <p style={{ fontSize:"10px", color:"#aaa", margin:0, fontFamily:"'Lato',sans-serif" }}>{stats.totalBooks} materials · {followerCount} followers</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PROFILE HERO — navy dot-grid
      ══════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor:NAVY,
        backgroundImage:`radial-gradient(rgba(184,150,62,.07) 1px,transparent 1px),radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)`,
        backgroundSize:"28px 28px, 14px 14px",
        backgroundPosition:"0 0, 7px 7px",
        position:"relative", overflow:"hidden",
      }}>
        {/* LAN watermark */}
        <div style={{ position:"absolute", bottom:"-10px", right:"20px", fontSize:"100px", fontFamily:"'Playfair Display',serif", fontWeight:900, color:"rgba(255,255,255,.04)", pointerEvents:"none", userSelect:"none" }}>LAN</div>

        {/* Title badge */}
        {lecturerMode && (
          <div style={{ position:"absolute", top:"16px", left:"24px", display:"inline-flex", alignItems:"center", gap:"7px", background:"rgba(184,150,62,.14)", border:`1px solid rgba(184,150,62,.3)`, borderRadius:"999px", padding:"6px 14px" }}>
            <GraduationCap size={11} style={{ color:GOLD }}/>
            <span style={{ fontSize:"10px", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:GOLDD, fontFamily:"'Lato',sans-serif" }}>{seller.sellerTitle}</span>
          </div>
        )}

        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"60px 24px 0" }}>
          {/* Avatar row */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:"20px", flexWrap:"wrap" }}>
            {/* Avatar */}
            <div style={{ width:"110px", height:"110px", flexShrink:0, position:"relative", bottom:"-28px" }}>
              {sellerPhoto ? (
                <img src={sellerPhoto} alt={seller.sellerName}
                  style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover", border:`3px solid ${GOLD}`, display:"block" }}/>
              ) : (
                <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:`3px solid ${GOLD}`, background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {lecturerMode
                    ? <GraduationCap size={40} style={{ color:GOLD }}/>
                    : <span style={{ color:GOLD, fontSize:"36px", fontFamily:"'Playfair Display',serif", fontWeight:900 }}>{seller.sellerName?.charAt(0)?.toUpperCase()||"?"}</span>}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div style={{ paddingBottom:"32px", flex:1 }}>
              <h1 className="lan-serif anim-up" style={{ fontSize:"clamp(22px,4vw,38px)", fontWeight:900, color:"#fff", margin:"0 0 6px", lineHeight:1.05 }}>
                {displayTitle}
                {seller.sellerTitle && !lecturerMode && <span style={{ color:GOLD, fontStyle:"italic" }}> ·</span>}
              </h1>
              <p style={{ fontSize:"13px", color:"rgba(245,240,232,.6)", margin:0, fontFamily:"'Lato',sans-serif", fontWeight:300 }}>
                {stats.totalBooks} materials &nbsp;·&nbsp; {followerCount} followers
              </p>
            </div>

            {/* Follow button */}
            <div style={{ paddingBottom:"32px" }}>
              <button onClick={toggleFollow} disabled={followLoading}
                className={`follow-btn ${isFollowing?"following":"not-following"}`}>
                {isFollowing ? <UserCheck size={13}/> : <UserPlus size={13}/>}
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          </div>

          {/* stat strip */}
          <div style={{ borderTop:`0.5px solid rgba(184,150,62,.15)`, display:"flex", flexWrap:"wrap", marginTop:"28px" }}>
            {[
              { val:stats.totalBooks,  label:"Materials" },
              { val:stats.totalSold,   label:"Sold"      },
              { val:followerCount,     label:"Followers" },
            ].map(({val,label})=>(
              <div key={label} style={{ flex:"1 1 100px", padding:"16px 20px 0", borderRight:`0.5px solid rgba(184,150,62,.1)` }}>
                <div className="lan-serif" style={{ fontSize:"22px", fontWeight:700, color:"#fff" }}>{val}</div>
                <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(184,150,62,.7)", marginTop:"2px", fontFamily:"'Lato',sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="sbar-none" style={{ display:"flex", marginTop:"20px", gap:"0", borderTop:`0.5px solid rgba(184,150,62,.15)`, paddingTop:"4px" }}>
            {[{id:"materials",label:lecturerMode?"Materials":"Books"},{id:"about",label:"About"}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`lan-tab ${activeTab===tab.id?"lan-tab-active":"lan-tab-inactive"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"32px 24px 80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:"24px", alignItems:"start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {/* About card */}
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
              <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>About</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {seller.sellerTitle && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <GraduationCap size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:NAVY, fontFamily:"'Lato',sans-serif", fontWeight:700 }}>{seller.sellerTitle}</span>
                  </div>
                )}
                {seller.sellerDept && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <BookMarked size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerDept}</span>
                  </div>
                )}
                {seller.sellerUni && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <Building2 size={14} style={{ color:GOLD, flexShrink:0 }}/>
                    <span style={{ fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>{seller.sellerUni}</span>
                  </div>
                )}
                {!seller.sellerDept && !seller.sellerUni && !seller.sellerTitle && (
                  <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>No additional info provided.</p>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"24px" }}>
              <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"14px", fontFamily:"'Lato',sans-serif" }}>Stats</p>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {[
                  { label:"Total Materials", value:stats.totalBooks,  Icon:BookOpen   },
                  { label:"Total Sold",      value:stats.totalSold,   Icon:ShoppingBag },
                  { label:"Followers",       value:followerCount,     Icon:Users      },
                ].map(({label,value,Icon})=>(
                  <div key={label} className="stat-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:"#666", fontFamily:"'Lato',sans-serif" }}>
                      <Icon size={13} style={{ color:GOLD }}/>{label}
                    </div>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:NAVY, fontSize:"14px" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN FEED ── */}
          {activeTab==="materials" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {/* Search + filter */}
              <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"16px 20px" }}>               
                <div style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search size={13} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"#bbb" }}/>
                    <input type="text" placeholder="Search materials…" value={searchQuery} onChange={e=>setSearch(e.target.value)} className="search-input"/>
                    {searchQuery && (
                      <button onClick={()=>setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
                        <X size={13}/>
                      </button>
                    )}
                  </div>
                  {/* View toggle */}
                  <div style={{ display:"flex", gap:"0" }}>
                    <button onClick={()=>setView("grid")} className={`view-btn ${view==="grid"?"active":""}`}><Grid3X3 size={14}/></button>
                    <button onClick={()=>setView("list")} className={`view-btn ${view==="list"?"active":""}`}><LayoutList size={14}/></button>
                  </div>
                </div>
                {/* Category pills */}
                <div className="sbar-none" style={{ display:"flex", gap:"6px", overflowX:"auto" }}>
                  {categories.map(cat=>(
                    <button key={cat.value} onClick={()=>setCategory(cat.value)} className={`cat-pill${selectedCategory===cat.value?" active":""}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"20px" }}>                
                <p style={{ fontSize:"10px", color:"#aaa", marginBottom:"16px", fontFamily:"'Lato',sans-serif", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase" }}>
                  {filteredBooks.length} result{filteredBooks.length!==1?"s":""}
                </p>

                {filteredBooks.length===0 ? (
                  <div style={{ textAlign:"center", padding:"64px 24px" }}>
                    <div style={{ width:"56px", height:"56px", border:`2px solid #e5ddd0`, transform:"rotate(45deg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                      <BookOpen size={20} style={{ color:"#e5ddd0", transform:"rotate(-45deg)" }}/>
                    </div>
                    <h3 className="lan-serif" style={{ fontSize:"18px", color:NAVY, marginBottom:"6px" }}>No results</h3>
                    <p style={{ fontSize:"12px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>
                      {searchQuery||selectedCategory!=="all"?"Clear your filters to see all materials.":"No materials uploaded yet."}
                    </p>
                    {(searchQuery||selectedCategory!=="all")&&(
                      <button onClick={()=>{setSearch("");setCategory("all");}}
                        style={{ marginTop:"12px", background:"none", border:`0.5px solid ${NAVY}`, color:NAVY, padding:"7px 18px", cursor:"pointer", fontSize:"11px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : view==="list" ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {filteredBooks.map(book=><BookCard key={book.id} book={book} isPurchased={isPurchased} view="list"/>)}
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:"14px" }}>
                    {filteredBooks.map(book=><BookCard key={book.id} book={book} isPurchased={isPurchased} view="grid"/>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ABOUT TAB ── */}
          {activeTab==="about" && (
            <div style={{ background:"#fff", border:`0.5px solid #e5ddd0`, padding:"32px" }}>              
              <p style={{ fontSize:"10px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:GOLD, marginBottom:"20px", fontFamily:"'Lato',sans-serif" }}>
                About {displayTitle}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
                {[
                  {label:"Title", value:seller.sellerTitle, Icon:GraduationCap},
                  {label:"Department", value:seller.sellerDept, Icon:BookMarked},
                  {label:"University", value:seller.sellerUni, Icon:Building2},
                ].filter(r=>r.value).map(({label,value,Icon})=>(
                  <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:"14px", padding:"18px 0", borderBottom:`0.5px solid #f0ebe0` }}>
                    <Icon size={16} style={{ color:GOLD, flexShrink:0, marginTop:"2px" }}/>
                    <div>
                      <p style={{ fontSize:"9px", fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"#aaa", margin:"0 0 4px", fontFamily:"'Lato',sans-serif" }}>{label}</p>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"15px", color:NAVY, margin:0 }}>{value}</p>
                    </div>
                  </div>
                ))}
                {!seller.sellerDept&&!seller.sellerUni&&!seller.sellerTitle&&(
                  <p style={{ fontSize:"13px", color:"#bbb", fontFamily:"'Lato',sans-serif" }}>No profile information added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}